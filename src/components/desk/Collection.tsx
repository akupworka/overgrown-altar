// A Fellowship member's collection: the pieces and photographs they have saved, shown as one wall
// (photographs as tiles, writing as cards). Used on their Desk, on their member page, and on the public
// collection page (/collection/?of=<id>), which anyone may open.
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { pageList } from '../../lib/pager';

interface Item { id: string; slug: string; title: string; medium: string; image_path: string | null; image_focus: string | null; author_id: string; who?: string; img?: string }
const MEDIUM: Record<string, string> = { prose: 'Prose', poetry: 'Poetry', fiction: 'Fiction', essay: 'Essay', photograph: 'Photograph', protocol: 'Protocol', recovery: 'Recovery', testimony: 'Testimony', deliverance: 'Deliverance', personal: 'Personal' };
const STEP = 24;

export function useCollection(member: string) {
  const [items, setItems] = useState<Item[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data: sv } = await supabase.from('saves').select('piece_id, created_at').eq('member_id', member).order('created_at', { ascending: false });
      const ids = (sv ?? []).map((s: any) => s.piece_id);
      if (!ids.length) { setItems([]); return; }
      const { data } = await supabase.from('pieces').select('id, slug, title, medium, image_path, image_focus, author_id').in('id', ids).eq('status', 'approved').lte('published_at', new Date().toISOString());
      const rows = ((data ?? []) as Item[]);
      const order = new Map(ids.map((id: string, i: number) => [id, i]));
      rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      const authors = [...new Set(rows.map((r) => r.author_id))];
      const paths = rows.map((r) => r.image_path).filter((x) => x && !x.startsWith('/')) as string[];
      const [{ data: ppl }, signed] = await Promise.all([
        authors.length ? supabase.from('profiles').select('id, display_name').in('id', authors) : Promise.resolve({ data: [] as any[] }),
        paths.length ? supabase.storage.from('guild').createSignedUrls(paths, 3600) : Promise.resolve({ data: [] as any[] }),
      ]);
      const who = new Map((ppl ?? []).map((p: any) => [p.id, p.display_name]));
      const url = new Map<string, string>(((signed as any).data ?? []).map((x: any) => [x.path, x.signedUrl]));
      rows.forEach((r) => { if (r.image_path?.startsWith('/')) url.set(r.image_path, r.image_path); });
      setItems(rows.map((r) => ({ ...r, who: who.get(r.author_id) ?? 'A member', img: r.image_path ? url.get(r.image_path) : undefined })));
    })();
  }, [member]);
  return items;
}

export function CollectionWall({ items, empty }: { items: Item[] | null; empty: React.ReactNode }) {
  const [page, setPage] = useState(1);
  const [show, setShow] = useState<'all' | 'photos' | 'writing'>('all');
  if (!items) return <p className="lab mut">Gathering the collection…</p>;
  if (!items.length) return <div className="cl-empty">{empty}</div>;
  const photos = items.filter((i) => i.medium === 'photograph').length, writing = items.length - photos;
  const list = items.filter((i) => show === 'all' || (show === 'photos') === (i.medium === 'photograph'));
  const pages = Math.max(1, Math.ceil(list.length / STEP)), cur = Math.min(page, pages);
  const turn = (n: number) => { setPage(n); document.querySelector('.cl-wall')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <>
      {photos > 0 && writing > 0 && (
        <div className="filters cl-filters" role="group" aria-label="Show">
          {([['all', 'All', items.length], ['photos', 'Photographs', photos], ['writing', 'Writing', writing]] as const).map(([k, label, n]) => (
            <button key={k} type="button" className="chip" aria-pressed={show === k} onClick={() => { setShow(k); setPage(1); }}>{label}<span className="chip-n">{n}</span></button>
          ))}
        </div>
      )}
      <ol className="cl-wall">
        {list.slice((cur - 1) * STEP, cur * STEP).map((i) => (
          <li key={i.id} className={i.medium === 'photograph' ? 'cl-photo' : 'cl-word'}>
            <a href={`/guild/${i.slug}/`}>
              {i.img ? <img src={i.img} alt="" loading="lazy" style={i.image_focus ? { objectPosition: i.image_focus } : undefined} /> : null}
              <span className="cl-cap">
                <span className="lab cl-k">{MEDIUM[i.medium] ?? ''}</span>
                <span className="cl-t">{i.title}</span>
                <span className="lab cl-w">{i.who}</span>
              </span>
            </a>
          </li>
        ))}
      </ol>
      {pages > 1 && (
        <nav className="pager fo-pager cl-pager" aria-label="Pages of the collection">
          <button type="button" className="pg-step" disabled={cur === 1} onClick={() => turn(cur - 1)} aria-label="Previous page">‹</button>
          {pageList(cur, pages).map((n, k) => n === '…' ? <span key={'g' + k} className="pg-gap" aria-hidden="true">…</span>
            : <button key={n} type="button" className="pg-n" aria-current={n === cur ? 'page' : undefined} onClick={() => turn(n)}>{n}</button>)}
          <button type="button" className="pg-step" disabled={cur === pages} onClick={() => turn(cur + 1)} aria-label="Next page">›</button>
        </nav>
      )}
    </>
  );
}
