// Screenshot + smoke test: node tools/shots.cjs  (expects a static server on :8765)
// Writes 5 small iPhone screenshots to screenshots/. Set SHOTS_DEBUG=<dir> to also save desktop shots there.
const { chromium, devices } = require('playwright');
const OUT = __dirname + '/../screenshots/';
const DBG = process.env.SHOTS_DEBUG;
const URL = 'http://localhost:8765/index.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const [label, opts] of [['iphone', devices['iPhone 13']], ['desktop', { viewport: { width: 1366, height: 800 } }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const shot = async (name) => {
      if (label === 'iphone') await page.screenshot({ path: OUT + `iphone-${name}.png`, scale: 'css' });
      else if (DBG) await page.screenshot({ path: `${DBG}/desktop-${name}.png` });
    };
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${label}] ${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
    await page.goto(URL);
    await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });
    await sleep(1500);
    await shot('1-menu');
    await page.click('#btnFree');
    await sleep(300);
    await page.click('#btnStart');
    await page.waitForFunction(() => window.__G.mode === 'game', null, { timeout: 120000 });
    // ×64 for a few seconds: measure the achieved speed
    await page.click('#speed button[data-speed="64"]');
    await sleep(5000);
    const sp64 = await page.evaluate(() => ({ achieved: window.__G.achieved, tick: window.__G.sim.tick }));
    await page.click('#speed button[data-speed="1"]');
    // skip forward 10 generations (no drawing), timed
    await page.evaluate(() => { window.__skip(10); });
    await sleep(400);
    if (label === 'iphone') await shot('5-skip-forward');
    await page.waitForFunction(() => !window.__G.skipping, null, { timeout: 600000, polling: 500 });
    const skip = await page.evaluate(() => window.__lastSkip);
    await sleep(1500);
    // space view: evenly lit planet + glowing species dots
    await page.evaluate(() => { const c = window.__controls; c.targetAlt = c.alt = 1.5; });
    await sleep(1200);
    await shot('2-planet-dots');
    const fps1 = await page.evaluate(() => window.__fps);
    // close-up at the busiest spot
    const spot = await page.evaluate(() => {
      const G = window.__G, sim = G.sim, cs = sim.creatures;
      let best = cs[0], bs = -1;
      for (let i = 0; i < cs.length; i += 2) {
        const c = cs[i], sp = new Set(); let n = 0;
        for (const o of cs) { const d = (o.x - c.x) ** 2 + (o.y - c.y) ** 2 + (o.z - c.z) ** 2; if (d < 0.0004) sp.add(o.speciesId); }
        for (const q of sim.nests) { const d = (q.x - c.x) ** 2 + (q.y - c.y) ** 2 + (q.z - c.z) ** 2; if (d < 0.0002) n++; }
        const s = sp.size * 3 + Math.min(n, 6);
        if (s > bs) { bs = s; best = c; }
      }
      G.speed = 0; // freeze so the shot is stable
      const ctl = window.__controls, z = window.__camera.position.clone().set(0, 0, 1);
      ctl.flyTo = null; ctl.q.setFromUnitVectors(z, z.clone().set(best.x, best.y, best.z));
      ctl.targetAlt = ctl.alt = 0.011;
      return { score: bs, species: sim.species.length, nests: sim.nests.length, pop: cs.length };
    });
    await sleep(2600);
    await shot('3-closeup-species');
    const fps2 = await page.evaluate(() => window.__fps);
    // tap the creature nearest the screen centre (look tool) to open the panel
    const vp = page.viewportSize();
    const target = await page.evaluate(() => {
      const G = window.__G, cam = window.__camera, v = cam.position.clone();
      let best = null, bd = 1e9;
      for (const c of G.sim.creatures) {
        if (c.x * cam.position.x + c.y * cam.position.y + c.z * cam.position.z < 1) continue;
        v.set(c.x, c.y, c.z).multiplyScalar(1.0005).project(cam);
        if (Math.abs(v.x) > 0.8 || Math.abs(v.y) > 0.6 || v.z > 1) continue;
        const d = v.x * v.x + v.y * v.y; if (d < bd) { bd = d; best = [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }
      }
      return best;
    });
    if (target) await page.mouse.click(target[0], target[1]);
    await sleep(600);
    const tapped = await page.evaluate(() => !document.getElementById('panel').hidden);
    if (!tapped) await page.evaluate(() => { const G = window.__G; window.__openPanel(G.sim.creatures[0]); });
    await sleep(800);
    await shot('4-creature-panel');
    // save + continue round trip
    await page.evaluate(() => { document.getElementById('btnClose').click(); });
    await page.click('#btnMenu'); await sleep(200);
    const before = await page.evaluate(() => ({ pop: window.__G.sim.creatures.length, tick: window.__G.sim.tick, nests: window.__G.sim.nests.length }));
    await page.click('#btnQuit'); await sleep(500);
    await page.click('#btnContinue');
    await page.waitForFunction(() => window.__G.mode === 'game', null, { timeout: 60000 });
    const after = await page.evaluate(() => ({ pop: window.__G.sim.creatures.length, tick: window.__G.sim.tick, nests: window.__G.sim.nests.length }));
    // knowledge log opens
    await page.click('#btnLog'); await sleep(300);
    const logN = await page.evaluate(() => document.querySelectorAll('#logList li').length);
    if (DBG) await page.screenshot({ path: `${DBG}/${label}-log.png` });
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    console.log(label, JSON.stringify({ x64: sp64, skip, spot, fpsSpace: fps1?.toFixed(1), fpsClose: fps2?.toFixed(1), tapped, before, after, logN, hscroll: scroll }));
    await ctx.close();
  }
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
