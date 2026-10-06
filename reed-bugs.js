/* reed-bugs.js · Catching Days
   The bug of the day on Today's reed bed: the reed drawing, all the bugs
   (art, flight plans, field notes), the daily rotation and the renderer.
   Loaded by catching-days.html AND bug-library.html, so the library
   always plays exactly what the app plays. Read BUG-LIBRARY.md before
   changing anything here; tweaks the owner makes in the library live in
   bug-tweaks.json (speed, size, off, and flagged change requests).
   Needs window.Pond (pond.js) as PondArt, looked up when first used. */

const REED_INK=['#8fae7c','#6f9e7a','#5f9470','#a3c08a','#7fa878','#4f8563'];
const rf1=n=>+n.toFixed(1);
function reedLeaf(h,bw,c,side,ink,rib){
  const w=rf1(bw+Math.abs(c)*2+2), m=w/2, tip=rf1(m+side*c);
  const d=`M${rf1(m-bw/2)} ${h} Q${rf1(m-bw*.25+side*c*.3)} ${rf1(h*.45)} ${tip} 0 Q${rf1(m+bw*.3+side*c*.4)} ${rf1(h*.5)} ${rf1(m+bw/2)} ${h}Z`;
  return {w,svg:`<svg viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="${ink}"/>${rib?`<path d="M${rf1(m)} ${h} Q${rf1(m+side*c*.35)} ${rf1(h*.5)} ${tip} 1.5" stroke="${rib}" stroke-width=".7" fill="none" opacity=".5"/>`:''}</svg>`};
}
function reedCattail(h){
  return {w:6,svg:`<svg viewBox="0 0 6 ${h}" aria-hidden="true"><path d="M3 ${h} Q2.4 ${rf1(h*.6)} 3 ${rf1(h*.2)}" stroke="#6f8f5f" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <path d="M3 ${rf1(h*.22)} L3 ${rf1(h*.03)}" stroke="#6b4a2f" stroke-width=".9" stroke-linecap="round"/>
    <rect x="1" y="${rf1(h*.19)}" width="4" height="${rf1(h*.3)}" rx="2" fill="#8a5a3b"/>
    <rect x="1.7" y="${rf1(h*.22)}" width="1.1" height="${rf1(h*.22)}" rx=".55" fill="#b5825a" opacity=".85"/></svg>`};
}
/* one leaf or cattail, as a box that sways (.rs) around its foot, holding
   a box that parts on hover (.rp) */
function reedPart(x,p,lean,part,amp,t,r){
  const now=Date.now()/1000, d=-((now+r()*t)%(t*2)).toFixed(2);
  return `<i class="rs" style="left:${rf1(x-p.w/2)}px;width:${p.w}px;height:${p.h}px;--r:${lean}deg;--a:${amp}deg;--t:${t}s;--d:${d}s"><i class="rp" style="--p:${part}deg">${p.svg}</i></i>`;
}

/* ── the bug of the day ──
   One bug visits the reed bed each day. Every stretch of as many days as
   there are bugs is a fresh shuffle of all of them, and a bug never shows
   up two days running. Each one does what that insect really does
   around reeds and cattails: a dragonfly patrols from cattail tip to cattail
   tip, a honeybee works the pollen spike, a ladybug climbs a blade to the
   tip before it flies, a stonefly climbs out of the water and leaves its
   skin on the stem, and so on. Paths are worked out from where the leaves
   and cattails actually stand (bedGeo), so the perches line up with the
   drawing. Moves are one transform keyframe track; the wings (resting or
   buzzing), any alternate pose, anything carried, fading out of sight and
   the little props (a shed skin, splash rings, spittle) are opacity tracks
   on the same clock. Tap the bug to add it to the bug collection
   (db.pond.bugs). Motion off draws the bug still, sitting on a perch. */
const RB_WING='fill="#e4f0f1" stroke="#9cc5c9" stroke-width=".35"';
function bedRot(x,lean,lx,ly){ const a=lean*Math.PI/180, co=Math.cos(a), si=Math.sin(a);
  return [rf1(x+lx*co+ly*si), rf1(34+lx*si-ly*co)]; }
function bedGeo(leaves,cats){
  const used=new Set();
  const g={leaves,cats,used,
    /* a point up a cattail's stem (0 foot … 1 top of the spike) */
    cat(i,f){ used.add(cats[i]); return bedRot(cats[i].x,cats[i].lean,0,cats[i].h*f); },
    catUp:i=>cats[i].lean,
    /* a point along a leaf's midrib (0 foot … 1 tip), and which way is up there */
    leaf(j,s){ const L=leaves[j]; used.add(L);
      return bedRot(L.x,L.lean,L.side*L.c*(2*s*(1-s)*.35+s*s),L.h*s); },
    leafUp(j,s){ const L=leaves[j];
      return rf1(L.lean+Math.atan2(L.side*L.c*(.7*(1-2*s)+2*s),L.h)*180/Math.PI); },
    /* the tallest leaf standing within `span` of x */
    near(x,span=14,minH=0){ let best=-1;
      leaves.forEach((L,j)=>{ if(Math.abs(L.x-x)<=span&&L.h>=minH&&(best<0||L.h>leaves[best].h)) best=j; });
      return best<0?leaves.reduce((b,L,j)=>Math.abs(L.x-x)<Math.abs(leaves[b].x-x)?j:b,0):best; }};
  return g;
}
/* A flight plan: holds on a perch, hovers, flights and crawls, turned into
   keyframe stops. Facing flips happen in a quick turn before a flight, and
   a perch's angle is settled in a short beat on landing, so nothing slowly
   spins across a whole flight. `up:θ` means "head pointing up a stem that
   leans θ" (θ+180 hangs head-down), `tilt` is a nose angle for a flat
   perch. mark() notes the time, for poses and props that follow the plan. */
function bugPlan([x,y],o={},rnd=Math.random){
  const S=[], M={}, st={t:0,x,y,f:o.f||1,r:0};
  const rot=q=>{ const r=q.up!=null?(st.f>0?q.up-90:q.up+90):(q.tilt||0)*st.f; return rf1(((r+180)%360+360)%360-180); };
  st.r=rot(o);
  const push=(fly,e)=>S.push({t:rf1(st.t*100)/100,x:st.x,y:st.y,r:st.r,f:st.f,fly,e});
  /* stay put for s seconds, jiggling by amp (a hover's hum, a crane fly's bounce) */
  const jig=(s,amp,every,fly)=>{ const bx=st.x, by=st.y, n=amp?Math.max(2,Math.round(s/every)):1;
    for(let i=0;i<n;i++){ if(i){ st.x=rf1(bx+(rnd()-.5)*amp); st.y=rf1(by+(rnd()-.5)*amp*1.6); }
      push(fly,amp?'ease-in-out':'linear'); st.t+=s/n; }
    st.x=bx; st.y=by; };
  const api={
    mark(n){ M[n]=rf1(st.t*100)/100; return api; },
    at(){ return [st.x,st.y]; },
    hold(s,q={}){ jig(s,q.bob||0,q.every||.5,false); return api; },
    hover(s,q={}){ jig(s,q.jit||0,q.every||.35,true); return api; },
    to(p,s,q={}){ const [x,y]=p, nf=Math.abs(x-st.x)>.8?Math.sign(x-st.x):st.f, air=rf1((q.air||0)*nf);
      if(nf!==st.f||st.r!==air){ push(true,'ease-out'); st.t+=.15; st.f=nf; st.r=air; }
      push(!q.glide,q.e||'ease-in-out'); st.t+=s; st.x=x; st.y=y;
      const pr=rot(q); if(pr!==st.r){ push(true,'ease-in-out'); st.t+=.15; st.r=pr; }
      return api; },
    /* walking or swimming; face:true turns to face the way it's going */
    crawl(p,s,q={}){ if(q.face){ const nf=Math.abs(p[0]-st.x)>.3?Math.sign(p[0]-st.x):st.f;
        if(nf!==st.f){ push(false,'linear'); st.t+=.1; st.f=nf; st.r=rot(q); } }
      push(false,'linear'); st.t+=s; st.x=p[0]; st.y=p[1]; st.r=rot(q); return api; },
    close(){ const a=S[0];
      if(st.f!==a.f||st.r!==a.r||st.x!==a.x||st.y!==a.y){ push(true,'ease-in-out'); st.t+=.15; }
      S.push({...a,t:rf1(st.t*100)/100}); return {S,T:S[S.length-1].t,M}; }};
  return api;
}
const RB_DART='cubic-bezier(.25,.1,.2,1)';
/* a prop that sits in the bed: a centred little svg (w×h, drawn around 0,0) */
const rbProp=(p,w,h,inner,o={})=>({x:p[0],y:p[1],r:o.r||0,cls:o.cls||'',win:o.win||null,
  html:`<svg width="${w}" height="${h}" viewBox="${-w/2} ${-h/2} ${w} ${h}" style="left:${-w/2}px;top:${-h/2}px">${inner}</svg>`});
const rbRing=(p,win)=>({x:p[0],y:p[1],r:0,win,html:'<b class="rb-ring"></b><b class="rb-ring two"></b>'});
const RB_STONE_NYMPH=`<path d="M2 5.4 L-.4 4.2 M2 5.6 L-.2 7" stroke="#6b5a40" stroke-width=".35"/><path d="M2 5.4 Q6.4 3.2 11.6 4.4 Q13.6 5.2 11.8 6.3 Q6.6 7 2 5.8Z" fill="#8a7658"/>
      <path d="M4 4.5 v1.8 M5.8 4.1 v2.4 M7.6 4 v2.5" stroke="#6b5a40" stroke-width=".3"/><g fill="#5e4e38"><ellipse cx="9.2" cy="4.4" rx="1.1" ry=".55"/><ellipse cx="10.6" cy="4.5" rx=".9" ry=".5"/></g>
      <circle cx="13" cy="5.3" r="1" fill="#6b5a40"/><path d="M9.4 6.2 l-1.6 1.4 M10.6 6.3 l-.2 1.5 M11.8 6.1 l1.2 1.3" stroke="#6b5a40" stroke-width=".45" fill="none"/><path d="M13.6 4.8 Q15.4 3.6 16.6 3.6" stroke="#6b5a40" stroke-width=".28" fill="none"/>`;
const RB_ICH_FRONT=`<path d="M9.6 5.6 L10.6 5.4" stroke="#2a221c" stroke-width=".5"/><path d="M11 6 l-1.6 1.8 M11.8 6.1 l-.2 1.9 M12.6 6 l1.4 1.6" stroke="#d9782a" stroke-width=".4" fill="none"/>
      <ellipse cx="11.9" cy="5.2" rx="1.6" ry="1.1" fill="#2a221c"/><circle cx="14" cy="5" r=".95" fill="#2a221c"/><circle cx="14.5" cy="5.3" r=".35" fill="#f2efe4"/>
      <path d="M14.3 4.4 Q16.6 1.6 19.4 2 M14.1 4.3 Q15.6 .8 18.2 .2" stroke="#2a221c" stroke-width=".25" fill="none"/><path d="M16.2 2.5 l.9 -.4" stroke="#f2efe4" stroke-width=".3"/>`;
const RB_JEWEL_BODY=`<path d="M1 6.2 L12.8 6.2" stroke="#2c8a64" stroke-width="1.2" stroke-linecap="round"/><path d="M2 5.9 L12 5.9" stroke="#8fe0b8" stroke-width=".35" opacity=".8"/>
      <path d="M13.6 7 l-.8 1.7 M14.4 7.1 l.1 1.8 M15.1 7 l.9 1.6" stroke="#10241c" stroke-width=".35" fill="none"/>
      <ellipse cx="14.3" cy="6" rx="2" ry="1.4" fill="#2c8a64"/><circle cx="16.9" cy="5.8" r="1.25" fill="#1c3a30"/><circle cx="17.3" cy="5.4" r=".4" fill="#cfeee0"/>`;
const RB_LONGLEG_BODY=`<path d="M4.6 5.4 L3.4 7.2 L3 9 M5.4 5.6 L5.4 7.4 L5.6 9 M6.2 5.4 L7.4 7 L8 9" stroke="#3a4a2a" stroke-width=".3" fill="none"/>
      <path d="M1 4.6 Q3 3.6 5 4.4" stroke="#3f8a4a" stroke-width="1.2" stroke-linecap="round" fill="none"/>
      <ellipse cx="5.8" cy="4.4" rx="1.3" ry="1.2" fill="#3a9a5a"/><path d="M5 3.8 Q6 3.4 6.8 3.8" stroke="#b8e0a0" stroke-width=".35" fill="none"/>
      <circle cx="7.6" cy="4.6" r=".9" fill="#2f7a48"/><circle cx="7.8" cy="4.3" r=".45" fill="#9a4a28"/>`;
