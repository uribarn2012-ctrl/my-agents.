import pathlib,sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={'width':1920,'height':1080})
    pg.goto(pathlib.Path('page_wide.html').resolve().as_uri()); pg.wait_for_function('window.READY===true')
    pg.evaluate('render(36.88)')
    print(pg.evaluate("""()=>{const s=SEGS.find(s=>s.on);const a=[...s.ui.querySelectorAll('path.sh')].map(x=>x.getAttribute('d')&&x.getAttribute('d').slice(0,200)+'|'+x.parentNode.getAttribute('opacity'));return JSON.stringify(a)}"""))
    b.close()
