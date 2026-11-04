// The lock on /private.
//
// Netlify runs this on its own servers before sending any page under /private.
// Without the right password, the private page is never sent: the visitor goes to /private-login/.
//
// The password is NOT in this code. Set it in Netlify:
//   Site configuration > Environment variables > Add a variable
//   Key: PRIVATE_PAGE_PASSWORD   Value: (your password)
// Then redeploy. Until it is set, the private page stays closed to everyone.

declare const Netlify: { env: { get(key: string): string | undefined } };

const COOKIE = 'oa_private';
const THIRTY_DAYS = 60 * 60 * 24 * 30;

// A proof of the password that is safe to keep in a cookie: it can't be turned back into the password.
async function proof(password: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode('overgrown-altar private room v1'));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Compares two strings without leaking, through timing, how much of them matched.
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const go = (url: URL, to: string, headers: Record<string, string> = {}) =>
  new Response(null, { status: 303, headers: { Location: new URL(to, url).toString(), 'Cache-Control': 'no-store', ...headers } });

function readCookie(req: Request, name: string): string {
  const raw = req.headers.get('cookie') ?? '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return '';
}

export default async (req: Request, context: { next: () => Promise<Response> }) => {
  const url = new URL(req.url);
  const password = Netlify.env.get('PRIVATE_PAGE_PASSWORD');
  if (!password) return go(url, '/private-login/?error=closed');
  const expected = await proof(password);

  // The sign-in form posts here.
  if (url.pathname === '/private/unlock' || url.pathname === '/private/unlock/') {
    if (req.method !== 'POST') return go(url, '/private-login/');
    const form = await req.formData();
    const given = String(form.get('password') ?? '');
    if (!given || !same(await proof(given), expected)) return go(url, '/private-login/?error=wrong');
    return go(url, '/private/', {
      'Set-Cookie': `${COOKIE}=${expected}; Path=/private; Max-Age=${THIRTY_DAYS}; HttpOnly; Secure; SameSite=Lax`,
    });
  }

  // "Lock this page" signs out on this device.
  if (url.pathname === '/private/lock' || url.pathname === '/private/lock/') {
    return go(url, '/', { 'Set-Cookie': `${COOKIE}=; Path=/private; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });
  }

  // Everything else under /private needs the cookie.
  if (!same(readCookie(req, COOKIE), expected)) return go(url, '/private-login/');

  const page = await context.next();
  const res = new Response(page.body, page);
  res.headers.set('Cache-Control', 'private, no-store');
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return res;
};

export const config = { path: ['/private', '/private/*'] };
