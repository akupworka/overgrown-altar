// What the library's shelves share wherever they stand: how a piece stands, and the room photograph a piece
// without its own picture wears.
export const ROOM: Record<string, string> = { watchtower: '/images/watchtower-photo-1200.jpg', hearth: '/images/glass-2-1200.jpg', perimeter: '/images/chapel-and-cross-under-a-1200.jpg' };
export const MEDIUM: Record<string, string> = { prose: 'Prose', poetry: 'Poetry', fiction: 'Fiction', essay: 'Essay', photograph: 'Photograph', protocol: 'Protocol', recovery: 'Recovery', testimony: 'Testimony', deliverance: 'Deliverance', personal: 'Personal' };

/** How a piece stands on the shelf. A photograph is a polaroid. Short forms (poetry, and prose under a thousand words) are a
 *  single page. Everything long-form (essays, fiction, testimony and the like, or prose that runs long) is a book. */
export const shapeOf = (b: { medium: string; words?: number }) =>
  b.medium === 'photograph' ? ' lb-photo' : b.medium === 'poetry' || (b.medium === 'prose' && (b.words ?? 0) < 1000) ? ' lb-page' : '';
