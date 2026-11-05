// Called by Supabase when the editor approves, returns or declines a submitted piece.
// It emails the writer the decision (and the editor's note), in the house style, through Resend.
//
// Needs, in Netlify > Site configuration > Environment variables:
//   SUPABASE_SERVICE_ROLE_KEY  (Supabase > Project Settings > API keys > secret key) to read the writer's address
//   RESEND_API_KEY             (resend.com > API Keys) to send the email
//   EMAIL_FROM                 optional, e.g. "Overgrown Altar <editor@overgrownaltar.com>" (a domain verified in Resend)
// Without them it does nothing, quietly.
//
// It only ever writes to the piece's own author, only about a decision made in the last ten minutes,
// and only once per decision (pieces.writer_notified), so calling it by hand can't be used to send anything else.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zblgggifysohxqtgvgxs.supabase.co';
const SITE = 'https://overgrownaltar.com';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function letter({ eyebrow, heading, lines, note, button, href, preview }: { eyebrow: string; heading: string; lines: string; note?: string; button: string; href: string; preview: string }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Overgrown Altar</title></head>
<body style="margin:0;padding:0;background:#0A0C0A;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preview)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#0A0C0A;"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#12150F;border:1px solid #3A3A2C;border-radius:6px;">
<tr><td style="height:3px;line-height:3px;font-size:0;background:linear-gradient(90deg,#3E7BFF,#B05BFF,#FF3B4E,#FFC44D,#3DE0A0);border-radius:6px 6px 0 0;">&nbsp;</td></tr>
<tr><td align="center" style="padding:44px 40px 8px 40px;"><img src="${SITE}/apple-touch-icon.png" width="56" height="56" alt="Overgrown Altar" style="display:block;border:0;border-radius:12px;"></td></tr>
<tr><td align="center" style="padding:22px 40px 0 40px;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:5px;text-transform:uppercase;color:#FFE3A3;">${esc(eyebrow)}</td></tr>
<tr><td align="center" style="padding:14px 40px 0 40px;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.15;color:#F3ECDC;">${esc(heading)}</td></tr>
<tr><td align="center" style="padding:18px 44px 0 44px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:19px;line-height:1.55;color:#CFC8B8;">${lines}</td></tr>
${note ? `<tr><td style="padding:26px 44px 0 44px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-left:2px solid #D2A23A;"><tr><td style="padding:4px 0 4px 18px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#8C8679;">The editor&rsquo;s note</td></tr><tr><td style="padding:6px 0 4px 18px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.55;color:#E6DFD0;white-space:pre-wrap;">${esc(note)}</td></tr></table></td></tr>` : ''}
<tr><td align="center" style="padding:34px 40px 40px 40px;"><a href="${href}" style="display:inline-block;background:#F3ECDC;color:#12160F;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:3px;text-transform:uppercase;padding:17px 34px;border-radius:2px;">${esc(button)} &rarr;</a></td></tr>
</table>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;"><tr><td align="center" style="padding:26px 20px 0 20px;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;color:#8C8679;">We light the signal fires on the perimeter.</td></tr>
<tr><td align="center" style="padding:10px 20px 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#5E5A50;">Overgrown Altar &middot; overgrownaltar.com</td></tr></table>
</td></tr></table></body></html>`;
}

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY, resend = process.env.RESEND_API_KEY;
  if (!service || !resend) return new Response('not configured', { status: 202 });
  let id = '';
  try { id = String((await req.json()).piece_id ?? ''); } catch { return new Response('Bad request', { status: 400 }); }
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Bad request', { status: 400 });

  const db = createClient(SUPABASE_URL, service, { auth: { persistSession: false } });
  const { data: p } = await db.from('pieces').select('id, title, slug, status, editor_note, author_id, updated_at, writer_notified').eq('id', id).maybeSingle();
  if (!p || !['approved', 'returned', 'declined'].includes(p.status)) return new Response('nothing to send', { status: 200 });
  if (p.writer_notified === p.status) return new Response('already sent', { status: 200 });
  if (Date.now() - Date.parse(p.updated_at) > 10 * 60 * 1000) return new Response('too old', { status: 200 });

  const [{ data: who }, { data: prof }] = await Promise.all([
    db.auth.admin.getUserById(p.author_id),
    db.from('profiles').select('display_name').eq('id', p.author_id).maybeSingle(),
  ]);
  const to = who?.user?.email;
  if (!to) return new Response('no address', { status: 200 });
  const first = (prof?.display_name ?? '').split(/\s+/)[0] || 'friend';
  const title = p.title || 'your piece';
  const mail = p.status === 'approved'
    ? { subject: `Published: ${title}`, html: letter({ eyebrow: 'Published', heading: 'It is on the altar.', preview: `${title} is now published at Overgrown Altar.`,
        lines: `${esc(first)}, the editor has read <b style="color:#F3ECDC;font-weight:normal;">${esc(title)}</b> and published it. Thank you for bringing it to the table.`,
        button: 'Read it on the site', href: `${SITE}/guild/${p.slug}/` }) }
    : p.status === 'returned'
    ? { subject: `A note from the editor: ${title}`, html: letter({ eyebrow: 'Returned with a note', heading: 'Nearly there.', preview: `The editor has read ${title} and sent it back with a note.`,
        lines: `${esc(first)}, the editor has read <b style="color:#F3ECDC;font-weight:normal;">${esc(title)}</b> and sent it back to your Desk with a note. Sharpen it, and send it again when it is ready.`,
        note: p.editor_note || undefined, button: 'Open your Desk', href: `${SITE}/guild/desk/` }) }
    : { subject: `About your piece: ${title}`, html: letter({ eyebrow: 'From the editor', heading: 'Not this one.', preview: `The editor has read ${title}.`,
        lines: `${esc(first)}, thank you for sending <b style="color:#F3ECDC;font-weight:normal;">${esc(title)}</b>. The editor has read it, and it is not one for the altar. Keep writing; the table is still yours.`,
        note: p.editor_note || undefined, button: 'Open your Desk', href: `${SITE}/guild/desk/` }) };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Overgrown Altar <editor@overgrownaltar.com>', to: [to], subject: mail.subject, html: mail.html }),
  });
  if (!res.ok) return new Response('send failed: ' + (await res.text()).slice(0, 200), { status: 502 });
  await db.from('pieces').update({ writer_notified: p.status }).eq('id', p.id);
  return new Response('sent', { status: 200 });
};
