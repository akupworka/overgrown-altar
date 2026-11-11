import { uniqueIds as useIds } from '../../lib/svgIds';
// The Guild's members area, for signed-in members:
//   /guild/members/            the directory (everyone listed, alphabetically)
//   /guild/members/?m=<id>     a member's page: portrait, craft, bio, links, collected work
//   /guild/members/?p=<id>     reading one of their published pieces
// What anyone can see is enforced by the database's rules; this only presents it.
import { seenRole, viewAs, isEditorRole, roleLabel, roleClass } from '../../lib/supabase';
import { FollowButton } from './Reading';
import { useCollection, CollectionWall } from './Collection';
import { WayPage, WayBadge, WayTrophies } from './Way';
import { SideColumn, Loading } from './DeskApp';
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, portraitUrl, rememberMember, PILLARS, MEDIUMS, type Piece, type Profile } from '../../lib/supabase';
import { Body } from '../../lib/marks';
import { PhotoPlate } from '../PhotoPlate';
import { Initials, Icon } from './DeskApp';
import { PrestigeBadge } from './Prestige';
import { TrophyCase, TrophyCatalogue } from './Trophies';
import { PRESTIGES, prestigeFor } from '../../lib/prestige';
import { crestSvg } from '../../lib/crests';
import { trophiesFor, finestFirst, trophySvg } from '../../lib/trophies';
import { seatFor } from '../../lib/seats';
import { KINDS } from '../../lib/kinds';
import { PER_PAGE, pageList, toListTop } from '../../lib/pager';
import { ForumIndex, ForumBoard, ForumThread, ForumLatest, ForumRules, ForumMine, useForumTally } from './Forum';
import { PrestigePage } from './PrestigePage';
import { InboxList, InboxThread } from './Inbox';
import { WorkshopNotes, SharedWithYou } from './Workshop';
import { Library, Shelf } from './Library';

type Route = { m?: string; p?: string; view?: string; board?: string; t?: string };
const readRoute = (): Route => {
  const q = new URLSearchParams(location.search);
  return { m: q.get('m') ?? undefined, p: q.get('p') ?? undefined, view: q.get('view') ?? undefined, board: q.get('board') ?? undefined, t: q.get('t') ?? undefined, dm: q.get('dm') ?? undefined };
};
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '');
const pillarName = (v: string) => PILLARS.find((p) => p.value === v)?.label.split(' · ')[0] ?? '';
// The public writer page's address, made the same way as when the site is built (lib/guild.ts).
const authorSlug = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'member';
const mediumName = (v: string) => MEDIUMS.find((m) => m.value === v)?.label ?? '';

function go(to: string) {
  history.pushState(null, '', to);
  dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function Link({ to, className, children }: { to: string; className?: string; children: React.ReactNode }) {
  return <a href={to} className={className} onClick={(e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); go(to); }}>{children}</a>;
}

function Arch({ p, big = false }: { p: Pick<Profile, 'display_name' | 'portrait_path'>; big?: boolean }) {
  const src = portraitUrl(p.portrait_path);
  const initials = p.display_name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return <span className="g-arch" aria-hidden="true"><img src={src || seatFor(p.display_name)} alt="" loading={big ? 'eager' : 'lazy'} data-initials={initials} /></span>;
}

// ---------------------------------------------------------------- the directory

