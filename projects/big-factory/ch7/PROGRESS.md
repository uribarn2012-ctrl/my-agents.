# Chapter 7 "Top of the world" - progress

Status: built, audio mixed, rendered (wide + phone). Not yet through quality-checker.
Narration: 41 lines (n00..n40, untouched). GAP/LEAD/TAIL = 0.85/0.9/2.0, total about 237.1 s (3:57).

## Files
- `lines.json`, `durs.json`, `narration/`: input (untouched).
- `build_timeline.py` -> `timeline.json` (starts, ch7 sfx cues, hoof beat for lines 0 and 14).
- `engine.js` (ch6 engine + new 'mian' Chinese imperial crown hat; place() scale clamped to avoid NaN), `scene.js` (ch6 helpers/map, unchanged), `scene2.js` + `scene3.js` (only shared helpers kept from ch6, scenes removed), `a7.js` (ch7 cast, helpers, lines 0-16), `b7.js` (lines 17-40), `r7.js` (render loop).
- `geo3.mjs` (run from big-factory root: `node ch7/geo3.mjs`) -> `geo3.json`: ch6 shapes + yuan/chag/ilk/hord empire pieces, crack lines, many new points (baghdad, ainjalut, cairo, hakata, venice, caffa, genoa, constant, sicily, beijing...).
- `make_page.py`, `render.py wide`, `shots.py t...`, `sheet.py out.png t...`, `mix_audio.py`.

## Rebuild
```
python build_timeline.py ; python make_page.py ; python mix_audio.py ; python render.py wide
ffmpeg -y -i out/wide_video.mp4 -i out/audio.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -shortest out/mongols_ch7_wide.mp4
ffmpeg -y -i out/mongols_ch7_wide.mp4 -c:v libx264 -crf 30 -preset medium -c:a copy out/mongols_ch7_phone.mp4
```
Note: in map scenes always call `m.cam(...)` BEFORE `marrow(...)` in the frame (else the arrow uses a stale camera on the first frame).

## Scene map (lines)
0 map Middle East, Hulagu portrait, army to Baghdad, 1250s | 1 glowing Baghdad, caliph, library shelf | 2 city falls (smoke, red flag, scrolls on river, caliph portrait greys out), 1258 | 3 carpet roll + LEGEND stamp + "old sources don't agree" | 4-6 map: red arrow stops at blue wall, AIN JALUT 1260, Mamluks, "THEY CAN BE BEATEN" | 7 Kublai on throne | 8-9 map: Yuan, southern China turns red, Beijing palace | 10 side-quest card + Tick | 11-12 court, Marco Polo walks in, 17 | 13-14 paper money, coal, fast messenger | 15-16 Venice laughs "MAKING IT UP?", historians argue | 17 card "THE DIVINE WIND" | 18-19 sea map Korea-Japan, 1274 / 1281 fleets, storm, typhoon, KAMIKAZE = DIVINE WIND | 20 huge fleet 1281 | 21-22 samurai + Hakata stone wall, weeks | 23 typhoon, ships tip and sink, Tick with umbrella flipping | 24 2011 divers + shipwreck + FACT | 25-26 four red pieces grow, counter to ~23 MILLION square km, LARGEST CONNECTED LAND EMPIRE | 27-28 trade map, coins, Yam post and gold road China to Black Sea | 29 caravan China to Black Sea | 30 goods icons | 31 glowing web, PAX MONGOLICA | 32 three religions | 33-34 darker map, 1340s, purple dots along routes | 35-36 Caffa 1346, horde army, plague (green faces) | 37-38 catapult silhouettes, dark "?" over wall, historians argue | 39 dark line Crimea to Italy, spreads over Europe | 40 empire map cracks into four pieces, ITS OWN FAMILY.

## Stamps
LEGEND: line 3 (carpet). FACT: line 24 (2011 shipwreck). No other stamps.

## Known issues
- Map labels on far-zoom maps are small; Hulagu/Kublai/caliph portraits are round crops (hats partly cut).
- Hakata samurai raise one arm in a stiff pose; shipwreck is a simple drawn hull.
- Empire pieces (Yuan/Chagatai/Ilkhanate/Golden Horde) are rough shapes.
- Facts for fact-checker: Ain Jalut 1260, Hulagu/Baghdad 1258, Hakata wall, 2011 wreck, Caffa 1346, 23 million km2 (all from the supplied lines, not added by the video).


## Status
APPROVED by quality-checker (portraits, labels, fleet, umbrella fixed).
