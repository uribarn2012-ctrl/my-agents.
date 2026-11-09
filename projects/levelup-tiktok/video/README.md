# LEVEL UP. TikTok video pipeline

Short ads (one per app area), 1080x1920, 30 fps, H.264 + a silent AAC track (music is added in TikTok).
Every frame is a pure function of time `t`, rendered in headless Chromium and encoded with ffmpeg.

## Style B — current series (matches the owner's reference ad)
Front-facing phone that rises into view, drifting green glows, two-line titles (white + lime gradient line),
dark app screens redrawn in HTML with real app labels, neon full-screen beats, app-icon end card.

```
lib/ad.js, lib/ad.css     engine: glows, titles, phone, declarative animations (data-show / data-in /
                          data-type / data-count / data-flash / data-tap / data-dots), neon HR beat, end card
scenes/part1-workouts/    scene.html = dictionary {en, he} + timeline + screen markup
assets/appicon.png        the app icon (from Sources/Assets.xcassets)
fonts/                    Heebo (Hebrew), Plus Jakarta Sans (English), Barlow Condensed — SIL OFL
```

```
node lib/render.js scenes/part1-workouts/scene.html out/levelup-part1-workouts-en.mp4 --lang en --frames /tmp/x/en
node lib/render.js scenes/part1-workouts/scene.html out/levelup-part1-workouts-he.mp4 --lang he --frames /tmp/x/he
node lib/render.js scenes/part1-workouts/scene.html x.mp4 --lang he --only 2.4,8.9     # quick stills only
```

New part: copy `scenes/part1-workouts`, change the dictionary (both languages), `beats` (titles),
`phone` keys, `screens` markup, and optionally `neon` / `notes` / `end`.
Safe zone: titles at x 150–930 from y 200; the "Sample data" note sits at y 1480; nothing important below y 1536.

## Style A — first sample (3D tilting phone with screenshots of the demo)
`lib/stage.js`, `lib/stage.css`, `lib/demo.js`, `scenes/01-workouts/` (capture.js grabs real demo screens first):
```
node scenes/01-workouts/capture.js /tmp/x/cap01
node lib/render.js scenes/01-workouts/scene.html out/levelup-01-workouts.mp4 --cap /tmp/x/cap01
```
