/* ═══════════════ Catching Days · Projects ═══════════════
   A place for the things you build. Each project has four screens:
   Overview (goal, requirements, parts, milestones, links), Board (Kanban),
   Log (an engineering journal: notes, builds, tests, problems, fixes,
   decisions) and Gallery (every picture in the project).

   This file is self-contained. It only CALLS the app's helpers ($, esc, uid,
   save, toast, modal, closeModal, pHead, today, dayKey, TZ, wFile, rFile,
   tab) and never changes any of them. The data lives in
   db.projects, a list of records with string ids, so saving and cloud sync
   carry it like everything else.

   Pictures are NOT kept in db: dozens of photos would overflow the browser's
   storage. They live in their own store, IndexedDB on this device, mirrored
   under the local server to project-images.json beside focus-data.json.
   A project only keeps picture ids. Everything public sits on window.PJ. */
(function(){
'use strict';

/* ── constants ── */
const LOG_TYPES=[
  {k:'note',n:'Note',c:'#6f7a75'},{k:'build',n:'Build',c:'#b07a1e'},{k:'test',n:'Test',c:'#4f86b3'},
  {k:'problem',n:'Problem',c:'#b0524a'},{k:'fix',n:'Fix',c:'#2f7a74'},{k:'decision',n:'Decision',c:'#715c95'}];
const LT=k=>LOG_TYPES.find(t=>t.k===k)||LOG_TYPES[0];
const COLORS=['#2f7a74','#ec7a45','#715c95','#d69a2e','#4f86b3','#b0524a','#5f9470','#1f2e2c'];
const LABEL_INK=['#4f86b3','#2f7a74','#715c95','#b07a1e','#b0524a','#5f9470','#c65f2e','#6f7a75'];
const TEMPLATES={
  hardware:{n:'Hardware',d:'Firmware, PCB, CAD, mechanical',labels:['Firmware','PCB','CAD','Mechanical','Test']},
  software:{n:'Software',d:'Frontend, backend, bugs, docs',labels:['Frontend','Backend','Bug','Design','Docs']},
  research:{n:'Research',d:'Reading, experiments, write-up',labels:['Reading','Experiment','Analysis','Writing','Blocker']},
  blank:{n:'Blank',d:'No labels, start from scratch',labels:[]}};
const PRIO=[{n:'Normal'},{n:'High',cls:'hi'},{n:'Urgent',cls:'hi top'}];
const PART_ST=[{k:'need',n:'To order',c:'#b07a1e'},{k:'ordered',n:'Ordered',c:'#4f86b3'},{k:'have',n:'Arrived',c:'#2f7a74'}];
const STATUS={active:'Active',paused:'Paused',shipped:'Shipped'};

/* ── view state (not saved) ── */
const S={sel:null,view:'board',filt:'active',q:'',label:null,pick:null,adding:null,
  hide:new Set(),gal:'all',draft:null,dragId:null};

/* ── data ── */
function all(){ if(!Array.isArray(db.projects)) db.projects=[]; return db.projects; }
function proj(id){ return all().find(p=>p.id===id)||null; }
function fixProj(p){
  ['cols','labels','cards','logs','photos','reqs','miles','parts','links'].forEach(k=>{ if(!Array.isArray(p[k])) p[k]=[]; });
  if(!p.cols.length) p.cols=defaultCols();
  if(!p.cols.some(c=>c.done)) p.cols[p.cols.length-1].done=true;
  ['name','goal','kind','cover','start','due'].forEach(k=>{ if(typeof p[k]!=='string') p[k]=p[k]==null?'':String(p[k]); });
  if(!STATUS[p.status]) p.status='active';
  if(!p.color) p.color=COLORS[0];
  p.cards.forEach(c=>{ ['labels','checks','imgs'].forEach(k=>{ if(!Array.isArray(c[k])) c[k]=[]; });
    if(!p.cols.some(x=>x.id===c.col)) c.col=p.cols[0].id; });
  p.logs.forEach(l=>{ if(!Array.isArray(l.imgs)) l.imgs=[]; });
  return p;
}
function defaultCols(){
  return [['Ideas'],['To do'],['Doing',3],['Testing'],['Done',0,true]].map(([name,limit,done])=>
    ({id:uid(),name,limit:limit||0,done:!!done}));
}
const doneCol=p=>p.cols.find(c=>c.done)||p.cols[p.cols.length-1];
const colOf=(p,id)=>p.cols.find(c=>c.id===id);
const card=(p,id)=>p.cards.find(c=>c.id===id);
const isDone=(p,c)=>{ const col=colOf(p,c.col); return !!(col&&col.done); };
function touch(p){ p.updated=Date.now(); save(); }

/* ── small formatting helpers ── */
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fD(s){ const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||''); return m?`${MON[+m[2]-1]} ${+m[3]}`:''; }
function dTo(s){ const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||''), t=/^(\d{4})-(\d{2})-(\d{2})$/.exec(today());
  return m&&t?Math.round((Date.UTC(+m[1],+m[2]-1,+m[3])-Date.UTC(+t[1],+t[2]-1,+t[3]))/864e5):null; }
