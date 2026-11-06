/* pets/sara.js · Sara, the kappa with the spinning dish */
'use strict';
(function(){
const {r2,pad,notes,vinylDef,zz}=PetKit;
/* ═══════════ 4 · Sara, the kappa with the spinning dish (folklore) ═══════════
   A kappa keeps a dish of water on the crown of its head, ringed by wet hair.
   Sara floats a record in hers. The label is a slice of cucumber (a kappa's
   favourite thing), the tonearm is a twig of bamboo weighted with a lotus
   seed, and the rest of the cucumber is in her fist, for conducting.
   Same box and grammar as the toads: ground line y = 0, one skin gradient from
   pearl to pond-deep, light from the upper left, outlines about .55 wide. */
const K_HEAD='M0 -31 C18 -31 37.5 -37 38.5 -54 C39.5 -70 24 -82 0 -82 C-24 -82 -39.5 -70 -38.5 -54 C-37.5 -37 -18 -31 0 -31Z';
const K_BODY='M0 0 C15 .5 29 -1 33 -9 C37 -18 34 -32 26 -40 L-26 -40 C-34 -32 -37 -18 -33 -9 C-29 -1 -15 .5 0 0Z';
const K_SHELL='M-50 -22 C-52 -40 -34 -54 0 -54 C34 -54 52 -40 50 -22 C49 -9 40 -1.5 30 -1.5 L-30 -1.5 C-40 -1.5 -49 -9 -50 -22Z';
const K_ARM_R='M27 -36 C36 -35 43 -28 44 -19 C44.6 -12 43 -6 41.6 -2.6 L33.4 -2.6 C34 -8 33 -14 30.4 -19 C28 -23 26 -28 26 -32Z';
const K_ARM_L='M-26 -36 C-34 -39.5 -45 -35 -51.5 -27 C-53.5 -23.6 -52.6 -18.6 -49 -17 C-45 -16 -42 -18.6 -40 -21.6 C-36.6 -25.6 -32 -26.6 -27.4 -26Z';
const K_PLATE='M0 -37 C10 -37 19 -33 20 -22 C21 -10 12 -3 0 -3 C-12 -3 -21 -10 -20 -22 C-19 -33 -10 -37 0 -37Z';
/* a freckle: the toads' wart, in jade */
const kSpot=([x,y,r])=>`<circle cx="${r2(x+r*.3)}" cy="${r2(y+r*.45)}" r="${r}" fill="#2f6a4c" opacity=".22"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity=".42"/>`;
/* one eye: the toads' eye (gold iris, wide pupil, heavy lid that droops at the
   outer corner), set in the face under her fringe. Open while she waits,
   shut and smiling while the music plays. */
function kEye(cx,cy,o,ID){
  const R=9, top=r2(cy-R), c=o>0?'er':'el', yl=r2(cy-2.9+(o<0?.5:0)), yr=r2(cy-2.9+(o>0?.5:0));
  const lid=`M${cx-R-1} ${yl} L${cx-R-1} ${cy-R-1} L${cx+R+1} ${cy-R-1} L${cx+R+1} ${yr} C${r2(cx+5.4)} ${r2(cy-5.5)} ${r2(cx-5.4)} ${r2(cy-5.5)} ${cx-R-1} ${yl}Z`;
  return `<clipPath id="${ID}${c}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
    <ellipse cx="${cx}" cy="${r2(cy+1.2)}" rx="${R+.5}" ry="${R}" fill="#173a3b" opacity=".09"/>
    <circle class="pk-look" cx="${cx}" cy="${cy}" r="${R}" fill="#fff8e9"/>
    <g clip-path="url(#${ID}${c})">
      <g class="kp-open">
        <circle cx="${cx}" cy="${r2(cy+.4)}" r="6.9" fill="url(#${ID}iris)"/>
        <circle cx="${cx}" cy="${r2(cy+.4)}" r="6.9" fill="none" stroke="#7a5326" stroke-width=".5" opacity=".7"/>
        <g transform="translate(${cx} ${r2(cy+.8)})"><g class="kp-gaze">
          <ellipse rx="4" ry="3.3" fill="#1f2e2c"/>
          <circle cx="1.8" cy="-1" r="1.45" fill="#ffffff" opacity=".94"/>
          <circle cx="-2.2" cy="1.5" r=".5" fill="#ffffff" opacity=".55"/>
        </g></g>
        <g transform="translate(${cx} ${top})"><g class="kp-blink"><g transform="translate(${-cx} ${-top})">
          <path d="${lid}" fill="url(#${ID}skin)"/>
          <path d="M${r2(cx-5)} ${r2(cy-6.6)} C${r2(cx-2.2)} ${r2(cy-7.5)} ${r2(cx+2.2)} ${r2(cy-7.5)} ${r2(cx+5)} ${r2(cy-6.6)}" fill="none" stroke="#fff8e9" stroke-width=".75" stroke-linecap="round" opacity=".6"/>
          <path d="M${r2(cx-8.3)} ${r2(yl+.25)} C${r2(cx-5.2)} ${r2(cy-5.3)} ${r2(cx+5.2)} ${r2(cy-5.3)} ${r2(cx+8.3)} ${r2(yr+.25)}" fill="none" stroke="#27493c" stroke-width="1.4" stroke-linecap="round"/>
        </g></g></g>
      </g>
      <g class="kp-closed">
        <circle cx="${cx}" cy="${cy}" r="${R+.5}" fill="url(#${ID}skin)"/>
        <ellipse cx="${r2(cx-2)}" cy="${r2(cy-4.6)}" rx="4.6" ry="1.5" fill="#ffffff" opacity=".28"/>
        <path d="M${r2(cx-6.4)} ${r2(cy+2.6)} Q${cx} ${r2(cy-4.2)} ${r2(cx+6.4)} ${r2(cy+2.6)}" fill="none" stroke="#27493c" stroke-width="1.5" stroke-linecap="round"/>
      </g>
    </g>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#3f7f62" stroke-width=".6"/>`;
}
/* the wet fringe round the dish: leaf-shaped locks from under the bowl, long
   and short by turns. Angles run 0 (her left side) through 90 (the middle of
   her forehead) to 180; roots, bulge and tips each sit on their own ellipse. */
function kLocks(n,a0,a1,len){
  const P=(cy,rx,ry,t)=>[rx*Math.cos(t),cy+ry*Math.sin(t)], rad=Math.PI/180;
  const step=(a1-a0)/(n-1), w=step*.62*rad;
  let locks='', shine='';
  for(let i=0;i<n;i++){
    const t=(a0+step*i)*rad, k=(i%2?.82:1)*len;
    const [ax,ay]=P(-80,22,5,t-w*1.15), [bx,by]=P(-80,22,5,t+w*1.15);
    const [mx,my]=P(-79,26,7,t), [ex,ey]=P(-77,40.5,14.6,t);
    const tx=mx+(ex-mx)*k, ty=my+(ey-my)*k;
    const [c1x,c1y]=P(-78.4,34,10,t-w), [c2x,c2y]=P(-78.4,34,10,t+w);
    locks+=`M${r2(ax)} ${r2(ay)} Q${r2(c1x)} ${r2(c1y)} ${r2(tx)} ${r2(ty)} Q${r2(c2x)} ${r2(c2y)} ${r2(bx)} ${r2(by)}Z `;
    const [sx,sy]=P(-79,27.5,7.6,t-w*.3);
    shine+=`M${r2(sx)} ${r2(sy)} L${r2(sx+(tx-sx)*.62)} ${r2(sy+(ty-sy)*.62)} `;
  }
  return {locks,shine};
}
/* the record, drawn flat (the dish tips it toward you): the vinyl and its sheen
   stay put, the cucumber-slice label and one scuff turn */
function kRecord(ID,R){
  const rad=Math.PI/180, at=(r,a)=>`${r2(r*Math.cos(a*rad))} ${r2(r*Math.sin(a*rad))}`;
  const wedge=(a,b)=>`M${at(R*.44,a)} L${at(R*.97,a)} A${r2(R*.97)} ${r2(R*.97)} 0 0 1 ${at(R*.97,b)} L${at(R*.44,b)} A${r2(R*.44)} ${r2(R*.44)} 0 0 0 ${at(R*.44,a)}Z`;
  const grooves=[.93,.85,.77,.69,.61,.53].map(k=>`<circle r="${r2(R*k)}" fill="none" stroke="#7d908b" stroke-width=".35" opacity=".5"/>`).join('');
  const seeds=[0,60,120,180,240,300].map(a=>`<ellipse cx="${r2(R*.2)}" cy="0" rx="${r2(R*.075)}" ry="${r2(R*.034)}" transform="rotate(${a+15})" fill="#fbfdf0" stroke="#a9cc7a" stroke-width=".3"/>`).join('');
  return `<circle r="${R}" fill="url(#${ID}vinyl)" stroke="#0e1514" stroke-width=".7"/>${grooves}
    <g class="mp-spin">
      <path d="M${at(R*.88,196)} A${r2(R*.88)} ${r2(R*.88)} 0 0 1 ${at(R*.88,232)}" fill="none" stroke="#c9d6d2" stroke-width=".9" stroke-linecap="round" opacity=".3"/>
      <circle r="${r2(R*.4)}" fill="url(#${ID}slice)" stroke="#4f9a56" stroke-width="${r2(R*.06)}"/>
      <circle r="${r2(R*.3)}" fill="none" stroke="#c5e09a" stroke-width=".8"/>
      ${seeds}
      <circle cx="${r2(R*.25)}" cy="${r2(-R*.25)}" r="${r2(R*.075)}" fill="#ec7a45"/>
      <circle r="${r2(R*.055)}" fill="#1f2e2c"/>
    </g>
    <path d="${wedge(198,228)} ${wedge(18,48)}" fill="#ffffff" opacity=".13"/>
    <path d="${wedge(206,216)}" fill="#ffffff" opacity=".12"/>`;
}
function sara(ID){
  const rad=Math.PI/180;
  /* the marginal scutes round the rim of her shell */
  const scutes=[160,180,200,220,240,260,280,300,320,340,360,380].map(a=>{ const c=Math.cos(a*rad), s=Math.sin(a*rad);
    return `M${r2(44.2*c)} ${r2(-27+23.4*s)} L${r2(50.6*c)} ${r2(-27+27.6*s)}`; }).join(' ');
  /* koi-orange dots on the dish, between its two painted lines */
  const dots=[-20,-13.4,-6.7,0,6.7,13.4,20].map(x=>`<circle cx="${x}" cy="${r2(-88.7+12.4*Math.sqrt(1-(x/28.6)**2))}" r=".75"/>`).join('');
  const back=kLocks(12,-14,194,.9), front=kLocks(13,-22,202,1);
  const foot=s=>`<g transform="scale(${s} 1)">
      <path d="M28.6 -5.8 C22 -8.4 11.6 -7 8.8 -3 C7.8 -1 8.6 .9 10.6 1.1 L27.6 1.3 C31.4 1 32 -3.8 28.6 -5.8Z" fill="#c5e8cc" stroke="#3f7f62" stroke-width=".5"/>
      <path d="M19.4 -5 L13.4 .6 M19.6 -5 L19.6 1.4 M19.8 -5 L26 .6" fill="none" stroke="#8fcfa8" stroke-width=".6" stroke-linecap="round"/>
      <g fill="#e0f3df" stroke="#3f7f62" stroke-width=".4"><circle cx="12.6" cy=".9" r="2"/><circle cx="19.6" cy="1.7" r="2"/><circle cx="26.6" cy=".9" r="2"/></g>
    </g>`;
  const drop=`<path d="M0 -2.2 C1.6 -.4 1.7 1.7 0 1.7 C-1.7 1.7 -1.6 -.4 0 -2.2Z" fill="#e8f4f0" stroke="#8fbfb0" stroke-width=".3"/><circle cx="-.5" cy=".3" r=".45" fill="#ffffff"/>`;
  return `<defs>
    <linearGradient id="${ID}skin" gradientUnits="userSpaceOnUse" x1="0" y1="-86" x2="0" y2="1"><stop offset="0" stop-color="#fff8e9"/><stop offset=".2" stop-color="#e0f3df"/><stop offset=".55" stop-color="#abdcbc"/><stop offset=".82" stop-color="#7dc19b"/><stop offset=".95" stop-color="#4f9a78"/><stop offset="1" stop-color="#173a3b"/></linearGradient>
    <radialGradient id="${ID}edge" cx=".5" cy=".44" r=".62"><stop offset=".58" stop-color="#2f6a4c" stop-opacity="0"/><stop offset="1" stop-color="#2f6a4c" stop-opacity=".4"/></radialGradient>
    <linearGradient id="${ID}shell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6ab70"/><stop offset=".5" stop-color="#96693c"/><stop offset="1" stop-color="#5a3f28"/></linearGradient>
    <linearGradient id="${ID}plate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6da"/><stop offset=".55" stop-color="#f3d99a"/><stop offset="1" stop-color="#d9ac5c"/></linearGradient>
    <linearGradient id="${ID}beak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fde9ae"/><stop offset=".5" stop-color="#f2b04a"/><stop offset="1" stop-color="#c9862f"/></linearGradient>
    <radialGradient id="${ID}iris" cx=".45" cy=".42" r=".6"><stop offset="0" stop-color="#f8d98a"/><stop offset=".55" stop-color="#e2a63c"/><stop offset="1" stop-color="#a8702a"/></radialGradient>
    <linearGradient id="${ID}hair" gradientUnits="userSpaceOnUse" x1="0" y1="-86" x2="0" y2="-62"><stop offset="0" stop-color="#3f8a7d"/><stop offset=".5" stop-color="#256259"/><stop offset="1" stop-color="#143f3f"/></linearGradient>
    <linearGradient id="${ID}bowl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbfdf6"/><stop offset=".5" stop-color="#d6ebdc"/><stop offset="1" stop-color="#8fbfaa"/></linearGradient>
    <radialGradient id="${ID}water" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#eefaf6"/><stop offset="1" stop-color="#a3d2c8"/></radialGradient>
    <linearGradient id="${ID}cuke" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#a3d684"/><stop offset=".45" stop-color="#5fa85c"/><stop offset="1" stop-color="#2f6f42"/></linearGradient>
    <radialGradient id="${ID}slice" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f7fbe6"/><stop offset=".7" stop-color="#e3f1bd"/><stop offset="1" stop-color="#bcdb8c"/></radialGradient>
    ${vinylDef(ID)}
    <clipPath id="${ID}hc"><path d="${K_HEAD}"/></clipPath>
    <clipPath id="${ID}bc"><path d="${K_BODY}"/></clipPath>
    <clipPath id="${ID}sc"><path d="${K_SHELL}"/></clipPath>
  </defs>
  ${pad(ID)}
  <g class="pk-body"><g class="mp-breathe"><g class="kp-bob">
    <!-- her shell, a warm dome behind her, rimmed with scutes -->
    <path d="${K_SHELL}" fill="url(#${ID}shell)" stroke="#4a3424" stroke-width=".6"/>
    <g clip-path="url(#${ID}sc)">
      <ellipse cx="14" cy="-8" rx="50" ry="16" fill="#3a2a22" opacity=".22"/>
      <path d="${K_SHELL}" transform="translate(0 -27) scale(.88 .855) translate(0 27)" fill="none" stroke="#4a3424" stroke-width=".55" opacity=".6"/>
      <path d="${scutes}" fill="none" stroke="#4a3424" stroke-width=".55" opacity=".6"/>
      <path d="M-47.4 -30 C-44 -43.6 -30 -51.4 -10 -52.6" fill="none" stroke="#f6dfae" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
    </g>
    <!-- webbed feet, out in front -->
    ${foot(1)}${foot(-1)}
    <!-- the body, and the pale plate down her front -->
    <path d="${K_BODY}" fill="url(#${ID}skin)" stroke="#3f7f62" stroke-width=".6"/>
    <g clip-path="url(#${ID}bc)">
      <path d="${K_PLATE}" fill="url(#${ID}plate)" stroke="#b98a44" stroke-width=".55"/>
      <path d="M0 -37 L0 -3 M-19.6 -25 C-10 -22.4 10 -22.4 19.6 -25 M-18.8 -13.2 C-10 -10.8 10 -10.8 18.8 -13.2" fill="none" stroke="#b98a44" stroke-width=".6" opacity=".75"/>
      <path d="${K_PLATE}" transform="translate(0 -20) scale(.86) translate(0 20)" fill="none" stroke="#fffaf0" stroke-width=".7" opacity=".55"/>
      <ellipse cx="-8.4" cy="-26.4" rx="6.4" ry="2.6" fill="#ffffff" opacity=".38" transform="rotate(-14 -8.4 -26.4)"/>
      <rect x="-37" y="-41" width="74" height="42" fill="url(#${ID}edge)"/>
      <ellipse cx="0" cy="-33.4" rx="31" ry="6.4" fill="#173a3b" opacity=".2"/>
      <ellipse cx="0" cy="-2.2" rx="28" ry="3.4" fill="#173a3b" opacity=".14"/>
      ${[[-27.4,-16,1.1],[-30.4,-9.4,.9],[-24.6,-8,.75],[26.4,-9,.8]].map(kSpot).join('')}
    </g>
    <!-- the planted arm (viewer's right) and its webbed hand -->
    <path d="${K_ARM_R}" fill="url(#${ID}skin)"/>
    <path d="M27 -36 C36 -35 43 -28 44 -19 C44.6 -12 43 -6 41.6 -2.6 M33.4 -2.6 C34 -8 33 -14 30.4 -19 C29.4 -20.7 28.5 -22.5 27.8 -24.2" fill="none" stroke="#3f7f62" stroke-width=".55" stroke-linecap="round"/>
    ${[[40.4,-22,.95],[42.6,-12.6,.8],[37.6,-9.6,.7]].map(kSpot).join('')}
    <path d="M37.5 -4.6 L27.8 .3 Q32.6 3.5 37.5 2.3 Q42.4 3.5 47.2 .3Z" fill="#c5e8cc" stroke="#3f7f62" stroke-width=".5" stroke-linejoin="round"/>
    <path d="M37.5 -3 L29.4 .4 M37.5 -3 L37.5 1.8 M37.5 -3 L45.6 .4" fill="none" stroke="#9fd6b3" stroke-width="2.2" stroke-linecap="round"/>
    <g fill="#e0f3df" stroke="#3f7f62" stroke-width=".4"><circle cx="28.6" cy=".6" r="1.8"/><circle cx="37.5" cy="2.3" r="1.8"/><circle cx="46.4" cy=".6" r="1.8"/></g>
    <!-- the other arm reaches out, and its fist holds a cucumber with a bite gone -->
    <path d="${K_ARM_L}" fill="url(#${ID}skin)"/>
    <path d="M-26 -36 C-34 -39.5 -45 -35 -51.5 -27 M-40 -21.6 C-37.4 -24.7 -34 -26 -30.4 -26.3" fill="none" stroke="#3f7f62" stroke-width=".55" stroke-linecap="round"/>
    ${[[-40,-31,.9],[-45.4,-27,.75]].map(kSpot).join('')}
    <g transform="translate(-49 -21)"><g class="kp-baton"><g transform="rotate(-10)">
      <path d="M-4.2 -31 Q-2.8 -28 -.6 -30.4 Q1.2 -27.6 4.2 -31.6 C5.3 -21 5.4 -6 4.4 3 C3.6 9.6 -3.6 9.6 -4.4 3 C-5.4 -6 -5.3 -21 -4.2 -31Z" fill="url(#${ID}cuke)" stroke="#2a5e3a" stroke-width=".6" stroke-linejoin="round"/>
      <path d="M1.7 -25 C2.2 -15 2.2 -5 1.7 4" fill="none" stroke="#245a37" stroke-width=".5" opacity=".4"/>
      <path d="M-2.9 -23 C-3.6 -14 -3.5 -6 -2.9 1.6" fill="none" stroke="#ffffff" stroke-width="1.1" stroke-linecap="round" opacity=".34"/>
      <g fill="#e4f4c4" opacity=".8"><circle cx="-.6" cy="-19" r=".55"/><circle cx="3" cy="-13" r=".55"/><circle cx="-.2" cy="-8" r=".55"/><circle cx="3.1" cy="-22.4" r=".5"/><circle cx="2.4" cy="-1.6" r=".5"/><circle cx="-1" cy="2.6" r=".5"/></g>
      <path d="M-4.2 -31 Q-2.8 -28 -.6 -30.4 Q1.2 -27.6 4.2 -31.6 L4.6 -28.8 Q1.5 -24.6 -.7 -27.4 Q-2.8 -25 -4.6 -28.2Z" fill="#eef8d4" stroke="#2a5e3a" stroke-width=".45" stroke-linejoin="round"/>
      <g fill="#c3dc94"><ellipse cx="-2.5" cy="-27.4" rx=".7" ry=".4"/><ellipse cx="1.5" cy="-26.8" rx=".7" ry=".4"/><ellipse cx="3.4" cy="-29.2" rx=".5" ry=".35"/></g>
    </g></g></g>
    <path d="M-55 -23 C-55.6 -18.4 -52.6 -15.2 -48.6 -15.4 C-44.6 -15.4 -42.2 -18.6 -42.8 -22.4 C-43.4 -26.2 -46.6 -27.8 -49.6 -27.4 C-52.6 -27.2 -54.6 -25.6 -55 -23Z" fill="#c5e8cc" stroke="#3f7f62" stroke-width=".55"/>
    <path d="M-54.4 -22.8 C-50.8 -23.9 -47 -23.7 -43.4 -22.2 M-54.8 -19.6 C-51 -20.6 -47 -20.4 -43.8 -19" fill="none" stroke="#3f7f62" stroke-width=".5" stroke-linecap="round" opacity=".75"/>
    <ellipse cx="-50.4" cy="-25.2" rx="3" ry="1" fill="#ffffff" opacity=".5"/>
    <!-- the head: it rocks with the music, dish and all -->
    <g transform="translate(0 -33)"><g class="kp-rock"><g transform="translate(0 33)">
      <path d="${K_HEAD}" fill="url(#${ID}skin)" stroke="#3f7f62" stroke-width=".6"/>
      <g clip-path="url(#${ID}hc)">
        <rect x="-40" y="-83" width="80" height="53" fill="url(#${ID}edge)"/>
        <ellipse cx="0" cy="-66" rx="36" ry="7.4" fill="#173a3b" opacity=".16"/>
        <ellipse cx="-29" cy="-58.6" rx="5.4" ry="2.4" fill="#ffffff" opacity=".3" transform="rotate(-58 -29 -58.6)"/>
        ${[[-33,-52,1.2],[-35.4,-46.4,.9],[-30.4,-41.6,.8],[33,-52,1.2],[35.4,-46.4,.9],[30.4,-41.6,.8]].map(kSpot).join('')}
      </g>
      <ellipse cx="-27.5" cy="-44.6" rx="5.4" ry="3" fill="#f48a78" opacity=".4"/>
      <ellipse cx="27.5" cy="-44.6" rx="5.4" ry="3" fill="#f48a78" opacity=".4"/>
      ${kEye(-17.5,-55,-1,ID)}
      ${kEye(17.5,-55,1,ID)}
      <!-- the beak: short, wide, a little pleased with itself -->
      <path d="M-8.6 -39.8 C-5 -35.6 5 -35.6 8.6 -39.8 C4 -38.2 -4 -38.2 -8.6 -39.8Z" fill="#c9862f" stroke="#8a5a22" stroke-width=".5" stroke-linejoin="round"/>
      <path d="M-12.6 -44.6 C-12 -50.4 -5.4 -52.6 0 -52.6 C5.4 -52.6 12 -50.4 12.6 -44.6 C13 -40.8 7.6 -39 0 -39 C-7.6 -39 -13 -40.8 -12.6 -44.6Z" fill="url(#${ID}beak)" stroke="#8a5a22" stroke-width=".55"/>
      <path d="M-12.5 -43.4 C-13.6 -44.2 -14.5 -45.5 -14.4 -46.9 M12.5 -43.4 C13.6 -44.2 14.5 -45.5 14.4 -46.9" fill="none" stroke="#8a5a22" stroke-width=".9" stroke-linecap="round"/>
      <ellipse cx="-3" cy="-48.4" rx="1" ry=".6" fill="#8a5a22" opacity=".75"/><ellipse cx="3" cy="-48.4" rx="1" ry=".6" fill="#8a5a22" opacity=".75"/>
      <ellipse cx="-4.8" cy="-50" rx="4.2" ry="1.2" fill="#ffffff" opacity=".5" transform="rotate(-9 -4.8 -50)"/>
      <!-- the wet fringe that rings the dish -->
      <ellipse cx="0" cy="-79" rx="30" ry="8.5" fill="#123f3c"/>
      <path d="${back.locks}" fill="#123f3c"/>
      <path d="${front.locks}" fill="url(#${ID}hair)" stroke="#0f3b41" stroke-width=".4" stroke-linejoin="round"/>
      <path d="${front.shine}" fill="none" stroke="#8fd0c0" stroke-width=".65" stroke-linecap="round" opacity=".5"/>
      <!-- the dish: celadon, two painted lines and a row of koi dots -->
      <ellipse cx="1" cy="-74.6" rx="25" ry="4.4" fill="#0b2e2c" opacity=".4"/>
      <path d="M-30 -90 C-30 -79 -15 -72 0 -72 C15 -72 30 -79 30 -90Z" fill="url(#${ID}bowl)" stroke="#5f9a86" stroke-width=".55"/>
      <path d="M-27.5 -85 A29.2 11.2 0 0 0 27.5 -85" fill="none" stroke="#ec7a45" stroke-width="1" stroke-linecap="round"/>
      <path d="M-24.6 -82.4 A28 13.6 0 0 0 24.6 -82.4" fill="none" stroke="#2f7a74" stroke-width=".55" stroke-linecap="round" opacity=".8"/>
      <g fill="#ec7a45" opacity=".85">${dots}</g>
      <ellipse cx="-20.4" cy="-80.6" rx="3.6" ry="1.1" fill="#ffffff" opacity=".7" transform="rotate(28 -20.4 -80.6)"/>
      <circle cx="17.4" cy="-78.6" r="1.35" fill="#e8f4f0" stroke="#8fbfb0" stroke-width=".3"/><circle cx="17" cy="-79" r=".45" fill="#ffffff"/>
      <ellipse cx="0" cy="-90" rx="30" ry="9.6" fill="#fbfdf6" stroke="#5f9a86" stroke-width=".55"/>
      <ellipse cx="0" cy="-89.6" rx="27.8" ry="8.9" fill="#86b6a4"/>
      <ellipse cx="0" cy="-89.2" rx="27" ry="8.6" fill="url(#${ID}water)"/>
      <g transform="translate(0 -89.3)"><g class="kp-ripple"><ellipse rx="25" ry="7.95" fill="none" stroke="#ffffff" stroke-width=".5" opacity=".6"/></g></g>
      <!-- the record afloat in it -->
      <ellipse cx="0" cy="-88.5" rx="22.6" ry="7.25" fill="#0b1211"/>
      <g transform="translate(0 -89.4) scale(1 .32)">${kRecord(ID,22.6)}</g>
      <path d="M-23.4 -93 C-18 -96.4 -9.4 -97.6 -1 -97.7" fill="none" stroke="#ffffff" stroke-width=".8" stroke-linecap="round" opacity=".75"/>
      <!-- the tonearm: a twig of bamboo, a lotus seed for its weight, a leaf for its head -->
      <g transform="translate(24.6 -95.5)"><g class="kp-arm">
        <path d="M3.8 -2.1 L-12 6.6" fill="none" stroke="#7a5a2a" stroke-width="2.1" stroke-linecap="round"/>
        <path d="M3.8 -2.1 L-12 6.6" fill="none" stroke="#ecd9a0" stroke-width="1.25" stroke-linecap="round"/>
        <path d="M-3.4 .9 L-2.5 2.5 M-7.8 3.3 L-6.9 4.9" fill="none" stroke="#7a5a2a" stroke-width=".6" stroke-linecap="round"/>
        <circle cx="4.6" cy="-2.6" r="2.3" fill="#6b4a33" stroke="#3a2a22" stroke-width=".4"/><circle cx="3.9" cy="-3.3" r=".7" fill="#f3d9a8" opacity=".8"/>
        <path d="M-10 5.5 C-11.6 3.6 -14.6 4.2 -15.6 7 C-13.6 8.9 -10.6 8.4 -10 5.5Z" fill="#7fb07c" stroke="#3f6f55" stroke-width=".45" stroke-linejoin="round"/>
        <path d="M-10.4 5.8 L-15 6.9" fill="none" stroke="#3f6f55" stroke-width=".35" stroke-linecap="round"/>
      </g></g>
      <circle cx="24.6" cy="-95.5" r="2.2" fill="#d9bd7c" stroke="#7a5a2a" stroke-width=".5"/><circle cx="24" cy="-96.1" r=".7" fill="#fff8e9" opacity=".8"/>
      <!-- drops jump the rim when the music's on -->
      <g class="kp-drops"><g transform="translate(29 -92)"><g class="kp-drop">${drop}</g></g><g transform="translate(-29 -92) scale(-1 1)"><g class="kp-drop d2">${drop}</g></g></g>
    </g></g></g>
  </g></g></g>
  ${notes(47,-99,'#ec7a45')}
  ${zz(40,-70)}`;
}
PetKit.register({id:'sara',name:'Sara',kind:'kappa',blurb:'Floats a record in the dish on her head.',art:sara,css:`/* the kappa: blink and glance while she waits; record, rock, baton and drops while it plays */
.kp-blink{animation:kp-blink 6.8s ease-in-out infinite}
.kp-gaze{animation:kp-gaze 12s ease-in-out infinite}
.kp-arm{transform:rotate(-33deg);transition:transform .55s cubic-bezier(.3,1.3,.5,1)}
.kp-closed,.kp-drops{opacity:0}
.playing .kp-arm{transform:rotate(0deg)}
.playing .kp-open{opacity:0;animation:kp-peek 9.2s linear infinite}
.playing .kp-closed{opacity:1;animation:kp-peekc 9.2s linear infinite}
.playing .kp-bob{animation:kp-bob .86s ease-in-out infinite}
.playing .kp-rock{animation:kp-rock 1.72s ease-in-out infinite}
.playing .kp-baton{animation:kp-baton 1.72s ease-in-out infinite}
.playing .kp-ripple{animation:kp-ripple 1.72s ease-out infinite}
.playing .kp-drops{opacity:1}
.playing .kp-drop{animation:kp-drop 1.72s ease-out infinite}
.playing .kp-drop.d2{animation-delay:-.86s}
@keyframes kp-blink{0%,90%,96%,100%{transform:scaleY(1)}92.5%,94%{transform:scaleY(3.1)}}
@keyframes kp-gaze{0%,36%,92%,100%{transform:translate(0,0)}40%,56%{transform:translate(-1.3px,.2px)}60%,76%{transform:translate(1.2px,.3px)}80%{transform:translate(0,0)}}
@keyframes kp-peek{0%,82%{opacity:0}84%,94%{opacity:1}96%,100%{opacity:0}}
@keyframes kp-peekc{0%,82%{opacity:1}84%,94%{opacity:0}96%,100%{opacity:1}}
@keyframes kp-bob{0%,100%{transform:none}50%{transform:translateY(1.1px) scale(1.014,.984)}}
@keyframes kp-rock{0%,100%{transform:rotate(-2.6deg)}50%{transform:rotate(2.6deg)}}
@keyframes kp-baton{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(7deg)}}
@keyframes kp-ripple{0%{transform:scale(.9);opacity:0}30%{opacity:1}100%{transform:scale(1.06);opacity:0}}
@keyframes kp-drop{0%{transform:translate(0,0) scale(.4);opacity:0}20%{opacity:.95}55%{transform:translate(4px,-9px) scale(1)}100%{transform:translate(8px,4px) scale(.7);opacity:0}}
/* now and then: a bite of the cucumber */
.fidget .kp-baton{animation:kp-bite 2.4s ease-in-out}
@keyframes kp-bite{0%,100%{transform:rotate(0)}28%,62%{transform:rotate(36deg)}40%{transform:rotate(31deg)}50%{transform:rotate(37deg)}}
/* paused a long while: she dozes, head dipped, eyes shut */
.sleepy .kp-open{opacity:0}
.sleepy .kp-closed{opacity:1}
.sleepy .kp-rock{transform:rotate(3deg) translateY(1.2px);transition:transform 1.2s ease-in-out}
.sleepy .kp-arm{transform:rotate(-38deg)}`});
})();
