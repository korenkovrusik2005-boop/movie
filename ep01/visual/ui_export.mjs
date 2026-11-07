// Export phone-screen UI layers (2x) from the canvas engine for compositing onto generated keyframes.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), OUT = path.join(ROOT, 'keyframes', 'ui');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
await new Promise(r => server.listen(0, r));
const b = await chromium.launch(); const p = await b.newPage(); await p.goto(`http://localhost:${server.address().port}/visual/ep01.html?render=1`); await p.evaluate(() => EP.ready);
const shots = await p.evaluate(() => {
  const S = 2, w = 530, h = 1120, out = {};
  const screen = (draw) => { const c = document.createElement('canvas'); c.width = w * S; c.height = h * S; const g = c.getContext('2d');
    g.scale(S, S); g.translate(w / 2, h / 2); g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 70); g.clip(); draw(g); return c.toDataURL('image/png'); };
  const lock = (time) => g => { wallpaper(g, 560, 1150); g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.86)'; g.font = '500 34px InterV'; g.fillText('Monday', 0, -398);
    g.fillStyle = 'rgba(255,255,255,.94)'; g.font = '600 200px InterV'; g.letterSpacing = '-6px'; g.fillText(time, 0, -206); g.letterSpacing = '0px';
    g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.arc(-190, 440, 44, 0, Math.PI * 2); g.arc(190, 440, 44, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.roundRect(-95, 528, 190, 9, 5); g.fill(); };
  out.lock_858 = screen(lock('8:58')); out.lock_912 = screen(lock('9:12'));
  const bn = (o) => { const c = document.createElement('canvas'); c.width = 508 * S; c.height = 152 * S; const g = c.getContext('2d'); g.scale(S, S); g.translate(254, 0); banner(g, Object.assign({ y: 0, alpha: 1 }, o)); return c.toDataURL('image/png'); };
  out.banner_meeting = bn({ icon: 'cal', title: '9:00 Meeting', body: 'starts in 2 minutes', when: 'now' });
  out.banner_join = bn({ icon: 'cal', title: '9:00 Meeting', body: 'started 12 min ago', when: '9:00', action: 'Join' });
  out.thread = screen(g => threadScreen(g, 560, 1150, { statusTime: '9:31' }));
  for (let i = 0; i < 3; i++) out['call_' + i] = screen(g => callScreen(g, 560, 1150, { t: i / 2 + .01 }));
  return out;
});
for (const [k, v] of Object.entries(shots)) fs.writeFileSync(path.join(OUT, k + '.png'), Buffer.from(v.split(',')[1], 'base64'));
console.log(Object.keys(shots).join(' ')); await b.close(); server.close();
