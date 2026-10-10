/* stage.js · the focus ritual
   You click Focus. The toad comes out to the middle of the screen and asks,
   in its own voice, whether you're ready and mean it. Yes: it says "good"
   its own way, counts 3, 2, 1, the session starts, and it slithers off into
   a corner of the screen with the timer under it. Not yet: it says so
   kindly and goes back where it was.

   This window covers the screen only while that happens. The toad drawn here
   starts exactly where the desktop toad was and ends exactly where the
   desktop toad will be, so the hand-over at either end can't be seen. */
'use strict';
(async function(){
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const init=await window.pet.init();
const R=init.ritual, NAME=init.toad, S=init.geo.S, KEEPERS=['hasu','ame','sumi','tabi','hotaru'];
const BIG=Math.round(Math.max(190,S*1.7));
document.documentElement.style.setProperty('--B',BIG+'px');

function load(src,base){
  return new Promise(res=>{ const s=document.createElement('script'); s.src=(base||'')+src; s.onload=()=>res(true); s.onerror=()=>res(false); document.head.appendChild(s); });
}
await load('pet-lines.js');
for(const f of ['toad-art.js','toads-design/toad-art-cast.js','toad-companions.js','toad-expressions.js']) await load(f,init.artBase);
try{ window.ToadArt.injectCSS(); window.ToadArt.injectCastCSS&&window.ToadArt.injectCastCSS(); window.ToadCompanions&&window.ToadCompanions.injectCSS();
  window.ToadExpressions&&window.ToadExpressions.injectCSS&&window.ToadExpressions.injectCSS(); }catch(e){}

/* the same drawing as the desktop toad (pet.js), just bigger */
let h='';
try{
  if(KEEPERS.includes(NAME)) h=window.ToadArt.svg(NAME,{size:BIG,perch:NAME==='hasu'?'pad':'own',water:false});
  else if(window.ToadCompanions&&window.ToadCompanions.has(NAME)) h=window.ToadCompanions.svg(NAME,{size:BIG});
}catch(e){}
$('art').innerHTML=h||(window.ToadArt?window.ToadArt.svg('hasu',{size:BIG,perch:'pad',water:false}):'');
const svg=$('art').querySelector('svg');

/* ── where the toad is: top-left of its box and its scale (1 = BIG) ── */
const W=innerWidth, H=innerHeight;
const FROM={x:R.from.x,y:R.from.y,s:R.from.s/BIG};
const TO={x:R.to.x,y:R.to.y,s:S/BIG};
const MID={x:Math.round(W/2-BIG/2),y:Math.round(H/2-BIG*.3),s:1};
const T=s=>`translate(${s.x.toFixed(1)}px,${s.y.toFixed(1)}px) scale(${s.s.toFixed(4)})`;
$('toad').style.transform=T(FROM);
$('toad').style.opacity=R.from.fade?'0':'1';
/* the bubble sits over the toad's head, the countdown in the same place */
$('bubble').style.bottom=Math.round(H-MID.y-BIG*.04)+'px';
$('count').style.top=Math.round(MID.y-190)+'px';

/* ── lines, faces, sounds ── */
const L=(window.PET_LINES&&window.PET_LINES[NAME])||{};
const pick=a=>a&&a.length?a[Math.floor(Math.random()*a.length)]:'';
const FACES={ready:{hasu:'considering',ame:'attentive',sumi:'thoughtful',tabi:'encouraging',hotaru:'earnest'},
  committed:{hasu:'fond',ame:'glad',sumi:'pleased',tabi:'excited',hotaru:'delighted'},
  notYet:{hasu:'tender',ame:'gentle',sumi:'pleased',tabi:'reassuring',hotaru:'peaceful'}};
function face(k){ try{ if(svg&&window.ToadExpressions) window.ToadExpressions.apply(svg,NAME,(FACES[k]&&FACES[k][NAME])||'neutral'); }catch(e){} }
function hop(){ const a=$('art'); a.classList.remove('td-hop'); void a.offsetWidth; a.classList.add('td-hop'); setTimeout(()=>a.classList.remove('td-hop'),950); }
let actx=null;
function tone(freq,dur,vol,type){
  if(!R.sound) return;
  try{ actx=actx||new AudioContext(); const a=actx, o=a.createOscillator(), g=a.createGain(), t=a.currentTime;
    o.type=type||'sine'; o.frequency.value=freq;
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+.012); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t+dur+.02); }catch(e){}
}
const tick=n=>{ tone(n===1?988:740,.16,.14,'triangle'); };
const go=()=>{ tone(523,.36,.16); setTimeout(()=>tone(784,.4,.16),170); };

let sayT=null;
function say(text){
  return new Promise(res=>{
    const el=$('say'); clearInterval(sayT);
    const ch=[...String(text||'')];
    el.innerHTML=ch.map(c=>`<span class="off">${esc(c)}</span>`).join('');
    const spans=el.querySelectorAll('span'); let i=0;
    const a=$('art'); a.classList.add('td-talking');
    sayT=setInterval(()=>{ for(let k=0;k<2&&i<spans.length;k++,i++) spans[i].classList.remove('off');
      if(i>=spans.length){ clearInterval(sayT); a.classList.remove('td-talking'); res(); } },18);
  });
}
$('say').addEventListener('click',()=>$('say').querySelectorAll('.off').forEach(s=>s.classList.remove('off')));

