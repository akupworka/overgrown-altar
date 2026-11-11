// The Guild forum, for signed-in members only (Supabase keeps everyone else out).
//   /guild/members/?view=forum       the boards, each a row: its picture, name, what it is for, and its latest thread
//   /guild/members/?board=<slug>     a board's threads, pinned first, then the most recently active
//   /guild/members/?t=<thread id>    a thread: the opening post and every reply, and a reply box
// Each board keeps its most recently active threads (50; `forum_boards.keep_threads`); quieter ones are cleared away
// by the database when new ones arrive. Pinned threads always stay.
import { WayBadge } from './Way';
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { supabase, portraitUrl, roleLabel, roleClass, type Profile } from '../../lib/supabase';
import { pageList } from '../../lib/pager';
import { Initials } from './DeskApp';
import { PrestigeBadge } from './Prestige';
import '../../styles/forum.css';

interface Board { id: string; slug: string; name: string; description: string; image: string; position: number; editor_only: boolean; keep_threads: number }
interface Thread { id: string; board_id: string; author_id: string; title: string; pinned: boolean; locked: boolean; reply_count: number; created_at: string; last_post_at: string; last_author_id: string | null }
interface Post { id: string; thread_id: string; author_id: string; body: string; created_at: string; edited_at: string | null }
type People = Record<string, Pick<Profile, 'id' | 'display_name' | 'portrait_path' | 'role'>>;

const PER_PAGE = 20;

