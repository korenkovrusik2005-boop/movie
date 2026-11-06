#!/usr/bin/env bash
# STILL OPEN — EP01 full build: (VO) → sound → frames → loudness-normalised MP4.
# usage: ./build.sh            # uses committed VO lines
#        ./build.sh --vo       # regenerate VO with Kokoro (needs KOKORO_DIR with model.onnx + voices/)
set -euo pipefail
cd "$(dirname "$0")"
if [[ "${1:-}" == "--vo" ]]; then (cd vo && python3 gen_vo.py && python3 intonation.py) && python3 - <<'PY'
import json, soundfile as sf, pathlib
d = {p.stem: round(sf.info(str(p)).duration, 3) for p in sorted(pathlib.Path('vo/lines').glob('*.wav'))}
json.dump(d, open('vo/durations.json', 'w'), indent=1)
PY
fi
python3 audio/sound.py
(cd visual && node render.mjs video "${WORKERS:-4}")
# two-pass EBU R128 loudness normalisation to -14 LUFS / -1.5 dBTP (social platforms)
M=$(ffmpeg -hide_banner -i out/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
q() { echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
AF="loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(q input_i):measured_TP=$(q input_tp):measured_LRA=$(q input_lra):measured_thresh=$(q input_thresh):offset=$(q target_offset):linear=true"
ffmpeg -y -hide_banner -loglevel error -i out/video.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 20 -maxrate 10M -bufsize 20M -pix_fmt yuv420p -profile:v high -level 4.2 -r 60 \
  -af "$AF,alimiter=limit=0.8:attack=4:release=80:level=false,aresample=48000" -c:a aac -b:a 256k -movflags +faststart -shortest out/STILL_OPEN_EP01_9am_Meeting.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,channels -show_entries format=duration -of compact out/STILL_OPEN_EP01_9am_Meeting.mp4
