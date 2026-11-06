// STILL OPEN — shared 2.5D motion core (camera, planes, blur layers, 3D-lite, helpers).
// Reusable across episodes: scenes only call these helpers.
'use strict';
const W = 1080, H = 1920;

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const ss = t => t * t * (3 - 2 * t);
const eio = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eio2 = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const eo = t => 1 - Math.pow(1 - t, 3);
const eo5 = t => 1 - Math.pow(1 - t, 5);
const ei = t => t * t * t;
const TAU = Math.PI * 2;
// damped spring 0→1 with overshoot; t in seconds since start
function spring(t, f = 2.2, z = 0.42) {
  if (t <= 0) return 0;
  const w = TAU * f, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
}
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i + seed * 101.3), hash(i + 1 + seed * 101.3), u) * 2 - 1; }
function fbm(x, seed = 0) { return noise1(x, seed) * .6 + noise1(x * 2.1, seed + 7) * .3 + noise1(x * 4.3, seed + 13) * .1; }

// ---------- color ----------
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const P = { // series palette: warm sun + cool shadow
  sun: hex('#fff3dc'), sunWarm: hex('#ffd49a'), amber: hex('#f4a65e'),
  skyTop: hex('#93bcd3'), skyMid: hex('#c9dfe7'), skyLow: hex('#f6e6cc'),
  haze: hex('#f1dcc2'), hazeCool: hex('#c8d6dd'),
  shadow: hex('#5b6f82'), shadowDeep: hex('#34414f'), ink: hex('#12161c'),
  lit: hex('#e8c59c'), litPale: hex('#f2dcc0'), wet: hex('#3b4855'),
};

// ---------- canvas ----------
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const scr = mk(W, H), sctx = scr.getContext('2d');
const qcv = mk(W / 4, H / 4), qctx = qcv.getContext('2d');
const hcv = mk(W / 2, H / 2), hctx = hcv.getContext('2d');
const xfb = mk(W, H), xfctx = xfb.getContext('2d');

// ---------- camera for plane layers ----------
// A plane layer is authored in base-frame pixels as seen from cam=(0,0,0) at depth d.
const cam = { x: 0, y: 0, z: 0, roll: 0, zoom: 1 };
const F = 1000;
function camReset() { cam.x = 0; cam.y = 0; cam.z = 0; cam.roll = 0; cam.zoom = 1; }
function planeTf(c, d) {
  const k = d / (d - cam.z), s = F / (d - cam.z);
  const cr = Math.cos(cam.roll) * cam.zoom, sr = Math.sin(cam.roll) * cam.zoom;
  const tx = -W / 2 * k - cam.x * s, ty = -H / 2 * k - cam.y * s;
  c.setTransform(cr * k, sr * k, -sr * k, cr * k, W / 2 + cr * tx - sr * ty, H / 2 + sr * tx + cr * ty);
}
// project an authored point at depth d to screen (no roll needed for rough uses)
function planePt(x, y, d) {
  const k = d / (d - cam.z), s = F / (d - cam.z);
  let vx = (x - W / 2) * k - cam.x * s, vy = (y - H / 2) * k - cam.y * s;
  const cr = Math.cos(cam.roll) * cam.zoom, sr = Math.sin(cam.roll) * cam.zoom;
  return [W / 2 + cr * vx - sr * vy, H / 2 + sr * vx + cr * vy, k * cam.zoom];
}
function screenTf(c) { // roll/zoom only, for screen-space overlays that should follow the camera
  const cr = Math.cos(cam.roll) * cam.zoom, sr = Math.sin(cam.roll) * cam.zoom;
  c.setTransform(cr, sr, -sr, cr, W / 2 - cr * W / 2 + sr * H / 2, H / 2 - sr * W / 2 - cr * H / 2);
}

