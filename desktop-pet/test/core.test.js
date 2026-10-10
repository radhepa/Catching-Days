// the desktop toad's reading of the pond (core.js), with plain node
const test=require('node:test'), assert=require('node:assert/strict');
const core=require('../core');

const TZ='America/New_York';
const NOW=Date.UTC(2026,9,10,16,30);                 // Sat Oct 10 2026, 12:30 PM in New York
const MIN=60000;
function sample(){
  return {settings:{tz:TZ,focus:25,brk:5,goal:120,sound:true},
    classes:[{id:'c1',name:'Fall 2026 CS 159',color:'#386e99'},{id:'c2',name:'Old',color:'#999',archived:true}],
    assignments:[
      {id:'a1',title:'Lab 4',classId:'c1',due:'2026-10-10',est:60,imp:3,subs:[],log:[],done:false},
      {id:'a2',title:'Read ch. 3',classId:'c1',due:'2026-10-08',subs:[],log:[],done:false},
      {id:'a3',title:'Picked onto today',classId:null,due:'2026-10-20',subs:[],log:[],done:false},
      {id:'a4',title:'Archived class work',classId:'c2',due:'2026-10-10',subs:[],log:[],done:false},
      {id:'a5',title:'Already done',classId:'c1',due:'2026-10-10',subs:[],log:[],done:true,doneAt:NOW-3600000},
      {id:'a6',title:'Due Monday',classId:'c1',due:'2026-10-12',subs:[],log:[],done:false},
      {id:'a7',title:'Reminder',due:'2026-10-10',ann:true,subs:[],log:[],done:false}],
    dailyPicks:{'2026-10-10':['a3']},
    sessions:[], journeys:[], exams:[{id:'x1',title:'Midterm 1',examDate:'2026-10-13',kind:'exam',classId:'c1'}],
    active:null,
    planner:{blocks:[{id:'b1',day:'2026-10-10',start:14*60,dur:60,kind:'task',aid:'a1'},{id:'b2',day:'2026-10-10',start:9*60,dur:30,kind:'busy',title:'Gym'}],
      routines:[],feeds:[{id:'f1',on:true,color:'#4f86b3'}],cal:{ev:[{f:'f1',t:'Lecture',s:Date.UTC(2026,9,10,16,0),e:Date.UTC(2026,9,10,17,15)}]}}};
}

test('today: due today and picked, archived classes left out, done last',()=>{
  const v=core.buildView(sample(),[],NOW);
  assert.equal(v.today,'2026-10-10');
  assert.deepEqual(v.tasks.today.map(r=>r.id).sort(),['a1','a3','a5','a7']);
  assert.equal(v.tasks.today[v.tasks.today.length-1].done,true);
  assert.equal(v.counts.total,3);                     // the reminder doesn't count
  assert.equal(v.counts.done,1);
  assert.deepEqual(v.tasks.reeds.map(r=>r.id),['a2']);
  assert.equal(v.tasks.reeds[0].late,2);
  assert.deepEqual(v.tasks.soon.map(r=>r.id),['a6']);
  assert.equal(v.tasks.today.find(r=>r.id==='a1').cls,'CS 159');   // the semester prefix trimmed, as in the app
});

test('do-score: overdue is 100, done has none',()=>{
  const db=sample();
  assert.equal(core.doScore(db.assignments[1],db,'2026-10-10'),100);
  assert.equal(core.doScore(db.assignments[4],db,'2026-10-10'),null);
  const s=core.doScore(db.assignments[0],db,'2026-10-10');
  assert.ok(s>50&&s<100);
});

test('a tick on the toad shows until the file has it',()=>{
  const db=sample();
  const ops=[{id:'o1',t:NOW-1000,k:'task',aid:'a1',on:true}];
  let v=core.buildView(db,ops,NOW);
  assert.equal(v.tasks.today.find(r=>r.id==='a1').done,true);
  assert.equal(v.pending,1);
  db.desktopPet={upto:NOW-1000};                      // the app took it in…
  db.assignments[0].done=true;
  v=core.buildView(db,ops,NOW);
  assert.equal(v.pending,0);
  assert.equal(v.tasks.today.find(r=>r.id==='a1').done,true);
  db.assignments[0].done=false;                       // …and later unticked it in the app: the file wins
  v=core.buildView(db,ops,NOW);
  assert.equal(v.tasks.today.find(r=>r.id==='a1').done,false);
});

test('a whole session, the way the app counts it',()=>{
  const t0=NOW;
  const ops=[
    {t:t0,k:'focus',act:'start',sid:'s1',f:25,b:5,ids:['a1']},
    {t:t0+10*MIN,k:'focus',act:'pause',sid:'s1'},
    {t:t0+12*MIN,k:'focus',act:'resume',sid:'s1'},
    {t:t0+27*MIN,k:'focus',act:'rate',sid:'s1',n:1,r:4}];
  let s=null; ops.forEach(o=>{ s=core.stepSession(s,o); });
  assert.equal(s.phase,'break');
  assert.equal(s.cycles.length,1);
  assert.equal(s.cycles[0].actual,25*MIN);            // the two paused minutes don't count
  assert.equal(s.cycles[0].rating,4);
  assert.equal(s.target,5*MIN);                       // break earned = focus × 5/25
  s=core.stepSession(s,{t:t0+33*MIN,k:'focus',act:'break-end',sid:'s1',n:1});
  assert.equal(s.phase,'focus');
  assert.equal(s.cycles[0].overBreak,1*MIN);          // a minute over the earned break
  assert.equal(core.stepSession(s,{t:t0+40*MIN,k:'focus',act:'finish',sid:'s1'}),null);
  assert.equal(core.stepSession(s,{t:t0,k:'focus',act:'pause',sid:'other'}),s);   // another session's op does nothing
});

test('the day: events, blocks and deadlines on the app clock',()=>{
  const v=core.buildView(sample(),[],NOW);
  const d=v.day;
  assert.deepEqual(d.items.map(i=>i.range),['9 – 9:30 AM','12 – 1:15 PM','2 – 3 PM']);
  assert.equal(d.items[0].past,true);
  assert.equal(d.items[1].now,true);
  assert.equal(d.now.title,'Lecture');
  assert.equal(d.next.title,'Lab 4');
  assert.ok(d.all.some(a=>a.kind==='due'&&a.title==='Lab 4'));
  assert.equal(v.exams[0].days,3);
});

test('epochOf is the wall clock in the app zone, across a DST change',()=>{
  assert.equal(new Date(core.epochOf('2026-10-10',9*60,TZ)).toISOString(),'2026-10-10T13:00:00.000Z');
  assert.equal(new Date(core.epochOf('2026-11-02',9*60,TZ)).toISOString(),'2026-11-02T14:00:00.000Z');
});
