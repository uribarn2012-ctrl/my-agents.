// Video 1 — "המאמן שבנה לך אימון": capture the real demo screens.
// Usage: node capture.js <outDir>
// Writes stills (*.jpg), frame folders for moving shots, and manifest.json with tap points
// (CSS px on the 390x844 screen) that the scene uses to draw touch indicators.
const path = require('path');
const fs = require('fs');
const { openDemo, shot, clip } = require('../../lib/demo.js');

const OUT = path.resolve(process.argv[2] || 'cap');
const ease = p => (p <= 0 ? 0 : p >= 1 ? 1 : p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const M = { screen: [390, 844], taps: {} };
  const { browser, page } = await openDemo({ dsf: 3 });
  const S = n => shot(page, path.join(OUT, n + '.jpg'));
  const center = async sel => { const b = await page.locator(sel).first().boundingBox(); return [Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2)]; };
  const wait = ms => page.waitForTimeout(ms);

  // Sign in with the demo's sample account and open the Workouts tab.
  await page.click('[data-act="onbHave"]'); await wait(400);
  await page.click('[data-act="tab"][data-i="2"]'); await wait(800);

  // Shot 0:03 — "ה-AI בונה בשבילך" card on the Workouts tab, then pressed.
  const card = page.locator('[data-act="builder"]:visible').first();
  await card.evaluate(el => el.scrollIntoView({ block: 'center' })); await wait(400);
  await S('train'); M.taps.card = await center('[data-act="builder"]:visible');
  await card.evaluate(el => { el.style.transform = 'scale(.96)'; el.style.boxShadow = '0 0 0 3px #4AE36B, 0 0 28px rgba(74,227,107,.55)'; el.style.background = 'rgba(74,227,107,.18)'; });
  await wait(150); await S('train_pressed');
  await card.evaluate(el => { el.style.transform = el.style.boxShadow = el.style.background = ''; });

  // Builder, step 1: the body map. Hook uses the default (full body); then quads, then glutes.
  await card.click(); await wait(500);
  await S('b_full');
  await page.click('[data-act="bFull"]'); await wait(200); await S('b_none');
  M.taps.quads = await center('[data-act="bmTap"][data-m="quads"]');
  await page.click('[data-act="bmTap"][data-m="quads"] >> nth=0', { force: true }); await wait(200); await S('b_quads');
  M.taps.glutes = await center('[data-act="bmTap"][data-m="glutes"]');
  await page.click('[data-act="bmTap"][data-m="glutes"] >> nth=0', { force: true }); await wait(200); await S('b_glutes');

  // Step 2 (time) is skipped in the video. Step 3: where + equipment.
  await page.click('[data-act="bNext"]'); await wait(250);
  await page.click('[data-act="bNext"]'); await wait(300);
  await S('eq_gym'); M.taps.home = await center('[data-act="bPlace"][data-v="home"]');
  await page.click('[data-act="bPlace"][data-v="home"]'); await wait(300); await S('eq_home');
  M.taps.dumbbells = await center('[data-act="eqToggle"][data-v="dumbbells"]');
  await page.click('[data-act="eqToggle"][data-v="dumbbells"]'); await wait(300); await S('eq_db');

  // Step 4 (how hard) -> "Create workout" -> the fake AI loading screen (held open).
  await page.click('[data-act="bNext"]'); await wait(300);
  await page.click('[data-act="bNext"]'); await wait(300);
  await clip(page, path.join(OUT, 'loading'), 75);
  await page.evaluate(() => window.__held && window.__held()); await wait(900);

  // The built workout: slow scroll down through the list, ending on the goblet squat.
  const rows = page.locator('.xrow');
  const gi = await rows.evaluateAll(a => a.findIndex(x => /גובלט/.test(x.innerText)));
  const geo = await page.evaluate(gi => { const s = document.querySelector('#sheetBody'), r = document.querySelectorAll('.xrow')[gi].getBoundingClientRect();
    return { max: s.scrollHeight - s.clientHeight, rowY: r.top + r.height / 2 }; }, gi);
  const target = Math.max(0, Math.min(geo.max, Math.round(geo.rowY - 470)));
  await clip(page, path.join(OUT, 'list'), 105, async i => {
    const y = Math.round(target * ease(Math.min(1, i / 92)));
    await page.evaluate(y => { document.querySelector('#sheetBody').scrollTop = y; }, y);
  });
  await page.evaluate(y => { document.querySelector('#sheetBody').scrollTop = y; }, target); await wait(150);
  M.taps.goblet = await center('.xrow >> nth=' + gi);

  // Exercise page: the animated figure (two full reps), then scroll to the muscle map.
  await rows.nth(gi).locator('[data-act="itOpen"]').click(); await wait(300);
  await rows.nth(gi).locator('[data-act="exInfo"]').click(); await wait(700);
  await clip(page, path.join(OUT, 'ex_fig'), 105);
  const mus = await page.evaluate(() => { const s = document.querySelector('#sheetBody'); const sec = [...s.querySelectorAll('.sec')].find(x => /שרירים/.test(x.innerText));
    const card = sec.nextElementSibling; const top = sec.offsetTop - 70; return { top: Math.min(top, s.scrollHeight - s.clientHeight), h: card.offsetHeight }; });
  await clip(page, path.join(OUT, 'ex_mus'), 75, async i => {
    const y = Math.round(mus.top * ease(Math.min(1, i / 32)));
    await page.evaluate(y => { document.querySelector('#sheetBody').scrollTop = y; }, y);
  });
  M.taps.musCard = await page.evaluate(() => { const s = document.querySelector('#sheetBody'); const sec = [...s.querySelectorAll('.sec')].find(x => /שרירים/.test(x.innerText));
    const r = sec.nextElementSibling.getBoundingClientRect(); return [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]; });

  // Guided workout: go to "set 1 of 3" of the goblet squat, type 12 kg, tap ✓.
  await page.click('[data-act="exBack"]'); await wait(500);
  await page.click('[data-act="guideStart"]'); await wait(500);
  for (let k = 0; k < 30; k++) {
    const txt = await page.locator('#guide').innerText();
    if (/גובלט/.test(txt) && /סט 1 מתוך/.test(txt) && (await page.$('#gKg'))) break;
    await page.click('[data-act="guideNext"]'); await wait(120);
    if (await page.$('[data-act="guideSkip"]')) await page.click('[data-act="guideSkip"]');
    await wait(120);
  }
  M.taps.kg = await center('#gKg'); M.taps.done = await center('[data-act="guideNext"]');
  await page.evaluate(() => document.querySelector('#gKg').focus());
  await clip(page, path.join(OUT, 'guide'), 90, async i => {
    await page.evaluate(i => {
      const kg = document.querySelector('#gKg'), b = document.querySelector('[data-act="guideNext"]');
      kg.value = i >= 33 ? '12' : i >= 24 ? '1' : '';
      if (i >= 56) { b.style.transform = 'scale(.97)'; b.style.boxShadow = '0 0 0 4px rgba(198,255,0,.9), 0 0 36px rgba(198,255,0,.6)'; b.style.filter = 'brightness(1.12)'; }
    }, i);
  });
  M.frames = { loading: 75, list: 105, ex_fig: 105, ex_mus: 75, guide: 90 };
  M.guideEvents = { one: 24, twelve: 33, press: 56 };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(M, null, 1));
  console.log(JSON.stringify(M));
  await browser.close();
})();
