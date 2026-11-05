// The Guild forum, for signed-in members only (Supabase keeps everyone else out).
//   /guild/members/?view=forum       the boards, each a row: its picture, name, what it is for, and its latest thread
//   /guild/members/?board=<slug>     a board's threads, pinned first, then the most recently active
//   /guild/members/?t=<thread id>    a thread: the opening post and every reply, and a reply box
// Each board keeps its most recently active threads (40 by default); quieter ones are cleared away
// by the database when new ones arrive. Pinned threads always stay.
import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { supabase, portraitUrl, type Profile } from '../../lib/supabase';
import { pageList } from '../../lib/pager';
import { Initials } from './DeskApp';
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
  return Object.fromEntries((data ?? []).map((p: any) => [p.id, p]));
}
const nameOf = (people: People, id?: string | null) => (id && people[id]?.display_name) || 'A member';

function Crumbs({ board, thread }: { board?: Board | null; thread?: string }) {
  return (
    <nav className="fo-crumbs lab" aria-label="Where you are">
      <Link to="/guild/members/">The Guild</Link><span aria-hidden="true">›</span>
      <Link to="/guild/members/?view=forum">The Forum</Link>
      {board && <><span aria-hidden="true">›</span><Link to={`/guild/members/?board=${board.slug}`}>{board.name}</Link></>}
      {thread && <><span aria-hidden="true">›</span><span className="fo-crumb-here">{thread}</span></>}
    </nav>
  );
}

// ---------------------------------------------------------------- the boards

