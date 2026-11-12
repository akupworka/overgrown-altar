# Builds posts3.html: a third set of nine Instagram posts (1080x1350), the cinematic ones. Photographs full to the edge,
# a crest and a trophy as heroes with light behind them, the screens at an angle with depth. Photograph and black alternate.
# Needs shots/ and marks.json (see README).
import re, os, json, math
HERE=os.path.dirname(os.path.abspath(__file__)); REPO=os.path.dirname(HERE); R='file://'+REPO+'/public'; SHOTS='file://'+HERE+'/shots'
PATH=re.search(r'<path fill-rule="evenodd" fill=\{color\} d="([^"]+)"',open(REPO+'/src/components/Monogram.astro',encoding='utf-8').read()).group(1)
MARKS=json.load(open(HERE+'/marks.json',encoding='utf-8'))
def MONO(cls=''): return '<svg class="mono-mark %s" viewBox="0 0 918 888"><path fill-rule="evenodd" fill="currentColor" d="%s"/></svg>' % (cls, PATH)
_n=[0]
def uid(svg):
    _n[0]+=1; p='y%d_' % _n[0]
    return svg.replace('id="','id="'+p).replace('url(#','url(#'+p).replace('href="#','href="#'+p)
CSS=open(HERE+'/posts.py',encoding='utf-8').read().split("CSS='''")[1].split("'''.replace")[0].replace('R/',R+'/')+'''
.shade { position:absolute; inset:0; background:linear-gradient(180deg, rgba(6,8,6,.9), rgba(6,8,6,.55) 30%, rgba(6,8,6,.2) 55%, rgba(6,8,6,.72)); }
.shade.even { background:radial-gradient(ellipse at 50% 45%, rgba(6,8,6,.52), rgba(6,8,6,.88) 85%); }
.shade.left { background:linear-gradient(90deg, rgba(6,8,6,.9), rgba(6,8,6,.62) 55%, rgba(6,8,6,.25)), linear-gradient(180deg, rgba(6,8,6,.5), rgba(6,8,6,0) 30%, rgba(6,8,6,0) 70%, rgba(6,8,6,.6)); }
.rays { position:absolute; left:50%; top:50%; width:190rem; height:190rem; margin:-95rem 0 0 -95rem;
  background:repeating-conic-gradient(from 3deg at 50% 50%, rgba(255,227,163,.085) 0deg 2.4deg, rgba(255,227,163,0) 2.4deg 9deg);
  -webkit-mask-image:radial-gradient(circle, #000 12%, rgba(0,0,0,.5) 30%, transparent 56%); mask-image:radial-gradient(circle, #000 12%, rgba(0,0,0,.5) 30%, transparent 56%); }
.halo { position:absolute; left:50%; top:50%; width:120rem; height:120rem; margin:-60rem 0 0 -60rem; background:radial-gradient(circle, rgba(255,227,163,.2), rgba(255,227,163,.06) 34%, rgba(6,8,6,0) 62%); }
.t3 { position:absolute; left:0; right:0; top:8.4rem; display:flex; flex-direction:column; align-items:center; gap:2rem; text-align:center; padding:0 7rem; z-index:3; }
.t3 .mono-mark { height:6rem; }
.t3 .h { font-weight:500; font-size:13.6rem; line-height:.98; text-wrap:balance; }
.t3 .h.it { font-style:italic; font-weight:400; }
.b3 { position:absolute; left:0; right:0; bottom:8rem; display:flex; flex-direction:column; align-items:center; gap:1.8rem; text-align:center; padding:0 8rem; z-index:3; }
.hero { position:absolute; left:50%; z-index:2; }
.hero svg { width:100%; height:auto; display:block; }
.name { font-weight:500; font-size:13rem; line-height:1; letter-spacing:.1em; text-transform:uppercase; }
.numeral { font-weight:500; font-size:4.4rem; letter-spacing:.34em; color:#FFE3A3; }
.rig { position:absolute; inset:0; perspective:230rem; perspective-origin:50% 40%; z-index:2; }
.dev { position:absolute; background:#0B0D0A; box-shadow:0 0 0 .3rem #23271F, 0 0 0 .55rem rgba(159,148,94,.9), 5rem 9rem 16rem rgba(0,0,0,.85), 0 0 30rem rgba(255,227,163,.18); transform-style:preserve-3d; }
.dev .scr { position:relative; width:100%; height:100%; overflow:hidden; background:#060806; }
.dev img { position:absolute; left:0; width:100%; height:auto; display:block; max-width:none; }
.dev .scr::after { content:''; position:absolute; inset:0; background:linear-gradient(118deg, rgba(255,255,255,.1), rgba(255,255,255,0) 30%); }
.dev.phone { border-radius:7.6rem; padding:1.4rem; } .dev.phone .scr { border-radius:6.3rem; }
.dev.desk { border-radius:1.8rem; overflow:hidden; }
.dev .bar { position:relative; height:4.4rem; display:flex; align-items:center; gap:.9rem; padding:0 2.2rem; background:#14170F; box-shadow:inset 0 -1px 0 rgba(243,236,220,.1); }
.dev .bar i { width:1.2rem; height:1.2rem; border-radius:50%; background:rgba(243,236,220,.22); }
.dev.desk .scr { height:calc(100% - 4.4rem); }
.climb { position:absolute; inset:0; z-index:2; }
.climb > div { position:absolute; }
.climb svg, .hall svg { width:100%; height:auto; display:block; }
.hallrig { position:absolute; inset:0; perspective:150rem; perspective-origin:20% 50%; z-index:2; }
.hall { position:absolute; left:10rem; top:50rem; display:grid; grid-template-columns:repeat(9, 14rem); gap:3rem 3.4rem; transform-origin:0 50%; transform:rotateY(46deg); }
.fade-r { position:absolute; inset:0; z-index:3; background:linear-gradient(90deg, rgba(6,8,6,0) 45%, rgba(6,8,6,.75) 78%, #060806 96%); }
.bg[data-tall] { height:124%; }
.fade-b { position:absolute; left:0; right:0; bottom:0; height:30rem; z-index:3; background:linear-gradient(180deg, rgba(6,8,6,0), #060806 85%); }
.shade.soft { background:linear-gradient(180deg, rgba(6,8,6,.88), rgba(6,8,6,.5) 34%, rgba(6,8,6,.1) 60%, rgba(6,8,6,.55)); }
.shade.even.soft { background:radial-gradient(ellipse at 50% 46%, rgba(6,8,6,.42), rgba(6,8,6,.8) 85%); }
.quote { font-style:italic; font-weight:400; font-size:10.2rem; line-height:1.07; text-wrap:balance; }
.mega { font-style:italic; font-weight:400; font-size:21rem; line-height:.94; }
.wm { font-family:'Alte Haas',sans-serif; font-size:2rem; letter-spacing:.42em; text-transform:uppercase; color:#E6DFD0; }
'''
def bg(name,pos='center',gray=False): return '<img class="bg %s" src="%s/images/%s.jpg" style="object-position:%s">' % ('gray' if gray else '',R,name,pos)
def t3(eb,h,italic=False): return '<div class="t3">'+MONO()+'<div class="eb">%s</div><div class="h %s">%s</div></div>' % (eb,'it' if italic else '',h)
P=[]
def post(pid, inner): P.append('<section class="post" id="%s">%s</section>' % (pid,inner))
C=MARKS['crests']; by={t['id']:t for t in MARKS['trophies']}

