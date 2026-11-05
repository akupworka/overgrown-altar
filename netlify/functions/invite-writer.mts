// The editor's "Invite a writer" box in the Desk calls this. It checks that the caller is signed in
// as the editor, then has Supabase send its invitation (your branded "invite" template from emails/),
// and sets the new member's name so it is ready when they arrive.
//
// Needs SUPABASE_SERVICE_ROLE_KEY in Netlify > Site configuration > Environment variables.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zblgggifysohxqtgvgxs.supabase.co';
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) return json({ error: 'Inviting from the Desk isn’t switched on yet: the site needs its Supabase secret key (see HANDOFF.md).' }, 503);
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Please sign in again.' }, 401);

  const db = createClient(SUPABASE_URL, service, { auth: { persistSession: false } });
  const { data: me } = await db.auth.getUser(token);
  if (!me?.user) return json({ error: 'Please sign in again.' }, 401);
  const { data: prof } = await db.from('profiles').select('role').eq('id', me.user.id).maybeSingle();
  if (prof?.role !== 'editor') return json({ error: 'Only the editor can invite writers.' }, 403);

  let email = '', name = '';
  try { const b = await req.json(); email = String(b.email ?? '').trim().toLowerCase(); name = String(b.name ?? '').trim().slice(0, 80); } catch { return json({ error: 'Bad request' }, 400); }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'That email address doesn’t look right.' }, 400);

  const { data, error } = await db.auth.admin.inviteUserByEmail(email, { redirectTo: 'https://overgrownaltar.com/guild/desk/', data: name ? { display_name: name } : undefined });
  if (error) return json({ error: /already/i.test(error.message) ? 'That address already has a seat at the table.' : error.message }, 400);
  if (name && data?.user) await db.from('profiles').update({ display_name: name }).eq('id', data.user.id);
  return json({ ok: true, email });
};
