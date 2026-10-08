// Calendar feed reader (planner-ical.js): repeats, time zones, exceptions.  node --test
const test = require('node:test');
const assert = require('node:assert');
const IC = require('../planner-ical.js');

const NY = 'America/New_York';
const wall = (ms, tz = NY) => { const w = IC.wallOf(ms, tz); return `${w.y}-${String(w.mo).padStart(2,'0')}-${String(w.d).padStart(2,'0')} ${String(w.h).padStart(2,'0')}:${String(w.mi).padStart(2,'0')}`; };
const cal = body => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Google Inc//Google Calendar 70.9054//EN\r\nX-WR-CALNAME:Fall classes\r\nX-WR-TIMEZONE:America/New_York\r\n${body}END:VCALENDAR\r\n`;
const ev = lines => `BEGIN:VEVENT\r\n${lines.join('\r\n')}\r\nEND:VEVENT\r\n`;

test('single timed event in a named zone', () => {
  const r = IC.parse(cal(ev(['DTSTART;TZID=America/New_York:20261008T093000', 'DTEND;TZID=America/New_York:20261008T102000', 'UID:a1', 'SUMMARY:Chemistry lecture', 'LOCATION:Science Hall 2'])), { from: '2026-10-01', to: '2026-10-31', tz: NY });
  assert.equal(r.name, 'Fall classes');
  assert.equal(r.events.length, 1);
  const e = r.events[0];
  assert.equal(wall(e.start), '2026-10-08 09:30');
  assert.equal(wall(e.end), '2026-10-08 10:20');
  assert.equal(e.title, 'Chemistry lecture');
  assert.equal(e.loc, 'Science Hall 2');
});

test('weekly MO,WE,FR keeps 9:30 across DST, until, exdate', () => {
  const r = IC.parse(cal(ev([
    'DTSTART;TZID=America/New_York:20260824T093000', 'DTEND;TZID=America/New_York:20260824T102000',
    'RRULE:FREQ=WEEKLY;WKST=SU;UNTIL=20261212T045959Z;BYDAY=MO,WE,FR',
    'EXDATE;TZID=America/New_York:20261030T093000',
    'UID:class1', 'SUMMARY:Calculus II'])), { from: '2026-10-26', to: '2026-11-08', tz: NY });
  const got = r.events.map(e => wall(e.start));
  assert.deepEqual(got, ['2026-10-26 09:30', '2026-10-28 09:30', '2026-11-02 09:30', '2026-11-04 09:30', '2026-11-06 09:30']);
  // DST: the Nov 2 instance is 14:30 UTC, the Oct 26 one 13:30 UTC
  assert.equal(new Date(r.events[0].start).toISOString().slice(11, 16), '13:30');
  assert.equal(new Date(r.events[2].start).toISOString().slice(11, 16), '14:30');
  // until stops it
  const r2 = IC.parse(cal(ev(['DTSTART;TZID=America/New_York:20260824T093000', 'DTEND;TZID=America/New_York:20260824T102000',
    'RRULE:FREQ=WEEKLY;UNTIL=20261212T045959Z;BYDAY=MO,WE,FR', 'UID:c', 'SUMMARY:x'])), { from: '2026-12-07', to: '2026-12-31', tz: NY });
  assert.deepEqual(r2.events.map(e => wall(e.start).slice(0, 10)), ['2026-12-07', '2026-12-09', '2026-12-11']);
});

test('moved and cancelled single occurrences', () => {
  const r = IC.parse(cal(
    ev(['DTSTART;TZID=America/New_York:20261005T140000', 'DTEND;TZID=America/New_York:20261005T150000', 'RRULE:FREQ=WEEKLY;BYDAY=MO', 'UID:lab', 'SUMMARY:Lab']) +
    ev(['RECURRENCE-ID;TZID=America/New_York:20261012T140000', 'DTSTART;TZID=America/New_York:20261013T160000', 'DTEND;TZID=America/New_York:20261013T170000', 'UID:lab', 'SUMMARY:Lab (moved)']) +
    ev(['RECURRENCE-ID;TZID=America/New_York:20261019T140000', 'DTSTART;TZID=America/New_York:20261019T140000', 'DTEND;TZID=America/New_York:20261019T150000', 'STATUS:CANCELLED', 'UID:lab', 'SUMMARY:Lab'])
  ), { from: '2026-10-05', to: '2026-10-27', tz: NY });
  assert.deepEqual(r.events.map(e => wall(e.start) + ' ' + e.title), ['2026-10-05 14:00 Lab', '2026-10-13 16:00 Lab (moved)', '2026-10-26 14:00 Lab']);
});

