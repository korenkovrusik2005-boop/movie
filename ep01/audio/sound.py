"""STILL OPEN — EP01 sound: ambience, foley, minimal music, VO placement and mix.

Everything is synthesised here (numpy/scipy), no external samples.
Reads ep01/timeline.json + ep01/vo/lines/*.wav. Writes ep01/out/stems/*.wav and ep01/out/mix.wav
(48 kHz stereo float). Loudness normalisation + AAC happens in build.sh (ffmpeg loudnorm).
"""
import json, pathlib
import numpy as np
import soundfile as sf
from scipy import signal

ROOT = pathlib.Path(__file__).resolve().parents[1]
TL = json.loads((ROOT / "timeline.json").read_text()); E = TL["events"]; S = TL["scenes"]
SR = 48000; DUR = TL["duration"]; N = int(DUR * SR)
rng = np.random.default_rng(2026)
OUT = ROOT / "out" / "stems"; OUT.mkdir(parents=True, exist_ok=True)
tt = np.arange(N) / SR

def stem(): return np.zeros((N, 2), np.float32)
def sec(t): return int(round(t * SR))
def db(x): return 10 ** (x / 20)

# ---------------- dsp helpers ----------------
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], 'band', fs=SR, output='sos'), x, axis=0)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'low', fs=SR, output='sos'), x, axis=0)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'high', fs=SR, output='sos'), x, axis=0)
def pink(n):
    w = rng.standard_normal(n); X = np.fft.rfft(w); f = np.fft.rfftfreq(n, 1 / SR); f[0] = 1
    y = np.fft.irfft(X / np.sqrt(f), n); return (y / (np.abs(y).max() + 1e-9)).astype(np.float32)
def brown(n): y = np.cumsum(rng.standard_normal(n)); y = hp(y, 20); return (y / np.abs(y).max()).astype(np.float32)
def smooth_env(points, n=N):
    """piecewise-linear (time, gain) automation → per-sample curve, then smoothed."""
    ts, gs = zip(*points); e = np.interp(np.arange(n) / SR, ts, gs).astype(np.float32)
    k = int(0.05 * SR); return np.convolve(e, np.ones(k) / k, mode='same')
def lfo(rate, depth, phase=0.0, n=N): return 1 + depth * np.sin(2 * np.pi * rate * np.arange(n) / SR + phase)
def pan(mono, p):  # p -1..1 (scalar or array), equal power
    p = np.clip(p, -1, 1); a = (p + 1) * np.pi / 4
    return np.stack([mono * np.cos(a), mono * np.sin(a)], 1).astype(np.float32)
def add(dst, x, t0, gain=1.0):
    i = sec(t0); x = x if x.ndim == 2 else pan(x, 0)
    if i < 0: x = x[-i:]; i = 0
    j = min(N, i + len(x)); dst[i:j] += gain * x[: j - i]
def reverb_ir(rt=1.4, pre=0.012, n=None, bright=6000):
    n = n or int(rt * SR * 1.2); t = np.arange(n) / SR
    ir = rng.standard_normal((n, 2)) * np.exp(-6.9 * t / rt)[:, None]; ir = lp(ir, bright)
    ir = np.concatenate([np.zeros((int(pre * SR), 2)), ir]); return (ir / np.sqrt((ir ** 2).sum(0))).astype(np.float32)
def verb(x, rt=1.4, wet=0.25, bright=6000):
    ir = reverb_ir(rt, bright=bright); y = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], 1)
    return (x * (1 - wet) + y * wet).astype(np.float32)
def adsr(n, a, d, s, r, sr=SR):
    a, d, r = int(a * sr), int(d * sr), int(r * sr); sus = max(0, n - a - d - r)
    return np.concatenate([np.linspace(0, 1, a), np.linspace(1, s, d), np.full(sus, s), np.linspace(s, 0, r)])[:n].astype(np.float32)

