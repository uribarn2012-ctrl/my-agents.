// ===== ch7 cast, helpers, lines 0-16 =====
Object.assign(C, {
  hul: { deel: '#8e2b2b', sash: '#f1c40f', hat: 'fur', hatC: '#2b2b2b', hatT: '#c9a227', must: 1, beard: 1, hair: '#1a1a1a', skin: '#c98f60', s: 1.15, mh: 380 },
  cal: { deel: '#161616', sash: '#f1c40f', hat: 'turban', hatC: '#f5eed8', hatT: '#f1c40f', beard: 1, long: 1, hair: '#2a2a2a', skin: '#d9a273', s: 1.08, mh: 390 },
  mam: { deel: '#2f63c9', sash: '#f5f5f5', hat: 'helmet', must: 1, hair: '#1a1a1a', skin: '#c98f60', s: 1.1 },
  kub: { deel: '#f1c40f', sash: '#c0392b', hat: 'mian', hair: '#1a1a1a', must: 1, beard: 1, fat: 1, skin: '#e6b48c', s: 1.2, k: 1.12, mh: 400 },
  polo: { deel: '#355c7d', sash: '#e8dcc0', hat: 'cap', hatC: '#d62d20', hair: '#a9742f', skin: '#f3d0a8', s: 1.0, k: 1.05, mh: 380 },
  sam: { deel: '#7b1d1d', sash: '#f1c40f', hat: 'plume', hatC: '#2b2b2b', hatT: '#c0392b', must: 1, hair: '#111', skin: '#e6c39a', s: 1.1 },
  jd: { deel: '#3b4a5a', sash: '#c0392b', hat: 'helmet', hair: '#111', skin: '#e6c39a', s: 1.05 },
  mer: { deel: '#8e44ad', sash: '#f1c40f', hat: 'turban', hatC: '#e8c24a', hatT: '#c0392b', beard: 1, hair: '#141414', skin: '#d9a273', s: 1.05 },
  gnv: { deel: '#f5f5f5', sash: '#c0392b', hat: 'cap', hatC: '#2c3e50', must: 1, hair: '#4a2f15', skin: '#f0c8a0', s: 1.05 },
  hord: { deel: '#b7950b', sash: '#7b241c', hat: 'fur', hatC: '#2b2b2b', hatT: '#922b21', must: 1, hair: '#1a1a1a', skin: '#d4a06e', s: 1.05 },
});
const DARK = '#150a22';
const fig = (p, x, y, s, flip, st, lt, i = 0) => { p.place(x, y, s, flip, 0, bob(lt, i)); p.walk(0, 9, 0, false); p.face(st); };
// moving item on a map (call .set before m.cam each frame)
function mvG(m, pt, markup, o = {}) { const g = m.add(pt, '<g>' + markup + '</g>', o), it = m.items[m.items.length - 1]; return { g: g.firstChild, root: g, set: p => { it.pt = p; } }; }
const shipMk = (col = '#8b5a2b', sail = '#f5ecd0') => `<g stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"><path d="M-60 0 L60 0 L44 26 L-44 26 Z" fill="${col}"/><rect x="-3" y="-90" width="6" height="92" fill="#4a2f15"/><path d="M6 -86 L54 -14 L6 -14 Z" fill="${sail}"/><path d="M-6 -78 L-40 -14 L-6 -14 Z" fill="${sail}"/></g>`;
function waveP(g, col, op = 1) { const p = el('path', { fill: col, opacity: op }, g); return (t, y, amp = 14, sp = 2, k = .012, ph = 0) => { let d = `M-20 1100 L-20 ${y}`; for (let x = -20; x <= 1940; x += 40) d += ` L${x} ${(y + amp * Math.sin(x * k + t * sp + ph)).toFixed(1)}`; p.setAttribute('d', d + ' L1940 1100 Z'); }; }
const coinMk = '<circle r="30" fill="#f1c40f" stroke="#1a1a1a" stroke-width="5"/><circle r="20" fill="none" stroke="#b7950b" stroke-width="4"/><text class="t" y="12" text-anchor="middle" font-size="30" fill="#7a5a10">$</text>';
const carpetMk = '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="-190" y="-48" width="380" height="96" rx="48" fill="#b03a2e"/><ellipse cx="190" cy="0" rx="26" ry="48" fill="#e8c24a"/><ellipse cx="190" cy="0" rx="10" ry="22" fill="#b03a2e"/><path d="M-150 -24 L-120 0 L-150 24 M-90 -24 L-60 0 L-90 24 M-30 -24 L0 0 L-30 24 M30 -24 L60 0 L30 24 M90 -24 L120 0 L90 24" fill="none" stroke="#f1c40f" stroke-width="7"/><path d="M-190 -34 v-14 M-190 -10 v-14 M-190 14 v14 M-190 34 v14" stroke-width="5"/></g>';
const shelfMk = (() => { let s = '<g stroke="#1a1a1a" stroke-width="5"><rect x="-150" y="-220" width="300" height="230" fill="#6b4423"/>'; const cs = ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22']; for (let r = 0; r < 3; r++) { s += `<rect x="-140" y="${-206 + r * 74}" width="280" height="62" fill="#4a2f15"/>`; for (let i = 0; i < 9; i++) s += `<rect x="${-134 + i * 30}" y="${-200 + r * 74 + (i % 3) * 4}" width="24" height="${54 - (i % 3) * 4}" fill="${cs[(i + r * 2) % 6]}" stroke-width="3"/>`; } return s + '</g>'; })();
const noteMk0 = '<g stroke="#1a1a1a" stroke-width="4"><rect x="-30" y="-38" width="60" height="76" rx="5" fill="#8a5a2b"/><rect x="-24" y="-32" width="48" height="64" fill="#f5ecd0"/></g>';
function smokeP(g, n = 12) { const a = []; for (let i = 0; i < n; i++) a.push({ e: el('circle', { r: 40 + rnd() * 40, fill: i % 3 ? '#4a4a52' : '#2e2e36', opacity: 0 }, g), x: 380 + rnd() * 700, ph: rnd(), sp: .28 + rnd() * .2 }); return (t, y0, k = 1) => a.forEach((c, i) => { const u = (t * c.sp + c.ph) % 1; c.e.setAttribute('cx', c.x + 60 * Math.sin(u * 5 + i) + u * 120); c.e.setAttribute('cy', y0 - u * 480); c.e.setAttribute('opacity', (Math.sin(Math.PI * u) * .6 * k).toFixed(2)); c.e.setAttribute('r', 40 + u * 70 + (i % 4) * 8); }); }
function bannerMen(g, n, col = '#e2362b') { return Array.from({ length: n }, (_, i) => { const p = P(g, C.hord); p.hold('R', bannerMk); return p; }); }

// ===== 0: Hulagu marches on Baghdad (map) =====
S(0, 0, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts, y = yearG(u); m.mon(RED); m.zone('song', .45); empRed(m);
  const bag = mi(m, P0.baghdad, '<circle r="46" fill="url(#gHalo)"/><g transform="translate(0 14) scale(.8)">' + houseMk('#f0d9a0', '#2e86c1', 64, 44) + '</g>'), bl = m.dot(P0.baghdad, 'BAGHDAD'); bl.g.setAttribute('opacity', 0);
  const rt = [P0.tabriz, [690, 560], P0.baghdad], ar = arrowG(u), mv = Array.from({ length: 7 }, (_, i) => mvG(m, rt[0], soldier('#e2362b'), { sc: 2.6 }));
  const po = portrait(u, Object.assign({}, C.hul, { pz: .62, pdy: 30 }), 0, 0, 150, '#7b1d1d'), tH = tagG(u, 'HULAGU', 60, { fill: '#7b1d1d' }), tG = tagG(u, "ANOTHER GRANDSON OF GENGHIS", 40, { fill: '#111' }), tB = tagG(u, 'NEXT STOP: BAGHDAD', 52, OR);
  return lt => {
    const e = easeIO(lin(lt, 0, 3.4)); y(lt, .1, '1250s');
    const k = easeIO(lin(lt, 1.0, 4.9)); mv.forEach((v, i) => { const kk = clamp(k * 1.1 - i * .06); v.set(along(rt.map(p => p), kk)); v.root.setAttribute('opacity', kk > .01 ? 1 : 0); });
    m.cam(lerp(930, 668, e), lerp(520, 568, e), lerp(2.0, 3.8 + lt * .04, e));
    marrow(m, ar, rt, k, '#fff'); setT(bag, 0, 0, 0, pop(lt, 2.2, .5) * (1 + .06 * Math.sin(lt * 5))); bl.g.setAttribute('opacity', lt > 3.0 ? 1 : 0);
    setT(po.g, 250, 830 + bobY(lt, 0, 5), 0, pop(lt, .4)); po.pp.face(lt > 3 ? 'a' : 'n'); show(tH, lt, .7, 250, 1000, -1); show(tG, lt, 1.5, 560, 140, -1, 4.4); show(tB, lt, 3.6, 1000, 920, 1);
  };
});
// ===== 1: Baghdad, caliphate capital, libraries =====
S(1, 1, (g, u, L) => {
  const sc = scenery(g, { sky: 'dusk', sun: [1560, 280], sunC: '#ffd27a', clouds: 3, hill: HDUSK, h: 720 });
  mk(g, '<circle cx="860" cy="640" r="560" fill="url(#gHalo)" opacity=".65"/>');
  const city = cityG(g, { wall: '#e3c88f', tw: '#c9a96a', roof: '#2e86c1' }), cal = P(g, C.cal), sh = mk(g, shelfMk), sc1 = [0, 1, 2, 3, 4].map(i => mk(g, scrollMk(70, 46), { opacity: 0 }));
  const tB = tagG(u, 'BAGHDAD', 72, { fill: '#7b1d1d' }), tC = tagG(u, 'THE CALIPH: LEADER OF THE ISLAMIC WORLD', 40, { fill: '#111' }), tL = tagG(u, 'FAMOUS LIBRARIES', 56, OR);
  return lt => {
    sc(lt); city.set(900, 940, 1.7); city.flag('#2874a6', pop(lt, .3, .5)); setT(sh, 230, 860, 0, pop(lt, 3.6, .5) * (1 + .02 * Math.sin(lt * 4)));
    sc1.forEach((s, i) => { const u2 = ((lt * .25 + i * .2) % 1); setT(s, 900 + (i - 2) * 190 + 40 * Math.sin(lt * 2 + i), 680 - u2 * 360, 20 * Math.sin(lt * 2 + i), pop(lt, 3.8 + i * .25, .4)); s.setAttribute('opacity', lt > 3.8 ? Math.sin(Math.PI * u2) * .95 : 0); });
    fig(cal, 1620, 1010, 1.3, -1, lt > 1.8 ? 'h' : 'n', lt); setT(cal.g, 1620 * 0 + 1620, 1010, 0, 1); cal.g.setAttribute('opacity', pop(lt, 1.6, .5) > .02 ? 1 : 0); cal.place(1620, 1010, 1.3 * pop(lt, 1.6, .5), -1, 0, bob(lt));
    show(tB, lt, .4, 900, 130, -2, 2.2); show(tC, lt, 1.9, 900, 130, 1, 3.6); show(tL, lt, 3.8, 700, 150, -2);
  };
});
// ===== 2: Baghdad falls =====
S(2, 2, (g, u, L) => {
  const sc = scenery(g, { sky: 'grey', clouds: 3, hill: HGREY, h: 720 }), y = yearG(u);
  const ws = mk(g, '<rect x="-20" y="900" width="1960" height="260" fill="#2f63c9"/>'), wv = waveP(g, '#3b78e0', .9), scr = [0, 1, 2, 3, 4, 5].map(i => mk(g, scrollMk(64, 40), { opacity: 1 }));
  const city = cityG(g, { wall: '#cdb48a', tw: '#b89a66', roof: '#7a2e2e' }), sm = smokeP(g, 14), cal = portrait(u, Object.assign({}, C.cal, { pz: .62, pdy: 30 }), 0, 0, 120, '#1a1a1a');
  const men = Array.from({ length: 5 }, (_, i) => { const p = P(g, C.hord); p.hold('R', bannerMk); return p; });
  const tA = tagG(u, 'THE CITY IS SACKED', 62, { fill: '#2b2b2b' }), tB = tagG(u, 'THE CALIPH IS KILLED', 56, { fill: '#111' });
  return lt => {
    sc(lt); y(lt, .1, '1258'); wv(lt, 930, 10, 2); city.set(1000, 905, 1.55); city.flag(lt > 1.3 ? '#e2362b' : '#2874a6', pop(lt, .1, .3));
    scr.forEach((s, i) => { const x = ((lt * 70 + i * 330) % 2100) - 100; setT(s, x, 985 + 14 * Math.sin(lt * 2 + i), 30 * Math.sin(lt * 1.5 + i), 1); });
    sm(lt, 640, clamp((lt - .6) / 1.2));
    men.forEach((p, i) => { const x = lerp(-120 - i * 150, 330 + i * 130, easeOut(lin(lt, 0, 2.6))); const b = p.walk(lt + i, 9, 22, lt < 2.6); p.place(x, 1040 - (i % 2) * 20, 1.0, 1, 0, b); p.face('n'); p.arm('R', -20); });
    setT(cal.g, 1640, 330, 0, pop(lt, 2.6, .4) * (1 - lin(lt, 4.1, 4.6) * .6)); cal.g.style.filter = `grayscale(${lin(lt, 3.3, 4.2)})`; cal.pp.face(lt > 3.3 ? 'd' : 'n');
    show(tA, lt, .9, 560, 150, -2, 3.0); show(tB, lt, 3.2, 1100, 150, 1);
  };
});
// ===== 3: the carpet legend (no violence shown) =====
S(3, 3, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#3b2f26' }, g); mk(g, '<circle cx="960" cy="540" r="720" fill="#6b5744" opacity=".7"/>');
  const cp = mk(g, carpetMk), st = stampG(u, 'L'), cal = portrait(u, Object.assign({}, C.cal, { pz: .62, pdy: 30 }), 0, 0, 150, '#1a1a1a'), qs = [0, 1, 2, 3].map(i => mk(u, '<text class="t big" font-size="110" style="stroke-width:14">?</text>', { opacity: 0 }));
  const t1 = tagG(u, 'THE CARPET STORY IS FAMOUS', 58, { fill: '#5d4037' }), t2 = tagG(u, "BUT THE OLD SOURCES DON'T AGREE", 54, { fill: '#111' }), t3 = tagG(u, 'ON HOW THE CALIPH DIED', 54, { fill: '#7b1d1d' });
  return lt => {
    setT(cp, 960 + 20 * Math.sin(lt * 1.3), 560 + 8 * Math.sin(lt * 2), -4 + 2 * Math.sin(lt), 1.35 * pop(lt, .5, .5));
    stampShow(st, lt, .3, 520, 230, -9); st.setAttribute('opacity', lt > .3 ? 1 : 0);
    setT(cal.g, 1560, 760 + bobY(lt, 0, 5), 0, pop(lt, 1.2, .4)); cal.pp.face(lt > 5 ? 's' : 'n');
    show(t1, lt, 1.6, 960, 880, -1, 5.2); show(t2, lt, 5.2, 960, 880, 1); show(t3, lt, 6.4, 960, 980, -1);
    qs.forEach((q, i) => { const a = 5.3 + i * .35; setT(q, 430 + i * 360 + 20 * Math.sin(lt * 3 + i), 330 + 18 * Math.sin(lt * 2.2 + i * 2), 8 * (i % 2 ? 1 : -1), pop(lt, a, .4)); q.setAttribute('opacity', lt > a ? 1 : 0); });
  };
});
// ===== 4-6: Ain Jalut =====
S(4, 6, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts, y = yearG(u), t5 = L(5), t6 = L(6); m.mon(RED); m.zone('song', .4); empRed(m);
  const ilk = rz(m, G3.ilk, P0.baghdad[0], P0.baghdad[1]);
  const wall = mi(m, P0.ainjalut, '<g stroke="#1a1a1a" stroke-width="5"><rect x="-26" y="-90" width="52" height="180" fill="#2f63c9"/><path d="M-26 -50 H26 M-26 -10 H26 M-26 30 H26 M0 -90 V-50 M-13 -50 V-10 M13 -50 V-10 M0 -10 V30 M-13 30 V90 M13 30 V90" stroke="#9fc0ff" stroke-width="3" fill="none"/></g>');
  const tE = mi(m, [P0.cairo[0] + 10, P0.cairo[1] + 20], '<text class="t big" font-size="66" style="stroke-width:12">EGYPT</text>'), bg = m.dot(P0.baghdad, 'BAGHDAD'), ar = arrowG(u), bx = bigG(u, 'AIN JALUT, 1260', 100);
  const rt = [P0.baghdad, [640, 575], P0.damascus, [P0.ainjalut[0] + 22, P0.ainjalut[1] - 4]];
  const ms = [0, 1, 2].map(i => P(u, C.mam)), tA = tagG(u, 'ONE OF THEIR FIRST BIG DEFEATS', 50, { fill: '#7b1d1d' }), tB = tagG(u, 'THE MAMLUKS OF EGYPT', 52, { fill: '#2f63c9' }), tC = tagG(u, 'THEY CAN BE BEATEN', 80, OR), x = mk(u, xMark, { opacity: 0 });
  return lt => {
    const e = easeIO(lin(lt, 0, 3)); y(lt, .1, '1260');
    ilk(Math.min(lt * 14 + 10, 120), lin(lt, 0, .4) * .88);
    m.cam(lerp(640, 600, e), lerp(575, 598, e), lerp(3.6, 4.2, e) + lt * .004);
    const k = easeIO(lin(lt, .8, t5 + 2.2)) * .97; marrow(m, ar, rt, k, '#ffffff'); const wp = m.S(P0.ainjalut);
    setT(wall, 0, 0, 0, pop(lt, t5 - .1, .45) * (1 + (lt > t5 + 2.2 && lt < t5 + 2.6 ? .25 : 0))); setT(tE, 0, 0, 0, pop(lt, t5 + .2, .4)); bg.g.setAttribute('opacity', 1);
    setT(x, wp[0] + 70, wp[1] - 10, 8, pop(lt, t5 + 2.3, .35)); x.setAttribute('opacity', lt > t5 + 2.3 ? 1 : 0);
    show(tA, lt, .4, 960, 140, -1, t5 - .2); show(bx, lt, t5 + .1, 1120, 220, -3, t6 - .2, 1, true); show(tB, lt, t5 + 1.4, 1480, 380, 2, t6 - .2);
    ms.forEach((p, i) => { const a = t5 + .6 + i * .25; const jump = lt > t6 ? Math.abs(Math.sin(lt * 6 + i)) * 26 : 0; p.place(1520 + i * 150, 1040 - jump, pop(lt, a, .4) * 1.05, -1, 0, 0); p.walk(0, 9, 0, false); p.face(lt > t6 ? 'h' : 'n'); if (lt > t6) { p.arm('L', -150); p.arm('R', 150); } });
    show(tC, lt, t6 + .3, 960, 880, -2, 1e9, 1, true);
  };
});
// ===== 7: Kublai Khan =====
S(7, 7, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#7b1d1d' }, g); mk(g, '<rect y="780" width="1920" height="300" fill="#e0b24a"/><path d="M0 780 H1920" stroke="#1a1a1a" stroke-width="8"/>');
  const lan = [260, 700, 1220, 1660].map((x, i) => mk(g, '<g stroke="#1a1a1a" stroke-width="5"><line y2="-90" stroke-width="4"/><ellipse cy="30" rx="42" ry="52" fill="#e2362b"/><rect x="-14" y="-4" width="28" height="12" fill="#f1c40f"/><rect x="-14" y="76" width="28" height="12" fill="#f1c40f"/></g>')), th = mk(g, '<g stroke="#1a1a1a" stroke-width="7" stroke-linejoin="round"><rect x="-190" y="-380" width="380" height="380" rx="30" fill="#c9a227"/><rect x="-150" y="-330" width="300" height="130" rx="20" fill="#8e1f14"/><rect x="-220" y="-170" width="440" height="40" rx="10" fill="#e8c24a"/></g>');
  const k = P(g, C.kub), c1 = P(g, C.cn), c2 = P(g, C.cn), tN = tagG(u, 'KUBLAI KHAN', 88, { fill: '#7b1d1d', stroke: '#f1c40f' }), tG = tagG(u, 'ANOTHER GRANDSON OF GENGHIS', 44, { fill: '#111' });
  return lt => {
    lan.forEach((l, i) => setT(l, [260, 700, 1220, 1660][i], 150 + 8 * Math.sin(lt * 2 + i), 4 * Math.sin(lt * 1.6 + i), 1.3));
    setT(th, 960, 820, 0, pop(lt, .2, .5)); fig(k, 960, 960, 1.55 * pop(lt, .4, .5), 1, lt > 1.6 ? 'h' : 'n', lt); k.arm('R', -140 + 12 * Math.sin(lt * 3)); k.arm('L', 40);
    fig(c1, 420, 1030, .95 * pop(lt, 1.0, .4), 1, 'h', lt, 1); fig(c2, 1500, 1030, .95 * pop(lt, 1.2, .4), -1, 'h', lt, 2);
    show(tN, lt, .6, 960, 120, -2, 1e9, 1, true); show(tG, lt, 1.9, 960, 220, 1);
  };
});
// ===== 8-9: Yuan dynasty, southern China, Beijing =====
S(8, 9, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts, t9 = L(9); m.mon(RED); m.zone('jin', .5); m.zone('song', .75); const nr = rz(m, G3.jin, P0.zhongdu[0], P0.zhongdu[1] - 20), sr = rz(m, G3.song, P0.nanjing[0], P0.nanjing[1] - 160);
  const tY = mi(m, [P0.zhongdu[0] - 70, P0.zhongdu[1] - 60], '<text class="t big" font-size="60" style="stroke-width:12">YUAN DYNASTY</text>'), tS = mi(m, [P0.song[0] - 10, P0.song[1] + 20], '<text class="t big" font-size="62" style="stroke-width:12">SOUTHERN CHINA</text>');
  const bj = mi(m, P0.zhongdu, '<g transform="scale(.42)">' + templeMk + '</g>'), bl = mi(m, [P0.zhongdu[0] + 10, P0.zhongdu[1] - 100], '<text class="t big" font-size="62" style="stroke-width:12">BEIJING TODAY</text>');
  const po = portrait(u, Object.assign({}, C.kub, { pz: .55, pdy: 40 }), 0, 0, 150, '#c9a227'), tC = tagG(u, 'THE NEW CAPITAL', 56, OR), y = yearG(u);
  return lt => {
    const e = easeIO(lin(lt, 0, 5.5)), z = easeIO(lin(lt, t9 - .3, t9 + 2.4));
    nr(lt * 500 + 10, .88); sr(lerp(0, 600, easeIO(lin(lt, 1.8, t9 - .1))), .88);
    m.cam(lerp(1470, 1500, e) + 0 * z, lerp(560, 590, e) - 40 * z, lerp(2.6, 3.4, e) + 1.2 * z);
    setT(tY, 0, 0, 0, pop(lt, .5, .4)); setT(tS, 0, 0, 0, pop(lt, 2.6, .4)); setT(bj, 0, 0, 0, pop(lt, t9 + .2, .5)); setT(bl, 0, 0, 0, pop(lt, t9 + .8, .4));
    setT(po.g, 270, 800 + bobY(lt, 0, 5), 0, pop(lt, .5, .45)); po.pp.face('h'); show(tC, lt, t9 + .5, 1460, 960, -2);
  };
});
// ===== 10: side quest =====
sideCard(10, 10, ['THE MAN NOBODY', 'BELIEVED'], null);
// ===== 11-12: Kublai's court and Marco Polo =====
S(11, 12, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1540, 190], clouds: 3, hill: HD, h: 640 }), t12 = L(12);
  mk(g, '<g transform="translate(1180 700) scale(1.9)">' + templeMk + '</g>');
  const k = P(g, C.kub), pm = P(g, C.polo), v1 = P(g, C.per), v2 = P(g, C.cn), cal = mk(u, '<g stroke="#1a1a1a" stroke-width="5"><rect x="-80" y="-80" width="160" height="150" rx="12" fill="#fff"/><rect x="-80" y="-80" width="160" height="40" rx="12" fill="#e2362b"/><text class="t" y="48" text-anchor="middle" font-size="76" fill="#1a1a1a">17</text></g>', { opacity: 0 });
  pm.hold('L', noteMk0);
  const tK = tagG(u, "KUBLAI'S COURT AMAZES VISITORS", 52, { fill: '#7b1d1d' }), tM = tagG(u, 'MARCO POLO', 70, { fill: '#a93226' }), tV = tagG(u, 'A YOUNG MERCHANT FROM VENICE', 44, { fill: '#111' }), tYr = tagG(u, 'ABOUT 17 YEARS AT THE COURT', 46, OR);
  return lt => {
    sc(lt); fig(k, 1180, 1010, 1.45, -1, 'h', lt, 0); k.arm('L', 150); k.arm('R', -30);
    fig(v1, 360, 1040, 1.0, 1, 'o', lt, 1); fig(v2, 640, 1050, .95, 1, 'o', lt, 2); v1.mark('!', lt, .6, 2.1); v2.mark('!', lt, .9, 2.1);
    const wk = easeOut(lin(lt, t12 - .1, t12 + 2.2)), x = lerp(-160, 860, wk), mv2 = wk < .99; const b = pm.walk(lt, 9, 20, mv2); pm.place(x, 1030, pop(lt, t12 - .2, .3) * 1.25, 1, 0, b); pm.face(mv2 ? 'n' : 'h'); pm.arm('L', 30);
    show(tK, lt, .2, 960, 150, -1, t12 - .1); show(tM, lt, t12 + .6, 560, 150, -2, 1e9, 1, true); show(tV, lt, t12 + 1.6, 560, 250, 1);
    setT(cal, 1720, 380, 6, pop(lt, t12 + 3.2, .45)); cal.setAttribute('opacity', lt > t12 + 3.2 ? 1 : 0); show(tYr, lt, t12 + 3.6, 1420, 130, -2);
  };
});
// ===== 13-14: what he describes =====
S(13, 14, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [300, 190], clouds: 3, wind: 1 }), t14 = L(14); mk(g, roadMk);
  const pm = P(g, C.polo), h = H(g, { coat: '#6b4423', blanket: '#e2362b', rider: C.hord }), sp = speedG(g, 920, 1040, 12, '#8a7340');
  pm.hold('L', noteMk0); pm.hold('R', quillMk);
  const money = mk(u, '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"><rect x="-110" y="-62" width="220" height="124" rx="10" fill="#e3dcb8"/><rect x="-92" y="-46" width="184" height="92" rx="6" fill="none" stroke="#7a6a3a" stroke-width="3"/><circle r="30" fill="#c0392b"/><text class="t" y="12" text-anchor="middle" font-size="34" fill="#fff">$</text></g>', { opacity: 0 });
  const coal = mk(u, '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"><path d="M-80 40 L-60 -10 L-20 -30 L20 -10 L50 -34 L84 20 L84 40 Z" fill="#2b2b33"/><path d="M-30 40 L-10 8 L24 40 Z" fill="#4a4a55"/></g><path d="M-6 -36 Q-26 -80 0 -108 Q4 -78 30 -88 Q28 -52 12 -34 Z" fill="#ff7a1a" stroke="#1a1a1a" stroke-width="4"/>', { opacity: 0 });
  const tP = tagG(u, 'PAPER MONEY', 50, { fill: '#5d4037' }), tC = tagG(u, 'BLACK STONES THAT BURN = COAL', 44, { fill: '#111' }), tF = tagG(u, 'FAST MESSENGERS', 56, OR), tE = tagG(u, 'THINGS EUROPE HAS NEVER SEEN', 46, { fill: '#7b1d1d' });
  return lt => {
    sc(lt); sp(lt, lt > t14 ? 1.2 : .25);
    fig(pm, 440, 1000, 1.45, 1, lt > .3 ? 'h' : 'n', lt); pm.arm('L', 40); pm.arm('R', -50 + 12 * Math.sin(lt * 8));
    show(tE, lt, .2, 960, 130, -1, 5.6);
    setT(money, 1250, 400 + 10 * Math.sin(lt * 3), -5, 1.5 * pop(lt, .7, .45)); money.setAttribute('opacity', lt > .7 && lt < 5.8 ? 1 : 0); show(tP, lt, 1.0, 1250, 560, 1, 2.9);
    setT(coal, 1500, 440, 4, 1.7 * pop(lt, 2.6, .45)); coal.setAttribute('opacity', lt > 2.6 && lt < 5.8 ? 1 : 0); show(tC, lt, 3.0, 1480, 610, -1, 5.7);
    const gx = lerp(-300, 2300, easeIO(lin(lt, t14 + .1, t14 + 3.1))); h.rider.face('h'); ride(h, lt, gx, 960, 1.15, 1, lt > t14, 30); h.g.setAttribute('opacity', lt > t14 ? 1 : 0);
    show(tF, lt, t14 + .3, 960, 330, -2, 1e9, 1, true);
  };
});
// ===== 15-16: Venice laughs =====
S(15, 16, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [1600, 180], clouds: 4, hill: HD, h: 700 }), t16 = L(16);
  mk(g, '<rect x="-20" y="840" width="1960" height="260" fill="#cdb48a"/><rect x="-20" y="790" width="1960" height="60" fill="#2e86c1"/>');
  cluster(g, [200, 520, 840, 1160, 1480, 1800], 1.6, [houseMk('#e0c48a', '#a93226', 90, 70), houseMk('#e8dcc0', '#2e5f9e', 80, 80), houseMk('#d9a38a', '#7a2e2e', 90, 60)], 800);
  const pm = P(g, C.polo), cr = [C.cap1, C.cap2, C.bou, C.paq].map(c => P(g, c)), sp = speech(u, 'MAKING IT UP?', 66, 330), nb = mk(u, '<g transform="scale(3)">' + noteMk + '</g>', { opacity: 0 });
  const qs = [0, 1, 2].map(i => mk(u, '<text class="t big" font-size="120" style="stroke-width:16">?</text>', { opacity: 0 })), tH = tagG(u, 'HISTORIANS STILL ARGUE ABOUT PARTS OF HIS STORY', 44, { fill: '#7b1d1d' }), tB = tagG(u, 'BACK HOME IN VENICE', 52, { fill: '#111' });
  pm.hold('L', noteMk0);
  return lt => {
    sc(lt); fig(pm, 420, 1040, 1.4, 1, lt > t16 ? 's' : 'h', lt); pm.arm('R', -60 + 10 * Math.sin(lt * 6)); pm.arm('L', 30);
    cr.forEach((p, i) => { const x = 960 + i * 220, j = lt > .5 + i * .1 && lt < t16 ? Math.abs(Math.sin(lt * 7 + i * 1.7)) * 18 : 0; p.place(x, 1040 - j, pop(lt, .3 + i * .15, .35) * 1.1, -1, 0, 0); p.walk(0, 9, 0, false); p.face(lt < t16 ? 'a' : 'f'); if (lt < t16) p.arm('R', -20 + 20 * Math.sin(lt * 8 + i)); });
    show(sp, lt, .8, 1420, 520, -3, t16 - .15); show(tB, lt, .1, 700, 160, -1, 1.7);
    setT(nb, 600, 470, -6, pop(lt, t16 + .1, .4)); nb.setAttribute('opacity', lt > t16 + .1 ? 1 : 0);
    qs.forEach((q, i) => { const a = t16 + .3 + i * .3; setT(q, 820 + i * 300, 330 + 16 * Math.sin(lt * 3 + i), 8 * (i - 1), pop(lt, a, .4)); q.setAttribute('opacity', lt > a ? 1 : 0); });
    show(tH, lt, t16 + .2, 960, 960, 1);
  };
});
