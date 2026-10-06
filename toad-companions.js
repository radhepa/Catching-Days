/* toad-companions.js · Catching Days · the four companions, drawn live so they can move
   ─────────────────────────────────────────────────────────────────────────
   The drawings are sprites/toads/*.svg: Neri and Oto from
   toads-design/new-pair/design-source.cjs (neri(), oto()), Kuri and Mame from
   revised-concepts.cjs (art(child)). The functions below are those, unchanged
   except that the moving parts now sit in class-tagged groups, each inside a
   translate() so its pivot is its own 0,0 (the cast's convention). Extra
   pieces that only appear in motion (Oto's blush and notes, Neri's gold sheen
   and glint, Kuri's seedling, Mame's "!", "?" and landing ring) carry
   opacity="0", so a still drawing is the sprite, pixel for pixel.

   Used only by the Collection's toad encyclopedia (toad-collection.js). These
   four are deliberately NOT added to window.ToadArt.TOADS, so the five-keeper
   runtime (toads.js) never places, talks for or remembers them.
     ToadCompanions.svg(name,{size})  → a complete <svg> string ('' if unknown)
     ToadCompanions.has(name)

   Motion is CSS and, like the keepers, only runs under a .td-mv ancestor;
   ToadArt.css's reduced-motion rule stops it as well. Breathing, the throat,
   blinks and glances reuse the ToadArt / ToadCast classes.
     Neri (7.2 s)  wags her trimming paddle while she talks, then turns the
                   repaired bowl so its gold seam comes round to face you; the
                   gold catches the light while she glances down at it.
     Oto  (6.8 s)  blushes when you look at him and glances away; then plays,
                   lids half down: the flute sways, his fingers lift, and a note
                   drifts from the flute's end with each throat puff. The last
                   note squeaks: he startles and blinks twice. The loose red
                   thread at the binding swings the whole time.
     Kuri (8 s)    when he wakes, a seedling pushes up from a pinch of soil
                   and opens two leaves (it stays while he's awake); his
                   seeing eye checks on it, then a slow heavy blink and a small
                   nod. Slow breathing. The blind eye's glints never glance.
     Mame (6 s)    when he wakes, a "!" and an excited hop that jostles his
                   leaf boat and rings the water; then he watches the boat rock
                   (sail fluttering), looks back up with his head tilted, and a
                   "?" rises while his throat chatters.
   Every loop starts at the rest pose, so a portrait never jumps when it wakes. */
