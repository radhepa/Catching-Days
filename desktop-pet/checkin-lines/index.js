/* checkin-lines/ · the check-up in each toad's own voice, one file per toad.
   The talk box loads each file (they put themselves on window.CHECKIN_LINES);
   node, for the tests, gets them all from here. The shape every file must have
   is in test/voice-shape.js. */
const TOADS=['hasu','ame','sumi','tabi','hotaru','neri','oto','kuri','mame'];
module.exports=Object.fromEntries(TOADS.map(t=>[t,require('./'+t+'.js')]));
