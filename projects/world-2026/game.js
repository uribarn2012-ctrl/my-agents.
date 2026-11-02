/* עולם 2026 — turn-based grand strategy. Original game. */
(function () {
'use strict';

/* ================= constants ================= */
const VERSION = 1;
const SAVE_KEY = 'world2026_save_v1';
const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const BLOC_HE = { NATO:'נאט״ו', EU:'האיחוד האירופי', CSTO:'CSTO (ברית רוסיה)', SCO:'ארגון שנגחאי', BRICS:'BRICS',
  ArabLeague:'הליגה הערבית', GCC:'מועצת המפרץ', AU:'האיחוד האפריקאי', ASEAN:'ASEAN', AUKUS:'AUKUS', QUAD:'הקוואד', CIS:'חבר העמים' };
const BLOC_W = { NATO:35, EU:25, CSTO:30, GCC:25, ArabLeague:10, SCO:10, BRICS:8, AU:5, ASEAN:10, AUKUS:30, QUAD:15, CIS:8 };
// rough defaults for map shapes that have no ISO code (marked as estimated in the UI)
const NOID_DATA = {
  '383': { en:'Kosovo', he:'קוסובו', pop:1.6, gdp:11, def:0.15, mil:5, nukes:0, gov:'democracy', blocs:[], approval:50 },
  SML: { en:'Somaliland', he:'סומלילנד', pop:5.7, gdp:7.5, def:0.1, mil:30, nukes:0, gov:'hybrid', blocs:[], approval:50 }
};
const GOV_HE = { democracy:'דמוקרטיה', authoritarian:'משטר סמכותני', hybrid:'משטר היברידי' };
const DEPS = {
  '840':['316','016','630','850','580'],
  '826':['239','086','654','612','660','238','136','060','092','796','500','832','831','833'],
  '528':['533','531','534'], '250':['666','876','663','652','258','540','260'], '246':['248'],
  '208':['304','234'], '156':['446','344'], '036':['334','574','IOT'], '554':['570','184'], '356':['SIA']
};
const NOID = { 'Somaliland':'SML', 'Kosovo':'383', 'N. Cyprus':'NCY', 'Indian Ocean Ter.':'IOT', 'Siachen Glacier':'SIA' };
const HE_EXTRA = { SML:'סומלילנד', '383':'קוסובו', NCY:'צפון קפריסין', '732':'סהרה המערבית', '010':'אנטארקטיקה' };
const UNPLAYABLE = new Set(['010','732','NCY']);
const HIDDEN = new Set(['010']);
const OIL = new Set(['682','643','364','368','784','414','634','578','566','862','012','434','398','124','512','048','024']);
const COL = { me:'#f5b301', ally:'#2f7bff', war:'#e5383b', neutral:'#3a4250', none:'#22272e' };

/* ================= helpers ================= */
const $ = s => document.querySelector(s);
const R = Math.random;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const key = (a, b) => a < b ? a + '|' + b : b + '|' + a;
const pick = arr => arr[Math.floor(R() * arr.length)];
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[ch]));
function money(bn, short) {
  const neg = bn < 0, v = Math.abs(bn);
  let s, w = '';
  if (short) s = v >= 1000 ? (v / 1000).toFixed(1) + 'T' : v >= 10 ? Math.round(v) + 'B' : v >= 1 ? v.toFixed(1) + 'B' : Math.round(v * 1000) + 'M';
  else if (v >= 1000) { s = (v / 1000).toFixed(2); w = ' טריליון'; }
  else if (v >= 1) { s = v >= 10 ? Math.round(v) : v.toFixed(1); w = ' מיליארד'; }
  else { s = Math.round(v * 1000); w = ' מיליון'; }
  // number stays LTR, the Hebrew unit word sits outside it so the phrase reads naturally right-to-left
  return '<span class="nw"><span class="num" dir="ltr">' + (neg ? '-' : '') + '$' + s + '</span>' + w + '</span>';
}
const num = (v, d) => '<span class="num" dir="ltr">' + (d ? v.toFixed(d) : Math.round(v).toLocaleString('en-US')) + '</span>';
const pct = v => '<span class="num" dir="ltr">' + Math.round(v) + '%</span>';
function popTxt(m) { return m >= 1 ? num(m, m < 10 ? 1 : 0) + ' מיליון' : num(m * 1000) + ' אלף'; }
function dateTxt(t) { return MONTHS[((t % 12) + 12) % 12] + ' ' + (2026 + Math.floor(t / 12)); }

/* ================= geometry ================= */
let TERR = {}, TIDS = [], FEATS = [];
function initGeo() {
  const topo = window.WORLD_TOPO;
  const geoms = topo.objects.countries.geometries;
  const fc = topojson.feature(topo, topo.objects.countries).features;
  const nb = topojson.neighbors(geoms);
  fc.forEach((f, i) => {
    f.properties = f.properties || {};
    const name = f.properties.name || '?';
    const tid = (f.id != null && f.id !== '') ? String(f.id) : (NOID[name] || ('X' + i));
    f.properties.tid = tid;
    let T = TERR[tid];
    if (!T) { T = TERR[tid] = { tid, name, feats: [], nb: new Set(), area: 0, best: null, bestA: 0 }; TIDS.push(tid); }
    T.feats.push(f);
    const g = f.geometry; if (!g) return;
    const polys = g.type === 'MultiPolygon' ? g.coordinates : g.type === 'Polygon' ? [g.coordinates] : [];
    polys.forEach(p => {
      const poly = { type: 'Polygon', coordinates: p };
      let a = d3.geoArea(poly); if (a > 2 * Math.PI) a = 4 * Math.PI - a;
      T.area += a; if (a > T.bestA) { T.bestA = a; T.best = poly; }
    });
  });
  fc.forEach((f, i) => nb[i].forEach(j => {
    const a = f.properties.tid, b = fc[j].properties.tid;
    if (a !== b) { TERR[a].nb.add(b); TERR[b].nb.add(a); }
  }));
  TIDS.forEach(t => { const T = TERR[t]; T.c = T.best ? d3.geoCentroid(T.best) : [0, 0]; T.km2 = T.area * 6371 * 6371; });
  FEATS = fc;
}

/* ================= state ================= */
let S = null;
let OWN = {}; const ADJ = new Map(), DIST = new Map(), BASE = new Map(); let START_REL = new Map();
function rebuildOwn() {
  OWN = {};
  for (const t in S.owner) { const o = S.owner[t]; if (o) (OWN[o] = OWN[o] || []).push(t); }
  ADJ.clear(); DIST.clear();
}
const tidsOf = c => OWN[c] || [];
const alive = () => Object.keys(S.c).filter(id => S.c[id].alive);
const P = () => S.c[S.player];
const nm = id => (S.c[id] && S.c[id].he) || HE_EXTRA[id] || (TERR[id] && TERR[id].name) || id;

function dataFor(tid, name) {
  const D = window.COUNTRY_DATA || {};
  if (D[tid]) return D[tid];
  if (NOID_DATA[tid]) { const e = Object.assign({}, NOID_DATA[tid]); e._est = true; return e; }
  const low = String(name).toLowerCase();
  for (const k in D) { const e = D[k]; if (e && e.en && String(e.en).toLowerCase() === low) return e; }
  return null;
}
function makeCountry(tid, d, T) {
  const km2 = T ? T.km2 : 50000;
  const def = d || {};
  const pop = +def.pop > 0 ? +def.pop : clamp(km2 / 1e6 * 20, 0.05, 40);
  const gdp = +def.gdp > 0 ? +def.gdp : Math.max(0.5, pop * 6);
  const dbud = +def.def > 0 ? +def.def : gdp * 0.015;
  const mil = +def.mil > 0 ? +def.mil : Math.max(1, pop * 1.5);
  const c = {
    id: tid, he: def.he || HE_EXTRA[tid] || (T && T.name) || tid, en: def.en || (T && T.name) || tid,
    pop, gdp, gdp0: gdp, def: dbud, defPct: clamp(dbud / gdp, 0.003, 0.15), mil, mil0: mil, equip: 0,
    nukes: Math.max(0, Math.round(+def.nukes || 0)), gov: GOV_HE[def.gov] ? def.gov : 'hybrid',
    blocs: Array.isArray(def.blocs) ? def.blocs.slice() : [], approval: clamp(+def.approval || 50, 5, 95),
    alive: true, generated: !d || !!def._est
  };
  c.equip = eqT(c);
  return c;
}
const eqT = c => 10 * Math.pow(Math.max(0.01, c.def), 0.85);
const power = c => c ? Math.max(1, c.mil * 0.6 + c.equip) : 0;

function newGame(playerId) {
  S = { v: VERSION, turn: 0, player: playerId, c: {}, owner: {}, rd: {}, pacts: {}, sanc: {}, wars: [], news: [], pending: [],
    recession: 0, wid: 1, over: null, won: {}, p: null, worldGdp0: 0 };
  BASE.clear();
  const depOwner = {};
  for (const o in DEPS) DEPS[o].forEach(t => depOwner[t] = o);
  const D = window.COUNTRY_DATA || {};
  for (const t in D) if (D[t] && D[t].owner && String(D[t].owner) !== t) depOwner[t] = String(D[t].owner);
  TIDS.forEach(t => {
    if (depOwner[t]) return;
    if (UNPLAYABLE.has(t)) { S.owner[t] = null; return; }
    const T = TERR[t];
    S.c[t] = makeCountry(t, dataFor(t, T.name), T);
    S.owner[t] = t;
  });
  TIDS.forEach(t => { if (depOwner[t]) S.owner[t] = S.c[depOwner[t]] ? depOwner[t] : null; });
  rebuildOwn();
  // initial sanctions from very hostile starting relations
  START_REL.forEach((v, k) => {
    if (v > -60) return;
    const [a, b] = k.split('|');
    if (!S.c[a] || !S.c[b]) return;
    if (S.c[a].gov === 'democracy') S.sanc[a + '>' + b] = 1;
    if (S.c[b].gov === 'democracy') S.sanc[b + '>' + a] = 1;
  });
  // real mutual-defence treaties outside NATO / CSTO (US–Japan, US–South Korea, US–Philippines, ANZUS, Russia–North Korea 2024)
  [['840', '392'], ['840', '410'], ['840', '608'], ['840', '036'], ['036', '554'], ['643', '408']].forEach(([a, b]) => { if (S.c[a] && S.c[b]) setPact(a, b, 'alliance', true); });
  (window.STARTING_WARS || []).forEach(pr => {
    const a = String(pr[0]), b = String(pr[1]);
    if (!S.c[a] || !S.c[b] || a === b) return;
    const w = declareWar(a, b, { silent: true, noJoin: true });
    if (w) { w.f = (a === '643' && b === '804') ? 18 : 6; w.start = -24; }
  });
  S.worldGdp0 = worldGdp();
  if (playerId) setupPlayer(playerId);
  return S;
}
function setupPlayer(id) {
  S.player = id;
  const c = S.c[id];
  S.p = { tax: clamp(Math.round((0.15 + 0.11 + clamp(c.defPct, 0.005, 0.12) - 0.005) * 100) / 100, 0.15, 0.5), welfare: 0.15, defPct: clamp(c.defPct, 0.005, 0.12), defPct0: clamp(c.defPct, 0.005, 0.12),
    treasury: c.gdp * 0.04, unrest: 0, shock: 0, lowTurns: 0, annexed: [], gdpHist: [c.gdp], budget: null,
    nprog: null, cas: 0, casTotal: 0, dip: {}, startGdp: c.gdp, startPop: c.pop, startShare: c.gdp / worldGdp(), bankrupt: false };
  addNews('ממשלה חדשה נכנסה לתפקיד ב' + c.he + '. העם מצפה לשינוי.', 'good');
}

