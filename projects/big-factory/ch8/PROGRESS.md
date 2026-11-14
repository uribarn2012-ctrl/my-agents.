# Chapter 8 "The hidden grave" (final chapter) - progress

Status: built, audio mixed, rendered (wide + phone). Not yet through quality-checker / fact-checker.
Narration: 32 lines (n00..n31, untouched). GAP/LEAD/TAIL = 0.85/0.9/6.0 (long tail holds the end screen), total about 197.4 s.

## Files
- `lines.json`, `durs.json`, `narration/`: input (untouched).
- `build_timeline.py` -> `timeline.json` (starts, ch8 sfx cues, hoof ranges lines 11, 24, 25).
- `engine.js` (ch6 engine + new 'chn' hat = Chinese-style crown for Kublai), `scene.js` + `scene2.js` (ch6 helpers; stand/walkP clamp scale > 0), `scene3.js` (cast + lines 0-5), `scene4.js` (lines 6-15), `scene5.js` (lines 16-26), `scene6.js` (lines 27-31 + render loop).
- `geo3.mjs` (run from big-factory root: `node ch8/geo3.mjs`) -> `geo3.json`: ch6 shapes plus yuan/chag/ilk/hord/crim/mugh polygons and points (kabul, agra, burkhan, crimea...).
- `make_page.py` (embeds brand/end_screen.png as window.ENDIMG), `render.py wide`, `shots.py t...`, `sheet.py out.png t...`, `mix_audio.py` (hill wind slightly stronger lines 22-30).

## Rebuild
```
node ch8/geo3.mjs   # from big-factory root, only if shapes change
cd ch8 ; python build_timeline.py ; python make_page.py ; python mix_audio.py ; python render.py wide
ffmpeg -y -i out/wide_video.mp4 -i out/audio.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -shortest out/mongols_ch8_wide.mp4
ffmpeg -y -i out/mongols_ch8_wide.mp4 -c:v libx264 -crf 30 -preset medium -c:a copy out/mongols_ch8_phone.mp4
```

## Scene map (lines)
0 map 1260, red empire cracks | 1-2 Kublai vs Ariq Boke, armies clash, counter 1260-1264 | 3 Kublai wins, three western khans walk away "NOT MY BOSS" | 4 map splits in four, labels YUAN / GOLDEN HORDE / ILKHANATE / CHAGATAI | 5 Tick between four arguing khans, backs away | 6-9 pieces fade, Ming 1368, Crimea to 1783 | 10 SIDE QUEST card | 11 Babur Kabul -> India 1526 | 12 Genghis ... mother's side -> Babur | 13 MUGHAL = MONGOL (in Persian) | 14-15 Shah Jahan, Taj Mahal rises + glow | 16-17 Mongolia today | 18 banknote + airport sign | 19 40 m silver statue + tiny person | 20-21 1 in 200 grid, FACT stamp, Tick checks hand | 22-23 the unmarked hill, SECRET stamp | 24-26 LEGEND: procession, horses trample ground flat, NOBODY CAN PROVE IT | 27 Burkhan Khaldun, GREAT TABOO + FACT | 28 satellite + drone, NOTHING. | 29 modern Mongolians, storm, shovel crossed out | 30 quiet dawn hill | 31 Tick, spinning glowing watch, YOU PICK! comment bubble, orange/white flash, end screen fades in (last ~4.5 s).

## Stamps
FACT: line 20 ("Published in a scientific journal in 2003"), line 27 (with GREAT TABOO). LEGEND: lines 24-26.

## Known issues
- Map polygons (khanates, Crimea, Mughal India) are rough shapes; the India reveal is a growing circle clipped to the shape.
- Giant statue and Taj Mahal are simple flat drawings; the statue is a recoloured horse and rider (silver), not a real silhouette.
- Procession and trampling horses are dark cartoon silhouettes, riders have the normal face drawn in dark colours.
- Tick's "checking his hand" is a drawn raised hand beside his face, expression is the flat-mouth Tick.
- Banknote has no currency text on purpose (no invented numbers).
- Facts to check: Kublai vs Ariq Boke 1260-1264, Ming 1368, Crimean Khanate until 1783, Babur 1526, Shah Jahan/Taj Mahal, 40 m statue, 2003 study 1 in 200, Burkhan Khaldun Great Taboo.