function Directory({ me }: { me?: string } = {}) {
  const [members, setMembers] = useState<(Profile & { count: number })[] | null>(null);
  const [q, setQ] = useState('');   // find a member by name or craft
  // Members a page: 25 on a computer (five full rows of five), 24 on a phone (six rows of four)
  const STEP = typeof window !== 'undefined' && matchMedia('(max-width: 700px)').matches ? 24 : 25;
  const [mPage, setMPage] = useState(1);
  const amFellow = (() => { try { return !!JSON.parse(localStorage.getItem('oa_member') || '{}').fellow; } catch { return false; } })();
  const [mine, setMine] = useState<number | null>(null);   // your own published count, for your crest on the Prestiges tile
  // For the rooms: your own work (Desk counts, trophies), and the newest photographs (the Gallery's mosaic).
  const [myPieces, setMyPieces] = useState<Piece[]>([]);
  const [meId, setMeId] = useState('');
  const [shots, setShots] = useState<string[]>([]);
  const myTally = useForumTally(meId || null);
  useEffect(() => {
    (async () => {
      const [{ data: people }, { data: work }] = await Promise.all([
        supabase.from('profiles').select('*').eq('listed', true).order('display_name'),
        supabase.rpc('piece_counts'),   // published pieces per writer, counted in the database
      ]);
      const counts = new Map<string, number>();
      (Array.isArray(work) ? work : []).forEach((w: any) => counts.set(w.author_id, w.n));
      // Highest rank first (the prestiges climb with published pieces), then by name
      setMembers(((people as Profile[]) ?? []).map((p) => ({ ...p, count: counts.get(p.id) ?? 0 }))
        .sort((a, b) => b.count - a.count || (a.display_name || '').localeCompare(b.display_name || '')));
      const { data: s } = await supabase.auth.getSession();
      if (s.session) {
        setMine(counts.get(s.session.user.id) ?? 0); setMeId(s.session.user.id);
        const { data: mp } = await supabase.from('pieces').select('*').eq('author_id', s.session.user.id);
        setMyPieces(Array.isArray(mp) ? (mp as Piece[]) : []);
      }
      const { data: ph } = await supabase.from('pieces').select('image_path').eq('status', 'approved').eq('medium', 'photograph').not('image_path', 'is', null).order('published_at', { ascending: false }).limit(4);
      const paths = (Array.isArray(ph) ? ph : []).map((x: any) => x.image_path).filter(Boolean);
      if (paths.length) {
        const store = paths.filter((x: string) => !x.startsWith('/'));
        const { data: su } = store.length ? await supabase.storage.from('guild').createSignedUrls(store, 3600) : { data: [] as any[] };
        const m = new Map((su ?? []).map((x: any) => [x.path, x.signedUrl]));
        setShots(paths.map((x: string) => (x.startsWith('/') ? x : m.get(x))).filter(Boolean) as string[]);
      }
    })();
  }, []);
  const matched = (members ?? []).filter((m) => !q.trim() || `${m.display_name} ${m.craft ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));
  // The Guild's writers first, by rank; the Fellowship in a section of its own beneath, newest first.
  const found = matched.filter((m) => m.role !== 'fellow');
  const fellows = matched.filter((m) => m.role === 'fellow').sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')));
  const [fPage, setFPage] = useState(1);
  const fPages = Math.max(1, Math.ceil(fellows.length / STEP)), fCur = Math.min(fPage, fPages);
  const turnF = (n: number) => { setFPage(n); toListTop('.g-fellow-head'); };
  const mPages = Math.max(1, Math.ceil(found.length / STEP)), mCur = Math.min(mPage, mPages);
  const turnM = (n: number) => { setMPage(n); toListTop('.g-people-head'); };
  return (
    <div className="g-wrap">
      <header className="g-head">
        <span className="eb">At the table</span>
        <h1 className="h1">The Guild</h1>
        <p className="it mut d-sub">The members’ house: talk in the forum, climb the prestiges, and meet everyone who has taken a seat.</p>
      </header>
      {/* The Workshop: drafts other members have shared with you (shows only when there is one) */}
      {(me || meId) && <SharedWithYou me={me || meId} />}
      {/* The Guild's rooms, before its people */}
      <div className="g-rooms">
        <section className="g-room g-room-forum">
          <div className="g-room-head">
            <span className="eb">The Forum</span>
            <Link className="lab g-room-go" to="/guild/members/?view=forum">All forums →</Link>
          </div>
          <p className="it mut g-room-sub">The latest conversations among the Guild.</p>
          <ForumLatest count={5} />
        </section>
        {(me || meId) && <FollowingNew me={me || meId} />}
      </div>
      {/* The rooms, as a row of windows */}
      <div className="g-room-side g-tiles">
          <a className="g-room g-room-small g-tile g-tile-desk" href="/guild/desk/">
            <img className="g-tile-photo" src="/images/window-light-on-wall-1200.jpg" alt="" loading="lazy" />
            <span className="g-tile-mark" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></svg></span>
            <span className="g-tile-text"><span className="g-tile-name">{amFellow ? 'Your collection' : 'Your Desk'}</span><span className="g-room-line">{amFellow ? 'What you’ve saved, and what’s new from writers you follow.' : 'Write, send, and see where your pieces stand.'}</span>
              {meId && !amFellow && <span className="g-tile-stats"><b>{myPieces.filter((p) => p.status === 'approved').length}</b> published<i>·</i><b>{myPieces.filter((p) => p.status === 'draft' || p.status === 'returned').length}</b> {myPieces.filter((p) => p.status === 'draft' || p.status === 'returned').length === 1 ? 'draft' : 'drafts'}</span>}</span>
            <span className="g-tile-go" aria-hidden="true">→</span>
          </a>
          {(() => {
            const r = prestigeFor(mine ?? 0);
            const won = meId ? finestFirst(trophiesFor({ pieces: myPieces.filter((p) => p.status === 'approved'), member: members?.find((m) => m.id === meId) ?? {}, forum: myTally }).filter((x) => x.earned)) : [];
            const ink = r.current ? (r.current.color === 'rainbow' ? '#C9A7FF' : r.current.color === 'gold' ? '#F2D27A' : `color-mix(in srgb, ${r.current.color} 70%, white)`) : '#CFC8B8';
            return (
              <Link className="g-room g-room-small g-tile g-tile-pz" to="/guild/members/?view=prestige">
                <span className="g-pz-glow" aria-hidden="true" style={{ '--ink': ink } as any} />
                <span className="g-pz-crest" aria-hidden="true" dangerouslySetInnerHTML={{ __html: useIds(crestSvg(r.current?.level ?? 1, 96, r.current ? { glow: true } : { locked: true })) }} />
                <span className="g-tile-text"><span className="g-tile-name">The Prestiges</span>
                  <span className="g-pz-rank" style={{ color: ink }}>{r.current ? r.current.name : 'Not yet ranked'}</span>
                  {won.length > 0 && <span className="g-pz-medals" aria-hidden="true">{won.slice(0, 3).map(({ trophy: t, tier }) => <span key={t.id} dangerouslySetInnerHTML={{ __html: useIds(trophySvg(t, 30, tier)) }} />)}{won.length > 3 && <span className="g-pz-more">+{won.length - 3}</span>}</span>}
                </span>
                <span className="g-tile-go" aria-hidden="true">→</span>
              </Link>
            );
          })()}
          <a className="g-room g-room-small g-tile" href="/crafts/">
            <img className="g-tile-photo" src="/images/faded-chapel-wall-with-a-1200.jpg" alt="" loading="lazy" />
            <span className="g-tile-mark" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z" /><path d="M12 6.5v13" /></svg></span>
            <span className="g-tile-text"><span className="g-tile-name">The Crafts</span><span className="g-room-line">Every kind of work the Guild publishes, and what the editor looks for.</span></span>
            <span className="g-tile-go" aria-hidden="true">→</span>
          </a>
          <a className="g-room g-room-small g-tile g-tile-gal" href="/gallery/">
            {shots.length > 0
              ? <span className="g-gal-mosaic" aria-hidden="true">{[0, 1, 2, 3].map((i) => <img key={i} src={shots[i % shots.length]} alt="" loading="lazy" />)}</span>
              : <img className="g-tile-photo" src="/images/bay-window-of-stained-glass-1200.jpg" alt="" loading="lazy" />}
            <span className="g-tile-mark" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="3.5" width="17" height="17" /><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17" /></svg></span>
            <span className="g-tile-text"><span className="g-tile-name">The Gallery</span><span className="g-room-line">Every photograph the Guild has made, newest first.</span></span>
            <span className="g-tile-go" aria-hidden="true">→</span>
          </a>
          <a className="g-room g-room-small g-tile" href="/folios">
            <img className="g-tile-photo" src="/images/folios-photo-1200.jpg" alt="" loading="lazy" />
            <span className="g-tile-mark" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h10l4 4v12H5z" /><path d="M15 4v4h4M8 12h8M8 15h8M8 18h5" /></svg></span>
            <span className="g-tile-text"><span className="g-tile-name">Folios</span><span className="g-room-line">The publication’s bound collections.</span></span>
            <span className="g-tile-go" aria-hidden="true">→</span>
          </a>
          <a className="g-room g-room-small g-tile" href="/about">
            <img className="g-tile-photo" src="/images/what-we-believe-1200.jpg" alt="" loading="lazy" />
            <span className="g-tile-mark" aria-hidden="true"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></svg></span>
            <span className="g-tile-text"><span className="g-tile-name">About</span><span className="g-room-line">Who we are, and what we believe.</span></span>
            <span className="g-tile-go" aria-hidden="true">→</span>
          </a>
      </div>
      <div className="g-people-head" id="members"><span className="eb">Members</span>{members && <span className="lab mut">{members.filter((m) => m.role !== 'fellow').length} at the table</span>}</div>
      {members && members.length > 3 && (
        <label className="g-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <span className="visually-hidden">Find a member</span>
          <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setMPage(1); setFPage(1); }} placeholder="Find a member by name or craft" />
        </label>
      )}
      {!members ? <p className="lab mut">Gathering the Guild…</p>
        : members.length === 0 ? <p className="it mut d-empty">No one is listed yet.</p>
        : (
          <div className="g-grid">
            {found.slice((mCur - 1) * STEP, mCur * STEP).map((m) => (
              <Link key={m.id} to={`/guild/members/?m=${m.id}`} className="g-card">
                <Arch p={m} />
                <span className="g-name">{m.display_name || 'A member'}</span>
                <span className="lab mut g-craft g-role"><span className={roleClass(m.role)}>{roleLabel(m.role)}</span><span className="g-role-craft">{m.craft ? ` · ${m.craft}` : ''}</span></span>
                <span className="lab mut g-craft g-count">{m.count ? `${m.count} ${m.count === 1 ? 'piece' : 'pieces'}` : ''}</span>
                <PrestigeBadge published={m.count} link={false} />
              </Link>
            ))}
          </div>
        )}
      {mPages > 1 && (
        <nav className="pager fo-pager g-pager" aria-label="Pages of members">
          <button type="button" className="pg-step" disabled={mCur === 1} onClick={() => turnM(mCur - 1)} aria-label="Previous page">‹<span className="pg-word">Previous</span></button>
          {pageList(mCur, mPages).map((n, i) => n === '…' ? <span key={'g' + i} className="pg-gap" aria-hidden="true">…</span>
            : <button key={n} type="button" className="pg-n" aria-current={n === mCur ? 'page' : undefined} aria-label={`Page ${n} of ${mPages}`} onClick={() => turnM(n)}>{n}</button>)}
          <button type="button" className="pg-step" disabled={mCur === mPages} onClick={() => turnM(mCur + 1)} aria-label="Next page"><span className="pg-word">Next</span>›</button>
        </nav>
      )}
      {fellows.length > 0 && (<>
        <div className="g-people-head g-fellow-head"><span className="eb">The Fellowship</span><span className="lab mut">{fellows.length} {fellows.length === 1 ? 'reader' : 'readers'}</span></div>
        <div className="g-grid g-fellows">
          {fellows.slice((fCur - 1) * STEP, fCur * STEP).map((m) => (
            <Link key={m.id} to={`/guild/members/?m=${m.id}`} className="g-card">
              <Arch p={m} />
              <span className="g-name">{m.display_name || 'A reader'}</span>
              <span className="lab mut g-craft g-role">Fellowship<span className="g-role-craft">{m.craft ? ` · ${m.craft}` : ''}</span></span>
            </Link>
          ))}
        </div>
        {fPages > 1 && (
          <nav className="pager fo-pager g-pager" aria-label="Pages of the Fellowship">
            <button type="button" className="pg-step" disabled={fCur === 1} onClick={() => turnF(fCur - 1)} aria-label="Previous page">‹<span className="pg-word">Previous</span></button>
            {pageList(fCur, fPages).map((n, i) => n === '…' ? <span key={'f' + i} className="pg-gap" aria-hidden="true">…</span>
              : <button key={n} type="button" className="pg-n" aria-current={n === fCur ? 'page' : undefined} onClick={() => turnF(n)}>{n}</button>)}
            <button type="button" className="pg-step" disabled={fCur === fPages} onClick={() => turnF(fCur + 1)} aria-label="Next page"><span className="pg-word">Next</span>›</button>
          </nav>
        )}
      </>)}
    </div>
  );
}

// ---------------------------------------------------------------- a member's page

function MemberPage({ id, me }: { id: string; me: string }) {
  const [person, setPerson] = useState<Profile | null | undefined>(undefined);
  const [work, setWork] = useState<Piece[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [kind, setKind] = useState('all');
  const [tab, setTab] = useState<'writing' | 'photos' | null>(null);   // like a profile's posts and reels: writing, or photographs
  const [photoShown, setPhotoShown] = useState(12);
  const tally = useForumTally(id);   // their part in the forum, for its trophies
  const [page, setPage] = useState(1);
  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: w }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
        supabase.from('pieces').select('*').eq('author_id', id).eq('status', 'approved').order('published_at', { ascending: false, nullsFirst: false }),
      ]);
      setPerson((p as Profile) ?? null);
      const pieces = (w as Piece[]) ?? [];
      setWork(pieces);
      const paths = pieces.map((x) => x.image_path).filter(Boolean) as string[];
      if (paths.length) {
        const store = paths.filter((x) => !x.startsWith('/'));
        const { data } = store.length ? await supabase.storage.from('guild').createSignedUrls(store, 3600) : { data: [] as any[] };
        setThumbs({ ...Object.fromEntries((data ?? []).map((d: any) => [d.path, d.signedUrl])), ...Object.fromEntries(paths.filter((x) => x.startsWith('/')).map((x) => [x, x])) });
      }
    })();
  }, [id]);

  if (person === undefined) return <p className="lab mut d-loading">Opening the page…</p>;
  if (person === null) return <div className="m-gate"><p className="it mut d-empty">This member’s page could not be found.</p><Link className="d-link" to="/guild/members/">The Guild</Link></div>;
  const site = (person.website ?? '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  const handle = (person.instagram ?? '').replace(/^@/, '');
  const fellow = person.role === 'fellow';   // the Fellowship: a collection instead of work and prestige
  const iAmEditor = (() => { try { return !!JSON.parse(localStorage.getItem('oa_member') || '{}').editor && !viewAs(); } catch { return false; } })();
  const iAmChief = (() => { try { return !!JSON.parse(localStorage.getItem('oa_member') || '{}').chief && !viewAs(); } catch { return false; } })();
  // Six pieces to a page, with pages below; the kind filter narrows the list first.
  const photos = work.filter((w) => w.medium === 'photograph' && w.image_path);
  const writing = work.filter((w) => !(w.medium === 'photograph' && w.image_path));
  const view = tab ?? (writing.length || !photos.length ? 'writing' : 'photos');
  const kinds = KINDS.map((k) => ({ ...k, n: writing.filter((w) => w.medium === k.value).length })).filter((k) => k.n > 0);
  const shown = kind === 'all' ? writing : writing.filter((w) => w.medium === kind);
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const onPage = shown.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  const turn = (n: number) => { setPage(n); toListTop('.m-work'); };
  const arrow = (d: 'l' | 'r') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d={d === 'l' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} /></svg>;
  // The same page as the public writer page (/guild/authors/<name>/): an arch, the name, craft, a few lines, two link pills, then the work.
  return (
    <div className="m-page">
      <header className="m-hero">
        <Link className="m-back lab" to="/guild/members/">The Guild</Link>
        <Arch p={person} big />
        <span className={`eb ${roleClass(person.role)}`}>{roleLabel(person.role)}</span>
        <h1 className="h1 m-name">{person.display_name || 'A member'}</h1>
        {person.craft && <span className="lab m-craft">{person.craft}</span>}
        {fellow ? <WayBadge member={person.id} size="lg" /> : <PrestigeBadge published={work.length} size="lg" />}
        {person.id === me && <Link to="/guild/members/?view=following" className="lab m-follows-link">Writers you follow →</Link>}
        {person.bio ? <p className="m-bio">{person.bio}</p> : <p className="m-bio m-bio-empty">No words of introduction yet.</p>}
        {(site || handle || person.public_email) && (
          <span className="m-pills">
            {site && (
              <a href={person.website!} target="_blank" rel="noopener noreferrer" aria-label={`Website: ${site} (opens in a new tab)`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3z" /></svg>
                <span>{site}</span>
              </a>
            )}
            {handle && (
              <a href={`https://instagram.com/${handle}`} target="_blank" rel="noopener noreferrer" aria-label={`Instagram: @${handle} (opens in a new tab)`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none" /></svg>
                <span>@{handle}</span>
              </a>
            )}
            {person.public_email && (
              <a href={`mailto:${person.public_email}`} aria-label={`Email ${person.public_email}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 6.5 12 13l8.5-6.5" /></svg>
                <span className="m-mail">{person.public_email}</span>
              </a>
            )}
          </span>
        )}
        {person.id !== me && (
          <nav className="m-actions" aria-label="Contact">
            <button type="button" className="m-act primary" onClick={async () => {
              const { data, error } = await supabase.rpc('dm_open', { other: person.id });
              if (error) { alert(error.message); return; }
              go(`/guild/members/?dm=${data}`);
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12.5" rx="1.5" /><path d="M4 7l8 6 8-6" /></svg>
              Message {person.display_name.split(' ')[0]}
            </button>
            {!fellow && <FollowButton me={me} them={person.id} first={person.display_name.split(' ')[0]} />}
            {iAmChief && person.id !== me && person.role !== 'editor' && (
              <button type="button" className="m-act" onClick={async () => {
                const on = person.role !== 'staff';
                if (!confirm(on ? `Make ${person.display_name} an editor? They will share your editor's tools: reading and publishing pieces, Arrivals, reports and the forum's keys. Only you can appoint or remove editors.` : `Remove ${person.display_name} as an editor? They return to being a member of the Guild, and anything waiting with them goes back into the rotation.`)) return;
                const { error } = await supabase.rpc('set_staff', { member: person.id, on_staff: on });
                if (error) alert(error.message); else location.reload();
              }}>{person.role === 'staff' ? 'Remove as editor' : 'Make an editor'}</button>
            )}
            {fellow && iAmEditor && (
              <button type="button" className="m-act" onClick={async () => {
                if (!confirm(`Welcome ${person.display_name} into the Guild? They will be able to write and send work to you.`)) return;
                const { error } = await supabase.rpc('welcome_to_guild', { person: person.id });
                if (error) alert(error.message); else location.reload();
              }}>Welcome into the Guild</button>
            )}
          </nav>
        )}
        {person.id === me && (
          <nav className="m-actions" aria-label="My Desk">
            {fellow ? <a className="m-act primary" href="/guild/desk/">My collection</a> : <>
            <a className="m-act primary" href="/guild/desk/#write">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></svg>
              Write a piece
            </a></>}
            <a className="m-act" href="/guild/desk/#my-page">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              Edit your vault
            </a>
            {fellow ? <a className="m-act" href={`/collection/?of=${person.id}`}>Public page</a>
              : work.length > 0 && <a className="m-act" href={`/guild/authors/${authorSlug(person.display_name)}/`}>Public page</a>}
            <button type="button" className="m-signout lab" onClick={async () => { rememberMember(null); await supabase.auth.signOut(); location.href = '/guild/desk/'; }}>Sign out</button>
          </nav>
        )}
      </header>
      {fellow ? (<>
        <FellowShelf id={person.id} first={person.display_name.split(' ')[0]} mine={person.id === me} />
        <WayTrophies member={person.id} first={person.display_name.split(' ')[0]} mine={person.id === me} />
      </>) : (<>
      <section className="m-work">
        <div className="m-work-head"><span className="eb">The work</span><span className="lab">{view === 'photos' ? `${photos.length} ${photos.length === 1 ? 'photograph' : 'photographs'}` : `${shown.length} ${shown.length === 1 ? 'piece' : 'pieces'}`} · newest first</span></div>
        {/* Writing and photographs, each in its own place */}
        {writing.length > 0 && photos.length > 0 && (
          <div className="m-tabs" role="tablist" aria-label="Work">
            <button type="button" role="tab" aria-selected={view === 'writing'} className={view === 'writing' ? 'on' : ''} onClick={() => setTab('writing')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h9" /></svg>Writing<span className="m-tab-n">{writing.length}</span></button>
            <button type="button" role="tab" aria-selected={view === 'photos'} className={view === 'photos' ? 'on' : ''} onClick={() => setTab('photos')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" /><path d="M9.2 3.5v17M14.8 3.5v17M3.5 9.2h17M3.5 14.8h17" /></svg>Photographs<span className="m-tab-n">{photos.length}</span></button>
          </div>
        )}
        {view === 'photos' ? (<>
          <ol className="m-grid">
            {photos.slice(0, photoShown).map((w) => (
              <li key={w.id}>
                <button type="button" className="m-grid-tile" onClick={() => go(`/guild/members/?p=${w.id}`)} aria-label={w.title}>
                  {thumbs[w.image_path!] && <img src={thumbs[w.image_path!]} alt="" loading="lazy" style={w.image_focus ? { objectPosition: w.image_focus } : undefined} />}
                  <span className="m-grid-cap" aria-hidden="true">{w.title}</span>
                </button>
              </li>
            ))}
          </ol>
          {photos.length > photoShown && <div className="m-grid-more"><button type="button" className="d-link" onClick={() => setPhotoShown((n) => n + 12)}>Show more</button></div>}
        </>) : (<>
        {kinds.length > 1 && (
          <div className="filters-wrap"><div className="filters shelf-filters" role="group" aria-label="Show">
            <button type="button" className="chip" aria-pressed={kind === 'all'} onClick={() => { setKind('all'); setPage(1); }}>All<span className="chip-n">{work.length}</span></button>
            {kinds.map((k) => <button key={k.value} type="button" className="chip" aria-pressed={kind === k.value} onClick={() => { setKind(k.value); setPage(1); }}>{k.plural}<span className="chip-n">{k.n}</span></button>)}
          </div></div>
        )}
        {writing.length === 0 ? (
          <p className="it m-none">{person.id === me ? 'Your published pieces will gather here once the editor approves them.' : 'Their first published piece is still to come.'}</p>
        ) : (
          <ol className="m-list">
            {onPage.map((w) => (
              <li key={w.id}>
                <button type="button" className="m-piece" onClick={() => go(`/guild/members/?p=${w.id}`)}>
                  <span className="m-piece-text">
                    <span className="lab m-kicker"><b>{mediumName(w.medium)}</b><span className="m-room"> · {pillarName(w.pillar)}</span></span>
                    <span className="h3">{w.title}</span>
                    {w.standfirst && <span className="it m-sf">{w.standfirst}</span>}
                    {w.published_at && <span className="lab m-date">{fmt(w.published_at)}</span>}
                  </span>
                  <span className="m-thumb">{w.image_path && thumbs[w.image_path] ? <img src={thumbs[w.image_path]} alt="" loading="lazy" style={w.image_focus ? { objectPosition: w.image_focus } : undefined} /> : null}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
        {pages > 1 && (
          <nav className="pager" aria-label="Pages of work">
            <button type="button" className="pg-step" disabled={cur === 1} aria-label="Newer pieces" onClick={() => turn(cur - 1)}>{arrow('l')}<span className="pg-word">Newer</span></button>
            {pageList(cur, pages).map((n, i) => n === '…'
              ? <span key={'g' + i} className="pg-gap" aria-hidden="true">…</span>
              : <button key={n} type="button" className="pg-n" aria-current={n === cur ? 'page' : undefined} aria-label={`Page ${n} of ${pages}`} onClick={() => turn(n)}>{n}</button>)}
            <button type="button" className="pg-step" disabled={cur === pages} aria-label="Older pieces" onClick={() => turn(cur + 1)}><span className="pg-word">Older</span>{arrow('r')}</button>
          </nav>
        )}
        </>)}
      </section>
      {/* What they've saved: the Guild and editors keep a collection too (shown once there is something in it) */}
      <FellowCollection id={person.id} first={person.display_name.split(' ')[0]} mine={person.id === me} quiet />
      <div className="m-vault" id="vault"><TrophyCase ctx={{ pieces: work, member: person, forum: tally }} mine={person.id === me} name={person.display_name} /></div>
      </>)}
    </div>
  );
}

// ---------------------------------------------------------------- reading a piece

function Reading({ id }: { id: string }) {
  const [piece, setPiece] = useState<Piece | null | undefined>(undefined);
  const [author, setAuthor] = useState<Profile | null>(null);
  const [photo, setPhoto] = useState('');
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('pieces').select('*').eq('id', id).maybeSingle();
      setPiece((data as Piece) ?? null);
      if (!data) return;
      const [{ data: a }, img] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', data.author_id).maybeSingle(),
        data.image_path ? (data.image_path.startsWith('/') ? Promise.resolve({ data: { signedUrl: data.image_path } }) : supabase.storage.from('guild').createSignedUrl(data.image_path, 3600)) : Promise.resolve({ data: null }),
      ]);
      setAuthor((a as Profile) ?? null);
      setPhoto((img as any)?.data?.signedUrl ?? '');
    })();
  }, [id]);
  if (piece === undefined) return <p className="lab mut d-loading">Opening the piece…</p>;
  if (piece === null) return <div className="m-gate"><p className="it mut d-empty">This piece is not available.</p><Link className="d-link" to="/guild/members/">The Guild</Link></div>;
  return (
    <div className="m-reading">
      {piece.status !== 'approved'
        ? <Link className="m-back lab" to="/guild/members/">The Guild</Link>   /* a shared draft: back to where it was waiting */
        : <Link className="m-back lab" to={`/guild/members/?m=${piece.author_id}`}>{author?.display_name ?? 'Back'}</Link>}
      {piece.status !== 'approved' && <p className="lab ws-banner">A draft · not published · private to the Workshop</p>}
      <article className="d-paper">
        {photo && piece.medium !== 'photograph' && <img className="m-photo" src={photo} alt={piece.image_alt} />}
        <span className="eb">{pillarName(piece.pillar)} · {mediumName(piece.medium)}</span>
        <h1 className="h1">{piece.title}</h1>
        {piece.standfirst && <p className="d-paper-standfirst" style={{ margin: 0 }}>{piece.standfirst}</p>}
        {photo && piece.medium === 'photograph' && <PhotoPlate src={photo} alt={piece.image_alt} meta={piece.photo_meta} gallery={piece.gallery} />}
        {piece.body.trim() && <Body body={piece.body} />}
        {author && (
          <Link className="m-byline" to={`/guild/members/?m=${author.id}`}>
            <Initials name={author.display_name} size={36} src={portraitUrl(author.portrait_path)} />
            <span className="lab">{author.display_name}{piece.published_at ? ` · ${fmt(piece.published_at)}` : ''}</span>
          </Link>
        )}
        {piece.slug && <div data-read-end={`/guild/${piece.slug}/`} aria-hidden="true" className="read-end" />}
        {piece.status === 'approved' && <ReadTools piece={piece} />}
      </article>
      {piece.status !== 'approved' && <WorkshopNotes piece={piece} />}
    </div>
  );
}

/** On the Guild page: the newest work from the writers you follow (opened inside the Guild, to read and keep). */
function FollowingNew({ me }: { me: string }) {
  type Row = { id: string; title: string; medium: string; published_at: string; author_id: string; image_path: string | null; who?: Profile; img?: string };
  const [rows, setRows] = useState<Row[] | null>(null);
  const [following, setFollowing] = useState(0);
  useEffect(() => {
    (async () => {
      const { data: f } = await supabase.from('follows').select('followed').eq('follower', me);
      const ids = (f ?? []).map((x: any) => x.followed); setFollowing(ids.length);
      if (!ids.length) { setRows([]); return; }
      const { data } = await supabase.from('pieces').select('id, title, medium, published_at, author_id, image_path').in('author_id', ids)
        .eq('status', 'approved').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }).limit(5);
      const list = (data ?? []) as Row[];
      const [{ data: ppl }, signed] = await Promise.all([
        list.length ? supabase.from('profiles').select('*').in('id', [...new Set(list.map((r) => r.author_id))]) : Promise.resolve({ data: [] as any[] }),
        (() => { const st = list.map((r) => r.image_path).filter((x) => x && !x.startsWith('/')) as string[]; return st.length ? supabase.storage.from('guild').createSignedUrls(st, 3600) : Promise.resolve({ data: [] as any[] }); })(),
      ]);
      const who = new Map((ppl ?? []).map((p: any) => [p.id, p]));
      const url = new Map(((signed as any).data ?? []).map((x: any) => [x.path, x.signedUrl]));
      setRows(list.map((r) => ({ ...r, who: who.get(r.author_id), img: r.image_path ? (r.image_path.startsWith('/') ? r.image_path : url.get(r.image_path)) : undefined })));
    })();
  }, [me]);
  return (
    <section className="g-room g-room-forum g-follow">
      <div className="g-room-head">
        <span className="eb">Writers you follow</span>
        {following > 0 && <Link className="lab g-room-go" to="/guild/members/?view=following">Following →</Link>}
      </div>
      <p className="it mut g-room-sub">{!rows || following ? 'The newest work from the writers you keep up with.' : 'Their newest work, gathered in one place.'}</p>
      {!rows ? <p className="lab mut fo-latest-wait">Gathering their work…</p>
        : !following ? <p className="it g-follow-none">Open any writer’s page and tap Follow. <a href="#members" className="g-room-go">Meet the Guild ↓</a></p>
        : !rows.length ? <p className="it g-follow-none">Nothing new from them yet. It will appear here the moment it’s published.</p>
        : (
          <ol className="fo-latest">
            {rows.map((r) => {
              const name = r.who?.display_name ?? 'A member';
              return (
                <li key={r.id}>
                  <Link to={`/guild/members/?p=${r.id}`} className="fo-latest-row">
                    <span className="fo-latest-img g-follow-arch"><img src={r.img || portraitUrl(r.who?.portrait_path) || seatFor(name)} alt="" loading="lazy" /></span>
                    <span className="fo-latest-text">
                      <span className="fo-latest-title">{r.title}</span>
                      <span className="lab mut">{mediumName(r.medium).split(' / ')[0]} · {name} · {new Date(r.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
    </section>
  );
}

/** Under a piece read inside the Guild: keep it, tell the writer it stayed with you, and a way to its own page
 *  (where the reflections are). Your own piece shows only the way to its page. */
function ReadTools({ piece }: { piece: Piece }) {
  const [me, setMe] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [later, setLater] = useState(false);
  const [marked, setMarked] = useState(false);
  const [marks, setMarks] = useState(0);
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user.id ?? null; setMe(uid);
      const [{ data: sv }, { data: lt }, { data: mk }] = await Promise.all([
        uid ? supabase.from('saves').select('piece_id').eq('member_id', uid).eq('piece_id', piece.id) : Promise.resolve({ data: [] as any[] }),
        uid ? supabase.from('library').select('piece_id').eq('member_id', uid).eq('piece_id', piece.id) : Promise.resolve({ data: [] as any[] }),
        supabase.from('piece_marks').select('member_id').eq('piece_id', piece.id),
      ]);
      setSaved(!!sv?.length); setLater(!!lt?.length);
      setMarks((mk ?? []).length); setMarked(!!uid && (mk ?? []).some((m: any) => m.member_id === uid));
    })();
  }, [piece.id]);
  if (!me) return null;
  const mine = piece.author_id === me;
  const toggleSave = async () => {
    const on = !saved; setSaved(on);
    const { error } = on ? await supabase.from('saves').insert({ member_id: me, piece_id: piece.id }) : await supabase.from('saves').delete().eq('member_id', me).eq('piece_id', piece.id);
    if (error) setSaved(!on);
  };
  const toggleLater = async () => {
    const on = !later; setLater(on);
    const { error } = on ? await supabase.from('library').insert({ member_id: me, piece_id: piece.id }) : await supabase.from('library').delete().eq('member_id', me).eq('piece_id', piece.id);
    if (error) setLater(!on);
  };
  const toggleMark = async () => {
    const on = !marked; setMarked(on); setMarks((n) => n + (on ? 1 : -1));
    const { error } = on ? await supabase.from('piece_marks').insert({ member_id: me, piece_id: piece.id }) : await supabase.from('piece_marks').delete().eq('member_id', me).eq('piece_id', piece.id);
    if (error) { setMarked(!on); setMarks((n) => n + (on ? -1 : 1)); }
  };
  return (
    <div className="rt">
      {!mine && <button type="button" className="rt-btn" aria-pressed={marked} onClick={toggleMark}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill={marked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>
        {marked ? 'It stayed with you' : 'This stayed with me'}{marks > 0 && <span className="rt-n">{marks}</span>}</button>}
      {!mine && <button type="button" className="rt-btn" aria-pressed={saved} onClick={toggleSave}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 21V10a7 7 0 0 1 14 0v11z" /><path d="M12 12.5v4" /></svg>
        {saved ? 'In your vault' : 'Add to vault'}</button>}
      <button type="button" className="rt-btn" aria-pressed={later} onClick={toggleLater}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill={later ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M6 3.5h12v17l-6-4.2-6 4.2z" /></svg>
        {later ? 'Saved to library' : 'Save for later'}</button>
      {piece.slug && <a className="rt-go lab" href={`/guild/${piece.slug}/`}>{mine ? 'View it on the site →' : 'Reflections, on its page →'}</a>}
    </div>
  );
}

// ---------------------------------------------------------------- the prestiges

// The ten prestiges as a ladder: where you stand, how far to the next, and who holds each rank.

// ---------------------------------------------------------------- the app

export default function MembersApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [route, setRoute] = useState<Route>(readRoute());
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => { setSession(s); if (event === 'SIGNED_OUT') rememberMember(null); });
    const onPop = () => setRoute(readRoute());
    addEventListener('popstate', onPop);
    return () => { sub.subscription.unsubscribe(); removeEventListener('popstate', onPop); };
  }, []);
  useEffect(() => {
    if (!location.pathname.startsWith('/guild/members')) return;   // the Desk is showing
    document.title = `${route.p ? 'Reading' : route.m ? 'A member' : route.view === 'way' ? 'The Way' : route.view === 'following' ? 'Following' : route.view === 'library' ? 'Your library' : route.view === 'prestige' ? 'The Prestiges' : route.view === 'trophies' ? 'The Trophies' : route.view === 'rules' ? 'The forum rules' : route.view === 'mine' ? 'Your conversations' : route.view === 'inbox' || route.dm ? 'Inbox' : route.view === 'forum' || route.board || route.t ? 'The Forum' : 'The Guild'} · Overgrown Altar`;
  }, [route]);
  // Whether the one signed in is the editor (who keeps the forum: pins, closes, takes down).
  const [isEditor, setIsEditor] = useState(false);
  // The Fellowship: their own room (The Way) instead of the Guild's rooms
  const [isFellow, setIsFellow] = useState(() => { try { return !!JSON.parse(localStorage.getItem('oa_member') || '{}').fellow; } catch { return false; } });
  useEffect(() => {
    if (!session) return setIsEditor(false);
    supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      setIsEditor(seenRole(data?.role) === 'editor'); setIsFellow(seenRole(data?.role) === 'fellow');
      document.querySelectorAll<HTMLElement>('[data-editor]').forEach((el) => (el.hidden = seenRole(data?.role) !== 'editor'));   // the members' bar's Review
    });
  }, [session]);

  if (!ready) return <Loading />;
  if (session && (route.view === 'way' || (isFellow && !route.m && !route.p && !route.t && !route.board && !route.dm && !['forum', 'rules', 'mine', 'inbox', 'following', 'library'].includes(route.view ?? '')))) return <SideLayout me={session.user.id}><WayPage me={session.user.id} /></SideLayout>;
  if (route.view === 'prestige' || route.view === 'trophies') return <PrestigePage key={route.view} section={route.view === 'trophies' ? 'trophies' : 'prestige'} me={session?.user.id ?? ''} link={(to, cls, children) => <Link to={to} className={cls}>{children}</Link>} />;
  if (!session) return (
    <div className="m-gate">
      <span className="eb">Members of the Guild</span>
      <h1 className="h1" style={{ fontSize: 44 }}>For members</h1>
      <p className="it mut d-sub">The Guild’s pages are for members. Sign in at your desk to meet the others and read their work.</p>
      <a className="btn d-btn" href="/guild/desk/">Sign in</a>
      <a className="d-link" href="/guild">Apply to the Guild</a>
    </div>
  );
  const me = session.user.id;
  const page = route.t ? <ForumThread id={route.t} me={me} isEditor={isEditor} />
    : route.board ? <ForumBoard slug={route.board} me={me} isEditor={isEditor} />
    : route.view === 'forum' ? <ForumIndex me={me} isEditor={isEditor} />
    : route.view === 'rules' ? <ForumRules />
    : route.view === 'mine' ? <ForumMine me={me} />
    : route.view === 'inbox' ? <InboxList me={me} />
    : route.view === 'following' ? <Following me={me} />
    : route.view === 'library' ? <Library me={me} />
    : route.dm ? <InboxThread key={route.dm} id={route.dm} me={me} isEditor={isEditor} />
    : route.p ? <Reading id={route.p} />
    : route.m ? <MemberPage id={route.m} me={me} />
    : <Directory me={me} />;
  // Wide screens: you, your rank and trophies, in a column beside the Guild's rooms (not a member’s page
  // or a piece, which have the screen to themselves).
  return route.m || route.p ? page : <SideLayout me={me}>{page}</SideLayout>;
}

// A Fellowship member's page is their shelves: everything they've added to their vault, standing like a library.
function FellowShelf({ id, first, mine }: { id: string; first: string; mine: boolean }) {
  const items = useCollection(id);
  const [gone, setGone] = useState<Set<string>>(new Set());
  const books = (items ?? []).filter((b) => !gone.has(b.id));
  return (
    <section className="m-lib" id="collection">
      <div className="m-lib-head">
        <span className="eb">{mine ? 'Your library' : `${first}’s library`}</span>
        {items && <span className="lab mut">{books.length} {books.length === 1 ? 'artifact' : 'artifacts'} kept{mine ? ' · open for all to see' : ''}</span>}
      </div>
      {!items ? <p className="lab mut">Opening the library…</p>
        : books.length ? <Shelf books={books} onRemove={mine ? async (pid) => { setGone((g) => new Set(g).add(pid)); await supabase.from('saves').delete().eq('member_id', id).eq('piece_id', pid); } : undefined} />
        : <p className="it m-lib-none">{mine ? 'The shelves are empty. Tap “Add to vault” on any piece or photograph you love.' : `${first} hasn’t kept anything yet.`}</p>}
    </section>
  );
}

// A Fellowship member's page shows their collection (open to everyone; see /collection/).
function FellowCollection({ id, first, mine, quiet = false }: { id: string; first: string; mine: boolean; quiet?: boolean }) {
  const items = useCollection(id);
  if (quiet && (!items || (!items.length && !mine))) return null;   // on a writer's page: nothing until something is saved
  return (
    <section className="m-work m-coll" id="collection">
      <div className="m-work-head"><span className="eb">{mine ? 'Kept in your vault' : `Kept in ${first}’s vault`}</span>
        <a className="lab m-coll-share" href={`/collection/?of=${id}`}>Open the public page →</a></div>
      <CollectionWall items={items} empty={<p className="it">{mine ? 'Nothing here yet. Tap “Add to vault” on any piece or photograph you love.' : `${first} hasn’t added anything yet.`}</p>} />
    </section>
  );
}

/** On wide screens, a page with your column beside it; on narrower ones, the page alone. */
function SideLayout({ me, children }: { me: string; children: React.ReactNode }) {
  return (
    <div className="ss-layout">
      <aside className="ss-aside" aria-label="You"><SideColumn me={me} /></aside>
      <div className="ss-main">{children}</div>
    </div>
  );
}

/** Everyone you follow: their picture, name and craft, their newest work, and a way to unfollow. */
function Following({ me }: { me: string }) {
  type Row = Profile & { newest?: { title: string; slug: string | null; medium: string; published_at: string | null } };
  const [rows, setRows] = useState<Row[] | null>(null);
  const load = async () => {
    const { data: f } = await supabase.from('follows').select('followed, created_at').eq('follower', me).order('created_at', { ascending: false });
    const ids = (f ?? []).map((x: any) => x.followed);
    if (!ids.length) { setRows([]); return; }
    const [{ data: ppl }, { data: work }] = await Promise.all([
      supabase.from('profiles').select('*').in('id', ids),
      supabase.from('pieces').select('author_id, title, slug, medium, published_at').in('author_id', ids).eq('status', 'approved').lte('published_at', new Date().toISOString()).order('published_at', { ascending: false }),
    ]);
    const newest = new Map<string, any>();
    (work ?? []).forEach((w: any) => { if (!newest.has(w.author_id)) newest.set(w.author_id, w); });
    const byId = new Map((ppl ?? []).map((p: any) => [p.id, p]));
    setRows(ids.map((id: string) => byId.get(id)).filter(Boolean).map((p: any) => ({ ...p, newest: newest.get(p.id) })));
  };
  useEffect(() => { load(); }, [me]);
  return (
    <div className="fw">
      <header className="fw-head">
        <span className="eb">Writers you follow</span>
        <h1 className="h1">Following</h1>
        <p className="it mut d-sub">Their new work comes to your Desk, and to your daily letter.</p>
      </header>
      {!rows ? <p className="lab mut">Gathering…</p> : !rows.length ? (
        <div className="fw-empty"><p className="it">You aren’t following anyone yet.</p><span className="lab mut">Open any writer’s page and tap Follow.</span><Link className="lab fw-go" to="/guild/members/">Meet the Guild →</Link></div>
      ) : (
        <ul className="fw-list">
          {rows.map((p) => (
            <li key={p.id} className="fw-row">
              <Link to={`/guild/members/?m=${p.id}`} className="fw-who"><Arch p={p} /><span className="fw-t"><span className="fw-n">{p.display_name}</span><span className="lab mut">{p.craft || (isEditorRole(p.role) ? roleLabel(p.role) : 'Of the Guild')}</span></span></Link>
              {p.newest ? <a className="fw-new" href={p.newest.slug ? `/guild/${p.newest.slug}/` : undefined}><span className="lab">Newest</span><span className="it">{p.newest.title}</span></a> : <span className="it mut fw-new">Nothing published yet</span>}
              <button type="button" className="m-act fw-un" onClick={async () => { if (!confirm(`Stop following ${p.display_name}?`)) return; await supabase.from('follows').delete().eq('follower', me).eq('followed', p.id); load(); }}>Following ✓</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