/* ================= relations / pacts ================= */
function baseRel(a, b) {
  const k = key(a, b);
  if (BASE.has(k)) return BASE.get(k);
  let v = 0;
  if (START_REL.has(k)) v = START_REL.get(k);
  else {
    const A = S.c[a], B = S.c[b];
    if (A && B) {
      const shared = A.blocs.filter(x => B.blocs.includes(x));
      for (const x of shared) v += BLOC_W[x] || 5;
      v = Math.min(v, 70);
      const opp = (x, y) => (A.blocs.includes(x) && B.blocs.includes(y) && !A.blocs.includes(y)) || (A.blocs.includes(y) && B.blocs.includes(x) && !B.blocs.includes(y));
      if (opp('NATO', 'CSTO')) v -= 35; else if (opp('NATO', 'SCO')) v -= 12;
      if (A.gov === 'democracy' && B.gov === 'democracy') v += 10;
      else if (A.gov !== B.gov && (A.gov === 'democracy' || B.gov === 'democracy')) v -= 5;
    }
  }
  v = clamp(v, -100, 100); BASE.set(k, v); return v;
}
function rel(a, b) { if (a === b) return 100; return clamp(baseRel(a, b) + (S.rd[key(a, b)] || 0), -100, 100); }
function addRel(a, b, d) {
  if (a === b || !a || !b) return;
  const k = key(a, b), base = baseRel(a, b);
  const cur = clamp(base + (S.rd[k] || 0), -100, 100);
  S.rd[k] = clamp(cur + d, -100, 100) - base;
}
const pact = (a, b) => S.pacts[key(a, b)] || null;
function setPact(a, b, type, on) {
  const k = key(a, b); const p = S.pacts[k] || (S.pacts[k] = {});
  if (on) p[type] = 1; else delete p[type];
  if (!Object.keys(p).length) delete S.pacts[k];
}
const hasPact = (a, b, t) => !!(pact(a, b) && pact(a, b)[t]);
function isAlly(a, b) {
  if (a === b || !S.c[a] || !S.c[b]) return false;
  if (hasPact(a, b, 'alliance')) return true;
  const A = S.c[a].blocs, B = S.c[b].blocs;
  return (A.includes('NATO') && B.includes('NATO')) || (A.includes('CSTO') && B.includes('CSTO'));
}
const sanctions = (a, b) => !!S.sanc[a + '>' + b];
function sanctionHit(b) {
  let s = 0; const wg = worldGdp();
  for (const k in S.sanc) { const [a, t] = k.split('>'); if (t === b && S.c[a] && S.c[a].alive) s += S.c[a].gdp; }
  return Math.min(0.3, s / wg * 0.35);
}
let WG_CACHE = { t: -1, v: 1 };
function worldGdp() {
  if (WG_CACHE.t === (S ? S.turn + ':' + S.wid : 0)) return WG_CACHE.v;
  let s = 0; for (const id in S.c) if (S.c[id].alive) s += S.c[id].gdp;
  WG_CACHE = { t: S.turn + ':' + S.wid, v: s || 1 }; return WG_CACHE.v;
}

/* ================= distances ================= */
function adjacent(a, b) {
  const k = key(a, b); if (ADJ.has(k)) return ADJ.get(k);
  let r = false;
  outer: for (const t of tidsOf(a)) for (const n of TERR[t].nb) if (S.owner[n] === b) { r = true; break outer; }
  ADJ.set(k, r); return r;
}
function dist(a, b) {
  const k = key(a, b); if (DIST.has(k)) return DIST.get(k);
  let m = 1e9;
  for (const t of tidsOf(a)) for (const u of tidsOf(b)) {
    const d = d3.geoDistance(TERR[t].c, TERR[u].c) * 6371; if (d < m) m = d;
  }
  DIST.set(k, m); return m;
}
function proj(a, b) {
  if (adjacent(a, b)) return 1;
  const d = dist(a, b), pw = power(S.c[a]);
  const reach = pw / (pw + 1500);
  let p = reach * 1.5 * 1500 / (1500 + Math.max(0, d - 300));
  if (d < 700) p = Math.max(p, 0.7);
  return clamp(p, 0.04, 0.85);
}
// allies fight from the defended country's soil, so they need less reach
function allyProj(m, leader, enemy) { return m === leader ? proj(m, enemy) : Math.max(proj(m, enemy), 0.6 * proj(leader, enemy)); }
function neighborsOf(a) {
  const s = new Set();
  for (const t of tidsOf(a)) for (const n of TERR[t].nb) { const o = S.owner[n]; if (o && o !== a) s.add(o); }
  return [...s];
}

/* ================= news ================= */
function addNews(txt, k) { S.news.unshift({ t: S.turn, txt, k: k || 'event' }); if (S.news.length > 150) S.news.length = 150; }

/* ================= wars ================= */
const inWar = (w, x) => w.A.includes(x) || w.B.includes(x);
function atWar(x, y) { return S.wars.some(w => (w.A.includes(x) && w.B.includes(y)) || (w.B.includes(x) && w.A.includes(y))); }
const warsOf = x => S.wars.filter(w => inWar(w, x));
const involvesPlayer = w => inWar(w, S.player);
const enemyLeaderFor = (w, x) => w.A.includes(x) ? w.b : w.a;
const mySideFront = (w, x) => w.A.includes(x) ? w.f : -w.f; // >0 => my side occupies the enemy leader
function commit(x, w) { const n = warsOf(x).length || 1; return ((w.a === x || w.b === x) ? 1 : 0.35) / n; }
function likelyJoiners(att, def) {
  return alive().filter(c => c !== att && c !== def && isAlly(c, def) && !isAlly(c, att) && !atWar(c, def));
}
function declareWar(att, def, opt) {
  opt = opt || {};
  if (!S.c[att] || !S.c[def] || atWar(att, def)) return null;
  const w = { id: S.wid++, a: att, b: def, A: [att], B: [def], f: 0, start: S.turn, pause: 0, stance: 'attack', used: {}, last: 0 };
  S.wars.push(w);
  const breakNap = hasPact(att, def, 'nap');
  ['nap', 'trade', 'alliance'].forEach(t => setPact(att, def, t, false));
  addRel(att, def, -200);
  if (!opt.silent) {
    // world reaction to aggression
    alive().forEach(c => {
      if (c === att || c === def) return;
      let d = -4; if (S.c[c].gov === 'democracy') d -= 6; if (isAlly(c, def)) d -= 30; if (breakNap) d -= 10;
      addRel(c, att, d);
    });
  }
  const joined = [];
  if (!opt.noJoin) {
    likelyJoiners(att, def).forEach(c => {
      const pr = hasPact(c, def, 'alliance') ? 0.85 : (S.c[c].blocs.includes('NATO') ? 0.95 : 0.7);
      if (c === S.player) { S.pending.push({ type: 'ally', wid: w.id, ally: def }); return; }
      if (R() < pr) { w.B.push(c); joined.push(c); addRel(c, att, -40); }
    });
    alive().forEach(c => {
      if (c === att || c === def || c === S.player || w.B.includes(c)) return;
      if (hasPact(c, att, 'alliance') && !isAlly(c, def) && R() < 0.3) { w.A.push(c); joined.push(c); }
    });
  }
  if (!opt.silent) {
    const pl = att === S.player || def === S.player;
    addNews((att === S.player ? 'הכרזת מלחמה על ' + nm(def) : nm(att) + ' הכריזה מלחמה על ' + nm(def)) +
      (joined.length ? '. הצטרפו ללחימה: ' + joined.slice(0, 6).map(nm).join(', ') + (joined.length > 6 ? ' ועוד ' + (joined.length - 6) : '') : '') + '.', pl ? 'war' : 'world');
  }
  return w;
}
function endWar(w) {
  S.wars = S.wars.filter(x => x !== w);
  addRel(w.a, w.b, 60); // from -100 back to hostile
}
function aidFor(side, enemy, w) {
  let s = 0, n = 0;
  const list = alive().filter(c => !inWar(w, c) && rel(c, side) > 40 && rel(c, enemy) < -20).sort((x, y) => power(S.c[y]) - power(S.c[x]));
  for (const c of list) { s += power(S.c[c]) * 0.05; if (++n >= 15) break; }
  return s;
}
function battle(w) {
  if (w.pause > 0) {
    w.pause--;
    if (w.pause === 0) {
      if (!involvesPlayer(w) || R() < 0.5) { addNews('הפסקת האש בין ' + nm(w.a) + ' ל' + nm(w.b) + ' הפכה להסכם שלום.', involvesPlayer(w) ? 'good' : 'world'); endWar(w); }
      else addNews('הפסקת האש עם ' + nm(enemyLeaderFor(w, S.player)) + ' קרסה — הלחימה התחדשה!', 'war');
    }
    return;
  }
  const eff = (side, leader, enemy) => { let e = 0; for (const m of side) { const c = S.c[m]; if (c && c.alive) e += power(c) * commit(m, w) * allyProj(m, leader, enemy); } return e; };
  let eA = eff(w.A, w.a, w.b) + aidFor(w.a, w.b, w) * 0.5, eB = eff(w.B, w.b, w.a) + aidFor(w.b, w.a, w);
  let lmA = 1, lmB = 1;
  const pSide = w.A.includes(S.player) ? 'A' : w.B.includes(S.player) ? 'B' : null;
  if (pSide) {
    const home = mySideFront(w, S.player) <= 0;
    let m, l;
    if (w.stance === 'attack') { m = 1.2; l = 1.5; } else { m = home ? 1.15 : 0.85; l = 0.7; }
    if (pSide === 'A') { eA *= m; lmA = l; } else { eB *= m; lmB = l; }
  }
  eA *= 1 - Math.max(0, -w.f) / 200; eB *= 1 - Math.max(0, w.f) / 200;
  if (w.f > 0) eB *= 1.3 + w.f / 250; else if (w.f < 0) eA *= 1.3 - w.f / 250;
  const r = eA / (eA + eB + 1e-9);
  // big countries take longer to occupy
  const occupied = r >= 0.5 ? S.c[w.b] : S.c[w.a];
  const size = clamp(Math.sqrt(15 / Math.max(0.5, occupied ? occupied.pop : 15)), 0.3, 0.75);
  let shift = ((r - 0.5) * 32 + (R() - 0.5) * 3) * size * (pSide ? 1 : 0.6);
  // the deeper the occupation, the stronger the local resistance (insurgency, cities, supply lines)
  if (shift * w.f > 0) shift *= 1 - 0.5 * Math.abs(w.f) / 100;
  // invading across the sea (no shared border) is much slower than a land offensive
  if (!adjacent(w.a, w.b)) shift *= 0.55;
  w.f = clamp(w.f + shift, -100, 100); w.last = shift;
  const lossA = 0.006 * (1 - r) * 2 * lmA, lossB = 0.006 * r * 2 * lmB;
  const hurt = (side, loss) => side.forEach(m => {
    const c = S.c[m]; if (!c || !c.alive) return;
    const k = commit(m, w), dead = c.mil * k * loss;
    c.mil -= dead; c.equip -= c.equip * k * loss * 0.7;
    if (m === S.player) S.p.cas += dead;
  });
  hurt(w.A, lossA); hurt(w.B, lossB);
  if (pSide) {
    const me = mySideFront(w, S.player), en = enemyLeaderFor(w, S.player);
    const myShift = pSide === 'A' ? shift : -shift;
    if (Math.abs(myShift) >= 1) addNews('חזית ' + nm(en) + ': ' + (myShift > 0 ? 'כוחותינו התקדמו' : 'האויב התקדם') + ' (' + (me >= 0 ? 'אנחנו מחזיקים ' + Math.round(me) + '% משטחם' : 'האויב מחזיק ' + Math.round(-me) + '% משטחנו') + ').', myShift > 0 ? 'good' : 'bad');
    if (myShift > 5) S.p.shock += 0.6;
  }
  checkWarEnd(w);
}
function checkWarEnd(w) {
  if (!S.wars.includes(w)) return;
  if (w.f >= 100) annex(w.a, w.b);
  else if (w.f <= -100) annex(w.b, w.a);
}
function annex(win, lose) {
  const W = S.c[win], L = S.c[lose];
  if (!W || !L || !L.alive) return;
  tidsOf(lose).slice().forEach(t => S.owner[t] = win);
  L.alive = false; L.annexedBy = win;
  W.pop += L.pop * 0.85; W.gdp += L.gdp * 0.5; W.nukes += Math.floor(L.nukes * 0.5); W.mil += L.mil * 0.05;
  S.wars.filter(w => w.a === lose || w.b === lose).forEach(w => S.wars = S.wars.filter(x => x !== w));
  S.wars.forEach(w => { w.A = w.A.filter(x => x !== lose); w.B = w.B.filter(x => x !== lose); });
  for (const k in S.pacts) if (k.split('|').includes(lose)) delete S.pacts[k];
  for (const k in S.sanc) if (k.split('>').includes(lose)) delete S.sanc[k];
  S.pending = S.pending.filter(p => !p.wid || S.wars.some(w => w.id === p.wid));
  rebuildOwn();
  alive().forEach(c => { if (c !== win) addRel(c, win, S.c[c].gov === 'democracy' ? -15 : -8); });
  if (lose === S.player) {
    gameOver('annexed', nm(win) + ' כבשה את ' + L.he + ' כולה וסיפחה אותה. המדינה שלך כבר לא קיימת.');
  } else if (win === S.player) {
    S.p.annexed.push(lose); S.p.shock += 5; S.p.unrest += 5;
    addNews('ניצחון! ' + L.he + ' נכבשה וסופחה ל' + W.he + '. ההמונים חוגגים, אבל השליטה בשטח הכבוש תהיה יקרה.', 'good');
  } else {
    addNews(nm(win) + ' השלימה את כיבוש ' + L.he + ' וסיפחה אותה. העולם בהלם.', 'world');
  }
  needMapRecolor = true;
}
function cede(win, lose, share) {
  const W = S.c[win], L = S.c[lose]; share = clamp(share, 0.02, 0.5);
  W.pop += L.pop * share; W.gdp += L.gdp * share * 0.6;
  L.pop *= 1 - share; L.gdp *= 1 - share; L.mil *= 1 - share * 0.5; L.equip *= 1 - share * 0.3;
  if (win === S.player) { S.p.shock += 3; S.p.unrest += 2; }
  if (lose === S.player) S.p.shock -= 8;
}

