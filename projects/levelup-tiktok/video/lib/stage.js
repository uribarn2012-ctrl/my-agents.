// LEVEL UP. TikTok series — shared timeline engine.
// A scene file calls Stage.define(cfg). render.js then calls window.SCENE_INIT(assetsUrl, manifest)
// once and window.render(t) for every frame. Everything is a pure function of t (seconds),
// so any frame can be rendered on its own.
(function () {
  const W = 1080, H = 1920, PW = 572, PH = 1201, SW = 540, SH = 1169;
  const K = SW / 390;                 // demo CSS px -> phone screen px
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, p) => a + (b - a) * p;

  // ---- easing: springs as Apple describes them (damping ratio + response), plus a few curves ----
  function springFn(z, resp) {
    const w = 2 * Math.PI / resp;
    if (z >= 1) return t => 1 - (1 + w * t) * Math.exp(-w * t);
    const wd = w * Math.sqrt(1 - z * z);
    return t => 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
  }
  // spring over a segment of length D: settles exactly on 1 at the end (tiny linear correction)
  const springSeg = (z, resp, D) => { const f = springFn(z, resp), end = f(D); return p => f(p * D) + (1 - end) * p; };
  const E = {
    lin: p => p,
    io: p => -(Math.cos(Math.PI * p) - 1) / 2,                       // gentle, for slow camera drifts
    ioc: p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    in: p => p * p * p,
    out: p => 1 - Math.pow(1 - p, 3),
  };
  const crit = r => springFn(1, r);   // critically damped, no overshoot

  // ---- camera: keys {t, ease, ...state}. State: the demo point (u,v) sits at frame (fx,fy). ----
  const BASE = { u: 195, v: 422, fx: 540, fy: 1130, s: 1, rx: 0, ry: 0, rz: 0, z: 0, hover: 0, dim: 0, show: 1 };
  const PROPS = Object.keys(BASE);
  function resolveKeys(keys) {
    let cur = { ...BASE }; return keys.map(k => { cur = { ...cur, ...k }; return cur; });
  }
  function camAt(keys, t) {
    let i = 0; while (i + 1 < keys.length && keys[i + 1].t <= t) i++;
    const a = keys[i], b = keys[i + 1];
    if (!b || b.ease === 'cut' || t < a.t) return a;
    const D = b.t - a.t, p = clamp((t - a.t) / D);
    const e = Array.isArray(b.ease) ? springSeg(b.ease[0], b.ease[1], D) : (E[b.ease] || E.io);
    const q = e(p), out = {};
    PROPS.forEach(k => { out[k] = k === 'show' ? a[k] : lerp(a[k], b[k], q); });
    return out;
  }

  // ---- DOM ----
  function sbHTML() {
    return `<div class="sb light"><span class="tm">9:41</span><span class="ic"><span class="sig">${[6, 9, 12, 15].map(h => `<i style="height:${h}px"></i>`).join('')}</span>
      <svg width="24" height="17" viewBox="0 0 24 17"><path d="M12 15.5l3.2-3.6a4.6 4.6 0 0 0-6.4 0z M5.5 8.6l2 2.2a6.4 6.4 0 0 1 9 0l2-2.2a9.4 9.4 0 0 0-13 0z M1.5 4.6l2 2.2a12.2 12.2 0 0 1 17 0l2-2.2a15.2 15.2 0 0 0-21 0z" fill="currentColor"/></svg>
      <span class="bat"><i></i></span></span></div>`;
  }
  function faceHTML(cls) {
    return `<div class="face ${cls}">
      <i class="btn" style="left:-4px;top:250px;height:60px"></i><i class="btn" style="left:-4px;top:340px;height:110px"></i><i class="btn" style="left:-4px;top:470px;height:110px"></i><i class="btn" style="right:-4px;top:370px;height:170px"></i>
      <div class="screen"><img class="shot" alt=""><div class="island"></div>${sbHTML()}<div class="taps"></div><div class="glare"></div></div></div>`;
  }

  let cfg, assets, man, els = {}, faces = {}, titleEls = [];

  function build() {
    document.body.innerHTML = `<div id="frame">
      <div id="world"><div id="rig">${faceHTML('front')}${faceHTML('back')}<div class="edge l"></div><div class="edge r"></div></div></div>
      <div id="scrim"></div><div id="dim"></div>
      <div id="titles"></div>
      <div id="note"><span></span></div>
      <div id="sting"><div class="line"></div><div class="logo">LEVEL UP<span class="dot">.</span></div></div>
      <div id="endcard"><div class="logo">LEVEL UP<span class="dot" style="color:var(--lime)">.</span></div><div class="link"></div><div class="sub"></div></div>
      <div id="flash"></div></div>`;
    const $ = s => document.querySelector(s);
    els = { rig: $('#rig'), world: $('#world'), dim: $('#dim'), scrim: $('#scrim'), flash: $('#flash'), sting: $('#sting'), end: $('#endcard'), note: $('#note') };
    ['front', 'back'].forEach(side => {
      const f = document.querySelector('.face.' + side);
      faces[side] = { img: f.querySelector('img.shot'), sb: f.querySelector('.sb'), taps: f.querySelector('.taps'), glare: f.querySelector('.glare'), src: '' };
    });
    if (cfg.endcard) { els.end.querySelector('.link').textContent = cfg.endcard.link; els.end.querySelector('.sub').innerHTML = cfg.endcard.sub; }
    // note: one {t0,t1,text,top?} or a list of them (each range can sit at its own height)
    if (cfg.note) { cfg.notes = [].concat(cfg.note); els.note.querySelector('span').textContent = cfg.notes[0].text; }
    if (cfg.statusTimeRight) document.querySelectorAll('.sb').forEach(s => s.style.flexDirection = 'row-reverse');
    // titles
    const root = document.querySelector('#titles');
    titleEls = cfg.titles.map(ti => {
      const d = document.createElement('div'); d.className = 'title'; if (ti.top) d.style.top = ti.top + 'px';
      ti.parts.forEach(p => { const e = document.createElement('div'); e.className = 'part'; e.innerHTML = p.html; d.appendChild(e); });
      root.appendChild(d); return d;
    });
    // taps
    cfg.taps.forEach(tp => { const e = document.createElement('div'); e.className = 'tap'; e.style.opacity = 0;
      const [u, v] = Array.isArray(tp.at) ? tp.at : man.taps[tp.at]; e.style.left = u * K + 'px'; e.style.top = v * K + 'px';
      faces[tp.side || 'front'].taps.appendChild(e); tp.el = e; });
  }

  // ---- screens ----
  function srcFor(spec, t) {
    if (!spec) return '';
    if (spec.still) return `${assets}/${spec.still}.jpg`;
    const n = man.frames[spec.clip], i = clamp(Math.floor((t - spec.start) * 30 + 1e-6), 0, n - 1);
    return `${assets}/${spec.clip}/${String(i).padStart(4, '0')}.jpg`;
  }
  async function setScreens(t) {
    const sc = cfg.screens.find(s => t >= s.t0 && t < s.t1);
    const jobs = [];
    ['front', 'back'].forEach(side => {
      const spec = sc && sc[side], f = faces[side], src = srcFor(spec, t);
      if (spec && spec.sb) { f.sb.classList.toggle('dark', spec.sb === 'dark'); f.sb.classList.toggle('light', spec.sb !== 'dark'); }
      if (src && src !== f.src) { f.src = src; f.img.src = src; jobs.push(f.img.decode().catch(() => {})); }
      f.img.style.visibility = src ? 'visible' : 'hidden';
    });
    await Promise.all(jobs);
  }

  // ---- type animations ----
  function animPart(el, anim, a, gap) {
    if (anim === 'words') {
      const ws = el.querySelectorAll('.w'); el.style.opacity = 1; el.style.transform = ''; el.style.filter = '';
      ws.forEach((w, k) => { const b = a - k * (gap || .3), e = clamp(crit(.42)(Math.max(0, b)));
        w.style.opacity = clamp(b / .16); w.style.transform = `translateY(${(1 - e) * 46}px)`; w.style.filter = `blur(${(1 - e) * 9}px)`; });
      return;
    }
    if (anim === 'land') {             // big (120%) -> normal in 0.2 s, then a small shake
      const p = clamp(a / .2), sc = 1.2 - .2 * E.out(p);
      let x = 0; if (a > .2 && a < .44) x = Math.sin((a - .2) * Math.PI * 2 * 22) * 8 * (1 - (a - .2) / .24);
      el.style.opacity = clamp(a / .06); el.style.transform = `translateX(${x}px) scale(${sc})`; el.style.filter = '';
      return;
    }
    // 'slide': rises from below and sharpens out of a blur
    const e = clamp(crit(.5)(Math.max(0, a)));
    el.style.opacity = clamp(a / .22); el.style.transform = `translateY(${(1 - e) * 64}px)`; el.style.filter = `blur(${(1 - e) * 14}px)`;
  }
  function renderTitles(t) {
    cfg.titles.forEach((ti, i) => {
      const d = titleEls[i], on = t >= ti.t0 && t < ti.t1;
      d.style.display = on ? 'block' : 'none'; if (!on) return;
      const exit = clamp((ti.t1 - t) / .1);                         // 0.1 s fade on the cut
      d.style.opacity = exit;
      ti.parts.forEach((p, k) => {
        const el = d.children[k], a = t - ti.t0 - (p.d || 0);
        if (a < 0) { el.style.opacity = 0; el.querySelectorAll('.w').forEach(w => w.style.opacity = 0); return; }
        animPart(el, p.anim || ti.anim, a, p.gap || ti.gap);
        el.querySelectorAll('.count').forEach(c => { const dur = +c.dataset.dur || .8; c.textContent = Math.round(+c.dataset.to * E.out(clamp(a / dur))); });
      });
    });
  }

  // ---- series logo sting and end card ----
  function renderSting(t) {
    const s = cfg.sting, on = s && t >= s[0] && t < s[1];
    els.sting.style.display = on ? 'block' : 'none'; if (!on) return;
    const a = t - s[0], line = els.sting.querySelector('.line'), logo = els.sting.querySelector('.logo'), dot = logo.querySelector('.dot');
    line.style.width = 780 * E.ioc(clamp(a / .26)) + 'px';
    line.style.opacity = 1 - clamp((a - .32) / .2);
    const b = a - .2, e = b > 0 ? springFn(.72, .34)(b) : 0;       // the logo pops out of the line (a little bounce)
    logo.style.opacity = clamp(b / .08);
    logo.style.transform = `translateY(${(1 - e) * 60}px) scale(${.88 + .12 * e})`;
    const lit = a >= .55; dot.style.color = lit ? 'var(--lime)' : '#fff'; dot.style.textShadow = lit ? `0 0 ${40 * (1 - clamp((a - .55) / .3)) + 14}px rgba(198,255,0,.75)` : 'none';
  }
  function renderEnd(t) {
    const c = cfg.endcard, on = c && t >= c.t0;
    els.end.style.display = on ? 'block' : 'none'; if (!on) return;
    const a = t - c.t0;
    [['.logo', 0], ['.link', .28], ['.sub', .5]].forEach(([sel, d]) => {
      const el = els.end.querySelector(sel), b = a - d, e = b > 0 ? clamp(crit(.55)(b)) : 0;
      el.style.opacity = clamp(b / .25); el.style.transform = `translateY(${(1 - e) * 40}px)`; el.style.filter = `blur(${(1 - e) * 10}px)`;
    });
  }

  async function render(t) {
    await setScreens(t);
    // camera
    const c = camAt(cfg.cam, t), hv = c.hover;
    const fy = c.fy + Math.sin(t * 2 * Math.PI / 3.4) * 9 * hv;
    const rz = c.rz + Math.sin(t * 2 * Math.PI / 4.3) * .5 * hv, ry = c.ry + Math.sin(t * 2 * Math.PI / 5.1) * 1.4 * hv;
    const cx = c.fx - (c.u - 195) * K * c.s, cy = fy - (c.v - 422) * K * c.s;
    els.rig.style.transform = `translate3d(${cx - PW / 2}px,${cy - PH / 2}px,${c.z}px) rotateX(${c.rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${c.s})`;
    els.world.style.display = c.show ? 'block' : 'none';
    els.dim.style.opacity = c.dim;
    const gp = 50 + (((ry % 360) + 540) % 360 - 180) * 1.6;          // glare slides as the phone turns
    faces.front.glare.style.backgroundPosition = faces.back.glare.style.backgroundPosition = `${gp}% 0`;
    // taps
    cfg.taps.forEach(tp => { const a = t - tp.t;
      if (a < -.12 || a > .5) { tp.el.style.opacity = 0; return; }
      if (a < 0) { tp.el.style.opacity = .9 * (1 + a / .12); tp.el.style.transform = 'scale(.55)'; return; }
      tp.el.style.opacity = .9 * (1 - a / .5); tp.el.style.transform = `scale(${.55 + .95 * E.out(a / .5)})`; });
    renderTitles(t); renderSting(t); renderEnd(t);
    const n = (cfg.notes || []).find(x => t >= x.t0 && t < x.t1); els.note.style.display = n ? 'block' : 'none';
    if (n) { els.note.querySelector('span').textContent = n.text; els.note.style.top = (n.top || 1468) + 'px';
      els.note.style.opacity = clamp((t - n.t0) / .25) * clamp((n.t1 - t) / .1); }
    els.flash.style.opacity = (cfg.flashes || []).some(([a, b]) => t >= a && t < b) ? 1 : 0;
  }

  window.Stage = { define(c) { cfg = c; cfg.cam = resolveKeys(c.cam); } };
  window.SCENE_INIT = async (assetsUrl, manifest) => {
    assets = assetsUrl; man = manifest; build(); await document.fonts.ready;
    await Promise.all([...document.fonts].map(f => f.load().catch(() => {})));
    return { duration: cfg.duration, fps: cfg.fps || 30 };
  };
  window.render = render;
})();
