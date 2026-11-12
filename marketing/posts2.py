# Builds posts2.html: a second set of nine Instagram posts (1080x1350), built on the real screens: the phone, the computer,
# the crests, the trophies, a forum reply, the reader and the library. Night and paper alternate, so the nine sit together
# on a profile as a chequer. Needs shots/ (python3 tour-gen.py shots-run.js shots.cjs && node shots.cjs) and marks.json.
import re, os, json
from PIL import Image
HERE=os.path.dirname(os.path.abspath(__file__)); REPO=os.path.dirname(HERE); R='file://'+REPO+'/public'; SHOTS='file://'+HERE+'/shots'
PATH=re.search(r'<path fill-rule="evenodd" fill=\{color\} d="([^"]+)"',open(REPO+'/src/components/Monogram.astro',encoding='utf-8').read()).group(1)
MARKS=json.load(open(HERE+'/marks.json',encoding='utf-8'))
def MONO(cls=''): return '<svg class="mono-mark %s" viewBox="0 0 918 888"><path fill-rule="evenodd" fill="currentColor" d="%s"/></svg>' % (cls, PATH)
_n=[0]
def uid(svg):
    _n[0]+=1; p='z%d_' % _n[0]
    return svg.replace('id="','id="'+p).replace('url(#','url(#'+p).replace('href="#','href="#'+p)
CSS=open(HERE+'/posts.py',encoding='utf-8').read().split("CSS='''")[1].split("'''.replace")[0].replace('R/',R+'/')+'''
.paper { background:#E9E3D7; color:#2A2017; }
.paper .frame { border-color:rgba(98,55,45,.4); }
.paper .eb, .paper .lab { color:#62372D; }
.paper .sub { color:#5A5045; }
.paper .mono-mark { color:#2A2017; }
.ph, .wn, .cu { z-index:2; }
.glow { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 62%, rgba(255,227,163,.13), rgba(6,8,6,0) 60%); }
.top { position:absolute; left:0; right:0; top:8.6rem; display:flex; flex-direction:column; align-items:center; gap:2.2rem; text-align:center; padding:0 8rem; }
.top .mono-mark { height:6rem; }
.top .big, .top .big-it { font-size:10.4rem; line-height:1; text-wrap:balance; }
.top .sub { font-size:4.4rem; }
.ph { position:absolute; left:50%; width:60rem; margin-left:-30rem; top:54rem; height:130rem; border-radius:7rem; padding:1.3rem; background:#0B0D0A; box-shadow:0 0 0 .3rem #23271F, 0 0 0 .5rem rgba(159,148,94,.75), 0 6rem 14rem rgba(0,0,0,.6); }
.ph .scr { position:relative; width:100%; height:100%; border-radius:5.8rem; overflow:hidden; background:#060806; }
.ph img, .wn-view img, .cu img { position:absolute; left:0; width:100%; height:auto; display:block; max-width:none; }
.wn { position:absolute; left:4rem; top:41rem; width:92rem; height:70rem; border-radius:1.6rem; overflow:hidden; background:#0B0D0A; box-shadow:0 0 0 .3rem #23271F, 0 0 0 .5rem rgba(159,148,94,.75), 0 6rem 14rem rgba(0,0,0,.6); }
.wn-bar { position:relative; height:4rem; display:flex; align-items:center; gap:.9rem; padding:0 2.2rem; background:#14170F; box-shadow:inset 0 -1px 0 rgba(243,236,220,.1); }
.wn-bar i { width:1.2rem; height:1.2rem; border-radius:50%; background:rgba(243,236,220,.22); }
.wn-bar span { position:absolute; left:10rem; font-family:'Alte Haas',sans-serif; font-size:1.2rem; letter-spacing:.2em; text-transform:uppercase; color:#ABA597; padding:.7rem 2rem .6rem; border-radius:99rem; box-shadow:inset 0 0 0 1px rgba(243,236,220,.16); }
.wn-view { position:relative; height:calc(100% - 4rem); overflow:hidden; }
.cu { position:absolute; left:6rem; width:88rem; border-radius:2.4rem; overflow:hidden; background:#0B0D0A; box-shadow:0 0 0 1px rgba(159,148,94,.8), 0 4rem 10rem rgba(0,0,0,.35); }
.wall { position:absolute; left:50%; top:76rem; transform:translate(-50%,-50%); display:grid; grid-template-columns:repeat(9, 8.3rem); gap:1.9rem 1.5rem; }
.wall svg, .pyr svg, .rare3 svg { width:100%; height:auto; display:block; }
.pyr { position:absolute; left:0; right:0; top:44rem; display:flex; flex-direction:column; align-items:center; gap:1.2rem; }
.pyr .row { display:flex; gap:2.2rem; }
.pyr .row > div { width:16rem; }
.under { position:absolute; left:0; right:0; bottom:8.4rem; display:flex; flex-direction:column; align-items:center; gap:1.6rem; text-align:center; padding:0 8rem; }
.rare3 { position:absolute; left:0; right:0; top:50rem; display:flex; justify-content:center; gap:3.4rem; }
.rare3 > div { width:25rem; display:flex; flex-direction:column; align-items:center; gap:1.8rem; text-align:center; }
.rare3 .lab { font-size:1.5rem; letter-spacing:.24em; line-height:1.5; color:#E6DFD0; }
'''
def top(eb, big, sub='', italic=False):
    return '<div class="top">'+MONO()+'<div class="eb">%s</div><div class="%s">%s</div>%s</div>' % (eb,'big-it' if italic else 'big',big,('<div class="sub">%s</div>' % sub) if sub else '')
