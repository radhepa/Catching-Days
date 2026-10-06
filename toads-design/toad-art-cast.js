/* toad-art-cast.js · Catching Days · the other four pond toads (art only)
   ─────────────────────────────────────────────────────────────────────────
   Design-phase file, written to be merged into toad-art.js after Hasu's
   build. Load it AFTER toad-art.js: it adds Ame, Sumi, Tabi and Hotaru to
   window.ToadArt.TOADS, so ToadArt.svg('ame', …) etc. just work, and it
   brings its own motion CSS (ToadArt.castCss, injected by injectCastCSS()).

   Same conventions as Hasu:
     viewBox -68 -118 136 136, ground line y = 0, toad centred on x = 0
     ids written __ID__… inside, made unique per drawing by ToadArt.svg
     moving parts are class-tagged groups, each inside a translate() so its
     pivot is its own 0,0; nothing moves unless an ancestor has .td-mv
     .td-hop on the toad's button for ~0.9 s = the tap reaction
   opts.perch for these four:
     'own'    the toad's own water perch (Ame a mossy rock, Sumi a slate
              inkstone, Tabi a stepping stone, Hotaru a small lily pad)
     'pad'    a lily pad like Hasu's, sized to the toad
     'ground' soft contact shadow (paper)          'none'  nothing
   opts.water: ripple rings round the perch.

   Shared parts below (eye, fold, wart, pads) are Hasu's, generalised: the
   eye takes a size, a lid height and a palette, so each toad keeps the same
   drawing hand with its own colours. */

/* ═══════════════════════════ shared helpers ═══════════════════════════ */
(function(){
'use strict';
const r2=n=>+n.toFixed(2);
/* a wart: a pale bump with a small shadow under it (Hasu's), tint optional */
const wart=([x,y,r],c,a)=>`<circle cx="${r2(x+r*.3)}" cy="${r2(y+r*.45)}" r="${r}" fill="${c||'#2b2420'}" opacity="${a||.2}"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity=".4"/>`;
/* a darker blotch with a pale wart in it: the classic toad pattern (Tabi) */
const blotch=([x,y,r],c)=>`<ellipse cx="${x}" cy="${y}" rx="${r2(r*1.7)}" ry="${r2(r*1.45)}" fill="${c}" opacity=".55"/>${wart([x,y,r*.75])}`;
/* One eye, drawn round 0,0 at Hasu's size and scaled: bulb, iris, a
   horizontal pupil, glint, a heavy upper lid and the fold over it.
   o.r     bulb radius (Hasu 10)
   o.lid   where the lid's edge crosses the middle of the eye, in Hasu units
           (Hasu .75; lower = wider awake, higher = sleepier, up to ~6)
   o.side  1 = viewer's right eye, -1 = left (the lid droops at the outer corner)
   P       palette: eye (gradient id for bulb + lid), iris (gradient id),
           line, fold, fold2, lidLine, ring, hi                              */
function eye(cx,cy,o,P,ID){
  const k=r2((o.r||10)/10), s=o.side, L=o.lid==null?.75:o.lid, top=-10.2;
  const ey=L-1.3, ex=r2(Math.sqrt(Math.max(1,10.25*10.25-ey*ey)));          // where the lid edge meets the bulb
  const dO=.55, lidD=`M${-ex} ${r2(ey+(s<0?dO:0))} A10.25 10.25 0 0 1 ${ex} ${r2(ey+(s>0?dO:0))} C6 ${r2(L-.2+(s>0?.2:0))} -6 ${r2(L-.2+(s<0?.2:0))} ${-ex} ${r2(ey+(s<0?dO:0))}Z`;
  const lidL=`M${r2(-ex+.55)} ${r2(ey+.35+(s<0?dO:0))} C-6 ${r2(L)} 6 ${r2(L)} ${r2(ex-.55)} ${r2(ey+.35+(s>0?dO:0))}`;
  const blink=r2(20.6/(L+10.6));                                              // scaleY that brings the lid edge to the bottom
  const gy=r2(Math.max(.35,L+.6)), R=(a,r)=>{ const t=a*Math.PI/180; return `${r2(s*r*Math.cos(t))} ${r2(-r*Math.sin(t))}`; };
  const sw=s>0?1:0, sb=s>0?0:1, arc=(a,b,r)=>`M${R(a,r)} A${r} ${r} 0 0 ${sw} ${R(b,r)}`;
  return `<g transform="translate(${cx} ${cy}) scale(${k})">
    <circle r="10" fill="url(#${ID}${P.eye})"/>
    <circle cy=".7" r="7.4" fill="url(#${ID}${P.iris})"/>
    <circle cy=".7" r="7.4" fill="none" stroke="${P.ring}" stroke-width=".5" opacity=".7"/>
    <g transform="translate(0 1.2)"><g class="td-gaze">
      <ellipse rx="4.6" ry="2.1" fill="#1f2e2c"/>
      <circle cx="2.1" cy="${r2(gy-1.2)}" r="1.15" fill="#ffffff" opacity=".9"/>
      <circle cx="-2.5" cy="1.9" r=".5" fill="#ffffff" opacity=".5"/>
    </g></g>
    <g transform="translate(0 ${top})"><g class="td-look"><g class="td-blink" style="--bk:${blink}"><g transform="translate(0 ${-top})">
      <path d="${lidD}" fill="url(#${ID}${P.eye})"/>
      <path d="M-7.4 ${r2(Math.min(-3.6,ey-2.2))} C-3 ${r2(Math.min(-2.6,ey-1.2))} 3 ${r2(Math.min(-2.6,ey-1.2))} 7.4 ${r2(Math.min(-3.6,ey-2.2))}" fill="none" stroke="${P.hi}" stroke-width=".75" stroke-linecap="round" opacity=".55"/>
      <path d="${lidL}" fill="none" stroke="${P.lidLine}" stroke-width="1.4" stroke-linecap="round"/>
    </g></g></g></g>
    <path d="${arc(178,2,10)}" fill="none" stroke="${P.line}" stroke-width=".6" stroke-linecap="round"/>
    <path d="${arc(150,30,9.75)}" fill="none" stroke="${P.fold}" stroke-width="1.3" stroke-linecap="round" opacity=".85"/>
    <path d="${arc(128,52,9.5)}" fill="none" stroke="${P.fold2}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
    <path d="${arc(145,55,8.2)}" fill="none" stroke="${P.hi}" stroke-width=".8" stroke-linecap="round" opacity=".7"/>
    <path d="M${R(200,10)} A10 10 0 0 ${sb} ${R(-20,10)}" fill="none" stroke="${P.fold}" stroke-width=".6" stroke-linecap="round" opacity=".3"/>
  </g>`;
}
/* the standard eye gradients for a palette: bulb (pearl → skin) and iris */
const eyeDefs=(ID,top,bot,iris)=>`<linearGradient id="${ID}eye" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient>
  <radialGradient id="${ID}iris" cx=".45" cy=".42" r=".6"><stop offset="0" stop-color="${iris[0]}"/><stop offset=".55" stop-color="${iris[1]}"/><stop offset="1" stop-color="${iris[2]}"/></radialGradient>`;
/* the house body gradient in user space: pearl at the top of the head,
   the toad's colour, deep #173a3b only in the last sliver at the ground */
const skinDef=(ID,id,y1,stops)=>`<linearGradient id="${ID}${id}" gradientUnits="userSpaceOnUse" x1="0" y1="${y1}" x2="0" y2="1">${stops.map(([o,c])=>`<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
/* ripple rings (opts.water) and the tap's landing rings, round any perch */
function rings(o,rx,ry,dy){
  const ring=(cls,c,op)=>`<g transform="translate(0 ${dy})"><g class="${cls}"><ellipse rx="${rx}" ry="${ry}" fill="none" stroke="${c}" stroke-width=".9" opacity="${op}"/></g></g>`;
  return (o.water?ring('td-ring','#cfe9e3',.32)+ring('td-ring two','#cfe9e3',.32):'')+ring('td-splash','#e6f5f1',0)+ring('td-splash two','#e6f5f1',0);
}
/* Hasu's lily pad, any size (w = half-width) */
function lilyPad(o,ID,w){
  const k=r2(w/62), pad='M0 3.5 L30.4 13.5 A62 11.5 0 1 0 12.6 14.75 Z';
  const veins=[200,225,250,275,300,325,350,15,40,140,165].map(a=>{ const t=a*Math.PI/180; return `M0 3.5 L${r2(57*Math.cos(t))} ${r2(3.5+10.6*Math.sin(t))}`; }).join(' ');
  return `${rings(o,r2(w*1.13),r2(13*k+1),r2(6*k))}
    <defs><linearGradient id="${ID}pad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8db58a"/><stop offset=".55" stop-color="#6f9e7a"/><stop offset="1" stop-color="#5a8d69"/></linearGradient></defs>
    <g transform="scale(${k} ${r2(Math.max(k,.75))})"><path d="${pad}" transform="translate(0 1.7)" fill="#3a6a51"/><path d="${pad}" fill="url(#${ID}pad)"/>
    <path d="${veins}" stroke="#a9c795" stroke-width=".5" opacity=".45" fill="none"/>
    <path d="M-61.4 2.2 C-50 -6 50 -6 61.4 2.2" fill="none" stroke="#b9d29f" stroke-width=".7" opacity=".7"/></g>`;
}
const ground=w=>`<ellipse cx="0" cy=".8" rx="${w}" ry="4.6" fill="#1f2e2c" opacity=".16"/><ellipse cx="0" cy=".5" rx="${r2(w*.72)}" ry="2.6" fill="#1f2e2c" opacity=".14"/>`;
/* contact shadow of a toad on whatever it sits on */
const contact=w=>`<ellipse cx="0" cy="1.4" rx="${w}" ry="4.2" fill="#173a3b" opacity=".3"/><ellipse cx="0" cy=".9" rx="${r2(w*.72)}" ry="2.3" fill="#173a3b" opacity=".2"/>`;
window.ToadCast={r2,wart,blotch,eye,eyeDefs,skinDef,rings,lilyPad,ground,contact};
})();

/* ═════════════════════════ Ame · Keeper of the Rain ═════════════════════════
   Home: the Focus water, in the session's rain. A wide, low, slate-blue
   boulder of a toad under a straw kasa hat and a straw mino rain cape, eyes
   in the shade of the brim, sitting on a mossy rock. Rain drips off the brim.
   Hover: he tips the hat back to look at you. Tap: a shake, like a wet dog,
   and the water flies off the brim. */
