# Makes tour.cjs: the pretend Guild data and its stand-in database from the repo's scripts/check.cjs, plus a runner that
# drives the real member pages with a visible cursor and captions and records the screen.
import re, os
HERE=os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)
src=open(os.path.join(HERE,'..','scripts','check.cjs'),encoding='utf-8').read()
head=src[:src.index('// ---- run')]
a=src.index("    await page.route('**/zblgggifysohxqtgvgxs.supabase.co/**', (route) => {")
b=src.index("    await page.goto(BASE + '/');")
handler=src[a:b].rstrip()
assert handler.endswith('});')
handler=handler[len("    await page.route('**/zblgggifysohxqtgvgxs.supabase.co/**', "):-2]   # "(route) => { ... }"
# better pretend writing for the camera
def rep(s,a,b,c=1):
    assert s.count(a)>=c,(a[:60],s.count(a)); return s.replace(a,b)
head=rep(head,"'Published piece'","'What the Stones Remember'")
head=rep(head,"+ (i % 6 ? '' : ` ${i + 1}`)","")
head=rep(head,"standfirst: 'A line about what it holds.'","standfirst: 'On ruins, and the light that still finds them.'")
head=rep(head,"const { chromium } = require('playwright');","const { chromium } = require('playwright');\nprocess.argv.push('/x', '--as', 'member', '--pieces', '27', '--cover', 'labyrinth');")
runner=open('tour-run.js',encoding='utf-8').read().replace('/*HANDLER*/',handler)
open('tour.cjs','w',encoding='utf-8').write(head+runner)
print('tour.cjs written')
