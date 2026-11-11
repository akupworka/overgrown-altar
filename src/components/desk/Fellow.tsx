// The Desk for the Fellowship: their collection, new work from the writers they follow, and their conversations.
// (The Fellowship doesn't write, so there are no pieces, drafts or prestiges here.)
import { useEffect, useState } from 'react';
import { supabase, type Profile } from '../../lib/supabase';
import { ForumMineLatest, useForumTally } from './Forum';
import { ReadingShelf } from './Reading';
import { Welcome } from './Welcome';
import { useCollection } from './Collection';
import { WayCard } from './Way';
import { PillarTiles } from './DeskApp';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

export function FellowHome({ profile }: { profile: Profile }) {
  const items = useCollection(profile.id);
  const tally = useForumTally(profile.id);
  const [following, setFollowing] = useState(0);
  useEffect(() => { supabase.from('follows').select('followed').eq('follower', profile.id).then(({ data }) => setFollowing((data ?? []).length)); }, [profile.id]);
  const first = (profile.display_name || '').split(/\s+/)[0];
  return (
    <section className="d-section d-home fl-home">
      <header className="d-home-head">
        <div className="d-home-hello">
          <span className="eb">The Fellowship</span>
          <h1 className="h1 d-hello">{greeting()}, {first}</h1>
          <p className="d-tally"><span><b>{items?.length ?? 0}</b> in your vault</span><a className="d-tally-link" href="/guild/members/?view=following"><b>{following}</b> {following === 1 ? 'writer' : 'writers'} followed →</a></p>
        </div>
        <div className="d-begins">
          <a className="btn d-btn" href="/gallery/">Explore the Gallery</a>
          <a className="ghost d-btn" href="/search/">Search the altar</a>
        </div>
      </header>
      <PillarTiles />
      <WayCard member={profile.id} mine />
      <Welcome fellow portrait={!!profile.portrait_path} bio={!!profile.bio?.trim()} posted={!!(tally && ((tally as any).posts > 0 || (tally as any).threads > 0))}
        sent={!!items?.length} onWrite={() => {}} />
      <section className="d-forum-panel">
        <div className="d-forum-head"><span className="eb">Your conversations</span><a className="lab d-forum-link" href="/guild/members/?view=mine">See all →</a></div>
        <ForumMineLatest me={profile.id} />
      </section>
      <ReadingShelf me={profile.id} freshOnly />
      {/* The collection itself lives on their page; here, one way to it */}
      <a className="fl-coll-link" href={`/guild/members/?m=${profile.id}`}>
        <span><span className="eb">Your vault</span>
          <span className="it">{items?.length ? `${items.length} ${items.length === 1 ? 'piece' : 'pieces'} kept, on your page.` : 'Tap “Add to vault” on anything you love; it shows on your page.'}</span></span>
        <span className="lab fl-coll-go">Open →</span>
      </a>
    </section>
  );
}
