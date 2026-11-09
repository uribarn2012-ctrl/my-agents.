// Live drawing of a creature's neural network (nodes + weights). Labels are HTML (Hebrew-safe).
import { INPUTS, OUTPUTS, NI, NH, NO } from './brain.js';

export class BrainView {
  constructor(container) {
    this.el = container;
    container.innerHTML = '<canvas></canvas><div class="bl-in"></div><div class="bl-out"></div>';
    this.cv = container.querySelector('canvas'); this.ctx = this.cv.getContext('2d');
    this.inL = container.querySelector('.bl-in'); this.outL = container.querySelector('.bl-out');
    this.inL.innerHTML = INPUTS.map((t) => `<span>${t}</span>`).join('');
    this.outL.innerHTML = OUTPUTS.map((t) => `<span>${t}</span>`).join('');
  }
  layout() {
    const w = this.el.clientWidth, h = this.el.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (this.cv.width !== Math.round(w * dpr) || this.cv.height !== Math.round(h * dpr)) {
      this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(h * dpr);
      this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
    }
    return { w, h, dpr };
  }
  draw(c) {
    if (!c) return;
    const { w, h, dpr } = this.layout(); if (!w || !h) return;
    const ctx = this.ctx; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    // RTL: inputs on the right, outputs on the left
    const labW = Math.min(110, w * 0.3);
    const xIn = w - labW - 8, xH = w / 2, xOut = labW * 0.9 + 8;
    const yOf = (i, n) => 8 + (i + 0.5) * ((h - 16) / n);
    // position labels to match rows
    [...this.inL.children].forEach((s, i) => { s.style.top = yOf(i, NI) + 'px'; });
    [...this.outL.children].forEach((s, i) => { s.style.top = yOf(i, NO) + 'px'; });
    this.inL.style.width = labW + 'px'; this.outL.style.width = labW * 0.9 + 'px';
    const W = c.genes.w;
    ctx.lineWidth = 1;
    let k = 0;
    for (let j = 0; j < NH; j++) for (let i = 0; i < NI; i++) {
      const wt = W[k++], sig = Math.abs(c.inp[i] * wt);
      ctx.strokeStyle = (wt > 0 ? 'rgba(90,200,255,' : 'rgba(255,120,90,') + Math.min(0.75, 0.05 + sig * 0.35) + ')';
      ctx.beginPath(); ctx.moveTo(xIn, yOf(i, NI)); ctx.lineTo(xH, yOf(j, NH)); ctx.stroke();
    }
    for (let o = 0; o < NO; o++) {
      for (let j = 0; j < NH; j++) {
        const wt = W[k++], sig = Math.abs(c.hid[j] * wt);
        ctx.strokeStyle = (wt > 0 ? 'rgba(90,200,255,' : 'rgba(255,120,90,') + Math.min(0.85, 0.05 + sig * 0.4) + ')';
        ctx.beginPath(); ctx.moveTo(xH, yOf(j, NH)); ctx.lineTo(xOut, yOf(o, NO)); ctx.stroke();
      }
      k++;
    }
    const node = (x, y, v) => {
      const a = Math.max(-1, Math.min(1, v));
      ctx.fillStyle = a >= 0 ? `rgba(120,220,255,${0.25 + a * 0.75})` : `rgba(255,140,100,${0.25 - a * 0.75})`;
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.stroke();
    };
    for (let i = 0; i < NI; i++) node(xIn, yOf(i, NI), c.inp[i]);
    for (let j = 0; j < NH; j++) node(xH, yOf(j, NH), c.hid[j]);
    for (let o = 0; o < NO; o++) node(xOut, yOf(o, NO), c.out[o]);
  }
}
