#!/usr/bin/env python3
"""Tiny local server for Catching Days.

Serves the app's files exactly like a normal static server (GET), but also
accepts POST requests that write a file into this same folder — that's how
the app saves focus-data.json to disk instead of trusting browser storage,
which is what used to get thrown away on every restart.

It also reads your calendar for the planner: GET /cal-feed?u=<address> fetches
a calendar's .ics address (Google Calendar's "secret address in iCal format")
and hands it back to the app, because a browser page isn't allowed to read
another site directly. Only https addresses, only calendar files.

Only ever binds to 127.0.0.1 — never reachable from outside this PC.
"""
import http.server
import ipaddress
import os
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
CAL_MAX = 15 * 1024 * 1024

# Requests are handled on their own threads so a slow calendar fetch never
# holds up a save. Every file read and write still takes this one lock, so
# file access stays strictly one at a time, exactly as before.
FILE_LOCK = threading.Lock()


def _private_host(host):
    host = (host or '').strip('[]').lower()
    if host == 'localhost' or host.endswith('.localhost') or host.endswith('.local'):
        return True
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        return False
    return ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_unspecified


class Handler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        # Keep the author's scene/expression previews off the app server.
        name = os.path.basename(self.translate_path(self.path)).lower()
        if name.startswith(('pond-moments-library.', 'pond-expressions-library.')):
            self.send_error(404, 'Not found')
            return None
        return super().send_head()

    def do_GET(self):
        if urllib.parse.urlparse(self.path).path == '/cal-feed':
            self.cal_feed()
            return
        with FILE_LOCK:
            super().do_GET()

    def do_HEAD(self):
        with FILE_LOCK:
            super().do_HEAD()

    def do_POST(self):
        name = self.path.lstrip('/')
        ok_name = name and '/' not in name and '\\' not in name and '..' not in name
        ok_ext = name.endswith('.json') or name.endswith('.md')
        if not (ok_name and ok_ext):
            self.send_response(400)
            self.end_headers()
            return
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        with FILE_LOCK:
            try:
                with open(name, 'wb') as f:
                    f.write(body)
            except OSError:
                self.send_response(500)
                self.end_headers()
                return
        self.send_response(200)
        self.send_header('Content-Type', 'text/plain')
        self.end_headers()
        self.wfile.write(b'ok')

    def _plain(self, code, text):
        body = text.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'text/plain; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def cal_feed(self):
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        addr = (query.get('u') or [''])[0].strip()
        if addr.lower().startswith('webcal://'):
            addr = 'https://' + addr[9:]
        parts = urllib.parse.urlparse(addr)
        if parts.scheme != 'https' or not parts.hostname or _private_host(parts.hostname):
            self._plain(400, 'Only https calendar addresses work here.')
            return
        req = urllib.request.Request(addr, headers={
            'User-Agent': 'CatchingDays/1.0 (calendar reader)',
            'Accept': 'text/calendar, text/plain, */*'})
        try:
            with urllib.request.urlopen(req, timeout=20) as r:
                body = r.read(CAL_MAX + 1)
        except urllib.error.HTTPError as e:
            self._plain(502, 'The calendar server answered %d.' % e.code)
            return
        except Exception:
            self._plain(502, 'Could not reach that address.')
            return
        if len(body) > CAL_MAX:
            self._plain(502, 'That calendar is too big to read.')
            return
        if b'BEGIN:VCALENDAR' not in body[:4096].upper():
            self._plain(502, "That address didn't return a calendar (.ics).")
            return
        self.send_response(200)
        self.send_header('Content-Type', 'text/calendar; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        http.server.SimpleHTTPRequestHandler.end_headers(self)


class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)) or '.')
    httpd = Server(('127.0.0.1', PORT), Handler)
    print(f"Catching Days — serving http://127.0.0.1:{PORT}  (Ctrl+C to stop)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
