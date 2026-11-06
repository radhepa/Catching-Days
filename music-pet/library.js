/* library.js · the plain parts of Sara's music: names, links, search pages, what plays next.
   No Electron here, so test/library.test.js can check it with plain node. */
'use strict';
const path=require('path');

const AUDIO=/\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm|weba)$/i;

/* "03 - My_Song (live).mp3" → "My Song (live)" */
function titleOf(file){
  const base=path.basename(file).replace(/\.[^.]+$/,'');
  const t=base.replace(/_+/g,' ').replace(/^\s*\d{1,3}\s*[-.)]\s+/,'').replace(/\s+/g,' ').trim();
  return t||base;
}

/* the 11-character video id from any YouTube link (watch, youtu.be, shorts, embed, live, music) */
function ytIdOf(s){
  s=String(s||'').trim();
  const m=s.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})(?![\w-])/);
  return m&&/youtu\.?be/.test(s)?m[1]:null;
}

/* YouTube's results page carries its data as one JSON blob; pull the videos out of it.
   shortcut: scrapes the page's ytInitialData, so a YouTube redesign can break search; links keep working. */
function parseSearch(html){
  const key='var ytInitialData = ';
  const a=html.indexOf(key);
  if(a<0) return [];
  const b=html.indexOf(';</script>',a);
  let data;
  try{ data=JSON.parse(html.slice(a+key.length,b)); }catch(e){ return []; }
  const out=[], seen=new Set();
  const text=o=>o?(o.simpleText||(o.runs||[]).map(r=>r.text).join('')):'';
  (function walk(o){
    if(!o||typeof o!=='object'||out.length>=20) return;
    if(o.videoRenderer&&o.videoRenderer.videoId){
      const v=o.videoRenderer;
      if(!seen.has(v.videoId)&&v.lengthText){            // no length: a live stream or a premiere
        seen.add(v.videoId);
        out.push({yt:v.videoId,title:text(v.title),channel:text(v.ownerText||v.longBylineText),length:text(v.lengthText)});
      }
      return;
    }
    for(const k in o) walk(o[k]);
  })(data);
  return out;
}

/* where the queue goes after index i of n: shuffle picks any other song,
   repeat 'all' wraps round, 'off' stops at the end (-1), 'one' replays when a song ends by itself (auto) */
function nextIndex(n,i,{shuffle,repeat,auto},dir=1,rnd=Math.random){
  if(n<=0) return -1;
  if(repeat==='one'&&auto&&i>=0) return i;
  if(shuffle&&n>1){ let j=Math.floor(rnd()*(n-1)); if(j>=i) j++; return j; }
  const j=i+dir;
  if(j>=n) return repeat==='all'?0:-1;
  if(j<0) return repeat==='all'?n-1:0;
  return j;
}

module.exports={AUDIO,titleOf,ytIdOf,parseSearch,nextIndex};