(function(){
'use strict';

const VIEWBOX='-68 -118 136 136';
const grad=(id,a,b)=>`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
function face(H,id,p,x,y,r,lids,mouth){
  const P={eye:'eye',iris:'iris',line:p.line,fold:p.fold,fold2:p.line,lidLine:p.dark,ring:p.ring,hi:p.hi};
  return H.eye(-x,y,{r,lid:lids[0],side:-1},P,id)+H.eye(x,y,{r,lid:lids[1],side:1},P,id)+
    `<g fill="${p.dark}" opacity=".55"><ellipse cx="-4.5" cy="${y+11}" rx="1" ry=".7"/><ellipse cx="4.5" cy="${y+11}" rx="1" ry=".7"/></g>
    <path d="${mouth}" fill="none" stroke="${p.hi}" stroke-width=".8" stroke-linecap="round" opacity=".55" transform="translate(0 -1.3)"/>
    <path d="${mouth}" fill="none" stroke="${p.dark}" stroke-width="1.45" stroke-linecap="round" opacity=".82"/>`;
}
function fluteHands(front=false){
  // Both palms and fingers use the flute's coordinates, so neither wrist floats.
  // The front fingers sit in .tcp-fing so they can lift off the holes.
  return `<g transform="translate(0 -17) rotate(-9)">${[-25,25].map((x,i)=>`<g transform="translate(${x} 0) scale(${x<0?-1:1} 1)">${front?`<g class="tcp-fing f${i+1}">
    <path d="M-5 -1.3 C-5.6 -3 -4.1 -4 -2.8 -3.5 C-1.9 -4.5 -.1 -4.4 .8 -3.4 C2 -4.2 3.9 -3.8 4.2 -2.4 L5 1.3 C5.8 3.6 3.6 4.8 1.1 4.3 L-2.7 3.7 C-4.8 3.4 -5.4 1.2 -5 -1.3Z" fill="#b4a2b4" stroke="#655a6a" stroke-width=".55"/>
    <path d="M-4.5 -.7 Q-2.8 -1.2 -1.2 -.3 M-4.3 1.5 Q-2.8 1 -1.3 1.7" fill="none" stroke="#655a6a" stroke-width=".55" stroke-linecap="round"/>
    <path d="M3 -3.2 Q5 -2.8 5.6 -.6 Q6.4 1 4.6 1.5 L2.3 -.6 Q1.3 -2.1 3 -3.2Z" fill="#b4a2b4" stroke="#655a6a" stroke-width=".5" stroke-linejoin="round"/>
    <path d="M-3.4 -2.7 Q-2.6 -3.1 -1.9 -2.7 M.5 -2.8 Q1.2 -3.1 2 -2.7" fill="none" stroke="#e5d8d7" stroke-width=".7" stroke-linecap="round"/>
  </g>`:`<path d="M-5 0 C-6 1 -5 4 -3 4.5 L3 4.5 Q6 4 5 0Z" fill="#b4a2b4" stroke="#655a6a" stroke-width=".5"/>`}</g>`).join('')}</g>`;
}
function hindFeet(id,line,palm,hi,x,k=1){
  // Hasu/Tabi's rounded planted digits, with a short ankle that shares the
  // body's user-space shading and covers its hidden haunch contour.
  return [-1,1].map(s=>{
    const y=v=>v*k, px=v=>s*(x+v*k);
    return `<ellipse cx="${s*x}" cy="${y(2.1)}" rx="${10*k}" ry="${1.3*k}" fill="#173a3b" opacity=".18"/>
    <path d="M${px(-9)} ${y(-14)} C${px(-3)} ${y(-15)} ${px(2)} ${y(-13)} ${px(4.5)} ${y(-9)} C${px(6)} ${y(-6)} ${px(5)} ${y(-3)} ${px(3.5)} ${y(-1.9)} L${px(-3.8)} ${y(-1.9)} C${px(-3.8)} ${y(-5)} ${px(-5.6)} ${y(-7)} ${px(-8.5)} ${y(-9)}Z" fill="url(#${id}skin)"/>
    <path d="M${px(1)} ${y(-12)} C${px(4)} ${y(-10)} ${px(6)} ${y(-6)} ${px(5)} ${y(-3)} M${px(-3.8)} ${y(-3)} C${px(-3.8)} ${y(-5)} ${px(-5)} ${y(-7)} ${px(-6)} ${y(-8)}" fill="none" stroke="${line}" stroke-width=".55" stroke-linecap="round"/>
    <g transform="translate(${s*x} 0) scale(${s*k} ${k})">
      <ellipse cy="-1.9" rx="6.4" ry="2.8" fill="${palm}"/>
      <path d="M-5.9 -2.3 C-7 -.3 -4.8 1.2 -.7 1 M.6 1 Q5.4 1.3 6.2 -1.4" fill="none" stroke="${line}" stroke-width=".5" stroke-linecap="round"/>
      <g fill="none" stroke-linecap="round">
        <path d="M-.4 -2 L-7 .4 M-.2 -1.8 L-3.5 1.8 M.4 -1.8 L3.8 1.9 M.8 -2 L8.5 .4" stroke="${line}" stroke-width="3.6"/>
        <path d="M-.4 -2 L-7 .4 M-.2 -1.8 L-3.5 1.8 M.4 -1.8 L3.8 1.9 M.8 -2 L8.5 .4" stroke="${palm}" stroke-width="2.8"/>
      </g>
      <g fill="${hi}" stroke="${line}" stroke-width=".35"><circle cx="-7" cy=".4" r="1.6"/><circle cx="-3.5" cy="1.8" r="1.6"/><circle cx="3.8" cy="1.9" r="1.6"/><circle cx="8.5" cy=".4" r="1.6"/></g>
    </g>`;
  }).join('');
}
/* a pivot wrapper: the group's own 0,0 sits at (x,y) */
const pivot=(x,y,cls,inner,attr='')=>`<g transform="translate(${x} ${y})"><g class="${cls}"${attr}><g transform="translate(${-x} ${-y})">${inner}</g></g></g>`;

/* ═════════════════════ Neri · Keeper of the Kiln ═════════════════════ */
function neri(H,id){
  const body='M0 0 C18 .5 35 -1 41 -9 C47 -16 45 -26 40 -31 C42 -38 42 -45 38 -49 C31 -56 17 -57 0 -57 C-17 -57 -31 -56 -38 -49 C-42 -45 -42 -38 -40 -31 C-45 -26 -47 -16 -41 -9 C-35 -1 -18 .5 0 0Z';
  const bowl='M-25 -15 Q-22 -1 0 .2 Q22 -1 25 -15Z';
  const seam='M10 -13 L7 -9 L9 -6 L5 -1 M7 -9 L12 -7';
  const p={line:'#8d6159',fold:'#a7796a',dark:'#492f2b',ring:'#66703a',hi:'#fff0df'};
  return `<defs>
    ${H.skinDef(id,'skin',-63,[[0,'#f9eee3'],[.23,'#dfb19b'],[.65,'#bc8478'],[.94,'#946359'],[1,'#173a3b']])}
    ${H.eyeDefs(id,'#f7e8d9','#c5907d',['#f2edbd','#b7bc70','#727d42'])}
    ${grad(id+'cloth','#526d73','#304d57')}${grad(id+'clay','#e8cdb2','#aa8065')}
    <radialGradient id="${id}throat" cx=".4" cy=".25" r=".7"><stop stop-color="#fff1de"/><stop offset="1" stop-color="#e1bba2"/></radialGradient>
    <clipPath id="${id}bc"><path d="${body}"/></clipPath>
    <clipPath id="${id}bowl"><path d="${bowl}"/><ellipse cy="-15" rx="25" ry="4.1"/></clipPath>
  </defs>
  <g class="td-cast">
  ${H.ground(48)}
  <path d="M-52 1 Q-53 -3 -46 -4 L46 -4 Q53 -3 52 1 L51 7 Q0 12 -51 7Z" fill="#b69079" stroke="#7f6252" stroke-width=".5"/>
  <path d="M-48 -1 Q0 -4 48 -1" fill="none" stroke="#ebd0b7" stroke-width=".8" opacity=".65"/>
  ${H.contact(41)}
  <g class="td-body"><g class="td-breathe">
  <path d="${body}" fill="url(#${id}skin)" stroke="${p.line}" stroke-width=".6"/>
  <g clip-path="url(#${id}bc)">
    <ellipse cy="-16" rx="24" ry="15" fill="#f5ddc7" opacity=".48"/>
    <path d="M-36 -49 Q-29 -48 -31 -37 Q-41 -32 -40 -41Z M28 -52 Q38 -50 38 -43 Q29 -42 26 -47Z" fill="#986051" opacity=".28"/>
    ${[[-34,-43,1.2],[-29,-38,.9],[32,-44,1.1],[36,-37,.8],[-14,-47,.65],[14,-46,.7],[-37,-23,1.2],[37,-21,1],[-30,-11,.9]].map(w=>H.wart(w,'#693e34',.22)).join('')}
    <ellipse cx="-12" cy="-51" rx="13" ry="2.8" fill="#fff" opacity=".22" transform="rotate(-8 -12 -51)"/>
  </g>
  ${hindFeet(id,p.line,'#c39380','#efd2bd',42)}
  <path d="M29 -54 C35 -56 41 -53 42 -48 C43 -44 42 -42 40.5 -41 C38 -45 33 -50 29 -54Z M-29 -54 C-35 -56 -41 -53 -42 -48 C-43 -44 -42 -42 -40.5 -41 C-38 -45 -33 -50 -29 -54Z" fill="url(#${id}skin)"/>
  <path d="M29 -54 C35 -56 41 -53 42 -48 C43 -44 42 -42 40.5 -41 M-29 -54 C-35 -56 -41 -53 -42 -48 C-43 -44 -42 -42 -40.5 -41" fill="none" stroke="${p.line}" stroke-width=".55"/>
  <g fill="#724b40" opacity=".3"><circle cx="38" cy="-49" r=".55"/><circle cx="40" cy="-46" r=".5"/><circle cx="-38" cy="-49" r=".55"/><circle cx="-40" cy="-46" r=".5"/></g>
  ${face(H,id,p,18.2,-53,9,[.9,1.5],'M-31 -37 Q-15 -34.6 0 -35 Q16 -34.5 31 -38.2')}
  <path d="M-31 -37 Q-33 -36.5 -32.5 -34.5 M31 -38.2 Q33 -38.8 33.5 -40" fill="none" stroke="${p.dark}" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>
  ${pivot(0,-33.2,'td-throat',`<ellipse cy="-28.4" rx="13.5" ry="4.8" fill="url(#${id}throat)"/><ellipse cx="-3.5" cy="-30" rx="4" ry="1.2" fill="#fff" opacity=".32"/>`)}
  <path d="M-20 -22 Q0 -18 20 -22 L23 -5 Q0 0 -23 -5Z" fill="url(#${id}cloth)" stroke="#30454b" stroke-width=".5"/>
  <path d="M-20 -22 Q0 -18 20 -22 M-17 -18 L-18 -9 M16 -18 L17 -8" fill="none" stroke="#94aaa7" stroke-width=".7" opacity=".55"/>
  <path d="M-19 -10 L-10 -10 L-10 -4 L-19 -5Z" fill="#738c8c"/><path d="M-18 -9 L-16 -8 M-14 -9 L-12 -8 M-12 -6 L-14 -5" stroke="#e2d2b2" stroke-width=".5"/>
  <path d="M-32 -28 C-41 -28 -47 -23 -46 -17 C-45 -10 -39 -6 -31 -7 L-22 -10 L-25 -15 C-30 -12 -36 -13 -36 -18 C-36 -21 -33 -23 -30 -24Z M33 -28 C40 -29 46 -25 47 -20 C49 -14 47 -9 42 -8 C37 -7 34 -10 34 -13 C34 -16 37 -18 40 -20 L42 -23 C39 -24 36 -24 33 -22Z" fill="url(#${id}skin)"/>
  <path d="M-40 -27 C-44 -25 -47 -21 -46 -17 C-45 -10 -39 -6 -31 -7 L-24 -9 M-26 -14 C-31 -12 -36 -13 -36 -18 C-36 -20 -35 -21 -34 -22 M40 -27 C44 -25 46 -23 47 -20 C49 -14 47 -9 42 -8 C37 -7 34 -10 34 -13 C34 -16 37 -18 40 -20" fill="none" stroke="${p.line}" stroke-width=".55" stroke-linecap="round"/>
  ${[[-41,-20,1],[44,-12,.9]].map(w=>H.wart(w,'#693e34',.22)).join('')}
  <path d="${bowl}" fill="url(#${id}clay)" stroke="#8b6952" stroke-width=".6"/>
  <ellipse cy="-15" rx="25" ry="4.1" fill="#f0d9bf" stroke="#8b6952" stroke-width=".6"/>
  <ellipse cy="-15" rx="21.6" ry="2.5" fill="#937663"/><path d="M-19 -15.8 Q-3 -18 16 -16" fill="none" stroke="#b89b80" stroke-width=".65"/>
  <!-- the gold repair turns with the bowl: it slides round inside the bowl's own outline -->
  <g clip-path="url(#${id}bowl)">${pivot(8.5,-7,'tcp-turn',`<path d="${seam}" fill="none" stroke="#d9b261" stroke-width=".9" stroke-linecap="round"/>
    <path d="${seam}" fill="none" stroke="#fff4c8" stroke-width=".9" stroke-linecap="round" opacity="0" class="tcp-sheen"/>`)}</g>
  <path d="M-19 -11 Q-17 -5 -8 -3" fill="none" stroke="#f8e5ca" stroke-width=".8" opacity=".5"/>
  ${pivot(-3.3,-9.2,'tcp-star',`<path d="M-3.3 -12.6 L-2.75 -9.75 L.1 -9.2 L-2.75 -8.65 L-3.3 -5.8 L-3.85 -8.65 L-6.7 -9.2 L-3.85 -9.75Z" fill="#fff6d4"/><circle cx="-3.3" cy="-9.2" r=".8" fill="#fff"/>`,' opacity="0"')}
  <path d="M-29 -14 C-33 -15 -35 -12 -33 -9 C-31 -6 -27 -5 -23 -7 L-20 -9 C-19 -10 -20 -12 -22 -12 L-27 -10 C-27 -12 -27 -13 -29 -14Z" fill="#ddb29a" stroke="${p.line}" stroke-width=".55"/>
  <path d="M-28 -9 Q-25 -7.5 -21 -10 M-31 -11 Q-31 -8.5 -28 -8 M-27 -13 Q-26 -15 -24 -14" fill="none" stroke="${p.line}" stroke-width=".55" stroke-linecap="round"/>
  <path d="M-32 -12 Q-31 -13 -29 -12.5" fill="none" stroke="#f6ddc8" stroke-width=".8" stroke-linecap="round"/>
  <!-- the trimming paddle wags from the fist (the fist's centre is its pivot) -->
  <g transform="translate(38 -3) rotate(22)">${pivot(0,-16.8,'tcp-wag',`
    <path d="M-4 -20 C-6 -19 -6 -15 -3 -13 L3 -13 C5 -14 5 -18 3 -20Z" fill="#c99986" stroke="${p.line}" stroke-width=".5"/>
    <path d="M-1 0 L-1 -29 Q-5 -36 0 -39 Q5 -36 1 -29 L1 0Z" fill="#d7bd8a" stroke="#856a42" stroke-width=".5"/>
    <path d="M-.1 -4 L-.1 -28 M-2 -33 L2 -33" stroke="#f0ddad" stroke-width=".6"/>
    <path d="M3 -21 C.5 -22 -3 -21 -3.5 -18.5 L-3.5 -15.5 C-3.5 -13.5 -1 -12.5 1.5 -13 Q4 -13.5 4.5 -16.5 L4 -19.2 Q3.5 -20.5 3 -21Z" fill="#ddb29a" stroke="${p.line}" stroke-width=".55"/>
    <path d="M4 -18.5 Q1.5 -19.2 -.2 -18.3 M4.5 -15.8 Q1.9 -16.5 .2 -15.6" fill="none" stroke="${p.line}" stroke-width=".55" stroke-linecap="round"/>
    <path d="M-3 -20.5 Q-5.7 -20 -5.4 -17.5 Q-4 -16 -1.7 -17 L.6 -18.1" fill="#ddb29a" stroke="${p.line}" stroke-width=".55" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M-1.7 -20 Q.2 -20.7 1.8 -20.1" fill="none" stroke="#f6ddc8" stroke-width=".8" stroke-linecap="round"/>`)}
  </g>
  </g></g>
  </g>`;
}

/* ═════════════════════ Oto · Keeper of the Reeds ═════════════════════ */
/* a music note, head at 0,0 */
const NOTE='<ellipse rx="2.2" ry="1.6" transform="rotate(-22)" stroke="none"/><path d="M1.9 -.7 L1.9 -8.4 Q5 -6.8 4.5 -3.6" fill="none" stroke-width=".95" stroke-linecap="round" stroke-linejoin="round"/>';
const NOTES2='<ellipse rx="2.1" ry="1.5" transform="rotate(-22)" stroke="none"/><ellipse cx="5.4" cy="-1.5" rx="2.1" ry="1.5" transform="rotate(-22 5.4 -1.5)" stroke="none"/><path d="M1.8 -.6 L1.8 -8.4 M7.2 -2.1 L7.2 -9.9" fill="none" stroke-width=".95" stroke-linecap="round"/><path d="M1.8 -8.4 L7.2 -9.9" fill="none" stroke-width="1.7" stroke-linecap="round"/>';
/* the squeak: a note knocked sideways, with three little burst marks */
const SQUEAK=NOTE+'<path d="M-4.6 -6.6 L-3 -5.2 M-5.2 -2.4 L-3.3 -2.3 M6.6 -9.6 L5.4 -8" fill="none" stroke-width=".8" stroke-linecap="round"/>';
function oto(H,id){
  const body='M0 0 C14 .5 28 -2 33 -9 C38 -17 36 -25 33 -31 C35 -39 35 -47 31 -54 C27 -62 14 -65 0 -64 C-16 -66 -28 -61 -32 -54 C-36 -47 -34 -38 -33 -31 C-36 -24 -38 -17 -33 -9 C-28 -2 -14 .5 0 0Z';
  const p={line:'#655a6a',fold:'#817181',dark:'#302b39',ring:'#816137',hi:'#f1e9e1'};
  const note=(cls,art)=>`<g transform="translate(51 -28.5)"><g class="tcp-note ${cls}" opacity="0" fill="#f6eedf" stroke="#f6eedf">${art}</g></g>`;
  return `<defs>
    ${H.skinDef(id,'skin',-72,[[0,'#ece5e4'],[.22,'#c3b2bf'],[.62,'#94869e'],[.94,'#6e637c'],[1,'#173a3b']])}
    ${H.eyeDefs(id,'#e9e1df','#a191a9',['#f9dbae','#d1a367','#8c623c'])}
    ${grad(id+'linen','#e6d7b7','#ac9c7f')}${grad(id+'bamboo','#e3c996','#a88a58')}
    <radialGradient id="${id}throat" cx=".4" cy=".25" r=".7"><stop stop-color="#f1e9df"/><stop offset="1" stop-color="#c2afb9"/></radialGradient>
    <clipPath id="${id}bc"><path d="${body}"/></clipPath>
  </defs>
  <g class="td-cast">
  ${H.ground(43)}
  <path d="M-47 -3 L43 -3 L48 6 Q0 12 -48 6Z" fill="#aa9673" stroke="#6f6650" stroke-width=".5"/>
  ${Array.from({length:13},(_,i)=>`<path d="M${-42+i*7} -2 L${-44+i*7.3} 6" stroke="#d8c69d" stroke-width=".6" opacity=".65"/>`).join('')}
  <path d="M-45 1 L45 1 M-46 4 L46 4 M-44 7 L-48 9 M-40 7 L-43 9 M43 7 L47 9" stroke="#776b51" stroke-width=".55" opacity=".6"/>
  ${H.contact(33)}
  <g class="td-body"><g class="td-breathe">
  <path d="${body}" fill="url(#${id}skin)" stroke="${p.line}" stroke-width=".6"/>
  <g clip-path="url(#${id}bc)">
    <ellipse cy="-16" rx="19" ry="14" fill="#dfd2d0" opacity=".42"/>
    <path d="M-31 -50 Q-23 -48 -27 -36 Q-37 -35 -35 -42Z M25 -52 Q34 -47 31 -38 Q25 -38 22 -44Z" fill="#635574" opacity=".28"/>
    ${[[-27,-48,1.1],[-29,-39,.8],[27,-46,1],[29,-37,.9],[-10,-56,.6],[11,-55,.6],[-29,-22,1],[29,-20,.9],[-18,-10,.8],[19,-11,.8]].map(w=>H.wart(w,'#44384d',.22)).join('')}
    <ellipse cx="-10" cy="-58" rx="11" ry="2.5" fill="#fff" opacity=".22" transform="rotate(-8 -10 -58)"/>
  </g>
  ${hindFeet(id,p.line,'#a391a7','#d7c9cc',34,.88)}
  <path d="M24 -61 C29 -63 34 -61 35 -56 C36 -52 35 -50 33.5 -49 C30 -53 27 -58 24 -61Z M-24 -61 C-29 -63 -34 -61 -35 -56 C-36 -52 -35 -50 -33.5 -49 C-30 -53 -27 -58 -24 -61Z" fill="url(#${id}skin)"/>
  <path d="M24 -61 C29 -63 34 -61 35 -56 C36 -52 35 -50 33.5 -49 M-24 -61 C-29 -63 -34 -61 -35 -56 C-36 -52 -35 -50 -33.5 -49" fill="none" stroke="${p.line}" stroke-width=".55"/>
  <g fill="#51435d" opacity=".35"><circle cx="32" cy="-57" r=".55"/><circle cx="33.5" cy="-54" r=".45"/><circle cx="-32" cy="-57" r=".55"/><circle cx="-33.5" cy="-54" r=".45"/></g>
  ${face(H,id,p,16,-60,8.8,[-1.8,-1.8],'M-26 -43 Q-13 -40.8 0 -41.4 Q13 -40.6 26 -43')}
  <path d="M-26 -43 Q-28 -42 -27.6 -40 M26 -43 Q28 -42 27.6 -40" fill="none" stroke="${p.dark}" stroke-width="1.05" stroke-linecap="round" opacity=".65"/>
  <!-- bashful: a blush that only shows while someone is looking at him -->
  <g class="tcp-blush" opacity="0">
    <ellipse cx="-20.5" cy="-47.4" rx="4.6" ry="2.2" fill="#e8879f" opacity=".5"/><ellipse cx="20.5" cy="-47.4" rx="4.6" ry="2.2" fill="#e8879f" opacity=".5"/>
    <path d="M-22.6 -48.5 L-23.6 -46.5 M-20.3 -48.7 L-21.3 -46.7 M-18 -48.5 L-19 -46.5 M18.6 -48.5 L17.6 -46.5 M20.9 -48.7 L19.9 -46.7 M23.2 -48.5 L22.2 -46.5" fill="none" stroke="#c8607d" stroke-width=".5" stroke-linecap="round" opacity=".55"/>
  </g>
  ${pivot(0,-37.8,'td-throat',`<ellipse cy="-33" rx="12" ry="4.8" fill="url(#${id}throat)"/><ellipse cx="-3" cy="-34.5" rx="3.5" ry="1.2" fill="#fff" opacity=".32"/>`)}
  <path d="M-26 -29 C-33 -29 -40 -23 -40 -17 C-40 -12 -36 -9 -30 -9 L-23 -10 L-22 -16 L-29 -15 C-31 -15 -32 -18 -30 -21 L-23 -25Z M27 -29 C35 -31 41 -25 41 -20 C41 -13 36 -10 31 -12 C27 -13 24 -17 22 -20 L27 -24 C29 -20 32 -18 34 -19 C35 -21 32 -25 27 -25Z" fill="url(#${id}skin)"/>
  <path d="M-34 -27 C-38 -24 -40 -21 -40 -17 C-40 -12 -36 -9 -30 -9 L-25 -10 M-26 -15 L-29 -15 C-31 -15 -32 -18 -30 -21 M35 -28 C39 -26 41 -23 41 -20 C41 -13 36 -10 31 -12 C27 -13 24 -17 22 -20 M29 -21 C31 -18 33 -18 34 -19" fill="none" stroke="${p.line}" stroke-width=".55" stroke-linecap="round"/>
  ${[[-36,-19,.8],[37,-18,.8]].map(w=>H.wart(w,'#44384d',.22)).join('')}
  <path d="M-31 -31 Q-23 -27 -13 -28 Q-2 -23 16 -28 L27 -32 L30 -26 Q20 -22 19 -12 Q9 -15 1 -21 Q-16 -16 -34 -24Z" fill="url(#${id}linen)" stroke="#8f806a" stroke-width=".5"/>
  <path d="M-29 -29 Q-14 -21 1 -24 M22 -27 Q17 -22 18 -17 M-27 -25 L-26 -22 M-23 -24 L-22 -21 M-19 -23 L-18 -20" fill="none" stroke="#f5ebd4" stroke-width=".7" opacity=".65"/>
  <!-- the flute and both hands sway together about the flute's middle -->
  ${pivot(0,-17,'tcp-flute',`${fluteHands()}
  <g transform="translate(0 -17) rotate(-9)">
    <rect x="-52" y="-2.6" width="104" height="5.2" rx="2.1" fill="url(#${id}bamboo)" stroke="#7b6141" stroke-width=".5"/>
    <path d="M-49 -1.5 L49 -1.5" stroke="#f3deb2" stroke-width=".7" opacity=".65"/>
    <ellipse cx="52" cy="0" rx="1.1" ry="2.2" fill="#654e36" stroke="#ad8d5b" stroke-width=".5"/>
    <path d="M-43 -2.6 L-43 2.6 M-7 -2.6 L-7 2.6 M31 -2.6 L31 2.6" stroke="#8d724b" stroke-width="1"/>
    ${[-32,-20,-8,4,16,28].map(x=>`<ellipse cx="${x}" cy=".2" rx="1.1" ry=".9" fill="#594635"/><path d="M${x-.9} 1.1 L${x+.9} 1.1" stroke="#ebd3a0" stroke-width=".4"/>`).join('')}
    <path d="M40 -2.7 L40 2.7 M42 -2.7 L42 2.7" fill="none" stroke="#a36d60" stroke-width=".75"/>
    ${pivot(41,2.7,'tcp-thread','<path d="M41 2.7 Q43 6 46 6" fill="none" stroke="#a36d60" stroke-width=".75"/>')}
  </g>
  ${fluteHands(true)}`)}
  </g></g>
  ${note('n1',NOTE)}${note('n2',NOTES2)}${note('n3',NOTE)}${note('n4',SQUEAK)}
  </g>`;
}

/* ═══════════════ Kuri · Keeper of the Roots, and Mame (the child) ═══════════════
   The two come from one generator, toads-design/new-pair/revised-concepts.cjs
   art(child,id); this is that function with the moving parts wrapped. Kuri's
   left eye is the cloudy, blind one: its glints sit in .tcp-cloud instead of
   .td-gaze, so they never glance about (the lid still blinks). */
/* small cream glyphs above Mame's head, drawn round 0,0 */
const BANG='<path d="M0 -6.2 L0 -1.8" fill="none" stroke-width="1.9" stroke-linecap="round"/><circle cy="1.5" r="1.05" stroke="none"/>';
const ASK='<path d="M-2.4 -4.4 Q-2.3 -7.2 .2 -7.2 Q2.7 -7.2 2.7 -4.9 Q2.7 -3.2 .9 -2.5 Q0 -2.1 0 -.6" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cy="1.9" r=".95" stroke="none"/>';
/* Kuri's seedling: a pinch of soil, a stem that rises from it, two leaves that
   unfold at its tip, and a bead of dew. Base at (22,5.5) on his lily pad. */
function seedling(){
  const leaf=(cls,d,rib,extra='')=>pivot(22.2,-7,'tcp-unfold '+cls,pivot(22.2,-7,'tcp-leaf '+cls,`<path d="${d}" fill="#8fbf6a" stroke="#4f7a3c" stroke-width=".4"/><path d="${rib}" fill="none" stroke="#5e8b45" stroke-width=".4" stroke-linecap="round" opacity=".8"/>${extra}`));
  return `<g class="tcp-sprout" opacity="0"><g transform="translate(22 5.5) scale(1.25) translate(-22 -5.5)">
    ${pivot(22,5.6,'tcp-soil',`<ellipse cx="22" cy="5.6" rx="5.4" ry="1.9" fill="#6b4a33"/><path d="M17.6 5.1 Q22 3.5 26.4 5.1" fill="none" stroke="#9a7452" stroke-width=".55" stroke-linecap="round"/><circle cx="18.4" cy="6.4" r=".45" fill="#8a6446"/><circle cx="25.8" cy="6.6" r=".4" fill="#8a6446"/>`)}
    ${pivot(22,5,'tcp-stem',`<path d="M22 5 C22 1 21.4 -3 22.2 -7" fill="none" stroke="#6e9a52" stroke-width="1.15" stroke-linecap="round"/><path d="M21.7 3 C21.6 0 21.3 -3 21.8 -5.6" fill="none" stroke="#b9dc95" stroke-width=".35" stroke-linecap="round" opacity=".8"/>
      ${leaf('l1','M22.2 -7 C19 -6 16.4 -8 15.6 -11 C18.8 -11.6 21.4 -10 22.2 -7Z','M22.2 -7 Q19 -8.6 16.2 -10.8')}
      ${leaf('l2','M22.2 -7 C25.4 -6.4 28 -8.4 28.6 -11.4 C25.4 -11.8 22.8 -10.2 22.2 -7Z','M22.2 -7 Q25.4 -8.8 28 -11.2',
        pivot(26.2,-9.9,'tcp-dew','<circle cx="26.2" cy="-9.9" r=".75" fill="#eaf6f2" opacity=".9"/><circle cx="25.95" cy="-10.15" r=".25" fill="#fff"/>'))}`)}
  </g></g>`;
}
function companion(H,child,id){
  const P={eye:'eye',iris:'iris',line:child?'#607f81':'#86644f',fold:child?'#769694':'#a37e60',fold2:child?'#536f73':'#795843',lidLine:child?'#293f42':'#3f3128',ring:child?'#866534':'#53684c',hi:child?'#f1f4e9':'#fff0dc'};
  const B=child?'M0 0 C9 .4 22 -1 27 -6 C31 -11 30 -18 27 -22 C28 -27 27 -33 22 -36 C15 -40 -15 -40 -22 -36 C-27 -33 -28 -27 -27 -22 C-30 -18 -31 -11 -27 -6 C-22 -1 -9 .4 0 0Z':'M0 0 C15 .5 32 -1 38 -8 C44 -14 43 -23 39 -29 C42 -35 44 -43 42 -49 C40 -56 33 -59 25 -60 C15 -62 -15 -62 -25 -60 C-33 -59 -40 -56 -42 -49 C-44 -43 -42 -35 -39 -29 C-43 -23 -44 -14 -38 -8 C-32 -1 -15 .5 0 0Z';
  const scale=child?.68:1,ey=child?-37:-59,x=child?12.6:19.3;
  const arm='M28 -33 C37 -33 44 -27 45 -19 C46 -12 43 -6 41 -2 L33 -2 C34 -8 32 -15 29 -20 C27 -24 26 -28 26 -31Z';
  const mirror=d=>d.replace(/(-?\d*\.?\d+) (-?\d*\.?\d+)/g,(m,x,y)=>`${H.r2(-x)} ${y}`);
  const mouth=child?'M-20 -25 C-13 -22.8 -6 -22.4 0 -22.6 C7 -22.4 14 -23 20 -25.6':'M-32 -40 C-22 -38 -10 -37.4 0 -37.8 C12 -37.4 22 -38.4 32 -41';
  const spots=child?[[-20,-30,.8],[-16,-32,.65],[22,-14,.9],[-16,-7,.8]]:[[33,-47,1.2],[31,-42,.9],[27,-12,1.3],[-12,-52,.7]];
  const eyeAt=(left)=>{
    let eye=H.eye(0,0,{r:child?(left?7.5:7.1):9.1,lid:child?(left?-2.2:-.6):(left?3.2:1.2),side:left?-1:1},P,id);
    if(!child&&left)eye=eye.replace(`fill="url(#${id}iris)"`,`fill="url(#${id}cloudedEye)"`).replace(`stroke="${P.ring}"`,'stroke="#c1c7ba"').replace('<ellipse rx="4.6" ry="2.1" fill="#1f2e2c"/>','').replace('class="td-gaze"','class="tcp-cloud"');
    return `<g transform="translate(${left?-x:x} ${ey+(child&&!left?.6:0)}) ${child?`rotate(${left?-3:3})`:'scale(1.09 .94)'}">${eye}</g>`;
  };
  const warts=child?[[-18,-32,.8],[19,-32,.75],[-21,-24,.65],[21,-23,.65],[-14,-14,.6],[14,-13,.6]]:[[-35,-43,1.1],[35,-44,1],[-28,-48,.8],[28,-49,.9],[-20,-26,.7],[21,-26,.7],[-31,-9,.8],[31,-9,.9],[-5,-28,.55]];
  const glyph=(x,y,cls,art)=>pivot(x,y,'tcp-glyph '+cls,`<g transform="translate(${x} ${y})" fill="#f6eedf" stroke="#f6eedf">${art}</g>`,' opacity="0"');
  return `<defs>
    ${H.skinDef(id,'skin',child?-46:-69,child?[[0,'#eff3e9'],[.24,'#bfd3d1'],[.65,'#8eafaf'],[.94,'#678e91'],[1,'#173a3b']]:[[0,'#f7ecda'],[.24,'#ddbd98'],[.66,'#b88c68'],[.94,'#926a4e'],[1,'#173a3b']])}
    ${H.eyeDefs(id,child?'#eff3e9':'#f7e9ce',child?'#9ab9b7':'#c39b71',child?['#ffe8b7','#d7ad63','#92713d']:['#e2e8c4','#99ad7f','#5f7656'])}
    ${child?'':`<radialGradient id="${id}cloudedEye" cx=".4" cy=".3" r=".7"><stop stop-color="#fffdf3"/><stop offset=".6" stop-color="#f1f0e7"/><stop offset="1" stop-color="#dfe4db"/></radialGradient>`}
    <radialGradient id="${id}throat" cx=".4" cy=".3" r=".65"><stop stop-color="#fff9e8"/><stop offset="1" stop-color="${child?'#d1ddd0':'#e2c49e'}"/></radialGradient>
    <linearGradient id="${id}patch" gradientUnits="userSpaceOnUse" x1="0" y1="-61" x2="0" y2="-7"><stop stop-color="${child?'#edd49d':'#b27d56'}"/><stop offset="1" stop-color="${child?'#c49c63':'#88583f'}"/></linearGradient>
    <linearGradient id="${id}cloth" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#809f8b"/><stop offset="1" stop-color="#50765f"/></linearGradient>
    <linearGradient id="${id}seed" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#ead39d"/><stop offset="1" stop-color="#b4955b"/></linearGradient>
    <clipPath id="${id}bc"><path d="${B}"/></clipPath>
  </defs>
  <g class="td-cast">
  ${child?pivot(0,3,'tcp-land','<ellipse cy="3" rx="44" ry="9" fill="none" stroke="#e6f5f1" stroke-width=".9"/>',' opacity="0"'):''}
  ${H.lilyPad({water:false},id,child?40:57)}${H.contact(child?29:42)}
  <g class="td-body">${child?'<g class="tcp-tilt">':''}<g class="td-breathe">
  <g transform="scale(${scale})">
    <path d="M-36 -4 C-44 -7 -51 -5 -55 -2 C-58 0 -54 1 -50 1 L-34 0 M36 -4 C44 -7 51 -5 55 -2 C58 0 54 1 50 1 L34 0" fill="${child?'#8eafaf':'#ba946f'}" stroke="${P.line}" stroke-width=".5"/>
    <g fill="${child?'#dce8d9':'#f1ddbc'}" stroke="${P.line}" stroke-width=".4"><circle cx="-54" cy="0" r="1.5"/><circle cx="-51" cy="-3" r="1.3"/><circle cx="54" cy="0" r="1.5"/><circle cx="51" cy="-3" r="1.3"/></g>
  </g>
  <path d="${B}" fill="url(#${id}skin)" stroke="${P.line}" stroke-width=".6"/>
  <g clip-path="url(#${id}bc)">
    ${child?`<path d="M-5 -41 C-8 -36 -7 -31 -3 -27 Q0 -25 4 -27 C7 -32 7 -36 5 -41Z" fill="#f5f1d8" opacity=".8"/>
      <path d="M20 -28 C25 -28 28 -23 25 -19 C23 -17 19 -18 19 -21 C17 -24 17 -27 20 -28Z" fill="url(#${id}patch)" opacity=".82"/>
      <circle cx="-18" cy="-28" r="1.1" fill="#d3b67c" opacity=".8"/><circle cx="-14.5" cy="-29.5" r=".8" fill="#d3b67c" opacity=".7"/>`:`<path d="M-11 -62 C-7 -68 5 -68 11 -61 C13 -56 7 -50 1 -51 C-4 -51 -9 -56 -11 -62Z" fill="url(#${id}patch)"/>
      <path d="M31 -35 C40 -36 44 -29 40 -23 C35 -20 29 -23 28 -28 Q26 -32 31 -35Z" fill="url(#${id}patch)" opacity=".65"/>`}
    ${spots.map(w=>H.blotch(w,child?'#73958d':'#8b6047')).join('')}
    ${warts.map(w=>H.wart(w,'#625132',.22)).join('')}
    <ellipse cx="${child?-8:-12}" cy="${child?-35:-56}" rx="${child?8:12}" ry="${child?1.9:2.8}" fill="#fff" opacity=".22" transform="rotate(-8 ${child?-8:-12} ${child?-35:-56})"/>
    <ellipse cy="-2" rx="${child?19:29}" ry="3" fill="#173a3b" opacity=".12"/>
  </g>
  <g transform="translate(0 ${child?3:0}) scale(${child?.68:1})">
    <path d="M27 -60 C34 -63 42 -59 44 -53 C45 -49 44 -46 42 -45 C38 -50 32 -55 27 -60Z M-27 -60 C-34 -63 -42 -59 -44 -53 C-45 -49 -44 -46 -42 -45 C-38 -50 -32 -55 -27 -60Z" fill="url(#${id}eye)"/>
    <path d="M27 -60 C34 -63 42 -59 44 -53 C45 -49 44 -46 42 -45 M-27 -60 C-34 -63 -42 -59 -44 -53 C-45 -49 -44 -46 -42 -45" stroke="${P.line}" stroke-width=".55" fill="none"/>
    <g fill="#8a7147" opacity=".3"><circle cx="40" cy="-54" r=".6"/><circle cx="42" cy="-51" r=".5"/><circle cx="-40" cy="-54" r=".6"/><circle cx="-42" cy="-51" r=".5"/></g>
  </g>
  ${eyeAt(true)}${eyeAt(false)}
  <g fill="#423b28" opacity=".55"><ellipse cx="${child?-3.4:-5}" cy="${child?-29:-47}" rx="${child?.75:1.1}" ry="${child?.55:.75}"/><ellipse cx="${child?3.4:5}" cy="${child?-29:-47}" rx="${child?.75:1.1}" ry="${child?.55:.75}"/></g>
  <path d="${mouth}" fill="none" stroke="#fff8e6" stroke-width="${child?.7:.85}" transform="translate(0 -1.3)" opacity=".55" stroke-linecap="round"/>
  <path d="${mouth}" fill="none" stroke="#423b28" stroke-width="${child?1.1:1.45}" stroke-linecap="round" opacity=".82"/>
  <path d="M${child?-20:-32} ${child?-25:-40} q-2 .5 -1.8 2 M${child?20:32} ${child?-25.6:-41} q2 -.3 2 -2" stroke="#423b28" stroke-width="${child?.8:1.1}" fill="none" stroke-linecap="round" opacity=".7"/>
  ${pivot(0,child?-21.4:-36,'td-throat',`<ellipse cy="${child?-18:-31}" rx="${child?9:13}" ry="${child?3.4:5}" fill="url(#${id}throat)"/><ellipse cx="${child?-2.4:-3.6}" cy="${child?-19:-32.4}" rx="${child?3:4}" ry="1" fill="#fff" opacity=".35"/>`)}
  <g transform="scale(${scale})">
    <path d="${arm} ${mirror(arm)}" fill="url(#${id}skin)"/>
    <path d="M36 -31 C41 -27 44 -23 45 -19 C46 -12 43 -6 41 -2 M33 -2 C34 -8 32 -15 29 -20 M-36 -31 C-41 -27 -44 -23 -45 -19 C-46 -12 -43 -6 -41 -2 M-33 -2 C-34 -8 -32 -15 -29 -20" fill="none" stroke="${P.line}" stroke-width=".55" stroke-linecap="round"/>
    ${[[41,-18,1],[-41,-18,1],[38,-8,.8],[-38,-8,.8]].map(w=>H.wart(w,'#625132',.22)).join('')}
    ${[-1,1].map(s=>`<g transform="translate(${37*s} -1.5) scale(${s} 1)"><ellipse rx="6" ry="2.7" fill="${child?'#b4cdca':'#dbbd98'}" stroke="${P.line}" stroke-width=".5"/><path d="M0 0 L-8 2 M0 0 L-3.5 3.2 M0 0 L3.5 3.3 M0 0 L8 1.5" stroke="${P.line}" stroke-width="3.8" stroke-linecap="round" fill="none"/><path d="M0 0 L-8 2 M0 0 L-3.5 3.2 M0 0 L3.5 3.3 M0 0 L8 1.5" stroke="${child?'#b4cdca':'#dbbd98'}" stroke-width="2.9" stroke-linecap="round" fill="none"/><g fill="${child?'#e5ede1':'#f8e6c7'}" stroke="${P.line}" stroke-width=".35"><circle cx="-8" cy="2" r="1.7"/><circle cx="-3.5" cy="3.2" r="1.7"/><circle cx="3.5" cy="3.3" r="1.7"/><circle cx="8" cy="1.5" r="1.7"/></g></g>`).join('')}
  </g>
  </g>${child?'</g>':''}</g>
  ${child?pivot(0,6,'tcp-jostle',pivot(0,6,'tcp-rock',`<path d="M-8 3 Q0 9 8 3 Q0 1 -8 3Z" fill="#82a274" stroke="#55764d" stroke-width=".4"/><path d="M-6 3.2 Q0 5 6 3.2 M0 3 L0 -3" stroke="#c5d5a7" stroke-width=".5" fill="none"/>${pivot(0,-1,'tcp-sail','<path d="M0 -3 L4 1 L0 1Z" fill="#d2dfb0" stroke="#6a8b58" stroke-width=".35"/>')}`))
    +glyph(3,-58,'g1',BANG)+glyph(17,-50,'g2',ASK):seedling()}
  </g>`;
}

const TOADS={neri:{name:'Neri',art:neri},oto:{name:'Oto',art:oto},
  kuri:{name:'Kuri',art:(H,id)=>companion(H,false,id)},mame:{name:'Mame',art:(H,id)=>companion(H,true,id)}};

/* ── motion ── Rules are scoped .tcp-<name> .td-cast … so they outrank the
   keepers' generic ones (.td-mv .td-blink, .td-mv .td-cast .td-blink, …). */
const CSS=`
.tcp .tcp-turn,.tcp .tcp-star,.tcp .tcp-wag,.tcp .tcp-flute,.tcp .tcp-fing,.tcp .tcp-thread,.tcp .tcp-note,
.tcp .tcp-soil,.tcp .tcp-stem,.tcp .tcp-unfold,.tcp .tcp-leaf,.tcp .tcp-dew,
.tcp .tcp-land,.tcp .tcp-tilt,.tcp .tcp-jostle,.tcp .tcp-rock,.tcp .tcp-sail,.tcp .tcp-glyph{transform-box:view-box;transform-origin:0 0}
/* Neri */
.td-mv .tcp-neri .td-cast .td-throat{animation:tcp-n-throat 7.2s ease-in-out infinite}
.td-mv .tcp-neri .td-cast .td-blink{animation:tcp-n-blink 7.2s ease-in-out infinite}
.td-mv .tcp-neri .td-cast .td-gaze{animation:tcp-n-gaze 7.2s ease-in-out infinite}
.td-mv .tcp-neri .tcp-wag{animation:tcp-n-wag 7.2s ease-in-out infinite}
.td-mv .tcp-neri .tcp-turn{animation:tcp-n-turn 7.2s ease-in-out infinite}
.td-mv .tcp-neri .tcp-sheen{animation:tcp-n-sheen 7.2s ease-in-out infinite}
.td-mv .tcp-neri .tcp-star{animation:tcp-n-star 7.2s ease-out infinite}
@keyframes tcp-n-throat{0%,20%,26%{transform:scale(1,1)}4%,10%,17%{transform:scale(1.05,1.18)}7%,13.5%{transform:scale(1,1)}40%,70%{transform:scale(1.03,1.1)}55%,85%,100%{transform:scale(1,1)}}
@keyframes tcp-n-blink{0%,26%,31%,85%,90%,100%{transform:scaleY(1)}28%,29%,87%,88%{transform:scaleY(var(--bk,1.92))}}
@keyframes tcp-n-gaze{0%,32%,70%,100%{transform:translate(0,0)}38%,62%{transform:translate(.4px,1.4px)}}
@keyframes tcp-n-wag{0%,25%,100%{transform:rotate(0)}4%{transform:rotate(-10deg)}8%{transform:rotate(5deg)}12%{transform:rotate(-9deg)}16%{transform:rotate(4deg)}21%{transform:rotate(-2deg)}}
@keyframes tcp-n-turn{0%,32%,80%,100%{transform:none}45%,64%{transform:translateX(-10.2px) scaleX(1.1)}}
@keyframes tcp-n-sheen{0%,44%,67%,100%{opacity:0}50%{opacity:.9}56%{opacity:.35}61%{opacity:.75}}
@keyframes tcp-n-star{0%,47%,60%,100%{transform:scale(0) rotate(0);opacity:0}51%{transform:scale(1.25) rotate(40deg);opacity:1}55%{transform:scale(.75) rotate(80deg);opacity:.85}}
/* Oto */
.td-mv .tcp-oto .tcp-blush{animation:tcp-o-blush .9s ease .3s both}
.td-mv .tcp-oto .td-cast .td-body{animation:tcp-o-startle 6.8s ease-in-out infinite}
.td-mv .tcp-oto .td-cast .td-throat{animation:tcp-o-throat 6.8s ease-in-out infinite}
.td-mv .tcp-oto .td-cast .td-blink{animation:tcp-o-blink 6.8s ease-in-out infinite}
.td-mv .tcp-oto .td-cast .td-gaze{animation:tcp-o-gaze 6.8s ease-in-out infinite}
.td-mv .tcp-oto .tcp-flute{animation:tcp-o-sway 3.4s ease-in-out infinite}
.td-mv .tcp-oto .tcp-fing.f1{animation:tcp-o-fing1 6.8s ease-in-out infinite}
.td-mv .tcp-oto .tcp-fing.f2{animation:tcp-o-fing2 6.8s ease-in-out infinite}
.td-mv .tcp-oto .tcp-thread{animation:tcp-o-thread 1.9s ease-in-out infinite}
.td-mv .tcp-oto .tcp-note{animation:tcp-o-note 6.8s linear infinite backwards}
.td-mv .tcp-oto .tcp-note.n1{animation-delay:2.4s}
.td-mv .tcp-oto .tcp-note.n2{animation-delay:3.2s;--nx:-1}
.td-mv .tcp-oto .tcp-note.n3{animation-delay:4.03s}
.td-mv .tcp-oto .tcp-note.n4{animation:tcp-o-squeak 6.8s linear 5.03s infinite backwards}
@keyframes tcp-o-blush{from{opacity:0}to{opacity:1}}
@keyframes tcp-o-startle{0%,73.5%,85%,100%{transform:none}76%{transform:translateY(-2.2px) scale(.97,1.05)}79%{transform:scale(1.03,.96)}82%{transform:scale(.995,1.01)}}
@keyframes tcp-o-throat{0%,16%,34.5%,40%,46.5%,52%,58.5%,64%,73%,80%,100%{transform:scale(1,1)}8%{transform:scale(1.03,1.08)}36.5%,48.5%,60.5%{transform:scale(1.12,1.38)}75%{transform:scale(1.2,1.55)}}
@keyframes tcp-o-blink{0%,30%,74.5%,82%,85%,88%,100%{transform:scaleY(1)}34%,73%{transform:scaleY(calc(1 + (var(--bk,1.92) - 1) * .5))}83.5%,86.5%{transform:scaleY(var(--bk,1.92))}}
@keyframes tcp-o-gaze{0%,8%,30%,80%,100%{transform:translate(0,0)}13%,25%{transform:translate(-1.7px,.9px)}36%,72%{transform:translate(0,.5px)}75%{transform:translate(.3px,-.5px)}}
@keyframes tcp-o-sway{0%,100%{transform:rotate(0)}25%{transform:rotate(-1.2deg)}75%{transform:rotate(1.1deg)}}
@keyframes tcp-o-fing1{0%,34%,39%,46%,51%,58%,63%,100%{transform:translateY(0)}36.5%,48.5%,60.5%{transform:translateY(-1.1px)}}
@keyframes tcp-o-fing2{0%,40%,45%,52%,57%,64%,69%,100%{transform:translateY(0)}42.5%,54.5%,66.5%{transform:translateY(-1.1px)}}
@keyframes tcp-o-thread{0%,100%{transform:rotate(0)}30%{transform:rotate(14deg)}75%{transform:rotate(-9deg)}}
@keyframes tcp-o-note{0%{transform:translate(0,0) scale(.3) rotate(0);opacity:0}3%{transform:translate(1px,-3px) scale(.9) rotate(calc(var(--nx,1) * 6deg));opacity:1}8%{transform:translate(calc(var(--nx,1) * 3px + 4px),-10px) scale(1) rotate(calc(var(--nx,1) * -7deg))}13%{transform:translate(4px,-17px) scale(1) rotate(calc(var(--nx,1) * 6deg));opacity:.95}18%{transform:translate(calc(var(--nx,1) * 2px + 7px),-23px) scale(.95) rotate(0);opacity:0}100%{transform:translate(7px,-23px) scale(.95);opacity:0}}
@keyframes tcp-o-squeak{0%{transform:translate(0,0) scale(.3) rotate(0);opacity:0}2.5%{transform:translate(2px,-4px) scale(1.4) rotate(-20deg);opacity:1}5%{transform:translate(3px,-6px) scale(1.05) rotate(16deg)}7.5%{transform:translate(4px,-8px) scale(1.15) rotate(-10deg)}10%{transform:translate(5px,-11px) scale(1.05) rotate(6deg);opacity:1}17%{transform:translate(8px,-20px) scale(1) rotate(0);opacity:0}100%{transform:translate(8px,-20px);opacity:0}}
/* Kuri: once, when he wakes, a seedling comes up (it stays while he's awake);
   then an 8 s loop: his seeing eye checks on it, a slow heavy blink, a small nod */
.td-mv .tcp-kuri .tcp-sprout{animation:tcp-k-show .3s ease forwards}
.td-mv .tcp-kuri .tcp-soil{animation:tcp-k-soil .55s cubic-bezier(.3,1.4,.5,1) both}
.td-mv .tcp-kuri .tcp-stem{animation:tcp-k-stem 1.2s cubic-bezier(.25,.8,.3,1) .35s both}
.td-mv .tcp-kuri .tcp-unfold.l1{animation:tcp-k-unfold1 .9s cubic-bezier(.3,1.3,.5,1) 1.15s both}
.td-mv .tcp-kuri .tcp-unfold.l2{animation:tcp-k-unfold2 .9s cubic-bezier(.3,1.3,.5,1) 1.3s both}
.td-mv .tcp-kuri .tcp-leaf.l1{animation:tcp-k-leaf 4.2s ease-in-out 2.2s infinite}
.td-mv .tcp-kuri .tcp-leaf.l2{animation:tcp-k-leaf 4.2s ease-in-out 2.7s infinite}
.td-mv .tcp-kuri .tcp-dew{animation:tcp-k-dew 8s ease-in-out 2.3s infinite}
.td-mv .tcp-kuri .td-cast .td-breathe{animation:td-breathe 6.2s ease-in-out infinite}
.td-mv .tcp-kuri .td-cast .td-throat{animation:td-throat 3.6s ease-in-out infinite}
.td-mv .tcp-kuri .td-cast .td-gaze{animation:tcp-k-gaze 8s ease-in-out infinite}
.td-mv .tcp-kuri .td-cast .td-blink{animation:tcp-k-blink 8s ease-in-out infinite}
.td-mv .tcp-kuri .td-cast .td-body{animation:tcp-k-nod 8s ease-in-out infinite}
@keyframes tcp-k-show{from{opacity:0}to{opacity:1}}
@keyframes tcp-k-soil{from{transform:scale(.2)}to{transform:none}}
@keyframes tcp-k-stem{0%{transform:scaleY(0)}75%{transform:scaleY(1.06)}100%{transform:none}}
@keyframes tcp-k-unfold1{from{transform:scale(0) rotate(35deg)}to{transform:none}}
@keyframes tcp-k-unfold2{from{transform:scale(0) rotate(-35deg)}to{transform:none}}
@keyframes tcp-k-leaf{0%,100%{transform:rotate(0)}30%{transform:rotate(-5deg)}70%{transform:rotate(3deg)}}
@keyframes tcp-k-dew{0%,30%,40%,100%{transform:scale(1)}34%{transform:scale(1.8)}}
@keyframes tcp-k-gaze{0%,8%,44%,66%,86%,100%{transform:translate(0,0)}14%,38%{transform:translate(.5px,1.8px)}72%,80%{transform:translate(.4px,1.6px)}}
@keyframes tcp-k-blink{0%,48%,58%,100%{transform:scaleY(1)}51.5%,54.5%{transform:scaleY(var(--bk,1.92))}}
@keyframes tcp-k-nod{0%,59%,73%,100%{transform:none}63%{transform:translateY(1.2px) scale(1.012,.972)}67%{transform:translateY(.2px) scale(1.002,.995)}}
/* Mame: once, when he wakes, a "!" and an excited hop that jostles the boat;
   then a 6 s loop: he watches the boat rock, looks back up with his head
   tilted, and a "?" rises while his throat chatters */
.td-mv .tcp-mame .td-cast .td-body{animation:tcp-m-hop .9s cubic-bezier(.3,.7,.4,1) .12s both}
.td-mv .tcp-mame .tcp-land{animation:tcp-m-land .9s ease-out .7s forwards}
.td-mv .tcp-mame .tcp-jostle{animation:tcp-m-jostle .8s ease-out .68s both}
.td-mv .tcp-mame .tcp-glyph.g1{animation:tcp-m-bang 1.3s ease-out .05s forwards}
.td-mv .tcp-mame .tcp-glyph.g2{animation:tcp-m-ask 6s ease-out 3.6s infinite backwards}
.td-mv .tcp-mame .td-cast .td-breathe{animation:td-breathe 3.4s ease-in-out infinite}
.td-mv .tcp-mame .tcp-tilt{animation:tcp-m-tilt 6s ease-in-out infinite}
.td-mv .tcp-mame .td-cast .td-gaze{animation:tcp-m-gaze 6s ease-in-out infinite}
.td-mv .tcp-mame .td-cast .td-blink{animation:tcp-m-blink 6s ease-in-out infinite}
.td-mv .tcp-mame .td-cast .td-throat{animation:tcp-m-throat 6s ease-in-out infinite}
.td-mv .tcp-mame .tcp-rock{animation:tcp-m-rock 2.8s ease-in-out 1.4s infinite}
.td-mv .tcp-mame .tcp-sail{animation:tcp-m-sail 1.3s ease-in-out infinite}
@keyframes tcp-m-hop{0%{transform:none}14%{transform:scale(1.08,.88)}42%{transform:translateY(-7px) scale(.95,1.08)}66%{transform:translateY(0) scale(1.07,.9)}82%{transform:scale(.985,1.025)}100%{transform:none}}
@keyframes tcp-m-land{0%{transform:scale(.72);opacity:.85}100%{transform:scale(1.25);opacity:0}}
@keyframes tcp-m-jostle{0%,100%{transform:none}20%{transform:translateY(-1px) rotate(-9deg)}45%{transform:rotate(6deg)}70%{transform:rotate(-3deg)}}
@keyframes tcp-m-bang{0%{transform:translateY(2px) scale(.3);opacity:0}18%{transform:translateY(-2px) scale(1.3);opacity:1}30%{transform:translateY(-2px) scale(1);opacity:1}70%{transform:translateY(-3px);opacity:1}100%{transform:translateY(-5px);opacity:0}}
@keyframes tcp-m-ask{0%{transform:scale(.3);opacity:0}5%{transform:scale(1.15);opacity:1}8%{transform:scale(1);opacity:1}26%{transform:translateY(-4px);opacity:1}34%,100%{transform:translateY(-6px);opacity:0}}
@keyframes tcp-m-tilt{0%,20%,56%,88%,100%{transform:rotate(0)}30%{transform:rotate(-1.8deg)}43%{transform:rotate(1.8deg)}64%,80%{transform:rotate(4.5deg)}}
@keyframes tcp-m-gaze{0%,20%,56%,100%{transform:translate(0,0)}26%,50%{transform:translate(0,1.7px)}62%,82%{transform:translate(.4px,-.5px)}}
@keyframes tcp-m-blink{0%,21%,25%,88%,92%,100%{transform:scaleY(1)}23%,90%{transform:scaleY(var(--bk,1.92))}}
@keyframes tcp-m-throat{0%,60%,64.5%,69%,73.5%,78%,100%{transform:scale(1,1)}30%{transform:scale(1.03,1.08)}62.25%,66.75%,71.25%{transform:scale(1.07,1.24)}}
@keyframes tcp-m-rock{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}
@keyframes tcp-m-sail{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.78)}}
`;

let seq=0;
function svg(name,opts){
  const t=TOADS[name], H=window.ToadCast;
  if(!t||!H) return '';
  const size=(opts&&opts.size)||120;
  injectCSS();
  return `<svg class="td-art tcp tcp-${name}" width="${size}" height="${size}" viewBox="${VIEWBOX}" aria-hidden="true" focusable="false">${t.art(H,'tcp'+(++seq)+'_')}</svg>`;
}
function injectCSS(){
  try{
    if(document.getElementById('tcp-css')) return;
    const s=document.createElement('style'); s.id='tcp-css'; s.textContent=CSS; document.head.appendChild(s);
  }catch(e){}
}

window.ToadCompanions=Object.freeze({svg,has:name=>!!TOADS[name]&&!!window.ToadCast,css:CSS,injectCSS});
})();
