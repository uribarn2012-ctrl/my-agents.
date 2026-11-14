// Planet data: a cube-sphere grid of heights, colors and fertility. Pure JS, used by
// both the renderer (planet.js) and the simulation (sim.js), also in node for tests.
import { makeNoise3, fbm, ridged, mulberry32 } from './noise.js';

export const MOUNTAIN_H = 0.028; // max terrain height above sea (planet radius = 1)
export const OCEAN_D = 0.02;     // max ocean depth

// face axis, U, V tangents (cross(U,V) == axis, so triangles face outward)
const FACES = [
  [[1,0,0],[0,0,-1],[0,1,0]], [[-1,0,0],[0,0,1],[0,1,0]],
  [[0,1,0],[1,0,0],[0,0,-1]], [[0,-1,0],[1,0,0],[0,0,1]],
  [[0,0,1],[1,0,0],[0,1,0]],  [[0,0,-1],[-1,0,0],[0,1,0]],
];
const Q = Math.PI / 4;

export function faceDir(f, a, b, out) { // a,b in [-1,1] (warped)
  const [A, U, V] = FACES[f];
  const u = Math.tan(a * Q), v = Math.tan(b * Q);
  const x = A[0] + u * U[0] + v * V[0], y = A[1] + u * U[1] + v * V[1], z = A[2] + u * U[2] + v * V[2];
  const l = Math.hypot(x, y, z);
  out[0] = x / l; out[1] = y / l; out[2] = z / l;
  return out;
}

function lerp3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function smooth(e0, e1, x) { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }

// Whittaker-like biome table: rows temperature (cold->hot), cols moisture (dry->wet). sRGB.
const BIOME = [
  [[0.52,0.49,0.42],[0.44,0.44,0.36],[0.22,0.29,0.20],[0.16,0.25,0.17]],
  [[0.58,0.54,0.40],[0.40,0.45,0.25],[0.19,0.31,0.13],[0.13,0.27,0.11]],
  [[0.70,0.60,0.42],[0.56,0.53,0.31],[0.21,0.34,0.12],[0.12,0.28,0.09]],
  [[0.82,0.67,0.46],[0.68,0.57,0.35],[0.26,0.37,0.13],[0.09,0.24,0.07]],
];
function biomeColor(t, m) {
  const ti = Math.min(2.999, Math.max(0, t * 3)), mi = Math.min(2.999, Math.max(0, m * 3));
  const i = Math.floor(ti), j = Math.floor(mi), ft = ti - i, fm = mi - j;
  const a = lerp3(BIOME[i][j], BIOME[i][j + 1], fm), b = lerp3(BIOME[i + 1][j], BIOME[i + 1][j + 1], fm);
  return lerp3(a, b, ft);
}

