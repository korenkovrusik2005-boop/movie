"""Post-process VO intonation: smooth pitch glide on the tail of a line (question / call contour).

Kokoro ends single words with a falling pitch. We render the line at several constant pitch
offsets with ffmpeg rubberband (formants preserved), align each copy to the original
(rubberband adds latency), then crossfade copy-to-copy along the line so the pitch climbs
smoothly through the chosen span. Rules: "rise": {"start": f, "end": f, "semitones": N},
fractions of the voiced span. usage: python3 intonation.py [ids...]
"""
import json, pathlib, subprocess, sys, tempfile
import numpy as np, soundfile as sf
HERE = pathlib.Path(__file__).parent
def shifted(src, semi, sr):
    if semi == 0: return sf.read(str(src))[0]
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f: out = f.name
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(src), '-af', f"apad=pad_dur=0.5,rubberband=pitch={2 ** (semi / 12):.5f}:formant=preserved:pitchq=quality", out], check=True)
    return sf.read(out)[0]
def align(ref, x):
    er, ex = np.abs(ref), np.abs(x[: len(ref) + 24000])
    k = np.ones(240) / 240; er, ex = np.convolve(er, k, 'same'), np.convolve(ex, k, 'same')
    best = max(range(0, 9600, 24), key=lambda d: float(np.dot(er, ex[d: d + len(er)])) if d + len(er) <= len(ex) else -1)
    return x[best: best + len(ref)]
only = sys.argv[1:]
for ln in json.loads((HERE / "script.json").read_text())["lines"]:
    r = ln.get("rise")
    if not r or (only and ln["id"] not in only): continue
    src = HERE / "lines" / f"{ln['id']}.wav"; a, sr = sf.read(str(src))
    e = np.convolve(np.abs(a), np.ones(480) / 480, 'same'); v = np.where(e > 0.04 * e.max())[0]; vs, ve = v[0], v[-1]
    i0, i1 = int(vs + (ve - vs) * r["start"]), int(vs + (ve - vs) * r.get("end", 1.0))
    steps = int(np.ceil(r["semitones"])) ; semis = np.linspace(0, r["semitones"], steps + 1)
    copies = [a] + [align(a, shifted(src, s, sr)) for s in semis[1:]]
    # target pitch curve (in "copy index" units), eased
    u = np.clip((np.arange(len(a)) - i0) / max(1, i1 - i0), 0, 1) * steps
    out = np.zeros_like(a)
    for k, c in enumerate(copies):
        w = np.clip(1 - np.abs(u - k), 0, 1)  # linear crossfade between neighbouring copies
        out += w * c[: len(a)]
    out *= np.abs(a).max() / (np.abs(out).max() + 1e-9)
    sf.write(str(src), out.astype(np.float32), sr); print(ln['id'], 'rise', r)