# 1 · the cover: light through the dome
post('01-overgrown-altar', bg('manifesto-photo','18% 50%')+'<div class="shade even"></div>'
  +'<div class="in" style="gap:3.4rem;padding:10rem 7rem 12rem">'+MONO()+'<div class="caps" style="font-size:9.6rem;letter-spacing:.14em;line-height:1.08">Overgrown<br>Altar</div><div class="thread"></div>'
  +'<div class="sub">A guild of writers and photographers,<br>anchored in Christ.</div></div><div class="b3"><div class="wm">Coming soon</div></div>')
# 2 · Seraph, the tenth prestige
post('02-seraph', '<div class="rays" style="top:44%"></div><div class="halo" style="top:44%"></div>'
  +'<div class="t3"><div class="eb">The tenth prestige</div></div>'
  +'<div class="hero" style="width:70rem;margin-left:-35rem;top:13rem">%s</div>' % uid(C[9]['svg'])
  +'<div class="b3" style="bottom:9rem;gap:2rem"><div class="numeral">%s</div><div class="name">%s</div><div class="sub">%s</div></div>' % (C[9]['numeral'],C[9]['name'],C[9]['note']))
# 3 · the thesis, in the light of a window
post('03-the-thesis', bg('window-light-on-wall','50% 0').replace('class="bg "','class="bg " data-tall')+'<div class="shade left"></div>'
  +'<div class="in" style="align-items:flex-start;text-align:left;gap:3.2rem;padding:10rem 9rem 12rem 8rem">'+MONO('xs')+'<div class="eb">The core thesis</div>'
  +'<div class="quote">Every honest mind, every made thing and every true story holds a piece of the truth.</div><div class="thread"></div>'
  +'<div class="sub" style="text-align:left;color:#F3ECDC">Set whole again in the death<br>and resurrection of Christ.</div></div>')
