// ===== Chapter 8 "The hidden grave": scenes (uses engine.js + scene.js + scene2.js helpers) =====
Object.assign(C, {
  kub: { deel: '#d4a017', sash: '#c0392b', hat: 'chn', hair: '#1a1a1a', hatC: '#f1c40f', must: 1, fat: 1, skin: '#e0b080', s: 1.2, mh: 380, trim: '#fff2c0' },
  ariq: { deel: '#2c5f8a', sash: '#e67e22', hat: 'fur', hatC: '#3a2a1a', hatT: '#2c3e50', beard: 1, hair: '#1a1a1a', skin: '#c98f60', s: 1.04, mh: 370 },
  kYu: { deel: '#e2362b', sash: '#f1c40f', hat: 'tall', hatC: '#f1c40f', hatT: '#c0392b', must: 1, hair: '#1a1a1a', skin: '#e0b080', s: 1.05, mh: 360 },
  kHo: { deel: '#2a6fbf', sash: '#f1c40f', hat: 'fur', hatC: '#1b3a5e', hatT: '#2a6fbf', beard: 1, hair: '#a0522d', skin: '#f0c8a0', s: 1.08, mh: 360 },
  kIl: { deel: '#1e8449', sash: '#f1c40f', hat: 'turban', hatC: '#e8f5e9', hatT: '#1e8449', beard: 1, hair: '#141414', skin: '#d9a273', s: 1.04, mh: 380 },
  kCh: { deel: '#8e44ad', sash: '#e67e22', hat: 'plume', hatC: '#5b2a73', hatT: '#e67e22', must: 1, hair: '#1a1a1a', skin: '#d4a06e', s: 1.0, mh: 360 },
  bab: { deel: '#1f6f5c', sash: '#f1c40f', hat: 'turban', hatC: '#2e8b8b', hatT: '#e2362b', hair: '#141414', must: 1, skin: '#d9a273', s: 1.0, mh: 380 },
  shj: { deel: '#f5f1e0', sash: '#d4a017', hat: 'turban', hatC: '#fdfaf0', hatT: '#1abc9c', beard: 1, long: 1, hair: '#2a1a10', skin: '#d9a273', s: 1.06, mh: 380 },
  modM: { deel: '#34495e', sash: '#34495e', hat: 'cap', hatC: '#2874a6', hair: '#1a1a1a', skin: '#d4a06e', s: 1.0 },
  modW: { deel: '#e74c3c', sash: '#fdfefe', hat: 'hair', hair: '#2a1a10', long: 1, s: .95, skin: '#d4a06e', mh: 380 },
  modK: { kid: 1, deel: '#16a085', sash: '#f1c40f', hat: 'cap', hatC: '#e67e22', hair: '#1a1a1a', s: .5 },
  silv: { deel: '#dfe5ea', sash: '#aeb8c2', hat: 'fur', hatC: '#aeb8c2', hatT: '#c9d1d8', skin: '#c9d1d8', hair: '#8d99a6', pants: '#aab4be', boot: '#8d99a6', s: 1 },
  dk: { deel: '#25252d', sash: '#25252d', hat: 'fur', hatC: '#16161c', hatT: '#16161c', skin: '#25252d', hair: '#16161c', pants: '#1d1d24', boot: '#101016', s: .9 },
});
const ORG = '#f3ad45', KHN = { yuan: ['#e2362b', 'YUAN'], hord: ['#2a6fbf', 'GOLDEN HORDE'], ilk: ['#1e8449', 'ILKHANATE'], chag: ['#8e44ad', 'CHAGATAI'] };
const OFFD = { yuan: [1, .25], hord: [-.9, -.8], ilk: [-.8, .9], chag: [.1, -1] };
const crownMk = '<path d="M-70 0 L-80 -90 L-36 -48 L0 -108 L36 -48 L80 -90 L70 0 Z" fill="#f1c40f" stroke="#1a1a1a" stroke-width="7" stroke-linejoin="round"/><circle cx="0" cy="-60" r="9" fill="#e2362b" stroke="#1a1a1a" stroke-width="3"/>';
const HILLP = ['#6c7b62', '#7d8a59', '#8f9b5e'];
const hillScene = (g, o = {}) => scenery(g, Object.assign({ sky: 'grey', hill: HILLP, h: 640, clouds: 5, cloudC: '#e9edf1', cloudO: .5, wind: 1, grass: 120, grassC: '#6d7a45' }, o));
function mlab(m, pt, txt, size = 34, fill = '#111', o = {}) { const w = Math.round(txt.length * size * .58) + 36; return mi(m, pt, `<rect x="${-w / 2}" y="${-size * .72}" width="${w}" height="${size * 1.4}" rx="9" fill="${fill}" stroke="#fff" stroke-width="4"/><text class="t" y="${size * .34}" text-anchor="middle" font-size="${size}" fill="${o.tc || '#fff'}">${txt}</text>`, { dy: o.dy || 0 }); }
function pieces(m) {
  const o = {};
  for (const k in KHN) { const g = el('g', {}, m.w); o[k] = { g, p: el('path', { d: G3[k], fill: RED, stroke: '#1a1a1a', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }, g) }; }
  return { o, set(k, col, d = 0, sw = 2, stroke = '#1a1a1a', op = .9) { const q = o[k]; q.p.setAttribute('fill', col); q.p.setAttribute('stroke', stroke); q.p.setAttribute('stroke-width', sw); q.p.setAttribute('opacity', op); q.g.setAttribute('transform', `translate(${(OFFD[k][0] * d).toFixed(2)} ${(OFFD[k][1] * d).toFixed(2)})`); },
    fade(k, v, d = 8) { this.set(k, mixC(KHN[k][0], ORG, v), d, 2, '#1a1a1a', .9 * (1 - v)); } };
}
const sparkMk = '<path d="M0 -26 L7 -7 L26 0 L7 7 L0 26 L-7 7 L-26 0 L-7 -7 Z" fill="#fff6b0" stroke="#fff" stroke-width="2"/>';
const stick = (c, k = 1) => `<g stroke="#1a1a1a" stroke-width="2.5" stroke-linejoin="round"><rect x="-8" y="-20" width="16" height="22" rx="6" fill="${c}"/><circle cy="-30" r="9" fill="#e6b48c"/></g>`;
const crimsonDot = '<circle r="16" fill="#e2362b" stroke="#1a1a1a" stroke-width="5"/>';
function rzc(m, d, cx, cy, col) { const id = 'rz8' + (++RZN); mk(m.w, `<clipPath id="${id}"><circle cx="${cx}" cy="${cy}" r="0"/></clipPath>`); const c = m.w.querySelector(`#${id} circle`); const p = el('path', { d, fill: col, opacity: .85, stroke: '#1a1a1a', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke', 'clip-path': `url(#${id})` }, m.w); return (r, op = .85) => { c.setAttribute('r', Math.max(0, r)); p.setAttribute('opacity', op); }; }
const ptw = (u, text, size, o) => ptxt(u, text, size, '#fff', o);
const birdG = parent => mk(parent, '<path class="bw" d="M-30 0 Q-15 -16 0 0 Q15 -16 30 0" stroke="#2b2b33" stroke-width="5" fill="none" stroke-linecap="round"/>');
function flap(b, t, x, y, s = 1) { setT(b, x, y, 0, s); b.querySelector('.bw').setAttribute('d', `M-30 ${-8 * Math.sin(t * 9) * -1} Q-15 ${-16 * Math.sin(t * 9) - 4} 0 0 Q15 ${-16 * Math.sin(t * 9) - 4} 30 ${-8 * Math.sin(t * 9) * -1}`); }

// ===== 0: the red empire cracks =====
S(0, 0, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), pc = pieces(m), tg = tagG(u, 'THE MONGOL EMPIRE', 56, OR); m.mon(RED);
  return lt => {
    const cr = easeIO(lin(lt, 1.5, 2.6)), sp = easeIO(lin(lt, 2.3, 3.8));
    m.cam(1130, 450, 1.3 + .08 * lin(lt, 0, 3.8));
    for (const k in KHN) pc.set(k, RED, sp * 7 + (cr > 0 && sp < 1 ? Math.sin(lt * 55 + k.length * 2) * .5 : 0), 2 + cr * 4, cr > 0 ? '#fff' : '#1a1a1a', .88);
    y(lt, .3, '1260'); show(tg, lt, .4, 760, 110, -2);
  };
});

// ===== 1-2: the brothers' civil war =====
S(1, 2, (g, u, L) => {
  hillScene(g, { sky: 'warm', hill: HD, h: 690, clouds: 3, grass: 50, wind: 0 }); const y = yearG(u), l1 = L(1), l2 = L(2);
  const kb = P(g, C.kub), ar = P(g, C.ariq), crown = mk(g, crownMk, { opacity: 0 });
  const AL = [], AR = []; for (let i = 0; i < 20; i++) { AL.push(mk(g, stick('#c9a227'))); AR.push(mk(g, stick('#2c5f8a'))); }
  const f1 = mk(g, bannerMk.replace('#e2362b', '#f1c40f')), f2 = mk(g, bannerMk.replace('#e2362b', '#2c5f8a')), pf = poof(g), pf2 = poof(g);
  const tK = tagG(u, 'KUBLAI', 54, { fill: '#a67c00' }), tA = tagG(u, 'ARIQ BÖKE', 54, { fill: '#1f4f78' }), t4 = tagG(u, '4 YEARS OF WAR', 60, { fill: '#7d1f1f' }), tq = tagG(u, 'WHO GETS TO BE GREAT KHAN?', 52, OR);
  return lt => {
    const wk = easeOut(lin(lt, l1 + .1, l1 + 1.5)), xk = lerp(-250, 650, wk), xa = lerp(2170, 1290, wk), mv = wk < 1;
    const ang = lt > l1 + 2.2, sh = Math.sin(lt * 9);
    if (mv) { walkP(kb, lt, xk, 990, 1.35, 1, 'd'); walkP(ar, lt, xa, 990, 1.3, -1, 'd'); } else { stand(kb, xk, 990 + Math.abs(sh) * 2, 1.35, 1, ang ? 'a' : 'd'); stand(ar, xa, 990 + Math.abs(Math.cos(lt * 9)) * 2, 1.3, -1, ang ? 'a' : 'd'); kb.arm('R', -120 + 20 * sh); ar.arm('L', 120 - 20 * Math.cos(lt * 9)); }
    kb.mark('a', lt, l1 + 2.4, l2 + 3); ar.mark('a', lt, l1 + 2.6, l2 + 3);
    const cp = pop(lt, l1 + .2, .4) * (1 - lin(lt, l2 + .2, l2 + .6)); crown.setAttribute('opacity', cp > .02 ? 1 : 0); setT(crown, 960, 520 + 10 * Math.sin(lt * 3), 0, 1.5 * cp);
    show(tq, lt, l1 + .5, 960, 260, -1, l2 + .1);
    const adv = easeIO(lin(lt, l2 + .8, l2 + 3.0)); let n = 0;
    for (let i = 0; i < 20; i++) { const c = i % 5, r = Math.floor(i / 5), b2 = Math.abs(Math.sin(lt * 7 + i)) * 4 * (adv > 0 && adv < 1 ? 1 : 0);
      setT(AL[i], 170 + c * 70 + 330 * adv, 770 + r * 30 - b2, 0, 1.8 * pop(lt, l1 + .5 + i * .03, .3)); setT(AR[i], 1750 - c * 70 - 330 * adv, 770 + r * 30 - b2, 0, 1.8 * pop(lt, l1 + .5 + i * .03, .3)); }
    setT(f1, 90, 790, 0, .9 * pop(lt, l1 + .4)); setT(f2, 1830, 790, 0, .9 * pop(lt, l1 + .4));
    pf.setAttribute('opacity', lt > l2 + 3.0 && lt < l2 + 3.6 ? 1 : 0); setT(pf, 960 + 40 * Math.sin(lt * 20), 790, 0, 1.2 * pop(lt, l2 + 3.0, .3)); pf2.setAttribute('opacity', lt > l2 + 3.4 ? 1 : 0); setT(pf2, 890, 800, 0, .8 * pop(lt, l2 + 3.4, .3));
    show(tK, lt, l2 + .3, 650, 430, -2); show(tA, lt, l2 + .6, 1290, 450, 2); show(t4, lt, l2 + 1.8, 960, 330, -1);
    y(lt, l1 + .2, lt < l2 ? '1260' : String(Math.round(lerp(1260, 1264, easeIO(lin(lt, l2 + .3, l2 + 4.6))))));
  };
});

// ===== 3: Kublai wins, the west turns away =====
S(3, 3, (g, u, L) => {
  hillScene(g, { sky: 'warm', hill: HD, h: 690, clouds: 3, grass: 50, wind: 0 }); const y = yearG(u);
  const kb = P(g, C.kub), ar = P(g, C.ariq), K = ['kHo', 'kIl', 'kCh'].map(k => P(g, C[k])), sp = [0, 1, 2].map(() => mk(g, sparkMk, { opacity: 0 })), sq = speech(u, 'NOT MY BOSS!', 54, 270);
  const tw = tagG(u, 'KUBLAI WINS', 70, { fill: '#a67c00' }), tn = tagG(u, "...BUT THE WEST DOESN'T OBEY", 52, { fill: '#7d1f1f' }), cr = mk(g, crownMk, { opacity: 0 });
  return lt => {
    stand(kb, 560, 990 + Math.abs(Math.sin(lt * 5)) * 3, 1.35, 1, lt < 2.4 ? 'h' : 's'); kb.arm('R', -140 + 12 * Math.sin(lt * 6)); kb.arm('L', 40);
    stand(ar, 270, 980, .95, 1, 's', 0); ar.arm('R', 20); ar.arm('L', 20);
    const w = easeIn2(lin(lt, 2.4, 5.2)); K.forEach((p, i) => { const x = lerp(1130 + i * 230, 1560 + i * 300 + 260, w); if (w > 0) walkP(p, lt + i, x, 930, 1, 1, 'h'); else stand(p, x, 930, 1, -1, 'h'); if (w > 0 && i == 1) p.face('f'); });
    K[2].mark('?', lt, 3.0, 4.6);
    const cp = pop(lt, .4, .4); cr.setAttribute('opacity', cp > .02 ? 1 : 0); setT(cr, 560, 480 + 8 * Math.sin(lt * 4), 0, .8 * cp);
    sp.forEach((s, i) => { s.setAttribute('opacity', lt > .6 ? .5 + .5 * Math.sin(lt * 6 + i * 2) : 0); setT(s, 420 + i * 140, 560 + 50 * Math.sin(lt * 3 + i), 0, .8); });
    show(tw, lt, .3, 560, 250, -2); show(tn, lt, 2.2, 1250, 270, 1); show(sq, lt, 3.0, 1500, 640, 1);
    y(lt, .3, '1264');
  };
});
const easeIn2 = x => x * x;

// ===== 4: the empire splits into four parts =====
S(4, 4, (g, u, L) => {
  const m = mapG3(g), y = yearG(u), pc = pieces(m), P0 = G3.pts; m.mon(RED);
  const lab = { yuan: mlab(m, P0.yuanC, 'YUAN', 40, '#a31f17'), hord: mlab(m, P0.hordeC, 'GOLDEN HORDE', 36, '#1d4f8f'), ilk: mlab(m, P0.ilkC, 'ILKHANATE', 36, '#14602f'), chag: mlab(m, P0.chagC, 'CHAGATAI', 36, '#6c3483') };
  const sub = { yuan: mlab(m, [P0.yuanC[0], P0.yuanC[1] + 24], 'CHINA', 26, '#111'), hord: mlab(m, [P0.hordeC[0], P0.hordeC[1] + 24], 'RUSSIA', 26, '#111'), ilk: mlab(m, [P0.ilkC[0], P0.ilkC[1] + 24], 'PERSIA', 26, '#111'), chag: mlab(m, [P0.chagC[0], P0.chagC[1] + 24], 'CENTRAL ASIA', 26, '#111') };
  const T0 = { yuan: 2.2, hord: 4.2, ilk: 6.0, chag: 7.7 }, arr = ['yuan', 'hord', 'ilk', 'chag'];
  return lt => {
    m.cam(1120, 440, 1.35); const sp = easeOut(lin(lt, .3, 1.4));
    for (const k of arr) { const col = lt >= T0[k] ? KHN[k][0] : RED, wob = lt > T0[k] ? Math.sin(lt * 7 + k.length) * .7 * (1 - sp * .4) : 0; pc.set(k, col, sp * 9 + wob, 3, '#fff', .92); setT(lab[k], 0, 0, 0, pop(lt, T0[k], .35)); setT(sub[k], 0, 6, 0, pop(lt, T0[k] + .35, .3)); }
    y(lt, 0, '1260s');
  };
});

// ===== 5: Tick and four arguing khans =====
S(5, 5, (g, u, L) => {
  scenery(g, { sky: 'warm', hill: HD, h: 700, clouds: 3, grass: 60 });
  const ks = ['kYu', 'kHo', 'kIl', 'kCh'].map(k => P(g, C[k])), xs = [300, 680, 1250, 1620], tk = tickG(g), nm = Object.keys(KHN), bub = ['MY LAND!', 'NO, MINE!', 'I WAS FIRST!', "I'M THE BIGGEST!"].map((t, i) => speech(u, t, 40, 40 + t.length * 11));
  const tg = nm.map(k => tagG(u, KHN[k][1], 40, { fill: KHN[k][0] })), tgY = [640, 640, 640, 640];
  return lt => {
    ks.forEach((p, i) => { const s = Math.sin(lt * (7 + i) + i * 2); stand(p, xs[i], 930 + Math.abs(s) * 4, 1, i < 2 ? 1 : -1, 'a'); p.arm(i < 2 ? 'R' : 'L', (i < 2 ? -1 : 1) * (100 + 25 * s)); p.arm(i < 2 ? 'L' : 'R', (i < 2 ? 1 : -1) * 30); p.mark('a', lt, .8 + i * .5, 6.6); show(tg[i], lt, .4 + i * .2, xs[i], 560, (i % 2 ? 2 : -2)); show(bub[i], lt, 1.2 + i * 1.1, xs[i] + (i < 2 ? 70 : -70), 470 + (i % 2) * 30, 0, 2.6 + i * 1.1); });
    const b = easeIO(lin(lt, 3.0, 7.4)), k = pop(lt, .2, .4) * (1 - .45 * b);
    tickAt(tk, lerp(960, 1000, b), lerp(1090, 1100, b), .66, k); tk.setAttribute('opacity', lt > 7.2 ? 1 - lin(lt, 7.2, 7.7) : (k > .02 ? 1 : 0));
    const sw = lt > 2.2 && lt < 6.5 ? pop(lt, 2.2, .3) : 0; sweatT(g, tk, lt, sw, lerp(960, 1000, b) + 120 * .66, 1090 - 953 * .66 * k * 1.0 - 10 + b * 10, k);
  };
});
function sweatT(g, tk, lt, on, x, y, k) { if (!tk._sw) { tk._sw = mk(g, sweatDrop, { opacity: 0 }); } setT(tk._sw, x, y + 10 * Math.sin(lt * 5), 0, on * .9 * k); tk._sw.setAttribute('opacity', on > .02 ? 1 : 0); }