# ---------------- sound objects ----------------
def buzz(dur=0.46):  # phone vibration motor + wood rattle
    n = int(dur * SR); t = np.arange(n) / SR
    f = 168 + 6 * np.sin(2 * np.pi * 9 * t)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.35 + np.sin(2 * np.pi * np.cumsum(f) / SR)
    x = lp(x, 1400); env = np.minimum(1, t / 0.02) * np.minimum(1, (dur - t) / 0.04)
    rattle = bp(rng.standard_normal(n), 900, 3500) * (np.sin(2 * np.pi * 84 * t) > 0.6) * 0.25
    body = bp(x, 90, 400) * 0.6
    return ((x * 0.35 + body + rattle) * env).astype(np.float32)
def M(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n, np.float32)
    for x in xs: o[: len(x)] += x
    return o
def click(f=2500, dur=0.025, noise=0.5):
    n = sec(dur); t = np.arange(n) / SR; e = np.exp(-t / (dur / 5))
    return ((np.sin(2 * np.pi * f * t) * (1 - noise) + bp(rng.standard_normal(n), f * .5, min(f * 2, 20000)) * noise) * e).astype(np.float32)
def whoosh(dur=0.5, lo=300, hi=3000, peak=0.5):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n)
    env = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2 * np.exp(-((t / dur - peak) ** 2) * 6)
    a = lp(x, lo); b = bp(x, lo, hi); c = np.clip(t / dur, 0, 1)
    return ((a * (1 - c) + b * c) * env).astype(np.float32)
def bell(f, dur=2.0, partials=((1, 1), (2.01, .35), (2.76, .2), (4.07, .08)), decay=1.2):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k, a in partials: x += a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (1.0 + k) / decay)
    x *= np.minimum(1, t / 0.003); return x.astype(np.float32)
def chirp(f0, f1, dur, vib=0):
    n = int(dur * SR); t = np.arange(n) / SR; f = np.geomspace(f0, f1, n) * (1 + vib * np.sin(2 * np.pi * 38 * t))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / dur) ** 1.5).astype(np.float32)
def bird_phrase(kind):
    if kind == 0:  # tsip-tsip
        parts = [chirp(5200, 6800, .06) for _ in range(rng.integers(2, 5))]; gap = .09
    elif kind == 1:  # warble
        parts = [chirp(rng.uniform(2600, 3400), rng.uniform(3600, 4800), rng.uniform(.05, .12), vib=.04) for _ in range(rng.integers(3, 7))]; gap = .04
    else:  # descending whistle
        parts = [chirp(4200, 2800, .22, vib=.01)]; gap = .1
    out = []
    for p in parts: out += [p, np.zeros(int(gap * SR * rng.uniform(.7, 1.3)), np.float32)]
    return np.concatenate(out)
def birds_bed(t0, t1, density, gain, dst, far=False):
    t = t0
    while t < t1:
        ph = bird_phrase(rng.integers(0, 3)); p = rng.uniform(-.85, .85); g = gain * rng.uniform(.35, 1)
        if far: ph = lp(ph, 3500) * .6
        add(dst, pan(ph, p), t, g); t += rng.exponential(1 / density)
