// Three.js visuals for the planet: terrain, ocean, clouds, atmosphere, stars, sun glow.
import * as THREE from 'three';
import { makeNoise3, fbm } from './noise.js';

const toLin = (c) => Math.pow(c, 2.2);

export function buildTerrain(world) {
  const { N, S, dir, radius, color } = world;
  const total = 6 * S * S;
  const pos = new Float32Array(total * 3), col = new Float32Array(total * 3);
  for (let i = 0; i < total; i++) {
    const r = radius[i];
    pos[i * 3] = dir[i * 3] * r; pos[i * 3 + 1] = dir[i * 3 + 1] * r; pos[i * 3 + 2] = dir[i * 3 + 2] * r;
    col[i * 3] = toLin(color[i * 3]); col[i * 3 + 1] = toLin(color[i * 3 + 1]); col[i * 3 + 2] = toLin(color[i * 3 + 2]);
  }
  const idx = new Uint32Array(6 * N * N * 6);
  let k = 0;
  for (let f = 0; f < 6; f++) for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const a = f * S * S + j * S + i, b = a + 1, c = a + S, d = c + 1;
    idx[k++] = a; idx[k++] = b; idx[k++] = d; idx[k++] = a; idx[k++] = d; idx[k++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  // fix normal seams on cube-face edges: average normals of vertices at the same spot
  const nrm = g.attributes.normal.array, map = new Map();
  for (let f = 0; f < 6; f++) for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    if (i && j && i < N && j < N) continue;
    const v = f * S * S + j * S + i;
    const key = Math.round(dir[v * 3] * 1e4) + ',' + Math.round(dir[v * 3 + 1] * 1e4) + ',' + Math.round(dir[v * 3 + 2] * 1e4);
    let a = map.get(key); if (!a) map.set(key, a = []); a.push(v);
  }
  for (const a of map.values()) {
    let x = 0, y = 0, z = 0;
    for (const v of a) { x += nrm[v * 3]; y += nrm[v * 3 + 1]; z += nrm[v * 3 + 2]; }
    const l = Math.hypot(x, y, z) || 1;
    for (const v of a) { nrm[v * 3] = x / l; nrm[v * 3 + 1] = y / l; nrm[v * 3 + 2] = z / l; }
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: { sunDir: { value: new THREE.Vector3(1, 0, 0) } },
    vertexColors: true,
    vertexShader: `
      varying vec3 vN; varying vec3 vP; varying vec3 vC;
      void main(){ vN = normal; vP = position; vC = color;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 sunDir; varying vec3 vN; varying vec3 vP; varying vec3 vC;
      // sine-free hash: stays stable at the large coordinates used for close-up detail
      float h(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
      float vnoise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
      void main(){
        vec3 N = normalize(vN); vec3 up = normalize(vP);
        float camD = length(cameraPosition);
        float dist = length(cameraPosition - vP);
        // fine detail so the ground isn't flat when zoomed in (more octaves the closer you are)
        float near = 1.0 - smoothstep(1.15, 1.8, camD);
        float dn = (vnoise(vP*420.0)*0.6 + vnoise(vP*1300.0)*0.4) - 0.5;
        float close = 1.0 - smoothstep(0.01, 0.06, dist);
        float dn2 = (vnoise(vP*4200.0)*0.6 + vnoise(vP*13000.0)*0.4) - 0.5;
        vec3 col = vC * (1.0 + dn * 0.35 * near + dn2 * 0.3 * close);
        // even lighting: the light follows the camera, so there is never a dark side
        float ndl = max(dot(N, sunDir), 0.0);
        float slope = 1.0 - max(dot(N, up), 0.0);
        vec3 lit = col * (0.5 + 1.15 * ndl) * vec3(1.0, 0.98, 0.95);
        lit *= 1.0 - slope * 0.35;
        vec3 V = normalize(cameraPosition - vP);
        float rim = 1.0 - max(dot(up, V), 0.0);
        float far = smoothstep(1.2, 2.2, camD);
        lit += vec3(0.25,0.45,0.95) * pow(rim, 2.5) * 0.4 * far;
        gl_FragColor = vec4(lit, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  return new THREE.Mesh(g, mat);
}

export function buildOcean() {
  const g = new THREE.SphereGeometry(1.0, 192, 96);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { sunDir: { value: new THREE.Vector3(1, 0, 0) }, time: { value: 0 } },
    vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform vec3 sunDir; uniform float time; varying vec3 vP;
      void main(){
        vec3 N = normalize(vP);
        vec3 V = normalize(cameraPosition - vP);
        float camD = length(cameraPosition);
        // small animated waves perturbing the normal (sparkle)
        vec3 q = vP * 600.0;
        vec3 w = vec3(sin(q.x + time*1.3) + sin(q.y*1.3 - time), sin(q.y + time*1.1) + sin(q.z*1.2 + time*0.7), sin(q.z + time*0.9) + sin(q.x*1.1 - time*1.2));
        vec3 Nw = normalize(N + w * 0.03 * (1.0 - smoothstep(1.15, 1.6, camD)));
        float lodw = 1.0 - smoothstep(1.002, 1.02, camD);
        vec3 q2 = vP * 9000.0;
        Nw = normalize(Nw + vec3(sin(q2.x + time*2.0), sin(q2.y*1.2 - time*1.7), sin(q2.z*0.9 + time*1.3)) * 0.04 * lodw);
        float ndl = max(dot(N, sunDir), 0.0);
        float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 deep = vec3(0.006, 0.03, 0.075);
        vec3 sky = vec3(0.25, 0.45, 0.85);
        vec3 col = deep * (0.7 + 1.3 * ndl) + sky * fres * 0.5;
        vec3 H = normalize(sunDir + V);
        float spec = pow(max(dot(Nw, H), 0.0), 380.0) * 1.2 + pow(max(dot(N, H), 0.0), 80.0) * 0.06;
        col += vec3(1.0, 0.95, 0.85) * spec;
        float a = mix(0.72, 0.98, fres);
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.renderOrder = 1; return m;
}

export function buildClouds(seed) {
  // cube map (no pole pinching): each face drawn from 3D noise on the sphere
  const R = 256, n = makeNoise3(seed + 999), faces = [];
  // three.js cube face order: +x, -x, +y, -y, +z, -z
  const dirOf = (f, a, b) => [[1, -b, -a], [-1, -b, a], [a, 1, b], [a, -1, -b], [a, -b, 1], [-a, -b, -1]][f];
  for (let f = 0; f < 6; f++) {
    const cv = document.createElement('canvas'); cv.width = cv.height = R;
    const ctx = cv.getContext('2d'), img = ctx.createImageData(R, R);
    for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) {
      let [px, py, pz] = dirOf(f, (x + 0.5) / R * 2 - 1, (y + 0.5) / R * 2 - 1);
      const l = Math.hypot(px, py, pz); px /= l; py /= l; pz /= l;
      const band = 0.12 * Math.cos(Math.asin(py) * 6.0);
      const wv = fbm(n, px * 2, py * 2, pz * 2, 2) * 0.7;
      let v = fbm(n, px * 3.4 + wv, py * 4.5 + wv, pz * 3.4 - wv, 5, 2.1, 0.55);
      v = (v + band - 0.02) * 2.4;
      const a = Math.max(0, Math.min(1, v));
      const o = (y * R + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = 255; img.data[o + 3] = Math.round(Math.pow(a, 0.85) * 235);
    }
    ctx.putImageData(img, 0, 0); faces.push(cv);
  }
  const tex = new THREE.CubeTexture(faces); tex.needsUpdate = true;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { map: { value: tex }, sunDir: { value: new THREE.Vector3(1, 0, 0) }, opacity: { value: 1 } },
    vertexShader: `varying vec3 vL; varying vec3 vW; void main(){ vL = position; vW = (modelMatrix * vec4(position,1.0)).xyz;
      gl_Position = projectionMatrix * viewMatrix * vec4(vW,1.0); }`,
    fragmentShader: `
      uniform samplerCube map; uniform vec3 sunDir; uniform float opacity; varying vec3 vL; varying vec3 vW;
      void main(){
        float a = textureCube(map, vL).a;
        vec3 N = normalize(vW);
        vec3 c = vec3(1.0) * (0.55 + 0.55 * max(dot(N, sunDir), 0.0));
        gl_FragColor = vec4(c, a * opacity * 0.9);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1.034, 128, 64), mat);
  m.renderOrder = 2; return m;
}

