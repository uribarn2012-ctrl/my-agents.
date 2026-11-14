// ===== 6-9: they fade one by one =====
S(6, 9, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), pc = pieces(m), P0 = G3.pts; m.mon(RED);
  const l6 = L(6), l7 = L(7), l8 = L(8), l9 = L(9);
  const lab = { yuan: mlab(m, P0.yuanC, 'YUAN', 40, '#a31f17'), hord: mlab(m, P0.hordeC, 'GOLDEN HORDE', 36, '#1d4f8f'), ilk: mlab(m, P0.ilkC, 'ILKHANATE', 36, '#14602f'), chag: mlab(m, P0.chagC, 'CHAGATAI', 36, '#6c3483') };
  const ming = mlab(m, P0.ming, 'MING', 48, '#c0392b'), crim = el('path', { d: G3.crim, fill: RED, stroke: '#1a1a1a', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }, m.w), cl = mlab(m, [P0.crimea[0], P0.crimea[1] - 12], 'CRIMEAN KHANATE', 34, '#7d1f1f', { dy: -30 });
  const ra = arrowG(u), ra2 = arrowG(u), pf = [0, 1, 2, 3].map(() => poof(u)), tg = tagG(u, 'DESCENDANTS OF GENGHIS KHAN', 48, { fill: '#7d1f1f' }), gp = portrait(u, C.gen, 0, 0, 96, '#f1c40f'), tgm = tagG(u, 'THE MONGOLS ARE OUT', 54, { fill: '#c0392b' });
  const FT = { yuan: l7 + 4.0, ilk: l8 + .1, chag: l8 + .8, hord: l8 + 1.4 };
  return lt => {
    const z = easeIO(lin(lt, l9 + .4, l9 + 3.0)); m.cam(lerp(1120, P0.crimea[0], z), lerp(440, P0.crimea[1], z), lerp(1.35, 8, z)); const sp = 9 * (1 - z);
    for (const k in KHN) { const v = lt < FT[k] ? 0 : easeOut(lin(lt, FT[k], FT[k] + 1.2)); pc.fade(k, v, sp); setT(lab[k], 0, 0, 0, pop(lt, 0, .1) * (1 - lin(lt, FT[k], FT[k] + .5))); }
    ra.setAttribute('opacity', 0); ra2.setAttribute('opacity', 0);
    if (lt > l7 + .3 && lt < l7 + 4.8) { marrow(m, ra, [P0.ming, [1390, 560], P0.yuanC, [1380, 440]], easeIO(lin(lt, l7 + .5, l7 + 2.6)), '#2ecc71'); marrow(m, ra2, [[1420, 470], [1400, 430], P0.mongolia], easeIO(lin(lt, l7 + 1.8, l7 + 3.6)), RED); }
    setT(ming, 0, 0, 0, pop(lt, l7 + 4.6, .4)); show(tgm, lt, l7 + 1.6, 960, 930, -1, l7 + 5.2);
    pf.forEach((p, i) => { const t0 = [FT.yuan, FT.ilk, FT.chag, FT.hord][i], pt = [P0.yuanC, P0.ilkC, P0.chagC, P0.hordeC][i], q = m.S(pt); p.setAttribute('opacity', lt > t0 && lt < t0 + .6 && z < .2 ? 1 : 0); setT(p, q[0], q[1], 0, .7 * pop(lt, t0, .3)); });
    // crimea
    const cv = lt < l8 + 1.4 ? 1 : 1; crim.setAttribute('opacity', 1); crim.setAttribute('stroke', '#1a1a1a'); const cs = lt > l9 + 8.6 ? 1 - lin(lt, l9 + 8.6, l9 + 9.1) : 1; crim.setAttribute('opacity', cs.toFixed(2));
    setT(cl, 0, 0, 0, pop(lt, l9 + 2.6, .4) * cs); show(tg, lt, l9 + 4.4, 960, 160, -1); const q = m.S(P0.crimea); setT(gp.g, 300, 400 + 6 * Math.sin(lt * 2), 0, pop(lt, l9 + 4.8, .4));
    gp.g.setAttribute('opacity', lt > l9 + 4.8 ? 1 : 0);
    const yr = lt < l7 + 3.0 ? lerp(1290, 1368, easeIO(lin(lt, l6, l7 + 3.0))) : lt < l9 + 3.0 ? lerp(1368, 1500, easeIO(lin(lt, l7 + 5, l9 + 3.0))) : lerp(1500, 1783, easeIO(lin(lt, l9 + 3.2, l9 + 8.4)));
    y(lt, 0, String(Math.round(yr)));
  };
});

