// A member's reading: pieces saved for later, new work from the writers they follow, and the Follow button
// on a member's page. (Saving and following happen on each piece's page; see components/PieceTools.astro.)
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Row { id: string; slug: string; title: string; medium: string; published_at: string; author_id: string; who?: string }
const MEDIUM: Record<string, string> = { prose: 'Prose', poetry: 'Poetry', fiction: 'Fiction', essay: 'Essay', photograph: 'Photograph', protocol: 'Protocol', recovery: 'Recovery', testimony: 'Testimony', deliverance: 'Deliverance', personal: 'Personal' };
const day = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

async function withNames(rows: Row[]) {
  const ids = [...new Set(rows.map((r) => r.author_id))];
  if (!ids.length) return rows;
  const { data } = await supabase.from('profiles').select('id, display_name').in('id', ids);
  const names = new Map((data ?? []).map((p: any) => [p.id, p.display_name]));
  return rows.map((r) => ({ ...r, who: names.get(r.author_id) ?? 'A member' }));
}

/** On the Desk: what you saved, and what's new from the writers you follow. Shows nothing until there is something. */
export function ReadingShelf({ me, freshOnly = false }: { me: string; freshOnly?: boolean }) {
  const [saved, setSaved] = useState<Row[] | null>(null);
  const [fresh, setFresh] = useState<Row[] | null>(null);
  const [savedAll, setSavedAll] = useState(0);
  useEffect(() => {
    (async () => {
      const now = new Date().toISOString();
      const { data: sv } = await supabase.from('saves').select('piece_id, created_at').eq('member_id', me).order('created_at', { ascending: false });
      const ids = (sv ?? []).map((s: any) => s.piece_id);
      setSavedAll(ids.length);
      if (ids.length) {
        const { data } = await supabase.from('pieces').select('id, slug, title, medium, published_at, author_id').in('id', ids.slice(0, 20)).eq('status', 'approved').lte('published_at', now);
        const order = new Map(ids.map((id: string, i: number) => [id, i]));
        setSaved(await withNames(((data ?? []) as Row[]).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)).slice(0, 4)));
      } else setSaved([]);
      const { data: fl } = await supabase.from('follows').select('followed').eq('follower', me);
      const writers = (fl ?? []).map((f: any) => f.followed);
      if (writers.length) {
        const since = new Date(Date.now() - 45 * 864e5).toISOString();
        const { data } = await supabase.from('pieces').select('id, slug, title, medium, published_at, author_id').in('author_id', writers)
          .eq('status', 'approved').gt('published_at', since).lte('published_at', now).order('published_at', { ascending: false }).limit(4);
        setFresh(await withNames((data ?? []) as Row[]));
      } else setFresh([]);
    })();
  }, [me]);
  async function unsave(id: string) {
    setSaved((s) => (s ?? []).filter((r) => r.id !== id)); setSavedAll((n) => n - 1);
    await supabase.from('saves').delete().eq('member_id', me).eq('piece_id', id);
  }
  if (freshOnly && !fresh?.length) return null;
  if (!saved?.length && !fresh?.length) return null;
  const list = (rows: Row[], removable = false) => (
    <ol className="rd-list">
      {rows.map((r) => (
        <li key={r.id} className="rd-row">
          <a className="rd-link" href={`/guild/${r.slug}/`}>
            <span className="rd-t">{r.title}</span>
            <span className="lab mut rd-m">{MEDIUM[r.medium] ?? ''} · {r.who} · {day(r.published_at)}</span>
          </a>
          {removable && <button type="button" className="rd-x" aria-label={`Remove ${r.title} from saved`} onClick={() => unsave(r.id)}>×</button>}
        </li>
      ))}
    </ol>
  );
  return (
    <div className="rd-shelf">
      {!!fresh?.length && (
        <section className="d-forum-panel rd-panel">
          <div className="d-forum-head"><span className="eb">New from writers you follow</span></div>
          {list(fresh)}
        </section>
      )}
      {!freshOnly && !!saved?.length && (
        <section className="d-forum-panel rd-panel">
          <div className="d-forum-head"><span className="eb">Saved for later</span>{savedAll > 4 && <span className="lab mut">{savedAll} saved</span>}</div>
          {list(saved, true)}
        </section>
      )}
    </div>
  );
}

/** On a member's page: follow them, to see their new work on your Desk (and in your daily letter). */
export function FollowButton({ me, them, first }: { me: string; them: string; first: string }) {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.from('follows').select('followed').eq('follower', me).eq('followed', them).then(({ data }) => setOn(!!(data && data.length)));
  }, [me, them]);
  if (on === null) return null;
  return (
    <button type="button" className={`m-act${on ? '' : ' rd-follow'}`} aria-pressed={on} onClick={async () => {
      const next = !on; setOn(next);
      const { error } = next ? await supabase.from('follows').insert({ follower: me, followed: them }) : await supabase.from('follows').delete().eq('follower', me).eq('followed', them);
      if (error) setOn(!next);
    }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">{on ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M12 5v14M5 12h14" />}</svg>
      {on ? `Following ${first}` : `Follow ${first}`}
    </button>
  );
}
