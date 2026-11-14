"""Builds page_wide.html and page_tall.html for the cold-open test video."""
import base64, json, re, sys, os

B = os.path.dirname(os.path.abspath(__file__))
A = os.path.join(B, '..', 'assets')
geo = json.load(open(f'{B}/geo.json'))
font = base64.b64encode(open(os.path.join(A, 'lilita.woff2'), 'rb').read()).decode()
logo = open(os.path.join(A, 'tick_logo.svg')).read()
s = logo.index('<g transform="translate('); e = logo.index('\n    </g>', s)
tick_inner = logo[logo.index('>', s) + 1:e]
TICK_LEGS = '''<rect x="-100" y="680" width="82" height="225" fill="#2f3b4c" stroke="#1a1a1a" stroke-width="12"/>
<rect x="18" y="680" width="82" height="225" fill="#2f3b4c" stroke="#1a1a1a" stroke-width="12"/>
<rect x="-118" y="895" width="108" height="58" rx="14" fill="#2a1d14" stroke="#1a1a1a" stroke-width="12"/>
<rect x="10" y="895" width="108" height="58" rx="14" fill="#2a1d14" stroke="#1a1a1a" stroke-width="12"/>'''
TICK = f'<g stroke-linejoin="round" stroke-linecap="round">{TICK_LEGS}{tick_inner}</g>'

# young Temujin: head centre (0,0), feet at y=820
TEMUJIN = '''<g stroke="#1a1a1a" stroke-linejoin="round" stroke-linecap="round">
<rect x="-78" y="610" width="64" height="190" fill="#2f3b4c" stroke-width="12"/>
<rect x="14" y="610" width="64" height="190" fill="#2f3b4c" stroke-width="12"/>
<rect x="-96" y="780" width="92" height="48" rx="12" fill="#3b2a1e" stroke-width="12"/>
<rect x="4" y="780" width="92" height="48" rx="12" fill="#3b2a1e" stroke-width="12"/>
<path d="M-60 150 L-150 260 L-128 560 L-82 556 L-90 300 Z" fill="#355f92" stroke-width="12"/>
<path d="M60 150 L150 260 L128 560 L82 556 L90 300 Z" fill="#355f92" stroke-width="12"/>
<circle cx="-106" cy="586" r="34" fill="#e6b48c" stroke-width="10"/>
<circle cx="106" cy="586" r="34" fill="#e6b48c" stroke-width="10"/>
<path d="M-110 150 L110 150 L150 640 L-150 640 Z" fill="#3f6fa8" stroke-width="12"/>
<path d="M-40 150 L70 420" fill="none" stroke-width="9"/>
<rect x="-150" y="360" width="300" height="46" fill="#c0392b" stroke-width="10"/>
<rect x="-110" y="470" width="50" height="44" fill="#5d86b8" stroke-width="6" transform="rotate(-8 -85 492)"/>
<rect x="56" y="250" width="40" height="38" fill="#5d86b8" stroke-width="6" transform="rotate(10 76 269)"/>
<rect x="-34" y="112" width="68" height="50" fill="#e6b48c" stroke-width="10"/>
<circle cx="0" cy="0" r="130" fill="#e6b48c" stroke-width="12"/>
<ellipse cx="-80" cy="40" rx="20" ry="11" fill="#e89a86" stroke="none"/>
<ellipse cx="80" cy="40" rx="20" ry="11" fill="#e89a86" stroke="none"/>
<path d="M-70 -20 L-22 -8" fill="none" stroke-width="10"/>
<path d="M70 -20 L22 -8" fill="none" stroke-width="10"/>
<ellipse cx="-44" cy="16" rx="11" ry="15" fill="#1a1a1a" stroke="none"/>
<ellipse cx="44" cy="16" rx="11" ry="15" fill="#1a1a1a" stroke="none"/>
<path d="M-26 74 L26 70" fill="none" stroke-width="9"/>
<path d="M-150 -40 Q-150 -210 0 -215 Q150 -210 150 -40 Z" fill="#7a4a2a" stroke-width="12"/>
<path d="M-6 -215 L10 -262 L26 -212" fill="#c0392b" stroke-width="8"/>
<rect x="-176" y="-80" width="352" height="74" rx="37" fill="#eadcbc" stroke-width="12"/>
<path d="M-140 -60 l14 26 M-96 -62 l12 28 M-50 -64 l10 30 M-4 -64 l8 30 M42 -64 l8 30 M88 -62 l10 28 M132 -60 l10 26" stroke="#bfae88" stroke-width="6" fill="none"/>
</g>'''


