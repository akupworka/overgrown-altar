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
head=rep(head,"body: 'The stones keep the psalms. '.repeat(60)","body: `The abbey has had no roof since the reign of a king nobody here could name. Rain comes straight down into the nave, and in spring the grass grows where the choir once stood.\n\nI went expecting a ruin and found a room still doing its work. The walls hold their shape. The east window, empty of glass, frames whatever the sky is doing, and the light falls through it onto the same stones it has fallen on for eight hundred years.\n\nWe talk about what was lost here: the lead, the bells, the books. But a place built to say one thing goes on saying it long after the furniture is gone. Take away the roof and the walls still point up.\n\nFaith is like this more often than we admit. The seasons strip it. What remains is the shape, and the shape is enough to pray in.`")
head=rep(head,"standfirst: 'A line about what it holds.'","standfirst: 'On ruins, and the light that still finds them.'")
head=rep(head,"const { chromium } = require('playwright');","const { chromium } = require('playwright');\nprocess.argv.push('/x', '--as', process.env.AS || 'member', '--pieces', '27', '--cover', 'labyrinth');")
import sys
run_file=sys.argv[1] if len(sys.argv)>1 else 'tour-run.js'; out_file=sys.argv[2] if len(sys.argv)>2 else 'tour.cjs'   # e.g. python3 tour-gen.py shots-run.js shots.cjs
runner=open(run_file,encoding='utf-8').read().replace('/*HANDLER*/',handler)
open(out_file,'w',encoding='utf-8').write(head+runner)
print(out_file,'written')
