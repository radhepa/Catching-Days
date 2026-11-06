/* preload.js · the only door between Sara's windows and the rest of the program */
'use strict';
const {contextBridge,ipcRenderer,webUtils}=require('electron');
const SEND=['save','state','yt','yt-slot','drop-paths','drag-start','drag-end','tap','pet-menu','player-close','add-music','open-folder','show-file'];
const ON=['state','open','add-tracks','cmd','yt-state'];
const INVOKE=['init','scan','yt-search','yt-info','menu'];
contextBridge.exposeInMainWorld('sara',{
  ask:(ch,data)=>INVOKE.includes(ch)?ipcRenderer.invoke(ch,data):Promise.reject(new Error('no '+ch)),
  send:(ch,data)=>{ if(SEND.includes(ch)) ipcRenderer.send(ch,data); },
  on:(ch,fn)=>{ if(ON.includes(ch)) ipcRenderer.on(ch,(e,d)=>fn(d)); },
  /* dropped files: Electron no longer puts the path on File, so ask for it here */
  paths:files=>[...files].map(f=>{ try{ return webUtils.getPathForFile(f); }catch(e){ return ''; } }).filter(Boolean)
});
