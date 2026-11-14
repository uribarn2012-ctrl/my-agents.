"""Mix narration (k1..k8.wav in ./tts) with quiet wind and soft effects -> out/audio.wav"""
import json, subprocess, os
os.makedirs('out', exist_ok=True)
d=json.load(open('timeline.json')); T=d['times']; starts=d['starts']; END=T['end']
ins=[]; fl=[]
for i,s in enumerate(starts):
    ins+=['-i',f'tts/k{i+1}.wav']
    fl.append(f'[{i}:a]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay={int(s*1000)}|{int(s*1000)}[n{i}]')
n=len(starts)
ins+=['-f','lavfi','-t',str(END),'-i','anoisesrc=color=brown:amplitude=0.6:sample_rate=48000']
fl.append(f"[{n}:a]lowpass=f=400,pan=stereo|c0=c0|c1=c0,volume='if(lt(t,{T['jumpStart']}),0.07,0.025)':eval=frame,afade=t=in:d=1.5,afade=t=out:st={END-1}:d=1[wind]")
ins+=['-f','lavfi','-t','1.8','-i','anoisesrc=color=pink:amplitude=0.4:sample_rate=48000']
fl.append(f"[{n+1}:a]bandpass=f=900:w=800,lowpass=f=3000,pan=stereo|c0=c0|c1=c0,volume='0.01+0.07*t*t':eval=frame,afade=t=in:d=0.4,afade=t=out:st=1.4:d=0.4,adelay={int(T['jumpStart']*1000)}|{int(T['jumpStart']*1000)}[rise]")
ins+=['-f','lavfi','-t','1.4','-i',"aevalsrc='0.16*sin(2*PI*55*t)*exp(-4*t)':s=48000"]
fl.append(f"[{n+2}:a]afade=t=in:d=0.03,pan=stereo|c0=c0|c1=c0,adelay={int(T['flash']*1000)}|{int(T['flash']*1000)}[boom]")
for k,(name,at) in enumerate([('land',T['land']),('stamp',T['stamp'])]):
    ins+=['-f','lavfi','-t','0.4','-i',"aevalsrc='0.12*sin(2*PI*90*t)*exp(-16*t)':s=48000"]
    fl.append(f"[{n+3+k}:a]afade=t=in:d=0.01,pan=stereo|c0=c0|c1=c0,adelay={int(at*1000)}|{int(at*1000)}[{name}]")
mix=''.join(f'[n{i}]' for i in range(n))+'[wind][rise][boom][land][stamp]'
fl.append(f"{mix}amix=inputs={n+5}:normalize=0,atrim=0:{END}[out]")
subprocess.run(['ffmpeg','-y',*ins,'-filter_complex',';'.join(fl),'-map','[out]','out/audio.wav'],check=True)