/* ── the rhythm, chosen right in the bubble (unless the Focus set-up already chose it) ── */
const RHY=[['Gentle',15,3],['Classic',25,5],['Deep',50,10]];
let F=R.f, B=R.b;
function paintRhythm(){
  const el=$('rhy');
  if(R.fixed){ el.innerHTML=`<span class="cap">${F} min focus · ${B} min break${R.ids&&R.ids.length?` · ${R.ids.length} task${R.ids.length===1?'':'s'}`:''}</span>`; return; }
  const list=RHY.slice();
  if(!list.some(r=>r[1]===R.usual[0]&&r[2]===R.usual[1])) list.push(['Your usual',R.usual[0],R.usual[1]]);
  el.innerHTML=list.map(([n,f,b])=>`<button class="${f===F&&b===B?'on':''}" data-f="${f}" data-b="${b}" title="${f} min focus, ${b} min break">${n} · ${f}</button>`).join('');
}
$('rhy').addEventListener('click',e=>{ const b=e.target.closest('[data-f]'); if(!b) return; F=+b.dataset.f; B=+b.dataset.b; paintRhythm(); });

/* ── moving the toad ── */
function move(from,to,ms,arc){
  const mid={x:(from.x+to.x)/2,y:Math.min(from.y,to.y)-(arc||0),s:(from.s+to.s)/2};
  return $('toad').animate([{transform:T(from),opacity:$('toad').style.opacity||1},{transform:T(mid),opacity:1,offset:.55},{transform:T(to),opacity:1}],
    {duration:ms,easing:'cubic-bezier(.3,1.15,.5,1)',fill:'forwards'}).finished.then(()=>{ $('toad').style.opacity='1'; });
}
/* off to the corner: sliding along the way with a side-to-side wiggle that dies out */
function slither(from,to,ms){
  const N=48, outer=[], inner=[];
  const dx=to.x-from.x, dy=to.y-from.y, len=Math.hypot(dx,dy)||1, px=-dy/len, py=dx/len, amp=Math.min(90,len*.11);
  for(let i=0;i<=N;i++){
    const t=i/N, e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2, fade=Math.pow(1-t,.6);
    const wav=Math.sin(t*Math.PI*6)*amp*fade;
    outer.push({offset:t,transform:T({x:from.x+dx*e+px*wav,y:from.y+dy*e+py*wav,s:from.s+(to.s-from.s)*e})});
    const r=Math.cos(t*Math.PI*6)*18*fade, q=Math.sin(t*Math.PI*12)*.09*fade;
    inner.push({offset:t,transform:`rotate(${r.toFixed(2)}deg) scale(${(1+q).toFixed(3)},${(1-q).toFixed(3)})`});
  }
  return Promise.all([$('toad').animate(outer,{duration:ms,fill:'forwards'}).finished,$('wig').animate(inner,{duration:ms,fill:'forwards'}).finished]);
}

/* ── choices ── */
let choose=null, phase='ask', aborted=false;
const answer=v=>{ if(choose){ const c=choose; choose=null; c(v); } };
$('yes').onclick=()=>answer('yes');
$('no').onclick=()=>answer('no');
$('pick').onclick=()=>answer('pick');
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ e.preventDefault(); if(phase==='ask') answer('no'); else if(phase==='count') aborted=true; }
  else if(e.key==='Enter'&&phase==='ask'&&!(document.activeElement&&document.activeElement.closest('.rhy,.lnk,.no'))){ e.preventDefault(); answer('yes'); }
});

async function back(why){
  phase='leave';
  $('bubble').classList.remove('on'); $('dim').classList.remove('on');
  face('neutral');
  await move(MID,FROM,560,40);
  window.pet.send('stage-done',{started:false,pick:why==='pick'});
}

async function run(){
  $('art').classList.add('td-mv');
  $('dim').classList.add('on');
  await move(FROM,MID,640,70);
  hop();
  $('who').textContent=(init.names&&init.names[NAME])||NAME;
  paintRhythm();
  $('bubble').classList.add('on');
  face('ready');
  const asked=say(pick(L.ready)||'Ready to focus?');
  setTimeout(()=>$('yes').focus(),60);
  const v=await new Promise(r=>{ choose=r; });
  await asked;
  if(v==='pick'){ return back('pick'); }
  $('bubble').classList.add('said');
  if(v==='no'){
    face('notYet');
    await say(pick(L.notYet)||'Okay. Later, then.');
    await sleep(1300);
    return back('no');
  }
  /* yes */
  face('committed'); hop();
  window.pet.send('mem',{rhythm:[F,B]});
  await say(pick(L.committed)||'Good.');
  await sleep(1000);
  $('bubble').classList.remove('on');
  face('neutral');
  phase='count';
  for(const n of [3,2,1]){
    if(aborted) break;
    $('count').innerHTML=`<i></i><span>${n}</span>`;
    tick(n); hop();
    await sleep(900);
  }
  $('count').innerHTML='';
  if(aborted) return back('no');
  phase='leave';
  const res=await window.pet.op({k:'focus',act:'start',f:F,b:B,ids:R.ids||[]});
  if(!res||!res.ok) return back('no');
  go();
  $('dim').classList.remove('on');
  await slither(MID,TO,1500);
  window.pet.send('stage-done',{started:true});
}

window.pet.on('go',()=>run());
/* drawn at the desktop toad's spot: ready to take over from it */
requestAnimationFrame(()=>requestAnimationFrame(()=>window.pet.send('stage-ready')));
})();
