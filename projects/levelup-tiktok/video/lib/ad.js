// LEVEL UP. short ads — "style B" engine (front-facing phone, drifting green glows,
// two-line titles, redrawn dark app screens, neon full-screen beats, icon end card).
//
// A scene calls Ad.define({ duration, dict: {en:{...}, he:{...}}, screens(T), beats, phone, ... }).
// render.js calls SCENE_INIT(assetsUrl, manifest, {lang}) once, then render(t) per frame.
// Everything is a pure function of t, so any frame renders on its own.
//
// Declarative attributes inside scene markup (all times in seconds):
//   data-show="t0,t1"      element visible between t0 and t1 (0.3 s cross-fade, slight rise)
//   data-in="t" [data-out="t"] [data-anim="rise|fade|pop|sheet|grow"] [data-h="px" for grow]
//   data-type="t0,t1"      types the element's data-text from t0 to t1 (data-caret shows a caret)
//   data-count="from,to,t0,t1[,decimals]"
//   data-flash="t"         green highlight that fades out (new row)
//   data-tap="t"           soft finger-tap circle (position it with left/top)
//   data-dots="t0,t1"      "thinking" dots
(function () {
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  function springFn(z, resp) {
    const w = 2 * Math.PI / resp;
    if (z >= 1) return t => (t <= 0 ? 0 : 1 - (1 + w * t) * Math.exp(-w * t));
    const wd = w * Math.sqrt(1 - z * z);
    return t => (t <= 0 ? 0 : 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)));
  }
  const crit = r => springFn(1, r);
  const E = { lin: p => p, io: p => -(Math.cos(Math.PI * p) - 1) / 2, out: p => 1 - Math.pow(1 - p, 3), in: p => p * p * p };
  const mix = (c1, c2, p) => c1.map((v, i) => Math.round(lerp(v, c2[i], p)));
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;

  let C, T, LANG, assets, neonCol = null, neonK = 0, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const ZONES = { 1: '#9AA7B8', 2: '#3AA0FF', 3: '#3CEB5F', 4: '#FFB020', 5: '#FF3B4E' };

  // ---------- build ----------
  function build() {
    document.body.className = LANG === 'he' ? 'he' : 'en';
    document.documentElement.lang = LANG; document.documentElement.dir = 'ltr';
    const ttl = C.beats.map((b, i) => `<div class="ttl" id="ttl${i}" dir="${LANG === 'he' ? 'rtl' : 'ltr'}">
        <span class="l1">${T[b.l1] || ''}</span>${b.l2 ? `<span class="l2"><span>${T[b.l2]}</span></span>` : ''}${b.sub ? `<span class="sub">${T[b.sub]}</span>` : ''}</div>`).join('');
    document.body.innerHTML = `<div id="frame">
      <div id="bg"><i></i><i></i><i></i></div>
      <div id="phone"><i class="btn" style="left:-5px;top:250px;height:64px"></i><i class="btn" style="left:-5px;top:345px;height:112px"></i><i class="btn" style="left:-5px;top:475px;height:112px"></i><i class="btn" style="right:-5px;top:380px;height:170px"></i>
        <div id="screen"><div class="island"></div><div class="sbar"><span>9:41</span><b>•••</b></div>${C.screens(T, LANG)}</div></div>
      ${C.layers ? C.layers(T, LANG) : ''}
      ${C.neon ? neonHTML() : ''}
      ${C.end ? `<div class="beat" id="end"><div class="icon"><img src="${assets}/appicon.png" alt=""></div>
        <div class="word">LEVEL UP<span>.</span></div><div class="tag" dir="${LANG === 'he' ? 'rtl' : 'ltr'}">${T[C.end.tag]}</div><div class="link" dir="${LANG === 'he' ? 'rtl' : 'ltr'}">${T[C.end.link] || ''}</div></div>` : ''}
      ${ttl}
      <div id="note"><span dir="${LANG === 'he' ? 'rtl' : 'ltr'}">${T.sample || ''}</span></div>
    </div>`;
  }

  // ---------- background glows ----------
  function renderBg(t) {
    let tint = C.tint ? C.tint(t) : [34, 150, 60];
    if (neonCol) tint = mix(tint, neonCol.map(v => v * .75), neonK);
    $('#frame').style.setProperty('--glow', rgb(tint));
    const blobs = $$('#bg i'), k = C.glow ? C.glow(t) : 1;
    const base = [[220, 1450, .9], [900, 520, .7], [560, 1900, .8]];
    blobs.forEach((b, i) => { const [x, y, o] = base[i], ph = i * 2.1;
      b.style.transform = `translate(${x + Math.sin(t * .23 + ph) * 120}px,${y + Math.cos(t * .19 + ph) * 140}px) scale(${1 + Math.sin(t * .3 + ph) * .08})`;
      b.style.opacity = (.30 * o * k).toFixed(3); });
  }

  // ---------- titles: blur + fade in, blur + fade out ----------
  function renderTitles(t) {
    C.beats.forEach((b, i) => {
      const el = $('#ttl' + i), on = t >= b.t0 - .01 && t < b.t1;
      el.style.display = on ? 'block' : 'none'; if (!on) return;
      if (b.top) el.style.top = b.top + 'px';
      const out = clamp((b.t1 - t) / .32);
      [['.l1', 0], ['.l2', .14], ['.sub', .3]].forEach(([s, d]) => { const e = el.querySelector(s); if (!e) return;
        const a = t - b.t0 - d, p = clamp(crit(.55)(a)), o = clamp(a / .3) * out;
        e.style.opacity = o; e.style.transform = `translateY(${(1 - p) * 26 - (1 - out) * 10}px)`;
        e.style.filter = `blur(${(1 - p) * 16 + (1 - out) * 14}px)`; });
    });
  }

  // ---------- phone keys {t, y, s, o, ease} ----------
  function renderPhone(t) {
    const K = C.phone; let i = 0; while (i + 1 < K.length && K[i + 1].t <= t) i++;
    const a = K[i], b = K[i + 1]; let st = a;
    if (b && t >= a.t) { const D = b.t - a.t, p = clamp((t - a.t) / D);
      let q; if (Array.isArray(b.ease)) { const f = springFn(b.ease[0], b.ease[1]), e = f(D); q = f(p * D) + (1 - e) * p; } else q = (E[b.ease] || E.io)(p);
      st = { y: lerp(a.y, b.y, q), s: lerp(a.s ?? 1, b.s ?? 1, q), o: lerp(a.o ?? 1, b.o ?? 1, q) }; }
    const ph = $('#phone'), float = Math.sin(t * 2 * Math.PI / 4.2) * 5;
    ph.style.transform = `translateY(${st.y + float}px) scale(${st.s ?? 1})`; ph.style.transformOrigin = '50% 0';
    ph.style.opacity = st.o ?? 1; ph.style.display = (st.o ?? 1) <= 0.001 ? 'none' : 'block';
  }

  // ---------- declarative element animations ----------
  const nums = s => s.split(',').map(Number);
  function renderAttrs(t) {
    $$('[data-show]').forEach(el => { const [a, b] = nums(el.dataset.show), fi = clamp((t - a) / .3), fo = clamp((b - t) / .3);
      const on = t >= a && t < b; el.style.display = on ? '' : 'none'; if (!on) return;
      el.style.opacity = Math.min(fi, fo); el.style.transform = `translateY(${(1 - E.out(fi)) * 20}px)`; });
    $$('[data-in]').forEach(el => {
      const a = t - +el.dataset.in, anim = el.dataset.anim || 'rise', out = el.dataset.out ? +el.dataset.out : 1e9;
      if (a < 0) { el.style.opacity = 0; if (anim === 'grow') { el.style.height = '0px'; el.style.marginTop = el.style.marginBottom = '-5px'; } if (anim === 'sheet') el.style.transform = 'translateY(105%)'; return; }
      const p = clamp(crit(anim === 'sheet' ? .5 : .42)(a)), o = clamp(a / .2);
      if (anim === 'sheet') { const q = t >= out ? E.in(clamp((t - out) / .32)) : 0;
        el.style.opacity = 1; el.style.transform = `translateY(${((1 - p) + q) * 105}%)`; return; }
      const fo = t >= out ? 1 - clamp((t - out) / .2) : 1;
      if (anim === 'pop') { const s = springFn(.7, .38)(a); el.style.opacity = o * fo; el.style.transform = `scale(${.85 + .15 * s})`; return; }
      if (anim === 'fade') { el.style.opacity = o * fo; return; }
      if (anim === 'grow') { const h = +el.dataset.h; el.style.height = h * p + 'px'; el.style.marginTop = el.style.marginBottom = (-5 * (1 - p)) + 'px'; el.style.opacity = clamp((a - .08) / .2) * fo; el.style.transform = `translateY(${(1 - p) * 10}px)`; return; }
      el.style.opacity = o * fo; el.style.transform = `translateY(${(1 - p) * 18}px)`;
    });
    $$('[data-type]').forEach(el => { const [a, b] = nums(el.dataset.type), chars = Array.from(el.dataset.text);
      const n = Math.round(chars.length * clamp((t - a) / (b - a))); const typing = t >= a - .3 && t < b + .25;
      el.innerHTML = chars.slice(0, n).join('').replace(/&/g, '&amp;').replace(/</g, '&lt;') + (el.dataset.caret !== undefined && typing && (Math.floor(t * 2.6) % 2 === 0 || t < b) ? '<i class="caret"></i>' : ''); });
    $$('[data-count]').forEach(el => { const [f, to, a, b, d] = nums(el.dataset.count), v = lerp(f, to, E.out(clamp((t - a) / (b - a)))); el.textContent = v.toFixed(d || 0); });
    $$('[data-flash]').forEach(el => { const a = t - +el.dataset.flash, k = a < 0 ? 0 : Math.max(0, 1 - a / 1.4);
      el.style.boxShadow = k ? `inset 0 0 0 ${1.5}px rgba(60,235,95,${.9 * k}), 0 0 ${18 * k}px rgba(60,235,95,${.45 * k})` : ''; el.style.background = k ? `rgba(60,235,95,${.16 * k})` : ''; });
    $$('[data-tap]').forEach(el => { const a = t - +el.dataset.tap;
      if (a < -.15 || a > .55) { el.style.opacity = 0; return; }
      if (a < 0) { el.style.opacity = .9 * (1 + a / .15); el.style.transform = 'scale(.7)'; return; }
      el.style.opacity = .9 * (1 - a / .55); el.style.transform = `scale(${.7 + .8 * E.out(a / .55)})`; });
    $$('[data-dots]').forEach(el => { const [a, b] = nums(el.dataset.dots); [...el.children].forEach((d, i) => {
      const y = Math.max(0, Math.sin((t - a) * 9 - i * .9)); d.style.transform = `translateY(${-y * 4}px)`; d.style.opacity = .45 + .55 * y; }); });
  }

  // ---------- neon beat: glowing stick figure + heart + BPM + zone + ECG ----------
  function neonHTML() {
    const n = C.neon, dir = LANG === 'he' ? 'rtl' : 'ltr';
    return `<div class="beat" id="neon">
      <div style="position:absolute;left:0;right:0;top:215px;text-align:center;font-weight:600;font-size:40px;color:#E6E9EC" dir="${dir}">${T[n.kicker]}</div>
      <div style="position:absolute;left:60px;right:60px;top:275px;text-align:center;white-space:nowrap;font-weight:800;font-size:${LANG === 'he' ? 108 : 100}px;line-height:1;letter-spacing:${LANG === 'he' ? '-.01em' : '-.035em'};text-transform:uppercase" dir="${dir}">${T[n.name]}</div>
      <div id="nSet" style="position:absolute;left:0;right:0;top:405px;text-align:center;font-weight:800;font-size:34px;letter-spacing:${LANG === 'he' ? '.02em' : '.16em'};color:#D9DDE1" dir="${dir}"></div>
      <svg id="nFig" width="1080" height="640" viewBox="0 0 1080 640" style="position:absolute;left:0;top:480px;overflow:visible">
        <defs><filter id="glw" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" result="b1"/><feGaussianBlur in="SourceGraphic" stdDeviation="34" result="b2"/>
          <feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        <line id="nGround" x1="300" y1="590" x2="780" y2="590" stroke-width="5" opacity=".55"/>
        <g id="nBody" filter="url(#glw)" fill="none" stroke-linecap="round" stroke-linejoin="round"></g></svg>
      <div style="position:absolute;left:0;right:0;top:1100px;display:flex;justify-content:center;align-items:center;gap:26px;direction:ltr">
        <svg id="nHeart" width="130" height="118" viewBox="0 0 24 22" style="overflow:visible"><path d="M12 21.3 2.6 12.1A5.9 5.9 0 0 1 12 4.6a5.9 5.9 0 0 1 9.4 7.5z"/></svg>
        <div id="nBpm" style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:200px;letter-spacing:-.05em;line-height:1;min-width:330px;text-align:center"></div>
        <div style="font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:34px;letter-spacing:.2em;color:#E6E9EC;margin-top:60px">BPM</div></div>
      <div style="position:absolute;left:0;right:0;top:1312px;text-align:center"><span id="nZone" dir="${dir}" style="display:inline-block;font-weight:800;font-size:36px;letter-spacing:${LANG === 'he' ? '0' : '.12em'};padding:8px 30px;border-radius:40px;color:#04121f"></span></div>
      <svg id="nEcg" width="1080" height="180" viewBox="0 0 1080 180" style="position:absolute;left:0;top:1520px;overflow:visible"><path id="nEcgP" fill="none" stroke-width="5" stroke-linejoin="round" filter="url(#glw)"/></svg>
    </div>`;
  }
  // side-view squat (goblet): depth q in 0..1
  function squatPose(q) {
    const u = 118, r = d => d * Math.PI / 180;
    const ank = [575, 590], a1 = r(32 * q), knee = [ank[0] + u * Math.sin(a1), ank[1] - u * Math.cos(a1)];
    const a2 = r(8 + 68 * q), hip = [knee[0] - u * 1.02 * Math.sin(a2), knee[1] - u * 1.02 * Math.cos(a2)];
    const a3 = r(4 + 30 * q), sh = [hip[0] + u * 1.12 * Math.sin(a3), hip[1] - u * 1.12 * Math.cos(a3)];
    const head = [sh[0] + 40 * Math.sin(a3) + 6, sh[1] - 54 * Math.cos(a3)];
    const elb = [sh[0] + 50 + 8 * q, sh[1] + 56], hand = [elb[0] + 5, elb[1] - 62];
    return { ank, knee, hip, sh, head, elb, hand, toe: [ank[0] + 50, ank[1]] };
  }
  function renderNeon(t) {
    const n = C.neon, el = $('#neon'), on = t >= n.t0 && t < n.t1; neonCol = null; if (!el) return;
    el.style.display = on ? 'block' : 'none'; if (!on) return;
    const a = t - n.t0, fin = clamp(a / .35), fout = clamp((n.t1 - t) / .3); el.style.opacity = Math.min(fin, fout);
    const bpmF = lerp(n.bpm[0], n.bpm[1], E.io(clamp(a / (n.t1 - n.t0 - .4)))), bpm = Math.round(bpmF);
    const zone = n.zones.reduce((z, [lo, zz]) => (bpm >= lo ? zz : z), 1);
    // the colour slides into the next zone's colour over the last 4 BPM before the threshold
    let col = hex(ZONES[zone]);
    n.zones.forEach(([lo, zz]) => { if (bpmF >= lo - 4 && bpmF < lo && ZONES[zz - 1]) col = mix(hex(ZONES[zz - 1]), hex(ZONES[zz]), clamp((bpmF - (lo - 4)) / 4)); });
    const c = rgb(col);
    neonCol = col; neonK = Math.min(fin, fout);
    const period = n.period || 1.7, ph = (a + .2) / period, q = (1 - Math.cos(2 * Math.PI * ph)) / 2;
    const P = squatPose(q), L = (p1, p2, w) => `<line x1="${p1[0]}" y1="${p1[1]}" x2="${p2[0]}" y2="${p2[1]}" stroke-width="${w}"/>`;
    const body = $('#nBody'); body.setAttribute('stroke', c);
    body.innerHTML = L(P.ank, P.toe, 26) + L(P.ank, P.knee, 30) + L(P.knee, P.hip, 32) + L(P.hip, P.sh, 34) + L(P.sh, P.elb, 26) + L(P.elb, P.hand, 24)
      + `<circle cx="${P.hand[0] + 6}" cy="${P.hand[1] - 4}" r="20" fill="${c}" stroke="none" opacity=".9"/><circle cx="${P.head[0]}" cy="${P.head[1]}" r="34" fill="${c}" stroke="none"/>`;
    $('#nGround').setAttribute('stroke', c);
    const rep = Math.floor(ph) + 1;
    $('#nSet').textContent = (T[n.setFmt] || '').replace('%s', n.set).replace('%r', rep);
    $('#nBpm').textContent = bpm;
    const beatLen = 60 / bpm, bp = ((a % beatLen) / beatLen), pulse = 1 + .12 * Math.exp(-bp * 7);
    const h = $('#nHeart'); h.style.fill = c; h.style.transform = `scale(${pulse})`; h.style.filter = `drop-shadow(0 0 22px ${c})`;
    const z = $('#nZone'); z.textContent = (T[n.zoneFmt] || 'ZONE %z').replace('%z', zone); z.style.background = c; z.style.boxShadow = `0 0 30px ${c}`;
    // ECG: one PQRST per heartbeat, scrolling left
    const px = 300 * beatLen / .75, off = (a / beatLen) * px % px; let d = '';
    for (let x0 = -px - off; x0 < 1080 + px; x0 += px) {
      const s = px / 300, y = 110;
      d += `${d ? 'L' : 'M'}${x0},${y} L${x0 + 60 * s},${y} Q${x0 + 75 * s},${y - 14} ${x0 + 90 * s},${y} L${x0 + 110 * s},${y} L${x0 + 120 * s},${y + 14} L${x0 + 135 * s},${y - 92} L${x0 + 150 * s},${y + 34} L${x0 + 162 * s},${y} L${x0 + 200 * s},${y} Q${x0 + 225 * s},${y - 26} ${x0 + 250 * s},${y} `;
    }
    const e = $('#nEcgP'); e.setAttribute('d', d); e.setAttribute('stroke', c);
  }

  // ---------- end card ----------
  function renderEnd(t) {
    const el = $('#end'); if (!el) return; const a = t - C.end.t0, on = a >= 0; el.style.display = on ? 'block' : 'none'; if (!on) return;
    const ic = el.querySelector('.icon'), s = springFn(.62, .42)(a); ic.style.opacity = clamp(a / .15); ic.style.transform = `scale(${.4 + .6 * s})`;
    [['.word', .28], ['.tag', .5], ['.link', .68]].forEach(([sel, d]) => { const e = el.querySelector(sel), b = a - d, p = clamp(crit(.55)(b));
      e.style.opacity = clamp(b / .3); e.style.filter = `blur(${(1 - p) * 16}px)`; e.style.transform = `translateY(${(1 - p) * 22}px)`; });
  }

  async function render(t) {
    renderNeon(t); renderBg(t); renderPhone(t); renderAttrs(t); renderTitles(t); renderEnd(t);
    const nt = (C.notes || []).find(([a, b]) => t >= a && t < b), ne = $('#note');
    ne.style.display = nt ? 'block' : 'none'; if (nt) ne.style.top = (nt[2] || 1480) + 'px'; if (nt) ne.style.opacity = Math.min(clamp((t - nt[0]) / .3), clamp((nt[1] - t) / .3));
    if (C.extra) C.extra(t);
  }

  window.Ad = { define(c) { C = c; }, clamp, lerp, E, springFn };
  window.SCENE_INIT = async (assetsUrl, manifest, opts = {}) => {
    LANG = opts.lang || C.langs?.[0] || 'en'; T = C.dict[LANG]; assets = assetsUrl; build();
    await document.fonts.ready; await Promise.all([...document.fonts].map(f => f.load().catch(() => {})));
    await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
    return { duration: C.duration, fps: C.fps || 30 };
  };
  window.render = render;
})();
