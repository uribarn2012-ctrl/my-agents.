/* עולם 2026 — real-time grand strategy. Original game. */
(function () {
'use strict';

/* ================= constants ================= */
const VERSION = 2;
const SAVE_KEY = 'world2026_save_v2';
const OLD_SAVE_KEYS = ['world2026_save_v1'];
const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const DAY_MS = 86400000, START_MS = Date.UTC(2026, 0, 1), DPM = 30.44;
const SPEEDS = [0, 1, 2, 4, 8];
/* military inventory: power points per unit (troops / reserves in thousands) */
const INV_KEYS = ['troops', 'tanks', 'afv', 'art', 'air', 'heli', 'ships', 'subs', 'carriers', 'msl'];
const W8 = { troops: 0.5, tanks: 0.1, afv: 0.02, art: 0.04, air: 0.5, heli: 0.15, ships: 2, subs: 3, carriers: 25, msl: 0.02 };
const INV_HE = { troops: 'חיילים בסדיר', res: 'מילואים', tanks: 'טנקים', afv: 'נגמ״שים ורק״מ', art: 'תותחים וארטילריה', air: 'מטוסי קרב',
  heli: 'מסוקי קרב', ships: 'ספינות קרב', subs: 'צוללות', carriers: 'נושאות מטוסים', msl: 'טילים בליסטיים ושיוט' };
/* purchase packages: n units for cost (bn USD), delivered after days; upkeep = yearly share of the price */
const BUY = {
  troops: { n: 10, cost: 0.3, days: 91, he: 'גיוס 10,000 חיילים', unit: 'חיילים', sub: 'אימון 3 חודשים' },
  tanks: { n: 10, cost: 0.05, days: 183, he: '10 טנקים', unit: 'טנקים', sub: '$5M לטנק · 6 חודשים' },
  afv: { n: 20, cost: 0.04, days: 152, he: '20 נגמ״שים', unit: 'נגמ״שים', sub: '$2M ליחידה · 5 חודשים' },
  art: { n: 10, cost: 0.03, days: 152, he: '10 תותחים', unit: 'תותחים', sub: '$3M לתותח · 5 חודשים' },
  air: { n: 4, cost: 0.32, days: 365, he: '4 מטוסי קרב', unit: 'מטוסי קרב', sub: '$80M למטוס · 12 חודשים' },
  heli: { n: 4, cost: 0.12, days: 274, he: '4 מסוקי קרב', unit: 'מסוקי קרב', sub: '$30M למסוק · 9 חודשים' },
  ships: { n: 1, cost: 0.6, days: 730, he: 'פריגטה', unit: 'ספינות קרב', sub: '$600M · 24 חודשים' },
  subs: { n: 1, cost: 1, days: 913, he: 'צוללת', unit: 'צוללות', sub: '$1B · 30 חודשים' },
  carriers: { n: 1, cost: 13, days: 1461, he: 'נושאת מטוסים', unit: 'נושאות מטוסים', sub: '$13B · 4 שנים', minGdp: 600 },
  msl: { n: 25, cost: 0.06, days: 183, he: '25 טילים', unit: 'טילים', sub: '$2.4M לטיל · 6 חודשים', needMl: 1 }
};
const UPKEEP_RATE = { tanks: 0.08, afv: 0.08, art: 0.06, air: 0.1, heli: 0.1, ships: 0.07, subs: 0.07, carriers: 0.07, msl: 0.02 };
const LVL_HE = ['אין', 'בסיסית', 'מתקדמת', 'עולמית'];
const MIS_RANGE = [0, 300, 2500, 13000];
const AIR_RANGE = 2500; // combat radius with aerial refuelling
/* domestic projects: cost as share of yearly GDP, build time in days */
const PROJ = {
  hosp: { he: 'בתי חולים', cost: 0.004, days: 365, ap: 3, g: 0, rep: 0, d: 'העם +3 לתמיד, האוכלוסייה בריאה יותר' },
  school: { he: 'בתי ספר ואוניברסיטאות', cost: 0.004, days: 548, ap: 2, g: 0.003, rep: 0, d: 'העם +2, צמיחה +0.3% בשנה' },
  infra: { he: 'כבישים, רכבות ונמלים', cost: 0.008, days: 730, ap: 1, g: 0.006, rep: 0, d: 'צמיחה +0.6% בשנה, העם +1' },
  house: { he: 'דיור בר-השגה', cost: 0.006, days: 365, ap: 4, g: 0, rep: 0, d: 'העם +4 לתמיד' },
  green: { he: 'אנרגיה מתחדשת', cost: 0.006, days: 548, ap: 1, g: 0.003, rep: 5, d: 'צמיחה +0.3%, העולם +5, העם +1' },
  police: { he: 'משטרה ויחידות סדר', cost: 0.0015, days: 61, ap: 0, g: 0, rep: 0, d: 'מאפשר לפזר הפגנות בכוח (שקט זמני, פוגע במוניטין)', max: 1 },
  propa: { he: 'מכונת תעמולה', cost: 0.002, days: 91, ap: 4, g: 0, rep: -3, d: 'העם +4, העולם −3. רק למשטרים לא דמוקרטיים', nondem: true }
};
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
// month index -> "מרץ 2027"
function dateTxt(t) { return MONTHS[((t % 12) + 12) % 12] + ' ' + (2026 + Math.floor(t / 12)); }
function dParts(day) { const d = new Date(START_MS + Math.floor(day) * DAY_MS); return { d: d.getUTCDate(), m: d.getUTCMonth(), y: d.getUTCFullYear() }; }
function dayTxt(day) { const q = dParts(day); return q.d + ' ב' + MONTHS[q.m] + ' ' + q.y; }
// same, with the numbers isolated so the date never gets scrambled in right-to-left text
function dayHtml(day) { const q = dParts(day); return '<span class="num">' + q.d + '</span> ב' + MONTHS[q.m] + ' <span class="num">' + q.y + '</span>'; }
function monthOf(day) { const q = dParts(day); return (q.y - 2026) * 12 + q.m; }
function daysTxt(d) { d = Math.max(1, Math.ceil(d)); return d >= 60 ? num(Math.round(d / DPM)) + ' חודשים' : d === 1 ? 'יום אחד' : num(d) + ' ימים'; }
// troops / reserves are kept in thousands
function troopsTxt(k) { const v = k * 1000; return v >= 1e6 ? num(v / 1e6, 2) + ' מיליון' : v >= 1e4 ? num(v / 1000) + ' אלף' : num(Math.round(v / 10) * 10); }
// wrap signed numbers / percents inside Hebrew text so they keep their left-to-right shape
const isoNums = t => String(t).replace(/[+−-]?\d[\d.,]*%?/g, m => '<span class="num" dir="ltr">' + m + '</span>');
const cnt = v => num(Math.max(0, Math.floor(v + 1e-6)));
// signed number for effect lines: +3 / −12
function sgn(v) { const a = Math.abs(v); return '<span class="num" dir="ltr">' + (v > 0 ? '+' : v < 0 ? '−' : '±') + (a >= 1 || a === 0 ? Math.round(a) : a.toFixed(1)) + '</span>'; }

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
    pop, gdp, gdp0: gdp, def: dbud, def0: dbud, defPct: clamp(dbud / gdp, 0.003, 0.15),
    nukes: Math.max(0, Math.round(+def.nukes || 0)), gov: GOV_HE[def.gov] ? def.gov : 'hybrid',
    blocs: Array.isArray(def.blocs) ? def.blocs.slice() : [], approval: clamp(+def.approval || 50, 5, 95),
    alive: true, generated: !d || !!def._est
  };
  makeInv(c, def, dbud, mil);
  return c;
}
// real equipment counts from the data; anything missing is estimated from budget and troops
function makeInv(c, d, dbud, mil) {
  const has = k => d[k] != null && d[k] !== '' && isFinite(+d[k]);
  const v = (k, est) => has(k) ? Math.max(0, +d[k]) : Math.max(0, Math.round(est));
  const inv = { troops: mil };
  inv.tanks = v('tanks', mil * 0.9 + dbud * 2);
  inv.afv = v('afv', inv.tanks * 2.2);
  inv.art = v('art', mil * 0.8 + dbud * 1.5);
  inv.air = v('air', dbud * 1.6 + mil * 0.05);
  inv.heli = v('heli', inv.air * 0.3);
  inv.ships = v('ships', dbud * 0.25 + mil * 0.01);
  inv.subs = v('subs', dbud > 3 ? dbud * 0.05 : 0);
  inv.carriers = Math.min(inv.ships, v('carriers', dbud > 200 ? 1 : 0));
  c.mlv = has('missiles') ? clamp(Math.round(+d.missiles), 0, 3) : dbud > 50 ? 2 : dbud > 5 ? 1 : 0;
  c.adv = has('airdef') ? clamp(Math.round(+d.airdef), 0, 3) : dbud > 30 ? 2 : dbud > 3 ? 1 : 0;
  inv.msl = Math.round([0, 30 + dbud * 1.5, 120 + dbud * 4, 400 + dbud * 5][c.mlv]);
  c.res = v('res', mil * 1.2);
  c.inv = inv; c.inv0 = Object.assign({}, inv);
  // quality of the force: how much money stands behind each soldier (modern jets vs. old rifles)
  c.q = clamp(Math.pow(dbud * 1e6 / Math.max(1, mil * 1000) / 200, 0.3), 0.6, 1.6);
  c.mob = 0;
}
const rawPower = inv => { let s = 0; for (const k of INV_KEYS) s += (inv[k] || 0) * W8[k]; return s; };
const power = c => c ? Math.max(1, rawPower(c.inv) * (c.q || 1)) : 0;
// scale a whole inventory (losses, nuclear damage, ceded land)
function hurtInv(c, f, kinds) {
  const ks = kinds || INV_KEYS;
  ks.forEach(k => { c.inv[k] = Math.max(0, (c.inv[k] || 0) * (1 - f)); });
  if (!kinds) c.res = Math.max(0, c.res * (1 - f * 0.5));
}
// target inventory the defence budget can sustain (plus what the player bought)
function invTarget(c, k) {
  const r = Math.pow(Math.max(0.05, c.def / Math.max(0.01, c.def0)), 0.85);
  return c.inv0[k] * r + ((c.bought && c.bought[k]) || 0) + (k === 'troops' ? c.mob || 0 : 0);
}

function newGame(playerId) {
  S = { v: VERSION, day: 0, turn: 0, speed: 1, player: playerId, c: {}, owner: {}, rd: {}, pacts: {}, sanc: {}, wars: [], news: [], pending: [],
    recession: 0, wid: 1, over: null, won: {}, p: null, worldGdp0: 0, units: [], uid: 0, uc: {} };
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
    if (w) { w.f = (a === '643' && b === '804') ? 18 : 6; w.start = -24; w.startDay = -730; }
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
    nprog: null, cas: 0, casTotal: 0, startGdp: c.gdp, startPop: c.pop, startShare: c.gdp / worldGdp(), bankrupt: false,
    cd: {}, griev: {}, queue: [], proj: [], built: {}, apBonus: 0, growthBonus: 0, bm: null, mStart: null, crack: 0 };
  // world reputation starts from how the world already sees this country
  let avg = 0, n = 0; alive().forEach(o => { if (o !== id) { avg += rel(o, id); n++; } }); avg /= n || 1;
  S.p.rep = clamp(Math.round({ democracy: 58, hybrid: 48, authoritarian: 40 }[c.gov] + avg * 0.5), 10, 90);
  S.p.rep0 = S.p.rep;
  c.bought = {};
  S.p.mStart = { tr: S.p.treasury, ap: c.approval, rep: S.p.rep };
  addNews('ממשלה חדשה נכנסה לתפקיד ב' + c.he + '. העם מצפה לשינוי.', 'good');
  initUnits();
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
  if (S.player && (a === S.player || b === S.player)) needMapRecolor = true;
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
  if (WG_CACHE.t === (S ? S.day + ':' + S.wid : 0)) return WG_CACHE.v;
  let s = 0; for (const id in S.c) if (S.c[id].alive) s += S.c[id].gdp;
  WG_CACHE = { t: S.day + ':' + S.wid, v: s || 1 }; return WG_CACHE.v;
}
// how the rest of the world sees a country: average relation towards it (cached per day)
let WV = { t: -1, m: {} };
function worldView(x) {
  if (WV.t !== S.day) WV = { t: S.day, m: {} };
  if (WV.m[x] != null) return WV.m[x];
  let s = 0, n = 0; alive().forEach(c => { if (c !== x && c !== S.player) { s += rel(c, x); n++; } });
  return (WV.m[x] = n ? s / n : 0);
}
// a country most of the world dislikes, or one that attacked us / our allies in the last year
const hated = x => worldView(x) < -12 || (S.c[x] && S.c[x].gov === 'authoritarian' && worldView(x) < -5);
const provoked = x => S.p && S.p.griev[x] != null && S.day - S.p.griev[x] < 365;
const justified = x => hated(x) || provoked(x);
function noteGrievance(att, victim) {
  if (!S.p || att === S.player) return;
  if (victim === S.player || isAlly(victim, S.player)) S.p.griev[att] = S.day;
}
/* ---- cooldowns (in game days) ---- */
const cdLeft = k => S.p && S.p.cd[k] ? Math.max(0, S.p.cd[k] - S.day) : 0;
const setCd = (k, days) => { S.p.cd[k] = S.day + days; };
/* ---- effects of actions: approval (העם), world reputation (העולם) and relations ---- */
function applyFx(e) {
  const c = P(), out = [];
  if (e.ap) { c.approval = clamp(c.approval + e.ap, 0, 100); out.push('העם ' + sgnT(e.ap)); }
  if (e.rep) { S.p.rep = clamp(S.p.rep + e.rep, 0, 100); out.push('העולם ' + sgnT(e.rep)); }
  if (e.rel) for (const id in e.rel) { if (!S.c[id] || id === S.player) continue; addRel(id, S.player, e.rel[id]); out.push(shortNm(id) + ' ' + sgnT(e.rel[id])); }
  if (e.relAll) out.push(e.relAll);
  needMapRecolor = true;
  return out;
}
// plain-text signed number, isolated left-to-right so "−12" never flips in Hebrew text
const sgnT = v => { const r = Math.round(v); return '\u2066' + (r > 0 ? '+' : r < 0 ? '−' : '±') + Math.abs(r) + '\u2069'; };
const troopsPlain = k => { const v = k * 1000; return v >= 1e6 ? '\u2066' + (v / 1e6).toFixed(2) + '\u2069 מיליון' : v >= 1e4 ? '\u2066' + Math.round(v / 1000) + '\u2069 אלף' : '\u2066' + Math.round(v).toLocaleString('en-US') + '\u2069'; };
const SHORT = { '840': 'ארה״ב', '826': 'בריטניה', '643': 'רוסיה' };
const shortNm = id => SHORT[id] || nm(id);
// effect preview shown on buttons before acting
function fxLine(e) {
  const p = [];
  if (e.cost) p.push(money(e.cost));
  if (e.ap) p.push('העם ' + sgn(e.ap));
  if (e.rep) p.push('העולם ' + sgn(e.rep));
  if (e.rel) for (const id in e.rel) p.push(esc(shortNm(id)) + ' ' + sgn(e.rel[id]));
  if (e.note) p.push(e.note);
  return p.join(' · ');
}
// floating toast with the effects of an action
function fxToast(title, e, bad) {
  const parts = applyFx(e);
  toast((title ? title + (parts.length ? ': ' : '') : '') + parts.join(' · '), bad);
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
function addNews(txt, k) { S.news.unshift({ t: S.day, txt, k: k || 'event' }); if (S.news.length > 200) S.news.length = 200; }

/* ================= casualties & statistics ================= */
// one side's losses: soldiers killed / wounded, civilians killed / wounded, equipment lost, missiles fired, money spent, economic damage
const EQ_K = ['tanks', 'afv', 'art', 'air', 'heli', 'ships', 'subs', 'carriers', 'msl'];
const EQ_HE = { tanks: 'טנקים', afv: 'נגמ״שים', art: 'תותחים', air: 'מטוסי קרב', heli: 'מסוקים', ships: 'ספינות', subs: 'צוללות', carriers: 'נושאות מטוסים', msl: 'טילים' };
const newCas = () => ({ sk: 0, sw: 0, ck: 0, cw: 0, eq: {}, mu: 0, sp: 0, dm: 0 });
function addCas(a, b) {
  if (!a || !b) return a;
  a.sk += b.sk || 0; a.sw += b.sw || 0; a.ck += b.ck || 0; a.cw += b.cw || 0; a.mu += b.mu || 0; a.sp += b.sp || 0; a.dm += b.dm || 0;
  for (const k in b.eq || {}) a.eq[k] = (a.eq[k] || 0) + b.eq[k];
  return a;
}
const killed = x => x ? (x.sk || 0) + (x.ck || 0) : 0;
const SOLD_WR = 2.5; // wounded soldiers per soldier killed
// soldiers taken out of action (thousands) = killed + wounded
function troopCas(lostK, o) { const n = Math.max(0, lostK) * 1000, k = n / (1 + SOLD_WR); o.sk += k; o.sw += n - k; }
// people per km² (civilian casualties depend on how crowded the target is)
function density(id) { const c = S.c[id]; if (!c) return 50; let a = 0; tidsOf(id).forEach(t => { if (TERR[t]) a += TERR[t].km2; }); return c.pop * 1e6 / Math.max(500, a); }
const densF = id => clamp(Math.sqrt(density(id) / 100), 0.15, 4);
const invSnap = c => { const o = { gdp: c.gdp, pop: c.pop }; for (const k of INV_KEYS) o[k] = c.inv[k] || 0; return o; };
// what a country lost since a snapshot (the same numbers that came off its inventory)
function lossFrom(c, b) {
  const o = newCas();
  troopCas(b.troops - (c.inv.troops || 0), o);
  let val = 0;
  for (const k of EQ_K) { const d = b[k] - (c.inv[k] || 0); if (d > 1e-6) { o.eq[k] = d; val += d * unitPrice(k); } }
  o.dm = Math.max(0, b.gdp - c.gdp) + val;
  return o;
}
function civCas(o, n, wr) { n = Math.max(0, n); o.ck += n; o.cw += n * (wr || 3); }
function PS() {
  if (!S.ps) S.ps = { suf: newCas(), cau: newCas(), strikes: 0, struck: 0, done: [], log: [], sp: { def: 0, war: 0, buy: 0, strike: 0 } };
  return S.ps;
}
const WST = () => S.wst || (S.wst = newCas()); // everything lost in the world since the game started
function warSt(w) { return w.st || (w.st = { A: newCas(), B: newCas(), h: [], lg: [], wk: [0, 0] }); }
function warLog(w, txt) { const st = warSt(w); st.lg.unshift({ d: S.day, t: txt }); if (st.lg.length > 14) st.lg.length = 14; }
// add one day's (or one strike's) losses to a war, the world totals and the player's totals
function recordWar(w, lA, lB) {
  const st = warSt(w);
  addCas(st.A, lA); addCas(st.B, lB); addCas(WST(), lA); addCas(WST(), lB);
  st.wk[0] += killed(lA); st.wk[1] += killed(lB);
  if (S.player && inWar(w, S.player)) {
    const mine = w.A.includes(S.player);
    addCas(PS().cau, mine ? lB : lA);
  }
}
// sample the war for the charts (occupation and dead over time)
function warSample(w) {
  const st = warSt(w);
  st.h.push([S.day, Math.round(w.f), Math.round(killed(st.A)), Math.round(killed(st.B))]);
  if (st.h.length > 120) st.h = st.h.filter((x, i) => i % 2 === 0 || i === st.h.length - 1);
}
// a line in the battle log once a week while there is fighting
function weekLog(w) {
  const st = warSt(w), a = st.wk[0], b = st.wk[1]; st.wk = [0, 0];
  if (a + b < 1 || !S.player || !inWar(w, S.player)) return;
  const meA = w.A.includes(S.player), my = meA ? a : b, th = meA ? b : a;
  warLog(w, 'שבוע של קרבות: ' + nT(my) + ' הרוגים בצד שלנו, ' + nT(th) + ' בצד האויב');
}
// one day of fighting with its losses counted: inventory before and after, civilians where the fighting is
function countedBattle(w, fn) {
  const A = w.A.slice(), B = w.B.slice();
  const parts = A.concat(B).filter(m => S.c[m] && S.c[m].alive);
  const snaps = parts.map(m => invSnap(S.c[m]));
  const fA = w.f;
  fn();
  const lA = newCas(), lB = newCas();
  let mine = null;
  parts.forEach((m, i) => {
    const l = lossFrom(S.c[m], snaps[i]);
    addCas(A.includes(m) ? lA : lB, l);
    if (m === S.player) mine = l;
  });
  // civilians are caught in the fighting on the land being fought over
  const sk = lA.sk + lB.sk; if (sk <= 0) return;
  const ru = w.ru && (w.a === S.player || w.b === S.player) ? w.ru : null;
  let onA = fA < 0 ? 1 : fA > 0 ? 0 : 0.5;
  if (ru) { const me = w.A.includes(S.player), inE = ru.aE > 0 || ((me ? w.f : -w.f) > 0), inP = ru.aP > 0 || ((me ? w.f : -w.f) < 0); const tE = inE ? 1 : 0, tP = inP ? 1 : 0; if (tE + tP) onA = (me ? tP : tE) / (tE + tP); }
  const civ = (side, share) => { if (share <= 0) return 0; const lead = side === 'A' ? w.a : w.b; const n = sk * 0.3 * share * densF(lead) * (0.6 + R() * 0.8); civCas(side === 'A' ? lA : lB, n, 3); return n; };
  const cA = civ('A', onA), cB = civ('B', 1 - onA);
  recordWar(w, lA, lB);
  battleFloat(w, killed(lA) + killed(lB));
  if (S.player && inWar(w, S.player)) {
    const meA = w.A.includes(S.player), myCiv = meA ? cA : cB, theirCiv = meA ? cB : cA, lead = w.a === S.player || w.b === S.player;
    if (mine) addCas(PS().suf, mine);
    if (lead) {
      // our own civilians only count where the fighting is on our soil (allies' civilians are theirs)
      const civMe = (meA ? onA : 1 - onA) > 0 ? myCiv : 0;
      civCas(PS().suf, civMe, 3); S.p.civLost = (S.p.civLost || 0) + civMe;
      S.p.civKill = (S.p.civKill || 0) + theirCiv;
    }
    if (mine) { const mc = monthCas(); mc.sk += mine.sk; mc.ck += lead ? myCiv : 0; }
  }
}
const monthCas = () => S.p.mc || (S.p.mc = { sk: 0, ck: 0, ap: 0, rep: 0 });
// a strike (air, missiles, nuclear) with everything it did: kept for the result card, the stats screen and the war log
function strikeRecord(o) {
  const r = Object.assign({ d: S.day, cas: newCas(), own: newCas(), fx: [] }, o);
  const pl = S.player;
  if (r.by === pl) { PS().strikes++; addCas(PS().cau, r.cas); addCas(PS().suf, r.own); PS().sp.strike += r.own.sp || 0; }
  if (r.at === pl) { PS().struck++; addCas(PS().suf, r.cas); }
  addCas(WST(), r.cas); addCas(WST(), r.own);
  const w = S.wars.find(x => (x.A.includes(r.by) && x.B.includes(r.at)) || (x.B.includes(r.by) && x.A.includes(r.at)));
  if (w) {
    const st = warSt(w), byA = w.A.includes(r.by);
    addCas(byA ? st.B : st.A, r.cas); addCas(byA ? st.A : st.B, r.own);
    warLog(w, strikeLine(r));
  }
  if (r.by === pl || r.at === pl) { const L = PS().log; L.unshift(r); if (L.length > 25) L.length = 25; }
  return r;
}
const KIND_HE = { air: 'תקיפה אווירית', mis: 'מטח טילים', nuke: 'תקיפה גרעינית', fac: 'תקיפה על מתקני הגרעין' };
const nT = v => '⁦' + Math.round(v).toLocaleString('en-US') + '⁩';
function eqTxt(eq, max) {
  return EQ_K.filter(k => (eq[k] || 0) >= 0.5).sort((a, b) => eq[b] * unitPrice(b) - eq[a] * unitPrice(a)).slice(0, max || 9).map(k => nT(eq[k]) + ' ' + EQ_HE[k]).join(', ');
}
function strikeLine(r) {
  return (r.by === S.player ? '' : nm(r.by) + ': ') + KIND_HE[r.k] + (r.by === S.player ? ' שלנו' : '') + ' על ' + nm(r.at) + ' — ' + nT(killed(r.cas)) + ' הרוגים' + (eqTxt(r.cas.eq, 2) ? ', הושמדו ' + eqTxt(r.cas.eq, 2) : '');
}
// archive a war the player fought in, for the stats screen
function archiveWar(w, res) {
  if (!S.player || !inWar(w, S.player) || w._arch) return;
  w._arch = 1;
  const st = warSt(w), meA = w.A.includes(S.player);
  PS().done.push({ en: enemyLeaderFor(w, S.player), s: w.startDay, e: S.day, res, my: st[meA ? 'A' : 'B'], th: st[meA ? 'B' : 'A'] });
}

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
  const w = { id: S.wid++, a: att, b: def, A: [att], B: [def], f: 0, start: S.turn, startDay: S.day, pause: 0, stance: 'attack', last: 0, ms: 0 };
  S.wars.push(w);
  warSample(w);
  needMapRecolor = true;
  if (!opt.provoked) noteGrievance(att, def);
  if (def === S.player && S.p && !opt.silent) {
    // rally around the flag: an attacked nation unites behind its leader — but not when we struck first
    if (!opt.noRally) S.p.shock += 6;
    S.pending.push({ type: 'attacked', wid: w.id, from: att, noRally: !!opt.noRally });
  }
  const breakNap = hasPact(att, def, 'nap');
  ['nap', 'trade', 'alliance'].forEach(t => setPact(att, def, t, false));
  addRel(att, def, -200);
  if (!opt.silent && !opt.provoked) {
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
      const pr = opt.joinAtt && isAlly(c, att) ? 0.8 : hasPact(c, att, 'alliance') && !isAlly(c, def) ? 0.3 : 0;
      if (pr && !isAlly(c, def) && R() < pr) { w.A.push(c); joined.push(c); }
    });
  }
  if (!opt.silent) {
    const pl = att === S.player || def === S.player;
    addNews((att === S.player ? 'הכרזת מלחמה על ' + nm(def) : nm(att) + ' הכריזה מלחמה על ' + nm(def)) +
      (joined.length ? '. הצטרפו ללחימה: ' + joined.slice(0, 6).map(nm).join(', ') + (joined.length > 6 ? ' ועוד ' + (joined.length - 6) : '') : '') + '.', pl ? 'war' : 'world');
  }
  return w;
}
function endWar(w, res) {
  if (S.player && inWar(w, S.player)) { const fp = mySideFront(w, S.player); archiveWar(w, res || (fp >= 40 ? 'won' : fp <= -40 ? 'lost' : 'peace')); }
  S.wars = S.wars.filter(x => x !== w);
  addRel(w.a, w.b, 60); // from -100 back to hostile
  S.pending = S.pending.filter(p => !p.wid || p.wid !== w.id || p.type === 'attacked');
  needMapRecolor = true;
}
function aidFor(side, enemy, w) {
  let s = 0, n = 0;
  const list = alive().filter(c => !inWar(w, c) && rel(c, side) > 40 && rel(c, enemy) < -20).sort((x, y) => power(S.c[y]) - power(S.c[x]));
  for (const c of list) { s += power(S.c[c]) * 0.05; if (++n >= 15) break; }
  return s;
}
// one day of fighting (the old monthly model divided by ~30 days)
function battle(w) {
  if (w.pause > 0) {
    w.pause--;
    if (w.pause <= 0) {
      w.pause = 0;
      if (!involvesPlayer(w) || R() < 0.5) { addNews('הפסקת האש בין ' + nm(w.a) + ' ל' + nm(w.b) + ' הפכה להסכם שלום.', involvesPlayer(w) ? 'good' : 'world'); endWar(w); }
      else addNews('הפסקת האש עם ' + nm(enemyLeaderFor(w, S.player)) + ' קרסה — הלחימה התחדשה!', 'war');
    }
    return;
  }
  // the player's own wars are fought by the units on the map
  if (S.player && S.units && (w.a === S.player || w.b === S.player)) return unitBattle(w);
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
  let shift = ((r - 0.5) * 32 / DPM + (R() - 0.5) * 0.55) * size * (pSide ? 1 : 0.6);
  // the deeper the occupation, the stronger the local resistance (insurgency, cities, supply lines)
  if (shift * w.f > 0) shift *= 1 - 0.5 * Math.abs(w.f) / 100;
  // invading across the sea (no shared border) is much slower than a land offensive
  if (!adjacent(w.a, w.b)) shift *= 0.55;
  const f0 = w.f;
  w.f = clamp(w.f + shift, -100, 100); w.last = shift; w.ms = (w.ms || 0) + shift;
  if (pSide && Math.sign(f0) !== Math.sign(w.f)) needMapRecolor = true;
  const lossA = 0.006 * (1 - r) * 2 * lmA / DPM, lossB = 0.006 * r * 2 * lmB / DPM;
  const hurt = (side, loss) => side.forEach(m => {
    const c = S.c[m]; if (!c || !c.alive) return;
    const k = commit(m, w) * loss, dead = c.inv.troops * k;
    hurtInv(c, k, ['troops', 'tanks', 'afv', 'art']);
    hurtInv(c, k * 0.5, ['air', 'heli']);
    hurtInv(c, k * 0.25, ['ships', 'subs', 'msl']);
    if (m === S.player) S.p.cas += dead;
  });
  hurt(w.A, lossA); hurt(w.B, lossB);
  checkWarEnd(w);
}
// monthly front report for the player's wars
function frontNews(w) {
  const pSide = w.A.includes(S.player) ? 'A' : w.B.includes(S.player) ? 'B' : null;
  const s = w.ms || 0; w.ms = 0;
  if (!pSide || w.pause > 0) return;
  const me = mySideFront(w, S.player), en = enemyLeaderFor(w, S.player);
  const myShift = pSide === 'A' ? s : -s;
  if (Math.abs(myShift) >= 1) addNews('חזית ' + nm(en) + ': ' + (myShift > 0 ? 'כוחותינו התקדמו' : 'האויב התקדם') + ' (' + (me >= 0 ? 'אנחנו מחזיקים ' + Math.round(me) + '% משטחם' : 'האויב מחזיק ' + Math.round(-me) + '% משטחנו') + ').', myShift > 0 ? 'good' : 'bad');
  if (myShift > 5) S.p.shock += 0.6;
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
  S.wars.forEach(w => { if ((w.a === lose || w.b === lose) && S.player && inWar(w, S.player)) archiveWar(w, inWar(w, win) && (w.A.includes(win) === w.A.includes(S.player)) ? 'won' : 'lost'); });
  W.pop += L.pop * 0.85; W.gdp += L.gdp * 0.5; W.nukes += Math.floor(L.nukes * 0.5); W.inv.troops += L.inv.troops * 0.05;
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
    S.p.rep = clamp(S.p.rep - (justified(lose) ? 4 : 10), 0, 100);
    setTimeout(() => toast('סיפוח ' + L.he + ': העם +5 · העולם ' + sgnT(-(justified(lose) ? 4 : 10))), 0);
    addNews('ניצחון! ' + L.he + ' נכבשה וסופחה ל' + W.he + '. ההמונים חוגגים, אבל השליטה בשטח הכבוש תהיה יקרה.', 'good');
  } else {
    addNews(nm(win) + ' השלימה את כיבוש ' + L.he + ' וסיפחה אותה. העולם בהלם.', 'world');
  }
  needMapRecolor = true;
}
function cede(win, lose, share) {
  const W = S.c[win], L = S.c[lose]; share = clamp(share, 0.02, 0.5);
  W.pop += L.pop * share; W.gdp += L.gdp * share * 0.6;
  L.pop *= 1 - share; L.gdp *= 1 - share; hurtInv(L, share * 0.5, ['troops']); hurtInv(L, share * 0.3, ['tanks', 'afv', 'art', 'air', 'heli', 'ships', 'subs', 'msl']);
  if (win === S.player) { S.p.shock += 3; S.p.unrest += 2; }
  if (lose === S.player) S.p.shock -= 8;
}

