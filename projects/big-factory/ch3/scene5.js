// ===== 35: Jalal al-Din keeps fighting =====
S(35, 35, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', hill: HDUSK, sun: [1560, 190], clouds: 3, cloudC: '#f5d9bf', wind: 1 }), sp = speedG(g, 780, 1040);
  const hj = H(g, { coat: '#2b2b2b', mane: '#111', blanket: '#1e8449', rider: C.jalal }), ms = [0, 1].map(i => H(g, { coat: ['#8b5a2b', '#6b4a2a'][i], blanket: '#c0392b', rider: i ? C.mon : C.mon2 }));
  const sw = mk(g, '<path d="M0 0 L120 -20" stroke="#cfd8dc" stroke-width="12" stroke-linecap="round"/><path d="M0 0 L120 -20" stroke="#1a1a1a" stroke-width="3"/>', { opacity: 0 });
  const tg = tagG(u, 'JALAL AL-DIN', 80, { fill: '#1e8449' }), tg2 = tagG(u, 'SON OF THE SHAH', 48, { fill: '#111' }), pf = poof(g);
  return lt => {
    sc(lt); sp(lt, 1.1);
    ride(hj, lt, 1080, 945, 1.4, 1, true, 30); hj.rider.arm('R', -170 + 30 * Math.sin(lt * 7)); hj.rider.face('d'); hj.rider.hold('R', '<path d="M0 0 L-6 -90" stroke="#cfd8dc" stroke-width="10" stroke-linecap="round"/>');
    ms.forEach((h, i) => { ride(h, lt + i * .3, 420 - i * 260 - 30 * Math.sin(lt * 2), 920 + i * 40, 1.2, 1, true, 26); h.rider.face('a'); });
    show(tg, lt, .3, 1080, 230, -2, 1e9, 1, true); show(tg2, lt, .9, 1080, 330, 2, 1e9);
  };
});
// ---- Indus scene helpers ----
function indusBg(g) {
  const sc = scenery(g, { sky: 'warm', hill: HDUSK, h: 520, sun: [1650, 170], clouds: 3, cloudC: '#f5d9bf', grass: 30 });
  el('rect', { x: 1000, y: 700, width: 700, height: 400, fill: '#2f63c9' }, g);
  mk(g, '<g stroke="#1a1a1a" stroke-width="7" stroke-linejoin="round"><path d="M-20 705 H1050 V1100 H-20 Z" fill="#8b6b45"/><path d="M-20 705 H1050 V740 H-20 Z" fill="#6d8a45"/><path d="M1040 705 L1060 1100" stroke="#4a3320" stroke-width="10"/><path d="M1560 835 H1940 V1100 H1560 Z" fill="#8b6b45"/><path d="M1560 835 H1940 V868 H1560 Z" fill="#6d8a45"/></g>');
  const wv = el('g', {}, g);
  return { sc, wv };
}
function indusFront(g) {
  const w = el('g', {}, g); mk(w, '<rect x="1000" y="862" width="640" height="260" fill="#2f63c9" opacity=".78"/>'); const lines = el('g', {}, w);
  const ws = [0, 1, 2, 3, 4, 5, 6].map(i => el('path', { stroke: '#cfe6ff', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round', opacity: .7 }, lines));
  return t => ws.forEach((p, i) => { const x = 1020 + ((i * 110 + t * 50) % 560), y = 880 + (i % 4) * 50; p.setAttribute('d', `M${x} ${y} q20 -10 40 0 t40 0`); });
}
// ===== 36: 1221, trapped against the Indus =====
S(36, 36, (g, u, L) => {
  const bg = indusBg(g), hj = H(g, { coat: '#2b2b2b', mane: '#111', blanket: '#1e8449', rider: C.jalal }), kh = [0, 1, 2].map(() => P(g, C.kh)), ms = [0, 1, 2, 3, 4].map(i => H(g, { coat: ['#8b5a2b', '#6b4a2a', '#a0703c', '#5a3a1a', '#8b5a2b'][i], blanket: '#c0392b', rider: i % 2 ? C.mon : C.mon2 }));
  const wf = indusFront(g), y = yearG(u), tg = tagG(u, 'INDUS RIVER (TODAY: PAKISTAN)', 54, { fill: '#2f63c9' }), gp = portrait(g, C.gen, 0, 0, 62, RED), ar = [0, 1, 2, 3].map(() => mk(g, arrowMk, { opacity: 0 }));
  return lt => {
    bg.sc(lt); wf(lt); y(lt, .2, '1221'); const k = easeOut(lin(lt, 0, 4.2));
    ms.forEach((h, i) => { ride(h, lt + i * .4, lerp(-260 - i * 150, 90 + i * 105, k), 705 + (i % 2) * 6, 1.0, 1, lt < 4.3, 22); h.rider.face('d'); h.rider.hold('L', bowH); archerPose(h.rider, 0); });
    kh.forEach((p, i) => { stand(p, 780 + i * 80, 705, .95, -1, lt < 2 ? 'f' : 'd'); p.arm('R', -40); });
    ride(hj, lt, 980, 706, 1.1, -1, false, 0); hj.rider.face(lt < 3 ? 'f' : 'd');
    ar.forEach((a, i) => { const per = 1.2, ph = ((lt - 1.2 - i * .3) % per + per) % per / per; a.setAttribute('opacity', lt > 1.2 ? 1 : 0); setT(a, lerp(500, 900, ph), lerp(600, 640, ph) - Math.sin(Math.PI * ph) * 80, -4 + ph * 18, 1); });
    show(tg, lt, .6, 1260, 300, -2, 1e9); setT(gp.g, 140, 520, 0, pop(lt, 1.5)); gp.pp.face('d');
  };
});
// ===== 37-38: the jump =====
S(37, 38, (g, u, L) => {
  const bg = indusBg(g), hj = H(g, { coat: '#2b2b2b', mane: '#111', blanket: '#1e8449', rider: C.jalal }), kh = [0, 1, 2].map(() => P(g, C.kh)), ms = [0, 1, 2, 3, 4].map(i => H(g, { coat: ['#8b5a2b', '#6b4a2a', '#a0703c', '#5a3a1a', '#8b5a2b'][i], blanket: '#c0392b', rider: i % 2 ? C.mon : C.mon2 }));
  const gen = P(g, C.gen), tk = tickG(g), wf = indusFront(g), spl = poof(g), pfs = [0, 1, 2].map(() => poof(g)), ar = [0, 1, 2, 3, 4].map(() => mk(g, arrowMk, { opacity: 0 }));
  const cl = [0, 1, 2].map(() => mk(g, '<path d="M-30 0 L-10 -20 M30 0 L10 -20" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M0 -40 V-60" stroke="#ffd84a" stroke-width="7" stroke-linecap="round"/>', { opacity: 0 }));
  const tg = tagG(u, 'THE JUMP', 80, OR), tg2 = tagG(u, 'GENGHIS: STOP.', 70, { fill: '#111' });
  return lt => {
    bg.sc(lt); wf(lt); const t38 = L(38), tj = 3.6, tw = 4.0, te = 7.6;
    // Jalal's soldiers fall away (army destroyed)
    kh.forEach((p, i) => { const a = .3 + i * .6; vis(p.g, lt < a + .4); stand(p, 780 + i * 80, 705, .95, -1, 'f'); show(pfs[i], lt, a, 780 + i * 80, 600, 0, a + .7, 1); });
    // Mongols hold the edge; bows go up in line 38 then down
    ms.forEach((h, i) => { ride(h, lt + i * .4, 90 + i * 105, 705 + (i % 2) * 6, 1.0, 1, false, 0); h.rider.face(lt > t38 + 2.0 ? 'n' : 'd'); h.rider.hold('L', bowH); const up = lt > t38 + .3 && lt < t38 + 1.6 ? 1 : 0, kk = up ? easeOut(lin(lt, t38 + .3, t38 + .9)) : 0; if (lt > t38 + .3 && lt < t38 + 1.6) archerPose(h.rider, kk); else if (lt >= t38 + 1.6) { h.rider.arm('L', -10); h.rider.arm('R', -10); } else archerPose(h.rider, 0); });
    stand(gen, 165, 705, 1.25, 1, lt < t38 + 1.5 ? 'o' : 'd'); if (lt > t38 + 1.2) gen.arm('R', -150); else gen.free('R'); gen.arm('L', lt > t38 + 1.2 ? 0 : 20); gen.mark('!', lt, t38 + 1.2, t38 + 2.8);
    ar.forEach((a, i) => { const ph = lin(lt, t38 + .9 + i * .02, t38 + 1.5), on = lt > t38 + .9 && lt < t38 + 1.55; a.setAttribute('opacity', on ? 1 : 0); setT(a, 900 + i * 60 + ph * 100, 560 - i * 14 - ph * 60, -30, 1); });
    // Jalal: rides to the edge, leaps, swims
    let x, yv, rot = 0, mv = true, fl = 1;
    if (lt < 2.2) { x = 980; yv = 706; mv = false; fl = -1; } else if (lt < tj) { const k = lin(lt, 2.2, tj); x = lerp(980, 1040, easeIO(k)); yv = 706; fl = lt < 2.6 ? -1 : 1; mv = lt > 2.6; } else if (lt < tw) { const k = lin(lt, tj, tw); x = lerp(1040, 1320, k); yv = lerp(706, 900, k * k) - Math.sin(Math.PI * k) * 170; rot = lerp(-12, 28, k); fl = 1; } else if (lt < te) { const k = lin(lt, tw, te); x = lerp(1300, 1560, easeIO(k)); yv = 898 + 6 * Math.sin(lt * 5) - 55 * lin(k, .85, 1); rot = 2 * Math.sin(lt * 4); fl = 1; } else { const k = lin(lt, te, te + .8); x = 1560 + 70 * k; yv = 840 - 3; fl = 1; mv = k < 1; }
    ride(hj, lt * 1.3, x, yv, 1.1, fl, mv, lt > tw && lt < te ? 12 : 28); hj.place(x, yv, 1.1, fl, rot, 0);
    hj.rider.face(lt < 2.2 ? 'f' : lt < tj ? 'd' : lt < tw ? 'o' : lt < te ? 'd' : 'h'); if (lt > te) hj.rider.arm('R', -165);
    show(spl, lt, tw, 1300, 880, 0, tw + .7, 1.5); show(tg, lt, 1.5, 960, 190, -2, 3.6);
    // swimming: hide nothing, the water overlay does the work. Tick claps slowly.
    tickAt(tk, 1760, 1090, .4, pop(lt, t38 + .7)); cl.forEach((c, i) => { const per = .8, ph = ((lt - t38 - 1.3) % per + per) % per / per, on = lt > t38 + 1.3 && ph < .35; c.setAttribute('opacity', on && i === 0 ? 1 : 0); setT(c, 1750, 620, 0, 1.4 * (.6 + ph)); });
    show(tg2, lt, t38 + 1.5, 800, 235, -2, t38 + 3.2);
  };
});
// ===== 39: every father should wish for a son like that =====
S(39, 39, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', hill: HDUSK, sun: [1500, 200], clouds: 3, cloudC: '#f5d9bf', wind: 1 }), gen = P(g, C.gen), s1 = P(g, C.sonA), s2 = P(g, C.sonB), jp = portrait(g, C.jalal, 0, 0, 82, '#1e8449');
  const bb = speech(u, 'EVERY FATHER SHOULD WISH', 46, 400), bb2 = speech(u, 'FOR A SON LIKE THAT', 46, 400), th = mk(g, '<circle r="12" fill="#fff" stroke="#1a1a1a" stroke-width="4"/>');
  return lt => {
    sc(lt); stand(gen, 620, 960, 1.2, 1, lt < 1.2 ? 'n' : 'h'); gen.arm('L', lt > .6 ? -100 : 0);
    stand(s1, 1250, 960, 1.05, -1, lt < 2.4 ? 'n' : 'h', 0); stand(s2, 1470, 960, 1.0, -1, lt < 2.7 ? 'n' : 'h', 0);
    setT(jp.g, 360, 380 + 6 * Math.sin(lt * 2), 0, pop(lt, .4)); jp.pp.face('h'); show(th, lt, .3, 450, 520, 0, 1e9, .8);
    show(bb, lt, 1.2, 1080, 360, -2, 1e9); show(bb2, lt, 1.9, 1100, 470, 2, 1e9);
  };
});
// ===== 40-41: serious (sober, quiet) =====
S(40, 41, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts; m.mon(RED); m.red('jin', 500); m.red('khw', 460); ['song', 'jin', 'xia', 'khw'].forEach(k => m.zone(k, k === 'song' ? .55 : .85));
  const cities = [P0.otrar, P0.bukhara, P0.samarkand, P0.urgench, P0.merv, [1481, 497], [1460, 540], [1500, 470], [880, 500], [930, 540]].map(p => cdot(m, p, '', 0, .9)), shade = el('rect', { width: 1920, height: 1080, fill: '#04060c', opacity: 0 }, g);
  const t1 = tagG(u, 'THIS PART IS HARD TO TELL LIGHTLY', 60, { fill: '#10141c', tc: '#d8dde6', stroke: '#8a93a3' }), t2 = bigG(u, 'MILLIONS', 220, { fill: '#e8e8e8' }), t3 = ptxt(u, 'HISTORIANS STILL ARGUE ABOUT THE NUMBERS', 50, '#c8d0dc', { sw: 6 });
  const dust = Array.from({ length: 26 }, () => ({ e: el('circle', { r: 2 + rnd() * 3, fill: '#fff', opacity: 0 }, g), x: rnd() * 1920, y: 300 + rnd() * 700, sp: 8 + rnd() * 20, ph: rnd() * 6 }));
  return lt => {
    const t41 = L(41); m.cam(lerp(1180, 1000, lin(lt, 0, 20)), 485, 2.2 + lt * .012); shade.setAttribute('opacity', .52 * lin(lt, .2, 2.5));
    cities.forEach((d, i) => d.set(lt > .5 + i * .35 ? '#2b2b2b' : '#ffd84a'));
    show(t1, lt, .8, 960, 520, 0, t41 - .2); t2.setAttribute('opacity', lin(lt, t41 + .4, t41 + 1.6)); setT(t2, 960, 560, 0, 1); show(t3, lt, t41 + 2.4, 960, 760, 0, 1e9, .9);
    dust.forEach(d => { d.e.setAttribute('cx', d.x + 20 * Math.sin(lt * .6 + d.ph)); d.e.setAttribute('cy', ((d.y - lt * d.sp) % 800 + 800) % 800 + 280); d.e.setAttribute('opacity', .3 * lin(lt, 1, 3)); });
  };
});
// ===== 42-43: teaser, two generals ride off =====
S(42, 43, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts; m.mon(RED); m.red('jin', 500); m.red('khw', 460); ['song', 'jin', 'xia', 'khw'].forEach(k => m.zone(k, k === 'song' ? .55 : .85));
  const route = [P0.samarkand, P0.mashhad, P0.tabriz, P0.derbent, P0.kalka], rt = el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-dasharray': '16 12' }, m.top), rt2 = el('path', { fill: 'none', stroke: '#ffd84a', 'stroke-width': 9, 'stroke-dasharray': '16 12' }, m.top);
  const h1 = H(m.top, { coat: '#6b4a2a', blanket: '#1abc9c', rider: C.jebe }), h2 = H(m.top, { coat: '#2b2b2b', blanket: '#e67e22', rider: C.sub }), tk = tickG(g);
  const lj = tagG(u, 'JEBE', 52, { fill: '#1abc9c' }), ls = tagG(u, 'SUBUTAI', 52, { fill: '#e67e22' }), tg = tagG(u, 'ONE OF THE CRAZIEST RIDES IN HISTORY', 64, OR), tg0 = tagG(u, 'MEANWHILE... A SIDE TRIP', 70, { fill: '#111' });
  const q = mk(g, '<text class="t big" font-size="100" style="stroke-width:13">?</text>', { opacity: 0 });
  const at = (k, off) => { const n = route.length - 1, kk = clamp(k) * n, i = Math.min(n - 1, Math.floor(kk)), s = kk - i; return [lerp(route[i][0], route[i + 1][0], s), lerp(route[i][1], route[i + 1][1], s), i]; };
  return lt => {
    const t43 = L(43), kz = easeIO(lin(lt, 0, 3.5)); m.cam(lerp(1060, 800, kz), lerp(470, 470, kz), lerp(1.9, 2.5, kz));
    const k = easeIO(lin(lt, 1.0, t43 + 2.6)); const pts = []; const n = route.length - 1; for (let i = 0; i <= n; i++) { if (i / n <= k) pts.push(m.S(route[i])); } const cur = at(k); pts.push(m.S([cur[0], cur[1]]));
    rt.setAttribute('d', 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L')); rt.setAttribute('stroke-dashoffset', -lt * 30); rt2.setAttribute('d', '');
    const a = at(Math.max(0, k - .02)), b = at(Math.min(1, k + .01)), dir = b[0] >= a[0] ? 1 : -1, p1 = m.S([cur[0], cur[1]]), p2 = m.S([cur[0] + 10, cur[1] + 8]);
    const sc2 = .72; ride(h1, lt, p1[0], p1[1] + 30, sc2, -1, true, 22); ride(h2, lt + .3, p2[0] + 120, p2[1] + 36, sc2, -1, true, 22); h1.rider.face('d'); h2.rider.face('d');
    vis(h1.g, lt > 1.0); vis(h2.g, lt > 1.0);
    show(lj, lt, 1.2, p1[0] - 70, p1[1] - 235, -2, 1e9, .8); show(ls, lt, 1.4, p2[0] + 200, p2[1] - 215, 2, 1e9, .8); show(tg0, lt, .2, 960, 160, -1, t43 - .2);
    show(tg, lt, t43 + .3, 960, 920, -1.5, 1e9, 1, true); tickAt(tk, 1740, 1100, .38, pop(lt, t43 + 1.2)); const qq = lt > t43 + 1.6; q.setAttribute('opacity', qq ? 1 : 0); setT(q, 1520, 520 - 8 * Math.sin(lt * 6), 6, pop(lt, t43 + 1.6));
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
