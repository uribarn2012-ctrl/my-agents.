// ===== 27: the Great Taboo around Burkhan Khaldun =====
const mountMk = '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><path d="M-190 0 L-70 -180 L0 -96 L76 -240 L210 0 Z" fill="#7d8a7a"/><path d="M76 -240 L34 -166 L64 -182 L84 -152 L116 -174 Z" fill="#fff"/><path d="M-70 -180 L-108 -116 L-80 -128 L-58 -106 L-40 -134 Z" fill="#fff"/><path d="M-190 0 L-120 -60 L-60 0 Z M60 0 L130 -70 L210 0 Z" fill="#6a7868" stroke-width="4"/></g>';
S(27, 27, (g, u, L) => {
  const m = mapG3(g), P0 = G3.pts; m.mon(ORG); m.zone('song', 0);
  const ring = mk(u, '<ellipse rx="560" ry="250" fill="#e2362b" fill-opacity=".12"/><ellipse rx="560" ry="250" fill="none" stroke="#1a1a1a" stroke-width="16"/><ellipse class="rr" rx="560" ry="250" pathLength="100" fill="none" stroke="#e2362b" stroke-width="9"/>', { opacity: 0 }), rr = ring.querySelector('.rr');
  const mt = mk(u, mountMk, { opacity: 0 }), gd = [20, 75, 130, 185, 235, 300].map(a => P(u, Object.assign({}, C.guard, { holdR: `<g transform="rotate(-88) scale(.8)">${spearMk}</g>` }))), nm = [C.nomM, C.nomW, C.beg].map(c => P(u, c));
  const tm = tagG(u, 'BURKHAN KHALDUN', 46, { fill: '#1d4f8f' }), tg = bigG(u, 'GREAT TABOO', 128), ts = tagG(u, 'CLOSED OFF FOR CENTURIES', 50, { fill: '#7d1f1f' }), tf = stampG(u, 'F'), tx = [0, 1, 2].map(() => mk(u, xMark, { opacity: 0 })), tsc = tagG(u, 'SACRED MOUNTAIN', 50, OR);
  return lt => {
    const z = easeIO(lin(lt, .4, 3.6)); m.cam(lerp(1335, P0.burkhan[0], z), lerp(404, P0.burkhan[1], z), lerp(4.2, 13, z));
    const c = [960, 640], mk2 = pop(lt, 3.0, .5); setT(mt, 960, 650, 0, 1.0 * mk2); mt.setAttribute('opacity', mk2 > .02 ? 1 : 0); show(tm, lt, 3.1, 960, 760, 0); show(tsc, lt, 2.4, 960, 120, -1, 4.6);
    const rv = easeIO(lin(lt, 4.4, 5.8)); setT(ring, 960, 700, 0, 1); ring.setAttribute('opacity', rv > .01 ? 1 : 0); rr.setAttribute('stroke-dasharray', `${(100 * rv).toFixed(1)} 100`);
    gd.forEach((p, i) => { const a = [20, 75, 130, 185, 235, 300][i] * Math.PI / 180, x = 960 + 560 * Math.cos(a), y = 700 + 250 * Math.sin(a), k = pop(lt, 5.2 + i * .15, .3); stand(p, x, y + 24, .62 * k, i < 3 ? -1 : 1, 'd'); p.arm('R', -4); p.g.setAttribute('opacity', k > .02 ? 1 : 0); });
    show(ts, lt, 6.0, 960, 120, -1, 1e9); show(tg, lt, 7.0, 960, 300, -3, 1e9, 1, true); stampShow(tf, lt, 7.6, 1620, 190, 4);
    nm.forEach((p, i) => { const t0 = 7.4 + i * .5, w = lin(lt, t0, t0 + 1.2), bk = lin(lt, t0 + 1.7, t0 + 2.6), x = lerp(-200, 330 - i * 60, easeOut(w)) - bk * 500, mv = (w > 0 && w < 1) || bk > 0;
      if (mv) walkP(p, lt + i, x, 930 - i * 20, .6, bk > 0 ? -1 : 1, bk > 0 ? 'f' : 'n'); else stand(p, x, 930 - i * 20, .6, 1, 'o'); p.g.setAttribute('opacity', lt > t0 ? 1 : 0); p.mark('!', lt, t0 + 1.2, t0 + 2.0);
      const kx = pop(lt, t0 + 1.4, .3) * (1 - lin(lt, t0 + 2.4, t0 + 2.8)); setT(tx[i], 440, 700 - i * 20, 0, .7 * kx); tx[i].setAttribute('opacity', kx > .02 ? 1 : 0); });
  };
});