export function buildAtmosphere() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { sunDir: { value: new THREE.Vector3(1, 0, 0) }, strength: { value: 1 } },
    vertexShader: `varying vec3 vW; void main(){ vW = (modelMatrix*vec4(position,1.0)).xyz; gl_Position = projectionMatrix*viewMatrix*vec4(vW,1.0); }`,
    fragmentShader: `
      uniform vec3 sunDir; uniform float strength; varying vec3 vW;
      void main(){
        vec3 ro = cameraPosition; vec3 rd = normalize(vW - ro);
        // closest approach of the view ray to the planet centre -> glow by height above surface
        float t = -dot(ro, rd); vec3 c = ro + rd * max(t, 0.0);
        float hgt = length(c);
        float g = smoothstep(1.075, 0.995, hgt);
        g = pow(g, 2.2);
        if (hgt < 1.0) g *= smoothstep(0.96, 1.0, hgt);
        vec3 col = vec3(0.3, 0.55, 1.0);
        gl_FragColor = vec4(col * g * 1.15 * strength, 1.0);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1.08, 96, 48), mat);
  m.renderOrder = 3; return m;
}

export function buildStars(seed) {
  const n = 5000, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  let s = seed * 9301 + 49297;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < n; i++) {
    let x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 2 - 1;
    if (i < n * 0.45) y *= 0.12; // a milky-way band
    const l = Math.hypot(x, y, z) || 1;
    pos.set([x / l * 90, y / l * 90, z / l * 90], i * 3);
    const b = 0.25 + Math.pow(r(), 6) * 1.6, t = r();
    col.set([b * (t < 0.2 ? 0.8 : 1), b * 0.95, b * (t > 0.8 ? 0.75 : 1.05)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true, depthWrite: false }));
}

export function buildSunGlow() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const ctx = cv.getContext('2d');
  const gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,250,1)'); gr.addColorStop(0.08, 'rgba(255,245,220,0.9)');
  gr.addColorStop(0.25, 'rgba(255,200,140,0.25)'); gr.addColorStop(1, 'rgba(255,180,120,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  sp.scale.set(14, 14, 1);
  return sp;
}

// sunDir passed to the shaders is the light direction (follows the camera), not the visible sun.
export class PlanetView {
  constructor(scene, world) {
    this.group = new THREE.Group();
    this.terrain = buildTerrain(world);
    this.ocean = buildOcean();
    this.clouds = buildClouds(world.seed);
    this.atmo = buildAtmosphere();
    this.group.add(this.terrain, this.ocean, this.clouds, this.atmo);
    scene.add(this.group);
  }
  update(sunDir, time, camAlt) {
    for (const m of [this.terrain, this.ocean, this.clouds, this.atmo]) m.material.uniforms.sunDir.value.copy(sunDir);
    this.ocean.material.uniforms.time.value = time;
    this.clouds.rotation.y = time * 0.004;
    this.clouds.material.uniforms.opacity.value = Math.min(1, Math.max(0, (camAlt - 0.05) / 0.15));
    this.atmo.material.uniforms.strength.value = Math.min(1, Math.max(0.25, (camAlt - 0.02) / 0.2));
  }
  dispose() {
    this.group.parent?.remove(this.group);
    this.group.traverse((o) => { o.geometry?.dispose(); if (o.material) { o.material.uniforms?.map?.value?.dispose(); o.material.dispose(); } });
  }
}
