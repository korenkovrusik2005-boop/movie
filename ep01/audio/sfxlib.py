"""STILL OPEN — shared synth / foley helpers (extracted from the v2 sound script).

Everything is synthesised here (numpy/scipy), no external samples.
Reads ep01/timeline.json + ep01/vo/lines/*.wav. Writes ep01/out/stems/*.wav and ep01/out/mix.wav
(48 kHz stereo float). Loudness normalisation + AAC happens in build.sh (ffmpeg loudnorm).
"""
import json, pathlib
import numpy as np
import soundfile as sf
from scipy import signal

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = json.loads((ROOT / "film" / "shots.json").read_text())
SR = 48000; DUR = SPEC["duration"]; N = int(DUR * SR)
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

