// Render a scene to MP4: step t frame by frame in headless Chromium, screenshot, encode with ffmpeg.
//
//   node lib/render.js <scene.html> <out.mp4> [--lang en|he] [--cap <captureDir>] [--frames <tmpDir>]
//                      [--only 0.5,4.2] [--from 0 --to 30]
//
// --cap    folder with screen captures + manifest.json (style A scenes); default: no captures
// --only   renders just those times to PNG (quick look) and skips encoding
// Output: H.264 High, yuv420p, 30 fps, faststart, with a silent AAC track (the owner adds music in TikTok).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };
const pos = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const [scene, outFile] = pos;
if (!scene || !outFile) { console.error('usage: node lib/render.js <scene.html> <out.mp4> [--lang he] [--cap dir] [--frames dir] [--only t,t]'); process.exit(1); }
const ROOT = path.resolve(__dirname, '..');
const capDir = opt('cap') ? path.resolve(opt('cap')) : null;
const lang = opt('lang') || 'en';
const frameDir = path.resolve(opt('frames') || path.join(require('os').tmpdir(), 'lu-frames-' + path.basename(scene, '.html') + '-' + lang));

(async () => {
  const manifest = capDir ? JSON.parse(fs.readFileSync(path.join(capDir, 'manifest.json'), 'utf8')) : {};
  const assets = 'file://' + (capDir || path.join(ROOT, 'assets'));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('scene error:', e.message));
  await page.goto('file://' + path.resolve(scene));
  const info = await page.evaluate(([a, m, o]) => window.SCENE_INIT(a, m, o), [assets, manifest, { lang }]);
  const fps = info.fps;

  const only = opt('only');
  if (only) {
    fs.mkdirSync(frameDir, { recursive: true });
    for (const t of only.split(',').map(Number)) {
      await page.evaluate(t => window.render(t), t);
      const f = path.join(frameDir, `${lang}-t${t.toFixed(2).padStart(5, '0')}.png`); await page.screenshot({ path: f }); console.log(f);
    }
    await browser.close(); return;
  }

  fs.rmSync(frameDir, { recursive: true, force: true }); fs.mkdirSync(frameDir, { recursive: true });
  const from = +(opt('from') || 0), to = +(opt('to') || info.duration);
  const n0 = Math.round(from * fps), n1 = Math.round(to * fps), t0 = Date.now();
  for (let n = n0; n < n1; n++) {
    await page.evaluate(t => window.render(t), (n + 0.0001) / fps);
    await page.screenshot({ path: path.join(frameDir, String(n - n0).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 95 });
    if (n % 90 === 0) console.log(`frame ${n}/${n1}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await browser.close();

  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  const ff = spawnSync('/usr/bin/ffmpeg', ['-y', '-loglevel', 'error',
    '-framerate', String(fps), '-i', path.join(frameDir, '%05d.jpg'),
    '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-map', '0:v', '-map', '1:a', '-shortest',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p',
    '-r', String(fps), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', path.resolve(outFile)], { stdio: 'inherit' });
  if (ff.status !== 0) process.exit(ff.status || 1);
  console.log('wrote', path.resolve(outFile));
})();
