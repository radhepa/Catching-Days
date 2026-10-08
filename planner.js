/* ═══════════════ Catching Days · the day planner ═══════════════
   Lays your day out like a calendar's day view: the commitments you already
   have (your Google Calendar, plus time you block off here), and the tasks,
   habits and exam prep you drag onto it so each one gets a real time.

   Two homes: a "Your day" card at the top of Today's side column, and the
   Calendar tab (day / 3-day / week views, a tray of everything you could
   plan, a month to jump around in).

   What it can do
     · drag a task from the tray, the Today list or the "not planned yet"
       chips onto a time; drag blocks to move them, pull the bottom edge to
       change their length, drop one back on the tray to unplan it
     · tap instead of dragging (phones): tap a task, then tap a time
     · tasks with no estimate get one worked out (similar tasks you've
       estimated, the class's usual, then the kind of work), marked "guess"
     · "Plan my day / week" fills the free time around your commitments in
       do-score order, as a suggestion you keep or throw away
     · blocks that slipped by unfinished get found new times in one click
     · repeating time you block off (gym, work), and "same time every day"
       for a habit
     · a reminder when a planned block starts, with Focus one tap away
     · Google Calendar (or any .ics feed) through its secret iCal address,
       read by the local server (server.py / server.js · /cal-feed) and
       kept in db so the phone copy sees it after a sync

   Data, all in db.planner (records with string ids, so saving and cloud
   sync carry it like everything else):
     blocks   [{id, day:'YYYY-MM-DD', start:min, dur:min, kind:'task'|'busy',
                aid?, hid?, eid?, title?}]   start = minutes after midnight,
                                             on the app's own clock (TZ())
     routines [{id, kind:'busy'|'habit', title?, hid?, start, dur,
                days:[0-6], from, skip:[day]}]
     feeds    [{id, name, url, color, on}]   url is the secret address
     cal      {at, from, to, ev:[{f, t, l, s, e} | {f, t, l, ad:1, d0, d1}]}
     prefs    {dayStart, dayEnd, gap, maxWork, maxBlock, remind, weekStart}

   Self-contained like projects.js: it only CALLS the app's helpers and
   reads its data. The app calls Planner.paint() from tab('cal'),
   Planner.refresh() from repaint(), Planner.paintToday() from paintDaily()
   and Planner.agentLines() from agentContext(). Everything public sits on
   window.Planner. */
