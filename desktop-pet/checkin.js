/* checkin.js · Catching Days desktop pet · the check-up: what the toad asks, and how it reads your answer
   Nothing leaves the computer and there's no AI service behind it. The answer is read the
   old way: a small lexicon of things people do (studying, the gym, scrolling, a nap…), and
   then the words around each one decide what actually happened to it:
     · "instead of / rather than / stopped / put down / skipped / didn't…" in front of it
       (or "down / away" after it) means you turned it down, so "the gym instead of doom
       scrolling" is a win, never a scolding for the word "scrolling";
     · "going to / about to / should / need to…" in front of it means not done yet;
     · "and" or another thing you did ends that reach, so "stopped scrolling and started
       homework" doesn't turn the homework down too.
   The mix (did something good, turned something down, drifting but knows it, tired…)
   picks the kind of reply, and the reply names what you said back to you.
   read(text,ctx) → {kind,did,avoided,want,feel,…}; reply(r,ctx,pick); questions(ctx). */
(function(){
'use strict';

/* what people do, longest phrases first. cat: P study/work, X exercise, C chores,
   H self-care, E food, S people, R rest, D drift, W watching/games, I idle */
const LEX=[
  [/\bdoomscroll\w*/,'doom scrolling','D'],
  [/\bbed ?rot\w*|\brotting in bed\b|\blying in bed\b/,'bed rotting','D'],
  [/\bnot doing (anything|much)\b|\bdoing nothing\b|\bnothing (much|really|productive)\b|\bnot much\b|\bnothing\b/,'nothing much','I'],
  [/\bprocrastinat\w*|\bwast(ing|ed) (my )?time\b|\btime wast\w*|\bslack(ing|ed)( off)?\b|\bzon(ing|ed) out\b|\bgoofing off\b|\bmessing around\b/,'procrastinating','I'],
  [/\b(tiktok|instagram|insta|reels|youtube shorts|shorts|twitter|reddit|snapchat|facebook|social media|threads)\b/,m=>({tiktok:'TikTok',instagram:'Instagram',insta:'Instagram',reels:'Reels','youtube shorts':'YouTube Shorts',shorts:'YouTube Shorts',twitter:'Twitter',reddit:'Reddit',snapchat:'Snapchat',facebook:'Facebook','social media':'social media',threads:'Threads'})[m]||m,'D'],
  [/\bscroll\w*/,'scrolling','D'],
  [/\b(on )?(my|the) phone\b|\bphone\b/,'your phone','D'],
  [/\b(video games?|gaming|games|valorant|fortnite|minecraft|roblox|league of legends|league|xbox|playstation|ps5|steam)\b/,'gaming','W'],
  [/\b(youtube|netflix|hulu|disney plus|twitch|tv|anime|a show|shows|series|a movie|movies?|binge\w*|episodes?)\b/,m=>/binge/.test(m)?'bingeing':/^(a show|shows|series|episodes?)$/.test(m)?'a show':/movie/.test(m)?'a movie':m==='tv'?'TV':m==='youtube'?'YouTube':m==='netflix'?'Netflix':m==='hulu'?'Hulu':m==='twitch'?'Twitch':m,'W'],
  [/\b(hit|went to|go to|going to|at|in) the gym\b|\bgym\b/,'the gym','X'],
  [/\bwork(ing|ed)? ?out\b|\bworkout\b|\blift(ing|ed)\b|\bweights\b|\bexercis\w*/,'a workout','X'],
  [/\b(went for|go for|going for|on) a (run|jog)\b|\brunning\b|\bjogg\w*/,'a run','X'],
  [/\b(yoga|pilates|stretch\w*|swim\w*|hik(e|ing)|bik(e|ing)|cycling|basketball|soccer|football|tennis|volleyball|climbing|boxing)\b/,m=>m,'X'],
  [/\b(went for|go for|going for|on|took) a walk\b|\bwalk(ing|ed)?\b/,'a walk','X'],
  [/\bhomework\b|\bhw\b|\bproblem sets?\b|\bpsets?\b|\bworksheets?\b/,'homework','P'],
  [/\bassignments?\b/,'the assignment','P'],
  [/\blab( reports?)?\b/,'the lab','P'],
  [/\b(essay|paper|report)s?\b/,'the essay','P'],
  [/\b(stud(y|ying|ied)|revis\w*|review\w*|cramm?\w*|flashcards?|anki|quizlet|practice problems?|practice exams?|textbook|notes)\b/,'studying','P'],
  [/\b(exam|midterm|final|quiz) (prep|review|studying)\b/,'exam prep','P'],
  [/\b(calc|calculus|math|physics|chem|chemistry|biology|spanish|history|economics|c programming)\b/,m=>'studying '+m,'P'],
  [/\b(lectures?|class|classes|seminar|tutoring|office hours|lessons?)\b/,'class','P'],
  [/\b(cod(e|ing)|programm\w*|debugg?\w*|leetcode)\b/,'coding','P'],
  [/\bproject\b/,'the project','P'],
  [/\b(writ(e|ing)|drafting)\b/,'writing','P'],
  [/\bread(ing)?\b(?!\s+(on\s+)?(reddit|twitter|tiktok|instagram|comments|the news|news))/,'reading','P'],
  [/\b(my )?(work|job|shift|emails?|meeting)\b/,m=>/email/.test(m)?'email':/meeting/.test(m)?'a meeting':'work','P'],
  [/\b(clean\w*|tid(y|ying|ied)( up)?|laundry|dishes|chores?|vacuum\w*|organi[sz]\w*|errands?|groceries|grocery shopping)\b/,m=>/clean|tid/.test(m)?'cleaning':/laundry/.test(m)?'laundry':/dishes/.test(m)?'doing dishes':/errand|grocer/.test(m)?'running errands':/organi/.test(m)?'organizing':'housework','C'],
  [/\b(cook\w*|meal prep\w*)\b/,'cooking','C'],
  [/\b(meditat\w*|journal\w*|shower\w*|a bath|skincare|drank water|drinking water|hydrat\w*|fresh air|went outside|going outside|sunlight|therapy|pray\w*|planning (my|the) (day|week))\b/,m=>/meditat/.test(m)?'meditating':/journal/.test(m)?'journaling':/shower|bath/.test(m)?'a shower':/water|hydrat/.test(m)?'water':/outside|fresh air|sunlight/.test(m)?'fresh air':/plan/.test(m)?'planning':m,'H'],
  [/\b(eat\w*|ate|lunch|dinner|breakfast|brunch|snack\w*|food|a meal)\b/,m=>/lunch|dinner|breakfast|brunch/.test(m)?m:/snack/.test(m)?'a snack':'food','E'],
  [/\b(hang\w* out|friends?|family|mom|dad|parents|sister|brother|girlfriend|boyfriend|partner|roommates?|facetim\w*)\b/,m=>/hang/.test(m)?'friends':m,'S'],
  [/\b(sleep\w*|slept|naps?|napping|napped|lying down|lay down)\b/,m=>/nap/.test(m)?'a nap':'sleep','R'],
  [/\b(on|taking|take|took) a (short |quick |little )?break\b|\bbreak\b|\bbreather\b|\brelax\w*|\bunwind\w*|\bchill(ing|ed)?\b/,'a break','R']
];
const FEEL_BAD=/\b(tired|exhausted|sleepy|drained|stress(ed)?|anxious|anxiety|overwhelm\w*|burn(ed|t) ?out|sad|depressed|frustrated|stuck|bored|sick|headache|cramps|unmotivated|no motivation|lonely|panick\w*|falling behind|struggling|confus\w*|difficult)\b|\b(it is|this is|so|really|too) hard\b|\b(feeling|feel|felt|am|so|bit|kinda|pretty) down\b/g;
const FEEL_GOOD=/\b(proud|productive|focused|motivated|great|happy|amazing|on a roll|in the zone|locked in|in flow|energi[sz]ed|accomplished|confident|calm)\b/g;
/* the reach of these runs back from a thing to the last thing or "and" before it */
const REJECT=/\b(not|no|never|instead of|rather than|stop|stopped|stopping|quit|quitting|avoid|avoided|avoiding|resist|resisted|resisting|skip|skipped|skipping|without|less|cut back on|cutting back on|no more|enough|put down|put away|deleted|uninstalled|log(ged|ging)? off|got off|get off|getting off|turned off|away from|ditched|done with|finished)\b/g;
const INTENT=/\b(going to|about to|plan(ning)? (to|on)|will|want(ed)? to|need(s)? to|have to|has to|got to|should( be)?|supposed to|meant to|hope to|hoping to|might|ought to|getting ready to|get ready to|later)\b/g;
const DONE=/\b(just|finally|finished|done|completed|got through|wrapped up|knocked out|crushed|submitted)\b/;
const PAST_INTENT=/\b(was going to|were going to|wanted to|meant to|supposed to|should have|planned to|was planning)\b/;
const RELUCTANT=/\bnot (want|feel like|feeling)\b|\bdread\w*/;
const TRYING=/\b(trying to|try to|attempting)\b/;
const STARTED=/\b(start(ed|ing)?|began|beginning|got (back )?to|back to|switched to|moved on to)\b/;
const AFTER_REJECT=/^\s*(down|away|aside|off)\b/;
const GOOD='PXC', CARE='HESR', BAD='DWI';

function norm(t){
  return ' '+String(t||'').toLowerCase()
    .replace(/[’‘`]/g,"'")
    .replace(/\b(\w+)n't\b/g,'$1 not').replace(/\bi'?m\b/g,'i am').replace(/\b(it|that|this|there|what)'s\b|\b(it|that)s\b/g,'$1$2 is')
    /* typed without the apostrophe, the way people text */
    .replace(/\b(do|did|does|ca|wo|is|are|was|were|have|has|should|could|would)nt\b/g,'$1 not').replace(/'re\b/g,' are').replace(/'ve\b/g,' have')
    .replace(/'ll\b/g,' will').replace(/\bgonna\b/g,'going to').replace(/\bwanna\b/g,'want to').replace(/\bgotta\b/g,'got to')
    .replace(/doom[\s-]*scroll/g,'doomscroll').replace(/tik[\s-]*tok/g,'tiktok').replace(/you[\s-]*tube/g,'youtube').replace(/work[\s-]out/g,'workout')
    .replace(/[^a-z0-9'.,;!?\s]/g,' ').replace(/\s+/g,' ')+' ';
}
/* where you ended up counts most: a clause after "but", "then", "now" or "so" is later */
function clauses(t){
  const out=[]; let late=0;
  t.split(/[.;!?,]+|\b(?=but\b|then\b|however\b|although\b|though\b|so\b|now\b)/).forEach(c=>{
    if(!c||!c.trim()) return;
    if(/^\s*(but|then|however|now|so)\b/.test(c)) late++;
    out.push({text:' '+c.trim()+' ',late});
  });
  return out;
}
const lastMatch=(re,s)=>{ re.lastIndex=0; let m, end=-1; while((m=re.exec(s))) end=m.index+m[0].length; return end; };

function read(text,ctx){
  ctx=ctx||{};
  const t=norm(text), hits=[];
  clauses(t).forEach((cl,ci)=>{
    const taken=[];
    const s=cl.text;
    LEX.forEach(([re,name,cat])=>{
      const g=new RegExp(re.source,'g'); let m;
      while((m=g.exec(s))){
        const a=m.index, b=a+m[0].length;
        if(taken.some(([x,y])=>a<y&&b>x)) continue;
        taken.push([a,b]);
        const word=m[0].trim();
        hits.push({name:typeof name==='function'?name(word):name,cat,a,b,ci,late:cl.late,s});
      }
    });
    /* how each one stands, from the words just before (and just after) it */
    const mine=hits.filter(h=>h.ci===ci).sort((x,y)=>x.a-y.a);
    mine.forEach((h,i)=>{
      const from=i?mine[i-1].b:0;
      let win=s.slice(from,h.a);
      const and=win.lastIndexOf(' and '); if(and>=0) win=win.slice(and+4);
      win=win.split(' ').filter(Boolean).slice(-6).join(' ');
      win=' '+win+' ';
      const rj=lastMatch(REJECT,win), it=lastMatch(INTENT,win);
      /* "X over Y": Y was passed over */
      const over=i>0&&/^\s*over\b/.test(s.slice(from,h.a));
      h.state=over||(rj>=0&&rj>=it)||AFTER_REJECT.test(s.slice(h.b))?'rejected':it>=0?'intent':'done';
      /* finishing a good thing is doing it; finishing a bad one is stopping it */
      if(h.state==='rejected'&&GOOD.includes(h.cat)&&/\b(done with|finished)\b/.test(win)&&!/\b(not|no|never|skip\w*|instead of|rather than)\b/.test(win)) h.state='done';
      h.complete=DONE.test(win);
      h.trying=TRYING.test(win);
      h.past=h.state==='intent'&&PAST_INTENT.test(win);
      if(GOOD.includes(h.cat)&&RELUCTANT.test(win)) h.state='reluctant';
      h.started=STARTED.test(win);
    });
  });
  hits.sort((x,y)=>x.ci-y.ci||x.a-y.a);
  /* feelings: "not stressed" is the opposite of stressed */
  let fb=0, fg=0;
  const feel=(re,s,on)=>{ re.lastIndex=0; let m; while((m=re.exec(s))){ const neg=/\b(not|no|never|less)\s+(\w+\s+)?$/.test(s.slice(Math.max(0,m.index-14),m.index)); if(neg) on(-1); else on(1); } };
  feel(FEEL_BAD,t,d=>{ if(d>0) fb++; else fg++; });
  feel(FEEL_GOOD,t,d=>{ if(d>0) fg++; else fb++; });
  if(/\bnot (bad|terrible)\b/.test(t)) fg++;

  const by=(st,cats)=>hits.filter(h=>h.state===st&&cats.includes(h.cat));
  const didGood=by('done',GOOD), didBad=by('done',BAD), didCare=by('done',CARE);
  const rejBad=by('rejected',BAD), rejGood=by('rejected',GOOD), wantGood=by('intent',GOOD).concat(by('intent','H'));
  const done=hits.filter(h=>h.state==='done');
  const last=done[done.length-1]||null;
  const onBreak=didCare.some(h=>h.name==='a break'||h.cat==='E')||!!ctx.onBreak;
  const social=didCare.some(h=>h.cat==='S');
  const long=/\bfor (\d+|a few|a couple( of)?|like \d+) hours?\b|\ball (day|morning|afternoon|night|evening)\b|\bfor hours\b/.test(t);
  const name=a=>a.length?a[a.length-1].name:'';
  const r={kind:'unknown',did:'',avoided:'',want:'',feel:fb>fg?'bad':fg>fb?'good':null,long,hits:hits.map(h=>({name:h.name,cat:h.cat,state:h.state}))};

  if(didGood.length&&rejBad.length){ r.kind='switched'; r.did=name(didGood); r.avoided=rejBad[0].name; }
  else if(didBad.length&&!didGood.length&&(wantGood.length||rejGood.length)){
    r.want=(wantGood[0]||rejGood[0]).name; r.did=name(didBad);
    r.kind=onBreak?'rest':'driftAware';
  }
  else if(didGood.length&&didBad.length){
    r.did=name(didGood); r.avoided=name(didBad);
    r.kind=GOOD.includes(last.cat)?'turnaround':'slipping';
  }
  else if(rejBad.length&&!didBad.length){ r.kind='resisted'; r.avoided=rejBad[0].name; r.did=name(didCare); }
  else if(didBad.length){
    r.did=name(didBad);
    r.kind=onBreak||social?'rest':didBad.every(h=>h.cat==='W')&&!long?'unwinding':'drift';
    if(r.kind==='rest'&&!r.did) r.did='a break';
  }
  else if(didGood.length){
    const g=didGood[didGood.length-1]; r.did=g.name;
    r.kind=didGood.some(h=>h.complete)?'finished':didGood.some(h=>h.trying)?'trying':didGood.some(h=>h.started)?'started':'good';
    if(rejGood.length) r.avoided=rejGood[0].name;
  }
  else if(by('reluctant',GOOD).length){ r.want=by('reluctant',GOOD)[0].name; r.kind='reluctant'; }
  else if(rejGood.length){ r.avoided=rejGood[0].name; r.did=name(didCare); r.kind=fb||didCare.some(h=>h.cat==='R')?'missedOk':'missed'; }
  /* "was going to study but…": that plan didn't happen */
  else if(wantGood.length&&wantGood.every(h=>h.past)){ r.avoided=wantGood[0].name; r.did=name(didCare); r.kind=didCare.length||fb?'missedOk':'missed'; }
  else if(wantGood.length){ r.want=wantGood[0].name; r.kind='plan'; }
  else if(didCare.length){ const c=didCare[didCare.length-1]; r.did=c.name;
    r.kind=c.cat==='R'?'rest':c.cat==='E'?'eating':c.cat==='S'?'social':'selfcare'; }
  else if(fb) r.kind='struggle';
  else if(fg) r.kind='upbeat';
  return r;
}

/* ── what the toad says back ── */
const R={
  switched:['{Did} instead of {avoided}? That’s a really good trade.','Wow, {did} over {avoided}. That was a good choice.',
    'You picked {did} when {avoided} was right there. That’s the hard part, and you did it.','{Avoided} lost this round. {Did} won. Good.',
    'Choosing {did} over {avoided} is exactly how a good day gets built.'],
  resisted:['Putting {avoided} down is harder than it sounds. Good call.','Saying no to {avoided}? Nice. That’s a quiet little win.',
    'Stepping away from {avoided}. I like that. What’s next?','You turned down {avoided}. That counts for more than people think.'],
  finished:['You finished {did}? That’s a fish in the pond. Well done.','{Did}, done. Take a breath. You earned it.',
    'Done with {did}! Tick it off in Tasks if it’s there.','Finished {did}. That’s real progress, not just busy.'],
  good:['{Did}. Good. Keep that going.','Ah, {did}. Steady work. I’ll keep quiet.','{Did} right now? That’s a good use of the hour.',
    'Nice, {did}. Don’t forget a break when the bell would ring.','{Did}. I like it. Small steps fill the pond.'],
  started:['Getting started on {did} is the hardest bit. You’re past it.','You started {did}. That’s the whole trick, honestly.',
    'Starting {did}. Good. Just the next ten minutes, then see.'],
  trying:['Trying is doing. Keep at {did}, even slowly.','Even a messy go at {did} beats none. Keep nudging it.',
    '{Did} is fighting back? Make it smaller: one line, one problem.'],
  turnaround:['From {avoided} back to {did}. Nice turnaround.','You drifted to {avoided} and came back to {did}. That’s the skill.',
    'Back on {did} after {avoided}. That’s how it works for everyone.'],
  slipping:['Some {did}, then {avoided}. That’s okay. Can you give {did} ten more minutes?','You got {did} in before {avoided}. Want to go back for one more round?',
    '{Avoided} crept in after {did}. Happens. Phone face-down and one more push?'],
  driftAware:['{Did} when you meant to get to {want}. No lecture. What’s the tiniest piece of {want} you could do?',
    'You know {want} is waiting, and that’s half of it. Five minutes of {want}, then decide.',
    'It’s okay. {Did} pulls hard. Try just opening {want}, nothing more.','Noticing it is the first step. {Want}, just for one short block?'],
  drift:['{Did} for a bit? Fair. When you’re ready, pick one small thing.','Okay, {did}. No judgment. Want to set a timer and come back after?',
    '{Did} happens to everyone. What’s one thing you could start in five minutes?','Thanks for being honest. {Did} now, something small next?'],
  unwinding:['{Did}? Nice way to unwind. Just keep an eye on the clock.','A little {did} is fine. Enjoy it, then back to it.',
    '{Did} sounds like a decent break. Don’t let it eat the evening.'],
  missed:['Skipped {avoided} this time? That’s okay. One miss isn’t a pattern.','Not {avoided} right now. Fair. What would make it easier to start?',
    '{Avoided} slipped. It happens. Want to put it on tomorrow’s list?'],
  missedOk:['Skipping {avoided} when you need rest is a good call, not a bad one.','{Avoided} can wait. Looking after yourself counts too.',
    'Rest first, {avoided} later. That’s fair.'],
  reluctant:['Not feeling {want}? Fair. Could you do five minutes of it, then decide?','{Want} feels heavy right now. Make it tiny: just open it.',
    'Nobody wants to sometimes. Start {want} badly, on purpose. Badly still counts.'],
  plan:['{Want} next? Good plan. Start with the smallest bit.','About to do {want}. Want me to start a focus session?',
    '{Want}, coming up. Go on, I’m cheering quietly.','A plan for {want}. Good. Start before you feel ready.'],
  rest:['{Did}. Rest is part of the work. Enjoy it.','Good, {did}. Come back fresh.','{Did}? Sensible. The pond can wait a little.'],
  eating:['{Did}! Good. Fuel first.','Eating is never wasted time. Enjoy {did}.','{Did}. Nice. Drink some water too.'],
  social:['Time with {did}. That matters more than any task.','{Did}? Good. People are good for you.','Enjoy {did}. The list will still be here.'],
  selfcare:['{Did}. Good. Looking after yourself counts.','Ah, {did}. Very sensible.','{Did}. That’s the kind of thing that makes the rest go better.'],
  struggle:['That sounds hard. You don’t have to fix the whole day. Just the next small thing, or a rest.','I hear you. Water, a stretch, then see how you feel?',
    'Rough patch. Be kind to yourself. One tiny thing counts.'],
  upbeat:['Love that. Ride it while it lasts.','Good! Keep that feeling going.','That’s what I like to hear.'],
  unknown:['Got it. Noted in your journal.','Thanks for telling me. It’s in your journal.','Okay. I wrote that down for you.','Noted. Carry on.']
};
const FEEL_BAD_ADD=[' And go easy on yourself after this.',' Rest after, too.'];
const LATE_ADD=[' It’s late, though. Don’t trade your sleep for it.',' Mind the hour. Sleep is studying too.'];
const LONG_ADD=[' A few hours is a lot, though. Maybe a walk to reset?'];
const BACK_ADD=['Nice turnaround since last time. ','Better than last time! '];

const cap=s=>s?s[0].toUpperCase()+s.slice(1):s;
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function fill(t,r){
  return t.replace(/\{(did|Did|avoided|Avoided|want|Want)\}/g,(m,k)=>{ const v=r[k.toLowerCase()]||{did:'that',avoided:'that',want:'it'}[k.toLowerCase()];
    return k[0]===k[0].toUpperCase()?cap(v):v; });
}
const GOODISH=['switched','resisted','finished','good','started','trying','turnaround'];
/* each toad's own lines (checkin-lines/<toad>.js); a kind it doesn't have uses the plain ones above */
const VKEY={started:'good',trying:'good',rest:'care',eating:'care',social:'care',selfcare:'care'};
const voices=()=>typeof window!=='undefined'&&window.CHECKIN_LINES||(typeof require==='function'?require('./checkin-lines'):{});
const voice=toad=>toad&&voices()[toad]||null;

/* a toad sometimes adds a line about the thing itself (the gym is not calc is not laundry):
   which topic a name belongs to, and for each kind which name it's about and whether that
   one happened (yes) or didn't (no). Skipped to rest (missedOk) gets none: a nudge would undo "rest was right" */
const TOPIC_NAME={'exam prep':'study',homework:'homework','the assignment':'homework','the lab':'homework','the project':'homework',
  'the essay':'essay',writing:'essay',reading:'reading',coding:'coding',class:'class',work:'work',email:'work','a meeting':'work',
  'the gym':'gym','a workout':'gym','a run':'run','a walk':'walk',cooking:'cooking','a nap':'sleep',sleep:'sleep','a break':'break',
  'bed rotting':'bedrot',gaming:'gaming'};
const TOPIC_CAT={X:'sport',C:'cleaning',H:'selfcare',E:'food',S:'people',D:'scrolling',W:'watching',I:'idle'};
function topicOf(name,cat){
  if(!name) return '';
  if(/^studying\b/.test(name)) return 'study';
  return TOPIC_NAME[name]||TOPIC_CAT[cat]||'';
}
const TOPIC_SIDE={switched:'did yes avoided no',resisted:'avoided no',finished:'did yes',good:'did yes',started:'did yes',trying:'did yes',
  turnaround:'did yes',slipping:'avoided yes',driftAware:'did yes want no',drift:'did yes',unwinding:'did yes',missed:'avoided no',
  reluctant:'want no',plan:'want yes',rest:'did yes',eating:'did yes',social:'did yes',selfcare:'did yes'};
function topicLine(V,r,pick){
  const s=(TOPIC_SIDE[r.kind]||'').split(' '), pools=[];
  if(!V.topics) return '';
  for(let i=0;i+1<s.length;i+=2){
    const name=r[s[i]], h=(r.hits||[]).find(x=>x.name===name), o=V.topics[topicOf(name,h&&h.cat)];
    if(o&&o[s[i+1]]&&o[s[i+1]].length) pools.push(o[s[i+1]]);
  }
  return pools.length?pick([].concat(...pools)):'';
}

function reply(r,ctx,pick){
  ctx=ctx||{}; pick=pick||rnd;
  const V=voice(ctx.toad)||{};
  const has=t=>(!/\{(did|Did)\}/.test(t)||r.did)&&(!/\{(avoided|Avoided)\}/.test(t)||r.avoided)&&(!/\{(want|Want)\}/.test(t)||r.want);
  /* a line that needs a name it doesn't have is left out */
  let pool=(V[r.kind]||V[VKEY[r.kind]]||[]).filter(has);
  if(!pool.length) pool=(R[r.kind]||[]).filter(has);
  if(!pool.length) pool=V.unknown||R.unknown;
  let out=fill(pick(pool),r);
  if(GOODISH.includes(r.kind)&&['drift','driftAware','slipping'].includes(ctx.prev)) out=pick(V.back||BACK_ADD)+out;
  if(r.kind==='drift'&&r.long) out+=pick(V.long||LONG_ADD);
  else if(GOODISH.includes(r.kind)&&r.feel==='bad') out+=pick(V.tired||FEEL_BAD_ADD);
  else if(['good','started','trying','plan'].includes(r.kind)&&(ctx.hr>=23||ctx.hr<4)) out+=pick(V.late||LATE_ADD);
  /* ctx.topicOdds: 1 always adds the topic line, 0 never (tests) */
  else if(Math.random()<(ctx.topicOdds==null?0.6:ctx.topicOdds)){ const t=topicLine(V,r,pick); if(t) out+=' '+t; }
  return /^…/.test(out)?out:cap(out);
}

/* ── what the toad asks: a different way each time, from what it knows ── */
const ASK={
  ask:['What are you up to right now?','Quick check-in. What are you doing?','Hey. What’s got your attention at the moment?',
    'Pond check! What are you working on?','Just peeking in. What’s happening over there?','Tell me honestly: what are you doing right now?',
    'How’s it going? What are you in the middle of?','What did the last little while look like?'],
  askMorning:['Morning check-in. How’s the day starting?'],askAfternoon:['Afternoon check-in. What are you doing?'],
  askEvening:['Evening check-in. What are you up to?'],
  askBack:['Welcome back. What were you up to?','You’re back. What have you been doing?'],
  askLate:['It’s late. What are you still up to?','Still awake? What are you doing?'],
  askBreak:['On a break? What are you doing with it?'],
  askPrevGood:['Last time it was {prev}. Still at it, or something new?'],askPrevDrift:['Last time it was {prev}. Where are you now?']
};
function questions(ctx){
  ctx=ctx||{};
  const hr=ctx.hr, V=voice(ctx.toad)||{}, L=k=>V[k]||ASK[k];
  if(ctx.away) return L('askBack');
  if(hr>=23||hr<4) return L('askLate');
  if(ctx.onBreak) return L('askBreak');
  if(ctx.now) return [`Your calendar says “${ctx.now}”. Is that what you’re doing?`];
  const q=L('ask').slice();
  const tod=hr>=5&&hr<12?'askMorning':hr>=12&&hr<18?'askAfternoon':hr>=18&&hr<23?'askEvening':'';
  if(tod) q.push(...L(tod));
  const p=ctx.prevDid, prev=k=>L(k).map(s=>s.replace(/(^|[.!?…]\s*)\{prev\}/g,(m,a)=>a+cap(p)).replace(/\{prev\}/g,p));
  if(p&&GOODISH.includes(ctx.prev)) q.push(...prev('askPrevGood'));
  if(p&&['drift','driftAware','slipping','unwinding'].includes(ctx.prev)) q.push(...prev('askPrevDrift'));
  return q;
}

const API={read,reply,questions,norm,topicOf};
if(typeof window!=='undefined') window.CHECKIN=API;
if(typeof module!=='undefined') module.exports=API;
})();
