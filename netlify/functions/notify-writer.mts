// Called by Supabase when the editor approves, returns or declines a submitted piece.
// It emails the writer the decision (and the editor's note), in the house style, through Resend.
//
// Needs, in Netlify > Site configuration > Environment variables:
//   SUPABASE_SERVICE_ROLE_KEY  (Supabase > Project Settings > API keys > secret key) to read the writer's address
//   RESEND_API_KEY             (resend.com > API Keys) to send the email
//   EMAIL_FROM                 optional, e.g. "Overgrown Altar <editor@overgrownaltar.com>" (any address at the domain verified
//                              in Resend; it needn't be a real inbox)
//   EMAIL_REPLY_TO             optional, a real inbox (e.g. your Gmail) where writers' replies should land
// Without them it does nothing, quietly.
//
// It only ever writes to the piece's own author, only about a decision made in the last ten minutes,
// and only once per decision (pieces.writer_notified), so calling it by hand can't be used to send anything else.
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zblgggifysohxqtgvgxs.supabase.co';
const SITE = 'https://overgrownaltar.com';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// The same frame as the account emails (emails/build.py): a paper-light letter from top to bottom, the wordmark in ink,
// no dark band and no pictures. It is told to stay light where a mail app lets a sender say so.
const STYLE = '<style>:root{color-scheme:light only;supported-color-schemes:light only;}'
  + '@media (prefers-color-scheme:dark){.oa-page{background:#F4EFE6 !important;}.oa-card{background:#FCFAF5 !important;}.oa-box{background:#F3EDE1 !important;}'
  + '.oa-ink{color:#1F1A14 !important;}.oa-soft{color:#4A4236 !important;}.oa-mute{color:#7A7062 !important;}.oa-ox{color:#7A3B2E !important;}.oa-brass{color:#9A7B2E !important;}'
  + '.oa-btn{background:#1F1A14 !important;color:#FCFAF5 !important;}}'
  + '[data-ogsb] .oa-page{background-color:#F4EFE6 !important;}[data-ogsb] .oa-card{background-color:#FCFAF5 !important;}[data-ogsb] .oa-box{background-color:#F3EDE1 !important;}[data-ogsb] .oa-btn{background-color:#1F1A14 !important;}'
  + '[data-ogsc] .oa-ink{color:#1F1A14 !important;}[data-ogsc] .oa-soft{color:#4A4236 !important;}[data-ogsc] .oa-mute{color:#7A7062 !important;}[data-ogsc] .oa-ox{color:#7A3B2E !important;}[data-ogsc] .oa-brass{color:#9A7B2E !important;}[data-ogsc] .oa-btn{color:#FCFAF5 !important;}'
  + '</style>';
