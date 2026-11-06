/* pets/kit.js · what every one of Sara's yokai is drawn with, in the toads' grammar (see ../../toad-art.js)
   One shared box, viewBox "-68 -118 136 136", ground line y=0, centred on x=0.
   A pet file calls PetKit.register({id,name,kind,blurb,css,art(ID)}); art returns the inside of the <svg>,
   with every id prefixed by ID. The page sets these classes on an ancestor and each pet answers them:
     .playing   the music is on          .fidget   a little idle business, about 2.4s, now and then
     .sleepy    paused a long while      (.pk-look marks the eyes: the window measures them to peek over an edge)
   The character (all but the pad) sits in one bare <g class="pk-body">: the window hops it (.pk-hop) on taps and drops.
   House motion rule: every moving group is wrapped in translate() so it pivots on its own 0,0. */
'use strict';
(function(){
const r2=n=>+n.toFixed(2);
function pad(ID){
  const ring=(c,cls)=>`<g transform="translate(0 6)"><g class="${cls}"><ellipse rx="70" ry="13" fill="none" stroke="${c}" stroke-width=".9" opacity=".32"/></g></g>`;
  const p='M0 3.5 L30.4 13.5 A62 11.5 0 1 0 12.6 14.75 Z';
  const veins=[200,225,250,275,300,325,350,15,40,140,165].map(a=>{ const t=a*Math.PI/180;
    return `M0 3.5 L${r2(57*Math.cos(t))} ${r2(3.5+10.6*Math.sin(t))}`; }).join(' ');
  return `<linearGradient id="${ID}pad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8db58a"/><stop offset=".55" stop-color="#6f9e7a"/><stop offset="1" stop-color="#5a8d69"/></linearGradient>
    ${ring('#cfe9e3','mp-ring')}${ring('#cfe9e3','mp-ring two')}
    <path d="${p}" transform="translate(0 1.7)" fill="#3a6a51"/>
    <path d="${p}" fill="url(#${ID}pad)"/>
    <path d="${veins}" stroke="#a9c795" stroke-width=".5" opacity=".45" fill="none"/>
    <path d="M-61.4 2.2 C-50 -6 50 -6 61.4 2.2" fill="none" stroke="#b9d29f" stroke-width=".7" opacity=".7"/>
    <ellipse cx="0" cy="1.6" rx="47" ry="4.4" fill="#173a3b" opacity=".32"/>
    <ellipse cx="0" cy="1" rx="34" ry="2.4" fill="#173a3b" opacity=".2"/>`;
}

const vinylDef=ID=>`<radialGradient id="${ID}vinyl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#3d4c49"/><stop offset=".7" stop-color="#22302e"/><stop offset="1" stop-color="#141d1c"/></radialGradient>`;

function notes(x,y,c='#2f7a74'){
  const n=(dx,dy,cls,s)=>`<g transform="translate(${x+dx} ${y+dy})"><g class="mp-note ${cls}"><g transform="scale(${s})">
    <ellipse cx="0" cy="0" rx="3" ry="2.2" transform="rotate(-20)" fill="${c}"/><path d="M2.6 -.6 L2.6 -10 Q5.6 -8.6 7 -6" fill="none" stroke="${c}" stroke-width="1.1" stroke-linecap="round"/></g></g></g>`;
  return `<g class="mp-notes">${n(0,0,'',1)}${n(8,6,'n2',.8)}${n(-6,8,'n3',.9)}</g>`;
}
/* "z z" drifting up from (x,y) while the pet sleeps */
function zz(x,y,c='#fff8e9'){
  const z=(dx,dy,s,cls)=>`<g transform="translate(${x+dx} ${y+dy})"><g class="pk-z ${cls}"><path transform="scale(${s})" d="M-2.6 -2.6 H2.6 L-2.6 2.6 H2.6" fill="none" stroke="#173a3b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/><path transform="scale(${s})" d="M-2.6 -2.6 H2.6 L-2.6 2.6 H2.6" fill="none" stroke="${c}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></g></g>`;
  return `<g class="pk-zz">${z(0,0,1,'')}${z(6,-7,.75,'z2')}</g>`;
}
const BASE=`svg *{transform-box:view-box;transform-origin:0 0}
.mp-breathe{animation:mp-breathe 4.6s ease-in-out infinite}

.mp-ring{animation:mp-ring 5.2s ease-out infinite}.mp-ring.two{animation-delay:-2.6s}

.mp-notes{opacity:0}
@keyframes mp-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,1.024)}}

@keyframes mp-ring{0%{transform:scale(.82);opacity:0}25%{opacity:1}100%{transform:scale(1.22);opacity:0}}

.playing .mp-spin{animation:mp-spin 1.8s linear infinite}
.playing .mp-notes{opacity:1}
.playing .mp-note{animation:mp-note 2.6s ease-out infinite}
.playing .mp-note.n2{animation-delay:-.9s}.playing .mp-note.n3{animation-delay:-1.75s}

@keyframes mp-spin{to{transform:rotate(360deg)}}
@keyframes mp-note{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.9}100%{transform:translate(10px,-34px) scale(1);opacity:0}}
.pk-hop .pk-body{animation:pk-hop .62s cubic-bezier(.3,1.2,.5,1)}
@keyframes pk-hop{0%{transform:none}14%{transform:scale(1.07,.9)}42%{transform:translateY(-15px) scale(.95,1.06)}72%{transform:translateY(0) scale(1.06,.93)}86%{transform:scale(.98,1.02)}100%{transform:none}}
.pk-zz{opacity:0}
.sleepy .pk-zz{opacity:1}
.sleepy .pk-z{animation:pk-z 3.2s ease-out infinite}
.sleepy .pk-z.z2{animation-delay:-1.6s}
@keyframes pk-z{0%{transform:translate(0,0) scale(.5);opacity:0}20%{opacity:1}100%{transform:translate(7px,-16px) scale(1.1);opacity:0}}
@media (prefers-reduced-motion:reduce){svg *{animation:none!important}}`;
const PETS={}, ORDER=[];
let n=0;
window.PetKit={
  r2,pad,notes,vinylDef,zz,
  register(def){ if(!PETS[def.id]) ORDER.push(def.id); PETS[def.id]=def; },
  list:()=>ORDER.map(id=>PETS[id]),
  get:id=>PETS[id]||PETS[ORDER[0]],
  svg(id){ const d=this.get(id); const ID='pk'+(++n)+'_'; return `<svg class="pk-art pk-${d.id}" viewBox="-68 -118 136 136" aria-hidden="true">${d.art(ID)}</svg>`; },
  injectCSS(){ if(document.getElementById('pk-css')) return; const s=document.createElement('style'); s.id='pk-css';
    s.textContent=[BASE,...ORDER.map(id=>PETS[id].css||'')].join(String.fromCharCode(10)); document.head.appendChild(s); }
};
})();
