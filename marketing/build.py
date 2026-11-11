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
/* the second pass: close-ups of the real pages, paper scenes, a lighter veil */
.cu { position:absolute; border-radius:2.6rem; overflow:hidden; background:#0B0D0A; box-shadow:0 0 0 1px rgba(159,148,94,.8), 0 5rem 12rem rgba(0,0,0,.5); }
.cu img { position:absolute; left:0; top:0; height:auto; max-width:none; display:block; will-change:transform; }
.veil.lite { background:radial-gradient(ellipse at 50% 46%, rgba(6,8,6,.36), rgba(6,8,6,.8) 84%); }
.veil.mid { background:radial-gradient(ellipse at 50% 46%, rgba(6,8,6,.5), rgba(6,8,6,.86) 82%); }
.in.sh > * { text-shadow:0 .2rem 2.6rem rgba(0,0,0,.9), 0 0 .6rem rgba(0,0,0,.5); }
.sc.paper .big-it, .sc.paper .big, .sc.paper .caps { color:#2A2017; }
.sc.paper .lab { color:#62372D; }
.hd { position:absolute; left:0; right:0; top:25rem; display:flex; flex-direction:column; align-items:center; gap:1.8rem; text-align:center; padding:0 7rem; }
.hd .q { font-style:italic; font-size:6.4rem; line-height:1.1; }
.beat { font-weight:500; font-size:17rem; line-height:1; }
/* the second set of reels: reply cards, sound, read-aloud lines, a paper sheet, a computer's window, numerals */
.cards { position:absolute; left:6rem; right:6rem; top:30rem; display:flex; flex-direction:column; gap:2.6rem; }
.topfade { position:absolute; left:0; right:0; top:0; height:40rem; background:linear-gradient(180deg, #060806 0, #060806 21rem, rgba(6,8,6,0) 100%); }
.rc { display:grid; grid-template-columns:auto minmax(0,1fr); gap:2.6rem; align-items:start; padding:3rem 3.2rem 3.2rem; border-radius:1.6rem; background:rgba(243,236,220,.05); box-shadow:inset 0 0 0 1px rgba(255,227,163,.22), 0 3rem 8rem rgba(0,0,0,.5); text-align:left; }
.rc.me { box-shadow:inset 0 0 0 1px rgba(255,227,163,.6), 0 3rem 8rem rgba(0,0,0,.5); }
.rc-av { display:block; width:8.4rem; height:10.4rem; border-radius:99rem 99rem .4rem .4rem; overflow:hidden; box-shadow:0 0 0 1px rgba(255,227,163,.6); }
.rc-av img { width:100%; height:100%; object-fit:cover; display:block; }
.rc-b { display:flex; flex-direction:column; gap:.9rem; min-width:0; }
.rc-n { font-size:4.5rem; line-height:1; }
.rc-r { font-size:1.7rem !important; letter-spacing:.26em !important; color:#9F945E !important; }
.rc-t { font-size:4.7rem; line-height:1.28; color:#E6DFD0; margin-top:.8rem; }
.bars { display:flex; align-items:center; justify-content:center; gap:1rem; height:18rem; }
.bars i { display:block; width:.55rem; height:100%; border-radius:1rem; background:#FFE3A3; }
.bars.sm { height:7rem; gap:.7rem; } .bars.sm i { width:.4rem; }
.rls { display:flex; flex-direction:column; align-items:center; gap:3rem; text-align:center; }
.rl { font-weight:500; font-size:8.2rem; line-height:1.12; text-wrap:balance; }
.steps3 { display:flex; flex-direction:column; align-items:center; gap:3.4rem; }
.steps3 .rl { font-size:9.6rem; }
.sheet { position:absolute; left:8rem; right:8rem; top:56rem; height:84rem; padding:8rem 7rem; border-radius:.5rem; background:#EFE9DD; color:#2A2017; text-align:left; display:flex; flex-direction:column; gap:3.4rem; box-shadow:0 6rem 16rem rgba(0,0,0,.85), 0 0 0 1px rgba(255,227,163,.25); }
.sheet .sk { font-family:'Alte Haas',sans-serif; font-size:1.9rem; letter-spacing:.34em; text-transform:uppercase; color:#62372D; }
.sheet .st { font-weight:500; font-size:9rem; line-height:1.04; min-height:18.8rem; }
.sheet .sr { height:1px; background:#9F945E; width:100%; }
.sheet .sl { font-size:4.7rem; line-height:1.42; color:#3A3026; }
.pan { position:absolute; inset:0; will-change:transform; }
.rigw { position:absolute; left:7rem; top:68rem; width:176rem; height:112rem; transform-style:preserve-3d; transform-origin:20% 50%; will-change:transform; }
.win { position:absolute; inset:0; border-radius:2rem; overflow:hidden; background:#0B0D0A; box-shadow:0 0 0 .3rem #23271F, 0 0 0 .5rem rgba(159,148,94,.7), 0 8rem 18rem rgba(0,0,0,.9), 0 0 24rem rgba(255,227,163,.12); }
.win-bar { position:relative; height:5.4rem; display:flex; align-items:center; gap:1rem; padding:0 2.4rem; background:#14170F; box-shadow:inset 0 -1px 0 rgba(243,236,220,.1); }
.win-bar i { width:1.3rem; height:1.3rem; border-radius:50%; background:rgba(243,236,220,.22); }
.win-bar span { position:absolute; left:14rem; font-family:'Alte Haas',sans-serif; font-size:1.5rem; letter-spacing:.2em; text-transform:uppercase; color:#ABA597; padding:1rem 2.4rem .9rem; border-radius:99rem; box-shadow:inset 0 0 0 1px rgba(243,236,220,.16); }
.win-view { position:relative; height:calc(100% - 5.4rem); overflow:hidden; }
.win-view img { position:absolute; left:0; top:0; width:100%; height:auto; display:block; will-change:transform; }
.numz { font-weight:500; font-size:56rem; line-height:.84; color:#FFE3A3; font-variant-numeric:lining-nums tabular-nums; letter-spacing:-.02em; }
.roll { display:inline-block; height:.84em; overflow:hidden; vertical-align:top; }
.rin { display:flex; flex-direction:column; will-change:transform; }
.rin span { display:block; height:.84em; line-height:.84; }
.numw { font-style:italic; font-size:11.5rem; line-height:1; margin-top:-2rem; }
.ten { display:grid; grid-template-columns:repeat(5, 15rem); gap:2rem 2.4rem; justify-content:center; margin-top:1rem; }
.ten svg { width:100%; height:auto; display:block; }
.one-t { width:46rem; } .one-t svg { width:100%; height:auto; display:block; }
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
        r=('%d,%d,200,220' % (t,t+step+90)) if not last else ('%d,%d,400,400' % (t,end-150))
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
# ---- five more reels: the thread, listening, the desk on a computer, one piece's journey, the numbers ----
def SEAT(n): return R+'/images/seats/seat-%d.jpg' % n
def card(t,tout,seat,name,role,text,me=False): return '<div class="rc%s" data-r="%d,%d,800,400" data-dy="5"><span class="rc-av"><img src="%s"></span><span class="rc-b"><span class="rc-n">%s</span><span class="lab rc-r">%s</span><span class="rc-t">%s</span></span></div>' % (' me' if me else '',t,tout,SEAT(seat),name,role,text)
def window(tin,tout,shot,eb,big,x1='-62',y0='-3',y1='-9',tilt='-16,5,-7,2',x0='0'):
    cap='<div class="cap2"><div class="eb" data-r="%d,%d,600,400">%s</div><div class="big" data-r="%d,%d,800,400">%s</div></div>' % (tin+250,tout-150,eb,tin+450,tout-150,big)
    w=('<div class="stage3d"><div class="pan" data-k="%d,%d,1,1,%s,0,%s,0"><div class="rigw" data-tilt="%d,%d,%s"><div class="win" data-r="%d,%d,900,450" data-dy="10">'
       '<div class="win-bar"><i></i><i></i><i></i><span>overgrownaltar.com</span></div><div class="win-view"><img src="%s/desk-%s.jpg" data-k="%d,%d,1,1,0,%s,0,%s"></div></div></div></div></div>') % (tin+300,tout,x0,x1,tin,tout,tilt,tin+150,tout,SHOTS,shot,tin,tout,y0,y1)
    return sc(tin,tout,backdrop(tin,tout)+cap+w)
def rollnum(tin,vals,dur=1000): return '<span class="roll"><span class="rin" data-roll="%d,%d">%s</span></span>' % (tin,dur,''.join('<span>%s</span>' % v for v in vals))
def number(tin,tout,vals,word,extra='',bg='',dur=900):
    num=('<div class="numz" data-r="%d,%d,500,350" data-pop>%s</div>' % (tin+80,tout-80,rollnum(tin+150,vals,dur))) if len(vals)>1 else ('<div class="numz" data-r="%d,%d,400,300" data-pop>%s</div>' % (tin+80,tout-80,vals[0]))
    return sc(tin,tout,bg+'<div class="in" style="gap:1rem">'+num+'<div class="numw" data-r="%d,%d,600,300">%s</div>%s</div>' % (tin+350,tout-80,word,extra),300,300)
_tname={t['name']:t for t in MARKS['trophies']}

# 6 · THE THREAD: the Guild talking between pieces
_T6=3200
BODY+=reel('reel6',22500,[
  sc(0,3400,'<div class="in">'+EL('250,3200,700,400','The Forum · a thread in The Nave',**{'class':'eb'})+'<div class="big-it" style="font-size:11.6rem" data-type="700,17" data-r="600,3200,1,400" data-dy="0">What are you reading this week?</div><div class="thread" data-draw="2500,3200,600"></div></div>',1,500),
  sc(3200,12900,backdrop(3200,12900)+'<div class="pan" data-k="5600,11800,1,1,0,0,0,-40"><div class="cards">'
     +card(3500,12700,4,'Thomas Ashgrove','Of the Guild','Back in the Psalms of Ascent, one a morning, before the phone comes on. Psalm 126 undid me on Tuesday.')
     +card(5100,12700,9,'Clara Penhallow','Of the Guild','Gilead, for the third time. The way Ames blesses his son without being asked is the kind of writing I keep failing to do.')
     +card(6700,12700,2,'Hester Vane','Editor','Augustine’s Confessions, Book X, slowly. Whole pages on memory, and I no longer think that is a digression.')
     +card(8300,12700,7,'Eden Albright','Of the Guild','George Herbert. “Love bade me welcome” is eighteen lines I would trade my whole notebook for.',True)
     +card(9900,12700,11,'Miriam Hale','Of the Fellowship','Reading all of you, mostly. Then Herbert, because Eden will not stop quoting him.')
     +'</div></div><div class="topfade"></div><div class="topline eb" style="top:17rem" data-r="3300,12700,600,400">A thread in The Nave</div>'),
  phone(12700,16300,'thread','-30','Threads · replies · mentions','No feed. No noise.',y0='-4'),
  title(16100,18800,'what-we-believe','54% 50%',EL('16400,18600,700,400','Proverbs 27:17',**{'class':'eb'})+EL('16700,18600,900,400','Iron sharpens iron.',**{'class':'big-it huge'})+'<div class="thread" data-draw="17400,18600"></div>',veil='veil deep'),
  soon(18600,22500,'A table to talk at.'),
])
# 7 · LISTEN: every piece can be read aloud
BODY+=reel('reel7',22500,[
  sc(0,3200,'<div class="in"><div class="bars" data-bars="150,3000,30"></div>'+EL('900,3000,900,400','Listen.',**{'class':'big-it huge','style':'color:#FFE3A3'})+'</div>',1,500),
  sc(3000,8800,backdrop(3000,8800)+'<div class="cap2"><div class="eb" data-r="3300,8600,600,400">Every piece, read aloud</div><div class="big-it" data-r="3500,8600,800,400">Close your eyes.</div><div class="bars sm" data-bars="3700,8600,22"></div></div>'
     +'<div class="stage3d"><div class="rig" style="top:76rem" data-tilt="3000,8800,-6,4,5,2"><div class="phone" data-r="3150,8800,900,450" data-dy="14"><div class="screen"><img src="%s/listen.jpg"></div></div></div></div>' % SHOTS),
  sc(8600,16600,'<div class="glow"></div><div class="topline eb" data-r="8900,16400,600,400">What the Stones Remember</div><div class="in" style="padding-top:34rem;padding-bottom:44rem"><div class="rls">'
     +'<div class="rl" data-read="9000,11100,16400">The abbey has had no roof since the reign of a king nobody here could name.</div>'
     +'<div class="rl" data-read="11300,13400,16400">Rain comes straight down into the nave,</div>'
     +'<div class="rl" data-read="13600,16400,16400,1">and in spring the grass grows where the choir once stood.</div>'
     +'</div></div><div class="pips" style="bottom:46rem"><div class="bars sm" data-bars="8900,16400,34"></div></div>',500,500),
  phone(16400,19300,'reading-night','-28','Night reading','Or read in the dark.',italic=True,y0='-6'),
  soon(19100,22500,'Read it. Or let it be read to you.'),
])
# 8 · THE DESK: the Guild on a computer, in slow close-up
BODY+=reel('reel8',22500,[
  sc(0,2800,'<div class="in">'+EL('250,2600,700,400','On your computer',**{'class':'eb'})+EL('600,2600,900,400','A desk worth sitting at.',**{'class':'big-it huge'})+'<div class="thread" data-draw="1400,2600"></div></div>',1,500),
  window(2600,6500,'guild','The Guild','Your house.'),
  window(6300,10200,'write','The writing room','A clean page.',x1='-58',y0='-6',y1='-6',tilt='-4,3,-14,5',x0='-10'),
  window(10000,13900,'prestige','The prestiges','Your standing.',x1='-66',y0='-6',y1='-16'),
  window(13700,17600,'thread','The forum','Your company.',x1='-40',y0='-8',y1='-20',tilt='-5,3,-13,4',x0='-4'),
  window(17400,19500,'vault','Your vault','Your work, kept.',x1='-50',y0='-22',y1='-30'),
  soon(19300,22500,'On your phone. On your desk.'),
])
# 9 · ONE PIECE: from a typed title to a trophy
_c9,_e9=crests(14200,[5,6],1000,1400,'Your prestige rises')
BODY+=reel('reel9',23500,[
  sc(0,5600,backdrop(0,5600)+'<div class="cap2">'+EL('200,5400,600,400','It begins at your desk',**{'class':'eb'})+EL('400,5400,800,400','One piece.',**{'class':'big-it'})+'</div>'
     +'<div class="sheet" data-r="300,5600,900,450" data-dy="10"><span class="sk">The Hearth · Essay</span><div class="st" data-type="1100,15">What the Stones Remember</div><div class="sr"></div><div class="sl" data-type="3000,34">The abbey has had no roof since the reign of a king nobody here could name.</div></div>',1,500),
  sc(5400,8800,'<div class="glow"></div><div class="in"><div class="steps3">'
     +'<div class="rl" data-read="5600,6500,8600">Sent to the editor.</div><div class="rl" data-read="6600,7500,8600">Read, line by line.</div><div class="rl" data-read="7600,8600,8600,1" style="color:#FFE3A3;font-style:italic;font-weight:400">Published.</div></div></div>',400,400),
  phone(8600,11700,'reading','-26','In The Hearth','It is read.',italic=True,y0='-4'),
  number(11500,14300,['0','3','6','9','12','15','17'],'stayed with readers.',dur=1300),
  _c9,
  sc(_e9-200,_e9+2700,'<div class="glow"></div><div class="in">'+EL('%d,%d,600,400' % (_e9,_e9+2500),'A trophy is won',**{'class':'eb'})+'<div class="one-t" data-r="%d,%d,800,500" data-pop>%s</div>' % (_e9+150,_e9+2500,_uid(_tname['First Light']['svg']))+EL('%d,%d,800,400' % (_e9+500,_e9+2500),'First Light',**{'class':'caps'})+'</div>',400,400),
  soon(_e9+2500,23500,'Write something that lasts.'),
])
# 10 · BY THE NUMBERS: fast, and counted
_tri=('<div class="tri">'+''.join('<div class="pane">%s<div class="veil" style="background:rgba(6,8,6,.8) !important"></div></div>' % img(p,g,'4300,6900,1.12,1.03,0,1,0,-1',pos) for p,g,pos in [('duomo-spires','gray','center 30%'),('window-of-the-ascension-and','','center 45%'),('chapel-and-cross-under-a','gray','72% 50%')])+'</div>')
_ten='<div class="ten">'+''.join('<div data-r="%d,11500,400,300" data-pop>%s</div>' % (9300+i*110,_uid(c['svg'])) for i,c in enumerate(MARKS['crests']))+'</div>'
BODY+=reel('reel10',20500,[
  number(0,1600,['0'],'likes.'),
  number(1500,3100,['0'],'followers.'),
  number(3000,4500,['0'],'algorithm.'),
  number(4300,6900,['0','1','2','3'],'rooms.',bg=_tri,dur=700),
  number(6700,9000,['0','2','4','6','8','9'],'crafts.',extra=EL('7500,8900,600,300','Essays · Prose · Poetry · Fiction · Photographs · Testimony · and more',**{'class':'lab','style':'margin-top:3rem;line-height:1.8;max-width:80rem'}),dur=800),
  sc(8800,11700,'<div class="glow"></div><div class="in" style="gap:1rem"><div class="numz" style="font-size:40rem" data-r="8900,11500,500,350" data-pop>'+rollnum(9000,['0','2','4','6','8','10'],800)+'</div><div class="numw" data-r="9200,11500,600,300">prestiges.</div>'+_ten+'</div>',300,300),
  sc(11500,14600,'<div class="wall" style="opacity:.34" data-wall="11600,14200">'+''.join('<div class="tw">%s</div>' % _uid(t['svg']) for t in MARKS['trophies'])+'</div><div class="in" style="gap:1rem"><div class="numz" data-r="11600,14400,500,350" data-pop>'+rollnum(11700,['0','9','18','27','36','45','54'],1000)+'</div><div class="numw" data-r="11900,14400,600,300">trophies.</div></div>',300,300),
  number(14400,16900,['1'],'altar.',bg=img('window-of-the-ascension-and','','14400,16900,1.14,1.04,0,-2,0,1','center 42%')+'<div class="veil deep"></div>'),
  soon(16700,20500,'Three rooms, one altar.'),
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

# ---- the second pass (reels 11 to 15): the hook is on screen at the first frame, cuts fall on a half-second grid, the
# ---- real pages are shown close enough to read, and each has its own score (score.py reads cues.json) ----
from PIL import Image as _PIL
CUES={}
def hard(tin,tout,inner,cls=""): return sc(tin,tout+100,inner,140,120,cls)
def cu(tin,tout,shot,cx,cy,box,zoom=1.07,drift=(0,-1.2)):
    # a close-up of a page: (cx, cy) is the point to centre on, in the page's own pixels (393 wide on a phone, 1440 on a computer)
    w,h=_PIL.open(HERE+"/shots/"+shot+".jpg").size
    base=1440.0 if shot.startswith("desk-") else 393.0
    fx=cx/base; fy=cy/(h*base/w); iw=box[2]*zoom; ih=iw*h/w
    tx=min(0,max(-(1-box[2]/iw)*100, -(fx-box[2]/(2*iw))*100)); ty=min(0,-(fy-box[3]/(2*ih))*100)
    return ("<div class=\"cu\" style=\"left:%srem;top:%srem;width:%srem;height:%srem\" data-r=\"%d,%d,260,160\" data-dy=\"4\"><img src=\"%s/%s.jpg\" style=\"width:%s%%\" data-k=\"%d,%d,1,1,%.3f,%.3f,%.3f,%.3f\"></div>"
            % (box[0],box[1],box[2],box[3],tin,tout,SHOTS,shot,zoom*100,tin,tout,tx,ty,tx+drift[0],ty+drift[1]))
def end2(tin,T,line,name="Overgrown Altar"):
    return sc(tin,T,img("window-of-the-ascension-and","","%d,%d,1.16,1.04,0,-2,0,1" % (tin,T),"center 42%")+"<div class=\"veil mid\"></div><div class=\"in sh\">"
      +EL("%d,%d,500,1" % (tin+150,T+1),MONO("sm"))
      +EL("%d,%d,600,1" % (tin+300,T+1),name,**{"class":"caps"})
      +"<div class=\"thread\" data-draw=\"%d,%d,700\"></div>" % (tin+600,T+1)
      +EL("%d,%d,600,1" % (tin+800,T+1),"Coming soon.",**{"class":"big-it huge","style":"color:#FFE3A3"})
      +EL("%d,%d,600,1" % (tin+1200,T+1),line,**{"class":"sub","style":"color:#F3ECDC"})
      +EL("%d,%d,600,1" % (tin+1700,T+1),"Follow to be first through the door",**{"class":"lab","style":"margin-top:1.4rem"})
      +"</div>",260,1)
def photo(tin,tout,name,pos,inner,gray=False,k="1.14,1.04,0,1,0,-1"):
    return hard(tin,tout,img(name,"gray" if gray else "","%d,%d,%s" % (tin,tout+100,k),pos)+"<div class=\"veil lite\"></div><div class=\"in sh\">"+inner+"</div>")

# 11 · ZERO (11s): three noughts, then the turn
def _zero(tin,word,paper=False):
    return hard(tin,tin+1000,"<div class=\"in\" style=\"gap:1rem\"><div class=\"numz\" style=\"color:%s\" data-r=\"%d,%d,80,80\" data-pop>0</div><div class=\"numw\" data-r=\"%d,%d,80,80\">%s</div></div>" % ("#62372D" if paper else "#FFE3A3",tin,tin+1050,tin,tin+1050,word),"paper" if paper else "")
_w11=[("Essays.","duomo-spires","center 30%",True),("Poetry.","window-of-the-ascension-and","center 45%",False),("Fiction.","labyrinth-stained-light","60% 60%",False),("Testimony.","chapel-and-cross-under-a","72% 50%",True)]
BODY+=reel("reel11",11000,[
  _zero(0,"likes."), _zero(1000,"followers.",True), _zero(2000,"algorithm."),
  photo(3000,5500,"window-light-on-wall","center 45%",EL("3000,5550,200,120","Only the work.",**{"class":"big-it huge","data-pop":""}),k="1.18,1.05,-2,0,2,0"),
  *[photo(5500+i*500,6000+i*500,p,pos,EL("%d,%d,90,80" % (5500+i*500,6050+i*500),w,**{"class":"beat","data-pop":""}),g) for i,(w,p,pos,g) in enumerate(_w11)],
  end2(7500,11000,"A guild of writers and photographers,<br>anchored in Christ."),
])
CUES["reel-zero"]={"ms":11000,"cues":[[0,"thump",0],[1000,"thump",0],[2000,"thump",0],[3000,"bell",2],[5500,"tick",0],[6000,"tick",2],[6500,"tick",3],[7000,"tick",5],[7500,"lift",0]]}

# 12 · THE REPLY (13s): the forum, close enough to read
_hd=("<div class=\"hd\"><span class=\"lab\" data-r=\"2500,8500,300,150\">A thread in The Nave</span><span class=\"q\" data-r=\"2600,8500,300,150\">“What are you reading this week?”</span></div>")
BODY+=reel("reel12",13000,[
  hard(0,2500,"<div class=\"in\">"+EL("0,2550,1,150","The Forum",**{"class":"eb"})+EL("0,2550,1,150","A comment section worth reading.",**{"class":"big-it huge"})+"<div class=\"rule2\" data-draw=\"300,2550,700\"></div></div>","paper"),
  hard(2500,8500,_hd+cu(2500,4550,"thread",196,446,(6,60,88,57))+cu(4500,6550,"thread",196,661,(6,64,88,42))+cu(6500,8550,"thread",196,1061,(6,64,88,42)),"paper"),
  hard(8500,9500,"<div class=\"in\" style=\"gap:1.5rem\">"+EL("8500,9550,90,80","No feed.",**{"class":"beat","data-pop":""})+EL("9000,9550,90,80","No noise.",**{"class":"beat","data-pop":"","style":"color:#FFE3A3"})+"</div>"),
  end2(9500,13000,"A table to talk at."),
])
CUES["reel-the-reply"]={"ms":13000,"cues":[[0,"bell",0],[2500,"bell",2],[4500,"bell",3],[6500,"bell",4],[8500,"thump",0],[9000,"thump",0],[9500,"lift",0]]}

# 13 · RANK (13.5s): the ten crests, one to a beat
_cz=""
for _i,_m in enumerate(MARKS["crests"]):
    _t=1500+_i*500
    _cz+="<div class=\"cz\" data-r=\"%d,%d,70,60\" data-dy=\"0\" data-pop>%s<span class=\"num\">%s</span><span class=\"nm\">%s</span></div>" % (_t,_t+(540 if _i<9 else 600),_uid(_m["svg"]),_m["numeral"],_m["name"])
_rare13="".join(hard(8500+_k*500,9000+_k*500,"<div class=\"glow\"></div><div class=\"in\"><div class=\"one-t\" style=\"width:58rem\" data-r=\"%d,%d,90,80\" data-pop>%s</div>%s</div>" % (8500+_k*500,9050+_k*500,_uid({t["id"]:t for t in MARKS["trophies"]}[_id]["svg"]),EL("%d,%d,90,80" % (8500+_k*500,9050+_k*500),_nm,**{"class":"caps","style":"font-size:8rem"}))) for _k,(_id,_nm) in enumerate([("lion","Bold as a Lion"),("cathedral","The Cathedral"),("serpent","The Serpent Underfoot")]))
BODY+=reel("reel13",13500,[
  hard(0,1500,"<div class=\"glow\"></div><div class=\"in\"><div class=\"one-t\" style=\"width:62rem\" data-r=\"0,1550,1,100\">%s</div>" % _uid(MARKS["crests"][9]["svg"])+EL("0,1550,1,100","This is not<br>a follower count.",**{"class":"big-it huge"})+"</div>"),
  hard(1500,6500,"<div class=\"glow\"></div><div class=\"topline eb\" data-r=\"1500,6550,200,100\">Ten prestiges · earned by publishing</div><div class=\"stage\">"+_cz+"</div>"),
  hard(6500,8500,"<div class=\"hd\"><span class=\"lab\" data-r=\"6500,8550,250,120\">Where you stand</span><span class=\"q\" data-r=\"6600,8550,250,120\">Every published piece raises you.</span></div>"+cu(6500,8550,"prestige",196,612,(6,56,88,92)),"paper"),
  _rare13,
  end2(10000,13500,"Earn your place."),
])
CUES["reel-rank"]={"ms":13500,"cues":[[0,"thump",0]]+[[1500+i*500,"tick",i] for i in range(10)]+[[6500,"bell",3],[8500,"thump",0],[9000,"thump",0],[9500,"thump",0],[10000,"lift",0]]}

# 14 · PRESS PLAY (12.5s): the piece, read to you, in the dark
BODY+=reel("reel14",12500,[
  hard(0,3000,"<div class=\"in\"><div class=\"bars\" data-bars=\"-400,3050,30\"></div>"+EL("0,3050,1,150","Every piece can be read to you.",**{"class":"big-it huge","style":"color:#FFE3A3"})+"</div>"),
  hard(3000,6000,backdrop(3000,6100)+"<div class=\"hd\"><span class=\"lab\" data-r=\"3000,6050,250,120\">Listening · night reading</span><span class=\"q\" data-r=\"3100,6050,250,120\">Close your eyes.</span></div>"
       +cu(3000,6050,"listen",196,445,(6,56,88,48),drift=(0,0))+cu(3150,6050,"listen",196,796,(6,108,88,17),drift=(0,0))),
  hard(6000,9000,"<div class=\"glow\"></div><div class=\"in\" style=\"padding-top:34rem;padding-bottom:44rem\"><div class=\"rls\">"
       +"<div class=\"rl\" data-read=\"6050,7400,9050\">The abbey has had no roof since the reign of a king nobody here could name.</div>"
       +"<div class=\"rl\" data-read=\"7500,9050,9050,1\">Rain comes straight down into the nave.</div></div></div><div class=\"pips\" style=\"bottom:46rem\"><div class=\"bars sm\" data-bars=\"6000,9050,34\"></div></div>"),
  end2(9000,12500,"Read it. Or let it be read to you."),
])
CUES["reel-press-play"]={"ms":12500,"soft":1,"cues":[[0,"bell",0],[3000,"bell",2],[6000,"bell",3],[7500,"bell",4],[9000,"lift",0]]}

# 15 · WRITE (13s): a person, a page, a piece
BODY+=reel("reel15",13000,[
  photo(0,2500,"what-we-believe","56% 50%",EL("0,2550,1,150","Write something<br>that lasts.",**{"class":"big-it huge"}),True),
  hard(2500,6000,backdrop(2500,6100)+"<div class=\"hd\"><span class=\"lab\" data-r=\"2500,6050,250,120\">At your desk</span></div>"
       +"<div class=\"sheet\" style=\"top:42rem\" data-r=\"2500,6050,300,150\" data-dy=\"6\"><span class=\"sk\">The Hearth · Essay</span><div class=\"st\" data-type=\"2800,19\">What the Stones Remember</div><div class=\"sr\"></div><div class=\"sl\" data-type=\"4250,46\">The abbey has had no roof since the reign of a king nobody here could name.</div></div>"),
  hard(6000,6500,"<div class=\"in\">"+EL("6000,6550,80,70","Sent.",**{"class":"beat","data-pop":""})+"</div>"),
  hard(6500,7000,"<div class=\"in\">"+EL("6500,7050,80,70","Edited.",**{"class":"beat","data-pop":"","style":"color:#2A2017"})+"</div>","paper"),
  hard(7000,7500,"<div class=\"in\">"+EL("7000,7550,80,70","Published.",**{"class":"beat","data-pop":"","style":"color:#FFE3A3;font-style:italic;font-weight:400"})+"</div>"),
  hard(7500,9500,"<div class=\"hd\"><span class=\"lab\" data-r=\"7500,9550,250,120\">In The Hearth</span><span class=\"q\" data-r=\"7600,9550,250,120\">And then it is read.</span></div>"+cu(7500,9550,"reading",196,470,(6,58,88,84),drift=(0,-3)),"paper"),
  end2(9500,13000,"The Guild opens soon. By application."),
])
CUES["reel-write"]={"ms":13000,"cues":[[0,"thump",0],[2500,"bell",2],[6000,"thump",0],[6500,"thump",0],[7000,"thump",0],[7500,"bell",4],[9500,"lift",0]]}

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
  if (tin > 0) kf.push({ ...hid, offset: 0 }, { ...hid, offset: at(tin), easing: EASE });
  kf.push({ ...shown, offset: tin > 0 ? at(tout < T ? Math.min(tin + fi, tout) : tin + fi) : 0 });
  if (tout < T) { kf.push({ ...shown, offset: at(Math.min(tout, Math.max(tin + fi, tout - fo))), easing: 'ease-in' }, { ...gone, offset: at(tout) }); if (at(tout) < 1) kf.push({ ...gone, offset: 1 }); }
  else if (at(tin + fi) < 1) kf.push({ ...shown, offset: 1 });
  anims.push(el.animate(kf, { duration: T, fill: 'both' }));
});
ad.querySelectorAll('[data-wall]').forEach((wall) => { const [w0, w1] = wall.dataset.wall.split(',').map(Number), cols = fmt === 'v' ? 6 : 9; wall.querySelectorAll('.tw').forEach((el, i) => { const tin = w0 + ((i % cols) + Math.floor(i / cols)) * 95, a = { opacity: 0, transform: 'scale(.6)' }, b = { opacity: 1, transform: 'scale(1)' }, c = { opacity: 0, transform: 'scale(1)' };
  anims.push(el.animate([{ ...a, offset: 0 }, { ...a, offset: at(tin), easing: EASE }, { ...b, offset: at(tin + 520) }, { ...b, offset: at(w1) }, { ...c, offset: at(w1 + 400) }, { ...c, offset: 1 }], { duration: T, fill: 'both' })); }); });
ad.querySelectorAll('[data-tilt]').forEach((el) => { const [tin, tout, ry0 = -9, rx0 = 5, ry1 = 7, rx1 = 2] = el.dataset.tilt.split(',').map(Number), a = `rotateY(${ry0}deg) rotateX(${rx0}deg) translateZ(0)`, b = `rotateY(${ry1}deg) rotateX(${rx1}deg) translateZ(0)`;
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
// sound: thin bars that rise and fall (the same every time: the numbers come from a fixed seed)
let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
ad.querySelectorAll('[data-bars]').forEach((el) => {
  const [tin, tout, n = 26] = el.dataset.bars.split(',').map(Number);
  for (let i = 0; i < n; i++) { const b = document.createElement('i'); el.append(b);
    const kf = tin > 0 ? [{ transform: 'scaleY(.06)', opacity: 0, offset: 0 }, { transform: 'scaleY(.06)', opacity: 0, offset: at(tin) }] : [];
    const mid = 1 - Math.abs(i - (n - 1) / 2) / (n / 2) * 0.55;
    for (let t = tin + 300; t < tout - 300; t += 170) kf.push({ transform: `scaleY(${(0.12 + rnd() * 0.88 * mid).toFixed(3)})`, opacity: 1, offset: at(t), easing: 'ease-in-out' });
    kf.push({ transform: 'scaleY(.06)', opacity: 0, offset: at(tout) }); if (at(tout) < 1) kf.push({ transform: 'scaleY(.06)', opacity: 0, offset: 1 });
    anims.push(b.animate(kf, { duration: T, fill: 'both' })); }
});
// a line being read: it arrives, holds the light, then dims as the next one comes
ad.querySelectorAll('[data-read]').forEach((el) => {
  const [tin, dim, tout, low = 0.26] = el.dataset.read.split(',').map(Number), y = 2.4 * rem;
  const kf = [{ opacity: 0, transform: `translateY(${y}px)`, offset: 0 }, { opacity: 0, transform: `translateY(${y}px)`, offset: at(tin), easing: EASE }, { opacity: 1, transform: 'translateY(0px)', offset: at(tin + 700) },
    { opacity: 1, transform: 'translateY(0px)', offset: at(Math.max(tin + 700, dim)) }, { opacity: low, transform: 'translateY(0px)', offset: at(Math.max(tin + 700, dim) + 450) }, { opacity: low, transform: 'translateY(0px)', offset: at(tout - 400) }, { opacity: 0, transform: 'translateY(0px)', offset: at(tout) }];
  if (at(tout) < 1) kf.push({ opacity: 0, transform: 'translateY(0px)', offset: 1 });
  kf.forEach((k, i) => { if (i && k.offset < kf[i - 1].offset) k.offset = kf[i - 1].offset; });
  anims.push(el.animate(kf, { duration: T, fill: 'both' }));
});
// words typed a letter at a time
ad.querySelectorAll('[data-type]').forEach((el) => {
  const [tin, cps = 16] = el.dataset.type.split(',').map(Number), text = el.textContent; el.textContent = '';
  [...text].forEach((ch, i) => { const sp = document.createElement('span'); sp.textContent = ch; el.append(sp); const t = at(tin + (i * 1000) / cps);
    anims.push(sp.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: Math.min(t, 0.9999), easing: 'steps(1, end)' }, { opacity: 1, offset: Math.min(t + 0.0001, 1) }, { opacity: 1, offset: 1 }], { duration: T, fill: 'both' })); });
});
// a number that rolls up to its value
ad.querySelectorAll('[data-roll]').forEach((el) => {
  const [tin, dur = 1100] = el.dataset.roll.split(',').map(Number), n = el.children.length, end = `translateY(${-((n - 1) / n) * 100}%)`;
  anims.push(el.animate([{ transform: 'translateY(0%)', offset: 0 }, { transform: 'translateY(0%)', offset: at(tin), easing: 'cubic-bezier(.2,.9,.2,1)' }, { transform: end, offset: at(tin + dur) }, { transform: end, offset: 1 }], { duration: T, fill: 'both' }));
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
import json as _json
open(HERE+'/cues.json','w').write(_json.dumps(CUES))