def piano(f, dur=4.0, vel=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k in range(1, 9):
        fk = f * k * (1 + 0.0004 * k * k)
        x += (1 / k ** 1.25) * np.sin(2 * np.pi * fk * t + rng.uniform(0, 1)) * np.exp(-t * (0.9 + 0.55 * k) * (0.6 + 220 / (f + 220)))
    ham = lp(rng.standard_normal(n), 2500) * np.exp(-t / .006) * .05
    x = (x + ham) * np.minimum(1, t / 0.004) * vel; x *= np.minimum(1, (dur - t) / .3)
    return lp(x, 5200).astype(np.float32)
def pad(freqs, dur, att=2.5, rel=3.0, bright=1400):
    n = int(dur * SR); t = np.arange(n) / SR; x = np.zeros((n, 2))
    for i, f in enumerate(freqs):
        for d, c in ((-4, 0), (4, 1), (0, None)):
            ff = f * 2 ** (d / 1200); ph = rng.uniform(0, 2 * np.pi)
            w = np.sin(2 * np.pi * ff * t + ph) + .25 * np.sin(2 * np.pi * 2 * ff * t + ph) + .08 * np.sin(2 * np.pi * 3 * ff * t)
            w *= 1 + .15 * np.sin(2 * np.pi * (.07 + .03 * i) * t + ph)
            if c is None: x += w[:, None] * .5
            else: x[:, c] += w
    env = adsr(n, att, .5, 1, rel); x = lp(x * env[:, None], bright)
    return (x / np.abs(x).max()).astype(np.float32)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

# ---------------- build stems ----------------
amb, sfx, mus, vo = stem(), stem(), stem(), stem()

# --- ambience beds -------------------------------------------------------
w1, w2 = pink(N), pink(N)
wind = np.stack([bp(w1, 180, 1100), bp(w2, 180, 1100)], 1) * (lfo(.09, .45) * lfo(.23, .25, 1.3))[:, None]
gust = np.stack([bp(w2, 500, 2500), bp(w1, 500, 2500)], 1) * (np.clip(np.sin(2 * np.pi * .05 * tt) , 0, 1) ** 3)[:, None]
city = np.stack([lp(brown(N), 160), lp(brown(N), 160)], 1)
room = np.stack([lp(pink(N), 400), lp(pink(N), 400)], 1)
s2o = E["curtain_open"]
S3, S4, S5, S6, S7m, S7, S8, S8w, S9 = (S[k] for k in ["s3_avenue", "s4_bus", "s5_signal", "s6_cafe", "s7_meeting", "s7_roof", "s8_mom", "s8_wide", "s9_end"])
wind_g = smooth_env([(0, 0), (s2o - .1, 0), (s2o + .7, .22), (S3[0], .45), (S4[0], .35), (S5[0], .4), (S6[0], .3), (S6[0] + 2.0, .06), (S6[1], .06),
                     (S7m[0], .3), (S7[0], .45), (S7[0] + 1.5, .7), (S8[0], .5), (S8w[0], .7), (E["cloud"][0] + 1, .95), (E["fade_black"][1] - .02, .8), (E["fade_black"][1], 0), (DUR, 0)])
city_g = smooth_env([(0, .05), (s2o, .05), (s2o + .8, .18), (S3[0], .22), (S6[0] + 2.0, .1), (S7m[0], .2), (S7[0], .25), (S8w[0], .2), (E["fade_black"][1] - .02, .15), (E["fade_black"][1], 0), (DUR, 0)])
room_g = smooth_env([(0, .22), (s2o, .22), (s2o + .5, .08), (S3[0], 0), (S6[0] + 1.6, 0), (S6[0] + 2.3, .3), (S6[1], .3), (S6[1] + .05, 0), (S9[0], 0), (S9[0] + 1.0, .08), (DUR, 0)])
amb += wind * wind_g[:, None] * .5 + gust * wind_g[:, None] * .25 + city * city_g[:, None] * .5 + room * room_g[:, None] * .25
# muffled city through the closed window during S1
amb += lp(city, 220) * smooth_env([(0, 0), (.4, .25), (s2o, .25), (s2o + .3, 0), (DUR, 0)])[:, None] * .6
# birds: none in the dark, alive after the curtains, sparse on the roof, distant at the end
birds_bed(s2o + .3, S3[1], 1.5, .05, amb)
birds_bed(S4[0], S5[1], .7, .03, amb, far=True)
birds_bed(S7m[0], S8[0], 1.0, .045, amb)
birds_bed(S8[0], S8w[0], .6, .025, amb, far=True)
birds_bed(S8w[0] + .5, E["fade_black"][0], .35, .02, amb, far=True)
# café neon hum (exterior) + fridge hum (interior)
n6 = sec(S6[1] - S6[0]); t6 = np.arange(n6) / SR
hum = sum(np.sin(2 * np.pi * 50 * k * t6) / k ** 1.5 for k in range(1, 8)) * .02 * adsr(n6, .3, .1, 1, 1.0)
add(amb, pan(hp(hum, 80).astype(np.float32), -.2), S6[0])

# --- S1: vibration, the grab, out of bed ------------------------------
def rustle(dur, lo=300, hi=4000):
    n = sec(dur); x = bp(rng.standard_normal(n), lo, hi) * (0.4 + 0.6 * np.abs(lp(rng.standard_normal(n), 12) * 30).clip(0, 1))
    return (x * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5).astype(np.float32)
def thump(f=70, dur=.18, click_f=900):
    n = sec(dur); t = np.arange(n) / SR
    return M((np.sin(2 * np.pi * f * t * (1 - .3 * t / dur)) * np.exp(-t / .045)).astype(np.float32), click(click_f, .02, .7) * .35)
def step(kind='wood'):
    if kind == 'wood': return M(thump(rng.uniform(85, 110), .14, 1400) * .9, bp(rng.standard_normal(sec(.06)), 800, 5000) * np.exp(-np.arange(sec(.06)) / SR / .012) * .25)
    n = sec(.16); t = np.arange(n) / SR  # wet asphalt: soft heel + splashy scuff
    return M(thump(rng.uniform(70, 90), .12, 1100) * .6, (bp(rng.standard_normal(n), 900, 7000) * np.exp(-t / .035) * .55).astype(np.float32))
for b in E["buzz"]: add(sfx, pan(buzz(), .05), b, .16)
add(sfx, pan(rustle(1.0, 250, 3500), -.2), E["grab"] - .55, .16)           # blanket
add(sfx, pan(M(click(2600, .02, .6), thump(160, .08, 2000) * .5), 0), E["grab"] + .05, .12)  # phone off the wood
add(sfx, pan(whoosh(.4, 500, 4000, .5), .3), E["whip"], .1)
add(sfx, pan(rustle(.8, 200, 3000), .1), E["whip"] + .1, .2)
for i, tk in enumerate([6.55, 6.72]): add(sfx, pan(thump(60, .22, 600), -.1), tk, .35)  # feet hit the floor
tk = 6.98
while tk < E["hero_enter"] + 1.15:  # hurried steps to the window, left → centre
    add(sfx, pan(step('wood'), np.interp(tk, [6.9, E["hero_enter"] + 1.1], [-.7, 0])), tk, .32); tk += rng.uniform(.27, .32)

# --- S2: curtains; the street below is too quiet ---------------------------
add(sfx, pan(whoosh(1.4, 250, 2200, .3), 0), s2o - .08, .26)
for i in range(7): add(sfx, pan(click(rng.uniform(3500, 5200), .03, .8), -.6 if i % 2 else .6), s2o + .02 + i * .1 + rng.uniform(0, .04), .05)
nw = sec(E["wbus_stop"] - E["wbus_arrive"] + 4); tw = np.arange(nw) / SR; vw = np.clip(1 - tw / (E["wbus_stop"] - E["wbus_arrive"]), 0, 1)
wbus = lp(np.sin(np.cumsum(150 + 380 * vw) / SR * 2 * np.pi) * (.3 + .7 * vw) + bp(rng.standard_normal(nw), 600, 3000) * vw * .8, 1800) * adsr(nw, .8, .1, 1, 1.5)
add(sfx, verb(pan(wbus.astype(np.float32), np.interp(tw, [0, 2.3], [.7, .15])), rt=1.6, wet=.4), E["wbus_arrive"], .05)
add(sfx, verb(pan(M(bell(988, 1.0, decay=.6), np.zeros(sec(.3), np.float32)) , .15), rt=1.8, wet=.5), E["wbus_doors"] + .1, .018)
add(sfx, verb(pan(lp(bp(rng.standard_normal(sec(.6)), 1500, 6000) * adsr(sec(.6), .02, .1, .6, .4), 3000).astype(np.float32), .15), rt=1.6, wet=.5), E["wbus_doors"], .03)
add(sfx, pan(click(900, .03, .5), .3), E["win_light"], .02)

# --- S3: clock flip tick, relay clack, drips ----------------------------
add(sfx, pan(click(1800, .02, .4), -.5), E["clock_flip"], .05)
add(sfx, pan(M(click(700, .05, .5), click(2200, .02, .5) * .5), .55), E["avenue_light"], .09)
for k in range(9):
    tk = S["s3_avenue"][0] + .4 + k * .8 + rng.uniform(0, .3)
    add(sfx, pan(M(chirp(900, 2400, .03) * .6, click(1200, .02, .3)), rng.uniform(-.5, .5)), tk, .035)

p0, p1 = E["walk_pause"]
for k in range(1, 40):
    eff = k / 1.7; tk = S3[0] + eff + (0 if S3[0] + eff < p0 else p1 - p0)
    if tk >= S3[1]: break
    add(sfx, pan(step("wet"), -.05 if k % 2 else .05), tk, .3)

# --- S4: electric bus -----------------------------------------------------
def bus_front(t):
    if t < E["bus_stop"]: u = np.clip((t - E["bus_arrive"]) / (E["bus_stop"] - E["bus_arrive"]), 0, 1); return 150 + 1130 * (1 - u) ** 2.2
    if t < E["bus_depart"]: return 150.0
    d = t - E["bus_depart"]; return 150 - .5 * 1700 * d * d
b0, b1 = sec(S4[0] - 1.0), sec(S5[0] + 1.5)
tb = np.arange(b0, b1) / SR
fx = np.array([bus_front(x) for x in tb]); vel = np.abs(np.gradient(fx) * SR) / 150.0  # m/s
if True:  # before arrival the bus approaches from off-screen right at ~6.4 m/s
    pre = tb < E["bus_arrive"]; v0 = 1130 * 2.2 / (E["bus_stop"] - E["bus_arrive"]); vel[pre] = v0 / 150; fx[pre] = 150 + 1130 + (E["bus_arrive"] - tb[pre]) * v0
spd = np.clip(vel / 16, 0, 1); spd_s = np.convolve(spd, np.ones(2400) / 2400, mode='same')
pos = np.clip((fx + 900 - 540) / 1100, -1, 1)
nb = len(tb); motor_f = 140 + 520 * spd_s
ph = np.cumsum(motor_f) / SR * 2 * np.pi
motor = (np.sin(ph) * .6 + np.sin(2 * ph) * .25 + np.sin(3.01 * ph) * .12) * (.25 + .75 * spd_s)
inverter = np.sin(np.cumsum(1900 + 1400 * spd_s) / SR * 2 * np.pi) * .05 * spd_s
tires = hp(bp(rng.standard_normal(nb), 700, 7000), 600) * (spd_s ** 1.3) * 1.2
idle = lp(rng.standard_normal(nb), 300) * .15 + np.sin(2 * np.pi * 95 * tb) * .05
dist_g = .35 + .65 * (1 - np.abs(pos)) ** .7
bus = (motor * .35 + inverter + tires * .5 + idle) * dist_g
bus_env = np.interp(tb, [tb[0], S4[0] - .2, S5[0] + .3, tb[-1]], [0, .25, .5, 0]) * np.interp(tb, [tb[0], S4[0] - .05, S4[0] + .3, tb[-1]], [0, 0, 1, 1])
add(sfx, pan((bus * bus_env).astype(np.float32), pos * .85), tb[0], .35)
# brake squeal-hiss, doors, chime
add(sfx, pan(bp(rng.standard_normal(sec(1.1)), 2500, 9000) * np.exp(-np.arange(sec(1.1)) / SR / .35) * np.minimum(1, np.arange(sec(1.1)) / 400), -.1), E["bus_stop"] - .15, .18)
door_hiss = lambda d: (bp(rng.standard_normal(sec(d)), 1800, 8000) * adsr(sec(d), .02, .1, .7, d * .6)).astype(np.float32)
add(sfx, pan(door_hiss(.7), -.25), E["bus_doors_open"] - .05, .16)
add(sfx, pan(lp(click(160, .12, .2), 600), -.25), E["bus_doors_open"] + .55, .3)
chime = np.concatenate([bell(988, 1.2, decay=.7) * .8, np.zeros(1)]); add(sfx, pan(chime, -.25), E["bus_doors_open"] + .15, .08)
add(sfx, pan(bell(784, 1.6, decay=.8), -.25), E["bus_doors_open"] + .48, .07)
add(sfx, pan(bell(1175, .8, decay=.5), -.25), E["bus_doors_close"] - .2, .05); add(sfx, pan(bell(1175, .8, decay=.5), -.25), E["bus_doors_close"] - .05, .05)
add(sfx, pan(door_hiss(.6), -.25), E["bus_doors_close"], .14)
add(sfx, pan(lp(click(140, .14, .2), 600), -.25), E["bus_doors_close"] + .5, .35)
add(sfx, pan(whoosh(1.0, 300, 4000, .65), np.linspace(.3, -.9, sec(1.0))), E["bus_depart"] + .75, .25)  # wipe pass-by

# --- S5: accessible signal ticks, relay, drop -----------------------------
s5a = S5[0] - .5; x = s5a; ticks = []
while x < E["signal_green"]: ticks.append((x, 'slow')); x += 1.0
x = E["signal_green"] + .05
while x < S5[1] + .3: ticks.append((x, 'fast')); x += .118
tick = lambda f: (click(f, .018, .25) + bp(rng.standard_normal(sec(.018)), 2000, 6000) * np.exp(-np.arange(sec(.018)) / SR / .004) * .3).astype(np.float32)
for x, k in ticks:
    if x < S4[1] - .6: continue
    fade = np.clip((x - (S4[1] - .6)) / .6, 0, 1) * (1 - np.clip((x - S5[1]) / .3, 0, 1))
    add(sfx, pan(tick(880 if k == 'slow' else 1250), .1), x, .14 * fade)
add(sfx, pan(M(click(500, .06, .5), click(1800, .03, .5) * .4), .1), E["signal_green"], .12)
drop = M(chirp(700, 2300, .05), bell(1500, .25, ((1, 1),), .05) * .3)
add(sfx, pan(drop, .15), E["drop"], .14)

# --- S6: grinder, pump/pour, steam, ready ding ------------------------------
g0, g1 = E["grind"]; ng = sec(g1 - g0); tg = np.arange(ng) / SR
grind = bp(rng.standard_normal(ng), 400, 6000) * (1 + .6 * np.sin(2 * np.pi * 47 * tg)) + np.sign(np.sin(2 * np.pi * 120 * tg)) * .12
add(sfx, pan((lp(grind, 7000) * adsr(ng, .05, .1, .9, .15)).astype(np.float32), .05), g0, .11)
p0, p1 = E["pour"]; npour = sec(p1 - p0 + .3); tp = np.arange(npour) / SR
pump = np.sin(2 * np.pi * 52 * tp) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 26 * tp))) * .25
gurgle = bp(rng.standard_normal(npour), 300, 1800) * (.6 + .4 * np.abs(signal.sosfilt(signal.butter(2, 18, fs=SR, output='sos'), rng.standard_normal(npour)) * 25).clip(0, 1))
stream = bp(rng.standard_normal(npour), 1500, 5500) * .25
add(sfx, pan((lp(pump, 400) + gurgle * .5 + stream).astype(np.float32) * adsr(npour, .15, .1, .85, .35), 0), p0, .09)
add(sfx, pan((bp(rng.standard_normal(sec(2.2)), 3000, 11000) * adsr(sec(2.2), .4, .2, .5, 1.2)).astype(np.float32), .1), p0 + .3, .03)
add(sfx, pan(M(bell(1319, 2.4, decay=1.0), bell(1976, 2.0, decay=.9) * .4), .05), E["ready"], .07)

