"""Mix narration (narration/n00..n46.wav) with quiet wind, hoof beats and soft effects -> out/audio.wav"""
import json, subprocess, os
os.chdir(os.path.dirname(os.path.abspath(__file__))); os.makedirs('out', exist_ok=True)
d = json.load(open('timeline.json')); starts = d['starts']; END = d['times']['end']; sfx = d['sfx']; hoof = d['hoof']
n = len(starts); ins = []; fl = []; labels = []
for i, s in enumerate(starts):
    ins += ['-i', f'narration/n{i:02d}.wav']
    ms = int(s * 1000); fl.append(f'[{i}:a]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}[n{i}]'); labels.append(f'[n{i}]')
k = n
def add(src, filt, name):
    global k
    ins.extend(src); fl.append(f'[{k}:a]{filt}[{name}]'); labels.append(f'[{name}]'); k += 1
# gentle wind the whole way (brown noise, lowpassed, slow swell)
add(['-f', 'lavfi', '-t', str(END), '-i', 'anoisesrc=color=brown:amplitude=0.6:sample_rate=48000'],
    f"lowpass=f=420,pan=stereo|c0=c0|c1=c0,volume='0.05+0.025*sin(t*0.5)+0.035*clip((t-{starts[22]})/2,0,1)*clip(({starts[30]+5.7}-t)/2,0,1)':eval=frame,afade=t=in:d=1.5,afade=t=out:st={END-1.5}:d=1.5", 'wind')
SYN = {  # name: (aevalsrc expression, length) ; all quiet, ~8 dB under the voice
 'pop':   ("0.10*sin(2*PI*620*t)*exp(-28*t)", .25), 'thud': ("0.16*sin(2*PI*70*t)*exp(-9*t)", .5),
 'stamp': ("0.16*sin(2*PI*85*t)*exp(-12*t)+0.05*sin(2*PI*210*t)*exp(-30*t)", .5), 'slam': ("0.15*sin(2*PI*60*t)*exp(-7*t)+0.04*sin(2*PI*140*t)*exp(-25*t)", .7),
 'twang': ("0.07*sin(2*PI*(330-250*t)*t)*exp(-14*t)", .35), 'clunk': ("0.16*sin(2*PI*110*t)*exp(-14*t)+0.07*sin(2*PI*330*t)*exp(-40*t)", .4),
 'bonk':  ("0.18*sin(2*PI*(160-160*t)*t)*exp(-12*t)", .45), 'boom': ("0.18*sin(2*PI*45*t)*exp(-4*t)", 1.2), 'poke': ("0.10*sin(2*PI*130*t)*exp(-22*t)", .3),
}
NOISE = {'whoosh': ("pink", 1.4, "bandpass=f=900:w=800,lowpass=f=3000,volume='0.01+0.1*sin(PI*t/1.4)':eval=frame"),
         'splash': ("pink", .7, "bandpass=f=1500:w=1500,volume='0.12*exp(-5*t)':eval=frame"), 'poof': ("pink", .6, "lowpass=f=1800,volume='0.14*exp(-6*t)':eval=frame")}
for j, (kind, at) in enumerate(sfx):
    ms = max(0, int(at * 1000))
    if kind in SYN:
        e, ln = SYN[kind]; add(['-f', 'lavfi', '-t', str(ln), '-i', f"aevalsrc='{e}':s=48000"], f'afade=t=in:d=0.005,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}', f'x{j}')
    else:
        col, ln, f = NOISE[kind]; add(['-f', 'lavfi', '-t', str(ln), '-i', f'anoisesrc=color={col}:amplitude=0.5:sample_rate=48000'], f"{f},afade=t=in:d=0.02,afade=t=out:st={ln-.15}:d=0.15,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}", f'x{j}')
for j, (a, b) in enumerate(hoof):  # soft hoof-beat loop while riding
    ln = max(.5, b - a); ms = int(a * 1000)
    add(['-f', 'lavfi', '-t', f'{ln:.2f}', '-i', "aevalsrc='0.07*sin(2*PI*75*t)*exp(-34*mod(t,0.23))+0.04*sin(2*PI*75*t)*exp(-34*mod(t+0.115,0.23))':s=48000"],
        f'afade=t=in:d=0.3,afade=t=out:st={max(0, ln-.4):.2f}:d=0.4,pan=stereo|c0=c0|c1=c0,adelay={ms}|{ms}', f'h{j}')
fl.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=longest,atrim=0:{END},alimiter=limit=0.95[out]")
subprocess.run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', ';'.join(fl), '-map', '[out]', 'out/audio.wav'], check=True)
print('audio ok')