(function(){
'use strict';
const H=window.ToadCast, r2=H.r2;
const BODY='M0 0 C18 .6 38 -.4 46 -7 C52 -12 52.4 -20 48.4 -26 C46.2 -30 45.6 -34 44.6 -38 C43 -45 36 -50 26 -51.5 C14 -53 -14 -53 -26 -51.5 C-36 -50 -43 -45 -44.6 -38 C-45.6 -34 -46.2 -30 -48.4 -26 C-52.4 -20 -52 -12 -46 -7 C-38 -.4 -18 .6 0 0Z';
const ARM='M38.2 -12.8 C40.6 -14.8 45.6 -14.6 48 -12.4 C48.8 -9 48.2 -5 47.6 -2.2 L38.6 -2.2 C38.4 -5.6 37.8 -9.4 38.2 -12.8Z';
const mir=d=>d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g,(m,x,y)=>`${r2(-x)} ${y}`);
/* the kasa: a shallow cone, sides a touch concave, the front of the brim
   dipping toward us; its underside shows as a thin dark band */
const HAT_TOP='M-65 -51.6 Q-33 -64 -5.5 -86.6 Q0 -90 5.5 -86.6 Q33 -64 65 -51.6 C42 -45.4 -42 -45.4 -65 -51.6Z';
const HAT_UNDER='M-65 -51.6 C-42 -45.4 42 -45.4 65 -51.6 C42 -47.8 -42 -47.8 -65 -51.6Z';
/* the mino: straw hanging from under the hat over the shoulders and back */
const CAPE_BACK='M-36 -30 C-48 -27 -58 -18 -64.6 -4 L-60 -2.2 L-55.6 -4 L-51 -1.8 L51 -1.8 L55.6 -4 L60 -2.2 L64.6 -4 C58 -18 48 -27 36 -30Z';
const FLAP='M29.6 -24 C38 -25.6 46 -24 51 -19.6 C55.4 -15.4 58.4 -9.6 60 -3.2 L57 -1.6 L54 -3.6 L50.6 -1.2 L47.4 -3.4 L44 -1.2 L40.8 -3.2 L37.6 -1.4 L34.6 -3.2 L31.6 -1.6 C32 -6.6 32 -11.6 31 -16 C30.6 -19 29.6 -21.6 29.6 -24Z';
const WARTS=[[-34,-38,1.2],[-38.6,-31,1],[33.4,-37.4,1.1],[38.6,-30.6,1],[-28,-20,1.2],[-22,-13,1],[27,-19.6,1.1],[22.6,-12,.9],
  [-12,-34.6,.7],[12.4,-34.4,.7],[-30,-9,.9],[30.4,-8.6,.9],[0,-12,.7]];
const SPOTS=[[-36,-26,2.6],[35,-24,2.2],[-18,-7,2],[16,-6,2.4],[-26,-36,1.8],[27,-35,1.6]];
const drop=`<path d="M0 -2.6 C1.3 -.7 1.7 .5 1.7 1.2 A1.7 1.7 0 0 1 -1.7 1.2 C-1.7 .5 -1.3 -.7 0 -2.6Z" fill="#dff1ee" opacity=".9"/><circle cx="-.5" cy=".6" r=".45" fill="#ffffff"/>`;
function rock(o,ID){
  return `${H.rings(o,74,12,8)}
    <defs><linearGradient id="${ID}rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93a39b"/><stop offset=".45" stop-color="#6c7d77"/><stop offset="1" stop-color="#3f4f4c"/></linearGradient></defs>
    <path d="M-64 3 C-64 -3.6 -52 -6.4 -31 -6 C-10 -5.6 20 -7 45 -5.6 C59 -4.6 65.6 -1.2 64.6 4 C63.4 10 47 13.6 20 14 C-6 14.4 -41 13.4 -55 10.4 C-62 8.6 -64 6 -64 3Z" fill="url(#${ID}rock)" stroke="#33413f" stroke-width=".5"/>
    <path d="M-60 -.6 C-46 -4.6 -16 -4 10 -4.6 C30 -5 50 -4.6 61 -1.2" fill="none" stroke="#b7c6bd" stroke-width=".8" opacity=".55"/>
    <path d="M-62 1.6 C-58 -3.4 -46 -5.2 -38 -4.4 C-40 -1.6 -46 1.2 -54 2.4 C-58 3 -61 2.8 -62 1.6Z M50 -4.8 C56 -4.2 61.6 -2.6 63.6 .4 C59 1 54.4 .2 50.6 -1.4 C48.8 -2.2 48.6 -3.8 50 -4.8Z" fill="#7fa878" opacity=".9"/>
    <path d="M-20 -5.2 C-14 -6.6 -6 -6.4 -2 -5.2 C-6 -4 -14 -3.8 -20 -5.2Z M22 -6 C28 -7 34 -6.8 38 -5.6 C33 -4.6 27 -4.6 22 -6Z" fill="#8fb882" opacity=".8"/>
    <g fill="#2b3836" opacity=".35"><circle cx="-30" cy="6" r=".8"/><circle cx="-12" cy="9" r=".6"/><circle cx="14" cy="7.4" r=".9"/><circle cx="36" cy="8.6" r=".6"/><circle cx="-44" cy="7.6" r=".7"/></g>
    ${H.contact(52)}`;
}
function art(o,ID){
  const P={eye:'eye',iris:'iris',line:'#4a6268',fold:'#4f6a70',fold2:'#3f585d',lidLine:'#1f2e33',ring:'#6b3f1f',hi:'#eef6f4'};
  const strands=(x0,x1,y0,y1,n,lean)=>Array.from({length:n},(_,i)=>{ const t=i/(n-1), x=x0+(x1-x0)*t;
    return `M${r2(x)} ${y0} Q${r2(x+lean*.4)} ${r2((y0+y1)/2)} ${r2(x+lean)} ${r2(y1+(i%3)*.9)}`; }).join(' ');
  const weave=[-74,-60,-46,-32,-18,-6,6,18,32,46,60,74].map(a=>{ const t=a*Math.PI/180;
    return `M${r2(Math.sin(t)*4)} ${r2(-88+Math.abs(Math.sin(t))*1.2)} L${r2(Math.sin(t)*64)} ${r2(-49+Math.abs(Math.sin(t))*-2.4)}`; }).join(' ');
  return `<defs>
    ${H.skinDef(ID,'skin',-58,[[0,'#eef4f3'],[.24,'#a9c1c1'],[.7,'#728f95'],[.93,'#5d7b81'],[1,'#173a3b']])}
    ${H.eyeDefs(ID,'#d7e5e2','#7f9da2',['#f4c98c','#d08a48','#8a5228'])}
    <linearGradient id="${ID}straw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e3c98f"/><stop offset=".5" stop-color="#cfae68"/><stop offset="1" stop-color="#a8853f"/></linearGradient>
    <linearGradient id="${ID}cape" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8975a"/><stop offset="1" stop-color="#8e7034"/></linearGradient>
    <radialGradient id="${ID}throat" cx=".5" cy=".35" r=".6"><stop offset="0" stop-color="#eef6f3"/><stop offset="1" stop-color="#b9cfcb"/></radialGradient>
    <clipPath id="${ID}bc"><path d="${BODY}"/></clipPath>
    <clipPath id="${ID}cb"><path d="${CAPE_BACK}"/></clipPath>
    <clipPath id="${ID}fl"><path d="${FLAP} ${mir(FLAP)}"/></clipPath>
  </defs>
  <g class="td-cast">
  ${o.perch==='own'?rock(o,ID):o.perch==='pad'?H.lilyPad(o,ID,64)+H.contact(52):o.perch==='ground'?H.ground(56):''}
  <g class="td-body"><g class="td-breathe">
    <!-- the cape, behind him: it shows round his sides like a straw haystack -->
    <path d="${CAPE_BACK}" fill="url(#${ID}cape)" stroke="#6e5526" stroke-width=".5"/>
    <g clip-path="url(#${ID}cb)"><path d="${strands(-64,-36,-30,-2,11,-2.6)} ${strands(36,64,-30,-2,11,2.6)}" fill="none" stroke="#e0c48a" stroke-width=".55" opacity=".6"/></g>
    <!-- the body: wide and low, more boulder than dumpling -->
    <path d="${BODY}" fill="url(#${ID}skin)" stroke="#4a6268" stroke-width=".6"/>
    <g clip-path="url(#${ID}bc)">
      <ellipse cx="0" cy="-13" rx="25" ry="13" fill="#dcebe7" opacity=".55"/>
      ${SPOTS.map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="${r2(r*1.4)}" ry="${r}" fill="#3e5a61" opacity=".35"/>`).join('')}
      ${WARTS.map(w=>H.wart(w,'#1f3338',.25)).join('')}
      <ellipse cx="0" cy="-2.2" rx="36" ry="3.6" fill="#173a3b" opacity=".14"/>
      <ellipse cx="0" cy="-47" rx="40" ry="6.4" fill="#173a3b" opacity=".22"/>
    </g>
    ${H.eye(-19,-40.6,{r:8.2,lid:2.4,side:-1},P,ID)}
    ${H.eye(19,-40.6,{r:8.2,lid:2.4,side:1},P,ID)}
    <ellipse cx="0" cy="-48.6" rx="34" ry="3.2" fill="#173a3b" opacity=".16"/>
    <ellipse cx="-4.6" cy="-31.6" rx="1" ry=".7" fill="#1f2e33" opacity=".55"/><ellipse cx="4.6" cy="-31.6" rx="1" ry=".7" fill="#1f2e33" opacity=".55"/>
    <path d="M-36 -26.4 C-24 -24.8 -11 -24.6 0 -24.8 C11 -24.6 24 -24.8 36 -26.4" fill="none" stroke="#eef6f4" stroke-width=".8" stroke-linecap="round" opacity=".45" transform="translate(0 -1.3)"/>
    <path d="M-36 -26.4 C-24 -24.8 -11 -24.6 0 -24.8 C11 -24.6 24 -24.8 36 -26.4" fill="none" stroke="#1f2e33" stroke-width="1.45" stroke-linecap="round" opacity=".8"/>
    <path d="M-36 -26.4 C-37.6 -26 -38.2 -24.8 -37.8 -23.4 M36 -26.4 C37.6 -26 38.2 -24.8 37.8 -23.4" fill="none" stroke="#1f2e33" stroke-width="1.15" stroke-linecap="round" opacity=".7"/>
    <g transform="translate(0 -23.6)"><g class="td-throat"><g transform="translate(0 23.6)">
      <ellipse cx="0" cy="-18.6" rx="15" ry="5" fill="url(#${ID}throat)"/><ellipse cx="-4" cy="-20" rx="4.6" ry="1.2" fill="#ffffff" opacity=".35"/>
    </g></g></g>
    <!-- the cape's front flaps over his shoulders, over the tops of the arms -->
    <path d="${FLAP}" fill="url(#${ID}straw)" stroke="#7a5f2c" stroke-width=".5"/>
    <path d="${mir(FLAP)}" fill="url(#${ID}straw)" stroke="#7a5f2c" stroke-width=".5"/>
    <g clip-path="url(#${ID}fl)"><path d="${strands(31,59,-24,-2,11,2.6)} ${strands(-31,-59,-24,-2,11,-2.6)}" fill="none" stroke="#8e7034" stroke-width=".55" opacity=".6"/>
    <path d="${strands(33,57,-23,-4,7,2)} ${strands(-33,-57,-23,-4,7,-2)}" fill="none" stroke="#f0dcab" stroke-width=".45" opacity=".6"/>
    <path d="M30 -22.4 C38.6 -24.2 46.4 -22.8 51.2 -18.8 M-30 -22.4 C-38.6 -24.2 -46.4 -22.8 -51.2 -18.8" fill="none" stroke="#f6e6bd" stroke-width="1.1" opacity=".55"/></g>
    <!-- forearms, coming out through the front of the cape -->
    <path d="${ARM} ${mir(ARM)}" fill="#86a2a6" stroke="#4a6268" stroke-width=".55"/>
    <path d="M40.4 -11.6 C42.4 -12.6 45 -12.4 46.4 -11.2 M-40.4 -11.6 C-42.4 -12.6 -45 -12.4 -46.4 -11.2" fill="none" stroke="#c9dad8" stroke-width=".9" stroke-linecap="round" opacity=".7"/>
    ${[1,-1].map(s=>`<ellipse cx="${43*s}" cy="-1.9" rx="6.4" ry="2.8" fill="#7d989d" stroke="#4a6268" stroke-width=".5"/>
      <g stroke-linecap="round"><path d="M${42.6*s} -2 L${33.6*s} .5 M${42.8*s} -1.8 L${38.6*s} 1.7 M${43.4*s} -1.8 L${46.6*s} 1.8 M${43.8*s} -2 L${52.4*s} .4" stroke="#4a6268" stroke-width="4.1"/>
      <path d="M${42.6*s} -2 L${33.6*s} .5 M${42.8*s} -1.8 L${38.6*s} 1.7 M${43.4*s} -1.8 L${46.6*s} 1.8 M${43.8*s} -2 L${52.4*s} .4" stroke="#89a4a8" stroke-width="3.2"/></g>
      <g fill="#b9cfcd" stroke="#4a6268" stroke-width=".4"><circle cx="${33.4*s}" cy=".6" r="1.9"/><circle cx="${38.5*s}" cy="1.8" r="1.9"/><circle cx="${46.7*s}" cy="1.9" r="1.9"/><circle cx="${52.6*s}" cy=".5" r="1.9"/></g>`).join('')}
    <!-- the straw closing over the top of each forearm, like a sleeve -->
    <path d="M36.4 -15.6 C40.6 -17.4 46.4 -17.2 49.6 -15 L48.6 -12.2 L47 -13.4 L45.4 -11.6 L43.8 -13.2 L42.2 -11.6 L40.6 -13.2 L39 -11.8 L37.6 -13.4 Z M-36.4 -15.6 C-40.6 -17.4 -46.4 -17.2 -49.6 -15 L-48.6 -12.2 L-47 -13.4 L-45.4 -11.6 L-43.8 -13.2 L-42.2 -11.6 L-40.6 -13.2 L-39 -11.8 L-37.6 -13.4 Z" fill="#c4a25f" stroke="#7a5f2c" stroke-width=".45"/>
    <!-- the chin cord, from the brim round his face to a knot under the chin -->
    <path d="M-37 -48 C-41.6 -40 -40 -29.6 -29 -22.6 C-19 -17.6 -7 -16.6 0 -17 C7 -16.6 19 -17.6 29 -22.6 C40 -29.6 41.6 -40 37 -48" fill="none" stroke="#6e5526" stroke-width=".8" stroke-linecap="round" opacity=".75"/>
    <circle cx="0" cy="-17" r="1.5" fill="#5a4630"/><path d="M-.4 -16 L-1.4 -12.4 M.4 -16 L1.2 -12.6" stroke="#5a4630" stroke-width=".8" stroke-linecap="round"/>
    <!-- the hat: tips back on hover, wobbles on a tap -->
    <g transform="translate(0 -50)"><g class="td-hat"><g transform="translate(0 50)">
      <path d="${HAT_TOP}" fill="url(#${ID}straw)" stroke="#7a5f2c" stroke-width=".7"/>
      <path d="${weave}" fill="none" stroke="#8e7034" stroke-width=".5" opacity=".45"/>
      <path d="M-50 -56.6 Q-25 -51.4 0 -51.2 Q25 -51.4 50 -56.6 M-34 -63.4 Q-17 -59.6 0 -59.4 Q17 -59.6 34 -63.4 M-19 -71.8 Q-9.5 -69.6 0 -69.4 Q9.5 -69.6 19 -71.8" fill="none" stroke="#8e7034" stroke-width=".6" opacity=".5"/>
      <path d="M-58 -54.4 Q-30 -64.6 -6 -84.4" fill="none" stroke="#f6e6bd" stroke-width="1" stroke-linecap="round" opacity=".55"/>
      <path d="${HAT_UNDER}" fill="#6e5526"/>
      <ellipse cx="0" cy="-88.4" rx="3.4" ry="2.2" fill="#8e7034" stroke="#6e5526" stroke-width=".5"/>
      <!-- rain gathering on the brim and dropping off -->
      ${[[-57,-50.2,'d1'],[-38,-47.6,'d2'],[48,-48.6,'d3']].map(([x,y,c])=>`<g transform="translate(${x} ${y})"><g class="td-drip ${c}">${drop}</g></g>`).join('')}
    </g></g></g>
    <!-- the water a shake throws off (only seen during the tap) -->
    ${[[-62,-52,'f1'],[-40,-48,'f2'],[40,-48,'f3'],[62,-52,'f4']].map(([x,y,c])=>`<g transform="translate(${x} ${y})"><g class="td-fling ${c}">${drop}</g></g>`).join('')}
  </g></g>
  </g>`;
}
window.ToadArt.TOADS.ame ||= {name:'Ame',title:'Keeper of the Rain',art};
})();

/* ═════════════════════════ the cast's motion ═════════════════════════
   Adds to ToadArt.css (Hasu's), which already supplies breathing, the
   throat, blink, gaze, the hover look-up, ripple rings and the tap's
   landing rings for every toad. Rules here are scoped by toad
   (.td-ame …) so each keeps its own tap reaction. */
(function(){
'use strict';
const CAST_CSS=`
.td-cast .td-hat,.td-cast .td-drip,.td-cast .td-fling,.td-cast .td-brush,.td-cast .td-specs,.td-cast .td-ink,
.td-cast .td-snail,.td-cast .td-horns,.td-cast .td-gourd,.td-cast .td-nod,.td-cast .td-fly,.td-cast .td-glow,
.td-cast .td-jar,.td-cast .td-out,.td-cast .td-shell{transform-box:view-box;transform-origin:0 0}
/* each eye knows how far its lid has to travel to close (--bk) */
.td-mv .td-cast .td-blink{animation-name:td-blinkv}
@keyframes td-blinkv{0%,91%,96%,100%{transform:scaleY(1)}93%,94%{transform:scaleY(var(--bk,1.92))}}