// Draw a layer: fn(c) draws in authored coords. blur in screen px (DOF). opt: alpha, comp, screen(bool)
function L(d, blur, fn, opt = {}) {
  const target = opt.ctx || ctx;
  const tf = c => (d === 0 ? c.setTransform(1, 0, 0, 1, 0, 0) : d < 0 ? screenTf(c) : planeTf(c, d));
  if (!(blur > 0.35)) {
    target.save(); tf(target);
    if (opt.alpha != null) target.globalAlpha = opt.alpha;
    if (opt.comp) target.globalCompositeOperation = opt.comp;
    fn(target); target.restore(); return;
  }
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, W, H);
  sctx.save(); tf(sctx); fn(sctx); sctx.restore();
  blurOnto(target, scr, blur, opt);
}
function blurOnto(target, src, blur, opt = {}) {
  target.save(); target.setTransform(1, 0, 0, 1, 0, 0);
  if (opt.alpha != null) target.globalAlpha = opt.alpha;
  if (opt.comp) target.globalCompositeOperation = opt.comp;
  if (blur > 9) { // quarter-res blur for heavy bokeh
    qctx.setTransform(1, 0, 0, 1, 0, 0); qctx.clearRect(0, 0, qcv.width, qcv.height);
    qctx.filter = `blur(${(blur / 4).toFixed(2)}px)`; qctx.drawImage(src, 0, 0, qcv.width, qcv.height); qctx.filter = 'none';
    target.imageSmoothingQuality = 'high'; target.drawImage(qcv, 0, 0, W, H);
  } else if (blur > 3.5) {
    hctx.setTransform(1, 0, 0, 1, 0, 0); hctx.clearRect(0, 0, hcv.width, hcv.height);
    hctx.filter = `blur(${(blur / 2).toFixed(2)}px)`; hctx.drawImage(src, 0, 0, hcv.width, hcv.height); hctx.filter = 'none';
    target.imageSmoothingQuality = 'high'; target.drawImage(hcv, 0, 0, W, H);
  } else {
    target.filter = `blur(${blur.toFixed(2)}px)`; target.drawImage(src, 0, 0);
  }
  target.restore();
}

// cache static vector art into a bitmap (authored size w×h, rendered at scale r)
const _cache = new Map();
function cached(key, w, h, r, fn) {
  let c = _cache.get(key);
  if (!c) { c = mk(Math.ceil(w * r), Math.ceil(h * r)); const g = c.getContext('2d'); g.scale(r, r); fn(g); c._r = r; _cache.set(key, c); }
  return c;
}
function drawCached(c, img, x = 0, y = 0) { c.drawImage(img, x, y, img.width / img._r, img.height / img._r); }

// ---------- 3D-lite (meters, y up) ----------
const c3 = { x: 0, y: 1.6, z: 0, yaw: 0, pitch: 0, roll: 0, f: 1250, hy: 0.52 };
function toCam(p) {
  const x = p[0] - c3.x, y = p[1] - c3.y, z = p[2] - c3.z;
  const cy = Math.cos(c3.yaw), sy = Math.sin(c3.yaw);
  const x1 = cy * x - sy * z, z1 = sy * x + cy * z;
  const cp = Math.cos(c3.pitch), sp = Math.sin(c3.pitch);
  return [x1, cp * y - sp * z1, sp * y + cp * z1];
}
function proj(q) { return [W / 2 + q[0] * c3.f / q[2], H * c3.hy - q[1] * c3.f / q[2]]; }
function clipNear(pts, n = 0.25) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ain = a[2] >= n, bin = b[2] >= n;
    if (ain) out.push(a);
    if (ain !== bin) { const t = (n - a[2]) / (b[2] - a[2]); out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), n]); }
  }
  return out;
}
function path3(c, pts) {
  const cp = clipNear(pts.map(toCam)); if (cp.length < 3) return false;
  c.beginPath(); cp.forEach((q, i) => { const s = proj(q); i ? c.lineTo(s[0], s[1]) : c.moveTo(s[0], s[1]); }); c.closePath();
  return true;
}
function poly3(c, pts, fill) { if (path3(c, pts)) { c.fillStyle = fill; c.fill(); } }
function pt3(p) { const q = toCam(p); return q[2] > 0.05 ? [...proj(q), q[2]] : null; }
function roll3Tf(c) { // apply c3.roll around frame center
  const cr = Math.cos(c3.roll), sr = Math.sin(c3.roll);
  c.setTransform(cr, sr, -sr, cr, W / 2 - cr * W / 2 + sr * H / 2, H / 2 - sr * W / 2 - cr * H / 2);
}

