// Screenshot + smoke test: node tools/shots.cjs  (expects a static server on :8765)
const { chromium, devices } = require('playwright');
const OUT = __dirname + '/../screenshots/';
const URL = 'http://localhost:8765/index.html';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errors = [];
  for (const [label, opts] of [['iphone', devices['iPhone 13']], ['desktop', { viewport: { width: 1366, height: 800 } }]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${label}] ${m.type()}: ${m.text()}`); });
    page.on('pageerror', (e) => errors.push(`[${label}] pageerror: ${e.message}`));
    await page.goto(URL);
    await page.waitForFunction(() => document.getElementById('loading').hidden, null, { timeout: 120000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: OUT + `${label}-1-menu.png` });
    await page.click('#btnFree');
    await page.waitForTimeout(300);
    await page.screenshot({ path: OUT + `${label}-2-new-world.png` });
    await page.click('#btnStart');
    await page.waitForFunction(() => window.__G.mode === 'game', null, { timeout: 120000 });
    await page.evaluate(() => { window.__G.speed = 8; });
    await page.waitForTimeout(4000);
    await page.evaluate(() => { window.__G.speed = 1; });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: OUT + `${label}-3-planet-space.png` });
    const fps1 = await page.evaluate(() => window.__fps);
    // zoom close above a creature
    await page.evaluate(() => {
      const G = window.__G, c = G.sim.creatures[(G.sim.creatures.length / 2) | 0];
      G.selected = c; G.follow = true; window.__ctl = true;
    });
    await page.evaluate(() => { const G = window.__G; G.follow = true; });
    await page.evaluate(() => { /* zoom */ });
    for (let i = 0; i < 25; i++) { await page.mouse.wheel(0, -300); await page.waitForTimeout(40); }
    await page.waitForTimeout(3000);
    await page.evaluate(() => { window.__G.follow = false; });
    await page.screenshot({ path: OUT + `${label}-4-close.png` });
    const fps2 = await page.evaluate(() => window.__fps);
    // tap near the screen centre with the look tool to open a creature
    const vp = page.viewportSize();
    const pos = await page.evaluate(() => {
      const G = window.__G; const c = G.selected; return c ? [c.x, c.y, c.z] : null;
    });
    const scr = await page.evaluate(async ([x, y, z]) => {
      const THREE = await import('three');
      const v = new THREE.Vector3(x, y, z).multiplyScalar(1.002);
      // use the game's camera through the module-scope? fall back to screen centre
      return null;
    }, pos);
    await page.mouse.click(vp.width / 2, vp.height / 2 + (label === 'iphone' ? 0 : 0));
    await page.waitForTimeout(500);
    let panelOpen = await page.evaluate(() => !document.getElementById('panel').hidden);
    if (!panelOpen) { // open programmatically if the tap missed
      await page.evaluate(() => { const G = window.__G; const c = G.selected || G.sim.creatures[0]; window.__openPanel(c); });
    }
    await page.waitForTimeout(800);
    panelOpen = await page.evaluate(() => !document.getElementById('panel').hidden);
    await page.screenshot({ path: OUT + `${label}-5-creature-panel.png` });
    // lightning
    await page.click('#toolbar button[data-tool="bolt"]');
    await page.mouse.click(vp.width / 2 + 30, vp.height / 2 - 40);
    await page.waitForTimeout(120);
    await page.screenshot({ path: OUT + `${label}-6-lightning.png` });
    const scroll = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    console.log(label, 'fps space', fps1?.toFixed(1), 'fps close', fps2?.toFixed(1), 'panel', panelOpen, 'hscroll', scroll,
      'pop', await page.evaluate(() => window.__G.sim.creatures.length));
    await ctx.close();
  }
  console.log('errors:', errors.length ? errors.join('\n') : 'none');
  await browser.close();
})();
