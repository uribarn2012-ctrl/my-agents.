// ===== ch7 lines 17-40 =====
const typhMk = '<g stroke="#1a1a1a" stroke-width="6" stroke-linecap="round" fill="none"><circle r="22" fill="#5d6d7e"/><path d="M0 -26 Q70 -30 74 30 Q70 70 10 74" stroke="#cfd8dc" stroke-width="16"/><path d="M0 26 Q-70 30 -74 -30 Q-70 -70 -10 -74" stroke="#cfd8dc" stroke-width="16"/><path d="M26 0 Q30 70 -30 74 Q-70 70 -74 10" stroke="#9aa8b4" stroke-width="12"/><path d="M-26 0 Q-30 -70 30 -74 Q70 -70 74 -10" stroke="#9aa8b4" stroke-width="12"/></g>';
const cloudMk = '<g stroke="#1a1a1a" stroke-width="5"><ellipse rx="90" ry="34" fill="#4a5560"/><ellipse cx="-40" cy="-20" rx="56" ry="36" fill="#56626e"/><ellipse cx="34" cy="-26" rx="60" ry="38" fill="#4a5560"/></g><path d="M-6 30 L14 30 L0 58 L20 58 L-12 100 L-4 66 L-20 66 Z" fill="#ffd84a" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"/>';
const postMk = '<g stroke="#1a1a1a" stroke-width="6"><rect x="-8" y="-210" width="16" height="210" fill="#6b4423"/><rect x="-120" y="-250" width="240" height="70" rx="10" fill="#e8dcc0"/></g><text class="t" y="-198" text-anchor="middle" font-size="52" fill="#7b1d1d">YAM</text>';
const signMk = t => `<g stroke="#1a1a1a" stroke-width="6"><rect x="-8" y="-230" width="16" height="230" fill="#6b4423"/><rect x="-170" y="-290" width="340" height="80" rx="10" fill="#e8dcc0"/></g><text class="t" y="-232" text-anchor="middle" font-size="46" fill="#7b1d1d">${t}</text>`;
const catMk = '<g fill="#0b0b12" stroke="#2a2a3a" stroke-width="3"><path d="M-150 0 L-110 -90 L110 -90 L150 0 Z"/><path d="M-60 -90 L0 -200 L60 -90 Z"/><circle cx="-100" cy="10" r="38"/><circle cx="100" cy="10" r="38"/></g>';
const catArm = '<g fill="#0b0b12" stroke="#2a2a3a" stroke-width="3"><rect x="-20" y="-14" width="300" height="28" rx="8"/><path d="M280 -14 Q330 -14 336 -50 L290 -52 Z"/><rect x="-60" y="-26" width="64" height="52" rx="8"/></g>';
const silkMk = '<g stroke="#1a1a1a" stroke-width="5"><rect x="-70" y="-44" width="140" height="88" rx="44" fill="#8e44ad"/><ellipse cx="70" cy="0" rx="22" ry="44" fill="#c39bd3"/><ellipse cx="70" cy="0" rx="8" ry="18" fill="#8e44ad"/><path d="M-50 -20 q20 -16 40 0 t40 0 M-50 14 q20 -16 40 0 t40 0" fill="none" stroke="#f1c40f" stroke-width="5"/></g>';
const spiceMk = '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"><path d="M-90 40 Q-100 -20 -60 -40 L-20 -40 Q20 -20 10 40 Z" fill="#d4ac0d"/><path d="M-10 40 Q-20 -10 20 -30 L60 -30 Q100 -10 90 40 Z" fill="#c0392b"/><path d="M-60 -40 q20 -20 40 0" fill="none"/><path d="M-30 6 h28 M40 10 h30" stroke-width="4"/></g>';
const powderMk = '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"><rect x="-50" y="-60" width="100" height="120" rx="22" fill="#3b3b44"/><path d="M-50 -30 H50 M-50 30 H50" stroke-width="6"/><path d="M0 -60 Q10 -90 30 -96" fill="none" stroke="#c9a66b" stroke-width="6"/><circle cx="34" cy="-100" r="10" fill="#ffd84a"/></g>';
const paperMk = '<g stroke="#1a1a1a" stroke-width="5"><rect x="-60" y="-72" width="120" height="144" rx="8" fill="#f5ecd0"/><path d="M-36 -40 h72 M-36 -14 h72 M-36 12 h72 M-36 38 h44" stroke-width="5" fill="none"/></g>';
// ===== 17: side quest =====
sideCard(17, 17, ['THE DIVINE WIND'], null);
// ===== 18-19: invasions of Japan (sea map) =====
S(18, 19, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts, t19 = L(19), y = yearG(u); m.mon(RED); empRed(m); el('path', { d: G3.kor, fill: RED, opacity: .88, stroke: '#1a1a1a', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }, m.w);
  const A = [P0.hapo[0] - 4, P0.hapo[1] + 4], B = [P0.hakata[0] - 6, P0.hakata[1] - 3], ar = arrowG(u), jp = mi(m, [P0.kyushu[0] + 34, P0.kyushu[1] - 20], '<text class="t big" font-size="66" style="stroke-width:12">JAPAN</text>'), kr = mi(m, [P0.korea[0] - 12, P0.korea[1] - 30], '<text class="t big" font-size="48" style="stroke-width:10">KOREA</text>');
  const ships = Array.from({ length: 9 }, (_, i) => mvG(m, A, shipMk(i % 2 ? '#8b5a2b' : '#6b4423'), { sc: 1.1 })), st = mi(m, [B[0] - 8, B[1] - 14], cloudMk), ty = mi(m, [B[0] - 4, B[1] - 6], typhMk);
  const bx = bigG(u, 'KAMIKAZE', 150), b2 = bigG(u, '= DIVINE WIND', 96), t74 = tagG(u, '1274: THE MONGOLS PULL BACK', 52, { fill: '#111' }), t81 = tagG(u, '1281: A TYPHOON DESTROYS THE FLEET', 52, { fill: '#7b1d1d' });
  return lt => {
    const e = easeIO(lin(lt, 0, 3)); const yr = lt < t19 + 4.6 ? '1274' : '1281'; y(lt, .1, yr);
    const f1 = easeIO(lin(lt, .4, 2.6)), r1 = easeIO(lin(lt, t19 + .6, t19 + 3.2)), f2 = easeIO(lin(lt, t19 + 4.8, t19 + 7)), sink = lin(lt, t19 + 7.4, t19 + 10.5);
    const k = lt < t19 + .5 ? f1 * .9 : lt < t19 + 4.6 ? .9 * (1 - r1) : f2 * .9; const n = lt < t19 + 4.6 ? 5 : 9;
    ships.forEach((s, i) => { const kk = k, off = [(i % 3 - 1) * 7, (Math.floor(i / 3) - 1) * 7 + 2 * Math.sin(lt * 2 + i)]; s.set([lerp(A[0], B[0], kk) + off[0] - (i > 4 ? 6 : 0), lerp(A[1], B[1], kk) + off[1]]); s.root.setAttribute('opacity', i < n && lt > .3 ? 1 - sink : 0); setT(s.g, 0, 0, (sink > 0 ? 40 * sink * (i % 2 ? 1 : -1) : 4 * Math.sin(lt * 2.5 + i)), 1, 1 - sink * .5); });
    m.cam(lerp(1620, 1636, e), lerp(566, 574, e), 9 + lt * .02); marrow(m, ar, [A, [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 4], B], lt < t19 + 4.6 ? f1 : f2, '#ffffff'); if (lt > t19 + 3.4 && lt < t19 + 4.6) ar.setAttribute('opacity', 1 - lin(lt, t19 + 3.4, t19 + 4.6));
    setT(jp, 0, 0, 0, pop(lt, .6, .4)); setT(kr, 0, 0, 0, pop(lt, 1.0, .4)); setT(st, 0, 0, 0, pop(lt, t19 + 1.6, .4) * (1 - lin(lt, t19 + 4, t19 + 4.6)) * 1.1); st.setAttribute('opacity', lt > t19 + 1.6 && lt < t19 + 4.6 ? 1 : 0);
    const tk = pop(lt, t19 + 5.6, .5); setT(ty, 0, 0, lt * 160, 1.4 * tk); ty.setAttribute('opacity', lt > t19 + 5.6 ? 1 : 0);
    show(t74, lt, t19 + 1.0, 960, 130, -1, t19 + 4.4); show(t81, lt, t19 + 5.0, 960, 130, 1, t19 + 8.6);
    show(bx, lt, t19 + 9.0, 960, 720, -3, 1e9, 1, true); show(b2, lt, t19 + 9.8, 960, 860, 2, 1e9, 1, true);
  };
});
// ===== 20: the huge 1281 fleet =====
S(20, 20, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', clouds: 3, hill: HD, h: 520, grass: 1 }), y = yearG(u);
  mk(g, '<rect x="-20" y="420" width="1960" height="700" fill="#2f63c9"/>'); const w1 = waveP(g, '#3b78e0', .8), ships = [];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 12; i++) ships.push({ g: mk(g, shipMk(i % 3 ? '#8b5a2b' : '#6b4423', i % 4 ? '#f5ecd0' : '#e8c24a')), r, i, ph: rnd() * 6 });
  const wf = waveP(g, '#2a55b0', .55), tA = tagG(u, 'ONE OF THE LARGEST SEA INVASIONS', 56, { fill: '#7b1d1d' }), tB = tagG(u, 'BEFORE MODERN TIMES', 56, { fill: '#111' }), tC = tagG(u, 'THE SECOND ATTACK', 60, OR);
  return lt => {
    sc(lt); y(lt, .1, '1281'); w1(lt, 540, 8, 2); wf(lt, 1010, 14, 1.8, .008, 2);
    ships.forEach(s => { const k = easeOut(lin(lt, .2 + s.r * .3, 4.4 + s.r * .3)), x = lerp(2200 + s.i * 70, 120 + s.i * 150 + (s.r % 2) * 70, k), sc2 = .5 + s.r * .22; setT(s.g, x, 560 + s.r * 120 + 8 * Math.sin(lt * 2 + s.ph), 3 * Math.sin(lt * 1.8 + s.ph), sc2); });
    show(tC, lt, .3, 960, 90, -1, 2.4); show(tA, lt, 2.6, 960, 120, -1); show(tB, lt, 3.8, 960, 230, 1);
  };
});
// ===== 21-22: samurai and the Hakata stone wall =====
S(21, 22, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1500, 170], clouds: 3, hill: HD, h: 360, grass: 1 }), t22 = L(22);
  mk(g, '<rect x="-20" y="400" width="1960" height="300" fill="#2f63c9"/><rect x="-20" y="700" width="1960" height="380" fill="#e6cf9a"/>'); const wv = waveP(g, '#3b78e0', .85);
  const sh = [0, 1, 2, 3].map(i => mk(g, shipMk('#6b4423')));
  const sam = [C.sam, C.jd, C.sam, C.jd, C.sam].map(c => P(g, c)); const ar = [0, 1, 2, 3, 4, 5].map(i => mk(g, arrowMk, { opacity: 0 }));
  mk(g, '<clipPath id="wc7"><rect id="wcr" x="0" y="640" width="0" height="440"/></clipPath>'); const wcr = g.querySelector('#wcr');
  const wl = mk(g, `<g clip-path="url(#wc7)" stroke="#1a1a1a" stroke-width="5"><rect x="-20" y="700" width="1960" height="190" fill="#9aa0a6"/>${Array.from({ length: 31 }, (_, i) => `<path d="M${i * 66 - 20} 700 v60 M${i * 66 + 13} 760 v66 M${i * 66 - 20} 826 v64" fill="none"/>`).join('')}<path d="M-20 760 H1940 M-20 826 H1940" stroke-width="4"/></g>`);
  const dots = Array.from({ length: 7 }, (_, i) => mk(u, `<circle r="26" fill="#333" stroke="#fff" stroke-width="4"/><text class="t" y="11" text-anchor="middle" font-size="30" fill="#fff">${i + 1}</text>`, { opacity: 0 }));
  const tA = tagG(u, 'HAKATA BAY: A STONE WALL ALONG THE BEACH', 50, { fill: '#7b1d1d' }), tB = tagG(u, 'BUILT IN THE YEARS BETWEEN', 48, { fill: '#111' }), tC = tagG(u, 'THEY HOLD ON FOR WEEKS', 62, OR);
  return lt => {
    sc(lt); wv(lt, 700, 8, 2); wcr.setAttribute('width', 1920 * easeOut(lin(lt, .5, 3.4)));
    sh.forEach((s, i) => setT(s, 500 + i * 360 + 14 * Math.sin(lt + i), 520 + (i % 2) * 40 + 6 * Math.sin(lt * 2 + i), 3 * Math.sin(lt * 1.6 + i), .6));
    sam.forEach((p, i) => { const a = 3.0 + i * .3; p.place(300 + i * 340, 920 - (lt > t22 ? Math.abs(Math.sin(lt * 5 + i)) * 12 : 0), 1.12 * pop(lt, a, .4), i % 2 ? -1 : 1, 0, 0); p.walk(0, 9, 0, false); p.face(lt > t22 ? 'a' : 'd'); p.arm('R', -100 + 8 * Math.sin(lt * 5 + i)); p.arm('L', 30); });
    wl.setAttribute('display', 'inline');
    ar.forEach((a, i) => { const t0 = 4.2 + i * .75, k = (lt - t0) / 1.1, ok = k > 0 && k < 1; a.setAttribute('opacity', ok ? 1 : 0); if (ok) setT(a, lerp(200 + i * 240, 560 + i * 280, k), lerp(430, 790, k) - 330 * Math.sin(Math.PI * k), 60 + 40 * k, .9); });
    show(tA, lt, .6, 960, 120, -1, 3.8); show(tB, lt, 3.6, 960, 120, 1, t22 - .15);
    dots.forEach((d, i) => { const a = t22 + .3 + i * .16; setT(d, 560 + i * 130, 240, 0, pop(lt, a, .3)); d.setAttribute('opacity', lt > a ? 1 : 0); }); show(tC, lt, t22 + .2, 960, 120, -1);
  };
});
// ===== 23: typhoon, Tick and the umbrella =====
S(23, 23, (g, u, L) => {
  const sc = scenery(g, { sky: 'storm', clouds: 7, cloudC: '#3a4450', cloudO: .95, hill: HSTORM, h: 340, grass: 1 }); mk(g, '<rect x="-20" y="380" width="1960" height="700" fill="#1f3f7a"/>');
  const w1 = waveP(g, '#27529b', .9), ships = Array.from({ length: 5 }, (_, i) => mk(g, shipMk('#5a3a1a', '#d8cfae'))), w2 = waveP(g, '#2d63b8', .8), w3 = waveP(g, '#3a78d0', .7);
  const rain = Array.from({ length: 50 }, () => ({ p: el('path', { stroke: '#cfe3ff', 'stroke-width': 3, opacity: .55 }, g), x: rnd() * 2100, y: rnd() * 1100, sp: 1100 + rnd() * 600 })), fl = el('rect', { width: 1920, height: 1080, fill: '#fff', opacity: 0 }, g);
  const tk = tickG(g), um = mk(g, '', {}), canopy = mk(um, '<path d="M-150 0 Q0 -170 150 0 Q112 -26 75 0 Q38 -26 0 0 Q-38 -26 -75 0 Q-112 -26 -150 0 Z" fill="#e2362b" stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"/><path d="M0 -112 V0 M-75 -80 L-75 0 M75 -80 L75 0" stroke="#1a1a1a" stroke-width="3" fill="none"/>'), pole = mk(um, '<path d="M0 0 V190" stroke="#1a1a1a" stroke-width="12" stroke-linecap="round"/><path d="M0 190 q0 28 -28 28" stroke="#1a1a1a" stroke-width="12" fill="none" stroke-linecap="round"/>');
  const tA = tagG(u, 'THE TYPHOON HITS', 70, { fill: '#7b1d1d' }), tB = tagG(u, 'MUCH OF THE FLEET GOES TO THE BOTTOM', 46, { fill: '#111' });
  return lt => {
    sc(lt); w1(lt, 600, 18, 3); const sink = lin(lt, 1.4, 4.0);
    ships.forEach((s, i) => setT(s, 300 + i * 340, 640 + 6 * Math.sin(lt * 2 + i) + sink * 260 + (i % 2) * 20, (i % 2 ? 1 : -1) * (6 + sink * 62 + 10 * Math.sin(lt * 4 + i)), .85 * (1 - sink * .25))); w2(lt, 700 - sink * 10, 26, 3.6, .01, 1); w3(lt, 840, 30, 4.4, .008, 2);
    rain.forEach(r => { const y = (r.y + lt * r.sp) % 1200 - 60, x = (r.x - lt * 360) % 2100; r.p.setAttribute('d', `M${x} ${y} l-30 70`); });
    const lf = ((lt * .7) % 1.9) < .12 ? .5 : 0; fl.setAttribute('opacity', lf);
    const tx = 1560, ty = 1070, pk = pop(lt, .5, .5); tickAt(tk, tx, ty, .62, pk);
    const wob = 7 * Math.sin(lt * 9) * lin(lt, 1, 2), flip = lin(lt, 2.6, 3.0), sy = 1 - 2 * easeIO(flip);
    const pks = Math.min(pk, 1); setT(um, tx + 175 * pks, ty - (740 - 70 * flip) * pks, 12 * Math.sin(lt * 12) * lin(lt, 2.2, 3.2) + wob, pks); setT(canopy, 0, flip > .5 ? 18 : 0, 0, 1 + .1 * flip, sy); um.setAttribute('opacity', pk > .1 ? 1 : 0);
    show(tA, lt, .3, 620, 130, -2, 3.4); show(tB, lt, 2.0, 620, 240, 1);
  };
});
// ===== 24: 2011, a shipwreck on the seafloor =====
S(24, 24, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: 'url(#sk_night)' }, g); mk(g, '<rect y="0" width="1920" height="1080" fill="#0e4d7a" opacity=".78"/><path d="M-20 900 Q400 860 900 905 T1940 890 L1940 1100 L-20 1100 Z" fill="#8c7a52"/><path d="M-20 960 Q600 940 1200 975 T1940 955 L1940 1100 L-20 1100 Z" fill="#76673f"/>'); const y = yearG(u), st = stampG(u, 'F');
  const rays = mk(g, '<path d="M200 -40 L420 1000 L120 1000 Z M700 -40 L1000 1000 L720 1000 Z M1300 -40 L1500 1000 L1180 1000 Z" fill="#9fe0ff" opacity=".12"/>');
  const wreck = mk(g, '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><path d="M-300 -20 Q-240 -150 -40 -170 Q220 -160 300 -50 L260 40 L-260 40 Z" fill="#5a3f26"/><path d="M-200 -100 L-170 40 M-100 -140 L-80 40 M0 -150 L10 40 M110 -140 L100 40 M210 -100 L190 40" stroke="#3a2614" stroke-width="12" fill="none"/><path d="M-40 -170 L-30 -330 L-6 -330 L10 -170 Z" fill="#4a3220"/></g><path d="M-320 50 Q-120 20 0 55 T320 50 L320 80 L-320 80 Z" fill="#76673f"/>');
  const dv = [0, 1].map(i => mk(g, '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><path d="M-50 -10 L-110 20 L-110 -4 Z M-30 10 L-90 44 L-96 22 Z" fill="#2c3e50"/><ellipse rx="64" ry="28" fill="#2c3e50"/><rect x="-18" y="-46" width="44" height="22" rx="8" fill="#f1c40f"/><circle cx="64" cy="-6" r="24" fill="#e6b48c"/><path d="M52 -20 Q74 -22 84 -8 L84 6 Q66 10 52 4 Z" fill="#9fe0ff"/></g>'));
  const bub = Array.from({ length: 16 }, () => ({ e: el('circle', { fill: 'none', stroke: '#d8f3ff', 'stroke-width': 3, opacity: .7 }, g), x: 200 + rnd() * 1500, ph: rnd() * 5, r: 6 + rnd() * 12 }));
  const tA = tagG(u, 'ARCHAEOLOGISTS DIVE TO THE SEAFLOOR', 50, { fill: '#0b3a5c' }), tB = tagG(u, 'ONE OF THOSE SHIPS, STILL THERE', 56, OR);
  return lt => {
    y(lt, .1, '2011'); setT(rays, 40 * Math.sin(lt * .5), 0, 0, 1); setT(wreck, 1020, 900, 0, pop(lt, .6, .6) * 1.3);
    dv.forEach((d, i) => setT(d, lerp(-200, 560 + i * 760, easeOut(lin(lt, 1 + i * .5, 4 + i * .5))) + 20 * Math.sin(lt * 1.5 + i), 520 + i * 80 + 24 * Math.sin(lt * 1.8 + i), 6 * Math.sin(lt * 1.2 + i), i ? -.9 : .9, .9));
    bub.forEach(b => { const k = ((lt * .18 + b.ph) % 1); b.e.setAttribute('cx', b.x + 18 * Math.sin(lt * 2 + b.ph)); b.e.setAttribute('cy', 1000 - k * 1000); b.e.setAttribute('r', b.r); });
    show(tA, lt, .4, 960, 130, -1, 4.2); show(tB, lt, 4.4, 960, 130, 1); stampShow(st, lt, 5.2, 1600, 300, 6); st.setAttribute('opacity', lt > 5.2 ? 1 : 0);
  };
});
// ===== 25-26: 23 million km2 =====
S(25, 26, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts, t26 = L(26); m.mon(RED);
  const rzs = [['yuan', 1470, 560], ['chag', 1000, 450], ['ilk', 640, 540], ['hord', 560, 400]].map(([k, x, yy]) => rz(m, G3[k], x, yy)), kr = m.dot(P0.korea, 'KOREA'), hu = m.dot(P0.hungary, 'HUNGARY');
  const num = bigG(u, '0', 150), un = bigG(u, 'KM2', 80), tL = tagG(u, 'THE LARGEST CONNECTED LAND EMPIRE', 58, OR), tH = tagG(u, 'IN HISTORY', 70, { fill: '#7b1d1d' });
  return lt => {
    const e = easeIO(lin(lt, 0, 3)); m.cam(lerp(1230, 1030, e), lerp(480, 480, e), lerp(1.7, 1.38, e));
    [[.4, 2.4], [1.6, 3.6], [2.8, 4.8], [4.0, 6.0]].forEach(([a, b], i) => rzs[i](lerp(0, 900, easeOut(lin(lt, a, b))), .88)); kr.g.setAttribute('opacity', lt > 1.2 ? 1 : 0); hu.g.setAttribute('opacity', lt > 5.6 ? 1 : 0);
    const n = Math.round(23 * easeIO(lin(lt, .6, 6.4)) * 10) / 10; num.querySelector('text').textContent = '~' + n.toFixed(1).replace(/\.0$/, '') + ' MILLION'; un.querySelector('text').textContent = 'SQUARE KILOMETERS';
    show(num, lt, .6, 960, 160, -2, t26 + .2); show(un, lt, .9, 960, 260, 1, t26 + .2);
    show(tL, lt, t26 + .3, 960, 880, -1); show(tH, lt, t26 + 1.1, 960, 990, 2);
  };
});
// ===== 27-28: trade booms, the Yam stretches =====
const ROUTE = () => { const P0 = G3.pts; return [P0.beijing, P0.xiaE, P0.otrar, P0.urgench, P0.sarai, P0.caffa]; };
function empireMap(g, op = .55) { const m = mapG3(g); m.mon(RED); const ps = ['yuan', 'chag', 'ilk', 'hord'].map(k => el('path', { d: G3[k], fill: RED, opacity: op, stroke: '#1a1a1a', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }, m.w)); m.ps = ps; return m; }
S(27, 28, (g, u, L) => {
  const m = empireMap(g), P0 = G3.pts, t28 = L(28), R = ROUTE(), road = el('path', { fill: 'none', stroke: '#ffd84a', 'stroke-width': 9, 'stroke-dasharray': '18 8', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, m.w), rl = el('path', { fill: 'none', stroke: '#1a1a1a', 'stroke-width': 16, opacity: .5, 'vector-effect': 'non-scaling-stroke', 'stroke-linecap': 'round' }, m.w);
  const coins = [0, 1, 2, 3, 4].map(i => mi(m, R[i + 1] || R[1], coinMk, { sc: 1.2 })), stn = R.map((p, i) => mi(m, p, '<circle r="15" fill="#fff" stroke="#1a1a1a" stroke-width="5"/>'));
  const pm = mi(m, [P0.otrar[0], P0.otrar[1] - 20], '<g transform="scale(.55)">' + postMk + '</g>');
  const tB = tagG(u, 'TRADE BOOMS INSIDE THE EMPIRE', 58, OR), tY = bigG(u, 'REMEMBER THE YAM?', 100), tS = tagG(u, 'NOW IT STRETCHES FROM CHINA TO EUROPE', 46, { fill: '#7b1d1d' });
  return lt => {
    const e = easeIO(lin(lt, 0, 5)); m.cam(lerp(1180, 1020, e), 480, lerp(1.5, 1.4, e));
    const k = easeIO(lin(lt, .4, t28 + 3.4)), pts = partial(R, k), d = 'M' + pts.map(p => p.join(' ')).join('L'); road.setAttribute('d', d); rl.setAttribute('d', d);
    coins.forEach((c, i) => { const a = .3 + i * .45; setT(c, 0, -Math.abs(Math.sin(lt * 4 + i)) * 12, 0, pop(lt, a, .4) * (1 - lin(lt, t28 - .2, t28 + .2))); });
    stn.forEach((s, i) => setT(s, 0, 0, 0, pop(lt, t28 + .4 + i * .35, .3))); setT(pm, 0, 0, 0, pop(lt, t28 + .2, .5));
    show(tB, lt, .3, 960, 130, -1, t28 - .2); show(tY, lt, t28 + .1, 960, 200, -2, t28 + 2.9, 1, true); show(tS, lt, t28 + 3.0, 960, 960, 1);
  };
});
// ===== 29: merchants safe from China to the Black Sea =====
S(29, 29, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [300, 200], clouds: 3, wind: 1 }); mk(g, roadMk); const sp = speedG(g, 920, 1040, 12, '#8a7340');
  const cart = cartG(g), h = H(g, { coat: '#8b5a2b', blanket: '#2e86c1' }), ms = [C.cn, C.mer, C.gnv].map(c => P(g, c)), s1 = mk(g, signMk('CHINA')), s2 = mk(g, signMk('BLACK SEA'));
  const tA = tagG(u, 'MERCHANTS TRAVEL SAFELY', 60, OR), tB = tagG(u, 'FROM CHINA TO THE BLACK SEA', 52, { fill: '#7b1d1d' });
  [[-70, -60, '#c0392b'], [20, -90, '#f1c40f'], [90, -50, '#2e86c1']].forEach(([x, yy, c]) => mk(cart.load, `<rect x="${x - 30}" y="${yy - 36}" width="60" height="50" rx="6" fill="${c}" stroke="#1a1a1a" stroke-width="5"/>`));
  return lt => {
    sc(lt); sp(lt, .8); cart.set(820, 960, 1.15, lt * 140); ride(h, lt, 1210, 960, 1.0, 1, true, 20);
    ms.forEach((p, i) => walkP(p, lt + i, 480 - i * 190 + 0, 1040 - i * 8, 1.05, 1, 'h'));
    setT(s1, lerp(560, -400, easeIO(lin(lt, 0, 2.2))), 900, 0, 1); setT(s2, lerp(2400, 1500, easeOut(lin(lt, 1.5, 3.0))), 900, 0, 1);
    show(tA, lt, .3, 960, 130, -1, 1.9); show(tB, lt, 1.9, 960, 130, 1);
  };
});
// ===== 30: what moved along the roads =====
S(30, 30, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [1600, 190], clouds: 4, hill: HD, h: 640 }); mk(g, roadMk); const h = H(g, { coat: '#6b4423', blanket: '#8e44ad', rider: C.mer }), sp = speedG(g, 930, 1040, 10, '#8a7340');
  const items = [portrait(u, C.chr, 0, 0, 100, '#2e5f9e').g, portrait(u, C.polo, 0, 0, 100, '#a93226').g, mk(u, spiceMk), mk(u, silkMk), mk(u, paperMk), mk(u, powderMk)], nm = ['MISSIONARIES', 'MARCO POLO', 'SPICES', 'SILK', 'PAPER', 'GUNPOWDER'];
  const tg = nm.map(n => tagG(u, n, 38, { fill: '#111' }));
  return lt => {
    sc(lt); sp(lt, 1); ride(h, lt, lerp(-300, 2300, easeIO(lin(lt, 0, 6.6))), 970, 1.05, 1, true, 24);
    items.forEach((it, i) => { const a = .3 + i * 1.0, x = 230 + i * 292, yy = 400 + 14 * Math.sin(lt * 3 + i); setT(it, x, yy, 4 * Math.sin(lt * 2 + i), (i < 2 ? 1 : 1.1) * pop(lt, a, .45)); it.setAttribute('opacity', lt > a ? 1 : 0); show(tg[i], lt, a + .1, x, 580, 0); });
  };
});
// ===== 31: web of trade, Pax Mongolica =====
const WEB = () => { const P0 = G3.pts; return [[P0.beijing, P0.karakorum], [P0.beijing, P0.quanzhou], [P0.beijing, P0.xiaE], [P0.xiaE, P0.otrar], [P0.karakorum, P0.otrar], [P0.otrar, P0.samarkand], [P0.samarkand, P0.tabriz], [P0.tabriz, P0.baghdad], [P0.tabriz, P0.caffa], [P0.otrar, P0.sarai], [P0.sarai, P0.caffa], [P0.caffa, P0.constant], [P0.constant, P0.venice], [P0.baghdad, P0.damascus], [P0.caffa, P0.kiev], [P0.quanzhou, P0.hanzhou]]; };
function webLines(m, col = '#ffd84a') { return WEB().map(e => ({ e, a: el('path', { fill: 'none', stroke: col, 'stroke-width': 18, opacity: .3, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, m.w), b: el('path', { fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }, m.w) })); }
function webSet(ws, k, op = 1) { ws.forEach((w, i) => { const kk = clamp(k * (ws.length + 3) - i), pts = partial(w.e, kk), d = 'M' + pts.map(p => p.join(' ')).join('L'); w.a.setAttribute('d', d); w.b.setAttribute('d', d); w.a.setAttribute('opacity', .3 * op); w.b.setAttribute('opacity', kk > 0 ? op : 0); }); }
S(31, 31, (g, u, L) => {
  const m = empireMap(g, .4), ws = webLines(m), P0 = G3.pts, nodes = ['beijing', 'karakorum', 'otrar', 'samarkand', 'tabriz', 'baghdad', 'sarai', 'caffa', 'venice', 'quanzhou', 'constant'].map(k => mi(m, P0[k], '<circle r="40" fill="url(#gHalo)"/><circle r="10" fill="#fff" stroke="#1a1a1a" stroke-width="4"/>'));
  const bx = bigG(u, 'PAX MONGOLICA', 130), tB = tagG(u, 'THE MONGOL PEACE', 60, OR);
  return lt => {
    m.cam(940, 490, 1.55 + lt * .01); webSet(ws, easeIO(lin(lt, .2, 3.2)));
    nodes.forEach((n, i) => setT(n, 0, 0, 0, pop(lt, .2 + i * .2, .4) * (1 + .12 * Math.sin(lt * 5 + i))));
    show(bx, lt, .5, 960, 150, -2, 1e9, 1, true); show(tB, lt, 1.6, 960, 940, 1);
  };
});
// ===== 32: religions side by side =====
S(32, 32, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [960, 200], clouds: 3, hill: HD, h: 700 });
  const bl = [[400, churchMk], [960, templeMk], [1520, mosqueMk]].map(([x, mkp]) => mk(g, '<g transform="scale(1.55)">' + mkp + '</g>'));
  const pp = [C.chr, C.bud, C.mus].map(c => P(g, c)), tA = tagG(u, 'PEOPLE KEEP THEIR OWN RELIGIONS', 58, OR), tB = tagG(u, 'RARE AT THE TIME', 56, { fill: '#7b1d1d' });
  return lt => {
    sc(lt); bl.forEach((b, i) => setT(b, [400, 960, 1520][i], 760, 0, pop(lt, .3 + i * .3, .5)));
    pp.forEach((p, i) => { fig(p, [560, 960, 1360][i] + (i - 1) * -60, 1040, 1.35 * pop(lt, .8 + i * .3, .4), 1, 'h', lt, i); p.arm('R', -30 + 14 * Math.sin(lt * 3 + i)); });
    show(tA, lt, .4, 960, 120, -1, 3.2); show(tB, lt, 3.3, 960, 120, 1);
  };
});
// ===== 33-34: something darker, the Black Death =====
S(33, 34, (g, u, L) => {
  const m = empireMap(g, .3), ws = webLines(m, '#b9a3d6'), P0 = G3.pts, t34 = L(34), y = yearG(u), shade = el('rect', { width: 1920, height: 1080, fill: DARK, opacity: 0 }, u);
  const R = [[P0.caffa, P0.constant, P0.sicily, P0.genoa], [P0.caffa, P0.constant, P0.venice], [P0.sarai, P0.caffa, P0.constant, P0.italy]], dts = R.map((r, j) => [0, 1, 2].map(i => mvG(m, r[0], '<circle r="16" fill="#7d3c98" stroke="#1a1a1a" stroke-width="4"/><circle r="30" fill="#7d3c98" opacity=".3"/>', { sc: 1 })));
  const hz = mi(m, P0.caffa, '<circle r="60" fill="#7d3c98" opacity=".5"/><circle r="26" fill="#4a1a5a" stroke="#1a1a1a" stroke-width="5"/>'), tA = tagG(u, 'THE SAME ROADS CARRY SOMETHING DARKER', 46, { fill: '#2b1a3a', stroke: '#b9a3d6' }), tB = tagG(u, 'THE BLACK DEATH', 76, { fill: '#2b1a3a', stroke: '#b9a3d6' });
  return lt => {
    shade.setAttribute('opacity', (.55 * lin(lt, 0, 2.2)).toFixed(2)); m.cam(lerp(900, 640, easeIO(lin(lt, t34 - .3, t34 + 3.4))), 470, lerp(1.6, 2.7, easeIO(lin(lt, t34 - .3, t34 + 3.4)))); webSet(ws, 1, .8);
    dts.forEach((row, j) => row.forEach((d, i) => { const k = clamp(((lt - t34 - .2 - j * .6) * .18 - i * .22)), pts = R[j]; d.set(along(pts, k)); d.root.setAttribute('opacity', lt > t34 + .2 && k > .01 ? 1 : 0); }));
    setT(hz, 0, 0, 0, pop(lt, 1.0, .5) * (1 + .15 * Math.sin(lt * 4)));
    y(lt, t34 + .1, '1340s'); show(tA, lt, .3, 960, 140, -1, t34 - .2); show(tB, lt, t34 + .2, 960, 960, 1);
  };
});
// ===== 35-36: Caffa, 1346 =====
S(35, 36, (g, u, L) => {
  const sc = scenery(g, { sky: 'grey', clouds: 4, hill: HGREY, h: 700 }), t36 = L(36), y = yearG(u);
  const city = cityG(g, { wall: '#d8d0bd', tw: '#b9b09a', roof: '#a93226' }), tents = [0, 1, 2].map(() => gerG(g)), men = Array.from({ length: 6 }, () => P(g, C.hord)), gs = [0, 1].map(() => P(g, C.gnv)), mist = smokeP(g, 10);
  const tA = tagG(u, 'CAFFA, ON THE CRIMEAN COAST', 52, { fill: '#111' }), tB = tagG(u, 'A GOLDEN HORDE ARMY', 52, { fill: '#7b1d1d' }), tC = tagG(u, 'AN ITALIAN TRADING TOWN', 50, { fill: '#2e5f9e' }), tD = tagG(u, 'THE PLAGUE BREAKS OUT', 64, { fill: '#2b3a1a', stroke: '#9db58a' });
  return lt => {
    sc(lt); y(lt, .1, '1346'); city.set(1450, 920, 1.25); city.flag('#f5f5f5', pop(lt, .3, .4));
    tents.forEach((t, i) => t.set(190 + i * 260, 880 + (i % 2) * 40, .8 + i * .05));
    men.forEach((p, i) => { const sick = lt > t36 + 5.4, x = 320 + i * 170 + (i % 2) * 40; p.place(x + (lt > t36 ? 0 : 0), 1040 - (i % 2) * 30, 1.0, 1, 0, sick ? 0 : bob(lt, i)); p.walk(0, 9, 0, false); p.face(sick ? 's' : 'n'); if (sick) { p.skin('#9db58a'); p.mark('s', lt, t36 + 5.4 + (i % 3) * .2, 1e9); p.tilt(10 * Math.sin(lt * 2 + i)); } p.arm('R', -20); });
    gs.forEach((p, i) => fig(p, 1230 + i * 240, 1040 - i * 10, .95, -1, lt > t36 + 5.4 ? 'f' : 'n', lt, i));
    mist(lt, 800, clamp((lt - t36 - 5.4) / 1.2) * .6);
    show(tA, lt, .3, 960, 130, -1, t36 - .15); show(tB, lt, t36 + .3, 600, 150, -1, t36 + 3.0); show(tC, lt, t36 + 3.1, 1400, 150, 1, t36 + 5.2); show(tD, lt, t36 + 5.5, 960, 150, -2);
  };
});
// ===== 37-38: catapult silhouettes and a question mark =====
S(37, 38, (g, u, L) => {
  const sc = scenery(g, { sky: 'dusk', clouds: 3, cloudC: '#6a5a7a', hill: ['#2c2438', '#241d30', '#1c1626'], h: 700, grass: 1, grassC: '#1a1426' }), t38 = L(38);
  const wall = mk(g, '<g fill="#0b0b12" stroke="#2a2a3a" stroke-width="4"><rect x="1240" y="520" width="700" height="600"/>' + Array.from({ length: 8 }, (_, i) => `<rect x="${1240 + i * 94}" y="480" width="56" height="50"/>`).join('') + '<rect x="1560" y="360" width="120" height="170"/><path d="M1540 360 L1620 280 L1700 360 Z"/></g>');
  const cats = [0, 1].map(i => ({ b: mk(g, catMk), a: mk(g, catArm) })), q = mk(u, '<text class="t big" font-size="320" style="fill:#1a0f2a;stroke:#b9a3d6;stroke-width:14px">?</text>', { opacity: 0 });
  const p1 = portrait(u, C.cn, 0, 0, 110, '#4a3a6a'), p2 = portrait(u, C.gnv, 0, 0, 110, '#4a3a6a'), qs = [0, 1].map(() => mk(u, '<text class="t big" font-size="90" style="stroke-width:12">?</text>', { opacity: 0 }));
  const tA = tagG(u, 'ACCORDING TO AN ITALIAN WRITER OF THE TIME', 44, { fill: '#2b1a3a', stroke: '#b9a3d6' }), tB = tagG(u, 'HISTORIANS ARGUE HOW MUCH IT MATTERED', 46, { fill: '#2b1a3a', stroke: '#b9a3d6' });
  return lt => {
    sc(lt); cats.forEach((c, i) => { const x = 280 + i * 460, ph = (lt * .6 + i * .5) % 1, ang = ph < .75 ? lerp(-78, -78, 0) + 0 : -78; const sw = ph < .55 ? lerp(-80, -80 + 10 * Math.sin(ph * 6), .5) : lerp(-80, 40, easeIO(lin(ph, .55, .72))) * (ph < .72 ? 1 : 1 - lin(ph, .72, 1)) + (ph >= .72 ? lerp(40, -80, lin(ph, .72, 1)) * 0 : 0); const a2 = ph < .55 ? -80 : ph < .72 ? lerp(-80, 35, easeOut(lin(ph, .55, .72))) : lerp(35, -80, easeIO(lin(ph, .72, 1))); setT(c.b, x, 1000, 0, 1.15, 1.15); setT(c.a, x, 880, a2, 1.15, 1.15); });
    const kq = pop(lt, 2.2, .5); setT(q, 1590, 330 + 10 * Math.sin(lt * 3), 4 * Math.sin(lt * 2), 1.0 * kq * (1 + .06 * Math.sin(lt * 4))); q.setAttribute('opacity', lt > 2.2 ? 1 : 0);
    show(tA, lt, .4, 960, 130, -1, t38 - .15); show(tB, lt, t38 + .2, 960, 130, 1);
    setT(p1.g, 420, 440, 0, pop(lt, t38 + .6, .4)); setT(p2.g, 1000, 440, 0, pop(lt, t38 + .9, .4)); p1.pp.face('s'); p2.pp.face('d');
    qs.forEach((z, i) => { const a = t38 + 1.3 + i * .3; setT(z, 420 + i * 580, 270 + 12 * Math.sin(lt * 3 + i), 8, pop(lt, a, .4)); z.setAttribute('opacity', lt > a ? 1 : 0); });
  };
});
// ===== 39: ships carry the plague to Italy and across Europe =====
S(39, 39, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts; m.mon(RED); empRed(m); const ar = arrowG(u), R = [P0.caffa, P0.constant, P0.sicily, P0.genoa];
  mk(m.w, `<clipPath id="eu7"><path d="${GEO.land}"/></clipPath>`); const dg = el('g', { 'clip-path': 'url(#eu7)' }, m.w);
  const cs = [['genoa', 0], ['venice', .5], ['sicily', .3], ['paris', 1.3], ['vienna', 1.6], ['metz', 1.7], ['london', 2.2], ['krakow', 2.2]].map(([k, d]) => ({ e: el('circle', { cx: P0[k][0], cy: P0[k][1], r: 0, fill: '#4a1a5a', opacity: .6 }, dg), d }));
  const sh = [0, 1, 2].map(() => mvG(m, R[0], shipMk('#2b2b33', '#6a6a76'), { sc: .5 })), shade = el('rect', { width: 1920, height: 1080, fill: DARK, opacity: .35 }, u);
  const lc = m.dot(P0.caffa, 'CAFFA'), li = mi(m, [P0.italy[0] + 20, P0.italy[1] - 10], '<text class="t big" font-size="66" style="stroke-width:12">ITALY</text>'), le = mi(m, [P0.paris[0], P0.paris[1] - 70], '<text class="t big" font-size="66" style="stroke-width:12">EUROPE</text>');
  const tA = tagG(u, 'SHIPS FROM THE BLACK SEA CARRY THE PLAGUE', 46, { fill: '#2b1a3a', stroke: '#b9a3d6' }), tB = tagG(u, 'TO ITALY, AND ACROSS EUROPE', 56, { fill: '#2b1a3a', stroke: '#b9a3d6' });
  return lt => {
    const e = easeIO(lin(lt, 0, 5.2)); const k = easeIO(lin(lt, .4, 3.4));
    sh.forEach((s, i) => { const kk = clamp(k * 1.0 - i * .07); s.set(along(R, kk)); s.root.setAttribute('opacity', kk > .01 ? 1 : 0); setT(s.g, 0, 0, 4 * Math.sin(lt * 3 + i), 1); }); 
    m.cam(lerp(520, 400, e), lerp(470, 440, e), lerp(2.4, 2.9, e)); marrow(m, ar, R, k, '#9b59b6');
    cs.forEach(c => c.e.setAttribute('r', lerp(0, 120, easeOut(lin(lt, 2.8 + c.d, 5.4 + c.d))))); setT(li, 0, 0, 0, pop(lt, 3.2, .4)); setT(le, 0, 0, 0, pop(lt, 4.4, .4));
    show(tA, lt, .3, 960, 120, -1, 3.8); show(tB, lt, 3.9, 960, 960, 1);
  };
});
// ===== 40: the empire cracks into four pieces =====
S(40, 40, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts; m.mon(RED); const ps = ['yuan', 'chag', 'ilk', 'hord'].map(k => el('path', { d: G3[k], fill: RED, opacity: .92, stroke: '#1a1a1a', 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' }, m.w));
  const jag = pts => { let d = 'M' + pts[0].join(' '); for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; for (let j = 1; j <= 3; j++) { const t = j / 3, o = (j % 2 ? 7 : -7); d += `L${(a[0] + (b[0] - a[0]) * t + o).toFixed(1)} ${(a[1] + (b[1] - a[1]) * t - o * .6).toFixed(1)}`; } } return d; };
  const ck = [G3.crkA, G3.crkB, G3.crkC].map(c => el('path', { d: jag(c), fill: 'none', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke', opacity: 0 }, m.w));
  const dir = [[24, 0], [0, -18], [-18, 20], [-26, -16]], shade = el('rect', { width: 1920, height: 1080, fill: DARK, opacity: 0 }, u), bx = bigG(u, 'ITS OWN FAMILY', 130), tA = tagG(u, "THE ONE ENEMY IT CAN'T CONQUER", 56, { fill: '#7b1d1d' });
  return lt => {
    m.cam(1030, 480, 1.38 + lt * .015); const sp = easeIO(lin(lt, 1.6, 4.0));
    ps.forEach((p, i) => p.setAttribute('transform', `translate(${(dir[i][0] * sp + (lt < 1.6 ? Math.sin(lt * 40 + i) * lin(lt, .6, 1.6) * 1.5 : 0)).toFixed(1)} ${(dir[i][1] * sp).toFixed(1)}) rotate(${(i % 2 ? 2 : -2) * sp} ${P0.karakorum[0]} ${P0.karakorum[1]})`));
    ck.forEach((c, i) => c.setAttribute('opacity', lt > .6 + i * .3 ? 1 - .5 * sp : 0));
    shade.setAttribute('opacity', (.45 * lin(lt, 1.5, 4.4)).toFixed(2)); show(tA, lt, .3, 960, 130, -1, 2.6); show(bx, lt, 2.4, 960, 900, -2, 1e9, 1, true);
  };
});