# --- S7a: dismissing the meeting --------------------------------------------
add(sfx, pan(whoosh(.36, 600, 5000, .4), -.4), E["meet_swipe"], .07)
add(sfx, pan(click(3400, .015, .5), 0), E["meet_swipe"] - .05, .04)

# --- S7: exhale, wings of the flock ---------------------------------------------
nx = sec(1.6); ex = bp(rng.standard_normal(nx), 250, 2200) * adsr(nx, .25, .2, .7, .9); add(sfx, pan(lp(ex, 1600).astype(np.float32), 0), E["exhale"], .07)
for i in range(14):
    tf = E["birds"] + .3 + i * .28 + rng.uniform(0, .2)
    flap = bp(rng.standard_normal(sec(.09)), 300, 2500) * np.sin(np.pi * np.linspace(0, 1, sec(.09))) ** 2
    add(sfx, pan(flap.astype(np.float32), -.8 + i * .12), tf, .025)

# --- S8: he opens the thread, calls, it rings out ------------------------------------
add(sfx, pan(click(3200, .018, .5), 0), E["screen_on"], .05)
add(sfx, pan(whoosh(.3, 1500, 6000, .4), .2), E["thread_in"], .03)
add(sfx, pan(click(2800, .02, .5), .1), E["call_tap"], .07)
def ringback(dur=1.0):  # double burr: 400+450 Hz, 0.4 on / 0.2 off / 0.4 on, through a small phone speaker
    n = sec(dur); t = np.arange(n) / SR; x = (np.sin(2 * np.pi * 400 * t) + np.sin(2 * np.pi * 450 * t)) * .5
    g = ((t < .4) | ((t > .6) & (t < 1.0))).astype(np.float32); g = np.convolve(g, np.ones(240) / 240, 'same')
    return bp(x * g, 350, 3400).astype(np.float32)
