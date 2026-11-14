import fs from 'fs';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
const W=1920,H=1080;
const proj = geoNaturalEarth1().rotate([-75,0]);
proj.fitExtent([[40,40],[W-40,H-40]], {type:'MultiPoint',coordinates:[[-12,30],[150,30],[60,72],[60,4],[-12,62],[150,62]]});
const path = geoPath(proj);
const poly = c => 'M'+c.map(p=>proj(p).map(v=>v.toFixed(1)).join(' ')).join('L')+'Z';
const pt = (lon,lat)=>proj([lon,lat]).map(v=>+v.toFixed(1));
// rough territories (lon,lat) ~1209
const xia=[[100,41],[106,42],[111,40.5],[111,37],[109,35.5],[105,35],[101,36],[97,38],[100,41]];
const jin=[[111,40.5],[116,43],[122,44],[127,45],[131,47],[134,45],[128,41],[125,39.5],[121,37],[120,35],[116,33],[112,33],[108,34],[109,35.5],[111,37],[111,40.5]];
const song=[[103,31],[108,34],[112,33],[116,33],[120,35],[122,31],[120,26],[115,22],[108,21.5],[103,24],[103,31]];
const jinN=[[111,40.5],[116,43],[122,44],[121,40],[117,38.5],[112,37.5],[111,40.5]]; // northern Jin (conquered 1211-15)
const khw=[[53,43],[60,45],[68,45.5],[74,43],[76,39],[72,36],[68,34],[64,31],[62,28.5],[58,27],[55,29],[53,34],[53,37],[55,40],[53,43]];
const khwConq=[[53,43],[60,45],[68,45.5],[74,43],[76,39],[72,36],[68,34],[64,31],[62,28.5],[58,27],[55,29],[53,34],[53,37],[55,40],[53,43]];
const out={xia:poly(xia),jin:poly(jin),song:poly(song),jinN:poly(jinN),khw:poly(khw),
 pts:{mongolia:pt(104,47),xia:pt(105,38.5),jin:pt(121,41.5),song:pt(112,28),zhongdu:pt(116.4,39.9),wall:pt(112,40),
 khw:pt(63,38),otrar:pt(68.3,42.9),bukhara:pt(64.4,39.8),samarkand:pt(66.96,39.65),urgench:pt(60.6,42.3),merv:pt(62.2,37.7),
 indus:pt(71.8,33.5),caspian:pt(53.5,37),balkh:pt(66.9,36.7),gen:pt(100,47),karakorum:pt(102.8,47.2),shahcap:pt(66,39),tabriz:pt(46.3,38.1),derbent:pt(48.3,42.1),kalka:pt(37.7,47.5),kiev:pt(30.5,50.4),mashhad:pt(59.6,36.3)},
 wall:path({type:'LineString',coordinates:[[98,39.5],[103,38],[107,40.5],[111,40.5],[115,41.2],[118,40.6],[121,40.3]]})};
fs.writeFileSync('./ch3/geo3.json',JSON.stringify(out));
console.log(JSON.stringify(out.pts));
