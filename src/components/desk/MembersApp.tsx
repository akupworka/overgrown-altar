// The Guild's members area, for signed-in members:
//   /guild/members/            the directory (everyone listed, alphabetically)
//   /guild/members/?m=<id>     a member's page: portrait, craft, bio, links, collected work
//   /guild/members/?p=<id>     reading one of their published pieces
// What anyone can see is enforced by the database's rules; this only presents it.
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, portraitUrl, rememberMember, PILLARS, MEDIUMS, type Piece, type Profile } from '../../lib/supabase';
import { Body } from '../../lib/marks';
import { Initials } from './DeskApp';

type Route = { m?: string; p?: string };
const readRoute = (): Route => {
  const q = new URLSearchParams(location.search);
  return { m: q.get('m') ?? undefined, p: q.get('p') ?? undefined };
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
      </header>
      {!members ? <p className="lab mut">Gathering the Guild…</p>
        : members.length === 0 ? <p className="it mut d-empty">No one is listed yet.</p>
        : (
          <div className="g-grid">
            {members.map((m) => (
              <Link key={m.id} to={`/guild/members/?m=${m.id}`} className="g-card">
                <Arch p={m} />
                <span className="g-name">{m.display_name || 'A member'}</span>
                <span className="lab mut g-craft">{[m.role === 'editor' ? 'Editor' : '', m.craft].filter(Boolean).join(' · ') || 'Member'}</span>
                <span className="lab mut g-craft">{m.count ? `${m.count} ${m.count === 1 ? 'piece' : 'pieces'}` : ''}</span>
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
  // The same page as the public writer page (/guild/authors/<name>/): an arch, the name, craft, a few lines, two link pills, then the work.
  return (
    <div className="m-page">
      <header className="m-hero">
        <Link className="m-back lab" to="/guild/members/">← The Guild</Link>
        <Arch p={person} big />
        <span className="eb">{person.role === 'editor' ? 'Editor of the Guild' : 'Of the Guild'}</span>
        <h1 className="h1 m-name">{person.display_name || 'A member'}</h1>
        {person.craft && <span className="lab m-craft">{person.craft}</span>}
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
            <a className="m-act" href="/guild/desk/#my-page">Edit my page</a>
            {person.role === 'editor' && <a className="m-act" href="/guild/desk/#review">Review submissions</a>}
            {work.length > 0 && <a className="m-act" href={`/guild/authors/${authorSlug(person.display_name)}/`}>Public page</a>}
            <button type="button" className="m-signout lab" onClick={async () => { rememberMember(null); await supabase.auth.signOut(); location.href = '/guild/desk/'; }}>Sign out</button>
          </nav>
        )}
      </header>
      <section className="m-work">
        <div className="m-work-head"><span className="eb">The work</span><span className="lab">{work.length} {work.length === 1 ? 'piece' : 'pieces'} · newest first</span></div>
        {work.length === 0 ? (
          <p className="it m-none">{person.id === me ? 'Your published pieces will gather here once the editor approves them.' : 'Their first published piece is still to come.'}</p>
        ) : (
          <ol className="m-list">
            {work.map((w) => (
              <li key={w.id}>
                <button type="button" className="m-piece" onClick={() => go(`/guild/members/?p=${w.id}`)}>
                  <span className="m-piece-text">
                    <span className="lab m-kicker">{pillarName(w.pillar)} · {mediumName(w.medium)}</span>
                    <span className="h3">{w.title}</span>
                    {w.standfirst && <span className="it m-sf">{w.standfirst}</span>}
                    {w.published_at && <span className="lab m-date">{fmt(w.published_at)}</span>}
                  </span>
                  <span className="m-thumb">{w.image_path && thumbs[w.image_path] ? <img src={thumbs[w.image_path]} alt="" loading="lazy" /> : null}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
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
    document.title = `${route.p ? 'Reading' : route.m ? 'A member' : 'The Guild'} · Overgrown Altar`;
  }, [route]);

  if (!ready) return <p className="lab mut d-loading">Opening…</p>;
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
