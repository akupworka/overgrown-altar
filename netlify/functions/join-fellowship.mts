// "Join the Fellowship" on /fellowship/ calls this. Anyone may join: it makes their account (as the Fellowship,
// not the Guild), then sends our own welcome letter with a link to choose a password and open their Desk.
// (Supabase's own invitation email is written for Guild writers, so it isn't used here.)
//
// Needs SUPABASE_SERVICE_ROLE_KEY and RESEND_API_KEY (already set for the other emails); EMAIL_FROM optional.
import { createClient } from '@supabase/supabase-js';
import { letter } from './notify-writer.mts';

const SUPABASE_URL = 'https://zblgggifysohxqtgvgxs.supabase.co';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY, resend = process.env.RESEND_API_KEY;
  if (!service || !resend) return json({ error: 'Joining isn’t open just yet. Please try again soon.' }, 503);
  let email = '', name = '', trap = '', since = 0;
  try {
    const b = await req.json();
    email = String(b.email ?? '').trim().toLowerCase(); name = String(b.name ?? '').trim().slice(0, 80);
    trap = String(b.website ?? ''); since = Number(b.since ?? 0);
  } catch { return json({ error: 'Bad request' }, 400); }
  // Quiet guards against machines: a hidden field people never fill, and a form filled faster than a person can.
  if (trap || (since && Date.now() - since < 2500)) return json({ ok: true, email });
  if (!name) return json({ error: 'Please tell us your name.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'That email address doesn’t look right.' }, 400);

  const db = createClient(SUPABASE_URL, service, { auth: { persistSession: false } });
  // An editor's name can't be taken (the form says so as it is typed; this holds the same line).
  const { data: taken } = await db.rpc('name_taken', { n: name });
  if (taken === true) return json({ error: 'That name is taken. Please choose another.' }, 400);
  const { data, error } = await db.auth.admin.generateLink({
    type: 'invite', email,
    options: { redirectTo: 'https://overgrownaltar.com/guild/desk/', data: { display_name: name, tier: 'fellow' } },
  });
  if (error) return json({ error: /already|registered|exists/i.test(error.message) ? 'That address already has an account. Sign in from the Desk, or reset your password there.' : 'Something went wrong. Please try again.' }, 400);
  const link = data?.properties?.action_link;
  if (!link) return json({ error: 'Something went wrong. Please try again.' }, 500);

  const first = name.split(/\s+/)[0];
  const html = letter({
    header: 'editor', eyebrow: 'The Fellowship', heading: 'Welcome to the Fellowship.', preview: 'Choose a password to take your place in the Fellowship.',
    lines: `${esc(first)}, there is a place for you among us. Choose a password to open your Desk: from there you can keep a collection of the work and photographs you love, write to the members of the Guild, and join the conversation in the Forum.`,
    button: 'Choose your password', href: link,
  });
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Overgrown Altar <editor@overgrownaltar.com>', to: [email], subject: 'Welcome to the Fellowship', html,
      ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}) }),
  });
  if (!res.ok) return json({ error: 'Your account is ready, but the welcome email didn’t send. Use “Forgot your password?” on the Desk to get in.' }, 502);
  return json({ ok: true, email });
};
