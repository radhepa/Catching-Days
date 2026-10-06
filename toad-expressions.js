/* Reusable facial acting for the existing SVG cast. Base art is never changed.
   ToadExpressions.svg(name, {expression:'curious', ...ToadArt options})
   ToadExpressions.apply(svgElement, name, expression) updates an existing face.
   Load after ToadArt; the current production design is resolved at render time.

   A face is lids (scaleY per eye; 'closed' shuts that eye), mouth depth, gaze,
   and optional extras:
     corners [l,r]  lift/drop a mouth corner      round  a small "o" mouth
     brow [l,r]     Sumi's brows (negative = raised)
     mouth          'open' (a laugh), 'yawn', or 'wavy' (flustered)
     mw             mouth width, as a share of the full mouth
     puff [sx,sy]   the throat pouch swells (pride, indignation)
     fx             drawn extras: blush, sweat, zzz, sparkle, ask, huff, tear,
                    glisten, shine (sparkly pupils)
     pose           the whole body: perk, slump, tilt, tiltr (held), and with
                    motion on: laugh, chuckle, nod, bow, hop, shiver, sway,
                    snore, stretch
     sleepy         Hotaru keeps his sleepy nod
   Extras are added and removed with the face; neutral is the untouched art. */
(function(){
  'use strict';
  const face=(label,hint,lids,depth,gaze=[0,0],extra={})=>({label,hint,lids,depth,gaze,...extra});
  const catalog={
    hasu:{
      amused:face('Quietly amused','A small, knowing smile at a very serious joke.',[1.08,1.08],5,[0,0],{corners:[1,-1]}),
      skeptical:face('Skeptical','One raised lid; she would like an explanation.',[.58,1.22],.5,[-1,0]),
      curious:face('Curious','Both lids lift as she studies a tiny discovery.',[.48,.48],1,[0,-.5]),
      tender:face('Tender','Soft eyes and a warm smile for the pond’s small guests.',[1.2,1.2],6),
      surprised:face('A rare surprise','For once, the pond has done something she did not expect.',[.28,.32],0,[0,-.5],{round:true}),
      resigned:face('Dry resignation','A patient, downward glance; apparently the spare leaf has tenants now.',[1.3,1.3],-.8,[0,1.2]),
      chuckle:face('A dry chuckle','Her eyes crease shut and she laughs, once. The joke was hers.',['closed','closed'],5.5,[0,0],{mouth:'open',pose:'chuckle'}),
      wistful:face('Wistful','A faraway look toward somewhere she used to sit.',[1.25,1.25],1.2,[-1.4,.8],{fx:['glisten'],pose:'slump'}),
      annoyed:face('Mildly annoyed','A short, flat mouth and a sideways look. She will say so, once.',[1.15,1.05],-1.2,[1.4,0],{mw:.55,fx:['huff'],puff:[1.06,1.18]}),
      wink:face('A knowing wink','One eye closes; she is in on it.',[1,'closed'],4,[0,0],{corners:[1,-2]}),
      unimpressed:face('Unimpressed','Lids at half-mast and a long look at the sky.',[1.28,1.28],-.3,[0,-1.6],{mw:.75}),
      considering:face('Considering','“Hm.” A tilt of the head while she weighs it.',[.95,1.2],.6,[-1.2,-.6],{mw:.6,pose:'tilt'}),
      fond:face('Fond','Eyes softly shut and a smile meant for everyone present.',['closed','closed'],5,[0,0],{fx:['blush'],pose:'nod'}),
      touched:face('Touched','Glistening eyes and a quiet smile: an old place, a new road.',[1.1,1.1],4.5,[0,.4],{fx:['tear','blush']})
    },
    ame:{
      attentive:face('Attentive','Quietly alert, watching before he speaks.',[.5,.5],.5,[0,-.4]),
      puzzled:face('Puzzled','An uneven glance and a slight downturn.',[.52,1.02],-2,[-1.2,0]),
      certain:face('Matter-of-fact','Level, steady eyes; the answer is simple.',[.93,.93],0,[0,0]),
      content:face('Content','A rare little smile when everyone is sheltered.',[1.25,1.25],4),
      watchful:face('Watchful','His eyes follow the tiny movement beneath a hat.',[.8,.8],-.5,[1.8,.2]),
      wry:face('Dryly amused','An almost invisible smile at a perfectly practical solution.',[1.06,1.12],2,[-.3,.4],{corners:[0,-2]}),
      squint:face('Squinting','Light in his eyes; everything narrows to a line.',[1.45,1.45],-1.2,[0,0],{mw:.6,pose:'slump'}),
      deadpan:face('Deadpan','Heavy lids, a level mouth, and no further comment.',[1.18,1.18],-.2,[-.8,0],{mw:.8}),
      glad:face('Openly glad','The rarest thing at the pond: Ame, plainly smiling.',['closed','closed'],5,[0,0],{fx:['blush'],pose:'perk'}),
      nodding:face('A single nod','Agreed. No further words required.',[.98,.98],1,[0,.6],{pose:'nod'}),
      alert:face('On alert','Wide eyes toward the sky; something is changing.',[.4,.4],-.5,[.6,-1.3],{pose:'perk'}),
      chuckle:face('A quiet chuckle','A short, silent laugh, mostly in the shoulders.',[1.3,1.3],3,[0,0],{corners:[-1,0],pose:'chuckle'}),
      pondering:face('Pondering','Eyes up and to one side, working it out.',[.75,.9],-.4,[1.2,-1.2],{mw:.6,fx:['ask'],pose:'tiltr'}),
      gentle:face('Gentle','A soft look reserved for very small guests.',[1.15,1.15],2.6,[0,1.4])
    },
    sumi:{
      thoughtful:face('Thoughtful','A measured sideways look while he considers the wording.',[.9,.64],.3,[-1.1,.4],{brow:[0,-1]}),
      concerned:face('Careful concern','Alert eyes and a small frown for a precious blank page.',[.58,.58],-2.3,[0,-.3],{brow:[-1,-1]}),
      sheepish:face('Sheepish','A lowered glance and an uneven smile after a small oversight.',[1.08,.8],2.2,[1,1.4],{corners:[1,-1],brow:[0,-1]}),
      pleased:face('Quietly pleased','The guardian’s heavy face softens into a satisfied smile.',[1.22,1.22],5.8,[0,0],{brow:[.5,.5]}),
      absorbed:face('Absorbed','Eyes lowered to the brush; even two words deserve care.',[1.08,1.08],0,[0,2]),
      surprised:face('Caught off guard','A small, round pause when his carefully prepared plan returns.',[.42,.42],0,[0,-.3],{round:true,brow:[-1.3,-1.3]}),
      flustered:face('Flustered','Caught mid-sentence; the stone face goes pink.',[.5,.62],0,[1.5,.6],{mouth:'wavy',fx:['blush','sweat'],brow:[-1.2,-1.2],pose:'shiver'}),
      indignant:face('Politely indignant','A puffed throat and a firm line. How discourteous.',[1.12,1.12],-1.6,[0,0],{mw:.6,brow:[1.2,1.2],puff:[1.1,1.28],pose:'perk'}),
      relieved:face('Relieved','His eyes close and a long-held breath finally leaves.',['closed','closed'],3.5,[0,0],{brow:[-.6,-.6],fx:['huff'],pose:'slump'}),
      determined:face('Determined','Brows set, eyes level. This time, one clear note.',[.95,.95],-.4,[0,0],{mw:.7,brow:[1,1],pose:'perk'}),
      dismayed:face('Dismayed','Wide eyes and a sinking mouth as the plan comes apart.',[.45,.45],-3,[0,.8],{brow:[-1.4,-1.4],fx:['sweat'],pose:'slump'}),
      proud:face('Quietly proud','Chin up and throat full; he has made something for the pond.',['closed','closed'],4,[0,0],{brow:[-.5,-.5],puff:[1.08,1.22],pose:'perk'}),
      bowing:face('A polite bow','Eyes lowered; he bows exactly as far as the apology needs.',[1.35,1.35],.8,[0,1.6],{pose:'bow'}),
      nervous:face('Nervous','A careful, wobbly smile while something precious is handled.',[.55,.55],1,[-.8,.3],{mouth:'wavy',fx:['sweat'],brow:[-1,-1]})
    },
    tabi:{
      cheerful:face('Cheerful','Bright eyes and a broad greeting for a very small journey.',[.55,.55],8),
      curious:face('Curious','A lifted lid and a searching glance toward the new arrival.',[.42,.85],3.2,[1.2,-.2]),
      reassuring:face('Reassuring','A gentle, patient smile; she has time to wait.',[1.16,1.16],5),
      amused:face('Amused','Eyes nearly closed with a big, affectionate grin.',[1.65,1.65],9),
      proud:face('Quietly proud','A lifted glance and an uneven grin for her traveling companion.',[1.02,.62],6,[0,-1.1],{corners:[-1,0]}),
      sympathetic:face('Sympathetic','A softer smile and an understanding look; greeting a pebble is difficult.',[.86,.86],2.4,[0,1]),
      laughing:face('Laughing','Eyes squeezed shut and a big, open laugh.',['closed','closed'],7,[0,0],{mouth:'open',pose:'laugh'}),
      excited:face('Excited','Wide, shining eyes; this is the best thing on the whole road.',[.4,.4],6.5,[0,-.6],{mouth:'open',fx:['shine','sparkle'],pose:'hop'}),
      sheepish:face('Sheepish','A crooked little smile; it was going to look more finished.',[1.12,.9],2,[1.2,1.2],{mouth:'wavy',fx:['blush'],pose:'slump'}),
      determined:face('Determined','A set smile; she is already on her way.',[.85,.85],3,[0,0],{corners:[-1,-1],pose:'perk'}),
      wink:face('A wink','One eye shut: skipping a stop, in spirit.',[.8,'closed'],7,[0,0],{corners:[0,-1.5]}),
      pondering:face('Pondering','A look up at the clouds while a plan rearranges itself.',[.7,.95],1.2,[-1.2,-1.3],{mw:.6,fx:['ask'],pose:'tilt'}),
      astonished:face('Astonished','Round eyes and a round mouth; somebody got here first.',[.3,.3],0,[0,-.3],{round:true,pose:'perk'}),
      encouraging:face('Encouraging','A warm nod. Say it plainly; you are doing well.',[1.05,1.05],5.5,[0,.4],{pose:'nod'})
    },
    hotaru:{
      drowsy:face('Drowsy','Heavy lids and a little resting smile.',[1.3,1.3],2),
      curious:face('Sleepily curious','One eye opens a little more to inspect a small light.',[.54,.85],1,[.8,-.3]),
      bewildered:face('Bewildered','Suddenly awake, with a small round mouth.',[.35,.35],0,[0,0],{round:true}),
      delighted:face('Sleepy delight','A soft, unmistakable smile at a little moon in a cup.',[1.12,1.12],6),
      startled:face('A tiny startle','One eye flies open before the other quite catches up.',[.25,.62],0,[-1.5,-.2],{round:true}),
      peaceful:face('Perfectly peaceful','Closed, comfortable eyes and a smile that has nowhere to hurry.',[1.36,1.36],3.5,[0,1]),
      asleep:face('Fast asleep','Eyes shut, a tiny snore, and nowhere he needs to be.',['closed','closed'],1.5,[0,0],{fx:['zzz'],pose:'snore',sleepy:true}),
      yawning:face('A big yawn','A slow, enormous yawn that is mostly mouth.',['closed','closed'],0,[0,0],{mouth:'yawn',pose:'stretch',sleepy:true}),
      dreamy:face('Dreamy','A faraway smile at something only half visible.',[1.12,1.12],3,[.8,-1.2],{fx:['sparkle'],pose:'sway',sleepy:true}),
      wistful:face('Wistful','A small downturn; a view is not quite the same as having one.',[1.2,1.2],-1.2,[-.6,1],{fx:['glisten']}),
      dazed:face('Blinking awake','One eye open, the other still catching up with the question.',[.7,1.25],0,[.6,0],{mw:.5,fx:['ask']}),
      sheepish:face('Sheepish','A slow, apologetic smile; he lit the wrong face.',[1.05,1.15],1.8,[1.2,1],{mouth:'wavy',fx:['blush','sweat']}),
      glowing:face('Glowing','Warm cheeks and a contented smile, as if lit from inside.',['closed','closed'],5,[0,0],{fx:['blush','sparkle']}),
      earnest:face('Earnest','Both eyes properly open, for once. This matters.',[.5,.5],.3,[0,-.4],{mw:.55,pose:'perk'})
    }
  };
  // Mouth anchors belong to the existing designs, including Sumi’s stone guardian.
  // fx anchors were measured from the same art: eye [x, pupil y, radius, lid top]
  // for the viewer's right eye, and blush [x, y, rx, ry] for the right cheek.
  // side -1 puts sweat, "?" and sleep on the viewer's left (Hotaru's jar is on the right).
  const profiles={hasu:{w:35,y:-38.6,crop:'-38 -88 76 76',fx:{eye:[21,-57,10,-69.3],blush:[27,-44,5.5,2.3]}},
    ame:{w:36,y:-26.4,crop:'-45 -72 90 74',fx:{eye:[19,-39.2,8.4,-47],blush:[28,-29.8,4.8,1.9]}},
    sumi:{w:39,y:-39,crop:'-44 -86 88 88',fx:{eye:[21.4,-55.8,9.6,-64.4],blush:[29,-42.5,5.2,2.1]}},
    tabi:{w:31,y:-42.6,crop:'-43 -90 86 82',fx:{eye:[18,-55.2,8.8,-65.4],blush:[25,-45.2,4.6,1.7]}},
    hotaru:{w:21,y:-29.6,crop:'-32 -69 64 64',fx:{eye:[12.6,-40,8.3,-45.5],blush:[19.5,-31.8,3.6,1.5],side:-1}}};
  const original=new WeakMap();
  function anchors(svg,name){
    const p=profiles[name];if(!p)return null;
    const looks=[...svg.querySelectorAll('.td-look')];
    if(looks.length!==2)return null;
    const prefix='M-'+p.w+' '+p.y+' C';
    const mouth=[...svg.querySelectorAll('path')].filter(el=>el.getAttribute('d')?.startsWith(prefix));
    if(mouth.length!==3)return null; // Unknown future design: retain its untouched face.
    const brows=name==='sumi'?[...svg.querySelectorAll('path')].filter(el=>/^(M11 -63\.2|M11\.8 -61\.6|M13\.4 -65\.6)/.test(el.getAttribute('d'))):[];
    const throat=svg.querySelector('.td-throat'),throatRoot=throat?.parentElement,pouch=throat?.querySelector('ellipse');
    const nodes=[...mouth,...brows,...looks,...svg.querySelectorAll('.td-gaze'),...svg.querySelectorAll('.td-blink'),...(throatRoot?[throatRoot]:[])];
    const saved=nodes.map(el=>[el,[...el.attributes].map(a=>[a.name,a.value])]);
    return {p,looks,mouth,brows,saved,throatRoot,throatTop:pouch?Number(pouch.getAttribute('cy'))-Number(pouch.getAttribute('ry')):null};
  }
  function restore(a){for(const [el,attrs] of a.saved){for(const attr of [...el.attributes])el.removeAttribute(attr.name);for(const [k,v] of attrs)el.setAttribute(k,v);}}
  const r2=n=>Math.round(n*100)/100;
  /* ── drawn extras, in the art's own coordinates; each sits in a pivot so CSS can move it ── */
  const at=(x,y,cls,inner)=>'<g transform="translate('+r2(x)+' '+r2(y)+')"><g class="'+cls+'">'+inner+'</g></g>';
  const DROP='<path d="M0 -3.4C1.5 -1 2.3 .5 2.3 1.6A2.3 2.3 0 0 1 -2.3 1.6C-2.3 .5 -1.5 -1 0 -3.4Z" fill="#dff1f7" stroke="#5f93a6" stroke-width=".5"/><ellipse cx="-.8" cy="1.1" rx=".5" ry=".8" fill="#fff"/>';
  const STAR=r=>'<path d="M0 '+-r+'Q'+r2(r*.18)+' '+r2(-r*.18)+' '+r+' 0Q'+r2(r*.18)+' '+r2(r*.18)+' 0 '+r+'Q'+r2(-r*.18)+' '+r2(r*.18)+' '+-r+' 0Q'+r2(-r*.18)+' '+r2(-r*.18)+' 0 '+-r+'Z" fill="#fff3c2" stroke="#b98f35" stroke-width=".35"/>';
  const ZED=s=>'<path d="M0 0h'+s+'l'+-s+' '+s+'h'+s+'" fill="none" stroke="#24524f" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 0h'+s+'l'+-s+' '+s+'h'+s+'" fill="none" stroke="#f6f1e2" stroke-width=".9" stroke-linecap="round" stroke-linejoin="round"/>';
  const ASK='<path d="M-2 -3.7Q-1.9 -6 .2 -6Q2.3 -6 2.3 -4.1Q2.3 -2.7 .8 -2.1Q0 -1.8 0 -.5" fill="none" stroke="#24524f" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M-2 -3.7Q-1.9 -6 .2 -6Q2.3 -6 2.3 -4.1Q2.3 -2.7 .8 -2.1Q0 -1.8 0 -.5" fill="none" stroke="#f6f1e2" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><circle cy="1.7" r="1.15" fill="#24524f"/><circle cy="1.7" r=".7" fill="#f6f1e2"/>';
  function extras(f,P,mouthW){
    const [ex,ey,er,top]=P.fx.eye,[bx,by,brx,bry]=P.fx.blush,side=P.fx.side||1,out=[];
    for(const fx of f.fx||[]){
      if(fx==='blush')out.push('<g class="tx-blush">'+[-1,1].map(s=>'<ellipse cx="'+s*bx+'" cy="'+by+'" rx="'+brx+'" ry="'+bry+'" fill="#ef8f9c" opacity=".42"/><path d="M'+r2(s*bx-brx*.45)+' '+r2(by-bry*.5)+'l-.8 '+r2(bry*1.1)+'M'+r2(s*bx)+' '+r2(by-bry*.6)+'l-.8 '+r2(bry*1.1)+'M'+r2(s*bx+brx*.45)+' '+r2(by-bry*.5)+'l-.8 '+r2(bry*1.1)+'" fill="none" stroke="#c4566f" stroke-width=".45" stroke-linecap="round" opacity=".5"/>').join('')+'</g>');
      else if(fx==='sweat')out.push(at(side*(ex+er+3.2),top+5.5,'tx-sweat',DROP));
      else if(fx==='tear')out.push(at(ex+er*.62,ey+er*.7,'tx-tear','<g transform="scale(.6)">'+DROP+'</g>'));
      else if(fx==='glisten')out.push('<g class="tx-glisten">'+[-1,1].map(s=>'<ellipse cx="'+r2(s*ex-s*er*.12)+'" cy="'+r2(ey+er*.45)+'" rx="'+r2(er*.36)+'" ry=".5" fill="#fff" opacity=".8"/>').join('')+'</g>');
      else if(fx==='zzz')out.push([[0,0,3],[3.4,-6,3.9],[6.8,-12.8,4.8]].map(([dx,dy,s],i)=>at(side*(ex+er+1+dx)-(side<0?s:0),top-1+dy,'tx-z z'+(i+1)+(side<0?' left':''),ZED(s))).join(''));
      else if(fx==='sparkle')out.push((side<0?at(ex*.5,top-6,'tx-spark s1',STAR(2.2)):at(-(ex+er+2.5),top+1,'tx-spark s1',STAR(2.2)))+at(side*(ex+er+3.5),top-3,'tx-spark s2',STAR(3))+at(side*ex*.3,top-7.5,'tx-spark s3',STAR(1.8)));
      else if(fx==='ask')out.push(at(side*(ex+er+3),top-5,'tx-ask',ASK));
      else if(fx==='huff')out.push(at(Math.min(mouthW,P.w*.5)+3,P.y-1.5,'tx-huff','<g fill="#f6f3ea" stroke="#8fa7a2" stroke-width=".35" opacity=".92"><circle r="1.4"/><circle cx="2.4" cy="-1.5" r="1.9"/><circle cx="4.6" cy="-.2" r="1.5"/></g>'));
    }
    return out.join('');
  }
  function apply(svg,name,expression='neutral'){
    if(!svg)return false;
    let a=original.get(svg);if(!a){a=anchors(svg,name);if(!a)return false;original.set(svg,a);}
    // The same face held into the next line stays as it is: no re-fading blush, no repeated nod.
    else if(svg.dataset.expression===expression)return expression==='neutral'||!!catalog[name]?.[expression];
    restore(a);svg.classList.remove('tx-face','tx-awake');svg.dataset.expression='neutral';
    svg.querySelectorAll('.tx-fx-el').forEach(el=>el.remove());
    [...svg.classList].filter(c=>c.startsWith('tx-pose-')).forEach(c=>svg.classList.remove(c));
    const f=catalog[name]?.[expression];if(!f)return expression==='neutral';
    svg.classList.add('tx-face');if(name==='hotaru'&&expression!=='drowsy'&&!f.sleepy)svg.classList.add('tx-awake');
    svg.dataset.expression=expression;
    a.looks.forEach((el,i)=>{
      const blink=el.querySelector('.td-blink');
      const base=Number(blink.style.getPropertyValue('--bk'))||1.92;
      const lid=f.lids[i]==='closed'?base:f.lids[i];
      el.style.setProperty('transform','scaleY('+lid+')','important');
      blink.style.setProperty('--tx-blink',Math.max(1,base/lid));
    });
    svg.querySelectorAll('.td-gaze').forEach(el=>el.style.setProperty('transform','translate('+f.gaze[0]+'px,'+f.gaze[1]+'px)','important'));
    const {y}=a.p,w=a.p.w*(f.mw||1),lc=f.corners?.[0]||0,rc=f.corners?.[1]||0,ink=a.mouth[1].getAttribute('stroke');
    let d=f.round?'M-3 '+(y-1)+' A3 3.8 0 1 0 3 '+(y-1)+' A3 3.8 0 1 0 -3 '+(y-1):
      'M-'+w+' '+(y+lc)+' C-'+(w*.66)+' '+(y+f.depth)+' -'+(w*.32)+' '+(y+f.depth)+' 0 '+(y+f.depth)+' C'+(w*.32)+' '+(y+f.depth)+' '+(w*.66)+' '+(y+f.depth)+' '+w+' '+(y+rc);
    let bottom=y+(f.round?6.6:f.depth);
    if(f.mouth==='wavy'){
      // a wobbly line, shorter than the usual mouth
      const s=w*.55,Y=y+f.depth;d='M'+r2(-s)+' '+Y+' Q'+r2(-s*.75)+' '+r2(Y-1.3)+' '+r2(-s*.5)+' '+Y+' T0 '+Y+' T'+r2(s*.5)+' '+Y+' T'+r2(s)+' '+Y;
    }
    a.mouth[0].setAttribute('d',d);a.mouth[1].setAttribute('d',d);
    if(f.mouth==='yawn'){
      // a tall, open oval with a little tongue
      const rx=Math.max(2.6,a.p.w*.17),ry=r2(rx*1.35),cy=y+1.2;
      const o='M'+r2(-rx)+' '+cy+' A'+r2(rx)+' '+ry+' 0 1 0 '+r2(rx)+' '+cy+' A'+r2(rx)+' '+ry+' 0 1 0 '+r2(-rx)+' '+cy;
      a.mouth[1].setAttribute('d',o);a.mouth[1].setAttribute('fill',ink);a.mouth[1].setAttribute('fill-opacity','.88');
      a.mouth[0].setAttribute('opacity','0');a.mouth[2].setAttribute('opacity','0');
      a.mouth[1].insertAdjacentHTML('afterend','<ellipse class="tx-fx-el" cy="'+r2(cy+ry*.55)+'" rx="'+r2(rx*.55)+'" ry="'+r2(ry*.28)+'" fill="#d88a8c" opacity=".9"/>');
      bottom=cy+ry;
    }else if(f.mouth==='open'){
      // the smile opens in the middle: a dark mouth with a little tongue
      // It is painted just above the throat pouch, so the pouch stays put under the chin.
      const s=w*.4,Y=y+f.depth*.97,h=3.5+f.depth*1.05;
      (a.throatRoot||a.mouth[1]).insertAdjacentHTML('afterend','<path class="tx-fx-el" d="M'+r2(-s)+' '+r2(Y)+' Q0 '+r2(y+f.depth+.3)+' '+r2(s)+' '+r2(Y)+' Q0 '+r2(Y+h)+' '+r2(-s)+' '+r2(Y)+'Z" fill="'+ink+'" fill-opacity=".9" stroke="'+ink+'" stroke-width=".6" stroke-linejoin="round"/>'+
        '<ellipse class="tx-fx-el" cy="'+r2(Y+h*.38)+'" rx="'+r2(s*.4)+'" ry="'+r2(h*.12)+'" fill="#d88a8c" opacity=".9"/>');
    }
    if(f.round||f.mouth==='yawn'){a.mouth[0].setAttribute('opacity','0');a.mouth[2].setAttribute('opacity','0');}
    else if(f.mouth==='wavy'||f.mw)a.mouth[2].setAttribute('opacity','0');
    else if(lc||rc||f.depth<0)a.mouth[2].setAttribute('opacity','.15');
    // The pouch is painted after the mouth in the source art. Give a smile room
    // instead of allowing the original pouch to paint over its middle.
    if(a.throatRoot&&a.throatTop!==null){
      const shift=Math.max(0,bottom+1-a.throatTop);
      let t=a.throatRoot.getAttribute('transform');
      if(shift)t+=' translate(0 '+shift+')';
      if(f.puff)t+=' scale('+f.puff[0]+' '+f.puff[1]+')';
      if(t!==a.throatRoot.getAttribute('transform'))a.throatRoot.setAttribute('transform',t);
    }
    if(f.brow)a.brows.forEach(el=>el.setAttribute('transform','translate(0 '+((f.brow[0]+f.brow[1])/2)+')'));
    if(f.fx?.includes('shine'))svg.querySelectorAll('.td-gaze').forEach(el=>el.insertAdjacentHTML('beforeend','<circle class="tx-fx-el" cx="2.2" cy="-1.3" r="1" fill="#fff"/><circle class="tx-fx-el" cx="-1.7" cy=".9" r=".6" fill="#fff" opacity=".9"/>'));
    const layer=extras(f,a.p,w);
    if(layer)(svg.querySelector('.td-breathe')||svg).insertAdjacentHTML('beforeend','<g class="tx-fx tx-fx-el">'+layer+'</g>');
    if(f.pose)svg.classList.add('tx-pose-'+f.pose);
    injectCSS();return true;
  }
  function svg(name,options={}){
    const holder=document.createElement('div');holder.innerHTML=window.ToadArt.svg(name,options);
    if(!holder.firstElementChild)return '';
    apply(holder.firstElementChild,name,options.expression||'neutral');return holder.innerHTML;
  }
  function injectCSS(){
    if(document.getElementById('toad-expressions-css'))return;
    const style=document.createElement('style');style.id='toad-expressions-css';style.textContent=`
      .tx-face .td-look{transition:none}
      .td-mv .tx-face .td-look{transition:transform .24s ease}
      .pe-owned:not(.td-mv) .td-look,.ml-expressions:not(.td-mv) .td-look{transition:none}
      .tx-face .td-gaze{animation:none!important}
      .td-mv .tx-face .td-blink{animation-name:tx-blink!important}
      .tx-face.tx-awake .td-nod{animation:none!important}
      @keyframes tx-blink{0%,91%,96%,100%{transform:scaleY(1)}93%,94%{transform:scaleY(var(--tx-blink,1.92))}}
      /* the whole body: held poses ease in and out; the moving ones play with motion on */
      .td-mv .td-art[data-expression] .td-body{transition:transform .5s cubic-bezier(.3,1.25,.5,1)}
      .tx-fx *{transform-box:view-box;transform-origin:0 0}
      .tx-pose-perk .td-body{transform:translateY(-1.2px) scale(.98,1.035)}
      .tx-pose-slump .td-body{transform:translateY(.6px) scale(1.02,.955)}
      .tx-pose-tilt .td-body{transform:rotate(-3deg)}
      .tx-pose-tiltr .td-body{transform:rotate(3deg)}
      .td-mv .tx-pose-laugh .td-body{animation:tx-laugh .36s ease-in-out 5}
      .td-mv .tx-pose-chuckle .td-body{animation:tx-chuckle .32s ease-in-out 3}
      .td-mv .tx-pose-nod .td-body{animation:tx-nod 1s ease-in-out}
      .td-mv .tx-pose-bow .td-body{animation:tx-bow 1.9s ease-in-out}
      .td-mv .tx-pose-hop .td-body{animation:tx-hop .75s cubic-bezier(.3,.7,.4,1)}
      .td-mv .tx-pose-shiver .td-body{animation:tx-shiver .55s linear}
      .td-mv .tx-pose-sway .td-body{animation:tx-sway 4s ease-in-out infinite}
      .td-mv .tx-pose-snore .td-body{animation:tx-snore 3.4s ease-in-out infinite}
      .td-mv .tx-pose-stretch .td-body{animation:tx-stretch 1.9s ease-in-out}
      @keyframes tx-laugh{0%,100%{transform:none}45%{transform:translateY(-1.7px) scale(.99,1.02)}75%{transform:translateY(.2px) scale(1.012,.985)}}
      @keyframes tx-chuckle{0%,100%{transform:none}50%{transform:translateY(-.8px)}}
      @keyframes tx-nod{0%,100%{transform:none}30%{transform:translateY(1.2px) scale(1.015,.96)}55%{transform:translateY(-.3px) scale(.995,1.01)}75%{transform:translateY(.6px) scale(1.008,.98)}}
      @keyframes tx-bow{0%,100%{transform:none}25%,60%{transform:translateY(2px) scale(1.03,.9)}82%{transform:translateY(-.4px) scale(.99,1.015)}}
      @keyframes tx-hop{0%,100%{transform:none}15%{transform:scale(1.06,.9)}42%{transform:translateY(-6px) scale(.96,1.06)}66%{transform:translateY(0) scale(1.05,.92)}82%{transform:scale(.99,1.02)}}
      @keyframes tx-shiver{0%,100%{transform:none}15%,45%,75%{transform:translateX(-.9px)}30%,60%,90%{transform:translateX(.9px)}}
      @keyframes tx-sway{0%,100%{transform:rotate(0)}25%{transform:rotate(-2.2deg)}75%{transform:rotate(2.2deg)}}
      @keyframes tx-snore{0%,100%{transform:none}50%{transform:translateY(.5px) scale(1.025,.965)}}
      @keyframes tx-stretch{0%,100%{transform:none}35%,62%{transform:translateY(-1.6px) scale(.97,1.07)}}
      /* drawn extras: visible as they are with motion off; alive with it on */
      .td-mv .tx-blush,.td-mv .tx-glisten{animation:tx-fade .6s ease both}
      .td-mv .tx-sweat{animation:tx-sweat 2.4s ease-in-out infinite}
      .td-mv .tx-tear{animation:tx-tear 3.2s ease-in-out infinite}
      .td-mv .tx-z{animation:tx-z 3s ease-in-out infinite}.td-mv .tx-z.left{animation-name:tx-zl}.td-mv .tx-z.z2{animation-delay:-1s}.td-mv .tx-z.z3{animation-delay:-2s}
      .td-mv .tx-spark{animation:tx-spark 1.8s ease-in-out infinite}.td-mv .tx-spark.s2{animation-delay:-.6s}.td-mv .tx-spark.s3{animation-delay:-1.2s}
      .td-mv .tx-ask{animation:tx-ask 2s ease-in-out infinite}
      .td-mv .tx-huff{animation:tx-huff 2.6s ease-out infinite}
      @keyframes tx-fade{from{opacity:0}to{opacity:1}}
      @keyframes tx-sweat{0%{transform:translateY(-1.5px);opacity:0}18%{transform:translateY(0);opacity:1}75%{transform:translateY(1.6px);opacity:1}100%{transform:translateY(2.4px);opacity:0}}
      @keyframes tx-tear{0%,100%{transform:translateY(0)}50%{transform:translateY(.8px)}}
      @keyframes tx-z{0%{transform:translate(-2px,3px) scale(.6);opacity:0}25%{opacity:1}100%{transform:translate(2px,-4px) scale(1.1);opacity:0}}
      @keyframes tx-zl{0%{transform:translate(2px,3px) scale(.6);opacity:0}25%{opacity:1}100%{transform:translate(-2px,-4px) scale(1.1);opacity:0}}
      @keyframes tx-spark{0%,100%{transform:scale(.4) rotate(0);opacity:.3}50%{transform:scale(1.1) rotate(45deg);opacity:1}}
      @keyframes tx-ask{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-1.5px) rotate(6deg)}}
      @keyframes tx-huff{0%{transform:translate(0,0) scale(.4);opacity:0}20%{opacity:.95}100%{transform:translate(4px,-3px) scale(1.25);opacity:0}}
      @media(prefers-reduced-motion:reduce){.tx-face .td-look,.td-art[data-expression] .td-body{transition:none}.tx-face *{animation:none!important}}
    `;document.head.appendChild(style);
  }
  window.ToadExpressions={catalog,profiles,apply,svg,injectCSS};
})();