/* ================= economy (daily) ================= */
const DPY = 365.25;
const activeWars = id => warsOf(id).filter(w => w.pause === 0).length;
// yearly cost of one thousand soldiers (bn USD), from what the country really spends per soldier
const soldierCost = c => clamp(0.3 * c.def0 * 1e9 / Math.max(1, c.inv0.troops * 1000), 1500, 150000) * 1000 / 1e9;
const unitPrice = k => BUY[k].cost / BUY[k].n;
// yearly upkeep of everything bought or called up beyond the original army
function extraUpkeep(c) {
  let s = 0; const b = c.bought || {};
  for (const k in b) if (b[k] > 0) s += k === 'troops' ? b[k] * soldierCost(c) : b[k] * unitPrice(k) * (UPKEEP_RATE[k] || 0.07);
  s += (c.mob || 0) * soldierCost(c) * 0.8;
  return s;
}
function budgetDay() {
  const c = P(), p = S.p;
  c.def = c.gdp * p.defPct;
  const d = c.gdp / DPY;
  const b = { income: d * p.tax, welfare: d * p.welfare, admin: d * 0.11, defense: c.def / DPY, war: 0, interest: 0, upkeep: extraUpkeep(c) / DPY, nuke: 0 };
  warsOf(S.player).forEach(w => { if (w.pause > 0) return; const en = enemyLeaderFor(w, S.player); b.war += 0.002 * power(c) * commit(S.player, w) / Math.sqrt(proj(S.player, en)) / DPM; });
  if (p.treasury < 0) b.interest = -p.treasury * (p.bankrupt ? 0.009 : 0.0035) / DPM;
  if (p.nprog && !p.nprog.done) b.nuke = nukeCost(c) / DPM;
  b.net = b.income - b.welfare - b.admin - b.defense - b.war - b.interest - b.upkeep - b.nuke;
  return b;
}
function casMonthToast() {
  const mc = S.p.mc; S.p.mc = null; if (!mc) return;
  if (mc.sk >= 1 || mc.ck >= 1) {
    const t = 'אבדות החודש: ' + nT(mc.sk) + ' חיילים' + (mc.ck >= 1 ? ' ו-' + nT(mc.ck) + ' אזרחים' : '') + ' שלנו נהרגו' + (mc.ap >= 0.5 ? ' · העם ' + sgnT(-mc.ap) : '');
    toast(t, true); addNews(t + '.', 'bad');
  }
  if (mc.rep >= 0.5) { const t = 'אזרחים שנהרגו מהאש שלנו: העולם ' + sgnT(-mc.rep); toast(t, true); }
}
function playerEconomy() {
  const c = P(), p = S.p;
  const b = budgetDay();
  p.treasury += b.net; p.lastDay = b;
  const sp = PS().sp; sp.def += b.defense + b.upkeep + b.nuke; sp.war += b.war;
  warsOf(S.player).forEach(w => { if (w.pause > 0) return; const en = enemyLeaderFor(w, S.player); warSt(w)[w.A.includes(S.player) ? 'A' : 'B'].sp += 0.002 * power(c) * commit(S.player, w) / Math.sqrt(proj(S.player, en)) / DPM; });
  const bm = p.bm || (p.bm = {});
  for (const k in b) bm[k] = (bm[k] || 0) + b[k];
  // growth (yearly rate applied daily)
  const wars = activeWars(S.player);
  let g = 0.026 + (R() - 0.5) * 0.012 - (p.tax - 0.30) * 0.08 + (p.welfare - 0.15) * 0.03 - sanctionHit(S.player) * 0.05 - wars * 0.012 - (S.recession > 0 ? 0.03 : 0) + (p.growthBonus || 0);
  let tr = 0; for (const k in S.pacts) if (S.pacts[k].trade && k.split('|').includes(S.player)) tr++;
  g += Math.min(0.02, tr * 0.004);
  if (c.mob > 0) g -= c.mob / Math.max(1, c.pop * 500) * 1.5; // reservists are away from their jobs
  const debtRatio = p.treasury < 0 ? -p.treasury / c.gdp : 0;
  if (debtRatio > 0.6) g -= (debtRatio - 0.6) * 0.05;
  if (p.bankrupt) g -= 0.03;
  c.gdp *= 1 + g / DPY;
  c.pop *= 1 + 0.008 / DPY;
  equipStep(c);
  if (!p.bankrupt && debtRatio > 1.0) { p.bankrupt = true; p.shock -= 10; addNews('פשיטת רגל! ' + c.he + ' לא עומדת בתשלומי החוב. הריבית מזנקת והעם זועם.', 'bad'); }
  else if (p.bankrupt && debtRatio < 0.8) { p.bankrupt = false; addNews('המשבר הפיננסי מאחורינו — דירוג האשראי שוקם.', 'good'); }
}
// losses are slowly replaced (≈3% of the gap a month); a smaller budget slowly shrinks the army
function equipStep(c) {
  const atw = warsOf(c.id).some(w => w.pause === 0);
  const up = atw ? 0.0011 : 0.0008;
  for (const k of INV_KEYS) {
    const t = invTarget(c, k), v = c.inv[k] || 0;
    if (v < t) c.inv[k] = v + (t - v) * up;
    else if (v > t * 1.02) c.inv[k] = v - (v - t) * 0.0006;
  }
}
function aiEconomy() {
  alive().forEach(id => {
    if (id === S.player) return;
    const c = S.c[id];
    const wars = activeWars(id);
    const g = 0.025 + (R() - 0.5) * 0.02 - sanctionHit(id) * 0.05 - wars * 0.015 - (S.recession > 0 ? 0.03 : 0);
    c.gdp *= 1 + g / DPY; c.pop *= 1 + 0.008 / DPY;
    c.def = c.gdp * c.defPct * (wars ? 1.5 : 1);
    equipStep(c);
    c.approval = clamp(c.approval + (50 - c.approval) * 0.001 + (R() - 0.5) * 0.73 - wars * 0.01, 5, 95);
  });
}

/* ================= approval & reputation ================= */
function warWeariness() {
  let s = 0;
  warsOf(S.player).forEach(w => { if (w.pause > 0) return; s += 3.5 + Math.min(6, Math.max(0, S.turn - w.start) * 0.15); });
  return s;
}
function approvalTarget() {
  const c = P(), p = S.p;
  const wars = activeWars(S.player);
  let T = 62 - (p.tax - 0.30) * 120 + (p.welfare - 0.15) * 150 - warWeariness() + (p.apBonus || 0);
  if (!wars) T -= Math.max(0, p.defPct - 0.05) * 100 * 1.2;
  if (c.mob > 0) T -= Math.min(8, c.mob / Math.max(1, c.pop * 10) * 4);
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
  const casK = p.cas; p.casTotal += casK; p.cas = 0;
  const mc = monthCas();
  if (casK > 0) { const d = Math.min(0.4, 25 * casK / Math.max(0.5, c.pop)); p.shock -= d; mc.ap += d; }
  // our civilians killed hurt even more than soldiers; civilians we kill hurt our standing in the world
  if (p.civLost > 0) { const d = Math.min(0.6, 60 * p.civLost / 1000 / Math.max(0.5, c.pop)); p.shock -= d; mc.ap += d; p.civLost = 0; }
  if (p.civKill > 0) { const d = Math.min(0.3, p.civKill / 4000); p.rep = clamp(p.rep - d, 0, 100); mc.rep += d; p.civKill = 0; }
  const T = approvalTarget();
  c.approval = clamp(c.approval + (T - c.approval) * 0.12 / DPM + p.shock, 0, 100);
  p.shock = 0; p.unrest = Math.max(0, p.unrest - 0.01);
  if (p.crack > 0) p.crack--;
  // world reputation slowly returns to the country's usual standing; aggressive wars keep it down
  let base = 50 + (p.rep0 - 50) * 0.6;
  S.wars.forEach(w => { if (w.a === S.player && w.pause === 0 && !w.just) base -= 8; });
  p.rep = clamp(p.rep + (clamp(base, 5, 95) - p.rep) * 0.0015, 0, 100);
}
// once a month: protests, revolution, coups and elections
function approvalMonthly() {
  const c = P(), p = S.p;
  const thr = { democracy: 15, hybrid: 12, authoritarian: 10 }[c.gov], need = c.gov === 'authoritarian' ? 4 : 3;
  const protestAt = c.gov === 'authoritarian' ? 25 : 30;
  if (c.approval < protestAt) {
    if (p.crack > 0) addNews('המשטרה מפזרת את ההפגנות בכוח. השקט ברחובות מתוח.', 'bad');
    else {
      c.gdp *= 0.997;
      p.unrest += 1; // months of protests build up anger: ignoring the street eventually topples any regime
      addNews(pick(['מאות אלפים מפגינים ברחובות נגד הממשלה.', 'שביתה כללית משביתה את המשק — העם דורש שינוי.', 'הפגנות סוערות מול משרדי הממשלה; המשטרה בכוננות.']), 'bad');
    }
  }
  if (c.approval < thr) {
    p.lowTurns++;
    if (p.lowTurns === 1) { addNews('אזהרה: המדינה על סף מהפכה. אם תמיכת העם לא תעלה — הממשלה תיפול.', 'bad'); S.pending.push({ type: 'revwarn' }); }
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
  // reactions toward the player — a bad world reputation means more sanctions, a good one opens doors
  const rp = S.p.rep, sancMul = rp < 20 ? 3 : rp < 35 ? 2 : rp > 70 ? 0.4 : 1;
  const sancAt = rp < 25 ? -40 : -55;
  ids.forEach(c => {
    if (c === S.player) return;
    const r = rel(c, S.player), C = S.c[c];
    if (!atWar(c, S.player) && !isAlly(c, S.player)) addRel(c, S.player, (rp - 50) / 50 * (C.gov === 'democracy' ? 0.3 : 0.15));
    const sKey = c + '>' + S.player;
    if (!S.sanc[sKey] && r < sancAt && C.gov !== 'authoritarian' && C.gdp > 50 && R() < 0.08 * sancMul && !atWar(c, S.player)) {
      S.sanc[sKey] = 1; S.p.shock -= 0.5;
      addNews(C.he + ' הטילה סנקציות כלכליות על ' + P().he + (rp < 35 ? ' — המוניטין שלנו בעולם בשפל.' : '.'), 'bad');
    } else if (S.sanc[sKey] && r > (rp > 60 ? -35 : -20) && R() < 0.15) {
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
      // a hated player (low world reputation) is a target: others feel free to attack
      const repK = isP ? (S.p.rep < 20 ? 2.5 : S.p.rep < 35 ? 1.6 : 1) : 1;
      const pr = isP ? (ratio > 1.6 / Math.sqrt(repK) && rel(a, b) < -70 / Math.sqrt(repK) ? 0.04 * g * repK : 0) : (ratio > 2 && aiWarsN < 6 ? 0.035 * g : 0);
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
      w.pause = 183; addNews('הפסקת אש בין ' + nm(w.a) + ' ל' + nm(w.b) + ' בתיווך בינלאומי.', 'world');
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
  if (R() < 0.18) {
    const id = pick(ids), c = S.c[id], hit = 0.01 + R() * 0.02;
    const kind = pick(['רעידת אדמה', 'שיטפונות קשים', 'סופת הוריקן', 'בצורת חמורה', 'שריפות ענק']);
    c.gdp *= 1 - hit;
    if (id === S.player) { S.p.shock -= 2; S.p.treasury -= c.gdp * 0.003; addNews(kind + ' פגעה ב' + c.he + '. הממשלה מממנת שיקום.', 'bad'); }
    else {
      addNews(kind + ' ב' + c.he + ': נזק כבד ואלפי עקורים.', 'world');
      // the stricken country asks the world (and us) for help
      if (!atWar(id, S.player) && rel(id, S.player) > -60 && R() < 0.75) S.pending.push({ type: 'aid', from: id, kind, size: hit });
    }
  }
  // refugees from a war zone knock on our door
  if (R() < 0.05) {
    const torn = S.wars.filter(w => w.pause === 0 && !involvesPlayer(w)).map(w => w.f >= 0 ? w.b : w.a).filter(x => S.c[x] && S.c[x].alive);
    if (torn.length) S.pending.push({ type: 'refugees', from: pick(torn) });
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
        const s = pick(strikers), b0 = invSnap(c); np.m = Math.max(0, np.m - 8); hurtInv(c, 0.03, ['air', 'msl']); hurtInv(c, 0.002, ['troops']); p.shock += 2; noteGrievance(s, S.player);
        const loss = lossFrom(c, b0); civCas(loss, Math.round(5 + R() * 40), 3);
        const r = strikeRecord({ k: 'fac', by: s, at: S.player, cas: loss, own: newCas(), war: atWar(s, S.player), used: 24 });
        addNews(nm(s) + ' תקפה מהאוויר את מתקני הגרעין שלנו! התוכנית נסוגה ב-8 חודשים.', 'bad');
        const lp = launchPt(s, 'air', S.player); fxStrike('air', lp, targetPt(S.player, lp), 24, r);
      }
    }
    if (np.m >= 36) {
      np.done = true; np.since = S.turn; c.nukes += 3;
      addNews(c.he + ' ביצעה ניסוי גרעיני תת-קרקעי. מעכשיו — מעצמה גרעינית.', 'war');
      alive().forEach(id => { if (id !== S.player) addRel(id, S.player, -20); });
    }
  } else if ((S.turn - np.since) % 6 === 5 && c.nukes < 60) c.nukes++;
}

/* ================= time ================= */
let needMapRecolor = false;
// one game day: money, fighting, mood and deliveries; a new month also runs the slower world logic
function dayTick() {
  if (!S || S.over) return;
  playerEconomy();
  aiEconomy();
  if (S.units && !S.over) syncAllUnits();
  S.wars.slice().forEach(w => { if (S.wars.includes(w) && !S.over) countedBattle(w, () => battle(w)); });
  if (S.day % 7 === 0) S.wars.forEach(w => { warSample(w); weekLog(w); });
  if (!S.over) unitsDay();
  if (!S.over) approvalStep();
  if (!S.over) deliveries();
  S.day++;
  const m = monthOf(S.day);
  if (m !== S.turn && !S.over) monthTick(m);
}
function monthTick(m) {
  const p = S.p, c = P();
  S.wars.forEach(frontNews);
  casMonthToast();
  if (S.recession > 0) S.recession--;
  if (S.scorch && S.scorch.some(x => x.d <= S.day)) { S.scorch = S.scorch.filter(x => x.d > S.day); scorchDirty = true; }
  aiDiplomacy();
  if (!S.over) aiWars();
  if (!S.over) randomEvents();
  if (!S.over) nukeProgram();
  if (!S.over) approvalMonthly();
  S.turn = m;
  p.budget = p.bm; p.bm = null;
  p.gdpHist.push(c.gdp); if (p.gdpHist.length > 13) p.gdpHist.shift();
  const ms = p.mStart || { tr: p.treasury, ap: c.approval, rep: p.rep };
  if (!S.over) addNews('סיכום ' + dateTxt(m - 1) + ': קופה ' + (p.treasury - ms.tr >= 0 ? '+' : '−') + moneyTxt(Math.abs(p.treasury - ms.tr)) +
    ' · העם ' + sgnT(c.approval - ms.ap) + ' (' + Math.round(c.approval) + '%) · העולם ' + sgnT(p.rep - ms.rep) + ' (' + Math.round(p.rep) + ')', 'month');
  p.mStart = { tr: p.treasury, ap: c.approval, rep: p.rep };
  if (!S.over) checkWin();
  needMapRecolor = true;
}
const moneyTxt = bn => bn >= 1000 ? '$' + (bn / 1000).toFixed(1) + 'T' : bn >= 1 ? '$' + (bn >= 10 ? Math.round(bn) : bn.toFixed(1)) + 'B' : '$' + Math.round(bn * 1000) + 'M';
// production queue (weapons, soldiers, upgrades) and domestic projects
function deliveries() {
  const p = S.p, c = P();
  if (p.queue.length) p.queue = p.queue.filter(q => {
    if (S.day + 1 < q.due) return true;
    if (q.k === 'mobarrive') {
      c.mob = (c.mob || 0) + q.n; c.inv.troops += q.n;
      const t = troopsPlain(q.n) + ' אנשי מילואים התייצבו ביחידות'; addNews(t + '.', 'war'); toast(t);
    } else if (q.k === 'mlv' || q.k === 'adv') {
      c[q.k] = Math.min(3, (c[q.k] || 0) + 1);
      const t = q.k === 'mlv' ? 'תוכנית הטילים שודרגה לרמה ' + LVL_HE[c.mlv] + ' (טווח ' + MIS_RANGE[c.mlv].toLocaleString('en-US') + ' ק״מ)' : 'מערך ההגנה האווירית שודרג לרמה ' + LVL_HE[c.adv];
      addNews(t + '.', 'good'); toast(t);
    } else {
      c.inv[q.k] = (c.inv[q.k] || 0) + q.n; c.bought[q.k] = (c.bought[q.k] || 0) + q.n;
      const t = q.k === 'troops' ? 'סיימו אימון: ' + num(q.n * 1000).replace(/<[^>]+>/g, '') + ' חיילים חדשים' : 'נמסרו לצבא: ' + q.n + ' ' + BUY[q.k].unit;
      addNews(t + '.', 'good'); toast(t);
    }
    return false;
  });
  if (p.proj.length) p.proj = p.proj.filter(q => {
    if (S.day + 1 < q.due) return true;
    const D = PROJ[q.k];
    p.built[q.k] = (p.built[q.k] || 0) + 1;
    p.apBonus = (p.apBonus || 0) + D.ap; p.growthBonus = (p.growthBonus || 0) + D.g;
    const e = { ap: D.ap ? Math.ceil(D.ap / 2) : 0, rep: D.rep };
    addNews('הפרויקט "' + D.he + '" הושלם.', 'good');
    fxToast('הושלם: ' + D.he, e);
    return false;
  });
}
function checkWin() {
  const share = P().gdp / worldGdp();
  if (!S.won.gdp && share >= 0.35) { S.won.gdp = 1; S.pending.push({ type: 'win', txt: 'ניצחון כלכלי! ' + P().he + ' שולטת ב-' + Math.round(share * 100) + '% מהכלכלה העולמית.' }); }
  if (!S.won.time && S.turn >= 120) { S.won.time = 1; S.pending.push({ type: 'win', txt: 'שרדת עשר שנים בשלטון — עד 2036!' }); }
}
function score() {
  if (!S || !S.player) return 0;
  const c = P();
  return Math.max(0, Math.round(c.gdp / worldGdp() * 10000 + c.approval * 10 + S.p.annexed.length * 500 + S.turn * 5 + Math.min(500, power(c) / 10)));
}
function gameOver(reason, txt) { S.over = { reason, txt }; addNews('סוף המשחק: ' + txt, 'bad'); }

/* ================= nuclear ================= */
// people killed by one nuclear strike on a country's biggest city: tens of thousands in a small country, up to ~1.5 million in a giant one
function nukeDead(T) { return Math.round(Math.min(T.pop * 0.3, clamp(T.pop * 0.004 + 0.03, 0.01, 1.5) * (0.7 + R() * 0.6)) * 1e6); }
function nukeHit(att, tgt) {
  const T = S.c[tgt], before = invSnap(T), dead = nukeDead(T);
  T.pop = Math.max(0.01, T.pop - dead / 1e6); T.gdp *= 0.65;
  hurtInv(T, Math.min(0.3, 150 / Math.max(1, T.inv.troops)), ['troops']); hurtInv(T, 0.5, ['tanks', 'afv', 'art', 'air', 'heli', 'ships', 'subs', 'msl']);
  const loss = lossFrom(T, before); civCas(loss, dead, 1.6);
  const lp = launchPt(att, 'mis', tgt), pt = nukePt(tgt);
  S.scorch = (S.scorch || []).filter(x => x.d > S.day).slice(-11); S.scorch.push({ p: pt, d: S.day + 240 }); scorchDirty = true;
  const r = strikeRecord({ k: 'nuke', by: att, at: tgt, cas: loss, own: newCas() });
  r._lp = lp; r._pt = pt;
  return r;
}
function nukeImpact(att, tgt, ai) {
  const T = S.c[tgt], A = S.c[att];
  const r = nukeHit(att, tgt);
  T.approval = clamp(T.approval - 20, 0, 100);
  noteGrievance(att, tgt);
  if (att !== S.player && S.p) S.pending.push({ type: 'nukealert', att, tgt, dead: r.cas.ck });
  addNews('☢ ' + A.he + ' שיגרה נשק גרעיני על ' + T.he + ': ' + nT(r.cas.ck) + ' אזרחים ו-' + nT(r.cas.sk) + ' חיילים נהרגו. העולם בהלם.', 'war');
  fxNuke(r._lp, r._pt, r);
  alive().forEach(id => {
    if (id === att) return;
    addRel(id, att, (isAlly(id, tgt) || id === tgt) ? -70 : -45);
    const C = S.c[id];
    if (C.gov !== 'authoritarian' || rel(id, att) < -50) S.sanc[id + '>' + att] = 1;
  });
  // retaliation
  const ret = alive().filter(id => id !== att && S.c[id].nukes > 0 && (id === tgt || isAlly(id, tgt)));
  if (ret.length && R() < (ret.includes(tgt) ? 0.95 : 0.75)) {
    const rr = ret.includes(tgt) ? tgt : pick(ret);
    S.c[rr].nukes--;
    const r2 = nukeHit(rr, att);
    hurtInv(A, 0.1, ['tanks', 'afv', 'art']);
    if (att === S.player) S.p.shock -= 35;
    addNews('☢ תגובה גרעינית: ' + nm(rr) + ' השיבה במכה גרעינית על ' + A.he + ': ' + nT(r2.cas.ck) + ' אזרחים נהרגו.', 'war');
    setTimeout(() => fxNuke(r2._lp, r2._pt, r2), 2600);
  }
  if (att === S.player) S.p.shock -= 20;
  if (tgt === S.player) S.p.shock -= 15;
  needMapRecolor = true;
  return r;
}

/* ================= save / load ================= */
let WIPED = false;
function save() { if (!S || !S.player || WIPED) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
let OLD_SAVE_FOUND = false, UNITS_MIGRATED = false;
function load() {
  // saves from the old turn-based version can't be continued: drop them and start fresh
  try { OLD_SAVE_KEYS.forEach(k => { if (localStorage.getItem(k)) { OLD_SAVE_FOUND = true; localStorage.removeItem(k); } }); } catch (e) { /* ignore */ }
  try { const s = localStorage.getItem(SAVE_KEY); if (!s) return false; const o = JSON.parse(s);
    if (!o || o.v !== VERSION || !o.player || !o.c || !o.c[o.player] || !o.c[o.player].inv || !o.p || o.day == null) { OLD_SAVE_FOUND = true; localStorage.removeItem(SAVE_KEY); return false; }
    S = o; BASE.clear(); rebuildOwn();
    // saves from before units existed: build the units from the inventory
    if (!Array.isArray(S.units)) { initUnits(); UNITS_MIGRATED = true; }
    return true;
  } catch (e) { return false; }
}
function wipe() { WIPED = true; try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }

/* ================= land raster: sea or land, and which territory, at any point ================= */
const RW = 1440, RH = 720; // 0.25° per pixel
let RAS = null; const TLIST = [null], TIDX = {};
function initRaster() {
  TIDS.forEach(t => { TIDX[t] = TLIST.length; TLIST.push(t); });
  try {
    const cv = document.createElement('canvas'); cv.width = RW; cv.height = RH;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const pr = d3.geoEquirectangular().scale(RW / (2 * Math.PI)).translate([RW / 2, RH / 2]).precision(0.3);
    const pg = d3.geoPath(pr, ctx);
    FEATS.forEach(f => {
      const i = TIDX[f.properties.tid]; if (!i || !f.geometry) return;
      // id in red+green, a checksum in blue: blended border pixels fail the checksum
      ctx.fillStyle = 'rgb(' + (i & 255) + ',' + ((i >> 8) & 255) + ',' + ((i * 97 + 13) & 255) + ')';
      ctx.beginPath(); pg(f); ctx.fill();
    });
    RAS = ctx.getImageData(0, 0, RW, RH).data;
  } catch (e) { RAS = null; }
}
function rasOff(lon, lat) {
  let x = Math.floor((lon + 180) / 360 * RW), y = Math.floor((90 - lat) / 180 * RH);
  x = ((x % RW) + RW) % RW; y = clamp(y, 0, RH - 1);
  return (y * RW + x) * 4;
}
function rasTid(o) {
  if (RAS[o + 3] < 90) return null;
  const i = RAS[o] | (RAS[o + 1] << 8);
  return (((i * 97 + 13) & 255) === RAS[o + 2] && TLIST[i]) ? TLIST[i] : undefined;
}
let FB = null; // feature bounds for the slow, exact fallback
function geoTidAt(p) {
  if (!FB) FB = FEATS.map(f => ({ f, b: d3.geoBounds(f) }));
  for (const { f, b } of FB) {
    const [[x0, y0], [x1, y1]] = b;
    if (p[1] < y0 || p[1] > y1) continue;
    if (x0 <= x1 ? (p[0] < x0 || p[0] > x1) : (p[0] < x0 && p[0] > x1)) continue;
    if (d3.geoContains(f, p)) return f.properties.tid;
  }
  return null;
}
// territory id at a point (null = sea)
function tidAt(lon, lat) {
  if (!RAS) return geoTidAt([lon, lat]);
  // trust the raster only well inside one territory (or open sea); near any border use the exact shapes
  const t = rasTid(rasOff(lon, lat));
  if (t !== undefined) {
    let same = true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      if (rasTid(rasOff(lon + dx * 0.25, lat + dy * 0.25)) !== t) { same = false; break; }
    }
    if (same) return t;
  }
  return geoTidAt([lon, lat]);
}
const ownerAt = (lon, lat) => { const t = tidAt(lon, lat); return t ? (S.owner[t] || null) : null; };
const isSeaAt = p => RAS ? RAS[rasOff(p[0], p[1]) + 3] < 60 : !geoTidAt(p);
// nearest sea point (for ships), searching outward on the raster
function snapSea(p) {
  if (isSeaAt(p) || !RAS) return p;
  const cx = Math.floor((p[0] + 180) / 360 * RW), cy = Math.floor((90 - p[1]) / 180 * RH);
  for (let r = 1; r <= 60; r++) {
    let best = null, bd = 1e9;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const y = cy + dy; if (y < 0 || y >= RH) continue;
      const x = ((cx + dx) % RW + RW) % RW;
      if (RAS[(y * RW + x) * 4 + 3] < 60) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [x, y]; } }
    }
    if (best) {
      // one more pixel out to sea so the ship doesn't sit on the coastline
      const q = [(best[0] + 0.5) / RW * 360 - 180, 90 - (best[1] + 0.5) / RH * 180];
      const ang = Math.atan2(best[1] - cy, best[0] - cx), q2 = [q[0] + Math.cos(ang) * 0.3, q[1] - Math.sin(ang) * 0.3];
      return isSeaAt(q2) ? q2 : q;
    }
  }
  return null;
}
const km = (a, b) => d3.geoDistance(a, b) * 6371;
/* ---- sea routes: ships sail around continents instead of across them ---- */
const GW = 720, GH = 360; // 0.5 degree cells
let SEA = null;
function seaGrid() {
  if (SEA || !RAS) return SEA;
  SEA = new Uint8Array(GW * GH);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
    let sea = 0;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) if (RAS[((y * 2 + j) * RW + x * 2 + i) * 4 + 3] < 60) sea = 1;
    SEA[y * GW + x] = sea;
  }
  // canals and narrow straits the coarse grid would close: Suez, Panama, Bosporus + Dardanelles, Gibraltar, Oresund
  [[[32.3, 31.4], [32.5, 29.8]], [[-79.9, 9.4], [-79.5, 8.8]], [[29.0, 41.3], [26.3, 40.0]], [[-5.8, 35.95], [-5.3, 35.95]], [[12.7, 56.1], [12.6, 55.5]]].forEach(([a, b]) => {
    for (let f = 0; f <= 1.0001; f += 0.02) SEA[gCell([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f])] = 1;
  });
  return SEA;
}
function gCell(p) { const x = ((Math.floor((p[0] + 180) * 2) % GW) + GW) % GW, y = clamp(Math.floor((90 - p[1]) * 2), 0, GH - 1); return y * GW + x; }
const gPt = c => [(c % GW) / 2 - 180 + 0.25, 90 - Math.floor(c / GW) / 2 - 0.25];
function gNearSea(c) {
  if (SEA[c]) return c;
  const cx = c % GW, cy = Math.floor(c / GW);
  for (let r = 1; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const y = cy + dy; if (y < 0 || y >= GH) continue;
    const n = y * GW + ((cx + dx) % GW + GW) % GW; if (SEA[n]) return n;
  }
  return -1;
}
// open water all the way between two points?
function seaLine(a, b) {
  const d = km(a, b), n = Math.max(2, Math.ceil(d / 25)), it = d3.geoInterpolate(a, b);
  for (let i = 1; i < n; i++) if (!SEA[gCell(it(i / n))]) return false;
  return true;
}
// waypoints (ending at b) for a ship, or null when there is no way by sea
function seaRoute(a, b) {
  if (!seaGrid()) return [b];
  if (seaLine(a, b)) return [b];
  const s = gNearSea(gCell(a)), t = gNearSea(gCell(b)); if (s < 0 || t < 0) return null;
  const N = GW * GH, g = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), done = new Uint8Array(N);
  const tx = t % GW, ty = Math.floor(t / GW);
  const cosY = y => Math.max(0.05, Math.cos((90 - y / 2 - 0.25) * Math.PI / 180));
  const h = c => { const x = c % GW, y = Math.floor(c / GW); let dx = Math.abs(x - tx); dx = Math.min(dx, GW - dx); return Math.hypot(dx * cosY((y + ty) / 2), y - ty); };
  const hf = [], hc = [];
  const push = (f, c) => { let i = hf.length; hf.push(f); hc.push(c); while (i > 0) { const q = (i - 1) >> 1; if (hf[q] <= f) break; hf[i] = hf[q]; hc[i] = hc[q]; i = q; } hf[i] = f; hc[i] = c; };
  const pop = () => {
    const top = hc[0], lf = hf.pop(), lc = hc.pop();
    if (hf.length) {
      let i = 0; const n = hf.length;
      for (;;) { let m = -1, mf = lf; const l = 2 * i + 1, r = l + 1; if (l < n && hf[l] < mf) { m = l; mf = hf[l]; } if (r < n && hf[r] < mf) { m = r; mf = hf[r]; } if (m < 0) break; hf[i] = hf[m]; hc[i] = hc[m]; i = m; }
      hf[i] = lf; hc[i] = lc;
    }
    return top;
  };
  g[s] = 0; push(h(s), s); let found = false;
  while (hf.length) {
    const c = pop(); if (done[c]) continue; done[c] = 1;
    if (c === t) { found = true; break; }
    const x = c % GW, y = Math.floor(c / GW), cy = cosY(y);
    for (let dy = -1; dy <= 1; dy++) {
      const ny = y + dy; if (ny < 0 || ny >= GH) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const n = ny * GW + ((x + dx) % GW + GW) % GW; if (!SEA[n] || done[n]) continue;
        const ng = g[c] + Math.hypot(dx * cy, dy); if (ng < g[n]) { g[n] = ng; from[n] = c; push(ng + h(n), n); }
      }
    }
  }
  if (!found) return null;
  const cells = []; for (let c = t; c !== -1; c = from[c]) cells.push(c); cells.reverse();
  // pull the string tight: keep only the turns that are needed
  const pts = [a].concat(cells.map(gPt), [b]), out = [];
  let i = 0;
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    while (j > i + 1 && !seaLine(pts[i], pts[j])) j--;
    out.push(pts[j]); i = j;
  }
  return out;
}
const routeKm = (p, via, dest) => { let d = 0, q = p; for (const w of (via || [])) { d += km(q, w); q = w; } return d + km(q, dest); };
// sample points of a territory: inside, on the border, and in the sea just off the coast
const TPC = {};
function tp(tid) {
  if (TPC[tid]) return TPC[tid];
  const T = TERR[tid], res = { in: [], edge: [], sea: [] };
  TPC[tid] = res;
  if (!T || !T.best) { res.in.push(T ? T.c : [0, 0]); return res; }
  const poly = T.best, inv = d3.geoArea(poly) > 2 * Math.PI;
  const inside = p => d3.geoContains(poly, p) !== inv;
  const b = d3.geoBounds(poly); let [x0, y0] = b[0], [x1, y1] = b[1]; if (x1 < x0) x1 += 360;
  for (let i = 0; i < 600 && res.in.length < 40; i++) {
    let lon = x0 + R() * (x1 - x0); const lat = y0 + R() * (y1 - y0); if (lon > 180) lon -= 360;
    if (inside([lon, lat])) res.in.push([lon, lat]);
  }
  if (!res.in.length) res.in.push(T.c);
  const ring = poly.coordinates[0], step = Math.max(1, Math.floor(ring.length / 70));
  for (let i = 0; i < ring.length; i += step) res.edge.push(ring[i]);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
  for (let i = 0; i < ring.length; i += step) {
    const v = ring[i];
    outer: for (const off of [0.45, 0.9]) for (const [dx, dy] of DIRS) {
      const p = [v[0] + dx * off, v[1] + dy * off];
      if (isSeaAt(p) && isSeaAt([p[0] + dx * 0.3, p[1] + dy * 0.3]) && !tidAt(p[0], p[1])) { res.sea.push(p); break outer; }
    }
  }
  return res;
}
const mainTid = cid => (TERR[cid] && S.owner[cid] === cid) ? cid : tidsOf(cid).slice().sort((a, b) => TERR[b].area - TERR[a].area)[0];
function inPts(cid) { const t = mainTid(cid); return t ? tp(t).in : []; }
// distance (km) from a point to the nearest part of a country
function distToC(cid, p) {
  let m = 1e9;
  for (const t of tidsOf(cid)) { const q = tp(t); for (const a of q.edge) { const d = km(a, p); if (d < m) m = d; } for (const a of q.in) { const d = km(a, p); if (d < m) m = d; } }
  return m;
}
function nearIn(cid, p) {
  let best = null, bd = 1e9;
  for (const t of tidsOf(cid)) for (const a of tp(t).in) { const d = km(a, p); if (d < bd) { bd = d; best = a; } }
  return best;
}
// spread n points far from each other (farthest-point sampling)
function spread(pts, n) {
  if (!pts.length) return [];
  const out = [pts[Math.floor(R() * pts.length)]];
  while (out.length < n) {
    let best = null, bd = -1;
    for (const p of pts) { let d = 1e9; for (const q of out) d = Math.min(d, km(p, q)); if (d > bd) { bd = d; best = p; } }
    if (bd < 1) { out.push(out[out.length % out.length]); continue; }
    out.push(best);
  }
  return out;
}

