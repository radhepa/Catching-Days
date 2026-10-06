/* Catching Days · the nine-toad encyclopedia.
   Reading entries does not award, unlock, save, or mount companion dialogue. */
(function(){
'use strict';
const entries=[
  {key:'hasu',name:'Hasu',title:'Keeper of the Lotus',group:'Pond keeper',home:'Today',
   traits:['Unhurried','Observant','Dry wit'],appearance:'Cream and koi orange · lotus parasol · seed beads',
   brief:'The oldest presence at the pond, with a lotus leaf overhead and a remark ready for almost anything.',
   story:['Hasu has sat on her lily pad for two hundred summers. Her cream skin carries koi-orange patches, and a string of lotus-seed beads rests beneath her broad, quiet smile. A lotus leaf keeps the sun off her head.',
     'She notices more than she says. Her kindness often arrives as a dry observation, a small question, or permission to sit down for a moment. She makes room for unfinished days without pretending every day is easy.'],
   quote:'I’ve sat on this pad for two hundred summers. You can sit for twenty-five minutes.'},
  {key:'ame',name:'Ame',title:'Keeper of the Rain',group:'Pond keeper',home:'Focus',
   traits:['Steady','Practical','Few words'],appearance:'Slate blue · straw kasa and cape · mossy rock',
   brief:'A low, sturdy rain toad who knows the value of staying put. Usually says just enough.',
   story:['Ame settles beneath a broad straw kasa, wrapped in a woven rain cape. His slate-blue body is wide and low, like the mossy rock he sits on. Water gathers at the edge of his hat while he waits.',
     'He speaks in short, practical fragments. Ame is good company for work that takes a while: he does not rush it, dramatize it, or fill every pause. His humor is so matter-of-fact that you may notice it a second later.'],
   quote:'Rain doesn’t hurry. Still gets everything wet.'},
  {key:'sumi',name:'Sumi',title:'Keeper of the Ink',group:'Pond keeper',home:'Journal',
   traits:['Exact','Gentle','A little formal'],appearance:'Warm granite · ink strokes · shrine rope and brush',
   brief:'A stone guardian with a careful voice, a steady amber gaze, and a brush tucked at his side.',
   story:['Sumi has the heaviest guardian stance of the keepers. Dark, dragged-ink markings cross his warm granite skin. A white shrine rope carries folded paper and a vermilion seal; his bamboo brush rests at his side above a slate inkstone.',
     'He treats words with care. Sumi likes a precise name, a small question, and a polite pause before answering. His formality is gentle rather than distant, and his seriousness occasionally makes an ordinary pond misunderstanding very funny.'],
   quote:'Naming a feeling makes it smaller. Not gone. Smaller.'},
  {key:'tabi',name:'Tabi',title:'Keeper of the Road',group:'Pond keeper',home:'Journeys',
   traits:['Generous','Talkative','Optimistic'],appearance:'Ochre spots · travel pack · teal cloth · Dango the snail',
   brief:'A well-packed traveler with a road rule for every occasion and a snail riding on his head.',
   story:['Tabi is compact and sturdy, with ochre skin, dark-ringed spots, and a teal cloth tied at his throat. A wooden pack holds a rolled straw mat and a gourd. Dango, his snail companion, travels comfortably on his head.',
     'He believes in a first step and a useful bit of advice. Tabi is warm, chatty, and happy to share what he has learned on the road. Dango provides her own commentary by moving at exactly the speed she prefers.'],
   quote:'Road rule: the first step is the cheap one. Take it while it’s on sale.'},
  {key:'hotaru',name:'Hotaru',title:'Keeper of the Lanterns',group:'Pond keeper',home:'Collection',
   traits:['Sleepy','Soft-spoken','Unexpected insight'],appearance:'Moss olive · folded lids · firefly jar · floating log',
   brief:'A small night toad with a jar of fireflies, heavy eyelids, and a talent for noticing quiet things.',
   story:['Hotaru is the smallest of the original keepers. His mossy-olive skin has soft blotches and pale warts. He lifts a glass jar of fireflies from his floating log, letting its little light reach his face.',
     'He often sounds halfway through a nap, but he is listening. Hotaru notices a light, a pause, or a detail everyone else passed over. His few words can turn a scene in an unexpected direction before he settles back into the quiet.'],
   quote:'…Mm. Every light in here was a task you finished. Did you know that?'},
  {key:'neri',name:'Neri',title:'Keeper of the Kiln',group:'Pond companion',home:'Pondside pottery',
   traits:['Affectionate','Opinionated','Forgiving'],appearance:'Rose clay · celadon eyes · indigo apron · repaired bowl',
   brief:'A practical potter who cares through making, mending, and finding a use for a lopsided bowl.',
   story:['Neri has rose-clay skin, celadon eyes, and a crooked little smile. Her indigo work apron has a patched corner. One hand supports a handmade bowl with one gold repair; the other curls around a blunt bamboo trimming paddle.',
     'She can be wonderfully opinionated about pottery and wonderfully forgiving about people. Neri prefers a useful, imperfect thing to a perfect one nobody dares touch. When someone needs help, she usually starts doing something before they finish explaining.'],
   quote:'Perfectly round? Then how would I know which one was mine?'},
  {key:'oto',name:'Oto',title:'Keeper of the Reeds',group:'Pond companion',home:'Music by the water',
   traits:['Curious','Bashful','Persistent'],appearance:'Dusk lilac · amber eyes · oat linen · bamboo flute',
   brief:'A quiet musician who hears possible duets everywhere, including in sounds that were probably accidents.',
   story:['Oto’s dusk-lilac body is crossed by the long, low line of a six-hole bamboo flute. An oat linen wrap rests at his shoulders. The instrument has node bands, a hollow end, and a little frayed red binding; his reed mat is just as simply made.',
     'Praise embarrasses him more than a wrong note does. Oto listens closely, tries an idea, and tries it again when it nearly works. He is shy about performing but surprisingly stubborn about an experiment he wants to finish.'],
   quote:'The squeak was intentional. The second squeak was a surprise.'},
  {key:'kuri',name:'Kuri',title:'Keeper of the Roots',group:'Pond companion',home:'The root bed',
   traits:['Patient','Grounded','Quietly tender'],appearance:'Warm clay · chestnut crown · white left eye · moss-green right eye',
   brief:'A patient gardener with a cloudy white left eye and a calm belief that roots deserve time.',
   story:['Kuri’s warm clay skin carries a chestnut crown mark. His arms share the same natural skin color, and his belly is bare. He is blind in his left eye, which is cloudy white; his right iris is moss green beneath a gently folded lid.',
     'He has little patience for fussing and plenty of patience for growing things. Kuri would rather tend a root bed than announce how well it is doing. His crooked mouth often holds a small, practical observation while everyone else is still debating the plan.'],
   quote:'Leave it be. Roots do their best work without an audience.'},
  {key:'mame',name:'Mame',title:'A Small Child of the Pond',group:'Pond companion',home:'Little leaf-boat adventures',
   traits:['Inquisitive','Earnest','Playful'],appearance:'Mist blue · amber eyes · cream stripe · golden cheek · leaf boat',
   brief:'A small explorer with many big questions and a leaf boat that might become a submarine.',
   story:['Mame is smaller than Hotaru, with short limbs and softly raised glands. A broken cream stripe and golden cheek patch stand out against mist-blue skin. Warm amber eyes open a little unevenly. His belly is bare, and a tiny leaf boat rests between his feet.',
     'Every discovery feels important. Mame asks literal questions, announces ambitious plans, and sometimes arrives at a wonderfully wrong conclusion. A boat that sinks is a chance to rename the adventure, then start another one.'],
   quote:'If the boat sinks, I’ll call it a submarine.'}
].map(t=>Object.freeze({...t,traits:Object.freeze(t.traits),story:Object.freeze(t.story)}));
Object.freeze(entries);
const original=new Set(['hasu','ame','sumi','tabi','hotaru']);
const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function art(t,size=210){
  if(original.has(t.key))return window.ToadArt.svg(t.key,{size,perch:'own',water:false});
  if(window.ToadCompanions?.has(t.key))return window.ToadCompanions.svg(t.key,{size});
  const revision=t.key==='oto'?4:t.key==='neri'?3:1;
  return `<img src="sprites/toads/${t.key}.svg?v=${revision}" width="${size}" height="${size}" alt="" decoding="async">`;
}
/* Motion: a card's toad moves while the card is hovered or keyboard-focused
   (toad-collection.css keeps the rest still); an open entry's portrait moves
   the whole time. Same switch as the keepers: Settings > The pond, pond-still,
   and the OS reduced-motion setting, all read through Toads.motionOn(). */
function moving(){try{return window.Toads?.motionOn?window.Toads.motionOn():true;}catch(err){return true;}}
function render(el,kindSwitcher){
  const mv=moving()?' td-mv':'';
  el.innerHTML=`<div class="co tc-collection">${kindSwitcher}
    <div class="phead"><div><h1 class="ptitle">Toad encyclopedia</h1><p class="psub">The keepers and companions who give the pond its character. Every entry is here to read.</p></div>
      <div class="tc-count"><b>${entries.length}</b><span>pond neighbors</span></div></div>
    <div class="tc-intro"><span class="eyebrow">A little world, nine personalities</span><p>Some keep the rain company. Some make bowls, play the reeds, or launch very small boats. Choose a toad to meet them.</p></div>
    <div class="tc-grid">${entries.map((t,i)=>`<button type="button" class="tc-card" id="tc-card-${t.key}" onclick="ToadCollection.open('${t.key}')" aria-label="Read about ${e(t.name)}, ${e(t.title)}">
      <span class="tc-water"><span class="tc-no">No. ${String(i+1).padStart(2,'0')}</span><span class="tc-portrait${mv}" aria-hidden="true">${art(t)}</span></span>
      <span class="tc-card-body"><span class="tc-name">${e(t.name)}</span><span class="tc-role">${e(t.title)}</span><span class="tc-brief">${e(t.brief)}</span><span class="tc-read">Read entry <span aria-hidden="true">↗</span></span></span>
    </button>`).join('')}</div></div>`;
}
let dialog=null,returnFocus=null,index=0;
function fill(){
  const t=entries[index];
  dialog.innerHTML=`<button class="tc-close" type="button" aria-label="Close toad entry" data-close>×</button>
    <div class="tc-entry"><div class="tc-entry-art tc-water"><span class="tc-portrait${moving()?' td-mv':''}" aria-hidden="true">${art(t,330)}</span><span class="tc-entry-number">No. ${String(index+1).padStart(2,'0')} · ${e(t.group)}</span></div>
      <div class="tc-entry-copy"><span class="tc-role">${e(t.title)}</span><h2 id="tc-entry-title" tabindex="-1">${e(t.name)}</h2>
        <div class="tc-traits">${t.traits.map(x=>`<span>${e(x)}</span>`).join('')}</div>
        <blockquote>“${e(t.quote)}”</blockquote>
        ${t.story.map(p=>`<p>${e(p)}</p>`).join('')}
        <dl class="tc-facts"><div><dt>At home</dt><dd>${e(t.home)}</dd></div><div><dt>Recognize them by</dt><dd>${e(t.appearance)}</dd></div></dl></div></div>
    <div class="tc-entry-nav"><button type="button" data-step="-1" aria-label="Previous toad">← Previous</button><button type="button" data-close>Back to toads</button><button type="button" data-step="1" aria-label="Next toad">Next →</button></div>`;
  dialog.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',close));
  dialog.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>step(Number(b.dataset.step))));
}
function step(n){
  index=(index+n+entries.length)%entries.length;
  fill();dialog.scrollTop=0;
  dialog.querySelector(`[data-step="${n}"]`)?.focus({preventScroll:true});
}
function open(key){
  const found=entries.findIndex(t=>t.key===key);if(found<0)return;
  if(dialog){index=found;fill();dialog.scrollTop=0;dialog.querySelector('h2').focus({preventScroll:true});return;}
  index=found;returnFocus=document.activeElement;
  dialog=document.createElement('dialog');dialog.className='tc-dialog';dialog.setAttribute('aria-labelledby','tc-entry-title');
  dialog.addEventListener('close',()=>{
    dialog?.remove();dialog=null;
    if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;
  });
  dialog.addEventListener('click',ev=>{
    if(ev.target!==dialog)return;
    const b=dialog.getBoundingClientRect();
    if(ev.clientX<b.left||ev.clientX>b.right||ev.clientY<b.top||ev.clientY>b.bottom)close();
  });
  dialog.addEventListener('keydown',ev=>{
    if(ev.key==='ArrowRight'||ev.key==='ArrowLeft'){ev.preventDefault();step(ev.key==='ArrowRight'?1:-1);}
  });
  document.body.appendChild(dialog);fill();dialog.showModal();dialog.querySelector('h2').focus({preventScroll:true});
}
function close(){dialog?.close();}
window.ToadCollection=Object.freeze({entries,render,open,close});
})();
