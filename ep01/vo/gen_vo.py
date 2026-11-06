"""Generate EP01 voice-over lines with Kokoro-82M (Apache-2.0) via kokoro-onnx.

Model + voices are downloaded from huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX
into $KOKORO_DIR (not committed: 325 MB). Output: ep01/vo/lines/*.wav (24 kHz mono).
"""
import json, os, sys, pathlib
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

HERE = pathlib.Path(__file__).parent
KDIR = pathlib.Path(os.environ.get("KOKORO_DIR", "kokoro"))
VOICE = os.environ.get("VO_VOICE", "am_michael")
SPEED = float(os.environ.get("VO_SPEED", "0.88"))

# Kokoro-onnx wants an .npz voices pack; build it from the raw .bin style tensors.
pack = KDIR / "voices.npz"
if not pack.exists():
    vs = {p.stem: np.fromfile(p, dtype=np.float32).reshape(-1, 1, 256) for p in (KDIR / "voices").glob("*.bin")}
    np.savez(pack, **vs)

k = Kokoro(str(KDIR / "model.onnx"), str(pack))
lines = json.loads((HERE / "script.json").read_text())["lines"]
out = HERE / "lines"; out.mkdir(exist_ok=True)
only = sys.argv[1:]
for ln in lines:
    if only and ln["id"] not in only:
        continue
    audio, sr = k.create(ln["text"], voice=ln.get("voice", VOICE), speed=ln.get("speed", SPEED), lang="en-us")
    # trim leading/trailing silence, keep 40 ms pads
    a = np.asarray(audio, dtype=np.float32)
    idx = np.where(np.abs(a) > 0.01)[0]
    a = a[max(0, idx[0] - int(0.04 * sr)): idx[-1] + int(0.12 * sr)]
    sf.write(out / f"{ln['id']}.wav", a, sr)
    print(f"{ln['id']}: {len(a)/sr:.2f}s  {ln['text']}")
