// Entry point: menus, game loop, god tools, autosave, fast-forward.
import * as THREE from 'three';
import { generateWorld } from './world.js';
import { Sim, YEAR } from './sim.js';
import { PlanetView, buildStars, buildSunGlow } from './planet.js';
import { CreaturesView, BODY_S } from './creaturesView.js';
import { PlanetControls } from './controls.js';
import { $, toast, queueToast, flash, showLoading, nextFrame, updateHud, CreaturePanel, showLog } from './ui.js';
import { saveInfo, saveGame, loadSave, restoreSim } from './save.js';
import { mulberry32 } from './noise.js';
import { randomWorldName } from './names.js';

const TPS = 10; // simulation ticks per second at ×1
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && innerWidth < 1100);

// ---------- renderer / scene ----------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile || devicePixelRatio < 2, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.autoClear = false;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 10);
// background pass (stars + the sun), drawn first with its own far plane
const bgScene = new THREE.Scene(), bgCam = new THREE.PerspectiveCamera(50, 1, 0.5, 200);
const stars = buildStars(7); stars.material.transparent = true; bgScene.add(stars);
const skyCol = new THREE.Color(0.38, 0.6, 0.9), blackCol = new THREE.Color(0, 0, 0), _sky = new THREE.Color();
const sunGlow = buildSunGlow(); bgScene.add(sunGlow);
// even lighting: a soft light that follows the camera + ambient fill. No night side.
const camLight = new THREE.DirectionalLight(0xfff6ea, 2.0); scene.add(camLight);
scene.add(new THREE.AmbientLight(0xbcd0ff, 0.9));
const lightDir = new THREE.Vector3();

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = bgCam.aspect = w / h; camera.updateProjectionMatrix(); bgCam.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ---------- state ----------
const G = { mode: 'menu', world: null, planet: null, sim: null, view: null, name: '', speed: 1, tool: 'look', selected: null, follow: false, acc: 0, time: 0, lastSave: 0, skipping: null, achieved: 0 };
const controls = new PlanetControls(camera, canvas, null);
const panel = new CreaturePanel();

function setWorld(world) {
  G.planet?.dispose(); G.view?.dispose();
  G.world = world; controls.setWorld(world);
  G.planet = new PlanetView(scene, world);
  G.view = new CreaturesView(scene, world);
}

async function makeWorld(seed, text) {
  showLoading(true, text); await nextFrame();
  const w = generateWorld(seed); setWorld(w);
  showLoading(false);
  return w;
}

// ---------- menus ----------
function showMenu() {
  G.mode = 'menu'; G.sim = null; panel.close(); G.selected = null;
  $('hud').hidden = true; $('newWorld').hidden = true; $('menu').hidden = false; $('pause').hidden = true; $('logBox').hidden = true;
  const info = saveInfo();
  $('btnContinue').hidden = !info;
  if (info) $('saveInfo').textContent = `${info.name} · ${info.pop} יצורים · שנה ${Math.floor(info.tick / YEAR) + 1}`;
  controls.enabled = false; controls.autoSpin = 18; controls.targetAlt = 1.9; controls.flyTo = null;
}
$('btnFree').onclick = () => {
  $('menu').hidden = true; $('newWorld').hidden = false;
  const r = mulberry32(Date.now() & 0xffffffff);
  $('worldName').value = randomWorldName(r);
  $('worldSeed').value = String(G.world?.seed ?? 1);
};
$('btnRoll').onclick = async () => {
  const seed = (Math.random() * 999999) | 0; $('worldSeed').value = seed;
  await makeWorld(seed, 'מגריל כוכב…');
};
$('worldSeed').onchange = async () => { const s = parseInt($('worldSeed').value, 10); if (s >= 0 && s !== G.world.seed) await makeWorld(s, 'יוצר כוכב…'); };
$('btnBack').onclick = showMenu;
$('btnStart').onclick = async () => {
  const s = Math.abs(parseInt($('worldSeed').value, 10) || 1) % 1000000;
  if (!G.world || G.world.seed !== s) await makeWorld(s);
  const sim = new Sim(G.world, s); sim.populate(160);
  startGame(($('worldName').value || 'עולם חדש').trim(), sim);
  saveGame(G.name, sim);
};
$('btnContinue').onclick = async () => {
  const data = loadSave(); if (!data) return;
  if (!G.world || G.world.seed !== data.seed) await makeWorld(data.seed, 'טוען עולם…');
  let sim;
  try { sim = restoreSim(data, G.world); } catch (e) { console.warn('bad save', e); toast('השמירה פגומה — אפשר להתחיל עולם חדש'); return; }
  startGame(data.name, sim);
};

