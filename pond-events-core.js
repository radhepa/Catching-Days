/* Pure, versioned facts; sync-core merges records by id. Rendering never evaluates sessions. */
(function(root,factory){
  if(typeof module==='object'&&module.exports) module.exports=factory(require('./pond-events-content.js'));
  else root.PondMomentsCore=factory(root.PondMomentsContent);
})(typeof window==='undefined'?globalThis:window,function(scenes){
  'use strict';
  const prefix='pond-events:',initId=prefix+'init:v1';
  const factId=(scene,kind)=>prefix+'scene:'+scene+':'+kind+':v1';
  function normalize(value){
    const s=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
    return {...s,v:1,invitations:s.invitations!==false,records:Array.isArray(s.records)?s.records.filter(r=>r&&typeof r.id==='string'):[]};
  }
  function hash(text){let h=2166136261;for(const c of String(text)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
  function initialize(value,sessions,at){
    const state=normalize(value);
    if(state.records.some(r=>r.id===initId))return state;
    const baseline=(sessions||[]).map(s=>s.id).filter(id=>typeof id==='string');
    return {...state,records:[...state.records,{id:initId,at,baseline,seed:hash(at+'|'+baseline.join('|'))}]};
  }
  function view(value,available){
    const state=normalize(value),seen=new Set(state.records.filter(r=>r.kind==='seen').map(r=>r.scene));
    const ready=state.records.filter(r=>r.kind==='ready'&&scenes.some(s=>s.id===r.scene)&&!seen.has(r.scene))
      .sort((a,b)=>(a.at||0)-(b.at||0)||a.id.localeCompare(b.id));
    const fits=s=>!available||s.cast.every(c=>available.includes(c));
    return {seen,pending:ready.find(r=>fits(scenes.find(s=>s.id===r.scene)))||null,
      environment:scenes.find(s=>s.trigger==='environment'&&!seen.has(s.id)&&fits(s))||null,
      replays:scenes.filter(s=>seen.has(s.id)&&fits(s))};
  }
  function evaluate(value,session,net,day,available){
    const state=normalize(value),init=state.records.find(r=>r.id===initId);
    // Only the successful-save hook may call this. Baseline protects imports and older ids as well.
    if(!init||!session||typeof session.id!=='string'||session.phase!=='done'||!Number.isFinite(session.ended)||
      session.ended<init.at||(init.baseline||[]).includes(session.id)||!Number.isFinite(net)||net<600000)return state;
    const id=prefix+'session:'+session.id+':decision:v1';
    if(state.records.some(r=>r.id===id))return state;
    const v=view(state,available),reserved=state.records.filter(r=>r.kind==='ready'&&scenes.some(s=>s.id===r.scene&&s.trigger==='focus'));
    const pool=scenes.filter(s=>s.trigger==='focus'&&!v.seen.has(s.id)&&!reserved.some(r=>r.scene===s.id)&&
      (!available||s.cast.every(c=>available.includes(c))));
    let reason='chance',chosen=null;
    if(v.pending||reserved.some(r=>!v.seen.has(r.scene)))reason='pending';
    else if(reserved.some(r=>r.day===day))reason='daily-cap';
    else if(!pool.length)reason='exhausted';
    else if(!reserved.length||hash(init.seed+'|chance|'+session.id)%4===0){
      chosen=pool.slice().sort((a,b)=>hash(init.seed+'|order|'+a.id)-hash(init.seed+'|order|'+b.id)||a.id.localeCompare(b.id))[0];reason='ready';
    }
    const records=[...state.records,{id,kind:'decision',session:session.id,day,at:session.ended,reason,scene:chosen?.id||null}];
    if(chosen)records.push({id:factId(chosen.id,'ready'),kind:'ready',scene:chosen.id,session:session.id,day,at:session.ended});
    return {...state,records};
  }
  function complete(value,id,at,skipped){
    const state=normalize(value),scene=scenes.find(s=>s.id===id);
    if(!scene||view(state).seen.has(id))return state;
    if(scene.trigger==='focus'&&!state.records.some(r=>r.id===factId(id,'ready')))return state;
    return {...state,records:[...state.records,{id:factId(id,'seen'),kind:'seen',scene:id,at,skipped:!!skipped}]};
  }
  return {scenes,normalize,initialize,evaluate,complete,view,hash};
});
