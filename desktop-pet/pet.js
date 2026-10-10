/* pet.js · the toad on your desktop
   Draws the toad with the app's own art (toad-art.js and friends, loaded from
   the Catching Days folder so it always matches the app), keeps the window
   click-through except over the toad itself, and turns pointer presses into
   either a tap (talk) or a drag (the main process moves the window).

   Motion: the art only animates under a .td-mv ancestor. A toad that moved
   every frame all day would cost real battery for nothing, so this one sits
   still like a real toad and wakes for a few seconds now and then (a breath,
   a blink, a glance), and whenever you hover, drag, or talk to it. While it's
   awake its animations are stepped at 30 frames a second: in a see-through
   window on a 120-144 Hz screen, letting them run free costs most of a core. */
'use strict';
(async function(){
const $=id=>document.getElementById(id);
const init=await window.pet.init();
let G=init.geo, NAME=init.toad, PEEK=init.peek||{edge:null,p:0}, VIEW=init.view;
const KEEPERS=['hasu','ame','sumi','tabi','hotaru'];

/* ── the app's art, straight from its folder ── */
function load(src){
  return new Promise(res=>{ const s=document.createElement('script'); s.src=init.artBase+src; s.onload=()=>res(true); s.onerror=()=>res(false); document.head.appendChild(s); });
}
for(const f of ['toad-art.js','toads-design/toad-art-cast.js','toad-companions.js','toad-expressions.js']) await load(f);
try{ window.ToadArt.injectCSS(); }catch(e){}
try{ window.ToadArt.injectCastCSS&&window.ToadArt.injectCastCSS(); }catch(e){}
try{ window.ToadCompanions&&window.ToadCompanions.injectCSS(); }catch(e){}
try{ window.ToadExpressions&&window.ToadExpressions.injectCSS&&window.ToadExpressions.injectCSS(); }catch(e){}

function drawToad(){
  const art=$('art'), S=G.S;
  let h='';
  try{
    if(KEEPERS.includes(NAME)&&window.ToadArt.TOADS[NAME]) h=window.ToadArt.svg(NAME,{size:S,perch:NAME==='hasu'?'pad':'own',water:false});
    else if(window.ToadCompanions&&window.ToadCompanions.has(NAME)) h=window.ToadCompanions.svg(NAME,{size:S});
  }catch(e){}
  if(!h) h=window.ToadArt?window.ToadArt.svg('hasu',{size:S,perch:'pad',water:false}):'';
  art.innerHTML=h;
  measureEyes();
  trayFace();
}
/* the tray icon is this toad's face, drawn small */
const FACE={hasu:'-38 -88 76 76',ame:'-52 -96 104 104',tabi:'-48 -102 96 96',hotaru:'-36 -72 92 92',sumi:'-44 -86 88 88',
  neri:'-44 -92 88 88',oto:'-46 -90 92 92',kuri:'-44 -90 88 88',mame:'-38 -76 76 76'};
function trayFace(){
  const svg=$('art').querySelector('svg'); if(!svg) return;
  const c=svg.cloneNode(true);
  c.setAttribute('xmlns','http://www.w3.org/2000/svg'); c.setAttribute('width','64'); c.setAttribute('height','64');
  if(FACE[NAME]) c.setAttribute('viewBox',FACE[NAME]);
  const img=new Image();
  img.onload=()=>{ try{
    const cv=document.createElement('canvas'); cv.width=cv.height=64; const x=cv.getContext('2d');
    x.beginPath(); x.arc(32,32,31,0,Math.PI*2); x.fillStyle='#1a5c60'; x.fill(); x.save(); x.clip();
    x.drawImage(img,0,0,64,64); x.restore();
    window.pet.send('tray-icon',cv.toDataURL('image/png'));
  }catch(e){} };
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(c));
}
function sizeStage(){
  document.documentElement.style.setProperty('--S',G.S+'px');
}

/* ── where the toad sits in its window, from how far it has slipped behind an edge ── */
const lerp=(a,b,k)=>a+(b-a)*k;
const ease=p=>p<=0?0:p>=1?1:p*p*(3-2*p);
/* how a toad hides: on a side it leans in from behind the edge, head first;
   at the bottom it sinks till only its eyes are above the line, like a toad
   in a pond. Every toad's eyes sit at a different height (Ame's are under a
   hat, Mame is small), so they're measured from the drawing itself. */
const GROUND=.8676;                              // the ground line, as a share of the art's height
let EYE={top:.36,bot:.48};                       // eyes, as shares of the art's height (measured in drawToad)
const PK=window.__peek={rot:58,inside:.2,below:.05};
function measureEyes(){
  const svg=$('art').querySelector('svg'), t=$('toad'), sw=$('sway');
  const looks=svg?[...svg.querySelectorAll('.td-look')]:[];
  if(!looks.length) return;
  const pt=t.style.transform, ps=sw.style.transform;
  t.style.transform='none'; sw.style.transform='none';
  const r0=svg.getBoundingClientRect(); let top=Infinity, bot=-Infinity;
  looks.forEach(el=>{ const r=el.getBoundingClientRect(); if(r.height>0){ top=Math.min(top,r.top); bot=Math.max(bot,r.bottom); } });
  t.style.transform=pt; sw.style.transform=ps;
  if(isFinite(top)&&r0.height) EYE={top:(top-r0.top)/r0.height,bot:(bot-r0.top)/r0.height};
}
function pivotFor(edge,p){
  const {S,W,H,PILL}=G, k=ease(p);
  const gx=W/2, gy=H-PILL-(1-GROUND)*S;          // the ground line under the toad's perch
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
window.__applyPeek=(e,p)=>{ PEEK={edge:e,p}; applyPeek(false); };
window.__eye=()=>EYE;
window.__wakeFor=ms=>wake(ms);
function applyPeek(animate){
  const t=$('toad'), {S}=G, pv=pivotFor(PEEK.edge,PEEK.p);
  t.classList.toggle('glide',!!animate);
  t.style.transform=`translate(${(pv.x-.5*S).toFixed(1)}px,${(pv.y-.8676*S).toFixed(1)}px) rotate(${pv.r.toFixed(2)}deg)`;
  placePill();
}
function placePill(){
  const p=$('pill'), {S,W,H}=G, hiding=PEEK.edge&&PEEK.p>.5;
  p.style.left=p.style.right=p.style.top=p.style.bottom=''; p.style.transform='';
  if(hiding&&PEEK.edge==='r'){ p.style.right='5px'; p.style.top=Math.round(H*.46+.36*S)+'px'; }
  else if(hiding&&PEEK.edge==='l'){ p.style.left='5px'; p.style.top=Math.round(H*.46+.36*S)+'px'; }
  else if(hiding&&PEEK.edge==='b'){ p.style.left='50%'; p.style.bottom=Math.round((EYE.bot-EYE.top+PK.below+.16)*S)+'px'; p.style.marginLeft='-36px'; }
  else { p.style.left='50%'; p.style.bottom='3px'; p.style.marginLeft='-36px'; }
}

/* ── awake / asleep ── */
let awakeUntil=0, hovering=false, held=false, panelOpen=false, wakeT=null;
function setAwake(){
  const on=hovering||held||Date.now()<awakeUntil;
  $('art').classList.toggle('td-mv',on);
  if(on) stepOn(); else stepOff();
}
/* every running animation is paused and moved on by hand, 30 times a second */
let stepT=null, stepLast=0, STEP_MS=33;
function stepOn(){ if(stepT) return; stepLast=performance.now(); stepT=setInterval(step,STEP_MS); }
/* once paused from script, a CSS animation no longer stops by itself when its class goes,
   so the art's are cancelled here (td-mv is already off, so they don't come back) */
function stepOff(){ if(!stepT) return; clearInterval(stepT); stepT=null;
  document.getAnimations().forEach(a=>{ try{ if(typeof CSSAnimation!=='undefined'&&a instanceof CSSAnimation) a.cancel(); else if(a.playState==='paused') a.play(); }catch(e){} }); }
window.__stepMs=ms=>{ STEP_MS=ms; if(stepT){ clearInterval(stepT); stepT=setInterval(step,STEP_MS); } };
function step(){
  const now=performance.now(), dt=now-stepLast; stepLast=now;
  document.getAnimations().forEach(a=>{
    try{ if(a.playState!=='paused') a.pause(); a.currentTime=(a.currentTime||0)+dt; }catch(e){}
  });
}
function wake(ms){ awakeUntil=Math.max(awakeUntil,Date.now()+ms); setAwake(); clearTimeout(wakeT); wakeT=setTimeout(setAwake,ms+30); }
(function fidget(){
  /* every 40 to 90 seconds: eight seconds of being a toad (long enough for a blink) */
  setTimeout(()=>{ wake(8000); fidget(); },40000+Math.random()*50000);
})();

/* ── reactions: a hop, a face, a sound ── */
const FACES={
  done:{hasu:'fond',ame:'content',sumi:'pleased',tabi:'proud',hotaru:'delighted'},
  allDone:{hasu:'chuckle',ame:'glad',sumi:'proud',tabi:'excited',hotaru:'glowing'},
  bell:{hasu:'considering',ame:'nodding',sumi:'thoughtful',tabi:'encouraging',hotaru:'earnest'},
  breakOver:{hasu:'amused',ame:'certain',sumi:'thoughtful',tabi:'encouraging',hotaru:'earnest'},
  focusStart:{hasu:'tender',ame:'nodding',sumi:'pleased',tabi:'encouraging',hotaru:'peaceful'},
  sessionEnd:{hasu:'fond',ame:'glad',sumi:'proud',tabi:'proud',hotaru:'glowing'},
  peek:{hasu:'curious',ame:'watchful',sumi:'thoughtful',tabi:'encouraging',hotaru:'drowsy'},
  undone:{hasu:'considering',ame:'certain',sumi:'thoughtful',tabi:'reassuring',hotaru:'peaceful'}
};
let faceT=null;
function face(kind,ms){
  const svg=$('art').querySelector('svg'), f=FACES[kind]&&FACES[kind][NAME];
  if(!svg||!f||!window.ToadExpressions) return;
  try{ window.ToadExpressions.apply(svg,NAME,f); }catch(e){}
  clearTimeout(faceT);
  faceT=setTimeout(()=>{ try{ window.ToadExpressions.apply(svg,NAME,'neutral'); }catch(e){} },ms||3200);
}
let hopT=null;
function hop(){
  const a=$('art'); wake(1600);
  a.classList.remove('td-hop'); void a.offsetWidth; a.classList.add('td-hop');
  clearTimeout(hopT); hopT=setTimeout(()=>a.classList.remove('td-hop'),1100);
}
function cls(c,ms){ const t=$('toad'); t.classList.remove(c); void t.offsetWidth; t.classList.add(c); setTimeout(()=>t.classList.remove(c),ms); }
let actx=null;
function chime(up){
  try{
    actx=actx||new AudioContext();
    const a=actx;
    [0,.17].forEach((d,i)=>{ const o=a.createOscillator(), g=a.createGain();
      o.type='sine'; o.frequency.value=up?(i?784:523):(i?523:784);
      g.gain.setValueAtTime(.0001,a.currentTime+d);
      g.gain.exponentialRampToValueAtTime(.2,a.currentTime+d+.02);
      g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d+.36);
      o.connect(g); g.connect(a.destination); o.start(a.currentTime+d); o.stop(a.currentTime+d+.38); });
  }catch(e){}
}
function react(r){
  const k=r&&r.kind;
  if(k==='done'){ hop(); face('done'); }
  else if(k==='allDone'){ hop(); cls('cheer',800); face('allDone',4200); }
  else if(k==='undone'){ wake(2500); face('undone',2200); }
  else if(k==='focusStart'){ hop(); face('focusStart'); }
  else if(k==='sessionEnd'){ hop(); cls('cheer',800); face('sessionEnd',4000); }
  else if(k==='bell'||k==='breakOver'){
    wake(4000); cls('bell',1600); face(k,5000);
    const p=$('pill'); p.classList.remove('ring'); void p.offsetWidth; p.classList.add('ring');
    if(r.sound){ chime(k==='breakOver'); setTimeout(()=>chime(k==='breakOver'),900); }
  }
  else if(k==='peek'){ wake(3000); face('peek',2600); }
  else if(k==='talk'){ const a=$('art'); wake(r.ms||1500); a.classList.add('td-talking'); setTimeout(()=>a.classList.remove('td-talking'),r.ms||1500); }
  else if(k==='pulled'){ hop(); }
}

/* ── the session pill ── */
function paintPill(){
  const p=$('pill'), s=VIEW&&VIEW.session;
  if(!s){ p.classList.add('hide'); return; }
  const now=Date.now(), e=s.paused?(s.pausedAt-s.phaseStart-(s.pausedMs||0)):(now-s.phaseStart-(s.pausedMs||0));
  const rem=s.target-e, brk=s.phase==='break', over=rem<0&&!brk;
  const t=Math.floor(Math.abs(rem)/1000), h=Math.floor(t/3600);
  const txt=(rem<0?'+':'')+(h?h+':'+String(Math.floor(t/60)%60).padStart(2,'0'):String(Math.floor(t/60)).padStart(2,'0'))+':'+String(t%60).padStart(2,'0');
  const tt=$('pill-t'); if(tt.textContent!==txt) tt.textContent=txt;
  p.classList.remove('hide');
  p.classList.toggle('brk',brk); p.classList.toggle('over',over||(brk&&rem<0)); p.classList.toggle('paused',!!s.paused);
  const ring=$('pill-ring');
  ring.style.setProperty('--p',Math.max(0,Math.min(1,e/Math.max(1,s.target))).toFixed(3));
  ring.style.setProperty('--c',brk?'#9fd8b8':'#f7c7a6');
  p.title=s.phase==='rating'?'Rate the last block':brk?'Break':s.paused?'Paused':over?'Past the bell':'Focus';
}
setInterval(()=>{ if(VIEW&&VIEW.session) paintPill(); },500);

/* ── the window lets clicks through everywhere but the toad ── */
let ignoring=true;
function setIgnore(on){ if(on===ignoring) return; ignoring=on; window.pet.send('ignore',on); }
function overToad(x,y){
  const el=document.elementFromPoint(x,y);
  if(!el) return false;
  if(el.closest('#pill')) return true;
  const svg=el.closest('#art svg');
  return !!svg&&el!==svg;
}
document.addEventListener('mousemove',e=>{
  if(held) return;
  const over=overToad(e.clientX,e.clientY);
  setIgnore(!over);
  if(over!==hovering){ hovering=over; setAwake(); if(!over) wake(2500); }
});
document.addEventListener('mouseleave',()=>{ if(held) return; hovering=false; setIgnore(true); setAwake(); });

/* ── press: a tap talks, a drag moves ── */
let down=null;
$('stage').addEventListener('pointerdown',e=>{
  if(e.button!==0) return;
  if(!overToad(e.clientX,e.clientY)) return;
  down={x:e.screenX,y:e.screenY,pill:!!e.target.closest('#pill'),dragging:false,id:e.pointerId};
  try{ $('stage').setPointerCapture(e.pointerId); }catch(_){}
});
$('stage').addEventListener('pointermove',e=>{
  if(!down||down.dragging) return;
  if(Math.hypot(e.screenX-down.x,e.screenY-down.y)>4){
    down.dragging=true; held=true; setIgnore(false); $('toad').classList.add('held'); setAwake();
    window.pet.send('drag-start');
  }
});
function up(e){
  if(!down) return;
  const d=down; down=null;
  try{ $('stage').releasePointerCapture(d.id); }catch(_){}
  if(d.dragging){ window.pet.send('drag-end'); return; }
  if(d.pill) window.pet.send('panel-open','focus');
  else { window.pet.send('toad-click'); hop(); if(PEEK.edge&&PEEK.p>.5) face('peek',2400); }
}
$('stage').addEventListener('pointerup',up);
$('stage').addEventListener('lostpointercapture',e=>{ if(down&&down.dragging) up(e); });
$('stage').addEventListener('contextmenu',e=>{ e.preventDefault(); if(overToad(e.clientX,e.clientY)) window.pet.send('toad-menu'); });

/* ── messages ── */
window.pet.on('peek',p=>{
  const was=PEEK; PEEK=p; applyPeek(p.animate);
  if(was.edge&&was.p>.5&&!(p.edge&&p.p>.5)&&!held) react({kind:'pulled'});
});
window.pet.on('drag',d=>{
  if(d.on){
    held=true; $('toad').classList.add('held');
    /* dangling: lean against the way you're pulling it */
    const lean=Math.max(-16,Math.min(16,-(d.dx||0)*1.6));
    $('sway').style.transform=`rotate(${lean.toFixed(1)}deg) scale(.97,1.05)`;
  } else {
    held=false; $('toad').classList.remove('held'); $('sway').style.transform=''; setAwake(); wake(2000);
  }
});
window.pet.on('view',v=>{ VIEW=v; paintPill(); });
window.pet.on('toad',t=>{ NAME=t.name; drawToad(); hop(); });
window.pet.on('geo',g=>{ G=g; sizeStage(); drawToad(); applyPeek(false); });
window.pet.on('react',react);
window.pet.on('panel',p=>{ panelOpen=!!p.open; setAwake(); });

sizeStage(); drawToad(); applyPeek(false); paintPill(); wake(6000);
})();
