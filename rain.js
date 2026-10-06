/* ═══════════════ Rain ═══════════════
   Rain for a focus session: it falls on the pond (streaks, rings where each
   drop lands, little splash crowns), on the page around it (it lands on the
   tops of the cards), and you hear it (made live with Web Audio: no sound
   files, so it works offline and never repeats the same way twice).

   Used by the app as window.Rain:
     Rain.set({on, level, vol, motion})  level: drizzle | rain | pour | storm
     Rain.attach(hero)                   the session's water (#run-hero)
     Rain.visible(bool)                  draw only while the Focus view shows
     Rain.render(level, sec)             the sound rendered offline (an
                                         AudioBuffer), for checking it by ear or by numbers
   Sound keeps going while the view is hidden or the window is in the
   background (the point is to work to it); drawing stops.

   Interactive: tap or click the water for a big splash, press and drag to
   trail a wake, and the rain leans with the way your pointer moves. */
(function(){
'use strict';

const LEVELS={
  /* rate: drops a second over a 1100×560 pond. len/speed: streak feel.
     ring: ripple size. page: share of drops on the page around the pond.
     veil: how overcast the sky gets. gust: how much the wind swings.
     snd, the sound: bed = the far-off wash (bedLp how bright it is),
     fine/dense/heavy = the three layers of drops (light ticks, the body of
     the rain, the thick warm drum of a downpour), low = the deep roar,
     wet = how much of it you hear back from the space around you,
     drip = close drips a second (dripVol how loud), wind, sway = how much
     the rain slowly comes and goes. */
  drizzle:{ name:'Drizzle', rate:110, len:.62, speed:.82, ring:.75, page:.35, wind:.06, veil:.38, gust:.25, thunder:0,
            snd:{ bed:.044, bedLp:1700, fine:.189, dense:.076, heavy:0,    low:0,    wet:.30, drip:.55, dripVol:.22,  wind:0,    sway:.14 } },
  rain:   { name:'Rain',    rate:300, len:1,   speed:1,   ring:1,   page:.55, wind:.10, veil:.55, gust:.4,  thunder:0,
            snd:{ bed:.108, bedLp:2000, fine:.208, dense:.347, heavy:.103, low:.034, wet:.26, drip:.75, dripVol:.378, wind:0,    sway:.16 } },
  pour:   { name:'Downpour',rate:640, len:1.25,speed:1.14,ring:1.12,page:.8, wind:.14, veil:.7,  gust:.6,  thunder:0,
            snd:{ bed:.176, bedLp:2300, fine:.139, dense:.479, heavy:.378, low:.139, wet:.24, drip:.45, dripVol:.315, wind:.028, sway:.16 } },
  storm:  { name:'Storm',   rate:700, len:1.32,speed:1.2, ring:1.15,page:.9, wind:.2,  veil:.82, gust:1,   thunder:1,
            snd:{ bed:.197, bedLp:2300, fine:.131, dense:.469, heavy:.426, low:.197, wet:.24, drip:.35, dripVol:.252, wind:.078, sway:.22 } },
};
const ORDER=['drizzle','rain','pour','storm'];

const S={ on:false, level:'rain', vol:60, motion:true, visible:false };
const rnd=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const L=()=>LEVELS[S.level]||LEVELS.rain;

/* shared weather: the gust that leans the rain is the same one you hear */
const W={ gust:0, gustT:0, push:0, flash:0, flashQ:[], nextBolt:0 };
function gustStep(dt,lv){
  if((W.gustT-=dt)<=0){ W.gustT=rnd(.8,3.2); W.gustTo=rnd(-1,1)*lv.gust; }
  W.gust+=((W.gustTo||0)-W.gust)*Math.min(1,dt*.7);
}
function weather(dt){
  const lv=L();
  gustStep(dt,lv);
  W.push*=Math.pow(.25,dt);                       // pointer-made wind dies away
  /* lightning: a few quick pulses, then thunder a little later */
  if(S.on&&lv.thunder){
    const now=performance.now()/1000;
    if(!W.nextBolt) W.nextBolt=now+rnd(8,22);
    if(now>=W.nextBolt){ W.nextBolt=now+rnd(22,60); bolt(); }
  }
  let f=0; const now=performance.now();
  W.flashQ=W.flashQ.filter(p=>now<p.t+p.d);
  W.flashQ.forEach(p=>{ if(now>=p.t){ const k=(now-p.t)/p.d; f=Math.max(f,p.a*(1-k)*(1-k)); } });
  W.flash=f;
}
function bolt(){
  const near=Math.random(), now=performance.now();
  if(S.motion&&S.visible){                        // gentle: soft pulses, never a strobe
    const a=.16+near*.14;
    W.flashQ.push({t:now,d:180,a},{t:now+rnd(220,320),d:120,a:a*.55});
    if(Math.random()<.5) W.flashQ.push({t:now+rnd(420,560),d:260,a:a*.8});
  }
  Snd.thunder(near,rnd(.6,1)+(1-near)*rnd(1,3.2));
}

/* ───────────── drawing on the pond ───────────── */
const P={ hero:null, cv:null, cx:null, veil:null, w:0, h:0, dpr:1, drops:[], rings:[], bits:[], acc:0, ro:null,
          down:false, lx:0, ly:0, lt:0, trail:0 };
function attach(hero){
  if(!hero) return;
  if(P.hero!==hero){
    if(P.hero) unbind(P.hero);
    P.hero=hero; P.drops=[]; P.rings=[]; P.bits=[]; P.w=P.h=0;   // a new canvas: size it afresh
    P.veil=document.createElement('div'); P.veil.className='rain-veil';
    P.cv=document.createElement('canvas'); P.cv.className='rain-cv';
    const fry=hero.querySelector('#run-fry');
    if(fry&&fry.nextSibling) hero.insertBefore(P.veil,fry.nextSibling); else hero.appendChild(P.veil);
    hero.insertBefore(P.cv,P.veil.nextSibling);
    P.cx=P.cv.getContext('2d');
    bind(hero);
    if(P.ro) P.ro.disconnect();
    if(window.ResizeObserver){ P.ro=new ResizeObserver(()=>{ size(); if(!S.motion) still(); }); P.ro.observe(hero); }
  }
  size(); paintVeil(); loop();
}
function size(){
  if(!P.hero||!P.cv) return;
  const w=P.hero.clientWidth, h=P.hero.clientHeight, dpr=Math.min(2,window.devicePixelRatio||1);
  if(w===P.w&&h===P.h&&dpr===P.dpr) return;
  P.w=w; P.h=h; P.dpr=dpr;
  P.cv.width=Math.max(1,Math.round(w*dpr)); P.cv.height=Math.max(1,Math.round(h*dpr));
}
function paintVeil(){
  if(P.veil) P.veil.style.opacity=S.on&&S.visible?L().veil:0;
  if(P.cv) P.cv.style.opacity=S.on&&S.visible?1:0;
  if(G.cv){ G.cv.style.opacity=S.on&&S.visible?1:0; G.cv.style.setProperty('--rain-veil',(L().veil*.16).toFixed(3)); }
}
/* A drop knows where it will land before it falls: farther drops land
   higher on the water, are thinner, fainter and slower. */
function spawnDrop(w,h,lv,windX){
  const land=rnd(.02,1)*h, z=clamp(land/h*.75+Math.random()*.25,0,1);
  const vy=(780+1050*z)*lv.speed, vx=vy*windX;
  const t=rnd(.18,.55), y=land-vy*t, x=rnd(-40,w+40)-vx*t;
  return { x, y, vx, vy, land, z, len:(12+36*z)*lv.len, big:Math.random()<.035+z*.02 };
}
function windX(){ return L().wind+W.gust*.16+W.push; }
function land(d,lv){
  const big=d.big, r=(big?rnd(26,44):rnd(7,22)+18*d.z)*lv.ring;
  P.rings.push({ x:d.x, y:d.land, r, t:0, life:big?rnd(1.2,1.7):rnd(.6,1.05), a:.12+.36*d.z+(big?.12:0), n:big?3:(d.z>.6?2:1) });
  if(d.z>.5||big){
    const n=big?rnd(5,8)|0:rnd(1,4)|0;
    for(let i=0;i<n;i++){ const a=rnd(0,Math.PI*2), s=rnd(30,90)*(big?1.4:.8)*(.5+d.z);
      P.bits.push({ x:d.x, y:d.land, vx:Math.cos(a)*s, vy:-rnd(70,170)*(big?1.3:.8)*(.5+d.z), g:d.land+Math.sin(a)*s*.08, t:0, life:rnd(.22,.4), r:big?1.4:.9+d.z*.5 }); }
  }
}
function splash(x,y,k){
  k=k||1;
  P.rings.push({x,y,r:48*k,t:0,life:2.1,a:.85,n:4},{x,y,r:20*k,t:-.12,life:1.4,a:.6,n:2});
  for(let i=0;i<14;i++){ const a=rnd(0,Math.PI*2), s=rnd(60,170)*k;
    P.bits.push({ x, y, vx:Math.cos(a)*s, vy:-rnd(140,300)*k, g:y+Math.sin(a)*s*.1, t:0, life:rnd(.35,.6), r:rnd(1.2,2.2) }); }
  Snd.plop((x/(P.w||1))*2-1,k);
}
function stepPond(dt){
  const lv=L(), w=P.w, h=P.h; if(!w||!h) return;
  const wx=windX();
  P.acc+=lv.rate*(w*h/(1100*560))*dt;
  while(P.acc>=1&&P.drops.length<1400){ P.acc--; P.drops.push(spawnDrop(w,h,lv,wx)); }
  if(P.acc>=1) P.acc=0;
  const keep=[];
  for(const d of P.drops){
    d.vx+=(d.vy*wx-d.vx)*Math.min(1,dt*3);          // drops lean into a gust as it comes
    d.x+=d.vx*dt; d.y+=d.vy*dt;
    if(d.y>=d.land) land(d,lv); else keep.push(d);
  }
  P.drops=keep;
  P.rings=P.rings.filter(r=>(r.t+=dt)<r.life);
  if(P.rings.length>340) P.rings.splice(0,P.rings.length-340);
  P.bits=P.bits.filter(b=>{ b.t+=dt; b.vy+=980*dt; b.x+=b.vx*dt; b.y+=b.vy*dt; return b.t<b.life&&!(b.vy>0&&b.y>b.g); });
}
const STREAK=[[.13,.6],[.2,.85],[.3,1.15],[.42,1.5]];
const RB_LV=8, RB={ crest:Array.from({length:RB_LV*3},()=>[]), trough:Array.from({length:RB_LV*3},()=>[]), dots:[] };
function drawPond(){
  const c=P.cx; if(!c) return;
  c.setTransform(P.dpr,0,0,P.dpr,0,0);
  c.clearRect(0,0,P.w,P.h);
  /* rings: a bright crest and, just inside it, a dark trough, so each one
     reads as a dimple in the water and not a line drawn on it */
  c.lineCap='round';
  const crest=RB.crest, trough=RB.trough, dots=RB.dots;
  for(let i=0;i<crest.length;i++){ crest[i].length=0; trough[i].length=0; }
  dots.length=0;
  for(const r of P.rings){
    if(r.t<0) continue;
    const k=r.t/r.life, e=1-Math.pow(1-k,2.2), fade=Math.pow(1-k,1.6)*r.a, wb=k<.3?2:k<.6?1:0;
    for(let i=0;i<r.n;i++){
      const rr=r.r*e*(1-i*.3); if(rr<.6) continue;
      const lv=Math.min(RB_LV-1,Math.round(fade*(1-i*.3)*RB_LV/.8)); if(lv<=0) continue;
      crest[lv*3+wb].push(r.x,r.y,rr);
      if(rr>4&&i===0) trough[lv*3+wb].push(r.x,r.y+.9,rr*.9);
    }
    if(k<.1) dots.push(r.x,r.y);
  }
  const ring=(list,dy)=>{ for(let j=0;j<list.length;j+=3){ const x=list[j],y=list[j+1],rr=list[j+2];
    c.moveTo(x+rr,y); c.ellipse(x,y,rr,rr*.84,0,0,Math.PI*2); } };
  for(let b=0;b<crest.length;b++){
    const lv=b/3|0, w=[.6,.9,1.3][b%3];
    if(trough[b].length){ c.beginPath(); ring(trough[b]); c.strokeStyle=`rgba(3,26,30,${(lv/RB_LV*.8*.32).toFixed(3)})`; c.lineWidth=w+.3; c.stroke(); }
    if(crest[b].length){ c.beginPath(); ring(crest[b]); c.strokeStyle=`rgba(214,238,233,${(lv/RB_LV*.8).toFixed(3)})`; c.lineWidth=w; c.stroke(); }
  }
  if(dots.length){ c.beginPath(); for(let j=0;j<dots.length;j+=2){ c.moveTo(dots[j]+1.4,dots[j+1]); c.arc(dots[j],dots[j+1],1.4,0,Math.PI*2); }
    c.fillStyle='rgba(235,248,245,.55)'; c.fill(); }
  /* streaks, in four depth bands so each band is a single stroke */
  const bands=[[],[],[],[]];
  for(const d of P.drops) bands[Math.min(3,d.z*4|0)].push(d);
  bands.forEach((ds,i)=>{
    if(!ds.length) return;
    c.beginPath();
    for(const d of ds){ const sp=Math.hypot(d.vx,d.vy)||1, ux=d.vx/sp, uy=d.vy/sp;
      c.moveTo(d.x-ux*d.len,d.y-uy*d.len); c.lineTo(d.x,d.y); }
    c.strokeStyle=`rgba(208,232,236,${STREAK[i][0]})`; c.lineWidth=STREAK[i][1]; c.stroke();
  });
  if(P.bits.length){
    c.fillStyle='rgba(225,244,242,.75)';
    c.beginPath(); for(const b of P.bits){ c.moveTo(b.x+b.r,b.y); c.arc(b.x,b.y,b.r*(1-b.t/b.life*.5),0,Math.PI*2); } c.fill();
  }
  if(W.flash>.002){ c.fillStyle=`rgba(226,238,255,${W.flash.toFixed(3)})`; c.fillRect(0,0,P.w,P.h); }
}
/* motion off: one still picture of rain, redrawn only when the size changes */
function still(){
  if(!P.cx||!S.on) return;
  P.drops=[]; P.rings=[]; P.bits=[]; W.flash=0;
  const lv=L(), n=Math.round(lv.rate*.35*(P.w*P.h/(1100*560)));
  for(let i=0;i<n;i++){ const d=spawnDrop(P.w,P.h,lv,lv.wind); d.y=rnd(d.land-d.vy*.4,d.land); d.x+=d.vx*rnd(0,.3); P.drops.push(d); }
  for(let i=0;i<n*.5;i++){ const z=Math.random(); P.rings.push({x:rnd(0,P.w),y:rnd(0,P.h),r:(7+20*z)*lv.ring,t:0,life:1,a:.15+.4*z,n:z>.55?2:1}); P.rings[P.rings.length-1].t=rnd(.1,.6); }
  drawPond(); if(G.cx) gStill();
}

function bind(hero){
  hero.addEventListener('pointerdown',onDown); hero.addEventListener('pointermove',onMove);
  window.addEventListener('pointerup',onUp); hero.addEventListener('pointerleave',onLeave);
}
function unbind(hero){
  hero.removeEventListener('pointerdown',onDown); hero.removeEventListener('pointermove',onMove);
  window.removeEventListener('pointerup',onUp); hero.removeEventListener('pointerleave',onLeave);
}
const skip=e=>!S.on||!S.visible||!!(e.target.closest&&e.target.closest('button,input,a,.rain-ui'));
function local(e){ const r=P.hero.getBoundingClientRect(); return [e.clientX-r.left,e.clientY-r.top]; }
function onDown(e){
  if(skip(e)) return;
  const [x,y]=local(e); P.down=true; P.lx=x; P.ly=y; P.trail=0;
  if(S.motion) splash(x,y,1); else Snd.plop((x/P.w)*2-1,1);
}
function onMove(e){
  if(!S.on||!S.visible||!S.motion) return;
  const [x,y]=local(e), now=performance.now(), dt=Math.max(8,now-(P.lt||now-16));
  if(P.lt&&!skip(e)){
    W.push=clamp(W.push+(x-P.lx)/dt*.02,-.35,.35);           // the rain leans the way you sweep
    if(P.down){ P.trail+=Math.hypot(x-P.lx,y-P.ly);
      if(P.trail>16){ P.trail=0; P.rings.push({x,y,r:rnd(16,26),t:0,life:1.1,a:.55,n:2}); } }
  }
  P.lx=x; P.ly=y; P.lt=now;
}
function onUp(){ P.down=false; }
function onLeave(){ P.lt=0; }

/* ───────────── rain on the page around the pond ─────────────
   A fixed canvas under everything (z-index -1), so it shows on the paper
   but the cards stand in front of it. Drops that reach the top edge of a
   card stop there and splash. */
const G={ cv:null, cx:null, w:0, h:0, drops:[], bits:[], acc:0, rects:[], rt:0, draw:false };
function gEnsure(){
  if(G.cv) return;
  G.cv=document.createElement('canvas'); G.cv.className='rain-page'; G.cv.setAttribute('aria-hidden','true');
  document.body.appendChild(G.cv); G.cx=G.cv.getContext('2d'); gSize();
  window.addEventListener('resize',()=>{ gSize(); if(!S.motion) still(); });
  window.addEventListener('scroll',()=>{ G.rt=0; },{passive:true});
}
function gSize(){
  if(!G.cv) return;
  G.w=window.innerWidth; G.h=window.innerHeight;
  G.cv.width=G.w; G.cv.height=G.h;               // 1:1 is plenty for soft streaks
}
function gRects(){
  const now=performance.now(); if(now-G.rt<400) return; G.rt=now;
  G.rects=[...document.querySelectorAll('#v-run .pcard, #run-hero')].map(e=>e.getBoundingClientRect())
    .filter(r=>r.width>0&&r.bottom>0&&r.top<G.h).map(r=>({l:r.left+6,r:r.right-6,t:r.top,b:r.bottom}));
}
function gStep(dt){
  const lv=L(); gRects();
  const wx=windX()*.9;
  G.acc+=lv.rate*lv.page*(G.w*G.h/(1400*900))*dt;
  while(G.acc>=1&&G.drops.length<900){ G.acc--;
    const z=Math.random(), vy=(900+1100*z)*lv.speed;
    G.drops.push({ x:rnd(-60,G.w+60), y:rnd(-80,-10), vy, vx:vy*wx, z, len:(14+34*z)*lv.len }); }
  if(G.acc>=1) G.acc=0;
  const keep=[];
  for(const d of G.drops){
    const py=d.y; d.vx+=(d.vy*wx-d.vx)*Math.min(1,dt*3);
    d.x+=d.vx*dt; d.y+=d.vy*dt;
    let hit=null;
    for(const r of G.rects) if(d.x>r.l&&d.x<r.r&&py<=r.t&&d.y>=r.t){ hit=r; break; }
    if(hit){ if(d.z>.3){ const n=rnd(1,3.5)|0; for(let i=0;i<n;i++) G.bits.push({x:d.x,y:hit.t-.5,vx:rnd(-50,50),vy:-rnd(50,130)*(.4+d.z),g:hit.t,t:0,life:rnd(.2,.35)}); } continue; }
    /* a drop that falls into a card's face is behind it: let it go */
    let behind=false; for(const r of G.rects) if(d.x>r.l-6&&d.x<r.r+6&&d.y>r.t&&d.y<r.b){ behind=true; break; }
    if(behind||d.y>G.h+d.len) continue;
    keep.push(d);
  }
  G.drops=keep;
  G.bits=G.bits.filter(b=>{ b.t+=dt; b.vy+=900*dt; b.x+=b.vx*dt; b.y+=b.vy*dt; return b.t<b.life&&!(b.vy>0&&b.y>b.g); });
}
function gDraw(){
  const c=G.cx; if(!c) return;
  c.clearRect(0,0,G.w,G.h);
  const bands=[[],[],[]];
  for(const d of G.drops) bands[Math.min(2,d.z*3|0)].push(d);
  const st=[[.10,.7],[.16,1],[.24,1.3]];
  bands.forEach((ds,i)=>{ if(!ds.length) return; c.beginPath();
    for(const d of ds){ const sp=Math.hypot(d.vx,d.vy)||1; c.moveTo(d.x-d.vx/sp*d.len,d.y-d.vy/sp*d.len); c.lineTo(d.x,d.y); }
    c.strokeStyle=`rgba(64,92,104,${st[i][0]})`; c.lineWidth=st[i][1]; c.stroke(); });
  if(G.bits.length){ c.fillStyle='rgba(70,100,112,.35)'; c.beginPath();
    for(const b of G.bits){ c.moveTo(b.x+1,b.y); c.arc(b.x,b.y,1,0,Math.PI*2); } c.fill(); }
  if(W.flash>.002){ c.fillStyle=`rgba(255,255,255,${(W.flash*.7).toFixed(3)})`; c.fillRect(0,0,G.w,G.h); }
}
function gStill(){
  if(!G.cx) return; G.drops=[]; G.bits=[]; G.rt=0; gRects();
  const lv=L(), n=Math.round(lv.rate*lv.page*.3*(G.w*G.h/(1400*900)));
  for(let i=0;i<n;i++){ const z=Math.random(), vy=(900+1100*z)*lv.speed, d={x:rnd(0,G.w),y:rnd(0,G.h),vy,vx:vy*lv.wind,z,len:(14+34*z)*lv.len};
    if(!G.rects.some(r=>d.x>r.l-6&&d.x<r.r+6&&d.y>r.t&&d.y<r.b)) G.drops.push(d); }
  gDraw();
}

/* ───────────── the frame loop ───────────── */
let raf=0, last=0;
function loop(){
  if(raf) return;
  if(!S.on||!S.visible) return;
  if(!S.motion){ still(); return; }
  last=performance.now();
  const f=now=>{
    raf=0;
    if(!S.on||!S.visible||!S.motion) return;
    if(now-last<14){ raf=requestAnimationFrame(f); return; }
    const dt=Math.min(.05,(now-last)/1000); last=now;
    weather(dt);
    if(P.hero&&P.hero.isConnected){ stepPond(dt); drawPond(); }
    if(G.cx){ gStep(dt); gDraw(); }
    raf=requestAnimationFrame(f);
  };
  raf=requestAnimationFrame(f);
}
function halt(){ if(raf){ cancelAnimationFrame(raf); raf=0; } }
/* weather keeps turning (and thunder keeps rolling) when nothing is drawn */
setInterval(()=>{ if(S.on&&(!S.visible||!S.motion||document.hidden)) weather(.25); },250);

/* ───────────── sound ─────────────
   Real rain isn't a hiss. It's thousands of separate tiny impacts a second,
   each a click a few milliseconds long, duller and fainter the farther off
   it lands, now and then ringing whatever it hits (a leaf, the sill, the
   ground). So that's what's made here: drops written one at a time into
   long looping buffers (in a worker, so the page never stutters), over a
   soft far-off wash, heard in a little outdoor space (a reverb), and kept
   warm up top so it sits behind your thinking instead of on top of it.
   It slowly comes and goes the way real rain does, and a close drip lands
   now and then. No sound files: it works offline, and the loops are long,
   of different lengths and stereo, so they never line up the same way. */
const Snd=(()=>{
  let ac=null, g=null, playing=false, fadeTo=-1, schedT=null, unlockBound=false, nextDrip=0, drift=0, lastTick=0;
  let raw=null;                       // the written drops: { sr, parts:{dense,fine,drips,heavy}, subs:[] }

  /* the drop layers. sec: loop length. rate: drops a second. size/near:
     how strongly they lean small and far (higher = more of them). tau: how
     long a drop lasts, small to big (ms). fc: the band a drop sounds in,
     big to small (Hz): small drops are high and many, big ones low and few,
     which is why real rain is smooth up top and lumpy underneath. body:
     share that ring what they hit; bf: that ring, low to high (Hz); q: how
     long it rings. width: how far round you they land. hp: what's cut
     below (Hz). */
  const LAYERS={
    fine: { sec:15.7, rate:4600, size:2.1, near:1.3, tau:[.2,1.1],  fc:[2000,8000], body:.12, bf:[1600,5200], q:[3,6],   width:.75, hp:400 },
    dense:{ sec:21.3, rate:6000, size:2.2, near:1.6, tau:[.25,2.6], fc:[900,7500],  body:.25, bf:[700,3800],  q:[2,6],   width:.8,  hp:200 },
    heavy:{ sec:17.9, rate:1800, size:1.4, near:1.3, tau:[1,4.5],   fc:[350,1800],  body:.5,  bf:[200,1100],  q:[1.5,4], width:.8,  hp:80 },
  };
  const DRIPS=18, PARTS=['dense','fine','drips','heavy'];   // written in this order: the body of the rain first

  /* Writes the drops for one part (a layer, or the close drips).
     Self-contained on purpose: it's sent to a worker as text, so it can't
     use anything from outside itself. */
  function genRain(job){
    const sr=job.sr, TAU=Math.PI*2;
    let s=(job.seed>>>0)||0x9e3779b9;
    const rn=()=>{ s^=s<<13; s^=s>>>17; s^=s<<5; return (s>>>0)/4294967296; };
    const lerp=(a,b,k)=>a+(b-a)*k, logp=(a,b,k)=>a*Math.pow(b/a,k);
    /* a two-pole ring at f, peak gain about 1, and how long it lasts */
    const ring=(f,q,w)=>{ const om=TAU*f/sr, r=Math.exp(-Math.PI*f/q/sr);
      return { a1:2*r*Math.cos(om), a2:-r*r, g:(1-r)*2*Math.sin(om), len:Math.ceil(5*q*sr/(Math.PI*f)), w:w||1.6 }; };
    /* one impact: a burst of noise that dies in a few ms, in a band about
       an octave and a half wide below fc, maybe ringing what it hit. A drop
       to the right reaches the right ear a hair sooner. */
    function hit(Lc,Rc,n,t0,o){
      const c=1-Math.exp(-TAU*o.fc/sr), c2=o.hp?1-Math.exp(-TAU*o.fc*o.hp/sr):0, dk=Math.exp(-1/o.tau), b=o.body;
      const gl=Math.cos((o.pan+1)*Math.PI/4)*o.amp, gr=Math.sin((o.pan+1)*Math.PI/4)*o.amp;
      const itd=Math.round(o.pan*.00025*sr), offL=t0+(itd>0?itd:0), offR=t0+(itd<0?-itd:0);
      let len=Math.ceil(o.tau*6); if(b&&b.len>len) len=Math.min(b.len,Math.round(.05*sr));
      if(len>n) len=n;
      let env=1, lp=0, lo=0, y1=0, y2=0;
      for(let i=0;i<len;i++){
        const x=(rn()*2-1)*env*(i<4?(i+1)*.2:1); env*=dk;
        lp+=c*(x-lp); lo+=c2*(lp-lo);
        let v=lp-lo;
        if(b){ const y=b.g*lp+b.a1*y1+b.a2*y2; y2=y1; y1=y; v=v*.6+y*b.w; }
        let j=offL+i; if(j>=n) j-=n; Lc[j]+=v*gl;
        if(Rc){ j=offR+i; if(j>=n) j-=n; Rc[j]+=v*gr; }
      }
    }
    const rmsTo=(chs,to)=>{ let e=0, m=0; for(const c of chs){ for(let i=0;i<c.length;i++) e+=c[i]*c[i]; m+=c.length; }
      const k=to/Math.sqrt(e/m||1e-12); for(const c of chs) for(let i=0;i<c.length;i++) c[i]*=k; };
    function layer(o){
      const n=Math.round(o.sec*sr), Lc=new Float32Array(n), Rc=new Float32Array(n), count=Math.round(o.rate*o.sec);
      for(let k=0;k<count;k++){
        const size=Math.pow(rn(),o.size), near=Math.pow(rn(),o.near);
        const body=rn()<o.body?ring(logp(o.bf[0],o.bf[1],rn()*(1-.6*size)),lerp(o.q[0],o.q[1],rn())):null;
        hit(Lc,Rc,n,(rn()*n)|0,{ amp:(.25+.75*size)*(.3+.7*near), tau:lerp(o.tau[0],o.tau[1],size)*sr/1000,
          fc:logp(o.fc[0],o.fc[1],.8*(1-size)+.2*rn())*(.6+.4*near), hp:1/3, body, pan:(rn()*2-1)*o.width });
      }
      rmsTo([Lc,Rc],.1);
      return [Lc,Rc];
    }
    /* close drips, one shot each: a knock on wood or a broad leaf, a tick
       on a small leaf, or a plip into a puddle with the little bubble it
       leaves (kept short and soft, so it's a plip and not a bloop) */
    function drip(kind){
      const n=Math.round(.16*sr), a=new Float32Array(n);
      if(kind===0) hit(a,null,n,0,{ amp:1, tau:lerp(.25,.5,rn())*sr/1000, fc:logp(2500,5500,rn()), body:ring(logp(420,1000,rn()),lerp(6,10,rn()),2.2), pan:0 });
      else if(kind===1) hit(a,null,n,0,{ amp:1, tau:lerp(.18,.32,rn())*sr/1000, fc:logp(5000,8000,rn()), body:ring(logp(1700,3400,rn()),lerp(4,7,rn())), pan:0 });
      else{
        hit(a,null,n,0,{ amp:.8, tau:.25*sr/1000, fc:4500, body:null, pan:0 });
        const f0=logp(950,1800,rn()), rise=lerp(.15,.35,rn()), tb=lerp(.006,.011,rn())*sr, st=Math.round(lerp(.0008,.002,rn())*sr);
        let ph=0;
        for(let i=0;i+st<n;i++){ ph+=TAU*f0*(1+rise*Math.min(1,i/(5*tb)))/sr;
          a[i+st]+=Math.sin(ph)*Math.exp(-i/tb)*Math.min(1,i/(.0006*sr))*.4; }
      }
      let pk=0; for(let i=0;i<n;i++) pk=Math.max(pk,Math.abs(a[i]));
      const k=.8/(pk||1); for(let i=0;i<n;i++) a[i]*=k;
      return [a];
    }
    if(job.part==='drips'){ const out=[]; for(let i=0;i<job.drips;i++) out.push(drip(i%3)[0]); return out; }
    return layer(job.layers[job.part]);
  }
  /* The drops for this sample rate, written once, off the page's thread
     when it can be (a worker), each part handed over as soon as it's done.
     cb(k, data) hears about every part, including ones already written. */
  function rawData(sr,cb){
    if(!raw||raw.sr!==sr){
      const R=raw={ sr, parts:{}, subs:[] }, seed=(Math.random()*4294967296)>>>0;
      const got=(k,v)=>{ if(R.parts[k]) return; R.parts[k]=v; R.subs.forEach(f=>f(k,v)); };
      const jobs=PARTS.map((part,i)=>({ sr, part, layers:LAYERS, drips:DRIPS, seed:(seed+i*0x9e3779b1)>>>0 }));
      /* no worker: write them here, one part per turn, so the page still breathes in between */
      const here=()=>{ let i=0; const next=()=>{ while(i<jobs.length&&R.parts[jobs[i].part]) i++;
        if(i<jobs.length){ const j=jobs[i++]; got(j.part,genRain(j)); setTimeout(next,30); } }; setTimeout(next,0); };
      let w=null, url=null;
      try{
        url=URL.createObjectURL(new Blob(['var gen=('+genRain+');onmessage=function(e){e.data.forEach(function(j){var v=gen(j);postMessage({k:j.part,v:v},v.map(function(a){return a.buffer}))})}'],{type:'text/javascript'}));
        w=new Worker(url);
      }catch(e){ w=null; }
      if(!w){ if(url) URL.revokeObjectURL(url); here(); }
      else{
        let left=jobs.length;
        const end=()=>{ w.terminate(); URL.revokeObjectURL(url); };
        w.onmessage=e=>{ got(e.data.k,e.data.v); if(!--left) end(); };
        w.onerror=e=>{ if(e&&e.preventDefault) e.preventDefault(); end(); here(); };
        w.postMessage(jobs);
      }
    }else for(const k in raw.parts) cb(k,raw.parts[k]);
    raw.subs.push(cb);
  }
  const rawAll=sr=>new Promise(done=>{ const need=new Set(PARTS); rawData(sr,k=>{ need.delete(k); if(!need.size) done(); }); });

  /* smooth noise for the far wash and the low roar; the loop's end is
     cross-faded into its start (equal power, so there's no dip) */
  function pink(out){ let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
    for(let i=0;i<out.length;i++){ const w=Math.random()*2-1;
      b0=.99886*b0+w*.0555179; b1=.99332*b1+w*.0750759; b2=.969*b2+w*.153852; b3=.8665*b3+w*.3104856;
      b4=.55*b4+w*.5329522; b5=-.7616*b5-w*.016898; out[i]=b0+b1+b2+b3+b4+b5+b6+w*.5362; b6=w*.115926; } }
  function brown(out){ let l=0; for(let i=0;i<out.length;i++){ l=(l+.02*(Math.random()*2-1))/1.02; out[i]=l; } }
  function noiseLoop(ctx,sec,fill,corr){
    const sr=ctx.sampleRate, n=Math.round(sr*sec), fade=Math.round(sr*.3), b=ctx.createBuffer(2,n,sr);
    const both=new Float32Array(n+fade), a=Math.sqrt(corr||0), o=Math.sqrt(1-(corr||0)); fill(both);
    for(let c=0;c<2;c++){
      const raw=new Float32Array(n+fade); fill(raw);
      for(let i=0;i<raw.length;i++) raw[i]=both[i]*a+raw[i]*o;     // partly the same in both ears, like a real pair of mics
      const d=b.getChannelData(c);
      for(let i=0;i<n;i++) d[i]=raw[i];
      for(let i=0;i<fade;i++){ const k=i/fade*Math.PI/2; d[i]=raw[n+i]*Math.cos(k)+raw[i]*Math.sin(k); }
      let e=0; for(let i=0;i<n;i++) e+=d[i]*d[i];
      const s=.1/Math.sqrt(e/n||1e-12); for(let i=0;i<n;i++) d[i]*=s;
    }
    return b;
  }
  /* the space the rain is in: a few close reflections (the ground, a wall),
     then a soft tail about a second and a half long that darkens as it dies */
  function space(ctx){
    const sr=ctx.sampleRate, n=Math.round(sr*1.9), pre=Math.round(sr*.012), b=ctx.createBuffer(2,n,sr);
    for(let c=0;c<2;c++){
      const d=b.getChannelData(c); let lp=0;
      for(let i=pre;i<n;i++){
        const t=(i-pre)/sr, k=1-Math.exp(-2*Math.PI*(6500*Math.exp(-t*1.6)+700)/sr);
        lp+=k*((Math.random()*2-1)-lp);
        d[i]=lp*Math.exp(-t*6.9/1.35)*(t<.006?t/.006:1)*.6;
      }
      for(let r=0;r<7;r++){ const i=pre+Math.round(rnd(.002,.07)*sr); d[i]+=rnd(.25,.6)*(Math.random()<.5?-1:1); }
    }
    return b;
  }
  function loopSrc(ctx,buf,off){ const s=ctx.createBufferSource(); s.buffer=buf; s.loop=true; s.start(0,(off||0)%buf.duration); return s; }
  function chain(...n){ for(let i=0;i<n.length-1;i++) n[i].connect(n[i+1]); return n[n.length-1]; }

  /* The whole sound, on any audio context (the live one, or an offline one
     for checking how it sounds without speakers). */
  function graph(ctx,now){
    const G={ ctx, L:{} }, later=now?(f=>f()):(f=>setTimeout(f,0));
    const gn=v=>{ const n=ctx.createGain(); n.gain.value=v; return n; };
    const fl=(type,f,q,db)=>{ const b=ctx.createBiquadFilter(); b.type=type; b.frequency.value=f; if(q!=null) b.Q.value=q; if(db!=null) b.gain.value=db; return b; };
    G.gn=gn; G.fl=fl;
    const comp=ctx.createDynamicsCompressor();
    comp.threshold.value=-18; comp.knee.value=12; comp.ratio.value=2.5; comp.attack.value=.02; comp.release.value=.4;
    /* and a safety net after the volume, so even 100% never clips: a curve
       that leaves everything under 0.8 alone and rounds off the rare peak
       above it (the input is halved first so peaks up to 2 fit the curve) */
    const half=gn(.5), soft=ctx.createWaveShaper(), cv=new Float32Array(4097);
    for(let i=0;i<cv.length;i++){ const s=(i/(cv.length-1)*2-1)*2, a=Math.abs(s);
      cv[i]=Math.sign(s)*(a<.8?a:.8+.19*Math.tanh((a-.8)/.19)); }
    soft.curve=cv; soft.oversample='2x';
    G.master=gn(0); G.bus=gn(1); G.out=soft;
    /* warm on top: a gentle shelf down from ~4 kHz and nothing above ~10 */
    chain(G.bus, fl('highshelf',3800,null,-2.5), fl('lowpass',10500,.5), comp, G.master, half, soft, ctx.destination);
    G.send=gn(1); G.wet=gn(0);
    const verb=ctx.createConvolver();
    chain(G.send, verb, G.wet, G.bus);
    /* the far-off wash: all the drops too far away to hear one by one */
    const bedIn=fl('highpass',110,.5);
    G.bedLp=fl('lowpass',2000,.5); G.L.bed=gn(0); chain(bedIn, G.bedLp, G.L.bed, G.bus);
    /* the low roar under a downpour */
    const lowIn=fl('lowpass',260,.6);
    G.L.low=gn(0); chain(lowIn, G.L.low, G.bus);
    /* wind: wide and soft, never a whistle */
    G.windBp=fl('bandpass',420,.8); G.L.wind=gn(0); chain(G.windBp, G.L.wind, G.bus);
    /* the noise itself takes a few tens of ms each to make: live, each gets
       its own turn so turning the rain on never holds the page up */
    later(()=>{ const pk=noiseLoop(ctx,8.3,pink,.45), bo=rnd(0,8.3);
      loopSrc(ctx,pk,bo).connect(bedIn);
      loopSrc(ctx,pk,bo+4.15).connect(G.windBp); });             // half a loop away from the wash, so the two never line up
    later(()=>{ G.brown=noiseLoop(ctx,9.7,brown,.6); loopSrc(ctx,G.brown,rnd(0,9)).connect(lowIn); });
    later(()=>{ verb.buffer=space(ctx); });
    /* the drops: the gains are here now, the sources join when written */
    for(const k in LAYERS){ G.L[k]=gn(0); G.L[k].connect(G.bus); G.L[k].connect(G.send); }
    G.drips=gn(1); G.drips.connect(G.bus);
    const ds=gn(.7); G.drips.connect(ds); ds.connect(G.send);
    return G;
  }
  /* hook a written part into a graph; a layer fades up rather than pops in */
  function fill(G,k,v,up){
    const ctx=G.ctx, sr=ctx.sampleRate, t=ctx.currentTime;
    if(k==='drips'){ G.dripBufs=v.map(a=>{ const b=ctx.createBuffer(1,a.length,sr); b.copyToChannel(a,0); return b; }); return; }
    if(!G.L[k]||G.L[k].src) return;
    const b=ctx.createBuffer(2,v[0].length,sr); b.copyToChannel(v[0],0); b.copyToChannel(v[1],1);
    up=up==null?2:up;
    const u=G.gn(up?0:1); if(up){ u.gain.setValueAtTime(0,t); u.gain.linearRampToValueAtTime(1,t+up); }
    G.L[k].src=loopSrc(ctx,b,rnd(0,b.duration));
    chain(G.L[k].src, G.fl('highpass',LAYERS[k].hp,.6), u, G.L[k]);
  }
  /* how much of everything, right now. I: how hard it's raining this
     minute (slow drift); gu: how strong the gust is (0..1) */
  function mix(G,lv,t,tc,I,gu){
    const to=(p,v)=>{ p.cancelScheduledValues(t); p.setTargetAtTime(v,t,tc); };
    to(G.L.bed.gain, lv.bed*Math.sqrt(I)*(1+.15*gu));
    to(G.bedLp.frequency, lv.bedLp*(1+.1*gu));
    to(G.L.fine.gain, lv.fine*I);
    to(G.L.dense.gain, lv.dense*I*(1+.2*gu));
    to(G.L.heavy.gain, lv.heavy*I*I*(1+.3*gu));
    to(G.L.low.gain, lv.low*I);
    to(G.L.wind.gain, lv.wind*(.25+.75*gu));
    to(G.windBp.frequency, 300+420*gu);
    to(G.wet.gain, lv.wet);
  }
  const gauss=()=>Math.sqrt(-2*Math.log(1-Math.random()))*Math.cos(2*Math.PI*Math.random());
  /* the slow come-and-go: wanders around 0 and drifts back over ~9 s */
  const wander=(d,dt,sd)=>d-d/9*dt+sd*Math.sqrt(2*dt/9)*gauss();
  function pan(G,node,v,to){ const p=G.ctx.createStereoPanner?G.ctx.createStereoPanner():null; if(!p){ node.connect(to); return; } p.pan.value=clamp(v,-1,1); node.connect(p); p.connect(to); }
  function drip(G,t,pn,amp,rate){
    if(!G.dripBufs) return;
    const ctx=G.ctx, s=ctx.createBufferSource(), gg=G.gn(amp);
    s.buffer=G.dripBufs[Math.random()*G.dripBufs.length|0]; s.playbackRate.value=rate||1;
    s.connect(gg); pan(G,gg,pn,G.drips); s.start(t);
  }
  /* a tap on the water: a soft knock, then the round bubble it leaves */
  function plopAt(G,t,pn,k){
    const ctx=G.ctx;
    if(G.dripBufs){ const s=ctx.createBufferSource(), gg=G.gn(.38*k); s.buffer=G.dripBufs[2]; s.playbackRate.value=rnd(.55,.7);
      s.connect(gg); pan(G,gg,pn,G.drips); s.start(t); }
    const o=ctx.createOscillator(), gg=G.gn(0), f0=rnd(330,480), tb=rnd(.025,.035);
    o.type='sine'; o.frequency.setValueAtTime(f0,t+.004); o.frequency.exponentialRampToValueAtTime(f0*1.35,t+tb*4);
    gg.gain.setValueAtTime(0,t+.004); gg.gain.linearRampToValueAtTime(.12*k,t+.007); gg.gain.setTargetAtTime(0,t+.007,tb);
    o.connect(gg); pan(G,gg,pn,G.drips); o.start(t+.004); o.stop(t+.007+tb*8);
  }
  /* thunder, far off: it swells in rather than cracks, rolls a few times,
     and dies away low. Rarely a nearer one, still with no sharp crack. */
  function thunderAt(G,t,near){
    if(!G.brown) return;
    const ctx=G.ctx, s=ctx.createBufferSource(); s.buffer=G.brown; s.loop=true;
    const lp=G.fl('lowpass',near>.7?700:380,.6), lp2=G.fl('lowpass',near>.7?900:500,.5), gg=G.gn(0);
    const len=rnd(7,12)+near*3, peak=(.55+.65*near)*.7, atk=near>.7?rnd(.15,.35):rnd(.6,1.6);
    lp.frequency.setValueAtTime(near>.7?700:380,t); lp.frequency.exponentialRampToValueAtTime(110,t+len);
    gg.gain.setValueAtTime(0,t); gg.gain.linearRampToValueAtTime(peak,t+atk);
    let at=t+atk; while(at<t+len*.7){ at+=rnd(.6,1.8); gg.gain.linearRampToValueAtTime(peak*rnd(.3,.9)*(1-(at-t)/len),at); }
    gg.gain.setTargetAtTime(0,at,len*.1);
    chain(s,lp,lp2,gg); pan(G,gg,rnd(-.6,.6),G.bus);
    s.start(t,rnd(0,5)); s.stop(at+len*.6);
  }

  function unlock(){
    if(unlockBound) return; unlockBound=true;
    const off=()=>{ ['pointerdown','keydown','touchstart'].forEach(t=>window.removeEventListener(t,go,true)); unlockBound=false; };
    const go=()=>{ if(!ac||!S.on) return off(); ac.resume().then(()=>{ if(ac.state==='running') off(); }).catch(()=>{}); };
    ['pointerdown','keydown','touchstart'].forEach(t=>window.addEventListener(t,go,true));
  }
  function volume(){ return Math.pow(clamp(S.vol,0,100)/100,1.6)*2.2; }
  function fade(v,sec){ if(!g) return; const t=ac.currentTime, p=g.master.gain;
    p.cancelScheduledValues(t); p.setValueAtTime(p.value,t); p.linearRampToValueAtTime(v,t+sec); fadeTo=v; }
  function ensure(){
    if(g) return true;
    const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false;
    try{ ac=ac||new AC(); }catch(e){ return false; }
    const G=g=graph(ac);
    rawData(ac.sampleRate,(k,v)=>fill(G,k,v));
    return true;
  }
  /* every ~120 ms while it rains: the mix follows the weather, and close
     drips are booked a little ahead (so a slowed background timer can't
     leave gaps) */
  function tick(tc){
    if(!g||!S.on) return;
    const now=performance.now(), dt=lastTick?Math.min(1,(now-lastTick)/1000):.12; lastTick=now;
    const lv=L().snd, t=ac.currentTime;
    drift=wander(drift,dt,lv.sway);
    mix(g,lv,t,tc,Math.exp(drift),Math.min(1,Math.abs(W.gust)));
    if(ac.state!=='running') return;
    const ahead=t+1.2;
    if(nextDrip<t) nextDrip=t+rnd(.3,2);
    while(nextDrip<ahead){
      drip(g,nextDrip,rnd(-.8,.8),lv.dripVol*(.25+.75*Math.pow(Math.random(),1.5)),rnd(.88,1.12));
      nextDrip+=-Math.log(1-Math.random())/lv.drip;
    }
  }
  function update(){
    if(S.on){
      if(!ensure()) return;
      if(ac.state==='suspended') ac.resume().catch(()=>{});
      if(ac.state!=='running') unlock();
      tick(playing?1.2:.01);
      const v=volume(); if(!playing) fade(v,2.5); else if(v!==fadeTo) fade(v,.4);
      playing=true;
      if(!schedT) schedT=setInterval(()=>tick(.8),120);
    }else if(g&&playing){
      fade(0,1.6); playing=false; lastTick=0;
      clearInterval(schedT); schedT=null;
      setTimeout(()=>{ if(!S.on&&ac&&ac.state==='running') ac.suspend().catch(()=>{}); },1800);
    }
  }
  function plop(pn,k){ if(g&&ac.state==='running') plopAt(g,ac.currentTime,clamp(pn,-1,1),k||1); }
  function thunder(near,delay){ if(g&&ac.state==='running') thunderAt(g,ac.currentTime+delay,near); }
  /* loudness of what's playing, in dBFS (for checking levels by eye) */
  let an=null;
  function meter(){ if(!ac||!g) return null; if(!an){ an=ac.createAnalyser(); an.fftSize=4096; g.out.connect(an); }
    const d=new Float32Array(an.fftSize); an.getFloatTimeDomainData(d); let e=0, pk=0; for(const v of d){ e+=v*v; pk=Math.max(pk,Math.abs(v)); }
    return { rms:+(10*Math.log10(e/d.length+1e-12)).toFixed(1), peak:+(20*Math.log10(pk+1e-12)).toFixed(1) }; }
  /* the same sound rendered offline, for listening tests and level checks:
     Rain.render('rain',30).then(buf=>...). o: {drips:false, thunder:false}
     leaves those out; o.solo:'dense' (or bed, fine, heavy, low, wind) plays
     just that layer. */
  async function render(level,sec,sr,o){
    sr=sr||48000; sec=sec||20; o=o||{};
    const LV=LEVELS[level]||LEVELS.rain, lv=o.solo?Object.fromEntries(Object.entries(LV.snd).map(([k,v])=>[k,['bed','fine','dense','heavy','low','wind','dripVol'].includes(k)&&k!==o.solo?0:v])):LV.snd;
    const ctx=new OfflineAudioContext(2,Math.round(sec*sr),sr), G=graph(ctx,true);
    await rawAll(sr); for(const k in raw.parts) fill(G,k,raw.parts[k],0);
    G.master.gain.value=volume();
    let d=0;
    for(let t=0;t<sec;t+=.12){ gustStep(.12,LV); d=wander(d,.12,lv.sway); mix(G,lv,t,t?.8:.005,Math.exp(d),Math.min(1,Math.abs(W.gust))); }
    if(o.drips!==false&&lv.dripVol) for(let t=rnd(.3,2);t<sec;t+=-Math.log(1-Math.random())/lv.drip)
      drip(G,t,rnd(-.8,.8),lv.dripVol*(.25+.75*Math.pow(Math.random(),1.5)),rnd(.88,1.12));
    if(LV.thunder&&(o.solo?o.thunder===true:o.thunder!==false)){ thunderAt(G,sec*.15,.3); thunderAt(G,sec*.6,.85); }
    return ctx.startRendering();
  }
  return { update, plop, thunder, meter, render, state:()=>ac?ac.state:'none' };
})();

/* ───────────── public ───────────── */
function set(o){
  const was=S.on, lvWas=S.level;
  Object.assign(S,o||{});
  if(!LEVELS[S.level]) S.level='rain';
  if(S.level!==lvWas){ W.nextBolt=0; }
  if(S.on&&S.visible) gEnsure();
  paintVeil(); Snd.update();
  if(!S.on||!S.visible){ halt(); clear(); }
  else if(!S.motion){ halt(); still(); }
  else loop();
  if(was!==S.on&&!S.on){ W.flashQ=[]; W.flash=0; }
}
function clear(){
  /* let what's on screen fade with the canvases (opacity transition), then drop it */
  setTimeout(()=>{ if(S.on&&S.visible) return;
    P.drops=[]; P.rings=[]; P.bits=[]; G.drops=[]; G.bits=[];
    if(P.cx) P.cx.clearRect(0,0,P.cv.width,P.cv.height); if(G.cx) G.cx.clearRect(0,0,G.w,G.h); },1300);
}
function visible(v){ if(S.visible!==!!v) set({visible:!!v}); }

window.Rain={ set, attach, visible, LEVELS, ORDER, splash:(x,y)=>splash(x,y,1),
  meter:()=>Snd.meter(), thunder:()=>bolt(), render:(level,sec,sr,o)=>Snd.render(level,sec,sr,o), state:()=>({...S, audio:Snd.state(), drops:P.drops.length, rings:P.rings.length, page:G.drops.length}) };
})();
