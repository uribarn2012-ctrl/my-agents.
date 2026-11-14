// Chapter 2 "One people" engine (copied from ch1). render(t) draws the frame at time t (seconds). 1920x1080 only.
const NS = 'http://www.w3.org/2000/svg';
const TL = window.TL; // {starts, durs, end}
const $ = id => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lin = (t, a, b) => clamp((t - a) / (b - a));
const easeIO = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const easeOut = x => 1 - Math.pow(1 - x, 3);
const backOut = x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
function el(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function mk(parent, markup, attrs = {}) { const g = el('g', attrs, parent); g.innerHTML = markup; return g; }
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const tr = (x, y, r = 0, sx = 1, sy = sx) => `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${r.toFixed(2)}) scale(${sx.toFixed(3)} ${sy.toFixed(3)})`;
const setT = (n, x, y, r = 0, sx = 1, sy = sx) => n.setAttribute('transform', tr(x, y, r, sx, sy));
const vis = (n, v) => n.setAttribute('display', v ? 'inline' : 'none');
const lerp = (a, b, k) => a + (b - a) * k;
const pop = (t, a, dur = .35) => t < a ? 0 : backOut(lin(t, a, a + dur));
const sgn = Math.sign;

// ---------- sky gradients ----------
const SKY = { day: ['#7fbfea', '#e6f4fa'], dusk: ['#6a4c93', '#f4a259'], night: ['#0b1130', '#2c3370'], grey: ['#58687f', '#b3bdc6'], storm: ['#222838', '#6c7684'], dawn: ['#f2956b', '#ffe7b0'], warm: ['#8fcdf2', '#fff1d0'] };
let dd = '';
for (const k in SKY) dd += `<linearGradient id="sk_${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKY[k][0]}"/><stop offset="1" stop-color="${SKY[k][1]}"/></linearGradient>`;
dd += '<radialGradient id="gSun"><stop offset="0" stop-color="#fff6c0" stop-opacity=".9"/><stop offset="1" stop-color="#ffe27a" stop-opacity="0"/></radialGradient>';
dd += '<radialGradient id="gFire"><stop offset="0" stop-color="#ffb347" stop-opacity=".85"/><stop offset="1" stop-color="#ff7a00" stop-opacity="0"/></radialGradient>';
dd += '<radialGradient id="gHalo"><stop offset="0" stop-color="#fff2a8" stop-opacity=".95"/><stop offset="1" stop-color="#ffd84a" stop-opacity="0"/></radialGradient>';
$('defs').innerHTML = dd;
const HD = ['#a9b676', '#97a854', '#82963f'], HDUSK = ['#8a6a7a', '#7a6248', '#586235'], HNIGHT = ['#1b2238', '#202c40', '#233f38'], HGREY = ['#8a967f', '#788a5d', '#697b47'], HSTORM = ['#4a5560', '#46523f', '#3d4a32'], HDAWN = ['#b39a6a', '#a3a05a', '#8a9a48'];

// ---------- scenery ----------
function buildGrass(g, n, y0, y1, color, h) {
  const blades = [];
  for (let i = 0; i < n; i++) { const x = rnd() * 2000 - 40, y = y0 + rnd() * (y1 - y0), hh = h * (0.6 + rnd() * 0.8); blades.push({ p: el('path', { stroke: color, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, g), x, y, hh, ph: rnd() * 6 }); }
  return blades;
}
function swayGrass(bl, t, amp) { for (const b of bl) { const s = Math.sin(t * 2.2 + b.ph + b.x * .004) * amp + amp * .6; b.p.setAttribute('d', `M${b.x} ${b.y} Q${b.x + s * .4} ${b.y - b.hh * .6} ${b.x + s} ${b.y - b.hh}`); } }
function scenery(g, o = {}) {
  const h = o.h || 650, col = o.hill || HD, sky = o.sky || 'day';
  el('rect', { x: -100, y: -100, width: 2120, height: 1300, fill: `url(#sk_${sky})` }, g);
  const stars = [];
  if (sky === 'night' || o.stars) for (let i = 0; i < 60; i++) stars.push({ e: el('circle', { cx: rnd() * 1920, cy: rnd() * h * .85, r: 1 + rnd() * 2, fill: '#fff' }, g), ph: rnd() * 6 });
  if (o.sun) { el('circle', { cx: o.sun[0], cy: o.sun[1], r: 160, fill: 'url(#gSun)' }, g); el('circle', { cx: o.sun[0], cy: o.sun[1], r: 58, fill: o.sunC || '#fff3b0' }, g); }
  if (o.moon) { el('circle', { cx: o.moon[0], cy: o.moon[1], r: 130, fill: 'url(#gSun)', opacity: .6 }, g); el('circle', { cx: o.moon[0], cy: o.moon[1], r: 50, fill: '#f4f1de' }, g); el('circle', { cx: o.moon[0] + 16, cy: o.moon[1] - 10, r: 11, fill: '#d8d4be' }, g); }
  const clouds = [], cn = o.clouds == null ? 4 : o.clouds;
  for (let i = 0; i < cn; i++) clouds.push({ c: mk(g, `<ellipse cx="0" cy="0" rx="150" ry="40" fill="${o.cloudC || '#fff'}"/><ellipse cx="60" cy="-24" rx="90" ry="44" fill="${o.cloudC || '#fff'}"/><ellipse cx="-70" cy="-12" rx="70" ry="34" fill="${o.cloudC || '#fff'}"/>`, { opacity: o.cloudO || .85 }), x: rnd() * 2300, y: 70 + rnd() * h * .4, s: .6 + rnd() * .8, sp: 6 + rnd() * 10 });
  el('path', { d: `M-100 ${h - 70} Q300 ${h - 140} 700 ${h - 70} T1500 ${h - 80} T2100 ${h - 60} L2100 1200 L-100 1200 Z`, fill: col[0] }, g);
  el('path', { d: `M-100 ${h - 10} Q400 ${h - 70} 900 ${h - 10} T1900 ${h - 25} T2100 ${h - 10} L2100 1200 L-100 1200 Z`, fill: col[1] }, g);
  el('path', { d: `M-100 ${h + 40} Q500 ${h - 10} 1000 ${h + 30} T2100 ${h + 20} L2100 1200 L-100 1200 Z`, fill: col[2] }, g);
  const gg = el('g', {}, g), grass = buildGrass(gg, o.grass || 90, h + 50, 1080, o.grassC || '#6d7a45', 30);
  const wind = [];
  if (o.wind) for (let i = 0; i < 9; i++) wind.push({ p: el('path', { stroke: '#fff', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, g), y: 150 + rnd() * 600, ph: rnd() * 10, sp: 300 + rnd() * 250 });
  return t => {
    for (const c of clouds) setT(c.c, ((c.x + t * c.sp) % 2500) - 300, c.y, 0, c.s);
    swayGrass(grass, t, 7);
    for (const s of stars) s.e.setAttribute('opacity', (.55 + .45 * Math.sin(t * 2 + s.ph)).toFixed(2));
    for (const w of wind) { const x = ((t * w.sp + w.ph * 300) % 2400) - 240; w.p.setAttribute('d', `M${x} ${w.y} q60 -14 130 0 t120 0`); w.p.setAttribute('opacity', (.45 * Math.sin(Math.PI * clamp((x + 240) / 2400))).toFixed(2)); }
  };
}

// ---------- characters ----------
function personSVG(o) {
  const k = o.k || (o.kid ? 1.3 : 1), sk = o.skin || '#e6b48c', dl = o.deel || '#3f6fa8', sh = o.sash || '#c0392b', pn = o.pants || '#2f3b4c', bt = o.boot || '#3b2a1e', hr = o.hair || '#1a1a1a', hc = o.hatC || '#7a4a2a', ht = o.hatT || '#c0392b', trm = o.trim || '#f1d9a0';
  const hem = o.long ? -24 : -62, hw = o.fat ? 70 : o.long ? 60 : 50, tw = o.fat ? 56 : 40, wAt = y => 40 + (hw - 40) * ((y + 172) / (hem + 172));
  let s = '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">';
  s += `<g class="legL"><rect x="-23" y="-100" width="20" height="92" fill="${pn}"/><rect x="-29" y="-14" width="32" height="14" rx="6" fill="${bt}"/></g>`;
  s += `<g class="legR"><rect x="3" y="-100" width="20" height="92" fill="${pn}"/><rect x="-3" y="-14" width="32" height="14" rx="6" fill="${bt}"/></g>`;
  s += `<rect class="skin" x="-11" y="-192" width="22" height="24" fill="${sk}"/>`;
  s += `<path d="M${-tw} -172 L${tw} -172 L${hw} ${hem} L${-hw} ${hem} Z" fill="${dl}"/><path d="M-14 -172 L22 ${hem + 10}" fill="none" stroke-width="4"/>`;
  const lg = (dx, far) => `<path d="M${dx} -100 L${dx + 46} -56 L${dx + 22} 8" fill="none" stroke="#1a1a1a" stroke-width="28"/><path d="M${dx} -100 L${dx + 46} -56 L${dx + 22} 8" fill="none" stroke="${pn}" stroke-width="19"/>${far ? `<path d="M${dx} -100 L${dx + 46} -56 L${dx + 22} 8" fill="none" stroke="#000" stroke-opacity=".28" stroke-width="19"/>` : ''}<rect x="${dx + 8}" y="0" width="34" height="15" rx="7" fill="${bt}"/>`;
  const sw = wAt(-116) - 2; s += `<rect x="${-sw}" y="-124" width="${2 * sw}" height="16" fill="${sh}" stroke-width="4"/><rect x="-16" y="-178" width="32" height="12" rx="4" fill="${trm}" stroke-width="4"/>`;
  if (o.cross) s += `<path d="M-16 -170 Q0 -140 16 -170" fill="none" stroke="#f1c40f" stroke-width="3"/><path d="M0 -150 V-128 M-8 -142 H8" stroke-width="9"/><path d="M0 -150 V-128 M-8 -142 H8" stroke="#f7dc6f" stroke-width="4"/>`;
  s += `<g class="rl" display="none">${lg(-12, 1)}${lg(4, 0)}</g>`;
  s += `<g class="armL"><rect x="-50" y="-172" width="22" height="80" rx="10" fill="${dl}"/><circle class="skin" cx="-39" cy="-90" r="12" fill="${sk}"/><g transform="translate(-39 -90)">${o.holdL || ''}</g></g>`;
  s += `<g class="armR"><rect x="28" y="-172" width="22" height="80" rx="10" fill="${dl}"/><circle class="skin" cx="39" cy="-90" r="12" fill="${sk}"/><g transform="translate(39 -90)">${o.holdR || ''}</g></g>`;
  if (o.cangue) s += `<g class="cg"><rect x="-84" y="-190" width="168" height="38" rx="8" fill="#a0703c"/><path d="M-70 -178 H70 M-70 -165 H70" stroke="#7a5128" stroke-width="3" fill="none"/><circle cx="0" cy="-186" r="14" fill="${sk}" class="skin"/><circle cx="-64" cy="-171" r="13" fill="#4a2f15"/><circle cx="-64" cy="-171" r="9" fill="${sk}" class="skin"/><circle cx="64" cy="-171" r="13" fill="#4a2f15"/><circle cx="64" cy="-171" r="9" fill="${sk}" class="skin"/></g>`;
  s += `<g class="head" transform="translate(0 -214) scale(${k})"><circle class="skin" r="34" fill="${sk}"/>`;
  if (o.beard) s += `<path d="M-31 6 Q-36 52 0 58 Q36 52 31 6 Q16 30 0 28 Q-16 30 -31 6 Z" fill="${hr}"/>`;
  s += `<ellipse cx="-24" cy="14" rx="8" ry="5" fill="#e89a86" stroke="none"/><ellipse cx="24" cy="14" rx="8" ry="5" fill="#e89a86" stroke="none"/>`;
  s += `<g class="eN"><ellipse cx="-12" cy="2" rx="5" ry="7.5" fill="#1a1a1a" stroke="none"/><ellipse cx="12" cy="2" rx="5" ry="7.5" fill="#1a1a1a" stroke="none"/></g><g class="eW" display="none"><ellipse cx="-12" cy="2" rx="8" ry="10" fill="#fff" stroke-width="3"/><ellipse cx="12" cy="2" rx="8" ry="10" fill="#fff" stroke-width="3"/><circle cx="-12" cy="3" r="3.2" fill="#1a1a1a" stroke="none"/><circle cx="12" cy="3" r="3.2" fill="#1a1a1a" stroke="none"/></g><g class="eH" display="none"><path d="M-18 5 Q-12 -4 -6 5 M6 5 Q12 -4 18 5" stroke-width="4" fill="none"/></g><g class="eX" display="none"><path d="M-18 -4 l12 12 M-6 -4 l-12 12 M6 -4 l12 12 M18 -4 l-12 12" stroke-width="4" fill="none"/></g>`;
  const brow = (d, w) => `<path d="${d}" stroke="#efe3c8" stroke-width="${w + 5}" fill="none"/><path d="${d}" stroke-width="${w}" fill="none"/>`;
  const BR = `<g class="bN">${brow('M-20 -12 L-6 -14 M6 -14 L20 -12', 4)}</g><g class="bA" display="none">${brow('M-22 -17 L-5 -8 M22 -17 L5 -8', 5)}</g><g class="bS" display="none">${brow('M-22 -8 L-6 -17 M22 -8 L6 -17', 4)}</g><g class="bF" display="none">${brow('M-22 -18 L-6 -25 M22 -18 L6 -25', 4)}</g><g class="bD" display="none">${brow('M-21 -16 L-6 -9 M21 -16 L6 -9', 6)}</g>`;
  s += `<path class="mS" d="${o.flat ? 'M-9 19 L9 19' : 'M-10 16 Q0 25 10 16'}" fill="none" stroke-width="4"/><path class="mF" display="none" d="M-9 20 L9 20" fill="none" stroke-width="4"/><path class="mD" display="none" d="M-10 24 Q0 13 10 24" fill="none" stroke-width="4"/><ellipse class="mO" display="none" cx="0" cy="19" rx="8" ry="9" fill="#7a1f1f" stroke-width="4"/><g class="mT" display="none"><path d="M-14 26 Q0 6 14 26 Q0 21 -14 26 Z" fill="#fff" stroke-width="3"/><path d="M-5 17 V21 M0 14 V19 M5 17 V21" stroke-width="2"/></g><path class="mK" display="none" d="M-10 20 Q2 22 12 12" fill="none" stroke-width="4"/><path class="mC" display="none" d="M-11 19 l4 -4 l4 8 l4 -8 l4 8 l4 -4" fill="none" stroke-width="3.5"/>`;
  s += `<g class="fC" display="none"><ellipse cx="-24" cy="14" rx="9" ry="6" fill="#6aa9ff" opacity=".8" stroke="none"/><ellipse cx="24" cy="14" rx="9" ry="6" fill="#6aa9ff" opacity=".8" stroke="none"/><g class="pf" stroke="none"></g></g>`;
  if (o.must) s += `<path d="M-24 13 Q-12 4 0 12 Q12 4 24 13 Q12 21 0 15 Q-12 21 -24 13 Z" fill="${hr}" stroke-width="3"/>`;
  const H = o.hat || 'hair';
  if (H === 'temu') s += `<path d="M-36 -10 Q-38 -56 0 -58 Q38 -56 36 -10 Z" fill="#7a4a2a"/><rect x="-42" y="-26" width="84" height="18" rx="9" fill="#eadcbc"/><path d="M-5 -58 L8 -82 L18 -56" fill="#c0392b" stroke-width="4"/>`;
  else if (H === 'fur') s += `<path d="M-30 -30 Q-24 -66 0 -68 Q24 -66 30 -30 Z" fill="${ht}"/><rect x="-44" y="-36" width="88" height="26" rx="13" fill="${hc}"/>`;
  else if (H === 'tall') s += `<path d="M-32 -30 L-16 -90 L16 -90 L32 -30 Z" fill="${ht}"/><rect x="-44" y="-36" width="88" height="24" rx="12" fill="${hc}"/><circle cx="0" cy="-94" r="9" fill="#c0392b" stroke-width="4"/>`;
  else if (H === 'boqta') s += `<path d="M-36 -8 Q-38 -42 0 -44 Q38 -42 36 -8 Z" fill="${hr}"/><path d="M-34 -6 Q-46 22 -36 52 M34 -6 Q46 22 36 52" stroke="${hr}" stroke-width="11" fill="none"/><rect x="-22" y="-104" width="44" height="72" rx="14" fill="${hc}"/><rect x="-25" y="-52" width="50" height="14" fill="#f1c40f"/>`;
  else if (H === 'braids') s += `<path d="M-37 -8 Q-40 -48 0 -48 Q40 -48 37 -8 Z" fill="${hr}"/><path d="M-34 -6 Q-50 20 -40 52 M34 -6 Q50 20 40 52" stroke="${hr}" stroke-width="12" fill="none"/><circle cx="-40" cy="54" r="8" fill="#e2362b"/><circle cx="40" cy="54" r="8" fill="#e2362b"/><path d="M-26 -42 Q0 -62 26 -42 L22 -34 Q0 -50 -22 -34 Z" fill="${ht}" stroke-width="4"/>`;
  else if (H === 'helmet') s += `<path d="M-38 -6 Q-40 -58 0 -60 Q40 -58 38 -6 Z" fill="#8e9aa6"/><rect x="-42" y="-16" width="84" height="12" rx="6" fill="#5d6b78"/><path d="M-5 -60 L0 -82 L5 -60 Z" fill="#c9d1d8" stroke-width="3"/>`;
  else if (H === 'top') s += `<path d="M-36 -6 Q-40 -52 0 -52 Q40 -52 36 -6 Q20 -30 0 -28 Q-20 -30 -36 -6 Z" fill="${hr}"/><circle cx="0" cy="-62" r="16" fill="${hr}"/><rect x="-10" y="-50" width="20" height="8" fill="#c0392b" stroke-width="3"/>`;
  else if (H === 'wool') s += `<path d="M-36 -8 Q-38 -54 0 -56 Q38 -54 36 -8 Z" fill="#f3e3c3"/><rect x="-40" y="-22" width="80" height="16" rx="8" fill="#e6cfa0"/><circle cx="0" cy="-60" r="10" fill="#f3e3c3"/>`;
  else s += `<path d="M-36 -6 Q-40 -52 0 -52 Q40 -52 36 -6 Q20 -26 0 -24 Q-20 -26 -36 -6 Z" fill="${hr}"/>`;
  return s + BR + '</g></g>';
}
const MARKS = `<g class="m_q" display="none"><circle r="34" fill="#fff" stroke="#1a1a1a" stroke-width="5"/><text class="t" y="18" text-anchor="middle" font-size="52" fill="#1a1a1a">?</text></g>
<g class="m_e" display="none"><circle r="34" fill="#ffd84a" stroke="#1a1a1a" stroke-width="5"/><text class="t" y="18" text-anchor="middle" font-size="52" fill="#d62d20">!</text></g>
<g class="m_s" display="none"><path d="M0 -38 Q32 8 0 34 Q-32 8 0 -38 Z" fill="#6ec6ff" stroke="#1a1a1a" stroke-width="5"/><path d="M-8 4 Q-8 16 2 20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>
<g class="m_a" display="none"><path d="M-28 -10 Q-10 -10 -10 -28 M28 -10 Q10 -10 10 -28 M-28 10 Q-10 10 -10 28 M28 10 Q10 10 10 28" stroke="#e2362b" stroke-width="10" fill="none" stroke-linecap="round"/></g>`;
const MK = { '?': 'm_q', '!': 'm_e', s: 'm_s', a: 'm_a' };
let CURB = -1, PID = 0; const REG = [];
const CKF = ['deel', 'sash', 's', 'hat', 'must', 'hair', 'beard', 'kid', 'long'];
function CK(o) { let best = '?', bs = -1; for (const k in C) { let n = 0; CKF.forEach(f => { if ((C[k][f] || 0) === (o[f] || 0)) n++; }); if (n > bs) { bs = n; best = k; } } return best; }
const FS = { n: ['eN', 'bN', 'mF'], h: ['eN', 'bN', 'mS'], s: ['eN', 'bS', 'mD'], f: ['eW', 'bF', 'mO'], a: ['eN', 'bA', 'mT'], d: ['eN', 'bD', 'mF'], o: ['eN', 'bF', 'mO'], x: ['eX', 'bN', 'mF'], k: ['eN', 'bS', 'mK'], c: ['eN', 'bS', 'mC'], r: ['eH', 'bN', 'mS'] };
const FALL = ['eN', 'eW', 'eH', 'eX', 'bN', 'bA', 'bS', 'bF', 'bD', 'mS', 'mF', 'mD', 'mO', 'mT', 'mC', 'mK'];
function P(parent, o = {}) {
  const g = el('g', {}, parent), b = el('g', {}, g); b.innerHTML = personSVG(o);
  const mg = el('g', {}, g); mg.innerHTML = MARKS;
  const q = s => b.querySelector(s), qa = s => [...b.querySelectorAll(s)];
  const p = { g, b, o, fix: { L: false, R: false }, st: { x: 0, y: 0, S: 1, flip: 1, sx: 1, rot: 0, bob: 0 }, ms: 0, mk: null, ad: { L: 0, R: 0 }, id: (PID++) * 1.7, shv: 0, riding: false, swing: 0 };
  if (CURB >= 0) { p.key = CK(o); (REG[CURB] = REG[CURB] || []).push(p); }
  const legL = q('.legL'), legR = q('.legR'), armL = q('.armL'), armR = q('.armR'), head = q('.head'), cg = q('.cg'), rl = q('.rl'), fC = q('.fC'), pf = q('.pf');
  p.mg = mg; p.head = head; p.armL = armL; p.armR = armR; p.cg = cg;
  const refresh = () => {
    const s = p.st, S = (o.s || 1) * (o.noGS ? 1 : 1.2) * s.S, fx = s.flip * S * s.sx;
    g.setAttribute('transform', `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) scale(${fx.toFixed(3)} ${S.toFixed(3)})`);
    const T = window.__T || 0, shx = p.shv ? Math.sin(T * 47 + p.id) * 1.8 : 0, shy = p.shv ? Math.cos(T * 53 + p.id) : 0;
    b.setAttribute('transform', `translate(${shx.toFixed(1)} ${(shy - s.bob).toFixed(1)}) rotate(${s.rot.toFixed(2)} 0 ${p.riding ? -100 : 0})`);
    if (p.riding) rl.setAttribute('transform', `rotate(${(-s.rot + p.swing).toFixed(2)} 0 -100)`);
    mg.setAttribute('transform', `translate(${o.mx || 46} ${-(o.mh || 310)}) scale(${(.9 * p.ms * s.flip / (S * s.sx)).toFixed(3)} ${(.9 * p.ms / S).toFixed(3)})`);
  };
  p.place = (x, y, s = 1, flip = 1, rot = 0, bob = 0, sx = 1) => { Object.assign(p.st, { x, y, S: s, flip, rot, bob, sx }); refresh(); return p; };
  p.walk = (t, sp = 9, amp = 26, moving = true) => {
    const s = moving ? Math.sin(t * sp) : 0;
    legL.setAttribute('transform', `rotate(${s * amp} -13 -100)`); legR.setAttribute('transform', `rotate(${-s * amp} 13 -100)`);
    if (!p.fix.L) armL.setAttribute('transform', `rotate(${-s * amp * .9} -38 -165)`);
    if (!p.fix.R) armR.setAttribute('transform', `rotate(${s * amp * .9} 38 -165)`);
    return Math.abs(s) * 5;
  };
  p.arm = (side, deg) => { p.ad[side] = deg; p.fix[side] = true; (side === 'L' ? armL : armR).setAttribute('transform', `rotate(${deg} ${side === 'L' ? -38 : 38} -165)`); };
  p.free = side => { p.fix[side] = false; };
  p.skin = c => qa('.skin').forEach(e => e.setAttribute('fill', c));
  p.face = (st, cold) => {
    const f = FS[st] || FS.n; cold = cold || st === 'c';
    FALL.forEach(c => { const e = q('.' + c); if (e) vis(e, f.includes(c)); });
    vis(fC, !!cold); p.shv = cold ? 1 : 0;
    if (cold) { const T = window.__T || 0; let h = ''; for (let i = 0; i < 3; i++) { const k = (T * .9 + i / 3) % 1; h += `<circle cx="${(30 + k * 26).toFixed(1)}" cy="${(24 - k * 18).toFixed(1)}" r="${(4 + k * 7).toFixed(1)}" fill="#fff" opacity="${((1 - k) * .9).toFixed(2)}"/>`; } pf.innerHTML = h; }
    refresh();
  };
  p.setRide = () => { p.riding = true; legL.setAttribute('display', 'none'); legR.setAttribute('display', 'none'); rl.setAttribute('display', 'inline'); refresh(); };
  p.hand = side => { const d = (p.ad[side] || 0) * Math.PI / 180, u = side === 'L' ? -1 : 1; return [u * 38 + u * Math.cos(d) - 75 * Math.sin(d), -165 + u * Math.sin(d) + 75 * Math.cos(d)]; };
  p.toParent = (x, y) => { const s = p.st, S = (o.s || 1) * (o.noGS ? 1 : 1.2) * s.S, r = (p.riding ? s.rot : 0) * Math.PI / 180, c0 = p.riding ? -100 : 0, dy = y - c0, rx = x * Math.cos(r) - dy * Math.sin(r), ry = x * Math.sin(r) + dy * Math.cos(r) + c0; return [s.x + s.flip * S * s.sx * rx, s.y + S * (ry - s.bob)]; };
  p.tilt = d => head.setAttribute('transform', `translate(0 -214) rotate(${d}) scale(${o.k || (o.kid ? 1.3 : 1)})`);
  p.mark = (type, lt, a, bb) => {
    const on = lt >= a && lt <= bb; p.ms = on ? pop(lt, a, .3) * (1 - lin(lt, bb - .15, bb)) : 0;
    for (const k in MK) vis(mg.querySelector('.' + MK[k]), on && k === type);
    refresh();
  };
  p.hold = (side, markup) => { const h = (side === 'L' ? armL : armR).querySelector('g:last-child'); h.innerHTML = markup; };
  p.walk(0, 9, 0, false); p.face('n'); refresh();
  return p;
}
// ---------- horse (+ optional rider) ----------
function H(parent, o = {}) {
  const coat = o.coat || '#8b5a2b', mane = o.mane || '#2b1b10', dk = 'stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"';
  const g = el('g', {}, parent), b = el('g', {}, g);
  const leg = (cls, x) => `<g class="${cls}"><rect x="${x - 9}" y="-100" width="18" height="86" rx="6" fill="${coat}"/><rect x="${x - 11}" y="-18" width="22" height="18" rx="6" fill="#2b1b10"/></g>`;
  mk(b, `<g ${dk}><g class="tail"><path d="M-90 -160 Q-140 -140 -130 -60 Q-110 -110 -86 -130 Z" fill="${mane}"/></g>${leg('h1', -66)}${leg('h3', 54)}</g>`);
  mk(b, `<g ${dk}>${leg('h0', -84)}${leg('h2', 74)}<ellipse cx="0" cy="-132" rx="98" ry="50" fill="${coat}"/><path d="M52 -160 L100 -258 L146 -242 L100 -118 Z" fill="${coat}"/><path d="M62 -168 Q66 -240 96 -262 L108 -250 Q92 -216 88 -150 Z" fill="${mane}"/><ellipse cx="146" cy="-236" rx="46" ry="23" transform="rotate(28 146 -236)" fill="${coat}"/><path d="M96 -256 L100 -288 L118 -258 Z" fill="${coat}"/><circle cx="140" cy="-246" r="5" fill="#1a1a1a" stroke="none"/><ellipse cx="176" cy="-222" rx="6" ry="4" fill="#2b1b10" stroke="none"/>${o.blanket ? `<rect x="-34" y="-180" width="70" height="26" rx="8" fill="${o.blanket}"/>` : ''}</g>`);
  const rg = el('g', {}, b);
  const q = s => g.querySelector(s);
  const p = { g, b, rg, st: { x: 0, y: 0, S: 1, flip: 1 } };
  p.place = (x, y, s = 1, flip = 1, rot = 0, bob = 0) => { g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(flip * s).toFixed(3)} ${s})`); b.setAttribute('transform', `translate(0 ${-bob}) rotate(${rot})`); };
  p.gallop = (t, sp = 10, amp = 34, moving = true) => {
    const s = moving ? Math.sin(t * sp) : 0, c = moving ? Math.cos(t * sp) : 0; p.ph = t * sp; p.mv = moving; p.rk = Math.min(1.4, amp / 22);
    q('.h0').setAttribute('transform', `rotate(${s * amp} -84 -100)`); q('.h2').setAttribute('transform', `rotate(${-s * amp} 74 -100)`);
    q('.h1').setAttribute('transform', `rotate(${-s * amp} -66 -100)`); q('.h3').setAttribute('transform', `rotate(${s * amp} 54 -100)`);
    q('.tail').setAttribute('transform', `rotate(${c * 10} -90 -150)`);
    return Math.abs(c) * 7;
  };
  if (o.rider) {
    const sr = o.rider.s || 1, r = P(rg, Object.assign({}, o.rider, { s: sr, noGS: 1 })); p.rider = r; r.setRide();
    const rein = el('path', { fill: 'none', stroke: '#5a3a1a', 'stroke-width': 4, 'stroke-linecap': 'round' }, rg), pl = r.place;
    r.place = (x, y, s = 1, flip = 1, rot = 0, bob = 0, sx = 1) => {
      const ph = p.ph || 0, mv = p.mv, k = p.rk || 0;
      r.swing = mv ? Math.sin(2 * ph - .6) * 4 * k : 0;
      pl(x, y + 7 * sr, s, flip, rot + 9 + (mv ? Math.sin(2 * ph - 1) * 2.5 * k : 0), bob + (mv ? Math.sin(2 * ph - .9) * 3.5 * k : 0), sx);
      const hd = r.ad.R > -100 && r.ad.R < 10 ? r.toParent(...r.hand('R')) : null;
      rein.setAttribute('d', hd ? `M${hd[0].toFixed(1)} ${hd[1].toFixed(1)} Q${((hd[0] + 168) / 2).toFixed(1)} ${((hd[1] - 228) / 2 + 18).toFixed(1)} 168 -228` : '');
      return r;
    };
    r.place(-8, -182 + 100 * sr, 1, 1); r.arm('R', -50); r.arm('L', -35);
  }
  return p;
}
// ---------- props ----------
const bowMk = '<path d="M0 -50 Q38 0 0 50" stroke="#6b3e1b" stroke-width="8" fill="none" stroke-linecap="round"/><line x1="0" y1="-50" x2="0" y2="50" stroke="#eee" stroke-width="2"/>';
const arrowMk = '<line x1="-40" y1="0" x2="34" y2="0" stroke="#c9a66b" stroke-width="5"/><path d="M34 -7 L54 0 L34 7 Z" fill="#cfd8dc" stroke="#1a1a1a" stroke-width="3"/><path d="M-40 0 L-52 -8 M-40 0 L-52 8" stroke="#e2362b" stroke-width="4"/>';
const spearMk = '<line x1="-120" y1="0" x2="120" y2="0" stroke="#6b4a2a" stroke-width="8" stroke-linecap="round"/><path d="M120 -11 L162 0 L120 11 Z" fill="#cfd8dc" stroke="#1a1a1a" stroke-width="4"/>';
const fishMk = (c = '#7fa6c9') => `<ellipse cx="0" cy="0" rx="26" ry="11" fill="${c}" stroke="#1a1a1a" stroke-width="4"/><path d="M24 0 L40 -11 L40 11 Z" fill="${c}" stroke="#1a1a1a" stroke-width="4"/><circle cx="-14" cy="-2" r="2.6" fill="#1a1a1a"/>`;
const bowlMk = '<path d="M-20 -6 Q0 24 20 -6 Z" fill="#8a5a2b" stroke="#1a1a1a" stroke-width="4"/><ellipse cx="0" cy="-6" rx="20" ry="5" fill="#fbe9c8" stroke="#1a1a1a" stroke-width="3"/>';
const heartMk = '<path d="M0 14 C-34 -10 -20 -34 0 -16 C20 -34 34 -10 0 14 Z" fill="#ff5d8f" stroke="#1a1a1a" stroke-width="4"/>';
function gerG(parent) {
  const g = el('g', {}, parent), body = mk(g, `<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><path d="M-130 0 L-130 -96 L130 -96 L130 0 Z" fill="#f2ead8"/><path d="M-130 -70 H130 M-130 -24 H130" stroke="#d6c9a8" stroke-width="4"/><path d="M-148 -92 L0 -196 L148 -92 Z" fill="#e8dfc8"/><path d="M-60 -92 L-20 -176 M60 -92 L20 -176 M0 -92 V-184" stroke="#cdbf9a" stroke-width="3"/><rect x="-130" y="-60" width="260" height="9" fill="#2f63c9" stroke-width="3"/><rect x="-24" y="-74" width="48" height="74" rx="6" fill="#c0392b"/><circle cx="14" cy="-36" r="4" fill="#f1c40f" stroke-width="2"/></g>`);
  return { g, body, set: (x, y, s = 1, h = 1) => { g.setAttribute('transform', `translate(${x} ${y}) scale(${s})`); body.setAttribute('transform', `scale(${1 + (1 - h) * .15} ${h})`); } };
}
function cartG(parent, o = {}) {
  const g = el('g', {}, parent);
  mk(g, `<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="-110" y="-84" width="220" height="22" rx="5" fill="#8a5a2b"/><rect x="-110" y="-120" width="12" height="40" fill="#6b4423"/><rect x="98" y="-120" width="12" height="40" fill="#6b4423"/><path d="M110 -70 L250 -50" stroke="#6b4423" stroke-width="12"/></g>`);
  const load = el('g', {}, g);
  const wl = [-70, 70].map(x => mk(g, `<circle r="46" fill="#a0703c" stroke="#1a1a1a" stroke-width="7"/><path d="M-46 0 H46 M0 -46 V46 M-33 -33 L33 33 M-33 33 L33 -33" stroke="#1a1a1a" stroke-width="5"/><circle r="9" fill="#1a1a1a"/>`));
  return { g, load, set: (x, y, s = 1, ang = 0) => { g.setAttribute('transform', `translate(${x} ${y}) scale(${s})`); wl.forEach((w, i) => w.setAttribute('transform', `translate(${i ? 70 : -70} -46) rotate(${ang})`)); } };
}
function sheepG(parent, s = 1) { const g = mk(parent, `<g stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"><rect x="-22" y="-22" width="7" height="22" fill="#3a3a3a"/><rect x="14" y="-22" width="7" height="22" fill="#3a3a3a"/><circle cx="-14" cy="-38" r="20" fill="#f4f1ea"/><circle cx="8" cy="-42" r="22" fill="#f4f1ea"/><circle cx="22" cy="-32" r="17" fill="#f4f1ea"/><circle cx="-2" cy="-28" r="20" fill="#f4f1ea"/><ellipse cx="40" cy="-46" rx="13" ry="12" fill="#3a3a3a"/></g>`); return { g, set: (x, y, t, ph = 0, flip = 1) => setT(g, x, y - Math.abs(Math.sin(t * 8 + ph)) * 4, 0, flip * s, s) }; }
function fireG(parent) { const g = el('g', {}, parent); mk(g, '<circle cx="0" cy="-30" r="130" fill="url(#gFire)"/><path d="M-60 0 L60 -14 M-60 -14 L60 0" stroke="#4a2f15" stroke-width="16" stroke-linecap="round"/>'); const f1 = mk(g, '<path d="M-34 -8 Q-44 -50 -10 -70 Q-16 -40 8 -52 Q30 -30 34 -8 Z" fill="#ff7a1a" stroke="#1a1a1a" stroke-width="4"/>'), f2 = mk(g, '<path d="M-16 -8 Q-22 -34 0 -48 Q14 -30 16 -8 Z" fill="#ffd84a"/>'); return { g, set: (x, y, t, s = 1) => { setT(g, x, y, 0, s); setT(f1, 0, 0, 0, 1 + .1 * Math.sin(t * 13), 1 + .18 * Math.sin(t * 9 + 1)); setT(f2, 0, 0, 0, 1 + .12 * Math.sin(t * 15), 1 + .2 * Math.sin(t * 11)); } }; }
function bushG(parent, berries = true) { return mk(parent, `<g stroke="#1a1a1a" stroke-width="5"><ellipse cx="0" cy="-40" rx="80" ry="46" fill="#4f8a3b"/><ellipse cx="-44" cy="-30" rx="44" ry="30" fill="#5fa046"/><ellipse cx="46" cy="-30" rx="44" ry="30" fill="#5fa046"/>${berries ? [[-40, -50], [-10, -64], [22, -52], [50, -36], [-62, -28], [8, -34]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#d62d20"/>`).join('') : ''}</g>`); }
// ---------- ui helpers ----------
function tagG(parent, text, size = 56, o = {}) { const w = Math.round(text.length * size * .58) + 52; return mk(parent, `<rect x="${-w / 2}" y="${-size * .75}" width="${w}" height="${size * 1.5}" rx="10" fill="${o.fill || '#111'}" stroke="${o.stroke || '#fff'}" stroke-width="5"/><text class="t" x="0" y="${size * .35}" text-anchor="middle" font-size="${size}" fill="${o.tc || '#fff'}">${text}</text>`, { opacity: 0 }); }
function bigG(parent, text, size = 130, o = {}) { return mk(parent, `<text class="t big" x="0" y="0" font-size="${size}" ${o.fill ? `style="fill:${o.fill}"` : ''}>${text}</text>`, { opacity: 0 }); }
function show(g, lt, a, x, y, rot = 0, b = 1e9, sc = 1, slam = false) {
  let s = slam ? (lt < a ? 0 : 1 + 1.3 * (1 - easeOut(lin(lt, a, a + .22)))) : pop(lt, a, .35);
  if (lt > b) s *= 1 - lin(lt, b, b + .25); s *= sc;
  g.setAttribute('opacity', (lt >= a && s > .02) ? 1 : 0); g.setAttribute('transform', tr(x, y, rot, s));
}
const STAMP_L = '<rect x="-230" y="-80" width="460" height="160" rx="18" fill="none" stroke="#d9d9d9" stroke-width="14"/><rect x="-206" y="-58" width="412" height="116" rx="10" fill="none" stroke="#d9d9d9" stroke-width="5"/><text class="t" x="0" y="38" text-anchor="middle" font-size="106" fill="#d9d9d9" style="-webkit-text-stroke:0;letter-spacing:6px">LEGEND</text>';
const STAMP_F = '<rect x="-190" y="-86" width="380" height="172" rx="22" fill="#ff6a00" stroke="#1a1a1a" stroke-width="12"/><text class="t" x="0" y="44" text-anchor="middle" font-size="124" fill="#fff4e6" style="-webkit-text-stroke:0;letter-spacing:4px">FACT</text>';
function stampG(parent, kind) { return mk(parent, kind === 'L' ? STAMP_L : STAMP_F, { opacity: 0 }); }
function stampShow(g, lt, a, x, y, rot) { const s = lt < a ? 0 : 2.2 - 1.2 * easeOut(lin(lt, a, a + .22)); g.setAttribute('opacity', lt >= a ? 1 : 0); g.setAttribute('transform', tr(x + (lt > a && lt < a + .35 ? Math.sin(lt * 90) * 6 : 0), y, rot, s)); }
function tickG(parent) { return mk(parent, window.TICK_SVG); }
function portrait(parent, o, cx, cy, r, ring) {
  const id = 'pc' + Math.floor(rnd() * 1e9), g = el('g', {}, parent);
  mk(g, `<clipPath id="${id}"><circle r="${r}"/></clipPath><circle r="${r}" fill="#e8dcc0"/>`); const inner = el('g', { 'clip-path': `url(#${id})` }, g);
  const pp = P(inner, Object.assign({}, o, { s: 1, noGS: 1 })); const k = r / 40; pp.place(0, 214 * k + 8, k, 1); pp.mg.setAttribute('display', 'none');
  mk(g, `<circle r="${r}" fill="none" stroke="${ring}" stroke-width="14"/>`); setT(g, cx, cy); return { g, pp };
}
function poof(parent) { return mk(parent, '<g stroke="#1a1a1a" stroke-width="5"><circle cx="-40" cy="10" r="46" fill="#fff"/><circle cx="30" cy="-10" r="54" fill="#f1f1f1"/><circle cx="60" cy="30" r="40" fill="#fff"/><circle cx="-6" cy="34" r="44" fill="#ececec"/></g><path d="M-20 -60 l8 -22 l8 22 l22 8 l-22 8 l-8 22 l-8 -22 l-22 -8 Z" fill="#ffd84a" stroke="#1a1a1a" stroke-width="4"/>', { opacity: 0 }); }

// ---------- cast ----------
const C = {
  yes: { deel: '#7b3f1e', sash: '#e2b23a', hat: 'tall', hatC: '#4a2c17', hatT: '#b03a2e', must: 1, beard: 1, hair: '#2a1a10', skin: '#d9a273', s: 1.12, mh: 360 },
  tem: { kid: 1, deel: '#3f6fa8', sash: '#c0392b', hat: 'temu', s: .64 },
  temT: { deel: '#3f6fa8', sash: '#c0392b', hat: 'temu', s: .92, k: 1.12 },
  temA: { deel: '#3f6fa8', sash: '#c0392b', hat: 'temu', s: 1.1, k: 1.0, hair: '#3a2415' },
  bor: { kid: 1, deel: '#e86aa0', sash: '#ffd84a', hat: 'braids', hatT: '#c0392b', long: 1, s: .62, mh: 340 },
  hoe: { deel: '#7d3c98', sash: '#f1c40f', hat: 'boqta', hatC: '#5b2a73', long: 1, s: 1.0, mh: 380 },
  kha: { kid: 1, deel: '#2e8b57', sash: '#f1c40f', hat: 'hair', s: .56 },
  tmn: { kid: 1, deel: '#f4b400', sash: '#7d3c98', hat: 'braids', hair: '#5a3b1a', hatT: '#2e8b57', long: 1, s: .5, mh: 340 },
  kch: { kid: 1, deel: '#9b59b6', sash: '#f1c40f', hat: 'hair', hair: '#4a2c17', s: .42 },
  beg: { deel: '#e67e22', sash: '#6e2c00', hat: 'hair', hair: '#2a1a10', s: .88, skin: '#dca77a' },
  tat: { deel: '#c0392b', sash: '#2c3e50', hat: 'fur', hatC: '#2b2b2b', hatT: '#6e1f18', must: 1, hair: '#1a1a1a', s: 1.05, skin: '#d8a06f' },
  tat2: { deel: '#922b21', sash: '#f1c40f', hat: 'fur', hatC: '#5d4037', hatT: '#2b2b2b', must: 1, hair: '#2a1a10', s: .98, skin: '#c98f60' },
  chief: { deel: '#117a65', sash: '#f1c40f', hat: 'tall', hatC: '#7f8c8d', hatT: '#0b5345', beard: 1, hair: '#bdc3c7', s: 1.1, skin: '#d8a97c', mh: 360 },
  eld: { deel: '#1e8449', sash: '#873600', hat: 'fur', hatC: '#7f8c8d', hatT: '#145a32', must: 1, hair: '#aab7b8', s: .98, skin: '#c99d70' },
  eld2: { deel: '#148f77', sash: '#f5b041', hat: 'fur', hatC: '#566573', hatT: '#0e6251', hair: '#d5d8dc', beard: 1, s: .95, skin: '#e0b48a' },
  guard: { deel: '#34495e', sash: '#17202a', hat: 'helmet', must: 1, hair: '#1a1a1a', s: 1.22, skin: '#cf9a70' },
  srch: { deel: '#6c7a89', sash: '#2c3e50', hat: 'helmet', must: 1, hair: '#1a1a1a', s: 1.05, skin: '#d4a276' },
  stg: { deel: '#16a085', sash: '#f5cba7', hat: 'wool', s: 1.0, skin: '#f0c8a0' },
  nomM: { deel: '#d4ac0d', sash: '#7b241c', hat: 'fur', hatC: '#6e2c00', hatT: '#a04000', must: 1, hair: '#2a1a10', s: 1.0 },
  nomW: { deel: '#e59866', sash: '#1f618d', hat: 'boqta', hatC: '#a04000', long: 1, s: .95, mh: 380 },
  war: { deel: '#6e2c00', sash: '#c0392b', hat: 'fur', hatC: '#2b2b2b', hatT: '#922b21', must: 1, hair: '#1a1a1a', s: 1.05, skin: '#d4a06e' },
  kidA: { kid: 1, deel: '#e74c3c', sash: '#f1c40f', hat: 'hair', s: .5 },
  kidB: { kid: 1, deel: '#16a085', sash: '#e67e22', hat: 'braids', hair: '#2a1a10', hatT: '#f1c40f', s: .46, long: 1, mh: 330 },
  anc: { deel: '#ffe9a8', sash: '#f1c40f', hat: 'tall', hatC: '#f1c40f', hatT: '#fff2c0', beard: 1, hair: '#ffffff', s: .8, skin: '#fff6dc', mh: 360 },
  fst: { deel: '#2874a6', sash: '#f1c40f', hat: 'fur', hatC: '#6e2c00', hatT: '#1b4f72', must: 1, hair: '#1a1a1a', s: 1.0 },
};
const BEAT = [], BS = [], BE = [], N = TL.starts.length;
const STAGE = $('stage');
function ribbon(u) { const g = tagG(u, 'SIDE QUEST', 40, { fill: '#ff6a00', stroke: '#1a1a1a', tc: '#fff4e6' }); return lt => show(g, lt, .2, 190, 70, -3); }
