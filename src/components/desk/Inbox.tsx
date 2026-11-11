// Members' direct messages. The list of conversations (/guild/members/?view=inbox) and one conversation (?dm=<id>).
// Reads go through row-level security (the two people in it; the editor only once it's been reported); writes go
// through the database's own functions (dm_open, dm_send, dm_read). New messages arrive live (Supabase Realtime).
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { supabase, portraitUrl, isEditorRole, roleLabel, type Profile } from '../../lib/supabase';
import { Initials } from './DeskApp';
import { ago } from './Forum';
import '../../styles/inbox.css';

interface Thread { id: string; a: string; b: string; last_at: string; last_body: string; last_from: string | null; a_read_at: string; b_read_at: string; a_cleared_at: string; b_cleared_at: string }
interface Notice { id: string; writer_id: string; piece_id: string; created_at: string; read_at: string | null; kind?: 'published' | 'draft' | 'note'; title?: string; medium?: string }
interface Message { id: string; thread_id: string; author_id: string; body: string; created_at: string }
type People = Record<string, Pick<Profile, 'id' | 'display_name' | 'portrait_path' | 'role'>>;

function go(to: string) { history.pushState(null, '', to); dispatchEvent(new PopStateEvent('popstate')); window.scrollTo({ top: 0 }); }
function Link({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  return <a href={to} className={className} onClick={(e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); go(to); }}>{children}</a>;
}
const other = (t: Thread, me: string) => (t.a === me ? t.b : t.a);
const unread = (t: Thread, me: string) => !!t.last_from && t.last_from !== me && t.last_at > (t.a === me ? t.a_read_at : t.b_read_at);
const cleared = (t: Thread, me: string) => (t.a === me ? t.a_cleared_at : t.b_cleared_at);
/** How full your inbox is: { used, cap }. */
function useUsage(dep: unknown) {
  const [u, setU] = useState<{ used: number; cap: number } | null>(null);
  useEffect(() => { supabase.rpc('dm_usage').then(({ data }) => { if (data) setU(data as any); }); }, [dep]);
  return u;
}
function Gauge({ u }: { u: { used: number; cap: number } | null }) {
  if (!u) return null;
  const pct = Math.min(100, Math.round((u.used / u.cap) * 100));
  return (
    <div className={`ib-gauge${pct >= 100 ? ' full' : pct >= 85 ? ' near' : ''}`}>
      <span className="ib-gauge-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
      <span className="lab">{u.used} of {u.cap} messages{pct >= 100 ? ' · full' : ''}</span>
    </div>
  );
}
async function loadPeople(ids: string[]): Promise<People> {
  const want = [...new Set(ids.filter(Boolean))];
  if (!want.length) return {};
  const { data } = await supabase.from('profiles').select('id, display_name, portrait_path, role').in('id', want);
  return Object.fromEntries((Array.isArray(data) ? data : []).map((p: any) => [p.id, p]));
}
/** Tell the bars how many conversations have something new (the gold dot on Inbox). */
export async function refreshInboxDot() {
  const { data } = await supabase.rpc('dm_unread');
  const n = typeof data === 'number' ? data : 0;
  try { localStorage.setItem('oa_inbox_unread', String(n)); } catch {}
  document.querySelectorAll<HTMLElement>('[data-inbox-dot]').forEach((d) => { d.hidden = n === 0; d.textContent = n > 9 ? '9+' : String(n); });
}

