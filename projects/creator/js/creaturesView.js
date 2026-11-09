// Instanced rendering of creatures, plants, selection ring and lightning flashes.
import * as THREE from 'three';
import { surfaceRadius } from './world.js';

function mergeGeoms(geoms) {
  const parts = geoms.map((g) => g.toNonIndexed());
  let n = 0; for (const p of parts) n += p.attributes.position.count;
  const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3);
  let o = 0;
  for (const p of parts) { pos.set(p.attributes.position.array, o * 3); nrm.set(p.attributes.normal.array, o * 3); o += p.attributes.position.count; }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  return g;
}

const MAXC = 3000, MAXP = 14000;
const _m = new THREE.Matrix4(), _c = new THREE.Color(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _p = new THREE.Vector3();

export class CreaturesView {
  constructor(scene, world) {
    this.world = world;
    const body = new THREE.SphereGeometry(1, 12, 8); body.scale(0.62, 0.5, 1.0); body.translate(0, 0.5, 0);
    const head = new THREE.SphereGeometry(0.42, 10, 8); head.translate(0, 0.78, 0.85);
    const legs = [[-0.4, 0.5], [0.4, 0.5], [-0.4, -0.5], [0.4, -0.5]].map(([x, z]) => { const l = new THREE.CylinderGeometry(0.09, 0.07, 0.5, 5); l.translate(x, 0.2, z); return l; });
    const geom = mergeGeoms([body, head, ...legs]);
    this.cMesh = new THREE.InstancedMesh(geom, new THREE.MeshLambertMaterial({ color: 0xffffff }), MAXC);
    this.cMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAXC * 3), 3);
    this.cMesh.frustumCulled = false; this.cMesh.count = 0;
    const plant = mergeGeoms([new THREE.ConeGeometry(0.5, 1.4, 6).translate(0, 0.7, 0), new THREE.SphereGeometry(0.45, 6, 4).translate(0, 1.2, 0)]);
    this.pMesh = new THREE.InstancedMesh(plant, new THREE.MeshLambertMaterial({ color: 0xffffff }), MAXP);
    this.pMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAXP * 3), 3);
    this.pMesh.frustumCulled = false; this.pMesh.count = 0;
    this.ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.45, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthTest: false }));
    this.ring.visible = false; this.ring.renderOrder = 5;
    this.fx = new THREE.Group();
    scene.add(this.cMesh, this.pMesh, this.ring, this.fx);
    this.bolts = [];
    this.plantFrame = 0;
  }

  // orientation basis: y = surface normal, z = heading
  place(x, y, z, hx, hy, hz, scale, lift = 0) {
    const r = Math.max(1.0, surfaceRadius(this.world, x, y, z)) + lift;
    _y.set(x, y, z); _z.set(hx, hy, hz); _x.crossVectors(_y, _z);
    _m.makeBasis(_x.multiplyScalar(scale), _y.clone().multiplyScalar(scale), _z.multiplyScalar(scale));
    _m.setPosition(x * r, y * r, z * r);
    return _m;
  }

  update(sim, alpha, camAlt, selected) {
    const boost = Math.min(2.5, Math.max(1, camAlt / 0.12));
    const cs = sim.creatures; let n = 0;
    for (let i = 0; i < cs.length && n < MAXC; i++) {
      const c = cs[i];
      let x = c.px + (c.x - c.px) * alpha, y = c.py + (c.y - c.py) * alpha, z = c.pz + (c.z - c.pz) * alpha;
      const l = Math.hypot(x, y, z); x /= l; y /= l; z /= l;
      const s = 0.0032 * Math.pow(c.genes.size, 0.7) * boost;
      this.cMesh.setMatrixAt(n, this.place(x, y, z, c.hx, c.hy, c.hz, s));
      const sp = sim.speciesById?.get(c.speciesId);
      const col = sp ? sp.color : [0.8, 0.8, 0.8];
      const shade = 0.85 + 0.3 * c.genes.hue % 0.3;
      _c.setRGB(col[0] * shade, col[1] * shade, col[2] * shade, THREE.SRGBColorSpace);
      this.cMesh.setColorAt(n, _c);
      if (c === selected) {
        const r = Math.max(1.0, surfaceRadius(this.world, x, y, z)) + 0.0004;
        this.ring.position.set(x * r, y * r, z * r);
        this.ring.lookAt(x * 2, y * 2, z * 2);
        this.ring.scale.setScalar(s * 1.6);
      }
      n++;
    }
    this.cMesh.count = n;
    this.cMesh.instanceMatrix.needsUpdate = true; this.cMesh.instanceColor.needsUpdate = true;
    this.ring.visible = !!(selected && selected.alive);

    // plants rarely move: refresh every few frames, hide when far away
    this.pMesh.visible = camAlt < 0.6;
    if (this.pMesh.visible && (this.plantFrame++ % 10 === 0)) {
      let k = 0; const pb = Math.min(2.5, Math.max(1, camAlt / 0.15));
      for (let i = 0; i < sim.fx.length && k < MAXP; i++) {
        if (!sim.falive[i]) continue;
        const t = sim.ft[i];
        const x = sim.fx[i], y = sim.fy[i], z = sim.fz[i];
        // arbitrary tangent for orientation
        _p.set(0, 1, 0); if (Math.abs(y) > 0.9) _p.set(1, 0, 0);
        _z.set(x, y, z).cross(_p).normalize();
        const s = (t === 2 ? 0.0028 : t === 1 ? 0.0022 : 0.0019) * pb * (0.8 + ((i * 2654435761) >>> 0) % 100 / 250);
        this.pMesh.setMatrixAt(k, this.place(x, y, z, _z.x, _z.y, _z.z, s, -0.0002));
        if (t === 0) _c.setRGB(0.12 + (i % 7) * 0.012, 0.36 + (i % 5) * 0.03, 0.08, THREE.SRGBColorSpace);
        else if (t === 1) _c.setRGB(0.55, 0.12, 0.1, THREE.SRGBColorSpace);
        else _c.setRGB(1.0, 0.78, 0.2, THREE.SRGBColorSpace);
        this.pMesh.setColorAt(k, _c);
        k++;
      }
      this.pMesh.count = k;
      this.pMesh.instanceMatrix.needsUpdate = true; this.pMesh.instanceColor.needsUpdate = true;
    }
  }
  refreshPlants() { this.plantFrame = 0; }

  lightning(x, y, z) {
    const r0 = Math.max(1, surfaceRadius(this.world, x, y, z));
    const up = new THREE.Vector3(x, y, z);
    const side = new THREE.Vector3().crossVectors(up, new THREE.Vector3(0, 1, 0.3)).normalize();
    const side2 = new THREE.Vector3().crossVectors(up, side);
    const pts = [];
    const segs = 14;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, h = r0 + (1 - t) * 0.09;
      const j = i === segs ? 0 : (Math.random() - 0.5) * 0.008;
      const j2 = i === segs ? 0 : (Math.random() - 0.5) * 0.008;
      pts.push(up.clone().multiplyScalar(h).addScaledVector(side, j).addScaledVector(side2, j2));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xcfe6ff, transparent: true, blending: THREE.AdditiveBlending, depthTest: false }));
    const glowC = document.createElement('canvas'); glowC.width = glowC.height = 64;
    const g = glowC.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(230,240,255,1)'); gr.addColorStop(0.3, 'rgba(150,190,255,0.5)'); gr.addColorStop(1, 'rgba(120,160,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowC), blending: THREE.AdditiveBlending, depthTest: false, transparent: true }));
    glow.position.copy(up).multiplyScalar(r0 + 0.002); glow.scale.setScalar(0.08);
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
    for (const o of [this.cMesh, this.pMesh, this.ring, this.fx]) o.parent?.remove(o);
    this.cMesh.geometry.dispose(); this.pMesh.geometry.dispose(); this.cMesh.material.dispose(); this.pMesh.material.dispose();
  }
}
