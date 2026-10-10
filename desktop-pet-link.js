/* desktop-pet-link.js · Catching Days · the desktop toad's way in
   ─────────────────────────────────────────────────────────────────────────
   Optional. Does nothing at all unless the desktop toad (desktop-pet/) has
   been set up next to this app, which it shows by writing
   desktop-pet-inbox.json into this folder.

   The toad never writes focus-data.json. What you do on it (tick a task,
   start a focus session, rate a block, end a session) arrives here as a list
   of ops, each stamped with the moment you did it, and is applied with the
   app's own functions: toggleAsg, startSession, endFocus/afterRating,
   endBreak, finishSession/saveSession. So a task ticked on the desktop
   releases its fish, and a session started there is saved with its cycles,
   exactly as if it had happened in here. While an op is applied, Date.now()
   reads the op's own time, so a tick made while this page was closed is
   stamped when you made it, not when the app caught up.

   db.desktopPet.upto records the newest op taken in, so nothing is applied
   twice; the toad drops an op from its inbox once focus-data.json shows it.

   Ops reach this page two ways: an event stream from the toad (instant, even
   while this tab is in the background) and, as a fallback, reading the inbox
   file when the page loads, comes back into view, or every so often.

   Nothing here opens over a dialog you're using: if one is open, ops that
   would need the session's own dialogs wait until it closes. With two tabs
   of the app open, only one of them takes ops in. */
