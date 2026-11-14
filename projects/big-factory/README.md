# The Big FACTory: video pipeline handoff

Everything needed to continue making The Big FACTory videos in Claude Code on your own computer. Saved on 2026-11-14.

## Where we are

- **Channel:** The Big FACTory, handle @TheBigFACToryOfficial (YouTube). TikTok and Instagram are open with the same name. English only.
- **Content:** history, "what if" scenarios and wild facts. Long videos for YouTube (about 30 minutes), 3-minute vertical cuts for TikTok, Reels and Shorts.
- **First video:** The Mongol Empire. Script (8 chapters, about 30 minutes, plus a 3-minute short) is the Claude Doc "The Big FACTory: The Mongol Empire (scripts)": https://claude.ai/artifact/Foyq8kiftAihKzSYeuqkih
- **Done:** the cold open (55 s), rendered in 1920x1080 and 1080x1920. Code is in `coldopen/`.
- **Next:** Chapter 1 "The outcast". Its narration is already recorded in `ch1/narration/` (29 lines, 2:13 total, durations in `ch1/durs.json`). Scenes still need building.

## Style rules (agreed with the user)

- 2D flat style like the Ethos history channel: real maps (orange land `#f3ad45`, blue sea `#2f63c9`, red for territory `#e2362b`), simple cartoon characters with round heads and thick dark outlines.
- Narrator character: **Tick**, a time traveler (goggles on forehead, long brown coat, glowing pocket watch). Appears only at key moments, never constantly. His watch spinning is the jump between eras.
- Channel color: orange. Font: Lilita One (`assets/lilita.woff2`).
- **FACT / LEGEND stamps:** orange FACT box (as in the logo) for well-documented wild details; grey LEGEND stamp for doubtful stories. The channel's signature.
- **Side quests:** short funny side stories that stick in your head.
- Small reactions on characters: +sweat drop, +question mark, +exclamation, +angry cloud.
- Every character looks different (see the cast table in the script doc).
- Never leave the screen "dead": during slow narration, show things happening (example: people walking over Genghis Khan's hidden grave, seen in cross-section).
- Voice: Kokoro `am_michael`, speed 1.08, quick and not sleepy.
- Sound effects must be soft (the user listens with headphones): effects about 8 dB below the voice, gentle wind.
- Thumbnails can be more detailed than the videos (Ethos style: big title box, date range, map, portrait).

## Folder layout

| Path | What it is |
| --- | --- |
| `assets/` | `tick_logo.svg` (2D Tick source), `lilita.woff2` (font) |
| `brand/` | channel logo, watermark, YouTube banner, end screen |
| `tools/get_models.py` | downloads the free voice model into `models/` |
| `tools/tts.py` | turns a `lines.json` into narration `.wav` files |
| `tools/geo.mjs` | builds the map shapes (`coldopen/geo.json`) from world-atlas |
| `coldopen/` | cold open: `scene.js` (animation), `make_page.py` (builds `page_wide.html` / `page_tall.html`), `render.py` (frames to MP4), `mix_audio.py`, `timeline.json`, narration in `tts/` |
| `ch1/` | Chapter 1 lines and recorded narration |

## How the pipeline works

1. Narration lines → `tools/tts.py` → one `.wav` per line plus durations.
2. A timeline (start time of every line and every visual beat) is computed from the durations.
3. `scene.js` draws each frame as SVG for any time `t` (`render(t)`), using the timeline.
4. `render.py` opens the page in headless Chromium, renders every frame at 30 fps and pipes JPEGs into ffmpeg (H.264, CRF 18).
5. `mix_audio.py` mixes narration, wind and soft effects; ffmpeg joins sound and picture with loudness normalization (`loudnorm=I=-16`).
6. Long videos: render each chapter as its own file with the same settings, then join with the ffmpeg concat demuxer and `-c copy`.

## One-time setup on Windows

Run these in a terminal (PowerShell) inside this folder:

```
winget install OpenJS.NodeJS.LTS
winget install Python.Python.3.12
winget install Gyan.FFmpeg
npm install
pip install -r requirements.txt
python -m playwright install chromium
python tools/get_models.py
node tools/geo.mjs
```

## Rebuild the cold open (to check that setup works)

```
cd coldopen
python make_page.py
python render.py wide
python render.py tall
python mix_audio.py
ffmpeg -i out/wide_video.mp4 -i out/audio.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k -shortest out/mongols_coldopen_wide.mp4
```

## Instructions for Claude Code

Read this file and the script doc first. Then build Chapter 1 the same way as the cold open: reuse Tick, the map setup and the scene helpers from `coldopen/scene.js`; one visual beat per narration line in `ch1/lines.json`; keep characters consistent with the cast table; check a few full-size frames before the full render. Render the YouTube version only (1920x1080); the vertical short is made later from the 3-minute script.
