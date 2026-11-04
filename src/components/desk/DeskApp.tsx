// The Guild Desk: where members (and the editor) sign in, write, and submit pieces.
// Everything a member can see or change is enforced by the database's rules in Supabase;
// this screen only makes it pleasant to use.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, STATUS_LABEL, PILLARS, MEDIUMS, portraitUrl, rememberMember, type Piece, type Profile } from '../../lib/supabase';

// Read the invitation / password-reset marker before Supabase tidies the address bar.
const startHash = typeof window !== 'undefined' ? window.location.hash : '';
const arrivedToSetPassword = /type=(invite|recovery)/.test(startHash);

// ---------------------------------------------------------------- small pieces

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

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');
const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

// ---------------------------------------------------------------- signed out

function SignIn() {
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMsg(error.message.includes('Invalid') ? 'That email and password do not match. Please try again.' : error.message);
  }
  async function sendReset(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/guild/desk/` });
    setBusy(false);
    setMsg(error ? error.message : 'If that email belongs to a member, a link to set a new password is on its way.');
  }

  return (
    <Glass className="d-narrow">
      <div className="d-card">
        <span className="eb">Members of the Guild</span>
        <h1 className="h1 d-title">The Guild Desk</h1>
        {mode === 'signin' ? (
          <>
            <p className="it mut d-lead">Your drafts, your pieces with the editor, and the page readers see when they meet you.</p>
            <form className="d-form" onSubmit={signIn}>
              <label className="lab" htmlFor="d-email">Email</label>
              <input id="d-email" className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <label className="lab" htmlFor="d-pw">Password</label>
              <input id="d-pw" className="field" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="btn" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
              <p className="it d-notice" role="status" aria-live="polite">{msg}</p>
            </form>
            <div className="d-links">
              <button type="button" className="lab d-textbtn" onClick={() => { setMode('forgot'); setMsg(''); }}>Forgot your password?</button>
              <span className="d-rule" aria-hidden="true" />
              <span className="it mut">Not yet at the table?</span>
              <a className="ghost" href="/guild">Apply to the Guild</a>
            </div>
          </>
        ) : (
          <>
            <p className="it mut d-lead">Enter your email and we will send you a link to set a new password.</p>
            <form className="d-form" onSubmit={sendReset}>
              <label className="lab" htmlFor="d-email2">Email</label>
              <input id="d-email2" className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className="btn" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send the link'}</button>
              <p className="it d-notice" role="status" aria-live="polite">{msg}</p>
            </form>
            <div className="d-links"><button type="button" className="lab d-textbtn" onClick={() => { setMode('signin'); setMsg(''); }}>← Back to sign in</button></div>
          </>
        )}
      </div>
    </Glass>
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
    <Glass className="d-narrow">
      <div className="d-card">
        <span className="eb">{invited ? 'Welcome to the Guild' : 'A new password'}</span>
        <h1 className="h1 d-title">{invited ? 'Take your seat' : 'Set your password'}</h1>
        <p className="it mut d-lead">{invited ? 'Choose the name readers will see, and a password for your desk.' : 'Choose a new password for your desk.'}</p>
        <form className="d-form" onSubmit={save}>
          {invited && (<>
            <label className="lab" htmlFor="d-name">Your name, as readers will see it</label>
            <input id="d-name" className="field" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </>)}
          <label className="lab" htmlFor="d-new">New password</label>
          <input id="d-new" className="field" type="password" autoComplete="new-password" required value={pw} onChange={(e) => setPw(e.target.value)} />
          <label className="lab" htmlFor="d-new2">Once more</label>
          <input id="d-new2" className="field" type="password" autoComplete="new-password" required value={pw2} onChange={(e) => setPw2(e.target.value)} />
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save and open my desk'}</button>
          <p className="it d-notice" role="alert">{msg}</p>
        </form>
      </div>
    </Glass>
  );
}

// ---------------------------------------------------------------- signed in

type Tab = 'pieces' | 'write' | 'review' | 'profile';

function Desk({ session }: { session: Session }) {
  const uid = session.user.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [queue, setQueue] = useState<(Piece & { profiles?: { display_name: string } })[]>([]);
  const [tab, setTab] = useState<Tab>('pieces');
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
      const { data: q } = await supabase.from('pieces').select('*, profiles(display_name)').eq('status', 'submitted').order('submitted_at', { ascending: true });
      setQueue((q as any) ?? []);
    }
  }, [uid]);
  useEffect(() => { load(); }, [load]);

  const name = profile?.display_name || session.user.email || '';
  const go = (t: Tab) => { if (t === 'write' && tab !== 'write') setEditing(null); setTab(t); setReading(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const open = (p: Piece | null) => { setEditing(p); setTab('write'); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const items: [Tab, string, number?][] = [
    ['pieces', 'My pieces'], ['write', editing ? 'Editing' : 'Write'],
    ...(isEditor ? [['review', 'Waiting for you', queue.length] as [Tab, string, number]] : []),
    ['profile', 'My page'],
  ];

  return (
    <div className="d-room">
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
          <a className="d-side-link" href={`/guild/members/?m=${uid}`}>View my page</a>
          <a className="d-side-link" href="/guild/members/">The Guild</a>
        </div>
        <button type="button" className="lab d-textbtn d-signout" onClick={() => { rememberMember(null); supabase.auth.signOut(); }}>Sign out</button>
      </aside>

      <div className="d-main">
        {tab === 'pieces' && <Pieces name={name} pieces={pieces} onOpen={open} onChanged={load} />}
        {tab === 'write' && <Editor key={editing?.id ?? 'new'} uid={uid} piece={editing} onSaved={() => load()} onDone={() => { go('pieces'); load(); }} />}
        {tab === 'review' && isEditor && (reading
          ? <Reader piece={reading} onBack={() => setReading(null)} />
          : <Queue queue={queue} onRead={setReading} />)}
        {tab === 'profile' && profile && <ProfileForm profile={profile} onSaved={load} />}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: Piece['status'] }) {
  return <span className={`d-status s-${status}`}><i aria-hidden="true" />{STATUS_LABEL[status]}</span>;
}

function Pieces({ name, pieces, onOpen, onChanged }: { name: string; pieces: Piece[]; onOpen: (p: Piece | null) => void; onChanged: () => void }) {
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
    <section className="d-section">
      <header className="d-page-head">
        <span className="eb">The Guild Desk</span>
        <h1 className="h1 d-hello">Welcome, {name.split(' ')[0]}</h1>
        <p className="it mut d-sub">Write, sharpen, discern. Everything you send comes to the editor’s table before it is published.</p>
      </header>
      <div className="d-stats">
        <div><b>{counts.published}</b><span className="lab mut">Published</span></div>
        <div><b>{counts.waiting}</b><span className="lab mut">With the editor</span></div>
        <div><b>{counts.drafts}</b><span className="lab mut">Drafts</span></div>
      </div>
      <div className="d-row-head">
        <h2 className="eb">My pieces</h2>
        <button type="button" className="btn d-btn" onClick={() => onOpen(null)}>Begin a new piece</button>
      </div>
      {pieces.length === 0 ? (
        <p className="it mut d-empty">Nothing here yet. Your first piece begins with a title.</p>
      ) : (
        <ul className="d-list">
          {pieces.map((p) => (
            <li key={p.id} className="d-item">
              <div className="d-item-main">
                <span className="h3 d-item-title">{p.title || 'Untitled'}</span>
                <span className="d-meta"><StatusChip status={p.status} /><span className="lab mut">{PILLARS.find((x) => x.value === p.pillar)?.label.split(' · ')[0]} · {words(p.body)} words · {fmt(p.updated_at)}</span></span>
                {p.status === 'returned' && p.editor_note && <p className="d-note"><span className="lab">The editor’s note</span>{p.editor_note}</p>}
              </div>
              <div className="d-item-actions">
                {(p.status === 'draft' || p.status === 'returned') && <button type="button" className="d-link" onClick={() => onOpen(p)}>Continue writing</button>}
                {p.status === 'submitted' && <button type="button" className="d-link" onClick={() => withdraw(p)}>Withdraw to edit</button>}
                {(p.status === 'draft' || p.status === 'returned') && <button type="button" className="lab d-textbtn d-danger" onClick={() => remove(p)}>Delete</button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const TOOLS: { label: string; wrap?: string; prefix?: string; hint: string }[] = [
  { label: 'Section heading', prefix: '## ', hint: 'Starts a new section with a small heading' },
  { label: 'Pull quote', prefix: '> ', hint: 'A line set large, in italics' },
  { label: 'Scripture', prefix: '+ ', hint: 'A verse; end it with — and the reference' },
  { label: 'Italic', wrap: '*', hint: 'Slanted words' },
  { label: 'Bold', wrap: '**', hint: 'Strong words' },
];

function Editor({ uid, piece, onSaved, onDone }: { uid: string; piece: Piece | null; onSaved: (p: Piece) => void; onDone: () => void }) {
  const [form, setForm] = useState({
    title: piece?.title ?? '', standfirst: piece?.standfirst ?? '', body: piece?.body ?? '',
    pillar: piece?.pillar ?? 'hearth', medium: piece?.medium ?? 'prose',
    image_path: piece?.image_path ?? null as string | null, image_alt: piece?.image_alt ?? '',
  });
  const [id, setId] = useState<string | null>(piece?.id ?? null);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(piece ? 'saved' : 'idle');
  const [msg, setMsg] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const set = (k: keyof typeof form, v: any) => { setForm((f) => ({ ...f, [k]: v })); setState('idle'); };

  useEffect(() => {
    if (!form.image_path) return setPreview(null);
    supabase.storage.from('guild').createSignedUrl(form.image_path, 3600).then(({ data }) => setPreview(data?.signedUrl ?? null));
  }, [form.image_path]);

  const save = useCallback(async (status: 'draft' | 'submitted' = 'draft') => {
    setState('saving'); setMsg('');
    const row = { ...form, status };
    const res = id
      ? await supabase.from('pieces').update(row).eq('id', id).select().single()
      : await supabase.from('pieces').insert(row).select().single();
    if (res.error) { setState('error'); setMsg(res.error.message); return null; }
    setId(res.data.id); setState('saved'); onSaved(res.data as Piece);
    return res.data as Piece;
  }, [form, id, onSaved]);

  // Quietly keep the draft safe while writing.
  useEffect(() => {
    if (state !== 'idle' || (!form.title.trim() && !form.body.trim())) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => save('draft'), 1800);
    return () => window.clearTimeout(timer.current);
  }, [form, state, save]);

  // Warn before leaving with unsaved words.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (state === 'idle' || state === 'saving') { e.preventDefault(); } };
    addEventListener('beforeunload', warn); return () => removeEventListener('beforeunload', warn);
  }, [state]);

  function tool(t: (typeof TOOLS)[number]) {
    const el = bodyRef.current; if (!el) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    let next: string, caret: number;
    if (t.wrap) {
      const sel = value.slice(a, b) || 'words';
      next = value.slice(0, a) + t.wrap + sel + t.wrap + value.slice(b);
      caret = a + t.wrap.length + sel.length + t.wrap.length;
    } else {
      const lineStart = value.lastIndexOf('\n', a - 1) + 1;
      next = value.slice(0, lineStart) + t.prefix + value.slice(lineStart);
      caret = b + t.prefix!.length;
    }
    set('body', next);
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(caret, caret); });
  }

  async function upload(file: File) {
    if (file.size > 4 * 1024 * 1024) return setMsg('Please choose a photograph under 4 MB.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${uid}/${crypto.randomUUID()}.${ext}`;
    setMsg('Uploading the photograph…');
    const { error } = await supabase.storage.from('guild').upload(path, file, { contentType: file.type, upsert: false });
    if (error) return setMsg(error.message);
    setMsg(''); set('image_path', path);
  }

  async function submit() {
    if (!form.title.trim() || words(form.body) < 20) { setMsg('Give it a title and at least a few lines before sending it to the editor.'); return; }
    if (!confirm('Send this piece to the editor? You can withdraw it later to keep editing.')) return;
    const p = await save('submitted');
    if (p) onDone();
  }

  return (
    <section className="d-write">
      <div className="d-write-bar">
        <span className="lab mut" role="status" aria-live="polite">
          {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Not saved' : (form.title || form.body) ? 'Unsaved changes' : (id ? '' : 'A new piece')}
        </span>
        <div className="d-write-actions">
          <button type="button" className="d-link" onClick={onDone}>Close</button>
          <button type="button" className="ghost d-btn" onClick={() => save('draft')} disabled={state === 'saving'}>Save draft</button>
          <button type="button" className="btn d-btn" onClick={submit} disabled={state === 'saving'}>Send to the editor</button>
        </div>
      </div>
      {piece?.status === 'returned' && piece.editor_note && <p className="d-note"><span className="lab">The editor’s note</span>{piece.editor_note}</p>}
      <p className="it d-notice" role="alert">{msg}</p>

      <div className="d-write-grid">
        <article className="d-paper">
          <label className="visually-hidden" htmlFor="d-title">Title</label>
          <textarea id="d-title" className="d-paper-title" rows={1} placeholder="Title" maxLength={200} value={form.title}
            onChange={(e) => { set('title', e.target.value); e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }} />
          <label className="visually-hidden" htmlFor="d-standfirst">Standfirst</label>
          <textarea id="d-standfirst" className="d-paper-standfirst" rows={2} placeholder="One sentence: what this piece is" maxLength={400} value={form.standfirst} onChange={(e) => set('standfirst', e.target.value)} />
          <div className="d-paper-tools" role="toolbar" aria-label="Formatting">
            {TOOLS.map((t) => <button key={t.label} type="button" title={t.hint} onClick={() => tool(t)}>{t.label}</button>)}
          </div>
          <textarea ref={bodyRef} className="d-paper-body" aria-label="The piece" value={form.body} onChange={(e) => set('body', e.target.value)}
            placeholder={'Begin here. Leave a blank line between paragraphs.'} />
          <span className="d-paper-count">{words(form.body)} words</span>
        </article>

        <aside className="d-details" aria-label="Details">
          <h2 className="eb">Details</h2>
          <label className="d-lbl"><span className="lab">Pillar</span>
            <select className="field" value={form.pillar} onChange={(e) => set('pillar', e.target.value)}>
              {PILLARS.map((p) => <option key={p.value} value={p.value}>{p.label.split(' · ')[0]}</option>)}
            </select>
          </label>
          <label className="d-lbl"><span className="lab">Medium</span>
            <select className="field" value={form.medium} onChange={(e) => set('medium', e.target.value)}>
              {MEDIUMS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </label>
          <div className="d-lbl">
            <span className="lab">Featured photograph</span>
            <label className="d-photo-frame">
              {preview ? <img src={preview} alt="" /> : <span className="lab mut">Add a photograph</span>}
              <input type="file" className="visually-hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            </label>
            <span className="d-hint">JPG, PNG or WebP, under 4 MB</span>
          </div>
          <label className="d-lbl"><span className="lab">Describe the photograph</span>
            <input className="field" maxLength={200} placeholder="For readers who can’t see it" value={form.image_alt} onChange={(e) => set('image_alt', e.target.value)} />
          </label>
          <div className="d-guide">
            <span className="lab">Writing marks</span>
            <p><code>##</code> starts a section heading</p>
            <p><code>&gt;</code> sets a line large, as a pull quote</p>
            <p><code>+</code> marks a verse; end it with — and the reference</p>
            <p><code>*words*</code> italic · <code>**words**</code> bold</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Queue({ queue, onRead }: { queue: (Piece & { profiles?: { display_name: string } })[]; onRead: (p: Piece) => void }) {
  return (
    <section className="d-section">
      <header className="d-page-head"><span className="eb">Editor</span><h1 className="h1 d-hello">Waiting for you</h1><p className="it mut d-sub">Pieces members have sent to your table, oldest first.</p></header>
      {queue.length === 0 ? <p className="it mut d-empty">Nothing is waiting. The table is quiet.</p> : (
        <ul className="d-list">
          {queue.map((p) => (
            <li key={p.id} className="d-item">
              <div className="d-item-main">
                <span className="lab mut">{p.profiles?.display_name ?? 'A member'} · sent {fmt(p.submitted_at)}</span>
                <span className="h3 d-item-title">{p.title || 'Untitled'}</span>
                {p.standfirst && <span className="it mut">{p.standfirst}</span>}
              </div>
              <div className="d-item-actions"><button type="button" className="d-link" onClick={() => onRead(p)}>Read</button></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Reader({ piece, onBack }: { piece: Piece; onBack: () => void }) {
  return (
    <section className="d-section d-reader d-paper">
      <button type="button" className="d-link" onClick={onBack}>← Waiting for you</button>
      <span className="eb">{PILLARS.find((x) => x.value === piece.pillar)?.label}</span>
      <h2 className="h2">{piece.title}</h2>
      {piece.standfirst && <p className="it mut" style={{ fontSize: 22 }}>{piece.standfirst}</p>}
      <div className="d-reading">{piece.body.split(/\n{2,}/).map((para, i) => <p key={i} className="body">{para}</p>)}</div>
      <p className="it d-notice">Approving, returning with a note, and declining arrive in the next update.</p>
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
  async function uploadPortrait(file: File) {
    if (file.size > 2 * 1024 * 1024) return setMsg('Please choose a portrait under 2 MB.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${profile.id}/portrait-${Date.now()}.${ext}`;
    setMsg('Uploading your portrait…');
    const { error } = await supabase.storage.from('portraits').upload(path, file, { contentType: file.type });
    if (error) return setMsg(error.message);
    setF((x) => ({ ...x, portrait_path: path })); setMsg('Portrait ready. Save your page to keep it.');
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const clean = { ...f, instagram: f.instagram.replace(/^@/, '').trim(), website: f.website.trim() };
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
          <input type="file" className="visually-hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && uploadPortrait(e.target.files[0])} />
          <span className="d-link">{f.portrait_path ? 'Change portrait' : 'Add a portrait'}</span>
        </label>
        <span className="d-hint">A photograph of you, or of your work. Square works best. JPG, PNG or WebP, under 2 MB.</span>
      </div>
      <label className="d-lbl"><span className="lab">Your name, as readers will see it</span><input className="field" value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} /></label>
      <label className="d-lbl"><span className="lab">Your craft · e.g. Essayist, Photographer</span><input className="field" value={f.craft} onChange={(e) => setF({ ...f, craft: e.target.value })} /></label>
      <label className="d-lbl"><span className="lab">About the author · a few lines in your own words</span><textarea className="field" style={{ height: 170 }} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></label>
      <div className="d-two">
        <label className="d-lbl"><span className="lab">Website</span><input className="field" inputMode="url" placeholder="yoursite.com" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} /></label>
        <label className="d-lbl"><span className="lab">Instagram</span><input className="field" placeholder="@yourname" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} /></label>
      </div>
      <label className="d-check"><input type="checkbox" checked={f.listed} onChange={(e) => setF({ ...f, listed: e.target.checked })} /><span>Show me in the Guild directory</span></label>
      <p className="it d-notice" role="status">{msg}</p>
      <div className="d-actions"><button className="btn d-btn" type="submit">Save my page</button></div>
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
