// ---- extra props ----
const hamMk = '<rect x="-5" y="-14" width="10" height="60" rx="4" fill="#6b4423" stroke="#1a1a1a" stroke-width="3"/><rect x="-20" y="-32" width="40" height="24" rx="5" fill="#7f8c8d" stroke="#1a1a1a" stroke-width="4"/>';
function catG(parent) {
  const g = el('g', {}, parent);
  const arm = mk(g, '<g stroke="#1a1a1a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><line x1="-90" y1="0" x2="170" y2="0" stroke="#6b4423" stroke-width="18"/><circle cx="-90" cy="0" r="22" fill="#4a3320"/><path d="M150 -6 Q170 40 196 -6 Z" fill="#8a5a2b"/></g>');
  const base = mk(g, '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><path d="M-120 0 L-60 -120 L60 -120 L120 0 Z" fill="#a0703c"/><path d="M-80 -60 H80" stroke-width="8"/><rect x="-140" y="-18" width="280" height="22" rx="6" fill="#6b4423"/><circle cx="-90" cy="12" r="30" fill="#8a5a2b"/><circle cx="90" cy="12" r="30" fill="#8a5a2b"/></g>');
  g.insertBefore(arm, base); const armT = mk(g, '', {}); armT.appendChild(arm);
  return { g, set: (x, y, s = 1, ang = 40) => { g.setAttribute('transform', `translate(${x} ${y}) scale(${s})`); armT.setAttribute('transform', `translate(0 -120) rotate(${ang})`); } };
}
function towerG(parent) {
  const g = el('g', {}, parent), b = mk(g, '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="-90" y="-420" width="180" height="400" fill="#a0703c"/><path d="M-90 -300 H90 M-90 -180 H90" stroke="#6b4423" stroke-width="8"/><path d="M-90 -420 L90 -20 M90 -420 L-90 -20" stroke="#6b4423" stroke-width="6" opacity=".6"/><rect x="-100" y="-460" width="200" height="44" fill="#8a5a2b"/><rect x="-36" y="-380" width="72" height="50" fill="#2b1b10"/><circle cx="-60" cy="0" r="34" fill="#6b4423"/><circle cx="60" cy="0" r="34" fill="#6b4423"/></g>');
  return { g, set: (x, y, s = 1, h = 1) => { g.setAttribute('transform', `translate(${x} ${y}) scale(${s})`); b.setAttribute('transform', `scale(1 ${h})`); } };
}
const speech = (u, text, size = 52, w = 320) => mk(u, `<ellipse rx="${w}" ry="${size * 1.25}" fill="#fff" stroke="#1a1a1a" stroke-width="6"/><text class="t" y="${size * .36}" text-anchor="middle" font-size="${size}" fill="#1a1a1a">${text}</text>`, { opacity: 0 });
const angryCloud = '<g stroke="#1a1a1a" stroke-width="5"><circle cx="-26" cy="0" r="30" fill="#7b1d1d"/><circle cx="14" cy="-18" r="36" fill="#a52424"/><circle cx="44" cy="8" r="28" fill="#7b1d1d"/></g><path d="M-18 -4 L-2 4 M22 -8 L8 2" stroke="#fff" stroke-width="5" stroke-linecap="round"/>';
const sweatDrop = '<path d="M0 -40 Q26 0 0 22 Q-26 0 0 -40 Z" fill="#7ec8ff" stroke="#1a1a1a" stroke-width="5"/>';
// ===== 14-15: fear (army outside a walled city, surrender offer) =====
S(14, 15, (g, u, L) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, clouds: 4, cloudC: '#f3d2b0', wind: 1 }), hd = hud(u), ct = cityG(g), gd = P(g, C.jing), gd2 = P(g, C.jing);
  const ad = [0, 1, 2, 3].map(i => H(g, { coat: ['#8b5a2b', '#6b4a2a', '#a0703c', '#5a3a1a'][i], blanket: '#c0392b', rider: i % 2 ? C.mon : C.mon2 })), bn = mk(g, bannerMk);
  const ms = H(g, { coat: '#efe7d4', mane: '#6b5d45', blanket: '#c0392b', rider: C.gen }), sc1 = mk(g, '<g stroke="#1a1a1a" stroke-width="4"><rect x="-22" y="-12" width="44" height="24" rx="12" fill="#f4e8c8"/></g>');
  const ft = bigG(u, 'FEAR', 230), tag = (t, c) => tagG(u, t, 64, c);
  const t1 = tag('SURRENDER', { fill: '#1e8449' }), t2 = tag('PAY TRIBUTE', { fill: '#b9770e' }), t3 = tag('AND LIVE', { fill: '#2874a6' }), t4 = tag('REFUSE = DESTROYED', { fill: '#7b1d1d' });
  const sm = [0, 1, 2].map(() => poof(g)), shade = el('rect', { width: 1920, height: 1080, fill: '#20000a', opacity: 0 }, g);
  return lt => {
    sc(lt); hd(lt, 5, .2, 1e9); const t15 = L(15);
    ct.set(1520, 790, 1.15); ct.flag('#2874a6'); ct.gateOpen(0);
    show(ft, lt, .15, 960, 400, -2, t15 + .5, 1, true);
    ad.forEach((h, i) => { const x = lerp(-250 - i * 220, 720 - i * 170, easeOut(lin(lt, 0, 3.6))), mv = lt < 3.8; ride(h, lt + i * .4, x, 880 + (i % 2) * 40, .9, 1, mv, 26); h.rider.face('d'); });
    const mx = lerp(-300, 960, easeOut(lin(lt, .8, 4.0))); ride(ms, lt, mx, 930, 1, 1, lt < 4.2, 24); ms.rider.face('d'); setT(bn, mx - 40, 760, 0, 1.2);
    // guard on wall: scared, then white flag
    stand(gd, 1470, 600, .5, -1, lt < t15 + 2.4 ? 'f' : 'n'); gd.mark('!', lt, t15 + 2.0, t15 + 4);
    stand(gd2, 1580, 600, .5, -1, lt < t15 + 6.0 ? 'c' : 'f');
    const k = lin(lt, t15 + .6, t15 + 3.2); // messenger runs to the gate
    show(t1, lt, t15 + 2.8, 780, 300, -3, t15 + 4.6); show(t2, lt, t15 + 3.5, 780, 400, 2, t15 + 5.3); show(t3, lt, t15 + 4.2, 780, 500, -2, t15 + 5.9);
    show(t4, lt, t15 + 6.0, 960, 330, -2, 1e9, 1, true);
    sm.forEach((s, i) => show(s, lt, t15 + 6.5 + i * .25, 1380 + i * 140, 600 - i * 20, 0, 1e9, 1.4)); shade.setAttribute('opacity', .45 * lin(lt, t15 + 6.3, t15 + 7.6));
    vis(sc1, 0);
  };
});
// ===== 16: stories spread, cities open gates (map) =====
S(16, 16, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts; m.mon(RED); ['song', 'jin', 'xia'].forEach(k => m.zone(k, k === 'song' ? .55 : .85));
  const origin = [1395, 465], pts = [[1450, 520], [1500, 485], [1465, 585], [1555, 540], [1415, 600], [1520, 440], [1380, 540]];
  const oc = m.add(origin, '<circle r="18" fill="#7b1d1d" stroke="#1a1a1a" stroke-width="5"/><text class="t big" y="-34" font-size="32" style="stroke-width:8">REFUSED</text>');
  const ds = pts.map(p => m.dot(p, '')), fls = pts.map(p => m.add(p, '<line y2="-48" stroke="#1a1a1a" stroke-width="5"/><path d="M0 -48 L34 -40 L0 -26 Z" fill="#fff" stroke="#1a1a1a" stroke-width="4"/>', { op: 0, dy: -10 }));
  const ring = el('circle', { fill: 'none', stroke: '#fff', 'stroke-width': 10, opacity: 0 }, m.top), ring2 = el('circle', { fill: 'none', stroke: '#ffd84a', 'stroke-width': 6, opacity: 0 }, m.top);
  const sm = poof(m.top), t1 = tagG(m.top, 'THE STORIES TRAVELED FASTER THAN THE ARMY', 54, { fill: '#111' }), t2 = tagG(m.top, 'GATES OPENED. NO FIGHT.', 76, { fill: '#1e8449' });
  const ra = arrowG(m.top), gp = portrait(g, C.gen, 0, 0, 64, RED);
  const ba = [0, 1, 2].map(() => mk(m.top, '<text class="t big" font-size="64" style="stroke-width:10">!</text>', { opacity: 0 }));
  return lt => {
    m.cam(1470, 515, 5.4 + lt * .02); const o = m.S(origin);
    const k = lin(lt, 1.3, 4.2), r = easeOut(k) * 900;
    ring.setAttribute('cx', o[0]); ring.setAttribute('cy', o[1]); ring.setAttribute('r', r); ring.setAttribute('opacity', k > 0 && k < 1 ? .7 * (1 - k) : 0);
    ring2.setAttribute('cx', o[0]); ring2.setAttribute('cy', o[1]); ring2.setAttribute('r', Math.max(0, r - 90)); ring2.setAttribute('opacity', k > .12 && k < 1 ? .6 * (1 - k) : 0);
    show(sm, lt, 1.2, o[0], o[1] - 20, 0, 1e9, 1.1); oc.setAttribute('opacity', lt > .5 ? 1 : 0);
    arrowSet(ra, m.S([1330, 430]), m.S([1385, 462]), lin(lt, .1, 1.0), 20, '#e2362b');
    ds.forEach((d, i) => { const p = m.S(pts[i]), dd = Math.hypot(p[0] - o[0], p[1] - o[1]), open = r > dd && lt > 1.3, kk = open ? lin(r - dd, 0, 40) : 0; d.set(open ? '#ffffff' : '#ffd84a', 1 + .3 * Math.sin(Math.PI * kk)); fls[i].setAttribute('opacity', open ? 1 : 0); });
    ba.forEach((b, i) => { const p = m.S(pts[i * 2]), dd = Math.hypot(p[0] - o[0], p[1] - o[1]); show(b, lt, 1.3 + dd / 900 * 2.9 - .3, p[0], p[1] - 70, 0, 1e9 && 1.3 + dd / 900 * 2.9 + 1.0); });
    show(t1, lt, 1.0, 960, 160, -1, 4.6); show(t2, lt, 5.0, 960, 880, -2, 1e9, 1, true);
    setT(gp.g, 220, 880, 0, pop(lt, .1)); gp.pp.face('a');
  };
});
// ===== 17: 1211 invasion of Jin =====
S(17, 17, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts; m.mon(RED); ['song', 'jin', 'xia'].forEach(k => m.zone(k, k === 'song' ? .55 : .85));
  m.label('MONGOLS', P0.mongolia, 36, { dy: -34 }); m.label('JIN DYNASTY', P0.jin, 36, { dy: -10 }); m.label('GREAT WALL', [1420, 497], 24, { dy: 30 });
  const a1 = arrowG(m.top), a2 = arrowG(m.top), tg = tagG(u, 'JIN DYNASTY INVADED', 64, OR), gp = portrait(g, C.gen, 0, 0, 70, RED);
  return lt => {
    m.cam(1440, 470, 4.2 + lt * .03); y(lt, .1, '1211');
    const k = lin(lt, .5, 2.6); arrowSet(a1, m.S([1350, 430]), m.S([lerp(1350, 1495, easeIO(k)), lerp(430, 520, easeIO(k))]), k, 30, '#e2362b');
    const k2 = lin(lt, .9, 3.2); arrowSet(a2, m.S([1300, 440]), m.S([lerp(1300, 1440, easeIO(k2)), lerp(440, 565, easeIO(k2))]), k2, -25, '#e2362b');
    show(tg, lt, 2.4, 960, 900, -2); const p = m.S(P0.mongolia); setT(gp.g, p[0] - 140, p[1] - 100, 0, pop(lt, .2)); gp.pp.face('d');
  };
});
// ===== 18-19: walls stop them, so they learn (engineers) =====
S(18, 19, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', clouds: 3, sun: [350, 150], wind: 0 }), ct = cityG(g, { wall: '#c9a56a', roof: '#7b241c' }), gen = P(g, C.gen), gd = P(g, C.jing), gd2 = P(g, C.jing);
  const rs = [0, 1, 2].map(i => H(g, { coat: ['#8b5a2b', '#6b4a2a', '#a0703c'][i], blanket: '#c0392b', rider: i % 2 ? C.mon : C.mon2 })), ar = [0, 1, 2, 3, 4].map(() => mk(g, arrowMk, { opacity: 0 })), tk = mk(g, '<text class="t big" font-size="56" style="stroke-width:9">tink</text>', { opacity: 0 });
  const cat = catG(g), tw = towerG(g), e1 = P(g, Object.assign({}, C.eng1, { holdR: hamMk })), e2 = P(g, Object.assign({}, C.eng2, { holdR: hamMk })), gm = P(g, C.mon), sp = poof(g);
  const bulb = mk(g, '<circle r="46" fill="#ffd84a" stroke="#1a1a1a" stroke-width="6"/><rect x="-16" y="40" width="32" height="22" fill="#999" stroke="#1a1a1a" stroke-width="5"/><path d="M-16 -10 L0 14 L16 -10" stroke="#1a1a1a" stroke-width="6" fill="none"/>', { opacity: 0 });
  const t1 = tagG(u, 'NO WAY IN', 70, { fill: '#7b241c' }), t2 = tagG(u, 'CHINESE ENGINEERS', 62, { fill: '#1a5276' });
  const q = mk(g, '<text class="t big" font-size="110" style="stroke-width:14">?</text>', { opacity: 0 });
  return lt => {
    sc(lt); const t19 = L(19), r18 = lt < t19 - .1;
    ct.set(1520, 800, 1.3); ct.flag('#2874a6');
    stand(gd, 1360, 640, .55, -1, 'n'); stand(gd2, 1650, 640, .55, -1, 'n');
    // line 18
    rs.forEach((h, i) => { const ph = ((lt - i * .55) % 2.2 + 2.2) % 2.2, x = ph < 1.2 ? lerp(300, 900, easeOut(ph / 1.2)) : lerp(900, 300, easeIO((ph - 1.2) / 1)), mv = r18; vis(h.g, r18); ride(h, lt, x, 900 + i * 30, .9, ph < 1.2 ? 1 : -1, mv, 26); h.rider.face(ph < 1.2 ? 'd' : 'f'); });
    ar.forEach((a, i) => { const per = 1.0, ph = ((lt - .2 - i * .2) % per + per) % per / per; a.setAttribute('opacity', r18 && lt > .3 ? (ph < .8 ? 1 : 0) : 0); setT(a, lerp(900, 1230, ph / .8), lerp(780, 690, ph / .8) - Math.sin(Math.PI * ph / .8) * 70, -14, 1.0); });
    show(tk, lt, 1.0, 1130, 600, -10, 1.8); show(t1, lt, .3, 960, 200, -2, t19 - .2);
    vis(gen.g, 1); stand(gen, 380, 960, 1.05, 1, lt < t19 - .1 ? (lt < 1.8 ? 'a' : 'k') : (lt < t19 + 1.2 ? 'k' : 'd'), 0); gen.mark('?', lt, 1.7, t19 - .2);
    show(bulb, lt, t19 + .15, 400, 420, 0, t19 + 1.5, 1.1);
    // line 19: engineers build
    const bk = lin(lt, t19 + .8, t19 + 4.6), on = lt > t19 + .3;
    vis(e1.g, on); vis(e2.g, on); vis(gm.g, on); vis(cat.g, on && lt > t19 + .8); vis(tw.g, on && lt > t19 + 1.0);
    const ex = lerp(-100, 650, easeOut(lin(lt, t19 + .3, t19 + 1.6)));
    walkP(e1, lt, ex, 950, 1, 1, 'n'); e1.arm('R', -80 + 60 * Math.sin(lt * 9)); walkP(e2, lt, ex + 150, 950, 1, 1, 'n'); e2.arm('R', -50 + 60 * Math.sin(lt * 9 + 2));
    if (lt > t19 + 1.6) { stand(e1, 650, 950, 1, 1, 's'); e1.arm('R', -80 + 60 * Math.sin(lt * 9)); stand(e2, 800, 950, 1, 1, 'd'); e2.arm('R', -50 + 60 * Math.sin(lt * 9 + 2)); }
    stand(gm, 450, 960, 1, 1, 'n'); gm.arm('L', 120);
    cat.set(1000, 940, .95, 40); tw.set(1250, 950, 1, .15 + .85 * easeOut(bk)); cat.g.setAttribute('opacity', pop(lt, t19 + .8) > 0 ? 1 : 0);
    if (on) { cat.g.setAttribute('transform', `translate(1000 940) scale(${.95 * (.4 + .6 * easeOut(bk))})`); }
    show(t2, lt, t19 + .4, 960, 190, -2, t19 + 3.4); show(sp, lt, t19 + 2.6, 1120, 800, 0, t19 + 3.2, .8);
    vis(q, 0);
  };
});
// ===== 20: Zhongdu falls, today Beijing; red spreads =====
S(20, 20, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', clouds: 3, sun: [1500, 170] }), ct = cityG(g, { wall: '#c9a56a', roof: '#7b241c' }), y = yearG(u);
  const cats = [0, 1].map(() => catG(g)), rk = [0, 1, 2].map(() => mk(g, '<circle r="20" fill="#8c8c8c" stroke="#1a1a1a" stroke-width="5"/>', { opacity: 0 })), tw = towerG(g);
  const deb = Array.from({ length: 12 }, () => mk(g, `<rect x="-14" y="-14" width="28" height="28" fill="#c9a56a" stroke="#1a1a1a" stroke-width="4"/>`, { opacity: 0 })), pf = [0, 1, 2].map(() => poof(g));
  const ml = el('g', { display: 'none' }, g), m = mapG3(ml), P0 = G3.pts; m.mon(RED); ['song', 'jin', 'xia'].forEach(k => m.zone(k, k === 'song' ? .55 : .85));
  const zl = m.label('ZHONGDU', P0.zhongdu, 38, { dy: -40 }), td = tagG(u, 'TODAY: BEIJING', 86, OR), gp = portrait(g, C.gen, 0, 0, 62, RED);
  const dot = m.dot(P0.zhongdu, ''), ra = arrowG(m.top);
  return lt => {
    sc(lt); const lm = lt > 2.5; ml.setAttribute('display', lm ? 'inline' : 'none');
    y(lt, .1, lt < 2.5 ? '1215' : '1215');
    // siege (before map)
    const hits = [.6, 1.15, 1.7];
    ct.set(1530, 840, 1.25); ct.flag(lt > 2.0 ? RED : '#2874a6', 1); vis(ct.g, !lm);
    cats.forEach((c, i) => { const f = ((lt - i * .3) % 1.1 + 1.1) % 1.1; c.set(430 + i * 250, 960 - i * 20, .9, f < .3 ? lerp(40, -55, easeOut(f / .3)) : lerp(-55, 40, lin(f, .3, 1.1))); vis(c.g, !lm); });
    rk.forEach((r, i) => { const f = ((lt - .2 - i * .35) % 1.05 + 1.05) % 1.05; r.setAttribute('opacity', !lm && f < .6 ? 1 : 0); setT(r, lerp(600 + (i % 2) * 250, 1380, f / .6), lerp(780, 580, f / .6) - Math.sin(Math.PI * f / .6) * 380, f * 240, 1); });
    tw.set(1020, 950, 1, 1); vis(tw.g, !lm);
    deb.forEach((d, i) => { const h = hits[i % 3], a = lt - h - (i % 2) * .05; const on = a > 0 && a < 1.0 && !lm && i < 9; d.setAttribute('opacity', on ? 1 : 0); setT(d, 1330 + (i % 3) * 40 + a * (80 + i * 25), 620 + (i % 3) * 30 + 500 * a * a * .8 - 280 * a, a * 400, 1); });
    pf.forEach((p, i) => show(p, lt, hits[i] + .15, 1350, 700, 0, hits[i] + .7, 1.2));
    // map part
    if (lm) {
      m.cam(1440, 485, 4.4 + (lt - 2.5) * .03);
      m.red('jin', easeIO(lin(lt, 3.0, 4.7)) * 260); show(zl, lt, 2.6, 0, 0); zl.setAttribute('opacity', lin(lt, 2.6, 3.0));
      show(td, lt, 3.0, 960, 880, -2, 1e9, 1, true); const p = m.S(P0.zhongdu); setT(gp.g, p[0] + 0, p[1] - 160, 0, pop(lt, 3.2)); gp.pp.face('h');
      arrowSet(ra, m.S([1350, 430]), m.S([1470, 490]), lin(lt, 2.6, 3.3), 20, '#e2362b');
    } else { td.setAttribute('opacity', 0); gp.g.setAttribute('transform', 'scale(0)'); }
  };
});
// ===== 21: the worst decision =====
S(21, 21, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#12060a' }, g);
  const rays = mk(g, Array.from({ length: 12 }, (_, i) => `<path d="M0 0 L${Math.cos(i / 12 * 6.283) * 1800} ${Math.sin(i / 12 * 6.283) * 1800} L${Math.cos((i + .5) / 12 * 6.283) * 1800} ${Math.sin((i + .5) / 12 * 6.283) * 1800} Z" fill="#b01212" opacity=".22"/>`).join(''));
  const t1 = bigG(u, 'THE WORST DECISION', 150, { fill: '#ffd0c8' }), t2 = bigG(u, 'IN HISTORY', 210, { fill: '#ff5a4a' }), tk = tickG(g);
  return lt => { setT(rays, 960, 520, -lt * 5, 1); show(t1, lt, .15, 960, 330 + 4 * Math.sin(lt * 30), -1.5, 1e9, 1, true); show(t2, lt, .65, 960, 590, 1.5, 1e9, 1, true); tickAt(tk, 330, 1090, .36, pop(lt, 1.0)); };
});
//@@PART4
