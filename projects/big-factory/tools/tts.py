"""Kokoro voice (am_michael, speed 1.08). Usage: python tools/tts.py <lines.json> <outdir>
lines.json = [[shown_text, spoken_text_or_empty], ...]. Writes n00.wav... and durs.json."""
import sys, json, os, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
here=os.path.dirname(os.path.abspath(__file__)); M=os.path.join(here,'..','models')
k=Kokoro(os.path.join(M,'model.onnx'),os.path.join(M,'voices.bin'))
L=json.load(open(sys.argv[1])); out=sys.argv[2]; os.makedirs(out,exist_ok=True); durs=[]
for i,(show,say) in enumerate(L):
    s,sr=k.create(say or show,voice='am_michael',speed=1.08,lang='en-us')
    a=np.abs(s); idx=np.where(a>0.01)[0]; s=s[max(0,idx[0]-1200):idx[-1]+2400]
    sf.write(os.path.join(out,f'n{i:02d}.wav'),s,sr); durs.append(round(len(s)/sr,3))
json.dump(durs,open(os.path.join(out,'durs.json'),'w')); print(durs)