/* ================= economy ================= */
function playerEconomy() {
  const c = P(), p = S.p;
  c.def = c.gdp * p.defPct;
  const m = c.gdp / 12;
  const b = { income: m * p.tax, welfare: m * p.welfare, admin: m * 0.11, defense: c.def / 12, war: 0, interest: 0, upkeep: 0, nuke: 0 };
  warsOf(S.player).forEach(w => { if (w.pause > 0) return; const en = enemyLeaderFor(w, S.player); b.war += 0.002 * power(c) * commit(S.player, w) / Math.sqrt(proj(S.player, en)); });
  if (p.treasury < 0) b.interest = -p.treasury * (p.bankrupt ? 0.009 : 0.0035);
  if (c.mil > c.mil0) b.upkeep = (c.mil - c.mil0) * 0.004;
  if (p.nprog && !p.nprog.done) b.nuke = nukeCost(c);
  b.net = b.income - b.welfare - b.admin - b.defense - b.war - b.interest - b.upkeep - b.nuke;
  p.treasury += b.net; p.budget = b;
  // growth
  const wars = warsOf(S.player).filter(w => w.pause === 0).length;
  let g = 0.026 + (R() - 0.5) * 0.012 - (p.tax - 0.30) * 0.08 + (p.welfare - 0.15) * 0.03 - sanctionHit(S.player) * 0.05 - wars * 0.012 - (S.recession > 0 ? 0.03 : 0);
  let tr = 0; for (const k in S.pacts) if (S.pacts[k].trade && k.split('|').includes(S.player)) tr++;
  g += Math.min(0.02, tr * 0.004);
  const debtRatio = p.treasury < 0 ? -p.treasury / c.gdp : 0;
  if (debtRatio > 0.6) g -= (debtRatio - 0.6) * 0.05;
  if (p.bankrupt) g -= 0.03;
  c.gdp *= 1 + g / 12;
  c.pop *= 1 + 0.008 / 12;
  equipStep(c);
  p.gdpHist.push(c.gdp); if (p.gdpHist.length > 13) p.gdpHist.shift();
  // bankruptcy
  if (!p.bankrupt && debtRatio > 1.0) { p.bankrupt = true; p.shock -= 10; addNews('פשיטת רגל! ' + c.he + ' לא עומדת בתשלומי החוב. הריבית מזנקת והעם זועם.', 'bad'); }
  else if (p.bankrupt && debtRatio < 0.8) { p.bankrupt = false; addNews('המשבר הפיננסי מאחורינו — דירוג האשראי שוקם.', 'good'); }
}
function equipStep(c) {
  c.equip += (eqT(c) - c.equip) * 0.03;
  const atw = warsOf(c.id).some(w => w.pause === 0);
  if (c.mil < c.mil0) c.mil += (c.mil0 - c.mil) * (atw ? 0.03 : 0.02);
}
function aiEconomy() {
  alive().forEach(id => {
    if (id === S.player) return;
    const c = S.c[id];
    const wars = warsOf(id).filter(w => w.pause === 0).length;
    const g = 0.025 + (R() - 0.5) * 0.02 - sanctionHit(id) * 0.05 - wars * 0.015 - (S.recession > 0 ? 0.03 : 0);
    c.gdp *= 1 + g / 12; c.pop *= 1 + 0.008 / 12;
    c.def = c.gdp * c.defPct * (wars ? 1.5 : 1);
    equipStep(c);
    c.approval = clamp(c.approval + (50 - c.approval) * 0.03 + (R() - 0.5) * 4 - wars * 0.3, 5, 95);
  });
  if (S.recession > 0) S.recession--;
}

/* ================= approval ================= */
function warWeariness() {
  const wars = warsOf(S.player).filter(w => w.pause === 0).length;
  return wars * 3.5;
}
function approvalTarget() {
  const c = P(), p = S.p;
  const wars = warsOf(S.player).filter(w => w.pause === 0).length;
  let T = 62 - (p.tax - 0.30) * 120 + (p.welfare - 0.15) * 150 - warWeariness();
  if (!wars) T -= Math.max(0, p.defPct - 0.05) * 100 * 1.2;
  const debtRatio = p.treasury < 0 ? -p.treasury / c.gdp : 0;
  if (debtRatio > 0.6) T -= (debtRatio - 0.6) * 30;
  if (p.bankrupt) T -= 15;
  T -= sanctionHit(S.player) * 40;
  T -= p.unrest;
  const h = p.gdpHist; if (h.length >= 13 && h[h.length - 1] / h[0] > 1.02) T += 3;
  const sens = c.gov === 'authoritarian' ? 0.7 : c.gov === 'hybrid' ? 0.85 : 1;
  return clamp(50 + (T - 50) * sens, 0, 100);
}
function approvalStep() {
  const c = P(), p = S.p;
  // casualties shock
  const casK = p.cas; p.casTotal += casK; p.cas = 0;
  if (casK > 0) p.shock -= Math.min(4, 25 * casK / Math.max(0.5, c.pop));
  const T = approvalTarget();
  c.approval = clamp(c.approval + (T - c.approval) * 0.12 + p.shock, 0, 100);
  p.shock = 0; p.unrest = Math.max(0, p.unrest - 0.3);
  const thr = { democracy: 15, hybrid: 12, authoritarian: 10 }[c.gov], need = c.gov === 'authoritarian' ? 4 : 3;
  const protestAt = c.gov === 'authoritarian' ? 25 : 30;
  if (c.approval < protestAt) {
    c.gdp *= 0.997;
    p.unrest += 1; // months of protests build up anger: ignoring the street eventually topples any regime
    addNews(pick(['מאות אלפים מפגינים ברחובות נגד הממשלה.', 'שביתה כללית משביתה את המשק — העם דורש שינוי.', 'הפגנות סוערות מול משרדי הממשלה; המשטרה בכוננות.']), 'bad');
  }
  if (c.approval < thr) {
    p.lowTurns++;
    if (p.lowTurns === 1) addNews('אזהרה: המדינה על סף מהפכה. אם תמיכת העם לא תעלה — הממשלה תיפול.', 'bad');
    if (p.lowTurns >= need) return gameOver('revolution', 'תמיכת העם קרסה ל-' + Math.round(c.approval) + '%. ' + (c.gov === 'democracy' ? 'הממשלה נפלה, והבחירות הוקדמו — אתה בחוץ.' : 'מהפכה עממית הפילה את השלטון.'));
  } else p.lowTurns = 0;
  if (c.gov !== 'democracy' && c.approval < 25 && p.defPct < p.defPct0 * 0.6 && R() < 0.06)
    return gameOver('coup', 'הצבא, שתקציבו קוצץ והעם שנגדך, ביצע הפיכה צבאית.');
  if (c.gov === 'democracy' && S.turn % 48 === 33) {
    if (c.approval >= 45) { p.shock += 4; addNews('ניצחת בבחירות! העם נתן לך מנדט חדש.', 'good'); }
    else { p.shock -= 4; addNews('הבחירות הסתיימו בתיקו מתיש. הקואליציה שלך שברירית.', 'bad'); }
  }
}

/* ================= AI ================= */
function aiDiplomacy() {
  // relations drift
  for (const k in S.rd) {
    const [a, b] = k.split('|');
    if (atWar(a, b)) continue;
    S.rd[k] *= 0.985; if (Math.abs(S.rd[k]) < 0.5) delete S.rd[k];
  }
  const ids = alive();
  // reactions toward the player
  ids.forEach(c => {
    if (c === S.player) return;
    const r = rel(c, S.player), C = S.c[c];
    const sKey = c + '>' + S.player;
    if (!S.sanc[sKey] && r < -55 && C.gov !== 'authoritarian' && C.gdp > 50 && R() < 0.08 && !atWar(c, S.player)) {
      S.sanc[sKey] = 1; S.p.shock -= 0.5;
      addNews(C.he + ' הטילה סנקציות כלכליות על ' + P().he + '.', 'bad');
    } else if (S.sanc[sKey] && r > -20 && R() < 0.15) {
      delete S.sanc[sKey]; addNews(C.he + ' הסירה את הסנקציות נגדנו.', 'good');
    }
  });
  // a few world diplomacy events
  for (let i = 0; i < 3; i++) {
    const a = pick(ids), nbs = neighborsOf(a); if (!nbs.length || a === S.player) continue;
    const b = pick(nbs); if (b === S.player || !S.c[b] || !S.c[b].alive) continue;
    const r = rel(a, b), roll = R();
    if (roll < 0.04 && r > 35 && !hasPact(a, b, 'trade')) { setPact(a, b, 'trade', true); addRel(a, b, 8); addNews(nm(a) + ' ו' + nm(b) + ' חתמו על הסכם סחר.', 'world'); }
    else if (roll < 0.06 && r < -40 && !atWar(a, b)) { addRel(a, b, -8); addNews('מתיחות בגבול ' + nm(a) + '–' + nm(b) + ': חילופי האשמות ותרגילים צבאיים.', 'world'); }
    else if (roll < 0.08 && r > 0 && r < 60) { addRel(a, b, 6); addNews('פסגה מדינית: ראשי ' + nm(a) + ' ו' + nm(b) + ' נפגשו לשיחות.', 'world'); }
    else addRel(a, b, (R() - 0.5) * 6);
  }
}
function aiWars() {
  const ids = alive();
  const aiWarsN = S.wars.filter(w => !involvesPlayer(w)).length;
  for (let i = 0; i < 14; i++) {
    const a = pick(ids); if (a === S.player) continue;
    const A = S.c[a]; if (warsOf(a).length) continue;
    for (const b of neighborsOf(a)) {
      const B = S.c[b]; if (!B || !B.alive) continue;
      if (rel(a, b) > -45 || isAlly(a, b) || hasPact(a, b, 'nap')) continue;
      let def = power(B) * 1.3;
      ids.forEach(c => { if (c !== a && c !== b && isAlly(c, b) && !isAlly(c, a)) def += power(S.c[c]) * 0.35 * allyProj(c, b, a); });
      const ratio = power(A) * proj(a, b) / (def + 1);
      const isP = b === S.player;
      const g = A.gov === 'authoritarian' ? 1.5 : A.gov === 'hybrid' ? 1 : 0.3;
      const pr = isP ? (ratio > 1.6 && rel(a, b) < -70 ? 0.04 * g : 0) : (ratio > 2 && aiWarsN < 6 ? 0.035 * g : 0);
      if (R() < pr) { declareWar(a, b); return; }
    }
  }
  // AI wars ending
  S.wars.slice().forEach(w => {
    if (involvesPlayer(w) || !S.wars.includes(w) || w.pause > 0) return;
    const age = S.turn - w.start, f = w.f;
    if (Math.abs(f) >= 50 && R() < 0.12) {
      const win = f > 0 ? w.a : w.b, lose = f > 0 ? w.b : w.a;
      cede(win, lose, Math.abs(f) / 200);
      addNews(nm(lose) + ' נכנעה ל' + nm(win) + ' וויתרה על חלק משטחה בהסכם שלום.', 'world'); endWar(w);
    } else if (age > 18 && Math.abs(f) < 30 && R() < 0.012) {
      w.pause = 6; addNews('הפסקת אש בין ' + nm(w.a) + ' ל' + nm(w.b) + ' בתיווך בינלאומי.', 'world');
    }
  });
  // AI offers to the player
  warsOf(S.player).forEach(w => {
    if (w.pause > 0 || S.pending.some(p => p.wid === w.id)) return;
    const lead = w.a === S.player || w.b === S.player; if (!lead) return;
    const en = enemyLeaderFor(w, S.player), fp = mySideFront(w, S.player), age = S.turn - w.start;
    if (fp > 40 && R() < 0.25) S.pending.push({ type: 'peace', wid: w.id, from: en, kind: fp > 70 ? 'terr' : 'repar', share: fp / 200 });
    else if (fp < -35 && R() < 0.2) S.pending.push({ type: 'demand', wid: w.id, from: en, share: -fp / 200 });
    else if (age > 12 && Math.abs(fp) < 15 && R() < 0.08) S.pending.push({ type: 'peace', wid: w.id, from: en, kind: 'white' });
  });
  // AI nuclear desperation
  S.wars.slice().forEach(w => {
    [[w.b, w.a, w.f], [w.a, w.b, -w.f]].forEach(([victim, att, occ]) => {
      const V = S.c[victim]; if (!V || !V.alive || V.nukes <= 0 || occ < 85 || victim === S.player) return;
      if (!S.wars.includes(w) || R() > 0.3) return;
      V.nukes--; nukeImpact(victim, att, true);
      if (S.wars.includes(w)) { if (w.a === victim) w.f += 40; else w.f -= 40; w.f = clamp(w.f, -100, 100); }
    });
  });
}