def tag(text, size=64, pad=26, anchor='middle'):
    """Ethos-style black label box with white text, centred on (0,0) or left-aligned."""
    w = int(len(text) * size * 0.55) + pad * 2
    x = -w / 2 if anchor == 'middle' else 0
    tx = 0 if anchor == 'middle' else pad
    return (f'<rect x="{x}" y="{-size * .75}" width="{w}" height="{size * 1.5}" rx="10" fill="#111" stroke="#fff" stroke-width="5"/>'
            f'<text x="{tx}" y="{size * .35}" text-anchor="{"middle" if anchor == "middle" else "start"}" class="t" font-size="{size}" fill="#fff">{text}</text>')


def page(mode, times, caps):
    tall = mode == 'tall'
    lx = 480 if tall else 120  # left edge for corner tags
    name_size = 128 if tall else 170
    sub_size = 34 if tall else 46
    hook = ('<text class="t big" x="0" y="-50" font-size="96">HIS GRAVE HAS</text><text class="t big" x="0" y="60" font-size="96">NEVER BEEN FOUND</text>'
            if tall else '<text class="t big" x="0" y="30" font-size="92">HIS GRAVE HAS NEVER BEEN FOUND</text>')
    svg = f'''<svg id="scene" viewBox="0 0 1920 1080" width="{1956 if tall else 1920}" height="{1100 if tall else 1080}">
<defs>
 <linearGradient id="gHillSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#58687f"/><stop offset="1" stop-color="#b3bdc6"/></linearGradient>
 <linearGradient id="gDaySky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fbfea"/><stop offset="1" stop-color="#e6f4fa"/></linearGradient>
 <linearGradient id="gNight" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1130"/><stop offset="1" stop-color="#2c3370"/></linearGradient>
 <radialGradient id="gWatchBg"><stop offset="0" stop-color="#2a3866"/><stop offset="1" stop-color="#090c18"/></radialGradient>
 <radialGradient id="gGlow"><stop offset="0" stop-color="#ffe27a" stop-opacity=".9"/><stop offset="1" stop-color="#ffb800" stop-opacity="0"/></radialGradient>
 <radialGradient id="gDoor"><stop offset="0" stop-color="#ffc066" stop-opacity=".9"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/></radialGradient>
 <radialGradient id="gCard" cx=".35" cy=".45" r=".8"><stop offset="0" stop-color="#ffb24f"/><stop offset="1" stop-color="#ff7a10"/></radialGradient>
 <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.2" markerHeight="3.2" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#1a1a1a"/></marker>
 <clipPath id="landClip"><path id="landClipPath"/></clipPath>
</defs>

<g id="sHill" opacity="0"><g id="hillCam">
 <rect x="-200" y="-200" width="2320" height="1480" fill="url(#gHillSky)"/>
 {''.join(f'<g id="cloud{i}" opacity=".5"><ellipse cx="0" cy="0" rx="{150+i*20}" ry="40" fill="#e9edf1"/><ellipse cx="{60+i*8}" cy="-24" rx="90" ry="44" fill="#e9edf1"/><ellipse cx="-70" cy="-12" rx="70" ry="34" fill="#e9edf1"/></g>' for i in range(5))}
 <path d="M-200 640 Q200 560 520 600 T1200 590 T2120 620 L2120 1280 L-200 1280 Z" fill="#6c7b62"/>
 <path d="M-200 700 Q300 640 700 680 T1500 660 T2120 700 L2120 1280 L-200 1280 Z" fill="#7d8a59"/>
 <path d="M-200 1280 L-200 820 Q500 600 960 620 Q1420 640 2120 820 L2120 1280 Z" fill="#8f9b5e"/>
 <g id="hillGrass"></g>
 <g id="under" opacity="0">
  <path d="M-200 1280 L-200 852 Q500 632 960 652 Q1420 672 2120 852 L2120 1280 Z" fill="#6b4a2c"/>
  <path d="M-200 1280 L-200 940 Q500 760 960 780 Q1420 800 2120 940 L2120 1280 Z" fill="#5e4026"/>
  <path d="M-200 1280 L-200 1040 Q500 900 960 915 Q1420 930 2120 1040 L2120 1280 Z" fill="#53381f"/>
  <g fill="#7d6a58" stroke="#1a1a1a" stroke-width="4"><ellipse cx="420" cy="860" rx="34" ry="20"/><ellipse cx="1560" cy="900" rx="28" ry="18"/><ellipse cx="640" cy="1010" rx="22" ry="14"/><ellipse cx="1300" cy="1040" rx="30" ry="16"/></g>
  <ellipse cx="960" cy="900" rx="300" ry="130" fill="url(#gGlow)" opacity=".55"/>
  <rect x="750" y="815" width="420" height="170" rx="26" fill="#3a2716" stroke="#1a1a1a" stroke-width="8"/>
  <rect x="790" y="905" width="340" height="52" rx="10" fill="#8a8178" stroke="#1a1a1a" stroke-width="7"/>
  <g stroke="#1a1a1a" stroke-linecap="round" stroke-linejoin="round">
   <path d="M876 893 L1040 893" stroke="#f2efe6" stroke-width="10"/>
   <path d="M876 893 L1040 893" stroke-width="2" fill="none" opacity=".5"/>
   <g stroke="#f2efe6" stroke-width="7" fill="none"><path d="M900 875 Q904 893 900 911"/><path d="M922 873 Q926 893 922 913"/><path d="M944 873 Q948 893 944 913"/><path d="M966 875 Q970 893 966 911"/></g>
   <path d="M890 880 L940 862 M890 906 L944 922" stroke="#f2efe6" stroke-width="7"/>
   <ellipse cx="1050" cy="893" rx="20" ry="16" fill="#f2efe6" stroke-width="4"/>
   <path d="M1066 886 L1130 878 M1066 900 L1130 908" stroke="#f2efe6" stroke-width="8"/>
   <circle cx="852" cy="890" r="27" fill="#f2efe6" stroke-width="5"/>
   <circle cx="844" cy="885" r="6" fill="#1a1a1a" stroke="none"/><circle cx="860" cy="885" r="6" fill="#1a1a1a" stroke="none"/>
   <path d="M846 902 L858 902" stroke-width="3"/>
   <path d="M790 878 Q792 838 822 836 Q848 838 846 872 Z" fill="#7a4a2a" stroke-width="5"/>
   <rect x="784" y="866" width="68" height="18" rx="9" fill="#eadcbc" stroke-width="5"/>
   <path d="M1095 868 L1115 868 L1110 885 L1100 885 Z" fill="#ffd84a" stroke-width="4"/>
   <circle cx="1140" cy="890" r="8" fill="#ffd84a" stroke-width="3"/><circle cx="1150" cy="878" r="7" fill="#ffd84a" stroke-width="3"/><circle cx="1128" cy="878" r="6" fill="#ffd84a" stroke-width="3"/>
   <path d="M800 840 Q960 820 1120 840" fill="none" stroke="#8b5a2b" stroke-width="7"/>
  </g>
 </g>
 <g id="walkers">
  <g id="w0"><g class="body">
   <rect class="legL" x="-14" y="-62" width="14" height="62" fill="#2f3b4c" stroke="#1a1a1a" stroke-width="5"/>
   <rect class="legR" x="2" y="-62" width="14" height="62" fill="#2f3b4c" stroke="#1a1a1a" stroke-width="5"/>
   <path d="M-30 -130 L30 -130 L36 -50 L-36 -50 Z" fill="#9c2f2f" stroke="#1a1a1a" stroke-width="6"/>
   <rect x="-36" y="-92" width="72" height="12" fill="#e0a12a" stroke="#1a1a1a" stroke-width="4"/>
   <line x1="40" y1="-160" x2="46" y2="0" stroke="#5e3820" stroke-width="7" stroke-linecap="round"/>
   <circle cx="0" cy="-160" r="30" fill="#e6b48c" stroke="#1a1a1a" stroke-width="6"/>
   <path d="M-32 -170 Q-30 -205 0 -206 Q30 -205 32 -170 Z" fill="#7a4a2a" stroke="#1a1a1a" stroke-width="6"/>
   <rect x="-36" y="-178" width="72" height="16" rx="8" fill="#eadcbc" stroke="#1a1a1a" stroke-width="5"/>
   <circle cx="10" cy="-156" r="4" fill="#1a1a1a"/></g></g>
  <g id="w1"><g class="body">
   <rect class="legL" x="-14" y="-62" width="14" height="62" fill="#6b5b3e" stroke="#1a1a1a" stroke-width="5"/>
   <rect class="legR" x="2" y="-62" width="14" height="62" fill="#6b5b3e" stroke="#1a1a1a" stroke-width="5"/>
   <rect x="-44" y="-128" width="30" height="58" rx="8" fill="#c0392b" stroke="#1a1a1a" stroke-width="5"/>
   <path d="M-28 -130 L28 -130 L32 -58 L-32 -58 Z" fill="#2e86c1" stroke="#1a1a1a" stroke-width="6"/>
   <circle cx="0" cy="-160" r="30" fill="#f0c8a0" stroke="#1a1a1a" stroke-width="6"/>
   <path d="M-30 -168 Q0 -200 30 -168 Z M28 -170 L52 -168" fill="#f1c40f" stroke="#1a1a1a" stroke-width="5"/>
   <circle cx="10" cy="-156" r="4" fill="#1a1a1a"/>
   <path d="M6 -142 Q12 -138 18 -142" fill="none" stroke="#1a1a1a" stroke-width="3"/></g></g>
  <g id="w2"><g class="body">
   <rect class="legL" x="-14" y="-62" width="14" height="62" fill="#34495e" stroke="#1a1a1a" stroke-width="5"/>
   <rect class="legR" x="2" y="-62" width="14" height="62" fill="#34495e" stroke="#1a1a1a" stroke-width="5"/>
   <path d="M-30 -132 L30 -132 L34 -50 L-34 -50 Z" fill="#a9845a" stroke="#1a1a1a" stroke-width="6"/>
   <line x1="20" y1="-100" x2="70" y2="-8" stroke="#1a1a1a" stroke-width="6" stroke-linecap="round"/>
   <ellipse cx="78" cy="-4" rx="22" ry="8" fill="#7f8c8d" stroke="#1a1a1a" stroke-width="5"/>
   <circle cx="0" cy="-162" r="30" fill="#e6b48c" stroke="#1a1a1a" stroke-width="6"/>
   <path d="M-38 -172 L38 -172 L28 -186 Q0 -206 -28 -186 Z" fill="#c8a165" stroke="#1a1a1a" stroke-width="5"/>
   <circle cx="2" cy="-158" r="8" fill="none" stroke="#1a1a1a" stroke-width="3"/><circle cx="20" cy="-158" r="8" fill="none" stroke="#1a1a1a" stroke-width="3"/>
   <g id="qBubble" opacity="0"><circle cx="34" cy="-236" r="30" fill="#fff" stroke="#1a1a1a" stroke-width="5"/><text x="34" y="-222" text-anchor="middle" class="t" font-size="42" fill="#1a1a1a">?</text></g></g></g>
 </g>
 <g id="wind"></g>
</g>
 <g id="hook" opacity="0">{hook}</g>
</g>

<g id="sWatch" opacity="0">
 <rect width="1920" height="1080" fill="url(#gWatchBg)"/>
 <circle id="watchGlow" cx="960" cy="470" r="460" fill="url(#gGlow)"/>
 <g id="watchBody" stroke="#1a1a1a" stroke-linecap="round">
  <circle cx="0" cy="-292" r="34" fill="none" stroke-width="14"/>
  <rect x="-30" y="-275" width="60" height="38" rx="8" fill="#ffd84a" stroke-width="12"/>
  <circle r="252" fill="#ffd84a" stroke-width="16"/>
  <circle r="200" fill="#fffbe8" stroke-width="8"/>
  {''.join(f'<line x1="0" y1="-{150 if i%3 else 132}" x2="0" y2="-182" stroke-width="{12 if i%3==0 else 7}" transform="rotate({i*30})"/>' for i in range(12))}
  <g id="hourHand"><line x1="0" y1="10" x2="0" y2="-108" stroke-width="20"/></g>
  <g id="minHand"><line x1="0" y1="14" x2="0" y2="-162" stroke-width="12"/></g>
  <circle r="18" fill="#1a1a1a"/>
 </g>
 <text class="t" x="960" y="{880 if not tall else 900}" text-anchor="middle" font-size="40" fill="#ffd84a" style="-webkit-text-stroke:0">YEAR</text>
 <text id="yearNum" class="t big" x="960" y="{1010 if not tall else 1030}" font-size="140">2026</text>
</g>

<g id="sDay" opacity="0">
 <rect width="1920" height="1080" fill="url(#gDaySky)"/>
 <circle cx="1600" cy="170" r="80" fill="#fff6c8"/>
 <path d="M-50 700 Q400 600 800 650 T1600 630 T2000 670 L2000 1100 L-50 1100 Z" fill="#a3bb7a"/>
 <path d="M-50 1100 L-50 790 Q600 690 1000 720 T2000 760 L2000 1100 Z" fill="#b8c66c"/>
 <g id="dayGrass"></g>
 {''.join(f'<circle id="dust{i}" r="10" fill="#e3d4a4" opacity="0"/>' for i in range(6))}
 <ellipse cx="960" cy="905" rx="110" ry="18" fill="#000" opacity=".22"/>
 <g id="tickDay"><g transform="translate(960 905) scale(0.44) translate(0 -953)">{TICK}</g></g>
 <g id="placeTag">{tag('MONGOLIA, 1162', 70)}</g>
</g>

<g id="sMap" opacity="0">
 <rect width="1920" height="1080" fill="#2f63c9"/>
 <g id="mapCam">
  <path id="mapLand" fill="#f3ad45" stroke="#1d2b4a" stroke-width="1.6" vector-effect="non-scaling-stroke"/>
  <path id="mapMongolia" fill="#f8c46a" stroke="#1d2b4a" stroke-width="3" vector-effect="non-scaling-stroke"/>
  <path id="mapBorders" fill="none" stroke="#1d2b4a" stroke-width="1.4" stroke-opacity=".5" vector-effect="non-scaling-stroke"/>
 </g>
 <g id="raids"></g>
 <g id="tribes"></g>
 <g transform="translate({lx} 110)"><g id="steppeTag">{tag('THE STEPPE', 60, anchor='start')}</g></g>
</g>

<g id="sBirth" opacity="0"><g id="birthCam">
 <rect x="-100" y="-100" width="2120" height="1300" fill="url(#gNight)"/>
 <g id="stars"></g>
 <circle cx="{1380 if tall else 1550}" cy="170" r="60" fill="#f4f1d0"/>
 <path d="M-100 1200 L-100 760 Q600 690 1000 720 T2020 750 L2020 1200 Z" fill="#1e2e22"/>
 <ellipse cx="960" cy="790" rx="320" ry="70" fill="url(#gDoor)" id="doorGlow"/>
 {''.join(f'<circle id="smoke{i}" r="20" fill="#9aa0b8" opacity="0"/>' for i in range(3))}
 <g stroke="#1a1a1a" stroke-linejoin="round" stroke-width="10">
  <rect x="770" y="600" width="380" height="180" rx="12" fill="#e8dcc2"/>
  <path d="M790 640 L1130 640 M790 700 L1130 700" stroke="#cbbb98" stroke-width="6"/>
  <path d="M750 612 Q960 455 1170 612 Z" fill="#d6c6a2"/>
  <circle cx="960" cy="500" r="24" fill="#5a4630"/>
  <rect x="922" y="666" width="76" height="114" rx="6" fill="#ffa53a"/>
 </g>
</g>
 <g transform="translate({lx} 110)"><g id="yearTag">{tag('1162', 60, anchor='start')}</g></g>
 <g id="stampLegend" opacity="0"><rect x="-230" y="-80" width="460" height="160" rx="18" fill="none" stroke="#d9d9d9" stroke-width="14"/><rect x="-206" y="-58" width="412" height="116" rx="10" fill="none" stroke="#d9d9d9" stroke-width="5"/><text class="t" x="0" y="38" text-anchor="middle" font-size="106" fill="#d9d9d9" style="-webkit-text-stroke:0;letter-spacing:6px">LEGEND</text></g>
</g>

<g id="sName" opacity="0">
 <rect width="1920" height="1080" fill="url(#gCard)"/>
 <path d="{geo['land']}" fill="#ffffff" opacity=".10" transform="translate(-300 -120) scale(1.3)"/>
 <ellipse cx="{700 if tall else 600}" cy="905" rx="140" ry="22" fill="#000" opacity=".2"/>
 <g id="temujinCard"><g transform="translate(0 905) scale(0.62) translate(0 -828)">{TEMUJIN}</g></g>
 <g id="nameText"><text class="t big" x="0" y="0" font-size="{name_size}">TEM&#220;JIN</text>
  <text id="nameSub" class="t" x="0" y="{int(name_size*0.62)}" text-anchor="middle" font-size="{sub_size}" fill="#1a1a1a" style="-webkit-text-stroke:0">THE BOY WHO BECAME GENGHIS KHAN</text></g>
</g>

<g id="sZoom" opacity="0">
 <rect width="1920" height="1080" fill="#2f63c9"/>
 <g id="zoomCam">
  <path id="zoomLand" fill="#f3ad45" stroke="#1d2b4a" stroke-width="1.6" vector-effect="non-scaling-stroke"/>
  <path id="zoomMongolia" fill="#f8c46a" stroke="#1d2b4a" stroke-width="3" vector-effect="non-scaling-stroke"/>
  <g id="empireG" opacity="0" clip-path="url(#landClip)"><path id="empire" fill="#e2362b"/></g>
  <path id="zoomBorders" fill="none" stroke="#1d2b4a" stroke-width="1.4" stroke-opacity=".5" vector-effect="non-scaling-stroke"/>
 </g>
 <g id="redDot"><circle r="26" fill="#e2362b" opacity=".35"/><circle r="14" fill="#e2362b" stroke="#1a1a1a" stroke-width="4"/></g>
 <g id="tagKorea"><g transform="translate(0 -60)">{tag('KOREA', 40)}</g><circle r="9" fill="#111" stroke="#fff" stroke-width="3"/></g>
 <g id="tagPoland"><g transform="translate(0 -60)">{tag('POLAND', 40)}</g><circle r="9" fill="#111" stroke="#fff" stroke-width="3"/></g>
</g>

<g id="sEnd" opacity="0"><g id="endCam">
 <rect width="1920" height="1080" fill="url(#gDaySky)"/>
 <path d="M-50 700 Q400 600 800 650 T1600 630 T2000 670 L2000 1100 L-50 1100 Z" fill="#a3bb7a"/>
 <path d="M-50 1100 L-50 790 Q600 690 1000 720 T2000 760 L2000 1100 Z" fill="#b8c66c"/>
 <g id="endGrass"></g>
 <ellipse cx="960" cy="900" rx="80" ry="14" fill="#000" opacity=".2"/>
 <g transform="translate(960 900) scale(0.36) translate(0 -828)">{TEMUJIN}</g>
</g></g>

<rect id="flash" width="1920" height="1080" fill="#fff" opacity="0"/>
<rect id="black" width="1920" height="1080" fill="#000" opacity="1"/>
</svg>'''
    if tall:
        body = f'''<div id="frame" style="position:relative;width:1080px;height:1920px;overflow:hidden;background:#111626">
 <div style="position:absolute;left:-438px;top:410px">{svg}</div>
 <div id="brand" style="position:absolute;top:150px;width:1080px;text-align:center" class="h">The Big <span class="fact">FACT</span>ory</div>
 <div id="cap" style="position:absolute;top:1590px;left:60px;width:960px;text-align:center" class="cap"></div>
</div>'''
        size = (1080, 1920)
    else:
        body = f'<div id="frame" style="width:1920px;height:1080px;overflow:hidden">{svg}</div>'
        size = (1920, 1080)
    js = open(f'{B}/scene.js').read()
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:Lil;src:url(data:font/woff2;base64,{font}) format('woff2')}}
html,body{{margin:0;background:#000}}
.t{{font-family:Lil}}
.big{{fill:#fff;stroke:#1a1a1a;stroke-width:16;paint-order:stroke fill;text-anchor:middle;stroke-linejoin:round}}
.lbl{{font-family:Lil;fill:#fff;stroke:#1a1a1a;stroke-width:9;paint-order:stroke fill;stroke-linejoin:round}}
.h{{font-family:Lil;font-size:78px;color:#fff;-webkit-text-stroke:12px #1a1a1a;paint-order:stroke fill}}
.fact{{background:#ff6a00;color:#fff4e6;border:8px solid #1a1a1a;border-radius:18px;padding:0 14px 6px;-webkit-text-stroke:0}}
.cap{{font-family:Lil;font-size:68px;line-height:1.15;color:#fff;-webkit-text-stroke:12px #1a1a1a;paint-order:stroke fill}}
</style></head><body>{body}
<script>window.MODE={json.dumps(mode)};window.GEO={json.dumps(geo)};window.TIMES={json.dumps(times)};window.CAPS={json.dumps(caps)};</script>
<script>{js}</script><script>document.fonts.ready.then(()=>{{render(0);window.READY=true}})</script></body></html>'''
    open(f'{B}/page_{mode}.html', 'w').write(html)
    return size


if __name__ == '__main__':
    meta = json.load(open(f'{B}/timeline.json'))
    for m in ('wide', 'tall'):
        page(m, meta['times'], meta['caps'])
    print('pages ok')
