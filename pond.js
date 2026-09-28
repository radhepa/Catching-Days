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
const KEBAB_ATTR=new Set(['strokeWidth','strokeLinecap','strokeLinejoin','strokeDasharray','strokeOpacity','fillOpacity','clipPath']);
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
const PF={ motion:true, ripples:true, petals:true };

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
  const tl=ex.has('fork')?'fork':ex.has('lunate')?'lunate':ex.has('sword')?'sword':o.tl;
  const o2=[]; const add=(tag,a)=>o2.push(h(tag,a));
  const f=n=>+n.toFixed(2);
  const d=`M${L} 0 C${L} ${f(-H*b)} ${f(pk+(L-pk)*.45)} ${-H} ${f(pk)} ${-H} C${f(pk-(pk+L)*.45)} ${-H} ${f(-L*.55)} ${f(-pw*1.6)} ${-L} ${f(-pw)} L${-L} ${f(pw)} C${f(-L*.55)} ${f(pw*1.6)} ${f(pk-(pk+L)*.45)} ${H} ${f(pk)} ${H} C${f(pk+(L-pk)*.45)} ${H} ${L} ${f(H*b)} ${L} 0 Z`;
  const TL={fork:`M${T} 0 L${T-13} -8 Q${T-8} 0 ${T-13} 8 Z`,lunate:`M${T} 0 Q${T-7} -3 ${T-13} -10 Q${T-8} 0 ${T-13} 10 Q${T-7} 3 ${T} 0 Z`,
    point:`M${T} -1.6 Q${T-8} -1 ${T-14} 0 Q${T-8} 1 ${T} 1.6 Z`,fan:`M${T} 0 Q${T-10} -13 ${T-16} -6 Q${T-12} 0 ${T-16} 6 Q${T-10} 13 ${T} 0 Z`,
    round:`M${T} 0 Q${T-6} -8 ${T-11} -4 Q${T-12} 0 ${T-11} 4 Q${T-6} 8 ${T} 0 Z`,heter:`M${T} -1.4 Q${T-8} -2.4 ${T-17} -5 Q${T-11} 0 ${T-10} 1.8 Q${T-5} 1.8 ${T} 1.4 Z`,
    sword:`M${T} 0 L${T-12} -7 Q${T-7} -1 ${T-9} 3 L${T-22} 6 L${T-8} 5 Q${T-4} 3 ${T} 0 Z`};
  const ts=Math.min(1,.45+H*.12), eyeX=L-Math.max(2.2,Math.min(H*.7,L*.28)), eyeR=Math.min(1.9,Math.max(.85,H*.2))*(ex.has('bigeye')?1.5:1);
  if(ex.has('spikes')) for(let i=0;i<12;i++){ const s=i%2?1:-1, x=f(-L*.5+i*L*.09); add('path',{d:`M${x} ${f(s*H*.6)} L${f(x-4)} ${s*(H+8+(i%3)*2)}`,stroke:p,strokeWidth:1.2,strokeLinecap:'round',opacity:.9}); }
  if(ex.has('whisk')) add('path',{d:`M${L-.5} -1.6 Q${L+5} -5 ${L+9} -8 M${L-.5} 1.6 Q${L+5} 5 ${L+9} 8 M${L-1.5} -2.5 Q${L+1} -6 ${L+2} -9 M${L-1.5} 2.5 Q${L+1} 6 ${L+2} 9`,stroke:c,strokeWidth:.9,fill:'none',strokeLinecap:'round'});
  if(ex.has('horns')) add('path',{d:`M${f(L*.6)} ${f(-H*.55)} L${L+4} ${f(-H*.55-2)} M${f(L*.6)} ${f(H*.55)} L${L+4} ${f(H*.55+2)}`,stroke:c,strokeWidth:1.8,strokeLinecap:'round'});
  if(ex.has('snout')) add('ellipse',{cx:L+6,cy:0,rx:7.5,ry:f(Math.max(1.3,H*.24)),fill:c});
  if(ex.has('bill')) add('path',{d:`M${L-1} -1.5 L${L+15} 0 L${L-1} 1.5 Z`,fill:c});
  if(ex.has('duck')) add('ellipse',{cx:L+2.5,cy:0,rx:5,ry:f(H*.55),fill:c});
  if(ex.has('saw')){ add('path',{d:`M${L-2} -2 L${L+14} -1.5 L${L+14} 1.5 L${L-2} 2 Z`,fill:p}); for(let i=0;i<5;i++) add('path',{d:`M${f(L+2+i*2.6)} -1.5 l0 -2.4 M${f(L+2+i*2.6)} 1.5 l0 2.4`,stroke:p,strokeWidth:1}); }
  if(ex.has('wide')) add('ellipse',{cx:0,cy:0,rx:L+2,ry:H+3.5,fill:c,opacity:.5});
  if(ex.has('feelers')) [-1,1].forEach(s=>add('path',{d:`M${f(L*.15)} ${f(s*H*.7)} Q${f(-L*.3)} ${s*(H+3)} ${f(-L*1.1)} ${s*(H+5)}`,stroke:p,strokeWidth:.9,fill:'none',strokeLinecap:'round',opacity:.9}));
  if(TL[tl]) o2.push(h('g',{transform:`translate(${T} 0) scale(${f(ts)}) translate(${-T} 0)`},h('path',{d:TL[tl],fill:c,opacity:.85,style:wagS(w)})));
  if(ex.has('shark')) [-1,1].forEach(s=>add('path',{d:`M${f(L*.35)} ${f(s*H*.7)} Q${f(L*.05)} ${s*(H+5)} ${f(-L*.12)} ${s*(H+8)} Q${f(L*.1)} ${s*(H+2)} ${f(L*.05)} ${f(s*H*.7)} Z`,fill:c,opacity:.9}));
  else if(!ex.has('wide')) [-1,1].forEach(s=>{ add('ellipse',{cx:f(L*.3),cy:s*(H+1),rx:f(4.5*ts),ry:f(1.8*ts),transform:`rotate(${s*30} ${f(L*.3)} ${s*(H+1)})`,fill:c,opacity:.7});
    if(tl!=='point') add('ellipse',{cx:f(-L*.28),cy:f(s*H*.85),rx:f(2.6*ts),ry:f(ts),transform:`rotate(${s*28} ${f(-L*.28)} ${f(s*H*.85)})`,fill:c,opacity:.6}); });
  add('path',{d,fill:c});
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
  pat.push(h('ellipse',{cx:f(-L*.05),cy:0,rx:f(L*.85),ry:f(H*.22),fill:'#0b2226',opacity:.12}),h('ellipse',{cx:f(L*.15),cy:f(-H*.45),rx:f(L*.55),ry:f(H*.22),fill:'#ffffff',opacity:.16}));
  o2.push(h('g',{clipPath:`url(#${id})`},pat));
  if(ex.has('sail')) add('ellipse',{cx:f(-L*.15),cy:0,rx:f(L*.7),ry:f(H*.42),fill:p,opacity:.55});
  else if(!ex.has('wide')) add('ellipse',{cx:f(-L*.15),cy:0,rx:f(L*.45),ry:f(Math.max(.6,H*.1)),fill:p,opacity:.45});
  if(ex.has('hump')) add('circle',{cx:f(L*.62),cy:0,r:f(H*.6),fill:p,opacity:.9});
  if(ex.has('hammer')){ add('ellipse',{cx:f(L*.95),cy:0,rx:2.4,ry:f(H*2.3),fill:c}); [-1,1].forEach(s=>add('circle',{cx:f(L*.95),cy:f(s*H*2.1),r:1.1,fill:'#1f2e2c'})); }
  else [-1,1].forEach(s=>{ add('circle',{cx:f(eyeX),cy:f(s*H*.52),r:f(eyeR),fill:'#1f2e2c'}); add('circle',{cx:f(eyeX+eyeR*.3),cy:f(s*H*.52-eyeR*.3),r:f(eyeR*.35),fill:'#ffffff',opacity:.8}); });
  if(ex.has('lure')){ add('path',{d:`M${f(L*.6)} 0 Q${L+6} -8 ${L+9} -3`,stroke:p,strokeWidth:.9,fill:'none'}); add('circle',{cx:L+9,cy:-3,r:3.2,fill:'#f7f3c0',opacity:.35}); add('circle',{cx:L+9,cy:-3,r:1.6,fill:'#f7f3c0'}); }
  return [h('defs',null,h('clipPath',{id},h('path',{d}))),...o2];
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
const SP={}; SPEC.forEach((s,i)=>{ s.no=i+1; SP[s.k]=s; });
const RAR={Common:{ink:'#3f774d',bg:'#dcebd9'},Uncommon:{ink:'#2f7a74',bg:'#d4e8e4'},Rare:{ink:'#715c95',bg:'#e6e0f1'},Legendary:{ink:'#8a5f1f',bg:'#f5e4c2'}};
/* what a finished task can release: everything except the milestone species,
   which only ever arrive by habit */
