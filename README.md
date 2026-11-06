# FoldShift — STILL OPEN

Оригинальный короткий сериал для Shorts / Reels / TikTok. Внутренняя концепция: **LAST SEEN**.

2026 год. Все люди исчезли, остался один человек. Мир продолжает работать: автобусы ходят по расписанию, кофемашины варят кофе, телефон получает уведомления. Каждая серия строится вокруг одного уведомления.

| Серия | Название | Длительность | Файл |
|---|---|---|---|
| 01 | 9:00 Meeting | 63.6 с | [`ep01/out/STILL_OPEN_EP01_9am_Meeting.mp4`](ep01/out/STILL_OPEN_EP01_9am_Meeting.mp4) |

## Структура

```
ep01/
  timeline.json        единый таймлайн: сцены, реплики, события (общий для картинки и звука)
  storyboard.md        раскадровка: варианты по сценам и выбранные решения
  build.sh             полная сборка: звук → кадры → MP4 (loudnorm -14 LUFS)
  vo/                  script.json, gen_vo.py (Kokoro TTS), lines/*.wav, durations.json
  audio/sound.py       синтез эмбиента, foley, музыки, VO-дакинг, микс
  visual/
    core.js            движок 2.5D: камера-проекция слоёв, DOF-блюр, 3D-lite, силуэт героя, пост
    ep01.js            сцены эпизода + мастер-таймлайн + субтитры
    ep01.html          страница рендера и превью (скраб + плей с миксом)
    render.mjs         headless Chromium → JPEG-пайп → ffmpeg (параллельно по воркерам)
    fonts/             Instrument Serif, Inter (OFL)
  out/                 итоговый MP4
```

## Сборка

Требуются Python 3 (numpy, scipy, soundfile), Node 22, Playwright с Chromium и ffmpeg.

```bash
cd ep01 && ./build.sh          # VO берётся из vo/lines
./build.sh --vo                # перегенерировать VO (KOKORO_DIR = папка с model.onnx и voices/)
```

Превью: `python3 -m http.server -d ep01`, затем открыть `http://localhost:8000/visual/ep01.html`.

## Звук и голос: лицензии

- **Голос:** Kokoro-82M (Apache-2.0), голос `am_michael`, синтез локально через kokoro-onnx. Перед публикацией сверь условия на голосовые пакеты. Для брендовой версии можно заменить файлы в `vo/lines/` на озвучку FoldShift Narrator из ElevenLabs, имена файлов те же.
- **Музыка и звуковые эффекты:** синтезированы с нуля в `audio/sound.py`, внешних сэмплов нет.
- **Шрифты:** Instrument Serif и Inter, SIL Open Font License.
