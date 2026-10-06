/* A shared pond-to-scene entrance. Native animations, no canvas capture or saves.
   The traveling stage uses the actual scene geometry and lands on its exact box. */
(function(){
  'use strict';
  let sequence=0;
  const ease='cubic-bezier(.22,.8,.18,1)';
  function capture(source){
    const node=source;
    const r=node?.isConnected?node.getBoundingClientRect():null;
    return {x:Math.max(18,Math.min(innerWidth-18,r?.width?r.left+r.width/2:innerWidth/2)),
      y:Math.max(18,Math.min(innerHeight-18,r?.height?r.top+r.height/2:innerHeight*.65))};
  }
  function freshCopy(stage){
    const copy=stage.cloneNode(true),prefix='pe-flight-'+(++sequence)+'-',ids=new Map();
    copy.querySelectorAll('[id]').forEach(el=>{const old=el.id;ids.set(old,prefix+old);el.id=prefix+old;});
    for(const el of [copy,...copy.querySelectorAll('*')])for(const attr of [...el.attributes]){
      let value=attr.value;
      value=value.replace(/url\(#([^)]*)\)/g,(all,id)=>ids.has(id)?'url(#'+ids.get(id)+')':all);
      if(value.startsWith('#')&&ids.has(value.slice(1)))value='#'+ids.get(value.slice(1));
      if(value!==attr.value)el.setAttribute(attr.name,value);
    }
    return copy;
  }
  function paper(dialog){
    const p=document.createElement('div');p.className='pe-journey-paper';p.setAttribute('aria-hidden','true');dialog.appendChild(p);return p;
  }
  function traveler(dialog,origin){
    const stage=dialog.querySelector(':scope > .pe-stage'),r=stage.getBoundingClientRect();
    const layer=document.createElement('div');layer.className='pe-journey pe-owned';
    const world=document.createElement('div');world.className='pe-journey-world';world.setAttribute('aria-hidden','true');
    world.style.setProperty('--pe-origin-x',origin.x+'px');world.style.setProperty('--pe-origin-y',origin.y+'px');
    const plane=document.createElement('div');plane.className='pe-journey-plane';
    const copy=freshCopy(stage);copy.style.width=r.width+'px';copy.style.height=r.height+'px';
    copy.style.margin='0';copy.style.boxSizing='border-box';plane.appendChild(copy);world.appendChild(plane);
    const shade=document.createElement('div');shade.className='pe-journey-shade';shade.setAttribute('aria-hidden','true');world.appendChild(shade);
    layer.appendChild(world);dialog.appendChild(layer);
    return {layer,world,plane,shade,r};
  }
  function pulse(layer,origin,animate,direction='out'){
    for(let i=0;i<2;i++){
      const ring=document.createElement('i');ring.className='pe-journey-ring';ring.setAttribute('aria-hidden','true');
      ring.style.left=origin.x+'px';ring.style.top=origin.y+'px';layer.appendChild(ring);
      animate(ring,direction==='out'?[{opacity:.8,transform:'translate(-50%,-50%) scale(.7)'},{opacity:0,transform:'translate(-50%,-50%) scale(8)'}]:
        [{opacity:0,transform:'translate(-50%,-50%) scale(3.5)'},{opacity:.5,offset:.5},{opacity:0,transform:'translate(-50%,-50%) scale(.7)'}],
        {duration:direction==='out'?700:340,delay:i*90,easing:ease,fill:'both'});
    }
  }
  function enter({dialog,origin,motion,onReady}){
    if(!motion||!dialog.animate){dialog.dataset.arrival='ready';onReady();return {finish(){},cancel(){}};}
    let settled=false,layer,p,animations=[],children=[];
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const animate=(el,frames,options)=>{const a=el.animate(frames,options);animations.push(a);return a;};
    const settle=notify=>{
      if(settled)return;settled=true;
      removeEventListener('resize',finish);document.removeEventListener('visibilitychange',finish);
      reduced.removeEventListener('change',finish);
      animations.forEach(a=>a.cancel());layer?.remove();p?.remove();
      children.forEach(([node,inert])=>{node.inert=inert;});dialog.classList.remove('pe-entering');dialog.dataset.arrival='ready';
      if(notify&&dialog.isConnected)onReady();
    };
    const finish=()=>settle(true),cancel=()=>settle(false);
    try{
      children=[...dialog.children,...dialog.querySelectorAll('.pe-top button')].map(node=>[node,node.inert]);
      children.forEach(([node])=>{if(!node.classList.contains('pe-announcement')&&!node.classList.contains('pe-top'))node.inert=true;});
      dialog.classList.add('pe-entering');dialog.dataset.arrival='entering';
      // Move one continuous world inside the final scenic frame. The cast is
      // already standing on the pond; it is revealed by the camera, not a fade.
      p=paper(dialog);
      const stage=dialog.querySelector(':scope > .pe-stage'),world=stage.querySelector('.pe-camera-world');
      layer=document.createElement('div');layer.className='pe-journey pe-pan-controls';dialog.appendChild(layer);
      dialog.dataset.arrival='sky';
      animate(p,[{opacity:0},{opacity:1}],{duration:600,easing:'ease-in-out',fill:'both'});
      const opening=animate(stage,[{opacity:0},{opacity:1}],{duration:600,easing:'ease-in-out',fill:'both'});
      opening.finished.then(()=>{if(!settled)dialog.dataset.arrival='panning';},()=>{});
      // Measure the actual scene rather than repeating CSS percentages.
      // The sky and pond travel together; mist clears as the camera settles.
      const descent=parseFloat(getComputedStyle(world).height)-parseFloat(getComputedStyle(world.querySelector('.pe-pond-set')).height);
      const at=fraction=>'translateY('+(-descent*fraction)+'px)';
      // Match the velocity on each side of the steady middle (88% of the
      // distance over 76% of the time); no sudden gear change at the horizon.
      const camera=animate(world,[
        {transform:at(0),offset:0,easing:'cubic-bezier(.42,0,.75,.421052632)'},
        {transform:at(.06),offset:.12,easing:'linear'},
        {transform:at(.94),offset:.88,easing:'cubic-bezier(.25,.578947368,.58,1)'},
        {transform:at(1),offset:1}
      ],{duration:5200,delay:600,easing:'linear',fill:'both'});
      animate(world.querySelector('.pe-sky'),[{opacity:1},{opacity:0}],{duration:700,delay:5100,easing:'ease-in-out',fill:'both'});
      for(const [selector,delay,y] of [['.pe-top',5050,-6],['.pe-bubble',5400,12],['.pe-action',5530,5],['.pe-controls',5570,5],['.pe-footer',5600,3]]){
        const node=dialog.querySelector(':scope > '+selector);
        animate(node,[{opacity:0,transform:'translateY('+y+'px)'},{opacity:1,transform:'none'}],{duration:5800-delay,delay,easing:ease,fill:'both'});
      }
      const skip=document.createElement('button');skip.type='button';skip.className='pe-journey-skip';skip.textContent='Skip entrance';
      skip.addEventListener('click',finish);layer.appendChild(skip);skip.focus({preventScroll:true});
      camera.finished.then(finish,()=>{});
      addEventListener('resize',finish,{once:true});document.addEventListener('visibilitychange',finish,{once:true});
      reduced.addEventListener('change',finish,{once:true});
    }catch(error){console.warn('Pond entrance:',error);finish();}
    return {finish,cancel};
  }
  function leave({dialog,origin,motion}){
    if(!motion||!dialog.animate)return Promise.resolve();
    return new Promise(resolve=>{
      let settled=false,layer,p,animations=[];
      const reduced=matchMedia('(prefers-reduced-motion: reduce)');
      const animate=(el,frames,options)=>{const a=el.animate(frames,options);animations.push(a);return a;};
      const finish=()=>{
        if(settled)return;settled=true;removeEventListener('resize',finish);document.removeEventListener('visibilitychange',finish);
        reduced.removeEventListener('change',finish);
        animations.forEach(a=>a.cancel());layer?.remove();p?.remove();dialog.classList.remove('pe-leaving');resolve();
      };
      try{
        dialog.dataset.arrival='leaving';p=paper(dialog);const travel=traveler(dialog,origin);({layer}=travel);
        const {plane,world,r}=travel;world.style.setProperty('--pe-aperture',Math.hypot(innerWidth,innerHeight)+'px');
        plane.style.transform='translate('+r.left+'px,'+r.top+'px)';
        dialog.classList.add('pe-leaving');
        animate(p,[{opacity:1},{opacity:0}],{duration:340,easing:'ease-in',fill:'both'});
        pulse(layer,origin,animate,'in');
        const dx=(origin.x-r.left-r.width/2)*.14,dy=(origin.y-r.top-r.height/2)*.14;
        const departure=animate(plane,[{opacity:1,transform:'translate('+r.left+'px,'+r.top+'px) scale(1)'},
          {opacity:0,transform:'translate('+(r.left+dx)+'px,'+(r.top+dy)+'px) scale(.94)'}],{duration:340,easing:'cubic-bezier(.4,0,.6,1)',fill:'both'});
        departure.finished.then(finish,finish);addEventListener('resize',finish,{once:true});document.addEventListener('visibilitychange',finish,{once:true});
        reduced.addEventListener('change',finish,{once:true});
      }catch(error){console.warn('Pond return:',error);finish();}
    });
  }
  window.PondSceneTransition={capture,enter,leave};
})();
