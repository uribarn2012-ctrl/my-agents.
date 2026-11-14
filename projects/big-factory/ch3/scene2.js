// ===== 0-2: 1209, small army vs huge China =====
S(0, 2, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts;
  const lM = m.label('MONGOLS', P0.mongolia, 38, { dy: -30, op: 0 }), lX = m.label('WESTERN XIA', P0.xia, 30, { dy: 30, op: 0 }), lJ = m.label('JIN DYNASTY', P0.jin, 34, { dy: -6, op: 0 }), lN = m.label('NORTHERN CHINA', P0.jin, 24, { dy: 26, op: 0 });
  const wallT = tagG(u, 'BEHIND THE GREAT WALL', 40, { fill: '#6b3e1b' });
  const pn = mk(u, '<rect x="-820" y="-150" width="1640" height="300" rx="20" fill="#111" opacity=".88" stroke="#fff" stroke-width="5"/>', { opacity: 0 });
  const lg = mk(pn, ''), cr = mk(pn, ''); let s1 = '', s2 = '';
  for (let i = 0; i < 20; i++) s1 += `<g transform="translate(${-720 + (i % 5) * 48} ${-20 + Math.floor(i / 5) * 56}) scale(1.9)">${soldier(RED)}</g>`;
  for (let r = 0; r < 9; r++) for (let c = 0; c < 58; c++) s2 += `<g transform="translate(${-400 + c * 20.5 + (r % 2) * 8} ${-60 + r * 25})">${soldier(r % 3 === 0 ? '#d4ac0d' : r % 3 === 1 ? '#1f9d8a' : '#8e44ad')}</g>`;
  lg.innerHTML = s1; mk(cr, `<clipPath id="cwclip"><rect id="cwr" x="-420" y="-100" width="0" height="260"/></clipPath>`); mk(cr, s2).setAttribute('clip-path', 'url(#cwclip)');
  const cwr = cr.querySelector('#cwr');
  const tM = ptxt(pn, 'MONGOLS: ABOUT 100,000', 38, '#ffd0c8'), tC = ptxt(pn, 'CHINA: MILLIONS OF PEOPLE, HUGE ARMIES', 38, '#fff0b8');
  const pg = portrait(g, C.gen, 0, 0, 78, RED), q = mk(g, '<text class="t big" font-size="110" style="stroke-width:14">?</text>', { opacity: 0 });
  return lt => {
    m.cam(1425 + 6 * Math.sin(lt * .3), 470, 3.0 + lt * .012);
    y(lt, .2, '1209');
    m.mon(mixC('#f3ad45', RED, lin(lt, .2, .8))); show(lM, lt, .5, 0, 0, 0); lM.setAttribute('opacity', lin(lt, .4, .8));
    const k1 = lin(lt, L(1) + .1, L(1) + 1.0);
    ['song', 'jin', 'xia'].forEach(k => m.zone(k, k === 'song' ? k1 * .6 : k1));
    [lX, lJ, lN].forEach((e, i) => e.setAttribute('opacity', lin(lt, L(1) + .5 + i * .2, L(1) + 1.1 + i * .2)));
    show(wallT, lt, L(1) + .9, 1500, 700, -1, L(2) - .1);
    show(pn, lt, .9, 960, 890); setT(lg, 0, 0, 0, 1); lg.setAttribute('opacity', lin(lt, 1.0, 1.5));
    show(tM, lt, 1.3, -640, -100); cwr.setAttribute('width', 1180 * easeIO(lin(lt, L(1) + .4, L(1) + 3.2))); cr.setAttribute('opacity', lt > L(1) + .4 ? 1 : 0);
    show(tC, lt, L(1) + .7, 150, -112, 0, 1e9, .8);
    const p = m.S(P0.mongolia), k = pop(lt, L(2) + .1); setT(pg.g, p[0] - 40, p[1] - 150, 0, k); pg.pp.face(lt > L(2) + .1 ? 'k' : 'n');
    setT(q, p[0] + 80, p[1] - 200 - 8 * Math.sin(lt * 6), 6, pop(lt, L(2) + .5)); q.setAttribute('opacity', lt > L(2) + .5 ? 1 : 0);
  };
});
// ===== 3: five secret weapons title =====
S(3, 3, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#1a0f08' }, g);
  const rays = mk(g, Array.from({ length: 14 }, (_, i) => `<path d="M0 0 L${Math.cos(i / 14 * 6.283) * 1800} ${Math.sin(i / 14 * 6.283) * 1800} L${Math.cos((i + .5) / 14 * 6.283) * 1800} ${Math.sin((i + .5) / 14 * 6.283) * 1800} Z" fill="#ff6a00" opacity=".16"/>`).join(''));
  const t1 = bigG(u, 'FIVE SECRET', 150), t2 = bigG(u, 'WEAPONS', 190, { fill: '#ffd84a' }), nm = ['HORSES', 'BOW', 'TRICKS', 'INFO', 'FEAR'];
  const cs = nm.map((n, i) => mk(u, `<circle r="64" fill="#ff6a00" stroke="#fff" stroke-width="7"/><text class="t" y="22" text-anchor="middle" font-size="68" fill="#fff">${i + 1}</text><text class="t" y="120" text-anchor="middle" font-size="40" fill="#ffd84a">${n}</text>`, { opacity: 0 }));
  return lt => {
    setT(rays, 960, 480, lt * 6, 1); show(t1, lt, .05, 960, 330, -2, 1e9, 1, true); show(t2, lt, .22, 960, 520, 2, 1e9, 1, true);
    cs.forEach((c, i) => show(c, lt, .55 + i * .12, 360 + i * 300, 800, 0));
  };
});
// ===== 4-5: horses =====
S(4, 5, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [1500, 160], clouds: 3, wind: 1 }), hd = hud(u), sp = speedG(g, 760, 1040);
  const mkH = (c, m, bl, r) => H(g, { coat: c, mane: m, blanket: bl, rider: r });
  const sp1 = H(g, { coat: '#6b4a2a', blanket: '#2f63c9' }), sp2 = H(g, { coat: '#a0703c', blanket: '#2f63c9' });
  const hB = mkH('#efe7d4', '#6b5d45', '#2f63c9', C.mon), hA = mkH('#8b5a2b', '#2b1b10', '#c0392b', C.mon);
  const fly = P(g, Object.assign({}, C.mon, { noGS: 1 })), cityA = cityG(g), gd = P(g, C.jing);
  const dist = mk(u, '<rect x="-250" y="-50" width="500" height="100" rx="16" fill="#111" stroke="#fff" stroke-width="5"/><text class="t" y="22" text-anchor="middle" font-size="58" fill="#ffd84a">0 KM</text>', { opacity: 0 }), dt = dist.querySelector('text');
  const early = tagG(u, 'DAYS EARLY!', 90, OR), tj = 3.5, tl = 4.2;
  return lt => {
    sc(lt); hd(lt, 1, .2, L(5) - .3); const t5 = L(5);
    const spd = lt < 1.5 ? 1 : lt < tj ? lerp(1, .55, (lt - 1.5) / 2) : 1, wob = Math.sin(lt * 5) * 4;
    sp(lt, lt < tj ? spd : 1);
    // spare horses trailing in far lane
    ride(sp1, lt, 330 + wob, 800, 1.0, 1, true, 24); ride(sp2, lt + .3, 560 - wob, 810, 1.0, 1, true, 24);
    // B comes alongside
    const kb = easeIO(lin(lt, 1.8, tj)), bx = lerp(900, 960, 0) + 0, by = lerp(805, 950, kb), bs = lerp(1.0, 1.45, kb), bX = lerp(640, 1010, kb);
    ride(hB, lt, bX, by, bs, 1, true, 30); const landed = lt >= tl; vis(hB.rider.g, landed); if (landed) hB.rider.face(lt < t5 + 3 ? 'd' : 'h');
    // A tires, rider jumps
    const ax = lt < tl ? 700 : 700 - (lt - tl) * 240, aAmp = lt < tj ? lerp(26, 8, lin(lt, 1.2, tj)) : 8;
    ride(hA, lt * (lt < tj ? lerp(1, .5, lin(lt, 1.2, tj)) : .5), ax, 950, 1.45, 1, true, aAmp); vis(hA.rider.g, lt < tj);
    if (lt > 1.4 && lt < tj) { hA.rider.face(lt < 2.6 ? 's' : 'f'); hA.rider.mark('s', lt, 1.6, 3.4); } else hA.rider.face('d');
    const jk = lin(lt, tj, tl), fx = lerp(700 - 12, bX - 12, jk), fy = (950 - 264) - Math.sin(Math.PI * jk) * 240;
    vis(fly.g, lt >= tj && lt < tl); fly.place(fx, fy + 145, 1.45, 1, jk * 20 - 10, 0); fly.arm('L', -150); fly.arm('R', 150); fly.walk(lt * 10, 9, 30); fly.face('o');
    // line 5: distance meter + city surprise
    const d = Math.round(easeIO(lin(lt, t5 + .2, t5 + 6.8)) * 1800); dt.textContent = d.toLocaleString('en-US') + ' KM'; show(dist, lt, t5 + .2, 960, 120);
    const kc = lin(lt, t5 + 2.2, t5 + 6.2), cs = lerp(.25, .75, easeIO(kc));
    vis(cityA.g, lt > t5 + 2.1); cityA.set(1580, 745 + 60 * kc, cs); cityA.flag('#2874a6');
    vis(gd.g, lt > t5 + 5.0); stand(gd, 1560, 960, .85, -1, lt < t5 + 6 ? 'n' : 'f'); gd.mark('!', lt, t5 + 6.0, t5 + 8);
    show(early, lt, t5 + 6.0, 1100, 330, -3, 1e9, 1, true);
  };
});
// ===== 6-7: the bow =====
S(6, 7, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [300, 150], clouds: 3, wind: 1 }), hd = hud(u), sp = speedG(g, 780, 1040);
  const hk = H(g, { coat: '#a0703c', blanket: '#2e8b57', rider: C.kidR }), ha = H(g, { coat: '#8b5a2b', blanket: '#c0392b', rider: C.mon });
  const ar = [0, 1, 2, 3].map(() => mk(g, arrowMk, { opacity: 0 })), tg = mk(g, '<g stroke="#1a1a1a" stroke-width="6"><rect x="-8" y="0" width="16" height="130" fill="#6b4423"/><circle cy="-6" r="62" fill="#fff"/><circle cy="-6" r="42" fill="#e2362b"/><circle cy="-6" r="20" fill="#fff"/><circle cy="-6" r="8" fill="#e2362b"/></g>');
  // diagram
  const dg = mk(g, '', { opacity: 0 });
  mk(dg, '<rect x="-330" y="-290" width="660" height="560" rx="24" fill="#fff8e8" stroke="#1a1a1a" stroke-width="7"/>');
  const bowL = mk(dg, '<path d="M-120 -170 Q150 0 -120 170" fill="none" stroke="#3a2412" stroke-width="40" stroke-linecap="round"/><path d="M-120 -170 Q130 0 -120 170" fill="none" stroke="#e8e0c8" stroke-width="18" stroke-linecap="round"/><path d="M-120 -170 Q170 0 -120 170" fill="none" stroke="#c9895a" stroke-width="12" stroke-linecap="round" stroke-dasharray="6 5"/><line x1="-120" y1="-170" x2="-120" y2="170" stroke="#333" stroke-width="3"/>');
  const layers = [['SINEW', '#c9895a', 'back, stretchy glue-soaked fibers'], ['WOOD', '#8a5a2b', 'the light core'], ['HORN', '#efe6cc', 'belly, springs back']].map((l, i) => mk(dg, `<rect x="-230" y="${-50 + i * 62}" width="460" height="56" rx="8" fill="${l[1]}" stroke="#1a1a1a" stroke-width="6"/><text class="t" x="-212" y="${-10 + i * 62}" font-size="40" fill="#1a1a1a">${l[0]}</text>`, { opacity: 0 }));
  const glue = tagG(dg, 'GLUED TOGETHER', 40, OR), pw = tagG(u, 'POWERFUL!', 80, OR);
  const stF = stampG(u, 'F'), kid = tagG(u, 'LEARNING SINCE KIDHOOD', 44, { fill: '#2e8b57' });
  setT(bowL, 0, -175, 0, .72);
  return lt => {
    sc(lt); hd(lt, 2, .2); const t7 = L(7);
    sp(lt, 1);
    // line 6: kid then adult shoots from saddle
    const showK = lt < L(6) + 2.0 ? 1 : 0, p6 = lt < t7 - .3;
    vis(hk.g, showK && p6); vis(ha.g, !showK);
    const rx = lt < t7 ? 780 : 1080; ride(hk, lt, 900, 940, 1.1, 1, true, 24); ride(ha, lt, rx, 950, 1.4, 1, true, 28);
    const cyc = (lt * 1.1) % 1, kk = cyc < .6 ? easeIO(cyc / .6) : 0;
    [hk.rider, ha.rider].forEach(r => { archerPose(r, kk); r.hold('L', bowH); r.face(showK ? 'h' : 'd'); });
    if (p6) { show(kid, lt, .2, 1250, 960, -2, L(6) + 1.8); }
    setT(tg, 1790, 850, 0, 1.0);
    ar.forEach((a, i) => { const per = 1.1, ph = ((lt - .45 - i * per / 4) % per + per) % per / per, hit = ph < .55 && lt > .45 + i * per / 4; const rx = showK ? 900 : (lt < t7 ? 780 : 1080); a.setAttribute('opacity', hit && !showK ? 1 : (hit && lt < L(6)+2.0 ? 1 : 0)); setT(a, lerp(rx + 70, 1760, ph / .55), 700 + Math.sin(Math.PI * ph / .55) * -60 + (ph / .55) * 60, (ph / .55) * 12 - 6, 1.1); });
    // line 7: diagram + shot
    const dk = pop(lt, t7 + .1); dg.setAttribute('opacity', lt > t7 + .1 && lt < t7 + 5.6 ? 1 : 0); setT(dg, 520, 540, -2, dk * (1 - lin(lt, t7 + 5.3, t7 + 5.7)));
    layers.forEach((l, i) => { const a = t7 + 2.4 + i * .9; l.setAttribute('opacity', lt > a ? 1 : 0); setT(l, 0, 0 - 8 * (1 - pop(lt, a)), 0, 1); });
    setT(bowL, 0, -175, 0, .72); show(glue, lt, t7 + 4.6, 0, 250, -2, 5.2);
    show(pw, lt, t7 + 5.9, 1300, 330, -3, 1e9, 1, true); stampShow(stF, lt, t7 + 6.4, 1580, 560, 7);
  };
});
// ===== 8-10: tricks (map animation) =====
S(8, 10, (g, u, L) => {
  const m = mapG3(g), hd = hud(u), y = yearG(u), P0 = G3.pts;
  const tt = tagG(u, 'THE FAKE RETREAT', 78, OR);
  const ra = arrowG(u), rb = arrowG(u), rc = arrowG(u), bz = arrowG(u), bz2 = arrowG(u);
  const grid = (c, n) => { let s = ''; for (let i = 0; i < n; i++) s += `<g transform="translate(${(i % 3) * 26} ${Math.floor(i / 3) * 26})">${soldier(c)}</g>`; return s; };
  const blue = mk(u, `<rect x="-24" y="-60" width="130" height="100" rx="10" fill="#1f3a6e" opacity=".85" stroke="#fff" stroke-width="4"/><g transform="translate(-2 -26) scale(1.3)">${grid('#2e86c1', 9)}</g>`, { opacity: 0 });
  const x1 = mk(u, '<path d="M-40 -40 L40 40 M40 -40 L-40 40" stroke="#222" stroke-width="16" stroke-linecap="round"/>', { opacity: 0 });
  const q = mk(u, '<text class="t big" font-size="90" style="stroke-width:12">!</text>', { opacity: 0 }), tp = tagG(u, 'TRAP!', 100, OR);
  const RC = '#e2362b', BC = '#2e86c1';
  return lt => {
    m.cam(1470 + 10 * Math.sin(lt * .3), 480, 4.4 + lt * .02); m.mon(RED); ['song', 'jin', 'xia'].forEach(k => m.zone(k, k === 'song' ? .5 : .85));
    hd(lt, 3, .2); y(lt, .2, '1211'); const t9 = L(9), t10 = L(10);
    show(tt, lt, .2, 960, 960, -2, t9 + 1.2);
    // blue block sits center-right
    const bp = [1180, 560]; show(blue, lt, .5, bp[0], bp[1], 0, 1e9); blue.setAttribute('opacity', lt > .5 ? (lt > t10 + 3.3 ? 1 - lin(lt, t10 + 3.3, t10 + 3.8) * .6 : 1) : 0);
    // line 9: red arrow attacks then turns and runs
    const k1 = lin(lt, t9, t9 + .55), k2 = lin(lt, t9 + .75, t9 + 2.0);
    arrowSet(ra, [560, 600], [lerp(560, 1090, easeIO(k1)), lerp(600, 560, k1)], lt < t9 + .75 ? 1 : 0, 20, '#fff');
    if (lt >= t9 + .75) { const hp = [1090, 560]; arrowSet(ra, [hp[0] - 20, hp[1]], [lerp(hp[0], 520, easeIO(k2)), lerp(hp[1], 640, k2)], 1, -40, '#e2362b'); } else ra.querySelector('.ln').setAttribute('stroke', '#e2362b'), ra.querySelector('.hd').setAttribute('fill', '#e2362b');
    if (lt < t9 + .75) { ra.querySelector('.ln').setAttribute('stroke', RC); ra.querySelector('.hd').setAttribute('fill', RC); }
    show(q, lt, t9 + .8, 860, 470, 0, t9 + 2.2);
    // line 10: blue chase (breaking formation), then red closes in from both sides
    const kc = lin(lt, t10, t10 + 1.9);
    arrowSet(rb, [1180, 540], [lerp(1180, 620, easeIO(kc)), 600], lt > t10 && lt < t10 + 3.6 ? 1 : 0, 20, BC); arrowSet(rc, [1180, 590], [lerp(1180, 600, easeIO(kc)), 680 + 40 * Math.sin(kc * 6)], lt > t10 + .2 && lt < t10 + 3.6 ? 1 : 0, -30, BC);
    const kp = lin(lt, t10 + 1.9, t10 + 3.0);
    arrowSet(bz, [900, 330], [lerp(900, 540, easeOut(kp)), lerp(330, 560, easeOut(kp))], lt > t10 + 1.9 ? 1 : 0, 30, RC); arrowSet(bz2, [900, 880], [lerp(900, 560, easeOut(kp)), lerp(880, 660, easeOut(kp))], lt > t10 + 1.9 ? 1 : 0, -30, RC);
    show(tp, lt, t10 + 3.1, 560, 420, -4, 1e9, 1, true);
  };
});
// ===== 11-13: information =====
S(11, 13, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', hill: HD, clouds: 3, sun: [1500, 160], wind: 1 }), hd = hud(u);
  const sct = P(g, C.mon2), mer = P(g, C.mer1), n1 = P(g, C.nobA), n2 = P(g, C.nobB), cr = cartG(g), hh = H(g, { coat: '#8b5a2b', blanket: '#2f63c9', rider: C.mon });
  const note = (t, c) => mk(u, `<rect x="-170" y="-48" width="340" height="96" rx="8" fill="${c}" stroke="#1a1a1a" stroke-width="5"/><text class="t" y="16" text-anchor="middle" font-size="46" fill="#1a1a1a">${t}</text>`, { opacity: 0 });
  const nA = note('ROADS', '#fff3b0'), nB = note('RIVERS', '#bfe3ff'), nC = note('WHO HATES WHO?', '#ffd0d0');
  const rd = [0, 1, 2].map(() => H(g, { coat: '#8b5a2b', blanket: '#c0392b', rider: C.mon })), sc2 = mk(g, '<g stroke="#1a1a1a" stroke-width="4"><rect x="-26" y="-12" width="52" height="24" rx="12" fill="#f4e8c8"/><circle cx="-26" cy="0" r="12" fill="#e0cf9c"/><circle cx="26" cy="0" r="12" fill="#e0cf9c"/></g>', { opacity: 0 });
  const nw = tagG(u, 'NEWS, FAST', 66, OR), eye = mk(g, '<g stroke="#1a1a1a" stroke-width="5"><path d="M-30 0 L30 0" /><circle r="12" fill="#fff"/></g>', { opacity: 0 });
  return lt => {
    sc(lt); const t12 = L(12), t13 = L(13);
    hd(lt, 4, .2, t13 - .3);
    if (lt < t13 - .1) {
      // scout peeks, merchant with cart, nobles quarrel
      vis(sct.g, 1); vis(mer.g, 1); vis(n1.g, 1); vis(n2.g, 1); vis(cr.g, 1); vis(hh.g, 0); rd.forEach(r => vis(r.g, 0));
      const ks = pop(lt, t12 + .1);
      walkP(sct, lt, lerp(300, 620, easeOut(lin(lt, .1, t12 + 1.5))), 940, 1, 1, lt < t12 ? 'n' : 'd');
      stand(mer, 1000, 940, 1, -1, 'n', Math.abs(Math.sin(lt * 3)) * 4); cr.set(1190, 960, .8, lt * 30); mer.arm('R', -60);
      sct.mark('!', lt, t12 + .6, t12 + 2);
      stand(n1, 1480, 940, 1.1, 1, lt > t12 + 4 ? 'a' : 'n'); stand(n2, 1750, 940, 1.1, -1, lt > t12 + 4.2 ? 'a' : 'n'); n1.mark('a', lt, t12 + 4.4, t12 + 8); n2.mark('a', lt, t12 + 4.6, t12 + 8);
      show(nA, lt, t12 + 1.0, 660, 560, -3, t12 + 3.2); show(nB, lt, t12 + 2.0, 1000, 520, 3, t12 + 4.1); show(nC, lt, t12 + 3.9, 1620, 520, -2, t12 + 7);
      // small notes flying into scout's satchel feel: tiny bobbing marker over scout
    } else {
      vis(sct.g, 0); vis(mer.g, 0); vis(n1.g, 0); vis(n2.g, 0); vis(cr.g, 0); vis(hh.g, 0);
      const r = lt - t13; show(nw, lt, t13 + .2, 960, 250, -2, 1e9, 1, true);
      // relay: three riders, each gallops a leg of the screen and hands the scroll on
      for (let i = 0; i < 3; i++) { const a = t13 + .3 + i * 1.5, kk = lin(lt, a, a + 1.6), on = lt > a - .1 && lt < a + 1.7; vis(rd[i].g, on); ride(rd[i], lt, lerp(-250 + i * 560, 480 + i * 560, easeIO(kk)), 800 + i * 60, .8 + i * .1, 1, true, 28); if (on) rd[i].rider.face('d'); }
      const ki = Math.min(2, Math.floor(Math.max(0, r - .3) / 1.5)), a = t13 + .3 + ki * 1.5, kk = lin(lt, a, a + 1.6);
      setT(sc2, lerp(-250 + ki * 560, 480 + ki * 560, easeIO(kk)) + 120, 700 + ki * 60 - Math.sin(Math.PI * kk) * 40, 0, 1.2); sc2.setAttribute('opacity', lt > t13 + .3 ? 1 : 0);
    }
  };
});
//@@PART3
