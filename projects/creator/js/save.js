// Save / load the world to localStorage.
import { Sim } from './sim.js';
const KEY = 'creator.save.v1';

const f32ToB64 = (a) => { const u = new Uint8Array(a.buffer, a.byteOffset, a.byteLength); let s = ''; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); };
const b64ToF32 = (s) => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return new Float32Array(u.buffer); };
const r4 = (v) => Math.round(v * 1e5) / 1e5;

export function hasSave() { try { return !!localStorage.getItem(KEY); } catch { return false; } }
export function saveInfo() { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && { name: s.name, tick: s.tick, pop: s.creatures.length }; } catch { return null; } }

export function saveGame(name, sim) {
  const cs = sim.creatures;
  const idx = new Map(cs.map((c, i) => [c, i]));
  const food = [];
  for (let i = 0; i < sim.fx.length; i++) if (sim.falive[i]) food.push(r4(sim.fx[i]), r4(sim.fy[i]), r4(sim.fz[i]), Math.round(sim.fe[i]), sim.ft[i]);
  const data = {
    v: 1, name, seed: sim.world.seed, tick: sim.tick, rng: sim.rng.getState(), nextId: sim.nextId, nextSpecies: sim.nextSpecies, stats: sim.stats,
    species: sim.species.map((s) => ({ id: s.id, color: s.color, name: s.name, rep: idx.get(s.rep) ?? -1 })),
    creatures: cs.map((c) => ({ id: c.id, name: c.name, p: [c.x, c.y, c.z].map(r4), h: [c.hx, c.hy, c.hz].map(r4), e: r4(c.energy), a: c.age, l: Math.round(c.lifespan), g: c.gen,
      m: [r4(c.mem0), r4(c.mem1)], cd: c.cooldown, k: c.kids, f: c.eaten, s: c.speciesId,
      G: { size: c.genes.size, speed: c.genes.speed, sense: c.genes.sense, diet: c.genes.diet, hue: c.genes.hue, w: f32ToB64(c.genes.w) } })),
    food,
  };
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) { console.warn('save failed', e); return false; }
}

export function loadSave() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }

export function restoreSim(data, world) {
  const sim = new Sim(world, data.seed);
  sim.tick = data.tick; sim.rng.setState(data.rng); sim.nextId = data.nextId; sim.nextSpecies = data.nextSpecies; Object.assign(sim.stats, data.stats);
  for (let i = 0; i < data.food.length; i += 5) sim.addFood(data.food[i], data.food[i + 1], data.food[i + 2], data.food[i + 3], data.food[i + 4]);
  for (const d of data.creatures) {
    const G = d.G, genes = { size: G.size, speed: G.speed, sense: G.sense, diet: G.diet, hue: G.hue, w: b64ToF32(G.w) };
    const c = sim.addCreature(d.p[0], d.p[1], d.p[2], genes, d.g, d.e);
    sim.nextId--; // addCreature consumed an id; restore exact one
    Object.assign(c, { id: d.id, name: d.name, hx: d.h[0], hy: d.h[1], hz: d.h[2], age: d.a, lifespan: d.l, mem0: d.m[0], mem1: d.m[1], cooldown: d.cd, kids: d.k, eaten: d.f, speciesId: d.s });
  }
  sim.nextId = data.nextId;
  sim.species = data.species.map((s) => ({ id: s.id, color: s.color, name: s.name, count: 0, rep: sim.creatures[s.rep] })).filter((s) => s.rep);
  sim.speciesById = new Map(sim.species.map((s) => [s.id, s]));
  sim.updateSpecies();
  return sim;
}
