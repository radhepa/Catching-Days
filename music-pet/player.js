/* player.js · Sara's player and the music engine itself.
   Songs from files play in an <audio> here; a YouTube song plays in a small view
   main.js lays over the record box (#slot). Both report into the same state. */
'use strict';
const $=id=>document.getElementById(id);
const audio=new Audio();
let L={tracks:[],playlists:[],gone:[]};          // gone: songs taken out, so Sara's folder doesn't bring them back
let view='all', vol=.8, shuffle=false, repeat='all', tab='lib';
let cur=null;                                    // {id, queue:[ids], from: the list it was started from}
let playing=false, pos=0, dur=0, seeking=false, ytLoadAt=0, ytDone=false, errRun=0;
let results=[];                                  // the last YouTube search, as songs not (yet) in the library
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const keyOf=t=>t.kind==='yt'?'yt:'+t.yt:'f:'+String(t.path).toLowerCase();
const byId=id=>L.tracks.find(t=>t.id===id)||results.find(t=>t.id===id)||null;
const plOf=id=>L.playlists.find(p=>p.id===id)||null;
const idsOf=v=>v==='all'?L.tracks.map(t=>t.id):((plOf(v)||{ids:[]}).ids.filter(id=>L.tracks.some(t=>t.id===id)));
const fmt=s=>{ s=Math.max(0,Math.floor(s||0)); const h=Math.floor(s/3600), m=Math.floor(s/60)%60, x=String(s%60).padStart(2,'0'); return h?`${h}:${String(m).padStart(2,'0')}:${x}`:`${m}:${x}`; };

let saveT=null;
function save(){ clearTimeout(saveT); saveT=setTimeout(()=>sara.send('save',{library:L,volume:vol,shuffle,repeat,view}),300); }

/* ── adding songs: named after their files (or their YouTube titles), never twice ── */
function add(tracks,{play=false,toView=false,quiet=false}={}){
  const have=new Map(L.tracks.map(t=>[keyOf(t),t]));
  const gone=new Set(L.gone);
  const ids=[];
  (tracks||[]).forEach(n=>{
    const k=keyOf(n);
    if(quiet&&gone.has(k)) return;                 // the folder scan respects a removal; a drop brings it back
    gone.delete(k);
    let t=have.get(k);
    if(!t){ t=Object.assign({},n,{id:uid()}); L.tracks.push(t); have.set(k,t); }
    else if(t.bad&&!quiet){ delete t.bad; }
    ids.push(t.id);
  });
  L.gone=[...gone];
  const pl=toView&&plOf(view);
  if(pl) ids.forEach(id=>{ if(!pl.ids.includes(id)) pl.ids.push(id); });
  if(!ids.length) return;
  save(); render();
  if(play) playId(ids[0],idsOf(pl?view:'all'),pl?view:'all');
}

