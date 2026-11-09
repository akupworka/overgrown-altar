// The Guild Desk: where members (and the editor) sign in, write, and submit pieces.
// Everything a member can see or change is enforced by the database's rules in Supabase;
// this screen only makes it pleasant to use.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createPortal } from 'react-dom';
import { Body, wantsDropCap } from '../../lib/marks';
import { Doorway, Line, Arrow } from './Doorway';
import { shrinkImage, TooSmall } from '../../lib/shrink';
// Featured photographs fill the width of the page, so they need to be at least this many pixels wide.
const MIN_PHOTO_WIDTH = 1600;
import { PrestigeBadge } from './Prestige';
import { KINDS } from '../../lib/kinds';
import { prestigeFor, PRESTIGES, type Prestige } from '../../lib/prestige';
import { crestSvg } from '../../lib/crests';
import { TROPHIES, trophiesFor, finestFirst, trophySvg, TIER_LABEL, type Tier, type TrophyCtx } from '../../lib/trophies';
import { RichBody, useRichBody, TOOL_LABELS, applyTool, isOn, insertPhoto } from './RichBody';
import { PhotoFocus } from './PhotoFocus';
import { ForumLatest, useForumTally } from './Forum';
import { pageList } from '../../lib/pager';
import { PhotoPlate } from '../PhotoPlate';
import { LENS_FIELDS, MAX_MORE, type PhotoMeta, type GalleryItem } from '../../lib/photo';
import '../../styles/guild-piece.css';
import { supabase, STATUS_LABEL, PILLARS, MEDIUMS, mediumsFor, fitMedium, portraitUrl, rememberMember, type Piece, type Profile } from '../../lib/supabase';

