"""Render PNG test frames: python shots.py t1 t2 ... -> test_frames/f_<t>.png"""
import sys, os, pathlib
from playwright.sync_api import sync_playwright
os.chdir(os.path.dirname(os.path.abspath(__file__))); os.makedirs('test_frames', exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1920, 'height': 1080})
    pg.on('pageerror', lambda e: print('JS ERROR', e, getattr(e,'stack',''), flush=True)); pg.on('console', lambda m: print('LOG', m.text) if m.type == 'error' else None)
    pg.goto(pathlib.Path('page_wide.html').resolve().as_uri()); pg.wait_for_function('window.READY===true', timeout=30000)
    for a in sys.argv[1:]:
        pg.evaluate(f'render({float(a)})'); pg.screenshot(path=f'test_frames/f_{float(a):06.2f}.png'); print('shot', a)
    b.close()
