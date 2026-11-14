// Invented Hebrew-sounding names.
const SYL = ['בו','רי','לה','מא','תו','קי','נו','זה','דה','שי','גו','פא','אל','רון','מי','טל','סה','בר','יה','נור','עד','צי','חו','לי','אור','כה','ומי','רה'];
export function makeName(id, salt = 0) {
  let h = (id * 2654435761 + salt * 97) >>> 0;
  const next = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h; };
  const n = 2 + (next() % 2);
  let s = '';
  for (let i = 0; i < n; i++) s += SYL[next() % SYL.length];
  // final letter forms (ך ם ן ף ץ) only at the end of a word
  const F = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' }, R = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
  s = s.replace(/[ךםןףץ]/g, (ch) => F[ch]);
  return s.slice(0, -1) + (R[s.slice(-1)] || s.slice(-1));
}
export function randomWorldName(rng) {
  const A = ['ארץ','עולם','כוכב','אי'], B = ['התכלת','הזריחה','החיים','השקט','הירוק','האור','החלומות','הסערה'];
  return A[Math.floor(rng() * A.length)] + ' ' + B[Math.floor(rng() * B.length)];
}
