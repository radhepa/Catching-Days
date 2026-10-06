/* toad-art.js · Catching Days · the pond toads (art only)
   ─────────────────────────────────────────────────────────────────────────
   Design-phase file. The production module (toads.js + toads.css) ships this
   art unchanged; nothing here reads or writes app data or storage.

   Every toad is drawn front-on, sitting, in ONE shared box so the cast lines
   up anywhere they are placed:
       viewBox  -68 -118 136 136      ground line y = 0, toad centred on x = 0
   (the pad and its ripples sit below the ground line, the prop rises above
   the head). The SVG is drawn with overflow:visible so ripples may spill out.

   ToadArt.svg(name, opts) → a complete <svg> string. Ids inside the art are
   written as __ID__… and replaced with a fresh prefix per call (the same idea
   as the catalog's __PF__), so any number of copies can share a page.
     opts.size   px, width = height (default 120)
     opts.perch  'pad'    sits on her own lily pad (water placements)
                 'ground' soft contact shadow only (paper placements)
                 'none'
     opts.water  true → slow ripple rings round the pad

   Motion is CSS (ToadArt.css). Nothing moves unless an ancestor has the class
   .td-mv, which the module sets only when the app's pondMotionOn() is true,
   so with motion off the same markup is simply a still picture.
   Class-tagged groups:
     .td-body     the whole toad (not the pad): squash-hop when tapped (.td-hop)
     .td-breathe  slow breathing
     .td-throat   the throat pouch: shallow pumping; a big croak puff on a tap
     .td-look     eyelids lift a little on hover / keyboard focus
     .td-blink    eyelids close for a blink every few seconds
     .td-gaze     pupils glance left and right now and then
     .td-sway     the prop (Hasu: her lotus-leaf parasol) sways about her grip
     .td-glint    the bead of water on the leaf catches the light
     .td-ring     ripple rings round the pad (only drawn with opts.water)
     .td-splash   rings that only play on landing after a tap
   Every moving group sits inside a translate() so its pivot is its own 0,0
   (transform-origin:0 0, transform-box:view-box) — no fill-box guessing.

   House grammar borrowed from pond-catalog.js: body gradient pearl #fff8e9 →
   body colour → deep #173a3b at the very bottom; pale highlight ellipses and
   belly shade inside a body clip; eyes #1f2e2c with a white glint; glow and
   shine are layered transparency, never an SVG filter. */
