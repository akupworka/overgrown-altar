# Overgrown Altar

Astro site + React islands, Netlify (pushing `main` deploys to overgrownaltar.com), Supabase project
`zblgggifysohxqtgvgxs` for the Guild (Desk, members, forum). Deeper detail lives in `HANDOFF.md`: read only the
section a task needs, not the whole file.

## The owner
Editor in Chief, a beginner. Explain in plain words, briefly. Phone screenshots are their main way of reporting.

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
- `npm run build` must pass, and the changed page must be checked (Playwright with mocked Supabase; Chromium only,
  so say when iPhone Safari should be checked by the owner).
- Ask first before anything destructive or hard to undo: database migrations that drop/alter data, deleting files
  or rows, auth or email settings, new scheduled jobs.
- Commit to `main` with a clear message; keep the tree clean (no stray screenshots in the repo).
