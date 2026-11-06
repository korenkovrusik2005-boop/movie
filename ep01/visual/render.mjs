// Frame renderer: headless Chromium draws the canvas, ffmpeg encodes.
// usage: node render.mjs video [workers]          -> out/video.mp4 (no audio)
//        node render.mjs stills t1,t2,...  [dir]  -> PNG stills at those seconds
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TL = JSON.parse(fs.readFileSync(path.join(ROOT, 'timeline.json')));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2', '.wav': 'audio/wav' };
const server = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
await new Promise(r => server.listen(0, r)); const port = server.address().port;
const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb'] });
async function page() { const p = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('console', m => { if (m.type() === 'error') console.error('[page]', m.text()); }); p.on('pageerror', e => console.error('[pageerror]', e.message));
  await p.goto(`http://localhost:${port}/visual/ep01.html?render=1`); await p.evaluate(() => EP.ready); return p; }
const mode = process.argv[2] || 'video';
if (mode === 'stills') {
  const ts = (process.argv[3] || '1,5').split(',').map(Number), dir = process.argv[4] || path.join(ROOT, 'out', 'stills'); fs.mkdirSync(dir, { recursive: true });
  const p = await page();
  for (const t of ts) { const url = await p.evaluate(f => EP.framePNG(f), Math.round(t * TL.fps)); fs.writeFileSync(path.join(dir, `t${t.toFixed(2).padStart(6, '0')}.png`), Buffer.from(url.split(',')[1], 'base64')); }
  console.log('stills ->', dir);
} else {
  const workers = +(process.argv[3] || 4), N = Math.round(TL.duration * TL.fps), from = +(process.argv[4] || 0), to = +(process.argv[5] || N);
  const segDir = path.join(ROOT, 'out', 'seg'); fs.mkdirSync(segDir, { recursive: true });
  const per = Math.ceil((to - from) / workers), t0 = Date.now(); let done = 0;
  await Promise.all(Array.from({ length: workers }, async (_, w) => {
    const a = from + w * per, b = Math.min(to, a + per); if (a >= b) return;
    const p = await page();
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(TL.fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(TL.fps), path.join(segDir, `seg${String(w).padStart(2, '0')}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      const url = await p.evaluate(f => EP.frameJPEG(f, .96), f);
      if (!ff.stdin.write(Buffer.from(url.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (++done % 120 === 0) console.log(`${done}/${to - from} frames  ${((Date.now() - t0) / done).toFixed(0)} ms/frame avg`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }));
  const list = fs.readdirSync(segDir).filter(f => f.endsWith('.mp4')).sort().map(f => `file '${path.join(segDir, f)}'`).join('\n');
  fs.writeFileSync(path.join(segDir, 'list.txt'), list);
  await new Promise(r => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(segDir, 'list.txt'), '-c', 'copy', path.join(ROOT, 'out', 'video.mp4')], { stdio: 'inherit' }).on('close', r));
  console.log('video ->', path.join(ROOT, 'out', 'video.mp4'), ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await browser.close(); server.close();
