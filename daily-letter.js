/* Catching Days · a Daily journal's letter from the pond.
   Reads the selected day's records, never changes journal text or saves data.
   Uses the same fish, bug and Hasu artwork as the rest of the app. */
(function(){
'use strict';
let serial=0;
const openingTimers=new WeakMap();
const plural=(n,word)=>`${n} ${word}${n===1||word==='species'?'':'s'}`;
const lotus='<svg viewBox="0 0 40 32" aria-hidden="true"><path d="M20 26C5 25 4 15 4 15s12-1 16 11Zm0 0c15-1 16-11 16-11s-12-1-16 11Z" fill="currentColor" opacity=".65"/><path d="M20 26C8 17 13 5 13 5s9 5 7 21Zm0 0C32 17 27 5 27 5s-9 5-7 21Z" fill="currentColor" opacity=".8"/><path d="M20 27C10 16 20 1 20 1s10 15 0 26Z" fill="currentColor"/></svg>';

function collect(date){
  const stats=dayStats(date);
  const completed=(db.assignments||[]).filter(a=>a.done&&!a.ann&&a.habitOutcome!=='skipped'&&a.doneAt&&dayKey(a.doneAt)===date);
  const tasks=completed.filter(a=>!a.habitId), habits=completed.filter(a=>a.habitId);
  const pond=db.pond||{}, since=pond.collectionStartedAt||Infinity;
  const fish=new Map();
  completed.filter(a=>a.doneAt>since).forEach(a=>{
    const key=pondRoll(a), species=PondArt.SP[key]; if(!species) return;
    if(!fish.has(key)) fish.set(key,{key,name:species.name,count:0,fresh:false});
    fish.get(key).count++;
  });
  Object.entries(pond.seen||{}).forEach(([key,at])=>{
    if(!(at>since)||dayKey(at)!==date||!PondArt.SP[key]) return;
    if(!fish.has(key)) fish.set(key,{key,name:PondArt.SP[key].name,count:0,fresh:false});
    fish.get(key).fresh=true;
  });
  // Legacy bug records retain first/last, but no dates for intermediate visits.
  // Only include known dates; all catches from this version keep a visits list.
  const bugs=Object.entries(pond.bugs||{}).filter(([,r])=>r.first===date||r.last===date||(r.visits||[]).includes(date))
    .map(([key,r])=>({key,bug:bugByKey(key),fresh:r.first===date})).filter(b=>b.bug);
  return {date,net:stats.net,cycles:stats.cycles,exams:stats.exams,tasks,habits,fish:[...fish.values()],bugs,
    released:[...fish.values()].reduce((n,f)=>n+f.count,0)};
}

function messages(mood){
  if(mood==='bad'||mood==='rough') return [
    'Hm. A heavy day still deserves a soft landing. You don’t have to make it sound prettier than it was.',
    'Leave a little of the weight on this page. I can sit beside it for a while.',
    'You made it here. Let that be enough for this moment. The pond can wait until tomorrow.'
  ];
  return [
    'Small is not the same as nothing. Look at the little things your day held. I noticed.',
    'You don’t have to earn a quiet evening. Even an old toad knows when to put her feet up.',
    'Some days make ripples. Some days are still water. There’s room for both in this pond.'
  ];
}

function creatureRows(data){
  const fish=data.fish.length?data.fish.map(f=>`<li><span class="dl-creature" aria-hidden="true">${PondArt.fish(f.key,.65,0,'flat')}</span><span><b>${esc(f.name)}</b><small>${f.count?plural(f.count,'fish')+' released':''}${f.count&&f.fresh?' · ':''}${f.fresh?'new to your pond':''}</small></span></li>`).join(''):
    '<li class="dl-empty">No fish recorded this day. The water had a quiet moment.</li>';
  const bugs=data.bugs.length?data.bugs.map(b=>`<li><span class="dl-creature" aria-hidden="true">${bugStill(b.bug,bugArtScale(b.bug)*.65)}</span><span><b>${esc(bugName(b.bug))}</b><small>${b.fresh?'A first hello in the reeds':'A familiar visitor, caught again'}</small></span></li>`).join(''):
    '<li class="dl-empty">No bug visits recorded this day.</li>';
  return `<details class="dl-details"><summary><span>By the water</span><span>${plural(data.fish.length,'species')} · ${plural(data.bugs.length,'bug')} <i>⌄</i></span></summary><div class="dl-fieldguide"><div><h4>In the pond</h4><ul>${fish}</ul></div><div><h4>In the reeds</h4><ul>${bugs}</ul></div></div></details>`;
}

function render(date,options={}){
  const d=collect(date), id='dl-'+(++serial), mood=options.mood||'', open=!!options.open;
  const minutes=Math.round(d.net/MIN), hours=Math.floor(minutes/60), rest=minutes%60;
  const focus=hours?`${hours}h${rest?' '+rest+'m':''}`:`${minutes}m`;
  const dateLabel=new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
  const future=date>today(), quiet=!d.net&&!d.tasks.length&&!d.habits.length&&!d.fish.length&&!d.bugs.length&&!d.exams;
  const intro=future?'A little space for the day ahead. Your recorded moments will find their way here as the day unfolds.':
    quiet?'The pond was quiet on this page. A day is still worth keeping, even when there are no numbers to show for it.':
    'Before the day slips away, here are a few small things to keep. A little work, a little water, and the moments that made ripples.';
  const taskRows=[...d.tasks,...d.habits].map(a=>`<li><span class="dl-tick" aria-hidden="true">✓</span><span>${esc(a.title)}${a.habitId?'<small>A journey stone kept</small>':''}</span></li>`).join('');
  if(window.ToadArt) ToadArt.injectCSS();
  const art=window.ToadArt?ToadArt.svg('hasu',{size:86,perch:'ground'}):lotus;
  return `<section class="daily-letter${pondMotionOn()?' dl-motion td-mv':''}${open?' dl-open dl-settled':''}" data-date="${esc(date)}" data-mood="${esc(mood)}" data-message="0" aria-label="A letter from the pond">
    <button type="button" class="dl-envelope" aria-expanded="${open}" aria-controls="${id}" onclick="DailyLetter.open(this)"${open?' hidden':''}>
      <span class="dl-envelope-face" aria-hidden="true"><span class="dl-flap"></span><span class="dl-seal">${lotus}</span></span>
      <span class="dl-envelope-copy"><span class="dl-eyebrow">Pond post · ${esc(bugDate(date))}</span><strong>A little letter for your day</strong><span>From Hasu, with a soft place to land</span><span class="dl-open-hint">Break the seal <span aria-hidden="true">↗</span></span></span>
    </button>
    <article class="dl-paper" id="${id}"${open?'':' hidden'}>
      <header class="dl-letterhead"><span class="dl-eyebrow">Catching Days · Pond post</span><button type="button" class="dl-fold" onclick="DailyLetter.fold(this)" aria-label="Fold the letter">Fold ↙</button></header>
      <div class="dl-heading"><span class="dl-postmark" aria-hidden="true">${lotus}<span>THE LOTUS POND</span></span><div><p class="dl-date">${esc(dateLabel)}</p><h3>A day worth keeping.</h3></div></div>
      <p class="dl-dear">Dear you,</p><p class="dl-intro">${intro}</p>
      <div class="dl-tallies" aria-label="Recorded activity for this day">
        <div><b>${focus}</b><span>of recorded focus</span></div><div><b>${d.tasks.length}</b><span>task${d.tasks.length===1?'':'s'} completed</span></div>
        <div><b>${d.released}</b><span>fish released</span></div><div><b>${d.bugs.length}</b><span>bug${d.bugs.length===1?'':'s'} found</span></div>
      </div>
      ${d.cycles||d.habits.length||d.exams?`<p class="dl-little">${[d.cycles?plural(d.cycles,'focus cycle'):null,d.habits.length?plural(d.habits.length,'journey stone')+' kept':null,d.exams?plural(d.exams,'exam')+' taken':null].filter(Boolean).join(' · ')}</p>`:''}
      ${creatureRows(d)}
      ${taskRows?`<details class="dl-details"><summary><span>The things you finished</span><span>${d.tasks.length+d.habits.length} <i>⌄</i></span></summary><ul class="dl-tasks">${taskRows}</ul></details>`:''}
      <div class="dl-companion"><button type="button" class="dl-stamp" onclick="DailyLetter.word(this)" aria-label="Another encouraging word from Hasu"><span class="dl-stamp-art" aria-hidden="true">${art}</span><span>HASU · POND POST</span></button><div class="dl-bubble"><span class="dl-eyebrow">Hasu · Keeper of the Lotus</span><p class="dl-message" aria-live="polite">${esc(messages(mood)[0])}</p><button type="button" onclick="DailyLetter.word(this)">One more little thought ↻</button></div></div>
      <p class="dl-signoff">With a little pond-side kindness,<br><span>Hasu</span></p>
      ${options.reader?'<footer class="dl-footer">A few ripples from this day, kept beside your words.</footer>':`<footer class="dl-footer"><span>Leave a little of yourself on the page.</span><div class="dl-prompts">${['A small moment','Something to let go','For tomorrow'].map((p,i)=>`<button type="button" onclick="DailyLetter.prompt(this,${i})">${p} <span aria-hidden="true">↗</span></button>`).join('')}</div></footer>`}
    </article>
  </section>`;
}

function open(button){
  const root=button.closest('.daily-letter'), paper=root.querySelector('.dl-paper');
  clearTimeout(openingTimers.get(root));
  root.classList.remove('dl-settled'); root.classList.add('dl-open'); paper.hidden=false;
  button.setAttribute('aria-expanded','true'); button.setAttribute('aria-hidden','true'); button.tabIndex=-1;
  paper.querySelector('.dl-fold').focus({preventScroll:true});
  // The animation owns only the envelope; the journal fields stay in place.
  const finish=()=>{ if(root.classList.contains('dl-open')){ button.hidden=true; root.classList.add('dl-settled'); } };
  if(root.classList.contains('dl-motion')) openingTimers.set(root,setTimeout(finish,760)); else finish();
}
function fold(button){
  const root=button.closest('.daily-letter'), envelope=root.querySelector('.dl-envelope');
  clearTimeout(openingTimers.get(root));
  root.classList.remove('dl-open','dl-settled'); root.querySelector('.dl-paper').hidden=true;
  envelope.hidden=false; envelope.removeAttribute('aria-hidden'); envelope.tabIndex=0; envelope.setAttribute('aria-expanded','false');
  envelope.focus({preventScroll:true});
}
function word(button){
  const root=button.closest('.daily-letter'), lines=messages(root.dataset.mood);
  const index=(Number(root.dataset.message||0)+1)%lines.length; root.dataset.message=index;
  root.querySelector('.dl-message').textContent=lines[index];
  const stamp=root.querySelector('.dl-stamp'); stamp.classList.remove('td-hop');
  if(root.classList.contains('dl-motion')){ void stamp.offsetWidth; stamp.classList.add('td-hop'); setTimeout(()=>stamp.classList.remove('td-hop'),900); }
}
function mood(value){
  const root=document.querySelector('#dm-stats .daily-letter'); if(!root) return;
  root.dataset.mood=value||''; root.dataset.message='0'; root.querySelector('.dl-message').textContent=messages(value)[0];
}
function prompt(button,index){
  const input=document.getElementById('dm-text'); if(!input) return;
  const prompts=['One small moment I want to keep: ','Something I’m ready to set down: ','A little kindness for tomorrow: '];
  const end=input.value.length; input.focus(); input.setSelectionRange(end,end);
  input.setRangeText((input.value.trim()?'\n\n':'')+prompts[index],end,end,'end');
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.scrollIntoView({block:'nearest',behavior:'auto'});
}
window.DailyLetter={render,collect,open,fold,word,mood,prompt};
})();
