# Chapter 5 "Knocking on Europe's door" - progress

Status: built, audio mixed, rendered (wide + phone). Not yet through quality-checker / fact-checker.
Narration: 35 lines (n00..n34, untouched). Timing GAP/LEAD/TAIL = 0.85/0.9/2.0, total about 196.7 s.

## Files
- `lines.json`, `durs.json`, `narration/`: input (untouched).
- `build_timeline.py` -> `timeline.json` (starts, ch5 sfx cues, hoof ranges).
- `engine.js` (ch4 engine + `crown` hat), `scene.js` (cast incl. oge, batu, subO, bela, kn1, kn2, hun + helpers + map), `scene2.js` (helpers + lines 0-9), `scene3.js` (lines 10-34 + render loop). `make_page.py` -> `page_wide.html`.
- `geo3.mjs` (run from big-factory root: `node ch5/geo3.mjs`) -> `geo3.json`: adds pol, hun, kor, rusZ, horde shapes and Europe points.
- `mix_audio.py`, `render.py wide`, `shots.py t...`, `sheet.py out.png t...`.

## Rebuild
```
python build_timeline.py ; python make_page.py ; python mix_audio.py ; python render.py wide
ffmpeg -y -i out/wide_video.mp4 -i out/audio.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -shortest out/mongols_ch5_wide.mp4
ffmpeg -y -i out/mongols_ch5_wide.mp4 -c:v libx264 -crf 28 -preset medium -c:a copy out/mongols_ch5_phone.mp4
```

## Scene map (lines)
0-1 map 1229, Ogedei portrait + cup | 2 Karakorum rises | 3 four red arrows | 4 Batu + Subutai ride | 5 map 1237-1240 Rus | 6 Kyiv falls | 7-9 split, APR 9 Legnica, APR 11 Mohi | 10-16 Mohi diagram (bridge, catapults, night flank, ring of wagons, gap, Hungarians pour out, Tick facepalm) | 17 Bela flees | 18 Adriatic island | 19 two armies, FACT | 20-21 Vienna/Adriatic, WIDE OPEN | 22 Tick + France map | 23 they leave | 24 Ogedei dies | 25 princes ride home | 26 red drains east 1242 | 27 Sarai | 28 Golden Horde, 200+ years | 29-31 two theory cards, "probably a mix" | 32 Europe got lucky (clover) | 33 Europe asks | 34 friar walks east.

## Stamps
FACT: line 19 (two armies wiped out, 2 days apart). No LEGEND stamp.

## Known issues
- Mohi is a schematic top-down diagram with small soldier dots; Hungarians "pour out" and fade on the road (non-graphic).
- Map zones (Poland, Hungary, Rus, Horde) are rough shapes, not exact borders.
- Year counter in line 28 runs 1242 -> 1442 to show "200+ years".
- Tick facepalm is a hand overlay on the same Tick art (waving arm still visible).
- Facts to check: Mohi river Sajo, Legnica Apr 9, Mohi Apr 11, Bela on island, Ogedei Dec 1241, Sarai on Volga.