/* ================= events ================= */
function randomEvents() {
  const ids = alive(), me = P();
  if (R() < 0.035) {
    ids.forEach(id => { const c = S.c[id]; c.gdp *= OIL.has(id) ? 1.015 : 0.996; });
    addNews('מחירי הנפט זינקו ב-30% בעקבות מתיחות במפרץ. ' + (OIL.has(S.player) ? 'הקופה שלנו מרוויחה.' : 'המשק שלנו נפגע.'), OIL.has(S.player) ? 'good' : 'bad');
  }
  if (R() < 0.018 && S.recession === 0) { S.recession = 8; S.p.shock -= 2; addNews('מיתון עולמי: הבורסות צונחות והצמיחה נעצרת בכל העולם.', 'bad'); }
  if (R() < 0.12) {
    const id = pick(ids), c = S.c[id], hit = 0.01 + R() * 0.02;
    const kind = pick(['רעידת אדמה', 'שיטפונות קשים', 'סופת הוריקן', 'בצורת חמורה', 'שריפות ענק']);
    c.gdp *= 1 - hit;
    if (id === S.player) { S.p.shock -= 2; S.p.treasury -= c.gdp * 0.003; addNews(kind + ' פגעה ב' + c.he + '. הממשלה מממנת שיקום.', 'bad'); }
    else addNews(kind + ' ב' + c.he + ': נזק כבד ואלפי עקורים.', 'world');
  }
  if (R() < 0.05) {
    const dems = ids.filter(i => S.c[i].gov === 'democracy' && i !== S.player);
    if (dems.length) { const id = pick(dems); addNews('בחירות ב' + nm(id) + ': ' + pick(['השלטון הוחלף', 'הממשלה נבחרה מחדש', 'הימין ניצח', 'השמאל ניצח', 'נוצר תיקו פוליטי']) + '.', 'world'); }
  }
  if (R() < 0.03) { S.p.shock -= 4; addNews(pick(['שערוריית שחיתות בממשלה מסעירה את המדינה.', 'דליפה מביכה מהלשכה: התקשורת חוגגת.', 'שר בכיר התפטר בעקבות חקירה.']), 'bad'); }
  if (R() < 0.03) { me.gdp *= 1.008; S.p.shock += 2; addNews(pick(['תעשיית ההייטק מזנקת: השקעות זרות זורמות למדינה.', 'תגלית גז טבעי גדולה מול החוף.', 'שנת יבול שיא לחקלאות.']), 'good'); }
  if (R() < 0.004) { ids.forEach(id => S.c[id].gdp *= 0.98); S.p.shock -= 3; addNews('מגפה חדשה מתפשטת בעולם. מדינות סוגרות גבולות.', 'bad'); }
  const unhappy = ids.filter(i => i !== S.player && S.c[i].approval < 20);
  if (unhappy.length && R() < 0.2) addNews('מחאות המוניות ב' + nm(pick(unhappy)) + ' נגד השלטון.', 'world');
}
function nukeProgram() {
  const p = S.p, c = P(), np = p.nprog; if (!np) return;
  if (!np.done) {
    np.m++;
    if (!np.disc && R() < 0.03) {
      np.disc = true;
      addNews('חשיפה: מודיעין זר חשף את תוכנית הגרעין הסודית של ' + c.he + '! העולם דורש לעצור.', 'bad');
      alive().forEach(id => { if (id === S.player) return; const C = S.c[id]; const d = C.gov === 'democracy' ? -30 : -12; addRel(id, S.player, d);
        if (C.gov === 'democracy' && (C.blocs.includes('NATO') || C.blocs.includes('EU')) && !isAlly(id, S.player)) S.sanc[id + '>' + S.player] = 1; });
    }
    if (np.disc && R() < 0.04) {
      const strikers = ['840', '376'].filter(s => S.c[s] && S.c[s].alive && s !== S.player && !isAlly(s, S.player));
      if (strikers.length) {
        const s = pick(strikers); np.m = Math.max(0, np.m - 8); c.equip *= 0.95; p.shock += 2;
        addNews(nm(s) + ' תקפה מהאוויר את מתקני הגרעין שלנו! התוכנית נסוגה ב-8 חודשים.', 'bad');
      }
    }
    if (np.m >= 36) {
      np.done = true; np.since = S.turn; c.nukes += 3;
      addNews(c.he + ' ביצעה ניסוי גרעיני תת-קרקעי. מעכשיו — מעצמה גרעינית.', 'war');
      alive().forEach(id => { if (id !== S.player) addRel(id, S.player, -20); });
    }
  } else if ((S.turn - np.since) % 6 === 5 && c.nukes < 60) c.nukes++;
}

/* ================= turn ================= */
let needMapRecolor = false;
function endTurn() {
  if (!S || S.over) return;
  const before = { tr: S.p.treasury, ap: P().approval, pw: power(P()), gdp: P().gdp };
  const startNews = S.news.length ? S.news[0] : null;
  playerEconomy();
  aiEconomy();
  S.wars.slice().forEach(w => { if (S.wars.includes(w) && !S.over) battle(w); });
  if (!S.over) aiDiplomacy();
  if (!S.over) aiWars();
  if (!S.over) randomEvents();
  if (!S.over) nukeProgram();
  if (!S.over) approvalStep();
  if (!S.over) checkWin();
  const fresh = [];
  for (const n of S.news) { if (n === startNews) break; fresh.push(n); }
  S.turn++;
  S.p.dip = {};
  save();
  renderAll();
  if (S.over) return showGameOver();
  showTurnSummary(before, fresh);
}
function checkWin() {
  const share = P().gdp / worldGdp();
  if (!S.won.gdp && share >= 0.35) { S.won.gdp = 1; S.pending.push({ type: 'win', txt: 'ניצחון כלכלי! ' + P().he + ' שולטת ב-' + Math.round(share * 100) + '% מהכלכלה העולמית.' }); }
  if (!S.won.time && S.turn + 1 >= 120) { S.won.time = 1; S.pending.push({ type: 'win', txt: 'שרדת עשר שנים בשלטון — עד 2036!' }); }
}
function score() {
  if (!S || !S.player) return 0;
  const c = P();
  return Math.max(0, Math.round(c.gdp / worldGdp() * 10000 + c.approval * 10 + S.p.annexed.length * 500 + S.turn * 5 + Math.min(500, power(c) / 10)));
}
function gameOver(reason, txt) { S.over = { reason, txt }; addNews('סוף המשחק: ' + txt, 'bad'); }

/* ================= nuclear ================= */
function nukeImpact(att, tgt, ai) {
  const T = S.c[tgt], A = S.c[att];
  T.pop *= 0.94; T.gdp *= 0.65; T.equip *= 0.5; T.mil *= 0.7; T.approval = clamp(T.approval - 20, 0, 100);
  addNews('☢ ' + A.he + ' שיגרה נשק גרעיני על ' + T.he + '. העולם בהלם, מיליונים נפגעו.', 'war');
  alive().forEach(id => {
    if (id === att) return;
    addRel(id, att, (isAlly(id, tgt) || id === tgt) ? -70 : -45);
    const C = S.c[id];
    if (C.gov !== 'authoritarian' || rel(id, att) < -50) S.sanc[id + '>' + att] = 1;
  });
  // retaliation
  const ret = alive().filter(id => id !== att && S.c[id].nukes > 0 && (id === tgt || isAlly(id, tgt)));
  if (ret.length && R() < (ret.includes(tgt) ? 0.95 : 0.75)) {
    const r = ret.includes(tgt) ? tgt : pick(ret);
    S.c[r].nukes--;
    A.pop *= 0.92; A.gdp *= 0.6; A.equip *= 0.6; A.mil *= 0.75;
    if (att === S.player) S.p.shock -= 35;
    addNews('☢ תגובה גרעינית: ' + nm(r) + ' השיבה במכה גרעינית על ' + A.he + '.', 'war');
  }
  if (att === S.player) S.p.shock -= 20;
  if (tgt === S.player) S.p.shock -= 15;
  needMapRecolor = true;
}

/* ================= save / load ================= */
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
function load() {
  try { const s = localStorage.getItem(SAVE_KEY); if (!s) return false; const o = JSON.parse(s);
    if (!o || o.v !== VERSION || !o.player || !o.c || !o.c[o.player]) return false;
    S = o; BASE.clear(); rebuildOwn(); return true;
  } catch (e) { return false; }
}
function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }

