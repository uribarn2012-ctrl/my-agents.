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
