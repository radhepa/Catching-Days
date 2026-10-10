/* panel.js · the toad's talk box
   Opens beside the toad when you tap it: the toad says something (what it
   says depends on your day, see pet-lines.js), and three places sit under it:
   Tasks (today's list, the reeds, what's coming), My day (the planner's
   timeline for today) and Focus (start a session, or the one that's running).
   Every change goes to the main process as an op; nothing here touches your
   data directly. */
'use strict';
(async function(){
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const init=await window.pet.init();
let V=init.view, NAME=init.toad, MEM=init.mem||{said:{},recent:[]}, LOGIN=!!init.login, SIZE=init.size;
const NAMES=init.names, TOADS=init.toads, KEEPERS=['hasu','ame','sumi','tabi','hotaru'];
const TITLES={neri:'Keeper of the Kiln',oto:'Keeper of the Reeds',kuri:'Keeper of the Roots',mame:'A Small Child of the Pond'};
/* the portrait crops: the app's own for the keepers (toads.js), close-ups for the companions */
const FACE={hasu:'-38 -88 76 76',ame:'-52 -96 104 104',tabi:'-48 -102 96 96',hotaru:'-36 -72 92 92',sumi:'-44 -86 88 88',
  neri:'-44 -92 88 88',oto:'-46 -90 92 92',kuri:'-44 -90 88 88',mame:'-38 -76 76 76'};
const MIN=60000;

function load(src,base){
  return new Promise(res=>{ const s=document.createElement('script'); s.src=(base||'')+src; s.onload=()=>res(true); s.onerror=()=>res(false); document.head.appendChild(s); });
}
await load('pet-lines.js');
for(const f of ['toad-art.js','toads-design/toad-art-cast.js','toad-companions.js']) await load(f,init.artBase);
try{ window.ToadArt.injectCSS(); window.ToadArt.injectCastCSS&&window.ToadArt.injectCastCSS(); window.ToadCompanions&&window.ToadCompanions.injectCSS(); }catch(e){}

const art=(name,size)=>{
  try{
    if(KEEPERS.includes(name)) return window.ToadArt.svg(name,{size,perch:'none',water:false});
    if(window.ToadCompanions&&window.ToadCompanions.has(name)) return window.ToadCompanions.svg(name,{size});
  }catch(e){}
  return '';
};
const titleOf=n=>KEEPERS.includes(n)&&window.ToadArt&&window.ToadArt.TOADS[n]?window.ToadArt.TOADS[n].title:TITLES[n]||'';
const shortTitle=n=>n==='mame'?'Child of the Pond':titleOf(n).replace(/^Keeper of the /,'');
function paintWho(){
  const pt=$('pt'); pt.innerHTML=art(NAME,52);
  const svg=pt.querySelector('svg'); if(svg&&FACE[NAME]) svg.setAttribute('viewBox',FACE[NAME]);
  $('who-n').textContent=NAMES[NAME]||NAME;
  $('who-t').textContent=titleOf(NAME);
}

/* ════════════════ what the toad says ════════════════ */
const short=(x,n)=>{ x=String(x||''); return x.length>n?x.slice(0,n-1).trimEnd()+'…':x; };
const lines=()=>(window.PET_LINES&&window.PET_LINES[NAME])||null;
let peeking=false;
function state(){
  const s=V.session, ex=V.exams[0]||null;
  return {hr:V.hr,total:V.counts.total,done:V.counts.done,left:V.counts.left,overdue:V.counts.overdue,
    running:!!s,phase:s?s.phase:null,paused:!!(s&&s.paused),cycles:s?s.cycles.length:0,mins:V.mins,goal:V.settings.goal,
    next:V.day.next,now:V.day.now,exam:ex?{title:ex.title,days:ex.days}:null,peeking};
}
function saveMem(){ window.pet.send('mem',{said:MEM.said,recent:MEM.recent}); }
(function prune(){ const keep={}; Object.keys(MEM.said||{}).forEach(k=>{ if(k.includes(V&&V.today)) keep[k]=1; }); MEM.said=keep; MEM.recent=(MEM.recent||[]).slice(-12); })();
function pick(arr){
  if(!arr||!arr.length) return '';
  const fresh=arr.filter(t=>!MEM.recent.includes(t));
  const t=(fresh.length?fresh:arr)[Math.floor(Math.random()*(fresh.length||arr.length))];
  MEM.recent.push(t); MEM.recent=MEM.recent.slice(-12); saveMem();
  return t;
}
function line(kind,task){
  const l=lines(); if(!l) return '';
  const t=pick(l[kind]);
  return t.replace('{task}',short(task||'that one',24));
}
function chatLine(){
  const l=lines(); if(!l) return '';
  const s=state();
  if(peeking&&Math.random()<.6) return line('peek');
  for(const c of l.ctx||[]){
    try{
      if(!c.when(s)) continue;
      if(c.id==='peek') continue;               // the peek lines above cover it
      const key=NAME+'|'+c.id+'|'+V.today+((c.id==='focus'||c.id==='break')&&V.session?'|'+V.session.id+'|'+s.cycles:'');
      if(MEM.said[key]) continue;
      MEM.said[key]=1; saveMem();
      return c.t(s);
    }catch(e){}
  }
  return line(Math.random()<.45?'hello':'idle');
}
let sayT=null;
function say(text){
  const el=$('say'); clearInterval(sayT);
  const ch=[...String(text||'')];
  el.innerHTML=ch.map(c=>`<span class="off">${esc(c)}</span>`).join('');
  const spans=el.querySelectorAll('span'); let i=0;
  const ms=Math.min(2200,ch.length*16);
  if(ch.length) window.pet.send('react',{kind:'talk',ms});
  sayT=setInterval(()=>{ for(let k=0;k<2&&i<spans.length;k++,i++) spans[i].classList.remove('off'); if(i>=spans.length) clearInterval(sayT); },16);
}
$('say').addEventListener('click',()=>{ clearInterval(sayT); $('say').querySelectorAll('.off').forEach(s=>s.classList.remove('off')); });

/* ════════════════ the places ════════════════ */
let mode='chat';
const CHECK='<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6.2l2.3 2.3L9.6 3.7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function clock(ms){ const n=ms<0; ms=Math.abs(ms); const t=Math.floor(ms/1000), h=Math.floor(t/3600);
  return (n?'+':'')+(h?h+':'+String(Math.floor(t/60)%60).padStart(2,'0'):String(Math.floor(t/60)).padStart(2,'0'))+':'+String(t%60).padStart(2,'0'); }
function dur(ms){ const m=Math.round(Math.abs(ms)/MIN); return m<60?m+'m':Math.floor(m/60)+'h '+String(m%60).padStart(2,'0')+'m'; }
const elapsed=s=>s.paused?(s.pausedAt-s.phaseStart-(s.pausedMs||0)):(Date.now()-s.phaseStart-(s.pausedMs||0));
const fTime=ts=>new Intl.DateTimeFormat('en-US',{timeZone:V.tz,hour:'numeric',minute:'2-digit'}).format(ts);

function paintTabs(){
  const c=V.counts, s=V.session, d=V.day;
  $('tab-tasks').textContent=!c.total&&!c.overdue?'nothing due':c.total&&!c.left?'all caught'+(c.overdue?` · ${c.overdue} late`:''):
    [c.total?`${c.left} left`:'',c.overdue?`${c.overdue} late`:''].filter(Boolean).join(' · ');
  $('tab-day').textContent=d.now?'now: '+d.now.title:d.next?'next '+d.next.at:'clear';
  const ft=document.querySelector('.tabs [data-v="focus"]');
  if(s){ const rem=s.target-elapsed(s);
    $('tab-focus').textContent=s.phase==='rating'?'rate it':s.paused?'paused':(s.phase==='break'?'break ':'')+clock(rem);
    ft.classList.add('live'); }
  else { $('tab-focus').textContent=`${V.settings.focus} min`; ft.classList.remove('live'); }
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v===mode||(b.dataset.v==='focus'&&['rate','end','break-over','setup'].includes(mode))));
}
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
  const v=b.dataset.v;
  /* Focus with nothing running: the toad comes out and asks (stage.js) */
  if(v==='focus'&&!V.session){ window.pet.send('focus-ritual',{}); return; }
  go(mode===v?'chat':v);
}));

