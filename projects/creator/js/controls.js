// Touch + mouse camera control around the planet: drag to rotate, pinch/wheel to zoom,
// short tap -> onTap. Camera tilts toward the horizon when close to the ground.
import * as THREE from 'three';
import { surfaceRadius } from './world.js';

export const MIN_ALT = 0.0016, MAX_ALT = 4.5; // can fly down to just above the creatures

export class PlanetControls {
  constructor(camera, el, world) {
    this.camera = camera; this.el = el; this.world = world;
    this.q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.35, 0.6, 0));
    this.alt = 2.2; this.targetAlt = 2.2;
    this.vel = new THREE.Vector2();
    this.pointers = new Map();
    this.onTap = null; this.follow = null; this.enabled = true;
    this.autoSpin = 0;
    el.addEventListener('pointerdown', (e) => this.down(e));
    el.addEventListener('pointermove', (e) => this.move(e));
    el.addEventListener('pointerup', (e) => this.up(e));
    el.addEventListener('pointercancel', (e) => this.up(e));
    el.addEventListener('wheel', (e) => { e.preventDefault(); this.zoom(Math.exp(e.deltaY * 0.0012)); }, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  setWorld(world) { this.world = world; }
  zoom(f) { this.flyTo = null; this.targetAlt = Math.min(MAX_ALT, Math.max(MIN_ALT, this.targetAlt * f)); }
  fly(dir, alt) { this.flyTo = dir.clone().normalize(); this.targetAlt = Math.min(MAX_ALT, Math.max(MIN_ALT, alt)); }
  down(e) {
    if (!this.enabled) return;
    this.el.setPointerCapture?.(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() });
    this.vel.set(0, 0);
    if (this.pointers.size === 2) { const [a, b] = [...this.pointers.values()]; this.pinch = Math.hypot(a.x - b.x, a.y - b.y); }
  }
  move(e) {
    const p = this.pointers.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (this.pointers.size === 1) {
      if (Math.hypot(p.x - p.sx, p.y - p.sy) > 8) { this.follow = null; this.flyTo = null; p.moved = true; }
      if (p.moved) { this.rotate(dx, dy); this.vel.set(dx, dy); }
    } else if (this.pointers.size === 2) {
      p.moved = true;
      const [a, b] = [...this.pointers.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinch) { this.flyTo = null; this.targetAlt = Math.min(MAX_ALT, Math.max(MIN_ALT, this.targetAlt * this.pinch / d)); this.alt = this.targetAlt; }
      this.pinch = d;
    }
  }
  up(e) {
    const p = this.pointers.get(e.pointerId); if (!p) return;
    const multi = this.pointers.size > 1;
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (multi) { for (const o of this.pointers.values()) o.moved = true; this.vel.set(0, 0); return; }
    if (!p.moved && performance.now() - p.t < 450 && this.onTap) this.onTap(e.clientX, e.clientY);
  }
  rotate(dx, dy) {
    const H = this.el.clientHeight || 800;
    const k = Math.min(2.2, this.alt * 1.0) / H;
    const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -dy * k);
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -dx * k);
    this.q.multiply(qy).multiply(qx).normalize();
  }
  update(dt, followPos) {
    if (!this.pointers.size && this.vel.lengthSq() > 0.01) { this.rotate(this.vel.x, this.vel.y); this.vel.multiplyScalar(Math.pow(0.02, dt)); }
    if (this.autoSpin) this.rotate(this.autoSpin * dt, 0);
    this.alt = Math.exp(Math.log(this.alt) + (Math.log(this.targetAlt) - Math.log(this.alt)) * Math.min(1, dt * 6));
    if (!followPos && this.flyTo) {
      followPos = this.flyTo;
      if (new THREE.Vector3(0, 0, 1).applyQuaternion(this.q).dot(this.flyTo) > 0.99999) this.flyTo = null;
    }
    if (followPos) { // rotate so the creature is under the camera
      const S = new THREE.Vector3(0, 0, 1).applyQuaternion(this.q);
      const r = new THREE.Quaternion().setFromUnitVectors(S, followPos.clone().normalize());
      const id = new THREE.Quaternion();
      id.slerp(r, Math.min(1, dt * 4));
      this.q.premultiply(id).normalize();
    }
    const S = new THREE.Vector3(0, 0, 1).applyQuaternion(this.q);
    const U = new THREE.Vector3(0, 1, 0).applyQuaternion(this.q);
    const ground = Math.max(1.0, surfaceRadius(this.world, S.x, S.y, S.z));
    const near = THREE.MathUtils.smoothstep(0.5, 0.04, this.alt);
    const tilt = near * 1.05 + THREE.MathUtils.smoothstep(0.03, 0.002, this.alt) * 0.22; // look toward the horizon when very low
    const T = S.clone().multiplyScalar(ground * near);
    const off = S.clone().multiplyScalar(Math.cos(tilt)).addScaledVector(U, -Math.sin(tilt));
    const cam = this.camera;
    cam.position.copy(S).multiplyScalar(ground).addScaledVector(off, this.alt);
    // keep above ground
    const cp = cam.position, cl = cp.length(), cd = cp.clone().divideScalar(cl);
    const gr = Math.max(1.0, surfaceRadius(this.world, cd.x, cd.y, cd.z)) + Math.max(0.00045, this.alt * 0.3);
    if (cl < gr) cp.multiplyScalar(gr / cl);
    cam.up.copy(U).lerp(S, 1 - near).normalize();
    cam.lookAt(T);
    // tight near/far around the planet (stars + sun are drawn in a separate background pass)
    const d = cp.length();
    cam.near = Math.min(0.5, Math.max(0.00003, this.alt * 0.15));
    cam.far = Math.sqrt(Math.max(0, d * d - 1)) + 0.65;
    cam.updateProjectionMatrix();
  }
  // ray -> point on the planet surface (unit direction) or null
  pick(clientX, clientY) {
    const rect = this.el.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, this.camera);
    const o = ray.ray.origin, d = ray.ray.direction;
    // intersect bounding shell radius 1.035, then march inward
    const R = 1.035, b = o.dot(d), c = o.lengthSq() - R * R, disc = b * b - c;
    if (disc < 0) return null;
    let t = Math.max(0, -b - Math.sqrt(disc));
    const tEnd = -b + Math.sqrt(disc), p = new THREE.Vector3();
    const inside = (t) => { p.copy(o).addScaledVector(d, t); const l = p.length(); return l <= Math.max(1.0, surfaceRadius(this.world, p.x / l, p.y / l, p.z / l)); };
    const stepLen = 0.0015;
    let prev = t;
    while (t < tEnd) {
      if (inside(t)) { let a = prev, z = t; for (let i = 0; i < 20; i++) { const m = (a + z) / 2; if (inside(m)) z = m; else a = m; } p.copy(o).addScaledVector(d, z); return p.normalize(); }
      prev = t; t += stepLen;
    }
    return null;
  }
}
