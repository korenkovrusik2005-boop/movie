"""STILL OPEN — EP01 v3 sound for the keyframe film (film/shots.json).

Everything synthesised (sfxlib), cut to the picture: shot boundaries drive ambience changes,
hard cuts get hard sound cuts, emotional beats get a sting / swell / silence.
Writes out/stems3/*.wav and out/mix.wav (48 kHz stereo float).
"""
import sys, pathlib, json
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from sfxlib import *  # noqa: F401,F403  (SR, N, DUR, helpers, rng, ROOT)

SH = {s["id"]: s for s in SPEC["shots"]}
def T(i, off=0.0): return SH[i]["t"] + off
def END(i): return SH[i]["t"] + SH[i]["dur"]
VO = {"v01": 4.4, "v02": 15.7, "v03": 20.2, "v04": 27.9, "v05": 36.0}
CUT = T("s26_end")                     # the call is cut off here → silence
amb, sfx, mus, vo = stem(), stem(), stem(), stem()
OUT = ROOT / "out" / "stems3"; OUT.mkdir(parents=True, exist_ok=True)

def rustle(dur, lo=300, hi=4000):
    n = sec(dur); x = bp(rng.standard_normal(n), lo, hi) * (0.4 + 0.6 * np.abs(lp(rng.standard_normal(n), 12) * 30).clip(0, 1))
    return (x * np.sin(np.pi * np.linspace(0, 1, n)) ** 1.5).astype(np.float32)
def thump(f=70, dur=.18, click_f=900):
    n = sec(dur); t = np.arange(n) / SR
    return M((np.sin(2 * np.pi * f * t * (1 - .3 * t / dur)) * np.exp(-t / .045)).astype(np.float32), click(click_f, .02, .7) * .35)
def step(kind):
    if kind == 'wood': return M(thump(rng.uniform(85, 110), .14, 1400) * .9, bp(rng.standard_normal(sec(.06)), 800, 5000) * np.exp(-np.arange(sec(.06)) / SR / .012) * .25)
    n = sec(.16); t = np.arange(n) / SR
    return M(thump(rng.uniform(70, 90), .12, 1100) * .6, (bp(rng.standard_normal(n), 900, 7000) * np.exp(-t / .035) * .55).astype(np.float32))
def boom(dur=2.5, f=42):
    n = sec(dur); t = np.arange(n) / SR; x = np.sin(2 * np.pi * f * t * (1 - .25 * t / dur)) * np.exp(-t / .42) + lp(rng.standard_normal(n), 120) * np.exp(-t / .3) * .6
    return (x * np.minimum(1, t / .004)).astype(np.float32)
def reverse_swell(dur=0.9):
    x = verb(pan(M(bell(880, 1.5, decay=.8), bp(rng.standard_normal(sec(.2)), 1000, 6000) * .3), 0), rt=2.0, wet=.9)[: sec(dur)][::-1]
    return np.ascontiguousarray(x * np.linspace(0, 1, len(x))[:, None] ** 2)
def ringback(dur=1.0):
    n = sec(dur); t = np.arange(n) / SR; x = (np.sin(2 * np.pi * 400 * t) + np.sin(2 * np.pi * 450 * t)) * .5
    g = ((t < .4) | ((t > .6) & (t < 1.0))).astype(np.float32); g = np.convolve(g, np.ones(240) / 240, 'same')
    return bp(x * g, 350, 3400).astype(np.float32)

# ---------------- ambience beds ----------------
w1, w2 = pink(N), pink(N)
wind = np.stack([bp(w1, 180, 1100), bp(w2, 180, 1100)], 1) * (lfo(.09, .45) * lfo(.23, .25, 1.3))[:, None]
city = np.stack([lp(brown(N), 160), lp(brown(N), 160)], 1)
room = np.stack([lp(pink(N), 400), lp(pink(N), 400)], 1)
out_open = T("s06_curtains")
wind_g = smooth_env([(0, 0), (out_open - .02, 0), (out_open + .1, .5), (T("s09_face"), .25), (T("s10_door"), .3), (T("s11_avenue"), .55), (T("s14_inbus"), .15), (T("s15_signal"), .4),
                     (T("s16_cafe"), .05), (T("s17_meeting"), .3), (T("s19_lying"), .5), (T("s21_bench"), .55), (T("s21_bench", 1.2), .9), (T("s23_tears"), .5), (T("s25_city"), .85), (CUT - .02, .8), (CUT, 0), (DUR, 0)])
