// The lock on the whole site, while it is being finished.
//
// Netlify runs this on its own servers before sending any page. Without the password,
// no page is sent: the visitor sees the password screen at /enter/ instead.
//
// Settings (Netlify > Site configuration > Environment variables), then redeploy:
//   PRIVATE_PAGE_PASSWORD = the password visitors type in   (SITE_PASSWORD also works)
//   SITE_PUBLIC = true      -> opens the site to everyone (the lock steps aside)
// Until a password is set, the site stays closed to everyone.

declare const Netlify: { env: { get(key: string): string | undefined } };

const COOKIE = 'oa_entry';
const THIRTY_DAYS = 60 * 60 * 24 * 30;

// A proof of the password that is safe to keep in a cookie: it can't be turned back into the password.
async function proof(password: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('overgrown-altar entry v1'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Compares two strings without leaking, through timing, how much of them matched.
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(req: Request, name: string): string {
  for (const part of (req.headers.get('cookie') ?? '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return '';
}

// Only ever send people back to a page on this site.
const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/enter') ? n : '/');

const go = (url: URL, to: string, headers: Record<string, string> = {}) =>
  new Response(null, { status: 303, headers: { Location: new URL(to, url).toString(), 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', ...headers } });

// Shared links: the apps that draw a link's preview (Messages, WhatsApp, Slack, Instagram and the rest) are shown a
// piece's share card even while the site is locked: its title, its one-line description and its picture, and nothing
// else. The piece itself stays behind the door; a person following the link still meets the password screen.
const PREVIEWERS = /facebookexternalhit|Facebot|Twitterbot|Slackbot|WhatsApp|TelegramBot|Discordbot|LinkedInBot|Pinterest|SkypeUriPreview|redditbot|Snapchat|Applebot|iMessage/i;
const PIECE = /^\/guild\/(?!desk\/?$|members\/?$|authors(?:\/|$))[^/]+\/?$/;
async function shareCardOnly(next: () => Promise<Response>): Promise<Response | null> {
  const page = await next();
  if (!page.ok || !(page.headers.get('content-type') ?? '').includes('text/html')) return null;
  const head = (await page.text()).split(/<\/head>/i)[0];
  const tags = [...(head.match(/<title>[^<]*<\/title>/i) ?? []),
    ...(head.match(/<meta\s+(?:property="og:[^"]+"|name="(?:twitter:[^"]+|description)")\s+content="[^"]*"\s*\/?>/gi) ?? [])];
  if (!tags.some((t) => t.includes('og:image'))) return null;
  // (with the site's mark, so a share sheet or a preview shows the OA monogram beside the title)
  const icons = '<link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png"><link rel="icon" href="/favicon.ico" sizes="any">';
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8">${tags.join('')}${icons}<meta name="robots" content="noindex, nofollow"></head><body></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } });
}

export default async (req: Request, context: { next: () => Promise<Response> }) => {
  if ((Netlify.env.get('SITE_PUBLIC') ?? '').toLowerCase() === 'true') return context.next();

  const url = new URL(req.url);
  const password = Netlify.env.get('PRIVATE_PAGE_PASSWORD') || Netlify.env.get('SITE_PASSWORD');
  const here = url.pathname + url.search;

  // The password form posts here.
  if (url.pathname === '/unlock' || url.pathname === '/unlock/') {
    if (req.method !== 'POST') return go(url, '/enter/');
    const form = await req.formData();
    const next = safeNext(String(form.get('next') ?? ''));
    if (!password) return go(url, '/enter/?error=closed');
    const given = String(form.get('password') ?? '');
    const expected = await proof(password);
    if (!given || !same(await proof(given), expected)) return go(url, `/enter/?error=wrong&next=${encodeURIComponent(next)}`);
    return go(url, next, { 'Set-Cookie': `${COOKIE}=${expected}; Path=/; Max-Age=${THIRTY_DAYS}; HttpOnly; Secure; SameSite=Lax` });
  }

  // Signing out on this device.
  if (url.pathname === '/lock' || url.pathname === '/lock/') {
    return go(url, '/enter/', { 'Set-Cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });
  }

  const unlocked = password && same(readCookie(req, COOKIE), await proof(password));
  if (!unlocked) {
    if (req.method === 'GET' && PIECE.test(url.pathname) && PREVIEWERS.test(req.headers.get('user-agent') ?? '')) {
      const card = await shareCardOnly(context.next);
      if (card) return card;
    }
    return go(url, `/enter/?next=${encodeURIComponent(here)}`);
  }

  const page = await context.next();
  const res = new Response(page.body, page);
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');   // keep the unfinished site out of search engines
  if ((res.headers.get('content-type') ?? '').includes('text/html')) res.headers.set('Cache-Control', 'private, no-store');
  return res;
};

// Everything is locked except the password screen, the Guild Desk, and the files they need to look right.
export const config = {
  path: '/*',
  // The Guild Desk and members' pages stay reachable so invited members can sign in; their contents are protected by
  // their own sign-in and the database's rules, not by the site password.
  // (/og/* holds the pieces' share cards: pictures made to be seen wherever a link is shared.)
  excludedPath: ['/enter', '/enter/', '/guild/desk', '/guild/desk/', '/guild/members', '/guild/members/', '/_astro/*', '/fonts/*', '/images/*', '/og/*', '/favicon.ico', '/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png', '/apple-touch-icon-precomposed.png', '/icon-192.png', '/icon-512.png', '/manifest.webmanifest', '/robots.txt'],
};
