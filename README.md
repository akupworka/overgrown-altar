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

## Run it on your computer

1. Install Node.js (version 20 or newer) from nodejs.org.
2. In this folder, run `npm install` once.
3. Run `npm run dev` and open http://localhost:4321. Edits show up instantly.

## Roadmap

1. Public pages: done
2. Guild accounts, the Desk, the forum, the inbox and the Fellowship: done (Supabase; see `HANDOFF.md`)
3. Go live: walk through `PRELAUNCH.md`
