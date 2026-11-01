/* checkin-lines/mame.js · the check-up in Mame's voice: the smallest toad, all exclamation marks, a leaf boat, big plans, and Hasu says so */
(function(){
const V={
  ask:[
    'Check-in! Check-in! What are you doing?!',
    'Hi! It’s me! What are you doing right now? Tell me everything!',
    'I sailed over to ask! What are you up to?',
    'Is it a fun thing? What are you doing?',
    'Ooh, what are you doing? I’m doing a check-in! That’s my job now!',
    'Knock knock! It’s the check-in toad! What are you doing?',
    'I’m back from sailing! What did your last half hour look like?',
    'Tell me true! Pinky promise! What are you doing right now?',
    'Hasu says I can ask every half hour. So! What are you doing?',
    'What has your eyes right now? I want to know!',
    'First mate reporting! Um, no, YOU report! What are you doing?',
    'Psst. What are you doing? You can whisper it.',
    'I’m making a map of your day. What goes here, right now?',
    'What are you up to? Is it a big thing or a small thing?',
    'I have the journal open! What are you doing, so I can write it?'],
  askMorning:[
    'Good morning! The pond is all sparkly! What are you doing this morning?',
    'Morning! I woke up SO early! What are you up to?',
    'It’s morning! A whole new adventure! What are you doing right now?',
    'Did you have breakfast? I had a bug. What are you doing this morning?'],
  askAfternoon:[
    'Good afternoon! The sun is on my boat! What are you doing?',
    'It’s the middle of the day! The exact middle! What are you up to?',
    'Afternoon check-in! I had a snack and a nap. What are you doing?'],
  askEvening:[
    'It’s evening! The frogs are starting to sing! What are you doing?',
    'The sky is going orange! What are you up to tonight?',
    'Evening check-in! Hasu is yawning already. What are you doing?'],
  askLate:[
    'It’s SO late! Why are we awake? What are you doing?',
    'Psst! It’s way past bedtime! What are you doing?',
    'Even the koi are asleep! What are you doing up so late?',
    'I’m supposed to be in bed. Shh! Don’t tell Hasu. What are you doing?',
    'The moon is on the pond! It’s so late! What’s keeping you up?'],
  askBack:[
    'You’re back!! Where did you go? What were you doing?',
    'You came back! I waited! On my boat! What were you up to?',
    'There you are! I looked under every lily pad! What have you been doing?',
    'Welcome back, captain! What happened while you were gone?',
    'Hi again! I missed you a medium amount! What did you do?'],
  askBreak:[
    'It’s break time! What are you doing with your break?',
    'Break! Are you stretching like a starfish? What are you doing?',
    'Ooh, a break! Did you get water? What are you up to?'],
  askPrevGood:[
    'Last time it was {prev}! I put a sticker on it! What are you doing now?',
    'Still {prev}? Or a new thing? Tell me tell me!',
    'You were so busy with {prev} before! I told the koi! What about now?'],
  askPrevDrift:[
    'Last time it was {prev}. Is it still that? What are you doing now?',
    'It was {prev} last time! Did you sail away from it? What now?',
    'Hmm, {prev} last time. What is it now? Something brave?'],

  switched:[
    'WOW! {Did} instead of {avoided}?! That was such a good choice! I’m telling Hasu!',
    '{Did} beat {avoided}! Like a boss fight! You won!',
    '{Did} over {avoided}?! That’s the bravest thing I heard all day!',
    'You picked {did} and not {avoided}! I’m putting a gold sticker on you!',
    '{Avoided} was calling and you said nope, {did}! Like a captain steering the boat!',
    'Wait. {Avoided} was right there and you chose {did}? You’re a big kid. A really big one.',
    '{Did} instead of {avoided}. I wrote it down in my best writing. It’s my favorite page now.',
    'HASU! They chose {did} over {avoided}! She said hm! That’s the good hm!'],
  resisted:[
    'You said no to {avoided}?! That’s so strong! Are you a superhero?',
    'Bye-bye, {avoided}! You don’t need it! Splash!',
    'You put {avoided} down? Just like that? Wow. Teach me!',
    '{Avoided}, skipped! I’m doing a cannonball for you! SPLASH!',
    'Turning down {avoided} is hard! I can’t even turn down a bug! You’re so strong!',
    '{Avoided} is floating away now. Bye! Wave with me!',
    'You told {avoided} not right now? That’s a grown-up move. I’m impressed. Quietly.'],
  finished:[
    '{Did} is DONE?! Yay! Another fish! SPLASH!',
    'You finished {did}! I’m doing a happy dance on my boat!',
    '{Did}, all done! Can I put a sticker on it? A big one?',
    '{Did} is finished! I’m naming the next fish after you!',
    'All done with {did}?! Hasu is gonna say hm. The good hm.',
    'Done done? Like totally done? {Did}, finished! I’m hopping!',
    'You got through {did}. That’s a big thing. I’m really proud of you.'],
  good:[
    '{Did}! Ooh! You’re so busy! I’ll be quiet. Very quiet. Kind of.',
    '{Did}! That’s a big kid thing! Keep going!',
    'You’re doing {did} right now? So cool! I’ll guard you from sharks!',
    '{Did}. I’m sitting in my boat cheering. Quietly. Go go go.',
    'Ooh, {did}. You look like a real explorer. Keep exploring!',
    '{Did}? Nice! I’ll float right here and not bug you. Mostly.',
    'Look at you, doing {did}! When I grow up I want to be like you.'],
  started:[
    'You started {did}! Starting is the hardest part! Hasu told me!',
    '{Did}, started! The boat is out of the dock! Full speed ahead!',
    'The very beginning of {did}! Beginnings are my favorite part!',
    'You pushed off with {did}! I gave your boat a little push too!',
    'Ooh, {did} just started? That’s step one! Step two is easier, I think!'],
  trying:[
    '{Did} is hard? Hard means you’re getting bigger! That’s how it works, I think.',
    'You’re trying {did} even though it’s hard? That’s the bravest kind of trying!',
    'Big things are just lots of small things holding hands. Do one small bit of {did}!',
    'Explorers get stuck all the time! Keep going with {did}. I’ll cheer!',
    'Even Hasu says some things are hard. Keep at {did}. Little paddles!'],
  turnaround:[
    'You drifted off to {avoided} but came BACK to {did}! Like a boomerang! A good boomerang!',
    '{Avoided}, then {did} again! That’s a comeback! I love comebacks!',
    'You got lost in {avoided} and found your way back to {did}! Like a real explorer!',
    '{Avoided} tried to steal you, but you sailed home to {did}! Hooray!',
    'You came back to {did}! Coming back is hard. I know. I get lost in the reeds sometimes.',
    '{Did} again, after {avoided}! I knew you’d come back. I told the koi so.'],
  slipping:[
    'Oh! {Did}, then {avoided}. Can we go back to {did}? For me? Please?',
    '{Avoided} sneaked in! Sneaky! Back to {did}?',
    'You were doing so good at {did}! {Avoided} is pulling your boat. Paddle back?',
    'Uh oh! {Avoided} is a whirlpool! Grab my paddle! Back to {did}!',
    '{Did} was going so well. Maybe put {avoided} down for a bit? I’ll hold it. I won’t look.',
    'Hmm. {Avoided} after {did}? Let’s do five more minutes of {did}. Together!'],
  driftAware:[
    '{Did}? But {want} is waiting! Can we do just a tiny bit of {want}? Pleeease?',
    'You know {want} is next! Five minutes! I’ll count! One… two…',
    '{Did} is fun, but {want} is waving at you! Can we wave back? Just a little?',
    'Ooh, {did}. And {want} is waiting at the dock. What’s the littlest piece of {want}?',
    'Let’s do one small bit of {want}. Then you can go back to {did}! Deal?',
    'I won’t be bossy. But {want} misses you! Just the very first step?'],
  drift:[
    '{Did}? That’s okay! Sometimes I just float in my boat. Then we do a thing!',
    'Ooh, {did}. Can we do one small thing after? A tiny one?',
    '{Did}, huh? I float around too sometimes. When you’re ready, let’s go catch a fish!',
    'Oh, {did}. That’s okay. Want me to pick a tiny task? I’m good at picking!',
    '{Did}! My boat drifts too when I stop paddling. One paddle? Just one?',
    'It’s okay! Even explorers sit down sometimes. After {did}, a little adventure?',
    'Hmm, {did}. Can we stand up and stretch like a starfish? Then decide?'],
  unwinding:[
    '{Did}! Fun! Is it fun? Then back to work, okay?',
    'Ooh, {did}! Can I watch too? Just a little bit, then back!',
    '{Did}! A break is a good thing! Hasu takes breaks. Long ones.',
    'Ooh, {did}! Rest your brain! Then we sail again, okay?',
    '{Did}! Is it a good one? Tell me after! But don’t stay forever.',
    'Breaks are like snacks for your brain! Enjoy {did}!'],
  missed:[
    'You skipped {avoided}? That’s okay! Tomorrow! I’ll remind you!',
    '{Avoided} didn’t happen? Aww. Tomorrow’s a new adventure!',
    '{Avoided} didn’t happen. That’s okay. My boat sinks sometimes too. Then I fix it!',
    'Aww, {avoided} got away. We’ll catch it next time!',
    'So {avoided} got skipped. It’s okay! Tomorrow I’ll wake you up with a splash!',
    'Even Hasu misses things. She says she doesn’t. But she does. {Avoided} can be tomorrow!'],
  missedOk:[
    'Resting instead of {avoided}? Good! Grown-ups need naps too!',
    '{Avoided} can wait! Resting is important. Hasu said so.',
    'You rested instead of {avoided}? Smart! Tired toads fall off their boats!',
    '{Avoided} can be another day. Your body said rest, so you listened! Good listening!',
    'Skipping {avoided} to rest is okay! Even the lotus closes at night!',
    'Hasu says rest is part of the work. I didn’t get it. But I think you do! {Avoided} can wait.'],
  reluctant:[
    'You don’t want to do {want}? Me neither, with baths. But after, it’s nice! Just start!',
    '{Want} is boring? Let’s pretend it’s a treasure hunt!',
    'You don’t feel like {want}? That’s okay! What if we only do the tiniest bit?',
    'I don’t like starting things either. My boat is cold in the morning! But then it’s fun. Try {want}?',
    'What if {want} is a dragon, and you’re a knight, and you just poke it once? Just once!',
    'Hmm. {Want} feels big? Let’s make it small. Like toad small.'],
  plan:[
    '{Want} next?! Ooh! Go go go!',
    'You’re gonna do {want}! I believe in you! So much!',
    'Next is {want}? I’ll pack your boat! Snacks! A map! Okay go!',
    'Ooh, {want}! I’ll wave from here! Bye! Good luck! Bye!',
    '{Want} is the plan? That’s such a good plan! Better than my plans!',
    'You’re about to do {want}! I’m so excited I might fall in the pond!'],
  care:[
    '{Did}! Good! Taking care of yourself is a quest too!',
    'Ooh, {did}! That’s important! Hasu says so!',
    '{Did}! That’s like filling up your boat! Good!',
    'Ooh, {did}. Bodies need stuff! Even toad bodies! Even yours!',
    '{Did}? Yay. Hasu says a looked-after toad catches more fish!',
    'You’re looking after yourself! {Did} counts! It totally counts!'],
  struggle:[
    'Oh no… that sounds hard. Do you want a hug? I’m small but I hug good.',
    'That sounds really hard. You can rest. I’ll guard you. From my boat.',
    'Oh. I’m sorry. Can I sit next to you? I’ll be very small and quiet.',
    'That sounds heavy. You don’t have to fix it all now. Just breathe with me? In… out…',
    'Hard days happen. Even to Hasu. She told me. You’re still my favorite.',
    'I’m right here. On my boat. Not going anywhere. You can tell me more if you want.'],
  upbeat:[
    'YAY! Happy is the best! Me too!',
    'That’s so good! I’m doing a little splash!',
    'You feel good?! Then I feel good! That’s how it works!',
    'Happy! Happy! I’m spinning in my boat! Whee!',
    'Ooh, good mood! Save some for later, okay? Like a snack!',
    'That makes me so happy I could tell the whole pond. I’m going to.'],
  unknown:[
    'I wrote it in your journal! In my best writing!',
    'Got it! It’s in the journal! I didn’t even spell anything wrong!',
    'Hmm, I didn’t totally get it. But I wrote it down anyway! It’s in the journal!',
    'I’m not sure what that means yet. I’m still little! It’s in the journal though!',
    'Ooh, a mystery! I put it in the journal. Hasu can help me read it later.',
    'I wrote it in the journal exactly how you said it! Every letter!'],

  tired:[
    ' Now rest! Okay? Promise!',
    ' You sound tired. Get some water? I’ll drink pond with you.',
    ' And then a little rest. Even boats get pulled up on the shore.',
    ' Tired is okay! It means you worked hard!'],
  late:[
    ' But it’s late! Bedtime! Even for big kids!',
    ' Now sleep! Hasu says sleep is when you grow!',
    ' The moon is out! Time to tuck in, okay?',
    ' I’m yawning! You should yawn too! Then bed!'],
  long:[
    ' That’s a LOT of hours, though! Walk with me? Around the pond?',
    ' That was a long float! Stand up and stretch like a starfish?',
    ' Hours and hours! Get some air? I’ll ride in your pocket!',
    ' A long time, huh? Maybe a glass of water and a little walk?'],
  back:[
    'Way better than last time!! ',
    'Ooh, that’s different from before! Good different! ',
    'Last time was a drift, but THIS time! ',
    'You turned your boat around! '],

  topics:{
    study:{yes:[
      'Studying makes your brain bigger! I think. I’m going to study boats.',
      'Every flashcard is a little fish for the pond!',
      'Hasu says studying is just asking the book questions. Ask it lots!'],no:[
      'Not feeling the studying? Just one page! One page is tiny!',
      'The books can wait a bit. But they miss you! A little bit!']},
    homework:{yes:[
      'Is homework called that because you do it at home? You can do it anywhere! Even a boat!',
      'One problem at a time! Like hopping on lily pads!',
      'Homework is like a treasure map. Every answer is an X!'],no:[
      'The homework is still there. Want to do just the first question with me?',
      'Homework gets grumpy when it waits too long. Maybe one little bit?']},
    essay:{yes:[
      'Writing is like building a boat out of words! Word by word!',
      'Ooh, sentences! Can you put a toad in it? Just a small one?',
      'One sentence, then another sentence! That’s how essays grow!'],no:[
      'Blank pages are scary. Write one bad sentence! Bad ones are allowed!',
      'The essay can start messy. Mine always do. I write in mud!']},
    reading:{yes:[
      'Reading! Is there a toad in it? There should be a toad in it.',
      'Books are adventures you can carry! I want one about boats!',
      'Turn the pages slowly. Hasu says the good parts hide in the middle.'],no:[
      'Just one page? Then you can stop if you want! I promise!',
      'The book will wait on the shelf. Books are good at waiting.']},
    coding:{yes:[
      'Coding! Is it magic words for the computer? You’re a wizard!',
      'Can you code me a bigger boat? Later! After your thing!',
      'Hasu says code bugs are not the yummy kind. Good luck catching them!'],no:[
      'The code can wait. Maybe write just one line? One line is a start!',
      'Even wizards take breaks from spells. Come back to it soon!']},
    class:{yes:[
      'Class! Big kid learning! Tell me one thing after!',
      'Sit near the front! That’s where the smart stuff lands first! I think.',
      'Ooh, a teacher! Hasu is my teacher. She mostly says hm.'],no:[
      'Missing class happens. Can you get the notes from a friend?',
      'Next class you’ll go! I’ll remind you! Loudly!']},
    work:{yes:[
      'Work! Like a grown-up! Do you have a desk? You do! I’m on it!',
      'Emails are like letters in bottles! Floating to people!',
      'Grown-up work makes the grown-up world go round. I think. Good job!'],no:[
      'Work feels heavy? Do the easiest one first. That’s my trick!',
      'The work pile is still there. Pick the littlest thing? Like a pebble?']},
    gym:{yes:[
      'The gym! Are you lifting heavy things? Can you lift my boat?',
      'Muscles! You’re going to be so strong! Stronger than a bullfrog!',
      'I do push-ups too! Well, hops. Hops count!'],no:[
      'The gym will still be there! Even ten push-ups at home count!',
      'Not today? Then next time the gym gets double the you!']},
    run:{yes:[
      'Running! Fast like a dragonfly! Zoom!',
      'Wait for me! My legs are tiny! Okay, go on without me!',
      'Run run run! Feel the wind? I feel it in my boat!'],no:[
      'Even a little jog counts! Down the street and back?',
      'Put your shoes by the door! That makes the next run easier!']},
    walk:{yes:[
      'A walk! Look for puddles! Puddles are tiny ponds!',
      'Walks are so nice. Say hi to every tree for me!',
      'Can I come on the walk? I’ll ride on your shoulder! I’m very light!'],no:[
      'Just to the door and back? That’s a tiny walk! Tiny walks count!',
      'Some fresh air later, maybe? The sky misses you!']},
    sport:{yes:[
      'Sports! I’m on Team Toad! Which team are you on?',
      'You’re moving so much! I can only hop and swim! And sail!',
      'Swimming is my favorite. But every sport is a good sport!'],no:[
      'Next time you’ll go! I’ll keep your spot warm!',
      'Maybe a little stretch instead? Starfish style!']},
    cleaning:{yes:[
      'Cleaning! Everything gets so shiny! I polish my boat sometimes!',
      'Laundry goes round and round! Like a whirlpool! A clean one!',
      'Tidy room, tidy brain! Hasu said that. Or I did. Someone did.'],no:[
      'Just one little pile? Like five things? I’ll count them!',
      'The mess is patient. But a tiny tidy feels so good!']},
    cooking:{yes:[
      'Cooking! What are you making? Does it have bugs in it? Just checking!',
      'It smells so good! I can’t smell it from here. But I bet it does!',
      'You’re a chef! A real one! Chef of the pond!'],no:[
      'Something simple still counts! Toast is cooking! I think.',
      'Not cooking is okay. Just make sure you eat something yummy!']},
    selfcare:{yes:[
      'Taking care of you! That’s the most important job! Even more than boats!',
      'Water! Air! Showers! You’re like a happy pond plant!',
      'Hasu says a calm toad catches more fish. Breathe!'],no:[
      'Maybe one glass of water? For me? Please?',
      'A little care for you, soon? Even one big breath counts!']},
    food:{yes:[
      'Food! Yum! What is it? Is it a bug? It’s probably not a bug.',
      'Eating is fuel for your boat! Fill it up!',
      'Chew chew chew! Good food makes big ideas!'],no:[
      'You need to eat something! Even a snack! A small yummy one!',
      'Hungry brains get grumpy. Mine does! Grab a bite?']},
    people:{yes:[
      'Friends! I have friends too! The koi! They don’t talk much.',
      'People time! Tell them a toad says hi!',
      'People you love are like warm sun on a lily pad!'],no:[
      'Maybe send them a little message? Even just hi!',
      'They’ll still be there. Plan a hang soon? I’ll come!']},
    sleep:{yes:[
      'Sleep! Sleep is a superpower! Hasu told me!',
      'A nap! I nap in my boat. It rocks like a cradle!',
      'Sweet dreams! Dream about fish! Or boats! Or me!'],no:[
      'Not enough sleep makes everything wobbly. Try for bed a little early?',
      'Even a tiny rest helps! Close your eyes for a bit?']},
    break:{yes:[
      'Break time! Stretch like a starfish! A big one!',
      'Rest your eyes! Look at something far away! Like a cloud!',
      'Breaks are good! Hasu takes so many. That’s why she’s so wise! I think.'],no:[
      'No breaks yet? Take a tiny one! Wiggle your toes!',
      'Working without breaks makes you tired! Even boats dock sometimes!']},
    scrolling:{yes:[
      'The phone is so sparkly, huh? Put it face down for a bit? Like a nap for it!',
      'Scroll scroll scroll… my thumb would get so tired! Let’s rest it?',
      'Phones are like whirlpools! Fun, but they pull you round and round!'],no:[
      'You put the phone away! It’s napping now! Good job!',
      'You beat the whirlpool! The phone lost! You won!',
      'The phone is sleeping and you’re awake! That’s the right way round!']},
    bedrot:{yes:[
      'Bed is so cozy, huh? But the sun is out! Can you sit up? Just sitting!',
      'Blankets are like a burrow. I like burrows. But just one leg out? Then two?',
      'Being in bed is okay for a bit! Then let’s open a window?'],no:[
      'You got out of bed! That’s the hardest hop of the day!',
      'Up and out of the blankets! I’m cheering so loud!']},
    gaming:{yes:[
      'Games! Are you winning? Is there a toad character? There should be!',
      'Gaming is fun! Maybe set a little timer so it doesn’t eat the whole day?',
      'Level up! But real life has levels too! Just saying!'],no:[
      'You put the controller down! That’s a real-life boss defeated!',
      'Saving the game for later! Smart! The game will wait!']},
    watching:{yes:[
      'Ooh, a show! Is it about boats? Is it about frogs? I hope so.',
      'One episode is nice! Then let’s peek at your list?',
      'Watching is a good rest! Just don’t let it autoplay forever!'],no:[
      'You turned it off? Wow! The screen is resting now!',
      'The show can wait for later! It’s not going anywhere!']},
    idle:{yes:[
      'Doing nothing is okay for a little bit! I float in my boat lots!',
      'Hmm, not much? What’s the smallest thing you could do? Like, tiny?',
      'Feeling stuck? Explorers get stuck all the time! Then they pick a direction!'],no:[
      'You stopped waiting around and did a thing! That’s so brave!',
      'From nothing to something! That’s like magic!']}
  }
};
if(typeof window!=='undefined') (window.CHECKIN_LINES=window.CHECKIN_LINES||{}).mame=V;
if(typeof module!=='undefined') module.exports=V;
})();