const POOL=SPEC.filter(s=>!s.milestone), PW={Common:60,Uncommon:27,Rare:10,Legendary:3}, byR={};
POOL.forEach(s=>(byR[s.rar]=byR[s.rar]||[]).push(s));
/* 30% the class's own species, otherwise weighted by rarity. Seeded by the
   task's id, so a task always releases the same fish — unticking and
   re-ticking can't reroll it. */
function rollSpecies(taskId,classKey){
  const r=hs(taskId+'·pond');
  const first=r();
  if(classKey&&SP[classKey]&&first<.3) return classKey;
  let x=r()*100, Rr='Common';
  for(const q of ['Common','Uncommon','Rare','Legendary']){ if((x-=PW[q])<0){ Rr=q; break; } }
  const a=byR[Rr]; return a[Math.floor(r()*a.length)].k;
}

/* ── one creature as an inline <svg> ──
   extra: 'flat' drops the drop shadow (icons, silhouettes); an object is
   merged into the svg's style. */
function creature(kind,c,p,s,w,extra){
  const sp=SP[kind]; if(!DRAW[kind]&&!sp) kind='koi';
  const shadow=kind==='ghost'?'drop-shadow(0 0 6px #ffffffcc)':extra==='flat'?'none':'drop-shadow(0 6px 5px rgba(5,25,28,.45))';
  return h('svg',{width:+(64*s).toFixed(1),height:+(32*s).toFixed(1),viewBox:'-34 -16 64 32',
    style:{display:'block',overflow:'visible',filter:shadow,...(extra&&extra!=='flat'?extra:{})}},DRAW[kind](c,p,w));
}
/* a species in its own colours */
const fish=(k,s,w,extra)=>{ const d=SP[k]||SP.koi; return creature(d.k,d.c,d.p,s??d.s,w,extra); };
/* a species as a dark silhouette — for ones you haven't found */
const shadowFish=(k,s,col)=>{ const d=SP[k]||SP.koi; return creature(d.k,col||'#0a2a2f',col||'#0a2a2f',s??d.s,0,'flat'); };

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
function swimmer(path,dur,rev,node,z,extraStyle){
  return h('div',{class:'pf-swim',style:{position:'absolute',left:0,top:0,offsetPath:`path('${path}')`,offsetRotate:rev?'auto 180deg':'auto',
    offsetDistance:(rnd()*100).toFixed(0)+'%',animation:PF.motion?`pf-swim ${dur}s linear ${(-rnd()*dur).toFixed(1)}s infinite${rev?' reverse':''}`:'none',zIndex:z||2,...(extraStyle||{})}},node);
}
/* moving light on the water: two turbulence layers drifting past each other */
function caustics(w,hgt,op){
  return h('div',{class:'pf-caustics',style:{position:'absolute',left:0,top:0,width:w,height:hgt,zIndex:3,pointerEvents:'none',mixBlendMode:'screen',opacity:op}},
    h('svg',{width:Math.round(w+200),height:Math.round(hgt+100),style:{position:'absolute',left:-20,top:-20,animation:PF.motion?'pf-drift1 26s ease-in-out infinite alternate':'none'}},h('rect',{width:'100%',height:'100%',filter:'url(#pfCausticA)'})),
    h('svg',{width:Math.round(w+200),height:Math.round(hgt+100),style:{position:'absolute',left:-120,top:-40,opacity:.7,animation:PF.motion?'pf-drift2 34s ease-in-out infinite alternate':'none'}},h('rect',{width:'100%',height:'100%',filter:'url(#pfCausticB)'})));
}
const ripple=(x,y,size,delay,dur)=>!PF.ripples?'':h('div',{style:{position:'absolute',left:x,top:y,width:size,height:size,borderRadius:'50%',border:'1.5px solid #cfe9e3',boxShadow:'0 0 0 6px #cfe9e30f',opacity:0,
  transform:'translate(-50%,-50%)',animation:PF.motion?`pf-ripple ${dur||6}s ease-out ${delay}s infinite`:'none',zIndex:3,pointerEvents:'none'}});