function startGame(name, sim) {
  G.sim = sim; G.name = name; G.mode = 'game'; G.selected = null; G.acc = 0; G.lastSave = performance.now();
  sim.news.length = 0;
  $('menu').hidden = true; $('newWorld').hidden = true; $('hud').hidden = false;
  controls.enabled = true; controls.autoSpin = 0;
  const c = sim.creatures[0]; // start looking at a group of creatures
  if (c) controls.q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(c.x, c.y, c.z));
  controls.targetAlt = 1.6;
  setSpeed(1); setTool('look');
  updateHud(name, sim, G);
  G.view.refreshPlants();
}

// ---------- HUD controls ----------
function setSpeed(s) { G.speed = s; G.achieved = s; document.querySelectorAll('#speed button[data-speed]').forEach((b) => b.classList.toggle('on', +b.dataset.speed === s)); }
document.querySelectorAll('#speed button[data-speed]').forEach((b) => (b.onclick = () => setSpeed(+b.dataset.speed)));
const TOOL_HINT = { look: 'הקש על יצור כדי לראות אותו', food: 'הקש על היבשה כדי להמטיר אוכל', bolt: 'הקש כדי להכות בברק', spawn: 'הקש על היבשה כדי ליצור יצורים חדשים' };
function setTool(t) { G.tool = t; document.querySelectorAll('#toolbar button[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === t)); }
document.querySelectorAll('#toolbar button[data-tool]').forEach((b) => (b.onclick = () => { setTool(b.dataset.tool); toast(TOOL_HINT[b.dataset.tool]); }));
$('btnClose').onclick = () => { panel.close(); G.selected = null; G.follow = false; $('btnFollow').classList.remove('on'); };
$('btnFollow').onclick = () => { G.follow = !G.follow; $('btnFollow').classList.toggle('on', G.follow); if (G.follow) controls.targetAlt = Math.min(controls.targetAlt, 0.006); };
$('btnMenu').onclick = () => { $('pause').hidden = false; };
$('btnResume').onclick = () => { $('pause').hidden = true; };
$('btnSave').onclick = () => { toast(saveGame(G.name, G.sim) ? 'העולם נשמר' : 'השמירה נכשלה'); $('pause').hidden = true; };
$('btnQuit').onclick = () => { saveGame(G.name, G.sim); showMenu(); };
$('btnLog').onclick = () => showLog(G.sim);
$('btnLog2').onclick = () => { $('pause').hidden = true; showLog(G.sim); };
$('btnLogClose').onclick = () => { $('logBox').hidden = true; };
$('btnSkip').onclick = () => skipForward(10);
$('btnSkip2').onclick = () => { $('pause').hidden = true; skipForward(10); };
$('btnSkipCancel').onclick = () => { if (G.skipping) G.skipping.cancel = true; };

// ---------- fast-forward: run the sim without drawing, in chunks, with progress + cancel ----------
async function skipForward(gens) {
  const sim = G.sim; if (!sim || G.skipping) return;
  const st = G.skipping = { cancel: false };
  const g0 = sim.avgGen(), t0 = sim.tick, nests0 = sim.stats.nestsBuilt, log0 = sim.log.length, maxTicks = 80 * YEAR, wall0 = performance.now();
  $('skip').hidden = false; $('skipBar').style.width = '0%';
  const chunk = isMobile ? 45 : 80;
  while (!st.cancel) {
    const ts = performance.now();
    while (performance.now() - ts < chunk) for (let i = 0; i < 20; i++) sim.step();
    const done = Math.min(1, Math.max((sim.avgGen() - g0) / gens, (sim.tick - t0) / maxTicks));
    $('skipBar').style.width = (done * 100).toFixed(0) + '%';
    $('skipText').textContent = `עברו ${Math.floor((sim.tick - t0) / YEAR)} שנים · דור ממוצע ${sim.avgGen().toFixed(1)} · ${sim.creatures.length} יצורים`;
    if (done >= 1) break;
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  }
  const secs = (performance.now() - wall0) / 1000;
  window.__lastSkip = { secs, ticks: sim.tick - t0, gens: sim.avgGen() - g0 };
  G.skipping = null; $('skip').hidden = true; G.acc = 0;
  sim.news.length = 0;
  for (const c of sim.creatures) { c.px = c.x; c.py = c.y; c.pz = c.z; }
  if (G.selected && !G.selected.alive) { panel.close(); G.selected = null; G.follow = false; }
  G.view.refreshPlants(); updateHud(G.name, sim, G);
  const yrs = Math.floor((sim.tick - t0) / YEAR);
  queueToast(`⏩ עברו ${yrs} שנים (${(sim.avgGen() - g0).toFixed(1)} דורות) · ${sim.stats.nestsBuilt - nests0} קנים נבנו · ${sim.log.length - log0} רשומות חדשות ב"ידע"`, 4500);
  saveGame(G.name, sim);
}

// ---------- tapping the planet ----------
const _v = new THREE.Vector3();
function screenOf(x, y, z, lift, rect) {
  _v.set(x, y, z).multiplyScalar(1 + lift).project(camera);
  if (_v.z > 1 || _v.z < -1) return null;
  return [(_v.x + 1) / 2 * rect.width, (1 - _v.y) / 2 * rect.height];
}
controls.onTap = (x, y) => {
  if (G.mode !== 'game' || G.skipping) return;
  const sim = G.sim;
  if (G.tool === 'look') {
    const rect = canvas.getBoundingClientRect(), cp = camera.position;
    // pixel size of a creature body right now (bigger target when close)
    let best = null, bd = Infinity;
    for (const c of sim.creatures) {
      if (c.x * cp.x + c.y * cp.y + c.z * cp.z < 1.0) continue; // behind the planet
      const s = screenOf(c.x, c.y, c.z, BODY_S * 0.8, rect); if (!s) continue;
      const dist = Math.hypot(c.x - cp.x, c.y - cp.y, c.z - cp.z);
      const px = BODY_S * 2.5 / dist * rect.height / (2 * Math.tan(camera.fov * Math.PI / 360));
      const tol = Math.max(30, px * 0.8);
      const d = Math.hypot(s[0] - x, s[1] - y);
      if (d < tol && d / tol < bd) { bd = d / tol; best = c; }
    }
    if (best && controls.alt < 0.09) { G.selected = best; panel.open(best); panel.update(sim, true); return; }
    if (best) { // far away: fly down toward the group of dots
      controls.fly(new THREE.Vector3(best.x, best.y, best.z), Math.max(0.006, controls.alt * 0.18));
      G.selected = best; panel.open(best); panel.update(sim, true);
      return;
    }
    if (controls.alt > 0.3) toast('הקש על נקודה צבעונית כדי לטוס אליה, או צבוט כדי להתקרב');
    return;
  }
  const p = controls.pick(x, y);
  if (!p) return;
  if (G.tool === 'food') { const n = sim.dropFood(p.x, p.y, p.z); toast(n ? 'מן ירד מהשמיים 🌾' : 'אוכל אפשר להמטיר רק על יבשה'); G.view.refreshPlants(); }
  else if (G.tool === 'bolt') { const n = sim.lightning(p.x, p.y, p.z); G.view.lightning(p.x, p.y, p.z, controls.alt); flash(); G.view.refreshPlants(); if (n) toast(`הברק פגע ב־${n} יצורים`); }
  else if (G.tool === 'spawn') { const n = sim.spawnCreatures(p.x, p.y, p.z); toast(n ? `נבראו ${n} יצורים חדשים` : 'אפשר ליצור חיים רק על יבשה'); }
};

// ---------- loop ----------
let last = performance.now(), hudT = 0, fpsN = 0, fpsT = 0, ticksWin = 0, winT = 0;
window.__fps = 0;
const _f = new THREE.Vector3(), _u = new THREE.Vector3(), _r = new THREE.Vector3();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  G.time += dt;
  fpsN++; fpsT += dt; if (fpsT > 1) { window.__fps = fpsN / fpsT; fpsN = 0; fpsT = 0; }
  const sim = G.sim;
  if (G.mode === 'game' && sim && $('pause').hidden && !G.skipping) {
    G.acc += dt * TPS * G.speed;
    const t0 = performance.now(), budget = isMobile ? 11 : 14;
    let n = 0;
    while (G.acc >= 1) { sim.step(); n++; G.acc -= 1; if (performance.now() - t0 > budget) { G.acc = Math.min(G.acc, 1); break; } }
    ticksWin += n; winT += dt;
    if (winT > 1) { G.achieved = ticksWin / winT / TPS; ticksWin = 0; winT = 0; }
    if (n && sim.tick % 15 < n) G.view.refreshPlants();
    // natural events + milestones -> short toasts
    while (sim.news.length) { const e = sim.news.shift(); queueToast(`${e.icon} ${e.text}`, e.kind === 'milestone' ? 3200 : 2800); }
  }
  if (G.selected && !G.selected.alive && G.follow) { G.follow = false; $('btnFollow').classList.remove('on'); }
  const fpos = G.follow && G.selected ? new THREE.Vector3(G.selected.x, G.selected.y, G.selected.z) : null;
  controls.update(dt, fpos);
  // light comes from just above/right of the viewer; the visible sun sits in the upper sky
  camera.getWorldDirection(_f); _u.copy(camera.up); _r.crossVectors(_f, _u).normalize(); _u.crossVectors(_r, _f).normalize();
  lightDir.copy(_f).negate().addScaledVector(_u, 0.55).addScaledVector(_r, 0.3).normalize();
  camLight.position.copy(lightDir).multiplyScalar(10);
  bgCam.position.copy(camera.position); bgCam.quaternion.copy(camera.quaternion);
  sunGlow.position.copy(camera.position).addScaledVector(_f, 60).addScaledVector(_u, 27).addScaledVector(_r, 6 * camera.aspect);
  if (G.planet) G.planet.update(lightDir, G.time, controls.alt);
  if (G.view) {
    if (sim) G.view.update(sim, Math.min(1, G.acc), controls.alt, G.selected, camera.position, G.time);
    G.view.updateFx(dt);
  }
  // near the ground the sky turns day-blue and the stars fade (no night anywhere)
  const skyT = 1 - THREE.MathUtils.smoothstep(controls.alt, 0.006, 0.07);
  renderer.setClearColor(_sky.copy(blackCol).lerp(skyCol, skyT));
  stars.material.opacity = 1 - skyT;
  if (!G.skipping) { // while fast-forwarding, the CPU goes to the simulation (the overlay covers the view)
    renderer.clear();
    renderer.render(bgScene, bgCam);
    renderer.clearDepth();
    renderer.render(scene, camera);
  }
  hudT += dt;
  if (sim && hudT > 0.25) { hudT = 0; updateHud(G.name, sim, G); panel.update(sim); }
  else if (sim && panel.c) panel.update(sim);
  if (sim && G.mode === 'game' && !G.skipping && now - G.lastSave > 60000) { G.lastSave = now; saveGame(G.name, sim); }
}

// autosave when leaving / switching apps
const saveNow = () => { if (G.mode === 'game' && G.sim) saveGame(G.name, G.sim); };
addEventListener('pagehide', saveNow);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });

// boot: build a preview planet behind the menu
(async () => {
  const seed = loadSave()?.seed ?? ((Math.random() * 999999) | 0);
  await makeWorld(seed, 'יוצר עולם…');
  showMenu();
  requestAnimationFrame(frame);
})();
window.__G = G; window.__controls = controls; window.__camera = camera;
window.__openPanel = (c) => { if (c) { G.selected = c; panel.open(c); panel.update(G.sim, true); } };
window.__skip = skipForward;
