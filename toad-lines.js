/* toad-lines.js · Catching Days · what Ame, Sumi, Tabi and Hotaru say
   ─────────────────────────────────────────────────────────────────────────
   The app's copy of the designer's toads-design/toad-lines-cast.js (which stays
   untouched), same shape as Hasu's lines in toads.js: intro / idle / ctx / ask.
   Two optional additions, both handled by toads.js:
     ask[].when(s)   only ask this question when it fits (e.g. not mid-session)
     choice.act      after the toad's reply, ONE whitelisted app action, and only
                     when the owner has picked that choice (toads.js ACTS):
                       'startSession' → startSession()   (only on the Focus setup
                                         screen, with a task picked; else Focus setup)
                       'newEntry'     → diaryModal()     (a blank new entry; nothing saved)
                       'newJourney'   → journeyModal()   (a blank new journey; nothing saved)
                     (choice.go still opens a screen with tab(), as for Hasu)
   Lines stay under ~140 characters. */
(function(){
'use strict';
const pl=(n,w)=>n===1?w:w+'s';
const short=(x,n)=>x.length>n?x.slice(0,n-1).trimEnd()+'…':x;
const L={

/* ── Ame · Keeper of the Rain · Focus ──
   Voice: the quiet one. Fragments. Two to seven words a sentence, often one.
   Weather, staying put, one more cycle. Never asks why. Never cheers. */
ame:{
  intro:[
    'Hm. Company.',
    'Ame. I keep the rain. When you focus, it falls. I sit in it.',
    'I don’t talk much. Tap if you need a word. I have a few.'],
  idle:[
    {id:'hurry',  t:'Rain doesn’t hurry. Still gets everything wet.'},
    {id:'method', t:'Sit. Breathe. Work. That’s the whole method.'},
    {id:'one',    t:'One cycle. Then we’ll see.'},
    {id:'phone',  t:'The phone can wait. It always waits.'},
    {id:'loud',   t:'Loud day? Rain’s louder. Listen to that.'},
    {id:'drop',   t:'Don’t chase the whole storm. Catch one drop.'},
    {id:'tired',  t:'Tired is fine. Tired and here is better.'},
    {id:'stay',   t:'Stay.'},
    {id:'again',  t:'Good. Again.'},
    {id:'low',    t:'Water finds the low places. Start there. Start easy.'}],
  ctx:[
    {id:'late',  when:s=>!s.running&&(s.hr>=23||s.hr<4), key:s=>s.day,
      t:()=>'Late. One short one, then sleep. The rain keeps till tomorrow.'},
    {id:'pause', when:s=>s.running&&s.paused, key:s=>s.day+'|'+s.sessionId,
      t:()=>'Paused. Fine. Don’t let it go cold.'},
    {id:'break', when:s=>s.running&&s.phase==='break', key:s=>s.day+'|'+s.sessionId+'|'+s.cycles,
      t:()=>'Break. Stretch. Drink water. The rain will wait.'},
    {id:'long',  when:s=>s.running&&s.cycles>=3, key:s=>s.day+'|'+s.sessionId+'|'+s.cycles,
      t:s=>`${s.cycles} cycles. Good rain. Look away from the screen a minute.`},
    {id:'head',  when:s=>s.running&&s.phase==='focus', key:s=>s.day+'|'+s.sessionId,
      t:()=>'Rain’s steady. Head down. I’ll keep watch.'},
    {id:'cover', when:s=>!s.running&&s.goal>0&&s.mins<s.goal&&s.goal-s.mins<=s.focusLen, key:s=>s.day,
      t:s=>`${s.goal-s.mins} ${pl(s.goal-s.mins,'minute')} to bloom. One cycle covers it.`},
    {id:'bloom', when:s=>!s.running&&s.goal>0&&s.mins>=s.goal, key:s=>s.day,
      t:()=>'Lotus is open. Rain can stop. Or not. Your call.'}],
  ask:[
    {id:'phone', q:'Phone. Where is it?', c:[
      {t:'Face down.', r:'Good.'},
      {t:'In my hand.', r:'Hm. Across the room. I’ll wait.'},
      {t:'Why?', r:'Rain doesn’t check its phone. Neither should you, for twenty-five minutes.'}]},
    {id:'stay', q:'How long can you stay?', when:s=>!s.running, c:[
      {t:'One cycle. Start it.', r:'One is plenty. Go.', act:'startSession'},
      {t:'A long while.', r:'Then pace it. Take the breaks. Rain comes in waves.'},
      {t:'Not long today.', r:'Ten minutes is still rain.'}]},
    {id:'for', q:'This session. What’s it for?', c:[
      {t:'I know.', r:'Then only that.'},
      {t:'Not sure.', r:'Pick before the bell. Not after.', go:'asg'},
      {t:'Getting through it.', r:'Honest. Through is a direction.'}]}]
},

/* ── Sumi · Keeper of the Ink · Journal ──
   Voice: gentle, exact, a little formal. Whole sentences. Interested in words
   and naming things. Never reads your pages and says so. Asks small
   questions that can be answered in one word. "Mm." now and then. */
sumi:{
  intro:[
    'Ah. Hello. Mind the ink, it’s still wet.',
    'I’m Sumi. I keep the ink. I see the dates on your pages and nothing more. The words are yours.',
    'When a day is hard to put into words, tap me. I’ll ask something small, and one word will do.'],
  idle:[
    {id:'honest', t:'A page doesn’t have to be good. It only has to be honest, and dated.'},
    {id:'name',   t:'Naming a feeling makes it smaller. Not gone. Smaller.'},
    {id:'three',  t:'Three lines is a real entry. I’ve seen poems shorter.'},
    {id:'ink',    t:'The best ink is the ink you actually use.'},
    {id:'carry',  t:'Write it down and you can stop carrying it around all day.'},
    {id:'messy',  t:'Mm. Messy handwriting still counts.'},
    {id:'old',    t:'Old pages are kind to the people who wrote them. Read one sometime.'},
    {id:'weather',t:'When nothing will come out, start with the weather.'},
    {id:'margin', t:'A margin is a good place for the thing you didn’t mean to say.'},
    {id:'blank',  t:'A blank day still happened. It might just want one line.'}],
  ctx:[
    {id:'late',   when:s=>s.hr>=23||s.hr<4, key:s=>s.day,
      t:()=>'Late pages are honest pages. Keep it short, then get some sleep.'},
    {id:'heavy',  when:s=>s.lastMood==='rough'||s.lastMood==='bad', key:s=>s.day,
      t:()=>'Your last page sounded heavy. I won’t pry. I’ll only ask how today is.'},
    {id:'wrote',  when:s=>s.wroteToday, key:s=>s.day,
      t:()=>'You wrote today. The page is holding it now, so you don’t have to.'},
    {id:'gap',    when:s=>!s.wroteToday&&s.lastEntryDays>=5, key:s=>s.day,
      t:s=>`${s.lastEntryDays} days since the last page. No apology needed. Start with the date.`},
    {id:'evening',when:s=>!s.wroteToday&&s.hr>=19&&s.hr<23, key:s=>s.day,
      t:()=>'Evening. Two lines about today, before it slips away?'},
    {id:'month',  when:s=>s.monthEntries>=8, key:s=>s.day.slice(0,7)+'|'+Math.floor(s.monthEntries/4),
      t:s=>`${s.monthEntries} entries this month. That’s a real record of a real month.`}],
  ask:[
    {id:'word', q:'If today were one word, which would it be?', c:[
      {t:'Good.', r:'Then write down why, while you still remember the reason.', act:'newEntry'},
      {t:'Heavy.', r:'A fair word. You needn’t explain it to me. You might, to the page.', act:'newEntry'},
      {t:'I don’t know.', r:'That counts too. Start with what you ate. It loosens the pen.'}]},
    {id:'room', q:'What’s taking up the most room in your head right now?', c:[
      {t:'Schoolwork.', r:'Then make it a list, not a cloud. Lists have edges.', go:'asg'},
      {t:'Something personal.', r:'Then it belongs on a page only you can read. That’s what this place is.'},
      {t:'Nothing much.', r:'Mm. Enjoy that. It’s rarer than it should be.'}]},
    {id:'better', q:'What went better this week than you expected?', c:[
      {t:'Something, actually.', r:'Write it down. Good things leave fainter marks than bad ones, so we help them.', act:'newEntry'},
      {t:'Nothing yet.', r:'The week isn’t finished. I’ll ask again.'},
      {t:'Hard to say.', r:'Look back over the calendar. The pads remember more than we do.'}]}]
},

/* ── Tabi · Keeper of the Road · Journeys ──
   Voice: the chatty one. Warm, practical, folksy. Roads, steps, distance,
   "road rules". Talks to (and about) Dango the snail. Longer sentences,
   easy humour, never a lecture. */
tabi:{
  intro:[
    'Oh! Hello there. Mind your step, these stones are slippery.',
    'Name’s Tabi. I keep the road. Every day you keep a habit, a stone comes up out of the water, and I walk on it.',
    'This is Dango. She’s slower than me, and somehow she’s always first to wherever we’re going.'],
  idle:[
    {id:'cheap',  t:'Road rule: the first step is the cheap one. Take it while it’s on sale.'},
    {id:'once',   t:'Nobody walks a road all at once. Not even Dango, and she’s very determined.'},
    {id:'patient',t:'Skipped a day? The road’s still there. Roads are patient like that.'},
    {id:'river',  t:'Small and every day beats big and once. Ask any river.'},
    {id:'miles',  t:'Dango’s ridden on my head for three hundred miles. She’s never once hurried.'},
    {id:'back',   t:'Look back now and then. You’ve come further than it feels.'},
    {id:'light',  t:'Pack light. One habit at a time.'},
    {id:'stones', t:'Rain or sun, the stones stay put. That’s the whole trick of stones.'},
    {id:'thread', t:'Lost the thread? Pick the easiest step and call it a start.'},
    {id:'break',  t:'Dango says take a break. Dango always says that. She’s not wrong.'}],
  ctx:[
    {id:'none',   when:s=>!s.journey, key:s=>s.day,
      t:()=>'No road yet. Pick one small thing you’d like to do most days. I’ll walk it with you.'},
    {id:'done',   when:s=>s.journey&&s.journey.todayN>0&&s.journey.todayDone>=s.journey.todayN, key:s=>s.day,
      t:()=>'Today’s stone is up. Dango and I are standing on it. Thank you.'},
    {id:'evening',when:s=>s.journey&&s.journey.todayDone<s.journey.todayN&&s.hr>=18, key:s=>s.day,
      t:s=>{ const n=s.journey.todayN-s.journey.todayDone; return `Today’s stone is still under water. ${n} ${pl(n,'habit')} to go. There’s time.`; }},
    {id:'end',    when:s=>s.journey&&s.journey.days-s.journey.day<=3, key:s=>s.day,
      t:s=>`Day ${s.journey.day} of ${s.journey.days}. The end of the road’s in sight. Walk it in.`},
    {id:'streak', when:s=>s.journey&&s.journey.streak>=7, key:s=>s.day,
      t:s=>`${s.journey.streak} days in a row. That’s not luck anymore. That’s a path.`},
    {id:'gap',    when:s=>s.journey&&s.journey.missedYesterday, key:s=>s.day,
      t:()=>'Missed yesterday. Fine. A path with a gap in it is still a path.'},
    {id:'morning',when:s=>s.hr>=5&&s.hr<10, key:s=>s.day,
      t:()=>'Morning. Best time for the road. Legs are fresh and the excuses aren’t up yet.'}],
  ask:[
    {id:'far', q:'How far do you want to get today?', c:[
      {t:'Just one step.', r:'One step is a journey with good manners. Go and take it.'},
      {t:'About halfway.', r:'Halfway’s a fine place to stop for tea. Then keep going.'},
      {t:'All the way.', r:'Then pace it. Even Dango stops for lunch.'}]},
    {id:'skip', q:'Which habit is the easiest one to skip?', when:s=>!!s.journey, c:[
      {t:'I know which.', r:'Then do that one first, before it gets the chance.'},
      {t:'All of them, lately.', r:'Then make one smaller. Small enough that skipping it feels silly.'},
      {t:'None, honestly.', r:'Ha. Dango doesn’t believe you. I do, mostly.'}]},
    {id:'new', q:'Fancy starting a new road?', when:s=>!s.journey, c:[
      {t:'Let’s.', r:'Good. Pick something small and how many days. I’ll be waiting at the first stone.', act:'newJourney'},
      {t:'Not yet.', r:'No rush. The road’ll keep.'}]}]
},

/* ── Hotaru · Keeper of the Lanterns · Collection ──
   Voice: sleepy, soft and slow. Often starts with "…" or "Mm…". Talks about
   small lights, the dark, what's been found and what's still out there.
   Wonders out loud. Gently funny about being half asleep. */
hotaru:{
  intro:[
    '…Hm? Oh. I wasn’t asleep. I was resting my eyes.',
    'I’m Hotaru. I keep the lanterns. Every fish and bug you find, I light one for it.',
    'It’s a lot of lanterns now. Tap me if you want to know what’s still out there.'],
  idle:[
    {id:'lights', t:'…Mm. Every light in here was a task you finished. Did you know that?'},
    {id:'steady', t:'The rare ones aren’t hiding. They’re waiting for steady people.'},
    {id:'jar',    t:'Small lights add up. Look at this jar.'},
    {id:'doze',   t:'…Sorry. Dozed off. Were we finding something?'},
    {id:'night',  t:'The pond is bigger at night. Everything is.'},
    {id:'all',    t:'You don’t have to find them all. I like the looking part.'},
    {id:'glow',   t:'A firefly only glows a little. It’s enough to find each other.'},
    {id:'reeds',  t:'Mm. The reeds were rustling earlier. Something new, maybe.'},
    {id:'rest',   t:'Rest is allowed. I’m doing it right now.'},
    {id:'back',   t:'Some fish only turn up for people who keep coming back.'}],
  ctx:[
    {id:'late',  when:s=>s.hr>=23||s.hr<4, key:s=>s.day,
      t:()=>'…It’s late. Good hours for lanterns. Not so good for students. Sleep soon?'},
    {id:'new',   when:s=>!!s.newToday, key:s=>s.day+'|'+s.newToday,
      t:s=>`A new one today. The ${short(s.newToday,32)}. I lit a lantern for it already.`},
    {id:'close', when:s=>s.next&&s.next.n-s.next.cur<=3&&s.next.n>s.next.cur, key:s=>s.day+'|'+s.next.name,
      t:s=>{ const k=s.next.n-s.next.cur; return `The ${short(s.next.name,30)} is circling. ${k} more and it’s yours.`; }},
    {id:'bug',   when:s=>s.bugToday===false&&s.hr<19, key:s=>s.day,
      t:()=>'Something’s visiting the reeds on Today. By the list. Go look before dusk.'},
    {id:'legend',when:s=>s.legendary>=1, key:s=>'L'+s.legendary,
      t:()=>'You found a legendary one. I’ve been telling everyone. Well. The fireflies.'},
    {id:'many',  when:s=>s.fish>=25, key:s=>'F'+Math.floor(s.fish/25),
      t:s=>`${s.fish} kinds of fish now. When I started, the pond was mostly me.`},
    {id:'bugs',  when:s=>s.bugs>=10, key:s=>'B'+Math.floor(s.bugs/10),
      t:s=>`${s.bugs} bugs in the book. The reeds are starting to talk about you.`}],
  ask:[
    {id:'which', q:'…Fish or bugs? Which do you like better?', c:[
      {t:'Fish.', r:'Mm. Good company. Quiet, like me.'},
      {t:'Bugs.', r:'Ha. The fireflies will be pleased. Don’t tell the koi.'},
      {t:'Both.', r:'Good answer. Diplomatic. You’d make a fine keeper.'}]},
    {id:'next', q:'What would you like to find next?', c:[
      {t:'Something legendary.', r:'Then keep a streak going. Legends like steady people.', go:'run'},
      {t:'Whatever turns up.', r:'Best way to find things. Finish a task and see what swims in.', go:'asg'},
      {t:'Nothing. I’m tired.', r:'…Same. Rest. The pond will still be here.'}]},
    {id:'late', q:'…Is it late where you are?', c:[
      {t:'Yes.', r:'Then put the lantern down. One more task can be tomorrow’s first one.'},
      {t:'Not really.', r:'Oh. Then it’s just me who’s sleepy. Carry on.'}]}]
}
};
window.TOAD_LINES_CAST=L;
})();