const REED_BUGS=[
  { k:'dragonfly', name:'dragonfly', W:22,H:14,ax:12,ay:8.8,bz:.09,bs:.55,wo:'11px 7.7px', same:true,
    wings:`<g ${RB_WING} opacity=".85"><ellipse cx="9" cy="3.4" rx="5.6" ry="1.9" transform="rotate(-14 9 3.4)"/><ellipse cx="13.4" cy="3.6" rx="4.8" ry="1.7" transform="rotate(16 13.4 3.6)"/>
      <ellipse cx="9" cy="10.6" rx="5.6" ry="1.9" transform="rotate(14 9 10.6)"/><ellipse cx="13.4" cy="10.4" rx="4.8" ry="1.7" transform="rotate(-16 13.4 10.4)"/></g>`,
    under:true,
    body:`<path d="M1.5 7 L15 7" stroke="#2f6f6a" stroke-width="1.5" stroke-linecap="round"/><path d="M3.5 7h.6M6 7h.6M8.5 7h.6M11 7h.6" stroke="#9fd0c4" stroke-width="1.6"/>
      <ellipse cx="15.6" cy="7" rx="2.2" ry="1.7" fill="#2f6f6a"/><circle cx="17.8" cy="7" r="1.5" fill="#3f8a82"/><circle cx="18.3" cy="6.5" r=".45" fill="#e8f6f2"/>`,
    /* patrols its patch: perches on a cattail tip, darts out, takes the next tip */
    plan:(g,rnd)=>{ const A=g.cat(0,1), B=g.cat(2,1), C=g.cat(1,1);
      return bugPlan(A,{tilt:-6},rnd).hold(3.2).to([62,-12],1.1,{e:RB_DART}).hover(.9,{jit:.7}).to(B,1.2,{tilt:-4,e:RB_DART}).hold(3)
        .to([104,-17],.8,{e:RB_DART}).to(C,.9,{tilt:5,e:RB_DART}).hold(2.6).to([20,-9],1.4,{e:RB_DART}).hover(.6,{jit:.7}).to(A,.8,{tilt:-6}).close(); }},
  { k:'damselfly', name:'damselfly', W:20,H:10,ax:13.6,ay:7.2,bz:.07,bs:-.4,wo:'14px 5.5px',
    rest:`<g ${RB_WING} opacity=".85"><path d="M14 5.3 Q9 3.2 4.5 4.3 Q9 5 14 5.6Z"/><path d="M14 5.2 Q9.5 2.5 5.5 3.3 Q9.5 4.3 14 5.4Z"/></g><circle cx="5.4" cy="3.6" r=".5" fill="#1d3550"/>`,
    fly:`<g ${RB_WING} opacity=".8"><ellipse cx="11" cy="2.9" rx="4.4" ry="1.2" transform="rotate(-16 11 2.9)"/><ellipse cx="13.2" cy="2.7" rx="4" ry="1.1" transform="rotate(-40 13.2 2.7)"/></g>`,
    body:`<path d="M1 6.2 L12.8 6.2" stroke="#3b8fd6" stroke-width="1.1" stroke-linecap="round"/><path d="M1 6.2h1.2M3.4 6.2h.7M5.6 6.2h.7M7.8 6.2h.7M10 6.2h.7" stroke="#1d3550" stroke-width="1.2"/>
      <path d="M13.6 7 l-.8 1.7 M14.4 7.1 l.1 1.8 M15.1 7 l.9 1.6" stroke="#1d3550" stroke-width=".35" fill="none"/>
      <ellipse cx="14.3" cy="6" rx="2" ry="1.3" fill="#3b8fd6"/><path d="M13 5.3 L15.6 5.3" stroke="#1d3550" stroke-width=".5"/>
      <circle cx="16.9" cy="5.8" r="1.3" fill="#2d6fa8"/><circle cx="17.3" cy="5.4" r=".45" fill="#e8f4ff"/>`,
    /* flits low from leaf tip to leaf tip and sits a long while, wings folded */
    plan:(g,rnd)=>{ const a=g.near(15,8,20), b=g.near(42,8,20), c=g.near(66,6,20), d=g.near(94,8,18);
      return bugPlan(g.leaf(a,1),{tilt:-8},rnd).hold(4.2).to(g.leaf(b,1),1.6,{tilt:-6}).hold(3.6).to([56,4],1.2).hover(.8,{jit:.6,every:.4})
        .to(g.leaf(c,1),.9,{tilt:4}).hold(3.4).to(g.leaf(d,1),1.5,{tilt:-5}).hold(3.2).to([50,-6],2).to(g.leaf(a,1),1.6,{tilt:-8}).close(); }},
  { k:'honeybee', name:'honeybee', W:11,H:9,ax:5.4,ay:7.6,bz:.045,bs:-.5,wo:'7.6px 3.2px',
    rest:`<ellipse cx="4.8" cy="2.9" rx="3.2" ry="1.1" transform="rotate(-8 4.8 2.9)" ${RB_WING} opacity=".85"/>`,
    fly:`<ellipse cx="6.6" cy="1.6" rx="2.9" ry="1.5" transform="rotate(-30 6.6 1.6)" ${RB_WING} opacity=".8"/>`,
    body:`<path d="M4 6.6 l-.6 1.2 M5.5 6.8 l0 1.1 M7 6.6 l.6 1.1" stroke="#3b2a1a" stroke-width=".45" stroke-linecap="round"/><circle cx="3.6" cy="7.5" r=".95" fill="#f2c230"/>
      <ellipse cx="4.2" cy="5" rx="3.5" ry="2.4" fill="#e6a531"/><path d="M3 2.8 Q3.6 5 3 7.2 M5 2.7 Q5.6 5 5 7.3" stroke="#3b2a1a" stroke-width=".9" fill="none"/><path d="M.8 5.2 L.2 5.4" stroke="#3b2a1a" stroke-width=".5"/>
      <ellipse cx="7.8" cy="4.6" rx="1.8" ry="1.8" fill="#8a5a2a"/><circle cx="7.6" cy="4" r="1" fill="#c08a44" opacity=".7"/>
      <circle cx="9.7" cy="5" r="1.3" fill="#3b2a1a"/><path d="M10.2 4 Q10.8 2.6 11.4 2.8" stroke="#3b2a1a" stroke-width=".4" fill="none"/>`,
    /* cattails shed pollen from the spike above the brown head, and bees
       gather it: land on the spike, work down it, bumble to the next */
    plan:(g,rnd)=>{ const vis=i=>[g.cat(i,.95),g.cat(i,.8),g.catUp(i)];
      const [a1,a2,au]=vis(0), [b1,b2,bu]=vis(1), [c1,c2,cu]=vis(2);
      return bugPlan(a1,{up:au},rnd).crawl(a2,1.8,{up:au}).hold(1.2,{bob:.4,every:.3}).to([46,-6],.7).to([60,2],.6).to([74,-8],.6).hover(.5,{jit:.8,every:.2})
        .to(b1,.6,{up:bu}).crawl(b2,1.8,{up:bu}).hold(1,{bob:.4,every:.3}).to([100,-4],.6).to([112,-12],.6)
        .to(c1,.5,{up:cu}).crawl(c2,1.6,{up:cu}).hold(1.2,{bob:.4,every:.3}).to([90,-16],.9).to([62,-6],.8).to([44,-14],.7).hover(.5,{jit:.8,every:.2}).to(a1,.6,{up:au}).close(); }},
  { k:'ladybug', name:'ladybug', W:9,H:7,ax:4.4,ay:6.2,bz:.05,bs:-.5,wo:'6px 3.6px',
    rest:`<path d="M.8 5.4 Q.9 1.6 4 1.3 Q7.2 1.4 7.2 5.4Z" fill="#d6372b"/><g fill="#1b1b1b"><circle cx="2.6" cy="3.8" r=".7"/><circle cx="4.4" cy="2.3" r=".6"/><circle cx="5.7" cy="4" r=".7"/></g>
      <path d="M2.4 2.4 Q3.4 1.7 4.6 1.8" stroke="#fff" stroke-width=".45" opacity=".6" fill="none"/>`,
    fly:`<ellipse cx="2.8" cy="2.2" rx="3.4" ry="1" transform="rotate(-20 2.8 2.2)" fill="#eef2f1" stroke="#b9c3c1" stroke-width=".3" opacity=".8"/>`,
    flyStill:`<g transform="rotate(-30 6.8 5)"><path d="M.8 5.4 Q.9 1.6 4 1.3 Q7.2 1.4 7.2 5.4Z" fill="#d6372b"/><g fill="#1b1b1b"><circle cx="2.6" cy="3.8" r=".7"/><circle cx="4.4" cy="2.3" r=".6"/></g></g>`,
    body:`<path d="M2.6 5.6 l-.5 .9 M4.4 5.8 l0 .9 M6.2 5.6 l.5 .9" stroke="#1b1b1b" stroke-width=".45" stroke-linecap="round"/><path d="M1 5.5 L7.4 5.5" stroke="#1b1b1b" stroke-width=".9" stroke-linecap="round"/>
      <path d="M6.8 5.6 Q7 3.4 8.2 3.9 Q9 4.8 8.6 5.6Z" fill="#1b1b1b"/><circle cx="7.6" cy="4.3" r=".4" fill="#fff"/>`,
    wingsFirst:true,
    /* lands low on a blade and walks up it: ladybugs take off from the
       highest point they can reach, so it only flies from the tip */
    plan:(g,rnd)=>{ const a=g.near(42,8,24), b=g.near(76,8,26), up=(j,s)=>({up:g.leafUp(j,s)});
      return bugPlan(g.leaf(a,.3),up(a,.3),rnd).crawl(g.leaf(a,.6),2.6,up(a,.6)).hold(.6).crawl(g.leaf(a,.95),2.2,up(a,.95)).hold(1.4)
        .to([60,-10],1.3).to(g.leaf(b,.3),1.2,up(b,.3)).crawl(g.leaf(b,.62),2.6,up(b,.62)).hold(.5).crawl(g.leaf(b,.95),2.2,up(b,.95)).hold(1.4)
        .to([56,-14],1.5).to(g.leaf(a,.3),1.3,up(a,.3)).close(); }},
  { k:'mayfly', name:'mayfly', W:19,H:16,ax:11.4,ay:12.2,bz:.08,bs:.35,wo:'12.8px 10.8px',
    rest:`<path d="M12.4 10.8 L10.4 7.6 Q11.8 7.6 12.9 10.6Z" fill="#f4efd9" stroke="#bda878" stroke-width=".3" opacity=".85"/>
      <path d="M12.6 10.6 L9.4 .8 Q12.4 .3 14.6 2.4 Q13.8 6.4 13.3 10.6Z" fill="#f4efd9" stroke="#bda878" stroke-width=".35" opacity=".88"/>
      <path d="M12.8 10 L11 2.2 M13 10 L12.6 1.6 M13.1 9 L14 3.2" stroke="#bda878" stroke-width=".25"/>`,
    body:`<path d="M5.6 11.2 Q2.5 10 .6 4.5 M5.6 11.4 Q2 11.2 .2 6.2 M5.6 11.3 Q3 11.6 1 9" stroke="#9a7a4a" stroke-width=".3" fill="none"/>
      <path d="M5.4 11 Q8 12.6 11.4 11.6" stroke="#e3d49a" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M5.4 11 Q8 12.6 11.4 11.6" stroke="#9a7a4a" stroke-width="1.5" stroke-dasharray=".45 1.1" fill="none"/>
      <path d="M13.4 11.8 Q16 11 18.6 9.6 M12.2 12 l-.6 1.8 M12.8 12.1 l.4 1.8" stroke="#8a6f45" stroke-width=".35" fill="none"/>
      <ellipse cx="12.6" cy="11.2" rx="1.6" ry="1.2" fill="#c9b077"/><circle cx="14.4" cy="11" r=".9" fill="#b39660"/><circle cx="14.7" cy="10.8" r=".45" fill="#3a2e20"/>`,
    sailFly:true,
    /* the mating dance: a steep climb, then a slow parachute down on still
       wings, over and over across the reeds, and a long rest on a stem */
    plan:(g,rnd)=>{ const a=g.near(56,6,28), b=g.near(122,8,24), up=j=>({up:g.leafUp(j,.62)});
      const P=bugPlan(g.leaf(a,.62),up(a),rnd).hold(4.5);
      [[64,-4],[78,-2],[94,-3],[108,-5]].forEach(([x,y],i)=>{ P.to([x,y],i?.3:1,{}).to([x+2,-19],.75,{e:'ease-out'}).to([x+8,y+2],2.2,{glide:true,e:'ease-in-out'}); });
      P.to(g.leaf(b,.62),1,up(b)).hold(4.5);
      [[104,-3],[86,-2],[70,-4]].forEach(([x,y],i)=>{ P.to([x,y],i?.3:1,{}).to([x-2,-19],.75,{e:'ease-out'}).to([x-8,y+2],2.2,{glide:true,e:'ease-in-out'}); });
      return P.to(g.leaf(a,.62),.9,up(a)).close(); }},
  { k:'midges', name:'cloud of midges', W:0,H:0,ax:0,ay:0,
    /* hover in a cloud over the tallest thing around, a swarm marker, and
       drift between the cattail tops */
    plan:(g,rnd)=>{ const t=i=>{ const [x,y]=g.cat(i,1); return [x,rf1(y-9)]; };
      return bugPlan(t(1),{},rnd).hover(6,{jit:1.6,every:.9}).to(t(2),3.4,{e:'ease-in-out'}).hover(5.5,{jit:1.6,every:.9})
        .to(t(0),5,{e:'ease-in-out'}).hover(6,{jit:1.6,every:.9}).to(t(1),4,{e:'ease-in-out'}).close(); },
    inner:(moving,rnd)=>{ let css='', html='';
      for(let i=0;i<9;i++){ const R=3+rnd()*6, a=rnd()*6.28, x0=rf1(Math.cos(a)*R), y0=rf1(Math.sin(a)*R*.6), du=rf1(.7+rnd()*.8);
        const pts=[0,1,2,3].map(k=>{ const b=a+k*1.57+(rnd()-.5); return [rf1(Math.cos(b)*R),rf1(Math.sin(b)*R*.6)]; });
        if(moving) css+=`@keyframes rbm-${i}{${pts.map((p,k)=>`${k*25}%{transform:translate(${p[0]}px,${p[1]}px)}`).join('')}100%{transform:translate(${pts[0][0]}px,${pts[0][1]}px)}}`;
        html+=`<b class="rb-mid" style="transform:translate(${x0}px,${y0}px);${moving?`animation:rbm-${i} ${du}s ease-in-out ${-rf1(rnd()*du)}s infinite`:''}"><svg width="4" height="3" viewBox="0 0 4 3"><ellipse cx="2" cy="1" rx="1.4" ry=".6" fill="#c9d6d4" opacity=".7"/><circle cx="2" cy="1.9" r=".75" fill="#3b3a33"/></svg></b>`; }
      return {css,html}; }},
  { k:'firefly', name:'firefly', W:10,H:7,ax:5,ay:6,bz:.05,bs:-.5,wo:'6px 3px', glow:[1.8,4.6],
    fly:`<ellipse cx="4.4" cy="1.8" rx="3" ry="1.1" transform="rotate(-18 4.4 1.8)" ${RB_WING} opacity=".75"/>`,
    body:`<path d="M4 5.4 l-.4 1 M5.2 5.6 l0 1 M6.3 5.4 l.5 .9" stroke="#2b2622" stroke-width=".4"/><ellipse cx="1.8" cy="4.6" rx="1.5" ry="1.1" fill="#e9e59a"/>
      <path d="M1.6 4.8 Q2 2.4 5 2.2 Q7.2 2.3 7.2 4.6 Q4.5 5.4 1.6 4.8Z" fill="#3a3530"/><path d="M2 4.4 Q4.4 4.9 7 4.4" stroke="#d9c79a" stroke-width=".4" fill="none"/>
      <path d="M7 4.8 Q6.8 2.2 8.4 2.4 Q9.6 3.2 9.4 4.8Z" fill="#e59a6a"/><ellipse cx="8.2" cy="3.4" rx=".6" ry=".5" fill="#3a3530"/>
      <circle cx="9.2" cy="5" r=".6" fill="#2b2622"/><path d="M9.4 4.6 Q10.4 3.2 10 2.4" stroke="#2b2622" stroke-width=".35" fill="none"/>`,
    /* weaves slow and low in among the leaves, flashing as it swoops up
       (the J-stroke), then settles on a blade and glows */
    plan:(g,rnd)=>{ const a=g.near(66,6,22), b=g.near(110,10,16), up=j=>({up:g.leafUp(j,.55)});
      return bugPlan(g.leaf(a,.55),up(a),rnd).hold(4.5).to([78,24],1.4).to([86,27],.9).to([92,16],1.3,{e:'ease-out'}).hover(.6,{jit:.5})
        .to([104,26],1.2).to(g.leaf(b,.55),1.2,up(b)).hold(4).to([96,22],1.2).to([84,27],1).to([74,15],1.4,{e:'ease-out'}).hover(.5,{jit:.5})
        .to([58,25],1.4).to(g.leaf(a,.55),1,up(a)).close(); }},
  { k:'skipper', name:'skipper butterfly', W:13,H:13,ax:6.8,ay:10.8,bz:.07,bs:-.55,wo:'7.4px 9px', same:true,
    wings:`<path d="M7 9.2 Q3 8.4 2.2 5 Q5.4 4.4 7.6 8.6Z" fill="#eaa648"/><path d="M7.4 9 L4.8 1.4 Q8.6 .9 9.4 2.6 Q8.4 6 7.9 8.9Z" fill="#df8a2c"/>
      <path d="M5 1.6 Q8.4 1 9.3 2.6" stroke="#8a4f1c" stroke-width=".6" fill="none"/><path d="M7.5 8.4 L6 3.4 M7.7 8.2 L7.6 2.6" stroke="#b86a22" stroke-width=".25"/><circle cx="6.8" cy="3.8" r=".35" fill="#fbe6b8"/>`,
    body:`<path d="M6 9.8 l-.8 1.2 M7 10 l0 1.3 M7.9 9.8 l.7 1.1" stroke="#5a3a1c" stroke-width=".4"/><path d="M1.4 9.6 Q4 8.4 6.6 9 Q4 10.6 1.4 9.6Z" fill="#b8742e"/>
      <ellipse cx="7.4" cy="9" rx="1.6" ry="1.3" fill="#9a5f25"/><circle cx="9.3" cy="8.6" r="1.1" fill="#8a5220"/><circle cx="9.6" cy="8.4" r=".55" fill="#2a1a0c"/>
      <path d="M9.4 7.6 Q10.6 5 11.8 4.2 L12.4 4.6" stroke="#5a3a1c" stroke-width=".35" fill="none"/><circle cx="11.8" cy="4.2" r=".45" fill="#5a3a1c"/>`,
    /* the least skipper lives in wet grass: fast, skipping darts, and it
       rests on the very tips of the blades */
    plan:(g,rnd)=>{ const ts=[g.near(24,6,12),g.near(58,6,24),g.near(100,4,14),g.near(129,5,14),g.near(83,5,24)].map(j=>g.leaf(j,1));
      return bugPlan(ts[0],{tilt:-4},rnd).hold(2.6).to([34,4],.35,{e:RB_DART}).to([44,-8],.3,{e:RB_DART}).to(ts[1],.35,{tilt:3,e:RB_DART}).hold(2.8)
        .to([80,-12],.4,{e:RB_DART}).to([92,0],.3,{e:RB_DART}).to(ts[2],.3,{tilt:-3,e:RB_DART}).hold(2.2).to([118,-10],.4,{e:RB_DART}).to(ts[3],.3,{tilt:4,e:RB_DART}).hold(2.6)
        .to([106,-6],.35,{e:RB_DART}).to(ts[4],.4,{tilt:2,e:RB_DART}).hold(2.4).to([54,-14],.5,{e:RB_DART}).to([30,-4],.4,{e:RB_DART}).to(ts[0],.3,{tilt:-4,e:RB_DART}).close(); }},
  { k:'cranefly', name:'crane fly', W:22,H:18,ax:13,ay:8.8,bz:.1,bs:-.3,wo:'12.7px 7px',
    rest:`<path d="M12.6 6.8 Q7 4.2 2.6 5 Q7.2 6 12.6 7.2Z" fill="#eef1ee" stroke="#b0b4a6" stroke-width=".3" opacity=".85"/><circle cx="4.8" cy="5.1" r=".45" fill="#8a7a5a"/>`,
    fly:`<path d="M12.6 6.8 Q10 1.8 6.6 .8 Q9.6 3.6 12.8 7.2Z" fill="#eef1ee" stroke="#b0b4a6" stroke-width=".3" opacity=".85"/>`,
    body:`<g stroke="#6e5a3e" stroke-width=".35" fill="none" stroke-linecap="round"><path d="M12.4 8.6 L9.6 11.8 L7.2 17.6"/><path d="M12.8 8.8 L11.6 12.6 L10.6 17.8"/><path d="M13.2 8.8 L14 12.6 L13.4 17.8"/>
      <path d="M13.6 8.6 L16.6 11.6 L18.4 17.2"/><path d="M13.9 8.4 L18 9.6 L21.6 13.4"/><path d="M12.2 8.4 L8 10 L4.4 14.6"/><path d="M12.2 7 L11.4 5.6"/></g><circle cx="11.4" cy="5.5" r=".35" fill="#6e5a3e"/>
      <path d="M2.4 7.6 Q7 8.4 11.8 8" stroke="#9a8260" stroke-width="1.2" stroke-linecap="round" fill="none"/><path d="M2.4 7.6 Q7 8.4 11.8 8" stroke="#6e5a3e" stroke-width="1.2" stroke-dasharray=".4 1.3" fill="none"/>
      <ellipse cx="13" cy="7.6" rx="1.7" ry="1.4" fill="#8a7250"/><path d="M12 7.1 Q13 6.5 14.2 7" stroke="#6e5a3e" stroke-width=".4" fill="none"/>
      <circle cx="15.1" cy="7.7" r=".8" fill="#6e5a3e"/><path d="M15.8 7.8 L17 8.4 M15.4 7.1 L17.2 5.6" stroke="#6e5a3e" stroke-width=".35"/>`,
    /* a clumsy, bobbing flier that ends up clinging to a stem with its long
       legs, bouncing on them the way crane flies do */
    plan:(g,rnd)=>{ const s=[0,1,2].map(i=>[g.cat(i,.45),g.catUp(i)]), bob={bob:.9,every:.45};
      return bugPlan(s[0][0],{up:s[0][1]},rnd).hold(4.5,bob).to([44,-4],.8).to([52,4],.6).to([62,-8],.8).to([72,0],.6).to(s[1][0],.8,{up:s[1][1]}).hold(4.2,bob)
        .to([98,-6],.8).to([106,4],.6).to(s[2][0],.8,{up:s[2][1]}).hold(4,bob).to([104,-12],.8).to([86,-2],.7).to([70,-14],.8).to([54,-4],.7).to([42,-10],.6).to(s[0][0],.8,{up:s[0][1]}).close(); }},
  { k:'hoverfly', name:'hoverfly', W:11,H:8,ax:6.4,ay:6.4,bz:.04,bs:-.5,wo:'6.8px 3.2px',
    rest:`<ellipse cx="4" cy="2.9" rx="3.4" ry=".95" transform="rotate(-4 4 2.9)" ${RB_WING} opacity=".85"/>`,
    fly:`<ellipse cx="5.6" cy="1.6" rx="3" ry="1.2" transform="rotate(-24 5.6 1.6)" ${RB_WING} opacity=".8"/>`,
    body:`<path d="M5.6 5.6 l-.5 1.1 M6.6 5.8 l.1 1.1 M7.4 5.6 l.6 1" stroke="#2a2622" stroke-width=".4"/><ellipse cx="3.6" cy="4.6" rx="3.2" ry="1.7" fill="#2a2622"/>
      <path d="M2.3 3.2 Q2.8 4.6 2.3 6 M4.2 3 Q4.7 4.6 4.2 6.2" stroke="#e8b923" stroke-width=".8" fill="none"/>
      <ellipse cx="7" cy="4.2" rx="1.6" ry="1.6" fill="#5a4a2c"/><path d="M6 3.2 Q7 2.7 8 3.2" stroke="#e8b923" stroke-width=".4" fill="none"/>
      <circle cx="8.9" cy="4.4" r="1.5" fill="#9a3f25"/><circle cx="9.3" cy="4" r=".4" fill="#fff" opacity=".6"/><path d="M10.2 5 Q10.5 5.6 10 6" stroke="#e8b923" stroke-width=".4" fill="none"/>`,
    /* hangs dead still in the air beside the cattail heads, jumps to a new
       spot in a blink, hangs again; now and then a rest on a blade */
    plan:(g,rnd)=>{ const beside=(i,dx)=>{ const [x,y]=g.cat(i,.66); return [rf1(x+dx),y]; }, zip={e:'cubic-bezier(.2,.9,.3,1)'}, hang={jit:.5,every:.25};
      const tip=g.leaf(g.near(94,6,20),1);
      return bugPlan(beside(0,-9),{},rnd).hover(2.4,hang).to(beside(0,9),.2,zip).hover(1.8,hang).to([62,-10],.25,zip).hover(2,hang).to(beside(1,-10),.22,zip).hover(2.2,hang)
        .to(tip,.3,{tilt:-3,...zip}).hold(3).to(beside(2,-9),.3,zip).hover(2,hang).to(beside(2,9),.18,zip).hover(1.6,hang).to([84,-14],.3,zip).hover(1.8,hang).to(beside(0,-9),.35,zip).close(); }},
  { k:'darner', name:'green darner', W:24,H:12,ax:12,ay:6,bz:.08,bs:.55,wo:'12px 6px', same:true, under:true,
    wings:`<g fill="#eef1e2" stroke="#b9c49a" stroke-width=".35" opacity=".85"><ellipse cx="10" cy="2.6" rx="6.4" ry="2" transform="rotate(-12 10 2.6)"/><ellipse cx="14.6" cy="2.9" rx="5.4" ry="1.8" transform="rotate(16 14.6 2.9)"/>
      <ellipse cx="10" cy="9.4" rx="6.4" ry="2" transform="rotate(12 10 9.4)"/><ellipse cx="14.6" cy="9.1" rx="5.4" ry="1.8" transform="rotate(-16 14.6 9.1)"/></g>`,
    body:`<path d="M1.5 6 L15 6" stroke="#3f7fb8" stroke-width="1.5" stroke-linecap="round"/><path d="M3.5 6h.5M6 6h.5M8.5 6h.5M11 6h.5" stroke="#1f3f66" stroke-width="1.6"/>
      <ellipse cx="16.4" cy="6" rx="2.5" ry="1.9" fill="#6aa84a"/><circle cx="19.2" cy="6" r="1.7" fill="#5a9a3c"/><circle cx="19.7" cy="5.4" r=".5" fill="#eaf6e0"/><circle cx="20.6" cy="6.3" r=".35" fill="#1f3f66"/>`,
    /* never perches here: it patrols, then hangs low by a stem and dips the
       tip of its tail to the waterline, laying eggs into the stem */
    plan:(g,rnd)=>{ const b1=g.cat(1,.08), b2=g.cat(2,.08);
      return bugPlan([28,-8],{},rnd).hover(1,{jit:.8}).to([60,-3],1.1,{e:RB_DART}).to([98,-11],1,{e:RB_DART}).to([b1[0]-10,29],.9,{tilt:-28})
        .hover(2.6,{jit:.5,every:.3}).to([104,20],.5).to([b2[0]+10,29],.6,{tilt:-28}).hover(2.4,{jit:.5,every:.3})
        .to([72,-12],1.3,{e:RB_DART}).to([44,-4],1).to([28,-8],.7).close(); }},
  { k:'jewelwing', name:'ebony jewelwing', W:20,H:10,ax:13.6,ay:7.2,bz:.11,bs:-.55,wo:'14px 5.5px',
    rest:`<path d="M14 5.3 Q9 1.4 3.6 2.8 Q8.6 4.8 14 5.7Z" fill="#1d1a22" opacity=".92"/><path d="M13.6 5.2 Q9 2.4 4.4 3.1" stroke="#4a4458" stroke-width=".3" fill="none"/>`,
    fly:`<g fill="#1d1a22" opacity=".85"><path d="M14 5.3 Q12 -.2 7.4 -.8 Q10 2.8 14 5.7Z"/><path d="M14 5.3 Q13.6 .4 10 -1.6 Q11.4 2.6 14 5.6Z"/></g>`,
    body:RB_JEWEL_BODY,
    alt:RB_JEWEL_BODY+`<g fill="#1d1a22" opacity=".92"><path d="M14 5.3 Q11.6 -.6 6.6 -.4 Q9.6 2.8 14 5.7Z"/><path d="M14 5.4 Q8.4 3 3.4 4.8 Q9 6 14 5.9Z"/></g>`,
    /* perches on a blade tip and flicks its black wings open and shut */
    plan:(g,rnd)=>{ const A=g.leaf(4,1), B=g.leaf(8,1);
      const P=bugPlan(A,{tilt:-6},rnd).hold(1.4).mark('a').hold(.5).mark('b').hold(1.6).mark('c').hold(.5).mark('d').hold(1.2)
        .to([52,-6],.9).to([62,2],.6).to([72,-8],.7).to(B,.7,{tilt:4}).hold(1.2).mark('e').hold(.5).mark('f').hold(1.8).mark('g').hold(.5).mark('h').hold(1)
        .to([70,-4],.8).to([56,-12],.7).to(A,.8,{tilt:-6});
      const R=P.close(), M=R.M; R.alt=[[M.a,M.b],[M.c,M.d],[M.e,M.f],[M.g,M.h]]; return R; }},
  { k:'eyedbrown', name:'eyed brown', W:13,H:13,ax:6.8,ay:10.8,bz:.11,bs:-.6,wo:'7.4px 9px', same:true,
    wings:`<path d="M7 9.2 Q2.6 8.8 1.8 5 Q5.2 3.8 7.6 8.6Z" fill="#b89d74"/><path d="M7.4 9 L4.4 1 Q8.8 .3 9.8 2.4 Q8.6 6 7.9 8.9Z" fill="#a9895e"/>
      <g fill="#3a2a1a" stroke="#ecd48a" stroke-width=".35"><circle cx="3" cy="6" r=".6"/><circle cx="4.2" cy="4.9" r=".55"/><circle cx="5.3" cy="2.1" r=".55"/><circle cx="6.5" cy="1.5" r=".5"/></g>
      <path d="M4.6 1.2 Q8.6 .5 9.7 2.4" stroke="#7a5c3a" stroke-width=".4" fill="none"/>`,
    body:`<path d="M6 9.8 l-.8 1.2 M7 10 l0 1.3 M7.9 9.8 l.7 1.1" stroke="#4a3622" stroke-width=".4"/><path d="M1.6 9.6 Q4 8.6 6.6 9 Q4 10.4 1.6 9.6Z" fill="#7a5c3a"/>
      <ellipse cx="7.4" cy="9" rx="1.5" ry="1.2" fill="#6b4f33"/><circle cx="9.2" cy="8.6" r="1" fill="#5e4430"/><circle cx="9.5" cy="8.4" r=".5" fill="#1f160c"/>
      <path d="M9.4 7.8 L12 3.6" stroke="#4a3622" stroke-width=".3"/><circle cx="12" cy="3.6" r=".42" fill="#4a3622"/>`,
    /* a sedge-meadow butterfly: a slow, bouncing flight, long rests on the tips */
    plan:(g,rnd)=>{ const A=g.leaf(1,1), B=g.leaf(5,1), C=g.leaf(12,1), P=bugPlan(A,{tilt:-3},rnd).hold(3.6), bob=pts=>pts.forEach(p=>P.to(p,.42));
      bob([[22,-6],[30,2],[38,-8],[46,0]]); P.to(B,.45,{tilt:3}).hold(3.4);
      bob([[66,-10],[76,-2],[86,-12],[98,-3],[108,-11]]); P.to(C,.45,{tilt:-2}).hold(3.4);
      bob([[108,-4],[92,-14],[74,-6],[56,-15],[40,-7],[26,-13]]); P.to(A,.5,{tilt:-3});
      return P.close(); }},
  { k:'caddisfly', name:'caddisfly', W:14,H:9,ax:7,ay:7.6,bz:.06,bs:-.5,wo:'10.6px 5px',
    rest:`<path d="M11.2 4.4 Q6 1.8 .6 5.6 Q5.4 6.8 11.2 6.3Z" fill="#9c7b52"/><path d="M10.4 4.4 Q6 2.6 1.6 5.2" stroke="#c2a57a" stroke-width=".4" fill="none"/><g fill="#6e5234"><circle cx="4" cy="4.6" r=".35"/><circle cx="6.6" cy="3.8" r=".35"/><circle cx="8.4" cy="4.6" r=".3"/></g>`,
    fly:`<g fill="#b0916a" opacity=".85"><path d="M10.6 4.8 Q9.6 .4 5.6 -.6 Q7.6 2.6 10.8 5.4Z"/><path d="M10.2 5 Q7 1.6 3 1.8 Q6.4 3.8 10.4 5.6Z"/></g>`,
    body:`<path d="M3 6 Q6 5.2 10.6 5.4" stroke="#7a6040" stroke-width="1.3" stroke-linecap="round" fill="none"/><path d="M8.4 6.6 l-.8 1.2 M9.4 6.7 l.1 1.2 M10.2 6.5 l.8 1" stroke="#5a4430" stroke-width=".35"/>
      <circle cx="11.8" cy="5.4" r="1.1" fill="#6b5236"/><path d="M12.4 4.8 Q15.6 1 19.6 1.2 M12.2 4.6 Q14.6 .6 18 -.2 M12.8 6 l.9 .8" stroke="#6b5236" stroke-width=".3" fill="none"/>`,
    /* rests low on a stem, wings folded like a tent, and flutters out over
       the water, dipping to the surface */
    plan:(g,rnd)=>{ const up=(j,s)=>({up:g.leafUp(j,s)}), A=g.leaf(6,.35), B=g.leaf(9,.4);
      return bugPlan(A,up(6,.35),rnd).hold(4.5).to([72,26],.6).to([78,32],.4).to([84,27],.35).to([90,32.5],.4).to([96,27],.35).to(B,.5,up(9,.4)).hold(4.2)
        .to([88,27],.5).to([80,32.5],.4).to([72,27],.4).to([66,32],.4).to([58,26],.4).to(A,.5,up(6,.35)).close(); }},
  { k:'stonefly', name:'stonefly', W:16,H:8,ax:8.4,ay:6.8,bz:.08,bs:-.5,wo:'11.4px 4.6px',
    rest:`<path d="M12 4.2 Q6 3.4 .8 4.6 Q6 5.6 12 5.3Z" fill="#8a8674" opacity=".9"/><path d="M11 4.4 Q6 3.9 1.6 4.7" stroke="#b4ae98" stroke-width=".3" fill="none"/>`,
    fly:`<g fill="#a39f8c" opacity=".8"><path d="M11.4 4.4 Q9.6 .2 5 -.8 Q7.4 2.4 11.6 5Z"/><path d="M11 4.6 Q7.4 1.4 3 1.6 Q6.6 3.6 11.2 5.2Z"/></g>`,
    body:`<path d="M1.6 5.6 L-.6 4 M1.6 5.8 L-.4 7" stroke="#4a4238" stroke-width=".3"/><path d="M1.6 5.6 Q6 4.6 11 5" stroke="#5e5446" stroke-width="1.4" stroke-linecap="round" fill="none"/>
      <path d="M9.6 5.6 l-1.4 1.4 M10.6 5.7 l0 1.4 M11.6 5.5 l1.2 1.3" stroke="#4a4238" stroke-width=".4" fill="none"/>
      <ellipse cx="11.6" cy="5" rx="1.5" ry="1.1" fill="#5e5446"/><circle cx="13.4" cy="5" r="1.1" fill="#4a4238"/><circle cx="13.8" cy="4.6" r=".35" fill="#d8d2c0"/>
      <path d="M14 4.5 Q16.4 2.6 18.6 2.4 M13.8 4.3 Q15.4 1.8 17.2 1" stroke="#4a4238" stroke-width=".28" fill="none"/>`,
    alt:RB_STONE_NYMPH,
    /* the nymph climbs out of the water up a stem, splits its skin and the
       winged adult walks out, rests while its wings firm up, then flies off;
       the empty skin stays behind on the stem */
    plan:(g,rnd)=>{ const j=7, up=s=>({up:g.leafUp(j,s)}), base=g.leaf(j,.03), mid=g.leaf(j,.45);
      const P=bugPlan(base,up(.03),rnd).hold(1.2).mark('in').crawl(g.leaf(j,.25),2.2,up(.25)).crawl(mid,2,up(.45)).hold(.8).mark('shed')
        .hold(5.5,{bob:.2,every:.9}).to([92,-6],1.1).to([110,-16],.9).to([150,-24],1).mark('gone').hold(1).to(base,.1,up(.03));
      const R=P.close(), M=R.M, r=up(.45).up-90;
      R.hide=[[0,M.in-.2],[M.gone,R.T]]; R.alt=[[0,M.shed],[M.gone,R.T]]; R.still=M.shed+1;
      R.props=[{x:mid[0],y:mid[1],r,win:[[M.shed,R.T-.3]],html:`<svg width="16" height="8" viewBox="0 0 16 8" style="left:-8.4px;top:-6.8px"><g opacity=".8">${RB_STONE_NYMPH.replace(/#8a7658/g,'#e6d9b8').replace(/#5e4e38|#6b5a40/g,'#b8a47e')}</g><path d="M8 4.2 L12 4.4" stroke="#8a7658" stroke-width=".35"/></svg>`}];
      return R; }},
  { k:'reedbeetle', name:'reed beetle', W:10,H:6,ax:5,ay:5.6,bz:.05,bs:-.5,wo:'6px 3.4px', wingsFirst:true,
    rest:`<path d="M1.2 4.8 Q1.2 2.2 5 1.9 Q8 2 8.2 4.6 Q5 5.4 1.2 4.8Z" fill="#4f7d38"/><path d="M2 3 Q5 2.3 7.6 3" stroke="#c9c46a" stroke-width=".5" fill="none" opacity=".8"/><path d="M1.4 4.6 Q5 5.2 8.1 4.5" stroke="#a8743a" stroke-width=".4" fill="none"/>`,
    fly:`<ellipse cx="3.4" cy="1.8" rx="3.2" ry="1" transform="rotate(-18 3.4 1.8)" fill="#eef2ea" stroke="#b9c3b1" stroke-width=".3" opacity=".8"/>`,
    flyStill:`<g transform="rotate(-28 7.6 4.4)"><path d="M1.2 4.8 Q1.2 2.2 5 1.9 Q8 2 8.2 4.6Z" fill="#4f7d38"/><path d="M2 3 Q5 2.3 7.6 3" stroke="#c9c46a" stroke-width=".5" fill="none"/></g>`,
    body:`<path d="M2.8 5 l-.6 .9 M4.6 5.2 l0 .8 M6.4 5 l.6 .8" stroke="#2f4a2a" stroke-width=".45" stroke-linecap="round"/><path d="M1.6 4.8 L8 4.8" stroke="#2f4a2a" stroke-width=".8" stroke-linecap="round"/>
      <ellipse cx="8.6" cy="4" rx="1" ry=".9" fill="#3d6a30"/><path d="M9.2 3.4 Q10.8 1.4 12.4 1" stroke="#2f4a2a" stroke-width=".3" fill="none"/>`,
    /* lives only on water plants: lands on a reed blade, chews at its edge
       and walks a little higher, then flies to the next */
    plan:(g,rnd)=>{ const up=(j,s)=>({up:g.leafUp(j,s)}), chew={bob:.35,every:.2};
      return bugPlan(g.leaf(8,.5),up(8,.5),rnd).hold(2.4,chew).crawl(g.leaf(8,.68),1.6,up(8,.68)).hold(2,chew).to([96,-8],.9).to(g.leaf(12,.4),.8,up(12,.4)).hold(2.6,chew)
        .crawl(g.leaf(12,.58),1.4,up(12,.58)).hold(1.6,chew).to([100,-12],.9).to(g.leaf(8,.5),.9,up(8,.5)).close(); }},
  { k:'lacewing', name:'green lacewing', W:16,H:10,ax:8.4,ay:8.2,bz:.13,bs:-.5,wo:'10.8px 5.8px',
    rest:`<path d="M11.2 5.6 Q6 .4 .2 3.6 Q5 6.6 11.2 6.2Z" fill="#eef8e8" stroke="#a8d48c" stroke-width=".3" opacity=".8"/><path d="M10.6 5.6 Q6 1.8 1.2 3.8 M9 4.2 L8.4 6 M6.6 3 L6 5.6 M4.2 2.8 L3.6 5" stroke="#a8d48c" stroke-width=".22" fill="none"/>`,
    fly:`<g fill="#eef8e8" stroke="#a8d48c" stroke-width=".3" opacity=".75"><path d="M10.8 5.8 Q10.4 .4 5 -1.6 Q7.6 2.8 11 6.2Z"/><path d="M10.4 5.9 Q6.6 1.4 1.6 1.4 Q5.6 4.4 10.6 6.3Z"/></g>`,
    body:`<path d="M9.4 7 l-.8 1.3 M10.3 7.1 l0 1.3 M11.1 7 l.8 1.2" stroke="#7fae5c" stroke-width=".3"/><path d="M3.6 6.6 Q7 6 10.6 6.4" stroke="#8cc56a" stroke-width="1.1" stroke-linecap="round" fill="none"/>
      <ellipse cx="11" cy="6.3" rx="1.2" ry=".9" fill="#8cc56a"/><circle cx="12.5" cy="6.4" r=".85" fill="#9ccf78"/><circle cx="12.9" cy="6.1" r=".5" fill="#e0b43a"/>
      <path d="M13 5.8 Q16 3 19.4 2.8 M12.9 5.6 Q15 2.4 17.6 1.4" stroke="#8cb870" stroke-width=".22" fill="none"/>`,
    /* a weak, drifting flier that settles beside the aphids on a blade */
    plan:(g,rnd)=>{ const up=(j,s)=>({up:g.leafUp(j,s)}), A=g.leaf(5,.66), B=g.leaf(12,.7), eat={bob:.25,every:.7};
      const P=bugPlan(A,up(5,.66),rnd).hold(4.2,eat).to([64,-4],1.1).to([74,-10],.9).to([86,-3],1).to([98,-12],1).to([110,-6],.9).to(B,.9,up(12,.7)).hold(4,eat)
        .to([106,-10],1).to([92,-2],1).to([80,-12],1).to([66,-5],1).to(A,1,up(5,.66));
      const R=P.close(), aph='<g fill="#a6cc6e" stroke="#6f9a45" stroke-width=".2"><ellipse cx="-1.6" cy="0" rx="1" ry=".7"/><ellipse cx=".6" cy="-.4" rx=".9" ry=".65"/><ellipse cx="2" cy=".6" rx=".8" ry=".6"/></g>';
      R.props=[rbProp(g.leaf(5,.56),6,3,aph),rbProp(g.leaf(12,.6),6,3,aph)]; return R; }},
  { k:'cattailmoth', name:'cattail moth', W:12,H:8,ax:6,ay:7,bz:.06,bs:-.55,wo:'9px 4.4px',
    rest:`<path d="M9.6 3.8 Q5 2 .6 4.9 Q5 6.2 9.6 5.6Z" fill="#b89a74"/><path d="M9 4.2 Q5.6 3 1.6 4.8" stroke="#c8763a" stroke-width=".55" fill="none"/><g fill="#efe3c8"><circle cx="6.8" cy="3.6" r=".3"/><circle cx="4.2" cy="4.2" r=".3"/></g><path d="M.6 4.9 L-.2 5.4" stroke="#b89a74" stroke-width=".4"/>`,
    fly:`<g fill="#b89a74" opacity=".9"><path d="M9 4.2 Q8.2 .2 4 -.6 Q6 2.6 9.2 4.8Z"/><path d="M8.6 4.4 Q5.6 1.6 1.6 1.8 Q4.8 3.8 8.8 5Z"/></g>`,
    body:`<path d="M6.4 6 l-.6 1 M7.4 6.1 l0 1 M8.3 6 l.6 .9" stroke="#6b5236" stroke-width=".35"/><path d="M2 5.4 Q5 4.6 8.6 5" stroke="#9a7e5c" stroke-width="1.3" stroke-linecap="round" fill="none"/>
      <circle cx="10.2" cy="4.9" r="1" fill="#8a6b4a"/><circle cx="10.5" cy="4.7" r=".4" fill="#2a1e12"/><path d="M10.2 4.2 Q8.8 1.8 6.6 1.6" stroke="#6b5236" stroke-width=".3" fill="none"/>`,
    /* its caterpillars live inside cattail heads, so the moth walks the
       brown heads, looking for the right one to lay on */
    plan:(g,rnd)=>{ const up=i=>({up:g.catUp(i)});
      return bugPlan(g.cat(0,.56),up(0),rnd).crawl(g.cat(0,.76),2.6,up(0)).hold(2.2).to([48,-8],.8).to([62,-2],.7).to([76,-12],.8).to(g.cat(1,.6),.7,up(1)).crawl(g.cat(1,.78),2.2,up(1)).hold(2)
        .to([104,-4],.8).to(g.cat(2,.58),.7,up(2)).crawl(g.cat(2,.74),2,up(2)).hold(2.4).to([96,-14],1).to([62,-6],1).to([44,-12],.8).to(g.cat(0,.56),.7,up(0)).close(); }},
  { k:'grasshopper', name:'marsh grasshopper', W:16,H:9,ax:8.6,ay:8,bz:.05,bs:-.6,wo:'10.6px 3.6px', wingsFirst:true,
    rest:`<path d="M11.6 3 Q7 2.2 1.2 3.8 Q6 4.2 11.6 4Z" fill="#5f7f34"/><path d="M11 3.2 L2 3.8" stroke="#e4d27a" stroke-width=".3"/>`,
    fly:`<path d="M10.6 3.6 Q9 -1.6 3.6 -1.4 Q5.6 2 10.6 4.2Z" fill="#e6d4a8" opacity=".85"/><path d="M9.6 3.2 Q6 .2 4.2 -.8" stroke="#3d3222" stroke-width=".5" fill="none"/>`,
    flyStill:`<path d="M11.6 3.4 Q8 -.2 3 .6 Q7 2.6 11.6 4Z" fill="#5f7f34"/>`,
    body:`<path d="M11.6 6 l.4 1.9 M10.4 6.2 l-.4 1.8" stroke="#6b8a3c" stroke-width=".45"/>
      <path d="M2 5.4 Q2 3.8 6 3.6 L12 3.3 Q14.6 3.6 14.6 5.4 Q12.4 6.8 6 6.6 Q2.6 6.4 2 5.4Z" fill="#7ea04a"/>
      <path d="M12.6 3.5 Q14.8 3.8 14.8 5.4 Q13.4 6.4 12.6 6.2Z" fill="#8cb052"/><circle cx="13.8" cy="4.5" r=".6" fill="#3d4a24"/><path d="M13.6 3.6 L16.4 1.4" stroke="#6b8a3c" stroke-width=".35"/>
      <path d="M9.4 5.4 Q5 2.6 3 3.8 Q5 5.6 9.4 6.1Z" fill="#9ab85a"/><path d="M8.8 6 Q5.6 5.4 3.2 4.1" stroke="#c84a3a" stroke-width=".45" fill="none"/><path d="M3 3.9 L6.6 8" stroke="#dcbc3a" stroke-width=".6" stroke-linecap="round"/>`,
    /* clings to the stems of wet meadows and gets about in short, whirring
       hops from stem to stem */
    plan:(g,rnd)=>{ const up=(j,s)=>({up:g.leafUp(j,s)}), P=bugPlan(g.leaf(7,.6),up(7,.6),rnd).hold(4,{bob:.15,every:1.2});
      P.to([88,-10],.3,{e:'ease-out'}).to([100,-12],.2).to(g.leaf(12,.55),.35,{...up(12,.55),e:'ease-in'}).hold(4,{bob:.15,every:1.2});
      P.to([100,-14],.3,{e:'ease-out'}).to([60,-12],.5).to(g.cat(0,.4),.4,{up:g.catUp(0),e:'ease-in'}).hold(4,{bob:.15,every:1.2});
      P.to([48,-12],.3,{e:'ease-out'}).to([62,-10],.2).to(g.leaf(7,.6),.3,{...up(7,.6),e:'ease-in'});
      return P.close(); }},
  { k:'ichneumon', name:'ichneumon wasp', W:20,H:10,ax:11.4,ay:7.8,bz:.05,bs:-.5,wo:'12.2px 4.6px',
    rest:`<path d="M12.4 4.4 Q8 3 4.4 4.1 Q8 5 12.4 4.9Z" fill="#dcd6c6" opacity=".8"/><circle cx="7.6" cy="3.8" r=".35" fill="#3a2a1e"/>`,
    fly:`<path d="M12.2 4.6 Q10.4 .6 6.4 -.4 Q8.4 2.6 12.4 5Z" fill="#dcd6c6" opacity=".75"/>`,
    body:`<path d="M2.4 5.6 L-9 6.8 M2.4 5.8 L-9 7.4 M2.4 5.4 L-8.6 6.2" stroke="#3a2a1e" stroke-width=".22"/>
      <path d="M2.4 5.6 Q6 4.6 9.6 5.6" stroke="#d9782a" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M2.4 5.6 Q3.5 5.2 4.5 5" stroke="#2a221c" stroke-width="1.5" stroke-linecap="round"/>`+RB_ICH_FRONT,
    alt:`<path d="M10.2 5.4 Q8 .6 4.6 1.4" stroke="#d9782a" stroke-width="1.5" stroke-linecap="round" fill="none"/><path d="M4.6 1.4 Q4.2 2 4.4 2.4" stroke="#2a221c" stroke-width="1.4" stroke-linecap="round"/>
      <path d="M4.4 2.2 Q6.6 5 8.6 8.6 M4.6 2.2 Q7 5.2 8 8.8" stroke="#3a2a1e" stroke-width=".22" fill="none"/>`+RB_ICH_FRONT+`<path d="M12.4 4.4 Q9.6 2.4 7 2.8 Q9.8 4.2 12.4 4.9Z" fill="#dcd6c6" opacity=".8"/>`,
    /* it can sense a grub hidden inside a stem: lands on the cattail, arches
       its body and drills its long ovipositor in */
    plan:(g,rnd)=>{ const up=i=>({up:g.catUp(i)}), A=g.cat(1,.45), B=g.cat(2,.42), drill={bob:.25,every:.4};
      const P=bugPlan(A,up(1),rnd).hold(.9).mark('a').hold(3.4,drill).mark('b').hold(.8)
        .to([102,-8],1).to([112,-2],.6).to(B,.6,up(2)).hold(.9).mark('c').hold(3.2,drill).mark('d').hold(.8)
        .to([104,-14],1).to([92,-6],.8).to(A,.7,up(1));
      const R=P.close(), M=R.M; R.alt=[[M.a,M.b],[M.c,M.d]]; R.still=M.a+1; return R; }},
  { k:'boatman', name:'water boatman', W:10,H:7,ax:5,ay:6.2,bz:.05,bs:-.5,wo:'6px 2.6px',
    fly:`<ellipse cx="4" cy="1.4" rx="3.2" ry="1" transform="rotate(-18 4 1.4)" ${RB_WING} opacity=".8"/>`,
    flyStill:`<g transform="rotate(-22 8 4)"><path d="M.8 4.6 Q1.4 2 5.6 1.8 Q8.6 2.2 8.8 4.6Z" fill="#8a7a62"/></g>`,
    body:`<path d="M3 5 Q.4 5.6 -1.6 7.4" stroke="#6b5a44" stroke-width=".6" stroke-linecap="round" fill="none"/><path d="M-1.4 7.2 l.4 -.8 M-.6 6.6 l.4 -.8 M.2 6 l.4 -.8" stroke="#a8977c" stroke-width=".25"/>
      <path d="M.8 4.6 Q1.4 2 5.6 1.8 Q8.6 2.2 8.8 4.6 Q5 5.8 .8 4.6Z" fill="#8a7a62"/><path d="M1.6 3.6 Q5 2.6 8 3.2 M1.4 4.2 Q5 3.8 8.4 4" stroke="#d9cbb0" stroke-width=".3" fill="none"/>
      <circle cx="8.8" cy="4.2" r=".9" fill="#6b5a44"/><circle cx="9.1" cy="3.9" r=".45" fill="#b0423a"/><path d="M7.6 5.2 l.8 .9 M6.6 5.3 l.2 1" stroke="#6b5a44" stroke-width=".35"/>`,
    wingsFirst:true,
    /* flies in, splashes down between the reeds, dives with its bubble of
       air, pops back up and rows about, then flies on */
    plan:(g,rnd)=>{ const W1=[50,33.6], W2=[105,33.6];
      const P=bugPlan([22,-10],{},rnd).hover(.6,{jit:.6}).to([40,-4],.7).to(W1,.5).mark('s1').hold(.5).mark('d1').hold(3).mark('u1').crawl([53,33.6],.7,{face:true}).crawl([48,33.6],.8,{face:true})
        .to([70,-6],.7).to([92,-10],.6).to(W2,.5).mark('s2').hold(.5).mark('d2').hold(3).mark('u2').crawl([102,33.6],.7,{face:true}).crawl([107,33.6],.8,{face:true})
        .to([80,-14],.9).to([46,-16],1).to([22,-10],.7);
      const R=P.close(), M=R.M; R.hide=[[M.d1,M.u1],[M.d2,M.u2]]; R.still=M.s1+.2;
      R.props=[rbRing(W1,[[M.s1,M.s1+1.3],[M.u1-.1,M.u1+1.3]]),rbRing(W2,[[M.s2,M.s2+1.3],[M.u2-.1,M.u2+1.3]])]; return R; }},
  { k:'whirligig', name:'whirligig beetle', W:8,H:5,ax:4,ay:4.4,bz:.05,bs:-.5,wo:'4.6px 1.8px',
    fly:`<ellipse cx="3.2" cy=".8" rx="2.6" ry=".8" transform="rotate(-18 3.2 .8)" ${RB_WING} opacity=".8"/>`,
    body:`<path d="M2.4 3.9 l-.8 .6 M5.4 3.9 l.6 .5" stroke="#6b5a44" stroke-width=".4"/><path d="M.6 3.6 Q1 1 4 .9 Q7 1 7.4 3.4 Q4 4.4 .6 3.6Z" fill="#1c1f24"/>
      <path d="M1.8 1.8 Q4 1.1 6 1.6" stroke="#9fb6c8" stroke-width=".45" fill="none" opacity=".8"/><path d="M1 3.6 Q4 4.2 7.2 3.4" stroke="#3c4a56" stroke-width=".35" fill="none"/>`,
    /* lands on the water and spins in quick loops on the surface */
    plan:(g,rnd)=>{ const c1=[132,33.7], c2=[50,33.7], P=bugPlan([100,-12],{},rnd).hover(.4,{jit:.6});
      const swim=([cx,cy])=>[4,1,5,0,3,6,2,5,1,4].forEach(dx=>P.crawl([cx-3+dx,cy],.26,{face:true}));
      P.to(c1,.8).mark('a'); swim(c1); P.hold(.6); swim(c1); P.mark('b').to([100,-10],.7).to([70,-4],.8).to(c2,.7).mark('c'); swim(c2); P.hold(.5); swim(c2);
      P.mark('d').to([80,-14],.9).to([100,-12],.5);
      const R=P.close(), M=R.M; R.still=M.a+.1; R.props=[rbRing(c1,[[M.a,M.b+1]]),rbRing(c2,[[M.c,M.d+1]])]; return R; }},
  { k:'froghopper', name:'froghopper', W:9,H:6.5,ax:4.6,ay:5.8,bz:.04,bs:-.5,wo:'5.4px 2.2px',
    fly:`<ellipse cx="3.4" cy="1.2" rx="3" ry="1" transform="rotate(-20 3.4 1.2)" ${RB_WING} opacity=".8"/>`,
    body:`<path d="M3.2 4.8 l-.8 1 M5 5 l0 1 M6.4 4.8 l.6 .9" stroke="#4a3624" stroke-width=".4"/>
      <path d="M.6 4.6 Q1.4 1.6 6 1.4 Q8.8 2 8.6 4.4 Q6 5.2 .6 4.6Z" fill="#8a6440"/><path d="M2.4 2.2 Q3 3.4 2.6 4.6 M5 1.6 Q5.6 3.2 5.2 4.8" stroke="#e3d2a8" stroke-width=".7" fill="none"/>
      <path d="M7.2 1.9 Q8.8 2.2 8.8 4.2 Q8 4.8 7.2 4.6Z" fill="#6b4c30"/><circle cx="8" cy="2.8" r=".45" fill="#e3d2a8"/>`,
    wingsFirst:true,
    /* sips sap on a stem, then leaps: one of the best jumpers there is.
       Its young hide in the spittle foam on the blades */
    plan:(g,rnd)=>{ const up=(j,s)=>({up:g.leafUp(j,s)}), sip={bob:.2,every:.6}, P=bugPlan(g.leaf(3,.5),up(3,.5),rnd).hold(3.4,sip);
      const leap=(apex,land,q)=>P.to(apex,.2,{e:'cubic-bezier(.2,.7,.4,1)'}).to(land,.22,{...q,e:'cubic-bezier(.6,0,.8,.4)'});
      leap([52,-18],g.leaf(6,.55),up(6,.55)).hold(3.2,sip);
      leap([80,-20],g.cat(1,.35),{up:g.catUp(1)}).hold(3.4,sip);
      leap([62,-22],g.leaf(3,.5),up(3,.5));
      const R=P.close(), foam='<g fill="#fbfaf2" stroke="#d6d9cb" stroke-width=".25"><circle cx="-1.6" cy=".4" r="1.3"/><circle cx=".4" cy="-.6" r="1.5"/><circle cx="1.8" cy=".8" r="1.2"/><circle cx="-.2" cy="1.2" r="1.1"/><circle cx="-2.6" cy="-.8" r=".8"/></g><circle cx=".1" cy="-1.1" r=".35" fill="#fff"/>';
      R.props=[rbProp(g.leaf(9,.45),8,6,foam),rbProp(g.leaf(13,.5),8,6,foam)]; return R; }},
  { k:'paperwasp', name:'paper wasp', W:14,H:10,ax:7.6,ay:8.2,bz:.045,bs:-.5,wo:'8.6px 4px',
    rest:`<path d="M8.8 3.8 Q5 2.6 2.2 3.6 Q5.4 4.4 8.8 4.3Z" fill="#c9a36a" opacity=".65"/>`,
    fly:`<path d="M8.6 4 Q7.6 .2 4 -.6 Q5.8 2.4 8.8 4.4Z" fill="#c9a36a" opacity=".6"/>`,
    add:`<circle cx="11.4" cy="5.8" r=".9" fill="#b9b2a4"/><circle cx="11.2" cy="5.5" r=".3" fill="#e4dfd4"/>`,
    body:`<path d="M8 5.8 L7 8.2 M8.8 5.9 L8.8 8.3 M9.6 5.8 L10.6 8" stroke="#d9a520" stroke-width=".4"/>
      <path d="M1.4 5.4 Q2 3.4 4.6 3.6 Q6.8 4 7 5.2 Q5 6.8 1.4 5.4Z" fill="#2a2420"/><path d="M2.4 3.9 Q2.8 4.9 2.3 5.8 M4.2 3.7 Q4.7 4.9 4.2 6.2 M5.8 4.1 Q6.2 5 5.8 5.9" stroke="#e8b923" stroke-width=".6" fill="none"/>
      <path d="M7 5 L7.8 4.9" stroke="#2a2420" stroke-width=".5"/><ellipse cx="8.8" cy="4.7" rx="1.3" ry="1.1" fill="#2a2420"/><path d="M8.2 4 l1 -.2" stroke="#e8b923" stroke-width=".35"/>
      <circle cx="10.6" cy="4.7" r="1" fill="#e8b923"/><circle cx="10.9" cy="4.3" r=".45" fill="#2a2420"/><path d="M10.9 3.9 Q12 2.2 13.4 2 l.3 .6" stroke="#c8741e" stroke-width=".3" fill="none"/>`,
    /* scrapes fibre off an old stem, chews it to pulp and flies it home
       to build paper nest; flies with its legs dangling */
    plan:(g,rnd)=>{ const A=g.cat(2,.36), up={up:g.catUp(2)};
      const P=bugPlan([-12,-12],{},rnd).hover(.5).mark('in').to([30,-6],1).to([70,-12],1.1).to([104,-4],.9).to(A,.6,up).hold(3.6,{bob:.35,every:.16}).mark('got').hold(.6)
        .to([132,-10],.7).to([166,-20],.9).mark('out').hold(1).to([-12,-12],.2);
      const R=P.close(), M=R.M; R.hide=[[0,M.in-.1],[M.out,R.T]]; R.add=[[M.got,M.out]]; R.still=M.got-1; return R; }},
  { k:'muddauber', name:'mud dauber', W:16,H:10,ax:8.4,ay:8.6,bz:.045,bs:-.5,wo:'10px 4px',
    rest:`<path d="M10.2 3.9 Q6.6 2.6 3.6 3.8 Q6.8 4.6 10.2 4.4Z" fill="#6b5f54" opacity=".75"/>`,
    fly:`<path d="M10 4 Q9 .2 5.4 -.6 Q7.2 2.4 10.2 4.4Z" fill="#6b5f54" opacity=".7"/>`,
    add:`<circle cx="12.6" cy="6.2" r="1.2" fill="#8a6a48"/><circle cx="12.3" cy="5.8" r=".35" fill="#b08c66"/>`,
    body:`<path d="M9.4 5.6 L8.4 8.4 M10.2 5.7 L10.2 8.6 M11 5.6 L12 8.2" stroke="#1d1b1a" stroke-width=".35"/><path d="M8.6 7.4 L8.4 8.4 M10.2 7.6 v1 M11.6 7.4 l.4 .8" stroke="#e4c23a" stroke-width=".4"/>
      <ellipse cx="2.8" cy="6" rx="2.4" ry="1.5" fill="#1d1b1a"/><path d="M5 5.8 Q7 5.2 9 5" stroke="#e4c23a" stroke-width=".45" fill="none"/>
      <ellipse cx="10" cy="4.8" rx="1.4" ry="1.1" fill="#1d1b1a"/><circle cx="9.6" cy="4.2" r=".35" fill="#e4c23a"/><circle cx="11.9" cy="4.8" r=".95" fill="#1d1b1a"/><path d="M12.2 4.1 Q13.4 2 14.8 1.8" stroke="#1d1b1a" stroke-width=".3" fill="none"/>`,
    /* lands on the wet mud at the water's edge, works a ball of it and
       flies it away to build its nest of mud tubes */
    plan:(g,rnd)=>{ const P=bugPlan([166,-18],{},rnd).hover(.5).mark('in').to([130,-8],.9).to([112,20],.8).to([106,33.4],.5).hold(3.8,{bob:.3,every:.22}).mark('got').hold(.5)
        .to([80,-6],.8).to([40,-14],1).to([-14,-20],.9).mark('out').hold(1).to([166,-18],.2);
      const R=P.close(), M=R.M; R.hide=[[0,M.in-.1],[M.out,R.T]]; R.add=[[M.got,M.out]]; R.still=M.got-1;
      R.props=[rbProp([106,34],14,4,'<ellipse rx="6.4" ry="1.3" fill="#9a7a58" opacity=".5"/><ellipse cx="-1" rx="3" ry=".6" fill="#7a5a3c" opacity=".5"/>')]; return R; }},
  { k:'marshfly', name:'marsh fly', W:12,H:8,ax:6.4,ay:6.6,bz:.05,bs:-.5,wo:'7.4px 3.6px',
    rest:`<path d="M7.6 3.4 Q4 2.4 .6 3.8 Q4 4.6 7.6 4.2Z" fill="#f2ead2" opacity=".85" stroke="#c9b48a" stroke-width=".25"/><g fill="#8a6a3a"><circle cx="2.4" cy="3.4" r=".3"/><circle cx="3.8" cy="3.1" r=".3"/><circle cx="5.2" cy="3.4" r=".28"/><circle cx="3.2" cy="3.9" r=".25"/><circle cx="4.6" cy="3.8" r=".25"/></g>`,
    fly:`<path d="M7.4 3.6 Q6.6 .2 3.2 -.4 Q4.8 2.2 7.6 4Z" fill="#f2ead2" opacity=".8" stroke="#c9b48a" stroke-width=".25"/>`,
    body:`<path d="M6 5.4 l-.8 1.2 M7 5.6 l0 1.2 M7.9 5.4 l.8 1.1" stroke="#7a5a2a" stroke-width=".35"/><ellipse cx="3.6" cy="4.8" rx="2.8" ry="1.3" fill="#c49a4a"/><path d="M1.4 4.8 h4.6" stroke="#8a6a30" stroke-width=".3"/>
      <ellipse cx="7.2" cy="4.4" rx="1.4" ry="1.2" fill="#b48a3a"/><circle cx="9" cy="4.4" r="1.1" fill="#a86a30"/><circle cx="9.2" cy="4.1" r=".5" fill="#6a2a18"/><path d="M9.8 4 L12 3.2 M9.8 4.2 L11.8 3.8" stroke="#7a5a2a" stroke-width=".35"/>`,
    /* rests head-down on stems near the water, as marsh flies do; its
       larvae hunt snails */
    plan:(g,rnd)=>{ const dn=(j,s)=>({up:g.leafUp(j,s)+180}), sit={bob:.15,every:1};
      return bugPlan(g.leaf(4,.4),dn(4,.4),rnd).hold(5,sit).to([52,-4],.9).to([64,4],.7).to(g.cat(1,.3),.8,{up:g.catUp(1)+180}).hold(4.6,sit)
        .to([100,0],.7).to(g.leaf(11,.5),.6,dn(11,.5)).hold(4.2,sit).to([92,-8],.9).to([62,-6],1).to(g.leaf(4,.4),.8,dn(4,.4)).close(); }},
  { k:'robberfly', name:'robber fly', W:16,H:10,ax:8.8,ay:8,bz:.045,bs:-.5,wo:'10px 3.8px',
    rest:`<path d="M10.2 3.6 Q6 3 1.4 4.6 Q6 5 10.2 4.4Z" fill="#c9c4b4" opacity=".75"/>`,
    fly:`<path d="M10 3.8 Q9 -.2 5 -1 Q7 2.4 10.2 4.4Z" fill="#c9c4b4" opacity=".7"/>`,
    add:`<ellipse cx="9.8" cy="7.9" rx=".9" ry=".4" fill="#c9d6d4" opacity=".7"/><circle cx="10.4" cy="8.4" r=".9" fill="#3b3a33"/>`,
    body:`<path d="M9 6 L7.6 8.2 M10 6.2 L9.8 8.3 M11 6 L12.4 8" stroke="#3a3228" stroke-width=".5"/>
      <path d="M1 5.4 Q4 4.2 8.4 5" stroke="#8a8272" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M2 5.1 h.6 M4 4.8 h.6 M6 4.8 h.6" stroke="#5a5446" stroke-width="1.6"/>
      <path d="M8 5.6 Q8.4 2.6 10.6 3 Q12 3.6 11.6 5.8Z" fill="#6b6456"/><circle cx="12.6" cy="4.8" r="1.2" fill="#5a5446"/><circle cx="12.9" cy="4.5" r=".7" fill="#4a3a2a"/>
      <path d="M13.6 5.4 l.8 .5 M13.5 5.8 l.7 .3" stroke="#d8cfa8" stroke-width=".35"/><path d="M13.4 5.6 L14.8 6.2" stroke="#2a2420" stroke-width=".35"/>`,
    /* an ambush hunter: waits on the tallest tip, darts out to snatch a
       gnat in midair and comes back to the same lookout to eat it */
    plan:(g,rnd)=>{ const perch=g.leaf(7,1), G1=[92,-12], G2=[56,-16], eat={bob:.15,every:.5};
      const P=bugPlan(perch,{tilt:-8},rnd).hold(3.4).to(G1,.3,{e:RB_DART}).mark('c1').to(perch,.45,{tilt:-8}).hold(4.4,eat).mark('e1').hold(1.6)
        .to(G2,.3,{e:RB_DART}).mark('c2').to(perch,.45,{tilt:-8}).hold(4.4,eat).mark('e2').hold(1.6);
      const R=P.close(), M=R.M, gnat='<g class="rb-gnat"><ellipse cx="-.5" cy="-.6" rx=".9" ry=".4" fill="#c9d6d4" opacity=".7"/><circle r=".85" fill="#3b3a33"/></g>';
      R.add=[[M.c1,M.e1],[M.c2,M.e2]];
      R.props=[rbProp(G1,4,4,gnat,{win:[[0,M.c1],[M.e2,R.T]]}),rbProp(G2,4,4,gnat,{win:[[M.e1,M.c2]]})]; return R; }},
  { k:'longlegs', name:'long-legged fly', W:10,H:10,ax:5,ay:9,bz:.045,bs:-.5,wo:'5.8px 3.8px',
    rest:`<path d="M6 3.8 Q3 3 .4 3.8 Q3 4.4 6 4.2Z" fill="#eaf0ea" opacity=".75" stroke="#b0beb0" stroke-width=".2"/><circle cx="1.6" cy="3.7" r=".35" fill="#4a4a3a"/>`,
    fly:`<path d="M5.8 3.8 Q5 .6 2 0 Q3.4 2.4 6 4.2Z" fill="#eaf0ea" opacity=".75"/>`,
    body:RB_LONGLEG_BODY,
    alt:RB_LONGLEG_BODY+`<path d="M6 3.8 Q6.6 .4 4.4 -1.4 Q4.4 1.6 5.8 4.2Z" fill="#eaf0ea" opacity=".8" stroke="#b0beb0" stroke-width=".2"/><circle cx="4.6" cy="-.8" r=".4" fill="#4a4a3a"/>`,
    /* stands tall on its long legs on a blade and waves its wings, a
       little flag display */
    plan:(g,rnd)=>{ const A=g.leaf(5,1), B=g.leaf(8,1);
      const P=bugPlan(A,{tilt:-4},rnd).hold(1.4).mark('a').hold(.35).mark('b').hold(.6).mark('c').hold(.35).mark('d').hold(1.6)
        .to([66,-6],.5).to(B,.5,{tilt:6}).hold(1.2).mark('e').hold(.35).mark('f').hold(.5).mark('g').hold(.35).mark('h').hold(1.8).to([68,-8],.5).to(A,.5,{tilt:-4});
      const R=P.close(), M=R.M; R.alt=[[M.a,M.b],[M.c,M.d],[M.e,M.f],[M.g,M.h]]; return R; }},
  { k:'gallfly', name:'cigar gall fly', W:10,H:7,ax:5,ay:6.2,bz:.045,bs:-.5,wo:'6px 3.2px',
    rest:`<path d="M6.2 3 Q3.4 2.2 .4 3.4 Q3.4 4 6.2 3.8Z" fill="#eef1ee" opacity=".75" stroke="#b9c1bd" stroke-width=".2"/>`,
    fly:`<path d="M6 3.2 Q5.2 0 2.4 -.6 Q3.6 1.8 6.2 3.8Z" fill="#eef1ee" opacity=".75"/>`,
    body:`<path d="M4.6 5.2 l-.6 1 M5.6 5.4 l0 1 M6.5 5.2 l.6 .9" stroke="#1c1c1c" stroke-width=".35"/><ellipse cx="3.2" cy="4.4" rx="2.4" ry="1.5" fill="#23252a"/>
      <ellipse cx="6.2" cy="4" rx="1.6" ry="1.4" fill="#2c2e33"/><path d="M5.2 3.1 Q6.2 2.7 7.2 3.2" stroke="#8a93a0" stroke-width=".35" fill="none"/><circle cx="8" cy="4.2" r="1" fill="#2a2a2a"/><circle cx="8.3" cy="3.9" r=".45" fill="#7a3a22"/>`,
    /* lays its eggs in the growing tips of reeds; the grub makes the tip
       swell into a cigar-shaped gall, like last year's one on the right */
    plan:(g,rnd)=>{ const dn=(j,s)=>({up:g.leafUp(j,s)+180}), lay={bob:.2,every:.3}, gall=g.leaf(12,.84);
      const P=bugPlan(g.leaf(5,.95),dn(5,.95),rnd).hold(3.2,lay).to([70,-8],.6).to([84,-2],.5).to(g.leaf(9,.94),.5,dn(9,.94)).hold(3,lay)
        .to([108,-10],.6).to([gall[0]-2.4,gall[1]-2],.5,{up:g.leafUp(12,.84)}).hold(2.4).to([96,-14],.7).to([70,-10],.7).to(g.leaf(5,.95),.6,dn(5,.95));
      const R=P.close();
      R.props=[rbProp(gall,6,14,'<path d="M0 -5.4 L0 -8" stroke="#8fae7c" stroke-width=".8" stroke-linecap="round"/><ellipse rx="2" ry="5.4" fill="#a8bd7e" stroke="#7c9a58" stroke-width=".35"/><path d="M-1.4 -3 Q0 -1.6 1.4 -3 M-1.6 0 Q0 1.2 1.6 0 M-1.3 3 Q0 4 1.3 3" stroke="#7c9a58" stroke-width=".3" fill="none"/>',{r:g.leafUp(12,.84)})];
      return R; }},
  { k:'katydid', name:'meadow katydid', W:18,H:11,ax:9.4,ay:9.6,bz:.05,bs:-.55,wo:'12.6px 4.8px',
    rest:`<path d="M13.2 4.6 Q8 3.4 .6 5 Q7 5.8 13.2 5.6Z" fill="#7ab04a"/><path d="M13 4.7 Q8 3.8 1.4 5" stroke="#9a6a3a" stroke-width=".5" fill="none"/>`,
    fly:`<path d="M12.6 4.8 Q11 -.6 5.6 -1.6 Q8 2.6 12.8 5.4Z" fill="#cfe6b2" opacity=".85"/>`,
    body:`<path d="M13 6.8 l.6 2.8 M12 7 l-.4 2.6" stroke="#6fa04a" stroke-width=".4"/><path d="M9.6 6.6 Q5 3.4 2.4 4.8 Q5 6.4 9.6 7.2Z" fill="#8cc05a"/><path d="M2.6 4.9 L6.6 9.6" stroke="#7aa84e" stroke-width=".5" stroke-linecap="round"/>
      <path d="M3 6.4 Q3 5 6 4.8 L13.4 4.6 Q15.8 5 15.8 6.6 Q13.6 7.8 6 7.6 Q3.4 7.4 3 6.4Z" fill="#8cc05a"/><circle cx="14.8" cy="5.8" r=".55" fill="#7a3a22"/>
      <path d="M15.4 5 Q20 -1 26 -2.4 M15.2 4.9 Q18 -2 22 -4" stroke="#8a9a5a" stroke-width=".22" fill="none"/>`,
    /* sings from a stem by rubbing its wings together, then flies a
       short way and sings again */
    plan:(g,rnd)=>{ const up=(j,s)=>({up:g.leafUp(j,s)}), A=g.leaf(7,.68), B=g.cat(2,.55), buzz={bob:.2,every:.12};
      const P=bugPlan(A,up(7,.68),rnd).hold(1).mark('a').hold(2.4,buzz).mark('b').hold(1).mark('c').hold(2,buzz).mark('d').hold(1)
        .to([90,-10],.5,{e:'ease-out'}).to([106,-8],.4).to(B,.4,{up:g.catUp(2),e:'ease-in'}).hold(1).mark('e').hold(2.6,buzz).mark('f').hold(1.2)
        .to([100,-12],.5,{e:'ease-out'}).to([84,-10],.4).to(A,.4,{...up(7,.68),e:'ease-in'});
      const R=P.close(), M=R.M, song='<g class="rb-sing"><path d="M0 -3 Q-2 0 0 3 M-2 -4.6 Q-5 0 -2 4.6" stroke="#7aa84e" stroke-width=".55" fill="none" stroke-linecap="round"/></g>';
      R.props=[rbProp([A[0]-10,A[1]-3],8,11,song,{win:[[M.a,M.b],[M.c,M.d]]}),rbProp([B[0]-10,B[1]-3],8,11,song,{win:[[M.e,M.f]]})]; return R; }}
];
/* field-guide lines for the bug collection, by key */
const REED_BUG_NOTES={
  dragonfly:'Patrols its own stretch of water and keeps coming back to the same few perches. It catches midges and mosquitoes in midair, scooping them up with its legs.',
  damselfly:'A slimmer cousin of the dragonfly that folds its wings along its back to rest. It spent its first year underwater as a nymph, down among these same stems.',
  honeybee:'Cattails are pollinated by the wind, but bees still come for the pollen the spike above the brown head sheds, and pack it into baskets on their hind legs.',
  ladybug:'Walks up to the highest point it can find before it takes off. It comes to the reeds for the aphids that suck their sap.',
  mayfly:'The adult lives for about a day and can’t eat. Males dance in the air, climbing and then parachuting down, so the females can find them.',
  midges:'Swarms gather over a landmark, often the tallest reed around, and females fly into the cloud to find a mate. These ones don’t bite.',
  firefly:'Its light comes from a chemical reaction and gives off almost no heat. Each kind flashes its own pattern; this one flashes as it swoops upward, drawing a J.',
  skipper:'The least skipper lives in wet grass and sedge, and its caterpillars eat those grasses. It flies low and fast in short skips.',
  cranefly:'Looks like a giant mosquito but never bites, and adults barely eat. Its long legs come off easily, so it bobs gently on them instead of gripping hard.',
  hoverfly:'Dressed like a wasp but harmless. It can hold perfectly still in midair, then vanish sideways in a blink.',
  darner:'One of the biggest dragonflies around. It lays its eggs into stems just below the water, dipping the tip of its tail at the base of a reed.',
  jewelwing:'A damselfly with black wings and a metallic green body. It flicks its wings open and shut while it perches.',
  eyedbrown:'A butterfly of sedge meadows and marshes. The row of eyespots on its wings may draw a bird’s peck away from its body.',
  caddisfly:'Its larva builds a portable case out of sand, twigs or bits of reed, bound together with silk. The adult rests with its wings folded like a tent.',
  stonefly:'The nymph lives under stones in clean, cold water. When it’s ready it climbs out onto a stem, splits its skin, and the winged adult walks out, leaving the empty shell behind.',
  reedbeetle:'A metallic leaf beetle found only on water plants. Adults nibble notches in reed leaves; the larvae breathe underwater by tapping the air inside the roots.',
  lacewing:'Delicate, golden-eyed and easily blown about. Its larvae are called aphid lions and clear the aphids off a reed by the dozen.',
  cattailmoth:'Its caterpillars live inside cattail heads, eating the seeds and tying the fluff together with silk, which is why some heads stay shaggy all winter.',
  grasshopper:'Lives only in wet meadows and marshes and clings to the stems. Instead of singing it makes a dry little tick by flicking a hind leg.',
  ichneumon:'It can find a grub hidden inside a stem, then drills in with its long, thin ovipositor to lay an egg on it. It can’t sting you.',
  boatman:'Rows through the water with its oar-shaped hind legs and carries a silver bubble of air to breathe. It flies from pond to pond.',
  whirligig:'A beetle that spins in circles on the surface. Each eye is split in two: one half looks above the water, the other below.',
  froghopper:'For its size, one of the best jumpers of any animal. Its young hide in the frothy spittle you find on grass stems.',
  paperwasp:'Scrapes fibre from old stems and wood and chews it into paper to build its nest. Listen closely and you can hear it rasping.',
  muddauber:'Gathers mud at the water’s edge, rolls it into a ball and flies it home to build a nest of mud tubes.',
  marshfly:'Rests head-down on stems near the water. Its larvae hunt snails.',
  robberfly:'An ambush hunter. It waits on a lookout, darts out to grab another insect in midair, and returns to the same spot to eat it.',
  longlegs:'A tiny metallic green fly that stands tall on long legs. Males wave their wings at females, a little flag display on a leaf.',
  gallfly:'Lays its eggs in reed shoots. The grub makes the tip swell into a cigar-shaped gall and spends the winter inside it.',
  katydid:'Meadow katydids sing from stems by rubbing their wings together. Their antennae can be longer than their whole body.'};
