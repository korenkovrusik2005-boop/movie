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
wind_g = smooth_env([(0, 0), (s2o - .1, 0), (s2o + .6, .22), (S["s3_avenue"][0], .5), (S["s4_bus"][0], .35), (S["s5_signal"][0], .4), (S["s6_cafe"][0], .3), (S["s6_cafe"][0] + 2.5, .06),
                     (S["s7_roof"][0], .2), (S["s7_roof"][0] + 1.5, .75), (S["s8_mom"][0], .7), (E["ping"] + 1, .55), (E["cloud"][0] + 1, .9), (S["s8_mom"][1], .4), (S["s9_end"][0] + 1, 0), (DUR, 0)])
city_g = smooth_env([(0, .05), (s2o, .05), (s2o + .8, .35), (S["s3_avenue"][0], .55), (S["s6_cafe"][0] + 2.5, .2), (S["s7_roof"][0], .5), (S["s8_mom"][0], .35), (S["s9_end"][0], 0), (DUR, 0)])
room_g = smooth_env([(0, .22), (s2o, .22), (s2o + .5, .08), (S["s3_avenue"][0], 0), (S["s6_cafe"][0] + 1.8, 0), (S["s6_cafe"][0] + 2.6, .3), (S["s6_cafe"][1], .3), (S["s6_cafe"][1] + .4, 0), (S["s9_end"][0], 0), (S["s9_end"][0] + .5, .12), (DUR, 0)])
amb += wind * wind_g[:, None] * .5 + gust * wind_g[:, None] * .25 + city * city_g[:, None] * .5 + room * room_g[:, None] * .25
# muffled city through the closed window during S1
amb += lp(city, 220) * smooth_env([(0, 0), (.4, .25), (s2o, .25), (s2o + .3, 0), (DUR, 0)])[:, None] * .6
# birds: none in the dark, alive after the curtains, sparse on the roof, distant at the end
birds_bed(s2o + .3, S["s3_avenue"][1], 1.6, .05, amb)
birds_bed(S["s4_bus"][0], S["s5_signal"][1], .7, .03, amb, far=True)
birds_bed(S["s7_roof"][0] + .5, S["s8_mom"][0], 1.0, .045, amb)
birds_bed(S["s8_mom"][0], E["ping"], .8, .03, amb, far=True)
birds_bed(E["ping"] + 1.5, S["s8_mom"][1] - 1, .35, .02, amb, far=True)
# café neon hum (exterior) + fridge hum (interior)
n6 = sec(S["s6_cafe"][1] - S["s6_cafe"][0]); t6 = np.arange(n6) / SR
hum = sum(np.sin(2 * np.pi * 50 * k * t6) / k ** 1.5 for k in range(1, 8)) * .02 * adsr(n6, .3, .1, 1, 1.0)
add(amb, pan(hp(hum, 80).astype(np.float32), -.2), S["s6_cafe"][0])

# --- S1: vibration, lock click ------------------------------------------
for b in E["buzz"]: add(sfx, pan(buzz(), .05), b, .16)
add(sfx, pan(whoosh(.36, 600, 5000, .4), -.4), E["banner_swipe"], .06)
add(sfx, pan(M(click(3200, .03, .6), click(900, .05, .3) * .6), 0), E["phone_lock"], .22)

# --- S2: curtain + rings -------------------------------------------------
add(sfx, pan(whoosh(1.5, 250, 2200, .35), 0), s2o - .05, .22)
for i in range(7): add(sfx, pan(click(rng.uniform(3500, 5200), .03, .8), -.6 if i % 2 else .6), s2o + .05 + i * .12 + rng.uniform(0, .05), .05)
# (title: no hit, just the world breathing in)

# --- S3: clock flip tick, relay clack, drips ----------------------------
add(sfx, pan(click(1800, .02, .4), -.5), E["clock_flip"], .05)
add(sfx, pan(M(click(700, .05, .5), click(2200, .02, .5) * .5), .55), E["avenue_light"], .09)
for k in range(9):
    tk = S["s3_avenue"][0] + .4 + k * .8 + rng.uniform(0, .3)
    add(sfx, pan(M(chirp(900, 2400, .03) * .6, click(1200, .02, .3)), rng.uniform(-.5, .5)), tk, .035)

# --- S4: electric bus -----------------------------------------------------
def bus_front(t):
    if t < E["bus_stop"]: u = np.clip((t - E["bus_arrive"]) / (E["bus_stop"] - E["bus_arrive"]), 0, 1); return 150 + 1130 * (1 - u) ** 2.2
    if t < E["bus_depart"]: return 150.0
    d = t - E["bus_depart"]; return 150 - .5 * 1700 * d * d
