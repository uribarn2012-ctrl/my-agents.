// Entry point: menus, game loop, god tools, autosave.
import * as THREE from 'three';
import { generateWorld } from './world.js';
import { Sim } from './sim.js';
import { PlanetView, buildStars, buildSunGlow } from './planet.js';
import { CreaturesView } from './creaturesView.js';
import { PlanetControls } from './controls.js';
import { $, toast, flash, showLoading, nextFrame, updateHud, CreaturePanel } from './ui.js';
import { hasSave, saveInfo, saveGame, loadSave, restoreSim } from './save.js';
import { mulberry32 } from './noise.js';
import { randomWorldName } from './names.js';
import { TICKS_PER_DAY } from './sim.js';

const TPS = 10; // simulation ticks per second at ×1
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && innerWidth < 1100);

// ---------- renderer / scene ----------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile || devicePixelRatio < 2, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 200);
scene.add(buildStars(7));
const sunGlow = buildSunGlow(); scene.add(sunGlow);
const sunLight = new THREE.DirectionalLight(0xfff4e6, 2.4); scene.add(sunLight);
scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x302418, 0.35));
const sunDir = new THREE.Vector3();

function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

// ---------- state ----------
const G = { sunPhase: 0, mode: 'menu', world: null, planet: null, sim: null, view: null, name: '', speed: 1, tool: 'look', selected: null, follow: false, acc: 0, time: 0, lastSave: 0 };
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
  $('hud').hidden = true; $('newWorld').hidden = true; $('menu').hidden = false; $('pause').hidden = true;
  const info = saveInfo();
  $('btnContinue').hidden = !info;
  if (info) $('saveInfo').textContent = `${info.name} · ${info.pop} יצורים · יום ${Math.floor(info.tick / TICKS_PER_DAY) + 1}`;
  controls.enabled = false; controls.autoSpin = 18; controls.targetAlt = 1.9;
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
  startGame(data.name, restoreSim(data, G.world));
};

function startGame(name, sim) {
  G.sim = sim; G.name = name; G.mode = 'game'; G.selected = null; G.acc = 0; G.lastSave = performance.now();
  $('menu').hidden = true; $('newWorld').hidden = true; $('hud').hidden = false;
  controls.enabled = true; controls.autoSpin = 0;
  // start looking at the biggest group of creatures
  const c = sim.creatures[0];
  if (c) controls.q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(c.x, c.y, c.z));
  controls.targetAlt = 1.6;
  // start with the sun shining on where the creatures are
  if (c) G.sunPhase = Math.atan2(c.z, c.x) - sim.dateInfo().dayFrac * Math.PI * 2;
  setSpeed(1); setTool('look');
  updateHud(name, sim);
  G.view.refreshPlants();
}

// ---------- HUD controls ----------
function setSpeed(s) { G.speed = s; document.querySelectorAll('#speed button').forEach((b) => b.classList.toggle('on', +b.dataset.speed === s)); }
document.querySelectorAll('#speed button').forEach((b) => (b.onclick = () => setSpeed(+b.dataset.speed)));
const TOOL_HINT = { look: 'הקש על יצור כדי לראות אותו', food: 'הקש על היבשה כדי להמטיר אוכל', bolt: 'הקש כדי להכות בברק', spawn: 'הקש על היבשה כדי ליצור יצורים חדשים' };
function setTool(t) { G.tool = t; document.querySelectorAll('#toolbar button').forEach((b) => b.classList.toggle('on', b.dataset.tool === t)); }
document.querySelectorAll('#toolbar button').forEach((b) => (b.onclick = () => { setTool(b.dataset.tool); toast(TOOL_HINT[b.dataset.tool]); }));
$('btnClose').onclick = () => { panel.close(); G.selected = null; G.follow = false; $('btnFollow').classList.remove('on'); };
$('btnFollow').onclick = () => { G.follow = !G.follow; $('btnFollow').classList.toggle('on', G.follow); if (G.follow) controls.targetAlt = Math.min(controls.targetAlt, 0.12); };
$('btnMenu').onclick = () => { $('pause').hidden = false; };
$('btnResume').onclick = () => { $('pause').hidden = true; };
$('btnSave').onclick = () => { toast(saveGame(G.name, G.sim) ? 'העולם נשמר' : 'השמירה נכשלה'); $('pause').hidden = true; };
$('btnQuit').onclick = () => { saveGame(G.name, G.sim); showMenu(); };