export function ForumIndex() {
  const [boards, setBoards] = useState<Board[] | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [people, setPeople] = useState<People>({});
  useEffect(() => {
    (async () => {
      const [{ data: b }, { data: t }] = await Promise.all([
        supabase.from('forum_boards').select('*').order('position'),
        supabase.from('forum_threads').select('*').order('last_post_at', { ascending: false }),
      ]);
      setBoards((b as Board[]) ?? []); setThreads((t as Thread[]) ?? []);
      setPeople(await loadPeople((t ?? []).map((x: any) => x.last_author_id)));
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
        {boards && <span className="lab mut">{boards.length} boards · {threads.length} {threads.length === 1 ? 'thread' : 'threads'} · {posts} {posts === 1 ? 'post' : 'posts'}</span>}
      </header>
      {!boards ? <p className="lab mut">Opening the forum…</p> : (
        <ol className="fo-boards">
          {boards.map((b) => {
            const mine = threads.filter((t) => t.board_id === b.id);
            const latest = mine[0];
            return (
              <li key={b.id}>
                <Link to={`/guild/members/?board=${b.slug}`} className="fo-board">
                  <span className="fo-board-img">{b.image ? <img src={b.image} alt="" loading="lazy" /> : null}</span>
                  <span className="fo-board-text">
                    <span className="fo-board-name"><span className="fo-chev" aria-hidden="true">»</span>{b.name}{b.editor_only && <span className="lab fo-tag">From the editor</span>}</span>
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
      <p className="it mut fo-note">Each board keeps its most recently active threads. When a board grows full, its quietest threads are cleared away to make room; pinned threads always stay.</p>
    </div>
  );
}

// ---------------------------------------------------------------- one board

export function ForumBoard({ slug, me, isEditor }: { slug: string; me: string; isEditor: boolean }) {
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
    setThreads((t as Thread[]) ?? []);
    setPeople(await loadPeople((t ?? []).flatMap((x: any) => [x.author_id, x.last_author_id])));
  }, [slug]);
  useEffect(() => { load(); }, [load]);
  if (board === undefined) return <p className="lab mut d-loading">Opening the board…</p>;
  if (board === null) return <div className="fo"><Crumbs /><p className="it mut">This board isn’t here any more.</p></div>;
  const canStart = isEditor || !board.editor_only;
  const pages = Math.max(1, Math.ceil(threads.length / PER_PAGE));
  const cur = Math.min(page, pages);
  const onPage = threads.slice((cur - 1) * PER_PAGE, cur * PER_PAGE);
  return (
    <div className="fo">
      <header className="fo-head fo-board-head">
        {board.image && <img className="fo-banner" src={board.image} alt="" />}
        <Crumbs board={board} />
        <span className="eb">The Forum</span>
        <h1 className="h1">{board.name}</h1>
        <p className="it mut fo-sub">{board.description}</p>
        <div className="fo-head-acts">
          {canStart
            ? <button type="button" className="btn d-btn" onClick={() => setWriting((w) => !w)}>{writing ? 'Never mind' : 'Start a thread'}</button>
            : <span className="lab mut">Only the editor starts threads here. Everyone may reply.</span>}
          <span className="lab mut">{threads.length} {threads.length === 1 ? 'thread' : 'threads'} · keeps the {board.keep_threads} most active</span>
        </div>
      </header>
      {writing && <NewThread board={board} me={me} onDone={(id) => { setWriting(false); go(`/guild/members/?t=${id}`); }} />}
      {threads.length === 0 ? <p className="it mut fo-empty">No threads yet. {canStart ? 'Start the first.' : ''}</p> : (
        <ol className="fo-threads">
          <li className="fo-threads-head lab mut" aria-hidden="true"><span>Thread</span><span>Replies</span><span>Latest</span></li>
          {onPage.map((t) => (
            <li key={t.id}>
              <Link to={`/guild/members/?t=${t.id}`} className={`fo-thread${t.pinned ? ' pinned' : ''}`}>
                <span className="fo-thread-main">
                  <span className="fo-thread-t">
                    {t.pinned && <span className="lab fo-tag">Pinned</span>}
                    {t.locked && <span className="lab fo-tag fo-tag-dim">Closed</span>}
                    {t.title}
                  </span>
                  <span className="lab mut">Started by {nameOf(people, t.author_id)} · {ago(t.created_at)}</span>
                </span>
                <span className="fo-thread-n"><b>{t.reply_count}</b><span className="lab mut"> {t.reply_count === 1 ? 'reply' : 'replies'}</span></span>
                <span className="fo-thread-last lab mut">{nameOf(people, t.last_author_id)}<br />{ago(t.last_post_at)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
      {pages > 1 && (
        <nav className="pager fo-pager" aria-label="Pages of threads">
          <button type="button" className="pg-step" disabled={cur === 1} onClick={() => { setPage(cur - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Newer threads">‹<span className="pg-word">Newer</span></button>
          {pageList(cur, pages).map((n, i) => n === '…' ? <span key={'g' + i} className="pg-gap" aria-hidden="true">…</span>
            : <button key={n} type="button" className="pg-n" aria-current={n === cur ? 'page' : undefined} onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{n}</button>)}
          <button type="button" className="pg-step" disabled={cur === pages} onClick={() => { setPage(cur + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Older threads"><span className="pg-word">Older</span>›</button>
        </nav>
      )}
    </div>
  );
}

function NewThread({ board, me, onDone }: { board: Board; me: string; onDone: (id: string) => void }) {
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
  return (
    <form className="fo-compose" onSubmit={send}>
      <label className="d-lbl"><span className="lab">Title</span>
        <input className="field" maxLength={140} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is it about?" autoFocus /></label>
      <label className="d-lbl"><span className="lab">Opening post</span>
        <textarea className="field" rows={7} maxLength={6000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Say what’s on your mind. Be generous, be honest, be kind." /></label>
      {msg && <p className="d-photo-msg" role="alert">{msg}</p>}
      <div className="fo-compose-acts"><button className="btn d-btn" type="submit" disabled={busy}>{busy ? 'Starting…' : 'Start the thread'}</button><span className="lab mut">{6000 - body.length} characters left</span></div>
    </form>
  );
}

// ---------------------------------------------------------------- one thread

export function ForumThread({ id, me, isEditor }: { id: string; me: string; isEditor: boolean }) {
  const [thread, setThread] = useState<Thread | null | undefined>(undefined);
  const [board, setBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [people, setPeople] = useState<People>({});
  const [reply, setReply] = useState('');
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    const { data: t } = await supabase.from('forum_threads').select('*').eq('id', id).maybeSingle();
    setThread((t as Thread) ?? null);
    if (!t) return;
    const [{ data: b }, { data: p }] = await Promise.all([
      supabase.from('forum_boards').select('*').eq('id', t.board_id).maybeSingle(),
      supabase.from('forum_posts').select('*').eq('thread_id', id).order('created_at'),
    ]);
    setBoard((b as Board) ?? null); setPosts((p as Post[]) ?? []);
    setPeople(await loadPeople((p ?? []).map((x: any) => x.author_id)));
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (thread) document.title = `${thread.title} · The Forum · Overgrown Altar`; }, [thread]);

  if (thread === undefined) return <p className="lab mut d-loading">Opening the thread…</p>;
  if (thread === null) return (
    <div className="fo"><Crumbs /><p className="it mut fo-empty">This thread isn’t here any more. It may have been cleared away to make room, or taken down.</p></div>
  );
  const open = !thread.locked || isEditor;
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setBusy(true); setMsg('');
    const { error } = await supabase.from('forum_posts').insert({ thread_id: id, author_id: me, body: reply.trim() });
    setBusy(false);
    if (error) return setMsg('Your reply couldn’t be posted. ' + error.message);
    setReply(''); await load();
    requestAnimationFrame(() => document.querySelector('.fo-post:last-of-type')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }
  async function saveEdit() {
    if (!editing || !editing.body.trim()) return;
    const { error } = await supabase.from('forum_posts').update({ body: editing.body.trim() }).eq('id', editing.id);
    if (error) return setMsg(error.message);
    setEditing(null); load();
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
          {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'} · started {ago(thread.created_at)}
        </span>
        {(isEditor || thread.author_id === me) && (
          <div className="fo-mod">
            {isEditor && <button type="button" className="d-textbtn" onClick={() => flag('pinned')}>{thread.pinned ? 'Unpin' : 'Pin to the top'}</button>}
            {isEditor && <button type="button" className="d-textbtn" onClick={() => flag('locked')}>{thread.locked ? 'Reopen' : 'Close to replies'}</button>}
            <button type="button" className="d-textbtn d-danger" onClick={removeThread}>Delete thread</button>
          </div>
        )}
      </header>
      {msg && <p className="d-photo-msg" role="alert">{msg}</p>}
      <ol className="fo-posts">
        {posts.map((p, i) => {
          const who = people[p.author_id];
          const mine = p.author_id === me;
          return (
            <li key={p.id} className={`fo-post${i === 0 ? ' first' : ''}`} id={`post-${p.id}`}>
              <aside className="fo-who">
                <Link to={`/guild/members/?m=${p.author_id}`} className="fo-who-link">
                  <Initials name={who?.display_name || 'A member'} size={48} src={portraitUrl(who?.portrait_path)} />
                  <span className="fo-who-name">{who?.display_name || 'A member'}</span>
                </Link>
                <span className="lab mut">{who?.role === 'editor' ? 'Editor in Chief' : 'Writer'}</span>
              </aside>
              <div className="fo-post-main">
                <span className="lab mut fo-post-when">{ago(p.created_at)}{p.edited_at ? ' · edited' : ''}{i === 0 ? ' · opening post' : ''}</span>
                {editing?.id === p.id ? (
                  <div className="fo-edit">
                    <textarea className="field" rows={6} maxLength={6000} value={editing.body} onChange={(e) => setEditing({ id: p.id, body: e.target.value })} />
                    <span className="fo-post-acts"><button type="button" className="btn d-btn" onClick={saveEdit}>Save</button><button type="button" className="d-textbtn" onClick={() => setEditing(null)}>Cancel</button></span>
                  </div>
                ) : <div className="fo-body">{p.body}</div>}
                {editing?.id !== p.id && (mine || isEditor) && (
                  <span className="fo-post-acts">
                    {mine && <button type="button" className="d-textbtn" onClick={() => setEditing({ id: p.id, body: p.body })}>Edit</button>}
                    {i > 0 && <button type="button" className="d-textbtn d-danger" onClick={() => removePost(p)}>Delete</button>}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {open ? (
        <form className="fo-compose fo-reply" onSubmit={send}>
          <label className="d-lbl"><span className="lab">{thread.locked ? 'Reply (the thread is closed; only you can post)' : 'Your reply'}</span>
            <textarea className="field" rows={5} maxLength={6000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Add to the conversation." /></label>
          <div className="fo-compose-acts"><button className="btn d-btn" type="submit" disabled={busy || !reply.trim()}>{busy ? 'Posting…' : 'Post reply'}</button></div>
        </form>
      ) : <p className="it mut fo-empty">This thread is closed to new replies.</p>}
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
    (async () => {
      const [{ data: t }, { data: b }] = await Promise.all([
        supabase.from('forum_threads').select('*').order('last_post_at', { ascending: false }).limit(count),
        supabase.from('forum_boards').select('*'),
      ]);
      const boards = new Map(((b as Board[]) ?? []).map((x) => [x.id, x]));
      setRows(((t as Thread[]) ?? []).map((x) => ({ ...x, board: boards.get(x.board_id) })));
      setPeople(await loadPeople((t ?? []).map((x: any) => x.last_author_id)));
    })();
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

/** A member's forum tally, for their trophies (null when they haven't posted yet). */
export function useForumTally(uid?: string | null) {
  const [tally, setTally] = useState<import('../../lib/trophies').ForumTally | null>(null);
  useEffect(() => {
    if (!uid) return;
    supabase.from('forum_tallies').select('posts, threads, best_thread, prayer, boards').eq('member_id', uid).maybeSingle()
      .then(({ data }) => setTally((data as any) ?? null));
  }, [uid]);
  return tally;
}
