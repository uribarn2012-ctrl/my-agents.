// ===== shared helpers for ch4 =====
function cdot(m, pt, name, ly = -34, sc = 1) { const gg = m.add(pt, `<circle class="dt" r="13" fill="#ffd84a" stroke="#1a1a1a" stroke-width="4"/>${name ? `<text class="t big" y="${ly}" font-size="30" style="stroke-width:8">${name}</text>` : ''}`, { sc }); const d = gg.querySelector('.dt'); return { g: gg, set: (c, k = 1) => { d.setAttribute('fill', c); d.setAttribute('r', 13 * k); } }; }
const speech = (u, text, size = 52, w = 320) => mk(u, `<ellipse rx="${w}" ry="${size * 1.25}" fill="#fff" stroke="#1a1a1a" stroke-width="6"/><text class="t" y="${size * .36}" text-anchor="middle" font-size="${size}" fill="#1a1a1a">${text}</text>`, { opacity: 0 });
const angryCloud = '<g stroke="#1a1a1a" stroke-width="5"><circle cx="-26" cy="0" r="30" fill="#7b1d1d"/><circle cx="14" cy="-18" r="36" fill="#a52424"/><circle cx="44" cy="8" r="28" fill="#7b1d1d"/></g><path d="M-18 -4 L-2 4 M22 -8 L8 2" stroke="#fff" stroke-width="5" stroke-linecap="round"/>';
const sweatDrop = '<path d="M0 -40 Q26 0 0 22 Q-26 0 0 -40 Z" fill="#7ec8ff" stroke="#1a1a1a" stroke-width="5"/>';
const anvilMk = '<g stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"><path d="M-34 -14 H34 L24 0 H12 V14 H28 V26 H-28 V14 H-12 V0 H-24 Z" fill="#6b7480"/><rect x="-6" y="-62" width="12" height="46" rx="3" fill="#8a5a2b" transform="rotate(25 0 -16)"/><rect x="-20" y="-72" width="40" height="18" rx="4" fill="#8f98a3" transform="rotate(25 0 -16)"/></g>';
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
const gridS = (c, n, cols = 3) => { let s = ''; for (let i = 0; i < n; i++) s += `<g transform="translate(${(i % cols) * 26} ${Math.floor(i / cols) * 26})">${soldier(c)}</g>`; return s; };
const xMark = '<path d="M-40 -40 L40 40 M40 -40 L-40 40" stroke="#1a1a1a" stroke-width="22" stroke-linecap="round"/><path d="M-40 -40 L40 40 M40 -40 L-40 40" stroke="#fff" stroke-width="10" stroke-linecap="round"/>';
const bob = (lt, i = 0) => Math.abs(Math.sin(lt * 3 + i * 1.3)) * 4;

