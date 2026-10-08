/* Small pond scenes. App data is accessed only through normal save paths. */
(function(){
  'use strict';
  const C=window.PondMomentsCore;
  if(!C)return;
  // The standalone library uses the real player, with no app store or save hooks.
  const libraryMode=document.currentScript?.hasAttribute('data-pond-moments-library')===true;
  // Keep expression assets separate from the companion integration’s base files.
  const assetBase=document.currentScript.src;
  const loadAsset=(global,file)=>window[global]?Promise.resolve():new Promise(resolve=>{
    const script=document.createElement('script');script.src=new URL(file,assetBase).href;
    script.onload=resolve;script.onerror=resolve;document.head.appendChild(script);
  });
  const sceneAssetsReady=Promise.all([loadAsset('ToadExpressions','toad-expressions.js?v=3'),loadAsset('PondSceneTransition','pond-events-transition.js?v=4')]);
  let previewMotion=true;
  const $=id=>document.getElementById(id),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const available=()=>Object.keys(window.ToadArt?.TOADS||{});
  let player=null,armed=null,invitation=null,initializing=null,writing=false,started=false;
  let environmentId=null,previousFocus=null,previousScroll=0;
  const current=()=>C.normalize(libraryMode?null:db.pondEvents),progress=()=>C.view(current(),available());
  function moving(){return !document.hidden&&(libraryMode?previewMotion:pondMotionOn())&&!matchMedia('(prefers-reduced-motion: reduce)').matches;}
  function blocked(){
    return document.hidden||!!document.querySelector('#modals .modal, #v-hello:not(.hide), #v-unlock:not(.hide), #v-onboard:not(.hide), #bug-card.show, #path-card.show, #task-finish:not([hidden]), dialog[open]:not(#pe-player)')||
      !!$('modals')?.innerHTML.trim()||!!window.Toads?.isOpen()||!!document.querySelector('.tdz-talk.show')||
      (typeof A!=='undefined'&&!!A)||!!document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
  }
  async function persist(next){
    if(libraryMode)return false;
    const owner=db,before=owner.pondEvents;owner.pondEvents=next;writing=true;
    try{
      save();const cached=cacheSave(),disk=SERVER?await syncOut():false;
      if(!cached&&!disk){if(db===owner&&owner.pondEvents===next)owner.pondEvents=before;return false;}
      return true;
    }catch(e){if(db===owner&&owner.pondEvents===next)owner.pondEvents=before;console.warn('Pond Moments save:',e);return false;}
    finally{writing=false;}
  }
  async function initialize(){
    if(initializing)return initializing;
    const state=current(),next=C.initialize(state,db.sessions,Date.now());
    if(next.records.length===state.records.length)return true;
    initializing=persist(next);try{return await initializing;}finally{initializing=null;}
  }
  async function afterSaved(session){
    if(libraryMode)return;
    try{
      if(!await initialize())return;
      const before=current(),next=C.evaluate(before,session,summarize(session).net,dayKey(session.ended),available());
      if(next.records.length===before.records.length)return;
      if(!await persist(next))return;
      const pending=progress().pending;
      if(pending?.session===session.id)armed=pending.scene;
      refresh(false);offer();
    }catch(e){console.warn('Pond Moments session hook:',e);}
  }
  /* Tiny authored props; visitors are stage decoration, never collection species. */
  function prop(kind){
    const leaf='<path d="M12 38C22 7 65 9 85 28C68 50 31 56 12 38Z" fill="#6f9673" stroke="#456c57" stroke-width="2"/><path d="M16 38L75 28" stroke="#bfd1a2" fill="none"/>';
    const pebble='<path d="M15 50C8 19 65 5 88 36Q98 59 15 50Z" fill="#8ca09c" stroke="#d1dfcd" stroke-width="2"/><path d="M35 18L48 54M52 16L65 53" stroke="#536e6b" stroke-width="5"/><path d="M68 22L74 28" stroke="#fff8e9" stroke-width="3"/>';
    const boat='<path d="M8 35L88 35L69 57L28 57Z" fill="#f2dcb1" stroke="#a79573" stroke-width="2"/><path d="M27 35L52 8L69 35Z" fill="#fff8e9" stroke="#c2b394" stroke-width="2"/><path d="M52 9L52 35L29 35" fill="#e6d5b4"/>';
    const petal='<ellipse class="pe-petal" cx="70" cy="36" rx="5" ry="11" transform="rotate(35 70 36)" fill="#d78c54"/>';
    let art=leaf;
    if(kind==='boat')art=boat+petal;
    if(kind==='pebble'||kind==='stone')art=pebble;
    if(kind==='page')art=leaf+'<path d="M24 23L73 18L77 47L28 52Z" fill="#fff8e9" stroke="#dfccad"/>'+petal;
    if(kind==='meeting')art=leaf+'<text class="pe-note" x="38" y="36" fill="#234b49" font-size="9">Nice pad</text>';
    if(kind==='moon')art='<ellipse cx="48" cy="55" rx="42" ry="8" fill="none" stroke="#c8ddd0" opacity=".4"/>'+leaf+'<circle class="pe-moon" cx="52" cy="30" r="11" fill="#fff1bd"/>';
    if(kind==='umbrella')art=leaf+'<g fill="#354c39"><ellipse cx="40" cy="46" rx="5" ry="6"/><path d="M33 48L29 44M47 48L51 44" stroke="#354c39"/><path d="M34 39L46 39L42 35L38 35Z" fill="#f2dcb1"/></g><circle class="pe-beetle-friend" cx="43" cy="38" r="2" fill="#d78c54"/>';
    if(kind==='tenant')art='<g class="pe-tenant"><path d="M40 48L64 48Q68 41 65 40" stroke="#bcd0ca" stroke-width="4" fill="none"/><circle cx="44" cy="40" r="9" fill="#cbd8d4" stroke="#73918a"/><path d="M44 38q-5 0-3 5q6 3 7-4" fill="none" stroke="#73918a"/><path d="M60 40L61 35M65 40L68 35" stroke="#bcd0ca"/></g><path d="M65 53L82 49L85 54L68 58Z" fill="#96aa75"/><g class="pe-leaf-roof">'+leaf+'</g>';
    if(kind==='bell')art=leaf+'<path d="M38 43Q43 34 43 25Q50 16 57 25Q57 34 62 43Z" fill="#c8aa66" stroke="#816d44"/><path d="M37 43h26M50 18v-6" stroke="#816d44" stroke-width="2"/><circle cx="51" cy="48" r="3" fill="#c8aa66"/>';
    if(kind==='sign')art=leaf+'<path d="M50 53V12" stroke="#8b7150" stroke-width="3"/><path d="M22 12H75L84 22L75 32H22Z" fill="#e8d4ac" stroke="#a08c66"/><path d="M30 21H67l-5-4m5 4-5 4" stroke="#48655c" fill="none"/>';
    if(['list','map','score','ballot'].includes(kind)){
      const marks=kind==='map'?'<path d="M29 41l10-14 11 9 17-12" fill="none" stroke="#63856b" stroke-width="2" stroke-dasharray="3 2"/><circle cx="66" cy="24" r="3" fill="#c77842"/>':
        kind==='score'?'<path d="M30 27h37M30 32h37M30 37h37" stroke="#b7b494"/><g fill="#52766a"><circle cx="36" cy="32" r="2"/><circle cx="51" cy="27" r="2"/><circle cx="62" cy="37" r="2"/></g>':
        kind==='ballot'?'<path d="M32 31l7 7 13-16" fill="none" stroke="#52766a" stroke-width="3"/>':'<path d="M32 25h29M32 33h21M32 41h25" stroke="#6d8274" stroke-width="2"/>';
      art=leaf+'<path d="M24 16L73 19L70 49L22 46Z" fill="#fff8e9" stroke="#c6b795"/>'+marks;
    }
    if(kind==='tea')art=leaf+'<path d="M29 30h28q0 21-14 21T29 30Z" fill="#ead7b3" stroke="#9d8864"/><ellipse cx="43" cy="30" rx="14" ry="4" fill="#557966"/><path d="M59 33q17-2 8 10h-11" fill="none" stroke="#cbb383" stroke-width="3"/><ellipse cx="71" cy="48" rx="8" ry="5" fill="#829690"/>';
    if(kind==='picnic')art=leaf+'<g fill="#ead7b3" stroke="#aa9166"><path d="M23 35h11q0 13-5.5 13T23 35ZM38 35h11q0 13-5.5 13T38 35ZM53 35h11q0 13-5.5 13T53 35ZM72 32h11q0 13-5.5 13T72 32Z"/></g>';
    if(kind==='ribbon')art=leaf+'<path d="M25 42q14-21 26-6t23-7M50 36q-24-24-23-1q9 9 23 1q24-24 23-1q-9 9-23 1" fill="none" stroke="#caa779" stroke-width="3"/>';
    if(kind==='lantern')art=leaf+'<path d="M43 16q8-12 16 0M39 19h24M39 49h24" stroke="#a68b58" fill="none" stroke-width="2"/><rect x="40" y="21" width="22" height="27" rx="5" fill="#efdfab66" stroke="#c5af75"/><circle cx="51" cy="35" r="5" fill="#f5d475"/>';
    if(kind==='gift')art=leaf+'<path d="M28 24h39v25H28Z" fill="#e5d6b3" stroke="#a9946f"/><path d="M47 24v25M28 34h39" stroke="#6d9777" stroke-width="3"/><path d="M47 23q-16-17-15-2q8 6 15 2q16-17 15-2q-8 6-15 2" fill="none" stroke="#6d9777" stroke-width="2"/>';
    return '<svg viewBox="0 0 100 70" aria-hidden="true" focusable="false">'+art+'</svg>';
  }
  function sectionHTML(){
    const v=progress(),state=current();
    return '<div class="pe-section-head"><div><span class="eyebrow">Little stories, kept</span><h2>Pond Moments</h2></div><span class="pe-sprig" aria-hidden="true">❧</span></div>'+
      (v.pending?'<div class="pe-pending"><span>A little moment by the pond<br><b>'+escape(C.scenes.find(s=>s.id===v.pending.scene).title)+'</b></span><button type="button" data-pe-watch="'+v.pending.scene+'">Watch</button></div>':'<p>A small meeting, a drifting leaf, a little pond life. Stay for a moment whenever you like.</p>')+
      (v.environment?'<p class="pe-hint">'+escape(v.environment.hint)+' <button type="button" data-pe-explore>Explore →</button></p>':'')+
      (v.replays.length?'<div class="pe-replays" aria-label="Replay a pond moment">'+v.replays.map(s=>'<button type="button" data-pe-replay="'+s.id+'">'+escape(s.title)+' <span aria-hidden="true">↺</span></button>').join('')+'</div>':'')+
      '<label class="pe-setting"><input type="checkbox" data-pe-setting '+(state.invitations?'checked':'')+'> Story invitations after focus</label>';
  }
  function bindSection(el){
    el.addEventListener('click',event=>{
      event.stopPropagation();const b=event.target.closest('button');if(!b)return;
      if(b.hasAttribute('data-pe-explore'))explore();
      else if(b.dataset.peReplay)open(b.dataset.peReplay,true,b);
      else if(b.dataset.peWatch)open(b.dataset.peWatch,false,b);
    });
    el.addEventListener('change',async event=>{
      if(!event.target.hasAttribute('data-pe-setting'))return;
      if(!await persist({...current(),invitations:event.target.checked}))event.target.checked=current().invitations;
      if(!current().invitations){armed=null;hideInvitation();}refresh(false);
    });
  }
  function renderSection(parent,id,prepend){
    if(!parent)return;
    let el=$(id);if(!el){el=document.createElement('section');el.id=id;el.className='pe-section pe-owned pcard';el.setAttribute('aria-label','Pond Moments');bindSection(el);prepend?parent.prepend(el):parent.appendChild(el);}
    const html=sectionHTML();if(el._html!==html){
      const focused=el.contains(document.activeElement)&&document.activeElement.hasAttribute('data-pe-setting');
      el._html=html;el.innerHTML=html;
      if(focused)el.querySelector('[data-pe-setting]')?.focus({preventScroll:true});
    }
  }
  function refresh(pondVisit){
    if(player)$('pe-player')?.classList.toggle('td-mv',moving());
    if(player?.journey&&!moving())player.journey.finish();
    if(player?.typing&&!moving())finishTyping();
    if(!started)return;
    try{
      const v=progress();
      $('pe-daily')?.remove();   // Pond Moments lives on the Collection page only (the user asked to keep Today short)
      renderSection($('coll-body'),'pe-collection',true);
      if(pondVisit)environmentId=v.environment?.id||null;
      const wanted=v.environment?.id===environmentId?v.environment:null;
      const old=$('pe-hotspot');if(old&&old.dataset.scene!==wanted?.id)old.remove();
      if(wanted&&!$('pe-hotspot')){
        const landmark=$(wanted.landmark);if(landmark){
          const b=document.createElement('button');b.id='pe-hotspot';b.type='button';b.className='pe-hotspot pe-owned pe-'+wanted.prop;b.dataset.scene=wanted.id;
          b.setAttribute('aria-label',wanted.label+'. Watch a pond moment');b.innerHTML=prop(wanted.prop)+'<span>'+escape(wanted.label)+'</span>';
          b.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();open(wanted.id,false,b);});landmark.appendChild(b);
        }
      }
      $('pe-hotspot')?.classList.toggle('pe-motion',moving());
      if(!v.pending||v.pending.scene!==armed||!current().invitations)hideInvitation();
      offer();
    }catch(e){console.warn('Pond Moments render:',e);}
  }
  function explore(){
    tab('daily');refresh(true);const b=$('pe-hotspot');if(!b)return;
    b.scrollIntoView({block:'center',behavior:moving()?'smooth':'auto'});b.focus({preventScroll:true});
  }
  function hideInvitation(){if(invitation){invitation.remove();invitation=null;}}
  function offer(){
    if(!armed||writing||player||!current().invitations||blocked()){hideInvitation();return;}
    const p=progress().pending;if(!p||p.scene!==armed){armed=null;hideInvitation();return;}
    if(invitation)return;
    invitation=document.createElement('aside');invitation.className='pe-invitation pe-owned';invitation.setAttribute('aria-label','A little moment by the pond');
    invitation.innerHTML='<span role="status">A little moment by the pond</span><div><button type="button" data-pe-invite-watch>Watch</button><button type="button" data-pe-invite-later>Later</button></div>';
    invitation.addEventListener('click',event=>{
      if(event.target.closest('[data-pe-invite-watch]'))open(p.scene,false,event.target);
      else if(event.target.closest('[data-pe-invite-later]')){armed=null;hideInvitation();}
    });
    invitation.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();armed=null;hideInvitation();}});
    document.body.appendChild(invitation);positionInvitation();
  }
  function positionInvitation(){
    if(invitation){const nav=document.querySelector('.sidebar');invitation.style.bottom=innerWidth<=760&&nav?Math.ceil(innerHeight-nav.getBoundingClientRect().top+14)+'px':'24px';}
  }
  function portrait(name,expression='neutral'){
    const wrapper=document.createElement('div');wrapper.innerHTML=window.ToadArt.svg(name,{size:86,perch:'none'});
    const svg=wrapper.firstElementChild;window.ToadExpressions?.apply(svg,name,expression);
    svg.setAttribute('viewBox',window.ToadExpressions?.profiles[name]?.crop||(name==='hasu'?'-38 -88 76 76':'-46 -99 92 92'));return svg.outerHTML;
  }
  function dango(){
    // Extract her existing production drawing, including its gradient definitions.
    const wrapper=document.createElement('div');wrapper.innerHTML=window.ToadArt.svg('tabi',{size:75,perch:'none'});
    const svg=wrapper.firstElementChild,snail=svg.querySelector('.td-snail');if(!snail)return '';
    svg.innerHTML=svg.querySelector('defs').outerHTML+'<g transform="translate(-1 -63.4)">'+snail.outerHTML+'</g>';
    svg.setAttribute('viewBox','-10 -78 30 22');return svg.outerHTML;
  }
  function stageMarkup(scene){
    return '<div class="pe-stage'+(window.PondMomentsStage.evening(scene)?' pe-evening':'')+'" data-setting="'+scene.prop+'" aria-hidden="true"><div class="pe-camera-world">'+window.PondMomentsStage.sky(scene)+'<div class="pe-pond-set">'+window.PondMomentsStage.svg(scene)+'<div class="pe-stage-ripple"></div><div class="pe-actors">'+
      scene.cast.map(name=>'<div class="pe-actor" data-companion="'+name+'">'+window.ToadArt.svg(name,{size:130,perch:name==='hasu'?'pad':'own',water:true})+'</div>').join('')+
      '</div><div class="pe-prop">'+prop(scene.prop)+'</div>'+(scene.prop==='pebble'?'<div class="pe-dango">'+dango()+'</div>':'')+'</div></div></div>';
  }
  function nextLabel(){
    if(!player)return '';
    return player.i===player.scene.beats.length-1?(libraryMode?'Back to library':'Back to pond'):'Next →';
  }
  function finishTyping(){
    if(!player)return;
    clearTimeout(player.typeTimer);player.typing=false;
    const dialog=$('pe-player'),text=player.scene.beats[player.i].text;
    if(!dialog)return;
    dialog.querySelector('.pe-text-on').textContent=text;dialog.querySelector('.pe-text-off').textContent='';
    dialog.dataset.typing='false';dialog.querySelector('[data-pe-next]').textContent=nextLabel();
  }
  function reveal(text){
    const dialog=$('pe-player'),on=dialog.querySelector('.pe-text-on'),off=dialog.querySelector('.pe-text-off');
    on.textContent='';off.textContent=text;
    if(!moving()){finishTyping();return;}
    player.typing=true;dialog.dataset.typing='true';dialog.querySelector('[data-pe-next]').textContent='Show line';
    const active=player,token=player.beatToken,letters=Array.from(text);let n=0;
    const step=()=>{
      if(player!==active||active.beatToken!==token)return;
      n++;on.textContent=letters.slice(0,n).join('');off.textContent=letters.slice(n).join('');
      if(n>=letters.length){finishTyping();return;}
      active.typeTimer=setTimeout(step,/[.!?…]/.test(letters[n-1])?100:/[,;:—]/.test(letters[n-1])?50:18);
    };
    step();
  }
  function showBeat(){
    clearTimeout(player.typeTimer);player.beatToken=(player.beatToken||0)+1;
    const {scene,i}=player,b=scene.beats[i],dialog=$('pe-player');dialog.dataset.beat=i;
    const evening=window.PondMomentsStage.evening(scene,i);
    dialog.querySelector('.pe-stage').classList.toggle('pe-evening',evening);
    dialog.querySelector('.pe-landscape').classList.toggle('pe-water-night',evening);
    dialog.querySelector('.pe-speaker').textContent=b.speaker?window.ToadArt.TOADS[b.speaker].name:'By the pond';
    dialog.querySelector('.pe-portrait').innerHTML=b.speaker?portrait(b.speaker,b.expressions?.[b.speaker]):'';
    dialog.querySelectorAll('.pe-actor').forEach(actor=>{
      const name=actor.dataset.companion;
      actor.dataset.present=String(i>=(scene.entrances?.[name]||0)&&!(scene.offstage?.[name]||[]).some(([from,to])=>i>=from&&i<=to));
      actor.classList.toggle('pe-speaking',name===b.speaker);
      window.ToadExpressions?.apply(actor.querySelector('.td-art'),name,b.expressions?.[name]||'neutral');
    });
    dialog.querySelector('.pe-action').textContent=b.action;
    dialog.querySelector('.pe-count').textContent=(i+1)+' / '+scene.beats.length;
    dialog.querySelector('[data-pe-back]').disabled=i===0;
    dialog.querySelector('[data-pe-next]').textContent=nextLabel();
    // One atomic announcement includes the speaker, full sentence, and visible action.
    dialog.querySelector('.pe-announcement').textContent=(b.speaker?window.ToadArt.TOADS[b.speaker].name+': ':'')+b.text+' '+b.action;
    const bubble=dialog.querySelector('.pe-bubble');bubble.classList.remove('pe-beat-in');
    if(moving()){void bubble.offsetWidth;bubble.classList.add('pe-beat-in');}
    if(player.entering)finishTyping();else reveal(b.text);
    if(scene.prop==='pebble')dialog.querySelector('.td-tabi .td-snail')?.setAttribute('visibility','hidden');
  }
  function open(id,replay,from){
    try{
      if(player||writing||blocked())return false;
      const scene=C.scenes.find(s=>s.id===id&&s.cast.every(c=>available().includes(c)));if(!scene)return false;
      const v=progress();if(!libraryMode&&(replay?!v.seen.has(id):!(v.pending?.scene===id||v.environment?.id===id)))return false;
      previousFocus=from||document.activeElement;previousScroll=window.scrollY;
      const origin=window.PondSceneTransition?.capture(previousFocus);
      const dialog=document.createElement('dialog');dialog.id='pe-player';dialog.className='pe-owned'+(moving()?' td-mv':'');dialog.dataset.prop=scene.prop;
      dialog.setAttribute('aria-labelledby','pe-title');dialog.setAttribute('aria-describedby','pe-stage-description');
      window.ToadArt.injectCSS();window.ToadArt.injectCastCSS?.();
      dialog.innerHTML='<div class="pe-top"><div><span class="eyebrow">'+(libraryMode?'Scene preview':'A little moment by the pond')+'</span><h2 id="pe-title">'+escape(scene.title)+'</h2></div><button type="button" data-pe-later aria-label="'+(libraryMode?'Close preview':'Later, close scene')+'">×</button></div>'+
        '<p id="pe-stage-description" class="pe-sr">'+escape(scene.stage)+'</p>'+stageMarkup(scene)+
        '<div class="pe-bubble" title="Press Next to show the full line, then again to continue"><div class="pe-portrait" aria-hidden="true"></div><div class="pe-copy"><span class="pe-speaker"></span><p class="pe-dialogue" aria-hidden="true"><span class="pe-text-on"></span><span class="pe-text-off"></span></p></div><span class="pe-continue" aria-hidden="true">▾</span></div><p class="pe-action"></p><div class="pe-announcement pe-sr" role="status" aria-live="polite" aria-atomic="true"></div>'+
        '<div class="pe-controls"><button type="button" data-pe-back>← Back</button><span class="pe-count"></span><button type="button" data-pe-next>Next →</button></div><div class="pe-footer"><button type="button" data-pe-later>'+(libraryMode?'Close preview':'Later')+'</button><button type="button" data-pe-skip>Skip</button></div>';
      player={scene,i:0,replay:replay||libraryMode,origin,entering:moving()&&!!window.PondSceneTransition};document.body.appendChild(dialog);
      dialog.addEventListener('cancel',e=>{e.preventDefault();close(false);});
      dialog.addEventListener('click',e=>{
        if(e.target.closest('[data-pe-later]'))close(false);
        else if(e.target.closest('[data-pe-skip]'))close(true,true);
        else if(e.target.closest('[data-pe-back]')){player.i=Math.max(0,player.i-1);showBeat();}
        else if(e.target.closest('[data-pe-next]'))next();
        else if(e.target.closest('.pe-bubble')&&player?.typing)finishTyping();
      });
      dialog.addEventListener('keydown',e=>{
        e.stopPropagation();
        if(e.key==='Escape'){e.preventDefault();close(false);return;}
        if(e.key==='Tab'){
          const buttons=[...dialog.querySelectorAll('button:not(:disabled)')].filter(b=>!b.closest('[inert]')),first=buttons[0],last=buttons[buttons.length-1];
          if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
          else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
        }else if((e.key==='Enter'||e.code==='Space')&&!e.target.closest('button')){e.preventDefault();if(!e.repeat)next();}
      });
      armed=null;hideInvitation();dialog.showModal();showBeat();
      const active=player;
      if(active.entering){
        active.journey=window.PondSceneTransition.enter({dialog,origin,motion:true,onReady:()=>{
          if(player!==active||active.closing)return;
          active.entering=false;active.journey=null;reveal(active.scene.beats[active.i].text);dialog.querySelector('[data-pe-next]').focus({preventScroll:true});
        }});
      }else{dialog.dataset.arrival='ready';dialog.querySelector('[data-pe-next]').focus();}
      return true;
    }catch(e){console.warn('Pond Moments player:',e);$('pe-player')?.remove();player=null;return false;}
  }
  function next(){if(!player||writing||player.closing)return;if(player.entering){player.journey?.finish();finishTyping();return;}if(player.typing){finishTyping();return;}if(player.i===player.scene.beats.length-1)close(true);else{player.i++;showBeat();}}
  async function close(finished,skipped){
    if(!player||writing||player.closing)return;
    const p=player,dialog=$('pe-player');
    p.closing=true;const wasEntering=p.entering;p.journey?.cancel();p.entering=false;clearTimeout(p.typeTimer);
    if(finished&&!p.replay){
      dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
      if(!await persist(C.complete(current(),p.scene.id,Date.now(),skipped))){
        p.closing=false;dialog.querySelectorAll('button').forEach(b=>b.disabled=false);showBeat();toast('The moment could not be saved. Please try again.');return;
      }
    }
    dialog.querySelectorAll('button').forEach(b=>b.disabled=true);
    await window.PondSceneTransition?.leave({dialog,origin:p.origin||{x:innerWidth/2,y:innerHeight/2},motion:moving()&&!wasEntering});
    dialog.close();dialog.remove();player=null;armed=null;refresh(false);
    window.scrollTo(0,previousScroll);
    const target=previousFocus?.isConnected?previousFocus:($('pe-daily')?.querySelector('button')||document.querySelector('.nav.active, .nav.on'));
    target?.focus({preventScroll:true});previousFocus=null;
  }
  async function start(){
    await sceneAssetsReady;
    if(libraryMode){
      document.addEventListener('visibilitychange',()=>refresh(false));
      matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>refresh(false));
      return;
    }
    await window.appReady;await initialize();started=true;refresh(true);
    // Observe availability, never session history. Reload only restores the quiet card.
    const observer=new MutationObserver(changes=>{
      if(changes.every(c=>c.target.nodeType===1&&c.target.closest('.pe-owned')||
        c.type==='childList'&&[...c.addedNodes,...c.removedNodes].length&&[...c.addedNodes,...c.removedNodes].every(n=>n.nodeType===1&&n.classList.contains('pe-owned'))))return;
      if(player&&blocked())close(false);else offer();
    });
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','open']});
    document.addEventListener('focusin',offer);document.addEventListener('focusout',()=>setTimeout(offer,0));
    document.addEventListener('visibilitychange',()=>refresh(false));window.addEventListener('resize',positionInvitation);
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',()=>refresh(false));
  }
  window.PondEvents={afterSaved,refresh,open,isOpen:()=>!!player,reconcile:()=>libraryMode?Promise.resolve():initialize().then(()=>refresh(true)),
    ...(libraryMode?{previewStage:stageMarkup,previewMotion:on=>{previewMotion=!!on;refresh(false);}}:{})};
  start().catch(e=>console.warn('Pond Moments initialization:',e));
})();
