// Rendering of creatures (procedural body plans from genes, one instanced mesh per species),
// glowing dots when far away, plants, nests, selection ring and lightning flashes.
import * as THREE from 'three';
import { surfaceRadius } from './world.js';
import { legCount, hsl } from './sim.js';

// ---- true-ish scale: a creature is ~0.0015 planet radii long ----
export const BODY_S = 0.0006;   // instance scale of a size-1 creature (body ≈ 2.5 units long)
const PLANT_S = 0.00042, NEST_S = 0.00068;
const BODY_ALT = 0.09;          // real bodies drawn below this camera altitude
const BODY_DIST = 0.32;         // ...and only for creatures this close to the camera
const MAXP = 6000, MAXN = 1000, MAXDOT = 4000;

const _m = new THREE.Matrix4(), _c = new THREE.Color(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _p = new THREE.Vector3();
const lin = (rgb) => { _c.setRGB(rgb[0], rgb[1], rgb[2], THREE.SRGBColorSpace); return [_c.r, _c.g, _c.b]; };
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

// merge indexed geometries, baking a vertex color per part (colFn(localPos) -> linear rgb)
function mergeColored(parts) {
  let nv = 0, ni = 0;
  for (const { g } of parts) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nrm = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = new Uint32Array(ni);
  let ov = 0, oi = 0;
  for (const { g, col: cf } of parts) {
    const P = g.attributes.position, N = g.attributes.normal, n = P.count;
    pos.set(P.array, ov * 3); nrm.set(N.array, ov * 3);
    for (let i = 0; i < n; i++) {
      const c = typeof cf === 'function' ? cf(P.getX(i), P.getY(i), P.getZ(i)) : cf;
      col[(ov + i) * 3] = c[0]; col[(ov + i) * 3 + 1] = c[1]; col[(ov + i) * 3 + 2] = c[2];
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[oi + i] = g.index.array[i] + ov;
    else for (let i = 0; i < n; i++) idx[oi + i] = ov + i;
    oi += g.index ? g.index.count : n; ov += n;
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  return out;
}
// orient a geometry (built along +y) to point along dir, then move to pos
function aim(g, dir, pos) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...dir).normalize());
  g.applyQuaternion(q); g.translate(pos[0], pos[1], pos[2]); return g;
}
const sphere = (r, w = 10, h = 7) => new THREE.SphereGeometry(r, w, h);
const cone = (r, h, s = 6) => new THREE.ConeGeometry(r, h, s).translate(0, h / 2, 0);   // base at origin, tip +y
const cyl = (r0, r1, h, s = 6) => new THREE.CylinderGeometry(r1, r0, h, s).translate(0, h / 2, 0);