function taskRow(r,extra){
  const meta=[r.cls?`<i style="background:${esc(r.color)}"></i>${esc(short(r.cls,22))}`:'',
    r.ann?'reminder':r.done?'released':r.late?`<span class="late">${r.late} day${r.late===1?'':'s'} late</span>`:r.dueLabel&&r.dueLabel!=='Today'?esc(r.dueLabel):'',
    r.est&&!r.done?`est ${r.est}m`:''].filter(Boolean).join(' · ');
  return `<div class="tk${r.done?' done':''}${r.late&&!r.done?' reed':''}${r.ann?' ann':''}" data-id="${esc(r.id)}">
    <button class="ck" title="${r.done?'Untick':'Finish it'}" aria-label="${r.done?'Untick':'Finish'} ${esc(r.title)}">${CHECK}</button>
    <div class="tk-b"><span class="tk-t">${esc(r.title)}</span>${meta?`<span class="tk-m">${meta}</span>`:''}</div></div>`;
}
let showAllReeds=false, showSoon=false;
function tasksHTML(){
  const T=V.tasks, c=V.counts;
  const today=T.today.filter(r=>!r.ann||true);
  const scored=today.filter(r=>!r.ann);
  let h=`<div class="sec"><b>Today</b><span>${scored.length?`${c.done} of ${c.total} released`:''}</span></div>`;
  if(scored.length) h+=`<div class="pips">${scored.slice(0,16).map(r=>`<i class="${r.done?'on':''}"></i>`).join('')}</div>`;
  h+=today.length?today.map(r=>taskRow(r)).join(''):`<p class="empty">Nothing due today. Pull a task onto today in the app and it shows up here.</p>`;
  if(T.reeds.length){
    const shown=showAllReeds?T.reeds:T.reeds.slice(0,4);
    h+=`<div class="sec"><b>In the reeds</b><span>${T.reeds.length} overdue</span>${T.reeds.length>4?`<button class="lnk" data-act="reeds">${showAllReeds?'Fewer':'All '+T.reeds.length}</button>`:''}</div>`;
    h+=shown.map(r=>taskRow(r)).join('');
  }
  if(T.soon.length){
    h+=`<div class="sec"><b>Coming up</b><span>next 3 days</span><button class="lnk" data-act="soon">${showSoon?'Hide':'Show '+T.soon.length}</button></div>`;
    if(showSoon) h+=T.soon.map(r=>taskRow(r)).join('');
  }
  return h;
}
function dayHTML(){
  const d=V.day, ex=V.exams;
  let h='';
  if(d.now) h+=`<div class="nowc"><i style="--c:${esc(d.now.color)}"></i><div><span>Now · until ${esc(d.now.until)}</span><b>${esc(d.now.title)}</b></div></div>`;
  else if(d.next) h+=`<div class="nowc"><i style="--c:${esc(d.next.color)}"></i><div><span>Next · ${d.next.inMin<60?'in '+d.next.inMin+' min':'at '+esc(d.next.at)}</span><b>${esc(d.next.title)}</b></div></div>`;
  const all=d.all.concat(ex.filter(x=>x.days>0).map(x=>({title:`${x.kind==='quiz'?'Quiz':'Exam'} in ${x.days} day${x.days===1?'':'s'}: ${x.title}`,color:x.color})));
  if(all.length) h+=`<div class="chips">${all.map(a=>`<span class="chip" style="--c:${esc(a.color)}" title="${esc(a.title)}"><i></i><span>${a.kind==='due'?'Due: ':''}${esc(a.title)}</span></span>`).join('')}</div>`;
  h+=`<div class="sec"><b>${esc(V.todayLabel)}</b></div>`;
  if(!d.items.length) h+=`<p class="empty">Nothing on the clock today. Plan your day in the app’s Calendar and it shows here.</p>`;
  let lined=false;
  d.items.forEach(i=>{
    if(!lined&&i.s>d.nowMin&&d.nowMin>=0&&d.nowMin<=1440){ lined=true; h+=`<div class="nowline">${esc(fTime(V.now))}</div>`; }
    h+=`<div class="ag${i.past?' past':''}${i.now?' now':''}${i.kind==='busy'?' busy':''}${i.done?' done':''}" style="--c:${esc(i.color)}">
      <span class="tm">${esc(i.range)}</span><span class="bar"></span>
      <span class="tt"><b>${esc(i.title)}</b>${i.sub?`<span>${esc(i.sub)}</span>`:''}</span></div>`;
  });
  return h;
}

