# Before the doors open: the prelaunch checklist

Kept for the Editor in Chief. When they say they are getting ready to launch, walk them through this list in plain
words, top to bottom, and tick things off here as they are done. (Started 11 Nov 2026; add to it as things come up.)

## Must be done first (these would hurt a real member)
- [ ] **A proper sender for sign-in emails.** Supabase's built-in sender only delivers to the owner's own team addresses,
      a few an hour, so "Forgot your password?" and confirmation emails would not reach real members. Needs an account
      with an email service and a change to the sign-in email settings (ask the owner first; it touches auth).
- [ ] **Backups.** The free Supabase plan keeps none. Move to Pro ($25 a month) before real members store real work.
      Pro also stops the project being paused after a quiet week.
- [ ] **Take the sample data off.** 76 sample members (46 from before; 30 mock members of 11 Nov who wrote, posted,
      tagged and messaged) and everything they made: about 100 published pieces, 24 forum threads and 170 replies,
      messages, Workshop drafts, six pieces waiting, one pretend report
      (`delete from auth.users where raw_app_meta_data->>'sample' = 'true'`, after fixing forum threads' last authors as
      was done when half were removed), and the 25 mock pieces on the owner's own account
      (`pieces.sanity_id like 'mock-desk-%'`). This also clears the test notifications and the sample Workshop drafts.
      Sample members never get email (their daily letters are off, and both email functions skip their addresses).
- [ ] **Open the lock.** Set `SITE_PUBLIC=true` in Netlify's environment variables and redeploy. Then check the site is
      no longer hidden from search engines, and that the "Opening soon" door is no longer what visitors meet.
- [ ] **Let search engines in.** `public/robots.txt` still says `Disallow: /`; change it to `Allow: /` on opening day.
      There is also no sitemap and no RSS feed yet (both are small jobs and help the site get found and followed).

## Found by the mock members (11 Nov 2026): rules the database now keeps
All in as of 11 Nov 2026 (`rules_the_forms_already_kept`), each tested by a mock member trying it and by an ordinary
use still working:
- [x] A name must be there and at most 80 letters; craft 120; bio 2,000; a web address must be a web address.
      Signing up with no name, a huge name or an editor's name still works (the name is made safe).
- [x] Nobody but an editor can take an editor's name.
- [x] A piece with the editor must have a title and its words (a photograph: its picture), also if rewritten while there.
- [x] Pace limits for everyone but editors: 6 forum posts a minute and 60 an hour; 3 new threads in ten minutes and
      12 a day; 12 messages a minute and 80 an hour; 10 Workshop notes a minute and 100 an hour.
- [x] One post tags eight members at most. Twenty unfinished pieces a writer (drafts and returned pieces).
      A conversation is reported once by each person until the editor has dealt with it.
- [x] The 5-photographs-a-month limit: tested, and it holds.
- [x] Decided 11 Nov 2026: a draft is its writer's alone until sent or shared. Editors (staff included) can no longer
      read, change or delete other members' drafts or see their unsent photographs.