/* ── Ame: rain off the brim; hover tips the hat; a tap is a wet-dog shake ── */
.td-ame .td-fling{opacity:0}
.td-ame .td-hat{transition:transform .45s cubic-bezier(.3,1.4,.5,1)}
:hover>.td-ame .td-hat,:focus-visible>.td-ame .td-hat{transform:translateY(-3px) rotate(-6deg)}
.td-mv .td-ame .td-drip{animation:td-drip 3.4s ease-in infinite}
.td-mv .td-ame .td-drip.d2{animation-duration:4.1s;animation-delay:-1.3s}
.td-mv .td-ame .td-drip.d3{animation-duration:3.7s;animation-delay:-2.6s}
@keyframes td-drip{0%{transform:scale(.2);opacity:0}25%{transform:scale(1);opacity:.95}55%{transform:translateY(0) scale(1);opacity:.95}
  80%{transform:translateY(16px) scale(.9,1.1);opacity:.85}88%,100%{transform:translateY(22px) scale(.8);opacity:0}}
.td-mv.td-hop .td-ame .td-body{animation:td-shake .9s ease-in-out}
.td-mv.td-hop .td-ame .td-hat{animation:td-hatwob .9s ease-in-out}
.td-mv.td-hop .td-ame .td-throat{animation:td-throat 2.3s ease-in-out infinite}
.td-mv.td-hop .td-ame .td-fling{animation:td-fling .8s ease-out .12s both}
.td-ame .td-fling.f1{--dx:-15px}.td-ame .td-fling.f2{--dx:-8px}.td-ame .td-fling.f3{--dx:8px}.td-ame .td-fling.f4{--dx:15px}
@keyframes td-shake{0%,100%{transform:none}12%{transform:rotate(-3.5deg)}26%{transform:rotate(3.5deg)}40%{transform:rotate(-3deg)}
  54%{transform:rotate(2.4deg)}68%{transform:rotate(-1.4deg)}82%{transform:rotate(.6deg)}}
@keyframes td-hatwob{0%,100%{transform:none}15%{transform:rotate(6deg) translateY(-2px)}30%{transform:rotate(-6deg) translateY(-3px)}
  45%{transform:rotate(4deg)}62%{transform:rotate(-2deg)}}
@keyframes td-fling{0%{transform:translate(0,0);opacity:0}15%{opacity:1}50%{transform:translate(var(--dx),-7px)}100%{transform:translate(calc(var(--dx) * 1.7),16px);opacity:0}}

/* ── Sumi: the brush sways, light crosses his spectacles; a tap is a bow and a flourish ── */
.td-sumi .td-ink{opacity:0}
.td-mv .td-sumi .td-brush{animation:td-brushsway 6.8s ease-in-out infinite}
.td-mv .td-sumi .td-specs{animation:td-specs 6.5s ease-in-out infinite}
@keyframes td-brushsway{0%,100%{transform:rotate(-1.2deg)}50%{transform:rotate(1.4deg)}}
@keyframes td-specs{0%,70%,100%{transform:translateX(0);opacity:.5}78%{transform:translateX(3px);opacity:1}86%{transform:translateX(-1px);opacity:.5}}
.td-mv.td-hop .td-sumi .td-body{animation:td-bow 1s cubic-bezier(.4,0,.3,1)}
.td-mv.td-hop .td-sumi .td-brush{animation:td-flourish 1s ease-in-out}
.td-mv.td-hop .td-sumi .td-ink{animation:td-inkflick .9s ease-out .3s both}
.td-mv.td-hop .td-sumi .td-throat{animation:td-throat 2.3s ease-in-out infinite}
@keyframes td-bow{0%,100%{transform:none}30%,52%{transform:translateY(2.5px) scale(1.03,.9)}75%{transform:translateY(-1px) scale(.99,1.02)}}
@keyframes td-flourish{0%,100%{transform:none}35%{transform:rotate(-9deg)}60%{transform:rotate(5deg)}80%{transform:rotate(-2deg)}}
@keyframes td-inkflick{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:1}60%{transform:translate(7px,-6px) scale(1)}100%{transform:translate(12px,8px) scale(.7);opacity:0}}