// ===== 10: side quest =====
sideCard(10, 10, ['QUICK', 'SIDE QUEST'], null);

// ===== 11: Babur marches from Kabul to India =====
S(11, 11, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', 0);
    const ind = rzc(m, G3.mugh, P0.delhi[0], P0.delhi[1], '#1f9d8a');
  const hz = H(u, { coat: '#6b4423', blanket: '#1f9d8a', rider: Object.assign({}, C.bab, { s: 1, holdL: bowH }) }), bg = [0, 1, 2, 3, 4, 5].map(() => mk(u, stick('#1f9d8a')));
  m.cam(1013, 622, 4.5); const route = [P0.kabul, P0.khyber, P0.panipat, P0.delhi, P0.agra], R = route.map(p => m.S(p));
  const kd = mlab(m, P0.kabul, 'KABUL', 34, '#111', { dy: 30 }), ca = mlab(m, P0.chagC, 'CENTRAL ASIA', 34, '#111'), ib = mlab(m, [P0.agra[0] + 6, P0.agra[1] + 28], 'NORTHERN INDIA', 34, '#0f6b5c'), pp = portrait(u, C.bab, 0, 0, 120, '#1f9d8a'), tb = tagG(u, 'BABUR', 56, { fill: '#0f6b5c' });
  const ar = arrowG(u);
  return lt => {
    m.cam(1013, 622, 4.5); const k = easeIO(lin(lt, 1.4, 6.4)), pos = partial(R, k), e = pos[pos.length - 1], b = pos.length > 1 ? Math.atan2(e[1] - pos[pos.length - 2][1], e[0] - pos[pos.length - 2][0]) : 0;
    polyArrow(ar, pos, '#fff'); ar.setAttribute('opacity', k > .02 ? .75 : 0);
    ride(hz, lt, e[0], e[1] + 14, .55, 1, k < 1 && k > 0, 22); hz.g.setAttribute('opacity', pop(lt, 1.0, .3) > .1 ? 1 : 0);
    bg.forEach((s, i) => { const p = partial(R, Math.max(0, k - .05 - i * .035)), q = p[p.length - 1]; setT(s, q[0] + (i % 2) * 6, q[1] + 6 + (i % 3) * 8, 0, 2.2 * pop(lt, 1.3, .3)); });
    ind(easeIO(lin(lt, 3.6, 7.4)) * 800, .8);
    setT(pp.g, 330, 300 + 6 * Math.sin(lt * 2), 0, pop(lt, .3, .4)); show(tb, lt, .5, 330, 470, -2);
    setT(kd, 0, 0, 0, pop(lt, .8, .3)); setT(ca, 0, 0, 0, pop(lt, .5, .3) * (1 - lin(lt, 2.0, 2.4))); setT(ib, 0, 0, 0, pop(lt, 5.4, .4));
    y(lt, 5.4, '1526');
  };
});

// ===== 12: family tree =====
S(12, 12, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#1b2b4d' }, g); mk(g, '<circle cx="960" cy="540" r="760" fill="#ff6a00" opacity=".12"/><circle cx="960" cy="540" r="480" fill="#ff6a00" opacity=".12"/>');
  const gp = portrait(u, C.gen, 0, 0, 190, '#f1c40f'), bp = portrait(u, C.bab, 0, 0, 190, '#1f9d8a'), dots = [0, 1, 2].map(() => mk(u, '<circle r="16" fill="#ffd84a" stroke="#1a1a1a" stroke-width="5"/>', { opacity: 0 }));
  const tg = tagG(u, 'GENGHIS KHAN', 50, { fill: '#a67c00' }), tb = tagG(u, 'BABUR', 50, { fill: '#0f6b5c' }), tm = tagG(u, "ON HIS MOTHER'S SIDE", 58, OR), ar = arrowG(u);
  return lt => {
    setT(gp.g, 420, 470 + bobY(lt, 0, 6), 0, pop(lt, .2, .4)); show(tg, lt, .5, 420, 730, -2);
    dots.forEach((d, i) => { const k = pop(lt, .8 + i * .3, .3); setT(d, 760 + i * 190, 480, 0, k); d.setAttribute('opacity', k > .02 ? 1 : 0); });
    arrowSet(ar, [640, 480], [1250, 480], easeIO(lin(lt, .8, 2.2)), 0, '#ffd84a'); show(tm, lt, 1.0, 960, 330, -1);
    setT(bp.g, 1500, 470 + bobY(lt, 1, 6), 0, pop(lt, 1.9, .4)); show(tb, lt, 2.1, 1500, 730, 2);
  };
});

