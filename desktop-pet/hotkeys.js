/* hotkeys.js · Ctrl+\ brings out the Catching Days desktop toad, Ctrl+] brings out Music Buddies.
   The same file lives in both apps, so the keys work from whichever one is running.

   Each app writes down how it was started (<AppData>\<its name>\launch.json). The app that holds a
   key starts its target with that line. If the target is already running, its single-instance
   lock turns the start into a 'second-instance' wake-up, so neither app has to know whether the
   other one is open. Two apps can't hold one key: whoever started first holds both, and the other
   tries again every few seconds, so the keys carry on working when one of them quits. */
'use strict';
const {app,globalShortcut}=require('electron');
const path=require('path'), fs=require('fs'), {spawn}=require('child_process');

const KEYS={'CommandOrControl+\\':'catching-days-desktop-toad','CommandOrControl+]':'Music Buddies'};

/* me: this app's name in KEYS; wake: what to do when my own key is pressed */
module.exports=function hotkeys(me,wake){
  /* the way I was started, minus the one-off switches (kept by name, not by --profile's folder) */
  if(!process.argv.includes('--test')) try{
    const dir=path.join(app.getPath('appData'),me);
    const args=process.argv.slice(1).filter(a=>!/^--(make-shortcut|start-at-login|inspect|remote-debugging-port)/.test(a));
    fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,'launch.json'),JSON.stringify({exe:process.execPath,args}));
  }catch(e){}
  const start=name=>{
    try{
      const l=JSON.parse(fs.readFileSync(path.join(app.getPath('appData'),name,'launch.json'),'utf8'));
      if(fs.existsSync(l.exe)) spawn(l.exe,l.args||[],{detached:true,stdio:'ignore'}).unref();
    }catch(e){}   // never started on this computer yet: nothing to start
  };
  const grab=()=>{
    for(const [key,name] of Object.entries(KEYS)){
      if(globalShortcut.isRegistered(key)) continue;
      try{ globalShortcut.register(key,()=>name===me?wake():start(name)); }catch(e){}
    }
  };
  grab(); setInterval(grab,5000).unref();
};
