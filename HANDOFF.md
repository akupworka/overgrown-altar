# Overgrown Altar: where things stand (hand-off note)

For whoever picks this project up next, including a new Claude session.
Start by reading this file, then `README.md`.

## The site today

- **Astro** site, deployed by **Netlify** from the `main` branch to overgrownaltar.com.
- Built from the design canvas: https://claude.ai/code/artifact/eb2b08ac-c4b4-4cbb-93d4-d12a1927127f
  (pages "Website" and "Publication system"; the brand guidelines are on the "guide" page).
- **The whole site is password-locked** while it is finished: `netlify/edge-functions/site-gate.ts`.
  Password lives in the Netlify env var `PRIVATE_PAGE_PASSWORD`. `SITE_PUBLIC=true` opens the site.
  `public/robots.txt` disallows everything until launch; switch it to `Allow: /` when the site opens.
- **Sanity**: project `4agnfn5q`, dataset `production`. The **Studio is live at `/studio`**
  (registered, CORS done; the owner signs in with their Sanity account).
- Design system in code: `src/styles/global.css` (tokens, type), `src/styles/motion.css`,
  components `GlassCard`, `GlassLight` (stained light), `Avatar`, `DispatchList`, `SiteNav` (fixed header).
  Brand rules: colour enters only through glass; never glow or colour the marks; quiet, editorial.

## Branches

NOTE (latest): Guild writing and publishing now live in **Supabase**, not Sanity. The `sanity` branch was
last merged before Guild Desk part 2 and now conflicts in index/watchtower/hearth/perimeter; it is likely
obsolete. The Sanity Studio is still live at /studio on `main` (unused for now).


- `main`: live. Pages still show the design's sample content (hard-coded); every dispatch link
  opens the one written essay (`/watchtower/nietzsche-surrendered`).
- `sanity`: the same site, but every list and article page reads from Sanity
  (`src/lib/sanity.ts`, `src/pages/[pillar]/[slug].astro`, `src/components/ArticlePage.astro`).
  `scripts/seed.mjs` loads the design's 16 sample articles (needs `SANITY_WRITE_TOKEN`, and network
  access to `api.sanity.io` + `4agnfn5q.api.sanity.io`). Keep `sanity` merged with `main`.
  Owner still has to choose: **A** seed the samples then switch, or **B** start fresh and switch.

## Guild Desk: part 1 is built (accounts, writing, submitting)

- Supabase project `zblgggifysohxqtgvgxs` (connected via the Supabase connector). Tables `profiles`, `pieces`
  with row-level security; helpers in schema `private` (`is_editor`, `editor_emails`, trigger guards).
  `akupworka@gmail.com` is in `private.editor_emails`, so that account becomes the editor on sign-up.
  Storage bucket `guild` (private; each member writes only in their own folder).
- Front end: `src/pages/guild/desk.astro` + `src/components/desk/DeskApp.tsx` (React, client-only),
  client config `src/lib/supabase.ts`. The site gate exempts `/guild/desk`.
- Member pages: `/guild/members/` (directory, `?m=<id>` a member's page with portrait, craft, bio, links and
  collected work = approved pieces, `?p=<id>` reading a piece), `src/components/desk/MembersApp.tsx`; signed-in
  members only. Portraits in the public `portraits` bucket. Writing marks rendered by `src/lib/marks.tsx`.
- The header shows the member's portrait/initials and "My Desk" when signed in (reads localStorage only).
- Part 2 (publishing) is built: editor Approve & publish / Send back with a note / Decline on the review page;
  the editor's own pieces publish directly. Approving sets `published_at` and a unique `slug` (DB trigger
  `private.guard_piece`). Public pages `/guild/<slug>/` (`src/pages/guild/[slug].astro`), fed at build time by
  `src/lib/guild.ts` (anon read of approved pieces; photos via 10-year signed URLs). Published pieces also show
  on Home (dark Editorial Matrix, newest first), The Watchtower, The Hearth and The Perimeter.
  Rebuild: `private.settings.build_hook_url` (Netlify build hook) is called by pg_net on publish/unpublish/edit.
  Submission email: pg_net -> `netlify/functions/notify-submission.mts` -> Netlify form `submission-alert`
  (hidden form on /enter/) -> Netlify form notification email.
- Original Part 2 notes: editor Approve / Send back / Decline, publishing approved pieces to Sanity
  (Netlify Function + `SANITY_WRITE_TOKEN`, already set in Netlify), email on submission, rebuild hook.

## The original plan for the Guild Desk

Members (and the owner) write **on the website**, and **nothing is published until the owner approves**.

Agreed plan:
1. **Accounts: Supabase Auth**, invite-only (owner invites from the Supabase dashboard; email +
   password; password reset by Supabase). Keep the existing glass sign-in design (`src/pages/guild/desk.astro`).
   The owner has created a Supabase project and is connecting the **Supabase connector** to Claude.
2. **The Desk** (`/guild/desk`, signed in): write (title, standfirst, body, pillar, medium, photo),
   save draft, submit to the editor, see status (Draft / With the editor / Published) and editor notes.
   Designs: `PubDeskIn`, `PubWrite`, `PubPieces`, `PubSaved`, `PubAccount` on the canvas's "pub" page.
3. **Netlify Functions** (server side) verify the Supabase session, then write to Sanity with
   `SANITY_WRITE_TOKEN` (Netlify env var only, never in the browser): drafts and submissions saved
   with a status field; nothing becomes public without approval.
4. **Editor review page**: list submissions; Approve (publish), Send back with a note, Decline.
   The owner's own pieces skip the queue. Email the owner on each new submission.
5. **Auto-rebuild on publish**: Netlify build hook + Sanity webhook.
6. Then merge `sanity` into `main` so pages read from Sanity.

Build in two parts (1: sign-in, write, submit; 2: review + publish), checking with the owner between.

## Things the owner still needs to provide

- Supabase: connected via the connector (the session can then read the project URL and anon key).
- `SANITY_WRITE_TOKEN` (Editor) set in Netlify env vars (not pasted into chat).
- Choice A or B above.

## Working notes

- The owner is learning; explain in plain words, step by step, one thing at a time.
- Test on iPhone 16 size (393x852) as well as desktop; keep motion transform/opacity-only (smooth).
- This cloud workspace may not reach Sanity or Supabase directly; test what you can and tell the
  owner exactly what to check live.
