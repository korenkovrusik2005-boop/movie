#!/usr/bin/env bash
# STILL OPEN — EP01 v3 (keyframe film) build: depth maps → sound → frames → loudness-normalised MP4.
# Keyframes in keyframes/raw were generated once (Figma AI, gpt-image-2.5); see keyframes/PROMPTS.md.
set -euo pipefail
cd "$(dirname "$0")"
if [[ "${1:-}" == "--depth" ]]; then python3 keyframes/tools/depth.py "${DEPTH_MODEL:?path to depth-anything-v2-small model.onnx}" keyframes/raw keyframes/depth; fi
python3 audio/sound_v3.py
python3 film/render.py video "${WORKERS:-4}"
M=$(ffmpeg -hide_banner -i out/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
q() { echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
AF="loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(q input_i):measured_TP=$(q input_tp):measured_LRA=$(q input_lra):measured_thresh=$(q input_thresh):offset=$(q target_offset):linear=true"
ffmpeg -y -hide_banner -loglevel error -i out/video.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v libx264 -preset slow -crf 21 -maxrate 9M -bufsize 18M -pix_fmt yuv420p -profile:v high -level 4.2 -r 60 \
  -af "$AF,alimiter=limit=0.8:attack=4:release=80:level=false,aresample=48000" -c:a aac -b:a 256k -movflags +faststart -shortest out/STILL_OPEN_EP01_9am_Meeting.mp4
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt,sample_rate,channels -show_entries format=duration -of compact out/STILL_OPEN_EP01_9am_Meeting.mp4
