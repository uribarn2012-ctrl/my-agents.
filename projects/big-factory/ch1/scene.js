// Chapter 1 "The outcast". render(t) draws the frame at time t (seconds). 1920x1080 only.
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
  const hem = o.long ? -24 : -62, hw = o.long ? 60 : 50, wAt = y => 40 + (hw - 40) * ((y + 172) / (hem + 172));
  let s = '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">';
  s += `<g class="legL"><rect x="-23" y="-100" width="20" height="92" fill="${pn}"/><rect x="-29" y="-14" width="32" height="14" rx="6" fill="${bt}"/></g>`;
  s += `<g class="legR"><rect x="3" y="-100" width="20" height="92" fill="${pn}"/><rect x="-3" y="-14" width="32" height="14" rx="6" fill="${bt}"/></g>`;
  s += `<rect class="skin" x="-11" y="-192" width="22" height="24" fill="${sk}"/>`;
  s += `<path d="M-40 -172 L40 -172 L${hw} ${hem} L${-hw} ${hem} Z" fill="${dl}"/><path d="M-14 -172 L22 ${hem + 10}" fill="none" stroke-width="4"/>`;
  const sw = wAt(-116) - 2; s += `<rect x="${-sw}" y="-124" width="${2 * sw}" height="16" fill="${sh}" stroke-width="4"/><rect x="-16" y="-178" width="32" height="12" rx="4" fill="${trm}" stroke-width="4"/>`;
  s += `<g class="armL"><rect x="-50" y="-172" width="22" height="80" rx="10" fill="${dl}"/><circle class="skin" cx="-39" cy="-90" r="12" fill="${sk}"/><g transform="translate(-39 -90)">${o.holdL || ''}</g></g>`;
  s += `<g class="armR"><rect x="28" y="-172" width="22" height="80" rx="10" fill="${dl}"/><circle class="skin" cx="39" cy="-90" r="12" fill="${sk}"/><g transform="translate(39 -90)">${o.holdR || ''}</g></g>`;
  if (o.cangue) s += `<g class="cg"><rect x="-84" y="-190" width="168" height="38" rx="8" fill="#a0703c"/><path d="M-70 -178 H70 M-70 -165 H70" stroke="#7a5128" stroke-width="3" fill="none"/><circle cx="0" cy="-186" r="14" fill="${sk}" class="skin"/><circle cx="-64" cy="-171" r="13" fill="#4a2f15"/><circle cx="-64" cy="-171" r="9" fill="${sk}" class="skin"/><circle cx="64" cy="-171" r="13" fill="#4a2f15"/><circle cx="64" cy="-171" r="9" fill="${sk}" class="skin"/></g>`;
  s += `<g class="head" transform="translate(0 -214) scale(${k})"><circle class="skin" r="34" fill="${sk}"/>`;
  if (o.beard) s += `<path d="M-31 6 Q-36 52 0 58 Q36 52 31 6 Q16 30 0 28 Q-16 30 -31 6 Z" fill="${hr}"/>`;
  s += `<ellipse cx="-24" cy="14" rx="8" ry="5" fill="#e89a86" stroke="none"/><ellipse cx="24" cy="14" rx="8" ry="5" fill="#e89a86" stroke="none"/>`;
  s += `<g class="eN"><ellipse cx="-12" cy="2" rx="5" ry="7.5" fill="#1a1a1a" stroke="none"/><ellipse cx="12" cy="2" rx="5" ry="7.5" fill="#1a1a1a" stroke="none"/></g><g class="eX" display="none"><path d="M-18 -4 l12 12 M-6 -4 l-12 12 M6 -4 l12 12 M18 -4 l-12 12" stroke-width="4" fill="none"/></g>`;
  s += `<g class="bN"><path d="M-20 -12 L-6 -14 M6 -14 L20 -12" stroke-width="4" fill="none"/></g><g class="bA" display="none"><path d="M-22 -16 L-5 -8 M22 -16 L5 -8" stroke-width="5" fill="none"/></g>`;
  s += `<path class="mS" d="${o.flat ? 'M-9 19 L9 19' : 'M-10 16 Q0 25 10 16'}" fill="none" stroke-width="4"/><ellipse class="mO" display="none" cx="0" cy="19" rx="8" ry="9" fill="#7a1f1f" stroke-width="4"/>`;
  if (o.must) s += `<path d="M-24 13 Q-12 4 0 12 Q12 4 24 13 Q12 21 0 15 Q-12 21 -24 13 Z" fill="${hr}" stroke-width="3"/>`;
  const H = o.hat || 'hair';
  if (H === 'temu') s += `<path d="M-36 -10 Q-38 -56 0 -58 Q38 -56 36 -10 Z" fill="#7a4a2a"/><rect x="-42" y="-26" width="84" height="18" rx="9" fill="#eadcbc"/><path d="M-5 -58 L8 -82 L18 -56" fill="#c0392b" stroke-width="4"/>`;
  else if (H === 'fur') s += `<path d="M-30 -30 Q-24 -66 0 -68 Q24 -66 30 -30 Z" fill="${ht}"/><rect x="-44" y="-36" width="88" height="26" rx="13" fill="${hc}"/>`;
  else if (H === 'tall') s += `<path d="M-32 -30 L-16 -90 L16 -90 L32 -30 Z" fill="${ht}"/><rect x="-44" y="-36" width="88" height="24" rx="12" fill="${hc}"/><circle cx="0" cy="-94" r="9" fill="#c0392b" stroke-width="4"/>`;
  else if (H === 'boqta') s += `<path d="M-36 -8 Q-38 -42 0 -44 Q38 -42 36 -8 Z" fill="${hr}"/><path d="M-34 -6 Q-46 22 -36 52 M34 -6 Q46 22 36 52" stroke="${hr}" stroke-width="11" fill="none"/><rect x="-22" y="-104" width="44" height="72" rx="14" fill="${hc}"/><rect x="-25" y="-52" width="50" height="14" fill="#f1c40f"/>`;
  else if (H === 'braids') s += `<path d="M-37 -8 Q-40 -48 0 -48 Q40 -48 37 -8 Z" fill="${hr}"/><path d="M-34 -6 Q-50 20 -40 52 M34 -6 Q50 20 40 52" stroke="${hr}" stroke-width="12" fill="none"/><circle cx="-40" cy="54" r="8" fill="#e2362b"/><circle cx="40" cy="54" r="8" fill="#e2362b"/><path d="M-26 -42 Q0 -62 26 -42 L22 -34 Q0 -50 -22 -34 Z" fill="${ht}" stroke-width="4"/>`;
  else if (H === 'helmet') s += `<path d="M-38 -6 Q-40 -58 0 -60 Q40 -58 38 -6 Z" fill="#8e9aa6"/><rect x="-42" y="-16" width="84" height="12" rx="6" fill="#5d6b78"/><path d="M-5 -60 L0 -82 L5 -60 Z" fill="#c9d1d8" stroke-width="3"/>`;
  else if (H === 'wool') s += `<path d="M-36 -8 Q-38 -54 0 -56 Q38 -54 36 -8 Z" fill="#f3e3c3"/><rect x="-40" y="-22" width="80" height="16" rx="8" fill="#e6cfa0"/><circle cx="0" cy="-60" r="10" fill="#f3e3c3"/>`;
  else s += `<path d="M-36 -6 Q-40 -52 0 -52 Q40 -52 36 -6 Q20 -26 0 -24 Q-20 -26 -36 -6 Z" fill="${hr}"/>`;
  return s + '</g></g>';
}
const MARKS = `<g class="m_q" display="none"><circle r="34" fill="#fff" stroke="#1a1a1a" stroke-width="5"/><text class="t" y="18" text-anchor="middle" font-size="52" fill="#1a1a1a">?</text></g>
<g class="m_e" display="none"><circle r="34" fill="#ffd84a" stroke="#1a1a1a" stroke-width="5"/><text class="t" y="18" text-anchor="middle" font-size="52" fill="#d62d20">!</text></g>
<g class="m_s" display="none"><path d="M0 -38 Q32 8 0 34 Q-32 8 0 -38 Z" fill="#6ec6ff" stroke="#1a1a1a" stroke-width="5"/><path d="M-8 4 Q-8 16 2 20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></g>
<g class="m_a" display="none"><path d="M-28 -10 Q-10 -10 -10 -28 M28 -10 Q10 -10 10 -28 M-28 10 Q-10 10 -10 28 M28 10 Q10 10 10 28" stroke="#e2362b" stroke-width="10" fill="none" stroke-linecap="round"/></g>`;
const MK = { '?': 'm_q', '!': 'm_e', s: 'm_s', a: 'm_a' };
function P(parent, o = {}) {
  const g = el('g', {}, parent), b = el('g', {}, g); b.innerHTML = personSVG(o);
  const mg = el('g', {}, g); mg.innerHTML = MARKS;
  const q = s => b.querySelector(s), qa = s => [...b.querySelectorAll(s)];
  const p = { g, b, o, fix: { L: false, R: false }, st: { x: 0, y: 0, S: 1, flip: 1, sx: 1, rot: 0, bob: 0 }, ms: 0, mk: null };
  const legL = q('.legL'), legR = q('.legR'), armL = q('.armL'), armR = q('.armR'), head = q('.head'), cg = q('.cg');
  p.mg = mg; p.head = head; p.armL = armL; p.armR = armR; p.cg = cg;
  const refresh = () => {
    const s = p.st, S = (o.s || 1) * (o.noGS ? 1 : 1.2) * s.S, fx = s.flip * S * s.sx;
    g.setAttribute('transform', `translate(${s.x.toFixed(1)} ${s.y.toFixed(1)}) scale(${fx.toFixed(3)} ${S.toFixed(3)})`);
    b.setAttribute('transform', `translate(0 ${(-s.bob).toFixed(1)}) rotate(${s.rot.toFixed(2)})`);
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
  p.arm = (side, deg) => { p.fix[side] = true; (side === 'L' ? armL : armR).setAttribute('transform', `rotate(${deg} ${side === 'L' ? -38 : 38} -165)`); };
  p.free = side => { p.fix[side] = false; };
  p.skin = c => qa('.skin').forEach(e => e.setAttribute('fill', c));
  p.face = st => { vis(q('.eN'), st !== 'x'); vis(q('.eX'), st === 'x'); vis(q('.bN'), st !== 'a'); vis(q('.bA'), st === 'a'); vis(q('.mS'), st !== 'o'); vis(q('.mO'), st === 'o'); };
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
  const rg = el('g', {}, b);
  mk(b, `<g ${dk}>${leg('h0', -84)}${leg('h2', 74)}<ellipse cx="0" cy="-132" rx="98" ry="50" fill="${coat}"/><path d="M52 -160 L100 -258 L146 -242 L100 -118 Z" fill="${coat}"/><path d="M62 -168 Q66 -240 96 -262 L108 -250 Q92 -216 88 -150 Z" fill="${mane}"/><ellipse cx="146" cy="-236" rx="46" ry="23" transform="rotate(28 146 -236)" fill="${coat}"/><path d="M96 -256 L100 -288 L118 -258 Z" fill="${coat}"/><circle cx="140" cy="-246" r="5" fill="#1a1a1a" stroke="none"/><ellipse cx="176" cy="-222" rx="6" ry="4" fill="#2b1b10" stroke="none"/>${o.blanket ? `<rect x="-34" y="-180" width="70" height="26" rx="8" fill="${o.blanket}"/>` : ''}</g>`);
  const q = s => g.querySelector(s);
  const p = { g, b, rg, st: { x: 0, y: 0, S: 1, flip: 1 } };
  p.place = (x, y, s = 1, flip = 1, rot = 0, bob = 0) => { g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(flip * s).toFixed(3)} ${s})`); b.setAttribute('transform', `translate(0 ${-bob}) rotate(${rot})`); };
  p.gallop = (t, sp = 10, amp = 34, moving = true) => {
    const s = moving ? Math.sin(t * sp) : 0, c = moving ? Math.cos(t * sp) : 0;
    q('.h0').setAttribute('transform', `rotate(${s * amp} -84 -100)`); q('.h2').setAttribute('transform', `rotate(${-s * amp} 74 -100)`);
    q('.h1').setAttribute('transform', `rotate(${-s * amp} -66 -100)`); q('.h3').setAttribute('transform', `rotate(${s * amp} 54 -100)`);
    q('.tail').setAttribute('transform', `rotate(${c * 10} -90 -150)`);
    return Math.abs(c) * 7;
  };
  if (o.rider) { const sr = o.rider.s || 1; p.rider = P(rg, Object.assign({}, o.rider, { s: sr, noGS: 1 })); p.rider.place(-8, -182 + 100 * sr, 1, 1); p.rider.arm('R', -50); p.rider.arm('L', -35); }
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
// sound/visual vars
const BEAT = [], BS = [], BE = [], N = TL.starts.length;
const STAGE = $('stage');
function B(i, build) { const g = el('g', {display: 'none'}, STAGE), cam = el('g', {}, g), ui = el('g', {}, g); BEAT[i] = { g, cam, ui, upd: build(cam, ui), focus: [960, 640] }; }
for (let i = 0; i < N; i++) { BS[i] = i === 0 ? 0 : TL.starts[i] - .1; BE[i] = i === N - 1 ? TL.end : TL.starts[i + 1] - .1; }
const side = (u, lt) => { /* "side quest" ribbon */ if (!side.g) {} };
function ribbon(u) { const g = tagG(u, 'SIDE QUEST', 40, { fill: '#ff6a00', stroke: '#1a1a1a', tc: '#fff4e6' }); return lt => show(g, lt, .2, 190, 70, -3); }

// =============== BEATS ===============
// 0  Temujin (9) rides with father Yesugei; Tick opens the chapter
B(0, (g, u) => {
  const sc = scenery(g, { sky: 'day', sun: [1560, 190], clouds: 5, wind: 1 });
  const y = H(g, { coat: '#8b5a2b', blanket: '#c0392b', rider: C.yes }), t = H(g, { coat: '#f2efe6', mane: '#bdb7a8', blanket: '#2f63c9', rider: C.tem });
  const tk = tickG(g), c1 = tagG(u, 'CHAPTER 1', 60, { fill: '#ff6a00', stroke: '#1a1a1a', tc: '#fff4e6' }), c2 = bigG(u, 'THE OUTCAST', 150);
  return (lt, p, d) => {
    sc(lt);
    const x = -330 + lt * 400, by1 = y.gallop(lt, 8, 24), by2 = t.gallop(lt + .4, 8, 24);
    y.place(x, 840, 1, 1, 0, by1); t.place(x - 360, 900, .82, 1, 0, by2);
    y.rider.place(-8, -182 + 112, 1, 1, 0, by1 * .3); t.rider.place(-8, -182 + 64, 1, 1, 0, by2 * .3);
    const k = 1 - lin(lt, 3.6, 4.4);
    setT(tk, 300, 975 + (1 - k) * -60, 2 * Math.sin(lt * 2), .3 * k, .3 * k * (1 + .02 * Math.sin(lt * 5))); tk.setAttribute('opacity', k > 0 ? 1 : 0);
    show(c1, lt, .3, 960, 90, 0, 3.6); show(c2, lt, .5, 960, 270, -2, 3.6, 1, true);
  };
});
// 1  Borte
B(1, (g, u) => {
  const sc = scenery(g, { sky: 'day', sun: [300, 200], clouds: 3 }), ger = gerG(g);
  const bor = P(g, C.bor), tem = P(g, C.tem), yes = P(g, C.yes), hs = [0, 1, 2].map(() => mk(g, heartMk, { opacity: 0 }));
  const t1 = tagG(u, 'BÖRTE', 62, { fill: '#e86aa0' }), t2 = tagG(u, 'REMEMBER HER', 54);
  return (lt, p, d) => {
    sc(lt); ger.set(1560, 800, 1.15);
    bor.place(1150, 900, 1.25, -1, 0, Math.abs(Math.sin(lt * 4)) * 4); bor.arm('R', 150 + Math.sin(lt * 9) * 30); bor.walk(lt, 9, 0, false); bor.arm('R', 150 + Math.sin(lt * 9) * 30);
    const ka = lin(lt, 0, 1.2), x = lerp(-120, 760, easeOut(ka)), mv = ka < 1;
    tem.place(x, 910, 1.25, 1, 0, tem.walk(lt, 9, 22, mv)); yes.place(lerp(-420, 430, easeOut(ka)), 880, 1, 1, 0, yes.walk(lt, 9, 22, mv));
    tem.mark('!', lt, 1.3, 2.1); hs.forEach((h, i) => { const a = 1.0 + i * .25, k = lin(lt, a, a + 1); h.setAttribute('opacity', k > 0 && k < 1 ? 1 : 0); setT(h, 790 + i * 36, 680 - k * 120, 0, .8 + i * .1); });
    show(t1, lt, .2, 1150, 560, -3); show(t2, lt, 1.0, 960, 1010, 0);
  };
});
// 2  Tatar camp offers food
B(2, (g, u) => {
  const sc = scenery(g, { sky: 'warm', sun: [1500, 230], clouds: 4 }), g1 = gerG(g), g2 = gerG(g);
  const flag = mk(g, '<line x1="0" y1="0" x2="0" y2="-260" stroke="#4a2f15" stroke-width="10"/>'), fl = el('path', { fill: '#c0392b', stroke: '#1a1a1a', 'stroke-width': 5 }, flag);
  const fire = fireG(g), t1 = P(g, C.tat), t2 = P(g, C.tat2), yes = P(g, C.yes), tem = H(g, { coat: '#f2efe6', mane: '#bdb7a8', blanket: '#2f63c9', rider: C.tem });
  const a = tagG(u, 'THE TATARS', 62, { fill: '#c0392b' }), b = tagG(u, 'OLD ENEMIES', 58, { fill: '#7b241c' }), steam = [0, 1, 2].map(() => mk(g, '<circle r="12" fill="#fff" opacity=".7"/>'));
  return (lt, p, d) => {
    sc(lt); g1.set(1400, 770, 1.1); g2.set(1740, 800, 1.2); fire.set(1230, 930, lt, 1.1);
    setT(flag, 1020, 800); fl.setAttribute('d', `M0 -260 Q${40 + Math.sin(lt * 6) * 10} ${-250 + Math.sin(lt * 5) * 6} 90 ${-245 + Math.sin(lt * 7) * 8} Q${50 + Math.sin(lt * 6) * 8} ${-210} 0 -200 Z`);
    const k = lin(lt, 0, 2.4), mv = k < 1;
    yes.place(lerp(-100, 760, easeOut(k)), 900, 1, 1, 0, yes.walk(lt, 9, 22, mv));
    tem.place(lerp(-420, 330, easeOut(lin(lt, 0, 2.2))), 960, .9, 1, 0, tem.gallop(lt, 8, 22, lt < 2.2)); tem.rider.place(-8, -182 + 64, 1, 1, 0, 0);
    const tk = lin(lt, 1.2, 2.8), tx = lerp(1250, 940, easeOut(tk)); t1.place(tx, 905, 1.05, -1, 0, t1.walk(lt, 9, 18, tk < 1)); t1.arm('R', -80); t1.hold('R', bowlMk);
    t2.place(1550, 930, 1.0, -1, 0, Math.abs(Math.sin(lt * 3)) * 3); t2.walk(lt, 9, 0, false); if (lt > 3) t2.face('o'); else t2.face('n');
    steam.forEach((s, i) => { const kk = ((lt * .8 + i / 3) % 1); s.setAttribute('opacity', lt > 2.2 ? 1 - kk : 0); setT(s, tx - 50 + Math.sin(lt * 4 + i) * 10, 780 - kk * 90, 0, .6 + kk); });
    yes.mark('?', lt, 3.2, 4.8);
    show(a, lt, .3, 1400, 520, -2); show(b, lt, 2.3, 960, 1010, 0);
  };
});
// 3  He eats
B(3, (g, u) => {
  const sc = scenery(g, { sky: 'warm', sun: [1500, 230], clouds: 2, h: 700 }), t1 = P(g, C.tat2), yes = P(g, C.yes), t = tagG(u, 'CHOMP', 80, { fill: '#c0392b' });
  return (lt, p, d) => {
    sc(lt); t1.place(1600, 880, .9, -1, 0, 0); t1.walk(lt, 9, 0, false); t1.face('a');
    const k = Math.abs(Math.sin(lt * 7)); yes.place(900, 1130, 2.2, 1, 0, k * 6); yes.walk(lt, 9, 0, false);
    yes.arm('R', -140 - k * 25); yes.arm('L', -120); yes.hold('R', bowlMk); yes.face(k > .5 ? 'o' : 'n');
    show(t, lt, .1, 1440, 330, 6, 1e9, 1, true);
  };
});
// 4  poisoned: LEGEND
B(4, (g, u) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, sun: [260, 560], sunC: '#ffb26b', clouds: 3, grassC: '#4d5530' });
  const yes = P(g, C.yes), tem = P(g, C.tem), bubs = [0, 1, 2, 3].map(() => mk(g, '<circle r="14" fill="#7bd66b" stroke="#1a1a1a" stroke-width="4"/>'));
  const a = tagG(u, 'A FEW DAYS LATER', 58), st = stampG(u, 'L'), b = tagG(u, 'THE STORY GOES: POISONED', 54, { fill: '#555' });
  return (lt, p, d) => {
    sc(lt);
    const fall = lin(lt, 1.7, 2.1), x = lerp(260, 900, lin(lt, 0, 1.7)), mv = lt < 1.7;
    yes.skin(lt > .5 ? '#a7c47f' : '#d9a273'); yes.place(x, 900, 1.1, 1, fall * 88, mv ? yes.walk(lt, 6, 14, true) : 0); if (mv) yes.tilt(Math.sin(lt * 4) * 10); yes.face(lt > 2.0 ? 'x' : (lt > 1.0 ? 'o' : 'n'));
    tem.place(lerp(-100, 500, easeOut(lin(lt, .4, 1.8))), 920, 1.25, 1, 0, tem.walk(lt, 9, 20, lt < 1.8)); if (lt > 2.2) tem.face('o');
    tem.mark('!', lt, 2.0, 3.6); yes.mark('s', lt, .8, 1.7);
    bubs.forEach((bb, i) => { const kk = (lt * .9 + i / 4) % 1; bb.setAttribute('opacity', lt > .5 && lt < 1.9 ? 1 - kk : 0); setT(bb, x + 20 + Math.sin(lt * 5 + i * 2) * 26, 600 - kk * 120, 0, .5 + kk * .7); });
    show(a, lt, .1, 960, 90, 0, 1.9); stampShow(st, lt, 2.4, 1450, 330, -10); show(b, lt, 2.7, 960, 1010);
  };
});
// 5  clan leaves
B(5, (g, u) => {
  const sc = scenery(g, { sky: 'grey', hill: HGREY, clouds: 4, wind: 1 }), g1 = gerG(g), g2 = gerG(g);
  const sheep = Array.from({ length: 12 }, (_, i) => ({ s: sheepG(g, .9), x: 700 + rnd() * 700, y: 760 + rnd() * 190, ph: rnd() * 6, v: 130 + rnd() * 50 }));
  const cart = cartG(g), ger3 = gerG(cart.load), horse = H(g, { coat: '#6b6b6b', rider: C.chief }), cart2 = cartG(g), hz2 = H(g, { coat: '#a0703c' });
  const hoe = P(g, C.hoe), tem = P(g, C.tem), kha = P(g, C.kha), tmn = P(g, C.tmn);
  const el1 = P(g, C.eld), el2 = P(g, C.eld2);
  const a = tagG(u, 'NO CHIEF', 62, { fill: '#7b241c' }), b = tagG(u, 'THEY LEAVE', 62);
  return (lt, p, d) => {
    sc(lt); const h1 = 1 - lin(lt, .4, 1.5), h2 = 1 - lin(lt, .8, 1.9);
    g1.g.setAttribute('display', h1 > .02 ? 'inline' : 'none'); g2.g.setAttribute('display', h2 > .02 ? 'inline' : 'none'); g1.set(1000, 800, 1.1, h1); g2.set(1350, 820, 1.15, h2);
    sheep.forEach(s => s.s.set(s.x + Math.max(0, lt - .5) * s.v * 1.3, s.y, lt, s.ph));
    const m = Math.max(0, lt - .8);
    ger3.set(-10, -70, .6, 1); cart.set(500 + m * 150, 880, .9, m * 3); horse.place(500 + m * 150 + 330, 880, .9, 1, 0, horse.gallop(lt, 8, 20, m > 0));
    horse.rider.place(-8, -182 + 112, 1, 1, 0, 0); cart2.set(120 + m * 140, 960, .75, m * 3); hz2.place(120 + m * 140 + 260, 960, .75, 1, 0, hz2.gallop(lt + .3, 8, 20, m > 0));
    el1.place(1300 + m * 120, 900, 1, 1, 0, el1.walk(lt, 8, 18, m > 0)); el2.place(1500 + m * 120, 930, 1, 1, 0, el2.walk(lt + 1, 8, 18, m > 0));
    hoe.place(1560, 930, 1, -1, 0, 0); hoe.walk(lt, 9, 0, false); tem.place(1650, 950, 1.1, -1, 0, 0); tem.walk(lt, 9, 0, false); kha.place(1740, 960, 1.1, -1); kha.walk(lt, 9, 0, false); tmn.place(1810, 975, 1.1, -1); tmn.walk(lt, 9, 0, false);
    hoe.mark('?', lt, 1.6, 3.0); tem.mark('s', lt, 2.2, 3.8); hoe.mark('a', lt, 3.1, 4.9);
    show(a, lt, .2, 960, 100, -2, 2.4); show(b, lt, 2.5, 960, 100, 2);
  };
});
// 6  abandoned on the open steppe
B(6, (g, u) => {
  const sc = scenery(g, { sky: 'grey', hill: HGREY, clouds: 4, wind: 1, h: 600 });
  const dust = [0, 1, 2, 3].map(() => mk(g, '<ellipse rx="60" ry="26" fill="#cfc7b0"/>')), far = Array.from({ length: 8 }, () => sheepG(g, .22));
  const hoe = P(g, C.hoe), tem = P(g, C.tem), kha = P(g, C.kha), tmn = P(g, C.tmn);
  const l1 = tagG(u, 'TEMÜJIN', 50, { fill: '#2f63c9' }), l2 = tagG(u, 'HÖELUN', 50, { fill: '#7d3c98' }), l3 = tagG(u, 'ABANDONED', 120, { fill: '#7b241c' });
  return (lt, p, d) => {
    sc(lt);
    dust.forEach((s, i) => { const k = (lt * .25 + i / 4) % 1; s.setAttribute('opacity', (.7 * (1 - k)).toFixed(2)); setT(s, 1350 + lt * 40 + k * 300, 590 - k * 30, 0, .6 + k); });
    far.forEach((s, i) => s.set(1350 + lt * 55 + i * 40, 590 + (i % 3) * 12, lt, i));
    hoe.place(840, 880, 1.15, 1, 0, Math.abs(Math.sin(lt * 1.5)) * 3); hoe.walk(lt, 9, 0, false); tem.place(1010, 900, 1.25, 1, 0, 0); tem.walk(lt, 9, 0, false); kha.place(1110, 910, 1.25, 1); kha.walk(lt, 9, 0, false); tmn.place(740, 905, 1.25, 1); tmn.walk(lt, 9, 0, false);
    tem.tilt(Math.sin(lt * 1.2) * 12); hoe.tilt(Math.sin(lt * 1.2 + 1) * 10); tem.mark('?', lt, 1.0, 2.5); kha.mark('s', lt, 1.8, 3.2);
    show(l1, lt, .2, 1010, 560, -2, 2.2); show(l2, lt, 1.1, 840, 520, 2, 2.6); show(l3, lt, 3.1, 960, 220, -3, 1e9, 1, true);
  };
});
// 7  death sentence
B(7, (g, u) => {
  const sc = scenery(g, { sky: 'storm', hill: HSTORM, clouds: 6, cloudC: '#59606e', wind: 1, h: 620, grassC: '#2f3a28' });
  const fam = [P(g, C.hoe), P(g, C.tem), P(g, C.kha), P(g, C.tmn)], vult = [0, 1].map(() => mk(g, '<path d="M-50 0 Q-25 -26 0 0 Q25 -26 50 0 Q25 -10 0 12 Q-25 -10 -50 0 Z" fill="#1a1a1a"/>')), t = tagG(u, 'A DEATH SENTENCE', 100, { fill: '#7b241c' });
  return (lt, p, d) => {
    sc(lt); const xs = [760, 900, 1000, 660]; fam.forEach((f, i) => { f.place(xs[i] + Math.sin(lt * 40 + i) * 3, 900 + (i % 2) * 20, 1.15, 1, 0, 0); f.walk(lt, 9, 0, false); });
    fam[1].mark('s', lt, .5, 2.6);
    vult.forEach((v, i) => { const a = lt * 1.5 + i * 3.1; setT(v, 900 + Math.cos(a) * 420, 250 + Math.sin(a) * 60 + i * 50, Math.sin(lt * 8) * 6, 1.5 + Math.sin(lt * 9 + i) * .3, 1.2 + Math.sin(lt * 9 + i) * .4); });
    show(t, lt, .5, 960, 200, -3, 1e9, 1, true);
  };
});
// 8  they survive: roots, berries, onions, fish, shooting
B(8, (g, u) => {
  const sc = scenery(g, { sky: 'day', sun: [1500, 160], clouds: 3, grass: 70 });
  const river = mk(g, '<path d="M1060 700 Q1400 730 1960 700 L1960 800 Q1500 835 1020 780 Z" fill="#2f63c9"/><path d="M1200 735 q40 -10 80 0 t80 0 M1500 765 q40 -10 80 0 t80 0 M1750 735 q40 -10 80 0 t80 0" stroke="#bfe0ff" stroke-width="5" fill="none"/>');
  const bush = bushG(g), onions = Array.from({ length: 3 }, (_, i) => mk(g, '<path d="M0 0 L-8 -50 M0 0 L8 -50 M0 0 L0 -56" stroke="#6bbf4e" stroke-width="7" stroke-linecap="round"/><ellipse cy="6" rx="15" ry="12" fill="#cdb4db" stroke="#1a1a1a" stroke-width="4"/>'));
  const hoe = P(g, Object.assign({}, C.hoe, { holdR: '<line x1="0" y1="0" x2="50" y2="60" stroke="#6b4a2a" stroke-width="9" stroke-linecap="round"/>' })), tmn = P(g, C.tmn), kch = P(g, C.kch), tem = P(g, Object.assign({}, C.tem, { holdR: '<line x1="0" y1="0" x2="120" y2="-90" stroke="#6b4a2a" stroke-width="7" stroke-linecap="round"/><path d="M120 -90 Q120 -30 100 0" stroke="#fff" stroke-width="2" fill="none"/>' }));
  const kha = P(g, Object.assign({}, C.kha, { holdL: bowMk })), mar = mk(g, '<ellipse rx="26" ry="20" fill="#a0703c" stroke="#1a1a1a" stroke-width="4"/><circle cx="14" cy="-8" r="3" fill="#1a1a1a"/>');
  const fish = mk(g, fishMk()), roots = mk(g, '<path d="M0 0 L-6 40 M0 0 L8 36 M0 0 L0 46" stroke="#b5835a" stroke-width="9" stroke-linecap="round"/><circle r="9" fill="#8a6a40" stroke="#1a1a1a" stroke-width="3"/>'), arr = mk(g, arrowMk);
  const tgs = [['ROOTS', 260, '#8a5a2b'], ['BERRIES', 640, '#c0392b'], ['WILD ONIONS', 950, '#7d3c98'], ['FISH', 1330, '#2f63c9'], ['SHOOT!', 1700, '#1e8449']].map(([s, x, c]) => [tagG(u, s, 46, { fill: c }), x]), tt = [1.5, 2.4, 3.3, 4.7, 6.3];
  const first = tagG(u, 'THEY SURVIVE ANYWAY', 70, { fill: '#1e8449' });
  return (lt, p, d) => {
    sc(lt);
    const dg = Math.sin(lt * 4); hoe.place(260, 900, 1.15, 1, 18, Math.abs(dg) * 3); hoe.walk(lt, 9, 0, false); hoe.arm('R', -20 + dg * 30); hoe.arm('L', 10); setT(roots, 340, 900 - Math.max(0, dg) * 30, 0, 1);
    setT(bush, 700, 910, 0, 1.3); const bb = Math.sin(lt * 5); tmn.place(560, 930, 1.35, 1, 0, Math.abs(bb) * 3); tmn.walk(lt, 9, 0, false); tmn.arm('R', -70 - bb * 25);
    kch.place(900, 930, 1.5, 1, 14, 0); kch.walk(lt, 9, 0, false); const ob = (lt * .9) % 1; kch.arm('R', -30 - Math.sin(lt * 5) * 30);
    onions.forEach((o, i) => setT(o, 840 + i * 60, 930 + (i === Math.floor(lt * .9) % 3 ? -ob * 20 : 0), 0, .9));
    tem.place(1180, 880, 1.25, 1, 0, 0); tem.walk(lt, 9, 0, false); tem.arm('R', -50 + Math.sin(lt * 3) * 10); const fk = (lt * .7) % 1; fish.setAttribute('opacity', fk > .55 && fk < .95 ? 1 : 0); setT(fish, 1420 + fk * 60, 760 - Math.sin(Math.PI * clamp((fk - .55) / .4)) * 160, fk * 360, 1);
    kha.place(1640, 900, 1.35, 1, 0, 0); kha.walk(lt, 9, 0, false); kha.arm('L', -88); const shoot = (lt * .85) % 1; kha.arm('R', -80 + shoot * 20);
    const mm = Math.max(0, Math.sin(lt * 2.2)); setT(mar, 1850, 840 - mm * 30, 0, 1, mm * .5 + .5);
    arr.setAttribute('opacity', shoot > .3 && shoot < .75 ? 1 : 0); setT(arr, lerp(1720, 1850, lin(shoot, .3, .75)), lerp(790, 830, lin(shoot, .3, .75)) - Math.sin(Math.PI * lin(shoot, .3, .75)) * 30, 10);
    tgs.forEach(([tg, x], i) => show(tg, lt, tt[i], x, 560, i % 2 ? 2 : -2, i < 4 ? tt[i + 1] + .4 : 1e9)); show(first, lt, .1, 960, 120, 0, 1.4);
  };
});
// 9  QUICK SIDE QUEST title card + Tick
B(9, (g, u) => {
  el('rect', { x: -100, y: -100, width: 2120, height: 1300, fill: '#ff7a10' }, g); const rays = mk(g, Array.from({ length: 14 }, (_, i) => `<path d="M0 0 L${Math.cos(i / 14 * 6.283) * 2400} ${Math.sin(i / 14 * 6.283) * 2400} L${Math.cos((i + .5) / 14 * 6.283) * 2400} ${Math.sin((i + .5) / 14 * 6.283) * 2400} Z" fill="#ff9a3c"/>`).join(''));
  const tk = tickG(g), a = bigG(u, 'QUICK', 190), b = bigG(u, 'SIDE QUEST', 190);
  return (lt, p, d) => {
    setT(rays, 960, 540, lt * 14); const k = pop(lt, .05, .4); setT(tk, 400, 1010, Math.sin(lt * 10) * 3, .5 * k, .5 * k * (1 + .03 * Math.sin(lt * 14)));
    show(a, lt, .1, 1260, 440, -4, 1e9, 1, true); show(b, lt, .25, 1260, 640, 3, 1e9, 1, true);
  };
});
// 10 life on the steppe is hard
B(10, (g, u) => {
  const sc = scenery(g, { sky: 'grey', hill: HGREY, clouds: 5, wind: 1 }), rb = ribbon(u), ger = gerG(g), smoke = [0, 1, 2].map(() => mk(g, '<circle r="20" fill="#e5e5e5" opacity=".7"/>'));
  const sheep = Array.from({ length: 6 }, () => ({ s: sheepG(g, 1), x: rnd() * 800, y: 800 + rnd() * 150, v: 60 + rnd() * 30, ph: rnd() * 5 }));
  const man = P(g, C.nomM), wom = P(g, Object.assign({}, C.nomW, { holdL: '<line x1="-10" y1="-30" x2="-10" y2="-70" stroke="#4a2f15" stroke-width="5"/><path d="M-30 -30 L-26 20 L6 20 L10 -30 Z" fill="#8a5a2b" stroke="#1a1a1a" stroke-width="4"/>', holdR: '<line x1="10" y1="-30" x2="10" y2="-70" stroke="#4a2f15" stroke-width="5"/><path d="M-10 -30 L-6 20 L26 20 L30 -30 Z" fill="#8a5a2b" stroke="#1a1a1a" stroke-width="4"/>' }));
  const a = tagG(u, 'LIFE ON THE STEPPE', 66), b = tagG(u, 'HARD', 90, { fill: '#7b241c' });
  return (lt, p, d) => {
    sc(lt); rb(lt); ger.set(1400, 800, 1.2); smoke.forEach((s, i) => { const k = (lt * .5 + i / 3) % 1; s.setAttribute('opacity', .7 * (1 - k)); setT(s, 1400 + 12 + k * 100, 580 - k * 150, 0, .8 + k); });
    sheep.forEach(s => s.s.set(((s.x + lt * s.v) % 1400) + 100, s.y, lt, s.ph));
    const mx = lerp(-150, 1000, lin(lt, 0, 3.3)); man.place(mx, 920, 1.15, 1, 8, man.walk(lt, 8, 20)); man.mark('s', lt, 1.2, 3.0);
    wom.place(lerp(2050, 1000, lin(lt, 0, 3.3)), 960, 1.1, -1, 0, wom.walk(lt, 8, 18)); wom.arm('L', 10); wom.arm('R', -10);
    show(a, lt, .2, 960, 120, -1); show(b, lt, 1.4, 1500, 460, 4, 1e9, 1, true);
  };
});
// 11 gers on a cart
B(11, (g, u) => {
  const sc = scenery(g, { sky: 'warm', sun: [1650, 170], clouds: 3 }), rb = ribbon(u), ger = gerG(g), cart = cartG(g), hz = H(g, { coat: '#8b5a2b', blanket: '#2f63c9' });
  const rolls = Array.from({ length: 6 }, (_, i) => mk(g, `<rect x="-50" y="-17" width="100" height="34" rx="17" fill="${['#f2ead8', '#e8dfc8', '#d9ccaa'][i % 3]}" stroke="#1a1a1a" stroke-width="5"/>`));
  const bundle = mk(g, '<g stroke="#1a1a1a" stroke-width="6"><rect x="-90" y="-60" width="180" height="60" rx="26" fill="#e8dfc8"/><path d="M-40 -60 V0 M20 -60 V0" stroke="#2f63c9" stroke-width="7"/></g>');
  const m1 = P(g, C.nomM), m2 = P(g, C.fst), w1 = P(g, C.nomW), clock = mk(u, '<circle r="90" fill="#fff" stroke="#1a1a1a" stroke-width="10"/><path d="M0 -70 V0" stroke="#1a1a1a" stroke-width="8" stroke-linecap="round" class="mh"/><path d="M0 0 L40 20" stroke="#d62d20" stroke-width="8" stroke-linecap="round" class="hh"/>', { opacity: 0 });
  const tg = tagG(u, '1 HOUR!', 90, { fill: '#2f63c9' }), tg0 = tagG(u, 'GERS = FELT TENTS', 60);
  const pk = (t, a, b) => lin(t, a, b);
  return (lt, p, d) => {
    sc(lt); rb(lt); const col = pk(lt, 2.4, 5.4), go = Math.max(0, lt - 6.2), cx = 1280 + go * go * 120 + go * 380;
    ger.set(620, 860, 1.5, 1 - easeIO(col) * .96); ger.g.setAttribute('display', col < .99 ? 'inline' : 'none');
    cart.set(cx, 880, 1, go * 2.2); hz.place(cx + 330, 880, .95, 1, 0, hz.gallop(lt, 9, 24, go > 0));
    rolls.forEach((r, i) => { const a = 2.6 + i * .5, k = pk(lt, a, a + .7); r.setAttribute('opacity', k > 0 ? 1 : 0); const x0 = 650 + i * 12, y0 = 770 - i * 8, x1 = cx - 80 + (i % 3) * 70, y1 = 790 - Math.floor(i / 3) * 34; setT(r, k < 1 ? lerp(x0, x1, k) : x1 + go * go * 0 + (cx - 1280), (k < 1 ? lerp(y0, y1, k) - Math.sin(Math.PI * k) * 140 : y1), k < 1 ? k * 720 : 0, .75); });
    const bk = pk(lt, 5.2, 5.8); bundle.setAttribute('opacity', bk > 0 ? 1 : 0); setT(bundle, cx - 10, 740 - (1 - easeOut(bk)) * 200, 0, .95);
    const act = lt > 2 && lt < 5.6, ph = Math.sin(lt * 5);
    m1.place(lerp(780, 980, Math.abs(Math.sin(lt * 1.4))), 930, 1.1, 1, 6, m1.walk(lt, 8, 22, act || lt < 2)); m2.place(lerp(1050, 760, Math.abs(Math.sin(lt * 1.2 + 1))), 950, 1.1, -1, 6, m2.walk(lt, 8, 22, act)); w1.place(540, 980, 1.1, 1, 0, 0); w1.walk(lt, 9, 0, false); w1.arm('R', -40 + ph * 30);
    [m1, m2, w1].forEach(q => q.g.setAttribute('display', lt > 6.2 ? 'none' : 'inline'));
    const ck = pop(lt, 5.6, .4) * (1 - lin(lt, 7.4, 7.9)); clock.setAttribute('opacity', ck > .02 ? 1 : 0); setT(clock, 960, 470, 0, ck); clock.querySelector('.mh').setAttribute('transform', `rotate(${lt * 900})`); clock.querySelector('.hh').setAttribute('transform', `rotate(${lt * 75})`);
    show(tg, lt, 5.7, 960, 640, -3, 7.6); show(tg0, lt, .3, 960, 120, 0, 2.4);
  };
});
// 12 kids ride and shoot
B(12, (g, u) => {
  const sc = scenery(g, { sky: 'day', sun: [300, 170], clouds: 4, grass: 100 }), rb = ribbon(u);
  const tgt = mk(g, '<g stroke="#1a1a1a" stroke-width="6"><rect x="-70" y="-120" width="140" height="120" rx="14" fill="#d8b866"/><circle cx="0" cy="-62" r="50" fill="#fff"/><circle cx="0" cy="-62" r="34" fill="#e2362b"/><circle cx="0" cy="-62" r="16" fill="#fff"/></g>');
  const k1 = H(g, { coat: '#a0703c', rider: Object.assign({}, C.kidA, { holdL: bowMk }) }), k2 = H(g, { coat: '#555', mane: '#111', rider: Object.assign({}, C.kidB, { holdL: bowMk }) });
  const arrs = Array.from({ length: 7 }, () => mk(g, arrowMk, { opacity: 0 })), a = tagG(u, 'RIDING FIRST', 64, { fill: '#2f63c9' }), b = tagG(u, 'BOWS AT AGE 5-6', 64, { fill: '#c0392b' }), bul = tagG(u, 'BULLSEYE!', 70, { fill: '#1e8449' });
  const L = [.9, 1.8, 2.7, 3.5, 4.2, 5.0, 5.8];
  return (lt, p, d) => {
    sc(lt); rb(lt); setT(tgt, 1650, 840, 0, 1.5);
    const x1 = ((lt * 330 + 100) % 2300) - 300, x2 = ((lt * 260 + 1100) % 2300) - 300;
    const b1 = k1.gallop(lt, 11, 30), b2 = k2.gallop(lt + .5, 11, 30); k1.place(x1, 900, .8, 1, 0, b1); k2.place(x2, 960, .65, 1, 0, b2);
    k1.rider.place(-8, -182 + 55, 1, 1, 0, 0); k2.rider.place(-8, -182 + 46, 1, 1, 0, 0); k1.rider.arm('L', -85); k2.rider.arm('L', -85);
    arrs.forEach((ar, i) => { const t0 = L[i], k = lin(lt, t0, t0 + .5); ar.setAttribute('opacity', lt >= t0 ? 1 : 0); const sx = i % 2 ? Math.min(x2 + 120, 1500) : Math.min(x1 + 130, 1500), sy = i % 2 ? 840 : 790; if (k < 1) setT(ar, lerp(sx, 1600, k), lerp(sy, 770 + i * 10, k) - Math.sin(Math.PI * k) * 60, -10 + k * 25, 1); else setT(ar, 1595, 770 + i * 10, 15, 1); });
    show(a, lt, .2, 700, 130, -2, 3.0); show(b, lt, 3.2, 1300, 130, 2); show(bul, lt, 5.0, 1650, 590, 4, 6.4, 1, true);
  };
});
// 13 horses: ride, trade, airag
B(13, (g, u) => {
  const sc = scenery(g, { sky: 'warm', sun: [1450, 200], clouds: 3 }), rb = ribbon(u);
  const herd = Array.from({ length: 5 }, (_, i) => H(g, { coat: ['#8b5a2b', '#555', '#c9a66b', '#3a2a1c', '#a0703c'][i] }));
  const rid = H(g, { coat: '#8b5a2b', blanket: '#c0392b', rider: C.war }), mA = P(g, C.nomM), mB = P(g, C.fst), hz = H(g, { coat: '#c9a66b' }), pouch = mk(g, '<circle r="16" fill="#8a5a2b" stroke="#1a1a1a" stroke-width="4"/><path d="M-8 -14 L8 -14" stroke="#1a1a1a" stroke-width="5"/>');
  const dr = P(g, Object.assign({}, C.nomM, { deel: '#2874a6', holdR: bowlMk })), bag = mk(g, '<path d="M-26 -40 Q-40 0 -20 30 Q0 40 20 30 Q40 0 26 -40 Z" fill="#d9c9a3" stroke="#1a1a1a" stroke-width="5"/><rect x="-10" y="-54" width="20" height="18" fill="#8a5a2b" stroke="#1a1a1a" stroke-width="4"/>');
  const fz = [0, 1, 2, 3].map(() => mk(g, '<circle r="9" fill="#fff" stroke="#1a1a1a" stroke-width="3"/>')), t1 = tagG(u, 'RIDE', 64, { fill: '#2f63c9' }), t2 = tagG(u, 'TRADE', 64, { fill: '#7d3c98' }), t3 = tagG(u, 'DRINK: AIRAG (FERMENTED MILK)', 50, { fill: '#c0392b' });
  return (lt, p, d) => {
    sc(lt); rb(lt);
    herd.forEach((h, i) => { const x = ((lt * (140 + i * 18) + i * 500) % 2500) - 300; h.place(x, 690 + i * 6, .36, 1, 0, h.gallop(lt + i, 12, 30)); });
    rid.place(380 + Math.sin(lt * 1.3) * 40, 930, 1.0, 1, 0, rid.gallop(lt, 11, 30)); rid.rider.place(-8, -182 + 105, 1, 1, 0, 0);
    mA.place(800, 930, 1.15, 1, 0, 0); mA.walk(lt, 9, 0, false); mB.place(1180, 930, 1.15, -1, 0, 0); mB.walk(lt, 9, 0, false);
    hz.place(1010, 990, .62, 1, 0, hz.gallop(lt, 5, 6, false) * 0); const tp = (lt * .7) % 1, to = tp < .5; mA.arm('R', -70); mB.arm('R', -70);
    pouch.setAttribute('opacity', lt > 2.0 ? 1 : 0); setT(pouch, lerp(to ? 880 : 1100, to ? 1100 : 880, to ? tp * 2 : (tp - .5) * 2), 810 - Math.sin(Math.PI * ((tp * 2) % 1)) * 70);
    const dk = Math.abs(Math.sin(lt * 3)); dr.place(1560, 940, 1.15, 1, 0, 0); dr.walk(lt, 9, 0, false); dr.arm('R', -140 - dk * 20 * (lt > 3.4 ? 1 : 0)); setT(bag, 1720, 900, Math.sin(lt * 3) * 6, 1.2); dr.face(lt > 3.4 && dk > .5 ? 'o' : 'n');
    fz.forEach((f, i) => { const k = (lt * .8 + i / 4) % 1; f.setAttribute('opacity', lt > 3.4 ? 1 - k : 0); setT(f, 1560 + Math.sin(lt * 5 + i) * 30, 700 - k * 100, 0, .5 + k * .6); });
    show(t1, lt, .8, 380, 430, -3, 2.0); show(t2, lt, 2.0, 1000, 430, 2, 3.6); show(t3, lt, 3.7, 1300, 420, -1);
  };
});
// 14 horse blood: FACT
B(14, (g, u) => {
  const sc = scenery(g, { sky: 'dawn', hill: HDAWN, sun: [1500, 560], sunC: '#fff3b0', clouds: 4, wind: 1 }), rb = ribbon(u);
  const war = H(g, { coat: '#6e4b2a', blanket: '#922b21', rider: Object.assign({}, C.war, { holdR: '<path d="M-14 -4 L14 -4 L10 22 L-10 22 Z" fill="#c9a66b" stroke="#1a1a1a" stroke-width="4"/><ellipse cy="-4" rx="14" ry="4" fill="#c0392b" stroke="#1a1a1a" stroke-width="3"/>' })});
  const dr = [0, 1].map(() => mk(g, '<path d="M0 -14 Q12 4 0 12 Q-12 4 0 -14 Z" fill="#c0392b" stroke="#1a1a1a" stroke-width="3"/>'));
  const a = tagG(u, 'LONG RIDES', 60), b = tagG(u, 'TRAVELERS LATER WROTE...', 56, { fill: '#6e4b2a' }), st = stampG(u, 'F');
  return (lt, p, d) => {
    sc(lt); rb(lt); const stop = lin(lt, 2.2, 3.2), x = lerp(-300, 700, easeOut(lin(lt, 0, 3.2))) + (lt > 3.2 ? 0 : 0) + lin(lt, 5.4, 6.9) * 1400, mv = lt < 3.2 || lt > 5.4;
    const by = war.gallop(lt, 8, 22 * (1 - (lt > 3.2 && lt < 5.4 ? 1 : 0)), mv); war.place(x, 900, 1.15, 1, 0, by); war.rider.place(-8, -182 + 112, 1, 1, 0, 0);
    const sip = lt > 3.4 && lt < 5.2; war.rider.arm('R', sip ? -150 - Math.sin(lt * 5) * 12 : -50);
    dr.forEach((q, i) => { const k = (lt * 1.2 + i / 2) % 1; q.setAttribute('opacity', sip ? 1 - k : 0); setT(q, x + 150 + Math.sin(lt * 4) * 5, 700 + k * 70, 0, .7); });
    show(a, lt, .2, 960, 110, 0, 2.4); show(b, lt, 3.3, 960, 1010); stampShow(st, lt, 4.9, 1480, 330, -8);
  };
});
// 15 Hoelun: ancestors
B(15, (g, u) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, sun: [260, 560], sunC: '#ffb26b', clouds: 3, grassC: '#4d5530' });
  const cl = mk(g, '<g fill="#fff6dc" opacity=".35"><ellipse cx="0" cy="0" rx="560" ry="150"/><ellipse cx="-200" cy="-60" rx="260" ry="110"/><ellipse cx="220" cy="-50" rx="280" ry="120"/></g>');
  const anc = [0, 1, 2].map(i => ({ p: P(g, Object.assign({}, C.anc, { s: .9 - i * .08 })), glow: mk(g, '<circle r="110" fill="url(#gHalo)"/>', { opacity: 0 }) }));
  const hoe = P(g, C.hoe), kids = [P(g, C.tem), P(g, C.kha), P(g, C.tmn), P(g, C.kch)];
  const a = tagG(u, 'YOUR ANCESTORS', 62, { fill: '#b7950b' }), b = tagG(u, 'YOU ARE NOT NOBODIES', 66, { fill: '#7d3c98' });
  return (lt, p, d) => {
    sc(lt); setT(cl, 1300, 360, 0, 1); cl.setAttribute('opacity', pop(lt, 1.6, .6));
    anc.forEach((q, i) => { const k = pop(lt, 2.2 + i * .9, .5); q.p.g.setAttribute('display', k > .01 ? 'inline' : 'none'); q.p.place(1010 + i * 290, 460 + Math.sin(lt * 2 + i) * 14, k * 1, 1, 0, 0); q.p.walk(lt, 9, 0, false); q.p.g.setAttribute('opacity', .8); q.glow.setAttribute('opacity', k > .01 ? .9 : 0); setT(q.glow, 1010 + i * 290, 340 + Math.sin(lt * 2 + i) * 14, 0, k * 1.4); });
    hoe.place(560, 930, 1.3, 1, 0, Math.abs(Math.sin(lt * 4)) * 3); hoe.walk(lt, 9, 0, false); hoe.arm('R', lt > 2 ? -150 + Math.sin(lt * 5) * 10 : -40 + Math.sin(lt * 6) * 25); hoe.arm('L', -30 + Math.sin(lt * 5) * 25);
    kids.forEach((k, i) => { k.place(880 + i * 130, 960 + (i % 2) * 15, 1.25, -1, 0, Math.abs(Math.sin(lt * 2 + i)) * 4); k.walk(lt, 9, 0, false); k.tilt(Math.sin(lt * 2.5 + i) * 7); });
    kids[0].mark('!', lt, 4.4, 6.0);
    show(a, lt, 2.1, 1300, 100, -2, 5.2); show(b, lt, 5.4, 960, 1010, 0);
  };
});
// 16 years later: mother's word is law
B(16, (g, u) => {
  const sc = scenery(g, { sky: 'dawn', hill: HDAWN, sun: [1500, 520], sunC: '#fff3b0', clouds: 4, wind: 1 });
  const tem = P(g, Object.assign({}, C.temA, { beard: 1, hair: '#3a2415', hatC: '#7a4a2a' })), hoe = P(g, Object.assign({}, C.hoe, { skin: '#e0b48a' }));
  const a = tagG(u, 'YEARS LATER', 64), b = tagG(u, "MOM'S WORD = LAW", 70, { fill: '#7d3c98' });
  return (lt, p, d) => {
    sc(lt); tem.place(1300, 990, 1.6, -1, 0, Math.abs(Math.sin(lt * 3)) * 3); tem.walk(lt, 9, 0, false); tem.arm('L', -75); tem.arm('R', -75); tem.tilt(Math.sin(lt * 3) * 8); tem.mark('s', lt, 1.2, 3.8);
    hoe.place(640, 960, 1.15, 1, 0, 0); hoe.walk(lt, 9, 0, false); hoe.arm('R', -110 + Math.sin(lt * 9) * 14); hoe.arm('L', 15); hoe.mark('a', lt, .6, 2.4);
    show(a, lt, .2, 960, 120); show(b, lt, 1.9, 960, 1000, -2, 1e9, 1, true);
  };
});
// 17 darkest moment
B(17, (g, u) => {
  const sc = scenery(g, { sky: 'storm', hill: HNIGHT, clouds: 6, cloudC: '#3a4150', h: 640, grassC: '#1c2a24', wind: 1 }), tem = P(g, C.tem);
  const rain = Array.from({ length: 70 }, () => ({ p: el('line', { stroke: '#cfe6ff', 'stroke-width': 3, opacity: .6 }, g), x: rnd() * 2200, y: rnd() * 1100, v: 900 + rnd() * 400 }));
  const rock = mk(g, '<ellipse rx="90" ry="40" fill="#5c6670" stroke="#1a1a1a" stroke-width="6"/>'), fl = el('rect', { width: 1920, height: 1080, fill: '#fff', opacity: 0 }, g), t = tagG(u, 'THE DARKEST MOMENT', 90, { fill: '#7b241c' });
  return (lt, p, d) => {
    sc(lt); setT(rock, 960, 920); tem.place(960, 905, 1.6, 1, 0, 0); tem.walk(lt, 9, 0, false); tem.tilt(14); tem.arm('L', -30); tem.arm('R', 30); tem.face('n');
    rain.forEach(r => { const y = (r.y + lt * r.v) % 1200, x = (r.x - lt * 200 + 2200) % 2200; r.p.setAttribute('x1', x); r.p.setAttribute('y1', y - 40); r.p.setAttribute('x2', x - 10); r.p.setAttribute('y2', y); });
    fl.setAttribute('opacity', ((lt > .25 && lt < .35) || (lt > .6 && lt < .66) ? .8 : 0)); show(t, lt, .4, 960, 250, -2, 1e9, 1, true);
  };
});
// 18 Begter takes the food
B(18, (g, u) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, sun: [1600, 560], sunC: '#ffb26b', clouds: 3, grassC: '#4d5530' });
  const rack = mk(g, '<g stroke="#1a1a1a" stroke-width="6"><path d="M-110 0 L-110 -150 M110 0 L110 -150 M-120 -140 H120" stroke="#6b4423" stroke-width="10" fill="none"/></g>'), rf = [0, 1, 2, 3, 4].map(i => mk(g, fishMk(['#7fa6c9', '#9bb6c9', '#7fa6c9', '#8fb0d0', '#7fa6c9'][i])));
  const tem = P(g, Object.assign({}, C.tem, { holdL: bowMk })), kha = P(g, Object.assign({}, C.kha, { holdL: bowMk })), beg = P(g, C.beg), bf = mk(g, [0, 1, 2, 3, 4].map(i => `<g transform="translate(${i * 14 - 28} ${i * 6}) rotate(${i * 12 - 25})">${fishMk()}</g>`).join(''));
  const a = tagG(u, 'HIS HALF-BROTHER BEGTER', 54, { fill: '#e67e22' }), b = tagG(u, 'MINE NOW', 70, { fill: '#6e2c00' });
  return (lt, p, d) => {
    sc(lt); setT(rack, 980, 900, 0, 1.2); const taken = lt > 1.5;
    rf.forEach((f, i) => { f.setAttribute('display', taken ? 'none' : 'inline'); setT(f, 880 + i * 50, 790 + Math.sin(lt * 3 + i) * 3, 90 + Math.sin(lt * 3 + i) * 6, .7); });
    const bx = taken ? lerp(980, 2200, lin(lt, 1.5, 3.6)) : lerp(-200, 980, easeOut(lin(lt, 0, 1.5))); beg.place(bx, 910, 1.3, 1, 0, beg.walk(lt, 9, 20, true) * (lt > 1.5 ? 1 : 1)); beg.arm('R', -60); beg.face('a'); if (taken) beg.face('n');
    bf.setAttribute('opacity', taken ? 1 : 0); setT(bf, bx + 70, 800, 0, .9);
    tem.place(300, 960, 1.35, 1, 0, 0); tem.walk(lt, 9, 0, false); kha.place(440, 970, 1.35, 1); kha.walk(lt, 9, 0, false);
    tem.mark('a', lt, 1.8, 3.6); kha.mark('a', lt, 2.0, 3.6); tem.tilt(Math.sin(lt * 20) * (lt > 1.8 ? 5 : 0)); if (lt > 1.8) { tem.face('a'); kha.face('a'); }
    show(a, lt, .2, 960, 110); show(b, lt, 1.7, 1300, 450, 4, 1e9, 1, true);
  };
});
// 19 Temujin and Khasar hunt Begter (cartoon, non-graphic)
B(19, (g, u) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, sun: [260, 560], sunC: '#ffb26b', clouds: 3, grassC: '#4d5530' });
  const beg = P(g, C.beg), tem = P(g, Object.assign({}, C.tem, { holdL: bowMk })), kha = P(g, Object.assign({}, C.kha, { holdL: bowMk }));
  const a1 = mk(g, arrowMk, { opacity: 0 }), a2 = mk(g, arrowMk, { opacity: 0 }), pf = poof(g), fishes = [0, 1, 2].map(() => mk(g, fishMk()));
  const dark = el('rect', { width: 1920, height: 1080, fill: '#000', opacity: 0 }, g), a = tagG(u, 'THE BROTHERS HUNT HIM DOWN', 54, { fill: '#7b241c' });
  return (lt, p, d) => {
    sc(lt); const gone = lt > 3.1;
    beg.g.setAttribute('display', gone ? 'none' : 'inline'); beg.place(1450, 900, 1.35, -1, 0, Math.abs(Math.sin(lt * 5)) * 3); beg.walk(lt, 9, 0, false); beg.arm('R', -130 - Math.abs(Math.sin(lt * 5)) * 20); beg.hold('R', fishMk());
    const k = lin(lt, 0, 2.0), mv = k < 1;
    tem.place(lerp(-150, 520, easeOut(k)), 940, 1.4, 1, mv ? 10 : 0, tem.walk(lt, 10, 16, mv)); kha.place(lerp(-350, 330, easeOut(k)), 950, 1.4, 1, mv ? 10 : 0, kha.walk(lt, 10, 16, mv));
    if (lt > 2.2) { tem.arm('L', -90); tem.arm('R', -90); kha.arm('L', -90); kha.arm('R', -90); }
    tem.mark('!', lt, 3.4, 4.5); kha.mark('!', lt, 3.5, 4.5);
    [a1, a2].forEach((ar, i) => { const t0 = 2.6 + i * .1, kk = lin(lt, t0, t0 + .5); ar.setAttribute('opacity', kk > 0 && kk < 1 ? 1 : 0); setT(ar, lerp(i ? 520 : 700, 1380, kk), lerp(i ? 800 : 830, 790, kk), 0, 1.2); });
    const pk = lin(lt, 3.1, 3.5); pf.setAttribute('opacity', lt > 3.1 && lt < 3.9 ? 1 - lin(lt, 3.5, 3.9) : 0); setT(pf, 1450, 820 - pk * 30, 0, .6 + pk * 1.2);
    fishes.forEach((f, i) => { const kk = lin(lt, 3.1, 4.0); f.setAttribute('opacity', kk > 0 && kk < 1 ? 1 : 0); setT(f, 1450 + (i - 1) * 140 * kk, 820 - Math.sin(Math.PI * kk) * 200 + kk * 120, kk * 400, .8); });
    dark.setAttribute('opacity', .4 * lin(lt, 3.2, 4.2)); show(a, lt, .2, 960, 110, 0, 2.2);
  };
});
// 20 mother furious; one leader
B(20, (g, u) => {
  const sc = scenery(g, { sky: 'grey', hill: HGREY, clouds: 3, wind: 1 }), red = el('rect', { width: 1920, height: 1080, fill: '#e2362b', opacity: 0 }, g);
  const hoe = P(g, C.hoe), tem = P(g, C.tem), kha = P(g, C.kha), tmn = P(g, C.tmn), kch = P(g, C.kch), glow = mk(g, '<circle r="260" fill="url(#gHalo)"/>', { opacity: 0 });
  const a = tagG(u, 'MOTHER IS FURIOUS', 70, { fill: '#7b241c' }), b = tagG(u, 'ONE LEADER NOW', 80, { fill: '#b7950b' });
  return (lt, p, d) => {
    sc(lt); red.setAttribute('opacity', lt < 3.2 ? .1 + .06 * Math.sin(lt * 8) : 0); const g3 = lin(lt, 3.2, 4);
    hoe.place(760, 940, 1.5, 1, 0, 0); hoe.walk(lt, 9, 0, false); hoe.arm('R', -140 + Math.sin(lt * 12) * 25); hoe.arm('L', 10); hoe.face('a'); hoe.mark('a', lt, .3, 3.2); if (lt > 3.2) hoe.face('n');
    tmn.place(1310, 975, 1.4, -1, 0, 0); tmn.walk(lt, 9, 0, false); kch.place(1420, 985, 1.4, -1); kch.walk(lt, 9, 0, false); kha.place(1520, 970, 1.5, -1); kha.walk(lt, 9, 0, false);
    [tmn, kch, kha].forEach((q, i) => q.tilt(lt < 3.2 ? Math.sin(lt * 14 + i) * 4 : 0)); kha.mark('s', lt, 1.0, 3.0);
    const tx = lerp(1150, 1000, easeOut(g3)); tem.place(tx, 960 - g3 * 20, 1.5 + g3 * .5, 1, 0, 0); tem.walk(lt, 9, 0, false); tem.arm('R', g3 > 0 ? -170 : 0);
    glow.setAttribute('opacity', g3 * .9); setT(glow, tx, 520, 0, 1);
    show(a, lt, .2, 960, 110, -2, 3.0); show(b, lt, 3.3, 960, 1000, 0, 1e9, 1, true);
  };
});
// 21 the old clan decides to deal with him
B(21, (g, u) => {
  const sc = scenery(g, { sky: 'night', hill: HNIGHT, moon: [260, 150], clouds: 2, cloudC: '#3a4562', cloudO: .4, grassC: '#1c2a24' });
  const gr = gerG(g), fire = fireG(g), ch = P(g, C.chief), e1 = P(g, C.eld), e2 = P(g, C.eld2), msg = H(g, { coat: '#6b6b6b', rider: C.srch });
  const th = mk(g, '<g fill="#fff" stroke="#1a1a1a" stroke-width="5"><ellipse cx="0" cy="0" rx="190" ry="110"/><circle cx="-150" cy="130" r="22"/><circle cx="-190" cy="180" r="12"/></g>'), tm = P(th, C.temT), rs = [0, 1, 2].map(i => H(g, { coat: ['#444', '#7a5a3a', '#6b6b6b'][i], rider: C.srch }));
  const a = tagG(u, 'THE CLAN THAT LEFT THEM', 58, { fill: '#117a65' });
  return (lt, p, d) => {
    sc(lt); gr.set(250, 780, 1.1); fire.set(960, 930, lt, 1.2);
    ch.place(780, 900, 1.2, 1, 0, Math.abs(Math.sin(lt * 3)) * 3); ch.walk(lt, 9, 0, false); e1.place(1180, 920, 1.1, -1); e1.walk(lt, 9, 0, false); e2.place(500, 930, 1.1, 1); e2.walk(lt, 9, 0, false);
    const arr = lin(lt, 0, 1.3); msg.place(lerp(-400, 300, easeOut(arr)), 990, .85, 1, 0, msg.gallop(lt, 9, 24, arr < 1)); msg.rider.place(-8, -182 + 100 * 1.05, 1, 1, 0, 0); msg.g.setAttribute('display', lt > 3.3 ? 'none' : 'inline');
    ch.arm('R', lt > 1.3 ? -100 + Math.sin(lt * 6) * 10 : 0); ch.mark('!', lt, 1.4, 2.6); ch.face(lt > 2.6 ? 'a' : 'n'); e1.mark('?', lt, 1.6, 2.8); e2.mark('a', lt, 3.2, 4.8);
    const k = pop(lt, 1.5, .5); th.setAttribute('opacity', k > .01 ? 1 : 0); setT(th, 1560, 360, 0, k); const gw = lin(lt, 1.8, 3.4); tm.place(0, 80, .6 + gw * .5, 1, 0, 0); tm.walk(lt, 9, 0, false); tm.mg.setAttribute('display', 'none');
    rs.forEach((r, i) => { const t0 = 3.4 + i * .25, x = lerp(500, 2300, lin(lt, t0, t0 + 1.5)); r.g.setAttribute('display', lt > t0 ? 'inline' : 'none'); r.place(x, 990 - i * 20, .8, 1, 0, r.gallop(lt, 10, 26)); r.rider.place(-8, -182 + 100 * 1.05, 1, 1, 0, 0); });
    show(a, lt, .2, 960, 110, 0, 3.2);
  };
});
// 22 captured and put in a cangue
B(22, (g, u) => {
  const sc = scenery(g, { sky: 'grey', hill: HGREY, clouds: 4, wind: 1 });
  const tem = P(g, Object.assign({}, C.temT, { cangue: true })), g1 = P(g, C.guard), g2 = P(g, C.guard), cl = mk(u, '', {});
  const a = tagG(u, 'CAPTURED', 90, { fill: '#7b241c' }), b = tagG(u, 'A CANGUE', 80, { fill: '#8a5a2b' }), c = tagG(u, 'A PORTABLE PRISON', 62, { fill: '#555' }), ck = tagG(u, 'CLUNK!', 100, { fill: '#c0392b' });
  return (lt, p, d) => {
    sc(lt); const walk1 = lin(lt, 0, 2.0), seized = lt > 2.3, mv = lin(lt, 3.6, 6.4); let x = lt < 3.6 ? lerp(300, 780, walk1) : lerp(780, 1500, mv);
    const drop = lt < 2.7 ? -420 : (-420 * (1 - lin(lt, 2.7, 3.0)));
    tem.cg.setAttribute('transform', `translate(0 ${lt < 2.7 ? -420 : drop})`); tem.cg.setAttribute('opacity', lt >= 2.6 ? 1 : 0);
    const sq = lt > 3.0 && lt < 3.4 ? Math.sin(Math.PI * lin(lt, 3.0, 3.4)) * .1 : 0; tem.place(x, 930, 1.5 * (1 - sq), 1, lt > 3.4 ? Math.sin(lt * 7) * 2 : 0, tem.walk(lt, 8, lt > 3.6 ? 14 : 22, lt < 2.3 || lt > 3.6)); tem.face(lt > 2.3 ? 'o' : 'n'); if (lt > 3.0) tem.face('a');
    tem.mark('s', lt, 3.2, 6.0);
    const gx1 = lt < 2.3 ? lerp(2100, 1000, easeOut(lin(lt, .2, 2.3))) : x + 240, gx2 = lt < 2.3 ? lerp(-300, 640, easeOut(lin(lt, .4, 2.3))) : x - 240;
    g1.place(gx1, 960, 1.3, -1, 0, g1.walk(lt, 10, 24, lt < 2.3 || lt > 3.6)); g2.place(gx2, 960, 1.3, 1, 0, g2.walk(lt + .3, 10, 24, lt < 2.3 || lt > 3.6)); if (seized) { g1.arm('R', 60); g2.arm('L', -60); }
    show(a, lt, .2, 960, 120, -2, 1.9); show(ck, lt, 2.8, 960, 330, -5, 3.6, 1, true); show(b, lt, 3.8, 1250, 640, 3, 5.6); show(c, lt, 4.8, 1000, 1010, 0);
  };
});
// 23 feast escape: knock out the guard with the collar
B(23, (g, u) => {
  const sc = scenery(g, { sky: 'night', hill: HNIGHT, moon: [1700, 140], clouds: 2, cloudC: '#3a4562', cloudO: .4, grassC: '#1c2a24' });
  const fire = fireG(g), fs = [P(g, C.fst), P(g, C.eld), P(g, C.eld2), P(g, C.chief)], table = mk(g, '<g stroke="#1a1a1a" stroke-width="6"><rect x="-300" y="-70" width="600" height="46" rx="8" fill="#8a5a2b"/><rect x="-280" y="-24" width="30" height="90" fill="#6b4423"/><rect x="250" y="-24" width="30" height="90" fill="#6b4423"/><circle cx="-180" cy="-90" r="20" fill="#d4ac0d"/><circle cx="-40" cy="-90" r="20" fill="#c0392b"/><circle cx="110" cy="-90" r="20" fill="#d4ac0d"/><ellipse cx="220" cy="-86" rx="30" ry="14" fill="#c9a66b"/></g>');
  const tem = P(g, Object.assign({}, C.temT, { cangue: true })), gd = P(g, C.guard), bonk = tagG(u, 'BONK!', 130, { fill: '#c0392b' }), a = tagG(u, 'A FEAST', 70, { fill: '#b7950b' });
  const stars = [0, 1, 2].map(() => mk(g, '<path d="M0 -26 L8 -8 L28 -6 L12 6 L16 26 L0 14 L-16 26 L-12 6 L-28 -6 L-8 -8 Z" fill="#ffd84a" stroke="#1a1a1a" stroke-width="4"/>'));
  return (lt, p, d) => {
    sc(lt); fire.set(560, 940, lt, 1.4); setT(table, 760, 920, 0, 1.2);
    fs.forEach((f, i) => { f.place(320 + i * 210, 900, 1.15, i < 2 ? 1 : -1, 0, Math.abs(Math.sin(lt * 5 + i * 2)) * 4); f.walk(lt, 9, 0, false); f.arm('R', -110 + Math.sin(lt * 5 + i * 2) * 20); f.face(Math.sin(lt * 5 + i * 2) > 0 ? 'o' : 'n'); if (lt > 2.3) f.mark('!', lt, 2.3 + i * .1, 4.2); });
    const wind = lt > 1.5 && lt < 1.95 ? -lin(lt, 1.5, 1.95) * 16 : (lt >= 1.95 && lt < 2.2 ? -16 + lin(lt, 1.95, 2.2) * 50 : 0), run = lin(lt, 2.4, 4.4);
    tem.cg.setAttribute('transform', 'translate(0 0)'); tem.place(lerp(1250, 2250, easeIO(run)) , 940, 1.5, 1, lt < 2.4 ? wind : 0, tem.walk(lt, 12, 30, lt > 2.4)); tem.face(lt > 1.5 ? 'a' : 'n');
    const fly = lin(lt, 2.1, 3.1), gx = 1000; gd.place(lt < 2.1 ? 1060 : gx - fly * 700, 940 - Math.sin(Math.PI * fly) * 200 + fly * 60, 1.3, 1, fly * -520, 0); gd.walk(lt, 9, 0, false); if (lt > 2.1) gd.face('x');
    stars.forEach((s, i) => { const a = lt * 6 + i * 2.1; s.setAttribute('opacity', fly > 0 && fly < 1 ? 1 : 0); setT(s, gx - fly * 700 + Math.cos(a) * 60, 700 - Math.sin(Math.PI * fly) * 200 + Math.sin(a) * 20, lt * 90, .7); });
    show(a, lt, .1, 960, 110, 0, 1.6); show(bonk, lt, 2.1, 1050, 420, -6, 3.0, 1, true);
  };
});
// 24 hides in the river
B(24, (g, u) => {
  const sc = scenery(g, { sky: 'night', hill: HNIGHT, moon: [1500, 150], clouds: 2, cloudC: '#3a4562', cloudO: .4, h: 560, grassC: '#1c2a24' });
  const tem = P(g, Object.assign({}, C.temT, { cangue: true })), sr = [0, 1, 2].map(() => P(g, C.srch)), torch = [0, 1, 2].map(() => mk(g, '<rect x="-4" y="-50" width="8" height="50" fill="#6b4423"/><path d="M-12 -50 Q-16 -86 0 -100 Q16 -86 12 -50 Z" fill="#ff9a2e" stroke="#1a1a1a" stroke-width="3"/>'));
  const wat = mk(g, '<rect x="-100" y="0" width="2120" height="700" fill="#16406f" opacity=".92"/>'), waves = mk(g, Array.from({ length: 12 }, (_, i) => `<path d="M${100 + i * 170} ${60 + (i % 4) * 70} q30 -12 60 0 t60 0" stroke="#7fb4e6" stroke-width="5" fill="none" opacity=".7"/>`).join(''));
  const rip = [0, 1, 2].map(() => mk(g, '<ellipse rx="60" ry="14" fill="none" stroke="#bfe0ff" stroke-width="4"/>')), bub = [0, 1, 2, 3].map(() => mk(g, '<circle r="8" fill="none" stroke="#bfe0ff" stroke-width="3"/>')), a = tagG(u, 'HE HIDES IN THE RIVER', 60, { fill: '#2f63c9' });
  return (lt, p, d) => {
    sc(lt); const wy = 740; tem.place(900, wy + 296 + Math.sin(lt * 2) * 3, 1.5, 1, 0, 0); tem.walk(lt, 9, 0, false); tem.arm('L', 0); tem.arm('R', 0); tem.face(lt > 1.4 && lt < 2.4 ? 'o' : 'n'); tem.mark('s', lt, 1.2, 3.2);
    sr.forEach((s, i) => { const x = lerp(-200 - i * 420, 2000 - i * 100, lin(lt, 0, 3.4)), mv = true; s.place(x, 668 + i * 6, .62, 1, 0, s.walk(lt + i, 7, 18, mv)); setT(torch[i], x + 40, 620 + i * 6, Math.sin(lt * 8 + i) * 4, 1); });
    setT(wat, 0, wy); setT(waves, Math.sin(lt * 1.5) * 20, wy + 40);
    rip.forEach((r, i) => { const k = (lt * .6 + i / 3) % 1; r.setAttribute('opacity', 1 - k); setT(r, 900, wy + 20, 0, 1 + k * 2, 1 + k * 2); });
    bub.forEach((b2, i) => { const k = (lt * .9 + i / 4) % 1; b2.setAttribute('opacity', 1 - k); setT(b2, 960 + Math.sin(lt * 4 + i) * 20, wy + 120 - k * 110, 0, .6 + k * .6); });
    show(a, lt, .2, 960, 110);
  };
});
// 25 stranger hides him in the wool cart
B(25, (g, u) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, sun: [260, 560], sunC: '#ffb26b', clouds: 3, grassC: '#4d5530' });
  const cart = cartG(g), hz = H(g, { coat: '#a0703c' }), tem = P(g, Object.assign({}, C.temT, { cangue: true })), stg = P(g, C.stg);
  const wool = mk(g, '<g fill="#fbf3e0" stroke="#1a1a1a" stroke-width="5"><circle cx="-70" cy="-30" r="52"/><circle cx="0" cy="-60" r="62"/><circle cx="70" cy="-30" r="54"/><circle cx="-30" cy="-20" r="56"/><circle cx="30" cy="-20" r="56"/></g>'), tufts = [0, 1, 2, 3].map(() => mk(g, '<circle r="20" fill="#fbf3e0" stroke="#1a1a1a" stroke-width="4"/>'));
  const a = tagG(u, 'A STRANGER', 64, { fill: '#16a085' }), b = tagG(u, 'SHHH!', 80, { fill: '#555' });
  return (lt, p, d) => {
    sc(lt); const cx = 1230; cart.set(cx, 900, 1.1, 0); hz.place(cx + 380, 900, .9, 1, 0, hz.gallop(lt, 5, 3, false) + Math.sin(lt * 3) * 2); hz.rider;
    const sk = lin(lt, 0, 1.3); stg.place(lerp(1750, 880, easeOut(sk)), 930, 1.2, -1, 0, stg.walk(lt, 9, 20, sk < 1)); stg.mark('!', lt, 1.3, 2.2); if (lt > 1.5) { stg.arm('R', -150); stg.face('n'); }
    const tk = lin(lt, 2.0, 3.4), jump = Math.sin(Math.PI * lin(lt, 3.0, 3.5)) * 120; const tx = lt < 2.0 ? lerp(-100, 300, lin(lt, 0, 2.0)) : lerp(300, cx - 40, easeIO(tk));
    tem.cg.setAttribute('opacity', 1); tem.place(tx, 940 - (lt > 3.0 ? lerp(0, 60, lin(lt, 3.0, 3.5)) : 0) - jump, 1.45, 1, 0, tem.walk(lt, 9, 18, lt < 3.4)); tem.g.setAttribute('display', lt > 4.2 ? 'none' : 'inline');
    const wk = lin(lt, 3.5, 4.6); wool.setAttribute('opacity', wk > 0 ? 1 : 0); setT(wool, cx - 10, 790, 0, 1.1 * easeOut(wk) + .1);
    tufts.forEach((t, i) => { const k = lin(lt, 3.6 + i * .2, 4.4 + i * .1); t.setAttribute('opacity', k > 0 && k < 1 ? 1 : 0); setT(t, lerp(1180, cx - 10 + (i - 1.5) * 20, k), 760 - Math.sin(Math.PI * k) * 200, k * 300, .8); });
    show(a, lt, .2, 960, 110, 0, 2.0); show(b, lt, 1.9, 1000, 480, -4, 3.0, 1, true);
  };
});
// 26 searchers poke the wool with spears
B(26, (g, u) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, sun: [260, 560], sunC: '#ffb26b', clouds: 3, grassC: '#4d5530' });
  const cart = cartG(g), wool = mk(g, '<g fill="#fbf3e0" stroke="#1a1a1a" stroke-width="5"><circle cx="-80" cy="-30" r="56"/><circle cx="0" cy="-66" r="68"/><circle cx="80" cy="-30" r="58"/><circle cx="-34" cy="-20" r="60"/><circle cx="34" cy="-20" r="60"/></g>');
  const ss = [P(g, C.srch), P(g, C.srch)], sp = [mk(g, spearMk), mk(g, spearMk)], stg = P(g, C.stg), tufts = [0, 1, 2, 3].map(() => mk(g, '<circle r="18" fill="#fbf3e0" stroke="#1a1a1a" stroke-width="4"/>')), a = tagG(u, 'SEARCHERS!', 80, { fill: '#7b241c' });
  return (lt, p, d) => {
    sc(lt); cart.set(1400, 900, 1.15, 0); setT(wool, 1390, 790, 0, 1.2);
    ss.forEach((s, i) => { const ph = (lt * 1.7 + i * .5) % 1, th = Math.sin(Math.PI * Math.min(1, ph * 1.6)); const x = 760 + i * 120; s.place(x, 940 + i * 20, 1.25, 1, 0, 0); s.walk(lt, 9, 0, false); s.arm('R', -85); s.arm('L', -85); setT(sp[i], x + 120 + th * 190, 800 + i * 25 - 40, 0, 1.1); });
    tufts.forEach((t, i) => { const k = (lt * 1.7 + i * .25) % 1; t.setAttribute('opacity', 1 - k); setT(t, 1290 + (i % 2) * 40 - k * 80, 760 + i * 30 - Math.sin(Math.PI * k) * 80, k * 360, .8); });
    stg.place(1750, 950, 1.2, -1, 0, Math.abs(Math.sin(lt * 4)) * 3); stg.walk(lt, 9, 0, false); stg.mark('s', lt, .4, 2.2);
    show(a, lt, .1, 960, 110, -2, 1.6, 1, true);
  };
});
// 27 they miss
B(27, (g, u) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, sun: [260, 560], sunC: '#ffb26b', clouds: 2, grassC: '#4d5530' });
  const wool = mk(g, '<g fill="#fbf3e0" stroke="#1a1a1a" stroke-width="6"><circle cx="-150" cy="40" r="120"/><circle cx="0" cy="-30" r="150"/><circle cx="160" cy="40" r="124"/><circle cx="-60" cy="70" r="130"/><circle cx="70" cy="70" r="130"/></g>'), hat = mk(g, '<path d="M-14 0 L2 -34 L16 0 Z" fill="#c0392b" stroke="#1a1a1a" stroke-width="5"/>');
  const sp = [mk(g, spearMk), mk(g, spearMk)], t = tagG(u, 'MISS!', 190, { fill: '#1e8449' });
  return (lt, p, d) => {
    sc(lt); setT(wool, 960, 780, 0, 1.3); setT(hat, 1010, 560 + Math.sin(lt * 20) * 2, 0, 1.2);
    const k = lin(lt, 0, .5); setT(sp[0], lerp(300, 1010, k) - (1 - k) * 0, 360 + k * 220, 8 + k * 6, 1.8); setT(sp[1], lerp(1700, 920, k) , 760 - k * 120, 188 - k * 4, 1.8);
    show(t, lt, .12, 960, 300, -4, 1e9, 1, true);
  };
});
// 28 he gets away; remembers who betrayed and who saved him
B(28, (g, u) => {
  const sc = scenery(g, { sky: 'dawn', hill: HDAWN, sun: [960, 480], sunC: '#fff3b0', clouds: 4, wind: 1, h: 600 });
  const hz = H(g, { coat: '#8b5a2b', blanket: '#2f63c9', rider: C.temT }), stg = P(g, C.stg), pcs = portrait(u, C.chief, 600, 470, 150, '#e2362b'), pcg = portrait(u, C.stg, 1320, 470, 150, '#1e8449');
  const x1 = mk(u, '<circle r="90" fill="#fff" stroke="#1a1a1a" stroke-width="8"/><path d="M-50 -50 L50 50 M50 -50 L-50 50" stroke="#e2362b" stroke-width="26" stroke-linecap="round"/>'), ok = mk(u, '<circle r="90" fill="#fff" stroke="#1a1a1a" stroke-width="8"/><path d="M-60 0 L-18 44 L64 -48" stroke="#1e8449" stroke-width="28" stroke-linecap="round" fill="none"/>');
  const a = tagG(u, 'WHO BETRAYED HIM', 56, { fill: '#7b241c' }), b = tagG(u, 'WHO SAVED HIM', 56, { fill: '#1e8449' });
  return (lt, p, d) => {
    sc(lt); const x = -250 + lt * 430; hz.place(x, 930, .9, 1, 0, hz.gallop(lt, 10, 28)); hz.rider.place(-8, -182 + 92, 1, 1, 0, 0);
    stg.place(170, 960, 1.3, 1, 0, 0); stg.walk(lt, 9, 0, false); stg.arm('R', -150 + Math.sin(lt * 8) * 25); stg.arm('L', 10); stg.face('n');
    const k1 = pop(lt, 3.0, .45), k2 = pop(lt, 3.9, .45); setT(pcs.g, 600, 470 + (1 - k1) * 60, 0, k1); pcs.g.setAttribute('opacity', k1 > .01 ? 1 : 0); setT(pcg.g, 1320, 470 + (1 - k2) * 60, 0, k2); pcg.g.setAttribute('opacity', k2 > .01 ? 1 : 0);
    setT(x1, 700, 570, 0, k1 * .5); x1.setAttribute('opacity', k1 > .01 ? 1 : 0); setT(ok, 1420, 570, 0, k2 * .5); ok.setAttribute('opacity', k2 > .01 ? 1 : 0);
    show(a, lt, 3.1, 600, 700, -2); show(b, lt, 4.0, 1320, 700, 2);
  };
});

// ---------- per-frame ----------
window.render = function (t) {
  for (let i = 0; i < N; i++) {
    const b = BEAT[i], on = t >= BS[i] && t < BE[i] + .25;
    if (!on) { if (b.on !== false) { b.g.setAttribute('display', 'none'); b.on = false; } continue; }
    b.on = true; b.g.setAttribute('display', 'inline'); b.g.setAttribute('opacity', i === 0 ? 1 : lin(t, BS[i], BS[i] + .2).toFixed(3));
    const lt = t - BS[i], d = BE[i] - BS[i], p = clamp(lt / d), s = 1 + .05 * p;
    b.cam.setAttribute('transform', `translate(${b.focus[0]} ${b.focus[1]}) scale(${s}) translate(${-b.focus[0]} ${-b.focus[1]})`);
    b.upd(lt, p, d);
  }
  $('black').setAttribute('opacity', Math.max(1 - lin(t, 0, .5), lin(t, TL.end - 1.0, TL.end)).toFixed(3));
};
