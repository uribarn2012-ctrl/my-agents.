// ===== shared helpers for ch6 =====
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
function rz(m, d, cx, cy) { const id = 'rz6' + (++RZN); mk(m.w, `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="0"/></clipPath>`); const c = m.w.querySelector(`#${id} circle`); const p = el('path', { d, fill: RED, opacity: .88, stroke: '#1a1a1a', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke', 'clip-path': `url(#${id})` }, m.w); return (r, op = .88) => { c.setAttribute('r', Math.max(0, r)); p.setAttribute('opacity', op); }; }
function empRed(m) { return el('path', { d: G3.emp, fill: RED, opacity: .88, stroke: '#1a1a1a', 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke' }, m.w); }
function marrow(m, a, pts, k, col = RED) { polyArrow(a, partial(pts.map(p => m.S(p)), k), col); }
function boomG(u, txt) { let d = ''; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? 46 : 80; d += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1); } return mk(u, `<path d="${d}Z" fill="#ffd84a" stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"/><path d="${d}Z" fill="#ff7a1a" transform="scale(.6)"/><text class="t big" y="${txt ? 116 : 0}" font-size="44" style="stroke-width:10">${txt}</text>`, { opacity: 0 }); }


// ----- ch6 helpers -----
const horseMk = '<g stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><path d="M-20 -18 Q-34 -10 -30 6" fill="none" stroke="#2b1b10" stroke-width="5"/><rect x="-18" y="-8" width="6" height="18" fill="#6b4423"/><rect x="-6" y="-8" width="6" height="18" fill="#6b4423"/><rect x="8" y="-8" width="6" height="18" fill="#6b4423"/><rect x="16" y="-8" width="6" height="18" fill="#6b4423"/><ellipse cx="0" cy="-16" rx="24" ry="12" fill="#8b5a2b"/><path d="M12 -22 L28 -40 L40 -32 L34 -18 L20 -12 Z" fill="#8b5a2b"/><circle cx="34" cy="-30" r="2" fill="#1a1a1a"/></g>';
const scrollMk = (w = 420, h = 300) => `<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="8" fill="#f5ecd0"/><rect x="${-w / 2 - 14}" y="${-h / 2 - 14}" width="${w + 28}" height="28" rx="14" fill="#d9b779"/><rect x="${-w / 2 - 14}" y="${h / 2 - 14}" width="${w + 28}" height="28" rx="14" fill="#d9b779"/></g>`;
const sealMk = '<circle r="32" fill="#c0392b" stroke="#1a1a1a" stroke-width="5"/><path d="M-13 -4 L0 -17 L13 -4 L9 13 L-9 13 Z" fill="#8e1f14"/>';
const paizaMk = '<g stroke="#1a1a1a" stroke-width="7" stroke-linejoin="round"><rect x="-75" y="-115" width="150" height="230" rx="30" fill="#e8c24a"/><circle cy="-80" r="16" fill="#3b3b3b"/><path d="M-40 -40 q20 -20 40 0 t40 0 M-45 0 h90 M-40 30 q20 -20 40 0 t40 0 M-30 62 h60" stroke="#7a5a10" stroke-width="8" fill="none" stroke-linecap="round"/></g>';
const houseMk = (c = '#d9b58a', r = '#a93226', w = 70, h = 50) => `<g stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"><rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" fill="${c}"/><path d="M${-w / 2 - 8} ${-h} L0 ${-h - 40} L${w / 2 + 8} ${-h} Z" fill="${r}"/><rect x="-9" y="-28" width="18" height="28" fill="#6b4423"/></g>`;
const templeMk = '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="-70" y="-100" width="140" height="100" fill="#c0392b"/><rect x="-18" y="-60" width="36" height="60" fill="#6b4423"/><path d="M-110 -100 Q-70 -108 0 -150 Q70 -108 110 -100 Z" fill="#f1c40f"/><path d="M-76 -150 Q-40 -150 0 -196 Q40 -150 76 -150 Z" fill="#f1c40f"/><circle cy="-200" r="9" fill="#e67e22"/></g>';
const mosqueMk = '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="-90" y="-90" width="180" height="90" fill="#e8dcc0"/><path d="M-70 -90 Q0 -200 70 -90 Z" fill="#1e8449"/><rect x="100" y="-190" width="26" height="190" fill="#e8dcc0"/><path d="M96 -190 L113 -232 L130 -190 Z" fill="#1e8449"/><circle cx="113" cy="-246" r="9" fill="#f1c40f" stroke-width="3"/><rect x="-18" y="-50" width="36" height="50" rx="16" fill="#6b4423"/></g>';
const churchMk = '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="-80" y="-90" width="160" height="90" fill="#e8dcc0"/><path d="M-96 -90 L0 -140 L96 -90 Z" fill="#7a2e2e"/><rect x="-24" y="-190" width="48" height="100" fill="#ddd0b0"/><path d="M-30 -190 L0 -250 L30 -190 Z" fill="#7a2e2e"/><path d="M0 -300 V-252 M-14 -284 H14" stroke-width="12"/><path d="M0 -300 V-252 M-14 -284 H14" stroke="#f1c40f" stroke-width="5"/><rect x="-18" y="-52" width="36" height="52" rx="16" fill="#6b4423"/></g>';
const crossMk = '<g stroke="#1a1a1a" stroke-width="5"><rect x="-12" y="-44" width="24" height="88" fill="#fff"/><rect x="-34" y="-22" width="68" height="24" fill="#fff"/></g>';
const crescMk = '<path d="M14 -40 A44 44 0 1 0 14 40 A34 34 0 1 1 14 -40 Z" fill="#fff" stroke="#1a1a1a" stroke-width="5"/><circle cx="28" cy="-6" r="9" fill="#fff" stroke="#1a1a1a" stroke-width="4"/>';
const wheelMk = '<g stroke="#1a1a1a" stroke-width="5"><circle r="40" fill="#fff"/><circle r="10" fill="#e67e22"/><path d="M0 -40 V40 M-40 0 H40 M-28 -28 L28 28 M-28 28 L28 -28" stroke-width="5" fill="none"/></g>';
const roadMk = '<path d="M-100 905 Q500 872 1000 905 T2100 895 L2100 1020 Q1500 1050 1000 1020 T-100 1040 Z" fill="#cdb07a"/>';
const along = (pts, k) => { const p = partial(pts, k); return p[p.length - 1]; };
function mi(m, pt, markup, o = {}) { return m.add(pt, '<g>' + markup + '</g>', o).firstChild; }
function sideCard(a, b, lines, sub) {
  S(a, b, (g, u, L) => {
    el('rect', { width: 1920, height: 1080, fill: '#1b2b4d' }, g); mk(g, '<circle cx="760" cy="540" r="760" fill="#ff6a00" opacity=".12"/><circle cx="760" cy="540" r="480" fill="#ff6a00" opacity=".12"/>');
    const rb = ribbon(u), tk = tickG(g), ts = lines.map(t => bigG(u, t, lines.length > 1 ? 120 : 96)), t2 = sub ? ptxt(u, sub, 60, '#ffd84a') : null;
    return lt => {
      rb(lt); ts.forEach((t, i) => show(t, lt, .3 + i * .15, 760, 470 + i * 140 - (lines.length - 1) * 40, -2 + i * 2, 1e9, 1, true)); if (t2) show(t2, lt, .9, 760, 470 + lines.length * 140, 1);
      tickAt(tk, 1580, 1050, .55, pop(lt, .1));
    };
  });
}

// ===== 0-2: Europe's question, the Pope's monk, the long road =====
S(0, 2, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const route = [P0.lyon, P0.krakow, P0.kiev, P0.volga, P0.steppe, P0.karakorum], ar = arrowG(u);
  const eu = mi(m, [P0.europe[0] - 10, P0.europe[1] - 60], '<text class="t big" font-size="64" style="stroke-width:12">EUROPE</text>');
  const qs = [[-60, 30], [20, -10], [90, 40]].map(o => mi(m, [P0.europe[0] + o[0] * .4, P0.europe[1] + o[1] * .4], '<text class="t big" font-size="96" style="stroke-width:14" y="30">?</text>'));
  const ly = m.dot(P0.lyon, 'LYON'), kk = mi(m, P0.karakorum, `<g transform="translate(0 6) scale(.9)">${houseMk('#e0c48a', '#7d3c98', 70, 46)}<g transform="translate(-62 0) scale(.8)">${houseMk('#e8dcc0', '#c0392b', 56, 40)}</g><g transform="translate(60 0) scale(.8)">${houseMk('#d9b58a', '#2e5f9e', 56, 40)}</g></g>`);
  const kl = mi(m, P0.karakorum, '<text class="t big" y="-70" font-size="46" style="stroke-width:11">KARAKORUM</text>');
  const po = portrait(u, Object.assign({}, C.pope, { pz: .5, pdy: 34 }), 0, 0, 150, '#c0392b'), cp = portrait(u, C.carp, 0, 0, 150, '#8a6a4a');
  const tP = tagG(u, 'POPE INNOCENT IV', 44, { fill: '#7b1d1d' }), tC = tagG(u, 'GIOVANNI DA PIAN DEL CARPINE', 40, { fill: '#5d4037' }), tY = tagG(u, '1+ YEAR ON THE ROAD', 66, OR), tQ = tagG(u, 'WHO ARE THEY? WHAT DO THEY WANT?', 44, { fill: '#111' });
  const sc = mk(u, scrollMk(120, 80), { opacity: 0 }), t1 = L(1), t2 = L(2);
  return lt => {
    const e1 = easeIO(lin(lt, t2, t2 + 1.6)), e2 = easeIO(lin(lt, t2 + 5.4, t2 + 8.2));
    let cx = lerp(430, 810, e1), cy = lerp(390, 400, e1), s = lerp(2.6 + lt * .01, 1.4, e1);
    cx = lerp(cx, 1322, e2); cy = lerp(cy, 398, e2); s = lerp(s, 5.2, e2); m.cam(cx, cy, s); y(lt, .1, '1246');
    const eo = 1 - lin(lt, t2 - .1, t2 + .3); setT(eu, 0, 0, 0, pop(lt, .2) * eo); qs.forEach((q, i) => setT(q, 0, 6 * Math.sin(lt * 3 + i * 2), 0, pop(lt, .6 + i * .35) * eo * (1 + .06 * Math.sin(lt * 5 + i))));
    show(tQ, lt, 1.4, 960, 150, -1, t1 - .1);
    const a1 = 1 - lin(lt, t2 - .1, t2 + .35);
    setT(po.g, 330, 790 + bobY(lt, 0, 5), 0, pop(lt, t1 + .1) * a1); po.pp.face(lt > t1 + 1.2 ? 'h' : 'n');
    setT(cp.g, 1590, 790 + bobY(lt, 1, 5), 0, pop(lt, t1 + 1.4) * a1); cp.pp.face('n');
    show(tP, lt, t1 + .3, 330, 960, -1, t2 - .1); show(tC, lt, t1 + 1.6, 1500, 970, 1, t2 - .1);
    const fk = easeIO(lin(lt, t1 + .9, t1 + 2.6)); setT(sc, lerp(450, 1460, fk), 760 - 130 * Math.sin(Math.PI * fk), 360 * fk, 1.4); sc.setAttribute('opacity', (lt > t1 + .9 && lt < t2 - .1) ? 1 : 0);
    const rk = easeIO(lin(lt, t2 + .3, t2 + 5.4)); marrow(m, ar, route, rk, '#fff'); ly.g.setAttribute('opacity', lt > t2 - .1 ? 1 : 0);
    show(tY, lt, t2 + 3.0, 960, 900, -2, t2 + 6.0);
    setT(kk, 0, 0, 0, pop(lt, t2 + 6.3, .5)); setT(kl, 0, 0, 0, pop(lt, t2 + 6.7, .4));
  };
});
// ===== 3: quick side quest =====
sideCard(3, 3, ['QUICK', 'SIDE QUEST'], null);
// ===== 4-5: old Carpine rides hard; THE YAM =====
S(4, 5, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1500, 170], clouds: 3, wind: 1 }); mk(g, roadMk);
  const sp = speedG(g, 900, 1030, 14, '#8a7340'), h = H(g, { coat: '#7a5230', blanket: '#c0392b', rider: C.carp }), t5 = L(5);
  const tA = tagG(u, 'OVER 60 AND IN POOR HEALTH', 50, { fill: '#111' }), tB = tagG(u, 'THEY MADE HIM RIDE HARD', 50, { fill: '#7b1d1d' }), tY = bigG(u, 'THE YAM', 150), tE = tagG(u, 'THE MONGOL EXPRESS ROAD', 46, OR);
  const post = mk(g, '<g stroke="#1a1a1a" stroke-width="6"><rect x="-8" y="-210" width="16" height="210" fill="#6b4423"/><rect x="-120" y="-250" width="240" height="70" rx="10" fill="#e8dcc0"/></g><text class="t" y="-198" text-anchor="middle" font-size="52" fill="#7b1d1d">YAM</text>');
  return lt => {
    sc(lt); sp(lt, 1);
    ride(h, lt, 800 + 24 * Math.sin(lt * .8), 960, 1.25, 1, true, 22); h.rider.face(lt < 1.6 ? 'd' : 's'); h.rider.mark('s', lt, 1.4, t5 + 2.2);
    show(tA, lt, .5, 960, 160, -1, 3.0); show(tB, lt, 3.1, 960, 160, 1, t5 - .1);
    show(tY, lt, t5 + .25, 1400, 400, -3, 1e9, 1, true); show(tE, lt, t5 + .9, 1400, 520, 2);
    setT(post, 1700 + 8 * Math.sin(lt * 2), 900, 0, pop(lt, t5 + .1));
  };
});
// ===== 6: relay stations on the map =====
S(6, 6, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.zone('song', .45); empRed(m);
  const road = [P0.karakorum, [1200, 404], [1100, 420], [1000, 436], [900, 455], [800, 490], P0.tabriz];
  el('path', { d: 'M' + road.map(p => p.join(' ')).join('L'), fill: 'none', stroke: '#6b3e1b', 'stroke-width': 6, 'stroke-dasharray': '12 7', 'vector-effect': 'non-scaling-stroke' }, m.w);
  const N0 = 22, sts = [], hs = [];
  for (let i = 0; i <= N0; i++) { const pt = along(road, i / N0); sts.push(mi(m, pt, '<circle r="9" fill="#ffd84a" stroke="#1a1a1a" stroke-width="3"/>')); hs.push(i % 3 === 1 ? mi(m, pt, `<g transform="translate(0 -22) scale(.75)">${horseMk}</g>`) : null); }
  const p0 = along(road, 0), mv = mi(m, p0, `<g transform="translate(0 -26) scale(1.5)">${horseMk}</g><circle cx="-4" cy="-42" r="9" fill="#d9b08c" stroke="#1a1a1a" stroke-width="3"/>`);
  const tE = tagG(u, 'STATIONS EVERY 30 MILES OR SO', 50, { fill: '#111' }), tF = tagG(u, 'FRESH HORSES WAITING', 56, OR);
  return lt => {
    m.cam(1010, 440, 2.4 + lt * .012); y(lt, .1, '1246');
    const rk = lin(lt, .3, 5.4); sts.forEach((s, i) => { const a = .3 + i / N0 * 5.1; setT(s, 0, 0, 0, pop(lt, a, .25)); if (hs[i]) setT(hs[i], 0, -6 * Math.sin(lt * 4 + i), 0, pop(lt, a + .1, .3)); });
    const q = along(road, easeIO(rk)), a0 = m.S(p0), a1 = m.S(q); setT(mv, a1[0] - a0[0], a1[1] - a0[1] + 4 * Math.abs(Math.sin(lt * 9)), 0, pop(lt, .2));
    show(tE, lt, .4, 960, 150, -1, 3.6); show(tF, lt, 3.3, 960, 880, 2);
  };
});
// ===== 7: horses swapped several times a day =====
S(7, 7, (g, u, L) => {
  const lay = ['dawn', 'day', 'dusk', 'night'].map(k => { const gg = el('g', {}, g); return { gg, f: scenery(gg, { sky: k, hill: { dawn: HDAWN, day: HD, dusk: HDUSK, night: HNIGHT }[k], clouds: 3, wind: 1, sun: { dawn: [300, 500], day: [960, 150], dusk: [1620, 500] }[k], sunC: k === 'dusk' ? '#ff8a3a' : k === 'dawn' ? '#ffd27a' : undefined, moon: k === 'night' ? [1500, 170] : null }) }; });
  mk(g, roadMk);
  const sp = speedG(g, 900, 1030, 14, '#8a7340'), coats = ['#7a5230', '#d8c9a8', '#2b2b2b', '#a0522d'], hs = coats.map((c, i) => H(g, { coat: c, blanket: ['#c0392b', '#1f7a8c', '#e67e22', '#7d3c98'][i], rider: C.carp }));
  const sw = [1.3, 2.7, 4.1], huts = sw.map(() => mk(g, houseMk('#d9b58a', '#a93226', 150, 100) + '<path d="M0 -140 V-200" stroke="#1a1a1a" stroke-width="6"/><path d="M0 -200 L60 -182 L0 -164 Z" fill="#e2362b" stroke="#1a1a1a" stroke-width="4"/>')), pf = sw.map(() => poof(u));
  const tS = ptxt(u, 'SWAP!', 90, '#ffd84a'), tD = tagG(u, 'SEVERAL TIMES A DAY', 56, OR), tM = tagG(u, 'MORNING UNTIL NIGHT', 56, { fill: '#111' }), cnt = tagG(u, 'HORSE 1', 44, { fill: '#7b1d1d' });
  return lt => {
    lay.forEach((l, i) => { l.f(lt); l.gg.setAttribute('opacity', i === 0 ? 1 : lin(lt, [0, .3, 2.3, 4.0][i], [0, 1.5, 3.5, 5.2][i]).toFixed(3)); }); sp(lt, 1);
    const idx = lt < sw[0] ? 0 : lt < sw[1] ? 1 : lt < sw[2] ? 2 : 3;
    hs.forEach((h, i) => { h.g.setAttribute('opacity', i === idx ? 1 : 0); if (i === idx) { ride(h, lt, 780, 965, 1.25, 1, true, 22); h.rider.face('d'); if (i < 3) h.rider.mark('s', lt, sw[i] - 1.0, sw[i] - .05); } });
    huts.forEach((hh, i) => hh.setAttribute('transform', `translate(${lerp(2150, -350, lin(lt, sw[i] - .8, sw[i] + .8))} 900)`));
    pf.forEach((p, i) => show(p, lt, sw[i], 780, 800, 0, sw[i] + .5, 1.2));
    const on = sw.findIndex(s => lt > s && lt < s + .7);
    if (on >= 0) { tS.setAttribute('opacity', 1); setT(tS, 1250, 400 - 40 * lin(lt, sw[on], sw[on] + .7), 0, pop(lt, sw[on], .2)); } else tS.setAttribute('opacity', 0);
    show(tD, lt, .3, 960, 150, -1, 3.8); show(tM, lt, 4.0, 960, 150, 1);
    cnt.lastChild.textContent = 'HORSE ' + (idx + 1); show(cnt, lt, .2, 250, 960, -2);
  };
});
// ===== 8: the paiza =====
S(8, 8, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1500, 170], clouds: 3, wind: 1 });
  const hut = mk(g, houseMk('#d9b58a', '#a93226', 220, 150)), cour = P(g, C.mon), keep = P(g, C.mon2), hz = H(g, { coat: '#d8c9a8', blanket: '#1f7a8c' });
  const pz = mk(u, paizaMk, { opacity: 0 }), tP = bigG(u, 'PAIZA', 150), tT = tagG(u, "A METAL TABLET WITH THE KHAN'S ORDER", 44, { fill: '#111' }), tE = tagG(u, 'EVERY STATION HAD TO HELP', 54, OR);
  return lt => {
    sc(lt); setT(hut, 1620, 930, 0, 1);
    cour.arm('R', lerp(-30, -155, easeOut(lin(lt, 3.4, 4.2)))); cour.arm('L', 30); stand(cour, 520, 995, 1.25, 1, lt > 3.4 ? 'k' : 'n', bob(lt)); cour.arm('R', lerp(-30, -155, easeOut(lin(lt, 3.4, 4.2)))); cour.arm('L', 30);
    const bw = easeIO(lin(lt, 5.3, 5.9)) * (1 - easeIO(lin(lt, 7.0, 7.6)));
    keep.arm('R', 20); keep.arm('L', -20); keep.place(1180, 995, 1.2, -1, 18 * bw, bob(lt, 1)); keep.face(lt < 3.6 ? 'n' : lt < 5.3 ? 'f' : 'h'); keep.tilt(26 * bw);
    const hp = cour.toParent(...cour.hand('R')), big = 1 - easeIO(lin(lt, 3.2, 4.3));
    setT(pz, lerp(hp[0], 960, big), lerp(hp[1] - 40, 500, big), lerp(0, -4, big), lerp(.5, 2.4, big) * pop(lt, .3)); pz.setAttribute('opacity', lt > .3 ? 1 : 0);
    show(tP, lt, .5, 960, 220, -2, 3.3, 1, true); show(tT, lt, 1.4, 960, 760, 1, 3.3); show(tE, lt, 5.2, 960, 160, -1);
    const fx = lerp(2200, 1480, easeOut(lin(lt, 5.6, 7.2))), mvz = lt > 5.6 && lt < 7.2; hz.place(fx, 985, .95, -1, 0); hz.gallop(lt, 6, mvz ? 14 : 0, mvz);
  };
});
// ===== 9: one of the fastest mail systems in the world =====
S(9, 9, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1500, 170], clouds: 3, wind: 1 }); mk(g, roadMk);
  const sp = speedG(g, 900, 1030, 18, '#8a7340'), h = H(g, { coat: '#2b2b2b', blanket: '#e67e22', rider: C.mon2 });
  const env = [0, 1, 2, 3].map(() => mk(g, '<g stroke="#1a1a1a" stroke-width="4"><rect x="-30" y="-20" width="60" height="40" rx="4" fill="#fff"/><path d="M-30 -20 L0 6 L30 -20" fill="none"/></g>'));
  const t1 = tagG(u, "ONE OF THE WORLD'S", 58, { fill: '#111' }), t2 = tagG(u, 'FASTEST MAIL SYSTEMS', 66, OR);
  return lt => {
    sc(lt); sp(lt, 1.6); const x = lerp(-300, 1000, easeOut(lin(lt, 0, 1.4))); ride(h, lt, x, 960, 1.3, 1, true, 26); h.rider.face('k');
    env.forEach((e, i) => setT(e, x - 280 - i * 130, 700 + 40 * Math.sin(lt * 5 + i * 1.5), -10 + 14 * Math.sin(lt * 4 + i), pop(lt, .6 + i * .2)));
    show(t1, lt, .3, 960, 170, -1); show(t2, lt, .7, 960, 280, 1, 1e9, 1, true);
  };
});