(function(){
'use strict';

const VIEWBOX='-68 -118 136 136';
const r2=n=>+n.toFixed(2);

/* ── shared bits ── */
/* a wart: a pale bump with a little shadow under it; reads on cream and on koi orange */
const wart=([x,y,r])=>`<circle cx="${r2(x+r*.3)}" cy="${r2(y+r*.45)}" r="${r}" fill="#6b4a2f" opacity=".2"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity=".42"/>`;
/* one eye: bulb, iris, pupil (horizontal, it's a toad), glint, and a heavy upper lid.
   side = 1 for the eye on the viewer's right, -1 for the left: the lid droops
   a touch at the OUTER corner, which is what makes her look unimpressed-but-kind */
function eye(cx,cy,side,ID){
  const o=side, top=r2(cy-10.2);
  const lidPath=`M${r2(cx-10.25)} ${r2(cy-.9+(o<0?.6:0))} A10.25 10.25 0 0 1 ${r2(cx+10.25)} ${r2(cy-.9+(o>0?.6:0))} C${r2(cx+6)} ${r2(cy+.5+(o>0?.2:0))} ${r2(cx-6)} ${r2(cy+.5+(o<0?.2:0))} ${r2(cx-10.25)} ${r2(cy-.9+(o<0?.6:0))}Z`;
  const lidLine=`M${r2(cx-9.7)} ${r2(cy-.55+(o<0?.55:0))} C${r2(cx-6)} ${r2(cy+.75)} ${r2(cx+6)} ${r2(cy+.75)} ${r2(cx+9.7)} ${r2(cy-.55+(o>0?.55:0))}`;
  return `<circle cx="${cx}" cy="${cy}" r="10" fill="url(#${ID}skin)"/>
    <circle cx="${cx}" cy="${r2(cy+.7)}" r="7.4" fill="url(#${ID}iris)"/>
    <circle cx="${cx}" cy="${r2(cy+.7)}" r="7.4" fill="none" stroke="#7a5326" stroke-width=".5" opacity=".7"/>
    <g transform="translate(${cx} ${r2(cy+1.2)})"><g class="td-gaze">
      <ellipse cx="0" cy="0" rx="4.6" ry="2.1" fill="#1f2e2c"/>
      <circle cx="2.1" cy=".35" r="1.2" fill="#ffffff" opacity=".9"/>
      <circle cx="-2.5" cy="1.9" r=".5" fill="#ffffff" opacity=".55"/>
    </g></g>
    <g transform="translate(${cx} ${top})"><g class="td-look"><g class="td-blink"><g transform="translate(${-cx} ${-top})">
      <path d="${lidPath}" fill="url(#${ID}skin)"/>
      <path d="M${r2(cx-7.4)} ${r2(cy-3.6)} C${r2(cx-3)} ${r2(cy-2.6)} ${r2(cx+3)} ${r2(cy-2.6)} ${r2(cx+7.4)} ${r2(cy-3.6)}" fill="none" stroke="#fff8e9" stroke-width=".75" stroke-linecap="round" opacity=".6"/>
      <path d="${lidLine}" fill="none" stroke="#4a3428" stroke-width="1.4" stroke-linecap="round"/>
    </g></g></g></g>
    ${brow(cx,cy,o,ID)}
    <path d="M${r2(cx+o*10.7)} ${r2(cy+1.4)} q${r2(o*2)} .3 ${r2(o*3.3)} 1.4" fill="none" stroke="#9c7448" stroke-width=".55" stroke-linecap="round" opacity=".38"/>`;
}
/* the heavy cranial ridge over an eye: from the inner corner, over the eye,
   out and down to the gland at the side of the head. It overhangs the lid,
   which is most of the "seen it all before" look, and bumps the head's outline */
function brow(cx,cy,o,ID){
  /* a point on the bulb's rim at angle a (0 = outer side, 90 = top) */
  const R=(a,r)=>{ const t=a*Math.PI/180; return `${r2(cx+o*r*Math.cos(t))} ${r2(cy-r*Math.sin(t))}`; };
  const sw=o>0?1:0, sb=o>0?0:1, arc=(a,b,r)=>`M${R(a,r)} A${r} ${r} 0 0 ${sw} ${R(b,r)}`;
  /* outlined only over the top, and heaviest right across the top: the lid
     reads as a thick fold of old skin, not a rim of spectacles */
  return `<path d="${arc(178,2,10)}" fill="none" stroke="#b39468" stroke-width=".6" stroke-linecap="round"/>
    <path d="${arc(150,30,9.75)}" fill="none" stroke="#b18f62" stroke-width="1.3" stroke-linecap="round" opacity=".85"/>
    <path d="${arc(128,52,9.5)}" fill="none" stroke="#a5835a" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
    <path d="${arc(145,55,8.2)}" fill="none" stroke="#fffaf0" stroke-width=".8" stroke-linecap="round" opacity=".7"/>
    <path d="M${R(200,10)} A10 10 0 0 ${sb} ${R(-20,10)}" fill="none" stroke="#9c7448" stroke-width=".6" stroke-linecap="round" opacity=".25"/>`;
}
/* the perch under any toad */
function perch(o,ID){
  if(o.perch==='ground') return `<ellipse cx="0" cy=".8" rx="50" ry="4.6" fill="#1f2e2c" opacity=".16"/><ellipse cx="0" cy=".5" rx="36" ry="2.6" fill="#1f2e2c" opacity=".14"/>`;
  if(o.perch!=='pad') return '';
  const ring=(rx,ry,c,cls,op)=>`<g transform="translate(0 6)"><g class="${cls}"><ellipse cx="0" cy="0" rx="${rx}" ry="${ry}" fill="none" stroke="${c}" stroke-width=".9" opacity="${op}"/></g></g>`;
  /* a lily pad seen nearly edge-on, notch to the front right, like the
     pad under Today's lotus; its thickness is a darker sliver under the rim */
  const pad='M0 3.5 L30.4 13.5 A62 11.5 0 1 0 12.6 14.75 Z';
  const veins=[200,225,250,275,300,325,350,15,40,140,165].map(a=>{ const t=a*Math.PI/180;
    return `M0 3.5 L${r2(57*Math.cos(t))} ${r2(3.5+10.6*Math.sin(t))}`; }).join(' ');
  return `${o.water?ring(70,13,'#cfe9e3','td-ring',.32)+ring(70,13,'#cfe9e3','td-ring two',.32):''}
    ${ring(64,11.5,'#e6f5f1','td-splash',0)}${ring(64,11.5,'#e6f5f1','td-splash two',0)}
    <path d="${pad}" transform="translate(0 1.7)" fill="#3a6a51"/>
    <path d="${pad}" fill="url(#${ID}pad)"/>
    <path d="${veins}" stroke="#a9c795" stroke-width=".5" opacity=".45" fill="none"/>
    <path d="M-61.4 2.2 C-50 -6 50 -6 61.4 2.2" fill="none" stroke="#b9d29f" stroke-width=".7" opacity=".7"/>
    <ellipse cx="0" cy="1.6" rx="47" ry="4.4" fill="#173a3b" opacity=".32"/>
    <ellipse cx="0" cy="1" rx="34" ry="2.4" fill="#173a3b" opacity=".2"/>`;
}

/* ═════════════════════════ Hasu · Keeper of the Lotus ═════════════════════════
   The oldest thing in the pond. A big, squat, koi-patterned toad, cream with
   koi-orange patches and a round orange crown spot (a tanchō koi's mark), who
   holds a lotus leaf over her head as a parasol (a nod to the frogs of the
   Chōjū-giga scrolls) and wears a string of lotus-seed beads with a jade bead.
   Viewer's right hand planted, viewer's left hand holds the stalk. */
const HASU_BODY='M0 0 C14 .5 30 -1 36 -8 C41 -14 40.5 -22 37 -28 C41 -33 44 -40 43.6 -46 C43.2 -53 37.6 -57.6 30 -59 C20 -61 -20 -61 -30 -59 C-37.6 -57.6 -43.2 -53 -43.6 -46 C-44 -40 -41 -33 -37 -28 C-40.5 -22 -41 -14 -36 -8 C-30 -1 -14 .5 0 0Z';
const HASU_ARM_R='M28.5 -34.5 C38 -34 45.6 -27.5 46.6 -18.4 C47.4 -11 44.8 -5.6 43.3 -2.4 L34.4 -2.4 C34.9 -8 34 -14 31 -19 C28.4 -23 26.4 -27.6 26.4 -31.2Z';
const HASU_ARM_L='M-28.5 -34.5 C-38 -34 -45.6 -27.5 -46.6 -18.4 C-47.4 -11 -44.8 -5.6 -43.3 -2.4 L-34.4 -2.4 C-34.9 -8 -34 -14 -31 -19 C-28.4 -23 -26.4 -27.6 -26.4 -31.2Z';
/* the koi patch over her right shoulder (viewer's right). ONE shape painted
   twice, under the arm (body clip) and on the arm (arm clip): same path, same
   gradient, so the arm's top melts into the body with no seam, and the patch
   wraps over the limb and ends in a rounded lobe, never a cut edge */
const HASU_SHOULDER='M17 -27 C19.5 -33 30 -35.5 38 -33.6 C44 -32 48 -27 48.5 -21 C48.8 -16.5 46.4 -13.2 43.6 -14 C41.4 -14.7 41.4 -18.2 39.6 -20.6 C37.4 -23.4 33.4 -23.2 30.2 -21.4 C26.4 -19.4 21.6 -19.8 18.6 -22.2 C16.6 -23.8 16.2 -25.4 17 -27Z';
/* the stalk rises from her planted left fist, clears her cheek, and bends over her head */
const HASU_STEM='M-38.8 -1.8 C-40.6 -16 -46 -30 -48.6 -46 C-50.6 -60 -46.6 -76 -30 -85 C-24 -88 -17.5 -89 -11.5 -89';
const HASU_WARTS=[[-30,-53.5,1.4],[-35.6,-46.5,1.15],[-26.6,-47.8,.9],[30,-53.8,1.3],[35,-45.4,1.1],[26.4,-47.4,.85],
  [-14.2,-49.8,.75],[14.6,-49.6,.8],[-33,-22.5,1.3],[-28,-15,1],[-36.5,-12.5,1.15],[27.2,-17.6,1.1],
  [24.6,-9,.9],[-21.5,-6.5,.8],[19.6,-5.6,.8],[-6.5,-25,.6],[7.4,-24.6,.6]];
function hasuArt(o,ID){
  /* the beads: a quadratic from shoulder to shoulder, the jade bead at the bottom */
  const B=t=>[(1-t)*(1-t)*-29+t*t*29,(1-t)*(1-t)*-26.5+2*t*(1-t)*-4+t*t*-26.5];
  const beads=[.07,.15,.23,.31,.39,.61,.69,.77,.85,.93].map(t=>{ const [x,y]=B(t);
    return `<circle cx="${r2(x)}" cy="${r2(y)}" r="2.2" fill="url(#${ID}bead)" stroke="#5e4636" stroke-width=".35"/><circle cx="${r2(x-.7)}" cy="${r2(y-.75)}" r=".65" fill="#f3d9a8" opacity=".75"/>`; }).join('');
  /* little prickles along the lotus stalk (a real lotus stalk has them) */
  const prick=[[-40.4,-13,-1],[-43.8,-25,1],[-47.2,-37,-1],[-49.7,-54,1],[-48.6,-68,-1],[-41.6,-80,1],[-32,-84.4,-1]]
    .map(([x,y,s])=>`M${x} ${y} l${s*1.3} -.8`).join(' ');
  const veinsTop=[[-52,-1.6],[-38,-3.6],[-22,-4.8],[-6,-5.1],[10,-5],[26,-4.4],[42,-2.8],[52,-.8]]
    .map(([x,y])=>`M-4 -17 Q${r2(-4+(x+4)*.45)} ${r2(-17+(y+17)*.35-1.5)} ${x} ${y}`).join(' ');
  const ribs=[[-44,3.4],[-30,4.9],[-16,5.5],[-2,5.4],[12,5.5],[26,4.9],[40,3.5]].map(([x,y])=>`M-1 -1.4 L${x} ${y}`).join(' ');
  const rim='C51 2.6 46 3.6 40 3.4 C34 5.4 27 5.2 20 4.6 C13 6.2 5 6.2 -2 5.6 C-9 6.6 -18 6.2 -24 4.8 C-31 5.8 -39 5 -44 3.6 C-50 3.8 -53 2.8 -54 1Z';
  return `<defs>
    <linearGradient id="${ID}skin" gradientUnits="userSpaceOnUse" x1="0" y1="-72" x2="0" y2="1"><stop offset="0" stop-color="#fff8e9"/><stop offset=".22" stop-color="#f6eddb"/><stop offset=".8" stop-color="#ead7b3"/><stop offset=".95" stop-color="#c9ae85"/><stop offset="1" stop-color="#173a3b"/></linearGradient>
    <radialGradient id="${ID}edge" cx=".5" cy=".44" r=".62"><stop offset=".58" stop-color="#9c7448" stop-opacity="0"/><stop offset="1" stop-color="#9c7448" stop-opacity=".42"/></radialGradient>
    <linearGradient id="${ID}koi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6a06a"/><stop offset=".45" stop-color="#ec7a45"/><stop offset="1" stop-color="#c9563a"/></linearGradient>
    <linearGradient id="${ID}koiS" gradientUnits="userSpaceOnUse" x1="0" y1="-35.5" x2="0" y2="-13.2"><stop offset="0" stop-color="#f6a06a"/><stop offset=".45" stop-color="#ec7a45"/><stop offset="1" stop-color="#c9563a"/></linearGradient>
    <radialGradient id="${ID}edgeU" gradientUnits="userSpaceOnUse" cx="0" cy="-33.84" r="57.04" gradientTransform="translate(0 -33.84) scale(1 .6957) translate(0 33.84)"><stop offset=".58" stop-color="#9c7448" stop-opacity="0"/><stop offset="1" stop-color="#9c7448" stop-opacity=".42"/></radialGradient>
    <radialGradient id="${ID}iris" cx=".45" cy=".42" r=".6"><stop offset="0" stop-color="#f8d98a"/><stop offset=".55" stop-color="#e2a63c"/><stop offset="1" stop-color="#a8702a"/></radialGradient>
    <radialGradient id="${ID}throat" cx=".5" cy=".35" r=".6"><stop offset="0" stop-color="#fffbf2"/><stop offset="1" stop-color="#efdcbb"/></radialGradient>
    <radialGradient id="${ID}bead" cx=".4" cy=".35" r=".65"><stop offset="0" stop-color="#c99a6a"/><stop offset="1" stop-color="#7a4f33"/></radialGradient>
    <radialGradient id="${ID}jade" cx=".4" cy=".35" r=".65"><stop offset="0" stop-color="#b9e6c8"/><stop offset=".5" stop-color="#7fc79a"/><stop offset="1" stop-color="#3f8a64"/></radialGradient>
    <linearGradient id="${ID}leaf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93bb86"/><stop offset=".6" stop-color="#6f9e7a"/><stop offset="1" stop-color="#4f8563"/></linearGradient>
    <linearGradient id="${ID}under" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d4e2b2"/><stop offset="1" stop-color="#a3c08a"/></linearGradient>
    <linearGradient id="${ID}pad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8db58a"/><stop offset=".55" stop-color="#6f9e7a"/><stop offset="1" stop-color="#5a8d69"/></linearGradient>
    <clipPath id="${ID}bc"><path d="${HASU_BODY}"/></clipPath>
    <clipPath id="${ID}ar"><path d="${HASU_ARM_R}"/></clipPath>
    <clipPath id="${ID}al"><path d="${HASU_ARM_L}"/></clipPath>
    <clipPath id="${ID}sh"><path d="${HASU_SHOULDER}"/></clipPath>
    <clipPath id="${ID}hl"><ellipse cx="-33" cy="-11.5" rx="18.5" ry="13" transform="rotate(-12 -33 -11.5)"/></clipPath>
  </defs>
  ${perch(o,ID)}
  <g class="td-body"><g class="td-breathe">
    <!-- haunches and hind feet, behind the body -->
    <path d="M-41 -5 C-47 -7.5 -53 -6.5 -57.5 -3.6 C-59.6 -2.3 -59.4 .2 -57 .5 C-51 1 -45 .8 -40 .2Z" fill="#e3cfa8" stroke="#b39468" stroke-width=".5"/>
    <path d="M41 -5 C47 -7.5 53 -6.5 57.5 -3.6 C59.6 -2.3 59.4 .2 57 .5 C51 1 45 .8 40 .2Z" fill="#e3cfa8" stroke="#b39468" stroke-width=".5"/>
    <g fill="#f6ecd8" stroke="#b39468" stroke-width=".4"><circle cx="-58.3" cy="-1" r="1.5"/><circle cx="-55.4" cy="-4.7" r="1.4"/><circle cx="-51.2" cy="-6.6" r="1.3"/><circle cx="58.3" cy="-1" r="1.5"/><circle cx="55.4" cy="-4.7" r="1.4"/><circle cx="51.2" cy="-6.6" r="1.3"/></g>
    <ellipse cx="-33" cy="-11.5" rx="18.5" ry="13" transform="rotate(-12 -33 -11.5)" fill="url(#${ID}skin)" stroke="#b39468" stroke-width=".55"/>
    <g clip-path="url(#${ID}hl)"><path d="M-52 -18 C-44 -25 -31 -23 -24 -15.5 C-25.5 -7 -36 -3 -46 -4.6 C-52 -8 -54 -14 -52 -18Z" fill="url(#${ID}koi)"/></g>
    <ellipse cx="33" cy="-11.5" rx="18.5" ry="13" transform="rotate(12 33 -11.5)" fill="url(#${ID}skin)" stroke="#b39468" stroke-width=".55"/>
    <!-- head and body: one heavy dumpling, the head as wide as the body -->
    <path d="${HASU_BODY}" fill="url(#${ID}skin)" stroke="#b39468" stroke-width=".6"/>
    <g clip-path="url(#${ID}bc)">
      <circle cx="0" cy="-56.6" r="7.7" fill="url(#${ID}koi)"/>
      <path d="${HASU_SHOULDER}" fill="url(#${ID}koiS)"/>
      <ellipse cx="0" cy="-14" rx="22" ry="15" fill="#fffaf0" opacity=".5"/>
      <rect x="-46" y="-62" width="92" height="64" fill="url(#${ID}edge)"/>
      <ellipse cx="-14" cy="-51" rx="13" ry="3.1" fill="#ffffff" opacity=".22" transform="rotate(-8 -14 -51)"/>
      <ellipse cx="0" cy="-2.4" rx="30" ry="3.6" fill="#173a3b" opacity=".12"/>
      <ellipse cx="-6" cy="-58.5" rx="30" ry="4.4" fill="#173a3b" opacity=".08"/>
      ${HASU_WARTS.map(wart).join('')}
    </g>
    <!-- parotoid glands: the big bumps behind a toad's eyes (frogs don't have them) -->
    <path d="M30 -59 C36.6 -61.8 44.6 -58.8 45.6 -52.6 C46.4 -48.6 45.4 -46.2 43.6 -45.2 C40 -48 35 -53 30 -59Z M-30 -59 C-36.6 -61.8 -44.6 -58.8 -45.6 -52.6 C-46.4 -48.6 -45.4 -46.2 -43.6 -45.2 C-40 -48 -35 -53 -30 -59Z" fill="url(#${ID}skin)"/>
    <path d="M30 -59 C36.6 -61.8 44.6 -58.8 45.6 -52.6 C46.4 -48.6 45.4 -46.2 43.6 -45.2 M-30 -59 C-36.6 -61.8 -44.6 -58.8 -45.6 -52.6 C-46.4 -48.6 -45.4 -46.2 -43.6 -45.2" fill="none" stroke="#b39468" stroke-width=".55"/>
    <g fill="#9c7448" opacity=".36"><circle cx="-40.6" cy="-55" r=".65"/><circle cx="-43" cy="-51" r=".55"/><circle cx="-39.4" cy="-51.4" r=".5"/><circle cx="40.6" cy="-55" r=".65"/><circle cx="43" cy="-51" r=".55"/><circle cx="39.4" cy="-51.4" r=".5"/></g>
    ${eye(-21,-58.4,-1,ID)}
    ${eye(21,-58.4,1,ID)}
    <!-- nostrils and the long lipless mouth -->
    <ellipse cx="-5.4" cy="-45.4" rx="1.15" ry=".75" fill="#3a2a22" opacity=".55"/><ellipse cx="5.4" cy="-45.4" rx="1.15" ry=".75" fill="#3a2a22" opacity=".55"/>
    <path d="M-35 -38.6 C-24 -36.6 -11 -36.2 0 -36.5 C11 -36.2 24 -36.6 35 -38.6" fill="none" stroke="#fff8e9" stroke-width=".85" stroke-linecap="round" opacity=".55" transform="translate(0 -1.35)"/>
    <path d="M-35 -38.6 C-24 -36.6 -11 -36.2 0 -36.5 C11 -36.2 24 -36.6 35 -38.6" fill="none" stroke="#3a2a22" stroke-width="1.45" stroke-linecap="round" opacity=".8"/>
    <path d="M-35 -38.6 C-36.6 -38.3 -37.3 -37.1 -36.9 -35.8 M35 -38.6 C36.6 -38.3 37.3 -37.1 36.9 -35.8" fill="none" stroke="#3a2a22" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>
    <!-- lotus-seed beads, a jade bead and a koi-orange tassel -->
    <path d="M-29 -26.5 Q-1.45 -5.13 26.1 -24.36" fill="none" stroke="#5e4636" stroke-width=".6" opacity=".8"/>
    ${beads}
    <path d="M-1.1 -11 L-1.8 -5.4 M0 -11 L0 -4.8 M1.1 -11 L1.8 -5.4" stroke="#ec7a45" stroke-width=".9" stroke-linecap="round"/>
    <circle cx="0" cy="-13.4" r="3.2" fill="url(#${ID}jade)" stroke="#2f6a4c" stroke-width=".4"/>
    <circle cx="-1" cy="-14.5" r=".9" fill="#ffffff" opacity=".7"/>
    <!-- the throat pouch -->
    <g transform="translate(0 -35.2)"><g class="td-throat"><g transform="translate(0 35.2)">
      <ellipse cx="0" cy="-29" rx="15.6" ry="6.3" fill="url(#${ID}throat)"/>
      <ellipse cx="-4.4" cy="-30.8" rx="5" ry="1.4" fill="#ffffff" opacity=".4"/>
    </g></g></g>
    <!-- the planted arm (viewer's right). Its top is painted exactly like the
         body under it (same skin, same shoulder patch, same edge shade), so the
         shoulder melts in. The outline picks up the body's contour right where
         the arm crosses it (39.1,-30.96) and runs on down: one line, no gap.
         koiS and edgeU are user-space twins of the body's paint, so a thin
         stroke of them can cover the hidden top edge, where two anti-aliased
         layers would otherwise leave a faint light hairline -->
    <path d="${HASU_ARM_R}" fill="url(#${ID}skin)"/>
    <g clip-path="url(#${ID}ar)">
      <path d="${HASU_SHOULDER}" fill="url(#${ID}koiS)"/>
      <rect x="-70" y="-62" width="140" height="70" fill="url(#${ID}edgeU)"/>
      ${[[40.6,-22.5,1],[44,-11.6,.9],[38.4,-9.2,.8]].map(wart).join('')}
    </g>
    <g clip-path="url(#${ID}sh)" fill="none" stroke-width="1.1">
      <path d="M31 -19 C28.4 -23 26.4 -27.6 26.4 -31.2 L28.5 -34.5 C32.48 -34.29 36.13 -33.03 39.1 -30.96" stroke="url(#${ID}koiS)"/>
      <path d="M31 -19 C28.4 -23 26.4 -27.6 26.4 -31.2 L28.5 -34.5 C32.48 -34.29 36.13 -33.03 39.1 -30.96" stroke="url(#${ID}edgeU)"/>
    </g>
    <path d="M39.1 -30.96 C43.21 -28.1 46.02 -23.69 46.6 -18.4 C47.4 -11 44.8 -5.6 43.3 -2.4 M34.4 -2.4 C34.9 -8 34 -14 31 -19" fill="none" stroke="#b39468" stroke-width=".55" stroke-linecap="round"/>
    <path d="M31 -19 C30 -20.8 29.2 -22.4 28.6 -24" fill="none" stroke="#b39468" stroke-width=".45" stroke-linecap="round" opacity=".55"/>
    <ellipse cx="39" cy="-1.9" rx="6.4" ry="2.9" fill="#e9d6b2" stroke="#b39468" stroke-width=".5"/>
    <g stroke-linecap="round"><path d="M38.6 -2 L29.6 .5 M38.8 -1.8 L34.6 1.7 M39.4 -1.8 L42.6 1.8 M39.8 -2 L48.4 .4" stroke="#b39468" stroke-width="4.1"/><path d="M38.6 -2 L29.6 .5 M38.8 -1.8 L34.6 1.7 M39.4 -1.8 L42.6 1.8 M39.8 -2 L48.4 .4" stroke="#ecdcbc" stroke-width="3.2"/></g>
    <g fill="#f8efdc" stroke="#b39468" stroke-width=".4"><circle cx="29.4" cy=".6" r="1.9"/><circle cx="34.5" cy="1.8" r="1.9"/><circle cx="42.7" cy="1.9" r="1.9"/><circle cx="48.6" cy=".5" r="1.9"/></g>
    <!-- the other arm (viewer's left), planted too: its fist holds the stalk -->
    <path d="${HASU_ARM_L}" fill="url(#${ID}skin)"/>
    <path d="M-36.6 -33.6 C-42.6 -31 -46.2 -25.4 -46.6 -18.4 C-47.4 -11 -44.8 -5.6 -43.3 -2.4 M-34.4 -2.4 C-34.9 -8 -34 -14 -31 -19 C-30 -20.8 -29.2 -22.4 -28.6 -24" fill="none" stroke="#b39468" stroke-width=".55" stroke-linecap="round"/>
    <g clip-path="url(#${ID}al)"><path d="M-47 -20 C-47 -10 -45 -5 -43.4 -2.4 L-40 -2.4 C-42 -8 -43 -14 -42.4 -20Z" fill="#9c7448" opacity=".12"/>
      ${[[-40.6,-22.5,1],[-44,-15.4,.9],[-36.6,-28.6,.8]].map(wart).join('')}</g>
    <ellipse cx="-39.2" cy="-2.1" rx="6.6" ry="3" fill="#e9d6b2" stroke="#b39468" stroke-width=".5"/>
  </g>
  <!-- the parasol: a lotus leaf on its own curving stalk, swaying from her grip -->
  <g transform="translate(-38.8 -4.5)"><g class="td-sway"><g transform="translate(38.8 4.5)">
    <path d="${HASU_STEM}" fill="none" stroke="#3f6f55" stroke-width="3.4" stroke-linecap="round"/>
    <path d="${HASU_STEM}" fill="none" stroke="#7fa878" stroke-width="2.3" stroke-linecap="round"/>
    <path d="${HASU_STEM}" fill="none" stroke="#b9d29f" stroke-width=".7" stroke-linecap="round" opacity=".7" transform="translate(-.6 0)"/>
    <path d="${prick}" stroke="#3f6f55" stroke-width=".55" stroke-linecap="round"/>
    <g transform="translate(-11 -88.6) rotate(-7) scale(.92)">
      <path d="M-54 1 C-38 -4 38 -5 54 0 ${rim}" fill="url(#${ID}under)"/>
      <path d="${ribs}" stroke="#89a874" stroke-width=".55" opacity=".75"/>
      <path d="M-54 1 C-50 -9 -33 -17.6 -4 -18.4 C26 -18.4 48 -12 54 0 C38 -5 -38 -4 -54 1Z" fill="url(#${ID}leaf)" stroke="#4f8563" stroke-width=".7"/>
      <path d="${veinsTop}" fill="none" stroke="#acc99a" stroke-width=".55" opacity=".6"/>
      <ellipse cx="-4" cy="-17.1" rx="3.3" ry="1.1" fill="#c3d9a9" opacity=".85"/>
      <ellipse cx="-22" cy="-11" rx="16" ry="3.2" fill="#e3efe2" opacity=".26" transform="rotate(-9 -22 -11)"/>
      <path d="M-54 1 ${rim}" fill="none" stroke="#5f8a5a" stroke-width=".55"/>
      <ellipse cx="16.4" cy="-10.9" rx="1.7" ry=".5" fill="#3f6f55" opacity=".35"/>
      <circle cx="16" cy="-12.5" r="1.9" fill="#e8f4f0" opacity=".92"/>
      <g transform="translate(15.3 -13.2)"><g class="td-glint"><circle cx="0" cy="0" r=".7" fill="#ffffff"/></g></g>
    </g>
  </g></g></g>
  <!-- her fingers round the stalk, over it -->
  <g class="td-grip">
    <path d="M-45.6 -6.4 C-46 -2.6 -45 .2 -42.2 .9 L-36.4 .9 C-33.8 .5 -33 -2 -33.2 -4.6 C-33.4 -7.6 -35 -9.4 -37.8 -9.6 C-41.4 -9.9 -45.2 -9.4 -45.6 -6.4Z" fill="#ecdcbc" stroke="#b39468" stroke-width=".55"/>
    <path d="M-33.6 -6.2 C-35.2 -6.6 -36.6 -6.4 -37.6 -5.6 M-33.4 -2.8 C-35 -3.3 -36.4 -3.1 -37.4 -2.3" fill="none" stroke="#b39468" stroke-width=".55" stroke-linecap="round"/>
    <ellipse cx="-41" cy="-7.6" rx="3.2" ry="1.1" fill="#fffaf0" opacity=".55"/>
    <circle cx="-48.2" cy=".4" r="1.8" fill="#f8efdc" stroke="#b39468" stroke-width=".4"/>
  </g>
  </g>`;
}

const TOADS={
  hasu:{name:'Hasu',title:'Keeper of the Lotus',art:hasuArt},
};

/* ── motion ──
   Only inside .td-mv (motion on). .td-hop is added to the toad's own button
   for ~0.9 s when it's tapped. Durations differ so the loops never line up. */
const CSS=`
.td-art{display:block;overflow:visible}
.td-art .td-body,.td-art .td-breathe,.td-art .td-throat,.td-art .td-look,.td-art .td-blink,.td-art .td-gaze,
.td-art .td-sway,.td-art .td-glint,.td-art .td-ring,.td-art .td-splash{transform-box:view-box;transform-origin:0 0}
.td-art .td-look{transition:transform .35s cubic-bezier(.3,1.4,.5,1)}
.td-mv .td-breathe{animation:td-breathe 4.6s ease-in-out infinite}
.td-mv .td-throat{animation:td-throat 2.3s ease-in-out infinite}
.td-mv .td-blink{animation:td-blink 7.3s ease-in-out infinite}
.td-mv .td-gaze{animation:td-gaze 13s ease-in-out infinite}
.td-mv .td-sway{animation:td-sway 6.2s ease-in-out infinite}
.td-mv .td-glint{animation:td-glint 5.4s ease-in-out infinite}
.td-mv .td-ring{animation:td-ring 5.2s ease-out infinite}
.td-mv .td-ring.two{animation-delay:-2.6s}
@keyframes td-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,1.024)}}
@keyframes td-throat{0%,100%{transform:scale(1,1)}50%{transform:scale(1.05,1.16)}}
@keyframes td-blink{0%,91%,96%,100%{transform:scaleY(1)}93%,94%{transform:scaleY(1.92)}}
@keyframes td-gaze{0%,36%,92%,100%{transform:translate(0,0)}40%,56%{transform:translate(-1.5px,.2px)}60%,76%{transform:translate(1.3px,.3px)}80%{transform:translate(0,0)}}
@keyframes td-sway{0%,100%{transform:rotate(-1.3deg)}50%{transform:rotate(1.5deg)}}
@keyframes td-glint{0%,70%,100%{transform:scale(1);opacity:.9}80%{transform:scale(1.9);opacity:1}88%{transform:scale(1);opacity:.7}}
@keyframes td-ring{0%{transform:scale(.82);opacity:0}25%{opacity:1}100%{transform:scale(1.22);opacity:0}}
/* hover / keyboard focus: she looks up at you (the lids lift) */
:hover>.td-art .td-look,:focus-visible>.td-art .td-look{transform:scaleY(.72)}
/* a tap: squash, hop, land, and a croak */
.td-mv.td-hop .td-body{animation:td-hop .86s cubic-bezier(.3,.7,.4,1)}
.td-mv.td-hop .td-throat{animation:td-croak .86s ease-out}
.td-mv.td-hop .td-splash{animation:td-splash .9s ease-out .5s both}
.td-mv.td-hop .td-splash.two{animation-delay:.64s}
@keyframes td-hop{0%{transform:none}14%{transform:scale(1.08,.88)}42%{transform:translateY(-10px) scale(.95,1.08)}66%{transform:translateY(0) scale(1.07,.9)}82%{transform:scale(.985,1.025)}100%{transform:none}}
@keyframes td-croak{0%,18%{transform:scale(1,1)}44%{transform:scale(1.5,2.25)}60%{transform:scale(1.46,2.15)}80%{transform:scale(.96,.92)}100%{transform:scale(1,1)}}
@keyframes td-splash{0%{transform:scale(.7);opacity:.85}100%{transform:scale(1.35);opacity:0}}
/* while she talks (the dialogue portrait): the throat flutters with the words */
.td-mv.td-talking .td-throat{animation:td-throat .42s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){
  .td-art *{animation:none!important}
  .td-art .td-look{transition:none}
}
`;

let seq=0;
function svg(name,opts){
  const t=TOADS[name]; if(!t) return '';
  const o=Object.assign({size:120,perch:'pad',water:false},opts||{});
  const ID='td'+(++seq)+'_';
  return `<svg class="td-art td-${name}" width="${o.size}" height="${o.size}" viewBox="${VIEWBOX}" aria-hidden="true" focusable="false">${t.art(o,ID)}</svg>`;
}
function injectCSS(){
  if(document.getElementById('td-art-css')) return;
  const s=document.createElement('style'); s.id='td-art-css'; s.textContent=CSS; document.head.appendChild(s);
}

window.ToadArt={VIEWBOX,TOADS,svg,css:CSS,injectCSS};
})();
