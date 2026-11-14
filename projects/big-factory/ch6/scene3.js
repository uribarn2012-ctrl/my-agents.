
const noteMk = '<g transform="rotate(-8)" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"><rect x="-30" y="-38" width="60" height="76" rx="5" fill="#8a5a2b"/><rect x="-24" y="-32" width="48" height="64" fill="#f5ecd0"/><path d="M-16 -18 h32 M-16 -6 h32 M-16 6 h24" stroke-width="3" fill="none"/></g>';
const quillMk = '<g stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"><path d="M0 8 L30 -70 Q44 -86 52 -92 Q50 -70 36 -52 Z" fill="#fdfefe"/><path d="M0 8 L10 -14" stroke-width="5"/></g>';
const silver = '#cfd5db', silverD = '#8f9aa5';
function cluster(parent, xs, scale, houses, y) { xs.forEach((x, i) => mk(parent, `<g transform="translate(${x} ${y + (i % 2) * -22}) scale(${scale})">${houses[i % houses.length]}</g>`)); }
// ===== 16-17: Rubruck and his notebook =====
S(16, 17, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [300, 200], clouds: 4, wind: 1 }), sp = speedG(g, 900, 1040, 10, '#6d7a45'), rb = P(g, C.rub), t17 = L(17);
  rb.hold('L', noteMk); rb.hold('R', quillMk);
  const nb = mk(u, `<g transform="scale(5)">${noteMk}</g>`, { opacity: 0 }), sc2 = mk(u, '<g stroke="#3a2a1a" stroke-width="6" stroke-linecap="round" fill="none"><path d="M-70 -120 h140 M-70 -80 h120 M-70 -40 h140 M-70 0 h100 M-70 40 h130 M-70 80 h90"/></g>', { opacity: 0 });
  const ic = [houseMk('#e0c48a', '#7d3c98', 70, 50), horseMk, `<g transform="scale(1.4)">${cupMk}</g>`, templeMk.replace('<g ', '<g transform="scale(.42)" '), '<circle r="30" fill="#fff" stroke="#1a1a1a" stroke-width="5"/><circle cy="-12" r="8" fill="#e6b48c"/><rect x="-14" y="2" width="28" height="22" rx="8" fill="#3f6fa8"/>'].map(m2 => mk(u, `<g transform="scale(1.7)">${m2}</g>`, { opacity: 0 }));
  const tW = tagG(u, 'WILLIAM OF RUBRUCK', 64, { fill: '#5d4037' }), tF = tagG(u, 'A FRIAR FROM FLANDERS', 46, { fill: '#111' }), tE = tagG(u, 'HE WRITES DOWN EVERYTHING HE SEES', 52, OR), tB = tagG(u, 'ONE OF THE BEST PICTURES OF THE MONGOL CAPITAL', 42, { fill: '#7b1d1d' });
  return lt => {
    sc(lt); sp(lt, lt < 2.6 ? .7 : 0); const wk = easeOut(lin(lt, 0, 2.6)), mvg = lt < 2.6;
    const x = lerp(-150, 560, wk); rb.arm('L', 40); rb.arm('R', -60 + (lt > t17 ? 10 * Math.sin(lt * 9) : 0)); walkP(rb, lt, x, 1000, 1.45, 1, lt < 2.6 ? 'n' : 'h'); rb.arm('L', 40); rb.arm('R', -60 + (lt > t17 ? 10 * Math.sin(lt * 9) : 0));
    if (!mvg) { rb.walk(0, 9, 0, false); rb.place(560 + 0, 1000, 1.45, 1, 0, bob(lt)); }
    show(tW, lt, .5, 760, 190, -1, t17 - .1); show(tF, lt, 1.6, 760, 300, 1, t17 - .1);
    const nk = pop(lt, t17 + .2); setT(nb, 1330, 560, 4, nk * .96); nb.setAttribute('opacity', lt > t17 + .2 ? 1 : 0); setT(sc2, 1330, 570, 4, nk * .78); sc2.setAttribute('opacity', 0);
    ic.forEach((p, i) => { const a = t17 + 1.4 + i * .8; setT(p, 1330 + (i - 2) * 190, 230 + 12 * Math.sin(lt * 3 + i), 0, pop(lt, a, .4)); p.setAttribute('opacity', lt > a ? 1 : 0); });
    show(tE, lt, t17 + .5, 960, 880, -1, t17 + 3.6); show(tB, lt, t17 + 3.8, 960, 880, 1);
    if (lt > t17) rb.face('h');
  };
});
// ===== 18: Karakorum, smaller than a French village =====
S(18, 18, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [1500, 160], clouds: 3, wind: 1, h: 600 });
  const hs = [houseMk('#e0c48a', '#7d3c98', 70, 50), houseMk('#e8dcc0', '#c0392b', 64, 46), houseMk('#d9b58a', '#2e5f9e', 70, 50)];
  const A = mk(g, ''), Bv = mk(g, ''), ger = gerG(g);
  cluster(A, [-70, -10, 50], .5, hs, 0);
  cluster(Bv, [-260, -150, -40, 70, 180, 300], 1.0, [houseMk('#e8c9a0', '#a93226', 90, 64), houseMk('#f0dcb4', '#7a2e2e', 80, 58), houseMk('#e0b890', '#8a3a2a', 90, 64)], 0); mk(Bv, `<g transform="translate(-390 -22)">${churchMk}</g>`);
  const rb = P(g, C.rub), lt1 = tagG(u, 'KARAKORUM', 62, OR), lt2 = tagG(u, 'NOT VERY IMPRESSIVE', 46, { fill: '#111' }), vt = tagG(u, 'A FRENCH VILLAGE HE KNEW', 46, { fill: '#2e5f9e' }), sm = bigG(u, 'SMALLER THAN', 100);
  return lt => {
    sc(lt); setT(A, 480, 880 + bobY(lt, 0, 1), 0, pop(lt, .2)); ger.set(380, 900, .35 * pop(lt, .4), 1);
    setT(Bv, 1360, 910, 0, pop(lt, 3.2, .5));
    stand(rb, 960, 1010, 1.4, 1, lt < 3.0 ? 'd' : 'f', bob(lt)); rb.mark('?', lt, 3.4, 5.6); rb.arm('R', lt > 1.0 && lt < 3.0 ? -75 : 20); rb.arm('L', 30);
    show(lt1, lt, .4, 480, 640, -2); show(lt2, lt, 1.2, 480, 760, 1);
    show(sm, lt, 2.3, 960, 330, -2, 1e9, 1, true); show(vt, lt, 3.6, 1360, 640, 2);
  };
});
// ===== 19: people from everywhere =====
S(19, 19, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1500, 160], clouds: 3, wind: 1, h: 560 }), row = mk(g, '');
  cluster(row, [150, 420, 700, 980, 1260, 1540, 1810], .9, [houseMk('#e0c48a', '#7d3c98', 100, 80), houseMk('#e8dcc0', '#c0392b', 90, 70), houseMk('#d9b58a', '#2e5f9e', 100, 80)], 0); setT(row, 0, 800, 0, 1);
  const grp = [[C.cn, C.cn, 400, .2], [C.per, C.per, 960, 1.9], [C.cap1, C.cap2, 1500, 3.7]].map(([a, b, x, t0]) => ({ ps: [P(g, a), P(g, b)], x, t0 }));
  grp[0].ps[0].hold('R', '<g stroke="#1a1a1a" stroke-width="3"><rect x="-4" y="-34" width="8" height="40" fill="#6b4423"/><rect x="-18" y="-46" width="36" height="16" rx="3" fill="#8e9aa6"/></g>');
  grp[1].ps[0].hold('R', '<circle r="16" fill="#ffd84a" stroke="#1a1a1a" stroke-width="4"/>');
  const tg = [tagG(u, 'CHINESE CRAFTSMEN', 54, { fill: '#2e86c1' }), tagG(u, 'PERSIAN MERCHANTS', 54, { fill: '#6c3483' }), tagG(u, 'CAPTIVES FROM RUSSIA AND HUNGARY', 44, { fill: '#7b1d1d' })];
  return lt => {
    sc(lt);
    grp.forEach((G, gi) => G.ps.forEach((p, i) => { const k = easeOut(lin(lt, G.t0 - .2, G.t0 + 1.6)), mv = k < .98, x = lerp(-200, G.x + (i ? 130 : -60), k); if (gi < 2 && i === 0) { p.arm('R', -40 + 12 * Math.sin(lt * 8 + gi * 2)); } if (mv) walkP(p, lt * 1.1 + i, x, 1000, 1.25, 1, gi === 2 ? 's' : 'h'); else { p.walk(0, 9, 0, false); p.place(x, 1000, 1.25, 1, 0, bob(lt, i)); p.face(gi === 2 ? 's' : 'h'); } if (gi < 2 && i === 0) p.arm('R', -40 + 12 * Math.sin(lt * 8 + gi * 2)); }));
    tg.forEach((t, i) => show(t, lt, grp[i].t0 + 1.2, grp[i].x, 640 - (i === 2 ? 40 : 0), (i - 1) * 2, i === 2 ? 1e9 : grp[i + 1].t0 + 1.0));
  };
});
// ===== 20: temple, mosque and church on the same streets =====
S(20, 20, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1500, 160], clouds: 3, wind: 1, h: 600 }); mk(g, roadMk);
  const b = [templeMk, mosqueMk, churchMk].map(m2 => mk(g, m2)), W = [P(g, C.cn), P(g, C.per), P(g, C.rub)];
  const tg = ['BUDDHIST TEMPLE', 'MOSQUE', 'CHRISTIAN CHURCH'].map((t, i) => tagG(u, t, 46, { fill: ['#c0392b', '#1e8449', '#2e5f9e'][i] })), tS = tagG(u, 'ALL ON THE SAME STREETS', 56, OR);
  return lt => {
    sc(lt); [480, 960, 1440].forEach((x, i) => { setT(b[i], x, 840, 0, 1.25 * pop(lt, .4 + i * .9, .45)); show(tg[i], lt, .8 + i * .9, x, 900, (i - 1) * 2); });
    W.forEach((p, i) => { const x = ((lt * 110 + i * 700) % 2300) - 200; walkP(p, lt * 1.2 + i, x, 1010, 1.15, 1, 'h'); });
    show(tS, lt, 3.0, 960, 150, -1);
  };
});
// ===== 21: Paquette from Metz =====
S(21, 21, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const a1 = arrowG(u), a2 = arrowG(u), r1 = [P0.metz, P0.hungary], r2 = [P0.hungary, P0.krakow, P0.kiev, P0.volga, P0.steppe, P0.karakorum];
  const dM = m.dot(P0.metz, 'METZ'), dH = m.dot(P0.hungary, 'HUNGARY'), dK = m.dot(P0.karakorum, 'KARAKORUM');
  const pq = portrait(u, C.paq, 0, 0, 135, '#7a8bbf'), tP = tagG(u, 'PAQUETTE, FROM METZ', 52, { fill: '#5b6fa8' }), tC = tagG(u, 'CAPTURED IN HUNGARY', 50, { fill: '#7b1d1d' }), tM = tagG(u, 'NOW AT THE MONGOL COURT', 54, OR);
  return lt => {
    const e2 = easeIO(lin(lt, 3.4, 6.2)), e1 = easeIO(lin(lt, 1.6, 3.0));
    let cx = lerp(lerp(330, 440, e1), 1000, e2), cy = lerp(385, 400, e2), s = lerp(4.5, 1.5, e2); m.cam(cx, cy, s); y(lt, .1, '1250s');
    marrow(m, a1, r1, easeIO(lin(lt, 1.6, 3.0)), '#fff'); marrow(m, a2, r2, easeIO(lin(lt, 3.6, 6.4)), '#fff');
    dM.g.setAttribute('opacity', lt > .3 ? 1 : 0); dH.g.setAttribute('opacity', lt > 3.0 ? 1 : 0); dK.g.setAttribute('opacity', lt > 6.3 ? 1 : 0);
    setT(pq.g, 260, 790 + bobY(lt, 0, 5), 0, pop(lt, .2)); pq.pp.face(lt < 3.2 ? 'n' : lt < 6.0 ? 's' : 'n');
    show(tP, lt, .5, 480, 960, -1); show(tC, lt, 3.0, 960, 160, 1, 6.0); show(tM, lt, 6.3, 1300, 900, -2);
  };
});
// ===== 22: side quest card =====
sideCard(22, 22, ['THE DRINKING TREE'], null);
// ===== 23-26: the silver drinking tree =====
S(23, 26, (g, u, L) => {
  const TX = 760, t24 = L(24), t25 = L(25), t26 = L(26);
  el('rect', { width: 1920, height: 1080, fill: '#4a2530' }, g); mk(g, '<rect x="0" y="0" width="1920" height="620" fill="#5d2e3a"/><path d="M0 0 H1920 V90 Q1440 150 960 90 T0 90 Z" fill="#7d1f1f"/>' + [120, 560, 1360, 1800].map(x => `<rect x="${x - 26}" y="90" width="52" height="780" fill="#7a5230" stroke="#1a1a1a" stroke-width="6"/>`).join('') + '<rect x="0" y="870" width="1920" height="210" fill="#8a2f2f"/><rect x="0" y="870" width="1920" height="16" fill="#f1c40f"/>');
  const tree = el('g', {}, g), body = mk(tree, `<g stroke="#1a1a1a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M${TX - 56} 900 Q${TX - 34} 700 ${TX - 22} 330 L${TX + 22} 330 Q${TX + 34} 700 ${TX + 56} 900 Z" fill="${silver}"/><path d="M${TX} 650 Q${TX - 150} 650 ${TX - 360} 490 M${TX} 560 Q${TX - 120} 560 ${TX - 140} 480 M${TX} 560 Q${TX + 120} 560 ${TX + 140} 480 M${TX} 650 Q${TX + 150} 650 ${TX + 360} 490" fill="none" stroke="${silverD}" stroke-width="22"/><path d="M${TX} 650 Q${TX - 150} 650 ${TX - 360} 490 M${TX} 560 Q${TX - 120} 560 ${TX - 140} 480 M${TX} 560 Q${TX + 120} 560 ${TX + 140} 480 M${TX} 650 Q${TX + 150} 650 ${TX + 360} 490" fill="none" stroke="${silver}" stroke-width="12"/></g>`);
  const leaves = []; for (let i = 0; i < 56; i++) { const a = rnd() * Math.PI * 2, r = 30 + rnd() * 170, lx = TX + Math.cos(a) * r * 1.5, ly = 420 + Math.sin(a) * r * .75 + (rnd() > .6 ? 110 : 0); leaves.push({ g: mk(tree, `<ellipse rx="32" ry="17" fill="${i % 2 ? silver : '#e4e8ec'}" stroke="#1a1a1a" stroke-width="4"/>`), x: lx, y: ly, r: rnd() * 180 }); }
  const SPX = [TX - 360, TX - 140, TX + 140, TX + 360], SPY = [490, 480, 480, 490], LQ = ['#8e1f3a', '#f7f2e8', '#e8e0a0', '#e8a317'], NM = ['WINE', "MARE'S MILK", 'RICE WINE', 'HONEY MEAD'];
  const nz = SPX.map((x, i) => mk(tree, `<path d="M${x - 10} ${SPY[i] - 6} L${x + 10} ${SPY[i] - 6} L${x + 5} ${SPY[i] + 26} L${x - 5} ${SPY[i] + 26} Z" fill="${silverD}" stroke="#1a1a1a" stroke-width="5"/>`));
  const st = SPX.map((x, i) => el('path', { stroke: LQ[i], 'stroke-width': 11, 'stroke-linecap': 'round', fill: 'none', 'stroke-dasharray': '20 12', opacity: 0 }, tree));
  const bw = SPX.map((x, i) => mk(g, `<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><path d="M-62 -24 L62 -24 Q56 40 0 44 Q-56 40 -62 -24 Z" fill="${silver}"/><ellipse cx="0" cy="-24" rx="62" ry="14" fill="${LQ[i]}"/><rect x="-10" y="40" width="20" height="30" fill="${silverD}"/><rect x="-42" y="68" width="84" height="14" rx="6" fill="${silver}"/></g>`));
  const ang = mk(tree, `<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"><path d="M-26 -10 Q-80 -56 -64 -96 Q-34 -62 -12 -52 Z" fill="#fdfefe"/><path d="M26 -10 Q80 -56 64 -96 Q34 -62 12 -52 Z" fill="#fdfefe"/><path d="M-22 40 L-14 -34 L14 -34 L22 40 Z" fill="#f4f6f8"/><circle cy="-52" r="22" fill="#f3d0a8"/><path d="M-22 -58 Q0 -86 22 -58 Q0 -66 -22 -58 Z" fill="#f1c40f"/><ellipse cx="0" cy="-92" rx="24" ry="7" fill="none" stroke="#f1c40f" stroke-width="5"/></g>`);
  const tr = mk(ang, '<g stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"><path d="M0 0 L70 -14 L70 14 Z" fill="#f1c40f"/><path d="M70 -14 L96 -30 L96 30 L70 14 Z" fill="#f1c40f"/></g>'), waves = mk(ang, '<g stroke="#f1c40f" stroke-width="6" fill="none" stroke-linecap="round"><path d="M120 -24 Q136 0 120 24"/><path d="M142 -40 Q166 0 142 40"/><path d="M164 -56 Q196 0 164 56"/></g>');
  const bq = P(g, C.bou), pbz = mk(g, '<g stroke="#1a1a1a" stroke-width="4"><rect x="-40" y="-14" width="80" height="14" rx="4" fill="#cfd5db"/></g>');
  bq.hold('R', '<g stroke="#1a1a1a" stroke-width="3"><rect x="-4" y="-40" width="8" height="46" fill="#6b4423"/><rect x="-20" y="-54" width="40" height="18" rx="4" fill="#8e9aa6"/></g>');
  const tk = tickG(g), cups = [0, 1, 2, 3].map(() => mk(u, cupMk, { opacity: 0 })), tray = mk(u, '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"><rect x="-100" y="-8" width="200" height="18" rx="8" fill="#cfd5db"/><rect x="-14" y="10" width="28" height="10" fill="#9aa5b0"/></g>', { opacity: 0 }), pops = [0, 1, 2, 3].map(() => mk(u, '<circle r="6" fill="#fff"/>', { opacity: 0 }));
  const tS = tagG(u, 'ONE OF THE STRANGEST MACHINES OF THE MIDDLE AGES', 46, { fill: '#111' }), tB = tagG(u, 'A GOLDSMITH FROM PARIS', 52, { fill: '#7a2e2e' }), tN = tagG(u, 'GUILLAUME BOUCHER', 44, { fill: '#5d4037' }), tH = tagG(u, 'CAPTURED IN HUNGARY', 46, { fill: '#7b1d1d' }), tA = tagG(u, 'A SILVER ANGEL WITH A TRUMPET', 50, { fill: '#2e5f9e' }), tF = tagG(u, 'FOUR DRINKS FROM ONE TREE', 54, OR), tl = NM.map((t, i) => tagG(u, t, 36, { fill: '#111', stroke: LQ[i] })), fact = stampG(u, 'F'), tW = tagG(u, 'RUBRUCK SAW IT WITH HIS OWN EYES', 40, { fill: '#111' });
  return lt => {
    const grow = easeOut(lin(lt, .2, 2.0)); tree.setAttribute('transform', `translate(0 ${900 * (1 - grow)}) `); setT(tree, TX * (1 - grow) * 0, 900 + 0, 0, 1); tree.setAttribute('transform', `translate(${TX} 900) scale(${.2 + .8 * grow} ${.04 + .96 * grow}) translate(${-TX} -900)`);
    leaves.forEach((l, i) => { l.g.setAttribute('transform', `translate(${l.x} ${l.y + 5 * Math.sin(lt * 1.6 + i)}) rotate(${l.r + 14 * Math.sin(lt * 1.3 + i)})`); });
    const up = Math.min(1, lin(lt, t25 + .3, t25 + 1.3)); tr.setAttribute('transform', `rotate(${lerp(70, -40, easeOut(up)) + (lt > t25 + 1.3 ? 6 * Math.sin(lt * 5) : 0)})`); waves.setAttribute('opacity', lt > t25 + 1.1 ? (.5 + .5 * Math.sin(lt * 9)) : 0); waves.setAttribute('transform', `rotate(-40)`);
    setT(ang, TX, 290 + 8 * Math.sin(lt * 2) - 20 * (1 - grow), 0, pop(lt, 1.4) * 1.7);
    SPX.forEach((x, i) => { const a = t26 + .3 + [0, 1.2, 2.6, 3.7][i], k = lin(lt, a, a + .35), by = 745; st[i].setAttribute('opacity', k > 0 ? 1 : 0); st[i].setAttribute('d', `M${x} ${SPY[i] + 26} Q${x + (i < 2 ? 6 : -6)} ${(SPY[i] + by) / 2} ${x} ${lerp(SPY[i] + 26, by, k)}`); st[i].setAttribute('stroke-dashoffset', -lt * 90 % 32); setT(bw[i], x, 800 + (lt > a ? 3 * Math.sin(lt * 6 + i) : 0), 0, pop(lt, 1.0 + i * .2) * .98); show(tl[i], lt, a + .2, x, 930, (i - 1.5) * 2); });
    nz.forEach(n => n.setAttribute('opacity', pop(lt, 1.5) > .3 ? 1 : 0));
    show(tS, lt, 2.3, 1010, 150, -1, t24 - .2);
    const bk = pop(lt, t24 + .3), hm = Math.sin(lt * 12); bq.arm('L', 20); bq.arm('R', -70 + 22 * hm); stand(bq, 1490, 975, 1.35, -1, 'h', bob(lt)); bq.arm('R', -70 + 22 * hm); bq.arm('L', 20); bq.g.setAttribute('opacity', lt > t24 && lt < t25 + .6 ? bk : 0); setT(pbz, 1405, 960, 0, lt > t24 && lt < t25 + .6 ? 1.2 : 0);
    show(tB, lt, t24 + .4, 1480, 520, 1, t25 - .1); show(tN, lt, t24 + 1.8, 1480, 610, -2, t25 - .1); show(tH, lt, t24 + 3.2, 1480, 700, 2, t25 - .1);
    show(tA, lt, t25 + .2, 1400, 200, -2, t26 - .1); show(tF, lt, t26 + .1, 1400, 200, 1, t26 + 4.0);
    const tt = t26 + 3.9, kk = pop(lt, tt, .5); tickAt(tk, 1620, 1075, .5, kk * (1 - lin(lt, t26 + 7.3, t26 + 7.7)));
    const tb = 3 * Math.sin(lt * 4), tv = kk * (1 - lin(lt, t26 + 7.3, t26 + 7.7)); setT(tray, 1815, 582 + tb, 0, tv); tray.setAttribute('opacity', lt > tt + .2 ? 1 : 0); cups.forEach((c, i) => { const a = tt + .3 + i * .12; setT(c, 1815 + (i - 1.5) * 46, 555 + tb, 0, .75 * pop(lt, a, .3) * (lt < t26 + 7.3 ? 1 : tv)); c.setAttribute('opacity', lt > a ? 1 : 0); });
    stampShow(fact, lt, t26 + 5.0, 1440, 250, 6); show(tW, lt, t26 + 5.3, 1440, 395, -1);
  };
});
// ===== 27: side quest card =====
sideCard(27, 27, ['THE GREAT', 'RELIGION DEBATE'], '1254');
// ===== 28-31: the great religion debate =====
S(28, 31, (g, u, L) => {
  const t29 = L(29), t30 = L(30), t31 = L(31);
  el('rect', { width: 1920, height: 1080, fill: '#3a2a44' }, g); mk(g, '<rect x="0" y="0" width="1920" height="260" fill="#5a2a4a"/><path d="M0 0 H1920 V110 Q1440 170 960 110 T0 110 Z" fill="#7d1f1f"/><rect x="40" y="0" width="30" height="900" fill="#7a5230" stroke="#1a1a1a" stroke-width="6"/><rect x="1850" y="0" width="30" height="900" fill="#7a5230" stroke="#1a1a1a" stroke-width="6"/><rect x="0" y="900" width="1920" height="180" fill="#6b4423"/><rect x="0" y="900" width="1920" height="14" fill="#f1c40f"/><rect x="1480" y="870" width="360" height="40" rx="6" fill="#c0392b" stroke="#1a1a1a" stroke-width="6"/>');
  const X = [180, 560, 900, 1240], mg = P(g, C.mong), rb = P(g, C.rub), D = [P(g, C.chr), P(g, C.mus), P(g, C.bud)];
  const cols = ['#2e5f9e', '#1e8449', '#e67e22'], syms = [crossMk, crescMk, wheelMk];
  const pod = [1, 2, 3].map(i => mk(g, `<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="-80" y="-170" width="160" height="170" rx="10" fill="${cols[i - 1]}"/><rect x="-92" y="-184" width="184" height="24" rx="8" fill="#8a5a2b"/><g transform="translate(0 -88) scale(.9)">${syms[i - 1]}</g></g>`));
  const bcol = ['#2e5f9e', '#1e8449', '#e67e22', '#2e5f9e'];
  const bub = [0, 1, 2, 3].map(i => mk(u, `<ellipse rx="110" ry="84" fill="#fff" stroke="#1a1a1a" stroke-width="6"/><path d="M-20 76 L-8 130 L30 74 Z" fill="#fff" stroke="#1a1a1a" stroke-width="6"/><ellipse rx="104" ry="78" fill="#fff"/><g transform="translate(0 -6) scale(1.15)">${[crossMk, crescMk, wheelMk, crossMk][i].replace(/#fff/g, bcol[i])}</g>`, { opacity: 0 }));
  const xs = [0, 1, 2].map(() => mk(u, xMark, { opacity: 0 })), chk = [0, 1, 2, 3, 4].map(() => mk(u, cupMk, { opacity: 0 })), ch2 = tagG(u, 'CHEERS!', 70, OR);
  const t1 = tagG(u, 'MÖNGKE WANTS TO KNOW WHOSE RELIGION MAKES THE MOST SENSE', 40, { fill: '#111' }), t2 = tagG(u, 'RUBRUCK TAKES PART', 56, { fill: '#5d4037' }), nb = bigG(u, 'NOBODY CONVINCED', 120), t3 = tagG(u, 'AT THE END, EVERYONE DRINKS A LOT', 54, { fill: '#7b1d1d' });
  const sched = [[0, .8, 2.0], [1, 2.4, 3.6], [2, 4.0, 5.2], [0, 5.6, 6.5], [1, 6.7, 7.5], [2, 7.7, 8.6], [3, t29 + .55, t29 + 1.25]], hasCup = [false, false, false, false, false];
  return lt => {
    const act = sched.find(s => lt >= s[1] && lt < s[2]), cheer = lt > t31 + .1, no = lt > t30 && lt < t31;
    D.forEach((p, i) => { const talk = act && act[0] === i, sw = Math.sin(lt * 9 + i); let ra = talk ? -95 + 28 * sw : 10, la = talk ? 30 : -10; if (no) { ra = -60; la = 60; } if (cheer) { ra = -150 + 20 * sw; la = 150 - 20 * sw; } p.arm('R', ra); p.arm('L', la); stand(p, X[i + 1], 960, 1.3, 1, cheer ? 'r' : no ? 'a' : talk ? 'o' : 'n', talk ? Math.abs(sw) * 6 : bob(lt, i)); p.arm('R', ra); p.arm('L', la); setT(pod[i], X[i + 1], 960, 0, 1); });
    const rx = lerp(X[0], X[0] + 160, easeOut(lin(lt, t29, t29 + .8))); const rw = Math.sin(lt * 9); let rr = cheer ? -150 + 20 * rw : -60 + (lt > t29 ? 12 * rw : 0); rb.hold('R', cheer ? cupMk : quillMk); rb.hold('L', cheer ? '' : noteMk); rb.arm('R', rr); rb.arm('L', cheer ? 150 - 20 * rw : 40); stand(rb, rx, 975, 1.3, 1, cheer ? 'r' : no ? 'd' : 'h', bob(lt, 3)); rb.arm('R', rr); rb.arm('L', cheer ? 150 - 20 * rw : 40);
    mg.arm('R', cheer ? -150 + 15 * rw : 10); mg.arm('L', cheer ? 150 - 15 * rw : -10); stand(mg, 1660, 880, 1.2, -1, cheer ? 'h' : lt < t30 ? 'd' : 'k', bob(lt, 5)); mg.arm('R', cheer ? -150 + 15 * rw : 10); mg.arm('L', cheer ? 150 - 15 * rw : -10);
    [D[0], D[1], D[2]].forEach((p, i) => { const want = cheer; if (want !== hasCup[i]) { p.hold('R', want ? cupMk : ''); hasCup[i] = want; } });
    bub.forEach((b2, i) => { const on = act && act[0] === i && !(i === 3 && !(lt >= t29 + .55 && lt < t29 + 1.25)); const a = act ? act[1] : 0; const bx = i === 3 ? rx + 60 : X[i + 1] + 60; b2.setAttribute('opacity', on ? 1 : 0); setT(b2, bx, 520 + (i === 3 ? 20 : 0), 0, on ? pop(lt, a, .25) : 0); });
    xs.forEach((x, i) => { show(x, lt, t30 + .4 + i * .25, X[i + 1] + 90, 480, 0, t31 - .1, 1.1); });
    show(t1, lt, .1, 960, 160, -1, 8.9); show(t2, lt, t29 + .1, 960, 170, 1, t30 - .1, 1, true); show(nb, lt, t30 + .1, 960, 300, -2, t31 - .1, 1, true); show(t3, lt, t31 + .3, 960, 170, 1);
    show(ch2, lt, t31 + 1.0, 960, 360, -3, 1e9, 1, true);
    chk.forEach((c, i) => { const a = t31 + .6 + i * .1; setT(c, 300 + i * 340, 640 + 12 * Math.sin(lt * 6 + i) - (lt > a ? 0 : 20), (i - 2) * 5, 1.2 * pop(lt, a, .3)); c.setAttribute('opacity', 0); });
  };
});
// ===== 32-33: Tengri, the eternal blue sky =====
S(32, 33, (g, u, L) => {
  const t33 = L(33);
  const sc = scenery(g, { sky: 'day', sun: [960, 140], clouds: 6, wind: 1, h: 720 });
  mk(g, '<circle cx="960" cy="140" r="520" fill="#fff" opacity=".12"/><circle cx="960" cy="140" r="340" fill="#fff" opacity=".12"/>');
  const pr = [C.mon, C.chr, C.mus, C.bud, C.mon2].map(c => P(g, c)), X = [330, 650, 960, 1270, 1590], ger = [gerG(g), gerG(g)];
  const note = [0, 1, 2, 3, 4].map(() => mk(u, '<rect x="-96" y="-30" width="192" height="60" rx="8" fill="#f5ecd0" stroke="#1a1a1a" stroke-width="5"/><text class="t" y="12" text-anchor="middle" font-size="34" fill="#7d1f1f">FOR THE KHAN</text>', { opacity: 0 }));
  const tT = bigG(u, 'TENGRI', 190), tE = tagG(u, 'THE ETERNAL BLUE SKY', 64, { fill: '#1b4f8a' }), tP = tagG(u, 'PRAY ANY WAY YOU LIKE', 58, { fill: '#111' }), tK = tagG(u, 'BUT PRAY FOR THE KHAN', 64, OR);
  return lt => {
    sc(lt); ger[0].set(180, 900, .7, 1); ger[1].set(1760, 900, .7, 1);
    const k = lt >= t33 + .1;
    const pose = [[-170, 170, 'h', 0], [-30, 30, 'n', 0], [-70, 70, 'n', 14], [-28, 28, 'n', 8], [-170, 170, 'h', 0]];
    pr.forEach((p, i) => { const q = pose[i], wob = Math.sin(lt * 2 + i) * 6; const ra = lt < t33 ? (i === 0 || i === 4 ? -165 + 8 * Math.sin(lt * 2 + i) : 8) : q[0] + wob, la = lt < t33 ? (i === 0 || i === 4 ? 165 - 8 * Math.sin(lt * 2 + i) : -8) : q[1] - wob; p.arm('R', ra); p.arm('L', la); p.g.setAttribute('opacity', (i === 0 || i === 4 || k) ? 1 : 0); stand(p, X[i], 985, 1.3, 1, lt < t33 ? 'n' : q[2], bob(lt, i)); p.place(X[i], 985, 1.3, 1, k ? q[3] : 0, bob(lt, i)); p.arm('R', ra); p.arm('L', la); if (k && (i === 2 || i === 3)) p.tilt(q[3] * 2); });
    note.forEach((n, i) => { const a = t33 + .8 + i * .35; setT(n, X[i], 590 - 40 * lin(lt, a, a + 1.5) + 4 * Math.sin(lt * 3 + i), 0, pop(lt, a, .3)); n.setAttribute('opacity', lt > a ? 1 - .5 * lin(lt, a + 1.5, a + 3.5) : 0); });
    show(tT, lt, .3, 960, 330, -2, t33 - .1, 1, true); show(tE, lt, 1.2, 960, 470, 1, t33 - .1); show(tP, lt, t33 + .2, 960, 170, -1, t33 + 2.9); show(tK, lt, t33 + 3.0, 960, 170, 1, 1e9, 1, true);
  };
});
// ===== 34: teaser =====
S(34, 34, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts; m.mon(RED); m.zone('song', .45); m.zone('jin', .4); empRed(m);
  const ar = arrowG(u), po = portrait(u, C.mong, 0, 0, 170, '#1a1a1a'), cr = mk(u, '<path d="M-70 0 L-80 -90 L-36 -48 L0 -108 L36 -48 L80 -90 L70 0 Z" fill="#f1c40f" stroke="#1a1a1a" stroke-width="7" stroke-linejoin="round"/><circle cx="0" cy="-60" r="9" fill="#e2362b"/>', { opacity: 0 });
  const q = mk(u, '<text class="t big" font-size="190" style="stroke-width:20">?</text>', { opacity: 0 }), tC = mi(m, P0.zhongdu, '<text class="t big" y="-60" font-size="56" style="stroke-width:12">CHINA</text>'), tG = tagG(u, "ONE OF GENGHIS'S GRANDSONS", 52, { fill: '#7d1f1f' }), tE = tagG(u, 'TO BE CONTINUED', 56, OR);
  return lt => {
    const e = easeIO(lin(lt, 0, 4.6)); m.cam(lerp(1322, 1470, e), lerp(398, 510, e), lerp(3.0, 3.0 + .6 * e, 1)); marrow(m, ar, [P0.karakorum, [1380, 440], P0.zhongdu], easeIO(lin(lt, .4, 3.8)), '#fff');
    setT(tC, 0, 0, 0, pop(lt, 2.4, .4)); const k = pop(lt, 3.2, .45);
    setT(po.g, 1520, 720 + bobY(lt, 0, 5), 0, k); po.g.style.filter = 'brightness(0)'; po.g.setAttribute('opacity', .92); setT(cr, 1520, 590 + bobY(lt, 0, 5), 0, 1.15 * pop(lt, 3.9, .4)); cr.setAttribute('opacity', lt > 3.9 ? 1 : 0);
    q.setAttribute('opacity', lt > 4.6 ? 1 : 0); setT(q, 1760, 470 + 8 * Math.sin(lt * 4), 8, pop(lt, 4.6, .4));
    show(tG, lt, 3.4, 1380, 960, -1);
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