/* ── Tabi: Dango's eyestalks wave, the gourd swings; a tap is two quick steps and Dango hides ── */
.td-mv .td-tabi .td-horns{animation:td-horns 2.8s ease-in-out infinite}
.td-mv .td-tabi .td-gourd{animation:td-gourd 4.4s ease-in-out infinite}
.td-mv .td-tabi .td-snail{animation:td-creep 9s ease-in-out infinite}
@keyframes td-horns{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(7deg)}}
@keyframes td-gourd{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
@keyframes td-creep{0%,100%{transform:translateX(0)}50%{transform:translateX(1.8px)}}
.td-mv.td-hop .td-tabi .td-body{animation:td-steps .9s ease-in-out}
.td-mv.td-hop .td-tabi .td-out{animation:td-tuck 1.7s ease-in-out}
@keyframes td-steps{0%,100%{transform:none}15%{transform:translateY(-5px) rotate(-3deg)}30%{transform:none}50%{transform:translateY(-5px) rotate(3deg)}65%{transform:none}80%{transform:scale(1.03,.97)}}
@keyframes td-tuck{0%,100%{transform:scale(1);opacity:1}14%,72%{transform:scale(0);opacity:0}}

/* ── Hotaru: dozes and catches himself, fireflies drift; a tap wakes him with a start ── */
.td-hotaru .td-out{opacity:0}
.td-mv .td-hotaru .td-nod{animation:td-nod 8.5s ease-in-out infinite}
.td-mv .td-hotaru .td-glow{animation:td-glow 3.4s ease-in-out infinite}
.td-mv .td-hotaru .td-fly.f1{animation:td-fly1 3.2s ease-in-out infinite}
.td-mv .td-hotaru .td-fly.f2{animation:td-fly2 4.1s ease-in-out infinite}
.td-mv .td-hotaru .td-fly.f3{animation:td-fly3 3.6s ease-in-out infinite}
:hover>.td-hotaru .td-look,:focus-visible>.td-hotaru .td-look{transform:scaleY(.55)}
@keyframes td-nod{0%,40%{transform:translateY(0)}72%{transform:translateY(1.8px)}76%{transform:translateY(-.8px)}82%,100%{transform:translateY(0)}}
@keyframes td-glow{0%,100%{transform:scale(.92);opacity:.8}50%{transform:scale(1.06);opacity:1}}
@keyframes td-fly1{0%,100%{transform:translate(0,0);opacity:.6}33%{transform:translate(2.6px,-3px);opacity:1}66%{transform:translate(-1.4px,-1px);opacity:.8}}
@keyframes td-fly2{0%,100%{transform:translate(0,0);opacity:1}40%{transform:translate(-3px,2.4px);opacity:.55}70%{transform:translate(1px,4px);opacity:.9}}
@keyframes td-fly3{0%,100%{transform:translate(0,0);opacity:.8}50%{transform:translate(2px,-4px);opacity:1}}
.td-mv.td-hop .td-hotaru .td-body{animation:td-startle .8s cubic-bezier(.3,.7,.4,1)}
.td-hop .td-hotaru .td-look{transform:scaleY(.3);transition-duration:.12s}
.td-mv.td-hop .td-hotaru .td-out{animation:td-burst 1.4s ease-out both}
.td-mv.td-hop .td-hotaru .td-jar{animation:td-jar .6s ease-in-out}
.td-mv.td-hop .td-hotaru .td-glow{animation:td-glowup 1s ease-out}
.td-hotaru .td-out.o1{--bx:-10px;--by:-12px}.td-hotaru .td-out.o2{--bx:2px;--by:-18px}.td-hotaru .td-out.o3{--bx:11px;--by:-10px}
@keyframes td-startle{0%{transform:none}18%{transform:translateY(-7px) scale(.96,1.06)}45%{transform:translateY(0) scale(1.05,.94)}65%{transform:scale(.99,1.01)}100%{transform:none}}
@keyframes td-burst{0%{transform:translate(0,6px) scale(.4);opacity:0}15%{opacity:1}60%{transform:translate(var(--bx),var(--by)) scale(1);opacity:1}100%{transform:translate(calc(var(--bx) * 1.3),calc(var(--by) * 1.4));opacity:0}}
@keyframes td-jar{0%,100%{transform:none}25%{transform:rotate(-8deg)}50%{transform:rotate(6deg)}75%{transform:rotate(-3deg)}}
@keyframes td-glowup{0%{transform:scale(1)}30%{transform:scale(1.35)}100%{transform:scale(1)}}

`;
window.ToadArt.castCss=CAST_CSS;
window.ToadArt.injectCastCSS=function(){
  if(document.getElementById('td-cast-css')) return;
  const s=document.createElement('style'); s.id='td-cast-css'; s.textContent=CAST_CSS; document.head.appendChild(s);
};
})();

/* ═════════════════════════ Sumi · Keeper of the Ink ═════════════════════════
   Home: the Journal calendar's water. Redesigned 2026-10-01 (the first Sumi read
   as too geeky; the owner picked option B, "the stone guardian", from
   toad-art-sumi.js). A temple guardian: the widest, heaviest stance of the
   cast, warm granite skin with dragged-ink strokes down both flanks, a thick
   white shrine rope with a paper tag carrying his vermilion seal, the big brush
   tucked through the rope at his side like a sword, heavy flat brows and a
   steady amber stare. Sits on a slate inkstone. Tap: a slow, polite bow.
   Talk-box face crop (like Hasu's .tdz-face): viewBox '-44 -86 88 88'. */
(function(){
'use strict';
const H=window.ToadCast, r2=H.r2;
const mir=d=>d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g,(m,x,y)=>`${r2(-x)} ${y}`);
/* the same slate inkstone as the first Sumi, a touch wider for a heavier toad */
function inkstone(o,ID){
  return `${H.rings(o,70,12,8)}
    <defs><linearGradient id="${ID}slate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a6668"/><stop offset="1" stop-color="#3a4446"/></linearGradient></defs>
    <path d="M-56 -1 C-56 -3.6 -53 -5 -48 -5 L48 -5 C53 -5 56 -3.6 56 -1 L58 6.4 C58 8.4 55.6 9.6 52 9.6 L-52 9.6 C-55.6 9.6 -58 8.4 -58 6.4Z" fill="url(#${ID}slate)" stroke="#2a3234" stroke-width=".5"/>
    <path d="M-58 6.4 C-58 8.4 -55.6 9.6 -52 9.6 L52 9.6 C55.6 9.6 58 8.4 58 6.4 L58 9.4 C58 11.6 55.6 12.8 52 12.8 L-52 12.8 C-55.6 12.8 -58 11.6 -58 9.4Z" fill="#2c3537"/>
    <path d="M-53 -3.6 L53 -3.6" stroke="#8a989a" stroke-width=".7" opacity=".6"/>
    <path d="M18 5.4 C18 3.6 24 2.6 34 2.6 C44 2.6 50 3.6 50 5.4 C50 7.2 44 8.2 34 8.2 C24 8.2 18 7.2 18 5.4Z" fill="#11181c"/>
    <path d="M24 4.4 C28 3.8 34 3.7 40 4" stroke="#6f7a85" stroke-width=".6" opacity=".7" fill="none"/>
    ${H.contact(48)}`;
}
const perchFor=(o,ID,w)=>o.perch==='own'?inkstone(o,ID):o.perch==='pad'?H.lilyPad(o,ID,62)+H.contact(48):o.perch==='ground'?H.ground(w):'';
/* a vermilion seal, drawn round 0,0: a square stamp with a pale, abstract
   mark in it (an ensō and a dot: deliberately not a real character) */
const seal=(x,y,s,rot)=>`<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
  <rect x="-4.6" y="-4.6" width="9.2" height="9.2" rx=".9" fill="#c8452f" opacity=".95"/>
  <rect x="-3.6" y="-3.6" width="7.2" height="7.2" rx=".5" fill="none" stroke="#f7d9c8" stroke-width=".6" opacity=".9"/>
  <g transform="rotate(-24)" fill="#f7d9c8" opacity=".95"><path d="M-2.6 0 C-1.6 -1.5 1 -1.6 2.2 -.4 C2.6 0 2.6 .3 2.2 .6 C1 1.7 -1.6 1.5 -2.6 0Z"/><path d="M-2.2 0 L-3.8 -1.4 L-3.4 0 L-3.8 1.4Z"/></g>
  <circle cx="1.5" cy="-.9" r=".3" fill="#c8452f"/>
  <path d="M-4.6 2.6 L-3 4.6 M3.4 -4.6 L4.6 -3.2" stroke="#e8a28c" stroke-width=".5" opacity=".6"/></g>`;
/* the brush: bamboo handle with nodes, dark ferrule, hair tuft, between two points */
function brush(ID,x1,y1,x2,y2,headLen){
  const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy), ux=dx/L, uy=dy/L, nx=-uy, ny=ux;
  const P=(t,o)=>`${r2(x1+ux*t+nx*o)} ${r2(y1+uy*t+ny*o)}`;
  const nodes=[.2,.42,.64].map(f=>`M${P(L*f,-2.1)} L${P(L*f,2.1)}`).join(' ');
  const h=headLen, e=L;            /* the hair starts at the end point and runs on */
  return `<path d="M${P(0,0)} L${P(e,0)}" stroke="#6b4f26" stroke-width="4.6" stroke-linecap="round"/>
    <path d="M${P(0,0)} L${P(e,0)}" stroke="url(#${ID}bam)" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M${P(1,-1)} L${P(e-1,-1)}" stroke="#f6e6bd" stroke-width=".7" opacity=".6"/>
    <path d="${nodes}" stroke="#8a6a34" stroke-width="1.1" stroke-linecap="round"/>
    <path d="M${P(e-1,-2.6)} L${P(e+5,-2.8)} L${P(e+5,2.8)} L${P(e-1,2.6)}Z" fill="#1f2328" stroke="#0b0f12" stroke-width=".4"/>
    <path d="M${P(e+5,-2.8)} C${P(e+5+h*.3,-4.4)} ${P(e+5+h*.7,-3)} ${P(e+5+h,0)} C${P(e+5+h*.7,3)} ${P(e+5+h*.3,4.4)} ${P(e+5,2.8)}Z" fill="url(#${ID}hair)" stroke="#11181c" stroke-width=".4"/>
    <path d="M${P(e+6,-1.2)} C${P(e+5+h*.4,-2)} ${P(e+5+h*.7,-1.2)} ${P(e+5+h*.9,-.3)}" fill="none" stroke="#ffffff" stroke-width=".5" opacity=".45"/>`;
}

const B_BODY='M0 0 C18 .6 38 -.4 45 -7.6 C51 -14 50.6 -22.6 46.4 -28.6 C49.6 -33.6 51.2 -40.6 50 -46.6 C48.6 -53.6 42 -57.6 33 -58.8 C22 -60.2 -22 -60.2 -33 -58.8 C-42 -57.6 -48.6 -53.6 -50 -46.6 C-51.2 -40.6 -49.6 -33.6 -46.4 -28.6 C-50.6 -22.6 -51 -14 -45 -7.6 C-38 -.4 -18 .6 0 0Z';
const B_ARM='M39 -30 C47.6 -29.6 54.6 -23.4 55.6 -15 C56.4 -9 54.4 -4.6 52.8 -2.2 L43.4 -2.2 C44 -7 43 -12 40.4 -16.4 C38.4 -19.8 36.8 -23.4 36.6 -26.6Z';
/* the dragged stroke: from the crown, over the left side of the head, down the shoulder, ending dry */
/* dragged-ink strokes down each flank, from behind the gland to the haunch,
   ending in dry-brush streaks (drawn for the viewer's left; mirrored) */
const STROKES=['M-36.6 -47.6 C-40 -49.4 -44.4 -47.4 -45.6 -43 C-47.6 -36 -47.8 -26 -45.2 -16.4 C-44 -24 -41.8 -31.6 -38.4 -38 C-36.8 -41 -35 -44.6 -36.6 -47.6Z',
  'M-31 -34.6 C-33.6 -35.6 -36.6 -34 -37.6 -30.6 C-39.4 -24.6 -39.6 -16 -37.6 -7.4 C-36.6 -14 -35 -20.6 -32.6 -26 C-31.4 -28.8 -29.6 -32 -31 -34.6Z'];
const DRY=['M-46 -18.6 L-47.6 -13.6','M-44.8 -17.6 L-45.8 -12.4','M-38.6 -8.6 L-39.4 -4.4','M-37.6 -8 L-37.8 -3.8'];
function artB(o,ID){
  const P={eye:'eye',iris:'iris',line:'#4a3f36',fold:'#5a4d42',fold2:'#3f342b',lidLine:'#1c1612',ring:'#5a3008',hi:'#f4ede2'};
  const grit=[[-20,-44,.5],[-8,-50,.4],[14,-46,.5],[26,-40,.4],[-30,-30,.5],[30,-26,.45],[-14,-20,.4],[18,-14,.5],[6,-30,.35],[-36,-12,.4],[38,-10,.45]]
    .map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#2c2520" opacity=".45"/>`).join('');
  /* the shrine rope: two twisted strands */
  const RY=t=>-15.6-3.2*Math.sin(Math.PI*t);
  const twist=Array.from({length:22},(_,i)=>{ const t=i/21, x=-49+98*t, y=RY(t); return `M${r2(x-1.4)} ${r2(y+2)} L${r2(x+1.4)} ${r2(y-2)}`; }).join(' ');
  const rope=`M-49 ${r2(RY(0))} ${Array.from({length:12},(_,i)=>{ const t=(i+1)/12; return `L${r2(-49+98*t)} ${r2(RY(t))}`; }).join(' ')}`;
  /* a paper streamer (shide): a zigzag strip hanging from the rope */
  const shide=(x,y,s)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M-3 0 L3 0 L3 4.4 L-.4 4.4 L-.4 5.6 L4.6 5.6 L4.6 10.4 L1.2 10.4 L1.2 11.6 L6 11.6 L6 17 L2.4 17 L2.4 12.8 L-2.4 12.8 L-2.4 6.8 L-3 6.8Z" fill="#fbf8f2" stroke="#a89c7c" stroke-width=".45"/><path d="M-2.4 1 L-2.4 3.6 M3.6 6.4 L3.6 9.6" stroke="#e2d9c4" stroke-width=".8"/></g>`;
  return `<defs>
    ${H.skinDef(ID,'skin',-66,[[0,'#f2ebe0'],[.2,'#b9ab98'],[.6,'#8a7b68'],[.9,'#6a5d4e'],[1,'#173a3b']])}
    ${H.eyeDefs(ID,'#d9cebf','#8a7b68',['#ffd98a','#d99a32','#8a5014'])}
    <linearGradient id="${ID}ink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11181c"/><stop offset=".72" stop-color="#1f2328" stop-opacity=".9"/><stop offset="1" stop-color="#1f2328" stop-opacity=".3"/></linearGradient>
    <linearGradient id="${ID}inkR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#11181c"/><stop offset=".72" stop-color="#1f2328" stop-opacity=".9"/><stop offset="1" stop-color="#1f2328" stop-opacity=".3"/></linearGradient>
    <linearGradient id="${ID}bam" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ead39c"/><stop offset=".55" stop-color="#d1b071"/><stop offset="1" stop-color="#a8853f"/></linearGradient>
    <linearGradient id="${ID}hair" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f6f1e7"/><stop offset=".45" stop-color="#d8d2c8"/><stop offset=".72" stop-color="#3a3f46"/><stop offset="1" stop-color="#0b0f12"/></linearGradient>
    <radialGradient id="${ID}throat" cx=".5" cy=".35" r=".6"><stop offset="0" stop-color="#f2ebe0"/><stop offset="1" stop-color="#c2b4a0"/></radialGradient>
    <clipPath id="${ID}bc"><path d="${B_BODY}"/></clipPath>
  </defs>
  <g class="td-cast">
  ${perchFor(o,ID,58)}
  <g class="td-body"><g class="td-breathe">
    <!-- hind feet, wide -->
    <path d="M-46 -4.6 C-52 -7 -58 -6 -62.6 -3.2 C-64.6 -2 -64.4 .3 -62 .6 C-56 1 -50 .8 -45 .2Z M46 -4.6 C52 -7 58 -6 62.6 -3.2 C64.6 -2 64.4 .3 62 .6 C56 1 50 .8 45 .2Z" fill="#8a7b68" stroke="#4a3f36" stroke-width=".5"/>
    <g fill="#e6dccb" stroke="#4a3f36" stroke-width=".4"><circle cx="-63.4" cy="-.8" r="1.5"/><circle cx="-60.6" cy="-4.4" r="1.4"/><circle cx="63.4" cy="-.8" r="1.5"/><circle cx="60.6" cy="-4.4" r="1.4"/></g>
    <!-- the body: the broadest of the cast -->
    <path d="${B_BODY}" fill="url(#${ID}skin)" stroke="#4a3f36" stroke-width=".7"/>
    <g clip-path="url(#${ID}bc)">
      <ellipse cx="0" cy="-14" rx="26" ry="15" fill="#f2ebe0" opacity=".42"/>
      ${STROKES.map(d=>`<path d="${d}" fill="url(#${ID}ink)"/><path d="${mir(d)}" fill="url(#${ID}inkR)"/>`).join('')}
      <path d="${DRY.join(' ')} ${mir(DRY.join(' '))}" stroke="#1f2328" stroke-width=".7" stroke-linecap="round" opacity=".55"/>
      <path d="M-4 -58 C-1 -60.4 3 -60.4 5 -58.6 C3 -57.6 -1 -57.2 -4 -58Z" fill="#11181c" opacity=".75"/>
      <circle cx="7.4" cy="-58.6" r=".8" fill="#11181c" opacity=".7"/><circle cx="-6.6" cy="-56.6" r=".5" fill="#11181c" opacity=".6"/>
      ${grit}
      ${[[-36,-22,1.3],[-28,-12,1.1],[34,-22,1.2],[26,-10,1],[-16,-28,.8],[16,-28,.8],[40,-44,1.1],[34,-50,.9],[-4,-24,.6]].map(w=>H.wart(w,'#2c2520',.25)).join('')}
      <ellipse cx="0" cy="-2.4" rx="34" ry="3.6" fill="#173a3b" opacity=".14"/>
    </g>
    <!-- parotoid bulges: long ridges down the sides of the head -->
    <path d="M34 -58.6 C42 -61 50 -57 50.8 -50 C51.4 -45.6 50.4 -42.6 48.4 -41.6 C44 -45.6 39 -51.6 34 -58.6Z" fill="url(#${ID}skin)" stroke="#4a3f36" stroke-width=".55"/>
    <path d="M-34 -58.6 C-42 -61 -50 -57 -50.8 -50 C-51.4 -45.6 -50.4 -42.6 -48.4 -41.6 C-44 -45.6 -39 -51.6 -34 -58.6Z" fill="url(#${ID}skin)" stroke="#4a3f36" stroke-width=".55"/>
    <g fill="#2c2520" opacity=".4"><circle cx="44" cy="-52" r=".7"/><circle cx="47" cy="-48" r=".6"/><circle cx="-44" cy="-52" r=".7"/><circle cx="-47" cy="-48" r=".6"/></g>
    ${H.eye(-21.4,-57.4,{r:9.4,lid:2.6,side:-1},P,ID)}
    ${H.eye(21.4,-57.4,{r:9.4,lid:2.6,side:1},P,ID)}
    <!-- a flat, heavy brow bar over each eye -->
    <path d="M11 -63.2 C16 -67.4 26 -68.4 33.6 -64.4 L32.8 -61.6 C26 -64.2 17.4 -64 11.6 -61.4Z M-11 -63.2 C-16 -67.4 -26 -68.4 -33.6 -64.4 L-32.8 -61.6 C-26 -64.2 -17.4 -64 -11.6 -61.4Z" fill="#9a8a75" stroke="#4a3f36" stroke-width=".55"/>
    <path d="M11.8 -61.6 C17.4 -64 26 -64.2 32.2 -62 M-11.8 -61.6 C-17.4 -64 -26 -64.2 -32.2 -62" fill="none" stroke="#2c2520" stroke-width="1.1" stroke-linecap="round" opacity=".4"/>
    <path d="M13.4 -65.6 C18 -67.4 26 -67.6 31 -65.6 M-13.4 -65.6 C-18 -67.4 -26 -67.6 -31 -65.6" fill="none" stroke="#e6dccb" stroke-width=".7" stroke-linecap="round" opacity=".8"/>
    <ellipse cx="-5.6" cy="-45.6" rx="1.2" ry=".8" fill="#1c1612" opacity=".6"/><ellipse cx="5.6" cy="-45.6" rx="1.2" ry=".8" fill="#1c1612" opacity=".6"/>
    <path d="M-39 -39 C-26 -37.4 -12 -37.2 0 -37.4 C12 -37.2 26 -37.4 39 -39" fill="none" stroke="#f4ede2" stroke-width=".85" stroke-linecap="round" opacity=".5" transform="translate(0 -1.3)"/>
    <path d="M-39 -39 C-26 -37.4 -12 -37.2 0 -37.4 C12 -37.2 26 -37.4 39 -39" fill="none" stroke="#1c1612" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>
    <path d="M-39 -39 C-40.6 -38.6 -41.2 -37.4 -40.8 -36 M39 -39 C40.6 -38.6 41.2 -37.4 40.8 -36" fill="none" stroke="#1c1612" stroke-width="1.2" stroke-linecap="round" opacity=".75"/>
    <g transform="translate(0 -36)"><g class="td-throat"><g transform="translate(0 36)">
      <ellipse cx="0" cy="-30.6" rx="15.6" ry="5.6" fill="url(#${ID}throat)"/><ellipse cx="-4.2" cy="-32.2" rx="4.8" ry="1.3" fill="#ffffff" opacity=".35"/>
    </g></g></g>
    <!-- the shrine rope round his middle, with paper streamers and a seal -->
    <path d="${rope}" fill="none" stroke="#9c8e70" stroke-width="5" stroke-linecap="round"/>
    <path d="${rope}" fill="none" stroke="#f1eadb" stroke-width="4" stroke-linecap="round"/>
    <path d="${twist}" stroke="#b9ab88" stroke-width=".8"/>
    <!-- the knot at the front, two rope ends, and a paper tag with his seal -->
    <g transform="translate(6 -18.4)"><g class="td-tassel">
      <path d="M-1.4 1 C-2.6 4.6 -3.2 8.6 -2.6 12.4 M1.6 1 C2.8 4.4 3.8 8 4 11.6" fill="none" stroke="#9c8e70" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M-1.4 1 C-2.6 4.6 -3.2 8.6 -2.6 12.4 M1.6 1 C2.8 4.4 3.8 8 4 11.6" fill="none" stroke="#f1eadb" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M-3.4 11.6 L-1.8 13.2 M3.2 11 L4.8 12.4" stroke="#b9ab88" stroke-width=".7"/>
    </g></g>
    <ellipse cx="6" cy="-18" rx="4.4" ry="3.6" fill="#f1eadb" stroke="#9c8e70" stroke-width=".7"/>
    <path d="M3.4 -20 L8.6 -16 M3.2 -17 L7 -14.8" stroke="#b9ab88" stroke-width=".7"/>
    <g transform="translate(-6.6 -16.2)"><g class="td-tassel two">
      <path d="M-.6 0 L-.6 2" stroke="#9c8e70" stroke-width=".6"/>
      <path d="M-5.6 2 L4.4 2 L4.4 15 L-5.6 15Z" fill="#fbf8f2" stroke="#a89c7c" stroke-width=".45"/>
      <path d="M-4.2 3.6 L3 3.6" stroke="#e2d9c4" stroke-width=".7"/>
      ${seal(-.6,9.4,.82,-4)}
    </g></g>
    <!-- arms planted wide, outside the knees -->
    <path d="${B_ARM} ${mir(B_ARM)}" fill="url(#${ID}skin)"/>
    <path d="M46.4 -28.6 C51.6 -25.6 55 -20.6 55.6 -15 C56.4 -9 54.4 -4.6 52.8 -2.2 M43.4 -2.2 C44 -7 43 -12 40.4 -16.4 C39.8 -17.4 39.2 -18.4 38.6 -19.6 M-46.4 -28.6 C-51.6 -25.6 -55 -20.6 -55.6 -15 C-56.4 -9 -54.4 -4.6 -52.8 -2.2 M-43.4 -2.2 C-44 -7 -43 -12 -40.4 -16.4 C-39.8 -17.4 -39.2 -18.4 -38.6 -19.6" fill="none" stroke="#4a3f36" stroke-width=".6" stroke-linecap="round"/>
    <path d="M-50 -24 C-53 -20.6 -54.4 -16.4 -54.4 -12 C-52.4 -14 -50.8 -17 -49.6 -20.6Z ${mir('M-50 -24 C-53 -20.6 -54.4 -16.4 -54.4 -12 C-52.4 -14 -50.8 -17 -49.6 -20.6Z')}" fill="#1f2328" opacity=".8"/>
    ${[[50,-14,1.1],[47,-6,.9],[-48,-8,.9]].map(w=>H.wart(w,'#2c2520',.25)).join('')}
    ${[1,-1].map(s=>`<ellipse cx="${48*s}" cy="-1.9" rx="6.8" ry="3" fill="#a39480" stroke="#4a3f36" stroke-width=".5"/>
      <g stroke-linecap="round"><path d="M${47.6*s} -2 L${38.6*s} .5 M${47.8*s} -1.8 L${43.6*s} 1.7 M${48.4*s} -1.8 L${51.6*s} 1.8 M${48.8*s} -2 L${57.4*s} .4" stroke="#4a3f36" stroke-width="4.3"/>
      <path d="M${47.6*s} -2 L${38.6*s} .5 M${47.8*s} -1.8 L${43.6*s} 1.7 M${48.4*s} -1.8 L${51.6*s} 1.8 M${48.8*s} -2 L${57.4*s} .4" stroke="#b3a490" stroke-width="3.3"/></g>
      <g fill="#ece2d2" stroke="#4a3f36" stroke-width=".4"><circle cx="${38.4*s}" cy=".6" r="1.9"/><circle cx="${43.5*s}" cy="1.8" r="1.9"/><circle cx="${51.7*s}" cy="1.9" r="1.9"/><circle cx="${57.6*s}" cy=".5" r="1.9"/></g>`).join('')}
    <!-- the brush, tucked through the rope at his side like a sword, the tuft up by his shoulder -->
    ${brush(ID,-24,-1,-49.6,-41,15)}
    <path d="M-38.4 -18.2 C-34.6 -17.6 -30.6 -17.4 -27 -17.6" fill="none" stroke="#9c8e70" stroke-width="5" stroke-linecap="round"/>
    <path d="M-38.4 -18.2 C-34.6 -17.6 -30.6 -17.4 -27 -17.6" fill="none" stroke="#f1eadb" stroke-width="4" stroke-linecap="round"/>
    <path d="M-36.6 -16.2 L-34.4 -20 M-33.4 -15.8 L-31.2 -19.6 M-30.2 -15.8 L-28 -19.6" stroke="#b9ab88" stroke-width=".8"/>
  </g></g>
  </g>`;
}
window.ToadArt.TOADS.sumi ||= {name:'Sumi',title:'Keeper of the Ink',art:artB};
})();

