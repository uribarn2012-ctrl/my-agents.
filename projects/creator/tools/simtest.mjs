// Headless evolution test, zero player actions: node tools/simtest.mjs [seed] [years]
import { generateWorld } from '../js/world.js';
import { Sim, P, YEAR } from '../js/sim.js';
const seed = +(process.argv[2] || 12345), years = +(process.argv[3] || 150);
if (process.env.P) Object.assign(P, JSON.parse(process.env.P));
const world = generateWorld(seed);
const sim = new Sim(world, seed);
sim.populate(160);
const t0 = Date.now();
const W = 10 * YEAR, ticks = years * YEAR;
let minPop = 1e9, nestsMax = 0;
const f1 = (v) => v.toFixed(1);
console.log(`seed ${seed}: year   pop  plants  spec  avgGen maxGen | nests built/10y builders% | deathAge(y) maxLife(y) lifeGene starve% old% | rescues events`);
for (let t = 1; t <= ticks; t++) {
  sim.step();
  minPop = Math.min(minPop, sim.creatures.length); nestsMax = Math.max(nestsMax, sim.nests.length);
  if (t % W === 0) {
    const d = sim.deadLog.filter((x) => x.t > t - W);
    const m = (f) => d.length ? d.reduce((s, x) => s + f(x), 0) / d.length : 0;
    const cs = sim.creatures, lifeGene = cs.length ? cs.reduce((s, c) => s + c.genes.life, 0) / cs.length : 0;
    const maxLife = cs.length ? cs.reduce((s, c) => s + c.lifespan, 0) / cs.length / YEAR : 0;
    const builtWin = sim.stats.nestsBuilt - (sim._lastBuilt || 0); sim._lastBuilt = sim.stats.nestsBuilt;
    const builders = d.length ? d.filter((x) => x.built > 0).length / d.length * 100 : 0;
    console.log(String(t / YEAR).padStart(13), String(cs.length).padStart(5), String(sim.fcount).padStart(7), String(sim.species.length).padStart(5),
      f1(sim.avgGen()).padStart(7), String(sim.stats.maxGen).padStart(6), '|', String(sim.nests.length).padStart(5), String(builtWin).padStart(10), f1(builders).padStart(9), '|',
      f1(m((x) => x.age) / YEAR).padStart(11), f1(maxLife).padStart(10), lifeGene.toFixed(2).padStart(8), f1(m((x) => x.cause === 'רעב') * 100).padStart(7), f1(m((x) => x.cause === 'זקנה') * 100).padStart(5),
      '|', String(sim.stats.rescues).padStart(7), String(sim.log.filter((e) => e.kind === 'event').length).padStart(6));
  }
}
const ms = (Date.now() - t0) / ticks;
console.log(`min pop ${minPop}, max nests ${nestsMax}, nests built total ${sim.stats.nestsBuilt}, ms/tick ${ms.toFixed(3)}`);
console.log('log sample:', sim.log.slice(0, 8).map((e) => `${Math.floor(e.t / YEAR) + 1}: ${e.icon} ${e.text}`).join(' | '));