/* ================= map ================= */
let svg, gRoot, gLand, gMarks, zoom, pathGen, curK = 1, W = 0, H = 0, selected = null;
const pathByTid = {};
function initMap() {
  const box = $('#map');
  W = box.clientWidth || 360; H = box.clientHeight || 500;
  svg = d3.select('#map').append('svg').attr('id', 'mapsvg').attr('viewBox', [0, 0, W, H].join(' ')).attr('preserveAspectRatio', 'xMidYMid meet');
  gRoot = svg.append('g');
  const projection = d3.geoNaturalEarth1();
  const visible = { type: 'FeatureCollection', features: FEATS.filter(f => !HIDDEN.has(f.properties.tid)) };
  const topPad = 92, botPad = 72;
  projection.fitExtent([[6, topPad], [W - 6, H - botPad]], visible);
  pathGen = d3.geoPath(projection); if (pathGen.digits) pathGen.digits(1);
  gRoot.append('path').datum({ type: 'Sphere' }).attr('class', 'sphere').attr('d', pathGen);
  gRoot.append('path').datum(d3.geoGraticule10()).attr('class', 'grat').attr('d', pathGen);
  gLand = gRoot.append('g').attr('class', 'land');
  visible.features.forEach(f => {
    const t = f.properties.tid;
    const el = gLand.append('path').attr('d', pathGen(f)).attr('data-t', t).node();
    (pathByTid[t] = pathByTid[t] || []).push(el);
  });
  gMarks = gRoot.append('g').attr('class', 'marks');
  gLand.on('click', ev => { const t = ev.target && ev.target.getAttribute('data-t'); if (t) onMapTap(t); });
  zoom = d3.zoom().scaleExtent([0.8, 60]).translateExtent([[-W, -H], [W * 2, H * 2]])
    .on('zoom', ev => { gRoot.attr('transform', ev.transform); if (Math.abs(ev.transform.k - curK) > 0.01) { curK = ev.transform.k; scaleMarks(); } });
  svg.call(zoom).on('dblclick.zoom', null);
  MAP_PROJ = projection;
  if (!(S && S.player) && W < 900) svg.call(zoom.transform, d3.zoomIdentity.translate(0, H * 0.22 - (topPad + H - botPad) / 2));
}
let MAP_PROJ = null;
function visibleRect() {
  // part of the map not covered by bars / panels: [x0, y0, x1, y1]
  const startOpen = $('#start').classList.contains('open'), sheetOpen = $('#sheet').classList.contains('open');
  const top = (S && S.player) ? 92 : 70;
  if (W >= 900) return [0, top, (startOpen || sheetOpen) ? W - 440 : W, H - 80];
  if (startOpen) return [0, top, W, H * 0.42];
  const sh = sheetOpen ? $('#sheet').offsetHeight : 0;
  return [0, top, W, Math.max(top + 120, H - 64 - sh)];
}
function zoomToTid(t, maxK) {
  const T = TERR[t]; if (!T || !T.best || !svg) return;
  const [[x0, y0], [x1, y1]] = pathGen.bounds(T.best);
  const [vx0, vy0, vx1, vy1] = visibleRect(), vw = vx1 - vx0, vh = vy1 - vy0;
  const k = clamp(0.45 / Math.max((x1 - x0) / vw, (y1 - y0) / vh), 1.5, maxK || 10);
  const tr = d3.zoomIdentity.translate((vx0 + vx1) / 2, (vy0 + vy1) / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
  svg.transition().duration(700).call(zoom.transform, tr);
}
function relColor(r) {
  if (r >= 0) return d3.interpolateRgb('#3a4250', '#2a5a72')(r / 100);
  return d3.interpolateRgb('#3a4250', '#6a2f36')(-r / 100);
}
function colorFor(t) {
  const o = S && S.owner[t];
  if (!o) return COL.none;
  if (!S.player) return (selected && S.owner[selected] === o) ? COL.me : relColor(0) ;
  if (o === S.player) return COL.me;
  if (atWar(o, S.player)) return COL.war;
  if (isAlly(o, S.player)) return COL.ally;
  if (warsOf(o).some(w => w.pause === 0)) return '#8a5a24';
  return relColor(rel(o, S.player));
}
function recolor() {
  if (!gLand) return;
  const selOwner = selected ? (S.owner[selected] || selected) : null;
  for (const t in pathByTid) {
    const col = colorFor(t), isSel = selOwner && (S.owner[t] === selOwner || t === selected);
    pathByTid[t].forEach(el => { el.setAttribute('fill', col); el.classList.toggle('sel', !!isSel); });
  }
  drawMarks();
  needMapRecolor = false;
}
function drawMarks() {
  if (!gMarks || !MAP_PROJ) return;
  gMarks.selectAll('*').remove();
  if (!S || !S.player) return;
  const labels = new Set([S.player]);
  warsOf(S.player).forEach(w => labels.add(enemyLeaderFor(w, S.player)));
  const pts = [];
  labels.forEach(id => {
    const t = TERR[id] && S.c[id] && S.c[id].alive ? id : tidsOf(id)[0]; if (!t || !TERR[t]) return;
    const p = MAP_PROJ(TERR[t].c); if (p) pts.push({ id, p });
  });
  pts.forEach(({ id, p }) => {
    const isMe = id === S.player;
    // push the label away from the other labelled countries so small neighbours (Israel / Lebanon) don't stack
    let dx = 0, dy = 0;
    pts.forEach(o => { if (o.id === id) return; const vx = p[0] - o.p[0], vy = p[1] - o.p[1], d = Math.hypot(vx, vy) || 1; if (d < 60) { dx += vx / d; dy += vy / d; } });
    const n = Math.hypot(dx, dy); if (n) { dx /= n; dy /= n; }
    if (!isMe) gMarks.append('circle').attr('class', 'pulse').attr('cx', p[0]).attr('cy', p[1]).attr('data-r', 7);
    gMarks.append('text').attr('class', 'lbl' + (isMe ? ' me' : ' en')).attr('data-x', p[0]).attr('data-y', p[1]).attr('data-dx', dx).attr('data-dy', dy).attr('data-fs', 11).text(nm(id));
  });
  scaleMarks();
}
function scaleMarks() {
  if (!gMarks) return;
  gMarks.selectAll('circle').attr('r', function () { return +this.getAttribute('data-r') / curK; }).attr('stroke-width', 2 / curK);
  gMarks.selectAll('text').each(function () {
    const fs = +this.getAttribute('data-fs') / Math.sqrt(curK) / Math.max(1, Math.sqrt(curK) / 1.5);
    const off = fs * 0.9;
    this.setAttribute('font-size', fs); this.setAttribute('stroke-width', 3 / curK);
    this.setAttribute('x', +this.getAttribute('data-x') + +this.getAttribute('data-dx') * off * 1.6);
    this.setAttribute('y', +this.getAttribute('data-y') + +this.getAttribute('data-dy') * off);
  });
}
function onMapTap(t) {
  if (!S) return;
  const o = S.owner[t];
  if (!S.player) { if (o) startPick(o); return; }
  selected = t; recolor();
  openTab('country');
}

/* ================= UI ================= */
let tab = null;
function renderAll() {
  if (!S || !S.player) return;
  renderTop(); recolor(); if (tab) renderSheet();
  const n = S.wars.filter(involvesPlayer).length;
  const b = $('#tabwars'); if (b) b.dataset.badge = n || '';
}
function renderTop() {
  const c = P(); if (!c) return;
  const ap = c.approval;
  $('#t-date').textContent = dateTxt(S.turn);
  $('#t-money').innerHTML = money(S.p.treasury, true);
  $('#t-money').className = 'v' + (S.p.treasury < 0 ? ' bad' : '');
  $('#t-ap').innerHTML = pct(ap); $('#t-ap').className = 'v ' + (ap < 30 ? 'bad' : ap < 45 ? 'warn' : 'ok');
  $('#t-army').innerHTML = num(power(c));
  $('#t-nuke').innerHTML = num(c.nukes);
  $('#t-score').innerHTML = num(score());
  $('#t-name').textContent = c.he;
}
function openTab(t) {
  tab = (tab === t && t !== 'country') ? null : t;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $('#sheet').classList.toggle('open', !!tab);
  if (tab) renderSheet();
}
function renderSheet() {
  const el = $('#sheet-body'); if (!el) return;
  const fn = { country: viewCountry, eco: viewEco, mil: viewMil, wars: viewWars, news: viewNews }[tab];
  el.innerHTML = fn ? fn() : '';
}
function openTabFresh(t) { openTab(t); const b = $('#sheet-body'); if (b) b.scrollTop = 0; }
function chip(txt, cls) { return '<span class="chip ' + (cls || '') + '">' + txt + '</span>'; }
function relBar(r) {
  const w = Math.abs(r) / 2;
  return '<div class="relbar"><div class="mid"></div><div class="fill ' + (r >= 0 ? 'pos' : 'neg') + '" style="' + (r >= 0 ? 'right:50%' : 'left:50%') + ';width:' + w + '%"></div></div>' +
    '<div class="rellbl"><span>עוינות</span><b>' + num(r) + '</b><span>ידידות</span></div>';
}
function statGrid(c) {
  return '<div class="grid">' +
    '<div><small>אוכלוסייה</small>' + popTxt(c.pop) + '</div>' +
    '<div><small>תמ״ג שנתי</small>' + money(c.gdp) + '</div>' +
    '<div><small>עוצמה צבאית</small>' + num(power(c)) + '</div>' +
    '<div><small>חיילים</small>' + num(c.mil) + ' אלף</div>' +
    '<div><small>תקציב ביטחון</small>' + money(c.def) + '</div>' +
    '<div><small>ראשי נפץ גרעיניים</small>' + num(c.nukes) + '</div>' +
    '<div><small>משטר</small>' + GOV_HE[c.gov] + '</div>' +
    '<div><small>תמיכת העם</small>' + pct(c.approval) + '</div>' +
    '</div>' + (c.blocs.length ? '<div class="blocs">' + c.blocs.map(b => chip(BLOC_HE[b] || b)).join('') + '</div>' : '');
}
function viewCountry() {
  if (!selected) { const c = P(); return '<p class="hint">הקש על מדינה במפה כדי לראות אותה ולנהל איתה יחסים.</p><h2><span class="dot me"></span>' + esc(c.he) + ' <small>(המדינה שלך)</small></h2>' + statGrid(c); }
  const o = S.owner[selected];
  if (!o) return '<h2>' + esc(nm(selected)) + '</h2><p class="hint">שטח שנוי במחלוקת / לא מיושב. אי אפשר לשלוט בו.</p>';
  const c = S.c[o];
  let h = '';
  if (o !== selected) h += '<p class="hint">' + esc(TERR[selected] && S.c[selected] ? S.c[selected].he : nm(selected)) + ' — שטח בשליטת ' + esc(c.he) + '.</p>';
  if (o === S.player) {
    h += '<h2><span class="dot me"></span>' + esc(c.he) + ' <small>(המדינה שלך)</small></h2>' + statGrid(c);
    if (S.p.annexed.length) h += '<p>שטחים שסופחו: ' + S.p.annexed.map(nm).join(', ') + '</p>';
    return h;
  }
  const r = rel(o, S.player), war = atWar(o, S.player);
  const st = [];
  if (war) st.push(chip('במלחמה איתך', 'red'));
  if (isAlly(o, S.player)) st.push(chip('בעלת ברית', 'blue'));
  if (hasPact(o, S.player, 'nap')) st.push(chip('אי-תוקפנות', 'teal'));
  if (hasPact(o, S.player, 'trade')) st.push(chip('הסכם סחר', 'teal'));
  if (sanctions(S.player, o)) st.push(chip('אתה מטיל סנקציות'));
  if (sanctions(o, S.player)) st.push(chip('מטילה עליך סנקציות', 'red'));
  const ow = warsOf(o).filter(w => !involvesPlayer(w)); if (ow.length) st.push(chip('במלחמה עם ' + ow.map(w => nm(enemyLeaderFor(w, o))).join(', '), 'orange'));
  const d = adjacent(o, S.player) ? 'שכנה (גבול משותף)' : 'מרחק ' + num(dist(o, S.player)) + ' ק״מ';
  h += '<h2>' + esc(c.he) + (c.generated ? ' <small>(נתונים משוערים)</small>' : '') + '</h2><div class="chips">' + st.join('') + '</div>';
  h += relBar(r) + '<p class="sub">' + d + ' · יחס כוחות: ' + (power(P()) >= power(c) ? num(power(P()) / power(c), 1) + ' : 1 לטובתך' : '1 : ' + num(power(c) / power(P()), 1) + ' לטובתם') + '</p>' + statGrid(c);
  const used = S.p.dip[o] === S.turn;
  h += '<h3>דיפלומטיה' + (used ? ' <small>(כבר פעלת מול מדינה זו החודש)</small>' : '') + '</h3><div class="btns">';
  const dis = used ? ' disabled' : '';
  if (!war) {
    const g = giftAmt();
    h += btn('gift', 'שלח סיוע<small class="cost">' + money(g) + '</small>', '', dis);
    h += btn('trade', hasPact(o, S.player, 'trade') ? 'בטל הסכם סחר' : 'הצע הסכם סחר', '', dis);
    h += btn('nap', hasPact(o, S.player, 'nap') ? 'בטל אי-תוקפנות' : 'הסכם אי-תוקפנות', '', dis);
    h += btn('alliance', hasPact(o, S.player, 'alliance') ? 'בטל ברית' : 'בקש ברית צבאית', '', dis);
    h += btn('sanction', sanctions(S.player, o) ? 'הסר סנקציות' : 'הטל סנקציות', '', dis);
    h += btn('war', 'הכרז מלחמה', 'danger', '');
  } else {
    const w = S.wars.find(x => (x.A.includes(o) && x.B.includes(S.player)) || (x.B.includes(o) && x.A.includes(S.player)));
    h += '<button class="b" data-act="gotowars">עבור ללשונית מלחמות</button>';
    if (w) h += warActions(w, true);
  }
  h += '</div>';
  return h;
}
const btn = (act, label, cls, extra) => '<button class="b ' + (cls || '') + '" data-act="' + act + '"' + (extra || '') + '>' + label + '</button>';
function giftAmt() { return Math.max(0.01, P().gdp * 0.0025); }
const nukeCost = c => Math.max(0.05, c.gdp * 0.004);
const strikeCost = (c, kind) => kind === 'air' ? Math.max(0.02, c.gdp * 0.003) : Math.max(0.03, c.gdp * 0.004);
function viewEco() {
  const c = P(), p = S.p, b = p.budget;
  const m = c.gdp / 12;
  const est = m * p.tax - m * p.welfare - m * 0.11 - c.gdp * p.defPct / 12;
  const sh = sanctionHit(S.player);
  const tr = Object.keys(S.pacts).filter(k => S.pacts[k].trade && k.split('|').includes(S.player)).map(k => nm(k.split('|').find(x => x !== S.player)));
  const sancBy = Object.keys(S.sanc).filter(k => k.endsWith('>' + S.player)).map(k => nm(k.split('>')[0]));
  const debt = p.treasury < 0 ? -p.treasury / c.gdp : 0;
  let h = '<h2>כלכלה</h2><div class="grid">' +
    '<div><small>קופת המדינה</small>' + money(p.treasury) + '</div><div><small>תמ״ג שנתי</small>' + money(c.gdp) + '</div>' +
    '<div><small>חוב מהתמ״ג</small>' + pct(debt * 100) + (p.bankrupt ? ' ' + chip('פשיטת רגל', 'red') : '') + '</div>' +
    '<div><small>נזק מסנקציות</small>' + pct(sh * 100) + '</div></div>';
  h += slider('tax', 'מס הכנסה', p.tax, 0.10, 0.60, 'יותר מס = יותר כסף, אבל העם כועס והצמיחה יורדת');
  h += slider('welfare', 'רווחה לעם (בריאות, חינוך, קצבאות)', p.welfare, 0, 0.35, 'יותר רווחה = עם מרוצה יותר, אבל עולה כסף');
  h += slider('defPct', 'תקציב ביטחון (מהתמ״ג)', p.defPct, 0.005, 0.12, 'יותר תקציב = צבא חזק יותר עם הזמן. בשלום, תקציב גבוה מרגיז את העם');
  h += '<div class="box"><b>תחזית חודשית (בלי מלחמות): </b><span id="est">' + money(est) + '</span><br><b>תמיכה צפויה של העם: </b><span id="apt">' + pct(approvalTarget()) + '</span></div>';
  if (b) h += '<h3>החודש שעבר</h3><table class="tbl">' +
    row('הכנסות ממסים', b.income) + row('רווחה', -b.welfare) + row('מנהלה ותשתיות', -b.admin) + row('ביטחון', -b.defense) +
    (b.war ? row('עלות מלחמות', -b.war) : '') + (b.interest ? row('ריבית על חוב', -b.interest) : '') + (b.upkeep ? row('אחזקת חיילים נוספים', -b.upkeep) : '') +
    (b.nuke ? row('תוכנית גרעין', -b.nuke) : '') + '<tr class="tot"><td>סה״כ</td><td>' + money(b.net) + '</td></tr></table>';
  h += '<p class="sub">הסכמי סחר: ' + (tr.length ? tr.join(', ') : 'אין') + '<br>מטילות עליך סנקציות: ' + (sancBy.length ? sancBy.join(', ') : 'אף אחת') + '</p>';
  return h;
}
const row = (l, v) => '<tr><td>' + l + '</td><td>' + money(v) + '</td></tr>';
function slider(k, label, v, mn, mx, hint) {
  return '<label class="sl"><span>' + label + ': <b id="sv-' + k + '">' + (v * 100).toFixed(k === 'defPct' ? 1 : 0) + '%</b></span>' +
    '<input type="range" dir="ltr" data-slider="' + k + '" min="' + mn * 1000 + '" max="' + mx * 1000 + '" step="5" value="' + Math.round(v * 1000) + '"><small>' + hint + '</small></label>';
}
function recruitInfo() { const c = P(); const add = Math.max(2, c.mil * 0.05); return { add, cost: add * 0.03 * clamp(c.gdp / c.pop / 20, 0.3, 4) }; }
function weaponInfo() { const c = P(); const cost = Math.max(0.05, c.gdp * 0.01); return { cost, gain: 6 * Math.pow(cost, 0.85) }; }
function viewMil() {
  const c = P(), p = S.p, ri = recruitInfo(), wi = weaponInfo();
  let h = '<h2>צבא</h2><div class="grid">' +
    '<div><small>עוצמה כוללת</small>' + num(power(c)) + '</div><div><small>חיילים</small>' + num(c.mil) + ' אלף</div>' +
    '<div><small>ציוד ונשק</small>' + num(c.equip) + '</div><div><small>ראשי נפץ גרעיניים</small>' + num(c.nukes) + '</div>' +
    '<div><small>הרוגים ופצועים במלחמות</small>' + num(p.casTotal * 1000) + '</div><div><small>מלחמות פעילות</small>' + num(warsOf(S.player).length) + '</div></div>';
  h += '<div class="btns">' + btn('recruit', 'גייס ' + num(ri.add) + ' אלף חיילים<small class="cost">' + money(ri.cost) + '</small>') +
    btn('weapons', 'קנה חבילת נשק<small class="cost">' + money(wi.cost) + '</small>') + '</div>';
  h += '<p class="sub">גיוס מוריד מעט את תמיכת העם ומוסיף עלות חודשית. נשק שנקנה נשחק עם הזמן אם תקציב הביטחון נמוך.</p>';
  h += '<h3>תוכנית גרעין</h3>';
  if (c.nukes > 0 && !(p.nprog && p.nprog.done)) h += '<p class="sub">יש לך נשק גרעיני. שימוש בו אפשרי רק במלחמה, מלשונית מלחמות — ויגרור תגובה עולמית קשה.</p>';
  else if (!p.nprog) h += '<p class="sub">תוכנית סודית: כ-36 חודשים, עולה כ-' + money(nukeCost(c)) + ' לחודש. אם תיחשף — סנקציות ואולי תקיפות.</p>' + btn('nprog', 'התחל תוכנית גרעין סודית', 'danger');
  else if (!p.nprog.done) h += '<div class="prog"><div style="width:' + (p.nprog.m / 36 * 100) + '%"></div></div><p class="sub">התקדמות: ' + p.nprog.m + ' / 36 חודשים' + (p.nprog.disc ? ' · התוכנית נחשפה!' : ' · עדיין סודית') + '</p>' + btn('nstop', 'עצור את התוכנית');
  else h += '<p class="sub">התוכנית הושלמה. נוסף ראש נפץ כל חצי שנה.</p>';
  return h;
}
function frontBars(w) {
  const fp = mySideFront(w, S.player);
  return '<div class="front"><div class="fl"><small>שטח האויב בידינו</small><div class="prog g"><div style="width:' + Math.max(0, fp) + '%"></div></div>' + pct(Math.max(0, fp)) + '</div>' +
    '<div class="fl"><small>שטחנו בידי האויב</small><div class="prog r"><div style="width:' + Math.max(0, -fp) + '%"></div></div>' + pct(Math.max(0, -fp)) + '</div></div>';
}
function warActions(w, compact) {
  const en = enemyLeaderFor(w, S.player), lead = w.a === S.player || w.b === S.player;
  let h = '';
  if (w.pause > 0) return '<p class="sub">הפסקת אש — עוד ' + w.pause + ' חודשים.</p>';
  if (!compact) h += '<div class="seg"><button class="' + (w.stance === 'attack' ? 'on' : '') + '" data-act="stance" data-w="' + w.id + '" data-v="attack">התקפה</button><button class="' + (w.stance === 'defend' ? 'on' : '') + '" data-act="stance" data-w="' + w.id + '" data-v="defend">הגנה</button></div>';
  const usedA = w.used.air === S.turn, usedM = w.used.mis === S.turn;
  h += '<div class="btns">' +
    '<button class="b" data-act="air" data-w="' + w.id + '"' + (usedA ? ' disabled' : '') + '>תקיפה אווירית<small class="cost">' + money(strikeCost(P(), 'air')) + '</small></button>' +
    '<button class="b" data-act="missile" data-w="' + w.id + '"' + (usedM ? ' disabled' : '') + '>מטח טילים<small class="cost">' + money(strikeCost(P(), 'mis')) + '</small></button>' +
    (P().nukes > 0 ? '<button class="b nuke" data-act="nuke" data-w="' + w.id + '">תקיפה גרעינית</button>' : '');
  if (lead) h += '<button class="b good" data-act="peace" data-w="' + w.id + '">הצע שלום / תנאים</button>';
  else h += '<button class="b" data-act="leave" data-w="' + w.id + '">פרוש מהמלחמה</button>';
  h += '</div>';
  return h;
}
function viewWars() {
  const mine = warsOf(S.player);
  let h = '<h2>המלחמות שלך</h2>';
  if (!mine.length) h += '<p class="hint">אתה לא במלחמה. כדי להכריז מלחמה — בחר מדינה במפה. שכנות קלות לתקוף; מדינות רחוקות יקרות וקשות.</p>';
  mine.forEach(w => {
    const en = enemyLeaderFor(w, S.player), side = w.A.includes(S.player) ? w.A : w.B, other = w.A.includes(S.player) ? w.B : w.A;
    h += '<div class="card war"><h3>נגד ' + esc(nm(en)) + (w.pause > 0 ? ' ' + chip('הפסקת אש', 'teal') : '') + '</h3>' +
      '<p class="sub">מאז ' + dateTxt(w.start) + ' · כוחנו: ' + num(power(P())) + ' · כוחם: ' + num(power(S.c[en])) +
      (other.length > 1 ? '<br>לצד האויב: ' + other.filter(x => x !== en).map(nm).join(', ') : '') +
      (side.length > 1 ? '<br>לצדנו: ' + side.filter(x => x !== S.player).map(nm).join(', ') : '') + '</p>' +
      frontBars(w) + warActions(w) + '</div>';
  });
  const world = S.wars.filter(w => !involvesPlayer(w));
  if (world.length) {
    h += '<h3>מלחמות בעולם</h3>';
    world.forEach(w => { h += '<div class="card"><b>' + esc(nm(w.a)) + '</b> נגד <b>' + esc(nm(w.b)) + '</b>' + (w.pause > 0 ? ' ' + chip('הפסקת אש', 'teal') : '') +
      '<div class="sub">' + (w.f >= 0 ? nm(w.a) + ' מחזיקה ' + Math.round(w.f) + '% מ' + nm(w.b) : nm(w.b) + ' מחזיקה ' + Math.round(-w.f) + '% מ' + nm(w.a)) + '</div></div>'; });
  }
  return h;
}
function viewNews() {
  if (!S.news.length) return '<p class="hint">אין חדשות עדיין.</p>';
  let h = '<h2>מבזקי חדשות</h2><ul class="news">', last = null;
  S.news.slice(0, 80).forEach(n => { if (n.t !== last) { h += '<li class="nd">' + dateTxt(n.t) + '</li>'; last = n.t; } h += '<li class="' + n.k + '">' + esc(n.txt) + '</li>'; });
  return h + '</ul>';
}

/* ================= modals ================= */
let modalQ = [];
function modal(o) { modalQ.push(o); if (modalQ.length === 1) showModal(); }
function showModal() {
  const o = modalQ[0]; if (!o) { $('#modal').classList.remove('open'); return; }
  $('#m-title').innerHTML = o.title || '';
  $('#m-body').innerHTML = o.html || '';
  const f = $('#m-foot'); f.innerHTML = '';
  (o.buttons || [{ label: 'סגור' }]).forEach(b => {
    const e = document.createElement('button'); e.className = 'b ' + (b.cls || ''); e.textContent = b.label;
    e.onclick = () => { if (b.keep && b.fn) { b.fn(); return; } modalQ.shift(); $('#modal').classList.remove('open'); if (b.fn) b.fn(); setTimeout(showModal, 30); };
    f.appendChild(e);
  });
  $('#modal').className = 'modal open' + (o.cls ? ' ' + o.cls : '');
  if (o.onShow) o.onShow();
}
function toast(txt, bad) {
  const t = $('#toast'); t.textContent = txt; t.className = 'toast show' + (bad ? ' bad' : '');
  clearTimeout(toast.h); toast.h = setTimeout(() => t.className = 'toast', 2600);
}
function showTurnSummary(b, fresh) {
  const c = P();
  const d = (x, y, f) => { const v = y - x; return '<span class="' + (v >= 0 ? 'up' : 'down') + '">' + (v >= 0 ? '+' : '') + f(v) + '</span>'; };
  let h = '<div class="grid">' +
    '<div><small>קופה</small>' + money(S.p.treasury) + ' ' + d(b.tr, S.p.treasury, v => money(v, true)) + '</div>' +
    '<div><small>תמיכת העם</small>' + pct(c.approval) + ' ' + d(b.ap, c.approval, v => v.toFixed(1)) + '</div>' +
    '<div><small>עוצמה צבאית</small>' + num(power(c)) + ' ' + d(b.pw, power(c), v => Math.round(v)) + '</div>' +
    '<div><small>תמ״ג</small>' + money(c.gdp) + '</div></div>';
  if (fresh.length) h += '<ul class="news">' + fresh.slice(0, 6).map(n => '<li class="' + n.k + '">' + esc(n.txt) + '</li>').join('') + '</ul>';
  if (c.approval < 30) h += '<p class="warnbox">העם לא מרוצה! הורד מסים, העלה רווחה או סיים מלחמות.</p>';
  modal({ title: dateTxt(S.turn), html: h, buttons: [{ label: 'המשך', cls: 'primary', fn: processPending }] });
}
function processPending() {
  if (!S.pending.length || S.over) return;
  const p = S.pending.shift();
  const w = S.wars.find(x => x.id === p.wid);
  if (p.type === 'win') { modal({ title: 'ניצחון!', html: '<p>' + p.txt + '</p><p>הניקוד שלך: ' + num(score()) + '. אפשר להמשיך לשחק.</p>', buttons: [{ label: 'המשך לשחק', cls: 'primary', fn: processPending }] }); return; }
  if (!w) return processPending();
  if (p.type === 'ally') {
    const en = w.a;
    modal({ title: 'קריאה לעזרה', html: '<p>' + nm(en) + ' תקפה את בעלת בריתך ' + nm(p.ally) + '. האם לכבד את הברית ולהצטרף למלחמה?</p><p class="sub">סירוב יפגע קשות ביחסים וינתק את הברית.</p>',
      buttons: [{ label: 'הצטרף למלחמה', cls: 'danger', fn: () => { if (S.wars.includes(w) && !inWar(w, S.player)) { w.B.push(S.player); addRel(en, S.player, -100); addNews('הצטרפנו למלחמה לצד ' + nm(p.ally) + ' נגד ' + nm(en) + '.', 'war'); } after(); } },
        { label: 'הישאר בחוץ', fn: () => { addRel(p.ally, S.player, -35); setPact(p.ally, S.player, 'alliance', false); addNews('סירבנו לסייע ל' + nm(p.ally) + '. אמינותנו נפגעה.', 'bad'); after(); } }] });
  } else if (p.type === 'peace') {
    const terms = p.kind === 'white' ? 'שלום ללא תנאים (כל צד נשאר בגבולותיו).' : p.kind === 'repar' ? 'הם ישלמו לנו פיצויים של ' + money(S.c[p.from].gdp * 0.04) + '.' : 'הם יוותרו לנו על ' + pct(p.share * 100) + ' משטחם ומאוכלוסייתם.';
    modal({ title: 'הצעת שלום מ' + nm(p.from), html: '<p>' + terms + '</p>',
      buttons: [{ label: 'קבל', cls: 'good', fn: () => { applyPeace(w, p.kind, S.player, p.from, p.share); after(); } }, { label: 'דחה', fn: after }] });
  } else if (p.type === 'demand') {
    modal({ title: 'דרישה מ' + nm(p.from), html: '<p>' + nm(p.from) + ' מוכנה לסיים את המלחמה אם נוותר על ' + pct(p.share * 100) + ' משטחנו ומאוכלוסייתנו.</p><p class="sub">אם נסרב — הלחימה תימשך.</p>',
      buttons: [{ label: 'קבל את התנאים', cls: 'danger', fn: () => { applyPeace(w, 'terr', p.from, S.player, p.share); after(); } }, { label: 'נמשיך להילחם', fn: after }] });
  }
  function after() { save(); renderAll(); processPending(); }
}
function applyPeace(w, kind, win, lose, share) {
  if (!S.wars.includes(w)) return;
  if (kind === 'repar') {
    const amt = S.c[lose].gdp * 0.04;
    if (win === S.player) S.p.treasury += amt; if (lose === S.player) S.p.treasury -= amt;
    addNews(nm(lose) + ' הסכימה לשלם פיצויים ל' + nm(win) + '. המלחמה הסתיימה.', win === S.player ? 'good' : 'bad');
  } else if (kind === 'terr') {
    cede(win, lose, share);
    addNews(nm(lose) + ' ויתרה על ' + Math.round(share * 100) + '% משטחה ל' + nm(win) + '. נחתם הסכם שלום.', win === S.player ? 'good' : 'bad');
  } else if (kind === 'annex') {
    endWar(w); annex(win, lose); return;
  } else if (kind === 'cease') {
    w.pause = 6; addNews('הוסכם על הפסקת אש של חצי שנה עם ' + nm(enemyLeaderFor(w, S.player)) + '.', 'good'); return;
  } else addNews('נחתם הסכם שלום עם ' + nm(enemyLeaderFor(w, S.player)) + '. החיילים חוזרים הביתה.', 'good');
  if (involvesPlayer(w)) S.p.shock += 3;
  endWar(w);
}

/* ================= player actions ================= */
function spend(cost) {
  const c = P();
  if (S.p.bankrupt) { toast('במצב פשיטת רגל אי אפשר להוציא כסף על זה', true); return false; }
  if (S.p.treasury - cost < -c.gdp * 1.1) { toast('אין מספיק כסף — החוב גבוה מדי', true); return false; }
  S.p.treasury -= cost; return true;
}
function selOwner() { return selected ? S.owner[selected] : null; }
function aiScore(type, ai) {
  const me = S.player, r = rel(ai, me), A = S.c[ai], M = P();
  const shared = A.blocs.filter(x => M.blocs.includes(x)).length;
  const mis = (A.gov === 'democracy') !== (M.gov === 'democracy') ? 1 : 0;
  const sanc = sanctions(ai, me) || sanctions(me, ai);
  const myWars = warsOf(me).filter(w => w.pause === 0);
  let common = 0, friendFoe = 0;
  myWars.forEach(w => { const en = enemyLeaderFor(w, me); if (rel(ai, en) < -50) common += 25; if (isAlly(ai, en) || rel(ai, en) > 50) friendFoe += 40; });
  const pw = power(M) / (power(A) + 1);
  const noise = (R() - 0.5) * 12;
  if (type === 'trade') return { ok: r + 15 + shared * 5 - (sanc ? 60 : 0) - friendFoe + noise > 5, why: sanc ? 'יש ביניכם סנקציות' : 'היחסים לא מספיק טובים' };
  if (type === 'nap') return { ok: r + 30 + (pw > 1.5 ? 15 : 0) - friendFoe + noise > 10, why: 'הם לא סומכים עליך' };
  if (type === 'alliance') return { ok: r + shared * 8 + Math.min(20, pw * 8) - mis * 15 - myWars.length * 12 + common - friendFoe - (sanc ? 50 : 0) + noise > 60, why: myWars.length ? 'הם לא רוצים להיגרר למלחמות שלך' : 'צריך יחסים טובים מאוד (מעל 60) ואינטרסים משותפים' };
  return { ok: true };
}
const ACT = {
  tab: d => openTabFresh(d.tab),
  close: () => openTab(null),
  gotowars: () => openTabFresh('wars'),
  help: showHelp,
  menu: showMenu,
  endturn: () => { if (!S || !S.player || S.over) return; const b = $('#endturn'); b.disabled = true; setTimeout(() => { try { endTurn(); } finally { b.disabled = false; } }, 20); },
  gift: () => { const o = selOwner(), g = giftAmt(); if (!spend(g)) return; const C = S.c[o]; const d = clamp(4 + 300 * g / C.gdp, 3, 20); addRel(o, S.player, d); S.p.dip[o] = S.turn;
    toast(C.he + ' קיבלה את הסיוע. יחסים +' + Math.round(d)); addNews('שלחנו סיוע ל' + C.he + '.', 'dip'); renderAll(); },
  trade: () => dipToggle('trade', 'הסכם סחר', 8),
  nap: () => dipToggle('nap', 'הסכם אי-תוקפנות', 6),
  alliance: () => dipToggle('alliance', 'ברית צבאית', 12),
  sanction: () => { const o = selOwner(), C = S.c[o]; S.p.dip[o] = S.turn;
    if (sanctions(S.player, o)) { delete S.sanc[S.player + '>' + o]; addRel(o, S.player, 6); toast('הסנקציות על ' + C.he + ' הוסרו'); addNews('הסרנו את הסנקציות על ' + C.he + '.', 'dip'); }
    else { S.sanc[S.player + '>' + o] = 1; addRel(o, S.player, -20); C.gdp *= 1 - Math.min(0.03, P().gdp / worldGdp() * 0.1); P().gdp *= 1 - Math.min(0.01, C.gdp / P().gdp * 0.002);
      setPact(o, S.player, 'trade', false); toast('הוטלו סנקציות על ' + C.he); addNews('הטלנו סנקציות כלכליות על ' + C.he + '.', 'dip'); }
    renderAll(); },
  war: () => confirmWar(selOwner()),
  stance: d => { const w = S.wars.find(x => x.id === +d.w); if (w) { w.stance = d.v; renderSheet(); } },
  air: d => strike(+d.w, 'air'),
  missile: d => strike(+d.w, 'mis'),
  nuke: d => confirmNuke(+d.w),
  peace: d => peaceDialog(+d.w),
  leave: d => { const w = S.wars.find(x => x.id === +d.w); if (!w) return; const lead = w.A.includes(S.player) ? w.a : w.b;
    w.A = w.A.filter(x => x !== S.player); w.B = w.B.filter(x => x !== S.player); addRel(lead, S.player, -25); addNews('פרשנו מהמלחמה מול ' + nm(enemyLeaderFor(w, lead)) + '.', 'dip'); renderAll(); },
  recruit: () => { const ri = recruitInfo(); if (!spend(ri.cost)) return; P().mil += ri.add; P().mil0 = Math.max(P().mil0, P().mil * 0.98); S.p.shock -= 1; toast('גויסו ' + Math.round(ri.add) + ' אלף חיילים'); renderAll(); },
  weapons: () => { const wi = weaponInfo(); if (!spend(wi.cost)) return; P().equip += wi.gain; toast('נרכשה חבילת נשק: +' + Math.round(wi.gain) + ' עוצמה'); renderAll(); },
  nprog: () => modal({ title: 'תוכנית גרעין סודית', html: '<p>הפרויקט ייקח כ-36 חודשים ויעלה כסף רב כל חודש. בכל חודש יש סיכוי שהעולם יגלה — ואז יבואו סנקציות ואולי תקיפות אוויריות.</p>',
    buttons: [{ label: 'התחל', cls: 'danger', fn: () => { S.p.nprog = { m: 0, disc: false, done: false }; addNews('הממשלה אישרה בחשאי פרויקט מיוחד.', 'dip'); renderAll(); } }, { label: 'ביטול' }] }),
  nstop: () => { S.p.nprog = null; addNews('תוכנית הגרעין הוקפאה.', 'dip'); renderAll(); },
  newgame: () => modal({ title: 'משחק חדש', html: '<p>המשחק הנוכחי יימחק. להמשיך?</p>', buttons: [{ label: 'כן, משחק חדש', cls: 'danger', fn: () => { wipe(); location.reload(); } }, { label: 'ביטול' }] }),
  startpick: () => beginGame(),
  centerme: () => S && S.player && zoomToTid(S.player, 10),
  legend: () => $('#legend').classList.toggle('open')
};
function dipToggle(type, label, relGain) {
  const o = selOwner(), C = S.c[o]; S.p.dip[o] = S.turn;
  if (hasPact(o, S.player, type)) { setPact(o, S.player, type, false); addRel(o, S.player, -10); toast(label + ' עם ' + C.he + ' בוטל'); addNews('ביטלנו את ה' + label + ' עם ' + C.he + '.', 'dip'); renderAll(); return; }
  const r = aiScore(type, o);
  if (r.ok) { setPact(o, S.player, type, true); addRel(o, S.player, relGain); toast(C.he + ' הסכימה! ' + label + ' נחתם'); addNews('נחתם ' + label + ' בין ' + P().he + ' ל' + C.he + '.', 'good'); }
  else { addRel(o, S.player, -2); toast(C.he + ' סירבה: ' + r.why, true); }
  renderAll();
}
function confirmWar(o) {
  if (!o || o === S.player) return;
  const C = S.c[o], j = likelyJoiners(S.player, o);
  const nap = hasPact(o, S.player, 'nap');
  let defP = power(C) * 1.3; j.forEach(c => defP += power(S.c[c]) * 0.35 * allyProj(c, o, S.player));
  const ratio = power(P()) * proj(S.player, o) / (defP + 1);
  let h = '<p>להכריז מלחמה על <b>' + C.he + '</b>?</p><ul class="plain">' +
    '<li>' + (adjacent(S.player, o) ? 'שכנה — הצבא יכול לפעול במלוא הכוח.' : 'מדינה רחוקה (' + num(dist(S.player, o)) + ' ק״מ) — רק חלק מהכוח יגיע, והעלות גבוהה.') + '</li>' +
    '<li>יחס כוחות אפקטיבי בחזית: ' + num(ratio, 1) + ' : 1 ' + (ratio > 2 ? '(טוב)' : ratio > 1 ? '(צמוד)' : '(מסוכן!)') + '</li>' +
    (j.length ? '<li class="red">צפויות להצטרף לצד האויב: ' + j.slice(0, 8).map(nm).join(', ') + (j.length > 8 ? ' ועוד ' + (j.length - 8) : '') + '</li>' : '<li>אין לה בעלות ברית שצפויות להגן עליה.</li>') +
    (nap ? '<li class="red">יש לכם הסכם אי-תוקפנות — הפרתו תפגע במוניטין שלך בכל העולם.</li>' : '') +
    '<li>מלחמה עולה כסף, הורגת חיילים ומעייפת את העם.</li></ul>';
  modal({ title: 'הכרזת מלחמה', html: h, buttons: [{ label: 'הכרז מלחמה', cls: 'danger', fn: () => {
    const w = declareWar(S.player, o); if (w) { S.p.dip[o] = S.turn; selected = o; renderAll(); openTabFresh('wars'); toast('המלחמה החלה'); setTimeout(() => zoomToTid(o, 10), 280); }
  } }, { label: 'ביטול' }] });
}
function strike(wid, kind) {
  const w = S.wars.find(x => x.id === wid); if (!w || w.pause > 0) return;
  if (w.used[kind] === S.turn) return;
  const me = P(), en = enemyLeaderFor(w, S.player), E = S.c[en];
  const cost = strikeCost(me, kind);
  if (kind === 'mis' && me.equip < 20) { toast('אין לך מספיק טילים — קנה נשק', true); return; }
  if (!spend(cost)) return;
  w.used[kind] = S.turn;
  const toward = (amt) => { if (w.A.includes(S.player)) w.f += amt; else w.f -= amt; w.f = clamp(w.f, -100, 100); };
  if (kind === 'air') {
    const eff = clamp(me.equip / (E.equip + me.equip + 1) * 2, 0.15, 1.5) * Math.sqrt(proj(S.player, en));
    E.equip *= 1 - 0.05 * eff; E.mil *= 1 - 0.01 * eff; E.gdp *= 1 - 0.002 * eff; me.equip *= 0.99; toward(2 * eff);
    addNews('חיל האוויר תקף יעדים ב' + E.he + ': בסיסים ומחסני נשק הושמדו.', 'war');
    toast('התקיפה האווירית בוצעה. עוצמת האויב נפגעה');
  } else {
    E.equip *= 0.97; E.gdp *= 0.994; toward(1.5);
    alive().forEach(id => { if (id !== S.player && id !== en && isAlly(id, en)) addRel(id, S.player, -3); });
    addNews('מטח טילים נורה לעבר ' + E.he + '. תשתיות צבאיות וכלכליות נפגעו.', 'war');
    toast('מטח הטילים שוגר');
  }
  checkWarEnd(w);
  save(); renderAll();
  if (S.over) showGameOver();
}
function confirmNuke(wid) {
  const w = S.wars.find(x => x.id === wid); if (!w) return;
  const en = enemyLeaderFor(w, S.player);
  const ret = alive().filter(id => id !== S.player && S.c[id].nukes > 0 && (id === en || isAlly(id, en)));
  const h = '<div class="nukewarn"><p><b>אתה עומד לשגר נשק גרעיני על ' + nm(en) + '.</b></p><ul class="plain">' +
    '<li>מיליוני אזרחים ייפגעו.</li><li>כל העולם יפנה נגדך: יחסים יקרסו וסנקציות יוטלו כמעט מכל מדינה.</li>' +
    (ret.length ? '<li class="red">מדינות גרעיניות שעלולות להשיב: ' + ret.slice(0, 6).map(nm).join(', ') + '. תגובה גרעינית עלולה להחריב את המדינה שלך.</li>' : '<li>לאויב ולבעלות בריתו אין נשק גרעיני — אבל העולם לא ישכח.</li>') +
    '<li>העם שלך יהיה בהלם — תמיכה תצנח.</li></ul><label class="chk"><input type="checkbox" id="nukeok"> אני מבין את ההשלכות</label></div>';
  modal({ title: 'אזהרה: תקיפה גרעינית', cls: 'danger', html: h, buttons: [
    { label: 'שגר', cls: 'nuke', keep: true, fn: () => {
      if (!$('#nukeok') || !$('#nukeok').checked) { toast('סמן קודם שאתה מבין את ההשלכות', true); return; }
      modalQ.shift(); $('#modal').classList.remove('open');
      if (!S.wars.includes(w) || P().nukes <= 0) return;
      P().nukes--; nukeImpact(S.player, en, false);
      if (S.wars.includes(w)) { if (w.A.includes(S.player)) w.f += 35; else w.f -= 35; w.f = clamp(w.f, -100, 100); checkWarEnd(w); }
      approvalQuick(); save(); renderAll();
      if (S.over) return showGameOver();
      setTimeout(showModal, 30);
    } },
    { label: 'ביטול', cls: 'primary' }] });
}
function approvalQuick() { const c = P(); c.approval = clamp(c.approval + S.p.shock, 0, 100); S.p.shock = 0; }
function peaceDialog(wid) {
  const w = S.wars.find(x => x.id === wid); if (!w) return;
  const en = enemyLeaderFor(w, S.player), fp = mySideFront(w, S.player);
  const opts = [['cease', 'הפסקת אש (6 חודשים)', true], ['white', 'שלום ללא תנאים', true], ['repar', 'דרוש פיצויים<small class="cost">' + money(S.c[en].gdp * 0.04) + '</small>', true],
    ['terr', 'דרוש שטחים (' + Math.round(Math.max(0, fp) / 2) + '% מהם)', fp >= 15], ['annex', 'דרוש כניעה מלאה וסיפוח', fp >= 70]];
  let h = '<p>מה להציע ל' + nm(en) + '? כרגע אנחנו ' + (fp >= 0 ? 'מחזיקים ' + Math.round(fp) + '% משטחם.' : 'מאבדים — הם מחזיקים ' + Math.round(-fp) + '% משטחנו.') + '</p><p class="sub">ככל שאתה מנצח יותר — הם יסכימו לתנאים קשים יותר.</p><div class="btns col">';
  opts.forEach(([k, l, ok]) => { h += '<button class="b" data-pk="' + k + '"' + (ok ? '' : ' disabled') + '>' + l + '</button>'; });
  h += '</div>';
  modal({ title: 'משא ומתן', html: h, buttons: [{ label: 'סגור' }], onShow: () => {
    document.querySelectorAll('[data-pk]').forEach(b => b.onclick = () => {
      const k = b.dataset.pk; modalQ.shift(); $('#modal').classList.remove('open');
      const age = S.turn - w.start, E = S.c[en];
      const pr = power(P()) / (power(E) + 1);
      let W = fp * 1.2 + age * 0.8 + clamp((pr - 1) * 10, -15, 25) + rel(en, S.player) / 5 + (100 - E.approval) / 10 + (R() - 0.5) * 20;
      if (fp < 0) W += fp * 0.5;
      const need = { cease: 0, white: 10, repar: 35, terr: 40, annex: 60 }[k];
      if (W > need || (k === 'annex' && fp >= 90)) { applyPeace(w, k, S.player, en, Math.max(0, fp) / 200); toast(nm(en) + ' הסכימה!'); }
      else { toast(nm(en) + ' דחתה את ההצעה', true); addNews(nm(en) + ' דחתה את הצעת ה' + (k === 'cease' ? 'הפסקת אש' : 'שלום') + ' שלנו.', 'bad'); }
      save(); renderAll(); setTimeout(showModal, 30);
    });
  } });
}
function showGameOver() {
  modal({ title: 'סוף המשחק', cls: 'danger', html: '<p>' + esc(S.over.txt) + '</p><p>שרדת ' + S.turn + ' חודשים. ניקוד סופי: <b>' + num(score()) + '</b></p>',
    buttons: [{ label: 'משחק חדש', cls: 'primary', fn: () => { wipe(); location.reload(); } }, { label: 'הסתכל על המפה' }] });
}
function showHelp() {
  modal({ title: 'איך משחקים', html:
    '<ul class="plain help">' +
    '<li><b>המטרה:</b> לשרוד ולהגדיל את המדינה שלך עד 2036, או לשלוט ב-35% מהכלכלה העולמית.</li>' +
    '<li><b>תור = חודש.</b> עשה פעולות, ואז לחץ <b>סיים תור</b>.</li>' +
    '<li><b>העם:</b> אם התמיכה יורדת מתחת ל-30% יהיו הפגנות. מתחת ל-15% כמה חודשים ברצף — מהפכה ואתה בחוץ. מסים גבוהים, מלחמות והרוגים מורידים תמיכה; רווחה וניצחונות מעלים.</li>' +
    '<li><b>כלכלה:</b> בלשונית כלכלה קובעים מס, רווחה ותקציב ביטחון. אפשר להיכנס לחוב, אבל חוב גדול מדי = פשיטת רגל.</li>' +
    '<li><b>מפה:</b> צבוט כדי להגדיל, גרור כדי לזוז, הקש על מדינה כדי לפתוח אותה. צהוב = אתה, כחול = בעלות ברית, אדום = במלחמה איתך.</li>' +
    '<li><b>דיפלומטיה:</b> הקש על מדינה: סיוע, סחר, ברית, אי-תוקפנות, סנקציות או מלחמה. פעולה אחת לכל מדינה בחודש.</li>' +
    '<li><b>מלחמה:</b> שכנות קל לתקוף, רחוקות קשה ויקר. כל חודש החזית זזה לפי יחס הכוחות. כבשת 100% — המדינה מסופחת אליך. בעלות ברית (כמו נאט״ו) נכנסות להגן זו על זו!</li>' +
    '<li><b>תקיפות:</b> אוויר וטילים פוגעים בצבא האויב. נשק גרעיני — רק אם יש לך, ויש לו מחיר עולמי נורא.</li>' +
    '<li><b>שלום:</b> בלשונית מלחמות. ככל שאתה מנצח יותר, תוכל לדרוש יותר.</li>' +
    '<li><b>מדינות קטנות קשות יותר.</b> המשחק נשמר אוטומטית.</li></ul>' });
}
function showMenu() {
  modal({ title: 'תפריט', html: '<div class="btns col">' + btn('help', 'איך משחקים') + btn('centerme', 'מרכז את המפה על המדינה שלי') + btn('newgame', 'משחק חדש', 'danger') + '</div><p class="sub">המשחק נשמר אוטומטית בסוף כל תור.</p>',
    buttons: [{ label: 'סגור' }], onShow: () => document.querySelectorAll('#m-body [data-act]').forEach(b => b.addEventListener('click', () => { modalQ.shift(); $('#modal').classList.remove('open'); setTimeout(showModal, 30); }, { once: true })) });
}

/* ================= start screen ================= */
let pickId = null;
function difficulty(id) {
  const rank = alive().sort((a, b) => power(S.c[b]) - power(S.c[a])).indexOf(id);
  return rank < 10 ? ['קל', 'ok'] : rank < 40 ? ['בינוני', 'warn'] : rank < 100 ? ['קשה', 'bad'] : ['קשה מאוד', 'bad'];
}
function initStart() {
  $('#start').classList.add('open');
  const list = alive().sort((a, b) => S.c[a].he.localeCompare(S.c[b].he, 'he'));
  const render = q => {
    q = (q || '').trim().toLowerCase();
    $('#plist').innerHTML = list.filter(id => !q || S.c[id].he.toLowerCase().includes(q) || S.c[id].en.toLowerCase().includes(q))
      .map(id => '<li data-pid="' + id + '"' + (id === pickId ? ' class="on"' : '') + '>' + esc(S.c[id].he) + '<small>' + money(S.c[id].gdp, true) + '</small></li>').join('');
  };
  render('');
  $('#psearch').addEventListener('input', e => render(e.target.value));
  $('#plist').addEventListener('click', e => { const li = e.target.closest('[data-pid]'); if (li) { startPick(li.dataset.pid); zoomToTid(li.dataset.pid, 8); } });
  startPick.render = render;
}
function startPick(id) {
  if (!S.c[id] || !S.c[id].alive) return;
  pickId = id; selected = id; recolor();
  const c = S.c[id], [dl, dc] = difficulty(id);
  $('#pcard').innerHTML = '<h2>' + esc(c.he) + ' ' + chip('קושי: ' + dl, dc) + '</h2>' +
    '<div class="grid g3"><div><small>אוכלוסייה</small>' + popTxt(c.pop) + '</div><div><small>תמ״ג</small>' + money(c.gdp, true) + '</div><div><small>עוצמה צבאית</small>' + num(power(c)) + '</div>' +
    '<div><small>משטר</small>' + GOV_HE[c.gov] + '</div><div><small>גרעין</small>' + num(c.nukes) + '</div><div><small>תמיכת העם</small>' + pct(c.approval) + '</div></div>' +
    '<p class="sub">' + (dc === 'bad' ? 'מדינה קטנה = משחק קשה יותר. תצטרך דיפלומטיה חכמה.' : dc === 'warn' ? 'מדינה בינונית — כוח מוגבל, אויבים אמיתיים.' : 'מעצמה גדולה — אבל גם לה יש אויבים.') + '</p>' +
    '<button class="b primary big" data-act="startpick">התחל לשחק כ' + esc(c.he) + '</button>';
  $('#pcard').classList.add('show');
  if (startPick.render) startPick.render($('#psearch').value);
}
function beginGame() {
  if (!pickId) return;
  setupPlayer(pickId);
  $('#start').classList.remove('open');
  $('#app').classList.add('playing');
  selected = null; save(); renderAll(); zoomToTid(pickId, 10);
  modal({ title: 'ברוך הבא, מנהיג ' + P().he, html: '<p>ינואר 2026. העולם מתוח. כל תור הוא חודש אחד.</p><p>טיפ: התחל מלשונית <b>כלכלה</b>, שמור על העם מרוצה, ובנה בריתות לפני שאתה יוצא למלחמה.</p>',
    buttons: [{ label: 'איך משחקים?', fn: showHelp }, { label: 'קדימה', cls: 'primary' }] });
}

/* ================= boot ================= */
function loadScript(src) {
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { s.remove(); rej(new Error(src)); }; document.head.appendChild(s); });
}
function buildStartRel() {
  START_REL = new Map();
  (window.STARTING_RELATIONS || []).forEach(r => { if (Array.isArray(r) && r.length >= 3) START_REL.set(key(String(r[0]), String(r[1])), clamp(+r[2] || 0, -100, 100)); });
}
function boot() {
  try { initGeo(); } catch (e) { $('#loading').textContent = 'שגיאה בטעינת המפה'; return; }
  buildStartRel();
  const resumed = load();
  if (!resumed) newGame(null);
  initMap();
  document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; const f = ACT[b.dataset.act]; if (f) f(b.dataset); });
  document.addEventListener('input', e => {
    const k = e.target.dataset && e.target.dataset.slider; if (!k || !S.p) return;
    S.p[k] = +e.target.value / 1000;
    const lbl = $('#sv-' + k); if (lbl) lbl.textContent = (S.p[k] * 100).toFixed(k === 'defPct' ? 1 : 0) + '%';
    const c = P(), m = c.gdp / 12;
    const est = $('#est'); if (est) est.innerHTML = money(m * S.p.tax - m * S.p.welfare - m * 0.11 - c.gdp * S.p.defPct / 12);
    const apt = $('#apt'); if (apt) apt.innerHTML = pct(approvalTarget());
  });
  document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.slider) save(); });
  $('#loading').remove();
  if (resumed) {
    $('#app').classList.add('playing'); renderAll(); zoomToTid(S.player, 10);
    if (S.over) showGameOver();
  } else { recolor(); initStart(); }
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => {
    const box = $('#map'); if (Math.abs(box.clientWidth - W) < 40 && Math.abs(box.clientHeight - H) < 120) return;
    d3.select('#mapsvg').remove(); for (const k in pathByTid) delete pathByTid[k]; curK = 1; initMap(); recolor();
  }, 300); });
  window.__W26 = { get S() { return S; }, endTurn, declareWar, annex, power, rel, ACT, selectTid: t => { selected = t; recolor(); openTab('country'); }, zoomToTid };
}
window.addEventListener('DOMContentLoaded', () => {
  loadScript('countries-data.js').catch(() => loadScript('countries-data.sample.js')).catch(() => { window.COUNTRY_DATA = {}; }).then(boot);
});
})();