/* ═════════════════════════ Tabi · Keeper of the Road ═════════════════════════
   Home: the Journeys water, on the stepping-stone path. Compact and stocky,
   ochre with dark-ringed warts (the classic roadside-toad pattern), wide
   awake and friendly. Carries a wooden travel pack (an oi) with a rolled
   straw mat on top and a gourd hanging off it, a teal tenugui tied at his
   throat, and a snail called Dango riding on his head. Sits on a smooth
   river stone. Tap: two quick steps on the spot, and Dango ducks into
   her shell. */
(function(){
'use strict';
const H=window.ToadCast, r2=H.r2;
const BODY='M0 0 C15 .5 33 -1 40 -8 C45 -14 44.6 -22 41 -28 C39 -31.6 39.4 -35.6 40 -40 C40.6 -47 37 -55 28.6 -58.4 C19 -61.6 -19 -61.6 -28.6 -58.4 C-37 -55 -40.6 -47 -40 -40 C-39.4 -35.6 -39 -31.6 -41 -28 C-44.6 -22 -45 -14 -40 -8 C-33 -1 -15 .5 0 0Z';
const ARM='M30 -36 C38.6 -35.4 45.6 -29 46.6 -20.4 C47.4 -13 45 -6 43.4 -2.4 L34.4 -2.4 C35 -8 34.4 -14 31.6 -19 C29.4 -23 27.6 -27.6 27.6 -31.6Z';
const mir=d=>d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g,(m,x,y)=>`${r2(-x)} ${y}`);
const BLOTCH=[[-33.6,-41,1.8],[34,-40,1.6],[-33,-30,2.6],[34,-28,2.8],[-22,-14,2.2],[21,-12,2.4],[-36,-14,2],[36.6,-15,2],[-12,-50,1.6],[13,-50.6,1.6]];
const WARTS=[[-17,-28,.9],[16,-27,.9],[-8,-8,.8],[9,-9,.8],[0,-30,.7],[-30,-6,.9],[30,-6,.9]];
const OUT='M3 -3 C6 -3.6 10 -3.4 13.6 -2 C15.6 -1.2 16.4 .4 15 1.2 C11 2.4 5 2.2 1 1.6Z';     /* Dango's foot, relative to her shell */
function stone(o,ID){
  return `${H.rings(o,64,11,7)}
    <defs><radialGradient id="${ID}stone" cx=".42" cy=".22" r=".8"><stop offset="0" stop-color="#c9d3c2"/><stop offset=".5" stop-color="#97a594"/><stop offset="1" stop-color="#5f6d5e"/></radialGradient></defs>
    <path d="M-54 3.6 C-56 -2.6 -44 -6.4 -24 -6.8 C-2 -7.2 26 -7.2 44 -5.6 C55 -4.6 58 -.6 56 4.4 C53.6 10 36 13 6 13.2 C-24 13.4 -50 11 -54 3.6Z" fill="url(#${ID}stone)" stroke="#4c5a4c" stroke-width=".5"/>
    <path d="M-44 -2.6 C-30 -5.6 -6 -5.8 14 -5.6 C30 -5.4 44 -4.4 50 -2" fill="none" stroke="#e6ece0" stroke-width=".9" opacity=".6"/>
    <path d="M-48 6.6 C-30 10.4 20 11 48 6.4" fill="none" stroke="#4c5a4c" stroke-width=".6" opacity=".4"/>
    ${H.contact(44)}`;
}
function art(o,ID){
  const P={eye:'eye',iris:'iris',line:'#8a5a2b',fold:'#9c6a2c',fold2:'#7a5020',lidLine:'#3a2614',ring:'#5a4a14',hi:'#fff6dc'};
  /* the pack's planks and frame, behind his head */
  const planks=[-66,-73,-80].map(y=>`M-20.6 ${y} L20.6 ${y}`).join(' ');
  return `<defs>
    ${H.skinDef(ID,'skin',-66,[[0,'#fff4dc'],[.24,'#f2d08a'],[.68,'#d89c34'],[.93,'#bb8226'],[1,'#173a3b']])}
    ${H.eyeDefs(ID,'#fff1d2','#d9a248',['#f4f1b4','#bdb64a','#6f6a1c'])}
    <linearGradient id="${ID}wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a87a4e"/><stop offset=".5" stop-color="#8a5f3b"/><stop offset="1" stop-color="#6b452a"/></linearGradient>
    <linearGradient id="${ID}mat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecd49a"/><stop offset="1" stop-color="#b8975a"/></linearGradient>
    <radialGradient id="${ID}gourd" cx=".38" cy=".32" r=".7"><stop offset="0" stop-color="#f3cf86"/><stop offset=".6" stop-color="#d7a04a"/><stop offset="1" stop-color="#9c6a2c"/></radialGradient>
    <radialGradient id="${ID}shell" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#f6dcc0"/><stop offset=".6" stop-color="#e2b48a"/><stop offset="1" stop-color="#b07a50"/></radialGradient>
    <radialGradient id="${ID}throat" cx=".5" cy=".35" r=".6"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#f0d9a6"/></radialGradient>
    <clipPath id="${ID}bc"><path d="${BODY}"/></clipPath>
  </defs>
  <g class="td-cast">
  ${o.perch==='own'?stone(o,ID):o.perch==='pad'?H.lilyPad(o,ID,58)+H.contact(44):o.perch==='ground'?H.ground(50):''}
  <g class="td-body"><g class="td-breathe">
    <!-- the pack on his back: a wooden frame box, a rolled mat, a gourd -->
    <path d="M-25 -96.6 L-25 -52 M25 -96.6 L25 -52" stroke="#5a3a22" stroke-width="3.2" stroke-linecap="round"/>
    <circle cx="-25" cy="-97.4" r="2.2" fill="#6b452a"/><circle cx="25" cy="-97.4" r="2.2" fill="#6b452a"/>
    <rect x="-22" y="-86" width="44" height="34" rx="2.6" fill="url(#${ID}wood)" stroke="#4a2f1c" stroke-width=".6"/>
    <rect x="-22" y="-86" width="44" height="5.2" rx="2.4" fill="#b88a5e" stroke="#4a2f1c" stroke-width=".5"/>
    <path d="${planks}" stroke="#5a3a22" stroke-width=".7" opacity=".7"/>
    <path d="M-20.4 -80 L-20.4 -54" stroke="#c99a6a" stroke-width=".8" opacity=".5"/>
    <path d="M-6 -66 L6 -66 L6 -60 L-6 -60Z" fill="#6b452a" opacity=".6"/>
    <g transform="translate(0 -91.4)">
      <rect x="-28" y="-5.6" width="56" height="11.2" rx="5.6" fill="url(#${ID}mat)" stroke="#8e7034" stroke-width=".6"/>
      <path d="M-24 -5 L-24 5 M-16 -5.4 L-16 5.4 M-8 -5.6 L-8 5.6 M0 -5.6 L0 5.6 M8 -5.6 L8 5.6 M16 -5.4 L16 5.4 M24 -5 L24 5" stroke="#b8975a" stroke-width=".5" opacity=".8"/>
      <ellipse cx="-28" cy="0" rx="2.2" ry="5.4" fill="#d9bd7e" stroke="#8e7034" stroke-width=".5"/>
      <path d="M-13 -5.8 L-13 5.8 M13 -5.8 L13 5.8" stroke="#6b452a" stroke-width="1.6"/>
    </g>
    <!-- the gourd hangs off the frame by a red cord -->
    <g transform="translate(25.4 -80)"><g class="td-gourd">
      <path d="M0 0 C2.4 2 4 4 4.4 6.4" fill="none" stroke="#b0524a" stroke-width="1"/>
      <path d="M4.4 6 C2 6 1.4 9 3 10.6 C-1 12.6 -1.6 19 2.4 21.6 C6 24 11 22 12 18 C13 14 10.6 11.2 7.4 10.6 C8.6 8.6 7.4 6 4.4 6Z" fill="url(#${ID}gourd)" stroke="#8a5a2b" stroke-width=".5"/>
      <path d="M3.8 9.6 C5.6 10.2 7 10.4 8.4 10.2" fill="none" stroke="#b0524a" stroke-width="1.1"/>
      <ellipse cx="3" cy="15.4" rx="1.4" ry="2.6" fill="#fff4dc" opacity=".55"/>
    </g></g>
    <!-- haunches and hind feet -->
    <path d="M-38 -4.6 C-44 -7 -50 -6 -54.6 -3.2 C-56.6 -2 -56.4 .3 -54 .6 C-48 1 -42 .8 -37 .2Z M38 -4.6 C44 -7 50 -6 54.6 -3.2 C56.6 -2 56.4 .3 54 .6 C48 1 42 .8 37 .2Z" fill="#d29a3c" stroke="#8a5a2b" stroke-width=".5"/>
    <g fill="#f7e2b0" stroke="#8a5a2b" stroke-width=".4"><circle cx="-55.4" cy="-.8" r="1.5"/><circle cx="-52.6" cy="-4.4" r="1.4"/><circle cx="55.4" cy="-.8" r="1.5"/><circle cx="52.6" cy="-4.4" r="1.4"/></g>
    <!-- body: compact and stocky -->
    <path d="${BODY}" fill="url(#${ID}skin)" stroke="#8a5a2b" stroke-width=".6"/>
    <g clip-path="url(#${ID}bc)">
      <ellipse cx="0" cy="-15" rx="21" ry="15" fill="#fff4dc" opacity=".55"/>
      ${BLOTCH.map(b=>H.blotch(b,'#7a4a24')).join('')}
      ${WARTS.map(w=>H.wart(w,'#5a3a18',.22)).join('')}
      <ellipse cx="-13" cy="-54" rx="12" ry="2.8" fill="#ffffff" opacity=".24" transform="rotate(-8 -13 -54)"/>
      <ellipse cx="0" cy="-2.4" rx="30" ry="3.6" fill="#173a3b" opacity=".12"/>
    </g>
    ${H.eye(-18,-56.4,{r:9,lid:-1.6,side:-1},P,ID)}
    ${H.eye(18,-56.4,{r:9,lid:-1.6,side:1},P,ID)}
    <!-- Dango the snail, on top of his head -->
    <g transform="translate(-1 -63.4)"><g class="td-snail">
      <g transform="translate(0 0)"><g class="td-out">
        <path d="${OUT}" fill="#cfd6be" stroke="#7f8a6a" stroke-width=".45"/>
        <g transform="translate(13 -1.6)"><g class="td-horns">
          <path d="M0 0 C.4 -3 1.2 -5.6 2.2 -7.4 M-1.4 .2 C-2.4 -2.6 -2.8 -4.8 -2.6 -6.8" fill="none" stroke="#9aa486" stroke-width=".9" stroke-linecap="round"/>
          <circle cx="2.3" cy="-7.6" r=".9" fill="#3a3a2a"/><circle cx="-2.6" cy="-7" r=".9" fill="#3a3a2a"/>
        </g></g>
      </g></g>
      <circle cx="0" cy="-3.4" r="6.4" fill="url(#${ID}shell)" stroke="#8a5a2b" stroke-width=".55"/>
      <path d="M0 -3.4 m-1.4 0 a1.4 1.4 0 1 1 2.8 .2 a2.8 2.8 0 1 1 -4.8 -1.2 a4.4 4.4 0 1 1 5.2 6.8" fill="none" stroke="#9a6a3a" stroke-width=".75" stroke-linecap="round"/>
      <ellipse cx="-2.4" cy="-6.4" rx="1.6" ry=".9" fill="#ffffff" opacity=".5"/>
    </g></g>
    <ellipse cx="-4.8" cy="-46.6" rx="1.1" ry=".75" fill="#3a2614" opacity=".55"/><ellipse cx="4.8" cy="-46.6" rx="1.1" ry=".75" fill="#3a2614" opacity=".55"/>
    <!-- a wide, easy smile -->
    <path d="M-31 -42.6 C-22 -38.6 -10 -37.6 0 -37.8 C10 -37.6 22 -38.6 31 -42.6" fill="none" stroke="#fff6dc" stroke-width=".85" stroke-linecap="round" opacity=".55" transform="translate(0 -1.3)"/>
    <path d="M-31 -42.6 C-22 -38.6 -10 -37.6 0 -37.8 C10 -37.6 22 -38.6 31 -42.6" fill="none" stroke="#3a2614" stroke-width="1.45" stroke-linecap="round" opacity=".8"/>
    <path d="M-31 -42.6 C-32.6 -43.4 -33.2 -44.6 -33 -45.8 M31 -42.6 C32.6 -43.4 33.2 -44.6 33 -45.8" fill="none" stroke="#3a2614" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>
    <g transform="translate(0 -36.4)"><g class="td-throat"><g transform="translate(0 36.4)">
      <ellipse cx="0" cy="-31.6" rx="13.6" ry="5" fill="url(#${ID}throat)"/><ellipse cx="-3.8" cy="-33" rx="4.2" ry="1.2" fill="#ffffff" opacity=".4"/>
    </g></g></g>
    <!-- the tenugui, teal with white dots, knotted at one side -->
    <path d="M-30.6 -30.6 C-18 -25.6 18 -25.6 30.6 -30.6 L31.6 -25.6 C18 -20 -18 -20 -31.6 -25.6Z" fill="#2f7a74" stroke="#1f5753" stroke-width=".5"/>
    <g fill="#e6f5f1" opacity=".85"><circle cx="-22" cy="-26.2" r=".8"/><circle cx="-13" cy="-24.4" r=".8"/><circle cx="-4" cy="-23.8" r=".8"/><circle cx="5" cy="-23.8" r=".8"/><circle cx="14" cy="-24.4" r=".8"/><circle cx="-17.6" cy="-22.4" r=".6"/><circle cx="9.6" cy="-21.8" r=".6"/></g>
    <path d="M22 -25.6 C26 -24 27.4 -20 26 -15.4 L22.4 -16.2 C23 -19.6 22 -22.4 20 -23.8Z M25 -26.6 C29.6 -25.6 32.6 -22.6 33.4 -18.6 L29.8 -17.8 C29 -21 27 -23.4 24 -24.4Z" fill="#2f7a74" stroke="#1f5753" stroke-width=".5"/>
    <circle cx="23.4" cy="-25.6" r="2.4" fill="#2a6e68" stroke="#1f5753" stroke-width=".5"/>
    <!-- arms, both planted -->
    <path d="${ARM} ${mir(ARM)}" fill="url(#${ID}skin)"/>
    <path d="M38.6 -34.6 C43.2 -31.2 46 -26.2 46.6 -20.4 C47.4 -13 45 -6 43.4 -2.4 M34.4 -2.4 C35 -8 34.4 -14 31.6 -19 C30.8 -20.4 30 -21.8 29.4 -23.2 M-38.6 -34.6 C-43.2 -31.2 -46 -26.2 -46.6 -20.4 C-47.4 -13 -45 -6 -43.4 -2.4 M-34.4 -2.4 C-35 -8 -34.4 -14 -31.6 -19 C-30.8 -20.4 -30 -21.8 -29.4 -23.2" fill="none" stroke="#8a5a2b" stroke-width=".55" stroke-linecap="round"/>
    ${[[42,-20,1.8],[-42,-20,1.8],[40,-9,1.4],[-40,-9,1.4]].map(b=>H.blotch(b,'#7a4a24')).join('')}
    ${[1,-1].map(s=>`<ellipse cx="${39*s}" cy="-1.9" rx="6.4" ry="2.8" fill="#e8b860" stroke="#8a5a2b" stroke-width=".5"/>
      <g stroke-linecap="round"><path d="M${38.6*s} -2 L${29.6*s} .5 M${38.8*s} -1.8 L${34.6*s} 1.7 M${39.4*s} -1.8 L${42.6*s} 1.8 M${39.8*s} -2 L${48.4*s} .4" stroke="#8a5a2b" stroke-width="4.1"/>
      <path d="M${38.6*s} -2 L${29.6*s} .5 M${38.8*s} -1.8 L${34.6*s} 1.7 M${39.4*s} -1.8 L${42.6*s} 1.8 M${39.8*s} -2 L${48.4*s} .4" stroke="#efc778" stroke-width="3.2"/></g>
      <g fill="#fbe7b8" stroke="#8a5a2b" stroke-width=".4"><circle cx="${29.4*s}" cy=".6" r="1.9"/><circle cx="${34.5*s}" cy="1.8" r="1.9"/><circle cx="${42.7*s}" cy="1.9" r="1.9"/><circle cx="${48.6*s}" cy=".5" r="1.9"/></g>`).join('')}
  </g></g>
  </g>`;
}
window.ToadArt.TOADS.tabi ||= {name:'Tabi',title:'Keeper of the Road',art};
})();