/* ── the later visitors: a kit of body plans and a tour helper ──
   Nos. 31-80 are built from a handful of body plans (side view, head to
   the right, feet at the anchor) coloured per species, and most of their
   visits are a "tour": a list of perches (a blade tip, a spot up a leaf or
   stem, a cattail, the waterline, a point in the air) with a hold at each
   and a flight style between them. Nos. 61-80 and 91-100 are made-up
   reed-bed legends (fic:true); the collection says so. */
function rbScale(a,s){
  const o={...a}, w=x=>x?`<g transform="scale(${s})">${x}</g>`:x;
  ['rest','fly','body','flyStill','wings','alt','add'].forEach(k=>{ if(o[k]) o[k]=w(o[k]); });
  o.W=rf1(a.W*s); o.H=rf1(a.H*s); o.ax=rf1(a.ax*s); o.ay=rf1(a.ay*s);
  o.wo=a.wo.split(' ').map(v=>rf1(parseFloat(v)*s)+'px').join(' ');
  if(a.glow) o.glow=[rf1(a.glow[0]*s),rf1(a.glow[1]*s)];
  return o;
}
const rbDots=(d,st)=>(d||[]).map(([x,y,r,f,s])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${s||st?` stroke="${s||st}" stroke-width=".3"`:''}/>`).join('');
const RBK={
  beetle:o=>{ const hc=o.hc||'#1b1b1b', lc=o.lc||hc;
    const dome=`<path d="M1.2 4.8 Q1.2 1.6 5 1.4 Q8.2 1.5 8.4 4.6 Q5 5.4 1.2 4.8Z" fill="${o.c}"/>`;
    const shine=o.sh?`<path d="M2.2 2.8 Q5 1.8 7.4 2.5" stroke="${o.sh}" stroke-width=".5" fill="none" opacity=".75"/>`:'';
    const edge=o.e?`<path d="M1.4 4.6 Q5 5.2 8.3 4.5" stroke="${o.e}" stroke-width=".45" fill="none"/>`:'';
    const ant=o.ant==='long'?`<path d="M9.4 3.4 Q11.4 1 13.6 .6" stroke="${lc}" stroke-width=".3" fill="none"/>`
      :o.ant==='club'?`<path d="M9.4 3.4 L11.2 2" stroke="${lc}" stroke-width=".3"/><circle cx="11.3" cy="1.9" r=".45" fill="${lc}"/>`:`<path d="M9.5 3.6 l1 -.8" stroke="${lc}" stroke-width=".3"/>`;
    return {W:10,H:6,ax:5,ay:5.6,bz:.05,bs:-.5,wo:'6px 3.4px',wingsFirst:true,
      rest:dome+shine+edge+rbDots(o.spots)+(o.xr||''),
      flyStill:`<g transform="rotate(-28 7.8 4.4)">${dome}${shine}${rbDots(o.spots)}</g>`,
      fly:`<ellipse cx="3.4" cy="1.8" rx="3.2" ry="1" transform="rotate(-18 3.4 1.8)" fill="#eef2ea" stroke="#b9c3b1" stroke-width=".3" opacity=".8"/>`,
      body:`<path d="M2.8 5 l-.6 .9 M4.6 5.2 l0 .8 M6.4 5 l.6 .8" stroke="${lc}" stroke-width=".45" stroke-linecap="round"/><path d="M1.6 4.8 L8 4.8" stroke="${lc}" stroke-width=".8" stroke-linecap="round"/>
        <ellipse cx="8.8" cy="4" rx="1" ry=".9" fill="${hc}"/>${o.snout?`<path d="M9.4 4.1 Q11 4.6 12.2 6" stroke="${hc}" stroke-width=".7" stroke-linecap="round" fill="none"/>`:''}${o.horn?`<path d="M9.2 3.4 Q10.6 1.4 12.6 .6" stroke="${o.horn}" stroke-width=".8" stroke-linecap="round" fill="none"/>`:''}${ant}${o.x||''}`}; },
  fly:o=>{ const lc=o.lc||'#2a2622', wf=o.wf||'#e4f0f1', ws=o.ws||'#9cc5c9', L=o.long;
    return {W:11,H:L?10:8,ax:6.4,ay:L?8.8:6.4,bz:o.bz||.04,bs:-.5,wo:'6.8px 3.2px',
      rest:`<ellipse cx="4" cy="2.9" rx="3.4" ry=".95" transform="rotate(-4 4 2.9)" fill="${wf}" stroke="${ws}" stroke-width=".35" opacity=".85"/>`,
      fly:`<ellipse cx="5.6" cy="1.6" rx="3" ry="1.2" transform="rotate(-24 5.6 1.6)" fill="${wf}" stroke="${ws}" stroke-width=".35" opacity=".8"/>`,
      body:(L?`<path d="M5.6 5.6 L4.2 8.6 M6.6 5.8 L6.6 9 M7.4 5.6 L9 8.6" stroke="${lc}" stroke-width=".3" fill="none"/>`:`<path d="M5.6 5.6 l-.5 1.1 M6.6 5.8 l.1 1.1 M7.4 5.6 l.6 1" stroke="${lc}" stroke-width=".4"/>`)
        +`<ellipse cx="3.6" cy="4.6" rx="3.2" ry="1.7" fill="${o.a}"/>${o.b?`<path d="M2.3 3.2 Q2.8 4.6 2.3 6 M4.2 3 Q4.7 4.6 4.2 6.2" stroke="${o.b}" stroke-width=".8" fill="none"/>`:''}
        <ellipse cx="7" cy="4.2" rx="1.6" ry="1.6" fill="${o.t||'#4a3f2a'}"/><circle cx="8.9" cy="4.4" r="1.5" fill="${o.e||'#9a3f25'}"/><circle cx="9.3" cy="4" r=".4" fill="#fff" opacity=".6"/>${o.x||''}`}; },
  moth:o=>{ const bc=o.bc||'#8a6b4a';
    const ant=o.ant==='feather'?`<path d="M10.2 4.2 Q9 1.6 6.8 1.2" stroke="${bc}" stroke-width=".3" fill="none"/><path d="M9.6 3 l.5 -.5 M9 2.2 l.4 -.6 M8.2 1.7 l.2 -.6 M7.4 1.4 l.1 -.5" stroke="${bc}" stroke-width=".22"/>`
      :o.ant==='long'?`<path d="M10.6 4.6 Q14 1 18 1.2 M10.4 4.4 Q13 .6 16.4 -.2" stroke="${bc}" stroke-width=".26" fill="none"/>`:`<path d="M10.2 4.2 Q8.8 1.8 6.6 1.6" stroke="${bc}" stroke-width=".3" fill="none"/>`;
    return {W:12,H:8,ax:6,ay:7,bz:o.bz||.06,bs:-.55,wo:'9px 4.4px',
      rest:`<path d="M9.6 3.8 Q5 2 .6 4.9 Q5 6.2 9.6 5.6Z" fill="${o.c}"/>${o.s?`<path d="M9 4.2 Q5.6 3 1.6 4.8" stroke="${o.s}" stroke-width=".55" fill="none"/>`:''}${rbDots(o.d)}${o.xr||''}`,
      fly:`<g fill="${o.fc||o.c}" opacity=".9"><path d="M9 4.2 Q8.2 .2 4 -.6 Q6 2.6 9.2 4.8Z"/><path d="M8.6 4.4 Q5.6 1.6 1.6 1.8 Q4.8 3.8 8.8 5Z"/></g>`,
      body:`<path d="M6.4 6 l-.6 1 M7.4 6.1 l0 1 M8.3 6 l.6 .9" stroke="${bc}" stroke-width=".35"/><path d="M2 5.4 Q5 4.6 8.6 5" stroke="${o.ab||bc}" stroke-width="1.3" stroke-linecap="round" fill="none"/>
        <circle cx="10.2" cy="4.9" r="1" fill="${bc}"/><circle cx="10.5" cy="4.7" r=".4" fill="#2a1e12"/>${ant}${o.x||''}`}; },
  bfly:o=>({W:13,H:13,ax:6.8,ay:10.8,bz:o.bz||.1,bs:-.6,wo:'7.4px 9px',same:true,
    wings:`<g opacity="${o.op||1}"><path d="M7 9.2 Q2.6 8.8 1.8 5 Q5.2 3.8 7.6 8.6Z" fill="${o.h}"/><path d="M7.4 9 L4.4 1 Q8.8 .3 9.8 2.4 Q8.6 6 7.9 8.9Z" fill="${o.f}"/></g>
      ${o.tail?`<path d="M2.4 6.2 L.2 8.8" stroke="${o.h}" stroke-width=".8" stroke-linecap="round"/>`:''}${o.e?`<path d="M4.6 1.2 Q8.6 .5 9.7 2.4 M1.9 5.2 Q2.4 7.8 6.8 9" stroke="${o.e}" stroke-width=".5" fill="none"/>`:''}${rbDots(o.sp)}${o.x||''}`,
    body:`<path d="M6 9.8 l-.8 1.2 M7 10 l0 1.3 M7.9 9.8 l.7 1.1" stroke="${o.b}" stroke-width=".4"/><path d="M1.6 9.6 Q4 8.6 6.6 9 Q4 10.4 1.6 9.6Z" fill="${o.b}"/>
      <ellipse cx="7.4" cy="9" rx="1.5" ry="1.2" fill="${o.b}"/><circle cx="9.2" cy="8.6" r="1" fill="${o.b}"/><circle cx="9.5" cy="8.4" r=".5" fill="#1f160c"/>
      <path d="M9.4 7.8 L12 3.6" stroke="${o.b}" stroke-width=".3"/><circle cx="12" cy="3.6" r=".42" fill="${o.b}"/>`}),
  odo:o=>({W:22,H:14,ax:12,ay:8.8,bz:.09,bs:.55,wo:'11px 7.7px',same:true,under:true,
    wings:`<g fill="${o.wf||'#e4f0f1'}" stroke="${o.ws||'#9cc5c9'}" stroke-width=".4" opacity=".85"><ellipse cx="9" cy="3.4" rx="5.6" ry="1.9" transform="rotate(-14 9 3.4)"/><ellipse cx="13.4" cy="3.6" rx="4.8" ry="1.7" transform="rotate(16 13.4 3.6)"/>
      <ellipse cx="9" cy="10.6" rx="5.6" ry="1.9" transform="rotate(14 9 10.6)"/><ellipse cx="13.4" cy="10.4" rx="4.8" ry="1.7" transform="rotate(-16 13.4 10.4)"/></g>
      ${o.spots?`<g fill="${o.spots}"><ellipse cx="9" cy="3.3" rx="1.1" ry=".9"/><ellipse cx="5.2" cy="4.2" rx=".9" ry=".7"/><ellipse cx="13" cy="3" rx=".9" ry=".7"/><ellipse cx="9" cy="10.7" rx="1.1" ry=".9"/><ellipse cx="5.2" cy="9.8" rx=".9" ry=".7"/><ellipse cx="13" cy="11" rx=".9" ry=".7"/></g>`:''}`,
    body:`<path d="M1.5 7 L15 7" stroke="${o.a}" stroke-width="1.5" stroke-linecap="round"/>${o.r?`<path d="M3.5 7h.6M6 7h.6M8.5 7h.6M11 7h.6" stroke="${o.r}" stroke-width="1.6"/>`:''}
      <ellipse cx="15.6" cy="7" rx="2.2" ry="1.7" fill="${o.t}"/><circle cx="17.8" cy="7" r="1.5" fill="${o.e}"/><circle cx="18.3" cy="6.5" r=".45" fill="#f4f8f2"/>${o.x||''}`}),
  dam:o=>{ const W=`fill="${o.wf||'#e4f0f1'}" stroke="${o.ws||'#9cc5c9'}" stroke-width=".35"`;
    return {W:20,H:10,ax:13.6,ay:7.2,bz:.07,bs:-.4,wo:'14px 5.5px',
      body:`<path d="M1 6.2 L12.8 6.2" stroke="${o.a}" stroke-width="1.1" stroke-linecap="round"/>${o.r?`<path d="M3.4 6.2h.7M5.6 6.2h.7M7.8 6.2h.7M10 6.2h.7" stroke="${o.r}" stroke-width="1.2"/>`:''}${o.tip?`<path d="M1 6.2h2.2" stroke="${o.tip}" stroke-width="1.2" stroke-linecap="round"/>`:''}
        <path d="M13.6 7 l-.8 1.7 M14.4 7.1 l.1 1.8 M15.1 7 l.9 1.6" stroke="#1d2a30" stroke-width=".35" fill="none"/><ellipse cx="14.3" cy="6" rx="2" ry="1.3" fill="${o.t}"/>
        <circle cx="16.9" cy="5.8" r="1.3" fill="${o.e}"/><circle cx="17.3" cy="5.4" r=".45" fill="#eef6f0"/>${o.x||''}`,
      rest:o.spread?`<g ${W} opacity=".85"><path d="M14 5.4 Q10.6 .6 6 .8 Q9.6 3.4 14 5.8Z"/><path d="M14 5.5 Q9 4.4 4.6 6.6 Q9.6 6.6 14 5.9Z"/></g>`
        :`<g ${W} opacity=".85"><path d="M14 5.3 Q9 3.2 4.5 4.3 Q9 5 14 5.6Z"/><path d="M14 5.2 Q9.5 2.5 5.5 3.3 Q9.5 4.3 14 5.4Z"/></g><circle cx="5.4" cy="3.6" r=".5" fill="${o.st||'#1d3550'}"/>`,
      fly:`<g ${W} opacity=".8"><ellipse cx="11" cy="2.9" rx="4.4" ry="1.2" transform="rotate(-16 11 2.9)"/><ellipse cx="13.2" cy="2.7" rx="4" ry="1.1" transform="rotate(-40 13.2 2.7)"/></g>`}; },
  hop:o=>({W:9,H:6.5,ax:4.6,ay:5.8,bz:.04,bs:-.5,wo:'5.4px 2.2px',wingsFirst:true,
    fly:`<ellipse cx="3.4" cy="1.2" rx="3" ry="1" transform="rotate(-20 3.4 1.2)" ${RB_WING} opacity=".8"/>`,
    body:`<path d="M3.2 4.8 l-.8 1 M5 5 l0 1 M6.4 4.8 l.6 .9" stroke="${o.lc||'#4a3624'}" stroke-width=".4"/>${o.long?`<path d="M-.8 4.2 Q1.4 2 6 1.8 Q8.8 2.2 8.8 4 Q6 5 -.8 4.2Z" fill="${o.c}"/>`:`<path d="M.6 4.6 Q1.4 1.6 6 1.4 Q8.8 2 8.6 4.4 Q6 5.2 .6 4.6Z" fill="${o.c}"/>`}
      ${o.b?`<path d="M2.4 2.2 Q3 3.4 2.6 4.6 M5 1.6 Q5.6 3.2 5.2 4.8" stroke="${o.b}" stroke-width=".7" fill="none"/>`:''}${o.st?`<path d="M0 3.4 Q4 2.2 8.4 2.8 M.4 4 Q4 3.2 8.4 3.6" stroke="${o.st}" stroke-width=".45" fill="none"/>`:''}
      <path d="M7.2 1.9 Q8.8 2.2 8.8 4.2 Q8 4.8 7.2 4.6Z" fill="${o.h||o.c}"/><circle cx="8" cy="2.8" r=".45" fill="${o.e||'#e3d2a8'}"/>${o.x||''}`}),
  shield:o=>({W:11,H:7,ax:5.4,ay:6.4,bz:.05,bs:-.5,wo:'6.4px 2.6px',wingsFirst:true,
    fly:`<ellipse cx="3.6" cy="1.6" rx="3.2" ry="1.1" transform="rotate(-18 3.6 1.6)" ${RB_WING} opacity=".8"/>`,
    body:`<path d="M3.4 5.4 l-.7 1 M5.4 5.6 l0 1 M7.2 5.4 l.7 .9" stroke="${o.lc||'#3a4a22'}" stroke-width=".45"/><path d="M.6 5 Q.8 2.6 3.6 2 L7.4 1.4 Q9.2 1.8 9.6 3.8 Q9 5.4 .6 5Z" fill="${o.c}"/>
      <path d="M3.6 2.1 L6.6 4.8 L1.2 4.8Z" fill="${o.c2||o.c}" opacity=".7"/><circle cx="9.5" cy="3.7" r=".75" fill="${o.h||o.c}"/><circle cx="9.8" cy="3.4" r=".3" fill="#3a2a1a"/>
      <path d="M9.8 3.2 Q11.4 1.8 12.4 2.2" stroke="${o.lc||'#3a4a22'}" stroke-width=".3" fill="none"/>${o.x||''}`}),
  cricket:o=>({W:16,H:9,ax:8.6,ay:8,bz:.05,bs:-.6,wo:'10.6px 3.6px',wingsFirst:true,
    rest:`<path d="M11.8 3.4 Q7 2.4 1.2 3.8 Q6 4.6 11.8 4.4Z" fill="${o.w}" opacity="${o.wo||1}"/><path d="M11 3.6 L2 3.9 M8 3.4 L6 4.3 M5 3.4 L3.4 4" stroke="${o.v||'#9ab87a'}" stroke-width=".25"/>`,
    fly:`<path d="M10.6 3.6 Q9 -1.6 3.6 -1.4 Q5.6 2 10.6 4.2Z" fill="${o.w}" opacity=".8"/>`,
    body:`<path d="M11.6 6 l.4 1.9 M10.4 6.2 l-.4 1.8" stroke="${o.lc||o.c}" stroke-width=".4"/><path d="M2.4 5.6 Q2.4 4 6 3.9 L12 3.6 Q14.4 3.9 14.4 5.4 Q12.2 6.6 6 6.4 Q2.8 6.3 2.4 5.6Z" fill="${o.c}"/>
      <circle cx="13.6" cy="4.6" r=".55" fill="${o.e||'#3d4a24'}"/><path d="M14 4 Q18 -1 24 -2.4 M13.8 3.9 Q16.6 -2.2 20.4 -4" stroke="${o.lc||o.c}" stroke-width=".22" fill="none"/>
      <path d="M9.4 5.6 Q5.4 3 3.4 4.2 Q5.2 5.8 9.4 6.2Z" fill="${o.c}"/><path d="M3.4 4.3 L6.4 8" stroke="${o.lc||o.c}" stroke-width=".5" stroke-linecap="round"/>${o.x||''}`}),
  wasp:o=>({W:14,H:10,ax:7.6,ay:7.8,bz:o.bz||.045,bs:-.5,wo:'8.6px 4px',
    rest:`<path d="M8.8 3.8 Q5 2.6 2.2 3.6 Q5.4 4.4 8.8 4.3Z" fill="${o.wf||'#d2dade'}" opacity=".7"/>`,
    fly:`<path d="M8.6 4 Q7.6 .2 4 -.6 Q5.8 2.4 8.8 4.4Z" fill="${o.wf||'#d2dade'}" opacity=".65"/>`,
    body:`<path d="M8 5.8 L7.4 7.4 M8.8 5.9 L8.8 7.6 M9.6 5.8 L10.4 7.3" stroke="${o.lc||'#2a2420'}" stroke-width=".4"/><path d="M1.6 5.2 Q2.2 3.4 4.6 3.6 Q6.8 4 7 5.2 Q5 6.6 1.6 5.2Z" fill="${o.a}"/>
      ${o.b?`<path d="M3 3.8 Q3.4 4.9 2.9 5.9 M4.8 3.7 Q5.3 4.9 4.8 6" stroke="${o.b}" stroke-width=".55" fill="none"/>`:''}<path d="M7 5 L7.8 4.9" stroke="${o.a}" stroke-width=".5"/>
      <ellipse cx="8.8" cy="4.7" rx="1.3" ry="1.1" fill="${o.t||o.a}"/><circle cx="10.5" cy="4.8" r="1" fill="${o.h||o.a}"/>${o.face?`<path d="M10.9 4.3 Q11.5 5 10.9 5.7" stroke="${o.face}" stroke-width=".55" fill="none"/>`:''}
      <path d="M10.9 3.9 Q12 2.4 13.2 2.2" stroke="${o.lc||'#2a2420'}" stroke-width=".3" fill="none"/>${o.x||''}`})
};
Object.keys(RBK).forEach(k=>{ const f=RBK[k]; RBK[k]=o=>({...f(o),kit:k}); });
/* where a perch is, and which way the bug sits on it */
function rbSpot(g,s){
  if(s.tip!=null) return {p:g.leaf(s.tip,s.s??1),q:{tilt:s.tilt||0}};
  if(s.leaf!=null) return {p:g.leaf(s.leaf,s.s),q:{up:g.leafUp(s.leaf,s.s)+(s.down?180:0)}};
  if(s.cat!=null) return s.flat?{p:g.cat(s.cat,s.f),q:{tilt:s.tilt||0}}:{p:g.cat(s.cat,s.f),q:{up:g.catUp(s.cat)+(s.down?180:0)}};
  if(s.water!=null) return {p:[s.water,33.6],q:{tilt:s.tilt||0}};
  return {p:s.air,q:{tilt:s.tilt||0}};
}
/* fly from where the plan is now to `to`, in a style */
function rbTravel(P,to,q,style='fly'){
  const a=P.at(), d=Math.hypot(to[0]-a[0],to[1]-a[1]), lx=f=>rf1(a[0]+(to[0]-a[0])*f), ly=f=>a[1]+(to[1]-a[1])*f, cl=y=>rf1(Math.max(-22,y)), top=Math.min(a[1],to[1]);
  if(style==='dart') P.to([lx(.5),cl(top-6-d*.08)],rf1(.22+d*.004),{e:RB_DART}).to(to,rf1(.22+d*.004),{...q,e:RB_DART});
  else if(style==='hop') P.to([lx(.5),cl(top-8-d*.15)],.22,{e:'cubic-bezier(.2,.7,.4,1)'}).to(to,.24,{...q,e:'cubic-bezier(.6,0,.8,.4)'});
  else if(style==='bob'||style==='flutter'){ const n=Math.max(2,Math.round(d/(style==='bob'?14:11)));
    for(let i=1;i<n;i++) P.to([lx(i/n),cl(ly(i/n)-7-(i%2?6:0))],style==='bob'?.42:.6);
    P.to(to,style==='bob'?.45:.6,q); }
  else if(style==='drift') P.to([lx(.35),cl(top-10)],rf1(1+d*.02)).to([lx(.7),cl(top-4)],rf1(1+d*.02),{glide:true}).to(to,1.1,q);
  else if(style==='skim'){ const n=Math.max(2,Math.round(d/10)); for(let i=1;i<n;i++) P.to([lx(i/n),i%2?27:32],.35); P.to(to,.45,q); }
  else P.to([lx(.5),cl(top-8-d*.06)],rf1(.5+d*.008)).to(to,rf1(.5+d*.008),q);
  return P;
}
/* a visit as a list of stops; `mark:'x'` notes x0/x1 around the stop's
   hold, `cmark` around its crawl, so poses and props can follow along */
function rbTour(g,rnd,o){
  const S=o.stops.map(s=>({...s,...rbSpot(g,s)}));
  const P=bugPlan(S[0].p,S[0].q,rnd);
  S.forEach((s,i)=>{
    if(i) rbTravel(P,s.p,s.q,s.style||o.style);
    if(s.mark) P.mark(s.mark+'0');
    if(s.hover) P.hover(s.hold??(typeof s.hover==='number'?s.hover:2),{jit:s.jit??.6,every:s.every||.3}); else P.hold(s.hold??3,{bob:s.bob||0,every:s.every||.5});
    if(s.mark) P.mark(s.mark+'1');
    if(s.crawl){ const c=rbSpot(g,s.crawl); if(s.cmark) P.mark(s.cmark+'0'); P.crawl(c.p,s.crawlT||2,c.q); if(s.cmark) P.mark(s.cmark+'1'); P.hold(s.hold2??1,{bob:s.bob2||0,every:s.every||.5}); }
  });
  if(o.back!==false) rbTravel(P,S[0].p,S[0].q,o.style);
  return P;
}
const rbW=(M,...names)=>names.map(n=>[M[n+'0'],M[n+'1']]).filter(w=>w[0]!=null&&w[1]!=null);
const rbAt=(p,dx,dy)=>[rf1(p[0]+dx),rf1(p[1]+dy)];
/* the little props they leave about */
const RBP={
  glow:(p,win,cls='')=>({x:p[0],y:p[1],win,html:`<b class="rb-glowp${cls?' '+cls:''}"></b>`}),
  notes:(p,win)=>rbProp(p,6,6,'<g class="rb-note"><path d="M.4 0 v-3.2" stroke="#6a8a5a" stroke-width=".4"/><ellipse cx="-.3" cy="0" rx=".85" ry=".6" fill="#6a8a5a"/></g><g class="rb-note two"><path d="M2.4 -.6 v-3" stroke="#6a8a5a" stroke-width=".4"/><ellipse cx="1.7" cy="-.6" rx=".8" ry=".55" fill="#6a8a5a"/></g>',{win}),
  song:(p,win,flip)=>rbProp(p,8,11,`<g class="rb-sing"><path d="${flip?'M0 -3 Q2 0 0 3 M2 -4.6 Q5 0 2 4.6':'M0 -3 Q-2 0 0 3 M-2 -4.6 Q-5 0 -2 4.6'}" stroke="#7aa84e" stroke-width=".55" fill="none" stroke-linecap="round"/></g>`,{win}),
  rain:(p,win)=>rbProp(p,8,4,'<g class="rb-rain"><path d="M-3 0 v1.4 M0 1.6 v1.4 M3 .4 v1.4 M-1.5 3 v1.2 M1.6 3.6 v1.2" stroke="#8ab8d8" stroke-width=".45" stroke-linecap="round"/></g>',{win}),
  drop:(p,win)=>rbProp(p,3,3,'<g class="rb-drop"><ellipse rx=".55" ry=".8" fill="#a8d4e4"/></g>',{win}),
  bubble:(p,win)=>rbProp(p,4,4,'<circle class="rb-bub" r="1.2" fill="#e8f6fa55" stroke="#8ac0d0" stroke-width=".35"/><circle class="rb-bub two" cx="1" r=".8" fill="#e8f6fa55" stroke="#8ac0d0" stroke-width=".3"/>',{win}),
  twinkle:(p,win)=>rbProp(p,5,5,'<path class="rb-twk" d="M0 -2 L.45 -.45 L2 0 L.45 .45 L0 2 L-.45 .45 L-2 0 L-.45 -.45Z" fill="#fff2b8" stroke="#e8c860" stroke-width=".2"/>',{win}),
  puff:(p,win)=>rbProp(p,6,6,'<g class="rb-puff"><circle r="1.3" fill="#f2d060" opacity=".85"/><circle cx="1.6" cy="-.8" r=".9" fill="#f6dc80" opacity=".85"/><circle cx="-1.4" cy="-1" r=".8" fill="#f6dc80" opacity=".85"/></g>',{win}),
  dew:(p,win)=>rbProp(p,3,4,'<ellipse rx=".95" ry="1.25" fill="#d6eef6" stroke="#8ac0d0" stroke-width=".25"/><circle cx="-.3" cy="-.4" r=".3" fill="#fff"/>',{win}),
  sprout:(p,win)=>rbProp(p,4,4,'<path d="M0 0 v-2.2" stroke="#6f9e5a" stroke-width=".35"/><ellipse cx="-.8" cy="-2.2" rx=".8" ry=".45" fill="#8cc06a" transform="rotate(-30 -.8 -2.2)"/><ellipse cx=".8" cy="-2.4" rx=".8" ry=".45" fill="#8cc06a" transform="rotate(30 .8 -2.4)"/>',{win}),
  mud:p=>rbProp(p,14,4,'<ellipse rx="6.4" ry="1.3" fill="#9a7a58" opacity=".5"/><ellipse cx="-1" rx="3" ry=".6" fill="#7a5a3c" opacity=".5"/>')
};
const RB_MANTIS_REST=`<path d="M8 7.6 L6 11 M9 7.8 L9.6 11 M6.4 7.6 L3.6 10.6" stroke="#6f9a45" stroke-width=".4" fill="none"/><path d="M1 7.4 Q4 6 8 6.8 Q5 8.6 1 7.4Z" fill="#8cb85a"/>
      <path d="M8 6.8 L14 3.4" stroke="#8cb85a" stroke-width="1.2" stroke-linecap="round"/><path d="M14.2 2.6 L16.4 2 L15.4 4Z" fill="#8cb85a"/><circle cx="15.8" cy="2.4" r=".45" fill="#d8e090"/>
      <path d="M15.8 2 Q17.6 .2 19.4 0" stroke="#7aa84e" stroke-width=".22" fill="none"/>`;
const RB_OWL_BODY=a=>`<path d="M11 7 l-1 1.4 M12 7.1 l0 1.4 M12.8 7 l.8 1.2" stroke="#3a3228" stroke-width=".35"/><path d="${a}" stroke="#4a4236" stroke-width="1.2" stroke-linecap="round" fill="none"/>
      <ellipse cx="12.4" cy="6.2" rx="1.6" ry="1.3" fill="#4a4236"/><circle cx="14.4" cy="6.2" r="1.3" fill="#3a3228"/><circle cx="14.8" cy="5.8" r=".7" fill="#8a6a3a"/>
      <path d="M15 5.4 Q18 2 21.6 1.6" stroke="#3a3228" stroke-width=".3" fill="none"/><ellipse cx="21.6" cy="1.6" rx=".7" ry=".5" fill="#3a3228"/>`;
const RB_BACKSWIM=`<path d="M3 5 Q.4 5.6 -2 7.6" stroke="#8a7a5a" stroke-width=".6" stroke-linecap="round" fill="none"/><path d="M-1.8 7.4 l.4 -.8 M-1 6.8 l.4 -.8 M-.2 6.2 l.4 -.8" stroke="#c8b890" stroke-width=".25"/>
      <path d="M.8 4.6 Q1.4 2 5.6 1.8 Q8.6 2.2 8.8 4.6 Q5 5.8 .8 4.6Z" fill="#6a5a44"/><path d="M1.4 3.2 Q5 1.6 8.4 2.8" stroke="#ece4c8" stroke-width="1" fill="none"/>
      <circle cx="8.8" cy="4" r="1" fill="#b0423a"/><path d="M7.6 5.2 l.8 .9 M6.6 5.3 l.2 1" stroke="#6a5a44" stroke-width=".35"/>`;
const rbBug=(k,name,art,plan,more={})=>({...art,k,name,plan,...more});
REED_BUGS.push(
  /* ── real ones, Nos. 31-60 ── */
  rbBug('skimmer','twelve-spotted skimmer',RBK.odo({a:'#6a5a44',r:'#e8e2d0',t:'#7a6a50',e:'#5a4a3a',spots:'#2a2420'}),
    (g,rnd)=>rbTour(g,rnd,{style:'dart',stops:[{cat:0,f:1,flat:1,tilt:-6,hold:3.2},{air:[64,-12],hover:1,jit:.7},{cat:1,f:1,flat:1,tilt:4,hold:3},{tip:12,tilt:-4,hold:2.6}]}).close()),
  rbBug('meadowhawk','ruby meadowhawk',RBK.odo({a:'#c8382a',r:'#7a1a14',t:'#b8603e',e:'#a8402a',wf:'#f4ece0',ws:'#d8b89a'}),
    (g,rnd)=>rbTour(g,rnd,{style:'dart',stops:[{tip:2,tilt:-8,hold:3},{tip:10,tilt:6,hold:3},{tip:13,tilt:-4,hold:2.8},{tip:0,tilt:4,hold:2.6}]}).close()),
  rbBug('pondhawk','eastern pondhawk',{...RBK.odo({a:'#6aaa4a',r:'#1f3a1a',t:'#7fc05a',e:'#4a8a3a'}),add:'<circle cx="19.6" cy="8.4" r=".9" fill="#3b3a33"/><ellipse cx="19" cy="7.6" rx="1" ry=".4" fill="#c9d6d4" opacity=".7"/>'},
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'dart',stops:[{tip:9,tilt:-4,hold:3},{air:[106,-8],hover:.25,jit:0},{tip:9,tilt:-4,hold:4.2,bob:.15,mark:'eat'},{tip:3,tilt:4,hold:3}]}).close(); R.add=rbW(R.M,'eat'); return R; }),
  rbBug('forktail','eastern forktail',RBK.dam({a:'#23302a',r:'#6aa84a',tip:'#4a9ad6',t:'#6aa84a',e:'#2a4a2a'}),
    (g,rnd)=>rbTour(g,rnd,{style:'flutter',stops:[{tip:3,tilt:-6,hold:3.8},{tip:6,tilt:4,hold:3.6},{tip:9,tilt:-4,hold:3.8}]}).close()),
  rbBug('spreadwing','spreadwing',RBK.dam({a:'#2f6a5a',r:'#1f3a34',t:'#4a8a6a',e:'#6ab0c8',spread:1,wf:'#eaf4f0'}),
    (g,rnd)=>rbTour(g,rnd,{style:'flutter',stops:[{leaf:5,s:.5,hold:3.6},{leaf:8,s:.55,hold:3.4,bob:.2},{cat:2,f:.4,hold:3}]}).close()),
  rbBug('copper','bronze copper',RBK.bfly({f:'#d9803a',h:'#bca49a',e:'#8a5a3a',b:'#6a4a3a',sp:[[5.6,2.4,.35,'#2a1a14'],[7.2,4,.35,'#2a1a14'],[6.4,5.8,.3,'#2a1a14'],[3.4,6.6,.3,'#2a1a14'],[3,7.6,.5,'#e0783a']]}),
    (g,rnd)=>rbTour(g,rnd,{style:'bob',stops:[{tip:4,tilt:-3,hold:3.2},{tip:7,tilt:3,hold:3.2},{tip:12,tilt:-2,hold:3}]}).close()),
  rbBug('metalmark','swamp metalmark',rbScale(RBK.bfly({f:'#d8683a',h:'#d8703e',e:'#c8d0d8',b:'#5a3a2a',sp:[[6,3,.3,'#2a1a14'],[7.4,5,.3,'#2a1a14'],[3.6,6.4,.3,'#2a1a14']],x:'<path d="M5.4 1.8 Q7.4 5 7.8 8" stroke="#dfe6ee" stroke-width=".35" fill="none"/>'}),.8),
    (g,rnd)=>rbTour(g,rnd,{style:'bob',stops:[{tip:1,tilt:-3,hold:3.4},{tip:6,tilt:3,hold:3.2},{tip:11,tilt:-2,hold:3.4}]}).close()),
  rbBug('mulberrywing','mulberry wing',rbScale(RBK.bfly({f:'#5a4230',h:'#6a4e38',e:'#3a2a1c',b:'#3a2a1c',x:'<path d="M2.4 6.6 Q4.6 6 6.8 8.4" stroke="#e8d8a8" stroke-width=".7" fill="none"/>'}),.85),
    (g,rnd)=>rbTour(g,rnd,{style:'flutter',stops:[{tip:3,tilt:-3,hold:3.6},{tip:8,tilt:3,hold:3.4},{tip:13,tilt:-2,hold:3.4}]}).close()),
  rbBug('swallowtail','tiger swallowtail',rbScale(RBK.bfly({f:'#f2cf4a',h:'#eac442',e:'#2a2420',b:'#2a2420',tail:1,bz:.14,sp:[[2.6,7,.45,'#6a9ad8'],[3.6,7.8,.4,'#e08a3a']],x:'<path d="M5.4 1.4 L6.8 7.6 M7.6 1.2 L8 6" stroke="#2a2420" stroke-width=".55"/>'}),1.4),
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'bob',stops:[{water:52,hold:5,bob:.15,every:.8},{air:[80,-12],hover:.8,jit:1},{water:106,hold:4.6,bob:.15,every:.8}]}).close(); R.props=[RBP.mud([52,34]),RBP.mud([106,34])]; return R; }),
  rbBug('reedleopard','reed leopard moth',rbScale(RBK.moth({c:'#ece6d6',s:'#d8d0bc',bc:'#9a9280',ab:'#b8b0a0',d:[[3,4.6,.35,'#4a4a4a'],[5,3.6,.35,'#4a4a4a'],[6.8,4.6,.3,'#4a4a4a'],[8,3.8,.3,'#4a4a4a'],[4.2,5.2,.25,'#4a4a4a']]}),1.15),
    (g,rnd)=>rbTour(g,rnd,{style:'flutter',stops:[{leaf:7,s:.5,hold:5},{leaf:12,s:.45,hold:5}]}).close()),
  rbBug('wainscot','bulrush wainscot',RBK.moth({c:'#d8c08a',s:'#b89a5a',bc:'#9a7e50',d:[[6.2,4.2,.25,'#7a5a30']],xr:'<path d="M9.2 4.4 L2 4.6 M8.6 4 L3 4.2" stroke="#c8ae74" stroke-width=".25"/>'}),
    (g,rnd)=>rbTour(g,rnd,{style:'flutter',stops:[{cat:0,f:.4,hold:5},{leaf:5,s:.55,hold:4.6}]}).close()),
  rbBug('chinamark','china-mark moth',RBK.moth({c:'#d8c6a2',s:'#c8703a',bc:'#8a6038',fc:'#e2d2b0',d:[[4,4.4,.4,'#fbf6ea'],[7,4.2,.4,'#fbf6ea'],[5.6,3.4,.3,'#b85a2a']]}),
    (g,rnd)=>rbTour(g,rnd,{style:'skim',stops:[{leaf:6,s:.25,hold:4},{leaf:9,s:.25,hold:4}]}).close()),
  rbBug('mosquito','mosquito',{W:14,H:10,ax:7,ay:8.6,bz:.03,bs:-.5,wo:'8.2px 4.8px',
      rest:'<path d="M8.4 4.6 Q5 4.4 2 5 Q5 5.4 8.4 5.1Z" fill="#e9ecea" opacity=".8" stroke="#b0b6b2" stroke-width=".2"/>',
      fly:'<path d="M8.2 4.8 Q7.4 1.6 4.4 1 Q5.8 3.2 8.4 5.2Z" fill="#e9ecea" opacity=".75"/>',
      body:`<path d="M7.6 6.2 L5.4 9 M8.2 6.3 L8.6 9.2 M8.8 6.2 L11 8.8 M7.4 6 L2.6 4.4" stroke="#4a4a44" stroke-width=".28" fill="none"/><path d="M1.6 5.4 Q4.4 5.8 7.2 5.6" stroke="#6a6a60" stroke-width="1" stroke-linecap="round" fill="none"/>
        <path d="M2.6 5.5h.4 M4.2 5.7h.4 M5.8 5.7h.4" stroke="#d8d4c4" stroke-width="1"/><ellipse cx="8.3" cy="5.2" rx="1.2" ry="1" fill="#5a5a52"/><circle cx="9.9" cy="5.2" r=".7" fill="#4a4a44"/>
        <path d="M10.4 5.4 L13.4 6.8 M10.2 4.8 L11.8 3.6" stroke="#4a4a44" stroke-width=".3"/>`},
    (g,rnd)=>{ const R=rbTour(g,rnd,{stops:[{leaf:4,s:.4,hold:4},{water:50,hold:2.6,bob:.1,mark:'lay'},{leaf:6,s:.35,hold:4}]}).close();
      R.props=[rbProp([51,34],5,2,'<ellipse rx="1.8" ry=".55" fill="#4a4036"/>',{win:[[R.M.lay0+1,R.T]]})]; return R; }),
  rbBug('shorefly','shore fly',rbScale(RBK.fly({a:'#3a3e3a',t:'#4a4e46',e:'#7a2a1a',wf:'#eef0ee',ws:'#b0b6b2'}),.75),
    (g,rnd)=>rbTour(g,rnd,{style:'skim',stops:[{water:20,hold:1.4,crawl:{water:30},crawlT:2.4,hold2:1,bob2:.1},{water:104,hold:1.2,crawl:{water:112},crawlT:2,hold2:1.2,bob2:.1}]}).close()),
  rbBug('dronefly','drone fly',rbScale(RBK.fly({a:'#7a4a1e',b:'#e0a040',t:'#5a4a2a',e:'#6a3a1e'}),1.1),
    (g,rnd)=>rbTour(g,rnd,{style:'dart',stops:[{air:[40,-8],hover:2.4,jit:.5,every:.25},{tip:5,tilt:-3,hold:3},{air:[96,-10],hover:2,jit:.5,every:.25},{tip:12,tilt:3,hold:3}]}).close()),
  rbBug('phantomcrane','phantom crane fly',{W:24,H:22,ax:12,ay:10,bz:.1,bs:-.3,wo:'12.4px 9px',
      rest:'<path d="M12.4 9.2 Q8.6 7.8 5.6 8.4 Q8.8 9.2 12.4 9.8Z" fill="#e8ecec" opacity=".7"/>',
      fly:'<path d="M12.4 9 Q10.6 6 8 5.6 Q9.8 7.6 12.6 9.6Z" fill="#e8ecec" opacity=".7"/>',
      body:`<g stroke-linecap="round" fill="none"><path d="M12 10 L2 3 M12 10 L1 12 M12 10 L5 20 M12 10 L19 20 M12 10 L23 12 M12 10 L22 3" stroke="#1d1d1d" stroke-width=".45"/>
        <path d="M12 10 L2 3 M12 10 L1 12 M12 10 L5 20 M12 10 L19 20 M12 10 L23 12 M12 10 L22 3" stroke="#f4f4ee" stroke-width=".5" stroke-dasharray="1.2 2.4"/></g>
        <path d="M6 9.6 L12 9.8" stroke="#1d1d1d" stroke-width="1" stroke-linecap="round"/><ellipse cx="12.6" cy="9.6" rx="1.2" ry="1" fill="#1d1d1d"/><circle cx="14.2" cy="9.6" r=".6" fill="#1d1d1d"/>`},
    (g,rnd)=>rbTour(g,rnd,{style:'drift',stops:[{cat:1,f:.45,hold:4,bob:.6,every:.6},{air:[60,-6],hover:2.4,jit:1.4,every:.8},{cat:0,f:.5,hold:4,bob:.6,every:.6},{air:[110,-4],hover:2,jit:1.4,every:.8}]}).close()),
  rbBug('scorpionfly','scorpionfly',{W:16,H:10,ax:8,ay:8,bz:.07,bs:-.5,wo:'9.4px 5.2px',
      rest:'<path d="M9.6 5 Q6 4.2 3.8 4.8 Q6.4 5.6 9.6 5.6Z" fill="#f2eee0" opacity=".85" stroke="#b9ae90" stroke-width=".25"/><g fill="#3a2a1a"><circle cx="5.4" cy="4.9" r=".3"/><circle cx="7" cy="4.8" r=".3"/><circle cx="8.3" cy="5.1" r=".25"/></g>',
      fly:'<path d="M9.4 5.2 Q8.4 1 5 .2 Q6.8 3 9.6 5.8Z" fill="#f2eee0" opacity=".8" stroke="#b9ae90" stroke-width=".25"/><circle cx="6.6" cy="1.8" r=".35" fill="#3a2a1a"/>',
      body:`<path d="M8.4 6.6 l-.8 1.4 M9.4 6.7 l0 1.4 M10.2 6.6 l.8 1.3" stroke="#6b4a24" stroke-width=".35"/><path d="M8.2 6 Q4 6.6 2.6 5 Q1.4 3.2 3 2.2" stroke="#d98a2a" stroke-width="1.2" stroke-linecap="round" fill="none"/>
        <path d="M3 2.2 L4 1.6" stroke="#8a3a1a" stroke-width="1" stroke-linecap="round"/><ellipse cx="9.4" cy="5.8" rx="1.4" ry="1.1" fill="#c47a26"/><circle cx="11" cy="5.6" r=".9" fill="#c47a26"/>
        <path d="M11.6 5.8 L13.6 7.6" stroke="#b86a20" stroke-width=".6" stroke-linecap="round"/><circle cx="11.2" cy="5.3" r=".35" fill="#2a1a0c"/><path d="M11.3 4.8 Q13 2.6 14.6 2.4" stroke="#6b4a24" stroke-width=".25" fill="none"/>`},
    (g,rnd)=>rbTour(g,rnd,{style:'flutter',stops:[{leaf:4,s:.7,down:1,hold:3,crawl:{leaf:4,s:.5,down:1},crawlT:2.2,hold2:2},{leaf:8,s:.65,down:1,hold:3.4}]}).close()),
  rbBug('alderfly','alderfly',rbScale(RBK.moth({c:'#3e3830',s:'#5e564a',bc:'#2a2420',ant:'long',fc:'#5a5246',xr:'<path d="M8.6 4.2 L3 4.6 M7 3.6 L6 5.2 M5 3.6 L4 5" stroke="#6e665a" stroke-width=".22"/>'}),1.1),
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'flutter',stops:[{leaf:9,s:.6,hold:2.4,bob:.15,mark:'lay',crawl:{leaf:9,s:.72},crawlT:1.6,hold2:2},{cat:1,f:.5,hold:4}]}).close();
      R.props=[rbProp(g.leaf(9,.58),4,4,'<g fill="#d8cfb0" stroke="#a89a70" stroke-width=".15"><ellipse cx="-.9" rx=".45" ry=".7"/><ellipse rx=".45" ry=".7"/><ellipse cx=".9" rx=".45" ry=".7"/><ellipse cx="-.45" cy="1" rx=".45" ry=".7"/><ellipse cx=".45" cy="1" rx=".45" ry=".7"/></g>',{r:g.leafUp(9,.58),win:[[R.M.lay0+1.2,R.T]]})]; return R; }),
  rbBug('owlfly','owlfly',{W:22,H:10,ax:10.6,ay:8.2,bz:.06,bs:-.5,wo:'12px 6px',
      rest:'<path d="M12 5.6 Q6 4 1 5.8 Q6 7 12 6.6Z" fill="#f2ecd4" opacity=".7" stroke="#b8a878" stroke-width=".3"/>',
      fly:'<g opacity=".85"><path d="M12 5.8 Q10 .4 4 -.6 Q7 3.4 12 6.4Z" fill="#f2d86a"/><path d="M11.6 6 Q6.4 2.2 1 2.6 Q6 5 11.8 6.6Z" fill="#e8c84a"/><path d="M8 2 Q6 .4 4 -.4" stroke="#2a2420" stroke-width=".8" fill="none"/></g>',
      body:RB_OWL_BODY('M11 6.4 L2 6.8'),
      alt:RB_OWL_BODY('M11 6.2 L4.6 .8')+'<path d="M12 5.6 Q9 3.6 6.4 3 Q9 5 12 6.4Z" fill="#f2ecd4" opacity=".7" stroke="#b8a878" stroke-width=".3"/>'},
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'dart',stops:[{cat:2,f:1,flat:1,tilt:-10,hold:5,mark:'s1'},{air:[80,-14],hover:1.2,jit:1},{air:[50,-8],hover:1,jit:1},{cat:0,f:1,flat:1,tilt:-10,hold:4.6,mark:'s2'}]}).close();
      R.alt=rbW(R.M,'s1','s2'); R.still=R.M.s10+1; return R; }),
  rbBug('backswimmer','backswimmer',{W:10,H:7,ax:5,ay:6.2,bz:.05,bs:-.5,wo:'6px 2.6px',wingsFirst:true,
      fly:`<ellipse cx="4" cy="1.4" rx="3.2" ry="1" transform="rotate(-18 4 1.4)" ${RB_WING} opacity=".8"/>`,
      body:RB_BACKSWIM, alt:`<g transform="translate(0 8.4) scale(1 -1)">${RB_BACKSWIM}</g>`},
    (g,rnd)=>{ const P=bugPlan([28,-10],{},rnd).hover(.6,{jit:.6}).to([42,-2],.7).to([50,33.6],.5).mark('f0').hold(3,{bob:.15,every:.6}).mark('f1').hold(2.2).mark('d1').hold(.4)
        .to([72,-6],.7).to([96,-8],.6).to([106,33.6],.5).mark('g0').hold(3,{bob:.15,every:.6}).mark('g1').hold(2.2).mark('e1').hold(.4).to([70,-14],.9).to([28,-10],.9);
      const R=P.close(), M=R.M; R.alt=[[M.f0,M.f1],[M.g0,M.g1]]; R.hide=[[M.f1,M.d1],[M.g1,M.e1]]; R.still=M.f0+.5;
      R.props=[rbRing([50,33.6],[[M.f0,M.f0+1.3],[M.d1-.1,M.d1+1.2]]),rbRing([106,33.6],[[M.g0,M.g0+1.3],[M.e1-.1,M.e1+1.2]])]; return R; }),
  rbBug('strider','water strider',{W:16,H:6,ax:8,ay:5.8,bz:.05,bs:-.5,wo:'9px 3px',
      fly:`<ellipse cx="7" cy="1.8" rx="3.4" ry="1" transform="rotate(-14 7 1.8)" ${RB_WING} opacity=".8"/>`,
      body:'<path d="M11.6 3.4 L14.6 5.8 M8.6 3.4 Q10 5.8 16 5.8 M7.6 3.4 Q4 5.8 -1 5.8 M9 3.3 L6.6 5.8" stroke="#3a3a36" stroke-width=".3" fill="none"/><path d="M4 3.6 L12 3.2" stroke="#3a3a36" stroke-width="1.1" stroke-linecap="round"/><circle cx="12.6" cy="3.1" r=".8" fill="#3a3a36"/><path d="M13.2 2.8 L15.2 1.8" stroke="#3a3a36" stroke-width=".25"/>'},
    (g,rnd)=>{ const P=bugPlan([20,-12],{},rnd).hover(.5,{jit:.6}).to([36,33.6],.8).mark('a');
      [[44,.25],[44,.6],[52,.22],[50,.18],[50,.7],[58,.24],[62,.2],[62,.8],[54,.26],[46,.24],[46,.6],[40,.22]].forEach(([x,t])=>P.crawl([x,33.6],t,{face:true}));
      P.mark('b').to([80,-8],.8).to([112,33.6],.7).mark('c');
      [[118,.22],[118,.6],[126,.24],[126,.5],[132,.2],[124,.26],[124,.6],[116,.24],[112,.2]].forEach(([x,t])=>P.crawl([x,33.6],t,{face:true}));
      P.mark('d').to([70,-14],1).to([20,-12],.8);
      const R=P.close(), M=R.M; R.still=M.a+.1; R.props=[rbRing([46,33.6],[[M.a,M.b]]),rbRing([58,33.6],[[M.a+1,M.b]]),rbRing([122,33.6],[[M.c,M.d]])]; return R; }),
  rbBug('divingbeetle','diving beetle',rbScale(RBK.beetle({c:'#2e3a2a',sh:'#6a8a5a',e:'#d8b84a',hc:'#2e3a2a',lc:'#3a4a30'}),1.45),
    (g,rnd)=>{ const W=[50,33.4], P=bugPlan([30,-12],{},rnd).hover(.5,{jit:.6}).to(W,.9).mark('s').hold(.6).mark('d0').hold(3.2).mark('d1')
        .crawl(W,.3,{tilt:40}).hold(2.4).crawl(W,.3,{tilt:0}).hold(.4).mark('d2').hold(2.6).mark('d3').hold(.6).to([80,-8],.8).to([30,-12],1);
      const R=P.close(), M=R.M; R.hide=[[M.d0,M.d1],[M.d2,M.d3]]; R.still=M.d1+.8;
      R.props=[rbRing(W,[[M.s,M.s+1.3],[M.d1-.1,M.d1+1.2],[M.d3-.1,M.d3+1.2]])]; return R; }),
  rbBug('shieldbug','green shield bug',RBK.shield({c:'#6a9a3a',c2:'#8aba4a',h:'#5a8a30'}),
    (g,rnd)=>rbTour(g,rnd,{stops:[{cat:0,f:.3,hold:2,crawl:{cat:0,f:.5},crawlT:3,hold2:2.4},{leaf:8,s:.4,hold:2,crawl:{leaf:8,s:.6},crawlT:2.4,hold2:2}]}).close()),
  rbBug('aphid','winged aphid',{W:7,H:6,ax:3.4,ay:5.2,bz:.04,bs:-.5,wo:'4.4px 2.2px',
      rest:'<path d="M4.4 2.2 Q2 .6 -.6 1.4 Q2 2.6 4.4 2.6Z" fill="#eef4ea" opacity=".75" stroke="#b9c9b0" stroke-width=".2"/>',
      fly:'<path d="M4.4 2.2 Q3.8 -.8 1.4 -1.4 Q2.4 1 4.6 2.6Z" fill="#eef4ea" opacity=".75"/>',
      body:'<path d="M2 4.4 l-.4 .9 M3.4 4.6 l0 .8 M4.6 4.4 l.4 .8" stroke="#5f8a3a" stroke-width=".3"/><path d="M.6 3.6 Q.8 1.8 3.2 1.8 Q5.4 2 5.6 3.6 Q3 4.8 .6 3.6Z" fill="#8cbf5a"/><path d="M1.4 2.2 L.8 1.2" stroke="#5f8a3a" stroke-width=".35"/><circle cx="5.9" cy="3.2" r=".7" fill="#7aae4a"/><circle cx="6.1" cy="3" r=".25" fill="#3a2a1a"/><path d="M6.2 2.6 Q7.4 1 8.4 .8" stroke="#5f8a3a" stroke-width=".2" fill="none"/>'},
    (g,rnd)=>{ const R=rbTour(g,rnd,{stops:[{leaf:5,s:.5,hold:6,mark:'b'},{leaf:12,s:.5,hold:6,mark:'c'}]}).close(), M=R.M;
      const kid=(j,s,t0)=>rbProp(g.leaf(j,s),2,2,'<ellipse rx=".55" ry=".4" fill="#9ccf6a" stroke="#6f9a45" stroke-width=".15"/>',{win:[[t0,R.T]]});
      R.props=[kid(5,.44,M.b0+1.5),kid(5,.4,M.b0+3),kid(5,.36,M.b0+4.5),kid(12,.44,M.c0+1.5),kid(12,.4,M.c0+3.2)]; return R; }),
  rbBug('leafhopper','candy-striped leafhopper',{...RBK.hop({c:'#4a9a5a',st:'#d8403a',h:'#e8c040',long:1}),W:10},
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'hop',stops:[{leaf:7,s:.45,hold:4.4,mark:'s1'},{leaf:3,s:.5,hold:4,mark:'s2'}]}).close(), M=R.M;
      R.props=[RBP.drop(rbAt(g.leaf(7,.45),-5,3),rbW(M,'s1')),RBP.drop(rbAt(g.leaf(3,.5),-5,3),rbW(M,'s2'))]; return R; }),
  rbBug('billbug','bulrush billbug',rbScale(RBK.beetle({c:'#4a4036',sh:'#8a7a66',hc:'#3a322a',lc:'#3a322a',snout:1,ant:'club'}),1.05),
    (g,rnd)=>rbTour(g,rnd,{stops:[{cat:1,f:.25,hold:3.4,bob:.3,every:.25,crawl:{cat:1,f:.4},crawlT:2.4,hold2:2.4,bob2:.3},{leaf:6,s:.3,hold:3,bob:.3,every:.25}]}).close()),
  rbBug('maskedbee','masked bee',rbScale(RBK.wasp({a:'#1d1c1e',t:'#242226',h:'#1d1c1e',face:'#f2d24a',wf:'#e4ecf0',x:'<path d="M8.4 5.8 l1 .1" stroke="#f2d24a" stroke-width=".4"/>'}),.75),
    (g,rnd)=>{ const top=[136,24.4], P=bugPlan([100,-10],{},rnd).hover(.6,{jit:.6}).to([120,-4],.7).to(top,.6,{up:180}).hold(.6).mark('in0').hold(3.4).mark('in1').hold(.6)
        .to([112,-10],.7).to([80,-4],.9).to([60,-14],.8).hover(.8,{jit:.6}).to([100,-10],1);
      const R=P.close(), M=R.M; R.hide=[[M.in0,M.in1]]; R.still=M.in0-.3;
      R.props=[rbProp([136,34],5,12,'<rect x="-1.5" y="-4.4" width="3" height="10" fill="#c2b07e"/><path d="M-1.5 -1 h3 M-1.5 3 h3" stroke="#9a8a5a" stroke-width=".35"/><ellipse cy="-4.4" rx="1.5" ry=".55" fill="#5a4a30"/>')]; return R; }),
  rbBug('fairyfly','fairyfly',{W:8,H:6,ax:4,ay:5,bz:.04,bs:-.5,wo:'4.6px 3px',
      rest:'<path d="M4.6 3 L.6 2" stroke="#b8a888" stroke-width=".25"/><ellipse cx="0" cy="1.9" rx="1" ry=".45" fill="#e8e2d0" opacity=".8"/><path d="M-1.2 1.3 L1.2 1.3 M-1.3 2.5 L1.3 2.5" stroke="#d8d0b8" stroke-width=".25" stroke-dasharray=".15 .25"/>',
      fly:'<path d="M4.6 3 L3 -.2" stroke="#b8a888" stroke-width=".25"/><ellipse cx="2.8" cy="-.8" rx=".5" ry="1" fill="#e8e2d0" opacity=".8"/><path d="M2.2 -1.8 L2.2 .2 M3.4 -1.8 L3.4 .2" stroke="#d8d0b8" stroke-width=".25" stroke-dasharray=".15 .25"/>',
      body:'<path d="M3 4.2 l-.4 .8 M4 4.3 l0 .8 M4.8 4.2 l.4 .7" stroke="#3a3228" stroke-width=".25"/><ellipse cx="2.6" cy="3.6" rx="1.8" ry=".9" fill="#8a6a3a"/><ellipse cx="4.8" cy="3.4" rx=".9" ry=".8" fill="#6b4f2a"/><circle cx="6" cy="3.3" r=".6" fill="#6b4f2a"/><path d="M6.2 2.9 Q7.2 1.6 7.2 .6" stroke="#6b4f2a" stroke-width=".22" fill="none"/><circle cx="7.2" cy=".6" r=".35" fill="#6b4f2a"/>'},
    (g,rnd)=>{ const A=g.leaf(6,.3), B=g.leaf(9,.3), P=bugPlan(A,{up:g.leafUp(6,.3)},rnd).hold(3.4).to([56,24],.8).to([60,33.6],.5).hold(.8).mark('d0').hold(3.6).mark('d1').hold(1)
        .to([70,20],.8).to(B,.8,{up:g.leafUp(9,.3)}).hold(3.4).to([80,22],.9).to(A,.9,{up:g.leafUp(6,.3)});
      const R=P.close(), M=R.M; R.hide=[[M.d0,M.d1]]; R.props=[rbRing([60,33.6],[[M.d0-.1,M.d0+1.2],[M.d1-.1,M.d1+1.2]])]; return R; }),
  rbBug('treecricket','tree cricket',{...RBK.cricket({c:'#cfe2a8',w:'#e8f2d0',wo:.9,e:'#6a7a3a',lc:'#a8c47a'}),
      alt:RBK.cricket({c:'#cfe2a8',w:'#e8f2d0',e:'#6a7a3a',lc:'#a8c47a'}).body+'<path d="M11.8 3.6 Q9 -2 4 -2.6 Q6 1.6 11.8 4.2Z" fill="#e8f2d0" opacity=".9" stroke="#b8d08a" stroke-width=".25"/>'},
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'hop',stops:[{leaf:8,s:.62,hold:4.4,bob:.12,every:.15,mark:'s1'},{cat:2,f:.5,hold:4,bob:.12,every:.15,mark:'s2'}]}).close(), M=R.M;
      R.alt=rbW(M,'s1','s2'); R.props=[RBP.song(rbAt(g.leaf(8,.62),-9,-4),rbW(M,'s1')),RBP.song(rbAt(g.cat(2,.5),-9,-4),rbW(M,'s2'))]; return R; }),
  rbBug('mantis','praying mantis',{W:20,H:12,ax:9,ay:10.8,bz:.06,bs:-.55,wo:'8.2px 6.4px',
      rest:'<path d="M8.4 6.4 Q4 5.2 1 6.8 Q4.4 7.2 8.4 7Z" fill="#a8cc78"/>',
      fly:'<path d="M8.2 6.4 Q7 1.4 2.4 .8 Q4.6 4 8.4 7Z" fill="#dfeec6" opacity=".85"/>',
      body:RB_MANTIS_REST+'<path d="M13.6 3.8 L15.6 6.4 L14.4 3.2 M13.2 4 L15 6.8" stroke="#7aa84e" stroke-width=".7" stroke-linecap="round" fill="none"/>',
      alt:RB_MANTIS_REST+'<path d="M8.4 6.4 Q4 5.2 1 6.8 Q4.4 7.2 8.4 7Z" fill="#a8cc78"/><path d="M13.6 3.8 L18 3 L19.8 4.6 M13.4 4 L18 4.4 L19.4 5.6" stroke="#7aa84e" stroke-width=".7" stroke-linecap="round" fill="none"/>'},
    (g,rnd)=>{ const A=g.cat(1,.55), B=g.leaf(5,.55), ua={up:g.catUp(1)}, ub={up:g.leafUp(5,.55)};
      const P=bugPlan(A,ua,rnd).hold(3.4).mark('s0').hold(.4).mark('s1').hold(3); rbTravel(P,B,ub,'flutter'); P.hold(3).mark('t0').hold(.4).mark('t1').hold(2.4); rbTravel(P,A,ua,'flutter');
      const R=P.close(); R.alt=rbW(R.M,'s','t'); return R; }),

  /* ── reed-bed legends, Nos. 61-80 (made up) ── */
  rbBug('lanternwick','lanternwick moth',{...RBK.moth({c:'#5a4a6a',s:'#e8a84a',bc:'#4a3a58',ab:'#f2c24a',d:[[6,3.6,.3,'#f6d890']]}),glow:[2,5.4]},
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'flutter',stops:[{cat:0,f:.66,hold:5,mark:'l1'},{cat:2,f:.66,hold:5,mark:'l2'}]}).close(), M=R.M;
      R.props=[RBP.glow(g.cat(0,.66),rbW(M,'l1')),RBP.glow(g.cat(2,.66),rbW(M,'l2'))]; return R; },{fic:1}),
  rbBug('dewsprite','dewdrop sprite',rbScale(RBK.fly({a:'#a8d8e8',t:'#8ac8dc',e:'#4a8aa8',wf:'#f4fcff',ws:'#a8d4e4',x:'<ellipse cx="4" cy="3" rx=".7" ry=".9" fill="#e8f8ff" stroke="#8ac0d0" stroke-width=".2"/>'}),.8),
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'dart',stops:[{tip:4,hold:3,bob:.1,mark:'a'},{tip:7,hold:3,bob:.1,mark:'b'},{tip:12,hold:3,bob:.1,mark:'c'}]}).close(), M=R.M;
      /* each drop is gone once it's been drunk, and they all bead up again by the next round */
      const back=M.c1+1.2; R.props=[[4,M.a1],[7,M.b1],[12,M.c1]].map(([j,t])=>RBP.dew(rbAt(g.leaf(j,1),.6,1.8),[[0,t],[Math.max(back,t+.8),R.T]])); return R; },{fic:1}),
  rbBug('reedpiper','reedpiper',RBK.cricket({c:'#9ab86a',w:'#b8d08a',e:'#3d4a24',lc:'#7a9a4a',x:'<path d="M14.4 5.2 L17.6 6.6" stroke="#c8b070" stroke-width=".7" stroke-linecap="round"/><circle cx="16" cy="5.9" r=".18" fill="#7a6a3a"/>'}),
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'hop',stops:[{leaf:7,s:.8,hold:4.6,mark:'p1'},{leaf:5,s:.8,hold:4.2,mark:'p2'}]}).close(), M=R.M;
      R.props=[RBP.notes(rbAt(g.leaf(7,.8),4,-6),rbW(M,'p1')),RBP.notes(rbAt(g.leaf(5,.8),4,-6),rbW(M,'p2'))]; return R; },{fic:1}),
  rbBug('duskbell','duskbell',RBK.moth({c:'#4a5a8a',s:'#c8d0f0',bc:'#3a4668',fc:'#5a6a9a',d:[[4,4.6,.3,'#dfe6ff'],[6.6,3.8,.3,'#dfe6ff']],xr:'<path d="M1 4.9 Q.2 5.6 1 6.2" stroke="#c8d0f0" stroke-width=".4" fill="none"/>'}),
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'flutter',stops:[{cat:1,f:1,flat:1,hold:4.4,bob:.2,every:.3,mark:'r1'},{cat:0,f:1,flat:1,hold:4.4,bob:.2,every:.3,mark:'r2'}]}).close(), M=R.M;
      R.props=[RBP.song(rbAt(g.cat(1,.95),-6,-2),rbW(M,'r1')),RBP.song(rbAt(g.cat(1,.95),6,-2),rbW(M,'r1'),1),RBP.song(rbAt(g.cat(0,.95),-6,-2),rbW(M,'r2')),RBP.song(rbAt(g.cat(0,.95),6,-2),rbW(M,'r2'),1)]; return R; },{fic:1}),
  rbBug('mossmantle','mossmantle weevil',RBK.beetle({c:'#5a7a3a',sh:'#a8c86a',hc:'#4a6a30',lc:'#3a5a26',snout:1,ant:'club',xr:'<g fill="#7fae4a"><circle cx="2.6" cy="2.6" r=".6"/><circle cx="4.4" cy="1.8" r=".7"/><circle cx="6.4" cy="2" r=".55"/><circle cx="3.4" cy="3.6" r=".45"/></g>'}),
    (g,rnd)=>{ const R=rbTour(g,rnd,{stops:[{leaf:4,s:.35,hold:1,cmark:'c1',crawl:{leaf:4,s:.62},crawlT:4,hold2:1.4},{leaf:8,s:.3,hold:1,cmark:'c2',crawl:{leaf:8,s:.58},crawlT:4,hold2:1.4}]}).close(), M=R.M;
      R.props=[[4,.42,M.c10+1],[4,.52,M.c10+2.6],[8,.38,M.c20+1.2],[8,.48,M.c20+2.8]].map(([j,s,t])=>RBP.sprout(g.leaf(j,s),[[t,R.T]])); return R; },{fic:1}),
  rbBug('glasswing','glasswing zephyr',{...RBK.bfly({f:'#f0f8f8',h:'#e6f2f2',e:'#5a4a6a',b:'#3a2e44',op:.55}),
      alt:RBK.bfly({f:'#f0f8f8',h:'#e6f2f2',e:'#5a4a6a',b:'#3a2e44'}).body+RBK.bfly({f:'#f0f8f8',h:'#e6f2f2',e:'#5a4a6a40',b:'#3a2e44',op:.08}).wings},
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'bob',stops:[{tip:1,tilt:-3,hold:3.6,mark:'v1'},{tip:5,tilt:3,hold:3.6,mark:'v2'},{tip:12,tilt:-2,hold:3.6,mark:'v3'}]}).close(), M=R.M;
      R.alt=rbW(M,'v1','v2','v3').map(([a,b])=>[a+.6,b-.3]); return R; },{fic:1}),
  rbBug('lunareed','lunareed moth',rbScale(RBK.moth({c:'#dfe4ec',s:'#b8c4d8',bc:'#8a94a8',ant:'feather',fc:'#e8ecf4',d:[[5.4,3.8,.4,'#f8faff']]}),1.2),
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'flutter',stops:[{cat:2,f:.98,flat:1,hold:5,mark:'m1'},{cat:1,f:.98,flat:1,hold:5,mark:'m2'}]}).close(), M=R.M;
      R.props=[RBP.glow(g.cat(2,1),rbW(M,'m1'),'moon'),RBP.glow(g.cat(1,1),rbW(M,'m2'),'moon')]; return R; },{fic:1}),
  rbBug('fluffweaver','fluffweaver',{...RBK.moth({c:'#efe6d4',s:'#d8c8a8',bc:'#b8a888',xr:'<g fill="#fbf7ee"><circle cx="3" cy="4.4" r=".7"/><circle cx="5.4" cy="3.4" r=".8"/><circle cx="7.6" cy="4" r=".6"/></g>'}),
      add:'<g fill="#f6f1e4" stroke="#d8cfb8" stroke-width=".2"><circle cx="11.8" cy="5.6" r="1.2"/><circle cx="12.8" cy="4.8" r=".9"/><circle cx="12.6" cy="6.6" r=".8"/><circle cx="13.6" cy="5.8" r=".7"/></g>'},
    (g,rnd)=>{ const A=g.cat(1,.7), up={up:g.catUp(1)}, P=bugPlan([-12,-12],{},rnd).hover(.5).mark('in').to([30,-8],1.1).to([62,-14],1).to(A,.8,up).hold(3.6,{bob:.35,every:.25}).mark('got').hold(.5)
        .to([120,-12],.9).to([166,-20],1).mark('out').hold(1).to([-12,-12],.2);
      const R=P.close(), M=R.M; R.hide=[[0,M.in-.1],[M.out,R.T]]; R.add=[[M.got,M.out]]; R.still=M.got-1; return R; },{fic:1}),
  rbBug('drizzlewing','drizzlewing',RBK.fly({a:'#7a9ab8',t:'#6a8aa8',e:'#3a5a78',wf:'#e0ecf8',ws:'#9ab8d8',bz:.05}),
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'flutter',stops:[{air:[40,-12],hover:3,jit:.4,mark:'r1'},{air:[90,-14],hover:3,jit:.4,mark:'r2'},{tip:12,tilt:3,hold:3}]}).close(), M=R.M;
      R.props=[RBP.rain([40,-4],rbW(M,'r1')),RBP.rain([90,-6],rbW(M,'r2'))]; return R; },{fic:1}),
  rbBug('thistledown','thistledown drifter',{W:10,H:10,ax:5,ay:8.6,bz:.2,bs:.8,wo:'5px 5px',
      rest:'<g stroke="#f4f0e6" stroke-width=".3" stroke-linecap="round" opacity=".95"><path d="M5 5 L1 1 M5 5 L3 .2 M5 5 L5 -.4 M5 5 L7 .2 M5 5 L9 1 M5 5 L.2 3 M5 5 L9.8 3"/></g><g fill="#fffdf6"><circle cx="1" cy="1" r=".35"/><circle cx="5" cy="-.4" r=".35"/><circle cx="9" cy="1" r=".35"/></g>',
      fly:'<g stroke="#f4f0e6" stroke-width=".3" stroke-linecap="round" opacity=".95"><path d="M5 5 L1 1 M5 5 L3 .2 M5 5 L5 -.4 M5 5 L7 .2 M5 5 L9 1 M5 5 L.2 3 M5 5 L9.8 3"/></g>',
      body:'<path d="M5 5 L5 7.6" stroke="#b8a888" stroke-width=".35"/><ellipse cx="5" cy="7.6" rx=".9" ry="1.2" fill="#a88a5a"/><circle cx="5.3" cy="7.2" r=".25" fill="#2a1e12"/><path d="M4.4 8.6 l-.5 .5 M5.6 8.6 l.5 .5" stroke="#8a6a3a" stroke-width=".25"/>'},
    (g,rnd)=>rbTour(g,rnd,{style:'drift',stops:[{cat:0,f:.72,flat:1,hold:4},{cat:1,f:.74,flat:1,hold:4},{cat:2,f:.72,flat:1,hold:4}]}).close(),{fic:1}),
  rbBug('starwing','starwing',rbScale(RBK.fly({a:'#2a2a4a',t:'#3a3a5a',e:'#e8c860',wf:'#fff6c8',ws:'#e8c860',x:'<path d="M4 1.2 L4.3 2.1 L5.2 2.2 L4.5 2.7 L4.7 3.6 L4 3.1 L3.3 3.6 L3.5 2.7 L2.8 2.2 L3.7 2.1Z" fill="#fff2b8"/>'}),.75),
    (g,rnd)=>{ const T=[1,4,7,9,12], R=rbTour(g,rnd,{style:'dart',stops:T.map((j,i)=>({tip:j,hold:1.6,mark:'s'+i}))}).close(), M=R.M;
      R.props=T.map((j,i)=>RBP.twinkle(rbAt(g.leaf(j,1),1.4,-1),[[M['s'+i+'1'],R.T]])); return R; },{fic:1}),
  rbBug('pebble','pebble beetle',rbScale(RBK.beetle({c:'#9a9488',sh:'#c8c2b4',e:'#7a7468',hc:'#7a7468',lc:'#6a6458'}),1.15),
    (g,rnd)=>{ const P=bugPlan([10,-10],{},rnd).hover(.5,{jit:.5}).to([20,33.6],.7).mark('t0'), xs=[36,50,62,72,80,86,90];
      xs.forEach((x,i)=>{ const a=P.at(); P.to([rf1((a[0]+x)/2),rf1(33.6-9+i*1.2)],.22,{e:'ease-out',glide:true}).to([x,33.6],.22,{e:'ease-in',glide:true}).mark('t'+(i+1)); });
      P.hold(1.6).to([110,-6],.8).to([130,33.6],.6).hold(1.4).to([70,-16],1.2).to([10,-10],.9);
      const R=P.close(), M=R.M; R.still=M.t7+.5; R.props=[20,...xs].map((x,i)=>rbRing([x,33.6],[[M['t'+i],M['t'+i]+1.2]])); return R; },{fic:1}),
  rbBug('weaver','weaver hopper',RBK.hop({c:'#c8a86a',b:'#8a6a3a',h:'#b8945a',e:'#f2ecd8'}),
    (g,rnd)=>{ const A=g.leaf(5,1), B=g.leaf(7,1), R=rbTour(g,rnd,{style:'hop',stops:[{tip:5,hold:1.6},{tip:7,hold:1.4,mark:'w'},{tip:5,hold:1.4},{tip:7,hold:2.4}]}).close(), M=R.M, dx=rf1(B[0]-A[0]), dy=rf1(B[1]-A[1]);
      R.props=[{x:A[0],y:A[1],r:0,win:[[M.w0,R.T]],html:`<svg width="1" height="1" style="left:0;top:0"><path d="M0 0 Q${rf1(dx/2)} ${rf1(dy/2+4)} ${dx} ${dy}" stroke="#8a9ca2" stroke-width=".5" fill="none" opacity=".95"/><path class="rb-twk" d="M${rf1(dx/2)} ${rf1(dy/2+2)} m0 -1 l.3 .7 .7 .3 -.7 .3 -.3 .7 -.3 -.7 -.7 -.3 .7 -.3z" fill="#fff"/></svg>`}]; return R; },{fic:1}),
  rbBug('bubblebeetle','bubble beetle',RBK.beetle({c:'#3a6a8a',sh:'#9ad0e8',e:'#2a4a6a',hc:'#2a4a6a',lc:'#2a4a6a',ant:'long'}),
    (g,rnd)=>{ const R=rbTour(g,rnd,{stops:[{water:50,hold:4.4,mark:'b1'},{water:106,hold:4.4,mark:'b2'}]}).close(), M=R.M;
      R.props=[RBP.bubble([54,30],rbW(M,'b1')),RBP.bubble([110,30],rbW(M,'b2'))]; return R; },{fic:1}),
  rbBug('sundial','sundial skimmer',RBK.odo({a:'#e8b84a',r:'#a87a1a',t:'#d8a03a',e:'#c8782a',wf:'#fff4d8',ws:'#e8c880'}),
    (g,rnd)=>{ const A=g.cat(0,1), B=g.cat(1,1), P=bugPlan(A,{tilt:-12},rnd).hold(1.6);
      [-4,4,12,6,-2].forEach(t=>P.crawl(A,1.4,{tilt:t}).hold(.8));
      P.to([60,-12],1,{e:RB_DART}).hover(1,{jit:.6}).to(B,.9,{tilt:8,e:RB_DART}).hold(1.2); [0,-8,-14].forEach(t=>P.crawl(B,1.4,{tilt:t}).hold(.8));
      P.to([60,-14],.9).to(A,.9,{tilt:-12}); return P.close(); },{fic:1}),
  rbBug('mirrorback','mirrorback beetle',RBK.beetle({c:'#c8d4dc',sh:'#ffffff',e:'#8a9aa8',hc:'#6a7a88',lc:'#5a6a78',ant:'long'}),
    (g,rnd)=>{ const R=rbTour(g,rnd,{stops:[{leaf:5,s:.62,hold:4,mark:'f1'},{leaf:9,s:.6,hold:4,mark:'f2'}]}).close(), M=R.M;
      R.props=[RBP.twinkle(rbAt(g.leaf(5,.62),-3,-4),rbW(M,'f1')),RBP.twinkle(rbAt(g.leaf(9,.6),-3,-4),rbW(M,'f2'))]; return R; },{fic:1}),
  rbBug('quillwing','quillwing',RBK.dam({a:'#6a3a8a',r:'#e8c84a',t:'#8a4aa8',e:'#c84a8a',wf:'#f4ecf8',ws:'#c8a8d8',st:'#e8c84a'}),
    (g,rnd)=>{ const P=bugPlan(g.leaf(3,1),{tilt:-6},rnd).hold(3), loop=(cx,cy,r,dir)=>{ for(let k=1;k<=8;k++){ const a=Math.PI/2+dir*k*Math.PI/4; P.to([rf1(cx+Math.cos(a)*r*1.3),rf1(cy-Math.sin(a)*r)],.22,{e:'linear'}); } };
      P.to([52,-14],.6); loop(52,-8,6,1); P.to([82,-14],.6); loop(82,-8,6,1); P.to(g.leaf(9,1),.6,{tilt:4}).hold(3).to([70,-16],.6); loop(70,-10,6,-1); P.to(g.leaf(3,1),.9,{tilt:-6});
      return P.close(); },{fic:1}),
  rbBug('weathervane','weathervane beetle',RBK.beetle({c:'#b8743a',sh:'#f0c080',e:'#8a4a1a',hc:'#8a4a1a',lc:'#6a3a14',horn:'#8a4a1a'}),
    (g,rnd)=>{ const A=g.cat(0,1), B=g.cat(2,1), P=bugPlan(A,{},rnd).hold(1.2);
      const turn=p=>[.4,-.4,.4,-.4].forEach((dx,i)=>P.crawl([rf1(p[0]+dx),p[1]],.3,{face:true,tilt:i%2?4:-4}).hold(rf1(1.2+rnd())));
      turn(A); P.to([70,-10],1).to([100,-12],.8).to(B,.7).hold(1); turn(B); P.to([80,-14],1).to(A,1); return P.close(); },{fic:1}),
  rbBug('knight','cattail knight',rbScale(RBK.beetle({c:'#4a5a6a',sh:'#b8c8d8',e:'#2a3a4a',hc:'#3a4a5a',lc:'#2a3a4a',horn:'#d0d8e0',xr:'<path d="M3 2.4 L7 2.2" stroke="#8a9aaa" stroke-width=".3"/>'}),1.25),
    (g,rnd)=>{ let P; const march=i=>{ const up={up:g.catUp(i)}, dn={up:g.catUp(i)+180};
        P.crawl(g.cat(i,.45),3.2,up).hold(1.6,{bob:.15,every:.4}).crawl(g.cat(i,.45),.4,dn).crawl(g.cat(i,.18),2.8,dn).hold(1).crawl(g.cat(i,.18),.4,up); };
      P=bugPlan(g.cat(1,.18),{up:g.catUp(1)},rnd); march(1); P.to([104,-8],1).to(g.cat(2,.18),.8,{up:g.catUp(2)}); march(2); P.to([100,-12],1).to(g.cat(1,.18),.8,{up:g.catUp(1)}); return P.close(); },{fic:1}),
  rbBug('pollenpuff','pollenpuff bee',{...RBK.wasp({a:'#f2c84a',b:'#8a5a1a',t:'#f0d070',h:'#6a4a1a',wf:'#fff8e0',bz:.04,x:'<g fill="#fbe8a0" opacity=".9"><circle cx="2.4" cy="3.8" r=".5"/><circle cx="4.2" cy="3.4" r=".45"/><circle cx="8.6" cy="3.8" r=".5"/></g>'}),
      add:'<g fill="#f6d860"><circle cx="3" cy="5" r=".4"/><circle cx="5.6" cy="4.2" r=".35"/><circle cx="9" cy="5.6" r=".4"/><circle cx="7.4" cy="6.4" r=".3"/></g>'},
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'bob',stops:[{cat:0,f:.9,hold:3.6,bob:.3,every:.2,mark:'p1'},{cat:1,f:.9,hold:3.6,bob:.3,every:.2,mark:'p2'},{cat:2,f:.9,hold:3.4,bob:.3,every:.2,mark:'p3'}]}).close(), M=R.M;
      R.add=[[M.p11,R.T]]; R.props=[RBP.puff(g.cat(0,.92),rbW(M,'p1')),RBP.puff(g.cat(1,.92),rbW(M,'p2')),RBP.puff(g.cat(2,.92),rbW(M,'p3'))]; return R; },{fic:1})
);
Object.assign(REED_BUG_NOTES,{
  skimmer:'Named for the twelve dark spots on its wings. Males claim a stretch of shoreline and chase rivals off the best perches.',
  meadowhawk:'A small red dragonfly of late summer. It perches low on the reeds and makes short sallies after gnats.',
  pondhawk:'A fierce green hunter that perches low and eats other flying insects, even damselflies. Males turn powder blue as they age.',
  forktail:'One of the commonest damselflies. Males have a bright blue tip to the tail, and it hunts tiny insects among the lowest reeds.',
  spreadwing:'Rests with its wings half open, unlike other damselflies. The female cuts slits in stems above the water and lays her eggs inside.',
  copper:'A butterfly of wet meadows and marsh edges. Its caterpillars eat the water dock that grows among the reeds.',
  metalmark:'A small fen butterfly with metallic silver lines on its wings. It lives only where swamp thistle grows, and it’s rare now.',
  mulberrywing:'A dark little skipper that lives only in sedge fens. It flies slow and low, weaving between the stems.',
  swallowtail:'Big butterflies gather at wet mud to sip water and the salts in it. It’s called puddling, and it’s mostly the males who do it.',
  reedleopard:'Its caterpillars bore inside reed stems and can live there for two years. The adult rests on the reeds, white with black spots.',
  wainscot:'Its caterpillars feed inside the stems of bulrush and cattail. The straw-coloured moth rests along a stem and looks like part of it.',
  chinamark:'One of the few moths whose caterpillars live underwater, in little cases cut from water plants. The adults stay close to the surface.',
  mosquito:'Only the females bite, because they need the blood to make eggs; the males sip nectar. She lays a tiny floating raft of eggs on still water.',
  shorefly:'A tiny fly that walks the wet mud at the water’s edge, grazing on algae. Some kinds can walk underwater inside a bubble of air.',
  dronefly:'A honeybee look-alike. Its larva, the rat-tailed maggot, lives in the mucky water among the reeds and breathes through a long snorkel.',
  phantomcrane:'Black and white banded legs held wide, drifting through the marsh like a snowflake. Its swollen feet catch the breeze so it barely has to fly.',
  scorpionfly:'The male’s curled tail looks like a scorpion’s but is harmless. It scavenges dead insects, sometimes stealing them from spider webs.',
  alderfly:'Lays its eggs in neat rows on stems hanging over the water. When they hatch, the larvae drop straight in and live there as hunters.',
  owlfly:'Hunts other insects in the air at dusk with big, owl-like eyes. At rest it sticks its abdomen out stiffly, so it looks like a twig.',
  backswimmer:'Swims on its back, rowing with long oar legs, and floats belly-up just under the surface. Unlike the water boatman, it can bite.',
  strider:'Stands on the surface film on water-repellent hairs and feels ripples through its legs to find insects that fall in. Some can fly to new ponds.',
  divingbeetle:'A fierce underwater hunter that carries air under its wing cases. It surfaces tail-first to refill, and flies at night to find new ponds.',
  shieldbug:'A true bug: instead of chewing, it pierces the plant with its beak and sips the sap. Disturb it and it gives off a bitter smell.',
  aphid:'Winged aphids fly off to start new colonies. A female can give birth to live young without mating, several a day.',
  leafhopper:'Drinks the watery sap from the stems. It drinks so much that it flicks the extra away in tiny droplets, sometimes called leafhopper rain.',
  billbug:'A weevil with a long snout that feeds on bulrushes and sedges. The female chews a hole in the stem with her snout and lays an egg inside.',
  maskedbee:'A small, nearly hairless bee with a yellow face. It nests in hollow stems like broken old reeds, lining each cell with a clear, cellophane-like film.',
  fairyfly:'One of the smallest insects on Earth. Some kinds swim underwater with their fringed wings to lay eggs inside the eggs of other insects.',
  treecricket:'Sings on warm evenings by raising its clear wings like a paddle and rubbing them together. You can roughly tell the temperature from how fast it chirps.',
  mantis:'Waits motionless on a stem for insects to come close, then strikes with its spiked front legs in a fraction of a second.',
  lanternwick:'On dusky evenings it settles on a cattail head and its warm glow lights it like a candle wick, one cattail at a time.',
  dewsprite:'A glassy little fly that wakes before the sun and drinks the dew from the tips of the reeds, one drop each.',
  reedpiper:'Bores a tiny finger-hole in a reed and plays it like a flute. Most of what sounds like wind in the reeds is really this.',
  duskbell:'Its wings are shaped like tiny bells. When it lands on a cattail and shivers, the whole marsh hears a far-off chime.',
  mossmantle:'Wears a coat of living moss, and as it walks up a reed it drops tiny seeds that are sprouting by morning.',
  glasswing:'Its wings are as clear as water. Once it lands on a reed it all but disappears; only its edges give it away.',
  lunareed:'A silver moth that sits on the tallest cattail spike at night, and the spike shines like a little moon while it’s there.',
  fluffweaver:'Pulls wisps of cattail fluff and flies them away to weave a hammock somewhere nobody has ever found.',
  drizzlewing:'Wherever it hovers, a tiny rain falls, just enough for one reed. Dry spells in the marsh are said to be the days it sleeps in.',
  thistledown:'Looks exactly like a tuft of cattail fluff and travels the same way, on the breeze. Nobody has ever seen one flap.',
  starwing:'Leaves a small glint on every reed tip it touches. By evening a whole reed bed can be twinkling because of one of these.',
  pebble:'Looks like a flat grey pebble and crosses the pond the way a good skipping stone does: bounce, bounce, bounce.',
  weaver:'Hops from tip to tip trailing silk, tying the reeds together so they can lean on each other in a storm.',
  bubblebeetle:'Sits at the water’s edge blowing bubbles. Each one holds a breath of summer air that pops when it reaches the reed tops.',
  sundial:'Perches on the tallest cattail and slowly turns to keep its wings toward the sun. Old marsh folk told the time by it.',
  mirrorback:'Its shell is a perfect mirror. On sunny days it sends little flashes of light skittering across the pond.',
  quillwing:'A damselfly that writes loops in the air between perches. Some say each loop is a letter, and it has been writing the same long word all summer.',
  weathervane:'Climbs to the very top of a cattail and turns to face the wind, whichever way it blows. It is never wrong.',
  knight:'Wears armour and a single lance of a horn, and patrols the cattail stems from dawn to dusk in case anything tries to nibble them.',
  pollenpuff:'So fluffy that it comes away from every cattail spike in a coat of gold pollen, and glows faintly all the way home.'});
/* ── Nos. 81-100: ten more real ones and ten more legends ──
   Not all of these fly. The forkhorn caterpillar lets itself down on silk,
   the ant walks in along the bank, the raft spider stands on the water and
   the sailor beetle sails. Nos. 91-100 are legends (fic:1). */
/* the forkhorn caterpillar, lying flat or humped mid-step */
const RB_FORK=hump=>{ const X=hump?[3.6,5.4,7.4,9.4,11.2]:[3,5.2,7.4,9.6,11.8], Y=hump?[8.6,7,5.6,7,8.6]:[8.6,8.6,8.5,8.4,8.2];
  const hx=hump?14.6:15.2, hy=6.4, f=rf1;
  const tail=`<path d="M${f(X[0]-1.2)} ${f(Y[0]-.4)} Q${f(X[0]-3)} ${f(Y[0]-1.2)} ${f(X[0]-2.6)} ${f(Y[0]-3.4)} Q${f(X[0]-1.4)} ${f(Y[0]-2.4)} ${f(X[0]-.4)} ${f(Y[0]-1.4)}Z" fill="#ead494" stroke="#b89a50" stroke-width=".2"/>`;
  const feet=X.map((x,i)=>!hump||i===0||i===4?`<ellipse cx="${x}" cy="10.7" rx=".65" ry=".55" fill="#e2c87e"/>`:'').join('');
  const segs=X.map((x,i)=>`<circle cx="${x}" cy="${Y[i]}" r="2.1" fill="#8cc85c" stroke="#4f8a3a" stroke-width=".3"/><ellipse cx="${x}" cy="${f(Y[i]+1.3)}" rx="1.4" ry=".75" fill="#f0dc9c"/>`
    +(i%2?`<circle cx="${x}" cy="${f(Y[i]-.5)}" r=".7" fill="none" stroke="#ece46a" stroke-width=".4"/>`:'')).join('');
  const head=`<circle cx="${hx}" cy="${hy}" r="2.8" fill="#8cc85c" stroke="#4f8a3a" stroke-width=".3"/><ellipse cx="${f(hx+1.3)}" cy="${f(hy+1.7)}" rx="1.4" ry="1" fill="#f0dc9c"/>
    <circle cx="${f(hx+1.1)}" cy="${f(hy-.6)}" r="1.35" fill="#fff"/><circle cx="${f(hx+1.1)}" cy="${f(hy-.6)}" r="1.05" fill="#1c1c1c"/><circle cx="${f(hx+1.45)}" cy="${f(hy-1)}" r=".38" fill="#fff"/>
    <path d="M${f(hx-.5)} ${f(hy-2.5)} Q${f(hx-.9)} ${f(hy-3.8)} ${f(hx-.4)} ${f(hy-4.6)}" stroke="#e2452e" stroke-width=".9" stroke-linecap="round" fill="none"/>
    <path d="M${f(hx-.4)} ${f(hy-4.4)} Q${f(hx-1.6)} ${f(hy-5.4)} ${f(hx-2.4)} ${f(hy-5.2)} M${f(hx-.4)} ${f(hy-4.4)} Q${f(hx+.4)} ${f(hy-5.6)} ${f(hx+1.4)} ${f(hy-5.6)}" stroke="#e2452e" stroke-width=".75" stroke-linecap="round" fill="none"/>`;
  return tail+feet+segs+head; };
/* the hollow reed stub the masked bee nests in (the cuckoo wasp visits it too) */
const RB_STUB=()=>rbProp([136,34],5,12,'<rect x="-1.5" y="-4.4" width="3" height="10" fill="#c2b07e"/><path d="M-1.5 -1 h3 M-1.5 3 h3" stroke="#9a8a5a" stroke-width=".35"/><ellipse cy="-4.4" rx="1.5" ry=".55" fill="#5a4a30"/>');
/* azure damselflies in tandem: the male (blue) holds the female behind her head */
const RB_AZ_F=RBK.dam({a:'#6aa890',r:'#24443a',t:'#7ab098',e:'#3a6a5a'}), RB_AZ_M=RBK.dam({a:'#4aa0e0',r:'#14243a',t:'#4aa0e0',e:'#24486a'});
const RB_AZ=(f,m)=>`<g transform="translate(0 5)">${f||''}<g transform="translate(15.6 -1.6) rotate(-14 1 6.2)">${m||''}</g></g>`;
const RB_LETTER='<rect x="-1.7" y="-1.2" width="3.4" height="2.4" fill="#fbf6e8" stroke="#b8a888" stroke-width=".2"/><path d="M-1.7 -1.2 L0 .1 L1.7 -1.2" stroke="#b8a888" stroke-width=".2" fill="none"/><circle cy=".1" r=".32" fill="#c8402a"/>';
const RB_SHELL=y=>`<circle cx="5" cy="${y}" r="3.4" fill="#dcbc8c" stroke="#a8885a" stroke-width=".35"/><path d="M5.6 ${y} a.6 .6 0 0 0 -1.2 0 a1.3 1.3 0 0 0 2.6 0 a2 2 0 0 0 -4 0" stroke="#a8885a" stroke-width=".3" fill="none"/><path d="M2.4 ${rf1(y-1.8)} Q4.4 ${rf1(y-3.4)} 6.8 ${rf1(y-2.6)}" stroke="#f2dcb0" stroke-width=".4" fill="none"/>`;
const RB_SAILOR=RBK.beetle({c:'#c8a040',sh:'#f0d080',e:'#8a6a20',hc:'#5a4020',lc:'#5a4020'});
const RB_PAINT=['#e0782a','#d8a030','#c8402a','#e8b040'];
/* a little rainbow from A to B, h high in the middle */
const rbBow=(A,B,h,win)=>{ const dx=rf1(B[0]-A[0]), dy=rf1(B[1]-A[1]), C=['#e8706a','#f0b448','#9ccc68','#6aa4e0','#a884d8'];
  return {x:A[0],y:A[1],r:0,win,html:`<svg width="1" height="1" style="left:0;top:0"><g class="rb-bow" fill="none" stroke-width=".7" stroke-linecap="round">${C.map((c,i)=>`<path d="M${rf1(i*.5)} 0 Q${rf1(dx/2)} ${rf1(dy/2-h+i*1.3)} ${rf1(dx-i*.5)} ${dy}" stroke="${c}"/>`).join('')}</g></svg>`}; };
const rbKite=(p,win)=>({x:p[0],y:p[1],r:0,win,html:'<svg width="1" height="1" style="left:0;top:0"><g class="rb-kite"><path d="M1 -2 Q10 -4 18 -15" stroke="#8a9ca2" stroke-width=".3" fill="none"/><path d="M18 -15 L20.4 -18.6 L22.6 -15.4 L20 -12.4Z" fill="#e8584a"/><path d="M18 -15 L22.6 -15.4 M20.4 -18.6 L20 -12.4" stroke="#fbe0a0" stroke-width=".25"/><path d="M20 -12.4 Q18.6 -10 20 -8 Q21.2 -6 19.6 -4" stroke="#8a9ca2" stroke-width=".25" fill="none"/><path d="M19.2 -10.2 l1.2 .3 M19.8 -7 l1.2 .3" stroke="#f0c040" stroke-width=".6"/></g></svg>'});
REED_BUGS.push(
  /* ── real ones, Nos. 81-90 ── */
  rbBug('clickbeetle','click beetle',rbScale(RBK.beetle({c:'#6e4c30',sh:'#b08c62',e:'#4a3220',hc:'#5a3e26',lc:'#4a3420',ant:'long'}),1.1),
    (g,rnd)=>{ const A=g.cat(0,.81), B=g.cat(2,.81), P=bugPlan(A,{},rnd), clicks=[];
      /* rolls onto its back (pivoting so the shell rests on the perch), lies still, then snaps up and over */
      const flip=(p,n)=>{ P.hold(2.4).crawl([p[0],rf1(p[1]-5.4)],.45,{tilt:180}).hold(2.6,{bob:.12,every:.3}).mark(n)
        .crawl([rf1(p[0]+1.5),rf1(p[1]-17)],.2,{tilt:-90}).crawl(p,.26,{tilt:0}).hold(1.8); clicks.push([p,n]); };
      flip(A,'k1'); rbTravel(P,B,{}); flip(B,'k2'); rbTravel(P,A,{});
      const R=P.close(), M=R.M;
      R.props=clicks.map(([p,n])=>rbProp(rbAt(p,0,-4),10,8,'<g class="rb-puff"><path d="M0 -2.4 v-1.6 M2.2 -1.6 l1.2 -1 M-2.2 -1.6 l-1.2 -1 M2.8 .4 h1.4 M-2.8 .4 h-1.4" stroke="#e0b040" stroke-width=".5" stroke-linecap="round"/></g>',{win:[[M[n],M[n]+.6]]})); return R; }),
  rbBug('rubytail','ruby-tailed wasp',rbScale(RBK.wasp({a:'#d42a40',t:'#2a9c8c',h:'#2a7ca2',wf:'#e2eaee',x:'<path d="M2.2 4.3 Q4 3.7 6 4.3" stroke="#ff9aa6" stroke-width=".4" fill="none" opacity=".8"/><path d="M8.1 4.2 Q8.8 3.9 9.5 4.3" stroke="#9af4e4" stroke-width=".35" fill="none"/>'}),.8),
    (g,rnd)=>{ const top=[136,24.4], P=bugPlan([104,-10],{},rnd).hover(.6,{jit:.6}).to([126,12],.8).hover(1.8,{jit:.4}).to([144,14],.5).hover(1.4,{jit:.4})
        .to(top,.6,{up:180}).hold(1.4,{bob:.1,every:.2}).mark('in0').hold(3.8).mark('in1').hold(1)
        .to([128,-4],.7).to(g.leaf(12,1),.7,{tilt:-4}).hold(3.6,{bob:.08,every:.2}).to([96,-12],.8).to([104,-10],.5);
      const R=P.close(), M=R.M; R.hide=[[M.in0,M.in1]]; R.still=M.in0-.8; R.props=[RB_STUB()]; return R; }),
  rbBug('springtail','water springtail',{W:7,H:4.6,ax:3,ay:4.2,bz:.04,bs:-.5,wo:'3px 2px',rest:'',fly:'',
      body:'<path d="M2.2 3.2 l-.4 .9 M3 3.3 v.9 M3.8 3.2 l.4 .8" stroke="#2a3248" stroke-width=".25"/><path d="M.8 3 Q1.4 4.2 2.6 3.8" stroke="#6a7aa8" stroke-width=".3" fill="none"/><ellipse cx="2.6" cy="2.5" rx="2.2" ry="1.15" fill="#3c4c78"/><path d="M1 1.9 Q2.6 1.3 4 1.7" stroke="#8aa0d8" stroke-width=".3" fill="none"/><circle cx="4.9" cy="2.3" r=".95" fill="#344068"/><circle cx="5.3" cy="2" r=".26" fill="#0e1220"/><path d="M5.3 1.6 Q6 .6 6.8 .5 M5 1.5 Q5.4 .3 6.1 0" stroke="#344068" stroke-width=".22" fill="none"/>'},
    (g,rnd)=>{ const xs=[48,45,56,63,60,72,84,80,94,104,101,114,124,118,106,92,96,78,66,52,40], P=bugPlan([40,33.6],{},rnd).hold(1.4), rest=[];
      xs.forEach((x,i)=>{ const a=P.at(), h=rf1(5+((i*5)%4)*1.8);
        P.to([rf1((a[0]+x)/2),rf1(33.6-h)],.15,{e:'ease-out',glide:true}).to([x,33.6],.15,{e:'ease-in',glide:true});
        if(i%5===4){ P.mark('r'+i).hold(1.8); rest.push([x,'r'+i]); } else P.hold(rf1(.25+((i*3)%4)*.12)); });
      const R=P.close(), M=R.M; R.props=rest.map(([x,n])=>rbRing([x,33.6],[[M[n],M[n]+1.3]])); return R; }),
  rbBug('bulrushbug','bulrush bug',rbScale(RBK.shield({c:'#b08a52',c2:'#e0c088',h:'#7a5a32',lc:'#3a2a18',x:'<path d="M2 3.6 L8.6 2.4" stroke="#5a3e22" stroke-width=".35"/>'}),.9),
    (g,rnd)=>{ const u=i=>({up:g.catUp(i)}), d=i=>({up:g.catUp(i)+180}), P=bugPlan(g.cat(0,.56),u(0),rnd);
      /* up the brown head, probing, back down and round behind it, out again */
      const head=(i,n)=>{ P.hold(1).crawl(g.cat(i,.74),2.6,u(i)).hold(2.8,{bob:.15,every:.25}).crawl(g.cat(i,.74),.4,d(i)).crawl(g.cat(i,.6),1.6,d(i))
        .mark(n+'0').hold(1.2).crawl(g.cat(i,.56),.4,u(i)).hold(1).mark(n+'1').hold(1.2); };
      head(0,'a'); rbTravel(P,g.cat(1,.56),u(1)); head(1,'b'); rbTravel(P,g.cat(0,.56),u(0));
      const R=P.close(); R.hide=rbW(R.M,'a','b'); return R; }),
  rbBug('azure','azure damselflies',rbScale({W:34,H:16,ax:13.6,ay:12.2,bz:.07,bs:-.4,wo:'14px 10.5px',
      body:RB_AZ(RB_AZ_F.body,RB_AZ_M.body), rest:RB_AZ(RB_AZ_F.rest,RB_AZ_M.rest), fly:RB_AZ(RB_AZ_F.fly), flyStill:RB_AZ('',RB_AZ_M.fly)},.8),
    (g,rnd)=>{ const P=bugPlan(g.leaf(10,1),{tilt:-4},rnd).hold(3.6), dips=[];
      /* nose up so her tail tip touches the water, twice at each spot */
      const dip=(x,n)=>{ const q={air:-10,tilt:-10}; P.to([x,27],.7).to([x,32.4],.3,{...q,e:'ease-in'}).mark(n).hover(.5).to([x,28],.35,{...q,e:'ease-out'}).to([x,32.4],.3,{...q,e:'ease-in'}).hover(.5).to([x,27],.4,q); dips.push([x,n]); };
      dip(72,'a'); dip(52,'b'); P.to(g.leaf(6,1),.6,{tilt:-4}).hold(3.2); rbTravel(P,g.leaf(10,1),{tilt:-4},'flutter');
      const R=P.close(), M=R.M; R.props=dips.map(([x,n])=>rbRing([x+10,33.6],[[M[n],M[n]+2.4]])); return R; }),
  rbBug('ant','black garden ant',{W:10.6,H:5.6,ax:5,ay:5.2,bz:.04,bs:-.5,wo:'5px 2px',rest:'',fly:'',
      body:'<path d="M4.4 3.6 L3 5.2 M5.2 3.7 L5.4 5.3 M6 3.6 L7.4 5.1" stroke="#2a2220" stroke-width=".3" fill="none"/><ellipse cx="2.1" cy="3" rx="1.9" ry="1.4" fill="#2a2220"/><path d="M1 2.2 Q2 1.7 3 2" stroke="#6a5a52" stroke-width=".3" fill="none"/><circle cx="4.1" cy="3.2" r=".45" fill="#2a2220"/><ellipse cx="5.5" cy="3" rx="1.3" ry=".75" fill="#2a2220"/><ellipse cx="7.8" cy="2.6" rx="1.15" ry="1" fill="#2a2220"/><path d="M8.3 1.8 L8.7 .4 L10.2 .2" stroke="#2a2220" stroke-width=".25" fill="none"/>',
      add:'<circle cx="9.2" cy="3.3" r=".75" fill="#f2c860" stroke="#c89a30" stroke-width=".2"/><circle cx="9" cy="3" r=".22" fill="#fff6d8"/>'},
    (g,rnd)=>{ const j=12, U=s=>({up:g.leafUp(j,s)}), D=s=>({up:g.leafUp(j,s)+180}), P=bugPlan([156,33.6],{f:-1},rnd).hold(.5).crawl([123,33.6],4.2);
      [.1,.2,.3,.4,.48].forEach(s=>P.crawl(g.leaf(j,s),.7,U(s)));
      P.hold(3.6,{bob:.12,every:.2}).mark('got').crawl(g.leaf(j,.48),.4,D(.48));
      [.36,.24,.12].forEach(s=>P.crawl(g.leaf(j,s),.65,D(s)));
      P.crawl([123,33.6],.6,{face:true}).crawl([156,33.6],4.2,{face:true}).mark('out').hold(.5);
      const R=P.close(), M=R.M; R.add=[[M.got,M.out]]; R.hide=[[0,.2],[M.out,R.T]]; R.still=M.got-1;
      R.props=[.53,.58,.63].map((s,i)=>rbProp(rbAt(g.leaf(j,s),i%2?.9:-.9,0),2,2,'<ellipse rx=".6" ry=".45" fill="#9ccf6a" stroke="#6f9a45" stroke-width=".15"/>')); return R; }),
  rbBug('groundhopper','pygmy groundhopper',RBK.hop({c:'#7a6a50',b:'#5a4a38',h:'#6a5a44',e:'#d8c8a0',long:1,x:'<path d="M-.6 3.9 Q3 2.6 7.6 2" stroke="#a8987a" stroke-width=".35" fill="none"/>'}),
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'hop',stops:[{leaf:6,s:.24,hold:3.4},{water:50,hold:.3,cmark:'w1',crawl:{water:42},crawlT:2.6,hold2:.3},
        {leaf:4,s:.22,hold:3.4},{water:46,hold:.3,cmark:'w2',crawl:{water:55},crawlT:2.6,hold2:.3}]}).close(), M=R.M;
      R.props=[rbRing([46,33.6],rbW(M,'w1')),rbRing([50,33.6],rbW(M,'w2'))]; return R; }),
  rbBug('raftspider','raft spider',{W:17,H:8,ax:8.4,ay:7.6,bz:.04,bs:-.5,wo:'8px 4px',rest:'',fly:'',
      body:'<g stroke="#3a2e20" stroke-width=".35" fill="none" stroke-linecap="round"><path d="M9.4 4.4 Q12.6 1.4 16.4 7.6 M9 4.6 Q11.4 2.6 13.8 7.6 M7.6 4.6 Q5.2 2.4 3 7.6 M7.2 4.4 Q3.4 1.2 .4 7.6"/></g><ellipse cx="5" cy="4.6" rx="2.8" ry="1.9" fill="#4a3a28"/><path d="M2.6 5.4 Q5 6.4 7.8 5.4" stroke="#ecdcac" stroke-width=".55" fill="none"/><ellipse cx="9.2" cy="4.3" rx="1.9" ry="1.3" fill="#54422e"/><path d="M8 5.2 Q9.4 5.6 10.8 4.9" stroke="#ecdcac" stroke-width=".5" fill="none"/><circle cx="10.6" cy="3.6" r=".3" fill="#120c06"/><path d="M10.9 4.6 l.5 .8" stroke="#3a2e20" stroke-width=".4"/>',
      add:'<circle cx="12.4" cy="5.4" r=".8" fill="#3b3a33"/><ellipse cx="12" cy="4.6" rx=".9" ry=".35" fill="#c9d6d4" opacity=".7"/>'},
    (g,rnd)=>{ const P=bugPlan([104,33.6],{f:-1},rnd).mark('w0').hold(4.4,{bob:.1,every:.9}).crawl([86,33.6],.35).hold(.6).crawl([70,33.6],.3).mark('g').hold(3.6,{bob:.12,every:.3})
        .crawl([71,33.6],.2,{face:true}).hold(.6).crawl([88,33.6],.9).hold(.8).crawl([104,33.6],.8).mark('w2').hold(1.4).mark('w3');
      const R=P.close(), M=R.M; R.add=[[M.g,M.w3]]; R.still=M.w0+1;
      R.props=[rbRing([98,33.6],[[M.w0,M.w0+1.3],[M.w2,M.w3]]),rbRing([66,33.6],[[M.g,M.g+1.3]])]; return R; }),
  rbBug('balloonfly','balloon fly',rbScale({...RBK.fly({a:'#4a4a48',t:'#5a5a56',e:'#6a2a1a',long:1,wf:'#eef0ee',ws:'#a8b0b0',
      x:'<ellipse cx="10.8" cy="7.8" rx="2.1" ry="1.7" fill="#f8fafa" stroke="#b0bcc0" stroke-width=".3"/><path d="M9.8 7 Q10.6 6.4 11.6 6.8" stroke="#fff" stroke-width=".4" fill="none"/><path d="M9.6 8.6 Q10.8 9.4 12.2 8.6" stroke="#d8e0e2" stroke-width=".3" fill="none"/>'}),W:13},.85),
    (g,rnd)=>{ const P=bugPlan(g.leaf(10,1),{},rnd).hold(3.6,{bob:.1,every:.4});
      /* two figure-eights over the water, then wait with the gift on a tip */
      const dance=(cx,cy)=>{ P.to([cx,cy],.6); for(let k=1;k<=24;k++){ const a=k*Math.PI/6; P.to([rf1(cx+Math.sin(a)*12),rf1(cy+Math.sin(2*a)*2.2)],.2,{e:'linear'}); } };
      dance(66,22); P.to(g.leaf(6,1),.6).hold(4,{bob:.1,every:.4}); dance(112,24); P.to(g.leaf(13,1),.6).hold(4,{bob:.1,every:.4}); rbTravel(P,g.leaf(10,1),{});
      return P.close(); }),
  rbBug('chaser','broad-bodied chaser',RBK.odo({a:'#8ab4dc',r:'#e8c04a',t:'#6a5a44',e:'#4a3e30',x:'<ellipse cx="7.6" cy="7" rx="6" ry="1.75" fill="#8ab4dc"/><path d="M3.4 7.9h.9 M6.2 8.1h.9 M9 8h.9" stroke="#e8c04a" stroke-width=".6"/><path d="M2.4 6.3 Q7.4 5.5 12.6 6.3" stroke="#d4e6f6" stroke-width=".35" fill="none"/>'}),
    (g,rnd)=>{ const P=bugPlan(g.leaf(8,1),{tilt:-6},rnd).hold(3.4), taps=[];
      /* tail down, tapping the water in a line */
      const dab=(xs,n)=>{ const q={air:-20,tilt:-20}; P.to([xs[0],26],.7,{e:RB_DART});
        xs.forEach((x,i)=>{ P.to([x,31.8],.16,{...q,e:'ease-in'}).mark(n+i).to([rf1(x+(xs[1]-xs[0])/2),27],.18,{...q,e:'ease-out'}); taps.push([x,n+i,n==='a'?-1:1]); }); };
      dab([74,68,62,56,50],'a'); P.to([60,-6],.6).to(g.leaf(5,1),.5,{tilt:4}).hold(3.4); dab([100,106,112,118],'b'); P.to([104,-8],.6).to(g.leaf(8,1),.5,{tilt:-6});
      const R=P.close(), M=R.M; R.props=taps.map(([x,n,f])=>rbRing([rf1(x-10.4*f),33.6],[[M[n],M[n]+1.3]])); return R; }),

  /* ── reed-bed legends, Nos. 91-100 (made up) ── */
  rbBug('forkhorn','forkhorn caterpillar',{W:18,H:12,ax:9,ay:11.2,bz:.05,bs:-.5,wo:'9px 6px',rest:'',fly:'',body:RB_FORK(false),alt:RB_FORK(true),
      add:'<defs><linearGradient id="rbg-forkhorn-silk" gradientUnits="userSpaceOnUse" x1="17" y1="0" x2="52" y2="0"><stop offset="0" stop-color="#8a9ca2" stop-opacity=".95"/><stop offset="1" stop-color="#8a9ca2" stop-opacity="0"/></linearGradient></defs><path d="M17.4 7.4 L52 7.4" stroke="url(#rbg-forkhorn-silk)" stroke-width=".4"/>'},
    (g,rnd)=>{ const t7=g.leaf(7,1), t8=g.leaf(8,1), P=bugPlan([t7[0],-18],{up:0},rnd); let k=0;
      /* every other step humps up, inchworm style */
      const inch=(p,q)=>{ const n='i'+k, on=k++%2; if(on) P.mark(n+'0'); P.crawl(p,.6,q); if(on) P.mark(n+'1'); };
      P.hold(.6).to([t7[0],rf1(t7[1]-8)],3.4,{glide:true,air:-90,up:0}).hold(.6).mark('grab').crawl(t7,.8,{up:g.leafUp(7,1)+180}).hold(.6);
      [.88,.76,.64,.52,.4,.28,.16].forEach(s=>inch(g.leaf(7,s),{up:g.leafUp(7,s)+180}));
      inch([78,33.4],{tilt:0}); inch([82,33.4],{tilt:0});
      [.12,.24,.36,.48].forEach(s=>inch(g.leaf(8,s),{up:g.leafUp(8,s)}));
      P.mark('eat0').hold(4.4,{bob:.25,every:.3}).mark('eat1');
      [.6,.72,.84,.96].forEach(s=>inch(g.leaf(8,s),{up:g.leafUp(8,s)}));
      P.crawl(t8,.5,{up:0}).hold(.8).mark('climb').to([t8[0],-18],3.6,{glide:true,air:-90,up:0}).mark('top').hold(.6);
      const R=P.close(), M=R.M;
      R.alt=rbW(M,...[...Array(k).keys()].map(i=>'i'+i)); R.add=[[0,M.grab],[M.climb,R.T]]; R.hide=[[0,.3],[M.top,R.T]]; R.still=M.eat0+1; return R; },{fic:1}),
  rbBug('papercrane','paper crane fly',{W:16,H:12,ax:8,ay:10.6,bz:.32,bs:.25,wo:'8px 6.5px',same:true,
      wings:'<path d="M6.2 6.7 L9.8 6.5 L7.4 .4Z" fill="#fbf8f0" stroke="#9e9278" stroke-width=".25"/><path d="M7.4 .4 L8.1 6.6 L9.8 6.5Z" fill="#e2d8c2"/>',
      body:'<path d="M7.4 8.8 L5.4 10.6 M8.4 9 L8.6 10.6 M9.4 8.8 L11.6 10.6" stroke="#8a7e66" stroke-width=".25" fill="none"/><path d="M5 7.8 L.8 3.2 L5.8 7Z" fill="#f2ecdc" stroke="#9e9278" stroke-width=".25"/><path d="M4 7.4 L8 5.6 L11.4 7.6 L8 9.2Z" fill="#f8f4ea" stroke="#9e9278" stroke-width=".25"/><path d="M8 5.6 L11.4 7.6 L8 9.2Z" fill="#ddd3bc"/><path d="M10.6 7.2 L14.4 2.6 L11.6 7.8Z" fill="#f8f4ea" stroke="#9e9278" stroke-width=".25"/><path d="M14.4 2.6 L15.9 3.5 L14.1 3.3Z" fill="#ddd3bc" stroke="#9e9278" stroke-width=".2"/>'},
    (g,rnd)=>rbTour(g,rnd,{style:'drift',stops:[{cat:1,f:1,flat:1,hold:4.2},{tip:7,hold:3.6},{cat:2,f:1,flat:1,hold:4.2}]}).close(),{fic:1}),
  rbBug('prismfly','prism fly',rbScale(RBK.fly({a:'#d6eef6',t:'#c4e2ee',e:'#8a78c8',wf:'#fbfdff',ws:'#c4b4f0',x:'<path d="M1.2 4 Q3.6 3.2 5.8 4" stroke="#f2a0be" stroke-width=".45" fill="none"/><path d="M1.2 4.9 Q3.6 4.1 5.8 4.9" stroke="#9ed0f2" stroke-width=".45" fill="none"/>'}),.9),
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'dart',stops:[{tip:5,tilt:-3,hold:3},{air:[76,-9],hover:4.4,jit:.3,mark:'b1'},{tip:9,tilt:3,hold:2.6},{air:[127,-3],hover:4.4,jit:.3,mark:'b2'},{tip:12,tilt:-3,hold:2.6}]}).close(), M=R.M;
      R.props=[rbBow(g.leaf(7,1),g.cat(1,1),10,[[M.b10+.4,M.b11+1.6]]),rbBow(g.cat(2,1),g.leaf(13,1),10,[[M.b20+.4,M.b21+1.6]])]; return R; },{fic:1}),
  rbBug('painter','autumn painter',{...RBK.beetle({c:'#d8602a',sh:'#f2a060',e:'#a8401a',hc:'#3a2a1a',lc:'#3a2a1a',spots:[[3.4,3.2,.45,'#f2c040'],[6,2.6,.45,'#c8302a']],
      x:'<path d="M9.6 4.4 L12.6 5.6" stroke="#8a6a3a" stroke-width=".35"/><path d="M12.4 5.4 Q13.6 5.6 13.8 6.6 Q12.8 6.6 12.4 5.4Z" fill="#e8782a"/>'}),W:14},
    (g,rnd)=>{ const T=[3,6,9,12], R=rbTour(g,rnd,{style:'bob',stops:T.map((j,i)=>({tip:j,tilt:i%2?4:-4,hold:2.6,bob:.25,every:.2,mark:'p'+i}))}).close(), M=R.M;
      R.props=T.map((j,i)=>rbProp(g.leaf(j,1),4,14,`<path d="M0 0 Q-.8 3 -.95 6.4 L.95 6.4 Q.8 3 0 0Z" fill="${RB_PAINT[i]}"/>`,{r:g.leafUp(j,.92),win:[[M['p'+i+'0']+1.4,R.T]]})); return R; },{fic:1}),
  rbBug('nightcap','nightcap moth',RBK.moth({c:'#8a8ab8',s:'#b4b4e0',bc:'#6a6a98',fc:'#9c9cca',x:'<path d="M9.2 4.3 L11.1 4.1 Q9.8 .9 7.4 1.5 Q9 2.6 9.2 4.3Z" fill="#d84a4a"/><path d="M9.5 3.3 L10.6 3.1 M8.8 2.3 L9.8 2.1" stroke="#fff" stroke-width=".4"/><path d="M9 4.4 L11.3 4.1" stroke="#fff" stroke-width=".55" stroke-linecap="round"/><circle cx="7.4" cy="1.5" r=".6" fill="#fff"/>'}),
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'flutter',stops:[{cat:0,f:.66,hold:6.4,bob:.12,every:1.1,mark:'z1'},{cat:2,f:.64,hold:6.4,bob:.12,every:1.1,mark:'z2'}]}).close(), M=R.M;
      const zz=(p,w)=>rbProp(p,14,14,'<g class="rb-note"><path d="M-2 -2 h3.6 l-3.6 3.6 h3.6" stroke="#5e5e98" stroke-width=".75" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g><g class="rb-note two"><path d="M2 -6 h2.6 l-2.6 2.6 h2.6" stroke="#5e5e98" stroke-width=".6" fill="none" stroke-linejoin="round" stroke-linecap="round"/></g>',{win:w});
      R.props=[zz(rbAt(g.cat(0,.66),3,-10),rbW(M,'z1').map(([a,b])=>[a+1,b-.4])),zz(rbAt(g.cat(2,.64),3,-10),rbW(M,'z2').map(([a,b])=>[a+1,b-.4]))]; return R; },{fic:1}),
  rbBug('postman','postman beetle',{...RBK.beetle({c:'#3a6a9a',sh:'#8ab4e0',e:'#24486a',hc:'#24364a',lc:'#24364a',x:'<path d="M8 3.3 Q8.8 2.3 10 2.8 L10.8 3.3Z" fill="#24364a"/><path d="M8.6 2.7 h.8" stroke="#e8c040" stroke-width=".3"/>'}),W:14,
      add:`<g transform="translate(11.2 5.4) rotate(-12)">${RB_LETTER}</g>`},
    (g,rnd)=>{ const A=g.cat(0,.4), B=g.cat(2,.4), ua={up:g.catUp(0)}, ub={up:g.catUp(2)}, P=bugPlan(A,ua,rnd).hold(2).mark('p1').hold(.8);
      rbTravel(P,B,ub,'bob'); P.hold(.6).mark('d1').hold(4.2,{bob:.1,every:.6}).mark('p2').hold(.8); rbTravel(P,A,ua,'bob'); P.hold(.6).mark('d2').hold(2);
      const R=P.close(), M=R.M, L=(i,w)=>rbProp(rbAt(g.cat(i,.34),2.2,0),5,4,RB_LETTER,{r:g.catUp(i)+10,win:w});
      R.add=[[M.p1,M.d1],[M.p2,M.d2]]; R.props=[L(0,[[0,M.p1],[M.d2,R.T]]),L(2,[[M.d1,M.p2]])]; return R; },{fic:1}),
  rbBug('sailor','sailor beetle',{W:16,H:12,ax:8,ay:9.7,bz:.05,bs:-.5,wo:'8px 4px',rest:'',fly:'',
      body:`<path d="M6.4 6.8 Q5.6 1.2 8.8 -1.6 Q9.8 2.8 8.2 6.8Z" fill="#f4ecd4" stroke="#c8b888" stroke-width=".25"/><path d="M7.2 6.6 L8.4 -.6" stroke="#c8b888" stroke-width=".2"/><g transform="translate(3 3.3)">${RB_SAILOR.rest}${RB_SAILOR.body}</g>
        <path d="M.4 8.2 Q1 9.8 4 10 Q9 10.6 13.6 9.6 Q15.4 9 15.8 7.6 Q13 8.8 8 8.9 Q3 8.8 .4 8.2Z" fill="#7fa878" stroke="#5f9470" stroke-width=".3"/><path d="M2 9 Q8 9.8 14 8.8" stroke="#a3c08a" stroke-width=".3" fill="none"/>`},
    (g,rnd)=>{ const P=bugPlan([-8,33.6],{},rnd).hold(.4); let x=-8, i=0;
      /* rocking a little as it goes */
      const sail=to=>{ while(x<to){ x=Math.min(to,x+6); P.crawl([x,33.6],1,{tilt:i++%2?3:-3}); } };
      sail(36); P.mark('t1').hold(2.4,{bob:.25,every:.6}).mark('t2'); sail(100); P.mark('t3').hold(2.4,{bob:.25,every:.6}).mark('t4'); sail(158); P.mark('out').hold(.6);
      const R=P.close(), M=R.M; R.hide=[[0,.15],[M.out,R.T]]; R.still=M.t1+.5; R.props=[rbRing([36,33.6],[[M.t1,M.t2]]),rbRing([100,33.6],[[M.t3,M.t4]])]; return R; },{fic:1}),
  rbBug('hermit','hermit beetle',{W:12,H:9,ax:5.6,ay:8.4,bz:.05,bs:-.5,wo:'5px 1.6px',rest:'',
      fly:'<ellipse cx="4" cy="1.4" rx="3.2" ry="1" transform="rotate(-18 4 1.4)" fill="#eef2ea" stroke="#b9c3b1" stroke-width=".3" opacity=".8"/>',
      body:`<path d="M3.6 7.4 l-.6 1 M5.4 7.7 v1 M7.2 7.4 l.6 1" stroke="#34402e" stroke-width=".4" stroke-linecap="round"/>${RB_SHELL(4.6)}<ellipse cx="8.4" cy="7" rx="1.2" ry=".9" fill="#3c4a36"/><circle cx="9.4" cy="6.4" r=".9" fill="#3c4a36"/><circle cx="9.7" cy="6.2" r=".28" fill="#e8f0d8"/><path d="M9.8 5.7 Q10.8 4.4 11.8 4.4 M9.6 5.6 Q10 4 10.8 3.4" stroke="#3c4a36" stroke-width=".25" fill="none"/>`,
      alt:`${RB_SHELL(5.2)}<circle cx="7.6" cy="7.6" r=".28" fill="#e8f0d8"/><circle cx="8.3" cy="7.5" r=".28" fill="#e8f0d8"/>`},
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'flutter',stops:[{leaf:3,s:.3,hold:3.6,mark:'d1',crawl:{leaf:3,s:.5},crawlT:2.6,hold2:1.6},{leaf:9,s:.3,hold:3.6,mark:'d2',crawl:{leaf:9,s:.5},crawlT:2.6,hold2:1.6}]}).close(), M=R.M;
      R.alt=rbW(M,'d1','d2').map(([a,b])=>[a+.3,b-.2]); R.still=M.d10+1; return R; },{fic:1}),
  rbBug('kitefly','kite fly',rbScale(RBK.fly({a:'#e0a040',b:'#8a5a20',t:'#c88a30',e:'#6a3a1e'}),.85),
    (g,rnd)=>{ const R=rbTour(g,rnd,{style:'flutter',stops:[{cat:1,f:1,flat:1,hold:6.4,mark:'k1'},{tip:5,hold:6.4,mark:'k2'}]}).close(), M=R.M, w=n=>rbW(M,n).map(([a,b])=>[a+.4,b-.2]);
      R.props=[rbKite(g.cat(1,1),w('k1')),rbKite(g.leaf(5,1),w('k2'))]; return R; },{fic:1}),
  rbBug('angler','angler beetle',{...RBK.beetle({c:'#4a7a5a',sh:'#9ac8a0',e:'#2a4a3a',hc:'#2a3a2a',lc:'#2a3a2a',x:'<path d="M7.9 3 Q9 1.5 10.2 3Z" fill="#e8d090"/><path d="M7.2 3.1 L10.9 3.1" stroke="#c8a860" stroke-width=".45" stroke-linecap="round"/>'}),W:17,
      add:'<path d="M9.6 4.6 L16.6 -3.4" stroke="#8a6a3a" stroke-width=".4" stroke-linecap="round"/><path d="M16.6 -3.4 V19.6" stroke="#8a9ca2" stroke-width=".22"/><circle cx="16.6" cy="19.8" r=".7" fill="#e84a3a"/><path d="M15.9 19.8 h1.4" stroke="#fff" stroke-width=".35"/>'},
    (g,rnd)=>{ const R=rbTour(g,rnd,{stops:[{tip:11,hold:7.4,mark:'f1'},{tip:10,hold:7.4,mark:'f2'}]}).close(), M=R.M, W=rbW(M,'f1','f2');
      /* the float sits on the water below the rod tip, 11.6 out in front */
      R.add=W.map(([a,b])=>[a+.5,b-.4]); R.still=W[0][0]+2;
      R.props=[[rf1(g.leaf(11,1)[0]+11.6),W[0]],[rf1(g.leaf(10,1)[0]-11.6),W[1]]].map(([x,[a,b]])=>rbRing([x,33.6],[[a+.7,a+2],[b-2.2,b-.6]])); return R; },{fic:1})
);
Object.assign(REED_BUG_NOTES,{
  clickbeetle:'Plays dead when it lands. If it ends up on its back it arches, and a peg on its chest snaps into a notch with a loud click that throws it into the air to land the right way up.',
  rubytail:'A cuckoo wasp, glittering green and ruby. It sneaks into the nests bees build in hollow reed stems and lays its egg there. If the owner catches it, it rolls up into a hard little ball.',
  springtail:'Too small to notice until thousands gather on still water. A forked spring folded under its tail flings it into the air. Not quite an insect, but a close cousin.',
  bulrushbug:'A small true bug that lives on cattails and nowhere else. It spends the winter deep in the fluffy heads and sucks the seeds.',
  azure:'A pair in tandem. The blue male holds the female behind her head and doesn’t let go while she lays her eggs, dipping into the water at the foot of the reeds.',
  ant:'Ants farm aphids. They stroke them with their antennae and the aphids give up a drop of sweet honeydew; in return the ants guard them from ladybugs.',
  groundhopper:'A tiny grasshopper of muddy pond edges. Unlike its relatives it swims well, kicking across the water and even diving to escape.',
  raftspider:'Not an insect but a big spider of fens and ponds. It rests with its feet on the water, feeling for ripples, then runs across the surface to grab whatever made them.',
  balloonfly:'A dance fly. The male wraps a gift in a balloon of silk and dances with it over the water until a female takes it from him.',
  chaser:'A stout, powder-blue dragonfly. The female lays her eggs by flying low and tapping the tip of her tail on the water, flicking them off one at a time.',
  forkhorn:'Lets itself down from the willows on a thread of silk, then eats its way down one reed and up the next. Startle it and it flashes the red fork on its head, which smells of oranges. One day it will be a butterfly.',
  papercrane:'Folded itself out of a page that blew into the marsh. It flies the way paper does, gliding and wobbling, and on wet days it doesn’t fly at all.',
  prismfly:'Its glassy body splits the light. Wherever it hovers between two reeds, a small rainbow bends from one to the other.',
  painter:'Every autumn it carries a tiny brush from reed tip to reed tip and turns them orange and gold, one at a time. It starts at the end of September.',
  nightcap:'Out all night and asleep all day. It naps on the cattail heads in its little red cap, and you can usually see the Zs.',
  postman:'Carries letters between the cattails. Nobody knows who writes them, but there is always a reply waiting.',
  sailor:'Sails across the pond on a fallen reed leaf, with one wing case held up for a sail, and ties up at the reeds for a rest on the way.',
  hermit:'Lives in an empty snail shell and takes it everywhere, even flying. When it lands it pulls in under the shell until it’s sure the coast is clear.',
  kitefly:'Flies a kite on a thread of silk from the tops of the reeds whenever there’s a breeze.',
  angler:'Fishes from the low reed tips with a grass-stem rod. It has never caught anything, and it doesn’t seem to mind.'});
/* days that are set by hand (swapped into that day's slot of its block) */
const REED_BUG_PINS={'2026-09-30':'cranefly'};
const bugName=b=>b.name.charAt(0).toUpperCase()+b.name.slice(1);
const bugByKey=k=>REED_BUGS.find(b=>b.k===k);
function ymdDay(t){ return Math.round(Date.UTC(+t.slice(0,4),+t.slice(5,7)-1,+t.slice(8,10))/864e5); }
/* today's bug: a fresh shuffle of all of them for every stretch of that
   many days, never the same bug two days running across the seam. Bugs
   switched off in the bug library sit out of the rotation. */
function reedBugOfDay(t){
  if(typeof window._reedBug==='number') return REED_BUGS[window._reedBug%REED_BUGS.length];
  let pool=REED_BUGS.map((b,i)=>i).filter(i=>!bugTweak(REED_BUGS[i].k).off);
  if(!pool.length) pool=REED_BUGS.map((b,i)=>i);
  const day=ymdDay(t), n=pool.length;
  const shuffle=c=>{ const r=PondArt.hs('reed bugs·'+n+'·'+c), a=[...Array(n).keys()];
    for(let i=n-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };
  const deck=c=>{ const p=shuffle(c);
    Object.entries(REED_BUG_PINS).forEach(([d,k])=>{ const dd=ymdDay(d); if(Math.floor(dd/n)!==c) return;
      const want=pool.findIndex(i=>REED_BUGS[i].k===k), at=p.indexOf(want), slot=dd%n; if(want>=0) [p[at],p[slot]]=[p[slot],p[at]]; });
    return p; };
  const cyc=Math.floor(day/n), p=deck(cyc);
  if(p[0]===deck(cyc-1)[n-1]&&!Object.keys(REED_BUG_PINS).some(d=>ymdDay(d)===cyc*n)) [p[0],p[1]]=[p[1],p[0]];
  return REED_BUGS[pool[p[day%n]]];
}
function reedBugHTML(bug,g,moving,t,o={}){
  const rnd=PondArt.hs(t+'·'+bug.k), res=bug.plan(g,rnd), {S,T}=res, id='rbg-'+bug.k;
  /* the library's tweaks: speed stretches the whole loop, size scales the bug about its feet */
  const tw=o.tweak||bugTweak(bug.k), sp=Math.max(.1,+tw.speed||1), sz=+tw.size||1, TD=+(T/sp).toFixed(3);
  const szT=sz!==1?`transform:scale(${sz});transform-origin:${bug.ax||0}px ${bug.ay||0}px;`:'';
  const alt=res.alt||[], add=res.add||[], hide=res.hide||[], props=res.props||[];
  const tf=s=>`translate(${s.x}px,${s.y}px) rotate(${s.r}deg) scaleX(${s.f})`, pc=tt=>+(tt/T*100).toFixed(2);
  const d=-((Date.now()/1000)%TD).toFixed(2);
  /* state at a moment of the loop */
  const stopAt=tt=>{ let s=S[0]; for(const x of S){ if(x.t<=tt+1e-6) s=x; else break; } return s; };
  const inW=(W,tt)=>W.some(([a,b])=>tt>=a-1e-6&&tt<b-1e-6);
  const hv=tt=>{ for(const [a,b] of hide){ if(tt>=a-1e-6&&tt<=b+1e-6) return 0; if(tt>a-.25&&tt<a) return +((a-tt)/.25).toFixed(2); if(tt>b&&tt<b+.25) return +((tt-b)/.25).toFixed(2); } return 1; };
  const t0=moving?0:(res.still||0), s0=stopAt(t0);
  const on={main:tt=>!inW(alt,tt), rest:tt=>!stopAt(tt).fly&&!inW(alt,tt), fly:tt=>stopAt(tt).fly&&!inW(alt,tt), alt:tt=>inW(alt,tt), add:tt=>inW(add,tt)};
  const steps=(W)=>{ const B=new Set([0]); S.forEach(s=>B.add(s.t)); W.forEach(([a,b])=>{ B.add(a); B.add(b); }); return [...B].filter(x=>x>=0&&x<T).sort((a,b)=>a-b); };
  const B=steps([...alt,...add]);
  const track=(name,fn,bps=B)=>`@keyframes ${id}-${name}{${bps.map(tt=>`${pc(tt)}%{opacity:${fn(tt)?1:0}}`).join('')}100%{opacity:${fn(0)?1:0}}}`;
  const an=(n,e)=>moving?`animation:${id}-${n} ${TD}s ${e} ${d}s infinite;`:'';
  let css='';
  if(moving){
    css=`@keyframes ${id}-m{${S.map(s=>`${pc(s.t)}%{transform:${tf(s)};animation-timing-function:${s.e||'ease-in-out'}}`).join('')}}`
      +Object.entries(on).filter(([n])=>!bug.inner&&(n==='main'||n==='rest'||n==='fly'||bug[n])).map(([n,fn])=>track(n,fn)).join('');
    if(hide.length){ const H=new Set([0,T]); hide.forEach(([a,b])=>[a-.25,a,b,b+.25].forEach(x=>{ if(x>=0&&x<=T) H.add(rf1(x*100)/100); }));
      css+=`@keyframes ${id}-h{${[...H].sort((a,b)=>a-b).map(tt=>`${pc(tt)}%{opacity:${hv(tt)}}`).join('')}}`; }
  }
  const svg=(w,h,inner)=>`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${inner}</svg>`;
  const lay=(n,inner)=>`<b class="rb-l" style="opacity:${on[n](t0)?1:0};${an(n,'step-end')}">${inner}</b>`;
  let inner;
  if(bug.inner){ const m=bug.inner(moving,rnd); css+=m.css; inner=`<b class="rb-in" style="left:0;top:0;${szT}">${m.html}</b>`; }
  else {
    const W=bug.W, H=bug.H, restArt=bug.same?bug.wings:bug.rest||'', flyArt=bug.same?bug.wings:bug.sailFly?bug.rest:bug.fly;
    const rest=restArt?lay('rest',svg(W,H,restArt)):'';
    const fly=lay('fly',`${bug.flyStill?svg(W,H,bug.flyStill):''}<b class="rb-l${moving?' rb-bz':''}" style="transform-origin:${bug.wo};--bz:${bug.bz}s;--bs:${bug.bs}">${svg(W,H,flyArt)}</b>`);
    const glow=bug.glow?`<b class="rb-glow${moving?' on':''}" style="left:${bug.glow[0]-7}px;top:${bug.glow[1]-7}px"></b>`:'';
    const main=lay('main',glow+(bug.under||bug.wingsFirst?rest+fly+svg(W,H,bug.body):svg(W,H,bug.body)+rest+fly));
    inner=`<b class="rb-in" style="left:${-bug.ax}px;top:${-bug.ay}px;width:${W}px;height:${H}px;${szT}">${main}${bug.alt?lay('alt',svg(W,H,bug.alt)):''}${bug.add?lay('add',svg(W,H,bug.add)):''}</b>`;
  }
  /* the props: each an opacity track of its own windows */
  const pr=props.map((p,i)=>{ const fn=tt=>!p.win||inW(p.win,tt);
    if(moving&&p.win){ const P=new Set([0]); p.win.forEach(([a,b])=>{ P.add(a); P.add(b); }); css+=track('p'+i,fn,[...P].filter(x=>x>=0&&x<T).sort((a,b)=>a-b)); }
    return `<b class="rb-prop${p.cls?' '+p.cls:''}" style="transform:translate(${p.x}px,${p.y}px) rotate(${p.r||0}deg);opacity:${fn(t0)?1:0};${p.win?an('p'+i,'step-end'):''}">${p.html}</b>`; }).join('');
  /* a generous tap target around the bug's middle */
  const hx=(bug.W||0)/2-(bug.ax||0), hy=(bug.H||0)/2-(bug.ay||0);
  const hit=`<b class="rb-hit" style="left:${rf1(hx-16)}px;top:${rf1(hy-16)}px"${o.hit===false?'':` onclick="reedBugCatch(event,'${bug.k}')" title="Catch it"`}></b>`;
  return `<style>${css}</style>${pr}<b class="rb-bug" data-bug="${bug.k}" data-t="${TD}" style="transform:${tf(s0)};${an('m','linear')}"><b class="rb-vis" style="opacity:${hide.length?hv(t0):1};${hide.length?an('h','linear'):''}">${inner}${hit}</b></b>`;
}
/* a bug drawn still, for the collection and the catch card */
function bugStill(bug,scale,shadow){
  const st=shadow?'filter:brightness(0);opacity:.2':'';
  if(bug.inner){ const r=PondArt.hs('midge art'), dots=[...Array(9)].map(()=>{ const a=r()*6.28, R=2+r()*6; return `<ellipse cx="${rf1(Math.cos(a)*R-.2)}" cy="${rf1(Math.sin(a)*R*.6-.9)}" rx="1.4" ry=".6" fill="#c9d6d4" opacity=".7"/><circle cx="${rf1(Math.cos(a)*R)}" cy="${rf1(Math.sin(a)*R*.6)}" r=".75" fill="#3b3a33"/>`; }).join('');
    return `<svg width="${18*scale}" height="${12*scale}" viewBox="-9 -6 18 12" style="overflow:visible;${st}">${dots}</svg>`; }
  const wing=bug.same?bug.wings:(bug.rest||bug.fly||''), art=bug.under||bug.wingsFirst?wing+bug.body:bug.body+wing;
  return `<svg width="${rf1(bug.W*scale)}" height="${rf1(bug.H*scale)}" viewBox="0 0 ${bug.W} ${bug.H}" style="overflow:visible;${st}">${art}</svg>`;
}
const bugArtScale=b=>b.inner?3.4:Math.min(5.2,58/Math.max(b.W,b.H*1.4));
function bugDate(t){ return new Date(Date.UTC(+t.slice(0,4),+t.slice(5,7)-1,+t.slice(8,10))).toLocaleDateString('en-US',{month:'short',day:'numeric',timeZone:'UTC'}); }

/* ── tweaks from the bug library (bug-tweaks.json) ──
   {version, updatedAt, bugs:{key:{speed,size,off,flag,note}}}. speed and
   size change how a bug plays; off takes it out of the daily rotation (it
   stays in the collection); flag + note are change requests from the owner
   for whoever edits this file next. */
let REED_BUG_TWEAKS={};
const bugTweak=k=>REED_BUG_TWEAKS[k]||{};
/* resolves true when the tweaks changed since last time */
function loadBugTweaks(){
  return fetch('bug-tweaks.json?'+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null)
    .then(j=>{ const b=(j&&j.bugs)||{}, changed=JSON.stringify(b)!==JSON.stringify(REED_BUG_TWEAKS); REED_BUG_TWEAKS=b; return changed; })
    .catch(()=>false);
}

/* ── the reed bed ──
   The same stand of reeds every day (its own seed); only the bug changes.
   Whatever the bug perches on sways half as far, so it doesn't slide off.
   reedBedBuild must draw from its generator in exactly this order: the
   leaves and cattails, then (in reedBedHTML) each part's sway. */
function reedBedBuild(){
  const r=PondArt.hs('reeds·bed'), parts=[], leaves=[], cats=[];
  for(let i=0;i<15;i++){
    const x=rf1(6+i*9.6+(r()-.5)*5), h=Math.round(12+r()*20), side=r()<.5?-1:1;
    const bw=2.4+r()*1.2, c=2+r()*4;
    const leaf=reedLeaf(h,bw,c,side,REED_INK[Math.floor(r()*REED_INK.length)],null); leaf.h=h;
    const q={x,h,p:leaf,lean:rf1(side*(4+r()*12))}; q.geo={x,h,side,c,lean:q.lean};
    parts.push(q); leaves.push(q.geo);
  }
  [34,88,121].forEach(x=>{ const h=Math.round(28+r()*6), c=reedCattail(h); c.h=h;
    const q={x,h,p:c,lean:rf1((r()-.5)*10),cat:true}; q.geo={x,h,lean:q.lean}; parts.push(q); cats.push(q.geo); });
  parts.sort((a,b)=>b.h-a.h);
  return {r,parts,g:bedGeo(leaves,cats)};
}
/* the bed with a given bug on it. o.hit:false leaves the bug untappable,
   o.tweak overrides the saved tweaks (the library previews with it) */
function reedBedHTML(moving,bug,t,o={}){
  const {r,parts,g}=reedBedBuild(), b=reedBugHTML(bug,g,moving,t,o);
  return `<div class="reeds-bed${moving?' sw':''}" aria-hidden="true">${parts.map(q=>{ const amp=rf1(1+r()*2);
      return reedPart(q.x,q.p,q.lean,0,g.used.has(q.geo)?rf1(amp/2):amp,rf1(3+r()*2),r); }).join('')}
    ${b}</div>`;
}
/* the flight plan a bug flies on day t: {S:[{t,x,y,r,f,fly,e}],T,M,...} */
function reedBugPlan(bug,t){ const {g}=reedBedBuild(); return bug.plan(g,PondArt.hs(t+'·'+bug.k)); }

/* what each one does, in a line: for the library, BUG-LIBRARY.md and
   anyone asked to change a bug */
const REED_BUG_DOES={
  dragonfly:'Patrols between the three cattail tips, darting out and hovering between perches.',
  damselfly:'Flits low from blade tip to blade tip and sits a long while with its wings folded.',
  honeybee:'Lands on each cattail’s pollen spike, crawls down it, then bumbles on to the next.',
  ladybug:'Lands low on a blade, walks up to the tip, and only takes off from there.',
  mayfly:'Mating dance: climbs steeply, parachutes down on still wings, over and over; rests on a stem.',
  midges:'A cloud of dots hovering over a cattail top, drifting slowly from one to the next.',
  firefly:'Weaves low among the leaves, flashing as it swoops up (a J); rests on a blade and glows.',
  skipper:'Fast skipping darts between blade tips, with short rests.',
  cranefly:'Clumsy bobbing flight; clings to the cattail stems and bounces on its legs.',
  hoverfly:'Hangs still beside the cattail heads, zips to a new spot in a blink, rests on a tip.',
  darner:'Patrols, then hovers low by a stem dipping its tail to the waterline to lay eggs.',
  jewelwing:'Perches on blade tips, flicking its black wings open and shut.',
  eyedbrown:'Slow, bouncing butterfly flight; long rests on the blade tips.',
  caddisfly:'Rests low on stems with tent-folded wings; flutters out over the water, dipping to the surface.',
  stonefly:'The nymph climbs out of the water, sheds (the skin stays on the stem), rests, then flies off.',
  reedbeetle:'Lands on blades, chews at them (a quick bob), walks higher, flies to the next.',
  lacewing:'Weak, drifting flight; settles beside the aphids on a blade.',
  cattailmoth:'Walks up the brown cattail heads one after another.',
  grasshopper:'Clings to stems and gets about in short, whirring hops.',
  ichneumon:'Lands on a cattail stem, arches its body and drills in with its ovipositor.',
  boatman:'Splashes down between the reeds, dives, pops up and rows about, flies on.',
  whirligig:'Lands on the water and spins back and forth with ripples.',
  froghopper:'Sips sap on the stems, then leaps in fast arcs; spittle foam sits on two blades.',
  paperwasp:'Flies in, scrapes fibre off a cattail stem, and leaves with a ball of pulp.',
  muddauber:'Flies in, works a ball of mud at the waterline, carries it off.',
  marshfly:'Rests head-down on stems near the water; slow, short flights.',
  robberfly:'Waits on the tallest tip, darts out to snatch a gnat, comes back to eat it.',
  longlegs:'Stands tall on blade tips and waves its wings in little flag displays.',
  gallfly:'Visits reed tips head-down to lay eggs; sits by last year’s cigar gall.',
  katydid:'Sings from the stems (sound arcs), with short flights between.',
  skimmer:'Perches on the cattail tips and a tall blade, darting out between them.',
  meadowhawk:'Perches low on the short blades, with quick sallies between them.',
  pondhawk:'Perches low, darts out to catch prey and brings it back to eat.',
  forktail:'Flutters low between blade tips.',
  spreadwing:'Clings to stems with its wings held half open.',
  copper:'Bouncing flight between blade tips.',
  metalmark:'A small, bouncing flight between blade tips.',
  mulberrywing:'Slow, low, weaving flight between the tips.',
  swallowtail:'Puddles at wet mud by the waterline, sipping.',
  reedleopard:'Rests a long while on reed stems, white with black spots.',
  wainscot:'Rests along the stems, looking like part of them.',
  chinamark:'Skims low over the water between low perches.',
  mosquito:'Rests on stems and lays an egg raft on the water.',
  shorefly:'Walks the waterline grazing, and skims between spots.',
  dronefly:'Hovers still in the air, and basks on blade tips.',
  phantomcrane:'Drifts on the breeze with its legs spread wide; clings to stems.',
  scorpionfly:'Hangs head-down under the blades, walking along them.',
  alderfly:'Lays an egg mass on a stem over the water, then rests.',
  owlfly:'Rests on cattail tips with its abdomen stuck out like a twig; hunts in the air.',
  backswimmer:'Floats belly-up at the surface, dives, flies on.',
  strider:'Skates across the water in quick glides, with ripples.',
  divingbeetle:'Lands on the water, dives, surfaces tail-up for air, dives again.',
  shieldbug:'Climbs the stems sipping sap.',
  aphid:'Lands on a blade; babies appear beside it one by one.',
  leafhopper:'Sips sap on the stems, flicking away droplets; hops between them.',
  billbug:'Chews into the stems with its snout, climbing slowly.',
  maskedbee:'Crawls into a hollow reed stub (its nest) and back out.',
  fairyfly:'Rests low on stems; dives underwater and swims with its wings.',
  treecricket:'Raises its wings to sing (sound arcs).',
  mantis:'Waits motionless on the stems, then strikes.',
  lanternwick:'Sits on the cattail heads and lights them up.',
  dewsprite:'Drinks the dew drop off three reed tips; the drops bead up again.',
  reedpiper:'Plays a reed like a flute; notes float up.',
  duskbell:'Lands on the cattail spikes and rings (sound arcs on both sides).',
  mossmantle:'Walks up the blades leaving sprouts behind it.',
  glasswing:'Nearly vanishes whenever it lands.',
  lunareed:'Sits on the cattail spikes; each spike glows like a moon.',
  fluffweaver:'Flies in, plucks cattail fluff, flies off with a tuft.',
  drizzlewing:'Hovers over the reeds while a tiny rain falls.',
  thistledown:'Drifts like fluff and settles on the cattail heads.',
  starwing:'Visits five tips, leaving a twinkle on each.',
  pebble:'Skips across the water like a stone, with rings.',
  weaver:'Hops between two tips until a silk thread ties them together.',
  bubblebeetle:'Blows bubbles at the waterline.',
  sundial:'Perches on a cattail tip, slowly turning to follow the sun.',
  mirrorback:'Perches on the blades flashing light.',
  quillwing:'Flies loop-the-loops between perches.',
  weathervane:'Sits on a cattail top, turning to face the wind.',
  knight:'Marches up and down the cattail stems, standing guard.',
  pollenpuff:'Dusts itself on each cattail spike (gold puffs) and leaves glowing gold.'};
Object.assign(REED_BUG_DOES,{
  clickbeetle:'Lands on a cattail head, rolls onto its back and lies still, then clicks and somersaults back onto its feet.',
  rubytail:'Hovers around the hollow reed stub, slips inside, comes back out and grooms on a blade tip.',
  springtail:'Springs about on the water at the foot of the reeds in tiny high hops.',
  bulrushbug:'Crawls over the brown cattail heads probing the seeds, slips round the back and comes out again.',
  azure:'A linked pair that dips low so the female touches her tail to the water by the reeds.',
  ant:'Walks in along the bank, climbs a blade to the aphids, milks a drop of honeydew and carries it home.',
  groundhopper:'Hops from a low leaf into the water, swims across and climbs out onto another.',
  raftspider:'Waits on the water by the reeds, dashes across the surface to grab prey and brings it back.',
  balloonfly:'Dances figure-eights over the water carrying a silk balloon, and waits with it on the blade tips.',
  chaser:'Darts down from a tall blade and taps its tail on the water again and again, leaving rings.',
  forkhorn:'Lowers itself on silk onto a reed tip, inches down the blade, along the bank and up the next, stops to munch, then climbs its thread back up.',
  papercrane:'Glides stiffly between the cattail tops and a tall blade on slow paper wings.',
  prismfly:'Hovers between two reeds while a little rainbow arcs from one to the other.',
  painter:'Visits four blade tips with its brush, and each one turns autumn colours.',
  nightcap:'Flutters to a cattail head and dozes in its nightcap, then moves to another and dozes again.',
  postman:'Picks up a letter at one cattail, delivers it to another, waits for the reply and brings it back.',
  sailor:'Sails across the water on a reed-leaf boat, stopping twice at the reeds.',
  hermit:'Lands low on a blade, hides in its snail shell, then peeks out and walks up the blade.',
  kitefly:'Sits on a cattail top and then a tall blade tip, flying a little kite on the breeze.',
  angler:'Sits on a low blade tip fishing; the float bobs and ripples, then it tries another tip.'});
