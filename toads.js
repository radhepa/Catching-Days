/* toads.js · Catching Days · the pond toads (module)
   ─────────────────────────────────────────────────────────────────────────
   Self-contained, like projects.js. Loaded after projects.js, needs toad-art.js
   and toads-design/toad-art-cast.js (window.ToadArt), toad-lines.js and toads.css.
   It puts each toad in its home on its own screen and gives each a talk box. It
   touches no existing app code.

     Hasu   Keeper of the Lotus     Today      the water strip, bottom right
     Ame    Keeper of the Rain      Focus      the setup pond; the running rain (laptop)
     Tabi   Keeper of the Road      Journeys   the road's water, above the path
     Hotaru Keeper of the Lanterns  Collection the "next to find" water; beside the counter on a phone; not shown in between,
                                    and only on the Fish view (the Bugs and Toads views have no such water)
     Sumi   Keeper of the Ink       Journal    the calendar's water, bottom right (not in the Vault)

   ADDING ANOTHER TOAD is three things and almost no code:
     1. its art in toads-design/toad-art-cast.js (ToadArt.TOADS.<name>)
     2. its lines in toad-lines.js (`<name>:{intro,idle,ctx,ask}`)
     3. one entry in PLACES below (copy Sumi's), its sizes in toads.css under
        `.td-toad[data-toad="<name>"][data-home="..."]`, and, if its lines read anything the
        others' don't, a small reader in EXTRA

   What it reads from the app (read-only, every read in a try/catch, so a missing
   field can never break a toad or the app): today(), etHour(), db.settings, db.assignments,
   db.dailyPicks, db.journeys, db.diary, db.pond.bugs, todayNetFocusMs(), A (the running
   session), setupF / pickSel (the Focus setup), pathState(true) (noSave), countdownItems(),
   the pond's own cached state (_pondCache, never pondState(), which can save), and tab().
   It never writes to db and never calls save(): memory is in localStorage under
   'catchingdays.toads', so nothing syncs and focus-data.json is untouched.

   A choice can also run ONE whitelisted app action (ACTS), and only after the owner picks
   that choice and presses Enter on the toad's reply.

   Public: window.Toads = { version, mount, talk(name), close, isOpen, state(name), memory(name),
                            motionOn, el(name) }   (name defaults to 'hasu') */
