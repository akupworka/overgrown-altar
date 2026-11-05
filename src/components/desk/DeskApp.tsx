// The Guild Desk: where members (and the editor) sign in, write, and submit pieces.
// Everything a member can see or change is enforced by the database's rules in Supabase;
// this screen only makes it pleasant to use.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createPortal } from 'react-dom';
import { Body, wantsDropCap } from '../../lib/marks';
import { Doorway, Line, Arrow } from './Doorway';
import { shrinkImage, TooSmall } from '../../lib/shrink';
// Featured photographs fill the width of the page, so they need to be at least this many pixels wide.
const MIN_PHOTO_WIDTH = 1600;
import { PrestigeBadge } from './Prestige';
import { prestigeFor } from '../../lib/prestige';
import { TROPHIES, trophiesFor, finestFirst, trophySvg, TIER_LABEL, type Tier, type TrophyCtx } from '../../lib/trophies';
import { RichBody, useRichBody, TOOL_LABELS, applyTool, isOn, insertPhoto } from './RichBody';
import '../../styles/guild-piece.css';
import { supabase, STATUS_LABEL, PILLARS, MEDIUMS, mediumsFor, fitMedium, portraitUrl, rememberMember, type Piece, type Profile } from '../../lib/supabase';

// Read the invitation / password-reset marker before Supabase tidies the address bar.
const startHash = typeof window !== 'undefined' ? window.location.hash : '';
const arrivedToSetPassword = /type=(invite|recovery)/.test(startHash);

// ---------------------------------------------------------------- small pieces

function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    const m = matchMedia(query); const on = () => setMatch(m.matches);
    m.addEventListener('change', on); return () => m.removeEventListener('change', on);
  }, [query]);
  return match;
}

const ICONS: Record<string, ReactNode> = {
  pieces: <path d="M5 6h14M5 12h14M5 18h9" />,
  write: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></>,
  review: <><path d="M4 13l2.5-7h11L20 13v5H4v-5z" /><path d="M4 13h5l1 2h4l1-2h5" /></>,
  profile: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5" /></>,
};
const Icon = ({ name }: { name: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name]}</svg>
);

function Glass({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`glass-card ${className}`}>
      <div className="gc-halo" aria-hidden="true"><div className="gc-clip"><span /></div></div>
      <div className="gc-edge" aria-hidden="true"><span /></div>
      <div className="gc-pane">{children}</div>
    </div>
  );
}

export function Initials({ name, size = 40, src }: { name: string; size?: number; src?: string }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '·';
  return (
    <span className="d-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }} aria-hidden="true">
      {src ? <img src={src} alt="" /> : initials}
    </span>
  );
}

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

// ---------------------------------------------------------------- signed out

