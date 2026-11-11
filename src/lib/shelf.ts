// What the library's shelves share wherever they stand (inside the Guild, and on a writer's public page):
// how a piece stands, and the room photograph a piece without its own picture wears.
export const ROOM: Record<string, string> = { watchtower: '/images/watchtower-photo-1200.jpg', hearth: '/images/glass-2-1200.jpg', perimeter: '/images/chapel-and-cross-under-a-1200.jpg' };
export const MEDIUM: Record<string, string> = { prose: 'Prose', poetry: 'Poetry', fiction: 'Fiction', essay: 'Essay', photograph: 'Photograph', protocol: 'Protocol', recovery: 'Recovery', testimony: 'Testimony', deliverance: 'Deliverance', personal: 'Personal' };

/** How a piece stands on the shelf. A photograph is a polaroid. Short forms (poetry, and prose under a thousand words) are a
 *  single page. Everything long-form (essays, fiction, testimony and the like, or prose that runs long) is a book. */
export const shapeOf = (b: { medium: string; words?: number }) =>
  b.medium === 'photograph' ? ' lb-photo' : b.medium === 'poetry' || (b.medium === 'prose' && (b.words ?? 0) < 1000) ? ' lb-page' : '';

export interface ShelfBook { href: string; title: string; who: string; medium: string; words?: number; img?: string; pillar?: string }
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
/** The same shelf as the Guild's, as HTML, for pages drawn without React (the public writer page). */
export const shelfHtml = (books: ShelfBook[]) => books.map((b) =>
  `<li class="lb-book${b.img ? '' : ' lb-plain'}${shapeOf(b)}"><a href="${esc(b.href)}" aria-label="${esc(`${b.title}, by ${b.who}`)}">` +
  `<img src="${esc(b.img || ROOM[b.pillar ?? ''] || ROOM.hearth)}" alt="" loading="lazy">` +
  `<span class="lb-cover"><span class="lab lb-k">${esc(MEDIUM[b.medium] ?? '')}</span><span class="lb-t">${esc(b.title)}</span><span class="lab lb-w">${esc(b.who)}</span></span></a></li>`).join('');
