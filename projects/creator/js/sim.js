// Creature + plant simulation on the sphere. Pure JS (no three.js), runs in node for tests.
import { mulberry32, gaussian } from './noise.js';
import { isLand, sample } from './world.js';
import { NI, NH, NO, NW, randomWeights, mutateWeights, crossWeights, think } from './brain.js';
import { makeName } from './names.js';

export const TICKS_PER_DAY = 1200;
export const DAYS_PER_YEAR = 20;
export const P = {
  baseSpeed: 0.0020, maxTurn: 0.12, reach: 0.016,
  plantE: 30, mannaE: 50, maxFood: 11000, plantRate: 8.0, initialPlants: 4000,
  baseCost: 0.015, moveCost: 0.02, senseCost: 0.006, brainCost: 0.0015,
  maturity: 250, cellCap: 20, lifespan: 4200, minPop: 0,
};
const MAXF = 14000;
const CS = 0.08, GRID = 32; // spatial hash: cell size in unit-cube coords
const cellKey = (x, y, z) => (((x + 1) / CS) | 0) + (((y + 1) / CS) | 0) * GRID + (((z + 1) / CS) | 0) * GRID * GRID;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function randTangent(x, y, z, rng) {
  let ax = rng() - 0.5, ay = rng() - 0.5, az = rng() - 0.5;
  const d = ax * x + ay * y + az * z; ax -= d * x; ay -= d * y; az -= d * z;
  const l = Math.hypot(ax, ay, az) || 1; return [ax / l, ay / l, az / l];
}

export class Sim {
  constructor(world, seed) {
    this.world = world;
    this.rng = mulberry32(seed * 31 + 7);
    this.tick = 0; this.nextId = 1;
    this.creatures = [];
    this.fx = new Float32Array(MAXF); this.fy = new Float32Array(MAXF); this.fz = new Float32Array(MAXF);
    this.fe = new Float32Array(MAXF); this.ft = new Uint8Array(MAXF); this.falive = new Uint8Array(MAXF);
    this.fcount = 0; this.ffree = []; for (let i = MAXF - 1; i >= 0; i--) this.ffree.push(i);
    this.fcells = new Map(); this.ccells = new Map();
    this.species = []; this.nextSpecies = 1;
    this.inp = new Float32Array(NI); this.hid = new Float32Array(NH); this.out = new Float32Array(NO);
    this.stats = { births: 0, deaths: 0, kills: 0, maxGen: 0 };
    this.deadLog = []; // recent dead creatures for fitness stats
    // land cell list for plant spawning (weighted by fertility)
    const cells = [];
    for (let i = 0; i < world.fert.length; i++) if (world.fert[i] > 0.05) cells.push(i);
    this.fertCells = Int32Array.from(cells);
  }

  // ---------- food ----------
  addFood(x, y, z, e, type) {
    if (!this.ffree.length) return -1;
    const i = this.ffree.pop();
    this.fx[i] = x; this.fy[i] = y; this.fz[i] = z; this.fe[i] = e; this.ft[i] = type; this.falive[i] = 1;
    const k = cellKey(x, y, z); let a = this.fcells.get(k); if (!a) this.fcells.set(k, a = []); a.push(i);
    this.fcount++; return i;
  }
  removeFood(i) {
    if (!this.falive[i]) return;
    this.falive[i] = 0; this.fcount--; this.ffree.push(i);
    const a = this.fcells.get(cellKey(this.fx[i], this.fy[i], this.fz[i]));
    if (a) { const j = a.indexOf(i); if (j >= 0) { a[j] = a[a.length - 1]; a.pop(); } }
  }
  spawnPlant() {
    const rng = this.rng, w = this.world;
    let x, y, z;
    if (this.fcount > 50 && rng() < 0.55) { // spread near an existing plant
      let i = 0, tries = 0;
      do { i = (rng() * MAXF) | 0; } while ((!this.falive[i] || this.ft[i] !== 0) && ++tries < 20);
      if (!this.falive[i]) return;
      x = this.fx[i] + (rng() - 0.5) * 0.05; y = this.fy[i] + (rng() - 0.5) * 0.05; z = this.fz[i] + (rng() - 0.5) * 0.05;
    } else {
      const c = this.fertCells[(rng() * this.fertCells.length) | 0];
      x = w.dir[c * 3] + (rng() - 0.5) * 0.012; y = w.dir[c * 3 + 1] + (rng() - 0.5) * 0.012; z = w.dir[c * 3 + 2] + (rng() - 0.5) * 0.012;
    }
    const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l;
    const f = sample(w, w.fert, x, y, z);
    const cell = this.fcells.get(cellKey(x, y, z));
    if (cell && cell.length >= P.cellCap * f + 2) return; // local crowding limits growth
    if (rng() < f) this.addFood(x, y, z, P.plantE, 0);
  }

