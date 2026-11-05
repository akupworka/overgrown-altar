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

## Latest polish
- `src/lib/catalog.ts`: one list of real pieces (2 complete design pieces + published Guild pieces) used by Home,
  The Watchtower, The Perimeter, Archive, Start Here and "More to read". Sample-only pieces were retired.
- Retired: the design sample "Nietzsche Surrendered" (removed from lib/catalog.ts; `public/_redirects` forwards its old address to /watchtower/). Header is always solid inside /guild/desk and /guild/members. Spelling is American English site-wide.
- The Forms (`/forms/`, content in `lib/kinds.ts`): every kind of work by room (what it is, what the editor looks for, length, count, link to `/archive/?pillar=…&medium=…`). The Desk shows the same note under the chosen kind. Archive filters: Room + Form (no thinkers).
- Guild application (`pages/guild.astro`): three steps (you / work / faith) with a writing sample, reference and agreements; lands on `/thanks/?for=guild` ("within three days"). Invitation + reset emails: `emails/` (paste into Supabase templates); links `?token_hash=` handled in DeskApp.
- Photos inside a piece: "+ Photo" in the writing bar uploads to the public `media` bucket and saves `![caption](url)` on its own line (lib/marks.tsx renders it). Editing live work: members' edits to a published piece go via `rpc propose_revision` into `pieces.revision` (live stays until the editor approves in Waiting for you); the editor's own edits update the live piece. "Preview" opens a full-page render with the site's piece styles.
- Writing sheet is styled as you write (TipTap, `components/desk/RichBody.tsx`); it still saves the simple writing marks (`## > + * **`) that `lib/marks.tsx` reads.
- Featured photo framing: writers mark what stays in view (`components/desk/PhotoFocus.tsx`), saved as `pieces.image_focus` ("x% y%"), and every page uses it as `object-position` (`GuildPiece.imagePos`, `CatalogItem.imagePos`). Members' changes to it on a live piece go through `propose_revision` like the rest.
- Photography has its own form in the Desk ("Submit a photograph", or choose Photographs): one photograph (the piece's image_path), a caption (image_alt), optional details behind the lens in `pieces.photo_meta` (`lib/photo.ts`), and optional words of any length. Pages show it whole with `components/PhotoPlate.tsx`.
- Pillars decide the kinds of piece (DB trigger `private.pillar_medium`, front end `mediumsFor` in `lib/supabase.ts`): Watchtower = essay; Perimeter = recovery, testimony, deliverance, personal; Hearth = creative kinds. A published writer changing their profile triggers a rebuild (`private.after_profile_change`).
- Prestige: ten one-word ranks (Inkling, Kindling, Scribe, Torchbearer, Stonemason, Glasswright, Illuminator, Watchman, Luminary, Seraph) by number of published pieces (`lib/prestige.ts`, badges `components/PrestigeBadge.astro` + `desk/Prestige.tsx`, styles `styles/prestige.css`). Shown on the Desk (with progress), writer pages, the About-the-author card and the members directory; every badge links to the ladder at `/guild/members/?view=prestige` (open to visitors too).
- Trophies: 18 (`lib/trophies.ts`). Seven growing trophies: five by category bronze→silver→gold→rainbow with their own thresholds (Signal Fire 1/5/15/25, Perimeter Stone 1/3/10/20, Stained Glass Relic 3/10/20/30, Scribe’s Quill 1/5/12/25, Lyre 3/10/20/30), plus Years at the Table (1/2/3/5 years) and The Unbroken Flame (longest monthly streak 3/6/12/24); the rest are won once. Public pages recompute on each rebuild; the members area live. Achievements in bronze/silver/gold/rainbow (`lib/trophies.ts`, drawn as SVG by `trophySvg`), computed from published pieces + profile. Shown on writer pages (earned), your own members page (earned + still to earn), and catalogued on the prestiges page (#trophies). Reading/commenting trophies need those features first.
- Writers: public pages at `/guild/authors/<name>/` (`pages/guild/authors/[slug].astro`); author names/pictures link there. Any element with `data-author-id` fetches the latest portrait on page load (BaseLayout script), so a new portrait shows without a rebuild.
- Menu: `components/MenuPanel.astro` opens over the page from the header (the `/menu` page is the no-JavaScript fallback). Phones: while writing in the Desk the site header hides and a slim top bar (back, saved state, Save, Publish) takes over. On phones writing is three pages: Write (`#write`) → Label it (`#write-label`: pillar, medium, photo) → Review (`#write-review`: preview, Publish/Send); desktop keeps one screen. `/guild/desk/#write` opens a fresh sheet (menu "Write" button); writing has its own history entry so Back returns to My pieces and the draft saves on the way out.
- Forms (Guild application, Contact, newsletter `Subscribe`) use the doorway look: `components/DoorwayFrame.astro` + `styles/doorway.css`. Netlify form names unchanged.
- BaseLayout: Open Graph/Twitter previews (`image` prop), OA favicon + apple-touch-icon, Share/Print, first-visit
  "arrival" (cross draws itself, `components/Arrival.astro`, once per browser). `/enter/` is a drawn doorway.

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