// ===== 28: satellite + drone find nothing =====
const satMk = '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"><rect x="-34" y="-26" width="68" height="52" rx="8" fill="#c9d1d8"/><rect x="-150" y="-18" width="104" height="36" fill="#2f63c9"/><rect x="46" y="-18" width="104" height="36" fill="#2f63c9"/><path d="M-120 -18 V18 M-90 -18 V18 M-62 -18 V18 M64 -18 V18 M94 -18 V18 M124 -18 V18" stroke-width="3"/><circle cy="34" r="14" fill="#e67e22"/></g>';
const droneMk = '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"><ellipse rx="34" ry="16" fill="#3a4658"/><circle cy="16" r="9" fill="#e2362b"/><path d="M-30 -6 L-62 -24 M30 -6 L62 -24" stroke-width="7"/><ellipse class="r1" cx="-62" cy="-28" rx="30" ry="5" fill="#cfd8dc"/><ellipse class="r2" cx="62" cy="-28" rx="30" ry="5" fill="#cfd8dc"/></g>';
S(28, 28, (g, u, L) => {
  hillScene(g, {}); const sat = mk(g, satMk), bm = mk(g, '<path d="M0 0 L-250 760 L250 760Z" fill="#fff" opacity=".22"/>'), dr = mk(g, droneMk), db = mk(g, '<path d="M0 10 L-90 160 L90 160Z" fill="#ffe27a" opacity=".35"/>'), nt = ptw(u, 'NOTHING.', 200, { sw: 16 }), gr = mk(g, '<g stroke="#fff" stroke-width="2" opacity=".35" fill="none">' + [...Array(8)].map((_, i) => `<path d="M${480 + i * 130} 700 L${380 + i * 170} 1000"/>`).join('') + '<path d="M300 800 H1620 M260 900 H1660" /></g>');
  const sc = mk(u, '<circle r="150" fill="none" stroke="#fff" stroke-width="10" opacity=".8"/><path d="M106 106 L190 190" stroke="#fff" stroke-width="22" stroke-linecap="round"/><text class="t" y="22" text-anchor="middle" font-size="70" fill="#fff" opacity=".8">?</text>', { opacity: 0 });
  return lt => {
    const sx = lerp(520, 1400, easeIO(lin(lt, .2, 3.4))), sw = Math.sin(lt * 2.2); setT(sat, sx, 130 + 8 * Math.sin(lt * 2), 8, .9 * pop(lt, .1, .4)); setT(bm, sx, 150, 0, 1); bm.setAttribute('transform', `translate(${sx} 150) rotate(${(sw * 9).toFixed(2)})`);
    const dx = lerp(-100, 2000, lin(lt, .4, 3.6)), dy = 650 + 40 * Math.sin(lt * 4); setT(dr, dx, dy, 0, 1.0); setT(db, dx, dy, 0, 1); dr.querySelector('.r1').setAttribute('rx', 30 * Math.abs(Math.sin(lt * 40)) + 4); dr.querySelector('.r2').setAttribute('rx', 30 * Math.abs(Math.cos(lt * 40)) + 4);
    gr.setAttribute('opacity', lt > .6 ? 1 : 0); setT(sc, lerp(500, 1400, lin(lt, 1, 3.4)), 820, 0, pop(lt, 1, .3) * (1 - lin(lt, 3.0, 3.3))); sc.setAttribute('opacity', lt > 1 && lt < 3.3 ? 1 : 0);
    show(nt, lt, 3.3, 960, 460, -2, 1e9, 1, true);
  };
});

