// ===== shared helpers for ch5 =====
const speech = (u, text, size = 52, w = 320) => mk(u, `<ellipse rx="${w}" ry="${size * 1.25}" fill="#fff" stroke="#1a1a1a" stroke-width="6"/><text class="t" y="${size * .36}" text-anchor="middle" font-size="${size}" fill="#1a1a1a">${text}</text>`, { opacity: 0 });
const sweatDrop = '<path d="M0 -40 Q26 0 0 22 Q-26 0 0 -40 Z" fill="#7ec8ff" stroke="#1a1a1a" stroke-width="5"/>';
const cupMk = '<g stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"><path d="M-20 -26 L20 -26 L13 8 Q0 18 -13 8 Z" fill="#f1c40f"/><rect x="-4" y="8" width="8" height="16" fill="#d4ac0d"/><rect x="-16" y="24" width="32" height="8" rx="3" fill="#d4ac0d"/></g>';
function partial(pts, k) {
  const Ls = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); Ls.push(d); tot += d; }
  let want = tot * clamp(k); const out = [pts[0]];
  for (let i = 0; i < Ls.length; i++) { if (want >= Ls[i]) { out.push(pts[i + 1]); want -= Ls[i]; } else { const f = want / Ls[i]; out.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]); break; } }
  return out;
}
function polyArrow(g, pts, col = RED) {
  g.setAttribute('opacity', pts.length > 1 ? 1 : 0); if (pts.length < 2) return;
  const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'), e = pts[pts.length - 1], q = pts[pts.length - 2], a = Math.atan2(e[1] - q[1], e[0] - q[0]);
  g.querySelector('.sh').setAttribute('d', d); g.querySelector('.ln').setAttribute('d', d); g.querySelector('.ln').setAttribute('stroke', col); g.querySelector('.hd').setAttribute('fill', col);
  const hp = [[30, 0], [-12, -22], [-12, 22]].map(([x, y]) => [e[0] + x * Math.cos(a) - y * Math.sin(a), e[1] + x * Math.sin(a) + y * Math.cos(a)]);
  g.querySelector('.hd').setAttribute('d', 'M' + hp.map(p => p.join(' ')).join('L') + 'Z');
}
const xMark = '<path d="M-40 -40 L40 40 M40 -40 L-40 40" stroke="#1a1a1a" stroke-width="22" stroke-linecap="round"/><path d="M-40 -40 L40 40 M40 -40 L-40 40" stroke="#e2362b" stroke-width="10" stroke-linecap="round"/>';
const bob = (lt, i = 0) => Math.abs(Math.sin(lt * 3 + i * 1.3)) * 4;
const bobY = (lt, i = 0, a = 5) => Math.sin(lt * 2.3 + i) * a;
let RZN = 0;
// red zone (map path) revealed by a growing circle
function rz(m, d, cx, cy) { const id = 'rz5' + (++RZN); mk(m.w, `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="0"/></clipPath>`); const c = m.w.querySelector(`#${id} circle`); const p = el('path', { d, fill: RED, opacity: .88, stroke: '#1a1a1a', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke', 'clip-path': `url(#${id})` }, m.w); return (r, op = .88) => { c.setAttribute('r', Math.max(0, r)); p.setAttribute('opacity', op); }; }
function empRed(m) { return el('path', { d: G3.emp, fill: RED, opacity: .88, stroke: '#1a1a1a', 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke' }, m.w); }
function marrow(m, a, pts, k, col = RED) { polyArrow(a, partial(pts.map(p => m.S(p)), k), col); }
function boomG(u, txt) { let d = ''; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? 46 : 80; d += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1); } return mk(u, `<path d="${d}Z" fill="#ffd84a" stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"/><path d="${d}Z" fill="#ff7a1a" transform="scale(.6)"/><text class="t big" y="${txt ? 116 : 0}" font-size="44" style="stroke-width:10">${txt}</text>`, { opacity: 0 }); }

// ===== 0-1: 1229, Ogedei becomes khan =====
S(0, 1, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  m.label('THE MONGOL EMPIRE', [1100, 440], 46, { op: 1 });
  const tOg = tagG(u, 'ÖGEDEI KHAN, SON OF GENGHIS', 50, { fill: '#4a4fb5' }), tF = tagG(u, 'EMPIRES FALL APART', 58, { fill: '#111' }), tS = tagG(u, 'THIS ONE SPEEDS UP', 66, OR), t3 = tagG(u, '3RD SON', 44, { fill: '#c0392b' });
  const pg = portrait(g, C.gen, 0, 0, 105, GREY), po = portrait(g, C.oge, 0, 0, 135, '#4a4fb5'), cup = mk(g, cupMk, { opacity: 0 });
  const ars = [0, 1, 2].map(() => arrowG(u));
  return lt => {
    const t1 = L(1); m.cam(1060 + 8 * Math.sin(lt * .25), 450, 1.5 + lt * .008); y(lt, .15, '1229');
    show(tOg, lt, .5, 900, 120, -1);
    setT(pg.g, 250, 840 + bobY(lt, 0, 4), 0, pop(lt, .3)); pg.pp.face(lt < t1 ? 'h' : 'n');
    show(tF, lt, 1.2, 640, 300, -3 + 2 * Math.sin(lt * 14) * (lt < 2.6 ? 1 : 0), t1 - .1, 1);
    show(tS, lt, L(0) + 2.7, 1050, 300, 2, t1 - .1, 1, true);
    for (let i = 0; i < 3; i++) marrow(m, ars[i], [[1322, 398], [1100 - 120 * i, 410 + 15 * i], [900 - 170 * i, 380 + 60 * i]], easeIO(lin(lt, L(0) + 2.9 + i * .15, L(0) + 4.2)) * (lt < t1 - .1 ? 1 : 0));
    setT(po.g, 960, 760 + bobY(lt, 1, 6), 0, pop(lt, t1 + .2)); po.pp.face(lt > t1 + 1.5 ? 'k' : 'h');
    setT(cup, 1130, 840 + bobY(lt, 2, 5), 8, 1.5 * pop(lt, t1 + .6)); cup.setAttribute('opacity', lt > t1 + .6 ? 1 : 0);
    show(t3, lt, t1 + .5, 960, 940, -2);
  };
});
// ===== 2: Karakorum =====
S(2, 2, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1500, 170], clouds: 3, wind: 1 });
  const city = cityG(g, { wall: '#e0c48a', tw: '#c9a05a', roof: '#7d3c98' }), gers = [gerG(g), gerG(g), gerG(g)], cart = cartG(g), og = P(g, C.oge), wk = [P(g, C.mon), P(g, C.mon2)];
  og.hold('R', cupMk);
  const tK = tagG(u, 'KARAKORUM', 76, OR), tS = tagG(u, 'THE MIDDLE OF THE STEPPE', 44, { fill: '#111' });
  return lt => {
    sc(lt); const k = pop(lt, .9, .9);
    city.set(980, 820, .78 * k); city.flag('#7d3c98', clamp(k));
    gers[0].set(250, 900, .8, 1); gers[1].set(1640, 880, .75, 1); gers[2].set(120, 800, .6, 1);
    const cx = lerp(-100, 2000, lin(lt, 0, 6)); cart.set(cx, 985, .7, cx * .5);
    wk.forEach((p, i) => walkP(p, lt * 1.2 + i, cx + 170 + i * 110, 990, .9, 1, 'h'));
    stand(og, 1500, 995, 1.1, -1, lt > 1 ? 'k' : 'n', bob(lt)); og.arm('R', -75 + 8 * Math.sin(lt * 2.4));
    show(tK, lt, .5, 980, 300, -2, 1e9, 1, true); show(tS, lt, 2.4, 960, 160, 1);
  };
});
// ===== 3: armies in every direction =====
S(3, 3, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const rk = rz(m, G3.kor, P0.korea[0] - 10, P0.korea[1]), ars = [0, 1, 2, 3].map(() => arrowG(u));
  const tg = ['KOREA', 'NORTHERN CHINA', 'PERSIA', 'RUSSIA'].map(t => tagG(u, t, 40, { fill: '#7b1d1d' }));
  const R = [[P0.karakorum, [1450, 450], P0.korea], [P0.karakorum, [1420, 440], [1500, 500]], [P0.karakorum, [1100, 470], P0.khw], [P0.karakorum, [1000, 370], [760, 345], P0.rus]];
  return lt => {
    m.cam(1060, 450, 1.5 + lt * .01); y(lt, .1, '1230s');
    R.forEach((pts, i) => { const k = easeIO(lin(lt, .15 + i * .3, 1.9 + i * .3)); marrow(m, ars[i], pts, k); const e = m.S(pts[pts.length - 1]); show(tg[i], lt, 1.0 + i * .3, e[0], e[1] + (i == 1 ? 60 : -70), 0); });
    rk(110 * easeOut(lin(lt, .3, 2.0))); m.red('khw', 380 * lin(lt, .5, 3)); m.red('jin', 300 * lin(lt, .2, 2));
  };
});
// ===== 4: Batu and Subutai ride west =====
S(4, 4, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1500, 170], clouds: 3, wind: 1 }), sp = speedG(g, 800, 1040);
  const bg = [0, 1, 2, 3, 4, 5].map(i => H(g, { coat: '#7a5230', blanket: '#c0392b', rider: i % 2 ? C.mon : C.mon2 }));
  const hB = H(g, { coat: '#d8c9a8', blanket: '#1f7a8c', rider: C.batu }), hS = H(g, { coat: '#2b2b2b', blanket: '#e67e22', rider: C.subO });
  const tB = tagG(u, "BATU, GENGHIS'S GRANDSON", 46, { fill: '#1f7a8c' }), tS = tagG(u, 'SUBUTAI, THE OLD GENERAL', 46, { fill: '#e67e22' }), tD = tagG(u, "DECADES AT GENGHIS'S SIDE", 38, { fill: '#111' });
  return lt => {
    sc(lt); sp(lt); bg.forEach((h, i) => { const x = ((i * 380 + 2400 - lt * 90) % 2500) - 200; ride(h, lt + i * .4, x, 735 + (i % 3) * 22, .5, 1, true, 22); h.rider.face('d'); });
    const ent = easeOut(lin(lt, 0, 1.6));
    ride(hB, lt, lerp(-300, 640, ent) + 10 * Math.sin(lt), 940, 1.1, 1, true, 24); ride(hS, lt + .4, lerp(-500, 1180, ent) + 10 * Math.sin(lt + 1), 950, 1.15, 1, true, 24);
    hB.rider.face(lt > 2.6 ? 'k' : 'd'); hS.rider.face(lt > 5.4 ? 'h' : 'n');
    show(tB, lt, 2.4, 640, 480, -2, 1e9); show(tS, lt, 5.2, 1220, 500, 2, 1e9); show(tD, lt, 7.0, 960, 160, -1);
  };
});
// ===== 5: sweeping through the Rus =====
S(5, 5, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const rr = rz(m, G3.rusZ, 760, 380), ars = [0, 1, 2].map(() => arrowG(u)), tR = tagG(u, 'THE RUS', 60, { fill: '#922b21' });
  [P0.kiev, [600, 305], [570, 330]].forEach(p => m.add(p, '<circle r="9" fill="#ffd84a" stroke="#1a1a1a" stroke-width="3"/>'));
  const R = [[[880, 400], [790, 370], [700, 350], [610, 330]], [[880, 410], [780, 390], [690, 380], [600, 360]], [[880, 395], [800, 340], [720, 320], [640, 300]]];
  return lt => {
    const k = lin(lt, .4, 4.5); m.cam(lerp(780, 660, easeIO(lin(lt, 0, 5))), 355, 3.4 + lt * .02);
    y(lt, .1, String(1237 + Math.min(3, Math.floor(k * 4))));
    R.forEach((pts, i) => marrow(m, ars[i], pts, easeIO(lin(lt, .3 + i * .5, 3.4 + i * .5))));
    rr(260 * easeOut(lin(lt, .3, 4.6))); show(tR, lt, 1.4, 960, 880, -2);
  };
});
// ===== 6: Kyiv falls =====
S(6, 6, (g, u, L) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, clouds: 3, wind: 1 }), sp = speedG(g, 900, 1040);
  const city = cityG(g, { wall: '#d9c8a2', tw: '#c8b07a', roof: '#d4ac0d' }), hs = [0, 1, 2].map(i => H(g, { coat: '#6b4a2a', blanket: '#c0392b', rider: i % 2 ? C.mon : C.mon2 }));
  const coins = [0, 1, 2, 3, 4].map(() => mk(g, '<circle r="18" fill="#ffd84a" stroke="#1a1a1a" stroke-width="5"/><text class="t" y="9" text-anchor="middle" font-size="24" fill="#a67c00">$</text>'));
  const tK = tagG(u, 'KYIV, 1240', 74, { fill: '#2874a6' }), tR = tagG(u, 'ONE OF THE RICHEST CITIES', 40, { fill: '#111' }), tF = tagG(u, 'FALLS', 90, { fill: '#c0392b' });
  return lt => {
    sc(lt); sp(lt, lt < 3 ? 1 : .2); const fall = lin(lt, 3.0, 3.6);
    city.set(1100, 880, .95); city.flag(fall > 0 ? RED : '#2874a6', 1); city.gateOpen(fall);
    coins.forEach((c, i) => { setT(c, 760 + i * 130, 560 + 12 * Math.sin(lt * 3 + i), 0, (1 - fall) * (.7 + .1 * Math.sin(lt * 4 + i))); c.setAttribute('opacity', fall < 1 ? 1 : 0); });
    hs.forEach((h, i) => { const x = lerp(-300 - i * 260, 1000 + i * 40, easeOut(lin(lt, .3, 3.6))); ride(h, lt + i * .3, x, 975 + i * 12, .85, 1, lt < 3.6, 24); h.g.setAttribute('opacity', 1 - lin(x, 960, 1060)); h.rider.face('d'); });
    show(tK, lt, .3, 560, 250, -2); show(tR, lt, 1.6, 960, 160, 1); show(tF, lt, 3.4, 1100, 330, -3, 1e9, 1, true);
  };
});
// ===== 7-9: spring 1241, the split =====
S(7, 9, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const rr = rz(m, G3.rusZ, 700, 380), rh = rz(m, G3.horde, 700, 400), rp = rz(m, G3.pol, P0.poland[0] + 30, P0.poland[1]), rhu = rz(m, G3.hun, P0.hungary[0] + 30, P0.hungary[1]);
  rr(400); rh(400, .6);
  const aP = arrowG(u), aH = arrowG(u), t8 = L(8), t9 = L(9);
  const bL = boomG(u, 'APR 9'), bM = boomG(u, 'APR 11'), tL = tagG(u, 'LEGNICA', 44, { fill: '#2c3e50' }), tM = tagG(u, 'MOHI', 44, { fill: '#1e8449' }), tPo = tagG(u, 'POLAND', 44, { fill: '#7b1d1d' }), tHu = tagG(u, 'HUNGARY', 44, { fill: '#7b1d1d' });
  const k1 = portrait(g, C.kn1, 0, 0, 90, '#ecf0f1'), k2 = portrait(g, C.kn2, 0, 0, 90, '#34495e'), bl = portrait(g, C.bela, 0, 0, 100, '#1e8449');
  const xa = mk(u, xMark, { opacity: 0 });
  return lt => {
    m.cam(lerp(580, 520, easeIO(lin(lt, 0, 12))), 372, 2.7 + lt * .012); y(lt, .1, '1241');
    marrow(m, aP, [P0.kiev, [500, 335], P0.legnica], easeIO(lin(lt, .8, 3.4))); marrow(m, aH, [P0.kiev, [520, 380], P0.mohi], easeIO(lin(lt, 1.2, 3.8)));
    rp(90 * easeOut(lin(lt, 2.6, 4.2))); rhu(90 * easeOut(lin(lt, 3.0, 4.6)));
    const a = m.S(P0.legnica), b = m.S(P0.mohi), pa = m.S(P0.poland), pb = m.S(P0.hungary);
    show(tPo, lt, 1.8, pa[0] - 40, pa[1] - 150, -2, t8 - .1); show(tHu, lt, 2.2, pb[0] + 60, pb[1] + 140, 2, t8 - .1);
    show(bL, lt, t8 + .5, a[0] - 20, a[1] - 20, 0, 1e9, 1, true); show(tL, lt, t8 + .7, a[0] - 220, a[1] - 100, -2);
    setT(k1.g, 250, 880, 0, pop(lt, t8 + .6)); k1.pp.face('f'); setT(k2.g, 430, 880, 0, pop(lt, t8 + .8)); k2.pp.face('f');
    show(xa, lt, t8 + 1.4, 340, 880, 0, 1e9, 1.4);
    show(bM, lt, t9 + .5, b[0] + 30, b[1] + 20, 0, 1e9, 1, true); show(tM, lt, t9 + .7, b[0] + 230, b[1] + 130, 2);
    setT(bl.g, 1570, 880 + bobY(lt, 3, 4), 0, pop(lt, t9 + 1.0)); bl.pp.face('f'); bl.pp.mark('!', lt, t9 + 2.4, t9 + 4.4);
  };
});
