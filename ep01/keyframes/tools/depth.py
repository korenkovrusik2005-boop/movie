"""Monocular depth for each keyframe (Depth Anything V2 Small, ONNX, Apache-2.0).
usage: python3 depth.py MODEL.onnx raw_dir depth_dir   -> depth_dir/<name>.png (16-bit, near = bright)"""
import sys, pathlib, numpy as np, cv2, onnxruntime as ort
model, src, dst = sys.argv[1], pathlib.Path(sys.argv[2]), pathlib.Path(sys.argv[3]); dst.mkdir(parents=True, exist_ok=True)
sess = ort.InferenceSession(model, providers=['CPUExecutionProvider']); iname = sess.get_inputs()[0].name
for p in sorted(src.glob('*.png')):
    img = cv2.cvtColor(cv2.imread(str(p)), cv2.COLOR_BGR2RGB); h, w = img.shape[:2]
    th, tw = 518 * 2, int(round(518 * 2 * w / h / 14)) * 14  # keep aspect, multiple of 14
    th = int(round(th / 14)) * 14
    x = cv2.resize(img, (tw, th), interpolation=cv2.INTER_CUBIC).astype(np.float32) / 255.
    x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    out = sess.run(None, {iname: x.transpose(2, 0, 1)[None].astype(np.float32)})[0].squeeze()
    d = cv2.resize(out, (w, h), interpolation=cv2.INTER_CUBIC); d = (d - d.min()) / (d.max() - d.min() + 1e-6)
    cv2.imwrite(str(dst / p.name), (d * 65535).astype(np.uint16)); print(p.name, d.shape)
