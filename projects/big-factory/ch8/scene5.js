// ===== 16-17: Mongolia today =====
const flagMk = '<g stroke="#1a1a1a" stroke-width="5"><rect x="-90" y="-60" width="60" height="120" fill="#d62d20"/><rect x="-30" y="-60" width="60" height="120" fill="#1f5fbf"/><rect x="30" y="-60" width="60" height="120" fill="#d62d20"/><circle cx="-60" cy="-14" r="14" fill="#ffd84a" stroke-width="3"/><rect x="-66" y="2" width="12" height="30" fill="#ffd84a" stroke-width="3"/></g>';
S(16, 17, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), P0 = G3.pts, l17 = L(17); m.mon(ORG); m.zone('song', 0);
  const ml = mlab(m, [P0.mongolia[0] - 6, P0.mongolia[1] - 4], 'MONGOLIA', 60, '#111'), fl = mk(u, flagMk, { opacity: 0 }), tg = tagG(u, 'INDEPENDENT COUNTRY', 58, OR), gp = portrait(u, C.gen, 0, 0, 130, '#f1c40f'), th = tagG(u, 'NATIONAL HERO', 54, { fill: '#a67c00' }), q = bigG(u, '?', 220);
  return lt => {
    const z = easeIO(lin(lt, 0, 5)); m.cam(lerp(1250, 1335, z), lerp(430, 404, z), lerp(2.6, 4.6, z)); y(lt, .1, 'TODAY'); show(q, lt, .2, 960, 560, 6, l17);
    setT(ml, 0, 0, 0, pop(lt, l17 + .3, .4)); show(tg, lt, l17 + 1.2, 960, 930, -1); setT(fl, 1640, 400, 4, 1.25 * pop(lt, l17 + 1.0, .4)); fl.setAttribute('opacity', lt > l17 + 1.0 ? 1 : 0);
    setT(gp.g, 300, 440 + bobY(lt, 0, 6), 0, pop(lt, l17 + 2.2, .4)); gp.g.setAttribute('opacity', lt > l17 + 2.2 ? 1 : 0); show(th, lt, l17 + 2.5, 300, 640, -2);
  };
});

