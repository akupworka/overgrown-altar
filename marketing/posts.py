# Builds posts.html: nine Instagram posts (1080x1350) from the site's own photographs, type and mark.
import re, os
HERE=os.path.dirname(os.path.abspath(__file__)); REPO=os.path.dirname(HERE); R='file://'+REPO+'/public'
PATH=re.search(r'<path fill-rule="evenodd" fill=\{color\} d="([^"]+)"',open(REPO+'/src/components/Monogram.astro',encoding='utf-8').read()).group(1)
def MONO(cls=''): return '<svg class="mono-mark %s" viewBox="0 0 918 888"><path fill-rule="evenodd" fill="currentColor" d="%s"/></svg>' % (cls, PATH)
def img(n,cls='',pos='center'): return '<img class="bg %s" src="%s/images/%s.jpg" style="object-position:%s">' % (cls,R,n,pos)
FOOT='<div class="foot">'+MONO('xs')+'<span>overgrownaltar.com</span></div>'
CSS='''
@font-face { font-family:'Cormorant'; src:url('R/fonts/cormorant-300.woff2') format('woff2'); font-weight:300; }
@font-face { font-family:'Cormorant'; src:url('R/fonts/cormorant-500.woff2') format('woff2'); font-weight:500; }
@font-face { font-family:'Cormorant'; src:url('R/fonts/cormorant-600.woff2') format('woff2'); font-weight:600; }
@font-face { font-family:'Cormorant'; src:url('R/fonts/cormorant-italic-400.woff2') format('woff2'); font-weight:400; font-style:italic; }
@font-face { font-family:'Alte Haas'; src:url('R/fonts/alte-haas-400.woff2') format('woff2'); font-weight:400; }
@font-face { font-family:'Alte Haas'; src:url('R/fonts/alte-haas-700.woff2') format('woff2'); font-weight:700; }
*,*::before,*::after { box-sizing:border-box; }
html { font-size:10.8px; } html,body { margin:0; width:100%; height:100%; background:#060806; overflow:hidden; }
body { font-family:'Cormorant',serif; color:#F3ECDC; -webkit-font-smoothing:antialiased; }
.post { position:absolute; inset:0; display:none; overflow:hidden; background:#060806; } .post.on { display:block; }
.bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.gray { filter:grayscale(1) contrast(1.08); }
.veil { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 46%, rgba(6,8,6,.36), rgba(6,8,6,.84) 80%), linear-gradient(180deg, rgba(6,8,6,.5), rgba(6,8,6,.1) 30%, rgba(6,8,6,.15) 60%, rgba(6,8,6,.85)); }
.veil.deep { background:radial-gradient(ellipse at 50% 46%, rgba(6,8,6,.66), rgba(6,8,6,.94) 78%); }
.veil.low { background:linear-gradient(180deg, rgba(6,8,6,.45), rgba(6,8,6,.08) 26%, rgba(6,8,6,.3) 50%, rgba(6,8,6,.95) 80%); }
.frame { position:absolute; inset:3.4rem; border:1px solid rgba(159,148,94,.55); pointer-events:none; }
.in { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:3rem; padding:12rem 9rem 16rem; }
.in.low { justify-content:flex-end; padding-bottom:21rem; }
.lab { font-family:'Alte Haas',sans-serif; font-size:2.1rem; letter-spacing:.36em; text-transform:uppercase; color:#FFE3A3; }
.lab.bone { color:#E6DFD0; }
.eb { font-weight:600; font-size:2.7rem; letter-spacing:.3em; text-transform:uppercase; color:#FFE3A3; }
.big { font-weight:500; font-size:12rem; line-height:1; text-wrap:balance; }
.caps { font-weight:500; font-size:10.4rem; line-height:1; letter-spacing:.06em; text-transform:uppercase; }
.big-it { font-style:italic; font-weight:400; font-size:11.6rem; line-height:1.06; text-wrap:balance; }
.sub { font-style:italic; font-size:5rem; line-height:1.32; color:#E0D9C9; text-wrap:balance; }
.thread { height:.36rem; width:26rem; border-radius:1rem; background:linear-gradient(90deg,#3E7BFF,#B05BFF,#FF3B4E,#FFC44D,#3DE0A0); }
.mono-mark { height:30rem; width:auto; color:#F3ECDC; display:block; }
.mono-mark.sm { height:16rem; } .mono-mark.xs { height:5.2rem; }
.room-n { font-weight:500; font-size:4.4rem; letter-spacing:.3em; color:#FFE3A3; }
.no { font-weight:500; font-size:12.6rem; line-height:1.08; }
.no s { text-decoration-color:#FFE3A3; text-decoration-thickness:.4rem; color:#A9A394; }
.foot { position:absolute; left:0; right:0; bottom:7.4rem; display:flex; flex-direction:column; align-items:center; gap:1.6rem; }
.foot span { font-family:'Alte Haas',sans-serif; font-size:1.8rem; letter-spacing:.36em; text-transform:uppercase; color:#E6DFD0; }
.pill { font-family:'Alte Haas',sans-serif; font-weight:700; font-size:2.5rem; letter-spacing:.3em; text-transform:uppercase; color:#12160F; background:#FFE3A3; padding:2rem 3.8rem 1.8rem; border-radius:99rem; }
.three { display:flex; flex-direction:column; gap:1.6rem; align-items:center; }
.three div { font-size:5.4rem; line-height:1.2; } .three b { font-weight:600; color:#FFE3A3; }
'''.replace('R/',R+'/')
P=[]
def post(pid, inner): P.append('<section class="post" id="%s">%s<div class="frame"></div></section>' % (pid, inner))
post('01-overgrown-altar', img('tall-windows-dark-vault','','center 44%')+'<div class="veil deep"></div><div class="in">'+MONO()+'<div class="thread"></div><div class="lab bone" style="font-size:2.6rem">Overgrown Altar</div><div class="sub">A guild of writers and photographers,<br>anchored in Christ.</div></div><div class="foot"><span>overgrownaltar.com</span></div>')
post('02-the-thesis', img('labyrinth-stained-light','','62% 60%')+'<div class="veil"></div><div class="in"><div class="eb">The Core Thesis</div><div class="big-it">Broken pieces of a mirror that Christ holds whole.</div><div class="thread"></div></div>'+FOOT)
post('03-only-the-work', '<div class="in" style="gap:1rem"><div class="no"><s>No likes.</s></div><div class="no"><s>No followers.</s></div><div class="no"><s>No algorithm.</s></div><div class="thread" style="margin:3.4rem 0 2.4rem"></div><div class="big-it" style="color:#FFE3A3;font-size:13.6rem">Only the work.</div></div>'+FOOT)
post('04-the-watchtower', img('duomo-spires','gray','center 30%')+'<div class="veil low"></div><div class="in low"><div class="room-n">01</div><div class="caps">The Watchtower</div><div class="thread"></div><div class="sub">Essays that weigh the age<br>against the cross.</div></div>'+FOOT)
post('05-the-hearth', img('window-of-the-ascension-and','','center 42%')+'<div class="veil low"></div><div class="in low"><div class="room-n">02</div><div class="caps">The Hearth</div><div class="thread"></div><div class="sub">Prose, poetry and fiction,<br>made with reverence.</div></div>'+FOOT)
post('06-the-perimeter', img('chapel-and-cross-under-a','gray','72% 50%')+'<div class="veil low"></div><div class="in low"><div class="room-n">03</div><div class="caps">The Perimeter</div><div class="thread"></div><div class="sub">True accounts from the edge<br>of the unseen.</div></div>'+FOOT)
post('07-one-body', img('what-we-believe','','54% 50%')+'<div class="veil deep"></div><div class="in"><div class="eb">Open to every denomination</div><div class="big-it">One body,<br>many churches.</div><div class="thread"></div><div class="sub">We treat each other with respect,<br>and we stay teachable.</div></div>'+FOOT)
post('08-the-fellowship', img('window-light-on-wall','','center 45%')+'<div class="veil deep"></div><div class="in"><div class="eb">For readers</div><div class="big">The Fellowship</div><div class="thread"></div><div class="three"><div><b>Collect</b> the pieces you love</div><div><b>Converse</b> with the Guild</div><div><b>Follow</b> the writers who stay with you</div></div><div class="lab" style="margin-top:1rem">Free, and open to all</div></div>'+FOOT)
post('09-the-guild', img('manifesto-photo','','30% 50%')+'<div class="veil deep"></div><div class="in"><div class="eb">For writers &amp; photographers</div><div class="big">The Guild<br>is open.</div><div class="thread"></div><div class="sub">By application. Every one is read.</div><div class="pill" style="margin-top:1rem">overgrownaltar.com</div></div>')
JS="const p=document.getElementById(new URLSearchParams(location.search).get('p'));p.classList.add('on');window.ready=Promise.all([document.fonts.ready,...[...p.querySelectorAll('img')].map(i=>i.decode().catch(()=>{}))]).then(()=>true);window.ids=[...document.querySelectorAll('.post')].map(x=>x.id);"
open(HERE+'/posts.html','w',encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><style>'+CSS+'</style></head><body>'+''.join(P)+'<script>'+JS+'</script></body></html>')
print('posts', len(P))