test('all-day events, single and multi-day, yearly birthday', () => {
  const r = IC.parse(cal(
    ev(['DTSTART;VALUE=DATE:20261012', 'DTEND;VALUE=DATE:20261014', 'UID:break', 'SUMMARY:October Break']) +
    ev(['DTSTART;VALUE=DATE:20000315', 'DTEND;VALUE=DATE:20000316', 'RRULE:FREQ=YEARLY', 'UID:bday', 'SUMMARY:Mom\\, birthday', 'TRANSP:TRANSPARENT'])
  ), { from: '2026-10-01', to: '2027-03-31', tz: NY });
  assert.equal(r.events.length, 2);
  assert.deepEqual([r.events[0].d0, r.events[0].d1, r.events[0].allDay], ['2026-10-12', '2026-10-14', true]);
  assert.deepEqual([r.events[1].d0, r.events[1].title, r.events[1].free], ['2027-03-15', 'Mom, birthday', true]);
});

test('monthly by weekday ordinal, last day, count, interval', () => {
  const mk = rule => IC.parse(cal(ev(['DTSTART;TZID=America/New_York:20260101T180000', 'DURATION:PT1H', 'RRULE:' + rule, 'UID:m', 'SUMMARY:m'])), { from: '2026-01-01', to: '2026-12-31', tz: NY }).events.map(e => wall(e.start).slice(0, 10));
  assert.deepEqual(mk('FREQ=MONTHLY;BYDAY=2TU;COUNT=3'), ['2026-01-13', '2026-02-10', '2026-03-10']);
  assert.deepEqual(mk('FREQ=MONTHLY;BYDAY=-1FR;COUNT=2'), ['2026-01-30', '2026-02-27']);
  assert.deepEqual(mk('FREQ=MONTHLY;BYMONTHDAY=-1;COUNT=3'), ['2026-01-31', '2026-02-28', '2026-03-31']);
  assert.deepEqual(mk('FREQ=DAILY;INTERVAL=2;COUNT=3'), ['2026-01-01', '2026-01-03', '2026-01-05']);
  assert.deepEqual(mk('FREQ=WEEKLY;INTERVAL=2;BYDAY=TH;COUNT=3'), ['2026-01-01', '2026-01-15', '2026-01-29']);
  assert.deepEqual(mk('FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;COUNT=2'), ['2026-01-30', '2026-02-27']);
  assert.deepEqual(mk('FREQ=YEARLY;BYMONTH=11;BYDAY=4TH;COUNT=1'), ['2026-11-26']);
});

test('UTC times, folded lines, escapes, nested alarm, windows zones', () => {
  const r = IC.parse(cal(ev([
    'DTSTART:20261008T180000Z', 'DTEND:20261008T190000Z', 'UID:u', 'SUMMARY:Club meeting\\; bring\\nlaptop wi',
    ' th charger', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'SUMMARY:alarm text', 'TRIGGER:-PT10M', 'END:VALARM', 'LOCATION:ARMS 1010']) +
    ev(['DTSTART;TZID="Eastern Standard Time":20261009T080000', 'DTEND;TZID="Eastern Standard Time":20261009T083000', 'UID:o', 'SUMMARY:Outlook thing'])
  ), { from: '2026-10-01', to: '2026-10-31', tz: NY });
  assert.equal(r.events[0].title, 'Club meeting; bring\nlaptop with charger');
  assert.equal(r.events[0].loc, 'ARMS 1010');
  assert.equal(wall(r.events[0].start), '2026-10-08 14:00');
  assert.equal(wall(r.events[1].start), '2026-10-09 08:00');
});

test('long-running weekly series from years ago is fast and right', () => {
  const t0 = Date.now();
  const r = IC.parse(cal(ev(['DTSTART;TZID=America/Chicago:20150105T070000', 'DTEND;TZID=America/Chicago:20150105T080000', 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', 'UID:gym', 'SUMMARY:Gym'])), { from: '2026-10-05', to: '2026-10-11', tz: NY });
  assert.ok(Date.now() - t0 < 500);
  assert.deepEqual(r.events.map(e => wall(e.start)), ['2026-10-05 08:00', '2026-10-06 08:00', '2026-10-07 08:00', '2026-10-08 08:00', '2026-10-09 08:00']);
});

test('spring-forward gap and fall-back', () => {
  const t = IC.zonedToEpoch(2027, 3, 14, 2, 30, 0, NY); // doesn't exist
  assert.equal(wall(t), '2027-03-14 03:30');
  const f = IC.zonedToEpoch(2026, 11, 1, 1, 30, 0, NY);
  assert.equal(wall(f), '2026-11-01 01:30');
});

test('daily byday weekdays', () => {
  const r = IC.parse(cal(ev(['DTSTART;TZID=America/New_York:20261005T120000', 'DTEND;TZID=America/New_York:20261005T123000', 'RRULE:FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR', 'UID:l', 'SUMMARY:Lunch'])), { from: '2026-10-09', to: '2026-10-13', tz: NY });
  assert.deepEqual(r.events.map(e => wall(e.start).slice(0, 10)), ['2026-10-09', '2026-10-12', '2026-10-13']);
});
