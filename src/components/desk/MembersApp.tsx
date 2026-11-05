// The Guild's members area, for signed-in members:
//   /guild/members/            the directory (everyone listed, alphabetically)
//   /guild/members/?m=<id>     a member's page: portrait, craft, bio, links, collected work
//   /guild/members/?p=<id>     reading one of their published pieces
// What anyone can see is enforced by the database's rules; this only presents it.
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, portraitUrl, rememberMember, PILLARS, MEDIUMS, type Piece, type Profile } from '../../lib/supabase';
import { Body } from '../../lib/marks';
import { Initials, Icon } from './DeskApp';
import { PrestigeBadge } from './Prestige';
import { TrophyCase, TrophyCatalogue } from './Trophies';
import { PRESTIGES, prestigeFor } from '../../lib/prestige';
import { KINDS } from '../../lib/kinds';
import { PER_PAGE, pageList } from '../../lib/pager';

type Route = { m?: string; p?: string; view?: string };
const readRoute = (): Route => {
  const q = new URLSearchParams(location.search);
  return { m: q.get('m') ?? undefined, p: q.get('p') ?? undefined, view: q.get('view') ?? undefined };
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
  return <span className="g-arch" aria-hidden="true">{src ? <img src={src} alt="" loading={big ? 'eager' : 'lazy'} /> : initials}</span>;
}

// ---------------------------------------------------------------- the directory

function Directory() {
  const [members, setMembers] = useState<(Profile & { count: number })[] | null>(null);
  useEffect(() => {
    (async () => {
      const [{ data: people }, { data: work }] = await Promise.all([
        supabase.from('profiles').select('*').eq('listed', true).order('display_name'),
        supabase.from('pieces').select('author_id').eq('status', 'approved'),
      ]);
      const counts = new Map<string, number>();
      (work ?? []).forEach((w: any) => counts.set(w.author_id, (counts.get(w.author_id) ?? 0) + 1));
      setMembers(((people as Profile[]) ?? []).map((p) => ({ ...p, count: counts.get(p.id) ?? 0 })));
    })();
  }, []);
  return (
    <div className="g-wrap">
      <header className="g-head">
        <span className="eb">The Guild</span>
        <h1 className="h1">At the table</h1>
        <p className="it mut d-sub">Everyone who has taken a seat and chosen to be listed. Open a page to meet them and read their work.</p>
        <Link className="g-prestige-link lab" to="/guild/members/?view=prestige">The ten prestiges →</Link>
      </header>
      {!members ? <p className="lab mut">Gathering the Guild…</p>
        : members.length === 0 ? <p className="it mut d-empty">No one is listed yet.</p>
        : (
          <div className="g-grid">
            {members.map((m) => (
              <Link key={m.id} to={`/guild/members/?m=${m.id}`} className="g-card">
                <Arch p={m} />
                <span className="g-name">{m.display_name || 'A member'}</span>
                <span className="lab mut g-craft">{[m.role === 'editor' ? 'Editor in Chief' : 'Writer', m.craft].filter(Boolean).join(' · ') || 'Member'}</span>
                <span className="lab mut g-craft">{m.count ? `${m.count} ${m.count === 1 ? 'piece' : 'pieces'}` : ''}</span>
                <PrestigeBadge published={m.count} link={false} />
              </Link>
            ))}
          </div>
        )}
    </div>
  );
}

// ---------------------------------------------------------------- a member's page

