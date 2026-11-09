// The Desk for the Fellowship: their collection, new work from the writers they follow, and their conversations.
// (The Fellowship doesn't write, so there are no pieces, drafts or prestiges here.)
import { useEffect, useState } from 'react';
import { supabase, type Profile } from '../../lib/supabase';
import { ForumMineLatest, useForumTally } from './Forum';
import { ReadingShelf } from './Reading';
import { Welcome } from './Welcome';
import { useCollection, CollectionWall } from './Collection';
import { WayCard } from './Way';
import { PillarTiles } from './DeskApp';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

export function FellowHome({ profile }: { profile: Profile }) {
  const items = useCollection(profile.id);
  const tally = useForumTally(profile.id);
  const [following, setFollowing] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => { supabase.from('follows').select('followed').eq('follower', profile.id).then(({ data }) => setFollowing((data ?? []).length)); }, [profile.id]);
  const first = (profile.display_name || '').split(/\s+/)[0];
  const share = `${location.origin}/collection/?of=${profile.id}`;
  async function shareIt() {
    try { if (navigator.share) { await navigator.share({ title: `${profile.display_name}’s collection`, url: share }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(share); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch {}
  }
  return (
    <section className="d-section d-home fl-home">
      <header className="d-home-head">
        <div className="d-home-hello">
          <span className="eb">The Fellowship</span>
          <h1 className="h1 d-hello">{greeting()}, {first}</h1>
          <p className="d-tally"><span><b>{items?.length ?? 0}</b> in your collection</span><span><b>{following}</b> {following === 1 ? 'writer' : 'writers'} followed</span></p>
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
      <div className="d-row-head fl-coll-head">
        <h2 className="eb">Your collection</h2>
        {!!items?.length && <button type="button" className="lab fl-share" onClick={shareIt}>{copied ? 'Link copied' : 'Share your collection →'}</button>}
      </div>
      <CollectionWall items={items} empty={<>
        <p className="it">Your collection is waiting for its first piece.</p>
        <span className="lab mut">Tap <b>Save</b> on any piece or photograph you love, and it gathers here.</span>
        <a className="lab cl-empty-go" href="/gallery/">Begin in the Gallery →</a>
      </>} />
    </section>
  );
}
