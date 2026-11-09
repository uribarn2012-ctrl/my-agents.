// DOM helpers for the HUD, toasts, creature panel and knowledge log (all Hebrew text lives in HTML, not canvas).
import { BrainView } from './brainView.js';
import { YEAR, bodyTraits } from './sim.js';

export const $ = (id) => document.getElementById(id);
let toastTimer = 0;
const queue = [];
export function toast(msg, ms = 2200) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.classList.remove('show'); toastTimer = 0; setTimeout(nextToast, 350); }, ms);
}
function nextToast() { if (toastTimer || !queue.length) return; const [m, ms] = queue.shift(); toast(m, ms); }
// queued toasts (natural events, milestones) so they don't overwrite each other; keep the queue short
export function queueToast(msg, ms = 2600) { queue.push([msg, ms]); while (queue.length > 3) queue.shift(); nextToast(); }
export function flash() { const f = $('flash'); f.style.transition = 'none'; f.style.opacity = '0.55'; requestAnimationFrame(() => { f.style.transition = 'opacity 0.4s'; f.style.opacity = '0'; }); }
export function showLoading(on, text = 'יוצר עולם…') { $('loading').hidden = !on; $('loadingText').textContent = text; }
export const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

const SEASON_ICON = ['🌱', '☀️', '🍂', '❄️'];
export function updateHud(name, sim, G) {
  const d = sim.dateInfo();
  $('hudName').textContent = name;
  $('hudDate').textContent = `שנה ${d.year} · ${SEASON_ICON[d.season]} ${d.seasonName}`;
  $('hudPop').textContent = sim.creatures.length;
  $('hudGen').textContent = sim.stats.maxGen;
  $('hudSpecies').textContent = sim.species.length;
  $('hudNests').textContent = sim.nests.length;
  const a = $('speedReal');
  if (G && G.speed > 1 && G.achieved < G.speed * 0.85) { a.hidden = false; a.textContent = `בפועל ×${Math.max(1, Math.round(G.achieved))}`; }
  else a.hidden = true;
}

export function showLog(sim) {
  if (!sim) return;
  const box = $('logList');
  const items = [...sim.log].reverse();
  box.innerHTML = items.length ? items.map((e) => `<li class="${e.kind}"><span class="lg-t">שנה ${Math.floor(e.t / YEAR) + 1}</span><span>${e.icon} ${e.text}</span></li>`).join('')
    : '<li>עדיין לא קרה שום דבר מיוחד. חכה קצת…</li>';
  $('logBox').hidden = false;
}

const pct = (v) => Math.round(v * 100);
const yrs = (t) => (t / YEAR).toFixed(1);
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
    $('pSub').textContent = `${sp ? 'מין ' + sp.name + ' · ' : ''}דור ${c.gen}` + (c.alive ? '' : ` · סיבת מוות: ${c.cause}`);
    $('pBody').textContent = '🧬 צורת הגוף: ' + bodyTraits((sp ? sp.rep : c).genes);
    const g = c.genes, maxE = 100 * g.size, diet = g.diet < 0.33 ? 'צמחוני' : g.diet < 0.66 ? 'אוכל-כל' : 'טורף';
    $('pStats').innerHTML = `
      <div>אנרגיה<b>${Math.max(0, Math.round(c.energy))}/${Math.round(maxE)}</b><span class="bar"><i style="width:${pct(Math.max(0, c.energy) / maxE)}%"></i></span></div>
      <div>גיל (שנים)<b>${yrs(c.age)} מתוך ${yrs(c.lifespan)}</b><span class="bar"><i style="width:${pct(Math.min(1, c.age / c.lifespan))}%;background:#ffd36b"></i></span></div>
      <div>גן אריכות ימים<b>×${g.life.toFixed(2)}</b></div>
      <div>גודל<b>${g.size.toFixed(2)}</b></div>
      <div>מהירות<b>${g.speed.toFixed(2)}</b></div>
      <div>טווח חושים<b>${g.sense.toFixed(2)}</b></div>
      <div>תזונה<b>${diet}</b></div>
      <div>צאצאים<b>${c.kids}</b></div>
      <div>קנים שבנה<b>${c.built}</b></div>`;
    this.brain.draw(c);
  }
}
