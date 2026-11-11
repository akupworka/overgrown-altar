# Before the doors open: the prelaunch checklist

Kept for the Editor in Chief. When they say they are getting ready to launch, walk them through this list in plain
words, top to bottom, and tick things off here as they are done. (Started 11 Nov 2026; add to it as things come up.)

## Must be done first (these would hurt a real member)
- [ ] **A proper sender for sign-in emails.** Supabase's built-in sender only delivers to the owner's own team addresses,
      a few an hour, so "Forgot your password?" and confirmation emails would not reach real members. Needs an account
      with an email service and a change to the sign-in email settings (ask the owner first; it touches auth).
- [ ] **Backups.** The free Supabase plan keeps none. Move to Pro ($25 a month) before real members store real work.
      Pro also stops the project being paused after a quiet week.
- [ ] **Take the sample data off.** 56 sample members (46 from before, and the 10 mock members of 11 Nov who wrote,
      posted, tagged and messaged) and everything they made
      (`delete from auth.users where raw_app_meta_data->>'sample' = 'true'`, after fixing forum threads' last authors as
      was done when half were removed), and the 25 mock pieces on the owner's own account
      (`pieces.sanity_id like 'mock-desk-%'`). This also clears the test notifications and the sample Workshop draft.
- [ ] **Decide about the two extra Watchman profiles** ("Watchman (Guild)", "Watchman (Fellow)"): keep for testing or remove.
- [ ] **Open the lock.** Set `SITE_PUBLIC=true` in Netlify's environment variables and redeploy. Then check the site is
      no longer hidden from search engines, and that the "Opening soon" door is no longer what visitors meet.

## Found by the mock members (11 Nov 2026): rules the database should enforce, not only the forms
The site's own forms prevent each of these; someone writing straight to the database with their own sign-in could do them.
- [ ] A member's name can be saved empty, or hundreds of characters long; a bio has no length limit. Add limits.
- [ ] A web address can be saved as something other than a web address. (It is no longer shown as a link unless it
      starts with http, but the database should refuse it too.)
- [ ] A piece can be sent to the editor with no title and no words; a photograph with no picture. Require them on sending.
- [ ] Nothing slows a flood: 40 forum replies or 30 new threads in one second, or hundreds of messages to one person
      (one member could fill the Editor in Chief's inbox, 1,000 messages, so nobody else can write to him). Add a
      gentle limit per minute.
- [ ] Decide: editors (staff included) can read every member's unsent drafts in the database, though the Desk never
      shows them. Keep, or close it so drafts are private until sent or shared.
- [ ] Decide: a writer can keep rewriting a piece while it is with the editor. Keep, or freeze it until it comes back.
- [ ] The 5-photographs-a-month limit was not tested (it needs approved photographs to count).

## Should be done (capacity and cost)
- [ ] **Netlify builds.** Builds were being capped during development. Check the plan's monthly build allowance against
      one build per change plus the hourly rebuild when something was published.
- [ ] **Shrink pictures as they are uploaded** (parked by the owner on 11 Nov 2026). Uploads average 1.1 MB, so the free
      plan holds about 900 pictures and about 9,000 full-size picture views a month. Shrinking would stretch both
      four to five times.
- [ ] **Know the ceilings** (free plan): 200 members online at the same moment, 1 GB of pictures, about 10 GB of
      traffic a month, 500 MB of text (far off). Members themselves are not a limit (50,000 active a month).

## Check on a real iPhone (built and tested in Chrome only)
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
- [ ] Terms, privacy and disclaimer (a line about print folios was removed).
- [ ] The forum rules and the pinned welcome threads.
- [ ] About, Manifesto, What We Believe, Start Here.

## Parked by the owner (decide before or after launch)
- Editor's picks. Phone notifications. The weekly Dispatches letter.
- Folios (kept unbuilt; see "Parked: Folios" in HANDOFF.md). "Receive the Dispatches" links are still in the menus.
- A recorded or studio voice for Listen, in place of the device's own.
- Whether the "Seeing as…" pill should move in forum threads on phones.
- Whether a member may hide their whole vault (only the library has a private / public switch today).
