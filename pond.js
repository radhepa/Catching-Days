/* ═══════════════ pond art ═══════════════
   Everything the Koi Pond look is drawn with: the species catalog, the fish
   and mood plants, and the water (caustics, ripples, glints, petals, lily
   pads, blurred fish deep down). Pure functions that return HTML/SVG strings
   — nothing in here reads or writes the database. The app decides who is
   found and what swims where; this file only knows how to draw it.

   Loaded before the main script, so it can't use the app's helpers. */
(function(){
'use strict';

/* ── a tiny element builder: h('ellipse',{cx:1,fill:'#fff'}) → '<ellipse …/>' ──
   Same call shape as React.createElement, so the drawings read like the
   design they came from. Style objects follow React's rules: camelCase keys,
   bare numbers get 'px' unless the property is unitless. */
const UNITLESS=new Set(['opacity','zIndex','flex','fontWeight','lineHeight','order','flexGrow','flexShrink']);
const KEBAB_ATTR=new Set(['strokeWidth','strokeLinecap','strokeLinejoin','strokeDasharray','strokeOpacity','fillOpacity','clipPath','stopColor','stopOpacity']);
const kebab=s=>s.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
function css(o){
  if(!o) return '';
  let s='';
  for(const k in o){ const v=o[k]; if(v==null||v===false) continue;
    s+=kebab(k)+':'+(typeof v==='number'&&!UNITLESS.has(k)?v+'px':v)+';'; }
  return s;
}
function flat(kids,out){
  for(const k of kids){ if(k==null||k===false) continue;
    if(Array.isArray(k)) flat(k,out); else out.push(k); }
  return out;
}
function h(tag,attrs,...kids){
  let a='';
  if(attrs) for(const k in attrs){
    if(k==='key') continue;
    const v=attrs[k]; if(v==null||v===false) continue;
    if(k==='style'){ const s=typeof v==='string'?v:css(v); if(s) a+=` style="${s}"`; continue; }
    a+=` ${KEBAB_ATTR.has(k)?kebab(k):k}="${v}"`;
  }
  const inner=flat(kids,[]).join('');
  return `<${tag}${a}>${inner}</${tag}>`;
}

/* one switch for all movement — the app sets it from settings + reduced-motion */
const PF={ motion:true, ripples:true, petals:true, light:false };

/* seeded randomness, so the same scene draws the same way every paint */
let seed=11;
const rnd=()=>(seed=(seed*9301+49297)%233280)/233280;
const reseed=n=>{ seed=n; };
function hs(str){ let x=7; for(const ch of String(str)) x=(x*31+ch.charCodeAt(0))>>>0;
  return ()=>(x=(x*1103515245+12345)>>>0)/4294967296; }

/* ── creatures: top-down, head toward +x ── */
const wagS=w=>PF.motion&&w?{transformBox:'fill-box',transformOrigin:'right center',animation:`pf-wag ${w}s ease-in-out infinite alternate`}:null;
const DRAW={
  koi:(c,p,w)=>[h('path',{d:'M-17 0 L-30 -8 Q-26 0 -30 8 Z',fill:c,opacity:.85,style:wagS(w)}),
    h('ellipse',{cx:4,cy:-7,rx:5,ry:2.2,transform:'rotate(-30 4 -7)',fill:c,opacity:.7}),h('ellipse',{cx:4,cy:7,rx:5,ry:2.2,transform:'rotate(30 4 7)',fill:c,opacity:.7}),
    h('ellipse',{cx:-2,cy:0,rx:17,ry:7,fill:c}),h('ellipse',{cx:9,cy:0,rx:10,ry:6.5,fill:c}),
    h('ellipse',{cx:-3,cy:-1,rx:6,ry:3.5,fill:p}),h('ellipse',{cx:10,cy:1.5,rx:3.5,ry:2.5,fill:p,opacity:.8})],
  goldfish:(c,p,w)=>[h('g',{style:wagS(w)},h('ellipse',{cx:-20,cy:-5,rx:11,ry:5,transform:'rotate(-25 -20 -5)',fill:c,opacity:.7}),h('ellipse',{cx:-20,cy:5,rx:11,ry:5,transform:'rotate(25 -20 5)',fill:c,opacity:.7})),
    h('ellipse',{cx:2,cy:-8,rx:4.5,ry:2,transform:'rotate(-35 2 -8)',fill:c,opacity:.7}),h('ellipse',{cx:2,cy:8,rx:4.5,ry:2,transform:'rotate(35 2 8)',fill:c,opacity:.7}),
    h('ellipse',{cx:-2,cy:0,rx:12,ry:8.5,fill:c}),h('ellipse',{cx:7,cy:0,rx:7,ry:7,fill:c}),h('ellipse',{cx:-3,cy:0,rx:5,ry:3.5,fill:p,opacity:.7})],
  betta:(c,p,w)=>[h('g',{style:wagS(w)},h('ellipse',{cx:-22,cy:0,rx:15,ry:12,fill:c,opacity:.6}),h('ellipse',{cx:-18,cy:0,rx:9,ry:8,fill:p,opacity:.5})),
    h('ellipse',{cx:-1,cy:-9,rx:10,ry:5,transform:'rotate(-18 -1 -9)',fill:c,opacity:.5}),h('ellipse',{cx:-1,cy:9,rx:10,ry:5,transform:'rotate(18 -1 9)',fill:c,opacity:.5}),
    h('ellipse',{cx:0,cy:0,rx:11,ry:4.8,fill:c}),h('ellipse',{cx:9,cy:0,rx:5,ry:4.2,fill:c})],
  puffer:(c,p,w)=>[h('path',{d:'M-9 0 L-18 -6 Q-15 0 -18 6 Z',fill:c,opacity:.85,style:wagS(w)}),
    ...Array.from({length:14},(_,i)=>{ const a=i/14*6.283; return h('circle',{cx:(Math.cos(a)*11.8).toFixed(2),cy:(Math.sin(a)*11.8).toFixed(2),r:1.3,fill:c}); }),
    h('circle',{cx:0,cy:0,r:10.5,fill:c}),h('circle',{cx:1,cy:0,r:6.5,fill:p,opacity:.55}),
    h('circle',{cx:6.5,cy:-4.5,r:1.8,fill:'#1f2e2c'}),h('circle',{cx:6.5,cy:4.5,r:1.8,fill:'#1f2e2c'})],
  clown:(c,p,w)=>[h('path',{d:'M-12 0 Q-23 -10 -22 0 Q-23 10 -12 0 Z',fill:c,style:wagS(w)}),
    h('ellipse',{cx:2,cy:-7,rx:4.5,ry:2,transform:'rotate(-30 2 -7)',fill:c,opacity:.8}),h('ellipse',{cx:2,cy:7,rx:4.5,ry:2,transform:'rotate(30 2 7)',fill:c,opacity:.8}),
    h('ellipse',{cx:0,cy:0,rx:14,ry:6.5,fill:c}),h('ellipse',{cx:9,cy:0,rx:6,ry:5.6,fill:c}),
    h('ellipse',{cx:6,cy:0,rx:1.9,ry:6,fill:p}),h('ellipse',{cx:-4,cy:0,rx:2.1,ry:6.3,fill:p}),h('ellipse',{cx:-11,cy:0,rx:1.4,ry:3.5,fill:p})],
  guppy:(c,p,w)=>[h('g',{style:wagS(w)},h('path',{d:'M-5 0 L-24 -10 Q-18 0 -24 10 Z',fill:c,opacity:.92}),h('path',{d:'M-6 0 L-18 -5 Q-15 0 -18 5 Z',fill:p,opacity:.55})),
    h('ellipse',{cx:4,cy:0,rx:9.5,ry:3.8,fill:'#e6efe9'}),h('ellipse',{cx:2,cy:0,rx:4,ry:2,fill:c,opacity:.6})],
  catfish:(c,p,w)=>[h('path',{d:'M16 -2 Q22 -6 28 -9 M16 2 Q22 6 28 9 M14 -3 Q17 -8 19 -13 M14 3 Q17 8 19 13',stroke:c,strokeWidth:1,fill:'none',strokeLinecap:'round'}),
    h('path',{d:'M-20 0 L-31 -7 Q-27 0 -31 7 Z',fill:c,opacity:.85,style:wagS(w)}),
    h('ellipse',{cx:4,cy:-7,rx:5,ry:2,transform:'rotate(-30 4 -7)',fill:c,opacity:.7}),h('ellipse',{cx:4,cy:7,rx:5,ry:2,transform:'rotate(30 4 7)',fill:c,opacity:.7}),
    h('ellipse',{cx:-3,cy:0,rx:19,ry:5.5,fill:c}),h('ellipse',{cx:10,cy:0,rx:8,ry:6.6,fill:c}),h('ellipse',{cx:-5,cy:0,rx:12,ry:2,fill:p,opacity:.6})],
  axolotl:(c,p,w)=>[h('path',{d:'M-10 0 Q-20 -5 -29 0 Q-20 5 -10 0 Z',fill:c,style:wagS(w)}),
    ...[[5,-7,-40],[5,7,40],[-7,-6,-50],[-7,6,50]].map(([x,y,r])=>h('ellipse',{cx:x,cy:y,rx:3.4,ry:1.5,transform:`rotate(${r} ${x} ${y})`,fill:c})),
    h('ellipse',{cx:-2,cy:0,rx:11,ry:4.6,fill:c}),h('ellipse',{cx:9,cy:0,rx:5.8,ry:5.2,fill:c}),
    ...[[7,-1],[9,-1],[11,-1],[7,1],[9,1],[11,1]].map(([x,s],i)=>h('ellipse',{cx:x,cy:s*6.5,rx:3,ry:1.1,transform:`rotate(${s*(i%3-1)*25+s*70} ${x} ${s*6.5})`,fill:p}))],
  ray:(c,p,w)=>[h('path',{d:'M-9 0 Q-20 1 -32 0',stroke:c,strokeWidth:1.4,fill:'none',strokeLinecap:'round'}),
    h('path',{d:'M14 0 Q3 -19 -9 -2 L-10 0 L-9 2 Q3 19 14 0 Z',fill:c,style:PF.motion&&w?{transformBox:'fill-box',transformOrigin:'center',animation:`pf-flap ${w*3}s ease-in-out infinite`}:null}),
    h('circle',{cx:2,cy:-5,r:1.3,fill:p}),h('circle',{cx:2,cy:5,r:1.3,fill:p}),h('circle',{cx:-3,cy:0,r:1.1,fill:p})],
  frog:(c,p,w)=>[...[[-9,-9,-40,7],[-9,9,40,7],[7,-8,40,4.5],[7,8,-40,4.5]].map(([x,y,r,l])=>h('ellipse',{cx:x,cy:y,rx:l,ry:2.2,transform:`rotate(${r} ${x} ${y})`,fill:c})),
    h('ellipse',{cx:-1,cy:0,rx:10,ry:8.5,fill:c}),h('ellipse',{cx:7,cy:0,rx:6,ry:7,fill:c}),h('ellipse',{cx:-1,cy:0,rx:5,ry:4,fill:p,opacity:.5}),
    h('circle',{cx:9,cy:-4.5,r:2.6,fill:c}),h('circle',{cx:9,cy:4.5,r:2.6,fill:c}),h('circle',{cx:9.6,cy:-4.5,r:1.2,fill:'#1f2e2c'}),h('circle',{cx:9.6,cy:4.5,r:1.2,fill:'#1f2e2c'})],
  turtle:(c,p,w)=>[...[[8,-10,-35,5.5],[8,10,35,5.5],[-8,-9,35,4],[-8,9,-35,4]].map(([x,y,r,l],i)=>h('ellipse',{cx:x,cy:y,rx:l,ry:2.4,transform:`rotate(${r} ${x} ${y})`,fill:p,
      style:PF.motion&&w?{transformBox:'fill-box',transformOrigin:x>0?'left center':'right center',animation:`pf-paddle ${w*2}s ease-in-out ${i%2?-w:0}s infinite alternate`}:null})),
    h('circle',{cx:15,cy:0,r:4,fill:p}),h('path',{d:'M-12 0 L-16 -1.5 L-16 1.5 Z',fill:p}),
    h('ellipse',{cx:0,cy:0,rx:12.5,ry:10.5,fill:c}),h('ellipse',{cx:0,cy:0,rx:6.5,ry:5.2,fill:'none',stroke:p,strokeWidth:1.2,opacity:.8}),
    ...[[-7,-5],[-7,5],[7,-5],[7,5]].map(([x,y])=>h('circle',{cx:x,cy:y,r:1.6,fill:p,opacity:.6}))],
};
DRAW.ghost=(c,p,w)=>DRAW.koi(c,p,w);

/* the generated body: a tapered outline plus tail, fins, pattern and
   features picked from a small vocabulary. Clip-path ids have to be unique
   in the whole document, hence the running counter. */
let cpN=0;
const gen=o=>(c,p,w)=>{
  const {L,H,pt}=o, ex=o.ex, b=o.b??.75, pk=L*(o.pk??.15), pw=H*(o.ped??.3), T=-L+1, id='pfc'+(cpN++), R=hs(o.name||'x');
  const detailed=!!o.detailed, silhouette=c===p;
  const ink=silhouette?c:'#173a3b', pearl=silhouette?c:'#fff8e9';
  const finMotion=side=>PF.motion&&w?{transformBox:'fill-box',transformOrigin:'right center',animation:`pf-fin-stroke ${+(w*2.7).toFixed(2)}s ease-in-out ${side<0?0:-w}s infinite alternate`}:null;
  const tl=ex.has('fork')?'fork':ex.has('lunate')?'lunate':ex.has('sword')?'sword':o.tl;
  const o2=[]; const add=(tag,a)=>o2.push(h(tag,a));
  const f=n=>+n.toFixed(2);
  const d=`M${L} 0 C${L} ${f(-H*b)} ${f(pk+(L-pk)*.45)} ${-H} ${f(pk)} ${-H} C${f(pk-(pk+L)*.45)} ${-H} ${f(-L*.55)} ${f(-pw*1.6)} ${-L} ${f(-pw)} L${-L} ${f(pw)} C${f(-L*.55)} ${f(pw*1.6)} ${f(pk-(pk+L)*.45)} ${H} ${f(pk)} ${H} C${f(pk+(L-pk)*.45)} ${H} ${L} ${f(H*b)} ${L} 0 Z`;
  const TL={fork:`M${T} 0 L${T-13} -8 Q${T-8} 0 ${T-13} 8 Z`,lunate:`M${T} 0 Q${T-7} -3 ${T-13} -10 Q${T-8} 0 ${T-13} 10 Q${T-7} 3 ${T} 0 Z`,
    point:`M${T} -1.6 Q${T-8} -1 ${T-14} 0 Q${T-8} 1 ${T} 1.6 Z`,fan:`M${T} 0 Q${T-10} -13 ${T-16} -6 Q${T-12} 0 ${T-16} 6 Q${T-10} 13 ${T} 0 Z`,
    round:`M${T} 0 Q${T-6} -8 ${T-11} -4 Q${T-12} 0 ${T-11} 4 Q${T-6} 8 ${T} 0 Z`,heter:`M${T} -1.4 Q${T-8} -2.4 ${T-17} -5 Q${T-11} 0 ${T-10} 1.8 Q${T-5} 1.8 ${T} 1.4 Z`,
    sword:`M${T} 0 L${T-12} -7 Q${T-7} -1 ${T-9} 3 L${T-22} 6 L${T-8} 5 Q${T-4} 3 ${T} 0 Z`};
  TL.veil=`M${T} 0 C${T-7} -3 ${T-14} -15 ${T-22} -11 Q${T-19} -5 ${T-22} 0 Q${T-19} 5 ${T-22} 11 C${T-14} 15 ${T-7} 3 ${T} 0Z`;
  TL.lyre=`M${T} 0 Q${T-6} -5 ${T-18} -12 Q${T-11} -2 ${T-12} 0 Q${T-11} 2 ${T-18} 12 Q${T-6} 5 ${T} 0Z`;
  TL.delta=`M${T} 0 Q${T-8} -5 ${T-18} -11 Q${T-23} 0 ${T-18} 11 Q${T-8} 5 ${T} 0Z`;
  TL.double=`M${T} 0 C${T-8} -11 ${T-18} -13 ${T-20} -7 Q${T-23} -1 ${T-12} 0 Q${T-23} 1 ${T-20} 7 C${T-18} 13 ${T-8} 11 ${T} 0Z`;
  const ts=Math.min(1,.45+H*.12), eyeX=L-Math.max(2.2,Math.min(H*.7,L*.28)), eyeR=Math.min(1.9,Math.max(.85,H*.2))*(ex.has('bigeye')?1.5:1);
  if(ex.has('spikes')) for(let i=0;i<12;i++){ const s=i%2?1:-1, x=f(-L*.5+i*L*.09); add('path',{d:`M${x} ${f(s*H*.6)} L${f(x-4)} ${s*(H+8+(i%3)*2)}`,stroke:p,strokeWidth:1.2,strokeLinecap:'round',opacity:.9}); }
  if(ex.has('whisk')) add('path',{d:`M${L-.5} -1.6 Q${L+5} -5 ${L+9} -8 M${L-.5} 1.6 Q${L+5} 5 ${L+9} 8 M${L-1.5} -2.5 Q${L+1} -6 ${L+2} -9 M${L-1.5} 2.5 Q${L+1} 6 ${L+2} 9`,stroke:c,strokeWidth:.9,fill:'none',strokeLinecap:'round'});
  if(o.barbels) add('path',{d:`M${L-1} -1 Q${L+2} -2 ${L+3} -3 M${L-1} 1 Q${L+2} 2 ${L+3} 3`,stroke:c,strokeWidth:.55,fill:'none',strokeLinecap:'round'});
  if(ex.has('horns')) add('path',{d:`M${f(L*.6)} ${f(-H*.55)} L${L+4} ${f(-H*.55-2)} M${f(L*.6)} ${f(H*.55)} L${L+4} ${f(H*.55+2)}`,stroke:c,strokeWidth:1.8,strokeLinecap:'round'});
  if(ex.has('snout')) add('ellipse',{cx:L+6,cy:0,rx:7.5,ry:f(Math.max(1.3,H*.24)),fill:c});
  if(ex.has('bill')) add('path',{d:`M${L-1} -1.5 L${L+15} 0 L${L-1} 1.5 Z`,fill:c});
  if(ex.has('duck')) add('ellipse',{cx:L+2.5,cy:0,rx:5,ry:f(H*.55),fill:c});
  if(ex.has('saw')){ add('path',{d:`M${L-2} -2 L${L+14} -1.5 L${L+14} 1.5 L${L-2} 2 Z`,fill:p}); for(let i=0;i<5;i++) add('path',{d:`M${f(L+2+i*2.6)} -1.5 l0 -2.4 M${f(L+2+i*2.6)} 1.5 l0 2.4`,stroke:p,strokeWidth:1}); }
  if(ex.has('wide')) add('ellipse',{cx:0,cy:0,rx:L+2,ry:H+3.5,fill:c,opacity:.5});
  if(ex.has('feelers')) [-1,1].forEach(s=>add('path',{d:`M${f(L*.15)} ${f(s*H*.7)} Q${f(-L*.3)} ${s*(H+3)} ${f(-L*1.1)} ${s*(H+5)}`,stroke:p,strokeWidth:.9,fill:'none',strokeLinecap:'round',opacity:.9}));
  if(TL[tl]) o2.push(h('g',{transform:`translate(${T} 0) scale(${f(ts)}) translate(${-T} 0)`},
    detailed?h('g',{style:wagS(w? w*(o.tempo||1):0)},
      h('path',{d:TL[tl],fill:silhouette?c:`url(#${id}-fin)`,stroke:c,strokeWidth:.5,opacity:.92}),
      h('g',{clipPath:`url(#${id}-tail)`,opacity:silhouette?0:.46},[-3,-2,-1,0,1,2,3].map(n=>h('path',{d:`M${T} 0 Q${T-7} ${n} ${T-26} ${n*4.5}`,fill:'none',stroke:pearl,strokeWidth:.45})))):
    h('path',{d:TL[tl],fill:c,opacity:.85,style:wagS(w)})));
  if(ex.has('shark')) [-1,1].forEach(s=>add('path',{d:`M${f(L*.35)} ${f(s*H*.7)} Q${f(L*.05)} ${s*(H+5)} ${f(-L*.12)} ${s*(H+8)} Q${f(L*.1)} ${s*(H+2)} ${f(L*.05)} ${f(s*H*.7)} Z`,fill:c,opacity:.9}));
  else if(detailed) [-1,1].forEach(s=>{
    const x=f(L*.24), y=f(s*H*.7), reach=o.fins||5;
    o2.push(h('g',{style:finMotion(s)},h('path',{d:`M${x+2} ${y} Q${x-1} ${s*(H+reach+1)} ${x-7} ${s*(H+reach)} Q${x-6} ${s*(H+1)} ${x-3} ${y}Z`,fill:silhouette?c:`url(#${id}-fin)`,stroke:c,strokeWidth:.35,opacity:.8}),
      silhouette?'':h('path',{d:`M${x} ${y} L${x-5} ${s*(H+reach-1)}`,stroke:pearl,strokeWidth:.45,opacity:.5})));
  });
  else if(!ex.has('wide')) [-1,1].forEach(s=>{ add('ellipse',{cx:f(L*.3),cy:s*(H+1),rx:f(4.5*ts),ry:f(1.8*ts),transform:`rotate(${s*30} ${f(L*.3)} ${s*(H+1)})`,fill:c,opacity:.7});
    if(tl!=='point') add('ellipse',{cx:f(-L*.28),cy:f(s*H*.85),rx:f(2.6*ts),ry:f(ts),transform:`rotate(${s*28} ${f(-L*.28)} ${f(s*H*.85)})`,fill:c,opacity:.6}); });
  add('path',{d,fill:detailed&&!silhouette?`url(#${id}-body)`:c,stroke:detailed?c:null,strokeWidth:detailed?.35:null});
  const pat=[];
  const P=(tag,a)=>pat.push(h(tag,{fill:p,...a}));
  if(pt==='stripes') [-.5,-.1,.3].forEach(q=>P('rect',{x:f(q*L-1.5),y:-H,width:3,height:H*2}));
  if(pt==='bars') [-.7,-.4,-.1,.2,.5].forEach(q=>P('rect',{x:f(q*L-.8),y:-H,width:1.6,height:H*2,opacity:.85}));
  if(pt==='spots') [[-.5,-.3],[-.2,.35],[.1,-.4],[.35,.2],[-.65,.1],[0,0]].forEach(([x,y])=>P('circle',{cx:f(x*L),cy:f(y*H),r:f(Math.max(1,H*.18))}));
  if(pt==='dots') for(let i=0;i<16;i++) P('circle',{cx:f((R()*1.7-.95)*L),cy:f((R()*1.6-.8)*H),r:f(Math.max(.5,H*.09)),opacity:.9});
  if(pt==='marble') for(let i=0;i<6;i++){ const x=f((R()*1.6-.9)*L), y=f((R()*1.4-.7)*H); P('ellipse',{cx:x,cy:y,rx:f(L*(.12+R()*.12)),ry:f(H*(.2+R()*.2)),transform:`rotate(${(R()*180).toFixed(0)} ${x} ${y})`,opacity:.85}); }
  if(pt==='band') P('rect',{x:-L,y:f(-H*.24),width:f(L*1.7),height:f(H*.48)});
  if(pt==='lines') [-1,1].forEach(s=>P('rect',{x:-L,y:f(s*H*.38-.45),width:f(L*1.75),height:.9}));
  if(pt==='saddle') P('ellipse',{cx:f(-L*.1),cy:0,rx:f(L*.35),ry:f(H*.7),opacity:.85});
  if(pt==='back') P('ellipse',{cx:0,cy:0,rx:f(L*.6),ry:f(H*.5),opacity:.55});
  if(pt==='tip') P('rect',{x:-L,y:-H,width:f(L*.5),height:H*2});
  if(pt==='head') P('rect',{x:f(L*.45),y:-H,width:L,height:H*2});
  if(pt==='ocellus'){ P('circle',{cx:f(-L*.62),cy:0,r:f(H*.42)}); pat.push(h('circle',{cx:f(-L*.62),cy:0,r:f(H*.2),fill:'#1f2e2c',opacity:.8})); }
  if(pt==='kohaku') P('path',{d:`M${f(-L*.8)} ${f(-H*.15)} Q${f(-L*.6)} ${-H} ${f(-L*.35)} ${f(-H*.7)} C0 ${f(-H*.5)} ${f(-L*.25)} ${f(H*.2)} ${f(-L*.6)} ${f(H*.4)} Q${f(-L*.8)} ${f(H*.2)} ${f(-L*.8)} ${f(-H*.15)}Z M${f(-L*.15)} ${f(H*.25)} Q${f(L*.1)} ${f(-H*.35)} ${f(L*.3)} ${f(H*.1)} Q${f(L*.4)} ${H} ${f(L*.1)} ${H} Q${f(-L*.1)} ${f(H*.9)} ${f(-L*.15)} ${f(H*.25)}Z M${f(L*.55)} ${f(-H*.8)} Q${f(L*.85)} ${f(-H*.65)} ${f(L*.78)} ${f(H*.2)} Q${f(L*.45)} ${f(H*.4)} ${f(L*.55)} ${f(-H*.8)}Z`});
  if(pt==='pearls') for(let row=-1;row<=1;row++) for(let j=0;j<5;j++) P('ellipse',{cx:f((-0.65+j*.27+(row===0?.1:0))*L),cy:f(row*H*.48),rx:f(H*.17),ry:f(H*.15),opacity:.75});
  if(pt==='chevron') [-.6,-.2,.2].forEach(q=>P('path',{d:`M${f(q*L-2)} ${-H} L${f(q*L+2)} 0 L${f(q*L-2)} ${H}`,fill:'none',stroke:p,strokeWidth:1.2,opacity:.85}));
  pat.push(h('ellipse',{cx:f(-L*.05),cy:0,rx:f(L*.85),ry:f(H*.22),fill:'#0b2226',opacity:.12}),h('ellipse',{cx:f(L*.15),cy:f(-H*.45),rx:f(L*.55),ry:f(H*.22),fill:'#ffffff',opacity:.16}));
  o2.push(h('g',{clipPath:`url(#${id})`},pat));
  if(ex.has('sail')) add('ellipse',{cx:f(-L*.15),cy:0,rx:f(L*.7),ry:f(H*.42),fill:p,opacity:.55});
  else if(!ex.has('wide')) add('ellipse',{cx:f(-L*.15),cy:0,rx:f(L*.45),ry:f(Math.max(.6,H*.1)),fill:p,opacity:.45});
  if(ex.has('hump')) add('circle',{cx:f(L*.62),cy:0,r:f(H*.6),fill:p,opacity:.9});
  if(ex.has('hammer')){ add('ellipse',{cx:f(L*.95),cy:0,rx:2.4,ry:f(H*2.3),fill:c}); [-1,1].forEach(s=>add('circle',{cx:f(L*.95),cy:f(s*H*2.1),r:1.1,fill:'#1f2e2c'})); }
  else [-1,1].forEach(s=>{ add('circle',{cx:f(eyeX),cy:f(s*H*.52),r:f(eyeR),fill:'#1f2e2c'}); add('circle',{cx:f(eyeX+eyeR*.3),cy:f(s*H*.52-eyeR*.3),r:f(eyeR*.35),fill:'#ffffff',opacity:.8}); });
  if(ex.has('lure')){ add('path',{d:`M${f(L*.6)} 0 Q${L+6} -8 ${L+9} -3`,stroke:p,strokeWidth:.9,fill:'none'}); add('circle',{cx:L+9,cy:-3,r:3.2,fill:'#f7f3c0',opacity:.35}); add('circle',{cx:L+9,cy:-3,r:1.6,fill:'#f7f3c0'}); }
  if(detailed&&!silhouette){
    [-1,1].forEach(s=>add('path',{d:`M${f(L*.55)} ${f(s*H*.24)} Q${f(L*.38)} ${f(s*H*.52)} ${f(L*.48)} ${f(s*H*.78)}`,fill:'none',stroke:ink,strokeWidth:.5,opacity:.32}));
    add('path',{d:`M${f(-L*.6)} ${f(-H*.26)} Q0 ${f(-H*.65)} ${f(L*.48)} ${f(-H*.28)}`,fill:'none',stroke:pearl,strokeWidth:.7,opacity:.4});
  }
  // A locked fish stays a single silhouette, including its eyes and markings.
  const body=silhouette&&detailed?o2.join('').replace(/(fill|stroke)="(?!none)[^"]*"/g,`$1="${c}"`):o2;
  return [h('defs',null,h('clipPath',{id},h('path',{d})),detailed?[
    h('clipPath',{id:id+'-tail'},h('path',{d:TL[tl]||''})),
    h('linearGradient',{id:id+'-body',x1:'0%',y1:'0%',x2:'0%',y2:'100%'},h('stop',{offset:'0%',stopColor:pearl}),h('stop',{offset:'24%',stopColor:c}),h('stop',{offset:'72%',stopColor:c}),h('stop',{offset:'100%',stopColor:ink})),
    h('linearGradient',{id:id+'-fin',x1:'0%',y1:'0%',x2:'100%',y2:'0%'},h('stop',{offset:'0%',stopColor:p,stopOpacity:.65}),h('stop',{offset:'65%',stopColor:c,stopOpacity:.85}),h('stop',{offset:'100%',stopColor:c}))]:null),body];
};

/* ── the catalog ──
   The first twelve are hand-drawn. Six of them are what classes adopt; the
   other six are milestones you earn by habit (their `goal`). The rest are
   generated from a body family plus colours, pattern and features, and each
   has an unlock goal of its own — but any of them can also simply turn up
   when you finish a task. */
const SPEC=[
  {k:'koi',name:'Koi',rar:'Common',c:'#7fc79a',p:'#fbf8f2',s:1.25,base:true},
  {k:'goldfish',name:'Goldfish',rar:'Common',c:'#f0b35a',p:'#fde3c0',s:1.2,base:true},
  {k:'clown',name:'Clownfish',rar:'Common',c:'#aab4f2',p:'#fbf8f2',s:1.15,base:true},
  {k:'guppy',name:'Guppy',rar:'Common',c:'#ef8f86',p:'#f7c1bb',s:1.2,base:true},
  {k:'betta',name:'Betta',rar:'Uncommon',c:'#d68fcf',p:'#f3c9ef',s:1.15,base:true},
  {k:'puffer',name:'Pufferfish',rar:'Uncommon',c:'#f3e2a0',p:'#fbf8f2',s:1.05,base:true},
  {k:'catfish',name:'Catfish',rar:'Rare',c:'#c9b48f',p:'#a8966f',s:1.2,goal:{m:'focusH',n:3,t:'Log 3 hours of focus in total'}},
  {k:'axolotl',name:'Axolotl',rar:'Uncommon',c:'#f7c1d4',p:'#ef8fb3',s:1.2,milestone:true,goal:{m:'jdays',n:5,t:'Write in your journal on 5 different days'}},
  {k:'ray',name:'Stingray',rar:'Rare',c:'#9fc2bb',p:'#e7f0ec',s:1.4,milestone:true,goal:{m:'tasks',n:100,t:'Finish 100 tasks in total'}},
  {k:'frog',name:'Pond Frog',rar:'Rare',c:'#8fcf7a',p:'#d9f0c4',s:1.25,milestone:true,goal:{m:'bloomRun',n:3,t:'Bring the lotus to full bloom 3 days in a row'}},
  {k:'turtle',name:'Turtle',rar:'Legendary',c:'#7fae8a',p:'#c9dcb8',s:1.25,milestone:true,goal:{m:'streak',n:30,t:'Keep a 30-day focus or writing streak'}},
  {k:'ghost',name:'Ghost Koi',rar:'Legendary',c:'#f4f7f5',p:'#dfe9ff',s:1.3,milestone:true,goal:{m:'reeds',n:1,t:'Clear everything that’s in the reeds'}},
];
const NEW=[
  ['Neon Tetra','Common',7,2.6,'fork','band',null,'#6fb6e8','#ef6a5e'],['Zebra Danio','Common',8,2.4,'fork','bars',null,'#e9e3c8','#5a74a8'],
  ['Platy','Common',7,3.6,'round','tip',null,'#f29a4f','#2e3a44'],['Molly','Common',8,3.8,'fan',null,null,'#3a4048','#6d7680'],
  ['Swordtail','Common',8,3,'point','band',null,'#f07c4a','#f7c7a6'],['Cherry Barb','Common',7,3.2,'fork','band',null,'#e35a5a','#8a2f36'],
  ['Harlequin Rasbora','Common',7,3,'fork','tip',null,'#f3a68a','#3b3f55'],['White Cloud Minnow','Common',6.5,2.2,'fork','band',null,'#b9c7a8','#f09a6a'],
  ['Bluegill','Common',10,6,'round','bars','eyes','#7fa0b8','#4d6b83'],['Pumpkinseed','Common',10,6,'round','spots','eyes','#e9b36a','#5ea3b8'],
  ['Yellow Perch','Common',12,4,'fork','bars',null,'#e6c95a','#5b6a3a'],['Rainbow Trout','Common',15,4,'fork','band',null,'#a9b7a4','#e9868d'],
  ['Brook Trout','Common',14,4.2,'fork','spots',null,'#7c8d63','#f2d27a'],['Common Shiner','Common',9,2.8,'fork','back',null,'#d8dfe0','#9fb3b8'],
  ['Killifish','Common',7,2.6,'round','spots',null,'#6c8fd8','#f07c4a'],['Damselfish','Common',8,4.2,'fork',null,null,'#4a6fe0','#9fb6ff'],
  ['Sergeant Major','Common',9,5,'fork','stripes',null,'#e8dc84','#2e3a44'],['Goby','Common',8,2.4,'round','spots','eyes','#c7b690','#7a6a4f'],
  ['Blenny','Common',9,2.4,'round','saddle','eyes','#a8b88a','#5f7050'],['Mosquitofish','Common',6,2.2,'round',null,null,'#b7b3a0','#8a8674'],
  ['Angelfish','Uncommon',7,6.5,'fan','stripes',null,'#eae4d4','#3a3d44'],['Discus','Uncommon',9,8,'round','bars',null,'#e0784a','#5fb2c8'],
  ['Oscar','Uncommon',11,6,'round','saddle',null,'#4a4a42','#ec7a45'],['Dwarf Gourami','Uncommon',8,4.5,'round','bars',null,'#e3643f','#6fa8e0'],
  ['Kuhli Loach','Uncommon',14,2,'round','bars','whisk','#e7a34f','#3b3228'],['Bristlenose Pleco','Uncommon',11,4.4,'lunate','spots','whisk','#6b6552','#c9c09a'],
  ['Rainbowfish','Uncommon',9,4,'fork','tip',null,'#6f9ee0','#f5b05a'],['Hatchetfish','Uncommon',7,3.8,'fork','band',null,'#d6dde0','#8a9aa2'],
  ['Blue Tang','Uncommon',10,5.5,'lunate','saddle',null,'#3f6fd8','#f2d24a'],['Cleaner Wrasse','Uncommon',8,2.4,'round','band',null,'#8fc3ec','#1f2e44'],
  ['Butterflyfish','Uncommon',8,6.5,'round','stripes',null,'#f2d44e','#fbf8f2'],['Mandarinfish','Uncommon',7,4,'fan','spots','eyes','#3f86c8','#f09a3e'],
  ['Largemouth Bass','Uncommon',15,5,'fork','band',null,'#8a9a5a','#3f4a2c'],['Clown Loach','Uncommon',10,3.6,'fork','stripes','whisk','#f09a3e','#2a2a2a'],
  ['Tiger Barb','Uncommon',7,4,'fork','stripes',null,'#f2c16a','#2e2e2e'],
  ['Lionfish','Rare',10,5,'fan','bars','spikes','#e9d6c6','#b8452f'],['Silver Arowana','Rare',19,3.8,'round','back','eyes','#d3dbd8','#9fb8b3'],
  ['Bichir','Rare',17,3,'round','spots','eyes','#7a8060','#3f4630'],['Moray Eel','Rare',22,3,'point','spots','eyes','#7e9a4a','#e7e0a0'],
  ['Knifefish','Rare',17,3,'point','band',null,'#3a3833','#d6d0c0'],['Flounder','Rare',12,7,null,'spots','wide','#b7a683','#8a7a58'],
  ['Paddlefish','Rare',15,4,'fork',null,'snout','#8a9aa3','#c8d3d7'],['Triggerfish','Rare',10,6,'lunate','spots','eyes','#3a3f48','#f2e2a0'],
  ['Parrotfish','Rare',13,5.5,'lunate','saddle',null,'#4fc0a8','#f08fb8'],['Mudskipper','Rare',11,3,'round','spots','eyes','#8a7d62','#c8e0f0'],
  ['Sturgeon','Legendary',20,4,'fork','spots','whisk','#8a9098','#e0e4e6'],['Sawfish','Legendary',17,4.6,'fork',null,'saw','#9a8f78','#e6dcc4'],
  ['Oarfish','Legendary',24,2,'point','bars',null,'#d9dfe6','#e0584a'],['Coelacanth','Legendary',15,5.5,'fan','spots','eyes','#3e5a7a','#e6eef4'],
  ['Opah','Legendary',11,7.5,'lunate','spots','eyes','#d6625a','#fbf8f2'],
];
const FAM={tetra:{L:8,H:2.8,tl:'fork',b:.7},minnow:{L:9,H:2.9,tl:'fork',b:.65},live:{L:7.5,H:3.2,tl:'fan'},lab:{L:8.5,H:4.2,tl:'round',b:.8},
  cichlid:{L:11,H:5.5,tl:'round',b:.9,pk:.2},disc:{L:8.5,H:7.5,tl:'round',b:1,pk:.05,ped:.22},cat:{L:11,H:4.2,tl:'fork',b:1,pk:.3,ex:'whisk'},
  loach:{L:13,H:2.2,tl:'round',b:.8,ped:.6,ex:'whisk'},salmon:{L:15,H:3.8,tl:'fork',b:.6},perch:{L:12,H:4.4,tl:'fork',b:.7},pike:{L:17,H:2.8,tl:'fork',b:.5,ped:.45},
  carp:{L:14,H:5.5,tl:'fork',b:.8,ex:'whisk'},reef:{L:9,H:6.2,tl:'round',b:.8,pk:.1},wrasse:{L:10,H:2.8,tl:'round',b:.6},box:{L:8,H:6,tl:'round',b:1,pk:0,ped:.25},
  grouper:{L:14,H:6,tl:'round',b:.85,pk:.2},pelagic:{L:16,H:4,tl:'lunate',b:.6,ped:.2},shark:{L:17,H:4,tl:'heter',b:.5,ped:.3,ex:'shark'},
  flat:{L:12,H:7,tl:null,b:1,pk:0,ped:.5,ex:'wide'},eel:{L:22,H:2.4,tl:'point',b:.5,ped:.55}};
const MORE=[
  ['tetra','Cardinal Tetra,e2463f,4fb3ef,band,C;Rummy-nose Tetra,d9dcd4,d8413a,head,C;Black Skirt Tetra,6b6f73,2a2c30,tip,C;Ember Tetra,f07a3e,f7b27a,back,C;Glowlight Tetra,e7dccb,f28a3c,band,C;Congo Tetra,b9c7d8,f2b25a,band,U;Serpae Tetra,d9523f,2b2b2b,tip,C;Lemon Tetra,f2e27a,e8a33a,tip,C;Bleeding Heart Tetra,e8c6c0,d4404a,saddle,U;Penguin Tetra,d8d6c8,2a2c30,band,C;Diamond Tetra,cfd6de,f3f0e6,dots,U;X-ray Tetra,e6e2c0,3a3a3a,bars,C;Head-and-tail-light Tetra,d9d4b8,f2a04a,head,C;Emperor Tetra,8a8f9a,2e2f36,band,U'],
  ['minnow','Celestial Pearl Danio,3f5a86,f2a45a,dots,U;Leopard Danio,e3d9b0,3f4652,spots,C;Giant Danio,9fbfd0,f0d07a,lines,C;Chili Rasbora,e3452f,2a2323,band,C;Scissortail Rasbora,d9dbd2,2b2e33,tip,C;Lambchop Rasbora,f0a07a,2d2a2f,tip,C;Rosy Barb,f07a6a,2e2e2e,tip,C;Gold Barb,efc54a,6b4f1f,spots,C;Denison Barb,e3dcc9,e04a3a,band,U;Fathead Minnow,8a8a6a,5c5a42,back,C;Golden Shiner,e9c86a,b88f3a,back,C;Red Shiner,7f9ac2,e06a5a,tip,C;Tench,6f8a4a,3f5530,back,U'],
  ['live','Endler\'s Livebearer,6fbf7a,f08a3a,marble,C;Balloon Molly,e9e2d0,f0b07a,back,C;Dalmatian Molly,efeae0,2a2a2a,dots,C;Sailfin Molly,a8b8a0,f2c24a,none,U,sail;Green Swordtail,8fbf8a,e0543f,band,C,sword;Four-eyed Fish,c9c8b0,5f6a55,lines,R,bigeye;Halfbeak,cfd3c8,6a6f60,band,U,snout'],
  ['lab','Blue Gularis,4f7fc8,e05a3a,dots,U;Golden Wonder Killifish,f0c24a,f6e3a0,back,C;Clown Killifish,e8dcc0,2a2a2a,bars,C;Boesemani Rainbowfish,5f78b8,f29a3a,tip,U,fork;Red Rainbowfish,d9453a,f07a6a,back,U,fork;Pearl Gourami,b8a890,f3efe2,dots,U,feelers;Honey Gourami,f2b14a,f7d9a0,back,C,feelers;Moonlight Gourami,d8dde0,f3f5f4,back,C,feelers;Kissing Gourami,f2c8b8,fbe3d9,none,C;Paradise Fish,d9563f,4a6fb8,bars,U,feelers+fork'],
  ['betta','Halfmoon Betta,4f7ae0,a8c4ff,-,U;Crowntail Betta,d9363f,f28a8a,-,U;Koi Betta,f3efe6,ec7a45,-,R;Plakat Betta,3fae9a,a8e0d0,-,U;Dragon Scale Betta,c9d4e6,8a2f36,-,R'],
  ['cichlid','Convict Cichlid,d9d8d0,2a2c30,stripes,C;Firemouth Cichlid,7f8f9a,e0503a,head,C;Jack Dempsey,4a4a52,5fb8c8,dots,U;Electric Blue Acara,3f6fc8,8fb8f0,dots,U;German Blue Ram,f2d27a,5f8fd8,marble,U;Kribensis,c9b8a0,e06a8a,band,C;Electric Yellow Cichlid,f2de4a,2a2a2a,tip,C;Red Zebra Cichlid,f08a4a,f6c09a,bars,C;Frontosa,e6e2d6,2e3a5a,stripes,R;Flowerhorn,e0503f,f2c24a,head,R,hump;Severum,c8a86a,8a6a3a,bars,U;Peacock Cichlid,4f78c8,f2a03a,head,U;Apistogramma,f2c86a,e05a3a,band,U'],
  ['disc','Altum Angelfish,e6e0d0,4a4a4a,stripes,R;Marble Angelfish,efe8d8,2d2d2d,marble,U;Red Discus,d9453a,f07a4a,bars,R;Blue Diamond Discus,5f8fd8,a8c8f0,back,R;Red-bellied Piranha,8a929a,e0503a,dots,U,fork'],
  ['cat','Bronze Corydoras,a8906a,5f7f6a,back,C;Panda Corydoras,efeae0,2a2a2a,saddle,C;Otocinclus,c9b890,5a5040,band,C;Zebra Pleco,efeee8,2a2a2e,stripes,R,lunate;Gold Nugget Pleco,3a3a3a,f2c24a,dots,U,lunate;Royal Pleco,7a7d6a,3f4a3a,lines,U,lunate;Upside-down Catfish,c8b89a,6a5a42,spots,C;Glass Catfish,e6ece8,c8d0cc,none,U;Channel Catfish,9aa4a8,4a5256,spots,C;Pictus Catfish,e6e6e0,2a2a2e,spots,C;Bumblebee Catfish,e8c05a,3a3228,saddle,C'],
  ['loach','Yoyo Loach,d8d4c8,3a3a3a,marble,C;Dojo Loach,b8a07a,6a5a42,dots,C;Hillstream Loach,a89a7a,4a4436,spots,U,wide;Zebra Loach,e8dcc0,5a6a4a,bars,C;Horseface Loach,d6c8a8,6a5a3a,band,U'],
  ['salmon','Atlantic Salmon,b8c4c8,3a4450,spots,C;Sockeye Salmon,d9453a,6a8a5a,head,U;Chinook Salmon,8a9aa8,3a4450,dots,U;Arctic Char,7a8a7a,f2a07a,spots,U;Brown Trout,b8986a,3a2a22,spots,C;Cutthroat Trout,a8a88a,e0503a,head,C;Lake Trout,6a7a78,d8dcd4,dots,C;Grayling,9aa0a8,4a5060,dots,U,sail;Steelhead,a8b4b8,e08a8a,band,C'],
  ['perch','Smallmouth Bass,a8986a,5a4a32,bars,C;Striped Bass,d8dcd8,4a5058,lines,C;Walleye,b8a86a,6a5a3a,marble,C,bigeye;Crappie,c8ccb8,4a5040,spots,C;Green Sunfish,6a8a6a,f2c24a,dots,C;Longear Sunfish,e0703a,5fb8c8,marble,U;Rock Bass,8a7a5a,3a3228,dots,C;European Perch,a8b06a,3a4a2a,bars,C;Zander,a8aca0,5a605a,bars,U'],
  ['pike','Northern Pike,6f8a5a,d8d8a0,spots,U,duck;Muskellunge,9a9a7a,5a5a42,bars,R,duck;Longnose Gar,a8a88a,5a5a42,spots,U,snout;Alligator Gar,7a7a62,4a4a3a,spots,R,duck;Needlefish,cfd8d8,6fb8c8,band,U,bill;Bowfin,6f7a5a,3f4a32,ocellus,U'],
  ['carp','Common Carp,b89a5a,8a6a3a,dots,C;Mirror Carp,a8905a,d8c08a,spots,C;Grass Carp,9aa08a,5a6048,back,C'],
  ['reef','Yellow Tang,f2dc3a,f7ec9a,none,U,lunate;Powder Blue Tang,6fb8e8,f2e04a,back,U,lunate;Achilles Tang,2e2f36,f07a3a,ocellus,R,lunate;Naso Tang,8a8f9a,f2a03a,head,U,lunate;Moorish Idol,f2e6a0,2a2a2a,stripes,R;Copperband Butterflyfish,efeae0,e0843a,stripes,U,snout;Emperor Angelfish,3f5fb8,f2d24a,lines,R;Flame Angelfish,e8453a,2a2a4a,bars,U;Queen Angelfish,5fa8d8,f2d23a,tip,R;Regal Angelfish,f2b83a,4a6fb8,stripes,R;Royal Gramma,8a4fb8,f2d23a,tip,C;Banggai Cardinalfish,e6e2d6,2a2a2a,stripes,U,fork;Blue Chromis,4f9fe8,8fc8f5,back,C,fork;Domino Damsel,2a2c30,f3f0e6,spots,C;Three-stripe Damsel,efeae0,2a2a2a,stripes,C'],
  ['wrasse','Six-line Wrasse,5a5fb8,f2a03a,lines,U;Fairy Wrasse,e05a8a,f2d23a,tip,U;Bird Wrasse,4fb89a,2a5a6a,head,U,snout;Humphead Wrasse,4f9a8a,8fd0c0,marble,R,hump;Firefish Goby,efe6d8,e0503a,tip,C;Yellow Watchman Goby,f2d24a,6fb8e8,dots,C,bigeye;Lawnmower Blenny,a8a07a,5a5a42,bars,C,bigeye;Yellowhead Jawfish,e8ecec,f2d23a,head,U,bigeye'],
  ['clown','Percula Clownfish,f07a2a,fbf8f2,-,C;Maroon Clownfish,8a2f36,f2e0a0,-,U;Tomato Clownfish,e0453a,fbf8f2,-,C;Skunk Clownfish,f2b88a,fbf8f2,-,C;Black Ocellaris,2a2a2e,fbf8f2,-,U'],
  ['puffer','Dwarf Puffer,c8b87a,efe6c8,-,U;Porcupinefish,d8c8a0,fbf8f2,-,U;Figure-eight Puffer,4a5a3a,f2e08a,-,U;Mbu Puffer,b8a06a,e6d8b0,-,R'],
  ['box','Boxfish,f2d23a,2a2a2a,dots,U;Cowfish,f2c24a,6fb8c8,spots,R,horns'],
  ['grouper','Red Snapper,e0604a,f29a8a,back,C,fork;Yellowtail Snapper,a8b8c8,f2d23a,band,C,fork;Nassau Grouper,c8b89a,6a5a42,bars,U;Coral Grouper,e0453a,6fb8f0,dots,R;Goliath Grouper,8a8a6a,4a4a3a,marble,L;Hogfish,f2c8b0,e07a5a,head,U,snout;Squirrelfish,e0503a,f7c8b0,lines,C,fork+bigeye;Sweetlips,f2e6c0,2a2a2a,spots,U'],
  ['pelagic','Atlantic Mackerel,6a9aa8,2a3a4a,bars,C,fork;Bluefin Tuna,2f4f7a,c8d4e0,back,R;Mahi-mahi,5fb87a,f2d23a,dots,U,hump;Barracuda,b8c4c8,4a5460,bars,U,fork;Swordfish,4a5a6a,a8b4c0,back,L,bill;Sailfish,3f5f8a,8fb8e0,dots,L,bill+sail;Marlin,2f4a6a,8fb8e0,stripes,L,bill'],
  ['shark','Bamboo Shark,c8b89a,6a5a42,bars,R;Whitetip Reef Shark,8a9098,f3f5f4,tip,R;Leopard Shark,b8a888,3a3a3a,spots,R;Hammerhead Shark,8a98a0,c8d0d4,back,L,hammer;Whale Shark,4a5a6a,e6ecec,dots,L'],
  ['ray','Blue-spotted Ray,c8b070,5fa8e8,-,R;Manta Ray,2a2e36,e6ecec,-,L;Eagle Ray,4a4f5a,efeae0,-,R;Polka Dot Stingray,2e2e2e,f3f0e6,-,R;Electric Ray,a8906a,5a4a36,-,R'],
  ['flat','Plaice,a8986a,e0703a,spots,C;Halibut,6a6a5a,4a4a3a,marble,U;Peacock Flounder,b8a888,6fb8e8,dots,R'],
  ['eel','Ribbon Eel,3f6fc8,f2d23a,head,R;Snowflake Moray,efeae0,3a3a2a,marble,U;Zebra Moray,3a2e2a,efeae0,bars,R;Garden Eel,e6e2d6,6a6a5a,dots,C;Fire Eel,3a3a3a,e0503a,lines,U'],
  ['odd','Anglerfish,5a4a42,f2e08a,marble,L,lure,10,6,round,1;Viperfish,2a3a4a,8fd8e8,dots,R,bigeye,14,3,point,.5;Lanternfish,3a4a5a,8ff0e0,dots,U,bigeye,8,2.6,fork,.8;Frilled Shark,6a5a5a,a89090,none,L,shark,22,2.6,heter,.6;Goblin Shark,e8b8b0,d89088,none,L,shark+snout,17,3.6,heter,.5;Ocean Sunfish,b8c0c8,8a949c,back,L,none,10,9,round,1;Arapaima,6a7a5a,d9453a,tip,L,none,20,4.5,round,.6;Stonefish,8a7a62,c8a88a,marble,R,spikes,9,5.5,round,1;Frogfish,f2c24a,e0843a,marble,R,none,8,6,round,1;Elephantnose Fish,4a4448,8a8488,back,U,snout,11,3,fork,.6;Lungfish,7a6a52,4a4032,spots,R,none,18,3.2,point,.6'],
];
const RMAP={C:'Common',U:'Uncommon',R:'Rare',L:'Legendary'}, BASE={betta:1.15,clown:1.15,puffer:1.05,ray:1.3};
const ALL=NEW.map(a=>({name:a[0],rar:a[1],c:a[7],p:a[8],draw:gen({name:a[0],L:a[2],H:a[3],tl:a[4],pt:a[5],ex:new Set(a[6]?[a[6]]:[])}),s:+Math.min(1.35,1.5-a[2]*.022).toFixed(2)}));
MORE.forEach(([fam,str])=>str.split(';').forEach(row=>{ const [name,c,p,pt,r,ex,L,H,tl,b]=row.split(',');
  if(BASE[fam]) return ALL.push({name,rar:RMAP[r],c:'#'+c,p:'#'+p,draw:DRAW[fam],s:BASE[fam]});
  const F=fam==='odd'?{L:+L,H:+H,tl,b:+b}:FAM[fam], exs=new Set([...(F.ex?[F.ex]:[]),...(ex&&ex!=='none'?ex.split('+'):[])]);
  ALL.push({name,rar:RMAP[r],c:'#'+c,p:'#'+p,draw:gen({...F,name,pt,ex:exs}),s:+Math.min(F.H>7?1.1:1.35,1.5-F.L*.022).toFixed(2)}); }));
/* Unlock goals for the generated species. The seventh pattern was "clear
   the reeds N times" in the design; the app has no record of past reed
   clearings, so it counts overdue tasks you rescued instead. */
const RQ=[['tasks','Finish {n} tasks in total'],['focusH','Log {n} hours of focus'],['jdays','Write in your journal on {n} different days'],
  ['fstreak','Keep a {n}-day focus streak'],['blooms','Bring the lotus to full bloom {n} times'],['noon','Finish {n} tasks before noon'],['late','Rescue {n} tasks from the reeds']];
const RB={Common:12,Uncommon:30,Rare:70,Legendary:180};
ALL.forEach((a,i)=>{ const k='x'+i, ty=i%RQ.length, nn=Math.round(RB[a.rar]*(1+(i*7%5)*.25)/(ty===3?3:1));
  DRAW[k]=a.draw; SPEC.push({k,name:a.name,rar:a.rar,c:a.c,p:a.p,s:a.s,goal:{m:RQ[ty][0],n:nn,t:RQ[ty][1].replace('{n}',nn)}}); });
/* The original five now use the same tapered anatomy as the field guide.
   Stable keys and ordering preserve class assignments and saved discoveries. */
const FIRST_FIVE=[
  ['koi',18,6,'fork','kohaku','#f4ead5','#d9694e',{b:.82,barbels:true,fins:5}],
  ['goldfish',11,7,'double','back','#eaaa4f','#ffe0a0',{b:1,pk:.28,fins:6,tempo:1.3}],
  ['clown',12,5.8,'round','stripes','#ed9562','#fff2d8',{b:.9,fins:4}],
  ['guppy',9,3.5,'delta','ocellus','#71aaa2','#e8aa77',{b:.7,fins:3,tempo:.85}],
  ['betta',12,4.5,'veil','marble','#617fa7','#d3b1d3',{b:.8,fins:10,tempo:1.6}]
];
FIRST_FIVE.forEach(([k,L,H,tl,pt,c,p,detail])=>{
  DRAW[k]=gen({name:k,L,H,tl,pt,...detail,detailed:true,ex:new Set(detail.ex?[detail.ex]:[])});
  Object.assign(SPEC.find(s=>s.k===k),{c,p});
});
/* Catalog 6–15: tailored silhouettes for the pond's small companions. */
const REFINED_FISH_6_15=[
  ['puffer',10,9,'round','spots','#c5b276','#fff0c6',{b:1,pk:.15,fins:3,tempo:1.3}],
  ['catfish',19,5.8,'fork','back','#869d95','#cbd6b4',{b:.95,pk:.4,fins:6,ex:'whisk'}],
  ['ghost',18,5.7,'veil','kohaku','#e0e9e6','#b8c9e3',{b:.8,barbels:true,fins:6,tempo:1.7}],
  ['x0',9,3.2,'fork','band','#77b6c8','#d96d73',{b:.7,fins:3}],
  ['x1',10,3.3,'fork','lines','#dbcf9e','#617b9d',{b:.65,fins:3}],
  ['x2',9,4.8,'fan','tip','#e6ab71','#637777',{b:.9,fins:4}]
];
REFINED_FISH_6_15.forEach(([k,L,H,tl,pt,c,p,detail])=>{
  DRAW[k]=gen({name:k,L,H,tl,pt,...detail,detailed:true,ex:new Set(detail.ex?[detail.ex]:[])});
  Object.assign(SPEC.find(s=>s.k===k),{c,p});
});
// Shared paint treatment; each amphibian/reptile keeps its own anatomy.
function companion(kind,c,p,w){
  const id='pfc'+cpN++, flat=c===p, shade=flat?c:'#264d49', light=flat?c:'#fff4dc';
  const fill=flat?c:`url(#${id}-skin)`;
  const path=(d,color=fill,attrs={})=>h('path',{d,fill:color,...attrs});
  const eye=(x,y,r=1.1)=>h('circle',{cx:x,cy:y,r:r+0.55,fill:p})+h('circle',{cx:x+.15,cy:y,r,fill:flat?c:'#183c3e'})+(flat?'':h('circle',{cx:x+.45,cy:y-.35,r:.35,fill:light}));
  const motion=(n,origin='center')=>PF.motion&&w?{transformBox:'fill-box',transformOrigin:origin,animation:`pf-${n} ${w*3}s ease-in-out infinite alternate`}:null;
  const parts=[];
  if(kind==='axolotl'){
    parts.push(h('g',{style:wagS(w?w*1.4:0)},path('M-8 -3 Q-23 -7 -31 0 Q-23 7 -8 3Z',p),path('M-8 -1 Q-22 -2 -30 0 Q-22 2 -8 1Z',c)));
    [-1,1].forEach(s=>{
      [-6,6].forEach(x=>parts.push(h('g',{transform:`translate(${x} ${s*3}) scale(1 ${s})`},h('g',{style:motion('paddle')},path('M0 0 Q-1 5 -5 8 L-8 8 M-5 8 L-7 10 M-5 8 L-4 11','none',{stroke:c,strokeWidth:1.7,strokeLinecap:'round'})))));
      [6,9,12].forEach((x,i)=>parts.push(h('g',{style:motion('fin-stroke')},path(`M${x} ${s*3} Q${x-4} ${s*(9+i)} ${x-2} ${s*(12-i)}`, 'none',{stroke:p,strokeWidth:1.8,strokeLinecap:'round'}),path(`M${x-2} ${s*7} l-3 ${s*1} m3 1 l-3 ${s*2}`,'none',{stroke:p,strokeWidth:.7,strokeLinecap:'round'}))));
    });
    parts.push(path('M15 0 C15 -6 9 -7 5 -5 C-3 -4 -12 -5 -14 0 C-12 5 -3 4 5 5 C9 7 15 6 15 0Z'),path('M-9 -1 Q1 -3 8 -2','none',{stroke:light,strokeWidth:.7,opacity:.5}),eye(11,-2.5),eye(11,2.5));
  }else if(kind==='ray'){
    parts.push(h('g',{style:wagS(w?w*1.8:0)},path('M-8 0 Q-21 2 -32 -1','none',{stroke:c,strokeWidth:1.3,strokeLinecap:'round'})));
    parts.push(h('g',{style:motion('flap')},path('M15 0 C11 -4 5 -4 -1 -12 Q-7 -17 -13 -13 Q-9 -6 -11 0 Q-9 6 -13 13 Q-7 17 -1 12 C5 4 11 4 15 0Z'),path('M9 0 Q-2 -1 -9 -10 M9 0 Q-2 1 -9 10','none',{stroke:p,strokeWidth:.65,opacity:.65})));
    [[-3,-5],[-6,-8],[-3,5],[-6,8],[0,-3],[0,3]].forEach(([x,y])=>parts.push(h('circle',{cx:x,cy:y,r:.8,fill:p,opacity:.7})));
    parts.push(eye(9,-2),eye(9,2));
  }else if(kind==='frog'){
    [-1,1].forEach(s=>parts.push(h('g',{transform:`scale(1 ${s})`},h('g',{style:motion('paddle')},path('M-4 4 Q-12 8 -12 12 Q-5 15 -2 9 L-8 9 Q-5 7 -3 6Z',c),path('M6 4 Q10 7 6 11 L3 12 M6 11 L6 14 M6 11 L9 13','none',{stroke:c,strokeWidth:1.6,strokeLinecap:'round'})))));
    parts.push(path('M14 0 C15 -5 10 -8 5 -7 C-2 -8 -10 -6 -11 0 C-10 6 -2 8 5 7 C10 8 15 5 14 0Z'),path('M-6 0 Q-2 -4 5 -3 Q9 0 5 3 Q-2 4 -6 0Z',p,{opacity:.6}),eye(10,-4,1.4),eye(10,4,1.4));
    [-1,1].forEach(s=>parts.push(path(`M-7 ${s*4} Q0 ${s*6} 6 ${s*4}`,'none',{stroke:light,strokeWidth:.65,opacity:.6})));
  }else if(kind==='turtle'){
    [-1,1].forEach(s=>[-1,1].forEach(x=>parts.push(h('g',{transform:`translate(${x*7} ${s*7}) scale(${x} ${s})`},h('g',{style:motion('paddle')},path('M-2 -1 Q4 0 6 7 Q1 8 -2 3Z',p))))));
    parts.push(path('M-11 -2 L-17 0 L-11 2Z',p),h('ellipse',{cx:15,cy:0,rx:5,ry:3.8,fill:p}),h('ellipse',{cx:0,cy:0,rx:12.5,ry:9.5,fill}),path('M-5 -5 L2 -6 L7 -2 L7 2 L2 6 L-5 5 L-8 0Z','none',{stroke:p,strokeWidth:.9}),path('M-5 -5 L-7 -8 M2 -6 L3 -9 M7 -2 L12 -3 M7 2 L12 3 M2 6 L3 9 M-5 5 L-7 8 M-8 0 L-12 0','none',{stroke:p,strokeWidth:.7}),path('M-6 -3 Q-2 -7 4 -5','none',{stroke:light,strokeWidth:.8,opacity:.5}),eye(17,-1.8,.7),eye(17,1.8,.7));
  }
  return [h('defs',null,h('linearGradient',{id:id+'-skin',x1:'0%',y1:'0%',x2:'0%',y2:'100%'},h('stop',{offset:'0%',stopColor:light}),h('stop',{offset:'30%',stopColor:c}),h('stop',{offset:'75%',stopColor:c}),h('stop',{offset:'100%',stopColor:shade}))),flat?parts.join('').replace(/(fill|stroke)="(?!none)[^"]*"/g,`$1="${c}"`):parts];
}
[['axolotl','#e9b9b3','#c77d94'],['ray','#88aca4','#d6d9b6'],['frog','#87a17a','#cbd4a0'],['turtle','#708d79','#b6bfa0']].forEach(([k,c,p])=>{
  DRAW[k]=(c,p,w)=>companion(k,c,p,w);Object.assign(SPEC.find(s=>s.k===k),{c,p});
});
/* Twenty-five individually art-directed additions, appended rather than
   inserted so every existing catalog number remains stable. */
const EDITION=[
  ['threadfin-rainbowfish','Threadfin Rainbowfish','Uncommon',10,3,'lyre','lines','#a5c7b9','#e6b46c',8,'feelers','focusH',6],
  ['forktail-blue-eye','Forktail Blue-eye','Common',8,3,'fork','tip','#9bc9cf','#f0cf70',5,'bigeye','tasks',15],
  ['pacific-blue-eye','Pacific Blue-eye','Common',8.5,2.7,'lyre','band','#b8ccc1','#79a7c9',4,'bigeye','noon',8],
  ['dwarf-neon-rainbowfish','Dwarf Neon Rainbowfish','Uncommon',10,4.2,'fork','back','#7db6cc','#dc8379',4,'','focusH',12],
  ['celebes-rainbowfish','Celebes Rainbowfish','Rare',11,3.6,'lyre','lines','#c4ceb0','#729faa',7,'feelers','fstreak',12],
  ['sparkling-gourami','Sparkling Gourami','Uncommon',9,4,'round','pearls','#80a79e','#d5e6c6',4,'feelers','jdays',7],
  ['chocolate-gourami','Chocolate Gourami','Uncommon',9,5.5,'round','stripes','#836b5e','#e7cf9d',4,'feelers','blooms',5],
  ['licorice-gourami','Licorice Gourami','Rare',10,3.8,'fan','lines','#536970','#8fc6c1',6,'feelers','focusH',24],
  ['pearl-danio','Pearl Danio','Common',10,3,'fork','band','#b8bfd2','#e9b0a0',3,'','tasks',20],
  ['emerald-dwarf-rasbora','Emerald Dwarf Rasbora','Uncommon',8.5,3.2,'fork','bars','#83b0a4','#dfbc87',3,'','noon',15],
  ['phoenix-rasbora','Phoenix Rasbora','Common',7,2.6,'fork','ocellus','#d88c74','#574c57',3,'','tasks',8],
  ['green-neon-tetra','Green Neon Tetra','Common',8,2.8,'fork','band','#77bbb0','#d0e2c2',3,'','focusH',4],
  ['ruby-tetra','Ruby Tetra','Common',7,3.2,'round','tip','#c76e69','#f1baa1',3,'','noon',5],
  ['blue-emperor-tetra','Blue Emperor Tetra','Rare',10,3.6,'lyre','band','#829ebf','#404c68',5,'','fstreak',10],
  ['splash-tetra','Splash Tetra','Uncommon',11,3,'lyre','lines','#b5bb9d','#d58f73',5,'','tasks',45],
  ['panda-garra','Panda Garra','Uncommon',11,4,'round','bars','#657e79','#e3cca0',5,'','late',12],
  ['clown-pleco','Clown Pleco','Rare',12,4.6,'lyre','chevron','#876951','#e8ba78',6,'whisk','late',25],
  ['sunset-variatus','Sunset Variatus Platy','Common',9,4.6,'fan','tip','#e8bd76','#ce7965',4,'','blooms',3],
  ['pearlscale-goldfish','Pearlscale Goldfish','Rare',10,8,'double','pearls','#dfae7d','#fff0ce',6,'','blooms',15],
  ['oranda-goldfish','Oranda Goldfish','Rare',12,7,'double','head','#eee0c2','#d87763',6,'hump','tasks',100],
  ['shubunkin','Shubunkin','Legendary',17,5.8,'veil','marble','#a8bdc7','#c37a60',6,'whisk','blooms',25],
  ['red-sea-purple-tang','Red Sea Purple Tang','Rare',10,7,'lunate','tip','#8a82b0','#e9ca75',5,'','focusH',40],
  ['kole-tang','Kole Tang','Uncommon',10.5,6.5,'lunate','lines','#aa8984','#efcf84',4,'','jdays',14],
  ['longfin-bannerfish','Longfin Bannerfish','Legendary',9,7.8,'fan','stripes','#f1e8cf','#526977',10,'feelers','fstreak',25],
  ['orchid-dottyback','Orchid Dottyback','Rare',12,3.6,'round','back','#aa87b5','#dfb8ca',4,'','jdays',21]
];
EDITION.forEach(([slug,name,rar,L,H,tl,pt,c,p,fins,ex,metric,n])=>{
  const k='atelier-'+slug, template=RQ.find(([m])=>m===metric)[1];
  DRAW[k]=gen({name,L,H,tl,pt,fins,detailed:true,b:H>6?.95:.7,tempo:tl==='veil'?1.5:1,ex:new Set(ex?ex.split('+'):[])});
  SPEC.push({k,name,rar,c,p,s:+Math.min(1.25,1.5-L*.022).toFixed(2),goal:{m:metric,n,t:template.replace('{n}',n)}});
});
/* The field guide is the art source for every in-game appearance. Keep the
   existing species objects (and their goals) and append only new stable keys.
   Templates are local, inert SVG; each draw receives fresh gradient/clip IDs. */
let catalogInstance=0;
const CATALOG_FRAMES=new Map();
function catalogDraw(art){
  return (c,p,w)=>{
    let drawing=art.art;
    if(c===p){
      drawing=drawing.replace(/\b(fill|stroke|stop-color)="(?!none")[^"]*"/g,(_,a)=>`${a}="${c}"`)
        .replace(/\bopacity="[^"]*"/g,'opacity="1"');
    }else if(c!==art.c||p!==art.p){
      drawing=drawing.replace(/\b(fill|stroke|stop-color)="(#[0-9a-f]+)"/gi,(all,a,col)=>
        `${a}="${col===art.c?c:col===art.p?p:col}"`);
    }
    drawing=drawing.replace(/animation:([^;"}]*)(;?)/g,(_,value)=>{
      if(!PF.motion||!(+w>0)) return '';
      const ratio=+w/.95;
      return 'animation:'+value.replace(/(-?[\d.]+)s\b/g,(_,n)=>+(+n*ratio).toFixed(4)+'s')+';';
    });
    return drawing.replace(/__PF__/g,'pfatlas'+(++catalogInstance)+'-');
  };
}
(window.PondCatalog||[]).forEach(art=>{
  const existing=SPEC.find(s=>s.k===art.k);
  if(existing) Object.assign(existing,{c:art.c,p:art.p});
  else SPEC.push({k:art.k,name:art.name,rar:art.rar,c:art.c,p:art.p,s:1.1});
  CATALOG_FRAMES.set(art.k,art.viewBox.split(/\s+/).map(Number));
  DRAW[art.k]=catalogDraw(art);
});
const SP={}; SPEC.forEach((s,i)=>{ s.no=i+1; SP[s.k]=s; });
const RAR={Common:{ink:'#3f774d',bg:'#dcebd9'},Uncommon:{ink:'#2f7a74',bg:'#d4e8e4'},Rare:{ink:'#715c95',bg:'#e6e0f1'},Legendary:{ink:'#8a5f1f',bg:'#f5e4c2'}};
/* what a finished task can release: everything except the milestone species,
   which only ever arrive by habit */
const POOL=SPEC.filter(s=>!s.milestone), PW={Common:60,Uncommon:27,Rare:10,Legendary:3}, byR={};
POOL.forEach(s=>(byR[s.rar]=byR[s.rar]||[]).push(s));
/* the pool as it stood when the catalog ended at No. n (250, 275, 375,
   376, 380…), grouped by rarity in catalog order. A task rolls from the
   catalog that existed when it was finished, so adding species never
   re-rolls a fish someone already caught. */
const poolAt={};
const poolUpTo=n=>poolAt[n]||(poolAt[n]=POOL.filter(s=>s.no<=n).reduce((o,s)=>((o[s.rar]=o[s.rar]||[]).push(s),o),{}));
/* 30% the class's own species, otherwise weighted by rarity. Seeded by the
   task's id, so a task always releases the same fish — unticking and
   re-ticking can't reroll it. */
function rollSpecies(taskId,classKey,includeEdition=true){
  const r=hs(taskId+'·pond');
  const first=r();
  if(classKey&&SP[classKey]&&first<.3) return classKey;
  let x=r()*100, Rr='Common';
  for(const q of ['Common','Uncommon','Rare','Legendary']){ if((x-=PW[q])<0){ Rr=q; break; } }
  // a number is the catalog size to roll from (see poolUpTo); false is the
  // original 250; true (the default) is everything there is now.
  const pool=includeEdition===false?poolUpTo(250):typeof includeEdition==='number'?poolUpTo(includeEdition):byR;
  const a=pool[Rr]; return a[Math.floor(r()*a.length)].k;
}

/* ── one creature as an inline <svg> ──
   extra: 'flat' drops the drop shadow (icons, silhouettes); an object is
   merged into the svg's style. */
function creature(kind,c,p,s,w,extra){
  const sp=SP[kind]; if(!DRAW[kind]&&!sp) kind='koi';
  const frame=CATALOG_FRAMES.get(kind)||[-34,-16,64,32];
  const shadow=kind==='ghost'?'drop-shadow(0 0 6px #ffffffcc)':extra==='flat'?'none':'drop-shadow(0 6px 5px rgba(5,25,28,.45))';
  /* data-k: which drawing (every fish of a kind has the same anatomy);
     data-f: this exact fish, so a redrawn scene can keep one it already has */
  return h('svg',{class:'pf-cr','data-k':kind,'data-f':kfHash([kind,c,p,s,w,JSON.stringify(extra||''),PF.motion].join('|')),width:+(frame[2]*s).toFixed(1),height:+(frame[3]*s).toFixed(1),viewBox:frame.join(' '),
    style:{display:'block',overflow:'visible',filter:shadow,...(extra&&extra!=='flat'?extra:{})}},DRAW[kind](c,p,w));
}
/* a species in its own colours */
const fish=(k,s,w,extra)=>{ const d=SP[k]||SP.koi; return creature(d.k,d.c,d.p,s??d.s,w,extra); };
/* a species as a dark silhouette — for ones you haven't found */
const shadowFish=(k,s,col)=>{ const d=SP[k]||SP.koi; return creature(d.k,col||'#0a2a2f',col||'#0a2a2f',s??d.s,0,'flat'); };

/* ── tails and fins, on the compositor ──
   A tail wag or a fin stroke is a CSS animation on a part inside the fish's
   SVG, and animating anything inside an SVG makes the browser repaint the
   whole fish, drop shadow and all, every frame, on the main thread. So once
   a fish is on the page, each animated part is lifted into its own copy of
   the fish's SVG frame, stacked in the same place beneath the body, and
   that whole element is animated instead: same keyframes, same timing,
   around the same pivot. The GPU turns those layers; the fish is painted
   once. The fish's outer look (drop shadow, opacity, blur) moves to a
   wrapper, so it still applies to the fish as one piece.
   Parts sit under the body because every animated part is drawn before it
   (tails, fins, flippers, wings). A MutationObserver runs this for every
   screen; a fish added while hidden waits until it's shown. */
const SVGNS='http://www.w3.org/2000/svg';
/* a mirrored part (flippers and legs drawn with scale(1 -1)) turns the
   other way once it's lifted out of its mirror */
const MIRRORED={'pf-wag':'pf-wag-m','pf-paddle':'pf-paddle-m','pf-fin-stroke':'pf-fin-stroke-m'};
function originIn(str,bb){
  const kx={left:0,right:100}, ky={top:0,bottom:100};
  let t=(str||'').trim().split(/\s+/).filter(Boolean);
  if(!t.length) t=['center'];
  if(t.length===1) t=t[0] in ky?['center',t[0]]:[t[0],'center'];
  if(t[0] in ky||t[1] in kx) t=[t[1],t[0]];
  const v=(s,o,len,kw)=>s==='center'?o+len/2:s in kw?o+kw[s]/100*len:s.endsWith('%')?o+parseFloat(s)/100*len:o+parseFloat(s);
  return [v(t[0],bb.x,bb.width,kx),v(t[1],bb.y,bb.height,ky)];
}
/* Where each part sits and turns depends only on the drawing, not on size
   or colour, so it's measured once per kind and remembered: after that a
   fish is lifted without asking the browser for any geometry, which would
   force a style and layout pass in the middle of building a scene. */
const LIFT_GEO=new Map();
function animatedParts(svg){ return [...svg.querySelectorAll('[style*="animation"]')].filter(e=>e.style.animationName&&e.style.animationName!=='none'); }
function liftPlan(svg){
  const parts=animatedParts(svg), vb=svg.viewBox.baseVal;
  if(!parts.length) return {svg,parts};
  const k=(+svg.getAttribute('width')||vb.width)/vb.width, geo=LIFT_GEO.get(svg.dataset.k);
  if(geo&&geo.length===parts.length) return {svg,vb,k,parts:parts.map((el,i)=>({el,...geo[i]}))};
  if(!svg.getClientRects().length) return null;                 // not rendered: measure later
  const root=svg.getScreenCTM(); if(!root) return null;
  const inv=root.inverse();
  const plan={svg,vb,k,parts:parts.map(el=>{
    const P=inv.multiply(el.parentNode.getScreenCTM()), [ox,oy]=originIn(el.style.transformOrigin,el.getBBox());
    const M={a:P.a,b:P.b,c:P.c,d:P.d,e:P.e,f:P.f};
    return {el,M,X:M.a*ox+M.c*oy+M.e,Y:M.b*ox+M.d*oy+M.f,flip:M.a*M.d-M.b*M.c<0};
  })};
  if(svg.dataset.k) LIFT_GEO.set(svg.dataset.k,plan.parts.map(({M,X,Y,flip})=>({M,X,Y,flip})));
  return plan;
}
/* The drop shadow can't stay a CSS filter on the fish: over moving layers
   the GPU would re-blur it every frame (40% of the GPU's work on Today).
   So it's baked into the layers, drawn once by an SVG filter inside them:
   the body's shadow is a still layer at the very bottom, so it never falls
   across a fin, and each fin or tail carries its own shadow in its own
   layer, moving with it. No extra moving layers, and nothing for the GPU
   to recompute per frame. */
const DROP=/^drop-shadow\((rgba?\(([^)]*)\))\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px\)$/;
let shN=0;
function liftApply(plan){
  const {svg,vb,parts,k}=plan;
  if(svg.dataset.lifted) return;                               // never twice
  svg.dataset.lifted='1';
  if(!parts.length) return;
  const wrap=document.createElement('span'); wrap.className='pf-crw';
  const f=svg.style.filter, op=svg.style.opacity, ds=DROP.exec(f||'');
  wrap.style.cssText='position:relative;display:block;width:fit-content;height:fit-content'+(f&&f!=='none'&&!ds?';filter:'+f:'')+(op?';opacity:'+op:'');
  svg.style.filter='none'; svg.style.opacity='';
  const pct=x=>(x*100).toFixed(2)+'%', vbs=svg.getAttribute('viewBox');
  const el=(tag,attrs,kids)=>{ const n=document.createElementNS(SVGNS,tag); Object.entries(attrs||{}).forEach(([a,v])=>n.setAttribute(a,v)); (kids||[]).forEach(c=>n.appendChild(c)); return n; };
  const layer=(style,kids)=>{ const l=el('svg',{class:'pf-part',viewBox:vbs,'aria-hidden':'true'},kids);
    l.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;'+(style||''); return l; };
  const mat=M=>el('g',{transform:`matrix(${[M.a,M.b,M.c,M.d,M.e,M.f].map(n=>+n.toFixed(4)).join(' ')})`});
  let drop=null, bodyShadow=null;
  if(ds){
    const ch=ds[2].split(',').map(x=>+x), id='pfsh'+(++shN), m=40;
    const sd=+(+ds[5]/2/k).toFixed(3), dx=+(+ds[3]/k).toFixed(3), dy=+(+ds[4]/k).toFixed(3), col=`rgb(${ch[0]},${ch[1]},${ch[2]})`, a=ch.length>3?ch[3]:1;
    const box={filterUnits:'userSpaceOnUse',x:vb.x-m,y:vb.y-m,width:vb.width+2*m,height:vb.height+2*m,'color-interpolation-filters':'sRGB'};
    const fOnly=el('filter',{id:id+'s',...box}); fOnly.innerHTML=`<feGaussianBlur in="SourceAlpha" stdDeviation="${sd}"/><feOffset dx="${dx}" dy="${dy}" result="b"/><feFlood flood-color="${col}" flood-opacity="${a}"/><feComposite in2="b" operator="in"/>`;
    const fDrop=el('filter',{id:id+'d',...box}); fDrop.innerHTML=`<feDropShadow dx="${dx}" dy="${dy}" stdDeviation="${sd}" flood-color="${col}" flood-opacity="${a}"/>`;
    drop=g=>el('g',{filter:`url(#${id}d)`},[g]);
    bodyShadow=()=>{
      // everything left once the moving parts are out, minus its defs (the clone reuses them)
      const still=[...svg.childNodes].filter(n=>n.nodeName!=='defs').map(n=>n.cloneNode(true));
      const l=layer('',[el('defs',{},[fOnly,fDrop]),el('g',{filter:`url(#${id}s)`},still)]);
      l.setAttribute('class','pf-crs-body'); return l;
    };
  }
  const layers=parts.map(({el:part,M,X,Y,flip})=>{
    const s=part.style, name=s.animationName;
    const anim=`${flip&&MIRRORED[name]||name} ${s.animationDuration} ${s.animationTimingFunction} ${s.animationDelay} ${s.animationIterationCount} ${s.animationDirection}`;
    ['animation','transform-box','transform-origin'].forEach(p=>s.removeProperty(p));
    const g=mat(M); g.appendChild(part);
    return layer(`transform-origin:${pct((X-vb.x)/vb.width)} ${pct((Y-vb.y)/vb.height)};animation:${anim}`,[drop?drop(g):g]);
  });
  svg.parentNode.insertBefore(wrap,svg);
  if(bodyShadow) wrap.appendChild(bodyShadow());
  layers.forEach(l=>wrap.appendChild(l));
  /* positioned like the layers, so all of them paint in document order
     (the body's shadow, then the parts, then the body); an in-flow body
     would otherwise paint underneath every positioned layer */
  svg.style.position='relative';
  wrap.appendChild(svg);
}
let liftIO=null;
function liftLater(svg){
  liftIO=liftIO||new IntersectionObserver(es=>{
    const ready=es.map(e=>e.target).filter(t=>!t.dataset.lifted&&t.getClientRects().length);
    const plans=ready.map(liftPlan);                             // measure everything, then move everything
    plans.forEach((pl,i)=>{ if(pl){ liftIO.unobserve(ready[i]); liftApply(pl); } });
  });
  liftIO.observe(svg);
}
function liftWithin(nodes){
  /* a container and its contents can arrive in the same batch: a Set, so
     each fish is found once */
  const found=new Set();
  nodes.forEach(n=>{ if(n.nodeType!==1) return;
    if(n.matches('svg.pf-cr:not([data-lifted])')) found.add(n);
    n.querySelectorAll('svg.pf-cr:not([data-lifted])').forEach(s=>found.add(s)); });
  if(!found.size) return;
  const list=[...found].filter(s=>s.isConnected), plans=list.map(liftPlan);   // measure all, then move all
  plans.forEach((pl,i)=>pl?liftApply(pl):liftLater(list[i]));
}
function liftStart(){
  if(typeof MutationObserver==='undefined'||liftStart.on) return; liftStart.on=true;
  new MutationObserver(ms=>{ const add=[]; ms.forEach(m=>m.addedNodes.forEach(n=>add.push(n))); if(PF.motion) liftWithin(add); })
    .observe(document.documentElement,{childList:true,subtree:true});
}
if(typeof document!=='undefined') liftStart();

/* ── redrawing a scene in place ──
   A scene is rebuilt whenever its size changes (a resize, a zoom), because
   swim paths are laid out in pixels. Swapping in fresh markup would throw
   away every fish's layers and make the browser draw, lift and rasterise
   them all again, on every zoom step. morph() builds the new markup off the
   page and walks it against what's there: the same fish in the same place
   is kept and only takes the new swimmer styles (its path, its phase); a
   plain element takes the new attributes; anything different is replaced.
   The result is identical to a fresh build. */
function sameFish(a,b){ const x=a.querySelector('svg.pf-cr'), y=b.querySelector('svg.pf-cr'); return !!x&&!!y&&x.dataset.f===y.dataset.f; }
function syncAttrs(o,n){
  for(const {name,value} of [...n.attributes]) if(o.getAttribute(name)!==value) o.setAttribute(name,value);
  for(const {name} of [...o.attributes]) if(!n.hasAttribute(name)&&name!=='data-lifted') o.removeAttribute(name);
}
function morphNode(o,n){
  if(o.nodeType!==n.nodeType||o.nodeName!==n.nodeName){ o.replaceWith(n); return; }
  if(o.nodeType!==1){ if(o.nodeValue!==n.nodeValue) o.nodeValue=n.nodeValue; return; }
  if(o.classList.contains('pf-swim')||n.classList&&n.classList.contains('pf-swim')){
    if(sameFish(o,n)) syncAttrs(o,n); else o.replaceWith(n);
    return;
  }
  if(o.matches('svg.pf-cr')){ if(o.dataset.f!==n.getAttribute('data-f')) o.replaceWith(n); return; }   // a fish on its own (a lifted one arrives as its wrapper, a <span>, and is replaced above)
  syncAttrs(o,n);
  const oc=[...o.childNodes], nc=[...n.childNodes];
  if(oc.length!==nc.length){ o.replaceChildren(...nc); return; }
  nc.forEach((c,i)=>morphNode(oc[i],c));
}
function morph(box,html){
  if(!box) return;
  if(!box.firstChild){ box.innerHTML=html; return; }
  const t=document.createElement('template'); t.innerHTML=html;
  const oc=[...box.childNodes], nc=[...t.content.childNodes];
  if(oc.length!==nc.length){ box.replaceChildren(...nc); return; }
  nc.forEach((c,i)=>morphNode(oc[i],c));
}

/* ── water toolkit ── */
function loop(cx,cy,rx,ry,n,jit){
  const pts=[]; const off=rnd()*6.28;
  for(let i=0;i<n;i++){ const a=off+i/n*6.283, k=1-jit/2+rnd()*jit; pts.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k]); }
  let d=`M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for(let i=0;i<n;i++){
    const p0=pts[(i-1+n)%n], p1=pts[i], p2=pts[(i+1)%n], p3=pts[(i+2)%n];
    d+=` C${(p1[0]+(p2[0]-p0[0])/6).toFixed(1)} ${(p1[1]+(p2[1]-p0[1])/6).toFixed(1)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(1)} ${(p2[1]-(p3[1]-p1[1])/6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
/* ── swimming, on the compositor ──
   A fish follows its loop by transform keyframes sampled from the path:
   KF_STOPS points spaced evenly by arc length, each with the heading of the
   path there. Transform animations run on the GPU compositor, so a swimming
   fish costs the main thread nothing per frame and keeps gliding while the
   app is busy re-rendering a list. (offset-path, which this replaced, is
   animated on the main thread: a style recalc for every fish, every frame.)
   One @keyframes rule per distinct path, cached; unused ones are pruned. */
const KF_STOPS=64, KF=new Map();
let kfSheet=null;
function kfHash(s){ let x=2166136261; for(let i=0;i<s.length;i++){ x^=s.charCodeAt(i); x=Math.imul(x,16777619); } return (x>>>0).toString(36); }
/* loop() paths are one M then cubic C segments; flatten them finely */
function flatten(d){
  const n=(d.match(/-?\d*\.?\d+/g)||[]).map(Number);
  if(!/^M[\d\s.-]+(C[\d\s.-]+)+$/.test(d)||n.length<8||(n.length-2)%6) return null;
  const pts=[[n[0],n[1]]];
  for(let i=2;i<n.length;i+=6){
    const [x0,y0]=pts[pts.length-1], x1=n[i],y1=n[i+1],x2=n[i+2],y2=n[i+3],x3=n[i+4],y3=n[i+5];
    for(let s=1;s<=24;s++){ const t=s/24, u=1-t, a=u*u*u, b=3*u*u*t, c=3*u*t*t, e=t*t*t;
      pts.push([a*x0+b*x1+c*x2+e*x3, a*y0+b*y1+c*y2+e*y3]); }
  }
  return pts;
}
/* evenly spaced stops round the loop: [x, y, heading in degrees, unwrapped] */
function stops(pts,n){
  const cum=[0];
  for(let i=1;i<pts.length;i++) cum.push(cum[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
  const L=cum[cum.length-1]||1, out=[];
  let j=1, prev=null;
  for(let k=0;k<=n;k++){
    const want=(k%n)/n*L;
    if(k%n===0) j=1;
    while(j<pts.length-1&&cum[j]<want) j++;
    const a=pts[j-1], b=pts[j], seg=(cum[j]-cum[j-1])||1, t=Math.max(0,Math.min(1,(want-cum[j-1])/seg));
    let ang=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
    if(prev!=null){ while(ang-prev>180) ang-=360; while(ang-prev<-180) ang+=360; }
    if(k===n) ang=out[0][2]+Math.round((prev-out[0][2])/360)*360;   // close the lap a whole turn on
    out.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, ang]); prev=ang;
  }
  return out;
}
function kfSheetGet(){
  if(kfSheet) return kfSheet;
  const s=document.createElement('style'); s.id='pf-kf'; (document.head||document.documentElement).appendChild(s);
  return kfSheet=s.sheet;
}
/* drop rules nothing on the page uses any more (and that weren't made just
   now for markup that's still being assembled) */
function kfPrune(){
  if(KF.size<400) return;
  const used=new Set([...document.querySelectorAll('.pf-swim')].map(e=>e.style.animationName));
  const sh=kfSheetGet(), cut=Date.now()-10000;
  for(const [key,v] of KF) if(!used.has(v.name)&&v.at<cut){
    for(let i=sh.cssRules.length-1;i>=0;i--) if(sh.cssRules[i].name===v.name){ sh.deleteRule(i); break; }
    KF.delete(key);
  }
}
function swimKeyframes(path,rev,w,hgt){
  const key=path+'|'+(rev?1:0)+'|'+w+'|'+hgt; let v=KF.get(key);
  if(v){ v.at=Date.now(); return v; }
  const pts=flatten(path); if(!pts) return null;
  const st=stops(pts,KF_STOPS), turn=rev?180:0, name='pfk'+kfHash(key);
  const tf=s=>`translate(${(s[0]-w/2).toFixed(1)}px,${(s[1]-hgt/2).toFixed(1)}px) rotate(${(s[2]+turn).toFixed(1)}deg)`;
  const body=st.map((s,k)=>`${+(k/KF_STOPS*100).toFixed(3)}%{transform:${tf(s)}}`).join('');
  try{ const sh=kfSheetGet(); sh.insertRule(`@keyframes ${name}{${body}}`,sh.cssRules.length); }catch(e){ return null; }
  v={name,st,tf,at:Date.now()}; KF.set(key,v); kfPrune();
  return v;
}
/* The lap's phase is read off the wall clock, so when a scene is rebuilt
   (a resize, a zoom) each fish carries on from where it was on its loop
   instead of every fish restarting at once. */
function swimmer(path,dur,rev,node,z,extraStyle){
  const at=rnd(), ph=rnd(), lap=((Date.now()/1000/dur+ph)%1)*dur;
  const m=/^<svg[^>]*?\swidth="([\d.]+)"[^>]*?\sheight="([\d.]+)"/.exec(node||''), v=m&&typeof document!=='undefined'&&swimKeyframes(path,rev,+m[1],+m[2]);
  if(v){
    /* the resting transform is where a still pond (or reduced motion) shows it */
    const rest=v.st[Math.floor(at*KF_STOPS)%KF_STOPS];
    return h('div',{class:'pf-swim',style:{position:'absolute',left:0,top:0,transformOrigin:`${+m[1]/2}px ${+m[2]/2}px`,transform:v.tf(rest),
      animation:PF.motion?`${v.name} ${dur}s linear ${(-lap).toFixed(2)}s infinite${rev?' reverse':''}`:'none',zIndex:z||2,...(extraStyle||{})}},node);
  }
  return h('div',{class:'pf-swim',style:{position:'absolute',left:0,top:0,offsetPath:`path('${path}')`,offsetRotate:rev?'auto 180deg':'auto',
    offsetDistance:(at*100).toFixed(0)+'%',animation:PF.motion?`pf-swim ${dur}s linear ${(-lap).toFixed(2)}s infinite${rev?' reverse':''}`:'none',zIndex:z||2,...(extraStyle||{})}},node);
}
/* ── moving light on the water ──
   Two sheets of turbulence noise drifting past each other, screen-blended.
   Running feTurbulence live means the GPU redraws a screen-sized filter
   every frame (and the filters were never actually on the page, so it
   drew black). Instead each sheet is drawn once, at load, as a seamlessly
   tiling bitmap (stitchTiles; each tile size makes baseFrequency × size a
   whole number), and the compositor slides it. The sheets are empty for
   the few milliseconds before the bitmaps exist. */
const CAUS=[
  {v:'--pf-caus-a',w:545,h:526,f:'0.011 0.019',seed:4,m:'0 0 0 0 0.82  0 0 0 0 1  0 0 0 0 0.94  -3.4 0 0 0 1.25'},
  {v:'--pf-caus-b',w:500,h:545,f:'0.016 0.011',seed:9,m:'0 0 0 0 0.9  0 0 0 0 1  0 0 0 0 0.9  -3.8 0 0 0 1.2'}];
let causBaked=false;
function bakeCaustics(){
  if(causBaked||typeof document==='undefined') return; causBaked=true;
  const d=Math.min(2,Math.max(1,Math.round((window.devicePixelRatio||1)*2)/2));
  CAUS.forEach(c=>{
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${c.w*d}" height="${c.h*d}" viewBox="0 0 ${c.w} ${c.h}"><filter id="f" x="0" y="0" width="100%" height="100%">`+
      `<feTurbulence type="turbulence" baseFrequency="${c.f}" numOctaves="2" seed="${c.seed}" stitchTiles="stitch"/><feColorMatrix type="matrix" values="${c.m}"/></filter>`+
      `<rect width="${c.w}" height="${c.h}" filter="url(#f)"/></svg>`;
    const src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    const use=u=>document.documentElement.style.setProperty(c.v,`url("${u}")`);
    const img=new Image();
    img.onload=()=>{
      try{
        const cv=document.createElement('canvas'); cv.width=c.w*d; cv.height=c.h*d;
        cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);
        cv.toBlob(b=>use(b?URL.createObjectURL(b):src),'image/png');
      }catch(e){ use(src); }          // a tainted canvas: the SVG itself still works as an image
    };
    img.onerror=()=>use(src);
    img.src=src;
  });
}
function caustics(w,hgt,op){
  if(!PF.light) return '';
  bakeCaustics();
  /* each sheet is sized to cover the pond at every point of its drift
     (the second one travels 160px left of its 120px offset) */
  const sheet=(c,x,y,o,anim,ew)=>h('div',{style:{position:'absolute',left:x,top:y,width:Math.round(w+ew),height:Math.round(hgt+100),opacity:o,
    backgroundImage:`var(${c.v})`,backgroundSize:`${c.w}px ${c.h}px`,animation:PF.motion?anim:'none'}});
  return h('div',{class:'pf-caustics',style:{position:'absolute',left:0,top:0,width:w,height:hgt,zIndex:3,pointerEvents:'none',mixBlendMode:'screen',opacity:op}},
    sheet(CAUS[0],-20,-20,null,'pf-drift1 26s ease-in-out infinite alternate',200),
    sheet(CAUS[1],-120,-40,.7,'pf-drift2 34s ease-in-out infinite alternate',300));
}
/* Delays are given as the equivalent negative ones (the same rhythm, already
   under way): an animation still waiting out a positive delay is watched
   from the main thread every frame until it starts. */
const lead=(delay,dur)=>+(((+delay%dur)-dur)%dur).toFixed(2);
const ripple=(x,y,size,delay,dur)=>!PF.ripples?'':h('div',{style:{position:'absolute',left:x,top:y,width:size,height:size,borderRadius:'50%',border:'1.5px solid #cfe9e3',boxShadow:'0 0 0 6px #cfe9e30f',opacity:0,
  transform:'translate(-50%,-50%)',animation:PF.motion?`pf-ripple ${dur||6}s ease-out ${lead(delay,dur||6)}s infinite`:'none',zIndex:3,pointerEvents:'none'}});
const glints=(w,hgt,n)=>Array.from({length:n},()=>{ const x=+(rnd()*w).toFixed(1), y=+(rnd()*hgt).toFixed(1), gw=+(10+rnd()*14).toFixed(1), dur=+(2.5+rnd()*3).toFixed(1), dl=+(rnd()*6).toFixed(1);
  return h('div',{style:{position:'absolute',left:x,top:y,width:gw,height:2,borderRadius:2,background:'#ffffffcc',opacity:0,zIndex:6,pointerEvents:'none',
  animation:PF.motion?`pf-glint ${dur}s ease-in-out ${lead(dl,dur)}s infinite`:'none'}}); }).join('');
const petals=(hgt,n)=>!PF.petals?'':Array.from({length:n},(_,i)=>h('div',{style:{position:'absolute',left:0,top:+(30+rnd()*(hgt-60)).toFixed(1),zIndex:5,pointerEvents:'none',
  animation:PF.motion?`pf-float ${(55+rnd()*35).toFixed(0)}s linear ${(-rnd()*80).toFixed(0)}s infinite`:'none'}},
  h('div',{style:{width:9,height:6,borderRadius:'60% 40% 60% 40%',background:i%2?'#f7c1d4':'#fde3d0',boxShadow:'0 3px 4px rgba(5,25,28,.3)'}}))).join('');
function pad(x,y,r,rot,col,bloom){
  return h('div',{style:{position:'absolute',left:x-r,top:y-r,width:r*2,height:r*2,zIndex:4,pointerEvents:'none',animation:PF.motion?`pf-bob ${(5+rnd()*3).toFixed(1)}s ease-in-out infinite`:'none'}},
    h('div',{style:{position:'absolute',inset:0,borderRadius:'50%',transform:`rotate(${rot}deg)`,background:`conic-gradient(from 0deg,transparent 0 26deg,${col} 26deg 360deg)`,filter:'drop-shadow(0 8px 7px rgba(5,25,28,.35))'}},
      h('div',{style:{position:'absolute',inset:+(r*.22).toFixed(1),borderRadius:'50%',border:'1px solid #ffffff22'}})),
    bloom?h('div',{style:{position:'absolute',left:r-r*.5,top:r-r*.55}},plant(bloom,r)):null);
}
const deep=(kind,path,dur,rev,s)=>swimmer(path,dur,rev,creature(kind,'#0a2a2f','#0a2a2f',s,.9,'flat'),1,{opacity:.45,filter:'blur(2.5px)'});

/* ── a plant for each Daily mood ── */
const PLANT={great:'Lotus',good:'Water lily',okay:'Marsh marigold',rough:'Water hyacinth',bad:'Closed bud'};
function plant(mood,size,still){
  const k=[];
  if(mood==='great'){
    for(let i=0;i<8;i++) k.push(h('ellipse',{cx:0,cy:-9,rx:4.3,ry:9.5,transform:`rotate(${i*45})`,fill:'#f4a6c0'}));
    for(let i=0;i<5;i++) k.push(h('ellipse',{cx:0,cy:-6,rx:3.6,ry:7,transform:`rotate(${i*72+36})`,fill:'#fbd3e0'}));
    k.push(h('circle',{r:3.6,fill:'#f0c24a'}));
  } else if(mood==='good'){
    for(let i=0;i<12;i++) k.push(h('ellipse',{cx:0,cy:-9,rx:2.4,ry:8.5,transform:`rotate(${i*30})`,fill:'#fbf8f2',stroke:'#dfe6dc',strokeWidth:.5}));
    for(let i=0;i<6;i++) k.push(h('ellipse',{cx:0,cy:-5,rx:2,ry:5.5,transform:`rotate(${i*60+15})`,fill:'#ffffff'}));
    k.push(h('circle',{r:3.2,fill:'#f0c24a'}));
  } else if(mood==='okay'){
    for(let i=0;i<5;i++) k.push(h('circle',{cx:0,cy:-7,r:6.2,transform:`rotate(${i*72})`,fill:'#f3d25a',stroke:'#e0b83a',strokeWidth:.6}));
    k.push(h('circle',{r:4.2,fill:'#e89a2e'}));
    for(let i=0;i<5;i++) k.push(h('circle',{cx:0,cy:-2,r:.8,transform:`rotate(${i*72+36})`,fill:'#fbe7a8'}));
  } else if(mood==='rough'){
    [[-6,-4,.95],[6,-6,.85],[0,6,1]].forEach(([x,y,s],j)=>{
      const g=[];
      for(let i=0;i<6;i++) g.push(h('ellipse',{cx:0,cy:-3.4,rx:2.3,ry:3.8,transform:`rotate(${i*60})`,fill:j===1?'#a58ee0':'#b9a2e8'}));
      g.push(h('circle',{r:1.4,fill:'#f3d25a'}));
      k.push(h('g',{transform:`translate(${x} ${y}) scale(${s})`},g));
    });
  } else if(mood==='bad'){
    k.push(h('g',{transform:'rotate(-18)'},
      h('ellipse',{cx:-3.5,cy:5,rx:3,ry:7.5,transform:'rotate(-28 -3.5 5)',fill:'#5f9470'}),
      h('ellipse',{cx:3.5,cy:5,rx:3,ry:7.5,transform:'rotate(28 3.5 5)',fill:'#5f9470'}),
      h('ellipse',{cx:0,cy:-2,rx:6,ry:10,fill:'#9aabc2'}),
      h('ellipse',{cx:-2,cy:-4,rx:1.6,ry:5,fill:'#c3cedc'}),
      h('path',{d:'M0 -12 Q1.5 -6 0 4',stroke:'#7d8fa8',strokeWidth:.8,fill:'none'})));
  }
  return h('svg',{width:size,height:size,viewBox:'-20 -20 40 40',style:{display:'block',overflow:'visible',filter:'drop-shadow(0 2px 2px rgba(5,25,28,.35))',
    animation:PF.motion&&!still?`pf-sway ${(4+rnd()*3).toFixed(1)}s ease-in-out infinite`:'none'}},k);
}

/* A side-view bloom: every petal shares a rooted base and opens outward. */
function lotus(progress){
  const p=Math.max(0,Math.min(1,Number(progress)||0));
  const petal=(angle,length,width,fill)=>`<g transform="translate(140 139) rotate(${angle})"><path d="M0 0 C${-width} -14 ${-width} ${-length*.65} 0 ${-length} C${width} ${-length*.65} ${width} -14 0 0Z" fill="${fill}" stroke="#b7775f" stroke-opacity=".35" stroke-width=".8"/><path d="M0 -5 Q-3 ${-length*.45} 0 ${-length*.87}" fill="none" stroke="#fff6e7" stroke-opacity=".4" stroke-width=".8"/></g>`;
  const layers=[[-72,-48,-24,0,24,48,72].sort((a,b)=>Math.abs(b)-Math.abs(a)).map(a=>petal(a*(.10+.90*p),65+12*p-Math.abs(a)*.18*(1-p),13+4*p,'url(#lotus-back)')).join(''),
    [-55,-28,0,28,55].sort((a,b)=>Math.abs(b)-Math.abs(a)).map(a=>petal(a*(.12+.88*p),58+4*p,14+3*p,'url(#lotus-front)')).join(''),
    [-77,-42,0,42,77].sort((a,b)=>Math.abs(b)-Math.abs(a)).map(a=>petal(a*(.08+.92*p),48-13*p,12+6*p,'url(#lotus-front)')).join('')];
  return `<svg viewBox="0 0 280 200" role="img" aria-label="Lotus, ${Math.round(p*100)} percent of daily focus goal" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="lotus-water"><stop stop-color="#dbe8db"/><stop offset="1" stop-color="#f5f1e7" stop-opacity="0"/></radialGradient>
    <linearGradient id="lotus-back" x2=".2" y2="1"><stop stop-color="#edbda4"/><stop offset="1" stop-color="#ce8066"/></linearGradient>
    <linearGradient id="lotus-front" x2=".15" y2="1"><stop stop-color="#fff0dc"/><stop offset=".5" stop-color="#f5c7aa"/><stop offset="1" stop-color="#e49b79"/></linearGradient></defs>
    <ellipse cx="140" cy="148" rx="137" ry="50" fill="url(#lotus-water)"/>
    <g fill="none" stroke="#7ca396" stroke-width=".8"><ellipse cx="140" cy="151" rx="114" ry="27" opacity=".2"/><ellipse cx="140" cy="151" rx="94" ry="19" opacity=".35"/></g>
    <path d="M139 148 C107 125 58 133 63 151 C69 176 174 177 211 151 C219 131 173 124 146 143 L177 155Z" fill="#819e77" stroke="#6c8b69" stroke-width=".8"/>
    <path d="M78 151 Q112 142 139 148 M102 166 Q115 153 139 148 M195 145 Q171 139 149 145" fill="none" stroke="#b6c8a1" stroke-width=".8" opacity=".65"/>
    <ellipse cx="140" cy="145" rx="${22+27*p}" ry="7" fill="#3f6050" opacity=".13"/>
    ${layers[0]}${layers[1]}<ellipse cx="140" cy="130" rx="${3+12*p}" ry="${2+5*p}" fill="#d9ac57" opacity="${p}"/>${layers[2]}
    <path d="M118 143 Q139 155 162 143" fill="none" stroke="#647e5d" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

/* ── the Catching Days mark ──
   A koi curled once around a round pond, swimming toward a small sun: it is
   always about to catch the day. Drawn in a 100×100 box (the curve was
   generated from an arc with a tapering width, then frozen here as paths).
   opts.swim sends the koi and its sun slowly around the pond, the koi
   surging toward the sun and easing off as it goes; opts.flat drops the glow for tiny sizes. */
const MK={
  body:'M29.2 68.8L28.6 68.4L28.1 67.9L27.5 67.5L27 67L26.5 66.6L25.9 66.1L25.4 65.6L25 65.1L24.5 64.6L24 64L23.5 63.5L23.1 62.9L22.7 62.3L22.2 61.7L21.8 61.1L21.5 60.5L21.1 59.8L20.7 59.2L20.4 58.5L20.1 57.8L19.7 57.2L19.5 56.5L19.2 55.7L18.9 55L18.7 54.3L18.5 53.6L18.3 52.8L18.1 52.1L17.9 51.3L17.8 50.6L17.7 49.8L17.6 49L17.5 48.2L17.5 47.5L17.4 46.7L17.4 45.9L17.4 45.1L17.5 44.3L17.5 43.5L17.6 42.7L17.7 41.9L17.8 41.1L18 40.3L18.1 39.6L18.3 38.8L18.5 38L18.7 37.2L19 36.5L19.3 35.7L19.6 34.9L19.9 34.2L20.2 33.5L20.6 32.7L21 32L21.4 31.3L21.8 30.6L22.3 29.9L22.7 29.2L23.2 28.6L23.7 27.9L24.2 27.3L24.8 26.7L25.3 26.1L25.9 25.5L26.5 24.9L27.1 24.4L27.7 23.8L28.4 23.3L29 22.9L29.7 22.4L30.4 22L31.1 21.5L31.8 21.1L32.5 20.7L33.2 20.4L34 20L34.7 19.7L35.4 19.3L36.2 19L36.9 18.7L37.7 18.5L38.5 18.2L39.2 18L40 17.8L40.8 17.6L41.6 17.4L42.4 17.3L43.2 17.1L44 17L44.8 16.9L45.6 16.8L46.4 16.8L47.1 16.7L47.9 16.7L48.7 16.7L49.5 16.7L50.3 16.8L51.1 16.8L51.9 16.9L52.7 17L53.5 17.1L54.3 17.2L55 17.4L55.8 17.5L56.6 17.7L57.3 17.9L58.1 18.1L58.8 18.4L59.6 18.7L60.3 19L61 19.4L61.6 19.9L62.2 20.3L62.8 20.9L63.4 21.5L63.9 22.2L64.3 22.9L64.7 23.8L64.9 24.9L64.3 27.1L64.3 27.1L62.7 28.6L61.7 29.1L60.9 29.3L60.2 29.5L59.6 29.6L59 29.7L58.4 29.7L57.8 29.8L57.3 29.7L56.7 29.7L56.2 29.7L55.7 29.6L55.2 29.5L54.7 29.4L54.2 29.4L53.7 29.3L53.2 29.3L52.7 29.2L52.2 29.2L51.7 29.2L51.2 29.2L50.7 29.2L50.2 29.2L49.7 29.3L49.2 29.3L48.7 29.4L48.2 29.5L47.8 29.6L47.3 29.6L46.8 29.8L46.3 29.9L45.8 30L45.4 30.1L44.9 30.3L44.5 30.5L44 30.6L43.6 30.8L43.1 31L42.7 31.2L42.2 31.4L41.8 31.7L41.4 31.9L41 32.1L40.6 32.4L40.2 32.6L39.8 32.9L39.4 33.2L39 33.5L38.7 33.8L38.3 34.1L37.9 34.4L37.6 34.7L37.3 35.1L36.9 35.4L36.6 35.7L36.2 36L35.9 36.3L35.6 36.7L35.3 37L34.9 37.4L34.6 37.7L34.3 38.1L34 38.4L33.7 38.8L33.4 39.2L33.1 39.5L32.8 39.9L32.6 40.3L32.3 40.7L32 41.1L31.8 41.5L31.5 41.9L31.3 42.3L31 42.8L30.8 43.2L30.6 43.6L30.3 44.1L30.1 44.5L29.9 45L29.7 45.4L29.5 45.9L29.4 46.4L29.2 46.9L29 47.3L28.9 47.8L28.7 48.3L28.6 48.8L28.4 49.3L28.3 49.9L28.2 50.4L28.1 50.9L28 51.4L27.9 52L27.9 52.5L27.8 53.1L27.8 53.6L27.7 54.2L27.7 54.7L27.7 55.3L27.7 55.8L27.7 56.4L27.7 57L27.8 57.5L27.8 58.1L27.9 58.7L28 59.3L28.1 59.9L28.2 60.4L28.3 61L28.5 61.6L28.6 62.2L28.8 62.8L29 63.4L29.2 63.9L29.4 64.5L29.6 65.1L29.9 65.7L30.1 66.2L30.4 66.8L30.7 67.4Z',
  tail:'M28.1 68.4Q28.8 75.8 31.6 82.7Q34.3 72.9 44.3 71.3Q37.7 67.8 30.5 66.3Z',
  finA:'M33.3 21.4Q30.9 15.3 24.2 19.8Q28.2 22.7 29 24Z',
  finB:'M39.4 31.9Q43.6 37.1 36.4 40.7Q35.9 35.8 35.1 34.5Z',
  p1:'M22.2 52.9L21.8 52.2L21.4 51.5L21 50.7L20.6 50L20.3 49.2L20 48.4L19.7 47.6L19.5 46.7L19.4 45.9L19.3 45.1L19.3 44.2L19.4 43.4L19.6 42.6L19.8 41.8L20.1 41.1L20.5 40.3L21 39.7L21.5 39L22.2 38.4L22.8 37.8L23.5 37.3L24.3 36.8L25.1 36.4L25.9 36L25.9 36L26 36.9L26.1 37.7L26.2 38.6L26.3 39.4L26.3 40.1L26.4 40.9L26.4 41.6L26.4 42.3L26.4 43L26.3 43.6L26.2 44.2L26 44.9L25.8 45.5L25.6 46.1L25.3 46.7L25 47.3L24.6 48L24.3 48.6L23.9 49.3L23.6 50L23.2 50.7L22.9 51.4L22.5 52.1L22.2 52.9Z',
  p2:'M30 33.2L30.1 32.4L30.1 31.6L30.2 30.9L30.4 30.1L30.6 29.3L30.9 28.6L31.2 27.9L31.6 27.3L32 26.7L32.5 26.2L33 25.7L33.6 25.3L34.2 24.9L34.9 24.7L35.5 24.4L36.3 24.3L37 24.2L37.8 24.2L38.5 24.2L39.3 24.3L40 24.5L40.8 24.6L41.5 24.8L42.3 25.1L42.3 25.1L41.8 25.7L41.4 26.3L41 26.9L40.6 27.5L40.2 28.1L39.9 28.6L39.5 29.2L39.1 29.7L38.8 30.1L38.4 30.5L38 30.9L37.5 31.2L37.1 31.5L36.6 31.8L36.1 32L35.6 32.2L35 32.4L34.3 32.5L33.7 32.6L33 32.7L32.3 32.8L31.5 32.9L30.8 33.1L30 33.2Z',
  sun:[75,39.9], eyes:[[61.2,21.3],[58.5,28.4]]
};
let markN=0;
function mark(size,opts){
  const o=opts||{}, id='cdm'+(++markN), swim=o.swim&&PF.motion;
  const defs=`<defs><radialGradient id="${id}w" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#2f8a83"/><stop offset=".55" stop-color="#1a5c60"/><stop offset="1" stop-color="#0c3137"/></radialGradient>
    <radialGradient id="${id}s"><stop offset="0" stop-color="#ffe3a3"/><stop offset=".6" stop-color="#f0b35a"/><stop offset="1" stop-color="#f0b35a" stop-opacity="0"/></radialGradient></defs>`;
  const disc=`<circle cx="50" cy="50" r="48" fill="url(#${id}w)"/>
    <circle cx="50" cy="50" r="41" fill="none" stroke="#cfe9e3" stroke-opacity=".13"/>`;
  const glow=op=>o.flat?'':`<circle cx="${MK.sun[0]}" cy="${MK.sun[1]}" r="11" fill="url(#${id}s)"${op?` opacity="${op}"`:''}/>`;
  const sun=`<circle cx="${MK.sun[0]}" cy="${MK.sun[1]}" r="5.2" fill="#f5c65a"/>`;
  const koi=`<g${o.flat?'':' filter="drop-shadow(0 2px 1.5px rgba(5,25,28,.45))"'}>
        <path d="${MK.tail}" fill="#ec7a45" opacity=".9"/><path d="${MK.finA}" fill="#ec7a45" opacity=".8"/><path d="${MK.finB}" fill="#ec7a45" opacity=".8"/>
        <path d="${MK.body}" fill="#ec7a45"/><path d="${MK.p1}" fill="#fbf8f2"/><path d="${MK.p2}" fill="#fbf8f2" opacity=".92"/>
        ${size>=40?MK.eyes.map(e=>`<circle cx="${e[0]}" cy="${e[1]}" r="1.1" fill="#3a1a0c" opacity=".75"/>`).join(''):''}
      </g>`;
  if(!swim) return `<svg class="cd-mark" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">${defs}${disc}${glow('.55')}${sun}${koi}</svg>`;
  /* Swimming, it's built as stacked layers, each animation on a whole
     element: the pond is still, a ring carrying the sun and the koi turns,
     the glow breathes and the koi surges within it. The GPU does all of it;
     nothing inside an SVG animates, so nothing is repainted per frame. */
  const L=(inner,style)=>`<svg viewBox="0 0 100 100" aria-hidden="true" style="position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;${style||''}">${inner}</svg>`;
  const at=`${MK.sun[0]}% ${MK.sun[1]}%`;
  return `<span class="cd-mark" style="position:relative;display:block;width:${size}px;height:${size}px" aria-hidden="true">
    <svg class="cd-disc" width="${size}" height="${size}" viewBox="0 0 100 100" style="display:block">${defs}${disc}</svg>
    <span style="position:absolute;left:0;top:0;width:100%;height:100%;animation:cd-orbit 48s linear infinite">
      ${o.flat?'':L(glow(),`transform-origin:${at};animation:cd-glow 4s ease-in-out infinite`)}
      ${L(sun)}
      ${L(koi,'transform-origin:50% 50%;animation:cd-surge 3.6s ease-in-out infinite alternate')}
    </span></span>`;
}
window.Pond={PF,mark,h,css,rnd,reseed,hs,SPEC,SP,RAR,POOL,rollSpecies,creature,fish,shadowFish,lotus,
  loop,swimmer,caustics,ripple,glints,petals,pad,deep,plant,PLANT,bakeCaustics,morph};
})();