/* ── playing ── */
function playId(id,queue,from){
  const t=byId(id); if(!t) return;
  cur={id,queue:queue&&queue.includes(id)?queue:[id],from:from===undefined?cur&&cur.from:from};   // next/prev keep the list
  pos=0; dur=0;
  if(t.kind==='yt'){
    audio.pause(); audio.removeAttribute('src'); audio.load();
    ytLoadAt=Date.now(); ytDone=false; playing=true;
    sara.send('yt',{cmd:'load',id:t.yt,vol});
  } else {
    sara.send('yt',{cmd:'stop'});
    audio.src=t.url; audio.volume=vol;
    audio.play().catch(()=>{});                    // a bad file reports through 'error'
  }
  drawNow(); render();
}
function toggle(){
  if(!cur){ const q=idsOf(view).filter(id=>!byId(id).bad); if(q.length) playId(shuffle?q[Math.floor(Math.random()*q.length)]:q[0],q,view); return; }
  const t=byId(cur.id);
  if(!t) return;
  if(t.kind==='yt'){ playing=!playing; sara.send('yt',{cmd:playing?'play':'pause'}); drawNow(); }
  else if(audio.paused) audio.play().catch(()=>{}); else audio.pause();
}
/* the next song in the queue the current one came from */
function step(dir,auto){
  if(!cur) return toggle();
  const q=cur.queue, i=q.indexOf(cur.id);
  const j=nextIndex(q.length,i,{shuffle,repeat,auto},dir);
  if(j<0){ stop(); return; }
  if(j===i&&auto){ seekTo(0); resume(); return; }
  playId(q[j],q);
}
function prev(){ if(pos>3) seekTo(0); else step(-1,false); }
function stop(){
  audio.pause(); sara.send('yt',{cmd:'pause'});
  playing=false; drawNow(); render();
}
function resume(){ const t=cur&&byId(cur.id); if(!t) return; if(t.kind==='yt'){ playing=true; sara.send('yt',{cmd:'play'}); } else audio.play().catch(()=>{}); }
function seekTo(s){
  const t=cur&&byId(cur.id); if(!t) return;
  pos=s;
  if(t.kind==='yt') sara.send('yt',{cmd:'seek',t:s}); else audio.currentTime=s;
}
/* a song that won't play: mark it and move on, but stop if nothing in the queue plays */
function bad(){
  const t=cur&&byId(cur.id); if(!t) return;
  t.bad=true; save();
  if(++errRun>=cur.queue.length){ errRun=0; stop(); return; }
  step(1,false);
}
/* same rule as library.js nextIndex (tested there); the page can't load node modules */
function nextIndex(n,i,{shuffle,repeat,auto},dir=1){
  if(n<=0) return -1;
  if(repeat==='one'&&auto&&i>=0) return i;
  if(shuffle&&n>1){ let j=Math.floor(Math.random()*(n-1)); if(j>=i) j++; return j; }
  const j=i+dir;
  if(j>=n) return repeat==='all'?0:-1;
  if(j<0) return repeat==='all'?n-1:0;
  return j;
}

audio.addEventListener('playing',()=>{ playing=true; errRun=0; drawNow(); render(); });
audio.addEventListener('pause',()=>{ playing=false; drawNow(); render(); });
audio.addEventListener('timeupdate',()=>{ pos=audio.currentTime; dur=audio.duration||0; drawTime(); });
audio.addEventListener('loadedmetadata',()=>{ dur=audio.duration||0; drawTime(); });
audio.addEventListener('ended',()=>step(1,true));
audio.addEventListener('error',()=>{ if(audio.getAttribute('src')) bad(); });

sara.on('yt-state',s=>{
  const t=cur&&byId(cur.id); if(!t||t.kind!=='yt') return;
  if(s.err||(!s.ok&&Date.now()-ytLoadAt>15000)){ bad(); return; }
  if(!s.ok) return;
  pos=s.t; dur=s.d;
  if(!s.paused) errRun=0;
  const was=playing; playing=!s.paused||(Date.now()-ytLoadAt<4000&&!ytDone&&playing);
  if(s.ended&&!s.ad&&!ytDone){ ytDone=true; step(1,true); return; }
  drawTime(); if(was!==playing){ drawNow(); render(); }
});