// ===== 13: MUGHAL = MONGOL =====
S(13, 13, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#1f6f5c' }, g); mk(g, '<circle cx="960" cy="560" r="800" fill="#fff" opacity=".07"/><circle cx="960" cy="560" r="520" fill="#fff" opacity=".07"/>');
  const pp = portrait(u, C.bab, 0, 0, 120, '#f1c40f'), t1 = bigG(u, 'MUGHAL EMPIRE', 90), a = bigG(u, 'MUGHAL', 170), eq = bigG(u, '=', 170), b = bigG(u, 'MONGOL', 170), ps = ptxt(u, '(in Persian)', 62, '#ffd84a');
  return lt => {
    setT(pp.g, 330, 300 + bobY(lt, 0, 5), 0, pop(lt, .3, .4) * (1 - lin(lt, 2.7, 3.1))); show(t1, lt, .6, 1020, 320, -2, 2.9);
    show(a, lt, 3.0, 960, 480, -3, 1e9, 1, true); show(eq, lt, 4.0, 960, 650, 0, 1e9, 1, true); show(b, lt, 4.6, 960, 840, 3, 1e9, 1, true); show(ps, lt, 5.2, 1450, 860, -3);
  };
});

// ===== 14-15: Shah Jahan and the Taj Mahal =====
const TAJ = (() => {
  const st = 'stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"', W = '#f7f3ea', S2 = '#d8cfba', RS = '#b5533c';
  const dome = (cx, top, w, h, f = W) => `<path d="M${cx - w} ${top + h} C${cx - w * 1.45} ${top + h * .55} ${cx - w * .8} ${top + h * .2} ${cx} ${top} C${cx + w * .8} ${top + h * .2} ${cx + w * 1.45} ${top + h * .55} ${cx + w} ${top + h} Z" fill="${f}" ${st}/>`;
  const min = x => `<g><rect x="${x - 18}" y="-420" width="36" height="380" fill="${W}" ${st}/><rect x="${x - 24}" y="-300" width="48" height="12" fill="${S2}" ${st}/><rect x="${x - 24}" y="-190" width="48" height="12" fill="${S2}" ${st}/><rect x="${x - 28}" y="-430" width="56" height="16" fill="${S2}" ${st}/>${dome(x, -490, 22, 62)}<path d="M${x} -490 V-515" stroke="#1a1a1a" stroke-width="5"/></g>`;
  const side = x => `<g><rect x="${x - 120}" y="-170" width="240" height="132" fill="${RS}" ${st}/><rect x="${x - 120}" y="-180" width="240" height="14" fill="${S2}" ${st}/>${[-70, 0, 70].map(d => dome(x + d, -246, 28, 62)).join('')}${[-70, 0, 70].map(d => `<path d="M${x + d - 18} -38 V-100 Q${x + d} -134 ${x + d + 18} -100 V-38 Z" fill="#7a2c1c" ${st}/>`).join('')}</g>`;
  const body = `<g>${side(-590)}${side(590)}${min(-400)}${min(400)}<rect x="-420" y="-42" width="840" height="42" fill="${S2}" ${st}/><rect x="-250" y="-290" width="500" height="250" fill="${W}" ${st}/><rect x="-250" y="-300" width="500" height="14" fill="${S2}" ${st}/>${dome(-190, -340, 30, 64)}${dome(190, -340, 30, 64)}<rect x="-100" y="-310" width="200" height="40" fill="${W}" ${st}/>${dome(0, -590, 118, 270)}<path d="M0 -592 V-650" stroke="#1a1a1a" stroke-width="6"/><circle cx="0" cy="-640" r="9" fill="#f1c40f" stroke="#1a1a1a" stroke-width="3"/><path d="M-62 -40 V-196 Q0 -290 62 -196 V-40 Z" fill="#6b7099" ${st}/><path d="M-36 -40 V-176 Q0 -236 36 -176 V-40 Z" fill="#3e4470" stroke="#1a1a1a" stroke-width="4"/>${[-170, 170].map(x => `<path d="M${x - 30} -40 V-130 Q${x} -190 ${x + 30} -130 V-40 Z" fill="#6b7099" ${st}/><path d="M${x - 30} -150 V-230 Q${x} -274 ${x + 30} -230 V-150 Z" fill="#6b7099" ${st}/>`).join('')}</g>`;
  return body;
})();
S(14, 15, (g, u, L) => {
  el('rect', { x: -100, y: -100, width: 2120, height: 1300, fill: 'url(#sk_dusk)' }, g); const sun = el('circle', { cx: 1500, cy: 260, r: 90, fill: '#ffe9a8', opacity: .9 }, g);
  mk(g, '<path d="M-100 880 L2100 880 L2100 1200 L-100 1200 Z" fill="#7fc4e8"/><rect x="300" y="880" width="1320" height="150" fill="#6fb7d9" opacity="0"/>');
  const defs = mk(g, '<clipPath id="tajc"><rect id="tajr" x="-800" y="-900" width="1600" height="900"/></clipPath>'), tr0 = defs.querySelector('#tajr');
  const gl = mk(g, '<circle cx="960" cy="560" r="560" fill="url(#gHalo)"/>', { opacity: 0 });
  const pool = mk(g, `<g transform="translate(960 880) scale(1 -1)" opacity=".28">${TAJ}</g>`), tj = mk(g, `<g clip-path="url(#tajc)">${TAJ}</g>`);
  const ground = mk(g, '<path d="M-100 880 L2100 880" stroke="#1a1a1a" stroke-width="5"/><g fill="#2f6b3a" stroke="#1a1a1a" stroke-width="4">' + [250, 470, 1450, 1670].map(x => `<ellipse cx="${x}" cy="840" rx="20" ry="60"/>`).join('') + '</g>');
  const sj = portrait(u, C.shj, 0, 0, 150, '#f1c40f'), pearls = mk(u, [...Array(9)].map((_, i) => { const a = Math.PI * (.18 + i * .08); return `<circle cx="${(Math.cos(a) * 112).toFixed(1)}" cy="${(Math.sin(a) * 112 + 6).toFixed(1)}" r="9" fill="#fffdf7" stroke="#1a1a1a" stroke-width="3"/>`; }).join(''), { opacity: 0 });
  const tg = tagG(u, 'SHAH JAHAN', 52, { fill: '#a67c00' }), tt = tagG(u, 'TAJ MAHAL', 76, { fill: '#7d1f1f' }), sp = [0, 1, 2, 3, 4, 5].map(() => mk(u, sparkMk, { opacity: 0 })), l14 = L(14), l15 = L(15);
  return lt => {
    const k = easeIO(lin(lt, l14 + .5, l14 + 4.0)); tj.setAttribute('transform', `translate(960 ${(880 + 40 * (1 - k)).toFixed(1)})`); tr0.setAttribute('y', (-900 + 900 * (1 - k)).toFixed(1)); tr0.setAttribute('height', 900 * k + 2);
    pool.setAttribute('opacity', k);
    setT(sj.g, 300, 300 + bobY(lt, 0, 5), 0, pop(lt, .2, .4)); setT(pearls, 300, 300 + bobY(lt, 0, 5), 0, 1.15 * pop(lt, .6, .4)); pearls.setAttribute('opacity', lt > .6 ? 1 : 0); show(tg, lt, .4, 300, 500, -2);
    const gv = easeIO(lin(lt, l14 + 3.6, l15 + .8)); gl.setAttribute('opacity', (gv * (.55 + .15 * Math.sin(lt * 2.2))).toFixed(2));
    sp.forEach((s, i) => { const on = lt > l15 + .4 ? Math.max(0, Math.sin(lt * 3 + i * 1.9)) : 0; s.setAttribute('opacity', on.toFixed(2)); setT(s, [700, 1220, 960, 800, 1130, 960][i], [330, 400, 190, 520, 560, 360][i], 0, .8 * on); });
    show(tt, lt, l15 + .8, 1480, 600, 2);
  };
});
