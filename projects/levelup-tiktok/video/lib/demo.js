// Shared helpers: open the LEVEL UP demo (design/demo/levelup-live.html) in a phone-sized
// headless Chromium, in Hebrew, signed in, and capture stills or short frame sequences.
// No AI key is used: the demo fakes the AI builder with a local timer.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const DEMO = process.env.LU_DEMO || '/home/user/-/design/demo/levelup-live.html';

async function openDemo({ lang = 'he', dsf = 3, holdBuild = true } = {}) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dsf });
  await page.addInitScript(({ lang, holdBuild }) => {
    try { localStorage.setItem('lu-lang', lang); } catch (e) {}
    // Virtual clock for the animated exercise figures (they read performance.now()).
    const realNow = performance.now.bind(performance);
    window.__vt = null;
    performance.now = () => (window.__vt == null ? realNow() : window.__vt * 1000);
    // Hold the fake "AI is building" timer (1800 ms) so we can film the loading screen.
    if (holdBuild) {
      const st0 = window.setTimeout;
      window.setTimeout = function (fn, ms, ...a) {
        if (ms === 1800 && typeof fn === 'function') { window.__held = fn; return 0; }
        return st0.call(window, fn, ms, ...a);
      };
    }
  }, { lang, holdBuild });
  await page.goto('file://' + DEMO);
  await page.addStyleTag({ content: `
    body{padding:0!important;margin:0!important;background:#000!important}
    #toast,#notif{display:none!important}
    #island{display:none!important}            /* the video draws its own Dynamic Island */
    *{caret-color:transparent!important}
    ::-webkit-scrollbar{display:none}` });
  await page.waitForTimeout(600);
  return { browser, page };
}

// Wait for the figure loop (setTimeout 33ms + rAF) to redraw.
const settle = (page, ms = 90) => page.waitForTimeout(ms);

async function shot(page, file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, type: file.endsWith('.jpg') ? 'jpeg' : 'png', quality: file.endsWith('.jpg') ? 92 : undefined });
}

// Capture `n` frames at 30 fps of virtual time. `step(i, t)` may change the page before each frame.
async function clip(page, dir, n, step) {
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < n; i++) {
    const t = 10 + i / 30;
    await page.evaluate(t => { window.__vt = t; }, t);
    if (step) await step(i, t);
    await settle(page);
    await shot(page, path.join(dir, String(i).padStart(4, '0') + '.jpg'));
  }
  await page.evaluate(() => { window.__vt = null; });
}

module.exports = { openDemo, shot, clip, settle };