/* ── drawing ── */
let lastState='';
function drawNow(){
  const t=cur&&byId(cur.id);
  document.body.classList.toggle('playing',playing);
  $('play').setAttribute('aria-label',playing?'Pause':'Play');
  $('np-t').textContent=t?t.title:'Nothing on yet';
  $('np-s').textContent=t?(t.kind==='yt'?'YouTube'+(t.channel?' · '+t.channel:''):t.sub||'On your computer'):'Drop songs on Sara, or find one on YouTube';
  $('slot').classList.toggle('yt',!!t&&t.kind==='yt');
  $('seek').disabled=!t;
  /* a playlist with its own pet sends that pet out while one of its songs plays */
  const from=cur&&plOf(cur.from);
  const st=JSON.stringify({playing,title:t?t.title:'',pet:t&&from&&from.pet||''});
  if(st!==lastState){ lastState=st; sara.send('state',JSON.parse(st)); }
  drawTime();
}
function drawTime(){
  $('t0').textContent=fmt(pos); $('t1').textContent=fmt(dur);
  if(!seeking){ const p=dur?pos/dur:0; $('seek').value=Math.round(p*1000); $('seek').style.setProperty('--p',p); }
}
function drawModes(){
  $('shuffle').setAttribute('aria-pressed',String(shuffle));
  const r=$('repeat'); r.className='ic sm '+repeat;
  const label={all:'Repeat: all',one:'Repeat: this song',off:'Repeat: off'}[repeat];
  r.setAttribute('aria-label',label); r.title=label;
  $('vol').value=Math.round(vol*100); $('vol').style.setProperty('--p',vol);
}
function row(t,opts){
  const isCur=cur&&cur.id===t.id;
  const sub=t.kind==='yt'?'YouTube'+(t.channel?' · '+t.channel:'')+(t.length?' · '+t.length:''):(t.sub||'');
  const mark=isCur?'<span class="mark"><i></i><i></i><i></i></span>':'';
  const btn=opts.result
    ?`<button class="ic${opts.inLib?' added':''}" data-add="${t.id}" aria-label="${opts.inLib?'In your library':'Add to your library'}" title="${opts.inLib?'In your library':'Add to your library'}">${opts.inLib
        ?'<svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg>':'<svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10"/></svg>'}</button>`
    :`<button class="ic" data-more="${t.id}" aria-label="More for ${esc(t.title)}"><svg viewBox="0 0 16 16"><circle class="f" cx="3.5" cy="8" r="1.3"/><circle class="f" cx="8" cy="8" r="1.3"/><circle class="f" cx="12.5" cy="8" r="1.3"/></svg></button>`;
  return `<div class="row${isCur?' cur':''}${t.bad?' bad':''}"><button class="main" data-play="${t.id}">${mark}<span class="tx"><b>${esc(t.title)}</b><span>${esc(t.bad?'Can’t play this one':sub)}</span></span></button>${btn}</div>`;
}
function render(){
  /* playlists */
  const chips=[`<button class="chip${view==='all'?' on':''}" data-view="all">All songs<i>${L.tracks.length}</i></button>`]
    .concat(L.playlists.map(p=>`<button class="chip${view===p.id?' on':''}" data-view="${p.id}">${esc(p.name)}<i>${idsOf(p.id).length}</i></button>`));
  const ch=$('chips');
  if(!ch.querySelector('input')) ch.innerHTML=chips.join('')+'<button class="chip new" id="newpl">+ New playlist</button>';
  /* the songs */
  const ids=idsOf(view);
  $('list').innerHTML=ids.length?ids.map(id=>row(byId(id),{})).join('')
    :view==='all'?`<div class="empty"><b>Sara’s dish is empty</b>Drop songs or a whole folder on her (or right here). Anything you put in Music\\Sara shows up too, named after its file.</div>`
    :`<div class="empty"><b>Nothing in this playlist yet</b>Drop songs here while it’s open, or use ⋯ on a song in All songs.</div>`;
  /* YouTube results */
  const inLib=new Set(L.tracks.filter(t=>t.kind==='yt').map(t=>t.yt));
  if(results.length) $('results').innerHTML=results.map(t=>row(t,{result:true,inLib:inLib.has(t.yt)})).join('');
}

/* ── the player's own controls ── */
$('play').onclick=toggle;
$('next').onclick=()=>step(1,false);
$('prev').onclick=prev;
$('shuffle').onclick=()=>{ shuffle=!shuffle; drawModes(); save(); };
$('repeat').onclick=()=>{ repeat={all:'one',one:'off',off:'all'}[repeat]; drawModes(); save(); };
$('seek').addEventListener('input',e=>{ seeking=true; const p=e.target.value/1000; e.target.style.setProperty('--p',p); $('t0').textContent=fmt(p*dur); });
$('seek').addEventListener('change',e=>{ seeking=false; if(dur) seekTo(e.target.value/1000*dur); });
$('vol').addEventListener('input',e=>{ vol=e.target.value/100; audio.volume=vol; e.target.style.setProperty('--p',vol); sara.send('yt',{cmd:'volume',v:vol}); save(); });
$('close').onclick=()=>sara.send('player-close');
$('add').onclick=()=>sara.send('add-music');
$('folder').onclick=()=>sara.send('open-folder');
function setTab(t){
  tab=t;
  $('tab-lib').setAttribute('aria-selected',String(t==='lib')); $('tab-yt').setAttribute('aria-selected',String(t==='yt'));
  $('pane-lib').hidden=t!=='lib'; $('pane-yt').hidden=t!=='yt';
  if(t==='yt') setTimeout(()=>$('q').focus(),0);
}
$('tab-lib').onclick=()=>setTab('lib');
$('tab-yt').onclick=()=>setTab('yt');