// ===== 29: modern Mongolians want it left alone; the storm =====
S(29, 29, (g, u, L) => {
  hillScene(g, {}); const a = P(g, C.modM), b = P(g, C.modW), c = P(g, C.modK), sq = speech(u, 'LEAVE IT ALONE', 60, 320);
  const dark = el('rect', { x: -100, y: -100, width: 2120, height: 1300, fill: '#10141f', opacity: 0 }, g), fl = el('rect', { x: -100, y: -100, width: 2120, height: 1300, fill: '#fff', opacity: 0 }, g);
  const bolt = mk(g, '<path d="M0 -240 L-60 -40 L-10 -40 L-50 200 L70 -70 L10 -70 L50 -240 Z" fill="#fff6a0" stroke="#1a1a1a" stroke-width="7" stroke-linejoin="round"/>', { opacity: 0 }), cl = mk(g, '<g fill="#3a3f52" stroke="#1a1a1a" stroke-width="6"><ellipse cx="0" cy="0" rx="230" ry="62"/><ellipse cx="90" cy="-44" rx="130" ry="64"/><ellipse cx="-100" cy="-30" rx="110" ry="54"/></g>', { opacity: 0 });
  const sh = mk(g, '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"><path d="M-10 -200 V50" stroke-width="16" stroke="#6b3e1b"/><path d="M-70 50 H50 L30 140 H-50Z" fill="#9aa5ad"/><rect x="-36" y="-216" width="52" height="16" rx="6" fill="#6b3e1b"/></g>' + xMark.replace(/-40/g, '-70').replace(/40/g, '70'), { opacity: 0 }), tg = tagG(u, 'BELIEVED TO BRING DISASTER', 56, { fill: '#7d1f1f' });
  return lt => {
    [[a, 520, 1.5], [b, 820, 1.45], [c, 1040, 1.2]].forEach(([p, x, sc], i) => { const k = pop(lt, .1 + i * .2, .35); stand(p, x, 990, sc * k, 1, lt > 3.7 ? 'f' : (Math.sin(lt * 6 + i) > 0 ? 'd' : 'k')); p.tilt(12 * Math.sin(lt * 7 + i * 2) * (lt < 3.7 ? 1 : 0)); p.arm('R', -20 + 15 * Math.sin(lt * 4 + i)); p.arm('L', 20); if (lt > 3.9) p.mark('!', lt, 3.9, 6.5); });
    show(sq, lt, .8, 760, 330, 0, 3.4);
    const dv = easeIO(lin(lt, 3.5, 4.5)); dark.setAttribute('opacity', (.5 * dv).toFixed(2)); setT(cl, 1330, 230 + 10 * Math.sin(lt * 2), 0, 1.4 * pop(lt, 3.6, .5)); cl.setAttribute('opacity', lt > 3.6 ? 1 : 0);
    const f1 = Math.max(0, 1 - Math.abs(lt - 4.35) * 9), f2 = Math.max(0, 1 - Math.abs(lt - 5.5) * 7); fl.setAttribute('opacity', (.55 * Math.max(f1, f2)).toFixed(2));
    const bv = (lt > 4.25 && lt < 4.7) || (lt > 5.4 && lt < 5.75); bolt.setAttribute('opacity', bv ? 1 : 0); setT(bolt, 1330, 480, 0, 1.2);
    setT(sh, 1330, 800, 0, pop(lt, 4.0, .4)); sh.setAttribute('opacity', lt > 4.0 ? 1 : 0); show(tg, lt, 4.0, 1230, 960, -1);
  };
});

// ===== 30: the quiet hill =====
S(30, 30, (g, u, L) => {
  const w = el('g', {}, g); const sc = hillScene(w, { sky: 'dawn', hill: HDAWN, sun: [1420, 520], sunC: '#fff0c2', clouds: 4, cloudO: .5, cloudC: '#fff1d8', wind: 1 }); const b = birdG(w), gl = el('rect', { x: -100, y: -100, width: 2120, height: 1300, fill: '#ffd89a', opacity: 0 }, g);
  return lt => {
    const z = lerp(1.14, 1.0, easeIO(lin(lt, 0, 5.7))); w.setAttribute('transform', `translate(960 700) scale(${z.toFixed(4)}) translate(-960 -700)`); flap(b, lt, 1700 - lt * 90, 330 + 14 * Math.sin(lt * .8), .9);
    gl.setAttribute('opacity', (.2 * lin(lt, 0, 5.5)).toFixed(3));
  };
});

