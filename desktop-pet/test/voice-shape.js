// the shape one toad's check-up lines must have (checkin-lines/<toad>.js); returns a list of problems, empty when fine
// node -e "console.log(require('./test/voice-shape')(require('./checkin-lines/hasu.js')))"
const KINDS={switched:'did avoided',resisted:'avoided',finished:'did',good:'did',started:'did',trying:'did',
  turnaround:'did avoided',slipping:'did avoided',driftAware:'did want',drift:'did',unwinding:'did',
  missed:'avoided',missedOk:'avoided',reluctant:'want',plan:'want',care:'did',struggle:'',upbeat:'',unknown:''};
const MIN_KIND=n=>n==='started'||n==='trying'?7:10;
const ASK={ask:18,askMorning:5,askAfternoon:5,askEvening:5,askLate:6,askBack:6,askBreak:5,askFirst:5,askWeekend:5,askPrevGood:4,askPrevDrift:4};
const ADD=['tired','late','long','back','streak'];
const ADD_MIN=5, YES_MIN=5, NO_MIN=4;
const LEADS=['back','streak'];   // these go before the reply, so they end with a space; the rest go after it
const TOPICS=['study','homework','essay','reading','coding','class','work','gym','run','walk','sport','cleaning','cooking',
  'selfcare','food','people','sleep','break','scrolling','bedrot','gaming','watching','idle',
  'math','science','language','humanities','music','art'];

function check(V){
  const bad=[], seen=new Set();
  const holes=s=>(s.match(/\{[^}]*\}/g)||[]).map(m=>m.slice(1,-1).toLowerCase());
  const line=(where,s,max,allow)=>{
    if(typeof s!=='string'||!s.trim()) return bad.push(`${where}: empty`);
    if(seen.has(s)) bad.push(`${where}: said twice: ${s}`); seen.add(s);
    if(s.length>max) bad.push(`${where}: ${s.length} chars, keep it under ${max}: ${s}`);
    for(const h of holes(s)) if(!allow.includes(h)) bad.push(`${where}: {${h}} can't be filled here: ${s}`);
    if(/\bno \{avoided\}/i.test(s)) bad.push(`${where}: "No {avoided}" reads wrong ("No your phone"): ${s}`);
    if(/["“”]/.test(s)) bad.push(`${where}: no double quotes in lines: ${s}`);
  };
  const list=(k,min,max,allow)=>{
    const a=V[k];
    if(!Array.isArray(a)) return bad.push(`${k}: missing`);
    if(a.length<min) bad.push(`${k}: ${a.length} lines, wants at least ${min}`);
    a.forEach((s,i)=>line(`${k}[${i}]`,s,max,allow));
  };
  for(const [k,n] of Object.entries(ASK)){
    list(k,n,120,k.startsWith('askPrev')?['prev']:[]);
    if(k.startsWith('askPrev')) (V[k]||[]).forEach((s,i)=>{ if(!/\{prev\}/.test(s)) bad.push(`${k}[${i}]: needs {prev}`); });
  }
  for(const [k,names] of Object.entries(KINDS)) list(k,MIN_KIND(k),170,names?names.split(' '):[]);
  for(const k of ADD){
    list(k,ADD_MIN,90,[]);
    const lead=LEADS.includes(k);
    (V[k]||[]).forEach((s,i)=>{ if(lead?!/ $/.test(s):!/^ /.test(s)) bad.push(`${k}[${i}]: ${lead?'ends':'starts'} with one space`); });
  }
  if(!V.topics) bad.push('topics: missing');
  else for(const t of TOPICS){
    const o=V.topics[t];
    if(!o){ bad.push(`topics.${t}: missing`); continue; }
    if(!Array.isArray(o.yes)||o.yes.length<YES_MIN) bad.push(`topics.${t}.yes: ${(o.yes||[]).length}, wants at least ${YES_MIN}`);
    if(!Array.isArray(o.no)||o.no.length<NO_MIN) bad.push(`topics.${t}.no: ${(o.no||[]).length}, wants at least ${NO_MIN}`);
    (o.yes||[]).forEach((s,i)=>line(`topics.${t}.yes[${i}]`,s,110,[]));
    (o.no||[]).forEach((s,i)=>line(`topics.${t}.no[${i}]`,s,110,[]));
  }
  return bad;
}
module.exports=check;
Object.assign(module.exports,{KINDS,ASK,ADD,TOPICS});
