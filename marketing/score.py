# The reels' own music: a low organ-like pad, bells on the cuts, a soft drum on the hard beats, and a lift to the major
# at the end card. Written from the cue times build.py leaves in cues.json, so sound and picture always agree.
#   python3 build.py && python3 score.py      (writes audio/<reel>.wav; render.cjs picks them up)
import json, os, wave
import numpy as np
HERE=os.path.dirname(os.path.abspath(__file__)); SR=44100
os.makedirs(HERE+'/audio',exist_ok=True)
rng=np.random.default_rng(11)
SCALE=[293.66,349.23,392.0,440.0,523.25,587.33,698.46,783.99,880.0,1174.66]        # D minor pentatonic, rising
BELLS=[587.33,440.0,698.46,523.25,880.0,587.33]
def env(n,a,r):
    e=np.ones(n); na=min(n,int(a*SR)); nr=min(n,int(r*SR))
    if na: e[:na]*=np.linspace(0,1,na)**2
    if nr: e[-nr:]*=np.linspace(1,0,nr)**2
    return e
def pad(freqs,n,a,r,shift=0.0):
    t=np.arange(n)/SR; out=np.zeros(n)
    for k,f in enumerate(freqs):
        for d in (1.0,1.0031+shift,0.9972-shift):
            ph=rng.uniform(0,6.28); lfo=1+0.12*np.sin(2*np.pi*(0.11+0.03*k)*t+ph)
            out+=lfo*(np.sin(2*np.pi*f*d*t+ph)+0.22*np.sin(2*np.pi*2*f*d*t)+0.06*np.sin(2*np.pi*3*f*d*t+1))/(1+0.6*k)
    return out*env(n,a,r)
def put(buf,at,sig,gain=1.0,pan=0.0):
    i=int(at*SR); m=min(len(sig),buf.shape[1]-i)
    if m<=0: return
    buf[0,i:i+m]+=sig[:m]*gain*(1-max(0,pan)); buf[1,i:i+m]+=sig[:m]*gain*(1+min(0,pan))
def bell(f,dur=3.2):
    t=np.arange(int(dur*SR))/SR; out=np.zeros_like(t)
    for p,a,d in ((1,1,1.9),(2.0,.55,1.3),(2.41,.3,1.0),(3.0,.22,.8),(4.2,.12,.5),(5.43,.08,.35)): out+=a*np.sin(2*np.pi*f*p*t)*np.exp(-t/d)
    return out*np.minimum(1,t/0.004)
def tick(f,dur=0.9):
    t=np.arange(int(dur*SR))/SR
    return (np.sin(2*np.pi*f*t)+0.4*np.sin(2*np.pi*2*f*t)+0.15*np.sin(2*np.pi*3.01*f*t))*np.exp(-t/0.22)*np.minimum(1,t/0.003)
def thump(dur=0.9):
    t=np.arange(int(dur*SR))/SR; f=44+50*np.exp(-t/0.05)
    body=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t/0.26)
    click=np.convolve(rng.standard_normal(len(t)),np.ones(24)/24,'same')*np.exp(-t/0.012)
    return body+0.5*click
def reverb(x,wet):
    n=int(2.4*SR); t=np.arange(n)/SR; out=np.zeros_like(x)
    for c in (0,1):
        ir=np.convolve(rng.standard_normal(n),np.ones(10)/10,'same')*np.exp(-t/0.85); ir[:int(0.012*SR)]=0
        m=x.shape[1]+n-1; y=np.fft.irfft(np.fft.rfft(x[c],m)*np.fft.rfft(ir,m),m)[:x.shape[1]]
        out[c]=y/np.sqrt(np.sum(ir**2))*0.5
    return x+wet*out
MINOR=[73.42,110.0,146.83,174.61,220.0]          # D minor
MAJOR=[73.42,110.0,146.83,185.0,220.0,293.66]    # D major: the lift
for name,spec in json.load(open(HERE+'/cues.json')).items():
    dur=spec['ms']/1000; n=int(dur*SR); buf=np.zeros((2,n)); soft=spec.get('soft')
    lift=next((c[0]/1000 for c in spec['cues'] if c[1]=='lift'),dur)
    a=pad(MINOR,int((lift+0.5)*SR),0.25,1.0); b=pad(MAJOR,n-int((lift-0.1)*SR),0.6,1.6,0.0006)
    g=0.03 if soft else 0.024      # the pad is a bed under the beats, never the loudest thing
    put(buf,0,a,g,0.15); put(buf,0,np.roll(a,97),g,-0.15); put(buf,lift-0.1,b,g*1.15,0.15); put(buf,lift-0.1,np.roll(b,131),g*1.15,-0.15)
    for ms,kind,k in spec['cues']:
        at=ms/1000
        if kind=='bell': put(buf,at,bell(BELLS[k%len(BELLS)]),0.085 if soft else 0.11,(-0.3,0.3)[k%2])
        elif kind=='tick': put(buf,at,tick(SCALE[k%len(SCALE)]),0.16,(-0.25,0.25)[k%2]); put(buf,at,thump(0.5),0.16)
        elif kind=='thump': put(buf,at,thump(),0.5)
        elif kind=='lift': put(buf,at,bell(293.66,4.5),0.12); put(buf,at,bell(587.33,4.0),0.07,0.3); put(buf,at,bell(880.0,3.5),0.045,-0.3); put(buf,at,thump(),0.3)
    buf=reverb(buf,0.5 if soft else 0.38)
    buf/=np.max(np.abs(buf))+1e-9; buf=np.tanh(buf*1.15)/np.tanh(1.15)*0.84      # a gentle ceiling, no squashing
    fo=int(0.9*SR); buf[:,-fo:]*=np.linspace(1,0,fo)**1.5; buf[:,:int(0.01*SR)]*=np.linspace(0,1,int(0.01*SR))
    w=wave.open(HERE+'/audio/'+name+'.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((buf.T*32767).astype('<i2').tobytes()); w.close()
    print('score',name,'%.1fs' % dur)
