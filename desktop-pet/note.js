/* note.js · one sticky note on the desktop
   The note is the app's own (Journal · Sticky notes). What you write is sent
   as an op a moment after you stop typing, and when you click away: the
   first time as a new note, after that as an edit. A blank new note is only
   a window until you write something, and closing it then leaves nothing. */
'use strict';
(async function(){
const $=id=>document.getElementById(id);
const COLORS=[['lilac','Lilac','#ddd0f2'],['mint','Mint','#cfeedb'],['sky','Sky','#d0e5f5'],['butter','Butter','#f7e9b5'],['peach','Peach','#f8d6c3'],['blush','Rose','#f4ccd8']];
const hexOf=k=>(COLORS.find(c=>c[0]===k)||COLORS[1])[2];
const init=await window.pet.init();
const N=init.note||{};
const id=N.id;
let created=!N.draft, color=N.color||'mint', top=!!N.top, sent=N.data?N.data.text:'', at=N.data?N.data.created:0;
let dirty=false, saveT=null, busy=null;
const ta=$('tx');
ta.value=sent;

function paint(){
  document.documentElement.style.setProperty('--c',hexOf(color));
  document.body.classList.toggle('draft',!created);
  $('b-top').setAttribute('aria-pressed',String(top));
  $('b-top').title=top?'Stop keeping it on top':'Keep on top';
  $('sw').innerHTML=COLORS.map(([k,l,h])=>`<button class="${k===color?'on':''}" data-c="${k}" title="${l}" aria-label="${l}" style="background:${h}"></button>`).join('');
  $('ft').textContent=!created?'New note · kept once you write something':
    dirty?'Writing…':'In Sticky notes'+(at?' · '+new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric'}).format(at):'');
}

/* send what's written: a new note the first time, an edit after that */
async function flush(){
  clearTimeout(saveT);
  if(busy) await busy;
  const v=ta.value.trim();
  if(!v||(created&&v===sent)){ if(created&&v===sent){ dirty=false; paint(); } return; }
  busy=window.pet.op(created?{k:'note',act:'edit',nid:id,text:v}:{k:'note',act:'add',nid:id,text:v,color}).catch(()=>null);
  const r=await busy; busy=null;
  if(r&&r.why==='reload'){ $('ft').textContent='Reload the Catching Days tab once to keep this'; return; }
  if(r&&r.ok){
    if(!created){ created=true; at=Date.now(); }
    sent=v;
    if(ta.value.trim()===v) dirty=false;
  }
  paint();
}
ta.addEventListener('input',()=>{ dirty=true; paint(); clearTimeout(saveT); saveT=setTimeout(flush,900); });
ta.addEventListener('blur',()=>flush());
window.addEventListener('blur',()=>flush());

$('b-col').addEventListener('click',()=>$('sw').classList.toggle('hide'));
$('sw').addEventListener('click',async e=>{
  const b=e.target.closest('[data-c]'); if(!b) return;
  color=b.dataset.c; paint();
  if(created) await window.pet.op({k:'note',act:'edit',nid:id,color});
});
$('b-new').addEventListener('click',()=>window.pet.send('note-new',color));
$('b-top').addEventListener('click',()=>{ top=!top; paint(); window.pet.send('note-top',top); });
$('b-set').addEventListener('click',async()=>{
  await flush(); if(dirty&&ta.value.trim()) return;
  if(created) await window.pet.op({k:'note',act:'archive',nid:id});   // the window goes with it
  else window.pet.send('note-close');
});
/* what you wrote and couldn't keep yet (see flush) stays on screen rather than closing with the note */
$('b-x').addEventListener('click',async()=>{ await flush(); if(dirty&&ta.value.trim()) return; window.pet.send('note-close'); });
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='n'){ e.preventDefault(); window.pet.send('note-new',color); }
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){ e.preventDefault(); flush(); }
});

/* the app changed it (or the toad's own op came back): take it in, unless you're writing */
window.pet.on('note',d=>{
  if(!d) return;
  top=!!d.top;
  const n=d.note;
  if(n){
    created=true; at=n.created||at;
    if(n.color&&n.color!==color) color=n.color;
    if(!dirty&&document.activeElement!==ta&&n.text!==ta.value.trim()){ ta.value=n.text; sent=n.text; }
    else if(!dirty) sent=n.text;
  }
  paint();
});

paint();
if(!created) ta.focus();
})();
