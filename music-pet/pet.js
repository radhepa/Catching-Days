/* pet.js · the yokai on your desktop (Sara, or whichever one is out)
   Laid out like the desktop toad: the window is click-through everywhere but the
   pet, a press is a tap (the player) or a drag (main moves the window), and a pet
   pushed past a screen edge hides there. On the sides it leans in from behind
   the edge, head first; at the bottom it sinks till only its eyes show.

   Moods, set on #art for the art to answer (see pets/kit.js):
     playing   the music is on
     fidget    now and then while idle, ~2.4s of business
     sleepy    nothing playing for five minutes
   And the window's own reactions: a hop on a tap, a new song, coming out of
   an edge and changing pets; a wiggle when songs are dropped; a lean while dragged.

   The art's animations are paused and stepped by hand, as the toad's are: a
   see-through window repainting at a 144 Hz screen's full rate costs far more
   than a pet is worth. 15 frames a second idle, 30 while anything's happening. */
'use strict';
(async function(){
const $=id=>document.getElementById(id);
PetKit.injectCSS();
const init=await sara.ask('pet-init');
let G=init.geo, PEEK=init.peek||{edge:null,p:0}, PET=PetKit.get(init.pet).id, ST=init.state||{playing:false,title:''};
sara.send('pets',PetKit.list().map(d=>({id:d.id,name:d.name,kind:d.kind})));

function sizeStage(){ document.documentElement.style.setProperty('--S',G.S+'px'); }
function draw(){ $('art').innerHTML=PetKit.svg(PET); measureEyes(); mood(); }

/* ── where the pet sits in its window, from how far it has slipped behind an edge ── */
const lerp=(a,b,k)=>a+(b-a)*k;
const ease=p=>p<=0?0:p>=1?1:p*p*(3-2*p);
const GROUND=118/136;                            // the ground line, as a share of the art's height (viewBox -118..18)
let EYE={top:.36,bot:.48};                       // the eyes, as shares of the art's height, measured from the drawing
const PK={rot:58,inside:.2,below:.05};
function measureEyes(){
  const svg=$('art').querySelector('svg'), t=$('pet'), sw=$('sway');
  const looks=svg?[...svg.querySelectorAll('.pk-look')]:[];
  if(!looks.length) return;
  const pt=t.style.transform, ps=sw.style.transform;
  t.style.transform='none'; sw.style.transform='none';
  const r0=svg.getBoundingClientRect(); let top=Infinity, bot=-Infinity;
  looks.forEach(el=>{ const r=el.getBoundingClientRect(); if(r.height>0){ top=Math.min(top,r.top); bot=Math.max(bot,r.bottom); } });
  t.style.transform=pt; sw.style.transform=ps;
  if(isFinite(top)&&r0.height) EYE={top:(top-r0.top)/r0.height,bot:(bot-r0.top)/r0.height};
}
function pivotFor(edge,p){
  const {S,W,H,FOOT}=G, k=ease(p);
  const gx=W/2, gy=H-FOOT-(1-GROUND)*S;          // the ground line under the pad
  const he=GROUND-(EYE.top+EYE.bot)/2;            // eye height above the ground
  const th=PK.rot*Math.PI/180;
  let x=gx, y=gy, r=0;
  if(edge==='r'||edge==='l'){
    /* feet behind the edge, far enough that the eyes end up just inside it */
    const off=(he*Math.sin(th)-PK.inside)*S, ty=H*.46+he*Math.cos(th)*S;
    x=lerp(gx,edge==='r'?W+off:-off,k); y=lerp(gy,ty,k); r=(edge==='r'?-1:1)*PK.rot*k;
  }
  else if(edge==='b') y=lerp(gy,H+(GROUND-EYE.bot-PK.below)*S,k);
  return {x,y,r};
}
function applyPeek(animate){
  const t=$('pet'), {S}=G, pv=pivotFor(PEEK.edge,PEEK.p);
  t.classList.toggle('glide',!!animate);
  t.style.transform=`translate(${(pv.x-.5*S).toFixed(1)}px,${(pv.y-GROUND*S).toFixed(1)}px) rotate(${pv.r.toFixed(2)}deg)`;
  $('stage').classList.toggle('hiding',!!(PEEK.edge&&PEEK.p>.15));     // the pad's ripples float loose once she leans
}
const hiding=()=>!!(PEEK.edge&&PEEK.p>.5);

/* ── always moving; how smoothly depends on whether anything's happening ── */
let busyUntil=0, hovering=false, held=false, paceT=null;
const IDLE_MS=66, BUSY_MS=33;
function setAwake(){ pace(hovering||held||Date.now()<busyUntil?BUSY_MS:IDLE_MS); }
function wake(ms){ busyUntil=Math.max(busyUntil,Date.now()+ms); setAwake(); clearTimeout(paceT); paceT=setTimeout(setAwake,busyUntil-Date.now()+30); }
/* every animation is paused and moved on by hand. A paused CSS animation outlives
   the class that started it, so the ones nothing asks for any more (and finished
   transitions) are dropped once a second, or they'd pile up and freeze her. */
let stepT=null, stepMs=0, stepLast=0, sweptAt=0;
const paused=new Set();
function stale(a){
  const t=a.effect&&a.effect.target;
  if(!t||!t.isConnected) return true;
  if(!a.animationName) return a.currentTime>=a.effect.getComputedTiming().endTime;   // a transition
  return !getComputedStyle(t).animationName.split(',').some(n=>n.trim()===a.animationName);
}
function pace(ms){
  if(document.hidden){ stop(); return; }
  if(stepT&&ms===stepMs) return;
  if(stepT) clearInterval(stepT); else stepLast=performance.now();
  stepMs=ms; stepT=setInterval(step,ms);
}
function stop(){ if(stepT){ clearInterval(stepT); stepT=null; } }
function step(){
  const now=performance.now(), dt=now-stepLast; stepLast=now;
  document.getAnimations().forEach(a=>{
    try{ if(a.playState!=='paused'){ a.pause(); paused.add(a); } a.currentTime=(a.currentTime||0)+dt; }catch(e){}
  });
  if(now-sweptAt>1000){
    sweptAt=now;
    paused.forEach(a=>{ try{ if(a.playState==='idle'||stale(a)){ a.cancel(); paused.delete(a); } }catch(e){ paused.delete(a); } });
  }
}
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ finishPress(false); stop(); } else setAwake(); });