/* ── focus ── */
const RHY=[['gentle','Gentle',15,3],['classic','Classic',25,5],['deep','Deep',50,10],['custom','Custom',null,null]];
let setF=null, setB=null, setK=null, pickIds=new Set(), pickAll=false;
function focusSetupHTML(){
  if(setF==null){ setF=V.settings.focus; setB=V.settings.brk; setK=(RHY.find(r=>r[2]===setF&&r[3]===setB)||['custom'])[0]; }
  const T=V.tasks, seen=new Set(), cand=[];
  T.today.concat(T.reeds,T.soon,T.open).forEach(r=>{ if(!r.done&&!r.ann&&!seen.has(r.id)){ seen.add(r.id); cand.push(r); } });
  const shown=pickAll?cand.slice(0,14):cand.slice(0,3);
  const goal=V.settings.goal, pct=goal?Math.min(100,Math.round(V.mins/goal*100)):0;
  return `<div class="sec"><b>Rhythm</b><span>focus · break</span></div>
    <div class="pre">${RHY.map(([k,n,f,b])=>`<button class="${setK===k?'on':''}" data-rhy="${k}"><b>${n}</b><span>${f?f+' · '+b:setF+' · '+setB}</span></button>`).join('')}</div>
    ${setK==='custom'?`<div class="btns"><button data-step="f-5">− focus</button><button data-step="f5">+ focus</button><button data-step="b-1">− break</button><button data-step="b1">+ break</button></div>`:''}
    <button class="go" data-act="begin">Start focusing · ${setF} min${pickIds.size?` · ${pickIds.size} task${pickIds.size===1?'':'s'}`:''}</button>
    ${goal?`<div class="lotus"><div class="bar"><i style="width:${pct}%"></i></div><span>${V.mins} / ${goal} min today</span></div>`:''}
    <div class="sec"><b>Bring tasks in</b><span>optional · ${pickIds.size} picked</span></div>
    ${shown.map(r=>`<button class="pk${pickIds.has(r.id)?' on':''}" data-pick="${esc(r.id)}"><span class="pk-ck">${pickIds.has(r.id)?'✓':''}</span>
      <span class="tk-b"><span class="tk-t">${esc(r.title)}</span><span class="tk-m">${r.cls?`<i style="background:${esc(r.color)}"></i>${esc(short(r.cls,22))} · `:''}${r.late?`<span class="late">${r.late}d late</span>`:esc(r.dueLabel||'no date')}</span></span></button>`).join('')||'<p class="empty">Nothing open. You can still just focus.</p>'}
    ${cand.length>3?`<button class="lnk" data-act="pickall" style="margin:2px 0 6px">${pickAll?'Show fewer':'Show more tasks'}</button>`:''}`;
}
function runHTML(){
  const s=V.session, brk=s.phase==='break';
  const tasks=(s.assignmentIds||[]).map(id=>V.tasks.today.concat(V.tasks.reeds,V.tasks.soon,V.tasks.open).find(r=>r.id===id)).filter(Boolean);
  const btn2=brk?['break-end','Back to focus']:s.phase==='rating'?['rate-now','Rate it']:['rate-now','Break now'];
  return `<div class="run${brk?' brk':''}" id="run">
      <div class="ph" id="r-ph"></div><div class="clk" id="r-clk"></div><div class="sub" id="r-sub"></div>
      <div class="rbar"><i id="r-bar"></i></div></div>
    <div class="btns">
      ${s.phase==='rating'?'':`<button data-act="${s.paused?'resume':'pause'}">${s.paused?'Resume':'Pause'}</button>`}
      <button class="pri" data-act="${btn2[0]}">${btn2[1]}</button>
      <button class="end" data-act="end">End</button></div>
    ${tasks.length?`<div class="sec"><b>This session</b><span>tick one to release it</span></div>${tasks.map(r=>taskRow(r)).join('')}`:''}`;
}
function tickRun(){
  const s=V.session; if(!s||!$('r-clk')) return;
  const e=elapsed(s), rem=s.target-e, brk=s.phase==='break', over=rem<0;
  const put=(id,v)=>{ const el=$(id); if(el&&el.textContent!==v) el.textContent=v; };
  put('r-ph',s.phase==='rating'?'Rate the block':brk?(over?'Break overrun':'Break'):s.paused?'Paused':over?'Overtime':'Focus');
  put('r-clk',s.phase==='rating'?'·':clock(rem));
  const n=s.cycles.length+(brk?0:1);
  put('r-sub',s.phase==='rating'?'Tell me how it went':brk?(over?'counting against you · back when you can':'rest · the water is still')
    :`Cycle ${Math.max(1,n)} · started ${fTime(s.started)}`+(over?` · break now worth ${dur(e*s.ratio)}`:''));
  const b=$('r-bar'); if(b) b.style.width=(Math.max(0,Math.min(1,e/Math.max(1,s.target)))*100).toFixed(2)+'%';
}
let rateVal=0;
const WORDS=['','Scattered','Patchy','Okay','Locked in','Flow state'];
function rateHTML(end){
  const s=V.session; if(!s) return '<p class="empty">No session running.</p>';
  const inFocus=s.phase==='focus'||s.phase==='rating';
  const actual=s.phase==='rating'&&s.pending?s.pending.actual:inFocus?Math.max(1000,elapsed(s)):0;
  const earned=Math.round(actual*s.ratio);
  const n=s.phase==='rating'&&s.pending?s.pending.n:s.cycles.length+1;
  let h='<div class="rate">';
  if(inFocus){
    h+=`<h3>${end?'Last block':'Cycle '+n+' done'}</h3><p>${dur(actual)} focused → <b>${dur(earned)} break earned</b></p>
      <div class="peb">${[1,2,3,4,5].map(i=>`<button class="${rateVal===i?'on':''}" data-rate="${i}" title="${WORDS[i]}">${i}</button>`).join('')}</div>
      <div class="pw" id="pw">${WORDS[rateVal]||'How focused were you?'}</div>`;
    if(!end) h+=`<div class="fld"><span>Cycle note · optional</span><textarea id="cj" placeholder="What happened in these ${dur(actual)}?"></textarea></div>`;
  } else h+=`<h3>Wrap up</h3>`;
  if(end){
    const sm=summ(s);
    h+=`<p style="margin-top:8px">${sm.cycles} cycle${sm.cycles===1?'':'s'} · ${dur(sm.net+(inFocus?actual:0))} of focus</p>
      <div class="fld"><span>Name · optional</span><input id="sn" maxlength="80" placeholder="${esc(s.name||'Study session')}"></div>
      <div class="fld"><span>Session journal · optional</span><textarea id="sj" placeholder="What worked? What pulled you away?"></textarea></div>
      <button class="go" data-act="finish">Save session</button>
      <button class="lnk" data-act="back-run" style="display:block;margin:2px auto 6px">Back to the timer</button>`;
  } else h+=`<button class="go" data-act="start-break" ${rateVal?'':'disabled'}>Start break</button>`;
  return h+'</div>';
}
function summ(s){ const c=s.cycles||[]; const f=c.reduce((x,y)=>x+(y.actual||0),0), ob=c.reduce((x,y)=>x+(y.overBreak||0),0); return {cycles:c.length,net:f-ob}; }
function breakOverHTML(){
  return `<div class="btns" style="margin-top:10px"><button class="pri" data-act="break-end">Back to focus</button><button class="end" data-act="end">End session</button></div>`;
}
function settingsHTML(){
  return `<div class="sec"><b>Your desktop toad</b></div>
    <div class="grid9">${TOADS.map(t=>`<button class="${t===NAME?'on':''}" data-toad="${t}"><span class="fig">${art(t,64)}</span><b>${esc(NAMES[t])}</b><span>${esc(shortTitle(t))}</span></button>`).join('')}</div>
    <div class="sec"><b>Size</b></div>
    <div class="seg">${[['s','Small'],['m','Medium'],['l','Large']].map(([k,l])=>`<button class="${SIZE===k?'on':''}" data-size="${k}">${l}</button>`).join('')}</div>
    <label class="row"><input type="checkbox" id="login" ${LOGIN?'checked':''}> Start with Windows</label>
    <button class="wide" data-act="open-app">Open Catching Days</button>
    <button class="wide quiet" data-act="quit">Put the toad away (quit)</button>`;
}

