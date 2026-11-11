// Your library: the pieces you've saved for later, standing on shelves, each with the cover its writer chose. Private to you (the `library`
// table; a Fellowship member's library is `saves`, which also stands on their page). Opening one reads it inside the Guild.
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCollection } from './Collection';
import { MEDIUM, ROOM, shapeOf } from '../../lib/shelf';

type Book = NonNullable<ReturnType<typeof useCollection>>[number];
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

/** Private or public: the keeper of a library decides. Private (as every library begins), only they see its shelves. Public,
 *  anyone can: on their vault inside the Guild and on their public page. Shows nothing until the choice can be read. */
export function LibraryVisibility({ me, onChange }: { me: string; onChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabase.from('profiles').select('library_public').eq('id', me).maybeSingle().then(({ data, error }) => { if (!error && data) setOpen(!!(data as any).library_public); });
  }, [me]);
  if (open === null) return null;
  const flip = async () => {
    const to = !open; setBusy(true);
    const { error } = await supabase.from('profiles').update({ library_public: to } as any).eq('id', me);
    setBusy(false);
    if (!error) { setOpen(to); onChange?.(to); }
  };
  return (
    <div className={`lb-vis${open ? ' open' : ''}`}>
      <span className="lb-vis-ic" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          {open ? <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></> : <><rect x="5" y="10.5" width="14" height="10" rx="1.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>}
        </svg>
      </span>
      <span className="lb-vis-t"><b>{open ? 'Public' : 'Private'}</b><span>{open ? 'Anyone can see these shelves on your page.' : 'Only you can see these shelves.'}</span></span>
      <button type="button" className="lab lb-vis-btn" onClick={flip} disabled={busy} aria-pressed={open}>{open ? 'Make private' : 'Make public'}</button>
    </div>
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
        <p className="it mut d-sub">{fellow ? 'The artifacts you’ve saved. These shelves also stand on your page, for others to see.' : 'The artifacts you’ve set aside for later.'}</p>
        {!fellow && <LibraryVisibility me={me} />}
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