function go(to: string) {
  history.pushState(null, '', to);
  dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function Link({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  return <a href={to} className={className} onClick={(e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); go(to); }}>{children}</a>;
}
/** "just now", "12 minutes ago", "3 days ago", then a date. */
export function ago(iso: string) {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 60) return 'just now';
  const [n, u] = s < 3600 ? [Math.floor(s / 60), 'minute'] : s < 86400 ? [Math.floor(s / 3600), 'hour'] : s < 86400 * 7 ? [Math.floor(s / 86400), 'day'] : [0, ''];
  if (u) return `${n} ${u}${n === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
async function loadPeople(ids: (string | null | undefined)[]): Promise<People> {
  const want = [...new Set(ids.filter(Boolean) as string[])];
  if (!want.length) return {};
  const { data } = await supabase.from('profiles').select('id, display_name, portrait_path, role').in('id', want);
  return Object.fromEntries((Array.isArray(data) ? data : []).map((p: any) => [p.id, p]));
}
/** A writing box that grows with what's in it, up to a point. */
const grow = (el?: HTMLTextAreaElement | null) => { if (!el) return; el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 220) + 'px'; };
const nameOf = (people: People, id?: string | null) => (id && people[id]?.display_name) || 'A member';

// ---- What's new since you last looked (kept on this device): each thread's last visit, and when you first came.
const SEEN = 'oa_forum_seen', FIRST = 'oa_forum_first';
function seenMap(): Record<string, string> { try { return JSON.parse(localStorage.getItem(SEEN) || '{}'); } catch { return {}; } }
function firstVisit(): string {
  try { let f = localStorage.getItem(FIRST); if (!f) { f = new Date(Date.now() - 864e5 * 3).toISOString(); localStorage.setItem(FIRST, f); } return f; } catch { return new Date().toISOString(); }
}
/** Has this thread had a post (by someone else) since you last opened it? Where `mine` is given (the threads you started or
 *  replied in), only those count: "new" means someone answered a conversation you are part of, not that the forum moved. */
export function isNew(t: Pick<Thread, 'id' | 'last_post_at' | 'last_author_id'>, me?: string, seen = seenMap(), mine?: Set<string>) {
  if (me && t.last_author_id === me) return false;
  if (mine && !mine.has(t.id)) return false;
  return t.last_post_at > (seen[t.id] ?? firstVisit());
}
/** The threads you have started or replied in (a thread's opening words are a post too). */
function useMine(me?: string) {
  const [mine, setMine] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (me) supabase.from('forum_posts').select('thread_id').eq('author_id', me).then(({ data }) => setMine(new Set((data ?? []).map((x: any) => x.thread_id))));
  }, [me]);
  return mine;
}
function markSeen(id: string) {
  try { const m = seenMap(); m[id] = new Date().toISOString(); const keep = Object.entries(m).sort((a, b) => b[1].localeCompare(a[1])).slice(0, 400); localStorage.setItem(SEEN, JSON.stringify(Object.fromEntries(keep))); } catch {}
}

// ---- A post, set as written: blank lines make paragraphs, "> " lines are a quotation,
// *italic* and **bold** are honored, and web addresses become links. (React escapes everything else.)
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]|@[A-Z][\w’'-]*(?: [A-Z][\w’'-]*){0,2})/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    out.push(t.startsWith('@') ? <span key={key + i++} className="fo-at">{t}</span>
      : t.startsWith('**') ? <strong key={key + i++}>{t.slice(2, -2)}</strong>
      : t.startsWith('*') ? <em key={key + i++}>{t.slice(1, -1)}</em>
      : <a key={key + i++} href={t} target="_blank" rel="noopener noreferrer nofollow">{t.replace(/^https?:\/\/(www\.)?/, '')}</a>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
export function PostBody({ body }: { body: string }) {
  const blocks = body.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return (
    <div className="fo-body">
      {blocks.map((b, bi) => {
        const lines = b.split('\n');
        if (lines.every((l) => l.startsWith('>'))) {
          const q = lines.map((l) => l.replace(/^>\s?/, ''));
          const who = /^(.+) wrote:$/.exec(q[0]);
          return <blockquote key={bi} className="fo-quote">{who && <span className="lab fo-quote-who">{who[1]} wrote</span>}{(who ? q.slice(1) : q).map((l, li) => <span key={li}>{inline(l, `${bi}-${li}-`)}{li < q.length - 1 && <br />}</span>)}</blockquote>;
        }
        return <p key={bi}>{lines.map((l, li) => <span key={li}>{inline(l, `${bi}-${li}-`)}{li < lines.length - 1 && <br />}</span>)}</p>;
      })}
    </div>
  );
}

function Crumbs({ board, thread }: { board?: Board | null; thread?: string }) {
  // Phones get one plain way back (the full trail wraps onto several lines there).
  const back = thread && board ? { to: `/guild/members/?board=${board.slug}`, label: board.name }
    : board ? { to: '/guild/members/?view=forum', label: 'All forums' } : { to: '/guild/members/', label: 'The Guild' };
  return (
    <>
      <nav className="fo-crumbs lab" aria-label="Where you are">
        <Link to="/guild/members/">The Guild</Link><span aria-hidden="true">›</span>
        <Link to="/guild/members/?view=forum">The Forum</Link>
        {board && <><span aria-hidden="true">›</span><Link to={`/guild/members/?board=${board.slug}`}>{board.name}</Link></>}
        {thread && <><span aria-hidden="true">›</span><span className="fo-crumb-here">{thread}</span></>}
      </nav>
      <Link to={back.to} className="fo-back lab">{back.label}</Link>
    </>
  );
}

// ---------------------------------------------------------------- the boards

export function ForumIndex({ me, isEditor = false }: { me?: string; isEditor?: boolean } = {}) {
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [opening, setOpening] = useState(false);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [people, setPeople] = useState<People>({});
  const mineIds = useMine(me);   // threads you've started or replied in
  useEffect(() => {
    (async () => {
      const [{ data: b }, { data: t }] = await Promise.all([
        supabase.from('forum_boards').select('*').order('position'),
        supabase.from('forum_threads').select('*').order('last_post_at', { ascending: false }),
      ]);
      setBoards(Array.isArray(b) ? (b as Board[]) : []); setThreads(Array.isArray(t) ? (t as Thread[]) : []);
      setPeople(await loadPeople((Array.isArray(t) ? t : []).map((x: any) => x.last_author_id)));
    })();
  }, []);
  const posts = threads.reduce((n, t) => n + t.reply_count + 1, 0);
  return (
    <div className="fo">
      <header className="fo-head">
        <Crumbs />
        <span className="eb">For members of the Guild</span>
        <h1 className="h1">The Forum</h1>
        <p className="it mut fo-sub">Where the Guild talks between pieces: ideas in progress, craft, photographs, books, and prayer. Only members can see it.</p>
        {boards && <span className="lab mut">{boards.length} {boards.length === 1 ? 'forum' : 'forums'} · {threads.length} {threads.length === 1 ? 'thread' : 'threads'} · {posts} {posts === 1 ? 'post' : 'posts'}</span>}
        {isEditor && <div className="fo-index-acts">
          { <button type="button" className="fo-glass-btn" onClick={() => setOpening((o) => !o)}>{!opening && <span aria-hidden="true">+</span>}{opening ? 'Never mind' : 'Open a new forum'}</button>}
        </div>}
      </header>
      <div className="fo-pair">
      {me && mineIds.size > 0 && (() => {
        const mineT = threads.filter((t) => mineIds.has(t.id)), fresh = mineT.filter((t) => isNew(t, me)).length;
        return (
          <Link to="/guild/members/?view=mine" className={`fo-rules-card fo-mine-card${fresh ? ' fresh' : ''}`}>
            <span className="fo-rules-mark" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h12v9H9l-3 3v-3H4z" /><path d="M16 9h4v9h-2v3l-3-3h-5v-1" /></svg></span>
            <span className="fo-rules-text"><span className="fo-rules-name">Your conversations{fresh > 0 && <span className="lab fo-new fo-mine-n">{fresh} new</span>}</span>
              <span className="it fo-rules-line">{fresh ? `New replies in ${fresh === 1 ? 'a thread' : `${fresh} threads`} you’re part of.` : `The ${mineT.length === 1 ? 'thread' : `${mineT.length} threads`} you’ve started or replied in.`}</span></span>
            <span className="fo-rules-go" aria-hidden="true">→</span>
          </Link>
        );
      })()}
      <Link to="/guild/members/?view=rules" className="fo-rules-card">
        <span className="fo-rules-mark" aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg></span>
        <span className="fo-rules-text"><span className="fo-rules-name">The forum rules</span><span className="it fo-rules-line">How we keep the table safe and kind. Read before you post.</span></span>
        <span className="fo-rules-go" aria-hidden="true">→</span>
      </Link>
      </div>
      {isEditor && opening && <NewForum onDone={(slug) => go(`/guild/members/?board=${slug}`)} onCancel={() => setOpening(false)} />}
      {!boards ? <p className="lab mut">Opening the forum…</p> : (
        <ol className="fo-boards">
          {boards.map((b) => {
            const mine = threads.filter((t) => t.board_id === b.id);
            const latest = mine[0];
            const fresh = mine.filter((t) => isNew(t, me, undefined, mineIds)).length;   // only your own conversations light a forum
            return (
              <li key={b.id}>
                <Link to={`/guild/members/?board=${b.slug}`} className="fo-board">
                  <span className="fo-board-img">{b.image ? <img src={b.image} alt="" loading="lazy" /> : null}</span>
                  <span className="fo-board-text">
                    <span className="fo-board-name"><span className="fo-chev" aria-hidden="true">»</span>{b.name}{b.editor_only && <span className="lab fo-tag">From the editor</span>}{fresh > 0 && <span className="lab fo-new">{fresh} new</span>}</span>
                    <span className="fo-board-desc">{b.description}</span>
                  </span>
                  <span className="fo-board-stats">
                    <span className="lab">{mine.length} {mine.length === 1 ? 'thread' : 'threads'}</span>
                    {latest
                      ? <span className="fo-board-latest"><span className="fo-latest-t">{latest.title}</span><span className="lab mut">{nameOf(people, latest.last_author_id)} · {ago(latest.last_post_at)}</span></span>
                      : <span className="it mut fo-quiet">Quiet so far</span>}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      <p className="it mut fo-note">Each forum keeps its 50 most recently active threads; when it grows full, its quietest threads are cleared away to make room (pinned threads always stay). A thread closes once it reaches 200 replies.</p>
    </div>
  );
}

// Ten threads to a page in a forum (each keeps its 50 most active); twenty replies to a page in a thread,
// which closes itself at 200 replies.
const FORUM_PER = 20;
const THREADS_PER = 10;
const MAX_REPLIES = 200;

// The editor opens a forum: a name, a line about it, and a window of glass for its picture.
const FORUM_PICTURES = Array.from({ length: 12 }, (_, i) => `/images/seats/seat-${i + 1}.jpg`);
function NewForum({ onDone, onCancel }: { onDone: (slug: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [pic, setPic] = useState(FORUM_PICTURES[Math.floor(Math.random() * FORUM_PICTURES.length)]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  async function make(e: FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setMsg('Give the forum a name.');
    setBusy(true); setMsg('');
    const { data, error } = await supabase.from('forum_boards').insert({ name: name.trim().slice(0, 60), description: desc.trim().slice(0, 300), image: pic }).select('slug').single();
    setBusy(false);
    if (error || !data) return setMsg('The forum couldn’t be opened. ' + (error?.message ?? ''));
    onDone((data as any).slug);
  }
  return (
    <form className="fo-compose fo-newforum" onSubmit={make}>
      <span className="eb">Open a new forum</span>
      <p className="it mut fo-sub">A room for a subject the Guild keeps returning to. Every member may start threads in it, and the forum rules apply.</p>
      <label className="d-lbl"><span className="lab">Name</span>
        <input className="field" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="The Lantern Room" autoFocus /></label>
      <label className="d-lbl"><span className="lab">What it’s for</span>
        <input className="field" maxLength={300} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="One line: what belongs here" /></label>
      <fieldset className="fo-pics"><legend className="lab">Its window</legend>
        <div className="fo-pics-row">{FORUM_PICTURES.map((src) => (
          <label key={src} className={`fo-pic${pic === src ? ' on' : ''}`}><input type="radio" name="fo-pic" checked={pic === src} onChange={() => setPic(src)} /><img src={src} alt="" loading="lazy" /></label>
        ))}</div>
      </fieldset>
      {msg && <p className="d-photo-msg" role="alert">{msg}</p>}
      <div className="fo-compose-acts"><button className="btn d-btn" type="submit" disabled={busy}>{busy ? 'Opening…' : 'Open the forum'}</button><button type="button" className="d-textbtn" onClick={onCancel}>Cancel</button></div>
    </form>
  );
}

// ---------------------------------------------------------------- one forum

export function ForumBoard({ slug, me, isEditor }: { slug: string; me: string; isEditor: boolean }) {
  const mineIds = useMine(me);   // "New" on a thread means someone answered a conversation you're part of
  const [board, setBoard] = useState<Board | null | undefined>(undefined);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [people, setPeople] = useState<People>({});
  const [page, setPage] = useState(1);
  const [writing, setWriting] = useState(false);
  const load = useCallback(async () => {
    const { data: b } = await supabase.from('forum_boards').select('*').eq('slug', slug).maybeSingle();
    setBoard((b as Board) ?? null);
    if (!b) return;
    const { data: t } = await supabase.from('forum_threads').select('*').eq('board_id', b.id)
      .order('pinned', { ascending: false }).order('last_post_at', { ascending: false });
    setThreads(Array.isArray(t) ? (t as Thread[]) : []);
    setPeople(await loadPeople((Array.isArray(t) ? t : []).flatMap((x: any) => [x.author_id, x.last_author_id])));
  }, [slug]);
  useEffect(() => { load(); }, [load]);
  if (board === undefined) return <p className="lab mut d-loading">Opening the forum…</p>;
  if (board === null) return <div className="fo"><Crumbs /><p className="it mut">This forum isn’t here any more.</p></div>;
  const canStart = isEditor || !board.editor_only;
  const closeSheet = () => setWriting(false);
  const pages = Math.max(1, Math.ceil(threads.length / THREADS_PER));
  const cur = Math.min(page, pages);
  const onPage = threads.slice((cur - 1) * THREADS_PER, cur * THREADS_PER);
  return (
    <div className="fo">
      <header className="fo-head fo-board-head">
        {board.image && <img className="fo-banner" src={board.image} alt="" />}
        <Crumbs board={board} />
        <span className="eb">The Forum</span>
        <h1 className="h1">{board.name}</h1>
        <p className="it mut fo-sub">{board.description}</p>
        {isEditor && (
          <details className="fo-mod fo-forum-mod">
            <summary className="lab"><span aria-hidden="true">⋯</span> Manage this forum</summary>
            <div className="fo-mod-menu">
              <button type="button" onClick={async () => {
                const name = prompt('The forum’s name', board.name); if (name === null) return;
                const description = prompt('One line about it', board.description); if (description === null) return;
                const { error } = await supabase.from('forum_boards').update({ name: name.trim().slice(0, 60) || board.name, description: description.trim().slice(0, 300) }).eq('id', board.id);
                if (error) alert(error.message); else load();
              }}>Rename or describe</button>
              <button type="button" className="fo-danger" onClick={async () => {
                if (!confirm(`Delete the forum “${board.name}”${threads.length ? `, with its ${threads.length} ${threads.length === 1 ? 'thread' : 'threads'} and every reply` : ''}? It can’t be brought back.`)) return;
                const { error } = await supabase.from('forum_boards').delete().eq('id', board.id);
                if (error) alert('The forum couldn’t be deleted. ' + error.message); else go('/guild/members/?view=forum');
              }}>Delete this forum</button>
            </div>
          </details>
        )}
        <div className="fo-head-acts">
          {canStart
            ? <button type="button" className="btn d-btn" onClick={() => setWriting((w) => !w)}>{!writing && <span aria-hidden="true" className="fo-plus">+</span>}{writing ? 'Never mind' : 'Start a thread'}</button>
            : <span className="lab mut">Only the editor starts threads here. Everyone may reply.</span>}
          <span className="lab mut">{threads.length} {threads.length === 1 ? 'thread' : 'threads'} · keeps the {board.keep_threads} most active{pages > 1 ? ` · page ${cur} of ${pages}` : ''}</span>
        </div>
      </header>
      {writing && <NewThread board={board} me={me} onCancel={closeSheet} onDone={(id) => { setWriting(false); go(`/guild/members/?t=${id}`); }} />}
      {threads.length === 0 ? (
        <div className="fo-empty-card">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h12v8H9l-4 3v-3H4zM18 9h2v8h-1v3l-4-3h-5v-2" /></svg>
          <p className="it">No threads yet.</p>
          <span className="lab mut">{canStart ? 'Start the first conversation above.' : 'The editor will open the first one.'}</span>
        </div>
      ) : (
        <ol className="fo-threads">
          <li className="fo-threads-head lab mut" aria-hidden="true"><span>Thread</span><span>Replies</span><span>Latest</span></li>
          {onPage.map((t) => (
            <li key={t.id}>
              <Link to={`/guild/members/?t=${t.id}`} className={`fo-thread${t.pinned ? ' pinned' : ''}`}>
                <span className="fo-thread-main">
                  {(t.pinned || t.locked || isNew(t, me, undefined, mineIds)) && (
                    <span className="fo-thread-tags">
                      {t.pinned && <span className="lab fo-tag">Pinned</span>}
                      {t.locked && <span className="lab fo-tag fo-tag-dim">Closed</span>}
                      {isNew(t, me, undefined, mineIds) && <span className="lab fo-new">New</span>}
                    </span>
                  )}
                  <span className="fo-thread-t">{t.title}</span>
                  <span className="lab mut fo-thread-by">{nameOf(people, t.author_id)} · {ago(t.created_at)}<span className="fo-thread-last-m">Last reply {ago(t.last_post_at)}</span></span>
                </span>
                <span className="fo-thread-n" aria-label={`${t.reply_count} ${t.reply_count === 1 ? 'reply' : 'replies'}`}>
                  <svg className="fo-bubble" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4v-4z" /></svg>
                  <b>{t.reply_count}</b><span className="lab mut fo-thread-n-word"> {t.reply_count === 1 ? 'reply' : 'replies'}</span>
                </span>
                <span className="fo-thread-last lab mut">{nameOf(people, t.last_author_id)}<br />{ago(t.last_post_at)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      {/* A quiet word under a short board, so the page doesn't trail off into nothing */}
      {threads.length > 0 && threads.length < 4 && (
        <p className="it mut fo-board-end">{canStart ? 'That’s everything so far. Start the next conversation whenever you’re ready.' : 'That’s everything so far. Replies are welcome on any thread.'}</p>
      )}
      {pages > 1 && (
        <nav className="pager fo-pager" aria-label="Pages of threads">
          <button type="button" className="pg-step" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="Newer threads">‹<span className="pg-word">Newer</span></button>
          {pageList(cur, pages).map((n, i) => n === '…' ? <span key={'g' + i} className="pg-gap" aria-hidden="true">…</span>
            : <button key={n} type="button" className="pg-n" aria-current={n === cur ? 'page' : undefined} onClick={() => setPage(n)}>{n}</button>)}
          <button type="button" className="pg-step" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="Older threads"><span className="pg-word">Older</span>›</button>
        </nav>
      )}
    </div>
  );
}

function NewThread({ board, me, onDone, onCancel }: { board: Board; me: string; onDone: (id: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  async function send(e: FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) return setMsg('Give the thread a title of a few words.');
    if (!body.trim()) return setMsg('Write the opening post.');
    setBusy(true); setMsg('');
    const { data: t, error } = await supabase.from('forum_threads').insert({ board_id: board.id, author_id: me, title: title.trim() }).select().single();
    if (error || !t) { setBusy(false); return setMsg('The thread couldn’t be started. ' + (error?.message ?? '')); }
    const { error: e2 } = await supabase.from('forum_posts').insert({ thread_id: t.id, author_id: me, body: body.trim() });
    setBusy(false);
    if (e2) { await supabase.from('forum_threads').delete().eq('id', t.id); return setMsg('The thread couldn’t be started. ' + e2.message); }
    onDone(t.id);
  }
  // Phones: a full-screen sheet with Cancel and Post at the top, like writing a message. Larger screens: in place.
  const [phone] = useState(() => matchMedia('(max-width: 700px)').matches);
  useEffect(() => {
    if (phone) document.documentElement.classList.add('fo-sheet-open');
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    addEventListener('keydown', key);
    return () => { document.documentElement.classList.remove('fo-sheet-open'); removeEventListener('keydown', key); };
  }, [onCancel, phone]);
  const form = (
    <form className="fo-compose fo-sheet" onSubmit={send} id="fo-new" role="dialog" aria-label={`New thread in ${board.name}`}>
      <div className="fo-sheet-bar">
        <button type="button" className="fo-sheet-cancel" onClick={onCancel}>Cancel</button>
        <span className="fo-sheet-title"><span className="lab mut">New thread</span><span>{board.name}</span></span>
        <button type="submit" className="fo-sheet-post" disabled={busy || title.trim().length < 3 || !body.trim()}>{busy ? 'Posting…' : 'Post'}</button>
      </div>
      <label className="d-lbl"><span className="lab">Title</span>
        <input className="field" maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is it about?" autoFocus /></label>
      <label className="d-lbl"><span className="lab">Opening post</span>
        <textarea className="field" rows={7} maxLength={6000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Say what’s on your mind. Be generous, be honest, be kind." /></label>
      {msg && <p className="d-photo-msg" role="alert">{msg}</p>}
      <div className="fo-compose-acts"><button className="btn d-btn" type="submit" disabled={busy}>{busy ? 'Starting…' : 'Start the thread'}</button><span className="lab mut">{6000 - body.length} characters left</span></div>
      <p className="lab mut fo-sheet-hint">*italic* · **bold** · links work · {6000 - body.length} characters left</p>
    </form>
  );
  // On phones the sheet is drawn above everything (the site header included).
  return phone ? createPortal(form, document.body) : form;
}

// ---------------------------------------------------------------- one thread

export function ForumThread({ id, me, isEditor }: { id: string; me: string; isEditor: boolean }) {
  const [thread, setThread] = useState<Thread | null | undefined>(undefined);
  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [people, setPeople] = useState<People>({});
  // Your reply is kept on this device as you type, so leaving the page never loses it.
  const DRAFT = `oa_forum_draft_${id}`;
  const [reply, setReply] = useState(() => { try { return localStorage.getItem(DRAFT) ?? ''; } catch { return ''; } });
  useEffect(() => { try { if (reply.trim()) localStorage.setItem(DRAFT, reply); else localStorage.removeItem(DRAFT); } catch {} }, [reply, DRAFT]);
  const [pillGone, setPillGone] = useState(false);
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [pieces, setPieces] = useState<Record<string, number>>({});   // each poster's published pieces, for their prestige
  const [since] = useState(() => seenMap()[id] ?? firstVisit());
  const [pPage, setPPage] = useState<number | null>(null);
  // Arriving at one comment (…#post-<id>, from the bell or a report): turn to its page, bring it into view, ring it in gold.
  const [jump, setJump] = useState(0);
  useEffect(() => { const on = () => setJump((n) => n + 1); addEventListener('hashchange', on); return () => removeEventListener('hashchange', on); }, []);
  useEffect(() => {
    const m = location.hash.match(/^#post-([\w-]+)$/);
    if (!m || !posts.length) return;
    const at = posts.findIndex((x) => x.id === m[1]);
    if (at < 0) return;
    setPPage(Math.floor(at / FORUM_PER) + 1);
    const t = setTimeout(() => {
      const el = document.getElementById(`post-${m[1]}`);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('fo-jump');
      history.replaceState(history.state, '', location.pathname + location.search);   // once shown, the address is the thread's again
    }, 150);
    return () => clearTimeout(t);
  }, [posts.length > 0, id, jump]);
  // Editors: the posts here with a report waiting. Each is ringed in red, with the reason and a tick if it is fine as it is.
  const [reported, setReported] = useState<Record<string, { id: string; reason: string }[]>>({});
  const loadReported = useCallback(() => {
    if (!isEditor) return;
    supabase.from('forum_reports').select('id, post_id, reason, post:forum_posts!inner(thread_id)').eq('resolved', false).eq('post.thread_id', id).then(({ data }) => {
      const m: Record<string, { id: string; reason: string }[]> = {};
      (Array.isArray(data) ? data : []).forEach((r: any) => { (m[r.post_id] ||= []).push({ id: r.id, reason: r.reason }); });
      setReported(m);
    });
  }, [isEditor, id]);
  useEffect(() => { loadReported(); }, [loadReported, posts.length]);
  async function reportFine(postId: string) {
    const ids = (reported[postId] ?? []).map((r) => r.id);
    if (!ids.length) return;
    setReported((m) => { const n = { ...m }; delete n[postId]; return n; });
    await supabase.from('forum_reports').update({ resolved: true }).in('id', ids);
    loadReported();
  }
  // Follow a thread you have not posted in, or mute one you have: the bell obeys (a tag always reaches you).
  const [watch, setWatch] = useState<'follow' | 'mute' | null>(null);
  useEffect(() => { supabase.from('thread_watch').select('state').eq('thread_id', id).eq('member_id', me).maybeSingle().then(({ data }) => setWatch(((data as any)?.state as 'follow' | 'mute') ?? null)); }, [id, me]);
  async function setWatching(next: 'follow' | 'mute' | null) {
    setWatch(next);
    const { error } = next ? await supabase.from('thread_watch').upsert({ member_id: me, thread_id: id, state: next }, { onConflict: 'member_id,thread_id' })
      : await supabase.from('thread_watch').delete().eq('member_id', me).eq('thread_id', id);
    if (error) setMsg(error.message);
  }
  // @mentions: everyone at the table, and what's being typed after an @
  const [everyone, setEveryone] = useState<{ id: string; display_name: string }[]>([]);
  const [atQ, setAtQ] = useState<string | null>(null);
  useEffect(() => { supabase.from('profiles').select('id, display_name').order('display_name').then(({ data }) => setEveryone(((data ?? []) as any[]).filter((p) => p.display_name))); }, []);
  const atMatches = atQ === null ? [] : everyone.filter((p) => p.id !== me && (p.display_name.toLowerCase().startsWith(atQ.toLowerCase()) || p.display_name.toLowerCase().split(/\s+/).some((w) => w.startsWith(atQ.toLowerCase())))).slice(0, 5);
  const watchAt = (box: HTMLTextAreaElement) => {
    const before = box.value.slice(0, box.selectionStart ?? box.value.length);
    const m = /(?:^|\s)@([^\s@]{0,20}(?: [^\s@]{0,20})?)$/.exec(before);
    setAtQ(m ? m[1] : null);
  };
  const pickAt = (name: string) => {
    const box = document.querySelector<HTMLTextAreaElement>('.fo-reply textarea'); if (!box) return;
    const caret = box.selectionStart ?? reply.length;
    const before = reply.slice(0, caret).replace(/@([^\s@]{0,20}(?: [^\s@]{0,20})?)$/, `@${name} `);
    const next = before + reply.slice(caret);
    setReply(next); setAtQ(null);
    setTimeout(() => { box.focus(); box.setSelectionRange(before.length, before.length); }, 0);
  };   // which page of twenty replies     // when you last looked, so newer posts can be marked
  useEffect(() => () => markSeen(id), [id]);
  const load = useCallback(async () => {
    const { data: t } = await supabase.from('forum_threads').select('*').eq('id', id).maybeSingle();
    setThread((t as Thread) ?? null);
    if (!t) return;
    const [{ data: b }, { data: p }] = await Promise.all([
      supabase.from('forum_boards').select('*').eq('id', t.board_id).maybeSingle(),
      supabase.from('forum_posts').select('*').eq('thread_id', id).order('created_at'),
    ]);
    setBoard((b as Board) ?? null); setPosts(Array.isArray(p) ? (p as Post[]) : []);
    const authors = [...new Set((Array.isArray(p) ? p : []).map((x: any) => x.author_id))];
    setPeople(await loadPeople(authors));
    if (authors.length) {
      const { data: w } = await supabase.rpc('piece_counts');
      const n: Record<string, number> = {}; (Array.isArray(w) ? w : []).forEach((r: any) => { n[r.author_id] = r.n; });
      setPieces(n);
    }
    markSeen(id);
  }, [id]);
  useEffect(() => { load(); }, [load]);
  function quote(p: Post) {
    const who = people[p.author_id]?.display_name || 'A member';
    const text = p.body.split('\n').filter((l) => !l.startsWith('>')).join('\n').trim().slice(0, 600);
    setReply((r) => `> ${who} wrote:\n${text.split('\n').map((l) => `> ${l}`).join('\n')}\n\n${r}`);
    const box = document.querySelector<HTMLTextAreaElement>('.fo-reply textarea');
    setTimeout(() => { box?.focus(); grow(box); }, 50);
  }
  useEffect(() => { if (thread) document.title = `${thread.title} · The Forum · Overgrown Altar`; }, [thread]);

  if (thread === undefined) return <p className="lab mut d-loading">Opening the thread…</p>;
  if (thread === null) return (
    <div className="fo"><Crumbs /><p className="it mut fo-empty">This thread isn’t here any more. It may have been cleared away to make room, or taken down.</p></div>
  );
  const open = !thread.locked || isEditor;
  const fresh = posts.filter((p) => p.created_at > since && p.author_id !== me);
  const pPages = Math.max(1, Math.ceil(posts.length / FORUM_PER));
  const pCur = Math.min(pPage ?? 1, pPages);
  const pageOf = (postId: string) => Math.floor(Math.max(0, posts.findIndex((x) => x.id === postId)) / FORUM_PER) + 1;
  const showPost = (postId: string) => { setPPage(pageOf(postId)); setTimeout(() => document.getElementById(`post-${postId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); };
  const postPager = pPages > 1 && (
    <nav className="pager fo-pager" aria-label="Pages of replies">
      <button type="button" className="pg-step" disabled={pCur === 1} onClick={() => setPPage(pCur - 1)} aria-label="Earlier replies">‹<span className="pg-word">Earlier</span></button>
      {pageList(pCur, pPages).map((n, i) => n === '…' ? <span key={'g' + i} className="pg-gap" aria-hidden="true">…</span>
        : <button key={n} type="button" className="pg-n" aria-current={n === pCur ? 'page' : undefined} onClick={() => setPPage(n)}>{n}</button>)}
      <button type="button" className="pg-step" disabled={pCur === pPages} onClick={() => setPPage(pCur + 1)} aria-label="Later replies"><span className="pg-word">Later</span>›</button>
    </nav>
  );
  async function send(e: FormEvent) {
    e.preventDefault();
    const text = reply.trim();
    if (!text) return;
    // It appears at once; the forum confirms it a moment later.
    const temp: Post = { id: 'sending-' + Date.now(), thread_id: id, author_id: me, body: text, created_at: new Date().toISOString(), edited_at: null };
    setPosts((ps) => [...ps, temp]); setReply(''); setBusy(true); setMsg('');
    setPPage(Math.floor(posts.length / FORUM_PER) + 1);   // your reply lands on the last page: go there
    const box = document.querySelector<HTMLTextAreaElement>('.fo-reply textarea'); if (box) box.style.height = '';
    requestAnimationFrame(() => document.getElementById(`post-${temp.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    const { data: made, error } = await supabase.from('forum_posts').insert({ thread_id: id, author_id: me, body: text }).select('id').single();
    setBusy(false);
    if (error) { setPosts((ps) => ps.filter((p) => p.id !== temp.id)); setReply(text); return setMsg('Your reply couldn’t be posted, so it’s back in the box. ' + error.message); }
    // Anyone named with an @ is told (in their daily letter)
    const named = everyone.filter((p) => p.id !== me && text.includes('@' + p.display_name)).slice(0, isEditor ? 200 : 8);   // a post calls on eight members at most (the database holds the same line)
    if (made?.id && named.length) await supabase.from('forum_mentions').insert(named.map((p) => ({ post_id: made.id, member_id: p.id, by_id: me })));
    setAtQ(null);
    load();
  }
  async function saveEdit() {
    if (!editing || !editing.body.trim()) return;
    const { error } = await supabase.from('forum_posts').update({ body: editing.body.trim() }).eq('id', editing.id);
    if (error) return setMsg(error.message);
    setEditing(null); load();
  }
  // Report a post to the editors (only they see the report; one open report a person a post).
  async function reportPost(p: Post) {
    const reason = prompt('Tell the editors what is wrong with this post. Only they will see your report.');
    if (reason === null) return;
    const { error } = await supabase.from('forum_reports').insert({ post_id: p.id, reporter: me, reason: reason.trim().slice(0, 1000) });
    alert(error ? error.message : 'Reported. An editor will look at it. Thank you for keeping the table safe.');
  }
  async function removePost(p: Post) {
    if (!confirm('Delete this post? It can’t be brought back.')) return;
    const { error } = await supabase.from('forum_posts').delete().eq('id', p.id);
    if (error) return setMsg(error.message);
    load();
  }
  async function removeThread() {
    if (!confirm('Delete the whole thread, with every reply? It can’t be brought back.')) return;
    const { error } = await supabase.from('forum_threads').delete().eq('id', id);
    if (error) return setMsg(error.message);
    go(board ? `/guild/members/?board=${board.slug}` : '/guild/members/?view=forum');
  }
  async function flag(k: 'pinned' | 'locked') {
    const { error } = await supabase.from('forum_threads').update({ [k]: !thread![k] }).eq('id', id);
    if (error) return setMsg(error.message);
    load();
  }
  return (
    <div className="fo">
      <header className="fo-head fo-thread-head">
        <Crumbs board={board} thread={thread.title} />
        <h1 className="h1 fo-thread-title">{thread.title}</h1>
        <span className="lab mut">
          {thread.pinned && <span className="fo-tag">Pinned</span>}{thread.locked && <span className="fo-tag fo-tag-dim">Closed</span>}
          <span className="fo-nw">{thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}{thread.reply_count >= MAX_REPLIES - 20 ? ` of ${MAX_REPLIES}` : ''} ·</span> <span className="fo-nw">started {ago(thread.created_at)}</span>
        </span>
        {(() => {
          const partOf = thread.author_id === me || posts.some((p) => p.author_id === me);
          return partOf
            ? <button type="button" className="fo-act fo-watch" aria-pressed={watch === 'mute'} onClick={() => setWatching(watch === 'mute' ? null : 'mute')} title="Stop or start bell lines about new replies here">{watch === 'mute' ? 'Muted · unmute' : 'Mute this thread'}</button>
            : <button type="button" className="fo-act fo-watch" aria-pressed={watch === 'follow'} onClick={() => setWatching(watch === 'follow' ? null : 'follow')} title="Have new replies here ring your bell">{watch === 'follow' ? 'Following · stop' : 'Follow this thread'}</button>;
        })()}
        {(isEditor || thread.author_id === me) && (
          <details className="fo-mod">
            <summary className="lab"><span aria-hidden="true">⋯</span> Manage this thread</summary>
            <div className="fo-mod-menu">
              {isEditor && <button type="button" onClick={() => flag('pinned')}>{thread.pinned ? 'Unpin' : 'Pin to the top'}</button>}
              {isEditor && <button type="button" onClick={() => flag('locked')}>{thread.locked ? 'Reopen to replies' : 'Close to replies'}</button>}
              <button type="button" className="fo-danger" onClick={removeThread}>Delete thread</button>
            </div>
          </details>
        )}
      </header>
      {msg && <p className="d-photo-msg" role="alert">{msg}</p>}
      {postPager}
      <ol className="fo-posts">
        {posts.slice((pCur - 1) * FORUM_PER, pCur * FORUM_PER).map((p, k) => {
          const i = (pCur - 1) * FORUM_PER + k;
          const who = people[p.author_id];
          const mine = p.author_id === me;
          return (
            <li key={p.id} className={`fo-post${i === 0 ? ' first' : ''}${p.created_at > since && !mine ? ' fresh' : ''}${p.id.startsWith('sending-') ? ' sending' : ''}${reported[p.id] ? ' reported' : ''}`} id={`post-${p.id}`}>
              <div className="fo-who">
                <Link to={`/guild/members/?m=${p.author_id}`} className="fo-who-link">
                  <Initials name={who?.display_name || 'A member'} size={48} src={portraitUrl(who?.portrait_path)} />
                  <span className="fo-who-name">{who?.display_name || 'A member'}</span>
                </Link>
                <span className={`lab ${roleClass(who?.role)}`}>{roleLabel(who?.role)}</span>
                {who?.role === 'fellow' ? <WayBadge member={p.author_id} /> : <PrestigeBadge published={pieces[p.author_id] ?? 0} />}
              </div>
              <div className="fo-post-main">
                <span className="lab mut fo-post-when">{p.id.startsWith('sending-') ? 'Posting…' : ago(p.created_at)}{p.edited_at ? ' · edited' : ''}{i === 0 ? ' · opening post' : ''}</span>
                {editing?.id === p.id ? (
                  <div className="fo-edit">
                    <textarea className="field" rows={6} maxLength={6000} value={editing.body} onChange={(e) => setEditing({ id: p.id, body: e.target.value })} />
                    <span className="fo-post-acts"><button type="button" className="btn d-btn" onClick={saveEdit}>Save</button><button type="button" className="d-textbtn" onClick={() => setEditing(null)}>Cancel</button></span>
                  </div>
                ) : <PostBody body={p.body} />}
                {reported[p.id] && (
                  <div className="fo-reported" role="note">
                    <span className="lab">Reported{reported[p.id].length > 1 ? ` · ${reported[p.id].length} times` : ''}</span>
                    <span className="it">{reported[p.id].map((r) => r.reason || 'No reason given.').join(' · ')}</span>
                    <button type="button" className="fo-act fo-fine" onClick={() => reportFine(p.id)}><span aria-hidden="true">✓</span> It’s fine, leave it</button>
                  </div>
                )}
                {editing?.id !== p.id && !p.id.startsWith('sending-') && (
                  <span className="fo-post-acts">
                    {open && <button type="button" className="fo-act" onClick={() => quote(p)}><span aria-hidden="true">❝</span> Quote</button>}
                    {mine && <button type="button" className="fo-act" onClick={() => setEditing({ id: p.id, body: p.body })}>Edit</button>}
                    {i > 0 && (mine || isEditor) && <button type="button" className="fo-act fo-danger" onClick={() => removePost(p)}>Delete</button>}
                    {!mine && <button type="button" className="fo-act fo-report" onClick={() => reportPost(p)}>Report</button>}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {postPager}
      {/* New since you last looked: one tap takes you there */}
      {fresh.length > 0 && !pillGone && (
        <button type="button" className="fo-pill" onClick={() => { showPost(fresh[0].id); setPillGone(true); }}>
          <span aria-hidden="true">↓</span> {fresh.length} new {fresh.length === 1 ? 'post' : 'posts'}
        </button>
      )}
      {open ? (
        // The reply bar stays at the bottom of the screen, like a message app, and grows as you write.
        <form className="fo-reply" onSubmit={send}>
          <label className="visually-hidden" htmlFor="fo-reply-box">{thread.locked ? 'Reply (the thread is closed; only you can post)' : 'Your reply'}</label>
          <textarea id="fo-reply-box" className="fo-reply-box" rows={1} maxLength={6000} value={reply}
            onChange={(e) => { setReply(e.target.value); grow(e.currentTarget); watchAt(e.currentTarget); }} onFocus={(e) => grow(e.currentTarget)}
            onBlur={() => setTimeout(() => setAtQ(null), 200)}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') (e.currentTarget.form as HTMLFormElement).requestSubmit(); }}
            placeholder={thread.locked ? 'Closed to replies (you can still post)' : 'Add to the conversation…'} />
          <button className="fo-send" type="submit" disabled={busy || !reply.trim()} aria-label="Post reply">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
          {atMatches.length > 0 && (
            <ul className="fo-at-list" role="listbox" aria-label="Members">
              {atMatches.map((p) => (
                <li key={p.id}><button type="button" role="option" aria-selected="false" onMouseDown={(e) => e.preventDefault()} onClick={() => pickAt(p.display_name)}>
                  <Initials name={p.display_name} size={26} src={portraitUrl(people[p.id]?.portrait_path)} /><span>{p.display_name}</span>
                </button></li>
              ))}
            </ul>
          )}
          <span className="lab mut fo-reply-hint">{reply.trim() ? 'Draft kept on this device · ' : ''}*italic* · **bold** · @name to mention</span>
        </form>
      ) : <p className="it mut fo-empty">{thread.reply_count >= MAX_REPLIES ? `This thread has reached ${MAX_REPLIES} replies and is closed. Start a new thread to carry the conversation on.` : 'This thread is closed to new replies.'}</p>}
    </div>
  );
}

// ---------------------------------------------------------------- the latest threads, for other pages (the Guild, the Desk)

/** The few most recently active threads, with their boards: a small way into the forum from elsewhere.
 *  `plain` uses ordinary links (for pages outside the members' area, like the Desk). */
export function ForumLatest({ count = 3, plain = false }: { count?: number; plain?: boolean }) {
  const [rows, setRows] = useState<(Thread & { board: Board | undefined })[] | null>(null);
  const [people, setPeople] = useState<People>({});
  useEffect(() => {
    const load = async () => {
      const [{ data: t }, { data: b }] = await Promise.all([
        supabase.from('forum_threads').select('*').order('last_post_at', { ascending: false }).limit(count),
        supabase.from('forum_boards').select('*'),
      ]);
      const boards = new Map((Array.isArray(b) ? (b as Board[]) : []).map((x) => [x.id, x]));
      setPeople(await loadPeople((Array.isArray(t) ? t : []).map((x: any) => x.last_author_id)));
      setRows((Array.isArray(t) ? (t as Thread[]) : []).map((x) => ({ ...x, board: boards.get(x.board_id) })));
    };
    load();
    // Live: a new thread or a reply anywhere moves the list (and coming back to the page refreshes it too)
    let wait: ReturnType<typeof setTimeout> | undefined;
    const soon = () => { clearTimeout(wait); wait = setTimeout(load, 1500); };   // (a busy forum: at most one refresh every second and a half)
    const ch = supabase.channel('forum-latest-' + count).on('postgres_changes', { event: '*', schema: 'public', table: 'forum_threads' }, soon).subscribe();
    addEventListener('popstate', soon);
    return () => { clearTimeout(wait); supabase.removeChannel(ch); removeEventListener('popstate', soon); };
  }, [count]);
  const A = ({ to, className, children }: { to: string; className?: string; children: ReactNode }) =>
    plain ? <a href={to} className={className}>{children}</a> : <Link to={to} className={className}>{children}</Link>;
  if (!rows) return <p className="lab mut fo-latest-wait">Listening at the door…</p>;
  if (!rows.length) return <p className="it mut fo-latest-none">Quiet so far. <A to="/guild/members/?view=forum">Start the first conversation →</A></p>;
  return (
    <ol className="fo-latest">
      {rows.map((t) => (
        <li key={t.id}>
          <A to={`/guild/members/?t=${t.id}`} className="fo-latest-row">
            {t.board?.image && <span className="fo-latest-img"><img src={t.board.image} alt="" loading="lazy" /></span>}
            <span className="fo-latest-text">
              <span className="fo-latest-title">{t.pinned && <span className="lab fo-tag">Pinned</span>}{t.title}</span>
              <span className="lab mut">{t.board?.name ?? 'The Forum'} · {nameOf(people, t.last_author_id)} · {ago(t.last_post_at)}</span>
            </span>
          </A>
        </li>
      ))}
    </ol>
  );
}

/** A member's tally, for their trophies: their part in the forum and in the rest of the Guild (null when there is none yet). */
export function useForumTally(uid?: string | null) {
  const [tally, setTally] = useState<import('../../lib/trophies').ForumTally | null>(null);
  useEffect(() => {
    setTally(null);   // another member's page: never show the last one's numbers while this one's are fetched
    if (!uid) return;
    let stale = false;
    supabase.from('forum_tallies').select('posts, threads, best_thread, prayer, boards, reflections_out, stayed_out, notes_out, kept, following, reflections_in, stayed_in, answers, shared').eq('member_id', uid).maybeSingle()
      .then(({ data }) => { if (!stale) setTally((data as any) ?? null); });
    return () => { stale = true; };
  }, [uid]);
  return tally;
}

// ---------------------------------------------------------------- the forum rules
// Plain, firm rules for keeping the forum safe. Linked from the top of the Forum (/guild/members/?view=rules).
const RULES: { h: string; p: string[] }[] = [
  { h: 'Speak as you would at the table', p: [
    'Be honest, be generous, be kind. Disagree with ideas, never attack people.',
    'No insults, mockery, name-calling, or contempt for anyone’s faith, background, body, or story.' ] },
  { h: 'Honor the whole Body', p: [
    'Members come from many traditions. Discuss doctrine honestly and charitably; never mock another denomination or question a member’s faith.',
    'Hold fast to the essentials of the faith, and in everything else extend charity.' ] },
  { h: 'Keep each other safe', p: [
    'No harassment, threats, stalking, or repeated unwanted contact, here or elsewhere.',
    'No sexual content, and nothing sexual involving anyone under 18, ever. This is reported to the authorities.',
    'No hate: nothing that demeans people for their race, nation, sex, disability, or any part of who they are.' ] },
  { h: 'Guard what is private', p: [
    'Never share someone’s address, phone number, email, workplace, photos, or messages without their clear permission.',
    'What a member shares in Prayer & Encouragement stays in the Guild. Do not repeat it outside.',
    'Keep your own details safe too. You never need to post where you live.' ] },
  { h: 'If someone is in danger', p: [
    'If a member writes that they may harm themselves or someone else, tell the Editor in Chief at once, and urge them to call local emergency services or a crisis line.',
    'The forum is for fellowship and prayer, not for medical, legal, or psychological advice. Point one another to qualified help.' ] },
  { h: 'Honest work', p: [
    'Post only writing and photographs that are your own, or quote others briefly and say whose they are.',
    'No spam, advertising, fundraising, or selling without the editor’s permission.' ] },
  { h: 'Using the forums', p: [
    'Keep threads to the forum they belong in, and search before starting a new one.',
    'Any member may start a thread in a forum and reply to others. The Editor in Chief opens new forums, and only the editor starts threads in From the Editor’s Desk. Have an idea for a forum? Ask in Questions for the Editor.',
    'Each forum keeps its 50 most active threads; the quietest are cleared to make room. Pinned threads always stay. A thread closes once it reaches 200 replies: start a new one to carry the conversation on.' ] },
  { h: 'When rules are broken', p: [
    'Tell the Editor in Chief through Questions for the Editor or the Contact page. You will be taken seriously, and your name kept private.',
    'The editor may edit or remove posts, close threads, and pause or end a membership. Serious harm is reported to the proper authorities.' ] },
];
export function ForumRules() {
  const NUM = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  useEffect(() => { try { localStorage.setItem('oa_rules_read', '1'); } catch {} }, []);   // ticks "Read the forum rules" on the Desk's welcome
  return (
    <div className="fo fo-rules">
      <Link to="/guild/members/?view=forum" className="fo-back lab">The Forum</Link>
      <header className="fr-head">
        <svg className="fr-cross" width="22" height="34" viewBox="0 0 22 34" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M11 1v32M3 10h16" /></svg>
        <span className="eb">For members of the Guild</span>
        <h1 className="h1 fr-title">The forum rules</h1>
        <p className="it fr-lead">The forum is a table we share. These rules keep it safe, honest and good for everyone who sits at it. By posting, you agree to keep them.</p>
      </header>
      {/* The ground under the rules: one Body, many members */}
      <section className="fr-pre">
        <span className="eb">One Body</span>
        <p className="fr-pre-text">We are open to every denomination. The Church is one body in Christ, and each tradition is a member of it: a function given for the whole, and a roadway by which the gospel reaches people the others might not.</p>
        <span className="lab fr-pre-ref">For as the body is one, and hath many members … so also is Christ. · 1 Corinthians 12:12</span>
      </section>
      <ol className="fr-list">
        {RULES.map((r, i) => (
          <li key={r.h} className="fr-rule">
            <span className="fr-n" aria-hidden="true">{NUM[i]}</span>
            <div className="fr-body">
              <h2 className="fr-h">{r.h}</h2>
              <ul>{r.p.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </li>
        ))}
      </ol>
      <footer className="fr-foot">
        <svg width="16" height="24" viewBox="0 0 22 34" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M11 1v32M3 10h16" /></svg>
        <p className="it">Be generous, be honest, be kind. If you are in immediate danger, contact your local emergency services first.</p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------- your conversations
// The threads you've started or replied in, most recently active first, with what's new since you last looked.
async function loadMine(me: string) {
  const { data: p } = await supabase.from('forum_posts').select('thread_id').eq('author_id', me);
  const ids = [...new Set((Array.isArray(p) ? p : []).map((x: any) => x.thread_id))];
  if (!ids.length) return { rows: [] as (Thread & { board: Board | undefined })[], people: {} as People };
  const [{ data: t }, { data: b }] = await Promise.all([
    supabase.from('forum_threads').select('*').in('id', ids).order('last_post_at', { ascending: false }),
    supabase.from('forum_boards').select('*'),
  ]);
  const boards = new Map((Array.isArray(b) ? (b as Board[]) : []).map((x) => [x.id, x]));
  const rows = (Array.isArray(t) ? (t as Thread[]) : []).map((x) => ({ ...x, board: boards.get(x.board_id) }));
  return { rows, people: await loadPeople(rows.map((x) => x.last_author_id)) };
}
function MineRow({ t, me, people, A }: { t: Thread & { board: Board | undefined }; me: string; people: People; A: (p: { to: string; className?: string; children: ReactNode }) => ReactNode }) {
  const fresh = isNew(t, me);
  return (
    <A to={`/guild/members/?t=${t.id}`} className={`fo-latest-row${fresh ? ' fresh' : ''}`}>
      {t.board?.image && <span className="fo-latest-img"><img src={t.board.image} alt="" loading="lazy" /></span>}
      <span className="fo-latest-text">
        <span className="fo-latest-title">{fresh && <span className="lab fo-new">New</span>}{t.title}</span>
        <span className="lab mut">{t.board?.name ?? 'The Forum'} · {t.reply_count} {t.reply_count === 1 ? 'reply' : 'replies'} · {t.last_author_id === me ? 'you' : nameOf(people, t.last_author_id)} · {ago(t.last_post_at)}</span>
      </span>
    </A>
  );
}
/** On the Desk: your three most recently active conversations. */
export function ForumMineLatest({ me, count = 3 }: { me: string; count?: number }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadMine>> | null>(null);
  useEffect(() => { loadMine(me).then(setData); }, [me]);
  const A = ({ to, className, children }: { to: string; className?: string; children: ReactNode }) => <a href={to} className={className}>{children}</a>;
  if (!data) return <p className="lab mut fo-latest-wait">Listening at the door…</p>;
  if (!data.rows.length) return <p className="it mut fo-latest-none">You haven’t joined a conversation yet. <a href="/guild/members/?view=forum">Find one in the forum →</a></p>;
  return <ol className="fo-latest">{data.rows.slice(0, count).map((t) => <li key={t.id}><MineRow t={t} me={me} people={data.people} A={A} /></li>)}</ol>;
}
/** The page: every conversation you're part of. */
export function ForumMine({ me }: { me: string }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof loadMine>> | null>(null);
  const [page, setPage] = useState(1);
  useEffect(() => { loadMine(me).then(setData); }, [me]);
  const A = ({ to, className, children }: { to: string; className?: string; children: ReactNode }) => <Link to={to} className={className}>{children}</Link>;
  const rows = data?.rows ?? [];
  const fresh = rows.filter((t) => isNew(t, me)).length;
  const pages = Math.max(1, Math.ceil(rows.length / THREADS_PER));
  const cur = Math.min(page, pages);
  return (
    <div className="fo">
      <header className="fo-head">
        <Link to="/guild/members/?view=forum" className="fo-back lab">The Forum</Link>
        <span className="eb">The Forum</span>
        <h1 className="h1">Your conversations</h1>
        <p className="it mut fo-sub">Every thread you’ve started or replied in, most recently active first.</p>
        {data && <span className="lab mut">{rows.length} {rows.length === 1 ? 'conversation' : 'conversations'}{fresh ? ` · ${fresh} with something new` : ''}</span>}
      </header>
      {!data ? <p className="lab mut">Opening…</p> : !rows.length
        ? <p className="it mut fo-empty">You haven’t joined a conversation yet. <Link to="/guild/members/?view=forum">Find one in the forum →</Link></p>
        : <ol className="fo-latest fo-mine">{rows.slice((cur - 1) * THREADS_PER, cur * THREADS_PER).map((t) => <li key={t.id}><MineRow t={t} me={me} people={data.people} A={A} /></li>)}</ol>}
      {pages > 1 && (
        <nav className="pager fo-pager" aria-label="Pages">
          <button type="button" className="pg-step" disabled={cur === 1} onClick={() => setPage(cur - 1)} aria-label="Newer">‹<span className="pg-word">Newer</span></button>
          {pageList(cur, pages).map((n, i) => n === '…' ? <span key={'g' + i} className="pg-gap" aria-hidden="true">…</span>
            : <button key={n} type="button" className="pg-n" aria-current={n === cur ? 'page' : undefined} onClick={() => setPage(n)}>{n}</button>)}
          <button type="button" className="pg-step" disabled={cur === pages} onClick={() => setPage(cur + 1)} aria-label="Older"><span className="pg-word">Older</span>›</button>
        </nav>
      )}
    </div>
  );
}