// Build the body of a species from its genes. Local frame: y up, z forward, ground at y=0.
export function buildBodyGeometry(genes, color) {
  const b = genes.body, diet = genes.diet, L = legCount(b), parts = [];
  const cA = lin(mul(color, 1 - 0.35 * diet));
  const cB = lin(hsl((genes.hue + (b.hue2 - 0.5) * 0.6 + 1) % 1, 0.45 + 0.3 * b.hue2, 0.22 + 0.6 * b.hue2));
  const legC = mul(cA, 0.62), bone = lin([0.92, 0.88, 0.74]), dark = [0.01, 0.01, 0.01], white = [0.9, 0.9, 0.88];
  const len = b.len, wid = b.wid, hgt = b.hgt;
  const snake = L === 0 && b.snake > 0.5 && len > 1.1;
  const legH = L === 0 ? 0 : L === 2 ? 0.55 + 0.4 * hgt : 0.28 + 0.35 * hgt;
  const ry = 0.42 * hgt * (snake ? 0.75 : 1), rx = 0.5 * wid, rz = 0.85 * len;
  const by = L === 0 ? ry * 0.85 : legH + ry * 0.75;
  const stripes = b.pat > 0.6, twoTone = b.pat > 0.3;
  const skin = (cy, k = 1) => (x, y, z) => {
    let c = cA;
    if (stripes) { if (Math.sin(z * (6 + b.hue2 * 6)) > 0.25) c = cB; }
    else if (twoTone && y < cy - ry * 0.15) c = cB;
    else if (y < cy - ry * 0.5) c = mix(cA, cB, 0.35);
    return k === 1 ? c : mul(c, k);
  };
  let headPos, headR = 0.3 * b.head * (1 + 0.3 * diet), fwd = [0, 0, 1];
  if (snake) { // a long chain of shrinking segments, wiggling sideways
    const n = 5 + Math.round(len * 2), r0 = 0.3 * wid;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), r = r0 * (1 - 0.55 * t), z = len * 0.9 - t * len * 2.4, x = Math.sin(i * 0.9) * 0.22 * wid;
      parts.push({ g: sphere(r, 8, 6).scale(1, 0.8, 1.25).translate(x, r * 0.8, z), col: skin(r * 0.8) });
    }
    headPos = [0, r0 * 0.9, len * 0.9 + r0 + headR * 0.5]; headR = Math.max(headR, r0 * 1.05);
  } else {
    parts.push({ g: sphere(1, 12, 8).scale(rx, ry, rz).translate(0, by, 0), col: skin(by) });
    // legs
    const lp = L === 2 ? [[-0.45, 0]] : L === 4 ? [[-0.62, 0.55], [-0.62, -0.55]] : L === 6 ? [[-0.66, 0.6], [-0.7, 0], [-0.66, -0.6]] : [];
    const lr = 0.07 + 0.05 * wid * (L === 2 ? 1.3 : 1), lh = legH + ry * 0.35;
    for (const [fx, fz] of lp) for (const sx of [-1, 1]) {
      parts.push({ g: cyl(lr, lr * 0.7, lh, 5).translate(sx * fx * rx, 0, fz * rz), col: legC });
      if (L === 2) parts.push({ g: sphere(lr * 1.3, 5, 4).scale(1, 0.5, 2).translate(sx * fx * rx, lr * 0.5, lr * 1.2), col: legC });
    }
    // neck + head
    const nL = 0.12 + b.neck * 1.5, nb = [0, by + ry * 0.35, rz * 0.82];
    const nd = [0, 0.55 + b.neck * 0.4, 0.75]; const ndl = Math.hypot(...nd); nd[1] /= ndl; nd[2] /= ndl;
    if (b.neck > 0.08) parts.push({ g: aim(cyl(0.14 * wid, 0.1 * wid, nL, 6), nd, nb), col: cA });
    headPos = [0, nb[1] + nd[1] * (nL + headR * 0.4), nb[2] + nd[2] * (nL + headR * 0.4)];
    // tail
    if (b.tail > 0.12) {
      const tl = 0.2 + 1.5 * b.tail, td = [0, 0.25 - b.tail * 0.3, -1];
      parts.push({ g: aim(cone(0.11 * wid, tl, 5), td, [0, by + ry * 0.1, -rz * 0.85]), col: (x, y, z) => (z < -rz - tl * 0.6 ? cB : cA) });
    }
    // spikes along the back
    if (b.spikes > 0.3) {
      const n = 2 + Math.floor(b.spikes * 4), sh = 0.12 + 0.4 * b.spikes;
      for (let i = 0; i < n; i++) { const z = rz * (0.55 - 1.1 * i / Math.max(1, n - 1)); const yTop = by + ry * Math.sqrt(Math.max(0, 1 - (z / rz) ** 2)); parts.push({ g: cone(0.07 + 0.05 * wid, sh, 4).scale(0.5, 1, 1.4).translate(0, yTop - 0.04, z), col: cB }); }
    }
  }
  // head: slightly long snout, eyes, maybe teeth
  const [hx, hy, hz] = headPos;
  parts.push({ g: sphere(headR, 10, 7).scale(1, 0.88, 1.25).translate(hx, hy, hz), col: cA });
  for (const s of [-1, 1]) parts.push({ g: sphere(headR * 0.2, 5, 4).translate(hx + s * headR * 0.62, hy + headR * 0.3, hz + headR * 0.75), col: dark });
  if (diet > 0.5) for (const s of [-1, 1]) parts.push({ g: aim(cone(headR * 0.12, headR * 0.45, 4), [0, -1, 0.15], [hx + s * headR * 0.3, hy - headR * 0.35, hz + headR * 1.05]), col: white });
  if (b.ears > 0.25) {
    const eh = headR * (0.4 + 1.3 * b.ears);
    for (const s of [-1, 1]) parts.push({ g: aim(cone(headR * 0.3, eh, 5).scale(1, 1, 0.35), [s * 0.8, 1, -0.2], [hx + s * headR * 0.55, hy + headR * 0.45, hz - headR * 0.2]), col: mix(cA, cB, 0.4) });
  }
  if (b.horn > 0.3) {
    const hl = headR * (0.5 + 2.2 * b.horn);
    if (b.hornType < 0.33) for (const s of [-1, 1]) parts.push({ g: aim(cone(headR * 0.18, hl, 6), [s * 0.6, 1, 0.25], [hx + s * headR * 0.35, hy + headR * 0.6, hz]), col: bone });
    else if (b.hornType < 0.66) for (const s of [-1, 1]) { // antlers with two branches
      const base = [hx + s * headR * 0.35, hy + headR * 0.6, hz - headR * 0.1], d = [s * 0.5, 1, -0.2];
      parts.push({ g: aim(cyl(headR * 0.07, headR * 0.05, hl, 4), d, base), col: bone });
      for (const t of [0.45, 0.8]) { const p = [base[0] + d[0] * hl * t * 0.8, base[1] + d[1] * hl * t * 0.8, base[2] + d[2] * hl * t * 0.8]; parts.push({ g: aim(cyl(headR * 0.05, headR * 0.03, hl * 0.4, 4), [s * 0.2, 0.7, 0.8], p), col: bone }); }
    } else for (let i = 0; i < 3; i++) parts.push({ g: cone(headR * 0.22, headR * (0.4 + 1.2 * b.horn) * (1 - i * 0.25), 4).scale(0.35, 1, 1).translate(hx, hy + headR * 0.7, hz + headR * (0.3 - i * 0.45)), col: cB });
  }
  const g = mergeColored(parts);
  g.computeBoundingSphere();
  return g;
}

