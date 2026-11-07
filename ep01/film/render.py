"""STILL OPEN EP01 v3 — keyframe film renderer.

Each shot is one generated keyframe (ep01/keyframes/raw) animated as a 2.5D camera move:
depth-parallax (Depth Anything V2 maps in keyframes/depth), zoom/pan/roll, sub-frame motion blur,
handheld shake, puddle ripples, steam, birds, light leaks, flash, cloud shadow, phone UI composited
in perspective onto the generated phone screen, then bloom / vignette / grain.

usage: python3 render.py video [workers]      -> ../out/video.mp4
       python3 render.py stills t1,t2,...      -> ../out/stills/*.png
"""
import json, math, os, sys, subprocess, pathlib
import numpy as np, cv2

HERE = pathlib.Path(__file__).resolve().parent; ROOT = HERE.parent; KF = ROOT / "keyframes"
SPEC = json.loads((HERE / "shots.json").read_text()); W, H, FPS = SPEC["width"], SPEC["height"], SPEC["fps"]
SHOTS = SPEC["shots"]; QUADS = json.loads((KF / "screen_quads.json").read_text())
SRC_W, SRC_H = 1350, 2400; K = SRC_W / W            # working resolution of keyframes (cover = 1.25×output)
UU, VV = np.meshgrid(np.arange(W, dtype=np.float32) - W / 2, np.arange(H, dtype=np.float32) - H / 2)

def ease(u, kind):
    u = min(1.0, max(0.0, u))
    if kind == "io": return 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2
    if kind == "o": return 1 - (1 - u) ** 3
    if kind == "crash": return 1 - (1 - min(1, u * 5)) ** 4 * 0.85 - 0.15 * (1 - u)  # fast punch-in then slow creep
    return u
def lerp(a, b, t): return a + (b - a) * t
def hashf(x): s = math.sin(x * 127.1 + 311.7) * 43758.5453; return s - math.floor(s)
def noise(x, seed=0):
    i = math.floor(x); f = x - i; u = f * f * (3 - 2 * f)
    return lerp(hashf(i + seed * 101.3), hashf(i + 1 + seed * 101.3), u) * 2 - 1

_cache = {}
def load(name):
    if name in _cache: return _cache[name]
    im = cv2.imread(str(KF / "raw" / f"{name}.png"), cv2.IMREAD_COLOR)
    im = cv2.resize(im, (SRC_W, SRC_H), interpolation=cv2.INTER_LANCZOS4).astype(np.float32) / 255.
    bl = cv2.GaussianBlur(im, (0, 0), 1.2); im = np.clip(im + 0.35 * (im - bl), 0, 1)        # mild unsharp after upscale
    d = cv2.imread(str(KF / "depth" / f"{name}.png"), cv2.IMREAD_UNCHANGED).astype(np.float32) / 65535.
    d = cv2.resize(d, (SRC_W, SRC_H), interpolation=cv2.INTER_LINEAR)
    d = cv2.GaussianBlur(cv2.dilate(d, np.ones((9, 9), np.uint8)), (0, 0), 4)              # grow foreground: fewer halos
    oh, ow = cv2.imread(str(KF / "raw" / f"{name}.png")).shape[:2]
    _cache[name] = (im, d, (SRC_W / ow, SRC_H / oh)); return _cache[name]
_ui = {}
def ui(name):
    if name not in _ui: _ui[name] = cv2.imread(str(KF / "ui" / f"{name}.png"), cv2.IMREAD_UNCHANGED).astype(np.float32) / 255.
    return _ui[name]

def cam_at(sh, lt):
    u = ease(lt / sh["dur"], sh.get("ease", "io")); fx = sh.get("fx", {})
    c = {k: lerp(sh[k][0], sh[k][1], u) for k in ("zoom", "cx", "cy", "rot")}
    c["par"] = [lerp(sh["par"][0][i], sh["par"][1][i], u) for i in range(2)]
    a = fx.get("shake", 0)
    if a:
        c["cx"] += a * 0.0016 * noise(lt * 2.3, 1) + a * 0.0006 * noise(lt * 9, 4); c["cy"] += a * 0.0012 * noise(lt * 2.1, 2) + a * 0.0005 * noise(lt * 8, 5)
        c["rot"] += a * 0.0015 * noise(lt * 1.7, 3)
    return fit(c, sh)

