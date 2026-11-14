import fs from 'fs';
import { feature, mesh, merge } from 'topojson-client';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
const topo = JSON.parse(fs.readFileSync('./node_modules/world-atlas/countries-50m.json'));
const W=1920,H=1080;
const proj = geoNaturalEarth1().rotate([-75,0]);
proj.fitExtent([[40,40],[W-40,H-40]], {type:'MultiPoint',coordinates:[[-12,30],[150,30],[60,72],[60,4],[-12,62],[150,62]]});
const path = geoPath(proj);
const countries = feature(topo, topo.objects.countries);
const land = path(merge(topo, topo.objects.countries.geometries.filter(g=>g.id!=='010')));
const borders = path(mesh(topo, topo.objects.countries, (a,b)=>a!==b));
const mongolia = path(countries.features.find(f=>f.id==='496'));
// rough outline of the Mongol empire at its peak (lon,lat), clipped to land in the page
const emp=[[127,34],[130,42],[135,48],[130,53],[110,55],[90,56],[70,57],[55,60],[45,60],[30,57],[24,52],[23,48],[28,45],[35,44],[40,42],[44,38],[42,34],[46,30],[52,27],[60,25],[68,28],[75,33],[80,30],[88,28],[98,24],[105,22],[110,21],[115,23],[120,27],[122,31],[127,34]];
const empire = path({type:'Polygon',coordinates:[emp.slice().reverse()]});
const pt = (lon,lat)=>proj([lon,lat]).map(v=>+v.toFixed(1));
const pts = {
  mongolia: pt(104,47), onon: pt(110,48.5),
  tatars: pt(117,47.5), merkits: pt(106,51), keraites: pt(103,47.2), naimans: pt(93,48), tayichiud: pt(110.5,49.6), mongols: pt(109,47.8),
  korea: pt(127.5,37.5), poland: pt(19,52), china: pt(110,35),
};
fs.writeFileSync('./coldopen/geo.json', JSON.stringify({land,borders,mongolia,empire,pts}));
console.log(pts);
