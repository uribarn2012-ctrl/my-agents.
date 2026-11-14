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