/* ── moods ── */
const SLEEP_MS=5*60*1000;
let livelyAt=Date.now(), fidgetT=null;
function mood(){
  const a=$('art'), sleepy=!ST.playing&&Date.now()-livelyAt>SLEEP_MS;
  a.classList.toggle('playing',!!ST.playing);
  a.classList.toggle('sleepy',sleepy);
  if(ST.playing||sleepy) a.classList.remove('fidget');
  const d=PetKit.get(PET), t=ST.title;
  a.title=t?`${d.name} · ${ST.playing?'playing':'paused on'} ${t}`:`${d.name} · drop music on me`;
}
function lively(){ const was=$('art').classList.contains('sleepy'); livelyAt=Date.now(); mood(); if(was) wake(2000); }
setInterval(mood,15000);
(function fidgetLater(){
  fidgetT=setTimeout(()=>{
    const a=$('art');
    if(!ST.playing&&!held&&!a.classList.contains('sleepy')){
      a.classList.add('fidget'); wake(2800); setTimeout(()=>a.classList.remove('fidget'),2600);
    }
    fidgetLater();
  },25000+Math.random()*25000);
})();

/* ── reactions ── */
let hopT=null;
function hop(){
  const a=$('art'); wake(1600);
  a.classList.remove('pk-hop'); void a.offsetWidth; a.classList.add('pk-hop');
  clearTimeout(hopT); hopT=setTimeout(()=>a.classList.remove('pk-hop'),800);
}
function cheer(){ const t=$('pet'); hop(); t.classList.remove('cheer'); void t.offsetWidth; t.classList.add('cheer'); setTimeout(()=>t.classList.remove('cheer'),800); }
let swapT=null;
function swapTo(id){
  id=PetKit.get(id).id; if(id===PET) return;
  const a=$('art'); wake(1800); clearTimeout(swapT);
  a.classList.add('out');
  swapT=setTimeout(()=>{ PET=id; draw(); applyPeek(false); a.classList.remove('out'); hop(); },220);
}

/* ── the window lets clicks through everywhere but the pet ── */
let ignoring=true;
function setIgnore(on,force=false){ if(!force&&on===ignoring) return; ignoring=on; sara.send('ignore',on); }
function overPet(x,y){ const el=document.elementFromPoint(x,y); return !!(el&&el.closest('#art')); }
function hover(over,force=false){
  setIgnore(!over,force);
  if(over!==hovering){ hovering=over; setAwake(); if(!over) wake(2500); }
}
document.addEventListener('mousemove',e=>{ if(!held&&!down) hover(overPet(e.clientX,e.clientY)); });
/* main reads the cursor too (Windows can stop forwarding moves to a click-through
   window, and sends none while files are dragged from Explorer) and asks: is that on her? */
