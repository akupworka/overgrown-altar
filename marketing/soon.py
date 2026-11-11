# Builds soon.html: a nine-tile "coming soon" grid for Instagram (1080x1350 each).
# The idea: stone in monochrome at the four corners, type on the arms of the cross, and the only colour in the whole
# grid at its centre, through glass.
import re, os
HERE=os.path.dirname(os.path.abspath(__file__)); REPO=os.path.dirname(HERE); R='file://'+REPO+'/public'
PATH=re.search(r'<path fill-rule="evenodd" fill=\{color\} d="([^"]+)"',open(REPO+'/src/components/Monogram.astro',encoding='utf-8').read()).group(1)
def MONO(cls=''): return '<svg class="mono-mark %s" viewBox="0 0 918 888"><path fill-rule="evenodd" fill="currentColor" d="%s"/></svg>' % (cls, PATH)
def img(n,cls='',pos='center'): return '<img class="bg %s" src="%s/images/%s.jpg" style="object-position:%s">' % (cls,R,n,pos)
CSS=open(HERE+'/posts.py',encoding='utf-8').read().split("CSS='''")[1].split("'''.replace")[0].replace('R/',R+'/')+'''
.plate { position:absolute; left:8rem; right:8rem; bottom:8.6rem; display:flex; align-items:baseline; justify-content:space-between; gap:2rem; }
.plate .n { font-weight:500; font-size:3.4rem; letter-spacing:.2em; color:#FFE3A3; }
.plate .t { font-family:'Alte Haas',sans-serif; font-size:1.9rem; letter-spacing:.36em; text-transform:uppercase; color:#F3ECDC; }
.veil.base { background:linear-gradient(180deg, rgba(6,8,6,.28), rgba(6,8,6,0) 30%, rgba(6,8,6,0) 58%, rgba(6,8,6,.88)); }
.paper { background:#E9E3D7; color:#2A2017; }
.paper .frame { border-color:rgba(98,55,45,.45); }
.paper .eb, .paper .lab { color:#62372D; }
.paper .sub { color:#5A5045; }
.paper .no s { color:#8C8273; text-decoration-color:#62372D; }
.paper .foot span { color:#5A5045; } .paper .mono-mark { color:#2A2017; }
.rule { height:1px; width:14rem; background:#9F945E; }
.rooms3 { display:flex; flex-direction:column; align-items:center; gap:1.5rem; }
.rooms3 span { font-weight:500; font-size:4.6rem; letter-spacing:.14em; text-transform:uppercase; line-height:1; }
'''
FOOT='<div class="foot">'+MONO('xs')+'<span>Coming soon</span></div>'
P=[]
def tile(n, cls, inner): P.append('<section class="post %s" id="t%d">%s<div class="frame"></div></section>' % (cls, n, inner))
tile(1,'', img('duomo-spires','gray','center 28%')+'<div class="veil base"></div><div class="plate"><span class="n">I</span><span class="t">The Watchtower</span></div>')
tile(2,'', '<div class="in">'+MONO()+'<div class="thread"></div><div class="big-it" style="font-size:12.6rem">Coming soon.</div><div class="lab bone" style="font-size:2.4rem">Overgrown Altar</div></div>')
tile(3,'', img('chapel-and-cross-under-a','gray','72% 50%')+'<div class="veil base"></div><div class="plate"><span class="n">III</span><span class="t">The Perimeter</span></div>')
tile(4,'paper', '<div class="in"><div class="eb">The Core Thesis</div><div class="big-it" style="font-size:11rem">Broken pieces of a mirror that Christ holds whole.</div><div class="rule"></div></div>'+FOOT)
tile(5,'', img('window-of-the-ascension-and','','center 44%')+'<div class="veil base"></div><div class="plate"><span class="n">II</span><span class="t">The Hearth</span></div>')
tile(6,'paper', '<div class="in" style="gap:.8rem"><div class="no"><s>No likes.</s></div><div class="no"><s>No followers.</s></div><div class="no"><s>No algorithm.</s></div><div class="rule" style="margin:3.6rem 0 2.6rem"></div><div class="big-it" style="font-size:12.4rem;color:#62372D">Only the work.</div></div>'+FOOT)
tile(7,'', img('what-we-believe','gray','58% 50%')+'<div class="veil base"></div><div class="plate"><span class="n">IV</span><span class="t">The Fellowship</span></div>')
tile(8,'', '<div class="in"><div class="eb">Three rooms, one altar</div><div class="rooms3"><span>The Watchtower</span><span>The Hearth</span><span>The Perimeter</span></div><div class="thread"></div><div class="sub">A guild of writers and photographers,<br>anchored in Christ.</div></div>'+FOOT)
tile(9,'', img('duomo-pigeons','gray','center 42%')+'<div class="veil base"></div><div class="plate"><span class="n">V</span><span class="t">The Guild</span></div>')
JS="const p=document.getElementById(new URLSearchParams(location.search).get('p'));p.classList.add('on');window.ready=Promise.all([document.fonts.ready,...[...p.querySelectorAll('img')].map(i=>i.decode().catch(()=>{}))]).then(()=>true);"
open(HERE+'/soon.html','w',encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><style>'+CSS+'</style></head><body>'+''.join(P)+'<script>'+JS+'</script></body></html>')
print('tiles', len(P))