let bodySig='';
function render(force){
  paintTabs();
  const b=$('body'); let h='';
  if(mode==='tasks') h=tasksHTML();
  else if(mode==='day') h=dayHTML();
  else if(mode==='focus'||mode==='setup') h=V.session?runHTML():focusSetupHTML();
  else if(mode==='rate') h=V.session?rateHTML(false):focusSetupHTML();
  else if(mode==='end') h=V.session?rateHTML(true):focusSetupHTML();
  else if(mode==='break-over') h=V.session?breakOverHTML():'';
  else if(mode==='settings') h=settingsHTML();
  /* redraw only when it changed (keeps your scroll, your hover, anything typed) */
  const sig=mode+'|'+h.replace(/id="(r-clk|r-sub|r-ph)"[^<]*/g,'');
  if(!force&&sig===bodySig) { tickRun(); return; }
  if(['rate','end'].includes(mode)&&!force&&b.querySelector('textarea,input:not([type=checkbox])')&&bodySig.startsWith(mode+'|')) return;
  const top=b.scrollTop; bodySig=sig; b.innerHTML=h; b.scrollTop=top;
  tickRun();
}
function go(m){
  mode=m; showAllReeds=false; rateVal=(m==='rate'||m==='end')?rateVal:0;
  render(true);
  $('body').scrollTop=0;
}

