// Chapter 4 "The great raid": one segment per group of narration lines. Uses engine.js.
Object.assign(C, {
  gen: { deel: '#3f6fa8', sash: '#c0392b', hat: 'tall', hatC: '#e8dcc0', hatT: '#2c3e50', beard: 1, must: 1, hair: '#e6e6e6', s: 1.15, mh: 380 },
  shah: { deel: '#6c3483', sash: '#1e8449', hat: 'turban', hatC: '#f5eed8', hatT: '#c0392b', beard: 1, hair: '#141414', skin: '#d9a273', s: 1.08, mh: 380 },
  mon: { deel: '#6e2c00', sash: '#c0392b', hat: 'fur', hatC: '#2b2b2b', hatT: '#922b21', must: 1, hair: '#1a1a1a', skin: '#d4a06e', s: 1.0 },
  mon2: { deel: '#5d6d7e', sash: '#e67e22', hat: 'fur', hatC: '#5d4037', hatT: '#2b2b2b', hair: '#2a1a10', skin: '#c98f60', s: .98 },
  jebe: { deel: '#5d6d7e', sash: '#e67e22', hat: 'fur', hatC: '#f5f5f5', hatT: '#1abc9c', must: 1, hair: '#1a1a1a', s: 1.02, skin: '#c98f60' },
  sub: { deel: '#7b3a1a', sash: '#1a1a1a', hat: 'fur', hatC: '#3a3a3a', hatT: '#6e1f18', must: 1, fat: 1, hair: '#1a1a1a', s: 1.08, skin: '#c98f60' },
  rus1: { deel: '#b03a2e', sash: '#f1c40f', hat: 'rus', beard: 1, fat: 1, hair: '#8a5a2a', skin: '#f0c8a0', s: 1.1, mh: 380 },
  rus2: { deel: '#c0392b', sash: '#fdfefe', hat: 'rus', beard: 1, hair: '#d9a441', skin: '#f3d0a8', s: 1.05, mh: 380 },
  rus3: { deel: '#922b21', sash: '#2c3e50', hat: 'rus', must: 1, hair: '#5a3b1a', skin: '#e8bf92', s: 1.0 },
  cum: { deel: '#d4ac0d', sash: '#7b241c', hat: 'fur', hatC: '#6e2c00', hatT: '#a04000', must: 1, hair: '#2a1a10', s: 1.0 },
  cum2: { deel: '#e59866', sash: '#1f618d', hat: 'boqta', hatC: '#a04000', long: 1, s: .95, mh: 380 },
  gov: { deel: '#154360', sash: '#f5b041', hat: 'turban', hatC: '#1f618d', hatT: '#f1c40f', beard: 1, fat: 1, hair: '#2a1a10', skin: '#e0b48a', s: 1.1, mh: 380 },
  geo: { deel: '#1e8449', sash: '#f1c40f', hat: 'helmet', must: 1, hair: '#111', skin: '#d9a273', s: 1.0 },
});
const SEGS = [], GEO = window.GEO, G3 = window.GEO3; let MAPN = 0;
function S(a, b, build, focus = [960, 640]) { const g = el('g', { display: 'none' }, STAGE), cam = el('g', {}, g), ui = el('g', {}, g); const bs = a === 0 ? 0 : TL.starts[a] - .1, be = b === N - 1 ? TL.end : TL.starts[b + 1] - .1; SEGS.push({ g, cam, ui, bs, be, focus, upd: build(cam, ui, k => TL.starts[k] - bs) }); }
const OR = { fill: '#ff6a00', stroke: '#1a1a1a', tc: '#fff4e6' };
const RED = '#e2362b', GREY = '#9aa0a6';
function ride(h, t, x, y, s = 1, flip = 1, mv = true, amp = 26) { const by = h.gallop(t, 8, mv ? amp : 0, mv); h.place(x, y, s, flip, 0, by); if (h.rider) h.rider.place(-8, -182 + 100 * (h.rider.o.s || 1), 1, 1, 0, by * .3); return by; }
function stand(p, x, y, s = 1, flip = 1, st = 'n', bob = 0) { p.place(x, y, s, flip, 0, bob); p.walk(0, 9, 0, false); p.face(st); }
function walkP(p, t, x, y, s = 1, flip = 1, st = 'n') { const b = p.walk(t, 9, 22); p.place(x, y, s, flip, 0, b); p.face(st); }
function yearG(u) { const g = mk(u, '<rect x="-140" y="-56" width="280" height="104" rx="14" fill="#111" stroke="#fff" stroke-width="5"/><text class="t" x="0" y="28" text-anchor="middle" font-size="78" fill="#ffd84a"></text>', { opacity: 0 }); const tx = g.querySelector('text'); return (lt, a, txt, b = 1e9, x = 1740, y = 96) => { tx.textContent = txt; show(g, lt, a, x, y, 0, b); }; }
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
function mixC(a, b, k) { const A = hx(a), B2 = hx(b); return '#' + A.map((v, i) => Math.round(v + (B2[i] - v) * clamp(k)).toString(16).padStart(2, '0')).join(''); }
const soldier = c => `<g stroke="#1a1a1a" stroke-width="2"><rect x="-6" y="-16" width="12" height="16" fill="${c}"/><circle cy="-21" r="6" fill="#e6b48c"/></g>`;
function tickAt(t, x, y, s, k = 1) { setT(t, x, y + (1 - k) * 80, 2 * Math.sin((window.__T || 0) * 2), s * k, s * k * (1 + .02 * Math.sin((window.__T || 0) * 5))); t.setAttribute('opacity', k > 0.02 ? 1 : 0); }
const ptxt = (u, text, size, fill = '#fff', o = {}) => mk(u, `<text class="t" text-anchor="middle" font-size="${size}" fill="${fill}" style="paint-order:stroke;stroke:#1a1a1a;stroke-width:${o.sw || 8}px;stroke-linejoin:round">${text}</text>`, { opacity: 0 });
// ---- weapons counter (top-left): five dots, n filled ----
function hud(u) {
  const g = mk(u, '', { opacity: 0 }), cs = [], names = ['HORSES', 'THE BOW', 'TRICKS', 'INFORMATION', 'FEAR'];
  mk(g, '<rect x="-60" y="-52" width="470" height="150" rx="16" fill="#111" opacity=".85" stroke="#fff" stroke-width="4"/>');
  for (let i = 0; i < 5; i++) cs.push(mk(g, `<circle r="26" stroke="#fff" stroke-width="4"/><text class="t" y="12" text-anchor="middle" font-size="34" fill="#fff">${i + 1}</text>`));
  const tg = mk(g, '<text class="t" x="0" y="84" font-size="40" fill="#ffd84a"></text>').querySelector('text');
  return (lt, n, a = .2, b = 1e9) => { show(g, lt, a, 100, 70, 0, b); cs.forEach((c, i) => { setT(c, i * 82, 0, 0, i === n - 1 ? 1.18 : 1); c.firstChild.setAttribute('fill', i < n ? (i === n - 1 ? '#ff6a00' : '#a0522d') : '#333'); }); tg.textContent = 'WEAPON ' + n + ': ' + names[n - 1]; };
}
// ---- map (flat world map with Mongol territory, Jin / Western Xia / Khwarezm, red spreading) ----
function mapG3(g) {
  el('rect', { x: -300, y: -300, width: 2520, height: 1680, fill: '#2f63c9' }, g);
  const w = el('g', {}, g), Z = {}, R = {}, ID = ++MAPN;
  el('path', { d: GEO.land, fill: '#f3ad45', stroke: '#1d2b4a', 'stroke-width': 1.6, 'vector-effect': 'non-scaling-stroke' }, w);
  el('path', { d: GEO.borders, fill: 'none', stroke: '#1d2b4a', 'stroke-width': 1, opacity: .3, 'vector-effect': 'non-scaling-stroke' }, w);
  const zc = { song: '#8e44ad', jin: '#d4ac0d', xia: '#1f9d8a', khw: '#2e86c1' };
  for (const k in zc) Z[k] = el('path', { d: G3[k], fill: zc[k], opacity: 0, stroke: '#1a1a1a', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' }, w);
  Z.mon = el('path', { d: GEO.mongolia, fill: '#f3ad45', stroke: '#1a1a1a', 'stroke-width': 4, 'vector-effect': 'non-scaling-stroke' }, w);
  el('path', { d: G3.wall, fill: 'none', stroke: '#6b3e1b', 'stroke-width': 7, 'stroke-dasharray': '16 5', 'vector-effect': 'non-scaling-stroke' }, w);
  const P0 = G3.pts, cen = { jin: [1400, 440], khw: [P0.otrar[0] + 30, P0.otrar[1]] };
  for (const k of ['jin', 'khw']) { const cid = `rc${ID}${k}`; mk(w, `<clipPath id="${cid}"><circle cx="${cen[k][0]}" cy="${cen[k][1]}" r="0"/></clipPath>`); R[k] = { c: w.querySelector(`#${cid} circle`), p: el('path', { d: G3[k], fill: RED, opacity: .88, stroke: '#1a1a1a', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke', 'clip-path': `url(#${cid})` }, w) }; }
  const top = el('g', {}, g), items = [];
  const m = { w, top, Z, cx: 1340, cy: 405, s: 5, items };
  m.S = p => [(p[0] - m.cx) * m.s + 960, (p[1] - m.cy) * m.s + 540];
  m.cam = (cx, cy, s) => { Object.assign(m, { cx, cy, s }); w.setAttribute('transform', `translate(960 540) scale(${s}) translate(${-cx} ${-cy})`); items.forEach(it => { const p = m.S(it.pt); setT(it.g, p[0], p[1] + (it.dy || 0), 0, it.sc || 1); }); };
  m.add = (pt, markup, o = {}) => { const gg = mk(top, markup, { opacity: o.op == null ? 1 : o.op }); items.push({ pt, g: gg, dy: o.dy, sc: o.sc }); return gg; };
  m.zone = (k, v) => Z[k].setAttribute('opacity', clamp(v) * .85);
  m.mon = c => Z.mon.setAttribute('fill', c);
  m.red = (k, r) => { R[k].c.setAttribute('r', Math.max(0, r)); };
  m.label = (txt, pt, size = 34, o = {}) => m.add(pt, `<text class="t big" font-size="${size}" style="stroke-width:9">${txt}</text>`, o);
  m.dot = (pt, name) => { const gg = m.add(pt, `<circle class="dt" r="13" fill="#ffd84a" stroke="#1a1a1a" stroke-width="4"/><text class="t big" y="-24" font-size="30" style="stroke-width:8">${name}</text>`); const d = gg.querySelector('.dt'); return { g: gg, set: (c, sc = 1) => { d.setAttribute('fill', c); d.setAttribute('r', 13 * sc); } }; };
  m.cam(m.cx, m.cy, m.s);
  return m;
}
function arrowG(p) { return mk(p, '<path class="sh" fill="none" stroke="#1a1a1a" stroke-width="22" stroke-linecap="round"/><path class="ln" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/><path class="hd" fill="#fff" stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"/>'); }
function arrowSet(g, A, Bp, k, bend = 60, col = '#fff') {
  const mx = (A[0] + Bp[0]) / 2 - (Bp[1] - A[1]) * bend / 400, my = (A[1] + Bp[1]) / 2 + (Bp[0] - A[0]) * bend / 400, n = 24, pts = [];
  for (let i = 0; i <= n * k; i++) { const u = i / n; pts.push([(1 - u) * (1 - u) * A[0] + 2 * u * (1 - u) * mx + u * u * Bp[0], (1 - u) * (1 - u) * A[1] + 2 * u * (1 - u) * my + u * u * Bp[1]]); }
  g.setAttribute('opacity', k > .02 ? 1 : 0); if (pts.length < 2) return;
  const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'), e = pts[pts.length - 1], q = pts[pts.length - 2], a = Math.atan2(e[1] - q[1], e[0] - q[0]);
  g.querySelector('.sh').setAttribute('d', d); g.querySelector('.ln').setAttribute('d', d); g.querySelector('.ln').setAttribute('stroke', col); g.querySelector('.hd').setAttribute('fill', col);
  const hp = [[30, 0], [-12, -22], [-12, 22]].map(([x, y]) => [e[0] + x * Math.cos(a) - y * Math.sin(a), e[1] + x * Math.sin(a) + y * Math.cos(a)]);
  g.querySelector('.hd').setAttribute('d', 'M' + hp.map(p => p.join(' ')).join('L') + 'Z');
}
// ---- walled city: set(x,y,s) ; flag('#color'|null) ----
function cityG(parent, o = {}) {
  const g = el('g', {}, parent), wc = o.wall || '#cdb48a';
  mk(g, `<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="-230" y="-190" width="460" height="190" fill="${wc}"/>${[-230, -170, -110, -50, 10, 70, 130, 190].map(x => `<rect x="${x}" y="-218" width="40" height="30" fill="${wc}"/>`).join('')}<rect x="-270" y="-300" width="100" height="300" fill="${o.tw || '#b89a66'}"/><rect x="170" y="-300" width="100" height="300" fill="${o.tw || '#b89a66'}"/><path d="M-285 -300 L-220 -380 L-155 -300 Z" fill="${o.roof || '#a93226'}"/><path d="M155 -300 L220 -380 L285 -300 Z" fill="${o.roof || '#a93226'}"/><path d="M-230 -110 H-60 M60 -110 H230" stroke="#9c8358" stroke-width="4"/></g>`);
  const gate = mk(g, '<g stroke="#1a1a1a" stroke-width="5"><path d="M-60 0 L-60 -90 Q0 -150 60 -90 L60 0 Z" fill="#6b4423"/><path d="M0 -122 V0 M-30 -112 V0 M30 -112 V0" fill="none"/></g>');
  const fl = mk(g, '<line x1="0" y1="0" x2="0" y2="-120" stroke="#1a1a1a" stroke-width="8"/><path class="fp" d="M4 -118 L90 -100 L4 -78 Z" fill="#2874a6" stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"/>');
  fl.setAttribute('transform', 'translate(220 -380)');
  const fp = fl.querySelector('.fp');
  return { g, gate, set: (x, y, s = 1) => g.setAttribute('transform', `translate(${x} ${y}) scale(${s})`), flag: (c, k = 1) => { fp.setAttribute('fill', c || '#2874a6'); fl.setAttribute('transform', `translate(220 ${-380 + (1 - k) * 120})`); fl.setAttribute('opacity', k > .02 ? 1 : 0); const w = 6 * Math.sin((window.__T || 0) * 7); fp.setAttribute('d', `M4 -118 Q40 ${-108 + w} 90 -100 Q40 ${-92 - w} 4 -78 Z`); }, gateOpen: k => gate.setAttribute('opacity', 1 - clamp(k) * .85) };
}
const bannerMk = '<line x1="0" y1="0" x2="0" y2="-170" stroke="#4a2f15" stroke-width="8"/><path d="M-4 -170 L-4 -110 L-70 -140 Z" fill="#e2362b" stroke="#1a1a1a" stroke-width="4"/><circle cy="-172" r="9" fill="#f1c40f" stroke="#1a1a1a" stroke-width="3"/>';
// ground dashes scrolling to fake speed
function speedG(g, y0, y1, n = 14, col = '#5a6b32') { const ds = []; for (let i = 0; i < n; i++) ds.push({ p: el('path', { stroke: col, 'stroke-width': 6, 'stroke-linecap': 'round', fill: 'none', opacity: .7 }, g), y: y0 + rnd() * (y1 - y0), o: rnd() * 2000, sp: 900 + rnd() * 600 }); return (t, k = 1) => ds.forEach(d => { const x = 2100 - ((d.o + t * d.sp * k) % 2300); d.p.setAttribute('d', `M${x} ${d.y} h${90 + d.sp * .06}`); }); }
// bow held in left hand (rotated back upright), pose helpers
const bowH = `<g transform="rotate(95) scale(1.5)">${bowMk}</g>`;
function archerPose(p, k) { p.arm('L', -95); p.arm('R', lerp(70, -40, k)); }
//@@PART2
