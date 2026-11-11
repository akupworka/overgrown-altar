# Builds ad.html (the motion ads) from the site's own photographs, type and mark.
import re, os
HERE=os.path.dirname(os.path.abspath(__file__))
REPO=os.path.dirname(HERE)
R='file://'+REPO+'/public'
mono=open(REPO+'/src/components/Monogram.astro',encoding='utf-8').read()
PATH=re.search(r'<path fill-rule="evenodd" fill=\{color\} d="([^"]+)"',mono).group(1)
import json
MARKS=json.load(open(HERE+'/marks.json',encoding='utf-8'))
def MONO(cls=''): return '<svg class="mono-mark %s" viewBox="0 0 918 888" aria-hidden="true"><path fill-rule="evenodd" fill="currentColor" d="%s"/></svg>' % (cls, PATH)
def img(n,cls='',k='',pos='center'): return '<img class="bg %s" src="%s/images/%s.jpg" data-k="%s" style="object-position:%s">' % (cls,R,n,k,pos)
FONTS='''
@font-face { font-family:'Cormorant'; src:url('R/fonts/cormorant-300.woff2') format('woff2'); font-weight:300; }
@font-face { font-family:'Cormorant'; src:url('R/fonts/cormorant-500.woff2') format('woff2'); font-weight:500; }
@font-face { font-family:'Cormorant'; src:url('R/fonts/cormorant-600.woff2') format('woff2'); font-weight:600; }
@font-face { font-family:'Cormorant'; src:url('R/fonts/cormorant-italic-400.woff2') format('woff2'); font-weight:400; font-style:italic; }
@font-face { font-family:'Alte Haas'; src:url('R/fonts/alte-haas-400.woff2') format('woff2'); font-weight:400; }
@font-face { font-family:'Alte Haas'; src:url('R/fonts/alte-haas-700.woff2') format('woff2'); font-weight:700; }
'''.replace('R/',R+'/')
CSS=FONTS+'''
*,*::before,*::after { box-sizing:border-box; }
html,body { margin:0; width:100%; height:100%; background:#060806; overflow:hidden; }
body { font-family:'Cormorant',serif; color:#F3ECDC; -webkit-font-smoothing:antialiased; }
.ad { position:absolute; inset:0; display:none; } .ad.on { display:block; }
.sc { position:absolute; inset:0; overflow:hidden; background:#060806; }
.bg { position:absolute; left:0; top:0; width:100%; height:100%; object-fit:cover; will-change:transform; }
.gray { filter:grayscale(1) contrast(1.08); }
.veil { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 46%, rgba(6,8,6,.34), rgba(6,8,6,.82) 78%), linear-gradient(180deg, rgba(6,8,6,.55), rgba(6,8,6,.1) 30%, rgba(6,8,6,.1) 62%, rgba(6,8,6,.8)); }
.veil.deep { background:radial-gradient(ellipse at 50% 46%, rgba(6,8,6,.62), rgba(6,8,6,.93) 76%); }
.veil.low { background:linear-gradient(180deg, rgba(6,8,6,.5), rgba(6,8,6,.12) 28%, rgba(6,8,6,.35) 52%, rgba(6,8,6,.94) 84%); }
.in { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; gap:2.6rem; padding:8rem 9rem; }
.in.low { justify-content:flex-end; padding-bottom:11rem; }
.fmt-v .in { padding:27rem 7rem 36rem; }
.fmt-v .in.low { padding-bottom:40rem; }
.fmt-h .in { padding:7rem 20rem; }
.fmt-h .in.low { padding-bottom:9rem; }
.lab { font-family:'Alte Haas',sans-serif; font-size:1.95rem; letter-spacing:.36em; text-transform:uppercase; color:#FFE3A3; }
.lab.bone { color:#E6DFD0; }
.eb { font-weight:600; font-size:2.5rem; letter-spacing:.3em; text-transform:uppercase; color:#FFE3A3; }
.big { font-weight:500; font-size:10.5rem; line-height:1; letter-spacing:.005em; text-wrap:balance; }
.caps { font-weight:500; font-size:9.2rem; line-height:1; letter-spacing:.06em; text-transform:uppercase; }
.big-it { font-style:italic; font-weight:400; font-size:9.6rem; line-height:1.06; text-wrap:balance; }
.sub { font-style:italic; font-weight:400; font-size:4.3rem; line-height:1.32; color:#E0D9C9; max-width:76rem; text-wrap:balance; }
.fmt-h .big { font-size:12rem; } .fmt-h .big-it { font-size:11rem; } .fmt-h .caps { font-size:11rem; } .fmt-h .sub { font-size:4.6rem; max-width:110rem; }
.fmt-v .big { font-size:12.8rem; } .fmt-v .big-it { font-size:12.4rem; } .fmt-v .caps { font-size:10.6rem; } .fmt-v .sub { font-size:5.5rem; } .fmt-v .lab { font-size:2.3rem; } .fmt-v .eb { font-size:2.9rem; } .fmt-v .no { font-size:13.4rem; } .fmt-v .words span { font-size:9.6rem; } .fmt-v .url { font-size:2.8rem; } .fmt-v .mono-mark.sm { height:16rem; }
.huge { font-size:13.5rem !important; } .fmt-v .huge { font-size:15.5rem !important; } .fmt-h .huge { font-size:15rem !important; }
.fmt-s .pane .name .the { display:block; } .fmt-s .pane .name { font-size:3.7rem; line-height:1.1; } .fmt-s .pane .cap { bottom:7rem; }
.fmt-v .bg.perim { object-position:74% 50% !important; }
.thread { height:.34rem; width:26rem; border-radius:1rem; background:linear-gradient(90deg,#3E7BFF,#B05BFF,#FF3B4E,#FFC44D,#3DE0A0); }
.mono-mark { height:26rem; width:auto; color:#F3ECDC; display:block; }
.mono-mark.sm { height:13rem; }
.url { font-family:'Alte Haas',sans-serif; font-weight:700; font-size:2.5rem; letter-spacing:.3em; text-transform:uppercase; color:#12160F; background:#FFE3A3; padding:1.9rem 3.6rem 1.7rem; border-radius:99rem; }
.stack { display:flex; flex-direction:column; align-items:center; gap:1.2rem; }
.no { font-weight:500; font-size:11.5rem; line-height:1.04; }
.fmt-h .no { font-size:12.5rem; }
.no i { position:relative; font-style:normal; display:inline-block; }
.no .strike { position:absolute; left:-3%; right:-3%; top:54%; height:.42rem; background:#FFE3A3; }
.words { display:flex; flex-wrap:wrap; justify-content:center; gap:.6rem 3.4rem; max-width:84rem; }
.fmt-h .words { max-width:150rem; }
.words span { font-weight:500; font-size:8rem; line-height:1.12; }
.fmt-h .words span { font-size:9rem; }
.tri { position:absolute; inset:0; display:grid; grid-template-columns:repeat(3,1fr); gap:.5rem; background:#060806; }
.fmt-v .tri { grid-template-columns:1fr; grid-template-rows:repeat(3,1fr); }
.pane { position:relative; overflow:hidden; }
.pane .veil { background:linear-gradient(180deg, rgba(6,8,6,.25), rgba(6,8,6,.2) 40%, rgba(6,8,6,.9)); }
.pane .cap { position:absolute; left:0; right:0; bottom:9rem; display:flex; flex-direction:column; align-items:center; gap:1.4rem; text-align:center; padding:0 2rem; }
.fmt-v .pane .veil { background:linear-gradient(90deg, rgba(6,8,6,.86), rgba(6,8,6,.35) 60%, rgba(6,8,6,.15)); }
.fmt-v .pane .cap { top:0; bottom:0; right:auto; width:74%; justify-content:center; align-items:flex-start; text-align:left; padding:0 0 0 7rem; }
.pane .name { font-weight:500; font-size:5.2rem; line-height:1; letter-spacing:.07em; text-transform:uppercase; }
.fmt-h .pane .name { font-size:6.4rem; } .fmt-v .pane .name { font-size:7.4rem; }
.pane .lab { font-size:1.5rem; letter-spacing:.3em; }
.fmt-v .pane .lab { font-size:2rem; } .fmt-h .pane .lab { font-size:1.8rem; }
.tri-top { position:absolute; left:0; right:0; top:9rem; text-align:center; }
.fmt-v .tri-top { display:none; }
.glow { position:absolute; inset:0; background:radial-gradient(ellipse at 50% 48%, rgba(255,227,163,.13), rgba(6,8,6,0) 58%); }
.stage { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; }
.cz { position:absolute; display:flex; flex-direction:column; align-items:center; gap:2.2rem; text-align:center; }
.cz svg { width:44rem; height:44rem; display:block; }
.fmt-h .cz svg { width:38rem; height:38rem; } .fmt-v .cz svg { width:56rem; height:56rem; }
.cz .num { font-weight:500; font-size:3.6rem; letter-spacing:.3em; color:#9F945E; }
.cz .nm { font-weight:500; font-size:8.6rem; line-height:1; letter-spacing:.06em; text-transform:uppercase; }
.fmt-v .cz .nm { font-size:10.4rem; }
.cz .note { font-style:italic; font-size:4.2rem; color:#E0D9C9; }
.fmt-v .cz .note { font-size:5rem; }
.topline { position:absolute; left:0; right:0; top:8rem; text-align:center; }
.fmt-v .topline { top:30rem; } .fmt-h .topline { top:6.4rem; }
.pips { position:absolute; left:0; right:0; bottom:9rem; display:flex; justify-content:center; gap:2rem; }
.fmt-v .pips { bottom:40rem; } .fmt-h .pips { bottom:6.5rem; }
.pip { position:relative; width:1.5rem; height:1.5rem; transform:rotate(45deg); box-shadow:inset 0 0 0 1px rgba(159,148,94,.8); }
.pip i { position:absolute; inset:0; background:#FFE3A3; }
.wall { position:absolute; left:50%; top:54%; display:grid; grid-template-columns:repeat(9, 9.4rem); gap:1.7rem 1.5rem; transform:translate(-50%,-50%); }
.fmt-h .wall { grid-template-columns:repeat(9, 11.4rem); gap:1.6rem 5rem; top:55%; }
.fmt-v .wall { grid-template-columns:repeat(6, 11.6rem); gap:1.8rem 3rem; top:55%; }
.no.sm { font-size:9.2rem; white-space:nowrap; } .fmt-v .no.sm { font-size:9.8rem; } .fmt-h .no.sm { font-size:11rem; }
.tw svg { width:100%; height:auto; display:block; }
.rare { display:flex; align-items:flex-start; justify-content:center; gap:5rem; }
.fmt-v .rare { gap:3rem; } .fmt-s .rare { gap:3rem; }
.rare > div { display:flex; flex-direction:column; align-items:center; gap:2.2rem; width:27rem; text-align:center; }
.fmt-h .rare > div { width:34rem; }
.rare svg { width:100%; height:auto; display:block; }
.rare .lab { font-size:1.6rem; letter-spacing:.26em; line-height:1.5; color:#E6DFD0; }
.fmt-h .rare .lab { font-size:1.9rem; }
.room-n { font-weight:500; font-size:4.6rem; letter-spacing:.3em; color:#FFE3A3; }
'''
BODY='''
<!-- 1 · THE THESIS (15s): the brand film -->
<section class="ad" id="thesis" data-ms="15000">
  <div class="sc" data-r="0,3400,1,700" data-dy="0">
    <div class="in">
      <div data-r="250,3200,1300,600">MONO_BIG</div>
      <div class="thread" data-draw="1100,3200"></div>
      <div class="lab bone" data-r="1500,3200,900,600">Overgrown Altar</div>
    </div>
  </div>
  <div class="sc" data-r="3000,8400,900,700" data-dy="0">
    IMG(labyrinth-stained-light||3000,8400,1.16,1.04,2,1,-2,-1|60% 60%)
    <div class="veil"></div>
    <div class="in">
      <div class="eb" data-r="3500,8100,800,500">The Core Thesis</div>
      <div class="big-it"><span data-r="3900,8100,1100,500" style="display:block">Broken pieces of a mirror</span><span data-r="5100,8100,1100,500" style="display:block">that Christ holds whole.</span></div>
      <div class="thread" data-draw="6200,8100"></div>
    </div>
  </div>
  <div class="sc" data-r="8000,12300,800,600" data-dy="0">
    <div class="tri">
      <div class="pane" data-r="8100,12300,900,500" data-dy="0">IMG(duomo-spires|gray|8000,12300,1.14,1.03,0,2,0,-2|center 30%)<div class="veil"></div>
        <div class="cap" data-r="8500,12100,800,400"><span class="lab">Essays</span><span class="name"><span class="the">The </span>Watchtower</span></div></div>
      <div class="pane" data-r="8600,12300,900,500" data-dy="0">IMG(window-of-the-ascension-and||8000,12300,1.14,1.03,0,-2,0,2|center 45%)<div class="veil"></div>
        <div class="cap" data-r="9100,12100,800,400"><span class="lab">Poetry · Fiction</span><span class="name"><span class="the">The </span>Hearth</span></div></div>
      <div class="pane" data-r="9100,12300,900,500" data-dy="0">IMG(chapel-and-cross-under-a|gray|8000,12300,1.14,1.03,0,2,0,-2|40% 50%)<div class="veil"></div>
        <div class="cap" data-r="9700,12100,800,400"><span class="lab">Testimony</span><span class="name"><span class="the">The </span>Perimeter</span></div></div>
    </div>
    <div class="tri-top eb" data-r="10200,12100,800,400">Three rooms, one altar</div>
  </div>
  <div class="sc" data-r="12000,15000,800,1" data-dy="0">
    IMG(tall-windows-dark-vault||12000,15000,1.1,1.02,0,1,0,-1|center 44%)
    <div class="veil deep"></div>
    <div class="in">
      <div data-r="12300,15001,900,1">MONO_SM</div>
      <div class="sub" data-r="12700,15001,900,1" style="color:#F3ECDC">A guild of writers and photographers,<br>anchored in Christ.</div>
      <div class="url" data-r="13300,15001,800,1">overgrownaltar.com</div>
    </div>
  </div>
</section>

<!-- 2 · THE CALL (15s): for writers -->
<section class="ad" id="call" data-ms="15000">
  <div class="sc" data-r="0,5000,1,600" data-dy="0">
    <div class="in"><div class="stack">
      <div class="no" data-r="300,4800,600,500"><i>No likes.<span class="strike" data-draw="3300,4800,500" data-origin="left"></span></i></div>
      <div class="no" data-r="1300,4800,600,500"><i>No followers.<span class="strike" data-draw="3550,4800,500" data-origin="left"></span></i></div>
      <div class="no" data-r="2300,4800,600,500"><i>No algorithm.<span class="strike" data-draw="3800,4800,500" data-origin="left"></span></i></div>
    </div></div>
  </div>
  <div class="sc" data-r="4700,9100,900,700" data-dy="0">
    IMG(window-light-on-wall||4700,9100,1.15,1.03,-2,0,2,0|center 45%)
    <div class="veil"></div>
    <div class="in">
      <div class="big-it huge" data-r="5200,8800,1100,500" style="color:#FFE3A3">Only the work.</div>
      <div class="thread" data-draw="6100,8800"></div>
      <div class="sub" data-r="6500,8800,900,500">Every piece is read by an editor<br>before it is published.</div>
    </div>
  </div>
  <div class="sc" data-r="8800,12300,800,600" data-dy="0">
    IMG(manifesto-photo||8800,12300,1.16,1.04,-2,0,2,0|30% 50%)
    <div class="veil deep"></div>
    <div class="in">
      <div class="words">
        <span data-r="9100,12000,500,400">Essays.</span><span data-r="9450,12000,500,400">Poetry.</span><span data-r="9800,12000,500,400">Fiction.</span><span data-r="10150,12000,500,400">Testimony.</span><span data-r="10500,12000,500,400">Photographs.</span>
      </div>
      <div class="lab" data-r="11000,12000,700,400">For those anchored in Christ</div>
    </div>
  </div>
  <div class="sc" data-r="12000,15000,800,1" data-dy="0">
    IMG(tall-windows-dark-vault||12000,15000,1.1,1.02,0,1,0,-1|center 44%)
    <div class="veil deep"></div>
    <div class="in">
      <div data-r="12200,15001,900,1">MONO_SM</div>
      <div class="big" data-r="12600,15001,900,1">The Guild is open.</div>
      <div class="sub" data-r="13100,15001,800,1">By application. Every one is read.</div>
      <div class="url" data-r="13600,15001,800,1">overgrownaltar.com</div>
    </div>
  </div>
</section>

<!-- 3 · THREE ROOMS (20s): the tour -->
<section class="ad" id="rooms" data-ms="20000">
  <div class="sc" data-r="0,3500,1,700" data-dy="0">
    IMG(duomo-pigeons|gray|0,3500,1.16,1.04,0,2,0,-1|center 40%)
    <div class="veil"></div>
    <div class="in">
      <div data-r="200,3300,1000,500">MONO_SM</div>
      <div class="caps" data-r="600,3300,1000,500">Overgrown Altar</div>
      <div class="thread" data-draw="1400,3300"></div>
      <div class="sub" data-r="1700,3300,900,500">Three rooms, one altar.</div>
    </div>
  </div>
  <div class="sc" data-r="3200,7700,800,700" data-dy="0">
    IMG(duomo-spires|gray|3200,7700,1.16,1.04,0,3,0,-2|center 30%)
    <div class="veil low"></div>
    <div class="in low">
      <div class="room-n" data-r="3600,7400,700,500">01</div>
      <div class="caps" data-r="3900,7400,1000,500">The Watchtower</div>
      <div class="thread" data-draw="4700,7400"></div>
      <div class="sub" data-r="5000,7400,900,500">Essays that weigh the age<br>against the cross.</div>
    </div>
  </div>
  <div class="sc" data-r="7400,11900,800,700" data-dy="0">
    IMG(window-of-the-ascension-and||7400,11900,1.16,1.04,0,-3,0,2|center 45%)
    <div class="veil low"></div>
    <div class="in low">
      <div class="room-n" data-r="7800,11600,700,500">02</div>
      <div class="caps" data-r="8100,11600,1000,500">The Hearth</div>
      <div class="thread" data-draw="8900,11600"></div>
      <div class="sub" data-r="9200,11600,900,500">Prose, poetry and fiction,<br>made with reverence.</div>
    </div>
  </div>
  <div class="sc" data-r="11600,16100,800,700" data-dy="0">
    IMG(chapel-and-cross-under-a|gray perim|11600,16100,1.16,1.04,2,0,-2,0|40% 50%)
    <div class="veil low"></div>
    <div class="in low">
      <div class="room-n" data-r="12000,15800,700,500">03</div>
      <div class="caps" data-r="12300,15800,1000,500">The Perimeter</div>
      <div class="thread" data-draw="13100,15800"></div>
      <div class="sub" data-r="13400,15800,900,500">True accounts from the edge<br>of the unseen.</div>
    </div>
  </div>
  <div class="sc" data-r="15800,20000,800,1" data-dy="0">
    IMG(labyrinth-stained-light||15800,20000,1.12,1.02,2,1,-1,0|60% 60%)
    <div class="veil deep"></div>
    <div class="in">
      <div class="big-it" data-r="16200,20001,1000,1">Read in the Fellowship.<br>Write for the Guild.</div>
      <div class="thread" data-draw="17200,20001"></div>
      <div class="lab bone" data-r="17500,20001,800,1">Open to every denomination</div>
      <div class="url" data-r="18000,20001,800,1">overgrownaltar.com</div>
    </div>
  </div>
</section>
'''
RANKS=r"""
<!-- 4 · EARN YOUR PLACE (20s): the prestiges and the trophies -->
<section class="ad" id="ranks" data-ms="20000">
  <div class="sc" data-r="0,3200,1,500" data-dy="0">
    <div class="in"><div class="stack" style="gap:2.4rem">
      <div class="no sm" data-r="250,3000,600,400"><i>No follower counts.<span class="strike" data-draw="1300,3000,500" data-origin="left"></span></i></div>
      <div class="big-it huge" data-r="1700,3000,800,400" style="color:#FFE3A3">Here, the work counts.</div>
    </div></div>
  </div>
  <div class="sc" data-r="2900,10700,500,500" data-dy="0">
    <div class="glow"></div>
    <div class="topline eb" data-r="3000,10500,600,400">Ten prestiges</div>
    <div class="stage">CRESTS</div>
    <div class="pips" data-r="3000,10500,500,400" data-dy="0">PIPS</div>
  </div>
  <div class="sc" data-r="10400,13900,500,600" data-dy="0">
    <div class="glow"></div>
    <div class="topline eb" data-r="10600,13700,600,400">Fifty-four trophies</div>
    <div class="wall" id="wall">WALL</div>
  </div>
  <div class="sc" data-r="13400,16500,600,600" data-dy="0">
    <div class="glow"></div>
    <div class="in"><div class="eb" data-r="13500,16300,600,400">The rarest are won once</div><div class="rare">RARE</div></div>
  </div>
  <div class="sc" data-r="16200,20000,700,1" data-dy="0">
    IMG(tall-windows-dark-vault||16200,20000,1.1,1.02,0,1,0,-1|center 44%)
    <div class="veil deep"></div>
    <div class="in">
      <div class="big" data-r="16600,20001,900,1">Earn your place.</div>
      <div class="thread" data-draw="17300,20001"></div>
      <div class="sub" data-r="17600,20001,800,1">The Guild is open. By application.</div>
      <div class="url" data-r="18100,20001,800,1">overgrownaltar.com</div>
    </div>
  </div>
</section>
"""
_t0=3000; _step=540; _c=''
for _i,_m in enumerate(MARKS['crests']):
    _tin=_t0+_i*_step
    _r=('%d,%d,200,220' % (_tin,_tin+_step+180)) if _i<9 else ('%d,%d,450,450' % (_tin,10500))
    _c+='<div class="cz" data-r="%s" data-dy="0" data-pop>%s<span class="num">%s</span><span class="nm">%s</span>%s</div>' % (_r,_m['svg'],_m['numeral'],_m['name'],('<span class="note">%s</span>' % _m['note']) if _i==9 else '')
