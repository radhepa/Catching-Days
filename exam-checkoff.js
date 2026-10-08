/* ═══════════════ Catching Days · ticking off a test ═══════════════
   Quizzes and exams sit under Today's catch as reminders ("Tests coming up",
   paintTests in the app). On the test's day, or after it, one can be ticked
   off. Ticking asks a single thing, how it felt from 1 to 5, and then one of
   the pond's toads answers in its own voice with something that fits.

   Saved on the exam: done + doneAt (through the app's toggleExam), felt (1-5,
   or null when skipped), feltAt, and one line in its journal (e.log) so the
   feeling still shows in Plan later. Undo takes all of it back.

   Self-contained: it only calls the app's helpers (exam, fixExam, exKind,
   toggleExam, modal, closeModal, save, repaint, toast, esc, uid, today,
   clsShort, pondMotionOn) and draws the toads with ToadArt (+ the faces in
   ToadExpressions when they're loaded). The toad it picked last time is
   remembered in localStorage only, so the same one doesn't answer twice in
   a row. Public: window.TestCheck = {open(id), undo(id), FEEL}. */
(function(){
'use strict';

const FEEL=[null,
  {t:'Rough', c:'#a96464'},
  {t:'Shaky', c:'#c9863f'},
  {t:'Okay',  c:'#b8941f'},
  {t:'Good',  c:'#4f86b3'},
  {t:'Great', c:'#3f774d'}];
/* the five keepers (ToadArt) and the four pond companions (toad-companions.js) */
const TOADS=['hasu','ame','sumi','tabi','hotaru','neri','oto','kuri','mame'];
const COMPANIONS={
  neri:{name:'Neri',title:'Keeper of the Kiln'},
  oto: {name:'Oto', title:'Keeper of the Reeds'},
  kuri:{name:'Kuri',title:'Keeper of the Roots'},
  mame:{name:'Mame',title:'A Small Child of the Pond'}};
const isCompanion=n=>!!COMPANIONS[n];
const toadInfo=n=>isCompanion(n)?COMPANIONS[n]:window.ToadArt.TOADS[n];
const LAST='catchingdays.testcheck.last';

/* each toad's face for each answer (names from ToadExpressions' catalog) */
const FACE={
  hasu:  [null,'tender','considering','amused','fond','chuckle'],
  ame:   [null,'gentle','nodding','certain','content','glad'],
  sumi:  [null,'concerned','thoughtful','pleased','pleased','proud'],
  tabi:  [null,'sympathetic','reassuring','encouraging','proud','excited'],
  hotaru:[null,'earnest','peaceful','drowsy','delighted','glowing']};

/* what they say. Voices as in toads.js and toad-lines.js:
   Hasu dry and old and kind; Ame in fragments, weather; Sumi gentle, exact,
   about words; Tabi chatty, roads and Dango the snail; Hotaru sleepy, lights. */
const SAY={
  hasu:[null,
    ['Hm. A rough one. I’ve sat through two hundred summers of rough ones. The pond is still here. So are you.',
     'That one stung. Let it. A lotus doesn’t blame the mud, and neither should you. Rest tonight.'],
    ['Shaky still counts as standing. One test is one test, not the whole season.',
     'Hm. Wobbly. You walked in anyway. Most of courage is just stepping into the water.'],
    ['Okay is a fine word. Nobody needs every day to bloom. The next thing gets you now.',
     'Middling. Good. It means you knew some of it, and now you know where the rest is hiding.'],
    ['Hm. Good. I noticed all those focus minutes. So did the test, apparently.',
     'Good is good. Don’t argue with it. Go and let the lotus take the credit.'],
    ['Great? Hm. I’ll allow myself one small smile. There. Well done.',
     'Look at that. All those quiet sessions, adding up. I said they would. I usually am right.']],
  ame:[null,
    ['Hard rain. It passes. You’re still dry inside.',
     'Rough. Okay. Eat something. Sleep. Then we see.'],
    ['Shaky’s fine. You stood in it. That’s the job.',
     'Wobbly rain still waters things. Done is done.'],
    ['Okay. Fair weather. Next one.',
     'Steady. Not loud. Good enough. Rest.'],
    ['Good. The work showed up. So did you.',
     'Good rain. You earned it.'],
    ['Great. Hm. I’m smiling. Don’t tell anyone.',
     'Clear sky. You made that. Rest now.']],
  sumi:[null,
    ['Mm. Some days refuse to be put into words. This one can simply be called “finished.” That is enough.',
     'A hard test is a single page, not the whole book. Turn it gently. The next page is blank, and yours.'],
    ['“Shaky” is an honest word. I respect it. Honest words are where better ones begin.',
     'Mm. Uncertain, then. Note the one question that bothered you most. Only that one. Then rest.'],
    ['“Okay” is a word with good posture. It stands on its own. You may rest beside it.',
     'Mm. A steady, ordinary result. Ordinary is underrated. I would frame it, if I may.'],
    ['“Good.” A short word, and a true one. I shall write it down in my best hand.',
     'Mm. Well prepared, and it showed. Your effort had very tidy handwriting.'],
    ['“Great.” I don’t use that word lightly. Today, I shall use it. Well done.',
     'Splendid. I’m going to need fresh ink. This deserves a proper heading.']],
  tabi:[null,
    ['Oof. Rough stretch of road. Every road has one. Dango once took three days to cross a puddle, and she still got there.',
     'Road rule: one bad mile doesn’t cancel the ones behind you. Rest your feet tonight. We walk again tomorrow.'],
    ['Shaky legs, but you finished the climb! That’s what counts on a road. Dango says hi, by the way.',
     'Wobbly’s fine. You kept walking when it got steep. Plenty of folks turn around. You didn’t.'],
    ['Okay is a good, honest mile marker. Not every stretch has a view. On to the next one, friend!',
     'Steady pace! That’s how roads get walked. Dango approves, and she is very hard to impress.'],
    ['Good one! See? All those little stepping stones added up to a whole path. I’m proud of you.',
     'Look at you go! That test was a hill and you went right over it. That calls for a sit-down.'],
    ['GREAT? Oh, that’s wonderful! Dango, did you hear? We’re having a parade. A very slow parade.',
     'Best news on the whole road today! All that steady walking, and look where it got you.']],
  hotaru:[null,
    ['…Mm. Some nights are just dark. That’s alright. I’ll keep a lantern on for you.',
     '…Hey. A hard one doesn’t put your light out. It only flickers. Go rest. It’ll be bright again.'],
    ['…Mm. Shaky light is still light. I can see it from here.',
     '…You did it while you weren’t sure. I think that’s the bravest kind of glow.'],
    ['…Mm. Okay. A nice, steady little light. Those last the longest.',
     '…Not too bright, not too dim. Just right for a quiet evening. Go rest.'],
    ['…Oh. That’s a good glow. I almost woke all the way up.',
     '…Mm. I’m lighting a lantern for that one. A nice warm one.'],
    ['…Wait, really? That’s so bright. I’m awake now. Fully. Well done.',
     '…Mm. That’s the brightest thing in the jar tonight. You made that.']],
  /* the companions, as toad-collection.js describes them: Neri mends and
     forgives; Oto is shy and keeps practising; Kuri says little and trusts
     roots; Mame is small, earnest and very excited about everything */
  neri:[null,
    ['Cracked? Good. Now I know where the gold goes. Bring it here, we’ll mend it tomorrow.',
     'Every potter has a rough firing. The clay isn’t ruined. You just found out where the heat was.'],
    ['Shaky is fine. A wobbly bowl still holds soup. Mine certainly do.',
     'Hm, uneven. I like uneven. It means a person made it, not a machine.'],
    ['Okay is a perfectly useful bowl. I’d eat out of it. I’d even put it on the good shelf.',
     'Not perfect, not ruined. That’s my favourite kind of thing. You can actually use it.'],
    ['Good! Solid walls, even rim. See what happens when you keep your hands steady?',
     'Oh, that’s a good one. I can tell you put the work in. It shows in the rim.'],
    ['Great? Then it goes on the top shelf, where everyone can see it. I insist.',
     'Look at that. Not a single crack. I almost don’t know what to do with myself.']],
  oto:[null,
    ['That one squeaked. Mine do too, sometimes. You play the next one anyway.',
     '…A wrong note isn’t the end of the song. It’s just a strange part of it. Keep going.'],
    ['A bit shaky… like my first try at a new tune. The second try is always better. Usually.',
     'You played it all the way through, even unsure. I think that’s harder than playing it perfectly.'],
    ['Okay is a steady note. Not loud. Steady notes hold the whole song together.',
     '…Mm. A middle note. Middle notes are underrated. I’d play it again.'],
    ['Oh. That sounds good. I, um. Good. I’m going to go practise now, but… good.',
     'That came out clean. Like a note you didn’t even have to think about. Nice.'],
    ['Great! I… don’t know what to say. Can I play something for you? Just a short one.',
     'A whole song and not one squeak. I’m a little jealous. Mostly proud.']],
  kuri:[null,
    ['Rough season. Happens. Roots don’t mind a bad week. They just keep going down.',
     'Leave it be tonight. Nothing grows from being pulled up and checked.'],
    ['Shaky’s fine. The ground shakes too. Roots hold anyway.',
     'Not your best week. Water it, rest it. Plants come back.'],
    ['Okay. That’s a plant doing its job. Nothing to fuss about.',
     'Steady growth. Most of it happens where nobody can see. Good.'],
    ['Good. You tended it. It showed. That’s how it works.',
     'Mm. Healthy. Don’t poke at it. Just enjoy it.'],
    ['Great. Told you. Roots do their best work without an audience.',
     'Look at that. All that quiet tending. It came up strong.']],
  mame:[null,
    ['Was it a bad test? That’s okay! When my boat sinks I call it a submarine. This can be a submarine.',
     'Oh no. Do you want to sit in my boat? It’s small but it’s very good for feeling better.'],
    ['Shaky? Like a boat in the wind? Boats in the wind still get places! I checked!',
     'You did it even when you weren’t sure! That’s what explorers do! I’m an explorer too!'],
    ['Okay is good! Okay means it floated! Mostly floated! That counts!',
     'Hmm. Okay. Is okay a little bit good? I think it’s a little bit good. I decided.'],
    ['GOOD?! That’s so good! Can I tell Hasu? I’m going to tell Hasu.',
     'You did good! I knew it! Well, I didn’t know it, but I hoped really, really hard!'],
    ['GREAT! That’s the best word! I’m going to hop! I’m hopping! Look!',
     'Great?! Wow. You’re like the captain of tests. Can I be your first mate?']]};

const rnd=a=>a[Math.floor(Math.random()*a.length)];
const motion=()=>{ try{ return typeof pondMotionOn==='function'?pondMotionOn():true; }catch(e){ return true; } };
function pickToad(){
  const have=TOADS.filter(n=>isCompanion(n)
    ?!!(window.ToadCompanions&&window.ToadCompanions.has(n))
    :!!(window.ToadArt&&window.ToadArt.TOADS&&window.ToadArt.TOADS[n]));
  if(!have.length) return null;
  let last=''; try{ last=localStorage.getItem(LAST)||''; }catch(e){}
  const pool=have.length>1?have.filter(n=>n!==last):have;
  const n=rnd(pool);
  try{ localStorage.setItem(LAST,n); }catch(e){}
  return n;
}
/* The water behind the toad, made from the pond kit (pond.js) exactly the
   way Today's hero water is: ripples, lily pads, drifting petals, glints,
   and a koi shadow passing underneath. The big pad grows the plant the
   Journal uses for a mood, matched to the answer (a closed bud for a rough
   one up to a lotus for a great one). The app's motion, ripple and petal
   settings apply as everywhere else. Built once the box has a size. */
const PLANT_FOR=[null,'bad','rough','okay','good','great'];
function pondScene(box,name,n){
  const P=window.Pond; if(!P||!box) return;
  const W=Math.round(box.clientWidth)||460, H=Math.round(box.clientHeight)||200;
  try{
    P.PF.motion=motion();
    P.reseed(7+TOADS.indexOf(name)*13+n);
    const k=[];
    k.push(P.deep('koi',P.loop(W*.5,H*.52,W*.36,H*.26,6,.4),46,TOADS.indexOf(name)%2===1,1.2));
    k.push(P.caustics(W,H,.22));
    [[W*.24,H*.38,110,0],[W*.78,H*.62,90,2],[W*.5,H*.3,140,4]].forEach(r=>k.push(P.ripple(+r[0].toFixed(1),+r[1].toFixed(1),r[2],r[3])));
    k.push(P.pad(+(W*.13).toFixed(1),+(H*.74).toFixed(1),36,40,'#5a8d69',PLANT_FOR[n]));
    k.push(P.pad(+(W*.9).toFixed(1),+(H*.2).toFixed(1),28,200,'#6f9e7a',null));
    k.push(P.pad(+(W*.8).toFixed(1),+(H*.9).toFixed(1),20,300,'#5f9470',null));
    k.push(P.petals(H,3));
    k.push(P.glints(W,H,9));
    const amb=box.querySelector('.amb'); if(amb) amb.innerHTML=k.join('');
  }catch(e){ try{ console.warn('exam-checkoff pond:',e); }catch(x){} }
}
function toadArt(name,face){
  /* a companion has its own moving drawing (Mame's hop, Oto's flute, Kuri's
     seedling, Neri's bowl) rather than swappable faces */
  if(isCompanion(name)){
    try{ window.ToadCompanions.injectCSS&&window.ToadCompanions.injectCSS(); return window.ToadCompanions.svg(name,{size:176}); }catch(e){ return ''; }
  }
  const o={size:176,perch:name==='hasu'?'pad':'own',water:true};
  try{ if(window.ToadExpressions) return window.ToadExpressions.svg(name,Object.assign({expression:face},o)); }catch(e){}
  try{ return window.ToadArt.svg(name,o); }catch(e){ return ''; }
}

/* ── step one: how did it feel? ── */
let C=null;
function open(id){
  const e=exam(id); if(!e) return;
  fixExam(e);
  if(e.done) return;
  if(e.examDate&&e.examDate>today()){ toast('You can tick it off on the day of the test.'); return; }
  const k=exKind(e);
  C={id};
  modal(`<div class="tcx">
    <span class="eyebrow" style="color:${k.c}">${k.t}${e.classId?' · '+esc(clsShort(e.classId)):''}</span>
    <h2 class="tcx-q">How did ${esc(e.title)} feel?</h2>
    <p class="tcx-sub">Ticking it off. One tap, then someone from the pond has a word for you.</p>
    <div class="tcx-scale" role="group" aria-label="How it felt, from 1 (rough) to 5 (great)">
      ${[1,2,3,4,5].map(n=>`<button type="button" class="tcx-n" data-tcx-n="${n}" style="--c:${FEEL[n].c}" aria-label="${n}, ${FEEL[n].t}"><b>${n}</b><span>${FEEL[n].t}</span></button>`).join('')}
    </div>
    <div class="tcx-foot"><span><kbd>1</kbd>–<kbd>5</kbd> to answer</span>
      <div class="tcx-b"><button type="button" class="ghost sm" data-tcx="skip">Tick it off without rating</button><button type="button" class="ghost sm" data-tcx="cancel">Not yet</button></div></div>
  </div>`);
  const m=document.querySelector('#modals .tcx'); if(!m) return;
  m.addEventListener('click',ev=>{
    const b=ev.target.closest('[data-tcx-n],[data-tcx]'); if(!b) return;
    if(b.dataset.tcxN) answer(+b.dataset.tcxN);
    else if(b.dataset.tcx==='skip') answer(null);
    else closeModal();
  });
  document.onkeydown=ev=>{ if(/^[1-5]$/.test(ev.key)&&!ev.repeat){ ev.preventDefault(); answer(+ev.key); } };
  const first=m.querySelector('.tcx-n'); if(first) try{ first.focus({preventScroll:true}); }catch(err){}
}
function answer(n){
  const e=C&&exam(C.id); if(!e||e.done) return;
  fixExam(e);
  toggleExam(e.id,true);
  e.felt=n||null; e.feltAt=Date.now();
  delete e.feltNote;
  if(n){ const note={id:uid(),at:Date.now(),text:`Took it. Felt ${n} of 5: ${FEEL[n].t.toLowerCase()}.`,session:null,cycle:null};
    e.log.push(note); e.feltNote=note.id; }
  save(); repaint();
  if(!n){ closeModal(); toast(`Ticked off ${e.title}.`); return; }
  speak(e,n);
}

/* ── step two: a toad answers ── */
let typeT=0;
function speak(e,n){
  const name=pickToad();
  if(!name){ closeModal(); toast(`Ticked off ${e.title}. Felt ${FEEL[n].t.toLowerCase()}.`); return; }
  const T=toadInfo(name), line=rnd(SAY[name][n]), mv=motion();
  modal(`<div class="tcx tcx-toad">
    <div class="tcx-water water${mv?' td-mv':''}" data-toad="${name}"><div class="amb"></div><div class="tcx-art">${toadArt(name,(FACE[name]||[])[n])}</div></div>
    <div class="tcx-say">
      <span class="eyebrow">${esc(T.title)}</span>
      <b class="tcx-name">${esc(T.name)}</b>
      <p class="tcx-line" aria-hidden="true"><span class="on"></span><span class="off"></span></p>
      <p class="tcx-sr" aria-live="polite"></p>
      <div class="tcx-felt" style="--c:${FEEL[n].c}"><i></i>${esc(e.title)} · ticked off · felt ${n} of 5</div>
      <div class="tcx-b"><button type="button" class="primary" data-tcx="close">Thanks, ${esc(T.name)}</button>
        <button type="button" class="ghost sm" data-tcx="undo">Undo</button></div>
    </div>
  </div>`);
  const m=document.querySelector('#modals .tcx'); if(!m) return;
  const on=m.querySelector('.tcx-line .on'), off=m.querySelector('.tcx-line .off'), art=m.querySelector('.tcx-water');
  pondScene(art,name,n);
  m.querySelector('.tcx-sr').textContent=line;
  let typing=false;
  const done=()=>{ clearTimeout(typeT); typing=false; on.textContent=line; off.textContent=''; if(art) art.classList.remove('td-talking'); };
  if(mv){
    typing=true; if(art) art.classList.add('td-talking');
    let k=0; on.textContent=''; off.textContent=line;
    const step=()=>{ if(!on.isConnected){ clearTimeout(typeT); return; }
      k++; on.textContent=line.slice(0,k); off.textContent=line.slice(k);
      if(k>=line.length){ done(); return; }
      const ch=line[k-1]; typeT=setTimeout(step,/[.?!…]/.test(ch)&&line[k]===' '?260:/[,;:—]/.test(ch)?130:28); };
    typeT=setTimeout(step,320);
  } else done();
  m.addEventListener('click',ev=>{
    const b=ev.target.closest('[data-tcx]');
    if(!b){ if(typing) done(); return; }
    if(b.dataset.tcx==='undo'){ clearTimeout(typeT); closeModal(); undo(e.id); }
    else { clearTimeout(typeT); closeModal(); }
  });
  document.onkeydown=ev=>{ if(ev.key==='Enter'&&!ev.repeat){ ev.preventDefault(); if(typing) done(); else { clearTimeout(typeT); closeModal(); } } };
  const b=m.querySelector('[data-tcx="close"]'); if(b) try{ b.focus({preventScroll:true}); }catch(err){}
}

/* ── taking it back ── */
function undo(id){
  const e=exam(id); if(!e) return;
  fixExam(e);
  toggleExam(e.id,false);
  if(e.feltNote) e.log=e.log.filter(x=>x.id!==e.feltNote);
  delete e.felt; delete e.feltAt; delete e.feltNote;
  save(); repaint();
  toast(`${e.title} isn’t ticked off any more.`);
}

window.TestCheck={open,undo,FEEL};
})();