const angryMk = '<g stroke="#e2362b" stroke-width="10" fill="none" stroke-linecap="round"><path d="M-24 -24 q12 0 12 -12 M24 -24 q-12 0 -12 -12 M-24 24 q12 0 12 12 M24 24 q-12 0 -12 12"/></g>';
const crownMk = '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"><path d="M-32 -30 L-16 -90 L16 -90 L32 -30 Z" fill="#f1c40f"/><rect x="-44" y="-36" width="88" height="24" rx="12" fill="#c0392b"/><circle cx="0" cy="-96" r="10" fill="#e2362b"/></g>';
// ===== 10: Guyuk is crowned, Carpine watches =====
S(10, 10, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1500, 170], clouds: 3, wind: 1 }), gr = gerG(g), gr2 = gerG(g);
  mk(g, '<rect x="640" y="925" width="640" height="46" rx="8" fill="#c0392b" stroke="#1a1a1a" stroke-width="6"/><rect x="640" y="925" width="640" height="14" fill="#f1c40f" opacity=".8"/>');
  const g0 = P(g, C.guy), g1 = P(g, C.guyK), cr = mk(g, crownMk, { opacity: 0 }), pf = poof(g);
  const crowd = [C.mon, C.mon2, C.tol, C.mon2, C.mon, C.tol, C.mon2, C.mon].map((c, i) => P(g, c)), carp = P(g, C.carp);
  const tG = tagG(u, 'GÜYÜK BECOMES GREAT KHAN', 60, { fill: '#7d1f1f' }), tC = tagG(u, 'CARPINE WATCHES', 44, { fill: '#5d4037' });
  return lt => {
    sc(lt); gr.set(300, 880, 1.25, 1); gr2.set(1640, 870, 1.15, 1);
    const cz = lt > 3.0;
    [g0, g1].forEach((p, i) => { const on = (i === 1) === cz; p.g.setAttribute('opacity', on ? 1 : 0); p.arm('R', lerp(0, -160, cz ? easeOut(lin(lt, 3.3, 3.9)) : 0)); p.arm('L', lerp(0, 160, cz ? easeOut(lin(lt, 3.3, 3.9)) : 0)); stand(p, 960, 928, 1.35, 1, cz ? 'h' : 'n', bob(lt)); p.arm('R', cz ? lerp(0, -160, easeOut(lin(lt, 3.3, 3.9))) : 0); p.arm('L', cz ? lerp(0, 160, easeOut(lin(lt, 3.3, 3.9))) : 0); });
    const cy = lerp(300, 604, easeIn(lin(lt, 1.6, 3.0))); setT(cr, 960, cy, 0, 1.15); cr.setAttribute('opacity', lt > 1.6 && lt < 3.0 ? 1 : 0);
    show(pf, lt, 3.0, 960, 700, 0, 3.6, 1.1);
    crowd.forEach((p, i) => { const L2 = i < 4, x = L2 ? 130 + i * 120 : 1230 + (i - 4) * 112, cheer = lt > 3.2 ? 1 : 0; p.arm('R', cheer ? -150 + 22 * Math.sin(lt * 7 + i) : 10); p.arm('L', cheer ? 150 - 22 * Math.sin(lt * 7 + i * 2) : -10); stand(p, x, 985 + (i % 2) * 22, 1.0, L2 ? 1 : -1, cheer ? 'h' : 'n', cheer ? Math.abs(Math.sin(lt * 7 + i)) * 12 : 0); p.arm('R', cheer ? -150 + 22 * Math.sin(lt * 7 + i) : 10); p.arm('L', cheer ? 150 - 22 * Math.sin(lt * 7 + i * 2) : -10); });
    stand(carp, 1800, 1020, 1.3, -1, lt > 2.6 ? 'f' : 'n', bob(lt, 2)); carp.mark('!', lt, 3.1, 5.0);
    show(tG, lt, .4, 960, 150, -1); show(tC, lt, 1.6, 1640, 520, 2);
  };
});
function easeIn(x) { return x * x; }
// ===== 11-12: the reply to the Pope =====
S(11, 12, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#2a1a1a' }, g); mk(g, '<circle cx="1250" cy="540" r="700" fill="#ffd84a" opacity=".07"/><circle cx="1250" cy="540" r="480" fill="#ffd84a" opacity=".07"/>');
  const po = portrait(g, C.guyK, 0, 0, 215, '#7d1f1f'), t11 = L(11), t12 = L(12), angry = mk(u, angryMk, { opacity: 0 });
  const sc = mk(g, scrollMk(860, 600) + `<g transform="translate(0 270)">${sealMk}</g>`, { opacity: 0 });
  const lines = ['COME HERE YOURSELF,', 'WITH ALL YOUR KINGS,', 'AND BOW TO ME!'], tx = lines.map((t, i) => mk(g, `<text class="t" y="${-110 + i * 130}" text-anchor="middle" font-size="${i === 2 ? 92 : 66}" fill="${i === 2 ? '#a01818' : '#3a2a1a'}">${t}</text>`, { opacity: 0 }));
  const tR = tagG(u, "GÜYÜK'S REPLY TO THE POPE", 54, { fill: '#7d1f1f' }), tN = tagG(u, 'NOT EXACTLY FRIENDLY', 54, OR);
  return lt => {
    setT(po.g, 440, 590 + bobY(lt, 0, 5), 0, pop(lt, .1)); po.pp.face(lt < t11 + 1.0 ? 'n' : 'a');
    const op = easeOut(lin(lt, t11 + .5, t11 + 1.6)); setT(sc, 1330, 560 + bobY(lt, 1, 5), 2, pop(lt, t11 + .4)); sc.setAttribute('opacity', lt > t11 + .4 ? 1 : 0); sc.firstChild.setAttribute('transform', `scale(1 ${lerp(.12, 1, op)})`);
    tx.forEach((t, i) => { t.setAttribute('opacity', lt > t12 + .1 + i * .9 ? 1 : 0); setT(t, 1330, 560, 2, 1 + (lt > t12 + .1 + i * .9 && lt < t12 + .3 + i * .9 ? .25 : 0)); });
    show(angry, lt, t11 + 1.2, 700, 380, 0, t12 - .3, 1.4); show(tR, lt, .2, 960, 120, -1); show(tN, lt, t11 + 1.6, 440, 940, -2, t12 - .2);
  };
});
// ===== 13: the letter is still in the Vatican archives =====
S(13, 13, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#34241a' }, g);
  const shelf = mk(g, '<rect x="160" y="0" width="1600" height="1080" fill="#4a3426"/>' + [250, 520, 790].map(y => `<rect x="160" y="${y}" width="1600" height="26" fill="#6b4a32" stroke="#1a1a1a" stroke-width="5"/>`).join(''));
  const cols = ['#f5ecd0', '#e8d9a8', '#d9c48a', '#f0e2bd'], rolls = [];
  [250, 520, 790].forEach((y, r) => { for (let i = 0; i < 12; i++) { if (r === 1 && i === 5) continue; rolls.push(mk(g, `<rect x="-62" y="-44" width="124" height="44" rx="14" fill="${cols[(i + r) % 4]}" stroke="#1a1a1a" stroke-width="5"/><circle cx="-62" cy="-22" r="22" fill="#c9a66b" stroke="#1a1a1a" stroke-width="5"/><path d="M-30 -24 h60" stroke="#8a6a3a" stroke-width="4"/>`)); setT(rolls[rolls.length - 1], 270 + i * 126, y, 0, 1); } });
  const glow = mk(g, '<circle r="190" fill="url(#gHalo)" opacity=".9"/>'), hero = mk(g, `<rect x="-62" y="-44" width="124" height="44" rx="14" fill="#f5ecd0" stroke="#1a1a1a" stroke-width="5"/><circle cx="-62" cy="-22" r="22" fill="#c9a66b" stroke="#1a1a1a" stroke-width="5"/><circle cx="20" cy="-22" r="14" fill="#c0392b" stroke="#1a1a1a" stroke-width="4"/>`);
  const tA = bigG(u, 'IT STILL EXISTS', 110), tV = tagG(u, 'KEPT IN THE VATICAN ARCHIVES', 54, { fill: '#7d1f1f' }), st = stampG(u, 'F');
  return lt => {
    setT(glow, 774, 498, 0, 1.5 * pop(lt, .6)); glow.setAttribute('opacity', .8 + .2 * Math.sin(lt * 4));
    const k = easeOut(lin(lt, .1, 1.0)); setT(hero, lerp(-200, 774, k), lerp(300, 520, k), lerp(-40, 0, k), 1.35);
    show(tA, lt, .3, 960, 160, -2, 1e9, 1, true); show(tV, lt, 1.0, 960, 940, 1); stampShow(st, lt, 2.0, 1500, 640, -8);
  };
});
// ===== 14: Guyuk dies =====
S(14, 14, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#1e2430' }, g);
  const po = portrait(g, C.guyK, 0, 0, 240, '#7d1f1f'), y = yearG(u), tD = tagG(u, 'GÜYÜK DIES', 76, { fill: '#111' }), tN = tagG(u, 'ONLY TWO YEARS LATER', 46, { fill: '#7d1f1f' });
  return lt => {
    const f = lin(lt, .6, 1.7); setT(po.g, 960, 520, 0, pop(lt, .05)); po.g.style.filter = `grayscale(${f}) brightness(${1 - .3 * f})`; po.g.setAttribute('opacity', 1 - .85 * lin(lt, 1.0, 2.2)); po.pp.face(f > .4 ? 's' : 'n');
    y(lt, .1, '1248'); show(tD, lt, .4, 960, 880, -1); show(tN, lt, 1.0, 960, 980, 1);
  };
});
// ===== 15: Mongke, son of Tolui =====
S(15, 15, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#16213a' }, g);
  const ln = mk(g, '<g stroke="#e8dcc0" stroke-width="10" fill="none" stroke-linecap="round"><path d="M960 330 V400 H560 V430 M960 400 H1360 V430"/><path d="M560 610 V700 M1360 610 V700"/></g>');
  const pg = portrait(g, C.gen, 0, 0, 100, '#f1c40f'), po = portrait(g, C.oge, 0, 0, 90, '#4a4fb5'), pt = portrait(g, C.tol, 0, 0, 90, '#2e5f9e'), pk = portrait(g, C.guyK, 0, 0, 90, '#7d1f1f'), pm = portrait(g, C.mong, 0, 0, 105, '#1f6f5c');
  const y = yearG(u), crown = mk(g, crownMk, { opacity: 0 }), nm = (t, c) => tagG(u, t, 36, { fill: c });
  const tG = nm('GENGHIS', '#111'), tO = nm('ÖGEDEI', '#4a4fb5'), tT = nm('TOLUI, THE YOUNGEST SON', '#2e5f9e'), tK = nm('GÜYÜK', '#7d1f1f'), tM = nm('MÖNGKE', '#1f6f5c'), tC = tagG(u, 'COUSINS', 44, OR);
  return lt => {
    y(lt, .1, '1251');
    setT(pg.g, 960, 230, 0, pop(lt, .2)); show(tG, lt, .5, 960, 365, 0);
    setT(po.g, 560, 520, 0, pop(lt, 1.2)); setT(pt.g, 1360, 520, 0, pop(lt, 1.6)); show(tO, lt, 1.5, 560, 650, -1); show(tT, lt, 1.9, 1360, 650, 1);
    ln.setAttribute('opacity', lin(lt, 1.0, 1.6));
    const dim = lin(lt, 3.4, 4.2); setT(pk.g, 560, 800, 0, pop(lt, 2.4)); pk.g.style.filter = `grayscale(${dim})`; show(tK, lt, 2.6, 560, 930, 1);
    setT(pm.g, 1360, 800 + bobY(lt, 1, 5), 0, pop(lt, 4.0)); show(tM, lt, 4.3, 1360, 940, -1);
    const k = easeIO(lin(lt, 4.3, 5.4)); setT(crown, lerp(560, 1360, k), lerp(700, 690, k) - 120 * Math.sin(Math.PI * k), 0, 1.0); crown.setAttribute('opacity', lt > 4.3 ? 1 : 0);
    show(tC, lt, 4.6, 960, 800, 0, 1e9, 1);
  };
});