/* ================= military units on the map ================= */
// every unit carries a share of the country's real inventory (c.inv); the sum of all units always equals c.inv
const UT = {
  inf: { he: 'קורפוס חי״ר', dom: 'land', spd: 30, ic: 'inf' },
  arm: { he: 'אוגדת שריון', dom: 'land', spd: 40, ic: 'arm' },
  art: { he: 'חטיבת ארטילריה', dom: 'land', spd: 30, ic: 'art' },
  msl: { he: 'סוללת טילים', dom: 'land', spd: 35, ic: 'msl' },
  air: { he: 'כנף אוויר', dom: 'air', spd: 2500, ic: 'air', range: AIR_RANGE },
  heli: { he: 'להק מסוקים', dom: 'air', spd: 700, ic: 'heli', range: 700 },
  fleet: { he: 'צי', dom: 'sea', spd: 500, ic: 'fleet' },
  sub: { he: 'שייטת צוללות', dom: 'sea', spd: 420, ic: 'sub' }
};
const KEY_UT = { troops: 'inf', tanks: 'arm', afv: 'arm', art: 'art', msl: 'msl', air: 'air', heli: 'heli', ships: 'fleet', carriers: 'fleet', subs: 'sub' };
const MINNEW = { troops: 2, tanks: 5, afv: 10, art: 5, air: 4, heli: 4, ships: 1, carriers: 1, subs: 1, msl: 10 };
const LAND_K = { troops: 1, tanks: 1, afv: 1, art: 1, msl: 1 }, AIR_K = { air: 1, heli: 1 };
const domOf = u => UT[u.t].dom;
const unitById = id => S.units.find(u => u.id === id) || null;
const unitsOf = o => S.units.filter(u => u.o === o);
const hasUnits = o => S.units.some(u => u.o === o);
function newUnit(o, t, p, m) {
  S.uc = S.uc || {}; const ck = o + ':' + t; S.uc[ck] = (S.uc[ck] || 0) + 1;
  const u = { id: S.uid = (S.uid || 0) + 1, o, t, n: S.uc[ck], m: m || {}, lon: p[0], lat: p[1], px: p[0], py: p[1], hb: [p[0], p[1]], dest: null, mode: null, slow: 1, at: null };
  placeAt(u);
  S.units.push(u); return u;
}
// remember which territory a unit stands on; its owner (u.at) follows annexations automatically
function placeAt(u) { u.tid = UT[u.t].dom === 'sea' ? null : tidAt(u.lon, u.lat); u.at = u.tid ? (S.owner[u.tid] || null) : null; }
const uName = u => UT[u.t].he + ' ' + u.n;
// home base for a new unit of this kind
function basePt(cid, dom) {
  const t = mainTid(cid); if (!t) return [0, 0];
  const q = tp(t);
  if (dom === 'sea') return q.sea.length ? pick(q.sea) : (snapSea(TERR[t].c) || TERR[t].c);
  return pick(q.in);
}
// split a country's inventory into a sensible number of units and station them at home
function genUnits(cid) {
  const c = S.c[cid]; if (!c || !c.alive) return;
  const I = c.inv, groups = [];
  const g = (t, n, keys) => { n = Math.max(1, n); for (let i = 0; i < n; i++) { const m = {}; keys.forEach(k => { if ((I[k] || 0) > 0) m[k] = I[k] / n; }); if (Object.keys(m).length) groups.push({ t, m }); } };
  const small = power(c) < 80;
  if (small) {
    // small armies: a handful of mixed units
    if (I.troops > 0 || I.afv > 0 || I.art > 0) g('inf', I.troops > 60 ? 2 : 1, I.tanks >= 20 ? ['troops', 'afv', 'art'] : ['troops', 'afv', 'art', 'tanks']);
    if (I.tanks >= 20) g('arm', 1, ['tanks']);
    if (I.air >= 1 || I.heli >= 1) g('air', 1, ['air', 'heli']);
    if (I.ships >= 1 || I.subs >= 1 || I.carriers >= 1) g('fleet', 1, ['ships', 'subs', 'carriers']);
    if (I.msl >= 1) g('msl', 1, ['msl']);
  } else {
    g('inf', clamp(Math.ceil(I.troops / 150), 1, 5), ['troops']);
    if (I.tanks + I.afv > 0) g('arm', clamp(Math.ceil(I.tanks / 800), 1, 3), ['tanks', 'afv']);
    if (I.art > 0) g('art', clamp(Math.ceil(I.art / 2500), 1, 2), ['art']);
    if (I.air > 0) g('air', clamp(Math.ceil(I.air / 300), 1, 3), ['air']);
    if (I.heli > 0) g('heli', 1, ['heli']);
    if (I.ships + I.carriers > 0) g('fleet', clamp(Math.ceil(I.ships / 60), 1, 3), ['ships', 'carriers']);
    if (I.subs > 0) g('sub', 1, ['subs']);
    if (I.msl > 0) g('msl', 1, ['msl']);
  }
  // carriers can't be split in fractions across fleets: give whole carriers to the first fleets
  const fl = groups.filter(x => x.m.carriers != null);
  if (fl.length > 1) { let left = I.carriers; fl.forEach((x, i) => { const n = i === fl.length - 1 ? left : Math.min(left, Math.ceil(I.carriers / fl.length)); x.m.carriers = n; left -= n; if (!n) delete x.m.carriers; }); }
  const t = mainTid(cid); if (!t) return;
  const q = tp(t);
  const landG = groups.filter(x => UT[x.t].dom !== 'sea'), seaG = groups.filter(x => UT[x.t].dom === 'sea');
  const lp = spread(q.in, landG.length), sp = q.sea.length ? spread(q.sea, seaG.length) : [];
  landG.forEach((x, i) => newUnit(cid, x.t, lp[i] || q.in[0], x.m));
  seaG.forEach((x, i) => newUnit(cid, x.t, sp[i] || snapSea(TERR[t].c) || TERR[t].c, x.m));
}
// unit power: ground force, support (artillery, air, missiles: they multiply ground forces) and naval force
function uPow(u, foeAdv) {
  const m = u.m, q = (S.c[u.o] && S.c[u.o].q) || 1, a = foeAdv || 0;
  return {
    l: ((m.troops || 0) * W8.troops + (m.tanks || 0) * W8.tanks + (m.afv || 0) * W8.afv) * q,
    s: ((m.art || 0) * W8.art + (m.msl || 0) * W8.msl * 0.5 + (m.air || 0) * W8.air * (1 - 0.2 * a) + (m.heli || 0) * W8.heli * (1 - 0.12 * a)) * q,
    n: ((m.ships || 0) * W8.ships + (m.subs || 0) * W8.subs + (m.carriers || 0) * W8.carriers) * q
  };
}
const uStr = u => { const p = uPow(u, 0); return p.l + p.s + p.n; };
const uEmpty = u => Object.keys(u.m).every(k => (u.m[k] || 0) < 0.5);
// keep the units equal to the inventory: losses come off proportionally, new equipment goes to units at home
function atHome(u) {
  if (u.dest) return false;
  return domOf(u) === 'sea' ? km([u.lon, u.lat], u.hb) < 400 : u.at === u.o;
}
function depotFor(cid, us, k, d) {
  const home = us.filter(atHome);
  return home.find(u => u.t === KEY_UT[k] && u.m[k] > 0) || home.find(u => u.m[k] > 0) ||
    (d >= MINNEW[k] ? null : (us.find(u => u.m[k] > 0) || home.find(u => (domOf(u) === 'land') === !!LAND_K[k] && (domOf(u) === 'air') === !!AIR_K[k]) || us[0] || null));
}
function syncUnits(cid) {
  const c = S.c[cid]; if (!c) return;
  let us = unitsOf(cid);
  for (const k of INV_KEYS) {
    let sum = 0; for (const u of us) sum += u.m[k] || 0;
    const inv = Math.max(0, c.inv[k] || 0), d = inv - sum;
    if (Math.abs(d) < 1e-7) continue;
    if (d < 0) { const f = sum > 0 ? inv / sum : 0; for (const u of us) if (u.m[k]) u.m[k] *= f; }
    else if (d < MINNEW[k] && sum > 0) {
      // small daily replacements reach every unit that has this kind of equipment, front-line units included
      const f = inv / sum; for (const u of us) if (u.m[k]) u.m[k] *= f;
    } else {
      let dep = depotFor(cid, us, k, d);
      if (!dep) {
        const t = KEY_UT[k], dom = UT[t].dom;
        if (cid === S.player && d >= MINNEW[k] * 2) { const ty = UT[t].he; setTimeout(() => toast('יחידה חדשה הוקמה: ' + ty), 0); }
        dep = newUnit(cid, t, basePt(cid, dom)); us.push(dep);
      }
      dep.m[k] = (dep.m[k] || 0) + d;
    }
  }
  // remove empty units: whatever is left goes to a sister unit (or off the books)
  us.filter(uEmpty).forEach(u => {
    if (us.length <= 1) return;
    const rest = us.filter(x => x !== u && !uEmpty(x));
    if (!rest.length) return;
    for (const k in u.m) {
      const v = u.m[k] || 0; if (!v) continue;
      const to = rest.find(x => x.t === u.t && x.m[k] > 0) || rest.find(x => x.m[k] > 0);
      if (to) to.m[k] += v; else c.inv[k] = Math.max(0, (c.inv[k] || 0) - v);
    }
    S.units = S.units.filter(x => x !== u); us = us.filter(x => x !== u);
    if (selUnit === u.id) { selUnit = null; if (tab === 'unit') openTab(null); }
    if (cid === S.player) addNews(uName(u) + ' הושמדה / פורקה.', 'bad');
    if (S.player && cid !== S.player) { const w = S.wars.find(v => inWar(v, cid) && inWar(v, S.player)); if (w) warLog(w, 'השמדנו את ' + uName(u) + ' של ' + nm(cid)); } else if (cid === S.player) { const w = S.wars.find(v => v.pause === 0 && inWar(v, S.player)); if (w) warLog(w, uName(u) + ' שלנו הושמדה'); }
    if (uFought(u)) { fxBoom([u.lon, u.lat], 15 * fxZ(), { one: 1, dur: 1000 }); fxAdd({ k: 'spark', one: 1, p: [u.lon, u.lat], a: R() * 6, dur: 400 }); }
  });
  for (const u of us) for (const k in u.m) if (!(u.m[k] > 1e-9)) delete u.m[k];
}
// which countries get units on the map: the player and the countries fighting the player nearby
function neededOwners() {
  const s = new Set(); if (!S.player || !S.c[S.player] || !S.c[S.player].alive) return s;
  s.add(S.player);
  const near = [];
  warsOf(S.player).forEach(w => {
    const foes = w.A.includes(S.player) ? w.B : w.A, lead = w.a === S.player || w.b === S.player;
    if (lead) s.add(enemyLeaderFor(w, S.player));
    foes.forEach(f => { if (!s.has(f) && S.c[f] && S.c[f].alive && (adjacent(f, S.player) || dist(f, S.player) < 1200)) near.push(f); });
  });
  near.sort((a, b) => dist(a, S.player) - dist(b, S.player)).slice(0, 3).forEach(f => s.add(f));
  return s;
}
function refreshOwners() {
  const need = neededOwners();
  const had = new Set(S.units.map(u => u.o));
  S.units = S.units.filter(u => need.has(u.o) && S.c[u.o] && S.c[u.o].alive);
  need.forEach(o => { if (!had.has(o)) { genUnits(o); if (o !== S.player) deployExisting(o); } });
  if (selUnit && !unitById(selUnit)) { selUnit = null; if (tab === 'unit') openTab(null); }
}
function syncAllUnits() {
  if (!S || !S.player || !S.units) return;
  refreshOwners();
  new Set(S.units.map(u => u.o)).forEach(syncUnits);
  unitsDirty = true;
}
// a war that was already running when units appeared: put part of the occupier's army on the front
function deployFront(att, cid, share) {
  const land = unitsOf(att).filter(u => domOf(u) === 'land').sort((a, b) => uStr(b) - uStr(a));
  const tot = land.reduce((s, u) => s + uStr(u), 0); let sent = 0;
  const pts = []; tidsOf(cid).forEach(t => tp(t).in.forEach(p => pts.push(p)));
  pts.sort((a, b) => distToC(att, a) - distToC(att, b));
  const front = pts.slice(0, Math.max(3, Math.ceil(pts.length / 3)));
  for (const u of land) {
    if (sent >= tot * share) break; const p = front[Math.floor(R() * front.length)]; if (!p) break;
    u.lon = u.px = p[0]; u.lat = u.py = p[1]; placeAt(u); sent += uStr(u);
    if (att !== S.player) { u.ai = 'atk'; u.s0 = uStr(u); }
  }
}
function deployExisting(o) {
  warsOf(S.player).forEach(w => {
    if (!(w.a === S.player || w.b === S.player) || enemyLeaderFor(w, S.player) !== o) return;
    const fp = mySideFront(w, S.player);
    if (fp > 3 && !unitsOf(S.player).some(u => u.at === o)) deployFront(S.player, o, 0.75);
    if (fp < -3) deployFront(o, S.player, 0.5);
  });
}
function initUnits() {
  S.units = []; S.uid = 0; S.uc = {};
  genUnits(S.player);
  refreshOwners();
}
/* ---- reach & movement ---- */
const passable = n => n === S.player || isAlly(n, S.player) || atWar(n, S.player);
function landReach(from, to) {
  if (!from || !to) return false;
  if (from === to) return true;
  const seen = new Set([from]); let fr = [from];
  for (let d = 0; d < 6 && fr.length; d++) {
    const nx = [];
    for (const c of fr) for (const n of neighborsOf(c)) { if (seen.has(n)) continue; if (n === to) return true; seen.add(n); if (passable(n)) nx.push(n); }
    fr = nx;
  }
  return false;
}
const FLEET_AREA = 700;
const friendlyFleetNear = (p, r) => S.units.find(u => u.o === S.player && domOf(u) === 'sea' && (u.m.ships || 0) + (u.m.carriers || 0) >= 1 && km([u.lon, u.lat], p) <= r) || null;
function airOk(p, range) {
  if (distToC(S.player, p) <= range) return true;
  if (S.units.some(u => u.o === S.player && (u.m.carriers || 0) >= 1 && km([u.lon, u.lat], p) <= range)) return true;
  return alive().some(a => { if (!isAlly(a, S.player)) return false; const t = mainTid(a); return t && km(TERR[t].c, p) < range + 1500 && distToC(a, p) <= range; });
}
// check a move order; returns { dest, days, slow, needWar } or { err }
function planMove(u, p, mode) {
  const ty = UT[u.t]; let dest = [p[0], p[1]], slow = 1, ferry = null, via = null;
  let destTid = tidAt(dest[0], dest[1]), destC = destTid ? (S.owner[destTid] || null) : null;
  if (ty.dom === 'sea') {
    if (destTid || !isSeaAt(dest)) { dest = snapSea(dest); if (!dest) return { err: 'אין ים קרוב לנקודה הזו' }; }
    destC = null;
    const rt = seaRoute([u.lon, u.lat], dest); if (!rt) return { err: 'אין דרך בים לשם — הים הזה סגור' };
    via = rt.slice(0, -1);
  } else if (ty.dom === 'land') {
    if (!destTid) return { err: 'כוחות יבשה לא עוצרים בים — בחר נקודה ביבשה' };
    const from = u.at || S.player;
    if (mode !== 'ret' && !landReach(from, destC || from)) {
      ferry = friendlyFleetNear(dest, FLEET_AREA);
      if (!ferry) return { err: 'אין דרך ביבשה לשם. כדי לחצות ים צריך צי שלך באזור (עד ' + FLEET_AREA + ' ק״מ מהיעד)' };
    } else if (mode === 'ret' && !landReach(from, S.player)) slow = 0.7;
  } else if (!airOk(dest, ty.range)) return { err: 'מחוץ לטווח: עד ' + ty.range.toLocaleString('en-US') + ' ק״מ מבסיס שלך, של בעלת ברית או מנושאת מטוסים' };
  const needWar = destC && destC !== S.player && !isAlly(destC, S.player) && !atWar(destC, S.player) ? destC : null;
  const d = via && via.length ? routeKm([u.lon, u.lat], via, dest) : km([u.lon, u.lat], dest);
  if (ferry) {
    // march to the fleet, board (2 days) and cross at transport speed: slower than a land march of the same distance
    const fp = [ferry.lon, ferry.lat], days = km([u.lon, u.lat], fp) / ty.spd + km(fp, dest) / 150 + 2;
    slow = clamp(d / Math.max(1, days * ty.spd), 0.05, 0.9);
  }
  return { dest, via: via && via.length ? via : null, slow, needWar, km: d, days: Math.max(ty.spd >= 2000 ? 0.5 : 1, Math.ceil(d / (ty.spd * slow))), mode: mode || 'move' };
}
function commitMove(u, r, quiet) {
  if (!S.units.includes(u)) return;
  u.dest = r.dest; u.via = r.via || null; u.slow = r.slow; u.mode = r.mode;
  if (u.o === S.player && !quiet) toast(uName(u) + ' בדרך · ' + (r.days < 1 ? 'מגיעה תוך פחות מיום' : 'עוד ' + daysTxt(r.days).replace(/<[^>]+>/g, '')));
  unitsDirty = true;
}
const etaDays = u => u.dest ? routeKm([u.lon, u.lat], u.via, u.dest) / (UT[u.t].spd * (u.slow || 1)) : 0;
function unitsMove() {
  const arrived = [];
  for (const u of S.units) {
    u.px = u.lon; u.py = u.lat;
    if (!u.dest) { if (u.tid !== undefined) u.at = u.tid ? (S.owner[u.tid] || null) : null; else placeAt(u); continue; }
    let left = UT[u.t].spd * (u.slow || 1);
    if (u.via && domOf(u) !== 'sea') u.via = null;
    while (left > 0 && u.via && u.via.length) {
      const w = u.via[0], dw = km([u.lon, u.lat], w);
      if (dw <= left) { u.lon = w[0]; u.lat = w[1]; left -= dw; u.via.shift(); }
      else { const q = d3.geoInterpolate([u.lon, u.lat], w)(left / dw); u.lon = q[0]; u.lat = q[1]; left = 0; }
    }
    if (u.via && !u.via.length) u.via = null;
    if (left <= 0) { placeAt(u); continue; }
    const d = km([u.lon, u.lat], u.dest);
    if (d <= left) {
      u.lon = u.dest[0]; u.lat = u.dest[1]; u.dest = null; u.via = null; u.slow = 1; u.mode = null;
      if (u.o === S.player) arrived.push(u);
    } else { const q = d3.geoInterpolate([u.lon, u.lat], u.dest)(left / d); u.lon = q[0]; u.lat = q[1]; }
    placeAt(u);
  }
  if (arrived.length) {
    const where = arrived[0].at ? ' ל' + nm(arrived[0].at) : ' ליעד';
    toast(arrived.length === 1 ? uName(arrived[0]) + ' הגיעה' + where : arrived.length + ' יחידות הגיעו ליעד');
  }
}
function sendHome(u, quiet) {
  const r = planMove(u, u.hb, 'ret');
  if (r.err) { r.dest = u.hb; r.slow = 0.7; r.days = Math.ceil(km([u.lon, u.lat], u.hb) / (UT[u.t].spd * 0.7)); }
  commitMove(u, r, quiet);
}
/* ---- combat helpers ---- */
function forcesIn(owner, cid, foeAdv) {
  let l = 0, s = 0; const list = [];
  for (const u of S.units) { if (u.o !== owner || u.at !== cid || domOf(u) === 'sea') continue; const p = uPow(u, foeAdv); l += p.l; s += p.s; list.push(u); }
  return { l, s, list };
}
function navyNear(owner, cid, r) {
  let n = 0; const list = [];
  for (const u of S.units) { if (u.o !== owner || domOf(u) !== 'sea') continue; if (distToC(cid, [u.lon, u.lat]) <= r) { n += uPow(u, 0).n; list.push(u); } }
  return { n, list };
}
const atkStr = f => f.l > 0 ? f.l + Math.min(f.s, f.l * 2) : 0;
const defStr = f => f.l + Math.min(f.s, f.l * 2 + 5);
// losses come off the units that are actually fighting (and off the inventory with them)
function hurtUnit(u, k, foeAdv) {
  const c = S.c[u.o]; if (!c) return 0;
  let dead = 0;
  for (const key in u.m) {
    const f = key === 'msl' ? k * 0.25 : LAND_K[key] ? k : AIR_K[key] ? k * 0.5 * (1 + 0.5 * (foeAdv || 0)) : k * 0.25;
    const lost = (u.m[key] || 0) * clamp(f, 0, 0.5);
    u.m[key] -= lost; c.inv[key] = Math.max(0, (c.inv[key] || 0) - lost);
    if (key === 'troops') dead += lost;
  }
  if (u.o === S.player) S.p.cas += dead;
  if (dead > 0.0004) markHit(u);
  return dead;
}
// the player's war, fought by the units on the map
function unitBattle(w) {
  const me = S.player, E = enemyLeaderFor(w, me), pA = w.A.includes(me);
  const Ec = S.c[E], M = P(); if (!Ec || !Ec.alive) return;
  const mine = pA ? w.A : w.B, theirs = pA ? w.B : w.A;
  const fp = mySideFront(w, me);
  // allies without units on the map still help, as in the old abstract model
  let allyMe = aidFor(me, E, w) * 0.5, allyEn = aidFor(E, me, w);
  mine.forEach(m => { if (m !== me && S.c[m] && S.c[m].alive && !hasUnits(m)) allyMe += power(S.c[m]) * commit(m, w) * allyProj(m, me, E); });
  theirs.forEach(m => { if (m !== E && S.c[m] && S.c[m].alive && !hasUnits(m)) allyEn += power(S.c[m]) * commit(m, w) * allyProj(m, E, me); });
  allyMe *= 0.6; allyEn *= 0.6;
  // theatre 1: the enemy's land
  const myInE = forcesIn(me, E, Ec.adv), enInE = forcesIn(E, E, M.adv);
  const sea = !adjacent(me, E);
  const myNav = navyNear(me, E, 600), enNav = navyNear(E, E, 600);
  // navy off their coast: fire support and blockade, in proportion to the size of the landing force
  const navShare = myNav.n / (myNav.n + enNav.n + 1), navW = Math.min(1, myNav.n / (0.15 * Math.max(1, myInE.l)));
  let aE = atkStr(myInE);
  if (aE > 0) {
    aE += allyMe;
    aE *= 1 + 0.6 * navShare * navW;
    if (sea && myNav.n <= 0) aE *= 0.5; // cut off across the sea without a fleet
  }
  let dE = hasUnits(E) ? defStr(enInE) : power(Ec) * 0.6;
  dE += allyEn;
  if (sea) dE *= (1 + 0.2 * enNav.n / (myNav.n + enNav.n + 1)) * (1 - 0.25 * clamp((navShare - 0.5) * 2, 0, 1) * navW);
  // theatre 2: our land
  const enInMe = forcesIn(E, me, M.adv), myInMe = forcesIn(me, me, Ec.adv);
  let aP = atkStr(enInMe); if (aP > 0) aP += allyEn * 0.5;
  let dP = defStr(myInMe) + allyMe;
  let lm = 1;
  if (w.stance === 'attack') { aE *= 1.2; lm = 1.5; } else { aE *= 0.85; dP *= 1.15; lm = 0.7; }
  dE *= 1.3 + Math.max(0, fp) / 250; dP *= 1.3 + Math.max(0, -fp) / 250;
  aE *= 1 - Math.max(0, -fp) / 200; aP *= 1 - Math.max(0, fp) / 200;
  const rE = aE > 0 ? aE / (aE + dE + 1e-9) : 0, rP = aP > 0 ? aP / (aP + dP + 1e-9) : 0;
  const actE = fp > 0 || aE > 0, actP = fp < 0 || aP > 0;
  w.ru = { aE: Math.round(aE), dE: Math.round(dE), aP: Math.round(aP), dP: Math.round(dP), rE, rP };
  let shift = 0;
  if (actE || actP) {
    const K = 32 / DPM;
    shift = (actE ? (rE - 0.5) * K : 0) - (actP ? (rP - 0.5) * K : 0) + (R() - 0.5) * 0.55;
    const occ = fp >= 0 ? Ec : M;
    shift *= clamp(Math.sqrt(15 / Math.max(0.5, occ ? occ.pop : 15)), 0.3, 0.75);
    if (shift * fp > 0) shift *= 1 - 0.5 * Math.abs(fp) / 100;
    if (sea) shift *= 0.55;
  }
  let nf = clamp(fp + shift, -100, 100);
  if (fp >= 0 && nf < 0 && !(aP > 0 && rP > 0.5)) nf = 0;
  if (fp <= 0 && nf > 0 && !(aE > 0 && rE > 0.5)) nf = 0;
  const f0 = w.f;
  w.f = pA ? nf : -nf; w.last = w.f - f0; w.ms = (w.ms || 0) + (w.f - f0);
  if (Math.sign(f0) !== Math.sign(w.f)) needMapRecolor = true;
  // losses
  const L = 0.012 / DPM;
  if (aE > 0) {
    myInE.list.forEach(u => hurtUnit(u, L * (1 - rE) * lm, Ec.adv));
    enInE.list.forEach(u => hurtUnit(u, L * rE, M.adv));
    myNav.list.forEach(u => hurtUnit(u, L * (1 - rE) * 0.5, 0)); enNav.list.forEach(u => hurtUnit(u, L * rE * 0.5, 0));
  }
  if (aP > 0) {
    enInMe.list.forEach(u => hurtUnit(u, L * (1 - rP), M.adv));
    myInMe.list.forEach(u => hurtUnit(u, L * rP * lm, Ec.adv));
  }
  if (aE > 0 || aP > 0) {
    const r = aE > 0 ? rE : 1 - rP;
    mine.forEach(m => { if (m !== me && S.c[m] && !hasUnits(m)) { const k = commit(m, w) * L * (1 - r) * 0.5; hurtInv(S.c[m], k, ['troops', 'tanks', 'afv', 'art']); } });
    theirs.forEach(m => { if (m !== E && S.c[m] && !hasUnits(m)) { const k = commit(m, w) * L * r * 0.5; hurtInv(S.c[m], k, ['troops', 'tanks', 'afv', 'art']); } });
  }
  checkWarEnd(w);
}
// fights in other enemy countries where our units stand (no ground gained, but both sides bleed)
function skirmishes() {
  const lead = new Set(warsOf(S.player).filter(w => w.pause === 0 && (w.a === S.player || w.b === S.player)).map(w => enemyLeaderFor(w, S.player)));
  const M = P();
  new Set(S.units.filter(u => u.o === S.player && u.at && u.at !== S.player && domOf(u) !== 'sea').map(u => u.at)).forEach(x => {
    if (lead.has(x) || !atWar(x, S.player) || !S.c[x]) return;
    const X = S.c[x], a = forcesIn(S.player, x, X.adv), d = hasUnits(x) ? forcesIn(x, x, M.adv) : null;
    const A = atkStr(a); if (!A) return;
    const D = (d ? defStr(d) : power(X) * 0.5) * 1.3, r = A / (A + D + 1e-9), L = 0.012 / DPM;
    const w = S.wars.find(v => (v.A.includes(x) && v.B.includes(S.player)) || (v.B.includes(x) && v.A.includes(S.player)));
    const go = () => {
      a.list.forEach(u => hurtUnit(u, L * (1 - r), X.adv));
      if (d) d.list.forEach(u => hurtUnit(u, L * r, M.adv)); else hurtInv(X, L * r * 0.5, ['troops', 'tanks', 'afv', 'art']);
    };
    if (w) countedBattle(w, go); else go();
  });
}
/* ---- enemy behaviour: defend, gather against invaders, sometimes counter-attack ---- */
function aiUnits() {
  warsOf(S.player).forEach(w => {
    if (!(w.a === S.player || w.b === S.player)) return;
    const E = enemyLeaderFor(w, S.player), Ec = S.c[E]; if (!Ec || !Ec.alive) return;
    const eu = unitsOf(E), fighters = eu.filter(u => domOf(u) !== 'sea');
    if (w.pause > 0) { fighters.forEach(u => { if (u.at !== E && !u.dest) sendHome(u, true); u.ai = null; }); return; }
    // beaten attackers fall back
    fighters.forEach(u => { if (u.ai === 'atk' && u.at === S.player && !u.dest && uStr(u) < (u.s0 || 0) * 0.45) { sendHome(u, true); u.ai = null; addNews('כוחות ' + nm(E) + ' נסוגים מהשטח שלנו.', 'good'); } });
    const intruders = S.units.filter(u => u.o === S.player && domOf(u) === 'land' && u.at === E);
    if (intruders.length && S.day % 9 === 0) fighters.forEach(u => {
      if (domOf(u) !== 'land' || u.at !== E || u.dest || u.ai === 'atk' || R() > 0.5) return;
      const tg = pick(intruders), p = nearIn(E, [tg.lon, tg.lat]);
      if (p && km(p, [u.lon, u.lat]) > 60) { u.dest = p; u.mode = 'move'; u.slow = 1; }
    });
    if (S.day % 7 !== 0 || !adjacent(E, S.player)) return;
    const busy = fighters.filter(u => u.ai === 'atk' && (u.at === S.player || u.dest));
    const home = fighters.filter(u => u.at === E && !u.dest && u.ai !== 'atk');
    const theirs = home.reduce((s, u) => s + uStr(u), 0);
    const myHome = S.units.filter(u => u.o === S.player && u.at === S.player && domOf(u) !== 'sea').reduce((s, u) => s + uStr(u), 0);
    let pr = busy.length ? (w.ru && w.ru.rP < 0.55 && theirs > myHome ? 0.12 : 0) : theirs * 0.45 > myHome ? 0.35 : theirs > myHome * 1.3 ? 0.12 : 0;
    if (Ec.gov === 'authoritarian') pr *= 1.3;
    if (!pr || R() > pr) return;
    let sent = 0; const go = [];
    home.sort((a, b) => uStr(b) - uStr(a)).forEach(u => { if (sent < theirs * (busy.length ? 0.25 : 0.45) && (domOf(u) === 'land' || (domOf(u) === 'air' && go.length))) { go.push(u); sent += uStr(u); } });
    if (!go.length) return;
    go.forEach(u => { const p = nearIn(S.player, [u.lon, u.lat]); if (!p) return; u.dest = p; u.mode = 'move'; u.slow = 1; u.ai = 'atk'; u.s0 = uStr(u); });
    addNews('כוחות ' + nm(E) + ' חצו את הגבול ופלשו לשטחנו!', 'war'); warLog(w, 'כוחות ' + nm(E) + ' פלשו לשטחנו');
    S.pending.push({ type: 'invaded', wid: w.id, from: E, uid: go[0].id });
  });
}
// enemies at war with us strike our bases and cities from the air and with missiles now and then
function aiStrikes() {
  warsOf(S.player).forEach(w => {
    if (w.pause > 0 || !(w.a === S.player || w.b === S.player)) return;
    const E = enemyLeaderFor(w, S.player), Ec = S.c[E]; if (!Ec || !Ec.alive) return;
    const d = adjacent(E, S.player) ? 0 : dist(E, S.player);
    const mis = Ec.mlv > 0 && Ec.inv.msl >= 10 && d <= MIS_RANGE[Ec.mlv], air = Ec.inv.air >= 8 && (d <= AIR_RANGE || Ec.inv.carriers >= 1);
    if (!mis && !air) return;
    if (R() > 0.012 * (Ec.gov === 'authoritarian' ? 1.4 : 1)) return;
    enemyStrike(E, mis && (!air || R() < 0.55) ? 'mis' : 'air');
  });
}
function enemyStrike(E, kind) {
  const Ec = S.c[E], me = P(); if (!Ec || !Ec.alive || !me) return null;
  const before = invSnap(me), dens = densF(S.player);
  let used, frac, lost = 0, civ;
  if (kind === 'air') {
    used = clamp(Math.round(Ec.inv.air * 0.06), 4, 80);
    frac = clamp(used * (Ec.q || 1) / (me.inv.air * 0.5 + me.inv.tanks * 0.03 + 40) * 0.1, 0.003, 0.08) * (1 - 0.15 * me.adv);
    lost = Math.round(used * [0.003, 0.01, 0.025, 0.05][me.adv] * (0.5 + R())); Ec.inv.air = Math.max(0, Ec.inv.air - lost);
    hurtInv(me, frac, ['air', 'heli', 'tanks', 'art', 'msl']); hurtInv(me, frac * 0.4, ['ships', 'afv']); hurtInv(me, frac * 0.15, ['troops']);
    me.gdp *= 1 - frac * 0.04;
    civ = used * 0.35 * dens * (0.4 + R() * 0.8);
  } else {
    used = clamp(Math.round(Ec.inv.msl * 0.08), 5, 150); Ec.inv.msl = Math.max(0, Ec.inv.msl - used);
    const hits = used * (1 - [0, 0.25, 0.5, 0.75][me.adv]);
    frac = clamp(hits / (hits + 300) * 0.2, 0.002, 0.05);
    hurtInv(me, frac, ['air', 'art', 'msl', 'ships']); hurtInv(me, frac * 0.5, ['tanks']); hurtInv(me, frac * 0.2, ['troops']);
    me.gdp *= 1 - frac * 0.08;
    civ = hits * 0.8 * dens * (0.4 + R() * 0.8);
  }
  const loss = lossFrom(me, before); civCas(loss, Math.round(civ), 2.5 + R());
  me.pop = Math.max(0.01, me.pop - loss.ck / 1e6);
  S.p.cas += Math.max(0, before.troops - me.inv.troops);
  const own = newCas(); if (kind === 'air') { if (lost) own.eq.air = lost; } else own.mu = used;
  // dead civilians at home shake the public
  const fx = applyFx({ ap: -Math.min(4, 0.5 + Math.sqrt(loss.ck) / 12) });
  const r = strikeRecord({ k: kind, by: E, at: S.player, cas: loss, own, fx, war: true, used, lost });
  addNews('אזעקה! ' + strikeLine(r) + '.', 'war');
  const lp = launchPt(E, kind, S.player), pt = targetPt(S.player, lp);
  fxStrike(kind, lp, pt, used, r);
  if (S.units) syncAllUnits();
  return r;
}
// once a day: move, fight, keep units equal to the inventory
function unitsDay() {
  if (!S.units) return;
  unitsMove();
  // after peace our units leave the former enemy's land
  S.units.forEach(u => { if (u.o === S.player && !u.dest && u.at && u.at !== S.player && !atWar(u.at, S.player) && !isAlly(u.at, S.player)) sendHome(u); });
  skirmishes();
  aiUnits();
  aiStrikes();
  syncAllUnits();
}

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
  const topPad = 98, botPad = 72;
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
  gScorch = gRoot.append('g').attr('class', 'scorch'); scorchDirty = true;
  gMarks = gRoot.append('g').attr('class', 'marks');
  // units: their own layer on top, not scaled with the map, so icons keep the same size on screen
  gUnits = svg.append('g').attr('class', 'units');
  gRoutes = gUnits.append('g').attr('class', 'routes').node();
  gIcons = gUnits.append('g').attr('class', 'icons').node();
  UEL.clear(); RTEL.clear(); curT = d3.zoomIdentity;
  gLand.on('click', ev => { if (uMode) return; const t = ev.target && ev.target.getAttribute('data-t'); if (t) onMapTap(t); });
  // a tap anywhere (land or sea) while choosing a destination for a unit
  svg.on('click.units', ev => {
    if (!uMode) { if (fanIds) { fanIds = null; drawUnits(); } return; }
    const t = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-t');
    modeTap(evLonLat(ev), t);
  });
  d3.select(gIcons).on('click', ev => {
    const g = ev.target.closest && ev.target.closest('[data-k]'); if (!g) return;
    ev.stopPropagation();
    onUnitTap(g.getAttribute('data-k'));
  });
  zoom = d3.zoom().scaleExtent([0.8, 60]).translateExtent([[-W, -H], [W * 2, H * 2]])
    .on('zoom', ev => { gRoot.attr('transform', ev.transform); curT = ev.transform; if (Math.abs(ev.transform.k - curK) > 0.01) { curK = ev.transform.k; scaleMarks(); if (fanIds && Math.abs(curK / fanK - 1) > 0.25) fanIds = null; } drawUnits(); });
  svg.call(zoom).on('dblclick.zoom', null);
  MAP_PROJ = projection;
  initFx();
  if (!(S && S.player) && W < 900) svg.call(zoom.transform, d3.zoomIdentity.translate(0, H * 0.22 - (topPad + H - botPad) / 2));
}
let MAP_PROJ = null;
function visibleRect() {
  // part of the map not covered by bars / panels: [x0, y0, x1, y1]
  const startOpen = $('#start').classList.contains('open'), sheetOpen = $('#sheet').classList.contains('open');
  const top = (S && S.player) ? 98 : 70;
  if (W >= 900) return [0, top, (startOpen || sheetOpen) ? W - 440 : W, H - 80];
  if (startOpen) return [0, top, W, H * 0.42];
  const sh = sheetOpen ? $('#sheet').offsetHeight : 0;
  return [0, top, W, Math.max(top + 120, H - 64 - sh)];
}
function zoomToTid(t, maxK) {
  const T = TERR[t]; if (!T || !T.best || !svg) return;
  const [[x0, y0], [x1, y1]] = pathGen.bounds(T.best);
  const [vx0, vy0, vx1, vy1] = visibleRect(), vw = vx1 - vx0, vh = vy1 - vy0;
  const [[, sy0], [, sy1]] = pathGen.bounds({ type: 'Sphere' });
  // at least tall enough to fill the screen top to bottom (no empty sky on a tall phone screen)
  const k = clamp(Math.max(0.45 / Math.max((x1 - x0) / vw, (y1 - y0) / vh), vh / (sy1 - sy0)), 1.5, Math.max(maxK || 10, vh / (sy1 - sy0)));
  let tx = (vx0 + vx1) / 2 - k * (x0 + x1) / 2, ty = (vy0 + vy1) / 2 - k * (y0 + y1) / 2;
  // don't leave empty sky above the map (or below it) when the map is taller than the view
  if ((sy1 - sy0) * k >= vh - 1) ty = clamp(ty, vy1 - sy1 * k, vy0 - sy0 * k);
  svg.transition().duration(700).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
}
// opening view: our country, or the front if we start the game at war
function homeView(maxK) {
  const w = warsOf(S.player).find(w => w.pause === 0 && (w.a === S.player || w.b === S.player));
  const en = w && enemyLeaderFor(w, S.player);
  if (en && S.c[en] && S.c[en].alive && adjacent(en, S.player) && mainTid(en)) zoomToTid(mainTid(en), 5);
  else zoomToTid(S.player, maxK);
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
let lastRecolor = 0;
function recolor() {
  if (!gLand) return;
  const selOwner = selected ? (S.owner[selected] || selected) : null;
  for (const t in pathByTid) {
    const col = colorFor(t), isSel = selOwner && (S.owner[t] === selOwner || t === selected);
    // only touch the DOM when something actually changed (keeps the phone smooth while time runs)
    pathByTid[t].forEach(el => { if (el.__c !== col) { el.setAttribute('fill', col); el.__c = col; } if (el.__s !== !!isSel) { el.classList.toggle('sel', !!isSel); el.__s = !!isSel; } });
  }
  const mk = S && S.player ? S.player + ':' + warsOf(S.player).map(w => enemyLeaderFor(w, S.player)).join(',') : '';
  if (mk !== drawMarks.k) { drawMarks.k = mk; drawMarks(); }
  if (scorchDirty) drawScorch();
  needMapRecolor = false; lastRecolor = performance.now();
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
  selected = t; if (selUnit || fanIds) { selUnit = null; fanIds = null; unitsDirty = true; } recolor();
  openTab('country');
}

/* ---- units layer ---- */
let gUnits = null, gRoutes = null, gIcons = null, curT = d3.zoomIdentity, unitsDirty = true, lastUnitsDraw = 0, selUnit = null, uMode = null, ulistIds = [], fanIds = null, fanK = 1;
const UEL = new Map(), RTEL = new Map(), SVGNS = 'http://www.w3.org/2000/svg';
const sEl = (tag, attrs, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
function evLonLat(ev) {
  const [x, y] = d3.pointer(ev, svg.node());
  const m = curT.invert([x, y]);
  return MAP_PROJ.invert(m);
}
const uIcon = u => u.t === 'fleet' && (u.m.carriers || 0) >= 0.5 ? 'car' : UT[u.t].ic;
function kTxt(k) { const v = k * 1000; return v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M' : v >= 1000 ? Math.round(v / 1000) + 'K' : String(Math.round(v)); }
const fl = v => Math.max(0, Math.floor((v || 0) + 1e-6));
// short strength label under the icon: "120K", "450", "60✈"
function uLabel(u) {
  const m = u.m;
  switch (u.t) {
    case 'inf': return kTxt(m.troops || 0);
    case 'arm': return m.tanks >= 1 ? String(fl(m.tanks)) : String(fl(m.afv));
    case 'art': return String(fl(m.art));
    case 'msl': return String(fl(m.msl));
    case 'air': return fl(m.air) >= 1 ? fl(m.air) + '✈︎' : String(fl(m.heli));
    case 'heli': return String(fl(m.heli));
    case 'fleet': return String(fl((m.ships || 0) + (m.carriers || 0))) || '0';
    case 'sub': return String(fl(m.subs));
  }
  return '';
}
const uFought = u => !!(S.c[u.o] && warsOf(u.o).length);
function uFighting(u) {
  if (u.dest) return false;
  if (domOf(u) === 'sea') return warsOf(u.o).some(w => { const en = enemyLeaderFor(w, u.o); return w.pause === 0 && S.c[en] && S.c[en].alive && distToC(en, [u.lon, u.lat]) < 600; });
  if (u.at && u.at !== u.o && atWar(u.at, u.o)) return true;
  return u.at === u.o && S.units.some(e => e.o !== u.o && e.at === u.o && domOf(e) !== 'sea');
}
// current position (smoothly between two game days while time runs)
function uPos(u) {
  let lon = u.lon, lat = u.lat;
  if (S.speed > 0 && u.px != null && (u.px !== u.lon || u.py !== u.lat) && Math.abs(u.px - u.lon) < 90) { const f = clamp(acc, 0, 1); lon = u.px + (u.lon - u.px) * f; lat = u.py + (u.lat - u.py) * f; }
  return [lon, lat];
}
function toScreen(p) { const q = MAP_PROJ(p); return q ? [curT.x + curT.k * q[0], curT.y + curT.k * q[1]] : null; }
// group units into display items: whole countries when zoomed out, nearby icons when zoomed in
function buildItems() {
  const items = [], groups = new Map();
  // a stack the player opened: its units sit in a ring around the stack's place
  const fan = fanIds ? fanIds.map(unitById).filter(Boolean) : [];
  if (fan.length) {
    let cx = 0, cy = 0, n = 0; fan.forEach(u => { const s = toScreen(uPos(u)); if (s) { cx += s[0]; cy += s[1]; n++; } });
    if (n) {
      cx /= n; cy /= n;
      const rings = fan.length <= 7 ? [fan] : [fan.slice(0, 7), fan.slice(7)];
      rings.forEach((ring, ri) => {
        const r = ri ? 92 : (ring.length <= 4 ? 40 : 50);
        ring.forEach((u, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / ring.length + ri * 0.4; items.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) * 1.1, us: [u], o: u.o, fan: [cx, cy] }); });
      });
    }
  }
  const inFan = new Set(fan.map(u => u.id));
  for (const u of S.units) {
    if (inFan.has(u.id)) continue;
    const s = toScreen(uPos(u)); if (!s) continue;
    if (u.id === selUnit) { items.push({ x: s[0], y: s[1], us: [u], o: u.o }); continue; }
    const gk = curK < 2.2 ? u.o + '@' + (u.at || ('s' + Math.round(s[0] / 40) + ',' + Math.round(s[1] / 40))) : 'u' + u.id;
    let g = groups.get(gk); if (!g) { g = { x: 0, y: 0, us: [], o: u.o }; groups.set(gk, g); }
    g.us.push(u); g.x += s[0]; g.y += s[1];
  }
  const gl = [...groups.values()]; gl.forEach(g => { g.x /= g.us.length; g.y /= g.us.length; });
  // merge same-side icons that would overlap on screen (badge 30×22 plus the label under it)
  for (let i = 0; i < gl.length; i++) {
    const a = gl[i]; if (!a) continue;
    for (let j = i + 1; j < gl.length; j++) {
      const b = gl[j]; if (!b || b.o !== a.o) continue;
      const dx = a.x - b.x, dy = a.y - b.y;
      if (Math.abs(dx) < 40 && Math.abs(dy) < 46) { const n = a.us.length + b.us.length; a.x = (a.x * a.us.length + b.x * b.us.length) / n; a.y = (a.y * a.us.length + b.y * b.us.length) / n; a.us = a.us.concat(b.us); gl[j] = null; j = i; }
    }
  }
  gl.forEach(g => { if (g) items.push(g); });
  // push apart icons of different sides that sit on top of each other
  for (let it = 0; it < 3; it++) for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const a = items[i], b = items[j]; if (a.fan || b.fan || (a.o === b.o && a.us[0].id !== selUnit && b.us[0].id !== selUnit)) continue;
    let dx = a.x - b.x, dy = a.y - b.y; const d = Math.hypot(dx, dy);
    if (d < 36) { if (d < 0.01) { dx = 1; dy = 0; } const k = (36 - d) / 2 / (d || 1); a.x += dx * k; a.y += dy * k; b.x -= dx * k; b.y -= dy * k; }
  }
  return items;
}
function mkIcon(key) {
  const g = sEl('g', { 'data-k': key, class: 'ui' });
  g.__p = {
    hit: sEl('rect', { class: 'hit', x: -20, y: -17, width: 40, height: 44 }, g),
    s2: sEl('rect', { class: 'stk', x: -9, y: -19, width: 30, height: 22, rx: 6 }, g),
    s1: sEl('rect', { class: 'stk', x: -12, y: -16, width: 30, height: 22, rx: 6 }, g),
    ring: sEl('circle', { class: 'ring', r: 21 }, g),
    bg: sEl('rect', { class: 'bg', x: -15, y: -13, width: 30, height: 22, rx: 6 }, g),
    use: sEl('use', { x: -10, y: -11.5, width: 20, height: 19 }, g),
    lb: sEl('text', { class: 'lb', y: 18 }, g),
    fx: sEl('circle', { class: 'fx', cx: -14, cy: -12, r: 4 }, g),
    cnt: sEl('g', { class: 'cnt' }, g),
    mini: sEl('g', { class: 'mini' }, g)
  };
  // a stack also shows small icons of the other kinds of units inside it
  g.__p.mu = [0, 1, 2, 3].map(() => { const m = sEl('g', {}, g.__p.mini); sEl('rect', { x: -6.5, y: -5.5, width: 13, height: 12, rx: 3 }, m); m.__u = sEl('use', { x: -5, y: -4.5, width: 10, height: 10 }, m); return m; });
  sEl('circle', { cx: 14, cy: -13, r: 8 }, g.__p.cnt); g.__p.ct = sEl('text', { x: 14, y: -12.5 }, g.__p.cnt);
  gIcons.appendChild(g);
  return g;
}
const setA = (e, k, v) => { v = String(v); if (e.getAttribute(k) !== v) e.setAttribute(k, v); };
const showE = (e, on) => { const v = on ? '' : 'none'; if (e.style.display !== v) e.style.display = v; };
function drawUnits() {
  if (!gIcons || !S || !S.units || !MAP_PROJ) return;
  unitsDirty = false; lastUnitsDraw = performance.now(); const now = lastUnitsDraw;
  // while choosing a destination our own icons let taps through to the map (enemy icons stay tappable as targets)
  gUnits.classed('picking', !!uMode);
  const items = buildItems(), seen = new Set();
  for (const it of items) {
    const multi = it.us.length > 1;
    const key = multi ? 'c' + it.us.map(u => u.id).sort((a, b) => a - b).join(',') : String(it.us[0].id);
    seen.add(key);
    const off = it.x < -60 || it.y < -60 || it.x > W + 60 || it.y > H + 60;
    let g = UEL.get(key);
    if (off) { if (g) showE(g, false); continue; }
    if (!g) { g = mkIcon(key); UEL.set(key, g); }
    showE(g, true);
    // a stack shows infantry (with the total soldiers) when it has any, otherwise its strongest unit
    const P_ = g.__p, lead = multi ? (it.us.filter(u => (u.m.troops || 0) >= 1).sort((a, b) => b.m.troops - a.m.troops)[0] || it.us.slice().sort((a, b) => uStr(b) - uStr(a))[0]) : it.us[0];
    setA(g, 'transform', 'translate(' + it.x.toFixed(1) + ',' + it.y.toFixed(1) + ')');
    const hit = hitUntil > now && it.us.some(u => (HIT.get(u.id) || 0) > now);
    setA(g, 'class', 'ui ' + (it.o === S.player ? 'me' : 'en') + (!multi && lead.id === selUnit ? ' sel' : '') + (hit ? ' hit' : ''));
    setA(P_.use, 'href', '#ui-' + uIcon(lead));
    let lbl = uLabel(lead);
    if (multi) { const tr = it.us.reduce((s, u) => s + (u.m.troops || 0), 0); if (tr >= 1) lbl = kTxt(tr); }
    if (P_.lb.textContent !== lbl) P_.lb.textContent = lbl;
    showE(P_.s1, multi); showE(P_.s2, multi && it.us.length > 2); showE(P_.cnt, multi);
    showE(P_.ring, !multi && lead.id === selUnit);
    if (multi && P_.ct.textContent !== String(it.us.length)) P_.ct.textContent = String(it.us.length);
    showE(P_.fx, it.us.some(uFighting));
    const kinds = multi ? [...new Set(it.us.map(uIcon))].filter(k => k !== uIcon(lead)).slice(0, 4) : [];
    showE(P_.mini, kinds.length > 0);
    P_.mu.forEach((m, i) => {
      showE(m, i < kinds.length); if (i >= kinds.length) return;
      setA(m.__u, 'href', '#ui-' + kinds[i]); setA(m, 'transform', 'translate(' + ((i - (kinds.length - 1) / 2) * 14).toFixed(1) + ',31)');
    });
  }
  UEL.forEach((g, k) => { if (!seen.has(k)) { g.remove(); UEL.delete(k); } });
  // dashed routes with arrival time for moving units, and battle markers of other wars
  const rs = new Set();
  for (const it of items) if (it.fan) {
    const k = 'f' + it.us[0].id; rs.add(k);
    let r = RTEL.get(k); if (!r) { r = sEl('g', { class: 'fanl' }, gRoutes); r.__l = sEl('path', {}, r); RTEL.set(k, r); }
    setA(r.__l, 'd', 'M' + it.fan[0].toFixed(1) + ',' + it.fan[1].toFixed(1) + 'L' + it.x.toFixed(1) + ',' + it.y.toFixed(1));
  }
  // arrival-time labels must not cover unit icons or each other
  const taken = items.map(it => [it.x, it.y + 6, 22, 26]);
  const free = (x, y) => !taken.some(([tx, ty, rx, ry]) => Math.abs(x - tx) < rx + 20 && Math.abs(y - ty) < ry + 8);
  const order = S.units.filter(u => u.dest).sort((a, b) => (b.id === selUnit) - (a.id === selUnit));
  for (const u of order) {
    if (!u.dest || (u.o !== S.player && u.id !== selUnit && u.ai !== 'atk')) continue;
    const a = toScreen(uPos(u)), b = toScreen(u.dest); if (!a || !b) continue;
    const k = 'r' + u.id; rs.add(k);
    let r = RTEL.get(k);
    if (!r) { r = sEl('g', {}, gRoutes); r.__l = sEl('path', {}, r); r.__c = sEl('circle', { r: 3.5 }, r); r.__t = sEl('text', {}, r); RTEL.set(k, r); }
    setA(r.__l, 'class', u.o === S.player ? '' : 'en');
    let dd = 'M' + a[0].toFixed(1) + ',' + a[1].toFixed(1), prev = a;
    for (const q of (u.via || []).map(toScreen).concat([b])) { if (!q) continue; dd += (Math.abs(q[0] - prev[0]) > W * curK * 0.45 ? 'M' : 'L') + q[0].toFixed(1) + ',' + q[1].toFixed(1); prev = q; }
    setA(r.__l, 'd', dd);
    setA(r.__c, 'cx', b[0].toFixed(1)); setA(r.__c, 'cy', b[1].toFixed(1));
    // arrival time only where there is room for it (and always for the selected unit)
    let long = Math.hypot(b[0] - a[0], b[1] - a[1]) > 70 || u.id === selUnit;
    if (long && u.o === S.player) { if (u.id === selUnit || free(b[0], b[1] - 12)) taken.push([b[0], b[1] - 12, 20, 8]); else long = false; }
    showE(r.__c, u.o === S.player); showE(r.__t, u.o === S.player && long);
    if (u.o === S.player && long) { const d = etaDays(u), t = d < 1 ? '< יום' : Math.ceil(d) + ' ימים'; if (r.__t.textContent !== t) r.__t.textContent = t; setA(r.__t, 'x', b[0].toFixed(1)); setA(r.__t, 'y', (b[1] - 8).toFixed(1)); }
  }
  S.wars.forEach(w => {
    if (w.pause > 0 || involvesPlayer(w)) return;
    const mk = warMark(w); if (!mk) return;
    const s = toScreen(mk); if (!s) return;
    const k = 'w' + w.id; rs.add(k);
    let r = RTEL.get(k);
    if (!r) { r = sEl('g', {}, gRoutes); r.__t = sEl('text', { class: 'bt' }, r); r.__t.textContent = '⚔'; RTEL.set(k, r); }
    setA(r.__t, 'x', s[0].toFixed(1)); setA(r.__t, 'y', (s[1] + 5).toFixed(1));
  });
  RTEL.forEach((r, k) => { if (!rs.has(k)) { r.remove(); RTEL.delete(k); } });
}
// where to draw the ⚔ of a war between two other countries: on the border between them
function warMark(w) {
  if (w.mk && w.mk.k === w.a + w.b) return w.mk.p;
  const ta = mainTid(w.a), tb = mainTid(w.b); if (!ta || !tb) return null;
  let best = null, bd = 1e9;
  for (const a of tp(ta).edge) for (const b of tp(tb).edge) { const d = km(a, b); if (d < bd) { bd = d; best = [a, b]; } }
  const p = best ? d3.geoInterpolate(best[0], best[1])(0.5) : TERR[tb].c;
  w.mk = { k: w.a + w.b, p }; return p;
}
function onUnitTap(key) {
  if (uMode) { // tapping a unit while choosing a destination: go to where it stands
    const ids = key[0] === 'c' ? key.slice(1).split(',').map(Number) : [+key];
    const u = unitById(ids[0]); if (u) modeTap([u.lon, u.lat], null);
    return;
  }
  if (key[0] === 'c') {
    const us = key.slice(1).split(',').map(Number).map(unitById).filter(Boolean);
    if (!us.length) return;
    let spreadPx = 0; const ps = us.map(u => MAP_PROJ([u.lon, u.lat]));
    ps.forEach(a => ps.forEach(b => { spreadPx = Math.max(spreadPx, Math.hypot(a[0] - b[0], a[1] - b[1]) * curK); }));
    const spreadMap = spreadPx / curK, newK = Math.min(40, Math.max(curK * 3, 2.6, 60 / Math.max(0.01, spreadMap)));
    const cx = ps.reduce((s, p) => s + p[0], 0) / ps.length, cy = ps.reduce((s, p) => s + p[1], 0) / ps.length;
    if (spreadMap * newK >= 45 && newK > curK * 1.2) zoomToMapPt([cx, cy], newK); // zooming in separates them
    else if (us.length <= 14) { fanIds = us.map(u => u.id); fanK = curK; drawUnits(); } // too close together: fan them out
    else { ulistIds = us.map(u => u.id); selUnit = null; openTab('ulist'); }
    return;
  }
  selectUnit(+key);
}
function selectUnit(id, zoomIn) {
  const u = unitById(id); if (!u) return;
  selUnit = id; selected = null; recolor(); unitsDirty = true;
  openTab('unit'); const b = $('#sheet-body'); if (b) b.scrollTop = 0;
  drawUnits();
  setTimeout(() => focusUnit(u, zoomIn), 30);
}
function zoomToMapPt(p, k) {
  const [vx0, vy0, vx1, vy1] = visibleRect();
  const tr = d3.zoomIdentity.translate((vx0 + vx1) / 2, (vy0 + vy1) / 2).scale(k).translate(-p[0], -p[1]);
  svg.transition().duration(500).call(zoom.transform, tr);
}
// keep the selected unit in the part of the map that the panel doesn't cover
function focusUnit(u, zoomIn) {
  if (!u || !S.units.includes(u)) return;
  const p = MAP_PROJ([u.lon, u.lat]); if (!p) return;
  const s = [curT.x + curT.k * p[0], curT.y + curT.k * p[1]];
  const [vx0, vy0, vx1, vy1] = visibleRect(), m = 36;
  if (zoomIn || s[0] < vx0 + m || s[0] > vx1 - m || s[1] < vy0 + m || s[1] > vy1 - m) zoomToMapPt(p, zoomIn ? Math.max(curK, zoomIn) : curK);
}
/* ---- choosing a destination / target on the map ---- */
const MODE_TXT = { move: 'הקש על היעד במפה', attack: 'הקש על המדינה לתקוף', strike: 'הקש על מדינה לתקיפה אווירית', missile: 'הקש על מדינה למטח טילים' };
function setMode(kind, uid) {
  const u = unitById(uid); if (!u) return;
  uMode = { kind, uid };
  $('#mv-txt').textContent = uName(u) + ': ' + MODE_TXT[kind];
  $('#mvbar').classList.add('on'); document.body.classList.add('mv');
  // close the panel but keep the unit selected, so the whole map is free for choosing
  tab = null; $('#sheet').classList.remove('open');
  document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('on'));
  unitsDirty = true;
}
function endMode() { uMode = null; $('#mvbar').classList.remove('on'); document.body.classList.remove('mv'); unitsDirty = true; }
function modeTap(p, tid) {
  if (!uMode || !p) return;
  const u = unitById(uMode.uid); if (!u) { endMode(); return; }
  const kind = uMode.kind;
  if (kind === 'strike' || kind === 'missile') {
    const o = tid ? S.owner[tid] : ownerAt(p[0], p[1]);
    if (!o || o === S.player || !S.c[o] || !S.c[o].alive) { toast('בחר מדינה זרה', true); return; }
    endMode(); unitStrike(u, o, kind === 'strike' ? 'air' : 'mis'); return;
  }
  let dest = p;
  if (kind === 'attack') {
    const o = tid ? S.owner[tid] : ownerAt(p[0], p[1]);
    if (!o || o === S.player) { toast('בחר מדינה זרה', true); return; }
    if (domOf(u) !== 'sea') dest = nearIn(o, [u.lon, u.lat]) || p;
  }
  orderTo(u, dest, kind === 'attack' ? 'atk' : 'move');
}
function orderTo(u, dest, mode) {
  const r = planMove(u, dest, mode);
  if (r.err) { toast(r.err, true); return false; }
  endMode();
  const go = () => { commitMove(u, r); save(); if (u.o === S.player) selectUnit(u.id); };
  if (r.needWar) confirmWar(r.needWar, go, uName(u));
  else go();
  return true;
}
function unitStrike(u, o, kind) {
  const inW = atWar(o, S.player);
  if (inW) { strike(o, kind, u.id); return; }
  const e = strikeFx(o, kind, false);
  modal({ title: (kind === 'air' ? 'תקיפה אווירית' : 'מטח טילים') + ' על ' + esc(nm(o)), cls: 'danger', html: '<p>אנחנו לא במלחמה עם ' + esc(nm(o)) + '. תקיפה בלי מלחמה תרגיז את העולם, ו' + esc(nm(o)) + ' עלולה להכריז עלינו מלחמה.</p><div class="box">צפוי: ' + fxLine(e) + '</div>',
    buttons: [{ label: 'תקוף', cls: 'danger', fn: () => strike(o, kind, u.id) }, { label: 'ביטול' }] });
}