// ---------- tapping the planet ----------
const _v = new THREE.Vector3();
controls.onTap = (x, y) => {
  if (G.mode !== 'game') return;
  const sim = G.sim;
  if (G.tool === 'look') {
    // nearest creature on screen within 36px
    let best = null, bd = 36 * 36;
    const rect = canvas.getBoundingClientRect();
    const camDir = camera.position.clone();
    for (const c of sim.creatures) {
      _v.set(c.x, c.y, c.z);
      if (_v.dot(camDir) < 0.9) continue; // back side
      _v.multiplyScalar(1.002).project(camera);
      if (_v.z > 1) continue;
      const sx = (_v.x + 1) / 2 * rect.width, sy = (1 - _v.y) / 2 * rect.height;
      const d = (sx - x) ** 2 + (sy - y) ** 2;
      if (d < bd) { bd = d; best = c; }
    }
    if (best) { G.selected = best; panel.open(best); panel.update(sim, true); }
    else if (controls.alt > 0.5) toast('התקרב (צבוט או גלגלת) כדי לראות יצורים');
    return;
  }
  const p = controls.pick(x, y);
  if (!p) return;
  if (G.tool === 'food') { const n = sim.dropFood(p.x, p.y, p.z); toast(n ? 'מן ירד מהשמיים 🌾' : 'אוכל אפשר להמטיר רק על יבשה'); G.view.refreshPlants(); }
  else if (G.tool === 'bolt') { const n = sim.lightning(p.x, p.y, p.z); G.view.lightning(p.x, p.y, p.z); flash(); G.view.refreshPlants(); if (n) toast(`הברק פגע ב־${n} יצורים`); }
  else if (G.tool === 'spawn') { const n = sim.spawnCreatures(p.x, p.y, p.z); toast(n ? `נבראו ${n} יצורים חדשים` : 'אפשר ליצור חיים רק על יבשה'); }
};

// ---------- loop ----------
let last = performance.now(), hudT = 0, fpsN = 0, fpsT = 0;
window.__fps = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  G.time += dt;
  fpsN++; fpsT += dt; if (fpsT > 1) { window.__fps = fpsN / fpsT; fpsN = 0; fpsT = 0; }
  const sim = G.sim;
  if (G.mode === 'game' && sim && $('pause').hidden) {
    G.acc += dt * TPS * G.speed;
    const t0 = performance.now();
    while (G.acc >= 1) { sim.step(); G.acc -= 1; if (performance.now() - t0 > (isMobile ? 10 : 14)) { G.acc = 0; break; } }
    if (sim.tick % 15 === 0) G.view.refreshPlants();
  }
  // sun goes around the planet once per in-game day (planet stays still: easier to watch)
  const dayFrac = sim ? sim.dateInfo().dayFrac + G.acc / TICKS_PER_DAY : G.time / 120;
  const ang = dayFrac * Math.PI * 2 + G.sunPhase;
  sunDir.set(Math.cos(ang), 0.25, Math.sin(ang)).normalize();
  sunLight.position.copy(sunDir).multiplyScalar(10);
  sunGlow.position.copy(sunDir).multiplyScalar(80);
  if (G.selected && !G.selected.alive && G.follow) { G.follow = false; $('btnFollow').classList.remove('on'); }
  const fpos = G.follow && G.selected ? new THREE.Vector3(G.selected.x, G.selected.y, G.selected.z) : null;
  controls.update(dt, fpos);
  if (G.planet) G.planet.update(sunDir, G.time, controls.alt);
  if (G.view) {
    if (sim) G.view.update(sim, Math.min(1, G.acc), controls.alt, G.selected);
    G.view.updateFx(dt);
  }
  renderer.render(scene, camera);
  hudT += dt;
  if (sim && hudT > 0.25) { hudT = 0; updateHud(G.name, sim); panel.update(sim); }
  else if (sim && panel.c) panel.update(sim);
  if (sim && G.mode === 'game' && now - G.lastSave > 60000) { G.lastSave = now; saveGame(G.name, sim); }
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
window.__G = G;
window.__openPanel = (c) => { if (c) { G.selected = c; panel.open(c); panel.update(G.sim, true); } };
