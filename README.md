# Overgrown Altar

The website for overgrownaltar.com, built with [Astro](https://astro.build).

## Where things are

| Folder / file | What it is |
| --- | --- |
| `src/pages/` | One file per page. `index.astro` is the Home page. A new file here = a new page. |
| `src/layouts/BaseLayout.astro` | The frame every page sits in (head, styles, footer). |
| `src/components/` | Reusable pieces: nav, footer, wordmark, monogram, cross. |
| `src/styles/global.css` | Brand colors, fonts and shared styles. Change a color here, it changes everywhere. |
| `public/images/`, `public/fonts/` | Photos and font files, served as-is. |
| `src/pages/[pillar]/[slug].astro` | One page per article from Sanity, e.g. `/watchtower/nietzsche-surrendered`. |
| `src/components/ArticlePage.astro` | The article template (dispatch layout; protocol layout for The Perimeter). |
| `src/lib/sanity.ts` | Every question the site asks Sanity. |
| `sanity.config.ts`, `sanity/schemas/` | Your Studio at `/studio`, and the fields an article has. |
| `scripts/seed.mjs` | Loads the design's sample articles into Sanity (run once). |

## Run it on your computer

1. Install Node.js (version 20 or newer) from nodejs.org.
2. In this folder, run `npm install` once.
3. Run `npm run dev` and open http://localhost:4321. Edits show up instantly.

## Roadmap

1. Public pages — done: all 17 pages from the design, plus a thank-you page
2. Sanity Studio at /studio for writing and publishing articles — built
3. Guild accounts: invitations, sign-in, the Guild Desk
4. Comments, saved pieces, member pages
5. Go live on Netlify

## Writing and publishing

1. Go to `/studio` and sign in with your Sanity account.
2. Choose a pillar, then **+** to start an article. Fill in the Write, Placement and Editorial Matrix tabs.
3. Press **Publish**. Netlify rebuilds the site and the article is live in a minute or two.
