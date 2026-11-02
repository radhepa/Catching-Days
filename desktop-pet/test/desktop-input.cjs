'use strict';
// Real Electron windows, isolated settings/data, and the installed toad artwork.
const {app,BrowserWindow,screen}=require('electron');
const fs=require('fs'), path=require('path'), assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const temp=fs.mkdtempSync(path.join(require('os').tmpdir(),'toad-input-'));
const data=path.join(temp,'data'); fs.mkdirSync(data);
const artArg=process.argv.find(a=>a.startsWith('--art-dir='));
if(!artArg) throw new Error('Pass --art-dir=<Catching Days folder>');
const art=artArg.slice(10);
for(const f of ['toad-art.js','toads-design/toad-art-cast.js','toad-companions.js','toad-expressions.js']){
  const dest=path.join(data,f); fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.copyFileSync(path.join(art,f),dest);
}
fs.writeFileSync(path.join(data,'focus-data.json'),JSON.stringify({assignments:[],settings:{sound:false}}));
process.argv.push('--test','--profile='+path.join(temp,'profile'),'--app-dir='+data);
require('../main');
const log=s=>{ console.log(s); fs.appendFileSync(path.join(root,'test','last-run.log'),s+'\n'); };
fs.writeFileSync(path.join(root,'test','last-run.log'),'');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn,label,ms=10000){ const end=Date.now()+ms; while(Date.now()<end){ if(await fn()) return; await sleep(40); } throw new Error('Timed out: '+label); }
app.whenReady().then(async()=>{
  try{
    await until(()=>BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Catching Days toad'),'pet window');
    const pet=BrowserWindow.getAllWindows().find(w=>w.getTitle()==='Catching Days toad');
    const js=code=>pet.webContents.executeJavaScript(code);
    await until(()=>js('!!window.__pace && !!document.querySelector("#art svg")'),'art');
    const api=global.__toadTest;
    const otherApp=new BrowserWindow({width:400,height:300,show:false});
    await otherApp.loadURL('data:text/html,<title>Window stacking test</title><input autofocus>');
    otherApp.show(); otherApp.focus();
    await until(()=>otherApp.isFocused(),'other window focus');
    pet.setAlwaysOnTop(false);
    await sleep(400);
    assert.equal(pet.isAlwaysOnTop(),true,'pet restores its topmost band');
    assert.equal(otherApp.isFocused(),true,'raising the pet preserves typing focus');
    api.keepToadOnTop();
    assert.equal(otherApp.isFocused(),true,'raising an already-topmost pet preserves focus');
    otherApp.destroy();
    log('PASS topmost recovery without stealing focus');
    const errors=[];
    pet.webContents.on('console-message',(_e,_level,message)=>{ if(/Uncaught/.test(message)) errors.push(message); });
    const wa=screen.getPrimaryDisplay().workArea;
    const home=()=>api.place(wa.x+200,wa.y+180,false);
    async function hit(){
      return js(`(()=>{ for(let y=1;y<innerHeight;y+=3) for(let x=1;x<innerWidth;x+=3){
        const el=document.elementFromPoint(x,y); if(el?.closest('#art')) return {x,y};
      } throw Error('No draggable art'); })()`);
    }
    async function at(p){ const b=pet.getBounds(); api.setCursor(b.x+p.x,b.y+p.y); await sleep(130); }
    async function pointer(type,p,extra={}){
      const b=pet.getBounds();
      await js(`document.getElementById('stage').dispatchEvent(new PointerEvent(${JSON.stringify(type)},${JSON.stringify({bubbles:true,pointerId:1,button:0,buttons:1,clientX:p.x,clientY:p.y,screenX:b.x+p.x,screenY:b.y+p.y,...extra})}))`);
      await sleep(30);
    }
    async function dragCheck(label){
      const p=await hit(); await at(p);
      assert.equal(api.state().ignoreNow,false,label+' hit-test');
      await pointer('pointerdown',p);
      // Forwarded mouse moves must not turn click-through back on mid-press.
      await js(`document.dispatchEvent(new MouseEvent('mousemove',{clientX:0,clientY:0}))`);
      await sleep(30);
      assert.equal(api.state().ignoreNow,false,label+' press stays interactive');
      await pointer('pointermove',{x:p.x+8,y:p.y+8});
      assert.equal(api.state().dragging,true,label+' starts drag');
      const before={...api.state().virt}; const b=pet.getBounds();
      api.setCursor(b.x+p.x+35,b.y+p.y-25); api.dragTick();
      assert.notDeepEqual(api.state().virt,before,label+' moves window');
      await pointer('pointerup',p,{buttons:0});
      assert.equal(api.state().dragging,false,label+' stops drag');
      assert.equal((await js('window.__pace()')).held,false,label+' releases pose');
    }
    home(); await sleep(150);
    // Use the production window configuration; changing focusability here used
    // to hide a Windows capture failure after returning from the focus stage.
    assert.equal(pet.isFocusable(),true,'production pet can activate for pointer capture');
    pet.focus(); await sleep(80);
    const nativePoint=await hit(); await at(nativePoint);
    const nativeMouse=event=>{ const b=pet.getBounds(); pet.webContents.sendInputEvent({...event,globalX:b.x+event.x,globalY:b.y+event.y}); };
    nativeMouse({type:'mouseMove',...nativePoint});
    nativeMouse({type:'mouseDown',...nativePoint,button:'left',clickCount:1});
    const beforeNative=pet.getBounds();
    api.setCursor(beforeNative.x+nativePoint.x+15,beforeNative.y+nativePoint.y+10);
    nativeMouse({type:'mouseMove',x:nativePoint.x+15,y:nativePoint.y+10,modifiers:['leftButtonDown']});
    await sleep(100);
    assert.equal(api.state().dragging,true,'Chromium mouse input starts drag');
    nativeMouse({type:'mouseUp',x:nativePoint.x+15,y:nativePoint.y+10,button:'left',clickCount:1});
    await sleep(100);
    assert.equal(api.state().dragging,false,'Chromium mouse input ends drag');
    assert.deepEqual(pet.getPosition(),[beforeNative.x+15,beforeNative.y+10],
      'a single fast mouse move uses the original press, not the final cursor position');
    log('PASS Chromium mouse press, capture, drag and release');
    for(const name of ['hasu','ame','sumi','tabi','hotaru','neri','oto','kuri','mame']){
      api.setToad(name);
      for(const size of ['s','m','l']){
        api.setSize(size); home(); await sleep(100);
        await dragCheck(name+'/'+size);
        const g=api.state().geo;
        for(const edge of ['l','r','b']){
          api.place(edge==='l'?wa.x-g.travel:edge==='r'?wa.x+wa.width-g.W+g.travel:wa.x+200,
            edge==='b'?wa.y+wa.height-g.H+g.travel:wa.y+180,false);
          await sleep(100); await dragCheck(name+'/'+size+'/'+edge);
        }
      }
      log('PASS '+name+' — all 3 sizes, center and 3 edges');
    }
    home();
    for(const event of ['lostpointercapture','pointercancel']){
      const p=await hit(); await at(p); await pointer('pointerdown',p); await pointer(event,p);
      api.setCursor(wa.x,wa.y); await sleep(250);
      assert.equal(api.state().ignoreNow,true,event+' releases pending press');
      assert.equal(api.state().panelOpen,false,event+' does not click');
      await dragCheck('after '+event);
      await at(p); await pointer('pointerdown',p); await pointer('pointermove',{x:p.x+8,y:p.y+8}); await pointer(event,p);
      assert.equal(api.state().dragging,false,event+' ends active drag');
    }
    log('PASS cancelled presses and drags');
    for(const recovery of ['released-button','blur']){
      const p=await hit(); await at(p); await pointer('pointerdown',p); await pointer('pointermove',{x:p.x+8,y:p.y+8});
      if(recovery==='released-button') await pointer('pointermove',p,{buttons:0});
      else await js('window.dispatchEvent(new Event("blur"))');
      await sleep(80);
      assert.equal(api.state().dragging,false,recovery+' ends drag');
      await dragCheck('after '+recovery);
    }
    log('PASS missed release and window blur recovery');
    for(const name of ['hasu','ame','sumi','tabi','hotaru','neri','oto','kuri','mame']){
      api.setToad(name); home(); await sleep(100);
      api.startRitual();
      await until(()=>api.stage()&&api.stage().isVisible(),'focus prompt');
      await sleep(800);
      await api.stage().webContents.executeJavaScript('document.getElementById("no").click()');
      await until(()=>!api.stage(),'Not yet return');
      assert.equal(pet.isVisible(),true);
      assert.equal((await js('window.__pace()')).running,true,name+' animation resumes');
      await dragCheck(name+' after Not yet');
      assert.equal(api.state().ops.length,0,'cancellation must not start a session');
      log('PASS '+name+' Not yet → animated and draggable');
    }
    api.startRitual(); await until(()=>api.stage()?.isVisible(),'stage for unexpected close');
    api.stage().destroy(); await sleep(150); await dragCheck('unexpected focus close');
    api.startRitual(); await until(()=>api.stage()?.isVisible(),'stage for Escape');
    await sleep(800);
    await api.stage().webContents.executeJavaScript('document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape"}))');
    await until(()=>!api.stage(),'Escape return'); await dragCheck('after Escape');
    api.startRitual(); await until(()=>api.stage()?.isVisible(),'stage for setup');
    await sleep(800); await api.stage().webContents.executeJavaScript('document.getElementById("pick").click()');
    await until(()=>!api.stage(),'setup return');
    assert.equal(api.state().panelMode,'setup'); await dragCheck('after pick tasks');
    log('PASS unexpected close, Escape and task setup');
    assert.deepEqual(errors,[]);
    log('PASS all desktop input regressions');
    app.quit();
  }catch(e){ log(e.stack); app.exit(1); }
});
