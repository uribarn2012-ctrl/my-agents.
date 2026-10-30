# LEVEL UP. TikTok video pipeline

1080x1920, 30 fps, H.264 + silent AAC. Every frame is a pure function of time `t`.

```
lib/demo.js     open design/demo/levelup-live.html in Hebrew (390x844 @3x), capture stills and frame clips
lib/stage.js    shared engine: drawn iPhone (front/back faces), camera keys with springs, kinetic Hebrew type,
                taps, lime flash, logo sting, end card, "נתונים לדוגמה" note
lib/stage.css   series look (black, lime #C6FF00, Heebo 900 slanted, Barlow Condensed for LEVEL UP.)
lib/render.js   steps t in headless Chromium, screenshots, encodes with ffmpeg
fonts/          local Heebo + Barlow Condensed (SIL OFL)
scenes/NN-name/ capture.js (which demo screens to grab) + scene.html (timeline: screens, cam, taps, titles)
```

Make a video (temporary files go outside the repo):

```
TMP=/path/to/scratch
node scenes/01-workouts/capture.js $TMP/cap01            # ~2 min
node lib/render.js scenes/01-workouts/scene.html $TMP/cap01 out/levelup-01-workouts.mp4 --frames $TMP/frames01   # ~2 min
node lib/render.js scenes/01-workouts/scene.html $TMP/cap01 x.mp4 --frames $TMP/look --only 4.4,13.2   # quick stills
```

New video: copy `scenes/01-workouts`, change the capture steps and the timeline in `scene.html`.
Safe zone: titles sit in x 180–900, from y 210; nothing important below y 1536.
