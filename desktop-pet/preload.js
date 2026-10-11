/* preload.js · the only door between the toad's windows and the rest of the program */
'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const SEND=['ignore','drag-start','drag-end','toad-click','toad-menu','panel-open','panel-close','panel-height','panel-pin',
  'react','set-toad','set-size','set-login','open-app','quit','mem','tray-icon','focus-ritual','stage-ready','stage-done',
  'note-new','note-show','note-hide','note-close','note-top'];
const ON=['view','peek','drag','react','toad','geo','panel','open','closed','side','go','probe','hit-reset','note'];
contextBridge.exposeInMainWorld('pet',{
  init:()=>ipcRenderer.invoke('init'),
  op:o=>ipcRenderer.invoke('op',o),
  send:(ch,data)=>{ if(SEND.includes(ch)) ipcRenderer.send(ch,data); },
  on:(ch,fn)=>{ if(ON.includes(ch)) ipcRenderer.on(ch,(e,d)=>fn(d)); }
});