/* ═════════════════════════ Hotaru · Keeper of the Lanterns ═════════════════════════
   Home: the Collection's "next to find" water. The small one of the cast:
   a round, mossy-olive night toad with dark blotches and pale warts, mostly asleep, holding
   up a glass jar of fireflies that lights his face. Sits on a small lily pad.
   Idle: he dozes off and catches himself; the fireflies drift and glow.
   Tap: he wakes with a start, eyes wide, and the fireflies burst out of the
   jar and drift back. */
(function(){
'use strict';
const H=window.ToadCast, r2=H.r2;
const BODY='M0 0 C10 .4 22 -.8 27 -6 C31 -10.6 31 -17 28.4 -22 C27 -25 27.6 -28.6 28 -32 C28.6 -38 25.6 -42.6 19 -44.4 C12 -46 -12 -46 -19 -44.4 C-25.6 -42.6 -28.6 -38 -28 -32 C-27.6 -28.6 -27 -25 -28.4 -22 C-31 -17 -31 -10.6 -27 -6 C-22 -.8 -10 .4 0 0Z';
const ARM_L='M-19 -26 C-25.6 -25.6 -31.4 -21 -32.4 -14.4 C-33 -9.6 -31.6 -5.4 -30.4 -2.2 L-23.4 -2.2 C-23.6 -6 -23 -10 -21.4 -13.6 C-20.2 -16.4 -19 -19.6 -18.6 -22.6Z';
const ARM_R='M18.6 -27.6 C23 -29.8 28 -32.6 31.6 -35.6 L36.6 -33.6 C36.4 -30 33.4 -26.8 29.4 -24.4 C26 -22.4 22.4 -21 19.4 -20.4Z';
const WARTS_H=[[-22,-38,1.1],[-25,-30,1],[22.6,-38.6,1],[25.4,-30.4,.9],[-16,-26,.9],[16.4,-25,.8],[-20,-14,1],[20,-13,1],[-8,-17,.7],[8.6,-18,.7],[-26,-20,.9],[26,-19,.8]];
const SPOTS=[[-18,-36,1.3],[19,-37,1.1],[-22,-20,1.4],[22,-18,1.2],[-11,-12,1],[12,-10,1.1],[-24,-9,1],[24,-8,1],[0,-22,.8],[-6,-40,.8],[7,-40.6,.8]];
const JAR='M28.8 -55.6 C27 -52 26.6 -42.4 28.6 -38.2 C30.6 -34.6 41.8 -34.6 43.8 -38.2 C45.8 -42.4 45.4 -52 43.6 -55.6 Z';
function log(o,ID){
  return `${H.rings(o,52,10,7)}
    <defs><linearGradient id="${ID}bark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a7450"/><stop offset=".5" stop-color="#6b4a2f"/><stop offset="1" stop-color="#43301f"/></linearGradient></defs>
    <path d="M-40 -3.6 L38 -3.6 C38 -3.6 38 11.4 38 11.4 L-40 11.4 C-44.6 11.4 -44.6 -3.6 -40 -3.6Z" fill="url(#${ID}bark)" stroke="#3a2616" stroke-width=".5"/>
    <path d="M-36 .6 C-20 -.4 0 1.4 20 .2 M-30 5.4 C-12 6.6 6 4.6 26 6 M-38 8.6 C-24 9.2 -8 8.4 10 9" fill="none" stroke="#3a2616" stroke-width=".55" opacity=".55"/>
    <path d="M-38 -3 C-20 -4.2 10 -4.2 34 -3.2" fill="none" stroke="#c9a57a" stroke-width=".8" opacity=".55"/>
    <ellipse cx="38" cy="3.9" rx="4.4" ry="7.5" fill="#d9b98a" stroke="#6b4a2f" stroke-width=".6"/>
    <ellipse cx="38" cy="3.9" rx="2.6" ry="4.6" fill="none" stroke="#a87a4e" stroke-width=".5"/><ellipse cx="38" cy="3.9" rx="1" ry="1.8" fill="#a87a4e"/>
    <path d="M-34 -3.8 C-30 -6.4 -24 -6.6 -20 -4 Z M8 -4 C12 -6 18 -6 21 -3.8Z" fill="#7fa878" opacity=".9"/>
    ${H.contact(30)}`;
}
const fly=(c)=>`<circle r="3.4" fill="#e9f27a" opacity=".16"/><circle r="1.8" fill="#f2f6a0" opacity=".45"/><circle r=".95" fill="${c||'#fffbe0'}"/>`;
function art(o,ID){
  const P={eye:'eye',iris:'iris',line:'#3d4a2a',fold:'#4a5832',fold2:'#3d4a2a',lidLine:'#1f2414',ring:'#4a5a14',hi:'#f2f4e2'};
  return `<defs>
    ${H.skinDef(ID,'skin',-52,[[0,'#e8ebd4'],[.2,'#adb882'],[.58,'#727f4c'],[.9,'#58653b'],[1,'#173a3b']])}
    ${H.eyeDefs(ID,'#eef0dc','#8f9a66',['#fbffd0','#d8e46a','#8a9a2a'])}
    <radialGradient id="${ID}glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f4f9b0" stop-opacity=".55"/><stop offset=".45" stop-color="#e9f27a" stop-opacity=".2"/><stop offset="1" stop-color="#e9f27a" stop-opacity="0"/></radialGradient>
    <radialGradient id="${ID}throat" cx=".5" cy=".35" r=".6"><stop offset="0" stop-color="#e3e7c8"/><stop offset="1" stop-color="#a9b47e"/></radialGradient>
    <clipPath id="${ID}bc"><path d="${BODY}"/></clipPath>
  </defs>
  <g class="td-cast">
  ${o.perch==='own'?log(o,ID):o.perch==='pad'?H.lilyPad(o,ID,40)+H.contact(30):o.perch==='ground'?H.ground(34):''}
  <g class="td-body"><g class="td-breathe">
    <!-- the jar's light, behind everything -->
    <g transform="translate(36.2 -46)"><g class="td-glow"><circle r="30" fill="url(#${ID}glow)"/></g></g>
    <!-- hind feet -->
    <path d="M-24 -4.2 C-29 -6.2 -34 -5.4 -37.6 -3 C-39.2 -2 -39 .2 -37 .5 C-32 .9 -27 .8 -23 .2Z M24 -4.2 C29 -6.2 34 -5.4 37.6 -3 C39.2 -2 39 .2 37 .5 C32 .9 27 .8 23 .2Z" fill="#6f7d4a" stroke="#3d4a2a" stroke-width=".5"/>
    <g fill="#e6e8c8" stroke="#3d4a2a" stroke-width=".4"><circle cx="-38.2" cy="-.8" r="1.3"/><circle cx="-35.8" cy="-3.8" r="1.2"/><circle cx="38.2" cy="-.8" r="1.3"/><circle cx="35.8" cy="-3.8" r="1.2"/></g>
    <!-- a small, round body -->
    <path d="${BODY}" fill="url(#${ID}skin)" stroke="#3d4a2a" stroke-width=".6"/>
    <g clip-path="url(#${ID}bc)">
      <ellipse cx="0" cy="-12" rx="16" ry="11" fill="#e3e4c6" opacity=".38"/>
      ${SPOTS.map(([x,y,r])=>`<ellipse cx="${x}" cy="${y}" rx="${r2(r*1.8)}" ry="${r2(r*1.4)}" fill="#3d4a2a" opacity=".4"/>`).join('')}
      ${WARTS_H.map(w=>H.wart(w,'#1f2414',.3)).join('')}
      <ellipse cx="-9" cy="-40.6" rx="9" ry="2.2" fill="#ffffff" opacity=".22" transform="rotate(-8 -9 -40.6)"/>
      <ellipse cx="22" cy="-30" rx="17" ry="16" fill="#e9f27a" opacity=".2"/>
      <ellipse cx="0" cy="-2" rx="20" ry="2.8" fill="#0f3b41" opacity=".18"/>
    </g>
    <path d="M19 -44.4 C24.6 -46.6 30.8 -43.8 31.4 -38.6 C31.8 -35.4 30.8 -33.4 29 -32.6 C26.6 -35.4 22.6 -40 19 -44.4Z M-19 -44.4 C-24.6 -46.6 -30.8 -43.8 -31.4 -38.6 C-31.8 -35.4 -30.8 -33.4 -29 -32.6 C-26.6 -35.4 -22.6 -40 -19 -44.4Z" fill="url(#${ID}skin)"/>
    <path d="M19 -44.4 C24.6 -46.6 30.8 -43.8 31.4 -38.6 C31.8 -35.4 30.8 -33.4 29 -32.6 M-19 -44.4 C-24.6 -46.6 -30.8 -43.8 -31.4 -38.6 C-31.8 -35.4 -30.8 -33.4 -29 -32.6" fill="none" stroke="#3d4a2a" stroke-width=".55"/>
    <g fill="#1f2414" opacity=".35"><circle cx="26" cy="-40.6" r=".55"/><circle cx="28.4" cy="-37.4" r=".5"/><circle cx="-26" cy="-40.6" r=".55"/><circle cx="-28.4" cy="-37.4" r=".5"/></g>
    <!-- he dozes: face and lids sink a little, then he catches himself -->
    <g class="td-nod">
      ${H.eye(-12.6,-42.4,{r:8.6,lid:4.6,side:-1},P,ID)}
      ${H.eye(12.6,-42.4,{r:8.6,lid:4.6,side:1},P,ID)}
      <ellipse cx="-3.4" cy="-34.6" rx=".85" ry=".6" fill="#1f2414" opacity=".55"/><ellipse cx="3.4" cy="-34.6" rx=".85" ry=".6" fill="#1f2414" opacity=".55"/>
      <path d="M-21 -29.6 C-14 -26.8 -6 -26.2 0 -26.4 C6 -26.2 14 -26.8 21 -29.6" fill="none" stroke="#f2f4e2" stroke-width=".7" stroke-linecap="round" opacity=".45" transform="translate(0 -1.1)"/>
      <path d="M-21 -29.6 C-14 -26.8 -6 -26.2 0 -26.4 C6 -26.2 14 -26.8 21 -29.6" fill="none" stroke="#1f2414" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>
      <path d="M-21 -29.6 C-22.2 -29.8 -22.8 -30.8 -22.6 -31.8 M21 -29.6 C22.2 -29.8 22.8 -30.8 22.6 -31.8" fill="none" stroke="#1f2414" stroke-width="1" stroke-linecap="round" opacity=".7"/>
    </g>
    <g transform="translate(0 -25.6)"><g class="td-throat"><g transform="translate(0 25.6)">
      <ellipse cx="0" cy="-22.4" rx="9.4" ry="3.6" fill="url(#${ID}throat)"/><ellipse cx="-2.6" cy="-23.2" rx="3" ry=".9" fill="#ffffff" opacity=".3"/>
    </g></g></g>
    <!-- left arm (viewer's) planted -->
    <path d="${ARM_L}" fill="url(#${ID}skin)"/>
    <path d="M-25.4 -24.6 C-29.6 -22.2 -32 -18.6 -32.4 -14.4 C-33 -9.6 -31.6 -5.4 -30.4 -2.2 M-23.4 -2.2 C-23.6 -6 -23 -10 -21.4 -13.6 C-21 -14.6 -20.6 -15.6 -20.2 -16.6" fill="none" stroke="#3d4a2a" stroke-width=".55" stroke-linecap="round"/>
    <ellipse cx="-27" cy="-1.8" rx="5.4" ry="2.4" fill="#7f8c58" stroke="#3d4a2a" stroke-width=".5"/>
    <g stroke-linecap="round"><path d="M-26.6 -2 L-19.4 .3 M-26.8 -1.8 L-23.4 1.4 M-27.4 -1.8 L-30 1.5 M-27.8 -2 L-34.6 .3" stroke="#3d4a2a" stroke-width="3.5"/><path d="M-26.6 -2 L-19.4 .3 M-26.8 -1.8 L-23.4 1.4 M-27.4 -1.8 L-30 1.5 M-27.8 -2 L-34.6 .3" stroke="#93a068" stroke-width="2.7"/></g>
    <g fill="#e6e8c8" stroke="#3d4a2a" stroke-width=".4"><circle cx="-19.2" cy=".4" r="1.6"/><circle cx="-23.3" cy="1.5" r="1.6"/><circle cx="-30.1" cy="1.6" r="1.6"/><circle cx="-34.8" cy=".4" r="1.6"/></g>
    <!-- right arm raised, holding the jar up like a lantern -->
    <path d="${ARM_R}" fill="url(#${ID}skin)"/>
    <path d="M25.6 -31.2 C27.8 -32.6 29.8 -34 31.6 -35.6 M36.6 -33.6 C36.4 -30 33.4 -26.8 29.4 -24.4 C26 -22.4 22.4 -21 19.4 -20.4" fill="none" stroke="#3d4a2a" stroke-width=".55" stroke-linecap="round"/>
    <ellipse cx="26" cy="-28" rx="7" ry="3" fill="#e9f27a" opacity=".22" transform="rotate(-28 26 -28)"/>
    <!-- the jar -->
    <g transform="translate(36.2 -36)"><g class="td-jar"><g transform="translate(-36.2 36)">
      <path d="${JAR}" fill="#e9f27a" fill-opacity=".16"/>
      ${[['f1',33,-44.6],['f2',39.6,-48.6],['f3',37.4,-40.4]].map(([c,x,y])=>`<g transform="translate(${x} ${y})"><g class="td-fly ${c}">${fly()}</g></g>`).join('')}
      <path d="${JAR}" fill="none" stroke="#e6f5f1" stroke-width=".75" opacity=".75"/>
      <path d="M30.4 -51.6 C29.4 -48 29.4 -43 30.4 -40" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" opacity=".55"/>
      <path d="M28.4 -55.8 C28 -58.6 30.4 -60 36.2 -60.2 C42 -60 44.4 -58.6 44 -55.8 C42 -54.6 30.4 -54.6 28.4 -55.8Z" fill="#c9a560" stroke="#7a5f2c" stroke-width=".5"/>
      <path d="M28.8 -56.4 C32 -55.4 40.4 -55.4 43.6 -56.4" fill="none" stroke="#b0524a" stroke-width="1.1"/>
      <path d="M43.4 -56.4 C45.6 -57.6 47.2 -56.6 46.6 -55 C46 -53.8 44.4 -54.6 43.4 -56.4 Z M43.4 -56.4 L46.4 -52.4" fill="#b0524a" stroke="#b0524a" stroke-width=".6"/>
      <!-- fingers round the bottom of the jar -->
      <path d="M31.6 -37.4 C32.6 -35 34.6 -33.8 36.6 -34" fill="none" stroke="#3d4a2a" stroke-width="3.4" stroke-linecap="round"/>
      <path d="M31.6 -37.4 C32.6 -35 34.6 -33.8 36.6 -34" fill="none" stroke="#93a068" stroke-width="2.6" stroke-linecap="round"/>
      <g fill="#e6e8c8" stroke="#3d4a2a" stroke-width=".4"><circle cx="31.4" cy="-38" r="1.5"/><circle cx="36.8" cy="-34" r="1.5"/></g>
    </g></g></g>
    <!-- fireflies that burst out on a tap -->
    ${[['o1',33,-58],['o2',38,-60],['o3',42,-57]].map(([c,x,y])=>`<g transform="translate(${x} ${y})"><g class="td-out ${c}">${fly()}</g></g>`).join('')}
  </g></g>
  </g>`;
}
window.ToadArt.TOADS.hotaru ||= {name:'Hotaru',title:'Keeper of the Lanterns',art};
})();
