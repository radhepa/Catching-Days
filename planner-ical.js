/* ═══════════════ Catching Days · calendar feed reader ═══════════════
   Reads an iCalendar (.ics) feed, the format behind Google Calendar's
   "Secret address in iCal format" (and Outlook, Apple, Brightspace, Canvas),
   and turns it into plain events inside a window of dates.

   Handles what real feeds actually contain: folded lines, escaped text,
   times in UTC / in a named zone / floating, all-day dates, repeating events
   (RRULE: daily, weekly, monthly, yearly, with INTERVAL, COUNT, UNTIL, BYDAY,
   BYMONTHDAY, BYMONTH, BYSETPOS), deleted occurrences (EXDATE), single
   occurrences that were moved or cancelled (RECURRENCE-ID), cancelled events
   and "free" events (TRANSP:TRANSPARENT).

   Repeats are worked out on the wall clock of the event's own zone, so a
   9:30 class stays at 9:30 across a daylight-saving change.

   No DOM, no network: runs the same in the browser (window.PlannerICal) and
   under node (module.exports), which is how it is tested. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PlannerICal = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DAY = 86400000;
  var WD = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  /* Outlook and Exchange name zones the Windows way */
  var WIN_ZONES = {
    'eastern standard time': 'America/New_York', 'us eastern standard time': 'America/Indiana/Indianapolis',
    'central standard time': 'America/Chicago', 'mountain standard time': 'America/Denver',
    'us mountain standard time': 'America/Phoenix', 'pacific standard time': 'America/Los_Angeles',
    'alaskan standard time': 'America/Anchorage', 'hawaiian standard time': 'Pacific/Honolulu',
    'atlantic standard time': 'America/Halifax', 'gmt standard time': 'Europe/London',
    'greenwich standard time': 'Atlantic/Reykjavik', 'w. europe standard time': 'Europe/Berlin',
    'central europe standard time': 'Europe/Budapest', 'romance standard time': 'Europe/Paris',
    'india standard time': 'Asia/Kolkata', 'china standard time': 'Asia/Shanghai',
    'tokyo standard time': 'Asia/Tokyo', 'aus eastern standard time': 'Australia/Sydney',
    'utc': 'UTC', 'coordinated universal time': 'UTC'
  };

  /* ── time zones ─────────────────────────────────────────────────────── */
  var fmtCache = {}, zoneOk = {};
  function validZone(tz) {
    if (!tz) return false;
    if (tz in zoneOk) return zoneOk[tz];
    try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); zoneOk[tz] = true; }
    catch (e) { zoneOk[tz] = false; }
    return zoneOk[tz];
  }
  /* "/mozilla.org/20050126_1/America/New_York", "Eastern Standard Time",
     "America/New_York" → an IANA name the browser knows, or null */
  function normZone(tz) {
    if (!tz) return null;
    tz = String(tz).trim().replace(/^"|"$/g, '');
    if (validZone(tz)) return tz;
    var w = WIN_ZONES[tz.toLowerCase()];
    if (w) return w;
    var m = /([A-Za-z_]+\/[A-Za-z_\-+0-9]+(?:\/[A-Za-z_\-+0-9]+)?)$/.exec(tz);
    if (m && validZone(m[1])) return m[1];
    return null;
  }
  function fmtFor(tz) {
    return fmtCache[tz] || (fmtCache[tz] = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }
  /* the wall clock in `tz` at instant `ts` */
  function wallOf(ts, tz) {
    var p = {};
    fmtFor(tz).formatToParts(ts).forEach(function (x) { p[x.type] = x.value; });
    return { y: +p.year, mo: +p.month, d: +p.day, h: (+p.hour) % 24, mi: +p.minute, s: +p.second };
  }
  function offsetAt(ts, tz) {
    var w = wallOf(ts, tz);
    return Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s) - Math.floor(ts / 1000) * 1000;
  }
  /* wall clock in `tz` → instant. In the spring-forward gap the time is
     pushed past the gap; in the fall-back hour the first one is used. */
  function zonedToEpoch(y, mo, d, h, mi, s, tz) {
    var guess = Date.UTC(y, mo - 1, d, h || 0, mi || 0, s || 0);
    if (!tz || tz === 'UTC') return guess;
    var off = offsetAt(guess, tz), t = guess - off, off2 = offsetAt(t, tz);
    if (off2 !== off) {
      var t2 = guess - off2;
      t = offsetAt(t2, tz) === off2 ? t2 : Math.max(t, t2);
    }
    return t;
  }

  /* ── civil dates as whole day numbers (days since 1970-01-01) ───────── */
  function dnOf(y, mo, d) { return Math.round(Date.UTC(y, mo - 1, d) / DAY); }
  function ymdOf(dn) { var t = new Date(dn * DAY); return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate() }; }
  function keyOf(dn) { var o = ymdOf(dn); return o.y + '-' + pad(o.mo) + '-' + pad(o.d); }
  function dnFromKey(k) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k || ''); return m ? dnOf(+m[1], +m[2], +m[3]) : null; }
  function wdOf(dn) { return ((dn % 7) + 7 + 4) % 7; }            // 1970-01-01 was a Thursday
  function daysInMonth(y, mo) { return new Date(Date.UTC(y, mo, 0)).getUTCDate(); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ── reading the text ───────────────────────────────────────────────── */
  function unfold(text) {
    return String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '');
  }
  function splitOutside(s, ch) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (c === '"') q = !q;
      if (c === ch && !q) { out.push(cur); cur = ''; } else cur += c;
    }
    out.push(cur);
    return out;
  }
  function parseLine(line) {
    var q = false, i = 0;
    for (; i < line.length; i++) { var c = line[i]; if (c === '"') q = !q; else if (c === ':' && !q) break; }
    var head = splitOutside(line.slice(0, i), ';'), params = {};
    head.slice(1).forEach(function (p) {
      var j = p.indexOf('=');
      if (j > 0) params[p.slice(0, j).toUpperCase()] = p.slice(j + 1).replace(/^"|"$/g, '');
    });
    return { name: head[0].toUpperCase(), params: params, value: line.slice(i + 1) };
  }
  function unescapeText(v) {
    return String(v || '').replace(/\\([\\;,nN])/g, function (m, c) { return c === 'n' || c === 'N' ? '\n' : c; });
  }

  /* a DATE or DATE-TIME value → {y,mo,d,h,mi,s,date,utc,tz} */
  function parseDT(value, params) {
    params = params || {};
    var v = String(value || '').trim();
    var m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(v);
    if (!m) return null;
    var dateOnly = !m[4] || params.VALUE === 'DATE';
    return {
      y: +m[1], mo: +m[2], d: +m[3],
      h: dateOnly ? 0 : +m[4], mi: dateOnly ? 0 : +m[5], s: dateOnly ? 0 : +(m[6] || 0),
      date: dateOnly, utc: !!m[7], tz: m[7] ? null : normZone(params.TZID)
    };
  }
  /* the instant a DATE-TIME names; floating times use `fallbackTz` */
  function dtEpoch(dt, fallbackTz) {
    if (dt.utc) return Date.UTC(dt.y, dt.mo - 1, dt.d, dt.h, dt.mi, dt.s);
    return zonedToEpoch(dt.y, dt.mo, dt.d, dt.h, dt.mi, dt.s, dt.tz || fallbackTz || 'UTC');
  }
  function parseDuration(v) {
    var m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(String(v || '').trim());
    if (!m) return null;
    var ms = ((+m[2] || 0) * 7 * DAY) + ((+m[3] || 0) * DAY) + ((+m[4] || 0) * 3600000) + ((+m[5] || 0) * 60000) + ((+m[6] || 0) * 1000);
    return m[1] === '-' ? -ms : ms;
  }

  /* the VEVENTs of a feed, each as a bag of its properties (nested blocks
     such as VALARM are skipped so their lines don't leak into the event) */
  function readEvents(text) {
    var lines = unfold(text).split('\n'), events = [], cal = { name: '', tz: null };
    var ev = null, depth = 0;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (!line) continue;
      var p = parseLine(line);
      if (p.name === 'BEGIN') {
        var what = p.value.trim().toUpperCase();
        if (what === 'VEVENT' && !ev) { ev = { props: {}, multi: {} }; depth = 0; }
        else if (ev) depth++;
        continue;
      }
      if (p.name === 'END') {
        var w2 = p.value.trim().toUpperCase();
        if (ev && w2 === 'VEVENT' && depth === 0) { events.push(ev); ev = null; }
        else if (ev && depth > 0) depth--;
        continue;
      }
      if (!ev) {
        if (p.name === 'X-WR-CALNAME' && !cal.name) cal.name = unescapeText(p.value);
        if (p.name === 'X-WR-TIMEZONE' && !cal.tz) cal.tz = normZone(p.value);
        continue;
      }
      if (depth > 0) continue;
      if (p.name === 'EXDATE' || p.name === 'RDATE') (ev.multi[p.name] = ev.multi[p.name] || []).push(p);
      else if (!(p.name in ev.props)) ev.props[p.name] = p;
    }
    return { cal: cal, events: events };
  }

  /* ── repeating events ───────────────────────────────────────────────── */
  function parseRule(v) {
    var r = {};
    String(v || '').split(';').forEach(function (kv) {
      var j = kv.indexOf('=');
      if (j > 0) r[kv.slice(0, j).trim().toUpperCase()] = kv.slice(j + 1).trim();
    });
    if (!r.FREQ) return null;
    var list = function (s) { return s ? s.split(',').map(function (x) { return parseInt(x, 10); }).filter(function (n) { return !isNaN(n); }) : null; };
    return {
      freq: r.FREQ.toUpperCase(),
      interval: Math.max(1, parseInt(r.INTERVAL, 10) || 1),
      count: r.COUNT ? parseInt(r.COUNT, 10) : null,
      until: r.UNTIL ? parseDT(r.UNTIL, {}) : null,
      byday: r.BYDAY ? r.BYDAY.split(',').map(function (x) {
        var m = /^([+-]?\d+)?(MO|TU|WE|TH|FR|SA|SU)$/i.exec(x.trim());
        return m ? { n: m[1] ? parseInt(m[1], 10) : 0, wd: WD[m[2].toUpperCase()] } : null;
      }).filter(Boolean) : null,
      bymonthday: list(r.BYMONTHDAY),
      bymonth: list(r.BYMONTH),
      bysetpos: list(r.BYSETPOS),
      wkst: r.WKST && WD[r.WKST.toUpperCase()] != null ? WD[r.WKST.toUpperCase()] : 1
    };
  }
  /* the n-th `wd` of a month (n<0 counts from the end), or every one (n=0) */
  function weekdaysInMonth(y, mo, wd, n) {
    var first = dnOf(y, mo, 1), last = first + daysInMonth(y, mo) - 1, all = [];
    for (var dn = first + ((wd - wdOf(first) + 7) % 7); dn <= last; dn += 7) all.push(dn);
    if (!n) return all;
    var pick = n > 0 ? all[n - 1] : all[all.length + n];
    return pick == null ? [] : [pick];
  }
  function monthCandidates(y, mo, rule, startYmd) {
    var out = [];
    if (rule.byday && rule.byday.length) {
      rule.byday.forEach(function (b) { out = out.concat(weekdaysInMonth(y, mo, b.wd, b.n)); });
      if (rule.bymonthday) {
        var dim = daysInMonth(y, mo);
        var want = rule.bymonthday.map(function (n) { return n > 0 ? n : dim + n + 1; });
        out = out.filter(function (dn) { return want.indexOf(ymdOf(dn).d) >= 0; });
      }
    } else if (rule.bymonthday && rule.bymonthday.length) {
      var dim2 = daysInMonth(y, mo);
      rule.bymonthday.forEach(function (n) {
        var d = n > 0 ? n : dim2 + n + 1;
        if (d >= 1 && d <= dim2) out.push(dnOf(y, mo, d));
      });
    } else if (startYmd.d <= daysInMonth(y, mo)) out.push(dnOf(y, mo, startYmd.d));
    out.sort(function (a, b) { return a - b; });
    out = out.filter(function (dn, i) { return out.indexOf(dn) === i; });
    if (rule.bysetpos && rule.bysetpos.length && out.length) {
      var sel = [];
      rule.bysetpos.forEach(function (p) { var v = p > 0 ? out[p - 1] : out[out.length + p]; if (v != null && sel.indexOf(v) < 0) sel.push(v); });
      out = sel.sort(function (a, b) { return a - b; });
    }
    return out;
  }
  /* every start date (day number) of a repeating event, ascending, until
     the window ends, COUNT runs out or UNTIL passes */
  function expandDates(startDn, rule, lastDn, untilOk, minDn) {
    var out = [], s = ymdOf(startDn), guard = 0, count = 0;
    if (minDn == null) minDn = startDn;
    var take = function (dn) {
      if (dn < startDn) return true;
      if (rule.count != null && count >= rule.count) return false;
      if (!untilOk(dn)) return false;
      count++;
      if (dn > lastDn) return false;
      if (dn >= minDn) out.push(dn);
      return true;
    };
    var monthOk = function (dn) { return !rule.bymonth || rule.bymonth.indexOf(ymdOf(dn).mo) >= 0; };
    if (rule.freq === 'DAILY') {
      for (var dn = startDn; guard++ < 200000; dn += rule.interval) {
        if (rule.byday && rule.byday.length && !rule.byday.some(function (b) { return b.wd === wdOf(dn); })) { if (dn > lastDn) break; continue; }
        if (!monthOk(dn)) { if (dn > lastDn) break; continue; }
        if (!take(dn)) break;
      }
    } else if (rule.freq === 'WEEKLY') {
      var days = (rule.byday && rule.byday.length ? rule.byday.map(function (b) { return b.wd; }) : [wdOf(startDn)])
        .map(function (wd) { return (wd - rule.wkst + 7) % 7; }).sort(function (a, b) { return a - b; });
      var week0 = startDn - ((wdOf(startDn) - rule.wkst + 7) % 7);
      outer: for (var wk = week0; guard++ < 50000; wk += 7 * rule.interval) {
        for (var i = 0; i < days.length; i++) {
          var d = wk + days[i];
          if (d < startDn || !monthOk(d)) continue;
          if (!take(d)) break outer;
        }
        if (wk > lastDn) break;
      }
    } else if (rule.freq === 'MONTHLY') {
      outer2: for (var k = 0; guard++ < 5000; k += rule.interval) {
        var y = s.y + Math.floor((s.mo - 1 + k) / 12), mo = ((s.mo - 1 + k) % 12) + 1;
        if (rule.bymonth && rule.bymonth.indexOf(mo) < 0) continue;
        if (dnOf(y, mo, 1) > lastDn) break;
        var c = monthCandidates(y, mo, rule, s);
        for (var j = 0; j < c.length; j++) if (!take(c[j])) break outer2;
      }
    } else if (rule.freq === 'YEARLY') {
      outer3: for (var yy = s.y; guard++ < 500; yy += rule.interval) {
        if (dnOf(yy, 1, 1) > lastDn) break;
        var months = rule.bymonth && rule.bymonth.length ? rule.bymonth.slice().sort(function (a, b) { return a - b; }) : [s.mo];
        var cand = [];
        months.forEach(function (mo2) {
          var r2 = rule;
          if (!rule.byday && !rule.bymonthday) r2 = { bymonthday: [s.d] };
          cand = cand.concat(monthCandidates(yy, mo2, r2, s));
        });
        cand.sort(function (a, b) { return a - b; });
        if (rule.bysetpos && rule.bysetpos.length) {
          var sel = [];
          rule.bysetpos.forEach(function (p) { var v = p > 0 ? cand[p - 1] : cand[cand.length + p]; if (v != null) sel.push(v); });
          cand = sel.sort(function (a, b) { return a - b; });
        }
        for (var q = 0; q < cand.length; q++) if (!take(cand[q])) break outer3;
      }
    } else {
      take(startDn);
    }
    return out;
  }

  /* ── the whole thing ────────────────────────────────────────────────── */
  /* parse(text, {from:'YYYY-MM-DD', to:'YYYY-MM-DD', tz}) — `to` inclusive,
     `tz` is the zone for floating times (the app's zone). Returns
     {name, events:[{uid,title,loc,start,end,allDay,d0,d1,free}]}: timed
     events carry start/end instants (ms); all-day ones d0..d1 as dates,
     d1 exclusive, the way the format writes them. */
  function parse(text, opt) {
    opt = opt || {};
    var R = readEvents(text);
    var tz = normZone(opt.tz) || R.cal.tz || 'UTC';
    var fromDn = dnFromKey(opt.from), toDn = dnFromKey(opt.to);
    if (fromDn == null) fromDn = Math.floor(Date.now() / DAY) - 7;
    if (toDn == null) toDn = fromDn + 60;
    /* the window as instants, midnight to midnight in the app's zone */
    var fy = ymdOf(fromDn), ty = ymdOf(toDn + 1);
    var winStart = zonedToEpoch(fy.y, fy.mo, fy.d, 0, 0, 0, tz), winEnd = zonedToEpoch(ty.y, ty.mo, ty.d, 0, 0, 0, tz);
    var out = [];
    var groups = {};
    R.events.forEach(function (e) {
      var uid = e.props.UID ? e.props.UID.value.trim() : 'x-' + Math.random().toString(36).slice(2);
      (groups[uid] = groups[uid] || []).push(e);
    });
    Object.keys(groups).forEach(function (uid) {
      var list = groups[uid];
      var masters = list.filter(function (e) { return !e.props['RECURRENCE-ID']; });
      var overrides = list.filter(function (e) { return !!e.props['RECURRENCE-ID']; });
      var overKeys = {};
      overrides.forEach(function (o) {
        var rid = parseDT(o.props['RECURRENCE-ID'].value, o.props['RECURRENCE-ID'].params);
        if (!rid) return;
        var ods = o.props.DTSTART && parseDT(o.props.DTSTART.value, o.props.DTSTART.params);
        overKeys[rid.date ? 'd' + dnOf(rid.y, rid.mo, rid.d) : 't' + dtEpoch(rid, (ods && ods.tz) || tz)] = 1;
        emitSingle(o, uid);
      });
      masters.forEach(function (m) { emitMaster(m, uid, overKeys); });
    });

    function base(e) {
      var st = e.props.STATUS ? e.props.STATUS.value.trim().toUpperCase() : '';
      if (st === 'CANCELLED') return null;
      var ds = e.props.DTSTART && parseDT(e.props.DTSTART.value, e.props.DTSTART.params);
      if (!ds) return null;
      var de = e.props.DTEND && parseDT(e.props.DTEND.value, e.props.DTEND.params);
      var dur = e.props.DURATION ? parseDuration(e.props.DURATION.value) : null;
      return {
        ds: ds, de: de, dur: dur,
        title: e.props.SUMMARY ? unescapeText(e.props.SUMMARY.value).trim() : '',
        loc: e.props.LOCATION ? unescapeText(e.props.LOCATION.value).trim() : '',
        free: !!(e.props.TRANSP && e.props.TRANSP.value.trim().toUpperCase() === 'TRANSPARENT')
      };
    }
    /* one occurrence starting on civil date `dn` (or at the event's own start) */
    function push(b, uid, dn) {
      var o = { uid: uid, title: b.title || '(busy)', loc: b.loc, free: b.free };
      if (b.ds.date) {
        var s0 = dnOf(b.ds.y, b.ds.mo, b.ds.d);
        var span = b.de && b.de.date ? dnOf(b.de.y, b.de.mo, b.de.d) - s0
          : b.dur != null ? Math.max(1, Math.round(b.dur / DAY)) : 1;
        span = Math.max(1, span);
        var d0 = dn != null ? dn : s0;
        if (d0 + span <= fromDn || d0 > toDn) return;
        o.allDay = true; o.d0 = keyOf(d0); o.d1 = keyOf(d0 + span);
      } else {
        var st = b.ds;
        var startMs = dn != null
          ? (st.utc ? Date.UTC(ymdOf(dn).y, ymdOf(dn).mo - 1, ymdOf(dn).d, st.h, st.mi, st.s)
            : zonedToEpoch(ymdOf(dn).y, ymdOf(dn).mo, ymdOf(dn).d, st.h, st.mi, st.s, st.tz || tz))
          : dtEpoch(st, tz);
        var first = dtEpoch(st, tz);
        var len = b.de ? (b.de.date ? dnOf(b.de.y, b.de.mo, b.de.d) * DAY - first : dtEpoch(b.de, b.de.tz || st.tz || tz) - first)
          : b.dur != null ? b.dur : 0;
        if (!(len >= 0)) len = 0;
        var endMs = startMs + len;
        if (endMs <= winStart || startMs >= winEnd) return;
        o.allDay = false; o.start = startMs; o.end = endMs;
      }
      out.push(o);
    }
    function emitSingle(e, uid) { var b = base(e); if (b) push(b, uid, null); }
    function emitMaster(e, uid, overKeys) {
      var b = base(e);
      if (!b) return;
      var rr = e.props.RRULE ? parseRule(e.props.RRULE.value) : null;
      var rdates = [];
      (e.multi.RDATE || []).forEach(function (p) {
        p.value.split(',').forEach(function (v) { var d = parseDT(v, p.params); if (d) rdates.push(d); });
      });
      if (!rr && !rdates.length) { push(b, uid, null); return; }
      var ex = {};
      (e.multi.EXDATE || []).forEach(function (p) {
        p.value.split(',').forEach(function (v) {
          var d = parseDT(v, p.params);
          if (!d) return;
          if (d.date || b.ds.date) ex['d' + dnOf(d.y, d.mo, d.d)] = 1;
          else ex['t' + dtEpoch(d, b.ds.tz || tz)] = 1;
        });
      });
      var startDn = dnOf(b.ds.y, b.ds.mo, b.ds.d);
      var untilOk = function () { return true; };
      if (rr && rr.until) {
        var u = rr.until;
        if (u.date || b.ds.date) { var udn = dnOf(u.y, u.mo, u.d); untilOk = function (dn) { return dn <= udn; }; }
        else {
          var uMs = dtEpoch(u, tz), st = b.ds;
          /* compare dates first; only the UNTIL day itself needs the clock */
          var uw = st.utc ? null : wallOf(uMs, st.tz || tz);
          var uDn = uw ? dnOf(uw.y, uw.mo, uw.d) : Math.floor(uMs / DAY);
          untilOk = function (dn) {
            if (dn < uDn) return true;
            if (dn > uDn) return false;
            var y = ymdOf(dn);
            var t = st.utc ? Date.UTC(y.y, y.mo - 1, y.d, st.h, st.mi, st.s) : zonedToEpoch(y.y, y.mo, y.d, st.h, st.mi, st.s, st.tz || tz);
            return t <= uMs;
          };
        }
      }
      var dns = rr ? expandDates(startDn, rr, toDn + 1, untilOk, fromDn - 2) : [startDn];
      rdates.forEach(function (d) { var dn = dnOf(d.y, d.mo, d.d); if (dns.indexOf(dn) < 0) dns.push(dn); });
      dns.sort(function (a, c) { return a - c; });
      dns.forEach(function (dn) {
        var key;
        if (b.ds.date) key = 'd' + dn;
        else {
          var y = ymdOf(dn), st = b.ds;
          key = 't' + (st.utc ? Date.UTC(y.y, y.mo - 1, y.d, st.h, st.mi, st.s) : zonedToEpoch(y.y, y.mo, y.d, st.h, st.mi, st.s, st.tz || tz));
        }
        if (ex[key] || overKeys[key]) return;
        if (!b.ds.date && ex['d' + dn]) return;
        push(b, uid, dn);
      });
    }

    out.sort(function (a, b) {
      var ka = a.allDay ? dnFromKey(a.d0) * DAY : a.start, kb = b.allDay ? dnFromKey(b.d0) * DAY : b.start;
      return ka - kb;
    });
    return { name: R.cal.name, tz: R.cal.tz, events: out };
  }

  return {
    parse: parse, parseDT: parseDT, parseRule: parseRule, expandDates: expandDates,
    zonedToEpoch: zonedToEpoch, wallOf: wallOf, normZone: normZone, unfold: unfold,
    dnOf: dnOf, keyOf: keyOf, dnFromKey: dnFromKey, wdOf: wdOf
  };
});