def phone(shot, y=0, w=70, top=39, left=None, h=130):      # y: how far down the page to start, in the page's own pixels (393 wide)
    left=(100-w)/2.0 if left is None else left; k=w/60.0
    return '<div class="ph" style="width:%.2frem;left:%.2frem;margin-left:0;top:%.2frem;height:%.2frem;border-radius:%.2frem;padding:%.2frem"><div class="scr" style="border-radius:%.2frem"><img src="%s/%s.jpg" style="top:%.2frem"></div></div>' % (w,left,top,h,7*k,1.3*k,5.8*k,SHOTS,shot,-(y/393.0)*(w-2.6*k))
def window(shot, y=0, top=41, h=70, left=4):     # the computer's page (1440 wide), whole, in a browser's window
    return '<div class="wn" style="left:%.2frem;top:%.2frem;height:%.2frem"><div class="wn-bar"><i></i><i></i><i></i><span>overgrownaltar.com</span></div><div class="wn-view"><img src="%s/desk-%s.jpg" style="top:%.2frem"></div></div>' % (left,top,h,SHOTS,shot,-(y/1440.0)*92)
def closeup(shot, cy, topr, h):   # one part of a phone page, as wide as the post
    w,hh=Image.open(HERE+'/shots/'+shot+'.jpg').size; ih=88*hh/w
    return '<div class="cu" style="top:%srem;height:%srem"><img src="%s/%s.jpg" style="top:%.2frem"></div>' % (topr,h,SHOTS,shot,-(cy/393.0*88 - h/2.0))
P=[]
def post(pid, cls, inner): P.append('<section class="post %s" id="%s">%s<div class="frame"></div></section>' % (cls,pid,inner))
by={t['id']:t for t in MARKS['trophies']}
rows=[[10],[8,9],[5,6,7],[1,2,3,4]]
pyr=''.join('<div class="row">'+''.join('<div>%s</div>' % uid(MARKS['crests'][lv-1]['svg']) for lv in r)+'</div>' for r in rows)

post('01-inside-the-guild','', top('Inside the Guild','A house for writers.')+phone('guild',40))
post('02-a-clean-page','paper', top('The writing room','A clean page.',italic=True)+window('write',88,top=40,h=75))
post('03-ten-prestiges','', '<div class="glow"></div>'+top('Ten prestiges','Every published piece raises you.')+'<div class="pyr" style="top:47rem">'+pyr+'</div>')
post('04-the-reply','paper', top('The Forum','A comment section worth reading.',italic=True)+closeup('thread',661,49,34)+closeup('thread',1061,86,34))
post('05-fifty-four-trophies','', '<div class="glow"></div>'+top('Fifty-four trophies','None of them for followers.')+'<div class="wall" style="top:84rem">'+''.join('<div>%s</div>' % uid(t['svg']) for t in MARKS['trophies'])+'</div>')
post('06-read-or-listen','paper', top('Every piece','Read. Or listen.',italic=True)+phone('reading',150))
post('07-on-your-desk','', top('The whole house','At your desk. In your pocket.')+window('prestige',0,top=50,h=58,left=-13)+phone('prestige',470,w=32,top=64,left=63,h=74))
post('08-shelves-of-your-own','paper', top('The library','Shelves of your own.',italic=True)+phone('library',50))
post('09-earn-your-place','', '<div class="glow"></div>'+top('The rarest are won once','Earn your place.')
     +'<div class="rare3">'+''.join('<div>%s<span class="lab">%s</span></div>' % (uid(by[i]['svg']),by[i]['name']) for i in ['lion','cathedral','serpent'])+'</div>'
     +'<div class="under"><div class="thread"></div><div class="sub" style="color:#F3ECDC">A guild of writers and photographers,<br>anchored in Christ.</div><div class="pill" style="margin-top:.6rem">Coming soon</div></div>')
JS="const p=document.getElementById(new URLSearchParams(location.search).get('p'));p.classList.add('on');window.ready=Promise.all([document.fonts.ready,...[...p.querySelectorAll('img')].map(i=>i.decode().catch(()=>{}))]).then(()=>true);window.ids=[...document.querySelectorAll('.post')].map(x=>x.id);"
open(HERE+'/posts2.html','w',encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><style>'+CSS+'</style></head><body>'+''.join(P)+'<script>'+JS+'</script></body></html>')
print('posts', len(P))
