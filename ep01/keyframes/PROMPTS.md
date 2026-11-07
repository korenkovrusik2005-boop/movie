# EP01 — ключевые кадры

Сгенерированы через Figma AI (`generate_image`, модель `gpt-image-2.5-flare`, 864×1536), файл Figma «STILL OPEN — EP01 keyframes». `k13_busstop_ref` — референс, который прислал пользователь.

## Библия персонажа (дословно в каждом промпте)
> young man, mid-20s, slim, warm light-brown skin, thick dark eyebrows, dark brown eyes, short dark messy curly hair, light stubble; olive-brown cotton overshirt jacket over a white t-shirt, dark charcoal trousers, white sneakers, black backpack.

## Библия стиля (дословно в каждом промпте)
> Vertical 9:16 cinematic frame, semi-realistic painterly digital illustration with the polish of a modern Japanese animated feature film, soft film grain. … Morning after rain, wet reflective asphalt, low golden sun vs cool blue shadows, haze. Completely empty city: no people, no cars. Year 2026. No text.

## Кадры
| Файл | Что | Роль в монтаже |
|---|---|---|
| k01_wake_face | Просыпается, лицо в свете телефона | открывающий кадр |
| k03_eyes_wide | ECU: глаза распахнуты | «Oh, shit. I'm late.», краш-зум |
| k04_topdown_jump | Сверху: срывает одеяло | рывок |
| k05_hallway_rush | Уровень пола: прыгает, надевая кед | бег |
| k06_curtains_outside | Снаружи окна: распахивает шторы, свет в лицо | вспышка света |
| k07_window_ots | Через плечо: пустая улица внизу | обнаружение |
| k08_birdseye_bus | С высоты: автобус с открытыми дверями | для никого |
| k09_window_face | Крупно: растерянность | «What the hell?» |
| k10_door_out | Выбегает из подъезда, замедляется | выход |
| k11_avenue_call | Один посреди проспекта, ладонь у рта | «Hello?» |
| k12_puddle_reflection | Перевёрнутое отражение в луже | тишина, шаг |
| k13_busstop_ref | Остановка (референс пользователя) | автобус приходит |
| k14_inside_bus | Изнутри пустого автобуса | «Anybody?» |
| k15_signal | Зелёный человечек, никто не идёт | тики |
| k16_cafe_machine | Автомат наливает кофе в пустом кафе | для никого |
| k17_pov_phone | POV: телефон (чистый экран → UI) | «9:00 Meeting · Join» |
| k18_smile_phone | Тихая улыбка облегчения | «Guess I'm not going…» |
| k19_lying_crosswalk | Дрон: лежит звездой на зебре | свобода |
| k20_walk_free | Идёт с кофе, смеётся в небо, птицы | свобода |
| k21_bench_fading | На скамейке, улыбка гаснет, туча | трещина |
| k22_pov_phone_cloud | POV: телефон (чистый экран → переписка/звонок) | Mom ❤️ |
| k23_tears_eyes | ECU: слёзы | осознание |
| k24_phone_ear | Профиль, телефон у уха | гудки |
| k25_city_wide_call | Огромный пустой город, фигура под навесом | отъезд, обрыв |

UI телефона не генерируется: экраны рендерятся из `visual/` (`ui_export.mjs` → `keyframes/ui/*.png`) и натягиваются в перспективе на экран, найденный автоматически (`screen_quads.json`). Карты глубины для параллакса — Depth Anything V2 Small (Apache-2.0), `keyframes/tools/depth.py`.