$('chips').addEventListener('click',e=>{
  const b=e.target.closest('[data-view]');
  if(b){ view=b.dataset.view; save(); render(); return; }
  if(e.target.closest('#newpl')){
    const nb=e.target.closest('#newpl');
    nb.innerHTML='<input id="plname" placeholder="Playlist name" maxlength="40" aria-label="New playlist name">';
    const inp=$('plname'); inp.focus();
    const done=ok=>{ const name=inp.value.trim(); inp.remove(); if(ok&&name){ const p={id:uid(),name,ids:[]}; L.playlists.push(p); view=p.id; save(); } render(); };
    inp.addEventListener('keydown',k=>{ if(k.key==='Enter') done(true); if(k.key==='Escape'){ k.stopPropagation(); done(false); } });
    inp.addEventListener('blur',()=>{ if(inp.isConnected) done(true); });
  }
});
$('chips').addEventListener('contextmenu',async e=>{
  const b=e.target.closest('[data-view]'); if(!b||b.dataset.view==='all') return;
  e.preventDefault();
  const p=plOf(b.dataset.view), tick=on=>on?'  ✓':'';
  const pick=await sara.ask('menu',[
    {label:'Pet for this playlist',items:[{id:'pet:',label:'Same as everywhere else'+tick(!p.pet)},{sep:true}]
      .concat(PetKit.list().map(d=>({id:'pet:'+d.id,label:`${d.name} · ${d.kind}`+tick(p.pet===d.id)})))},
    {sep:true},
    {id:'del',label:`Delete “${p.name}” (the songs stay in your library)`}]);
  if(pick==='del'){ L.playlists=L.playlists.filter(x=>x!==p); if(view===p.id) view='all'; save(); render(); drawNow(); }
  else if(pick&&pick.startsWith('pet:')){ const id=pick.slice(4); if(id) p.pet=id; else delete p.pet; save(); drawNow(); }
});

/* a song row: tap to play from this list; ⋯ for playlists and removing */
async function more(id){
  const t=byId(id), pl=plOf(view);
  const others=L.playlists.filter(p=>p!==pl);
  const items=[
    {label:'Add to playlist',items:others.length?others.map(p=>({id:'to:'+p.id,label:p.name+(p.ids.includes(id)?' ✓':''),enabled:!p.ids.includes(id)}))
      :[{id:'none',label:'Make one with + New playlist',enabled:false}]},
    pl?{id:'out',label:`Take out of “${pl.name}”`}:null,
    {id:'rm',label:'Remove from Sara'},
    t.kind==='file'?{sep:true}:null,
    t.kind==='file'?{id:'show',label:'Show the file'}:null
  ].filter(Boolean);
  const pick=await sara.ask('menu',items);
  if(!pick) return;
  if(pick.startsWith('to:')){ const p=plOf(pick.slice(3)); if(p&&!p.ids.includes(id)) p.ids.push(id); }
  else if(pick==='out'){ pl.ids=pl.ids.filter(x=>x!==id); }
  else if(pick==='rm'){
    L.tracks=L.tracks.filter(x=>x.id!==id); L.playlists.forEach(p=>{ p.ids=p.ids.filter(x=>x!==id); });
    if(!L.gone.includes(keyOf(t))) L.gone.push(keyOf(t));
    if(cur&&cur.id===id){ stop(); sara.send('yt',{cmd:'stop'}); audio.removeAttribute('src'); cur=null; pos=dur=0; drawNow(); }
  }
  else if(pick==='show'){ sara.send('show-file',t.path); return; }
  save(); render();
}
$('list').addEventListener('click',e=>{
  const p=e.target.closest('[data-play]'); if(p){ const t=byId(p.dataset.play); if(t.bad) delete t.bad; errRun=0; playId(t.id,idsOf(view),view); return; }
  const m=e.target.closest('[data-more]'); if(m) more(m.dataset.more);
});
$('list').addEventListener('contextmenu',e=>{ const r=e.target.closest('.row'); const m=r&&r.querySelector('[data-more]'); if(m){ e.preventDefault(); more(m.dataset.more); } });

