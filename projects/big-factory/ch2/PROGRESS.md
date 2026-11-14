# Chapter 2 "One people" progress

Done: scene.js (+ engine.js copied from ch1), timeline, audio mix, full render.
Output: out/mongols_ch2_wide.mp4 (1920x1080, 3:32), out/mongols_ch2_phone.mp4 (22 MB).
Not yet done: a frame-by-frame review of the whole render. Only 8 test frames were checked.

Update: sound cues and hoof ranges in build_timeline.py rewritten for ch2 (hoof only on lines 1, 13, 16, 23, 24). Tick's brows checked (sit on face), map riders, feast/trap flip, decimal grids, scrolls and closing zoom-out checked: no fixes needed. Final video rebuilt. Not done: full frame-by-frame review.

Old next steps:
1. Watch out/mongols_ch2_phone.mp4. Look at Tick's raised eyebrows (line 17), Jamukha's smirk, and the two tiny riders on the map (lines 21-23).
2. To fix a scene, edit scene.js (one `S(firstLine, lastLine, ...)` block per scene). Then run:
   `python make_page.py ; python shots.py <seconds>` to check one frame, then do the full render and mux again (commands in the task).
