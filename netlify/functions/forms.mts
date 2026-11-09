// The editor's Forms room on the Desk calls this. It checks that the caller is signed in as the editor,
// then fetches what visitors have sent through the site's forms (collected by Netlify Forms):
// Guild applications, letters from the Contact page, and Dispatch sign-ups. Read only.
//
// Needs, in Netlify > Site configuration > Environment variables:
//   SUPABASE_SERVICE_ROLE_KEY   (already set, for inviting writers)
//   NETLIFY_FORMS_TOKEN         a Netlify personal access token (User settings > Applications > New access token)
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zblgggifysohxqtgvgxs.supabase.co';
const API = 'https://api.netlify.com/api/v1';
// The forms the room shows, in this order, with the names they go by on the Desk (the hidden submission alert is left out).
const ROOMS: Record<string, string> = { 'guild-application': 'Applications', contact: 'Letters', dispatches: 'Sign-ups' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const netlify = process.env.NETLIFY_FORMS_TOKEN;
  if (!netlify) return json({ error: 'The site can’t see NETLIFY_FORMS_TOKEN yet.' }, 503);
  if (!service) return json({ error: 'The site can’t see SUPABASE_SERVICE_ROLE_KEY.' }, 503);
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Please sign in again.' }, 401);

  const db = createClient(SUPABASE_URL, service, { auth: { persistSession: false } });
  const { data: me } = await db.auth.getUser(token);
  if (!me?.user) return json({ error: 'Please sign in again.' }, 401);
  const { data: prof } = await db.from('profiles').select('role').eq('id', me.user.id).maybeSingle();
  if (prof?.role !== 'editor') return json({ error: 'Only the editor can open the forms.' }, 403);

  let body: { action?: string; id?: string } = {};
  try { body = await req.json(); } catch {}
  const site = process.env.SITE_ID || 'overgrownaltar.com';
  const get = async (path: string) => {
    const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${netlify}` } });
    if (!r.ok) throw new Error(r.status === 401 ? 'Netlify didn’t accept the access key. Check NETLIFY_FORMS_TOKEN.' : `Netlify answered ${r.status}.`);
    return r.json();
  };
  // Delete one entry (after an Accept, or when the editor clears it away). Only entries from the three forms above.
  if (body.action === 'delete') {
    const id = String(body.id ?? '');
    if (!/^[a-f0-9]{24}$/i.test(id)) return json({ error: 'Bad request' }, 400);
    try {
      const sub = await get(`/submissions/${id}`);
      if (!(sub?.form_name in ROOMS)) return json({ error: 'That entry isn’t one of the site’s forms.' }, 400);
      const r = await fetch(`${API}/submissions/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${netlify}` } });
      if (!r.ok && r.status !== 404) return json({ error: `Netlify couldn’t delete it (${r.status}).` }, 502);
      return json({ ok: true });
    } catch (e) { return json({ error: (e as Error).message }, 502); }
  }
  try {
    const forms: { id: string; name: string; submission_count?: number }[] = await get(`/sites/${encodeURIComponent(site)}/forms`);
    const wanted = forms.filter((f) => f.name in ROOMS).sort((a, b) => Object.keys(ROOMS).indexOf(a.name) - Object.keys(ROOMS).indexOf(b.name));
    const rooms = await Promise.all(wanted.map(async (f) => {
      const subs: any[] = await get(`/forms/${f.id}/submissions?per_page=100`);
      return {
        key: f.name, label: ROOMS[f.name], count: f.submission_count ?? subs.length,
        items: subs.map((s) => {
          const d = (s.data ?? {}) as Record<string, unknown>;
          // Every field the visitor filled in, minus Netlify's own bookkeeping and the spam trap.
          const fields = Object.entries(d)
            .filter(([k, v]) => !['ip', 'user_agent', 'referrer', 'company', 'form-name', 'bot-field'].includes(k) && v != null && String(v).trim() !== '')
            .map(([k, v]) => [k, String(v).slice(0, 4000)]);
          return { id: s.id, at: s.created_at, name: s.name || String(d.name ?? ''), email: s.email || String(d.email ?? ''), fields };
        }),
      };
    }));
    return json({ rooms });
  } catch (e) {
    return json({ error: (e as Error).message || 'The forms couldn’t be fetched.' }, 502);
  }
};