function ago(ts){ if(!ts) return ''; const d=dTo(dayKey(ts)); return d===0?'today':d===-1?'yesterday':`${-d}d ago`; }
function hm(ts){ try{ return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',timeZone:TZ()}).format(ts); }catch(e){ return ''; } }
function dayTitle(k){ const d=dTo(k); if(d===0) return 'Today'; if(d===-1) return 'Yesterday';
  const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(k); const wd=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(Date.UTC(+m[1],+m[2]-1,+m[3])).getUTCDay()];
  return `${wd}, ${fD(k)}`; }
function mins(n){ n=Math.round(n||0); return n<60?`${n} min`:`${Math.floor(n/60)} h${n%60?' '+n%60+' min':''}`; }
const chip=(name,c)=>`<span class="pj-chip" style="color:${c};background:${c}1a">${esc(name)}</span>`;
const dot=c=>`<i style="width:9px;height:9px;border-radius:50%;background:${c};display:inline-block;flex:none"></i>`;
const money=n=>'$'+(Math.round(n*100)/100).toFixed(2);
function safeUrl(u){ u=String(u||'').trim(); if(!u) return ''; if(!/^[a-z][a-z0-9+.-]*:/i.test(u)) u='https://'+u;
  return /^https?:\/\//i.test(u)?u:''; }
const q=s=>esc(s).replace(/`/g,'&#96;');

/* ═══════════ pictures ═══════════ */
const IMG={url:new Map(),data:new Map(),loaded:false,pending:false,t:null,dbp:null};
function idb(){
  if(IMG.dbp) return IMG.dbp;
  IMG.dbp=new Promise(res=>{
    try{ const r=indexedDB.open('catchingdays-projects',1);
      r.onupgradeneeded=()=>r.result.createObjectStore('imgs');
      r.onsuccess=()=>res(r.result); r.onerror=()=>res(null); r.onblocked=()=>res(null);
    }catch(e){ res(null); }
  });
  return IMG.dbp;
}
async function idbDo(mode,fn){
  const d=await idb(); if(!d) return null;
  return new Promise(res=>{ try{ const tx=d.transaction('imgs',mode), st=tx.objectStore('imgs'); const r=fn(st);
      tx.oncomplete=()=>res(r&&r.result!==undefined?r.result:true); tx.onerror=()=>res(null); tx.onabort=()=>res(null);
    }catch(e){ res(null); } });
}
function toBlob(dataUrl){
  const [h,b]=dataUrl.split(','); const mime=(/data:([^;]+)/.exec(h)||[])[1]||'image/jpeg';
  const bin=atob(b), u=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
  return new Blob([u],{type:mime});
}
function remember(id,dataUrl){
  if(IMG.url.has(id)) return;
  IMG.data.set(id,dataUrl);
  try{ IMG.url.set(id,URL.createObjectURL(toBlob(dataUrl))); }catch(e){ IMG.url.set(id,dataUrl); }
}
function imgUrl(id){ return IMG.url.get(id)||''; }
/* the local server keeps a copy on disk, written after any change, but only
   once the copy already there has been read (or it would be overwritten) */
function fileDirty(){
  if(!SERVER) return;
  if(!IMG.loaded){ IMG.pending=true; return; }
  clearTimeout(IMG.t);
  IMG.t=setTimeout(()=>{
    const o={}; IMG.data.forEach((v,k)=>{ o[k]=v; });
    wFile('project-images.json',JSON.stringify({v:1,note:'Pictures for the Projects tab, keyed by id.',imgs:o}))
      .then(ok=>{ if(!ok) toast('Could not write project-images.json. Your pictures are still kept in this browser.'); });
  },1200);
}
async function imgInit(){
  const keys=await idbDo('readonly',st=>st.getAllKeys())||[];
  const vals=await idbDo('readonly',st=>st.getAll())||[];
  keys.forEach((k,i)=>{ if(typeof vals[i]==='string') remember(k,vals[i]); });
  if(SERVER){
    const txt=await rFile('project-images.json');
    let f=null; if(txt){ try{ f=JSON.parse(txt); }catch(e){ f=null; } }
    if(txt&&!f){ IMG.loaded=false; toast('project-images.json could not be read, so it was left alone.'); return refresh(); }
    const onDisk=(f&&f.imgs)||{};
    const fresh=Object.keys(onDisk).filter(k=>!IMG.url.has(k)&&typeof onDisk[k]==='string');
    fresh.forEach(k=>remember(k,onDisk[k]));
    if(fresh.length) await idbDo('readwrite',st=>{ fresh.forEach(k=>st.put(onDisk[k],k)); });
    IMG.loaded=true;
    if(IMG.pending||[...IMG.data.keys()].some(k=>!(k in onDisk))){ IMG.pending=false; fileDirty(); }
  } else IMG.loaded=true;
  refresh();
}
async function imgPut(dataUrl){
  const id='i'+uid(); remember(id,dataUrl);
  await idbDo('readwrite',st=>st.put(dataUrl,id));
  fileDirty(); return id;
}
function imgDrop(ids){
  ids=(ids||[]).filter(Boolean); if(!ids.length) return;
  /* a picture can be shared (a log entry made from a card copies its ids), so
     only forget ones nothing in any project still points at */
  const used=new Set(); all().forEach(p=>picsOf(p).forEach(x=>used.add(x.id)));
  const gone=ids.filter(id=>!used.has(id)); if(!gone.length) return;
  gone.forEach(id=>{ const u=IMG.url.get(id); if(u&&u.startsWith('blob:')) URL.revokeObjectURL(u); IMG.url.delete(id); IMG.data.delete(id); });
  idbDo('readwrite',st=>{ gone.forEach(id=>st.delete(id)); });
  fileDirty();
}
function shrink(file,max){
  return new Promise((res,rej)=>{
    if(!/^image\//.test(file.type)) return rej(new Error('not an image'));
    const r=new FileReader();
    r.onerror=()=>rej(r.error);
    r.onload=()=>{ const im=new Image(); im.onerror=()=>rej(new Error('bad image'));
      im.onload=()=>{ const s=Math.min(1,max/Math.max(im.width,im.height));
        const w=Math.max(1,Math.round(im.width*s)), h=Math.max(1,Math.round(im.height*s));
        const c=document.createElement('canvas'); c.width=w; c.height=h;
        const x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,w,h); x.drawImage(im,0,0,w,h);
        res(c.toDataURL('image/jpeg',.86)); };
      im.src=r.result; };
    r.readAsDataURL(file);
  });
}
/* opens the file picker; resolves with the new picture ids */
function pickImages(multi,max){
  return new Promise(res=>{
    const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.multiple=!!multi;
    inp.onchange=async()=>{
      const files=[...(inp.files||[])], ids=[];
      for(const f of files){ try{ ids.push(await imgPut(await shrink(f,max||1600))); }catch(e){ toast(`Skipped ${f.name}: not a picture this browser can read.`); } }
      res(ids);
    };
    inp.click();
  });
}
function picHTML(id,o){
  o=o||{}; const u=imgUrl(id);
  const del=o.del?`<span class="del" role="button" aria-label="Remove picture" onclick="event.stopPropagation();${o.del}">✕</span>`:'';
  return u?`<button type="button" class="pj-pic${o.cls?' '+o.cls:''}" style="background-image:url('${u}')" onclick="${o.click||`PJ.zoom('${id}')`}" aria-label="Open picture">${del}</button>`
    :`<div class="pj-pic pj-miss${o.cls?' '+o.cls:''}">${IMG.loaded?'Picture not on this device':'Loading…'}${del}</div>`;
}
function bg(id){ const u=imgUrl(id); return u?`background-image:url('${u}')`:''; }
/* every picture in a project, with where it came from */
function picsOf(p){
  const out=[];
  if(p.cover) out.push({id:p.cover,src:'cover',cap:'Cover'});
  (p.photos||[]).forEach(x=>out.push({id:x.id,src:'upload',cap:x.cap||'',ref:x.id,at:x.at}));
  (p.logs||[]).forEach(l=>(l.imgs||[]).forEach(id=>out.push({id,src:'log',cap:l.title||LT(l.type).n,ref:l.id,at:l.at})));
  (p.cards||[]).forEach(c=>(c.imgs||[]).forEach(id=>out.push({id,src:'card',cap:c.title,ref:c.id,at:c.created})));
  return out;
}

/* ═══════════ the pond ═══════════
   Banners here are real pond water, drawn with the app's own pond kit
   (window.Pond), and the fish in them are species you've actually found.
   A banner carries data-pond="<seed>" and an empty .amb; fillPonds() draws
   the water once the banner has a size (fish paths are in pixels). */
function strHash(t){ let x=7; for(const ch of String(t)) x=(Math.imul(x,31)+ch.charCodeAt(0))>>>0; return x; }
function myFish(n,salt){
  const P=window.Pond, seen=Object.keys((db.pond&&db.pond.seen)||{}).filter(k=>P.SP[k]);
  const a=(seen.length?seen:['koi','goldfish','betta']).slice();
  let x=strHash(today()+'|'+salt)||1;
  for(let i=a.length-1;i>0;i--){ x=(Math.imul(x,1103515245)+12345)>>>0; const j=x%(i+1); [a[i],a[j]]=[a[j],a[i]]; }
  return a.slice(0,n);
}
function scene(W,H,salt,n){
  const P=window.Pond; if(!P||W<40||H<40) return '';
  try{ P.PF.motion=pondMotionOn(); }catch(e){}
  P.reseed(1+strHash(salt)%9000);
  const R=P.rnd, out=[P.caustics(W,H,.18)];
  /* a deep shape far down, then your fish in the open water on the right
     (the left is shaded for the words) */
  out.push(P.deep('koi',P.loop(W*.62,H*.55,W*.22,H*.3,6,.3),80,false,1.5));
  myFish(n,salt).forEach((k,i)=>{
    const sp=P.SP[k], cx=W*(.56+R()*.26), cy=H*(.4+R()*.22), rx=Math.max(60,W*(.1+R()*.1)), ry=Math.max(22,H*(.16+R()*.12));
    out.push(P.swimmer(P.loop(cx,cy,rx,ry,6,.5),(k==='puffer'?42:24+R()*16).toFixed(1),i%2===1,
      P.fish(k,+((sp.s||1)*(H<170?.75:.98)).toFixed(2),(.6+R()*.4).toFixed(2))));
  });
  out.push(P.pad(W-46,H-34,H<170?26:40,30+R()*200,'#5f9470',H<170?null:'good'),P.pad(W*.78,22,H<170?16:22,R()*300,'#6f9e7a',null),
    P.ripple(W*.7,H*.6,150,0),P.ripple(W*.88,H*.3,110,3),P.glints(W,H,Math.round(W/90)),P.petals(H,2));
  return out.join('');
}
function fillPonds(force){
  document.querySelectorAll('[data-pond]').forEach(el=>{
    const amb=el.querySelector(':scope>.amb'); if(!amb) return;
    const W=Math.round(el.clientWidth), H=Math.round(el.clientHeight), sig=W+'x'+H;
    if(!force&&amb.dataset.sig===sig) return;
    const html=scene(W,H,el.dataset.pond,+el.dataset.n||3);
    if(amb.dataset.sig&&window.Pond&&window.Pond.morph) window.Pond.morph(amb,html); else amb.innerHTML=html;
    amb.dataset.sig=sig;
  });
}
let _pondT=null;
window.addEventListener('resize',()=>{ clearTimeout(_pondT); _pondT=setTimeout(()=>{ if(shown()||$('modals').querySelector('[data-pond]')) fillPonds(); },160); });
const pondBits='<div class="amb"></div><div class="pj-shade"></div>';

/* ═══════════ navigation ═══════════
   Projects is a screen under Plan (Tasks · Journeys · Projects): the app's
   own tab('proj') shows it, highlights the nav and calls PJ.paint(). The
   watcher below is only a safety net for anything that shows another
   screen without going through tab(). */
function shown(){ const v=$('v-proj'); return !!v&&!v.classList.contains('hide'); }
function go(id){
  if(id!==undefined) S.sel=id;
  tab('proj');
}
function watchLeave(){
  const main=$('main'); if(!main||!window.MutationObserver) return;
  new MutationObserver(()=>{
    if(!shown()) return;
    const other=[...main.children].some(el=>/^v-/.test(el.id)&&el.id!=='v-proj'&&!el.classList.contains('hide'));
    if(other) $('v-proj').classList.add('hide');
  }).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
}
/* redraw after outside changes (sync, the app's repaint): never while a
   dialog is open or a field here has the cursor, and keep any log draft */
function refresh(){
  if(!shown()||$('modals').innerHTML) return;
  const a=document.activeElement;
  if(a&&a.matches&&a.matches('input,textarea,select')&&a.closest('#v-proj')) return;
  readLog(); paint();
}

/* ═══════════ painting ═══════════ */
function paint(){
  const el=$('proj-body'); if(!el) return;
  const p=S.sel&&proj(S.sel);
  if(!p){ S.sel=null; el.innerHTML=listHTML(); fillPonds(); return; }
  fixProj(p);
  const body=S.view==='overview'?overviewHTML(p):S.view==='log'?logHTML(p):S.view==='gallery'?galleryHTML(p):boardHTML(p);
  el.innerHTML=`<div class="pj">${heroHTML(p)}${body}</div>`;
  fillPonds();
  if(S.view==='log') bindCompose(p);
  if(S.view==='board'&&S.adding){ const t=$('pj-addt'); if(t) t.focus(); }
}

/* ── all projects ── */
function stats(){
  const wk=Date.now()-7*864e5, act=all().filter(p=>p.status==='active');
  let moved=0, logs=0, probs=0, next=null;
  all().forEach(p=>{ fixProj(p);
    moved+=p.cards.filter(c=>c.doneAt&&c.doneAt>wk&&isDone(p,c)).length;
    logs+=p.logs.filter(l=>l.at>wk).length;
    probs+=p.logs.filter(l=>l.type==='problem'&&!l.solved).length; });
  act.forEach(p=>p.miles.filter(m=>!m.done&&m.date).forEach(m=>{ if(!next||m.date<next.m.date) next={m,p}; }));
  return {moved,logs,probs,next,done:all().reduce((n,p)=>n+p.cards.filter(c=>isDone(p,c)).length,0)};
}
function progress(p){ const n=p.cards.length, d=p.cards.filter(c=>isDone(p,c)).length; return {n,d,pct:n?Math.round(d/n*100):0}; }
function lastLog(p){ return p.logs.reduce((m,l)=>Math.max(m,l.at||0),0); }
function coverStyle(p){ return p.cover&&imgUrl(p.cover)?bg(p.cover):`background:linear-gradient(135deg,${p.color},${shade(p.color)})`; }
function shade(hex){ const n=parseInt(hex.slice(1),16); const f=v=>Math.round(v*.55).toString(16).padStart(2,'0');
  return '#'+f(n>>16&255)+f(n>>8&255)+f(n&255); }
function listHTML(){
  const P=all().map(fixProj), cnt=k=>P.filter(p=>p.status===k).length;
  const list=P.filter(p=>p.status===S.filt).sort((a,b)=>(b.updated||b.created||0)-(a.updated||a.created||0));
  const st=stats();
  const filt=`<div class="co-filt">${Object.keys(STATUS).map(k=>`<button class="${S.filt===k?'on':''}" onclick="PJ.filt('${k}')">${STATUS[k]} ${cnt(k)}</button>`).join('')}</div>`;
  const head=pHead('Projects','What you’re building: a board, a build log and the pictures, one place per project.',
    `<div class="pj-right">${P.length?filt:''}<button class="pbtn go" onclick="PJ.newProj()">+ New project</button></div>`);
  if(!P.length) return `<div class="pj">${head}
    <div class="water pj-bench" data-pond="bench" data-n="4">${pondBits}<div class="pj-bench-in">
      <div class="k">On the bench</div><div class="big">Nothing on the bench yet</div>
      <div class="s">Start a project and it gets a Kanban board, a build log for what you tried and why, and a gallery for every photo, sketch and screenshot.</div>
      <div style="margin-top:12px"><button class="pbtn go" onclick="PJ.newProj()">Start your first project</button></div></div></div></div>`;
  const nx=st.next;
  const bench=`<div class="water pj-bench" data-pond="bench" data-n="4">${pondBits}<div class="pj-bench-in">
      <div class="k">This week on the bench</div>
      <div class="big">${st.moved} card${st.moved===1?'':'s'} finished · ${st.logs} log entr${st.logs===1?'y':'ies'}</div>
      <div class="s">${nx?`Next milestone: <b>${esc(nx.m.name)}</b> · ${esc(nx.p.name)} · ${fD(nx.m.date)}`:'No milestones coming up. Add some on a project’s Overview.'}</div>
      <div class="pj-bstats"><div><b style="color:#f7c7a6">${st.probs}</b><span>open problem${st.probs===1?'':'s'}</span></div>
        <div><b>${st.done}</b><span>card${st.done===1?'':'s'} done, all projects</span></div></div></div></div>`;
  const cards=list.map(p=>{ const pr=progress(p), ll=lastLog(p);
    const cols=p.cols.filter(c=>!c.done).map(c=>[c.name,p.cards.filter(k=>k.col===c.id).length]).filter(x=>x[1]);
    return `<button type="button" class="pj-card" onclick="PJ.open('${p.id}')">
      <div class="pj-cover" style="${coverStyle(p)}"><span class="pj-st">${STATUS[p.status]}</span></div>
      <div class="b">
        <div class="top">${dot(p.color)}<span>${esc(p.kind||'Project')}</span>${p.due?`<span class="due">due ${fD(p.due)}</span>`:''}</div>
        <h2>${esc(p.name)}</h2>
        ${p.goal?`<p>${esc(p.goal)}</p>`:''}
        <div style="display:flex;flex-direction:column;gap:7px">
          <div class="pbar"><i style="width:${pr.pct}%"></i></div>
          <div class="foot"><span>${pr.d} of ${pr.n} card${pr.n===1?'':'s'} done</span><span>${ll?'logged '+ago(ll):'no log yet'}</span></div></div>
        ${cols.length?`<div class="pj-cols">${cols.map(([n,k])=>`<span class="pj-pill">${esc(n)} ${k}</span>`).join('')}</div>`:''}
      </div></button>`; }).join('');
  const shipped=S.filt!=='shipped'?P.filter(p=>p.status==='shipped').sort((a,b)=>(b.shippedAt||0)-(a.shippedAt||0)):[];
  return `<div class="pj">${head}${bench}
    <div class="pj-grid">${cards||`<div class="pcard" style="display:flex;flex-direction:column;gap:6px;justify-content:center"><span class="pj-h2">Nothing ${STATUS[S.filt].toLowerCase()}</span><span class="pj-sub">Projects you mark ${STATUS[S.filt].toLowerCase()} show up here.</span></div>`}
      <button type="button" class="pj-new" onclick="PJ.newProj()"><span class="plus">+</span>Start a project<span class="s">hardware, software, research or blank</span></button></div>
    ${shipped.length?`<div class="pcard" style="display:flex;flex-direction:column;gap:12px">
      <div style="display:flex;align-items:baseline;gap:12px"><span class="pj-h2">Shipped</span><span class="pj-sub">finished projects keep their boards, logs and pictures</span></div>
      ${shipped.map(p=>{ const pr=progress(p); return `<div class="pj-ship"><span class="th" style="${coverStyle(p)}"></span>
        <div class="t"><b>${esc(p.name)}</b><span>${p.shippedAt?'Shipped '+fD(dayKey(p.shippedAt))+' · ':''}${pr.n} cards · ${p.logs.length} log entries · ${picsOf(p).length} pictures</span></div>
        <button class="pbtn sm" onclick="PJ.open('${p.id}')">Open</button></div>`; }).join('')}</div>`:''}</div>`;
}

/* ── one project ── */
function nextMile(p){ return p.miles.filter(m=>!m.done).sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'))[0]||null; }
function heroHTML(p){
  const pr=progress(p), nm=nextMile(p);
  const photo=!!(p.cover&&imgUrl(p.cover));
  const style=photo?bg(p.cover):`background:${waterBg(p.color)}`;
  const tabs=[['overview','Overview'],['board','Board'],['log','Log'],['gallery','Gallery']];
  return `<div class="pj-hero${photo?' photo':''}" style="${style}"${photo?'':` data-pond="hero-${p.id}" data-n="3"`}>
    ${photo?'':pondBits}
    <div style="min-width:0">
      <button class="pj-back" onclick="PJ.home()">← All projects</button>
      <h1>${esc(p.name)}</h1>
      <div class="meta"><span class="st">${STATUS[p.status]}</span>
        ${p.due?`<span>Due ${fD(p.due)}</span><span>·</span>`:''}<span>${pr.d} of ${pr.n} cards done</span>
        ${nm?`<span>·</span><span>Next: ${esc(nm.name)}${nm.date?', '+fD(nm.date):''}</span>`:''}</div>
    </div>
    <div class="pj-tabs">${tabs.map(([k,n])=>`<button class="${S.view===k?'on':''}" onclick="PJ.view('${k}')">${n}</button>`).join('')}
      <button class="ed" title="Edit project" aria-label="Edit project" onclick="PJ.editProj()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 20h4L19 9l-4-4L4 16v4z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/></svg></button></div>
  </div>`;
}

/* ── board ── */
function cardMatches(p,c){
  if(S.label&&!c.labels.includes(S.label)) return false;
  const s=S.q.trim().toLowerCase(); if(!s) return true;
  return (c.title+' '+(c.notes||'')+' '+c.checks.map(x=>x.t).join(' ')).toLowerCase().includes(s);
}
function labelOf(p,id){ return p.labels.find(l=>l.id===id); }
function cardHTML(p,c){
  const col=colOf(p,c.col), done=col&&col.done;
  const chk=c.checks.length?`<span>☑ ${c.checks.filter(x=>x.done).length}/${c.checks.length}</span>`:'';
  const dd=c.due?dTo(c.due):null;
  const due=c.due?`<span class="${!done&&dd<0?'late':''}">${!done&&dd===0?'Today':!done&&dd<0?fD(c.due)+' · late':fD(c.due)}</span>`:'';
  const idx=p.cols.indexOf(col), nxt=p.cols[idx+1];
  return `<button type="button" class="pj-k" draggable="true" data-id="${c.id}" ondragstart="PJ.dragStart(event,'${c.id}')" ondragend="PJ.dragEnd()" onclick="PJ.card('${c.id}')">
    ${c.imgs.length?`<div class="ph" style="${bg(c.imgs[0])}"></div>`:''}
    ${c.labels.length?`<div class="tags">${c.labels.map(id=>{ const l=labelOf(p,id); return l?chip(l.name,l.c):''; }).join('')}</div>`:''}
    <div class="tt">${esc(c.title)}</div>
    ${chk||due||c.prio||c.imgs.length>1||nxt?`<div class="mt">${chk}${due}${c.imgs.length>1?`<span>${c.imgs.length} pictures</span>`:''}
      ${c.prio?`<span class="${PRIO[c.prio].cls}" title="${PRIO[c.prio].n} priority"></span>`:''}
      ${nxt?`<span class="pj-mv" role="button" onclick="event.stopPropagation();PJ.move('${c.id}','${nxt.id}')">${esc(nxt.name)} →</span>`:''}</div>`:''}
  </button>`;
}
function boardHTML(p){
  if(!S.pick||!colOf(p,S.pick)) S.pick=(p.cols.find(c=>!c.done&&p.cards.some(k=>k.col===c.id))||p.cols[0]).id;
  const tool=`<div class="pj-tool">
    <label class="pj-search"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <input id="pj-q" placeholder="Find a card" value="${q(S.q)}" oninput="PJ.search(this.value)" autocomplete="off"></label>
    ${p.labels.map(l=>`<button class="pj-lab${S.label===l.id?' on':''}" onclick="PJ.labelFilter('${l.id}')"><i style="background:${l.c}"></i>${esc(l.name)}</button>`).join('')}
    <span style="margin-left:auto" class="pj-sub pj-dh">drag cards between columns</span>
    <button class="pbtn sm" onclick="PJ.editCols()">Columns</button>
    <button class="pbtn sm" onclick="PJ.editLabels()">Labels</button></div>`;
  const pick=`<div class="pj-colpick">${p.cols.map(c=>`<button class="${S.pick===c.id?'on':''}" onclick="PJ.pickCol('${c.id}')">${esc(c.name)} ${p.cards.filter(k=>k.col===c.id).length}</button>`).join('')}</div>`;
  const cols=p.cols.map(c=>{
    const cs=p.cards.filter(k=>k.col===c.id), shownCs=cs.filter(k=>cardMatches(p,k));
    const over=c.limit&&cs.length>c.limit;
    const adding=S.adding===c.id;
    return `<section class="pj-col${c.done?' water':''}${S.pick===c.id?' pick':''}">
      <div class="pj-colh"><span class="n">${esc(c.name)}</span><span class="c">${cs.length}</span>
        ${c.limit?`<span class="lim${over?' over':''}">${over?'over ':''}limit ${c.limit}</span>`:c.done?'<span class="lim">into the pond</span>':''}</div>
      <div class="pj-drop-zone" data-col="${c.id}" ondragover="PJ.dragOver(event,'${c.id}')" ondragleave="PJ.dragLeave(event)" ondrop="PJ.drop(event,'${c.id}')">
        ${shownCs.map(k=>cardHTML(p,k)).join('')}
        ${!cs.length&&!adding?`<div class="pj-sub" style="padding:6px 4px;${c.done?'color:#9fc2bb':''}">${c.done?'Finished cards drift down here.':'Nothing here yet.'}</div>`:''}
        ${cs.length&&!shownCs.length?`<div class="pj-sub" style="padding:6px 4px">No cards match.</div>`:''}
      </div>
      ${adding?`<div class="pj-addbox"><textarea id="pj-addt" placeholder="What needs doing? (Enter to add, Esc to stop)"
          onkeydown="PJ.addKey(event,'${c.id}')"></textarea>
        <div class="row" style="gap:8px;margin-top:8px"><button class="sm primary" onclick="PJ.addCard('${c.id}')">Add card</button><button class="sm ghost" onclick="PJ.addStop()">Done</button></div></div>`
        :`<button class="pj-add" onclick="PJ.addStart('${c.id}')">+ Add a card</button>`}
    </section>`; }).join('');
  return `${tool}${pick}<div class="pj-board" id="pj-board">${cols}</div>`;
}
function moveCard(p,c,colId,beforeId){
  const target=colOf(p,colId); if(!target) return;
  const wasDone=isDone(p,c);
  p.cards.splice(p.cards.indexOf(c),1);
  c.col=colId;
  let at=-1;
  if(beforeId){ const b=card(p,beforeId); if(b&&b.col===colId) at=p.cards.indexOf(b); }
  if(at<0){ let last=-1; p.cards.forEach((k,i)=>{ if(k.col===colId) last=i; }); at=last<0?p.cards.length:last+1; }
  p.cards.splice(at,0,c);
  if(target.done&&!wasDone) c.doneAt=Date.now();
  if(!target.done) c.doneAt=null;
  touch(p);
  if(target.done&&!wasDone) toast(`“${c.title}” drifted into the pond.`);
}

/* ── card dialog ── */
function openCard(id,o){
  const p=proj(S.sel); if(!p) return; const c=card(p,id); if(!c) return;
  S.draft={id:c.id,title:c.title,col:c.col,prio:c.prio||0,due:c.due||'',est:c.est||'',notes:c.notes||'',
    labels:c.labels.slice(),checks:c.checks.map(x=>({...x})),imgs:c.imgs.slice(),added:[]};
  modal(`<div class="pj-m" id="pj-cm"></div>`,true);
  paintCard();
  if(o&&o.focusTitle){ const t=$('pj-ct'); if(t){ t.focus(); t.select(); } }
}
function readCard(){
  const d=S.draft; if(!d) return;
  const v=id=>{ const e=$(id); return e?e.value:null; };
  if(v('pj-ct')!=null) d.title=v('pj-ct');
  if(v('pj-cc')!=null) d.col=v('pj-cc');
  if(v('pj-cp')!=null) d.prio=+v('pj-cp');
  if(v('pj-cd')!=null) d.due=v('pj-cd');
  if(v('pj-ce')!=null) d.est=v('pj-ce');
  if(v('pj-cn')!=null) d.notes=v('pj-cn');
}
function paintCard(){
  const p=proj(S.sel), d=S.draft, el=$('pj-cm'); if(!p||!d||!el) return;
  const c=card(p,d.id), col=colOf(p,d.col);
  const logs=p.logs.filter(l=>l.cardId===d.id).sort((a,b)=>b.at-a.at);
  const nd=d.checks.filter(x=>x.done).length;
  el.innerHTML=`
    <div class="hd"><div><div class="pj-eyebrow">${esc(p.name)} · ${esc(col?col.name:'')}</div>
      <input id="pj-ct" class="ttl" value="${q(d.title)}" aria-label="Card title" onkeydown="if(event.key==='Enter')PJ.saveCard()"></div>
      <button class="iconbtn" aria-label="Close" onclick="closeModal()">✕</button></div>
    <div class="pj-f4">
      <label><span class="lbl">Column</span><select id="pj-cc">${p.cols.map(x=>`<option value="${x.id}"${x.id===d.col?' selected':''}>${esc(x.name)}</option>`).join('')}</select></label>
      <label><span class="lbl">Priority</span><select id="pj-cp">${PRIO.map((x,i)=>`<option value="${i}"${i===d.prio?' selected':''}>${x.n}</option>`).join('')}</select></label>
      <label><span class="lbl">Due</span><input id="pj-cd" type="date" value="${q(d.due)}"></label>
      <label><span class="lbl">Estimate (min)</span><input id="pj-ce" type="number" min="0" step="5" value="${q(d.est)}"></label>
    </div>
    <div class="pj-sec"><span class="lbl" style="margin:0">Labels</span>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${p.labels.map(l=>`<button class="pj-lab${d.labels.includes(l.id)?' on':''}" onclick="PJ.cTogLabel('${l.id}')"><i style="background:${l.c}"></i>${esc(l.name)}</button>`).join('')}
        <button class="pj-lab" style="border-style:dashed" onclick="PJ.cNewLabel()">+ label</button></div></div>
    <label class="pj-sec"><span class="lbl" style="margin:0">Notes</span><textarea id="pj-cn" placeholder="Details, specs, what done looks like…">${esc(d.notes)}</textarea></label>
    <div class="pj-sec"><div class="sh"><span>Checklist</span><span class="pj-sub">${d.checks.length?`${nd} of ${d.checks.length}`:''}</span></div>
      ${d.checks.length?`<div class="pbar"><i style="width:${Math.round(nd/d.checks.length*100)}%"></i></div>`:''}
      ${d.checks.map((x,i)=>`<label class="pj-ck${x.done?' done':''}"><input type="checkbox" ${x.done?'checked':''} onchange="PJ.cCheck(${i})"><span>${esc(x.t)}</span>
        <button class="pj-x" aria-label="Remove step" onclick="event.preventDefault();PJ.cUncheck(${i})">×</button></label>`).join('')}
      <input id="pj-cs" placeholder="Add a step… (Enter)" onkeydown="if(event.key==='Enter'){event.preventDefault();PJ.cAddStep()}"></div>
    <div class="pj-sec"><div class="sh"><span>Pictures</span><span class="pj-sub">${d.imgs.length||''}</span></div>
      <div class="pj-pics">${d.imgs.map((id,i)=>picHTML(id,{del:`PJ.cDelImg(${i})`})).join('')}
        <button class="pj-pic add" aria-label="Add pictures" onclick="PJ.cAddImg()">+</button></div></div>
    ${logs.length?`<div class="pj-sec"><div class="sh"><span>In the log</span></div>
      ${logs.map(l=>`<button class="pj-ref" onclick="PJ.toLog('${l.id}')">${chip(LT(l.type).n,LT(l.type).c)}<span>${esc(l.title||l.body.slice(0,80))}</span><span class="w">${fD(dayKey(l.at))}</span></button>`).join('')}</div>`:''}
    <div class="pj-foot">
      ${c?`<button class="sm danger" onclick="PJ.delCard()">Delete</button>`:''}
      <span class="sp pj-sub">${c&&c.created?'Added '+fD(dayKey(c.created)):''}</span>
      <button class="pbtn" onclick="PJ.cardToLog()">Write a log entry</button>
      <button class="pbtn go" onclick="PJ.saveCard()">Save</button></div>`;
}
function saveCard(){
  readCard();
  const p=proj(S.sel), d=S.draft; if(!p||!d) return;
  const c=card(p,d.id); if(!c){ closeModal(); return; }
  const title=d.title.trim(); if(!title){ toast('Give the card a title.'); return; }
  const removed=c.imgs.filter(id=>!d.imgs.includes(id));
  c.title=title; c.prio=d.prio; c.due=d.due; c.est=d.est===''?'':Math.max(0,+d.est||0); c.notes=d.notes;
  c.labels=d.labels.filter(id=>labelOf(p,id)); c.checks=d.checks; c.imgs=d.imgs;
  if(c.col!==d.col) moveCard(p,c,d.col); else touch(p);
  S.draft=null; closeModal(); imgDrop(removed); paint();
  return c;
}

/* ── log ── */
function blankDraft(){ return {type:'note',title:'',body:'',imgs:[],cardId:'',mins:'',fixes:''}; }
function logHTML(p){
  if(!S.ld||S.ld.p!==p.id) S.ld={p:p.id,...blankDraft()};
  const d=S.ld;
  const open=p.logs.filter(l=>l.type==='problem'&&!l.solved).sort((a,b)=>b.at-a.at);
  const dec=p.logs.filter(l=>l.type==='decision').sort((a,b)=>b.at-a.at);
  const list=p.logs.filter(l=>!S.hide.has(l.type)).sort((a,b)=>b.at-a.at);
  const days=[]; list.forEach(l=>{ const k=dayKey(l.at); let g=days[days.length-1]; if(!g||g.k!==k){ g={k,l:[]}; days.push(g); } g.l.push(l); });
  const compose=`<div class="pcard pj-compose">
    <div class="pj-types">${LOG_TYPES.map(t=>`<button class="pj-type" style="${d.type===t.k?`border-color:${t.c};background:${t.c}1a;color:${t.c}`:''}" onclick="PJ.lType('${t.k}')">${t.n}</button>`).join('')}</div>
    <input id="pj-lt" placeholder="Title (optional)" value="${q(d.title)}">
    <textarea id="pj-lb" placeholder="${d.type==='problem'?'What’s going wrong? What have you ruled out?':d.type==='decision'?'What did you decide, and why? What else did you consider?':d.type==='test'?'What did you test, how, and what happened?':d.type==='fix'?'What fixed it?':'What happened on the bench today?'}">${esc(d.body)}</textarea>
    ${d.imgs.length?`<div class="pj-pics">${d.imgs.map((id,i)=>picHTML(id,{del:`PJ.lDelImg(${i})`})).join('')}</div>`:''}
    <div class="pj-crow">
      <button class="pbtn sm" onclick="PJ.lAddImg()">Add pictures</button>
      <select id="pj-lc" aria-label="Link a card"><option value="">No card linked</option>${p.cards.map(c=>`<option value="${c.id}"${d.cardId===c.id?' selected':''}>${esc(c.title.slice(0,60))}</option>`).join('')}</select>
      ${d.type==='fix'&&open.length?`<select id="pj-lf" aria-label="Fixes which problem"><option value="">Fixes… (optional)</option>${open.map(l=>`<option value="${l.id}"${d.fixes===l.id?' selected':''}>${esc((l.title||l.body).slice(0,60))}</option>`).join('')}</select>`:''}
      <label class="pj-sub" style="display:flex;gap:6px;align-items:center">Time <input id="pj-lm" class="mins" type="number" min="0" step="5" placeholder="min" value="${q(d.mins)}"></label>
      <span class="kbd">Ctrl+Enter</span>
      <button class="pbtn go" onclick="PJ.logIt()">Log it</button></div></div>`;
  const entries=days.length?days.map(g=>{ const m=g.l.reduce((n,l)=>n+(+l.mins||0),0);
    return `<div class="pj-day"><div class="h"><b>${dayTitle(g.k)}</b><span>${g.l.length} entr${g.l.length===1?'y':'ies'}${m?' · '+mins(m):''}</span></div>
      ${g.l.map(l=>entryHTML(p,l)).join('')}</div>`; }).join('')
    :`<div class="pcard"><span class="pj-h2">${p.logs.length?'Nothing matches the filter':'No entries yet'}</span>
      <p class="pj-empty" style="margin-top:8px">${p.logs.length?'Tick more types on the right.':'Log what you try, what breaks and what you decide. Future you will want to know why.'}</p></div>`;
  const counts=k=>p.logs.filter(l=>l.type===k).length;
  return `<div class="pj-two"><div style="display:flex;flex-direction:column;gap:18px">${compose}${entries}</div>
    <aside class="pj-side">
      <div class="pcard"><span class="pj-h2">Show</span>
        ${LOG_TYPES.map(t=>`<label class="pj-flt"><input type="checkbox" ${S.hide.has(t.k)?'':'checked'} onchange="PJ.lFilt('${t.k}')"><i style="background:${t.c}"></i><span>${t.n}</span><em>${counts(t.k)}</em></label>`).join('')}</div>
      <div class="water pj-probs"><span class="pj-h2">Open problems</span><span class="s">problems with no fix logged yet</span>
        ${open.length?open.map(l=>`<button class="row-i" onclick="PJ.jump('${l.id}')">${esc(l.title||l.body.slice(0,70))}</button>`).join(''):'<span class="s" style="color:#cfe2dd;padding-top:6px">None. Nice.</span>'}</div>
      <div class="pcard"><span class="pj-h2">Decisions</span><span class="pj-sub">why things are the way they are</span>
        ${dec.length?dec.map(l=>`<button class="row-i" onclick="PJ.jump('${l.id}')">${esc(l.title||l.body.slice(0,70))} <span>· ${fD(dayKey(l.at))}</span></button>`).join(''):'<span class="pj-empty">Log a Decision and it’s listed here.</span>'}</div>
    </aside></div>`;
}
function entryHTML(p,l){
  const t=LT(l.type), c=l.cardId&&card(p,l.cardId), fx=l.fixes&&p.logs.find(x=>x.id===l.fixes);
  return `<article class="pj-entry${l.solved?' solved':''}" id="pj-e-${l.id}">
    <div class="eh">${chip(t.n,t.c)}${l.title?`<span class="t">${esc(l.title)}</span>`:''}
      ${l.type==='problem'?(l.solved?`<span class="pj-chip" style="color:#2f7a74;background:#2f7a741a">Solved</span>`:''):''}
      <span class="w">${hm(l.at)}${+l.mins?' · '+mins(l.mins):''}</span></div>
    ${l.body?`<p class="bd">${esc(l.body)}</p>`:''}
    ${l.imgs.length?`<div class="pj-pics">${l.imgs.map(id=>picHTML(id)).join('')}</div>`:''}
    <div class="ea">
      ${c?`<button class="pj-pill" style="cursor:pointer" onclick="PJ.card('${c.id}')">Card · ${esc(c.title.slice(0,50))}</button>`:''}
      ${fx?`<button class="pj-pill" style="cursor:pointer" onclick="PJ.jump('${fx.id}')">Fixes · ${esc((fx.title||fx.body).slice(0,50))}</button>`:''}
      <span style="margin-left:auto"></span>
      ${l.type==='problem'?`<button class="xs ghost" onclick="PJ.solve('${l.id}')">${l.solved?'Reopen':'Mark solved'}</button>`:''}
      <button class="xs ghost" onclick="PJ.editLog('${l.id}')">Edit</button></div>
  </article>`;
}
function readLog(){
  const d=S.ld; if(!d) return;
  const v=id=>{ const e=$(id); return e?e.value:null; };
  if(v('pj-lt')!=null) d.title=v('pj-lt'); if(v('pj-lb')!=null) d.body=v('pj-lb');
  if(v('pj-lc')!=null) d.cardId=v('pj-lc'); if(v('pj-lm')!=null) d.mins=v('pj-lm');
  d.fixes=v('pj-lf')||'';
}
function bindCompose(){
  ['pj-lt','pj-lb'].forEach(id=>{ const e=$(id); if(e) e.onkeydown=ev=>{ if(ev.key==='Enter'&&(ev.ctrlKey||ev.metaKey)){ ev.preventDefault(); logIt(); } }; });
}
function logIt(){
  readLog();
  const p=proj(S.sel), d=S.ld; if(!p||!d) return;
  if(!d.title.trim()&&!d.body.trim()&&!d.imgs.length){ toast('Write something (or add a picture) before logging it.'); return; }
  const l={id:uid(),at:Date.now(),type:d.type,title:d.title.trim(),body:d.body.trim(),imgs:d.imgs.slice(),
    cardId:d.cardId||'',mins:d.mins===''?'':Math.max(0,+d.mins||0),fixes:d.fixes||''};
  if(l.type==='problem') l.solved=false;
  p.logs.push(l);
  if(l.fixes){ const pr=p.logs.find(x=>x.id===l.fixes); if(pr) pr.solved=true; }
  S.ld={p:p.id,...blankDraft()};
  touch(p); paint(); toast('Logged.');
}

/* ── overview ── */
function overviewHTML(p){
  const pr=progress(p), tot=p.cards.length||1;
  const nonDone=p.cols.filter(c=>!c.done), shades=['#ec7a45','#7fc79a','#d69a2e','#4f86b3','#715c95','#b0524a'];
  const segs=[[doneCol(p).name,p.cards.filter(c=>isDone(p,c)).length,'#2f7a74'],
    ...nonDone.slice().reverse().map((c,i)=>[c.name,p.cards.filter(k=>k.col===c.id).length,shades[i%shades.length]])];
  const logged=p.logs.reduce((n,l)=>n+(+l.mins||0),0);
  const cost=p.parts.reduce((n,x)=>n+(+x.qty||0)*(+x.cost||0),0), toOrder=p.parts.filter(x=>x.st==='need').length;
  const nm=nextMile(p);
  const miles=p.miles.slice().sort((a,b)=>(a.date||'9999').localeCompare(b.date||'9999'));
  const pics=picsOf(p);
  const rd=p.reqs.filter(r=>r.done).length;
  return `<div class="pj-ov"><div>
    <section class="pcard"><div class="pcard-h"><span class="pj-h2">The goal</span><button class="pbtn sm" onclick="PJ.editProj()">Edit</button></div>
      ${p.goal?`<p class="pj-goal">${esc(p.goal)}</p>`:`<p class="pj-empty">What does finished look like? Add a goal in Edit.</p>`}
      <div class="pcard-h" style="margin-top:6px"><span class="lbl" style="margin:0">Requirements</span><span class="pj-sub">${p.reqs.length?`${rd} of ${p.reqs.length} met`:''}</span></div>
      ${p.reqs.map(r=>`<label class="pj-ck${r.done?' done':''}"><input type="checkbox" ${r.done?'checked':''} onchange="PJ.req('${r.id}')"><span>${esc(r.t)}</span>
        <button class="pj-x" aria-label="Remove requirement" onclick="event.preventDefault();PJ.reqDel('${r.id}')">×</button></label>`).join('')}
      <input id="pj-rq" placeholder="Add a requirement, e.g. “runs 20 min on one charge” (Enter)" onkeydown="if(event.key==='Enter')PJ.reqAdd(this)"></section>

    <section class="pcard"><div class="pcard-h"><span class="pj-h2">Parts</span><span class="pj-sub">${p.parts.length?`${money(cost)} in all${toOrder?` · ${toOrder} still to order`:''}`:'a bill of materials'}</span></div>
      ${p.parts.length?`<table class="pj-tbl"><thead><tr><th>Part</th><th class="r">Qty</th><th class="r">Each</th><th class="r">Total</th><th>Status</th></tr></thead><tbody>
        ${p.parts.map(x=>{ const s=PART_ST.find(z=>z.k===x.st)||PART_ST[0]; return `<tr class="clk" onclick="PJ.part('${x.id}')"><td>${esc(x.name)}${x.link?' ↗':''}</td><td class="r">${+x.qty||0}</td><td class="r">${x.cost!==''&&x.cost!=null?money(+x.cost||0):'—'}</td><td class="r">${money((+x.qty||0)*(+x.cost||0))}</td>
          <td><button class="pj-chip pj-stchip" style="color:${s.c};background:${s.c}1a" title="Click to change" onclick="event.stopPropagation();PJ.partSt('${x.id}')">${s.n}</button></td></tr>`; }).join('')}</tbody></table>`:''}
      <button class="pj-link" onclick="PJ.part()">+ Add a part</button></section>

    <section class="pcard"><div class="pcard-h"><span class="pj-h2">Gallery</span><span class="pj-sub">${pics.length} picture${pics.length===1?'':'s'}</span></div>
      ${pics.length?`<div class="pj-gal">${pics.slice(-8).reverse().map(x=>`<figure>${picHTML(x.id)}<figcaption>${esc(x.cap||'')}</figcaption></figure>`).join('')}</div>`
        :`<p class="pj-empty">Photos of the build, sketches, scope captures, screenshots: add them here, to cards or to log entries.</p>`}
      <div class="row" style="gap:8px"><button class="pbtn sm" onclick="PJ.upload()">Add pictures</button>${pics.length?`<button class="pbtn sm" onclick="PJ.view('gallery')">See all</button>`:''}</div></section>
  </div><div>
    <section class="pcard"><span class="pj-h2">Progress</span>
      <div style="display:flex;align-items:baseline;gap:8px"><span style="font:400 40px/1 var(--serif)">${pr.pct}%</span><span class="pj-sub">${pr.d} of ${pr.n} cards in ${esc(doneCol(p).name)}</span></div>
      <div class="pj-stack">${segs.filter(s=>s[1]).map(s=>`<i style="width:${s[1]/tot*100}%;background:${s[2]}" title="${q(s[0])}: ${s[1]}"></i>`).join('')}</div>
      <div class="pj-leg">${segs.filter(s=>s[1]).map(s=>`<span><i style="background:${s[2]}"></i>${esc(s[0])} ${s[1]}</span>`).join('')}</div>
      <div class="pj-sub" style="border-top:1px solid var(--line2);padding-top:10px;line-height:1.5">${logged?mins(logged)+' logged · ':''}${p.logs.length} log entr${p.logs.length===1?'y':'ies'}${p.start?` · started ${fD(p.start)}`:''}</div></section>

    <section class="pcard"><span class="pj-h2">Milestones</span>
      ${miles.length?miles.map(m=>`<div class="pj-mile${m.done?' done':''}"><button class="dt${m.done?' done':nm&&nm.id===m.id?' next':''}" aria-label="${m.done?'Mark not done':'Mark done'}" onclick="PJ.mile('${m.id}')"></button>
        <div class="tx"><b>${esc(m.name)}</b><span>${m.date?fD(m.date)+(m.done?'':dTo(m.date)<0?' · late':dTo(m.date)===0?' · today':` · in ${dTo(m.date)} days`):'no date'}</span></div>
        <button class="pj-x" aria-label="Remove milestone" onclick="PJ.mileDel('${m.id}')">×</button></div>`).join(''):`<p class="pj-empty">The checkpoints between here and done.</p>`}
      <div class="pj-inl"><input id="pj-mn" placeholder="New milestone" onkeydown="if(event.key==='Enter')PJ.mileAdd()"><input id="pj-md" type="date"><button class="sm" onclick="PJ.mileAdd()">Add</button></div></section>

    <section class="pcard"><span class="pj-h2">Links</span>
      ${p.links.map(x=>{ const u=safeUrl(x.url); return `<div class="pj-lnk">${u?`<a href="${q(u)}" target="_blank" rel="noopener noreferrer">${esc(x.label||x.url)}</a>`:`<span>${esc(x.label||x.url)}</span>`}<button class="pj-x" aria-label="Remove link" onclick="PJ.linkDel('${x.id}')">×</button></div>`; }).join('')
        ||'<p class="pj-empty">Repo, CAD, datasheets, docs.</p>'}
      <div class="pj-inl"><input id="pj-ll" placeholder="Label"><input id="pj-lu" placeholder="https://…" onkeydown="if(event.key==='Enter')PJ.linkAdd()"><button class="sm" onclick="PJ.linkAdd()">Add</button></div></section>
  </div></div>`;
}

/* ── gallery ── */
function galleryHTML(p){
  const pics=picsOf(p), F=[['all','All'],['upload','Uploads'],['log','From the log'],['card','From cards'],['cover','Cover']];
  const list=pics.filter(x=>S.gal==='all'||x.src===S.gal).slice().reverse();
  return `<div class="pj-tool"><div class="co-filt">${F.map(([k,n])=>`<button class="${S.gal===k?'on':''}" onclick="PJ.gal('${k}')">${n} ${k==='all'?pics.length:pics.filter(x=>x.src===k).length}</button>`).join('')}</div>
    <span style="margin-left:auto"></span><button class="pbtn go" onclick="PJ.upload()">Add pictures</button></div>
    ${list.length?`<div class="pj-gal big">${list.map(x=>`<figure>${picHTML(x.id,{click:`PJ.zoom('${x.id}','${x.src}','${x.ref||''}')`})}
      <figcaption>${esc(x.cap||(x.src==='upload'?'No caption':''))}</figcaption></figure>`).join('')}</div>`
      :`<div class="pcard"><span class="pj-h2">No pictures yet</span><p class="pj-empty" style="margin-top:8px">Add photos here, or attach them to a card or a log entry. They all collect in this gallery.</p></div>`}`;
}
function zoom(id,src,ref){
  const p=proj(S.sel), u=imgUrl(id); if(!u){ toast('That picture isn’t on this device.'); return; }
  const ph=p&&src==='upload'?p.photos.find(x=>x.id===ref):null;
  const lg=p&&src==='log'?p.logs.find(x=>x.id===ref):null;
  const cd=p&&src==='card'?card(p,ref):null;
  modal(`<div class="pj-lb">
    <div class="pcard-h"><span class="pj-h2">${esc(ph?(ph.cap||'Picture'):lg?(lg.title||LT(lg.type).n):cd?cd.title:'Picture')}</span><button class="iconbtn" aria-label="Close" onclick="closeModal()">✕</button></div>
    <img src="${u}" alt="">
    ${ph?`<div class="pj-inl"><input id="pj-cap" placeholder="Caption" value="${q(ph.cap||'')}" onkeydown="if(event.key==='Enter')PJ.capSave('${ph.id}')">
      <button class="sm" onclick="PJ.capSave('${ph.id}')">Save caption</button><button class="sm danger" onclick="PJ.photoDel('${ph.id}')">Delete</button></div>`:''}
    ${lg?`<div class="row" style="gap:8px"><span class="pj-sub">From the log, ${fD(dayKey(lg.at))}</span><button class="sm ghost" onclick="PJ.toLog('${lg.id}')">Open the entry</button></div>`:''}
    ${cd?`<div class="row" style="gap:8px"><span class="pj-sub">On a card</span><button class="sm ghost" onclick="PJ.card('${cd.id}')">Open the card</button></div>`:''}
    <div class="row" style="gap:8px"><a href="${u}" download="${q((p?p.name:'project')+'-'+id)}.jpg" class="pj-sub">Save a copy</a></div>
  </div>`,true);
}

/* ═══════════ project dialogs ═══════════ */
const TPL_ICON={
  hardware:'<path d="M8 4v3M12 4v3M16 4v3M8 17v3M12 17v3M16 17v3M4 8h3M4 12h3M4 16h3M17 8h3M17 12h3M17 16h3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.7"/>',
  software:'<path d="M9 8l-4 4 4 4M15 8l4 4-4 4M13.5 6l-3 12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
  research:'<path d="M10 4h4M11 4v5.5L6.2 17.6A1.6 1.6 0 0 0 7.6 20h8.8a1.6 1.6 0 0 0 1.4-2.4L13 9.5V4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M8.5 14.5h7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  blank:'<rect x="5" y="4" width="14" height="16" rx="2.5" stroke="currentColor" stroke-width="1.7"/><path d="M12 9v6M9 12h6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'};
/* pond water, with the project's colour as a glow in it */
function waterBg(c){ return `radial-gradient(ellipse at 74% 38%,${c}b3 0%,${c}00 58%),radial-gradient(ellipse at 60% 45%,#2a7d78 0%,#1a5c60 45%,#0f3b41 100%)`; }
function bandBg(d){ return d.cover&&imgUrl(d.cover)?bg(d.cover)
  :`background:${waterBg(d.color)}`; }
function tplLabels(k){ const t=TEMPLATES[k]||TEMPLATES.blank;
  return t.labels.length?t.labels.map((n,i)=>`<span class="pj-chip" style="color:${LABEL_INK[i%LABEL_INK.length]};background:${LABEL_INK[i%LABEL_INK.length]}1a">${esc(n)}</span>`).join('')
    :'<span class="pj-sub">No labels. Add your own from the board.</span>'; }
function projForm(p,isNew){
  const d=S.pf, photo=!!(d.cover&&imgUrl(d.cover));
  modal(`<div class="pj-nm">
    <div class="pj-band${photo?' photo':''}" id="pj-band" style="${bandBg(d)}"${photo?'':` data-pond="new-${d.id||'x'}" data-n="2"`}>
      ${photo?'':pondBits}
      <button class="pj-bx" aria-label="Close" onclick="closeModal()">✕</button>
      ${isNew?'':`<div class="pj-bcov">${photo?`<button onclick="PJ.pfCover(true)">Change cover</button><button onclick="PJ.pfCover(null)">Remove</button>`:`<button onclick="PJ.pfCover(true)">+ Cover photo</button>`}</div>`}
      <div class="pj-band-in">
        <span class="k">${isNew?'A new project':'Edit project'}</span>
        <input id="pj-pn" class="pj-name" placeholder="Name your project" value="${q(d.name)}" autocomplete="off" onkeydown="if(event.key==='Enter')PJ.saveProj()">
      </div>
    </div>
    ${isNew?`<div class="pj-fs"><span class="lbl">Start from</span>
      <div class="pj-tpl">${Object.keys(TEMPLATES).map(k=>`<button type="button" data-tpl="${k}" class="${d.tpl===k?'on':''}" onclick="PJ.pfTpl('${k}')">
        <span class="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none">${TPL_ICON[k]}</svg></span>
        <b>${TEMPLATES[k].n}</b><span class="d">${TEMPLATES[k].d}</span></button>`).join('')}</div>
      <div class="pj-tplabs" id="pj-tplabs"><span class="pj-sub">Board labels</span>${tplLabels(d.tpl)}</div></div>`:''}
    <label class="pj-fs"><span class="lbl">The goal</span><textarea id="pj-pg" rows="2" placeholder="What does finished look like? e.g. “Follows a line at 0.5 m/s on its own PCB.”">${esc(d.goal)}</textarea></label>
    <div class="pj-f3">
      <label class="pj-fs"><span class="lbl">Kind</span><input id="pj-pk" placeholder="Electrical · firmware" value="${q(d.kind)}"></label>
      <label class="pj-fs"><span class="lbl">Started</span><input id="pj-pa" type="date" value="${q(d.start)}"></label>
      <label class="pj-fs"><span class="lbl">Due <i>optional</i></span><input id="pj-pd" type="date" value="${q(d.due)}"></label>
    </div>
    <div class="pj-f2b">
      <div class="pj-fs"><span class="lbl">Colour</span><div class="pj-sws">${COLORS.map(c=>`<button type="button" class="pj-sw${d.color===c?' on':''}" data-c="${c}" style="background:${c}" aria-label="Colour ${c}" onclick="PJ.pfColor('${c}')"></button>`).join('')}</div></div>
      ${isNew?'':`<div class="pj-fs"><span class="lbl">Status</span><div class="co-filt pj-stat">${Object.keys(STATUS).map(k=>`<button type="button" data-st="${k}" class="${d.status===k?'on':''}" onclick="PJ.pfStatus('${k}')">${STATUS[k]}</button>`).join('')}</div></div>`}
    </div>
    <div class="pj-foot">${isNew?'<span class="pj-sub">You can change any of this later.</span>':`<button class="sm danger" onclick="PJ.delProj()">Delete project</button>`}
      <span class="sp"></span><button class="pbtn" onclick="closeModal()">Cancel</button>
      <button class="pbtn go" onclick="PJ.saveProj()">${isNew?'Create project':'Save changes'}</button></div></div>`,true);
  fillPonds();
  const n=$('pj-pn'); if(n&&isNew) n.focus();
}
function readPF(){
  const d=S.pf; if(!d) return; const v=id=>{ const e=$(id); return e?e.value:null; };
  ['pn:name','pg:goal','pk:kind','ps:status','pa:start','pd:due'].forEach(s=>{ const [id,k]=s.split(':'); const x=v('pj-'+id); if(x!=null) d[k]=x; });
}

/* ═══════════ columns + labels dialogs ═══════════ */
function colsDialog(){
  const p=proj(S.sel); if(!p) return;
  S.cd=p.cols.map(c=>({...c}));
  modal(`<div class="pj-m narrow" id="pj-cols"></div>`,true); paintCols();
}
function paintCols(){
  const p=proj(S.sel), el=$('pj-cols'); if(!p||!el) return;
  el.innerHTML=`<div class="hd"><div><div class="pj-eyebrow">${esc(p.name)}</div><div class="pj-h2" style="margin-top:8px">Board columns</div></div>
      <button class="iconbtn" aria-label="Close" onclick="closeModal()">✕</button></div>
    <p class="pj-sub" style="margin:0;line-height:1.5">A limit flags a column holding too much at once. The pond column is where finished cards go, and it counts as done.</p>
    ${S.cd.map((c,i)=>{ const n=p.cards.filter(k=>k.col===c.id).length; return `<div class="pj-inl">
      <input value="${q(c.name)}" aria-label="Column name" oninput="PJ.cdSet(${i},'name',this.value)">
      <input type="number" min="0" style="width:84px;flex:none" value="${c.limit||''}" placeholder="limit" aria-label="Card limit" oninput="PJ.cdSet(${i},'limit',this.value)">
      <label class="pj-sub" style="display:flex;gap:5px;align-items:center;white-space:nowrap"><input type="radio" name="pj-dn" ${c.done?'checked':''} onchange="PJ.cdDone(${i})">pond</label>
      <button class="iconbtn" aria-label="Move up" ${i?'':'disabled'} onclick="PJ.cdMove(${i},-1)">↑</button>
      <button class="iconbtn" aria-label="Move down" ${i<S.cd.length-1?'':'disabled'} onclick="PJ.cdMove(${i},1)">↓</button>
      <button class="iconbtn" aria-label="Remove column" ${n||S.cd.length<2?`disabled title="${n?'Move its '+n+' card'+(n===1?'':'s')+' out first':'A board needs a column'}"`:''} onclick="PJ.cdDel(${i})">✕</button></div>`; }).join('')}
    <button class="pj-link" onclick="PJ.cdAdd()">+ Add a column</button>
    <div class="pj-foot"><span class="sp"></span><button class="pbtn" onclick="closeModal()">Cancel</button><button class="pbtn go" onclick="PJ.cdSave()">Save</button></div>`;
}
function labelsDialog(){
  const p=proj(S.sel); if(!p) return;
  S.ldl=p.labels.map(l=>({...l}));
  modal(`<div class="pj-m narrow" id="pj-labs"></div>`,true); paintLabels();
}
function paintLabels(){
  const p=proj(S.sel), el=$('pj-labs'); if(!p||!el) return;
  el.innerHTML=`<div class="hd"><div><div class="pj-eyebrow">${esc(p.name)}</div><div class="pj-h2" style="margin-top:8px">Labels</div></div>
      <button class="iconbtn" aria-label="Close" onclick="closeModal()">✕</button></div>
    ${S.ldl.map((l,i)=>`<div class="pj-inl">
      <div style="display:flex;gap:4px;flex:none">${LABEL_INK.map(c=>`<button class="pj-sw${l.c===c?' on':''}" style="background:${c};width:20px;height:20px;border-width:2px" aria-label="Colour" onclick="PJ.ldSet(${i},'c','${c}')"></button>`).join('')}</div>
      <input value="${q(l.name)}" aria-label="Label name" oninput="PJ.ldSet(${i},'name',this.value,true)">
      <button class="iconbtn" aria-label="Remove label" onclick="PJ.ldDel(${i})">✕</button></div>`).join('')||'<p class="pj-empty">No labels yet.</p>'}
    <button class="pj-link" onclick="PJ.ldAdd()">+ Add a label</button>
    <div class="pj-foot"><span class="sp"></span><button class="pbtn" onclick="closeModal()">Cancel</button><button class="pbtn go" onclick="PJ.ldSave()">Save</button></div>`;
}

/* ═══════════ part + log-edit dialogs ═══════════ */
function partDialog(id){
  const p=proj(S.sel); if(!p) return; const x=id?p.parts.find(z=>z.id===id):null;
  modal(`<div class="pj-m narrow">
    <div class="hd"><div><div class="pj-eyebrow">${esc(p.name)} · parts</div><input id="pj-xn" class="ttl" placeholder="Part name" value="${q(x?x.name:'')}"></div>
      <button class="iconbtn" aria-label="Close" onclick="closeModal()">✕</button></div>
    <div class="pj-f2">
      <label><span class="lbl">Quantity</span><input id="pj-xq" type="number" min="0" value="${x?q(x.qty):1}"></label>
      <label><span class="lbl">Cost each ($)</span><input id="pj-xc" type="number" min="0" step="0.01" value="${x?q(x.cost):''}"></label>
      <label><span class="lbl">Status</span><select id="pj-xs">${PART_ST.map(s=>`<option value="${s.k}"${(x?x.st:'need')===s.k?' selected':''}>${s.n}</option>`).join('')}</select></label>
      <label><span class="lbl">Link</span><input id="pj-xl" placeholder="supplier or datasheet" value="${q(x?x.link||'':'')}"></label>
    </div>
    ${x&&safeUrl(x.link)?`<a href="${q(safeUrl(x.link))}" target="_blank" rel="noopener noreferrer" class="pj-sub">Open link ↗</a>`:''}
    <div class="pj-foot">${x?`<button class="sm danger" onclick="PJ.partDel('${x.id}')">Delete</button>`:''}<span class="sp"></span>
      <button class="pbtn" onclick="closeModal()">Cancel</button><button class="pbtn go" onclick="PJ.partSave('${x?x.id:''}')">Save</button></div></div>`,true);
  if(!x) $('pj-xn').focus();
}
function logDialog(id){
  const p=proj(S.sel); if(!p) return; const l=p.logs.find(x=>x.id===id); if(!l) return;
  S.le={id,type:l.type,imgs:l.imgs.slice()};
  modal(`<div class="pj-m" id="pj-le"></div>`,true); paintLogDialog();
}
function paintLogDialog(){
  const p=proj(S.sel), el=$('pj-le'), d=S.le; if(!p||!el||!d) return;
  const l=p.logs.find(x=>x.id===d.id); if(!l) return;
  const keep=id=>{ const e=$(id); return e?e.value:null; };
  const title=keep('pj-et')??l.title, body=keep('pj-eb')??l.body, m=keep('pj-em')??l.mins, cd=keep('pj-ec')??l.cardId;
  el.innerHTML=`<div class="hd"><div><div class="pj-eyebrow">${esc(p.name)} · ${dayTitle(dayKey(l.at))}, ${hm(l.at)}</div><div class="pj-h2" style="margin-top:8px">Edit log entry</div></div>
      <button class="iconbtn" aria-label="Close" onclick="closeModal()">✕</button></div>
    <div class="pj-types">${LOG_TYPES.map(t=>`<button class="pj-type" style="${d.type===t.k?`border-color:${t.c};background:${t.c}1a;color:${t.c}`:''}" onclick="PJ.leType('${t.k}')">${t.n}</button>`).join('')}</div>
    <input id="pj-et" placeholder="Title (optional)" value="${q(title)}">
    <textarea id="pj-eb">${esc(body)}</textarea>
    <div class="pj-pics">${d.imgs.map((id,i)=>picHTML(id,{del:`PJ.leDelImg(${i})`})).join('')}<button class="pj-pic add" aria-label="Add pictures" onclick="PJ.leAddImg()">+</button></div>
    <div class="pj-crow"><select id="pj-ec" aria-label="Linked card"><option value="">No card linked</option>${p.cards.map(c=>`<option value="${c.id}"${cd===c.id?' selected':''}>${esc(c.title.slice(0,60))}</option>`).join('')}</select>
      <label class="pj-sub" style="display:flex;gap:6px;align-items:center">Time <input id="pj-em" class="mins" type="number" min="0" step="5" placeholder="min" value="${q(m)}"></label></div>
    <div class="pj-foot"><button class="sm danger" onclick="PJ.delLog('${l.id}')">Delete entry</button><span class="sp"></span>
      <button class="pbtn" onclick="closeModal()">Cancel</button><button class="pbtn go" onclick="PJ.saveLog()">Save</button></div>`;
}

/* ═══════════ confirm ═══════════ */
function confirmBox(title,text,yes,fn){
  S.cfn=fn;
  modal(`<div class="pj-m narrow"><div class="pj-h2">${esc(title)}</div><p style="margin:0;color:var(--label);line-height:1.55">${esc(text)}</p>
    <div class="pj-foot"><span class="sp"></span><button class="pbtn" onclick="closeModal()">Cancel</button>
    <button class="sm danger" style="padding:11px 16px;border-radius:99px" onclick="PJ._yes()">${esc(yes)}</button></div></div>`);
}

/* ═══════════ public actions ═══════════ */
const cur_=()=>proj(S.sel);
window.PJ={
  go(){ go(); },
  paint(){ paint(); },
  refresh(){ refresh(); },
  home(){ S.sel=null; S.adding=null; paint(); window.scrollTo(0,0); },
  open(id){ S.sel=id; S.view=proj(id)&&proj(id).cards.length?'board':'overview'; S.adding=null; S.label=null; S.q=''; S.pick=null; S.gal='all'; paint(); window.scrollTo(0,0); },
  view(v){ readLog(); S.view=v; S.adding=null; paint(); },
  filt(k){ S.filt=k; paint(); },

  /* new / edit project */
  newProj(){ S.pf={name:'',goal:'',kind:'',status:'active',start:today(),due:'',color:COLORS[all().length%COLORS.length],tpl:'hardware',cover:''}; projForm(null,true); },
  editProj(){ const p=cur_(); if(!p) return; S.pf={name:p.name,goal:p.goal,kind:p.kind,status:p.status,start:p.start,due:p.due,color:p.color,cover:p.cover,id:p.id,coverWas:p.cover}; projForm(p,false); },
  pfTpl(k){ readPF(); S.pf.tpl=k;
    if(!S.pf.kind||Object.values(TEMPLATES).some(t=>t.n===S.pf.kind)){ S.pf.kind=k==='blank'?'':TEMPLATES[k].n; const i=$('pj-pk'); if(i) i.value=S.pf.kind; }
    document.querySelectorAll('.pj-tpl [data-tpl]').forEach(b=>b.classList.toggle('on',b.dataset.tpl===k));
    const l=$('pj-tplabs'); if(l) l.innerHTML='<span class="pj-sub">Board labels</span>'+tplLabels(k); },
  pfColor(c){ S.pf.color=c; document.querySelectorAll('.pj-sws [data-c]').forEach(b=>b.classList.toggle('on',b.dataset.c===c));
    const band=$('pj-band'); if(band&&!band.classList.contains('photo')) band.style.background=waterBg(c); },
  pfStatus(k){ S.pf.status=k; document.querySelectorAll('.pj-stat [data-st]').forEach(b=>b.classList.toggle('on',b.dataset.st===k)); },
  async pfCover(pick){ readPF(); const p=proj(S.pf.id);
    if(pick){ const ids=await pickImages(false,1800); if(!ids.length) return; if(S.pf.cover&&S.pf.cover!==S.pf.coverWas) imgDrop([S.pf.cover]); S.pf.cover=ids[0]; }
    else S.pf.cover='';
    if(S.pf) projForm(p,false); },
  saveProj(){
    readPF(); const d=S.pf; const name=(d.name||'').trim();
    if(!name){ toast('Give the project a name.'); return; }
    if(!d.id){
      const t=TEMPLATES[d.tpl]||TEMPLATES.blank;
      const p=fixProj({id:uid(),name,goal:d.goal.trim(),kind:d.kind.trim(),color:d.color,status:'active',start:d.start,due:d.due,cover:'',
        cols:defaultCols(),labels:t.labels.map((n,i)=>({id:uid(),name:n,c:LABEL_INK[i%LABEL_INK.length]})),
        cards:[],logs:[],photos:[],reqs:[],miles:[],parts:[],links:[],created:Date.now()});
      all().push(p); touch(p); closeModal(); S.pf=null;
      S.filt='active'; S.sel=p.id; S.view='board'; S.pick=null; paint(); window.scrollTo(0,0);
      toast('Project started. Add your first cards.'); return;
    }
    const p=proj(d.id); if(!p){ closeModal(); return; }
    const was=p.status, oldCover=p.cover;
    Object.assign(p,{name,goal:d.goal.trim(),kind:d.kind.trim(),status:d.status,start:d.start,due:d.due,color:d.color,cover:d.cover||''});
    if(p.status==='shipped'&&was!=='shipped') p.shippedAt=Date.now();
    touch(p); S.pf=null; closeModal();
    if(oldCover&&oldCover!==p.cover) imgDrop([oldCover]);
    paint();
    if(p.status==='shipped'&&was!=='shipped') toast(`${p.name} shipped. Nicely done.`);
  },
  delProj(){ const p=proj(S.pf&&S.pf.id); if(!p) return;
    if(S.pf.cover&&S.pf.cover!==S.pf.coverWas) imgDrop([S.pf.cover]);
    confirmBox('Delete this project?',`“${p.name}” and its ${p.cards.length} cards, ${p.logs.length} log entries and ${picsOf(p).length} pictures will be gone for good. If it’s finished, mark it Shipped instead to keep it.`,'Delete project',()=>{
      const ids=picsOf(p).map(x=>x.id); db.projects=all().filter(x=>x.id!==p.id); save(); S.sel=null; imgDrop(ids); paint(); toast('Project deleted.'); }); },
  _yes(){ const f=S.cfn; S.cfn=null; closeModal(); if(f) f(); },

  /* board */
  search(v){ S.q=v; const el=$('pj-board'), p=cur_(); if(!el||!p) return;
    const pos=$('pj-q').selectionStart; paint(); const i=$('pj-q'); if(i){ i.focus(); try{ i.setSelectionRange(pos,pos); }catch(e){} } },
  labelFilter(id){ S.label=S.label===id?null:id; paint(); },
  pickCol(id){ S.pick=id; paint(); },
  addStart(colId){ S.adding=colId; S.pick=colId; paint(); },
  addStop(){ S.adding=null; paint(); },
  addKey(e,colId){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); PJ.addCard(colId); } else if(e.key==='Escape'){ e.stopPropagation(); PJ.addStop(); } },
  addCard(colId){ const p=cur_(), t=$('pj-addt'); if(!p||!t) return; const title=t.value.trim(); if(!title){ t.focus(); return; }
    const col=colOf(p,colId);
    p.cards.push({id:uid(),title,col:colId,labels:S.label?[S.label]:[],prio:0,due:'',est:'',notes:'',checks:[],imgs:[],created:Date.now(),doneAt:col&&col.done?Date.now():null});
    touch(p); paint(); },
  move(cid,colId){ const p=cur_(); if(!p) return; const c=card(p,cid); if(!c) return; moveCard(p,c,colId); paint(); },
  card(id){ openCard(id); },
  dragStart(e,id){ S.dragId=id; try{ e.dataTransfer.setData('text/plain',id); e.dataTransfer.effectAllowed='move'; }catch(_){}
    setTimeout(()=>{ const el=document.querySelector(`.pj-k[data-id="${id}"]`); if(el) el.classList.add('dragging'); },0); },
  dragEnd(){ S.dragId=null; document.querySelectorAll('.pj-drop').forEach(x=>x.remove()); document.querySelectorAll('.pj-k.dragging').forEach(x=>x.classList.remove('dragging')); },
  dragOver(e,colId){
    if(!S.dragId) return; e.preventDefault(); try{ e.dataTransfer.dropEffect='move'; }catch(_){}
    const zone=e.currentTarget, ks=[...zone.querySelectorAll('.pj-k:not(.dragging)')];
    const before=ks.find(k=>{ const r=k.getBoundingClientRect(); return e.clientY<r.top+r.height/2; });
    let ph=document.querySelector('.pj-drop'); if(!ph){ ph=document.createElement('div'); ph.className='pj-drop'; }
    ph.dataset.before=before?before.dataset.id:''; ph.dataset.col=colId;
    if(before) zone.insertBefore(ph,before); else zone.appendChild(ph);
  },
  dragLeave(e){ const z=e.currentTarget; if(!z.contains(e.relatedTarget)){ const ph=z.querySelector('.pj-drop'); if(ph) ph.remove(); } },
  drop(e,colId){
    e.preventDefault(); const p=cur_(), id=S.dragId; const ph=document.querySelector('.pj-drop');
    const before=ph&&ph.dataset.col===colId?ph.dataset.before:'';
    PJ.dragEnd(); if(!p||!id) return; const c=card(p,id); if(!c) return;
    if(before===c.id) return;
    moveCard(p,c,colId,before||null); paint();
  },

  /* card dialog */
  saveCard(){ saveCard(); },
  cTogLabel(id){ readCard(); const L=S.draft.labels; const i=L.indexOf(id); i<0?L.push(id):L.splice(i,1); paintCard(); },
  cNewLabel(){ readCard(); const n=prompt('Name the new label'); if(!n||!n.trim()) return; const p=cur_();
    const l={id:uid(),name:n.trim().slice(0,30),c:LABEL_INK[p.labels.length%LABEL_INK.length]}; p.labels.push(l); touch(p); S.draft.labels.push(l.id); paintCard(); },
  cCheck(i){ readCard(); const x=S.draft.checks[i]; if(x) x.done=!x.done; paintCard(); },
  cUncheck(i){ readCard(); S.draft.checks.splice(i,1); paintCard(); },
  cAddStep(){ readCard(); const e=$('pj-cs'); const t=e&&e.value.trim(); if(!t) return; S.draft.checks.push({id:uid(),t,done:false}); paintCard(); const n=$('pj-cs'); if(n) n.focus(); },
  async cAddImg(){ readCard(); const ids=await pickImages(true); if(!S.draft) { imgDrop(ids); return; } S.draft.imgs.push(...ids); S.draft.added.push(...ids); paintCard(); },
  cDelImg(i){ readCard(); const [id]=S.draft.imgs.splice(i,1); if(S.draft.added.includes(id)) imgDrop([id]); paintCard(); },
  delCard(){ const p=cur_(), d=S.draft; if(!p||!d) return; const c=card(p,d.id); if(!c) return;
    confirmBox('Delete this card?',`“${c.title}” goes, with its checklist and pictures. Log entries that mention it stay.`,'Delete card',()=>{
      const ids=c.imgs.concat(d.imgs); p.cards=p.cards.filter(x=>x.id!==c.id); touch(p); S.draft=null; imgDrop(ids); paint(); }); },
  cardToLog(){ const c=saveCard(); if(!c) return; const p=cur_();
    S.ld={p:p.id,...blankDraft(),cardId:c.id,type:'note'}; S.view='log'; paint();
    const b=$('pj-lb'); if(b){ b.focus(); b.scrollIntoView({block:'center'}); } },

  /* log */
  lType(k){ readLog(); S.ld.type=k; paint(); const b=$('pj-lb'); if(b) b.focus(); },
  lFilt(k){ readLog(); S.hide.has(k)?S.hide.delete(k):S.hide.add(k); paint(); },
  async lAddImg(){ readLog(); const ids=await pickImages(true); if(S.ld){ S.ld.imgs.push(...ids); paint(); } },
  lDelImg(i){ readLog(); const [id]=S.ld.imgs.splice(i,1); imgDrop([id]); paint(); },
  logIt(){ logIt(); },
  solve(id){ readLog(); const p=cur_(), l=p&&p.logs.find(x=>x.id===id); if(!l) return; l.solved=!l.solved; touch(p); paint(); },
  jump(id){ readLog(); S.hide.clear(); paint(); const el=$('pj-e-'+id); if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.style.boxShadow='0 0 0 3px var(--koi)'; setTimeout(()=>{ el.style.boxShadow=''; },1600); } },
  toLog(id){ closeModal(); S.view='log'; PJ.jump(id); },
  editLog(id){ readLog(); logDialog(id); },
  leType(k){ S.le.type=k; paintLogDialog(); },
  async leAddImg(){ const ids=await pickImages(true); if(S.le){ S.le.imgs.push(...ids); S.le.added=(S.le.added||[]).concat(ids); paintLogDialog(); } },
  leDelImg(i){ S.le.imgs.splice(i,1); paintLogDialog(); },
  saveLog(){ const p=cur_(), d=S.le; if(!p||!d) return; const l=p.logs.find(x=>x.id===d.id); if(!l) return;
    const removed=l.imgs.filter(id=>!d.imgs.includes(id));
    l.type=d.type; l.title=$('pj-et').value.trim(); l.body=$('pj-eb').value.trim(); l.imgs=d.imgs; l.cardId=$('pj-ec').value;
    const m=$('pj-em').value; l.mins=m===''?'':Math.max(0,+m||0);
    if(l.type==='problem'&&l.solved===undefined) l.solved=false;
    touch(p); S.le=null; closeModal(); imgDrop(removed); paint(); },
  delLog(id){ const p=cur_(); const l=p&&p.logs.find(x=>x.id===id); if(!l) return;
    confirmBox('Delete this entry?','The entry and its pictures go for good.','Delete entry',()=>{
      const ids=l.imgs.concat((S.le&&S.le.imgs)||[]); p.logs=p.logs.filter(x=>x.id!==id); touch(p); S.le=null; imgDrop(ids); paint(); }); },

  /* overview */
  req(id){ const p=cur_(), r=p.reqs.find(x=>x.id===id); if(r){ r.done=!r.done; touch(p); paint(); } },
  reqDel(id){ const p=cur_(); p.reqs=p.reqs.filter(x=>x.id!==id); touch(p); paint(); },
  reqAdd(el){ const p=cur_(), t=el.value.trim(); if(!t) return; p.reqs.push({id:uid(),t,done:false}); touch(p); paint(); const n=$('pj-rq'); if(n) n.focus(); },
  part(id){ partDialog(id); },
  partSave(id){ const p=cur_(); const name=$('pj-xn').value.trim(); if(!name){ toast('Name the part.'); return; }
    const o={name,qty:Math.max(0,+$('pj-xq').value||0),cost:$('pj-xc').value===''?'':Math.max(0,+$('pj-xc').value||0),st:$('pj-xs').value,link:$('pj-xl').value.trim()};
    if(id){ const x=p.parts.find(z=>z.id===id); if(x) Object.assign(x,o); } else p.parts.push({id:uid(),...o});
    touch(p); closeModal(); paint(); },
  partSt(id){ const p=cur_(), x=p.parts.find(z=>z.id===id); if(!x) return; const i=PART_ST.findIndex(s=>s.k===x.st); x.st=PART_ST[(i+1)%PART_ST.length].k; touch(p); paint(); },
  partDel(id){ const p=cur_(); p.parts=p.parts.filter(z=>z.id!==id); touch(p); closeModal(); paint(); },
  mile(id){ const p=cur_(), m=p.miles.find(x=>x.id===id); if(!m) return; m.done=!m.done; m.doneAt=m.done?Date.now():null; touch(p); paint(); if(m.done) toast(`Milestone reached: ${m.name}`); },
  mileDel(id){ const p=cur_(); p.miles=p.miles.filter(x=>x.id!==id); touch(p); paint(); },
  mileAdd(){ const p=cur_(), n=$('pj-mn').value.trim(); if(!n){ $('pj-mn').focus(); return; } p.miles.push({id:uid(),name:n,date:$('pj-md').value,done:false}); touch(p); paint(); },
  linkAdd(){ const p=cur_(), u=$('pj-lu').value.trim(), l=$('pj-ll').value.trim(); if(!u){ $('pj-lu').focus(); return; }
    if(!safeUrl(u)){ toast('Links need to be web addresses (http or https).'); return; }
    p.links.push({id:uid(),label:l,url:u}); touch(p); paint(); },
  linkDel(id){ const p=cur_(); p.links=p.links.filter(x=>x.id!==id); touch(p); paint(); },

  /* gallery */
  gal(k){ S.gal=k; paint(); },
  async upload(){ const p=cur_(); if(!p) return; const ids=await pickImages(true); if(!ids.length) return;
    const q2=proj(p.id); if(!q2){ imgDrop(ids); return; }
    ids.forEach(id=>q2.photos.push({id,cap:'',at:Date.now()})); touch(q2); paint(); toast(`${ids.length} picture${ids.length===1?'':'s'} added.`); },
  zoom(id,src,ref){ zoom(id,src,ref); },
  capSave(id){ const p=cur_(), ph=p.photos.find(x=>x.id===id); if(!ph) return; ph.cap=$('pj-cap').value.trim(); touch(p); closeModal(); paint(); },
  photoDel(id){ const p=cur_(); p.photos=p.photos.filter(x=>x.id!==id); touch(p); closeModal(); imgDrop([id]); paint(); },

  /* columns */
  editCols(){ colsDialog(); },
  cdSet(i,k,v){ if(k==='limit') S.cd[i].limit=Math.max(0,parseInt(v,10)||0); else S.cd[i][k]=v; },
  cdDone(i){ S.cd.forEach((c,j)=>{ c.done=j===i; }); },
  cdMove(i,d){ const a=S.cd, j=i+d; if(j<0||j>=a.length) return; [a[i],a[j]]=[a[j],a[i]]; paintCols(); },
  cdDel(i){ S.cd.splice(i,1); if(!S.cd.some(c=>c.done)&&S.cd.length) S.cd[S.cd.length-1].done=true; paintCols(); },
  cdAdd(){ const done=S.cd.findIndex(c=>c.done); const c={id:uid(),name:'New column',limit:0,done:false};
    done<0?S.cd.push(c):S.cd.splice(done,0,c); paintCols(); },
  cdSave(){ const p=cur_(); if(!p) return; const cols=S.cd.map(c=>({...c,name:(c.name||'').trim()||'Untitled'}));
    const keep=new Set(cols.map(c=>c.id)); if(p.cards.some(k=>!keep.has(k.col))){ toast('Move the cards out of a column before removing it.'); return; }
    const was=new Map(p.cols.map(c=>[c.id,c.done]));
    p.cols=cols;
    p.cards.forEach(k=>{ const c=colOf(p,k.col); if(c.done&&!was.get(c.id)&&!k.doneAt) k.doneAt=Date.now(); if(!c.done) k.doneAt=null; });
    touch(p); closeModal(); paint(); },

  /* labels */
  editLabels(){ labelsDialog(); },
  ldSet(i,k,v,quiet){ S.ldl[i][k]=v; if(!quiet) paintLabels(); },
  ldDel(i){ S.ldl.splice(i,1); paintLabels(); },
  ldAdd(){ S.ldl.push({id:uid(),name:'',c:LABEL_INK[S.ldl.length%LABEL_INK.length]}); paintLabels();
    const ins=document.querySelectorAll('#pj-labs .pj-inl input'); if(ins.length) ins[ins.length-1].focus(); },
  ldSave(){ const p=cur_(); if(!p) return; p.labels=S.ldl.filter(l=>(l.name||'').trim()).map(l=>({...l,name:l.name.trim().slice(0,30)}));
    const ok=new Set(p.labels.map(l=>l.id)); p.cards.forEach(c=>{ c.labels=c.labels.filter(id=>ok.has(id)); });
    if(S.label&&!ok.has(S.label)) S.label=null; touch(p); closeModal(); paint(); },
};

/* ── start ── */
watchLeave();
imgInit();
/* another device's changes can arrive through sync while this screen is up */
window.addEventListener('focus',()=>{ const a=document.activeElement; if(a&&a.matches&&a.matches('input,textarea,select')) return; refresh(); });
})();
