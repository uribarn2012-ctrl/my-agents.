// Chapter 2 "One people": segments (one per group of narration lines). Uses engine.js.
Object.assign(C, {
  temY: { deel: '#3f6fa8', sash: '#c0392b', hat: 'tall', hatC: '#7a4a2a', hatT: '#2c3e50', beard: 1, hair: '#2a1a10', s: 1.1, mh: 370 },
  gen: { deel: '#3f6fa8', sash: '#c0392b', hat: 'tall', hatC: '#e8dcc0', hatT: '#2c3e50', beard: 1, must: 1, hair: '#8c8c8c', s: 1.15, mh: 380 },
  bor2: { deel: '#2e8b57', sash: '#f1c40f', hat: 'boqta', hatC: '#c0392b', long: 1, s: .98, mh: 380 },
  jam: { deel: '#b03a2e', sash: '#1a1a1a', hat: 'top', hair: '#111', s: 1.08, skin: '#dcaa7e', mh: 340 },
  ong: { deel: '#d4ac0d', sash: '#7b241c', hat: 'fur', hatC: '#ecf0f1', hatT: '#b7950b', beard: 1, hair: '#f2f2f2', fat: 1, cross: 1, s: 1.0, skin: '#e0b48a', mh: 360 },
  jebe: { deel: '#5d6d7e', sash: '#e67e22', hat: 'fur', hatC: '#f5f5f5', hatT: '#1abc9c', must: 1, hair: '#1a1a1a', s: 1.02, skin: '#c98f60' },
  son: { kid: 1, deel: '#5dade2', sash: '#c0392b', hat: 'hair', s: .6 },
});
const SEGS = [], GEO = window.GEO; let MAPN = 0;
function S(a, b, build, focus = [960, 640]) { const g = el('g', { display: 'none' }, STAGE), cam = el('g', {}, g), ui = el('g', {}, g); const bs = a === 0 ? 0 : TL.starts[a] - .1, be = b === N - 1 ? TL.end : TL.starts[b + 1] - .1; SEGS.push({ g, cam, ui, bs, be, focus, upd: build(cam, ui, k => TL.starts[k] - bs) }); }
const OR = { fill: '#ff6a00', stroke: '#1a1a1a', tc: '#fff4e6' };
function ride(h, t, x, y, s = 1, flip = 1, mv = true, amp = 26) { const by = h.gallop(t, 8, mv ? amp : 0, mv); h.place(x, y, s, flip, 0, by); if (h.rider) h.rider.place(-8, -182 + 100 * (h.rider.o.s || 1), 1, 1, 0, by * .3); return by; }
function stand(p, x, y, s = 1, flip = 1, st = 'n', bob = 0) { p.place(x, y, s, flip, 0, bob); p.walk(0, 9, 0, false); p.face(st); }
function walkP(p, t, x, y, s = 1, flip = 1, st = 'n') { const b = p.walk(t, 9, 22); p.place(x, y, s, flip, 0, b); p.face(st); }
function yearG(u) { const g = mk(u, '<rect x="-140" y="-56" width="280" height="104" rx="14" fill="#111" stroke="#fff" stroke-width="5"/><text class="t" x="0" y="28" text-anchor="middle" font-size="78" fill="#ffd84a"></text>', { opacity: 0 }); const tx = g.querySelector('text'); return (lt, a, txt, b = 1e9, x = 1740, y = 96) => { tx.textContent = txt; show(g, lt, a, x, y, 0, b); }; }
const hx = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
function mixC(a, b, k) { const A = hx(a), B2 = hx(b); return '#' + A.map((v, i) => Math.round(v + (B2[i] - v) * clamp(k)).toString(16).padStart(2, '0')).join(''); }
const RED = '#e2362b', GREY = '#9aa0a6';
const TR = [['NAIMANS', 'naimans', [1215, 395], '#1f618d'], ['KERAITES', 'keraites', [1305, 425], '#d4ac0d'], ['MERKITS', 'merkits', [1335, 352], '#7d3c98'], ['TAYICHIUD', 'tayichiud', [1418, 352], '#117a65'], ['TATARS', 'tatars', [1475, 425], '#6e2c00'], ['TEMÜJIN', 'mongols', [1395, 420], RED]];
const ZP = {}; TR.forEach(r => ZP[r[1]] = r[2]);
function cell(i) {
  let poly = [[1120, 300], [1560, 300], [1560, 500], [1120, 500]]; const si = TR[i][2];
  TR.forEach((r, j) => { if (j === i) return; const sj = r[2], n = [sj[0] - si[0], sj[1] - si[1]], m = [(si[0] + sj[0]) / 2, (si[1] + sj[1]) / 2], f = p => (p[0] - m[0]) * n[0] + (p[1] - m[1]) * n[1], out = [];
    poly.forEach((p, k) => { const q = poly[(k + 1) % poly.length], fp = f(p), fq = f(q); if (fp <= 0) out.push(p); if (fp * fq < 0) { const u = fp / (fp - fq); out.push([p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u]); } }); poly = out; });
  return 'M' + poly.map(p => p.map(v => v.toFixed(1)).join(' ')).join('L') + 'Z';
}
function mapG(g) {
  el('rect', { x: -300, y: -300, width: 2520, height: 1680, fill: '#2f63c9' }, g);
  const w = el('g', {}, g), id = 'mc' + (++MAPN);
  el('path', { d: GEO.land, fill: '#f3ad45', stroke: '#1d2b4a', 'stroke-width': 1.6, 'vector-effect': 'non-scaling-stroke' }, w);
  el('path', { d: GEO.borders, fill: 'none', stroke: '#1d2b4a', 'stroke-width': 1, opacity: .3, 'vector-effect': 'non-scaling-stroke' }, w);
  mk(w, `<clipPath id="${id}"><path d="${GEO.mongolia}"/></clipPath>`);
  const zg = el('g', { 'clip-path': `url(#${id})` }, w), Z = {}, LB = {};
  TR.forEach((r, i) => { Z[r[1]] = el('path', { d: cell(i), fill: r[3], opacity: .88, stroke: '#1a1a1a', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke' }, zg); });
  el('path', { d: GEO.mongolia, fill: 'none', stroke: '#1a1a1a', 'stroke-width': 4, 'vector-effect': 'non-scaling-stroke' }, w);
  const top = el('g', {}, g);
  TR.forEach(r => { LB[r[1]] = mk(top, `<text class="t big" font-size="34" style="stroke-width:9">${r[0]}</text>`); });
  const m = { w, top, Z, LB, cx: 1340, cy: 405, s: 5 };
  m.cam = (cx, cy, s) => { Object.assign(m, { cx, cy, s }); w.setAttribute('transform', `translate(960 540) scale(${s}) translate(${-cx} ${-cy})`); TR.forEach(r => { const p = m.S(r[2]); setT(LB[r[1]], p[0], p[1] + 12, 0, clamp(s / 5, .5, 1.2)); }); };
  m.S = p => [(p[0] - m.cx) * m.s + 960, (p[1] - m.cy) * m.s + 540];
  m.zone = (k, c) => Z[k].setAttribute('fill', c);
  m.lbl = (k, o) => LB[k].setAttribute('opacity', clamp(o));
  return m;
}
function arrowG(p) { return mk(p, '<path class="sh" fill="none" stroke="#1a1a1a" stroke-width="22" stroke-linecap="round"/><path class="ln" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/><path class="hd" fill="#fff" stroke="#1a1a1a" stroke-width="5" stroke-linejoin="round"/>'); }
function arrowSet(g, A, Bp, k, bend = 60) {
  const mx = (A[0] + Bp[0]) / 2 - (Bp[1] - A[1]) * bend / 400, my = (A[1] + Bp[1]) / 2 + (Bp[0] - A[0]) * bend / 400, n = 24, pts = [];
  for (let i = 0; i <= n * k; i++) { const u = i / n; pts.push([(1 - u) * (1 - u) * A[0] + 2 * u * (1 - u) * mx + u * u * Bp[0], (1 - u) * (1 - u) * A[1] + 2 * u * (1 - u) * my + u * u * Bp[1]]); }
  g.setAttribute('opacity', k > .02 ? 1 : 0); if (pts.length < 2) return;
  const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L'), e = pts[pts.length - 1], q = pts[pts.length - 2], a = Math.atan2(e[1] - q[1], e[0] - q[0]);
  g.querySelector('.sh').setAttribute('d', d); g.querySelector('.ln').setAttribute('d', d);
  const hp = [[30, 0], [-12, -22], [-12, 22]].map(([x, y]) => [e[0] + x * Math.cos(a) - y * Math.sin(a), e[1] + x * Math.sin(a) + y * Math.cos(a)]);
  g.querySelector('.hd').setAttribute('d', 'M' + hp.map(p => p.join(' ')).join('L') + 'Z');
}
function tickAt(t, x, y, s, k = 1) { setT(t, x, y + (1 - k) * 80, 2 * Math.sin((window.__T || 0) * 2), s * k, s * k * (1 + .02 * Math.sin((window.__T || 0) * 5))); t.setAttribute('opacity', k > 0.02 ? 1 : 0); }
const cupMk = '<path d="M-22 -30 L22 -30 L16 18 L-16 18 Z" fill="#c9a66b" stroke="#1a1a1a" stroke-width="5"/><ellipse cx="0" cy="-30" rx="22" ry="7" fill="#7a5a2a" stroke="#1a1a1a" stroke-width="4"/>';
const soldier = c => `<g stroke="#1a1a1a" stroke-width="2"><rect x="-6" y="-16" width="12" height="16" fill="${c}"/><circle cy="-21" r="6" fill="#e6b48c"/></g>`;
const TC = ['#1f618d', '#d4ac0d', '#7d3c98', '#117a65', '#6e2c00', '#e2362b'];

// ===== 0: 1178 map, title, marriage =====
S(0, 0, (g, u, L) => {
  const m = mapG(g), y = yearG(u), c1 = tagG(u, 'CHAPTER 2', 60, OR), c2 = bigG(u, 'ONE PEOPLE', 150);
  const pt = portrait(g, C.temY, 0, 0, 70, RED), pb = portrait(g, C.bor2, 0, 0, 70, '#2e8b57'), hr = mk(g, heartMk);
  return lt => {
    m.cam(1340, 400 + 8 * Math.sin(lt * .4), 4.6 + lt * .06);
    TR.forEach((r, i) => { const k = lin(lt, .2 + i * .15, .6 + i * .15); m.zone(r[1], mixC('#f3ad45', r[3], k)); m.lbl(r[1], k); });
    y(lt, .2, '1178'); show(c1, lt, .3, 960, 110, 0, 2.6); show(c2, lt, .45, 960, 290, -2, 2.6, 1, true);
    const p = m.S(ZP.mongols), k = pop(lt, 2.4);
    setT(pt.g, p[0] - 90, p[1] - 150, 0, k); setT(pb.g, p[0] + 90, p[1] - 150, 0, k); show(hr, lt, 2.9, p[0], p[1] - 160, 0, 1e9, 1.6 + .1 * Math.sin(lt * 8));
    pt.pp.face(lt > 2.6 ? 'h' : 'n'); pb.pp.face(lt > 2.6 ? 'h' : 'n');
  };
});
// ===== 1: night raid =====
S(1, 1, (g, u, L) => {
  const sc = scenery(g, { sky: 'night', hill: HNIGHT, moon: [1600, 160], clouds: 2, cloudC: '#3a4470' }), ger = gerG(g), tem = P(g, C.temY), bush = bushG(g, false);
  const r1 = H(g, { coat: '#3a2a1c', blanket: '#7d3c98', rider: Object.assign({}, C.tat, { deel: '#7d3c98', holdL: spearMk }) }), r2 = H(g, { coat: '#555', blanket: '#7d3c98', rider: C.bor2 }), r3 = H(g, { coat: '#2b1b10', blanket: '#7d3c98', rider: Object.assign({}, C.tat2, { deel: '#5b2a73' }) });
  const tg = tagG(u, 'MERKIT RAID', 60, { fill: '#5b2a73' });
  return lt => {
    sc(lt); ger.set(1450, 820, 1.1); stand(tem, 250, 900, 1, 1, 'f'); tem.mark('!', lt, .8, 4.6); setT(bush, 300, 930, 0, 1.3);
    const x = -500 + lt * 520; ride(r1, lt, x + 500, 860, .9, 1); ride(r2, lt + .3, x + 220, 900, .9, 1); ride(r3, lt + .6, x - 60, 870, .9, 1);
    r1.rider.face('a'); r2.rider.face('f'); r3.rider.face('a'); r2.rider.mark('!', lt, 1, 4.6); show(tg, lt, .3, 960, 110, -2);
  };
});
// ===== 2-3: no army -> allies idea =====
S(2, 3, (g, u, L) => {
  const sc = scenery(g, { sky: 'grey', hill: HGREY, clouds: 5, wind: 1 }), tem = P(g, C.temY), a = tagG(u, 'ARMY: 1', 64, { fill: '#555' }), b = tagG(u, 'PLAN: FIND ALLIES', 64, OR);
  return lt => {
    sc(lt); const t3 = L(3) - .1; stand(tem, 960, 930, 1.15, 1, lt < t3 ? 's' : 'd'); if (lt > t3) tem.arm('R', -150 + 8 * Math.sin(lt * 6)); else tem.free('R');
    tem.mark(lt < t3 ? 's' : '!', lt, lt < t3 ? .6 : t3 + .2, lt < t3 ? t3 - .1 : t3 + 2.5);
    show(a, lt, .4, 960, 150, -2, t3 - .2); show(b, lt, t3 + .4, 960, 150, 2);
  };
});
// ===== 4-5: Toghrul and Jamukha =====
S(4, 5, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1700, 160], clouds: 3 }), tem = P(g, C.temY), to = P(g, C.ong), ja = P(g, C.jam);
  const a = tagG(u, "TOGHRUL: DAD'S SWORN BROTHER", 50, { fill: '#b7950b' }), b = tagG(u, 'JAMUKHA: BLOOD BROTHER', 50, { fill: '#b03a2e' });
  return lt => {
    sc(lt); const t5 = L(5) - .1;
    stand(tem, 420, 930, 1.05, 1, 'd'); tem.arm('R', -70);
    const x1 = lerp(2100, 1150, easeOut(lin(lt, .2, 1.4))); if (lt < 1.4) walkP(to, lt, x1, 930, 1.05, -1); else stand(to, x1, 930, 1.05, -1, 'h');
    const x2 = lerp(2200, 1550, easeOut(lin(lt, t5, t5 + 1.2))); if (lt < t5 + 1.2) walkP(ja, lt, x2, 930, 1.05, -1, 'k'); else stand(ja, x2, 930, 1.05, -1, 'k');
    show(a, lt, .8, 960, 110, -2, t5 - .2); show(b, lt, t5 + .6, 960, 110, 2);
  };
});
// ===== 6: rescue on the map =====
S(6, 6, (g, u, L) => {
  const m = mapG(g), ar = [0, 1, 2].map(() => arrowG(g)), pb = portrait(g, C.bor2, 0, 0, 62, '#2e8b57'), tg = tagG(u, 'BÖRTE RESCUED', 60, OR);
  return lt => {
    m.cam(1350, 395, 5); TR.forEach(r => m.lbl(r[1], 1));
    const k = lin(lt, .2, 1.6), tgt = m.S(ZP.merkits); [[1305, 425], [1395, 420], [1420, 400]].forEach((p, i) => arrowSet(ar[i], m.S(p), [tgt[0] + (i - 1) * 30, tgt[1] + 20], k * (lt < 2.6 ? 1 : 0) , [-60, 60, 40][i]));
    m.zone('merkits', mixC('#7d3c98', GREY, lin(lt, 1.6, 2.2)));
    const p = m.S(ZP.mongols); setT(pb.g, lerp(tgt[0], p[0], easeIO(lin(lt, 2.4, 3.6))), lerp(tgt[1], p[1], easeIO(lin(lt, 2.4, 3.6))) - 110, 0, pop(lt, 2.2)); pb.pp.face(lt > 3.4 ? 'h' : 'r');
    show(tg, lt, 2.6, 960, 110, -2);
  };
});
// ===== 7-8: people notice; his camp =====
S(7, 8, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [1650, 170], clouds: 4 }), ger = gerG(g), tem = P(g, C.temY), cr = [C.nomM, C.nomW, C.fst, C.stg, C.eld].map(c => P(g, c)), tg = tagG(u, "TEMÜJIN'S CAMP", 60, OR);
  return lt => {
    sc(lt); ger.set(1500, 820, 1); stand(tem, 1180, 930, 1.1, -1, 'd');
    cr.forEach((p, i) => { const x = lerp(-150 - i * 120, 250 + i * 150, easeOut(lin(lt, .2 + i * .2, 2 + i * .2))); if (lt < 2 + i * .2) walkP(p, lt + i, x, 900 + (i % 2) * 40, .9); else stand(p, x, 900 + (i % 2) * 40, .9, 1, 'o'); p.mark('!', lt, 1 + i * .25, L(8) - .2); });
    show(tg, lt, L(8) + .3, 960, 110, -2);
  };
});
// ===== 9-10: merit, not names =====
S(9, 10, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [300, 170], clouds: 3 }), tem = P(g, C.temY), nob = P(g, C.chief), com = P(g, C.stg);
  const nt = tagG(g, 'SON OF A CHIEF', 40, { fill: '#7d3c98' }), x = mk(g, '<path d="M-180 -40 L180 40 M-180 40 L180 -40" stroke="#e2362b" stroke-width="8" stroke-linecap="round"/>', { opacity: 0 }), ct = tagG(g, 'COMMANDER', 44, OR), st = mk(g, '<path d="M0 -40 L12 -12 L42 -12 L18 6 L28 36 L0 18 L-28 36 L-18 6 L-42 -12 L-12 -12 Z" fill="#ffd84a" stroke="#1a1a1a" stroke-width="5"/>', { opacity: 0 }), tg = tagG(u, 'LOYAL + GOOD AT THE JOB', 56, OR);
  return lt => {
    sc(lt); const t = L(10) - .1;
    stand(tem, 960, 930, 1.1, lt < t + 1 ? -1 : 1, lt < t ? 'n' : lt < t + 2 ? 'd' : 'h'); if (lt > t + 2.2) tem.arm('R', -110); else tem.free('R');
    stand(nob, 560, 930, 1.05, 1, lt < t + .6 ? 'h' : 'o'); nob.tilt(lt < t ? -8 : 0);
    stand(com, 1380, 930, .95, -1, lt < t + 2.4 ? 'n' : 'h');
    show(nt, lt, .5, 560, 520, -3); show(x, lt, t + .6, 560, 520, 0, 1e9, .7, true);
    show(ct, lt, t + 2.6, 1380, 520, 3); show(st, lt, t + 2.6, 1380, 700, 0, 1e9, 1 + .08 * Math.sin(lt * 6));
    show(tg, lt, t + 3.4, 960, 110, -2);
  };
});
// ===== 11: defeated tribes join =====
S(11, 11, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [1650, 160], clouds: 4 }), ger = gerG(g), ppl = Array.from({ length: 6 }, (_, i) => P(g, Object.assign({}, [C.tat, C.tat2, C.nomW, C.war, C.nomM, C.fst][i]))), bd = ppl.map(() => mk(g, '<circle r="15" fill="#e2362b" stroke="#1a1a1a" stroke-width="4"/>', { opacity: 0 }));
  const gate = mk(g, '<rect x="-8" y="-260" width="16" height="260" fill="#6b4423" stroke="#1a1a1a" stroke-width="4"/><path d="M8 -255 L90 -232 L8 -205 Z" fill="#e2362b" stroke="#1a1a1a" stroke-width="5"/>'), tg = tagG(u, 'NOW PART OF THE FAMILY', 56, OR);
  return lt => {
    sc(lt); ger.set(1600, 820, 1); setT(gate, 1000, 940);
    ppl.forEach((p, i) => { const x = -120 + (lt - i * .7) * 260; const inn = x > 1000; walkP(p, lt + i, Math.min(x, 1500 - i * 70), 900 + (i % 2) * 40, .85, 1, inn ? 'h' : 'n'); const hp = p.toParent(0, -150); setT(bd[i], hp[0], hp[1]); bd[i].setAttribute('opacity', inn ? 1 : 0); });
    show(tg, lt, 4.5, 960, 110, -2);
  };
});
// ===== 12: side quest card =====
S(12, 12, (g, u, L) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, clouds: 3 }), rb = ribbon(u), tk = tickG(g), a = bigG(u, 'SIDE QUEST:', 150), b = bigG(u, 'THE ARROW', 170, { fill: '#ffd84a' }), ar = mk(g, arrowMk);
  return lt => { sc(lt); rb(lt); show(a, lt, .1, 960, 300, -2, 1e9, 1, true); show(b, lt, .5, 960, 480, 2, 1e9, 1, true); tickAt(tk, 1500, 1000, .34, pop(lt, .2)); setT(ar, -200 + lt * 1400, 700, 0, 2.2); };
});
// ===== 13: horse shot =====
S(13, 13, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [300, 150], clouds: 3, wind: 1 }), rb = ribbon(u), hz = H(g, { coat: '#8b5a2b', blanket: '#2f63c9', rider: C.temY }), tem = P(g, C.temY), ar = mk(g, arrowMk), pf = poof(g), arc = P(g, Object.assign({}, C.jebe, { holdL: bowMk }));
  return lt => {
    sc(lt); rb(lt); const hit = 2.0, x = 300 + Math.min(lt, hit) * 260;
    stand(arc, 1700, 920, 1, -1, 'd'); arc.arm('L', -95);
    if (lt < hit) { ride(hz, lt, x, 900, 1, 1); vis(hz.g, 1); vis(tem.g, 0); hz.rider.face('d'); }
    else { const k = lin(lt, hit, hit + .5); hz.gallop(0, 8, 0, false); hz.place(x + k * 120, 900 + k * 40, 1, 1, k * 80); vis(hz.rider.g, 0); stand(tem, x - 120, 930, 1, 1, 'o'); tem.place(x - 120, 930 - Math.sin(Math.PI * lin(lt, hit, hit + .6)) * 120, 1, 1, 0); tem.mark('!', lt, hit + .2, 6); }
    const ka = lin(lt, hit - .7, hit); setT(ar, lerp(1640, x + 60, ka), 700 + ka * 80, 180, 1.3); ar.setAttribute('opacity', lt < hit + .1 && lt > hit - .7 ? 1 : 0);
    show(pf, lt, hit, x + 80, 820, 0, hit + .6, 1.2);
  };
});
// ===== 14-15: captured archer gets a job and a name =====
S(14, 15, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1600, 170], clouds: 3 }), rb = ribbon(u), tem = P(g, C.temY), jb = P(g, C.jebe), g1 = P(g, C.guard), sp = mk(g, '<path d="M0 0 C-40 -60 60 -100 120 -60" fill="none"/>');
  const said = mk(g, '<ellipse rx="160" ry="70" fill="#fff" stroke="#1a1a1a" stroke-width="5"/><text class="t" y="16" text-anchor="middle" font-size="46" fill="#1a1a1a">IT WAS ME.</text>', { opacity: 0 });
  const nm = tagG(u, 'JEBE = "ARROW"', 72, OR), st = stampG(u, 'F'), bw = mk(g, bowMk, { opacity: 0 });
  return lt => {
    sc(lt); rb(lt); const t = L(15) - .1;
    stand(tem, 600, 940, 1.1, 1, lt < t ? 'a' : lt < t + 1.5 ? 'n' : 'h'); stand(g1, 1650, 940, 1, -1, 'd');
    stand(jb, 1250, 940, 1, -1, lt < 2.5 ? 'f' : lt < t ? 'd' : lt < t + 2 ? 'o' : 'h'); if (lt > 2 && lt < t) jb.arm('R', 150); else jb.free('R');
    show(said, lt, 2.3, 1290, 430, 2, t - .2);
    const kb = easeIO(lin(lt, t + .3, t + 1.5)); setT(bw, lerp(700, 1200, kb), 780 - Math.sin(Math.PI * kb) * 120, 0, 1); bw.setAttribute('opacity', lt > t + .3 ? 1 : 0);
    jb.mark('!', lt, t + 1.5, t + 3.2); show(nm, lt, t + 3.2, 960, 200, -2); stampShow(st, lt, t + 4.4, 1540, 420, 8);
  };
});
// ===== 16: Jebe the general =====
S(16, 16, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [1650, 160], clouds: 4, wind: 1 }), rb = ribbon(u), arm = Array.from({ length: 6 }, (_, i) => H(g, { coat: ['#8b5a2b', '#555', '#a0703c', '#3a2a1c', '#6b6b6b', '#c9a66b'][i], rider: Object.assign({}, C.war, { s: .95 }) })), jb = H(g, { coat: '#f2efe6', mane: '#bdb7a8', blanket: '#e67e22', rider: Object.assign({}, C.jebe, { holdL: bowMk }) }), tg = tagG(u, 'ONE OF HISTORY\'S GREATEST GENERALS', 50, OR);
  return lt => { sc(lt); rb(lt); arm.forEach((h, i) => { ride(h, lt + i * .37, -200 + lt * 300 + (i % 3) * 150 - Math.floor(i / 3) * 260, 860 + (i % 3) * 50, .75); h.rider.face('d'); }); ride(jb, lt, 700 + lt * 300, 940, .95); jb.rider.face('d'); show(tg, lt, .6, 960, 110, -2); };
});
// ===== 17: Tick reacts =====
S(17, 17, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', clouds: 3 }), rb = ribbon(u), tk = tickG(g), br = mk(g, '<path d="M-60 0 Q-30 -26 0 -8 M30 -8 Q60 -26 90 0" fill="none" stroke="#1a1a1a" stroke-width="12" stroke-linecap="round"/>'), t = bigG(u, 'OKAY. THAT\'S A POWER MOVE.', 92);
  return lt => { sc(lt); rb(lt); tickAt(tk, 960, 1060, .62, pop(lt, .05)); const up = 18 * easeOut(lin(lt, .3, .6)); setT(br, 945, 486 - up, 0, .8); br.setAttribute('opacity', lt > .3 ? 1 : 0); show(t, lt, .4, 960, 150, -2); };
});
// ===== 18-19: Ong Khan fears =====
S(18, 19, (g, u, L) => {
  const sc = scenery(g, { sky: 'grey', hill: HGREY, clouds: 5, wind: 1 }), ong = P(g, C.ong), tem = P(g, C.temY), a = tagG(u, 'TOGHRUL = ONG KHAN', 58, { fill: '#b7950b' }), b = bigG(u, 'BETRAYAL', 140, { fill: '#e2362b' });
  return lt => {
    sc(lt); const t = L(19) - .1;
    stand(ong, 600, 940, 1.1, 1, lt < t ? 'a' : 'f'); ong.mark(lt < t ? 'a' : 's', lt, .5, 9.5);
    stand(tem, 1400, 940, lt < t ? 1 : 1 + .7 * easeIO(lin(lt, t + 1, t + 5)), -1, 'd');
    show(b, lt, .2, 960, 200, -3, t - .2, 1, true); show(a, lt, t + .3, 960, 110, -2);
  };
});
// ===== 20: marriage request: NO =====
S(20, 20, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', sun: [1700, 150], clouds: 3 }), ong = P(g, C.ong), tem = P(g, C.temY), son = P(g, C.son), no = bigG(u, 'NO.', 220, { fill: '#e2362b' });
  return lt => {
    sc(lt); stand(ong, 1350, 940, 1.1, -1, lt < 3 ? 'n' : 'a'); if (lt > 3) { ong.arm('L', -120); ong.arm('R', 120); }
    stand(tem, 560, 940, 1.1, 1, lt < 3.4 ? 'h' : 'a'); tem.arm('R', lt < 3 ? -70 : 0); stand(son, 760, 940, 1, 1, lt < 3.4 ? 'h' : 's');
    show(no, lt, 3.2, 1350, 380, -4, 1e9, 1, true);
  };
});
// ===== 21-23: feast invite -> trap -> herders ride =====
S(21, 23, (g, u, L) => {
  const m = mapG(g), ic = mk(g, ''), fe = mk(ic, '<circle r="70" fill="#fff" stroke="#1a1a1a" stroke-width="7"/>' + '<g transform="translate(0 20) scale(2.2)">' + bowlMk + '</g><path d="M-22 -16 Q-14 -40 -22 -50 M0 -16 Q8 -40 0 -54 M22 -16 Q30 -40 22 -50" stroke="#999" stroke-width="5" fill="none"/>'), tp = mk(ic, '<circle r="70" fill="#ffd84a" stroke="#1a1a1a" stroke-width="7"/><path d="M-46 10 A46 46 0 0 0 46 10 Z" fill="#8e9aa6" stroke="#1a1a1a" stroke-width="6"/><path d="M-40 10 L-30 -10 L-20 10 L-10 -10 L0 10 L10 -10 L20 10 L30 -10 L40 10" fill="none" stroke="#1a1a1a" stroke-width="5"/>');
  const a = tagG(u, 'YOU\'RE INVITED!', 60, { fill: '#b7950b' }), b = bigG(u, "IT'S A TRAP", 140, { fill: '#e2362b' }), rd = [0, 1].map(i => H(g, { coat: i ? '#555' : '#a0703c', rider: C.nomM })), mn = mk(g, '<circle r="44" fill="#f4f1de" stroke="#1a1a1a" stroke-width="5"/>');
  return lt => {
    m.cam(1350, 405, 5.4); TR.forEach(r => m.lbl(r[1], 1)); m.zone('merkits', GREY);
    const p = m.S(ZP.keraites), t22 = L(22) - .1, t23 = L(23) - .1, f = lin(lt, t22, t22 + .5), sx = Math.cos(Math.PI * f);
    setT(ic, p[0], p[1] - 150, 0, Math.abs(sx) * pop(lt, .3), pop(lt, .3)); vis(fe, f < .5); vis(tp, f >= .5);
    show(a, lt, .5, 960, 110, -2, t22 - .2); show(b, lt, t22 + .2, 960, 160, -3, 1e9, 1, true);
    const q = m.S(ZP.mongols), k = lin(lt, t23 + .3, t23 + 4.2);
    rd.forEach((h, i) => { ride(h, lt + i * .4, lerp(p[0] - 40, q[0] - 40, k) - i * 60, lerp(p[1] + 60, q[1] + 40, k) + i * 25, .28); h.g.setAttribute('opacity', lt > t23 ? 1 : 0); h.rider.face('d'); });
    setT(mn, 1700, 160); mn.setAttribute('opacity', lt > t23 ? 1 : 0);
  };
});
// ===== 24: caught anyway, 1203 =====
S(24, 24, (g, u, L) => {
  const sc = scenery(g, { sky: 'storm', hill: HSTORM, clouds: 5, cloudC: '#555c6c', wind: 1 }), tem = H(g, { coat: '#8b5a2b', blanket: '#2f63c9', rider: C.temY }), en = Array.from({ length: 5 }, (_, i) => H(g, { coat: ['#555', '#3a2a1c', '#6b6b6b', '#2b1b10', '#7a5a3a'][i], blanket: '#d4ac0d', rider: Object.assign({}, C.srch, { deel: '#b7950b', holdL: spearMk }) })), y = yearG(u);
  return lt => { sc(lt); ride(tem, lt, 1300 + lt * 60, 900, 1, 1); tem.rider.face('f'); tem.rider.mark('s', lt, .5, 5); en.forEach((h, i) => { ride(h, lt + i * .3, 100 + lt * 150 - i * 170, 860 + (i % 2) * 60, .8); h.rider.face('a'); }); y(lt, .3, '1203'); };
});
// ===== 25-29: Baljuna =====
S(25, 29, (g, u, L) => {
  const sc = scenery(g, { sky: 'grey', hill: HGREY, h: 560, clouds: 5, wind: 1 }), lake = mk(g, '<ellipse rx="560" ry="110" fill="#7a5a32" stroke="#1a1a1a" stroke-width="6"/><ellipse rx="420" ry="70" fill="#8d6a3c"/><path d="M-300 -10 q40 -12 80 0 M100 20 q40 -12 80 0" stroke="#a88456" stroke-width="5" fill="none"/>');
  const men = [C.temY, C.war, C.nomM, C.fst, C.stg, C.jebe].map((c, i) => P(g, Object.assign({}, c, { holdR: i ? bowlMk : '' }))), tm = men[0];
  const nm = tagG(u, 'LAKE BALJUNA', 60, { fill: '#6e4b2a' }), y = yearG(u), st = stampG(u, 'L'), cap = tagG(u, 'LATER WRITERS, NOT THE OLDEST MONGOL CHRONICLE', 36, { fill: '#555' }), hero = bigG(u, 'HEROES OF BALJUNA', 120, { fill: '#ffd84a' });
  const tk = tickG(g), cup = mk(g, cupMk), stars = men.map(() => mk(g, '<path d="M0 -26 L8 -8 L28 -8 L12 4 L18 24 L0 12 L-18 24 L-12 4 L-28 -8 L-8 -8 Z" fill="#ffd84a" stroke="#1a1a1a" stroke-width="4"/>', { opacity: 0 }));
  return lt => {
    sc(lt); setT(lake, 960, 840); const t26 = L(26) - .1, t27 = L(27) - .1, t28 = L(28) - .1, t29 = L(29) - .1;
    const X = [960, 560, 760, 1160, 1360, 1560];
    men.forEach((p, i) => {
      const st2 = lt < t27 ? 's' : lt < t28 ? 'd' : lt < t29 ? (i % 2 ? 'c' : 'd') : 'h';
      stand(p, X[i], 1000 + (i === 0 ? 20 : (i % 2) * 25), i ? .9 : 1.05, i < 3 ? 1 : -1, st2);
      if (i && lt > t28 && lt < t29) p.arm('R', -150 + 10 * Math.sin(lt * 3 + i)); else if (i) p.arm('R', -40);
      if (lt > t26 && lt < t27) p.mark('s', lt, t26 + .1 * i, t27 - .1);
      if (lt > t29) { const hp = p.toParent(0, -150); show(stars[i], lt, t29 + .3 + i * .15, hp[0], hp[1]); }
    });
    if (lt > t27 && lt < t28 + .5) { tm.arm('L', 160); tm.arm('R', -160); } else if (lt > t28) { tm.arm('R', -150); tm.hold('R', bowlMk); tm.free('L'); }
    y(lt, .3, '1203', t26); show(nm, lt, .6, 960, 110, -2, t27 - .3);
    stampShow(st, lt > t27 && lt < t29 ? lt : -1, t27 + 1.2, 1500, 230, 8); show(cap, lt, t27 + 1.8, 960, 110, 0, t28 + 2.4);
    const kt = (lt > t28 + 1.4 && lt < t29 + .2) ? clamp(Math.min(lin(lt, t28 + 1.4, t28 + 1.8), 1 - lin(lt, t29 - .3, t29 + .1))) : 0;
    tickAt(tk, 230, 1060, .38, kt); const reach = lt < t28 + 3 ? 1 : 1 - lin(lt, t28 + 3, t28 + 3.8);
    setT(cup, 330 + 120 * reach, 760 + 30 * (1 - reach), 0, 1.1); cup.setAttribute('opacity', kt > .1 ? 1 : 0);
    show(hero, lt, t29 + .2, 960, 200, -2, 1e9, 1, true);
  };
});
// ===== 30: Ong Khan feasting =====
S(30, 30, (g, u, L) => {
  const sc = scenery(g, { sky: 'night', hill: HNIGHT, stars: 1, clouds: 0 }), fire = fireG(g), ong = P(g, Object.assign({}, C.ong, { holdR: bowlMk })), gs = [C.srch, C.eld].map(c => P(g, Object.assign({}, c, { deel: '#b7950b', holdR: bowlMk }))), tg = tagG(u, '"THE WAR IS OVER!"', 60, { fill: '#b7950b' }), sp = mk(g, '<circle r="50" fill="#e2362b" opacity=".0"/>');
  return lt => { sc(lt); fire.set(960, 960, lt, 1.2); stand(ong, 700, 960, 1.1, 1, 'h', Math.abs(Math.sin(lt * 4)) * 8); ong.arm('R', -140 + 15 * Math.sin(lt * 4)); gs.forEach((p, i) => { stand(p, 1250 + i * 230, 960, 1, -1, 'h', Math.abs(Math.sin(lt * 4 + i)) * 6); p.arm('R', -130); }); show(tg, lt, .5, 960, 110, -2); };
});
// ===== 31-32: surprise attack, Keraites surrender =====
S(31, 32, (g, u, L) => {
  const m = mapG(g), ar = arrowG(g), d = tagG(u, 'DAY AND NIGHT', 60, OR), y = tagG(u, '3 DAYS LATER: SURRENDER', 60, { fill: '#555' }), fl = mk(g, '<rect x="-5" y="-150" width="10" height="150" fill="#6b4423" stroke="#1a1a1a" stroke-width="3"/><path d="M5 -146 Q50 -160 95 -140 Q60 -120 100 -96 Q50 -110 5 -98 Z" fill="#fff" stroke="#1a1a1a" stroke-width="5"/>', { opacity: 0 });
  return lt => {
    m.cam(1350, 405, 5.4); TR.forEach(r => m.lbl(r[1], 1)); m.zone('merkits', GREY); const t32 = L(32) - .1;
    arrowSet(ar, m.S(ZP.mongols), m.S(ZP.keraites), lin(lt, .3, 2.2), 80); m.zone('keraites', mixC('#d4ac0d', RED, lin(lt, t32 + .5, t32 + 1.5)));
    show(d, lt, .4, 960, 110, -2, t32 - .2); show(y, lt, t32 + .3, 960, 110, 2); const p = m.S(ZP.keraites); show(fl, lt, t32 + 1.4, p[0] - 30, p[1] - 30, 0, 1e9, 1 + .05 * Math.sin(lt * 5));
  };
});
// ===== 33: Ong Khan's end (non-graphic) =====
S(33, 33, (g, u, L) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, clouds: 3, wind: 1 }), ong = P(g, C.ong), gd = [0, 1].map(() => P(g, Object.assign({}, C.guard, { deel: '#1f618d', holdR: spearMk }))), pf = poof(g), hat = mk(g, '<path d="M-30 -30 Q-24 -66 0 -68 Q24 -66 30 -30 Z" fill="#b7950b" stroke="#1a1a1a" stroke-width="5"/><rect x="-44" y="-36" width="88" height="26" rx="13" fill="#ecf0f1" stroke="#1a1a1a" stroke-width="5"/>', { opacity: 0 }), tg = tagG(u, '"WHO IS THIS OLD MAN?"', 56, { fill: '#1f618d' });
  return lt => {
    sc(lt); const end = 3.4, x = lerp(300, 1000, lin(lt, 0, 2.6));
    if (lt < 2.6) walkP(ong, lt, x, 940, 1.05, 1, 'f'); else stand(ong, x, 940, 1.05, 1, 'f'); ong.mark('s', lt, .2, end); vis(ong.g, lt < end);
    gd.forEach((p, i) => { stand(p, 1350 + i * 200, 940, 1.05, -1, 'n'); p.mark('?', lt, 1.4 + i * .3, end); });
    show(tg, lt, 1.6, 960, 110, -2); show(pf, lt, end - .2, 1000, 760, 0, end + .7, 1.6); show(hat, lt, end + .3, 1000, 960, 12);
  };
});
// ===== 34: Jamukha disapproves =====
S(34, 34, (g, u, L) => {
  const sc = scenery(g, { sky: 'grey', hill: HGREY, clouds: 4, wind: 1 }), ja = P(g, C.jam), tem = P(g, C.temY), tg = tagG(u, 'JAMUKHA: "I PREFER THE OLD WAY."', 50, { fill: '#b03a2e' });
  return lt => { sc(lt); stand(ja, 1300, 940, 1.15, -1, lt < 1.5 ? 'k' : 'a'); if (lt > 1.5) { ja.arm('L', -100); ja.arm('R', 100); } stand(tem, 600, 940, 1.1, 1, 'd'); ja.mark('a', lt, 2, 6); show(tg, lt, .5, 960, 110, -2); };
});
// ===== 35-36: rivals; the steppe turns red =====
S(35, 36, (g, u, L) => {
  const m = mapG(g), pj = portrait(g, C.jam, 300, 220, 110, '#b03a2e'), pt = portrait(g, C.temY, 1620, 220, 110, RED), vs = bigG(u, 'VS', 120), win = bigG(u, 'TEMÜJIN WINS', 150, { fill: '#ffd84a' });
  const order = ['tatars', 'naimans', 'merkits', 'tayichiud'];
  return lt => {
    m.cam(1340, 405, 4.8 + lt * .03); TR.forEach(r => m.lbl(r[1], 1)); const t36 = L(36) - .1;
    m.zone('keraites', RED); m.zone('merkits', GREY);
    order.forEach((k, i) => { const a = 1 + i * (t36 - 1.5) / 4; const base = k === 'merkits' ? GREY : TR.find(r => r[1] === k)[3]; m.zone(k, mixC(base, RED, lin(lt, a, a + .6))); });
    setT(pj.g, 300, 220, 0, pop(lt, .2) * (lt > t36 ? 1 - .3 * lin(lt, t36, t36 + .5) : 1)); setT(pt.g, 1620, 220, 0, pop(lt, .3) * (lt > t36 ? 1.15 : 1));
    pj.pp.face(lt < t36 ? 'k' : 's'); pt.pp.face(lt < t36 ? 'd' : 'h'); pj.g.setAttribute('opacity', lt > t36 ? .6 : 1);
    show(vs, lt, .5, 960, 160, 0, t36 - .2); show(win, lt, t36 + .1, 960, 960, -2, 1e9, 1, true);
  };
});
// ===== 37-38: Jamukha's end (silhouette, fade) =====
S(37, 38, (g, u, L) => {
  const sc = scenery(g, { sky: 'dusk', hill: HDUSK, sun: [960, 600], sunC: '#ffcf8a', clouds: 2 }), ja = P(g, C.jam), tem = P(g, C.temY), tg = tagG(u, 'THE OLD STORY SAYS...', 56, { fill: '#555' }), q = tagG(u, '"NO BLOOD SPILLED" = A NOBLE\'S DEATH', 48, { fill: '#6e4b2a' }), sh = el('rect', { x: -200, y: -200, width: 2400, height: 1600, fill: '#120c1e', opacity: 0 }, g);
  return lt => {
    sc(lt); const t38 = L(38) - .1;
    stand(tem, 600, 940, 1.1, 1, lt < t38 ? 's' : 'd'); tem.arm('R', lt > t38 + .3 ? -60 : 0);
    const k = lin(lt, t38 + .6, t38 + 2.2); if (k > 0) walkP(ja, lt, 1200 + k * 500, 940, 1.1, 1, 'd'); else stand(ja, 1200, 940, 1.1, -1, 'd');
    ja.g.setAttribute('opacity', (1 - lin(lt, t38 + 1.4, t38 + 2.4)).toFixed(2));
    show(tg, lt, .4, 960, 110, -2, 3); show(q, lt, 3.2, 960, 110, 0, t38 - .2);
    sh.setAttribute('opacity', (.55 * lin(lt, t38, t38 + 1.2)).toFixed(2));
  };
});
// ===== 39-41: 1206 Onon River, Genghis Khan =====
S(39, 41, (g, u, L) => {
  const sc = scenery(g, { sky: 'day', sun: [1650, 150], clouds: 4, h: 600 }), rv = mk(g, '<path d="M-100 640 Q500 610 960 650 T2100 630 L2100 700 Q1500 720 960 705 T-100 700 Z" fill="#2f63c9" stroke="#1a1a1a" stroke-width="5"/>');
  const ban = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(() => mk(g, '<rect x="-5" y="-210" width="10" height="210" fill="#6b4423" stroke="#1a1a1a" stroke-width="3"/><path d="M0 -210 Q-26 -150 0 -110 Q26 -150 0 -210 Z" fill="#f4f1ea" stroke="#1a1a1a" stroke-width="4"/>'));
  const crowd = Array.from({ length: 10 }, (_, i) => P(g, Object.assign({}, [C.nomM, C.tat, C.fst, C.eld, C.war, C.stg, C.tat2, C.nomW, C.eld2, C.srch][i], { deel: TC[i % 6] })));
  const tem = P(g, C.temY), gen = P(g, C.gen), pf = poof(g), y = yearG(u), on = tagG(u, 'ONON RIVER', 56, { fill: '#1f618d' }), big = bigG(u, '1206. GENGHIS KHAN', 118, { fill: '#ffd84a' }), mean = tagG(u, '"UNIVERSAL RULER" (MOST LIKELY)', 56, OR);
  return lt => {
    sc(lt); const t40 = L(40) - .1, t41 = L(41) - .1, sw = 1.4;
    ban.forEach((b, i) => setT(b, 620 + i * 85, 820, 2 * Math.sin(lt * 2 + i)));
    crowd.forEach((p, i) => { const r = Math.floor(i / 5), x = 200 + (i % 5) * 360 + r * 180; stand(p, x, 950 + r * 90, .85, x < 960 ? 1 : -1, lt > t40 + sw ? 'h' : 'n', lt > t40 + sw ? Math.abs(Math.sin(lt * 6 + i)) * 10 : 0); if (lt > t40 + sw) p.arm('R', -150); });
    vis(tem.g, lt < t40 + sw); vis(gen.g, lt >= t40 + sw); stand(tem, 960, 860, 1.05, 1, 'd'); stand(gen, 960, 860, 1.1, 1, lt < t41 ? 'd' : 'n'); show(pf, lt, t40 + sw - .3, 960, 620, 0, t40 + sw + .4, 1.5);
    y(lt, .2, '1206'); show(on, lt, .5, 960, 110, -2, t40 - .2); show(big, lt, t40 + .1, 960, 210, -2, t41 - .1, 1, true); show(mean, lt, t41 + .3, 960, 110, 2);
  };
});
// ===== 42: decimal army =====
S(42, 42, (g, u, L) => {
  el('rect', { x: -200, y: -200, width: 2400, height: 1600, fill: '#f3e3c3' }, g);
  const cols = [[1, 0, 260], [10, 0, 600], [32, 1, 1020], [100, 1, 1560]], lab = ['10', '100', '1,000', '10,000'], grp = [], tg = lab.map(t => tagG(u, t, 64, OR));
  cols.forEach(([n, sm], c) => { const gg = el('g', { opacity: 0 }, g); grp.push(gg); const cnt = c === 0 ? 10 : c === 1 ? 100 : c === 2 ? 400 : 900, per = c === 0 ? 5 : c === 1 ? 10 : 20, sp = c < 2 ? (c ? 26 : 56) : c === 2 ? 17 : 13;
    let h = ''; for (let i = 0; i < cnt; i++) h += `<g transform="translate(${(i % per) * sp} ${Math.floor(i / per) * sp * 1.1})">${soldier(TC[Math.floor(rnd() * 6)])}</g>`; gg.innerHTML = h; grp[c].w = (per - 1) * sp; grp[c].sc = c === 0 ? 1.6 : c === 1 ? .9 : c === 2 ? .7 : .6; });
  const st = stampG(u, 'F'), mx = tagG(u, 'TRIBES MIXED, LOYAL TO HIM', 50, { fill: '#111' });
  return lt => {
    const step = 1.6;
    grp.forEach((gg, c) => { const k = pop(lt, .3 + c * step), x = cols[c][2]; gg.setAttribute('opacity', k > .02 ? 1 : 0); gg.setAttribute('transform', `translate(${x - gg.w * gg.sc / 2} ${330}) scale(${(gg.sc * k).toFixed(3)})`); show(tg[c], lt, .3 + c * step, x, 250, -2); });
    stampShow(st, lt, 5.6, 1600, 900, 8); show(mx, lt, 7, 760, 960, -1);
  };
});
// ===== 43: laws =====
S(43, 43, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', clouds: 3 }), gen = P(g, C.gen), sc2 = mk(g, ''), tg = tagG(u, 'THE LAWS', 64, OR);
  return lt => {
    sc(lt); stand(gen, 520, 960, 1.1, 1, 'd'); gen.arm('R', -100); const k = easeOut(lin(lt, .2, 1.2)), h = 520 * k;
    let s = `<rect x="-230" y="${-h / 2}" width="460" height="${h}" fill="#fbe9c8" stroke="#1a1a1a" stroke-width="6"/>`; for (let i = 0; i < 8; i++) { const yy = -h / 2 + 50 + i * 56; if (yy < h / 2 - 30) s += `<path d="M-180 ${yy} H${-180 + 360 * lin(lt, 1 + i * .12, 1.5 + i * .12)}" stroke="#7a5a2a" stroke-width="8" stroke-linecap="round"/>`; }
    s += `<rect x="-250" y="${-h / 2 - 30}" width="500" height="34" rx="16" fill="#a0703c" stroke="#1a1a1a" stroke-width="6"/><rect x="-250" y="${h / 2 - 4}" width="500" height="34" rx="16" fill="#a0703c" stroke="#1a1a1a" stroke-width="6"/>`;
    sc2.innerHTML = s; setT(sc2, 1200, 560); show(tg, lt, .3, 960, 110, -2);
  };
});
// ===== 44: Mongol script =====
S(44, 44, (g, u, L) => {
  const sc = scenery(g, { sky: 'warm', clouds: 3 }), scr = mk(g, '<rect x="-420" y="-300" width="840" height="560" rx="12" fill="#fbe9c8" stroke="#1a1a1a" stroke-width="6"/>'), ln = [], a = tagG(u, 'UYGHUR ALPHABET', 52, { fill: '#1f618d' }), b = tagG(u, 'MONGOL SCRIPT', 52, OR), ar = arrowG(g), st = stampG(u, 'F');
  for (let i = 0; i < 9; i++) { let d = `M${-320 + i * 80} -240`; for (let j = 0; j < 7; j++) d += ` v28 q${j % 2 ? 18 : -18} 6 0 14`; ln.push(el('path', { d, fill: 'none', stroke: '#2a1a10', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-dasharray': '700', 'stroke-dashoffset': 700 }, scr)); }
  return lt => {
    sc(lt); setT(scr, 960, 600); ln.forEach((p, i) => p.setAttribute('stroke-dashoffset', (700 * (1 - lin(lt, 1.2 + i * .35, 1.9 + i * .35))).toFixed(0)));
    show(a, lt, .3, 520, 140, -2); show(b, lt, 1, 1400, 140, 2); arrowSet(ar, [760, 140], [1150, 140], lin(lt, .5, 1), 0); stampShow(st, lt, 4.4, 1560, 880, 8);
  };
});
// ===== 45-46: one people; teaser =====
S(45, 46, (g, u, L) => {
  const m = mapG(g), op = bigG(u, 'ONE PEOPLE', 150, { fill: '#ffd84a' }), q = [0, 1, 2].map(() => arrowG(g)), qm = mk(g, '<circle r="56" fill="#fff" stroke="#1a1a1a" stroke-width="7"/><text class="t" y="26" text-anchor="middle" font-size="80" fill="#1a1a1a">?</text>', { opacity: 0 }), pg = portrait(g, C.gen, 1700, 860, 120, RED);
  return lt => {
    const t46 = L(46) - .1, z = easeIO(lin(lt, t46, t46 + 2.4));
    m.cam(lerp(1340, 1250, z), lerp(405, 450, z), lerp(5, 1.6, z));
    TR.forEach(r => { m.zone(r[1], mixC(r[1] === 'merkits' ? GREY : r[1] === 'mongols' || r[1] === 'keraites' ? RED : RED, RED, 1)); m.lbl(r[1], 1 - lin(lt, .3, 1)); });
    show(op, lt, .8, 960, 200, -2, t46 - .1, 1, true);
    const c = m.S([1340, 405]); [[1000, 400], [1420, 560], [1660, 520]].forEach((p, i) => arrowSet(q[i], c, m.S(p), lin(lt, t46 + 1.4 + i * .2, t46 + 2.4 + i * .2), 40));
    show(qm, lt, t46 + 2.2, 960, 200, 0); setT(pg.g, 1700, 860, 0, pop(lt, t46 + .4)); pg.pp.face('d');
  };
});

// ---------- per-frame ----------
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
