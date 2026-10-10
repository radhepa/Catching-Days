/* main.js · Catching Days desktop pet
   ─────────────────────────────────────────────────────────────────────────
   One of the pond's toads, living on your desktop. Drag it anywhere; push it
   against the left, right or bottom edge of the screen and it hides there with
   only its head peeking out (drag it back out to see all of it). Tap it to
   chat, tick off today's tasks, look at your day, or run a focus session.

   How it talks to Catching Days without ever fighting it:
     · it READS focus-data.json (and re-reads it whenever the app saves);
     · it never writes that file. What you do on the toad goes into
       desktop-pet-inbox.json next to it, and the app, through
       desktop-pet-link.js, applies each one with its own functions (so a
       ticked task releases its fish, a session is saved with its cycles, the
       way the app always does it) and notes how far it got in
       db.desktopPet.upto;
     · while the app is open it hears about each op at once, over a small
       local event stream this process serves on 127.0.0.1 (the app's page
       connects to it); when the app is closed, the ops wait in the inbox and
       land the next time it opens. The toad shows them on top of the file in
       the meantime, so nothing you tick flickers back.

   Windows: a small transparent window for the toad (clicks fall through
   everywhere except the toad itself), and a second one for the talk box. */
'use strict';
const {app,BrowserWindow,ipcMain,screen,Tray,Menu,nativeImage,shell,dialog}=require('electron');
const path=require('path'), fs=require('fs'), http=require('http'), crypto=require('crypto');
const {spawn}=require('child_process');
const core=require('./core');

app.setAppUserModelId('days.catching.desktop-toad');
/* --profile=<folder> keeps a second toad's settings apart (handy for trying things out) */
{ const p=process.argv.find(x=>x.startsWith('--profile=')); if(p) app.setPath('userData',path.resolve(p.slice(10))); }
if(!app.requestSingleInstanceLock()){ app.quit(); return; }

/* ════════════════════ settings (the toad's own, never the app's data) ════════════════════ */
const TOADS=['hasu','ame','sumi','tabi','hotaru','neri','oto','kuri','mame'];
const SIZES={s:96,m:120,l:150};
const SETTINGS_FILE=()=>path.join(app.getPath('userData'),'settings.json');
const DEFAULTS={appDir:'',toad:'hasu',size:'m',pos:null,peek:null,startAtLogin:false,port:8765,page:'',
  mem:{said:{},recent:[],rung:{}}};
let S=null;
function loadSettings(){
  try{ S=Object.assign({},DEFAULTS,JSON.parse(fs.readFileSync(SETTINGS_FILE(),'utf8'))); }catch(e){ S=Object.assign({},DEFAULTS); }
  S.mem=Object.assign({said:{},recent:[],rung:{}},S.mem||{});
  if(!TOADS.includes(S.toad)) S.toad='hasu';
  if(!SIZES[S.size]) S.size='m';
}
let saveT=null;
function saveSettings(now){
  clearTimeout(saveT);
  const go=()=>{ try{ fs.mkdirSync(path.dirname(SETTINGS_FILE()),{recursive:true}); writeAtomic(SETTINGS_FILE(),JSON.stringify(S,null,2)); }catch(e){} };
  if(now) go(); else saveT=setTimeout(go,400);
}
function writeAtomic(file,text){
  const tmp=file+'.'+process.pid+'.tmp';
  fs.writeFileSync(tmp,text);
  for(let i=0;i<6;i++){
    try{ fs.renameSync(tmp,file); return; }catch(e){
      if(i===5){ try{ fs.writeFileSync(file,text); }catch(_){} try{ fs.unlinkSync(tmp); }catch(_){} return; }
      const until=Date.now()+40; while(Date.now()<until){}       // a cloud-synced folder can hold a file for a moment
    }
  }
}