/* ================= animations: strikes, explosions, battles ================= */
// one canvas over the map; effects live in map coordinates (lon/lat) so they follow panning and zooming.
// Nothing is drawn while no effect is running, and battle effects only appear while the clock runs.
let fxCv = null, fxCx = null, fxDpr = 1, FXL = [], fxDirty = false, fxHold = 0, sitesT = 0, SITES = [], scorchDirty = true, gScorch = null, hitUntil = 0;
const HIT = new Map(), FLT = new Map(), FX_MAX = 80;
let FXMODE = (() => {
  try { const v = localStorage.getItem('world2026_fx'); if (v === 'full' || v === 'low' || v === 'off') return v; } catch (e) { /* no storage */ }
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'low' : 'full'; } catch (e) { return 'full'; }
})();
function setFxMode(v) {
  FXMODE = v; try { localStorage.setItem('world2026_fx', v); } catch (e) { /* no storage */ }
  FXL = v === 'off' ? [] : v === 'low' ? FXL.filter(f => f.one) : FXL; fxDirty = true;
}
function initFx() {
  if (fxCv) fxCv.remove();
  fxCv = document.createElement('canvas'); fxCv.id = 'fxcv'; fxCv.setAttribute('aria-hidden', 'true');
  $('#map').appendChild(fxCv);
  fxDpr = Math.min(2, window.devicePixelRatio || 1);
  fxCv.width = Math.round(W * fxDpr); fxCv.height = Math.round(H * fxDpr);
  fxCx = fxCv.getContext('2d'); fxDirty = true;
}
const fxZ = () => clamp(0.8 + Math.log2(Math.max(1, curK)) * 0.11, 0.8, 1.45);
// add an effect; ambient (battle) effects are dropped when there are already many, one-shot strike effects never are
function fxAdd(e) {
  if (FXMODE === 'off' || !fxCx) return null;
  if (!e.one && (FXMODE !== 'full' || FXL.length > FX_MAX * 0.7)) return null;
  if (FXL.length > FX_MAX * 1.5) { const i = FXL.findIndex(f => !f.one); FXL.splice(i >= 0 ? i : 0, 1); }
  e.t0 = performance.now() + (e.delay || 0);
  FXL.push(e); return e;
}
const jit = s => [(R() - 0.5) * 2 * s, (R() - 0.5) * 2 * s];
const fxBoom = (p, r, o) => fxAdd(Object.assign({ k: 'boom', p, r, dur: 700 + r * 20, sm: r > 7 }, o || {}));
function fxNum(p, n, o) { if (n < 0.5) return; fxAdd(Object.assign({ k: 'num', p, txt: '−' + Math.round(n).toLocaleString('en-US'), dur: 1900, col: '#ff6b6b' }, o || {})); }
function fxPos(e, p) { const s = toScreen(p || e.p); return s ? [s[0] + (e.o ? e.o[0] : 0), s[1] + (e.o ? e.o[1] : 0)] : null; }
// where a strike is launched from: the unit itself, the nearest unit that can do it, or the nearest part of the country
function launchPt(owner, kind, tgt, su) {
  if (su) return [su.lon, su.lat];
  const mt = mainTid(owner), home = mt && TERR[mt] ? TERR[mt].c : [0, 0];
  const ref = nearIn(tgt, home) || home;
  const us = (S.units || []).filter(u => u.o === owner && (kind === 'air' ? (u.m.air || 0) >= 1 || (u.m.carriers || 0) >= 1 : (u.m.msl || 0) >= 1));
  if (us.length) { const u = us.sort((a, b) => km([a.lon, a.lat], ref) - km([b.lon, b.lat], ref))[0]; return [u.lon, u.lat]; }
  return nearIn(owner, ref) || home;
}
// what gets hit: enemy units in their own land if any, otherwise a place inside the country near the launcher
function targetPt(o, lp) {
  const eu = (S.units || []).filter(u => u.o === o && u.at === o && domOf(u) !== 'sea');
  if (eu.length) { const u = eu.sort((a, b) => km([a.lon, a.lat], lp) - km([b.lon, b.lat], lp))[0]; return [u.lon, u.lat]; }
  const pts = []; tidsOf(o).forEach(t => tp(t).in.forEach(p => pts.push(p)));
  if (!pts.length) return TERR[mainTid(o)] ? TERR[mainTid(o)].c : lp;
  pts.sort((a, b) => km(a, lp) - km(b, lp));
  return pick(pts.slice(0, Math.min(6, pts.length)));
}
// the main city: the point of the main territory closest to its centre
function nukePt(o) { const t = mainTid(o); if (!t) return [0, 0]; const c = TERR[t].c; return tp(t).in.slice().sort((a, b) => km(a, c) - km(b, c))[0] || c; }
// bring a strike into view (keeps the zoom when possible) when it would happen off screen
function fxReveal(a, b) {
  if (!svg || uMode || !MAP_PROJ) return;
  const [vx0, vy0, vx1, vy1] = visibleRect(), sb = toScreen(b), m = 30;
  if (sb && sb[0] > vx0 + m && sb[0] < vx1 - m && sb[1] > vy0 + m && sb[1] < vy1 - m) return;
  const pa = MAP_PROJ(a), pb = MAP_PROJ(b); if (!pa || !pb) return;
  const dx = Math.abs(pa[0] - pb[0]), dy = Math.abs(pa[1] - pb[1]);
  const k = clamp(Math.min(curK, 0.7 * (vx1 - vx0) / Math.max(1, dx), 0.7 * (vy1 - vy0) / Math.max(1, dy)), 1.2, 40);
  zoomToMapPt([(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], k);
}
function holdFor(ms) { fxHold = Math.max(fxHold, performance.now() + ms); }
// an air strike or missile salvo, ours or the enemy's, ending with the result card
function fxStrike(kind, lp, tp_, used, r) {
  const show = r.by === S.player || r.at === S.player;
  const card = d => { if (show) setTimeout(() => showCard(r), d); };
  if (FXMODE === 'off' || !fxCx) { card(0); return; }
  if (r.by === S.player || performance.now() - (fxStrike.pan || 0) > 25000) { fxStrike.pan = performance.now(); fxReveal(lp, tp_); }
  const z = fxZ(), kd = killed(r.cas), en = r.by !== S.player;
  if (FXMODE === 'low') { fxBoom(tp_, 14 * z, { one: 1, delay: 450 }); fxNum(tp_, kd, { one: 1, delay: 650 }); card(900); holdFor(1200); return; }
  const delay = 560; // let the camera arrive first
  const a = toScreen(lp), b = toScreen(tp_), dpx = a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : 300;
  if (kind === 'air') {
    const nj = clamp(Math.round(used / 12), 2, 4), leg = clamp(dpx / 260, 0.7, 1.6) * 1000, dur = leg * 2 / 0.9;
    for (let i = 0; i < nj; i++) {
      const last = i === nj - 1;
      fxAdd({ k: 'jet', one: 1, p0: lp, p1: tp_, dur, delay: delay + i * 110, o: [(i % 2 ? 1 : -1) * Math.ceil(i / 2) * 9, Math.ceil(i / 2) * 7], en,
        drop: () => { for (let j = 0; j < 3; j++) fxBoom(tp_, (8 + R() * 5) * z, { one: 1, o: jit(16 * z), delay: j * 120 }); if (last) fxNum(tp_, kd, { one: 1, delay: 300 }); } });
    }
    const hit = delay + (nj - 1) * 110 + dur * 0.5;
    card(hit + 900); holdFor(Math.min(2500, hit + 1000));
  } else {
    const n = clamp(Math.round(used / 10), 2, 6), dur = clamp(dpx / 330, 0.8, 1.8) * 1000;
    for (let i = 0; i < n; i++) {
      const last = i === n - 1, o2 = jit(14 * z);
      fxAdd({ k: 'arc', one: 1, p0: lp, p1: tp_, o0: jit(6), o1: o2, h: 0.32 + R() * 0.12, dur, delay: delay + i * 150, w: 2.4, trail: 1, col: en ? '#ff8a8a' : '#ffe9a8',
        end: () => { fxBoom(tp_, 12 * z, { one: 1, o: o2 }); if (last) fxNum(tp_, kd, { one: 1, o: [0, -8] }); } });
    }
    const hit = delay + (n - 1) * 150 + dur;
    card(hit + 600); holdFor(Math.min(2500, hit + 800));
  }
}
function fxNuke(lp, pt, r) {
  const show = r.by === S.player || r.at === S.player;
  const card = d => { if (show) setTimeout(() => showCard(r), d); };
  if (FXMODE === 'off' || !fxCx) { card(0); return; }
  fxReveal(lp, pt);
  const boom = () => {
    fxAdd({ k: 'nuke', one: 1, p: pt, dur: 5200 });
    fxNum(pt, killed(r.cas), { one: 1, delay: 900, dur: 2600, big: 1 });
    if (FXMODE === 'full') {
      const f = $('#flash'); if (f) { f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
      const m = $('#map'); if (m) { m.classList.remove('shake'); void m.offsetWidth; m.classList.add('shake'); }
    }
  };
  if (FXMODE === 'low') { boom(); card(1500); holdFor(2000); return; }
  const a = toScreen(lp), b = toScreen(pt), dpx = a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : 300, dur = clamp(dpx / 300, 0.9, 1.8) * 1000;
  fxAdd({ k: 'arc', one: 1, p0: lp, p1: pt, h: 0.45, dur, delay: 560, w: 3.4, trail: 1, col: '#ffffff', end: boom });
  card(560 + dur + 2200); holdFor(560 + dur + 3200);
}
// a unit took losses: its icon shakes and flashes red (at most every 1.2 s)
function markHit(u) {
  if (FXMODE !== 'full') return;
  const now = performance.now(), h = HIT.get(u.id) || 0;
  if (now - h < 1200) return;
  HIT.set(u.id, now + 450); hitUntil = now + 450;
}
// a running count of the dead floats up from the fighting (not more than every ~1.5 s per war)
function battleFloat(w, n) {
  if (FXMODE !== 'full' || !(n > 0) || !MAP_PROJ) return;
  const now = performance.now(), f = FLT.get(w.id) || { t: 0, n: 0 };
  f.n += n; FLT.set(w.id, f);
  const lead = S.player && (w.a === S.player || w.b === S.player);
  if (now - f.t < (lead ? 1500 : 2600) || f.n < 1) return;
  let p = null;
  if (lead) {
    const E = enemyLeaderFor(w, S.player);
    const u = S.units.find(x => x.o === S.player && x.at === E && domOf(x) === 'land') || S.units.find(x => x.o === E && x.at === S.player && domOf(x) === 'land');
    p = u && [u.lon, u.lat];
  } else if (!involvesPlayer(w)) p = warMark(w);
  f.t = now;
  if (!p) return;
  const s = toScreen(p);
  if (s && s[0] > 0 && s[1] > 0 && s[0] < W && s[1] < H) fxNum(p, f.n, { o: [jit(10)[0], -14], col: lead ? '#ff9d9d' : '#ffc58a', sm: 1 });
  f.n = 0;
}
// places where fighting is going on right now (only what is on screen)
function fxSites() {
  SITES = [];
  if (!S.units) return;
  const onScr = p => { const q = toScreen(p); return q && q[0] > -20 && q[1] > -20 && q[0] < W + 20 && q[1] < H + 20; };
  for (const u of S.units) {
    if (SITES.length >= 14) break;
    if (u.dest) continue;
    const p = [u.lon, u.lat];
    if (!onScr(p) || !uFighting(u)) continue;
    if (domOf(u) === 'sea') {
      // where a fleet shoots at: the nearest enemy coast (remembered for a few seconds)
      let c = SHIPT.get(u.id);
      if (!c || c.lon !== u.lon || c.lat !== u.lat || S.day - c.d > 5) {
        const en = warsOf(u.o).filter(w => w.pause === 0).map(w => enemyLeaderFor(w, u.o)).find(x => S.c[x] && S.c[x].alive && distToC(x, p) < 600);
        let best = null, bd = 1e9; if (en) for (const t of tidsOf(en)) for (const q of tp(t).edge) { const d = km(q, p); if (d < bd) { bd = d; best = q; } }
        c = { lon: u.lon, lat: u.lat, d: S.day, tgt: best }; SHIPT.set(u.id, c);
      }
      if (c.tgt) SITES.push({ p, ship: 1, tgt: c.tgt, en: u.o !== S.player });
    } else {
      let foe = null, fd = 1e9;
      for (const e of S.units) { if (e.o === u.o || e.at !== u.at || domOf(e) !== 'land') continue; const d = Math.abs(e.lon - u.lon) + Math.abs(e.lat - u.lat); if (d < fd) { fd = d; foe = e; } }
      SITES.push({ p, art: u.t === 'art' || (u.m.art || 0) >= 20, foe: foe ? [foe.lon, foe.lat] : null, en: u.o !== S.player });
    }
  }
  S.wars.forEach(w => { if (SITES.length >= 14 || w.pause > 0 || involvesPlayer(w)) return; const mk = warMark(w); if (mk && onScr(mk)) SITES.push({ p: mk, ai: 1 }); });
}
const SHIPT = new Map();
function fxAmbient(dt) {
  const z = fxZ(), sp = clamp(0.75 + S.speed * 0.15, 0.9, 2) * dt;
  for (const s of SITES) {
    const rate = s.ai ? 0.8 : 1.5;
    if (R() < rate * sp) fxBoom(s.p, (s.ai ? 4 : 5) * z + R() * 3, { o: jit((s.ai ? 9 : 13) * z), dur: 420 + R() * 300, sm: R() < 0.35 });
    if (R() < (s.ai ? 1.2 : 2.6) * sp) fxAdd({ k: 'spark', p: s.p, o: jit(12 * z), a: R() * 6.283, dur: 230, en: s.en });
    if (s.art && R() < 0.55 * sp) { const o1 = s.foe ? jit(8) : jit(30 * z), t = s.foe || s.p; fxAdd({ k: 'arc', p0: s.p, p1: t, o0: [0, -4], o1, h: 0.5, dur: 650, w: 1.6, col: '#ffd27a', end: () => fxBoom(t, 6 * z, { o: o1, dur: 500 }) }); }
    if (s.ship && R() < 0.5 * sp) { const o1 = jit(8); fxAdd({ k: 'arc', p0: s.p, p1: s.tgt, o1, h: 0.25, dur: 700, w: 1.6, col: '#bfe4ff', end: () => fxBoom(s.tgt, 6 * z, { o: o1, dur: 520 }) }); }
  }
}
function fxFrame(t, dt) {
  if (!fxCx || !S || !S.player) return;
  const run = S.speed > 0 && !modalOpen() && !S.over;
  if (run && FXMODE === 'full') { if (t - sitesT > 450) { sitesT = t; fxSites(); } if (SITES.length) fxAmbient(dt); }
  const trails = run && FXMODE === 'full' && S.units && S.units.some(u => u.dest);
  if (!FXL.length && !trails) {
    if (fxDirty) { fxCx.setTransform(1, 0, 0, 1, 0, 0); fxCx.clearRect(0, 0, fxCv.width, fxCv.height); fxDirty = false; }
    return;
  }
  fxDraw(t, trails); fxDirty = true;
}
const circ = (c, s, r) => { c.beginPath(); c.arc(s[0], s[1], Math.max(0.1, r), 0, 6.2832); c.fill(); };
const ring = (c, s, r) => { c.beginPath(); c.arc(s[0], s[1], Math.max(0.1, r), 0, 6.2832); c.stroke(); };
function qPt(a, m, b, u) { const v = 1 - u; return [v * v * a[0] + 2 * v * u * m[0] + u * u * b[0], v * v * a[1] + 2 * v * u * m[1] + u * u * b[1]]; }
function fxDraw(now, trails) {
  const c = fxCx, z = fxZ();
  c.setTransform(fxDpr, 0, 0, fxDpr, 0, 0); c.clearRect(0, 0, W, H);
  c.lineCap = 'round'; c.lineJoin = 'round'; c.direction = 'ltr';
  if (trails) {
    // a short fading trail behind units on the move
    c.lineWidth = 3;
    for (const u of S.units) {
      if (!u.dest || u.px == null) continue;
      const a = toScreen([u.px, u.py]), b = toScreen(uPos(u)); if (!a || !b) continue;
      const d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d < 3 || d > 400) continue;
      const g = c.createLinearGradient(a[0], a[1], b[0], b[1]), col = u.o === S.player ? '245,179,1' : '255,107,107';
      g.addColorStop(0, 'rgba(' + col + ',0)'); g.addColorStop(1, 'rgba(' + col + ',0.55)');
      c.strokeStyle = g; c.globalAlpha = 1; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
    }
  }
  // effects added by callbacks during this pass land in the new FXL
  const list = FXL, keep = []; FXL = [];
  for (const e of list) {
    if (now < e.t0) { keep.push(e); continue; }
    const k = (now - e.t0) / e.dur;
    if (k >= 1) { if (e.drop && !e.dropped) { e.dropped = 1; e.drop(); } if (e.end && !e.ended) { e.ended = 1; e.end(); } continue; }
    keep.push(e);
    c.globalAlpha = 1;
    switch (e.k) {
      case 'boom': {
        const s = fxPos(e); if (!s) break; const r = e.r;
        if (k < 0.3) { c.globalAlpha = 1 - k / 0.3; c.fillStyle = '#fff4c4'; circ(c, s, r * (0.55 + k * 1.8)); c.fillStyle = '#ff8c2a'; circ(c, s, r * (0.35 + k)); }
        c.globalAlpha = 0.9 * (1 - k); c.strokeStyle = '#ffc56b'; c.lineWidth = 1.6; ring(c, s, r * (0.4 + 1.6 * k));
        if (e.sm) { c.globalAlpha = 0.5 * (1 - k); c.fillStyle = '#5c6068'; for (let j = -1; j <= 1; j++) circ(c, [s[0] + j * r * 0.45, s[1] - r * (0.3 + 0.9 * k) - Math.abs(j) * r * 0.2], r * (0.3 + 0.45 * k)); }
        break;
      }
      case 'spark': {
        const s = fxPos(e); if (!s) break;
        c.globalAlpha = 1 - k; c.strokeStyle = e.en ? '#ffb3b3' : '#fff0a8'; c.lineWidth = 1.3;
        for (let j = 0; j < 3; j++) { const a = e.a + j * 2.1, l0 = 2 + 9 * k, l1 = l0 + 4; c.beginPath(); c.moveTo(s[0] + Math.cos(a) * l0, s[1] + Math.sin(a) * l0); c.lineTo(s[0] + Math.cos(a) * l1, s[1] + Math.sin(a) * l1); c.stroke(); }
        break;
      }
      case 'arc': {
        let a = toScreen(e.p0), b = toScreen(e.p1); if (!a || !b) break;
        if (e.o0) a = [a[0] + e.o0[0], a[1] + e.o0[1]];
        if (e.o1) b = [b[0] + e.o1[0], b[1] + e.o1[1]];
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - Math.max(18, d * e.h)];
        const u = 0.6 * k + 0.4 * k * k; // speeds up on the way down
        if (e.trail) {
          const n = 9, u0 = Math.max(0, u - 0.35);
          c.lineWidth = e.w * 0.9; c.strokeStyle = '#d9dde3';
          let prev = qPt(a, m, b, u0);
          for (let j = 1; j <= n; j++) { const q = qPt(a, m, b, u0 + (u - u0) * j / n); c.globalAlpha = 0.5 * j / n; c.beginPath(); c.moveTo(prev[0], prev[1]); c.lineTo(q[0], q[1]); c.stroke(); prev = q; }
        }
        const h = qPt(a, m, b, u);
        c.globalAlpha = 0.35; c.fillStyle = e.col; circ(c, h, e.w * 2.2);
        c.globalAlpha = 1; circ(c, h, e.w);
        break;
      }
      case 'jet': {
        let a = toScreen(e.p0), b = toScreen(e.p1); if (!a || !b) break;
        a = [a[0] + e.o[0], a[1] + e.o[1]]; b = [b[0] + e.o[0] * 0.6, b[1] + e.o[1] * 0.6];
        const d0 = Math.atan2(b[1] - a[1], b[0] - a[0]);
        let p, dir;
        if (k < 0.45) { const f = k / 0.45; p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; dir = d0; }
        else if (k < 0.55) {
          const f = (k - 0.45) / 0.1, s2 = Math.sin(f * Math.PI) * 10;
          dir = d0 + f * Math.PI; p = [b[0] + Math.cos(d0 + Math.PI / 2) * s2, b[1] + Math.sin(d0 + Math.PI / 2) * s2];
          if (k >= 0.5 && e.drop && !e.dropped) { e.dropped = 1; e.drop(); }
        } else { const f = (k - 0.55) / 0.45; p = [b[0] + (a[0] - b[0]) * f, b[1] + (a[1] - b[1]) * f]; dir = d0 + Math.PI; }
        c.globalAlpha = k > 0.9 ? (1 - k) / 0.1 : 1;
        c.save(); c.translate(p[0], p[1]); c.rotate(dir); c.scale(z, z);
        c.fillStyle = e.en ? '#ffb0b0' : '#eef3f8'; c.strokeStyle = '#0b0f14'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(9, 0); c.lineTo(1, -2); c.lineTo(-2, -8); c.lineTo(-4, -8); c.lineTo(-3, -2); c.lineTo(-7, -2.5); c.lineTo(-8, -4.5); c.lineTo(-9, -4.5); c.lineTo(-8, 0);
        c.lineTo(-9, 4.5); c.lineTo(-8, 4.5); c.lineTo(-7, 2.5); c.lineTo(-3, 2); c.lineTo(-4, 8); c.lineTo(-2, 8); c.lineTo(1, 2); c.closePath(); c.fill(); c.stroke();
        c.restore();
        break;
      }
      case 'nuke': {
        const s = fxPos(e); if (!s) break; const Rr = 46 * z;
        if (k < 0.1) { c.globalAlpha = 1 - k / 0.1; c.fillStyle = '#ffffff'; circ(c, s, Rr * (0.6 + k * 8)); }
        if (k < 0.55) {
          const f = 1 - k / 0.55;
          c.globalAlpha = f * 0.8; c.strokeStyle = '#ffe1a8'; c.lineWidth = 3 * (1 - k) + 1; ring(c, s, Rr * (0.3 + 4.5 * k));
          c.globalAlpha = f * 0.3; c.lineWidth = 8; ring(c, s, Rr * (0.2 + 4.2 * k));
        }
        const rise = Math.min(1, k / 0.3), fade = k > 0.65 ? 1 - (k - 0.65) / 0.35 : 1, top = [s[0], s[1] - Rr * 1.15 * rise];
        c.globalAlpha = 0.9 * fade; c.fillStyle = '#7a5a48';
        c.beginPath(); c.moveTo(s[0] - Rr * 0.12, s[1]); c.lineTo(top[0] - Rr * 0.08, top[1]); c.lineTo(top[0] + Rr * 0.08, top[1]); c.lineTo(s[0] + Rr * 0.12, s[1]); c.closePath(); c.fill();
        c.fillStyle = '#8f7f76'; c.save(); c.translate(s[0], s[1]); c.scale(1, 0.35); circ(c, [0, 0], Rr * (0.35 + 0.4 * rise)); c.restore();
        const cr = Rr * (0.22 + 0.3 * rise);
        c.fillStyle = '#a3633b';
        [[-1, 0.2], [1, 0.2], [0, -0.35], [-0.55, -0.15], [0.55, -0.15]].forEach(([dx, dy]) => circ(c, [top[0] + dx * cr * 0.95, top[1] + dy * cr], cr * 0.75));
        c.fillStyle = k < 0.3 ? '#ffb347' : '#c9805a'; circ(c, [top[0], top[1] - cr * 0.1], cr * 0.6);
        break;
      }
      case 'num': {
        const s = fxPos(e); if (!s) break;
        const fs = (e.big ? 20 : e.sm ? 11.5 : 14) * z;
        c.globalAlpha = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
        c.font = '800 ' + fs.toFixed(1) + 'px "Segoe UI",Arial,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.lineWidth = 3.5; c.strokeStyle = '#0b0f14'; const y = s[1] - 16 - 30 * k;
        c.strokeText(e.txt, s[0], y); c.fillStyle = e.col; c.fillText(e.txt, s[0], y);
        break;
      }
    }
  }
  c.globalAlpha = 1;
  FXL = keep.concat(FXL);
}
// lasting burn marks where nuclear weapons hit (drawn on the map itself, so they scale with it)
function drawScorch() {
  if (!gScorch || !MAP_PROJ || !S) return;
  scorchDirty = false;
  gScorch.selectAll('*').remove();
  (S.scorch || []).filter(x => x.d > S.day).forEach(x => {
    const p = MAP_PROJ(x.p), q = MAP_PROJ([x.p[0] + 0.6, x.p[1]]); if (!p || !q) return;
    const r = Math.max(1.5, Math.abs(q[0] - p[0]));
    gScorch.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', r * 1.7).attr('fill', 'url(#scorchG)');
    gScorch.append('circle').attr('cx', p[0]).attr('cy', p[1]).attr('r', r * 0.4).attr('fill', '#1a0d08').attr('opacity', 0.85);
  });
}
/* ---- result card after a strike ---- */
const plainT = t => String(t).replace(/[⁦⁩]/g, '');
function cardHtml(r) {
  const mine = r.by === S.player, C = r.cas;
  const tl = r.k === 'nuke' ? (mine ? '☢ תוצאות התקיפה הגרעינית' : '☢ פיצוץ גרעיני') : mine ? 'תוצאות התקיפה' : r.at === S.player ? 'תקפו אותנו!' : 'תקיפה';
  let h = '<div class="rc-h"><b>' + tl + '</b><button class="ic" data-act="rclose" aria-label="סגור">✕</button></div>';
  h += '<div class="rc-s">' + esc(KIND_HE[r.k]) + (mine ? ' על ' + esc(nm(r.at)) : ' של ' + esc(nm(r.by)) + (r.at === S.player ? '' : ' על ' + esc(nm(r.at)))) +
    (r.unit ? ' · ' + esc(r.unit) : '') + (mine && r.k !== 'nuke' && !r.war ? ' · בלי הכרזת מלחמה' : '') + ' · ' + dayHtml(r.d) + '</div>';
  h += '<div class="rgrid"><div><small>חיילים הרוגים</small>' + num(C.sk) + '</div><div><small>חיילים פצועים</small>' + num(C.sw) + '</div>' +
    '<div><small>אזרחים הרוגים</small><span class="' + (C.ck >= 1 ? 'bad' : '') + '">' + num(C.ck) + '</span></div><div><small>אזרחים פצועים</small>' + num(C.cw) + '</div></div>';
  const eq = eqTxt(C.eq);
  h += '<div class="rc-l"><b>' + (mine || r.at !== S.player ? 'הושמדו:' : 'נפגעו אצלנו:') + '</b> ' + (eq ? isoNums(plainT(eq)) : 'בסיסים ותשתיות, בלי ציוד משמעותי') + '</div>';
  const o = r.own || {}, bits = [];
  if (r.k === 'mis' && o.mu) bits.push((mine ? 'שוגרו ' : 'הם שיגרו ') + num(o.mu) + ' טילים');
  if (r.k === 'air' && r.used) bits.push((mine ? 'יצאו לתקיפה ' : 'תקפו ') + num(r.used) + ' מטוסים');
  if (o.eq && o.eq.air) bits.push(mine ? '<span class="bad">נפלו ' + num(o.eq.air) + ' מטוסים שלנו</span>' : 'יירטנו ' + num(o.eq.air) + ' מטוסים שלהם');
  if (mine && o.sp) bits.push('עלות ' + money(o.sp));
  if (C.dm >= 0.001) bits.push((r.at === S.player ? 'נזק כלכלי לנו ' : 'נזק כלכלי להם ') + money(C.dm));
  if (bits.length) h += '<div class="rc-l">' + bits.join(' · ') + '</div>';
  if (r.fx && r.fx.length) h += '<div class="chips">' + r.fx.map(t => chip(isoNums(esc(plainT(t))), /[−-]\d/.test(plainT(t)) ? 'bad' : 'ok')).join('') + '</div>';
  if (r.retal) h += '<div class="warnbox">' + esc(nm(r.at)) + ' הגיבה והכריזה עלינו מלחמה!</div>';
  if (r.sanc) h += '<div class="rc-l bad">' + esc(sancTxt(r.sanc)) + '</div>';
  h += '<button class="lnk" data-act="stats">כל הסטטיסטיקות ←</button>';
  return h;
}
function showCard(r) {
  const el = $('#rcard'); if (!el || !S || !S.player) return;
  el.innerHTML = cardHtml(r); el.className = 'on' + (r.at === S.player ? ' bad' : '');
  document.body.classList.add('rc');
  document.documentElement.style.setProperty('--rcH', el.offsetHeight + 'px');
  clearTimeout(showCard.t); showCard.t = setTimeout(hideCard, r.k === 'nuke' ? 16000 : 11000);
}
function hideCard() { const el = $('#rcard'); if (el) el.className = ''; document.body.classList.remove('rc'); clearTimeout(showCard.t); }

/* ================= UI ================= */
let tab = null;
function renderAll() {
  if (!S || !S.player) return;
  syncAllUnits();
  renderTop(); recolor(); if (tab) renderSheet();
  drawUnits();
}
const setH = (sel, h, cls) => { const e = $(sel); if (!e) return; if (e.__h !== h) { e.innerHTML = h; e.__h = h; } if (cls != null && e.className !== cls) e.className = cls; };
function renderTop() {
  const c = P(); if (!c) return;
  const ap = c.approval, rp = S.p.rep;
  setH('#t-date', dayHtml(S.day));
  setH('#t-money', money(S.p.treasury, true), 'v' + (S.p.treasury < 0 ? ' bad' : ''));
  setH('#t-ap', pct(ap), 'v ' + (ap < 30 ? 'bad' : ap < 45 ? 'warn' : 'ok'));
  setH('#t-rep', num(rp), 'v ' + (rp < 25 ? 'bad' : rp < 45 ? 'warn' : 'ok'));
  setH('#t-army', num(power(c)));
  setH('#t-nuke', num(c.nukes));
  setH('#t-score', num(score()));
  setH('#t-name', esc(c.he));
  document.querySelectorAll('#speed button').forEach(b => b.classList.toggle('on', +b.dataset.v === S.speed));
  const n = S.wars.filter(involvesPlayer).length;
  const b = $('#tabwars'); if (b && b.dataset.badge !== String(n || '')) b.dataset.badge = n || '';
  const bh = $('#tabhome'); if (bh) { const v = S.p.proj.length ? String(S.p.proj.length) : ''; if (bh.dataset.badge !== v) bh.dataset.badge = v; }
}
function openTab(t) {
  tab = (tab === t && t !== 'country' && t !== 'unit' && t !== 'ulist' && t !== 'stats') ? null : t;
  if (tab !== 'unit' && selUnit) { selUnit = null; unitsDirty = true; }
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $('#sheet').classList.toggle('open', !!tab);
  if (tab) renderSheet();
}
function renderSheet() {
  const el = $('#sheet-body'); if (!el) return;
  const fn = { country: viewCountry, eco: viewEco, home: viewHome, mil: viewMil, wars: viewWars, news: viewNews, unit: viewUnit, ulist: viewUnitList, stats: viewStats }[tab];
  const h = fn ? fn() : '';
  if (el.__h !== h) { el.innerHTML = h; el.__h = h; }
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
    '<div><small>חיילים בסדיר</small>' + troopsTxt(c.inv.troops) + '</div>' +
    '<div><small>טנקים · מטוסי קרב</small>' + cnt(c.inv.tanks) + ' · ' + cnt(c.inv.air) + '</div>' +
    '<div><small>ספינות · צוללות</small>' + cnt(c.inv.ships) + ' · ' + cnt(c.inv.subs) + '</div>' +
    '<div><small>תקציב ביטחון</small>' + money(c.def) + '</div>' +
    '<div><small>ראשי נפץ גרעיניים</small>' + num(c.nukes) + '</div>' +
    '<div><small>משטר</small>' + GOV_HE[c.gov] + '</div>' +
    '<div><small>תמיכת העם</small>' + pct(c.approval) + '</div>' +
    '</div>' + (c.blocs.length ? '<div class="blocs">' + c.blocs.map(b => chip(BLOC_HE[b] || b)).join('') + '</div>' : '');
}
// a button with an effect preview line under the label
function fbtn(act, label, e, cls, dis, extra) {
  const line = e ? fxLine(e) : '';
  return '<button class="b ' + (cls || '') + '" data-act="' + act + '"' + (extra || '') + (dis ? ' disabled' : '') + '>' + label + (line ? '<small class="cost">' + line + '</small>' : '') + '</button>';
}
const cdNote = d => '<small class="cost">אפשר שוב בעוד ' + daysTxt(d) + '</small>';
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
  if (provoked(o)) st.push(chip('תקפה אותך או בעלות בריתך', 'orange'));
  else if (hated(o)) st.push(chip('מבודדת בעולם', 'orange'));
  const ow = warsOf(o).filter(w => !involvesPlayer(w)); if (ow.length) st.push(chip('במלחמה עם ' + ow.map(w => nm(enemyLeaderFor(w, o))).join(', '), 'orange'));
  const d = adjacent(o, S.player) ? 'שכנה (גבול משותף)' : 'מרחק ' + num(dist(o, S.player)) + ' ק״מ';
  h += '<h2>' + esc(c.he) + (c.generated ? ' <small>(נתונים משוערים)</small>' : '') + '</h2><div class="chips">' + st.join('') + '</div>';
  h += relBar(r) + '<p class="sub">' + d + ' · יחס כוחות: ' + (power(P()) >= power(c) ? num(power(P()) / power(c), 1) + ' : 1 לטובתך' : '1 : ' + num(power(c) / power(P()), 1) + ' לטובתם') + '</p>' + statGrid(c);
  if (!war) {
    h += '<h3>דיפלומטיה</h3><div class="btns">';
    const g = giftAmt(), gcd = cdLeft('gift:' + o);
    h += gcd ? '<button class="b" disabled>שלח סיוע הומניטרי' + cdNote(gcd) + '</button>' : fbtn('gift', 'שלח סיוע הומניטרי', { cost: g, rep: giftRep(o), rel: { [o]: giftRel(o) } });
    const pcd = cdLeft('dip:' + o);
    const tog = (type, on, offL, onL, eOn, eOff) => on ? fbtn(type, offL, eOff, '', false) : (pcd ? '<button class="b" disabled>' + onL + cdNote(pcd) + '</button>' : fbtn(type, onL, Object.assign({ note: 'אם יסכימו' }, eOn)));
    h += tog('trade', hasPact(o, S.player, 'trade'), 'בטל הסכם סחר', 'הצע הסכם סחר', { rep: 2, rel: { [o]: 8 } }, { rep: -1, rel: { [o]: -10 } });
    h += tog('nap', hasPact(o, S.player, 'nap'), 'בטל אי-תוקפנות', 'הסכם אי-תוקפנות', { rep: 1, rel: { [o]: 6 } }, { rep: -3, rel: { [o]: -12 } });
    h += tog('alliance', hasPact(o, S.player, 'alliance'), 'בטל ברית', 'בקש ברית צבאית', { rel: { [o]: 12 } }, { rep: -4, rel: { [o]: -20 } });
    const scd = cdLeft('sanc:' + o);
    h += scd ? '<button class="b" disabled>סנקציות' + cdNote(scd) + '</button>' :
      sanctions(S.player, o) ? fbtn('sanction', 'הסר סנקציות', { rel: { [o]: 6 } }) : fbtn('sanction', 'הטל סנקציות', { rep: sancRep(o), rel: { [o]: -20 } });
    h += fbtn('war', 'הכרז מלחמה', warFx(o), 'danger');
    h += '</div>';
    h += strikeSection(o, null);
  } else {
    const w = S.wars.find(x => (x.A.includes(o) && x.B.includes(S.player)) || (x.B.includes(o) && x.A.includes(S.player)));
    h += '<div class="btns"><button class="b" data-act="gotowars">עבור ללשונית מלחמות</button></div>';
    if (w && enemyLeaderFor(w, S.player) === o) h += unitFront(w, o);
    if (w) h += warActions(w, true, o);
  }
  return h;
}
const btn = (act, label, cls, extra) => '<button class="b ' + (cls || '') + '" data-act="' + act + '"' + (extra || '') + '>' + label + '</button>';
function giftAmt() { return Math.max(0.01, Math.min(P().gdp * 0.0025, 4)); }
const giftRel = o => Math.round(clamp(4 + 300 * giftAmt() / S.c[o].gdp, 3, 20));
const giftRep = o => S.c[o].gdp / S.c[o].pop < 5 ? 3 : S.c[o].gdp / S.c[o].pop < 15 ? 2 : 1;
const sancRep = o => justified(o) ? 1 : S.c[o].gdp < P().gdp * 0.2 ? -4 : -1;
const nukeCost = c => Math.max(0.05, c.gdp * 0.004);
function warFx(o) {
  const j = justified(o), nap = hasPact(o, S.player, 'nap');
  return { rep: (j ? -5 : -15) - (nap ? 10 : 0), ap: j ? 2 : -2, rel: { [o]: -100 } };
}
/* ---- strikes (with or without war) ---- */
function strikeRange(o) {
  const me = P(), d = adjacent(S.player, o) ? 0 : dist(S.player, o);
  const air = me.inv.air >= 4 && (d <= AIR_RANGE || me.inv.carriers >= 1);
  const mis = me.mlv > 0 && me.inv.msl >= 5 && d <= MIS_RANGE[me.mlv];
  return { d, air, mis, nuke: me.nukes > 0 && (mis || me.mlv > 0 && d <= MIS_RANGE[me.mlv] || air) };
}
const sortie = () => clamp(Math.round(P().inv.air * 0.08), 4, 120);
const salvo = () => clamp(Math.round(P().inv.msl * 0.1), 5, 200);
const strikeCost = kind => kind === 'air' ? sortie() * 0.004 : salvo() * 0.0006;
function strikeFx(o, kind, inWarNow) {
  if (inWarNow) return { cost: strikeCost(kind) };
  const j = justified(o);
  const e = { cost: strikeCost(kind), rep: kind === 'air' ? (j ? -3 : -10) : (j ? -2 : -8), ap: j || rel(o, S.player) < -50 ? 1 : -2, rel: { [o]: kind === 'air' ? -35 : -30 } };
  e.note = 'סיכוי למלחמה: ' + Math.round(retaliateChance(o) * 100) + '%';
  return e;
}
function retaliateChance(o) {
  const T = S.c[o], me = P();
  let pr = 0.25;
  const ratio = power(T) * proj(o, S.player) / (power(me) + 1);
  if (ratio > 0.5) pr = 0.6; else if (ratio > 0.2) pr = 0.4;
  if (likelyJoiners(o, S.player).length === 0 && alive().some(c => isAlly(c, o) && power(S.c[c]) > power(me))) pr += 0.15;
  if (T.gov === 'authoritarian') pr *= 1.2;
  return clamp(pr, 0.1, 0.85);
}
function strikeSection(o, w) {
  const me = P(), sr = strikeRange(o), inW = !!w;
  let h = '<h3>תקיפות' + (inW ? '' : ' <small>(בלי להכריז מלחמה)</small>') + '</h3><div class="btns">';
  const acd = cdLeft('air:' + o), mcd = cdLeft('mis:' + o);
  if (!sr.air) h += '<button class="b" disabled>תקיפה אווירית<small class="cost">' + (me.inv.air < 4 ? 'אין מספיק מטוסי קרב' : 'מחוץ לטווח המטוסים (' + num(AIR_RANGE) + ' ק״מ; נושאת מטוסים מגיעה לכל מקום)') + '</small></button>';
  else if (acd) h += '<button class="b" disabled>תקיפה אווירית' + cdNote(acd) + '</button>';
  else h += fbtn('air', 'תקיפה אווירית · ' + sortie() + ' מטוסים', strikeFx(o, 'air', inW), inW ? '' : 'danger', false, ' data-o="' + o + '"');
  if (!sr.mis) h += '<button class="b" disabled>מטח טילים<small class="cost">' + (me.mlv === 0 ? 'אין לך תוכנית טילים' : me.inv.msl < 5 ? 'אין מספיק טילים במלאי' : 'מחוץ לטווח הטילים (' + num(MIS_RANGE[me.mlv]) + ' ק״מ)') + '</small></button>';
  else if (mcd) h += '<button class="b" disabled>מטח טילים' + cdNote(mcd) + '</button>';
  else h += fbtn('missile', 'מטח טילים · ' + salvo() + ' טילים', strikeFx(o, 'mis', inW), inW ? '' : 'danger', false, ' data-o="' + o + '"');
  if (me.nukes > 0) h += sr.nuke ? '<button class="b nuke" data-act="nuke" data-o="' + o + '">תקיפה גרעינית<small class="cost">העולם ' + sgn(-50) + ' · העם ' + sgn(-20) + '</small></button>' : '<button class="b" disabled>תקיפה גרעינית<small class="cost">אין אמצעי שיגור בטווח</small></button>';
  h += '</div>';
  if (!inW) h += '<p class="sub">תקיפה בלי מלחמה פוגעת בצבא ובכלכלה שלהם, אבל העולם כועס, בעלות בריתם מתרגזות, אולי יוטלו עליך סנקציות — ו' + esc(nm(o)) + ' עלולה להכריז עליך מלחמה.' + (justified(o) ? ' <b>הם תקפו אותך / מבודדים בעולם — הנזק למוניטין קטן יותר.</b>' : '') + '</p>';
  return h;
}