sara.on('probe',p=>{ if(held||down) return; hover(!!p.inside&&overPet(p.x,p.y),true); });
sara.on('hit-reset',()=>{ finishPress(false); ignoring=null; hovering=false; held=false; $('pet').classList.remove('held'); $('sway').style.transform=''; setAwake(); });
/* no 'mouseleave': Windows sends bursts of them to a forwarding window with the
   cursor still on her. Leaving shows up in the next move or main's probe. */

/* ── press: a tap opens the player, a drag moves her ── */
let down=null;
const stage=$('stage');
stage.addEventListener('pointerdown',e=>{
  if(e.button!==0||!overPet(e.clientX,e.clientY)) return;
  finishPress(false);
  down={x:e.screenX,y:e.screenY,dragging:false,id:e.pointerId};
  setIgnore(false,true);
  try{ stage.setPointerCapture(e.pointerId); }catch(_){}
});
stage.addEventListener('pointermove',e=>{
  if(!down||e.pointerId!==down.id) return;
  if(!(e.buttons&1)){ finishPress(false); return; }
  if(down.dragging) return;
  if(Math.hypot(e.screenX-down.x,e.screenY-down.y)>4){
    down.dragging=true; held=true; $('pet').classList.add('held'); setAwake(); lively();
    sara.send('drag-start',{x:down.x,y:down.y});
  }
});
function finishPress(click){
  if(!down) return;
  const d=down; down=null;
  try{ stage.releasePointerCapture(d.id); }catch(_){}
  held=false; $('pet').classList.remove('held'); $('sway').style.transform=''; setAwake();
  if(d.dragging){ sara.send('drag-end'); return; }
  if(click){ sara.send('tap'); hop(); lively(); }
}
stage.addEventListener('pointerup',e=>{ if(down&&e.pointerId===down.id&&e.button===0) finishPress(true); });
for(const ev of ['pointercancel','lostpointercapture']) stage.addEventListener(ev,e=>{ if(down&&e.pointerId===down.id) finishPress(false); });
window.addEventListener('blur',()=>finishPress(false));
stage.addEventListener('contextmenu',e=>{ e.preventDefault(); finishPress(false); if(overPet(e.clientX,e.clientY)) sara.send('pet-menu'); });

/* ── music dropped on her joins the library ── */
let overN=0;
window.addEventListener('dragenter',e=>{ e.preventDefault(); overN++; stage.classList.add('over'); wake(1500); });
window.addEventListener('dragleave',()=>{ if(--overN<=0){ overN=0; stage.classList.remove('over'); } });
window.addEventListener('dragover',e=>{ e.preventDefault(); e.dataTransfer.dropEffect='copy'; });
window.addEventListener('drop',e=>{
  e.preventDefault(); overN=0; stage.classList.remove('over');
  const paths=sara.paths(e.dataTransfer.files);
  if(!paths.length) return;
  sara.send('drop-paths',paths); cheer(); lively();
});

/* ── messages from main ── */
sara.on('peek',p=>{
  const was=hiding(); PEEK=p; applyPeek(p.animate);
  if(was&&!hiding()&&!held) hop();                // pulled out of the edge
});
sara.on('drag',d=>{
  if(d.on){
    held=true; $('pet').classList.add('held');
    /* dangling: lean against the way you're pulling */
    const lean=Math.max(-16,Math.min(16,-(d.dx||0)*1.6));
    $('sway').style.transform=`rotate(${lean.toFixed(1)}deg) scale(.97,1.05)`;
  } else { held=false; $('pet').classList.remove('held'); $('sway').style.transform=''; setAwake(); wake(2000); }
});
sara.on('geo',g=>{ G=g; sizeStage(); draw(); applyPeek(false); });
sara.on('pet',p=>swapTo(p&&p.id));
sara.on('state',s=>{
  const was=ST; ST=Object.assign({},s);
  if(ST.playing&&(!was.playing||ST.title!==was.title)) hop();   // a song starts, or a new one comes on
  if(ST.playing!==was.playing) lively(); else mood();
});

sizeStage(); draw(); applyPeek(false); wake(4000);
})();