// ===== 31: Tick, the watch and the end screen =====
S(31, 31, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#1b2b4d' }, g); mk(g, '<circle cx="1330" cy="480" r="760" fill="#ff6a00" opacity=".1"/><circle cx="1330" cy="480" r="480" fill="#ff6a00" opacity=".1"/>');
  const tk = tickG(g), glow = mk(g, '<circle r="470" fill="url(#gHalo)"/>', { opacity: 0 });
  const wt = mk(g, `<g stroke="#1a1a1a" stroke-linecap="round"><circle cx="0" cy="-292" r="34" fill="none" stroke-width="14"/><rect x="-30" y="-275" width="60" height="38" rx="8" fill="#ffd84a" stroke-width="12"/><circle r="252" fill="#ffd84a" stroke-width="16"/><circle r="200" fill="#fffbe8" stroke-width="8"/>${[...Array(12)].map((_, i) => `<line x1="0" y1="-${i % 3 ? 150 : 132}" x2="0" y2="-182" stroke-width="${i % 3 ? 7 : 12}" transform="rotate(${i * 30})"/>`).join('')}<g class="hh"><line x1="0" y1="10" x2="0" y2="-108" stroke-width="20"/></g><g class="mh"><line x1="0" y1="14" x2="0" y2="-162" stroke-width="12"/></g><circle r="18" fill="#1a1a1a"/></g>`, { opacity: 0 });
  const bub = mk(u, '<path d="M-250 -90 Q-250 -150 -190 -150 H190 Q250 -150 250 -90 V50 Q250 110 190 110 H-60 L-150 190 L-130 110 H-190 Q-250 110 -250 50 Z" fill="#fff" stroke="#1a1a1a" stroke-width="8" stroke-linejoin="round"/><text class="t" y="-16" text-anchor="middle" font-size="76" fill="#1a1a1a">YOU PICK!</text><text class="t" y="64" text-anchor="middle" font-size="34" fill="#ff6a00">TELL ME IN THE COMMENTS</text>', { opacity: 0 });
  const cm = [0, 1, 2].map(i => mk(u, `<g stroke="#1a1a1a" stroke-width="5"><rect x="-190" y="-44" width="380" height="88" rx="14" fill="#fff"/><circle cx="-142" cy="0" r="26" fill="${['#e86aa0', '#6ec6ff', '#a3e635'][i]}"/><rect x="-100" y="-24" width="${[250, 200, 280][i]}" height="14" rx="7" fill="#c9d1d8" stroke-width="2"/><rect x="-100" y="4" width="${[170, 240, 130][i]}" height="14" rx="7" fill="#c9d1d8" stroke-width="2"/></g>`, { opacity: 0 }));
  const org = el('circle', { cx: 1560, cy: 600, r: 0, fill: '#ff8a1f', opacity: 0 }, u), wh = el('rect', { width: 1920, height: 1080, fill: '#fff', opacity: 0 }, u), img = el('image', { href: window.ENDIMG, x: 0, y: 0, width: 1920, height: 1080, opacity: 0 }, u);
  return (lt, fr, d) => {
    tickAt(tk, 560, 1100, .92, pop(lt, .1, .4));
    const k = pop(lt, .5, .4), sp = lt * 120 + 160 * lt * lt; setT(wt, 1560, 600 + 8 * Math.sin(lt * 3), 4 * Math.sin(lt * 2), .85 * k); wt.setAttribute('opacity', k > .02 ? 1 : 0);
    wt.querySelector('.mh').setAttribute('transform', `rotate(${(sp * 6).toFixed(1)})`); wt.querySelector('.hh').setAttribute('transform', `rotate(${(sp * .5).toFixed(1)})`);
    const gv = easeIO(lin(lt, .6, 3.4)); setT(glow, 1560, 600, 0, .6 + .8 * gv); glow.setAttribute('opacity', (.9 * gv + .1 * Math.sin(lt * 12) * gv).toFixed(2));
    setT(bub, 1180, 190, -2, .85 * pop(lt, 1.2, .45)); bub.setAttribute('opacity', lt > 1.2 ? 1 : 0);
    cm.forEach((c, i) => { const t0 = 2.0 + i * .45, kk = pop(lt, t0, .4); setT(c, 940 + i * 320, 960 - 10 * Math.sin(lt * 2 + i), (i - 1) * 3, .8 * kk); c.setAttribute('opacity', kk > .02 ? 1 : 0); });
    const ov = easeIO(lin(lt, 3.0, 4.2)); org.setAttribute('r', (2400 * ov).toFixed(0)); org.setAttribute('opacity', ov > 0 ? 1 : 0);
    wh.setAttribute('opacity', easeIO(lin(lt, 3.8, 4.7)).toFixed(3));
    img.setAttribute('opacity', easeIO(lin(lt, d - 5.5, d - 4.4)).toFixed(3));
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
  $('black').setAttribute('opacity', (1 - lin(t, 0, .5)).toFixed(3));
};