(function(){
'use strict';
if(typeof SERVER==='undefined'||!SERVER) return;      // only the local-server build shares a folder with the toad
const FILE='desktop-pet-inbox.json';
const ID=Math.random().toString(36).slice(2,10);
let es=null, port=0, busy=false, again=false, lastSeen=[], retryT=null, backoff=5000;

const upto=()=>+((db.desktopPet&&db.desktopPet.upto)||0);
function at(t,fn){
  const real=Date.now;
  Date.now=()=>t;
  try{ return fn(); } finally{ Date.now=real; }
}
const modalOpen=()=>!!($('modals')&&$('modals').innerHTML);
/* a dialog that's ours to answer: the cycle rating the session itself opened */
const ratingOpen=()=>modalOpen()&&typeof modalLocked!=='undefined'&&modalLocked&&!!A&&A.phase==='rating';
const runShown=()=>{ const v=$('v-run'); return !!v&&!v.classList.contains('hide'); };

/* session functions call run(), which shows the Focus screen whatever tab
   you're on. Put things back the way you left them, or, for a session that
   just started, take you to it (as a reload with a live session would). */
function settle(prevCur,goRun){
  if(goRun&&A&&!modalOpen()&&!isTyping(document.activeElement)){ if(cur!=='run') tab('run'); return; }
  if(cur!=='run'&&runShown()){
    $('v-run').classList.add('hide'); $('v-setup').classList.add('hide');
    clearInterval(tick); tick=null;
    if(typeof rainSync==='function') rainSync();
  }
}

const H={
  task(o){
    const a=asg(o.aid); if(!a||a.ann) return;
    if(!!a.done===!!o.on) return;
    if(o.on&&A&&A.assignmentIds.includes(a.id)){
      const n=A.cycles.length+(A.phase==='break'?0:1);
      toggleAsg(a.id,true,A.id,n);
    } else toggleAsg(a.id,!!o.on);
  },
  start(o){
    if(A||db.sessions.some(s=>s.id===o.sid)) return;
    const pf=setupF, pb=setupB, nameEl=$('in-name'), typed=nameEl?nameEl.value:null;
    setupF=o.f; setupB=o.b;
    pickSel=new Set((o.ids||[]).filter(id=>{ const a=asg(id); return a&&!a.done; }));
    if(nameEl) nameEl.value=o.name||'';
    startSession();
    if(nameEl) nameEl.value=typed;
    setupF=pf; setupB=pb;
    if(A){ A.id=o.sid; db.active=A; }
    return 'run';
  },
  pause(o){ if(A&&A.id===o.sid&&!A.paused&&A.phase!=='rating') togglePause(); },
  resume(o){ if(A&&A.id===o.sid&&A.paused) togglePause(); },
  rate(o){
    if(!A||A.id!==o.sid) return;
    if(A.phase==='focus'){
      if(A.cycles.length!==(o.n||1)-1) return;
      endFocus();                       // opens the cycle rating…
    }
    if(A.phase!=='rating') return;
    closeModal();                       // …which the toad has already answered
    afterRating(o.r||null,o.j||'');
  },
  'break-end'(o){ if(A&&A.id===o.sid&&A.phase==='break'&&A.cycles.length===(o.n||0)) endBreak(); },
  finish(o){
    if(!A||A.id!==o.sid) return;
    if(A.phase==='rating'){ closeModal(); afterRating(null,''); }   // a finished block is never dropped
    finishSession();                    // the wrap-up dialog…
    const n=$('s-name'), j=$('jr');
    if(n) n.value=o.name||''; if(j) j.value=o.j||'';
    saveSession();                      // …filled in and saved, as its Save button would
    return 'done';
  }
};
const needsDialog=o=>o.k==='focus'&&(o.act==='rate'||o.act==='finish');

async function take(ops){
  if(!Array.isArray(ops)||!ops.length) return;
  if(busy){ again=true; lastSeen=ops; return; }
  busy=true;
  try{
    await window.appReady;
    const list=ops.filter(o=>o&&o.t>upto()&&(o.k==='task'||(o.k==='focus'&&H[o.act]))).sort((a,b)=>a.t-b.t);
    if(!list.length) return;
    const prevCur=cur;
    let u=upto(), did=false, goRun=false;
    for(const o of list){
      /* a dialog of yours is open: the session's own dialogs would replace it, so wait */
      if(needsDialog(o)&&modalOpen()&&!ratingOpen()){ setTimeout(()=>{ if(!modalOpen()) take(lastSeen); },2500); break; }
      try{
        const r=at(o.t,()=>o.k==='task'?H.task(o):H[o.act](o));
        if(r==='run') goRun=true;
        if(r==='done') goRun=false;
      }catch(e){ console.warn('Desktop toad: could not apply',o,e); }
      u=o.t; did=true;
    }
    if(did){
      db.desktopPet=Object.assign({},db.desktopPet,{upto:u});
      save();
      settle(prevCur,goRun);
      try{ repaint(); }catch(e){}
    }
  } finally{
    busy=false;
    if(again){ again=false; take(lastSeen); }
  }
}

/* ── the inbox file: on load, on coming back, and now and then ── */
async function readInbox(){
  const txt=await rFile(FILE);
  if(txt==null) return null;
  let o=null; try{ o=JSON.parse(txt); }catch(e){ return null; }
  if(!o||typeof o!=='object') return null;
  lastSeen=Array.isArray(o.ops)?o.ops:[];
  take(lastSeen);
  return o;
}
/* ── the toad's event stream: instant, and it tells the toad this tab is open ── */
function connect(p){
  if(es||!p) return;
  port=p;
  try{ es=new EventSource(`http://127.0.0.1:${p}/events?id=${ID}`); }catch(e){ es=null; return; }
  es.addEventListener('ops',e=>{ try{ const d=JSON.parse(e.data); lastSeen=d.ops||[]; take(lastSeen); }catch(_){} });
  es.onopen=()=>{ backoff=5000; presence(); };
  es.onerror=()=>{
    /* the toad has quit or restarted: stop the browser's own retrying and look again later */
    try{ es.close(); }catch(_){} es=null;
    clearTimeout(retryT); retryT=setTimeout(look,backoff); backoff=Math.min(backoff*2,300000);
  };
}
function presence(){
  if(!es||!port) return;
  try{ fetch(`http://127.0.0.1:${port}/presence?id=${ID}`,{method:'POST',body:JSON.stringify({visible:!document.hidden,cur}),keepalive:true}).catch(()=>{}); }catch(e){}
}
async function look(){
  const o=await readInbox();
  if(o&&o.running&&o.port&&!es) connect(o.port);
}

/* Only one open tab takes the toad's ops in (two would each start the same
   session). The first tab holds a lock for as long as it's open; a second
   tab waits quietly and takes over if the first one closes. */
async function boot(){
  await window.appReady;
  const o=await readInbox();
  if(!o) return;                      // no toad here: stay out of the way
  if(o.running&&o.port) connect(o.port);
  document.addEventListener('visibilitychange',()=>{ presence(); if(!document.hidden) look(); });
  window.addEventListener('focus',()=>look());
  setInterval(()=>{ if(!es) look(); },document.hidden?60000:15000);
  setInterval(presence,15000);
  /* a held op (a dialog was open) goes through once the dialog closes */
  setInterval(()=>{ if(lastSeen.length&&!modalOpen()&&lastSeen.some(x=>x.t>upto())) take(lastSeen); },3000);
}
if(navigator.locks&&navigator.locks.request) navigator.locks.request('catchingdays-desktop-pet',()=>{ boot(); return new Promise(()=>{}); }).catch(()=>{});
else boot();
})();
