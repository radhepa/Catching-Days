/* Catching Days · a little landing for a finished task.
   UI state only; completion still belongs to the app's existing task helpers. */
(function(){
'use strict';
const DISPLAY_MS=6000, FADE_MS=450, UNDO_GRACE_MS=3000;
let current=null, pending=[], timer=null, remaining=DISPLAY_MS, began=0, paused=true, fading=null, autoLeaving=false;
const heldPointers=new Set();
const fieldKeys=['done','doneAt','doneSession','doneCycle','habitOutcome'];
const lotus='<svg viewBox="0 0 40 30" aria-hidden="true"><path d="M20 27C6 25 4 12 4 12s11 1 16 15Zm0 0c14-2 16-15 16-15s-11 1-16 15Z" fill="currentColor" opacity=".55"/><path d="M20 27C8 17 20 2 20 2s12 15 0 25Z" fill="currentColor"/></svg>';

function capture(a,origin){
  const fields={}; fieldKeys.forEach(key=>fields[key]=a[key]);
  return {fields,subtask:origin?.subtaskId?{id:origin.subtaskId,...origin.subtaskPrevious}:null};
}
function live(event){
  const a=asg(event.id); return !!a&&a.done&&a.doneAt===event.at&&a.habitOutcome!=='skipped';
}
function ensure(){
  let box=document.getElementById('task-finish'); if(box) return box;
  box=document.createElement('section');box.id='task-finish';box.setAttribute('aria-label','Task finished');box.hidden=true;
  box.addEventListener('mouseenter',pause); box.addEventListener('mouseleave',resume);
  box.addEventListener('pointerdown',event=>{heldPointers.add(event.pointerId);pause();});
  box.addEventListener('focusin',pause); box.addEventListener('focusout',()=>setTimeout(()=>{
    if(!box.contains(document.activeElement)) resume();
  },0));
  box.addEventListener('click',event=>{
    if(event.target.closest('[data-finish-undo]')) undo();
    else if(event.target.closest('[data-finish-close]')) dismiss(true);
  });
  box.addEventListener('keydown',event=>{ if(event.key==='Escape'){ event.preventDefault();event.stopPropagation();dismiss(); } });
  document.body.appendChild(box); return box;
}
function positionCard(){
  const box=document.getElementById('task-finish');if(!box) return;
  const nav=document.querySelector('.sidebar');
  if(window.innerWidth<=760&&nav) box.style.setProperty('--tf-bottom',`${Math.ceil(nav.getBoundingClientRect().height)+14}px`);
  else box.style.removeProperty('--tf-bottom');
}
function blocked(){
  return (typeof unlockOpen==='function'&&unlockOpen())||
    !!document.querySelector('#modals .modal')||
    !!document.querySelector('#v-hello:not(.hide)');
}
function show(a,key,snapshot,waitForDiscovery){
  if(!a?.done||a.ann||a.habitOutcome==='skipped') return;
  const event={id:a.id,at:a.doneAt,title:a.title,key,snapshot};
  pending=pending.filter(e=>e.id!==event.id);pending.push(event);
  if(waitForDiscovery||blocked()) return;
  flush();
}
function flush(){
  if(blocked()) return;
  pending=pending.filter(live); if(!pending.length) return;
  const event=pending[pending.length-1], n=pending.length;pending=[];
  if(current&&!live(current)) current=null;
  current=event;
  const box=ensure(),sp=PondArt.SP[event.key],moving=pondMotionOn();
  clearTimeout(timer);clearTimeout(fading);timer=null;fading=null;remaining=DISPLAY_MS;paused=true;autoLeaving=false;
  const a=asg(event.id);
  const note=n>1?`${n} little wins, including this one.`:a?.habitId?'One more stone on your journey.':'One less thing to carry. A little more room to breathe.';
  box.className=`tf-card${moving?' tf-motion tf-enter':''}`;box.hidden=false;
  box.innerHTML=`<span class="tf-pond" aria-hidden="true"><i class="tf-ring"></i><i class="tf-ring two"></i><span class="tf-fish">${sp?PondArt.fish(event.key,.92,0,'flat'):lotus}</span><span class="tf-spark">✦</span></span>
    <div class="tf-copy"><span class="tf-eyebrow">A little win, kept</span><strong>${esc(event.title)}</strong><p>${sp?`${esc(sp.name)} joined your pond.`:'A little ripple in your day.'} <span>${note}</span></p>
    <div class="tf-actions"><button type="button" data-finish-undo>Undo</button><span>Take a breath. You did this.</span></div></div>
    <button type="button" class="tf-close" data-finish-close aria-label="Dismiss task finish">×</button>`;
  positionCard();
  if(moving){void box.offsetWidth;setTimeout(()=>{if(current===event)box.classList.remove('tf-enter');},0);}
  let announce=document.getElementById('task-finish-announcement');
  if(!announce){ announce=document.createElement('div');announce.id='task-finish-announcement';announce.className='tf-sr';announce.setAttribute('role','status');announce.setAttribute('aria-live','polite');announce.setAttribute('aria-atomic','true');document.body.appendChild(announce); }
  announce.textContent=`Finished: ${event.title}. ${sp?sp.name+' joined your pond. ':''}Undo is available.`;
  resume();
}
function interacting(){
  const box=document.getElementById('task-finish');
  const canHover=typeof matchMedia!=='function'||matchMedia('(hover: hover)').matches;
  return document.hidden||blocked()||heldPointers.size>0||!!(box&&((canHover&&box.matches(':hover'))||box.contains(document.activeElement)));
}
function pause(){
  if(!current) return;
  if(!paused&&timer!==null) remaining=Math.max(0,remaining-(Date.now()-began));
  clearTimeout(timer);timer=null;paused=true;
  // Entering during the fade reverses it and keeps Undo available.
  if(autoLeaving){
    clearTimeout(fading);fading=null;autoLeaving=false;
    document.getElementById('task-finish')?.classList.remove('tf-out');
  }
  remaining=Math.max(remaining,UNDO_GRACE_MS);
}
function resume(){
  if(!current) return;
  if(interacting()){pause();return;}
  if(autoLeaving||timer!==null) return;
  paused=false;began=Date.now();timer=setTimeout(()=>{timer=null;remaining=0;dismiss(false);},remaining);
}
function dismiss(force=true){
  if(!force&&interacting()){pause();return;}
  const event=current;
  clearTimeout(timer);timer=null;paused=true;autoLeaving=!force;
  if(force) current=null;
  const box=document.getElementById('task-finish');if(!box) return;
  if(force&&box.contains(document.activeElement)){ document.activeElement.blur(); }
  const finish=()=>{
    if(!force&&current!==event) return;
    box.hidden=true;box.innerHTML='';current=null;autoLeaving=false;fading=null;
  };
  if(box.classList.contains('tf-motion')){
    box.classList.remove('tf-enter');box.classList.add('tf-out');clearTimeout(fading);fading=setTimeout(finish,FADE_MS);
  } else{clearTimeout(fading);finish();}
}
function cancel(id){
  pending=pending.filter(event=>event.id!==id);
  if(current?.id===id) dismiss();
}
function clearSessionCompletion(event){
  const remove=cycle=>{ if(cycle&&Array.isArray(cycle.done)) cycle.done=cycle.done.filter(d=>!(d.id===event.id&&d.at===event.at)); };
  const sessions=[...(db.sessions||[])]; if(typeof A!=='undefined'&&A&&!sessions.includes(A)) sessions.push(A);
  sessions.forEach(s=>{(s.cycles||[]).forEach(remove);remove(s.pending);});
}
function undo(){
  const event=current;if(!event) return;
  if(!live(event)){ dismiss();toast('That task has changed since this little win.');return; }
  const a=asg(event.id),snapshot=event.snapshot;
  toggleAsg(a.id,false);
  if(snapshot){
    fieldKeys.forEach(key=>{
      if(snapshot.fields[key]===undefined) delete a[key];else a[key]=snapshot.fields[key];
    });
    if(snapshot.subtask){ const sub=(a.subs||[]).find(s=>s.id===snapshot.subtask.id);
      if(sub){sub.done=snapshot.subtask.done;sub.doneAt=snapshot.subtask.doneAt;}
    }
  }
  clearSessionCompletion(event);
  if(typeof asgJustDone!=='undefined') asgJustDone.delete(a.id);
  // Discovered species remain in the collection, following the pond's usual rule.
  _pondCache=null;save();repaint();dismiss();toast('Back on your list. No rush.');
}
document.addEventListener('visibilitychange',()=>{if(document.hidden) pause();else{flush();resume();}});
const releasePointer=event=>{if(heldPointers.delete(event.pointerId))resume();};
document.addEventListener('pointerup',releasePointer);
document.addEventListener('pointercancel',releasePointer);
window.addEventListener?.('blur',()=>{heldPointers.clear();pause();});
window.addEventListener?.('focus',resume);
window.addEventListener?.('resize',positionCard);
if(typeof ResizeObserver==='function'){
  const nav=document.querySelector('.sidebar');if(nav)new ResizeObserver(positionCard).observe(nav);
}
// A discovery or editor can temporarily cover the card. Resume only once the
// app is visible, so its Undo time is never spent underneath another screen.
const observer=new MutationObserver(()=>{
  if(blocked()){
    const box=document.getElementById('task-finish');
    if(current){pause();if(box) box.hidden=true;}
  } else{
    const box=document.getElementById('task-finish');
    if(current&&live(current)){if(box)box.hidden=false;resume();}
    else if(current) dismiss();
    flush();
  }
});
['modals','v-unlock','v-hello'].forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el,{attributes:true,attributeFilter:['class'],childList:true});});
window.TaskFinish={capture,show,flush,cancel,undo,dismiss};
})();