/* ════════════════════ where Catching Days lives ════════════════════ */
const PAGES=['catching-days.html'];          // or settings.page (--page=<file>) for a renamed copy
const looksLikeApp=d=>{ try{ return !!d&&(fs.existsSync(path.join(d,'focus-data.json'))||PAGES.some(p=>fs.existsSync(path.join(d,p)))); }catch(e){ return false; } };
function argValue(name){ const a=process.argv.find(x=>x.startsWith('--'+name+'=')); return a?a.slice(name.length+3):null; }
async function resolveAppDir(){
  const fromArg=argValue('app-dir');
  const page=argValue('page'); if(page&&/^[\w .-]+\.html$/i.test(page)){ S.page=page; saveSettings(); }
  if(fromArg&&looksLikeApp(fromArg)){ S.appDir=path.resolve(fromArg); saveSettings(); return S.appDir; }
  if(S.appDir&&looksLikeApp(S.appDir)) return S.appDir;
  const parent=path.resolve(__dirname,'..');
  if(looksLikeApp(parent)){ S.appDir=parent; saveSettings(); return parent; }
  const r=await dialog.showOpenDialog({title:'Where is Catching Days?',
    message:'Pick the folder that holds Catching Days (the one with focus-data.json).',properties:['openDirectory']});
  if(r.canceled||!r.filePaths[0]||!looksLikeApp(r.filePaths[0])){
    dialog.showErrorBox('Catching Days toad','That folder doesn’t look like Catching Days. Start the toad again and pick the folder with focus-data.json in it.');
    return null;
  }
  S.appDir=r.filePaths[0]; saveSettings(); return S.appDir;
}
const appPage=()=>S.page&&fs.existsSync(path.join(S.appDir,S.page))?S.page:(PAGES.find(p=>fs.existsSync(path.join(S.appDir,p)))||PAGES[0]);
const DATA=()=>path.join(S.appDir,'focus-data.json');
const INBOX=()=>path.join(S.appDir,'desktop-pet-inbox.json');

/* ════════════════════ the data: read focus-data.json, keep our ops ════════════════════ */
let DB=null, dbMtime=0, OPS=[], lastT=0, VIEW=null;
function readDb(retry){
  let txt;
  try{ const st=fs.statSync(DATA()); txt=fs.readFileSync(DATA(),'utf8'); dbMtime=st.mtimeMs; }catch(e){ return; }
  try{ const d=JSON.parse(txt); if(d&&Array.isArray(d.assignments)){ DB=d; pruneOps(); refresh(); } }
  catch(e){ if(!retry) setTimeout(()=>readDb(true),180); }     // caught mid-write: the server writes in place
}
function readInbox(){
  try{ const o=JSON.parse(fs.readFileSync(INBOX(),'utf8')); OPS=Array.isArray(o.ops)?o.ops.filter(x=>x&&x.id&&x.t):[]; }catch(e){ OPS=[]; }
  OPS.forEach(o=>{ if(o.t>lastT) lastT=o.t; });
}
let running=true;
function writeInbox(){
  const body={v:1, note:'Written by the Catching Days desktop toad. The app applies these and records how far it got in focus-data.json (desktopPet.upto).',
    running, port:PORT, pid:process.pid, at:Date.now(), ops:OPS};
  try{ writeAtomic(INBOX(),JSON.stringify(body,null,1)); }catch(e){}
}
/* an op leaves the inbox only once focus-data.json itself shows the app took it in */
function pruneOps(){
  const u=core.uptoOf(DB), before=OPS.length;
  OPS=OPS.filter(o=>o.t>u);
  if(OPS.length!==before) writeInbox();
}
let watcher=null, pollT=null, debT=null;
function watchData(){
  try{ watcher=fs.watch(S.appDir,(ev,name)=>{ if(name==='focus-data.json'){ clearTimeout(debT); debT=setTimeout(()=>readDb(),140); } }); }catch(e){}
  /* fs.watch can miss things (sleep, network drives); a cheap mtime check backs it up */
  pollT=setInterval(()=>{ try{ if(fs.statSync(DATA()).mtimeMs!==dbMtime) readDb(); }catch(e){} },4000);
}
function addOp(o){
  const t=Math.max(Date.now(),lastT+1); lastT=t;
  const op=Object.assign({id:crypto.randomBytes(6).toString('hex'),t},o);
  OPS.push(op); writeInbox(); refresh(); sse('ops',{ops:core.pendingOps(DB,OPS)});
  return op;
}