// ===== 18: banknote + airport =====
const planeMk = '<g stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"><path d="M-80 0 Q-40 -26 90 -8 Q120 0 90 8 Q-40 26 -80 0Z" fill="#fff"/><path d="M-10 -4 L-50 -70 L-30 -70 L30 -6Z" fill="#dfe6ec"/><path d="M-10 4 L-50 70 L-30 70 L30 6Z" fill="#dfe6ec"/><path d="M-70 -4 L-96 -36 L-80 -36 L-50 -4Z" fill="#dfe6ec"/></g>';
S(18, 18, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#2b4f7a' }, g); mk(g, '<circle cx="960" cy="540" r="800" fill="#fff" opacity=".07"/><circle cx="960" cy="540" r="500" fill="#fff" opacity=".07"/><path d="M-100 930 L2100 930 L2100 1200 L-100 1200Z" fill="#3a4658"/><path d="M0 1010 H1920" stroke="#f1c40f" stroke-width="8" stroke-dasharray="70 50"/>');
  const note = mk(u, `<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="-330" y="-190" width="660" height="380" rx="22" fill="#2f9e8f"/><rect x="-306" y="-166" width="612" height="332" rx="12" fill="#7ad3c3" stroke-width="3"/><g fill="none" stroke="#1f6f64" stroke-width="3">${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="170" cy="0" r="${30 + i * 18}"/>`).join('')}</g><rect x="140" y="-130" width="150" height="26" rx="6" fill="#fdfefe" stroke-width="3"/><rect x="140" y="-92" width="100" height="14" rx="6" fill="#fdfefe" stroke-width="3"/><rect x="160" y="96" width="120" height="30" rx="8" fill="#f1c40f" stroke-width="4"/></g>`, { opacity: 0 });
  const np = portrait(note, C.gen, -120, 0, 122, '#1f6f64'), shine = mk(note, '<path d="M-60 -190 L10 -190 L-80 190 L-150 190Z" fill="#fff" opacity=".35"/>');
  const sign = mk(u, '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="-300" y="60" width="26" height="240" fill="#6b7a88"/><rect x="274" y="60" width="26" height="240" fill="#6b7a88"/><rect x="-420" y="-120" width="840" height="230" rx="22" fill="#1f5fbf"/><rect x="-396" y="-98" width="792" height="186" rx="12" fill="none" stroke="#fff" stroke-width="5"/></g><text class="t" y="-12" text-anchor="middle" font-size="86" fill="#fff">CHINGGIS KHAAN</text><text class="t" y="60" text-anchor="middle" font-size="54" fill="#ffd84a">INTERNATIONAL AIRPORT</text>', { opacity: 0 }), pl = mk(u, planeMk);
  return lt => {
    const k = pop(lt, .2, .45), sw = easeIO(lin(lt, .7, 1.6)); setT(note, 520, 520 + bobY(lt, 0, 7), -6 + 2 * Math.sin(lt * 2), 1.15 * k); note.setAttribute('opacity', k > .02 ? 1 : 0); setT(shine, 480 * sw - 240, 0, 0, 1);
    const k2 = pop(lt, 1.8, .45); setT(sign, 1390, 520, 2, .95 * k2); sign.setAttribute('opacity', k2 > .02 ? 1 : 0);
    const pp = lin(lt, 1.9, 3.7); setT(pl, lerp(-150, 2100, pp), lerp(300, 170, pp) - 40 * Math.sin(pp * 3), -8, 1.1); pl.setAttribute('opacity', pp > 0 && pp < 1 ? 1 : 0);
  };
});

// ===== 19: the giant statue =====
S(19, 19, (g, u, L) => {
  hillScene(g, { sky: 'day', hill: HD, h: 700, grassC: '#6f8a3c', cloudC: '#fff', cloudO: .85, wind: 0, clouds: 4 });
  const ped = mk(g, '<g stroke="#1a1a1a" stroke-width="6" stroke-linejoin="round"><rect x="-300" y="-190" width="600" height="190" fill="#b8a98f"/><rect x="-330" y="-30" width="660" height="30" fill="#a39378"/><rect x="-300" y="-205" width="600" height="20" fill="#cdbfa6"/>' + [-240, -120, 0, 120, 240].map(x => `<rect x="${x - 22}" y="-175" width="44" height="145" fill="#d6c9b0" stroke-width="4"/>`).join('') + '</g>');
  const hs = H(g, { coat: '#c8d0d8', mane: '#8d99a6', blanket: '#aab4be', rider: C.silv }); hs.rider.skin('#c9d1d8');
  const sparks = [0, 1, 2, 3, 4, 5, 6].map(() => mk(g, sparkMk)), gl = mk(g, '<ellipse cx="0" cy="-330" rx="360" ry="330" fill="url(#gHalo)"/>', { opacity: 0 }), tiny = P(g, C.nomM);
  const dim = mk(u, '<g stroke="#1a1a1a" stroke-width="12" stroke-linecap="round"><path d="M0 -300 V300"/><path d="M-30 -300 H30 M-30 300 H30"/></g><g stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M0 -300 V300"/><path d="M-30 -300 H30 M-30 300 H30"/></g>', { opacity: 0 }), t40 = bigG(u, '40 m', 120), ar = mk(u, '<path d="M0 -60 V-14 M-16 -30 L0 -12 L16 -30" stroke="#e2362b" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/>');
  const tag = tagG(u, 'STEEL STATUE OF GENGHIS KHAN', 50, OR);
  return lt => {
    const k = pop(lt, .1, .6), SC = 1.0; ped.setAttribute('transform', `translate(760 930) scale(${(.8 * k).toFixed(3)})`);
    ride(hs, 0, 760, 930 - 205 * .8 * k, 1.6 * k, 1, false); hs.rider.place(-8, -182 + 100, 1, 1, 0, 0);
    gl.setAttribute('transform', `translate(760 ${(930 - 400).toFixed(0)}) scale(1.6)`); gl.setAttribute('opacity', (.4 + .2 * Math.sin(lt * 2)) * k);
    sparks.forEach((s, i) => { const on = Math.max(0, Math.sin(lt * 3.2 + i * 1.7)); setT(s, 760 + [-190, 120, 250, -90, 40, 330, -300][i], 930 - [560, 700, 520, 840, 470, 330, 400][i], 0, 1.0 * on * (lt > 1.2 ? 1 : 0)); s.setAttribute('opacity', lt > 1.2 ? on : 0); });
    const w = easeOut(lin(lt, 2.0, 3.4)); tiny.place(lerp(1180, 1060, w), 930, .105, -1, 0, 0); tiny.walk(lt, 9, 24, w < 1 && w > 0); tiny.face('f'); tiny.g.setAttribute('opacity', lt > 1.8 ? 1 : 0);
    setT(ar, 1060, 860 + 6 * Math.sin(lt * 5), 0, pop(lt, 3.4, .3)); ar.setAttribute('opacity', lt > 3.4 ? 1 : 0);
    setT(dim, 1330, 545, 0, 1, 1.28 * easeOut(lin(lt, 1.2, 2.0))); dim.setAttribute('opacity', lt > 1.2 ? 1 : 0); show(t40, lt, 1.8, 1500, 560, -3); show(tag, lt, .5, 960, 60, -1);
  };
});

// ===== 20-21: 1 in 200 + Tick checks his hand =====
S(20, 21, (g, u, L) => {
  el('rect', { width: 1920, height: 1080, fill: '#1b2b4d' }, g); mk(g, '<circle cx="800" cy="540" r="800" fill="#ff6a00" opacity=".1"/><circle cx="800" cy="540" r="500" fill="#ff6a00" opacity=".1"/>');
  const l21 = L(21), COL = ['#e86aa0', '#6ec6ff', '#a3e635', '#ffb347', '#b39ddb'], figs = [], GX = 9, GY = 4;
  for (let i = 0; i < 200; i++) { const c = i % 20, r = Math.floor(i / 20), hi = c === GX && r === GY; figs.push({ g: mk(u, stick(hi ? '#ffd84a' : COL[(i * 7) % 5]), { opacity: 0 }), x: 268 + c * 56, y: 270 + r * 46, c, r, hi }); }
  const hlo = mk(u, '<circle r="46" fill="url(#gHalo)"/>', { opacity: 0 }), ts = tagG(u, '2003 STUDY', 62, { fill: '#7d3c98' }), t1 = bigG(u, '1 IN 200 MEN', 108), ty = tagG(u, 'SAME Y-CHROMOSOME', 48, { fill: '#0f6b5c' }), gp = portrait(u, C.gen, 0, 0, 105, '#f1c40f'), tgp = tagG(u, "GENGHIS KHAN'S FAMILY", 42, { fill: '#a67c00' }), ar = arrowG(u);
  const fw = mk(u, '', {}), fg = mk(u, STAMP_F, { opacity: 0 }), fz = mk(u, '', {}); fw.appendChild(fg); const tFact = tagG(u, 'Published in a scientific journal in 2003', 36, OR), tm = tagG(u, 'MILLIONS OF MEN ALIVE TODAY', 54, { fill: '#c0392b' });
  const tk = mk(u, window.TICK_FP_SVG, { opacity: 0 }), hand = mk(tk, '<g transform="translate(0 -953)" stroke="#1a1a1a" stroke-linejoin="round" stroke-linecap="round"><path d="M140 200 Q300 220 230 70" fill="none" stroke="#1a1a1a" stroke-width="84"/><path d="M140 200 Q300 220 230 70" fill="none" stroke="#7a4a2a" stroke-width="64"/><g transform="translate(215 50) scale(1.3)"><rect x="-44" y="-34" width="88" height="90" rx="30" fill="#f2c9a0" stroke-width="10"/>' + [-34, -12, 10, 32].map(x => `<rect x="${x - 9}" y="-86" width="18" height="62" rx="9" fill="#f2c9a0" stroke-width="8"/>`).join('') + '<path d="M-48 10 Q-76 -20 -52 -46" fill="none" stroke="#1a1a1a" stroke-width="22"/><path d="M-48 10 Q-76 -20 -52 -46" fill="none" stroke="#f2c9a0" stroke-width="10"/></g></g>');
  const sw = mk(u, sweatDrop, { opacity: 0 });
  return lt => {
    show(ts, lt, .3, 960, 110, -2);
    figs.forEach(f => { const k = pop(lt, 1.0 + f.r * .28 + f.c * .015, .3); setT(f.g, f.x, f.y, 0, 1.15 * (f.hi && lt > 4.4 ? 1.9 : 1) * k); f.g.setAttribute('opacity', k > .02 ? (lt > 4.4 && !f.hi ? .45 : 1) : 0); });
    const hv = pop(lt, 4.4, .4); setT(hlo, 268 + GX * 56, 270 + GY * 46 - 24, 0, 2.1 * hv); hlo.setAttribute('opacity', lt > 4.4 ? .9 : 0);
    show(t1, lt, 4.6, 800, 740, -2, 1e9, 1, true); show(ty, lt, 6.6, 800, 830, 1); show(tgp, lt, 8.0, 1560, 330, 1);
    setT(gp.g, 1560, 200, 0, pop(lt, 7.9, .4)); gp.g.setAttribute('opacity', lt > 7.9 ? 1 : 0);
    arrowSet(ar, [268 + GX * 56 + 20, 270 + GY * 46 - 20], [1450, 210], easeIO(lin(lt, 7.6, 8.6)), -90, '#ffd84a');
    fw.setAttribute('transform', 'translate(330 940) scale(.6)'); stampShow(fg, lt, 9.0, 0, 0, -4); show(tFact, lt, 9.4, 1010, 945, 0, 1e9, 1);
    show(tm, lt, l21 + .1, 960, 130, 1); show(ts, lt, .3, 960, 110, -2, l21);
    const kk = pop(lt, l21 + .05, .4), br = Math.sin(lt * 9); tk.setAttribute('opacity', kk > .02 ? 1 : 0); tk.setAttribute('transform', `translate(1640 1120) rotate(${(3 * Math.sin(lt * 3)).toFixed(2)}) scale(${(.78 * kk).toFixed(3)} ${(.78 * kk * (1 + .01 * br)).toFixed(3)})`);
    setT(sw, 1500, 450, 0, .9 * pop(lt, l21 + .6, .3)); sw.setAttribute('opacity', lt > l21 + .6 ? 1 : 0);
  };
});

// ===== 22-23: back to that hill =====
const hillBase = (g, o) => hillScene(g, o);
S(22, 23, (g, u, L) => {
  hillScene(g, {}); const b = birdG(g), l23 = L(23), sec = mk(u, '<rect x="-210" y="-70" width="420" height="140" rx="16" fill="none" stroke="#c0392b" stroke-width="12"/><rect x="-190" y="-52" width="380" height="104" rx="8" fill="none" stroke="#c0392b" stroke-width="4"/><text class="t" y="34" text-anchor="middle" font-size="98" fill="#c0392b" style="letter-spacing:6px">SECRET</text>', { opacity: 0 }), ring = mk(g, '<ellipse rx="150" ry="36" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="14 12" opacity=".8"/>', { opacity: 0 });
  return lt => {
    flap(b, lt, ((lt * 140) % 2300) - 200, 300 + 30 * Math.sin(lt), 1.2); const z = lin(lt, 0, 6.4);
    const rv = pop(lt, l23 + .3, .5) * (1 - lin(lt, l23 + 3.4, l23 + 4.0)); setT(ring, 960, 650, 0, rv); ring.setAttribute('opacity', rv > .02 ? 1 : 0);
    show(sec, lt, l23 + 1.2, 960, 350, -4, l23 + 4.2);
  };
});

// ===== 24-26: the legend of the funeral =====
S(24, 26, (g, u, L) => {
  hillScene(g, {}); mk(g, '<rect x="-100" y="-100" width="2120" height="1300" fill="#7a4a1e" opacity=".2"/>');
  const l25 = L(25), l26 = L(26), st = stampG(u, 'L'), pc = [0, 1, 2].map(() => H(g, { coat: '#1d1d24', mane: '#101016', rider: C.dk })), cart = cartG(g), pull = H(g, { coat: '#1d1d24', mane: '#101016' }), eye = mk(u, '<g stroke="#1a1a1a" stroke-width="8"><ellipse rx="110" ry="64" fill="#fff"/><circle r="40" fill="#5a3a1a"/><circle r="18" fill="#1a1a1a"/></g><path d="M-120 -80 L120 80 M120 -80 L-120 80" stroke="#1a1a1a" stroke-width="26" stroke-linecap="round"/><path d="M-120 -80 L120 80 M120 -80 L-120 80" stroke="#e2362b" stroke-width="14" stroke-linecap="round"/>', { opacity: 0 }), tw = tagG(u, 'NO WITNESSES', 54, { fill: '#7d1f1f' });
  mk(cart.load, '<rect x="-80" y="-130" width="160" height="50" rx="10" fill="#2a2a32" stroke="#1a1a1a" stroke-width="6"/>'); const poofs = [0, 1, 2, 3].map(() => poof(g));
  const patch = mk(g, '<ellipse cx="0" cy="0" rx="560" ry="80" fill="#8a6a3a"/>', { opacity: 0 }), grn = mk(g, '<ellipse cx="0" cy="0" rx="570" ry="86" fill="#8f9b5e"/>', { opacity: 0 }), runners = [0, 1, 2, 3, 4, 5].map(i => H(g, { coat: '#1d1d24', mane: '#101016' })), tn = ptw(u, 'NOBODY CAN PROVE IT', 96, { sw: 12 }), tq = bigG(u, '?', 200);
  return lt => {
    stampShow(st, lt, .2, 1560, 170, 3);
    const t = lt - .2, x0 = lerp(-1500, 2300, lin(lt, .3, 5.0)), mv = lt > .3 && lt < l25 + .3;
    const ys = 740; ride(pc[0], lt, x0, ys, .6, 1, mv, 22); ride(pc[1], lt, x0 + 900, ys + 6, .6, 1, mv, 22); ride(pc[2], lt, x0 + 1400, ys, .6, 1, mv, 22);
    cart.set(x0 + 460, ys + 6, .6, mv ? lt * 90 : 0); ride(pull, lt, x0 + 790, ys + 6, .6, 1, mv, 22);
    [pc[0], pc[1], pc[2], pull].forEach(h => h.g.setAttribute('opacity', mv ? 1 : 0)); cart.g.setAttribute('opacity', mv ? 1 : 0);
    const ev = pop(lt, 3.4, .4) * (1 - lin(lt, l25 - .1, l25 + .3)); setT(eye, 1250, 440, 0, ev); eye.setAttribute('opacity', ev > .02 ? 1 : 0); show(tw, lt, 3.5, 1250, 580, -2, l25 - .1);
    // 25: horses trample, ground flattened
    const rv = lt > l25 && lt < l26 - .2;
    runners.forEach((h, i) => { const sp = 520 + i * 40, x = ((lt - l25) * sp * (i % 2 ? -1 : 1) + (i % 2 ? 2300 : -300) + i * 150), yy = 790 + (i % 3) * 55; ride(h, lt + i, x, yy, .5 + .05 * (i % 3), i % 2 ? -1 : 1, true, 30); h.g.setAttribute('opacity', rv ? 1 : 0); });
    const pa = easeIO(lin(lt, l25 + .3, l25 + 1.6)) * (1 - lin(lt, l25 + 2.4, l25 + 3.4)); setT(patch, 960, 840, 0, 1); patch.setAttribute('opacity', (.85 * pa).toFixed(2)); const gv = easeIO(lin(lt, l25 + 2.2, l25 + 3.6)); setT(grn, 960, 840, 0, 1); grn.setAttribute('opacity', (gv * .98 * (1 - lin(lt, l26 - .1, l26 + .7))).toFixed(2));
    poofs.forEach((p, i) => { const t0 = l25 + .5 + i * .6; p.setAttribute('opacity', lt > t0 && lt < t0 + .5 ? 1 : 0); setT(p, 300 + i * 450, 840 + (i % 2) * 40, 0, .9 * pop(lt, t0, .3)); });
    show(tn, lt, l26 + .1, 960, 480, -2); show(tq, lt, l26 + .5, 1560, 330, 6);
  };
});