const glints=(w,hgt,n)=>Array.from({length:n},()=>h('div',{style:{position:'absolute',left:+(rnd()*w).toFixed(1),top:+(rnd()*hgt).toFixed(1),width:+(10+rnd()*14).toFixed(1),height:2,borderRadius:2,background:'#ffffffcc',opacity:0,zIndex:6,pointerEvents:'none',
  animation:PF.motion?`pf-glint ${(2.5+rnd()*3).toFixed(1)}s ease-in-out ${(rnd()*6).toFixed(1)}s infinite`:'none'}})).join('');
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

/* the two turbulence filters caustics() points at — injected once per page */
const DEFS=h('svg',{width:0,height:0,style:{position:'absolute'},'aria-hidden':'true'},h('defs',null,
  h('filter',{id:'pfCausticA',x:0,y:0,width:'100%',height:'100%'},
    h('feTurbulence',{type:'turbulence',baseFrequency:'0.011 0.019',numOctaves:2,seed:4}),
    h('feColorMatrix',{type:'matrix',values:'0 0 0 0 0.82  0 0 0 0 1  0 0 0 0 0.94  -3.4 0 0 0 1.25'})),
  h('filter',{id:'pfCausticB',x:0,y:0,width:'100%',height:'100%'},
    h('feTurbulence',{type:'turbulence',baseFrequency:'0.016 0.011',numOctaves:2,seed:9}),
    h('feColorMatrix',{type:'matrix',values:'0 0 0 0 0.9  0 0 0 0 1  0 0 0 0 0.9  -3.8 0 0 0 1.2'}))));
function injectDefs(){
  if(document.getElementById('pf-defs')) return;
  const d=document.createElement('div'); d.id='pf-defs'; d.innerHTML=DEFS;
  (document.body||document.documentElement).appendChild(d);
}

window.Pond={PF,h,css,rnd,reseed,hs,SPEC,SP,RAR,POOL,rollSpecies,creature,fish,shadowFish,
  loop,swimmer,caustics,ripple,glints,petals,pad,deep,plant,PLANT,injectDefs};
})();
