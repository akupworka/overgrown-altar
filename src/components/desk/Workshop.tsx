// The Workshop: a writer shares a draft privately with up to two members of the Guild, who read it and leave notes
// before it goes to the editor. Only the writer and the invited readers can see the draft or the notes (row-level
// security: draft_shares, draft_notes, and the "invited readers" rule on pieces). Sharing goes through share_draft().
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase, portraitUrl, type Piece } from '../../lib/supabase';

type Person = { id: string; display_name: string; portrait_path: string | null; role?: string | null };
interface Note { id: string; piece_id: string; author_id: string; body: string; created_at: string }
const MAX_READERS = 2;
const when = (d: string) => `${new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
const first = (n?: string) => (n || 'A member').split(' ')[0];
const listNames = (ns: string[]) => (ns.length <= 1 ? ns.join('') : `${ns.slice(0, -1).join(', ')} and ${ns[ns.length - 1]}`);

function Face({ p, size = 34 }: { p?: Person; size?: number }) {
  const src = portraitUrl(p?.portrait_path ?? null);
  const initials = (p?.display_name || 'A').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return <span className="ws-face" style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }} aria-hidden="true">{src ? <img src={src} alt="" /> : initials}</span>;
}
async function loadPeople(ids: string[]): Promise<Map<string, Person>> {
  const want = [...new Set(ids.filter(Boolean))];
  if (!want.length) return new Map();
  const { data } = await supabase.from('profiles').select('id, display_name, portrait_path, role').in('id', want);
  return new Map((data ?? []).map((p: any) => [p.id, p]));
}

/** For the Desk's cards: how many readers each of your drafts is with. */
export function useMyShares(me: string, dep?: unknown) {
  const [m, setM] = useState<Map<string, number>>(new Map());
  useEffect(() => {
    supabase.from('draft_shares').select('piece_id, reader_id').neq('reader_id', me).then(({ data }) => {
      const out = new Map<string, number>();
      (data ?? []).forEach((s: any) => out.set(s.piece_id, (out.get(s.piece_id) ?? 0) + 1));
      setM(out);
    });
  }, [me, dep]);
  return m;
}

/** The writer's dialog: who this draft is with, and inviting another reader (two at most). */
export function ShareDraft({ piece, me, onClose }: { piece: Piece; me: string; onClose: () => void }) {
  const [readers, setReaders] = useState<Person[] | null>(null);
  const [members, setMembers] = useState<Person[] | null>(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    const { data } = await supabase.from('draft_shares').select('reader_id').eq('piece_id', piece.id);
    const ppl = await loadPeople((data ?? []).map((s: any) => s.reader_id));
    setReaders([...ppl.values()]);
  }, [piece.id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    supabase.from('profiles').select('id, display_name, portrait_path, role').eq('listed', true).in('role', ['member', 'editor', 'staff']).order('display_name')
      .then(({ data }) => setMembers(((data ?? []) as Person[]).filter((p) => p.id !== me)));
  }, [me]);
  useEffect(() => { const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; addEventListener('keydown', esc); return () => removeEventListener('keydown', esc); }, [onClose]);
  const has = new Set((readers ?? []).map((r) => r.id));
  const found = (members ?? []).filter((p) => !has.has(p.id) && (!q.trim() || p.display_name.toLowerCase().includes(q.trim().toLowerCase()))).slice(0, 6);
  const full = (readers?.length ?? 0) >= MAX_READERS;
  return (
    <div className="dl-back" role="dialog" aria-modal="true" aria-labelledby="ws-h" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dl ws-dl">
        <span className="lab ws-k">The Workshop</span>
        <h2 id="ws-h" className="dl-h">Share “{piece.title || 'Untitled'}” for notes</h2>
        <p className="dl-p">Up to two members of the Guild can read this draft and leave you notes. Only they can see it, and it stays private until you send it to the editor.</p>
        {readers && readers.length > 0 && (
          <ul className="ws-readers">
            {readers.map((r) => (
              <li key={r.id}><Face p={r} /><span className="ws-name">{r.display_name}</span>
                <button type="button" className="ws-x" onClick={async () => { await supabase.from('draft_shares').delete().eq('piece_id', piece.id).eq('reader_id', r.id); load(); }}>Remove</button></li>
            ))}
          </ul>
        )}
        {!full && (
          <>
            <label className="g-search ws-find">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a member to invite" aria-label="Find a member to invite" />
            </label>
            <ul className="ws-people">
              {!members ? <li className="lab mut">Gathering the Guild…</li> : !found.length ? <li className="it mut">No member by that name.</li>
                : found.map((p) => (
                  <li key={p.id}><button type="button" className="ws-person" onClick={async () => {
                    setMsg('');
                    const { error } = await supabase.rpc('share_draft', { p_id: piece.id, reader: p.id });
                    if (error) setMsg(error.message); else { setQ(''); load(); }
                  }}><Face p={p} size={30} /><span className="ws-name">{p.display_name}</span><span className="lab ws-invite">Invite</span></button></li>
                ))}
            </ul>
          </>
        )}
        {full && <p className="it mut ws-full">This draft is with two readers. Remove one to invite another.</p>}
        {msg && <p className="d-photo-msg" role="alert">{msg}</p>}
        <div className="dl-acts">
          {readers && readers.length > 0 && <a className="ws-open lab" href={`/guild/members/?p=${piece.id}`}>Read their notes →</a>}
          <button type="button" className="dl-cancel" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

/** On the Guild page: drafts other members have shared with you, marked New while unread. Nothing shows until there is one. */
export function SharedWithYou({ me }: { me: string }) {
  const [rows, setRows] = useState<{ id: string; title: string; medium: string; who: string; fresh: boolean }[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data: sh } = await supabase.from('draft_shares').select('piece_id').eq('reader_id', me);
      const ids = (sh ?? []).map((s: any) => s.piece_id);
      if (!ids.length) { setRows([]); return; }
      const { data: pc } = await supabase.from('pieces').select('id, title, medium, author_id, status, updated_at').in('id', ids).neq('status', 'approved').order('updated_at', { ascending: false });
      const ppl = await loadPeople((pc ?? []).map((p: any) => p.author_id));
      // New: a draft just shared, or a note you haven't read yet (the same unread notices the Inbox shows)
      const { data: nt } = await supabase.from('inbox_notices').select('piece_id').eq('member_id', me).in('kind', ['draft', 'note']).is('read_at', null);
      const fresh = new Set((nt ?? []).map((n: any) => n.piece_id));
      setRows((pc ?? []).map((p: any) => ({ id: p.id, title: p.title || 'Untitled', medium: p.medium, who: ppl.get(p.author_id)?.display_name ?? 'A member', fresh: fresh.has(p.id) })));
    })();
  }, [me]);
  if (!rows?.length) return null;
  return (
    <section className="d-forum-panel ws-panel">
      <div className="d-forum-head"><span className="eb">The Workshop</span><span className="lab mut">Drafts shared with you</span></div>
      <ol className="rd-list">
        {rows.map((r) => (
          <li key={r.id} className="rd-row">
            <a className="rd-link" href={`/guild/members/?p=${r.id}`}>
              <span className="rd-t">{r.fresh && <span className="lab fo-new ws-new">New</span>}{r.title}</span>
              <span className="lab mut rd-m">{r.medium === 'photograph' ? 'A photograph' : 'A draft'} by {r.who} · read it and leave your notes</span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Under a draft: the notes between its writer and the invited readers. Shows only to them. */
export function WorkshopNotes({ piece }: { piece: Piece }) {
  const [me, setMe] = useState<string | null>(null);
  const [readers, setReaders] = useState<string[] | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [people, setPeople] = useState<Map<string, Person>>(new Map());
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user.id ?? null; setMe(uid);
    const [{ data: sh }, { data: nt }] = await Promise.all([
      supabase.from('draft_shares').select('reader_id').eq('piece_id', piece.id),
      supabase.from('draft_notes').select('*').eq('piece_id', piece.id).order('created_at'),
    ]);
    const rs = (sh ?? []).map((s: any) => s.reader_id);
    setReaders(rs); setNotes((nt ?? []) as Note[]);
    setPeople(await loadPeople([piece.author_id, ...rs, ...(nt ?? []).map((n: any) => n.author_id)]));
    // Opening the draft answers its notices in your Inbox
    if (uid) {
      const { data: ns } = await supabase.from('inbox_notices').select('id').eq('member_id', uid).eq('piece_id', piece.id).in('kind', ['draft', 'note']).is('read_at', null);
      await Promise.all((ns ?? []).map((n: any) => supabase.rpc('notice_read', { n: n.id })));
    }
  }, [piece.id, piece.author_id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const ch = supabase.channel('ws-' + piece.id).on('postgres_changes', { event: '*', schema: 'public', table: 'draft_notes', filter: `piece_id=eq.${piece.id}` }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [piece.id, load]);
  if (!me || !readers) return null;
  const mine = piece.author_id === me, reading = readers.includes(me);
  if (!mine && !reading) return null;
  if (mine && !readers.length && !notes.length) return null;
  const writer = people.get(piece.author_id);
  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim(); if (!body || !me) return;
    setBusy(true); setMsg('');
    const { error } = await supabase.from('draft_notes').insert({ piece_id: piece.id, author_id: me, body });
    setBusy(false);
    if (error) { setMsg(error.message); return; }
    setText(''); load();
  }
  return (
    <section className="ws" aria-label="The Workshop">
      <header className="ws-head">
        <span className="eb">The Workshop</span>
        <p className="it ws-sub">{mine
          ? (readers.length ? `Shared with ${listNames(readers.map((r) => people.get(r)?.display_name ?? 'a member'))}. Their notes gather here.` : 'No one is reading this draft now.')
          : `${writer?.display_name ?? 'The writer'} shared this draft with you for notes. Only ${first(writer?.display_name)} and the invited readers can see it. Be honest and be kind.`}</p>
      </header>
      {notes.length === 0 ? <p className="it mut ws-none">{mine ? 'No notes yet.' : 'What works? Where did you stumble? What would you cut?'}</p> : (
        <ol className="ws-notes">
          {notes.map((n) => {
            const p = people.get(n.author_id);
            return (
              <li key={n.id} className={`ws-note${n.author_id === piece.author_id ? ' writer' : ''}`}>
                <Face p={p} />
                <div className="ws-note-main">
                  <span className="lab ws-note-who">{n.author_id === me ? 'You' : p?.display_name ?? 'A member'}{n.author_id === piece.author_id && n.author_id !== me ? ' · the writer' : ''} · {when(n.created_at)}
                    {n.author_id === me && <button type="button" className="ws-x" onClick={async () => { if (!confirm('Remove this note?')) return; await supabase.from('draft_notes').delete().eq('id', n.id); load(); }}>Remove</button>}</span>
                  <p className="ws-note-body">{n.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <form className="ws-form" onSubmit={send}>
        <label className="visually-hidden" htmlFor="ws-box">{mine ? 'Your reply' : 'Your note'}</label>
        <textarea id="ws-box" rows={3} maxLength={4000} value={text} onChange={(e) => setText(e.target.value)} placeholder={mine ? 'Reply to your readers…' : `A note for ${first(writer?.display_name)}…`} />
        <div className="ws-form-row">
          {reading && <button type="button" className="ws-x" onClick={async () => {
            if (!confirm('Finished with this draft? It leaves your Desk; your notes stay with the writer.')) return;
            await supabase.from('draft_shares').delete().eq('piece_id', piece.id).eq('reader_id', me); location.href = '/guild/desk/';
          }}>I’m finished reading</button>}
          <button type="submit" className="ws-send" disabled={busy || !text.trim()}>{mine ? 'Reply' : 'Leave a note'}</button>
        </div>
        {msg && <p className="d-photo-msg" role="alert">{msg}</p>}
      </form>
    </section>
  );
}
