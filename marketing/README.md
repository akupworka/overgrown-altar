# The launch kit: how the ads and posts were made

Everything here draws from the site itself (its photographs, its type, its mark, and the real crests and trophies), so
the ads always match the site. Only the makers are kept in the repo; the films and pictures they produce are not.
Needs: Node with Playwright and Chromium, Python 3, ffmpeg. Run from this folder.

| What | How |
| --- | --- |
| Crests and trophies for the ads | `npx tsx marks.ts marks.json` (run once, and again if the crests or trophies change) |
| Motion ads (The Thesis, The Call, Three Rooms, Earn Your Place) in vertical, square and wide | `python3 build.py` then `node render.cjs video` (or `node render.cjs video ranks v`; `node render.cjs stills` for a quick look) |
| Inside the Guild: the real member pages, driven with a cursor and captions | `npm run build` first, then `python3 tour-gen.py`, then `SHAPE=wide node tour.cjs` and `SHAPE=tall node tour.cjs` |
| Nine Instagram posts (1080x1350) | `python3 posts.py` then `node posts.cjs` |
| The nine-tile "coming soon" grid | `python3 soon.py` then `node soon.cjs` (files are numbered in the order to post them) |

To change the words or timings, edit the text inside `build.py`, `posts.py` or `soon.py`: each element carries its own
times (`data-r="in,out"` in milliseconds). The walkthrough uses the pretend Guild data from `scripts/check.cjs`, so no
real account or member is ever shown. The films have a silent sound track; add music in the app you post from.
