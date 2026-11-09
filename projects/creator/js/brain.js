// Small feed-forward neural network with 2 recurrent memory values.
import { gaussian } from './noise.js';

export const INPUTS = [
  'אוכל: ימינה/שמאלה', 'אוכל: קדימה', 'אוכל: קרבה', 'אוכל: בשר?',
  'יצור: ימינה/שמאלה', 'יצור: קדימה', 'יצור: קרבה', 'יצור: דומה לי?', 'יצור: גודל יחסי',
  'אנרגיה', 'מים לפניי', 'גיל', 'זיכרון 1', 'זיכרון 2',
  'קן: ימינה/שמאלה', 'קן: קדימה', 'קן: קרבה', 'קבוע',
];
export const OUTPUTS = ['פנייה', 'מהירות', 'לאכול', 'לתקוף', 'להתרבות', 'זיכרון 1', 'זיכרון 2', 'לבנות קן'];
export const NI = INPUTS.length, NH = 10, NO = OUTPUTS.length;
export const NW = NI * NH + (NH + 1) * NO;

export function randomWeights(rng, scale = 1.0) {
  const w = new Float32Array(NW);
  for (let i = 0; i < NW; i++) w[i] = gaussian(rng) * scale;
  return w;
}

export function mutateWeights(w, rng, rate = 0.08, sigma = 0.3) {
  const c = new Float32Array(w);
  for (let i = 0; i < NW; i++) {
    if (rng() < rate) c[i] += gaussian(rng) * sigma;
    if (rng() < 0.002) c[i] = gaussian(rng); // rare big jump
  }
  return c;
}

export function crossWeights(a, b, rng) {
  const c = new Float32Array(NW);
  const cut = Math.floor(rng() * NH); // swap whole hidden neurons
  for (let h = 0; h < NH; h++) {
    const src = h < cut ? a : b;
    for (let i = 0; i < NI; i++) c[h * NI + i] = src[h * NI + i];
  }
  const off = NI * NH;
  for (let k = off; k < NW; k++) c[k] = rng() < 0.5 ? a[k] : b[k];
  return c;
}

// inp: Float32Array(NI), hid: Float32Array(NH), out: Float32Array(NO). Returns activity (sum |hid|).
export function think(w, inp, hid, out) {
  let act = 0, k = 0;
  for (let h = 0; h < NH; h++) {
    let s = 0;
    for (let i = 0; i < NI; i++) s += w[k++] * inp[i];
    const v = Math.tanh(s);
    hid[h] = v; act += v < 0 ? -v : v;
  }
  for (let o = 0; o < NO; o++) {
    let s = 0;
    for (let h = 0; h < NH; h++) s += w[k++] * hid[h];
    s += w[k++]; // bias
    out[o] = Math.tanh(s);
  }
  return act;
}