(function(){
'use strict';
const IC=window.PlannerICal;

/* ── constants ── */
const SNAP=15, MINB=15, DAYMIN=1440;
const DEF={dayStart:7*60, dayEnd:23*60, gap:10, maxWork:240, maxBlock:90, remind:true, weekStart:0};
const FEED_COLORS=['#4f86b3','#2f7a74','#715c95','#a8762f','#c65f2e','#5f9470','#96518f','#5c6570'];
const PX={today:46, cal:54};                 // pixels per hour
const BUSY_C='#8f978f', HABIT_C='#715c95', UNFILED_C='#2f7a74';
const WEEK=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WEEK_L=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const LS_NOTE='catchingdays.planner.notified', LS_FETCH='catchingdays.planner.fetched', LS_HINT='catchingdays.planner.hint';

/* ── view state (never saved) ── */
const S={day:null, followToday:true, view:'day', q:'', sel:null, placing:null,
  ghosts:null, items:new Map(), pop:null, fetching:false, feedStatus:{}, month:null,
  open:{later:false,none:false}, scroll:{}, todaySig:'', calSig:'', lastPaintDay:null};

/* ═══════════════ data ═══════════════ */
function P(){
  let p=db.planner;
  if(!p||typeof p!=='object'||Array.isArray(p)) p=db.planner={};
  if(!Array.isArray(p.blocks)) p.blocks=[];
  if(!Array.isArray(p.routines)) p.routines=[];
  if(!Array.isArray(p.feeds)) p.feeds=[];
  if(!p.prefs||typeof p.prefs!=='object'||Array.isArray(p.prefs)) p.prefs={};
  if(!p.cal||typeof p.cal!=='object'||Array.isArray(p.cal)||!Array.isArray(p.cal.ev)) p.cal={at:0,from:'',to:'',ev:[]};
  return p;
}
function prefs(){
  const o=Object.assign({},DEF,P().prefs);
  ['dayStart','dayEnd','gap','maxWork','maxBlock','weekStart'].forEach(k=>{ o[k]=+o[k]; if(!isFinite(o[k])) o[k]=DEF[k]; });
  if(o.dayEnd<=o.dayStart+60) o.dayEnd=Math.min(DAYMIN,o.dayStart+60);
  return o;
}
const blockById=id=>P().blocks.find(b=>b.id===id)||null;
const routineById=id=>P().routines.find(r=>r.id===id)||null;
const feedById=id=>P().feeds.find(f=>f.id===id)||null;

/* ═══════════════ time ═══════════════ */
const p2=n=>String(n).padStart(2,'0');
function wall(ts){ return IC.wallOf(ts,TZ()); }
function nowMin(){ const w=wall(Date.now()); return w.h*60+w.mi; }
function epochOf(day,min){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(day); if(!m) return 0;
  return IC.zonedToEpoch(+m[1],+m[2],+m[3],Math.floor(min/60),min%60,0,TZ());
}
const snapM=(m,s)=>Math.round(m/(s||SNAP))*(s||SNAP);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hm(min,noAp){
  min=((Math.round(min)%DAYMIN)+DAYMIN)%DAYMIN;
  const h=Math.floor(min/60), mi=min%60, h12=h%12||12;
  return h12+(mi?':'+p2(mi):'')+(noAp?'':(h<12?' AM':' PM'));
}
function range(s,e){
  const sa=(Math.floor((((s%DAYMIN)+DAYMIN)%DAYMIN)/60)<12), ea=(Math.floor((((e%DAYMIN)+DAYMIN)%DAYMIN)/60)<12);
  return sa===ea&&e<DAYMIN?`${hm(s,true)} – ${hm(e)}`:`${hm(s)} – ${hm(e)}`;
}
function durTxt(m){ m=Math.round(m||0); if(m<60) return m+'m'; const h=Math.floor(m/60), r=m%60; return h+'h'+(r?' '+r+'m':''); }
function durLong(m){ m=Math.round(m||0); if(m<60) return m+' min'; const h=Math.floor(m/60), r=m%60; return h+' hr'+(r?' '+r+' min':''); }
const wd=day=>weekdayOf(day);
function dayLabel(day,short){
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(day); if(!m) return '';
  const d=dDelta(day);
  if(short) return `${WEEK[wd(day)]} ${MON[+m[2]-1]} ${+m[3]}`;
  return `${WEEK_L[wd(day)]}, ${MONTH_NAMES[+m[2]-1]} ${ord(+m[3])}${d===0?' · today':d===1?' · tomorrow':d===-1?' · yesterday':''}`;
}
const isToday=day=>day===today();
function minutePast(day,min){ const t=today(); return day<t||(day===t&&min<=nowMin()); }

/* ═══════════════ tasks ═══════════════ */
const openA=a=>a&&!a.done&&!a.ann&&!inArchivedCls(a)&&journeyAssignmentIsActive(a);
function todayList(){
  const t=today();
  const auto=db.assignments.filter(a=>a.due===t&&!inArchivedCls(a)&&journeyAssignmentIsActive(a));
  const seen=new Set(auto.map(a=>a.id));
  const picked=picksFor(t).filter(id=>!seen.has(id)).map(asg).filter(a=>a&&!inArchivedCls(a)&&journeyAssignmentIsActive(a));
  return auto.concat(picked);
}
const colorOfA=a=>a.classId?clsCol(a.classId):a.habitId?HABIT_C:UNFILED_C;
const examById=id=>(db.exams||[]).find(e=>e.id===id)||null;

/* How long a task takes. Its own estimate when there is one; otherwise a
   guess, from the closest evidence there is: tasks like it in the same
   class you've estimated, that class's usual, then the kind of work the
   title names. A guess the planner wrote onto the task (est===estGuess)
   still counts as a guess. */
const KIND_EST=[
  /* order matters: the first rule that matches wins */
  [/\b(exam|midterm exam|final exam|study for)\b/i,120],
  [/\b(peer (review|eval\w*)|catme|evaluations?|rubric|survey|questionnaire|checklist|enroll|register|registration|sign[- ]?up|grade review|form|rsvp|fee)\b/i,20],
  [/\bquiz\b/i,45],[/\breflection\b/i,45],
  [/\b(lab ?report|report|essay|paper|project|presentation|poster|proposal|draft|design doc\w*|document)\b/i,90],
  [/\b(upload|submit|turn in|email|apply|application|portal|pay|schedule|book|call|text)\b/i,15],
  [/\blab\b/i,60],[/\b(problem set|pset|homework|hw|worksheet|assignment|exercises?|practice problems)\b/i,60],
  [/\b(upper|lower|push|pull|legs|gym|lift|workout|weights|strength)\b/i,60],
  [/\b(martial|karate|jiu|bjj|boxing|muay|taekwondo|kung fu|judo)\b/i,60],
  [/\b(run|jog|sprints?|intervals?|cardio|walk|bike|swim)\b/i,30],
  [/\b(yoga|stretch|mobility)\b/i,20],[/\bmeditat/i,15],[/\bjournal/i,15],
  [/\b(read|reading|chapter|ch\.|textbook|article)\b/i,45],
  [/\b(video|lecture|watch|recording)\b/i,45],[/\b(review|study|notes|flashcards)\b/i,45],
  [/\b(discussion|post|reply|respond)\b/i,20],
];
const norm=t=>String(t||'').toLowerCase().replace(/\d+/g,'#').replace(/[^a-z# ]+/g,' ').replace(/\s+/g,' ').trim();
let _gCache=new Map(), _gStamp=null;
function guessEst(a){
  if(!a) return 30;
  const stamp=(db.savedAt||0)+'|'+db.assignments.length;
  if(stamp!==_gStamp){ _gStamp=stamp; _gCache=new Map(); }
  const ck=a.id+'|'+a.title+'|'+a.classId+'|'+(a.subs||[]).filter(x=>!x.done).length;
  if(_gCache.has(ck)) return _gCache.get(ck);
  const g=guessRaw(a); _gCache.set(ck,g); return g;
}
function guessRaw(a){
  const real=x=>x.est>0&&x.est!==x.estGuess;
  const pool=db.assignments.filter(x=>x!==a&&real(x));
  const n=norm(a.title), head=n.split(' ').slice(0,2).join(' ');
  const median=arr=>{ const s=arr.slice().sort((x,y)=>x-y); return s[Math.floor((s.length-1)/2)]; };
  let g=null;
  if(head){
    const like=pool.filter(x=>x.classId===a.classId&&norm(x.title).startsWith(head));
    if(like.length) g=median(like.map(x=>x.est));
  }
  if(g==null&&a.habitId){
    const sib=pool.filter(x=>x.habitId===a.habitId);
    if(sib.length) g=median(sib.map(x=>x.est));
  }
  if(g==null){ const k=KIND_EST.find(([re])=>re.test(a.title)); if(k) g=k[1]; }
  if(g==null&&a.classId){
    const cl=pool.filter(x=>x.classId===a.classId);
    if(cl.length>=3) g=median(cl.map(x=>x.est));
  }
  if(g==null) g=30;
  const subs=(a.subs||[]).filter(s=>!s.done).length;
  if(subs>=3) g=Math.max(g,Math.min(180,subs*15));
  return Math.max(10,Math.round(g/5)*5);
}
function estOf(a){
  if(a&&a.est>0) return {m:a.est, guess:a.est===a.estGuess};
  return {m:guessEst(a), guess:true};
}
const loggedMin=a=>Math.round((a&&a.logged||0)/MIN);
/* minutes already set aside for a task from now on (blocks still ahead) */
function plannedAhead(aid){
  const t=today(), nm=nowMin();
  return sum(P().blocks.filter(b=>b.aid===aid&&(b.day>t||(b.day===t&&b.start+b.dur>nm))),b=>b.dur);
}
function leftToPlan(a){
  const e=estOf(a);
  const subsLeft=(a.subs||[]).length?(a.subs.filter(s=>!s.done).length/a.subs.length):1;
  const need=Math.max(0,Math.round(e.m*subsLeft)-loggedMin(a));
  return Math.max(0,need-plannedAhead(a.id));
}
/* write the guess onto the task once you plan it, so it shows everywhere */
function adoptGuess(a){
  if(!a||a.est>0) return false;
  const g=guessEst(a); a.est=g; a.estGuess=g; return true;
}
function srcInfo(src){
  const [k,id]=String(src||'').split(':');
  if(k==='a'){ const a=asg(id); if(!a) return null;
    const e=estOf(a), left=leftToPlan(a);
    return {src, a, title:a.title, color:colorOfA(a), est:e, dur:clamp(Math.round((left>0?left:e.m)/5)*5,MINB,180)}; }
  if(k==='x'){ const x=examById(id); if(!x) return null;
    return {src, x, title:'Study: '+x.title, color:x.classId?clsCol(x.classId):'#715c95', est:{m:60,guess:false}, dur:60}; }
  return null;
}

/* ═══════════════ the calendar feeds ═══════════════ */
function feedEvents(){
  const on=new Set(P().feeds.filter(f=>f.on!==false).map(f=>f.id));
  return P().cal.ev.filter(e=>on.has(e.f));
}
/* a day's slice of every calendar event, on the app's clock */
function eventsOn(day){
  const d0=epochOf(day,0), d1=epochOf(addDays(day,1),0);
  const timed=[], all=[];
  feedEvents().forEach((e,i)=>{
    if(e.ad){ if(e.d0<=day&&e.d1>day) all.push(e); return; }
    if(!(e.e>d0&&e.s<d1)) return;
    const sw=e.s<=d0?0:(w=>w.h*60+w.mi)(wall(e.s));
    let ew=e.e>=d1?DAYMIN:(w=>w.h*60+w.mi)(wall(e.e));
    if(ew<=sw) ew=Math.min(DAYMIN,sw+Math.max(15,Math.round((e.e-e.s)/MIN)));
    timed.push({ev:e, s:sw, e:ew});
  });
  return {timed, all};
}
function cacheRange(extra){
  const t=today();
  let from=addDays(t,-7), to=addDays(t,56);
  if(extra){ if(addDays(extra,-7)<from) from=addDays(extra,-7); if(addDays(extra,14)>to) to=addDays(extra,14); }
  return {from,to};
}
function feedUrl(u){ u=String(u||'').trim(); if(/^webcal:\/\//i.test(u)) u='https://'+u.slice(9); return u; }
async function fetchFeed(f){
  const u=feedUrl(f.url);
  if(MODE==='server'){
    const r=await fetch('/cal-feed?u='+encodeURIComponent(u),{cache:'no-store'});
    const txt=await r.text();
    if(r.status===404) throw new Error('restart');
    if(!r.ok) throw new Error(txt||'Could not reach that address.');
    return txt;
  }
  /* hosted/phone copy: there is no helper to read another site, so only
     feeds that allow it work; everything else arrives through sync */
  const r=await fetch(u,{cache:'no-store'});
  if(!r.ok) throw new Error('Could not reach that address.');
  return await r.text();
}
function lastFetch(){ try{ return +localStorage.getItem(LS_FETCH)||0; }catch(e){ return 0; } }
async function refreshFeeds(force,extraDay){
  const feeds=P().feeds.filter(f=>f.on!==false&&f.url);
  if(!feeds.length||S.fetching) return;
  if(MODE==='file') return;
  const rng=cacheRange(extraDay);
  const c=P().cal;
  const covered=c.from&&c.to&&c.from<=rng.from&&c.to>=rng.to;
  if(!force&&covered&&Date.now()-lastFetch()<15*60000) return;
  S.fetching=true; paintStatus();
  const keep=P().cal.ev.filter(e=>!feeds.some(f=>f.id===e.f)&&feedById(e.f));
  let ev=[], anyOk=false;
  for(const f of feeds){
    try{
      const txt=await fetchFeed(f);
      const r=IC.parse(txt,{from:rng.from,to:rng.to,tz:TZ()});
      r.events.forEach(e=>{
        const o={f:f.id,t:e.title.slice(0,140)};
        if(e.loc) o.l=e.loc.slice(0,80);
        if(e.free) o.fr=1;
        if(e.allDay){ o.ad=1; o.d0=e.d0; o.d1=e.d1; } else { o.s=e.start; o.e=e.end; }
        ev.push(o);
      });
      S.feedStatus[f.id]={ok:true, at:Date.now(), n:r.events.length, name:r.name};
      anyOk=true;
    }catch(err){
      const msg=err&&err.message==='restart'?'restart':(err&&err.message)||'Could not reach that address.';
      S.feedStatus[f.id]={ok:false, at:Date.now(), err:msg};
      ev=ev.concat(P().cal.ev.filter(e=>e.f===f.id));   // keep what we had
    }
  }
  S.fetching=false;
  if(anyOk){ try{ localStorage.setItem(LS_FETCH,String(Date.now())); }catch(e){} }
  const next=keep.concat(ev).sort((a,b)=>(a.ad?0:a.s)-(b.ad?0:b.s));
  const cur=JSON.stringify(P().cal.ev);
  if(anyOk&&(JSON.stringify(next)!==cur||P().cal.from!==rng.from||P().cal.to!==rng.to)){
    P().cal={at:Date.now(), from:rng.from, to:rng.to, ev:next};
    save();
  }
  rerender(); paintStatus();
}

/* ═══════════════ what's on a day ═══════════════ */
function habitOn(h,day){
  if(!h||h.active===false) return false;
  const j=findHabitJourney(h.id); if(!j||j.status!=='active') return false;
  if(day<j.start||day>journeyEndDate(j)) return false;
  if(h.scheduleType==='freq') return false;
  return (h.days||[]).includes(wd(day));
}
const occurrence=(hid,day)=>db.assignments.find(a=>a.habitId===hid&&a.due===day)||null;
/* the task behind a block, if it still exists */
function taskOf(b){
  if(b.aid){ const a=asg(b.aid); if(a&&(!a.habitId||a.due===b.day)) return a; }
  if(b.hid) return occurrence(b.hid,b.day);
  return null;
}
function routineOn(r,day){
  if((r.skip||[]).includes(day)) return false;
  if(r.from&&day<r.from) return false;
  if(r.kind==='habit'){
    if(day<today()) return false;
    const h=findHabit(r.hid); if(!h) return false;
    if(day===today()&&!occurrence(r.hid,day)) return false;
    return habitOn(h,day)||!!occurrence(r.hid,day);
  }
  return (r.days||[]).includes(wd(day));
}
/* every timed thing on a day, as one list the timeline draws */
function dayModel(day){
  const t=today(), nm=nowMin(), out=[], all=[];
  const ev=eventsOn(day);
  ev.timed.forEach((x,i)=>out.push({k:'e:'+day+':'+i, kind:'event', s:x.s, e:x.e, title:x.ev.t||'(busy)',
    sub:x.ev.l||'', color:(feedById(x.ev.f)||{}).color||'#4f86b3', free:!!x.ev.fr, feed:x.ev.f, ev:x.ev}));
  ev.all.forEach(e=>all.push({kind:'event', title:e.t, color:(feedById(e.f)||{}).color||'#4f86b3', free:!!e.fr}));
  const placedHabits=new Set();
  P().blocks.filter(b=>b.day===day).forEach(b=>{
    if(b.kind==='busy'){ out.push({k:'b:'+b.id, kind:'busy', s:b.start, e:b.start+b.dur, title:b.title||'Busy', color:BUSY_C, b}); return; }
    if(b.eid){ const x=examById(b.eid); if(!x) return;
      out.push({k:'b:'+b.id, kind:'task', s:b.start, e:b.start+b.dur, title:'Study: '+x.title, color:x.classId?clsCol(x.classId):'#715c95',
        sub:x.classId?clsShort(x.classId):'', b, x, done:!!x.done}); return; }
    const a=taskOf(b);
    if(!a&&b.aid&&!b.hid) return;                                  // its task is gone
    if(b.hid) placedHabits.add(b.hid);
    const h=b.hid?findHabit(b.hid):null;
    if(!a&&!h) return;
    const done=!!(a&&a.done);
    out.push({k:'b:'+b.id, kind:'task', s:b.start, e:b.start+b.dur, title:a?a.title:h.name, color:a?colorOfA(a):HABIT_C,
      sub:a&&a.classId?clsShort(a.classId):(b.hid||(a&&a.habitId))?'Habit':'', b, a, done,
      slipped:!!a&&!done&&!a.ann&&(day<t||(day===t&&b.start+b.dur<=nm))});
  });
  P().routines.forEach(r=>{
    if(!routineOn(r,day)) return;
    if(r.kind==='habit'){
      if(placedHabits.has(r.hid)) return;
      const a=occurrence(r.hid,day), h=findHabit(r.hid);
      out.push({k:'r:'+r.id+':'+day, kind:'task', s:r.start, e:r.start+r.dur, title:a?a.title:(h?h.name:'Habit'), color:HABIT_C,
        sub:'Habit · every time', r, a, rday:day, done:!!(a&&a.done),
        slipped:!!a&&!a.done&&(day<t||(day===t&&r.start+r.dur<=nm))});
    } else out.push({k:'r:'+r.id+':'+day, kind:'busy', s:r.start, e:r.start+r.dur, title:r.title||'Busy', color:BUSY_C, sub:'Repeats', r, rday:day});
  });
  (S.ghosts||[]).forEach((g,i)=>{ if(g.day!==day) return; const si=srcInfo(g.src); if(!si) return;
    out.push({k:'g:'+i, kind:'ghost', s:g.start, e:g.start+g.dur, title:si.title, color:si.color, g, gi:i}); });
  /* deadlines and exams ride along the top of the day */
  db.assignments.filter(a=>a.due===day&&!a.done&&!inArchivedCls(a)&&journeyAssignmentIsActive(a)&&!a.habitId)
    .forEach(a=>all.push({kind:'due', title:a.title, color:colorOfA(a), a}));
  (db.exams||[]).filter(x=>x.examDate===day&&!x.done&&!clsArchived(x.classId))
    .forEach(x=>all.push({kind:'exam', title:(x.kind==='quiz'?'Quiz: ':'Exam: ')+x.title, color:x.classId?clsCol(x.classId):'#715c95', x}));
  /* a planned block that runs into a commitment says so */
  const hard=out.filter(i=>(i.kind==='event'&&!i.free)||i.kind==='busy');
  out.forEach(i=>{
    if(i.kind!=='task'&&i.kind!=='ghost') return;
    const hit=hard.find(h=>h.s<i.e&&h.e>i.s);
    if(hit) i.conflict=hit.title;
  });
  out.forEach(i=>{ i.day=day; i.past=day<t||(day===t&&i.e<=nm); });
  return {day, items:out, all};
}
/* busy stretches inside [from,to], merged */
function busyIn(model,from,to,opts){
  opts=opts||{};
  const iv=model.items.filter(i=>{
    if(i.kind==='event') return !i.free;
    if(i.kind==='ghost') return !!opts.ghosts;
    return true;
  }).map(i=>[Math.max(from,i.s),Math.min(to,i.e+((i.kind==='task'||i.kind==='ghost')?(opts.gap||0):0))])
    .filter(([s,e])=>e>s).sort((a,b)=>a[0]-b[0]);
  const m=[];
  iv.forEach(x=>{ const l=m[m.length-1]; if(l&&x[0]<=l[1]) l[1]=Math.max(l[1],x[1]); else m.push(x.slice()); });
  return m;
}
function freeIn(model,from,to,opts){
  const out=[]; let c=from;
  busyIn(model,from,to,opts).forEach(([s,e])=>{ if(s>c) out.push([c,s]); c=Math.max(c,e); });
  if(to>c) out.push([c,to]);
  return out;
}
function dayStats(day){
  const pf=prefs(), m=dayModel(day);
  let from=pf.dayStart; const to=pf.dayEnd;
  if(isToday(day)) from=Math.max(from,Math.ceil(nowMin()/5)*5);
  const free=from<to?sum(freeIn(m,from,to),([s,e])=>e-s):0;
  const planned=sum(m.items.filter(i=>i.kind==='task'),i=>i.e-i.s);
  const busy=sum(busyIn({items:m.items.filter(i=>i.kind!=='task')},pf.dayStart,pf.dayEnd),([s,e])=>e-s);
  return {free, planned, busy, model:m};
}

/* ═══════════════ planning for you ═══════════════
   Fills free time in do-score order. Today's list goes first, then
   anything overdue, then what's due soonest; habits only ever land on
   their own day, and nothing is planned after its due date. Blocks are
   at most `maxBlock` long with `gap` minutes between, and a day gets no
   more than `maxWork` minutes of planned work in all. */
function candidates(day,need){
  const t=today(), list=new Set(isToday(day)?todayList().map(a=>a.id):[]);
  const rows=[];
  db.assignments.forEach(a=>{
    if(!openA(a)) return;
    if(a.habitId){ if(a.due!==day) return; }
    else if(a.due&&a.due<day&&a.due>=t) return;                   // would land after it's due
    const left=need.has('a:'+a.id)?need.get('a:'+a.id):leftToPlan(a);
    if(left<MINB) return;
    if(!need.has('a:'+a.id)) need.set('a:'+a.id,left);
    const d=a.due?dDelta(a.due):null;
    const tier=list.has(a.id)||(a.habitId&&a.due===day)?0:d!==null&&d<0?1:a.due&&daysBetween(day,a.due)<=2?2:a.due&&daysBetween(day,a.due)<=7?3:a.due?4:5;
    rows.push({src:'a:'+a.id, tier, score:doScore(a)||0, due:a.due||'9999'});
  });
  (db.exams||[]).forEach(x=>{
    if(x.done||clsArchived(x.classId)||!x.examDate) return;
    const d=daysBetween(day,x.examDate);
    if(d===null||d<1||d>5) return;
    const key='x:'+x.id;
    if(!need.has(key)) need.set(key,Math.max(0,60*Math.min(3,6-d)-sum(P().blocks.filter(b=>b.eid===x.id&&b.day>=today()),b=>b.dur)));
    if(need.get(key)<MINB) return;
    rows.push({src:key, tier:2, score:examScore(x)||60, due:x.examDate});
  });
  rows.sort((p,q)=>p.tier-q.tier||q.score-p.score||p.due.localeCompare(q.due));
  return rows;
}
function suggestDay(day,need,ghosts){
  const pf=prefs(), t=today();
  if(day<t) return [];
  let from=pf.dayStart; const to=pf.dayEnd;
  if(isToday(day)) from=Math.max(from,Math.ceil((nowMin()+5)/SNAP)*SNAP);
  if(to-from<MINB) return [];
  const model=dayModel(day);
  ghosts.filter(g=>g.day===day).forEach(g=>model.items.push({kind:'ghost',s:g.start,e:g.start+g.dur}));
  let free=freeIn(model,from,to,{gap:pf.gap,ghosts:true});
  let cap=pf.maxWork-sum(model.items.filter(i=>i.kind==='task'),i=>i.e-i.s);
  const out=[];
  for(const c of candidates(day,need)){
    if(cap<MINB) break;
    let want=Math.min(need.get(c.src),180,cap);
    let guard=0;
    while(want>=MINB&&guard++<6){
      const len=Math.min(want,pf.maxBlock);
      let i=free.findIndex(([s,e])=>e-s>=len);
      let use=len;
      if(i<0){ i=free.findIndex(([s,e])=>e-s>=Math.min(30,len)); if(i<0) break; use=Math.floor((free[i][1]-free[i][0])/5)*5; }
      const s=free[i][0];
      out.push({src:c.src, day, start:s, dur:use});
      const cut=s+use+pf.gap;
      if(cut>=free[i][1]) free.splice(i,1); else free[i]=[cut,free[i][1]];
      want-=use; cap-=use; need.set(c.src,need.get(c.src)-use);
    }
  }
  return out;
}
function suggest(days){
  const need=new Map(), ghosts=[];
  days.forEach(d=>{ suggestDay(d,need,ghosts).forEach(g=>ghosts.push(g)); });
  return ghosts;
}
function planIt(){
  const days=cur==='daily'?[today()]:viewDays().filter(d=>d>=today());
  if(!days.length){ toast('That day has already happened.'); return; }
  const g=suggest(days);
  if(!g.length){ S.ghosts=null; toast('Nothing to fit in: either the day is full or everything open is already planned.'); rerender(); return; }
  S.ghosts=g; S.sel=null; closePop(); rerender();
}
function keepGhosts(){
  const g=S.ghosts||[]; if(!g.length) return;
  const before=snapshot();
  g.forEach(x=>{ const si=srcInfo(x.src); if(!si) return; addBlockFor(si,x.day,x.start,x.dur,true); });
  S.ghosts=null; save(); rerender();
  undoToast(`Planned ${g.length} block${g.length===1?'':'s'} · ${durLong(sum(g,x=>x.dur))}`,before);
}
function dropGhosts(){ S.ghosts=null; closePop(); rerender(); }

/* blocks that slipped by unfinished: give each a new time */
function slippedBlocks(){
  const t=today(), from=addDays(t,-3), nm=nowMin();
  return P().blocks.filter(b=>{
    if(b.kind!=='task'||b.eid||b.day<from||b.day>t) return false;
    const a=taskOf(b); if(!a||a.done||a.ann) return false;
    if(a.habitId&&a.due!==t) return false;                       // yesterday's habit is gone
    return b.day<t||b.start+b.dur<=nm;
  }).sort((a,b)=>a.day.localeCompare(b.day)||a.start-b.start);
}
function rescue(){
  const list=slippedBlocks(); if(!list.length) return;
  const before=snapshot(), pf=prefs(), t=today();
  let moved=0;
  list.forEach(b=>{
    for(const day of [t,addDays(t,1),addDays(t,2)]){
      const a=taskOf(b); if(a&&a.habitId&&day!==t) break;
      let from=pf.dayStart; if(day===t) from=Math.max(from,Math.ceil((nowMin()+5)/SNAP)*SNAP);
      const m=dayModel(day); m.items=m.items.filter(i=>!(i.b&&i.b.id===b.id));
      const f=freeIn(m,from,pf.dayEnd,{gap:pf.gap}).find(([s,e])=>e-s>=Math.min(b.dur,30));
      if(f){ b.day=day; b.start=f[0]; b.dur=Math.min(b.dur,Math.floor((f[1]-f[0])/5)*5); b.moved=(b.moved||0)+1; moved++; break; }
    }
  });
  if(!moved){ toast('No free time left today or tomorrow to move them into.'); return; }
  save(); rerender();
  undoToast(`Found new times for ${moved} block${moved===1?'':'s'}`,before);
}

/* ═══════════════ changing things ═══════════════ */
function snapshot(){ return {blocks:clone(P().blocks), routines:clone(P().routines), est:db.assignments.map(a=>[a.id,a.est,a.estGuess])}; }
function restore(s){
  P().blocks=s.blocks; P().routines=s.routines;
  const m=new Map(s.est.map(x=>[x[0],x]));
  db.assignments.forEach(a=>{ const x=m.get(a.id); if(!x) return; a.est=x[1]; if(x[2]===undefined) delete a.estGuess; else a.estGuess=x[2]; });
  save(); repaint();
}
function addBlockFor(si,day,start,dur,quiet){
  const b={id:uid(), day, start:clamp(Math.round(start),0,DAYMIN-MINB), dur:clamp(Math.round(dur),MINB,DAYMIN), kind:'task', created:Date.now()};
  if(si.a){ b.aid=si.a.id; if(si.a.habitId) b.hid=si.a.habitId; adoptGuess(si.a); }
  if(si.x) b.eid=si.x.id;
  if(b.start+b.dur>DAYMIN) b.dur=DAYMIN-b.start;
  P().blocks.push(b);
  if(!quiet){ S.sel='b:'+b.id; }
  return b;
}
function place(src,day,start,dur){
  const si=srcInfo(src); if(!si) return;
  const before=snapshot();
  const b=addBlockFor(si,day,start,dur||si.dur);
  S.placing=null; save(); rerender();
  const g=si.a&&si.a.estGuess===si.a.est&&si.est.guess;
  undoToast(`${si.title} · ${range(b.start,b.start+b.dur)}${g?` · est ~${durTxt(si.a.est)} (a guess)`:''}`,before);
}
/* a routine's day, made into a one-off so it can move on its own */
function detach(it){
  const r=it.r, day=it.rday;
  r.skip=(r.skip||[]).filter(d=>d>=addDays(today(),-14)).concat([day]);
  const b={id:uid(), day, start:r.start, dur:r.dur, created:Date.now()};
  if(r.kind==='habit'){ b.kind='task'; b.hid=r.hid; const a=occurrence(r.hid,day); if(a) b.aid=a.id; }
  else { b.kind='busy'; b.title=r.title; }
  P().blocks.push(b);
  return b;
}
function moveItem(it,day,start,dur){
  if(it.kind==='ghost'){ const g=S.ghosts[it.gi]; g.day=day; g.start=start; if(dur) g.dur=dur; rerender(); return; }
  if(it.kind==='event') return;
  const before=snapshot();
  let b=it.b;
  if(!b&&it.r) b=detach(it);
  if(!b) return;
  if(b.hid&&day!==b.day){ const a=occurrence(b.hid,day); if(a) b.aid=a.id; else if(b.aid&&asg(b.aid)&&asg(b.aid).habitId) delete b.aid; }
  b.day=day; b.start=clamp(start,0,DAYMIN-MINB);
  if(dur) b.dur=clamp(dur,MINB,DAYMIN-b.start);
  if(b.start+b.dur>DAYMIN) b.dur=DAYMIN-b.start;
  S.sel='b:'+b.id; save(); rerender();
  if(it.r) undoToast('Moved just this day · the rest of the routine stays',before);
  else lastUndo=before;
}
function removeItem(it,silent){
  if(it.kind==='ghost'){ S.ghosts.splice(it.gi,1); if(!S.ghosts.length) S.ghosts=null; closePop(); rerender(); return; }
  const before=snapshot();
  if(it.r&&!it.b){ it.r.skip=(it.r.skip||[]).concat([it.rday]); }
  else if(it.b){ P().blocks=P().blocks.filter(x=>x.id!==it.b.id); }
  S.sel=null; closePop(); save(); rerender();
  if(!silent) undoToast(it.r&&!it.b?'Skipped for this day':it.kind==='busy'?'Removed':'Unplanned · the task itself stays',before);
}
let lastUndo=null;

/* ═══════════════ drawing ═══════════════ */
function layout(items,pxm){
  const minLen=20/pxm;
  items.sort((a,b)=>a.s-b.s||(b.e-b.s)-(a.e-a.s));
  let cluster=[], ends=[], cEnd=-1;
  const flush=()=>{ const n=ends.length; cluster.forEach(i=>i.n=n); cluster=[]; ends=[]; cEnd=-1; };
  items.forEach(i=>{
    const ve=Math.max(i.e,i.s+minLen);
    if(cluster.length&&i.s>=cEnd) flush();
    let c=ends.findIndex(e=>e<=i.s);
    if(c<0){ c=ends.length; ends.push(ve); } else ends[c]=ve;
    i.col=c; cluster.push(i); cEnd=Math.max(cEnd,ve);
  });
  flush();
  return items;
}
function itemHTML(i,pxm,cascade){
  const top=i.s*pxm, h=Math.max(20,(i.e-i.s)*pxm-2);
  const w=100/i.n, l=i.col*w;
  /* narrow columns (3-day, week): overlapping blocks fan out a little and
     stack instead of splitting into slivers too thin to read */
  const pos=cascade&&i.n>1?`left:${i.col*14+1}px;width:calc(100% - ${i.col*14+3}px);z-index:${2+i.col}`
    :`left:calc(${l.toFixed(3)}% + 1px);width:calc(${w.toFixed(3)}% - 3px)`;
  const short=h<38, tiny=h<26;
  const cls=['pl-it','pl-k-'+i.kind];
  if(i.done) cls.push('done'); if(i.slipped) cls.push('slipped'); if(i.conflict) cls.push('clash');
  if(i.past&&!i.slipped) cls.push('past'); if(i.free) cls.push('free'); if(S.sel===i.k) cls.push('sel');
  if(short) cls.push('short'); if(tiny) cls.push('tiny'); if(i.r) cls.push('pl-rtn');
  const movable=i.kind!=='event';
  const meta=[range(i.s,i.e)];
  if(i.sub) meta.push(i.sub);
  const tip=`${i.title} · ${range(i.s,i.e)}${i.sub?' · '+i.sub:''}${i.conflict?' · overlaps '+i.conflict:''}${i.kind==='event'?' · from your calendar':''}`;
  S.items.set(i.k,i);
  return `<div class="${cls.join(' ')}" data-k="${esc(i.k)}" tabindex="0" title="${esc(tip)}"
    style="top:${top.toFixed(1)}px;height:${h.toFixed(1)}px;${pos};--c:${i.color}">
    <div class="pl-it-in">
      <div class="pl-it-t">${i.done?'<b class="pl-ck">✓</b>':''}${i.slipped?'<b class="pl-sl">slipped</b>':''}${esc(i.title)}</div>
      ${tiny?'':`<div class="pl-it-m">${esc(meta.join(' · '))}</div>`}
    </div>
    ${i.conflict?'<span class="pl-clash" aria-hidden="true">!</span>':''}
    ${i.kind==='ghost'?`<button class="pl-gx" data-act="ghost-x" data-k="${esc(i.k)}" title="Leave this one out" aria-label="Leave this one out">×</button>`:''}
    ${movable?'<div class="pl-rs" aria-hidden="true"></div>':''}
  </div>`;
}
function hourLabels(hpx){
  let h='';
  for(let i=1;i<24;i++) h+=`<span style="top:${i*hpx}px">${i%12||12} ${i<12?'AM':'PM'}</span>`;
  return h;
}
function allDayCell(m,mode,limit,multi){
  let list=m.all;
  if(mode==='today') list=list.filter(x=>x.kind!=='due');
  if(!list.length) return '';
  /* exams first, then calendar all-day events, then what's due */
  const rank={exam:0,event:1,due:2};
  list=list.slice().sort((a,b)=>rank[a.kind]-rank[b.kind]);
  const shown=list.length>limit?list.slice(0,limit-1):list, more=list.length-shown.length;
  return shown.map(x=>`<span class="pl-ad pl-ad-${x.kind}${x.free?' free':''}" style="--c:${x.color}" title="${x.kind==='due'?'Due: ':''}${esc(x.title)}">${x.kind==='due'&&!multi?'<i>Due</i>':''}${esc(x.title)}</span>`).join('')
    +(more>0?`<button class="pl-ad more" data-act="day" data-day="${m.day}" title="${more} more · open ${esc(dayLabel(m.day))}">+${more}${multi&&limit<3?'':' more'}</button>`:'');
}
/* the timeline: hours down the side, one column per day */
function timelineHTML(days,mode,height){
  const pf=prefs(), hpx=PX[mode==='today'?'today':'cal'], pxm=hpx/60, t=today(), nm=nowMin();
  const models=days.map(dayModel);
  const multi=days.length>1;
  const head=multi?`<div class="pl-dh"><div class="pl-gut"></div>${days.map(d=>{
      const st=d>=t?dayStats(d):null;
      return `<button class="pl-dhd${d===t?' now':''}${d===S.day&&S.view!=='day'?'':''}" data-act="day" data-day="${d}" title="Open ${esc(dayLabel(d))}">
        <span>${WEEK[wd(d)]}</span><b>${+d.slice(8)}</b>${st?`<em title="${st.planned?durLong(st.planned)+' planned':''}${st.planned&&st.free?' · ':''}${st.free?durLong(st.free)+' free':''}">${st.planned?durTxt(st.planned)+' planned':st.free?(days.length>3?Math.round(st.free/60)+'h':durTxt(st.free))+' free':''}</em>`:'<em></em>'}</button>`; }).join('')}</div>`:'';
  const anyAll=models.some(m=>mode==='today'?m.all.some(x=>x.kind!=='due'):m.all.length);
  const allRow=anyAll?`<div class="pl-allrow"><div class="pl-gut"><span>all day</span></div>${models.map(m=>`<div class="pl-allc">${allDayCell(m,mode,multi?(days.length>3?2:3):4,multi)}</div>`).join('')}</div>`:'';
  const cols=models.map(m=>{
    const items=layout(m.items.slice(),pxm);
    const now=m.day===t?`<i class="pl-now" style="top:${(nm*pxm).toFixed(1)}px"></i>`:'';
    return `<div class="pl-col${m.day===t?' today':''}${m.day<t?' gone':''}" data-day="${m.day}">
      <div class="pl-off" style="top:0;height:${(pf.dayStart*pxm).toFixed(1)}px"></div>
      <div class="pl-off" style="top:${(pf.dayEnd*pxm).toFixed(1)}px;bottom:0"></div>
      ${items.map(i=>itemHTML(i,pxm,multi)).join('')}${now}</div>`;
  }).join('');
  return `<div class="pl-tl pl-m-${mode}${multi?' multi':''}${S.placing?' placing':''}" style="--hpx:${hpx}px">
    ${head}${allRow}
    <div class="pl-scroll" data-mode="${mode}" style="height:${height}">
      <div class="pl-grid" style="height:${24*hpx}px">
        <div class="pl-hrs">${hourLabels(hpx)}</div>
        <div class="pl-cols">${cols}</div>
      </div>
    </div></div>`;
}
/* keep each timeline's scroll where it was across a redraw; the first time,
   start an hour before now (or at the start of your day) */
function rememberScroll(root){ root.querySelectorAll('.pl-scroll').forEach(s=>{ S.scroll[s.dataset.mode]=s.scrollTop; }); }
function restoreScroll(root,days){
  root.querySelectorAll('.pl-scroll').forEach(s=>{
    const mode=s.dataset.mode;
    if(S.scroll[mode]!=null){ s.scrollTop=S.scroll[mode]; return; }
    const hpx=PX[mode==='today'?'today':'cal'];
    const anchor=days.includes(today())?Math.max(0,nowMin()-75):prefs().dayStart-30;
    s.scrollTop=Math.max(0,anchor/60*hpx);
    S.scroll[mode]=s.scrollTop;
  });
}

/* ── the "Your day" card on Today ── */
function nowNext(){
  const t=today(), nm=nowMin(), m=dayModel(t);
  const real=m.items.filter(i=>i.kind!=='ghost'&&!(i.kind==='event'&&i.free));
  const now=real.filter(i=>i.s<=nm&&i.e>nm).sort((a,b)=>(a.kind==='task'?0:1)-(b.kind==='task'?0:1))[0];
  const next=real.filter(i=>i.s>nm).sort((a,b)=>a.s-b.s)[0];
  return {now,next,model:m};
}
function nowLine(){
  const {now,next}=nowNext(), nm=nowMin();
  const focusBtn=i=>i&&i.kind==='task'&&!i.done&&(i.a||i.x)?`<button class="pl-mini go" data-act="focus" data-k="${esc(i.k)}">Focus</button>`:'';
  if(now) return `<div class="pl-nowl"><i style="--c:${now.color}"></i><div><span>Now · until ${hm(now.e)}</span><b>${esc(now.title)}</b></div>${focusBtn(now)}</div>`;
  if(next){ const inMin=next.s-nm;
    return `<div class="pl-nowl next"><i style="--c:${next.color}"></i><div><span>Next · ${inMin<60?'in '+inMin+' min':'at '+hm(next.s)}</span><b>${esc(next.title)}</b></div>${inMin<=15?focusBtn(next):''}</div>`; }
  return '';
}
function unplannedToday(){
  const t=today();
  return todayList().filter(a=>openA(a)&&!P().blocks.some(b=>b.day===t&&(b.aid===a.id||(a.habitId&&b.hid===a.habitId)))
    &&!P().routines.some(r=>r.kind==='habit'&&a.habitId===r.hid&&routineOn(r,t)))
    .sort((x,y)=>(doScore(y)||0)-(doScore(x)||0));
}
function chipHTML(a,two){
  const e=estOf(a), left=leftToPlan(a);
  const on=S.placing&&S.placing.src==='a:'+a.id;
  const d=a.due?dDelta(a.due):null;
  const due=two?(a.habitId?'habit':a.due?(d<0?`<span class="over">${esc(dRel(a.due).toLowerCase())}</span>`:d===0?'due today':'due '+esc(dMini(a.due))):'no date'):'';
  const planned=two&&left<MINB&&plannedAhead(a.id)>0;
  return `<div class="pl-chip${on?' on':''}${two?' two':''}${planned?' planned':''}" data-pl-src="a:${a.id}" tabindex="0" role="button"
      title="Drag onto a time, or tap it and then tap a time" style="--c:${colorOfA(a)}">
    <i class="pl-dot"></i>
    <span class="pl-chip-b"><span class="pl-chip-t">${esc(a.title)}</span>${two?`<span class="pl-chip-m">${a.classId?esc(clsShort(a.classId))+' · ':''}${due}${planned?' · planned ✓':left>0&&left<e.m?' · '+durTxt(left)+' left to plan':''}</span>`:''}</span>
    <span class="pl-est${e.guess?' guess':''}" title="${e.guess?'A guess. Change it on the task, or drag the block longer.':'Your estimate'}">${e.guess?'~':''}${durTxt(e.m)}</span>
  </div>`;
}
function bannersHTML(mode){
  let h='';
  if(S.ghosts&&S.ghosts.length){
    const g=S.ghosts;
    const days=[...new Set(g.map(x=>x.day))];
    h+=`<div class="pl-bar sug"><span class="pl-spark">✦</span><div><b>Suggested: ${g.length} block${g.length===1?'':'s'} · ${durTxt(sum(g,x=>x.dur))}</b>
      <span>${days.length>1?`across ${days.length} days, `:''}fitted around your commitments, most urgent first. Drag any of them to adjust.</span></div>
      <button class="pbtn go sm" data-act="keep">Keep it</button><button class="pbtn sm" data-act="discard">Discard</button></div>`;
  }
  const sl=slippedBlocks();
  if(sl.length&&!S.ghosts) h+=`<div class="pl-bar warn"><span class="pl-spark">↻</span><div><b>${sl.length} planned block${sl.length===1?'':'s'} slipped by</b>
      <span>${esc(sl.slice(0,2).map(b=>(taskOf(b)||{}).title).filter(Boolean).join(', '))}${sl.length>2?' and more':''}</span></div>
      <button class="pbtn sm" data-act="rescue">Find new times</button></div>`;
  if(S.placing){ const si=srcInfo(S.placing.src);
    if(si) h+=`<div class="pl-bar place"><span class="pl-spark">◎</span><div><b><span class="pl-how-m">Click</span><span class="pl-how-t">Tap</span> a time for “${esc(si.title)}”</b><span>${durLong(si.dur)} block</span></div>
      <button class="pbtn sm" data-act="cancel-place">Cancel</button></div>`; }
  return h;
}
function paintToday(){
  const el=$('td-plan'); if(!el) return;
  const t=today(), st=dayStats(t), pf=prefs();
  const un=unplannedToday();
  const feeds=P().feeds.length;
  let hint='';
  try{ if(!feeds&&!localStorage.getItem(LS_HINT)) hint=`<div class="pl-hint"><span>See your classes and other plans here.</span>
    <button class="pl-link" data-act="connect">Connect Google Calendar</button><button class="pl-x" data-act="hint-x" title="Hide this" aria-label="Hide this">×</button></div>`; }catch(e){}
  const html=`<div class="pcard-h"><span class="pcard-t">Your day</span>
      <span class="pcard-s" title="Free time left between your commitments, ${hm(pf.dayStart)} to ${hm(pf.dayEnd)}">${st.free?durTxt(st.free)+' free':'no free time left'}${st.planned?' · '+durTxt(st.planned)+' planned':''}</span></div>
    ${nowLine()}
    ${bannersHTML('today')}
    ${un.length?`<div class="pl-unpl"><span class="eyebrow">Not on the clock yet<span class="pl-how-m"> · drag onto a time</span><span class="pl-how-t"> · tap one, then a time</span></span><div class="pl-chips">${un.slice(0,8).map(a=>chipHTML(a)).join('')}${un.length>8?`<button class="pl-chipmore" data-act="pick" data-day="${t}">+${un.length-8} more</button>`:''}</div></div>`:''}
    ${timelineHTML([t],'today','440px')}
    ${hint}
    <div class="pl-foot"><button class="pbtn sm" data-act="plan" title="Fill your free time with what's most urgent">✦ Plan my day</button>
      <button class="pbtn sm" data-act="pick" data-day="${t}" title="Put any open task on today">+ Task</button>
      <button class="pl-link" data-act="open-cal">Calendar →</button></div>`;
  const sig=html.replace(/<i class="pl-now"[^>]*><\/i>/,'');
  if(sig===S.todaySig&&el.firstChild) { syncNow(); return; }
  S.todaySig=sig;
  rememberScroll(el);
  el.innerHTML=html;
  restoreScroll(el,[t]);
}

/* ── the Calendar tab ── */
function viewDays(){
  const d=S.day||today();
  if(S.view==='week'){ const s=addDays(d,-((wd(d)-prefs().weekStart+7)%7)); return [0,1,2,3,4,5,6].map(i=>addDays(s,i)); }
  if(S.view==='3day') return [d,addDays(d,1),addDays(d,2)];
  return [d];
}
function phone(){ return matchMedia('(max-width:760px)').matches; }
function trayGroups(){
  const d=S.day||today(), t=today(), q=S.q.trim().toLowerCase();
  const open=db.assignments.filter(openA).filter(a=>!q||a.title.toLowerCase().includes(q)||clsName(a.classId).toLowerCase().includes(q)||(a.notes||'').toLowerCase().includes(q));
  const used=new Set(), G=[];
  const add=(key,title,list,collapsible)=>{ list=list.filter(a=>!used.has(a.id)); list.forEach(a=>used.add(a.id)); if(list.length) G.push({key,title,list,collapsible}); };
  const by=(x,y)=>(doScore(y)||0)-(doScore(x)||0)||(x.due||'9999').localeCompare(y.due||'9999');
  if(d===t){ const tl=new Set(todayList().map(a=>a.id)); add('today','Today’s list',open.filter(a=>tl.has(a.id)).sort(by)); }
  else add('day','Due '+dayLabel(d,true),open.filter(a=>a.due===d).sort(by));
  add('over','In the reeds · overdue',open.filter(a=>a.due&&a.due<t&&!a.habitId).sort(by));
  add('soon','Coming up · next 7 days',open.filter(a=>a.due&&!a.habitId&&a.due>=t&&daysBetween(d,a.due)!==null&&daysBetween(d,a.due)<=7&&a.due!==d).sort((x,y)=>x.due.localeCompare(y.due)||by(x,y)));
  add('later','Later',open.filter(a=>a.due&&!a.habitId&&a.due>d).sort((x,y)=>x.due.localeCompare(y.due)),true);
  add('none','No due date',open.filter(a=>!a.due).sort(by),true);
  return G;
}
function examsHTML(){
  const t=today();
  const ex=(db.exams||[]).filter(x=>!x.done&&!clsArchived(x.classId)&&x.examDate&&x.examDate>=t&&daysBetween(t,x.examDate)<=21)
    .filter(x=>!S.q||x.title.toLowerCase().includes(S.q.trim().toLowerCase()))
    .sort((a,b)=>a.examDate.localeCompare(b.examDate));
  if(!ex.length) return '';
  return `<div class="pl-grp"><div class="pl-grp-h"><span>Exams · study blocks</span><em>${ex.length}</em></div>
    ${ex.map(x=>{ const on=S.placing&&S.placing.src==='x:'+x.id, n=daysBetween(t,x.examDate);
      return `<div class="pl-chip two${on?' on':''}" data-pl-src="x:${x.id}" tabindex="0" role="button" style="--c:${x.classId?clsCol(x.classId):'#715c95'}" title="Drag to set aside study time">
      <i class="pl-dot sq"></i><span class="pl-chip-b"><span class="pl-chip-t">Study: ${esc(x.title)}</span>
      <span class="pl-chip-m">${x.classId?esc(clsShort(x.classId))+' · ':''}${n===0?'today':n===1?'tomorrow':'in '+n+' days'}</span></span><span class="pl-est">1h</span></div>`; }).join('')}</div>`;
}
function trayHTML(){
  const G=trayGroups();
  return `<div class="pl-tray">
    <div class="pl-tray-h"><span class="pcard-t" style="font-size:20px">To plan</span><span class="pcard-s"><span class="pl-how-m">drag onto a time</span><span class="pl-how-t">tap one, then a time</span></span></div>
    <input class="pl-q" id="pl-q" placeholder="Search tasks…" autocomplete="off" spellcheck="false" value="${esc(S.q)}">
    <div class="pl-tray-l" id="pl-tray-l">${trayListHTML(G)}</div></div>`;
}
function trayListHTML(G){
  G=G||trayGroups();
  const body=G.map(g=>{
    const open=!g.collapsible||S.open[g.key]||S.q;
    return `<div class="pl-grp"><div class="pl-grp-h${g.collapsible?' tog':''}" ${g.collapsible?`data-act="grp" data-g="${g.key}"`:''}><span>${esc(g.title)}</span><em>${g.list.length}${g.collapsible&&!S.q?(open?' ▾':' ▸'):''}</em></div>
      ${open?g.list.slice(0,60).map(a=>chipHTML(a,true)).join('')+(g.list.length>60?`<p class="pl-more">and ${g.list.length-60} more · search to find them</p>`:''):''}</div>`;
  }).join('')+examsHTML();
  return body||`<p class="pl-empty">${S.q?'No open tasks match that.':'Nothing open. Enjoy it.'}</p>`;
}
function miniMonthHTML(){
  const t=today(), sel=S.day||t;
  const mk=S.month||sel.slice(0,7);
  const [y,mo]=mk.split('-').map(Number);
  const first=`${mk}-01`, ws=prefs().weekStart;
  const lead=(wd(first)-ws+7)%7, dim=new Date(Date.UTC(y,mo,0)).getUTCDate();
  const dueN={}, planN={};
  db.assignments.forEach(a=>{ if(openA(a)&&a.due&&a.due.startsWith(mk)&&!a.habitId) dueN[a.due]=(dueN[a.due]||0)+1; });
  P().blocks.forEach(b=>{ if(b.kind==='task'&&b.day.startsWith(mk)) planN[b.day]=1; });
  (db.exams||[]).forEach(x=>{ if(!x.done&&x.examDate&&x.examDate.startsWith(mk)) dueN[x.examDate]=(dueN[x.examDate]||0)+1; });
  let cells='';
  for(let i=0;i<lead;i++) cells+='<span></span>';
  const vd=new Set(viewDays());
  for(let d=1;d<=dim;d++){
    const k=`${mk}-${p2(d)}`;
    cells+=`<button data-act="day" data-day="${k}" class="${k===t?'td ':''}${vd.has(k)?'on ':''}${k<t?'gone':''}" title="${esc(dayLabel(k))}${dueN[k]?` · ${dueN[k]} due`:''}">${d}${dueN[k]||planN[k]?`<i>${dueN[k]?'<b class="du"></b>':''}${planN[k]?'<b class="pn"></b>':''}</i>`:''}</button>`;
  }
  const hdr=[0,1,2,3,4,5,6].map(i=>WEEK[(i+ws)%7][0]).map(x=>`<em>${x}</em>`).join('');
  return `<div class="pl-mm"><div class="pl-mm-h"><button class="pl-ib" data-act="mon" data-d="-1" aria-label="Previous month">‹</button>
      <b>${MONTH_NAMES[mo-1]} ${y}</b><button class="pl-ib" data-act="mon" data-d="1" aria-label="Next month">›</button></div>
    <div class="pl-mm-g">${hdr}${cells}</div>
    <div class="pl-mm-k"><span><b class="du"></b>due</span><span><b class="pn"></b>planned</span></div></div>`;
}
function statusHTML(){
  const feeds=P().feeds;
  if(!feeds.length) return `<div class="pl-stat"><span>No calendar connected</span><button class="pl-link" data-act="connect">Connect Google Calendar</button></div>`;
  const bad=feeds.find(f=>S.feedStatus[f.id]&&!S.feedStatus[f.id].ok);
  const at=P().cal.at;
  let msg=S.fetching?'Updating your calendar…':at?`Calendar updated ${agoTxt(Math.max(at,lastFetch()))}`:'Not read yet';
  if(bad){ const e=S.feedStatus[bad.id].err; msg=e==='restart'?'Restart Catching Days to read your calendar':`“${bad.name}” couldn’t be read`; }
  if(MODE==='hosted'&&!S.fetching&&!bad) msg=at?`Calendar from your laptop, ${agoTxt(at)}`:'Calendar arrives from your laptop';
  return `<div class="pl-stat${bad?' bad':''}"><span>${esc(msg)}</span><button class="pl-ib" data-act="refresh" title="Read your calendars again" aria-label="Refresh calendars"${S.fetching?' disabled':''}>⟳</button><button class="pl-link" data-act="settings">Calendars</button></div>`;
}
function agoTxt(ts){ const m=Math.round((Date.now()-ts)/MIN); return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' days ago'; }
function paintStatus(){ document.querySelectorAll('.pl-stat-host').forEach(el=>{ el.innerHTML=statusHTML(); }); }
function headSub(){
  const days=viewDays();
  if(days.length===1) return esc(dayLabel(days[0]));
  const a=days[0], b=days[days.length-1];
  return `${MON[+a.slice(5,7)-1]} ${+a.slice(8)} – ${a.slice(5,7)===b.slice(5,7)?'':MON[+b.slice(5,7)-1]+' '}${+b.slice(8)}`;
}
function paint(){
  const el=$('cal-body'); if(!el) return;
  if(!S.day||(S.followToday&&S.day!==today())) S.day=today();
  if(phone()&&S.view==='week') S.view='3day';
  const days=viewDays(), t=today();
  const ds=days.length===1?dayStats(days[0]):null;
  const sub=ds?`${headSub()}<span class="pl-psub">${days[0]>=t?(ds.free?durTxt(ds.free)+' free':'no free time')+' · ':''}${ds.planned?durTxt(ds.planned)+' planned':'nothing planned yet'}</span>`:headSub();
  const views=[['day','Day'],['3day','3 days'],['week','Week']].filter(v=>!(phone()&&v[0]==='week'));
  const html=`<div class="pl-cal">
    <div class="phead pl-phead"><div><h1 class="ptitle">Calendar</h1><div class="psub">${sub}</div></div>
      <div class="pl-ctl">
        <div class="pl-nav"><button class="pl-ib" data-act="prev" aria-label="Back">‹</button><button class="pbtn sm" data-act="today">Today</button><button class="pl-ib" data-act="next" aria-label="Forward">›</button></div>
        <div class="seg-wrap">${views.map(([k,n])=>`<button class="seg${S.view===k?' on':''}" data-act="view" data-v="${k}">${n}</button>`).join('')}</div>
        <button class="pbtn go sm" data-act="plan" title="Fill the free time with what's most urgent">✦ Plan my ${S.view==='day'?'day':S.view==='week'?'week':'days'}</button>
        <button class="pl-ib" data-act="settings" title="Calendars and planner settings" aria-label="Calendars and planner settings">⚙</button>
      </div></div>
    <div class="pl-cgrid">
      <aside class="pl-side">${miniMonthHTML()}<div class="pl-stat-host">${statusHTML()}</div>${trayHTML()}</aside>
      <section class="pl-main pcard">${bannersHTML('cal')}${timelineHTML(days,'cal','min(72vh,calc(100vh - 230px))')}</section>
    </div></div>`;
  const sig=html.replace(/<i class="pl-now"[^>]*><\/i>/,'');
  if(sig===S.calSig&&el.firstChild){ syncNow(); return; }
  S.calSig=sig;
  const q=document.activeElement&&document.activeElement.id==='pl-q', caret=q?document.activeElement.selectionStart:0;
  const trayScroll=el.querySelector('.pl-tray-l')?el.querySelector('.pl-tray-l').scrollTop:0;
  rememberScroll(el);
  el.innerHTML=html;
  restoreScroll(el,days);
  const tl=el.querySelector('.pl-tray-l'); if(tl) tl.scrollTop=trayScroll;
  if(q){ const i=$('pl-q'); if(i){ i.focus(); try{ i.setSelectionRange(caret,caret); }catch(e){} } }
}
function syncNow(){
  const nm=nowMin(), t=today();
  document.querySelectorAll('.pl-col.today .pl-now').forEach(n=>{
    const hpx=parseFloat(getComputedStyle(n.closest('.pl-tl')).getPropertyValue('--hpx'))||PX.cal;
    n.style.top=(nm*hpx/60).toFixed(1)+'px';
  });
  if(S.lastPaintDay&&S.lastPaintDay!==t){ S.scroll={}; }
  S.lastPaintDay=t;
}
function rerender(){
  S.items=new Map();
  S.todaySig=''; S.calSig='';
  if(typeof cur!=='undefined'){
    if(cur==='daily'&&$('td-plan')) paintToday();
    if(cur==='cal') paint();
  }
  if(S.pop) positionPop();
}
/* the app's own repaint: redraw, but never under a drag, an open popover
   or the search box being typed in */
function refresh(){
  if(D||PD) return;
  if(cur==='cal'){ if(S.pop) return; paint(); }
}

/* ═══════════════ popovers ═══════════════ */
function closePop(){ const p=$('pl-pop'); if(p) p.remove(); S.pop=null; }
function openPop(html,anchorKey,at){
  closePop();
  if(phone()) hideUndo();                  // the sheet sits where the undo bar does
  const p=document.createElement('div');
  p.id='pl-pop'; p.className='pl-pop'; p.setAttribute('role','dialog');
  p.innerHTML=html;
  document.body.appendChild(p);
  S.pop={k:anchorKey, at};
  positionPop();
  const f=p.querySelector('[autofocus]'); if(f&&!phone()) f.focus();
}
function positionPop(){
  const p=$('pl-pop'); if(!p||!S.pop) return;
  if(phone()){ p.classList.add('sheet'); return; }
  let r=null;
  if(S.pop.k){ const el=document.querySelector(`.pl-it[data-k="${CSS.escape(S.pop.k)}"]`); if(el) r=el.getBoundingClientRect(); }
  if(!r&&S.pop.at) r={left:S.pop.at.x,right:S.pop.at.x,top:S.pop.at.y,bottom:S.pop.at.y,width:0,height:0};
  if(!r){ closePop(); return; }
  const W=p.offsetWidth, H=p.offsetHeight, vw=innerWidth, vh=innerHeight;
  let x=r.right+10; if(x+W>vw-12) x=r.left-W-10; if(x<12) x=clamp(r.left,12,vw-W-12);
  let y=clamp(r.top,12,vh-H-12);
  if(x===clamp(r.left,12,vw-W-12)&&r.bottom+H+10<vh) y=r.bottom+8;
  p.style.left=x+'px'; p.style.top=y+'px';
}
function popItem(it){
  S.sel=it.k;
  let h='';
  const t=it.title;
  if(it.kind==='event'){
    const f=feedById(it.feed);
    h=`<div class="pl-pop-h" style="--c:${it.color}"><i></i><b>${esc(t)}</b></div>
      <p class="pl-pop-m">${esc(dayLabel(it.day))}<br>${range(it.s,it.e)}${it.free?' · shows as free':''}</p>
      ${it.sub?`<p class="pl-pop-m">📍 ${esc(it.sub)}</p>`:''}
      <p class="pl-pop-n">From ${esc(f?f.name:'your calendar')}. Change it in Google Calendar; it updates here.</p>`;
  } else if(it.kind==='ghost'){
    const si=srcInfo(it.g.src);
    h=`<div class="pl-pop-h" style="--c:${it.color}"><i></i><b>${esc(t)}</b></div>
      <p class="pl-pop-m">Suggested · ${range(it.s,it.e)} · ${durLong(it.e-it.s)}</p>
      ${si&&si.a?`<p class="pl-pop-n">${esc(whyLine(si.a))}</p>`:''}
      <div class="pl-pop-b"><button class="pbtn sm" data-act="ghost-x" data-k="${esc(it.k)}">Leave this one out</button></div>`;
  } else if(it.kind==='busy'){
    h=`<div class="pl-pop-h" style="--c:${BUSY_C}"><i></i><input class="pl-pop-in" id="pl-busy-t" value="${esc(t)}" aria-label="Name" data-k="${esc(it.k)}"></div>
      <p class="pl-pop-m">${range(it.s,it.e)} · ${durLong(it.e-it.s)}${it.r?' · repeats '+esc(daysTxt(it.r.days)):''}</p>
      ${durRow(it)}
      <div class="pl-pop-b">${it.r?`<button class="pbtn sm" data-act="routine" data-id="${it.r.id}">Edit repeat</button><button class="pbtn sm" data-act="remove" data-k="${esc(it.k)}">Skip this day</button>`
        :`<button class="pbtn sm" data-act="repeat" data-k="${esc(it.k)}">Repeat weekly…</button><button class="pbtn sm danger" data-act="remove" data-k="${esc(it.k)}">Delete</button>`}</div>`;
  } else {
    const a=it.a, x=it.x;
    const e=a?estOf(a):null;
    const lines=[];
    if(a&&a.due&&!a.habitId) lines.push(`due ${esc(dRel(a.due).toLowerCase())}`);
    const sc=a&&!a.done?doScore(a):null; if(sc!=null) lines.push('do-score '+sc);
    if(x) lines.push(`${x.kind==='quiz'?'quiz':'exam'} ${esc(dRel(x.examDate).toLowerCase())}`);
    h=`<div class="pl-pop-h" style="--c:${it.color}"><i></i><b>${it.done?'✓ ':''}${esc(t)}</b></div>
      <p class="pl-pop-m">${range(it.s,it.e)} · ${durLong(it.e-it.s)}${it.sub?' · '+esc(it.sub):''}${lines.length?'<br>'+lines.join(' · '):''}</p>
      ${it.conflict?`<p class="pl-pop-w">Overlaps “${esc(it.conflict)}”</p>`:''}
      ${a?`<div class="pl-pop-est"><span>Task estimate</span><input type="number" min="5" max="600" step="5" id="pl-est" value="${e.m}" data-aid="${a.id}" aria-label="Estimate in minutes"><span>min${e.guess?' · <em>a guess</em>':''}</span></div>`:''}
      ${durRow(it)}
      <div class="pl-pop-b">
        ${!it.done&&(a||x)?`<button class="pbtn go sm" data-act="focus" data-k="${esc(it.k)}">Focus on it</button>`:''}
        ${a&&!a.ann?`<button class="pbtn sm" data-act="done" data-k="${esc(it.k)}">${a.done?'Not done':'Mark done'}</button>`:''}
        ${it.slipped?`<button class="pbtn sm" data-act="rescue1" data-k="${esc(it.k)}">Find a new time</button>`:''}
        ${(it.b&&it.b.hid)||it.r?`<button class="pbtn sm" data-act="${it.r?'routine':'habit-rt'}" data-k="${esc(it.k)}" data-id="${it.r?it.r.id:''}">${it.r?'Change every-time slot':'Same time every day'}</button>`:''}
        <button class="pbtn sm" data-act="remove" data-k="${esc(it.k)}">${it.r?'Skip this day':'Unplan'}</button>
      </div>`;
  }
  openPop(h,it.k);
  rerenderSel();
}
function whyLine(a){
  const d=a.due?dDelta(a.due):null;
  if(a.habitId) return 'A habit due today.';
  if(d!==null&&d<0) return 'Overdue, so it goes first.';
  if(d===0) return 'Due today.';
  if(d!==null&&d<=2) return `Due ${dRel(a.due).toLowerCase()}.`;
  return `Do-score ${doScore(a)||0}: it’s next most urgent.`;
}
function durRow(it){
  return `<div class="pl-pop-d"><span>Length</span><button class="pl-ib sm" data-act="len" data-d="-15" data-k="${esc(it.k)}" aria-label="15 minutes shorter">−</button>
    <b>${durLong(it.e-it.s)}</b><button class="pl-ib sm" data-act="len" data-d="15" data-k="${esc(it.k)}" aria-label="15 minutes longer">+</button></div>`;
}
function daysTxt(days){
  const d=(days||[]).slice().sort();
  if(d.length===7) return 'every day';
  if(d.join()==='1,2,3,4,5') return 'on weekdays';
  if(d.join()==='0,6') return 'on weekends';
  return 'on '+d.map(i=>WEEK[i]).join(', ');
}
function rerenderSel(){
  document.querySelectorAll('.pl-it.sel').forEach(e=>e.classList.remove('sel'));
  if(S.sel){ const el=document.querySelector(`.pl-it[data-k="${CSS.escape(S.sel)}"]`); if(el) el.classList.add('sel'); }
}
/* tapping an empty time: plan a task there, or block the time off */
function popNew(day,s,e,at){
  S.sel=null; rerenderSel();
  const len=e-s;
  openPop(`<div class="pl-pop-h"><b>${esc(dayLabel(day,true))} · ${range(s,e)}</b></div>
    <div class="pl-pop-b col"><button class="pbtn go sm" data-act="pick" data-day="${day}" data-s="${s}" data-len="${len}">Plan a task here…</button></div>
    <div class="pl-pop-or">or block off the time</div>
    <div class="pl-pop-new"><input class="pl-pop-in" id="pl-new-t" placeholder="e.g. Gym, lunch, club meeting" autocomplete="off" autofocus>
      <label class="pl-pop-rep"><input type="checkbox" id="pl-new-r"> every ${WEEK_L[wd(day)]}</label>
      <button class="pbtn sm" data-act="add-busy" data-day="${day}" data-s="${s}" data-len="${len}">Add</button></div>`,null,at);
  const i=$('pl-new-t'); if(i) i.onkeydown=ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); act('add-busy',document.querySelector('#pl-pop [data-act="add-busy"]')); } };
}

/* ═══════════════ dialogs ═══════════════ */
let _pick=null;
function pickModal(day,s,len){
  _pick={day,s:s==null?null:+s,len:len?+len:null,q:''};
  modal(`<h2>Plan a task</h2>
    <p class="dim" style="font-size:12.5px;margin:5px 0 14px">${_pick.s!=null?`Goes in at ${hm(_pick.s)} on ${esc(dayLabel(day,true))}.`:`Goes into the next free time on ${esc(dayLabel(day,true))}.`} Most urgent first.</p>
    <input id="pl-pick-q" placeholder="Search tasks…" autocomplete="off" spellcheck="false">
    <div id="pl-pick-l" class="pl-pick" style="max-height:48vh;overflow:auto;margin-top:12px"></div>
    <div class="row" style="gap:9px;margin-top:16px"><button class="ghost" onclick="closeModal()">Cancel</button></div>`,true);
  const q=$('pl-pick-q'); q.oninput=()=>{ _pick.q=q.value; pickList(); }; q.focus();
  pickList();
}
function pickList(){
  const el=$('pl-pick-l'); if(!el) return;
  const q=_pick.q.trim().toLowerCase();
  const need=new Map();
  let rows=candidates(_pick.day,need).map(r=>r.src);
  const seen=new Set(rows);
  db.assignments.filter(openA).forEach(a=>{ if(!seen.has('a:'+a.id)&&(!a.habitId||a.due===_pick.day)) rows.push('a:'+a.id); });
  rows=rows.map(srcInfo).filter(Boolean).filter(si=>!q||si.title.toLowerCase().includes(q)||(si.a&&clsName(si.a.classId).toLowerCase().includes(q)));
  el.innerHTML=rows.length?rows.slice(0,80).map(si=>{
    const a=si.a, d=a&&a.due?dDelta(a.due):null;
    return `<button class="pl-pick-r" data-src="${si.src}" style="--c:${si.color}"><i class="pl-dot"></i><span><b>${esc(si.title)}</b>
      <em>${a?(a.classId?esc(clsShort(a.classId))+' · ':'')+(a.habitId?'habit':a.due?(d<0?esc(dRel(a.due).toLowerCase()):'due '+esc(dMini(a.due))):'no date'):''}</em></span>
      <span class="pl-est${si.est.guess?' guess':''}">${si.est.guess?'~':''}${durTxt(si.est.m)}</span></button>`; }).join('')
    :`<p class="empty">${q?'Nothing open matches that.':'Nothing open to plan.'}</p>`;
  el.querySelectorAll('.pl-pick-r').forEach(b=>b.onclick=()=>pickChoose(b.dataset.src));
}
function pickChoose(src){
  const si=srcInfo(src); if(!si) return;
  const p=_pick; closeModal(); closePop();
  let s=p.s, len=si.dur;
  if(s!=null&&p.len&&p.len!==30) len=p.len;                 // you drew a length: keep it
  if(s==null){
    const pf=prefs(); let from=pf.dayStart; if(isToday(p.day)) from=Math.max(from,Math.ceil((nowMin()+5)/SNAP)*SNAP);
    const f=freeIn(dayModel(p.day),from,pf.dayEnd,{gap:pf.gap}).find(([a,b])=>b-a>=Math.min(len,30));
    if(!f){ toast('No free time left that day. Pick a time on the timeline instead.'); return; }
    s=f[0]; len=Math.min(len,Math.floor((f[1]-f[0])/5)*5);
  }
  place(src,p.day,s,len);
}
function connectModal(){
  modal(`<h2>Connect Google Calendar</h2>
    <p class="dim" style="font-size:13px;margin:6px 0 14px;line-height:1.55">Catching Days reads your calendar through its private address. Nothing is changed in Google, and the address stays on this computer and in your own synced data.</p>
    <ol class="pl-steps">
      <li>Open <a href="https://calendar.google.com/calendar/u/0/r/settings" target="_blank" rel="noopener">Google Calendar settings</a>.</li>
      <li>On the left under <b>Settings for my calendars</b>, click the calendar you want (usually your name), then <b>Integrate calendar</b>.</li>
      <li>Copy <b>Secret address in iCal format</b> (it ends in <span class="mono">.ics</span>) and paste it below.</li>
    </ol>
    <label class="lbl" for="pl-c-url" style="margin-top:14px">Secret address</label>
    <input id="pl-c-url" placeholder="https://calendar.google.com/calendar/ical/…/basic.ics" autocomplete="off" spellcheck="false">
    <div class="row" style="gap:10px;margin-top:12px">
      <div style="flex:1"><label class="lbl" for="pl-c-name">Name</label><input id="pl-c-name" placeholder="Google Calendar" autocomplete="off"></div>
      <div><label class="lbl">Colour</label><div class="pl-sw" id="pl-c-col">${FEED_COLORS.map((c,i)=>`<button type="button" class="${i===P().feeds.length%FEED_COLORS.length?'on':''}" data-c="${c}" style="background:${c}" aria-label="Colour ${i+1}"></button>`).join('')}</div></div>
    </div>
    <p class="pl-c-msg" id="pl-c-msg"></p>
    <p class="dim" style="font-size:12px;margin:4px 0 0">Works with any calendar address that ends in .ics too: Outlook, Apple, Brightspace or Canvas. Add as many as you like.</p>
    <div class="row" style="gap:9px;margin-top:16px"><button class="primary" id="pl-c-go">Connect</button><button class="ghost" onclick="closeModal()">Cancel</button></div>`,true);
  const sw=$('pl-c-col');
  sw.onclick=e=>{ const b=e.target.closest('button'); if(!b) return; sw.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b)); };
  $('pl-c-go').onclick=connectGo;
  $('pl-c-url').onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); connectGo(); } };
  $('pl-c-url').focus();
}
async function connectGo(){
  const msg=$('pl-c-msg'), btn=$('pl-c-go');
  const url=feedUrl($('pl-c-url').value);
  const say=(t,bad)=>{ msg.textContent=t; msg.className='pl-c-msg'+(bad?' bad':' ok'); };
  if(!/^https:\/\/\S+$/i.test(url)){ say('Paste the whole address. It starts with https:// (or webcal://).',true); return; }
  if(/calendar\.google\.com\/calendar\/(u\/\d+\/)?(r|embed)/i.test(url)){ say('That’s the calendar page, not its iCal address. Use “Secret address in iCal format”.',true); return; }
  if(P().feeds.some(f=>feedUrl(f.url)===url)){ say('That calendar is already connected.',true); return; }
  if(MODE==='file'){ say('Open Catching Days with Start Catching Days.bat first.',true); return; }
  const name=($('pl-c-name').value||'').trim();
  const color=($('pl-c-col').querySelector('.on')||{}).dataset?.c||FEED_COLORS[0];
  btn.disabled=true; say('Reading your calendar…');
  let txt;
  try{ txt=await fetchFeed({url}); }
  catch(err){
    btn.disabled=false;
    if(err&&err.message==='restart') say('One more step: close the black “Catching Days” window and open the app again (that turns calendar reading on), then try this again.',true);
    else if(MODE==='hosted') say('This copy can’t read calendars directly. Connect it on your laptop and it will sync here.',true);
    else say((err&&err.message)||'Could not read that address.',true);
    return;
  }
  let r; try{ r=IC.parse(txt,{tz:TZ()}); }catch(e){ r=null; }
  if(!r){ btn.disabled=false; say('That address didn’t look like a calendar.',true); return; }
  const f={id:uid(), name:name||r.name||'Google Calendar', url, color, on:true, created:Date.now()};
  P().feeds.push(f);
  save(); closeModal();
  toast(`Connected “${f.name}”`);
  try{ localStorage.removeItem(LS_FETCH); }catch(e){}
  refreshFeeds(true,S.day);
}
function settingsModal(){
  const pf=prefs(), feeds=P().feeds, rts=P().routines;
  const tIn=(id,m)=>`<input type="time" id="${id}" value="${p2(Math.floor(m/60)%24)}:${p2(m%60)}" step="900">`;
  modal(`<h2>Calendar settings</h2>
    <span class="lbl" style="margin-top:16px">Calendars</span>
    <div class="pl-feeds">${feeds.length?feeds.map(f=>{ const st=S.feedStatus[f.id];
      return `<div class="pl-feed"><i style="background:${f.color}"></i><div><b>${esc(f.name)}</b><span>${st?(st.ok?`${st.n} events read ${agoTxt(st.at)}`:st.err==='restart'?'Restart Catching Days to read it':esc(st.err)):'Not read on this device yet'}</span></div>
        <button class="switch${f.on!==false?' on':''}" data-act="feed-on" data-id="${f.id}" aria-label="Show ${esc(f.name)}"><span class="knob"></span></button>
        <button class="xs danger" data-act="feed-del" data-id="${f.id}">Remove</button></div>`; }).join('')
      :'<p class="dim" style="font-size:13px;margin:0">No calendars yet.</p>'}
      <button class="sm" data-act="connect" style="margin-top:8px">+ Connect a calendar</button></div>
    <span class="lbl" style="margin-top:20px">Your day</span>
    <div class="pl-set-row"><span>Starts</span>${tIn('pl-s-start',pf.dayStart)}<span>ends</span>${tIn('pl-s-end',pf.dayEnd%DAYMIN)}</div>
    <p class="dim pl-set-n">Plan my day only fills this window. The rest is shaded.</p>
    <span class="lbl" style="margin-top:16px">Planning for you</span>
    <div class="pl-set-row"><span>At most</span><input type="number" id="pl-s-max" min="1" max="16" step="0.5" value="${pf.maxWork/60}"><span>hours of work a day</span></div>
    <div class="pl-set-row"><span>Longest block</span><input type="number" id="pl-s-blk" min="20" max="240" step="5" value="${pf.maxBlock}"><span>min, with</span><input type="number" id="pl-s-gap" min="0" max="60" step="5" value="${pf.gap}"><span>min breaks</span></div>
    <div class="pl-set-row"><span>Weeks start on</span><select id="pl-s-ws"><option value="0"${pf.weekStart===0?' selected':''}>Sunday</option><option value="1"${pf.weekStart===1?' selected':''}>Monday</option></select></div>
    <span class="lbl" style="margin-top:16px">Reminders</span>
    <div class="pl-set-row"><button class="switch${pf.remind?' on':''}" id="pl-s-rem" aria-label="Remind me when a planned block starts"><span class="knob"></span></button><span style="flex:1 1 220px">Remind me when a planned block starts${window.Notification&&Notification.permission==='denied'?' (the browser has notifications blocked, so it’ll be in the app only)':''}</span></div>
    ${rts.length?`<span class="lbl" style="margin-top:16px">Repeating</span><div class="pl-feeds">${rts.map(r=>{ const h=r.kind==='habit'?findHabit(r.hid):null;
      return `<div class="pl-feed"><i style="background:${r.kind==='habit'?HABIT_C:BUSY_C}"></i><div><b>${esc(h?h.name:r.title||'Busy')}</b><span>${range(r.start,r.start+r.dur)} · ${r.kind==='habit'?'whenever it’s due':esc(daysTxt(r.days))}</span></div>
        <button class="xs" data-act="routine" data-id="${r.id}">Edit</button><button class="xs danger" data-act="rt-del" data-id="${r.id}">Remove</button></div>`; }).join('')}</div>`:''}
    <div class="row" style="gap:9px;margin-top:20px"><button class="primary" id="pl-s-save">Save</button><button class="ghost" onclick="closeModal()">Cancel</button></div>`,true);
  $('pl-s-rem').onclick=e=>e.currentTarget.classList.toggle('on');
  $('pl-s-save').onclick=()=>{
    const tv=id=>{ const v=($(id).value||'').split(':'); return (+v[0]||0)*60+(+v[1]||0); };
    let s=tv('pl-s-start'), e=tv('pl-s-end'); if(e===0) e=DAYMIN;
    if(e<=s+60){ toast('The end of your day has to be at least an hour after it starts.'); return; }
    const rem=$('pl-s-rem').classList.contains('on');
    Object.assign(P().prefs,{dayStart:s, dayEnd:e, maxWork:clamp(Math.round(parseFloat($('pl-s-max').value)*60)||DEF.maxWork,30,960),
      maxBlock:clamp(+$('pl-s-blk').value||DEF.maxBlock,20,240), gap:clamp(+$('pl-s-gap').value||0,0,60), weekStart:+$('pl-s-ws').value||0, remind:rem});
    if(rem&&window.Notification&&Notification.permission==='default') try{ Notification.requestPermission(); }catch(err){}
    save(); closeModal(); rerender();
  };
  $('modals').querySelector('.modal').addEventListener('click',e=>{ const b=e.target.closest('[data-act]'); if(b){ e.stopPropagation(); act(b.dataset.act,b); } });
}
function routineModal(rid,fromKey){
  let r=rid?routineById(rid):null;
  const it=fromKey?S.items.get(fromKey):null;
  if(!r&&!it) return;
  const base=r||{kind:it.kind==='busy'?'busy':'habit', title:it.title, start:it.s, dur:it.e-it.s, days:[wd(S.day||today())], hid:it.b&&it.b.hid};
  const h=base.kind==='habit'?findHabit(base.hid):null;
  const days=new Set(base.days||[]);
  modal(`<h2>${r?'Repeat':'Repeat weekly'}</h2>
    ${base.kind==='busy'?`<label class="lbl" style="margin-top:14px" for="pl-r-t">Name</label><input id="pl-r-t" value="${esc(base.title||'')}" autocomplete="off">`
      :`<p class="dim" style="font-size:13px;margin:6px 0 0">${esc(h?h.name:'This habit')} goes at this time on every day it’s due.</p>`}
    <div class="pl-set-row" style="margin-top:14px"><span>From</span><input type="time" id="pl-r-s" step="900" value="${p2(Math.floor(base.start/60))}:${p2(base.start%60)}"><span>for</span><input type="number" id="pl-r-d" min="15" max="720" step="15" value="${base.dur}"><span>min</span></div>
    ${base.kind==='busy'?`<span class="lbl" style="margin-top:14px">On</span><div class="pl-wd" id="pl-r-w">${[0,1,2,3,4,5,6].map(i=>(i+prefs().weekStart)%7).map(i=>`<button type="button" class="${days.has(i)?'on':''}" data-i="${i}">${WEEK[i]}</button>`).join('')}</div>`:''}
    <div class="row" style="gap:9px;margin-top:20px"><button class="primary" id="pl-r-go">Save</button>${r?'<button class="danger" id="pl-r-del">Remove</button>':''}<button class="ghost" onclick="closeModal()">Cancel</button></div>`);
  const w=$('pl-r-w'); if(w) w.onclick=e=>{ const b=e.target.closest('button'); if(b) b.classList.toggle('on'); };
  if($('pl-r-del')) $('pl-r-del').onclick=()=>{ const before=snapshot(); P().routines=P().routines.filter(x=>x.id!==r.id); save(); closeModal(); closePop(); rerender(); undoToast('Removed the repeat',before); };
  $('pl-r-go').onclick=()=>{
    const v=($('pl-r-s').value||'0:0').split(':'), st=(+v[0]||0)*60+(+v[1]||0), du=clamp(+$('pl-r-d').value||30,15,720);
    const before=snapshot();
    const o=r||{id:uid(), kind:base.kind, created:Date.now(), from:today(), skip:[]};
    o.start=st; o.dur=Math.min(du,DAYMIN-st);
    if(o.kind==='busy'){ o.title=($('pl-r-t').value||'').trim()||'Busy'; o.days=[...w.querySelectorAll('button.on')].map(b=>+b.dataset.i).sort();
      if(!o.days.length){ toast('Pick at least one day.'); return; } }
    else o.hid=base.hid;
    if(!r){ P().routines.push(o); if(it&&it.b) P().blocks=P().blocks.filter(x=>x.id!==it.b.id); }
    save(); closeModal(); closePop(); rerender();
    undoToast(r?'Repeat updated':'Repeats from now on',before);
  };
}

