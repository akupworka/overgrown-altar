// The public page of a Fellowship member's collection (/collection/?of=<id>): open to anyone, signed in or not.
import { useEffect, useState } from 'react';
import { supabase, portraitUrl } from '../../lib/supabase';
import { seatFor } from '../../lib/seats';
import { useCollection, CollectionWall } from './Collection';

export default function PublicCollection() {
  const id = new URLSearchParams(location.search).get('of') ?? '';
  const [who, setWho] = useState<{ display_name: string; bio: string; portrait_path: string | null; role: string } | null | undefined>(undefined);
  useEffect(() => {
    if (!/^[0-9a-f-]{36}$/.test(id)) { setWho(null); return; }
    supabase.from('profiles').select('display_name, bio, portrait_path, role').eq('id', id).maybeSingle().then(({ data }) => setWho(data && data.role === 'fellow' ? (data as any) : null));
  }, [id]);
  const items = useCollection(who ? id : '00000000-0000-0000-0000-000000000000');
  if (who === undefined) return <p className="lab mut pc-wait">Opening the collection…</p>;
  if (who === null) return <div className="pc-none"><p className="it">This collection isn’t here.</p><a className="lab" href="/gallery/">Visit the Gallery →</a></div>;
  const first = who.display_name.split(/\s+/)[0];
  document.title = `${who.display_name}’s collection · Overgrown Altar`;
  return (
    <div className="pc">
      <header className="pc-head">
        <span className="pc-arch"><img src={portraitUrl(who.portrait_path) || seatFor(who.display_name)} alt="" /></span>
        <span className="eb">A collection from the Fellowship</span>
        <h1 className="h1 pc-name">{who.display_name}</h1>
        {who.bio && <p className="it pc-bio">{who.bio}</p>}
      </header>
      <CollectionWall items={items} empty={<p className="it">{first} hasn’t gathered anything yet.</p>} />
      {!document.documentElement.hasAttribute('data-member') && <p className="lab pc-join">Keep a collection of your own: <a href="/join/#fellowship">join the Fellowship →</a></p>}
    </div>
  );
}