# 4 · the climb: ten crests, rising
sizes=[7+24*((i/9.0)**1.4) for i in range(10)]; adv=[0]
for i in range(1,10): adv.append(adv[-1]+(sizes[i]+sizes[i-1])/2.0)
pts=[]
for i in range(10):      # along a quarter of an ellipse: out along the foot, then up the right side
    th=(adv[i]/adv[-1])*math.pi/2; x=11+68*math.sin(th); y=59+56*math.cos(th)
    pts.append('<div style="left:%.2frem;top:%.2frem;width:%.2frem">%s</div>' % (x-sizes[i]/2,y-sizes[i]/2,sizes[i],uid(C[i]['svg'])))
post('04-the-climb', '<div class="halo" style="left:79%;top:47.2%;width:110rem;height:110rem;margin:-55rem 0 0 -55rem"></div>'
  +'<div class="t3" style="align-items:flex-start;text-align:left;padding:0 8rem">'+MONO()+'<div class="eb">Ten prestiges</div><div class="h">Inkling<br>to Seraph.</div>'
  +'<div class="sub" style="text-align:left;color:#F3ECDC;margin-top:1.4rem">Every published piece<br>raises you.</div></div>'
  +'<div class="climb">'+''.join(pts)+'</div>')
# 5 · the Guild in the hand
post('05-in-your-hand', bg('tall-windows-dark-vault','50% 60%')+'<div class="shade"></div>'+t3('Inside the Guild','A house<br>for writers.')
  +'<div class="rig"><div class="dev phone" style="left:24rem;top:55rem;width:54rem;height:116rem;transform:rotateY(-24deg) rotateX(12deg) rotateZ(5deg)"><div class="scr"><img src="%s/guild.jpg" style="top:-5.4rem"></div></div></div>' % SHOTS)
# 6 · the hall of trophies
post('06-the-hall', '<div class="hallrig"><div class="hall">'+''.join('<div>%s</div>' % uid(t['svg']) for t in MARKS['trophies'])+'</div></div><div class="fade-r"></div><div class="fade-b"></div>'
  +t3('Fifty-four trophies','Every one<br>earned.'))
# 7 · the page is waiting
post('07-the-page', bg('labyrinth-stained-light','72% 50%')+'<div class="shade soft"></div>'+t3('The writing room','The page<br>is waiting.',True)
  +'<div class="rig" style="perspective-origin:60%% 40%%"><div class="dev desk" style="left:9rem;top:52rem;width:128rem;height:84rem;transform:rotateY(21deg) rotateX(7deg) rotateZ(-3deg);transform-origin:0 50%%"><div class="bar"><i></i><i></i><i></i></div><div class="scr"><img src="%s/desk-write.jpg" style="top:-7.8rem"></div></div></div>' % SHOTS)
# 8 · one trophy, won once
post('08-won-once', '<div class="rays" style="top:47%"></div><div class="halo" style="top:47%"></div>'
  +'<div class="t3"><div class="eb">Won once</div></div>'
  +'<div class="hero" style="width:62rem;margin-left:-31rem;top:21rem">%s</div>' % uid(by['cathedral']['svg'])
  +'<div class="b3" style="bottom:9rem;gap:2.2rem"><div class="name" style="font-size:9.6rem;letter-spacing:.08em">%s</div><div class="sub">Kept for good.</div></div>' % by['cathedral']['name'])
# 9 · the doors
post('09-coming-soon', bg('folios-photo-2','50% 50%')+'<div class="shade even soft"></div>'
  +'<div class="in" style="gap:3.6rem;padding:10rem 6rem 12rem">'+MONO('sm')+'<div class="mega">Coming<br>soon.</div><div class="thread"></div><div class="pill" style="margin-top:1rem">overgrownaltar.com</div></div>')
JS="const p=document.getElementById(new URLSearchParams(location.search).get('p'));if(p)p.classList.add('on');window.ready=Promise.all([document.fonts.ready,...[...(p?p.querySelectorAll('img'):[])].map(i=>i.decode().catch(()=>{}))]).then(()=>true);window.ids=[...document.querySelectorAll('.post')].map(x=>x.id);"
open(HERE+'/posts3.html','w',encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><style>'+CSS+'</style></head><body>'+''.join(P)+'<script>'+JS+'</script></body></html>')
print('posts', len(P))