/* ═══════════════ one place for every button ═══════════════ */
function act(a,el){
  const k=el&&el.dataset.k, it=k?S.items.get(k):null;
  switch(a){
    case 'prev': case 'next': { const n=S.view==='week'?7:S.view==='3day'?3:1; S.day=addDays(S.day||today(),a==='prev'?-n:n); S.followToday=false; S.month=null; S.ghosts=null; paint(); refreshFeeds(false,S.day); break; }
    case 'today': S.day=today(); S.followToday=true; S.month=null; S.scroll={}; paint(); break;
    case 'day': S.day=el.dataset.day; S.followToday=S.day===today(); S.month=null; if(cur!=='cal') tab('cal'); else { if(S.view!=='day'&&el.closest('.pl-dh,.pl-allrow')) S.view='day'; paint(); } refreshFeeds(false,S.day); break;
    case 'view': S.view=el.dataset.v; S.ghosts=null; paint(); break;
    case 'mon': { const mk=S.month||(S.day||today()).slice(0,7); const [y,m]=mk.split('-').map(Number); const d=new Date(Date.UTC(y,m-1+(+el.dataset.d),1)); S.month=`${d.getUTCFullYear()}-${p2(d.getUTCMonth()+1)}`; paint(); break; }
    case 'plan': planIt(); break;
    case 'keep': keepGhosts(); break;
    case 'discard': dropGhosts(); break;
    case 'ghost-x': if(it) removeItem(it); break;
    case 'rescue': rescue(); break;
    case 'rescue1': if(it&&(it.b||it.r)){ const before=snapshot(); closePop(); rescueOnly(it.b||detach(it),before); } break;
    case 'cancel-place': S.placing=null; rerender(); break;
    case 'pick': closePop(); pickModal(el.dataset.day||S.day||today(),el.dataset.s,el.dataset.len); break;
    case 'open-cal': S.day=today(); S.followToday=true; tab('cal'); break;
    case 'connect': closeModal(); connectModal(); break;
    case 'settings': closePop(); settingsModal(); break;
    case 'refresh': try{ localStorage.removeItem(LS_FETCH); }catch(e){} refreshFeeds(true,S.day); break;
    case 'hint-x': try{ localStorage.setItem(LS_HINT,'1'); }catch(e){} rerender(); break;
    case 'grp': { S.open[el.dataset.g]=!S.open[el.dataset.g]; const l=$('pl-tray-l'); if(l) l.innerHTML=trayListHTML(); S.calSig=''; break; }
    case 'focus': if(it) focusOn(it); break;
    case 'done': if(it&&it.a){ const was=it.a.done; closePop(); toggleAsg(it.a.id,!was); repaint(); rerender(); } break;
    case 'remove': if(it) removeItem(it); break;
    case 'len': if(it){ const d=+el.dataset.d, len=clamp((it.e-it.s)+d,MINB,DAYMIN-it.s);
        if(it.kind==='ghost'){ S.ghosts[it.gi].dur=len; rerender(); reopen(it.k); break; }
        moveItem(it,it.b?it.b.day:it.rday,it.s,len); reopen(S.sel); } break;
    case 'repeat': if(it) routineModal(null,it.k); break;
    case 'habit-rt': if(it) routineModal(null,it.k); break;
    case 'routine': closePop(); routineModal(el.dataset.id||(it&&it.r&&it.r.id)); break;
    case 'rt-del': { const before=snapshot(); P().routines=P().routines.filter(x=>x.id!==el.dataset.id); save(); closeModal(); rerender(); undoToast('Removed the repeat',before); break; }
    case 'add-busy': { const t=(($('pl-new-t')||{}).value||'').trim()||'Busy', rep=$('pl-new-r')&&$('pl-new-r').checked;
        const day=el.dataset.day, s=+el.dataset.s, len=+el.dataset.len||60; const before=snapshot();
        if(rep) P().routines.push({id:uid(),kind:'busy',title:t,start:s,dur:len,days:[wd(day)],from:day,skip:[],created:Date.now()});
        else P().blocks.push({id:uid(),day,start:s,dur:len,kind:'busy',title:t,created:Date.now()});
        closePop(); save(); rerender(); undoToast(rep?`“${t}” every ${WEEK_L[wd(day)]}`:`Blocked off ${range(s,s+len)}`,before); break; }
    case 'feed-on': { const f=feedById(el.dataset.id); if(f){ f.on=f.on===false; el.classList.toggle('on',f.on); save(); rerender(); if(f.on) refreshFeeds(true,S.day); } break; }
    case 'feed-del': { const f=feedById(el.dataset.id); if(!f) break;
        if(!confirm(`Disconnect “${f.name}”? Its events disappear from the planner. Nothing changes in Google Calendar.`)) break;
        P().feeds=P().feeds.filter(x=>x.id!==f.id); P().cal.ev=P().cal.ev.filter(e=>e.f!==f.id); delete S.feedStatus[f.id];
        save(); closeModal(); rerender(); settingsModal(); break; }
  }
}
function rescueOnly(b,before){
  const pf=prefs(), t=today();
  for(const day of [t,addDays(t,1),addDays(t,2)]){
    let from=pf.dayStart; if(day===t) from=Math.max(from,Math.ceil((nowMin()+5)/SNAP)*SNAP);
    const m=dayModel(day); m.items=m.items.filter(i=>!(i.b&&i.b.id===b.id));
    const f=freeIn(m,from,pf.dayEnd,{gap:pf.gap}).find(([s,e])=>e-s>=Math.min(b.dur,30));
    if(f){ b.day=day; b.start=f[0]; b.dur=Math.min(b.dur,Math.floor((f[1]-f[0])/5)*5); b.moved=(b.moved||0)+1;
      save(); rerender(); undoToast(`Moved to ${dayLabel(day,true)} · ${range(b.start,b.start+b.dur)}`,before); return; }
  }
  toast('No free time in the next few days to move it into.');
}
function reopen(k){ setTimeout(()=>{ const it=S.items.get(k); if(it) popItem(it); },0); }
function focusOn(it){
  closePop();
  if(it.a){ pickSel=new Set([it.a.id]); tab('run'); return; }
  if(it.x){ pickSel=new Set(); tab('run'); const n=$('in-name'); if(n&&!A) n.value='Study for '+it.x.title; }
}

