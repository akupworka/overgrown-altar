// The bell in the header: what has happened around you (mentions, replies in your threads, reflections, "stayed with
// me", saves, new followers, your pieces published or returned). Read from the database's bell(); nothing is stored
// but when you last looked and what you cleared. Like things about one piece are gathered into a line ("Ruth and 3 others…").
// A tick on a line clears it; "Clear all" empties the bell. A cleared line comes back only if something new happens there.
import type { SupabaseClient } from '@supabase/supabase-js';
import { portraitUrl } from './supabase';

interface Item { kind: string; at: string; n?: number; who: string | null; who_name: string | null; who_portrait: string | null; piece: string | null; piece_title: string | null; piece_slug: string | null; thread: string | null; thread_title: string | null }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const ago = (d: string) => { const m = Math.max(1, Math.round((Date.now() - +new Date(d)) / 6e4)); return m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : m < 43200 ? `${Math.round(m / 1440)} d` : new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };

// The database gathers like things into one line each (kind + piece / thread; all new followers together): `n` people, newest named.
const gather = (items: Item[]) => items.map((i) => ({ first: i, names: i.who ? [i.who_name || 'A member'] : [], n: Math.max(1, i.n ?? 1) }));
function line(r: { first: Item; names: string[]; n: number }): { html: string; href: string } {
  const i = r.first, who = `<b>${esc(r.names[0] ?? 'A member')}</b>${r.n > 1 ? ` and ${r.n - 1} ${r.n === 2 ? 'other' : 'others'}` : ''}`;
  const piece = `“${esc(i.piece_title || 'Untitled')}”`, thread = `“${esc(i.thread_title || 'a thread')}”`;
  const pieceUrl = i.piece_slug ? `/guild/${i.piece_slug}/` : `/guild/members/?p=${i.piece}`;
  switch (i.kind) {
    case 'mention': return { html: `${who} mentioned you in ${thread}`, href: `/guild/members/?t=${i.thread}` };
    case 'reply': return { html: `${who} replied in ${thread}`, href: `/guild/members/?t=${i.thread}` };
    case 'reflection': return { html: `${who} left a reflection on ${piece}`, href: pieceUrl };
    case 'mark': return { html: `${piece} stayed with ${who}`, href: pieceUrl };
    case 'save': return { html: `${who} saved ${piece} to ${r.n > 1 ? 'their libraries' : 'their library'}`, href: pieceUrl };
    case 'follow': return { html: `${who} now ${r.n > 1 ? 'follow' : 'follows'} you`, href: `/guild/members/?m=${i.who}` };
    case 'published': return { html: `${piece} is published`, href: pieceUrl };
    case 'returned': return { html: `${piece} came back with a note from the editor`, href: '/guild/desk/' };
    default: return { html: 'Something new', href: '/guild/desk/' };
  }
}
/** How the database names a line when it is cleared: its kind and the piece or thread it is about. */
const keyOf = (i: Item) => `${i.kind}:${i.piece ?? i.thread ?? ''}`;
const ICON: Record<string, string> = {
  mention: 'M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z', reply: 'M4 5h16v11H9l-5 4z',
  reflection: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4', mark: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z', save: 'M6 3.5h12v17l-6-4.2-6 4.2z',
  follow: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20c1-3.5 4-5 8-5s7 1.5 8 5', published: 'M5 12.5l4.5 4.5L19 7.5', returned: 'M9 14l-5-5 5-5M4 9h10a6 6 0 0 1 0 12h-3',
};

export function initBell(supabase: SupabaseClient) {
  const btn = document.querySelector<HTMLButtonElement>('[data-bell]'), panel = document.querySelector<HTMLElement>('[data-bell-panel]'), badge = document.querySelector<HTMLElement>('[data-bell-n]');
  if (!btn || !panel || !badge) return;
  let items: Item[] = [], seen = '', cleared = false;
  // The number on the bell is what has not been cleared yet (it stays until each line is ticked away, or all are cleared).
  const count = () => { const n = gather(items).length; badge.hidden = n === 0; badge.textContent = n > 99 ? '99+' : String(n); return n; };
  const fresh = () => items.some((i) => !seen || i.at > seen);
  const load = async () => {
    const { data } = await supabase.rpc('bell');
    items = (data?.items ?? []) as Item[]; seen = data?.seen ?? ''; count();
  };
  const draw = () => {
    const rows = gather(items);
    panel.innerHTML = `<div class="bell-head"><span class="eb">Notifications</span>${rows.length ? `<button type="button" class="lab bell-all" data-bell-all>Clear all</button>` : `<span class="lab mut">The last 30 days</span>`}</div>` + (rows.length ? `<ol class="bell-list">${rows.slice(0, 30).map((r) => {
      const l = line(r), fresh = !seen || r.first.at > seen, face = r.first.who ? portraitUrl(r.first.who_portrait) : '';
      return `<li data-key="${esc(keyOf(r.first))}"><a href="${l.href}" class="bell-row${fresh ? ' fresh' : ''}"><span class="bell-ic">${face ? `<img src="${esc(face)}" alt="">` : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON[r.first.kind] ?? ICON.published}"/></svg>`}</span><span class="bell-t"><span class="bell-line">${l.html}</span><span class="lab bell-when">${ago(r.first.at)}</span></span></a><button type="button" class="bell-done" data-bell-done aria-label="Clear this notification" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button></li>`;
    }).join('')}</ol>` : `<p class="it bell-none">${cleared ? 'All clear. New things will show here as they happen.' : 'Nothing yet. When someone mentions you, follows you, or answers your work, it shows here.'}</p>`);
  };
  const close = () => { panel.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!panel.hidden) return close();
    draw(); panel.hidden = false; btn.setAttribute('aria-expanded', 'true');
    if (fresh()) { await supabase.rpc('bell_seen'); setTimeout(() => { seen = new Date().toISOString(); }, 0); }   // opened: nothing is "new" any more, but the number stays
  });
  // Clearing: one line by its tick, or everything. The panel stays open; the line slips away.
  panel.addEventListener('click', (e) => {
    const t = e.target as HTMLElement, all = t.closest('[data-bell-all]'), yes = t.closest('[data-bell-yes]'), no = t.closest('[data-bell-no]'), one = t.closest('[data-bell-done]');
    if (!all && !yes && !no && !one) return;
    e.preventDefault(); e.stopPropagation();
    // "Clear all" asks once, in place, before it empties the bell.
    if (all) { all.outerHTML = `<span class="bell-sure"><span class="lab">Clear all?</span><button type="button" class="lab bell-all bell-yes" data-bell-yes>Yes</button><button type="button" class="lab bell-all bell-no" data-bell-no>No</button></span>`; return; }
    if (no) { draw(); return; }
    if (yes) { items = []; count(); cleared = true; draw(); supabase.rpc('bell_clear').then(() => {}); return; }
    const li = one!.closest('li'), key = li?.dataset.key;
    if (!li || key == null) return;
    items = items.filter((i) => keyOf(i) !== key); count();
    cleared = true; supabase.rpc('bell_clear', { p_key: key }).then(() => {});   // a query is only sent once it is awaited
    li.classList.add('going');
    setTimeout(() => { if (items.length) li.remove(); else draw(); }, 220);
  });
  document.addEventListener('click', (e) => { if (!panel.hidden && !panel.contains(e.target as Node)) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  load();
  addEventListener('visibilitychange', () => { if (!document.hidden && panel.hidden) load(); });
}