// ---------- shapes ----------
function rrect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }
function glow(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgb(col, a)); g.addColorStop(.35, rgb(col, a * .35)); g.addColorStop(1, rgb(col, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
function vgrad(c, x, y, w, h, stops) {
  const g = c.createLinearGradient(0, y, 0, y + h); stops.forEach(([o, col, a]) => g.addColorStop(o, rgb(col, a == null ? 1 : a)));
  c.fillStyle = g; c.fillRect(x, y, w, h);
}

// hero silhouette from behind: head+shoulders(+torso). origin = neck base, unit ≈ head height.
// opt: tilt (head roll), turn (head drop/turn 0..1), wind (0..1), torso (length), t (time)
function heroBustPath(c, opt = {}) {
  const t = opt.t || 0, wind = opt.wind || 0, torso = opt.torso || 1.7, turn = opt.turn || 0;
  const tilt = (opt.tilt || 0) + turn * 0.16;
  c.beginPath();
  // torso / jacket
  const sw = opt.shoulder || 1.0;
  c.moveTo(-0.2, -0.06);
  c.bezierCurveTo(-0.45, 0.0, -0.86 * sw, 0.06, -0.98 * sw, 0.3);
  c.bezierCurveTo(-1.08 * sw, 0.55, -1.06 * sw, 1.0, -1.02 * sw, torso);
  c.lineTo(1.02 * sw, torso);
  c.bezierCurveTo(1.06 * sw, 1.0, 1.08 * sw, 0.55, 0.98 * sw, 0.3);
  c.bezierCurveTo(0.86 * sw, 0.06, 0.45, 0.0, 0.2, -0.06);
  c.closePath();
  // neck
  c.moveTo(-0.17, -0.34); c.lineTo(-0.17, 0.04); c.lineTo(0.17, 0.04); c.lineTo(0.17, -0.34); c.closePath();
  // head (rotates around neck) + ears + hair cap with a few wind-blown strands
  const hx = Math.sin(tilt) * 0.62 + turn * 0.05, hy = -0.66 + (1 - Math.cos(tilt)) * 0.6 + turn * 0.07;
  c.moveTo(hx + 0.34, hy); c.ellipse(hx, hy, 0.34, 0.42, tilt, 0, TAU, true);
  for (const sd of [-1, 1]) { const ex = hx + sd * 0.33 * Math.cos(tilt), ey = hy + 0.04 + sd * 0.33 * Math.sin(tilt); c.moveTo(ex + 0.05, ey); c.ellipse(ex, ey, 0.05, 0.085, tilt, 0, TAU, true); }
  const cx2 = hx + Math.sin(tilt) * 0.05, cy2 = hy - 0.06;
  c.moveTo(cx2 + 0.37, cy2); c.ellipse(cx2, cy2, 0.37, 0.39, tilt, 0, TAU, true);
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i - 1.5) * 0.42 + tilt, wv = wind * 0.05 * noise1(t * 2.3 + i * 1.9, 3);
    const rx = cx2 + Math.cos(a) * 0.36, ry = cy2 + Math.sin(a) * 0.38;
    c.moveTo(rx + 0.08, ry); c.ellipse(rx + wv, ry + 0.005, 0.085, 0.032, a + Math.PI / 2 + wv * 4, 0, TAU, true);
  }
}
function heroBust(c, x, y, s, opt = {}) {
  c.save(); c.translate(x, y); c.scale(s, s);
  if (opt.rim) { // rim light: offset warm copy behind
    c.save(); c.translate(opt.rimDx || 0.035, opt.rimDy || -0.02);
    heroBustPath(c, opt); c.fillStyle = rgb(opt.rim, opt.rimA == null ? .9 : opt.rimA); c.fill('nonzero'); c.restore();
  }
  heroBustPath(c, opt); c.fillStyle = rgb(opt.col || P.ink, opt.a == null ? 1 : opt.a); c.fill('nonzero');
  c.restore();
}
// tiny standing figure (height 1 unit), from behind, feet at origin
function heroStanding(c, x, y, h, col, opt = {}) {
  c.save(); c.translate(x, y); c.scale(h, h); c.beginPath();
  c.ellipse(0, -0.925, 0.062, 0.074, 0, 0, TAU);
  c.moveTo(-0.13, -0.80); c.quadraticCurveTo(0, -0.84, 0.13, -0.80);
  c.lineTo(0.15, -0.5); c.lineTo(0.12, -0.46); c.lineTo(0.11, -0.02); c.lineTo(0.03, 0); c.lineTo(0.0, -0.44);
  c.lineTo(-0.03, 0); c.lineTo(-0.11, -0.02); c.lineTo(-0.12, -0.46); c.lineTo(-0.15, -0.5); c.closePath();
  c.fillStyle = col; c.fill();
  if (opt.rim) { c.strokeStyle = opt.rim; c.lineWidth = 0.012; c.stroke(); }
  c.restore();
}
function bird(c, x, y, s, ph, col) {
  const a = Math.sin(ph) * 0.9;
  c.save(); c.translate(x, y); c.scale(s, s); c.beginPath();
  c.moveTo(-1, -a * 0.8); c.quadraticCurveTo(-0.45, -0.25 - a * 0.4, 0, 0.08);
  c.quadraticCurveTo(0.45, -0.25 - a * 0.4, 1, -a * 0.8);
  c.quadraticCurveTo(0.45, -0.05 - a * 0.2, 0, 0.26); c.quadraticCurveTo(-0.45, -0.05 - a * 0.2, -1, -a * 0.8);
  c.fillStyle = col; c.fill(); c.restore();
}

