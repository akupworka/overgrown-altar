// Called by Supabase when a member sends a piece to the editor.
// It files a "submission-alert" form on the site, which Netlify emails to the editor
// (Netlify > Forms > Form notifications, form "submission-alert").
export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  let data: { title?: string; author?: string; standfirst?: string } = {};
  try { data = await req.json(); } catch { return new Response('Bad request', { status: 400 }); }
  const clip = (s: unknown, n: number) => String(s ?? '').slice(0, n);
  const site = process.env.URL || 'https://overgrownaltar.com';
  const body = new URLSearchParams({
    'form-name': 'submission-alert',
    title: clip(data.title, 200) || 'Untitled',
    author: clip(data.author, 120),
    standfirst: clip(data.standfirst, 400),
    review: `${site}/guild/desk/`,
  });
  const res = await fetch(`${site}/enter/`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  return new Response(res.ok ? 'ok' : 'form not accepted', { status: res.ok ? 200 : 502 });
};
