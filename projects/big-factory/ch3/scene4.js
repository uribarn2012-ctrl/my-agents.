// ===== 22: 1218, west to Khwarezm =====
Object.assign(C, { kh: { deel: '#1e8449', sash: '#f1c40f', hat: 'helmet', must: 1, hair: '#111', skin: '#c98f60', s: .95 } });
function cdot(m, pt, name, ly = -34, sc = 1) { const gg = m.add(pt, `<circle class="dt" r="13" fill="#ffd84a" stroke="#1a1a1a" stroke-width="4"/>${name ? `<text class="t big" y="${ly}" font-size="30" style="stroke-width:8">${name}</text>` : ''}`, { sc }); const d = gg.querySelector('.dt'); return { g: gg, set: (c, k = 1) => { d.setAttribute('fill', c); d.setAttribute('r', 13 * k); } }; }
S(22, 22, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.red('jin', 500); ['song', 'jin', 'xia'].forEach(k => m.zone(k, k === 'song' ? .55 : .85));
  const lk = m.label('KHWAREZM', P0.khw, 58, { dy: 0, op: 0 }), lm = m.label('MONGOLS', [1330, 400], 38, { dy: -30 }), tr0 = tagG(u, 'GENGHIS WANTS TRADE', 70, { fill: '#1e8449' });
  const gp = portrait(g, C.gen, 0, 0, 74, RED), sp = portrait(g, C.shah, 0, 0, 74, '#1e8449'), rt = el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-dasharray': '16 12', opacity: .9 }, m.top);
  const cart = mk(m.top, '<g stroke="#1a1a1a" stroke-width="5"><rect x="-30" y="-24" width="60" height="26" rx="6" fill="#8a5a2b"/><rect x="-24" y="-44" width="48" height="22" rx="6" fill="#d4ac0d"/><circle cx="-18" cy="6" r="13" fill="#a0703c"/><circle cx="18" cy="6" r="13" fill="#a0703c"/></g>', { opacity: 0 });
  const sh = tagG(u, 'SHAH MUHAMMAD II', 52, { fill: '#6c3483' });
  return lt => {
    const k = easeIO(lin(lt, .5, 2.6)); m.cam(lerp(1440, 1120, k), lerp(480, 475, k), lerp(3.3, 2.05, k));
    y(lt, .2, '1218'); m.zone('khw', lin(lt, 1.6, 2.4)); lk.setAttribute('opacity', lin(lt, 2.0, 2.6));
    const A = m.S([1300, 410]), B = m.S([P0.otrar[0] + 30, P0.otrar[1] - 6]), kk = lin(lt, 2.6, 4.2);
    rt.setAttribute('d', `M${A[0]} ${A[1]} L${A[0] + (B[0] - A[0]) * kk} ${A[1] + (B[1] - A[1]) * kk}`); rt.setAttribute('opacity', lt > 2.6 ? .9 : 0); rt.setAttribute('stroke-dashoffset', -lt * 30);
    const cp = (lt * .45) % 1; setT(cart, A[0] + (B[0] - A[0]) * cp, A[1] + (B[1] - A[1]) * cp - 14, 0, 1.3); cart.setAttribute('opacity', lt > 2.8 ? 1 : 0);
    setT(gp.g, A[0] + 50, A[1] - 150, 0, pop(lt, 2.4)); gp.pp.face('h');
    setT(sp.g, m.S(P0.khw)[0] - 30, m.S(P0.khw)[1] - 140, 0, pop(lt, 2.0)); sp.pp.face(lt < 3.4 ? 'n' : 'h');
    show(sh, lt, 2.2, m.S(P0.khw)[0] - 30, m.S(P0.khw)[1] - 250, -2, 1e9, .95); show(tr0, lt, 3.0, 960, 900, -2, 1e9, 1, true);
  };
});
// ===== 23: the caravan of ~450 merchants reaches Otrar =====
S(23, 23, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', hill: HD, sun: [330, 160], clouds: 3, wind: 1 }), ct = cityG(g, { wall: '#d9bf8a', tw: '#c9a66b', roof: '#1f618d' }), gv = P(g, C.gov), carts = [0, 1, 2].map(() => cartG(g));
  const ms = Array.from({ length: 9 }, (_, i) => P(g, i % 2 ? C.mer1 : C.mer2));
  const cn = mk(u, '<rect x="-290" y="-52" width="580" height="104" rx="16" fill="#111" stroke="#fff" stroke-width="5"/><text class="t" y="24" text-anchor="middle" font-size="62" fill="#ffd84a">0 MERCHANTS</text>', { opacity: 0 }), cnt = cn.querySelector('text'), tg = tagG(u, 'OTRAR', 80, { fill: '#1f618d' });
  return lt => {
    sc(lt); ct.set(1620, 820, 1.2); ct.flag('#2874a6'); const sp = 190;
    ms.forEach((p, i) => { const x = -120 + i * 150 + lt * sp; walkP(p, lt + i * .3, x, 950 - (i % 3) * 14, 1, 1, 'n'); p.arm('R', -50); });
    carts.forEach((c, i) => { const x = -230 + i * 470 + lt * sp; c.set(x, 950, .95, lt * 160); });
    stand(gv, 1380, 960, 1.05, -1, lt < 3.2 ? 'h' : 'k'); gv.arm('R', -20 + 10 * Math.sin(lt * 3));
    const n = Math.round(easeOut(lin(lt, .3, 4.2)) * 450); cnt.textContent = '~' + n + ' MERCHANTS'; show(cn, lt, .3, 960, 140); show(tg, lt, 1.2, 1560, 380, 2);
  };
});
// ===== 24: governor accuses them =====
S(24, 24, (g, u, L) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, sun: [330, 200], clouds: 3, cloudC: '#f0cdb8' }), ct = cityG(g, { wall: '#d9bf8a', tw: '#c9a66b', roof: '#1f618d' }), gv = P(g, C.gov), gd = P(g, C.jing);
  const ms = Array.from({ length: 5 }, (_, i) => P(g, i % 2 ? C.mer1 : C.mer2)), cr = cartG(g), bb = speech(u, 'SPIES!', 80, 270), sh = el('rect', { width: 1920, height: 1080, fill: '#050a14', opacity: 0 }, g);
  const q = tagG(u, 'ACCUSED OF BEING SPIES', 60, { fill: '#111', tc: '#ddd' }), q2 = tagG(u, 'THEY WERE KILLED', 54, { fill: '#222', tc: '#bbb', stroke: '#777' });
  return lt => {
    sc(lt); ct.set(1650, 830, 1.2); ct.flag('#2874a6'); cr.set(250, 960, .9, 0); const fd = 1 - lin(lt, 2.7, 3.5);
    ms.forEach((p, i) => { stand(p, 420 + i * 120, 955, 1, 1, 'f', Math.abs(Math.sin(lt * 14 + i)) * 4); p.arm('L', 150); p.arm('R', -150); p.g.setAttribute('opacity', fd); });
    stand(gv, 1250, 960, 1.15, -1, 'a'); gv.arm('L', -100 + 8 * Math.sin(lt * 12)); gv.mark('a', lt, .3, 3.6);
    stand(gd, 1100, 960, 1.1, -1, 'a'); gd.arm('R', -60);
    show(bb, lt, .4, 1050, 560, 3, 2.3); show(q, lt, .2, 960, 160, -1, 2.6);
    sh.setAttribute('opacity', .62 * lin(lt, 2.6, 3.4)); show(q2, lt, 3.0, 960, 520, 0, 1e9, 1);
  };
});
// ===== 25: ambassadors sent =====
S(25, 25, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [1550, 160], clouds: 3, wind: 1 }), gen = P(g, C.gen), ct = cityG(g, { wall: '#d4b8e8', tw: '#bfa0d8', roof: '#1e8449' }), bb = speech(u, 'WE ASK FOR JUSTICE', 54, 330), sp = speedG(g, 780, 1040);
  const hs = [0, 1].map(i => H(g, { coat: ['#8b5a2b', '#6b4a2a'][i], blanket: '#c0392b', rider: i ? C.mon2 : C.mon })), tg = tagG(u, 'AMBASSADORS', 64, OR), fl = mk(g, '<line y2="-110" stroke="#4a2f15" stroke-width="7"/><path d="M0 -110 L60 -96 L0 -78 Z" fill="#fff" stroke="#1a1a1a" stroke-width="4"/>');
  return lt => {
    sc(lt); sp(lt, 1); stand(gen, 300, 960, 1.15, 1, 'd'); gen.arm('R', -110 + 6 * Math.sin(lt * 4)); show(bb, lt, .2, 520, 470, -3, 1.9);
    const k = easeIn2(lin(lt, .6, 3.4)); hs.forEach((h, i) => { ride(h, lt + i * .3, lerp(520, 1500, k) - i * 190, 930 - i * 20, .95, 1, true, 26); h.rider.face('d'); }); setT(fl, lerp(520, 1500, k) + 30, 740, 0, 1.2);
    ct.set(1700, 820, 1.0 * lin(lt, 1.4, 2.6) + .001); ct.flag('#1e8449'); show(tg, lt, 1.0, 900, 330, -2, 3.0);
  };
});
const easeIn2 = x => x * x * (3 - 2 * x) * .6 + x * .4;
// ===== 26: throne room, ambassadors humiliated =====
S(26, 26, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#3b2146' }, g);
  mk(g, '<g stroke="#1a1a1a" stroke-width="6"><rect y="760" width="1920" height="320" fill="#6e3a2a"/><path d="M560 1080 L760 760 L1160 760 L1360 1080 Z" fill="#b03a2e"/>' + [160, 640, 1280, 1760].map(x => `<rect x="${x - 40}" y="140" width="80" height="640" fill="#d8c7e6"/><rect x="${x - 56}" y="120" width="112" height="36" fill="#c0a8d8"/>`).join('') + '<path d="M0 0 H1920 V120 Q1700 190 1480 120 Q1260 190 1040 120 Q820 190 600 120 Q380 190 160 120 Q80 150 0 120 Z" fill="#7d3c98"/></g>');
  const th = mk(g, '<g stroke="#1a1a1a" stroke-width="7" stroke-linejoin="round"><rect x="-120" y="-330" width="240" height="330" rx="26" fill="#c9a227"/><rect x="-150" y="-70" width="300" height="70" rx="12" fill="#a97f1a"/><circle cy="-340" r="22" fill="#c0392b"/></g>');
  const shah = P(g, C.shah), mo = [P(g, C.mon), P(g, C.mon2), P(g, C.sonB)], gp = portrait(g, C.gen, 0, 0, 72, RED), cl = mk(g, angryCloud, { opacity: 0 }), pf = poof(g);
  const ta = tagG(u, 'HUMILIATED', 76, { fill: '#7b241c' }), ts = tagG(u, 'ONE EXECUTED', 66, { fill: '#111' });
  return lt => {
    setT(th, 1300, 800, 0, 1.05);
    const sad = lt > 1.6; stand(shah, 1300, 790, 1.18, -1, lt < .6 ? 'n' : lt < 2.8 ? 'a' : 'c', 0); if (lt > .6 && lt < 2.8) { shah.arm('L', -110); } else shah.free('L'); shah.mark('s', lt, 3.0, 4.6);
    mo.forEach((p, i) => { const gone = i === 0 && lt > 1.5; vis(p.g, !gone); const x = lt < 2.2 ? 520 + i * 170 : 520 + i * 170 - (lt - 2.2) * 120; stand(p, x, 960, 1.0, lt < 2.2 ? 1 : -1, lt < 1.3 ? 'n' : lt < 1.6 ? 'f' : 's', lt > 2.2 ? Math.abs(Math.sin(lt * 4)) * 3 : 0); if (lt > 2.2) { p.arm('L', 20); p.arm('R', -20); } });
    show(pf, lt, 1.5, 520, 820, 0, 2.2, 1.2); show(ts, lt, 1.7, 700, 330, -3, 3.6); show(ta, lt, 2.4, 700, 450, 2, 1e9, 1, true);
    setT(gp.g, 220, 900, 0, pop(lt, 2.6)); gp.pp.face('a'); setT(cl, 300, 780, 0, pop(lt, 2.9) * (1 + .7 * lin(lt, 2.9, 4.0))); cl.setAttribute('opacity', lt > 2.9 ? 1 : 0);
  };
});
// ===== 27: Oh no. (Tick, quiet) =====
S(27, 27, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#0f1a2b' }, g);
  const tk = tickG(g), sp = portrait(g, C.shah, 0, 0, 100, '#1e8449'), gp = portrait(g, C.gen, 0, 0, 100, RED), cl = mk(g, angryCloud, { opacity: 0 }), dr = mk(g, sweatDrop, { opacity: 0 });
  const t = mk(u, '<text class="t" text-anchor="middle" font-size="70" fill="#c8d0dc">Oh no.</text>', { opacity: 0 });
  return lt => {
    setT(sp.g, 470, 420, 0, pop(lt, .05)); sp.pp.face('c'); setT(gp.g, 1450, 420, 0, pop(lt, .05)); gp.pp.face('a');
    setT(cl, 1560, 300, 0, 1 + 1.4 * lin(lt, .1, 1.1)); cl.setAttribute('opacity', 1); setT(dr, 550, 300 + 10 * Math.sin(lt * 6), 0, 1.3); dr.setAttribute('opacity', 1);
    tickAt(tk, 960, 1100, .42, pop(lt, .05)); t.setAttribute('opacity', lin(lt, .1, .4)); setT(t, 960, 640, 0, 1);
  };
});
// ===== 28-31: Khwarezm falls (map) =====
S(28, 31, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); m.red('jin', 500); ['song', 'jin', 'xia', 'khw'].forEach(k => m.zone(k, k === 'song' ? .55 : .85));
  const lk = m.label('KHWAREZM', [P0.khw[0] - 4, P0.khw[1] - 62], 46, {});
  const ci = { otrar: cdot(m, P0.otrar, 'OTRAR'), bukhara: cdot(m, P0.bukhara, 'BUKHARA'), samarkand: cdot(m, P0.samarkand, 'SAMARKAND', 56), urgench: cdot(m, P0.urgench, 'URGENCH'), merv: cdot(m, P0.merv, 'MERV', 56) };
  const sp = [[890, 440], [985, 520], [1002, 478], [848, 500], [925, 565]].map(p => cdot(m, p, '', 0, .8)), rs = [[935, 455], [880, 485], [960, 540], [900, 545], [1010, 440]].map(p => cdot(m, p, '', 0, .8));
  const fl = p => m.add(p, '<line y2="-44" stroke="#1a1a1a" stroke-width="5"/><path d="M0 -44 L30 -36 L0 -22 Z" fill="#fff" stroke="#1a1a1a" stroke-width="4"/>', { op: 0, dy: -8 });
  const spf = [[890, 440], [985, 520], [1002, 478], [848, 500], [925, 565]].map(fl), arr = [arrowG(m.top), arrowG(m.top), arrowG(m.top)], gp = portrait(g, C.shah, 0, 0, 66, '#1e8449'), isl = m.add(P0.caspian, '<ellipse rx="40" ry="22" fill="#e6c27a" stroke="#1a1a1a" stroke-width="5"/>', { op: 0 });
  const rt = el('path', { fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-dasharray': '14 12', opacity: 0 }, m.top), shade = el('rect', { width: 1920, height: 1080, fill: '#050505', opacity: 0 }, g);
  const t1 = tagG(u, 'SURRENDERED = OFTEN SPARED', 56, { fill: '#1e8449' }), t2 = tagG(u, 'RESISTED = DESTROYED', 56, { fill: '#3a3a3a', tc: '#ddd', stroke: '#888' }), t3 = tagG(u, 'THOUSANDS KILLED', 54, { fill: '#222', tc: '#bbb', stroke: '#666' }), t4 = tagG(u, 'THE SHAH DIED ALONE ON A SMALL ISLAND', 52, { fill: '#222', tc: '#ddd', stroke: '#888' });
  const wave = [0, 1, 2].map(i => el('circle', { fill: 'none', stroke: '#e2362b', 'stroke-width': 9, opacity: 0 }, m.top));
  const route = [P0.samarkand, [P0.merv[0] - 12, P0.merv[1] + 8], [835, 548], [P0.caspian[0] + 8, P0.caspian[1]]];
  return lt => {
    const t29 = L(29), t30 = L(30), t31 = L(31), k0 = easeIO(lin(lt, 0, 3.0)), k1 = easeIO(lin(lt, t29 - .3, t29 + 1.2)), k2 = easeIO(lin(lt, t31 - .2, t31 + 1.0));
    const ka = easeIO(lin(lt, 0, 3.0)), kb = easeIO(lin(lt, t29 - .3, t29 + 1.2)), kc = easeIO(lin(lt, t31 - .2, t31 + 1.0));
    const cx = lerp(lerp(lerp(1130, 960, ka), 930, kb), 865, kc), cy = lerp(lerp(lerp(470, 490, ka), 500, kb), 515, kc), cs = lerp(lerp(lerp(2.4, 3.0, ka), 4.6, kb), 4.2, kc);
    m.cam(cx, cy, cs); y(lt, .2, '1219');
    // line 28: red wave rolls in
    m.red('khw', easeIO(lin(lt, .5, t30 - .3)) * 420); show(lk, lt, .2, 0, 0); lk.setAttribute('opacity', lin(lt, 0, .5) * (1 - lin(lt, t29 + 1.0, t29 + 1.6) * .75));
    arr.forEach((a, i) => { const s = m.S([1290 - i * 30, 400 + i * 30]), kk = lin(lt, .3 + i * .15, 2.5 + i * .1); arrowSet(a, s, m.S([lerp(1290 - i * 30, 985 + i * 6, easeIO(kk)), lerp(400 + i * 30, 440 + i * 22, easeIO(kk))]), kk * (lt < 3.3 ? 1 : 0), 30 * (i - 1), '#e2362b'); });
    // line 29: names flash then go dark
    ['bukhara', 'samarkand', 'urgench', 'merv'].forEach((n, i) => { const a = t29 + 1.7 + [0, .7, 1.5, 2.1][i], f = lt > a ? lin(lt, a, a + .5) : 0; const flash = lt > a && lt < a + .5; ci[n].set(f < 1 && lt > a ? (Math.floor(lt * 14) % 2 ? '#fff' : '#ff6a00') : (lt > a ? '#2a2a2a' : '#ffd84a'), flash ? 1.5 : 1); });
    ci.otrar.set(lt > .8 + 1.8 ? '#2a2a2a' : '#ffd84a'); ci.otrar.set(lt > 2.6 ? '#2a2a2a' : '#ffd84a');
    // line 30: sober
    const dm = lin(lt, t30 - .2, t30 + 1.2) * (1 - lin(lt, t31 - .1, t31 + .8)); shade.setAttribute('opacity', .38 * dm);
    sp.forEach((d, i) => { const a = t30 + .6 + i * .3; d.set(lt > a ? '#ffffff' : '#ffd84a'); spf[i].setAttribute('opacity', lt > a + .15 ? 1 : 0); });
    rs.forEach((d, i) => { const a = t30 + 2.8 + i * .3; d.set(lt > a ? '#2a2a2a' : '#ffd84a'); });
    show(t1, lt, t30 + .5, 960, 880, -1, t30 + 3.0); show(t2, lt, t30 + 3.2, 960, 880, 1, t30 + 5.4); show(t3, lt, t30 + 5.4, 960, 880, 0, t30 + 7.6);
    // line 31: the Shah flees west
    const kr = lin(lt, t31 + .3, t31 + 3.3), n = route.length - 1, seg = Math.min(n - 1, Math.floor(kr * n)), ss = kr * n - seg, pts = [];
    for (let i = 0; i <= seg; i++) pts.push(m.S(route[i])); const a = m.S(route[seg]), b = m.S(route[seg + 1]); pts.push([lerp(a[0], b[0], ss), lerp(a[1], b[1], ss)]);
    rt.setAttribute('d', 'M' + pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L')); rt.setAttribute('opacity', kr > 0 ? .95 : 0); rt.setAttribute('stroke-dashoffset', -lt * 25);
    const last = pts[pts.length - 1]; setT(gp.g, last[0], last[1] - 88, 0, pop(lt, t31 + .1)); gp.pp.face(kr < .95 ? 'f' : 's');
    isl.setAttribute('opacity', lt > t31 + .6 ? 1 : 0); show(t4, lt, t31 + 3.2, 960, 880, 0, 1e9);
    if (lt < t31 - .1) gp.g.setAttribute('transform', 'scale(0)');
  };
});
// ===== 32: Bukhara mosque exterior =====
function mosqueG(parent) {
  return mk(parent, `<g stroke="#1a1a1a" stroke-width="7" stroke-linejoin="round"><rect x="-440" y="-300" width="880" height="300" fill="#e6d3a8"/><path d="M-200 -300 Q-200 -520 0 -520 Q200 -520 200 -300 Z" fill="#2e86c1"/><path d="M-200 -300 Q-200 -520 0 -520" fill="none" stroke="#fff" stroke-width="5" opacity=".5"/><path d="M0 -520 V-570" stroke-width="8"/><circle cy="-580" r="12" fill="#f1c40f"/><rect x="-520" y="-440" width="80" height="440" fill="#d9c28e"/><rect x="440" y="-440" width="80" height="440" fill="#d9c28e"/><path d="M-530 -440 L-480 -540 L-430 -440 Z" fill="#2e86c1"/><path d="M430 -440 L480 -540 L530 -440 Z" fill="#2e86c1"/><path d="M-110 0 L-110 -170 Q0 -270 110 -170 L110 0 Z" fill="#3b2a1a"/><path d="M-360 0 V-150 Q-300 -210 -240 -150 V0 M240 0 V-150 Q300 -210 360 -150 V0" fill="#8a6a3a"/><path d="M-440 -250 H440" stroke="#bfa56e" stroke-width="5"/>${[0, 1, 2, 3].map(i => `<path d="M-440 ${-20 + 0 * i}" />`).join('')}</g>`);
}
S(32, 32, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [300, 170], clouds: 3, wind: 1 }), mo = mosqueG(g), y = yearG(u), hr = H(g, { coat: '#efe7d4', mane: '#6b5d45', blanket: '#c0392b', rider: C.gen });
  const sb = P(g, C.scribe), pen = mk(g, '<path d="M0 0 L28 -52" stroke="#fff" stroke-width="6" stroke-linecap="round"/>', { opacity: 0 }), tg = tagG(u, 'A PERSIAN HISTORIAN, DECADES LATER', 52, { fill: '#2e86c1' }), tb = tagG(u, 'BUKHARA', 80, OR);
  const rich = [0, 1, 2].map(i => P(g, i === 0 ? C.nobA : i === 1 ? C.nobB : C.gov)), tg2 = tagG(u, 'THE GREAT MOSQUE', 56, { fill: '#7a5a2a' });
  return lt => {
    sc(lt); mo.setAttribute('transform', 'translate(1330 900) scale(.96)'); y(lt, .3, '1220');
    stand(sb, 330, 960, .95, 1, 'n'); sb.arm('R', -70 + 25 * Math.sin(lt * 8)); sb.arm('L', 40); show(tg, lt, 1.0, 620, 260, -2, 4.3); show(tb, lt, .3, 1330, 230, -2, 3.2);
    const t = lt - 4.4, k = easeOut(lin(lt, 4.4, 8.6)); vis(hr.g, lt > 4.3); ride(hr, lt, lerp(-250, 1280, k), 960, 1.0, 1, k < .99, 28); hr.rider.face('d');
    rich.forEach((p, i) => { stand(p, 1630 + i * 90 - (i === 2 ? 40 : 0), 980, .85, -1, lt < 7.0 ? 'n' : 'f', 0); });
    show(tg2, lt, 5.2, 960, 400, 2, 1e9);
  };
});
// ===== 33: "I am the punishment of God" =====
S(33, 33, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#4a3320' }, g);
  mk(g, '<g stroke="#1a1a1a" stroke-width="6"><rect y="800" width="1920" height="280" fill="#7a4e2a"/><path d="M360 1080 L640 800 L1280 800 L1560 1080 Z" fill="#2e86c1"/>' + [200, 760, 1160, 1720].map(x => `<path d="M${x - 130} 800 V300 Q${x} 160 ${x + 130} 300 V800 Z" fill="#6a4a2c"/><path d="M${x - 90} 800 V340 Q${x} 240 ${x + 90} 340 V800 Z" fill="#8a6a3c"/>`).join('') + '</g>');
  const pl = mk(g, '<g stroke="#1a1a1a" stroke-width="7" stroke-linejoin="round"><rect x="-130" y="-230" width="260" height="230" fill="#8a5a2b"/><path d="M-130 -230 L0 -330 L130 -230 Z" fill="#c9a227"/><path d="M-150 0 H150 V-30 H-150 Z" fill="#6b4423"/><path d="M-200 0 H200 V-60" fill="none"/></g>');
  const gen = P(g, C.gen), rich = [C.nobA, C.nobB, C.gov, C.nobA, C.nobB].map(c => P(g, c)), t1 = bigG(u, 'I AM THE PUNISHMENT OF GOD', 112), s1 = ptxt(u, 'IF YOU HAD NOT COMMITTED GREAT SINS,', 46), s2 = ptxt(u, 'GOD WOULD NOT HAVE SENT A PUNISHMENT LIKE ME UPON YOU.', 46);
  const st = stampG(u, 'L'), nt = tagG(u, 'WE ONLY HAVE IT FROM A HISTORIAN WRITING DECADES LATER', 40, { fill: '#555', tc: '#eee', stroke: '#bbb' });
  return lt => {
    setT(pl, 960, 830, 0, 1.15); const rise = easeOut(lin(lt, .1, 1.1));
    stand(gen, 960, 760 - 0 * rise, 1.2, 1, lt < 3.0 ? 'a' : 'o', 0); gen.arm('R', -170 + 10 * Math.sin(lt * 5) * (lt > .6 ? 1 : 0));
    rich.forEach((p, i) => { stand(p, 220 + i * 360 + (i > 2 ? -60 : 0), 1000 + (i % 2) * 20, .92, i < 2 ? 1 : -1, lt < 1.5 ? 'n' : (i % 2 ? 'f' : 'c'), Math.abs(Math.sin(lt * 9 + i)) * 3); });
    show(t1, lt, .35, 960, 215, -1.2, 1e9, 1, true); show(s1, lt, 2.6, 960, 960, 0, 1e9, .92); show(s2, lt, 3.3, 960, 1030, 0, 1e9, .92);
    stampShow(st, lt, 4.4, 1560, 500, 8); show(nt, lt, 5.2, 960, 720, -1, 1e9, .95);
  };
});
// ===== 34: side quest card =====
S(34, 34, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#1c2e4a' }, g);
  const rays = mk(g, Array.from({ length: 12 }, (_, i) => `<path d="M0 0 L${Math.cos(i / 12 * 6.283) * 1800} ${Math.sin(i / 12 * 6.283) * 1800} L${Math.cos((i + .5) / 12 * 6.283) * 1800} ${Math.sin((i + .5) / 12 * 6.283) * 1800} Z" fill="#ff6a00" opacity=".17"/>`).join(''));
  mk(g, '<path d="M0 760 H700 V1080 H0 Z" fill="#6a4a2c" stroke="#1a1a1a" stroke-width="7"/><path d="M700 900 H1920 V1080 H700 Z" fill="#2f63c9"/>');
  const rb = ribbon(u), t = bigG(u, 'THE JUMP', 220, { fill: '#ffd84a' }), tk = tickG(g);
  return lt => { setT(rays, 960, 500, lt * 5, 1); rb(lt); show(t, lt, .2, 880, 520, -2, 1e9, 1, true); tickAt(tk, 1600, 1090, .46, pop(lt, .3)); };
});
//@@PART5
