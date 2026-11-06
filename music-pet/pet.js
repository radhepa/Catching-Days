/* pet.js · Sara on the desktop: tap for the player, drag to move, drop music on her */
'use strict';
const el=document.getElementById('sara');
SaraArt.injectCSS();
document.getElementById('art').innerHTML=SaraArt.svg();

/* tap or drag: a press that travels more than a few pixels is a drag */
let press=null;
el.addEventListener('pointerdown',e=>{
  if(e.button!==0) return;
  press={x:e.screenX,y:e.screenY,dragging:false};
  el.setPointerCapture(e.pointerId);
});
el.addEventListener('pointermove',e=>{
  if(!press||press.dragging) return;
  if(Math.hypot(e.screenX-press.x,e.screenY-press.y)>4){
    press.dragging=true; el.classList.add('held');
    sara.send('drag-start',{x:press.x,y:press.y});
  }
});
const release=tap=>{
  if(!press) return;
  if(press.dragging) sara.send('drag-end'); else if(tap) sara.send('tap');
  press=null; el.classList.remove('held');
};
el.addEventListener('pointerup',()=>release(true));
el.addEventListener('lostpointercapture',()=>release(false));
el.addEventListener('contextmenu',e=>{ e.preventDefault(); sara.send('pet-menu'); });

/* music dropped on her joins the library */
let overN=0;
window.addEventListener('dragenter',e=>{ e.preventDefault(); overN++; el.classList.add('over'); });
window.addEventListener('dragleave',()=>{ if(--overN<=0){ overN=0; el.classList.remove('over'); } });
window.addEventListener('dragover',e=>{ e.preventDefault(); e.dataTransfer.dropEffect='copy'; });
window.addEventListener('drop',e=>{
  e.preventDefault(); overN=0; el.classList.remove('over');
  const paths=sara.paths(e.dataTransfer.files);
  if(!paths.length) return;
  sara.send('drop-paths',paths);
  el.classList.remove('cheer'); void el.offsetWidth; el.classList.add('cheer');
});

sara.on('state',s=>{
  document.body.classList.toggle('playing',!!s.playing);
  el.title=s.title?(s.playing?'Sara · playing ':'Sara · paused on ')+s.title:'Sara · drop music on me';
});