cut = sec(E["fade_black"][1])
for r in E["rings"]:
    rb = ringback(); i = sec(r); rb = rb[: max(0, cut - i)]
    add(sfx, pan(rb, .05), r, .16 if r < S8w[0] + .5 else .13)

# --- music (almost none) ------------------------------------------------------------------
m0, m1 = E["music_in"], E["music_out"]
add(mus, pad([hz(38), hz(50), hz(54), hz(57), hz(61), hz(64)], m1 - m0 + 1.2, att=2.6, rel=1.6, bright=1500), m0, .2)
for tn, m, v in [(45.2, 69, .35), (46.6, 66, .3), (48.4, 73, .3)]:
    add(mus, pan(piano(hz(m), 4.5, v), rng.uniform(-.3, .3)), tn, .26)
add(mus, pad([hz(47), hz(54), hz(59), hz(62)], E["fade_black"][1] - E["call_screen"] + 1, att=3.5, rel=.2, bright=800), E["call_screen"], .07)
mus = verb(mus, rt=3.2, wet=.38, bright=5000)
mus *= smooth_env([(0, 1), (E["fade_black"][1] - .03, 1), (E["fade_black"][1], 0), (DUR, 0)])[:, None]

# --- voice-over ---------------------------------------------------------------------
ECHO = {"v03", "v04"}
for ln in TL["vo"]:
    a, sr0 = sf.read(ROOT / "vo" / "lines" / f"{ln['id']}.wav", dtype='float32')
    a = signal.resample_poly(a, SR, sr0).astype(np.float32)
    a = hp(a, 85); a = a / (np.abs(a).max() + 1e-9)
    add(vo, pan(a, 0), ln["t"], .8)
    if ln["id"] in ECHO:  # slap-back off the facades + long outdoor tail
        e = lp(a, 2500); tail = np.zeros((sec(2.5), 2), np.float32)
        for d, g, p in [(.21, .32, -.5), (.38, .22, .55), (.61, .12, -.3), (.9, .06, .4)]: tail[sec(d): sec(d) + len(e)] += pan(e * g, p)[: len(tail) - sec(d)]
        add(sfx, verb(tail, rt=2.2, wet=.5, bright=3000), ln["t"], .5)
