/* Catching Days · Bio add-on
   A profile of who you are (work, projects, clubs, skills, people, things you
   own) kept so an AI can write about you from your real history. Optional:
   the app loads this folder if it's there, and draws it only while it's
   switched on in Settings → Add-ons. Each section can be switched off there
   too. Off, nothing is deleted; the data waits in the save.

   This file shares the app's globals (db, save, modal, esc, …), so it must
   load before the app's main script, and only calls into the app at run time. */

/* the Journal's "Bio" entry type, which comes and goes with the add-on */
const BIO_TAG={id:'bio',name:'Bio',hex:'#a8762f',builtin:true};

/* what AGENTS.md says about bio.md, only while Bio is on */
const BIO_BRIEF=`- **Read** \`bio.md\` — who the user is: work, projects, clubs, sports, skills,
  people they know, things they own. Read it before writing anything *about*
  them (an application, a cover letter, a bio, an essay) so you use their real
  history instead of inventing one. Entries marked _(private)_ are context for
  your reasoning only — never copy them into outward-facing text.
`;

/* ── Bio ──
   A structured record of who you are, kept so an AI can answer questions about
   you (applications, cover letters, "which of my projects fits this?") without
   you re-typing your life every time.

   Categories are data, not code: each one names a `kind` that decides which
   fields its form shows. Four kinds cover everything without a field explosion
   — roles have orgs and dates and achievements, people have relationships,
   possessions have details, and everything else is just a title and notes. Add
   your own categories freely; they only have to pick one of these four shapes. */
const BIO_KINDS={
  role  :{fields:['org','role','dates','bullets','link']},
  person:{fields:['org','relation']},
  thing :{fields:['org','link']},
  plain :{fields:[]}
};
const BIO_CATS_DEFAULT=[
  {id:'work'  ,name:'Work Experience'    ,kind:'role'  ,icon:'💼'},
  {id:'proj'  ,name:'Projects'           ,kind:'role'  ,icon:'🛠'},
  {id:'club'  ,name:'Clubs & Orgs'       ,kind:'role'  ,icon:'🏛'},
  {id:'extra' ,name:'Extracurriculars'   ,kind:'role'  ,icon:'✨'},
  {id:'sport' ,name:'Sports'             ,kind:'role'  ,icon:'🏅'},
  {id:'award' ,name:'Awards & Honors'    ,kind:'role'  ,icon:'🏆'},
  {id:'skill' ,name:'Skills'             ,kind:'plain' ,icon:'⚡'},
  {id:'hobby' ,name:'Hobbies & Interests',kind:'plain' ,icon:'🎨'},
  {id:'people',name:'People'             ,kind:'person',icon:'👥'},
  {id:'own'   ,name:'Possessions'        ,kind:'thing' ,icon:'📦'},
  {id:'misc'  ,name:'Other'              ,kind:'plain' ,icon:'📌'}
];
/* 'dislike' sits in the same list as the rest: you asked to record it, and an
   assistant that knows who you avoid gives better advice. It just defaults to
   sensitive so it can never ride along into an application export. */
const BIO_RELATIONS=[['close','Close friend'],['friend','Friend'],['family','Family'],
  ['partner','Partner'],['mentor','Mentor'],['teacher','Teacher / professor'],
  ['colleague','Colleague'],['classmate','Classmate'],['acquaintance','Acquaintance'],
  ['dislike','Dislike / avoid']];
const relName=r=>((BIO_RELATIONS.find(x=>x[0]===r)||[])[1])||'';
/* How a category is drawn, separate from its kind (which only decides the
   form's fields). Optional per category as `view`; bioView() picks one from
   the kind and the name when it's unset. */
const BIO_VIEWS={
  timeline:'Timeline',
  orbit   :'Circle',
  people  :'Cards',
  tiles   :'Tiles',
  chips   :'Chips',
  gallery :'Gallery',
  list    :'List'
};
/* The circle's rings, innermost first. Every relationship lands on exactly
   one ring except 'dislike', which is kept out of the circle altogether. */
const BIO_TIERS=[
  {id:'t0',name:'Partner & family', rel:['partner','family'],c:'#d9788a',bg:'#fbe8ec',tx:'#8e3a4c'},
  {id:'t1',name:'Close friends',    rel:['close'],           c:'#d6a03a',bg:'#fbf1db',tx:'#7d5a14'},
  {id:'t2',name:'Friends & mentors',rel:['friend','mentor'], c:'#6fb07d',bg:'#e5f3e8',tx:'#2f6b40'},
  {id:'t3',name:'Everyone else',    rel:null,                c:'#7f9dbd',bg:'#e7eef6',tx:'#3f5a78'}
];
const BIO_AVOID={c:'#b27575',bg:'#f7e6e6',tx:'#8a3d3d'};
const bioTier=r=>r==='dislike'?null:(BIO_TIERS.find(t=>t.rel&&t.rel.includes(r))||BIO_TIERS[3]);

/* Same contract as ensureStudy: a save written before Bio existed, or one
   half-written, comes back up to the current shape without losing anything.
   Categories merge by id rather than being replaced, so defaults you never
   touched keep arriving while your own edits and additions survive. */
function ensureBio(d){
  const b=Object.assign({profile:{},entries:[],cats:[]},d.bio||{});
  if(!b.profile||typeof b.profile!=='object') b.profile={};
  if(!Array.isArray(b.entries)) b.entries=[];
  if(!Array.isArray(b.cats)||!b.cats.length) b.cats=clone(BIO_CATS_DEFAULT);
  /* Media tracking (the poster shelf for shows, films, books, games) was
     taken out on 2026-10-26. Once, the sections it drew and what was filed
     under them go; a section named like that later is just a list. */
  if(!b.noMedia){
    const media=/\b(shows?|movies?|films?|tv|anime|manga|series|books?|reading|novels?|albums?|music|songs?|artists?|bands?|games?|podcasts?|watch(ed|ing|list)?|comics?)\b/i;
    const gone=new Set(b.cats.filter(c=>!BIO_CATS_DEFAULT.some(x=>x.id===c.id)&&(c.view==='shelf'||
      (!c.view&&c.kind!=='person'&&c.kind!=='role'&&media.test(String(c.name||''))))).map(c=>c.id));
    const lost=new Set(b.entries.filter(e=>e&&gone.has(e.cat)).map(e=>e.id));
    b.cats=b.cats.filter(c=>!gone.has(c.id));
    b.entries=b.entries.filter(e=>!(e&&gone.has(e.cat)));
    (d.diary||[]).forEach(e=>{ if(e&&lost.has(e.bioEntryId)) e.bioEntryId=null; });
    b.noMedia=true;
  }
  BIO_CATS_DEFAULT.forEach((c,i)=>{ if(!b.cats.some(x=>x.id===c.id)) b.cats.splice(i,0,{...c}); });
  b.cats.forEach(c=>{
    if(!BIO_KINDS[c.kind]) c.kind='plain';
    if(c.view&&!BIO_VIEWS[c.view]) delete c.view;
    if(c.side&&c.side!=='career'&&c.side!=='life') delete c.side;
  });
  b.entries.forEach(fixBioEntry);
  /* An empty custom category can be removed. If another device filed
     something under it before the two synced, that entry would belong to no
     category and silently vanish from the page, so it lands in Other. */
  const ids=new Set(b.cats.map(c=>c.id));
  b.entries.forEach(e=>{ if(!ids.has(e.cat)) e.cat='misc'; });
  d.bio=b;
  if(Array.isArray(d.journalTags)&&!d.journalTags.some(t=>t.id==='bio')) d.journalTags.push({...BIO_TAG});
  return d;
}
/* Backfill one entry. Separate so anything minting an entry from outside the
   form (an import, a future agent path) lands on the same shape. */
function fixBioEntry(e){
  if(!e.id) e.id=uid();
  if(!Array.isArray(e.tags))    e.tags=[];
  if(!Array.isArray(e.bullets)) e.bullets=[];
  ['title','cat','org','role','relation','start','end','link','notes','img'].forEach(k=>{
    if(typeof e[k]!=='string') e[k]=e[k]==null?'':String(e[k]); });
  e.current   = !!e.current;
  e.sensitive = !!e.sensitive;
  if(!e.created) e.created=Date.now();
  return e;
}

/* ── Bio accessors ── */
const bio        = ()=>{ if(!db.bio) ensureBio(db); return db.bio; };
/* sections switched off in Settings → Add-ons stay out of sight (and out of bio.md); what's filed under them is kept */
const bioCats    = ()=>bio().cats.filter(c=>!c.off);
const bioCat     = id=>bioCats().find(c=>c.id===id)||null;
const bioKind    = id=>(bioCat(id)||{}).kind||'plain';
const bioEntries = ()=>{ const on=new Set(bioCats().map(c=>c.id)); return bio().entries.filter(e=>on.has(e.cat)); };
const bioEntry   = id=>bioEntries().find(e=>e.id===id)||null;
const bioIn      = cat=>bioEntries().filter(e=>e.cat===cat);
const bioProfile = ()=>bio().profile;

/* A role's date range, printed the way a resume prints it. */
function bioRange(e){
  if(!e.start&&!e.end&&!e.current) return '';
  const a=e.start||'', b=e.current?'Present':(e.end||'');
  return a&&b ? a+' – '+b : (a||b);
}
/* Role dates are free text, so read the ways people actually write them:
   "Aug 2026", "August 2026", "Aug '26", "2026-08", "8/2026", "Fall 2025",
   "2026". Returns {n: year*12+month} or null; year-only dates are flagged
   `y` so nothing pretends to know their month. A season or bare year means
   its first month as a start and its last as an end. */
const BIO_MONTHS=['january','february','march','april','may','june','july',
  'august','september','october','november','december'];