function nestGeometry() {
  const straw = lin([0.62, 0.48, 0.28]), dark = [0.02, 0.015, 0.01], twig = lin([0.4, 0.29, 0.17]);
  // a low woven hut: striped dome, a ring of sticks, a dark doorway and a few sticks poking out on top
  const dome = new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.62, 1);
  const ring = new THREE.TorusGeometry(1.0, 0.13, 4, 14).rotateX(Math.PI / 2).translate(0, 0.06, 0);
  const door = new THREE.SphereGeometry(0.3, 8, 6).scale(1, 1.15, 0.5).translate(0, 0.2, 0.93);
  const parts = [{ g: dome, col: (x, y) => (Math.sin(y * 22) > 0.5 ? twig : straw) }, { g: ring, col: twig }, { g: door, col: dark }];
  for (let i = 0; i < 4; i++) parts.push({ g: new THREE.CylinderGeometry(0.025, 0.035, 0.5, 3).rotateZ(0.5 * Math.cos(i * 1.6)).rotateX(0.5 * Math.sin(i * 1.6)).translate(0, 0.72, 0), col: twig });
  return mergeColored(parts);
}
function plantGeometry() {
  return mergeColored([
    { g: new THREE.CylinderGeometry(0.08, 0.12, 0.8, 4).translate(0, 0.4, 0), col: lin([0.33, 0.22, 0.12]) },
    { g: new THREE.IcosahedronGeometry(0.55, 0).translate(0, 1.0, 0), col: [1, 1, 1] },
    { g: new THREE.IcosahedronGeometry(0.4, 0).translate(0.25, 1.35, 0.1), col: [1, 1, 1] },
  ]);
}