city_g = smooth_env([(0, .04), (out_open - .02, .04), (out_open + .1, .18), (T("s10_door"), .22), (T("s16_cafe"), .08), (T("s17_meeting"), .2), (CUT - .02, .16), (CUT, 0), (DUR, 0)])
room_g = smooth_env([(0, .25), (out_open - .02, .25), (out_open + .1, .05), (T("s10_door"), 0), (T("s16_cafe") - .02, 0), (T("s16_cafe") + .05, .32), (END("s16_cafe") - .05, .32), (END("s16_cafe"), 0),
                     (T("s14_inbus") - .02, 0), (T("s14_inbus") + .05, .2), (END("s14_inbus") - .05, .2), (END("s14_inbus"), 0), (CUT + .4, 0), (CUT + 1.2, .07), (DUR, 0)])
amb += wind * wind_g[:, None] * .5 + city * city_g[:, None] * .5 + room * room_g[:, None] * .25
amb += lp(city, 220) * smooth_env([(0, 0), (.4, .25), (out_open - .02, .25), (out_open, 0), (DUR, 0)])[:, None] * .5
birds_bed(out_open + .2, T("s14_inbus"), 1.6, .05, amb)
birds_bed(T("s17_meeting"), T("s21_bench"), 1.4, .05, amb)
birds_bed(T("s21_bench"), CUT - .5, .35, .02, amb, far=True)
# café neon hum
n6 = sec(SH["s16_cafe"]["dur"]); t6 = np.arange(n6) / SR
add(amb, pan(hp(sum(np.sin(2 * np.pi * 50 * k * t6) / k ** 1.5 for k in range(1, 8)) * .02 * adsr(n6, .05, .1, 1, .05), 80).astype(np.float32), -.2), T("s16_cafe"))

# ---------------- ACT 1: wake ----------------
for b in [0.45, 1.25, 2.55]: add(sfx, pan(buzz(), .05), b, .17)
add(sfx, pan(click(2600, .015, .6), 0), T("s02_lock", .12), .05)
add(sfx, reverse_swell(.8), T("s03_eyes") - .8, .12)                  # suck-in before the realisation
add(sfx, pan(boom(1.6, 46), 0), T("s03_eyes"), .32)
add(sfx, pan(whoosh(.3, 800, 7000, .5), 0), T("s03_eyes"), .12)
add(sfx, pan(rustle(.9, 250, 3500), -.2), T("s04_jump") - .1, .3)
add(sfx, pan(whoosh(.5, 400, 5000, .5), .3), T("s04_jump"), .22)
add(sfx, pan(thump(58, .25, 600), 0), T("s04_jump", .85), .45)
tk = T("s05_hall", .05)
while tk < END("s05_hall"):
    add(sfx, pan(step('wood'), np.interp(tk, [T("s05_hall"), END("s05_hall")], [-.6, .6])), tk, .35); tk += rng.uniform(.2, .24)
for i in range(5): add(sfx, pan(bell(rng.uniform(3500, 5200), .25, ((1, 1), (2.7, .4)), .08), .3), T("s05_hall", .1 + i * .03), .03)   # keys

# ---------------- ACT 2: the window ----------------
add(sfx, pan(whoosh(1.2, 250, 2600, .2), 0), out_open - .12, .4)
for i in range(7): add(sfx, pan(click(rng.uniform(3500, 5200), .03, .8), -.6 if i % 2 else .6), out_open - .05 + i * .07, .06)
add(mus, pad([hz(62), hz(66), hz(69), hz(74)], 2.6, att=.05, rel=2.2, bright=4000), out_open, .14)   # light floods in
wb = np.arange(sec(4.0)) / SR; vb = np.clip(1 - wb / 2.4, 0, 1)
wbus = lp(np.sin(np.cumsum(150 + 380 * vb) / SR * 2 * np.pi) * (.3 + .7 * vb) + bp(rng.standard_normal(len(wb)), 600, 3000) * vb * .8, 1800) * adsr(len(wb), .6, .1, 1, 1.2)
add(sfx, verb(pan(wbus.astype(np.float32), .3), rt=1.6, wet=.4), T("s07_window", .1), .06)
add(sfx, verb(pan(M(bell(988, 1.0, decay=.6), bell(784, 1.2, decay=.7) * .8), .2), rt=1.8, wet=.5), T("s07_window", 1.5), .025)
for i in range(4): add(sfx, verb(pan(click(880, .02, .25), .1), rt=1.5, wet=.6), T("s08_birdseye", .2 + i * 1.0), .02)
add(sfx, verb(pan(lp(bp(rng.standard_normal(sec(.6)), 1500, 6000) * adsr(sec(.6), .02, .1, .6, .4), 3000).astype(np.float32), -.2), rt=1.6, wet=.5), T("s08_birdseye", .6), .035)
# unease: low beating drone from the face to the bus
dr0, dr1 = T("s09_face"), T("s15_signal"); nd = sec(dr1 - dr0); td = np.arange(nd) / SR
drone = (np.sin(2 * np.pi * 55 * td) + np.sin(2 * np.pi * 55.7 * td) + .4 * np.sin(2 * np.pi * 82.4 * td)) * adsr(nd, 1.5, .5, 1, 1.2)
add(mus, pan(lp(drone, 300).astype(np.float32), 0), dr0, .05)

