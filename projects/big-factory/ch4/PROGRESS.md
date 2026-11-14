# Chapter 4 "The great raid" - progress

Status: built, audio mixed, rendered (wide 1920x1080 + phone). Not yet through quality-checker / fact-checker.
Narration: 29 lines, 109.7 s (updated version: Jebe dies on the way home, "The Mongols will be back", "His heirs"). Total video about 121.8 s.

## Files
- `lines.json`, `durs.json`, `narration/n00..n28.wav`: input (untouched).
- `build_timeline.py` -> `timeline.json` (starts, ch4 sfx cues, hoof ranges).
- `engine.js` (ch3 engine + `rus` pointed helmet), `scene.js` (cast + helpers + map), `scene2.js` (lines 0-11 + shared helpers), `scene3.js` (lines 12-28 + render loop). `make_page.py` joins them into `page_wide.html`.
- `geo3.mjs` -> `geo3.json` (run from big-factory root: `node ch4/geo3.mjs`): ch3 shapes + new points (Georgia, Caucasus, Cumans, Rus), lasso path `loop`/`back`, empire polygon `emp`.
- `mix_audio.py` -> `out/audio.wav`; `render.py wide`; `shots.py t...` -> `test_frames/`; `sheet.py out.png t...` contact sheet.

## Rebuild
```
python build_timeline.py ; python make_page.py ; python mix_audio.py ; python render.py wide
ffmpeg -y -i out/wide_video.mp4 -i out/audio.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -shortest out/mongols_ch4_wide.mp4
ffmpeg -y -i out/mongols_ch4_wide.mp4 -c:v libx264 -crf 28 -preset medium -c:a copy out/mongols_ch4_phone.mp4
```

## Scene map (lines)
0-2 map 1220, Shah runs, JEBE / SUBUTAI arrows (anvil + "son of a blacksmith") | 3-4 Shah dies on island, riders keep going | 5-6 red lasso around Caspian, Georgia army crushed (X), Caucasus, plains | 7-10 Cumans, Rus princes, ambassadors, dust puff | 11 Tick, Otrar = Kalka | 12-16 Kalka 1223 fake retreat map | 17 chronicle scroll + FACT | 18-19 feast table (cloth to the ground), CUT TO BLACK, text on black | 20 ride home, Jebe fades gently (halo), Subutai continues | 21-23 loop closes, roads/rivers, rich and divided, "SEE YOU IN 14 YEARS" | 24 1227 Western Xia | 25 three options with "?" | 26 body carried to unmarked hill | 27-28 red empire map, his sons, arrow to Europe "?".

## Stamps
FACT: line 17 (caption "HORRIBLE, BUT IT'S IN THE RUS CHRONICLES"). No LEGEND stamp.

## Known issues / notes for quality check
- Kalka scene blocks are small and partly near the Black Sea coast (map is a schematic).
- Black cut in 18-19 lasts about 4.5 s (text on black: "No royal blood spilled. No mercy either.").
- Feast characters are upper bodies only behind a cloth-covered table (nothing shown below by design).
- Cumans/Rus/Georgian cast use simple cartoon looks; Georgians only as blue soldier block.
- Fact-check pending: ~20,000 riders, 1220/1223/1227 dates, Jebe's death on the way home, 14 years (1223 to 1237 invasion of Rus), "Western Xia".


## Status
APPROVED by quality-checker and fact-checker (narration lines 20, 21, 23, 28 corrected after fact-check).