- [x] Decided: a piece is frozen while it is with the editor. The writer withdraws it to edit, then sends it again.
- [x] Decided: Fellowship readers starting forum threads and messaging Guild writers is intended.
- [x] An editor's name shows "Taken" as it is typed (About the author, and the Fellowship join form), and Save waits.
- [x] Decided 11 Nov 2026 (the owner's checkbox answers), all in and tested:
      - A reported conversation is read only by the Editor in Chief and the editor it is assigned to (while open);
        only the Editor in Chief passes a report to another editor.
      - A writer changes a published piece only when an editor uses "Ask for changes" (a note to the writer, by email
        and on their Desk); the live piece stays up until an editor approves what comes back.
      - No reflection on your own piece. A thread's opening post cannot be deleted on its own.
      - Members can report a forum post (one open report each a post); the queue is on the Desk under Arrivals.
      - An editor can pass a waiting piece to another editor from the review panel.
      - "Take it" works only on a piece its editor has not opened yet (the hold lapses after a week, so nothing
        gets stuck; the editor who has it can always pass it on).
      - The bell's number is what has not been cleared yet.
      - Opening a bell line clears it and lands on the comment it is about (the thread turns to its page).
      - "Take a sabbath" on Waiting for you: while an editor rests, new pieces and reports go to the others.
      - An editor sees a reported forum post ringed in red, with the reason and "It's fine, leave it"; the Arrivals
        tile counts reports waiting.
      - Fixed: Chrome was opening conversations, threads and pieces in the background when the mouse rested on
        their links, which marked them read. They now wait for a real click.
      - Kept: the online count in the phone header; every member's vault visible to members.
      - Removed: the "My library" button on the vault (the Library tab stays); the menu links to the Dispatches
        letter (the sign-up box at the foot of the public pages still collects addresses).
- [ ] Remove the owner's two test accounts ("Watchman (Guild)", "Watchman (Fellow)") with the sample data.
- [ ] **Set the day the Guild opens** (one line, `GUILD_OPENED` in `src/lib/trophies.ts`). The Founding Stone goes to
      everyone who took a seat before that day or within three months after it. Until the day is set, every new member
      gets it.
- [ ] Right after the sample data is removed, reset the trophy tallies so real members' trophies count only real
      members' reflections and marks (one database call: `select private.retally_everyone();`).
- [ ] Turn on "leaked password protection" in Supabase's sign-in settings when moving to the paid plan (ask first).
- [ ] If real members ever say a limit feels tight, the numbers above are easy to raise.

## Built on 11 Nov 2026 after the full walk-through (check each once on a real phone)
- The old Sanity Studio is gone (`/studio`, its packages); builds are about three times faster. Its two environment
  variables in Netlify, if any were set, can be deleted.
- The writer sees who has a waiting piece ("with Honor · opened") and gets a bell line when it changes hands.
- When every editor is on sabbath, writers see a quiet note on their Desk.
- Drafts already saved themselves a couple of seconds after typing stops (this was wrongly reported as missing). What was
  fixed: the editor's note now stays on a returned piece after it is saved, and it stays under "Returned with a note".
- A private visitor count for editors on the Desk (pages and days only; readers who ask not to be tracked are left out).
- Mute or follow a forum thread (a pill under the thread's title; tags always reach you).
- The writer answers a reader's reflection, once; the reader gets a bell line.
- Inbox: "Mark all as read", and clearing notices now updates the count beside Inbox.

## The three rooms, reviewed 11 Nov 2026 (look once on a real phone)
- Hearth and Perimeter: shorter opening picture; each kind (prose, poetry, fiction; testimony, deliverance, recovery,
  personal) with its own glass-coloured pane, on the cards and on the filters (the bold was taken off: it read as cheesy).
- Hearth cards: the kind, title and subtitle sit on the picture, which fades to night at its foot; the writer's name
  beneath. On phones the cards are taller so the picture still shows: check the words read clearly over the fade.
- Every written piece now needs a subtitle (form and database); photographs are exempt. Sample pieces without one were
  given one. Usual lengths were lowered (prose from 250, fiction from 300, Perimeter floors 300 to 500, a photograph
  needs 100 words, the only hard count).
- The Watchtower's large line is the journal's own ("The same truth holds again, whole, in the resurrection of
  Christ."), no longer lifted from the newest piece. The owner may want different words.
  A "Write for The Hearth" card at the foot. The makers swipe in one row on phones.
- Watchtower on phones: four "Also new", the method as three tight rows, the writers in one swiping row.
- Undecided by the owner: whether the Hearth and the Perimeter should open with their newest work, as the Watchtower does.
- The Gallery was 8px too wide on phones (the old check could not see it; the check now measures against the phone's
  own width).

## Should be done (capacity and cost)
- [ ] **Netlify builds.** Builds were being capped during development. Check the plan's monthly build allowance against
      one build per change plus the hourly rebuild when something was published.
- [ ] **Shrink pictures as they are uploaded** (parked by the owner on 11 Nov 2026). Uploads average 1.1 MB, so the free
      plan holds about 900 pictures and about 9,000 full-size picture views a month. Shrinking would stretch both
      four to five times.
- [ ] **Know the ceilings** (free plan): 200 members online at the same moment, 1 GB of pictures, about 10 GB of
      traffic a month, 500 MB of text (far off). Members themselves are not a limit (50,000 active a month).

## Check on a real iPhone (built and tested in Chrome only)
- [ ] Your vault's new header: on "Edit your vault", tap one of the ten backgrounds, save, and see the whole top of your
      vault change; your name should still read clearly over it. With many trophies, "See all" opens the rest.
- [ ] The twelve rarest trophies (each its own shape: castle, lion, crown, shield and serpent, cathedral...): on the
      phone they should be crisp, with nothing drawn outside its shape and no boxes.
- [ ] The trophies (11 Nov 2026: 54 of them, redrawn without CSS filters): no dark boxes around any trophy, in the
      vault or at Prestiges → Trophies; trophies still to earn show in dark iron; gold and rainbow keep a soft halo;
      the coloured glass of an earned rainbow trophy turns slowly and smoothly (its centre and rim stay still).
- [ ] The share sheet shows the OA mark beside a piece's title, not a compass.
- [ ] A link to the home page, and a link to a piece, each preview with the right card in Messages.
- [ ] "Share as a social post": the preview opens, swiping shows the second picture, "Save to images" puts both in Photos.
- [ ] Listen reads a piece aloud, the highlight follows, pause and skip respond. On a computer too (it stayed silent once).
- [ ] The bell: a tick clears one line; "Clear all" asks first; cleared lines stay gone after a refresh.
- [ ] Explore: pulling down reshuffles.
- [ ] The bottom bar: Explore in the middle, your picture last; the header pill reads Guild (The Way for the Fellowship).
- [ ] The vault's Library tab: three tabs on one line, dark shelves, the Private / Public switch flips.
- [ ] Reading inside the Guild: text size and night reading.
- [ ] Read ticks appear on pieces you have finished.
- [ ] Password-reset emails arrive for a brand-new member (after the email sender is set up).
- [ ] The site added to the home screen opens like an app, with the right icon.

## Walk through once as each kind of person
- [ ] A visitor who is not signed in: home, a room, a piece, Start Here, Join (both sides), Contact.
- [ ] A new Guild member: sign up, first-day steps, write, send to the editor, the email the editor gets.
- [ ] An editor (staff): the waiting queue, the rotation, approve and return, the writer's email.
- [ ] A new Fellowship member: sign up, save to library, The Way, the forum.

## Words and pages to read once more
- [ ] **About** (rewritten 11 Nov 2026): "Founded by Watchman" and the account of how the Guild works were drafted for you; read them as your own. The name Ainslie Willson no longer appears on About, but is still the byline and signature on "Untangling Mental Strongholds" in the Perimeter: decide whether that stays.
- [ ] **The Rule of the House** (`/rule/`, written 11 Nov 2026): the conduct asked of everyone and the standard of the work were drafted for you. Read every line as your own before opening; change anything that is not how you would say it.
- [ ] Send yourself one test Guild application after the next deploy: the form lost its reference field and gained a tick for the Rule, so check it still arrives in Arrivals with every answer.
- [ ] Terms, privacy and disclaimer (a line about print folios was removed).
- [ ] The forum rules and the pinned welcome threads.
- [ ] About, Manifesto, What We Believe, Start Here.

## Parked by the owner (decide before or after launch)
- Editor's picks. Phone notifications. The weekly Dispatches letter.
- **An AI helper that answers only questions about the Guild** (asked for and parked on 11 Nov 2026: "I will add in the
  future, just not now"). Not built. It is not free: it needs the owner's own Anthropic account and its key in Netlify.
  Estimate given: on the smallest model about $1 per 1,000 questions (under $1 a month for 100 members). Open choices
  when it is picked up: who may ask (signed-in only was recommended), where it is pinned (top of the Inbox was
  recommended), its name, and a daily limit per person.
- Folios (kept unbuilt; see "Parked: Folios" in HANDOFF.md). "Receive the Dispatches" links are still in the menus.
- A recorded or studio voice for Listen, in place of the device's own.
- Whether the "Seeing as…" pill should move in forum threads on phones.
- Whether a member may hide their whole vault (only the library has a private / public switch today).
