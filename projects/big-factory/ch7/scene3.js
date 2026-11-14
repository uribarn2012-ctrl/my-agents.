
const noteMk = '<g transform="rotate(-8)" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round"><rect x="-30" y="-38" width="60" height="76" rx="5" fill="#8a5a2b"/><rect x="-24" y="-32" width="48" height="64" fill="#f5ecd0"/><path d="M-16 -18 h32 M-16 -6 h32 M-16 6 h24" stroke-width="3" fill="none"/></g>';
const quillMk = '<g stroke="#1a1a1a" stroke-width="3" stroke-linejoin="round"><path d="M0 8 L30 -70 Q44 -86 52 -92 Q50 -70 36 -52 Z" fill="#fdfefe"/><path d="M0 8 L10 -14" stroke-width="5"/></g>';
const silver = '#cfd5db', silverD = '#8f9aa5';
function cluster(parent, xs, scale, houses, y) { xs.forEach((x, i) => mk(parent, `<g transform="translate(${x} ${y + (i % 2) * -22}) scale(${scale})">${houses[i % houses.length]}</g>`)); }