export function generateWorld(seed, N = 192) {
  const rng = mulberry32(seed * 7919 + 13);
  const nA = makeNoise3(seed), nB = makeNoise3(seed + 101), nC = makeNoise3(seed + 202), nD = makeNoise3(seed + 303);
  const S = N + 1, total = 6 * S * S;
  const raw = new Float32Array(total), moist = new Float32Array(total), tvar = new Float32Array(total);
  const dir = new Float32Array(total * 3);
  const d = [0, 0, 0];
  const contScale = 0.9 + rng() * 0.7;
  const ox = rng() * 100, oy = rng() * 100, oz = rng() * 100;
  for (let f = 0; f < 6; f++) for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
    const idx = f * S * S + j * S + i;
    faceDir(f, (i / N) * 2 - 1, (j / N) * 2 - 1, d);
    dir[idx * 3] = d[0]; dir[idx * 3 + 1] = d[1]; dir[idx * 3 + 2] = d[2];
    const x = d[0] + ox, y = d[1] + oy, z = d[2] + oz;
    // domain warp for natural coastlines
    const wx = fbm(nB, x * 1.6, y * 1.6, z * 1.6, 3), wy = fbm(nB, x * 1.6 + 5.2, y * 1.6, z * 1.6, 3), wz = fbm(nB, x * 1.6, y * 1.6 + 9.1, z * 1.6, 3);
    const px = x + wx * 0.45, py = y + wy * 0.45, pz = z + wz * 0.45;
    const cont = fbm(nA, px * contScale, py * contScale, pz * contScale, 6, 2.0, 0.5);
    const mtn = ridged(nC, px * 2.6, py * 2.6, pz * 2.6, 6, 2.1, 0.5);
    const detail = fbm(nA, x * 14, y * 14, z * 14, 3);
    const mmask = smooth(-0.05, 0.35, cont);
    raw[idx] = cont + mtn * 0.55 * mmask - 0.12 * (1 - mmask) * mtn + detail * 0.04;
    moist[idx] = fbm(nD, x * 1.8, y * 1.8, z * 1.8, 4);
    tvar[idx] = fbm(nD, x * 3 + 40, y * 3, z * 3, 3);
  }
  // sea level from quantile so every planet has a sensible land fraction
  const landFrac = 0.30 + rng() * 0.14;
  const sorted = Float32Array.from(raw).sort();
  const sea = sorted[Math.floor((1 - landFrac) * (total - 1))];
  const hmax = sorted[total - 1], hmin = sorted[0];

  const radius = new Float32Array(total), elev = new Float32Array(total);
  const color = new Float32Array(total * 3), fert = new Float32Array(total);
  for (let idx = 0; idx < total; idx++) {
    const y = dir[idx * 3 + 1];
    const lat = Math.asin(Math.max(-1, Math.min(1, y)));
    let c, e;
    if (raw[idx] >= sea) {
      e = (raw[idx] - sea) / (hmax - sea); // 0..1
      const er = Math.pow(e, 1.35);
      radius[idx] = 1.0 + Math.min(1, e / 0.01) * 0.0008 + er * MOUNTAIN_H; // continuous at the shore
      const latBand = 0.5 + 0.5 * Math.cos(Math.abs(lat) * 6.0);
      let m = Math.min(1, Math.max(0, 0.5 + moist[idx] * 0.9 + (latBand - 0.5) * 0.55 - e * 0.2));
      let t = Math.pow(Math.cos(lat), 1.1) * 1.1 - er * 1.4 + tvar[idx] * 0.15;
      t = Math.min(1, Math.max(0, t));
      c = biomeColor(t, m);
      // beaches
      c = lerp3([0.78, 0.72, 0.55], c, smooth(0.0, 0.025, e));
      // bare rock on high ground
      c = lerp3(c, [0.40, 0.37, 0.33], smooth(0.32, 0.6, er) * 0.85);
      // snow by temperature
      const snow = smooth(0.2, 0.02, t);
      c = lerp3(c, [0.93, 0.94, 0.96], snow);
      fert[idx] = Math.max(0, (m * 0.8 + 0.2) * smooth(0.05, 0.35, t) * (1 - smooth(0.3, 0.55, er)) * (1 - snow));
      elev[idx] = e;
    } else {
      const dd = (sea - raw[idx]) / (sea - hmin); // 0..1
      e = -dd;
      radius[idx] = 1.0 - Math.pow(dd, 0.7) * OCEAN_D;
      c = lerp3([0.45, 0.55, 0.42], [0.04, 0.08, 0.14], smooth(0.0, 0.25, dd));
      // polar sea ice
      const ice = smooth(1.25, 1.42, Math.abs(lat) + moist[idx] * 0.1);
      c = lerp3(c, [0.88, 0.91, 0.95], ice);
      elev[idx] = e;
      fert[idx] = 0;
    }
    color[idx * 3] = c[0]; color[idx * 3 + 1] = c[1]; color[idx * 3 + 2] = c[2];
  }
  return { seed, N, S, dir, radius, elev, color, fert, landFrac };
}

// direction (unit) -> face + continuous grid coords
const _g = { f: 0, gi: 0, gj: 0 };
export function dirToGrid(N, x, y, z) {
  const ax = Math.abs(x), ay = Math.abs(y), az = Math.abs(z);
  let f, m;
  if (ax >= ay && ax >= az) { f = x > 0 ? 0 : 1; m = ax; }
  else if (ay >= az) { f = y > 0 ? 2 : 3; m = ay; }
  else { f = z > 0 ? 4 : 5; m = az; }
  const [, U, V] = FACES[f];
  const u = (x * U[0] + y * U[1] + z * U[2]) / m, v = (x * V[0] + y * V[1] + z * V[2]) / m;
  _g.f = f;
  _g.gi = ((Math.atan(u) / Q) + 1) * 0.5 * N;
  _g.gj = ((Math.atan(v) / Q) + 1) * 0.5 * N;
  return _g;
}

export function sample(world, field, x, y, z) {
  const N = world.N, S = world.S;
  const g = dirToGrid(N, x, y, z);
  const i = Math.min(N - 1, Math.max(0, Math.floor(g.gi))), j = Math.min(N - 1, Math.max(0, Math.floor(g.gj)));
  const fi = g.gi - i, fj = g.gj - j;
  const b = g.f * S * S + j * S + i;
  const a00 = field[b], a10 = field[b + 1], a01 = field[b + S], a11 = field[b + S + 1];
  return (a00 * (1 - fi) + a10 * fi) * (1 - fj) + (a01 * (1 - fi) + a11 * fi) * fj;
}

export const isLand = (world, x, y, z) => sample(world, world.elev, x, y, z) > 0.004;
// exact height of the rendered terrain triangle (a,b,d / a,d,c) so tiny things sit on the ground
export function surfaceRadius(world, x, y, z) {
  const N = world.N, S = world.S, field = world.radius;
  const g = dirToGrid(N, x, y, z);
  const i = Math.min(N - 1, Math.max(0, Math.floor(g.gi))), j = Math.min(N - 1, Math.max(0, Math.floor(g.gj)));
  const fi = Math.min(1, Math.max(0, g.gi - i)), fj = Math.min(1, Math.max(0, g.gj - j));
  const b = g.f * S * S + j * S + i;
  const a = field[b], bb = field[b + 1], c = field[b + S], d = field[b + S + 1];
  return fi >= fj ? a + (bb - a) * fi + (d - bb) * fj : a + (c - a) * fj + (d - c) * fi;
}