/* ---- economy ---- */
function viewEco() {
  const c = P(), p = S.p, b = p.budget, bd = budgetDay();
  const sh = sanctionHit(S.player);
  const tr = Object.keys(S.pacts).filter(k => S.pacts[k].trade && k.split('|').includes(S.player)).map(k => nm(k.split('|').find(x => x !== S.player)));
  const sancBy = Object.keys(S.sanc).filter(k => k.endsWith('>' + S.player)).map(k => nm(k.split('>')[0]));
  const debt = p.treasury < 0 ? -p.treasury / c.gdp : 0;
  let h = '<h2>כלכלה</h2><div class="grid">' +
    '<div><small>קופת המדינה</small>' + money(p.treasury) + '</div><div><small>תמ״ג שנתי</small>' + money(c.gdp) + '</div>' +
    '<div><small>מאזן יומי</small><span class="' + (bd.net < 0 ? 'bad' : 'ok') + '">' + money(bd.net) + '</span></div>' +
    '<div><small>מאזן חודשי (צפי)</small><span class="' + (bd.net < 0 ? 'bad' : 'ok') + '">' + money(bd.net * DPM) + '</span></div>' +
    '<div><small>חוב מהתמ״ג</small>' + pct(debt * 100) + (p.bankrupt ? ' ' + chip('פשיטת רגל', 'red') : '') + '</div>' +
    '<div><small>נזק מסנקציות</small>' + pct(sh * 100) + '</div></div>';
  h += slider('tax', 'מס הכנסה', p.tax, 0.10, 0.60, 'יותר מס = יותר כסף, אבל העם כועס והצמיחה יורדת');
  h += slider('welfare', 'רווחה לעם (בריאות, חינוך, קצבאות)', p.welfare, 0, 0.35, 'יותר רווחה = עם מרוצה יותר, אבל עולה כסף');
  h += slider('defPct', 'תקציב ביטחון (מהתמ״ג)', p.defPct, 0.005, 0.12, 'יותר תקציב = הצבא גדל ומשלים אבדות. פחות = הצבא מצטמק לאט. בשלום, תקציב גבוה מרגיז את העם');
  h += '<div class="box"><b>תמיכה צפויה של העם: </b><span id="apt">' + pct(approvalTarget()) + '</span> <small class="hint">(עכשיו ' + pct(c.approval) + ' — זז לאט לכיוון הזה)</small></div>';
  if (b) h += '<h3>החודש שעבר</h3><table class="tbl">' +
    row('הכנסות ממסים', b.income) + row('רווחה', -b.welfare) + row('מנהלה ותשתיות', -b.admin) + row('ביטחון', -b.defense) +
    (b.war ? row('עלות מלחמות', -b.war) : '') + (b.interest ? row('ריבית על חוב', -b.interest) : '') + (b.upkeep ? row('אחזקת כוחות נוספים ומילואים', -b.upkeep) : '') +
    (b.nuke ? row('תוכנית גרעין', -b.nuke) : '') + '<tr class="tot"><td>סה״כ</td><td>' + money(b.net) + '</td></tr></table>';
  h += '<p class="sub">הכסף נכנס ויוצא כל יום. הסכמי סחר: ' + (tr.length ? tr.join(', ') : 'אין') + '<br>מטילות עליך סנקציות: ' + (sancBy.length ? sancBy.join(', ') : 'אף אחת') + '</p>';
  return h;
}
const row = (l, v) => '<tr><td>' + l + '</td><td>' + money(v) + '</td></tr>';
function slider(k, label, v, mn, mx, hint) {
  return '<label class="sl"><span>' + label + ': <b id="sv-' + k + '">' + (v * 100).toFixed(k === 'defPct' ? 1 : 0) + '%</b></span>' +
    '<input type="range" dir="ltr" data-slider="' + k + '" min="' + mn * 1000 + '" max="' + mx * 1000 + '" step="5" value="' + Math.round(v * 1000) + '"><small>' + hint + '</small></label>';
}