/* ═══════════════ undo ═══════════════ */
let undoT=null;
function undoToast(msg,before){
  lastUndo=before;
  let el=$('pl-undo');
  if(!el){ el=document.createElement('div'); el.id='pl-undo'; el.className='pl-undo'; document.body.appendChild(el); }
  el.innerHTML=`<span>${esc(msg)}</span>${before?'<button type="button">Undo</button>':''}`;
  el.classList.remove('out'); void el.offsetWidth; el.classList.add('in');
  const b=el.querySelector('button');
  if(b) b.onclick=()=>{ if(lastUndo){ restore(lastUndo); lastUndo=null; } hideUndo(); rerender(); };
  clearTimeout(undoT); undoT=setTimeout(hideUndo,6000);
}
function hideUndo(){ const el=$('pl-undo'); if(!el) return; el.classList.add('out'); setTimeout(()=>{ if(el.classList.contains('out')) el.remove(); },250); }

/* ═══════════════ dragging ═══════════════
   Pointer events, so mouse, pen and touch all work. A mouse drag starts
   after a few pixels; a finger has to rest for a moment first, so a swipe
   still scrolls. While a finger drags, touchmove is cancelled (see below)
   so the page doesn't scroll out from under it. */
let PD=null, D=null;
function pxmOf(el){ const tl=el.closest('.pl-tl'); const h=tl?parseFloat(getComputedStyle(tl).getPropertyValue('--hpx')):PX.cal; return (h||PX.cal)/60; }
function minAt(col,y){ return (y-col.getBoundingClientRect().top)/pxmOf(col); }
function onDown(e){
  if(e.pointerType==='mouse'&&e.button!==0) return;
  const t=e.target;
  if(t.closest('#pl-pop,.pl-gx,button,input,select,textarea,a,label')) return;
  const it=t.closest('.pl-it'), chip=t.closest('[data-pl-src]'), col=t.closest('.pl-col'), cr=t.closest('#dr-list .cr[data-aid]');
  let src=null;
  /* the resize grip only counts on a block tall enough to have room for
     it, and on a touch screen only once the block is selected (tap first) */
  const grip=it&&t.closest('.pl-rs')&&(e.pointerType==='mouse'?it.offsetHeight>=16:it.offsetHeight>=30&&it.classList.contains('sel'));
  if(grip) src={type:'resize'};
  else if(it) src={type:'item'};
  else if(chip) src={type:'chip'};
  else if(col) src={type:'col'};
  else if(cr&&e.pointerType!=='touch'){ const a=asg(cr.dataset.aid); if(!openA(a)) return; src={type:'row'}; }
  else return;
  PD={src, x:e.clientX, y:e.clientY, id:e.pointerId, pt:e.pointerType, el:it||chip||col||cr, timer:null};
  if(src.type==='resize'){ e.preventDefault(); begin(e.clientX,e.clientY); return; }
  if(e.pointerType!=='mouse'&&src.type!=='col'&&src.type!=='row') PD.timer=setTimeout(()=>{ if(PD&&!D){ begin(PD.x,PD.y); try{ navigator.vibrate&&navigator.vibrate(8); }catch(err){} } },280);
}
function onMove(e){
  if(D){ if(e.pointerId!==D.id) return; D.x=e.clientX; D.y=e.clientY; update(); return; }
  if(!PD||e.pointerId!==PD.id) return;
  const dist=Math.hypot(e.clientX-PD.x,e.clientY-PD.y);
  if(PD.pt==='mouse'){ if(dist>5) begin(e.clientX,e.clientY); }
  else if(dist>10){ clearTimeout(PD.timer); PD=null; }
}
function onUp(e){
  if(D&&e.pointerId===D.id){ finish(true); return; }
  if(PD&&e.pointerId===PD.id){ clearTimeout(PD.timer); const p=PD; PD=null; tap(p,e); }
}
function onCancel(e){
  if(D&&e.pointerId===D.id) finish(false);
  if(PD&&e.pointerId===PD.id){ clearTimeout(PD.timer); PD=null; }
}
function begin(x,y){
  const p=PD; if(!p) return;
  clearTimeout(p.timer);
  let d=null;
  if(p.src.type==='resize'||p.src.type==='item'){
    const it=S.items.get(p.el.dataset.k);
    if(!it||it.kind==='event'){ PD=null; return; }
    const pxm=pxmOf(p.el), r=p.el.getBoundingClientRect();
    d={kind:p.src.type==='resize'?'resize':'move', it, el:p.el, dur:it.e-it.s, grab:(p.y-r.top)/pxm, y0:p.y, pxm};
    p.el.classList.add('pl-lift');
  } else if(p.src.type==='chip'||p.src.type==='row'){
    const src=p.src.type==='chip'?p.el.dataset.plSrc:'a:'+p.el.dataset.aid;
    const si=srcInfo(src); if(!si){ PD=null; return; }
    d={kind:'new', src, si, dur:si.dur, grab:.2*(si.dur), float:floatEl(si)};
  } else if(p.src.type==='col'){
    if(p.pt!=='mouse'){ PD=null; return; }
    d={kind:'draw', day:p.el.dataset.day, col:p.el, s0:snapM(minAt(p.el,p.y)), pxm:pxmOf(p.el)};
  }
  if(!d){ PD=null; return; }
  d.id=p.id; d.x=x; d.y=y; d.pt=p.pt;
  D=d; PD=null;
  closePop();
  document.body.classList.add('pl-dragging');
  if(d.kind==='new') d.grab=Math.min(d.dur,60)*.25;
  loop(); update();
}
function floatEl(si){
  const f=document.createElement('div');
  f.className='pl-float'; f.style.setProperty('--c',si.color);
  f.innerHTML=`<i class="pl-dot"></i><span>${esc(si.title)}</span><em>${durTxt(si.dur)}</em>`;
  document.body.appendChild(f);
  return f;
}
function preview(col,s,len,label,color){
  let pv=D.pv;
  if(!pv){ pv=D.pv=document.createElement('div'); pv.className='pl-pv'; }
  if(pv.parentNode!==col) col.appendChild(pv);
  const pxm=pxmOf(col);
  pv.style.top=(s*pxm)+'px'; pv.style.height=Math.max(18,len*pxm-2)+'px';
  pv.style.setProperty('--c',color||'#2f7a74');
  pv.innerHTML=`<b>${esc(range(s,s+len))}</b><span>${esc(label||'')}</span>`;
}
function hidePreview(){ if(D&&D.pv&&D.pv.parentNode) D.pv.remove(); }
function update(){
  if(!D) return;
  const under=document.elementFromPoint(D.x,D.y);
  const col=under&&under.closest('.pl-col');
  const tray=under&&under.closest('.pl-tray,.pl-unpl');
  if(D.kind==='resize'){
    if(Math.abs(D.y-D.y0)>3) D.moved=true;
    const len=clamp(snapM(D.dur+(D.y-D.y0)/D.pxm),MINB,DAYMIN-D.it.s);
    D.len=len; D.el.style.height=Math.max(20,len*D.pxm-2)+'px';
    const m=D.el.querySelector('.pl-it-m'); if(m) m.textContent=range(D.it.s,D.it.s+len)+' · '+durLong(len);
    return;
  }
  if(D.kind==='draw'){
    if(col!==D.col){ return; }
    const m=snapM(minAt(col,D.y)), s=Math.min(D.s0,m), e=Math.max(D.s0+SNAP,m);
    D.range=[s,clamp(e,s+SNAP,DAYMIN)];
    preview(col,D.range[0],D.range[1]-D.range[0],'new','#6f7a75');
    return;
  }
  if(D.float){ D.float.style.transform=`translate(${D.x+12}px,${D.y+10}px)`; D.float.classList.toggle('over',!!col); }
  if(col){
    const len=D.dur;
    let s=snapM(minAt(col,D.y)-D.grab);
    s=clamp(s,0,DAYMIN-len);
    D.target={day:col.dataset.day, start:s};
    const title=D.kind==='new'?D.si.title:D.it.title;
    preview(col,s,len,title,D.kind==='new'?D.si.color:D.it.color);
  } else {
    hidePreview();
    D.target=tray&&D.kind==='move'&&(D.it.kind==='task'||D.it.kind==='ghost')?{unplan:true}:null;
    if(D.el) D.el.classList.toggle('pl-out',!!D.target);
  }
}
function loop(){
  if(!D) return;
  const under=document.elementFromPoint(D.x,D.y);
  const sc=under&&under.closest('.pl-scroll');
  let moved=false;
  if(sc){
    const r=sc.getBoundingClientRect(), edge=40;
    /* only once the pointer has been well inside: passing over the edge on
       the way in mustn't scroll the day away from where you're aiming */
    if(D.y>r.top+edge&&D.y<r.bottom-edge) D.armed=sc;
    const v=D.armed!==sc?0:D.y<r.top+edge?-(r.top+edge-D.y):D.y>r.bottom-edge?(D.y-(r.bottom-edge)):0;
    if(v){ sc.scrollTop+=Math.sign(v)*Math.min(18,Math.ceil(Math.abs(v)/3)); moved=true; }
  }
  const vh=innerHeight;
  if(D.y<36&&scrollY>0){ scrollBy(0,-12); moved=true; }
  else if(D.y>vh-36){ scrollBy(0,12); moved=true; }
  if(moved) update();
  D.raf=requestAnimationFrame(loop);
}
function finish(commit){
  const d=D; D=null;
  cancelAnimationFrame(d.raf);
  document.body.classList.remove('pl-dragging');
  if(d.float) d.float.remove();
  if(d.pv&&d.pv.parentNode) d.pv.remove();
  if(d.el){ d.el.classList.remove('pl-lift','pl-out'); }
  /* the click that follows a drag must not tick a task or open anything */
  const stop=ev=>{ ev.stopPropagation(); ev.preventDefault(); };
  window.addEventListener('click',stop,{capture:true,once:true});
  setTimeout(()=>window.removeEventListener('click',stop,{capture:true}),60);
  if(!commit){ rerender(); return; }
  if(d.kind==='resize'){
    if(!d.moved){ rerender(); const it=S.items.get(d.it.k); if(it) popItem(it); return; }   // a tap on the grip is a tap on the block
    if(d.len&&d.len!==d.dur) moveItem(d.it,d.it.b?d.it.b.day:d.it.g?d.it.g.day:d.it.rday,d.it.s,d.len); else rerender(); return; }
  if(d.kind==='draw'){ if(d.range){ rerender(); popNew(d.day,d.range[0],d.range[1],{x:d.x,y:d.y}); } return; }
  if(!d.target){ rerender(); return; }
  if(d.target.unplan){ removeItem(d.it); return; }
  if(d.kind==='new'){ place(d.src,d.target.day,d.target.start,d.dur); return; }
  if(d.kind==='move'){
    const sameDay=(d.it.b&&d.it.b.day)||(d.it.g&&d.it.g.day)||d.it.rday;
    if(d.target.day===sameDay&&d.target.start===d.it.s){ rerender(); return; }
    moveItem(d.it,d.target.day,d.target.start);
  }
}
function tap(p,e){
  if(p.src.type==='item'||p.src.type==='resize'){
    const it=S.items.get(p.el.dataset.k); if(!it) return;
    if(S.placing&&it.kind!=='event'&&it.kind!=='busy'){ /* fall through to placing on the column */ }
    else { if(S.pop&&S.pop.k===it.k){ closePop(); S.sel=null; rerenderSel(); return; } popItem(it); return; }
  }
  if(p.src.type==='chip'){
    const src=p.el.dataset.plSrc;
    S.placing=S.placing&&S.placing.src===src?null:{src};
    closePop(); rerender(); return;
  }
  const col=p.el.closest?p.el.closest('.pl-col'):null;
  if(!col) return;
  const day=col.dataset.day;
  const m=clamp(Math.floor(minAt(col,e.clientY)/SNAP)*SNAP,0,DAYMIN-MINB);
  if(S.placing){ const si=srcInfo(S.placing.src); if(si) place(S.placing.src,day,m,si.dur); return; }
  if(S.pop){ closePop(); S.sel=null; rerenderSel(); return; }
  popNew(day,m,Math.min(DAYMIN,m+30),{x:e.clientX,y:e.clientY});
}
document.addEventListener('pointerdown',onDown);
document.addEventListener('pointermove',onMove,{passive:true});
document.addEventListener('pointerup',onUp);
document.addEventListener('pointercancel',onCancel);
document.addEventListener('touchmove',e=>{ if(D) e.preventDefault(); },{passive:false});
document.addEventListener('contextmenu',e=>{ if(D||(PD&&e.target.closest('.pl-it,[data-pl-src]'))) e.preventDefault(); });