// ---------------------------------------------------------------- the list
export function InboxList({ me }: { me: string }) {
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [people, setPeople] = useState<People>({});
  const [members, setMembers] = useState<People | null>(null);
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState('');
  const load = useCallback(async () => {
    const { data } = await supabase.from('dm_threads').select('*').or(`a.eq.${me},b.eq.${me}`).order('last_at', { ascending: false });
    const rows = (Array.isArray(data) ? data : []) as Thread[];
    // Notices: a writer you follow published something. One line each; they can't be answered.
    const { data: nt } = await supabase.from('inbox_notices').select('id, writer_id, piece_id, created_at, read_at, kind').eq('member_id', me).order('created_at', { ascending: false });
    const ns = (Array.isArray(nt) ? nt : []) as Notice[];
    if (ns.length) {
      const { data: pc } = await supabase.from('pieces').select('id, title, medium').in('id', ns.map((n) => n.piece_id));
      const by = new Map((pc ?? []).map((x: any) => [x.id, x]));
      ns.forEach((n) => { const x = by.get(n.piece_id); n.title = x?.title; n.medium = x?.medium; });
    }
    setPeople(await loadPeople([...rows.map((t) => other(t, me)), ...ns.map((n) => n.writer_id)]));
    setNotices(ns.filter((n) => n.title !== undefined));
    setThreads(rows.filter((t) => t.last_from && t.last_at > cleared(t, me)));   // shows once someone has written, and not since cleared
    refreshInboxDot();
  }, [me]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const ch = supabase.channel('inbox-list').on('postgres_changes', { event: '*', schema: 'public', table: 'dm_threads' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inbox_notices' }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);
  async function openPicker() {
    setPicking((v) => !v);
    if (!members) {
      const { data } = await supabase.from('profiles').select('id, display_name, portrait_path, role').eq('listed', true).order('display_name');
      setMembers(Object.fromEntries((Array.isArray(data) ? data : []).filter((p: any) => p.id !== me).map((p: any) => [p.id, p])));
    }
  }
  const fresh = (threads ?? []).filter((t) => unread(t, me)).length + notices.filter((n) => !n.read_at).length;
  // Conversations and notices together, newest first
  const rowsAll: ({ k: 'dm'; at: string; t: Thread } | { k: 'nt'; at: string; n: Notice })[] = [
    ...(threads ?? []).map((t) => ({ k: 'dm' as const, at: t.last_at, t })),
    ...notices.map((n) => ({ k: 'nt' as const, at: n.created_at, n })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));
  const usage = useUsage(threads);
  const full = !!usage && usage.used >= usage.cap;
  const found = Object.values(members ?? {}).filter((p) => !q.trim() || p.display_name.toLowerCase().includes(q.trim().toLowerCase()));
  return (
    <div className="ib">
      <header className="ib-head">
        <span className="eb">The Guild</span>
        <h1 className="h1">Inbox</h1>
        <p className="it mut ib-sub">Private conversations between members. Kind, honest, and kept by the forum rules.</p>
        <div className="ib-head-acts">
          <button type="button" className="ib-new" onClick={openPicker}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></svg>
            {picking ? 'Never mind' : 'New message'}</button>
          {threads && <span className="lab mut">{threads.length} {threads.length === 1 ? 'conversation' : 'conversations'}{notices.length ? ` · ${notices.length} ${notices.length === 1 ? 'notice' : 'notices'}` : ''}{fresh ? ` · ${fresh} new` : ''}</span>}
        </div>
        <Gauge u={usage} />
        {notices.length > 2 && <button type="button" className="lab ib-clear" onClick={async () => { if (!confirm(`Clear all ${notices.length} notices? Your conversations stay.`)) return; setNotices([]); await supabase.from('inbox_notices').delete().eq('member_id', me); load(); }}>Clear {notices.length} notices</button>}
      </header>
      {full && <p className="ib-full">Your inbox is full. Delete a conversation (or messages you’ve sent) to make room; until then, new messages can’t reach you.</p>}
      {picking && (
        <section className="ib-pick">
          <label className="g-search ib-find">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a member" autoFocus aria-label="Find a member" />
          </label>
          <ul className="ib-people">
            {!members ? <li className="lab mut">Gathering the Guild…</li> : found.length === 0 ? <li className="it mut">No member by that name.</li>
              : found.map((p) => (
                <li key={p.id}><button type="button" className="ib-person" onClick={async () => {
                  const { data, error } = await supabase.rpc('dm_open', { other: p.id });
                  if (error) { alert(error.message); return; }
                  go(`/guild/members/?dm=${data}`);
                }}><Initials name={p.display_name} size={36} src={portraitUrl(p.portrait_path)} /><span>{p.display_name}</span>{isEditorRole(p.role) && <span className="lab mut">{roleLabel(p.role)}</span>}</button></li>
              ))}
          </ul>
        </section>
      )}
      {!threads ? <p className="lab mut">Opening your inbox…</p> : rowsAll.length === 0 && !picking ? (
        <div className="ib-empty">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12.5" rx="1.5" /><path d="M4 7l8 6 8-6" /></svg>
          <p className="it">No messages yet.</p>
          <span className="lab mut">Start one with “New message”, or from any member’s page.</span>
        </div>
      ) : (
        <ol className="ib-list">
          {rowsAll.map((r) => {
            if (r.k === 'nt') {
              const n = r.n, w = people[n.writer_id], isNew = !n.read_at;
              return (
                <li key={n.id} className="ib-notice">
                  <a href={`/guild/members/?p=${n.piece_id}`} className={`ib-row${isNew ? ' new' : ''}`} onClick={(e) => {
                    if (e.metaKey || e.ctrlKey) return; e.preventDefault();
                    if (isNew) supabase.rpc('notice_read', { n: n.id }).then(() => refreshInboxDot());
                    go(`/guild/members/?p=${n.piece_id}`);
                  }}>
                    <Initials name={w?.display_name || 'A member'} size={46} src={portraitUrl(w?.portrait_path)} />
                    <span className="ib-row-text">
                      <span className="ib-row-top"><span className="ib-row-name">{w?.display_name || 'A member'}</span><span className="lab mut ib-row-when">{ago(n.created_at)}</span></span>
                      <span className="ib-row-last"><span className="lab ib-notice-k">{n.kind === 'draft' ? 'A draft, for your notes' : n.kind === 'note' ? 'Notes on a draft' : n.medium === 'photograph' ? 'New photograph' : 'New piece'}</span> {n.title || 'Untitled'}</span>
                    </span>
                    {isNew && <span className="ib-row-dot" aria-label="New" />}
                  </a>
                  <button type="button" className="ib-row-del" aria-label={`Remove the notice about ${n.title}`} onClick={async () => {
                    setNotices((ns) => ns.filter((x) => x.id !== n.id));
                    await supabase.from('inbox_notices').delete().eq('id', n.id); refreshInboxDot();
                  }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" /></svg></button>
                </li>
              );
            }
            const t = r.t;
            const o = people[other(t, me)];
            const isNew = unread(t, me);
            return (
              <li key={t.id}>
                <Link to={`/guild/members/?dm=${t.id}`} className={`ib-row${isNew ? ' new' : ''}`}>
                  <Initials name={o?.display_name || 'A member'} size={46} src={portraitUrl(o?.portrait_path)} />
                  <span className="ib-row-text">
                    <span className="ib-row-top"><span className="ib-row-name">{o?.display_name || 'A member'}</span><span className="lab mut ib-row-when">{ago(t.last_at)}</span></span>
                    <span className="ib-row-last">{t.last_from === me && <span className="mut">You: </span>}{t.last_body}</span>
                  </span>
                  {isNew && <span className="ib-row-dot" aria-label="New" />}
                </Link>
                <button type="button" className="ib-row-del" aria-label={`Delete the conversation with ${o?.display_name ?? 'this member'}`} onClick={async () => {
                  if (!confirm(`Delete your conversation with ${o?.display_name ?? 'this member'}? It leaves your inbox; they keep their copy.`)) return;
                  await supabase.rpc('dm_clear', { t: t.id }); load();
                }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" /></svg></button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- one conversation
export function InboxThread({ id, me, isEditor }: { id: string; me: string; isEditor: boolean }) {
  const [thread, setThread] = useState<Thread | null | undefined>(undefined);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [people, setPeople] = useState<People>({});
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [blocked, setBlocked] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const [peek, setPeek] = useState<string | null>(null);   // a bubble tapped to show its time and Delete
  const usage = useUsage(msgs.length);
  const load = useCallback(async () => {
    const { data: t } = await supabase.from('dm_threads').select('*').eq('id', id).maybeSingle();
    setThread((t as Thread) ?? null);
    if (!t) return;
    const [{ data: m }, ppl] = await Promise.all([
      supabase.from('dm_messages').select('*').eq('thread_id', id).order('created_at'),
      loadPeople([t.a, t.b]),
    ]);
    setMsgs(Array.isArray(m) ? (m as Message[]) : []); setPeople(ppl);
    const o = t.a === me ? t.b : t.a;
    const { data: bl } = await supabase.from('dm_blocks').select('blocked').eq('blocker', me).eq('blocked', o);
    setBlocked(!!(bl && bl.length));
    if ((me === t.a || me === t.b) && !(document as any).prerendering) { await supabase.rpc('dm_read', { t: id }); refreshInboxDot(); }   // (never while the page is only being made ready in the background)
  }, [id, me]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const ch = supabase.channel('dm-' + id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dm_messages', filter: `thread_id=eq.${id}` }, (p) => {
      const m = p.new as Message;
      setMsgs((ms) => (ms.some((x) => x.id === m.id) ? ms : m.author_id === me && ms.some((x) => x.id.startsWith('sending-')) ? [...ms.filter((x) => !x.id.startsWith('sending-')), m] : [...ms, m]));
      if (m.author_id !== me) { supabase.rpc('dm_read', { t: id }).then(() => refreshInboxDot()); }
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, me]);
  useEffect(() => { const l = listRef.current; if (l) l.scrollTop = l.scrollHeight; }, [msgs.length]);
  useEffect(() => { document.documentElement.classList.add('ib-open'); return () => document.documentElement.classList.remove('ib-open'); }, []);

  if (thread === undefined) return <p className="lab mut d-loading">Opening the conversation…</p>;
  if (thread === null) return <div className="ib"><Link to="/guild/members/?view=inbox" className="m-back lab">Inbox</Link><p className="it mut">This conversation isn’t here.</p></div>;
  const mine = me === thread.a || me === thread.b;
  const oid = other(thread, me);
  const o = people[mine ? oid : thread.a];
  const p2 = people[thread.b];
  async function send(e: FormEvent) {
    e.preventDefault();
    const body = text.trim(); if (!body) return;
    const temp: Message = { id: 'sending-' + Date.now(), thread_id: id, author_id: me, body, created_at: new Date().toISOString() };
    setMsgs((ms) => [...ms, temp]); setText(''); setBusy(true); setMsg('');
    const box = document.getElementById('ib-box') as HTMLTextAreaElement | null; if (box) box.style.height = '';   // back to one line
    const { data: newId, error } = await supabase.rpc('dm_send', { t: id, msg: body });
    setBusy(false);
    if (error) { setMsgs((ms) => ms.filter((x) => x.id !== temp.id)); setText(body); setMsg(error.message); return; }
    // Sent: settle it now rather than waiting for the live feed (which may not arrive on every phone)
    setMsgs((ms) => (ms.some((x) => x.id === newId) ? ms.filter((x) => x.id !== temp.id) : ms.map((x) => (x.id === temp.id ? { ...x, id: String(newId) } : x))));
  }
  async function block() {
    if (blocked) { await supabase.from('dm_blocks').delete().eq('blocker', me).eq('blocked', oid); setBlocked(false); return; }
    if (!confirm(`Block ${o?.display_name ?? 'this member'}? They won’t be able to message you, and they won’t be told.`)) return;
    const { error } = await supabase.from('dm_blocks').insert({ blocker: me, blocked: oid });
    if (error) alert(error.message); else setBlocked(true);
  }
  async function report() {
    const reason = prompt('Tell the Editor in Chief what happened. They will be able to read this conversation.');
    if (reason === null) return;
    const { error } = await supabase.from('dm_reports').insert({ thread_id: id, reporter: me, reason: reason.trim().slice(0, 1000) });
    alert(error ? error.message : 'Reported. The Editor in Chief will look at it. Thank you for keeping the table safe.');
  }
  // Group messages by day
  let lastDay = '';
  return (
    <div className="ib ib-thread">
      <header className="ib-thead">
        <div className="ib-who">
          <Link to={mine ? '/guild/members/?view=inbox' : '/guild/desk/#forms'} className="ib-back"><span className="visually-hidden">{mine ? 'Back to Inbox' : 'Back to Arrivals'}</span></Link>
          {mine ? <>
            <Link to={`/guild/members/?m=${oid}`} className="ib-who-link"><Initials name={o?.display_name || 'A member'} size={44} src={portraitUrl(o?.portrait_path)} /><span className="ib-who-name">{o?.display_name || 'A member'}</span></Link>
            <details className="fo-mod ib-mod">
              <summary className="lab" aria-label="More"><span aria-hidden="true">⋯</span></summary>
              <div className="fo-mod-menu">
                <Link to={`/guild/members/?m=${oid}`} className="ib-mod-a">See their page</Link>
                <button type="button" onClick={async () => {
                  if (!confirm('Delete this conversation from your inbox? They keep their copy.')) return;
                  await supabase.rpc('dm_clear', { t: id }); go('/guild/members/?view=inbox');
                }}>Delete conversation</button>
                <button type="button" onClick={report}>Report this conversation</button>
                <button type="button" className="fo-danger" onClick={block}>{blocked ? 'Unblock' : 'Block'} {o?.display_name?.split(' ')[0] ?? 'member'}</button>
              </div>
            </details>
          </> : <span className="ib-who-name">{people[thread.a]?.display_name} &amp; {p2?.display_name} <span className="lab mut">· reported conversation</span></span>}
        </div>
      </header>
      <ol className="ib-msgs" ref={listRef}>
        {msgs.length === 0 && <li className="it mut ib-hello">Say hello to {o?.display_name?.split(' ')[0] ?? 'them'}.</li>}
        {msgs.map((m, k) => {
          // A run of messages from one person within five minutes sits together; the time shows under the last.
          const nx = msgs[k + 1];
          const lastOfRun = !nx || nx.author_id !== m.author_id || +new Date(nx.created_at) - +new Date(m.created_at) > 5 * 60e3;
          const day = new Date(m.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
          const showDay = day !== lastDay; lastDay = day;
          const fromMe = m.author_id === me;
          return (
            <li key={m.id} className={`ib-m${fromMe ? ' me' : ''}${m.id.startsWith('sending-') ? ' sending' : ''}${lastOfRun ? ' run-end' : ''}`}>
              {showDay && <span className="lab ib-day">{day}</span>}
              {!mine && <span className="lab mut ib-m-who">{people[m.author_id]?.display_name}</span>}
              <span className="ib-bubble" onClick={() => setPeek((p) => (p === m.id ? null : m.id))}>{m.body}</span>
              {(lastOfRun || peek === m.id) && <span className="lab ib-m-when">{m.id.startsWith('sending-') ? 'Sending…' : new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {fromMe && mine && !m.id.startsWith('sending-') && <button type="button" className="ib-unsend" onClick={async () => {
                  if (!confirm('Delete this message for both of you?')) return;
                  const { error } = await supabase.rpc('dm_unsend', { m: m.id });
                  if (error) alert(error.message); else setMsgs((ms) => ms.filter((x) => x.id !== m.id));
                }}>Delete</button>}</span>}
            </li>
          );
        })}
      </ol>
      <div ref={endRef} />
      {msg && <p className="d-photo-msg" role="alert">{msg}</p>}
      {mine && usage && usage.used >= usage.cap && <p className="ib-full">Your inbox is full. Delete this or another conversation, or messages you’ve sent, to make room.</p>}
      {mine && (blocked
        ? <p className="it mut ib-blocked">You’ve blocked {o?.display_name ?? 'this member'}. <button type="button" className="d-link" onClick={block}>Unblock</button></p>
        : (
          <form className="fo-reply ib-reply" onSubmit={send}>
            <label className="visually-hidden" htmlFor="ib-box">Your message</label>
            <textarea id="ib-box" className="fo-reply-box" rows={1} maxLength={4000} value={text} placeholder={`Message ${o?.display_name?.split(' ')[0] ?? ''}…`}
              onChange={(e) => { setText(e.target.value); e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = Math.min(160, e.currentTarget.scrollHeight) + 'px'; }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !matchMedia('(pointer: coarse)').matches) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }} />
            <button className="fo-send" type="submit" disabled={busy || !text.trim()} aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </button>
          </form>
        ))}
      {!mine && isEditor && <p className="it mut ib-blocked">You can read this because it was reported. Resolve it from Arrivals.</p>}
    </div>
  );
}
