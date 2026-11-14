// Creature + plant + nest simulation on the sphere. Pure JS (no three.js), runs in node for tests.
import { mulberry32, gaussian } from './noise.js';
import { isLand, sample } from './world.js';
import { NI, NH, NO, NW, randomWeights, mutateWeights, crossWeights, think } from './brain.js';
import { makeName } from './names.js';

// ---- calendar: 1 year = 400 ticks (40 s at ×1), 4 seasons ----
export const YEAR = 400;
export const SEASON_LEN = YEAR / 4;
export const SEASONS = ['אביב', 'קיץ', 'סתיו', 'חורף'];
const SEASON_GROW = [1.3, 1.05, 0.9, 0.75];
export const TICKS_PER_DAY = YEAR; // legacy name kept for imports

export const P = {
  baseSpeed: 0.0007, maxTurn: 0.14, reach: 0.0045,
  plantE: 30, mannaE: 50, maxFood: 12000, plantRate: 9, initialPlants: 7000, plantCap: 14,
  baseCost: 0.015, moveCost: 0.02, senseCost: 0.006, brainCost: 0.0015,
  maturity: 220, lifespan: 2000, minPop: 30, maxPop: 380, softPop: 260,
  nestCost: 0.12, regrowT: 400, regrowP: 0.6, nestR: 0.006, nestDecay: 1 / 1500, maxNests: 800,
};
const MAXF = 14000;
// spatial hash in unit-cube coords (padded by 1 cell so neighbours never go negative)
const CS = 0.04, GRID = Math.ceil(2 / CS) + 3, G2 = GRID * GRID, NCELLS = GRID * G2;
const cellOf = (x, y, z) => ((((x + 1) / CS) | 0) + 1) + ((((y + 1) / CS) | 0) + 1) * GRID + ((((z + 1) / CS) | 0) + 1) * G2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function randTangent(x, y, z, rng) {
  let ax = rng() - 0.5, ay = rng() - 0.5, az = rng() - 0.5;
  const d = ax * x + ay * y + az * z; ax -= d * x; ay -= d * y; az -= d * z;
  const l = Math.hypot(ax, ay, az) || 1; return [ax / l, ay / l, az / l];
}

// ---- body plan genes (visual shape). They mutate slowly. ----
export const BODY_KEYS = ['len', 'wid', 'hgt', 'legs', 'neck', 'head', 'tail', 'horn', 'hornType', 'ears', 'spikes', 'hue2', 'pat', 'snake'];
export function legCount(b) { return b.legs < 0.14 ? 0 : b.legs < 0.4 ? 2 : b.legs < 0.75 ? 4 : 6; }
export function bodyTraits(g) { // short Hebrew description of the body shape
  const b = g.body, t = [];
  const L = legCount(b);
  if (L === 0) t.push(b.snake > 0.5 && b.len > 1.2 ? 'נחש' : 'זוחל בלי רגליים'); else t.push(`${L} רגליים`);
  if (b.len > 1.6) t.push('גוף ארוך'); else if (b.len < 0.85 && b.wid > 1.0) t.push('עגלגל');
  if (b.hgt > 1.25) t.push('גבוה'); else if (b.hgt < 0.7) t.push('נמוך');
  if (b.neck > 0.6) t.push('צוואר ארוך');
  if (b.head > 1.3) t.push('ראש גדול');
  if (b.tail > 0.55) t.push('זנב ארוך');
  if (b.horn > 0.45) t.push(b.hornType < 0.33 ? 'קרניים' : b.hornType < 0.66 ? 'קרני צבי' : 'כרבולת');
  if (b.ears > 0.55) t.push('אוזניים גדולות');
  if (b.spikes > 0.5) t.push('קוצים בגב');
  if (b.pat > 0.6) t.push('פסים');
  else if (b.pat > 0.3) t.push('דו-גוני');
  return t.join(' · ');
}
function randomBody(r) {
  return { len: 0.7 + r() * 1.3, wid: 0.6 + r() * 0.8, hgt: 0.6 + r() * 0.8, legs: r(), neck: r() * r(), head: 0.7 + r() * 0.8,
    tail: r(), horn: r() * r() * 1.2, hornType: r(), ears: r(), spikes: r() * r() * 1.2, hue2: r(), pat: r(), snake: r() };
}
const BODY_LIM = { len: [0.5, 2.6], wid: [0.45, 1.8], hgt: [0.45, 1.8], head: [0.5, 1.9] };

