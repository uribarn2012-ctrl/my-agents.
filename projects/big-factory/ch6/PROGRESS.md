# Chapter 6 "Inside the Khan's court" - progress

Status: built, audio mixed, rendered (wide + phone). Not yet through quality-checker / fact-checker.
Narration: 35 lines (n00..n34, untouched). GAP/LEAD/TAIL = 0.85/0.9/2.0, total about 194.6 s.

## Files
- `lines.json`, `durs.json`, `narration/`: input (untouched).
- `build_timeline.py` -> `timeline.json` (starts, ch6 sfx cues, hoof ranges for lines 4-5, 7, 9).
- `engine.js` (ch5 engine + new hats tonsure/tiara/kerch/cap/skull/bald and `apron` option), `scene.js` (ch6 cast + helpers + map), `scene2.js` (helpers + lines 0-15), `scene3.js` (lines 16-34 + render loop). `s2_new.js`, `s2b_new.js`, `s3_new.js` are the source pieces that were merged into scene2/scene3 (edit scene2/scene3 directly; they are the ones used).
- `geo3.mjs` (run from big-factory root: `node ch6/geo3.mjs`) -> `geo3.json`: ch5 shapes plus points lyon, krakow, steppe, metz.
- `make_page.py`, `render.py wide`, `shots.py t...`, `sheet.py out.png t...`, `mix_audio.py`.

## Rebuild
```
python build_timeline.py ; python make_page.py ; python mix_audio.py ; python render.py wide
ffmpeg -y -i out/wide_video.mp4 -i out/audio.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -shortest out/mongols_ch6_wide.mp4
ffmpeg -y -i out/mongols_ch6_wide.mp4 -c:v libx264 -crf 30 -preset medium -c:a copy out/mongols_ch6_phone.mp4
```

## Scene map (lines)
0-2 map 1246, Europe "?", Pope + Carpine portraits, route Lyon->Karakorum "1+ YEAR", zoom into Karakorum icon | 3 QUICK SIDE QUEST card + Tick | 4-5 Carpine riding hard (sweat), THE YAM sign | 6 relay stations on map, fresh horses | 7 horse swaps, sky dawn->night | 8 paiza (big, then in courier's hand, keeper bows, fresh horse) | 9 fastest mail | 10 Guyuk crowned, Carpine watches | 11-12 reply letter "COME HERE YOURSELF..." | 13 archive shelf + FACT | 14 Guyuk fades (1248) | 15 family tree Genghis-Tolui-Mongke, crown moves, 1251 | 16-17 Rubruck + notebook | 18 Karakorum vs French village | 19 crowd (Chinese, Persians, captives) | 20 temple/mosque/church | 21 Paquette map Metz-Hungary-Karakorum | 22 card "THE DRINKING TREE" | 23-26 silver tree, Boucher, angel, four drinks, Tick with four cups, FACT | 27 card "THE GREAT RELIGION DEBATE" | 28-31 debate, NOBODY CONVINCED, everyone drinks | 32-33 Tengri, prayers with "FOR THE KHAN" notes | 34 map pans to China, silhouette with crown and "?".

## Stamps
FACT: line 13 (letter still in the Vatican archives), line 26 (Rubruck saw the tree with his own eyes). No LEGEND stamp.

## Known issues
- Pope's tiara is partly cut by the round portrait frame.
- Friars/priests are simple round-head cartoons; Carpine/Rubruck distinguished by beard and age colours.
- Map zones are rough shapes; China/Karakorum positions approximate.
- Tick holds the four cups with his raised hand (cups hover around it), not literally four hands.
- Silhouette in line 34 is a black-filtered portrait with a gold crown drawn on top.
- Facts to check: Carpine 1246 arrival, Yam stations about 30 miles, Guyuk letter wording, Guyuk d. 1248, Mongke 1251, Rubruck debate 1254, Boucher tree, Paquette of Metz.