/* ---- home: domestic policy ---- */
const projCost = k => PROJ[k].cost * P().gdp * Math.pow(1.5, S.p.built[k] || 0);
const projMax = k => PROJ[k].max || 3;
function viewHome() {
  const c = P(), p = S.p, T = approvalTarget();
  let h = '<h2>מדיניות פנים</h2><div class="grid">' +
    '<div><small>אהבת העם (עכשיו ← בעתיד)</small><span class="nw"><span class="' + (c.approval < 30 ? 'bad' : c.approval < 45 ? 'warn' : 'ok') + '">' + pct(c.approval) + '</span> ← ' + pct(T) + '</span></div>' +
    '<div><small>מוניטין עולמי</small><span class="' + (p.rep < 25 ? 'bad' : p.rep < 45 ? 'warn' : 'ok') + '">' + num(p.rep) + '</span> / 100</div></div>';
  const why = [];
  if (p.tax > 0.36) why.push('<li class="red">מסים גבוהים (' + pct(p.tax * 100) + ')</li>'); else if (p.tax < 0.24) why.push('<li>מסים נמוכים — העם מרוצה</li>');
  if (p.welfare > 0.17) why.push('<li>רווחה נדיבה</li>'); else if (p.welfare < 0.12) why.push('<li class="red">קיצוץ ברווחה</li>');
  if (warWeariness() > 0) why.push('<li class="red">עייפות ממלחמה (' + num(warWeariness()) + '−)</li>');
  if (c.mob > 0) why.push('<li class="red">מילואים מגויסים — המשפחות רוצות אותם בבית</li>');
  if (p.apBonus) why.push('<li>פרויקטים שהושלמו (+' + num(p.apBonus) + ')</li>');
  if (p.unrest > 0.5) why.push('<li class="red">כעס מצטבר ברחוב</li>');
  if (sanctionHit(S.player) > 0.01) why.push('<li class="red">סנקציות פוגעות בכיס</li>');
  if (why.length) h += '<ul class="plain">' + why.join('') + '</ul>';
  h += '<h3>פרויקטים לאומיים</h3><p class="sub">משלמים מראש, ההשפעה מגיעה כשהפרויקט מסתיים.</p>';
  for (const k in PROJ) {
    const D = PROJ[k];
    if (D.nondem && c.gov === 'democracy') continue;
    const lvl = p.built[k] || 0, run = p.proj.find(q => q.k === k);
    h += '<div class="card"><b>' + D.he + '</b>' + (lvl ? ' ' + chip('נבנה ×' + lvl, 'teal') : '') + '<div class="sub">' + isoNums(D.d) + '</div>';
    if (run) {
      const tot = run.due - run.start, done = clamp((S.day - run.start) / tot, 0, 1);
      h += '<div class="fl"><div class="prog g"><div style="width:' + (done * 100).toFixed(1) + '%"></div></div> <small>עוד ' + daysTxt(run.due - S.day) + '</small></div>';
    } else if (lvl >= projMax(k)) h += '<div class="sub ok">הושלם במלואו</div>';
    else h += '<div class="btns">' + fbtn('build', 'בנה · ' + daysTxt(D.days), { cost: projCost(k), ap: D.ap, rep: D.rep, note: D.g ? 'צמיחה ' + isoNums('+' + (D.g * 100).toFixed(1) + '%') : '' }, 'good', false, ' data-k="' + k + '"') + '</div>';
    h += '</div>';
  }
  if (p.built.police) {
    const ccd = cdLeft('crack');
    h += '<h3>הפגנות</h3>';
    h += ccd ? '<button class="b" disabled>פזר הפגנות בכוח' + cdNote(ccd) + '</button>' :
      fbtn('crack', 'פזר הפגנות בכוח', { ap: 5, rep: c.gov === 'democracy' ? -12 : -7, note: 'שקט ל-3 חודשים' }, 'danger');
    if (p.crack > 0) h += '<p class="sub">המשטרה מדכאת הפגנות — עוד ' + daysTxt(p.crack) + '.</p>';
  }
  h += '<h3>מה משפיע על המוניטין בעולם</h3><ul class="plain"><li>מוריד: תקיפות בלי סיבה, מלחמה בלי סיבה, הפרת הסכמים, נשק גרעיני, סיפוח, דיכוי הפגנות, סנקציות על מדינות חלשות.</li>' +
    '<li>מעלה: סיוע הומניטרי, עזרה באסונות, הסכמי שלום וסחר, קליטת פליטים, אנרגיה ירוקה.</li>' +
    '<li>מוניטין נמוך = יותר סנקציות, סירובים וקואליציות נגדך. גבוה = הסכמים קלים יותר ותמיכה.</li></ul>';
  return h;
}

/* ---- military ---- */
let buyMul = 1;
function viewMil() {
  const c = P(), p = S.p;
  const I = c.inv;
  const li = (lbl, v) => '<div><small>' + lbl + '</small>' + v + '</div>';
  let h = '<h2>צבא <small>עוצמה ' + num(power(c)) + '</small></h2><div class="grid">' +
    li('חיילים בסדיר', troopsTxt(I.troops)) + li('מילואים', troopsTxt(c.res) + (c.mob > 0 ? ' <small class="warn">(' + troopsTxt(c.mob) + ' מגויסים)</small>' : '')) +
    li('טנקים', cnt(I.tanks)) + li('נגמ״שים ורק״מ', cnt(I.afv)) +
    li('תותחים וארטילריה', cnt(I.art)) + li('מטוסי קרב', cnt(I.air)) +
    li('מסוקי קרב', cnt(I.heli)) + li('ספינות קרב', cnt(I.ships)) +
    li('צוללות', cnt(I.subs)) + li('נושאות מטוסים', cnt(I.carriers)) +
    li('טילים במלאי', cnt(I.msl) + ' <small>(' + LVL_HE[c.mlv] + (c.mlv ? ', ' + num(MIS_RANGE[c.mlv]) + ' ק״מ' : '') + ')</small>') + li('הגנה אווירית', LVL_HE[c.adv]) +
    li('ראשי נפץ גרעיניים', num(c.nukes)) + li('הרוגים ופצועים במלחמות', num(p.casTotal * 1000)) + '</div>';
  const my = unitsOf(S.player);
  if (my.length) h += '<h3>היחידות שלך על המפה <small class="hint">(' + num(my.length) + ')</small></h3><div class="ulist">' + my.map(unitRow).join('') + '</div><p class="sub">הקש על יחידה (כאן או על המפה) כדי להזיז אותה, לתקוף או להגן.</p>';
  // reserves
  h += '<h3>מילואים</h3><div class="btns">';
  const callN = Math.min(c.res, Math.max(1, c.res * 0.5));
  if (c.mob > 0) h += fbtn('demob', 'שחרר את המילואימניקים הביתה', { ap: 2, note: troopsTxt(c.mob) + ' חוזרים לעבודה' });
  if (c.res >= 1) h += cdLeft('mob') ? '<button class="b" disabled>גייס מילואים' + cdNote(cdLeft('mob')) + '</button>' :
    fbtn('mob', 'גייס ' + troopsTxt(callN) + ' מילואימניקים', { ap: activeWars(S.player) ? -2 : -5, note: 'מגיעים תוך 3 ימים · פוגע בכלכלה' }, 'danger');
  h += '</div>';
  // buying
  h += '<h3>רכש וגיוס</h3><div class="seg" id="buymul">' + [1, 5, 20].map(m => '<button class="' + (buyMul === m ? 'on' : '') + '" data-act="buymul" data-v="' + m + '">×' + m + '</button>').join('') + '</div><div class="btns buy">';
  for (const k in BUY) {
    const B = BUY[k];
    if (B.minGdp && c.gdp < B.minGdp) continue;
    if (B.needMl && c.mlv < B.needMl) continue;
    const n = B.n * buyMul, cost = B.cost * buyMul;
    const lbl = k === 'troops' ? 'גייס ' + num(n * 1000) + ' חיילים' : (buyMul === 1 ? B.he : n + ' ' + B.unit);
    h += fbtn('buy', lbl, { cost, ap: k === 'troops' ? -Math.min(3, buyMul) : 0, note: B.sub.replace(/^.*· /, '') }, '', false, ' data-k="' + k + '"');
  }
  if (c.mlv < 3) h += fbtn('upg', 'שדרג תוכנית טילים לרמה ' + LVL_HE[c.mlv + 1], { cost: upgCost('mlv'), note: 'טווח ' + num(MIS_RANGE[c.mlv + 1]) + ' ק״מ · 18 חודשים' }, '', p.queue.some(q => q.k === 'mlv'), ' data-k="mlv"');
  if (c.adv < 3) h += fbtn('upg', 'שדרג הגנה אווירית לרמה ' + LVL_HE[c.adv + 1], { cost: upgCost('adv'), note: '12 חודשים' }, '', p.queue.some(q => q.k === 'adv'), ' data-k="adv"');
  h += '</div><p class="sub">משלמים עכשיו, הנשק מגיע אחרי זמן הייצור. כל כלי נוסף עולה גם אחזקה שנתית. גיוס ומילואים מורידים מעט את אהבת העם.</p>';
  if (p.queue.length) {
    h += '<h3>בדרך אליך</h3><div class="front">';
    p.queue.slice().sort((a, b) => a.due - b.due).forEach(q => {
      const tot = q.due - q.start, done = clamp((S.day - q.start) / tot, 0, 1);
      const what = q.k === 'mobarrive' ? 'מילואים בדרך' : q.k === 'mlv' ? 'שדרוג טילים' : q.k === 'adv' ? 'שדרוג הגנה אווירית' : q.k === 'troops' ? num(q.n * 1000) + ' חיילים' : q.n + ' ' + BUY[q.k].unit;
      h += '<div class="fl"><small>' + what + '</small><div class="prog"><div style="width:' + (done * 100).toFixed(1) + '%"></div></div><small class="nw">' + daysTxt(q.due - S.day) + '</small></div>';
    });
    h += '</div>';
  }
  h += '<h3>תוכנית גרעין</h3>';
  if (c.nukes > 0 && !(p.nprog && p.nprog.done)) h += '<p class="sub">יש לך נשק גרעיני. אפשר להשתמש בו מכרטיס של מדינה — במלחמה או בלעדיה — ויגרור תגובה עולמית קשה.</p>';
  else if (!p.nprog) h += '<p class="sub">תוכנית סודית: כ-36 חודשים, עולה כ-' + money(nukeCost(c)) + ' לחודש. אם תיחשף — סנקציות ואולי תקיפות.</p>' + btn('nprog', 'התחל תוכנית גרעין סודית', 'danger');
  else if (!p.nprog.done) h += '<div class="prog"><div style="width:' + (p.nprog.m / 36 * 100) + '%"></div></div><p class="sub">התקדמות: ' + p.nprog.m + ' / 36 חודשים' + (p.nprog.disc ? ' · התוכנית נחשפה!' : ' · עדיין סודית') + '</p>' + btn('nstop', 'עצור את התוכנית');
  else h += '<p class="sub">התוכנית הושלמה. נוסף ראש נפץ כל חצי שנה.</p>';
  return h;
}
const upgCost = k => Math.max(0.3, P().gdp * 0.002) * ((P()[k] || 0) + 1) * (k === 'mlv' ? 1.5 : 1);

/* ---- units: panel of one unit, and lists ---- */
const uIc = (u, en) => '<svg class="uic' + (en ? ' en' : '') + '"><use href="#ui-' + uIcon(u) + '"/></svg>';
function uWhere(u) {
  if (domOf(u) === 'sea' && !u.at) { const p = [u.lon, u.lat]; const near = alive().filter(c => { const t = mainTid(c); return t && km(TERR[t].c, p) < 2500; }).map(c => [c, distToC(c, p)]).filter(x => x[1] < 500).sort((a, b) => a[1] - b[1])[0]; return near ? 'בים, מול ' + nm(near[0]) : 'בים הפתוח'; }
  return u.at ? nm(u.at) : (domOf(u) === 'air' ? 'מעל הים' : 'שטח ללא שליטה');
}
function uStateTxt(u) {
  if (u.dest) { const d = etaDays(u), t = d < 1 ? 'מגיעה תוך פחות מיום' : 'עוד ' + daysTxt(d); const to = domOf(u) === 'sea' ? 'ליעד בים' : (ownerAt(u.dest[0], u.dest[1]) ? 'ל' + esc(nm(ownerAt(u.dest[0], u.dest[1]))) : 'ליעד'); return (u.mode === 'ret' ? 'חוזרת הביתה' : 'בתנועה ' + to) + ' · ' + t + (u.slow < 1 ? ' (דרך הים, לאט יותר)' : ''); }
  if (uFighting(u)) return '<span class="bad">בלחימה</span> — ' + esc(domOf(u) === 'sea' ? 'חוסמת את החוף ומגנה על כוחות' : uWhere(u));
  return atHome(u) ? 'בבסיס' : 'ממתינה ב' + esc(uWhere(u));
}
function uRows(u) {
  const ks = Object.keys(u.m).filter(k => u.m[k] >= 0.5 || (k === 'troops' && u.m[k] > 0.001));
  return '<div class="grid">' + ks.map(k => '<div><small>' + INV_HE[k] + '</small>' + (k === 'troops' ? troopsTxt(u.m[k]) : cnt(u.m[k])) + '</div>').join('') +
    '<div><small>עוצמה</small>' + num(uStr(u)) + '</div><div><small>מיקום</small>' + esc(uWhere(u)) + '</div></div>';
}
const enemiesAtWar = () => [...new Set(warsOf(S.player).filter(w => w.pause === 0).flatMap(w => w.A.includes(S.player) ? w.B : w.A))].filter(x => S.c[x] && S.c[x].alive);
function mergeables(u) { return S.units.filter(x => x !== u && x.o === u.o && domOf(x) === domOf(u) && !x.dest && km([x.lon, x.lat], [u.lon, u.lat]) < 80); }
function viewUnit() {
  const u = unitById(selUnit);
  if (!u) return '<p class="hint">היחידה כבר לא קיימת.</p>';
  const mine = u.o === S.player, dom = domOf(u);
  let h = '<h2>' + uIc(u, !mine) + ' ' + esc(uName(u)) + ' <small>' + esc(nm(u.o)) + (mine ? '' : ' · אויב') + '</small></h2>';
  h += '<p class="sub">' + uStateTxt(u) + '</p>' + uRows(u);
  if (!mine) return h + '<p class="sub">כדי להילחם בה — שלח לשם יחידות יבשה משלך, או תקוף מהאוויר.</p>';
  h += '<div class="btns">';
  h += btn('umove', 'הזז', 'primary') + btn('uattack', 'תקוף מדינה', 'danger');
  if (u.dest) h += btn('ustop', 'עצור כאן');
  if (dom !== 'sea') h += btn('udefend', 'הגן על הבית');
  h += atHome(u) ? '<button class="b" disabled>חזור הביתה<small class="cost">כבר בבסיס</small></button>' : btn('uret', 'חזור הביתה');
  if (u.t === 'air' || (u.m.air || 0) >= 4) h += btn('ustrike', 'תקיפה אווירית', 'danger');
  if (u.t === 'msl' && P().mlv > 0) h += btn('umissile', 'מטח טילים', 'danger');
  const canSplit = Object.keys(u.m).some(k => u.m[k] >= (k === 'troops' ? 2 : 2)) && !(u.t === 'fleet' && (u.m.ships || 0) < 2 && (u.m.carriers || 0) < 2);
  h += canSplit ? btn('usplit', 'פצל לשתיים') : '<button class="b" disabled>פצל לשתיים<small class="cost">קטנה מדי</small></button>';
  const mg = mergeables(u).length;
  h += mg ? btn('umerge', mg === 1 ? 'אחד עם היחידה שכאן' : 'אחד עם ' + mg + ' יחידות כאן') : '<button class="b" disabled>אחד יחידות<small class="cost">אין יחידות אחרות כאן</small></button>';
  h += '</div><p class="sub">' + ({ land: 'כוחות יבשה זזים ביבשה (חי״ר ~30 ק״מ ביום, שריון ~40). לאי או מעבר לים — רק כשצי שלך באזור, ולאט יותר.', air: 'מטוסים מגיעים תוך יום, עד ' + num(UT[u.t].range) + ' ק״מ מבסיס שלך, של בעלת ברית או מנושאת מטוסים.', sea: 'ספינות שטות כ-' + num(UT[u.t].spd) + ' ק״מ ביום. צי ליד חוף האויב חוסם אותו ומאפשר לכוחות יבשה לחצות את הים.' }[dom]) + '</p>';
  return h;
}
function unitRow(u) {
  return '<button data-act="selunit" data-u="' + u.id + '">' + uIc(u, u.o !== S.player) + '<b>' + esc(uName(u)) + (u.o !== S.player ? ' · ' + esc(nm(u.o)) : '') + '</b><small>' + esc(uLabel(u)) + ' · ' + (u.dest ? 'בתנועה' : uFighting(u) ? 'בלחימה' : atHome(u) ? 'בבסיס' : esc(uWhere(u))) + '</small></button>';
}
function viewUnitList() {
  const us = ulistIds.map(unitById).filter(Boolean);
  if (!us.length) return '<p class="hint">אין כאן יחידות.</p>';
  return '<h2>יחידות במקום הזה <small>' + num(us.length) + '</small></h2><div class="ulist">' + us.map(unitRow).join('') + '</div>';
}