# ---------------- ACT 3: outside ----------------
add(sfx, pan(M(thump(90, .2, 2200) * .7, click(4200, .04, .7)), -.3), T("s10_door"), .25)    # glass door
add(sfx, pan(whoosh(.5, 300, 3000, .3), -.3), T("s10_door"), .1)
for i, tk in enumerate(np.cumsum([.05, .32, .34, .38, .45, .55])): add(sfx, pan(step('wet'), -.05 if i % 2 else .05), T("s10_door") + tk, .3 - i * .03)
add(sfx, pan(step('wet'), 0), T("s12_puddle", .1), .35)
add(sfx, pan(M(chirp(700, 2300, .05), bell(1500, .25, ((1, 1),), .05) * .3), .1), T("s12_puddle", 1.4), .08)
# the bus: arrives, brakes, doors
b0 = T("s13_busstop", -.6); nb = sec(3.4); tb = np.arange(nb) / SR; spd = np.clip(1 - tb / 2.0, 0, 1) ** 1.3
ph = np.cumsum(140 + 520 * spd) / SR * 2 * np.pi
bus = (np.sin(ph) * .6 + np.sin(2 * ph) * .25) * (.25 + .75 * spd) * .35 + hp(bp(rng.standard_normal(nb), 700, 7000), 600) * spd * .5 + lp(rng.standard_normal(nb), 300) * .1
add(sfx, pan((bus * adsr(nb, .8, .1, 1, .6)).astype(np.float32), np.linspace(.7, .2, nb)), b0, .3)
add(sfx, pan(bp(rng.standard_normal(sec(1.0)), 2500, 9000) * np.exp(-np.arange(sec(1.0)) / SR / .3), .2), T("s13_busstop", 1.3), .14)
door_hiss = lambda d: (bp(rng.standard_normal(sec(d)), 1800, 8000) * adsr(sec(d), .02, .1, .7, d * .6)).astype(np.float32)
add(sfx, pan(door_hiss(.7), .2), T("s13_busstop", 1.95), .15)
add(sfx, pan(M(bell(988, 1.2, decay=.7) * .8, bell(784, 1.6, decay=.8) * .7), .2), T("s13_busstop", 2.1), .06)
# inside the bus: hum + the call
nbb = sec(SH["s14_inbus"]["dur"]); add(amb, pan((lp(rng.standard_normal(nbb), 200) * .5 + np.sin(2 * np.pi * 100 * np.arange(nbb) / SR) * .05).astype(np.float32) * adsr(nbb, .02, .1, 1, .05), 0), T("s14_inbus"), .12)
for i in range(3): add(sfx, pan(bell(1175, .5, decay=.4), 0), T("s14_inbus", 2.0 + i * .22), .03)   # door-closing beeps
s5a = T("s15_signal"); x = s5a + .05
while x < END("s15_signal"): add(sfx, pan(M(click(1250, .018, .25)), .1), x, .24); x += .118
add(sfx, pan(M(click(500, .06, .5), click(1800, .03, .5) * .4), .1), s5a, .1)
# café: grinder → pour → ding
g0 = T("s16_cafe", .05); ng = sec(.5); tg = np.arange(ng) / SR
add(sfx, pan((lp(bp(rng.standard_normal(ng), 400, 6000) * (1 + .6 * np.sin(2 * np.pi * 47 * tg)), 7000) * adsr(ng, .03, .1, .9, .1)).astype(np.float32), 0), g0, .07)
npour = sec(1.7); tp = np.arange(npour) / SR
pour = lp(np.sin(2 * np.pi * 52 * tp) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 26 * tp))) * .25, 400) + bp(rng.standard_normal(npour), 300, 1800) * .3 + bp(rng.standard_normal(npour), 1500, 5500) * .25
add(sfx, pan((pour * adsr(npour, .1, .1, .85, .3)).astype(np.float32), 0), g0 + .45, .09)
add(sfx, pan(M(bell(1319, 2.4, decay=1.0), bell(1976, 2.0, decay=.9) * .4), .05), T("s16_cafe", 1.85), .07)

# ---------------- ACT 4: freedom ----------------
add(sfx, pan(click(3400, .015, .5), 0), T("s17_meeting", 1.25), .04)
add(sfx, pan(whoosh(.36, 600, 5000, .4), -.4), T("s17_meeting", 1.35), .1)
nx = sec(1.4); ex = bp(rng.standard_normal(nx), 250, 2200) * adsr(nx, .2, .2, .7, .8)
add(sfx, pan(lp(ex, 1600).astype(np.float32), 0), T("s19_lying", .3), .08)
for i in range(16):
    flap = bp(rng.standard_normal(sec(.09)), 300, 2500) * np.sin(np.pi * np.linspace(0, 1, sec(.09))) ** 2
    add(sfx, pan(flap.astype(np.float32), -.8 + i * .1), T("s20_walk", .1 + i * .12 + rng.uniform(0, .08)), .05)
