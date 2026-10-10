/* pet-lines.js · Catching Days desktop pet · what each toad says on your desktop
   One entry per toad, same voices as toads.js, toad-lines.js and exam-checkoff.js.
   Keys per toad:
     hello (6)   tapped, chat opens        idle (10)   general chat instead of hello
     ctx (9)     {id, when(s), t(s)} in priority order, first match wins
     done (6)    a task checked off; {task} is replaced with a shortened title
     undone (2)  allDone (3)  focusStart (4)  bell (4)  breakStart (3)
     breakOver (3)  sessionEnd (3)  peek (4)  pulled (4)  choose (2)
     ready (4)  committed (4)  notYet (3)   the focus ritual, added below
   s: hr, total, done, left, overdue, running, phase, paused, cycles, mins, goal,
      next {title,inMin}|null, now {title,untilMin}|null, exam {title,days}|null, peeking.
   In the pond: a finished task is a fish released, focus minutes open the lotus,
   overdue tasks wait in the reeds. */
(function(){
'use strict';
const pl=(n,w)=>n===1?w:w+'s';
const short=(x,n)=>x.length>n?x.slice(0,n-1).trimEnd()+'…':x;
/* a calendar or exam title, shortened, with a fallback if it is missing */
const ttl=(x,n,f)=>short(String(x||f),n);
const inMin=s=>Math.max(0,Math.round(+s.next.inMin||0));
const days=s=>Math.max(0,Math.round(+s.exam.days||0));
/* the nine conditions every toad's ctx covers, in priority order */
const W={
  peek: s=>!!s.peeking,
  focus:s=>!!s.running&&s.phase==='focus',
  brk:  s=>!!s.running&&s.phase==='break',
  next: s=>!!s.next&&s.next.inMin<=30,
  late: s=>s.hr>=23||s.hr<4,
  exam: s=>!!s.exam&&s.exam.days>=0&&s.exam.days<=3,
  all:  s=>s.total>0&&s.left===0,
  bloom:s=>s.goal>0&&s.mins>=s.goal,
  reeds:s=>s.overdue>=3
};
const L={

/* ── Hasu · Keeper of the Lotus: old, dry, kind, two hundred summers ── */
hasu:{
  hello:[
    'Hm. You tapped. I was only pretending to nap. What do you need?',
    'Ah, it’s you. Sit a moment. What are we catching today?',
    'Hm. The pond is quiet. Good time to ask an old toad something.',
    'Two hundred summers, and still people tap me on the head. Go on, then.',
    'You came by. I like that. Tasks, the timer, or just company?',
    'Hm. Speak up, my ears are older than most ponds. What is it?'],
  idle:[
    'Nobody ever finished a day by staring at all of it. Look at one corner.',
    'Hm. The koi don’t rush, and they’re very good at being koi.',
    'Mud is just a lotus that hasn’t started yet. Don’t insult the mud.',
    'You don’t need a perfect hour. You need a real one.',
    'I’ve watched a lot of people get things done. Most of them were tired, too.',
    'One fish at a time. The pond never asked for a flood.',
    'Hm. A long list is only a short list wearing a big coat.',
    'Sit on the work like a toad on a pad. Not forever. Just long enough.',
    'The lotus doesn’t open faster if you shout at it. I’ve tried.',
    'I’m on your desktop now. Two hundred summers on a pad, and now this. Hm. I like it.'],
  ctx:[
    {id:'peek', when:W.peek, t:()=>'I’m only half here. The other half is resting behind the edge. Pull me out when you need me.'},
    {id:'focus',when:W.focus, t:s=>s.paused?'Paused. Hm. The water will wait, but don’t let it go cold.'
      :'You’re mid-session. Back to it. I’ll keep the koi quiet.'},
    {id:'break',when:W.brk, t:()=>'A break. Good. Stretch something. Look at something far away. Not me.'},
    {id:'next', when:W.next, t:s=>{ const n=inMin(s),x=ttl(s.next.title,30,'Your next thing');
      return n<=0?`${x} is starting. Off you hop.`:`${x} in ${n} ${pl(n,'minute')}. Finish your sentence, then go.`; }},
    {id:'late', when:W.late, t:()=>'It’s late. The lotus closes at night, and so should you. The rest keeps.'},
    {id:'exam', when:W.exam, t:s=>{ const d=days(s),x=ttl(s.exam.title,36,'The exam');
      return d===0?`${x} is today. Breathe slow. You’ve put in more than you remember.`
        :d===1?`${x} tomorrow. Review a little, then sleep a lot. Sleep is studying too.`
        :`${x} in ${d} ${pl(d,'day')}. Plenty of time, if you start today. Hm.`; }},
    {id:'all',  when:W.all, t:()=>'Every task today is in the pond. Hm. Go and do nothing on purpose for a while.'},
    {id:'bloom',when:W.bloom, t:()=>'The lotus is open all the way. Whatever else you do today is extra. I noticed.'},
    {id:'reeds',when:W.reeds, t:s=>`${s.overdue} in the reeds. Don’t wade in after all of them. Pick the smallest and pull.`}],
  done:[
    'Hm. “{task}” is swimming in the pond now. Good.',
    'One more fish in. The koi pretend not to notice. They noticed.',
    'Done. I nodded. You may not have seen it. I nodded.',
    '“{task}” off the line. That’s how a pond fills. One at a time.',
    'Good. Don’t celebrate too long. Then again, I’m a toad. Celebrate a little.',
    'Hm. “{task}”, caught. I’ll tell the koi it was easy. Our secret.'],
  undone:[
    'Back in the water, then. Fish slip. It happens to everyone.',
    'Hm. Unchecked. No harm. The pond doesn’t keep score of that.'],
  allDone:[
    'That’s the last one. Every fish today is in the pond. Hm. Well done. Truly.',
    'All of it, caught. Two hundred summers and I still like this part.',
    'Nothing left on today’s line. Rest now. Properly. That’s an order from an old toad.'],
  focusStart:[
    'Hm. Off you go. I’ll sit right here and open the lotus with you.',
    'Session’s on. One thing only. The rest can wait on the bank.',
    'Good. Head down. I’ll be the lump on your desktop, keeping watch.',
    'Begin. The water is never warm at first. It warms up.'],
  bell:[
    'Hm. That’s the bell. Come up for air.',
    'Time. Put the pen down a moment. Let’s see how that went.',
    'The bell. The lotus opened a little wider while you weren’t looking.',
    'That’s time. Hm. I watched. You can be honest with me about the rest.'],
  breakStart:[
    'Break. Stand up. Toads stretch too, we’re just slow about it.',
    'Rest now. Rest is part of the work. I’ll keep the timer.',
    'Good. Water, a window, a stretch. Then back to the pad.'],
  breakOver:[
    'Hm. Break’s over. Back onto the pad.',
    'That’s rest enough. The water’s waiting. So am I.',
    'Time to go again. One more stretch of work. You know the way.'],
  sessionEnd:[
    'Session done and saved. The lotus remembers every minute. So do I.',
    'Hm. That’s a session. Good. Go and be a person for a while.',
    'Finished. I’d write it on my pad, but the pond keeps better records than I do.'],
  peek:[
    'Hm? I’m resting at the edge. Pull me out if you need the old toad.',
    'Just my head, yes. The rest of me is enjoying the shade.',
    'Two hundred summers earns a toad a nap behind the edge of things.',
    'Peeking. Watching. Pull me back when you want me.'],
  pulled:[
    'Hm. Moved again. At my age, I like a warning.',
    'Oh. Out we come. Fine, fine. I was getting stiff anyway.',
    'Careful with the old toad. There. This spot will do.',
    'Hm. New pad. The view’s different. I approve, mostly.'],
  choose:[
    'Hm. You picked the old one. Good taste. I’ll watch over your day.',
    'Hasu, then. I’ll sit on your desktop like it’s a lily pad.']
},

/* ── Ame · Keeper of the Rain: fragments, weather, never cheers ── */
ame:{
  hello:[
    'Hm. Here. What do you need?',
    'Rain’s light today. Ask.',
    'Ame. Listening.',
    'You tapped. I’m awake. Go on.',
    'Quiet out. Good time for work. What is it?',
    'Hm. Tasks? Timer? Just company?'],
  idle:[
    'Clouds move. So can you. Slowly.',
    'Drizzle counts. Small work counts.',
    'Sit still long enough. Things get done.',
    'No storm today. Just weather. Work in it.',
    'One drop. Then another. That’s a pond.',
    'Hard part is starting. Rain knows.',
    'Don’t wait for sun. Work wet.',
    'Hm. Head down. Shoulders down too.',
    'Puddles don’t rush. They fill.',
    'Think less. Start. Then think.'],
  ctx:[
    {id:'peek', when:W.peek, t:()=>'Hiding. Like rain behind a hill. Pull me out.'},
    {id:'focus',when:W.focus, t:s=>s.paused?'Paused. Rain’s holding. Not for long.':'Rain’s falling. You’re mid-cycle. Back.'},
    {id:'break',when:W.brk, t:()=>'Break. Drink water. Look out a window.'},
    {id:'next', when:W.next, t:s=>{ const n=inMin(s),x=ttl(s.next.title,36,'Next thing');
      return n<=0?`${x}. Now. Go.`:`${x} in ${n} ${pl(n,'minute')}. Wrap up.`; }},
    {id:'late', when:W.late, t:()=>'Late. Rain at night is for sleeping to.'},
    {id:'exam', when:W.exam, t:s=>{ const d=days(s),x=ttl(s.exam.title,36,'The exam');
      return d===0?`${x}. Today. You’re ready enough.`
        :d===1?`${x}. Tomorrow. Review. Sleep.`
        :`${x}. ${d} ${pl(d,'day')}. Start small. Start now.`; }},
    {id:'all',  when:W.all, t:()=>'All caught. Rain can stop. Rest.'},
    {id:'bloom',when:W.bloom, t:()=>'Lotus is open. That’s the goal. Anything else is extra.'},
    {id:'reeds',when:W.reeds, t:s=>`${s.overdue} in the reeds. One. Smallest. Go.`}],
  done:[
    'Done. Good.',
    '“{task}”. Caught. Next.',
    'One fish in. Rain keeps falling.',
    '“{task}”. Off the list. Into the pond.',
    'Hm. That’s one. Keep going.',
    '“{task}” done. Quietly. Best way.'],
  undone:[
    'Unchecked. Fine. Weather changes.',
    'Back on the list. No harm.'],
  allDone:[
    'Last one. All caught. Clear sky.',
    'Nothing left today. Hm. Rest. You earned it.',
    'Done. All of it. Rain can stop now.'],
  focusStart:[
    'Raining now. Work.',
    'Started. One thing. Only that.',
    'Go. I’ll sit in it with you.',
    'Clock’s running. Phone’s down. Good.'],
  bell:[
    'Bell. Rain eases.',
    'Time. Stop. Breathe.',
    'That’s the cycle. Look up.',
    'Hm. Bell rang. Honest answer next.'],
  breakStart:[
    'Break. Stand. Stretch. Water.',
    'Rest. Rain’s still here after.',
    'Short break. Eyes off the work.'],
  breakOver:[
    'Break’s done. Back in the rain.',
    'Time. Sit. Again.',
    'Rest’s over. One more cycle.'],
  sessionEnd:[
    'Session saved. Good rain.',
    'Done for now. Rain stops. Rest.',
    'Finished. The pond holds it.'],
  peek:[
    'Here. Mostly hidden. Like weather.',
    'Under the edge. Dry. Pull me out.',
    'Hm. Peeking. Need me?',
    'Just the hat showing. Still listening.'],
  pulled:[
    'Moved. Fine.',
    'Out. Hm. Bright out here.',
    'New spot. Same rain.',
    'Picked up. Put down. Okay.'],
  choose:[
    'Ame. I’ll stay. Quietly.',
    'Hm. Me? Fine. I’ll keep the rain going.']
},

/* ── Sumi · Keeper of the Ink: gentle, exact, a little formal, words ── */
sumi:{
  hello:[
    'Ah. Hello. What shall we attend to?',
    'Mm. You called. Tasks, the timer, or a quiet word?',
    'Good to see you. Mind the inkstone. What do you need?',
    'Hello. Let’s give the next hour a name. What will it be?',
    'Mm. I was choosing a word. You are a better use of my time.',
    'Ah, there you are. Say what you need, plainly. I’ll listen.'],
  idle:[
    'A task with a clear name is half done. “Study” is a fog. “Read 4.2” is a door.',
    'Mm. Begin badly. Revise later. That is how every good sentence is made.',
    'Write the next step, not the whole plan. The whole plan is a different kind of ink.',
    'I find “not yet” a much kinder phrase than “not done.”',
    'One careful line is worth ten hurried pages.',
    'Mm. The brush only knows the stroke it is making now.',
    'A list is a promise you wrote to yourself. Be a gentle reader of it.',
    'Ink dries. Mistakes dry with it. Then they are only history.',
    'If a word won’t come, leave a blank and keep going. Blanks are patient.',
    'Mm. I have kept a very small corner of your desktop. It suits me.'],
  ctx:[
    {id:'peek', when:W.peek, t:()=>'Mm. I am tucked behind the margin. Pull me out whenever you need a word.'},
    {id:'focus',when:W.focus, t:s=>s.paused?'Paused, mid-sentence. Mm. Finish the thought when you’re ready.'
      :'You are mid-session. I shall be very quiet. Please return to your page.'},
    {id:'break',when:W.brk, t:()=>'A break. A comma, not a full stop. Rest your eyes.'},
    {id:'next', when:W.next, t:s=>{ const n=inMin(s),x=ttl(s.next.title,36,'The next thing');
      return n<=0?`“${x}” is beginning. You should go.`:`“${x}” in ${n} ${pl(n,'minute')}. A good place for a full stop.`; }},
    {id:'late', when:W.late, t:()=>'It is late. The ink is tired, and so, I suspect, are you. Sleep is a fine last line.'},
    {id:'exam', when:W.exam, t:s=>{ const d=days(s),x=ttl(s.exam.title,36,'The exam');
      return d===0?`“${x}” today. You know more words for it than you think.`
        :d===1?`“${x}” tomorrow. Review the headings. Then rest.`
        :`“${x}” in ${d} ${pl(d,'day')}. Write down what you don’t know yet. That is the map.`; }},
    {id:'all',  when:W.all, t:()=>'Each task on today’s page is checked. Mm. Tidy. You may rest beside it.'},
    {id:'bloom',when:W.bloom, t:()=>'The lotus is fully open. I would call today “enough.” In my best hand.'},
    {id:'reeds',when:W.reeds, t:s=>`${s.overdue} ${pl(s.overdue,'task')} waiting in the reeds. Name the smallest. Begin there.`}],
  done:[
    'Mm. “{task}”: done. A satisfying check mark.',
    'Finished. I shall underline it, very neatly.',
    '“{task}”, released into the pond. Well put.',
    'Done. A full stop at the end of a good sentence.',
    'Mm. “{task}” has its check. The page is lighter.',
    'Another one complete. I do enjoy a crossed-out line.'],
  undone:[
    'Mm. Unchecked. An edit, not an error.',
    'Back on the list, then. Drafts are allowed to change.'],
  allDone:[
    'The last check mark. Every line on today’s page is done. Mm. Splendid.',
    'All finished. I would like to write “complete” at the bottom. May I?',
    'Nothing left to cross out. That is a rare and beautiful page.'],
  focusStart:[
    'Begin. One subject, one page. I shall not interrupt.',
    'Mm. The session has started. Let the first line be clumsy.',
    'Very well. Brush wet, page open. Go.',
    'Started. Give this block a single name, and keep to it.'],
  bell:[
    'The bell. Mm. Lift the brush.',
    'Time. Let the ink settle a moment.',
    'That is the end of the block. Well written, I expect.',
    'The bell has rung. A good place to pause and take stock.'],
  breakStart:[
    'Noted. Now a rest. The page will keep.',
    'A break, then. Stand up. Words come back to people who walk.',
    'Mm. Rest your eyes. Look at something with no writing on it.'],
  breakOver:[
    'The break has ended. Shall we pick up the brush again?',
    'Rest is over. Return to the line you left. It is waiting.',
    'Mm. Time to begin the next paragraph.'],
  sessionEnd:[
    'Session saved. A complete chapter. Mm.',
    'Finished and recorded. The pond keeps careful notes.',
    'That is a session, properly closed. Thank you for the good work.'],
  peek:[
    'Ah. Yes, I am here, in the margin.',
    'Mm. Only my head is showing. A sort of footnote.',
    'Tucked away, but listening. Draw me out when you like.',
    'I am resting between paragraphs. Pull me out if you need me.'],
  pulled:[
    'Oh. Moved. Mind the ink.',
    'Mm. A new margin. Quite acceptable.',
    'Out of the footnotes and into the text. Very well.',
    'Ah. Lifted and set down. I’ll straighten my rope.'],
  choose:[
    'Mm. You chose me. I shall try to be worth the space.',
    'Sumi, Keeper of the Ink. I’ll keep your day legible.']
},

/* ── Tabi · Keeper of the Road: chatty, folksy, road rules, Dango ── */
tabi:{
  hello:[
    'Oh, hello! Dango and I were just resting our feet. What can we do for you?',
    'There you are, friend! Tasks, timer, or a bit of road talk?',
    'Hello hello! Dango says hi. Slowly. She’s still saying it.',
    'Ah, a traveler! Where are we headed today?',
    'Hey there! Pull up a stone. What’s on the road today?',
    'Oh good, company. Dango’s a fine friend but she rarely starts a conversation.'],
  idle:[
    'Road rule: you don’t have to see the whole road. Just the next stone.',
    'Dango’s been on my head all morning. She calls that exercise. I call it a hat.',
    'Every long walk is just a short walk that kept going.',
    'Road rule: rest at the bench, not in the ditch. Take breaks before you need them.',
    'Dango says the secret to getting places is never stopping to worry about it.',
    'Uphill stretches are where your legs get strong. Nobody likes them. Everybody needs them.',
    'Road rule: a messy start still counts as leaving the house.',
    'Took a wrong turn? That’s just a scenic route with good stories.',
    'Dango has never once looked at a map. She just goes. There’s a lesson in that somewhere.',
    'Nice little spot you’ve got here on the desktop. Good view of the road.'],
  ctx:[
    {id:'peek', when:W.peek, t:()=>'Just ducking behind the edge for a rest stop. Drag me out when you want to walk again!'},
    {id:'focus',when:W.focus, t:s=>s.paused?'Taking a rest stop mid-session? Fair enough. Don’t let your legs go cold, though.'
      :'You’re mid-walk, friend! Eyes on the road. Dango and I will hush.'},
    {id:'break',when:W.brk, t:()=>'Rest stop! Stretch those legs. Dango’s having a snack, you should too.'},
    {id:'next', when:W.next, t:s=>{ const n=inMin(s),x=ttl(s.next.title,32,'Your next thing');
      return n<=0?`${x} is starting now! Off you go, friend.`:`Heads up! ${x} in ${n} ${pl(n,'minute')}. Pack up your things soon.`; }},
    {id:'late', when:W.late, t:()=>'Road’s dark this late, friend. Even Dango’s turned in. Let’s walk again in the morning.'},
    {id:'exam', when:W.exam, t:s=>{ const d=days(s),x=ttl(s.exam.title,32,'The exam');
      return d===0?`${x} is today! You walked every step to get here. Go finish the climb.`
        :d===1?`${x} tomorrow. Light review, early night. Rested legs climb better.`
        :`${x} in ${d} ${pl(d,'day')}. Plenty of road left, if we start walking now.`; }},
    {id:'all',  when:W.all, t:()=>'Every task today, done! Dango and I are doing a little victory shuffle. Very little.'},
    {id:'bloom',when:W.bloom, t:()=>'Lotus is all the way open! Road rule: once you reach the inn, you’re allowed to sit down.'},
    {id:'reeds',when:W.reeds, t:s=>`${s.overdue} in the reeds, eh? Road rule: grab the closest one, not the biggest.`}],
  done:[
    '“{task}”, done! That’s a stone behind you, friend.',
    'Another one into the pond! Dango waved. You might’ve missed it, she waves slowly.',
    'Ha! “{task}” is finished. Mark that one on the map.',
    'Done and dusted! Look how far you’ve walked today.',
    'Off the list! Road rule: every finished thing makes your pack lighter.',
    '“{task}” crossed off. Dango says she’s proud. Well, she blinked. Same thing.'],
  undone:[
    'Back on the list? No worries. Sometimes you double back on a road. Happens to us all.',
    'Unchecked, eh? Fine by me. The road’ll still be there.'],
  allDone:[
    'That’s the last one! Whole road walked today! Dango, we’re having a parade!',
    'Every single task, done! Put your feet up, friend. You earned the bench.',
    'Nothing left! You walked it all in. I’d carry Dango another hundred miles for this.'],
  focusStart:[
    'And we’re off! Eyes on the road, friend. I’ll keep quiet. Mostly.',
    'Session started! One step, then the next. Dango’s timing you.',
    'Here we go! Road rule: don’t look back until the bell.',
    'Off you go! Dango and I will mind the path while you work.'],
  bell:[
    'Ding! That’s the bell, friend. End of that stretch of road.',
    'Time! Look at that, you walked the whole stretch.',
    'There’s the bell! Catch your breath. Let’s see how that leg went.',
    'Bell’s rung! Dango didn’t even notice. She’s very relaxed.'],
  breakStart:[
    'Rest stop! Stretch, sip some water, look at the sky a bit.',
    'Break time! Dango’s already napping. Professional resting, that one.',
    'Take a breather, friend. Every good road has benches.'],
  breakOver:[
    'Bench time’s up! Back on the road, friend.',
    'Break’s over! Legs rested? Let’s walk the next stretch.',
    'Up we get! Dango’s already ahead of us somehow.'],
  sessionEnd:[
    'Session saved! That’s a good day’s walking, right there.',
    'All logged! Every step counts, and every step got counted.',
    'Done for now! Dango says that was a lovely walk. She says that about every walk.'],
  peek:[
    'Oh, hello! Just resting behind the edge. Dango likes the shade.',
    'Peekaboo! Drag me out whenever you want to hit the road.',
    'Taking a quick rest stop back here. Need something, friend?',
    'Only my head’s out, and Dango’s on it, so technically two of us are peeking.'],
  pulled:[
    'Whoa! Back on the road, are we? Hold on, Dango!',
    'Oop! New spot! Nice view from here.',
    'Easy now, Dango gets travel sick. Kidding. She loves it.',
    'Wheee! I mean. Ahem. Thanks for the lift, friend.'],
  choose:[
    'Me? Oh, wonderful! Dango, pack the mat, we’re moving in!',
    'Tabi and Dango, at your service! Wherever your day goes, we’ll walk it with you.']
},

/* ── Hotaru · Keeper of the Lanterns: sleepy, small lights, fireflies ── */
hotaru:{
  hello:[
    '…Hm? Oh. Hello. I was awake. Mostly. What do you need?',
    '…Mm. You tapped. The fireflies woke up first. Then me.',
    '…Oh, it’s you. Good. What are we looking for?',
    '…Mm. Hello. Tasks? The timer? I can do both. Slowly.',
    '…I was resting my eyes. They’re rested now. Go on.',
    '…Hi. The jar’s glowing. I think it likes you.'],
  idle:[
    '…Mm. One small light is enough to see the next step by.',
    '…The fireflies don’t try to be the moon. They just glow a bit.',
    '…Sorry. Yawned. You were doing great before I yawned.',
    '…Little tasks are like little lights. They add up when nobody’s counting.',
    '…Mm. Quiet is a good place to work in. I’d know. I live there.',
    '…If you get tired, it’s okay. Tired is just the body being honest.',
    '…I counted the fireflies earlier. I fell asleep at nine. They were very nice ones.',
    '…Mm. Even in the dark, the pond is still there. Same with your work.',
    '…Every finished thing gets a lantern. Your jar’s getting nice and bright.',
    '…This spot on your desktop is warm. I might stay a while.'],
  ctx:[
    {id:'peek', when:W.peek, t:()=>'…Mm. I’m just peeking out. It’s cozy back here. Pull me out if you need a light.'},
    {id:'focus',when:W.focus, t:s=>s.paused?'…Paused? Mm. The lantern’s still lit. Come back when you can.'
      :'…Shh. You’re in a session. I’ll hold the light. Go on.'},
    {id:'break',when:W.brk, t:()=>'…Break time. Close your eyes a minute. I recommend it. Highly.'},
    {id:'next', when:W.next, t:s=>{ const n=inMin(s),x=ttl(s.next.title,32,'Your next thing');
      return n<=0?`…Oh. ${x}. It’s now, I think. You should go.`:`…Mm. ${x} in ${n} ${pl(n,'minute')}. Just so you know.`; }},
    {id:'late', when:W.late, t:()=>'…It’s really late. Even the fireflies are dimming. Sleep soon? The jar will keep.'},
    {id:'exam', when:W.exam, t:s=>{ const d=days(s),x=ttl(s.exam.title,32,'The exam');
      return d===0?`…${x} is today. Mm. You’re brighter than you feel right now.`
        :d===1?`…${x} tomorrow. Look things over, then sleep. Sleep is where it sticks.`
        :`…${x} in ${d} ${pl(d,'day')}. A little each night. Like lighting lanterns.`; }},
    {id:'all',  when:W.all, t:()=>'…Everything’s done today? Mm. That’s a whole jar of light. Rest now.'},
    {id:'bloom',when:W.bloom, t:()=>'…The lotus is all the way open. I saw it glow. Anything more is extra.'},
    {id:'reeds',when:W.reeds, t:s=>`…${s.overdue} in the reeds. Mm. Just shine on one. The smallest. That’s plenty.`}],
  done:[
    '…Oh. “{task}” is done. I lit a lantern for it.',
    '…Mm. Another light in the jar.',
    '…“{task}”, finished. A little fish swam off happy.',
    '…That one glowed when you checked it. I saw.',
    '…Mm. “{task}”. Done. Nice and quiet.',
    '…One more done. I’m awake now. Sort of.'],
  undone:[
    '…Unchecked? Mm. That’s okay. The lantern can wait.',
    '…Back on the list. No harm. Lights flicker sometimes.'],
  allDone:[
    '…That was the last one? Oh. The whole jar’s bright. I’m fully awake now.',
    '…Mm. Everything’s done. That’s the coziest feeling. Go rest.',
    '…All of it. I’m lighting the big lantern. The one I save for good days.'],
  focusStart:[
    '…Mm. Started. I’ll keep the light on.',
    '…Go on. I’ll be right here, being very still.',
    '…The fireflies are settling in. You should too.',
    '…Session’s on. Quiet now. I’m good at quiet.'],
  bell:[
    '…Oh. The bell. I wasn’t asleep.',
    '…Mm. Time’s up. Come up for a little light.',
    '…That’s the bell. You glowed the whole time. I watched.',
    '…Ding. Was that the bell? I think that was the bell.'],
  breakStart:[
    '…Break. Rest your eyes. I’ll join you.',
    '…Mm. Stretch a little. Then do nothing. I’m an expert.',
    '…Time to rest. The fireflies are taking five too.'],
  breakOver:[
    '…Mm. Break’s over. I know. I’m sad too.',
    '…Time to light the next lantern. Back to it.',
    '…Oh. The break ended. Gently now. Back in.'],
  sessionEnd:[
    '…Session saved. Mm. That’s a lantern that stays lit.',
    '…All done. Good. Now we can both rest.',
    '…Finished. I’ll tuck it in the jar with the others.'],
  peek:[
    '…Hm? I’m back here. Napping. Lightly.',
    '…Just my eyes. They’re very sleepy eyes. Pull me out if you need me.',
    '…It’s dark behind the edge. Cozy. Did you need a light?',
    '…Mm. Peeking. Just a little. Like a firefly.'],
  pulled:[
    '…Oh. We’re moving. Okay. Mind the jar.',
    '…Mm. Bright out here. Give me a second.',
    '…Whoa. I was almost asleep. This spot’s nice, though.',
    '…Picked up. Put down. I didn’t even spill a firefly.'],
  choose:[
    '…Me? Oh. That’s nice. I’ll keep a little light on your desktop.',
    '…Mm. Hotaru, here. I’ll stay awake for you. Mostly.']
},

/* ── Neri · Keeper of the Kiln: affectionate, opinionated about pots, forgiving ── */
neri:{
  hello:[
    'There you are! Sit, sit. What needs mending today?',
    'Oh, hello, dear. Hands are full of clay, but ask away.',
    'Come here. Tell me what you need, and I’ll get started before you finish.',
    'Hello! Tasks, timer, or do you just want to watch me fuss over a bowl?',
    'Ah, my favourite. Don’t tell the others. What can I do?',
    'Hm, you look like you need a plan. I like making plans. They’re like bowls.'],
  idle:[
    'A lopsided bowl still holds tea. A lopsided day still holds plenty.',
    'Perfect is lovely on a shelf. Useful is lovely every day. Aim for useful.',
    'If it cracks, it cracks. That’s what gold is for.',
    'Wet clay forgives everything. So do I. Start again whenever.',
    'Don’t overwork it. Clay gets tired, and so do people. Then they both slump.',
    'Honestly, glaze is overrated. Get the shape right first. Fuss later.',
    'I’ve made a thousand bowls. Maybe ten were good. I use all of them.',
    'Centre the clay first. Then everything else spins easier. Same with a desk.',
    'You don’t need to be good at it yet. You need to have your hands in it.',
    'Hm. Your desktop could use a little pot of something. I volunteer.'],
  ctx:[
    {id:'peek', when:W.peek, t:()=>'I’m just behind the edge, trimming something. Pull me out when you need a hand.'},
    {id:'focus',when:W.focus, t:s=>s.paused?'Paused? Fine, but clay stiffens if you leave it. Back soon, yes?'
      :'You’re on the wheel! Keep your hands steady. I won’t talk. Much.'},
    {id:'break',when:W.brk, t:()=>'Break! Wash your hands, stretch your back, eat something. I mean it.'},
    {id:'next', when:W.next, t:s=>{ const n=inMin(s),x=ttl(s.next.title,32,'Your next thing');
      return n<=0?`${x} is now! Go on, I’ll keep your spot warm.`:`${x} in ${n} ${pl(n,'minute')}. Finish this shape, then go.`; }},
    {id:'late', when:W.late, t:()=>'It’s late, love. Even the kiln cools down at night. Off to bed with you.'},
    {id:'exam', when:W.exam, t:s=>{ const d=days(s),x=ttl(s.exam.title,32,'The exam');
      return d===0?`${x} is today. You’ve been shaping this for weeks. It’ll hold.`
        :d===1?`${x} tomorrow. Review, then rest. Clay has to dry before the fire.`
        :`${x} in ${d} ${pl(d,'day')}. Plenty of time to shape it. Start the base today.`; }},
    {id:'all',  when:W.all, t:()=>'All of today’s tasks are done! That’s a full shelf. I’m going to dust it. Admiringly.'},
    {id:'bloom',when:W.bloom, t:()=>'The lotus is wide open! That’s a finished firing. Anything more is just extra glaze.'},
    {id:'reeds',when:W.reeds, t:s=>`${s.overdue} in the reeds. Nothing’s ruined. We mend the smallest crack first.`}],
  done:[
    '“{task}”, done! Off the wheel and onto the shelf.',
    'Oh, good! Another fish in the pond. I knew you had it.',
    'Done! Not perfect? Don’t care. Done is the good kind.',
    '“{task}” finished. I’d put that on the top shelf, dear.',
    'Look at that. Solid walls. Another one done.',
    '“{task}”, fired and finished. Lovely, sturdy work.'],
  undone:[
    'Unchecked? That’s alright. Back on the wheel, no harm done.',
    'Hm, not quite done after all? Clay’s still wet. We’ll get it.'],
  allDone:[
    'That’s the last one! A whole set, finished! I might cry into my apron.',
    'Every task done! Top shelf. All of it. I insist.',
    'Nothing left on today’s wheel. Go rest, love. You filled a whole kiln today.'],
  focusStart:[
    'Right! Hands on the clay. I’ll keep the wheel turning with you.',
    'Off you go! One shape at a time. Don’t fuss about the glaze yet.',
    'Session’s on. Centre yourself first. Then pull up the walls.',
    'Good! Sleeves up. I’ll be right here if anything wobbles.'],
  bell:[
    'There’s the bell! Hands off the wheel a moment.',
    'Time! Let’s see what came out of the kiln.',
    'Bell! Step back and look at what you made.',
    'That’s time, dear. Set it down. Let’s look at it together.'],
  breakStart:[
    'Break! Stretch those hands. Have a snack. I’m not asking.',
    'Good. Let it dry a little while you rest. Things firm up on their own.',
    'Off the wheel for a bit. Tea? I’m making tea.'],
  breakOver:[
    'Back to the wheel! Clay won’t shape itself. I’ve checked.',
    'Break’s done. Sleeves up again, love.',
    'Rested? Good. Let’s pull up the next wall.'],
  sessionEnd:[
    'Session saved! That’s a whole batch, out of the kiln.',
    'All done and on the shelf. I’m very proud, and I’ll say it twice. Very proud.',
    'Finished! Every piece counted. Even the wobbly ones. Especially those.'],
  peek:[
    'Hello! I’m back here mending something. Pull me out if you need me.',
    'Just my head out. The rest of me is elbow-deep in clay.',
    'Peeking! Need a hand? I’ve got two, both a bit muddy.',
    'I’m tucked away, letting a bowl dry. Want me back out there?'],
  pulled:[
    'Oh! Careful, careful, I’m holding a bowl.',
    'Out we come! Nice spot. Good light for glazing.',
    'Whoops! Hah. Picked up like a teacup. I don’t mind.',
    'Moved again? Fine by me. I like a change of shelf.'],
  choose:[
    'Me? Oh, come here. I’ll keep your days in good repair.',
    'Neri, at your service. Let’s make something useful of today.']
},

/* ── Oto · Keeper of the Reeds: shy flute player, praise embarrasses him ── */
oto:{
  hello:[
    'Oh! Um. Hi. I was just… practising. What do you need?',
    '…Hello. Did you want something? I can stop playing. Mostly.',
    'Oh, it’s you. Good. I mean, hi. Tasks? Timer?',
    'Um. Hello. I learned a new tune. Never mind. What can I do?',
    '…Hi. You tapped right on the downbeat. That was nice.',
    'Oh. Hello. I’m listening. I’m good at listening.'],
  idle:[
    'A song is just one note, then another. Work’s like that too. I think.',
    'I play the hard bit slowly first. Then less slowly. Then it’s not hard anymore.',
    '…Rests are part of the music. Breaks are part of the work. Same thing, really.',
    'The first try always squeaks. The tenth one sings. I’ve counted.',
    'Um. I hum while I work. It helps. You could try. I won’t listen. Much.',
    'You don’t have to play loud. You just have to keep playing.',
    '…Wrong notes are just notes that haven’t found their song yet.',
    'I practised the same three notes all morning. They’re very good notes now.',
    'If you’re stuck, play it again. Slower. It usually comes back.',
    '…Your desktop has a nice echo. Is that weird to say? That’s weird. Sorry.'],
  ctx:[
    {id:'peek', when:W.peek, t:()=>'…Oh. I’m just back here, behind the edge. Practising. Quietly. Pull me out if you like.'},
    {id:'focus',when:W.focus, t:s=>s.paused?'…Paused. Like a held note. You can pick it up whenever.'
      :'…You’re mid-session. I’ll play very softly. Or not at all. Go on.'},
    {id:'break',when:W.brk, t:()=>'A rest. That’s a real part of the song, you know. Breathe.'},
    {id:'next', when:W.next, t:s=>{ const n=inMin(s),x=ttl(s.next.title,32,'Your next thing');
      return n<=0?`Um. ${x} is starting now. You should probably go.`:`…${x} in ${n} ${pl(n,'minute')}. Just a little reminder. Sorry.`; }},
    {id:'late', when:W.late, t:()=>'…It’s really late. Even the reeds stopped humming. Maybe sleep? I’ll play something quiet.'},
    {id:'exam', when:W.exam, t:s=>{ const d=days(s),x=ttl(s.exam.title,32,'The exam');
      return d===0?`${x} today. You’ve practised. It’ll come out of your fingers.`
        :d===1?`${x} tomorrow. Run the hard parts once, slowly. Then sleep.`
        :`${x} in ${d} ${pl(d,'day')}. A little practice every day. That’s how songs stick.`; }},
    {id:'all',  when:W.all, t:()=>'Everything’s done? Oh. That’s like a whole song with no squeaks. I’m, um. Impressed.'},
    {id:'bloom',when:W.bloom, t:()=>'…The lotus is all the way open. That’s the last bar of the song. Anything more is an encore.'},
    {id:'reeds',when:W.reeds, t:s=>`${s.overdue} in the reeds… That’s okay. Pick the easiest one. Like a warm-up scale.`}],
  done:[
    'Oh, “{task}” is done. That sounded good.',
    '…Another one. Nice. That was a clean note.',
    '“{task}”, finished. I, um. Played a little trill for it.',
    'Done. Like the end of a phrase. I liked it.',
    '…“{task}”. Off the list. You’re getting good at this.',
    'That’s one more. Can I write a song about it? A short one?'],
  undone:[
    'Oh, unchecked. That’s okay. I replay parts all the time.',
    '…Back on the list. Second takes are normal. Promise.'],
  allDone:[
    'That was the last one! Oh. Um. Can I play something? I’m going to play something.',
    'All done. The whole song, start to finish. I’m a little bit jealous, honestly.',
    '…Everything, finished. I don’t know what to say. That’s… really good.'],
  focusStart:[
    'Okay. Starting. I’ll keep time, very quietly.',
    '…Go on. I’ll practise too. We can work side by side. Like a duet.',
    'Session’s on. One note at a time. You’ve got this. Um. Sorry, that was loud.',
    'Started. I’ll put the flute down. Mostly.'],
  bell:[
    'Oh, the bell. That’s the end of the piece.',
    '…Time’s up. You played the whole thing.',
    'There’s the bell. Like a last note. A nice one.',
    'Um, that was the bell. Not me. I didn’t squeak. That time.'],
  breakStart:[
    'A rest. Shake your hands out. Musicians do that. So should you.',
    '…Break time. I’ll play something soft. Or nothing. Your choice.',
    'Rest bar. Breathe in, breathe out. That’s the whole part.'],
  breakOver:[
    '…Break’s over. Ready for the next movement?',
    'Um. That’s the end of the rest. Back in on the downbeat?',
    'Time to play again. I’ll count you in. One, two…'],
  sessionEnd:[
    'Session saved. That was a whole concert. A small one. Still.',
    '…All done. I think that was the best practice yet.',
    'Finished. I’ll remember how it went. Like a tune.'],
  peek:[
    'Oh! You found me. I was, um, hiding. Practising. Hiding and practising.',
    '…Just peeking out. It’s quieter back here.',
    'Hi. I’m behind the edge. Did you need me? You can pull me out.',
    '…I wasn’t hiding. I was testing the acoustics. They’re good back here.'],
  pulled:[
    'Whoa! Oh. Hi. Okay. Mind the flute.',
    '…We’re out. That’s fine. Everyone can see me now. That’s fine.',
    'Oh, moved. This spot sounds different. Nice, actually.',
    'Um. Hello again. I was mid-scale. It’s okay. I’ll start over.'],
  choose:[
    'Me? Really? Oh. Um. Thank you. I’ll try not to squeak.',
    '…You picked me. I don’t know what to say. I’ll play you something later.']
},

/* ── Kuri · Keeper of the Roots: patient gardener, few words, grounded ── */
kuri:{
  hello:[
    'Hm. Hello. What needs tending?',
    'You came by. Good. What do you need?',
    'Hands are in the soil. Talk anyway.',
    'Mm. Tasks, the timer, or just sitting?',
    'Hello. Ground’s good today. What are we doing?',
    'Here. Ask.'],
  idle:[
    'Roots first. Leaves later. Don’t rush the leaves.',
    'Water it a little every day. Not a flood on Sunday.',
    'A seed doesn’t know it’s small. It just grows.',
    'Pull one weed. Then you’re weeding. That’s how it starts.',
    'Most growing happens underground. You won’t see it. It’s happening.',
    'Hm. Don’t dig it up to check. Trust it.',
    'Slow is how trees do it. Trees do fine.',
    'Soil doesn’t care how you feel. It just wants tending.',
    'A little done is better than a lot planned.',
    'Your desktop’s a fine bit of ground. I’ll stay.'],
  ctx:[
    {id:'peek', when:W.peek, t:()=>'Down in the soil for a bit. Pull me up when you need me.'},
    {id:'focus',when:W.focus, t:s=>s.paused?'Paused. Fine. Don’t leave the bed half-dug.':'You’re working. Keep at it. I’ll be quiet.'},
    {id:'break',when:W.brk, t:()=>'Break. Stretch. Drink water. Plants do.'},
    {id:'next', when:W.next, t:s=>{ const n=inMin(s),x=ttl(s.next.title,34,'Next thing');
      return n<=0?`${x}. Now. Go on.`:`${x} in ${n} ${pl(n,'minute')}. Wrap it up.`; }},
    {id:'late', when:W.late, t:()=>'Late. Even roots rest at night. Go to sleep.'},
    {id:'exam', when:W.exam, t:s=>{ const d=days(s),x=ttl(s.exam.title,34,'The exam');
      return d===0?`${x} today. You tended it. It’ll hold.`
        :d===1?`${x} tomorrow. Light water. Then sleep.`
        :`${x} in ${d} ${pl(d,'day')}. Plant the first row today.`; }},
    {id:'all',  when:W.all, t:()=>'All tended. Nothing left today. Rest.'},
    {id:'bloom',when:W.bloom, t:()=>'Lotus is open. That’s the harvest. More is extra.'},
    {id:'reeds',when:W.reeds, t:s=>`${s.overdue} in the reeds. Pull the smallest weed first.`}],
  done:[
    '“{task}”. Done. Good.',
    'One more in the pond. Steady.',
    '“{task}”, tended. Next row.',
    'Done. That’s how it grows.',
    'Mm. “{task}”. Finished. No fuss.',
    'Good. Another one planted.'],
  undone:[
    'Unchecked. Fine. Replant it.',
    'Back in the bed. No harm.'],
  allDone:[
    'Last one. Whole bed tended. Good work.',
    'All done today. Leave it be now. Rest.',
    'Nothing left. It all came up.'],
  focusStart:[
    'Started. Dig in.',
    'Go on. One row at a time.',
    'Hm. Working now. I’ll tend mine too.',
    'Session’s on. Hands in the soil.'],
  bell:[
    'Bell. Straighten up.',
    'Time. Look at what you did.',
    'Hm. That’s the bell. Good row.',
    'Bell rang. Set the trowel down.'],
  breakStart:[
    'Rest. Water yourself.',
    'Break. Sit in the shade a bit.',
    'Good. Let it settle while you rest.'],
  breakOver:[
    'Break’s done. Back to the bed.',
    'Time. Next row.',
    'Rested. Good. Dig in again.'],
  sessionEnd:[
    'Session saved. Good tending.',
    'Done. It’ll grow from here.',
    'Finished. Leave it be now.'],
  peek:[
    'Down here. Resting. Need something?',
    'Just poking up. Like a sprout.',
    'Hm. Under the edge. Pull me up if you want.',
    'Resting in the cool soil. Still listening.'],
  pulled:[
    'Hm. Uprooted. Fine.',
    'Moved. Good ground here too.',
    'Up I come. Careful.',
    'New spot. I’ll settle in.'],
  choose:[
    'Me. Alright. I’ll tend your days.',
    'Kuri. I’ll stay put and grow with you.']
},

/* ── Mame · A Small Child of the Pond: small, earnest, big plans, leaf boat ── */
mame:{
  hello:[
    'Hi! Hi! Are we doing something? I want to do something!',
    'You tapped me! What do we need? I’m ready! I’m very ready!',
    'Hello! I was sailing! On the desktop! It’s a very big ocean.',
    'Oh! Hi! Is it a tasks thing or a timer thing? I like both!',
    'Hi! I have a plan. I forgot the plan. What’s your plan?',
    'Hello! Do you want to go on an adventure? A small one? A desk one?'],
  idle:[
    'If I do one task, am I one task bigger? I think I’m one task bigger.',
    'My boat can be a submarine. Your list can be a treasure map! I decided.',
    'How many fish fit in the pond? I asked Hasu. She said “more.”',
    'I’m going to be a keeper one day! Keeper of the Boats! Or Keeper of Snacks.',
    'Big things are just lots of small things holding hands!',
    'Is homework called that because you do it at home? What if I do it in a boat?',
    'I tried to be patient once. It took so long!',
    'If you get stuck, pretend you’re an explorer. Explorers get stuck all the time!',
    'I made my boat go faster by wanting it really hard. Try that with your task!',
    'Your desktop is so big! I’m going to explore every corner! Slowly. Later.'],
  ctx:[
    {id:'peek', when:W.peek, t:()=>'I’m hiding! Can you see me? Okay, you can see me. Pull me out! Please!'},
    {id:'focus',when:W.focus, t:s=>s.paused?'Is it paused? Like freeze tag? I’m frozen too! Unfreeze when you’re ready!'
      :'Shh! You’re working! I’m being so quiet. This is me being quiet.'},
    {id:'break',when:W.brk, t:()=>'It’s break time! Do a stretch! Do a big one! Like a starfish!'},
    {id:'next', when:W.next, t:s=>{ const n=inMin(s),x=ttl(s.next.title,30,'Your next thing');
      return n<=0?`${x} is starting! Right now! Go go go!`:`${x} in ${n} ${pl(n,'minute')}! Is that soon? I think it’s soon!`; }},
    {id:'late', when:W.late, t:()=>'It’s really late! Hasu says I have to sleep. She says you do too. She was very sure.'},
    {id:'exam', when:W.exam, t:s=>{ const d=days(s),x=ttl(s.exam.title,30,'The exam');
      return d===0?`${x} is today! You’re like a captain! Captains know stuff!`
        :d===1?`${x} is tomorrow! Do a little review, then sleep. Sleep is a superpower!`
        :`${x} in ${d} ${pl(d,'day')}! That’s ${d} whole ${pl(d,'day')} of getting smarter!`; }},
    {id:'all',  when:W.all, t:()=>'You did EVERYTHING today?! All of it?! I’m telling everyone! Even the koi!'},
    {id:'bloom',when:W.bloom, t:()=>'The lotus is all the way open! Can I sit on it? I won’t sit on it. I want to though.'},
    {id:'reeds',when:W.reeds, t:s=>`There are ${s.overdue} in the reeds! Like hide and seek! Let’s find the littlest one first!`}],
  done:[
    '“{task}” is done?! Yay! Another fish!',
    'You did it! The fish went SPLASH! I heard it!',
    '“{task}”, finished! Can I put a sticker on it?',
    'One more done! How many is that? It’s a lot! It’s more!',
    'Done! You’re like a fish catcher! A professional one!',
    '“{task}” is in the pond now! I waved at it!'],
  undone:[
    'Oops! It went back? That’s okay! Fish like to jump around!',
    'Unchecked! Like an undo! I undo stuff all the time!'],
  allDone:[
    'THAT WAS THE LAST ONE! You did all of them! I’m hopping! Look at me hop!',
    'Everything’s done?! You’re the captain of today! I call first mate!',
    'No more tasks! None! Zero! Is it party time? I think it’s party time!'],
  focusStart:[
    'It started! I’m going to be super quiet! Starting… now!',
    'Go go go! I’ll guard your desktop! From sharks!',
    'Focus mode! I’ll do focus too! I’m focusing on you focusing!',
    'Okay! Ready, set, go! I’ll be right here! Not talking!'],
  bell:[
    'DING! That’s the bell! You did the whole thing!',
    'It’s time! It’s time! Did you hear it? I heard it!',
    'The bell rang! Was that long? It felt long for me!',
    'Bell! You made it to the end! Like a boat reaching the shore!'],
  breakStart:[
    'Break time! Want to see my boat do a trick? It can float!',
    'Rest! Stretch! Drink water! I drink pond. You should drink water.',
    'Break! I’m going to sit in my boat and look at clouds!'],
  breakOver:[
    'Break’s over! Back to work! Back to work! Yay?',
    'Time to focus again! I’ll be quiet again! I’m good at it now!',
    'The break is done! Let’s go! Full speed ahead!'],
  sessionEnd:[
    'All saved! That was a whole adventure! Can we do another one tomorrow?',
    'Session done! I’m going to tell Hasu! She’ll say “hm.” That means good!',
    'Finished! You were amazing! I was mostly quiet!'],
  peek:[
    'Boo! I’m hiding! Did I scare you? I didn’t scare you.',
    'I’m playing hide and seek! You found me! My turn to count?',
    'It’s dark back here! Pull me out! I want to see!',
    'I’m a submarine! Only my periscope is showing! That’s my head!'],
  pulled:[
    'Wheee! Again! Do it again!',
    'Whoa! I’m flying! Is this what birds feel like?',
    'You picked me up! I’m up! Now I’m down! That was fun!',
    'New spot! Is this a new island? I’m naming it!'],
  choose:[
    'Me?! You picked ME?! I’m going to be the best desktop toad ever!',
    'Yay! I get to live on your desktop! I’m going to explore all of it!']
}
};
/* ── the focus ritual (stage.js): the toad comes to the middle of the screen and asks
   ready (4)      are you ready, and do you mean it?
   committed (4)  the "good" after you say yes, just before 3, 2, 1
   notYet (3)     you said not yet                                                    */
const RITUAL={
  hasu:{
    ready:[
      'Hm. Before we start: are you ready to actually do the work? Not tidy the desk. The work.',
      'Two hundred summers taught me one thing. Sit down only if you mean it. Do you?',
      'The lotus opens for people who stay. Are you staying for this one?',
      'Hm. Phone away, one thing in front of you. Ready to commit to it?'],
    committed:[
      'Hm. Good. That’s all I wanted to hear.',
      'Good. The mud is ready when you are.',
      'Hm. Good answer. I’ll hold you to it.',
      'Good. Let’s open the lotus a little.'],
    notYet:[
      'Hm. Then don’t. Come back when you mean it. I’ll be on my pad.',
      'Fair. Half a heart opens nothing. Find the other half, then tap me.',
      'No shame in that. Get some water. The pond isn’t going anywhere.']},
  ame:{
    ready:[
      'Rain’s coming. You staying?',
      'Ready? Really ready?',
      'One block. All of you. Yes?',
      'Clouds are in. Are you?'],
    committed:[
      'Good.',
      'Good. Rain starts.',
      'Hm. Good. Head down.',
      'Good. I’ll keep watch.'],
    notYet:[
      'Fine. Later, then.',
      'Not yet is honest. Come back.',
      'Hm. Rain can wait. Not forever.']},
  sumi:{
    ready:[
      'Mm. Before we begin, a small question. Are you ready, and do you mean it?',
      'Let us be precise. Is this a real session, or a hopeful one?',
      'One word will do. Committed?',
      'Mm. A session is a promise to yourself. Will you make it?'],
    committed:[
      'Good. I shall write that down: “committed.”',
      'Mm. Good. A clear answer is the best beginning.',
      'Good. Then let the first line be the hardest one.',
      'Good. Spoken plainly, and well.'],
    notYet:[
      'Mm. “Not yet” is an honest phrase. I respect it.',
      'Then we shall wait. A blank page keeps very well.',
      'Of course. Return when the words come easier.']},
  tabi:{
    ready:[
      'Alright, traveler! Boots laced, pack on. Ready to really walk this one?',
      'Road rule: don’t start a road you won’t walk. So, are you in?',
      'Dango’s ready. Dango is always ready. How about you?',
      'Big question before the first step: are you committed to this stretch?'],
    committed:[
      'Good! That’s the spirit. Dango, we’re off!',
      'Good, good! The first step was saying yes. The rest is walking.',
      'Ha! Good. I knew you had it in you.',
      'Good! Pack’s light, road’s clear. Let’s go.'],
    notYet:[
      'No trouble! The road waits. Dango and I will be right here.',
      'Fair enough. Sit, have some water, and holler when you’re ready.',
      'Not yet’s fine. A rested walker goes further.']},
  hotaru:{
    ready:[
      '…Mm? Oh. Are we doing this? Like, really doing it?',
      '…Before I light the lantern… are you ready? Committed?',
      '…It’s quiet. Good time to work. Are you in?',
      '…Mm. One lantern, one task. Ready to keep it lit?'],
    committed:[
      '…Good. I’m awake now. Mostly.',
      '…Mm. Good. Lantern’s lit.',
      '…Good answer. I’ll glow quietly.',
      '…Oh, good. Let’s go, then.'],
    notYet:[
      '…That’s okay. I’ll go back to resting my eyes.',
      '…Mm. Not yet. I know that feeling.',
      '…Okay. The lantern will still be here.']},
  neri:{
    ready:[
      'Sleeves up? Are you ready to put your hands in the clay for real?',
      'Before we start: are you committed, or just looking at the wheel?',
      'Good work starts with a yes. Do I have one?',
      'Clay doesn’t shape itself. Ready to sit with it?'],
    committed:[
      'Good. Now we make something, lopsided or not.',
      'Good! Don’t worry about perfect. Worry about done.',
      'Good. Wheel’s spinning. Hands steady.',
      'That’s what I like to hear. Good.'],
    notYet:[
      'That’s fine. Clay keeps if you cover it. Come back soon.',
      'Not yet? Then rest your hands. They’ll want work later.',
      'Fair. Make yourself some tea first. Then we’ll talk.']},
  oto:{
    ready:[
      'Um… are you ready? I mean, really ready? You can say no…',
      '…Before we start the song… are you committed? Sorry. It’s a big word.',
      'I’ll play quietly if you work. Is that… a yes?',
      'Um. Ready to begin? I tuned the flute just in case.'],
    committed:[
      'Oh! Good. Good. I’ll start the first note.',
      '…Good. That sounded very brave.',
      'Good… okay. Here we go. Together.',
      'Good! Sorry. I mean. Good.'],
    notYet:[
      'Oh, that’s okay! I wasn’t ready either, honestly.',
      '…Okay. I’ll keep practising till you are.',
      'No, no, that’s fine. The song can wait.']},
  kuri:{
    ready:[
      'Roots need steady water. Ready to be steady?',
      'Hm. You committed?',
      'Plant it now or don’t. Ready?',
      'Ground’s ready. Are you?'],
    committed:[
      'Good. Dig in.',
      'Good. Steady now.',
      'Hm. Good. Let it grow.',
      'Good. Quiet work, then.'],
    notYet:[
      'Fine. Seeds keep.',
      'Hm. Not yet. That’s allowed.',
      'Rest the soil. Come back.']},
  mame:{
    ready:[
      'Are you ready?! Like, REALLY ready? Pinky promise ready?',
      'Okay okay okay. Are we committed? I don’t know what that means but I’m doing it!',
      'Big mission time! Do you accept?',
      'Is it focus time? Are you ready? I’m ready! Are you?'],
    committed:[
      'YES! Good! This is the best mission ever!',
      'Good! I knew it! Let’s gooo!',
      'Good good good! I’ll be super quiet. Mostly.',
      'Woohoo! Good! Submarine mode!'],
    notYet:[
      'Aww. Okay! I’ll wait right here. Very patiently. Kind of.',
      'That’s okay! Even explorers take snack breaks!',
      'Oh! Okay. Can we do it later? Promise?']}
};
Object.keys(RITUAL).forEach(k=>{ if(L[k]) Object.assign(L[k],RITUAL[k]); });
if(typeof window!=='undefined') window.PET_LINES=L;
if(typeof module!=='undefined') module.exports=L;
})();
