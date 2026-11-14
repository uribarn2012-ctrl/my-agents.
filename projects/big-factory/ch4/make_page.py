"""Builds ch4/page_wide.html (1920x1080 only)."""
import base64, json, os
B = os.path.dirname(os.path.abspath(__file__)); A = os.path.join(B, '..', 'assets')
font = base64.b64encode(open(os.path.join(A, 'lilita.woff2'), 'rb').read()).decode()
logo = open(os.path.join(A, 'tick_logo.svg')).read()
s = logo.index('<g transform="translate('); e = logo.index('\n    </g>', s)
tick_inner = logo[logo.index('>', s) + 1:e]
TICK_LEGS = '''<rect x="-100" y="680" width="82" height="225" fill="#2f3b4c" stroke="#1a1a1a" stroke-width="12"/>
<rect x="18" y="680" width="82" height="225" fill="#2f3b4c" stroke="#1a1a1a" stroke-width="12"/>
<rect x="-118" y="895" width="108" height="58" rx="14" fill="#2a1d14" stroke="#1a1a1a" stroke-width="12"/>
<rect x="10" y="895" width="108" height="58" rx="14" fill="#2a1d14" stroke="#1a1a1a" stroke-width="12"/>'''
TICK = f'<g transform="translate(0 -953)"><g stroke-linejoin="round" stroke-linecap="round">{TICK_LEGS}{tick_inner}</g></g>'
meta = json.load(open(f'{B}/timeline.json'))
TL = {'starts': meta['starts'], 'durs': meta['durs'], 'end': meta['times']['end']}
js = open(f'{B}/engine.js', encoding='utf-8').read() + chr(10) + chr(10).join(open(f'{B}/{n}', encoding='utf-8').read() for n in ['scene.js', 'scene2.js', 'scene3.js'])
geo3 = json.load(open(os.path.join(B, 'geo3.json')))
geo = json.load(open(os.path.join(B, '..', 'coldopen', 'geo.json')))
html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Lil;src:url(data:font/woff2;base64,{font}) format('woff2')}}
html,body{{margin:0;background:#000}}
.t{{font-family:Lil}}
.big{{fill:#fff;stroke:#1a1a1a;stroke-width:16;paint-order:stroke fill;text-anchor:middle;stroke-linejoin:round}}
</style></head><body><div id="frame" style="width:1920px;height:1080px;overflow:hidden">
<svg id="scene" viewBox="0 0 1920 1080" width="1920" height="1080"><defs id="defs"></defs><g id="stage"></g><rect id="black" width="1920" height="1080" fill="#000" opacity="1"/></svg></div>
<script>window.TL={json.dumps(TL)};window.TICK_SVG={json.dumps(TICK)};window.GEO={json.dumps(geo)};window.GEO3={json.dumps(geo3)};</script>
<script>{js}</script><script>document.fonts.ready.then(()=>{{render(0);window.READY=true}})</script></body></html>'''
open(f'{B}/page_wide.html', 'w', encoding='utf-8').write(html)
print('page ok')
