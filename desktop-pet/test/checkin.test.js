// the check-up's reading of what you said (checkin.js) and the nine voices (checkin-lines/), with plain node
const test=require('node:test'), assert=require('node:assert/strict');
const {read,reply,questions,topicOf}=require('../checkin');
const LINES=require('../checkin-lines');
const check=require('./voice-shape');

const TOADS=['hasu','ame','sumi','tabi','hotaru','neri','oto','kuri','mame'];
const first=a=>a[0];
/* every line a toad has, topics included */
const all=V=>Object.values(V).flatMap(v=>Array.isArray(v)?v:Object.values(v).flatMap(o=>[...o.yes,...o.no]));

test('a good thing instead of a bad one is praised, not scolded', ()=>{
  for(const s of ['instead of doom scrolling, I hit the gym','I hit the gym instead of doom scrolling',
    'went to the gym rather than doomscrolling','chose studying over tiktok']){
    const r=read(s);
    assert.equal(r.kind,'switched',s);
  }
  const r=read('instead of doom scrolling, I hit the gym');
  assert.match(r.did,/gym/); assert.match(r.avoided,/doom/);
});

test('kinds read from context, not keywords', ()=>{
  const cases={
    'I should be studying but I am on TikTok':'driftAware',
    'I put my phone away':'resisted',
    'scrolled reddit for a bit but now back to studying':'turnaround',
    'studied for an hour then ended up on youtube':'slipping',
    'just finished my calc homework':'finished',
    'was going to study but I napped':'missedOk',
    'I dont want to study':'reluctant',
    'about to start my essay':'plan',
    'eating dinner':'eating',
    'I feel overwhelmed':'struggle',
    'watching netflix':'unwinding',
    'watching netflix to unwind':'rest',
    'asdf qwer':'unknown',
  };
  for(const [s,k] of Object.entries(cases)) assert.equal(read(s).kind,k,s);
});

test('every toad has the full set of lines, in shape', ()=>{
  assert.deepEqual(Object.keys(LINES).sort(),[...TOADS].sort());
  for(const t of TOADS) assert.deepEqual(check(LINES[t]),[],t);
});

test('no two toads share a line', ()=>{
  const owner=new Map();
  for(const t of TOADS) for(const s of all(LINES[t])){
    assert.ok(!owner.has(s)||owner.get(s)===t,`${t} and ${owner.get(s)} both say: ${s}`);
    owner.set(s,t);
  }
});

test('each toad answers in its own voice, with names filled in', ()=>{
  const r=read('instead of doom scrolling, I hit the gym');
  const seen=new Set();
  for(const t of TOADS){
    const out=reply(r,{toad:t,topicOdds:0},first);
    assert.doesNotMatch(out,/\{|\}/,t); assert.match(out,/gym/i,t);
    seen.add(out);
  }
  assert.equal(seen.size,TOADS.length,'nine different replies');
});

test('kinds without a name never leave a hole, for any toad or kind', ()=>{
  const samples=['instead of doom scrolling, I hit the gym','I put my phone away','just finished my calc homework','studying',
    'scrolled reddit for a bit but now back to studying','studied for an hour then ended up on youtube',
    'I should be studying but I am on TikTok','scrolling tiktok','watching netflix to unwind','skipped the gym',
    'was going to study but I napped','I dont want to study','about to start my essay','eating dinner',
    'I feel overwhelmed','feeling great','asdf qwer','trying to do my homework but it is so hard'];
  for(const t of [undefined,...TOADS]) for(const s of samples) for(const hr of [10,23]) for(const prev of [null,'drift']) for(const topicOdds of [0,1]){
    const out=reply(read(s),{toad:t,hr,prev,topicOdds},first);
    assert.ok(out&&!/[{}]|undefined/.test(out),`${t} · ${s} → ${out}`);
  }
});

test('topics: the toad says something about the thing itself', ()=>{
  const want=[['studying calc','P','study'],['exam prep','P','study'],['the lab','P','homework'],['writing','P','essay'],
    ['email','P','work'],['the gym','X','gym'],['a run','X','run'],['swimming','X','sport'],['laundry','C','cleaning'],
    ['a shower','H','selfcare'],['dinner','E','food'],['mom','S','people'],['a nap','R','sleep'],['TikTok','D','scrolling'],
    ['your phone','D','scrolling'],['bed rotting','D','bedrot'],['gaming','W','gaming'],['Netflix','W','watching'],
    ['procrastinating','I','idle']];
  for(const [name,cat,k] of want) assert.equal(topicOf(name,cat),k,name);
  const sw=read('instead of doom scrolling, I hit the gym');
  for(const t of TOADS){
    const T=LINES[t].topics;
    /* switched: the gym that happened, or the scrolling that didn't */
    assert.ok(reply(sw,{toad:t,topicOdds:1},first).endsWith(' '+T.gym.yes[0]),t);
    assert.ok(reply(read('skipped the gym'),{toad:t,topicOdds:1},first).endsWith(' '+T.gym.no[0]),t);
    assert.ok(reply(read('scrolling tiktok'),{toad:t,topicOdds:1},first).endsWith(' '+T.scrolling.yes[0]),t);
    assert.ok(!reply(sw,{toad:t,topicOdds:0},first).includes(T.gym.yes[0]),t);
  }
});

test('questions: one voice per toad, by time of day, and about last time', ()=>{
  for(const t of TOADS){
    const V=LINES[t];
    assert.deepEqual(questions({toad:t,hr:14}),[...V.ask,...V.askAfternoon]);
    assert.deepEqual(questions({toad:t,hr:8}),[...V.ask,...V.askMorning]);
    assert.deepEqual(questions({toad:t,hr:20}),[...V.ask,...V.askEvening]);
    assert.deepEqual(questions({toad:t,hr:1}),V.askLate);
    assert.deepEqual(questions({toad:t,hr:14,away:true}),V.askBack);
    assert.deepEqual(questions({toad:t,hr:14,onBreak:true}),V.askBreak);
    const good=questions({toad:t,hr:14,prev:'switched',prevDid:'the gym'}), bad=questions({toad:t,hr:14,prev:'drift',prevDid:'TikTok'});
    assert.equal(good.length,V.ask.length+V.askAfternoon.length+V.askPrevGood.length,t);
    assert.equal(bad.length,V.ask.length+V.askAfternoon.length+V.askPrevDrift.length,t);
    for(const q of [...good.slice(-V.askPrevGood.length),...bad.slice(-V.askPrevDrift.length)]){
      assert.doesNotMatch(q,/[{}]/,q); assert.match(q,/gym|TikTok/i,q);
    }
  }
  assert.ok(questions({hr:14}).length>=8);
});