  // ---------- creatures ----------
  randomGenes() {
    const r = this.rng;
    return { size: 0.8 + r() * 0.5, speed: 0.8 + r() * 0.5, sense: 0.8 + r() * 0.5, diet: r() * 0.2, hue: r(), w: randomWeights(r, 0.6) };
  }
  mutateGenes(g) {
    const r = this.rng, m = (v, s, lo, hi) => clamp(v + (r() < 0.3 ? gaussian(r) * s : 0), lo, hi);
    return { size: m(g.size, 0.06, 0.5, 2.2), speed: m(g.speed, 0.06, 0.4, 2.2), sense: m(g.sense, 0.06, 0.4, 2.2),
      diet: m(g.diet, 0.05, 0, 1), hue: (g.hue + gaussian(r) * 0.01 + 1) % 1, w: mutateWeights(g.w, r) };
  }
  addCreature(x, y, z, genes, gen = 0, energy = null) {
    const [hx, hy, hz] = randTangent(x, y, z, this.rng);
    const id = this.nextId++;
    const c = { id, name: makeName(id, this.world.seed), x, y, z, px: x, py: y, pz: z, hx, hy, hz, genes, gen,
      energy: energy ?? 60 * genes.size, age: 0, lifespan: P.lifespan * (0.8 + this.rng() * 0.4),
      mem0: 0, mem1: 0, cooldown: 0, kids: 0, eaten: 0, alive: true, speciesId: 0, act: 0,
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
    for (let i = 0; i < P.initialPlants; i++) this.spawnPlant();
    // a few founder groups so species start out distinct
    const groups = 8;
    for (let g = 0; g < groups; g++) {
      const [x, y, z] = this.randomLandPoint();
      const base = this.randomGenes();
      for (let i = 0; i < n / groups; i++) {
        const p = this.jitterLand(x, y, z, 0.06);
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
    const x = c.x, y = c.y, z = c.z;
    const ix = ((x + 1) / CS) | 0, iy = ((y + 1) / CS) | 0, iz = ((z + 1) / CS) | 0;
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const a = this.fcells.get((ix + dx) + (iy + dy) * GRID + (iz + dz) * GRID * GRID);
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
    const ix = ((c.x + 1) / CS) | 0, iy = ((c.y + 1) / CS) | 0, iz = ((c.z + 1) / CS) | 0;
    for (let dz = -1; dz <= 1; dz++) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const a = this.ccells.get((ix + dx) + (iy + dy) * GRID + (iz + dz) * GRID * GRID);
      if (!a) continue;
      for (let k = 0; k < a.length; k++) {
        const o = a[k]; if (o === c || !o.alive) continue;
        const ex = o.x - c.x, ey = o.y - c.y, ez = o.z - c.z, d = ex * ex + ey * ey + ez * ez;
        if (d < bd) { bd = d; best = o; }
      }
    }
    return best;
  }
  similarity(a, b) { // 0..1, based on body genes + a sample of brain weights
    const ga = a.genes, gb = b.genes;
    let d = (ga.size - gb.size) ** 2 + (ga.speed - gb.speed) ** 2 + (ga.sense - gb.sense) ** 2 + 2 * (ga.diet - gb.diet) ** 2;
    let dh = Math.abs(ga.hue - gb.hue); dh = Math.min(dh, 1 - dh); d += 4 * dh * dh;
    let bw = 0; for (let i = 0; i < NW; i += 3) bw += (ga.w[i] - gb.w[i]) ** 2;
    d += bw / (NW / 3) * 0.5;
    return Math.exp(-d * 3);
  }

  step() {
    const w = this.world, rng = this.rng, inp = this.inp;
    this.tick++;
    // plants grow
    let pr = P.plantRate; while (pr > 0) { if (pr >= 1 || rng() < pr) this.spawnPlant(); pr -= 1; }
    // at the global cap, old plants wither so growth keeps happening everywhere
    for (let k = 0; k < 6 && this.fcount > P.maxFood; k++) { const i = (rng() * MAXF) | 0; if (this.falive[i] && this.ft[i] === 0) this.removeFood(i); }
    // rebuild creature hash
    this.ccells.clear();
    for (const c of this.creatures) { const k = cellKey(c.x, c.y, c.z); let a = this.ccells.get(k); if (!a) this.ccells.set(k, a = []); a.push(c); }
    const born = [];
    for (const c of this.creatures) {
      if (!c.alive) continue;
      const g = c.genes;
      c.px = c.x; c.py = c.y; c.pz = c.z;
      const range = 0.045 + 0.04 * g.sense;
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
      const ax = c.x + c.hx * 0.02, ay = c.y + c.hy * 0.02, az = c.z + c.hz * 0.02, al = Math.hypot(ax, ay, az);
      inp[10] = isLand(w, ax / al, ay / al, az / al) ? -1 : 1;
      inp[11] = c.age / c.lifespan; inp[12] = c.mem0; inp[13] = c.mem1; inp[14] = 1;
      // --- think ---
      const act = think(g.w, inp, c.hid, c.out);
      c.inp.set(inp); c.act = act;
      const out = c.out;
      c.mem0 = out[5]; c.mem1 = out[6];
      // --- act: turn + move (physics) ---
      const turn = out[0] * P.maxTurn, cs = Math.cos(turn), sn = Math.sin(turn);
      let hx = c.hx * cs + rx * sn, hy = c.hy * cs + ry * sn, hz = c.hz * cs + rz * sn;
      const spd = (out[1] + 1) * 0.5;
      const step = spd * P.baseSpeed * g.speed;
      let nx = c.x + hx * step, ny = c.y + hy * step, nz = c.z + hz * step;
      const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
      if (isLand(w, nx, ny, nz)) { c.x = nx; c.y = ny; c.z = nz; }
      const dd = hx * c.x + hy * c.y + hz * c.z; hx -= dd * c.x; hy -= dd * c.y; hz -= dd * c.z;
      const hl = Math.hypot(hx, hy, hz) || 1; c.hx = hx / hl; c.hy = hy / hl; c.hz = hz / hl;
      if (fi >= 0) { c.sensedTicks++; if (inp[1] > 0.7 && spd > 0.3) c.toward++; }
      // --- energy costs ---
      c.energy -= P.baseCost * Math.pow(g.size, 0.8) + P.moveCost * spd * g.speed * g.speed * g.size + P.senseCost * g.sense + P.brainCost * act;
      if (c.cooldown > 0) c.cooldown--;
      const reach = P.reach + g.size * 0.003;
      // eat
      if (out[2] > -0.3 && fi >= 0 && this.falive[fi]) {
        const dx = this.fx[fi] - c.x, dy = this.fy[fi] - c.y, dz = this.fz[fi] - c.z;
        if (dx * dx + dy * dy + dz * dz < reach * reach) {
          const eff = this.ft[fi] === 1 ? 0.2 + 0.8 * g.diet : 1 - 0.8 * g.diet;
          c.energy = Math.min(maxE, c.energy + this.fe[fi] * eff); c.eaten++;
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
      // reproduce
      if (out[4] > 0 && c.age > P.maturity && c.cooldown === 0 && c.energy > 0.55 * maxE) {
        let genes;
        const dx = o ? o.x - c.x : 1, dy = o ? o.y - c.y : 0, dz = o ? o.z - c.z : 0;
        if (o && o.alive && sim > 0.4 && o.out[4] > 0 && dx * dx + dy * dy + dz * dz < reach * reach * 4) {
          const a = c.genes, b = o.genes, pick = (k) => (rng() < 0.5 ? a[k] : b[k]);
          genes = this.mutateGenes({ size: pick('size'), speed: pick('speed'), sense: pick('sense'), diet: pick('diet'), hue: pick('hue'), w: crossWeights(a.w, b.w, rng) });
        } else genes = this.mutateGenes(g);
        const childE = 0.35 * maxE;
        c.energy -= childE + 5; c.cooldown = 120; c.kids++;
        const p = this.jitterLand(c.x, c.y, c.z, 0.015) || [c.x, c.y, c.z];
        born.push([p, genes, c.gen + 1, childE]);
      }
      c.age++;
      if (c.energy <= 0) this.kill(c, 'רעב');
      else if (c.age > c.lifespan) this.kill(c, 'זקנה');
    }
    if (this.creatures.some((c) => !c.alive)) this.creatures = this.creatures.filter((c) => c.alive);
    for (const [p, genes, gen, e] of born) { this.addCreature(p[0], p[1], p[2], genes, gen, e); this.stats.births++; }
    if (this.tick % 200 === 0) this.updateSpecies();
  }

  kill(c, cause) {
    if (!c.alive) return;
    c.alive = false; this.stats.deaths++; c.cause = cause;
    this.deadLog.push({ gen: c.gen, age: c.age, eaten: c.eaten, kids: c.kids, toward: c.sensedTicks ? c.toward / c.sensedTicks : 0, t: this.tick });
    if (this.deadLog.length > 4000) this.deadLog.splice(0, 1000);
    if (cause !== 'נטרף' && cause !== 'ברק') this.addFood(c.x, c.y, c.z, 25 * c.genes.size, 1); // carcass = meat
  }

  // god tools
  lightning(x, y, z, radius = 0.035) {
    let n = 0;
    for (const c of this.creatures) {
      const dx = c.x - x, dy = c.y - y, dz = c.z - z;
      if (dx * dx + dy * dy + dz * dz < radius * radius) { this.kill(c, 'ברק'); n++; }
    }
    for (let i = 0; i < MAXF; i++) if (this.falive[i]) {
      const dx = this.fx[i] - x, dy = this.fy[i] - y, dz = this.fz[i] - z;
      if (dx * dx + dy * dy + dz * dz < radius * radius * 0.5) this.removeFood(i);
    }
    this.creatures = this.creatures.filter((c) => c.alive);
    return n;
  }
  dropFood(x, y, z, n = 14) {
    let k = 0;
    for (let i = 0; i < n; i++) { const p = this.jitterLand(x, y, z, 0.04); if (p && this.addFood(p[0], p[1], p[2], P.mannaE, 2) >= 0) k++; }
    return k;
  }
  spawnCreatures(x, y, z, n = 6) {
    const base = this.randomGenes(); let k = 0;
    for (let i = 0; i < n; i++) { const p = this.jitterLand(x, y, z, 0.03); if (p) { this.addCreature(p[0], p[1], p[2], i ? this.mutateGenes(base) : base, 0); k++; } }
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
    this.species = [...next.values()].map((s) => ({ id: s.id, color: s.color, name: s.name, count: s.count, rep: s.members[(s.members.length / 2) | 0] }));
    this.speciesById = new Map(this.species.map((s) => [s.id, s]));
  }

  dateInfo() {
    const day = Math.floor(this.tick / TICKS_PER_DAY);
    return { year: Math.floor(day / DAYS_PER_YEAR) + 1, day: (day % DAYS_PER_YEAR) + 1, dayFrac: (this.tick % TICKS_PER_DAY) / TICKS_PER_DAY };
  }
  avgGen() { if (!this.creatures.length) return 0; let s = 0; for (const c of this.creatures) s += c.gen; return s / this.creatures.length; }
}

function hsl(h) {
  const s = 0.7, l = 0.55, k = (n) => (n + h * 12) % 12, a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}
