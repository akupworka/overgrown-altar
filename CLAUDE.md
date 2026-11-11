# Overgrown Altar

Astro site + React islands, Netlify (pushing `main` deploys to overgrownaltar.com), Supabase project
`zblgggifysohxqtgvgxs` for the Guild (Desk, members, forum). Deeper detail lives in `HANDOFF.md`: read only the
section a task needs, not the whole file.

## The owner
Editor in Chief, a beginner. Phone screenshots are their main way of reporting. What they expect:
- Fix what the screenshot shows, then look at the result yourself before saying it's done. If it still looks
  off (misaligned, cramped, clipped, busy), fix that too: they judge by eye, so "close enough" isn't done.
- When they ask for something "elite" or "better", aim high and keep it clean: bold, simple shapes over fine detail.
- Finish with one short plain-words report: what changed, where to see it, anything they must check on their
  iPhone. No code, no jargon. Lead with any decision they need to make.
- They asked to be reminded before launch: when they mention opening the site or launching, walk them through
  `PRELAUNCH.md` (and add to it whenever something is parked or left unverified).

## Visual identity (keep it)
- Tokens and type in `src/styles/global.css`: `--night --dark --paper --bone --ink --ember --oxblood --brass`;
  fonts `--serif` (Cormorant), `--sans` (Alte Haas), `--script` (Pinyon). Classes `.eb .lab .it .mut .h1 .h2`.
- Dark, quiet, editorial, stained glass. Color enters only through glass; never glow or color the marks.
- Reuse what exists before adding: components in `src/components/` and `src/components/desk/`, styles per area in
  `src/styles/` (`desk.css`, `forum.css`, `prestige*.css`, `trophies.css`, `glass.css`), helpers in `src/lib/`
  (`pager.ts`, `prestige.ts`, `crests.ts`, `trophies.ts`, `live.ts`).
- Phones first: check 393x852 as well as desktop. Motion: transform/opacity only. No CSS `filter` effects on
  crests (iPhone Safari draws them as boxes); bake looks into the SVG.

## How to work
- For a visual request, open only the files for that page/component. No project-wide scans or rewrites.
- Make the smallest change that does the job; don't restyle things that weren't asked about.
- Preserve what works: sign-in and invite links, submitting/publishing/review, row-level security, triggers,
  the hourly pending-rebuild cron, live lists, writer emails, Netlify functions.
- Secrets only in Netlify env vars; never in chat or the repo.

## Before pushing (a push is a deploy)
- `npm run build` must pass, then check the changed page on phone and computer with
  `node scripts/check.cjs <path> [--as editor|member|visitor] [--pieces N] [--click "<css>"] [--only phone]`
  (pretend Guild data, no real account; starts the preview server itself; prints errors and sideways scrolling,
  saves screenshots outside the repo; look at them). Skip the screenshots only if the owner says not to check.
  Chromium only, so say when iPhone Safari should be checked by the owner.
- Ask first before anything destructive or hard to undo: database migrations that drop/alter data, deleting files
  or rows, auth or email settings, new scheduled jobs.
- Commit to `main` with a clear message; keep the tree clean (no stray screenshots in the repo).
