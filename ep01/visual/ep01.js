// STILL OPEN — EP01 «9:00 Meeting». Scenes + master timeline. Depends on core.js.
'use strict';
let TL, E;

// ======================================================================
// shared props
// ======================================================================
const WALL = { day: 'Monday' };
function wallpaper(c, w, h) {
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, '#0c1723'); g.addColorStop(.55, '#16303f'); g.addColorStop(1, '#3b3a3e');
  c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h);
  glow(c, 70, 470, 560, hex('#f0a46a'), .55);
  glow(c, -170, 250, 400, hex('#5a8fb0'), .32);
}
function banner(c, b) {
  c.save(); c.globalAlpha *= b.alpha; c.translate(b.x || 0, b.y);
  rrect(c, -254, 0, 508, 152, 46); c.fillStyle = 'rgba(62,70,82,0.80)'; c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 2; c.stroke();
  if (b.icon === 'cal') {
    rrect(c, -230, 34, 84, 84, 20); c.fillStyle = '#fbfbfb'; c.fill();
    c.textAlign = 'center'; c.fillStyle = '#e8433a'; c.font = '600 17px InterV'; c.fillText('MON', -188, 59);
    c.fillStyle = '#121212'; c.font = '300 48px InterV'; c.fillText('9', -188, 106);
  } else {
    rrect(c, -230, 34, 84, 84, 20);
    const g = c.createLinearGradient(0, 34, 0, 118); g.addColorStop(0, '#67f27f'); g.addColorStop(1, '#1fbf3c');
    c.fillStyle = g; c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(-188, 74, 27, 22, 0, 0, TAU); c.fill();
    c.beginPath(); c.moveTo(-205, 88); c.quadraticCurveTo(-208, 100, -216, 104); c.quadraticCurveTo(-200, 102, -192, 93); c.fill();
  }
  c.textAlign = 'left'; c.fillStyle = '#fff'; c.font = `600 31px InterV, "Noto Color Emoji"`; c.fillText(b.title, -126, 70);
  c.font = '400 29px InterV'; c.fillStyle = 'rgba(255,255,255,.9)'; c.fillText(b.body, -126, 110);
  c.textAlign = 'right'; c.font = '400 24px InterV'; c.fillStyle = 'rgba(255,255,255,.55)'; c.fillText(b.when || 'now', 230, 68);
  if (b.action) { rrect(c, 146, 88, 84, 38, 19); c.fillStyle = '#34c759'; c.fill(); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = '600 22px InterV'; c.fillText(b.action, 188, 114); }
  c.restore();
}
function handset(c, x, y, s, col) { // simple phone-handset glyph
  c.save(); c.translate(x, y); c.scale(s, s); c.rotate(-.75); c.fillStyle = col;
  rrect(c, -.5, -.16, 1, .32, .16); c.fill(); rrect(c, -.62, -.34, .34, .5, .14); c.fill(); rrect(c, .28, -.34, .34, .5, .14); c.fill(); c.restore();
}
function threadScreen(c, w, h, o) {
  c.fillStyle = '#000'; c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = 'rgba(255,255,255,.9)'; c.font = '600 24px InterV'; c.textAlign = 'left'; c.fillText(o.statusTime || '9:31', -222, -510);
  c.fillStyle = 'rgba(28,28,30,1)'; c.fillRect(-w / 2, -480, w, 170); c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(-w / 2, -310, w, 2);
  c.fillStyle = '#0a84ff'; c.font = '300 64px InterV'; c.fillText('‹', -240, -385);
  const g = c.createLinearGradient(0, -470, 0, -390); g.addColorStop(0, '#a3a8b4'); g.addColorStop(1, '#6e7380'); c.fillStyle = g; c.beginPath(); c.arc(0, -428, 40, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.font = '500 38px InterV'; c.textAlign = 'center'; c.fillText('M', 0, -414);
  c.font = '500 25px InterV, "Noto Color Emoji"'; c.fillStyle = '#fff'; c.fillText('Mom ❤️ ›', 0, -346);
  handset(c, 205, -428, 34, '#0a84ff');
  if (o.tap > 0 && o.tap < 1) { c.fillStyle = `rgba(255,255,255,${.35 * (1 - o.tap)})`; c.beginPath(); c.arc(205, -428, 30 + 40 * o.tap, 0, TAU); c.fill(); }
  c.fillStyle = 'rgba(235,235,245,.45)'; c.font = '500 21px InterV'; c.fillText('Yesterday 22:41', 0, -120);
  const bub = (txt, right, y) => { c.font = '400 31px InterV'; const tw = c.measureText(txt).width + 44, x = right ? 244 - tw : -244;
    rrect(c, x, y, tw, 66, 33); c.fillStyle = right ? '#0a84ff' : '#262628'; c.fill(); c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText(txt, x + 22, y + 44); c.textAlign = 'center'; };
  bub('on my way home', true, -95);
  c.fillStyle = 'rgba(235,235,245,.45)'; c.font = '500 21px InterV'; c.fillText('22:43', 0, 10);
  bub('call me when you get home', false, 30);
  c.fillStyle = 'rgba(235,235,245,.35)'; c.font = '500 19px InterV'; c.textAlign = 'right'; c.fillText('Read 22:43', 238, 125); c.textAlign = 'center';
  rrect(c, -230, 470, 460, 58, 29); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 2; c.stroke();
  c.fillStyle = 'rgba(235,235,245,.3)'; c.font = '400 24px InterV'; c.textAlign = 'left'; c.fillText('Message', -205, 507); c.textAlign = 'center';
}
function callScreen(c, w, h, o) {
  const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#2b3442'); g.addColorStop(.6, '#1c222c'); g.addColorStop(1, '#3a3330'); c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h);
  c.textAlign = 'center';
  const ga = c.createLinearGradient(0, -420, 0, -200); ga.addColorStop(0, '#a3a8b4'); ga.addColorStop(1, '#6e7380'); c.fillStyle = ga; c.beginPath(); c.arc(0, -310, 105, 0, TAU); c.fill();
  c.fillStyle = '#fff'; c.font = '500 96px InterV'; c.fillText('M', 0, -276);
  c.font = '500 52px InterV, "Noto Color Emoji"'; c.fillText('Mom ❤️', 0, -120);
  const dots = '.'.repeat(1 + Math.floor((o.t || 0) * 2) % 3);
  c.fillStyle = 'rgba(235,235,245,.6)'; c.font = '400 30px InterV'; c.fillText('calling' + dots.padEnd(3, ' '), 0, -70);
  [[-160, 'speaker'], [0, 'FaceTime'], [160, 'mute']].forEach(([x, lb]) => { c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.arc(x, 230, 56, 0, TAU); c.fill();
    c.fillStyle = 'rgba(235,235,245,.7)'; c.font = '400 20px InterV'; c.fillText(lb, x, 320); });
  c.fillStyle = '#ff3b30'; c.beginPath(); c.arc(0, 430, 62, 0, TAU); c.fill(); handset(c, 0, 432, 46, '#fff');
}
// phone in its own local coords (560×1150, centered)
function phone(c, o) {
  const w = 560, h = 1150;
  c.fillStyle = '#040405'; rrect(c, -w / 2 + 4, -h / 2 + 14, w, h, 92); c.fill();
  const fr = c.createLinearGradient(-w / 2, 0, w / 2, 0); fr.addColorStop(0, '#2a2d33'); fr.addColorStop(.5, '#17191d'); fr.addColorStop(1, '#2c2f35');
  c.fillStyle = fr; rrect(c, -w / 2, -h / 2, w, h, 92); c.fill();
  c.save(); rrect(c, -w / 2 + 15, -h / 2 + 15, w - 30, h - 30, 78); c.clip();
  c.fillStyle = '#040506'; c.fillRect(-w / 2, -h / 2, w, h);
  if (o.on > 0.002) {
    c.save(); c.globalAlpha = o.on;
    wallpaper(c, w, h);
    c.textAlign = 'center';
    c.fillStyle = 'rgba(255,255,255,.86)'; c.font = '500 34px InterV'; c.fillText(o.day || WALL.day, 0, -398);
    c.fillStyle = 'rgba(255,255,255,.94)'; c.font = '600 200px InterV'; c.letterSpacing = '-6px'; c.fillText(o.time, 0, -206); c.letterSpacing = '0px';
    if (o.banner) banner(c, o.banner);
    if (o.thread > 0) { c.save(); c.translate((1 - eo(o.thread)) * 540, 0); threadScreen(c, w, h, o); c.restore(); }
    if (o.call > 0) { c.save(); c.globalAlpha *= o.call; callScreen(c, w, h, o); c.restore(); }
    // lock-screen buttons + home bar
    c.fillStyle = 'rgba(255,255,255,.14)';
    c.beginPath(); c.arc(-190, 440, 44, 0, TAU); c.arc(190, 440, 44, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.75)'; rrect(c, -95, 528, 190, 9, 5); c.fill();
    c.restore();
  }
  if (o.glare) { // sky reflection on glass
    const g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, `rgba(255,255,255,${o.glare})`); g.addColorStop(.42, 'rgba(255,255,255,0)'); g.addColorStop(.62, 'rgba(255,255,255,0)'); g.addColorStop(.75, `rgba(255,255,255,${o.glare * .5})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h);
  }
  c.restore();
  c.fillStyle = '#000'; rrect(c, -86, -h / 2 + 34, 172, 50, 25); c.fill();
}
function paperCup(c, x, y, s, o = {}) { // base center at (x,y), height ≈ 1.6*s
  c.save(); c.translate(x, y); c.scale(s, s);
  const lit = o.lit || hex('#f4ece2'), sh = o.shade || hex('#b9b1a8');
  const g = c.createLinearGradient(-0.5, 0, 0.5, 0); g.addColorStop(0, rgb(sh)); g.addColorStop(.35, rgb(lit)); g.addColorStop(.8, rgb(mix(lit, sh, .4))); g.addColorStop(1, rgb(sh));
  c.beginPath(); c.moveTo(-0.38, 0); c.lineTo(-0.5, -1.45); c.lineTo(0.5, -1.45); c.lineTo(0.38, 0); c.closePath(); c.fillStyle = g; c.fill();
  // sleeve
  c.beginPath(); c.moveTo(-0.43, -0.42); c.lineTo(-0.47, -1.02); c.lineTo(0.47, -1.02); c.lineTo(0.43, -0.42); c.closePath();
  const g2 = c.createLinearGradient(-0.5, 0, 0.5, 0); g2.addColorStop(0, '#6b4d36'); g2.addColorStop(.35, '#a37a55'); g2.addColorStop(1, '#5d4230');
  c.fillStyle = g2; c.fill();
  // lid
  c.fillStyle = rgb(mix(lit, [255, 255, 255], .2)); rrect(c, -0.56, -1.6, 1.12, 0.17, 0.06); c.fill();
  c.fillStyle = rgb(sh); rrect(c, -0.46, -1.7, 0.92, 0.12, 0.05); c.fill();
  c.restore();
}
function steam(c, x, y, s, t, a) {
  c.save(); c.globalCompositeOperation = 'screen'; c.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const ph = (t * 0.32 + i * 0.21) % 1, rise = ph * 1.0, sp = (i - 2) * 0.09;
    c.beginPath();
    for (let k = 0; k <= 12; k++) {
      const u = k / 12, yy = y - (rise + u * 0.55) * s, xx = x + (noise1(t * 0.7 + u * 2.4 + i * 3.1, 5) * 0.16 + sp) * s * (0.4 + u * 1.4);
      k ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
    }
    c.strokeStyle = `rgba(255,250,242,${a * 0.22 * Math.sin(Math.PI * ph)})`; c.lineWidth = s * (0.03 + ph * 0.05); c.stroke();
  }
  c.restore();
}
function drops(c, seed, x0, y0, x1, y1, n, t, o = {}) { // rain drops on glass
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    let x = lerp(x0, x1, r()), y = lerp(y0, y1, r()); const rad = lerp(2, 7.5, Math.pow(r(), 2.2)) * (o.scale || 1);
    const runner = r() < .06; if (runner) { const sp = 18 + r() * 30; y = y0 + ((y - y0 + t * sp) % (y1 - y0));
      c.strokeStyle = `rgba(220,235,245,${.10 * (o.a || 1)})`; c.lineWidth = rad * .6; c.beginPath(); c.moveTo(x, y - 60 * (o.scale || 1)); c.lineTo(x, y); c.stroke(); }
    c.fillStyle = `rgba(25,35,45,${.18 * (o.a || 1)})`; c.beginPath(); c.ellipse(x, y, rad, rad * 1.1, 0, 0, TAU); c.fill();
    c.fillStyle = `rgba(255,248,236,${.55 * (o.a || 1)})`; c.beginPath(); c.arc(x + rad * .3, y - rad * .35, rad * .32, 0, TAU); c.fill();
    c.fillStyle = `rgba(255,248,236,${.18 * (o.a || 1)})`; c.beginPath(); c.arc(x - rad * .2, y + rad * .45, rad * .5, 0, TAU); c.fill();
  }
}
function godRays(c, x, y, n, len, a, t, seed = 1, spread = 1.1, base = Math.PI / 2) {
  c.save(); c.globalCompositeOperation = 'screen';
  for (let i = 0; i < n; i++) {
    const ang = base + (i / (n - 1) - .5) * spread + noise1(t * .15 + i * 4.1, seed) * .05;
    const wdt = .025 + hash(i * 9.1 + seed) * .05, al = a * (0.4 + 0.6 * (0.5 + 0.5 * noise1(t * .4 + i * 2.3, seed + 3)));
    const g = c.createRadialGradient(x, y, 0, x, y, len); g.addColorStop(0, rgb(P.sunWarm, al)); g.addColorStop(1, rgb(P.sunWarm, 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(x, y);
    c.lineTo(x + Math.cos(ang - wdt) * len, y + Math.sin(ang - wdt) * len); c.lineTo(x + Math.cos(ang + wdt) * len, y + Math.sin(ang + wdt) * len); c.closePath(); c.fill();
  }
  c.restore();
}

// ======================================================================
// S1 — phone on the nightstand, in the dark
// ======================================================================
function s1(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#020304'; ctx.fillRect(0, 0, W, H);
  const on = ss(inv(E.screen_wake, E.screen_wake + .28, t));
  const p = eio(inv(0.1, 3.7, t)), pr = eio(inv(0.1, 3.95, t));
  const grab = spring(t - E.grab, 1.7, .55), whip = ei(inv(E.whip, E.whip + .34, t));
  const s = lerp(0.58, 1.66, p) * (1 + .03 * ss(inv(3.7, 7.2, t))) * (1 + .12 * grab);
  const fy = lerp(0.40, 1, pr), rot = lerp(-0.5, 0, pr) + (t > E.grab ? .025 * noise1(t * .9, 7) : 0) + .6 * whip;
  const hand = t > E.grab ? 1 : 0, cx = lerp(620, 540, p) + 6 * Math.sin(t * .5) + hand * 7 * noise1(t * 1.3, 2), cy = lerp(1230, 990, p) - 30 * grab + hand * 6 * noise1(t * 1.1, 5) - 2600 * whip;
  let jx = 0, jy = 0, jr = 0, creep = 0;
  for (const b of E.buzz) {
    const u = inv(b, b + .46, t);
    if (u > 0 && u < 1) { const env = Math.sin(Math.PI * u); jx += (hash(t * 977) - .5) * 9 * env; jy += (hash(t * 977 + 3) - .5) * 6 * env; jr += (hash(t * 977 + 9) - .5) * .008 * env; }
    creep += 7 * ss(u);
  }
  const cr = Math.cos(rot), sr = Math.sin(rot);
  const M = [s * cr, fy * s * sr, -s * sr, fy * s * cr, cx, cy];
  const toS = (x, y) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]];
  const sun = .55 * ss(inv(0, 1.6, t)); // warm sliver through the curtain gap
  // wall above the back edge of the nightstand
  const a = toS(-5000, -780), b = toS(5000, -780);
  ctx.save(); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0], -6000); ctx.lineTo(a[0], -6000); ctx.closePath(); ctx.clip();
  ctx.fillStyle = '#07090c'; ctx.fillRect(-600, -6000, W + 1200, 12000);
  const pc = toS(0, -100), ey = (a[1] + b[1]) / 2;
  glow(ctx, pc[0], ey, 1000, hex('#86acd2'), .13 * on);
  const sl = toS(330, -780)[0] + 40;
  const g = ctx.createLinearGradient(sl - 40, 0, sl + 40, 0);
  g.addColorStop(0, 'rgba(255,190,120,0)'); g.addColorStop(.5, `rgba(255,196,128,${sun * .55})`); g.addColorStop(1, 'rgba(255,190,120,0)');
  ctx.fillStyle = g; ctx.globalAlpha = .6; ctx.fillRect(sl - 40, ey - 1500, 80, 1500); ctx.globalAlpha = 1;
  ctx.restore();
  // nightstand plane
  ctx.save(); ctx.setTransform(...M);
  ctx.fillStyle = '#20160f'; ctx.fillRect(-5000, -780, 10000, 8000);
  ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 3;
  for (let i = 0; i < 70; i++) { const y0 = -770 + i * 42; ctx.beginPath(); for (let x = -2600; x <= 2600; x += 130) { const y = y0 + Math.sin(x * .0021 + i * 1.7) * 9 + Math.sin(x * .0007 + i) * 14; x === -2600 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fillRect(-5000, -780, 10000, 10); // edge highlight
  // sun stripe across the wood
  ctx.save(); ctx.rotate(-.18); const sg = ctx.createLinearGradient(0, 360, 0, 470);
  sg.addColorStop(0, 'rgba(255,190,120,0)'); sg.addColorStop(.5, `rgba(255,200,135,${sun * .5})`); sg.addColorStop(1, 'rgba(255,190,120,0)');
  ctx.fillStyle = sg; ctx.fillRect(-4000, 360, 8000, 110); ctx.restore();
  // darkness falloff + screen light pool
  const dk = ctx.createRadialGradient(0, -60, 200, 0, -60, 1500);
  dk.addColorStop(0, `rgba(2,3,4,${.9 - .75 * on})`); dk.addColorStop(.6, `rgba(2,3,4,${.96 - .3 * on})`); dk.addColorStop(1, 'rgba(2,3,4,.98)');
  ctx.fillStyle = dk; ctx.fillRect(-5000, -780, 10000, 8000);
  ctx.globalCompositeOperation = 'lighter'; glow(ctx, 0, -40, 900, hex('#6f93bd'), .16 * on); ctx.globalCompositeOperation = 'source-over';
  // glass of water
  ctx.save(); ctx.translate(-610, -470);
  ctx.fillStyle = `rgba(150,180,210,${.05 + .06 * on})`; ctx.beginPath(); ctx.arc(0, 0, 112, 0, TAU); ctx.fill();
  ctx.strokeStyle = `rgba(190,215,240,${.05 + .22 * on})`; ctx.lineWidth = 5; ctx.stroke();
  ctx.strokeStyle = `rgba(230,240,255,${.08 + .35 * on})`; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, 100, -.4, .9); ctx.stroke();
  ctx.restore();
  // phone
  ctx.translate(jx + creep, jy); ctx.rotate(jr);
  ctx.fillStyle = 'rgba(0,0,0,.6)'; rrect(ctx, -300, -590, 600, 1200, 110); ctx.fill();
  let bnr = null;
  if (t > E.banner_in) {
    const sp = spring(t - E.banner_in, 1.5, .5);
    bnr = { y: lerp(-760, -40, sp), alpha: inv(E.banner_in, E.banner_in + .12, t), icon: 'cal', title: '9:00 Meeting', body: 'starts in 2 minutes', when: 'now' };
  }
  if (whip > 0) ctx.filter = `blur(${(whip * 40).toFixed(1)}px)`;
  phone(ctx, { on, time: '8:58', banner: bnr, glare: .05 + .04 * (1 - p) });
  ctx.filter = 'none'; ctx.restore();
  if (whip > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(0,0,0,${ss(inv(E.whip + .05, E.whip + .4, t))})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

// ======================================================================
// S2 — curtains open: the empty city + title
// ======================================================================
const WIN = { x0: 150, x1: 930, y0: 330, y1: 1640 };
const SKY2 = { far: genSkyline(11, -260, 1360, 80, 360, 40, 120), mid: genSkyline(23, -300, 1400, 120, 430, 70, 170) };
function skyLayer(c, sunX, sunY, o = {}) {
  vgrad(c, -1500, -1500, W + 3000, H + 3000, [[0, o.top || P.skyTop], [.42, o.top || P.skyTop], [.56, P.skyMid], [.7, P.skyLow], [1, P.skyLow]]);
  c.save(); c.globalCompositeOperation = 'screen'; glow(c, sunX, sunY, o.r || 900, P.sunWarm, o.a || .55); glow(c, sunX, sunY, 120, P.sun, 1); c.restore();
}
function clouds(c, seed, t, y0, y1, n, a) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = lerp(-300, 1400, r()) + t * (6 + r() * 6), y = lerp(y0, y1, r()), w = lerp(160, 420, r()), h = w * lerp(.12, .22, r());
    c.fillStyle = `rgba(255,252,246,${a * .45 * (0.4 + r() * .6)})`;
    for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(x + (k - 2) * w * .3 + r() * 40, y + (r() - .5) * h * 1.2, w * (.5 + r() * .5), h * (.25 + r() * .2), 0, 0, TAU); c.fill(); }
  }
}
function s2(t) {
  const lt = t - TL.scenes.s2_window[0], dur = TL.scenes.s2_window[1] - TL.scenes.s2_window[0];
  const open = eo(inv(E.curtain_open, E.curtain_open + 1.55, t));
  const light = ss(inv(E.curtain_open - .1, E.curtain_open + 1.1, t));
  const p = eio(inv(E.curtain_open + .3, TL.scenes.s2_window[1] + .3, t));
  cam.z = 255 * p; cam.x = 55 * p; cam.y = 150 * p; cam.roll = lerp(.012, -.006, p);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  // ---- outside (through the window) ----
  ctx.save(); planeTf(ctx, 900); ctx.beginPath(); ctx.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0); ctx.restore(); ctx.save(); ctx.clip();
  const sunX = 880, sunY = 930;
  L(20000, 0, c => skyLayer(c, sunX, sunY, { r: 1000, a: .6 }));
  L(14000, 7, c => clouds(c, 5, t, 380, 760, 8, .7));
  L(8000, 0, c => { drawCached(c, cached('s2far', 1660, 1920, 1, g => { g.translate(260, 0); drawSkyline(g, SKY2.far, 1230, { shadow: mix(P.hazeCool, P.skyLow, .35), lit: mix(P.haze, P.sun, .4), litFrac: .28, sunSide: 1, extra: 700 }); }), -260, 0);
    c.save(); c.globalCompositeOperation = 'screen'; glow(c, sunX, 1150, 700, P.sunWarm, .35); c.restore(); });
  L(3500, 0, c => {
    drawCached(c, cached('s2mid', 1700, 1920, 1, g => { g.translate(300, 0); drawSkyline(g, SKY2.mid, 1405, { shadow: mix(P.shadow, P.hazeCool, .5), lit: mix(P.lit, P.haze, .35), litFrac: .3, sunSide: 1, win: .5, winCol: mix(P.shadow, P.skyMid, .3), cell: 16, row: 22, rim: P.sunWarm, extra: 600 }); }), -300, 0);
    vgrad(c, -400, 980, 1900, 440, [[0, P.haze, 0], [1, P.haze, .45]]);
    // far street with a bus that is right on schedule
    c.fillStyle = rgb(mix(P.shadow, P.haze, .35)); c.fillRect(-400, 1385, 1900, 30);
    const bx = -120 + ((lt * 70) % 1500);
    c.fillStyle = rgb(mix(hex('#e9e5dc'), P.haze, .2)); rrect(c, bx, 1372, 74, 20, 4); c.fill();
    c.fillStyle = rgb(mix(P.shadowDeep, P.haze, .25)); c.fillRect(bx + 6, 1376, 62, 7);
    for (const lx of [210, 760]) { const g = Math.floor((lt + lx * .001) / 2.2) % 2 === 0; c.fillStyle = g ? '#5dffa0' : '#ff5a4a'; c.beginPath(); c.arc(lx, 1366, 2.6, 0, TAU); c.fill();
      c.save(); c.globalCompositeOperation = 'screen'; glow(c, lx, 1366, 14, g ? hex('#5dffa0') : hex('#ff5a4a'), .7); c.restore(); }
  });
  L(1800, 0.6, c => { // the street below: a bus arrives on time, opens its doors, nobody gets in
    c.translate(540, 1480); c.scale(1.4, 1.4); c.translate(-540, -1480);
    c.fillStyle = rgb(mix(P.shadow, P.shadowDeep, .3)); c.fillRect(-400, 1405, 1900, 40);
    c.fillStyle = rgb(P.litPale); c.fillRect(-400, 1440, 1900, 16); // far sidewalk
    vgrad(c, -400, 1456, 1900, 120, [[0, P.wet], [1, mix(P.wet, P.shadowDeep, .3)]]);
    vgrad(c, -400, 1456, 1900, 60, [[0, P.skyLow, .35], [1, P.skyLow, 0]]);
    c.fillStyle = rgb(P.litPale, .7); for (let x = -400; x < 1500; x += 120) c.fillRect(x, 1514, 60, 4);
    c.fillStyle = rgb(hex('#dedbd3'), .8); for (let x = 130; x < 250; x += 20) c.fillRect(x, 1458, 11, 116);
    c.fillStyle = rgb(P.lit); c.fillRect(-400, 1576, 1900, 20); c.fillStyle = rgb(mix(P.shadow, P.ink, .2)); c.fillRect(-400, 1596, 1900, 120);
    // shelter
    c.fillStyle = rgb(P.shadowDeep); c.fillRect(560, 1398, 120, 6); c.fillRect(562, 1398, 4, 44); c.fillRect(674, 1398, 4, 44); c.fillStyle = 'rgba(210,225,235,.25)'; c.fillRect(566, 1404, 108, 36);
    // traffic light
    const g = t > E.win_light; c.fillStyle = rgb(P.shadowDeep); c.fillRect(808, 1330, 5, 112); c.fillRect(800, 1318, 22, 46);
    c.fillStyle = g ? '#3a3a3a' : '#ff4b3e'; c.beginPath(); c.arc(811, 1330, 5, 0, TAU); c.fill(); c.fillStyle = g ? '#46f0a0' : '#2c3a33'; c.beginPath(); c.arc(811, 1352, 5, 0, TAU); c.fill();
    c.save(); c.globalCompositeOperation = 'screen'; glow(c, 811, g ? 1352 : 1330, 26, g ? hex('#46f0a0') : hex('#ff4b3e'), .8); c.restore();
    // bus
    const u = inv(E.wbus_arrive, E.wbus_stop, t), bx = 545 + 900 * Math.pow(1 - u, 2), doors = ss(inv(E.wbus_doors, E.wbus_doors + .5, t));
    c.fillStyle = 'rgba(20,28,36,.3)'; c.fillRect(bx + 6, 1512, 250, 10);
    rrect(c, bx, 1452, 260, 62, [14, 6, 4, 6]); c.fillStyle = '#ebe8e1'; c.fill();
    c.fillStyle = '#2e6f70'; c.fillRect(bx, 1496, 260, 10);
    c.fillStyle = 'rgba(40,52,62,.75)'; c.fillRect(bx + 6, 1458, 248, 26); c.fillStyle = 'rgba(255,240,215,.5)'; c.fillRect(bx + 22, 1458 + 6, 222, 4);
    c.fillStyle = doors > .5 ? '#fff1d8' : '#c9c4ba'; c.fillRect(bx + 28, 1458, 22 + 6 * doors, 48); c.fillRect(bx + 138, 1458, 22 + 6 * doors, 48);
    c.fillStyle = '#16191c'; for (const wx of [52, 210]) { c.beginPath(); c.arc(bx + wx, 1514, 11, 0, TAU); c.fill(); }
  });
  L(900, 0, c => drops(c, 77, WIN.x0, WIN.y0, WIN.x1, WIN.y1, 70, lt, { a: .3 + .7 * light }));
  ctx.restore();
  // ---- room ----
  L(900, 0, c => {
    c.beginPath(); c.rect(-1500, -1500, W + 3000, H + 3000); c.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
    c.fillStyle = rgb(mix(hex('#07080a'), hex('#4a3d35'), light)); c.fill('evenodd');
    c.save(); c.globalCompositeOperation = 'screen'; glow(c, 640, 1100, 1300, hex('#8a6b52'), .55 * light); c.restore();
    // frame + sill
    c.strokeStyle = rgb(mix(hex('#141414'), hex('#d8d0c4'), light)); c.lineWidth = 22; c.strokeRect(WIN.x0 - 11, WIN.y0 - 11, WIN.x1 - WIN.x0 + 22, WIN.y1 - WIN.y0 + 22);
    c.fillStyle = rgb(mix(hex('#141414'), hex('#f1dcc0'), light)); c.fillRect(WIN.x0 - 60, WIN.y1 + 10, WIN.x1 - WIN.x0 + 120, 26);
    c.fillStyle = rgb(mix(hex('#060606'), hex('#6d584a'), light)); c.fillRect(WIN.x0 - 60, WIN.y1 + 36, WIN.x1 - WIN.x0 + 120, 40);
  });
  // curtains
  L(860, 1.0, c => {
    const lx0 = lerp(118, 40, open), lx1 = lerp(545, 262, open), rx0 = lerp(535, 818, open), rx1 = lerp(962, 1040, open);
    const panel = (x0, x1, side) => {
      const n = 9, g = c.createLinearGradient(x0, 0, x1, 0);
      for (let i = 0; i <= n; i++) { const u = i / n, v = .5 + .5 * Math.cos(u * Math.PI * 2 * 4.5 + side);
        g.addColorStop(u, rgb(mix(mix(hex('#140f0c'), hex('#5c4434'), .55 + .45 * v), mix(hex('#9b7d64'), hex('#e3cbb0'), v), light * .85))); }
      c.fillStyle = g; c.fillRect(x0, 250, x1 - x0, 1420);
      // backlit edge facing the light
      const ex = side > 0 ? x0 : x1; const eg = c.createLinearGradient(ex - 18, 0, ex + 18, 0);
      eg.addColorStop(0, 'rgba(255,200,140,0)'); eg.addColorStop(.5, `rgba(255,210,150,${.75 - .45 * light})`); eg.addColorStop(1, 'rgba(255,200,140,0)');
      c.fillStyle = eg; c.fillRect(ex - 18, 250, 36, 1420);
    };
    panel(lx0, lx1, -1); panel(rx0, rx1, 1);
    c.fillStyle = rgb(mix(hex('#0b0b0b'), hex('#6b5a4c'), light)); c.fillRect(0, 236, W, 16);
  });
  // light beams + dust
  L(720, 0, c => {
    c.save(); c.globalCompositeOperation = 'screen';
    const g = c.createLinearGradient(700, 400, 250, 1900); g.addColorStop(0, rgb(P.sunWarm, .22 * light)); g.addColorStop(1, rgb(P.sunWarm, 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(520, WIN.y0); c.lineTo(WIN.x1, WIN.y0); c.lineTo(760, 1950); c.lineTo(-200, 1950); c.closePath(); c.fill();
    const r = rng(9);
    for (let i = 0; i < 60; i++) { const x = lerp(150, 900, r()) + noise1(lt * .3 + i, 2) * 40 - lt * 6, y = lerp(500, 1800, r()) + noise1(lt * .25 + i * 3, 4) * 50;
      c.fillStyle = `rgba(255,236,210,${(.25 + .5 * r()) * light})`; c.beginPath(); c.arc(x, y, 1.2 + r() * 2.2, 0, TAU); c.fill(); }
    c.restore();
  });
  // exposure bloom as the eyes adjust
  const flash = ss(inv(E.curtain_open, E.curtain_open + .5, t)) * (1 - ss(inv(E.curtain_open + .5, E.curtain_open + 2.0, t)));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgb(P.sunWarm, .35 * flash); ctx.fillRect(0, 0, W, H); ctx.restore();
  // hero, out of focus, the camera slips past the shoulder
  L(420, lerp(5, 18, p), c => heroBust(c, lerp(-430, 330, eo(inv(E.hero_enter, E.hero_enter + 1.2, t))), 1330 + 16 * (1 - eo(inv(E.hero_enter, E.hero_enter + 1.2, t))) * Math.abs(Math.sin(t * 10)), 330, { t: lt, wind: .2, tilt: .1 * ss(inv(E.hero_tilt, E.hero_tilt + .9, t)), rim: P.sunWarm, rimA: .85 * light, rimDx: .04, rimDy: 0, col: hex('#0d1015') }));
}

// ======================================================================
// S3 — the avenue (3D-lite, backlit, wet asphalt)
// ======================================================================
const AV = (() => {
  const r = rng(314), B = [];
  for (const side of [-1, 1]) {
    let z = 3;
    while (z < 430) {
      const len = lerp(14, 34, r()), h = lerp(13, 44, Math.pow(r(), 1.3)) + (z > 200 ? 10 : 0);
      const xi = side * (10.5 + r() * 1.2);
      B.push({ side, xi, z0: z, z1: z + len, h, awn: r() < .45 ? [hex('#4f7a76'), hex('#b0644a'), hex('#c2a25a'), hex('#5d6b8a')][(r() * 4) | 0] : null, s: (r() * 1e6) | 0 });
      z += len + (r() < .22 ? lerp(5, 10, r()) : 0.4);
    }
  }
  const trees = [], lamps = [];
  for (const side of [-1, 1]) { for (let z = 12 + (side > 0 ? 9 : 0); z < 260; z += 24) trees.push({ x: side * 8.7, z, s: hash(z * side) }); for (let z = 22; z < 300; z += 30) lamps.push({ x: side * 7.25, z }); }
  const puddles = [[3.3, 17, 2.3, 3.6], [-4.6, 27, 1.4, 2.2], [1.2, 50, 3.2, 5.2], [-1.5, 86, 2.5, 6]];
  const streaks = []; const r2 = rng(5); for (let i = 0; i < 90; i++) streaks.push([r2(), r2(), r2()]);
  return { B, trees, lamps, puddles, streaks };
})();
const fogc = (col, z, fd = 150, hz = P.haze) => mix(col, hz, 1 - Math.exp(-Math.max(0, z) / fd));
function s3(t) {
  const lt = t - TL.scenes.s3_avenue[0], dur = TL.scenes.s3_avenue[1] - TL.scenes.s3_avenue[0];
  const p = eio2(inv(-.3, dur, lt));
  Object.assign(c3, { x: lerp(.7, -.1, p), y: lerp(1.5, 1.2, p), z: lerp(0, 3.4, p), pitch: lerp(.035, .05, p), yaw: .012 * Math.sin(lt * .35), roll: lerp(.014, -.006, p), f: 1250, hy: .55 });
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = rgb(P.skyLow); ctx.fillRect(0, 0, W, H);
  ctx.save(); roll3Tf(ctx);
  const sun = pt3([2.5, 26, 700]) || [W / 2, 500];
  vgrad(ctx, -400, -400, W + 800, H + 800, [[0, P.skyTop], [.32, P.skyMid], [.44, P.skyLow], [1, P.skyLow]]);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; glow(ctx, sun[0], sun[1], 950, P.sunWarm, .7); glow(ctx, sun[0], sun[1], 140, P.sun, 1); ctx.restore();
  // distant skyline at the end of the avenue
  const fr = rng(8);
  for (let i = 0; i < 26; i++) { const x = lerp(-60, 60, i / 25) + fr() * 3, w = 4 + fr() * 7, h = 20 + fr() * 70; poly3(ctx, [[x, 0, 620], [x + w, 0, 620], [x + w, h, 620], [x, h, 620]], rgb(mix(P.hazeCool, P.haze, .55))); }
  // ground
  const groundFar = 900;
  poly3(ctx, [[-10.6, 0, .3], [10.6, 0, .3], [10.6, 0, groundFar], [-10.6, 0, groundFar]], rgb(P.wet));
  { // fog on ground by depth (screen-space gradient from horizon to bottom)
    const hz = pt3([0, 0, c3.z + groundFar]) || [0, H * .5], nb = pt3([0, 0, c3.z + 2]) || [0, H];
    const g = ctx.createLinearGradient(0, hz[1], 0, nb[1]);
    [[0, 600], [.04, 160], [.12, 60], [.3, 22], [.6, 8], [1, 2]].forEach(([o, z]) => g.addColorStop(o, rgb(fogc(P.wet, z, 120), 1)));
    ctx.save(); path3(ctx, [[-7, 0, .3], [7, 0, .3], [7, 0, groundFar], [-7, 0, groundFar]]); ctx.fillStyle = g; ctx.fill();
    const g2 = ctx.createLinearGradient(0, hz[1], 0, nb[1]);
    [[0, 600], [.05, 160], [.15, 60], [.4, 22], [1, 2]].forEach(([o, z]) => g2.addColorStop(o, rgb(fogc(hex('#76838f'), z, 120), 1)));
    for (const sd of [-1, 1]) { path3(ctx, [[sd * 7, 0, .3], [sd * 10.6, 0, .3], [sd * 10.6, 0, groundFar], [sd * 7, 0, groundFar]]); ctx.fillStyle = g2; ctx.fill();
      poly3(ctx, [[sd * 6.85, .15, .3], [sd * 7.0, .15, .3], [sd * 7.0, .15, groundFar], [sd * 6.85, .15, groundFar]], rgb(P.litPale, .5)); }
    ctx.restore();
  }
  // markings
  for (let z = 3; z < 400; z += 9) poly3(ctx, [[-.09, 0, z], [.09, 0, z], [.09, 0, z + 3.6], [-.09, 0, z + 3.6]], rgb(fogc(hex('#d9d6cf'), z - c3.z, 130), .85));
  for (const sd of [-1, 1]) poly3(ctx, [[sd * 6.4, 0, .3], [sd * 6.55, 0, .3], [sd * 6.55, 0, 600], [sd * 6.4, 0, 600]], rgb(fogc(hex('#cfccc5'), 30, 130), .7));
  for (let x = -6.2; x < 6.3; x += 1.05) poly3(ctx, [[x, 0, 31], [x + .55, 0, 31], [x + .55, 0, 35], [x, 0, 35]], rgb(fogc(hex('#dedbd3'), 31 - c3.z, 130), .82));
  poly3(ctx, [[-6.4, 0, 29.6], [0, 0, 29.6], [0, 0, 30.1], [-6.4, 0, 30.1]], rgb(fogc(hex('#dedbd3'), 29 - c3.z, 130), .8));
  // puddles reflecting the bright sky
  AV.puddles.forEach(([px, pz, rx, rz], i) => {
    const pts = []; for (let k = 0; k < 24; k++) { const a = k / 24 * TAU; pts.push([px + Math.cos(a) * rx * (1 + .12 * Math.sin(a * 3 + i)), 0, pz + Math.sin(a) * rz]); }
    poly3(ctx, pts, rgb(fogc(mix(P.skyLow, P.wet, .28), pz - c3.z, 260), .6));
  });
  { // ripples in the nearest puddles
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 6; k++) {
      const tk = (lt + k * .47) % 1.6, [px, pz] = AV.puddles[k % 3], cx = px + (hash(k) - .5) * 1.4, cz = pz + (hash(k + 4) - .5) * 1.4;
      const rr = .05 + tk * .55, pts = []; for (let j = 0; j < 20; j++) { const a = j / 20 * TAU; pts.push([cx + Math.cos(a) * rr, 0.01, cz + Math.sin(a) * rr]); }
      if (path3(ctx, pts)) { ctx.strokeStyle = `rgba(80,95,110,${.5 * (1 - tk / 1.6)})`; ctx.stroke(); }
    }
  }
  // wet glare streak toward the sun
  { const hz = pt3([2.5, 0, 650]); if (hz) {
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const g = ctx.createLinearGradient(0, hz[1], 0, H); g.addColorStop(0, rgb(P.sunWarm, .85)); g.addColorStop(.25, rgb(P.sunWarm, .38)); g.addColorStop(1, rgb(P.sunWarm, .05));
    ctx.beginPath(); ctx.moveTo(hz[0] - 14, hz[1]); ctx.lineTo(hz[0] + 14, hz[1]); ctx.lineTo(W / 2 + 330, H + 100); ctx.lineTo(W / 2 - 300, H + 100); ctx.closePath(); ctx.clip();
    ctx.fillStyle = g; ctx.fillRect(0, hz[1], W, H);
    for (const [a, b, c] of AV.streaks) { const y = lerp(hz[1], H, Math.pow(a, 1.8)); ctx.fillStyle = rgb(P.sun, .25 * c); ctx.fillRect(0, y, W, 1 + b * 3 * (y - hz[1]) / 400); }
    ctx.restore(); } }
  // vertical things, painter-sorted far → near
  const items = [];
  for (const b of AV.B) items.push({ z: b.z0, f: () => building(b) });
  for (const tr of AV.trees) items.push({ z: tr.z, f: () => tree(tr, lt) });
  for (const l of AV.lamps) items.push({ z: l.z, f: () => lamp(l) });
  items.push({ z: 36, f: () => trafficLight(7.45, 36, t) }, { z: 36.2, f: () => trafficLight(-7.45, 36.2, t) });
  items.push({ z: 46, f: () => clockSign(t) });
  const eff = lt - clamp(t - E.walk_pause[0], 0, E.walk_pause[1] - E.walk_pause[0]), wk = 1 - ss(inv(E.walk_pause[0] - .3, E.walk_pause[0], t)) + ss(inv(E.walk_pause[1] - .2, E.walk_pause[1] + .2, t));
  const hz = 8.6 + .72 * eff, hxw = .45 + .08 * Math.sin(eff * .7), head = ss(inv(19.6, 20.3, t)) - 2 * ss(inv(21.7, 22.4, t)) + ss(inv(23.3, 23.9, t));
  items.push({ z: hz, f: () => {
    poly3(ctx, [[hxw - .2, .01, hz], [hxw + .22, .01, hz], [hxw + .6, .01, hz - 7], [hxw - .1, .01, hz - 7]], 'rgba(30,40,52,.34)');
    const ft = pt3([hxw, 0, hz]), hd = pt3([hxw, 1.76, hz]);
    if (ft && hd) heroStanding(ctx, ft[0], ft[1], ft[1] - hd[1], rgb(fogc(P.ink, hz - c3.z, 160)), { rim: rgb(P.sunWarm, .85), walk: clamp(wk), phase: eff * TAU * .85, head });
  } });
  items.sort((a, b) => b.z - a.z).forEach(it => it.f());
  godRays(ctx, sun[0], sun[1], 7, 2600, .07, lt, 3, 1.3);
  ctx.restore();
}
function building(b) {
  const zc = b.z0 - c3.z, s = b.side, xi = b.xi, xo = xi + s * 22;
  const lit = s < 0, faceCol = lit ? hex('#c7a385') : hex('#56697b'), frontCol = hex('#4a5b6c');
  // inner face with depth fog gradient
  if (path3(ctx, [[xi, 0, b.z0], [xi, 0, b.z1], [xi, b.h, b.z1], [xi, b.h, b.z0]])) {
    const a = pt3([xi, b.h * .5, Math.max(b.z0, c3.z + .5)]), e = pt3([xi, b.h * .5, b.z1]);
    if (a && e) { const g = ctx.createLinearGradient(a[0], a[1], e[0], e[1]); g.addColorStop(0, rgb(fogc(faceCol, b.z0 - c3.z))); g.addColorStop(1, rgb(fogc(faceCol, b.z1 - c3.z))); ctx.fillStyle = g; }
    else ctx.fillStyle = rgb(fogc(faceCol, zc));
    ctx.fill();
  }
  // windows on the inner face (near ones only)
  if (zc < 190) {
    const r = rng(b.s), wcol = lit ? hex('#6f7f8e') : hex('#a9bcc6');
    for (let y = 4.4; y < b.h - 1.2; y += 3.3) for (let z = b.z0 + 1; z < b.z1 - 1.6; z += 3.1) {
      const v = r(), zz = z - c3.z; if (zz < .5) continue;
      const col = v < .07 && lit ? P.sun : wcol;
      poly3(ctx, [[xi + s * -.02, y, z], [xi + s * -.02, y, z + 1.5], [xi + s * -.02, y + 1.9, z + 1.5], [xi + s * -.02, y + 1.9, z]], rgb(fogc(col, zz), .9));
    }
    // ground-floor shopfront + awning
    poly3(ctx, [[xi - s * .02, .3, b.z0 + .6], [xi - s * .02, .3, b.z1 - .6], [xi - s * .02, 3.3, b.z1 - .6], [xi - s * .02, 3.3, b.z0 + .6]], rgb(fogc(hex('#2e3a46'), zc), .95));
    if (b.awn) poly3(ctx, [[xi, 3.9, b.z0 + 1], [xi, 3.9, b.z1 - 1], [xi - s * 1.3, 3.3, b.z1 - 1], [xi - s * 1.3, 3.3, b.z0 + 1]], rgb(fogc(b.awn, zc)));
  }
  // sunlit roof rim
  poly3(ctx, [[xi, b.h - .35, b.z0], [xi, b.h - .35, b.z1], [xi, b.h, b.z1], [xi, b.h, b.z0]], rgb(fogc(P.sunWarm, zc, 220), lit ? .95 : .55));
  // front face (toward camera, in shadow)
  if (zc > .3) poly3(ctx, [[xi, 0, b.z0], [xo, 0, b.z0], [xo, b.h, b.z0], [xi, b.h, b.z0]], rgb(fogc(frontCol, zc)));
  if (zc > .3) poly3(ctx, [[xi, b.h - .3, b.z0], [xo, b.h - .3, b.z0], [xo, b.h, b.z0], [xi, b.h, b.z0]], rgb(fogc(P.sunWarm, zc, 220), .6));
}
function tree(tr, lt) {
  const zc = tr.z - c3.z; if (zc < .6) return;
  poly3(ctx, [[tr.x - .1, 0, tr.z], [tr.x + .1, 0, tr.z], [tr.x + .1, 3.2, tr.z], [tr.x - .1, 3.2, tr.z]], rgb(fogc(hex('#3a3430'), zc)));
  const c = pt3([tr.x, 4.6, tr.z]); if (!c) return; const sc = c3.f / c[2];
  const sway = noise1(lt * .6 + tr.z, 4) * .12 * sc;
  const col = fogc(hex('#3f5a53'), zc), rimc = fogc(P.sunWarm, zc, 200);
  [[0, 0, 1.9], [-1, .5, 1.3], [1.1, .4, 1.3], [-.4, -1.0, 1.25], [.6, -.8, 1.2]].forEach(([dx, dy, rr]) => {
    ctx.fillStyle = rgb(rimc, .7); ctx.beginPath(); ctx.arc(c[0] + dx * sc + sway + .06 * sc, c[1] + dy * sc - .07 * sc, rr * sc, 0, TAU); ctx.fill();
    ctx.fillStyle = rgb(col); ctx.beginPath(); ctx.arc(c[0] + dx * sc + sway, c[1] + dy * sc, rr * sc, 0, TAU); ctx.fill();
  });
}
function lamp(l) {
  const zc = l.z - c3.z; if (zc < .5) return; const s = Math.sign(l.x), col = rgb(fogc(hex('#2f3640'), zc));
  poly3(ctx, [[l.x - .07, 0, l.z], [l.x + .07, 0, l.z], [l.x + .07, 7.6, l.z], [l.x - .07, 7.6, l.z]], col);
  poly3(ctx, [[l.x, 7.5, l.z], [l.x - s * 1.6, 7.5, l.z], [l.x - s * 1.6, 7.62, l.z], [l.x, 7.62, l.z]], col);
  poly3(ctx, [[l.x - s * 1.3, 7.35, l.z], [l.x - s * 1.9, 7.35, l.z], [l.x - s * 1.9, 7.55, l.z], [l.x - s * 1.3, 7.55, l.z]], col);
}
function trafficLight(x, z, t) {
  const zc = z - c3.z; if (zc < .5) return; const col = rgb(fogc(hex('#272c33'), zc, 200));
  poly3(ctx, [[x - .07, 0, z], [x + .07, 0, z], [x + .07, 3.4, z], [x - .07, 3.4, z]], col);
  poly3(ctx, [[x - .23, 3.3, z], [x + .23, 3.3, z], [x + .23, 4.6, z], [x - .23, 4.6, z]], col);
  const green = t > E.avenue_light;
  [[4.3, hex('#ff4b3e'), !green], [3.95, hex('#ffb340'), false], [3.6, hex('#46f0a0'), green]].forEach(([y, c, on]) => {
    const q = pt3([x, y, z - .01]); if (!q) return; const r = .13 * c3.f / q[2];
    ctx.fillStyle = on ? rgb(c) : 'rgba(20,24,28,.9)'; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, TAU); ctx.fill();
    if (on) { ctx.save(); ctx.globalCompositeOperation = 'screen'; glow(ctx, q[0], q[1], r * 9, c, .8); ctx.restore(); }
  });
}
function clockSign(t) {
  const z = 46, a = pt3([-9.75, 5.6, z]), b = pt3([-8.0, 4.55, z]); if (!a || !b) return;
  ctx.fillStyle = rgb(fogc(hex('#1d2329'), z - c3.z, 200)); ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  const flip = t > E.clock_flip, hgt = b[1] - a[1];
  ctx.save(); ctx.font = `600 ${(hgt * .62).toFixed(1)}px InterV`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffb35c'; ctx.shadowColor = 'rgba(255,170,80,.9)'; ctx.shadowBlur = hgt * .4;
  ctx.fillText(flip ? '09:04' : '09:03', (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + hgt * .04); ctx.restore();
  ctx.fillStyle = rgb(fogc(hex('#2a2f35'), z - c3.z, 200)); const m = pt3([-10.5, 5.1, z]); if (m) ctx.fillRect(m[0], m[1] - 2, a[0] - m[0], 4);
}

// ======================================================================
// S4 — the bus stop
// ======================================================================
const BUS = { d: 1300, len: 1800, top: 1005, bot: 1472, stopX: 150, accel: 1700 };
function busFrontX(t) {
  if (t < E.bus_stop) { const u = inv(E.bus_arrive, E.bus_stop, t); return BUS.stopX + 1130 * Math.pow(1 - u, 2.2); }
  if (t < E.bus_depart) return BUS.stopX;
  const d = t - E.bus_depart; return BUS.stopX - .5 * BUS.accel * d * d;
}
function busSpeed(t) { return (busFrontX(t - .004) - busFrontX(t + .004)) / .008; }
function busPitch(t) {
  if (t < E.bus_stop) return -.011 * ss(inv(E.bus_stop - 1.3, E.bus_stop, t));
  if (t < E.bus_depart) { const d = t - E.bus_stop; return -.011 * Math.exp(-3.2 * d) * Math.cos(TAU * 1.3 * d); }
  return .006 * ss(inv(E.bus_depart, E.bus_depart + .5, t)) * (1 - .6 * ss(inv(E.bus_depart + .5, E.bus_depart + 1.5, t)));
}
function s4cam(t) {
  const lt = t - TL.scenes.s4_bus[0];
  cam.x = lerp(110, 0, eo(inv(0, E.bus_stop - TL.scenes.s4_bus[0] + .4, lt))) - 30 * ss(inv(2.6, 6.4, lt)) - 150 * ei(inv(E.bus_depart, E.bus_depart + 1.6, t));
  cam.z = 70 * eio2(inv(0, 8, lt)); cam.y = -10 * lt / 8; cam.roll = lerp(-.006, .004, lt / 8);
}
function busRearScreenX(t) { s4cam(t); return planePt(busFrontX(t) + BUS.len, 1200, BUS.d)[0]; }
function drawBus(c, t) {
  const fx = busFrontX(t), doors = ss(inv(E.bus_doors_open, E.bus_doors_open + .55, t)) * (1 - ss(inv(E.bus_doors_close, E.bus_doors_close + .5, t)));
  const len = BUS.len, top = BUS.top, bot = BUS.bot, hgt = bot - top - 40;
  c.save(); c.translate(fx + len / 2, bot); c.rotate(busPitch(t)); c.translate(-len / 2, -bot);
  // body
  rrect(c, 0, top, len, hgt, [70, 26, 14, 30]); c.fillStyle = '#ebe8e1'; c.fill();
  const shade = c.createLinearGradient(0, top, 0, top + hgt); shade.addColorStop(0, 'rgba(255,255,255,.25)'); shade.addColorStop(.6, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(40,50,60,.25)');
  c.fillStyle = shade; c.fill();
  c.fillStyle = '#2e6f70'; c.fillRect(0, top + hgt - 110, len, 62); c.fillStyle = '#26292e'; c.fillRect(8, top + hgt - 48, len - 16, 48);
  // window band with an empty, lit interior
  const wy0 = top + 46, wy1 = top + 262;
  c.save(); rrect(c, 12, wy0, len - 30, wy1 - wy0, [56, 8, 8, 18]); c.clip();
  c.fillStyle = '#d8cdb9'; c.fillRect(0, wy0, len, wy1 - wy0);
  vgrad(c, 0, wy0, len, wy1 - wy0, [[0, hex('#fff1d8'), .9], [.55, hex('#cbbfa9'), .6], [1, hex('#8a8172'), .9]]);
  for (let x = 330; x < len - 80; x += 150) { c.fillStyle = '#2f5d61'; rrect(c, x, wy1 - 78, 92, 100, 18); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x + 6, wy1 - 72, 80, 6); }
  c.fillStyle = '#d9b23a'; for (const x of [300, 905, 1150]) c.fillRect(x, wy0, 7, wy1 - wy0);
  vgrad(c, 0, wy0, len, 50, [[0, P.shadowDeep, .35], [1, P.shadowDeep, 0]]);
  // facade reflections sliding on glass
  c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) { const x = ((i * 260 - fx * .35) % (len + 400) + len + 400) % (len + 400) - 200; c.fillStyle = `rgba(255,236,210,${.10 + .05 * (i % 3)})`;
    c.beginPath(); c.moveTo(x, wy0); c.lineTo(x + 110, wy0); c.lineTo(x + 40, wy1); c.lineTo(x - 70, wy1); c.fill(); }
  c.globalCompositeOperation = 'source-over';
  c.restore();
  c.fillStyle = '#1f2327'; for (let x = 470; x < len - 60; x += 300) c.fillRect(x, wy0, 16, wy1 - wy0);
  // windshield nose
  c.fillStyle = 'rgba(30,40,48,.55)'; rrect(c, 12, wy0, 70, hgt - 160, [56, 0, 0, 10]); c.fill();
  // destination sign
  c.fillStyle = '#121416'; rrect(c, 360, top + 10, 300, 32, 4); c.fill();
  c.fillStyle = '#ffae3d'; c.font = '600 22px InterV'; c.textAlign = 'left'; c.shadowColor = 'rgba(255,160,60,.8)'; c.shadowBlur = 8; c.fillText('12   Central', 376, top + 34); c.shadowBlur = 0;
  // doors (front + middle): leaves slide apart, interior revealed
  for (const dx of [120, 905]) {
    c.fillStyle = '#efe3cc'; c.fillRect(dx, wy0, 220, hgt - 70);
    vgrad(c, dx, wy0, 220, hgt - 70, [[0, hex('#fff4e0'), .8], [1, hex('#9d917c'), .9]]);
    c.fillStyle = '#d9b23a'; c.fillRect(dx + 105, wy0, 8, hgt - 70);
    c.fillStyle = '#6d6a63'; c.fillRect(dx, top + hgt - 58, 220, 12);
    for (const sd of [-1, 1]) {
      const lx = dx + (sd < 0 ? 0 : 110) + sd * 100 * doors;
      c.fillStyle = '#d7d3ca'; c.fillRect(lx, wy0 - 6, 110, hgt - 62);
      c.fillStyle = 'rgba(38,48,58,.62)'; rrect(c, lx + 12, wy0 + 6, 86, hgt - 150, 10); c.fill();
      c.fillStyle = 'rgba(255,240,220,.16)'; c.fillRect(lx + 18, wy0 + 12, 14, hgt - 165);
    }
    c.fillStyle = '#9aa3aa'; c.fillRect(dx - 4, wy0 - 10, 228, 6);
  }
  c.fillStyle = '#c6c2ba'; c.fillRect(0, top + 12, len, 4);
  c.restore();
  // wheels (not pitched)
  for (const wx of [360, 1420]) {
    const x = fx + wx, y = bot - 70, ang = -fx / 70;
    c.fillStyle = '#121417'; c.beginPath(); c.arc(x, y, 92, Math.PI, 0); c.fill();
    c.fillStyle = '#17191c'; c.beginPath(); c.arc(x, y, 72, 0, TAU); c.fill();
    c.fillStyle = '#868d94'; c.beginPath(); c.arc(x, y, 42, 0, TAU); c.fill();
    c.fillStyle = '#4b5056'; for (let k = 0; k < 6; k++) { const a = ang + k * TAU / 6; c.beginPath(); c.arc(x + Math.cos(a) * 26, y + Math.sin(a) * 26, 6, 0, TAU); c.fill(); }
  }
}
const busAcc = mk(W, H), busActx = busAcc.getContext('2d');
const FAC4 = genSkyline(41, -500, 1800, 280, 520, 220, 330);
function s4(t) {
  const lt = t - TL.scenes.s4_bus[0];
  s4cam(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  L(20000, 0, c => vgrad(c, -900, -900, W + 1800, H + 1800, [[0, P.skyTop], [.35, P.skyMid], [.5, P.skyLow], [1, P.skyLow]]));
  L(20000, 0, c => { c.globalCompositeOperation = 'screen'; glow(c, -120, 250, 900, P.sunWarm, .6); });
  L(7000, 1.2, c => drawCached(c, cached('s4far', 2600, 1300, 1, g => { g.translate(800, 0); drawSkyline(g, genSkyline(43, -800, 1800, 120, 380, 60, 140), 760, { shadow: mix(P.hazeCool, P.skyLow, .4), lit: mix(P.haze, P.sun, .4), litFrac: .35, sunSide: -1, extra: 600 }); }), -800, 0));
  // facades across the street, lit by the low sun from the left
  L(2600, 1.6, c => drawCached(c, cached('s4fac', 2700, 1400, 1, g => {
    g.translate(800, 0);
    for (const b of FAC4) {
      const top = 1180 - b.h, r = rng(b.s), base = mix(P.lit, [255, 255, 255], r() * .2);
      g.fillStyle = rgb(base); g.fillRect(b.x, top, b.w, b.h);
      g.fillStyle = rgb(mix(base, P.shadow, .45)); g.fillRect(b.x + b.w - 26, top, 26, b.h); // side in shade
      g.fillStyle = rgb(mix(base, P.shadow, .35)); for (let y = top + 90; y < 1080; y += 96) g.fillRect(b.x, y, b.w, 6);
      for (let y = top + 34; y < 1060; y += 96) for (let x = b.x + 22; x < b.x + b.w - 50; x += 54) {
        g.fillStyle = rgb(mix(P.skyMid, P.shadow, .35 + r() * .25)); g.fillRect(x, y, 28, 46);
        g.fillStyle = rgb(mix(base, P.shadow, .55)); g.fillRect(x + 28, y + 4, 4, 46); g.fillRect(x + 4, y + 46, 28, 4);
      }
      g.fillStyle = rgb(mix(P.shadowDeep, P.skyMid, .25)); g.fillRect(b.x + 14, 1090, b.w - 40, 90);
      if (r() < .6) { g.fillStyle = rgb([hex('#4f7a76'), hex('#b0644a'), hex('#c2a25a')][(r() * 3) | 0]); g.beginPath(); g.moveTo(b.x + 10, 1076); g.lineTo(b.x + b.w - 30, 1076); g.lineTo(b.x + b.w - 20, 1100); g.lineTo(b.x, 1100); g.fill(); }
    }
    g.fillStyle = rgb(P.litPale); g.fillRect(-800, 1180, 2700, 30);
    g.fillStyle = rgb(mix(P.shadow, P.litPale, .4)); g.fillRect(-800, 1206, 2700, 8);
  }), -800, 0));
  // wet road
  L(1700, 0, c => {
    vgrad(c, -900, 1214, W + 1800, 420, [[0, mix(P.wet, P.skyLow, .35)], [.3, P.wet], [1, mix(P.wet, P.shadowDeep, .3)]]);
    c.fillStyle = rgb(P.litPale, .55); for (let x = -900; x < 2000; x += 260) c.fillRect(x, 1285, 120, 5);
  });
  // bus with per-layer motion blur (sub-frame accumulation)
  const v = Math.abs(busSpeed(t)), n = v > 140 ? Math.min(9, 3 + Math.round(v / 300)) : 1, sh = 1 / 120;
  busActx.setTransform(1, 0, 0, 1, 0, 0); busActx.clearRect(0, 0, W, H);
  for (let i = 0; i < n; i++) {
    const ti = t + (n > 1 ? (i / (n - 1) - .5) * sh : 0);
    sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, W, H); sctx.save(); s4cam(ti); planeTf(sctx, BUS.d); drawBus(sctx, ti); sctx.restore();
    busActx.globalAlpha = 1 / (i + 1); busActx.drawImage(scr, 0, 0);
  }
  s4cam(t); busActx.globalAlpha = 1;
  // reflection on the wet road, then the bus itself
  { const yl = planePt(0, BUS.bot, BUS.d)[1];
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath(); ctx.rect(0, yl, W, H - yl); ctx.clip();
    ctx.globalAlpha = .3; ctx.filter = 'blur(5px)'; ctx.translate(0, yl * 2); ctx.scale(1, -1); ctx.drawImage(busAcc, 0, 0); ctx.restore(); }
  L(BUS.d, 0, c => { vgrad(c, -900, BUS.bot - 30, W + 1800, 70, [[0, P.ink, 0], [.5, P.ink, .25], [1, P.ink, 0]]); });
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(busAcc, 0, 0); ctx.restore();
  // near sidewalk + shelter glass + live display (slightly soft: focus is on the bus)
  L(900, 2.2, c => {
    vgrad(c, -900, 1560, W + 1800, 600, [[0, hex('#9aa2a6')], [.04, hex('#c8c3b8')], [.06, hex('#8e979e')], [1, hex('#59646e')]]);
    c.fillStyle = rgb(P.litPale, .8); c.fillRect(-900, 1556, W + 1800, 10);
  });
  L(840, 2.6, c => {
    c.fillStyle = 'rgba(205,225,235,.10)'; c.fillRect(760, 940, 600, 760);
    c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(255,245,230,.10)'; c.beginPath(); c.moveTo(800, 940); c.lineTo(900, 940); c.lineTo(820, 1700); c.lineTo(760, 1700); c.fill(); c.restore();
    c.fillStyle = '#2b3138'; c.fillRect(752, 920, 16, 800); c.fillRect(740, 905, 700, 34);
    c.fillStyle = rgb(P.lit); c.fillRect(740, 905, 700, 5);
    c.fillStyle = '#39414a'; c.fillRect(800, 1530, 400, 22); c.fillRect(830, 1552, 12, 120); c.fillRect(1150, 1552, 12, 120);
  });
  L(640, 7, c => heroBust(c, 960, 1470, 190, { t, wind: .4, torso: 2.6, tilt: -.06 * ss(inv(E.bus_doors_open + .4, E.bus_doors_open + 1.2, t)), rim: P.sunWarm, rimA: .8, rimDx: -.035, rimDy: 0, col: hex('#161a21') }));
  L(760, 1.6, c => { // e-ink departure board on a pole
    c.fillStyle = '#2a2f35'; c.fillRect(205, 1240, 22, 700);
    rrect(c, 70, 1080, 300, 170, 14); c.fillStyle = '#1b1f24'; c.fill();
    rrect(c, 84, 1094, 272, 142, 8); c.fillStyle = '#0c0e10'; c.fill();
    c.textAlign = 'left'; c.fillStyle = '#ffae3d'; c.shadowColor = 'rgba(255,160,60,.7)'; c.shadowBlur = 10;
    c.font = '700 40px InterV'; c.fillText('12', 102, 1150); c.font = '500 30px InterV'; c.fillText('Central', 165, 1148);
    const now = t > E.bus_stop - .9, blink = now && Math.floor(t * 2.4) % 2 === 0;
    c.font = '600 32px InterV'; c.fillStyle = now ? (blink ? '#ffd27a' : '#ffae3d') : '#ffae3d'; c.fillText(now ? 'Now' : '1 min', 102, 1210); c.shadowBlur = 0;
  });
}

// ======================================================================
// S5 — pedestrian signal ticking for nobody
// ======================================================================
const GROUND5 = 1470;
function walkMan(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = .11;
  c.beginPath(); c.arc(.05, -.78, .1, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(.02, -.6); c.lineTo(-.04, -.12); c.stroke();
  c.beginPath(); c.moveTo(-.04, -.12); c.lineTo(-.26, .32); c.moveTo(-.04, -.12); c.lineTo(.14, .1); c.lineTo(.2, .34); c.stroke();
  c.beginPath(); c.moveTo(.02, -.52); c.lineTo(-.22, -.24); c.moveTo(.02, -.52); c.lineTo(.24, -.3); c.stroke(); c.restore();
}
function standMan(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineWidth = .12;
  c.beginPath(); c.arc(0, -.8, .1, 0, TAU); c.fill();
  c.beginPath(); c.moveTo(-.13, -.62); c.lineTo(.13, -.62); c.lineTo(.13, -.1); c.lineTo(-.13, -.1); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(-.07, -.1); c.lineTo(-.07, .34); c.moveTo(.07, -.1); c.lineTo(.07, .34); c.moveTo(-.2, -.58); c.lineTo(-.22, -.16); c.moveTo(.2, -.58); c.lineTo(.22, -.16); c.stroke(); c.restore();
}
function signalArt(c, t) {
  const green = t > E.signal_green, gOn = green ? (.8 + .2 * ss(inv(E.signal_green, E.signal_green + .06, t))) : 0, rOn = green ? 0 : 1;
  // pole
  const pg = c.createLinearGradient(468, 0, 524, 0); pg.addColorStop(0, '#9aa3ab'); pg.addColorStop(.3, '#59626b'); pg.addColorStop(1, '#2a3036');
  c.fillStyle = pg; c.fillRect(468, -200, 56, GROUND5 + 200);
  // housing
  rrect(c, 350, 290, 300, 610, 16); c.fillStyle = '#20252b'; c.fill();
  c.fillStyle = 'rgba(255,240,220,.18)'; c.fillRect(352, 296, 8, 596);
  for (const [y0, on, red] of [[310, rOn, true], [610, gOn, false]]) {
    rrect(c, 380, y0, 240, 260, 12); c.fillStyle = '#0b0d10'; c.fill();
    c.fillStyle = '#20252b'; c.beginPath(); c.moveTo(370, y0 - 6); c.lineTo(630, y0 - 6); c.lineTo(612, y0 + 26); c.lineTo(388, y0 + 26); c.fill(); // visor
    const col = red ? hex('#ff4a36') : hex('#5dfcb0');
    const dim = red ? 'rgba(80,30,25,.55)' : 'rgba(25,70,55,.55)';
    if (red) standMan(c, 500, y0 + 150, 150, on > 0 ? rgb(col, .45 + .55 * on) : dim); else walkMan(c, 500, y0 + 150, 150, on > 0 ? rgb(col, .45 + .55 * on) : dim);
    if (on > 0) { c.save(); c.globalCompositeOperation = 'screen'; glow(c, 500, y0 + 140, 330, col, .55 * on); c.restore(); }
  }
  // push-button box (accessible signal)
  rrect(c, 400, 1000, 190, 250, 14); c.fillStyle = '#2b3036'; c.fill();
  rrect(c, 425, 1030, 140, 120, 10); c.fillStyle = '#e9e4da'; c.fill();
  c.fillStyle = '#1b1f24'; c.beginPath(); c.moveTo(445, 1090); c.lineTo(505, 1060); c.lineTo(505, 1078); c.lineTo(545, 1078); c.lineTo(545, 1102); c.lineTo(505, 1102); c.lineTo(505, 1120); c.closePath(); c.fill();
  const tick = tickPhase(t); c.fillStyle = tick ? '#ffd36a' : '#5a5040'; c.beginPath(); c.arc(495, 1195, 13, 0, TAU); c.fill();
  if (tick) { c.save(); c.globalCompositeOperation = 'screen'; glow(c, 495, 1195, 60, hex('#ffd36a'), .8); c.restore(); }
  c.fillStyle = '#1b1f24'; for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) { c.beginPath(); c.arc(440 + i * 14, 1192 + j * 16, 3, 0, TAU); c.fill(); }
}
function tickTimes() {
  const s0 = TL.scenes.s5_signal[0] - .5, s1e = TL.scenes.s5_signal[1], out = [];
  for (let x = s0; x < E.signal_green; x += 1.0) out.push(x);
  for (let x = E.signal_green + .05; x < s1e + .3; x += .118) out.push(x);
  return out;
}
let _ticks = null;
function tickPhase(t) { _ticks = _ticks || tickTimes(); return _ticks.some(x => t >= x && t < x + .05); }
function s5(t) {
  const lt = t - TL.scenes.s5_signal[0], dur = 5.2, p = eio2(inv(-.2, dur, lt));
  cam.x = lerp(-80, 70, p); cam.z = lerp(0, 95, p); cam.y = lerp(0, -18, p); cam.roll = lerp(.022, -.01, p);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  L(9000, 0, c => vgrad(c, -900, -900, W + 1800, H + 1800, [[0, P.skyTop], [.3, P.skyMid], [.48, P.skyLow], [1, P.skyLow]]));
  L(6000, 16, c => { c.globalCompositeOperation = 'source-over';
    drawSkyline(c, genSkyline(51, -500, 1600, 200, 600, 120, 260), 1260, { shadow: mix(P.shadow, P.haze, .45), lit: mix(P.lit, P.haze, .2), litFrac: .45, sunSide: -1, win: .4, cell: 30, row: 40, extra: 400 });
    c.globalCompositeOperation = 'screen'; glow(c, 80, 700, 800, P.sunWarm, .55); });
  L(2600, 7, c => { // the crossing, at grazing angle
    vgrad(c, -900, 1250, W + 1800, 230, [[0, mix(P.wet, P.haze, .5)], [1, P.wet]]);
    c.fillStyle = rgb(mix(hex('#dedbd3'), P.haze, .3), .8); for (let i = 0; i < 6; i++) { const y = 1270 + i * i * 6 + i * 10; c.fillRect(-900, y, W + 1800, 4 + i * 2.2); }
  });
  L(1200, 1.5, c => vgrad(c, -900, GROUND5, W + 1800, 700, [[0, mix(P.wet, P.skyLow, .2)], [1, mix(P.wet, P.shadowDeep, .4)]]));
  // puddle with the rippled reflection of the signal
  const drop = t - E.drop;
  sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, W, H); sctx.save(); planeTf(sctx, 700); signalArt(sctx, t); sctx.restore();
  { const gy = planePt(0, GROUND5, 700)[1];
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath(); ctx.ellipse(560, gy + 230, 640, 200, 0, 0, TAU); ctx.clip();
    vgrad(ctx, 0, gy, W, 500, [[0, P.skyLow, .65], [1, P.skyMid, .55]]);
    ctx.globalAlpha = .55;
    const amp0 = 2.5 + (drop > 0 ? 16 * Math.exp(-drop * 1.6) : 0);
    for (let y = 0; y < 470; y += 3) { const off = Math.sin(y * .075 - t * 5) * amp0 * (1 + y / 300) + Math.sin(y * .21 + t * 2.3) * 1.2; ctx.drawImage(scr, 0, gy - y - 3, W, 3, off, gy + y, W, 3); }
    ctx.globalAlpha = 1; vgrad(ctx, 0, gy, W, 500, [[0, P.shadowDeep, .15], [1, P.shadowDeep, .45]]);
    if (drop > 0 && drop < 2.2) for (let k = 0; k < 3; k++) { const rr = (drop - k * .18) * 260; if (rr <= 0) continue; ctx.strokeStyle = `rgba(255,248,236,${.4 * Math.max(0, 1 - drop / 2.2)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(610, gy + 150, rr, rr * .22, 0, 0, TAU); ctx.stroke(); }
    ctx.restore(); }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(scr, 0, 0); ctx.restore();
  // falling drop from the visor
  if (drop > -.45 && drop < 0) { const u = (drop + .45) / .45; L(700, 0, c => { c.fillStyle = 'rgba(235,245,255,.85)'; c.beginPath(); c.ellipse(612, lerp(900, GROUND5 + 120, u * u), 6, 13, 0, 0, TAU); c.fill(); }); }
}

// ======================================================================
// S6 — café: OPEN sign, the machine pours an order for nobody
// ======================================================================
const CAFE = { x0: 110, x1: 970, y0: 470, y1: 1560 };
function s6cam(t) { const p = eio(inv(TL.scenes.s6_cafe[0], TL.scenes.s6_cafe[0] + 2.2, t)); cam.z = 770 * p + 40 * ss(inv(TL.scenes.s6_cafe[0] + 2.2, TL.scenes.s6_cafe[1], t)); cam.x = lerp(-50, 18, p); cam.y = lerp(40, 70, p); cam.roll = lerp(-.01, .004, p); }
function machineArt(c, t) {
  const grind = t > E.grind[0] && t < E.grind[1], jit = grind ? (hash(t * 913) - .5) * 1.2 : 0;
  c.save(); c.translate(jit, 0);
  rrect(c, 395, 800, 290, 450, 22); const g = c.createLinearGradient(395, 0, 685, 0); g.addColorStop(0, '#2b2f34'); g.addColorStop(.4, '#3d4248'); g.addColorStop(1, '#1d2024'); c.fillStyle = g; c.fill();
  c.fillStyle = 'rgba(255,230,200,.25)'; c.fillRect(397, 806, 5, 438);
  const ready = t > E.ready; const strip = ready ? `rgba(110,240,160,${.6 + .4 * Math.exp(-(t - E.ready) * 2)})` : 'rgba(255,190,120,.55)';
  c.fillStyle = strip; c.fillRect(420, 1012, 240, 5);
  // display
  rrect(c, 425, 830, 230, 160, 10); c.fillStyle = '#0c1014'; c.fill();
  c.textAlign = 'left'; c.fillStyle = '#e9eef2'; c.font = '600 27px InterV'; c.fillText('Order #214', 443, 872);
  c.font = '400 19px InterV'; c.fillStyle = 'rgba(233,238,242,.6)'; c.fillText('Oat flat white · for Sam', 443, 900);
  let st = 'Queued', pr = 0;
  if (t > E.grind[0]) { st = 'Grinding'; pr = .15 + .25 * inv(E.grind[0], E.grind[1], t); }
  if (t > E.pour[0]) { st = 'Pouring'; pr = .4 + .6 * inv(E.pour[0], E.pour[1], t); }
  if (ready) { st = 'Ready'; pr = 1; }
  c.fillStyle = 'rgba(255,255,255,.12)'; rrect(c, 443, 948, 194, 8, 4); c.fill();
  c.fillStyle = ready ? '#6ef0a0' : '#ffbf7a'; rrect(c, 443, 948, 194 * pr, 8, 4); c.fill();
  c.font = '600 21px InterV'; c.fillStyle = ready ? '#6ef0a0' : '#ffd6a8'; c.fillText(st + (ready ? '  ✓' : ''), 443, 935);
  // group head + spout
  c.fillStyle = '#16191c'; rrect(c, 490, 1030, 100, 40, 8); c.fill(); c.fillStyle = '#7d858c'; c.fillRect(520, 1070, 40, 18); c.fillRect(530, 1088, 20, 14);
  // drip tray
  c.fillStyle = '#121416'; rrect(c, 420, 1225, 240, 22, 6); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(425, 1227, 230, 3);
  c.restore();
  // cup + stream
  paperCup(c, 540, 1226, 72, {});
  if (t > E.pour[0] && t < E.pour[1] + .25) {
    const u = inv(E.pour[0], E.pour[0] + .15, t), endc = inv(E.pour[1], E.pour[1] + .25, t), w = 7 * (1 - endc) + 1;
    const yTop = 1102 + 120 * endc, yBot = lerp(1102, 1112, u) + (1112 - 1102) * 0 + 6;
    c.fillStyle = '#6b3d22'; c.beginPath(); c.moveTo(540 - w / 2, yTop);
    for (let y = yTop; y <= 1112; y += 3) c.lineTo(540 - w / 2 + Math.sin(y * .3 + t * 30) * .8, y);
    c.lineTo(540 + w / 2, 1112); c.lineTo(540 + w / 2, yTop); c.fill(); void yBot;
  }
}
function s6(t) {
  const lt = t - TL.scenes.s6_cafe[0];
  s6cam(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#2a201b'; ctx.fillRect(0, 0, W, H);
  // interior
  L(1900, 2.5, c => {
    vgrad(c, -900, -900, W + 1800, H + 1800, [[0, hex('#3a2c24')], [.5, hex('#4a372b')], [1, hex('#2b211b')]]);
    c.fillStyle = '#5c4535'; for (const y of [700, 900]) c.fillRect(-200, y, 1500, 14);
    const r = rng(3); for (const y of [700, 900]) for (let x = -150; x < 1250; x += 60) { if (r() < .3) continue; c.fillStyle = r() < .5 ? '#bfae98' : '#7f8f8b'; rrect(c, x, y - 28, 22, 28, 4); c.fill(); }
    c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(255,200,140,.22)'; c.beginPath(); c.moveTo(-100, 500); c.lineTo(300, 500); c.lineTo(700, 1500); c.lineTo(250, 1500); c.fill(); c.restore();
  });
  L(1650, 1.5, c => { for (const x of [180, 900]) { c.fillStyle = '#1b1612'; c.fillRect(x - 2, 0, 4, 560); c.beginPath(); c.moveTo(x - 50, 600); c.lineTo(x + 50, 600); c.lineTo(x + 26, 560); c.lineTo(x - 26, 560); c.fill();
    c.save(); c.globalCompositeOperation = 'screen'; glow(c, x, 610, 220, hex('#ffcf8a'), .7); c.restore(); } });
  L(1600, 0, c => { // counter + machine
    c.fillStyle = '#d8c9b4'; c.fillRect(-500, 1248, 2100, 22); c.fillStyle = '#6d5040'; c.fillRect(-500, 1270, 2100, 900);
    c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(255,205,150,.45)'; c.beginPath(); c.moveTo(60, 1248); c.lineTo(380, 1248); c.lineTo(330, 1270); c.lineTo(0, 1270); c.fill(); c.restore();
    machineArt(c, t);
  });
  if (t > E.pour[0] + .5) L(1600, 3, c => steam(c, 540, 1120, 160, t, .7 * ss(inv(E.pour[0] + .5, E.pour[0] + 1.6, t))));
  // OPEN sign hanging in the window
  L(1080, cam.z > 600 ? 3 : .8, c => {
    c.strokeStyle = 'rgba(30,30,30,.8)'; c.lineWidth = 3; c.beginPath(); c.moveTo(250, 470); c.lineTo(250, 585); c.moveTo(500, 470); c.lineTo(500, 585); c.stroke();
    rrect(c, 205, 580, 340, 150, 18); c.fillStyle = 'rgba(15,12,10,.55)'; c.fill();
    const hum = .93 + .07 * Math.sin(t * 21) * Math.sin(t * 3.3);
    c.save(); c.font = '600 108px InterV'; c.textAlign = 'center'; c.lineJoin = 'round'; c.letterSpacing = '6px';
    c.shadowColor = `rgba(255,90,60,${.95 * hum})`; c.shadowBlur = 40; c.strokeStyle = `rgba(255,120,90,${hum})`; c.lineWidth = 9; c.strokeText('OPEN', 378, 696);
    c.shadowBlur = 12; c.strokeStyle = `rgba(255,225,205,${hum})`; c.lineWidth = 3; c.strokeText('OPEN', 378, 696); c.restore();
  });
  // façade with the window cut out
  L(1000, 0, c => {
    c.beginPath(); c.rect(-2000, -2000, W + 4000, H + 4000); c.rect(CAFE.x0, CAFE.y0, CAFE.x1 - CAFE.x0, CAFE.y1 - CAFE.y0);
    c.fillStyle = rgb(P.lit); c.fill('evenodd');
    vgrad(c, -2000, -400, W + 4000, 820, [[0, P.shadow, .5], [1, P.shadow, 0]]);
    c.strokeStyle = '#2f4a44'; c.lineWidth = 30; c.strokeRect(CAFE.x0 - 15, CAFE.y0 - 15, CAFE.x1 - CAFE.x0 + 30, CAFE.y1 - CAFE.y0 + 30);
    c.fillStyle = '#2f4a44'; c.fillRect(CAFE.x0 - 40, CAFE.y1 + 10, CAFE.x1 - CAFE.x0 + 80, 40);
    c.fillStyle = '#26332f'; c.font = 'italic 400 132px "Instrument Serif"'; c.textAlign = 'center'; c.fillText('Café', 540, 360);
    c.font = '500 22px InterV'; c.letterSpacing = '8px'; c.fillStyle = 'rgba(38,51,47,.75)'; c.fillText('COFFEE · DAILY FROM 7', 545, 412); c.letterSpacing = '0px';
  });
  // glass: street reflection + drops, fading as we move through
  const ga = 1 - inv(380, 760, cam.z);
  if (ga > 0) {
    L(1000, 0, c => {
      c.save(); c.beginPath(); c.rect(CAFE.x0, CAFE.y0, CAFE.x1 - CAFE.x0, CAFE.y1 - CAFE.y0); c.clip();
      c.globalCompositeOperation = 'screen'; c.globalAlpha = ga;
      vgrad(c, CAFE.x0, CAFE.y0, CAFE.x1 - CAFE.x0, CAFE.y1 - CAFE.y0, [[0, P.skyMid, .32], [.5, P.skyLow, .12], [1, P.lit, .2]]);
      c.fillStyle = 'rgba(255,250,240,.16)'; c.beginPath(); c.moveTo(600, CAFE.y0); c.lineTo(760, CAFE.y0); c.lineTo(420, CAFE.y1); c.lineTo(260, CAFE.y1); c.fill();
      c.globalCompositeOperation = 'source-over'; drops(c, 33, CAFE.x0, CAFE.y0, CAFE.x1, CAFE.y1, 80, lt, { a: ga });
      c.restore();
    });
  }
}

// ======================================================================
// S7 — the roof: freedom
// ======================================================================
const ROOF = { far: genSkyline(71, -700, 1900, 90, 330, 40, 120), mid: genSkyline(72, -700, 1900, 150, 420, 70, 170), near: genSkyline(73, -800, 2000, 120, 380, 120, 240) };
function citySunLayers(t, blurMul = 0, o = {}) {
  const sx = o.sx || 640, sy = o.sy || 900;
  L(30000, 0, c => skyLayer(c, sx, sy, { top: hex('#86b3cc'), r: 1150, a: .7 }));
  L(15000, 3 * blurMul + 7, c => clouds(c, 12, t, 240, 680, 9, .75));
  L(30000, 0, c => { c.globalCompositeOperation = 'screen'; glow(c, sx, sy, 300, P.sun, .55); glow(c, sx, sy, 70, [255, 255, 255], 1); });
  L(10000, 1 + 22 * blurMul, c => drawCached(c, cached('rfar', 2600, 1900, 1, g => { g.translate(700, 0); drawSkyline(g, ROOF.far, 1170, { shadow: mix(P.hazeCool, P.haze, .45), lit: mix(P.haze, P.sun, .5), litFrac: .15, sunSide: -1, rim: P.sun, extra: 800 }); }), -700, 0));
  L(10000, 0, c => { c.globalCompositeOperation = 'screen'; glow(c, sx, 1150, 900, P.sunWarm, .45); });
  L(5000, 1 + 26 * blurMul, c => drawCached(c, cached('rmid', 2600, 1900, 1, g => { g.translate(700, 0); drawSkyline(g, ROOF.mid, 1330, { shadow: mix(P.shadow, P.hazeCool, .55), lit: mix(P.lit, P.haze, .3), litFrac: .14, sunSide: -1, rim: P.sunWarm, win: .35, winCol: mix(P.shadow, P.hazeCool, .3), cell: 16, row: 22, extra: 800 }); }), -700, 0));
  L(5000, 0, c => vgrad(c, -900, 1000, W + 1800, 600, [[0, P.haze, 0], [1, P.haze, .55]]));
  L(2500, 1 + 30 * blurMul, c => drawCached(c, cached('rnear', 2800, 2300, 1, g => { g.translate(800, 0); drawSkyline(g, ROOF.near, 1560, { shadow: mix(P.shadow, P.shadowDeep, .3), lit: P.lit, litFrac: .12, sunSide: -1, rim: P.sunWarm, win: .5, winCol: mix(P.shadowDeep, P.skyMid, .3), cell: 22, row: 30, extra: 800 }); }), -800, 0));
}
function birds(c, t, t0) {
  const lt = t - t0; if (lt < 0 || lt > 6) return;
  for (let i = 0; i < 17; i++) {
    const ph = hash(i * 3.7), x = lerp(-150, 1250, lt / 5.6) + (hash(i) - .5) * 260 + noise1(lt * .8 + i, 6) * 40, y = 760 - lt * 40 + (hash(i + 9) - .5) * 160 + Math.sin(lt * 2 + i) * 12;
    bird(c, x, y, 9 + ph * 6, lt * (11 + ph * 4) + i, rgb(mix(P.ink, P.shadow, .3), .9));
  }
}
function s7(t) {
  const lt = t - TL.scenes.s7_roof[0], dur = TL.scenes.s7_roof[1] - TL.scenes.s7_roof[0];
  const p = eio(inv(0, dur, lt));
  cam.y = lerp(240, -430, p); cam.z = lerp(130, -270, p); cam.x = lerp(-30, 40, p); cam.roll = lerp(.012, -.008, p);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  citySunLayers(t, 0);
  L(3300, 0, c => birds(c, t, E.birds));
  L(1500, 1, c => { // neighbouring roof
    c.fillStyle = rgb(mix(P.shadowDeep, P.shadow, .4)); c.fillRect(700, 1620, 900, 600); c.fillStyle = rgb(P.lit); c.fillRect(700, 1620, 900, 6);
    c.fillStyle = rgb(P.shadowDeep); c.fillRect(900, 1540, 110, 80); c.fillStyle = rgb(P.sunWarm, .9); c.fillRect(900, 1540, 6, 80);
  });
  L(15000, 0, c => godRays(c, 640, 900, 9, 2400, .14, lt, 7, 1.6), {});
  // ledge
  L(650, 0, c => {
    c.fillStyle = rgb(hex('#d9bd98')); c.fillRect(-1200, 1500, W + 2400, 70);
    vgrad(c, -1200, 1500, W + 2400, 70, [[0, P.sun, .5], [1, P.sun, 0]]);
    c.fillStyle = rgb(hex('#5d6a77')); c.fillRect(-1200, 1570, W + 2400, 1200);
    const r = rng(17); c.fillStyle = 'rgba(60,70,80,.25)'; for (let i = 0; i < 18; i++) { c.beginPath(); c.ellipse(lerp(-600, 1600, r()), 1530 + r() * 30, 40 + r() * 70, 6 + r() * 6, 0, 0, TAU); c.fill(); }
  });
  L(640, 0, c => { paperCup(c, 760, 1520, 52, { lit: hex('#fff3e4'), shade: hex('#b8a99a') }); steam(c, 760, 1430, 110, t, .6); });
  L(700, 0, c => heroBust(c, 470, 1265, 150, { t, wind: 1, torso: 1.62, tilt: .07 * ss(inv(E.exhale, E.exhale + 1.6, t)), rim: P.sun, rimA: .95, rimDx: -.028, rimDy: -.03, col: hex('#1a1f27') }));
}

// ======================================================================
// S7a — the meeting, still waiting for him
// ======================================================================
const SKY_MEET = genSkyline(91, -600, 1700, 500, 1100, 220, 380);
function sMeet(t) {
  const S7 = TL.scenes.s7_meeting, lt = t - S7[0];
  cam.x = 10 * noise1(lt * .7, 1); cam.y = 8 * noise1(lt * .6, 2); cam.roll = .012 * noise1(lt * .5, 3) - .02; cam.z = 40 * lt / 4.5;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  L(30000, 0, c => skyLayer(c, 260, 1000, { top: hex('#86b3cc'), r: 1100, a: .7 }));
  L(9000, 22, c => drawSkyline(c, SKY_MEET, 1560, { shadow: mix(P.lit, P.shadow, .25), lit: P.litPale, litFrac: .3, sunSide: -1, win: .6, winCol: mix(P.skyMid, P.shadow, .3), cell: 40, row: 56, extra: 800 }));
  L(9000, 0, c => { c.globalCompositeOperation = 'screen'; const r = rng(8); for (let i = 0; i < 10; i++) glow(c, lerp(0, 1080, r()), lerp(900, 1700, r()), 50 + r() * 70, P.sun, .25 + r() * .25); });
  L(5000, 18, c => vgrad(c, -900, 1500, W + 1800, 900, [[0, P.wet], [1, P.shadowDeep]]));
  const sw = eio(inv(E.meet_swipe, E.meet_swipe + .35, t));
  L(700, 0, c => {
    c.translate(540, 1010); c.rotate(-.035); c.scale(1.4, 1.4);
    c.fillStyle = 'rgba(10,15,20,.35)'; c.filter = 'blur(18px)'; rrect(c, -270, -560, 580, 1180, 100); c.fill(); c.filter = 'none';
    phone(c, { on: 1, time: '9:12', glare: .1, banner: { y: -40, x: -640 * sw, alpha: 1 - sw, icon: 'cal', title: '9:00 Meeting', body: 'started 12 min ago', when: '9:00', action: 'Join' } });
  });
}

// ======================================================================
// S8 — he opens the thread himself; calls; nobody answers
// ======================================================================
function s8(t) {
  const S8 = TL.scenes.s8_mom, pb = 0, pin = eio2(inv(S8[0], S8[1], t));
  cam.z = 140 + 110 * pin; cam.x = 20 - 10 * pin; cam.y = 120 + 80 * pin; cam.roll = .006 - .004 * pin;
  const cloud = ss(inv(E.cloud[0], E.cloud[1], t));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  citySunLayers(t, 1 - .55 * pb, { sx: 560, sy: 820 });
  L(9000, 0, c => { c.globalCompositeOperation = 'screen'; const r = rng(4); for (let i = 0; i < 12; i++) glow(c, lerp(100, 1000, r()), lerp(700, 1150, r()), 40 + r() * 60, P.sun, (.25 + r() * .25) * (1 - pb)); });
  L(1000, 4 * (1 - pb), c => { vgrad(c, -1900, 860, W + 3800, 40, [[0, P.lit, 0], [1, P.lit, 1]]); });
  L(900, 0, c => {
    vgrad(c, -1900, 890, W + 3800, 2600, [[0, hex('#e6c9a2')], [.25, hex('#d2b48e')], [1, hex('#8f775e')]]);
    const r = rng(23); for (let i = 0; i < 420; i++) { c.fillStyle = `rgba(${r() < .5 ? '255,245,230' : '70,55,40'},${.1 + r() * .12})`; c.fillRect(lerp(-1600, 2700, r()), lerp(900, 3400, r()), 2 + r() * 3, 2 + r() * 3); }
    c.fillStyle = 'rgba(90,80,70,.22)'; c.beginPath(); c.ellipse(300, 1700, 260, 60, -.05, 0, TAU); c.fill();
  });
  L(980, 3.5 * (1 - pb), c => { paperCup(c, 215, 1030, 82, { lit: hex('#fff3e4'), shade: hex('#b8a99a') }); steam(c, 215, 890, 150, t, .3); });
  if (cloud > 0) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply';
    const edge = lerp(W + 700, -700, cloud), g = ctx.createLinearGradient(edge - 500, 0, edge + 500, 0);
    g.addColorStop(0, 'rgba(118,134,160,1)'); g.addColorStop(1, 'rgba(255,255,255,1)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.restore();
  }
  const on = ss(inv(E.screen_on - .05, E.screen_on + .2, t)), thread = inv(E.thread_in, E.thread_in + .38, t), call = ss(inv(E.call_screen, E.call_screen + .3, t));
  L(900, 0, c => {
    c.translate(600, 1300); c.transform(1, 0, 0, .84, 0, 0); c.rotate(.07); c.scale(1.15, 1.15);
    c.fillStyle = 'rgba(40,30,20,.35)'; c.filter = 'blur(10px)'; rrect(c, -270, -555, 580, 1180, 100); c.fill(); c.filter = 'none';
    phone(c, { on, time: '9:31', thread, call, tap: inv(E.call_tap, E.call_tap + .3, t), t: t - E.call_screen, glare: .16 * (1 - .6 * cloud) });
  });
  // hero sitting beside the phone: huge and soft at first, revealed small as the camera pulls away
  L(380, lerp(15, 2, pb), c => {
    c.fillStyle = 'rgba(30,22,15,.35)'; c.beginPath(); c.ellipse(-30, 640 + 3.15 * 250, 300, 50, 0, 0, TAU); c.fill();
    heroBust(c, -40, 640, 250, { t, wind: .7, turn: 1, tilt: .05, torso: 3.15, rim: P.sun, rimA: .7 * (1 - .8 * cloud), rimDx: .03, rimDy: -.03, col: hex('#14181e') });
  });
  const fade = ss(inv(E.fade_black[0], E.fade_black[1], t));
  if (fade > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

// ======================================================================
// S8b — wide: a small figure on the roof, phone at his ear, ringing
// ======================================================================
function s8wide(t) {
  const S = TL.scenes.s8_wide, p = eio2(inv(S[0], S[1], t)), cloud = ss(inv(E.cloud[0], E.cloud[1], t));
  cam.y = lerp(-380, -560, p); cam.z = lerp(-200, -560, p); cam.x = lerp(30, -20, p); cam.roll = lerp(-.006, .004, p);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  citySunLayers(t, 0);
  L(15000, 0, c => godRays(c, 640, 900, 9, 2400, .1 * (1 - .8 * cloud), t - S[0], 7, 1.6));
  L(1500, 1, c => { c.fillStyle = rgb(mix(P.shadowDeep, P.shadow, .4)); c.fillRect(700, 1620, 900, 600); c.fillStyle = rgb(P.lit); c.fillRect(700, 1620, 900, 6);
    c.fillStyle = rgb(P.shadowDeep); c.fillRect(900, 1540, 110, 80); c.fillStyle = rgb(P.sunWarm, .9); c.fillRect(900, 1540, 6, 80); });
  L(650, 0, c => {
    c.fillStyle = rgb(hex('#d9bd98')); c.fillRect(-2400, 1500, W + 4800, 70);
    vgrad(c, -2400, 1500, W + 4800, 70, [[0, P.sun, .5], [1, P.sun, 0]]);
    c.fillStyle = rgb(hex('#5d6a77')); c.fillRect(-2400, 1570, W + 4800, 2400);
  });
  L(640, 0, c => { paperCup(c, 760, 1520, 52, { lit: hex('#fff3e4'), shade: hex('#b8a99a') }); });
  L(700, 0, c => heroBust(c, 470, 1265, 150, { t, wind: 1, torso: 1.62, tilt: .1, phoneArm: true, rim: P.sun, rimA: .9 * (1 - .7 * cloud), rimDx: -.028, rimDy: -.03, col: hex('#1a1f27') }));
  if (cloud > 0) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply';
    const edge = lerp(W + 900, -900, cloud), g = ctx.createLinearGradient(edge - 700, 0, edge + 700, 0);
    g.addColorStop(0, 'rgba(112,128,156,1)'); g.addColorStop(1, 'rgba(255,255,255,1)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over'; ctx.restore();
  }
  const fade = ss(inv(E.fade_black[0], E.fade_black[1], t));
  if (fade > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

// ======================================================================
// S9 — end card
// ======================================================================
function s9(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#050608'; ctx.fillRect(0, 0, W, H);
  const a = ss(inv(E.end_card, E.end_card + .9, t)) * (1 - ss(inv(TL.duration - .8, TL.duration - .05, t)));
  ctx.textAlign = 'center'; ctx.fillStyle = `rgba(255,248,238,${.92 * a})`;
  ctx.font = '400 104px "Instrument Serif"'; ctx.letterSpacing = '18px'; ctx.fillText('STILL OPEN', 549, 930);
  ctx.font = '500 25px InterV'; ctx.letterSpacing = '9px'; ctx.fillStyle = `rgba(255,248,238,${.62 * a})`; ctx.fillText('EP 01  ·  9:00 MEETING', 545, 1005);
  ctx.font = '500 20px InterV'; ctx.letterSpacing = '10px'; ctx.fillStyle = `rgba(255,248,238,${.38 * a})`; ctx.fillText('FOLDSHIFT', 545, 1720);
  ctx.letterSpacing = '0px';
}

// ======================================================================
// captions
// ======================================================================
const VO_DUR = { v01: 1.32, v02: 2.33, v03: 2.08, v04: 1.70, v05: 1.54, v06: 1.76, v07: 2.55, v08: 1.84, v09: 1.48 };
function captions(t) {
  for (const v of TL.vo) {
    const d = (TL.voDur && TL.voDur[v.id]) || VO_DUR[v.id] || 2, t0 = v.t - .12, t1 = v.t + d + .45;
    if (t < t0 || t > t1 + .3) continue;
    const a = ss(inv(t0, t0 + .25, t)) * (1 - ss(inv(t1, t1 + .3, t)));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textAlign = 'center'; ctx.font = 'italic 400 66px "Instrument Serif"';
    const y = (v.t > TL.scenes.s4_bus[0] && v.t < TL.scenes.s4_bus[1] ? 1650 : 1420) - 10 * eo(inv(t0, t0 + .5, t));
    { const g = ctx.createRadialGradient(540, y - 22, 10, 540, y - 22, 520); g.addColorStop(0, `rgba(10,14,20,${.30 * a})`); g.addColorStop(1, 'rgba(10,14,20,0)'); ctx.save(); ctx.translate(540, y - 22); ctx.scale(1, .2); ctx.translate(-540, -(y - 22)); ctx.fillStyle = g; ctx.fillRect(0, y - 560, W, 1080); ctx.restore(); }
    ctx.shadowColor = `rgba(0,0,0,${.55 * a})`; ctx.shadowBlur = 26; ctx.fillStyle = `rgba(255,250,243,${a})`;
    ctx.fillText(v.text, 540, y); ctx.shadowBlur = 6; ctx.shadowColor = `rgba(0,0,0,${.35 * a})`; ctx.fillText(v.text, 540, y);
    ctx.restore();
  }
}

// ======================================================================
// master
// ======================================================================
const CAPTIONS = false; // v2: no subtitles / narration on screen — only the phone UI speaks
function render(t, frame) {
  const S = TL.scenes;
  camReset(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.globalCompositeOperation = 'source-over';
  let po = {};
  if (t < S.s1_phone[1]) { s1(t); po = { bloom: .35, vig: .55, grain: .085 }; }
  else if (t < S.s2_window[1]) { s2(t); po = { bloom: .25 }; }
  else if (t < S.s3_avenue[1]) { s3(t); po = { bloom: .28 }; }
  else if (t < S.s4_bus[1]) {
    const rear = t > E.bus_depart ? busRearScreenX(t) : 9999;
    if (rear < W + 60) { camReset(); s5(t); camReset(); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Math.max(0, rear + 30), H); ctx.clip(); s4(t); ctx.restore(); }
    else s4(t);
    po = { bloom: .22 };
  }
  else if (t < S.s5_signal[1]) { s5(t); po = { bloom: .3 }; }
  else if (t < S.s6_cafe[1]) { s6(t); po = { bloom: .3 }; }
  else if (t < S.s7_meeting[1]) { sMeet(t); po = { bloom: .26 }; }
  else if (t < S.s7_roof[1]) { s7(t); po = { bloom: .32 }; }
  else if (t < S.s8_mom[1]) { s8(t); po = { bloom: .26 }; }
  else if (t < S.s8_wide[1]) { s8wide(t); po = { bloom: .3 }; }
  else { s9(t); po = { bloom: 0, vig: .3, grain: .06 }; }
  post(frame, po);
  if (CAPTIONS) captions(t);
  if (t < .3) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(0,0,0,${1 - t / .3})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

window.EP = {
  ready: (async () => {
    TL = await (await fetch('../timeline.json')).json(); E = TL.events;
    try { TL.voDur = await (await fetch('../vo/durations.json')).json(); } catch (e) { }
    await Promise.all(['600 30px InterV', '400 30px InterV', '400 60px "Instrument Serif"', 'italic 400 60px "Instrument Serif"', '30px "Noto Color Emoji"'].map(f => document.fonts.load(f, 'Mom ❤️ ABC')));
    initGrain();
    return true;
  })(),
  render(f) { render(f / TL.fps, f); },
  frameJPEG(f, q = .95) { render(f / TL.fps, f); return cv.toDataURL('image/jpeg', q); },
  framePNG(f) { render(f / TL.fps, f); return cv.toDataURL('image/png'); },
};
