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
/* the reels: the real interface inside a phone, cut with the film */
.sc.paper { background:#E9E3D7; color:#2A2017; } .sc.paper .eb { color:#62372D; } .sc.paper .rule2 { height:1px; width:16rem; background:#9F945E; }
.stage3d { position:absolute; inset:0; perspective:170rem; perspective-origin:50% 40%; }
.rig { position:absolute; left:50%; top:66rem; width:70rem; height:151rem; margin-left:-35rem; transform-style:preserve-3d; will-change:transform; }
.phone { position:absolute; inset:0; border-radius:8.4rem; background:#0B0D0A; padding:1.4rem; box-shadow:0 0 0 .35rem #23271F, 0 0 0 .55rem rgba(159,148,94,.75), 0 7rem 16rem rgba(0,0,0,.85), 0 0 22rem rgba(255,227,163,.14); }
.screen { position:relative; width:100%; height:100%; border-radius:7rem; overflow:hidden; background:#060806; }
.screen img { position:absolute; left:0; top:0; width:100%; height:auto; display:block; will-change:transform; }
.screen::after { content:''; position:absolute; inset:0; border-radius:7rem; box-shadow:inset 0 0 0 1px rgba(243,236,220,.1); background:linear-gradient(115deg, rgba(255,255,255,.06), rgba(255,255,255,0) 28%); }
.cap2 { position:absolute; left:0; right:0; top:28rem; display:flex; flex-direction:column; align-items:center; gap:2rem; text-align:center; padding:0 7rem; }
.cap2 .big { font-size:10.4rem !important; line-height:1; }
.cap2 .big-it { font-size:10.4rem !important; }
.backdrop { opacity:.5; }
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
    <div class="wall" data-wall="10700,13400">WALL</div>
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
# ---- the reels (vertical): the film cut with the real interface, framed as "coming soon" ----
SHOTS='file://'+HERE+'/shots'
_n=[0]
def _uid(svg):
    _n[0]+=1; p='q%d_' % _n[0]
    return svg.replace('id="','id="'+p).replace('url(#','url(#'+p).replace('href="#','href="#'+p)
def sc(tin,tout,inner,fi=600,fo=500,cls=''): return '<div class="sc %s" data-r="%d,%d,%d,%d" data-dy="0">%s</div>' % (cls,tin,tout,fi,fo,inner)
def backdrop(tin,tout,photo='tall-windows-dark-vault',pos='center 44%'): return img(photo,'backdrop','%d,%d,1.12,1.03,0,1,0,-1' % (tin,tout),pos)+'<div class="veil deep"></div><div class="glow"></div>'
def phone(tin,tout,shot,y1,eb,big,y0=0,italic=False):
    cap='<div class="cap2"><div class="eb" data-r="%d,%d,600,400">%s</div><div class="%s" data-r="%d,%d,800,400">%s</div></div>' % (tin+250,tout-150,eb,'big-it' if italic else 'big',tin+450,tout-150,big)
    ph='<div class="stage3d"><div class="rig" data-tilt="%d,%d"><div class="phone" data-r="%d,%d,900,450" data-dy="14"><div class="screen"><img src="%s/%s.jpg" data-k="%d,%d,1,1,0,%s,0,%s"></div></div></div></div>' % (tin,tout,tin+150,tout,SHOTS,shot,tin+500,tout,y0,y1)
    return sc(tin,tout,backdrop(tin,tout)+cap+ph)
def crests(tin,levels,step=470,hold=1500,eb='Ten prestiges'):
    out=''; end=tin+len(levels)*step+hold
    for i,lv in enumerate(levels):
        m=MARKS['crests'][lv-1]; t=tin+200+i*step; last=i==len(levels)-1
        r=('%d,%d,200,220' % (t,t+step+170)) if not last else ('%d,%d,400,400' % (t,end-150))
        out+='<div class="cz" data-r="%s" data-dy="0" data-pop>%s<span class="num">%s</span><span class="nm">%s</span>%s</div>' % (r,_uid(m['svg']),m['numeral'],m['name'],('<span class="note">%s</span>' % m['note']) if last else '')
    return sc(tin,end,'<div class="glow"></div><div class="topline eb" data-r="%d,%d,500,400">%s</div><div class="stage">%s</div>' % (tin+100,end-150,eb,out),400,400), end
def wall(tin,tout,eb='Fifty-four trophies'):
    w=''.join('<div class="tw">%s</div>' % _uid(t['svg']) for t in MARKS['trophies'])
    return sc(tin,tout,'<div class="glow"></div><div class="topline eb" data-r="%d,%d,600,400">%s</div><div class="wall" data-wall="%d,%d">%s</div>' % (tin+150,tout-200,eb,tin+250,tout-500,w))
def title(tin,tout,photo,pos,inner,gray=True,veil='veil',k='1.16,1.04,0,2,0,-2'):
    return sc(tin,tout,img(photo,'gray' if gray else '','%d,%d,%s' % (tin,tout,k),pos)+'<div class="%s"></div><div class="in">%s</div>' % (veil,inner),700,600)
def soon(tin,T,line='A guild of writers and photographers,<br>anchored in Christ.',name='Overgrown Altar'):
    return sc(tin,T,img('window-of-the-ascension-and','','%d,%d,1.14,1.03,0,-2,0,1' % (tin,T),'center 42%')+'<div class="veil deep"></div><div class="in">'
      +'<div data-r="%d,%d,800,1">%s</div>' % (tin+300,T+1,MONO('sm'))
      +'<div class="caps" data-r="%d,%d,900,1">%s</div>' % (tin+600,T+1,name)
      +'<div class="thread" data-draw="%d,%d"></div>' % (tin+1200,T+1)
      +'<div class="big-it" data-r="%d,%d,900,1" style="color:#FFE3A3">Coming soon.</div>' % (tin+1400,T+1)
      +'<div class="sub" data-r="%d,%d,800,1">%s</div>' % (tin+1900,T+1,line)
      +'<div class="url" data-r="%d,%d,800,1">overgrownaltar.com</div></div>' % (tin+2300,T+1),800,1)
def reel(rid,T,scenes): return '\n<section class="ad" id="%s" data-ms="%d">%s</section>\n' % (rid,T,''.join(scenes))
def EL(t,html,**kw): return '<div %s data-r="%s">%s</div>' % (' '.join('%s="%s"' % (k.replace('_','-'),v) for k,v in kw.items()), t, html)

# 1 · COMING SOON: the whole house in twenty seconds
_c1,_e1=crests(11000,[2,4,6,8,10],450,1300)
BODY+=reel('reel1',22000,[
  sc(0,2700,'<div class="in">'+EL('200,2500,1200,500',MONO())+'<div class="thread" data-draw="1000,2500"></div>'+EL('1300,2500,900,500','Coming soon.',**{'class':'big-it','style':'color:#FFE3A3'})+'</div>',1,500),
  title(2500,5500,'duomo-spires','center 30%',EL('2900,5300,1000,500','A guild of writers and photographers, anchored in Christ.',**{'class':'big-it'})+'<div class="thread" data-draw="3900,5300"></div>'),
  phone(5300,8300,'guild','-34','Inside the Guild','A house of your own.'),
  phone(8100,11200,'hearth','-38','The work','Essays. Poetry. Fiction.'),
  _c1,
  wall(_e1-200,_e1+2900),
  soon(_e1+2700,22000),
])
# 2 · EARN YOUR PLACE: the prestiges and the trophies
_c2,_e2=crests(6300,[1,3,5,7,9,10],430,1500)
BODY+=reel('reel2',22000,[
  sc(0,3000,'<div class="in"><div class="stack" style="gap:2.4rem"><div class="no sm" data-r="250,2800,600,400"><i>No follower counts.<span class="strike" data-draw="1200,2800,500" data-origin="left"></span></i></div><div class="big-it huge" data-r="1600,2800,800,400" style="color:#FFE3A3">Here, the work counts.</div></div></div>',1,500),
  phone(2800,6400,'prestige','-40','Every published piece','raises you.'),
  _c2,
  phone(_e2-200,_e2+3200,'trophies','-52','Fifty-four trophies','to earn.',y0='-8'),
  sc(_e2+3000,_e2+5800,'<div class="glow"></div><div class="in"><div class="eb" data-r="%d,%d,600,400">The rarest are won once</div><div class="rare">%s</div></div>' % (_e2+3150,_e2+5600,''.join('<div data-r="%d,%d,700,500" data-pop>%s<span class="lab">%s</span></div>' % (_e2+3200+k*320,_e2+5600,_uid({t['id']:t for t in MARKS['trophies']}[i]['svg']),{t['id']:t for t in MARKS['trophies']}[i]['name']) for k,i in enumerate(['lion','cathedral','serpent'])))),
  soon(_e2+5600,22000,'Earn your place.'),
])
# 3 · THE WORK: write, be read, keep
BODY+=reel('reel3',22500,[
  sc(0,4300,'<div class="in"><div class="stack"><div class="no" data-r="250,4100,600,500"><i>No likes.<span class="strike" data-draw="2700,4100,450" data-origin="left"></span></i></div><div class="no" data-r="1050,4100,600,500"><i>No followers.<span class="strike" data-draw="2900,4100,450" data-origin="left"></span></i></div><div class="no" data-r="1850,4100,600,500"><i>No algorithm.<span class="strike" data-draw="3100,4100,450" data-origin="left"></span></i></div></div></div>',1,500),
  title(4100,6500,'window-light-on-wall','center 45%',EL('4500,6300,1000,500','Only the work.',**{'class':'big-it huge','style':'color:#FFE3A3'})+'<div class="thread" data-draw="5300,6300"></div>',gray=False,k='1.15,1.03,-2,0,2,0'),
  phone(6300,9500,'write','-6','At your desk','Write.',italic=True),
  phone(9300,12700,'reading','-30','By an editor, then by the Guild','Be read.',italic=True,y0='-6'),
  phone(12500,15700,'library','-10','On your own shelves','Keep what stays.',italic=True),
  phone(15500,18900,'vault','-34','A vault of your own','Your work, kept.',italic=True,y0='-4'),
  soon(18700,22500),
])
# 4 · THREE ROOMS: the content
def room(tin,n,name,line,photo,pos,shot,short,gray=True):
    return [title(tin,tin+2300,photo,pos,EL('%d,%d,700,400' % (tin+250,tin+2100),n,**{'class':'room-n'})+EL('%d,%d,900,400' % (tin+450,tin+2100),name,**{'class':'caps'})+'<div class="thread" data-draw="%d,%d"></div>' % (tin+1100,tin+2100)+EL('%d,%d,800,400' % (tin+1300,tin+2100),line,**{'class':'sub'}),gray=gray,veil='veil'),
            phone(tin+2100,tin+5000,shot,'-36',n+' · '+name,short,y0='-10')]
BODY+=reel('reel4',22000,[
  title(0,2700,'duomo-pigeons','center 40%',EL('200,2500,1000,500',MONO('sm'))+EL('600,2500,1000,500','Three rooms,<br>one altar.',**{'class':'big-it'})+'<div class="thread" data-draw="1400,2500"></div>'),
  *room(2500,'01','The Watchtower','Essays that weigh the age<br>against the cross.','duomo-spires','center 30%','watchtower','Essays.'),
  *room(7300,'02','The Hearth','Prose, poetry and fiction,<br>made with reverence.','window-of-the-ascension-and','center 45%','hearth','Prose. Poetry. Fiction.',gray=False),
  *room(12100,'03','The Perimeter','True accounts from the edge<br>of the unseen.','chapel-and-cross-under-a','72% 50%','perimeter','Testimony.'),
  soon(16900,22000,'Read in the Fellowship. Write for the Guild.'),
])
# 5 · THE FELLOWSHIP: for those who come to read (it opens on paper, not on night)
BODY+=reel('reel5',21000,[
  sc(0,4300,'<div class="in">'+EL('300,4100,700,500','For readers',**{'class':'eb'})+EL('700,4100,900,500','Not everyone here writes.',**{'class':'big-it','style':'color:#2A2017'})+'<div class="rule2" data-draw="1700,4100"></div>'+EL('2100,4100,900,500','Some come to read.',**{'class':'big-it huge','style':'color:#62372D'})+'</div>',1,600,'paper'),
  phone(4100,7600,'reading','-34','Read by an editor first','Read.',italic=True,y0='-4'),
  phone(7400,10600,'library','-10','Shelves of your own','Collect what stays.',italic=True),
  phone(10400,14000,'way','-26','Seven stations · twenty-one badges','Walk The Way.',italic=True),
  title(13800,16400,'what-we-believe','54% 50%',EL('14100,16200,700,400','Open to every denomination',**{'class':'eb'})+EL('14400,16200,900,400','One body,<br>many churches.',**{'class':'big-it'})+'<div class="thread" data-draw="15100,16200"></div>',veil='veil deep'),
  soon(16200,21000,'Free, and open to all.','The Fellowship'),
])
JS='''
const q = new URLSearchParams(location.search), ad = document.getElementById(q.get('ad') || 'thesis'), fmt = q.get('fmt') || 'v';
document.body.classList.add('fmt-' + fmt);
const rem = Math.min(innerWidth, innerHeight) / 100;
document.documentElement.style.fontSize = rem + 'px';
document.querySelectorAll('.ad').forEach((x) => { if (x !== ad) x.remove(); });
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
  kf.push({ ...hid, offset: at(tin), easing: EASE }, { ...shown, offset: at(tout < T ? Math.min(tin + fi, tout) : tin + fi) });
  if (tout < T) { kf.push({ ...shown, offset: at(Math.min(tout, Math.max(tin + fi, tout - fo))), easing: 'ease-in' }, { ...gone, offset: at(tout) }); if (at(tout) < 1) kf.push({ ...gone, offset: 1 }); }
  else if (at(tin + fi) < 1) kf.push({ ...shown, offset: 1 });
  anims.push(el.animate(kf, { duration: T, fill: 'both' }));
});
ad.querySelectorAll('[data-wall]').forEach((wall) => { const [w0, w1] = wall.dataset.wall.split(',').map(Number), cols = fmt === 'v' ? 6 : 9; wall.querySelectorAll('.tw').forEach((el, i) => { const tin = w0 + ((i % cols) + Math.floor(i / cols)) * 95, a = { opacity: 0, transform: 'scale(.6)' }, b = { opacity: 1, transform: 'scale(1)' }, c = { opacity: 0, transform: 'scale(1)' };
  anims.push(el.animate([{ ...a, offset: 0 }, { ...a, offset: at(tin), easing: EASE }, { ...b, offset: at(tin + 520) }, { ...b, offset: at(w1) }, { ...c, offset: at(w1 + 400) }, { ...c, offset: 1 }], { duration: T, fill: 'both' })); }); });
ad.querySelectorAll('[data-tilt]').forEach((el) => { const [tin, tout] = el.dataset.tilt.split(',').map(Number), a = 'rotateY(-9deg) rotateX(5deg) translateZ(0)', b = 'rotateY(7deg) rotateX(2deg) translateZ(0)';
  anims.push(el.animate([{ transform: a, offset: 0 }, { transform: a, offset: at(tin) }, { transform: b, offset: at(tout) }, { transform: b, offset: 1 }], { duration: T, fill: 'both' })); });
ad.querySelectorAll('[data-draw]').forEach((el) => {
  const [tin, tout, dur = 1100] = el.dataset.draw.split(',').map(Number);
  el.style.transformOrigin = el.dataset.origin === 'left' ? 'left center' : 'center';
  const a = { transform: 'scaleX(0)', opacity: 1 }, b = { transform: 'scaleX(1)', opacity: 1 }, c = { transform: 'scaleX(1)', opacity: 0 };
  const kf = [{ ...a, offset: 0 }, { ...a, offset: at(tin), easing: EASE }, { ...b, offset: at(tout < T ? Math.min(tin + dur, tout) : tin + dur) }];
  if (tout < T) kf.push({ ...b, offset: at(Math.min(tout, Math.max(tin + dur, tout - 500))) }, { ...c, offset: at(tout) }, { ...c, offset: 1 }); else kf.push({ ...b, offset: 1 });
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
