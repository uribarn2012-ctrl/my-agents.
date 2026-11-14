import sys, subprocess, json, os, pathlib
from playwright.sync_api import sync_playwright
os.chdir(os.path.dirname(os.path.abspath(__file__)))
mode = sys.argv[1] if len(sys.argv) > 1 else 'wide'; F0 = int(sys.argv[2]) if len(sys.argv) > 2 else 0; F1 = int(sys.argv[3]) if len(sys.argv) > 3 else None; TAG = sys.argv[4] if len(sys.argv) > 4 else 'video'; W, H = 1920, 1080
T = json.load(open('timeline.json'))['times']['end']; FPS = 30; N = int(T * FPS)
out = f'out/{mode}_{TAG}.tmp.mp4'; os.makedirs('out', exist_ok=True)
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': W, 'height': H})
    pg.on('pageerror', lambda e: print('JS ERROR', e, flush=True))
    pg.goto(pathlib.Path(f'page_{mode}.html').resolve().as_uri()); pg.wait_for_function('window.READY===true', timeout=30000)
    for i in range(F0, F1 if F1 is not None else N):
        pg.evaluate(f'render({i/FPS})')
        ff.stdin.write(pg.screenshot(type='jpeg', quality=92))
        if i % 300 == 0: print(mode, i, N, flush=True)
    b.close()
ff.stdin.close(); rc = ff.wait()
if rc == 0: os.replace(out, f'out/{mode}_{TAG}.mp4'); print(mode, 'DONE')
else: print(mode, 'FFMPEG FAIL', rc)