function dotMaterial(sizePx) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { size: { value: sizePx }, opacity: { value: 1 } },
    vertexShader: `attribute vec3 color; varying vec3 vC; uniform float size;
      void main(){ vC = color; gl_PointSize = size; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `varying vec3 vC; uniform float opacity;
      void main(){ float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.12, d) * opacity;
        if (a < 0.01) discard; gl_FragColor = vec4(vC * (1.0 + 0.6 * smoothstep(0.3, 0.0, d)), a); }`,
  });
}
function makePoints(n, sizePx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setDrawRange(0, 0);
  const p = new THREE.Points(g, dotMaterial(sizePx)); p.frustumCulled = false; return p;
}

export class CreaturesView {
  constructor(scene, world) {
    this.world = world; this.scene = scene;
    this.dpr = Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1);
    this.bodyMat = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.species = new Map(); // speciesId -> { geo, mesh, cap, sig }
    this.spVer = -1;
    this.pMesh = new THREE.InstancedMesh(plantGeometry(), new THREE.MeshLambertMaterial({ vertexColors: true }), MAXP);
    this.pMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAXP * 3), 3);
    this.pMesh.frustumCulled = false; this.pMesh.count = 0;
    this.nMesh = new THREE.InstancedMesh(nestGeometry(), new THREE.MeshLambertMaterial({ vertexColors: true }), MAXN);
    this.nMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAXN * 3), 3);
    this.nMesh.frustumCulled = false; this.nMesh.count = 0;
    this.dots = makePoints(MAXDOT, 4 * this.dpr); this.dots.renderOrder = 4;
    this.nDots = makePoints(MAXN, 2.4 * this.dpr); this.nDots.renderOrder = 4;
    this.pDots = makePoints(14000, 1.6 * this.dpr); this.pDots.renderOrder = 3;
    this.ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.45, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthTest: false }));
    this.ring.visible = false; this.ring.renderOrder = 5;
    this.group = new THREE.Group();
    this.group.add(this.pMesh, this.nMesh, this.dots, this.nDots, this.pDots, this.ring);
    this.fx = new THREE.Group();
    scene.add(this.group, this.fx);
    this.bolts = []; this.plantFrame = 0; this.pdFrame = 0; this.nestFrame = 0; this.frame = 0;
  }

  // orientation basis: y = surface normal, z = heading
  place(x, y, z, hx, hy, hz, scale, lift = 0) {
    const r = Math.max(1.0, surfaceRadius(this.world, x, y, z)) + lift;
    _y.set(x, y, z); _z.set(hx, hy, hz); _x.crossVectors(_y, _z);
    _m.makeBasis(_x.multiplyScalar(scale), _y.multiplyScalar(scale), _z.multiplyScalar(scale));
    _m.setPosition(x * r, y * r, z * r);
    return _m;
  }

  syncSpecies(sim) {
    if (this.spVer === sim.speciesVer) return;
    this.spVer = sim.speciesVer;
    const alive = new Set();
    for (const s of sim.species) {
      alive.add(s.id);
      const g = s.rep.genes, b = g.body;
      const sig = [b.len, b.wid, b.hgt, b.legs, b.neck, b.head, b.tail, b.horn, b.hornType, b.ears, b.spikes, b.hue2, b.pat, b.snake, g.diet];
      let e = this.species.get(s.id);
      const changed = !e || sig.some((v, i) => Math.abs(v - e.sig[i]) > 0.08);
      if (changed) {
        const geo = buildBodyGeometry(g, s.color);
        if (e) { e.mesh.geometry.dispose(); e.mesh.geometry = geo; e.sig = sig; }
        else { e = { sig, cap: 0, mesh: null }; this.species.set(s.id, e); this.ensureCap(e, Math.max(64, s.count * 2), geo); }
      }
      if (s.count * 1.5 > e.cap) this.ensureCap(e, s.count * 2);
    }
    for (const [id, e] of this.species) if (!alive.has(id)) { this.group.remove(e.mesh); e.mesh.geometry.dispose(); e.mesh.dispose?.(); this.species.delete(id); }
  }
  ensureCap(e, cap, geo) {
    cap = Math.max(64, 1 << Math.ceil(Math.log2(cap)));
    if (e.cap >= cap && !geo) return;
    const g = geo || e.mesh.geometry;
    if (e.mesh) { this.group.remove(e.mesh); e.mesh.dispose?.(); }
    const m = new THREE.InstancedMesh(g, this.bodyMat, cap);
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
    m.frustumCulled = false; m.count = 0;
    this.group.add(m); e.mesh = m; e.cap = cap;
  }

  update(sim, alpha, camAlt, selected, camPos, time) {
    this.frame++;
    this.syncSpecies(sim);
    const cs = sim.creatures, cpx = camPos.x, cpy = camPos.y, cpz = camPos.z;
    const showBodies = camAlt < BODY_ALT, bd2 = BODY_DIST * BODY_DIST;
    for (const e of this.species.values()) e.mesh.count = 0;
    // dots: visible from far away, fade out as real bodies take over
    const dotA = Math.min(1, Math.max(0, (camAlt - 0.012) / 0.05));
    this.dots.material.uniforms.opacity.value = dotA;
    this.dots.visible = dotA > 0.01;
    this.dots.material.uniforms.size.value = (camAlt > 0.6 ? 4.5 : 5) * this.dpr;
    const dp = this.dots.geometry.attributes.position.array, dc = this.dots.geometry.attributes.color.array;
    let nd = 0;
    let selS = 0;
    for (let i = 0; i < cs.length; i++) {
      const c = cs[i];
      let x = c.px + (c.x - c.px) * alpha, y = c.py + (c.y - c.py) * alpha, z = c.pz + (c.z - c.pz) * alpha;
      const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l;
      const sp = sim.speciesById.get(c.speciesId);
      const col = sp ? sp.color : [0.85, 0.85, 0.85];
      if (this.dots.visible && nd < MAXDOT) {
        const r = Math.max(1.0, surfaceRadius(this.world, x, y, z)) + 0.0015;
        dp[nd * 3] = x * r; dp[nd * 3 + 1] = y * r; dp[nd * 3 + 2] = z * r;
        dc[nd * 3] = col[0]; dc[nd * 3 + 1] = col[1]; dc[nd * 3 + 2] = col[2]; nd++;
      }
      const s = BODY_S * Math.pow(c.genes.size, 0.7);
      if (c === selected) selS = s;
      if (!showBodies) continue;
      const ex = x - cpx, ey = y - cpy, ez = z - cpz;
      if (ex * ex + ey * ey + ez * ez > bd2) continue;
      const e = this.species.get(c.speciesId); if (!e) continue;
      if (e.mesh.count >= e.cap) continue;
      const moving = c.x !== c.px || c.y !== c.py;
      const hop = moving ? Math.abs(Math.sin(time * 12 + c.id)) * s * 0.18 : 0;
      e.mesh.setMatrixAt(e.mesh.count, this.place(x, y, z, c.hx, c.hy, c.hz, s, hop - s * 0.05));
      const shade = 0.88 + ((c.id * 37) % 25) / 100;
      _c.setRGB(shade, shade, shade);
      e.mesh.setColorAt(e.mesh.count, _c);
      e.mesh.count++;
    }
    for (const e of this.species.values()) { e.mesh.instanceMatrix.needsUpdate = true; if (e.mesh.instanceColor) e.mesh.instanceColor.needsUpdate = true; }
    this.dots.geometry.setDrawRange(0, nd);
    this.dots.geometry.attributes.position.needsUpdate = true; this.dots.geometry.attributes.color.needsUpdate = true;
    // selection ring
    if (selected && selected.alive) {
      let x = selected.px + (selected.x - selected.px) * alpha, y = selected.py + (selected.y - selected.py) * alpha, z = selected.pz + (selected.z - selected.pz) * alpha;
      const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l;
      const r = Math.max(1.0, surfaceRadius(this.world, x, y, z)) + 0.00008;
      this.ring.position.set(x * r, y * r, z * r);
      this.ring.lookAt(x * 2, y * 2, z * 2);
      this.ring.scale.setScalar(Math.max(selS * 2.2, camAlt * 0.03));
      this.ring.visible = true;
    } else this.ring.visible = false;

    this.updatePlants(sim, camAlt, camPos);
    this.updateNests(sim, camAlt, camPos);
  }

  updatePlants(sim, camAlt, camPos) {
    // individual little trees close up
    this.pMesh.visible = camAlt < 0.06;
    if (this.pMesh.visible && this.plantFrame++ % 8 === 0) {
      let k = 0; const R2 = 0.16 * 0.16;
      for (let i = 0; i < sim.fx.length && k < MAXP; i++) {
        if (!sim.falive[i]) continue;
        const x = sim.fx[i], y = sim.fy[i], z = sim.fz[i];
        const ex = x - camPos.x, ey = y - camPos.y, ez = z - camPos.z;
        if (ex * ex + ey * ey + ez * ez > R2) continue;
        const t = sim.ft[i], hsh = ((i * 2654435761) >>> 0) % 1000 / 1000;
        _p.set(0, 1, 0); if (Math.abs(y) > 0.9) _p.set(1, 0, 0);
        _z.set(x, y, z).cross(_p).normalize();
        const s = PLANT_S * (t === 2 ? 0.8 : t === 1 ? 0.6 : 0.7 + hsh * 0.9);
        this.pMesh.setMatrixAt(k, this.place(x, y, z, _z.x, _z.y, _z.z, s, -s * 0.1));
        if (t === 0) _c.setRGB(0.1 + hsh * 0.12, 0.33 + hsh * 0.15, 0.07, THREE.SRGBColorSpace);
        else if (t === 1) _c.setRGB(0.55, 0.12, 0.1, THREE.SRGBColorSpace);
        else _c.setRGB(1.0, 0.72, 0.15, THREE.SRGBColorSpace);
        this.pMesh.setColorAt(k, _c);
        k++;
      }
      this.pMesh.count = k;
      this.pMesh.instanceMatrix.needsUpdate = true; this.pMesh.instanceColor.needsUpdate = true;
    }
    // faint green speckles from mid distance: shows where plants are (re)growing
    const pa = camAlt < 0.03 ? 0 : Math.min(1, (camAlt - 0.03) / 0.05) * Math.max(0, Math.min(1, (1.4 - camAlt) / 0.6));
    this.pDots.visible = pa > 0.01;
    this.pDots.material.uniforms.opacity.value = pa * 0.55;
    if (this.pDots.visible && this.pdFrame++ % 20 === 0) {
      const p = this.pDots.geometry.attributes.position.array, c = this.pDots.geometry.attributes.color.array;
      let k = 0;
      for (let i = 0; i < sim.fx.length; i++) {
        if (!sim.falive[i]) continue;
        const x = sim.fx[i], y = sim.fy[i], z = sim.fz[i], r = Math.max(1.0, surfaceRadius(this.world, x, y, z)) + 0.0008, t = sim.ft[i];
        p[k * 3] = x * r; p[k * 3 + 1] = y * r; p[k * 3 + 2] = z * r;
        if (t === 0) { c[k * 3] = 0.35; c[k * 3 + 1] = 0.85; c[k * 3 + 2] = 0.25; } else if (t === 1) { c[k * 3] = 0.8; c[k * 3 + 1] = 0.2; c[k * 3 + 2] = 0.15; } else { c[k * 3] = 1; c[k * 3 + 1] = 0.8; c[k * 3 + 2] = 0.2; }
        k++;
      }
      this.pDots.geometry.setDrawRange(0, k);
      this.pDots.geometry.attributes.position.needsUpdate = true; this.pDots.geometry.attributes.color.needsUpdate = true;
    }
  }

  updateNests(sim, camAlt, camPos) {
    const a = Math.min(1, Math.max(0, (camAlt - 0.015) / 0.05));
    this.nDots.visible = a > 0.01; this.nDots.material.uniforms.opacity.value = a * 0.6;
    if (this.nestFrame++ % 12 !== 0) return;
    const ns = sim.nests;
    this.nMesh.visible = camAlt < BODY_ALT;
    let k = 0;
    if (this.nMesh.visible) {
      const R2 = BODY_DIST * BODY_DIST;
      for (const n of ns) {
        if (k >= MAXN) break;
        const ex = n.x - camPos.x, ey = n.y - camPos.y, ez = n.z - camPos.z;
        if (ex * ex + ey * ey + ez * ez > R2) continue;
        _p.set(0, 1, 0); if (Math.abs(n.y) > 0.9) _p.set(1, 0, 0);
        _z.set(n.x, n.y, n.z).cross(_p).normalize();
        const h = ((n.id * 2654435761) >>> 0) % 628 / 100; // random facing
        _x.crossVectors(_p.set(n.x, n.y, n.z), _z); _z.multiplyScalar(Math.cos(h)).addScaledVector(_x, Math.sin(h)).normalize();
        this.nMesh.setMatrixAt(k, this.place(n.x, n.y, n.z, _z.x, _z.y, _z.z, NEST_S * (0.75 + 0.25 * n.hp), -NEST_S * 0.1));
        const sp = sim.speciesById.get(n.sp), col = sp ? sp.color : [0.7, 0.6, 0.4], f = 0.55 + 0.45 * n.hp;
        _c.setRGB((0.8 + col[0] * 0.35) * f, (0.8 + col[1] * 0.35) * f, (0.8 + col[2] * 0.35) * f);
        this.nMesh.setColorAt(k, _c); k++;
      }
    }
    this.nMesh.count = k;
    this.nMesh.instanceMatrix.needsUpdate = true; this.nMesh.instanceColor.needsUpdate = true;
    // nest dots (warm) from afar
    if (this.nDots.visible) {
      const p = this.nDots.geometry.attributes.position.array, c = this.nDots.geometry.attributes.color.array;
      let j = 0;
      for (const n of ns) {
        if (j >= MAXN) break;
        const r = Math.max(1.0, surfaceRadius(this.world, n.x, n.y, n.z)) + 0.0012;
        p[j * 3] = n.x * r; p[j * 3 + 1] = n.y * r; p[j * 3 + 2] = n.z * r;
        c[j * 3] = 0.85; c[j * 3 + 1] = 0.6; c[j * 3 + 2] = 0.32; j++;
      }
      this.nDots.geometry.setDrawRange(0, j);
      this.nDots.geometry.attributes.position.needsUpdate = true; this.nDots.geometry.attributes.color.needsUpdate = true;
    }
  }
  refreshPlants() { this.plantFrame = 0; this.nestFrame = 0; this.pdFrame = 0; }

  lightning(x, y, z, camAlt = 0.3) {
    const r0 = Math.max(1, surfaceRadius(this.world, x, y, z));
    const up = new THREE.Vector3(x, y, z);
    const side = new THREE.Vector3().crossVectors(up, new THREE.Vector3(0, 1, 0.3)).normalize();
    const side2 = new THREE.Vector3().crossVectors(up, side);
    const H = Math.min(0.09, Math.max(0.006, camAlt * 0.9)), J = H * 0.09;
    const pts = [], segs = 14;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, h = r0 + (1 - t) * H;
      const j = i === segs ? 0 : (Math.random() - 0.5) * J, j2 = i === segs ? 0 : (Math.random() - 0.5) * J;
      pts.push(up.clone().multiplyScalar(h).addScaledVector(side, j).addScaledVector(side2, j2));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xcfe6ff, transparent: true, blending: THREE.AdditiveBlending, depthTest: false }));
    const glowC = document.createElement('canvas'); glowC.width = glowC.height = 64;
    const g = glowC.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(230,240,255,1)'); gr.addColorStop(0.3, 'rgba(150,190,255,0.5)'); gr.addColorStop(1, 'rgba(120,160,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowC), blending: THREE.AdditiveBlending, depthTest: false, transparent: true }));
    glow.position.copy(up).multiplyScalar(r0 + H * 0.02); glow.scale.setScalar(H * 0.9);
    line.renderOrder = glow.renderOrder = 6;
    this.fx.add(line, glow);
    this.bolts.push({ line, glow, life: 0.6 });
  }
  updateFx(dt) {
    for (const b of this.bolts) {
      b.life -= dt;
      const a = Math.max(0, b.life / 0.6);
      b.line.material.opacity = a > 0.5 ? (Math.random() < 0.7 ? 1 : 0.2) : a * 2;
      b.glow.material.opacity = a;
      if (b.life <= 0) { this.fx.remove(b.line, b.glow); b.line.geometry.dispose(); b.line.material.dispose(); b.glow.material.map.dispose(); b.glow.material.dispose(); }
    }
    this.bolts = this.bolts.filter((b) => b.life > 0);
  }
  dispose() {
    this.scene.remove(this.group, this.fx);
    for (const e of this.species.values()) { e.mesh.geometry.dispose(); e.mesh.dispose?.(); }
    this.species.clear();
    for (const o of [this.pMesh, this.nMesh, this.dots, this.nDots, this.pDots, this.ring]) { o.geometry.dispose(); o.material.dispose(); }
    this.bodyMat.dispose();
  }
}
