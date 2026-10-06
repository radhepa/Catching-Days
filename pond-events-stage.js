/* The cutscene set shares the app's actual Pond renderer. No save or mood data. */
(function(){
  'use strict';
  let serial=0;
  const evening=(scene,beat=0)=>scene.prop==='moon'||scene.prop==='score'||(scene.prop==='lantern'&&beat>=10);
  // The establishing shot: an illustrated sky in the pond's own palette (teal
  // air, warm paper light, cream-topped clouds), a horizon, and open water that
  // reflects the sky and deepens into the pond's teal, so the camera can tilt
  // from sky to pond without a seam. Sky and water only: no land. Placement is
  // fixed and seeded locally, so the shared Pond seed is never touched.
  const CLOUDS={
    a:{d:'M14 78C6 78 4 66 14 63C12 52 26 46 36 52C40 36 60 30 72 42C80 24 108 20 120 38C132 30 150 34 152 48C166 44 182 52 180 64C192 66 194 78 184 78Z'},
    b:{d:'M30 78C18 78 16 64 28 61C26 46 44 40 54 48C58 28 84 20 98 34C108 22 130 26 132 42C146 38 162 48 158 60C172 60 176 78 162 78Z'},
    c:{d:'M8 78C2 78 4 70 12 69C16 62 30 60 38 64C46 54 66 54 74 62C84 56 100 57 104 64C116 60 132 62 134 69C146 68 154 76 146 78Z'}
  };
  const PALETTE={
    day:{cloud:['#fffdf6','#f3f1e6','#cde0d8']},
    rain:{cloud:['#e9eee9','#c3d1cc','#97aeaa']},
    night:{cloud:['#3f656c','#2a4c58','#1c3c48']}
  };
  function sky(scene){
    const id='pe-sky-'+(++serial),night=evening(scene),rain=!night&&['umbrella','picnic'].includes(scene.prop);
    const mode=night?'night':rain?'rain':'day',P=PALETTE[mode];
    let seed=97;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
    const cloud=([shape,x,y,width,opacity],i)=>{const c=CLOUDS[shape];
      return `<svg class="pe-sky-cloud" style="left:${x}%;top:${y}%;--pe-w:${width}%;opacity:${opacity}" viewBox="0 0 200 84" focusable="false"><defs>
        <linearGradient id="${id}-cloud-${i}" x1="0" y1="0" x2="0" y2="1"><stop offset=".2" stop-color="${P.cloud[0]}"/><stop offset=".62" stop-color="${P.cloud[1]}"/><stop offset="1" stop-color="${P.cloud[2]}"/></linearGradient></defs>
        <path d="${c.d}" fill="url(#${id}-cloud-${i})"/></svg>`;};
    const layout={
      day:[['a',3,9,31,1],['b',46,2,22,.97],['c',34,31,22,.92],['a',77,37,16,.86],['c',-3,46,15,.8],['b',52,50,9,.7]],
      rain:[['a',-8,0,48,1],['b',38,-4,42,1],['a',68,6,42,1],['c',8,28,36,.95],['b',54,30,28,.92],['c',78,44,22,.85],['a',24,47,16,.8]],
      night:[['c',4,20,27,.85],['c',55,41,24,.7],['a',22,49,14,.55]]
    }[mode];
    const clouds=layout.map(cloud).join('');
    const stars=night?Array.from({length:22},(_,i)=>{const x=r1(rnd()*96+2),y=r1(rnd()*54+3),s=r1(1.3+rnd()*1.6);return `<i class="pe-sky-star" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;--pe-delay:-${r1(i*.7)}s"></i>`;}).join(''):'';
    const birds=mode==='day'?[[35.5,17,22,0],[39,14,17,.25],[42,18.5,13,.5]].map(([x,y,w,d])=>`<svg class="pe-sky-bird" style="left:${x}%;top:${y}%;width:${w}px;--pe-delay:-${d}s" viewBox="0 0 14 6" focusable="false"><path d="M1 4.6Q4 .6 7 4.4Q10 .6 13 4.6" fill="none" stroke="#3f6b67" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`).join(''):'';
    const rainfall=rain?'<div class="pe-sky-rainfall">'+Array.from({length:34},(_,i)=>`<i style="left:${r1(rnd()*100)}%;top:${r1(rnd()*60)}%;--pe-delay:-${r1(rnd()*.9)}s"></i>`).join('')+'</div>':'';
    // the light: a sun by day, the moon by night, a pale patch in rain
    const light=night?`<svg class="pe-sky-moon" viewBox="0 0 80 80" focusable="false"><defs><radialGradient id="${id}-moon" cx=".38" cy=".34" r=".72"><stop stop-color="#fffaee"/><stop offset=".7" stop-color="#fff1c6"/><stop offset="1" stop-color="#e3dcb6"/></radialGradient></defs><circle cx="40" cy="40" r="25" fill="url(#${id}-moon)"/><g fill="#9fb3a4" opacity=".18"><ellipse cx="48" cy="45" rx="7" ry="4.5"/><circle cx="31" cy="32" r="3.6"/><circle cx="36" cy="53" r="2.6"/></g></svg>`:
      rain?'':'<div class="pe-sky-sun"><i></i></div>';
    // open water below the horizon: shimmer lines, the light's glint, far pads
    const shimmer=Array.from({length:26},(_,i)=>{const t=i/25,y=r1(2+96*Math.pow(t,1.55)),x=r1(rnd()*92),w=r1(3+t*13+rnd()*6);
      return `<path d="M${x} ${y}H${r1(x+w)}" opacity="${r1(.5-t*.28)}" vector-effect="non-scaling-stroke"/>`;}).join('');
    const glint=rain?'':'<div class="pe-sky-glint">'+[[3,9],[8,7.5],[14,6.2],[21,5],[29,3.8],[38,2.8],[48,2]].map(([y,w],i)=>`<i style="top:${y}%;width:${w}%;--pe-delay:-${r1(i*.35)}s"></i>`).join('')+'</div>';
    const pad=(x,y,w,flat,rot,col)=>`<i class="pe-far-pad" style="left:${x}%;top:${y}%;width:${w}%;--pe-flat:${flat};--pe-pad-rotation:${rot}deg;--pe-pad-color:${col}"></i>`;
    const pads=[pad(13,16,1.9,.22,40,'#7fa98a'),pad(87,11,1.5,.2,210,'#7fa98a'),pad(30,42,3.1,.3,130,'#6f9e7a'),pad(67,54,4.3,.36,300,'#6f9e7a'),pad(91,71,5.6,.44,80,'#5f9470'),pad(6,80,6.4,.48,250,'#5a8d69')].join('');
    const drops=rain?'<div class="pe-sky-drops">'+[[22,30],[48,18],[58,62],[78,40],[36,76],[84,84]].map(([x,y],i)=>`<i style="left:${x}%;top:${y}%;--pe-delay:-${r1(i*.45)}s"></i>`).join('')+'</div>':'';
    return `<div class="pe-sky pe-sky-${mode}${night?' pe-sky-night':''}${rain?' pe-sky-rain':''}" data-world="sky-to-pond" aria-hidden="true">
      <div class="pe-sky-air"></div><div class="pe-sky-glow"></div>${light}${stars}
      <div class="pe-sky-clouds">${clouds}</div>${birds}${rainfall}
      <div class="pe-sky-water"><svg class="pe-sky-shimmer" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false"><g stroke="${night?'#cfe9e3':'#fff8e9'}" stroke-width="1" stroke-linecap="round" fill="none">${shimmer}</g></svg>${glint}${pads}${drops}</div>
      <div class="pe-sky-horizon"></div>
    </div>`;
  }
  const r1=n=>Math.round(n*10)/10;
  function svg(scene){
    const P=window.Pond,id='pe-water-'+(++serial),night=evening(scene);
    // Same conic pad construction as Pond.pad on Today and Focus. Percentage
    // placement keeps the pads circular instead of stretching a flat drawing.
    const pad=(x,y,size,rot,col,bloom)=>`<div class="pe-water-pad" style="left:${x}%;top:${y}%;--pe-pad-size:${size}px;--pe-pad-rotation:${rot}deg;--pe-pad-color:${col}"><i></i>${bloom&&P?'<span class="pe-pad-flower">'+P.plant(bloom,size*.55,true)+'</span>':''}</div>`;
    const pads=[pad(89,14,83,30,'#5f9470','great'),pad(79,24,42,200,'#6f9e7a',null),pad(7,69,67,120,'#5a8d69','good'),pad(91,85,65,280,'#6f9e7a',null),pad(16,10,43,45,'#5a8d69',null)].join('');
    const rings=[[25,36,120,0],[75,58,92,2],[57,16,76,4]].map(([x,y,size,delay])=>`<i class="pe-water-ring" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px;--pe-delay:-${delay}s"></i>`).join('');
    const fish=P?[[34,30,-18,1.25],[66,52,154,.95]].map(([x,y,angle,s])=>`<div class="pe-deep-shadow" style="left:${x}%;top:${y}%;transform:rotate(${angle}deg)">${P.creature('koi','#0a2a2f','#0a2a2f',s,0,'flat')}</div>`).join(''):'';
    const glints=[[26,23,20],[70,35,14],[39,74,17],[85,64,11],[20,55,12],[57,9,15]].map(([x,y,w],i)=>`<i class="pe-water-glint" style="left:${x}%;top:${y}%;width:${w}px;--pe-delay:-${i*.73}s"></i>`).join('');
    const rain=['umbrella','picnic'].includes(scene.prop)?'<div class="pe-water-rain"><i style="left:38%;top:44%"></i><i style="left:60%;top:20%"></i><i style="left:81%;top:71%"></i></div>':'';
    return `<div class="pe-landscape${night?' pe-water-night':''}" data-art="catching-days-pond" aria-hidden="true">
      <svg class="pe-water-reflections" viewBox="0 0 900 500" preserveAspectRatio="none" focusable="false"><defs><linearGradient id="${id}-reed" x2=".7" y2="1"><stop stop-color="#729b78"/><stop offset="1" stop-color="#0e3938"/></linearGradient></defs>
        <g class="pe-reed-stems" stroke="url(#${id}-reed)" stroke-linecap="round" fill="none"><path d="M-8 465Q13 355 7 283M-6 448Q33 376 48 354M905 471Q892 367 915 295M908 453Q856 388 856 359" stroke-width="4"/><path d="M-7 479Q41 425 55 402M903 494Q856 428 845 401" stroke-width="7"/></g>
      </svg>
      ${fish}${rings}${pads}${glints}${rain}
      <div class="pe-passing-petals"><i style="left:35%;top:28%"></i><i style="left:74%;top:82%"></i></div>
      ${night||scene.prop==='lantern'?'<div class="pe-water-moon"><i></i><span></span></div>':''}
    </div>`;
  }
  window.PondMomentsStage={svg,sky,evening};
})();