function SignIn() {
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok?: boolean } | null>(null);
  const [shake, setShake] = useState(0);

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setMsg({ text: error.message.includes('Invalid') ? 'That email and password do not match.' : error.message }); setShake((n) => n + 1); }
  }
  async function sendReset(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/guild/desk/` });
    setBusy(false);
    setMsg(error ? { text: error.message } : { text: 'If that email belongs to a member, a link is on its way.', ok: true });
  }

  return mode === 'signin' ? (
    <div key={shake} className={`dw-holder ${msg && !msg.ok ? 'dw-wrong' : ''}`}>
      <Doorway kicker="Members of the Guild" title="The Guild Desk" lead="Your drafts, your pieces with the editor, and the page readers see when they meet you."
        foot={<>Not yet at the table? <a href="/guild">Apply to the Guild</a></>}>
        <form onSubmit={signIn} className={shake ? 'dw-shake-now' : ''}>
          <Line label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Line label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
            action={<button type="submit" className="dw-go" disabled={busy}>{busy ? 'Opening…' : 'Sign in'}<Arrow /></button>} />
          <p className={`dw-notice ${msg?.ok ? 'ok' : ''}`} role="status" aria-live="polite">{msg?.text ?? ''}</p>
        </form>
        <div className="dw-links"><button type="button" className="dw-text" onClick={() => { setMode('forgot'); setMsg(null); }}>Forgot your password?</button></div>
      </Doorway>
    </div>
  ) : (
    <Doorway kicker="Members of the Guild" title="A new key" lead="Enter your email and we will send you a link to set a new password.">
      <form onSubmit={sendReset}>
        <Line label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          action={<button type="submit" className="dw-go" disabled={busy}>{busy ? 'Sending…' : 'Send'}<Arrow /></button>} />
        <p className={`dw-notice ${msg?.ok ? 'ok' : ''}`} role="status" aria-live="polite">{msg?.text ?? ''}</p>
      </form>
      <div className="dw-links"><button type="button" className="dw-text" onClick={() => { setMode('signin'); setMsg(null); }}>Back to sign in</button></div>
    </Doorway>
  );
}

function SetPassword({ onDone, invited }: { onDone: () => void; invited: boolean }) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    if (pw.length < 8) return setMsg('Please use at least 8 characters.');
    if (pw !== pw2) return setMsg('The two passwords do not match.');
    setBusy(true);
    const { data, error } = await supabase.auth.updateUser({ password: pw });
    if (!error && invited && name.trim() && data.user) {
      await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', data.user.id);
    }
    setBusy(false);
    if (error) return setMsg(error.message);
    history.replaceState(null, '', '/guild/desk/');
    onDone();
  }
  return (
    <Doorway kicker={invited ? 'Welcome to the Guild' : 'Members of the Guild'} title={invited ? 'Take your seat' : 'Set a new password'}
      lead={invited ? 'Choose the name readers will see, and a password for your desk.' : 'Choose a new password for your desk.'}>
      <form onSubmit={save}>
        {invited && <Line label="Your name, as readers will see it" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />}
        <Line label="New password" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        <Line label="Once more" type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)}
          action={<button type="submit" className="dw-go" disabled={busy}>{busy ? 'Saving…' : 'Enter'}<Arrow /></button>} />
        <p className="dw-notice" role="alert">{msg}</p>
      </form>
    </Doorway>
  );
}

// ---------------------------------------------------------------- signed in

type Tab = 'pieces' | 'write' | 'review' | 'profile';

function Desk({ session }: { session: Session }) {
  const uid = session.user.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [queue, setQueue] = useState<(Piece & { profiles?: { display_name: string } })[]>([]);
  // Arriving at /guild/desk/#write (from the menu's "Write a piece") opens a fresh sheet straight away.
  // Links from elsewhere can open a section directly: #write, #my-page, #review.
  const [tab, setTab] = useState<Tab>(startHash.startsWith('#write') ? 'write' : startHash === '#my-page' ? 'profile' : startHash === '#review' ? 'review' : 'pieces');
  useEffect(() => { if (startHash === '#my-page' || startHash === '#review') history.replaceState(null, '', location.pathname + location.search); }, []);
  const after = useRef<Tab | null>(null);
  const tabNow = useRef(tab); tabNow.current = tab;
  const [editing, setEditing] = useState<Piece | null>(null);
  const [reading, setReading] = useState<Piece | null>(null);
  const isEditor = profile?.role === 'editor';

  const load = useCallback(async () => {
    const [{ data: p }, { data: mine }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('pieces').select('*').eq('author_id', uid).order('updated_at', { ascending: false }),
    ]);
    setProfile(p as Profile);
    rememberMember(p as Profile);
    setPieces((mine as Piece[]) ?? []);
    if ((p as Profile)?.role === 'editor') {
      const { data: q } = await supabase.from('pieces').select('*, profiles(display_name)').or('status.eq.submitted,revision.not.is.null').order('submitted_at', { ascending: true });
      setQueue((q as any) ?? []);
    }
  }, [uid]);
  useEffect(() => { load(); }, [load]);

  const name = profile?.display_name || session.user.email || '';
  // Writing gets its own place in the browser's history, so the phone's Back gesture returns to your pieces
  // (the sheet saves itself on the way out) instead of leaving the Desk.
  const leavingWrite = (t: Tab) => {
    if (history.state?.desk === 'write') {
      // Step back past every writing page (Write, Label it, Review) to the page underneath.
      const depth = Math.max(0, ['#write', '#write-label', '#write-review'].indexOf(location.hash)) + 1;
      after.current = t; history.go(-depth); return true;
    }
    if (location.hash.startsWith('#write')) history.replaceState(null, '', location.pathname + location.search);
    return false;
  };
  const go = (t: Tab) => {
    if (tab === 'write' && t !== 'write' && leavingWrite(t)) return;
    if (t === 'write' && tab !== 'write') { setEditing(null); history.pushState({ desk: 'write' }, '', '#write'); }
    setTab(t); setReading(null); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const open = (p: Piece | null) => {
    if (tab !== 'write') history.pushState({ desk: 'write' }, '', '#write');
    setEditing(p); setTab('write'); window.scrollTo({ top: 0 });
  };
  // Arrived straight at the sheet: put "my pieces" underneath it, so Back lands there.
  useEffect(() => {
    if (startHash.startsWith('#write') && history.state?.desk !== 'write') {
      history.replaceState(null, '', location.pathname + location.search);
      history.pushState({ desk: 'write' }, '', '#write');
    }
  }, []);
  useEffect(() => {
    const onPop = () => {
      if (location.hash.startsWith('#write')) { if (tabNow.current !== 'write') setEditing(null); setTab('write'); return; }
      setTab(after.current ?? 'pieces'); after.current = null; setReading(null); window.scrollTo({ top: 0 }); load();
    };
    addEventListener('popstate', onPop); return () => removeEventListener('popstate', onPop);
  }, [load]);
  const items: [Tab, string, number?][] = [
    ['pieces', 'My pieces'], ['write', editing ? 'Editing' : 'Write'],
    ...(isEditor ? [['review', 'Waiting for you', queue.length] as [Tab, string, number]] : []),
    ['profile', 'My page'],
  ];
  const short: Record<Tab, string> = { pieces: 'Pieces', write: 'Write', review: 'Waiting', profile: 'My page' };

  return (
    <div className={`d-room ${tab === 'write' ? 'writing' : ''}`}>
      <aside className="d-side">
        <div className="d-me">
          <Initials name={name} size={44} src={portraitUrl(profile?.portrait_path)} />
          <div className="d-me-text">
            <span className="d-me-name">{name}</span>
            <span className="lab mut">{isEditor ? 'Editor' : 'Member of the Guild'}</span>
          </div>
        </div>
        <nav className="d-nav" aria-label="Desk">
          {items.map(([t, label, n]) => (
            <button key={t} type="button" className={`d-nav-item ${tab === t ? 'on' : ''}`} aria-current={tab === t ? 'page' : undefined} onClick={() => go(t)}>
              <span>{label}</span>{n ? <span className="d-count">{n}</span> : null}
            </button>
          ))}
        </nav>
        <div className="d-side-links">
          <a className="d-side-link" href={`/guild/members/?m=${uid}`}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c1.2-3.6 4-5 7-5s5.8 1.4 7 5" /></svg>
            View my page<span aria-hidden="true">→</span></a>
          <a className="d-side-link" href="/guild/members/">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 20v-7a2.5 2.5 0 0 1 5 0v7M9.5 20v-9a2.5 2.5 0 0 1 5 0v9M16 20v-7a2.5 2.5 0 0 1 5 0v7M2 20h20" /></svg>
            The Guild<span aria-hidden="true">→</span></a>
        </div>
        <button type="button" className="d-signout" onClick={() => { rememberMember(null); supabase.auth.signOut(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" /></svg>
          Sign out</button>
      </aside>

      <div className="d-main">
        {tab === 'pieces' && <Pieces name={name} profile={profile} pieces={pieces} waiting={isEditor ? queue.length : 0} onReview={() => go('review')} onOpen={open} onChanged={load} />}
        {tab === 'write' && <Editor key={editing?.id ?? 'new'} uid={uid} author={profile} piece={editing} isEditor={isEditor} onSaved={() => load()} onDone={() => { go('pieces'); load(); }} />}
        {tab === 'review' && isEditor && (reading
          ? <Reader piece={reading} onBack={() => setReading(null)} onDecided={() => { setReading(null); load(); }} />
          : <Queue queue={queue} onRead={setReading} />)}
        {tab === 'profile' && profile && <ProfileForm profile={profile} onSaved={load} />}
      </div>

      {/* Phones: an app-style tab bar within thumb's reach. */}
      <nav className="d-tabbar" aria-label="Desk">
        {items.map(([t, , n]) => (
          <button key={t} type="button" className={tab === t ? 'on' : ''} aria-current={tab === t ? 'page' : undefined} onClick={() => go(t)}>
            <span className="d-tabbar-icon"><Icon name={t} />{n ? <span className="d-tabbar-dot">{n}</span> : null}</span>
            <span>{short[t]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// Your standing: the prestige you hold and how close the next is, beside your finest trophies.
function Standing({ published, ctx, uid }: { published: number; ctx: TrophyCtx; uid?: string }) {
  const { current, next, toNext } = prestigeFor(published);
  const from = current?.at ?? 0;
  const pct = next ? Math.max(4, Math.round(((published - from) / (next.at - from)) * 100)) : 100;
  const earned = finestFirst(trophiesFor(ctx).filter((t) => t.earned));
  const tally = (['rainbow', 'gold', 'silver', 'bronze'] as Tier[]).map((t) => ({ t, n: earned.filter((x) => x.tier === t).length })).filter((x) => x.n);
  return (
    <div className="d-standing">
      <div className="d-standing-rank">
        <span className="lab d-standing-k">Your prestige</span>
        {current ? <PrestigeBadge published={published} size="lg" /> : <span className="it d-standing-none">Your first published piece makes you an Inkling.</span>}
        {next && (
          <div className="d-standing-prog">
            <span className="d-standing-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
            <span className="it">{toNext} more published {toNext === 1 ? 'piece' : 'pieces'} to <b>{next.name}</b></span>
          </div>
        )}
        <a className="lab d-standing-link" href="/guild/members/?view=prestige">The ladder →</a>
      </div>
      <div className="d-standing-vault">
        <span className="lab d-standing-k">Your vault</span>
        {earned.length ? (
          <div className="d-standing-medals">
            {earned.slice(0, 3).map(({ trophy: t, tier }) => (
              <span key={t.id} className="d-standing-medal" title={`${t.name} · ${TIER_LABEL[tier]}`} dangerouslySetInnerHTML={{ __html: trophySvg(t, 60, tier) }} />
            ))}
          </div>
        ) : <span className="it d-standing-none">Trophies gather here as your work is published.</span>}
        <span className="d-standing-tally">{tally.map(({ t, n }) => <span key={t} data-tier={t}><i />{n}</span>)}{earned.length > 0 && <em>{earned.length} of {TROPHIES.length}</em>}</span>
        {uid && <a className="lab d-standing-link" href={`/guild/members/?m=${uid}#vault`}>Open your vault →</a>}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: Piece['status'] }) {
  return <span className={`d-status s-${status}`}><i aria-hidden="true" />{STATUS_LABEL[status]}</span>;
}

