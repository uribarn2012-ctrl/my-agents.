# Chapter 2 "One people" progress

Done: scene.js (+ engine.js copied from ch1), timeline, audio mix, full render.
Output: out/mongols_ch2_wide.mp4 (1920x1080, 3:32), out/mongols_ch2_phone.mp4 (22 MB).
Not yet done: a frame-by-frame review of the whole render. Only 8 test frames were checked.

Next steps:
1. Watch out/mongols_ch2_phone.mp4. Look at Tick's raised eyebrows (line 17), Jamukha's smirk, and the two tiny riders on the map (lines 21-23).
2. To fix a scene, edit scene.js (one `S(firstLine, lastLine, ...)` block per scene). Then run:
   `python make_page.py ; python shots.py <seconds>` to check one frame, then do the full render and mux again (commands in the task).
