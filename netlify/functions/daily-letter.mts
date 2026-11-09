// Once a day, each member who has something waiting gets one quiet letter: new messages, replies in the
// forum threads they're part of, being mentioned, how their pieces were received ("This stayed with me",
// reflections), and new work from the writers they follow. Nothing waiting, no letter.
// Members turn it off on their Desk (Edit my page); the choice lives in member_prefs.
//
// Needs, in Netlify > Site configuration > Environment variables (already set for the writer emails):
//   SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, and optionally EMAIL_FROM / EMAIL_REPLY_TO.
import { createClient } from '@supabase/supabase-js';
import { letter } from './notify-writer.mts';

const SUPABASE_URL = 'https://zblgggifysohxqtgvgxs.supabase.co';
const SITE = 'https://overgrownaltar.com';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const names = (list: string[]) => { const u = [...new Set(list)]; return u.length <= 2 ? u.join(' and ') : `${u.slice(0, 2).join(', ')} and ${u.length - 2} more`; };
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async () => {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY, resend = process.env.RESEND_API_KEY;
  if (!service || !resend) return new Response('not configured', { status: 202 });
  const db = createClient(SUPABASE_URL, service, { auth: { persistSession: false } });
  const now = new Date();
  const floor = new Date(now.getTime() - 48 * 3600e3).toISOString();   // never look back further than two days

  const [{ data: people }, { data: prefs }, { data: users }] = await Promise.all([
    db.from('profiles').select('id, display_name'),
    db.from('member_prefs').select('member_id, email_digest, last_digest_at'),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const name = new Map((people ?? []).map((p: any) => [p.id, p.display_name || 'A member']));
  const pref = new Map((prefs ?? []).map((p: any) => [p.member_id, p]));
  const email = new Map((users?.users ?? []).map((u: any) => [u.id, u.email]));

  // Everything recent, read once for everyone.
  const [{ data: threads }, { data: posts }, { data: mentions }, { data: marks }, { data: refl }, { data: fresh }, { data: follows }] = await Promise.all([
    db.from('dm_threads').select('id, a, b, last_at, last_from, a_read_at, b_read_at').gt('last_at', floor),
    db.from('forum_posts').select('id, thread_id, author_id, created_at').gt('created_at', floor),
    db.from('forum_mentions').select('post_id, member_id, by_id, created_at').gt('created_at', floor),
    db.from('piece_marks').select('member_id, piece_id, created_at').gt('created_at', floor),
    db.from('piece_reflections').select('author_id, piece_id, created_at').gt('created_at', floor),
    db.from('pieces').select('id, slug, title, author_id, published_at').eq('status', 'approved').gt('published_at', floor).lte('published_at', now.toISOString()),
    db.from('follows').select('follower, followed'),
  ]);
  const threadIds = [...new Set((posts ?? []).map((p: any) => p.thread_id))];
  const [{ data: inThreads }, { data: titles }] = threadIds.length
    ? await Promise.all([
        db.from('forum_posts').select('thread_id, author_id').in('thread_id', threadIds),
        db.from('forum_threads').select('id, title').in('id', threadIds),
      ])
    : [{ data: [] as any[] }, { data: [] as any[] }];
  const title = new Map((titles ?? []).map((t: any) => [t.id, t.title]));
  const touchedIds = [...new Set([...(marks ?? []), ...(refl ?? [])].map((x: any) => x.piece_id))];
  const { data: touched } = touchedIds.length ? await db.from('pieces').select('id, title, slug, author_id').in('id', touchedIds) : { data: [] as any[] };
  const pieceOf = new Map((touched ?? []).map((p: any) => [p.id, p]));

  let sent = 0;
  for (const p of people ?? []) {
    const me = p.id, pr: any = pref.get(me);
    if (pr && pr.email_digest === false) continue;
    const to = email.get(me); if (!to) continue;
    const since = pr?.last_digest_at && pr.last_digest_at > floor ? pr.last_digest_at : new Date(now.getTime() - 24 * 3600e3).toISOString();
    const items: string[] = [];

    // Messages waiting to be read
    const unread = (threads ?? []).filter((t: any) => (t.a === me || t.b === me) && t.last_from !== me && t.last_at > since
      && t.last_at > ((t.a === me ? t.a_read_at : t.b_read_at) ?? '1970'));
    if (unread.length) items.push(`<b>${plural(unread.length, 'new message', 'new messages')}</b> from ${esc(names(unread.map((t: any) => name.get(t.last_from) ?? 'a member')))}. <a href="${SITE}/guild/members/?view=inbox" style="color:#7A3B2E;">Open your Inbox</a>`);

    // Replies in threads you're part of
    const mine = new Set((inThreads ?? []).filter((x: any) => x.author_id === me).map((x: any) => x.thread_id));
    const replies = (posts ?? []).filter((x: any) => mine.has(x.thread_id) && x.author_id !== me && x.created_at > since);
    const byThread = new Map<string, number>(); replies.forEach((x: any) => byThread.set(x.thread_id, (byThread.get(x.thread_id) ?? 0) + 1));
    for (const [t, n] of [...byThread].slice(0, 3)) items.push(`<b>${plural(n, 'new reply', 'new replies')}</b> in “${esc(title.get(t) ?? 'a conversation')}”. <a href="${SITE}/guild/members/?view=forum&t=${t}" style="color:#7A3B2E;">Read ${n === 1 ? 'it' : 'them'}</a>`);

    // Mentioned
    const named = (mentions ?? []).filter((m: any) => m.member_id === me && m.created_at > since);
    if (named.length) items.push(`<b>${esc(names(named.map((m: any) => name.get(m.by_id) ?? 'A member')))}</b> mentioned you in the forum. <a href="${SITE}/guild/members/?view=mine" style="color:#7A3B2E;">See where</a>`);

    // How your pieces were received
    const stayed = (marks ?? []).filter((m: any) => pieceOf.get(m.piece_id)?.author_id === me && m.created_at > since);
    const words = (refl ?? []).filter((r: any) => pieceOf.get(r.piece_id)?.author_id === me && r.author_id !== me && r.created_at > since);
    const link = (id: string) => `${SITE}/guild/${pieceOf.get(id)?.slug ?? ''}/`;
    if (stayed.length) items.push(`“${esc(pieceOf.get(stayed[0].piece_id)?.title ?? 'Your piece')}” stayed with <b>${plural(stayed.length, 'member', 'members')}</b> of the Guild.`);
    if (words.length) items.push(`<b>${esc(names(words.map((r: any) => name.get(r.author_id) ?? 'A member')))}</b> left ${words.length === 1 ? 'a reflection' : 'reflections'} on “${esc(pieceOf.get(words[0].piece_id)?.title ?? 'your work')}”. <a href="${link(words[0].piece_id)}" style="color:#7A3B2E;">Read ${words.length === 1 ? 'it' : 'them'}</a>`);

    // New from the writers you follow
    const followed = new Set((follows ?? []).filter((f: any) => f.follower === me).map((f: any) => f.followed));
    const newer = (fresh ?? []).filter((x: any) => followed.has(x.author_id) && x.published_at > since).slice(0, 3);
    for (const x of newer) items.push(`New from <b>${esc(name.get(x.author_id) ?? 'a writer you follow')}</b>: <a href="${SITE}/guild/${x.slug}/" style="color:#7A3B2E;">${esc(x.title)}</a>`);

    if (items.length) {
      const first = (p.display_name ?? '').split(/\s+/)[0] || 'friend';
      const list = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="text-align:left;">${items.map((i) => `<tr><td style="padding:12px 0;border-top:1px solid #E4DCCC;font-family:Georgia,'Times New Roman',serif;font-style:normal;font-size:17px;line-height:1.55;color:#2E2820;">${i}</td></tr>`).join('')}</table>`;
      const html = letter({ header: 'editor', eyebrow: 'At the table', heading: `While you were away, ${first}.`, preview: items.length === 1 ? 'Something is waiting for you at the Guild.' : `${items.length} things are waiting for you at the Guild.`,
        lines: `${list}<div style="padding-top:18px;font-size:14px;color:#7A7062;">One letter a day at most. You can turn these off from your Desk, under Edit my page.</div>`,
        button: 'Open the Guild', href: `${SITE}/guild/desk/` });
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${resend}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: process.env.EMAIL_FROM || 'Overgrown Altar <editor@overgrownaltar.com>', to: [to], subject: items.length === 1 ? 'Something is waiting at the Guild' : `${items.length} things are waiting at the Guild`, html,
          ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}) }),
      });
      if (res.ok) sent++;
      await pause(600);   // Resend's pace: no more than two a second
    }
    await db.from('member_prefs').upsert({ member_id: me, last_digest_at: now.toISOString(), ...(pr ? {} : { email_digest: true }) }, { onConflict: 'member_id' });
  }
  return new Response(`daily letters sent: ${sent}`, { status: 200 });
};

// 8:17 in the morning, Eastern (13:17 UTC; 9:17 in summer)
export const config = { schedule: '17 13 * * *' };
