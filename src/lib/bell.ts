// The bell in the header: what has happened around you (mentions, replies in your threads, reflections, "stayed with
// me", saves, new followers, your pieces published or returned). Read from the database's bell(); nothing is stored
// but when you last looked. Like things about one piece are gathered into a line ("Ruth and 3 others…").
import type { SupabaseClient } from '@supabase/supabase-js';
import { portraitUrl } from './supabase';

interface Item { kind: string; at: string; who: string | null; who_name: string | null; who_portrait: string | null; piece: string | null; piece_title: string | null; piece_slug: string | null; thread: string | null; thread_title: string | null }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const ago = (d: string) => { const m = Math.max(1, Math.round((Date.now() - +new Date(d)) / 6e4)); return m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : m < 43200 ? `${Math.round(m / 1440)} d` : new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };

function gather(items: Item[]) {
  // one line per (kind, piece or thread or person), newest first, remembering everyone in it
  const rows: { key: string; first: Item; names: string[] }[] = [];
  for (const i of items) {
    const key = `${i.kind}|${i.piece ?? i.thread ?? i.who ?? ''}`;
    const row = rows.find((r) => r.key === key);
    const name = i.who_name || 'A member';
    if (row) { if (i.who && !row.names.includes(name)) row.names.push(name); } else rows.push({ key, first: i, names: i.who ? [name] : [] });
  }
  return rows;
}
function line(r: { first: Item; names: string[] }): { html: string; href: string } {
  const i = r.first, who = `<b>${esc(r.names[0] ?? 'A member')}</b>${r.names.length > 1 ? ` and ${r.names.length - 1} ${r.names.length === 2 ? 'other' : 'others'}` : ''}`;
  const piece = `“${esc(i.piece_title || 'Untitled')}”`, thread = `“${esc(i.thread_title || 'a thread')}”`;
  const pieceUrl = i.piece_slug ? `/guild/${i.piece_slug}/` : `/guild/members/?p=${i.piece}`;
  switch (i.kind) {
    case 'mention': return { html: `${who} mentioned you in ${thread}`, href: `/guild/members/?t=${i.thread}` };
    case 'reply': return { html: `${who} replied in ${thread}`, href: `/guild/members/?t=${i.thread}` };
    case 'reflection': return { html: `${who} left a reflection on ${piece}`, href: pieceUrl };
    case 'mark': return { html: `${piece} stayed with ${who}`, href: pieceUrl };
    case 'save': return { html: `${who} saved ${piece}`, href: pieceUrl };
    case 'follow': return { html: `${who} now ${r.names.length > 1 ? 'follow' : 'follows'} you`, href: `/guild/members/?m=${i.who}` };
    case 'published': return { html: `${piece} is published`, href: pieceUrl };
    case 'returned': return { html: `${piece} came back with a note from the editor`, href: '/guild/desk/' };
    default: return { html: 'Something new', href: '/guild/desk/' };
  }
}
const ICON: Record<string, string> = {
  mention: 'M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z', reply: 'M4 5h16v11H9l-5 4z',
  reflection: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4', mark: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', save: 'M6 3.5h12v17l-6-4.2-6 4.2z',
  follow: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1-3.5 4-5 8-5s7 1.5 8 5', published: 'M5 12.5l4.5 4.5L19 7.5', returned: 'M9 14l-5-5 5-5M4 9h10a6 6 0 0 1 0 12h-3',
};

export function initBell(supabase: SupabaseClient) {
  const btn = document.querySelector<HTMLButtonElement>('[data-bell]'), panel = document.querySelector<HTMLElement>('[data-bell-panel]'), badge = document.querySelector<HTMLElement>('[data-bell-n]');
  if (!btn || !panel || !badge) return;
  let items: Item[] = [], seen = '';
  const count = () => { const n = gather(items.filter((i) => !seen || i.at > seen)).length; badge.hidden = n === 0; badge.textContent = n > 9 ? '9+' : String(n); return n; };
  const load = async () => {
    const { data } = await supabase.rpc('bell');
    items = (data?.items ?? []) as Item[]; seen = data?.seen ?? ''; count();
  };
  const draw = () => {
    const rows = gather(items);
    panel.innerHTML = `<div class="bell-head"><span class="eb">Notifications</span><span class="lab mut">The last 30 days</span></div>` + (rows.length ? `<ol class="bell-list">${rows.slice(0, 30).map((r) => {
      const l = line(r), fresh = !seen || r.first.at > seen, face = r.first.who ? portraitUrl(r.first.who_portrait) : '';
      return `<li><a href="${l.href}" class="bell-row${fresh ? ' fresh' : ''}"><span class="bell-ic">${face ? `<img src="${esc(face)}" alt="">` : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[r.first.kind] ?? ICON.published}"/></svg>`}</span><span class="bell-t"><span class="bell-line">${l.html}</span><span class="lab bell-when">${ago(r.first.at)}</span></span></a></li>`;
    }).join('')}</ol>` : `<p class="it bell-none">Nothing yet. When someone mentions you, follows you, or answers your work, it shows here.</p>`);
  };
  const close = () => { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!panel.hidden) return close();
    draw(); panel.hidden = false; btn.setAttribute('aria-expanded', 'true');
    if (count()) { await supabase.rpc('bell_seen'); badge.hidden = true; setTimeout(() => { seen = new Date().toISOString(); }, 0); }
  });
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target as Node)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  load();
  addEventListener('visibilitychange', () => { if (!document.hidden && panel.hidden) load(); });
}