export class Sim {
  constructor(world, seed) {
    this.world = world;
    this.rng = mulberry32(seed * 31 + 7);
    this.tick = 0; this.nextId = 1;
    this.creatures = [];
    this.fx = new Float32Array(MAXF); this.fy = new Float32Array(MAXF); this.fz = new Float32Array(MAXF);
    this.fe = new Float32Array(MAXF); this.ft = new Uint8Array(MAXF); this.falive = new Uint8Array(MAXF);
    this.fcount = 0; this.ffree = []; for (let i = MAXF - 1; i >= 0; i--) this.ffree.push(i);
    this.fcells = new Array(NCELLS); this.ncells = new Array(NCELLS);
    this.cHead = new Int32Array(NCELLS).fill(-1); this.cNext = new Int32Array(64); this.cTouched = [];
    this.nests = []; this.nextNestId = 1;
    this.species = []; this.speciesById = new Map(); this.nextSpecies = 1; this.speciesVer = 0;
    this.inp = new Float32Array(NI);
    this.stats = { births: 0, deaths: 0, kills: 0, maxGen: 0, nestsBuilt: 0, rescues: 0 };
    this.deadLog = []; // recent dead creatures for stats
    this.bank = [];    // genomes of recent successful parents (for nature's safety net)
    this.regions = []; // active natural events: {type, x,y,z, r, mult, until}
    this.nextEvent = 900 + ((this.rng() * 900) | 0);
    this.lastRescue = -9999;
    this.log = [];     // milestones + events, the seed of the history book
    this.news = [];    // new log entries for the UI to toast
    this.flags = {};   // milestone flags
    this.regrow = [];  // eaten plants sprout again at the same spot: [tick, x, y, z]
    const cells = [];
    for (let i = 0; i < world.fert.length; i++) if (world.fert[i] > 0.05) cells.push(i);
    this.fertCells = Int32Array.from(cells);
  }

  // ---------- calendar ----------
  dateInfo() {
    const year = Math.floor(this.tick / YEAR) + 1, season = Math.floor((this.tick % YEAR) / SEASON_LEN);
    return { year, season, seasonName: SEASONS[season], yearFrac: (this.tick % YEAR) / YEAR };
  }
  emit(icon, text, kind = 'event') {
    const e = { t: this.tick, icon, text, kind };
    this.log.push(e); if (this.log.length > 300) this.log.splice(0, this.log.length - 300);
    this.news.push(e); if (this.news.length > 30) this.news.shift();
  }

