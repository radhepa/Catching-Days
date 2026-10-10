/* core.js · Catching Days desktop pet · reading the pond
   ─────────────────────────────────────────────────────────────────────────
   Pure logic, no Electron, so it can be tested with plain node.

   Everything the toad shows is worked out from two things:
     db   focus-data.json, exactly as the app last saved it
     ops  what you did on the toad that the app hasn't taken in yet
          (desktop-pet-inbox.json; the app applies them and records how far
          it got in db.desktopPet.upto)
   The app stays the only thing that ever writes focus-data.json. Until an op
   lands there, the toad shows it on top of the file, so a tick you made on
   the desktop never flickers back while the app catches up.

   The rules below are ports of the app's own (today's list, the reeds, the
   do-score, the day planner's timeline, the session clock), kept small and
   side-effect free. */
'use strict';
const MIN=60000, DAY=86400000, DAYMIN=1440;

/* ═══════════════ time on the app's clock ═══════════════ */
const _fmt=new Map();
function fmt(tz,opts){
  const k=tz+'|'+JSON.stringify(opts||{});
  let f=_fmt.get(k);
  if(!f){ try{ f=new Intl.DateTimeFormat('en-CA',{timeZone:tz,...opts}); }catch(e){ f=new Intl.DateTimeFormat('en-CA',opts||{}); } _fmt.set(k,f); }
  return f;
}
const tzOf=db=>(db&&db.settings&&db.settings.tz)||'America/New_York';
function dayKey(ts,tz){ try{ return fmt(tz).format(ts); }catch(e){ return new Date(ts).toISOString().slice(0,10); } }
/* hour and minute on the wall clock in tz */
function wall(ts,tz){
  const p={}; fmt(tz,{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(ts).forEach(x=>p[x.type]=x.value);
  return {h:(+p.hour)%24, mi:+p.minute};
}
const RX=/^(\d{4})-(\d{2})-(\d{2})$/;
function utcOf(dk){ const m=RX.exec(dk||''); return m?Date.UTC(+m[1],+m[2]-1,+m[3]):null; }
function addDays(dk,n){ const u=utcOf(dk); const d=new Date(u+n*DAY);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`; }
function weekdayOf(dk){ return new Date(utcOf(dk)).getUTCDay(); }
function daysBetween(a,b){ const x=utcOf(a), y=utcOf(b); return x===null||y===null?null:Math.round((y-x)/DAY); }
const WEEK=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const WEEK_L=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
function hm(min,noAp){
  min=((Math.round(min)%DAYMIN)+DAYMIN)%DAYMIN;
  const h=Math.floor(min/60), mi=min%60, h12=h%12||12;
  return h12+(mi?':'+String(mi).padStart(2,'0'):'')+(noAp?'':(h<12?' AM':' PM'));
}
function range(s,e){
  const am=m=>Math.floor((((m%DAYMIN)+DAYMIN)%DAYMIN)/60)<12;
  return am(s)===am(e)&&e<DAYMIN?`${hm(s,true)} – ${hm(e)}`:`${hm(s)} – ${hm(e)}`;
}
function dueLabel(due,today){
  if(!due) return '';
  const d=daysBetween(today,due);
  if(d===0) return 'Today'; if(d===1) return 'Tomorrow'; if(d===-1) return 'Yesterday';
  if(d<0) return `${-d} days late`;
  if(d<7) return WEEK[weekdayOf(due)];
  const m=RX.exec(due); return `${MONTHS[+m[2]-1].slice(0,3)} ${+m[3]}`;
}

/* ═══════════════ classes, journeys, the do-score ═══════════════ */
function ctx(db){
  const classes=new Map((db.classes||[]).map(c=>[c.id,c]));
  const habits=new Map(), habitJourney=new Map();
  (db.journeys||[]).forEach(j=>(j.habits||[]).forEach(h=>{ habits.set(h.id,h); habitJourney.set(h.id,j); }));
  const journeys=new Map((db.journeys||[]).map(j=>[j.id,j]));
  return {classes,habits,habitJourney,journeys};
}
const archived=(C,a)=>!!(a.classId&&C.classes.get(a.classId)&&C.classes.get(a.classId).archived);
function journeyActive(C,a){
  if(!a.habitId&&!a.journeyId) return true;
  const j=(a.journeyId&&C.journeys.get(a.journeyId))||(a.habitId&&C.habitJourney.get(a.habitId))||null;
  const h=a.habitId?C.habits.get(a.habitId):null;
  return !!j&&j.status==='active'&&(!h||h.active!==false);
}
const live=(C,a)=>!archived(C,a)&&journeyActive(C,a);
const clsName=(C,id)=>(C.classes.get(id)||{}).name||'';
const clsShort=(C,id)=>clsName(C,id).replace(/^(fall|spring|summer|winter)\s+\d{4}\s+/i,'');
const HABIT_C='#715c95', UNFILED_C='#2f7a74', BUSY_C='#8f978f';
const colorOf=(C,a)=>a.classId&&C.classes.get(a.classId)?C.classes.get(a.classId).color||'#9399a0':a.habitId?HABIT_C:UNFILED_C;

const URG={wDue:40,wWork:25,wImp:20,wProc:15,capHrsPerDay:3};
const IMP_URGENCY=[50,10,30,50,75,100];
function doScore(a,db,today){
  if(!a||a.done) return null;
  const subs=a.subs||[], log=a.log||[];
  const d=a.due?daysBetween(today,a.due):null;
  if(d!==null&&d<0) return 100;
  const w=Object.assign({},URG,(db.settings&&db.settings.urgency)||{});
  const due=d===null?null:d<=0?100:Math.round(100/(1+d/3));
  let work=null;
  if(a.est&&d!==null){
    const doneFrac=subs.length?subs.filter(s=>s.done).length/subs.length:0;
    work=Math.round(Math.min(100,((a.est*(1-doneFrac))/60)/Math.max(d,1/24)/(w.capHrsPerDay||3)*100));
  }
  let proc=null;
  if(a.assignedDate&&a.due){
    const total=daysBetween(a.assignedDate,a.due), el=daysBetween(a.assignedDate,today);
    if(total!==null&&el!==null){
      const started=a.logged>0||subs.some(s=>s.done)||log.length>0;
      proc=Math.round(100*Math.min(1,Math.max(0,el)/Math.max(1,total))*(started?.35:1));
    }
  }
  const parts=[[due,w.wDue],[work,w.wWork],[IMP_URGENCY[a.imp||0],w.wImp],[proc,w.wProc]]
    .filter(([v,wt])=>v!==null&&v!==undefined&&wt>0);
  if(!parts.length) return null;
  const tw=parts.reduce((s,p)=>s+p[1],0);
  return tw?Math.round(parts.reduce((s,p)=>s+p[0]*p[1],0)/tw):null;
}

/* ═══════════════ ops: what the toad did that the app hasn't seen ═══════════════ */
const uptoOf=db=>+((db&&db.desktopPet&&db.desktopPet.upto)||0);
function pendingOps(db,ops){
  const u=uptoOf(db);
  return (ops||[]).filter(o=>o&&o.t>u).sort((a,b)=>a.t-b.t);
}
/* task ticks on top of the file: id → {done, doneAt} */
function taskOverlay(db,pend){
  const m=new Map();
  pend.forEach(o=>{ if(o.k==='task'&&o.aid) m.set(o.aid,{done:!!o.on,doneAt:o.on?o.t:null}); });
  return m;
}

/* ═══════════════ the session clock (the app's RULES, for display) ═══════════════ */
const SESSION_KEYS=['id','started','name','focusMin','brkMin','ratio','assignmentIds','phase','phaseStart','target',
  'paused','pausedAt','pausedMs','earned','working'];
function copySession(a){
  if(!a) return null;
  const s={}; SESSION_KEYS.forEach(k=>{ if(a[k]!==undefined) s[k]=Array.isArray(a[k])?a[k].slice():a[k]; });
  s.cycles=(a.cycles||[]).map(c=>({n:c.n,actual:c.actual||0,rating:c.rating||null,earned:c.earned||0,over:c.over||0,
    breakActual:c.breakActual||0,overBreak:c.overBreak||0}));
  s.pending=a.pending?{n:a.pending.n,actual:a.pending.actual||0,earned:a.pending.earned||0,over:a.pending.over||0}:null;
  s.assignmentIds=s.assignmentIds||[];
  return s;
}
function elapsed(s,now){
  if(!s) return 0;
  return s.paused?(s.pausedAt-s.phaseStart-(s.pausedMs||0)):(now-s.phaseStart-(s.pausedMs||0));
}
/* one op against a session, the way the app's own handlers move it */
function stepSession(s,o){
  const t=o.t;
  if(o.act==='start'){
    if(s) return s;
    const f=+o.f||25, b=+o.b||5;
    return {id:o.sid, started:t, name:o.name||'', focusMin:f, brkMin:b, ratio:b/f, assignmentIds:(o.ids||[]).slice(),
      cycles:[], phase:'focus', phaseStart:t, target:f*MIN, paused:false, pausedAt:null, pausedMs:0, earned:0, pending:null};
  }
  if(!s||s.id!==o.sid) return s;
  s=Object.assign({},s,{cycles:s.cycles.slice()});
  if(o.act==='pause'){ if(!s.paused&&s.phase!=='rating'){ s.paused=true; s.pausedAt=t; } return s; }
  if(o.act==='resume'){ if(s.paused){ s.pausedMs=(s.pausedMs||0)+(t-s.pausedAt); s.paused=false; s.pausedAt=null; } return s; }
  if(o.act==='rate'){
    let p=s.pending;
    if(s.phase==='focus'){
      if(s.cycles.length!==(o.n||1)-1) return s;
      const actual=Math.max(1000,elapsed(s,t));
      p={n:s.cycles.length+1, actual, earned:Math.round(actual*s.ratio), over:Math.max(0,actual-s.target)};
    } else if(s.phase!=='rating'||!p) return s;
    s.cycles.push(Object.assign({},p,{rating:o.r||null,breakActual:0,overBreak:0}));
    s.pending=null; s.earned=p.earned; s.phase='break'; s.phaseStart=t; s.target=p.earned;
    s.paused=false; s.pausedAt=null; s.pausedMs=0;
    return s;
  }
  if(o.act==='break-end'){
    if(s.phase!=='break') return s;
    const c=s.cycles[s.cycles.length-1], act=elapsed(s,t);
    if(c){ s.cycles[s.cycles.length-1]=Object.assign({},c,{breakActual:act,overBreak:Math.max(0,act-c.earned)}); }
    s.phase='focus'; s.phaseStart=t; s.target=s.focusMin*MIN; s.paused=false; s.pausedAt=null; s.pausedMs=0;
    return s;
  }
  if(o.act==='finish') return null;
  return s;
}
function sessionView(db,pend){
  let s=copySession(db&&db.active);
  pend.forEach(o=>{ if(o.k==='focus') s=stepSession(s,o); });
  return s;
}
function summarize(s){
  const c=s.cycles||[], sum=f=>c.reduce((x,y)=>x+(f(y)||0),0);
  const focus=sum(x=>x.actual), overBreak=sum(x=>x.overBreak), rated=c.filter(x=>x.rating);
  return {cycles:c.length, focus, net:focus-overBreak, earned:sum(x=>x.earned),
    avg:rated.length?rated.reduce((x,y)=>x+y.rating,0)/rated.length:0};
}
function netFocusOn(db,dk,tz){
  let ms=0;
  (db.sessions||[]).forEach(s=>{ if(s&&dayKey(s.started,tz)===dk) ms+=summarize(s).net; });
  return Math.max(0,ms);
}

/* ═══════════════ the day: the planner's timeline, read-only ═══════════════ */
function epochOf(day,min,tz){
  /* the epoch for a wall-clock minute on a day in tz: guess with UTC, then
     correct by the zone's offset at that guess (twice, for DST edges) */
  const u=utcOf(day)+min*MIN;
  let t=u;
  for(let i=0;i<2;i++){ const w=wall(t,tz), dk=dayKey(t,tz);
    const shown=utcOf(dk)+(w.h*60+w.mi)*MIN; t+=u-shown; }
  return t;
}
function dayModel(db,day,now,overlay){
  const tz=tzOf(db), C=ctx(db), P=db.planner&&typeof db.planner==='object'?db.planner:{};
  const blocks=Array.isArray(P.blocks)?P.blocks:[], routines=Array.isArray(P.routines)?P.routines:[];
  const feeds=Array.isArray(P.feeds)?P.feeds:[], ev=(P.cal&&Array.isArray(P.cal.ev))?P.cal.ev:[];
  const feedOn=new Set(feeds.filter(f=>f.on!==false).map(f=>f.id));
  const feedColor=id=>(feeds.find(f=>f.id===id)||{}).color||'#4f86b3';
  const asg=id=>(db.assignments||[]).find(a=>a.id===id);
  const done=a=>a?(overlay&&overlay.has(a.id)?overlay.get(a.id).done:!!a.done):false;
  const d0=epochOf(day,0,tz), d1=epochOf(addDays(day,1),0,tz);
  const items=[], all=[];
  const wm=ts=>{ const w=wall(ts,tz); return w.h*60+w.mi; };
  ev.filter(e=>feedOn.has(e.f)).forEach(e=>{
    if(e.ad){ if(e.d0<=day&&e.d1>day) all.push({kind:'event',title:e.t||'(busy)',color:feedColor(e.f)}); return; }
    if(!(e.e>d0&&e.s<d1)) return;
    const s=e.s<=d0?0:wm(e.s);
    let en=e.e>=d1?DAYMIN:wm(e.e);
    if(en<=s) en=Math.min(DAYMIN,s+Math.max(15,Math.round((e.e-e.s)/MIN)));
    items.push({kind:'event',s,e:en,title:e.t||'(busy)',sub:e.l||'',color:feedColor(e.f),free:!!e.fr});
  });
  const occurrence=(hid,d)=>(db.assignments||[]).find(a=>a.habitId===hid&&a.due===d)||null;
  const placedHabits=new Set();
  blocks.filter(b=>b&&b.day===day).forEach(b=>{
    if(b.kind==='busy'){ items.push({kind:'busy',s:b.start,e:b.start+b.dur,title:b.title||'Busy',color:BUSY_C}); return; }
    if(b.eid){ const x=(db.exams||[]).find(e=>e.id===b.eid); if(!x) return;
      items.push({kind:'task',s:b.start,e:b.start+b.dur,title:'Study: '+x.title,color:x.classId&&C.classes.get(x.classId)?C.classes.get(x.classId).color:'#715c95',
        sub:x.classId?clsShort(C,x.classId):'',done:!!x.done}); return; }
    let a=null;
    if(b.aid){ const t=asg(b.aid); if(t&&(!t.habitId||t.due===b.day)) a=t; }
    if(!a&&b.hid) a=occurrence(b.hid,b.day);
    if(!a&&b.aid&&!b.hid) return;
    if(b.hid) placedHabits.add(b.hid);
    const h=b.hid?C.habits.get(b.hid):null;
    if(!a&&!h) return;
    items.push({kind:'task',s:b.start,e:b.start+b.dur,title:a?a.title:h.name,color:a?colorOf(C,a):HABIT_C,
      sub:a&&a.classId?clsShort(C,a.classId):(b.hid||(a&&a.habitId))?'Habit':'',aid:a?a.id:null,done:done(a)});
  });
  const wd=weekdayOf(day), today=dayKey(now,tz);
  routines.forEach(r=>{
    if(!r||(r.skip||[]).includes(day)||(r.from&&day<r.from)) return;
    if(r.kind==='habit'){
      if(day<today||placedHabits.has(r.hid)) return;
      const h=C.habits.get(r.hid), j=C.habitJourney.get(r.hid), a=occurrence(r.hid,day);
      if(!h) return;
      if(day===today&&!a) return;
      const on=h.active!==false&&j&&j.status==='active'&&h.scheduleType!=='freq'&&(h.days||[]).includes(wd);
      if(!on&&!a) return;
      items.push({kind:'task',s:r.start,e:r.start+r.dur,title:a?a.title:h.name,color:HABIT_C,sub:'Habit',aid:a?a.id:null,done:done(a)});
    } else if((r.days||[]).includes(wd)) items.push({kind:'busy',s:r.start,e:r.start+r.dur,title:r.title||'Busy',color:BUSY_C,sub:'Repeats'});
  });
  (db.assignments||[]).filter(a=>a.due===day&&!done(a)&&!a.ann&&!a.habitId&&live(C,a))
    .forEach(a=>all.push({kind:'due',title:a.title,color:colorOf(C,a),aid:a.id}));
  (db.exams||[]).filter(x=>x.examDate===day&&!x.done&&!(x.classId&&C.classes.get(x.classId)&&C.classes.get(x.classId).archived))
    .forEach(x=>all.push({kind:'exam',title:(x.kind==='quiz'?'Quiz: ':'Exam: ')+x.title,color:x.classId&&C.classes.get(x.classId)?C.classes.get(x.classId).color:'#715c95'}));
  const nm=day===today?wm(now):day<today?DAYMIN+1:-1;
  items.sort((a,b)=>a.s-b.s||a.e-b.e);
  items.forEach(i=>{ i.range=range(i.s,i.e); i.past=i.e<=nm; i.now=i.s<=nm&&i.e>nm; });
  const real=items.filter(i=>!(i.kind==='event'&&i.free));
  const cur=real.filter(i=>i.now).sort((a,b)=>(a.kind==='task'?0:1)-(b.kind==='task'?0:1))[0]||null;
  const next=real.filter(i=>i.s>nm).sort((a,b)=>a.s-b.s)[0]||null;
  return {day, items, all, nowMin:nm,
    now:cur?{title:cur.title,untilMin:cur.e-nm,until:hm(cur.e),color:cur.color}:null,
    next:next?{title:next.title,inMin:next.s-nm,at:hm(next.s),color:next.color}:null};
}

/* ═══════════════ everything the toad shows, in one object ═══════════════ */
function taskRow(C,db,a,today,ov){
  const o=ov.get(a.id), done=o?o.done:!!a.done;
  return {id:a.id, title:a.title||'(untitled)', cls:a.classId?clsShort(C,a.classId):a.habitId?'Habit':'',
    color:colorOf(C,a), due:a.due||'', dueLabel:dueLabel(a.due,today), done, ann:!!a.ann,
    est:a.est||0, imp:a.imp||0, habit:!!a.habitId, score:done?null:doScore(a,db,today),
    late:a.due&&a.due<today?daysBetween(a.due,today):0};
}
function buildView(db,ops,now){
  now=now||Date.now();
  db=db||{};
  const tz=tzOf(db), today=dayKey(now,tz), C=ctx(db);
  const pend=pendingOps(db,ops), ov=taskOverlay(db,pend);
  const A=db.assignments||[];
  const isDone=a=>ov.has(a.id)?ov.get(a.id).done:!!a.done;
  const picks=new Set(((db.dailyPicks||{})[today])||[]);
  const todayRows=A.filter(a=>(a.due===today||picks.has(a.id))&&live(C,a)).map(a=>taskRow(C,db,a,today,ov))
    .sort((x,y)=>x.done!==y.done?(x.done?1:-1):(y.score||0)-(x.score||0));
  const inToday=new Set(todayRows.map(r=>r.id));
  const reeds=A.filter(a=>!isDone(a)&&!a.ann&&a.due&&a.due<today&&live(C,a)&&!inToday.has(a.id))
    .sort((x,y)=>(x.due||'').localeCompare(y.due||'')).map(a=>taskRow(C,db,a,today,ov));
  /* ticked from the toad today: they stay in their place, ticked, till tomorrow */
  const tickedHere=A.filter(a=>ov.has(a.id)&&ov.get(a.id).done&&!inToday.has(a.id)&&a.due&&a.due<today&&live(C,a))
    .map(a=>taskRow(C,db,a,today,ov));
  const soonEnd=addDays(today,3);
  const soon=A.filter(a=>!isDone(a)&&!a.ann&&a.due&&a.due>today&&a.due<=soonEnd&&live(C,a)&&!inToday.has(a.id))
    .map(a=>taskRow(C,db,a,today,ov)).sort((x,y)=>x.due.localeCompare(y.due)||(y.score||0)-(x.score||0));
  const open=A.filter(a=>!isDone(a)&&!a.ann&&live(C,a)).map(a=>taskRow(C,db,a,today,ov))
    .sort((x,y)=>(y.score||0)-(x.score||0));
  const countable=todayRows.filter(r=>!r.ann);
  const session=sessionView(db,pend);
  const day=dayModel(db,today,now,ov);
  const exams=(db.exams||[]).filter(x=>!x.done&&x.examDate&&x.examDate>=today&&daysBetween(today,x.examDate)<=7)
    .map(x=>({title:x.title,kind:x.kind||'exam',days:daysBetween(today,x.examDate),date:x.examDate,
      color:x.classId&&C.classes.get(x.classId)?C.classes.get(x.classId).color:'#715c95'}))
    .sort((a,b)=>a.days-b.days);
  const st=db.settings||{};
  const p=dParts(today);
  return {
    now, tz, today, todayLabel:`${WEEK_L[p.wd]}, ${MONTHS[p.m-1]} ${p.d}`,
    hr:wall(now,tz).h,
    tasks:{today:todayRows.concat(tickedHere), reeds, soon:soon.slice(0,8), open:open.slice(0,40)},
    counts:{total:countable.length, done:countable.filter(r=>r.done).length,
      left:countable.filter(r=>!r.done).length, overdue:reeds.length},
    session, day, exams,
    mins:Math.round(netFocusOn(db,today,tz)/MIN),
    settings:{focus:+st.focus||25, brk:+st.brk||5, goal:+st.goal||0, sound:st.sound!==false},
    pending:pend.length, upto:uptoOf(db),
    hasData:Array.isArray(db.assignments)
  };
}
function dParts(dk){ const m=RX.exec(dk); return {y:+m[1],m:+m[2],d:+m[3],wd:weekdayOf(dk)}; }

/* the state a toad's context lines read (pet-lines.js) */
function lineState(v,extra){
  const s=v.session, ex=v.exams[0]||null;
  return Object.assign({hr:v.hr, total:v.counts.total, done:v.counts.done, left:v.counts.left, overdue:v.counts.overdue,
    running:!!s, phase:s?s.phase:null, paused:!!(s&&s.paused), cycles:s?s.cycles.length:0,
    mins:v.mins, goal:v.settings.goal, next:v.day.next, now:v.day.now,
    exam:ex?{title:ex.title,days:ex.days}:null, peeking:false}, extra||{});
}

module.exports={MIN,DAY,dayKey,wall,addDays,weekdayOf,daysBetween,hm,range,dueLabel,doScore,epochOf,
  pendingOps,taskOverlay,stepSession,sessionView,copySession,elapsed,summarize,dayModel,buildView,lineState,uptoOf};
