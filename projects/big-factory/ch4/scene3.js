// ===== 12-16: Kalka River 1223, the fake retreat again =====
S(12, 16, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts;
  m.mon(RED);
  el('path', { d: 'M640 350 Q628 372 640 392 Q652 412 632 430 Q624 442 630 458', fill: 'none', stroke: '#8fd3ff', 'stroke-width': 7, 'vector-effect': 'non-scaling-stroke' }, m.w);
  m.label('KALKA RIVER', [640, 345], 30, { dy: -10 });
  const BC = '#2e86c1', RC = '#e2362b';
  const tt = tagG(u, 'THE SAME TRICK', 70, OR), tD = tagG(u, 'DAYS PASS...', 54, { fill: '#111' }), tT = tagG(u, 'SPREAD OUT AND TIRED', 52, { fill: '#1f3a6e' }), tTurn = tagG(u, 'TURN AROUND!', 90, OR), tS = tagG(u, 'RUS ARMY SHATTERED', 60, { fill: '#7b1d1d' });
  const blk = (c) => mk(u, `<rect x="-24" y="-60" width="130" height="100" rx="10" fill="${c === BC ? '#1f3a6e' : '#7b1d1d'}" opacity=".88" stroke="#fff" stroke-width="4"/><g transform="translate(-2 -26) scale(1.3)">${gridS(c, 9)}</g>`, { opacity: 0 });
  const red = blk(RC), bl = [blk(BC), blk(BC), blk(BC)], xs = [0, 1, 2].map(() => mk(u, xMark, { opacity: 0 })), lab1 = tagG(u, 'MONGOLS', 36, { fill: '#c0392b' }), lab2 = tagG(u, 'RUS ARMY + CUMANS', 36, { fill: '#1f3a6e' });
  const arr = [arrowG(u), arrowG(u), arrowG(u), arrowG(u), arrowG(u), arrowG(u)], sw = [0, 1, 2].map(() => mk(u, sweatDrop, { opacity: 0 }));
  return lt => {
    const t13 = L(13), t14 = L(14), t15 = L(15), t16 = L(16);
    m.cam(700 + 10 * Math.sin(lt * .3), 372, 4.2 + lt * .02); y(lt, .2, '1223');
    show(tt, lt, .4, 960, 160, -2, t13 - .2);
    const kb = easeIO(lin(lt, t13, t15)), kt = easeIO(lin(lt, t15, t16 + .5));
    const rx = lt < t15 ? lerp(1020, 1720, kb) : lerp(1720, 800, kt), ry = 560;
    setT(red, rx, ry, 0, pop(lt, .5)); red.setAttribute('opacity', lt > .5 ? 1 : 0); show(lab1, lt, .8, rx + 40, ry - 100, 0, t15 - .1);
    // blue chases, breaking formation
    const kc = easeIO(lin(lt, t14, t15 + .2)), lag = [0, 260, 460], dy = [-110, 20, 140];
    bl.forEach((b, i) => { const bx = lt < t14 ? 560 + i * 0 : lerp(560, 1250, kc) - lag[i] * kc, by = lt < t14 ? 540 + (i - 1) * 40 : 560 + dy[i] * kc; const shat = lt > t16 + .5; setT(b, bx, by, 0, pop(lt, .6 + i * .1) * (i ? .8 : 1)); b.setAttribute('opacity', lt > .6 ? (shat ? 1 - lin(lt, t16 + .5, t16 + 1.6) * .8 : 1) : 0); xs[i].setAttribute('opacity', lt > t16 + .6 ? 1 : 0); setT(xs[i], bx + 50, by - 10, 0, pop(lt, t16 + .6 + i * .1) * .8); });
    show(lab2, lt, .9, 560, 440, 0, t14 - .1);
    // arrows: red retreat (line 13), blue chase (line 14), red turn (line 15), red strike (line 16)
    const kr = easeIO(lin(lt, t13, t15));
    arrowSet(arr[0], [1020, 540], [lerp(1020, 1720, kr), lerp(540, 600, kr)], lt > t13 && lt < t15 ? 1 : 0, -30, RC);
    arrowSet(arr[1], [560, 500], [lerp(560, 1250, kc), lerp(500, 450, kc)], lt > t14 && lt < t15 + .6 ? 1 : 0, 20, BC); arrowSet(arr[2], [560, 560], [lerp(560, 1000, kc), lerp(560, 560, kc)], lt > t14 && lt < t15 + .6 ? 1 : 0, 0, BC); arrowSet(arr[3], [560, 620], [lerp(560, 800, kc), lerp(620, 700, kc)], lt > t14 && lt < t15 + .6 ? 1 : 0, -20, BC);
    const kk = easeOut(lin(lt, t15 + .2, t16 + .8));
    arrowSet(arr[4], [1760, 540], [lerp(1760, 760, kk), lerp(540, 470, kk)], lt > t15 + .2 && lt < t16 + 2 ? 1 : 0, 40, RC); arrowSet(arr[5], [1760, 640], [lerp(1760, 760, kk), lerp(640, 690, kk)], lt > t15 + .2 && lt < t16 + 2 ? 1 : 0, -40, RC);
    show(tD, lt, t13 + .2, 1100, 215, -2, t14 - .1); show(tT, lt, t14 + 1.0, 900, 330, 1, t15 - .1); sw.forEach((s, i) => { s.setAttribute('opacity', lt > t14 + 1.2 && lt < t15 ? 1 : 0); setT(s, 900 + i * 170, 470 + i * 70 + 8 * Math.sin(lt * 6 + i), 0, .9); });
    show(tTurn, lt, t15 + .05, 1100, 250, -3, t16 - .1, 1, true); show(tS, lt, t16 + .6, 960, 880, -2, 1e9, 1, true);
  };
});
// ===== 17-19: chronicles, feast, cut to black =====
S(17, 19, (g, u, L) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, clouds: 3, wind: 1 });
  const t18 = L(18), t19 = L(19), tb = t18 + 4.4;
  // parchment (line 17)
  const pa = mk(g, '<rect x="-330" y="-250" width="660" height="500" rx="18" fill="#efe0b8" stroke="#1a1a1a" stroke-width="8"/><rect x="-370" y="-270" width="60" height="540" rx="28" fill="#c9a768" stroke="#1a1a1a" stroke-width="8"/><rect x="310" y="-270" width="60" height="540" rx="28" fill="#c9a768" stroke="#1a1a1a" stroke-width="8"/><text class="t" y="-170" text-anchor="middle" font-size="62" fill="#5a3a1a">RUS CHRONICLES</text>', { opacity: 0 });
  const lines = []; for (let i = 0; i < 5; i++) lines.push(el('path', { d: `M-250 ${-90 + i * 52} H${250 - (i % 2) * 90}`, stroke: '#7a5a2a', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-dasharray': '1 1', opacity: .8 }, pa));
  const fs = stampG(g, 'F'), cap = tagG(u, 'HORRIBLE, BUT IT\'S IN THE RUS CHRONICLES', 44, { fill: '#111' });
  // feast (line 18): long table with a cloth to the ground, commanders behind it
  const fg = el('g', {}, g), ch = [P(fg, C.jebe), P(fg, C.sub), P(fg, C.mon), P(fg, C.mon2), P(fg, C.sonB), P(fg, C.mon)];
  const table = mk(fg, '<g stroke="#1a1a1a" stroke-width="7" stroke-linejoin="round"><rect x="190" y="690" width="1540" height="210" fill="#8e2b2b"/><rect x="190" y="690" width="1540" height="26" fill="#6b4423"/><rect x="190" y="880" width="1540" height="22" fill="#d4ac0d"/><path d="M190 760 H1730" stroke="#d4ac0d" stroke-width="8" fill="none"/></g>' + [0, 1, 2, 3, 4, 5, 6].map(i => `<g transform="translate(${290 + i * 220} 690)" stroke="#1a1a1a" stroke-width="5"><ellipse cx="0" cy="-10" rx="54" ry="12" fill="#d9d9d9"/><path d="M-40 -14 Q0 -60 40 -14 Z" fill="#c98a3b"/></g>`).join(''));
  const shade = el('rect', { width: 1920, height: 1080, fill: '#1a0f1a', opacity: 0 }, fg), blk = el('rect', { width: 1920, height: 1080, fill: '#000', opacity: 0 }, g), txt = ptxt(g, 'NO ROYAL BLOOD SPILLED.', 70, '#e8e8e8', { sw: 8 }), txt2 = ptxt(g, 'NO MERCY EITHER.', 70, '#e8e8e8', { sw: 8 });
  const emb = Array.from({length: 16}, (_, i) => el('circle', { r: 3 + (i % 3), fill: i % 2 ? '#ff9a3c' : '#ffd84a', opacity: 0 }, g));
  const stage = fg; fg.removeChild(shade); fg.removeChild(table); fg.appendChild(table); fg.appendChild(shade);
  return lt => {
    sc(lt);
    const f1 = lt < t18 - .1; fg.setAttribute('display', lt >= t18 - .1 ? 'inline' : 'none'); pa.setAttribute('opacity', lt > .2 && f1 ? 1 : 0); setT(pa, 960, 520 + 6 * Math.sin(lt * 1.5), 1.5 * Math.sin(lt * .8), pop(lt, .2, .5));
    lines.forEach((l, i) => l.setAttribute('stroke-dasharray', `${Math.max(.1, lin(lt, .8 + i * .25, 1.4 + i * .25) * 520)} 600`));
    stampShow(fs, lt, 1.8, 960, 560, -6); fs.setAttribute('opacity', lt >= 1.8 && f1 ? 1 : 0); show(cap, lt, 2.4, 960, 900, -1, t18 - .15);
    ch.forEach((c, i) => { const up = Math.max(0, Math.sin(lt * 2.2 + i * 1.7)); stand(c, 380 + i * 230, 890, 1.15, i < 3 ? 1 : -1, 'n', bob(lt, i)); c.arm('R', -40 - 90 * up); c.face(up > .5 ? 'h' : 'n'); });
    shade.setAttribute('opacity', .35 * lin(lt, t18, tb));
    blk.setAttribute('opacity', lt >= tb ? 1 : 0); emb.forEach((c, i) => { const k = lt - tb, ph = (k * (.06 + (i % 4) * .02) + i * .137) % 1; c.setAttribute('cx', 150 + i * 112 + 30 * Math.sin(k * 1.3 + i)); c.setAttribute('cy', 1040 - ph * 1000); c.setAttribute('opacity', lt >= tb + .3 ? .55 * Math.sin(ph * Math.PI) : 0); }); show(txt, lt, t19 + .15, 960, 480, 0, 1e9); show(txt2, lt, t19 + .9, 960, 600, 0, 1e9);
  };
});
// ===== 20: the ride home; Jebe dies on the way =====
S(20, 20, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1450, 170], clouds: 3, wind: 1 }), sp = speedG(g, 780, 1040);
  const hJ = H(g, { coat: '#6b4a2a', blanket: '#1abc9c', rider: C.jebe }), hS = H(g, { coat: '#2b2b2b', blanket: '#e67e22', rider: C.sub });
  const halo = el('circle', { r: 150, fill: 'url(#gHalo)', opacity: 0 }, g), tJ = tagG(u, 'JEBE DIES ON THE WAY', 48, { fill: '#1abc9c' }), tS = tagG(u, 'SUBUTAI MAKES IT HOME', 48, { fill: '#e67e22' }), tH = tagG(u, 'HOME', 70, OR);
  return lt => {
    sc(lt); const kj = lin(lt, 1.3, 2.4), mvJ = lt < 2.4, jx = lt < 1.3 ? lerp(300, 780, lin(lt, 0, 1.3)) : lerp(780, 840, easeOut(kj));
    sp(lt, lt < 1.3 ? 1 : lerp(1, .45, kj));
    ride(hJ, lt * (1 - .8 * kj), jx, 920, 1.15, 1, mvJ, lerp(26, 6, kj)); ride(hS, lt + .3, 1180, 950, 1.2, 1, true, 26);
    if (lt > 1.3) { hJ.rider.face('s'); hJ.rider.mark('s', lt, 1.4, 2.6); } else hJ.rider.face('d');
    const fade = lin(lt, 2.4, 3.8); hJ.rider.g.setAttribute('opacity', 1 - fade); halo.setAttribute('opacity', Math.sin(Math.PI * lin(lt, 2.3, 4.6)) * .9); setT(halo, jx + 10, 700 - 40 * lin(lt, 2.4, 4.6), 0, 1 + .4 * lin(lt, 2.3, 4.6));
    hJ.g.setAttribute('opacity', 1 - lin(lt, 3.6, 4.6)); hS.rider.face(lt > 1.4 && lt < 3.0 ? 's' : 'd');
    show(tJ, lt, 1.5, 700, 430, -2, 4.2); show(tS, lt, 3.8, 1250, 430, 1, 1e9, .9);
  };
});
// ===== 21-23: the loop closes; what they bring home; see you in 14 years =====
S(21, 23, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts, LP = G3.loop, BK = G3.back;
  m.mon(RED); m.red('khw', 460); m.zone('khw', .5);
  const out = arrowG(u), back = arrowG(u), tK = tagG(u, 'THOUSANDS OF KILOMETERS', 56, OR), tR = tagG(u, 'ROADS', 44, { fill: '#6b3e1b' }), tV = tagG(u, 'RIVERS', 44, { fill: '#1f5fa8' }), tRich = tagG(u, 'RICH', 56, { fill: '#b7950b' }), tDiv = tagG(u, 'DIVIDED', 56, { fill: '#5d6d7e' });
  const big = mk(u, '<text class="t big" font-size="120" style="stroke-width:16">SEE YOU IN 14 YEARS</text>', { opacity: 0 }), big2 = tagG(u, 'THE MONGOLS WILL BE BACK', 58, { fill: '#7b1d1d' });
  const hS = H(u, { coat: '#2b2b2b', blanket: '#e67e22', rider: C.sub });
  const coins = [[386, 387], [470, 420], [566, 355], [520, 390]].map(p => m.add(p, '<g transform="scale(2.4)"><circle r="22" fill="#ffd84a" stroke="#1a1a1a" stroke-width="5"/><text class="t" y="9" text-anchor="middle" font-size="28" fill="#7a5a00">$</text></g>', { op: 0 })), flags = [[420, 340], [500, 360], [610, 330]].map((p, i) => m.add(p, `<g transform="scale(2.4)"><line y2="-50" stroke="#1a1a1a" stroke-width="5"/><path d="M0 -50 L40 -38 L0 -26Z" fill="${['#2e86c1', '#8e44ad', '#27ae60'][i]}" stroke="#1a1a1a" stroke-width="4"/></g>`, { op: 0 }));
  return lt => {
    const t22 = L(22), t23 = L(23), z = easeIO(lin(lt, t22 - .3, t22 + 3.0));
    m.cam(lerp(800, 600, z), lerp(450, 410, z), lerp(3.2, 2.0, z));
    polyArrow(out, LP.map(p => m.S(p)), RED); out.setAttribute('opacity', lt < t22 + 2 ? 1 : .5);
    const k = easeIO(lin(lt, .2, 4.8)), bp = BK.map(p => m.S(p)), pts = partial(bp, k); polyArrow(back, pts, RED);
    const e = pts[pts.length - 1], q = pts[Math.max(0, pts.length - 2)], dir = e[0] >= q[0] ? 1 : -1; ride(hS, lt, e[0], e[1] + 30, .36, dir, k < 1, 22);
    show(tK, lt, .5, 960, 930, -1, t22 - .2);
    const sh = lt > t22 + .2, rp = m.S([700, 400]), rv = m.S([650, 430]);
    show(tR, lt, t22 + .3, m.S([690, 450])[0] - 100, m.S([690, 450])[1] + 90, -2, t23 - .2); show(tV, lt, t22 + 1.0, rv[0] + 10, rv[1] - 140, 2, t23 - .2);
    coins.forEach((c, i) => c.setAttribute('opacity', lt > t22 + 1.8 + i * .2 ? 1 : 0)); flags.forEach((c, i) => c.setAttribute('opacity', lt > t22 + 2.4 + i * .2 ? 1 : 0));
    show(tRich, lt, t22 + 2.0, 960, 300, -2, t23 - .1); show(tDiv, lt, t22 + 2.9, 1250, 380, 2, t23 - .1);
    show(big2, lt, t23 + .05, 960, 780, -2, 1e9, 1, true); show(big, lt, t23 + .45, 960, 230, 0, 1e9, 1);
  };
});
// ===== 24: 1227, Genghis dies on campaign against Western Xia =====
S(24, 24, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts;
  m.mon(RED); m.red('khw', 460); m.red('jin', 520); m.zone('song', .5); m.zone('xia', .9);
  m.label('WESTERN XIA', P0.xiaE, 36, { dy: 10 });
  const a1 = arrowG(u), a2 = arrowG(u), pg = portrait(g, C.gen, 0, 0, 90, RED), tg = tagG(u, 'GENGHIS KHAN', 44, { fill: '#c0392b' }), tc = tagG(u, 'ON CAMPAIGN', 44, { fill: '#111' });
  return lt => {
    m.cam(1340 + 6 * Math.sin(lt * .3), 500, 4.0 + lt * .01); y(lt, .2, '1227');
    const k = easeIO(lin(lt, .5, 4.5)); const A = m.S([1290, 430]), B = m.S([1345, 500]), C2 = m.S([1280, 560]);
    arrowSet(a1, A, [lerp(A[0], B[0], k), lerp(A[1], B[1], k)], k, 20, RED); arrowSet(a2, C2, [lerp(C2[0], B[0] - 20, k), lerp(C2[1], B[1] + 30, k)], k, -20, RED);
    setT(pg.g, 330, 800, 0, pop(lt, 1.0)); pg.pp.face(lt < 3.5 ? 'n' : 's'); show(tg, lt, 1.2, 330, 665, -2); show(tc, lt, 1.8, 330, 940, 1);
  };
});
// ===== 25: nobody is sure how: three options =====
S(25, 25, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#101626' }, g);
  const pg = portrait(g, C.gen, 0, 0, 110, '#8a93a3'), mkc = (txt) => mk(g, `<rect x="-230" y="-200" width="460" height="400" rx="22" fill="#1b2438" stroke="#8a93a3" stroke-width="6"/><text class="t" y="170" text-anchor="middle" font-size="46" fill="#e8e8e8">${txt}</text>`, { opacity: 0 });
  const c1 = mkc('FALL FROM A HORSE'), c2 = mkc('ILLNESS'), c3 = mkc('AN ARROW');
  const hz = H(g, { coat: '#8b5a2b', blanket: '#c0392b' }), pz = P(g, C.mon), th = mk(g, '<g stroke="#1a1a1a" stroke-width="5"><rect x="-12" y="-110" width="24" height="120" rx="12" fill="#eee"/><circle cy="30" r="30" fill="#e2362b"/><rect x="-6" y="-80" width="12" height="100" fill="#e2362b"/><path d="M14 -80 h16 M14 -56 h16 M14 -32 h16" stroke="#1a1a1a"/></g>', { opacity: 0 }), dr = mk(g, sweatDrop, { opacity: 0 });
  const ar = mk(g, `<g transform="scale(1.6) rotate(-35)">${arrowMk}</g>`, { opacity: 0 });
  const qs = [0, 1, 2].map(() => mk(u, '<text class="t big" font-size="110" style="stroke-width:14">?</text>', { opacity: 0 })), xs = [480, 960, 1440];
  return lt => {
    setT(pg.g, 960, 250, 0, pop(lt, .05) * .9); pg.pp.face('n');
    [c1, c2, c3].forEach((c, i) => show(c, lt, .4 + i * .85, xs[i], 700, 0));
    hz.place(xs[0] + 70, 790, .42, 1, 0, 0); hz.gallop(lt, 4, 8, true); pz.place(xs[0] - 90, 790, .75, 1, 80 + 6 * Math.sin(lt * 4), 0); pz.face('o'); const s1 = lt > .5; vis(hz.g, s1); vis(pz.g, s1);
    th.setAttribute('opacity', lt > 1.25 ? 1 : 0); setT(th, xs[1], 690, 0, pop(lt, 1.25) * .9); dr.setAttribute('opacity', lt > 1.35 ? 1 : 0); setT(dr, xs[1] + 70, 560 + 8 * Math.sin(lt * 5), 0, .9);
    ar.setAttribute('opacity', lt > 2.1 ? 1 : 0); setT(ar, xs[2], 690, 0, pop(lt, 2.1));
    qs.forEach((q, i) => { const on = lt > .8 + i * .85; q.setAttribute('opacity', on ? 1 : 0); setT(q, xs[i] + 150, 560 + 8 * Math.sin(lt * 5 + i), 8, pop(lt, .8 + i * .85)); });
  };
});
// ===== 26: the body is carried home to an unmarked hill =====
S(26, 26, (g, u, L) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, clouds: 2, wind: 1, h: 600 });
  el('path', { d: 'M1000 1000 Q1250 480 1560 470 Q1800 480 2000 1000 Z', fill: '#7a8a4a', stroke: '#1a1a1a', 'stroke-width': 7 }, g);
  const grass = el('path', { d: 'M1380 520 q30 -36 40 0 M1500 500 q26 -40 40 0 M1620 520 q30 -36 40 0', fill: 'none', stroke: '#4d5a2c', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
  const cart = cartG(g), bundle = mk(cart.load, '<g stroke="#1a1a1a" stroke-width="6"><rect x="-90" y="-132" width="180" height="50" rx="22" fill="#e8dcc0"/><path d="M-30 -132 V-82 M30 -132 V-82" stroke-width="5"/></g>');
  const ps = [P(g, C.mon), P(g, C.mon2), P(g, C.jebe)], tU = tagG(u, 'AN UNMARKED HILL', 62, { fill: '#111' }), q = mk(u, '<text class="t big" font-size="130" style="stroke-width:16">?</text>', { opacity: 0 });
  return lt => {
    sc(lt); const k = easeIO(lin(lt, 0, 3.2)), cx = lerp(160, 1060, k); cart.set(cx, 930, .95, cx * .6);
    ps.forEach((p, i) => { if (k < 1) walkP(p, lt * 1.3 + i, cx - 200 - i * 120, 960 + i * 8, 1.1, 1, 's'); else stand(p, cx - 200 - i * 120, 960 + i * 8, 1.1, 1, 's', 0); });
    show(tU, lt, 1.0, 1450, 330, -1, 1e9); q.setAttribute('opacity', lt > 2.0 ? 1 : 0); setT(q, 1560, 440 - 6 * Math.sin(lt * 4), 5, pop(lt, 2.0));
  };
});
// ===== 27-28: the empire in 1227; his sons look toward Europe =====
S(27, 28, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts, y = yearG(u);
  m.mon(RED); m.zone('song', .5); m.zone('xia', .0); m.zone('jin', .0); m.zone('khw', 0);
  const em = el('path', { d: G3.emp, fill: RED, opacity: .88, stroke: '#1a1a1a', 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke' }, m.w), cid = 'empclip', cp = mk(m.w, `<clipPath id="${cid}"><circle id="empc" cx="1120" cy="470" r="0"/></clipPath>`); em.setAttribute('clip-path', `url(#${cid})`);
  const ec = m.w.querySelector('#empc');
  m.label('THE MONGOL EMPIRE', [1100, 440], 46, { op: 1 });
  const ar = arrowG(u), q = mk(u, '<text class="t big" font-size="150" style="stroke-width:18">?</text>', { opacity: 0 }), tS = tagG(u, 'HIS HEIRS', 54, { fill: '#c0392b' }), tE = tagG(u, 'EUROPE', 60, { fill: '#2e5f9e' }), big = mk(u, '<text class="t big" font-size="110" style="stroke-width:15">1227</text>', { opacity: 0 });
  const sA = portrait(g, C.sonA, 0, 0, 70, RED), sB = portrait(g, C.sonB, 0, 0, 70, RED);
  return lt => {
    const t28 = L(28), z = easeIO(lin(lt, t28 - .2, t28 + 2.5));
    m.cam(lerp(1060, 800, z), lerp(450, 430, z), lerp(1.55, 1.7, z)); y(lt, .2, '1227');
    ec.setAttribute('r', 900 * easeOut(lin(lt, .2, 2.2)));
    show(big, lt, .6, 960, 880, -2, t28 - .1, 1, true);
    const A = m.S([800, 420]), B = m.S([420, 385]), k = easeIO(lin(lt, t28 + .4, t28 + 3.0)); arrowSet(ar, A, [lerp(A[0], B[0], k), lerp(A[1], B[1], k)], lt > t28 + .4 ? Math.max(k, .02) : 0, 30, RED);
    setT(sA.g, 250, 880, 0, pop(lt, t28 + .1)); sA.pp.face('d'); setT(sB.g, 430, 880, 0, pop(lt, t28 + .25)); sB.pp.face('d'); show(tS, lt, t28 + .3, 340, 770, -2);
    const eb = m.S(P0.europe); show(tE, lt, t28 + 1.6, eb[0], eb[1] - 100, -2); q.setAttribute('opacity', lt > t28 + 2.4 ? 1 : 0); setT(q, eb[0] + 60, eb[1] + 70 + 8 * Math.sin(lt * 5), 6, pop(lt, t28 + 2.4));
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