  // ---------- food ----------
  addFood(x, y, z, e, type) {
    if (!this.ffree.length) return -1;
    const i = this.ffree.pop();
    this.fx[i] = x; this.fy[i] = y; this.fz[i] = z; this.fe[i] = e; this.ft[i] = type; this.falive[i] = 1;
    const k = cellOf(x, y, z); let a = this.fcells[k]; if (!a) this.fcells[k] = a = []; a.push(i);
    this.fcount++; return i;
  }
  removeFood(i) {
    if (!this.falive[i]) return;
    this.falive[i] = 0; this.fcount--; this.ffree.push(i);
    const a = this.fcells[cellOf(this.fx[i], this.fy[i], this.fz[i])];
    if (a) { const j = a.indexOf(i); if (j >= 0) { a[j] = a[a.length - 1]; a.pop(); } }
  }
  regionMult(x, y, z) {
    let m = 1;
    for (const r of this.regions) {
      const dx = x - r.x, dy = y - r.y, dz = z - r.z, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < r.r * r.r) m *= 1 + (r.mult - 1) * (1 - d2 / (r.r * r.r));
    }
    return m;
  }
  // try to grow one plant at/near x,y,z (or a random fertile spot). Local crowding limits growth.
  spawnPlant(px, py, pz, spread = 0.012, force = false) {
    const rng = this.rng, w = this.world;
    let x, y, z;
    if (px !== undefined) {
      x = px + (rng() - 0.5) * spread; y = py + (rng() - 0.5) * spread; z = pz + (rng() - 0.5) * spread;
    } else if (this.fcount > 50 && rng() < 0.5) { // seeds fall near an existing plant
      let i = 0, tries = 0;
      do { i = (rng() * MAXF) | 0; } while ((!this.falive[i] || this.ft[i] !== 0) && ++tries < 20);
      if (!this.falive[i]) return;
      x = this.fx[i] + (rng() - 0.5) * 0.014; y = this.fy[i] + (rng() - 0.5) * 0.014; z = this.fz[i] + (rng() - 0.5) * 0.014;
    } else {
      const c = this.fertCells[(rng() * this.fertCells.length) | 0];
      x = w.dir[c * 3] + (rng() - 0.5) * 0.009; y = w.dir[c * 3 + 1] + (rng() - 0.5) * 0.009; z = w.dir[c * 3 + 2] + (rng() - 0.5) * 0.009;
    }
    const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l;
    let f = sample(w, w.fert, x, y, z);
    if (f <= 0.02) return;
    if (!force) f *= SEASON_GROW[this.dateInfo().season] * (this.regions.length ? this.regionMult(x, y, z) : 1);
    const cell = this.fcells[cellOf(x, y, z)];
    if (cell && cell.length >= P.plantCap * Math.min(1.6, f) + 1) return;
    if (force || rng() < f) this.addFood(x, y, z, P.plantE, 0);
  }

  // ---------- creatures ----------
  randomGenes() {
    const r = this.rng;
    return { size: 0.8 + r() * 0.5, speed: 0.8 + r() * 0.5, sense: 0.8 + r() * 0.5, diet: r() * 0.2, hue: r(), life: 0.85 + r() * 0.3,
      body: randomBody(r), w: randomWeights(r, 0.6) };
  }
  mutateGenes(g) {
    const r = this.rng, m = (v, s, lo, hi) => clamp(v + (r() < 0.3 ? gaussian(r) * s : 0), lo, hi);
    const body = {};
    for (const k of BODY_KEYS) { // slow drift: a species keeps its look but changes over many generations
      const lim = BODY_LIM[k] || [0, 1];
      body[k] = r() < 0.25 ? clamp(g.body[k] + gaussian(r) * 0.025 * (lim[1] - lim[0]), lim[0], lim[1]) : g.body[k];
    }
    return { size: m(g.size, 0.06, 0.5, 2.2), speed: m(g.speed, 0.06, 0.4, 2.2), sense: m(g.sense, 0.06, 0.4, 2.2),
      diet: m(g.diet, 0.05, 0, 1), hue: (g.hue + gaussian(r) * 0.006 + 1) % 1, life: m(g.life, 0.05, 0.5, 2.5), body, w: mutateWeights(g.w, r) };
  }
  crossGenes(a, b) {
    const r = this.rng, pick = (k) => (r() < 0.5 ? a[k] : b[k]);
    const body = {}; for (const k of BODY_KEYS) body[k] = r() < 0.5 ? a.body[k] : b.body[k];
    return this.mutateGenes({ size: pick('size'), speed: pick('speed'), sense: pick('sense'), diet: pick('diet'), hue: pick('hue'), life: pick('life'), body, w: crossWeights(a.w, b.w, r) });
  }
  addCreature(x, y, z, genes, gen = 0, energy = null) {
    const [hx, hy, hz] = randTangent(x, y, z, this.rng);
    const id = this.nextId++;
    const c = { id, name: makeName(id, this.world.seed), x, y, z, px: x, py: y, pz: z, hx, hy, hz, genes, gen,
      energy: energy ?? 60 * genes.size, age: 0, lifespan: Math.round(P.lifespan * genes.life * (0.9 + this.rng() * 0.2)),
      maturity: Math.round(P.maturity * (0.6 + 0.4 * genes.life)),
      mem0: 0, mem1: 0, cooldown: 0, kids: 0, eaten: 0, built: 0, alive: true, speciesId: 0, act: 0, atNest: 0,
      inp: new Float32Array(NI), hid: new Float32Array(NH), out: new Float32Array(NO), born: this.tick, toward: 0, sensedTicks: 0 };
    this.creatures.push(c);
    if (gen > this.stats.maxGen) this.stats.maxGen = gen;
    return c;
  }
  maxEnergy(c) { return 100 * c.genes.size; }
  randomLandPoint() {
    const w = this.world, r = this.rng;
    for (let t = 0; t < 1000; t++) {
      const c = this.fertCells[(r() * this.fertCells.length) | 0];
      if (w.fert[c] > 0.3) return [w.dir[c * 3], w.dir[c * 3 + 1], w.dir[c * 3 + 2]];
    }
    const c = this.fertCells[0]; return [w.dir[c * 3], w.dir[c * 3 + 1], w.dir[c * 3 + 2]];
  }
  populate(n = 160) {
    for (let i = 0; i < P.initialPlants * 3 && this.fcount < P.initialPlants; i++) this.spawnPlant();
    const groups = 8; // founder groups so species start out distinct
    for (let g = 0; g < groups; g++) {
      const [x, y, z] = this.randomLandPoint();
      const base = this.randomGenes();
      for (let i = 0; i < 40; i++) this.spawnPlant(x, y, z, 0.05, true); // a meadow to start in
      for (let i = 0; i < n / groups; i++) {
        const p = this.jitterLand(x, y, z, 0.03);
        if (p) this.addCreature(p[0], p[1], p[2], i === 0 ? base : this.mutateGenes(base), 0);
      }
    }
    this.updateSpecies();
  }
  jitterLand(x, y, z, r) {
    for (let t = 0; t < 30; t++) {
      let a = x + (this.rng() - 0.5) * r, b = y + (this.rng() - 0.5) * r, c = z + (this.rng() - 0.5) * r;
      const l = Math.hypot(a, b, c); a /= l; b /= l; c /= l;
      if (isLand(this.world, a, b, c)) return [a, b, c];
    }
    return null;
  }

  nearestFood(c, range) {
    let best = -1, bd = range * range;
    const x = c.x, y = c.y, z = c.z, k0 = cellOf(x, y, z), F = this.fcells;
    for (let dz = -G2; dz <= G2; dz += G2) for (let dy = -GRID; dy <= GRID; dy += GRID) for (let dx = -1; dx <= 1; dx++) {
      const a = F[k0 + dx + dy + dz];
      if (!a) continue;
      for (let k = 0; k < a.length; k++) {
        const i = a[k], ex = this.fx[i] - x, ey = this.fy[i] - y, ez = this.fz[i] - z, d = ex * ex + ey * ey + ez * ez;
        if (d < bd) { bd = d; best = i; }
      }
    }
    return best;
  }
  nearestCreature(c, range) {
    let best = null, bd = range * range;
    const k0 = cellOf(c.x, c.y, c.z), H = this.cHead, Nx = this.cNext, cs = this.creatures;
    for (let dz = -G2; dz <= G2; dz += G2) for (let dy = -GRID; dy <= GRID; dy += GRID) for (let dx = -1; dx <= 1; dx++) {
      for (let j = H[k0 + dx + dy + dz]; j >= 0; j = Nx[j]) {
        const o = cs[j]; if (o === c || !o.alive) continue;
        const ex = o.x - c.x, ey = o.y - c.y, ez = o.z - c.z, d = ex * ex + ey * ey + ez * ez;
        if (d < bd) { bd = d; best = o; }
      }
    }
    return best;
  }
  nearestNest(x, y, z, range, speciesId) {
    let best = null, bd = range * range;
    const k0 = cellOf(x, y, z), C = this.ncells;
    for (let dz = -G2; dz <= G2; dz += G2) for (let dy = -GRID; dy <= GRID; dy += GRID) for (let dx = -1; dx <= 1; dx++) {
      const a = C[k0 + dx + dy + dz]; if (!a) continue;
      for (const n of a) {
        if (speciesId && n.sp !== speciesId) continue;
        const ex = n.x - x, ey = n.y - y, ez = n.z - z, d = ex * ex + ey * ey + ez * ez;
        if (d < bd) { bd = d; best = n; }
      }
    }
    return best;
  }
  addNest(x, y, z, sp, hp = 1, id = 0, built = this.tick) {
    const n = { id: id || this.nextNestId++, x, y, z, sp, hp, built };
    this.nests.push(n);
    const k = cellOf(x, y, z); let a = this.ncells[k]; if (!a) this.ncells[k] = a = []; a.push(n);
    return n;
  }
  removeNest(n) {
    const a = this.ncells[cellOf(n.x, n.y, n.z)];
    if (a) { const j = a.indexOf(n); if (j >= 0) { a[j] = a[a.length - 1]; a.pop(); } }
    n.dead = true;
  }
  similarity(a, b) { // 0..1, based on body genes + a sample of brain weights
    const ga = a.genes, gb = b.genes;
    let d = (ga.size - gb.size) ** 2 + (ga.speed - gb.speed) ** 2 + (ga.sense - gb.sense) ** 2 + 2 * (ga.diet - gb.diet) ** 2 + 0.5 * (ga.life - gb.life) ** 2;
    let dh = Math.abs(ga.hue - gb.hue); dh = Math.min(dh, 1 - dh); d += 4 * dh * dh;
    const ba = ga.body, bb = gb.body;
    d += 0.6 * ((ba.len - bb.len) ** 2 + (ba.wid - bb.wid) ** 2 + (ba.hgt - bb.hgt) ** 2 + (ba.legs - bb.legs) ** 2 + (ba.neck - bb.neck) ** 2 + (ba.horn - bb.horn) ** 2 + (ba.tail - bb.tail) ** 2);
    let bw = 0; for (let i = 0; i < NW; i += 3) bw += (ga.w[i] - gb.w[i]) ** 2;
    d += bw / (NW / 3) * 0.5;
    return Math.exp(-d * 3);
  }

  step() {
    const w = this.world, rng = this.rng, inp = this.inp;
    this.tick++;
    const season = this.dateInfo().season;
    // plants grow by themselves (more in spring, less in winter)
    let pr = P.plantRate * SEASON_GROW[season]; while (pr > 0) { if (pr >= 1 || rng() < pr) this.spawnPlant(); pr -= 1; }
    // eaten plants regrow where they stood (roots survive), so meadows recover by themselves
    while (this.regrow.length && this.regrow[0][0] <= this.tick) {
      const [, x, y, z] = this.regrow.shift();
      if (this.fcount < MAXF - 500) this.spawnPlant(x, y, z, 0.003);
    }
    // at the global cap, old plants wither so growth keeps happening everywhere
    for (let k = 0; k < 8 && this.fcount > P.maxFood; k++) { const i = (rng() * MAXF) | 0; if (this.falive[i] && this.ft[i] === 0) this.removeFood(i); }
    // meat and manna rot slowly
    if (this.tick % 20 === 0) for (let k = 0; k < 30; k++) { const i = (rng() * MAXF) | 0; if (this.falive[i] && this.ft[i] !== 0 && rng() < 0.08) this.removeFood(i); }
    // rebuild creature hash (linked lists in typed arrays)
    const cs = this.creatures, H = this.cHead;
    for (const k of this.cTouched) H[k] = -1;
    this.cTouched.length = 0;
    if (this.cNext.length < cs.length) this.cNext = new Int32Array(cs.length * 2);
    for (let i = 0; i < cs.length; i++) { const c = cs[i], k = cellOf(c.x, c.y, c.z); if (H[k] < 0) this.cTouched.push(k); this.cNext[i] = H[k]; H[k] = i; }
    const born = [];
    for (let ci = 0, cn = cs.length; ci < cn; ci++) {
      const c = cs[ci];
      if (!c.alive) continue;
      const g = c.genes;
      c.px = c.x; c.py = c.y; c.pz = c.z;
      const range = 0.012 + 0.012 * g.sense;
      const rx = c.hy * c.z - c.hz * c.y, ry = c.hz * c.x - c.hx * c.z, rz = c.hx * c.y - c.hy * c.x; // right = h x p
      // --- senses ---
      const fi = this.nearestFood(c, range);
      if (fi >= 0) {
        const dx = this.fx[fi] - c.x, dy = this.fy[fi] - c.y, dz = this.fz[fi] - c.z, d = Math.hypot(dx, dy, dz) || 1e-6;
        inp[0] = (dx * rx + dy * ry + dz * rz) / d; inp[1] = (dx * c.hx + dy * c.hy + dz * c.hz) / d; inp[2] = 1 - d / range; inp[3] = this.ft[fi] === 1 ? 1 : -1;
      } else { inp[0] = 0; inp[1] = 0; inp[2] = 0; inp[3] = 0; }
      const o = this.nearestCreature(c, range);
      let sim = 0;
      if (o) {
        const dx = o.x - c.x, dy = o.y - c.y, dz = o.z - c.z, d = Math.hypot(dx, dy, dz) || 1e-6;
        sim = this.similarity(c, o);
        inp[4] = (dx * rx + dy * ry + dz * rz) / d; inp[5] = (dx * c.hx + dy * c.hy + dz * c.hz) / d; inp[6] = 1 - d / range;
        inp[7] = sim * 2 - 1; inp[8] = clamp(o.genes.size - g.size, -1, 1);
      } else { inp[4] = 0; inp[5] = 0; inp[6] = 0; inp[7] = 0; inp[8] = 0; }
      const maxE = 100 * g.size;
      inp[9] = c.energy / maxE;
      const ax = c.x + c.hx * 0.006, ay = c.y + c.hy * 0.006, az = c.z + c.hz * 0.006, al = Math.hypot(ax, ay, az);
      inp[10] = isLand(w, ax / al, ay / al, az / al) ? -1 : 1;
      inp[11] = c.age / c.lifespan; inp[12] = c.mem0; inp[13] = c.mem1;
      const nest = this.nests.length ? this.nearestNest(c.x, c.y, c.z, range, c.speciesId) : null;
      let nestD = 1;
      if (nest) {
        const dx = nest.x - c.x, dy = nest.y - c.y, dz = nest.z - c.z, d = Math.hypot(dx, dy, dz) || 1e-6;
        nestD = d;
        inp[14] = (dx * rx + dy * ry + dz * rz) / d; inp[15] = (dx * c.hx + dy * c.hy + dz * c.hz) / d; inp[16] = 1 - d / range;
      } else { inp[14] = 0; inp[15] = 0; inp[16] = 0; }
      inp[17] = 1;
      // --- think ---
      const act = think(g.w, inp, c.hid, c.out);
      c.inp.set(inp); c.act = act;
      const out = c.out;
      c.mem0 = out[5]; c.mem1 = out[6];
      // --- act: turn + move (physics) ---
      const turn = out[0] * P.maxTurn, cs_ = Math.cos(turn), sn = Math.sin(turn);
      let hx = c.hx * cs_ + rx * sn, hy = c.hy * cs_ + ry * sn, hz = c.hz * cs_ + rz * sn;
      const spd = (out[1] + 1) * 0.5;
      const step = spd * P.baseSpeed * g.speed;
      let nx = c.x + hx * step, ny = c.y + hy * step, nz = c.z + hz * step;
      const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      if (isLand(w, nx, ny, nz)) { c.x = nx; c.y = ny; c.z = nz; }
      const dd = hx * c.x + hy * c.y + hz * c.z; hx -= dd * c.x; hy -= dd * c.y; hz -= dd * c.z;
      const hl = Math.hypot(hx, hy, hz) || 1; c.hx = hx / hl; c.hy = hy / hl; c.hz = hz / hl;
      if (fi >= 0) { c.sensedTicks++; if (inp[1] > 0.7 && spd > 0.3) c.toward++; }
      // --- energy costs (longer-lived bodies burn a bit more) ---
      const atNest = nest && nestD < P.nestR;
      let base = P.baseCost * Math.pow(g.size, 0.8) * (0.8 + 0.2 * g.life);
      if (atNest) { // shelter: resting at your own species' nest saves energy and keeps the nest standing
        base *= spd < 0.3 ? 0.3 : 0.6;
        nest.hp = Math.min(1, nest.hp + 0.004); c.atNest++;
      }
      c.energy -= base + P.moveCost * spd * g.speed * g.speed * g.size + P.senseCost * g.sense + P.brainCost * act;
      if (c.cooldown > 0) c.cooldown--;
      const reach = P.reach + g.size * 0.001;
      // eat
      if (out[2] > -0.3 && fi >= 0 && this.falive[fi]) {
        const dx = this.fx[fi] - c.x, dy = this.fy[fi] - c.y, dz = this.fz[fi] - c.z;
        if (dx * dx + dy * dy + dz * dz < reach * reach) {
          const eff = this.ft[fi] === 1 ? 0.2 + 0.8 * g.diet : 1 - 0.8 * g.diet;
          c.energy = Math.min(maxE, c.energy + this.fe[fi] * eff); c.eaten++;
          if (this.ft[fi] === 0 && this.regrow.length < 6000 && rng() < P.regrowP) this.regrow.push([this.tick + P.regrowT + ((rng() * P.regrowT) | 0), this.fx[fi], this.fy[fi], this.fz[fi]]);
          this.removeFood(fi);
        }
      }
      // attack
      if (out[3] > 0 && o && o.alive && c.cooldown === 0) {
        c.energy -= 0.6 * g.size; c.cooldown = 30;
        const dx = o.x - c.x, dy = o.y - c.y, dz = o.z - c.z;
        if (dx * dx + dy * dy + dz * dz < reach * reach && rng() < g.size / (g.size + o.genes.size) * (0.04 + 0.7 * g.diet * g.diet)) {
          const gain = (Math.max(0, o.energy) * 0.5 + 30 * o.genes.size) * (0.1 + 0.9 * g.diet);
          c.energy = Math.min(maxE, c.energy + gain); c.eaten++;
          this.kill(o, 'נטרף'); this.stats.kills++;
        }
      }
      // build a nest (first step of building)
      if (out[7] > 0.5 && c.age > c.maturity && c.cooldown === 0 && c.energy > 0.5 * maxE && c.speciesId && this.nests.length < P.maxNests
        && !(nest && nestD < 0.004)) {
        c.energy -= P.nestCost * maxE; c.cooldown = 150; c.built++;
        this.addNest(c.x, c.y, c.z, c.speciesId);
        this.stats.nestsBuilt++;
        this.nestMilestone(c.speciesId);
      }
      // reproduce
      if (out[4] > 0 && c.age > c.maturity && c.cooldown === 0 && c.energy > 0.55 * maxE && (cn + born.length < P.softPop || rng() < (P.maxPop - cn - born.length) / (P.maxPop - P.softPop))) {
        let genes;
        const dx = o ? o.x - c.x : 1, dy = o ? o.y - c.y : 0, dz = o ? o.z - c.z : 0;
        if (o && o.alive && sim > 0.4 && o.out[4] > 0 && dx * dx + dy * dy + dz * dz < reach * reach * 4) genes = this.crossGenes(c.genes, o.genes);
        else genes = this.mutateGenes(g);
        const childE = 0.35 * maxE;
        c.energy -= childE + 5; c.cooldown = 120; c.kids++;
        const p = this.jitterLand(c.x, c.y, c.z, 0.004) || [c.x, c.y, c.z];
        born.push([p, genes, c.gen + 1, atNest ? childE * 1.6 : childE, c.speciesId]); // born in a nest = a head start
      }
      c.age++;
      if (c.energy <= 0) this.kill(c, 'רעב');
      else if (c.age > c.lifespan) this.kill(c, 'זקנה');
    }
    if (cs.some((c) => !c.alive)) this.creatures = cs.filter((c) => c.alive);
    for (const [p, genes, gen, e, sp] of born) { this.addCreature(p[0], p[1], p[2], genes, gen, e).speciesId = sp; this.stats.births++; }
    // nests decay when unused
    if (this.tick % 10 === 0 && this.nests.length) {
      let any = false;
      for (const n of this.nests) {
        n.hp -= P.nestDecay * 10; if (n.hp <= 0) { this.removeNest(n); any = true; continue; }
        // a lived-in nest is a little garden: dropped seeds sprout around it (seed of farming)
        if (n.hp > 0.5 && this.fcount < P.maxFood && this.rng() < 0.12) this.spawnPlant(n.x, n.y, n.z, 0.012);
      }
      if (any) this.nests = this.nests.filter((n) => !n.dead);
    }
    if (this.tick % 200 === 0) { this.updateSpecies(); this.checkMilestones(); }
    this.nature();
  }

  // ---------- nature: events by themselves + a gentle safety net ----------
  nature() {
    const t = this.tick;
    if (this.regions.length) this.regions = this.regions.filter((r) => r.until > t);
    if (t >= this.nextEvent) { this.randomEvent(); this.nextEvent = t + 1000 + ((this.rng() * 1600) | 0); }
    if (this.creatures.length < P.minPop && t - this.lastRescue > 150) this.rescue();
  }
  eventCenter() {
    const cs = this.creatures;
    if (cs.length && this.rng() < 0.75) { const c = cs[(this.rng() * cs.length) | 0]; return [c.x, c.y, c.z]; }
    return this.randomLandPoint();
  }
  placeName() {
    const A = ['עמק', 'מישור', 'גבעות', 'ערבות', 'יערות', 'חוף'];
    return A[(this.rng() * A.length) | 0] + ' ' + makeName((this.rng() * 1e6) | 0, 5);
  }
  randomEvent() {
    const r = this.rng(), [x, y, z] = this.eventCenter(), place = this.placeName();
    if (r < 0.32) { // blooming season
      this.regions.push({ type: 'bloom', x, y, z, r: 0.09, mult: 4, until: this.tick + 700 });
      for (let i = 0; i < 260; i++) this.spawnPlant(x, y, z, 0.12, true);
      this.emit('🌸', `עונת פריחה ב${place}: צמחים צצים בכל מקום`);
    } else if (r < 0.52) { // drought
      this.regions.push({ type: 'drought', x, y, z, r: 0.1, mult: 0.12, until: this.tick + 1300 });
      this.witherAround(x, y, z, 0.1, 0.55);
      this.emit('☀️', `בצורת ב${place}: הצמחים קמלים`);
    } else if (r < 0.74) { // fruit rain
      for (let i = 0; i < 70; i++) { const p = this.jitterLand(x, y, z, 0.05); if (p) this.addFood(p[0], p[1], p[2], P.mannaE, 2); }
      this.emit('🍎', `גשם פירות ירד ב${place}`);
    } else { // the rains move: drought here, plenty a bit further away -> migration
      const [tx, ty, tz] = randTangent(x, y, z, this.rng);
      let bx = x + tx * 0.16, by = y + ty * 0.16, bz = z + tz * 0.16; const l = Math.hypot(bx, by, bz); bx /= l; by /= l; bz /= l;
      this.regions.push({ type: 'drought', x, y, z, r: 0.08, mult: 0.15, until: this.tick + 1500 });
      this.regions.push({ type: 'bloom', x: bx, y: by, z: bz, r: 0.09, mult: 3.5, until: this.tick + 1500 });
      this.witherAround(x, y, z, 0.08, 0.5);
      for (let i = 0; i < 200; i++) this.spawnPlant(bx, by, bz, 0.12, true);
      this.emit('🦬', `הגשמים נדדו מ${place} — היצורים יצטרכו לנדוד`);
    }
  }
  witherAround(x, y, z, R, frac) {
    for (let i = 0; i < MAXF; i++) if (this.falive[i] && this.ft[i] === 0) {
      const dx = this.fx[i] - x, dy = this.fy[i] - y, dz = this.fz[i] - z;
      if (dx * dx + dy * dy + dz * dz < R * R && this.rng() < frac) this.removeFood(i);
    }
  }
  rescue() { // nature seeds a few creatures from the best recent genomes, so the world never ends empty
    this.lastRescue = this.tick;
    const pool = this.bank.length ? [...this.bank].sort((a, b) => b.score - a.score).slice(0, 8) : this.creatures.map((c) => ({ genes: c.genes, gen: c.gen }));
    let x, y, z;
    if (this.creatures.length) { const c = this.creatures[(this.rng() * this.creatures.length) | 0]; x = c.x; y = c.y; z = c.z; }
    else [x, y, z] = this.randomLandPoint();
    for (let i = 0; i < 30; i++) this.spawnPlant(x, y, z, 0.04, true);
    let k = 0;
    for (let i = 0; i < 8; i++) {
      const src = pool.length ? pool[(this.rng() * pool.length) | 0] : { genes: this.randomGenes(), gen: 0 };
      const p = this.jitterLand(x, y, z, 0.02);
      if (p) { this.addCreature(p[0], p[1], p[2], this.mutateGenes(src.genes), (src.gen || 0) + 1, 70 * src.genes.size); k++; }
    }
    if (k) { this.stats.rescues++; this.updateSpecies(); this.emit('🌱', `הטבע החזיר חיים: ${k} יצורים חדשים מצאצאי השורדים`); }
  }

  kill(c, cause) {
    if (!c.alive) return;
    c.alive = false; this.stats.deaths++; c.cause = cause;
    this.deadLog.push({ gen: c.gen, age: c.age, eaten: c.eaten, kids: c.kids, built: c.built, life: c.genes.life, cause, toward: c.sensedTicks ? c.toward / c.sensedTicks : 0, t: this.tick });
    if (this.deadLog.length > 4000) this.deadLog.splice(0, 1000);
    if (c.kids >= 2) { this.bank.push({ genes: c.genes, gen: c.gen, score: c.kids + c.age / c.lifespan }); if (this.bank.length > 60) this.bank.shift(); }
    if (cause !== 'נטרף' && cause !== 'ברק') this.addFood(c.x, c.y, c.z, 25 * c.genes.size, 1); // carcass = meat
  }

  // ---------- milestones (the seed of the history book) ----------
  nestMilestone(spId) {
    const f = this.flags, key = 'nest' + spId;
    if (f[key]) return;
    f[key] = 1;
    const sp = this.speciesById.get(spId), nm = sp ? sp.name : '';
    if (!f.firstNest) { f.firstNest = 1; this.emit('🛖', `מין ${nm} בנה את הקן הראשון בעולם!`, 'milestone'); }
    else this.emit('🛖', `מין ${nm} בנה את הקן הראשון שלו!`, 'milestone');
  }
  checkMilestones() {
    const f = this.flags;
    for (const g of [10, 25, 50, 100, 200, 500, 1000]) if (this.stats.maxGen >= g && !f['gen' + g]) { f['gen' + g] = 1; this.emit('🧬', `נולד הדור ה־${g}`, 'milestone'); }
    for (const n of [10, 20, 30]) if (this.species.length >= n && !f['sp' + n]) { f['sp' + n] = 1; this.emit('🌿', `${n} מינים חיים יחד על הכוכב`, 'milestone'); }
    const per = new Map(); for (const n of this.nests) per.set(n.sp, (per.get(n.sp) || 0) + 1);
    for (const [sp, k] of per) if (k >= 10 && !f['vil' + sp]) { f['vil' + sp] = 1; const s = this.speciesById.get(sp); if (s) this.emit('🏘️', `למין ${s.name} יש כבר 10 קנים — כמעט כפר`, 'milestone'); }
    for (const s of this.species) {
      if (s.count >= 20) f['big' + s.id] = 1;
      if (s.meanDiet > 0.6 && s.count >= 8 && !f.firstCarn) { f.firstCarn = 1; this.emit('🦷', `מין ${s.name} הפך לטורפים`, 'milestone'); }
    }
    if (!this.prevSpecies) this.prevSpecies = new Map();
    for (const [id, nm] of this.prevSpecies) if (!this.speciesById.has(id) && f['big' + id] && !f['ext' + id]) { f['ext' + id] = 1; this.emit('💀', `מין ${nm} נכחד`, 'milestone'); }
    this.prevSpecies = new Map(this.species.map((s) => [s.id, s.name]));
  }

  // ---------- god tools ----------
  lightning(x, y, z, radius = 0.012) {
    let n = 0;
    for (const c of this.creatures) {
      const dx = c.x - x, dy = c.y - y, dz = c.z - z;
      if (dx * dx + dy * dy + dz * dz < radius * radius) { this.kill(c, 'ברק'); n++; }
    }
    for (let i = 0; i < MAXF; i++) if (this.falive[i]) {
      const dx = this.fx[i] - x, dy = this.fy[i] - y, dz = this.fz[i] - z;
      if (dx * dx + dy * dy + dz * dz < radius * radius * 0.5) this.removeFood(i);
    }
    for (const q of this.nests) { const dx = q.x - x, dy = q.y - y, dz = q.z - z; if (dx * dx + dy * dy + dz * dz < radius * radius * 0.5) this.removeNest(q); }
    this.nests = this.nests.filter((q) => !q.dead);
    this.creatures = this.creatures.filter((c) => c.alive);
    return n;
  }
  dropFood(x, y, z, n = 16) {
    let k = 0;
    for (let i = 0; i < n; i++) { const p = this.jitterLand(x, y, z, 0.014); if (p && this.addFood(p[0], p[1], p[2], P.mannaE, 2) >= 0) k++; }
    return k;
  }
  spawnCreatures(x, y, z, n = 6) {
    const base = this.randomGenes(); let k = 0;
    for (let i = 0; i < n; i++) { const p = this.jitterLand(x, y, z, 0.01); if (p) { this.addCreature(p[0], p[1], p[2], i ? this.mutateGenes(base) : base, 0); k++; } }
    this.updateSpecies();
    return k;
  }

  // species = clusters of genetic similarity, with persistent ids
  updateSpecies() {
    const old = this.species, next = new Map();
    for (const c of this.creatures) {
      let best = null, bs = 0.35;
      for (const s of old) { const v = this.similarity(c, s.rep); if (v > bs) { bs = v; best = s; } }
      if (!best) for (const s of next.values()) { const v = this.similarity(c, s.rep); if (v > bs) { bs = v; best = s; } }
      if (!best) {
        const id = this.nextSpecies++;
        best = { id, rep: c, color: hsl(c.genes.hue), name: makeName(id * 7 + 3, 99) };
        old.push(best);
      }
      if (!next.has(best.id)) next.set(best.id, { ...best, count: 0, members: [] });
      const s = next.get(best.id); s.count++; s.members.push(c); c.speciesId = best.id;
    }
    // representative: a living member (keeps species tracking drifting lineages)
    this.species = [...next.values()].map((s) => {
      let diet = 0; for (const m of s.members) diet += m.genes.diet;
      return { id: s.id, color: s.color, name: s.name, count: s.count, meanDiet: diet / s.count, rep: s.members[(s.members.length / 2) | 0] };
    });
    this.speciesById = new Map(this.species.map((s) => [s.id, s]));
    this.speciesVer++;
  }

  avgGen() { if (!this.creatures.length) return 0; let s = 0; for (const c of this.creatures) s += c.gen; return s / this.creatures.length; }
}

export function hsl(h, s = 0.7, l = 0.55) {
  const k = (n) => (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}