for i, tk in enumerate(np.arange(.2, SH["s20_walk"]["dur"] - .2, .55)): add(sfx, pan(step('wet'), -.05 if i % 2 else .05), T("s20_walk") + tk, .14)
m0, m1 = T("s18_smile", 1.6), T("s21_bench", 1.4)
add(mus, pad([hz(38), hz(50), hz(54), hz(57), hz(61), hz(64)], m1 - m0 + 1.5, att=2.0, rel=1.5, bright=1700), m0, .26)
for tn, m, v in [(T("s19_lying", .1), 69, .45), (T("s19_lying", 1.3), 66, .4), (T("s19_lying", 2.5), 64, .4), (T("s20_walk", .1), 73, .5), (T("s20_walk", 1.2), 71, .4), (T("s20_walk", 2.3), 74, .45)]:
    add(mus, pan(piano(hz(m), 4.5, v), rng.uniform(-.3, .3)), tn, .32)

# ---------------- ACT 5: the crack ----------------
add(sfx, pan(click(3200, .018, .5), 0), T("s22_thread", .1), .05)
add(sfx, pan(click(2800, .02, .5), .1), T("s22_thread", 2.3), .08)
add(sfx, pan(M(bell(1400, .12, ((1, 1),), .05), bell(1050, .12, ((1, 1),), .05)), 0), T("s22_thread", 2.5), .04)
rings = [T("s23_tears", .2) + 3.0 * k for k in range(4)]
for r in rings:
    rb = ringback(); i = sec(r); rb = rb[: max(0, sec(CUT) - i)]
    if len(rb): add(sfx, pan(rb, .05), r, .17)
add(mus, pad([hz(47), hz(54), hz(59), hz(62)], CUT - T("s23_tears") + .2, att=3.0, rel=.1, bright=800), T("s23_tears"), .1)
add(mus, pan(piano(hz(47), 6.0, .55) + piano(hz(54), 6.0, .3), 0), T("s26_end", .6), .3)    # one low note on the end card

# ---------------- VO ----------------
ECHO = {"v03": (2.4, .55), "v04": (1.0, .25)}
for vid, t0 in VO.items():
    a, sr0 = sf.read(ROOT / "vo" / "lines" / f"{vid}.wav", dtype='float32')
    a = signal.resample_poly(a, SR, sr0).astype(np.float32); a = hp(a, 85); a = a / (np.abs(a).max() + 1e-9)
    add(vo, pan(a, 0), t0, .8)
    if vid in ECHO:
        rt, g = ECHO[vid]; e = lp(a, 2500); tail = np.zeros((sec(2.6), 2), np.float32)
        for d, gg, p in [(.21, .32, -.5), (.38, .22, .55), (.61, .12, -.3), (.9, .06, .4)]: tail[sec(d): sec(d) + len(e)] += pan(e * gg, p)[: len(tail) - sec(d)]
        add(sfx, verb(tail, rt=rt, wet=.5, bright=3000), t0, g)
vo = verb(vo, rt=.5, wet=.06, bright=7000)

# ---------------- mix ----------------
mus = verb(mus, rt=3.0, wet=.35, bright=5000)
mus *= smooth_env([(0, 1), (CUT - .03, 1), (CUT, 0), (CUT + .55, 0), (CUT + .6, 1), (DUR, 1)])[:, None]
sfx_cut = smooth_env([(0, 1), (CUT - .01, 1), (CUT, 0), (DUR, 0)])[:, None]; sfx *= sfx_cut
voenv = np.convolve(np.abs(vo[:, 0]), np.ones(sec(.25)) / sec(.25), mode='same'); duck = 1 - .35 * np.clip(voenv / (voenv.max() * .25), 0, 1)
amb *= duck[:, None]; mus *= (1 - .25 * (1 - duck))[:, None]
mix = amb * db(-6) + sfx * db(-1) + mus * db(-6) + vo * db(0)
mix *= smooth_env([(0, 1), (DUR - .6, 1), (DUR, 0)])[:, None]; mix = hp(mix, 28)
peak = np.abs(mix).max(); mix = mix / peak * db(-3)
for name, x in [('amb', amb * db(-6)), ('sfx', sfx * db(-1)), ('music', mus * db(-6)), ('vo', vo)]: sf.write(OUT / f"{name}.wav", (x / peak * db(-3)).astype(np.float32), SR, subtype='FLOAT')
sf.write(ROOT / "out" / "mix.wav", mix.astype(np.float32), SR, subtype='FLOAT')
print('mix v3 ok', round(float(peak), 3))