function MemberPage({ id, me }: { id: string; me: string }) {
  const [person, setPerson] = useState<Profile | null | undefined>(undefined);
  const [work, setWork] = useState<Piece[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [kind, setKind] = useState('all');
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
        const { data } = await supabase.storage.from('guild').createSignedUrls(paths, 3600);
        setThumbs(Object.fromEntries((data ?? []).map((d) => [d.path, d.signedUrl])));
      }
    })();
  }, [id]);

  if (person === undefined) return <p className="lab mut d-loading">Opening the page…</p>;
  if (person === null) return <div className="m-gate"><p className="it mut d-empty">This member’s page could not be found.</p><Link className="d-link" to="/guild/members/">The Guild</Link></div>;
  const site = (person.website ?? '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  const handle = (person.instagram ?? '').replace(/^@/, '');
  // Six pieces to a page, with pages below; the kind filter narrows the list first.
  const kinds = KINDS.map((k) => ({ ...k, n: work.filter((w) => w.medium === k.value).length })).filter((k) => k.n > 0);
  const shown = kind === 'all' ? work : work.filter((w) => w.medium === kind);
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const onPage = shown.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  const turn = (n: number) => { setPage(n); document.querySelector('.m-work')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const arrow = (d: 'l' | 'r') => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d={d === 'l' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} /></svg>;
  // The same page as the public writer page (/guild/authors/<name>/): an arch, the name, craft, a few lines, two link pills, then the work.
  return (
    <div className="m-page">
      <header className="m-hero">
        <Link className="m-back lab" to="/guild/members/">← The Guild</Link>
        <Arch p={person} big />
        <span className="eb">{person.role === 'editor' ? 'Editor in Chief' : 'Writer of the Guild'}</span>
        <h1 className="h1 m-name">{person.display_name || 'A member'}</h1>
        {person.craft && <span className="lab m-craft">{person.craft}</span>}
        <PrestigeBadge published={work.length} size="lg" />
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
        {person.id === me && (
          <nav className="m-actions" aria-label="My Desk">
            <a className="m-act primary" href="/guild/desk/#write">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></svg>
              Write a piece
            </a>
            <a className="m-act" href="/guild/desk/">My pieces</a>
            <a className="m-act" href="/guild/desk/#my-page">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              Edit my page
            </a>
            {work.length > 0 && <a className="m-act" href={`/guild/authors/${authorSlug(person.display_name)}/`}>Public page</a>}
            <button type="button" className="m-signout lab" onClick={async () => { rememberMember(null); await supabase.auth.signOut(); location.href = '/guild/desk/'; }}>Sign out</button>
          </nav>
        )}
        {/* Phones: the Desk's tab bar, so your own page is one of the Desk's rooms. */}
        {person.id === me && (
          <nav className="d-tabbar" aria-label="Desk">
            {([['pieces', 'Pieces', '/guild/desk/'], ['write', 'Write', '/guild/desk/#write'],
              ...(person.role === 'editor' ? [['review', 'Waiting', '/guild/desk/#review']] : []),
              ['profile', 'My page', '']] as [string, string, string][]).map(([t, label, href]) => t === 'profile'
              ? <span key={t} className="on" aria-current="page"><span className="d-tabbar-icon"><Icon name={t} /></span><span>{label}</span></span>
              : <a key={t} href={href}><span className="d-tabbar-icon"><Icon name={t} /></span><span>{label}</span></a>)}
          </nav>
        )}
      </header>
      <section className="m-work">
        <div className="m-work-head"><span className="eb">The work</span><span className="lab">{shown.length} {shown.length === 1 ? 'piece' : 'pieces'} · newest first</span></div>
        {kinds.length > 1 && (
          <div className="filters shelf-filters" role="group" aria-label="Show">
            <button type="button" className="chip" aria-pressed={kind === 'all'} onClick={() => { setKind('all'); setPage(1); }}>All<span className="chip-n">{work.length}</span></button>
            {kinds.map((k) => <button key={k.value} type="button" className="chip" aria-pressed={kind === k.value} onClick={() => { setKind(k.value); setPage(1); }}>{k.plural}<span className="chip-n">{k.n}</span></button>)}
          </div>
        )}
        {work.length === 0 ? (
          <p className="it m-none">{person.id === me ? 'Your published pieces will gather here once the editor approves them.' : 'Their first published piece is still to come.'}</p>
        ) : (
          <ol className="m-list">
            {onPage.map((w) => (
              <li key={w.id}>
                <button type="button" className="m-piece" onClick={() => go(`/guild/members/?p=${w.id}`)}>
                  <span className="m-piece-text">
                    <span className="lab m-kicker">{pillarName(w.pillar)} · {mediumName(w.medium)}</span>
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
      </section>
      <div className="m-vault" id="vault"><TrophyCase ctx={{ pieces: work, member: person }} mine={person.id === me} name={person.display_name} /></div>
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
        data.image_path ? supabase.storage.from('guild').createSignedUrl(data.image_path, 3600) : Promise.resolve({ data: null }),
      ]);
      setAuthor((a as Profile) ?? null);
      setPhoto((img as any)?.data?.signedUrl ?? '');
    })();
  }, [id]);
  if (piece === undefined) return <p className="lab mut d-loading">Opening the piece…</p>;
  if (piece === null) return <div className="m-gate"><p className="it mut d-empty">This piece is not available.</p><Link className="d-link" to="/guild/members/">The Guild</Link></div>;
  return (
    <div className="m-reading">
      <Link className="d-link" to={`/guild/members/?m=${piece.author_id}`}>← {author?.display_name ?? 'Back'}</Link>
      <article className="d-paper">
        {photo && <img className="m-photo" src={photo} alt={piece.image_alt} />}
        <span className="eb">{pillarName(piece.pillar)} · {mediumName(piece.medium)}</span>
        <h1 className="h1">{piece.title}</h1>
        {piece.standfirst && <p className="d-paper-standfirst" style={{ margin: 0 }}>{piece.standfirst}</p>}
        <Body body={piece.body} />
        {author && (
          <div className="m-byline">
            <Initials name={author.display_name} size={36} src={portraitUrl(author.portrait_path)} />
            <span className="lab">{author.display_name}{piece.published_at ? ` · ${fmt(piece.published_at)}` : ''}</span>
          </div>
        )}
      </article>
    </div>
  );
}

// ---------------------------------------------------------------- the prestiges

// The ten prestiges as a ladder: where you stand, how far to the next, and who holds each rank.
function Prestiges({ me }: { me: string }) {
  const [people, setPeople] = useState<(Profile & { count: number })[] | null>(null);
  useEffect(() => {
    (async () => {
      const [{ data: ps }, { data: work }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('pieces').select('author_id').eq('status', 'approved'),
      ]);
      const counts = new Map<string, number>();
      (work ?? []).forEach((w: any) => counts.set(w.author_id, (counts.get(w.author_id) ?? 0) + 1));
      setPeople(((ps as Profile[]) ?? []).map((p) => ({ ...p, count: counts.get(p.id) ?? 0 })));
    })();
  }, []);
  if (!people) return <p className="lab mut d-loading">Opening…</p>;
  const mine = people.find((p) => p.id === me)?.count ?? 0;
  const { current, next, toNext } = prestigeFor(mine);
  const from = current?.at ?? 0;
  const pct = next ? Math.round(((mine - from) / (next.at - from)) * 100) : 100;
  const holders = (level: number) => people.filter((p) => (p.listed || p.id === me) && prestigeFor(p.count).current?.level === level);
  return (
    <div className="pz">
      <header className="pz-head">
        {me && <Link className="m-back lab" to="/guild/members/">← The Guild</Link>}
        <span className="eb">The Guild</span>
        <h1 className="h1">The ten prestiges</h1>
        <p className="it pz-lead">Every published piece raises a member through the ranks of the Guild, from a first inkling to the burning ones. Badges update the moment the editor publishes.</p>
      </header>

      {!me ? (
        <section className="pz-you">
          <span className="lab mut">Earn your first</span>
          <span className="it pz-none">Members of the Guild rise through these ranks with every piece they publish.</span>
          <a className="m-act primary pz-write" href="/guild">Join the Guild</a>
        </section>
      ) : (
      <section className="pz-you">
        <span className="lab mut">Where you stand</span>
        {current ? <PrestigeBadge published={mine} size="lg" link={false} /> : <span className="it pz-none">Your first published piece makes you an Inkling.</span>}
        <span className="pz-count">{mine} published {mine === 1 ? 'piece' : 'pieces'}</span>
        {next && (
          <>
            <span className="pz-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
            <span className="it pz-next">{toNext} more to <b>{next.name}</b></span>
          </>
        )}
        <a className="m-act primary pz-write" href="/guild/desk/#write">Write a piece</a>
      </section>
      )}

      <ol className="pz-ladder">
        {[...PRESTIGES].reverse().map((p) => {
          const who = holders(p.level);
          const reached = current ? p.level <= current.level : false;
          return (
            <li key={p.level} className={`pz-rung${reached ? ' reached' : ''}${current?.level === p.level ? ' here' : ''}`}>
              <div className="pz-rung-badge"><PrestigeBadge published={p.at} size="lg" link={false} /></div>
              <div className="pz-rung-text">
                <span className="it pz-note">{p.note}</span>
                <span className="lab mut">{p.at} published {p.at === 1 ? 'piece' : 'pieces'}{current?.level === p.level ? ' · you are here' : ''}</span>
              </div>
              <div className="pz-who">
                {who.slice(0, 6).map((h) => (
                  me
                    ? <Link key={h.id} to={`/guild/members/?m=${h.id}`} className="pz-face"><Initials name={h.display_name} size={30} src={portraitUrl(h.portrait_path)} /></Link>
                    : <a key={h.id} href={`/guild/authors/${authorSlug(h.display_name)}/`} className="pz-face" title={h.display_name}><Initials name={h.display_name} size={30} src={portraitUrl(h.portrait_path)} /></a>
                ))}
                {who.length > 6 && <span className="lab mut">+{who.length - 6}</span>}
              </div>
            </li>
          );
        })}
      </ol>

      <section className="pz-trophies" id="trophies">
        <span className="eb">Beside the prestiges</span>
        <h2 className="h2">The trophies</h2>
        <p className="it pz-lead">Prestiges count everything you publish. Trophies mark the work in each category, raised from bronze to silver, gold and rainbow glass as it grows, and a few things done once and done well.</p>
        <div className="pz-cat"><TrophyCatalogue /></div>
      </section>
    </div>
  );
}

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
    document.title = `${route.p ? 'Reading' : route.m ? 'A member' : route.view === 'prestige' ? 'The Prestiges' : 'The Guild'} · Overgrown Altar`;
  }, [route]);

  if (!ready) return <p className="lab mut d-loading">Opening…</p>;
  if (route.view === 'prestige') return <Prestiges me={session?.user.id ?? ''} />;
  if (!session) return (
    <div className="m-gate">
      <span className="eb">Members of the Guild</span>
      <h1 className="h1" style={{ fontSize: 44 }}>For members</h1>
      <p className="it mut d-sub">The Guild’s pages are for members. Sign in at your desk to meet the others and read their work.</p>
      <a className="btn d-btn" href="/guild/desk/">Sign in</a>
      <a className="d-link" href="/guild">Apply to the Guild</a>
    </div>
  );
  if (route.p) return <Reading id={route.p} />;
  if (route.m) return <MemberPage id={route.m} me={session.user.id} />;
  return <Directory />;
}
