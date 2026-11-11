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
# pretend people and a pretend thread fit for the camera
head=head.replace('Jane Writer','Clara Penhallow')
head+="""
// ---- the ads' thread: a handful of members talking about what they are reading ----
{ const say = (id, a, body, d) => ({ id, thread_id: 'th2', author_id: a, body, created_at: d, edited_at: null });
  for (let i = posts.length - 1; i >= 0; i--) if (posts[i].thread_id === 'th2') posts.splice(i, 1);
  posts.push(
    say('q1', 'm3', 'Back in the Psalms of Ascent, one a morning, before the phone comes on. Psalm 126 undid me on Tuesday. What is on your table?', t(2)),
    say('q2', 'm2', 'Marilynne Robinson’s Gilead, for the third time. The way Ames blesses his son without being asked is the kind of writing I keep failing to do.', t(3)),
    say('q3', 'e9', 'Augustine’s Confessions, Book X, slowly. He spends whole pages on memory, and I no longer think that is a digression.', t(4)),
    say('q4', ME, 'George Herbert. “Love bade me welcome” is eighteen lines I would trade my whole notebook for.', t(5)),
    say('q5', 'f1', 'Reading all of you, mostly. Then Herbert, because Eden will not stop quoting him.', t(6)),
    say('q6', 'm3', 'That is the best reason to read Herbert I have heard.', t(7)));
  Object.assign(threads.find((x) => x.id === 'th2'), { author_id: 'm3', reply_count: 5, last_post_at: t(7), last_author_id: 'm3' }); }
"""
import sys
run_file=sys.argv[1] if len(sys.argv)>1 else 'tour-run.js'; out_file=sys.argv[2] if len(sys.argv)>2 else 'tour.cjs'   # e.g. python3 tour-gen.py shots-run.js shots.cjs
runner=open(run_file,encoding='utf-8').read().replace('/*HANDLER*/',handler)
open(out_file,'w',encoding='utf-8').write(head+runner)
print(out_file,'written')