(function(){
'use strict';
if(window.Toads) return;
if(!window.ToadArt){ try{ console.warn('toads.js: toad-art.js is missing, so there are no toads'); }catch(e){} return; }

const KEY='catchingdays.toads';
const $=id=>document.getElementById(id);
const q=sel=>{ try{ return document.querySelector(sel); }catch(e){ return null; } };
const PHONE='(max-width:760px)', COMPACT='(max-width:1240px)';
const phone=()=>{ try{ return matchMedia(PHONE).matches; }catch(e){ return false; } };
/* below 1240px (a tablet, a half-width laptop window) Hotaru's banner is too narrow to share with its text */
const compact=()=>{ try{ return matchMedia(COMPACT).matches; }catch(e){ return false; } };

/* ════════════════════ where they live ════════════════════
   One entry per toad.
     label  the button's aria-label          face  the portrait's viewBox in the talk box
     hopMs  how long .td-hop stays on after a tap (the longest of that toad's tap animations)
     homes  in order of preference; the first whose screen (`view`) is showing, whose
            when() holds and whose host() exists is where the button goes
       view   id of the screen's element (hidden by the app with .hide)
       watch  ids of elements the app repaints with innerHTML: the toad is put back when they change
       host   () → the element she sits in (position:relative, overflow hidden: a .water)
       static the host is built once and kept, and the toad stays in it while the screen is hidden
       art    ToadArt.svg options (size is only the first draw: toads.css sizes the button)
       stop   events the button must not let through to its home (Today's click-the-water ripple,
              the Focus rain's pointerdown splash)
   The toad's size and place are in toads.css, by [data-toad] and [data-home]. */
const PLACES={
  hasu:{label:'Hasu, Keeper of the Lotus. Talk', face:'-38 -88 76 76', hopMs:900,
    homes:[{id:'today', view:'v-daily', watch:['td-hero'], static:true, host:()=>$('td-hero'),
      art:{size:120,perch:'pad',water:true}, stop:['click']}]},
  ame:{label:'Ame, Keeper of the Rain. Talk', face:'-52 -96 104 104', hopMs:1000,
    homes:[
      {id:'setup', view:'v-setup', watch:['setup-body'], host:()=>q('#setup-body .st-pond'),
        art:{size:120,perch:'own',water:true}, stop:['pointerdown']},
      {id:'run', view:'v-run', watch:['run-body'], host:()=>$('run-hero'),
        art:{size:128,perch:'own',water:true}, stop:['pointerdown']}]},
  tabi:{label:'Tabi, Keeper of the Road. Talk', face:'-48 -102 96 96', hopMs:1800,
    homes:[{id:'road', view:'v-jrn', watch:['jrn-body'], host:()=>q('#jrn-body .jr-stream'),
      art:{size:124,perch:'own',water:true}}]},
  hotaru:{label:'Hotaru, Keeper of the Lanterns. Talk', face:'-36 -72 92 92', hopMs:1500,
    homes:[
      {id:'banner', view:'v-coll', watch:['coll-body'], when:()=>!compact(), host:()=>q('#coll-body .co-feat'),
        art:{size:104,perch:'own',water:true}},
      {id:'counter', view:'v-coll', watch:['coll-body'], when:()=>phone(), host:()=>q('#coll-body .co-feat')&&q('#coll-body .co-n'),
        art:{size:84,perch:'ground',water:false}}]},
  sumi:{label:'Sumi, Keeper of the Ink. Talk', face:'-44 -86 88 88', hopMs:1100,
    homes:[{id:'calendar', view:'v-dia', watch:['dia-body'], host:()=>q('#dia-body .calp'),
      art:{size:130,perch:'own',water:true}}]}
};
const NAMES=Object.keys(PLACES);

/* ════════════════════ the lines ════════════════════
   Data shape for every toad:
     intro : the first meeting, in order
     idle  : {id, t}                 motivational lines, picked at random
     ctx   : {id, when(s), key(s), t(s)}   context lines, in priority order.
             when(s) → true if it applies now; key(s) → a string that changes
             when the moment is new again (usually the day), so each one is
             said once per fresh moment; t(s) → the line.
     ask   : {id, q, when?(s), c:[{t, r, go?, act?}]}   questions; each choice has the toad's
             reply r, go = a screen to open after the reply ('run' etc.), act = one whitelisted
             action (ACTS). when(s) keeps a question for when it fits.
   s is the state readState() builds from the app when a toad is tapped:
   s.day, s.hr, s.goal, s.mins, s.running, s.sessionId, s.tasks.{n,done},
   s.overdue, s.path.{cur,met,left}, s.exam.{title,days}, plus each toad's own (EXTRA).
   Hasu's lines are here; the others' are in toad-lines.js (window.TOAD_LINES_CAST). */
const pl=(n,w)=>n===1?w:w+'s';
const short=(x,n)=>x.length>n?x.slice(0,n-1).trimEnd()+'…':x;
const LINES={
  hasu:{
    intro:[
      'Hm. Somebody finally tapped the old toad.',
      'I’m Hasu. I keep the lotus. Every minute you focus, it opens a little. I notice.',
      'Come and see me when the day gets heavy. I’ll say something useful. Or ask you something.'],
    idle:[
      {id:'summers', t:'I’ve sat on this pad for two hundred summers. You can sit for twenty-five minutes.'},
      {id:'mud',     t:'A lotus grows out of mud. Nobody holds the mud against it.'},
      {id:'small',   t:'Small is not the same as nothing. One task is one fish.'},
      {id:'rain',    t:'Rain doesn’t stop the pond. Neither should one bad hour.'},
      {id:'ready',   t:'You don’t have to feel ready. The water is never warm when you step in.'},
      {id:'next',    t:'Do the next thing. Then the next one. That’s the whole secret. Don’t tell the koi.'},
      {id:'slow',    t:'Slow is fine. I’m a toad. I have opinions about slow.'},
      {id:'back',    t:'You came back. That’s most of it, really. Coming back.'},
      {id:'days',    t:'A pond doesn’t fill in a day. It fills in days.'},
      {id:'rest',    t:'Hm. Even I close my eyes now and then. Rest is part of the work.'}],
    ctx:[
      {id:'late',  when:s=>s.hr>=23||s.hr<4, key:s=>s.day,
        t:()=>'It’s late. Even the koi are asleep. Whatever’s left will keep till morning.'},
      {id:'run',   when:s=>s.running, key:s=>s.day+'|'+(s.sessionId||''),
        t:()=>'Your session’s still going. Go on back. I’ll mind the pond.'},
      {id:'bloom', when:s=>s.goal>0&&s.mins>=s.goal, key:s=>s.day,
        t:()=>'The lotus is all the way open. Anything more today is a gift, not a debt.'},
      {id:'close', when:s=>s.goal>0&&s.mins>0&&s.mins<s.goal&&s.goal-s.mins<=15, key:s=>s.day,
        t:s=>`${s.goal-s.mins} ${pl(s.goal-s.mins,'minute')} from full bloom. I can wait that long. Can you?`},
      {id:'exam',  when:s=>!!s.exam&&s.exam.days>=0&&s.exam.days<=3, key:s=>s.day+'|'+s.exam.title,
        t:s=>s.exam.days===0?`${short(s.exam.title,44)} is today. You know more than you think you do.`
          :`${short(s.exam.title,44)} in ${s.exam.days} ${pl(s.exam.days,'day')}. Not a reason to panic. A reason to start.`},
      {id:'reeds', when:s=>s.overdue>=3, key:s=>s.day,
        t:s=>`${s.overdue} still waiting in the reeds. Don’t fight them all. Pull out the smallest one.`},
      {id:'path',  when:s=>s.path&&s.path.met&&s.path.cur>=3, key:s=>s.day,
        t:s=>`${s.path.cur} pads in a row now. The frog’s starting to treat it like a road.`},
      {id:'caught',when:s=>s.tasks.n>0&&s.tasks.done===s.tasks.n, key:s=>s.day,
        t:()=>'Every task on today’s line is caught. Sit a moment. Then rest properly.'},
      {id:'quiet', when:s=>s.goal>0&&s.mins===0&&s.hr>=13&&s.hr<23, key:s=>s.day,
        t:()=>'Not a minute on the water yet today. One short session wakes the lotus up.'}],
    ask:[
      {id:'one', q:'Of everything on today’s line, which one would you be glad to have done by tonight?', c:[
        {t:'I know which. Let’s start.', r:'Good. Do that one first, before the day gets loud.', go:'run'},
        {t:'I’m not sure yet.', r:'Look at the list for one breath. The one that makes your stomach drop a little. That one.'},
        {t:'Honestly? All of it.', r:'All of it is a flood. A net holds one fish at a time. Pick one.'}]},
      {id:'how', q:'How are you, really? Not the polite answer.', c:[
        {t:'Good, actually.', r:'Mm. Good days are for spending. Spend this one on something that matters to you.'},
        {t:'Tired.', r:'Then go small. Twenty minutes and a real rest still counts.'},
        {t:'Stressed.', r:'Then set some of it down. Write it in the journal. A pond clears when the mud settles.', go:'dia'}]},
      {id:'way', q:'What’s in your way right now?', c:[
        {t:'I don’t know where to start.', r:'Then start in the wrong place. Moving water finds its way.', go:'asg'},
        {t:'My phone.', r:'Face down, other side of the room. It’ll survive. So will you.'},
        {t:'I’m dreading it.', r:'Dread is mostly the waiting. Do five minutes of it, then decide.', go:'run'}]}]
  }
};
/* the others' lines come from toad-lines.js, looked up when needed so load order can't matter */
const linesOf=name=>LINES[name]||(window.TOAD_LINES_CAST&&window.TOAD_LINES_CAST[name])||null;
const GO_LABEL={run:'Focus',asg:'Tasks',dia:'Journal',jrn:'Journeys',daily:'Today'};

/* ════════════════════ what a choice may do ════════════════════
   Only these three, only by name, only after the owner picked the choice and pressed
   Enter (or clicked) on the toad's reply. Nothing is saved by any of them until the
   owner saves in the form that opens, or presses Begin on a session that starts. */
const viewShown=id=>{ const v=$(id); return !!v&&!v.classList.contains('hide'); };
/* startSession() starts the timer at once with whatever the setup screen holds, so it only
   runs from the setup screen itself with a task picked, exactly as the Begin session button
   would. From anywhere else, or with nothing picked, the owner is sent to the setup instead. */
function canStartSession(){
  try{ return typeof startSession==='function'&&typeof A!=='undefined'&&!A&&viewShown('v-setup')&&typeof pickSel!=='undefined'&&pickSel.size>0; }catch(e){ return false; }
}
const ACTS={
  startSession:{label:()=>canStartSession()?'start the session':'go to Focus setup',
    run:()=>{ if(canStartSession()) startSession(); else tab('run'); }},
  newEntry:{label:()=>'start a new entry', run:()=>diaryModal()},
  newJourney:{label:()=>'start a new journey', run:()=>journeyModal()}
};
/* own properties only: a name like "constructor" or "__proto__" is not an action */
const isAct=n=>typeof n==='string'&&Object.prototype.hasOwnProperty.call(ACTS,n);
function runAct(name){
  const a=isAct(name)?ACTS[name]:null; if(!a) return;
  try{ a.run(); }catch(e){ try{ console.warn('toads.js act:',name,e); }catch(x){} }
}

/* ════════════════════ putting a visit together ════════════════════
   mem is what's kept in localStorage for each toad:
     {met, n, day, today, recent:[ids], ctx:{id:key}, asked:{id:{day,pick,at}}}
   One tap = one visit = one to three beats:
     1. never met → the intro, nothing else.
     2. a context line whose moment is fresh (first in priority order), or
        else a motivational line not among the last six said.
     3. a question, if none has been answered today and either this is not
        the first visit today or a 35% roll comes up. Never the same question
        twice in a day; the one asked longest ago first; only one whose when(s) fits. */
function visit(name,s,mem,rnd){
  rnd=rnd||Math.random;
  const L=linesOf(name), beats=[];
  if(!L) return beats;
  if(mem.day!==s.day){ mem.day=s.day; mem.today=0; }
  if(!mem.met){ mem.met=Date.now(); mem.n=1; mem.today=1; return L.intro.map(t=>({t})); }
  const c=L.ctx.find(x=>{ try{ return x.when(s)&&mem.ctx[x.id]!==x.key(s); }catch(e){ return false; } });
  if(c){ mem.ctx[c.id]=c.key(s); beats.push({t:c.t(s),id:c.id}); }
  else{
    let pool=L.idle.filter(x=>!mem.recent.includes(x.id)); if(!pool.length) pool=L.idle;
    const x=pool[Math.floor(rnd()*pool.length)];
    mem.recent=[x.id,...mem.recent.filter(i=>i!==x.id)].slice(0,6);
    beats.push({t:x.t,id:x.id});
  }
  const answeredToday=Object.values(mem.asked).some(a=>a.day===s.day);
  if(!answeredToday&&(mem.today>=1||rnd()<.35)){
    const q=L.ask.filter(a=>!(mem.asked[a.id]&&mem.asked[a.id].day===s.day))
      .filter(a=>{ try{ return !a.when||a.when(s); }catch(e){ return false; } })
      .sort((a,b)=>((mem.asked[a.id]||{}).at||0)-((mem.asked[b.id]||{}).at||0))[0];
    if(q) beats.push({q:q.q,c:q.c,id:q.id});
  }
  mem.n=(mem.n||0)+1; mem.today=(mem.today||0)+1;
  return beats;
}
function newMem(){ return {met:0,n:0,day:'',today:0,recent:[],ctx:{},asked:{}}; }

/* ════════════════════ memory (localStorage, never db) ════════════════════ */
const isObj=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
function cleanMem(h){
  const m=newMem(); if(!isObj(h)) return m;
  m.met=+h.met||0; m.n=+h.n||0; m.today=+h.today||0; m.day=typeof h.day==='string'?h.day:'';
  if(Array.isArray(h.recent)) m.recent=h.recent.filter(x=>typeof x==='string').slice(0,6);
  if(isObj(h.ctx)) Object.keys(h.ctx).forEach(k=>{ if(typeof h.ctx[k]==='string') m.ctx[k]=h.ctx[k]; });
  if(isObj(h.asked)) Object.keys(h.asked).forEach(k=>{ const a=h.asked[k];
    if(isObj(a)&&typeof a.day==='string') m.asked[k]={day:a.day,pick:+a.pick||0,at:+a.at||0}; });
  return m;
}
const MEM={};     // name → mem, loaded once; saves go to localStorage when it works
let _loaded=false;
function loadAll(){
  if(_loaded) return; _loaded=true;
  try{ const j=JSON.parse(localStorage.getItem(KEY)||'null');
    if(isObj(j)) NAMES.forEach(n=>{ if(j[n]) MEM[n]=cleanMem(j[n]); }); }catch(e){}
}
const memOf=n=>{ loadAll(); return MEM[n]||(MEM[n]=newMem()); };
/* a save starts from what is stored, so a toad this build doesn't know (one added later,
   or another tab's) keeps its memory; only the toads this page has spoken to are overwritten */
function saveAll(){
  try{ let cur={}; try{ const j=JSON.parse(localStorage.getItem(KEY)||'null'); if(isObj(j)) cur=j; }catch(e){}
    localStorage.setItem(KEY,JSON.stringify(Object.assign(cur,{v:1},MEM))); }catch(e){}
}

/* ════════════════════ reading the app (read-only) ════════════════════ */
function readState(name){
  const s={day:'',hr:12,goal:0,mins:0,running:false,sessionId:'',tasks:{n:0,done:0},overdue:0,path:null,exam:null};
  try{ s.day=today(); }catch(e){}
  if(!s.day){ try{ const d=new Date(); s.day=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }catch(e){} }
  try{ s.hr=+etHour(Date.now()); }catch(e){ try{ s.hr=new Date().getHours(); }catch(e2){} }
  if(!(s.hr>=0&&s.hr<=23)) s.hr=12;
  try{ s.goal=+db.settings.goal||0; }catch(e){}
  try{ s.mins=Math.round(todayNetFocusMs()/60000)||0; }catch(e){}
  try{ s.running=!!A; s.sessionId=(A&&A.id)||''; }catch(e){}
  /* today's catch, the way todaysItems() builds it, minus its journeyTick() (which saves) */
  try{
    const t=s.day||today();
    const auto=db.assignments.filter(a=>a.due===t&&!inArchivedCls(a)&&journeyAssignmentIsActive(a));
    const seen=new Set(auto.map(a=>a.id));
    const picks=(db.dailyPicks&&db.dailyPicks[t])||[];
    const picked=picks.filter(id=>!seen.has(id)).map(id=>db.assignments.find(a=>a.id===id))
      .filter(a=>a&&!inArchivedCls(a)&&journeyAssignmentIsActive(a));
    const items=auto.concat(picked).filter(a=>!a.ann);       // announcements can't be completed
    s.tasks={n:items.length,done:items.filter(a=>a.done).length};
  }catch(e){}
  try{
    const t=s.day||today();
    s.overdue=db.assignments.filter(a=>!a.done&&!a.ann&&a.due&&a.due<t&&!inArchivedCls(a)&&journeyAssignmentIsActive(a)).length;
  }catch(e){}
  try{ const p=pathState(true); if(p) s.path={cur:+p.cur||0,met:!!p.met,left:+p.left||0}; }catch(e){}
  try{
    const x=countdownItems().map(i=>({title:String(i.title||''),days:dDelta(i.examDate!==undefined?i.examDate:i.due)}))
      .filter(i=>i.title&&typeof i.days==='number'&&i.days>=0)[0];
    if(x) s.exam=x;
  }catch(e){}
  const ex=name&&EXTRA[name]; if(ex){ try{ ex(s); }catch(e){} }
  return s;
}
/* what each toad's own lines read, each a function that adds to s and may throw */
const EXTRA={
  /* Ame: the Focus session (A) and the setup's rhythm */
  ame(s){
    s.focusLen=25;
    try{ s.focusLen=(A&&+A.focusMin)||(typeof setupF!=='undefined'&&+setupF)||+db.settings.focus||25; }catch(e){}
    try{ if(A){ s.paused=!!A.paused; s.phase=A.phase==='break'?'break':'focus'; s.cycles=(A.cycles||[]).length; } }catch(e){}
  },
  /* Tabi: the journey the Journeys screen is showing, if it is active, else the first active one */
  tabi(s){
    const t=s.day, all=[...(db.journeys||[])].sort((x,y)=>(x.status==='active'?0:1)-(y.status==='active'?0:1)||y.created-x.created);
    let j=null; try{ j=all.find(x=>x.id===jrnSel); }catch(e){}
    if(!j||j.status!=='active') j=all.find(x=>x.status==='active')||null;
    if(!j){ s.journey=null; return; }
    const dayNum=Math.max(1,Math.min(j.days,-dDelta(j.start)+1));
    const dates=Array.from({length:j.days},(_,i)=>addDays(j.start,i));
    const states=dates.map(dk=>jDayState(j,dk));
    let streak=0; for(let i=dates.indexOf(t)>=0?dates.indexOf(t):states.length-1;i>=0;i--){ if(states[i]==='kept') streak++; else if(states[i]==='today') continue; else break; }
    const due=j.habits.map(h=>db.assignments.find(a=>a.habitId===h.id&&a.due===t)).filter(Boolean);
    const y=addDays(t,-1);
    s.journey={name:j.name, day:dayNum, days:j.days, streak, todayN:due.length,
      todayDone:due.filter(a=>a.done&&a.habitOutcome!=='skipped').length,
      missedYesterday:y>=j.start&&jDayState(j,y)==='missed'};
  },
  /* Hotaru: the Collection. The pond's state is read from the cache the Collection screen
     has just painted from; pondState() itself can save and queue unlock screens, so it is never called */
  hotaru(s){
    const t=s.day, st=(typeof _pondCache!=='undefined')?_pondCache:null;
    if(st){
      s.fish=st.foundN||0;
      const fresh=Object.keys(st.found).filter(k=>{ const f=st.found[k]; return f&&f.how!=='adopt'&&f.at&&dayKey(f.at)===t&&PondArt.SP[k]; })
        .sort((a,b)=>st.found[b].at-st.found[a].at);
      s.newToday=fresh.length?PondArt.SP[fresh[0]].name:null;
      s.legendary=PondArt.SPEC.filter(sp=>sp.rar==='Legendary'&&st.found[sp.k]).length;
      s.next=st.next?{name:st.next.sp.name,cur:st.next.p.cur,n:st.next.p.n}:null;
    }
    s.bugs=REED_BUGS.filter(b=>db.pond.bugs[b.k]).length;
    const rec=db.pond.bugs[reedBugOfDay(t).k]; s.bugToday=!!(rec&&rec.last===t);
  },
  /* Sumi: the Journal's pages, by their dates and moods, never their words */
  sumi(s){
    const t=s.day, dia=(db.diary||[]).filter(e=>e&&e.date);
    s.wroteToday=dia.some(e=>e.date===t||(e.created&&dayKey(e.created)===t));
    const last=dia.map(e=>e.date).filter(d=>d<=t).sort().pop();
    s.lastEntryDays=last?-dDelta(last):999;
    const lm=dia.filter(e=>e.mood&&e.date<=t).sort((a,b)=>(b.date||'').localeCompare(a.date||''))[0];
    s.lastMood=lm?lm.mood:null;
    s.monthEntries=dia.filter(e=>e.date.slice(0,7)===t.slice(0,7)).length;
  }
};

/* ════════════════════ is something else on top? ════════════════════ */
function helloUp(){ const v=$('v-hello'); return !!v&&!v.classList.contains('hide')&&!v.classList.contains('out'); }
function unlockUp(){ const v=$('v-unlock'); return !!v&&!v.classList.contains('hide'); }
function modalUp(){ const m=$('modals'); return !!m&&m.innerHTML.trim()!==''; }
const momentUp=()=>{ try{ return !!window.PondEvents?.isOpen(); }catch(e){ return false; } };
const blocked=()=>helloUp()||unlockUp()||modalUp()||momentUp();

/* ════════════════════ motion ════════════════════
   .td-mv goes on a toad only when it's moving. The app's switch is
   db.settings.pondMotion (what pondMotionOn() reads, minus the side effects it
   has on PondArt.PF); `pond-still` on <body> is honoured too, and so is the
   OS's reduced-motion setting. A toad's idle loop also stops whenever it can't be
   seen: its screen isn't showing, it's scrolled out of view, the page is hidden,
   Hello / the unlock screen / a pond moment is covering the app, or its own talk box
   is up (the portrait there is the one that moves). So at most one idle loop runs. */
let reduceMQ=null; try{ reduceMQ=matchMedia('(prefers-reduced-motion: reduce)'); }catch(e){}
function motionOn(){
  try{ if(document.body.classList.contains('pond-still')) return false; }catch(e){}
  try{ if(db.settings.pondMotion===false) return false; }catch(e){}
  try{ if(reduceMQ&&reduceMQ.matches) return false; }catch(e){}
  return true;
}

/* ════════════════════ placement ════════════════════ */
const TD={};                 // name → {name, def, btn, home, artSig, inView, mvOn, hopT}
let closedAt=0, pendingT=0, pendingName='';
let io=null, mo=null;
const watched=new WeakSet();
/* a toad is "live" while it is in the page AND its screen is showing (a kept hero stays mounted while Today is hidden, but isn't live) */
const homeLive=t=>!!(t.home&&t.btn&&t.btn.isConnected&&viewShown(t.home.view));
function syncMotion(t){
  if(!t||!t.btn) return;
  const talking=!!T&&T.name===t.name&&!t.btn.classList.contains('td-hop');
  const on=motionOn()&&t.inView&&homeLive(t)&&!document.hidden&&!helloUp()&&!unlockUp()&&!momentUp()&&!talking;
  if(on!==t.mvOn){ t.mvOn=on; t.btn.classList.toggle('td-mv',on); if(!on) t.btn.classList.remove('td-hop'); }
}
const syncAll=()=>NAMES.forEach(n=>syncMotion(TD[n]));
function buildBtn(t){
  const b=document.createElement('button'); b.type='button'; b.className='td-toad';
  b.dataset.toad=t.name; b._t=t;
  b.setAttribute('aria-label',t.def.label);
  b.addEventListener('click',e=>onTap(e,t));
  /* the Focus rain splashes on pointerdown: not when a toad is tapped */
  b.addEventListener('pointerdown',e=>{ if(t.home&&t.home.stop&&t.home.stop.includes('pointerdown')) e.stopPropagation(); });
  if(io) io.observe(b);
  return b;
}
/* put one toad where it lives right now, or take it out of the page when it has no home showing */
function placeToad(t){
  let pick=null;
  for(const h of t.def.homes){
    if(!h.static&&!viewShown(h.view)) continue;
    if(h.when){ let ok=false; try{ ok=!!h.when(); }catch(e){} if(!ok) continue; }
    let host=null; try{ host=h.host(); }catch(e){}
    if(host){ pick={h,host}; break; }
  }
  if(!pick){ if(t.btn&&t.btn.parentNode) t.btn.remove(); t.home=null; return; }
  const {h,host}=pick;
  if(!t.btn) t.btn=buildBtn(t);
  const sig=JSON.stringify(h.art);
  if(t.artSig!==sig){ t.btn.innerHTML=window.ToadArt.svg(t.name,h.art); t.artSig=sig; }
  if(t.btn.parentNode!==host) host.appendChild(t.btn);
  if(t.btn.dataset.home!==h.id) t.btn.dataset.home=h.id;
  t.home=h;
  /* a host that is built once and kept is watched for being emptied */
  if(h.static&&mo&&!watched.has(host)){ mo.observe(host,{childList:true}); watched.add(host); }
}
function mount(){ NAMES.forEach(n=>{ if(TD[n]) placeToad(TD[n]); }); return NAMES.some(n=>TD[n]&&TD[n].home); }
let T=null;                  // T: the talk in progress

/* ════════════════════ tapping a toad ════════════════════ */
function onTap(e,t){
  if(t.home&&t.home.stop&&t.home.stop.includes('click')) e.stopPropagation();   // the hero's onclick would make a ripple: she makes her own
  if(Date.now()-closedAt<400) return;        // the Enter/Space that closed the box must not reopen it
  if(T||pendingT){ if(box&&T) try{ box.focus({preventScroll:true}); }catch(x){} return; }
  if(blocked()||!homeLive(t)) return;
  talk(t.name);
}
function talk(name){
  name=name||'hasu'; const t=TD[name];
  if(!t||!t.btn||T||pendingT||blocked()||!homeLive(t)) return;
  const motion=motionOn();
  if(motion){ t.btn.classList.add('td-mv'); t.mvOn=true;
    t.btn.classList.remove('td-hop'); void t.btn.offsetWidth; t.btn.classList.add('td-hop');
    clearTimeout(t.hopT); t.hopT=setTimeout(()=>{ t.btn.classList.remove('td-hop'); syncMotion(t); },t.def.hopMs||900); }
  /* the hop leads, the box rises mid-air */
  pendingName=name;
  pendingT=setTimeout(()=>{
    pendingT=0;
    try{
      if(blocked()||!homeLive(t)) return;
      const s=readState(name), mem=memOf(name), beats=visit(name,s,mem);
      if(!beats.length) return;
      saveAll();
      open(name,beats,{motion,from:t.btn,
        go:g=>{ try{ tab(g); }catch(e){} },
        onAnswer:(id,i)=>{ mem.asked[id]={day:s.day,pick:i,at:Date.now()}; saveAll(); }});
    }catch(e){ try{ console.warn('toads.js:',e); }catch(x){} }
  },motion?380:0);
}

/* ════════════════════ the talk box ════════════════════ */
const MORE='<svg class="tdz-more" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 5.2 L7 9.4 L11 5.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
let box=null;
function buildBox(){
  if(box) return box;
  box=document.createElement('div'); box.className='tdz-talk'; box.tabIndex=-1;
  box.setAttribute('role','dialog'); box.setAttribute('aria-modal','false'); box.setAttribute('aria-labelledby','tdz-n');
  box.innerHTML=`<div class="tdz-pt"></div>
    <div class="tdz-b"><span class="tdz-ey"></span><span class="tdz-n" id="tdz-n"></span>
      <p class="tdz-t" aria-hidden="true"><span class="on"></span><span class="off"></span></p>
      <p class="tdz-sr" aria-live="polite"></p>
      <div class="tdz-ch"></div>
      <div class="tdz-f"><span class="tdz-k"></span>${MORE}</div></div>
    <button class="tdz-x" type="button" aria-label="Close">✕</button>`;
  document.body.appendChild(box);
  box.addEventListener('click',e=>{
    if(e.target.closest('.tdz-x')){ close(); return; }
    const c=e.target.closest('.tdz-c'); if(c){ choose(+c.dataset.i); return; }
    advance();
  });
  /* capture phase, on document: while a toad is talking, its keys are its own and
     never reach the app's own handlers (Hello's Enter, the timer's Space, the shortcuts) */
  document.addEventListener('keydown',onKey,true);
  document.addEventListener('keyup',onKeyUp,true);
  return box;
}
const typingEl=a=>!!a&&a!==box&&!!a.matches&&a.matches('input,textarea,select,[contenteditable]');
function onKey(e){
  if(!T) return;
  if(e.ctrlKey||e.metaKey||e.altKey) return;
  if(blocked()){ close(false); return; }       // something above us owns the keyboard
  const a=document.activeElement, onBtn=!!(a&&a.closest&&a.closest('.tdz-talk button'));
  if(e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); close(); return; }
  if(typingEl(a)) return;                      // typing elsewhere keeps its own keys
  if(/^[1-3]$/.test(e.key)&&T.choices){ e.stopPropagation(); const i=+e.key-1;
    if(i<T.choices.length){ e.preventDefault(); if(!e.repeat) choose(i); } return; }
  if(e.key==='Enter'||e.code==='Space'){
    e.stopPropagation();
    if(onBtn) return;                          // a focused button in the box does its own click
    e.preventDefault(); if(!e.repeat) advance();
  }
}
/* Space on a button clicks on keyup: if the keydown just closed the box and moved
   focus to the toad, don't let that keyup click it */
function onKeyUp(e){
  if(Date.now()-closedAt<400&&(e.key==='Enter'||e.code==='Space')){ e.preventDefault(); e.stopPropagation(); }
}
/* open(name, beats, o)  o: {motion, from (the toad's button, focus returns there),
   go(screen) navigation callback, onAnswer(qid, i)} */
function open(name,beats,o){
  buildBox(); o=o||{};
  if(T) clearTimeout(T.timer);
  const d=window.ToadArt.TOADS[name], def=PLACES[name]||{};
  T={name,beats,i:0,o,timer:null,typing:false,choices:null,go:null,act:null};
  clearTimeout(box._outT);
  box.classList.toggle('mv',o.motion!==false);
  box.querySelector('.tdz-ey').textContent=d.title;
  box.querySelector('.tdz-n').textContent=d.name;
  const pt=box.querySelector('.tdz-pt');
  pt.className='tdz-pt'+(def.face?' tdz-face':'')+(o.motion!==false?' td-mv':'');
  pt.innerHTML=window.ToadArt.svg(name,{size:112,perch:'none'});
  // the dialogue avatar is a face portrait; the pond still shows the full figure
  if(def.face) pt.querySelector('.td-art').setAttribute('viewBox',def.face);
  place();
  box.classList.remove('out'); void box.offsetWidth; box.classList.add('show');
  try{ box.focus({preventScroll:true}); }catch(e){}
  show(0);
  syncAll();
}
/* on a phone the box rides just above the bottom nav, whatever height the nav is
   (it grows when a tab shows a second line); toads.css reads --tdz-bottom */
function place(){
  if(!box) return;
  let b=''; try{ const nav=document.querySelector('.sidebar');
    if(nav&&matchMedia('(max-width:760px)').matches){ const h=innerHeight-nav.getBoundingClientRect().top; if(h>0&&h<400) b=(Math.round(h)+10)+'px'; } }catch(e){}
  if(b) box.style.setProperty('--tdz-bottom',b); else box.style.removeProperty('--tdz-bottom');
}
window.addEventListener('resize',()=>{ if(T) place(); });
function show(i){
  T.i=i; const b=T.beats[i]; clearTimeout(T.timer);
  const text=b.q||b.t, tEl=box.querySelector('.tdz-t'), on=tEl.querySelector('.on'), off=tEl.querySelector('.off');
  const ch=box.querySelector('.tdz-ch'); ch.innerHTML=''; ch.classList.remove('in');
  T.choices=null; T.go=b.go||null; T.act=isAct(b.act)?b.act:null;
  tEl.classList.toggle('q',!!b.q);
  box.querySelector('.tdz-sr').textContent=text;
  box.classList.remove('ready');
  const last=i>=T.beats.length-1;
  box.querySelector('.tdz-k').innerHTML=b.q?'':`<kbd>Enter</kbd> ${T.act?ACTS[T.act].label():b.go?'go to '+(GO_LABEL[b.go]||b.go):last?'close':'next'}`;
  const pt=box.querySelector('.tdz-pt');
  const done=()=>{ T.typing=false; on.textContent=text; off.textContent=''; pt.classList.remove('td-talking');
    if(b.q){ ch.innerHTML=b.c.map((c,k)=>`<button type="button" class="tdz-c${(c.go||isAct(c.act))?' tdz-go':''}" data-i="${k}"><kbd>${k+1}</kbd><span></span></button>`).join('');
      ch.querySelectorAll('.tdz-c span').forEach((s,k)=>{ s.textContent=b.c[k].t; });
      T.choices=b.c; void ch.offsetWidth; ch.classList.add('in'); }
    else box.classList.add('ready'); };
  if(T.o.motion===false){ done(); return; }
  /* letter by letter: ~32 a second, a beat longer after punctuation */
  T.typing=true; pt.classList.add('td-talking');
  let k=0;
  const step=()=>{ k++; on.textContent=text.slice(0,k); off.textContent=text.slice(k);
    if(k>=text.length){ done(); return; }
    const ch0=text[k-1]; T.timer=setTimeout(step,/[.?!…]/.test(ch0)&&text[k]===' '?260:/[,;:—]/.test(ch0)?130:28); };
  on.textContent=''; off.textContent=text; T.timer=setTimeout(step,180);
  T.finish=()=>{ clearTimeout(T.timer); done(); };
}
function advance(){
  if(!T) return;
  if(T.typing){ T.finish(); return; }
  if(T.choices) return;                       // a question waits for an answer
  /* a reply that sends the owner somewhere (go) or does one whitelisted thing (act):
     leaving the screen, so no focus is given back */
  if(T.act||T.go){ const g=T.go, a=T.act, f=T.o.go; close(false); if(a) runAct(a); else if(f) f(g); return; }
  if(T.i<T.beats.length-1) show(T.i+1); else close();
}
function choose(i){
  if(!T||!T.choices) return;
  if(T.typing) T.finish();
  const b=T.beats[T.i], c=b.c[i]; if(!c) return;
  if(T.o.onAnswer) T.o.onAnswer(b.id,i);
  T.beats.splice(T.i+1,0,{t:c.r,go:c.go,act:c.act});   // the toad's reply comes next, then anything after
  show(T.i+1);
}
/* close(giveFocusBack=true): focus goes back to the toad unless we're leaving
   (a choice that opens a screen, its screen hiding, something opening on top) */
function close(giveFocusBack){
  if(!T||!box){ if(pendingT&&giveFocusBack===false){ clearTimeout(pendingT); pendingT=0; } return; }
  clearTimeout(T.timer);
  const from=T.o.from, t=TD[T.name]; T=null; closedAt=Date.now();
  box.classList.add('out'); box.classList.remove('show','ready');
  /* once it has faded, stop the portrait's loops: nothing animates unseen */
  clearTimeout(box._outT);
  box._outT=setTimeout(()=>{ if(!T){ const pt=box.querySelector('.tdz-pt'); pt.className='tdz-pt'; pt.innerHTML=''; } },420);
  if(giveFocusBack!==false&&from&&t&&homeLive(t)&&!blocked()) try{ from.focus({preventScroll:true}); }catch(e){}
  syncAll();
}

/* ════════════════════ keeping each toad in place ════════════════════
   Everything that can change under a toad is watched with observers, not polled:
   - each home's screen (class: shown or hidden) and the element the app repaints with
     innerHTML (Focus setup, the running screen, Journeys, Collection): the toad is put
     back into the new water; a kept hero (Today) is watched for being emptied
   - #v-hello, #v-unlock, #modals, <body> children (a pond moment's dialog): something
     opened on top → the box closes and the loops pause
   - <body> class (pond-still), the OS reduced-motion setting, the phone width → motion, homes */
function onWatch(){
  NAMES.forEach(n=>{ const t=TD[n]; if(t){ placeToad(t); syncMotion(t); } });
  if(T){ const t=TD[T.name]; if(blocked()||!t||!homeLive(t)) close(false); }
  if(pendingT){ const t=TD[pendingName]; if(blocked()||!t||!homeLive(t)){ clearTimeout(pendingT); pendingT=0; } }
}
function watch(){
  if(typeof MutationObserver!=='function') return;
  const views=new Set(), ids=new Set();
  NAMES.forEach(n=>PLACES[n].homes.forEach(h=>{ views.add(h.view); (h.watch||[]).forEach(i=>ids.add(i)); }));
  views.forEach(id=>{ const el=$(id); if(el) mo.observe(el,{attributes:true,attributeFilter:['class'],childList:true}); });
  ids.forEach(id=>{ const el=$(id); if(el) mo.observe(el,{childList:true}); });
  ['v-hello','v-unlock'].forEach(id=>{ const el=$(id); if(el) mo.observe(el,{attributes:true,attributeFilter:['class']}); });
  const md=$('modals'); if(md) mo.observe(md,{childList:true});
  mo.observe(document.body,{attributes:true,attributeFilter:['class'],childList:true});
  document.addEventListener('visibilitychange',syncAll);
  const mq=(m,f)=>{ if(!m) return; try{ m.addEventListener('change',f); }catch(e){ try{ m.addListener(f); }catch(e2){} } };
  mq(reduceMQ,syncAll);
  try{ mq(matchMedia(PHONE),onWatch); mq(matchMedia(COMPACT),onWatch); }catch(e){}
}

function init(){
  try{
    try{ window.ToadArt.injectCSS(); }catch(e){}
    try{ window.ToadArt.injectCastCSS&&window.ToadArt.injectCastCSS(); }catch(e){}
    try{ io=new IntersectionObserver(es=>{ es.forEach(en=>{ const t=en.target._t; if(t){ t.inView=en.isIntersecting; syncMotion(t); } }); },{threshold:0}); }catch(e){ io=null; }
    if(typeof MutationObserver==='function') mo=new MutationObserver(onWatch);
    /* a toad whose art isn't loaded (or that has no lines) simply isn't placed */
    NAMES.forEach(n=>{ if(window.ToadArt.TOADS[n]) TD[n]={name:n,def:PLACES[n],btn:null,home:null,artSig:'',inView:!io,mvOn:false,hopT:0}; });
    if(mo) watch();
    onWatch();
  }catch(e){ try{ console.warn('toads.js:',e); }catch(x){} }
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();

window.Toads={version:2,mount,talk,close:()=>close(),isOpen:()=>!!T||!!pendingT,state:name=>readState(name||'hasu'),
  memory:name=>memOf(name||'hasu'),motionOn,el:name=>(TD[name||'hasu']||{}).btn||null};
})();