// Read the invitation / password-reset marker before Supabase tidies the address bar.
const startHash = typeof window !== 'undefined' ? window.location.hash : '';
const arrivedToSetPassword = /type=(invite|recovery)/.test(startHash);
// The Guild's own emails link here with ?token_hash=…&type=invite (or recovery): the Desk opens the invitation itself,
// so the link always lands on "choose your password", whatever the project's default address is.
const startQuery = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
const linkToken = startQuery.get('token_hash');
// invite → choose a password; recovery → choose a new one; magiclink / signup / email → simply signed in;
// email_change → signed in, with a word that the new address is confirmed.
const linkType = startQuery.get('type') as 'invite' | 'recovery' | 'signup' | 'magiclink' | 'email' | 'email_change' | null;

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
  forms: <><rect x="3.5" y="6" width="17" height="12.5" rx="1.5" /><path d="M4 7l8 6 8-6" /></>,
};
export const Icon = ({ name }: { name: string }) => (
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

type Tab = 'pieces' | 'write' | 'review' | 'profile' | 'forms';

function Desk({ session }: { session: Session }) {
  const uid = session.user.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [queue, setQueue] = useState<(Piece & { profiles?: { display_name: string } })[]>([]);
  // Nothing is drawn until the first load is in, so a refresh never flashes an email address and zeros.
  const [loaded, setLoaded] = useState(false);
  // Arriving at /guild/desk/#write (from the menu's "Write a piece") opens a fresh sheet straight away.
  // Links from elsewhere can open a section directly: #write, #my-page, #review.
  const [tab, setTab] = useState<Tab>(startHash.startsWith('#write') ? 'write' : startHash === '#my-page' ? 'profile' : startHash === '#review' ? 'review' : startHash === '#forms' ? 'forms' : 'pieces');
  // (#review and #my-page stay in the address, so the members' bar and a reload both know which room you're in.)
  const after = useRef<Tab | null>(null);
  const tabNow = useRef(tab); tabNow.current = tab;
  const [editing, setEditing] = useState<Piece | null>(null);
  const [newMedium, setNewMedium] = useState<string | null>(null);   // a new piece can start as a photograph
  const [reading, setReading] = useState<Piece | null>(null);
  const isEditor = profile?.role === 'editor';
  // The editor: how many arrivals (applications, letters, sign-ups) haven't been read yet.
  const [arrivalsNew, setArrivalsNew] = useState(0);
  useEffect(() => {
    if (!isEditor) return;
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch('/.netlify/functions/forms', { method: 'POST', headers: { Authorization: `Bearer ${s.session?.access_token ?? ''}` } }).catch(() => null);
      if (!res?.ok) return;
      const out = await res.json().catch(() => ({}));
      const { data: reads } = await supabase.from('form_reads').select('submission_id');
      const seen = new Set((reads ?? []).map((r: any) => r.submission_id));
      setArrivalsNew((out.rooms ?? []).reduce((n: number, r: any) => n + (r.items ?? []).filter((x: any) => !seen.has(x.id)).length, 0));
    })();
  }, [isEditor, tab]);
  // The gold dot on the Desk tab of the Guild bar, here and (remembered) on the Guild's other pages.
  useEffect(() => {
    if (!isEditor) return;
    const n = queue.length + arrivalsNew;
    try { localStorage.setItem('oa_desk_waiting', String(n)); } catch {}
    document.querySelectorAll<HTMLElement>('[data-gbar-dot]').forEach((d) => (d.hidden = n === 0));
  }, [isEditor, queue.length, arrivalsNew]);

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
    setLoaded(true);
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
    // "My page" is your own page in the Guild (with Edit my page on it), not the form.
    if (t === 'profile') { location.href = `/guild/members/?m=${uid}`; return; }
    if (t === 'write' && tab !== 'write') { setEditing(null); setNewMedium(null); history.pushState({ desk: 'write' }, '', '#write'); }
    // Keep the address in step with the room, so the members' bar lights the right one.
    else if (t === 'review' || t === 'forms') history.replaceState(history.state, '', location.pathname + location.search + '#' + t);
    else if (t === 'pieces' && /^#(review|my-page|forms)$/.test(location.hash)) history.replaceState(history.state, '', location.pathname + location.search);
    setTab(t); setReading(null); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const open = (p: Piece | null, medium?: string) => {
    if (tab !== 'write') history.pushState({ desk: 'write' }, '', '#write');
    setNewMedium(p ? null : medium ?? null); setEditing(p); setTab('write'); window.scrollTo({ top: 0 });
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
      if (location.hash.startsWith('#write')) { if (tabNow.current !== 'write') { setEditing(null); setNewMedium(null); } setTab('write'); return; }
      // The members' bar can open these directly, too.
      if (location.hash === '#review' || location.hash === '#my-page' || location.hash === '#forms') { setTab(location.hash === '#review' ? 'review' : location.hash === '#forms' ? 'forms' : 'profile'); setReading(null); window.scrollTo({ top: 0 }); return; }
      setTab(after.current ?? 'pieces'); after.current = null; setReading(null); window.scrollTo({ top: 0 }); load();
    };
    addEventListener('popstate', onPop); return () => removeEventListener('popstate', onPop);
  }, [load]);
  const items: [Tab, string, number?][] = [
    ['pieces', 'My pieces'], ['write', editing ? 'Editing' : 'Write'],
    ...(isEditor ? [['review', 'Waiting for you', queue.length] as [Tab, string, number], ['forms', 'Arrivals'] as [Tab, string]] : []),
    ['profile', 'My page'],
  ];

  if (!loaded) return <p className="lab mut d-loading">Opening the desk…</p>;
  return (
    <div className={`d-room ${tab === 'write' ? 'writing' : ''}`}>
      <aside className="d-side">
        <div className="d-me">
          <Initials name={name} size={44} src={portraitUrl(profile?.portrait_path)} />
          <div className="d-me-text">
            <span className="d-me-name">{name}</span>
            <span className="lab mut">{isEditor ? 'Editor in Chief' : 'Writer'}</span>
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
          <a className="d-side-link" href="/guild/members/?view=forum">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h12v8H9l-4 3v-3H4zM18 9h2v8h-1v3l-4-3h-5v-2" /></svg>
            The Forum<span aria-hidden="true">→</span></a>
          <a className="d-side-link" href="/guild/members/">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M3 20v-7a2.5 2.5 0 0 1 5 0v7M9.5 20v-9a2.5 2.5 0 0 1 5 0v9M16 20v-7a2.5 2.5 0 0 1 5 0v7M2 20h20" /></svg>
            The Guild<span aria-hidden="true">→</span></a>
          <a className="d-side-link" href="/crafts/">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 5h11l5 5v9H4zM15 5v5h5M8 13h8M8 16h6" /></svg>
            The Crafts<span aria-hidden="true">→</span></a>
        </div>
        <button type="button" className="d-signout" onClick={() => { rememberMember(null); supabase.auth.signOut(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" /></svg>
          Sign out</button>
      </aside>

      <div className="d-main">
        {tab === 'pieces' && <Pieces name={name} profile={profile} pieces={pieces} waiting={isEditor ? queue.length : 0} arrivals={isEditor ? arrivalsNew : 0} isEditor={isEditor} onReview={() => go('review')} onArrivals={() => go('forms')} onOpen={open} onChanged={load} />}
        {tab === 'write' && <Editor key={editing?.id ?? `new-${newMedium ?? ''}`} uid={uid} author={profile} piece={editing} isEditor={isEditor} startMedium={newMedium} onSaved={() => load()} onDone={() => { go('pieces'); load(); }} />}
        {tab === 'review' && isEditor && (reading
          ? <Reader piece={reading} onBack={() => setReading(null)} onDecided={() => { setReading(null); load(); }} />
          : <Queue queue={queue} onRead={setReading} />)}
        {tab === 'profile' && profile && <ProfileForm profile={profile} onSaved={load} />}
        {tab === 'forms' && isEditor && <FormsRoom />}
      </div>

    </div>
  );
}

// A rank's ink: its glass color, lightened for type on dark (the same as the Prestiges page).
const inkOf = (p: Prestige) => (p.color === 'rainbow' ? '#C9A7FF' : p.color === 'gold' ? '#F2D27A' : `color-mix(in srgb, ${p.color} 70%, white)`);
const glassStops = (p: Prestige | null) => !p ? ['#8C8679', '#5E5A50']
  : p.color === 'rainbow' ? ['#3E7BFF', '#B05BFF', '#FF3B4E', '#FFC44D', '#3DE0A0']
  : p.color === 'gold' ? ['#FFF0B8', '#D2A23A'] : [p.color, p.color];
const deskCrests = new Map<string, string>();
const deskCrest = (lv: number, size: number, locked = false) => {
  const k = `${lv}-${size}-${locked}`;
  if (!deskCrests.has(k)) deskCrests.set(k, crestSvg(lv, size, locked ? { locked: true, mini: true } : { glow: true }));
  return deskCrests.get(k)!;
};

// Your standing: where you are among the ten prestiges (as on the Prestiges page), beside your finest trophies.
function Standing({ published, ctx, uid }: { published: number; ctx: TrophyCtx; uid?: string }) {
  const { current, next, toNext } = prestigeFor(published);
  const from = current?.at ?? 0;
  const frac = next ? Math.max(0.04, (published - from) / (next.at - from)) : 1;
  const earned = finestFirst(trophiesFor(ctx).filter((t) => t.earned));
  const tally = (['rainbow', 'gold', 'silver', 'bronze'] as Tier[]).map((t) => ({ t, n: earned.filter((x) => x.tier === t).length })).filter((x) => x.n);
  const R = 62, C = 2 * Math.PI * R;
  const stops = glassStops(current);
  return (
    <div className="d-standing">
      <div className="d-standing-rank" style={{ '--ink': current ? inkOf(current) : '#CFC8B8' } as CSSProperties}>
        <span className="lab d-standing-k">Your prestige</span>
        <div className="d-pz">
          {/* The crest of your rank, in a ring that fills toward the next */}
          <div className="d-pz-ring" aria-hidden="true">
            <svg viewBox="0 0 150 150" width="150" height="150">
              <defs><linearGradient id="d-pz-g" x1="0" y1="0" x2="1" y2="1">{stops.map((c, i) => <stop key={i} offset={stops.length > 1 ? i / (stops.length - 1) : 0} stopColor={c} />)}</linearGradient></defs>
              <circle cx="75" cy="75" r={R} className="d-pz-track" />
              <circle cx="75" cy="75" r={R} className="d-pz-fill" stroke="url(#d-pz-g)" strokeDasharray={`${C * frac} ${C}`} />
            </svg>
            {current ? <span className="d-pz-crest" dangerouslySetInnerHTML={{ __html: deskCrest(current.level, 120) }} /> : <span className="d-pz-dot">·</span>}
          </div>
          <div className="d-pz-text">
            {current ? <>
              <span className="lab d-pz-of">Rank {current.numeral} of X</span>
              <span className="d-pz-name">{current.name}</span>
              <span className="it d-pz-note">{current.note}</span>
            </> : <>
              <span className="d-pz-name">Not yet ranked</span>
              <span className="it d-pz-note">Your first published piece makes you an Inkling.</span>
            </>}
            {next && (
              <span className="d-pz-next">
                <span className="d-pz-next-crest" aria-hidden="true" dangerouslySetInnerHTML={{ __html: deskCrest(next.level, 40) }} />
                <span><b>{toNext}</b> more to <b className="d-pz-next-name" style={{ color: inkOf(next) }}>{next.name}</b></span>
              </span>
            )}
          </div>
        </div>
        {/* The ten ranks, as a row of glass: lit to where you are */}
        <ol className="d-pz-steps" aria-label={`Rank ${current?.level ?? 0} of 10`}>
          {PRESTIGES.map((p) => (
            <li key={p.level} className={`${current && p.level <= current.level ? 'lit' : ''}${current?.level === p.level ? ' here' : ''}`} style={{ '--ink': inkOf(p) } as CSSProperties} title={`${p.numeral} · ${p.name} · ${p.at} ${p.at === 1 ? 'piece' : 'pieces'}`}><i /></li>
          ))}
        </ol>
        <a className="lab d-standing-link" href="/guild/members/?view=prestige">The ten prestiges →</a>
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

// A short guide to the chosen kind of work: what it is, what the editor looks for, and the usual length.
function KindNote({ value }: { value: string }) {
  const k = KINDS.find((x) => x.value === value);
  if (!k) return null;
  return (
    <div className="d-kind-note">
      <p className="d-kind-what">{k.what}</p>
      <p className="d-kind-look"><span className="lab">What the editor looks for</span>{k.lookFor}</p>
      <p className="d-kind-len"><span className="lab">Usual length</span>{k.length}</p>
      <a className="lab d-kind-all" href={`/crafts/#${k.value}`} target="_blank" rel="noopener">See every craft →</a>
    </div>
  );
}

function StatusChip({ status }: { status: Piece['status'] }) {
  return <span className={`d-status s-${status}`}><i aria-hidden="true" />{STATUS_LABEL[status]}</span>;
}

// "Eden Albright" is greeted as Eden; a name that begins with an article ("The Watchman") is greeted whole.
const firstName = (n: string) => { const w = n.trim().split(/\s+/); return /^(the|a|an)$/i.test(w[0] ?? '') ? n.trim() : (w[0] ?? ''); };

// Six to a page, with numbered pages below (the same row as the writer pages and the forum).
const DESK_PER = 6;
function DeskPages({ cur, pages, onGo }: { cur: number; pages: number; onGo: (n: number) => void }) {
  if (pages < 2) return null;
  const go = (n: number) => { onGo(n); document.querySelector('.d-row-head, .d-page-head')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  return (
    <nav className="pager d-pager" aria-label="Pages">
      <button type="button" className="pg-step" disabled={cur === 1} onClick={() => go(cur - 1)} aria-label="Newer">‹<span className="pg-word">Newer</span></button>
      {pageList(cur, pages).map((n, i) => n === '…' ? <span key={'g' + i} className="pg-gap" aria-hidden="true">…</span>
        : <button key={n} type="button" className="pg-n" aria-current={n === cur ? 'page' : undefined} onClick={() => go(n)}>{n}</button>)}
      <button type="button" className="pg-step" disabled={cur === pages} onClick={() => go(cur + 1)} aria-label="Older"><span className="pg-word">Older</span>›</button>
    </nav>
  );
}

// The editor's own tools on the Desk home: invite a writer, and put the latest changes on the site now.
function EditorTools() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [built, setBuilt] = useState('');
  async function invite(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    const { data: s } = await supabase.auth.getSession();
    const res = await fetch('/.netlify/functions/invite-writer', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token ?? ''}` }, body: JSON.stringify({ email, name }) })
      .catch(() => null);
    const out = res ? await res.json().catch(() => ({})) : { error: 'The invitation couldn’t be sent. Check your connection.' };
    setBusy(false);
    if (res?.ok) { setMsg(`Invitation sent to ${email}. They’ll arrive as a Writer.`); setEmail(''); setName(''); }
    else setMsg(out.error || 'The invitation couldn’t be sent.');
  }
  async function rebuild() {
    if (!confirm('Rebuild the site now? Changes usually go up on their own within the hour.')) return;
    const { error } = await supabase.rpc('rebuild_now');
    setBuilt(error ? error.message : 'Rebuilding. The site will show the latest in a minute or two.');
  }
  return (
    <section className="d-editor-tools">
      <form className="d-invite" onSubmit={invite}>
        <span className="eb">Invite a writer</span>
        <p className="it mut d-tools-sub">They’ll get the Guild’s welcome email with a link to choose a password.</p>
        <div className="d-invite-row">
          <input className="field" placeholder="Their name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} aria-label="Their name" />
          <input className="field" type="email" required placeholder="Their email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Their email" />
          <button className="btn d-btn" type="submit" disabled={busy || !email}>{busy ? 'Sending…' : 'Send invitation'}</button>
        </div>
        {msg && <p className="d-photo-msg" role="status">{msg}</p>}
      </form>
      <div className="d-rebuild">
        <span className="eb">The site</span>
        <p className="it mut d-tools-sub">Approved pieces appear in the lists at once, and the site rebuilds itself within the hour. Need it now?</p>
        <button type="button" className="ghost d-btn" onClick={rebuild}>Rebuild now</button>
        {built && <p className="d-photo-msg" role="status">{built}</p>}
      </div>
    </section>
  );
}

// A small mark beside each piece: a pen for writing, a camera for a photograph.
function KindMark({ medium }: { medium: string }) {
  const photo = medium === 'photograph';
  return (
    <span className={`d-kind-mark${photo ? ' photo' : ''}`} title={photo ? 'Photograph' : 'Writing'} aria-label={photo ? 'Photograph' : 'Writing'} role="img">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {photo ? <><path d="M3 8h4l2-3h6l2 3h4v11H3z" /><circle cx="12" cy="13" r="3.5" /></> : <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></>}
      </svg>
    </span>
  );
}

// The rarer things you can do with a piece, folded behind a small "⋯" (phones).
function MoreActions({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (e: Event) => { const d = ref.current; if (d?.open && !d.contains(e.target as Node)) d.open = false; };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape' && ref.current) ref.current.open = false; };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, []);
  return (
    <details ref={ref} className="d-act-more">
      <summary aria-label="More actions">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
      </summary>
      <div className="d-act-list" onClick={() => { if (ref.current) ref.current.open = false; }}>{children}</div>
    </details>
  );
}

function Pieces({ name, profile, pieces, waiting = 0, arrivals = 0, isEditor = false, onReview, onArrivals, onOpen, onChanged }: { name: string; profile: Profile | null; pieces: Piece[]; waiting?: number; arrivals?: number; isEditor?: boolean; onReview?: () => void; onArrivals?: () => void; onOpen: (p: Piece | null, medium?: string) => void; onChanged: () => void }) {
  const tally = useForumTally(profile?.id);
  // Which pieces to show: all, or one state; six to a page, newest first.
  const [show, setShow] = useState<'all' | 'drafts' | 'with' | 'live'>('all');
  const [page, setPage] = useState(1);
  // With many pieces: find one by its words, or keep to one pillar.
  const [q, setQ] = useState('');
  const [pillar, setPillar] = useState('');
  const needle = q.trim().toLowerCase();
  const inFind = (p: Piece) => (!pillar || p.pillar === pillar) && (!needle || `${p.title} ${p.standfirst}`.toLowerCase().includes(needle));
  const finding = !!needle || !!pillar;
  const inShow = (p: Piece) => show === 'all' ? true : show === 'drafts' ? (p.status === 'draft' || p.status === 'returned') : show === 'with' ? p.status === 'submitted' : p.status === 'approved';
  const listed = pieces.filter((p) => inShow(p) && inFind(p));
  const pages = Math.max(1, Math.ceil(listed.length / DESK_PER));
  const cur = Math.min(page, pages);
  const onPage = listed.slice((cur - 1) * DESK_PER, cur * DESK_PER);   // their part in the forum, for its trophies
  const counts = useMemo(() => ({
    published: pieces.filter((p) => p.status === 'approved').length,
    waiting: pieces.filter((p) => p.status === 'submitted').length,
    drafts: pieces.filter((p) => p.status === 'draft' || p.status === 'returned').length,
  }), [pieces]);
  async function withdraw(p: Piece) {
    await supabase.from('pieces').update({ status: 'draft' }).eq('id', p.id); onChanged();
  }
  // The editor only: a fresh draft copy of one of your pieces, opened ready to write.
  async function duplicate(p: Piece) {
    const { data, error } = await supabase.from('pieces').insert({
      title: `${p.title || 'Untitled'} (copy)`.slice(0, 200), standfirst: p.standfirst, body: p.body, pillar: p.pillar, medium: p.medium,
      image_path: p.image_path, image_alt: p.image_alt, image_focus: p.image_focus ?? '', photo_meta: p.photo_meta ?? {}, gallery: p.gallery ?? [], status: 'draft',
    }).select().single();
    if (error) { alert('The copy couldn’t be made: ' + error.message); return; }
    onChanged(); onOpen(data as Piece);
  }
  async function remove(p: Piece) {
    if (!confirm(`Delete “${p.title || 'Untitled'}”? This cannot be undone.`)) return;
    await supabase.from('pieces').delete().eq('id', p.id); onChanged();
  }
  // The groups My pieces is organized into (newest first in each).
  const GROUPS: { key: string; label: string; note?: string; has: (p: Piece) => boolean; filter?: 'drafts' | 'with' | 'live' }[] = [
    { key: 'returned', label: 'Returned with a note', note: 'The editor has read these and asked for a little more.', has: (p) => p.status === 'returned', filter: 'drafts' },
    { key: 'drafts', label: 'Drafts', has: (p) => p.status === 'draft', filter: 'drafts' },
    { key: 'with', label: 'With the editor', note: 'Being read. You’ll hear by email.', has: (p) => p.status === 'submitted', filter: 'with' },
    { key: 'live', label: 'Published', has: (p) => p.status === 'approved', filter: 'live' },
    { key: 'declined', label: 'Declined', has: (p) => p.status === 'declined' },
  ];
  // One piece, as a card. On a phone the whole card opens the piece, and the rarer actions wait behind "⋯".
  const card = (p: Piece) => {
    const editable = p.status === 'draft' || p.status === 'returned';
    const openable = editable || p.status === 'approved';
    const openLabel = editable ? 'Continue writing' : p.revision ? 'Edit your changes' : 'Edit';
    return (
            <li key={p.id} className={`d-item${openable ? ' d-openable' : ''}`}>
              {openable && <button type="button" className="d-item-open" onClick={() => onOpen(p)} aria-label={`${openLabel}: ${p.title || 'Untitled'}`} />}
              <div className="d-item-main">
                <span className="d-item-head"><KindMark medium={p.medium} /><span className="h3 d-item-title">{p.title || 'Untitled'}</span></span>
                <span className="d-meta"><StatusChip status={p.status} />{p.revision && <span className="lab d-rev-tag">Changes with the editor</span>}<span className="lab mut">{PILLARS.find((x) => x.value === p.pillar)?.label.split(' · ')[0]} · {p.medium === 'photograph' ? 'Photograph' : `${words(p.body)} ${words(p.body) === 1 ? 'word' : 'words'}`} · {fmt(p.updated_at)}</span></span>
                {p.status === 'returned' && p.editor_note && <p className="d-note"><span className="lab">The editor’s note</span>{p.editor_note}</p>}
              </div>
              <div className="d-item-actions">
                {editable && <button type="button" className="d-link" onClick={() => onOpen(p)}>Continue writing</button>}
                {p.status === 'submitted' && <button type="button" className="d-link" onClick={() => withdraw(p)}>Withdraw to edit</button>}
                {p.status === 'approved' && <button type="button" className="d-link" onClick={() => onOpen(p)}>{p.revision ? 'Edit your changes' : 'Edit'}</button>}
                {p.status === 'approved' && p.slug && <a className="d-link" href={`/guild/${p.slug}/`}>View on the site</a>}
                {isEditor && <button type="button" className="d-link" onClick={() => duplicate(p)}>Duplicate</button>}
                {editable && <button type="button" className="lab d-textbtn d-danger" onClick={() => remove(p)}>Delete</button>}
              </div>
              {/* Phones: the same actions, folded */}
              {(openable || p.status === 'submitted' || isEditor) && (
                <MoreActions>
                  {openable && <button type="button" className="d-act-item" onClick={() => onOpen(p)}>{openLabel}</button>}
                  {p.status === 'approved' && p.slug && <a className="d-act-item" href={`/guild/${p.slug}/`}>View on the site</a>}
                  {p.status === 'submitted' && <button type="button" className="d-act-item" onClick={() => withdraw(p)}>Withdraw to edit</button>}
                  {isEditor && <button type="button" className="d-act-item" onClick={() => duplicate(p)}>Duplicate</button>}
                  {editable && <button type="button" className="d-act-item d-danger" onClick={() => remove(p)}>Delete</button>}
                </MoreActions>
              )}
            </li>
    );
  };

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
        <div className="d-begins">
          <button type="button" className="btn d-btn d-begin" onClick={() => onOpen(null)}>Begin a new piece</button>
          <button type="button" className="ghost d-btn d-begin-photo" onClick={() => onOpen(null, 'photograph')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
            Submit a photograph</button>
        </div>
      </header>
      {/* The editor: what's waiting, first. Pieces to review, and new arrivals at the gate. */}
      {isEditor && (
        <div className="d-inbox">
          <button type="button" className={`d-inbox-tile${waiting ? ' lit' : ''}`} onClick={onReview}>
            <span className="d-inbox-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13l2.5-7h11L20 13v5H4v-5z" /><path d="M4 13h5l1 2h4l1-2h5" /></svg></span>
            <span className="d-inbox-text"><span className="eb">Waiting for you</span><span className="it">{waiting ? `${waiting} ${waiting === 1 ? 'piece' : 'pieces'} to review` : 'Nothing to review'}</span></span>
            {waiting > 0 && <span className="d-inbox-n">{waiting}</span>}
          </button>
          <button type="button" className={`d-inbox-tile${arrivals ? ' lit' : ''}`} onClick={onArrivals}>
            <span className="d-inbox-icon" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="6" width="17" height="12.5" rx="1.5" /><path d="M4 7l8 6 8-6" /></svg></span>
            <span className="d-inbox-text"><span className="eb">Arrivals</span><span className="it">{arrivals ? `${arrivals} new` : 'All read'}</span></span>
            {arrivals > 0 && <span className="d-inbox-n">{arrivals}</span>}
          </button>
        </div>
      )}
      <Standing published={counts.published} ctx={{ pieces: pieces.filter((p) => p.status === 'approved'), member: profile ?? {}, forum: tally }} uid={profile?.id} />
      {/* Read the Guild's work: the three pillars, one tap each */}
      <nav className="d-pillars-row" aria-label="Read">
        {([['/watchtower/', 'Watchtower', 'Prophetic audits of the age', '/images/duomo-pigeons-1200.jpg'], ['/hearth/', 'Hearth', 'Prose, poetry, photographs', '/images/glass-2-1200.jpg'], ['/perimeter/', 'Perimeter', 'Testimony and the unseen', '/images/the-perimeter-1200.jpg']] as const).map(([href, name, line, img]) => (
          <a key={href} className="d-pl" href={href}>
            <img src={img} alt="" loading="lazy" />
            <span className="d-pl-text">
              <span className="lab d-pl-the">The</span>
              <span className="d-pl-name">{name}</span>
              <span className="it d-pl-line">{line}</span>
            </span>
            <span className="d-pl-go" aria-hidden="true">→</span>
          </a>
        ))}
      </nav>
      {isEditor && <EditorTools />}
      {/* What the Guild is talking about */}
      <section className="d-forum-panel">
        <div className="d-forum-head"><span className="eb">From the forum</span><a className="lab d-forum-link" href="/guild/members/?view=forum">All boards →</a></div>
        <ForumLatest count={3} plain />
      </section>
      <div className="d-row-head"><h2 className="eb">My pieces</h2>{pieces.length > 0 && <span className="lab mut">{listed.length} {show === 'all' && !finding ? 'in all' : 'shown'} · newest first</span>}</div>
      {pieces.length > 3 && (
        <div className="filters d-filters" role="group" aria-label="Show">
          {([['all', 'All', pieces.length], ['drafts', 'Drafts', counts.drafts], ['with', 'With the editor', counts.waiting], ['live', 'Published', counts.published]] as const).map(([k, label, n]) => (
            <button key={k} type="button" className="chip" aria-pressed={show === k} onClick={() => { setShow(k); setPage(1); }}>{label}<span className="chip-n">{n}</span></button>
          ))}
        </div>
      )}
      {pieces.length > 6 && (
        <div className="d-find">
          <label className="g-search d-find-q">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
            <input type="search" placeholder="Find a piece by its title" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Find a piece" />
            {q && <button type="button" className="d-find-clear" onClick={() => { setQ(''); setPage(1); }} aria-label="Clear">×</button>}
          </label>
          <select className="d-find-pillar" value={pillar} onChange={(e) => { setPillar(e.target.value); setPage(1); }} aria-label="Pillar">
            <option value="">Every pillar</option>
            {PILLARS.map((x) => <option key={x.value} value={x.value}>{x.label.split(' · ')[0]}</option>)}
          </select>
        </div>
      )}
      {pieces.length === 0 ? (
        <button type="button" className="d-first" onClick={() => onOpen(null)}>
          <span className="it">Every piece begins with a title.</span>
          <span className="lab">Begin writing →</span>
        </button>
      ) : (
        show === 'all' && !finding ? (
          // Everything, organized: what needs you first, then drafts, then what the editor has, then what's live.
          <div className="d-groups">
            {GROUPS.map((g) => {
              const list = pieces.filter(g.has);
              if (!list.length) return null;
              return (
                <section key={g.key} className={`d-group d-group-${g.key}`}>
                  <header className="d-group-head">
                    <h3 className="lab">{g.label} <span className="d-group-n">{list.length}</span></h3>
                    {g.note && <span className="it mut d-group-note">{g.note}</span>}
                  </header>
                  <ul className="d-list">{list.slice(0, 3).map(card)}</ul>
                  {list.length > 3 && g.filter && (
                    <button type="button" className="d-group-more lab" onClick={() => { setShow(g.filter!); setPage(1); }}>See all {list.length} <span aria-hidden="true">→</span></button>
                  )}
                </section>
              );
            })}
          </div>
        ) : (
          <ul className="d-list">
            {onPage.length === 0 && <li className="it mut d-empty">{finding ? 'No piece matches. Try other words, or every pillar.' : 'Nothing here yet.'}</li>}
            {onPage.map(card)}
          </ul>
        )
      )}
      {(show !== 'all' || finding) && <DeskPages cur={cur} pages={pages} onGo={setPage} />}
      {/* Phones: the side column is hidden, so Sign out lives at the foot of the Desk. */}
      <button type="button" className="d-signout-foot" onClick={() => { rememberMember(null); supabase.auth.signOut(); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" /></svg>
        Sign out</button>
    </section>
  );
}

function Editor({ uid, author = null, piece, isEditor = false, startMedium, onSaved, onDone }: { uid: string; author?: Profile | null; piece: Piece | null; isEditor?: boolean; startMedium?: string | null; onSaved: (p: Piece) => void; onDone: () => void }) {
  const phone = useMedia('(max-width: 700px)');
  // A published piece: the editor's changes go live directly; a member's go to the editor as a revision.
  const live = piece?.status === 'approved';
  const start = (live && !isEditor && piece?.revision) ? { ...piece, ...piece.revision } : piece;
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({
    title: start?.title ?? '', standfirst: start?.standfirst ?? '', body: start?.body ?? '',
    pillar: piece?.pillar ?? 'hearth', medium: fitMedium(piece?.pillar ?? 'hearth', piece?.medium ?? startMedium ?? 'prose'),
    image_path: start?.image_path ?? null as string | null, image_alt: start?.image_alt ?? '', image_focus: start?.image_focus ?? '', photo_meta: (start?.photo_meta ?? {}) as PhotoMeta, gallery: (start?.gallery ?? []) as GalleryItem[],
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
  // A photograph has its own form: the photograph, what was behind the lens, and words only if the photographer wants them.
  const isPhoto = form.medium === 'photograph';
  const setMeta = (k: keyof PhotoMeta, v: string) => set('photo_meta', { ...form.photo_meta, [k]: v });
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
      const { error } = await supabase.rpc('propose_revision', { p_id: id, p_rev: { title: form.title, standfirst: form.standfirst, body: form.body, image_path: form.image_path, image_alt: form.image_alt, image_focus: form.image_focus, photo_meta: form.photo_meta, gallery: form.gallery } });
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
  // A photography piece's smaller photographs (up to four), uploaded to the public media bucket.
  const [moreMsg, setMoreMsg] = useState('');
  async function addMore(file: File) {
    if (form.gallery.length >= MAX_MORE) return;
    setMoreMsg('Preparing the photograph…');
    let blob: Blob;
    try { blob = await shrinkImage(file, 2000, 0.86); } catch { return setMoreMsg('This photograph couldn’t be opened. Try a JPG or PNG.'); }
    const path = `${uid}/${crypto.randomUUID()}.jpg`;
    setMoreMsg('Uploading the photograph…');
    const { error } = await supabase.storage.from('media').upload(path, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) return setMoreMsg('The photograph didn’t upload. Please try again. (' + error.message + ')');
    const src = supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
    setMoreMsg(''); setForm((f) => ({ ...f, gallery: [...f.gallery, { src, caption: '' }].slice(0, MAX_MORE) })); setState('idle');
  }
  const editMore = (i: number, g: Partial<GalleryItem> | null) => {
    setForm((f) => { const next = [...f.gallery]; if (g) next[i] = { ...next[i], ...g }; else next.splice(i, 1); return { ...f, gallery: next }; }); setState('idle');
  };
  const moveMore = (i: number, d: -1 | 1) => {
    setForm((f) => { const next = [...f.gallery]; const j = i + d; if (j < 0 || j >= next.length) return f; [next[i], next[j]] = [next[j], next[i]]; return { ...f, gallery: next }; }); setState('idle');
  };

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
    setPhotoMsg(''); setForm((f) => ({ ...f, image_path: path, image_focus: '' })); setState('idle');
  }

  async function submit() {
    if (isPhoto) {
      if (!form.title.trim() || !form.image_path) { setMsg('Give it a title and add the photograph before sending it to the editor.'); return; }
    } else if (!form.title.trim() || words(form.body) < 20) { setMsg('Give it a title and at least a few lines before sending it to the editor.'); return; }
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

  const photo = (
    <>
      {preview && form.image_path
        ? <PhotoFocus src={preview} focus={form.image_focus} onChange={(f) => set('image_focus', f)} />
        : null}
      <label className={preview && form.image_path ? 'd-textbtn pf-change' : 'd-photo-frame'}>
        {preview && form.image_path ? 'Choose a different photograph' : <span className="lab mut">Add a photograph</span>}
        <input type="file" className="visually-hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f); }} />
      </label>
      {photoMsg && <p className="d-photo-msg" role="status">{photoMsg}</p>}
    </>
  );
  const toolsBar = (
      <div className="d-tools-wrap" data-end="false">
      <div className="d-paper-tools" role="toolbar" aria-label="Formatting" onScroll={(e) => { const el = e.currentTarget; if (el.parentElement) el.parentElement.dataset.end = String(el.scrollLeft + el.clientWidth >= el.scrollWidth - 6); }}>
        {TOOL_LABELS.map((t) => (
          <button key={t.tool} type="button" title={t.hint} className={isOn(rich, t.tool) ? 'on' : ''} aria-pressed={isOn(rich, t.tool)}
            onMouseDown={(e) => e.preventDefault()} onClick={() => applyTool(rich, t.tool)}>{t.label}</button>
        ))}
        {!isPhoto && <button type="button" className="d-tool-photo" title="Put a photograph here, in the piece" onMouseDown={(e) => e.preventDefault()} onClick={() => inlineInput.current?.click()}>+ Photo</button>}
        <input ref={inlineInput} type="file" accept="image/*" className="visually-hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) addInlinePhoto(f); }} />

      </div>
        {/* Phones: the bar scrolls sideways; this arrow says so, and slides it along. */}
        <button type="button" className="d-tools-more" aria-label="More formatting" onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => e.currentTarget.parentElement?.querySelector('.d-paper-tools')?.scrollBy({ left: 170, behavior: 'smooth' })}><span aria-hidden="true">›</span></button>
      </div>
  );
  const lensForm = (
    <div className="d-lens">
      <div className="d-lens-format" role="radiogroup" aria-label="Digital or film">
        {(['digital', 'film'] as const).map((v) => (
          <label key={v} className={`d-medium ${form.photo_meta.format === v ? 'on' : ''}`}>
            <input type="radio" name="lens-format" checked={form.photo_meta.format === v} onChange={() => setMeta('format', v)} />{v === 'film' ? 'Film' : 'Digital'}
          </label>
        ))}
      </div>
      <div className="d-lens-grid">
        {LENS_FIELDS.filter((f) => !f.filmOnly || form.photo_meta.format === 'film').map((f) => (
          <label key={f.key} className="d-lbl"><span className="lab">{f.label}</span>
            <input className="field" maxLength={120} placeholder={f.hint} value={form.photo_meta[f.key] ?? ''} onChange={(e) => setMeta(f.key, e.target.value)} />
          </label>
        ))}
      </div>
    </div>
  );
  const paper = isPhoto ? (
    <article className="d-paper d-paper-photo">
      <span className="eb d-ph-kicker">A photograph for the Hearth</span>
      <label className="visually-hidden" htmlFor="d-title">Title</label>
      <textarea id="d-title" className="d-paper-title" rows={1} placeholder="Title" maxLength={200} value={form.title}
        onChange={(e) => { set('title', e.target.value); e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} />
      <label className="visually-hidden" htmlFor="d-standfirst">Standfirst</label>
      <textarea id="d-standfirst" className="d-paper-standfirst" rows={2} placeholder={isPhoto ? 'One line about the photograph (optional)' : 'One sentence: what this piece is'} maxLength={400} value={form.standfirst} onChange={(e) => set('standfirst', e.target.value)} />
      <section className="d-ph-sec">
        <h2 className="d-ph-h">The photograph</h2>
        {photo}
        <span className="d-hint">One photograph, your own, at least 1600 pixels wide. Its page shows it whole; the framing you choose is for the banner and the lists.</span>
        <label className="d-lbl"><span className="lab">Caption · also read aloud for readers who can’t see it</span>
          <input className="field" maxLength={200} placeholder="What, or who, is in the photograph" value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} />
        </label>
      </section>
      <section className="d-ph-sec">
        <h2 className="d-ph-h">More photographs <span className="d-opt">optional · up to {MAX_MORE}</span></h2>
        <span className="d-hint">Shown smaller, in a row beneath the main photograph; readers can open each one full size.</span>
        {form.gallery.length > 0 && (
          <ol className="d-more">
            {form.gallery.map((g, i) => (
              <li key={g.src} className="d-more-item">
                <img src={g.src} alt="" />
                <input className="field" maxLength={200} placeholder="Caption (optional)" aria-label={`Caption for photograph ${i + 2}`} value={g.caption ?? ''} onChange={(e) => editMore(i, { caption: e.target.value })} />
                <span className="d-more-acts">
                  <button type="button" className="d-textbtn" disabled={i === 0} onClick={() => moveMore(i, -1)} aria-label="Move earlier">←</button>
                  <button type="button" className="d-textbtn" disabled={i === form.gallery.length - 1} onClick={() => moveMore(i, 1)} aria-label="Move later">→</button>
                  <button type="button" className="d-textbtn d-danger" onClick={() => editMore(i, null)}>Remove</button>
                </span>
              </li>
            ))}
          </ol>
        )}
        {form.gallery.length < MAX_MORE && (
          <label className="d-more-add">
            <span aria-hidden="true">+</span> Add {form.gallery.length ? 'another' : 'a'} photograph
            <input type="file" className="visually-hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) addMore(f); }} />
          </label>
        )}
        {moreMsg && <p className="d-photo-msg" role="status">{moreMsg}</p>}
      </section>
      <section className="d-ph-sec">
        <h2 className="d-ph-h">Behind the lens <span className="d-opt">optional</span></h2>
        {lensForm}
      </section>
      <section className="d-ph-sec">
        <h2 className="d-ph-h">Words <span className="d-opt">optional</span></h2>
        <span className="d-hint">As short or as long as you like: the story behind it, your camera, your process, why this light. Or let it speak for itself.</span>
        {toolsBar}
      <RichBody editor={rich} />
      <span className="d-paper-count">{words(form.body)} {words(form.body) === 1 ? 'word' : 'words'}</span>
      </section>
    </article>
  ) : (
    <article className="d-paper">
      <label className="visually-hidden" htmlFor="d-title">Title</label>
      <textarea id="d-title" className="d-paper-title" rows={1} placeholder="Title" maxLength={200} value={form.title}
        onChange={(e) => { set('title', e.target.value); e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} />
      <label className="visually-hidden" htmlFor="d-standfirst">Standfirst</label>
      <textarea id="d-standfirst" className="d-paper-standfirst" rows={2} placeholder={isPhoto ? 'One line about the photograph (optional)' : 'One sentence: what this piece is'} maxLength={400} value={form.standfirst} onChange={(e) => set('standfirst', e.target.value)} />
      {toolsBar}
      <RichBody editor={rich} />
      <span className="d-paper-count">{words(form.body)} {words(form.body) === 1 ? 'word' : 'words'}</span>
    </article>
  );

  if (phone) {
    const titles = [isPhoto ? 'Photograph' : 'Write', 'Label it', 'Review'];
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
            <KindNote value={form.medium} />
            {!isPhoto && (<>
            <h2 className="d-step-h">A photograph <span className="d-opt">optional</span></h2>
            {photo}
            <span className="d-hint">At least 1600 pixels wide, so it looks sharp on the site. Photos from a phone camera are perfect; large ones are resized automatically.</span>
            {form.image_path && (
              <label className="d-lbl"><span className="lab">Describe the photograph</span>
                <input className="field" maxLength={200} placeholder="For readers who can’t see it" value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} />
              </label>
            )}
            </>)}
            <button type="button" className="btn d-btn d-step-go" onClick={() => toStep(2)}>Next: review</button>
          </div>
        )}

        {step === 2 && (
          <div className="d-step">
            <h2 className="d-step-h">How it will look</h2>
            <article className="d-preview">
              {preview && <img src={preview} alt="" className="d-preview-img" style={form.image_focus ? { objectPosition: form.image_focus } : undefined} />}
              <span className="lab d-preview-k">{pillar?.label.split(' · ')[0]} · {MEDIUMS.find((m) => m.value === form.medium)?.label}</span>
              <h3 className="d-preview-t">{form.title || 'Untitled'}</h3>
              {form.standfirst && <p className="d-preview-s">{form.standfirst}</p>}
              {firstPara && <p className="d-preview-p">{firstPara.length > 220 ? firstPara.slice(0, 220).trim() + '…' : firstPara}</p>}
              <span className="lab mut">{words(form.body)} {words(form.body) === 1 ? 'word' : 'words'}</span>
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
          <KindNote value={form.medium} />
          {!isPhoto && (<>
          <div className="d-lbl">
            <span className="lab">Featured photograph</span>
            {photo}
            <span className="d-hint">At least 1600 pixels wide, so it looks sharp on the site. Photos from a phone camera are perfect; large ones are resized automatically.</span>
          </div>
          <label className="d-lbl"><span className="lab">Describe the photograph</span>
            <input className="field" maxLength={200} placeholder="For readers who can’t see it" value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} />
          </label>
          </>)}
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
function PiecePreview({ form, photo, author, onClose }: { form: { title: string; standfirst: string; body: string; pillar: string; medium: string; image_alt: string; image_focus?: string; photo_meta?: PhotoMeta; gallery?: GalleryItem[] }; photo: string | null; author: Profile | null; onClose: () => void }) {
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
          <img src={photo || '/images/tall-windows-dark-vault-1200.jpg'} alt={photo ? form.image_alt : ''} style={{ objectPosition: (photo && form.image_focus) || 'center 45%', filter: `brightness(${photo ? 0.5 : 0.35})` }} />
          <div className="veil" />
          <div className="hero-c gp-hero-c">
            <span className="eb">{pillar} · {kind}</span>
            <h1 className="h1 gp-title">{form.title || 'Untitled'}</h1>
            <span className="gp-by">
              <span className="avatar-live">{portrait ? <img src={portrait} alt="" /> : initials}</span>
              <span className="lab">{name} · {date}{form.medium === 'photograph' ? '' : ` · ${Math.max(1, Math.round(words(form.body) / 230))} min read`}</span>
            </span>
          </div>
        </section>
        <article className="sec paper gp-article">
          <div className={`narrow gp-flow${form.medium === 'photograph' ? ' gp-photo' : wantsDropCap(form.medium, form.body) ? ' gp-drop' : ''}`}>
            {form.standfirst && <p className="lede gp-standfirst">{form.standfirst}</p>}
            {form.medium === 'photograph' && photo && <PhotoPlate src={photo} alt={form.image_alt} meta={form.photo_meta} gallery={form.gallery} />}
            {form.body.trim() && <Body body={form.body} />}
            <div className="gp-sign"><span>{name.split(' ')[0]}</span></div>
          </div>
        </article>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------- the editor's Forms room
// What visitors send through the site's forms (Guild applications, letters, Dispatch sign-ups), fetched by
// netlify/functions/forms.mts after it checks you are the editor. Read only.
type FormItem = { id: string; at: string; name: string; email: string; fields: [string, string][] };
type FormRoom = { key: string; label: string; count: number; items: FormItem[] };
const FORMS_PER = 10;
// Shown until the site has its Netlify key, so the room can be seen working. Clearly marked as examples.
const ago = (d: number) => new Date(Date.now() - d * 864e5).toISOString();
const SAMPLE_FORMS: FormRoom[] = [
  { key: 'guild-application', label: 'Applications', count: 3, items: [
    { id: 's1', at: ago(0.1), name: 'Mara Quill', email: 'mara@example.com', fields: [['craft', 'Poetry and short fiction'], ['why', 'I have been writing psalms of my own for ten years, mostly on the night bus home. I would like a table to bring them to, and readers who will be honest with me.'], ['sample link', 'https://example.com/psalms']] },
    { id: 's2', at: ago(2), name: 'Tomas Reed', email: 'tomas@example.com', fields: [['craft', 'Photography'], ['why', 'I photograph cathedrals at first light, before the doors open. I would like to share them with people who look as slowly as I do.']] },
    { id: 's3', at: ago(6), name: 'Hester Vale', email: 'hester@example.com', fields: [['craft', 'Essays'], ['why', 'Twenty years as a nurse on night shifts. I want to write about what the dark hours teach.']] } ] },
  { key: 'contact', label: 'Letters', count: 2, items: [
    { id: 's4', at: ago(1), name: 'Ruth Abara', email: 'ruth@example.com', fields: [['message', 'Thank you for the piece on the lamp road. I read it aloud to my mother, and she asked for it again the next evening.']] },
    { id: 's5', at: ago(9), name: 'Daniel Okafor', email: 'daniel@example.com', fields: [['message', 'Is there a way to buy prints of the photographs in the Hearth? The window over the stair stayed with me all week.']] } ] },
  { key: 'dispatches', label: 'Sign-ups', count: 2, items: [
    { id: 's6', at: ago(0.5), name: '', email: 'reader@example.com', fields: [] },
    { id: 's7', at: ago(3), name: '', email: 'pilgrim@example.com', fields: [] } ] },
];
const fieldName = (k: string) => k.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
function FormsRoom() {
  const [rooms, setRooms] = useState<FormRoom[] | null>(null);
  const [err, setErr] = useState('');
  const [sample, setSample] = useState(false);
  const [why, setWhy] = useState('');   // why the examples are showing, for the editor to pass on
  const [pick, setPick] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch('/.netlify/functions/forms', { method: 'POST', headers: { Authorization: `Bearer ${s.session?.access_token ?? ''}` } }).catch(() => null);
      const out = res ? await res.json().catch(() => ({})) : {};
      // Not switched on yet (no Netlify key): show the examples, so the room can be seen working.
      if (res?.status === 503 || res?.status === 404) {
        setWhy(res.status === 404 ? 'The site’s forms helper wasn’t found (404).' : `${out.error || 'Not switched on yet.'} (503)`);
        setSample(true); setRooms(SAMPLE_FORMS); setPick(SAMPLE_FORMS[0].key); return;
      }
      if (!res?.ok) { setErr(out.error || 'Arrivals couldn’t be fetched. Check your connection.'); setRooms([]); return; }
      setRooms(out.rooms ?? []); setPick((out.rooms ?? [])[0]?.key ?? '');
    })();
  }, []);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  // Read or not: kept in the Guild's database (form_reads), so phone and computer agree. Examples are marked here only.
  const [read, setRead] = useState<Set<string>>(new Set());
  useEffect(() => { supabase.from('form_reads').select('submission_id').then(({ data }) => setRead(new Set((data ?? []).map((r: any) => r.submission_id)))); }, []);
  const mark = async (id: string, on: boolean) => {
    setRead((r) => { const n = new Set(r); on ? n.add(id) : n.delete(id); return n; });
    if (sample) return;
    if (on) await supabase.from('form_reads').upsert({ submission_id: id }, { onConflict: 'submission_id', ignoreDuplicates: true });
    else await supabase.from('form_reads').delete().eq('submission_id', id);
  };
  const call = async (url: string, body: unknown) => {
    const { data: s } = await supabase.auth.getSession();
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.session?.access_token ?? ''}` }, body: JSON.stringify(body) }).catch(() => null);
    const out = res ? await res.json().catch(() => ({})) : { error: 'Check your connection.' };
    return res?.ok ? null : (out.error || 'Something went wrong.');
  };
  // Take an entry off the list (here, and in Netlify unless these are the examples).
  const drop = (key: string, id: string) => setRooms((rs) => (rs ?? []).map((r) => r.key === key ? { ...r, count: Math.max(0, r.count - 1), items: r.items.filter((x) => x.id !== id) } : r));
  async function remove(key: string, f: FormItem) {
    if (!confirm(`Delete this entry from ${f.name || f.email || 'someone'}? It can’t be brought back.`)) return;
    setBusy(f.id); setNote('');
    const err = sample ? null : await call('/.netlify/functions/forms', { action: 'delete', id: f.id });
    setBusy('');
    if (err) { setNote(err); return; }
    drop(key, f.id); setNote('Deleted.');
  }
  // Accept an application: the Guild's welcome email (the same invitation as "Invite a writer"), then off the list.
  async function accept(key: string, f: FormItem) {
    if (!f.email) { setNote('This application has no email address to invite.'); return; }
    if (!confirm(`Accept ${f.name || f.email}? They’ll get the Guild’s welcome email with a link to choose a password, and arrive as a Writer.`)) return;
    setBusy(f.id); setNote('');
    if (sample) { setBusy(''); drop(key, f.id); setNote(`An example, so no email was sent. A real one would go to ${f.email}.`); return; }
    const err = await call('/.netlify/functions/invite-writer', { email: f.email, name: f.name });
    if (err) { setBusy(''); setNote(err); return; }
    await call('/.netlify/functions/forms', { action: 'delete', id: f.id });
    setBusy(''); drop(key, f.id); setNote(`Accepted. The welcome email is on its way to ${f.email}.`);
  }
  const room = rooms?.find((r) => r.key === pick);
  const items = room?.items ?? [];
  const pages = Math.max(1, Math.ceil(items.length / FORMS_PER));
  const cur = Math.min(page, pages);
  return (
    <section className="d-section d-forms">
      <header className="d-page-head"><span className="eb">Editor</span><h1 className="h1 d-hello">Arrivals</h1>
        <p className="it mut d-sub">What visitors have sent through the site: applications to the Guild, letters, and sign-ups for the Dispatches. Newest first.</p></header>
      {!rooms ? <p className="lab mut">Opening Arrivals…</p>
        : err ? <p className="d-photo-msg" role="alert">{err}</p>
        : !rooms.length ? <p className="it mut d-empty">Nothing has arrived yet.</p>
        : <>
          {sample && <p className="d-form-sample"><b>These are examples.</b> Your real applications, letters and sign-ups take their place once the site has its Netlify key.{why && <span className="lab d-form-why">{why}</span>}</p>}
          {/* The message always has its place, and the tab row its own box: the site's script wraps filter rows, so nothing is inserted beside them. */}
          <p className="d-photo-msg" role="status" hidden={!note}>{note}</p>
          <div>
            <div className="filters d-filters" role="tablist" aria-label="Arrivals">
              {rooms.map((r) => <button key={r.key} type="button" role="tab" className="chip" aria-pressed={pick === r.key} aria-selected={pick === r.key} onClick={() => { setPick(r.key); setPage(1); setNote(''); }}>{r.label}<span className="chip-n">{r.count}</span>{r.items.some((x) => !read.has(x.id)) && <span className="d-form-unread-n" aria-label={`${r.items.filter((x) => !read.has(x.id)).length} unread`}>{r.items.filter((x) => !read.has(x.id)).length} new</span>}</button>)}
            </div>
          </div>
          {items.length === 0 ? <p className="it mut d-empty">Nothing here yet.</p> : (
            <ul className="d-form-list">
              {items.slice((cur - 1) * FORMS_PER, cur * FORMS_PER).map((f) => {
                const long = f.fields.filter(([k]) => !/^(name|email)$/i.test(k));
                return (
                  <li key={f.id}>
                    <details className={`d-form-item${read.has(f.id) ? '' : ' unread'}`} onToggle={(e) => { if (e.currentTarget.open && !read.has(f.id)) mark(f.id, true); }}>
                      <summary>
                        <span className="d-form-who">{!read.has(f.id) && <i className="d-form-dot" aria-label="Unread" />}{f.name || f.email || 'Someone'}</span>
                        <span className="lab mut d-form-when">{fmt(f.at)}</span>
                        {long[0] && <span className="it d-form-peek">{long[0][1]}</span>}
                      </summary>
                      <div className="d-form-body">
                        {f.email && <p className="d-form-field"><span className="lab">Email</span><a href={`mailto:${f.email}`}>{f.email}</a></p>}
                        {long.map(([k, v]) => <p key={k} className="d-form-field"><span className="lab">{fieldName(k)}</span><span>{v}</span></p>)}
                        <div className="d-form-acts">
                          {room?.key === 'guild-application' && <button type="button" className="btn d-btn" disabled={busy === f.id} onClick={() => accept(room.key, f)}>{busy === f.id ? 'Sending…' : 'Accept & invite'}</button>}
                          {f.email && <a className="ghost d-btn" href={`mailto:${f.email}`}>Reply by email</a>}
                          <button type="button" className="d-textbtn d-form-mark" onClick={(e) => { const d = e.currentTarget.closest('details'); mark(f.id, !read.has(f.id)); if (d && read.has(f.id)) d.open = false; }}>{read.has(f.id) ? 'Mark as unread' : 'Mark as read'}</button>
                          <button type="button" className="d-textbtn d-danger d-form-del" disabled={busy === f.id} onClick={() => room && remove(room.key, f)}>Delete</button>
                        </div>
                      </div>
                    </details>
                  </li>
                );
              })}
            </ul>
          )}
          <DeskPages cur={cur} pages={pages} onGo={setPage} />
        </>}
    </section>
  );
}

function Queue({ queue, onRead }: { queue: (Piece & { profiles?: { display_name: string } })[]; onRead: (p: Piece) => void }) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(queue.length / DESK_PER));
  const cur = Math.min(page, pages);
  return (
    <section className="d-section">
      <header className="d-page-head"><span className="eb">Editor</span><h1 className="h1 d-hello">Waiting for you</h1><p className="it mut d-sub">Pieces members have sent to your table, and changes to published pieces, oldest first.</p></header>
      {queue.length === 0 ? <p className="it mut d-empty">Nothing is waiting. The table is quiet.</p> : (
        <ul className="d-list">
          {queue.slice((cur - 1) * DESK_PER, cur * DESK_PER).map((p) => (
            <li key={p.id} className="d-item">
              <div className="d-item-main">
                <span className="lab mut">{p.profiles?.display_name ?? 'A member'} · {p.revision ? <span className="d-rev-tag">changes to a published piece · {fmt(p.revision_at ?? null)}</span> : `sent ${fmt(p.submitted_at)}`}</span>
                <span className="d-item-head"><KindMark medium={p.medium} /><span className="h3 d-item-title">{p.revision?.title || p.title || 'Untitled'}</span></span>
                {(p.revision?.standfirst ?? p.standfirst) && <span className="it mut">{p.revision?.standfirst ?? p.standfirst}</span>}
              </div>
              <div className="d-item-actions"><button type="button" className="d-link" onClick={() => onRead(p)}>{p.revision ? 'Read the changes' : 'Read'}</button></div>
            </li>
          ))}
        </ul>
      )}
      <DeskPages cur={cur} pages={pages} onGo={setPage} />
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
  // The piece's photograph, so the editor sees what readers will see.
  const [photo, setPhoto] = useState('');
  useEffect(() => {
    if (!shown.image_path) return setPhoto('');
    supabase.storage.from('guild').createSignedUrl(shown.image_path, 3600).then(({ data }) => setPhoto(data?.signedUrl ?? ''));
  }, [shown.image_path]);
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
        {photo && (shown.medium === 'photograph'
          ? <PhotoPlate src={photo} alt={shown.image_alt} meta={shown.photo_meta} gallery={shown.gallery} />
          : <img className="m-photo" src={photo} alt={shown.image_alt} />)}
        {shown.body.trim() ? <div className="gp-body-in-desk"><Body body={shown.body} /></div> : shown.medium === 'photograph' ? <p className="it mut">No words with this photograph.</p> : null}
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

  const [linkError, setLinkError] = useState('');
  const [linkNote, setLinkNote] = useState('');
  useEffect(() => {
    if (linkToken && linkType) {
      history.replaceState(null, '', location.pathname);   // the link works once; don't leave it in the address bar
      supabase.auth.verifyOtp({ token_hash: linkToken, type: linkType }).then(({ data, error }) => {
        if (error) { setLinkError('This link has expired or was already used. Ask the Editor in Chief for a new invitation, or use “Forgot your password?” below.'); setReady(true); return; }
        setSession(data.session);
        if (linkType === 'invite' || linkType === 'recovery') setSetting(linkType);
        if (linkType === 'email_change') setLinkNote('Your new email address is confirmed. Use it to sign in from now on.');
        setReady(true);
      });
    } else {
      supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'SIGNED_OUT') rememberMember(null);
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setSetting('recovery');
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <p className="lab mut d-loading">Opening the desk…</p>;
  if (session && setting) return <SetPassword invited={setting === 'invite'} onDone={() => setSetting(null)} />;
  if (!session) return <>{linkError && <p className="d-photo-msg" role="alert" style={{ maxWidth: 520, margin: '0 auto 20px' }}>{linkError}</p>}<SignIn /></>;
  return <>{linkNote && <p className="d-photo-msg" role="status" style={{ maxWidth: 620, margin: '0 auto 20px' }}>{linkNote}</p>}<Desk session={session} /></>;
}
