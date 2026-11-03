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
  needMapRecolor = true;
  if (!opt.provoked) noteGrievance(att, def);
  if (def === S.player && S.p && !opt.silent) {
    // rally around the flag: an attacked nation unites behind its leader
    S.p.shock += 6;
    S.pending.push({ type: 'attacked', wid: w.id, from: att });
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
function endWar(w) {
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
function playerEconomy() {
  const c = P(), p = S.p;
  const b = budgetDay();
  p.treasury += b.net; p.lastDay = b;
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
  if (casK > 0) p.shock -= Math.min(0.4, 25 * casK / Math.max(0.5, c.pop));
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
        const s = pick(strikers); np.m = Math.max(0, np.m - 8); hurtInv(c, 0.03, ['air', 'msl']); p.shock += 2; noteGrievance(s, S.player);
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

/* ================= time ================= */
let needMapRecolor = false;
// one game day: money, fighting, mood and deliveries; a new month also runs the slower world logic
function dayTick() {
  if (!S || S.over) return;
  playerEconomy();
  aiEconomy();
  S.wars.slice().forEach(w => { if (S.wars.includes(w) && !S.over) battle(w); });
  if (!S.over) approvalStep();
  if (!S.over) deliveries();
  S.day++;
  const m = monthOf(S.day);
  if (m !== S.turn && !S.over) monthTick(m);
}
function monthTick(m) {
  const p = S.p, c = P();
  S.wars.forEach(frontNews);
  if (S.recession > 0) S.recession--;
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
function nukeImpact(att, tgt, ai) {
  const T = S.c[tgt], A = S.c[att];
  T.pop *= 0.94; T.gdp *= 0.65; hurtInv(T, 0.3, ['troops']); hurtInv(T, 0.5, ['tanks', 'afv', 'art', 'air', 'heli', 'ships', 'subs', 'msl']); T.approval = clamp(T.approval - 20, 0, 100);
  noteGrievance(att, tgt);
  if (att !== S.player && S.p) S.pending.push({ type: 'nukealert', att, tgt });
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
    A.pop *= 0.92; A.gdp *= 0.6; hurtInv(A, 0.25, ['troops']); hurtInv(A, 0.4, ['tanks', 'afv', 'art', 'air', 'heli', 'ships', 'subs', 'msl']);
    if (att === S.player) S.p.shock -= 35;
    addNews('☢ תגובה גרעינית: ' + nm(r) + ' השיבה במכה גרעינית על ' + A.he + '.', 'war');
  }
  if (att === S.player) S.p.shock -= 20;
  if (tgt === S.player) S.p.shock -= 15;
  needMapRecolor = true;
}

/* ================= save / load ================= */
let WIPED = false;
function save() { if (!S || !S.player || WIPED) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }
let OLD_SAVE_FOUND = false;
function load() {
  // saves from the old turn-based version can't be continued: drop them and start fresh
  try { OLD_SAVE_KEYS.forEach(k => { if (localStorage.getItem(k)) { OLD_SAVE_FOUND = true; localStorage.removeItem(k); } }); } catch (e) { /* ignore */ }
  try { const s = localStorage.getItem(SAVE_KEY); if (!s) return false; const o = JSON.parse(s);
    if (!o || o.v !== VERSION || !o.player || !o.c || !o.c[o.player] || !o.c[o.player].inv || !o.p || o.day == null) { OLD_SAVE_FOUND = true; localStorage.removeItem(SAVE_KEY); return false; }
    S = o; BASE.clear(); rebuildOwn(); return true;
  } catch (e) { return false; }
}
function wipe() { WIPED = true; try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }

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
  selected = t; recolor();
  openTab('country');
}

/* ================= UI ================= */
let tab = null;
function renderAll() {
  if (!S || !S.player) return;
  renderTop(); recolor(); if (tab) renderSheet();
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
  tab = (tab === t && t !== 'country') ? null : t;
  document.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
  $('#sheet').classList.toggle('open', !!tab);
  if (tab) renderSheet();
}
function renderSheet() {
  const el = $('#sheet-body'); if (!el) return;
  const fn = { country: viewCountry, eco: viewEco, home: viewHome, mil: viewMil, wars: viewWars, news: viewNews }[tab];
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

/* ---- wars ---- */
function frontBars(w) {
  const fp = mySideFront(w, S.player);
  return '<div class="front"><div class="fl"><small>שטח האויב בידינו</small><div class="prog g"><div style="width:' + Math.max(0, fp) + '%"></div></div>' + pct(Math.max(0, fp)) + '</div>' +
    '<div class="fl"><small>שטחנו בידי האויב</small><div class="prog r"><div style="width:' + Math.max(0, -fp) + '%"></div></div>' + pct(Math.max(0, -fp)) + '</div></div>';
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
  let h = '<h2>המלחמות שלך</h2>';
  if (!mine.length) h += '<p class="hint">אתה לא במלחמה. כדי להכריז מלחמה או לתקוף — בחר מדינה במפה. שכנות קלות לתקוף; מדינות רחוקות יקרות וקשות.</p>';
  mine.forEach(w => {
    const en = enemyLeaderFor(w, S.player), side = w.A.includes(S.player) ? w.A : w.B, other = w.A.includes(S.player) ? w.B : w.A;
    h += '<div class="card war"><h3>נגד ' + esc(nm(en)) + (w.pause > 0 ? ' ' + chip('הפסקת אש', 'teal') : '') + '</h3>' +
      '<p class="sub">מאז ' + (w.startDay != null && w.startDay >= 0 ? dayTxt(w.startDay) : dateTxt(w.start)) + ' · כוחנו: ' + num(power(P())) + ' · כוחם: ' + num(power(S.c[en])) +
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
  if (!S.pending.length || S.over || modalOpen()) return;
  const p = S.pending.shift();
  const w = p.wid != null ? S.wars.find(x => x.id === p.wid) : null;
  const after = () => { save(); renderAll(); setTimeout(processPending, 40); };
  if (p.type === 'win') { modal({ title: 'ניצחון!', html: '<p>' + p.txt + '</p><p>הניקוד שלך: ' + num(score()) + '. אפשר להמשיך לשחק.</p>', buttons: [{ label: 'המשך לשחק', cls: 'primary', fn: after }] }); return; }
  if (p.type === 'attacked') {
    if (!w) return processPending();
    const side = w.B.filter(x => x !== S.player), foes = w.A.filter(x => x !== p.from);
    modal({ title: 'מלחמה! ' + esc(nm(p.from)) + ' תקפה אותנו', cls: 'danger', html: '<p><b>' + esc(nm(p.from)) + '</b> הכריזה מלחמה על ' + esc(P().he) + '.</p><ul class="plain">' +
      '<li>העם מתלכד סביב הדגל: אהבת העם ' + sgn(6) + '.</li>' +
      (side.length ? '<li>לצדנו נלחמות: ' + side.slice(0, 6).map(nm).join(', ') + '</li>' : '<li>אף מדינה לא הצטרפה לצדנו (עדיין).</li>') +
      (foes.length ? '<li class="red">לצד האויב: ' + foes.slice(0, 6).map(nm).join(', ') + '</li>' : '') +
      '<li>כוחם: ' + num(power(S.c[p.from])) + ' · כוחנו: ' + num(power(P())) + '</li></ul><p class="sub">אפשר לגייס מילואים בלשונית צבא, לתקוף בחזרה או להציע שלום מלשונית מלחמות.</p>',
      buttons: [{ label: 'השאר מושהה ותכנן', cls: 'primary', fn: () => { setSpeed(0); openTabFresh('wars'); after(); } }, { label: 'המשך', fn: after }] });
    return;
  }
  if (p.type === 'nukealert') {
    modal({ title: '☢ פיצוץ גרעיני', cls: 'danger', html: '<p><b>' + esc(nm(p.att)) + '</b> שיגרה נשק גרעיני על <b>' + esc(nm(p.tgt)) + '</b>. מיליונים נפגעו והעולם בהלם.</p>' +
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
    modal({ title: 'בקשת עזרה: ' + esc(p.kind) + ' ב' + esc(C.he), html: '<p>' + esc(p.kind) + ' פגעה קשות ב' + esc(C.he) + '. אלפים איבדו את בתיהם, והממשלה שם מבקשת סיוע מהעולם.</p>',
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
    endWar(w); annex(win, lose); return;
  } else if (kind === 'cease') {
    w.pause = 183; if (pl) fxToast('הפסקת אש', { rep: 2 });
    addNews('הוסכם על הפסקת אש של חצי שנה עם ' + nm(enemyLeaderFor(w, S.player)) + '.', 'good'); return;
  } else addNews('נחתם הסכם שלום עם ' + nm(enemyLeaderFor(w, S.player)) + '. החיילים חוזרים הביתה.', 'good');
  // peace is good for the people and for the world's view of us
  if (pl) fxToast('הסכם שלום', { ap: 3, rep: kind === 'terr' && win === S.player ? 2 : 5 });
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
  leave: d => { const w = S.wars.find(x => x.id === +d.w); if (!w) return; const lead = w.A.includes(S.player) ? w.a : w.b;
    w.A = w.A.filter(x => x !== S.player); w.B = w.B.filter(x => x !== S.player); fxToast('פרשנו מהמלחמה', { ap: 2, rep: -2, rel: { [lead]: -25 } }); addNews('פרשנו מהמלחמה מול ' + nm(enemyLeaderFor(w, lead)) + '.', 'dip'); needMapRecolor = true; renderAll(); },
  buymul: d => { buyMul = +d.v; renderSheet(); },
  buy: d => buyUnits(d.k),
  upg: d => { const k = d.k, c = P(); if ((c[k] || 0) >= 3 || S.p.queue.some(q => q.k === k)) return; const cost = upgCost(k); if (!spend(cost)) return;
    const days = k === 'mlv' ? 548 : 365; S.p.queue.push({ k, n: 1, start: S.day, due: S.day + days });
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
  legend: () => $('#legend').classList.toggle('open')
};
function buyUnits(k) {
  const B = BUY[k], c = P(); if (!B) return;
  const n = B.n * buyMul, cost = B.cost * buyMul;
  if (!spend(cost)) return;
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
function confirmWar(o) {
  if (!o || o === S.player) return;
  const C = S.c[o], j = likelyJoiners(S.player, o);
  const nap = hasPact(o, S.player, 'nap');
  let defP = power(C) * 1.3; j.forEach(c => defP += power(S.c[c]) * 0.35 * allyProj(c, o, S.player));
  const ratio = power(P()) * proj(S.player, o) / (defP + 1);
  const e = warFx(o);
  let h = '<p>להכריז מלחמה על <b>' + C.he + '</b>?</p><ul class="plain">' +
    '<li>' + (adjacent(S.player, o) ? 'שכנה — הצבא יכול לפעול במלוא הכוח.' : 'מדינה רחוקה (' + num(dist(S.player, o)) + ' ק״מ) — רק חלק מהכוח יגיע, והעלות גבוהה.') + '</li>' +
    '<li>יחס כוחות אפקטיבי בחזית: ' + num(ratio, 1) + ' : 1 ' + (ratio > 2 ? '(טוב)' : ratio > 1 ? '(צמוד)' : '(מסוכן!)') + '</li>' +
    (j.length ? '<li class="red">צפויות להצטרף לצד האויב: ' + j.slice(0, 8).map(nm).join(', ') + (j.length > 8 ? ' ועוד ' + (j.length - 8) : '') + '</li>' : '<li>אין לה בעלות ברית שצפויות להגן עליה.</li>') +
    (nap ? '<li class="red">יש לכם הסכם אי-תוקפנות — הפרתו תפגע במוניטין שלך בכל העולם.</li>' : '') +
    (justified(o) ? '<li>יש לך סיבה: ' + (provoked(o) ? 'הם תקפו אותך או את בעלות בריתך.' : 'רוב העולם מתנגד להם.') + ' העולם יכעס פחות.</li>' : '<li class="red">מלחמה בלי סיבה — העולם יראה בך תוקפן.</li>') +
    '<li>מלחמה עולה כסף, הורגת חיילים ומעייפת את העם.</li></ul><div class="box">צפוי: ' + fxLine(e) + '</div>';
  modal({ title: 'הכרזת מלחמה', html: h, buttons: [{ label: 'הכרז מלחמה', cls: 'danger', fn: () => {
    const just = justified(o);
    const w = declareWar(S.player, o); if (w) { w.just = just; fxToast('המלחמה החלה', { ap: e.ap, rep: e.rep }, true); selected = o; renderAll(); openTabFresh('wars'); setTimeout(() => zoomToTid(o, 10), 280); }
  } }, { label: 'ביטול' }] });
}
// air strike or missile salvo, during a war or as a stand-alone attack
function strike(o, kind) {
  if (!o || !S.c[o] || !S.c[o].alive || o === S.player) return;
  const me = P(), E = S.c[o], sr = strikeRange(o);
  if (kind === 'air' ? !sr.air : !sr.mis) { toast('המטרה מחוץ לטווח', true); return; }
  const ck = (kind === 'air' ? 'air:' : 'mis:') + o; if (cdLeft(ck)) return;
  const w = S.wars.find(x => (x.A.includes(o) && x.B.includes(S.player)) || (x.B.includes(o) && x.A.includes(S.player)));
  if (w && w.pause > 0) { toast('יש הפסקת אש', true); return; }
  const preview = strikeFx(o, kind, !!w);
  const cost = strikeCost(kind);
  if (!spend(cost)) return;
  setCd(ck, kind === 'air' ? 14 : 20);
  const before = {}; ['tanks', 'air', 'art', 'ships', 'troops'].forEach(k => before[k] = E.inv[k]);
  let frac, lost = 0, used = 0;
  if (kind === 'air') {
    used = sortie();
    frac = clamp(used * me.q / (E.inv.air * 0.5 + E.inv.tanks * 0.03 + 40) * 0.1, 0.004, 0.1) * (1 - 0.15 * E.adv);
    lost = Math.round(used * [0.003, 0.01, 0.025, 0.05][E.adv] * (0.5 + R()));
    me.inv.air = Math.max(0, me.inv.air - lost);
    hurtInv(E, frac, ['air', 'heli', 'tanks', 'art', 'msl']); hurtInv(E, frac * 0.4, ['ships', 'afv', 'troops']);
    E.gdp *= 1 - frac * 0.06;
  } else {
    used = salvo(); me.inv.msl = Math.max(0, me.inv.msl - used);
    const hits = used * (1 - [0, 0.25, 0.5, 0.75][E.adv]);
    frac = clamp(hits / (hits + 300) * 0.2, 0.002, 0.06);
    hurtInv(E, frac, ['air', 'art', 'msl', 'ships']); hurtInv(E, frac * 0.5, ['tanks', 'troops']);
    E.gdp *= 1 - frac * 0.12;
  }
  const dmg = [];
  if (before.air - E.inv.air >= 1) dmg.push(Math.round(before.air - E.inv.air) + ' מטוסים');
  if (before.tanks - E.inv.tanks >= 1) dmg.push(Math.round(before.tanks - E.inv.tanks) + ' טנקים');
  if (before.art - E.inv.art >= 1) dmg.push(Math.round(before.art - E.inv.art) + ' תותחים');
  if (before.ships - E.inv.ships >= 1) dmg.push(Math.round(before.ships - E.inv.ships) + ' ספינות');
  const dTxt = dmg.length ? 'הושמדו ' + dmg.slice(0, 3).join(', ') : 'נפגעו בסיסים ותשתיות';
  const what = kind === 'air' ? 'תקיפה אווירית' : 'מטח טילים';
  if (w) {
    const eff = clamp(power(me) / (power(E) + power(me) + 1) * 2, 0.15, 1.5) * Math.sqrt(proj(S.player, o));
    const amt = kind === 'air' ? eff : 0.75;
    if (w.A.includes(S.player)) w.f += amt; else w.f -= amt; w.f = clamp(w.f, -100, 100);
    if (kind === 'mis') alive().forEach(id => { if (id !== S.player && id !== o && isAlly(id, o)) addRel(id, S.player, -3); });
    addNews(what + ' ב' + E.he + ': ' + dTxt + (lost ? '. איבדנו ' + lost + ' מטוסים' : '') + '.', 'war');
    toast(what + ' בוצעה: ' + dTxt + (lost ? ' · איבדנו ' + lost + ' מטוסים' : ''));
    checkWarEnd(w);
  } else {
    // a stand-alone attack: the target, its friends and the world react
    const e = { ap: preview.ap, rep: preview.rep, rel: preview.rel };
    alive().forEach(id => {
      if (id === S.player || id === o) return;
      if (isAlly(id, o)) addRel(id, S.player, kind === 'air' ? -15 : -12);
      else if (S.c[id].gov === 'democracy' && !justified(o)) addRel(id, S.player, -3);
    });
    let sancN = 0;
    if (!justified(o)) alive().forEach(id => {
      const C = S.c[id]; if (id === S.player || id === o || C.gov !== 'democracy' || C.gdp < 50 || S.sanc[id + '>' + S.player]) return;
      if (rel(id, S.player) < -30 && R() < 0.3) { S.sanc[id + '>' + S.player] = 1; sancN++; }
    });
    S.p.lastStrike = { o, day: S.day };
    addNews(what + ' שלנו ב' + E.he + ' (בלי הכרזת מלחמה): ' + dTxt + '.' + (sancN ? ' ' + sancN + ' מדינות הטילו עלינו סנקציות.' : ''), 'war');
    fxToast(what + ' ב' + E.he, e, true);
    if (dmg.length || lost) toast(dTxt + (lost ? ' · איבדנו ' + lost + ' מטוסים' : ''));
    if (sancN) toast(sancN + ' מדינות הטילו עלינו סנקציות', true);
    if (R() < retaliateChance(o)) {
      const nw = declareWar(o, S.player, { provoked: true, joinAtt: true });
      if (nw) addNews(E.he + ' הגיבה לתקיפה והכריזה עלינו מלחמה!', 'war');
    }
  }
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
      P().nukes--; nukeImpact(S.player, o, false);
      fxToast('☢ שיגור גרעיני', { rep: -50 }, true);
      if (w && S.wars.includes(w)) { if (w.A.includes(S.player)) w.f += 35; else w.f -= 35; w.f = clamp(w.f, -100, 100); checkWarEnd(w); }
      else if (!w && S.c[o].alive && R() < 0.9) declareWar(o, S.player, { provoked: true, joinAtt: true });
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
    '<li><b>מפה:</b> צבוט כדי להגדיל, גרור כדי לזוז, הקש על מדינה כדי לפתוח אותה. צהוב = אתה, כחול = בעלות ברית, אדום = במלחמה איתך.</li>' +
    '<li><b>דיפלומטיה:</b> הקש על מדינה: סיוע, סחר, ברית, אי-תוקפנות, סנקציות או מלחמה. אחרי ניסוי שנכשל — מחכים חודש.</li>' +
    '<li><b>תקיפות:</b> אפשר לתקוף מהאוויר או בטילים כל מדינה בטווח — גם בלי מלחמה. זה פוגע בצבא שלהם, אבל העולם כועס והם עלולים להכריז מלחמה.</li>' +
    '<li><b>מלחמה:</b> שכנות קל לתקוף, רחוקות קשה. החזית זזה כל יום לפי יחס הכוחות, ואבדות מורידות טנקים ומטוסים אמיתיים. כבשת 100% — המדינה מסופחת. בעלות ברית נכנסות להגן זו על זו!</li>' +
    '<li><b>שלום:</b> בלשונית מלחמות. ככל שאתה מנצח יותר, תוכל לדרוש יותר.</li>' +
    '<li><b>מדינות קטנות קשות יותר.</b> המשחק נשמר אוטומטית כל כמה שניות.</li></ul>' });
}
function showMenu() {
  modal({ title: 'תפריט', html: '<div class="btns col">' + btn('help', 'איך משחקים') + btn('centerme', 'מרכז את המפה על המדינה שלי') + btn('newgame', 'משחק חדש', 'danger') + '</div><p class="sub">המשחק נשמר אוטומטית כל כמה שניות.</p>',
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
  selected = null; save(); renderAll(); zoomToTid(pickId, 10);
  modal({ title: 'ברוך הבא, מנהיג ' + P().he, html: '<p>1 בינואר 2026. העולם מתוח. <b>הזמן רץ</b> — יום אחד בשנייה. אפשר לעצור (⏸) או להאיץ (×2, ×4, ×8) בכפתורים למעלה.</p><p>טיפ: התחל מלשונית <b>כלכלה</b>, שמור על העם מרוצה ועל המוניטין שלך בעולם, ובנה בריתות לפני שאתה יוצא למלחמה.</p>',
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
const LIVE_TABS = { eco: 1, home: 1, mil: 1, wars: 1, country: 1, news: 1 };
function frame(t) {
  requestAnimationFrame(frame);
  const dt = lastT ? Math.min(0.25, (t - lastT) / 1000) : 0; lastT = t;
  if (!S || !S.player) return;
  let ticked = 0;
  if (!S.over && S.speed > 0 && !modalOpen()) {
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
    renderAll(); zoomToTid(S.player, 10);
    if (S.over) showGameOver();
    else toast('ברוך השב! המשחק מושהה — לחץ ×1 כדי להמשיך');
  } else {
    recolor(); initStart();
    if (OLD_SAVE_FOUND) setTimeout(() => toast('המשחק עודכן לזמן אמת — מתחילים משחק חדש'), 400);
  }
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => {
    const box = $('#map'); if (Math.abs(box.clientWidth - W) < 40 && Math.abs(box.clientHeight - H) < 120) return;
    d3.select('#mapsvg').remove(); for (const k in pathByTid) delete pathByTid[k]; curK = 1; initMap(); drawMarks.k = null; recolor();
  }, 300); });
  requestAnimationFrame(frame);
  window.__W26 = { get S() { return S; }, dayTick, runDays: n => { for (let i = 0; i < n && !S.over; i++) dayTick(); renderAll(); }, declareWar, annex, power, rel, ACT, setSpeed, strike,
    selectTid: t => { selected = t; recolor(); openTab('country'); }, zoomToTid, processPending, wipe };
}
window.addEventListener('DOMContentLoaded', () => {
  loadScript('countries-data.js').catch(() => loadScript('countries-data.sample.js')).catch(() => { window.COUNTRY_DATA = {}; }).then(boot);
});
})();