/* ── YouTube: search, or a pasted link ── */
$('find').addEventListener('submit',async e=>{
  e.preventDefault();
  const q=$('q').value.trim(); if(!q) return;
  const box=$('results');
  box.innerHTML='<p class="msg">Looking…</p>';
  const one=await sara.ask('yt-info',q);
  const found=one?[one]:await sara.ask('yt-search',q);
  if(!found){ box.innerHTML='<p class="msg">Couldn’t reach YouTube. Check the connection and try again.</p>'; return; }
  if(!found.length){ box.innerHTML='<p class="msg">Nothing came up for that. Try other words, or paste the video’s link.</p>'; return; }
  results=found.map(r=>Object.assign({kind:'yt',id:'r:'+r.yt},r));
  render();
  if(one) playId(results[0].id,[results[0].id],'yt');
});
$('results').addEventListener('click',e=>{
  const p=e.target.closest('[data-play]'); if(p){ errRun=0; playId(p.dataset.play,results.map(t=>t.id),'yt'); return; }
  const a=e.target.closest('[data-add]');
  if(a){ const t=results.find(x=>x.id===a.dataset.add); const {id,...n}=t; add([n],{toView:true}); }
});

/* ── music dropped on the player ── */
const card=$('card'); let overN=0;
window.addEventListener('dragenter',e=>{ if(e.dataTransfer.types.includes('Files')){ e.preventDefault(); overN++; card.classList.add('over'); } });
window.addEventListener('dragleave',()=>{ if(--overN<=0){ overN=0; card.classList.remove('over'); } });
window.addEventListener('dragover',e=>{ e.preventDefault(); e.dataTransfer.dropEffect='copy'; });
window.addEventListener('drop',async e=>{
  e.preventDefault(); overN=0; card.classList.remove('over');
  const paths=sara.paths(e.dataTransfer.files); if(!paths.length) return;
  const tracks=await sara.ask('scan',paths);
  setTab('lib');
  add(tracks,{toView:true,play:!playing});
});

/* ── keys ── */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ sara.send('player-close'); return; }
  if(e.target.closest('input')) return;
  if(e.key===' '){ e.preventDefault(); toggle(); }
});

/* ── from Sara and the main process ── */
sara.on('add-tracks',o=>add(o.tracks,{play:!!o.play,quiet:!o.drop}));   // the folder watch is quiet; a drop or Add music is not
sara.on('cmd',c=>({toggle,next:()=>step(1,false),prev})[c]?.());
const sendSlot=()=>{ const r=$('slot').getBoundingClientRect(); sara.send('yt-slot',{x:r.left,y:r.top,w:r.width,h:r.height}); };
sara.on('open',()=>{ sendSlot(); });
/* the header shows whichever pet is out */
function portrait(id){ const d=PetKit.get(id); $('pt').innerHTML=PetKit.svg(d.id); $('nm').textContent=d.name; $('drop-b').textContent=`Let go to give ${d.name} these songs`; }
sara.on('pet',p=>portrait(p&&p.id));
window.addEventListener('resize',sendSlot);

(async()=>{
  PetKit.injectCSS();
  const o=await sara.ask('init');
  portrait(o.pet);
  L=Object.assign({tracks:[],playlists:[],gone:[]},o.library);
  if(!Array.isArray(L.gone)) L.gone=[];
  vol=typeof o.volume==='number'?o.volume:.8; shuffle=!!o.shuffle; repeat=['all','one','off'].includes(o.repeat)?o.repeat:'all';
  view=o.view==='all'||plOf(o.view)?o.view:'all';
  audio.volume=vol;
  add(o.folderTracks,{quiet:true});
  drawModes(); drawNow(); render(); sendSlot();
})();
