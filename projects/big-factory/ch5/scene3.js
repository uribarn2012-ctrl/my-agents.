// ===== 10-16: the battle of Mohi (top-down diagram) =====
const TICKFACE = (sw) => `<g stroke="#1a1a1a" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"><path d="M215 -760 L40 -905" stroke-width="70" fill="none"/><path d="M215 -760 L40 -905" stroke="#5e3820" stroke-width="48" fill="none"/><ellipse cx="0" cy="-935" rx="86" ry="76" fill="#f2c9a0"/><path d="M-50 -985 L-30 -905 M-8 -1000 L-4 -900 M34 -990 L26 -905 M70 -965 L56 -898" stroke-width="9" fill="none"/></g>`;
function along(pts, k) { const p = partial(pts, k); return p[p.length - 1]; }
S(10, 16, (g, u, L) => {
  const gr = el('rect', { width: 1920, height: 1080, fill: '#a9b676' }, g);
  const bl = buildGrass(el('g', {}, g), 60, 40, 1060, '#8a9a58', 30);
  const rv = el('path', { d: 'M900 -40 C840 200 970 380 905 560 S850 900 925 1120', fill: 'none', stroke: '#2f63c9', 'stroke-width': 130, 'stroke-linecap': 'round' }, g);
  const rf = el('path', { d: 'M900 -40 C840 200 970 380 905 560 S850 900 925 1120', fill: 'none', stroke: '#8fc0f2', 'stroke-width': 50, 'stroke-dasharray': '36 54', 'stroke-linecap': 'round', opacity: .7 }, g);
  mk(g, '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="832" y="492" width="150" height="56" fill="#a0703c"/><path d="M850 492 V548 M880 492 V548 M910 492 V548 M940 492 V548 M965 492 V548" stroke="#6b4423" stroke-width="4"/></g>');
  // road from the camp gap
  const road = 'M1060 590 C1150 760 1180 900 1300 1100';
  el('path', { d: road, fill: 'none', stroke: '#d9c08a', 'stroke-width': 56, 'stroke-linecap': 'round', opacity: .9 }, g);
  const CX = 1400, CY = 470, RX = 300, RY = 230;
  // camp tents
  const tents = [[-120, -60], [0, -110], [110, -50], [-90, 50], [40, 30], [140, 70], [-10, 120]];
  tents.forEach(([x, y]) => mk(g, `<g transform="translate(${CX + x} ${CY + y})" stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"><path d="M-44 0 L0 -64 L44 0 Z" fill="#f5f0e0"/><path d="M-12 0 L0 -26 L12 0 Z" fill="#c0392b"/></g>`));
  const flagC = mk(g, bannerMk); setT(flagC, CX, CY - 40, 0, 1.1);
  const hun = []; for (let i = 0; i < 40; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 200; const n = mk(g, soldier('#1e8449')); hun.push({ n, x: CX + Math.cos(a) * r * 1.2, y: CY + Math.sin(a) * r * .9 + 30, d: i * .08, ph: rnd() * 6 }); }
  // wagons ring (gap on the river side, angle ~ 195 deg)
  const GA = 200 * Math.PI / 180, wag = []; for (let i = 0; i < 20; i++) { const a = i / 20 * 6.2832; const gapd = Math.abs(Math.atan2(Math.sin(a - GA), Math.cos(a - GA))); const x = CX + Math.cos(a) * RX, y = CY + Math.sin(a) * RY; const w = mk(g, `<g stroke="#1a1a1a" stroke-width="4"><rect x="-26" y="-15" width="52" height="30" rx="5" fill="#8a5a2b"/><circle cx="-14" cy="15" r="8" fill="#2b1b10"/><circle cx="14" cy="15" r="8" fill="#2b1b10"/></g>`, { opacity: 0 }); wag.push({ w, x, y, rot: Math.atan2(RX * Math.cos(a), -RY * Math.sin(a)) * 180 / Math.PI + 90 - 90, gap: gapd < .42, a }); }
  const rope = el('ellipse', { cx: CX, cy: CY, rx: RX, ry: RY, fill: 'none', stroke: '#6b4423', 'stroke-width': 6, 'stroke-dasharray': '14 8', opacity: 0 }, g);
  // mongols
  const mon = []; for (let i = 0; i < 36; i++) mon.push({ n: mk(g, soldier(RED)), x: 250 + rnd() * 330, y: 400 + rnd() * 260, ph: rnd() * 6 });
  const cats = [0, 1, 2].map(i => ({ g: mk(g, '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"><rect x="-34" y="-16" width="68" height="20" rx="4" fill="#8a5a2b"/><path d="M-10 -16 L26 -64" stroke-width="10" fill="none" stroke="#6b3e1b"/><circle cx="30" cy="-68" r="10" fill="#555"/></g>'), y: 440 + i * 80 }));
  const stones = [0, 1, 2, 3, 4, 5].map(() => el('circle', { r: 11, fill: '#444', stroke: '#1a1a1a', 'stroke-width': 3 }, g));
  const flank = []; for (let i = 0; i < 10; i++) flank.push(mk(g, soldier(RED)));
  const ring = []; for (let i = 0; i < 20; i++) ring.push(mk(g, soldier(RED), { opacity: 0 }));
  const wait = []; for (let i = 0; i < 12; i++) wait.push(mk(g, soldier(RED), { opacity: 0 }));
  const tint = el('rect', { width: 1920, height: 1080, fill: '#0b1130', opacity: 0 }, g), moon = mk(g, '<circle r="60" fill="#f4f1de"/><circle cx="18" cy="-10" r="12" fill="#d8d4be"/>', { opacity: 0 });
  // UI
  const tM = tagG(u, 'MOHI, 1241', 70, OR), tMS = tagG(u, 'A MASTERCLASS', 56, { fill: '#111' }), tR = tagG(u, 'SAJÓ RIVER', 44, { fill: '#2f63c9' }), tH = tagG(u, 'HUNGARIAN CAMP', 44, { fill: '#1e8449' }), tB = tagG(u, 'ONE BRIDGE: EASY TO DEFEND', 40, { fill: '#111' });
  const tC = tagG(u, 'CATAPULTS POUND THE BRIDGE', 44, { fill: '#7b1d1d' }), tN = tagG(u, 'SUBUTAI: DOWNSTREAM, IN THE DARK', 44, { fill: '#e67e22' }), tNb = tagG(u, 'WHERE NOBODY IS WATCHING', 40, { fill: '#111' });
  const tS = tagG(u, 'SURROUNDED', 80, { fill: '#7b1d1d' }), tW = tagG(u, 'WAGONS TIED TOGETHER', 40, { fill: '#111' }), tG = tagG(u, 'ONE GAP LEFT OPEN', 56, OR), tCh = tagG(u, 'ACCORDING TO THE CHRONICLERS', 38, { fill: '#111' }), tT = tagG(u, 'WAITING RIDERS', 44, { fill: '#7b1d1d' });
  const aF = arrowG(u), aH = arrowG(u), q1 = mk(u, '<text class="t big" font-size="110" style="stroke-width:14">!</text>', { opacity: 0 });
  const tk = mk(g, window.TICK_FP_SVG), tkh = mk(tk, TICKFACE(0), { opacity: 0 }), sw = mk(u, sweatDrop, { opacity: 0 });
  const FL = [[480, 570], [600, 880], [820, 975], [1000, 975], [1250, 850], [1650, 520], [1560, 300]], HEAD = [[500, 520], [700, 520], [860, 520]];
  const roadPt = k => { const t = clamp(k); const x = (1 - t) ** 3 * 1060 + 3 * (1 - t) ** 2 * t * 1150 + 3 * (1 - t) * t * t * 1180 + t ** 3 * 1300, y = (1 - t) ** 3 * 590 + 3 * (1 - t) ** 2 * t * 760 + 3 * (1 - t) * t * t * 900 + t ** 3 * 1100; return [x, y]; };
  return lt => {
    const t11 = L(11), t12 = L(12), t13 = L(13), t14 = L(14), t15 = L(15), t16 = L(16);
    const T = lt; swayGrass(bl, T, 6); rf.setAttribute('stroke-dashoffset', -T * 40);
    show(tM, lt, .2, 960, 120, -2, t11 - .1); show(tMS, lt, .6, 960, 240, 1, t11 - .1, 1, true);
    // hungarians
    hun.forEach(h => { const pp = lin(lt, t11 - .1 + h.d * .3, t11 + .6); const out = lin(lt, t16 + 1.0 + h.d * 1.1, t16 + 3.2); let x = h.x, y = h.y + Math.abs(Math.sin(T * 3 + h.ph)) * -3, vv = 1;
      if (out > 0) { const k = out; if (k < .3) { const f = k / .3; x = lerp(h.x, 1090, f); y = lerp(h.y, 590, f); } else { const p = roadPt((k - .3) / .7); x = p[0] + (h.ph - 3) * 6; y = p[1]; vv = 1 - lin(k, .8, 1); } }
      setT(h.n, x, y, 0, 2.2 * pop(lt, t11 - .1 + h.d * .3, .3) * vv); });
    // mongols west bank
    const adv = lin(lt, t12, t12 + 1.8); mon.forEach((m, i) => { const fl = lin(lt, t13 + .3, t13 + 1.2); setT(m.n, m.x + adv * 70 + Math.sin(T * 2 + m.ph) * 3, m.y + Math.abs(Math.sin(T * 3 + m.ph)) * -4, 0, 2.2 * pop(lt, t11 + .5 + i * .02, .3) * (1 - fl * (i % 3 == 0 ? .4 : 0))); });
    cats.forEach((c, i) => setT(c.g, 660, c.y, 0, 1.2 * pop(lt, t12 - .2 + i * .15)));
    stones.forEach((s, i) => { const per = 1.2, ph = ((T - t12 + i * .38) % per + per) % per / per, on = lt > t12 && lt < t14 - .4; const cy = cats[i % 3].y; s.setAttribute('cx', lerp(690, 880, ph)); s.setAttribute('cy', cy - 80 - 120 * Math.sin(Math.PI * ph) + (520 - cy) * ph); s.setAttribute('opacity', on ? 1 : 0); });
    // labels (day 1)
    show(tR, lt, t11 + .2, 1010, 140, 2, t12 - .1); show(tH, lt, t11 + 1.6, 1400, 160, -2, t12 - .1); show(tB, lt, t11 + 2.8, 900, 700, 0, t12 - .1);
    show(tC, lt, t12 + .1, 560, 250, -2, t13 - .1);
    // head-on arrow
    marrow({ S: p => p }, aH, HEAD, easeIO(lin(lt, t12 + .1, t12 + 1.6)) * (lt < t13 ? 1 : 0));
    // night + flank
    const ni = Math.min(lin(lt, t13 - .2, t13 + .8), 1 - lin(lt, t14 + .1, t14 + 1.6)); tint.setAttribute('opacity', (ni * .72).toFixed(3)); moon.setAttribute('opacity', ni.toFixed(2)); setT(moon, 1600, 130, 0, 1);
    const fk = easeIO(lin(lt, t13 + .5, t13 + 6.0)); marrow({ S: p => p }, aF, FL, fk * (lt < t14 + 1.2 ? 1 : 0));
    flank.forEach((f, i) => { const k = clamp(fk - i * .012), p = along(FL, k); setT(f, p[0], p[1], 0, 2.2 * (lt > t13 + .4 ? 1 : 0)); f.setAttribute('opacity', lt < t14 + .2 ? 1 : 0); });
    show(tN, lt, t13 + .4, 960, 160, -1, t14 - .1); show(tNb, lt, t13 + 3.4, 960, 260, 1, t14 - .1);
    // ring closes
    wag.forEach((w, i) => { const a = t14 + .2 + (i / 20) * 2.0; w.w.setAttribute('opacity', (!w.gap && lt > a) ? 1 : 0); setT(w.w, w.x, w.y, w.rot, 1.1 * pop(lt, a, .3)); });
    rope.setAttribute('opacity', lin(lt, t14 + 2.0, t14 + 2.6) * (lt < t15 ? .9 : 0));
    ring.forEach((r, i) => { const a = i / 20 * 6.2832, ap = t14 + .4 + i * .08; const gp = Math.abs(Math.atan2(Math.sin(a - GA), Math.cos(a - GA))); const keep = gp > .5; r.setAttribute('opacity', keep && lt > ap ? 1 : 0); setT(r, CX + Math.cos(a) * (RX + 50) * (1 + .04 * Math.sin(T * 3 + i)), CY + Math.sin(a) * (RY + 45), 0, 2.4 * pop(lt, ap, .3)); });
    show(tS, lt, t14 + .9, 960, 160, -2, t15 - .1, 1, true); show(tW, lt, t14 + 3.0, 960, 260, 1, t15 - .1);
    // the gap
    const gx = CX + Math.cos(GA) * RX, gy = CY + Math.sin(GA) * RY; const pulse = 1 + .12 * Math.sin(T * 8);
    show(tG, lt, t15 + .1, 960, 160, -1, t16 - .1, 1, true); show(tCh, lt, t15 + 2.4, 960, 260, 1, t16 - .1); show(tT, lt, t16 + .1, 700, 960, -2, t16 + 2.6);
    wait.forEach((w, i) => { const p = roadPt(.2 + i * .07); setT(w, p[0] + 66 * (i % 2 ? 1 : -1), p[1], 0, 2.4 * pop(lt, t15 + 1.8 + i * .12, .3)); w.setAttribute('opacity', lt > t15 + 1.8 + i * .12 ? 1 : 0); });
    q1.setAttribute('opacity', 0);
    // Tick facepalm (16)
    const tkOn = pop(lt, t16 + 1.4, .35); tickAt(tk, 1650, 1130, .5, tkOn); tkh.setAttribute('opacity', lt > t16 + 1.5 ? 1 : 0);
    setT(sw, 1790, 640 + 6 * Math.sin(T * 6), 0, 1.1 * pop(lt, t16 + 2.2, .3)); sw.setAttribute('opacity', lt > t16 + 2.2 ? 1 : 0);
  };
});
// ===== 17: Bela flees =====
S(17, 17, (g, u, L) => {
  const sc = scenery(g, { sky: 'grey', hill: HGREY, clouds: 3, wind: 1 }), sp = speedG(g, 800, 1040);
  const hB = H(g, { coat: '#8b5a2b', blanket: '#1e8449', rider: C.bela }), ch = [0, 1, 2].map(i => H(g, { coat: '#2b2b2b', blanket: '#c0392b', rider: i % 2 ? C.mon : C.mon2 }));
  const tB = tagG(u, 'BÉLA IV, KING OF HUNGARY', 50, { fill: '#b03a2e' }), tE = tagG(u, 'BARELY ESCAPES', 80, OR);
  return lt => {
    sc(lt); sp(lt, 1.4); const bx = 1180 + 25 * Math.sin(lt * 2.2);
    ride(hB, lt, bx, 950, 1.15, 1, true, 28); hB.rider.face('f'); hB.rider.mark('s', lt, .8, 3.5);
    ch.forEach((h, i) => { ride(h, lt + i * .5, 300 + i * 190 + 30 * Math.sin(lt * 1.6 + i), 940 + (i % 2) * 24, 1.0, 1, true, 28); h.rider.face('d'); });
    show(tB, lt, .3, 1100, 330, -2, 1e9); show(tE, lt, 1.5, 700, 230, 2, 1e9, 1, true);
  };
});
// ===== 18: chased to the Adriatic =====
S(18, 18, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const rr = rz(m, G3.rusZ, 700, 380), rh = rz(m, G3.horde, 700, 400), rp = rz(m, G3.pol, 490, 330), rhu = rz(m, G3.hun, 470, 400); rr(400); rh(400, .6); rp(100); rhu(100);
  m.add(P0.island, '<ellipse rx="13" ry="8" fill="#f3ad45" stroke="#1a1a1a" stroke-width="3"/>');
  const ar = arrowG(u), tA = tagG(u, 'ADRIATIC SEA', 44, { fill: '#2f63c9' }), tH = tagG(u, 'HIS WHOLE KINGDOM', 44, { fill: '#b03a2e' }), tI = tagG(u, 'HIDES ON AN ISLAND', 50, OR), pb = portrait(g, C.bela, 0, 0, 80, '#1e8449'), dot = mk(u, '<circle r="16" fill="#ffd84a" stroke="#1a1a1a" stroke-width="5"/>');
  const PTH = [P0.mohi, P0.budapest, [425, 420], P0.adriatic, P0.island];
  return lt => {
    m.cam(lerp(450, 420, easeIO(lin(lt, 0, 8))), 410, 6.2 + lt * .04); y(lt, .1, '1241');
    const k = easeIO(lin(lt, 1.0, 6.5)); marrow(m, ar, PTH, k);
    const p = m.S(along(PTH, k)); setT(dot, p[0], p[1] - 40, 0, lt > 1 ? 1 : 0);
    const a = m.S(P0.adriatic), i = m.S(P0.island), h = m.S(P0.budapest);
    show(tH, lt, 2.0, h[0] + 150, h[1] - 100, -2, 6.3); show(tA, lt, 5.2, a[0] - 230, a[1] + 40, 2);
    setT(pb.g, i[0] - 120, i[1] + 130 + bobY(lt, 0, 5), 0, pop(lt, 6.8)); pb.pp.face(lt > 6.8 ? 's' : 'f'); show(tI, lt, 6.8, i[0] + 200, i[1] + 190, -2);
  };
});
// ===== 19: two armies in one week =====
S(19, 19, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const rr = rz(m, G3.rusZ, 700, 380), rh = rz(m, G3.horde, 700, 400), rp = rz(m, G3.pol, 490, 330), rhu = rz(m, G3.hun, 470, 400); rr(400); rh(400, .6); rp(100); rhu(100);
  const xA = mk(u, xMark, { opacity: 0 }), xB = mk(u, xMark, { opacity: 0 }), tA = tagG(u, 'APR 9', 50, { fill: '#2c3e50' }), tB = tagG(u, 'APR 11', 50, { fill: '#1e8449' }), tD = tagG(u, 'ONLY 2 DAYS APART', 58, { fill: '#111' }), tK = tagG(u, 'HUNDREDS OF KM APART', 44, { fill: '#7b1d1d' }), line = el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-dasharray': '18 12', 'stroke-linecap': 'round' }, u), st = stampG(u, 'F'), tF = tagG(u, 'TWO ARMIES, ONE WEEK', 44, { fill: '#111' });
  return lt => {
    m.cam(440 + 6 * Math.sin(lt * .4), 368, 5.2 + lt * .02); y(lt, .1, '1241');
    const a = m.S(P0.legnica), b = m.S(P0.mohi);
    show(xA, lt, .5, a[0], a[1], 0, 1e9, 1); show(xB, lt, 1.5, b[0], b[1], 0, 1e9, 1);
    show(tA, lt, .7, a[0] - 110, a[1] - 80, -2); show(tB, lt, 1.7, b[0] + 120, b[1] + 80, 2);
    const k = easeOut(lin(lt, 2.4, 3.2)); line.setAttribute('d', `M${a[0]} ${a[1]} L${lerp(a[0], b[0], k)} ${lerp(a[1], b[1], k)}`); line.setAttribute('opacity', k > 0 ? 1 : 0);
    show(tK, lt, 3.0, (a[0] + b[0]) / 2 - 230, (a[1] + b[1]) / 2 + 20, -3); show(tD, lt, 4.0, 960, 160, 1, 1e9, 1, true);
    stampShow(st, lt, 5.0, 1560, 880, -8); show(tF, lt, 5.2, 1560, 1010, -2);
  };
});
// ===== 20-21: edge of Austria and the Adriatic; Western Europe wide open =====
S(20, 21, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const rr = rz(m, G3.rusZ, 700, 380), rh = rz(m, G3.horde, 700, 400), rp = rz(m, G3.pol, 490, 330), rhu = rz(m, G3.hun, 470, 400); rr(400); rh(400, .6); rp(100); rhu(100);
  const a1 = arrowG(u), a2 = arrowG(u), gh = [0, 1, 2].map(() => arrowG(u)), tV = tagG(u, 'VIENNA', 56, { fill: '#7b1d1d' }), tA = tagG(u, 'ADRIATIC COAST', 50, { fill: '#2f63c9' }), tAu = tagG(u, 'EDGE OF AUSTRIA', 44, { fill: '#111' }), tW = tagG(u, 'WIDE OPEN', 110, { fill: '#2e5f9e' }), q = mk(u, '<text class="t big" font-size="150" style="stroke-width:18">?</text>', { opacity: 0 });
  return lt => {
    const t21 = L(21), z = easeIO(lin(lt, t21 - .3, t21 + 3.5)); m.cam(lerp(450, 300, z), lerp(405, 380, z), lerp(5.0, 3.2, z)); y(lt, .1, '1241');
    marrow(m, a1, [P0.mohi, [440, 392], P0.vienna], easeIO(lin(lt, .4, 3.0))); marrow(m, a2, [P0.mohi, [430, 420], P0.adriatic], easeIO(lin(lt, 1.2, 3.8)));
    const v = m.S(P0.vienna), a = m.S(P0.adriatic);
    show(tV, lt, 1.4, v[0] - 120, v[1] - 120, -2, t21 - .2); show(tAu, lt, 2.6, v[0] - 190, v[1] - 40, 2, t21 - .2); show(tA, lt, 3.6, a[0] - 200, a[1] + 50, 2, t21 - .2);
    gh.forEach((ar, i) => { const k = lin(lt, t21 + .6 + i * .2, t21 + 2.6 + i * .2); marrow(m, ar, [[430, 385 + i * 22], [370, 385 + i * 24], [250, 385 + i * 26 - i * 6]], k, GREY); });
    show(tW, lt, t21 + .3, 960, 880, -3, 1e9, 1, true); q.setAttribute('opacity', lt > t21 + 1.8 ? 1 : 0); setT(q, 1480, 520 + 8 * Math.sin(lt * 5), 6, pop(lt, t21 + 1.8));
  };
});
// ===== 22: Tick checks the map of France =====
S(22, 22, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#0f1a2b' }, g);
  const tk = tickG(g), paper = mk(g, '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="-210" y="-150" width="420" height="300" rx="10" fill="#f5ecd0"/><path d="M-70 -90 L40 -110 L90 -40 L70 40 L10 100 L-70 90 L-100 20 L-90 -40 Z" fill="#f3ad45"/></g><text class="t" y="-110" x="-150" font-size="40" fill="#1a1a1a" stroke="none">FRANCE</text><circle cx="-6" cy="-6" r="10" fill="#e2362b"/>');
  const sw = [0, 1].map(() => mk(g, sweatDrop, { opacity: 0 })), sp = mk(u, `<ellipse rx="620" ry="150" fill="#fff" stroke="#1a1a1a" stroke-width="8"/><path d="M-40 140 L-10 230 L50 135 Z" fill="#fff" stroke="#1a1a1a" stroke-width="8"/><ellipse rx="610" ry="140" fill="#fff"/><text class="t" y="-14" text-anchor="middle" font-size="66" fill="#1a1a1a">THEY'RE NOT...</text><text class="t" y="64" text-anchor="middle" font-size="58" fill="#1a1a1a">THEY'RE NOT GOING THERE, RIGHT?</text>`, { opacity: 0 }), q = mk(u, '<text class="t big" font-size="120" style="stroke-width:14">?</text>', { opacity: 0 });
  return lt => {
    tickAt(tk, 1250, 1120, .55, pop(lt, .05)); setT(paper, 660 + 3 * Math.sin(lt * 23), 820 + 3 * Math.cos(lt * 19), -6 + 2 * Math.sin(lt * 9), 1.0 * pop(lt, .2));
    sw.forEach((s, i) => { s.setAttribute('opacity', lt > .6 + i * .3 ? 1 : 0); const k = ((lt - .6 - i * .3) * .9 % 1 + 1) % 1; setT(s, 1130 + i * 220, 560 + k * 50, 0, .9 * (1 - k * .4)); });
    show(sp, lt, .5, 1000, 250, 0); q.setAttribute('opacity', lt > 1.3 ? 1 : 0); setT(q, 1700, 500 + 6 * Math.sin(lt * 6), 8, pop(lt, 1.3));
  };
});
// ===== 23: and then, they leave =====
S(23, 23, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const rr = rz(m, G3.rusZ, 700, 380), rh = rz(m, G3.horde, 700, 400), rp = rz(m, G3.pol, 490, 330), rhu = rz(m, G3.hun, 470, 400); rr(400); rh(400, .6); rp(100); rhu(100);
  const a1 = arrowG(u), a2 = arrowG(u), tL = tagG(u, 'AND THEN... THEY LEAVE', 70, OR);
  return lt => {
    m.cam(lerp(450, 520, easeIO(lin(lt, 0, 2.6))), 380, 3.4); y(lt, .1, '1241');
    marrow(m, a1, [[460, 388], [540, 370], [660, 345]], easeIO(lin(lt, .2, 1.8)), RED); marrow(m, a2, [[440, 340], [520, 345], [640, 335]], easeIO(lin(lt, .4, 2.0)), RED);
    show(tL, lt, .3, 960, 880, -2, 1e9, 1, true);
  };
});
// ===== 24: Ogedei dies =====
S(24, 24, (g, u, L) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, clouds: 3, wind: 1 }), ger = gerG(g), og = portrait(g, C.oge, 0, 0, 150, '#9aa0a6'), halo = el('circle', { r: 220, fill: 'url(#gHalo)', opacity: 0 }, g), cup = mk(g, cupMk), fr = fireG(g);
  const tD = tagG(u, 'DECEMBER 1241', 66, { fill: '#111' }), tO = tagG(u, 'ÖGEDEI DIES, BACK IN MONGOLIA', 46, { fill: '#4a4fb5' });
  return lt => {
    sc(lt); ger.set(300, 900, .9, 1); fr.set(1500, 960, lt, 1.1);
    setT(og.g, 960, 660 + bobY(lt, 0, 4), 0, pop(lt, .3) * (1 - .0)); og.pp.face(lt > 2.0 ? 'x' : 's');
    const f = lin(lt, 2.0, 4.8); halo.setAttribute('opacity', Math.sin(Math.PI * clamp(f)) * .9); setT(halo, 960, 640 - 50 * f, 0, 1 + .3 * f);
    setT(cup, 1160, 880 + 40 * easeIn(lin(lt, 1.6, 2.4)), 80 * lin(lt, 1.6, 2.4), 1.6 * pop(lt, .6));
    show(tD, lt, .4, 960, 150, -1); show(tO, lt, 1.2, 960, 260, 1);
  };
});
function easeIn(x) { return x * x; }
// ===== 25: princes ride home =====
S(25, 25, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [300, 170], clouds: 3, wind: 1 }), sp = speedG(g, 800, 1040), city = cityG(g, { wall: '#e0c48a', tw: '#c9a05a', roof: '#7d3c98' });
  const hs = [C.batu, C.mon, C.mon2].map((r, i) => H(g, { coat: ['#d8c9a8', '#6b4a2a', '#2b2b2b'][i], blanket: ['#1f7a8c', '#c0392b', '#e67e22'][i], rider: r }));
  const tL = tagG(u, 'MONGOL LAW', 66, OR), tP = tagG(u, 'ALL PRINCES COME HOME', 50, { fill: '#111' }), tN = tagG(u, 'TO CHOOSE THE NEXT GREAT KHAN', 46, { fill: '#7d3c98' });
  return lt => {
    sc(lt); sp(lt, 1); city.set(1580, 830, .55); city.flag('#7d3c98', 1);
    hs.forEach((h, i) => { ride(h, lt + i * .4, 330 + i * 250 + 30 * Math.sin(lt * 1.4 + i), 960 + i * 8, 1.05 - i * .02, 1, true, 26); h.rider.face(i == 0 ? 'd' : 's'); });
    show(tL, lt, .5, 960, 230, -2, 1e9, 1, true); show(tP, lt, 1.8, 960, 340, 1); show(tN, lt, 3.4, 960, 440, -1);
  };
});
// ===== 26: they ride east, red drains =====
S(26, 26, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const rr = rz(m, G3.rusZ, 700, 380), rh = rz(m, G3.horde, 700, 400), rp = rz(m, G3.pol, 490, 330), rhu = rz(m, G3.hun, 500, 400); rr(400); rh(400, .6);
  const a1 = arrowG(u), tY = tagG(u, 'THEY RIDE EAST', 60, OR);
  return lt => {
    m.cam(540, 385, 3.2); y(lt, .1, '1242'); const k = easeIO(lin(lt, .6, 3.4));
    rp(100 * (1 - k) + 1); rhu(100 * (1 - k) + 1); if (k > .98) { rp(0); rhu(0); }
    marrow(m, a1, [[420, 392], [520, 372], [640, 352]], easeIO(lin(lt, .3, 2.6)));
    show(tY, lt, .5, 960, 900, -2);
  };
});
// ===== 27: Batu builds Sarai =====
S(27, 27, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1500, 170], clouds: 3, wind: 1 });
  const rv = el('path', { d: 'M-50 800 Q300 760 700 810 T1500 800 T2100 790 L2100 900 Q1500 930 1000 890 T-50 920 Z', fill: '#2f63c9', stroke: '#1a1a1a', 'stroke-width': 6 }, g), rl = el('path', { d: 'M0 850 h90 M500 880 h110 M1100 850 h100 M1650 860 h80', stroke: '#8fc0f2', 'stroke-width': 8, 'stroke-linecap': 'round', fill: 'none' }, g);
  const city = cityG(g, { wall: '#e8d3a0', tw: '#d9bd7c', roof: '#1f7a8c' }), ba = P(g, C.batu), wk = [P(g, C.mon), P(g, C.mon2)], cart = cartG(g);
  const tS = tagG(u, 'SARAI', 86, OR), tV = tagG(u, 'ON THE VOLGA RIVER', 48, { fill: '#2f63c9' }), tB = tagG(u, "BATU'S OWN CAPITAL", 46, { fill: '#1f7a8c' });
  return lt => {
    sc(lt); rl.setAttribute('transform', `translate(${(lt * 40) % 200} 0)`); const k = pop(lt, 1.4, 1.0);
    city.set(1180, 850, .9 * k); city.flag('#1f7a8c', clamp(k));
    stand(ba, 380, 1010, 1.2, 1, lt > 3 ? 'k' : 'd', bob(lt)); ba.arm('R', -110 + 6 * Math.sin(lt * 2));
    const cx = lerp(-100, 2000, lin(lt, 0, 7.5)); cart.set(cx, 1020, .7, cx * .5); wk.forEach((p, i) => walkP(p, lt * 1.2 + i, cx + 170 + i * 110, 1020, .85, 1, 'h'));
    show(tS, lt, 1.2, 1180, 330, -2, 1e9, 1, true); show(tV, lt, 3.0, 960, 150, 1); show(tB, lt, 4.6, 560, 440, -2);
  };
});
// ===== 28: Golden Horde =====
S(28, 28, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const rr = rz(m, G3.rusZ, 700, 380), rh = rz(m, G3.horde, 700, 400), rp = rz(m, G3.hun, 480, 400); rr(400); rh(400, .88); rp(0);
  const tH = tagG(u, 'GOLDEN HORDE', 84, { fill: '#d4ac0d', stroke: '#1a1a1a', tc: '#1a1a1a' }), tR = tagG(u, 'RULES THE RUS PRINCES', 46, { fill: '#922b21' }), tY = tagG(u, '200+ YEARS', 110, OR);
  m.add(P0.sarai, '<circle r="12" fill="#ffd84a" stroke="#1a1a1a" stroke-width="4"/>');
  return lt => {
    m.cam(lerp(640, 600, easeIO(lin(lt, 0, 7))), 370, 3.0 + lt * .02); const k = lin(lt, 2.8, 6.5); y(lt, .1, '1242', 3.3);
    const s = m.S(P0.volga); show(tH, lt, .4, s[0], s[1] - 40, -2, 1e9, 1, true); show(tR, lt, 1.6, 960, 920, 1); show(tY, lt, 3.4, 960, 200, -2, 1e9, 1, true);
  };
});
// ===== 29-31: was it only the funeral? =====
S(29, 31, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#16213a' }, g);
  const t30 = L(30), t31 = L(31);
  const cA = mk(g, '<rect x="-330" y="-380" width="660" height="760" rx="30" fill="#f5ecd0" stroke="#1a1a1a" stroke-width="8"/>'), pA = portrait(cA, C.oge, 0, -120, 150, '#1a1a1a'), tA = mk(cA, '<text class="t" y="190" text-anchor="middle" font-size="62" fill="#1a1a1a">THE FUNERAL</text><text class="t" y="270" text-anchor="middle" font-size="40" fill="#555">PRINCES GO HOME</text>');
  const ribbon = mk(cA, '<path d="M-60 -300 L60 -300 L40 -230 L-40 -230 Z" fill="#1a1a1a"/>');
  const cB = mk(g, '<rect x="-330" y="-380" width="660" height="760" rx="30" fill="#cfd8e3" stroke="#1a1a1a" stroke-width="8"/>'), cl = mk(cB, '<g stroke="#1a1a1a" stroke-width="6"><ellipse cx="-70" cy="-250" rx="130" ry="50" fill="#7f8c9a"/><ellipse cx="40" cy="-290" rx="100" ry="56" fill="#6e7c8a"/><ellipse cx="120" cy="-240" rx="110" ry="44" fill="#7f8c9a"/></g>'), mud = mk(cB, '<ellipse cx="0" cy="110" rx="260" ry="70" fill="#6b4a2a" stroke="#1a1a1a" stroke-width="6"/><ellipse cx="-80" cy="100" rx="80" ry="20" fill="#5a3b1a"/><path d="M-170 60 q10 -30 20 0 M150 70 q10 -26 20 0" stroke="#7a8a3a" stroke-width="6" fill="none"/>'), hr = H(cB, { coat: '#a07a50' });
  hr.place(-20, 130, .42, 1); mk(cB, '<text class="t" y="210" text-anchor="middle" font-size="52" fill="#1a1a1a">WET, COLD YEAR</text><text class="t" y="270" text-anchor="middle" font-size="38" fill="#444">MUD + LESS GRASS FOR HORSES</text>');
  const drops = []; for (let i = 0; i < 16; i++) drops.push({ p: el('path', { stroke: '#4aa3df', 'stroke-width': 6, 'stroke-linecap': 'round' }, cB), x: -200 + (i % 8) * 56 + (i > 7 ? 28 : 0), ph: rnd() * 5 });
  const tH = tagG(u, 'HISTORIANS DEBATE', 62, OR), tM = tagG(u, 'PROBABLY A MIX', 80, { fill: '#2e5f9e' }), plus = mk(u, '<text class="t big" font-size="170" style="stroke-width:20">+</text>', { opacity: 0 }), q = mk(u, '<text class="t big" font-size="150" style="stroke-width:18">?</text>', { opacity: 0 });
  return lt => {
    const mix = easeIO(lin(lt, t31 - .1, t31 + 1.0));
    show(tH, lt, .2, 960, 110, -1); setT(cA, lerp(520, 640, mix), 560 + bobY(lt, 0, 5), lerp(-3, -1, mix), .9 * pop(lt, .6) * lerp(1, .85, mix)); pA.pp.face(lt > .8 ? 's' : 'n');
    setT(cB, lerp(1400, 1280, mix), 560 + bobY(lt, 2, 5), lerp(3, 1, mix), .9 * pop(lt, t30 + .1) * lerp(1, .85, mix)); hr.rider ? 0 : 0;
    cl.setAttribute('transform', `translate(${12 * Math.sin(lt * 1.5)} 0)`); drops.forEach(d => { const yy = ((lt * 260 + d.ph * 60) % 220) - 190 + 90; d.p.setAttribute('d', `M${d.x} ${yy} l-8 26`); });
    hr.gallop(lt, 2, 3, true);
    q.setAttribute('opacity', (lt > .9 && lt < t31) ? 1 : 0); setT(q, 960, 560 + 8 * Math.sin(lt * 5), 5, pop(lt, .9));
    plus.setAttribute('opacity', lt > t31 + .2 ? 1 : 0); setT(plus, 960, 590, 0, pop(lt, t31 + .2)); show(tM, lt, t31 + .5, 960, 940, -2, 1e9, 1, true);
  };
});
// ===== 32: Europe got lucky =====
S(32, 32, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const rr = rz(m, G3.rusZ, 700, 380), rh = rz(m, G3.horde, 700, 400); rr(400); rh(400, .88);
  const clov = mk(u, '<g stroke="#1a1a1a" stroke-width="6"><circle cx="-26" cy="-26" r="30" fill="#2e8b57"/><circle cx="26" cy="-26" r="30" fill="#2e8b57"/><circle cx="-26" cy="26" r="30" fill="#2e8b57"/><circle cx="26" cy="26" r="30" fill="#2e8b57"/><path d="M0 40 Q8 90 40 110" fill="none" stroke-width="10"/></g>', { opacity: 0 });
  const tL = tagG(u, 'EUROPE GOT LUCKY', 84, { fill: '#2e8b57' }), tN = tagG(u, 'THEY NEVER CAME BACK IN FULL FORCE', 44, { fill: '#111' });
  return lt => {
    m.cam(lerp(500, 400, easeIO(lin(lt, 0, 6))), 385, 3.0 + lt * .08); y(lt, .1, '1242+');
    const v = m.S(P0.europe); show(clov, lt, 1.0, v[0], v[1] - 60, 8 * Math.sin(lt * 2), 1e9, 1.3, true); show(tL, lt, .5, 960, 900, -2, 1e9, 1, true); show(tN, lt, 3.0, 960, 1010, 1);
  };
});
// ===== 33: Europe asks =====
S(33, 33, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const rr = rz(m, G3.rusZ, 700, 380), rh = rz(m, G3.horde, 700, 400); rr(400); rh(400, .88);
  const qs = [P0.paris, P0.vienna, P0.legnica, P0.budapest, [340, 395]].map(() => mk(u, '<text class="t big" font-size="110" style="stroke-width:14">?</text>', { opacity: 0 }));
  const pb = portrait(g, C.bela, 0, 0, 90, '#1e8449'), pk = portrait(g, C.kn1, 0, 0, 90, '#ecf0f1'), tQ = tagG(u, 'WHO ARE THESE PEOPLE?', 70, { fill: '#2e5f9e' }), tC = tagG(u, 'ARE THEY COMING BACK?', 56, { fill: '#111' });
  const pts = [P0.paris, P0.vienna, P0.legnica, P0.budapest, [340, 395]];
  return lt => {
    m.cam(380, 385, 3.6 + lt * .02); y(lt, .1, '1242');
    qs.forEach((q, i) => { const p = m.S(pts[i]); show(q, lt, .4 + i * .35, p[0], p[1] - 70 + 8 * Math.sin(lt * 4 + i), 6 * Math.sin(lt * 2 + i), 1e9, 1, true); });
    setT(pb.g, 1600, 860 + bobY(lt, 0, 4), 0, pop(lt, .6)); pb.pp.face(lt > 2.6 ? 's' : 'o'); setT(pk.g, 1760, 860 + bobY(lt, 1, 4), 0, pop(lt, .9)); pk.pp.face('o');
    show(tQ, lt, .3, 960, 110, -1, 1e9, 1, true); show(tC, lt, 2.8, 960, 220, 1);
  };
});
// ===== 34: someone goes to find out =====
S(34, 34, (g, u, L) => {
  const sc = scenery(g, { sky: 'dawn', hill: HDAWN, sun: [1560, 520], sunC: '#ffd27a', clouds: 3, wind: 1 }), sp = speedG(g, 900, 1060, 16, '#7a6a3a');
  C.friar = { deel: '#5d4037', sash: '#e8dcc0', hat: 'hair', hair: '#3e2723', long: 1, s: 1.1, skin: '#d4a276' };
  const fr = P(g, C.friar); fr.hold('R', '<line x1="0" y1="-150" x2="0" y2="70" stroke="#6b4a2a" stroke-width="10" stroke-linecap="round"/>'); fr.arm('R', -8);
  const tF = tagG(u, 'EUROPE SENDS SOMEONE EAST', 56, { fill: '#111' }), q = mk(u, '<text class="t big" font-size="170" style="stroke-width:20">?</text>', { opacity: 0 });
  return lt => {
    sc(lt); sp(lt, .5); const b = fr.walk(lt, 7, 20); fr.place(700 + 40 * lin(lt, 0, 3), 1010, 1.25, 1, 0, b); fr.face('d');
    show(tF, lt, .6, 960, 160, -1); q.setAttribute('opacity', lt > 1.6 ? 1 : 0); setT(q, 1540, 330 + 8 * Math.sin(lt * 4), 6, pop(lt, 1.6));
  };
});
window.render = function (t) {
  window.__T = t;
  for (let i = 0; i < SEGS.length; i++) {
    const b = SEGS[i], on = t >= b.bs && t < b.be + .25;
    if (!on) { if (b.on !== false) { b.g.setAttribute('display', 'none'); b.on = false; } continue; }
    b.on = true; b.g.setAttribute('display', 'inline'); b.g.setAttribute('opacity', i === 0 ? 1 : lin(t, b.bs, b.bs + .2).toFixed(3));
    const lt = t - b.bs, d = b.be - b.bs, s = 1 + .04 * clamp(lt / d);
    b.cam.setAttribute('transform', `translate(${b.focus[0]} ${b.focus[1]}) scale(${s}) translate(${-b.focus[0]} ${-b.focus[1]})`);
    b.upd(lt, clamp(lt / d), d);
  }
  $('black').setAttribute('opacity', Math.max(1 - lin(t, 0, .5), lin(t, TL.end - 1.0, TL.end)).toFixed(3));
};