vo = verb(vo, rt=.6, wet=.07, bright=7000)

# --- duck ambience/music under VO -----------------------------------------------------
voenv = np.convolve(np.abs(vo[:, 0]), np.ones(sec(.25)) / sec(.25), mode='same'); duck = 1 - .35 * np.clip(voenv / (voenv.max() * .25), 0, 1)
amb *= duck[:, None]; mus *= (1 - .2 * (1 - duck))[:, None]

# --- master ----------------------------------------------------------------------------
mix = amb * db(-6) + sfx * db(-1) + mus * db(-7) + vo * db(0)
fade = smooth_env([(0, 1), (DUR - .7, 1), (DUR, 0)]); mix *= fade[:, None]
mix = hp(mix, 28)
peak = np.abs(mix).max(); mix = mix / peak * db(-3)
for name, x in [('amb', amb * db(-6)), ('sfx', sfx * db(-1)), ('music', mus * db(-7)), ('vo', vo)]: sf.write(OUT / f"{name}.wav", (x / peak * db(-3)).astype(np.float32), SR, subtype='FLOAT')
sf.write(ROOT / "out" / "mix.wav", mix.astype(np.float32), SR, subtype='FLOAT')
print('mix ok', mix.shape, 'peak before norm', round(float(peak), 3))
