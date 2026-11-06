/* pets/kasa.js · Kasa, the kasa-obake who hops to the beat */
'use strict';
(function(){
const {r2,notes,zz}=PetKit;
/* ═══════════ Kasa, a karakasa (folklore) ═══════════
   A paper umbrella left a hundred years grows one eye, a tongue and a single
   leg, and hops about on it. Kasa is a half-closed oiled-paper wagasa, tilted
   a little: four big folds (koi outside, cream in the middle), a scalloped
   hem with the rib tips poking out below it, one big eye, a mouth with the
   long pink tongue lolling past the hem, one bamboo leg bent at the knee in a
   geta, two short arms, and a glass fūrin (wind chime) hung from a rib tip.
   He stands on a rounded wet rock in a rain puddle. Same box and grammar as
   the toads: ground y = 0, one skin gradient pearl → koi → pond-deep, light
   from the upper left, outlines about .55 wide in darker koi. */
const AY=-104;                                                     /* the rounded tip of the canopy */
const DARK='#8a3a1a';
/* where the five ribs meet the hem */
const HEM=[[-36,-30],[-18,-33],[0,-34],[18,-33],[36,-30]];
const sag=([x0,y0],[x1,y1])=>`Q${(x0+x1)/2} ${(y0+y1)/2+3} ${x1} ${y1}`;   /* the paper bellies out between ribs */
const SCALLOPS=HEM.slice(1).map((p,i)=>sag(HEM[i],p)).join(' ');
const CANOPY=`M0 ${AY} C-7 ${AY} -11 -98 -13 -88 C-22 -70 -36 -50 -36 -30 ${SCALLOPS} C36 -50 22 -70 13 -88 C11 -98 7 ${AY} 0 ${AY}Z`;
/* the three inner folds, tip to hem */
const FOLDS='M0 -100 Q-11 -66 -18 -33 M0 -100 L0 -34 M0 -100 Q11 -66 18 -33';
/* the two cream folds in the middle */
const CREAM=`M0 -100 Q-11 -66 -18 -33 ${sag(HEM[1],HEM[2])} ${sag(HEM[2],HEM[3])} Q11 -66 0 -100Z`;
/* a plum blossom: five petals round a gold heart */
const blossom=(x,y,r)=>`<g transform="translate(${x} ${y})">${[0,72,144,216,288].map(a=>{ const t=a*Math.PI/180;
  return `<circle cx="${r2(r*.62*Math.cos(t))}" cy="${r2(r*.62*Math.sin(t))}" r="${r2(r*.42)}"/>`; }).join('')}<circle r="${r2(r*.22)}" fill="#f3c35a"/></g>`;
/* a short arm from the side of the canopy, s = -1 viewer's left, 1 viewer's right; a bamboo twig with a mitten hand */
const arm=s=>`<g transform="translate(${26*s} -52)"><g class="${s<0?'ks-armL':'ks-armR'}">
    <path d="M0 0 Q${7*s} 3 ${7*s} 11" fill="none" stroke="#7a5a2a" stroke-width="3" stroke-linecap="round"/>
    <path d="M0 0 Q${7*s} 3 ${7*s} 11" fill="none" stroke="#e2c88e" stroke-width="1.7" stroke-linecap="round"/>
    <circle cx="${7*s}" cy="11.8" r="2.7" fill="#f3d9a8" stroke="#7a5a2a" stroke-width=".5"/><circle cx="${6.3*s}" cy="11" r=".8" fill="#fff8e9" opacity=".8"/>
  </g></g>`;
/* the leg: one bamboo handle, bent at the knee */
const LEG='M0 -33 C-2 -25 -9 -21 -8 -13 C-7.2 -8 -3 -6 0 -5.4';
/* his perch: a rounded wet rock in a rain puddle, with a ring or two from the last drops */
const perch=ID=>`<linearGradient id="${ID}stone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b3c6c4"/><stop offset=".5" stop-color="#7d9699"/><stop offset="1" stop-color="#4a6467"/></linearGradient>
  <linearGradient id="${ID}rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5f7a7c"/><stop offset="1" stop-color="#2f4749"/></linearGradient>
  <ellipse cx="0" cy="6.5" rx="54" ry="7" fill="#9fd0c8" opacity=".45"/>
  <ellipse cx="0" cy="6.5" rx="54" ry="7" fill="none" stroke="#cfe9e3" stroke-width=".6" opacity=".7"/>
  <ellipse cx="-40" cy="8" rx="7" ry="1.8" fill="none" stroke="#e8f4f0" stroke-width=".5" opacity=".7"/>
  <ellipse cx="42" cy="5" rx="4.5" ry="1.2" fill="none" stroke="#e8f4f0" stroke-width=".5" opacity=".7"/>
  <ellipse cx="2" cy="11" rx="34" ry="3.6" fill="#173a3b" opacity=".3"/>
  <path d="M-27 -1 C-31 4 -28 12 -15 13 C-4 14 8 14 17 13 C29 12 32 4 27 -1Z" fill="url(#${ID}rock)" stroke="#2b4446" stroke-width=".55"/>
  <path d="M-22 6 C-18 9 -12 10.6 -6 11" fill="none" stroke="#1d3335" stroke-width=".5" opacity=".5"/>
  <ellipse cx="0" cy="-1" rx="27" ry="6.5" fill="url(#${ID}stone)" stroke="#2b4446" stroke-width=".55"/>
  <ellipse cx="-9" cy="-3" rx="11" ry="2" fill="#ffffff" opacity=".4" transform="rotate(-4 -9 -3)"/>
  <ellipse cx="13" cy="1.6" rx="5" ry="1" fill="#ffffff" opacity=".22"/>`;
function kasa(ID){
  return `<defs>
    <linearGradient id="${ID}skin" gradientUnits="userSpaceOnUse" x1="0" y1="${AY}" x2="0" y2="-27"><stop offset="0" stop-color="#fff8e9"/><stop offset=".14" stop-color="#f9c7a2"/><stop offset=".42" stop-color="#ec7a45"/><stop offset=".8" stop-color="#d4602f"/><stop offset=".95" stop-color="#9b4524"/><stop offset="1" stop-color="#173a3b"/></linearGradient>
    <linearGradient id="${ID}paper" gradientUnits="userSpaceOnUse" x1="0" y1="${AY}" x2="0" y2="-27"><stop offset="0" stop-color="#fffdf7"/><stop offset=".4" stop-color="#fff0cf"/><stop offset=".85" stop-color="#ecd09a"/><stop offset="1" stop-color="#b9955e"/></linearGradient>
    <radialGradient id="${ID}edge" cx=".5" cy=".5" r=".6"><stop offset=".5" stop-color="${DARK}" stop-opacity="0"/><stop offset="1" stop-color="${DARK}" stop-opacity=".36"/></radialGradient>
    <radialGradient id="${ID}iris" cx=".45" cy=".42" r=".6"><stop offset="0" stop-color="#f8d98a"/><stop offset=".55" stop-color="#e2a63c"/><stop offset="1" stop-color="#a8702a"/></radialGradient>
    <linearGradient id="${ID}glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfdf6"/><stop offset=".5" stop-color="#d6ebdc"/><stop offset="1" stop-color="#8fbfaa"/></linearGradient>
    <linearGradient id="${ID}wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6ab70"/><stop offset=".6" stop-color="#96693c"/><stop offset="1" stop-color="#5a3f28"/></linearGradient>
    <linearGradient id="${ID}tongue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3838f"/><stop offset="1" stop-color="#d9475a"/></linearGradient>
    <clipPath id="${ID}cc"><path d="${CANOPY}"/></clipPath>
    <clipPath id="${ID}ec"><circle cx="0" cy="-66" r="13"/></clipPath>
  </defs>
  ${perch(ID)}
  <g class="pk-body"><g class="mp-breathe"><g class="ks-hop">
    <!-- the geta: two teeth, a platform, a koi thong -->
    <g fill="url(#${ID}wood)" stroke="#4a3424" stroke-width=".55"><rect x="-7.6" y="-2" width="3.4" height="3" rx="1"/><rect x="4.2" y="-2" width="3.4" height="3" rx="1"/></g>
    <path d="M-11.5 -4 C-11.5 -7.4 -6.5 -8.4 0 -8.4 C6.5 -8.4 11.5 -7.4 11.5 -4 C11.5 -1.6 6.5 -1 0 -1 C-6.5 -1 -11.5 -1.6 -11.5 -4Z" fill="url(#${ID}wood)" stroke="#4a3424" stroke-width=".55"/>
    <ellipse cx="0" cy="-5.5" rx="10" ry="2.3" fill="#e9cf98" stroke="#7a5a2a" stroke-width=".4"/>
    <!-- everything above the geta leans a little, from the sandal up -->
    <g transform="translate(0 -5)"><g class="ks-lean"><g transform="translate(0 5)">
      <!-- the leg, knee bent -->
      <path d="${LEG}" fill="none" stroke="#7a5a2a" stroke-width="5.4" stroke-linecap="round"/>
      <path d="${LEG}" fill="none" stroke="#e2c88e" stroke-width="3.8" stroke-linecap="round"/>
      <path d="${LEG}" fill="none" stroke="#fff8e9" stroke-width=".9" stroke-linecap="round" opacity=".5" transform="translate(-1 0)"/>
      <path d="M-10.4 -13.6 C-9 -12.6 -7 -12.6 -5.6 -13.6" fill="none" stroke="#7a5a2a" stroke-width=".9" stroke-linecap="round"/>
      <path d="M-8 -5.4 Q0 -10.4 8 -5.4" fill="none" stroke="#ec7a45" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M-8 -6 Q0 -11 8 -6" fill="none" stroke="#fff8e9" stroke-width=".5" stroke-linecap="round" opacity=".5"/>
      <!-- the canopy: it pivots on the handle top, and sits a few degrees off true -->
      <g transform="translate(0 -31)"><g class="ks-canopy"><g transform="rotate(-5) translate(0 31)">
        <g stroke="#7a5a2a" stroke-width="1.7" stroke-linecap="round">${HEM.map(([x,y])=>`<path d="M${x} ${y} v3.6"/>`).join('')}</g>
        <path d="${CANOPY}" fill="url(#${ID}skin)" stroke="${DARK}" stroke-width=".6" stroke-linejoin="round"/>
        <g clip-path="url(#${ID}cc)">
          <path d="${CREAM}" fill="url(#${ID}paper)"/>
          <g fill="#ec7a45" opacity=".9">${blossom(-25,-52,3.2)}${blossom(25,-52,3.2)}</g>
          <path d="${FOLDS}" fill="none" stroke="${DARK}" stroke-width="5" stroke-linecap="round" opacity=".12"/>
          <path d="${FOLDS}" fill="none" stroke="${DARK}" stroke-width=".6" opacity=".7"/>
          <path d="M-10 -92 Q0 -89 10 -92" fill="none" stroke="#2f7a74" stroke-width=".7" opacity=".8"/>
          <rect x="-40" y="${AY-2}" width="80" height="80" fill="url(#${ID}edge)"/>
          <ellipse cx="0" cy="-31" rx="36" ry="4.5" fill="#173a3b" opacity=".2"/>
          <ellipse cx="-23" cy="-62" rx="3" ry="12" fill="#ffffff" opacity=".36" transform="rotate(22 -23 -62)"/>
          <ellipse cx="-5" cy="-96" rx="4" ry="2" fill="#ffffff" opacity=".5" transform="rotate(-40 -5 -96)"/>
        </g>
        <path d="M-36 -30 ${SCALLOPS}" fill="none" stroke="${DARK}" stroke-width=".6" stroke-linejoin="round"/>
        <!-- the tip -->
        <circle cx="0" cy="${AY-1}" r="2.4" fill="#d9bd7c" stroke="#7a5a2a" stroke-width=".5"/><circle cx="-.7" cy="${AY-1.7}" r=".7" fill="#fff8e9" opacity=".8"/>
        <!-- short arms from the folds -->
        ${arm(-1)}${arm(1)}
        <!-- the fūrin, hung from the outer rib tip: glass bell, clapper, paper strip -->
        <g transform="translate(36 -27)"><g class="ks-chime">
          <path d="M0 0 V3" stroke="#4a3424" stroke-width=".6"/>
          <path d="M0 2.6 C3.8 2.6 5.6 5.4 5.4 10 L-5.4 10 C-5.6 5.4 -3.8 2.6 0 2.6Z" fill="url(#${ID}glass)" stroke="#5f9a86" stroke-width=".5" opacity=".92"/>
          <path d="M0 4 V11.2" stroke="#7a5a2a" stroke-width=".5"/>
          <ellipse cx="0" cy="10" rx="5.4" ry="1.5" fill="#a3d2c8" stroke="#5f9a86" stroke-width=".5" opacity=".9"/>
          <ellipse cx="-2.2" cy="5" rx="1.4" ry=".6" fill="#ffffff" opacity=".75" transform="rotate(-50 -2.2 5)"/>
          <path d="M-2.6 7.4 Q0 8.4 2.6 7.4" fill="none" stroke="#ec7a45" stroke-width=".55" opacity=".8"/>
          <circle cx="0" cy="11.4" r="1" fill="#7a5a2a"/>
          <g transform="translate(0 12)"><g class="ks-strip">
            <path d="M-2.2 0 H2.2 V9.4 L0 10.6 L-2.2 9.4Z" fill="#fff8e9" stroke="#b98a44" stroke-width=".4" stroke-linejoin="round"/>
            <path d="M-1.3 2.6 Q0 1.6 1.3 2.6 M-1.3 5 Q0 4 1.3 5" fill="none" stroke="#2f7a74" stroke-width=".5" stroke-linecap="round"/>
          </g></g>
        </g></g>
        <!-- the face: blush, one big eye (gold rim, wide dark pupil, two glints), a mouth and the long tongue -->
        <ellipse cx="-11.5" cy="-50" rx="4.8" ry="2.7" fill="#f48a78" opacity=".6"/>
        <ellipse cx="11.5" cy="-50" rx="4.8" ry="2.7" fill="#f48a78" opacity=".6"/>
        <circle class="pk-look" cx="0" cy="-66" r="13" fill="#fff8e9"/>
        <g clip-path="url(#${ID}ec)">
          <g class="ks-open">
            <circle cx="0" cy="-65.6" r="10" fill="url(#${ID}iris)"/>
            <circle cx="0" cy="-65.6" r="10" fill="none" stroke="#7a5326" stroke-width=".5" opacity=".7"/>
            <g transform="translate(0 -65.2)"><g class="ks-gaze">
              <ellipse rx="6.4" ry="6" fill="#1f2e2c"/>
              <circle cx="2.4" cy="-2.2" r="2.3" fill="#ffffff" opacity=".95"/>
              <circle cx="-2.8" cy="2.6" r=".9" fill="#ffffff" opacity=".6"/>
            </g></g>
            <g transform="translate(0 -84)"><g class="ks-blink"><g transform="translate(0 84)">
              <path d="M-14 -74 L-14 -84 L14 -84 L14 -74 C6 -77.2 -6 -77.2 -14 -74Z" fill="url(#${ID}paper)"/>
              <path d="M-12 -74.2 C-6 -76.6 6 -76.6 12 -74.2" fill="none" stroke="${DARK}" stroke-width="1.1" stroke-linecap="round"/>
            </g></g></g>
            <circle cx="0" cy="-66" r="13" fill="none" stroke="${DARK}" stroke-width=".6"/>
          </g>
          <g class="ks-closed">
            <circle cx="0" cy="-66" r="13.2" fill="url(#${ID}paper)"/>
            <path d="${FOLDS}" fill="none" stroke="${DARK}" stroke-width="5" stroke-linecap="round" opacity=".12"/>
            <path d="${FOLDS}" fill="none" stroke="${DARK}" stroke-width=".6" opacity=".7"/>
            <path d="M-8.4 -68 Q0 -59.6 8.4 -68" fill="none" stroke="${DARK}" stroke-width="1.8" stroke-linecap="round"/>
          </g>
          <g class="ks-doze">
            <circle cx="0" cy="-66" r="13.2" fill="url(#${ID}paper)"/>
            <path d="${FOLDS}" fill="none" stroke="${DARK}" stroke-width="5" stroke-linecap="round" opacity=".12"/>
            <path d="${FOLDS}" fill="none" stroke="${DARK}" stroke-width=".6" opacity=".7"/>
            <path d="M-8.4 -66 Q0 -62 8.4 -66 M-7.6 -64.8 L-8.4 -62.2 M0 -63 L0 -60.4 M7.6 -64.8 L8.4 -62.2" fill="none" stroke="${DARK}" stroke-width="1.4" stroke-linecap="round"/>
          </g>
        </g>
        <path class="ks-lip" d="M-5 -48 Q0 -43.6 5 -48" fill="none" stroke="${DARK}" stroke-width="1.2" stroke-linecap="round"/>
        <path class="ks-grin" d="M-7.4 -48 C-3 -47.4 3 -47.4 7.4 -48 C6.4 -40 -6.4 -40 -7.4 -48Z" fill="#7a2a2a" stroke="${DARK}" stroke-width=".6" stroke-linejoin="round"/>
        <g transform="translate(0 -46)"><g class="ks-tongue">
          <path d="M-3.2 0 C-5.4 8 -4.6 17 1.6 24 C7 19 6 9 3.4 0Z" fill="url(#${ID}tongue)" stroke="#b23a4a" stroke-width=".5" stroke-linejoin="round"/>
          <path d="M.2 3 C-.6 10 .2 16 1.8 21" fill="none" stroke="#b23a4a" stroke-width=".5" opacity=".55"/>
          <ellipse cx="-1.6" cy="6" rx=".9" ry="2.6" fill="#ffffff" opacity=".4"/>
        </g></g>
      </g></g></g>
    </g></g></g>
  </g></g></g>
  ${notes(40,-96,'#e2a63c')}
  ${zz(30,-84)}`;
}
PetKit.register({id:'kasa',name:'Kasa',kind:'kasa-obake',blurb:'Hops on one leg to the beat, wind chime ringing.',art:kasa,css:`/* the karakasa: a lean, a slow blink and a glance while he waits; hops, wobbles, wags and rings while it plays */
.ks-lean{transform:rotate(-2.5deg);transition:transform .9s ease-in-out}
.ks-canopy{transition:transform 1.4s ease-in-out}
.ks-tongue{transition:transform .9s ease-in-out}
.ks-blink{animation:ks-blink 5.8s ease-in-out infinite}
.ks-gaze{animation:ks-gaze 11s ease-in-out infinite}
.ks-closed,.ks-doze,.ks-grin{opacity:0}
.playing .ks-lean{transform:none}
.playing .ks-open,.playing .ks-lip{opacity:0}
.playing .ks-closed,.playing .ks-grin{opacity:1}
.playing .ks-hop{animation:ks-hop .86s cubic-bezier(.4,0,.6,1) infinite}
.playing .ks-canopy{animation:ks-wobble 1.72s ease-in-out infinite}
.playing .ks-tongue{animation:ks-wag .86s ease-in-out infinite}
.playing .ks-chime{animation:ks-swing .86s ease-in-out infinite}
.playing .ks-strip{animation:ks-flutter .43s ease-in-out infinite}
.playing .ks-armL{animation:ks-armL 1.72s ease-in-out infinite}
.playing .ks-armR{animation:ks-armR 1.72s ease-in-out infinite}
@keyframes ks-blink{0%,88%,97%,100%{transform:scaleY(1)}91.5%,93.5%{transform:scaleY(4.2)}}
@keyframes ks-gaze{0%,36%,92%,100%{transform:translate(0,0)}40%,56%{transform:translate(-2px,.4px)}60%,76%{transform:translate(1.8px,.4px)}80%{transform:translate(0,0)}}
@keyframes ks-hop{0%,100%{transform:translateY(0) scale(1.07,.93)}14%{transform:translateY(-1.5px) scale(1,1)}50%{transform:translateY(-6px) scale(.975,1.02)}86%{transform:translateY(-.6px) scale(1,1)}}
@keyframes ks-wobble{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
@keyframes ks-wag{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(10deg)}}
@keyframes ks-swing{0%,100%{transform:rotate(-12deg)}50%{transform:rotate(12deg)}}
@keyframes ks-flutter{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}
@keyframes ks-armL{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(12deg)}}
@keyframes ks-armR{0%,100%{transform:rotate(10deg)}50%{transform:rotate(-12deg)}}
/* now and then: a quick lick (the tongue curls up), then a half-twirl of the canopy */
.fidget .ks-tongue{animation:ks-lick 2.4s ease-in-out}
.fidget .ks-canopy{animation:ks-twirl 2.4s ease-in-out}
@keyframes ks-lick{0%,34%,100%{transform:rotate(0) scale(1,1)}10%,22%{transform:rotate(-70deg) scale(1,.7)}16%{transform:rotate(-55deg) scale(1,.75)}}
@keyframes ks-twirl{0%,40%,100%{transform:rotate(0) scaleX(1)}56%{transform:rotate(3deg) scaleX(.7)}72%{transform:rotate(-2deg) scaleX(1.04)}84%{transform:rotate(1deg) scaleX(.98)}}
/* paused a long while: he droops, canopy closing further, eye shut */
.sleepy .ks-open{opacity:0}
.sleepy .ks-doze{opacity:1}
.sleepy .ks-lean{transform:rotate(4deg)}
.sleepy .ks-canopy{transform:translateY(3px) rotate(3deg) scale(.85,.97)}
.sleepy .ks-tongue{transform:rotate(6deg)}`});
})();