def fit(c, sh):
    """keep the rotated frame (plus parallax headroom) inside the keyframe: grow zoom / shift centre if needed."""
    pm = (abs(c["par"][0]) + abs(c["par"][1])) * .6
    for _ in range(3):
        s = K / c["zoom"]; cr, sr = math.cos(c["rot"]), math.sin(c["rot"])
        hx = (abs(cr) * W / 2 + abs(sr) * H / 2) * s + pm; hy = (abs(sr) * W / 2 + abs(cr) * H / 2) * s + pm
        need = max(2 * hx / SRC_W, 2 * hy / SRC_H)
        if need > 1: c["zoom"] *= need * 1.002; continue
        c["cx"] = min(max(c["cx"], hx / SRC_W), 1 - hx / SRC_W); c["cy"] = min(max(c["cy"], hy / SRC_H), 1 - hy / SRC_H); break
    return c

def maps_for(sh, lt):
    im, d, _ = load(sh["img"]); c = cam_at(sh, lt)
    s = K / c["zoom"]; cr, sr = math.cos(c["rot"]), math.sin(c["rot"])
    mx = c["cx"] * SRC_W + (cr * UU + sr * VV) * s; my = c["cy"] * SRC_H + (-sr * UU + cr * VV) * s
    dd = cv2.remap(d, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    f = sh.get("focus", .5); mx = mx - (dd - f) * c["par"][0]; my = my - (dd - f) * c["par"][1]
    rp = sh.get("fx", {}).get("ripple")
    if rp and lt > rp["t"]:  # expanding rings on water: radial displacement
        tt = lt - rp["t"]; px, py = rp["x"] * SRC_W, rp["y"] * SRC_H; rx, ry = mx - px, (my - py) * 1.0
        r = np.sqrt(rx * rx + ry * ry) + 1e-3; amp = 9 * math.exp(-tt * 1.1)
        wv = np.sin(r * 0.06 - tt * 9) * np.exp(-((r - tt * 330) / 260) ** 2) * amp
        mx = mx + wv * rx / r; my = my + wv * ry / r
    return mx, my, c

def render_shot(sh, lt):
    im, d, sc = load(sh["img"]); fx = sh.get("fx", {}); n = fx.get("mblur", 1)
    if n > 1:  # sub-frame accumulation over a 180° shutter
        acc = np.zeros((H, W, 3), np.float32)
        for i in range(n):
            mx, my, c = maps_for(sh, lt + (i / (n - 1) - .5) / FPS / 2 * 6)  # exaggerated shutter for whip energy
            acc += cv2.remap(im, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        fr = acc / n; mx, my, c = maps_for(sh, lt)
    else:
        mx, my, c = maps_for(sh, lt); fr = cv2.remap(im, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
    if "phone" in fx: fr = phone_overlay(fr, sh, lt, mx, my, c, sc)
    return fx_pass(fr, sh, lt, c)

def src_to_out(pt, sh, c, depth):
    """forward-map a source-px point to output px (inverse of maps_for, incl. parallax at given depth)."""
    s = K / c["zoom"]; f = sh.get("focus", .5)
    x = pt[0] + (depth - f) * c["par"][0] - c["cx"] * SRC_W; y = pt[1] + (depth - f) * c["par"][1] - c["cy"] * SRC_H
    cr, sr = math.cos(c["rot"]), math.sin(c["rot"]); u = (cr * x - sr * y) / s; v = (sr * x + cr * y) / s
    return [u + W / 2, v + H / 2]

def compose_rgba(dst, src_rgba, M, mask=None):
    w = cv2.warpPerspective(src_rgba, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    a = w[..., 3:4] if mask is None else w[..., 3:4] * mask[..., None]
    return dst * (1 - a) + w[..., :3] * a

def phone_overlay(fr, sh, lt, mx, my, c, sc):
    p = sh["fx"]["phone"]; im, d, _ = load(sh["img"])
    q = [[x * sc[0], y * sc[1]] for x, y in QUADS[p["quad"]]]
    dq = float(np.mean([d[int(min(SRC_H - 1, y)), int(min(SRC_W - 1, x))] for x, y in q]))
    oq = np.float32([src_to_out(pt, sh, c, dq) for pt in q])
    # protect fingers: draw UI only where the generated screen was dark
    g = cv2.cvtColor(cv2.remap(im, mx, my, cv2.INTER_LINEAR), cv2.COLOR_BGR2GRAY)
    mask = np.clip((0.2 - g) / 0.1, 0, 1); mask = cv2.GaussianBlur(mask, (0, 0), 1.2)
    scr_name = p["screen"]
    if "call" in p and lt > p["call"]: scr_name = f"call_{int((lt - p['call']) * 2) % 3}"
    S = ui(scr_name).copy()
    hS, wS = S.shape[:2]
    if "banner" in p:
        bn = ui(p["banner"]); bh, bw = bn.shape[:2]; y0 = int(hS / 2 - 40 * 2)
        sw = 0 if lt < p.get("swipe", 99) else min(1, (lt - p["swipe"]) / .3) ** 2
        x0 = int((wS - bw) / 2 - sw * wS * 1.1)
        if x0 + bw > 0:
            xs, xe = max(0, x0), min(wS, x0 + bw); sub = bn[:, xs - x0: xe - x0]; a = sub[..., 3:4] * (1 - sw * .5)
            S[y0:y0 + bh, xs:xe, :3] = S[y0:y0 + bh, xs:xe, :3] * (1 - a) + sub[..., :3] * a
    if "tap" in p and p["tap"] < lt < p["tap"] + .35:  # tap ripple on the call icon
        u = (lt - p["tap"]) / .35; cx, cy = int((265 + 205) * 2), int((560 - 428) * 2)
        ov = S.copy(); cv2.circle(ov, (cx, cy), int((30 + 40 * u) * 2), (1, 1, 1, 1), -1); S = S * (1 - .35 * (1 - u)) + ov * .35 * (1 - u)
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [wS, 0], [wS, hS], [0, hS]]), oq)
    S[..., :3] = np.clip(S[..., :3] * 1.04, 0, 1)
    fr = compose_rgba(fr, S, M, mask)
    # glass glare + soft screen glow onto the hand
    gl = np.zeros((hS, wS, 4), np.float32); yy, xx = np.mgrid[0:hS, 0:wS]; band = np.exp(-(((xx - yy * .45) - wS * .25) / (wS * .25)) ** 2) * .08
    gl[..., :3] = 1; gl[..., 3] = band
    return compose_rgba(fr, gl, M, mask)

def fx_pass(fr, sh, lt, c):
    fx = sh.get("fx", {})
    g = fx.get("grade", {})
    if g.get("exposure"): fr = fr * (1 + g["exposure"])
    if g.get("cool"): fr = fr * np.float32([1 + g["cool"] * .35, 1, 1 - g["cool"] * .25])  # BGR
    gw = fx.get("glow")
    if gw:
        a = gw["a"]
        if gw.get("flicker"): a *= 0.85 + 0.15 * noise(lt * 6, 9)
        if gw.get("tick"): a *= 0.75 + 0.25 * (1 - ((lt % gw["tick"]) / gw["tick"]))
        pt = src_to_out([gw["x"] * SRC_W, gw["y"] * SRC_H], sh, c, .5); fr = add_glow(fr, pt, gw["r"] * K / c["zoom"] * 1.0, gw["rgb"][::-1], a)
    if "steam" in fx:
        st = fx["steam"]; base = src_to_out([st["x"] * SRC_W, st["y"] * SRC_H], sh, c, .7); fr = steam(fr, base, lt, c["zoom"] * st["s"])
    if fx.get("birds"): fr = birds(fr, lt)
    if fx.get("leak"): fr = leak(fr, lt, fx["leak"])
    if "cloud" in fx:
        a, b = fx["cloud"]; u = min(1, max(0, (lt - a) / (b - a))); u = u * u * (3 - 2 * u)
        edge = lerp(W + 900, -900, u); gr = np.clip((UU + W / 2 - edge) / 1200 + .5, 0, 1)[..., None]
        shade = np.float32([0.78, 0.66, 0.6]); fr = fr * (shade + (1 - shade) * gr)
    for t0, amt in fx.get("flash", []):
        if lt >= t0: k = amt * math.exp(-(lt - t0) * 4.0); fr = fr + k * np.float32([0.75, 0.88, 1.0]) * (1 - fr)
    if fx.get("fadein") and lt < fx["fadein"]: fr = fr * (lt / fx["fadein"])
    return fr

def add_glow(fr, pt, r, bgr, a):
    d2 = ((UU + W / 2 - pt[0]) ** 2 + (VV + H / 2 - pt[1]) ** 2) / (r * r)
    return fr + (np.exp(-d2 * 2.5)[..., None] * a) * (np.float32(bgr) / 255.) * (1 - fr)
def steam(fr, base, t, z):
    lay = np.zeros((H, W), np.float32)
    for i in range(7):
        ph = (t * .45 + i / 7) % 1; x = base[0] + (noise(t * .8 + i * 3.1, 7) * 26 + (i - 3) * 6) * z * (0.4 + ph * 1.4); y = base[1] - ph * 340 * z
        cv2.circle(lay, (int(x), int(y)), int((10 + ph * 34) * z), float(.5 * math.sin(math.pi * ph)), -1)
    lay = cv2.GaussianBlur(lay, (0, 0), 14 * z)[..., None]
    return fr + lay * .55 * (np.float32([0.95, 0.97, 1.0]) - fr)
def birds(fr, t):
    for i in range(9):
        ph = hashf(i * 3.3); x = (t * (90 + ph * 60) + hashf(i) * 1400) % 1500 - 200; y = 260 + hashf(i + 9) * 520 - t * 20 + math.sin(t * 2 + i) * 14
        s = 9 + ph * 7; a = math.sin(t * (12 + ph * 5) + i) * .9
        pts = np.int32([[x - s, y - a * s * .8], [x - s * .4, y - .2 * s - a * s * .3], [x, y + .1 * s], [x + s * .4, y - .2 * s - a * s * .3], [x + s, y - a * s * .8]])
        cv2.polylines(fr, [pts], False, (0.12, 0.13, 0.16), max(2, int(s * .22)), cv2.LINE_AA)
    return fr
def leak(fr, t, a):
    x = W * (0.85 + 0.15 * math.sin(t * .6)); y = H * (0.18 + 0.05 * math.sin(t * .4))
    return add_glow(fr, (x, y), 900, (90, 170, 255), a * .55)

def ui_lock_shot(sh, lt):
    """full-frame phone close-up over a defocused bedroom: lock screen + meeting banner springing in."""
    im, d, _ = load(sh["bg"]); bg = cv2.GaussianBlur(cv2.resize(im, (W, H)), (0, 0), 22) * 0.55
    S = ui("lock_858").copy(); hS, wS = S.shape[:2]; bn = ui("banner_meeting"); bh, bw = bn.shape[:2]
    tb = lt - 0.12
    if tb > 0:
        w_ = 2 * math.pi * 1.5; z = .5; sp = 1 - math.exp(-z * w_ * tb) * (math.cos(w_ * math.sqrt(1 - z * z) * tb) + z / math.sqrt(1 - z * z) * math.sin(w_ * math.sqrt(1 - z * z) * tb))
        y0 = int(lerp(-bh - 40, hS / 2 - 80, sp)); x0 = (wS - bw) // 2; ys, ye = max(0, y0), min(hS, y0 + bh)
        if ye > ys:
            sub = bn[ys - y0: ye - y0]; a = sub[..., 3:4] * min(1, tb / .1); S[ys:ye, x0:x0 + bw, :3] = S[ys:ys + sub.shape[0], x0:x0 + bw, :3] * (1 - a) + sub[..., :3] * a
    c = cam_at({**sh, "cx": [.5, .5], "cy": [.5, .5], "rot": [0, 0], "par": [[0, 0], [0, 0]]}, lt)
    z = c["zoom"]; ph = 1700 * z; pw = ph * wS / hS; cx, cy = W / 2 + (c["cx"] - .5) * 900, H / 2 + (c["cy"] - .5) * 900
    body = bg.copy(); cv2.rectangle(body, (int(cx - pw / 2 - 18), int(cy - ph / 2 - 18)), (int(cx + pw / 2 + 18), int(cy + ph / 2 + 18)), (0.03, 0.03, 0.035), -1)
    body = cv2.GaussianBlur(body, (0, 0), 1.5); m = np.zeros((H, W), np.float32)
    cv2.rectangle(m, (int(cx - pw / 2 - 18), int(cy - ph / 2 - 18)), (int(cx + pw / 2 + 18), int(cy + ph / 2 + 18)), 1, -1); m = cv2.GaussianBlur(m, (0, 0), 30)[..., None]
    fr = bg * (1 - m * .9) + body * m * .9
    M = cv2.getPerspectiveTransform(np.float32([[0, 0], [wS, 0], [wS, hS], [0, hS]]), np.float32([[cx - pw / 2, cy - ph / 2], [cx + pw / 2, cy - ph / 2], [cx + pw / 2, cy + ph / 2], [cx - pw / 2, cy + ph / 2]]))
    return compose_rgba(fr, S, M)

def end_card(lt):
    fr = np.full((H, W, 3), 0.02, np.float32); a = min(1, max(0, (lt - .4) / .9)) * (1 - min(1, max(0, (lt - 2.6) / .7)))
    if a > 0:
        from PIL import Image, ImageDraw, ImageFont
        img = Image.new("RGB", (W, H), (5, 6, 8)); dr = ImageDraw.Draw(img)
        f1 = ImageFont.truetype(str(HERE / "fonts" / "InstrumentSerif-normal-400.ttf"), 110); f2 = ImageFont.truetype(str(HERE / "fonts" / "Inter-var.ttf"), 25)
        for txt, f, y, al in [("S T I L L   O P E N", f1, 870, 1.0), ("E P  0 1    ·    9 : 0 0   M E E T I N G", f2, 1015, .6)]:
            tw = dr.textlength(txt, font=f); c = int(240 * a * al); dr.text(((W - tw) / 2, y), txt, font=f, fill=(c, c - 4, c - 10))
        fr = np.asarray(img).astype(np.float32)[..., ::-1] / 255.
    return fr

def post(fr, frame, t):
    small = cv2.resize(fr, (W // 8, H // 8), interpolation=cv2.INTER_AREA); hi = np.clip(small - .55, 0, 1) * 2.2
    bl = cv2.resize(cv2.GaussianBlur(hi, (0, 0), 6), (W, H), interpolation=cv2.INTER_LINEAR)
    fr = 1 - (1 - fr) * (1 - bl * .35)                                       # bloom (screen)
    vig = 1 - .38 * np.clip(((UU / (W * .62)) ** 2 + (VV / (H * .6)) ** 2) - .25, 0, 1)
    fr = fr * vig[..., None]
    rng = np.random.default_rng(frame // 2); gr = rng.standard_normal((H // 2, W // 2)).astype(np.float32)
    gr = cv2.resize(gr, (W, H), interpolation=cv2.INTER_LINEAR)[..., None]; fr = fr + gr * .028 * (0.35 + fr * (1 - fr) * 2.6)
    return np.clip(fr, 0, 1)

def render(t, frame):
    for sh in SHOTS:
        if sh["t"] <= t < sh["t"] + sh["dur"]:
            lt = t - sh["t"]
            if sh.get("end"): return post(end_card(lt), frame, t)
            fr = ui_lock_shot(sh, lt) if sh.get("ui") else render_shot(sh, lt)
            return post(fr, frame, t)
    return np.zeros((H, W, 3), np.float32)

def worker(args):
    a, b, seg = args
    ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", seg], stdin=subprocess.PIPE)
    for f in range(a, b):
        ff.stdin.write((render(f / FPS, f) * 255 + .5).astype(np.uint8).tobytes())
        if f % 300 == 0: print(f"frame {f}", flush=True)
    ff.stdin.close(); ff.wait(); return seg

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "video"; out = ROOT / "out"
    if mode == "stills":
        d = out / "stills"; d.mkdir(parents=True, exist_ok=True)
        for t in map(float, sys.argv[2].split(",")): cv2.imwrite(str(d / f"t{t:06.2f}.png"), (render(t, int(t * FPS)) * 255).astype(np.uint8))
        print("stills ->", d)
    else:
        from multiprocessing import Pool
        nw = int(sys.argv[2]) if len(sys.argv) > 2 else 4; N = int(round(SPEC["duration"] * FPS)); segd = out / "seg3"; segd.mkdir(parents=True, exist_ok=True)
        cuts = [round(N * i / nw) for i in range(nw + 1)]
        jobs = [(cuts[i], cuts[i + 1], str(segd / f"seg{i:02d}.mp4")) for i in range(nw)]
        with Pool(nw) as p: segs = p.map(worker, jobs)
        (segd / "list.txt").write_text("".join(f"file '{s}'\n" for s in segs))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(segd / "list.txt"), "-c", "copy", str(out / "video.mp4")], check=True)
        print("video ->", out / "video.mp4")