// city skyline generator + painter (side-lit blocks with windows)
function genSkyline(seed, x0, x1, hMin, hMax, wMin, wMax) {
  const r = rng(seed), out = []; let x = x0;
  while (x < x1) {
    const w = lerp(wMin, wMax, r()), h = lerp(hMin, hMax, Math.pow(r(), 1.5));
    out.push({ x, w, h, ant: r() < .16, tank: r() < .22, step: r() < .3 ? .12 + r() * .2 : 0, s: (r() * 1e6) | 0 });
    x += w * lerp(0.72, 1.0, r());
  }
  return out;
}
function drawSkyline(c, B, baseY, o) {
  // o: shadow, lit, litFrac, sunSide(+1 right/-1 left), win (alpha), winLit, rim, extra
  const extra = o.extra || 400;
  for (const b of B) {
    const top = baseY - b.h, r = rng(b.s);
    c.fillStyle = rgb(o.shadow); c.fillRect(b.x, top, b.w, b.h + extra);
    if (b.step) { c.fillRect(b.x + b.w * b.step, top - b.h * 0.08, b.w * (1 - 2 * b.step), b.h * 0.08 + 2); }
    if (o.lit) {
      const lw = b.w * (o.litFrac || .3), lx = (o.sunSide || 1) > 0 ? b.x + b.w - lw : b.x;
      c.fillStyle = rgb(o.lit); c.fillRect(lx, top, lw, b.h + extra);
    }
    if (o.rim) { c.fillStyle = rgb(o.rim, .85); c.fillRect(b.x, top, b.w, Math.max(1.5, b.h * .012)); }
    if (b.ant) { c.fillStyle = rgb(o.shadow); c.fillRect(b.x + b.w * .5 - 1.2, top - b.h * .22, 2.4, b.h * .22); }
    if (b.tank) { c.fillStyle = rgb(o.shadow); const tw = Math.min(26, b.w * .25); c.fillRect(b.x + b.w * .2, top - tw * .9, tw, tw * .9); }
    if (o.win) {
      const cw = o.cell || 14, rh = o.row || 19, ww = cw * .45, wh = rh * .5;
      for (let yy = top + rh * .8; yy < baseY - rh * .5; yy += rh) for (let xx = b.x + cw * .5; xx < b.x + b.w - ww - 2; xx += cw) {
        const v = r();
        const litSide = o.lit && ((o.sunSide || 1) > 0 ? xx > b.x + b.w * (1 - (o.litFrac || .3)) : xx < b.x + b.w * (o.litFrac || .3));
        if (v < .07 && o.winLit) { c.fillStyle = rgb(o.winLit, .9); }
        else c.fillStyle = litSide ? rgb(o.lit, 1) : rgb(o.winCol || P.shadowDeep, o.win * (0.5 + v * 0.5));
        if (litSide) { c.fillStyle = rgb(mix(o.lit, [255, 255, 255], v * .35), 1); }
        c.fillRect(xx, yy, ww, wh);
      }
    }
  }
}

// film grain tiles
const grainTiles = [];
function initGrain() {
  for (let k = 0; k < 4; k++) {
    const g = mk(540, 960), gc = g.getContext('2d'), id = gc.createImageData(540, 960), r = rng(91 + k);
    for (let i = 0; i < id.data.length; i += 4) { const v = (r() * 255) | 0; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    gc.putImageData(id, 0, 0); grainTiles.push(g);
  }
}
const bloomCv = mk(135, 240), bloomCtx = bloomCv.getContext('2d');
function post(frame, o = {}) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  // bloom / halation
  const ba = o.bloom == null ? .22 : o.bloom;
  if (ba > 0) {
    bloomCtx.filter = 'none'; bloomCtx.globalCompositeOperation = 'source-over';
    bloomCtx.drawImage(cv, 0, 0, 135, 240);
    bloomCtx.globalCompositeOperation = 'multiply'; bloomCtx.drawImage(bloomCv, 0, 0); // emphasise highlights
    bloomCtx.globalCompositeOperation = 'source-over';
    ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = ba; ctx.filter = 'blur(26px)';
    ctx.drawImage(bloomCv, 0, 0, W, H); ctx.filter = 'none';
  }
  // vignette
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  const v = ctx.createRadialGradient(W / 2, H * .48, H * .28, W / 2, H * .5, H * .78);
  v.addColorStop(0, 'rgba(10,14,20,0)'); v.addColorStop(1, `rgba(10,14,20,${o.vig == null ? .42 : o.vig})`);
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  // grain
  const gf = frame >> 1, g = grainTiles[gf % 4]; const ox = (hash(gf) * 200) | 0, oy = (hash(gf + 7) * 300) | 0;
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = (o.grain == null ? .075 : o.grain) * .8;
  ctx.drawImage(g, -ox, -oy, 1080 + 400, 1920 + 600);
  ctx.restore();
}
