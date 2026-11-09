// DOM helpers for the HUD and creature panel (all Hebrew text lives in HTML, not canvas).
import { BrainView } from './brainView.js';
import { TICKS_PER_DAY } from './sim.js';

export const $ = (id) => document.getElementById(id);
let toastTimer = 0;
export function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200); }
export function flash() { const f = $('flash'); f.style.transition = 'none'; f.style.opacity = '0.55'; requestAnimationFrame(() => { f.style.transition = 'opacity 0.4s'; f.style.opacity = '0'; }); }
export function showLoading(on, text = 'יוצר עולם…') { $('loading').hidden = !on; $('loadingText').textContent = text; }
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

export function updateHud(name, sim) {
  const d = sim.dateInfo();
  $('hudName').textContent = name;
  $('hudDate').textContent = `שנה ${d.year} · יום ${d.day}`;
  $('hudPop').textContent = sim.creatures.length;
  $('hudGen').textContent = sim.stats.maxGen;
  $('hudSpecies').textContent = sim.species.length;
}

const pct = (v) => Math.round(v * 100);
export class CreaturePanel {
  constructor() { this.brain = new BrainView($('pBrain')); this.c = null; this.n = 0; }
  open(c) { this.c = c; $('panel').hidden = false; this.n = 0; this.update(null, true); }
  close() { this.c = null; $('panel').hidden = true; }
  update(sim, force) {
    const c = this.c; if (!c) return;
    if (!force && this.n++ % 6) { this.brain.draw(c); return; }
    const sp = sim?.speciesById?.get(c.speciesId);
    const col = sp ? sp.color : [0.8, 0.8, 0.8];
    $('pDot').style.background = $('pDot').style.color = `rgb(${col.map((v) => Math.round(v * 255)).join(',')})`;
    $('pName').textContent = c.name + (c.alive ? '' : ' (מת)');
    const days = (c.age / TICKS_PER_DAY).toFixed(1);
    $('pSub').textContent = `${sp ? 'מין ' + sp.name + ' · ' : ''}דור ${c.gen} · גיל ${days} ימים` + (c.alive ? '' : ` · סיבת מוות: ${c.cause}`);
    const g = c.genes, maxE = 100 * g.size, diet = g.diet < 0.33 ? 'צמחוני' : g.diet < 0.66 ? 'אוכל-כל' : 'טורף';
    $('pStats').innerHTML = `
      <div>אנרגיה<b>${Math.max(0, Math.round(c.energy))}/${Math.round(maxE)}</b><span class="bar"><i style="width:${pct(Math.max(0, c.energy) / maxE)}%"></i></span></div>
      <div>גודל<b>${g.size.toFixed(2)}</b></div>
      <div>מהירות<b>${g.speed.toFixed(2)}</b></div>
      <div>טווח חושים<b>${g.sense.toFixed(2)}</b></div>
      <div>תזונה<b>${diet}</b></div>
      <div>צאצאים<b>${c.kids}</b></div>`;
    this.brain.draw(c);
  }
}