const SERIF = "Georgia,'Times New Roman',serif", SANS = 'Arial,Helvetica,sans-serif';
// The same letter in plain words, sent beside the designed one: mail services trust a letter more when it carries both.
export function plain(html: string): string {
  return html
    .replace(/<head[\s\S]*?<\/head>/i, '').replace(/<div style="display:none[\s\S]*?<\/div>/i, '')
    .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, t: string) => `${t.replace(/<[^>]+>/g, '').replace(/&nbsp;&rarr;/g, '').trim()}: ${href}`)
    .replace(/<\/(td|tr|div|p|table)>/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&middot;/g, '·').replace(/&rarr;/g, '').replace(/&rsquo;/g, '’').replace(/&#8224;/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter((l, i, a) => l || (a[i - 1] ?? '') !== '').join('\n')
    .replace(/OVERGROWN\n+Altar/, 'Overgrown Altar').trim();
}
export function letter({ header, eyebrow, heading, lines, note, button, href, preview }: { header: 'published' | 'editor'; eyebrow: string; heading: string; lines: string; note?: string; button: string; href: string; preview: string }) {
  const noteHtml = note ? `
          <tr><td style="padding:30px 44px 0 44px;">
            <table role="presentation" class="oa-box" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#F3EDE1" style="background:#F3EDE1;border:1px solid #E2D9C8;border-left:3px solid #9A7B2E;border-radius:6px;">
              <tr><td style="padding:20px 22px;">
                <div class="oa-mute" style="font-family:${SANS};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#7A7062;padding-bottom:10px;">The editor&rsquo;s note</div>
                <div class="oa-ink" style="font-family:${SERIF};font-size:17px;line-height:1.6;color:#2E2820;white-space:pre-wrap;">${esc(note)}</div>
              </td></tr>
            </table>
          </td></tr>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><meta name="supported-color-schemes" content="light only">${STYLE}<title>Overgrown Altar</title></head>
<body class="oa-page" style="margin:0;padding:0;background:#F4EFE6;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preview)}</div>
  <table role="presentation" class="oa-page" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#F4EFE6" style="background:#F4EFE6;">
    <tr><td align="center" style="padding:38px 12px 40px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
        <tr><td align="center" style="padding:0 20px 26px 20px;">
          <div class="oa-brass" style="font-family:${SERIF};font-size:20px;line-height:1;color:#9A7B2E;">&#8224;</div>
          <div class="oa-ink" style="padding-top:12px;font-family:${SERIF};font-size:24px;line-height:1;letter-spacing:8px;color:#1F1A14;">OVERGROWN</div>
          <div class="oa-ox" style="padding-top:3px;font-family:${SERIF};font-style:italic;font-size:30px;line-height:1.1;color:#7A3B2E;">Altar</div>
          <div class="oa-mute" style="padding-top:14px;font-family:${SANS};font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#7A7062;">${header === 'published' ? 'Published' : 'From the editor'}</div>
        </td></tr>
      </table>
      <table role="presentation" class="oa-card" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#FCFAF5" style="max-width:560px;background:#FCFAF5;border:1px solid #E2D9C8;border-radius:10px;overflow:hidden;">
        <tr><td style="height:3px;line-height:3px;font-size:0;background:#B8A05E;">&nbsp;</td></tr>
        <tr><td><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr><td align="center" class="oa-ox" style="padding:38px 44px 0 44px;font-family:${SERIF};font-size:12px;letter-spacing:5px;text-transform:uppercase;color:#7A3B2E;">${esc(eyebrow)}</td></tr>
          <tr><td align="center" class="oa-ink" style="padding:14px 40px 0 40px;font-family:${SERIF};font-size:38px;line-height:1.1;color:#1F1A14;">${esc(heading)}</td></tr>
          <tr><td align="center" class="oa-soft" style="padding:18px 48px 0 48px;font-family:${SERIF};font-style:italic;font-size:19px;line-height:1.6;color:#4A4236;">${lines}</td></tr>${noteHtml}
          <tr><td align="center" style="padding:32px 44px 40px 44px;">
            <a href="${href}" class="oa-btn" style="display:inline-block;background:#1F1A14;color:#FCFAF5;text-decoration:none;font-family:${SANS};font-size:13px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;padding:18px 36px;border-radius:3px;">${esc(button)}&nbsp;&rarr;</a>
          </td></tr>
        </table></td></tr>
      </table>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
        <tr><td align="center" class="oa-mute" style="padding:26px 20px 0 20px;font-family:${SERIF};font-style:italic;font-size:15px;color:#7A7062;">We light the signal fires on the perimeter.</td></tr>
        <tr><td align="center" style="padding:12px 8px 0 8px;font-family:${SANS};font-size:10px;letter-spacing:1px;text-transform:uppercase;">
          <a href="${SITE}" class="oa-mute" style="color:#7A7062;text-decoration:none;">overgrownaltar.com</a><span style="color:#B8AE9C;">&nbsp;&middot;&nbsp;</span><a href="${SITE}/guild/desk/" class="oa-mute" style="color:#7A7062;text-decoration:none;">Your Desk</a><span style="color:#B8AE9C;">&nbsp;&middot;&nbsp;</span><a href="${SITE}/guild/members/?view=forum" class="oa-mute" style="color:#7A7062;text-decoration:none;">The Forum</a>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY, resend = process.env.RESEND_API_KEY;
  if (!service || !resend) return new Response('not configured', { status: 202 });
  let id = '', kind = '';
  try { const b = await req.json(); id = String(b.piece_id ?? ''); kind = String(b.kind ?? ''); } catch { return new Response('Bad request', { status: 400 }); }
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response('Bad request', { status: 400 });

  const db = createClient(SUPABASE_URL, service, { auth: { persistSession: false } });
  const { data: p } = await db.from('pieces').select('id, title, slug, status, editor_note, author_id, updated_at, writer_notified, published_at').eq('id', id).maybeSingle();
  if (!p || !['approved', 'returned', 'declined'].includes(p.status)) return new Response('nothing to send', { status: 200 });
  // "Ask for changes" on a published piece: the editor's note goes to the writer, once for each asking.
  let ask: { note: string; asked_at: string } | null = null;
  if (kind === 'changes') {
    const { data: r } = await db.from('piece_change_requests').select('note, asked_at').eq('piece_id', id).maybeSingle();
    if (!r || p.status !== 'approved') return new Response('nothing to send', { status: 200 });
    if (p.writer_notified === 'changes:' + r.asked_at) return new Response('already sent', { status: 200 });
    if (Date.now() - Date.parse(r.asked_at) > 10 * 60 * 1000) return new Response('too old', { status: 200 });
    ask = r as any;
  } else {
    if (p.writer_notified === p.status) return new Response('already sent', { status: 200 });
    if (Date.now() - Date.parse(p.updated_at) > 10 * 60 * 1000) return new Response('too old', { status: 200 });
  }
  const told = ask ? 'changes:' + ask.asked_at : p.status;

  const [{ data: who }, { data: prof }] = await Promise.all([
    db.auth.admin.getUserById(p.author_id),
    db.from('profiles').select('display_name').eq('id', p.author_id).maybeSingle(),
  ]);
  const to = who?.user?.email;
  if (!to) return new Response('no address', { status: 200 });
  // Pretend members (the sample accounts) have no real address: mark the decision as told, and send nothing.
  if (/@sample\.overgrownaltar\.com$/i.test(to)) { await db.from('pieces').update({ writer_notified: told }).eq('id', p.id); return new Response('sample member: nothing sent', { status: 200 }); }
  const first = (prof?.display_name ?? '').split(/\s+/)[0] || 'friend';
  const title = p.title || 'your piece';
  // Approved for a later date: the writer hears when it will go live.
  const later = p.status === 'approved' && p.published_at && Date.parse(p.published_at) > Date.now() + 5 * 60 * 1000;
  const when = later ? new Date(p.published_at).toLocaleString('en-US', { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short' }) : '';
  const mail = ask
    ? { subject: `A note from the editor: ${title}`, html: letter({ header: 'editor', eyebrow: 'A change, please', heading: 'One more pass.', preview: `The editor asks for a change to ${title}.`,
        lines: `${esc(first)}, the editor has read <span class="oa-ink" style="color:#1F1A14;font-style:normal;">${esc(title)}</span> again and asks for a change. It stays on the site as it is while you work. Open your Desk, make the change, and send it back.`,
        note: ask.note || undefined, button: 'Open your Desk', href: `${SITE}/guild/desk/` }) }
    : later
    ? { subject: `Accepted: ${title}`, html: letter({ header: 'published', eyebrow: 'Accepted', heading: 'It has a date.', preview: `${title} goes live ${when}.`,
        lines: `${esc(first)}, the editor has read <span class="oa-ink" style="color:#1F1A14;font-style:normal;">${esc(title)}</span> and set it to go live on ${esc(when)}. Thank you for bringing it to the table.`,
        button: 'Open your Desk', href: `${SITE}/guild/desk/` }) }
    : p.status === 'approved'
    ? { subject: `Published: ${title}`, html: letter({ header: 'published', eyebrow: 'Published', heading: 'It is on the altar.', preview: `${title} is now published at Overgrown Altar.`,
        lines: `${esc(first)}, the editor has read <span class="oa-ink" style="color:#1F1A14;font-style:normal;">${esc(title)}</span> and published it. Thank you for bringing it to the table.`,
        button: 'Read it on the site', href: `${SITE}/guild/${p.slug}/` }) }
    : p.status === 'returned'
    ? { subject: `A note from the editor: ${title}`, html: letter({ header: 'editor', eyebrow: 'Returned with a note', heading: 'Nearly there.', preview: `The editor has read ${title} and sent it back with a note.`,
        lines: `${esc(first)}, the editor has read <span class="oa-ink" style="color:#1F1A14;font-style:normal;">${esc(title)}</span> and sent it back to your Desk with a note. Sharpen it, and send it again when it is ready.`,
        note: p.editor_note || undefined, button: 'Open your Desk', href: `${SITE}/guild/desk/` }) }
    : { subject: `About your piece: ${title}`, html: letter({ header: 'editor', eyebrow: 'From the editor', heading: 'Not this one.', preview: `The editor has read ${title}.`,
        lines: `${esc(first)}, thank you for sending <span class="oa-ink" style="color:#1F1A14;font-style:normal;">${esc(title)}</span>. The editor has read it, and it is not one for the altar. Keep writing; the table is still yours.`,
        note: p.editor_note || undefined, button: 'Open your Desk', href: `${SITE}/guild/desk/` }) };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'Overgrown Altar <editor@overgrownaltar.com>', to: [to], subject: mail.subject, html: mail.html, text: plain(mail.html),
      ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
    }),
  });
  if (!res.ok) return new Response('send failed: ' + (await res.text()).slice(0, 200), { status: 502 });
  await db.from('pieces').update({ writer_notified: told }).eq('id', p.id);
  return new Response('sent', { status: 200 });
};