/* clicks on everything with a data-act inside the planner */
document.addEventListener('click',e=>{
  const b=e.target.closest('#td-plan [data-act],#cal-body [data-act],#pl-pop [data-act]');
  if(!b) return;
  e.preventDefault(); act(b.dataset.act,b);
});
/* outside the popover closes it */
document.addEventListener('pointerdown',e=>{
  if(!S.pop) return;
  if(e.target.closest('#pl-pop,.pl-it,#modals')) return;
  if(e.target.closest('.pl-col')) return;                  // tap() decides
  closePop(); S.sel=null; rerenderSel();
},true);
/* inputs inside the popover and the tray search */
document.addEventListener('input',e=>{
  if(e.target.id==='pl-q'){ S.q=e.target.value; const l=$('pl-tray-l'); if(l) l.innerHTML=trayListHTML(); S.calSig=''; }
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='pl-est'){ const a=asg(t.dataset.aid); if(!a) return; const v=clamp(Math.round(+t.value/5)*5||0,5,600);
    a.est=v; if(a.estGuess!==undefined&&a.estGuess!==v) delete a.estGuess; save(); rerender(); }
  if(t.id==='pl-busy-t'){ const it=S.items.get(t.dataset.k); if(!it) return; const v=t.value.trim()||'Busy';
    if(it.b) it.b.title=v; else if(it.r) it.r.title=v; save(); rerender(); }
});
document.addEventListener('keydown',e=>{
  if(!(cur==='cal'||cur==='daily')) return;
  if(e.key==='Escape'){
    if($('modals').innerHTML) return;
    if(S.pop){ closePop(); S.sel=null; rerenderSel(); e.stopPropagation(); return; }
    if(S.placing){ S.placing=null; rerender(); return; }
    if(S.ghosts&&cur==='cal'){ dropGhosts(); return; }
    return;
  }
  if(isTyping(e.target)||$('modals').innerHTML||(typeof helloOpen==='function'&&helloOpen())) return;
  const f=document.activeElement;
  if(e.key==='Enter'&&f){
    if(f.classList&&f.classList.contains('pl-it')){ const it=S.items.get(f.dataset.k); if(it){ e.preventDefault(); popItem(it); } return; }
    if(f.dataset&&f.dataset.plSrc){ e.preventDefault(); S.placing={src:f.dataset.plSrc}; rerender(); return; }
  }
  if((e.key==='Delete'||e.key==='Backspace')&&S.sel){ const it=S.items.get(S.sel); if(it&&it.kind!=='event'){ e.preventDefault(); removeItem(it); } return; }
  if(cur!=='cal'||e.ctrlKey||e.metaKey||e.altKey) return;
  if(e.key==='ArrowLeft'){ e.preventDefault(); act('prev'); }
  else if(e.key==='ArrowRight'){ e.preventDefault(); act('next'); }
  else if(e.key==='t'||e.key==='T') act('today');
},true);
window.addEventListener('resize',()=>{ if(S.pop) positionPop(); });
document.addEventListener('scroll',e=>{ if(S.pop&&!phone()&&e.target&&e.target.classList&&e.target.classList.contains('pl-scroll')) positionPop(); },true);

