// Headless evolution test: node tools/simtest.mjs [seed] [ticks]
import { generateWorld } from '../js/world.js';
import { Sim } from '../js/sim.js';
const seed = +(process.argv[2] || 12345), ticks = +(process.argv[3] || 60000);
const world = generateWorld(seed);
import { P } from '../js/sim.js';
if (process.env.P) Object.assign(P, JSON.parse(process.env.P));
const sim = new Sim(world, seed);
sim.populate(160);
const t0 = Date.now();
const W = 6000;
console.log('ticks  pop  plants species avgGen maxGen | dead in window: life  food/1000t kids  seekFood%');
for (let t = 1; t <= ticks; t++) {
  sim.step();
  if (t % W === 0) {
    const d = sim.deadLog.filter((x) => x.t > t - W);
    const m = (f) => d.length ? d.reduce((s, x) => s + f(x), 0) / d.length : 0;
    console.log(String(t).padStart(6), String(sim.creatures.length).padStart(4), String(sim.fcount).padStart(6), String(sim.species.length).padStart(5),
      sim.avgGen().toFixed(1).padStart(7), String(sim.stats.maxGen).padStart(5), '|', m((x) => x.age).toFixed(0).padStart(6),
      m((x) => x.eaten / Math.max(1, x.age) * 1000).toFixed(1).padStart(8), m((x) => x.kids).toFixed(2).padStart(6), (m((x) => x.toward) * 100).toFixed(1).padStart(8));
    if (!sim.creatures.length) { console.log('EXTINCT'); break; }
  }
}
console.log('ms per tick', ((Date.now() - t0) / ticks).toFixed(3));