b0, b1 = sec(S["s4_bus"][0] - 1.0), sec(S["s5_signal"][0] + 1.5)
tb = np.arange(b0, b1) / SR
fx = np.array([bus_front(x) for x in tb]); vel = np.abs(np.gradient(fx) * SR) / 150.0  # m/s
if True:  # before arrival the bus approaches from off-screen right at ~6.4 m/s
    pre = tb < E["bus_arrive"]; vel[pre] = 6.4; fx[pre] = 150 + 1130 + (E["bus_arrive"] - tb[pre]) * 960
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
bus_env = np.interp(tb, [tb[0], S["s4_bus"][0] - .2, S["s5_signal"][0] + .3, tb[-1]], [0, 1, .5, 0])
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
s5a = S["s5_signal"][0] - .5; x = s5a; ticks = []
while x < E["signal_green"]: ticks.append((x, 'slow')); x += 1.0
x = E["signal_green"] + .05
while x < S["s5_signal"][1] + .3: ticks.append((x, 'fast')); x += .118
tick = lambda f: (click(f, .018, .25) + bp(rng.standard_normal(sec(.018)), 2000, 6000) * np.exp(-np.arange(sec(.018)) / SR / .004) * .3).astype(np.float32)
for x, k in ticks:
    if x < S["s4_bus"][1] - .6: continue
    fade = np.clip((x - (S["s4_bus"][1] - .6)) / .6, 0, 1) * (1 - np.clip((x - S["s5_signal"][1]) / .3, 0, 1))
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

# --- S7: wings of the flock -------------------------------------------------
for i in range(14):
    tf = E["birds"] + .3 + i * .28 + rng.uniform(0, .2)
    flap = bp(rng.standard_normal(sec(.09)), 300, 2500) * np.sin(np.pi * np.linspace(0, 1, sec(.09))) ** 2
    add(sfx, pan(flap.astype(np.float32), -.8 + i * .12), tf, .025)

# --- S8: the ping --------------------------------------------------------------
ping = bell(hz(88), 2.2, ((1, 1), (2.0, .18), (3.0, .05)), decay=.9) * .8
ping2 = bell(hz(93), 2.4, ((1, 1), (2.0, .15)), decay=1.0) * .7
pg = np.zeros(sec(2.6), np.float32); pg[: len(ping)] += ping; pg[sec(.13): sec(.13) + len(ping2)] += ping2
add(sfx, verb(pan(pg, .08), rt=1.0, wet=.18), E["ping"], .22)
add(sfx, pan(click(3000, .025, .6), 0), E["screen_dim"], .04)

# --- music (almost none) ---------------------------------------------------------
# under the title: one warm breath
add(mus, pad([hz(50), hz(57), hz(62), hz(66)], 5.6, att=2.0, rel=2.4, bright=1100), E["title_in"] - .6, .16)
# roof: Dmaj9 pad + a few piano notes, then a hard stop before the ping
m0, m1 = E["music_in"], E["music_out"]
add(mus, pad([hz(38), hz(50), hz(54), hz(57), hz(61), hz(64)], m1 - m0 + 1.0, att=3.0, rel=1.1, bright=1700), m0, .22)
for tn, m, v in [(42.4, 69, .55), (43.6, 66, .45), (44.8, 64, .45), (46.6, 69, .5), (47.2, 71, .45), (48.75, 73, .55), (50.2, 74, .4)]:
    add(mus, pan(piano(hz(m), 4.5, v), rng.uniform(-.3, .3)), tn, .3)
# after the message: a single low note as the screen goes dark (Bm colour)
add(mus, pan(piano(hz(47), 6.0, .6) + piano(hz(54), 6.0, .35), 0), E["screen_dim"] + .05, .32)
add(mus, pad([hz(47), hz(54), hz(59), hz(62)], 4.6, att=1.6, rel=2.2, bright=900), E["screen_dim"], .1)
mus = verb(mus, rt=3.2, wet=.38, bright=5000)
mus *= smooth_env([(0, 1), (m1 - .2, 1), (m1 + .05, 0), (E["screen_dim"] - .1, 0), (E["screen_dim"], 1), (DUR, 1)])[:, None]

# --- voice-over ---------------------------------------------------------------------
for ln in TL["vo"]:
    a, sr0 = sf.read(ROOT / "vo" / "lines" / f"{ln['id']}.wav", dtype='float32')
    a = signal.resample_poly(a, SR, sr0).astype(np.float32)
    a = hp(a, 85); a = a / (np.abs(a).max() + 1e-9)
    add(vo, pan(a, 0), ln["t"], .8)
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