/* ═══════════════ reminders and the clock ═══════════════ */
function notified(){ try{ const o=JSON.parse(localStorage.getItem(LS_NOTE)||'{}'); return o.day===today()?o:{day:today(),k:[]}; }catch(e){ return {day:today(),k:[]}; } }
function remindTick(){
  if(!prefs().remind) return;
  const t=today(), nm=nowMin(), seen=notified();
  const due=dayModel(t).items.filter(i=>(i.kind==='task'||i.kind==='busy')&&!i.done&&i.s<=nm&&i.s>nm-3&&!seen.k.includes(i.k+'@'+i.s));
  if(!due.length) return;
  due.forEach(i=>seen.k.push(i.k+'@'+i.s));
  try{ localStorage.setItem(LS_NOTE,JSON.stringify(seen)); }catch(e){}
  const i=due.find(x=>x.kind==='task')||due[0];
  nudge(i);
  if(document.hidden&&window.Notification&&Notification.permission==='granted'){
    try{ const n=new Notification(i.kind==='task'?'Time for: '+i.title:i.title,{body:`${range(i.s,i.e)} · ${durLong(i.e-i.s)}`,tag:'cd-plan'}); n.onclick=()=>{ window.focus(); if(i.kind==='task') focusOn(i); n.close(); }; }catch(e){}
  }
}
function nudge(i){
  let el=$('pl-nudge');
  if(!el){ el=document.createElement('div'); el.id='pl-nudge'; el.className='pl-nudge'; document.body.appendChild(el); }
  S.items.set(i.k,i);
  el.innerHTML=`<i style="--c:${i.color}"></i><div><span>${i.kind==='task'?'Time for':'Starting now'} · ${range(i.s,i.e)}</span><b>${esc(i.title)}</b></div>
    ${i.kind==='task'&&(i.a||i.x)?`<button class="pbtn go sm" data-k="${esc(i.k)}">Focus</button>`:''}<button class="pl-x" aria-label="Dismiss">×</button>`;
  el.classList.add('in');
  const go=el.querySelector('.pbtn'); if(go) go.onclick=()=>{ el.remove(); focusOn(i); };
  el.querySelector('.pl-x').onclick=()=>el.remove();
  setTimeout(()=>{ if(el.isConnected) el.remove(); },5*60000);
}
function tick(){
  syncNow();
  const t=today();
  if(S.followToday&&S.day&&S.day!==t){ S.day=t; S.scroll={}; }
  try{ remindTick(); }catch(e){}
  if(D||PD||S.pop) return;
  if(cur==='daily'&&$('td-plan')) paintToday();
  else if(cur==='cal') paint();
}
setInterval(tick,30000);
document.addEventListener('visibilitychange',()=>{ if(!document.hidden){ tick(); refreshFeeds(false,S.day); } });
setInterval(()=>{ if(!document.hidden) refreshFeeds(false,S.day); },5*60000);
setTimeout(()=>refreshFeeds(false),4000);

