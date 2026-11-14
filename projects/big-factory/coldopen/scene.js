// Cold open animation. render(t) draws the frame at time t (seconds).
// window.MODE = 'wide' (1920x1080) or 'tall' (1080x1920, scene cropped + captions).
const NS = 'http://www.w3.org/2000/svg';
const G = window.GEO, T = window.TIMES;
const $ = id => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lin = (t, a, b) => clamp((t - a) / (b - a));
const easeIO = x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const easeOut = x => 1 - Math.pow(1 - x, 3);
const backOut = x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
function el(tag, attrs = {}, parent) { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
function fade(t, a, b, fi = .35, fo = .35) { return Math.min(lin(t, a, a + fi), 1 - lin(t, b - fo, b)); }
const TALL = window.MODE === 'tall';

// seeded random
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---------- build static pieces ----------
function buildGrass(g, n, y0, y1, color, h) {
  const blades = [];
  for (let i = 0; i < n; i++) {
    const x = rnd() * 2000 - 40, y = y0 + rnd() * (y1 - y0), hh = h * (0.6 + rnd() * 0.8);
    const p = el('path', { stroke: color, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, g);
    blades.push({ p, x, y, hh, ph: rnd() * 6 });
  }
  return blades;
}
function swayGrass(blades, t, amp) {
  for (const b of blades) {
    const s = Math.sin(t * 2.2 + b.ph + b.x * 0.004) * amp + amp * 0.6;
    b.p.setAttribute('d', `M${b.x} ${b.y} Q${b.x + s * 0.4} ${b.y - b.hh * 0.6} ${b.x + s} ${b.y - b.hh}`);
  }
}

// HILL (grey, wind)
const hillGrass = buildGrass($('hillGrass'), 260, 640, 1080, '#6d7a45', 34);
const wind = [];
for (let i = 0; i < 9; i++) wind.push({ p: el('path', { stroke: '#ffffff', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round', opacity: .0 }, $('wind')), y: 150 + rnd() * 420, ph: rnd() * 10, sp: 260 + rnd() * 200 });
// DAY steppe
const dayGrass = buildGrass($('dayGrass'), 220, 720, 1080, '#7f9440', 30);
const endGrass = buildGrass($('endGrass'), 220, 720, 1080, '#7f9440', 30);
// stars
for (let i = 0; i < 70; i++) el('circle', { cx: rnd() * 1920, cy: rnd() * 560, r: 1 + rnd() * 2.2, fill: '#fff', class: 'star', 'data-ph': rnd() * 6 }, $('stars'));

// MAP
for (const id of ['mapLand', 'zoomLand']) $(id).setAttribute('d', G.land);
for (const id of ['mapBorders', 'zoomBorders']) $(id).setAttribute('d', G.borders);
for (const id of ['mapMongolia', 'zoomMongolia']) $(id).setAttribute('d', G.mongolia);
$('landClipPath').setAttribute('d', G.land);
$('empire').setAttribute('d', G.empire);
const P = G.pts;
const tribes = [['TATARS', 'tatars', '#c0392b'], ['MERKITS', 'merkits', '#7d3c98'], ['KERAITES', 'keraites', '#d4ac0d'], ['NAIMANS', 'naimans', '#1f618d'], ['TAYICHIUD', 'tayichiud', '#117a65']];
const tribeEls = tribes.map(([name, key, col]) => {
  const g = el('g', {}, $('tribes'));
  el('rect', { x: -4, y: -70, width: 8, height: 70, fill: '#3b2a1e', stroke: '#1a1a1a', 'stroke-width': 3 }, g);
  el('path', { d: 'M4 -68 L58 -56 L4 -42 Z', fill: col, stroke: '#1a1a1a', 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
  el('ellipse', { cx: 0, cy: 0, rx: 18, ry: 6, fill: '#000', opacity: .25 }, g);
  const tx = el('text', { x: 0, y: 34, 'text-anchor': 'middle', class: 'lbl', 'font-size': 30 }, g); tx.textContent = name;
  return { g, key };
});
const raids = [['naimans', 'keraites'], ['tatars', 'tayichiud'], ['merkits', 'keraites'], ['tayichiud', 'naimans'], ['keraites', 'tatars']].map(([a, b]) => ({ a, b, p: el('path', { stroke: '#1a1a1a', 'stroke-width': 7, fill: 'none', 'stroke-dasharray': '20 16', 'stroke-linecap': 'round', 'marker-end': 'url(#arrow)' }, $('raids')) }));

// map camera helpers (scene coords 1920x1080)
function cam(cx, cy, s) { return `translate(960 540) scale(${s}) translate(${-cx} ${-cy})`; }
function toScreen(p, cx, cy, s) { return [(p[0] - cx) * s + 960, (p[1] - cy) * s + 540]; }

// ---------- per-frame ----------
function setOp(id, o) { $(id).setAttribute('opacity', clamp(o).toFixed(3)); }
function popScale(t, a, dur = .45) { return t < a ? 0 : backOut(lin(t, a, a + dur)); }


// hill surface height at scene x (two quadratic curves of the hill path)
function hillY(x) {
  const seg = x < 960 ? [-200, 820, 500, 600, 960, 620] : [960, 620, 1420, 640, 2120, 820];
  let lo = 0, hi = 1;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2, xm = (1 - m) * (1 - m) * seg[0] + 2 * (1 - m) * m * seg[2] + m * m * seg[4]; if (xm < x) lo = m; else hi = m; }
  const m = lo; return (1 - m) * (1 - m) * seg[1] + 2 * (1 - m) * m * seg[3] + m * m * seg[5];
}
function walker(id, t, path) { // path: [[t,x],...] piecewise linear; returns visible
  const g = $(id); if (t < path[0][0] || t > path[path.length - 1][0]) { g.setAttribute('opacity', 0); return null; }
  let x = path[0][1], moving = false;
  for (let i = 0; i < path.length - 1; i++) { const [t0, x0] = path[i], [t1, x1] = path[i + 1]; if (t >= t0 && t <= t1) { x = x0 + (x1 - x0) * (t - t0) / (t1 - t0); moving = x1 !== x0; break; } }
  const dir = path[path.length - 1][1] > path[0][1] ? 1 : -1;
  const ph = moving ? Math.sin(t * 9) : 0, y = hillY(x) + 6;
  g.setAttribute('opacity', 1);
  g.setAttribute('transform', `translate(${x} ${y - Math.abs(ph) * 4}) scale(${dir * 0.95} 0.95)`);
  g.querySelector('.legL').setAttribute('transform', `rotate(${ph * 22} -7 -62)`);
  g.querySelector('.legR').setAttribute('transform', `rotate(${-ph * 22} 9 -62)`);
  return x;
}
window.hillExtras = function (t) {
  setOp('under', lin(t, 3.6, 5.0));
  walker('w0', t, [[7.6, -160], [19.6, 2080]]);
  walker('w1', t, [[11.8, 2080], [23.2, -160]]);
  walker('w2', t, [[14.6, -160], [18.6, 900], [20.6, 900], [23.2, 1380]]);
  const q = t >= 18.7 && t < 20.6 ? popScale(t, 18.7, .3) : 0;
  $('qBubble').setAttribute('opacity', q > 0 ? 1 : 0);
  $('qBubble').setAttribute('transform', `translate(34 -236) scale(${q}) translate(-34 236)`);
};

window.render = function (t) {
  // --- HILL ---
  const hillOn = fade(t, 0, T.jumpStart + .05, 1.2, .25);
  setOp('sHill', hillOn);
  if (hillOn > 0) {
    const z = 1 + 0.05 * lin(t, 0, T.jumpStart);
    $('hillCam').setAttribute('transform', `translate(960 640) scale(${z}) translate(-960 -640)`);
    for (let i = 0; i < 5; i++) $('cloud' + i).setAttribute('transform', `translate(${((i * 430 + t * (14 + i * 3)) % 2400) - 300} ${80 + i * 46})`);
    swayGrass(hillGrass, t, 9);
    hillExtras(t);
    for (const w of wind) {
      const x = ((t * w.sp + w.ph * 300) % 2600) - 400, o = Math.sin(((t * w.sp + w.ph * 300) % 2600) / 2600 * Math.PI) * .45;
      w.p.setAttribute('d', `M${x} ${w.y} q60 -18 120 0 t120 0`); w.p.setAttribute('opacity', o.toFixed(2));
    }
    const k = popScale(t, T.hookIn), ko = fade(t, T.hookIn, T.hookOut, .01, .4);
    $('hook').setAttribute('transform', `translate(960 ${TALL ? 330 : 300}) scale(${k})`); setOp('hook', ko);
  }
  // --- JUMP: watch ---
  const wOn = fade(t, T.jumpStart, T.flash + .02, .25, .01);
  setOp('sWatch', wOn);
  if (wOn > 0) {
    const u = lin(t, T.jumpStart, T.flash), e = u * u * u;
    const minute = -360 * 30 * e, hour = minute / 12;
    $('minHand').setAttribute('transform', `rotate(${minute})`);
    $('hourHand').setAttribute('transform', `rotate(${hour + 300})`);
    $('watchGlow').setAttribute('opacity', (0.25 + 0.75 * u).toFixed(2));
    $('watchBody').setAttribute('transform', `translate(960 470) scale(${1 + 0.12 * u}) rotate(${Math.sin(t * 40) * 3 * u})`);
    const year = Math.round(2026 - (2026 - 1162) * easeIO(u));
    $('yearNum').textContent = year;
  }
  // flash
  const fl = t < T.flash ? lin(t, T.flash - .18, T.flash) : 1 - lin(t, T.flash, T.flash + .45);
  setOp('flash', fl);
  // --- DAY steppe + Tick landing ---
  const dayOn = fade(t, T.flash, T.mapStart + .3, .01, .3);
  setOp('sDay', dayOn);
  if (dayOn > 0) {
    swayGrass(dayGrass, t, 7);
    const lt = t - T.land; // landing time
    let y = 0, sy = 1;
    if (lt < 0) { const g = lin(t, T.flash, T.land); y = -900 * (1 - g * g); }
    else if (lt < .25) { sy = 1 - 0.16 * Math.sin(lt / .25 * Math.PI); }
    const bob = lt > .4 ? Math.sin((lt - .4) * 3) * 4 : 0;
    $('tickDay').setAttribute('transform', `translate(0 ${905 + y + bob}) scale(1 ${sy}) translate(0 -905)`);
    const d = lin(t, T.land, T.land + .8);
    for (let i = 0; i < 6; i++) {
      const c = $('dust' + i), a = (i / 6) * Math.PI;
      c.setAttribute('cx', 960 + Math.cos(a) * 60 * (1 + 3 * d) * (i % 2 ? 1 : -1));
      c.setAttribute('cy', 905 - 10 - 40 * d * Math.sin(a));
      c.setAttribute('r', 14 + 30 * d); c.setAttribute('opacity', (lt > 0 ? .55 * (1 - d) : 0).toFixed(2));
    }
    const k = popScale(t, T.land + .35);
    $('placeTag').setAttribute('transform', `translate(960 ${TALL ? 250 : 170}) scale(${k})`);
  }
  // --- MAP: the steppe ---
  const mapOn = fade(t, T.mapStart, T.birthStart + .3, .35, .3);
  setOp('sMap', mapOn);
  if (mapOn > 0) {
    const cx = P.mongolia[0] + 10, cy = P.mongolia[1] - 10, s = 3.0 + 0.4 * lin(t, T.mapStart, T.birthStart);
    $('mapCam').setAttribute('transform', cam(cx, cy, s));
    tribeEls.forEach((tr, i) => {
      const [x, y] = toScreen(P[tr.key], cx, cy, s), k = popScale(t, T.mapStart + .5 + i * .35);
      tr.g.setAttribute('transform', `translate(${x} ${y}) scale(${k})`);
    });
    raids.forEach((r, i) => {
      const a = toScreen(P[r.a], cx, cy, s), b = toScreen(P[r.b], cx, cy, s);
      const st = T.mapStart + 2.6 + i * .5, pr = easeOut(lin(t, st, st + .9));
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - 70;
      const ex = a[0] + (b[0] - a[0]) * pr * .85, ey = a[1] + (b[1] - a[1]) * pr * .85;
      r.p.setAttribute('d', `M${a[0]} ${a[1] - 20} Q${mx} ${my} ${ex} ${ey - 20}`);
      r.p.setAttribute('opacity', pr > 0.02 ? .85 : 0);
      r.p.setAttribute('stroke-dashoffset', (-t * 60).toFixed(1));
    });
    $('steppeTag').setAttribute('transform', `scale(${popScale(t, T.mapStart + .2)})`);
  }
  // --- BIRTH: night ger ---
  const bOn = fade(t, T.birthStart, T.nameStart + .3, .35, .3);
  setOp('sBirth', bOn);
  if (bOn > 0) {
    const z = 1 + 0.08 * lin(t, T.birthStart, T.nameStart);
    $('birthCam').setAttribute('transform', `translate(960 760) scale(${z}) translate(-960 -760)`);
    document.querySelectorAll('.star').forEach(s => s.setAttribute('opacity', (0.45 + 0.55 * Math.abs(Math.sin(t * 1.7 + +s.dataset.ph))).toFixed(2)));
    $('doorGlow').setAttribute('opacity', (0.55 + 0.25 * Math.sin(t * 5)).toFixed(2));
    for (let i = 0; i < 3; i++) {
      const p = ((t * .35 + i / 3) % 1);
      const sm = $('smoke' + i); sm.setAttribute('cx', 960 + Math.sin(p * 6 + i) * 18); sm.setAttribute('cy', 520 - p * 260); sm.setAttribute('r', 16 + p * 40); sm.setAttribute('opacity', (0.35 * (1 - p)).toFixed(2));
    }
    $('yearTag').setAttribute('transform', `scale(${popScale(t, T.birthStart + .3)})`);
    const sk = popScale(t, T.stamp, .3), so = fade(t, T.stamp, T.stampOut, .01, .3);
    $('stampLegend').setAttribute('transform', `translate(${TALL ? 960 : 1380} ${TALL ? 420 : 330}) rotate(-12) scale(${t < T.stamp ? 0 : 2.2 - 1.2 * Math.min(1, sk)})`);
    setOp('stampLegend', so);
  }
  // --- NAME card ---
  const nOn = fade(t, T.nameStart, T.zoomStart + .3, .3, .3);
  setOp('sName', nOn);
  if (nOn > 0) {
    const sl = easeOut(lin(t, T.nameStart, T.nameStart + .6));
    $('temujinCard').setAttribute('transform', `translate(${(TALL ? 700 : 600) - 700 * (1 - sl)} 0)`);
    $('nameText').setAttribute('transform', `translate(${TALL ? 1180 : 1180} ${TALL ? 470 : 480}) scale(${popScale(t, T.nameStart + .45)})`);
    $('nameSub').setAttribute('opacity', lin(t, T.nameStart + .9, T.nameStart + 1.3).toFixed(2));
  }
  // --- ZOOM OUT: empire ---
  const zOn = fade(t, T.zoomStart, T.endStart + .3, .3, .3);
  setOp('sZoom', zOn);
  if (zOn > 0) {
    const u = easeIO(lin(t, T.zoomStart, T.zoomStart + 2.2));
    const c0 = [P.mongolia[0] + 10, P.mongolia[1] - 10], c1 = [1030, 430];
    const cx = c0[0] + (c1[0] - c0[0]) * u, cy = c0[1] + (c1[1] - c0[1]) * u, s = Math.exp(Math.log(3.2) + (Math.log(TALL ? 0.72 : 0.86) - Math.log(3.2)) * u);
    $('zoomCam').setAttribute('transform', cam(cx, cy, s));
    const [dx, dy] = toScreen(P.mongolia, cx, cy, s);
    $('redDot').setAttribute('transform', `translate(${dx} ${dy}) scale(${1 + 0.25 * Math.sin(t * 6)})`);
    // empire flicker in then out
    const eIn = lin(t, T.empireIn, T.empireIn + .2), eOut = 1 - lin(t, T.empireOut, T.empireOut + .5);
    const flick = t < T.empireIn + .6 ? (Math.sin(t * 40) > -0.2 ? 1 : 0.35) : 1;
    setOp('empireG', 0.85 * eIn * eOut * flick);
    for (const [key, id] of [['korea', 'tagKorea'], ['poland', 'tagPoland']]) {
      const [x, y] = toScreen(P[key], cx, cy, s);
      const k = popScale(t, T.empireIn + (key === 'korea' ? .5 : 1.0));
      $(id).setAttribute('transform', `translate(${x} ${y}) scale(${k * (1 - lin(t, T.empireOut, T.empireOut + .5))})`);
    }
  }
  // --- END: alone on the steppe ---
  const eOn = fade(t, T.endStart, 999, .35, .01);
  setOp('sEnd', eOn);
  if (eOn > 0) {
    swayGrass(endGrass, t, 7);
    const z = 1.15 - 0.15 * lin(t, T.endStart, T.end);
    $('endCam').setAttribute('transform', `translate(960 760) scale(${z}) translate(-960 -760)`);
  }
  setOp('black', Math.max(1 - lin(t, 0, 1.0), lin(t, T.end - .8, T.end)));
  // captions (tall only)
  if (TALL) {
    let txt = '';
    for (const c of window.CAPS) if (t >= c.a && t < c.b) txt = c.text;
    const cap = document.getElementById('cap');
    if (cap.dataset.t !== txt) { cap.dataset.t = txt; cap.innerHTML = txt; }
  }
};
