// Your library: the pieces you've saved for later, standing on shelves, each with the cover its writer chose. Private to you (the `library`
// table; a Fellowship member's library is `saves`, which also stands on their page). Opening one reads it inside the Guild.
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCollection } from './Collection';

// A piece without a picture of its own wears its room's photograph
const ROOM: Record<string, string> = { watchtower: '/images/watchtower-photo-1200.jpg', hearth: '/images/glass-2-1200.jpg', perimeter: '/images/chapel-and-cross-under-a-1200.jpg' };
const MEDIUM: Record<string, string> = { prose: 'Prose', poetry: 'Poetry', fiction: 'Fiction', essay: 'Essay', photograph: 'Photograph', protocol: 'Protocol', recovery: 'Recovery', testimony: 'Testimony', deliverance: 'Deliverance', personal: 'Personal' };

type Book = NonNullable<ReturnType<typeof useCollection>>[number];
// How a piece stands on the shelf. A photograph is a polaroid. Short forms (poetry, and prose under a thousand words) are a
// single page. Everything long-form (essays, fiction, testimony and the like, or prose that runs long) is a book.
const shapeOf = (b: { medium: string; words?: number }) =>
  b.medium === 'photograph' ? ' lb-photo' : b.medium === 'poetry' || (b.medium === 'prose' && (b.words ?? 0) < 1000) ? ' lb-page' : '';
/** Pieces standing on shelves: books, single pages and polaroids. `onRemove` adds the small × that takes one down;
 *  `from` is remembered in the link, so the piece's back button returns to these shelves. */
export function Shelf({ books, onRemove, from }: { books: Book[]; onRemove?: (id: string) => void; from?: string }) {
  return (
    <ol className="lb-shelf">
      {books.map((b) => (
        <li key={b.id} className={`lb-book${b.img ? '' : ' lb-plain'}${shapeOf(b)}`}>
          <a href={`/guild/members/?p=${b.id}${from ? `&from=${from}` : ''}`} aria-label={`${b.title}, by ${b.who}`}>
            <img src={b.img || ROOM[(b as any).pillar] || ROOM.hearth} alt="" loading="lazy" style={b.img && b.image_focus ? { objectPosition: b.image_focus } : undefined} />
            <span className="lb-cover">
              <span className="lab lb-k">{MEDIUM[b.medium] ?? ''}</span>
              <span className="lb-t">{b.title}</span>
              <span className="lab lb-w">{b.who}</span>
            </span>
          </a>
          {onRemove && <button type="button" className="lb-x" aria-label={`Take ${b.title} off the shelf`} title="Take off the shelf" onClick={() => onRemove(b.id)}>×</button>}
        </li>
      ))}
    </ol>
  );
}

export function Library({ me }: { me: string }) {
  const fellow = typeof document !== 'undefined' && document.documentElement.hasAttribute('data-fellow');
  const table = fellow ? 'saves' : 'library';   // the Fellowship's library is the one on their page; the Guild's is private
  const items = useCollection(me, table);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const books = (items ?? []).filter((b) => !gone.has(b.id));
  async function remove(id: string) {
    setGone((g) => new Set(g).add(id));
    await supabase.from(table).delete().eq('member_id', me).eq('piece_id', id);
  }
  return (
    <div className="lb">
      <header className="lb-head">
        <span className="eb">The Library</span>
        <h1 className="h1">Your library</h1>
        <p className="it mut d-sub">{fellow ? 'The artifacts you’ve saved. These shelves also stand on your page, for others to see.' : 'The artifacts you’ve set aside for later. Only you can see these shelves.'}</p>
        {items && books.length > 0 && <span className="lab mut">{books.length} {books.length === 1 ? 'artifact' : 'artifacts'} waiting for you</span>}
      </header>
      {!items ? <p className="lab mut">Opening the library…</p> : books.length === 0 ? (
        <div className="lb-empty">
          <div className="lb-shelf lb-shelf-empty" aria-hidden="true" />
          <p className="it">The shelves are empty.</p>
          <span className="lab mut">Tap “Save to library” on any piece or photograph, and it waits for you here.</span>
          <a className="lab lb-go" href="/search/">Explore the altar →</a>
        </div>
      ) : (
        <Shelf books={books} onRemove={remove} from="library" />
      )}
    </div>
  );
}