/* ════════════════════ the view both windows draw ════════════════════ */
function refresh(){
  if(!DB) return;
  VIEW=core.buildView(DB,OPS,Date.now());
  VIEW.appOpen=clients.size>0;
  VIEW.appVisible=[...clients].some(c=>c.visible);
  VIEW.toad=S.toad; VIEW.size=S.size;
  send(toadWin,'view',VIEW); send(panelWin,'view',VIEW);
  bellCheck();
}
/* the clock moves on its own: today's list and the timeline roll over at midnight,
   "now" on the timeline moves, so redraw each minute even if nothing was saved */
setInterval(()=>{ if(DB) refresh(); },60000);
function send(win,ch,data){ try{ if(win&&!win.isDestroyed()) win.webContents.send(ch,data); }catch(e){} }

/* ════════════════════ the little event stream the app listens to ════════════════════ */
let PORT=0;
const clients=new Set();
function sse(event,data){
  const msg=`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  clients.forEach(c=>{ try{ c.res.write(msg); }catch(e){} });
}
function startServer(){
  return new Promise(resolve=>{
    const srv=http.createServer((req,res)=>{
      const origin=req.headers.origin||'';
      const ok=/^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/.test(origin);
      if(origin&&!ok){ res.writeHead(403); res.end(); return; }
      const cors=ok?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{};
      const u=new URL(req.url,'http://127.0.0.1');
      if(req.method==='OPTIONS'){ res.writeHead(204,Object.assign({'Access-Control-Allow-Methods':'GET, POST','Access-Control-Allow-Headers':'Content-Type'},cors)); res.end(); return; }
      if(req.method==='GET'&&u.pathname==='/events'){
        res.writeHead(200,Object.assign({'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive'},cors));
        res.write('retry: 15000\n\n');
        const c={res,id:String(u.searchParams.get('id')||'').slice(0,40),visible:false,cur:'',at:Date.now()};
        clients.add(c);
        res.write(`event: ops\ndata: ${JSON.stringify({ops:DB?core.pendingOps(DB,OPS):OPS})}\n\n`);
        req.on('close',()=>{ clients.delete(c); refresh(); });
        refresh();
        return;
      }
      if(req.method==='POST'&&u.pathname==='/presence'){
        let body=''; req.on('data',d=>{ body+=d; if(body.length>4096) req.destroy(); });
        req.on('end',()=>{
          try{ const o=JSON.parse(body||'{}'), id=String(u.searchParams.get('id')||'');
            clients.forEach(x=>{ if(x.id&&x.id===id){ x.visible=!!o.visible; x.cur=String(o.cur||''); } });
          }catch(e){}
          res.writeHead(204,cors); res.end(); refresh();
        });
        return;
      }
      if(u.pathname==='/ping'){ res.writeHead(200,Object.assign({'Content-Type':'application/json'},cors)); res.end(JSON.stringify({ok:true,toad:S.toad})); return; }
      res.writeHead(404,cors); res.end();
    });
    let port=8771;
    const tryListen=()=>{ srv.once('error',()=>{ port++; if(port>8790){ resolve(0); return; } tryListen(); }); srv.listen(port,'127.0.0.1',()=>resolve(port)); };
    tryListen();
    setInterval(()=>clients.forEach(c=>{ try{ c.res.write(': still here\n\n'); }catch(e){} }),25000);
  });
}

/* ════════════════════ the toad's window: size, place, peeking ════════════════════
   The window is a little bigger than the toad (room for a hop and the timer
   pill under it). Its position on screen is "virtual": while you push the toad
   past the left, right or bottom edge, the window stays at the edge and the
   distance you've pushed becomes how far it has slipped behind it (p, 0..1). */
const PILL=30;
function geo(){
  const s=SIZES[S.size]||120;
  return {S:s, W:Math.round(s*1.6), H:Math.round(s*1.5)+PILL, PILL, travel:Math.round(s*.8)};
}
let toadWin=null, panelWin=null, tray=null;
let virt={x:0,y:0}, peek={edge:null,p:0};
const workAreaAt=(x,y)=>screen.getDisplayNearestPoint({x:Math.round(x),y:Math.round(y)}).workArea;
function layout(vx,vy){
  const g=geo(), wa=workAreaAt(vx+g.W/2,vy+g.H/2);
  const right=wa.x+wa.width, bottom=wa.y+wa.height;
  const x=Math.min(Math.max(vx,wa.x),right-g.W), y=Math.min(Math.max(vy,wa.y),bottom-g.H);
  const o={r:vx+g.W-right, l:wa.x-vx, b:vy+g.H-bottom};
  let edge=null, best=0;
  Object.keys(o).forEach(k=>{ if(o[k]>best){ best=o[k]; edge=k; } });
  return {x:Math.round(x),y:Math.round(y),edge,p:edge?Math.min(1,best/g.travel):0,wa};
}
/* the virtual spot that gives a full peek on an edge, from where the window sits */
function virtFor(x,y,edge){
  const g=geo();
  return edge==='r'?{x:x+g.travel,y}:edge==='l'?{x:x-g.travel,y}:edge==='b'?{x,y:y+g.travel}:{x,y};
}
function place(vx,vy,animate){
  const L=layout(vx,vy); virt={x:vx,y:vy};
  const [cx,cy]=toadWin.getPosition();
  if(cx!==L.x||cy!==L.y) toadWin.setPosition(L.x,L.y);
  if(L.edge!==peek.edge||Math.abs(L.p-peek.p)>.004||animate){
    peek={edge:L.edge,p:L.p}; send(toadWin,'peek',Object.assign({animate:!!animate},peek));
  }
  return L;
}
function defaultSpot(){
  const g=geo(), wa=screen.getPrimaryDisplay().workArea;
  return {x:wa.x+wa.width-g.W-24, y:wa.y+wa.height-g.H-8};
}
function restorePlace(){
  const g=geo();
  let p=S.pos&&isFinite(S.pos.x)&&isFinite(S.pos.y)?{x:S.pos.x,y:S.pos.y}:defaultSpot();
  /* a monitor that's gone: start again in the corner */
  const wa=workAreaAt(p.x+g.W/2,p.y+g.H/2);
  if(p.x+g.W<wa.x||p.x>wa.x+wa.width||p.y+g.H<wa.y||p.y>wa.y+wa.height) p=defaultSpot();
  const edge=S.peek&&S.peek.edge||null;
  const L=layout(p.x,p.y);
  const v=virtFor(L.x,L.y,edge);
  place(v.x,v.y,false);
}
function remember(){
  const [x,y]=toadWin.getPosition();
  S.pos={x,y}; S.peek=peek.edge&&peek.p>.5?{edge:peek.edge}:null; saveSettings();
}

/* ── dragging: the cursor is read here, sixty-odd times a second, so a fast
   flick never leaves the toad behind ── */
let drag=null;
/* --test: a cursor the test harness can move (global.__toadTest), instead of the real one */
const TEST=process.argv.includes('--test');
let fakeCursor=null;
const cursor=()=>TEST&&fakeCursor?fakeCursor:screen.getCursorScreenPoint();
function dragStart(){
  closePanel();
  const c=cursor();
  drag={ox:c.x-virt.x, oy:c.y-virt.y, lastX:c.x, t:setInterval(dragTick,8)};
  send(toadWin,'drag',{on:true,dx:0});
}
function dragTick(){
  if(!drag) return;
  const c=cursor();
  place(c.x-drag.ox,c.y-drag.oy,false);
  const dx=c.x-drag.lastX; drag.lastX=c.x;
  send(toadWin,'drag',{on:true,dx});
}
function dragEnd(){
  if(!drag) return;
  clearInterval(drag.t); dragTick(); drag=null;
  send(toadWin,'drag',{on:false,dx:0});
  /* let go: a toad that's mostly behind the edge tucks in; otherwise it hops back out */
  const [x,y]=toadWin.getPosition();
  if(peek.edge&&peek.p>=.35){ const v=virtFor(x,y,peek.edge); place(v.x,v.y,true); }
  else { const L=layout(virt.x,virt.y); place(L.x,L.y,true); }
  remember();
}

function createToad(){
  const g=geo();
  toadWin=new BrowserWindow({width:g.W,height:g.H,frame:false,transparent:true,resizable:false,movable:false,
    alwaysOnTop:true,skipTaskbar:true,focusable:false,hasShadow:false,fullscreenable:false,maximizable:false,minimizable:false,
    show:false,backgroundColor:'#00000000',title:'Catching Days toad',
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,sandbox:true,nodeIntegration:false,backgroundThrottling:false,autoplayPolicy:'no-user-gesture-required'}});
  toadWin.setIgnoreMouseEvents(true,{forward:true});
  toadWin.loadFile(path.join(__dirname,'pet.html'));
  toadWin.once('ready-to-show',()=>{ restorePlace(); toadWin.showInactive(); });
  toadWin.webContents.on('render-process-gone',()=>{ try{ toadWin.reload(); }catch(e){} });
}
function resizeToad(){
  const g=geo();
  const [x,y]=toadWin.getPosition(), [w,h]=toadWin.getSize();
  /* keep the toad's feet where they were */
  toadWin.setResizable(true); toadWin.setSize(g.W,g.H); toadWin.setResizable(false);
  const nx=x+Math.round((w-g.W)/2), ny=y+(h-g.H);
  const v=virtFor(nx,ny,peek.edge&&peek.p>.5?peek.edge:null);
  place(v.x,v.y,false);
  send(toadWin,'geo',geo()); remember();
}

/* ════════════════════ the talk box ════════════════════ */
const PANEL_W=388;   // a 340px card with 24px round it for its shadow
let panelOpen=false, panelMode='chat', panelH=300, panelActive=false;
function createPanel(){
  panelWin=new BrowserWindow({width:PANEL_W,height:panelH,frame:false,transparent:true,resizable:false,movable:false,
    alwaysOnTop:true,skipTaskbar:true,hasShadow:false,fullscreenable:false,maximizable:false,minimizable:false,show:false,
    backgroundColor:'#00000000',title:'Catching Days toad · talk',
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,sandbox:true,nodeIntegration:false,backgroundThrottling:false,autoplayPolicy:'no-user-gesture-required'}});
  panelWin.loadFile(path.join(__dirname,'panel.html'));
  panelWin.on('blur',()=>{ if(panelOpen&&panelActive&&!drag) closePanel(); });
  panelWin.on('focus',()=>{ panelActive=true; });
}
/* where the visible part of the toad is, in screen pixels */
function toadRect(){
  const g=geo(), [x,y]=toadWin.getPosition(), s=g.S;
  if(peek.edge==='r'&&peek.p>.5) return {x:x+g.W-s*.6,y:y+g.H/2-s*.45,w:s*.6,h:s*.8};
  if(peek.edge==='l'&&peek.p>.5) return {x,y:y+g.H/2-s*.45,w:s*.6,h:s*.8};
  if(peek.edge==='b'&&peek.p>.5) return {x:x+g.W/2-s*.5,y:y+g.H-s*.45,w:s,h:s*.45};
  return {x:x+(g.W-s)/2,y:y+g.H-g.PILL-s,w:s,h:s+g.PILL};
}
function placePanel(){
  const r=toadRect(), wa=workAreaAt(r.x+r.w/2,r.y+r.h/2);
  const right=wa.x+wa.width, bottom=wa.y+wa.height, h=Math.min(panelH,wa.height-16), gap=-6;
  let x,y;
  const roomL=r.x-wa.x, roomR=right-(r.x+r.w);
  if(peek.edge==='b'&&peek.p>.5){
    x=r.x+r.w/2-PANEL_W/2; y=r.y-h-gap;
  } else if(roomL>=PANEL_W||roomL>=roomR){
    x=r.x-PANEL_W-gap; y=r.y+r.h-h+8;
  } else {
    x=r.x+r.w+gap; y=r.y+r.h-h+8;
  }
  x=Math.round(Math.min(Math.max(x,wa.x+4),right-PANEL_W-4));
  y=Math.round(Math.min(Math.max(y,wa.y+4),bottom-h-4));
  const side=x+PANEL_W/2<r.x+r.w/2?'left':'right';
  panelWin.setBounds({x,y,width:PANEL_W,height:h});
  send(panelWin,'side',{side,toadY:Math.round(r.y+r.h/2-y)});
}
function openPanel(mode,opts){
  opts=opts||{};
  if(!panelWin||!VIEW) return;
  panelMode=mode||'chat';
  send(panelWin,'open',{mode:panelMode,peeking:!!(peek.edge&&peek.p>.5),reason:opts.reason||'tap'});
  placePanel();
  panelOpen=true;
  if(opts.quiet){ panelActive=false; panelWin.showInactive(); }
  else { panelActive=true; panelWin.show(); panelWin.focus(); }
  panelWin.setAlwaysOnTop(true,'pop-up-menu');
  send(toadWin,'panel',{open:true});
}
function closePanel(){
  if(!panelOpen) return;
  panelOpen=false; panelActive=false;
  try{ panelWin.hide(); }catch(e){}
  send(panelWin,'closed',{});
  send(toadWin,'panel',{open:false});
}

/* ════════════════════ the bell: focus time up, break over ════════════════════ */
function bellCheck(){
  const s=VIEW&&VIEW.session;
  if(!s||s.paused) return;
  const rem=s.target-core.elapsed(s,Date.now());
  if(rem>0) return;
  let key=null, kind=null;
  if(s.phase==='focus'){ key=s.id+'|f'+(s.cycles.length+1); kind='bell'; }
  else if(s.phase==='break'){ key=s.id+'|b'+s.cycles.length; kind='breakOver'; }
  if(!key||S.mem.rung[key]) return;
  S.mem.rung[key]=Date.now();
  /* keep only today's few */
  const cut=Date.now()-2*core.DAY; Object.keys(S.mem.rung).forEach(k=>{ if(S.mem.rung[k]<cut) delete S.mem.rung[k]; });
  saveSettings();
  /* the app's own Focus screen rings by itself when you're looking at it */
  const appRinging=[...clients].some(c=>c.visible&&c.cur==='run');
  send(toadWin,'react',{kind,sound:!appRinging&&VIEW.settings.sound});
  if(appRinging) return;
  if(panelOpen&&panelActive) send(panelWin,'open',{mode:kind==='bell'?'rate':'break-over',reason:kind});
  else openPanel(kind==='bell'?'rate':'break-over',{quiet:true,reason:kind});
}
setInterval(()=>{ if(VIEW&&VIEW.session) bellCheck(); },1000);

/* ════════════════════ opening the app itself ════════════════════ */
function appUrl(){ return `http://127.0.0.1:${S.port||8765}/${encodeURI(appPage())}`; }
function serverUp(){
  return new Promise(res=>{
    const r=http.get({host:'127.0.0.1',port:S.port||8765,path:'/',timeout:1200},x=>{ x.resume(); res(true); });
    r.on('error',()=>res(false)); r.on('timeout',()=>{ r.destroy(); res(false); });
  });
}
async function openApp(){
  if(await serverUp()){ shell.openExternal(appUrl()); return; }
  const bat=fs.readdirSync(S.appDir).find(f=>/^start catching days\.bat$/i.test(f));
  if(bat){ spawn('cmd.exe',['/c','start','""','/d',S.appDir,path.join(S.appDir,bat)],{detached:true,stdio:'ignore',windowsHide:true}).unref(); }
  else shell.openPath(path.join(S.appDir,appPage()));
}

/* ════════════════════ menus: right-click the toad, or the tray ════════════════════ */
const NAMES={hasu:'Hasu',ame:'Ame',sumi:'Sumi',tabi:'Tabi',hotaru:'Hotaru',neri:'Neri',oto:'Oto',kuri:'Kuri',mame:'Mame'};
function setToad(name){
  if(!TOADS.includes(name)||name===S.toad) return;
  S.toad=name; saveSettings(); refresh();
  send(toadWin,'toad',{name}); send(panelWin,'toad',{name});
  rebuildTray();
}
function setSize(k){ if(!SIZES[k]||k===S.size) return; S.size=k; saveSettings(); resizeToad(); refresh(); rebuildTray(); }
/* the toad starts again the way it was started this time (its folder, its settings folder, where the app is) */
const keepArgs=()=>process.argv.filter(a=>/^--(profile|app-dir|page)=/.test(a));
const launchArgs=()=>(app.isPackaged?[]:[app.getAppPath()]).concat(keepArgs());
function setLogin(on){
  S.startAtLogin=!!on; saveSettings();
  try{ app.setLoginItemSettings({openAtLogin:!!on,path:process.execPath,args:launchArgs()}); }catch(e){}
  rebuildTray();
}
/* --make-shortcut: a "Catching Days Toad" entry in the Start menu */
function makeShortcut(){
  const icon=[path.join(S.appDir,'catching-days.ico'),path.join(__dirname,'assets','toad.ico')].find(f=>fs.existsSync(f));
  const q=a=>/\s/.test(a)?'"'+a+'"':a;
  try{
    shell.writeShortcutLink(path.join(app.getPath('appData'),'Microsoft','Windows','Start Menu','Programs','Catching Days Toad.lnk'),
      {target:process.execPath,args:launchArgs().map(q).join(' '),cwd:__dirname,description:'A toad from Catching Days, on your desktop',
       icon:icon||process.execPath,iconIndex:0});
  }catch(e){}
}
function menuTemplate(){
  return [
    {label:'Talk to '+NAMES[S.toad],click:()=>openPanel('chat')},
    {label:'Today’s tasks',click:()=>openPanel('tasks')},
    {label:'My day',click:()=>openPanel('day')},
    {label:'Focus',click:()=>openPanel('focus')},
    {type:'separator'},
    {label:'Choose a toad',submenu:TOADS.map(t=>({label:NAMES[t],type:'radio',checked:S.toad===t,click:()=>setToad(t)}))},
    {label:'Size',submenu:[['s','Small'],['m','Medium'],['l','Large']].map(([k,l])=>({label:l,type:'radio',checked:S.size===k,click:()=>setSize(k)}))},
    {label:'Bring the toad back',click:()=>{ const d=defaultSpot(); place(d.x,d.y,true); remember(); toadWin.showInactive(); }},
    {type:'separator'},
    {label:'Open Catching Days',click:openApp},
    {label:'Start with Windows',type:'checkbox',checked:!!S.startAtLogin,click:m=>setLogin(m.checked)},
    {type:'separator'},
    {label:'Quit the toad',click:()=>app.quit()}
  ];
}
function rebuildTray(){ if(tray) tray.setContextMenu(Menu.buildFromTemplate(menuTemplate())); }
function trayIcon(){
  const own=path.join(__dirname,'assets','tray.png');
  const img=nativeImage.createFromPath(fs.existsSync(own)?own:path.join(S.appDir,'icons','icon-192.png'));
  return img.isEmpty()?img:img.resize({width:16,height:16});
}

/* ════════════════════ messages from the two windows ════════════════════ */
ipcMain.handle('init',e=>{
  const who=e.sender===toadWin?.webContents?'toad':'panel';
  return {who, view:VIEW, toad:S.toad, size:S.size, geo:geo(), peek, mem:S.mem, login:!!S.startAtLogin,
    artBase:require('url').pathToFileURL(S.appDir+path.sep).href, names:NAMES, toads:TOADS};
});
ipcMain.on('ignore',(e,on)=>{ if(toadWin&&!drag) toadWin.setIgnoreMouseEvents(!!on,{forward:true}); });
ipcMain.on('drag-start',()=>dragStart());
ipcMain.on('drag-end',()=>dragEnd());
ipcMain.on('toad-click',()=>{ if(panelOpen) closePanel(); else openPanel('chat'); });
ipcMain.on('toad-menu',()=>{ Menu.buildFromTemplate(menuTemplate()).popup({window:toadWin}); });
ipcMain.on('panel-open',(e,mode)=>openPanel(mode));
ipcMain.on('panel-close',()=>closePanel());
ipcMain.on('panel-height',(e,h)=>{ h=Math.max(120,Math.min(900,Math.round(+h||0))); if(h!==panelH){ panelH=h; if(panelOpen) placePanel(); } });
ipcMain.on('panel-pin',()=>{ panelActive=true; });
ipcMain.on('react',(e,r)=>send(toadWin,'react',r));
ipcMain.on('set-toad',(e,n)=>setToad(n));
ipcMain.on('set-size',(e,k)=>setSize(k));
ipcMain.on('set-login',(e,on)=>setLogin(on));
ipcMain.on('open-app',()=>openApp());
ipcMain.on('quit',()=>app.quit());
ipcMain.on('tray-icon',(e,url)=>{
  try{ if(tray&&typeof url==='string'&&url.startsWith('data:image/png;base64,')){ const img=nativeImage.createFromDataURL(url); if(!img.isEmpty()) tray.setImage(img.resize({width:16,height:16,quality:'best'})); } }catch(err){}
});
ipcMain.on('mem',(e,m)=>{ if(m&&typeof m==='object'){ S.mem=Object.assign(S.mem,m); saveSettings(); } });
/* ops: everything that changes your data goes through here, checked against what's showing */
ipcMain.handle('op',(e,o)=>{
  if(!o||!VIEW) return {ok:false};
  const s=VIEW.session;
  if(o.k==='task'){
    if(typeof o.aid!=='string') return {ok:false};
    const a=(DB.assignments||[]).find(x=>x.id===o.aid); if(!a||a.ann) return {ok:false};
    return {ok:true,op:addOp({k:'task',aid:o.aid,on:!!o.on})};
  }
  if(o.k!=='focus') return {ok:false};
  if(o.act==='start'){
    if(s) return {ok:false,why:'running'};
    const f=Math.max(5,Math.min(180,Math.round(+o.f||VIEW.settings.focus))), b=Math.max(1,Math.min(90,Math.round(+o.b||VIEW.settings.brk)));
    const ids=(Array.isArray(o.ids)?o.ids:[]).filter(id=>typeof id==='string').slice(0,12);
    return {ok:true,op:addOp({k:'focus',act:'start',sid:Date.now().toString(36)+crypto.randomBytes(3).toString('hex'),f,b,ids,name:String(o.name||'').slice(0,80)})};
  }
  if(!s) return {ok:false,why:'none'};
  if(o.act==='pause'||o.act==='resume') return {ok:true,op:addOp({k:'focus',act:o.act,sid:s.id})};
  if(o.act==='rate') return {ok:true,op:addOp({k:'focus',act:'rate',sid:s.id,n:s.phase==='rating'&&s.pending?s.pending.n:s.cycles.length+1,
    r:o.r>=1&&o.r<=5?Math.round(o.r):null,j:String(o.j||'').slice(0,2000)})};
  if(o.act==='break-end') return {ok:true,op:addOp({k:'focus',act:'break-end',sid:s.id,n:s.cycles.length})};
  if(o.act==='finish'){
    /* a block still running is rated first, so it's never lost */
    if(o.r!=null&&(s.phase==='focus'||s.phase==='rating')) addOp({k:'focus',act:'rate',sid:s.id,n:s.phase==='rating'&&s.pending?s.pending.n:s.cycles.length+1,r:o.r>=1&&o.r<=5?Math.round(o.r):null,j:''});
    return {ok:true,op:addOp({k:'focus',act:'finish',sid:s.id,name:String(o.name||'').slice(0,80),j:String(o.j||'').slice(0,4000)})};
  }
  return {ok:false};
});

if(TEST) global.__toadTest={dragStart,dragEnd,dragTick,setCursor:(x,y)=>{ fakeCursor={x,y}; },
  state:()=>({virt,peek,pos:toadWin.getPosition(),size:toadWin.getSize(),geo:geo(),panelOpen,panelMode,ops:OPS,view:VIEW,clients:clients.size}),
  openPanel,closePanel,setToad,setSize};

/* ════════════════════ start up, shut down ════════════════════ */
app.on('second-instance',()=>{ if(toadWin){ toadWin.showInactive(); openPanel('chat'); } });
app.whenReady().then(async()=>{
  loadSettings();
  if(process.argv.includes('--start-at-login')) S.startAtLogin=true;
  const dir=await resolveAppDir(); if(!dir){ app.quit(); return; }
  PORT=await startServer();
  readInbox(); running=true; writeInbox();
  readDb(); watchData();
  createToad(); createPanel();
  tray=new Tray(trayIcon()); tray.setToolTip('Catching Days toad'); rebuildTray();
  tray.on('click',()=>{ toadWin.showInactive(); openPanel('chat'); });
  if(S.startAtLogin) setLogin(true);
  if(process.argv.includes('--make-shortcut')) makeShortcut();
  screen.on('display-metrics-changed',()=>place(virt.x,virt.y,false));
  screen.on('display-removed',()=>restorePlace());
});
app.on('before-quit',()=>{ running=false; try{ writeInbox(); }catch(e){} saveSettings(true); });
app.on('window-all-closed',()=>app.quit());