const BIO_SEASONS={spring:[0,4],summer:[4,7],fall:[7,11],autumn:[7,11],winter:[0,2]};
function bioYM(s,isEnd){
  s=String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
  if(!s) return null;
  const mk=(y,mo)=>mo>=0&&mo<12&&y>1900&&y<2200?{n:y*12+mo}:null;
  let m;
  if((m=/^(\d{4})[-\/.](\d{1,2})(?:[-\/.]\d{1,2})?$/.exec(s))) return mk(+m[1],+m[2]-1);
  if((m=/^(\d{1,2})[-\/.](?:\d{1,2}[-\/.])?(\d{4})$/.exec(s))) return mk(+m[2],+m[1]-1);
  if((m=/^([a-z]+)\.?,? '?(\d{4}|\d{2})$/.exec(s))){
    const w=m[1], y=m[2].length===2?2000+(+m[2]):+m[2];
    const mo=w.length>=3?BIO_MONTHS.findIndex(n=>n.startsWith(w)):-1;
    if(mo>=0) return mk(y,mo);
    if(BIO_SEASONS[w]) return mk(y,BIO_SEASONS[w][isEnd?1:0]);
    return null;
  }
  if((m=/^(\d{4})$/.exec(s))){ const r=mk(+m[1],isEnd?11:0); return r&&{n:r.n,y:true}; }
  return null;
}
const bioNowYM=()=>{ const t=today(); return (+t.slice(0,4))*12+(+t.slice(5,7))-1; };
/* LinkedIn's arithmetic: both ends count, so Aug–Aug is 1 mo. */
function bioDur(n){
  const y=Math.floor(n/12), m=n%12;
  return [y?y+(y===1?' yr':' yrs'):'', m?m+(m===1?' mo':' mos'):''].filter(Boolean).join(' ');
}
function bioSpan(e){
  const a=bioYM(e.start,false), b=e.current?{n:bioNowYM()}:bioYM(e.end,true);
  if(!a||!b||a.y||b.y) return '';       // year-only: show the range, skip the maths
  const n=b.n-a.n+1;
  return n>=1&&n<1200?bioDur(n):'';
}
/* Sort within a category: roles newest-first (current on top, since that's
   what an application asks for), people grouped by relationship, the rest
   alphabetical. Roles sort on the parsed dates — as text, "May 2025" would
   land above "Aug 2026". Anything unreadable sinks to the bottom. */
function bioSort(list,kind){
  const l=list.slice();
  if(kind==='role'){
    const key=e=>{ const s=bioYM(e.start,false), f=e.current?{n:1e7}:(bioYM(e.end,true)||s);
      return [f?f.n:-1, s?s.n:-1]; };
    return l.sort((x,y)=>{ const X=key(x), Y=key(y);
      return Y[0]-X[0] || Y[1]-X[1] || String(x.title).localeCompare(String(y.title)); });
  }
  if(kind==='person'){
    const rank=r=>{ const i=BIO_RELATIONS.findIndex(x=>x[0]===r); return i<0?99:i; };
    return l.sort((x,y)=>rank(x.relation)-rank(y.relation)||String(x.title).localeCompare(String(y.title)));
  }
  return l.sort((x,y)=>String(x.title).localeCompare(String(y.title)));
}

/* ── bio.md ── the whole point of the section.
   Two audiences, one generator:

     full=true   → bio.md on disk, for an assistant running on this machine.
                   Includes everything, sensitive entries marked as such so the
                   model knows they are private context and not resume material.
     full=false  → what you copy into an application, a cover letter, or a
                   chat with a model you don't control. Sensitive entries are
                   dropped entirely — not redacted, not summarised, absent.

   That split is the safety property of this feature: "people I dislike" is
   useful for advice and catastrophic in a scholarship essay. */
function bioMd(full,opt){
  opt=opt||{};
  const plain=!!opt.plain;                       // no markdown syntax
  const only=opt.cats||null;                     // Set of category ids, or null for all
  const q=(opt.q||'').trim().toLowerCase();      // honour an active search
  const L=[], P=x=>L.push(x);
  const p=bioProfile();
  const keep=e=>(full||!e.sensitive)
    && (!only||only.has(e.cat))
    && (!q||[e.title,e.org,e.role,e.notes,relName(e.relation),(e.tags||[]).join(' '),
             (e.bullets||[]).join(' '),e.start,e.end,bioRange(e)
            ].join(' ').toLowerCase().includes(q));
  const has=v=>v&&String(v).trim();
  const H1=t=>plain?String(t).toUpperCase():'# '+t;
  const H2=t=>plain?'':'## '+t;
  const B =t=>plain?t:'**'+t+'**';
  const li=(t,d)=>plain?(d?'  ':'')+(d?'\u2022 ':'')+t:(d?'  - ':'- ')+t;

  P(H1(has(p.name)?p.name:'Bio'));
  P('');
  const head=[];
  if(has(p.headline)) head.push(p.headline);
  if(has(p.location)) head.push(p.location);
  if(head.length){ P(head.join(' \u00b7 ')); }
  const acad=[];
  if(has(p.school)) acad.push(p.school);
  if(has(p.major)) acad.push(p.major);
  if(has(p.grad))  acad.push('Expected graduation '+p.grad);
  if(has(p.gpa))   acad.push('GPA '+p.gpa);
  if(acad.length) P(acad.join(' \u00b7 '));
  if(head.length||acad.length) P('');

  const contact=[];
  if(has(p.email)) contact.push('Email: '+p.email);
  if(full&&has(p.phone)) contact.push('Phone: '+p.phone);   // never in an application copy
  if(has(p.pronouns)) contact.push('Pronouns: '+p.pronouns);
  if(has(p.links)) contact.push('Links: '+String(p.links).split(/\n+/).join(' \u00b7 '));
  if(contact.length){ contact.forEach(c=>P(li(c))); P(''); }
  if(has(p.summary)){ P(p.summary.trim()); P(''); }

  if(full&&!plain){
    P('> Generated by Catching Days from the Bio tab. This is the user writing about');
    P('> themselves — treat it as fact about them, and prefer it over guessing.');
    P('> Entries marked _(private)_ are personal context for your reasoning only:');
    P('> never copy them into anything outward-facing — an application, an email,');
    P('> an essay, a public profile — unless the user asks for that in the moment.');
    P('');
  }

  let any=false;
  bioCats().forEach(c=>{
    const list=bioSort(bioIn(c.id).filter(keep),c.kind);
    if(!list.length) return;
    any=true;
    if(plain){ P(c.name.toUpperCase()); P(''); } else { P(H2(c.name)); P(''); }
    list.forEach(e=>{
      const bits=[];
      if(c.kind==='role'){
        if(has(e.role)) bits.push(e.role);
        if(has(e.org))  bits.push(e.org);
        const r=bioRange(e); if(r) bits.push(r);
      } else if(c.kind==='person'){
        if(has(e.relation)) bits.push(relName(e.relation));
        if(has(e.org))      bits.push(e.org);
      } else if(has(e.org)) bits.push(e.org);

      if(plain){
        P(e.title+(full&&e.sensitive?'  (private)':''));
        if(bits.length) P(bits.join(' \u00b7 '));
      } else {
        P(li(B(e.title)+(bits.length?' — '+bits.join(' \u00b7 '):'')+
             (full&&e.sensitive?' _(private)_':'')));
      }
      (e.bullets||[]).filter(has).forEach(b=>P(li(b,true)));
      if(has(e.notes)) P(li(e.notes.trim().replace(/\n+/g,' '),true));
      if(has(e.link))  P(li(e.link,true));
      /* tags are an organising tool for you, not a line a recruiter should
         read — they only survive into the full, AI-facing copy */
      if(full&&(e.tags||[]).length) P(li('tags: '+e.tags.join(', '),true));
      if(plain) P('');
    });
    if(!plain) P('');
  });

  if(!any) P(plain?'Nothing to export.':'_Nothing matched — widen the sections or clear the search._');
  return L.join('\n');
}


function diaryBioPill(e){
  const b=e.bioEntryId&&bioEntry(e.bioEntryId);
  return b?`<span class="tagpill" style="color:#8a6424;border-color:#a8762f55;background:#a8762f18">About ${esc(b.title)}</span>`:'';
}

/* ── Bio modals ── */
/* `focusId` lands the cursor on one field, so "Add a headline" in the
   strength meter opens the form already in the headline box. */
function bioProfileModal(focusId){
  const p=bioProfile();
  modal(`<h2>Your profile</h2>
    <p class="dim" style="font-size:12.5px;margin:6px 0 0">The header of every export.
      An assistant reads this first to know who it is writing as.</p>
    <div class="row" style="gap:14px;margin-top:18px;align-items:center">
      ${p.photo
        ? `<img class="bio-av" src="${p.photo}" alt="" style="width:72px;height:72px;border-width:3px">`
        : `<div class="bio-av ph" style="width:72px;height:72px;border-width:3px;line-height:66px;font-size:25px">${
             esc(bioInitials(p.name))||'\u2022'}</div>`}
      <div class="row wrapf" style="gap:7px">
        <button class="sm" onclick="bioPickImage('photo')">${p.photo?'Replace':'Add'} photo</button>
        ${p.photo?`<button class="sm ghost" onclick="bioClearImage('photo')">Remove</button>`:''}
        <button class="sm" onclick="bioPickImage('cover')">${p.cover?'Replace':'Add'} cover</button>
        ${p.cover?`<button class="sm ghost" onclick="bioClearImage('cover')">Remove cover</button>`:''}
      </div>
    </div>
    <p class="faint" style="font-size:12px;margin:8px 0 0">Images are shrunk and stored
      inside your save file, so they travel with it. They are never uploaded anywhere.</p>
    <div class="row" style="gap:10px;margin-top:16px">
      <div style="flex:1"><label class="lbl">Name</label>
        <input id="bp-name" value="${esc(p.name||'')}" autocomplete="off"></div>
      <div style="flex:1"><label class="lbl">Pronouns</label>
        <input id="bp-pro" value="${esc(p.pronouns||'')}" placeholder="they/them" autocomplete="off"></div>
    </div>
    <label class="lbl" style="margin-top:14px">Headline</label>
    <input id="bp-head" value="${esc(p.headline||'')}" placeholder="First-year engineering student at Purdue" autocomplete="off">
    <div class="row" style="gap:10px;margin-top:14px">
      <div style="flex:1"><label class="lbl">Location</label>
        <input id="bp-loc" value="${esc(p.location||'')}" placeholder="West Lafayette, IN" autocomplete="off"></div>
      <div style="flex:1"><label class="lbl">Email</label>
        <input id="bp-mail" value="${esc(p.email||'')}" autocomplete="off"></div>
    </div>
    <label class="lbl" style="margin-top:14px">School</label>
    <input id="bp-school" value="${esc(p.school||'')}" placeholder="Purdue University" autocomplete="off">
    <div class="row" style="gap:10px;margin-top:14px">
      <div style="flex:2"><label class="lbl">Major</label>
        <input id="bp-major" value="${esc(p.major||'')}" placeholder="First-Year Engineering" autocomplete="off"></div>
      <div style="flex:1"><label class="lbl">Grad</label>
        <input id="bp-grad" value="${esc(p.grad||'')}" placeholder="May 2030" autocomplete="off"></div>
      <div style="flex:1"><label class="lbl">GPA</label>
        <input id="bp-gpa" value="${esc(p.gpa||'')}" placeholder="3.8" autocomplete="off"></div>
    </div>
    <label class="lbl" style="margin-top:14px">Phone <span class="faint">— full export only, never in an application copy</span></label>
    <input id="bp-phone" value="${esc(p.phone||'')}" autocomplete="off">
    <label class="lbl" style="margin-top:14px">Links <span class="faint">— one per line</span></label>
    <textarea id="bp-links" rows="2" placeholder="github.com/you">${esc(p.links||'')}</textarea>
    <label class="lbl" style="margin-top:14px">Summary</label>
    <textarea id="bp-sum" rows="4" placeholder="A couple of sentences you would be happy to see at the top of an application.">${esc(p.summary||'')}</textarea>
    <div class="row" style="gap:9px;margin-top:20px">
      <button class="primary" id="bp-go">Save</button>
      <button class="ghost" onclick="closeModal()">Cancel</button>
    </div>`,true);
  ($(focusId)||$('bp-name')).focus();
  $('bp-go').onclick=()=>{
    const b=bio();
    // rebuild from the fields but carry the images through — they are set by
    // their own buttons, not by anything in this form
    b.profile={ photo:p.photo, cover:p.cover,
      name:$('bp-name').value.trim(), pronouns:$('bp-pro').value.trim(),
      headline:$('bp-head').value.trim(), location:$('bp-loc').value.trim(),
      email:$('bp-mail').value.trim(), phone:$('bp-phone').value.trim(),
      school:$('bp-school').value.trim(),
      major:$('bp-major').value.trim(), grad:$('bp-grad').value.trim(),
      gpa:$('bp-gpa').value.trim(),
      links:$('bp-links').value.trim(), summary:$('bp-sum').value.trim() };
    save(); closeModal(); paintBio();
  };
}

function bioModal(edit,presetCat){
  const e=edit?bioEntry(edit):null;
  /* Adding from inside a category should stay in that category — filtering to
     People and then hand-picking People from a dropdown is a step that never
     needed to exist. Explicit preset wins, then the category you're filtered
     to, then whatever you filed last, then the first one. Always changeable. */
  const catId = e ? e.cat
    : presetCat || (bioCatFilter!=='all' ? bioCatFilter : null)
      || bioLastCat || bioCats()[0].id;
  let imgVal = e?.img || '';
  modal(`<h2>${e?'Edit':'New'} entry</h2>
    <div id="be-img-wrap" class="row" style="gap:13px;margin-top:16px;align-items:center"></div>
    <label class="lbl" style="margin-top:16px">Category</label>
    <select id="be-cat">${bioCats().map(c=>
      `<option value="${c.id}" ${c.id===catId?'selected':''}>${c.icon} ${esc(c.name)}</option>`).join('')}</select>
    <div id="be-fields"></div>
    <label class="lbl" style="margin-top:14px">Notes</label>
    <textarea id="be-notes" rows="3" placeholder="Anything you would want an AI to know.">${esc(e?.notes||'')}</textarea>
    <label class="lbl" style="margin-top:14px">Tags <span class="faint">— comma separated</span></label>
    <input id="be-tags" value="${esc((e?.tags||[]).join(', '))}" placeholder="leadership, python" autocomplete="off">
    <label class="row" style="gap:9px;margin-top:16px;cursor:pointer;align-items:flex-start">
      <input type="checkbox" id="be-sens" ${e?.sensitive?'checked':''} style="width:auto;flex:none;margin-top:2px">
      <span style="font-size:13px">Private — keep out of application exports
        <span class="faint" style="display:block;font-size:12px;margin-top:2px">Still visible to
          your own AI on this computer. Just never included in the copy you paste
          into an application, essay, or profile.</span></span>
    </label>
    <div class="row" style="gap:9px;margin-top:20px">
      <button class="primary" id="be-go">${e?'Save':'Add'}</button>
      <button class="ghost" onclick="closeModal()">Cancel</button>
      ${e?`<button class="danger sm" style="margin-left:auto" onclick="delBioEntry('${e.id}')">Delete</button>`:''}
    </div>`,true);

  /* What's currently in the form, whether or not it has been saved. Switching
     category re-renders these inputs, and reading from the stored entry would
     silently discard everything typed since the modal opened — you would pick
     the right category and lose the title you just wrote. */
  const draft=Object.assign({title:'',org:'',role:'',relation:'',start:'',end:'',
                             link:'',current:false,bullets:''},
    e?{title:e.title,org:e.org,role:e.role,relation:e.relation,start:e.start,end:e.end,
       link:e.link,current:e.current,bullets:(e.bullets||[]).join('\n')}:{});
  const readDraft=()=>{
    const g=id=>{ const el=$(id); return el?el.value:undefined; };
    [['title','be-title'],['org','be-org'],['role','be-role'],['relation','be-rel'],
     ['start','be-start'],['end','be-end'],['link','be-link'],['bullets','be-bul']
    ].forEach(([k,id])=>{ const v=g(id); if(v!==undefined) draft[k]=v; });
    if($('be-cur')) draft.current=$('be-cur').checked;
  };

  const paintFields=()=>{
    const k=bioKind($('be-cat').value);
    const lbl=k==='person'?'Name':k==='thing'?'What it is':'Title';
    const orgLbl=k==='person'?'Where you know them from'
                :k==='thing' ?'Make / model / detail'
                :'Organization';
    $('be-fields').innerHTML=`
      <label class="lbl" style="margin-top:14px">${lbl}</label>
      <input id="be-title" value="${esc(draft.title)}" autocomplete="off"
        placeholder="${k==='person'?'Alex Chen':k==='role'?'Undergraduate Research Assistant':'Photography'}">
      ${k==='person'?`
        <label class="lbl" style="margin-top:14px">Relationship</label>
        <select id="be-rel">${BIO_RELATIONS.map(([v,l])=>
          `<option value="${v}" ${draft.relation===v?'selected':''}>${l}</option>`).join('')}</select>`:''}
      ${k!=='plain'?`
        <label class="lbl" style="margin-top:14px">${orgLbl}</label>
        <input id="be-org" value="${esc(draft.org)}" autocomplete="off">`:''}
      ${k==='role'?`
        <label class="lbl" style="margin-top:14px">Your role</label>
        <input id="be-role" value="${esc(draft.role)}" placeholder="Treasurer" autocomplete="off">
        <div class="row" style="gap:10px;margin-top:14px">
          <div style="flex:1"><label class="lbl">Started</label>
            <input id="be-start" value="${esc(draft.start)}" placeholder="Aug 2026" autocomplete="off"></div>
          <div style="flex:1"><label class="lbl">Ended</label>
            <input id="be-end" value="${esc(draft.end)}" placeholder="May 2027" autocomplete="off"
              ${draft.current?'disabled':''}></div>
        </div>
        <label class="row" style="gap:8px;margin-top:10px;cursor:pointer">
          <input type="checkbox" id="be-cur" ${draft.current?'checked':''} style="width:auto;flex:none">
          <span style="font-size:13px">Still doing this</span></label>
        <label class="lbl" style="margin-top:14px">What you did
          <span class="faint">— one per line, these become resume bullets</span></label>
        <textarea id="be-bul" rows="4" placeholder="Ran the club budget, ~$4k/semester">${esc(draft.bullets)}</textarea>`:''}
      ${k==='role'||k==='thing'?`
        <label class="lbl" style="margin-top:14px">Link</label>
        <input id="be-link" value="${esc(draft.link)}" autocomplete="off">`:''}`;
    const cur=$('be-cur');
    if(cur) cur.onchange=()=>{ const en=$('be-end'); en.disabled=cur.checked; if(cur.checked) en.value=''; };
    const rel=$('be-rel');
    // Recording someone you avoid is useful context and terrible resume
    // material, so the private flag turns itself on the moment you say so.
    if(rel) rel.onchange=()=>{ if(rel.value==='dislike') $('be-sens').checked=true; };
  };
  /* Lives outside #be-fields so switching category never clears a picked
     image. Falls back to the same tile the list uses, so an entry without a
     picture still looks deliberate rather than broken. */
  const paintImg=()=>{
    const c=bioCat($('be-cat').value)||{icon:'\u{1F4CC}',kind:'plain'};
    const round=c.kind==='person'?'50%':'12px';
    const hue=bioHue(($('be-title')?$('be-title').value:'')+c.id);
    $('be-img-wrap').innerHTML=`
      ${imgVal
        ? `<img src="${imgVal}" alt="" style="width:58px;height:58px;border-radius:${round};
             object-fit:cover;border:1px solid var(--line2);flex:none">`
        : `<div style="width:58px;height:58px;border-radius:${round};flex:none;display:flex;
             align-items:center;justify-content:center;font-size:24px;border:1px solid var(--line2);
             background:hsl(${hue} 42% 93%);color:hsl(${hue} 38% 34%)">${c.icon}</div>`}
      <div class="row wrapf" style="gap:7px">
        <button class="sm" id="be-img-pick">${imgVal?'Replace':'Add'} image</button>
        ${imgVal?`<button class="sm ghost" id="be-img-clear">Remove</button>`:''}
      </div>`;
    $('be-img-pick').onclick=()=>{
      const inp=document.createElement('input');
      inp.type='file'; inp.accept='image/*';
      inp.onchange=()=>{
        const f=inp.files&&inp.files[0]; if(!f) return;
        if(!/^image\//.test(f.type)){ toast('That is not an image.'); return; }
        const rd=new FileReader();
        rd.onload=()=>bioShrink(rd.result,'thumb').then(u=>{ imgVal=u; paintImg(); },
                                                        ()=>toast('Could not read that image.'));
        rd.onerror=()=>toast('Could not read that file.');
        rd.readAsDataURL(f);
      };
      inp.click();
    };
    const clr=$('be-img-clear');
    if(clr) clr.onclick=()=>{ imgVal=''; paintImg(); };
  };

  paintFields();
  paintImg();
  $('be-cat').onchange=()=>{ readDraft(); paintFields(); paintImg(); };
  $('be-title').focus();

  $('be-go').onclick=()=>{
    const t=$('be-title').value.trim(); if(!t) return;
    readDraft();
    const g=id=>{ const el=$(id); return el?el.value.trim():''; };
    const rec=e||fixBioEntry({id:uid(),created:Date.now()});
    Object.assign(rec,{
      cat:$('be-cat').value, title:t,
      org:g('be-org'), role:g('be-role'), relation:g('be-rel'),
      start:g('be-start'), end:g('be-end'),
      current:!!($('be-cur')&&$('be-cur').checked),
      link:g('be-link'), notes:$('be-notes').value.trim(),
      bullets:g('be-bul').split(/\n+/).map(x=>x.trim()).filter(Boolean),
      tags:$('be-tags').value.split(',').map(x=>x.trim()).filter(Boolean),
      img:imgVal,
      sensitive:$('be-sens').checked, updated:Date.now()
    });
    bioLastCat=rec.cat;
    if(!e) bio().entries.push(rec);
    save(); closeModal(); paintBio();
  };
}
function delBioEntry(id){
  /* The writing belongs to the Journal even if its Bio subject is removed.
     Keep every entry and only detach the now-missing Bio link. */
  (db.diary||[]).forEach(e=>{ if(e.bioEntryId===id) e.bioEntryId=null; });
  bio().entries=bio().entries.filter(x=>x.id!==id);
  save(); closeModal(); paintBio();
}

/* Sections: rename, re-icon, pick a layout and a half of the page, remove an
   empty one you made. A category's kind (its form fields) stays fixed once
   it exists — entries were written against it. */
function bioCatModal(){
  const opt=(v,l,on)=>`<option value="${v}" ${on?'selected':''}>${esc(l)}</option>`;
  const isDefault=c=>BIO_CATS_DEFAULT.some(d=>d.id===c.id);
  // on a phone the two pickers share a line, so "Auto" goes without its preview
  const auto=v=>innerWidth<620?'Auto':'Auto · '+v;
  modal(`<h2>Sections</h2>
    <p class="dim" style="font-size:12.5px;margin:6px 0 0">Pick how each section looks and which half
      of the page it sits in. <b>Auto</b> goes by the section's shape and name.</p>
    <div class="bio-cm">
      <div class="bio-cm-row bio-cm-h" aria-hidden="true"><span class="h-n">Name</span><span class="h-v">Layout</span><span class="h-s">Half</span></div>
      ${bioCats().map(c=>{ const n=bioIn(c.id).length;
        return `<div class="bio-cm-row" data-id="${c.id}">
          <input class="bio-cm-ic" value="${esc(c.icon)}" aria-label="Icon" title="Icon — any emoji" autocomplete="off">
          <input class="bio-cm-nm" value="${esc(c.name)}" aria-label="Name" autocomplete="off">
          <select class="bio-cm-v" aria-label="Layout">${
            opt('',auto(BIO_VIEWS[bioView(c,true)]),!c.view)}${
            Object.entries(BIO_VIEWS).map(([k,l])=>opt(k,l,c.view===k)).join('')}</select>
          <select class="bio-cm-s" aria-label="Half of the page">${
            opt('',auto(bioSide(c,true)==='career'?'Career':'Life'),!c.side)}${
            opt('career','Career',c.side==='career')}${opt('life','Life',c.side==='life')}</select>
          <span class="faint bio-cm-n" title="${n} entr${n===1?'y':'ies'}">${n}</span>
          ${!isDefault(c)&&!n
            ? `<button class="xs ghost" style="padding:4px 0;width:30px" onclick="bioDelCat('${c.id}')"
                 title="Remove this empty section" aria-label="Remove ${esc(c.name)}">✕</button>`
            : '<span></span>'}
        </div>`; }).join('')}
    </div>
    <label class="row" style="gap:9px;margin-top:14px;cursor:pointer">
      <input type="checkbox" id="bc-str" ${bio().hideStrength?'':'checked'} style="width:auto;flex:none">
      <span style="font-size:13px">Show the profile strength meter</span></label>
    <div class="row" style="gap:9px;margin-top:16px">
      <button class="primary" id="bc-save">Save</button>
      <button class="ghost" onclick="closeModal()">Cancel</button>
    </div>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--line2)">
      <label class="lbl">New section</label>
      <div class="row wrapf" style="gap:8px">
        <input id="bc-name" placeholder="Volunteering" autocomplete="off" style="flex:2 1 160px">
        <select id="bc-kind" style="flex:1.5 1 190px">
          <option value="role">Role — organization, dates, achievements</option>
          <option value="person">Person — relationship, how you know them</option>
          <option value="thing">Thing — a detail and a link</option>
          <option value="plain">Simple — just a title and notes</option>
        </select>
        <button class="sm" id="bc-go">Add</button>
      </div>
    </div>`,true);

  $('bc-save').onclick=()=>{ bioCatApply(); save(); closeModal(); paintBio(); };
  $('bc-go').onclick=()=>{
    const n=$('bc-name').value.trim(); if(!n){ $('bc-name').focus(); return; }
    bioCatApply();
    bio().cats.push({id:uid(),name:n,kind:$('bc-kind').value,icon:'📌'});
    save(); paintBio(); bioCatModal();
    toast(`Added “${n}”. Give it an icon and a layout, then Save.`);
  };
}
/* Adding or removing re-opens the dialog, so both first keep whatever was
   edited in the rows — otherwise renaming three sections and then adding a
   fourth would quietly throw the renames away. */
function bioCatApply(){
  const first=s=>{ s=String(s||'').trim(); if(!s) return '';
    try{ return [...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(s)][0].segment; }
    catch(_){ return [...s].slice(0,2).join(''); } };
  document.querySelectorAll('.bio-cm-row').forEach(r=>{
    const c=bioCat(r.dataset.id); if(!c) return;
    const nm=r.querySelector('.bio-cm-nm').value.trim(); if(nm) c.name=nm;
    c.icon=first(r.querySelector('.bio-cm-ic').value)||c.icon||'📌';
    const v=r.querySelector('.bio-cm-v').value, s=r.querySelector('.bio-cm-s').value;
    if(v) c.view=v; else delete c.view;
    if(s) c.side=s; else delete c.side;
  });
  const st=$('bc-str');
  if(st){ if(st.checked) delete bio().hideStrength; else bio().hideStrength=true; }
}
function bioDelCat(id){
  if(!bioCat(id)||bioIn(id).length||BIO_CATS_DEFAULT.some(d=>d.id===id)) return;
  bioCatApply();
  bio().cats=bio().cats.filter(x=>x.id!==id);
  if(bioCatFilter===id) bioCatFilter='all';
  bioOpen.delete(id);
  save(); paintBio(); bioCatModal();
}

/* Export state lives outside the modal so switching mode/format keeps your
   section choices. Tester finding: the filter and search pills sit directly
   above the Export button, so an export that quietly ignored them was a trap
   — the scope is now explicit and visible instead. */
let bioX={full:false,plain:false,cats:null,useQ:true};

function bioExportModal(){
  // seed the section choice from whatever the page is currently showing
  bioX.cats = bioCatFilter==='all' ? null : new Set([bioCatFilter]);
  bioX.useQ = true;
  bioExportPaint();
}
function bioExportPaint(){
  const withEntries=bioCats().filter(c=>bioIn(c.id).length);
  const on=id=>!bioX.cats||bioX.cats.has(id);
  const q=bioX.useQ?bioQuery:'';
  const md=bioMd(bioX.full,{plain:bioX.plain,cats:bioX.cats,q});
  const held=bioEntries().filter(x=>x.sensitive).length;
  const shownCount=bioEntries().filter(e=>(bioX.full||!e.sensitive)&&on(e.cat)).length;

  modal(`<h2>Export bio</h2>

    <label class="lbl" style="margin-top:16px">Audience</label>
    <div class="row wrapf" style="gap:7px">
      <button class="chip ${bioX.full?'':'on'}" onclick="bioX.full=false;bioExportPaint()">For an application</button>
      <button class="chip ${bioX.full?'on':''}" onclick="bioX.full=true;bioExportPaint()">Everything (your AI)</button>
    </div>
    <p class="dim" style="font-size:12.5px;margin:9px 0 0">${bioX.full
      ? 'Includes private entries and your phone number. Already saved beside the app as <span class="mono">bio.md</span>.'
      : `Private entries and your phone number are removed${held?` — ${held} held back`:''}. Safe to paste into an application, an essay, or a chatbot you do not control.`}</p>

    <label class="lbl" style="margin-top:16px">Format</label>
    <div class="row wrapf" style="gap:7px">
      <button class="chip ${bioX.plain?'':'on'}" onclick="bioX.plain=false;bioExportPaint()">Markdown</button>
      <button class="chip ${bioX.plain?'on':''}" onclick="bioX.plain=true;bioExportPaint()">Plain text</button>
    </div>
    <p class="faint" style="font-size:12px;margin:7px 0 0">${bioX.plain
      ? 'No # or ** symbols — for form fields that show raw text.'
      : 'Best for a chatbot or anything that renders Markdown.'}</p>

    <label class="lbl" style="margin-top:16px">Sections — ${shownCount} entr${shownCount===1?'y':'ies'}</label>
    <div class="row wrapf" style="gap:6px">
      <button class="chip ${bioX.cats?'':'on'}" onclick="bioX.cats=null;bioExportPaint()">All</button>
      ${withEntries.map(c=>`<button class="chip ${bioX.cats&&bioX.cats.has(c.id)?'on':''}"
        onclick="bioXToggle('${c.id}')">${c.icon} ${esc(c.name)}</button>`).join('')}
    </div>
    ${bioQuery.trim()?`<label class="row" style="gap:8px;margin-top:12px;cursor:pointer">
      <input type="checkbox" ${bioX.useQ?'checked':''} onchange="bioX.useQ=this.checked;bioExportPaint()"
             style="width:auto;flex:none">
      <span style="font-size:13px">Also apply your search \u201c${esc(bioQuery.trim())}\u201d</span></label>`:''}

    <textarea id="bx-md" rows="20" class="mono" style="margin-top:14px;font-size:12px">${esc(md)}</textarea>
    <div class="row" style="gap:9px;margin-top:14px">
      <button class="primary" id="bx-copy">Copy</button>
      <button class="ghost" onclick="closeModal()">Close</button>
      <span class="faint" style="margin-left:auto;font-size:12px">${md.split('\n').length} lines</span>
    </div>`,true);

  $('bx-copy').onclick=()=>{
    // copy what is in the box, so hand-trimming before copying actually works
    const t=$('bx-md').value;
    navigator.clipboard.writeText(t).then(()=>toast('Bio copied.'),()=>{
      $('bx-md').select(); toast('Select-all and copy — clipboard was blocked.'); });
  };
}
function bioXToggle(id){
  const withEntries=bioCats().filter(c=>bioIn(c.id).length).map(c=>c.id);
  /* While "All" is active no chip is drawn as selected, so the first click
     has to mean "just this one" — starting from everything and subtracting
     would look like the click did nothing. After that they behave as
     checkboxes; clearing the last one (or ticking every one) returns to All. */
  if(!bioX.cats){ bioX.cats=new Set([id]); bioExportPaint(); return; }
  bioX.cats.has(id)?bioX.cats.delete(id):bioX.cats.add(id);
  if(!bioX.cats.size||bioX.cats.size===withEntries.length) bioX.cats=null;
  bioExportPaint();
}

/* Shrink + re-encode, split out from the picker so it can be exercised
   without a file dialog. Resolves to a JPEG data URL, or rejects. */
function bioShrink(src,kind){
  const MAX = kind==='cover' ? [1400,360] : kind==='poster' ? [240,360]
            : kind==='thumb' ? [240,240] : [400,400];
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      try{
        let w=img.width, h=img.height, sx=0, sy=0, sw=w, sh=h;
        if(kind==='cover'||kind==='poster'){
          const target=MAX[0]/MAX[1];
          if(w/h>target){ sw=h*target; sx=(w-sw)/2; } else { sh=w/target; sy=(h-sh)/2; }
          w=Math.min(MAX[0],sw); h=w/target;
        } else {
          const side=Math.min(w,h); sx=(w-side)/2; sy=(h-side)/2; sw=sh=side;
          w=h=Math.min(MAX[0],side);
        }
        const cv=document.createElement('canvas');
        cv.width=Math.max(1,Math.round(w)); cv.height=Math.max(1,Math.round(h));
        cv.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,cv.width,cv.height);
        resolve(cv.toDataURL('image/jpeg', kind==='cover'?0.72:kind==='thumb'||kind==='poster'?0.78:0.82));
      }catch(err){ reject(err); }
    };
    img.onerror=()=>reject(new Error('decode failed'));
    img.src=src;
  });
}
/* ── Bio photos ──
   Images live in the save file as data URLs rather than as files on disk:
   server.py only accepts .json and .md writes, and keeping the app a single
   portable document is worth more than a few KB. Everything is downscaled and
   re-encoded first — a phone photo is several MB and would bloat every
   autosave, so the original is never stored. */
function bioPickImage(kind){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='image/*';
  inp.onchange=()=>{
    const f=inp.files&&inp.files[0]; if(!f) return;
    if(!/^image\//.test(f.type)){ toast('That is not an image.'); return; }
    const rd=new FileReader();
    rd.onload=()=>{
      bioShrink(rd.result,kind).then(url=>{
        const kb=Math.round(url.length*0.75/1024);
        if(kb>700){ toast('That image is too large even after shrinking.'); return; }
        bioProfile()[kind==='cover'?'cover':'photo']=url;
        save(); paintBio();
        if($('modals').innerHTML) bioProfileModal();
        toast((kind==='cover'?'Cover':'Photo')+' updated · '+kb+' KB');
      },()=>toast('Could not read that image.'));
    };
    rd.onerror=()=>toast('Could not read that file.');
    rd.readAsDataURL(f);
  };
  inp.click();
}
function bioClearImage(kind){
  delete bioProfile()[kind==='cover'?'cover':'photo'];
  save(); paintBio();
  if($('modals').innerHTML) bioProfileModal();
}
/* Initials stand in for a missing photo — same trick every profile app uses,
   and far better than a grey silhouette. */
function bioInitials(name){
  const p=String(name||'').trim().split(/\s+/).filter(Boolean);
  if(!p.length) return '';
  return (p[0][0]+(p.length>1?p[p.length-1][0]:'')).toUpperCase();
}
/* A stable hue per entry so the tiles vary without being random on every
   repaint. The same string always yields the same colour. */
function bioHue(str){
  let h=0; const s=String(str||'');
  for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0;
  return h%360;
}

/* Bio journals are regular Journal entries with one extra relationship field.
   That gives them calendar dots, tags, photos, moods and the Journal's editing
   history for free, while this hub provides the subject-specific history. */
function bioJournalEntries(id){
  return (db.diary||[]).filter(e=>fixDiary(e).bioEntryId===id)
    .sort((a,b)=>b.createdAt-a.createdAt);
}
function bioJournalHub(id){
  const b=bioEntry(id); if(!b) return;
  const entries=bioJournalEntries(id);
  modal(`<h2>${esc(b.title)} · journal</h2>
    <p class="dim" style="font-size:12.5px;margin:5px 0 14px">These are also part of your main Journal calendar and dot history.</p>
    <div style="max-height:48vh;overflow:auto">
      ${entries.length?entries.map(e=>`
        <div class="item">
          <span class="mood-dot" style="width:13px;height:13px;margin-top:3px;background:${e.mood?diaMoodInfo(e.mood).hex:tagHex(e.tagId)}"></span>
          <div class="ti">
            <div class="tt">${esc(e.title)||'Untitled'}</div>
            <div class="meta"><span>${dDate(e.date)}</span>${e.mood?`<span>${diaMoodInfo(e.mood).label}</span>`:''}</div>
            <div class="dim" style="font-size:12px;margin-top:5px">${esc(e.body.length>150?e.body.slice(0,150)+'…':e.body)}</div>
          </div>
          <div class="row" style="gap:5px">
            <button class="xs" onclick="diaryModal('${e.id}',null,'${b.id}')">Edit</button>
            <button class="xs ghost" onclick="openBioJournalEntry('${e.id}')">Open</button>
          </div>
        </div>`).join(''):'<p class="empty">Nothing written about this entry yet.</p>'}
    </div>
    <div class="row" style="gap:9px;margin-top:18px">
      <button class="primary" onclick="diaryModal(null,'${today()}','${b.id}')">+ New journal entry</button>
      <button class="ghost" onclick="closeModal()">Close</button>
    </div>`,true);
}
function openBioJournalEntry(id){
  const e=(db.diary||[]).find(x=>x.id===id); if(!e) return;
  diaMode='cal'; diaFromVault=false;
  diaCal=e.date.slice(0,7); diaSel=e.date; diaEntrySel=e.id;
  closeModal(); tab('dia');
}

/* ── Bio view ──
   Two halves. Career (roles, skills, education) reads like LinkedIn: logo
   rows, several roles at one place grouped under it, "Aug 2025 – Present ·
   1 yr 2 mos". Life (people, hobbies, things) is not a resume, so each
   of its sections gets a layout that suits what it holds: your people orbit
   you, hobbies are colour tiles. Which half a
   section sits in and how it is drawn are both optional per category (`side`,
   `view`); bioSide()/bioView() pick from its kind and name when they're unset,
   so a new category looks right without being configured. */
let bioCatFilter='all';
let bioQuery='';
/* The category you last filed something under. Only consulted when the list
   isn't already filtered to a category — see bioModal's preselect. */
let bioLastCat=null;
let bioOpen=new Set();   // sections expanded past their preview ("Show all")
let bioMore=new Set();   // entries whose long text is expanded ("…see more")
let bioFresh=false;      // set on arriving at the tab: that paint animates in
let bioAnim=false;       // …and this carries it to the renderers during the paint
let bioJ=new Map();      // entry id -> its journal entries, rebuilt every paint
let bioW=0;              // content width at the last paint; the circle is sized to it

function bioView(c,autoOnly){
  if(!autoOnly&&c.view&&BIO_VIEWS[c.view]) return c.view;
  const n=String(c.name||'');
  if(c.kind==='person') return 'orbit';
  if(c.kind==='role') return 'timeline';
  if(c.id==='skill'||/skill|language|tool|stack|tech|certif/i.test(n)) return 'chips';
  if(c.id==='hobby'||/hobb|interest|passion|fav/i.test(n)) return 'tiles';
  if(c.kind==='thing') return 'gallery';
  return 'list';
}
function bioSide(c,autoOnly){
  if(!autoOnly&&(c.side==='career'||c.side==='life')) return c.side;
  return c.kind==='role'||c.id==='skill'||
    /skill|language|tool|stack|tech|certif|licen|course|publication|volunteer|award|honou?r/i.test(String(c.name||''))
    ?'career':'life';
}

/* A picture for an entry that has none, guessed from its words. Whole words
   only, so "Art" doesn't fire on "artificial". Alternatives are split by |,
   and a space inside one matches any run of spaces ("table  tennis"). Falls
   back to the section's own icon, which is what everything showed before. */
const BIO_EMOJI=[
  // first match wins, so a phrase goes above any single word inside it
  ['⚽','soccer|futbol|fútbol'],['🏈','football|nfl'],['🏀','basketball'],['⚾','baseball|softball'],
  ['🏓','ping pong|table tennis'],['🎾','tennis|pickleball'],['🏐','volleyball'],['⛳','golf'],
  ['🏊','swim|swimming'],['🏃','run|running|jog|jogging|marathon|track|cross country'],
  ['🏋️','gym|lift|lifting|weights|workout|fitness|bodybuilding|powerlifting'],['🧘','yoga|meditation|meditate'],
  ['🥾','hike|hiking|camping|outdoors'],['🚴','cycling|biking|bike'],['🎿','ski|skiing|snowboard|snowboarding'],
  ['🧗','climb|climbing|bouldering'],['🥊','boxing|mma|martial arts|karate|taekwondo|jiu jitsu|wrestling'],
  ['🏏','cricket'],['🏒','hockey'],['🏸','badminton'],['🎳','bowling'],['🏄','surf|surfing'],
  ['🛹','skate|skating|skateboard|skateboarding'],['♟️','chess'],
  ['🎮','gaming|video games|video game|games|game|xbox|playstation|nintendo|minecraft|valorant|fortnite'],
  ['🍥','anime|manga'],['🎬','movie|movies|film|films|cinema'],['📺','tv|show|shows|series'],
  ['📚','book|books|reading|read|novel|novels'],['✍️','writing|write|poetry|poems|journaling'],
  ['🎸','guitar'],['🎹','piano|keyboard'],['🥁','drums|drum'],['🎻','violin|cello|viola'],
  ['🎵','music|song|songs|singing|sing|choir|band|rap'],['💃','dance|dancing'],
  ['🎨','art|drawing|draw|painting|paint|sketching|design'],['📷','photography|photo|photos|camera'],
  ['🍳','cooking|cook|baking|bake|chef|food'],['☕','coffee|tea'],['✈️','travel|traveling|travelling|trips'],
  ['💻','coding|code|programming|software|laptop|computer|pc|macbook'],['🤖','robotics|robot|robots'],
  ['🧪','science|chemistry|lab|physics|biology'],['📐','math|calculus|calc'],['🚗','car|cars|driving'],
  ['🪴','gardening|garden|plants'],['🐶','dog|dogs|puppy'],['🐱','cat|cats|kitten'],['🎣','fishing'],
  ['🧱','lego|legos'],['🎙️','podcast|podcasts'],['🎭','theater|theatre|drama|acting'],
  ['🤝','volunteering|volunteer|community service'],['🗣️','languages|language|spanish|french|hindi|japanese'],
  ['👟','sneakers|shoes|fashion|clothes'],['🧩','puzzles|puzzle|rubiks cube'],['🔭','astronomy|space|stars'],
  ['🏛️','history'],['📈','investing|stocks|finance|crypto'],['🙏','prayer|temple|faith|spirituality|gita'],
  ['📱','phone|iphone|android'],['🎧','headphones|earbuds|airpods'],['⌚','watch'],['🔑','keys']
].map(([g,w])=>[g,new RegExp('(^|[^\\p{L}])('+w.replace(/ /g,'\\s+')+')(?=$|[^\\p{L}])','iu')]);
function bioGlyph(e,c){
  const s=e.title+' '+(e.org||'');
  for(const [g,re] of BIO_EMOJI) if(re.test(s)) return g;
  return (c&&c.icon)||'📌';
}
const bioFirstChar=t=>((String(t||'').match(/[\p{L}\p{N}]/u)||['•'])[0]).toUpperCase();
/* What you'd call someone: their first name, or "Dr. Shah" rather than "Dr." */
function bioFirstName(name){
  const w=String(name||'').trim().split(/\s+/).filter(Boolean);
  if(w.length>1&&/^(dr|mr|mrs|ms|mx|miss|prof|professor|coach|rev|fr|sr|sra|srta|aunt|auntie|uncle)\.?$/i.test(w[0]))
    return w[0]+' '+w[1];
  return w[0]||'';
}
const bioHref=l=>/^https?:/i.test(l)?l:'https://'+l;
function bioLinkHtml(l){
  return `<div style="margin-top:8px"><a href="${esc(bioHref(l))}" target="_blank" rel="noopener"
    onclick="event.stopPropagation()" style="font-size:12.5px;color:var(--accent)">${
    esc(l.replace(/^https?:\/\//i,''))}</a></div>`;
}
/* tag (lower-cased) -> the entries carrying it, so a skill can show where it's used */
function bioUses(){
  const m=new Map();
  bioEntries().forEach(x=>(x.tags||[]).forEach(t=>{
    const k=String(t).trim().toLowerCase(); if(!k) return;
    if(!m.has(k)) m.set(k,[]); m.get(k).push(x); }));
  return m;
}

/* ── profile strength ── LinkedIn's meter, counting only LinkedIn things:
   nothing about friends or shows ever moves it. */
function bioStrength(){
  const p=bioProfile(), n=id=>bioIn(id).length, has=v=>!!String(v||'').trim();
  const sk=n('skill');
  const items=[          // [chip label, weight, done, action] — biggest gains first
    ['Your name',5,has(p.name),"bioProfileModal('bp-name')"],
    ['Headline',15,has(p.headline),"bioProfileModal('bp-head')"],
    ['Work experience',15,n('work')>0,"bioModal(null,'work')",['work']],
    ['Profile photo',10,!!p.photo,"bioPickImage('photo')"],
    ['About',10,has(p.summary),"bioProfileModal('bp-sum')"],
    ['School',10,has(p.school)||has(p.major),"bioProfileModal('bp-school')"],
    ['A project',10,n('proj')>0,"bioModal(null,'proj')",['proj']],
    [sk?`${3-sk} more skill${3-sk===1?'':'s'}`:'3 skills',10,sk>=3,"bioModal(null,'skill')",['skill']],
    ['A club or activity',5,n('club')+n('extra')+n('sport')>0,"bioModal(null,'club')",['club']],
    ['Location',5,has(p.location),"bioProfileModal('bp-loc')"],
    ['A link or email',5,has(p.links)||has(p.email),"bioProfileModal('bp-links')"]
  ].filter(x=>!x[4]||x[4].every(id=>bioCat(id)));   // a section you turned off never asks to be filled
  const score=items.reduce((s,x)=>s+(x[2]?x[1]:0),0);
  return {score, todo:items.filter(x=>!x[2]), done:items.filter(x=>x[2]).length, total:items.length,
    level:score>=100?'All-Star':score>=80?'Expert':score>=55?'Advanced':score>=30?'Intermediate':'Beginner'};
}
function bioStrengthHtml(){
  if(bio().hideStrength) return '';
  const s=bioStrength(); if(s.score>=100) return '';
  return `<div class="bio-str${bioAnim?' fresh':''}">
    <div style="flex:1 1 220px;min-width:0">
      <div class="t">Profile strength · <span class="lv">${s.level}</span>
        <span class="faint" style="font-weight:600">· ${s.done} of ${s.total}</span></div>
      <div class="bar"><i style="width:${s.score}%"></i></div>
    </div>
    <div class="row wrapf" style="gap:6px">${s.todo.slice(0,2).map(x=>
      `<button class="chip" onclick="${x[3]}">+ ${esc(x[0])}</button>`).join('')}</div>
  </div>`;
}

/* ═══════════════ You · Bio ═══════════════
   A cover of water, your people drawn as ripples around you. Career stays
   what an application wants to see. */
const bioH=s=>[...String(s)].reduce((a,c)=>a+c.charCodeAt(0)*7,0)%360;
const bioIni=n=>String(n||'').split(/[\s-]+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase()||'•';
const BIO_LEVELS=[[0,'Seedling'],[30,'Rooted'],[55,'Budding'],[80,'Blooming'],[100,'In full bloom']];
function bioShort(c){ return String(c.name).split(/\s*[\/&]\s*|\s+/)[0]; }
function paintBio(){
  const el=$('bio-body'); if(!el) return;
  const p=bioProfile(), all=bioEntries(), P=PondArt; P.PF.motion=pondMotionOn();
  const W=Math.round(el.clientWidth||1100), f=W/1104;
  const named=(p.name||'').trim();
  /* the cover: water with the adopted species, unless you set a picture */
  P.reseed(55);
  const cast=[...new Set(activeClasses().map(c=>db.pond.adopt[c.id]).filter(Boolean))];
  const fx=[['koi',760,95,280,60,34],['clown',560,100,240,55,28],['puffer',900,90,160,50,30]].map((d,i)=>[cast[i]||d[0],...d.slice(1)]);
  const cover=p.cover?`<div class="amb" style="background:url('${p.cover}') center/cover"></div>`
    :`<div class="amb">${[P.caustics(W,190,.22),P.ripple(800*f,100,140,0),P.ripple(300*f,90,120,2.5),
      ...fx.map(([k,x,y,rx,ry,dur],i)=>P.swimmer(P.loop(x*f,y,rx*f,ry,6,.4),dur,i===1,P.fish(k,P.SP[k].s*.95,.7))),
      P.pad(1040*f,40,52,40,'#5f9470','great'),P.pad(460*f,170,36,200,'#6f9e7a',null),P.glints(W,190,8),P.petals(190,2)].join('')}</div>`;
  const cats=bioCats(), side=c=>bioSide(c);
  const people=bioSort(all.filter(e=>(bioCat(e.cat)||{}).kind==='person'&&e.relation!=='dislike'),'person');
  const hobbies=bioIn('hobby'), hobbyOn=!!bioCat('hobby');
  const personCat=cats.find(c=>c.kind==='person');   // null when every people section is off
  const statCats=cats.map(c=>({c,n:bioIn(c.id).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n).slice(0,3);
  const s=bioStrength(), lvl=[...BIO_LEVELS].reverse().find(l=>s.score>=l[0]), next=BIO_LEVELS.find(l=>l[0]>s.score);
  const todo=s.todo.slice(0,2).map(x=>x[0].replace(/^(\d)/,'$1').toLowerCase());
  const chip=(v,label,field)=>v?`<button class="bp-chip on" onclick="bioProfileModal('${field}')">${esc(v)}</button>`:`<button class="bp-chip" onclick="bioProfileModal('${field}')">+ ${label}</button>`;
  /* people as ripples: closer people on closer rings */
  const RAD={t0:78,t1:136,t2:190,t3:190};
  const oW=540, oH=430, ox=oW/2, oy=oH/2+6;
  const ring=people.map(e=>({e,t:bioTier(e.relation)})).filter(x=>x.t);
  const byT={}; ring.forEach(x=>(byT[x.t.id]=byT[x.t.id]||[]).push(x));
  const orbit=[P.caustics(oW,oH,.2),...[78,136,190].map((r,i)=>`<div style="position:absolute;left:${ox-r}px;top:${oy-r}px;width:${r*2}px;height:${r*2}px;border-radius:50%;border:1.5px solid #cfe9e3;opacity:${(.19-i*.03).toFixed(2)};z-index:3"></div>`),
    P.ripple(ox,oy,180,0,5),
    `<div class="bo-me" style="left:${ox-32}px;top:${oy-32}px">${p.photo?`<img src="${p.photo}">`:esc(bioIni(named))}</div>`];
  Object.entries(byT).forEach(([tid,list])=>{ const r=RAD[tid], off=tid==='t0'?-50:tid==='t1'?30:110;
    list.forEach((x,i)=>{ const a=(off+i*360/list.length)*Math.PI/180, px=ox+Math.cos(a)*r, py=oy+Math.sin(a)*r, H=bioH(x.e.title), sz=tid==='t0'?46:tid==='t1'?42:38;
      orbit.push(`<button class="bo-p" onclick="bioPeek('${x.e.id}')" style="left:${(px-sz/2).toFixed(1)}px;top:${(py-sz/2).toFixed(1)}px;width:${sz}px;height:${sz}px;animation:${P.PF.motion?`pf-bob ${(5+i%4).toFixed(1)}s ease-in-out infinite`:'none'}">
        <span class="pad" style="transform:rotate(${Math.round(a*57)}deg)"></span>
        <span class="face" style="background:hsl(${H} 55% 86%);color:hsl(${H} 40% 28%)">${x.e.img?`<img src="${x.e.img}">`:esc(bioIni(x.e.title))}</span>
        <span class="nm">${esc(bioFirstName(x.e.title))}</span></button>`); }); });
  orbit.push(P.glints(oW,oH,6));
  /* career: anything that isn't life */
  const careerCats=cats.filter(c=>side(c)==='career'&&bioIn(c.id).length);
  const career=careerCats.length?careerCats.map(c=>`<div class="pcard" style="padding:20px 22px;display:flex;flex-direction:column;gap:6px">
      <div class="pcard-h"><span style="font:400 20px/1 var(--serif)">${esc(c.name)}</span><button class="tadd" onclick="bioModal(null,'${c.id}')">+ Add</button></div>
      ${bioSort(bioIn(c.id),c.kind).map(e=>{ const H=bioH((e.org||e.title)+c.id);
        return `<div class="bi-row" onclick="bioPeek('${e.id}')"><span class="lg" style="background:hsl(${H} 45% 90%);color:hsl(${H} 40% 32%)">${e.img?`<img src="${e.img}">`:esc(bioIni(e.org||e.title))}</span>
          <div class="b"><span class="t">${esc(e.title)}</span><span class="m">${esc([e.org,bioRange(e)].filter(Boolean).join(' · '))}</span></div></div>`; }).join('')}
    </div>`).join('')
    :`<div class="bi-empty"><span>Nothing here yet. Start with whatever is easiest to remember.</span>
      <div>${cats.filter(c=>side(c)==='career').slice(0,6).map(c=>`<button onclick="bioModal(null,'${c.id}')">+ ${esc(c.name.replace(/ & /,' & ').replace(/^(.)(.*)$/,(m,a,b)=>a+b.toLowerCase()))}</button>`).join('')}</div></div>`;
  /* the rest of life, for sections that aren't people or hobbies */
  const otherLife=cats.filter(c=>side(c)==='life'&&c.id!=='hobby'&&c.kind!=='person'&&bioIn(c.id).length);
  el.innerHTML=`<div class="scr" style="gap:22px">
    <div class="pcard" style="padding:0;overflow:hidden;border-radius:28px">
      <div class="water bi-cover">${cover}<button class="bi-cv" onclick="bioPickImage('cover')">${p.cover?'Change cover':'Change cover'}</button></div>
      <div class="bi-head">
        <button class="bi-av" onclick="bioPickImage('photo')" title="Profile photo">${p.photo?`<img src="${p.photo}">`:esc(bioIni(named))}</button>
        <div style="flex:1;display:flex;flex-direction:column;gap:10px;padding-bottom:4px;min-width:0;align-self:flex-start;margin-top:72px">
          <button class="bi-name" onclick="bioProfileModal('bp-name')">${named?esc(named):'Add your name'}</button>
          <div style="display:flex;gap:8px;flex-wrap:wrap">${chip(p.headline,'Headline','bp-head')}${chip(p.school,'School','bp-school')}${chip(p.location,'Location','bp-loc')}</div>
        </div>
        <div style="display:flex;gap:10px;padding-bottom:4px">${statCats.map(({c,n})=>`<button class="bi-st" onclick="document.getElementById('bio-sec-${c.id}')?.scrollIntoView({behavior:'smooth',block:'center'})"><b>${n}</b><span>${esc(bioShort(c))}</span></button>`).join('')}</div>
      </div>
      ${s.score<100?`<div class="bi-str"><span class="t">Profile strength</span>
        <div class="pbar" style="flex:1;height:7px;background:#e0d8c8"><i style="width:${s.score}%;background:linear-gradient(90deg,#2f7a74,#7fc79a)"></i></div>
        <span class="m">${todo.length?`Add ${todo.length>1?todo.slice(0,-1).join(', ')+' and '+todo[todo.length-1]:todo[0]}${todo.length>1?'':''}`:''}${next?` to reach “${next[1]}”`:''}</span></div>`:''}
    </div>
    <div class="bi-grid">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="bi-sh"><span>Career</span><em>What an application wants to see.</em></div>
        ${career}
        ${hobbyOn?`<div class="pcard" id="bio-sec-hobby" style="padding:22px;display:flex;flex-direction:column;gap:12px">
          <span style="font:400 20px/1 var(--serif)">Hobbies &amp; interests</span>
          <div style="display:flex;gap:8px;flex-wrap:wrap">${hobbies.map(e=>`<button class="bi-hob" onclick="bioPeek('${e.id}')">${esc(e.title)}</button>`).join('')}
            <button class="bp-chip" onclick="bioModal(null,'hobby')">+ Add</button></div>
        </div>`:''}
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div class="bi-sh" style="flex-direction:row;justify-content:space-between;align-items:flex-end"><div style="display:flex;flex-direction:column;gap:6px"><span>Life</span><em>Your people, what you love, what you own.</em></div>
          <div class="row" style="gap:8px"><button class="pbtn sm" onclick="bioExportModal()">Export</button><button class="pbtn sm" onclick="bioCatModal()">Sections</button>
            <button class="pbtn go" style="padding:11px 16px;font-size:14px" onclick="bioModal()">+ Add entry</button></div></div>
        ${personCat?`<div class="bi-ppl" id="bio-sec-people">
          <div class="water bi-orbit"><div class="amb" style="inset:auto;left:50%;top:0;width:${oW}px;height:${oH}px;margin-left:-${oW/2}px">${orbit.join('')}</div>
            <span style="position:absolute;left:18px;top:16px;z-index:8;font:400 18px/1 var(--serif);color:#fbf8f2">People</span>
            <span style="position:absolute;left:18px;bottom:14px;z-index:8;font:400 12px/1 'Outfit',sans-serif;color:#9fc2bb">Closer rings are closer people</span></div>
          <div class="pcard" style="padding:18px;display:flex;flex-direction:column;gap:8px;overflow:auto;max-height:430px">
            ${people.length?people.map(e=>{ const H=bioH(e.title); return `<div class="bi-pp" onclick="bioPeek('${e.id}')">
              <span style="background:hsl(${H} 55% 88%);color:hsl(${H} 40% 28%)">${e.img?`<img src="${e.img}">`:esc(bioIni(e.title))}</span>
              <div><b>${esc(e.title)}</b><em>${esc(relName(e.relation)||e.org||'')}</em></div></div>`; }).join('')
              :'<p class="pcard-s" style="line-height:1.5">No people yet.</p>'}
            <button class="bp-chip" style="align-self:flex-start;margin-top:4px" onclick="bioModal(null,'${personCat.id}')">+ Add a person</button>
          </div>
        </div>`:''}
        ${otherLife.map(c=>`<div class="pcard" id="bio-sec-${c.id}" style="padding:20px 22px;display:flex;flex-direction:column;gap:6px">
          <div class="pcard-h"><span style="font:400 20px/1 var(--serif)">${esc(c.name)}</span><button class="tadd" onclick="bioModal(null,'${c.id}')">+ Add</button></div>
          ${bioIn(c.id).map(e=>`<div class="bi-row" onclick="bioPeek('${e.id}')"><span class="lg" style="background:#f1ebdf">${bioGlyph(e,c)}</span>
            <div class="b"><span class="t">${esc(e.title)}</span><span class="m">${esc(e.org||e.notes||'')}</span></div></div>`).join('')}</div>`).join('')}
      </div>
    </div></div>`;
}


/* One section card. Each layout shows a preview and a LinkedIn-style
   "Show all" footer beyond it; searching or filtering always shows all. */
function bioSection(c,list,narrowed,st){
  const v=bioView(c), career=bioSide(c)==='career';
  const LIM={timeline:4,list:6,tiles:12,gallery:8,chips:40,people:12,orbit:80}[v]||8;
  let units=v==='timeline'?bioGroups(list):list;
  const over=!narrowed&&units.length>LIM, cut=over&&!bioOpen.has(c.id);
  if(cut) units=units.slice(0,LIM);
  const inner = v==='timeline' ? units.map(g=>g.items.length>1?bioXpGroup(g,c):bioXpRow(g.items[0],c)).join('')
    : v==='orbit'   ? bioOrbit(units,c)
    : v==='people'  ? bioPeople(units,c)
    : v==='tiles'   ? bioTiles(units,c)
    : v==='chips'   ? bioChips(units,c)
    : v==='gallery' ? bioGallery(units,c)
    : units.map(e=>bioRow(e,c)).join('');
  return `<section class="card" id="bio-sec-${c.id}" style="${st}">
    <div class="bio-sh">
      <h3 class="bio-sh-t">${career?'':`<span aria-hidden="true">${c.icon}</span>`}${esc(c.name)}
        <span class="bio-sh-n">${list.length}</span></h3>
      <div class="row" style="gap:7px;flex:none">
        ${v==='orbit'||v==='people'?`<div class="seg-wrap bio-vt" role="group" aria-label="Layout">
          <button class="seg ${v==='orbit'?'on':''}" onclick="bioSetView('${c.id}','orbit')">Circle</button>
          <button class="seg ${v==='people'?'on':''}" onclick="bioSetView('${c.id}','people')">Cards</button></div>`:''}
        <button class="bio-plus" onclick="bioModal(null,'${c.id}')" title="Add to ${esc(c.name)}"
          aria-label="Add to ${esc(c.name)}">+</button>
      </div>
    </div>
    ${inner}
    ${over?`<button class="bio-more" onclick="bioToggleOpen('${c.id}')">${
      cut?`Show all ${list.length} →`:'Show less'}</button>`:''}
  </section>`;
}
function bioSetView(id,v){
  const c=bioCat(id); if(!c||bioView(c)===v) return;
  c.view=v; save(); paintBio();
}
function bioToggleOpen(id){
  const was=bioOpen.has(id);
  was?bioOpen.delete(id):bioOpen.add(id);
  paintBio();
  // collapsing can leave you scrolled past the section you were reading
  const el=$('bio-sec-'+id);
  if(was&&el&&el.getBoundingClientRect().top<0) el.scrollIntoView({block:'start'});
}
function bioToggleMore(id){ bioMore.has(id)?bioMore.delete(id):bioMore.add(id); paintBio(); }
function bioJump(id){
  if(bioCatFilter!=='all'||bioQuery.trim()){ bioCatFilter='all'; bioQuery=''; paintBio(); }
  const el=$('bio-sec-'+id); if(!el) return;
  const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({behavior:calm?'auto':'smooth',block:'start'});
  el.classList.remove('bio-flash'); void el.offsetWidth; el.classList.add('bio-flash');
}

/* ── career layouts ── */
/* Roles at the same organization collapse under one logo, the way LinkedIn
   shows two jobs at one company. Order follows the newest role in each. */
function bioGroups(list){
  const out=[], by=new Map();
  list.forEach(e=>{
    const k=String(e.org||'').trim().toLowerCase();
    if(k&&by.has(k)){ by.get(k).items.push(e); return; }
    const g={org:String(e.org||'').trim(),items:[e]};
    out.push(g); if(k) by.set(k,g);
  });
  return out;
}
function bioLogo(e,c,org){
  org=org||e.org;
  if(e.img) return `<div class="bio-logo"><img src="${e.img}" alt="" loading="lazy"></div>`;
  const h=bioHue((org||e.title)+c.id);
  return `<div class="bio-logo" style="background:hsl(${h} 45% 92%);color:hsl(${h} 40% 32%)${org?'':';font-size:21px'}">${
    org?esc(bioInitials(org)):c.icon}</div>`;
}
function bioJBtn(e){
  const k=(bioJ.get(e.id)||[]).length;
  return `<button class="xs ghost bio-jb" onclick="event.stopPropagation();bioJournalHub('${e.id}')"
    title="Journal about ${esc(e.title)}" aria-label="Journal about ${esc(e.title)}">📓${k?` ${k}`:''}</button>`;
}
/* Bullets, notes, tags and link, with "…see more" past three bullets or a
   few lines of notes, as LinkedIn trims a long description. */
function bioBody(e){
  const open=bioMore.has(e.id);
  const bl=(e.bullets||[]).filter(Boolean);
  const longB=bl.length>3, longN=!!e.notes&&(e.notes.length>220||e.notes.split('\n').length>3);
  return `${bl.length?`<ul class="bio-b">${(longB&&!open?bl.slice(0,3):bl).map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}
    ${e.notes?`<div class="bio-n${longN&&!open?' clamp':''}">${esc(e.notes)}</div>`:''}
    ${longB||longN?`<button class="bio-seemore" onclick="event.stopPropagation();bioToggleMore('${e.id}')">${
      open?'Show less':'…see more'}</button>`:''}
    ${(e.tags||[]).length?`<div class="bio-tags">${e.tags.map(t=>`<span class="pill">${esc(t)}</span>`).join('')}</div>`:''}
    ${e.link?bioLinkHtml(e.link):''}`;
}
function bioXpText(e,withOrg){
  const l2=[e.role,withOrg?e.org:''].filter(Boolean).map(esc).join(' · ');
  const r=bioRange(e), s=bioSpan(e);
  const l3=r?esc(r).replace(/Present$/,'<span class="now">Present</span>')+(s?' · '+s:''):'';
  return `<div class="bio-xt">${esc(e.title)}${e.sensitive
      ?` <span class="pill" title="Never leaves this app — kept out of application exports">◆ Private</span>`:''}</div>
    ${l2?`<div class="bio-xo">${l2}</div>`:''}
    ${l3?`<div class="bio-xd">${l3}</div>`:''}
    ${bioBody(e)}`;
}
function bioXpRow(e,c){
  return `<div class="bio-xp" onclick="bioModal('${e.id}')">
    ${bioLogo(e,c)}
    <div class="bio-xb">${bioXpText(e,true)}</div>
    ${bioJBtn(e)}
  </div>`;
}
function bioXpGroup(g,c){
  const items=g.items, lead=items.find(e=>e.img)||items[0];
  // the whole stay: earliest start to latest end, when every date is readable
  const a=items.map(e=>bioYM(e.start,false)), b=items.map(e=>e.current?{n:bioNowYM()}:bioYM(e.end,true));
  const ok=[...a,...b].every(x=>x&&!x.y);
  const tot=ok?Math.max(...b.map(x=>x.n))-Math.min(...a.map(x=>x.n))+1:0;
  return `<div class="bio-xp grp">
    ${bioLogo(lead,c,g.org)}
    <div class="bio-xb">
      <div class="bio-xt">${esc(g.org)}</div>
      <div class="bio-xd">${items.length} roles${tot>0?' · '+bioDur(tot):''}</div>
      <div style="margin-top:4px">${items.map(e=>`<div class="bio-role" onclick="bioModal('${e.id}')">
        <div style="flex:1;min-width:0">${bioXpText(e,false)}</div>${bioJBtn(e)}</div>`).join('')}</div>
    </div>
  </div>`;
}
function bioEduCard(p,I){
  const has=v=>String(v||'').trim();
  if(!has(p.school)&&!has(p.major)&&!has(p.grad)&&!has(p.gpa)) return '';
  const name=has(p.school)?p.school:(has(p.major)?p.major:'Education');
  const h=bioHue(name+'edu');
  const l2=has(p.school)&&has(p.major)?p.major:'';
  const l3=[has(p.grad)&&('Expected '+p.grad),has(p.gpa)&&('GPA '+p.gpa)].filter(Boolean).join(' · ');
  return `<section class="card" style="${I()}">
    <div class="bio-sh"><h3 class="bio-sh-t">Education</h3>
      <button class="bio-plus" onclick="bioProfileModal('bp-school')" title="Edit education" aria-label="Edit education">✎</button></div>
    <div class="bio-xp" onclick="bioProfileModal('bp-school')">
      <div class="bio-logo" style="background:hsl(${h} 45% 92%);color:hsl(${h} 40% 32%)${has(p.school)?'':';font-size:21px'}">${
        has(p.school)?esc(bioInitials(p.school)):'🎓'}</div>
      <div class="bio-xb"><div class="bio-xt">${esc(name)}</div>
        ${l2?`<div class="bio-xo">${esc(l2)}</div>`:''}${l3?`<div class="bio-xd">${esc(l3)}</div>`:''}</div>
    </div>
  </section>`;
}
/* Empty sections of a half, offered as one row of chips rather than a stack
   of empty cards. */
function bioAddRow(side,I){
  const empty=bioCats().filter(c=>bioSide(c)===side&&!bioIn(c.id).length);
  if(!empty.length) return '';
  return `<div class="bio-addrow" style="${I()}"><span>Add to ${side==='career'?'Career':'Life'}</span>${
    empty.map(c=>`<button class="chip" onclick="bioModal(null,'${c.id}')">+ ${c.icon} ${esc(c.name)}</button>`).join('')}</div>`;
}
function bioInvite(side,I){
  const chips=bioCats().filter(c=>bioSide(c)===side).map(c=>
    `<button class="chip" onclick="bioModal(null,'${c.id}')">+ ${c.icon} ${esc(c.name)}</button>`).join('');
  if(side==='career') return `<section class="card" style="${I()}">
    <div class="bio-sh"><h3 class="bio-sh-t">Experience</h3></div>
    <p class="dim" style="font-size:13.5px;margin:0;line-height:1.6">Jobs, projects, clubs, sports, awards
      and skills go here, laid out the way LinkedIn does it. The small stuff counts too.</p>
    <div class="bio-ghost" aria-hidden="true">
      <div class="bio-xp" style="cursor:default">
        <div class="bio-logo" style="background:var(--panel2);color:var(--ghost)">Co</div>
        <div class="bio-xb"><div class="bio-xt">Your role</div><div class="bio-xo">Where you did it</div>
          <div class="bio-xd">Aug 2025 – <span class="now">Present</span> · ${bioSpan({start:'Aug 2025',current:true})}</div>
          <ul class="bio-b"><li>What you did, one line each</li></ul></div>
      </div>
    </div>
    <div class="row wrapf" style="gap:7px">${chips}</div>
  </section>`;
  return `<section class="card" style="${I()}">
    <p class="dim" style="font-size:13.5px;margin:0 0 12px;line-height:1.6">The people you're close to,
      what you do for fun, the shows you love, the things you own.</p>
    <div class="row wrapf" style="gap:7px">${chips}</div>
  </section>`;
}

/* ── life layouts ── */
function bioFace(e,t){
  return `<span class="orb-face" style="--tc:${t.c};background:${t.bg};color:${t.tx}">${
    e.img?`<img src="${e.img}" alt="" loading="lazy">`:(esc(bioInitials(e.title))||'•')}</span>`;
}
/* Rings for the circle: one or more per closeness tier, inner tiers first.
   A tier that won't fit on one ring spills onto the next, shared out by
   circumference so no ring is left with a lonely straggler. Tries names
   under the faces first (big faces, then smaller), then faces only; null
   means even that won't fit and the caller shows cards instead. */
function bioOrbitPlan(tiers,W){
  if(!tiers.length) return null;
  const attempt=(labels,A,Y)=>{
    const gap=labels?A+26:A+10, sp=labels?Math.max(A+34,86):A+8;
    const cap=r=>Math.max(1,Math.floor(2*Math.PI*r/sp));
    let r=Y/2+A/2+(labels?26:14); const rings=[];
    tiers.forEach(({t,list})=>{
      let k=1; const sum=k=>{ let s=0; for(let j=0;j<k;j++) s+=cap(r+j*gap); return s; };
      while(sum(k)<list.length) k++;
      const caps=Array.from({length:k},(_,j)=>cap(r+j*gap)), tot=caps.reduce((x,y)=>x+y,0);
      const cnt=caps.map(cp=>Math.floor(list.length*cp/tot));
      let rest=list.length-cnt.reduce((x,y)=>x+y,0);
      for(let j=k-1;rest>0;j=(j+k-1)%k) if(cnt[j]<caps[j]){ cnt[j]++; rest--; }
      let at=0;
      cnt.forEach((m,j)=>{ if(m) rings.push({t,r:r+j*gap,list:list.slice(at,at+m)}); at+=m; });
      r+=k*gap;
    });
    const last=rings[rings.length-1].r;
    return {rings,A,Y,labels,S:2*(last+A/2+(labels?24:8))};
  };
  for(const pl of [attempt(true,46,70),attempt(true,40,62),attempt(false,46,70),attempt(false,38,58)]){
    const s=Math.min(1,W/pl.S);
    if(s>=(pl.labels?0.93:0.75)) return {labels:pl.labels,A:pl.A*s,Y:pl.Y*s,S:Math.floor(pl.S*s),
      rings:pl.rings.map(x=>({...x,r:x.r*s}))};
  }
  return null;
}
/* Your people, orbiting you. Closer relationships sit on inner rings; each
   ring drifts slowly (alternate rings the other way) and stops while the
   pointer is over the circle so nothing moves out from under a click. The
   drift's phase comes from the clock, so a repaint doesn't jump it back. */
function bioOrbit(list,c){
  const avoid=list.filter(e=>e.relation==='dislike');
  const tiers=BIO_TIERS.map(t=>({t,list:list.filter(e=>bioTier(e.relation)===t)})).filter(x=>x.list.length);
  const avoidRow=avoid.length?`<div class="orb-avoid"><span>${esc(relName('dislike'))}</span>${
    avoid.map(e=>`<button class="chip" onclick="bioPeek('${e.id}')">${esc(e.title)}</button>`).join('')}</div>`:'';
  if(!tiers.length) return avoidRow;
  const plan=bioOrbitPlan(tiers,Math.min(640,bioW-46));
  if(!plan) return bioPeople(list,c,'Not enough room for the circle on a screen this size, so here they are as cards.');
  const {rings,A,Y,S,labels}=plan, p=bioProfile(), now=Date.now()/1000;
  let k=0;
  const ringHtml=rings.map((r,j)=>{
    const d=150+j*45, off=-90+j*47;
    const items=r.list.map((e,i)=>{
      const a=(off+i*360/r.list.length)*Math.PI/180;
      const rel=relName(e.relation)||'Person';
      return `<button class="orb-p" style="left:${(S/2+r.r*Math.cos(a)).toFixed(1)}px;top:${(S/2+r.r*Math.sin(a)).toFixed(1)}px;--pd:${120+45*k++}ms"
        onclick="bioPeek('${e.id}')" title="${esc(e.title)} · ${esc(rel)}" aria-label="${esc(e.title)}, ${esc(rel)}">
        <span class="orb-cr">${bioFace(e,r.t)}${labels?`<span class="orb-lbl">${esc(bioFirstName(e.title))}</span>`:''}</span>
      </button>`;
    }).join('');
    return `<div class="orb-track" style="width:${(2*r.r).toFixed(1)}px;height:${(2*r.r).toFixed(1)}px;--tc:${r.t.c}"></div>
      <div class="orb-ring${j%2?' rev':''}" style="--d:${d}s;--ph:${(-(now%d)).toFixed(2)}s">${items}</div>`;
  }).join('');
  return `<div class="orb${bioAnim?' fresh':''}" style="width:${S}px;height:${S}px;--a:${A.toFixed(1)}px;--y:${Y.toFixed(1)}px">
      ${ringHtml}
      <div class="orb-you" title="You"><span class="orb-face" style="--tc:var(--accent)">${
        p.photo?`<img src="${p.photo}" alt="">`:(esc(bioInitials(p.name))||'You')}</span>${
        labels?'<span class="orb-lbl">You</span>':''}</div>
    </div>
    ${labels?`<div class="orb-legend">${tiers.map(({t,list})=>
      `<span><i style="background:${t.c}"></i>${t.name} · ${list.length}</span>`).join('')}</div>`
      :bioOrbitKey(tiers,c)}
    ${avoidRow}`;
}
/* When the faces are too small to carry names, the names go underneath,
   one line per ring colour — still one tap from each person's card. */
function bioOrbitKey(tiers,c){
  const MAX=10;
  return `<div class="orb-key">${tiers.map(({t,list})=>`<div>
    <span class="orb-key-t"><i style="background:${t.c}"></i>${t.name}</span>
    <span class="orb-key-n">${list.slice(0,MAX).map(e=>
      `<button class="orb-nm" onclick="bioPeek('${e.id}')">${esc(e.title)}</button>`).join('')}${
      list.length>MAX?`<button class="orb-nm more" onclick="bioSetView('${c.id}','people')">+${list.length-MAX} more</button>`:''}</span>
  </div>`).join('')}</div>`;
}
function bioPeople(list,c,note){
  return `${note?`<p class="faint" style="font-size:12px;margin:0 0 10px">${esc(note)}</p>`:''}
  <div class="bio-ppl">${list.map(e=>{
    const t=bioTier(e.relation)||BIO_AVOID, k=(bioJ.get(e.id)||[]).length;
    return `<button class="bio-pc" onclick="bioPeek('${e.id}')">
      ${bioFace(e,t)}
      <span class="nm">${esc(e.title)}</span>
      <span class="rl" style="background:${t.bg};color:${t.tx}">${esc(relName(e.relation)||'Person')}</span>
      ${e.org?`<span class="sb">${esc(e.org)}</span>`:''}
      ${k||e.sensitive?`<span class="sb">${[k?`📓 ${k}`:'',e.sensitive?'◆ Private':''].filter(Boolean).join(' · ')}</span>`:''}
    </button>`; }).join('')}</div>`;
}
function bioTiles(list,c){
  return `<div class="bio-tiles">${list.map(e=>`<button class="bio-tl${e.img?' img':''}"
      style="--h:${bioHue(e.title+c.id)};${e.img?`background-image:url('${e.img}')`:''}"
      onclick="bioPeek('${e.id}')" title="${esc(e.title)}">
      ${e.img?'':`<span class="em" aria-hidden="true">${bioGlyph(e,c)}</span>`}
      <span class="t">${esc(e.title)}${e.sensitive?' ◆':''}</span>
    </button>`).join('')}</div>`;
}
function bioChips(list,c){
  const uses=bioUses();
  return `<div class="bio-chips">${list.map(e=>{
    const u=(uses.get(String(e.title).trim().toLowerCase())||[]).filter(x=>x.id!==e.id);
    return `<button class="bio-chip" onclick="bioPeek('${e.id}')"
      title="${esc(u.length?'Shows up in: '+u.map(x=>x.title).join(', '):e.title)}">
      <i style="background:hsl(${bioHue(e.title)} 55% 62%)"></i>${esc(e.title)}${
      u.length?`<span class="n">${u.length}</span>`:''}${e.sensitive?' ◆':''}</button>`; }).join('')}</div>`;
}
function bioGallery(list,c){
  return `<div class="bio-gal">${list.map(e=>`<button class="bio-gi" style="--h:${bioHue(e.title+c.id)}"
      onclick="bioPeek('${e.id}')">
      <span class="ph">${e.img?`<img src="${e.img}" alt="" loading="lazy">`:bioGlyph(e,c)}</span>
      <span class="tx"><span class="nm">${esc(e.title)}${e.sensitive?' ◆':''}</span>${
        e.org?`<span class="sb">${esc(e.org)}</span>`:''}</span>
    </button>`).join('')}</div>`;
}

/* ── the quick card ── what a tile or face opens: everything about
   the entry, plus what you've written about it in the Journal. Rows already
   show all of that, so they still open straight into the editor. */
function bioPeekArt(e,c){
  const h=bioHue(e.title+c.id);
  if(c.kind==='person') return `<span style="--a:76px;width:76px;height:76px;flex:none;display:block">${
    bioFace(e,bioTier(e.relation)||BIO_AVOID)}</span>`;
  if(e.img) return `<img src="${e.img}" alt="" style="width:76px;height:76px;border-radius:14px;object-fit:cover;flex:none;border:1px solid var(--line2)">`;
  const ini=c.kind==='role'&&e.org;
  return `<span style="width:76px;height:76px;border-radius:16px;flex:none;display:flex;align-items:center;
    justify-content:center;font-size:${ini?24:36}px;font-weight:700;background:hsl(${h} 60% 92%);
    color:hsl(${h} 40% 30%);border:1px solid hsl(${h} 40% 85%)">${ini?esc(bioInitials(e.org)):bioGlyph(e,c)}</span>`;
}
function bioPeek(id){
  const e=bioEntry(id); if(!e) return;
  const c=bioCat(e.cat)||{id:'misc',icon:'📌',kind:'plain',name:'Other'};
  const jr=bioJournalEntries(id), last=jr[0];
  const sub=[];
  if(c.kind==='person'){ if(e.relation) sub.push(relName(e.relation)); if(e.org) sub.push(e.org); }
  else if(c.kind==='role'){ if(e.role) sub.push(e.role); if(e.org) sub.push(e.org); }
  else if(e.org) sub.push(e.org);
  const r=c.kind==='role'?bioRange(e):'', s=c.kind==='role'?bioSpan(e):'';
  const uses=(bioUses().get(String(e.title).trim().toLowerCase())||[]).filter(x=>x.id!==e.id);
  const who=c.kind==='person'?bioFirstName(e.title):(e.title.length<=22?e.title:'it');
  const bl=(e.bullets||[]).filter(Boolean);
  const snip=last?String(last.body||''):'';
  modal(`<div class="bio-pk">
      ${bioPeekArt(e,c)}
      <div style="flex:1;min-width:0">
        <div class="bio-pk-cat">${c.icon} ${esc(c.name)}</div>
        <h2>${esc(e.title)}</h2>
        ${sub.length?`<div style="font-size:13.5px;margin-top:3px">${sub.map(esc).join(' · ')}</div>`:''}
        ${r?`<div class="bio-xd" style="margin-top:2px">${esc(r)}${s?' · '+s:''}</div>`:''}
        ${e.current||e.sensitive?`<div class="row wrapf" style="gap:5px;margin-top:8px">${
          e.current?'<span class="pill" style="color:var(--activetx);border-color:#a9d3b3">Current</span>':''}${
          e.sensitive?'<span class="pill" title="Kept out of application exports">◆ Private</span>':''}</div>`:''}
      </div>
    </div>
    ${bl.length?`<ul class="bio-b" style="margin-top:14px">${bl.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}
    ${e.notes?`<div class="bio-n" style="margin-top:12px;font-size:13.5px;color:var(--tx)">${esc(e.notes)}</div>`:''}
    ${(e.tags||[]).length?`<div class="bio-tags">${e.tags.map(t=>`<span class="pill">${esc(t)}</span>`).join('')}</div>`:''}
    ${e.link?bioLinkHtml(e.link):''}
    ${uses.length?`<div style="margin-top:14px"><span class="lbl" style="margin-bottom:7px">Shows up in</span>
      <div class="row wrapf" style="gap:6px">${uses.map(u=>`<button class="chip" onclick="bioPeek('${u.id}')">${
        (bioCat(u.cat)||{}).icon||''} ${esc(u.title)}</button>`).join('')}</div></div>`:''}
    <div class="bio-pk-j">
      <div class="row sp wrapf" style="gap:6px">
        <span style="font-weight:700;font-size:13.5px">📓 Journal</span>
        <span class="faint" style="font-size:12px">${jr.length
          ?`${jr.length} entr${jr.length===1?'y':'ies'} · last ${esc(dShort(last.date))}`:'Nothing written yet'}</span>
      </div>
      ${last?`<div class="bio-pk-last" role="button" tabindex="0" onclick="openBioJournalEntry('${last.id}')"
        onkeydown="if(event.key==='Enter')openBioJournalEntry('${last.id}')">
        <b>${esc(last.title||'Untitled')}</b><span>${esc(snip.length>150?snip.slice(0,150)+'…':snip)}</span></div>`:''}
      <div class="row wrapf" style="gap:7px;margin-top:10px">
        <button class="sm" onclick="diaryModal(null,'${today()}','${e.id}')">+ Write about ${esc(who)}</button>
        ${jr.length>1?`<button class="sm ghost" onclick="bioJournalHub('${e.id}')">All ${jr.length} entries</button>`:''}
      </div>
    </div>
    <div class="row" style="gap:9px;margin-top:18px">
      <button class="primary" onclick="bioModal('${e.id}')">Edit</button>
      <button class="ghost" onclick="closeModal()">Close</button>
    </div>`);
}

/* The plain row, for the Simple list layout. */
function bioRow(e,c){
  // line 2 is the org/role line, line 3 the dates — the shape a profile row
  // has everywhere, so it reads without anyone explaining it
  let l2='', l3='';
  if(c.kind==='role'){
    l2=[e.role,e.org].filter(Boolean).map(esc).join(' · ');
    l3=esc(bioRange(e));
  } else if(c.kind==='person'){
    l2=esc(relName(e.relation)||'');
    l3=esc(e.org||'');
  } else {
    l2=esc(e.org||'');
  }
  const hue=bioHue(e.title+e.cat);
  const bullets=(e.bullets||[]).filter(Boolean);
  const journalCount=(bioJ.get(e.id)||[]).length;
  /* People are circles, everything else is a rounded square — the same
     distinction every profile app makes between a face and an organisation.
     With no picture, a person falls back to initials and everything else to
     a glyph, both on a tinted ground keyed to the entry, so a list with no
     images at all still reads as designed rather than unfinished. */
  const round=c.kind==='person'?'50%':'10px';
  const tile = e.img
    ? `<img class="bio-tile" src="${e.img}" alt="" loading="lazy"
         style="border-radius:${round};object-fit:cover">`
    : c.kind==='person'
      ? `<div class="bio-tile" style="border-radius:${round};font-size:15px;font-weight:650;
           background:hsl(${hue} 42% 93%);color:hsl(${hue} 38% 34%)">${esc(bioInitials(e.title))||c.icon}</div>`
      : `<div class="bio-tile" style="border-radius:${round};
           background:hsl(${hue} 42% 93%);color:hsl(${hue} 38% 34%)">${bioGlyph(e,c)}</div>`;

  return `<div class="bio-row" onclick="bioModal('${e.id}')">
    ${tile}
    <div style="flex:1;min-width:0">
      <div class="row" style="gap:7px;align-items:baseline;flex-wrap:wrap">
        <span class="bio-t">${esc(e.title)}</span>
        ${e.current?'<span class="pill" style="color:var(--focus);border-color:var(--focus)55">Current</span>':''}
        ${e.sensitive?'<span class="pill" title="Never leaves this app — kept out of application exports">◆ Private</span>':''}
        <button class="xs ghost" onclick="event.stopPropagation();bioJournalHub('${e.id}')"
          title="Journal about ${esc(e.title)}" aria-label="Journal about ${esc(e.title)}">📓${journalCount?` ${journalCount}`:''}</button>
      </div>
      ${l2?`<div class="bio-o">${l2}</div>`:''}
      ${l3?`<div class="bio-d">${l3}</div>`:''}
      ${bullets.length?`<ul class="bio-b">${bullets.slice(0,4).map(b=>`<li>${esc(b)}</li>`).join('')}${
        bullets.length>4?`<li class="faint">+${bullets.length-4} more</li>`:''}</ul>`:''}
      ${e.notes?`<div class="bio-n">${esc(e.notes.length>220?e.notes.slice(0,220)+'…':e.notes)}</div>`:''}
      ${(e.tags||[]).length?`<div class="row wrapf" style="gap:5px;margin-top:9px">${
        e.tags.map(t=>`<span class="pill">${esc(t)}</span>`).join('')}</div>`:''}
      ${e.link?`<div style="margin-top:8px"><a href="${esc(bioHref(e.link))}"
        target="_blank" rel="noopener" onclick="event.stopPropagation()"
        style="font-size:12.5px;color:var(--accent)">${esc(e.link.replace(/^https?:\/\//i,''))}</a></div>`:''}
    </div>
  </div>`;
}
/* The circle is laid out in pixels for the width it was painted at, so a
   real width change (window resize, phone rotation) repaints it. Height-only
   changes are ignored: that's a phone keyboard opening under the search box. */
let bioResizeT=null;
window.addEventListener('resize',()=>{
  clearTimeout(bioResizeT);
  bioResizeT=setTimeout(()=>{
    if(cur!=='bio'||isTyping(document.activeElement)) return;
    const b=$('bio-body'); if(b&&b.clientWidth&&Math.abs(b.clientWidth-bioW)>24) paintBio();
  },180);
});


/* ── Settings → Add-ons: which sections are on ── */
function bioSettingsHtml(){
  const n=id=>bio().entries.filter(e=>e.cat===id).length;
  return `<div class="bio-addon"><span class="bio-addon-t">Sections</span>${bio().cats.map(c=>{ const k=n(c.id);
    return `<button class="stg" onclick="bioToggleCat('${c.id}')"><div><span class="t">${esc(c.icon||'')} ${esc(c.name)}</span>
      <span class="s">${k} ${k===1?'entry':'entries'}${c.off?' · hidden, kept in your data':''}</span></div>${setSwitch(!c.off)}</button>`; }).join('')}</div>`;
}
function bioToggleCat(id){
  const c=bio().cats.find(x=>x.id===id); if(!c) return;
  if(!c.off&&bioCats().length<=1){ toast('Keep one section on, or switch Bio off.'); return; }
  if(c.off) delete c.off; else c.off=true;
  save(); paintSettings();
}