_p=''.join('<span class="pip"><i data-r="%d,10500,180,400" data-dy="0"></i></span>' % (_t0+_i*_step) for _i in range(10))
_w=''.join('<div class="tw" data-wave="%d">%s</div>' % (_i,_t['svg']) for _i,_t in enumerate(MARKS['trophies']))
_by={_t['id']:_t for _t in MARKS['trophies']}
_pre=lambda svg,p: svg.replace('id="','id="'+p).replace('url(#','url(#'+p).replace('href="#','href="#'+p)
_rare=''.join('<div data-r="%d,16300,700,500" data-pop>%s<span class="lab">%s</span></div>' % (13500+_k*350,_pre(_by[_i]['svg'],'r_'),_by[_i]['name']) for _k,_i in enumerate(['lion','cathedral','serpent']))
BODY+=RANKS.replace('CRESTS',_c).replace('PIPS',_p).replace('WALL',_w).replace('RARE',_rare)
JS='''
const q = new URLSearchParams(location.search), ad = document.getElementById(q.get('ad') || 'thesis'), fmt = q.get('fmt') || 'v';
document.body.classList.add('fmt-' + fmt);
const rem = Math.min(innerWidth, innerHeight) / 100;
document.documentElement.style.fontSize = rem + 'px';
ad.classList.add('on');
const T = +ad.dataset.ms, anims = [], EASE = 'cubic-bezier(.16,1,.3,1)';
const at = (x) => Math.max(0, Math.min(1, x / T));
const tidy = (kf) => kf.filter((k, i, a) => i === 0 || k.offset > a[i - 1].offset || (k.offset === a[i - 1].offset && i === a.length - 1 ? false : k.offset >= a[i - 1].offset));
ad.querySelectorAll('[data-r]').forEach((el) => {
  const [tin, tout, fi = 900, fo = 600] = el.dataset.r.split(',').map(Number), dy = (el.dataset.dy !== undefined ? +el.dataset.dy : 2.6) * rem;
  const pop = el.dataset.pop !== undefined;
  const hid = { opacity: 0, transform: pop ? 'scale(.86)' : `translateY(${dy}px)` }, shown = { opacity: 1, transform: pop ? 'scale(1)' : 'translateY(0px)' }, gone = { opacity: 0, transform: pop ? 'scale(1.07)' : `translateY(${-dy / 2}px)` };
  const kf = [];
  if (tin > 0) kf.push({ ...hid, offset: 0 });
  kf.push({ ...hid, offset: at(tin), easing: EASE }, { ...shown, offset: at(tin + fi) });
  if (tout < T) { kf.push({ ...shown, offset: at(Math.max(tin + fi, tout - fo)), easing: 'ease-in' }, { ...gone, offset: at(tout) }); if (at(tout) < 1) kf.push({ ...gone, offset: 1 }); }
  else if (at(tin + fi) < 1) kf.push({ ...shown, offset: 1 });
  anims.push(el.animate(kf, { duration: T, fill: 'both' }));
});
const wall = ad.querySelector('#wall');
if (wall) { const cols = fmt === 'v' ? 6 : 9; wall.querySelectorAll('.tw').forEach((el, i) => { const tin = 10700 + ((i % cols) + Math.floor(i / cols)) * 95, a = { opacity: 0, transform: 'scale(.6)' }, b = { opacity: 1, transform: 'scale(1)' }, c = { opacity: 0, transform: 'scale(1)' };
  anims.push(el.animate([{ ...a, offset: 0 }, { ...a, offset: at(tin), easing: EASE }, { ...b, offset: at(tin + 520) }, { ...b, offset: at(13400) }, { ...c, offset: at(13800) }, { ...c, offset: 1 }], { duration: T, fill: 'both' })); }); }
ad.querySelectorAll('[data-draw]').forEach((el) => {
  const [tin, tout, dur = 1100] = el.dataset.draw.split(',').map(Number);
  el.style.transformOrigin = el.dataset.origin === 'left' ? 'left center' : 'center';
  const a = { transform: 'scaleX(0)', opacity: 1 }, b = { transform: 'scaleX(1)', opacity: 1 }, c = { transform: 'scaleX(1)', opacity: 0 };
  const kf = [{ ...a, offset: 0 }, { ...a, offset: at(tin), easing: EASE }, { ...b, offset: at(tin + dur) }];
  if (tout < T) kf.push({ ...b, offset: at(Math.max(tin + dur, tout - 500)) }, { ...c, offset: at(tout) }, { ...c, offset: 1 }); else kf.push({ ...b, offset: 1 });
  anims.push(el.animate(kf, { duration: T, fill: 'both' }));
});
ad.querySelectorAll('[data-k]').forEach((el) => {
  if (!el.dataset.k) return;
  const [tin, tout, s0, s1, x0, y0, x1, y1] = el.dataset.k.split(',').map(Number);
  const a = `translate(${x0}%, ${y0}%) scale(${s0})`, b = `translate(${x1}%, ${y1}%) scale(${s1})`;
  const kf = [{ transform: a, offset: 0 }]; if (at(tin) > 0) kf.push({ transform: a, offset: at(tin) }); kf.push({ transform: b, offset: at(tout) }); if (at(tout) < 1) kf.push({ transform: b, offset: 1 });
  anims.push(el.animate(kf, { duration: T, fill: 'both' }));
});
anims.forEach((a) => a.pause());
window.T = T;
window.seek = (ms) => { anims.forEach((a) => { a.currentTime = Math.min(ms, T - 0.01); }); };
window.ready = Promise.all([document.fonts.ready, ...[...ad.querySelectorAll('img')].map((i) => i.decode().catch(() => {}))]).then(() => { seek(0); return true; });
'''
body=BODY.replace('MONO_BIG',MONO()).replace('MONO_SM',MONO('sm'))
body=re.sub(r'IMG\(([^|)]*)\|([^|)]*)\|([^|)]*)\|([^)]*)\)', lambda m: img(m.group(1),m.group(2),m.group(3),m.group(4)), body)
open(HERE+'/ad.html','w',encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><style>'+CSS+'</style></head><body>'+body+'<script>'+JS+'</script></body></html>')
print('built', len(body))
