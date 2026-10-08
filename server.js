#!/usr/bin/env node
// Tiny local server for Catching Days — static files (GET) plus a
// POST-to-save endpoint, so the app can write focus-data.json to disk
// without relying on browser storage. Node fallback for server.py.
// GET /cal-feed?u=<address> reads a calendar's .ics address for the planner
// (a browser page can't read another site directly). https only.
// Only ever binds to 127.0.0.1 — never reachable from outside this PC.
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const net = require('net');

const CAL_MAX = 15 * 1024 * 1024;
function privateHost(h) {
  h = String(h || '').replace(/^\[|\]$/g, '').toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) return true;
  if (!net.isIP(h)) return false;
  return /^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || h === '::1' || /^f[cd]|^fe80/.test(h);
}
function plain(res, code, text) {
  res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(text);
}
function calFeed(req, res) {
  let addr = String(new URL(req.url, 'http://x').searchParams.get('u') || '').trim();
  if (/^webcal:\/\//i.test(addr)) addr = 'https://' + addr.slice(9);
  let u; try { u = new URL(addr); } catch (e) { u = null; }
  if (!u || u.protocol !== 'https:' || privateHost(u.hostname)) { plain(res, 400, 'Only https calendar addresses work here.'); return; }
  let hops = 0, done = false;
  const finish = (code, text, body) => {
    if (done) return; done = true;
    if (body) { res.writeHead(200, { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(body); }
    else plain(res, code, text);
  };
  const go = target => {
    const r = https.get(target, { headers: { 'User-Agent': 'CatchingDays/1.0 (calendar reader)', 'Accept': 'text/calendar, text/plain, */*' }, timeout: 20000 }, up => {
      if (up.statusCode >= 300 && up.statusCode < 400 && up.headers.location && hops++ < 5) {
        up.resume();
        let next; try { next = new URL(up.headers.location, target); } catch (e) { next = null; }
        if (!next || next.protocol !== 'https:' || privateHost(next.hostname)) { finish(502, 'Could not reach that address.'); return; }
        go(next); return;
      }
      if (up.statusCode !== 200) { up.resume(); finish(502, `The calendar server answered ${up.statusCode}.`); return; }
      const chunks = []; let n = 0;
      up.on('data', c => { n += c.length; if (n > CAL_MAX) { up.destroy(); finish(502, 'That calendar is too big to read.'); return; } chunks.push(c); });
      up.on('end', () => {
        const body = Buffer.concat(chunks);
        if (!/BEGIN:VCALENDAR/i.test(body.slice(0, 4096).toString('utf8'))) { finish(502, "That address didn't return a calendar (.ics)."); return; }
        finish(200, '', body);
      });
      up.on('error', () => finish(502, 'Could not reach that address.'));
    });
    r.on('timeout', () => { r.destroy(); finish(502, 'Could not reach that address.'); });
    r.on('error', () => finish(502, 'Could not reach that address.'));
  };
  go(u);
}

const PORT = parseInt(process.argv[2], 10) || 8765;
const ROOT = __dirname;

const TYPES = {
  '.html': 'text/html', '.json': 'application/json', '.md': 'text/markdown',
  '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(url.parse(req.url).pathname);
  const name = pathname.replace(/^\/+/, '');
  if (req.method === 'GET' && pathname === '/cal-feed') { calFeed(req, res); return; }

  if (req.method === 'POST') {
    const okName = name && !name.includes('/') && !name.includes('\\') && !name.includes('..');
    const okExt = name.endsWith('.json') || name.endsWith('.md');
    if (!okName || !okExt) { res.writeHead(400); res.end(); return; }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      fs.writeFile(path.join(ROOT, name), Buffer.concat(chunks), err => {
        if (err) { res.writeHead(500); res.end(); return; }
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
      });
    });
    return;
  }

  const file = name === '' ? 'catching-days.html' : name;
  const full = path.join(ROOT, file);
  if (!full.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
  // Author previews live on the separate local preview server, never in the app.
  if (/^(pond-moments-library|pond-expressions-library)\./i.test(path.basename(full))) {
    res.writeHead(404); res.end('Not found'); return;
  }
  fs.readFile(full, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(full)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Catching Days — serving http://127.0.0.1:${PORT}  (Ctrl+C to stop)`);
});
