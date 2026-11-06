/* pets/kon.js · Kon, the kitsune with the little shamisen */
'use strict';
(function(){
const {r2,notes,zz}=PetKit;
/* ═══════════ Kon, the fox spirit with a shamisen (folklore) ═══════════
   A kitsune: a cream fox with kumadori marks in koi red at the eyes and on
   the ear tips, a second tail showing behind the first, and kitsunebi,
   foxfire, hovering about him. He sits on a mossy shrine stone fringed with
   higanbana, a shamisen across his lap; the bachi in his right paw (viewer's
   left) strums the beat, the other paw holds the neck. Chibi: the head is
   most of him, eyes big and low, limbs short. Same box and grammar as the
   toads: ground line y = 0, one skin gradient from pearl to pond-deep, light
   from the upper left, outlines about .55 wide in a tan under the fur. */
const LINE='#a86f3a';
const K_BODY='M0 0 C14 .5 26 -3 29 -12 C32 -22 28 -32 20 -38 L-20 -38 C-28 -32 -32 -22 -29 -12 C-26 -3 -14 .5 0 0Z';
/* the head, round and wide, two soft tufts of cheek fur a side */
const K_HEAD='M0 -36 C12 -36 23 -39.5 29 -46 C34 -47.5 36.5 -52 33.5 -57 C36.5 -59.5 37.5 -65 34 -69 C37.5 -81 30 -93 14 -96 C8 -97 -8 -97 -14 -96 C-30 -93 -37.5 -81 -34 -69 C-37.5 -65 -36.5 -59.5 -33.5 -57 C-36.5 -52 -34 -47.5 -29 -46 C-23 -39.5 -12 -36 0 -36Z';
/* the big tail, root at 0,0, plume sweeping up to the viewer's left */
const K_TAIL='M2 4 C-14 7 -32 -3 -38 -20 C-43 -33 -42 -44 -34 -49 C-27 -53 -21 -48 -21 -40 C-20 -29 -13 -18 2 -12Z';
/* one tongue of foxfire, a teardrop with a licking tip */
const FLAME='M1.6 -9.6 C.2 -6.4 4.8 -4.2 5.1 .6 C5.3 4.6 2.8 6.8 0 6.8 C-2.8 6.8 -5.2 4.6 -5.2 .8 C-5.2 -2.6 -2.4 -4.4 -1.4 -7 C-.9 -8.3 .2 -9.2 1.6 -9.6Z';
/* a big round fox eye in its own frame: outer corner at +x, lifted a little */
const EYE='M-8.4 .4 C-7.2 -6.6 3.6 -8.4 8.4 -3.4 C7.4 3.8 -3 6.6 -8.4 .4Z';
/* one eye, o = 1 on the viewer's right, -1 on the left (mirrored, so the
   outer corner is always +x inside). Open and glancing while he waits,
   shut and smiling while the music plays or he sleeps. */
function kEye(cx,cy,o,ID){
  const c=o>0?'eR':'eL', LID='#f9ead0';
  return `<g transform="translate(${cx} ${cy}) scale(${o*1.3} 1.3)">
    <ellipse cx=".2" cy=".8" rx="8.8" ry="6.2" fill="#173a3b" opacity=".06"/>
    <path class="pk-look" d="${EYE}" fill="#fff8e9"/>
    <g clip-path="url(#${ID}${c})">
      <g class="kn-open">
        <g transform="translate(.2 -.4)"><g class="kn-gaze">
          <circle r="5.9" fill="url(#${ID}iris)"/>
          <circle r="5.4" fill="none" stroke="#e2a63c" stroke-width=".9" opacity=".7"/>
          <circle cx="-1.9" cy="-2.2" r="2.1" fill="#ffffff" opacity=".95"/>
          <circle cx="2.4" cy="2" r=".9" fill="#ffffff" opacity=".7"/>
        </g></g>
        <g transform="translate(0 -8.4)"><g class="kn-blink"><g transform="translate(0 8.4)">
          <path d="M-10 -9 H10 V-3.6 C5 -7.4 -4 -8 -10 -4.6Z" fill="${LID}"/>
        </g></g></g>
      </g>
      <g class="kn-closed">
        <circle cx="0" cy="0" r="10" fill="${LID}"/>
        <path d="M-6.8 1.8 Q0 -5.6 7 -.6" fill="none" stroke="#8a4a2a" stroke-width="1.2" stroke-linecap="round"/>
      </g>
    </g>
    <path d="M-8.4 .4 C-7.2 -6.6 3.6 -8.4 8.4 -3.4" fill="none" stroke="#8a4a2a" stroke-width="1.05" stroke-linecap="round"/>
    <path d="${EYE}" fill="none" stroke="${LINE}" stroke-width=".38" opacity=".8"/>
  </g>`;
}
/* an ear, root at 0,0, tip up and a little out (+x); mirrored for the other side */
function kEar(cls,x,ID,o){
  return `<g transform="translate(${x} -90)"><g class="${cls}"><g transform="scale(${o} 1)">
    <path d="M-8.5 3 C-8.5 -7 -3 -17 5.5 -24 C10.5 -19 11.5 -8 10 3Z" fill="url(#${ID}ear)" stroke="${LINE}" stroke-width=".55" stroke-linejoin="round"/>
    <path d="M-4.2 1 C-4.2 -6 -1 -13 4.2 -18.6 C7 -14 7.4 -6.5 6.8 1Z" fill="#f6c3a4"/>
    <path d="M-5.4 1.5 C-6.4 -1.6 -4 -4 -1.6 -3" fill="none" stroke="#fff8e9" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>
  </g></g></g>`;
}
/* a tongue of foxfire at x,y: a wide pale halo, the flame, a side lick and a cream core */
function kFire(cls,x,y,s,ID){
  return `<g transform="translate(${x} ${y})"><g class="kn-fire ${cls}"><g class="kn-flick"><g transform="scale(${s})">
    <path d="${FLAME}" transform="scale(1.9 1.7)" fill="#8fe6d6" opacity=".14"/>
    <path d="${FLAME}" transform="scale(1.35 1.3)" fill="#8fe6d6" opacity=".24"/>
    <path d="${FLAME}" fill="url(#${ID}fire)"/>
    <path d="${FLAME}" transform="translate(-3.6 -.6) rotate(-34) scale(.5 .62)" fill="url(#${ID}fire)"/>
    <path d="${FLAME}" transform="translate(3.4 1.2) rotate(26) scale(.38 .5)" fill="url(#${ID}fire)"/>
    <path d="${FLAME}" transform="translate(0 1.6) scale(.5 .55)" fill="#fff8e9" opacity=".9"/>
    <circle cx="2.2" cy="-10.6" r=".8" fill="#f8d98a" opacity=".9"/>
  </g></g></g></g>`;
}
/* a higanbana, the red spider lily: six curled petals and long stamens from one point */
function kLily(x,y,s){
  const petals=[-150,-115,-80,-50,-20,10].map(a=>`<path d="M0 0 Q4.5 -1.5 7.6 -1" transform="rotate(${a})"/>`).join('');
  const stamens=[-140,-100,-62,-28].map(a=>`<path d="M1 0 Q6 -2.2 10.2 -1.8" transform="rotate(${a})"/>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <path d="M0 0 L0 7" fill="none" stroke="#4f8a4a" stroke-width=".8" stroke-linecap="round"/>
    <g fill="none" stroke="#cf3f2a" stroke-width="1.4" stroke-linecap="round">${petals}</g>
    <g fill="none" stroke="#ec7a45" stroke-width=".55" stroke-linecap="round" opacity=".9">${stamens}</g>
    <circle r="1.1" fill="#f8d98a" stroke="#cf3f2a" stroke-width=".4"/>
  </g>`;
}
function kon(ID){
  const paw=(x,y)=>`<g transform="translate(${x} ${y})">
    <ellipse rx="5" ry="4.2" fill="#f7e5c6" stroke="${LINE}" stroke-width=".5"/>
    <path d="M-2.2 -3.4 L-2 -.8 M1.4 -3.6 L1.6 -1" fill="none" stroke="#d4a872" stroke-width=".65" stroke-linecap="round"/>
    <ellipse cx="-1.4" cy="-1.6" rx="2.4" ry="1" fill="#ffffff" opacity=".4"/></g>`;
  const foot=o=>`<g transform="translate(${o*14} -1.5) scale(${o} 1)">
    <path d="M-7.5 -2.6 C-7.5 -7 7.5 -7 7.5 -2.6 C7.5 1.2 3.5 2.6 0 2.6 C-3.5 2.6 -7.5 1.2 -7.5 -2.6Z" fill="#ead2a3" stroke="${LINE}" stroke-width=".5"/>
    <path d="M-2.6 -4.2 L-2.4 .2 M2.6 -4.2 L2.4 .2" fill="none" stroke="#c79a62" stroke-width=".6" stroke-linecap="round"/>
    <ellipse cx="-1.6" cy="-3.8" rx="2.6" ry="1" fill="#ffffff" opacity=".4"/></g>`;
  /* a kumadori stroke from the outer corner of each eye up to the temple */
  const kum=o=>`<path transform="scale(${o} 1)" d="M20.6 -62.4 C25 -68 30.6 -74.6 37.4 -75.8 C32.4 -72 27.8 -67 23.6 -60.4Z" fill="url(#${ID}kum)" opacity=".9"/>`;
  return `<defs>
    <linearGradient id="${ID}skin" gradientUnits="userSpaceOnUse" x1="0" y1="-96" x2="0" y2="1"><stop offset="0" stop-color="#fff8e9"/><stop offset=".2" stop-color="#fcf0da"/><stop offset=".55" stop-color="#f3dcb3"/><stop offset=".82" stop-color="#dcb57e"/><stop offset=".95" stop-color="#b8864c"/><stop offset="1" stop-color="#173a3b"/></linearGradient>
    <radialGradient id="${ID}edge" cx=".5" cy=".44" r=".62"><stop offset=".56" stop-color="#b8743c" stop-opacity="0"/><stop offset="1" stop-color="#b8743c" stop-opacity=".42"/></radialGradient>
    <linearGradient id="${ID}ear" gradientUnits="userSpaceOnUse" x1="0" y1="-24" x2="0" y2="3"><stop offset="0" stop-color="#cf3f2a"/><stop offset=".3" stop-color="#ec7a45"/><stop offset=".58" stop-color="#fbeacd"/><stop offset="1" stop-color="#f6e2c0"/></linearGradient>
    <linearGradient id="${ID}kum" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ec7a45"/><stop offset="1" stop-color="#cf3f2a"/></linearGradient>
    <radialGradient id="${ID}iris" cx=".4" cy=".36" r=".62"><stop offset="0" stop-color="#4a5a56"/><stop offset=".55" stop-color="#1f2e2c"/><stop offset="1" stop-color="#121c1b"/></radialGradient>
    <radialGradient id="${ID}fire" cx=".5" cy=".64" r=".56"><stop offset="0" stop-color="#fff6c8"/><stop offset=".42" stop-color="#8ae6d4"/><stop offset="1" stop-color="#1f8f88"/></radialGradient>
    <linearGradient id="${ID}wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a86e3e"/><stop offset=".5" stop-color="#6e4426"/><stop offset="1" stop-color="#3f2616"/></linearGradient>
    <linearGradient id="${ID}dou" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf3dc"/><stop offset=".6" stop-color="#eedcb4"/><stop offset="1" stop-color="#d5b985"/></linearGradient>
    <linearGradient id="${ID}bachi" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbf0"/><stop offset=".6" stop-color="#efe1c0"/><stop offset="1" stop-color="#cdb27e"/></linearGradient>
    <linearGradient id="${ID}stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9a49a"/><stop offset=".55" stop-color="#6f6b64"/><stop offset="1" stop-color="#2f3331"/></linearGradient>
    <linearGradient id="${ID}stonetop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d6d1c6"/><stop offset=".55" stop-color="#b4afa4"/><stop offset="1" stop-color="#8f8a80"/></linearGradient>
    <clipPath id="${ID}hc"><path d="${K_HEAD}"/></clipPath>
    <clipPath id="${ID}bc"><path d="${K_BODY}"/></clipPath>
    <clipPath id="${ID}tc"><path d="${K_TAIL}"/></clipPath>
    <clipPath id="${ID}eR"><path d="${EYE}"/></clipPath>
    <clipPath id="${ID}eL"><path d="${EYE}"/></clipPath>
    <clipPath id="${ID}top"><path d="M-46 0 C-46 -6 -30 -8 0 -8 C30 -8 46 -6 46 0 C46 5.5 30 7.5 0 7.5 C-30 7.5 -46 5.5 -46 0Z"/></clipPath>
  </defs>
  <!-- his perch: a mossy shrine stone with a fringe of higanbana -->
  <ellipse cx="0" cy="10" rx="56" ry="5.6" fill="#173a3b" opacity=".22"/>
  <path d="M-46 0 C-46 9 -30 13.5 0 13.5 C30 13.5 46 9 46 0Z" fill="url(#${ID}stone)"/>
  <path d="M-46 0 C-46 9 -30 13.5 0 13.5 C30 13.5 46 9 46 0" fill="none" stroke="#3c3b36" stroke-width=".6" opacity=".7"/>
  <path d="M-14 7.6 L-9.6 9.4 L-11.4 12.2 M22 8.2 L26.6 10.4" fill="none" stroke="#3c3b36" stroke-width=".7" stroke-linecap="round" opacity=".55"/>
  <path d="M-13.4 8.2 L-9 10 M22.4 8.8 L27 11" fill="none" stroke="#c9c4b8" stroke-width=".5" stroke-linecap="round" opacity=".45"/>
  <path d="M-46 0 C-46 -6 -30 -8 0 -8 C30 -8 46 -6 46 0 C46 5.5 30 7.5 0 7.5 C-30 7.5 -46 5.5 -46 0Z" fill="url(#${ID}stonetop)" stroke="#6f6b64" stroke-width=".6"/>
  <g clip-path="url(#${ID}top)">
    <path d="M-38 -2 C-34 -6 -22 -6.5 -17 -3 C-19 -1 -34 .5 -38 -2Z" fill="#79ad66" opacity=".8"/>
    <path d="M18 -3.5 C24 -6.5 34 -6 38 -2.5 C34 -1 24 -1 18 -3.5Z" fill="#79ad66" opacity=".8"/>
    <g fill="#79ad66" opacity=".6"><circle cx="-12" cy="-4.6" r="1.1"/><circle cx="-42" cy="1.4" r="1"/><circle cx="12" cy="-5.2" r="1"/><circle cx="42" cy="1" r="1.1"/></g>
    <path d="M-6 -6.6 C-2 -3 3 -2 7 2.2" fill="none" stroke="#6f6b64" stroke-width=".55" opacity=".6"/>
    <ellipse cx="0" cy="1" rx="30" ry="3.2" fill="#173a3b" opacity=".2"/>
  </g>
  ${kLily(-55,-4,.9)}${kLily(-46,3,.7)}${kLily(47,-4,1)}${kLily(39,-1,.7)}
  <g class="pk-body"><g class="mp-breathe"><g class="kn-bob">
    <!-- the second tail, further back, fanned out the other side -->
    <g transform="translate(16 -8)"><g class="kn-tail2"><g transform="scale(-.74 .74) rotate(-22)">
      <path d="${K_TAIL}" fill="url(#${ID}skin)" stroke="${LINE}" stroke-width=".7"/>
      <g clip-path="url(#${ID}tc)"><ellipse cx="-30" cy="-44" rx="9" ry="7.5" transform="rotate(-42 -30 -44)" fill="#fff8e9" opacity=".9"/><rect x="-48" y="-56" width="54" height="64" fill="#8a5a30" opacity=".12"/></g>
    </g></g></g>
    <!-- the big plush tail, white at the tip -->
    <g transform="translate(-20 -8)"><g class="kn-tail"><g transform="scale(.92)">
      <path d="${K_TAIL}" fill="url(#${ID}skin)" stroke="${LINE}" stroke-width=".65"/>
      <g clip-path="url(#${ID}tc)">
        <ellipse cx="-31" cy="-44" rx="9.5" ry="8" transform="rotate(-42 -31 -44)" fill="#fff8e9"/>
        <rect x="-48" y="-56" width="54" height="64" fill="url(#${ID}edge)"/>
        <ellipse cx="-14" cy="-6" rx="14" ry="5" fill="#173a3b" opacity=".14" transform="rotate(-30 -14 -6)"/>
      </g>
      <path d="M-33 -46 C-31.6 -47.6 -29.4 -48.2 -27.6 -47.4 M-36.2 -31 C-35 -33 -33.4 -34 -31.6 -33.8 M-30 -14 C-29.2 -16 -27.8 -17.4 -26.2 -17.6" fill="none" stroke="#fff8e9" stroke-width=".8" stroke-linecap="round" opacity=".7"/>
    </g></g></g>
    <!-- hind paws, out in front -->
    ${foot(1)}${foot(-1)}
    <!-- the body, small and round, a pale ruff down the chest -->
    <path d="${K_BODY}" fill="url(#${ID}skin)" stroke="${LINE}" stroke-width=".6"/>
    <g clip-path="url(#${ID}bc)">
      <path d="M-15 -38 C-16 -28 -11 -17 -3 -13 L0 -15 L3 -13 C11 -17 16 -28 15 -38Z" fill="#fff8e9" opacity=".82"/>
      <rect x="-34" y="-40" width="68" height="41" fill="url(#${ID}edge)"/>
      <ellipse cx="0" cy="-36" rx="24" ry="7" fill="#173a3b" opacity=".26"/>
      <ellipse cx="0" cy="-2" rx="24" ry="3.2" fill="#173a3b" opacity=".14"/>
      <ellipse cx="-21" cy="-22" rx="3.6" ry="7" fill="#ffffff" opacity=".22" transform="rotate(12 -21 -22)"/>
    </g>
    <!-- the head: it sways with the music -->
    <g transform="translate(0 -36)"><g class="kn-rock"><g transform="translate(0 36)">
      ${kEar('kn-earR',16,ID,1)}${kEar('kn-earL',-16,ID,-1)}
      <path d="${K_HEAD}" fill="url(#${ID}skin)" stroke="${LINE}" stroke-width=".6" stroke-linejoin="round"/>
      <g clip-path="url(#${ID}hc)">
        <rect x="-42" y="-98" width="84" height="63" fill="url(#${ID}edge)"/>
        <ellipse cx="0" cy="-45" rx="13" ry="8.5" fill="#fff8e9" opacity=".6"/>
        <ellipse cx="-18" cy="-84" rx="8" ry="3.4" fill="#ffffff" opacity=".42" transform="rotate(-30 -18 -84)"/>
      </g>
      <path d="M-34 -57 L-29 -56 M34 -57 L29 -56 M-35 -69 L-30 -67 M35 -69 L30 -67" fill="none" stroke="#fff8e9" stroke-width=".9" stroke-linecap="round" opacity=".6"/>
      ${kum(1)}${kum(-1)}
      <path d="M0 -84.6 C2.2 -81.6 2.6 -78.6 0 -76.4 C-2.6 -78.6 -2.2 -81.6 0 -84.6Z" fill="url(#${ID}kum)" opacity=".85"/>
      <ellipse cx="-26.5" cy="-44.6" rx="5.2" ry="3" fill="#f48a78" opacity=".42"/>
      <ellipse cx="26.5" cy="-44.6" rx="5.2" ry="3" fill="#f48a78" opacity=".42"/>
      ${kEye(15,-55,1,ID)}
      ${kEye(-15,-55,-1,ID)}
      <ellipse cx="0" cy="-45.4" rx="1.9" ry="1.4" fill="#3a2a26"/>
      <circle cx="-.7" cy="-45.9" r=".5" fill="#ffffff" opacity=".7"/>
      <path d="M-2.8 -42.2 Q-1.4 -40.2 0 -42.2 Q1.4 -40.2 2.8 -42.2" fill="none" stroke="#8a4a2a" stroke-width=".75" stroke-linecap="round"/>
    </g></g></g>
    <!-- the shamisen across his lap: the square dou at the left, the neck up to the pegs -->
    <g transform="translate(-14 -15) rotate(-33)">
      <rect x="-10.6" y="-2.2" width="3.4" height="4.4" rx=".9" fill="#3a2a22"/>
      <rect x="-8.5" y="-8.5" width="17" height="17" rx="3" fill="url(#${ID}wood)" stroke="#3a2416" stroke-width=".55"/>
      <rect x="-7.1" y="-7.1" width="14.2" height="14.2" rx="2" fill="url(#${ID}dou)" stroke="#8a6a40" stroke-width=".4"/>
      <ellipse cx="-3" cy="-3" rx="3.6" ry="2" fill="#ffffff" opacity=".35"/>
      <rect x="5" y="-1.6" width="60" height="3.2" fill="url(#${ID}wood)" stroke="#3a2416" stroke-width=".5"/>
      <path d="M7 -.8 L63 -.8" fill="none" stroke="#d9a46c" stroke-width=".45" opacity=".5"/>
      <rect x="63" y="-2.5" width="9" height="5" rx="1.2" fill="#4a2c1a" stroke="#2a1810" stroke-width=".5"/>
      <g fill="#2e1c12" stroke="#1a100a" stroke-width=".35">
        <rect x="64.8" y="-6.6" width="1.6" height="4.6"/><rect x="69" y="-6.6" width="1.6" height="4.6"/><rect x="66.9" y="2" width="1.6" height="4.6"/>
        <circle cx="65.6" cy="-6.8" r="1.4"/><circle cx="69.8" cy="-6.8" r="1.4"/><circle cx="67.7" cy="6.8" r="1.4"/>
      </g>
      <path d="M-8.8 -1.1 L64 -1.1 M-8.8 0 L64 0 M-8.8 1.1 L64 1.1" fill="none" stroke="#f6ecd2" stroke-width=".4" opacity=".9"/>
      <rect x="-2.6" y="-2.6" width="1.5" height="5.2" fill="#fff8e9" stroke="#a88a58" stroke-width=".3"/>
    </g>
    <!-- the stubby paw on the neck (viewer's right) -->
    <path d="M17 -28 C21 -32 23.5 -36 24 -40" fill="none" stroke="${LINE}" stroke-width="8.4" stroke-linecap="round"/>
    <path d="M17 -28 C21 -32 23.5 -36 24 -40" fill="none" stroke="url(#${ID}skin)" stroke-width="7.2" stroke-linecap="round"/>
    ${paw(24.5,-41)}
    <!-- the strumming arm (viewer's left) and the bachi in its paw -->
    <path d="M-17 -28 C-18 -24.6 -15 -21.4 -10.5 -20.4" fill="none" stroke="${LINE}" stroke-width="8.4" stroke-linecap="round"/>
    <path d="M-17 -28 C-18 -24.6 -15 -21.4 -10.5 -20.4" fill="none" stroke="url(#${ID}skin)" stroke-width="7.2" stroke-linecap="round"/>
    <g transform="translate(-10 -20)"><g class="kn-bachi"><g transform="rotate(44)">
      <path d="M-1.2 -2 L1.2 -2 L5.4 10.4 Q0 12 -5.4 10.4Z" fill="url(#${ID}bachi)" stroke="#a88a58" stroke-width=".5" stroke-linejoin="round"/>
      <path d="M-1.1 1.8 L-3.4 9.4" fill="none" stroke="#ffffff" stroke-width=".8" stroke-linecap="round" opacity=".7"/>
    </g></g></g>
    ${paw(-10,-20)}
  </g></g>
  <!-- the foxfire: three tongues about him, lowest when nothing plays -->
  ${kFire('kn-f1',-54,-72,1.05,ID)}${kFire('kn-f2',52,-88,.9,ID)}${kFire('kn-f3',57,-36,.75,ID)}
  </g>
  ${notes(-4,-104,'#ec7a45')}
  ${zz(40,-78)}`;
}
PetKit.register({id:'kon',name:'Kon',kind:'kitsune',blurb:'Strums a shamisen while his foxfire keeps time.',art:kon,css:`/* the kitsune: blink, glance, an ear flick and a slow tail while he waits; strum, sway, swish and blaze while it plays */
.kn-blink{animation:kn-blink 6.4s ease-in-out infinite}
.kn-gaze{animation:kn-gaze 11s ease-in-out infinite}
.kn-earR{animation:kn-flick 9s ease-in-out infinite}
.kn-earL{animation:kn-flick 13s ease-in-out infinite;animation-delay:-5s}
.kn-tail{animation:kn-sway 5.4s ease-in-out infinite}
.kn-tail2{animation:kn-sway 6.2s ease-in-out infinite;animation-delay:-2s}
.kn-fire{transform:translateY(3px) scale(.82);opacity:.62;transition:transform .9s ease,opacity .9s ease}
.kn-flick{animation:kn-flicker 2.3s ease-in-out infinite}
.kn-f2 .kn-flick{animation-delay:-.8s}.kn-f3 .kn-flick{animation-delay:-1.5s}
.kn-closed{opacity:0}
.playing .kn-open{opacity:0}.playing .kn-closed{opacity:1}
.playing .kn-bob{animation:kn-bob .86s ease-in-out infinite}
.playing .kn-rock{animation:kn-rock 1.72s ease-in-out infinite}
.playing .kn-tail{animation:kn-swish 1.72s ease-in-out infinite}
.playing .kn-tail2{animation:kn-swish 1.72s ease-in-out infinite;animation-delay:-.43s}
.playing .kn-bachi{animation:kn-strum .86s cubic-bezier(.2,.9,.3,1) infinite}
.playing .kn-earR,.playing .kn-earL{animation:none}
.playing .kn-fire{transform:none;opacity:1}
.playing .kn-flick{animation:kn-blaze 1.72s ease-in-out infinite}
.playing .kn-f2 .kn-flick{animation-delay:-.57s}.playing .kn-f3 .kn-flick{animation-delay:-1.15s}
@keyframes kn-blink{0%,91%,97%,100%{transform:scaleY(1)}93.5%,95%{transform:scaleY(4)}}
@keyframes kn-gaze{0%,36%,92%,100%{transform:translate(0,0)}40%,56%{transform:translate(-1.4px,.3px)}60%,76%{transform:translate(1.3px,.3px)}80%{transform:translate(0,0)}}
@keyframes kn-flick{0%,60%,67%,100%{transform:rotate(0)}62%{transform:rotate(-17deg)}65%{transform:rotate(5deg)}}
@keyframes kn-sway{0%,100%{transform:rotate(-2.5deg)}50%{transform:rotate(2.5deg)}}
@keyframes kn-swish{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(7deg)}}
@keyframes kn-bob{0%,100%{transform:none}50%{transform:translateY(1.1px) scale(1.014,.984)}}
@keyframes kn-rock{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
@keyframes kn-strum{0%,100%{transform:rotate(-15deg)}22%{transform:rotate(13deg)}}
@keyframes kn-flicker{0%,100%{transform:scale(1,1)}50%{transform:scale(.93,1.06)}}
@keyframes kn-blaze{0%,66%,100%{transform:translateY(0) scale(.94);opacity:.78}33%{transform:translateY(-3px) scale(1.16);opacity:1}}
/* now and then: a big ear flick and the tail curls up */
.fidget .kn-earR{animation:kn-bigflick 2.4s ease-in-out}
.fidget .kn-earL{animation:kn-bigflick 2.4s ease-in-out;animation-delay:.25s}
.fidget .kn-tail{animation:kn-curl 2.4s ease-in-out}
@keyframes kn-bigflick{0%,100%{transform:rotate(0)}18%{transform:rotate(-30deg)}32%{transform:rotate(9deg)}44%{transform:rotate(-22deg)}60%{transform:rotate(0)}}
@keyframes kn-curl{0%,100%{transform:rotate(0)}30%,55%{transform:rotate(13deg)}42%{transform:rotate(10deg)}}
/* paused a long while: eyes shut, ears back, tail wrapped round, fire almost out */
.sleepy .kn-open{opacity:0}.sleepy .kn-closed{opacity:1}
.sleepy .kn-rock{transform:rotate(4deg) translateY(1.5px);transition:transform 1.2s ease-in-out}
.sleepy .kn-earR,.sleepy .kn-earL{animation:none;transform:rotate(20deg);transition:transform 1s ease-in-out}
.sleepy .kn-tail{animation:none;transform:rotate(-26deg);transition:transform 1.4s ease-in-out}
.sleepy .kn-fire{transform:translateY(5px) scale(.45);opacity:.2}`});
})();