// ===== 0-2: 1220, two generals set off west =====
S(0, 2, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts;
  m.mon(RED); m.red('khw', 460); m.zone('khw', .7); m.zone('xia', .5); m.zone('jin', .5);
  const lk = m.label('KHWAREZM', P0.khw, 34, { dy: -30, op: 1 });
  const ra = arrowG(u), rb = arrowG(u);
  const tj = tagG(u, 'JEBE', 50, { fill: '#1abc9c' }), ts = tagG(u, 'SUBUTAI', 50, { fill: '#e67e22' }), tbs = tagG(u, 'SON OF A BLACKSMITH', 34, { fill: '#111' });
  const anv = mk(u, anvilMk, { opacity: 0 }), shah = mk(u, '<circle r="15" fill="#ffd84a" stroke="#1a1a1a" stroke-width="5"/><text class="t big" y="-28" font-size="30" style="stroke-width:8">SHAH</text>', { opacity: 0 });
  const pg = portrait(g, C.gen, 0, 0, 70, RED), pj = portrait(g, C.jebe, 0, 0, 70, '#1abc9c'), ps = portrait(g, C.sub, 0, 0, 70, '#e67e22'), tg = tagG(u, 'GENGHIS', 38, { fill: '#c0392b' });
  return lt => {
    m.cam(860 + 4 * Math.sin(lt * .3), 490, 3.4 + lt * .012); y(lt, .2, '1220');
    const t1 = L(1), t2 = L(2);
    // Shah runs west toward the Caspian
    const ks = easeIO(lin(lt, .4, 4.4)), sp = m.S([lerp(925, 790, ks), lerp(508, 535, ks)]); show(shah, lt, .4, sp[0], sp[1], 0);
    setT(pg.g, 150, 930, 0, pop(lt, .1)); pg.pp.face(lt < t1 ? 'd' : 'n'); show(tg, lt, .3, 150, 810, -2);
    setT(pj.g, 340, 930, 0, pop(lt, t1 + .1)); pj.pp.face('d'); setT(ps.g, 530, 930, 0, pop(lt, t2 + .1)); ps.pp.face('d');
    const ja = m.S([930, 497]), jb = m.S([800, 462]), sa = m.S([930, 507]), sb = m.S([790, 548]);
    const k1 = easeOut(lin(lt, t1 + .3, t1 + 1.6)), k2 = easeOut(lin(lt, t2 + .3, t2 + 1.8));
    arrowSet(ra, ja, jb, k1, 40, RED); arrowSet(rb, sa, sb, k2, -40, RED);
    show(tj, lt, t1 + .5, jb[0] - 10, jb[1] - 70, -2, 1e9, .9); show(ts, lt, t2 + .5, sb[0] + 270, sb[1] + 30, 2, 1e9, .9);
    show(tbs, lt, t2 + 2.0, 1000, 905, -1); setT(anv, 1390, 900, 0, pop(lt, t2 + 2.2)); anv.setAttribute('opacity', lt > t2 + 2.2 ? 1 : 0);
  };
});
// ===== 3-4: the Shah dies; so they just keep going =====
S(3, 4, (g, u, L) => {
  const sc = scenery(g, { sky: 'grey', hill: HGREY, clouds: 3, wind: 1 }), sp = speedG(g, 900, 1040);
  el('ellipse', { cx: 480, cy: 940, rx: 400, ry: 110, fill: '#2f63c9', stroke: '#1a1a1a', 'stroke-width': 6 }, g); el('ellipse', { cx: 480, cy: 915, rx: 160, ry: 34, fill: '#c8a96a', stroke: '#1a1a1a', 'stroke-width': 6 }, g);
  const shah = P(g, C.shah), hJ = H(g, { coat: '#6b4a2a', blanket: '#1abc9c', rider: C.jebe }), hS = H(g, { coat: '#2b2b2b', blanket: '#e67e22', rider: C.sub });
  const t1 = tagG(u, 'THE SHAH DIES ON AN ISLAND', 46, { fill: '#111' }), t2 = tagG(u, 'SO THEY KEEP GOING', 76, OR);
  return lt => {
    sc(lt); const t4 = L(4), dead = lt > 1.5; sp(lt, 0);
    shah.place(480, 918, 1.0, 1, dead ? lerp(0, 84, easeOut(lin(lt, 1.5, 2.0))) : 0, 0); shah.walk(0, 9, 0, false); shah.face(dead ? 'x' : lt > .5 ? 'c' : 's'); shah.mark('s', lt, .3, 1.4);
    const arrive = easeOut(lin(lt, 0, 2.0)), go = lin(lt, t4 + .2, t4 + 1.8);
    const hx = go > 0 ? 1050 - go * go * 1500 : lerp(2300, 1050, arrive), mv = lt < 2.0 || go > 0;
    ride(hJ, lt, hx + 150, 770, .9, -1, mv, 24); ride(hS, lt + .3, hx, 780, .95, -1, mv, 24);
    if (lt > 2.0 && go <= 0) { hJ.rider.face('f'); hS.rider.face('s'); hS.rider.mark('?', lt, 2.0, 3.0); } else if (go > 0) { hJ.rider.face('d'); hS.rider.face('d'); }
    show(t1, lt, .4, 1250, 330, -1, t4 - .1); show(t2, lt, t4 + .05, 960, 300, -2, 1e9, 1, true);
  };
});
// ===== 5-6: the lasso around the Caspian =====
S(5, 6, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts, LP = G3.loop;
  m.mon(RED); m.red('khw', 460); m.zone('khw', .5);
  m.label('CASPIAN SEA', P0.mid, 30, { dy: 0 }); m.label('PERSIA', [790, 520], 34, { dy: 40 }); m.label('GEORGIA', P0.tbilisi, 28, { dy: 40 }); m.label('SOUTHERN RUSSIA / UKRAINE', [660, 405], 28, { dy: -48 });
  const mts = m.add(P0.caucasus, '<g stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"><path d="M-44 14 L-20 -26 L0 4 L22 -34 L52 14 Z" fill="#9c8358"/><path d="M-26 -12 L-20 -26 L-12 -12 Z M14 -14 L22 -34 L30 -14 Z" fill="#fff"/></g>', { op: 0, sc: 1 });
  const road = arrowG(u), tR = tagG(u, 'ABOUT 20,000 RIDERS', 46, OR), tG = tagG(u, 'GEORGIA: ARMY CRUSHED', 40, { fill: '#111' }), tC = tagG(u, 'CAUCASUS MOUNTAINS', 40, { fill: '#6b3e1b' }), tU = tagG(u, 'THE OPEN PLAINS', 44, { fill: '#2e7d32' });
  const blue = mk(u, `<rect x="-24" y="-60" width="130" height="100" rx="10" fill="#1f3a6e" opacity=".9" stroke="#fff" stroke-width="4"/><g transform="translate(-2 -26) scale(1.3)">${gridS('#2e86c1', 9)}</g>`, { opacity: 0 }), xm = mk(u, xMark, { opacity: 0 });
  const hJ = H(u, { coat: '#6b4a2a', blanket: '#1abc9c', rider: C.jebe }), hS = H(u, { coat: '#2b2b2b', blanket: '#e67e22', rider: C.sub });
  const mt = tagG(u, '', 1, {}); mt.setAttribute('display', 'none');
  return lt => {
    const t6 = L(6); m.cam(lerp(800, 760, lin(lt, 0, 14)), 450, 3.2 + lt * .01); y(lt, .1, '1220');
    const k = easeIO(lin(lt, .4, t6 + 5.2)), pts = partial(LP.map(p => m.S(p)), k); polyArrow(road, pts, RED);
    const e = pts[pts.length - 1], q = pts[Math.max(0, pts.length - 2)], dir = e[0] >= q[0] ? 1 : -1;
    ride(hJ, lt, e[0] + 10, e[1] + 40, .36, dir, true, 22); ride(hS, lt + .3, e[0] + 40, e[1] + 52, .36, dir, true, 22); vis(hJ.g, lt > .5); vis(hS.g, lt > .5);
    show(tR, lt, .5, 960, 940, -1, t6 - .3);
    const bp = m.S(P0.tbilisi), kg = lin(lt, 2.6, 4.2); blue.setAttribute('opacity', lt > 2.2 ? (lt > 4.6 ? 1 - lin(lt, 4.6, 5.4) * .7 : 1) : 0); setT(blue, bp[0] + 40, bp[1] - 90, 0, pop(lt, 2.2) * .8);
    xm.setAttribute('opacity', lt > 4.4 ? 1 : 0); setT(xm, bp[0] + 70, bp[1] - 60, 0, pop(lt, 4.4) * 1.0); show(tG, lt, 4.2, bp[0] + 110, bp[1] + 130, -2, t6 - .2);
    const mp = m.S(P0.caucasus); mts.setAttribute('opacity', lt > t6 - .2 ? 1 : 0); show(tC, lt, t6 + .2, mp[0] + 330, mp[1] + 10, -2, t6 + 3.3); show(tU, lt, t6 + 3.8, 960, 900, 1, 1e9);
  };
});
// ===== 7-10: Cumans, Rus princes, ambassadors =====
S(7, 10, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [1500, 150], clouds: 4, wind: 1 }), ger = gerG(g); ger.set(1460, 800, .9, 1);
  const hJ = H(g, { coat: '#6b4a2a', blanket: '#1abc9c', rider: C.jebe }), hS = H(g, { coat: '#2b2b2b', blanket: '#e67e22', rider: C.sub });
  const cu = [P(g, C.cum), P(g, C.cum2), P(g, C.cum)], pr = [P(g, C.rus1), P(g, C.rus2), P(g, C.rus3)], amb = [P(g, C.mon), P(g, C.mon2)], pf = poof(g);
  const tC = tagG(u, 'CUMANS: NOMADS TOO', 46, { fill: '#a04000' }), tR = tagG(u, 'PRINCES OF THE RUS', 46, { fill: '#922b21' }), tA = tagG(u, 'MONGOL AMBASSADORS', 40, { fill: '#111' }), sB = speech(u, 'WE HAVE NO QUARREL WITH YOU', 36, 420), cl = [0, 1, 2].map(() => mk(g, angryCloud, { opacity: 0 }));
  const q = mk(u, '<text class="t big" font-size="110" style="stroke-width:14">!</text>', { opacity: 0 });
  return lt => {
    sc(lt); const t8 = L(8), t9 = L(9), t10 = L(10);
    // Mongol riders arrive from the left and halt
    const ka = easeOut(lin(lt, 0, 2.6)), mx = lerp(-300, 520, ka), mv = lt < 2.6;
    ride(hJ, lt, mx + 130, 800, .85, 1, mv, 22); ride(hS, lt + .3, mx, 810, .9, 1, mv, 22); hJ.rider.face(mv ? 'd' : 'h'); hS.rider.face(mv ? 'd' : 'h');
    // Cumans by their yurt, then run to the Rus
    const rk = easeIO(lin(lt, t8 + .2, t8 + 2.6)), run = lt > t8 + .2 && rk < 1;
    cu.forEach((c, i) => { const x = lerp(1180 + i * 130, 1470 + i * 110, rk) + (lt > t8 + 2.6 ? 0 : 0), yy = 930 + i * 12 - (i === 1 ? 20 : 0); if (run) walkP(c, lt * 1.6 + i, x, yy, 1.05, 1, 'f'); else stand(c, x, yy, 1.05, 1, lt < t8 ? 'n' : 'f', bob(lt, i)); });
    vis(cu[0].g, lt > .6); vis(cu[1].g, lt > .6); vis(cu[2].g, lt > .6);
    cu[0].mark('s', lt, t8 + 1, t8 + 3.2);
    show(tC, lt, 1.4, 1260, 640, -1, t8 - .1);
    // Rus princes walk in from the right at line 8
    const pk = easeOut(lin(lt, t8 + .6, t8 + 3.0));
    pr.forEach((p, i) => { const x = lerp(2250 + i * 140, 1760 - i * 40 + (i === 1 ? 60 : 0), pk), yy = 960 - i * 14; if (pk < 1) walkP(p, lt * 1.1 + i, x, yy, 1.22, -1, 'n'); else stand(p, x, yy, 1.22, -1, lt < t10 ? 'n' : 'a', bob(lt, i + 3)); });
    show(tR, lt, t8 + 1.4, 1560, 560, 1, t9 - .1);
    // line 9: ambassadors walk to the princes and deliver the message
    const ak = easeIO(lin(lt, t9 + .1, t9 + 2.8)); amb.forEach((a, i) => { const x = lerp(760 + i * 90, 1250 + i * 100, ak), yy = 950 + i * 8; if (lt < t10 + 1.0) { if (ak < 1) walkP(a, lt * 1.2 + i, x, yy, 1.1, 1, 'n'); else stand(a, x, yy, 1.1, 1, 'n', bob(lt, i + 5)); } });
    vis(amb[0].g, lt > t9 && lt < t10 + 1.0); vis(amb[1].g, lt > t9 && lt < t10 + 1.0);
    show(tA, lt, t9 + .2, 960, 590, 0, t9 + 2.4); show(sB, lt, t9 + 2.0, 930, 440, 0, t10 - .1);
    // line 10: princes get angry, crowd in, a puff of dust, ambassadors gone
    if (lt > t10) pr.forEach((p, i) => { p.face('a'); p.mark(i === 1 ? '!' : 'a', lt, t10 + .1, t10 + 1.6); });
    pf.setAttribute('opacity', lt > t10 + .6 ? 1 - lin(lt, t10 + 1.0, t10 + 1.7) * .0 : 0); setT(pf, 1500, 860, 0, lt > t10 + .6 ? pop(lt, t10 + .6, .3) * 1.5 : 0);
    if (lt > t10 + 1.5) pf.setAttribute('opacity', 1 - lin(lt, t10 + 1.5, t10 + 2.2));
    show(q, lt, t10 + .3, 1300, 420, 0, 1e9);
  };
});
// ===== 11: Tick: haven't we seen this episode before? =====
S(11, 11, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#0f1a2b' }, g);
  const tk = tickG(g), a = portrait(g, C.gov, 0, 0, 120, '#1e8449'), b = portrait(g, C.rus1, 0, 0, 120, '#922b21'), cA = mk(g, angryCloud, { opacity: 0 }), cB = mk(g, angryCloud, { opacity: 0 });
  const tA = tagG(u, 'OTRAR, 1218', 52, { fill: '#1e8449' }), tB = tagG(u, 'KALKA, 1223', 52, { fill: '#922b21' }), eq = ptxt(u, '=', 150, '#ffd84a', { sw: 14 }), sp = speech(u, "HAVEN'T WE SEEN THIS BEFORE?", 40, 440);
  return lt => {
    setT(a.g, 480, 400, 0, pop(lt, .1)); a.pp.face('a'); setT(b.g, 1440, 400, 0, pop(lt, .45)); b.pp.face('a');
    setT(cA, 590, 280, 0, 1.2 * pop(lt, .3) * (1 + .05 * Math.sin(lt * 9))); cA.setAttribute('opacity', lt > .3 ? 1 : 0); setT(cB, 1550, 280, 0, 1.2 * pop(lt, .6) * (1 + .05 * Math.sin(lt * 9 + 1))); cB.setAttribute('opacity', lt > .6 ? 1 : 0);
    show(tA, lt, .3, 480, 600, -2); show(tB, lt, .6, 1440, 600, 2); show(eq, lt, .9, 960, 450, 0, 1e9, 1, true);
    tickAt(tk, 960, 1100, .5, pop(lt, .05)); show(sp, lt, 1.0, 960, 760, 0);
  };
});