// "Eden Albright" is greeted as Eden; a name that begins with an article ("The Watchman") is greeted whole.
const firstName = (n: string) => { const w = n.trim().split(/\s+/); return /^(the|a|an)$/i.test(w[0] ?? '') ? n.trim() : (w[0] ?? ''); };

function Pieces({ name, profile, pieces, waiting = 0, onReview, onOpen, onChanged }: { name: string; profile: Profile | null; pieces: Piece[]; waiting?: number; onReview?: () => void; onOpen: (p: Piece | null) => void; onChanged: () => void }) {
  const counts = useMemo(() => ({
    published: pieces.filter((p) => p.status === 'approved').length,
    waiting: pieces.filter((p) => p.status === 'submitted').length,
    drafts: pieces.filter((p) => p.status === 'draft' || p.status === 'returned').length,
  }), [pieces]);
  async function withdraw(p: Piece) {
    await supabase.from('pieces').update({ status: 'draft' }).eq('id', p.id); onChanged();
  }
  async function remove(p: Piece) {
    if (!confirm(`Delete “${p.title || 'Untitled'}”? This cannot be undone.`)) return;
    await supabase.from('pieces').delete().eq('id', p.id); onChanged();
  }
  return (
    <section className="d-section d-home">
      <header className="d-home-head">
        <div className="d-home-hello">
          <span className="eb">The Guild Desk</span>
          <h1 className="h1 d-hello">{greeting()}, {firstName(name)}</h1>
          <p className="d-tally">
            <span><b>{counts.published}</b> published</span><span><b>{counts.waiting}</b> with the editor</span><span><b>{counts.drafts}</b> {counts.drafts === 1 ? 'draft' : 'drafts'}</span>
          </p>
        </div>
        <button type="button" className="btn d-btn d-begin" onClick={() => onOpen(null)}>Begin a new piece</button>
      </header>
      <Standing published={counts.published} ctx={{ pieces: pieces.filter((p) => p.status === 'approved'), member: profile ?? {} }} uid={profile?.id} />
      {waiting > 0 && (
        <button type="button" className="d-waiting" onClick={onReview}>
          <span className="d-waiting-dot" aria-hidden="true" />
          <span>{waiting === 1 ? 'One piece is' : `${waiting} pieces are`} waiting for your review</span>
          <span className="lab">Review →</span>
        </button>
      )}
      <div className="d-row-head"><h2 className="eb">My pieces</h2>{pieces.length > 0 && <span className="lab mut">{pieces.length} in all · newest first</span>}</div>
      {pieces.length === 0 ? (
        <button type="button" className="d-first" onClick={() => onOpen(null)}>
          <span className="it">Every piece begins with a title.</span>
          <span className="lab">Begin writing →</span>
        </button>
      ) : (
        <ul className="d-list">
          {pieces.map((p) => (
            <li key={p.id} className="d-item">
              <div className="d-item-main">
                <span className="h3 d-item-title">{p.title || 'Untitled'}</span>
                <span className="d-meta"><StatusChip status={p.status} />{p.revision && <span className="lab d-rev-tag">Changes with the editor</span>}<span className="lab mut">{PILLARS.find((x) => x.value === p.pillar)?.label.split(' · ')[0]} · {words(p.body)} words · {fmt(p.updated_at)}</span></span>
                {p.status === 'returned' && p.editor_note && <p className="d-note"><span className="lab">The editor’s note</span>{p.editor_note}</p>}
              </div>
              <div className="d-item-actions">
                {(p.status === 'draft' || p.status === 'returned') && <button type="button" className="d-link" onClick={() => onOpen(p)}>Continue writing</button>}
                {p.status === 'submitted' && <button type="button" className="d-link" onClick={() => withdraw(p)}>Withdraw to edit</button>}
                {p.status === 'approved' && <button type="button" className="d-link" onClick={() => onOpen(p)}>{p.revision ? 'Edit your changes' : 'Edit'}</button>}
                {p.status === 'approved' && p.slug && <a className="d-link" href={`/guild/${p.slug}/`}>View on the site</a>}
                {(p.status === 'draft' || p.status === 'returned') && <button type="button" className="lab d-textbtn d-danger" onClick={() => remove(p)}>Delete</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Editor({ uid, author = null, piece, isEditor = false, onSaved, onDone }: { uid: string; author?: Profile | null; piece: Piece | null; isEditor?: boolean; onSaved: (p: Piece) => void; onDone: () => void }) {
  const phone = useMedia('(max-width: 700px)');
  // A published piece: the editor's changes go live directly; a member's go to the editor as a revision.
  const live = piece?.status === 'approved';
  const start = (live && !isEditor && piece?.revision) ? { ...piece, ...piece.revision } : piece;
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({
    title: start?.title ?? '', standfirst: start?.standfirst ?? '', body: start?.body ?? '',
    pillar: piece?.pillar ?? 'hearth', medium: fitMedium(piece?.pillar ?? 'hearth', piece?.medium ?? 'prose'),
    image_path: start?.image_path ?? null as string | null, image_alt: start?.image_alt ?? '',
  });
  const [id, setId] = useState<string | null>(piece?.id ?? null);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(piece ? 'saved' : 'idle');
  const [msg, setMsg] = useState('');
  const [photoMsg, setPhotoMsg] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  // The piece itself, styled as you write (bold, italic, headings, pull quotes, verses).
  const rich = useRichBody(start?.body ?? '', (marks) => set('body', marks));
  const timer = useRef<number | undefined>(undefined);
  const set = (k: keyof typeof form, v: any) => { setForm((f) => ({ ...f, [k]: v })); setState('idle'); };
  // Choosing a pillar narrows the kinds of piece to the ones it takes.
  const choosePillar = (v: string) => { setForm((f) => ({ ...f, pillar: v, medium: fitMedium(v, f.medium) })); setState('idle'); };
  const kinds = mediumsFor(form.pillar);
  // The sheet grows with the writing, like paper, instead of scrolling inside a box.
  useEffect(() => {
    for (const el of [bodyRef.current, document.getElementById('d-title') as HTMLTextAreaElement | null]) {
      if (!el) continue; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px';
    }
  }, [form.body, form.title]);

  useEffect(() => {
    if (!form.image_path) return setPreview(null);
    supabase.storage.from('guild').createSignedUrl(form.image_path, 3600).then(({ data }) => setPreview(data?.signedUrl ?? null));
  }, [form.image_path]);

  const save = useCallback(async (status: 'draft' | 'submitted' = 'draft') => {
    setState('saving'); setMsg('');
    if (live && id) {
      if (isEditor) {   // the editor's own edits to a live piece go live (the site rebuilds)
        const res = await supabase.from('pieces').update({ ...form }).eq('id', id).select().single();
        if (res.error) { setState('error'); setMsg(res.error.message); return null; }
        setState('saved'); onSaved(res.data as Piece); return res.data as Piece;
      }
      const { error } = await supabase.rpc('propose_revision', { p_id: id, p_rev: { title: form.title, standfirst: form.standfirst, body: form.body, image_path: form.image_path, image_alt: form.image_alt } });
      if (error) { setState('error'); setMsg(error.message); return null; }
      setState('saved'); return piece;
    }
    const row = { ...form, status };
    const res = id
      ? await supabase.from('pieces').update(row).eq('id', id).select().single()
      : await supabase.from('pieces').insert(row).select().single();
    if (res.error) { setState('error'); setMsg(res.error.message); return null; }
    setId(res.data.id); setState('saved'); onSaved(res.data as Piece);
    return res.data as Piece;
  }, [form, id, onSaved, live, isEditor, piece]);

  // Quietly keep the draft safe while writing.
  useEffect(() => {
    if (live || state !== 'idle' || (!form.title.trim() && !form.body.trim())) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => save('draft'), 1800);
    return () => window.clearTimeout(timer.current);
  }, [form, state, save]);

  // Leaving the sheet (Back, or another tab) with unsaved words: save them as a draft on the way out.
  const latest = useRef({ state, save, has: false });
  latest.current = { state, save, has: !!(form.title.trim() || form.body.trim()) };
  useEffect(() => () => { const l = latest.current; if (!live && l.state === 'idle' && l.has) l.save('draft'); }, []);

  // Warn before leaving with unsaved words.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (state === 'idle' || state === 'saving') { e.preventDefault(); } };
    addEventListener('beforeunload', warn); return () => removeEventListener('beforeunload', warn);
  }, [state]);

  // A photograph inside the piece: resized, stored in the public media store, and placed where the writer is.
  const inlineInput = useRef<HTMLInputElement>(null);
  async function addInlinePhoto(file: File) {
    setMsg('Preparing the photograph…');
    let blob: Blob;
    try { blob = await shrinkImage(file, 2000, 0.86); } catch { return setMsg('This photograph couldn’t be opened. Try a JPG or PNG.'); }
    const path = `${uid}/${crypto.randomUUID()}.jpg`;
    setMsg('Uploading the photograph…');
    const { error } = await supabase.storage.from('media').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) return setMsg('The photograph didn’t upload. Please try again. (' + error.message + ')');
    const url = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
    const caption = (prompt('A caption for this photograph (optional). It also describes it for readers who can’t see it.') ?? '').trim();
    setMsg('');
    insertPhoto(rich, url, caption);
  }

  // The featured photograph: shrunk in the browser first (any phone photo works), then uploaded.
  async function upload(file: File) {
    setPhotoMsg('Preparing the photograph…');
    let blob: Blob;
    try { blob = await shrinkImage(file, 2560, 0.88, MIN_PHOTO_WIDTH); }
    catch (e) {
      if (e instanceof TooSmall) return setPhotoMsg(`This photo is ${e.width} × ${e.height} pixels, too small to look sharp across the page. Please choose one at least ${MIN_PHOTO_WIDTH} pixels wide. A photo straight from your phone’s camera works.`);
      return setPhotoMsg('This photograph couldn’t be opened. Try a JPG or PNG.');
    }
    const path = `${uid}/${crypto.randomUUID()}.jpg`;
    setPhotoMsg('Uploading the photograph…');
    const { error } = await supabase.storage.from('guild').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) return setPhotoMsg('The photograph didn’t upload. Please try again. (' + error.message + ')');
    setPhotoMsg(''); set('image_path', path);
  }

  async function submit() {
    if (!form.title.trim() || words(form.body) < 20) { setMsg('Give it a title and at least a few lines before sending it to the editor.'); return; }
    if (live) {
      if (!confirm(isEditor ? 'Update the live piece on the site now?' : 'Send these changes to the editor? The live piece stays as it is until they are approved.')) return;
      if (await save()) onDone();
      return;
    }
    if (isEditor) {
      if (!confirm('Publish this piece to the site now?')) return;
      const draft = await save('draft');
      if (!draft) return;
      const { error } = await supabase.from('pieces').update({ status: 'approved' }).eq('id', draft.id);
      if (error) { setMsg(error.message); return; }
      onDone(); return;
    }
    if (!confirm('Send this piece to the editor? You can withdraw it later to keep editing.')) return;
    const p = await save('submitted');
    if (p) onDone();
  }

  // ---- Phones: three pages, one thing at a time. 1 Write · 2 Label it · 3 Review & publish.
  // Each page has its own place in the browser history, so the Back gesture steps back a page.
  const STEP_HASH = ['#write', '#write-label', '#write-review'];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const onPop = () => { const i = STEP_HASH.indexOf(location.hash); if (i >= 0) { setStep(i); window.scrollTo({ top: 0 }); } };
    addEventListener('popstate', onPop); return () => removeEventListener('popstate', onPop);
  }, []);
  const toStep = (i: number) => {
    if (i > step) { history.pushState({ desk: 'write' }, '', STEP_HASH[i]); setStep(i); window.scrollTo({ top: 0 }); if (state === 'idle') save('draft'); }
    else if (history.state?.desk === 'write' && location.hash === STEP_HASH[step] && step > 0) history.go(i - step);
    else { setStep(i); window.scrollTo({ top: 0 }); }
  };
  const saved = state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Not saved' : (form.title || form.body) ? 'Unsaved' : '';
  const note = live
    ? <p className="d-note d-note-live"><span className="lab">This piece is live</span>{isEditor ? 'Your changes go live as soon as you update it.' : piece?.revision ? 'Your changes are with the editor. The live piece stays as it is until they approve them. You can keep editing, or withdraw them.' : 'Your changes go to the editor. The live piece stays as it is until they approve them.'}
        {!isEditor && piece?.revision && <button type="button" className="d-link" onClick={async () => { if (!confirm('Withdraw your changes? The live piece stays as it is.')) return; await supabase.rpc('propose_revision', { p_id: piece.id, p_rev: null }); onDone(); }}>Withdraw changes</button>}</p>
    : piece?.status === 'returned' && piece.editor_note ? <p className="d-note"><span className="lab">The editor’s note</span>{piece.editor_note}</p> : null;
  const sendLabel = live ? (isEditor ? 'Update live piece' : 'Send changes') : (isEditor ? 'Publish' : 'Send to the editor');

  const paper = (
    <article className="d-paper">
      <label className="visually-hidden" htmlFor="d-title">Title</label>
      <textarea id="d-title" className="d-paper-title" rows={1} placeholder="Title" maxLength={200} value={form.title}
        onChange={(e) => { set('title', e.target.value); e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} />
      <label className="visually-hidden" htmlFor="d-standfirst">Standfirst</label>
      <textarea id="d-standfirst" className="d-paper-standfirst" rows={2} placeholder="One sentence: what this piece is" maxLength={400} value={form.standfirst} onChange={(e) => set('standfirst', e.target.value)} />
      <div className="d-paper-tools" role="toolbar" aria-label="Formatting">
        {TOOL_LABELS.map((t) => (
          <button key={t.tool} type="button" title={t.hint} className={isOn(rich, t.tool) ? 'on' : ''} aria-pressed={isOn(rich, t.tool)}
            onMouseDown={(e) => e.preventDefault()} onClick={() => applyTool(rich, t.tool)}>{t.label}</button>
        ))}
        <button type="button" className="d-tool-photo" title="Put a photograph here, in the piece" onMouseDown={(e) => e.preventDefault()} onClick={() => inlineInput.current?.click()}>+ Photo</button>
        <input ref={inlineInput} type="file" accept="image/*" className="visually-hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) addInlinePhoto(f); }} />
      </div>
      <RichBody editor={rich} />
      <span className="d-paper-count">{words(form.body)} words</span>
    </article>
  );
  const photo = (
    <>
      <label className="d-photo-frame">
        {preview ? <img src={preview} alt="" /> : <span className="lab mut">Add a photograph</span>}
        <input type="file" className="visually-hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f); }} />
      </label>
      {photoMsg && <p className="d-photo-msg" role="status">{photoMsg}</p>}
    </>
  );

  if (phone) {
    const titles = ['Write', 'Label it', 'Review'];
    const pillar = PILLARS.find((x) => x.value === form.pillar);
    const firstPara = form.body.split(/\n\s*\n/).find((x) => x.trim() && !/^[#>+]/.test(x.trim())) ?? '';
    return (
      <section className={`d-write d-steps step-${step}`}>
        {showPreview && <PiecePreview form={form} photo={preview} author={author} onClose={() => setShowPreview(false)} />}
        <div className="d-write-bar">
          <button type="button" className="d-link d-close" onClick={() => (step === 0 ? onDone() : toStep(step - 1))} aria-label={step === 0 ? 'Back to my pieces' : `Back to ${titles[step - 1]}`}><span aria-hidden="true">←</span></button>
          <span className="d-step-title"><span className="d-step-n lab">{step + 1} of 3</span><span className="d-step-name">{titles[step]}</span></span>
          <span className="lab mut d-state" role="status" aria-live="polite">{saved}</span>
          {step < 2
            ? <button type="button" className="btn d-btn d-next" onClick={() => toStep(step + 1)}>Next</button>
            : <button type="button" className="btn d-btn d-next" onClick={submit} disabled={state === 'saving'}>{live ? (isEditor ? 'Update' : 'Send') : (isEditor ? 'Publish' : 'Send')}</button>}
          <span className="d-progress" aria-hidden="true"><i className="on" /><i className={step >= 1 ? 'on' : ''} /><i className={step >= 2 ? 'on' : ''} /></span>
        </div>
        <p className="it d-notice" role="alert">{msg}</p>

        {step === 0 && <>{note}{paper}</>}

        {step === 1 && (
          <div className="d-step">
            <h2 className="d-step-h">Where does it belong?</h2>
            <div className="d-pillars" role="radiogroup" aria-label="Pillar">
              {PILLARS.map((x) => {
                const [name, sub] = x.label.split(' · ');
                return (
                  <label key={x.value} className={`d-pillar ${form.pillar === x.value ? 'on' : ''}`}>
                    <input type="radio" name="pillar" value={x.value} checked={form.pillar === x.value} onChange={() => choosePillar(x.value)} />
                    <span className="d-pillar-name">{name}</span><span className="d-pillar-sub">{sub}</span>
                  </label>
                );
              })}
            </div>
            <h2 className="d-step-h">What kind of piece?</h2>
            {kinds.length === 1 ? <p className="d-medium-only"><span className="d-medium on">{kinds[0].label}</span><span className="it">{PILLARS.find((x) => x.value === form.pillar)?.label.split(' · ')[0]} takes essays and dispatches.</span></p> :
            <div className="d-mediums" role="radiogroup" aria-label="Medium">
              {kinds.map((m) => (
                <label key={m.value} className={`d-medium ${form.medium === m.value ? 'on' : ''}`}>
                  <input type="radio" name="medium" value={m.value} checked={form.medium === m.value} onChange={() => set('medium', m.value)} />{m.label}
                </label>
              ))}
            </div>}
            <h2 className="d-step-h">A photograph <span className="d-opt">optional</span></h2>
            {photo}
            <span className="d-hint">At least 1600 pixels wide, so it looks sharp on the site. Photos from a phone camera are perfect; large ones are resized automatically.</span>
            {form.image_path && (
              <label className="d-lbl"><span className="lab">Describe the photograph</span>
                <input className="field" maxLength={200} placeholder="For readers who can’t see it" value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} />
              </label>
            )}
            <button type="button" className="btn d-btn d-step-go" onClick={() => toStep(2)}>Next: review</button>
          </div>
        )}

        {step === 2 && (
          <div className="d-step">
            <h2 className="d-step-h">How it will look</h2>
            <article className="d-preview">
              {preview && <img src={preview} alt="" className="d-preview-img" />}
              <span className="lab d-preview-k">{pillar?.label.split(' · ')[0]} · {MEDIUMS.find((m) => m.value === form.medium)?.label}</span>
              <h3 className="d-preview-t">{form.title || 'Untitled'}</h3>
              {form.standfirst && <p className="d-preview-s">{form.standfirst}</p>}
              {firstPara && <p className="d-preview-p">{firstPara.length > 220 ? firstPara.slice(0, 220).trim() + '…' : firstPara}</p>}
              <span className="lab mut">{words(form.body)} words</span>
            </article>
            <button type="button" className="d-textbtn d-edit" onClick={() => toStep(0)}>Edit the writing</button>
            <button type="button" className="d-textbtn d-edit" onClick={() => toStep(1)}>Change the labels or photograph</button>
            <p className="d-step-note it">{isEditor ? 'Publishing puts it on the site straight away.' : 'The editor reads every piece before it goes on the site. You can withdraw it to keep editing.'}</p>
            <button type="button" className="ghost d-btn d-step-go d-preview-go" onClick={() => setShowPreview(true)}>See the full page preview</button>
            <button type="button" className="btn d-btn d-step-go" onClick={submit} disabled={state === 'saving'}>{live ? sendLabel : isEditor ? 'Publish to the site' : 'Send to the editor'}</button>
            {!live && <button type="button" className="d-textbtn d-later" onClick={async () => { if (await save('draft')) onDone(); }}>Save as a draft and finish later</button>}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="d-write">
      {showPreview && <PiecePreview form={form} photo={preview} author={author} onClose={() => setShowPreview(false)} />}
      <button type="button" className="d-back" onClick={onDone}>← My pieces</button>
      <div className="d-write-bar">
        <button type="button" className="d-link d-close" onClick={onDone} aria-label="Back to my pieces"><span aria-hidden="true">←</span><span className="d-long"> My pieces</span></button>
        <span className="lab mut d-state" role="status" aria-live="polite">
          {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Not saved' : (form.title || form.body) ? 'Unsaved changes' : (id ? '' : 'A new piece')}
        </span>
        <div className="d-write-actions">
          <button type="button" className="d-link d-preview-btn" onClick={() => setShowPreview(true)}>Preview</button>
          {!live && <button type="button" className="ghost d-btn" onClick={() => save('draft')} disabled={state === 'saving'}><span className="d-long">Save draft</span><span className="d-short">Save</span></button>}
          <button type="button" className="btn d-btn" onClick={submit} disabled={state === 'saving'}><span className="d-long">{sendLabel}</span><span className="d-short">{live ? (isEditor ? 'Update' : 'Send') : isEditor ? 'Publish' : 'Send →'}</span></button>
        </div>
      </div>
      {note}
      <p className="it d-notice" role="alert">{msg}</p>

      <div className="d-write-grid">
        {paper}
        <details className="d-details" open>
          <summary><h2 className="eb">Details</h2></summary>
          <div className="d-details-in">
          <label className="d-lbl"><span className="lab">Pillar</span>
            <select className="field" value={form.pillar} onChange={(e) => choosePillar(e.target.value)}>
              {PILLARS.map((p) => <option key={p.value} value={p.value}>{p.label.split(' · ')[0]}</option>)}
            </select>
          </label>
          {kinds.length === 1
            ? <div className="d-lbl"><span className="lab">Medium</span><span className="d-medium-fixed">{kinds[0].label}</span></div>
            : <label className="d-lbl"><span className="lab">Medium</span>
                <select className="field" value={form.medium} onChange={(e) => set('medium', e.target.value)}>
                  {kinds.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </label>}
          <div className="d-lbl">
            <span className="lab">Featured photograph</span>
            {photo}
            <span className="d-hint">At least 1600 pixels wide, so it looks sharp on the site. Photos from a phone camera are perfect; large ones are resized automatically.</span>
          </div>
          <label className="d-lbl"><span className="lab">Describe the photograph</span>
            <input className="field" maxLength={200} placeholder="For readers who can’t see it" value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} />
          </label>
          <details className="d-guide">
            <summary className="lab">Typing shortcuts</summary>
            <p><b>Enter</b> starts a new line; an <b>empty line</b> starts a new paragraph or stanza</p>
            <p><code>##</code> then a space starts a section heading</p>
            <p><code>&gt;</code> then a space makes a pull quote</p>
            <p><code>+</code> then a space makes a Scripture verse; end it with — and the reference</p>
            <p><code>*words*</code> italic · <code>**words**</code> bold · or select words and use the buttons</p>
          </details>
          </div>
        </details>
      </div>
    </section>
  );
}

// The full page, exactly as the site will draw it (same styles as /guild/<piece>/), before anything is sent.
function PiecePreview({ form, photo, author, onClose }: { form: { title: string; standfirst: string; body: string; pillar: string; medium: string; image_alt: string }; photo: string | null; author: Profile | null; onClose: () => void }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.documentElement.classList.add('menu-open');
    addEventListener('keydown', key);
    return () => { document.documentElement.classList.remove('menu-open'); removeEventListener('keydown', key); };
  }, [onClose]);
  const name = author?.display_name || 'You';
  const pillar = PILLARS.find((x) => x.value === form.pillar)?.label.split(' · ')[0] ?? '';
  const kind = MEDIUMS.find((m) => m.value === form.medium)?.label ?? '';
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const portrait = portraitUrl(author?.portrait_path);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  // Drawn at the top of the page (above the site header), not inside the Desk.
  return createPortal(
    <div className="pv" role="dialog" aria-modal="true" aria-label="Preview">
      <div className="pv-bar">
        <span className="lab">Preview · how it will look on the site</span>
        <button type="button" className="btn d-btn pv-close" onClick={onClose}>Back to writing</button>
      </div>
      <div className="pv-page">
        <section className="hero gp-hero">
          <img src={photo || '/images/tall-windows-dark-vault-1200.jpg'} alt={photo ? form.image_alt : ''} style={{ objectPosition: 'center 45%', filter: `brightness(${photo ? 0.5 : 0.35})` }} />
          <div className="veil" />
          <div className="hero-c gp-hero-c">
            <span className="eb">{pillar} · {kind}</span>
            <h1 className="h1 gp-title">{form.title || 'Untitled'}</h1>
            <span className="gp-by">
              <span className="avatar-live">{portrait ? <img src={portrait} alt="" /> : initials}</span>
              <span className="lab">{name} · {date} · {Math.max(1, Math.round(words(form.body) / 230))} min read</span>
            </span>
          </div>
        </section>
        <article className="sec paper gp-article">
          <div className={`narrow gp-flow${wantsDropCap(form.medium, form.body) ? ' gp-drop' : ''}`}>
            {form.standfirst && <p className="lede gp-standfirst">{form.standfirst}</p>}
            <Body body={form.body} />
            <div className="gp-sign"><span>{name.split(' ')[0]}</span></div>
          </div>
        </article>
      </div>
    </div>,
    document.body,
  );
}

function Queue({ queue, onRead }: { queue: (Piece & { profiles?: { display_name: string } })[]; onRead: (p: Piece) => void }) {
  return (
    <section className="d-section">
      <header className="d-page-head"><span className="eb">Editor</span><h1 className="h1 d-hello">Waiting for you</h1><p className="it mut d-sub">Pieces members have sent to your table, and changes to published pieces, oldest first.</p></header>
      {queue.length === 0 ? <p className="it mut d-empty">Nothing is waiting. The table is quiet.</p> : (
        <ul className="d-list">
          {queue.map((p) => (
            <li key={p.id} className="d-item">
              <div className="d-item-main">
                <span className="lab mut">{p.profiles?.display_name ?? 'A member'} · {p.revision ? <span className="d-rev-tag">changes to a published piece · {fmt(p.revision_at ?? null)}</span> : `sent ${fmt(p.submitted_at)}`}</span>
                <span className="h3 d-item-title">{p.revision?.title || p.title || 'Untitled'}</span>
                {(p.revision?.standfirst ?? p.standfirst) && <span className="it mut">{p.revision?.standfirst ?? p.standfirst}</span>}
              </div>
              <div className="d-item-actions"><button type="button" className="d-link" onClick={() => onRead(p)}>{p.revision ? 'Read the changes' : 'Read'}</button></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Reader({ piece, onBack, onDecided }: { piece: Piece; onBack: () => void; onDecided: () => void }) {
  const [mode, setMode] = useState<'read' | 'return' | 'decline'>('read');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const rev = piece.status === 'approved' ? piece.revision ?? null : null;
  const shown = rev ? { ...piece, ...rev } : piece;
  async function applyChanges(accept: boolean) {
    setBusy(true); setMsg('');
    const { error } = await supabase.from('pieces').update(accept && rev ? { ...rev, revision: null, revision_at: null } : { revision: null, revision_at: null }).eq('id', piece.id);
    setBusy(false);
    if (error) return setMsg(error.message);
    onDecided();
  }
  async function decide(status: 'approved' | 'returned' | 'declined') {
    setBusy(true); setMsg('');
    const { error } = await supabase.from('pieces').update({ status, editor_note: status === 'approved' ? '' : note.trim() }).eq('id', piece.id);
    setBusy(false);
    if (error) return setMsg(error.message);
    onDecided();
  }
  return (
    <section className="d-section d-reader">
      <button type="button" className="d-back-link" onClick={onBack}>← Waiting for you</button>
      <article className="d-paper">
        <span className="eb">{PILLARS.find((x) => x.value === piece.pillar)?.label.split(' · ')[0]} · {MEDIUMS.find((m) => m.value === piece.medium)?.label}</span>
        {rev && <span className="lab d-rev-tag">Proposed changes to a published piece. The live version stays until you approve.</span>}
        <h2 className="h1 d-reader-title">{shown.title}</h2>
        {shown.standfirst && <p className="d-paper-standfirst" style={{ margin: 0 }}>{shown.standfirst}</p>}
        <div className="gp-body-in-desk"><Body body={shown.body} /></div>
      </article>
      <div className="d-decide">
        {rev && (<>
          <button type="button" className="btn d-btn" disabled={busy} onClick={() => { if (confirm('Put these changes on the live piece?')) applyChanges(true); }}>Approve the changes</button>
          <button type="button" className="d-link d-danger" disabled={busy} onClick={() => { if (confirm('Discard these changes? The live piece stays as it is.')) applyChanges(false); }}>Discard the changes</button>
        </>)}
        {!rev && mode === 'read' && (<>
          <button type="button" className="btn d-btn" disabled={busy} onClick={() => { if (confirm('Publish this piece to the site?')) decide('approved'); }}>Approve &amp; publish</button>
          <button type="button" className="d-link" onClick={() => setMode('return')}>Send back with a note</button>
          <button type="button" className="d-link d-danger" onClick={() => setMode('decline')}>Decline</button>
        </>)}
        {!rev && mode !== 'read' && (
          <div className="d-decide-note">
            <label className="d-lbl"><span className="lab">{mode === 'return' ? 'Your note to the writer' : 'A word to the writer (optional)'}</span>
              <textarea className="field" style={{ height: 130 }} value={note} onChange={(e) => setNote(e.target.value)}
                placeholder={mode === 'return' ? 'What should they tighten, add, or rethink?' : 'Why this piece is not for the altar.'} /></label>
            <div className="d-decide-row">
              <button type="button" className="btn d-btn" disabled={busy || (mode === 'return' && !note.trim())} onClick={() => decide(mode === 'return' ? 'returned' : 'declined')}>{mode === 'return' ? 'Send back' : 'Decline'}</button>
              <button type="button" className="d-link" onClick={() => setMode('read')}>Cancel</button>
            </div>
          </div>
        )}
        <p className="it d-notice" role="alert">{msg}</p>
      </div>
    </section>
  );
}

function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const [f, setF] = useState({
    display_name: profile.display_name, craft: profile.craft, bio: profile.bio,
    website: profile.website ?? '', instagram: profile.instagram ?? '', listed: profile.listed ?? true,
    portrait_path: profile.portrait_path,
  });
  const [msg, setMsg] = useState('');
  // Showing an email is a choice: off unless they turn it on. It can be any address, not only the one they sign in with.
  const [showEmail, setShowEmail] = useState(!!profile.public_email);
  const [email, setEmail] = useState(profile.public_email ?? '');
  const [emailMsg, setEmailMsg] = useState('');
  async function toggleEmail(on: boolean) {
    setShowEmail(on); setEmailMsg('');
    if (on && !email) { const { data } = await supabase.auth.getSession(); setEmail(data.session?.user.email ?? ''); }
  }
  // The portrait: shrunk in the browser first (any phone photo works), then uploaded. Its messages show right under it.
  const [portraitMsg, setPortraitMsg] = useState('');
  async function uploadPortrait(file: File) {
    setPortraitMsg('Preparing your portrait…');
    let blob: Blob;
    try { blob = await shrinkImage(file, 800); }
    catch { return setPortraitMsg('This photo couldn’t be opened. Try a JPG or PNG.'); }
    const path = `${profile.id}/portrait-${Date.now()}.jpg`;
    setPortraitMsg('Uploading your portrait…');
    const { error } = await supabase.storage.from('portraits').upload(path, blob, { contentType: 'image/jpeg' });
    if (error) return setPortraitMsg('Your portrait didn’t upload. Please try again. (' + error.message + ')');
    setF((x) => ({ ...x, portrait_path: path })); setPortraitMsg('Portrait ready. Tap “Save my page” to keep it.');
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const shown = showEmail ? email.trim() : '';
    if (shown && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(shown)) { setEmailMsg('That email address doesn’t look complete. Please check it.'); return; }
    const clean = { ...f, instagram: f.instagram.replace(/^@/, '').trim(), website: f.website.trim(), public_email: shown || null };
    if (clean.website && !/^https?:\/\//.test(clean.website)) clean.website = 'https://' + clean.website;
    const { error } = await supabase.from('profiles').update(clean).eq('id', profile.id);
    setMsg(error ? error.message : 'Saved. Members now see this on your page.'); if (!error) onSaved();
  }
  return (
    <form className="d-section d-form-page" onSubmit={save}>
      <header className="d-page-head">
        <span className="eb">My page</span>
        <h1 className="h1 d-hello">About the author</h1>
        <p className="it mut d-sub">What members see on your page, beside your collected work. <a className="d-inline-link" href={`/guild/members/?m=${profile.id}`}>View my page</a></p>
      </header>
      <div className="d-portrait-row">
        <label className="d-portrait" title="Choose a portrait">
          <Initials name={f.display_name} size={112} src={portraitUrl(f.portrait_path)} />
          <input type="file" className="visually-hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadPortrait(f); }} />
          <span className="d-link">{f.portrait_path ? 'Change portrait' : 'Add a portrait'}</span>
        </label>
        <span className="d-hint">A photograph of you, or of your work. Square works best. Any photo works; it’s resized automatically.</span>
      </div>
      {portraitMsg && <p className="d-photo-msg" role="status">{portraitMsg}</p>}
      <label className="d-lbl"><span className="lab">Your name, as readers will see it</span><input className="field" value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></label>
      <label className="d-lbl"><span className="lab">Your craft · e.g. Essayist, Photographer</span><input className="field" value={f.craft} onChange={(e) => setF({ ...f, craft: e.target.value })} /></label>
      <label className="d-lbl"><span className="lab">About the author · a few lines in your own words</span><textarea className="field" style={{ height: 170 }} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></label>
      <div className="d-two">
        <label className="d-lbl"><span className="lab">Website</span><input className="field" inputMode="url" placeholder="yoursite.com" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></label>
        <label className="d-lbl"><span className="lab">Instagram</span><input className="field" placeholder="@yourname" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} /></label>
      </div>
      <div className="d-email">
        <label className="d-check"><input type="checkbox" checked={showEmail} onChange={(e) => toggleEmail(e.target.checked)} /><span>Show an email address on my work and pages</span></label>
        {showEmail && (
          <label className="d-lbl d-email-field"><span className="lab">The email readers will see</span>
            <input className="field" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); setEmailMsg(''); }} />
            <span className="d-hint">Shown beside your website and Instagram, on your pieces and your page. Anyone who reads them can see it.</span>
          </label>
        )}
        {emailMsg && <p className="d-photo-msg" role="alert">{emailMsg}</p>}
      </div>
      <label className="d-check"><input type="checkbox" checked={f.listed} onChange={(e) => setF({ ...f, listed: e.target.checked })} /><span>Show me in the Guild directory</span></label>
      <p className="it d-notice" role="status">{msg}</p>
      <div className="d-actions"><button className="btn d-btn" type="submit">Save my page</button></div>
      <div className="d-account">
        <a className="d-link" href={`/guild/members/?m=${profile.id}`}>View my page</a>
        <a className="d-link" href="/guild/members/">The Guild</a>
        <button type="button" className="d-link" onClick={() => { rememberMember(null); supabase.auth.signOut(); }}>Sign out</button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- the app

export default function DeskApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [setting, setSetting] = useState<null | 'invite' | 'recovery'>(arrivedToSetPassword ? (startHash.includes('type=invite') ? 'invite' : 'recovery') : null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') rememberMember(null);
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setSetting('recovery');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <p className="lab mut d-loading">Opening the desk…</p>;
  if (session && setting) return <SetPassword invited={setting === 'invite'} onDone={() => setSetting(null)} />;
  if (!session) return <SignIn />;
  return <Desk session={session} />;
}
