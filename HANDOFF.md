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
- **Sanity** is gone (removed 11 Nov 2026): the Studio at `/studio`, its packages and schemas. Everything is in Supabase.
  (`pieces.sanity_id` remains only as a label on imported and sample rows.)
- Design system in code: `src/styles/global.css` (tokens, type), `src/styles/motion.css`,
  components `GlassCard`, `GlassLight` (stained light), `Avatar`, `DispatchList`, `SiteNav` (fixed header).
  Brand rules: colour enters only through glass; never glow or colour the marks; quiet, editorial.

## Latest polish
- `src/lib/catalog.ts`: one list of real pieces (2 complete design pieces + published Guild pieces) used by Home,
  The Watchtower, The Perimeter, Archive, Start Here and "More to read". Sample-only pieces were retired.
- Retired: the design sample "Nietzsche Surrendered" (removed from lib/catalog.ts; `public/_redirects` forwards its old address to /watchtower/). Header is always solid inside /guild/desk and /guild/members. Spelling is American English site-wide.
- The Crafts (`/crafts/`, once called The Forms; /forms/ forwards there; content in `lib/kinds.ts`): every kind of work by room (what it is, what the editor looks for, length, count, link to `/archive/?pillar=…&medium=…`). The Desk shows the same note under the chosen kind. Archive filters: Room + Form (no thinkers).
- Guild application (`pages/guild.astro`): three steps (you / work / faith) with a writing sample, reference and agreements; lands on `/thanks/?for=guild` ("within three days"). Invitation + reset emails: `emails/` (paste into Supabase templates); links `?token_hash=` handled in DeskApp.
- Photos inside a piece: "+ Photo" in the writing bar uploads to the public `media` bucket and saves `![caption](url)` on its own line (lib/marks.tsx renders it). Editing live work: members' edits to a published piece go via `rpc propose_revision` into `pieces.revision` (live stays until the editor approves in Waiting for you); the editor's own edits update the live piece. "Preview" opens a full-page render with the site's piece styles.
- Writing sheet is styled as you write (TipTap, `components/desk/RichBody.tsx`); it still saves the simple writing marks (`## > + * **`) that `lib/marks.tsx` reads.
- Featured photo framing: writers mark what stays in view (`components/desk/PhotoFocus.tsx`), saved as `pieces.image_focus` ("x% y%"), and every page uses it as `object-position` (`GuildPiece.imagePos`, `CatalogItem.imagePos`). Members' changes to it on a live piece go through `propose_revision` like the rest.
- Photography has its own form in the Desk ("Submit a photograph", or choose Photographs): one photograph (the piece's image_path), a caption (image_alt), optional details behind the lens in `pieces.photo_meta` (`lib/photo.ts`), and optional words of any length. Pages show it whole with `components/PhotoPlate.tsx`.
- The Hearth keeps photographs out of "The work": its "The gallery" section shows the newest four, and `/hearth/gallery/` (src/pages/hearth/gallery.astro) shows every one, whole, filtered by film/digital and photographer, newest or oldest, twelve to a page. Prestiges (lib/prestige.ts) are 1, 3, 6, 10, 16, 25, 40, 60, 85, 120 pieces.
- The Guild forum (members only): `components/desk/Forum.tsx` + `styles/forum.css`, at /guild/members/?view=forum, ?board=<slug>, ?t=<thread>. Tables forum_boards / forum_threads / forum_posts with row-level security (private.is_member, private.is_editor). Each board keeps its `keep_threads` (40) most active threads; a trigger clears the quietest when new ones arrive (pinned stay). The editor pins, closes and deletes; members edit and delete their own posts. Add or rename boards in the forum_boards table.
- Inside the members' area the header carries a second bar (SiteNav `.inner`): My Desk, Write, Review (editor), The Forum, Members, Prestiges, My page, The crafts. Signed in, About and (inside) Folios leave the main header and the mark links to /guild/members/. Forum trophies read `public.forum_tallies` (kept by triggers, only ever goes up).
- Pillars decide the kinds of piece (DB trigger `private.pillar_medium`, front end `mediumsFor` in `lib/supabase.ts`): Watchtower = essay; Perimeter = recovery, testimony, deliverance, personal; Hearth = creative kinds. A published writer changing their profile triggers a rebuild (`private.after_profile_change`).
- Prestige: ten one-word ranks (Inkling, Kindling, Scribe, Torchbearer, Stonemason, Glasswright, Illuminator, Watchman, Luminary, Seraph) by number of published pieces (`lib/prestige.ts`, badges `components/PrestigeBadge.astro` + `desk/Prestige.tsx`, styles `styles/prestige.css`). Shown on the Desk (with progress), writer pages, the About-the-author card and the members directory; every badge links to the ladder at `/guild/members/?view=prestige` (open to visitors too).
- Trophies: 54 (`lib/trophies.ts`, drawn as SVG by `trophySvg`): 18 that grow bronze→silver→gold→rainbow, each with its own thresholds, and 36 won once (labelled "Won once", never by a metal, so they don't look as if they have levels; easy ones are cast in bronze). Five shelves (`TROPHY_GROUPS`): The work, Photography, The company kept, Faithfulness (the two that grow with time), The rarest. The twelve rarest are each drawn one of a kind (`RARE` in `lib/trophies.ts`: its own silhouette, deep jewel glass `JEWEL`, fine gold; the house style is quiet elegance, not bright or toy-like): Founding Stone (sunburst and cut cornerstone), Keys of the House (doorway and crossed keys; every editor, chief or staff), Living Stones (castle), Son of Encouragement (heart and flame), Bold as a Lion (15 Watchtower dispatches), The Hearth Crown (40 written Hearth pieces), The Serpent Underfoot (40 Perimeter pieces; shield, sword, slain serpent), Three Windows, The Hundredfold, The Psalter, A Year at the Table (a chalice under twelve lights, for the first twelve months; the growing Years at the Table starts at the second year), The Cathedral. The Founding Stone goes to everyone who joins before the Guild opens or within three months after: set the opening day in `GUILD_OPENED` at launch (while it is null, everyone who joins is a founder). An earned rose-window trophy's glass turns once a minute, as do the Founding Stone's ring and the Cathedral's rose (`.tr-turn`, transform only, off for reduced motion). Worked out from published pieces, the profile, and one row per member in `public.forum_tallies`: the forum counts, plus nine high-water marks the database keeps by trigger (`private.tally_member`, `private.tally_touch`): reflections written and received, "stayed with me" given and received, Workshop notes given, drafts brought to the Workshop, pieces kept, writers followed, reflections answered. They only rise to the live count, so nothing is lost to an unfollow and toggling cannot farm them. No trophy counts followers. `private.retally_everyone()` resets them to the live counts (run once at launch after the sample data goes). Living Stones asks for gold in every trophy marked `craft`. The Editor in Chief alone sees a switch, "Preview: everything won", on the prestiges and trophies pages and on their own vault: it hands a made-up record (`showcaseCtx`) to the same code, so the top rank and all 54 trophies can be looked at; nothing is saved. No CSS filters on trophies (iPhone Safari draws boxes): shadow, halo and the iron of a trophy still to earn are drawn inside the SVG. A piece approved for a later day doesn't count until that day. Public writer pages show the trophies from pieces and profile only (no tally at build time) and recompute on each rebuild; the members' area is live. Shown on writer pages (earned), your own vault (earned + still to earn), and catalogued at `/guild/members/?view=trophies`.
- The Rule of the House (`/rule/`, `pages/rule.astro`; linked from the footer, the menu, both doors of `/join/`, the Fellowship sign-up line and a required tick on the Guild application): a statement first that the house is open to all denominations (one body; respect; teachable), then what is asked of everyone, Fellowship and Guild alike (eleven points of conduct), then the standard of the work (high-level, carefully crafted, ambitious; the dispatches foremost). It is the one set of rules: the six things once listed on `/guild/` as "What we ask of members" are folded into it, and `/guild/` and `/join/` now only point to it (a lit "Read before you apply / join" panel). Both forms require a tick that it has been read: the Fellowship's beside its button, the Guild's on the first page of the application. The words were drafted for the owner and are theirs to change, in the two lists at the top of the file.
- Joining (`/join/`, no footer): two doors; each door shows a few of what is earned inside (ranks and trophies; pilgrim badges); the Guild's shows "How a seat is given" (four steps on a line, the Rule of the House panel, an arrow down) then the application (`components/GuildApply.astro`, look in `styles/guild.css`): one centred column, three steps on a line, a sheet beneath; required fields carry a star; no reference is asked for (the owner removed it).
- The Watchtower (`pages/watchtower/index.astro`): the three newest under arched pictures, then "Also new" as picture cards like the Hearth's (kind, title and subtitle on the picture over a fade to night, the writer beneath). The owner refused both a small-thumbnail list and a words-only index here: keep it pictures. Dispatches without a picture of their own take turns with nine of the house's photographs.
- A member's vault (`MembersApp` `Member`, `.m-hero2` in `desk.css`): on a computer a tall arch portrait, the name and a row of craft, rank and "writers you follow" beside it, the page's buttons in one row beneath, and "Sign out" at the top right (stacked and centred on phones). On screens wider than 1100px a panel to the right (`.m-stand`) shows the member's standing: the crest of their rank, its name, their three finest trophies and the count; it leads down to the vault. A member can change the whole background behind the top of their vault to one of ten of the house's photographs (`lib/covers.ts`), chosen on "Edit your vault": only its short name is saved (`profiles.cover`, checked by the database; members update `profiles` column by column, so any new column a member may change needs its own `grant update (col) ... to authenticated`), nothing is uploaded, and the page swaps the Guild's backdrop (`.desk-memory`) for it while that vault is open. No choice means the usual backdrop. (A boxed banner was tried and refused by the owner.) The public writer page does not use it yet. A vault with more than twelve trophies beneath its shelf (ten on a phone) shows two rows and a "See all" button, in the members' area and on public writer pages. In the members' area every vault ends with two fold-out buttons side by side, "See all" and "Still to earn" (they replaced the links to the prestiges and trophies pages); public pages have only "See all", since a writer's tally is not known when the site is built.
- Writers: public pages at `/guild/authors/<name>/` (`pages/guild/authors/[slug].astro`); author names/pictures link there. Any element with `data-author-id` fetches the latest portrait on page load (BaseLayout script), so a new portrait shows without a rebuild.
- Menu: `components/MenuPanel.astro` opens over the page from the header (the `/menu` page is the no-JavaScript fallback). Phones: while writing in the Desk the site header hides and a slim top bar (back, saved state, Save, Publish) takes over. On phones writing is three pages: Write (`#write`) → Label it (`#write-label`: pillar, medium, photo) → Review (`#write-review`: preview, Publish/Send); desktop keeps one screen. `/guild/desk/#write` opens a fresh sheet (menu "Write" button); writing has its own history entry so Back returns to My pieces and the draft saves on the way out.
- Forms (Guild application, Contact, newsletter `Subscribe`) use the doorway look: `components/DoorwayFrame.astro` + `styles/doorway.css`. Netlify form names unchanged.
- BaseLayout: Open Graph/Twitter previews (`image` prop), OA favicon + apple-touch-icon, Share/Print, first-visit
  "arrival" (cross draws itself, `components/Arrival.astro`, once per browser). `/enter/` is a drawn doorway.

## Parked: the Dispatches letter
The weekly letter is not built. Its menu links were removed on 11 Nov 2026 (`menu.astro`, `MenuPanel.astro`); the
sign-up doorway (`Subscribe.astro`, Netlify form "dispatches") still stands at the foot of the public pages and keeps
collecting addresses. When the letter exists, put the links back ("Receive the Dispatches" → `/#subscribe`).

## Parked: Folios
Folios (the publication's bound, printed collections) are a later chapter. The owner asked for them to be taken off the
site everywhere but remembered. Nothing was deleted:
- The page is kept, unbuilt, at `src/parked/folios.astro` (it was `src/pages/folios.astro`, served at /folios).
- Its photographs are still in `public/images` (`folios-photo*.jpg`; the home page and the door use `folios-photo-2`).
- To bring Folios back: move the file to `src/pages/folios.astro`, then restore its links: the header list in
  `SiteNav.astro`, the footer list in `SiteFooter.astro`, "The Publication" in `MenuPanel.astro` and `pages/menu.astro`,
  the page entry in `pages/search-index.json.ts`, the tile on the Guild page (`desk/MembersApp.tsx`, beside The Gallery),
  the third button on `pages/start-here.astro`, and the print-sales line in `pages/legal.astro`. The commit that parked
  it shows each exact line.

## Branches

NOTE (latest): Guild writing and publishing now live in **Supabase**, not Sanity. The `sanity` branch was
last merged before Guild Desk part 2 and now conflicts in index/watchtower/hearth/perimeter; it is likely
obsolete. The Sanity Studio was removed from `main` on 11 Nov 2026.


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

## Rebuilds, live lists, writer emails, inviting from the Desk
- Rebuilds no longer happen on every change. Approving, changing a live piece or a published writer's page marks
  `private.settings.rebuild_pending`; a pg_cron job (`overgrown-rebuild-if-pending`, minute 7 of every hour) calls the
  Netlify build hook only if something is pending. The editor's Desk has **Rebuild now** (`public.rebuild_now()`).
- Lists fill themselves in between builds (`lib/live.ts`): DispatchList with `live={{ pillar, max }}` (home, Watchtower,
  Perimeter) and the Hearth's cards ask Supabase for pieces approved since the page was built. New piece pages already
  work at once (the 404 page's LivePiece). Writer pages and the archive catch up at the next rebuild.
- Writers are emailed the editor's decision (approved, returned with the note, declined): Supabase calls
  `netlify/functions/notify-writer.mts`, which sends through Resend, once per decision (`pieces.writer_notified`).
- The editor's **Invite a writer** box calls `netlify/functions/invite-writer.mts` (checks the caller is the editor,
  then Supabase sends the branded invite and sets their name).
- **Nothing deleted is kept.** Pieces, forum posts and profile changes are real deletes/overwrites (no history
  tables). Uploaded files are swept daily by `netlify/functions/sweep-files.mts` (a scheduled function): any file in
  the guild, media or portraits buckets older than two days that no piece, portrait or forum post mentions is removed.
- Both functions need Netlify environment variables (Site configuration > Environment variables):
  `SUPABASE_SERVICE_ROLE_KEY` (Supabase > Project Settings > API keys > secret key) for both,
  `RESEND_API_KEY` (resend.com, with overgrownaltar.com verified) for the writer emails, and optionally
  `EMAIL_FROM` (default "Overgrown Altar <editor@overgrownaltar.com>"; needn't be a real inbox) and
  `EMAIL_REPLY_TO` (a real inbox where writers' replies land). Without them, they quietly do nothing.
- Forum extras: "new since your last visit" (kept on each device), Quote, *italic* / **bold** / links in posts,
  and each poster's prestige badge.

## The editor's Forms room
- Desk tab **Forms** (`/guild/desk/#forms`, editor only): Guild applications, Contact letters and Dispatch sign-ups,
  read from Netlify Forms by `netlify/functions/forms.mts` after it checks the caller is the editor. Read only.
- Needs `NETLIFY_FORMS_TOKEN` (a Netlify personal access token: User settings > Applications > New access token) in
  Netlify > Site configuration > Environment variables. Until it's set, the room says it isn't switched on yet.

## Forums
- Boards are called "forums" on the site (tables keep their names: `forum_boards`, `forum_threads`, `forum_posts`).
- Only the editor opens forums (Forum page → Open a new forum); `private.guard_board()` fills in the address and place.
  Members start threads and reply. From the Editor's Desk is `editor_only` (only the editor starts threads there).
- Names on the site: forums (rooms, `forum_boards`) · threads (`forum_threads`) · replies (`forum_posts`).
- Every forum keeps its 40 most active threads (10 per page). A thread shows 20 replies per page and closes itself at
  200 replies (`private.after_post`). Rules page: `?view=rules` (Forum.tsx).

## Readers and members (added Nov 2026)
- **App install**: `public/manifest.webmanifest`, `icon-192/512.png`, apple meta in `BaseLayout`. iPhone home-screen apps keep their own sign-in.
- **Pace rules** (trigger `private.submission_limits`): two pieces with the editor at once; five photograph posts a calendar month; the editor is exempt. The Desk checks first and keeps the piece as a draft.
- **Scheduling**: the editor sets "Publish on" (own pieces, or Schedule in review). It's stored as a future `published_at` on an approved piece. `guild.ts`/`live.ts` hide it until then; `private.rebuild_if_pending` (hourly cron) rebuilds once the time passes.
- **Reading tools** (`components/PieceTools.astro` on `guild/[slug]`): text size and night reading (`oa_read` in localStorage, set before paint), Save for later (`saves`), Follow (`follows`), "This stayed with me" (`piece_marks`), one reflection per member per piece (`piece_reflections`). Desk shelf: `desk/Reading.tsx`.
- **Photographs**: the viewer in `BaseLayout` swipes through every `a[data-zoom]`; photo pages step/swipe to newer/older (Gallery order).
- **Forum mentions**: `@Name` in replies → `forum_mentions`; highlighted by `inline()` in `Forum.tsx`.
- **Search**: `/search/` reads `/search-index.json` (built) and, for members, profiles and thread titles live.
- **Welcome**: `desk/Welcome.tsx`, first steps for members (not the editor); hidden once done or dismissed.
- **Daily letter**: `netlify/functions/daily-letter.mts` (13:17 UTC). Messages, replies in your threads, mentions, marks/reflections on your pieces, new work from writers you follow. Off switch: `member_prefs.email_digest` on Edit my page. Uses the same Resend settings as the writer emails.

## The Fellowship (readers with accounts)
- Role `fellow` in `profiles.role`. Sign-up is open at `/fellowship/` → `netlify/functions/join-fellowship.mts` (creates the account with
  `generateLink` and sends our own welcome letter through Resend; the Supabase invite template stays for Guild writers).
- Fellows can't write or upload (`private.is_writer()` on pieces insert and the guild/media buckets). They can message, use the forum,
  save, follow and respond. Their saves are their **collection**, which is public (`/collection/?of=<id>`, `desk/Collection.tsx`).
- On the site: `html[data-fellow]` hides writing tools (`gbar.css`); the phone bar's centre button becomes Explore (search). The Desk shows
  `desk/Fellow.tsx`; the Guild page lists the Fellowship in its own section; on a fellow's page the editor can "Welcome into the Guild"
  (`public.welcome_to_guild`, the editor only; `guard_profile` allows the editor to move people between member and fellow).
- `scripts/check.cjs --as fellow` previews it.

## Rules the database keeps (added 11 Nov 2026)
Found by acting as mock members; each was tested by a member trying it and by the ordinary use still working.
- **Profiles**: name 1 to 80 letters, craft 120, bio 2,000, website must start with http(s). Nobody takes an editor's
  name (`public.name_taken(text)` lets the forms say "Taken"; `private.name_not_an_editors`).
- **Pieces**: every written piece needs a subtitle before it is sent or published, and a subtitle cannot be emptied
  afterwards (photographs are exempt: their one line stays optional). A waiting piece needs a title and its words or
  picture (both rules in `private.submission_complete`), is frozen for
  its writer while waiting (`private.frozen_with_editor`; withdraw to edit), and a writer keeps at most 20 unfinished
  pieces. Drafts are private: editors read a piece only once it is sent (`pieces` policies; `private.editor_reads_file`).
- **Published pieces** change only when an editor asks: `public.ask_for_changes(piece, note)` writes
  `piece_change_requests`; then `propose_revision` works; the editor approves in the review and the request is cleared.
- **The rotation** (`private.next_editor`): fewest waiting first; editors on sabbath (`editor_sabbath`) come last.
  A piece sent back and resent returns to the same editor (`private.assign_piece`). `public.pass_piece(piece, editor)`
  hands a waiting piece on; `take_over('piece')` only works before its editor has opened it
  (`pieces.review_opened_at`, set by `public.piece_opened`, lapses after 7 days).
- **Pace limits** (not for editors): forum posts 6/min 60/h, threads 3/10 min 12/day, messages 12/min 80/h, Workshop
  notes 10/min 100/h, eight tags a post. Each forum keeps its 50 most active threads; an opening post is not deleted alone.
- **Reports**: a conversation (`dm_reports`, one open each; read by the chief and the assigned editor only,
  `private.reads_report`) and a forum post (`forum_reports`, shown on the Desk under Arrivals and ringed in red on the thread).
- **Reflections**: not on your own piece. `public.piece_stats(piece)` gives marks / reflections / saves to the writer
  and editors. `public.bell()` carries the post id for mentions and replies, so a bell line opens on the comment.
- **Crossing over**: when a Fellowship reader becomes a member their `saves` are copied into `library`.
- Sample members (`@sample.overgrownaltar.com`) are never emailed (`notify-writer`, `daily-letter`).
- The site's speculation rules never prerender `?dm=`, `?t=` or `?p=` links (opening those marks things read).
- **Hands and rest**: `pieces.assigned_at` (stamped whenever a piece changes hands) feeds the bell's `handed` line;
  `public.editors_resting()` tells writers when every editor is on sabbath.
- **Visitor count**: `public.count_view(path)` (called once a page from `BaseLayout.astro`, never for the members' rooms
  or readers with Do Not Track) adds to `page_views(day, path, views)`; `public.visit_stats()` gives editors today, the
  week and the most opened pages.
- **Threads**: `thread_watch(member, thread, follow|mute)`; `bell()` adds followed threads and drops muted ones.
- **Reflections**: `piece_reflections.reply` is set only through `public.answer_reflection(id, text)`, once, by the
  piece's writer; the bell's `answer` line tells the reader.