/* ═══════════════ for the agent ═══════════════ */
function agentLines(){
  const p=P(), L=[];
  if(!p.blocks.length&&!p.routines.length&&!p.feeds.length) return L;
  L.push('## Schedule (the Calendar tab)');
  L.push('');
  L.push(`Times are on the app's clock (${TZ()}). "Commitment" = from the user's connected calendars or time they blocked off; "planned" = time the user set aside for a task. The user arranges these in the app; suggest changes in the conversation.`);
  L.push('');
  [today(),addDays(today(),1)].forEach((day,i)=>{
    const st=dayStats(day), m=st.model;
    L.push(`### ${i===0?'Today':'Tomorrow'}, ${dayLabel(day,true)}`);
    L.push('');
    const all=m.all.filter(x=>x.kind!=='due');
    if(all.length) L.push(`- all day: ${all.map(x=>x.title).join('; ')}`);
    const items=m.items.filter(x=>x.kind!=='ghost').sort((a,b)=>a.s-b.s);
    items.forEach(x=>{
      const what=x.kind==='task'?`planned: **${x.title}**${x.sub?` (${x.sub})`:''}${x.done?' [done]':x.slipped?' [slipped, not done]':''}`
        :x.kind==='event'?`commitment: ${x.title}${x.free?' (shows as free)':''}`:`commitment: ${x.title} (blocked off in the app)`;
      L.push(`- ${range(x.s,x.e)} · ${what}`);
    });
    if(!items.length&&!all.length) L.push('- nothing on the calendar');
    L.push(`- free time ${i===0?'left ':''}between ${hm(prefs().dayStart)} and ${hm(prefs().dayEnd)}: ${durLong(st.free)}; planned task time: ${durLong(st.planned)}`);
    L.push('');
  });
  return L;
}

/* ═══════════════ public ═══════════════ */
window.Planner={
  paint(){ closePop(); if(S.followToday) S.day=today(); try{ journeyTick(); }catch(e){} S.calSig=''; paint(); refreshFeeds(false,S.day); },
  refresh, paintToday(){ try{ paintToday(); }catch(e){ console.warn('Planner (Today):',e); } },
  agentLines, refreshFeeds, connect:connectModal, settings:settingsModal,
  /* "Plan study" on a test under Today's catch: open the Calendar on today
     with that exam ready to drop onto a time */
  planStudy(id){ if(!examById(id)) return; closePop(); S.day=today(); S.followToday=true; S.view='day'; S.ghosts=null; S.placing={src:'x:'+id}; tab('cal'); },
  /* for tests and the console */
  _S:S, _dayModel:dayModel, _suggest:suggest, _guessEst:guessEst, _place:place, _tick:tick, _slipped:slippedBlocks,
};
})();
