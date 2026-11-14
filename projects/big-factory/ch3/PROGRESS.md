# Chapter 3 "The war machine" - progress

Status: built, audio mixed, rendered (wide 1920x1080 + phone version). Not yet through quality-checker / fact-checker.

## Files
- `lines.json`, `durs.json`, `narration/n00..n43.wav`: input (untouched).
- `build_timeline.py` -> `timeline.json` (starts, ch3-specific sfx cues, hoof ranges). Total about 218.7 s.
- `engine.js`: ch2 engine + two new hats (`turban`, `plume`).
- `scene.js` (cast, helpers, map, city, weapons HUD), `scene2.js` (lines 0-13), `scene3.js` (14-21), `scene4.js` (22-34), `scene5.js` (35-43 + render loop). Joined by `make_page.py` into `page_wide.html`.
- `geo3.mjs` -> `geo3.json`: projected Western Xia, Jin, Song, Khwarezm polygons, Great Wall and city points (run from the big-factory root: `node ch3/geo3.mjs`).
- `mix_audio.py` -> `out/audio.wav`; `render.py wide` -> `out/wide_video.mp4`; `shots.py t1 t2..` -> `test_frames/`.

## Rebuild
```
python build_timeline.py ; python make_page.py ; python mix_audio.py ; python render.py wide
ffmpeg -y -i out/wide_video.mp4 -i out/audio.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -shortest out/mongols_ch3_wide.mp4
ffmpeg -y -i out/mongols_ch3_wide.mp4 -c:v libx264 -crf 28 -preset medium -c:a copy out/mongols_ch3_phone.mp4
```

## Scene map (lines)
0-2 map 1209 + size comparison | 3 title + 1-5 | 4-5 horses (jump, distance meter) | 6-7 bow (FACT) | 8-10 fake retreat on map | 11-13 information | 14-15 fear, surrender offer | 16 stories spread, flags | 17 1211 invasion | 18-19 walls, engineers | 20 Zhongdu falls, today Beijing | 21 worst decision | 22 1218 Khwarezm + Shah | 23-24 caravan, Otrar | 25-26 ambassadors, throne room | 27 Tick "Oh no." | 28-31 Khwarezm falls (map), Shah flees | 32-33 Bukhara mosque, LEGEND | 34 side quest card | 35-39 Jalal al-Din, Indus jump, Genghis and sons | 40-41 serious, dim map | 42-43 teaser, two generals.

## Stamps
FACT: line 7 (composite bow). LEGEND: line 33 ("I am the punishment of God", note: only from a historian decades later).

## Known issues / notes for quality check
- Figures are small in wide scenes (same engine scale as ch2). Indus scene scaled up once.
- Relay scene (line 13) shows one or two riders at a time, fairly sparse.
- Teaser (42-43) horses on the map are small icons.
- Year shown at Bukhara is 1220 (the narration only says 1219 for the start of the war).
- "THOUSANDS KILLED" / "RESISTED = DESTROYED" tags in lines 30 are sober text only, no imagery.
- Fact-check pending: "about 100,000" army, ~450 merchants, 1211/1215/1218/1219/1221 dates, Zhongdu = Beijing, Shah dying on a Caspian island (all as in the narration).