/* ---- wars ---- */
function frontBars(w) {
  const fp = mySideFront(w, S.player);
  return '<div class="front"><div class="fl"><small>שטח האויב בידינו</small><div class="prog g"><div style="width:' + Math.max(0, fp) + '%"></div></div>' + pct(Math.max(0, fp)) + '</div>' +
    '<div class="fl"><small>שטחנו בידי האויב</small><div class="prog r"><div style="width:' + Math.max(0, -fp) + '%"></div></div>' + pct(Math.max(0, -fp)) + '</div></div>';
}
// who is actually fighting on the ground, from the units on the map
function unitFront(w, en) {
  if (!(w.a === S.player || w.b === S.player) || w.pause > 0) return '';
  const mineIn = S.units.filter(u => u.o === S.player && u.at === en && domOf(u) !== 'sea');
  const theirsIn = S.units.filter(u => u.o === en && u.at === S.player && domOf(u) !== 'sea');
  const landIn = mineIn.filter(u => domOf(u) === 'land').length;
  let h = '<div class="box" style="font-size:13px;line-height:1.6">';
  h += 'יחידות שלנו בתוך ' + esc(nm(en)) + ': <b>' + num(mineIn.length) + '</b>' + (mineIn.length ? ' (עוצמה ' + num(mineIn.reduce((s, u) => s + uStr(u), 0)) + ')' : '');
  h += '<br>יחידות אויב בשטחנו: <b class="' + (theirsIn.length ? 'bad' : '') + '">' + num(theirsIn.length) + '</b>';
  if (w.ru && (w.ru.aE || w.ru.aP)) h += '<br>יחס כוחות בשטח: ' + (w.ru.aE ? 'אצלם ' + pct(w.ru.rE * 100) + ' לטובתנו' : '') + (w.ru.aP ? (w.ru.aE ? ' · ' : '') + 'אצלנו ' + pct((1 - w.ru.rP) * 100) + ' לטובתנו' : '');
  if (!landIn) h += '<br><span class="warn">אין לנו כוחות יבשה בתוך ' + esc(nm(en)) + ' — אי אפשר לכבוש שטח, רק לתקוף מהאוויר ובטילים. הקש על יחידת חי״ר או שריון ← "תקוף מדינה".</span>';
  return h + '</div>';
}
function warActions(w, compact, target) {
  const en = target || enemyLeaderFor(w, S.player), lead = w.a === S.player || w.b === S.player;
  let h = '';
  if (w.pause > 0) return '<p class="sub">הפסקת אש — עוד ' + daysTxt(w.pause) + '.</p>';
  if (!compact) h += '<div class="seg"><button class="' + (w.stance === 'attack' ? 'on' : '') + '" data-act="stance" data-w="' + w.id + '" data-v="attack">התקפה</button><button class="' + (w.stance === 'defend' ? 'on' : '') + '" data-act="stance" data-w="' + w.id + '" data-v="defend">הגנה</button></div>';
  h += strikeSection(en, w);
  h += '<div class="btns">';
  if (lead) h += fbtn('peace', 'הצע שלום / תנאים', { note: 'שלום: העולם +5' }, 'good', false, ' data-w="' + w.id + '"');
  else h += '<button class="b" data-act="leave" data-w="' + w.id + '">פרוש מהמלחמה</button>';
  h += '</div>';
  return h;
}
function viewWars() {
  const mine = warsOf(S.player);
  let h = '<h2>המלחמות שלך</h2><div class="btns"><button class="b sm" data-act="stats">סטטיסטיקות ואבדות</button></div>';
  if (!mine.length) h += '<p class="hint">אתה לא במלחמה. כדי להכריז מלחמה או לתקוף — בחר מדינה במפה. שכנות קלות לתקוף; מדינות רחוקות יקרות וקשות.</p>';
  mine.forEach(w => {
    const en = enemyLeaderFor(w, S.player), side = w.A.includes(S.player) ? w.A : w.B, other = w.A.includes(S.player) ? w.B : w.A;
    h += '<div class="card war"><h3>נגד ' + esc(nm(en)) + (w.pause > 0 ? ' ' + chip('הפסקת אש', 'teal') : '') + '</h3>' +
      '<p class="sub">מאז ' + (w.startDay != null && w.startDay >= 0 ? dayTxt(w.startDay) : dateTxt(w.start)) + ' · כוחנו: ' + num(power(P())) + ' · כוחם: ' + num(power(S.c[en])) +
      (other.length > 1 ? '<br>לצד האויב: ' + other.filter(x => x !== en).map(nm).join(', ') : '') +
      (side.length > 1 ? '<br>לצדנו: ' + side.filter(x => x !== S.player).map(nm).join(', ') : '') + '</p>' +
      frontBars(w) + warStatsHtml(w) + unitFront(w, en) + warActions(w) + '</div>';
  });
  const world = S.wars.filter(w => !involvesPlayer(w));
  if (world.length) {
    h += '<h3>מלחמות בעולם</h3>';
    world.forEach(w => { const st = warSt(w); h += '<div class="card"><b>' + esc(nm(w.a)) + '</b> נגד <b>' + esc(nm(w.b)) + '</b>' + (w.pause > 0 ? ' ' + chip('הפסקת אש', 'teal') : '') +
      '<div class="sub">' + (w.f >= 0 ? esc(nm(w.a)) + ' מחזיקה ' + pct(w.f) + ' מ' + esc(nm(w.b)) : esc(nm(w.b)) + ' מחזיקה ' + pct(-w.f) + ' מ' + esc(nm(w.a))) +
      '<br>הרוגים מאז תחילת המשחק: ' + num(killed(st.A) + killed(st.B)) + ' <small>(חיילים ' + num(st.A.sk + st.B.sk) + ' · אזרחים ' + num(st.A.ck + st.B.ck) + ')</small></div></div>'; });
  }
  return h;
}
/* ---- statistics: war cards, charts and the stats screen ---- */
const wstOpen = new Set();
// small line chart (inline SVG, stretches to the card width)
function lineChart(xs, series, lo, hi, zero) {
  const Wc = 300, Hc = 80, pad = 6;
  const X = x => (x - xs[0]) / Math.max(1, xs[xs.length - 1] - xs[0]) * Wc;
  const Y = v => pad + (1 - (v - lo) / ((hi - lo) || 1)) * (Hc - pad * 2);
  let h = '<svg class="chart" viewBox="0 0 ' + Wc + ' ' + Hc + '" preserveAspectRatio="none" aria-hidden="true">';
  [0.25, 0.5, 0.75].forEach(f => { h += '<line x1="0" x2="' + Wc + '" y1="' + (pad + f * (Hc - pad * 2)).toFixed(1) + '" y2="' + (pad + f * (Hc - pad * 2)).toFixed(1) + '" class="gl"/>'; });
  if (zero) h += '<line x1="0" x2="' + Wc + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" class="zl"/>';
  series.forEach(s => {
    const pts = s.v.map((v, i) => X(xs[i]).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ');
    if (s.area) h += '<polygon points="' + X(xs[0]).toFixed(1) + ',' + Y(0).toFixed(1) + ' ' + pts + ' ' + X(xs[xs.length - 1]).toFixed(1) + ',' + Y(0).toFixed(1) + '" fill="' + s.col + '" fill-opacity=".16"/>';
    h += '<polyline points="' + pts + '" fill="none" stroke="' + s.col + '" stroke-width="2.2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';
  });
  return h + '</svg>';
}
function warCharts(w) {
  const st = warSt(w), meA = w.A.includes(S.player);
  const hist = st.h.concat([[S.day, Math.round(w.f), Math.round(killed(st.A)), Math.round(killed(st.B))]]);
  if (hist.length < 3 || hist[hist.length - 1][0] - hist[0][0] < 3) return '<p class="sub">הגרפים יופיעו אחרי כמה ימים של מלחמה.</p>';
  const xs = hist.map(x => x[0]);
  const fr = hist.map(x => meA ? x[1] : -x[1]), m = Math.max(10, ...fr.map(Math.abs));
  const mine = hist.map(x => meA ? x[2] : x[3]), theirs = hist.map(x => meA ? x[3] : x[2]), top = Math.max(10, ...mine, ...theirs);
  const ax = '<div class="ch-ax"><span>' + dayHtml(xs[0]) + '</span><span>היום</span></div>';
  return '<div class="charts"><div class="chartbox"><div class="ch-t">שטח שנכבש <small>למעלה — בידינו, למטה — בידם</small></div>' + lineChart(xs, [{ v: fr, col: fr[fr.length - 1] >= 0 ? '#2fbf71' : '#e5383b', area: 1 }], -m, m, true) + ax + '</div>' +
    '<div class="chartbox"><div class="ch-t">הרוגים מצטבר <small><i class="lg" style="background:#f5b301"></i>אצלנו <i class="lg" style="background:#ff6b6b"></i>אצלם</small></div>' + lineChart(xs, [{ v: mine, col: '#f5b301' }, { v: theirs, col: '#ff6b6b' }], 0, top * 1.08) + '<div class="ch-ax"><span>' + num(top) + ' מקסימום</span><span>היום</span></div></div></div>';
}
// table of losses for two sides
function casTable(a, b, la, lb) {
  const rowc = (l, x, y, cls) => '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + l + '</td><td>' + x + '</td><td>' + y + '</td></tr>';
  let h = '<table class="tbl t3"><tr class="hd"><td></td><td>' + la + '</td><td>' + lb + '</td></tr>';
  h += rowc('חיילים הרוגים', num(a.sk), num(b.sk)) + rowc('חיילים פצועים', num(a.sw), num(b.sw));
  h += rowc('אזרחים הרוגים', num(a.ck), num(b.ck), 'civ') + rowc('אזרחים פצועים', num(a.cw), num(b.cw));
  EQ_K.forEach(k => { if ((a.eq[k] || 0) >= 0.5 || (b.eq[k] || 0) >= 0.5) h += rowc(EQ_HE[k] + ' שהושמדו', cnt(a.eq[k] || 0), cnt(b.eq[k] || 0)); });
  if (a.mu || b.mu) h += rowc('טילים ששוגרו', cnt(a.mu || 0), cnt(b.mu || 0));
  if (a.sp || b.sp) h += rowc('כסף שהוצא', money(a.sp || 0, true), money(b.sp || 0, true));
  if (a.dm || b.dm) h += rowc('נזק (ציוד וכלכלה)', money(a.dm || 0, true), money(b.dm || 0, true));
  return h + '</table>';
}
function logList(lg, n) {
  if (!lg || !lg.length) return '<p class="sub">עוד אין אירועים.</p>';
  return '<ul class="news blog">' + lg.slice(0, n || 8).map(x => '<li><small>' + dayHtml(x.d) + '</small> ' + isoNums(esc(plainT(x.t))) + '</li>').join('') + '</ul>';
}
function warStatsHtml(w) {
  const st = warSt(w), meA = w.A.includes(S.player), my = st[meA ? 'A' : 'B'], th = st[meA ? 'B' : 'A'], fp = mySideFront(w, S.player);
  const days = S.day - (w.startDay != null ? w.startDay : 0);
  let h = '<div class="wst"><div class="grid g3"><div><small>ימים במלחמה</small>' + num(days) + '</div><div><small>הרוגים אצלנו</small><span class="bad">' + num(killed(my)) + '</span></div><div><small>הרוגים אצלם</small>' + num(killed(th)) + '</div>' +
    '<div><small>כבשנו משטחם</small>' + pct(Math.max(0, fp)) + '</div><div><small>הם כבשו משטחנו</small>' + pct(Math.max(0, -fp)) + '</div><div><small>ציוד שהשמדנו</small>' + num(EQ_K.reduce((s, k) => s + (th.eq[k] || 0), 0)) + '</div></div>';
  h += warCharts(w);
  const open = wstOpen.has(w.id);
  h += '<button class="b sm" data-act="wst" data-w="' + w.id + '">' + (open ? 'הסתר פרטים' : 'טבלת אבדות ויומן קרבות') + '</button>';
  if (open) h += casTable(my, th, 'אצלנו', 'אצלם') + '<p class="sub">פצועים: חיילים ≈ פי 2.5 מההרוגים, אזרחים ≈ פי 3. הספירה מתחילה ב-1 בינואר 2026.</p><h3>יומן קרבות</h3>' + logList(st.lg, 10);
  return h + '</div>';
}
const RES_HE = { won: ['ניצחון', 'ok'], lost: ['הפסד', 'bad'], peace: ['שלום / תיקו', 'teal'], left: ['פרשנו', 'orange'] };
function viewStats() {
  const ps = PS(), done = ps.done, act = warsOf(S.player);
  const cntR = r => done.filter(d => d.res === r).length;
  const sp = ps.sp, spTot = sp.def + sp.war + sp.buy + sp.strike;
  let h = '<h2>סטטיסטיקות <small>מאז ' + (S.p && S.p.startDay != null ? dayHtml(S.p.startDay) : 'תחילת המשחק') + '</small></h2>';
  h += '<div class="grid g3"><div><small>מלחמות</small>' + num(done.length + act.length) + (act.length ? ' <small class="warn">(' + num(act.length) + ' פעילות)</small>' : '') + '</div>' +
    '<div><small>ניצחונות</small><span class="ok">' + num(cntR('won')) + '</span></div><div><small>הפסדים</small><span class="' + (cntR('lost') ? 'bad' : '') + '">' + num(cntR('lost')) + '</span></div>' +
    '<div><small>תקיפות שביצענו</small>' + num(ps.strikes) + '</div><div><small>תקיפות עלינו</small>' + num(ps.struck) + '</div><div><small>מדינות שסופחו</small>' + num(S.p.annexed.length) + '</div></div>';
  h += '<h3>אבדות</h3>' + casTable(ps.cau, ps.suf, 'גרמנו לאויב', 'ספגנו');
  h += '<p class="sub">"גרמנו" כולל את כל האבדות של הצד השני במלחמות שלנו. "ספגנו" — רק של ' + esc(P().he) + '.</p>';
  h += '<h3>הוצאות צבאיות <small class="hint">' + money(spTot) + '</small></h3><table class="tbl">' + row('תקציב ביטחון ואחזקה', sp.def) + row('עלות המלחמות', sp.war) + row('רכש נשק, גיוס ושדרוגים', sp.buy) + row('תקיפות', sp.strike) + '<tr class="tot"><td>סה״כ</td><td>' + money(spTot) + '</td></tr></table>';
  h += '<h3>תקיפות אחרונות</h3>';
  h += ps.log.length ? '<div class="ulist">' + ps.log.slice(0, 8).map((r, i) => '<button data-act="rshow" data-i="' + i + '"><b>' + (r.at === S.player ? '<span class="bad">' + esc(nm(r.by)) + ' ← אנחנו</span>' : 'אנחנו ← ' + esc(nm(r.at))) + ' · ' + esc(KIND_HE[r.k]) + '</b><small>' + num(killed(r.cas)) + ' הרוגים · ' + dayHtml(r.d) + '</small></button>').join('') + '</div>' : '<p class="sub">עוד לא היו תקיפות.</p>';
  if (done.length) {
    h += '<h3>מלחמות שהסתיימו</h3>';
    done.slice().reverse().slice(0, 10).forEach(d => { const [rl, rc] = RES_HE[d.res] || ['הסתיימה', '']; h += '<div class="card"><b>נגד ' + esc(nm(d.en)) + '</b> ' + chip(rl, rc) + '<div class="sub">' + num(Math.max(1, d.e - d.s)) + ' ימים · הרוגים: ' + num(killed(d.my)) + ' אצלנו, ' + num(killed(d.th)) + ' אצלם</div></div>'; });
  }
  // the world
  const ws = S.wars.filter(w => w.pause === 0).map(w => ({ w, k: killed(warSt(w).A) + killed(warSt(w).B) })).sort((a, b) => b.k - a.k);
  h += '<h3>העולם</h3><div class="box">הרוגים בכל המלחמות והתקיפות מאז תחילת המשחק: <b>' + num(killed(WST())) + '</b><br><small class="hint">חיילים ' + num(WST().sk) + ' · אזרחים ' + num(WST().ck) + ' · פצועים ' + num(WST().sw + WST().cw) + '</small></div>';
  if (ws.length) h += '<div class="ulist">' + ws.map(({ w, k }) => { const st = warSt(w), my = involvesPlayer(w); return '<button data-act="gotowars"><b>' + (my ? '<span class="dot me"></span>' : '') + esc(nm(w.a)) + ' נגד ' + esc(nm(w.b)) + '</b><small>' + num(k) + ' הרוגים · אזרחים ' + num(st.A.ck + st.B.ck) + '</small></button>'; }).join('') + '</div>';
  else h += '<p class="sub">אין מלחמות פעילות בעולם.</p>';
  return h;
}
function viewNews() {
  if (!S.news.length) return '<p class="hint">אין חדשות עדיין.</p>';
  let h = '<h2>מבזקי חדשות</h2><ul class="news">', last = null;
  S.news.slice(0, 80).forEach(n => { const d = n.t >= 0 ? dayHtml(n.t) : ''; if (d !== last) { h += '<li class="nd">' + d + '</li>'; last = d; } h += '<li class="' + n.k + '">' + esc(n.txt) + '</li>'; });
  return h + '</ul>';
}

/* ================= modals ================= */
let modalQ = [];
// the clock stops while any dialog is open
const modalOpen = () => modalQ.length > 0 || $('#modal').classList.contains('open');
function modal(o) { modalQ.push(o); if (modalQ.length === 1) showModal(); }
function showModal() {
  const o = modalQ[0]; if (!o) { $('#modal').classList.remove('open'); return; }
  $('#m-title').innerHTML = o.title || '';
  $('#m-body').innerHTML = o.html || '';
  const f = $('#m-foot'); f.innerHTML = '';
  (o.buttons || [{ label: 'סגור' }]).forEach(b => {
    const e = document.createElement('button'); e.className = 'b ' + (b.cls || ''); e.innerHTML = b.label;
    e.onclick = () => { if (b.keep && b.fn) { b.fn(); return; } modalQ.shift(); $('#modal').classList.remove('open'); if (b.fn) b.fn(); setTimeout(showModal, 30); };
    f.appendChild(e);
  });
  $('#modal').className = 'modal open' + (o.cls ? ' ' + o.cls : '');
  if (o.onShow) o.onShow();
}
// stacked floating toasts (several actions in a row stay readable)
function toast(txt, bad) {
  const box = $('#toasts'); if (!box) return;
  const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = txt;
  box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3200);
}
const fxBtn = (label, e) => label + (e && fxLine(e) ? '<small class="cost">' + fxLine(e) + '</small>' : '');
// important events stop the clock and ask the player
function processPending() {
  // let a strike / explosion finish on screen before the next dialog covers the map
  if (!S.pending.length || S.over || modalOpen() || performance.now() < fxHold) return;
  const p = S.pending.shift();
  const w = p.wid != null ? S.wars.find(x => x.id === p.wid) : null;
  const after = () => { save(); renderAll(); setTimeout(processPending, 40); };
  if (p.type === 'win') { modal({ title: 'ניצחון!', html: '<p>' + p.txt + '</p><p>הניקוד שלך: ' + num(score()) + '. אפשר להמשיך לשחק.</p>', buttons: [{ label: 'המשך לשחק', cls: 'primary', fn: after }] }); return; }
  if (p.type === 'attacked') {
    if (!w) return processPending();
    const side = w.B.filter(x => x !== S.player), foes = w.A.filter(x => x !== p.from);
    modal({ title: 'מלחמה! ' + esc(nm(p.from)) + ' תקפה אותנו', cls: 'danger', html: '<p><b>' + esc(nm(p.from)) + '</b> הכריזה מלחמה על ' + esc(P().he) + '.</p><ul class="plain">' +
      (p.noRally ? '<li class="red">הם מגיבים לתקיפה שלנו — הפעם העם לא מתלכד סביבך (אין בונוס).</li>' : '<li>העם מתלכד סביב הדגל: אהבת העם ' + sgn(6) + '.</li>') +
      (side.length ? '<li>לצדנו נלחמות: ' + side.slice(0, 6).map(nm).join(', ') + '</li>' : '<li>אף מדינה לא הצטרפה לצדנו (עדיין).</li>') +
      (foes.length ? '<li class="red">לצד האויב: ' + foes.slice(0, 6).map(nm).join(', ') + '</li>' : '') +
      '<li>כוחם: ' + num(power(S.c[p.from])) + ' · כוחנו: ' + num(power(P())) + '</li></ul><p class="sub">יחידות האויב מסומנות באדום על המפה. הזז יחידות כדי להגן על הגבול או לפלוש אליהם, גייס מילואים בלשונית צבא, או הצע שלום מלשונית מלחמות.</p>',
      buttons: [{ label: 'השאר מושהה ותכנן', cls: 'primary', fn: () => { setSpeed(0); openTabFresh('wars'); after(); } }, { label: 'המשך', fn: after }] });
    return;
  }
  if (p.type === 'invaded') {
    if (!w) return processPending();
    const u = unitById(p.uid);
    modal({ title: 'פלישה! ' + esc(nm(p.from)) + ' חצתה את הגבול', cls: 'danger', html: '<p>יחידות של <b>' + esc(nm(p.from)) + '</b> נכנסות לשטח ' + esc(P().he) + '.</p><ul class="plain"><li>כדי לעצור אותן — הזז לשם יחידות יבשה (חי״ר ושריון) ותן להן תמיכה מהאוויר.</li><li>אם לא נגן — האויב יכבוש עוד ועוד שטח.</li></ul>',
      buttons: [{ label: 'הראה לי', cls: 'primary', fn: () => { setSpeed(0); if (u) { const p2 = MAP_PROJ([u.dest ? u.dest[0] : u.lon, u.dest ? u.dest[1] : u.lat]); zoomToMapPt(p2, Math.max(curK, 8)); } after(); } }, { label: 'המשך', fn: after }] });
    return;
  }
  if (p.type === 'nukealert') {
    modal({ title: '☢ פיצוץ גרעיני', cls: 'danger', html: '<p><b>' + esc(nm(p.att)) + '</b> שיגרה נשק גרעיני על <b>' + esc(nm(p.tgt)) + '</b>. ' + (p.dead ? num(p.dead) + ' אזרחים נהרגו, ועוד רבים נפצעו.' : 'מיליונים נפגעו.') + ' העולם בהלם.</p>' +
      (p.tgt === S.player ? '<p class="warnbox">אנחנו המטרה! הכלכלה והצבא נפגעו קשות.</p>' : '<p class="sub">רוב העולם יטיל סנקציות על התוקפת. זה רגע טוב לחשוב על בריתות.</p>'), buttons: [{ label: 'המשך', cls: 'primary', fn: after }] });
    return;
  }
  if (p.type === 'revwarn') {
    modal({ title: 'אזהרה: סכנת מהפכה', cls: 'danger', html: '<p>אהבת העם ירדה ל-' + pct(P().approval) + '. אם המצב לא ישתפר בחודשים הקרובים — הממשלה תיפול.</p><ul class="plain"><li>הורד מסים או העלה רווחה (לשונית כלכלה)</li><li>סיים מלחמות ושחרר מילואים</li><li>בנה פרויקטים לאומיים (לשונית בית)</li></ul>',
      buttons: [{ label: 'לכלכלה', cls: 'primary', fn: () => { openTabFresh('eco'); after(); } }, { label: 'המשך', fn: after }] });
    return;
  }
  if (p.type === 'aid') {
    const C = S.c[p.from]; if (!C || !C.alive) return processPending();
    const big = Math.max(0.01, Math.min(P().gdp * 0.002, C.gdp * p.size * 0.5 + 0.02)), small = big * 0.25;
    const eBig = { cost: big, rep: 6, ap: 1, rel: { [p.from]: 18 } }, eSmall = { cost: small, rep: 3, rel: { [p.from]: 8 } }, eNo = { rep: -1, rel: { [p.from]: -4 } };
    modal({ title: 'בקשת עזרה: ' + esc(p.kind) + ' ב' + esc(C.he), html: '<p>' + esc(p.kind) + ' ב' + esc(C.he) + ': אלפי אנשים נפגעו, והממשלה מבקשת סיוע מהעולם.</p>',
      buttons: [{ label: fxBtn('שלח סיוע גדול', eBig), cls: 'good', fn: () => { if (spend(big)) { fxToast('סיוע ל' + C.he, eBig); addNews('שלחנו משלחת סיוע גדולה ל' + C.he + ' אחרי ה' + p.kind + '. העולם מעריך.', 'good'); } after(); } },
        { label: fxBtn('שלח צוותי חילוץ', eSmall), fn: () => { if (spend(small)) { fxToast('חילוץ ב' + C.he, eSmall); addNews('צוותי חילוץ שלנו נחתו ב' + C.he + '.', 'good'); } after(); } },
        { label: fxBtn('סרב', eNo), fn: () => { fxToast('סירבנו', eNo, true); after(); } }] });
    return;
  }
  if (p.type === 'refugees') {
    const C = S.c[p.from]; if (!C || !C.alive) return processPending();
    const cost = Math.max(0.01, P().gdp * 0.0008);
    const eYes = { cost, rep: 6, ap: -2, rel: { [p.from]: 6 } }, eNo = { rep: -2, ap: 1 };
    modal({ title: 'פליטים מ' + esc(C.he), html: '<p>המלחמה ב' + esc(C.he) + ' גירשה מאות אלפים מבתיהם. חלקם מבקשים מקלט אצלנו.</p><p class="sub">קליטה עולה כסף ומרגיזה חלק מהציבור, אבל העולם יעריך את זה.</p>',
      buttons: [{ label: fxBtn('קלוט פליטים', eYes), cls: 'good', fn: () => { if (spend(cost)) { fxToast('קלטנו פליטים', eYes); addNews('קלטנו פליטים מ' + C.he + '.', 'good'); } after(); } },
        { label: fxBtn('סגור את הגבול', eNo), fn: () => { fxToast('הגבול נסגר', eNo, true); after(); } }] });
    return;
  }
  if (!w) return processPending();
  if (p.type === 'ally') {
    const en = w.a;
    const eJoin = { rel: { [p.ally]: 15, [en]: -100 }, rep: 2 }, eNo = { rel: { [p.ally]: -35 }, rep: -5 };
    modal({ title: 'קריאה לעזרה', html: '<p>' + nm(en) + ' תקפה את בעלת בריתך ' + nm(p.ally) + '. האם לכבד את הברית ולהצטרף למלחמה?</p><p class="sub">סירוב יפגע קשות ביחסים, ינתק את הברית ויפגע באמינות שלך בעולם.</p>',
      buttons: [{ label: fxBtn('הצטרף למלחמה', eJoin), cls: 'danger', fn: () => { if (S.wars.includes(w) && !inWar(w, S.player)) { w.B.push(S.player); fxToast('הצטרפנו למלחמה', eJoin); addNews('הצטרפנו למלחמה לצד ' + nm(p.ally) + ' נגד ' + nm(en) + '.', 'war'); } after(); } },
        { label: fxBtn('הישאר בחוץ', eNo), fn: () => { setPact(p.ally, S.player, 'alliance', false); fxToast('הפרנו את הברית', eNo, true); addNews('סירבנו לסייע ל' + nm(p.ally) + '. אמינותנו נפגעה.', 'bad'); after(); } }] });
  } else if (p.type === 'peace') {
    const terms = p.kind === 'white' ? 'שלום ללא תנאים (כל צד נשאר בגבולותיו).' : p.kind === 'repar' ? 'הם ישלמו לנו פיצויים של ' + money(S.c[p.from].gdp * 0.04) + '.' : 'הם יוותרו לנו על ' + pct(p.share * 100) + ' משטחם ומאוכלוסייתם.';
    modal({ title: 'הצעת שלום מ' + nm(p.from), html: '<p>' + terms + '</p>',
      buttons: [{ label: fxBtn('קבל', { ap: 3, rep: 5 }), cls: 'good', fn: () => { applyPeace(w, p.kind, S.player, p.from, p.share); after(); } }, { label: 'דחה', fn: after }] });
  } else if (p.type === 'demand') {
    modal({ title: 'דרישה מ' + nm(p.from), html: '<p>' + nm(p.from) + ' מוכנה לסיים את המלחמה אם נוותר על ' + pct(p.share * 100) + ' משטחנו ומאוכלוסייתנו.</p><p class="sub">אם נסרב — הלחימה תימשך.</p>',
      buttons: [{ label: fxBtn('קבל את התנאים', { ap: -5, rep: 3 }), cls: 'danger', fn: () => { applyPeace(w, 'terr', p.from, S.player, p.share); after(); } }, { label: 'נמשיך להילחם', fn: after }] });
  } else processPending();
}
function applyPeace(w, kind, win, lose, share) {
  if (!S.wars.includes(w)) return;
  const pl = involvesPlayer(w);
  if (kind === 'repar') {
    const amt = S.c[lose].gdp * 0.04;
    if (win === S.player) S.p.treasury += amt; if (lose === S.player) S.p.treasury -= amt;
    addNews(nm(lose) + ' הסכימה לשלם פיצויים ל' + nm(win) + '. המלחמה הסתיימה.', win === S.player ? 'good' : 'bad');
  } else if (kind === 'terr') {
    cede(win, lose, share);
    addNews(nm(lose) + ' ויתרה על ' + Math.round(share * 100) + '% משטחה ל' + nm(win) + '. נחתם הסכם שלום.', win === S.player ? 'good' : 'bad');
  } else if (kind === 'annex') {
    endWar(w, win === S.player ? 'won' : 'lost'); annex(win, lose); return;
  } else if (kind === 'cease') {
    w.pause = 183; if (pl) fxToast('הפסקת אש', { rep: 2 });
    addNews('הוסכם על הפסקת אש של חצי שנה עם ' + nm(enemyLeaderFor(w, S.player)) + '.', 'good'); return;
  } else addNews('נחתם הסכם שלום עם ' + nm(enemyLeaderFor(w, S.player)) + '. החיילים חוזרים הביתה.', 'good');
  // peace is good for the people and for the world's view of us
  if (pl) fxToast('הסכם שלום', { ap: 3, rep: kind === 'terr' && win === S.player ? 2 : 5 });
  endWar(w, kind === 'white' ? 'peace' : win === S.player ? 'won' : lose === S.player ? 'lost' : 'peace');
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
  // world reputation matters: trusted leaders get deals, pariahs get refusals
  const rp = (S.p.rep - 50) * (A.gov === 'democracy' ? 0.4 : 0.2);
  const lowRep = S.p.rep < 30 ? 'המוניטין שלך בעולם נמוך מדי' : null;
  if (type === 'trade') return { ok: r + 15 + shared * 5 + rp - (sanc ? 60 : 0) - friendFoe + noise > 5, why: sanc ? 'יש ביניכם סנקציות' : lowRep || 'היחסים לא מספיק טובים' };
  if (type === 'nap') return { ok: r + 30 + rp + (pw > 1.5 ? 15 : 0) - friendFoe + noise > 10, why: lowRep || 'הם לא סומכים עליך' };
  if (type === 'alliance') return { ok: r + shared * 8 + rp + Math.min(20, pw * 8) - mis * 15 - myWars.length * 12 + common - friendFoe - (sanc ? 50 : 0) + noise > 60, why: myWars.length ? 'הם לא רוצים להיגרר למלחמות שלך' : lowRep || 'צריך יחסים טובים מאוד (מעל 60) ואינטרסים משותפים' };
  return { ok: true };
}
const ACT = {
  tab: d => openTabFresh(d.tab),
  close: () => openTab(null),
  gotowars: () => openTabFresh('wars'),
  help: showHelp,
  menu: showMenu,
  speed: d => setSpeed(+d.v),
  gift: () => { const o = selOwner(), g = giftAmt(), C = S.c[o]; if (cdLeft('gift:' + o)) return; const e = { rep: giftRep(o), rel: { [o]: giftRel(o) } }; if (!spend(g)) return;
    setCd('gift:' + o, 30); fxToast('סיוע ל' + C.he, e); addNews('שלחנו סיוע הומניטרי ל' + C.he + '.', 'dip'); renderAll(); },
  trade: () => dipToggle('trade', 'הסכם סחר', { rep: 2, rel: 8 }, { rep: -1, rel: -10 }),
  nap: () => dipToggle('nap', 'הסכם אי-תוקפנות', { rep: 1, rel: 6 }, { rep: -3, rel: -12 }),
  alliance: () => dipToggle('alliance', 'ברית צבאית', { rep: 0, rel: 12 }, { rep: -4, rel: -20 }),
  sanction: () => { const o = selOwner(), C = S.c[o]; if (cdLeft('sanc:' + o)) return; setCd('sanc:' + o, 15);
    if (sanctions(S.player, o)) { delete S.sanc[S.player + '>' + o]; fxToast('הסנקציות על ' + C.he + ' הוסרו', { rel: { [o]: 6 } }); addNews('הסרנו את הסנקציות על ' + C.he + '.', 'dip'); }
    else { S.sanc[S.player + '>' + o] = 1; C.gdp *= 1 - Math.min(0.03, P().gdp / worldGdp() * 0.1); P().gdp *= 1 - Math.min(0.01, C.gdp / P().gdp * 0.002);
      setPact(o, S.player, 'trade', false); fxToast('סנקציות על ' + C.he, { rep: sancRep(o), rel: { [o]: -20 } }, sancRep(o) < 0); addNews('הטלנו סנקציות כלכליות על ' + C.he + '.', 'dip'); }
    renderAll(); },
  war: () => confirmWar(selOwner()),
  stance: d => { const w = S.wars.find(x => x.id === +d.w); if (w) { w.stance = d.v; renderSheet(); } },
  air: d => strike(d.o, 'air'),
  missile: d => strike(d.o, 'mis'),
  nuke: d => confirmNuke(d.o),
  peace: d => peaceDialog(+d.w),
  leave: d => { const w = S.wars.find(x => x.id === +d.w); if (!w) return; const lead = w.A.includes(S.player) ? w.a : w.b; archiveWar(w, 'left');
    w.A = w.A.filter(x => x !== S.player); w.B = w.B.filter(x => x !== S.player); fxToast('פרשנו מהמלחמה', { ap: 2, rep: -2, rel: { [lead]: -25 } }); addNews('פרשנו מהמלחמה מול ' + nm(enemyLeaderFor(w, lead)) + '.', 'dip'); needMapRecolor = true; renderAll(); },
  buymul: d => { buyMul = +d.v; renderSheet(); },
  buy: d => buyUnits(d.k),
  upg: d => { const k = d.k, c = P(); if ((c[k] || 0) >= 3 || S.p.queue.some(q => q.k === k)) return; const cost = upgCost(k); if (!spend(cost)) return;
    PS().sp.buy += cost; const days = k === 'mlv' ? 548 : 365; S.p.queue.push({ k, n: 1, start: S.day, due: S.day + days });
    toast('השדרוג התחיל: ' + money(cost).replace(/<[^>]+>/g, '') + ' · מוכן בעוד ' + Math.round(days / DPM) + ' חודשים'); renderAll(); },
  mob: () => { const c = P(); if (c.res < 1 || cdLeft('mob')) return; const n = Math.min(c.res, Math.max(1, c.res * 0.5));
    setCd('mob', 30); S.p.queue.push({ k: 'mobarrive', n, start: S.day, due: S.day + 3 }); c.res -= n;
    fxToast('צו 8: ' + troopsPlain(n) + ' אנשי מילואים בדרך', { ap: activeWars(S.player) ? -2 : -5 }, true); addNews('הממשלה הוציאה צווי חירום: ' + troopsPlain(n) + ' אנשי מילואים גויסו.', 'war'); renderAll(); },
  demob: () => { const c = P(); if (!(c.mob > 0)) return; const n = c.mob; c.inv.troops = Math.max(0, c.inv.troops - n); c.res += n; c.mob = 0;
    fxToast('המילואימניקים חזרו הביתה', { ap: 2 }); addNews('אנשי המילואים שוחררו וחזרו לעבודה.', 'good'); renderAll(); },
  build: d => { const k = d.k, D = PROJ[k]; if (!D || S.p.proj.some(q => q.k === k) || (S.p.built[k] || 0) >= projMax(k)) return; const cost = projCost(k); if (!spend(cost)) return;
    S.p.proj.push({ k, start: S.day, due: S.day + D.days }); toast('הפרויקט "' + D.he + '" התחיל · יושלם בעוד ' + Math.round(D.days / DPM) + ' חודשים'); addNews('הממשלה השיקה פרויקט לאומי: ' + D.he + '.', 'good'); renderAll(); },
  crack: () => { if (!S.p.built.police || cdLeft('crack')) return; const c = P(); setCd('crack', 120); S.p.crack = 91; S.p.unrest = 0;
    fxToast('ההפגנות פוזרו בכוח', { ap: 5, rep: c.gov === 'democracy' ? -12 : -7 }, true); addNews('כוחות משטרה פיזרו את ההפגנות בכוח. ארגוני זכויות אדם בעולם מגנים.', 'bad');
    alive().forEach(id => { if (id !== S.player && S.c[id].gov === 'democracy') addRel(id, S.player, -3); }); renderAll(); },
  nprog: () => modal({ title: 'תוכנית גרעין סודית', html: '<p>הפרויקט ייקח כ-36 חודשים ויעלה כסף רב כל חודש. בכל חודש יש סיכוי שהעולם יגלה — ואז יבואו סנקציות ואולי תקיפות אוויריות.</p>',
    buttons: [{ label: 'התחל', cls: 'danger', fn: () => { S.p.nprog = { m: 0, disc: false, done: false }; addNews('הממשלה אישרה בחשאי פרויקט מיוחד.', 'dip'); renderAll(); } }, { label: 'ביטול' }] }),
  nstop: () => { S.p.nprog = null; addNews('תוכנית הגרעין הוקפאה.', 'dip'); renderAll(); },
  newgame: () => modal({ title: 'משחק חדש', html: '<p>המשחק הנוכחי יימחק. להמשיך?</p>', buttons: [{ label: 'כן, משחק חדש', cls: 'danger', fn: () => { wipe(); location.reload(); } }, { label: 'ביטול' }] }),
  startpick: () => beginGame(),
  centerme: () => S && S.player && zoomToTid(S.player, 10),
  legend: () => $('#legend').classList.toggle('open'),
  /* units */
  selunit: d => selectUnit(+d.u, 4),
  umove: () => { if (unitById(selUnit)) setMode('move', selUnit); },
  uattack: () => attackDialog(unitById(selUnit)),
  ustrike: () => strikeDialog(unitById(selUnit), 'air'),
  umissile: () => strikeDialog(unitById(selUnit), 'mis'),
  ustop: () => { const u = unitById(selUnit); if (!u) return; u.dest = null; u.via = null; u.mode = null; toast(uName(u) + ' עצרה'); save(); renderAll(); },
  uret: () => { const u = unitById(selUnit); if (!u) return; sendHome(u); save(); renderAll(); },
  udefend: () => { const u = unitById(selUnit); if (!u) return; const p = defendPt(u); if (!p) { sendHome(u); return; } orderTo(u, p, 'def'); },
  usplit: () => splitUnit(unitById(selUnit)),
  umerge: () => mergeUnit(unitById(selUnit)),
  mvcancel: () => { const id = uMode && uMode.uid; endMode(); if (id) selectUnit(id); },
  /* statistics and animations */
  stats: () => { hideCard(); openTabFresh('stats'); },
  rclose: () => hideCard(),
  rshow: d => { const r = PS().log[+d.i]; if (r) showCard(r); },
  wst: d => { const id = +d.w; if (wstOpen.has(id)) wstOpen.delete(id); else wstOpen.add(id); renderSheet(); },
  fxmode: d => { setFxMode(d.v); document.querySelectorAll('[data-act=fxmode]').forEach(b => b.classList.toggle('on', b.dataset.v === FXMODE)); toast({ full: 'אנימציות מלאות', low: 'אנימציות מופחתות', off: 'בלי אנימציות' }[FXMODE]); }
};
// where to stand to defend the homeland: the part of our land closest to the main enemy
function defendPt(u) {
  const foes = warsOf(S.player).filter(w => w.pause === 0).map(w => enemyLeaderFor(w, S.player)).filter(x => S.c[x] && S.c[x].alive);
  if (!foes.length) return u.hb;
  const foe = foes.sort((a, b) => distToC(a, [u.lon, u.lat]) - distToC(b, [u.lon, u.lat]))[0];
  let best = null, bd = 1e9;
  for (const t of tidsOf(S.player)) for (const p of tp(t).in) { const d = distToC(foe, p); if (d < bd) { bd = d; best = p; } }
  return domOf(u) === 'sea' ? u.hb : best;
}
function attackDialog(u) {
  if (!u) return;
  const foes = enemiesAtWar();
  const list = foes.map(o => {
    const p = domOf(u) === 'sea' ? (snapSea(nearIn(o, [u.lon, u.lat]) || TERR[mainTid(o)].c)) : nearIn(o, [u.lon, u.lat]);
    const r = p ? planMove(u, p, 'atk') : { err: 'אין מטרה' };
    return { o, p, r };
  });
  const h = '<p>לאן לשלוח את <b>' + esc(uName(u)) + '</b>?</p>' + (list.length ? '<div class="btns col">' + list.map((x, i) => '<button class="b' + (x.r.err ? '' : ' danger') + '" data-at="' + i + '"' + (x.r.err ? ' disabled' : '') + '>' + esc(nm(x.o)) +
    '<small class="cost">' + (x.r.err ? esc(x.r.err) : (x.r.days < 1 ? 'מגיעה תוך פחות מיום' : 'הגעה בעוד ' + daysTxt(x.r.days)) + (x.r.slow < 1 ? ' · דרך הים' : '')) + '</small></button>').join('') + '</div>' : '<p class="sub">אתה לא במלחמה עם אף מדינה. אפשר לבחור מדינה על המפה — אם היא לא במלחמה איתך, תתבקש להכריז מלחמה.</p>') +
    '<p class="sub">' + (domOf(u) === 'sea' ? 'צי ליד חוף האויב חוסם אותו, מחליש את הצי שלו ומאפשר לכוחות יבשה לחצות את הים.' : domOf(u) === 'air' ? 'כנף אוויר מעל האויב מחזקת את כוחות היבשה שלנו שם (פי 2 לכל היותר). בלי כוחות יבשה — רק תקיפות.' : 'כוחות יבשה בתוך מדינת האויב כובשים שטח. ארטילריה, מטוסים וצי מחזקים אותם.') + '</p>';
  modal({ title: 'תקוף מדינה', html: h, buttons: [{ label: 'בחר על המפה', cls: 'primary', fn: () => setMode('attack', u.id) }, { label: 'ביטול' }], onShow: () => {
    document.querySelectorAll('[data-at]').forEach(b => b.onclick = () => {
      const x = list[+b.dataset.at]; modalQ.shift(); $('#modal').classList.remove('open');
      orderTo(u, x.p, 'atk'); setTimeout(showModal, 30);
    });
  } });
}
function strikeDialog(u, kind) {
  if (!u) return;
  const me = P(), rng = kind === 'air' ? AIR_RANGE : MIS_RANGE[me.mlv] || 0;
  const foes = enemiesAtWar().map(o => ({ o, d: distToC(o, [u.lon, u.lat]) }));
  const h = '<p>' + esc(uName(u)) + ' — טווח ' + num(rng) + ' ק״מ ממיקום היחידה.</p>' + (foes.length ? '<div class="btns col">' + foes.map((x, i) => '<button class="b danger" data-st="' + i + '"' + (x.d > rng ? ' disabled' : '') + '>' + esc(nm(x.o)) + '<small class="cost">' + (x.d > rng ? 'מחוץ לטווח (' + num(x.d) + ' ק״מ)' : fxLine(strikeFx(x.o, kind, true))) + '</small></button>').join('') + '</div>' : '') +
    '<p class="sub">אפשר גם לבחור מטרה על המפה — גם מדינה שאתה לא במלחמה איתה (העולם יכעס).</p>';
  modal({ title: kind === 'air' ? 'תקיפה אווירית' : 'מטח טילים', html: h, buttons: [{ label: 'בחר על המפה', cls: 'primary', fn: () => setMode(kind === 'air' ? 'strike' : 'missile', u.id) }, { label: 'ביטול' }], onShow: () => {
    document.querySelectorAll('[data-st]').forEach(b => b.onclick = () => {
      const x = foes[+b.dataset.st]; modalQ.shift(); $('#modal').classList.remove('open');
      strike(x.o, kind, u.id); setTimeout(showModal, 30);
    });
  } });
}
function splitUnit(u) {
  if (!u) return;
  const m2 = {}; let any = false;
  for (const k in u.m) {
    let half = u.m[k] / 2;
    if (k === 'carriers') half = Math.floor(u.m[k] / 2);
    if (half > 0) { m2[k] = half; u.m[k] -= half; any = true; }
  }
  if (!any) return;
  const p = [u.lon + 0.25, u.lat - 0.15];
  const v = newUnit(u.o, u.t, domOf(u) === 'sea' ? (isSeaAt(p) ? p : [u.lon, u.lat]) : (ownerAt(p[0], p[1]) === u.at ? p : [u.lon, u.lat]), m2);
  v.hb = u.hb.slice(); if (u.dest) { v.dest = u.dest.slice(); v.via = u.via ? u.via.map(q => q.slice()) : null; v.mode = u.mode; v.slow = u.slow; }
  toast(uName(u) + ' פוצלה: נוספה ' + uName(v));
  save(); selectUnit(u.id);
}
function mergeUnit(u) {
  if (!u) return;
  const ms = mergeables(u); if (!ms.length) return;
  ms.forEach(x => { for (const k in x.m) u.m[k] = (u.m[k] || 0) + x.m[k]; });
  S.units = S.units.filter(x => !ms.includes(x));
  toast(ms.length + ' יחידות אוחדו לתוך ' + uName(u));
  save(); selectUnit(u.id);
}
function buyUnits(k) {
  const B = BUY[k], c = P(); if (!B) return;
  const n = B.n * buyMul, cost = B.cost * buyMul;
  if (!spend(cost)) return;
  PS().sp.buy += cost;
  S.p.queue.push({ k, n, start: S.day, due: S.day + B.days });
  const e = k === 'troops' ? { ap: -Math.min(3, buyMul) } : {};
  fxToast('הוזמן: ' + (k === 'troops' ? num(n * 1000).replace(/<[^>]+>/g, '') + ' חיילים' : n + ' ' + B.unit) + ' · יגיע בעוד ' + Math.round(B.days / DPM) + ' חודשים', e);
  renderAll();
}
function dipToggle(type, label, good, bad) {
  const o = selOwner(), C = S.c[o];
  if (hasPact(o, S.player, type)) {
    setPact(o, S.player, type, false);
    fxToast(label + ' עם ' + C.he + ' בוטל', { rep: bad.rep, rel: { [o]: bad.rel } }, true); addNews('ביטלנו את ה' + label + ' עם ' + C.he + '.', 'dip'); renderAll(); return;
  }
  if (cdLeft('dip:' + o)) return;
  setCd('dip:' + o, 30);
  const r = aiScore(type, o);
  if (r.ok) { setPact(o, S.player, type, true); fxToast(C.he + ' הסכימה! ' + label, { rep: good.rep, rel: { [o]: good.rel } }); addNews('נחתם ' + label + ' בין ' + P().he + ' ל' + C.he + '.', 'good'); }
  else { addRel(o, S.player, -2); toast(C.he + ' סירבה: ' + r.why + ' (אפשר לנסות שוב בעוד חודש)', true); }
  renderAll();
}
function confirmWar(o, after, what) {
  if (!o || o === S.player) return;
  const C = S.c[o], j = likelyJoiners(S.player, o);
  const nap = hasPact(o, S.player, 'nap');
  let defP = power(C) * 1.3; j.forEach(c => defP += power(S.c[c]) * 0.35 * allyProj(c, o, S.player));
  const ratio = power(P()) * proj(S.player, o) / (defP + 1);
  const e = warFx(o);
  let h = (what ? '<p class="warnbox">' + esc(what) + ' נכנסת לשטח של ' + esc(C.he) + ' — זו הכרזת מלחמה.</p>' : '') + '<p>להכריז מלחמה על <b>' + C.he + '</b>?</p><ul class="plain">' +
    '<li>' + (adjacent(S.player, o) ? 'שכנה — כוחות יבשה יכולים להיכנס ישר מעבר לגבול.' : 'אין גבול יבשתי (' + num(dist(S.player, o)) + ' ק״מ) — כוחות יבשה צריכים צי שלך באזור כדי לחצות, והמלחמה יקרה ואיטית יותר.') + '</li>' +
    '<li>יחס כוחות אפקטיבי בחזית: ' + num(ratio, 1) + ' : 1 ' + (ratio > 2 ? '(טוב)' : ratio > 1 ? '(צמוד)' : '(מסוכן!)') + '</li>' +
    (j.length ? '<li class="red">צפויות להצטרף לצד האויב: ' + j.slice(0, 8).map(nm).join(', ') + (j.length > 8 ? ' ועוד ' + (j.length - 8) : '') + '</li>' : '<li>אין לה בעלות ברית שצפויות להגן עליה.</li>') +
    (nap ? '<li class="red">יש לכם הסכם אי-תוקפנות — הפרתו תפגע במוניטין שלך בכל העולם.</li>' : '') +
    (justified(o) ? '<li>יש לך סיבה: ' + (provoked(o) ? 'הם תקפו אותך או את בעלות בריתך.' : 'רוב העולם מתנגד להם.') + ' העולם יכעס פחות.</li>' : '<li class="red">מלחמה בלי סיבה — העולם יראה בך תוקפן.</li>') +
    '<li>כדי לכבוש צריך להכניס לשם כוחות יבשה (חי״ר ושריון) — הקש על יחידה שלך ← "תקוף מדינה".</li>' +
    '<li>מלחמה עולה כסף, הורגת חיילים ומעייפת את העם.</li></ul><div class="box">צפוי: ' + fxLine(e) + '</div>';
  modal({ title: 'הכרזת מלחמה', html: h, buttons: [{ label: 'הכרז מלחמה', cls: 'danger', fn: () => {
    const just = justified(o);
    const w = declareWar(S.player, o); if (w) { w.just = just; fxToast('המלחמה החלה', { ap: e.ap, rep: e.rep }, true); syncAllUnits();
      if (after) { after(); renderAll(); } else { selected = o; renderAll(); openTabFresh('wars'); setTimeout(() => zoomToTid(o, 10), 280); } }
  } }, { label: 'ביטול' }] });
}
// air strike or missile salvo, during a war or as a stand-alone attack
const sancTxt = n => n === 1 ? 'מדינה אחת הטילה עלינו סנקציות' : n + ' מדינות הטילו עלינו סנקציות';
function strike(o, kind, uid) {
  if (!o || !S.c[o] || !S.c[o].alive || o === S.player) return;
  const me = P(), E = S.c[o], sr = strikeRange(o);
  // a strike by one specific air wing / missile battery on the map: its own range and its own planes
  const su = uid != null ? unitById(uid) : null;
  if (su) {
    const have = kind === 'air' ? fl(su.m.air) : fl(su.m.msl), need = kind === 'air' ? 4 : 5;
    const rng = kind === 'air' ? AIR_RANGE : MIS_RANGE[me.mlv] || 0;
    if (have < need) { toast(kind === 'air' ? 'אין מספיק מטוסים ביחידה' : 'אין מספיק טילים ביחידה', true); return; }
    if (distToC(o, [su.lon, su.lat]) > rng) { toast('המטרה מחוץ לטווח של ' + uName(su) + ' (' + rng.toLocaleString('en-US') + ' ק״מ)', true); return; }
  } else if (kind === 'air' ? !sr.air : !sr.mis) { toast('המטרה מחוץ לטווח', true); return; }
  const ck = (kind === 'air' ? 'air:' : 'mis:') + o + (su ? ':' + su.id : ''); if (cdLeft(ck)) { toast('היחידה עוד מתארגנת — אפשר שוב בעוד ' + daysTxt(cdLeft(ck)).replace(/<[^>]+>/g, ''), true); return; }
  const w = S.wars.find(x => (x.A.includes(o) && x.B.includes(S.player)) || (x.B.includes(o) && x.A.includes(S.player)));
  if (w && w.pause > 0) { toast('יש הפסקת אש', true); return; }
  const preview = strikeFx(o, kind, !!w);
  const cost = strikeCost(kind);
  if (!spend(cost)) return;
  setCd(ck, kind === 'air' ? 14 : 20);
  const before = invSnap(E);
  let frac, lost = 0, used = 0, civ = 0;
  const dens = densF(o);
  if (kind === 'air') {
    used = su ? Math.min(sortie(), fl(su.m.air)) : sortie();
    frac = clamp(used * me.q / (E.inv.air * 0.5 + E.inv.tanks * 0.03 + 40) * 0.1, 0.004, 0.1) * (1 - 0.15 * E.adv);
    lost = Math.round(used * [0.003, 0.01, 0.025, 0.05][E.adv] * (0.5 + R()));
    me.inv.air = Math.max(0, me.inv.air - lost);
    if (su) su.m.air = Math.max(0, (su.m.air || 0) - lost);
    hurtInv(E, frac, ['air', 'heli', 'tanks', 'art', 'msl']); hurtInv(E, frac * 0.4, ['ships', 'afv']); hurtInv(E, frac * 0.15, ['troops']);
    E.gdp *= 1 - frac * 0.06;
    // precision bombs on military targets: few civilians, more in crowded countries
    civ = used * 0.25 * dens * (0.4 + R() * 0.8);
  } else {
    used = su ? Math.min(salvo(), fl(su.m.msl)) : salvo(); me.inv.msl = Math.max(0, me.inv.msl - used);
    if (su) su.m.msl = Math.max(0, (su.m.msl || 0) - used);
    const hits = used * (1 - [0, 0.25, 0.5, 0.75][E.adv]);
    frac = clamp(hits / (hits + 300) * 0.2, 0.002, 0.06);
    hurtInv(E, frac, ['air', 'art', 'msl', 'ships']); hurtInv(E, frac * 0.5, ['tanks']); hurtInv(E, frac * 0.2, ['troops']);
    E.gdp *= 1 - frac * 0.12;
    // ballistic missiles are less precise: more civilians per hit
    civ = hits * 0.7 * dens * (0.4 + R() * 0.8);
  }
  const loss = lossFrom(E, before);
  civCas(loss, Math.round(civ), 2.5 + R());
  E.pop = Math.max(0.01, E.pop - loss.ck / 1e6);
  const own = newCas(); own.sp = cost;
  if (kind === 'air') { if (lost) { own.eq.air = lost; own.sk = Math.round(lost * 0.5); own.sw = Math.round(lost * 0.3); } } else own.mu = used;
  // civilians we kill cost us in the world's eyes
  const repCiv = -Math.min(8, Math.sqrt(loss.ck) / 8);
  const what = (kind === 'air' ? 'תקיפה אווירית' : 'מטח טילים') + (su ? ' (' + uName(su) + ')' : '');
  const lp = launchPt(S.player, kind, o, su), tp_ = targetPt(o, lp);
  let fx, sancN = 0, retal = false;
  if (w) {
    const eff = clamp(power(me) / (power(E) + power(me) + 1) * 2, 0.15, 1.5) * Math.sqrt(proj(S.player, o));
    const amt = kind === 'air' ? eff : 0.75;
    // strikes only help take ground where our ground forces are already fighting
    const ground = !(w.a === S.player || w.b === S.player) || forcesIn(S.player, o, E.adv).l > 0;
    if (ground) { if (w.A.includes(S.player)) w.f += amt; else w.f -= amt; w.f = clamp(w.f, -100, 100); }
    if (kind === 'mis') alive().forEach(id => { if (id !== S.player && id !== o && isAlly(id, o)) addRel(id, S.player, -3); });
    fx = applyFx(repCiv <= -0.5 ? { rep: repCiv } : {});
  } else {
    // a stand-alone attack: the target, its friends and the world react
    alive().forEach(id => {
      if (id === S.player || id === o) return;
      if (isAlly(id, o)) addRel(id, S.player, kind === 'air' ? -15 : -12);
      else if (S.c[id].gov === 'democracy' && !justified(o)) addRel(id, S.player, -3);
    });
    if (!justified(o)) alive().forEach(id => {
      const C = S.c[id]; if (id === S.player || id === o || C.gov !== 'democracy' || C.gdp < 50 || S.sanc[id + '>' + S.player]) return;
      if (rel(id, S.player) < -30 && R() < 0.3) { S.sanc[id + '>' + S.player] = 1; sancN++; }
    });
    S.p.lastStrike = { o, day: S.day };
    fx = applyFx({ ap: preview.ap, rep: preview.rep + repCiv, rel: preview.rel });
    retal = R() < retaliateChance(o);
  }
  const r = strikeRecord({ k: kind, by: S.player, at: o, cas: loss, own, fx, unit: su ? uName(su) : null, war: !!w, used, lost, sanc: sancN });
  addNews(what + (w ? '' : ' (בלי הכרזת מלחמה)') + ' ב' + E.he + ': ' + nT(killed(loss)) + ' הרוגים' + (eqTxt(loss.eq, 3) ? ', הושמדו ' + eqTxt(loss.eq, 3) : '') + (lost ? '. איבדנו ' + lost + ' מטוסים' : '') + '.' + (sancN ? ' ' + sancTxt(sancN) + '.' : ''), 'war');
  if (sancN) toast(sancTxt(sancN), true);
  if (retal) {
    const nw = declareWar(o, S.player, { provoked: true, joinAtt: true, noRally: true });
    if (nw) { addNews(E.he + ' הגיבה לתקיפה והכריזה עלינו מלחמה!', 'war'); r.retal = true; }
  }
  if (w) checkWarEnd(w);
  fxStrike(kind, lp, tp_, used, r);
  needMapRecolor = true;
  save(); renderAll();
}
function confirmNuke(o) {
  if (!o || !S.c[o] || !S.c[o].alive || P().nukes <= 0) return;
  if (!strikeRange(o).nuke) { toast('אין אמצעי שיגור בטווח', true); return; }
  const w = S.wars.find(x => (x.A.includes(o) && x.B.includes(S.player)) || (x.B.includes(o) && x.A.includes(S.player)));
  const ret = alive().filter(id => id !== S.player && S.c[id].nukes > 0 && (id === o || isAlly(id, o)));
  const h = '<div class="nukewarn"><p><b>אתה עומד לשגר נשק גרעיני על ' + nm(o) + (w ? '' : ' — בלי שאנחנו במלחמה איתה') + '.</b></p><ul class="plain">' +
    '<li>מיליוני אזרחים ייפגעו.</li><li>כל העולם יפנה נגדך: יחסים יקרסו וסנקציות יוטלו כמעט מכל מדינה. המוניטין שלך ' + sgn(-50) + '.</li>' +
    (ret.length ? '<li class="red">מדינות גרעיניות שעלולות להשיב: ' + ret.slice(0, 6).map(nm).join(', ') + '. תגובה גרעינית עלולה להחריב את המדינה שלך.</li>' : '<li>לאויב ולבעלות בריתו אין נשק גרעיני — אבל העולם לא ישכח.</li>') +
    (w ? '' : '<li class="red">' + nm(o) + ' ובעלות בריתה כמעט בוודאות יכריזו עלינו מלחמה.</li>') +
    '<li>העם שלך יהיה בהלם — תמיכה תצנח.</li></ul><label class="chk"><input type="checkbox" id="nukeok"> אני מבין את ההשלכות</label></div>';
  modal({ title: 'אזהרה: תקיפה גרעינית', cls: 'danger', html: h, buttons: [
    { label: 'שגר', cls: 'nuke', keep: true, fn: () => {
      if (!$('#nukeok') || !$('#nukeok').checked) { toast('סמן קודם שאתה מבין את ההשלכות', true); return; }
      modalQ.shift(); $('#modal').classList.remove('open');
      if (!S.c[o].alive || P().nukes <= 0) return;
      P().nukes--; const nr = nukeImpact(S.player, o, false);
      nr.fx = applyFx({ rep: -50 });
      if (w && S.wars.includes(w)) { if (w.A.includes(S.player)) w.f += 35; else w.f -= 35; w.f = clamp(w.f, -100, 100); checkWarEnd(w); }
      else if (!w && S.c[o].alive && R() < 0.9) declareWar(o, S.player, { provoked: true, joinAtt: true, noRally: true });
      approvalQuick(); save(); renderAll();
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
  let h = '<p>מה להציע ל' + nm(en) + '? כרגע אנחנו ' + (fp >= 0 ? 'מחזיקים ' + Math.round(fp) + '% משטחם.' : 'מאבדים — הם מחזיקים ' + Math.round(-fp) + '% משטחנו.') + '</p><p class="sub">ככל שאתה מנצח יותר — הם יסכימו לתנאים קשים יותר. שלום: העם ' + sgn(3) + ' · העולם ' + sgn(5) + '.</p><div class="btns col">';
  opts.forEach(([k, l, ok]) => { h += '<button class="b" data-pk="' + k + '"' + (ok ? '' : ' disabled') + '>' + l + '</button>'; });
  h += '</div>';
  modal({ title: 'משא ומתן', html: h, buttons: [{ label: 'סגור' }], onShow: () => {
    document.querySelectorAll('[data-pk]').forEach(b => b.onclick = () => {
      const k = b.dataset.pk; modalQ.shift(); $('#modal').classList.remove('open');
      const age = S.turn - w.start, E = S.c[en];
      const pr = power(P()) / (power(E) + 1);
      let W = fp * 1.2 + age * 0.8 + clamp((pr - 1) * 10, -15, 25) + rel(en, S.player) / 5 + (100 - E.approval) / 10 + (S.p.rep - 50) / 5 + (R() - 0.5) * 20;
      if (fp < 0) W += fp * 0.5;
      const need = { cease: 0, white: 10, repar: 35, terr: 40, annex: 60 }[k];
      if (W > need || (k === 'annex' && fp >= 90)) { applyPeace(w, k, S.player, en, Math.max(0, fp) / 200); toast(nm(en) + ' הסכימה!'); }
      else { toast(nm(en) + ' דחתה את ההצעה', true); addNews(nm(en) + ' דחתה את הצעת ה' + (k === 'cease' ? 'הפסקת אש' : 'שלום') + ' שלנו.', 'bad'); }
      save(); renderAll(); setTimeout(showModal, 30);
    });
  } });
}
function showGameOver() {
  if (showGameOver.done) return; showGameOver.done = true;
  modal({ title: 'סוף המשחק', cls: 'danger', html: '<p>' + esc(S.over.txt) + '</p><p>שרדת ' + S.turn + ' חודשים (עד ' + esc(dayTxt(S.day)) + '). ניקוד סופי: <b>' + num(score()) + '</b></p>',
    buttons: [{ label: 'משחק חדש', cls: 'primary', fn: () => { wipe(); location.reload(); } }, { label: 'הסתכל על המפה' }] });
}
function showHelp() {
  modal({ title: 'איך משחקים', html:
    '<ul class="plain help">' +
    '<li><b>המטרה:</b> לשרוד ולהגדיל את המדינה שלך עד 2036, או לשלוט ב-35% מהכלכלה העולמית.</li>' +
    '<li><b>הזמן רץ:</b> השעון למעלה מתקדם לבד. ⏸ עוצר, ×1 = יום בשנייה, ×2/×4/×8 מהר יותר. כסף נכנס כל יום. כשקורה משהו חשוב (מלחמה, הצעת שלום, אסון) המשחק נעצר ושואל אותך.</li>' +
    '<li><b>העם (אהבת העם):</b> מתחת ל-30% — הפגנות. מתחת ל-15% כמה חודשים — מהפכה ואתה בחוץ. מסים גבוהים, קיצוץ ברווחה, גיוס, הרוגים ומלחמות ארוכות מורידים. מסים נמוכים, רווחה, פרויקטים וניצחונות מעלים. כשתוקפים אותך — העם מתלכד.</li>' +
    '<li><b>מוניטין עולמי (0–100):</b> איך העולם רואה אותך. תקיפות בלי סיבה, מלחמה, הפרת הסכמים, גרעין, סיפוח ודיכוי מורידים. סיוע, עזרה באסונות, שלום, סחר ופליטים מעלים. מוניטין נמוך = סנקציות, סירובים ואויבים.</li>' +
    '<li><b>לפני כל פעולה</b> כתוב על הכפתור מה יקרה (למשל: העם −2 · העולם −10), ואחרי הפעולה קופצת הודעה עם התוצאה.</li>' +
    '<li><b>כלכלה:</b> מס, רווחה ותקציב ביטחון. אפשר להיכנס לחוב, אבל חוב גדול מדי = פשיטת רגל.</li>' +
    '<li><b>בית:</b> פרויקטים (בתי חולים, בתי ספר, תשתיות, דיור, אנרגיה ירוקה ועוד) עולים כסף ולוקחים זמן, ואז משפרים את העם או את הצמיחה.</li>' +
    '<li><b>צבא:</b> מספרים אמיתיים — חיילים, טנקים, מטוסים, ספינות. קונים בלשונית צבא, וזה מגיע אחרי זמן ייצור (מטוס — שנה, ספינה — שנתיים). מילואים מגיעים תוך ימים, אבל העם והכלכלה סובלים.</li>' +
    '<li><b>מפה:</b> צבוט כדי להגדיל, גרור כדי לזוז, הקש על מדינה כדי לפתוח אותה, הקש על סמל של יחידה כדי לפקד עליה. צהוב = אתה, כחול = בעלות ברית, אדום = במלחמה איתך.</li>' +
    '<li><b>דיפלומטיה:</b> הקש על מדינה: סיוע, סחר, ברית, אי-תוקפנות, סנקציות או מלחמה. אחרי ניסוי שנכשל — מחכים חודש.</li>' +
    '<li><b>תקיפות:</b> אפשר לתקוף מהאוויר או בטילים כל מדינה בטווח — גם בלי מלחמה. זה פוגע בצבא שלהם, אבל העולם כועס והם עלולים להכריז מלחמה.</li>' +
    '<li><b>יחידות על המפה:</b> הצבא שלך מופיע על המפה כסמלים קטנים בצהוב — חי״ר, שריון, ארטילריה, טילים, מטוסים, מסוקים, ציים וצוללות (המקרא למטה משמאל). המספר מתחת לסמל = כמה יש ביחידה (למשל 120K חיילים, 450 טנקים, 60✈ מטוסים).</li>' +
    '<li><b>להזיז יחידה:</b> הקש על הסמל ← "הזז" ← הקש על היעד במפה. קו מקווקו מראה את הדרך וכמה ימים זה ייקח. חי״ר עובר כ-30 ק״מ ביום, שריון כ-40, ספינות כ-500, ומטוסים מגיעים תוך יום (עד 2,500 ק״מ מבסיס או מנושאת מטוסים).</li>' +
    '<li><b>ים:</b> כוחות יבשה הולכים רק ביבשה, לשכנות. כדי לחצות ים (למשל לאי) — קודם שלח צי שלך לאזור, ואז כוחות היבשה יעברו (לאט יותר).</li>' +
    '<li><b>פקודות נוספות:</b> "תקוף מדינה" שולח את היחידה לתוך מדינת אויב. "הגן על הבית" — לגבול מול האויב. "חזור הביתה", "פצל לשתיים" ו"אחד" יחידות שעומדות באותו מקום. כנף אוויר יכולה גם לבצע תקיפה אווירית.</li>' +
    '<li><b>מלחמה:</b> כדי לכבוש שטח צריך להכניס כוחות יבשה (חי״ר ושריון) לתוך מדינת האויב. ארטילריה, מטוסים ומסוקים מחזקים אותם, וצי ליד החוף חוסם ומגן על הכוחות שחוצים את הים. בלי כוחות יבשה בפנים — אפשר רק לתקוף מהאוויר ובטילים. כבשת 100% — המדינה מסופחת. אבדות מורידות חיילים, טנקים ומטוסים מהיחידות שנלחמות.</li>' +
    '<li><b>האויב:</b> יחידות האויב בסמלים אדומים. הן מגינות, ולפעמים פולשות למדינה שלך — השאר כוח בבית! כשהמפה רחוקה, יחידות באותה מדינה מתאחדות לסמל אחד עם מספר; הקש עליו או הגדל את המפה כדי לראות כל יחידה. ⚔ = קרב בין מדינות אחרות.</li>' +
    '<li><b>שלום:</b> בלשונית מלחמות. ככל שאתה מנצח יותר, תוכל לדרוש יותר.</li>' +
    '<li><b>אבדות וסטטיסטיקות:</b> אחרי כל תקיפה (שלך או עליך) קופץ כרטיס "תוצאות התקיפה": הרוגים ופצועים — חיילים ואזרחים — ציוד שהושמד, עלות, ומה זה עשה לעם ולעולם. בלשונית מלחמות יש לכל מלחמה גרפים ויומן קרבות, ובתפריט ☰ ← "סטטיסטיקות" — כל המספרים שלך ושל העולם.</li>' +
    '<li><b>מחיר הדם:</b> חיילים שנהרגים מורידים את אהבת העם, ואזרחים שלנו שנהרגים — עוד יותר. אזרחים שאנחנו הורגים (בעיקר בטילים ובגרעין) פוגעים במוניטין בעולם.</li>' +
    '<li><b>אנימציות:</b> טילים, מטוסים, פיצוצים וקרבות מופיעים על המפה. בתפריט ☰ אפשר להפחית או לכבות אותן.</li>' +
    '<li><b>מדינות קטנות קשות יותר.</b> המשחק נשמר אוטומטית כל כמה שניות.</li></ul>' });
}
function showMenu() {
  const fxSeg = '<h3 class="mh">אנימציות (פיצוצים וקרבות)</h3><div class="seg">' + [['full', 'מלאות'], ['low', 'מופחתות'], ['off', 'כבויות']].map(([v, l]) => '<button class="' + (FXMODE === v ? 'on' : '') + '" data-act="fxmode" data-v="' + v + '">' + l + '</button>').join('') + '</div>';
  modal({ title: 'תפריט', html: '<div class="btns col">' + btn('help', 'איך משחקים') + btn('stats', 'סטטיסטיקות ואבדות') + btn('centerme', 'מרכז את המפה על המדינה שלי') + btn('newgame', 'משחק חדש', 'danger') + '</div>' + fxSeg + '<p class="sub">"מופחתות" — רק פיצוץ קצר במקום הפגיעה, בלי הבזקים ורעידות. המשחק נשמר אוטומטית כל כמה שניות.</p>',
    buttons: [{ label: 'סגור' }], onShow: () => document.querySelectorAll('#m-body .btns [data-act]').forEach(b => b.addEventListener('click', () => { modalQ.shift(); $('#modal').classList.remove('open'); setTimeout(showModal, 30); }, { once: true })) });
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
    '<div><small>חיילים</small>' + troopsTxt(c.inv.troops) + '</div><div><small>טנקים</small>' + cnt(c.inv.tanks) + '</div><div><small>מטוסי קרב</small>' + cnt(c.inv.air) + '</div>' +
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
  S.speed = 1;
  selected = null; save(); renderAll(); homeView(16);
  modal({ title: 'ברוך הבא, מנהיג ' + P().he, html: '<p>1 בינואר 2026. העולם מתוח. <b>הזמן רץ</b> — יום אחד בשנייה. אפשר לעצור (⏸) או להאיץ (×2, ×4, ×8) בכפתורים למעלה.</p><p>הצבא שלך מופיע על המפה כ<b>סמלים צהובים</b> — הקש על סמל כדי להזיז יחידה, לתקוף או להגן.</p><p>טיפ: התחל מלשונית <b>כלכלה</b>, שמור על העם מרוצה ועל המוניטין שלך בעולם, ובנה בריתות לפני שאתה יוצא למלחמה.</p>',
    buttons: [{ label: 'איך משחקים?', fn: showHelp }, { label: 'קדימה', cls: 'primary' }] });
}

/* ================= clock ================= */
function setSpeed(v) {
  if (!S || !S.player) return;
  S.speed = SPEEDS.includes(v) ? v : 0;
  if (S.speed) S.lastSpeed = S.speed;
  renderTop();
}
let sliderT0 = null;
let lastT = 0, acc = 0, lastUi = 0, lastSheet = 0, lastSave = 0, uiBusy = 0;
const LIVE_TABS = { eco: 1, home: 1, mil: 1, wars: 1, country: 1, news: 1, unit: 1, ulist: 1, stats: 1 };
function frame(t) {
  requestAnimationFrame(frame);
  const dt = lastT ? Math.min(0.25, (t - lastT) / 1000) : 0; lastT = t;
  if (!S || !S.player) return;
  let ticked = 0;
  if (!S.over && S.speed > 0 && !modalOpen() && !S.pending.length) {
    acc += dt * S.speed;
    while (acc >= 1 && ticked < 8 && !S.over) {
      dayTick(); acc -= 1; ticked++;
      if (S.pending.length) { acc = 0; break; } // something important happened: stop and ask
    }
  }
  if (!modalOpen()) {
    if (S.over) showGameOver();
    else if (S.pending.length) { processPending(); renderTop(); }
  }
  if (ticked && t - lastUi > 120) { lastUi = t; renderTop(); }
  if (tab && LIVE_TABS[tab] && ticked && t - lastSheet > 1000 && t > uiBusy) { lastSheet = t; renderSheet(); }
  if (needMapRecolor && t - lastRecolor > 600) recolor();
  // the units layer is the only thing animated per frame (≈30 fps while units move)
  if (S.units && gIcons) {
    const moving = S.speed > 0 && !modalOpen() && S.units.some(u => u.dest || u.px !== u.lon || u.py !== u.lat);
    if (unitsDirty || (ticked && t - lastUnitsDraw > 100) || (moving && t - lastUnitsDraw > 33) || (hitUntil > t - 150 && t - lastUnitsDraw > 60)) drawUnits();
  }
  fxFrame(t, dt);
  if (t - lastSave > 5000) { lastSave = t; save(); }
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
  initRaster();
  buildStartRel();
  const resumed = load();
  if (!resumed) newGame(null);
  initMap();
  document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (!b || b.disabled) return; const f = ACT[b.dataset.act]; if (f) f(b.dataset); });
  document.addEventListener('input', e => {
    const k = e.target.dataset && e.target.dataset.slider; if (!k || !S.p) return;
    if (sliderT0 == null) sliderT0 = approvalTarget();
    S.p[k] = +e.target.value / 1000;
    const lbl = $('#sv-' + k); if (lbl) lbl.textContent = (S.p[k] * 100).toFixed(k === 'defPct' ? 1 : 0) + '%';
    const apt = $('#apt'); if (apt) apt.innerHTML = pct(approvalTarget());
    uiBusy = performance.now() + 1500;
  });
  document.addEventListener('change', e => {
    const k = e.target.dataset && e.target.dataset.slider; if (!k) return;
    save();
    const T = approvalTarget(), d = T - (sliderT0 == null ? T : sliderT0); sliderT0 = null;
    toast({ tax: 'מס', welfare: 'רווחה', defPct: 'תקציב ביטחון' }[k] + ' ⁦' + (S.p[k] * 100).toFixed(k === 'defPct' ? 1 : 0) + '%⁩: העם ' + (Math.abs(d) < 0.5 ? 'בלי שינוי' : sgnT(d) + ' בהדרגה') + ' (צפי ⁦' + Math.round(T) + '%⁩)', d < -0.5);
  });
  // don't redraw the panel under the player's finger
  const sheet = $('#sheet');
  ['pointerdown', 'touchstart', 'wheel', 'scroll'].forEach(ev => sheet.addEventListener(ev, () => { uiBusy = performance.now() + 1200; }, { passive: true, capture: true }));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
  window.addEventListener('pagehide', save);
  $('#loading').remove();
  if (resumed) {
    $('#app').classList.add('playing');
    // coming back to a saved game: start paused so nothing happens before the player looks
    if (S.speed) S.lastSpeed = S.speed;
    S.speed = 0;
    renderAll(); homeView(10);
    if (S.over) showGameOver();
    else toast('ברוך השב! המשחק מושהה — לחץ ×1 כדי להמשיך');
    if (UNITS_MIGRATED) setTimeout(() => toast('חדש: הצבא שלך מופיע על המפה כיחידות — הקש על סמל כדי לתת פקודה'), 600);
  } else {
    recolor(); initStart();
    if (OLD_SAVE_FOUND) setTimeout(() => toast('המשחק עודכן לזמן אמת — מתחילים משחק חדש'), 400);
  }
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => {
    const box = $('#map'); if (Math.abs(box.clientWidth - W) < 40 && Math.abs(box.clientHeight - H) < 120) return;
    d3.select('#mapsvg').remove(); for (const k in pathByTid) delete pathByTid[k]; curK = 1; initMap(); drawMarks.k = null; recolor();
  }, 300); });
  requestAnimationFrame(frame);
  window.__W26 = { get S() { return S; }, dayTick, FX: { enemyStrike, nukeImpact, showCard, hideCard, setFxMode, get n() { return FXL.length; }, get mode() { return FXMODE; }, PS, WST, warSt }, runDays: n => { for (let i = 0; i < n && !S.over; i++) dayTick(); renderAll(); }, declareWar, annex, power, rel, ACT, setSpeed, strike,
    selectTid: t => { selected = t; recolor(); openTab('country'); }, zoomToTid, processPending, wipe,
    U: { unitById, unitsOf, planMove, orderTo, commitMove, selectUnit, setMode, modeTap, syncAllUnits, buildItems, uStr, distToC, nearIn, tidAt, ownerAt, isSeaAt, snapSea, toScreen, drawUnits, zoomToMapPt, tp, mapProj: p => MAP_PROJ(p),
      get curK() { return curK; }, get uMode() { return uMode; }, get selUnit() { return selUnit; } } };
}
window.addEventListener('DOMContentLoaded', () => {
  loadScript('countries-data.js').catch(() => loadScript('countries-data.sample.js')).catch(() => { window.COUNTRY_DATA = {}; }).then(boot);
});
})();