/* ════════════════ clicks ════════════════ */
async function op(o){ try{ return await window.pet.op(o); }catch(e){ return {ok:false}; } }
$('body').addEventListener('click',async e=>{
  const t=e.target;
  const ck=t.closest('.ck');
  if(ck){
    const row=ck.closest('.tk'), id=row.dataset.id;
    const all=V.tasks.today.concat(V.tasks.reeds,V.tasks.soon,V.tasks.open), r=all.find(x=>x.id===id); if(!r) return;
    const on=!row.classList.contains('done');
    row.classList.toggle('done',on);
    const lastOne=on&&!r.ann&&V.tasks.today.some(x=>x.id===id)&&V.counts.left===1;
    const res=await op({k:'task',aid:id,on});
    if(!res||!res.ok){ row.classList.toggle('done',!on); return; }
    window.pet.send('react',{kind:lastOne?'allDone':on?'done':'undone'});
    say(lastOne?line('allDone'):on?line('done',r.title):line('undone'));
    return;
  }
  const a=t.closest('[data-act]'); const act=a&&a.dataset.act;
  if(act==='reeds'){ showAllReeds=!showAllReeds; render(true); return; }
  if(act==='soon'){ showSoon=!showSoon; render(true); return; }
  if(act==='pickall'){ pickAll=!pickAll; render(true); return; }
  if(act==='begin'){
    /* the toad still asks first; it starts the session after its 3, 2, 1 */
    window.pet.send('focus-ritual',{f:setF,b:setB,ids:[...pickIds]});
    pickIds=new Set();
    return;
  }
  if(act==='pause'||act==='resume'){ await op({k:'focus',act}); return; }
  if(act==='rate-now'){ rateVal=0; go('rate'); return; }
  if(act==='start-break'){
    if(!rateVal) return;
    const j=$('cj')?$('cj').value.trim():'';
    const res=await op({k:'focus',act:'rate',r:rateVal,j});
    if(res&&res.ok){ rateVal=0; go('focus'); window.pet.send('react',{kind:'done'}); say(line('breakStart')); }
    return;
  }
  if(act==='break-end'){ const res=await op({k:'focus',act:'break-end'}); if(res&&res.ok){ go('focus'); say(line('focusStart')); } return; }
  if(act==='end'){ rateVal=0; go('end'); return; }
  if(act==='back-run'){ go('focus'); return; }
  if(act==='finish'){
    const s=V.session, inFocus=s&&(s.phase==='focus'||s.phase==='rating');
    const res=await op({k:'focus',act:'finish',r:inFocus?(rateVal||null):undefined,name:$('sn')?$('sn').value.trim():'',j:$('sj')?$('sj').value.trim():''});
    if(res&&res.ok){ rateVal=0; go('chat'); window.pet.send('react',{kind:'sessionEnd'}); say(line('sessionEnd')); }
    return;
  }
  if(act==='open-app'){ window.pet.send('open-app'); return; }
  if(act==='quit'){ window.pet.send('quit'); return; }
  const rh=t.closest('[data-rhy]');
  if(rh){ const r=RHY.find(x=>x[0]===rh.dataset.rhy); setK=r[0]; if(r[2]){ setF=r[2]; setB=r[3]; } render(true); return; }
  const st=t.closest('[data-step]');
  if(st){ const k=st.dataset.step; if(k[0]==='f') setF=Math.max(5,Math.min(180,setF+ +k.slice(1))); else setB=Math.max(1,Math.min(90,setB+ +k.slice(1))); render(true); return; }
  const pk=t.closest('[data-pick]');
  if(pk){ const id=pk.dataset.pick; pickIds.has(id)?pickIds.delete(id):pickIds.add(id); render(true); return; }
  const rt=t.closest('[data-rate]');
  if(rt){ rateVal=+rt.dataset.rate; document.querySelectorAll('.peb button').forEach(b=>b.classList.toggle('on',+b.dataset.rate===rateVal));
    const pw=$('pw'); if(pw) pw.textContent=WORDS[rateVal]; const sb=document.querySelector('[data-act="start-break"]'); if(sb) sb.disabled=false; return; }
  const td=t.closest('[data-toad]');
  if(td){ window.pet.send('set-toad',td.dataset.toad); return; }
  const sz=t.closest('[data-size]');
  if(sz){ SIZE=sz.dataset.size; window.pet.send('set-size',SIZE); render(true); return; }
});
$('body').addEventListener('change',e=>{ if(e.target.id==='login'){ LOGIN=e.target.checked; window.pet.send('set-login',LOGIN); } });
$('b-x').addEventListener('click',()=>window.pet.send('panel-close'));
$('b-set').addEventListener('click',()=>go(mode==='settings'?'chat':'settings'));
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ e.preventDefault(); window.pet.send('panel-close'); return; }
  const typing=e.target&&e.target.matches&&e.target.matches('input,textarea');
  if(!typing&&(mode==='rate'||mode==='end')&&/^[1-5]$/.test(e.key)){ const b=document.querySelector(`[data-rate="${e.key}"]`); if(b) b.click(); }
});
/* the toad's window activates this one when you click into it, even after a quiet open */
document.addEventListener('mousedown',()=>window.pet.send('panel-pin'));

