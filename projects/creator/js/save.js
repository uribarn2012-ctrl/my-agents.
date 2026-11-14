// Save / load the world to localStorage. Version 2 (body genes, lifespan gene, nests, knowledge log).
// Older saves (v1) don't fit the new rules: they are ignored (and removed), never loaded.
import { Sim, BODY_KEYS } from './sim.js';
const KEY = 'creator.save.v2', OLD_KEYS = ['creator.save.v1'], VERSION = 2;

const f32ToB64 = (a) => { const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); };
const b64ToF32 = (s) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new Float32Array(u.buffer); };
const r4 = (v) => Math.round(v * 1e5) / 1e5;
const r3 = (v) => Math.round(v * 1e3) / 1e3;

try { for (const k of OLD_KEYS) localStorage.removeItem(k); } catch { /* storage blocked */ }

const genesOut = (g) => ({ size: g.size, speed: g.speed, sense: g.sense, diet: g.diet, hue: g.hue, life: g.life, b: BODY_KEYS.map((k) => r3(g.body[k])), w: f32ToB64(g.w) });
const genesIn = (G) => { const body = {}; BODY_KEYS.forEach((k, i) => (body[k] = G.b[i])); return { size: G.size, speed: G.speed, sense: G.sense, diet: G.diet, hue: G.hue, life: G.life, body, w: b64ToF32(G.w) }; };

export function loadSave() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === VERSION && Array.isArray(s.creatures) ? s : null; } catch { return null; }
}
export function hasSave() { return !!loadSave(); }
export function saveInfo() { const s = loadSave(); return s && { name: s.name, tick: s.tick, pop: s.creatures.length }; }

export function saveGame(name, sim) {
  if (!sim) return false;
  const cs = sim.creatures;
  const idx = new Map(cs.map((c, i) => [c, i]));
  const food = [];
  for (let i = 0; i < sim.fx.length; i++) if (sim.falive[i]) food.push(r4(sim.fx[i]), r4(sim.fy[i]), r4(sim.fz[i]), Math.round(sim.fe[i]), sim.ft[i]);
  const data = {
    v: VERSION, name, seed: sim.world.seed, tick: sim.tick, rng: sim.rng.getState(), nextId: sim.nextId, nextSpecies: sim.nextSpecies, nextNestId: sim.nextNestId,
    stats: sim.stats, flags: sim.flags, log: sim.log, regions: sim.regions, nextEvent: sim.nextEvent, lastRescue: sim.lastRescue,
    species: sim.species.map((s) => ({ id: s.id, color: s.color, name: s.name, rep: idx.get(s.rep) ?? -1 })),
    creatures: cs.map((c) => ({ id: c.id, name: c.name, p: [c.x, c.y, c.z].map(r4), h: [c.hx, c.hy, c.hz].map(r4), e: r4(c.energy), a: c.age, l: c.lifespan, mt: c.maturity, g: c.gen,
      m: [r4(c.mem0), r4(c.mem1)], cd: c.cooldown, k: c.kids, f: c.eaten, bt: c.built, s: c.speciesId, G: genesOut(c.genes) })),
    nests: sim.nests.map((n) => [n.id, r4(n.x), r4(n.y), r4(n.z), n.sp, r3(n.hp), n.built]),
    bank: sim.bank.slice(-20).map((b) => ({ gen: b.gen, score: b.score, G: genesOut(b.genes) })),
    food,
  };
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { console.warn('save failed', e); return false; }
}

export function restoreSim(data, world) {
  const sim = new Sim(world, data.seed);
  sim.tick = data.tick; sim.rng.setState(data.rng); sim.nextSpecies = data.nextSpecies; Object.assign(sim.stats, data.stats);
  sim.flags = data.flags || {}; sim.log = data.log || []; sim.regions = data.regions || []; sim.nextEvent = data.nextEvent ?? sim.tick + 1000; sim.lastRescue = data.lastRescue ?? -9999;
  for (let i = 0; i < data.food.length; i += 5) sim.addFood(data.food[i], data.food[i + 1], data.food[i + 2], data.food[i + 3], data.food[i + 4]);
  for (const d of data.creatures) {
    const c = sim.addCreature(d.p[0], d.p[1], d.p[2], genesIn(d.G), d.g, d.e);
    Object.assign(c, { id: d.id, name: d.name, hx: d.h[0], hy: d.h[1], hz: d.h[2], age: d.a, lifespan: d.l, maturity: d.mt, mem0: d.m[0], mem1: d.m[1], cooldown: d.cd, kids: d.k, eaten: d.f, built: d.bt || 0, speciesId: d.s });
  }
  sim.nextId = data.nextId;
  for (const n of data.nests || []) sim.addNest(n[1], n[2], n[3], n[4], n[5], n[0], n[6]);
  sim.nextNestId = data.nextNestId || sim.nests.length + 1;
  sim.bank = (data.bank || []).map((b) => ({ gen: b.gen, score: b.score, genes: genesIn(b.G) }));
  sim.species = data.species.map((s) => ({ id: s.id, color: s.color, name: s.name, count: 0, rep: sim.creatures[s.rep] })).filter((s) => s.rep);
  sim.speciesById = new Map(sim.species.map((s) => [s.id, s]));
  sim.updateSpecies();
  return sim;
}