/* ════════════════ footer ════════════════ */
function paintFoot(){
  const f=$('ft');
  f.className='ft'+(V.appOpen?' on':'');
  const wait=V.pending;
  f.innerHTML=`<i></i><span>${V.appOpen?(wait?'Catching Days is open · catching up…':'Catching Days is open · it all lands right away')
    :(wait?`${wait} change${wait===1?'':'s'} saved · ${wait===1?'it lands':'they land'} when you open Catching Days`:'Catching Days is closed · anything you do here waits for it')}</span>
    ${V.appOpen?'':'<button class="lnk" id="ft-open">Open</button>'}`;
  const o=$('ft-open'); if(o) o.onclick=()=>window.pet.send('open-app');
}

/* ════════════════ sizing: the window fits the card ════════════════ */
new ResizeObserver(()=>window.pet.send('panel-height',$('card').offsetHeight+48)).observe($('card'));

/* ════════════════ messages ════════════════ */
window.pet.on('view',v=>{
  const hadSession=!!(V&&V.session); V=v;
  if(hadSession&&!V.session&&['rate','end','break-over'].includes(mode)) mode='chat';
  render(false); paintFoot();
});
window.pet.on('toad',t=>{ NAME=t.name; paintWho(); say(line('choose')); if(mode==='settings') render(true); });
window.pet.on('open',o=>{
  peeking=!!o.peeking;
  const m=o.mode||'chat';
  rateVal=0; go(m);
  if(o.reason==='bell') say(line('bell'));
  else if(o.reason==='breakOver') say(line('breakOver'));
  else if(m==='chat') say(chatLine());
  else say(line('hello'));
  paintFoot();
  const c=$('card'); c.classList.remove('show'); void c.offsetWidth; c.classList.add('show');
});
window.pet.on('closed',()=>{ $('card').classList.remove('show'); clearInterval(sayT); });

setInterval(()=>{ if(V&&V.session&&!document.hidden){ tickRun(); paintTabs(); } },250);
paintWho(); render(true); paintFoot();
})();
