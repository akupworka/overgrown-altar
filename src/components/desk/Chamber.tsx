// The Disputation Chamber: friendly, one-on-one debate between members of the Guild, watched live from the gallery.
//   /guild/members/?view=chamber     the door: shut with a countdown and the last sitting's record, or open with the floor
//   /guild/members/?d=<id>           one disputation: the motion, two chairs, the exchange in turn, the clock, the gallery
// The doors are open all Saturday by New York time (the editor may call a special sitting on another day).
// How it runs: a member lays down a motion and opens their case; the chair across stands empty until another member
// takes it; then they speak in turn (three to five turns each, six minutes a turn, 1,200 characters), and each closes by
// naming the strongest point made against them. No winner is declared: the gallery only shows where it stood and where
// it moved. Every rule is kept by the database (functions chamber, dispute_*); this only presents the room.
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { supabase, portraitUrl, type Profile } from '../../lib/supabase';
import { seatFor } from '../../lib/seats';
import '../../styles/chamber.css';

type Side = 'for' | 'against';
type Stand = Side | 'undecided';
interface Dispute {
  id: string; motion: string; opener_id: string; opener_side: Side; taker_id: string | null; turns_each: number; turn_seconds: number;
  status: 'open' | 'live' | 'concluded' | 'adjourned' | 'withdrawn' | 'closed'; turn_of: string | null; turn_started_at: string | null;
  sitting: string; created_at: string; taken_at: string | null; ended_at: string | null; ended_by: string | null;
}
interface Speech { id: string; dispute_id: string; author_id: string | null; n: number; kind: 'opening' | 'reply' | 'closing' | 'lapsed'; body: string; conceded: string | null; granted: boolean; struck: boolean; created_at: string }
interface Lean { dispute_id: string; member_id: string; first_side: Stand; side: Stand }
export interface Hours { open: boolean; special: boolean; closes: string | null; opens: string; now: string; sitting: string; writer: boolean; chair: boolean; sat_out: boolean }
type People = Record<string, Pick<Profile, 'id' | 'display_name' | 'portrait_path' | 'role'>>;

const MAX = 1200;
const SIDE: Record<Stand, string> = { for: 'For', against: 'Against', undecided: 'Undecided' };
const across = (s: Side): Side => (s === 'for' ? 'against' : 'for');
const HOME = '/guild/members/?view=chamber';

function go(to: string) {
  history.pushState(null, '', to);
  dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function Link({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  return <a href={to} className={className} onClick={(e) => { if (e.metaKey || e.ctrlKey) return; e.preventDefault(); go(to); }}>{children}</a>;
}
async function loadPeople(ids: (string | null | undefined)[]): Promise<People> {
  const want = [...new Set(ids.filter(Boolean) as string[])];
  if (!want.length) return {};
  const { data } = await supabase.from('profiles').select('id, display_name, portrait_path, role').in('id', want);
  return Object.fromEntries((Array.isArray(data) ? data : []).map((p: any) => [p.id, p]));
}
const nameOf = (people: People, id?: string | null) => (id && people[id]?.display_name) || 'A member';
const firstName = (people: People, id?: string | null) => nameOf(people, id).split(/\s+/)[0];
/** What the database said, in its own plain words (it writes them for members to read). */
const said = (e: { message?: string } | null | undefined, otherwise: string) => (e?.message && e.message.length < 140 && !/[{}_]|\bfunction\b|\brelation\b/i.test(e.message) ? e.message : otherwise);

// ---------------------------------------------------------------- the hours

/** If the server cannot be asked, the device's own clock, read in New York time. */
function guessHours(): Hours {
  const now = new Date();
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
    .formatToParts(now).map((x) => [x.type, x.value])) as Record<string, string>;
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), since = ((+p.hour % 24) * 3600 + +p.minute * 60 + +p.second) * 1000;
  const midnight = now.getTime() - since, open = dow === 6;
  let me: any = {}; try { me = JSON.parse(localStorage.getItem('oa_member') || '{}'); } catch {}
  return { open, special: false, closes: open ? new Date(midnight + 864e5).toISOString() : null, opens: new Date(midnight + (open ? 7 : 6 - dow) * 864e5).toISOString(),
    now: now.toISOString(), sitting: `${p.year}-${p.month}-${p.day}`, writer: !me.fellow, chair: !!me.editor, sat_out: false };
}
/** The Chamber's hours, from the server (which also clears away what the shut doors ended), and the server's clock. */
export function useHours() {
  const [hours, setHours] = useState<Hours | null>(null);
  const skew = useRef(0);
  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('chamber');
    const h = (!error && data && typeof data === 'object' && 'open' in (data as any) ? data : guessHours()) as Hours;
    skew.current = Date.parse(h.now) - Date.now();
    setHours(h);
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 5 * 60 * 1000); return () => clearInterval(t); }, [load]);
  // The moment the doors open or shut, ask again.
  useEffect(() => {
    if (!hours) return;
    const at = Date.parse((hours.open ? hours.closes : hours.opens) ?? ''), ms = at - (Date.now() + skew.current) + 1500;
    if (!isFinite(ms) || ms <= 0 || ms > 2 ** 31 - 1) return;
    const t = setTimeout(load, ms); return () => clearTimeout(t);
  }, [hours, load]);
  const now = useCallback(() => Date.now() + skew.current, []);
  return { hours, now, reload: load };
}
/** Redraws on a beat (for the clocks). */
function useTick(ms: number) { const [, set] = useState(0); useEffect(() => { const t = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(t); }, [ms]); }
/** Who else is here now: everyone with this room open (counted once each). */
function usePresent(room: string, me: string) {
  const [here, setHere] = useState<string[]>([]);
  const ch = useRef<ReturnType<typeof supabase.channel> | null>(null);
  useEffect(() => {
    if (!me) return;
    const c = supabase.channel(room, { config: { presence: { key: me } } });
    c.on('presence', { event: 'sync' }, () => setHere(Object.keys(c.presenceState()))).subscribe((s) => { if (s === 'SUBSCRIBED') c.track({ at: Date.now() }); });
    ch.current = c;
    return () => { ch.current = null; supabase.removeChannel(c); };
  }, [room, me]);
  return { here, channel: ch };
}
const two = (n: number) => String(n).padStart(2, '0');
const clock = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${two(s % 60)}`; };
const span = (ms: number) => { const m = Math.max(0, Math.floor(ms / 60000)); return { d: Math.floor(m / 1440), h: Math.floor((m % 1440) / 60), m: m % 60 }; };
const inWords = (ms: number) => { const { d, h, m } = span(ms); return d ? `${d} ${d === 1 ? 'day' : 'days'}, ${h} ${h === 1 ? 'hour' : 'hours'}` : h ? `${h} ${h === 1 ? 'hour' : 'hours'}, ${m} min` : `${Math.max(1, m)} min`; };
const localTime = (iso: string, day = true) => new Date(iso).toLocaleString(undefined, day ? { weekday: 'long', hour: 'numeric', minute: '2-digit' } : { hour: 'numeric', minute: '2-digit' });
const sittingDay = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

// ---------------------------------------------------------------- small parts

function Seat({ p, size = 56, empty = false }: { p?: People[string]; size?: number; empty?: boolean }) {
  if (empty || !p) return <span className="ch-arch ch-arch-empty" style={{ ['--s' as any]: size + 'px' }} aria-hidden="true"><svg viewBox="0 0 24 24" width={size * 0.36} height={size * 0.36} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M12 6v12M6 12h12" /></svg></span>;
  return <span className="ch-arch" style={{ ['--s' as any]: size + 'px' }} aria-hidden="true"><img src={portraitUrl(p.portrait_path) || seatFor(p.display_name)} alt="" /></span>;
}
/** The gallery as a strip of glass: For on the left, Against on the right, the undecided between. */
function Glass({ f, u, a, label }: { f: number; u: number; a: number; label?: string }) {
  const all = f + u + a;
  return (
    <span className="ch-glass" role="img" aria-label={`${label ? label + ': ' : ''}${f} for, ${u} undecided, ${a} against`}>
      {all === 0 ? <i className="ch-g-none" style={{ flexGrow: 1 }} /> : <>
        {f > 0 && <i className="ch-g-for" style={{ flexGrow: f }} />}{u > 0 && <i className="ch-g-und" style={{ flexGrow: u }} />}{a > 0 && <i className="ch-g-ag" style={{ flexGrow: a }} />}
      </>}
    </span>
  );
}
const MANNER: [string, string][] = [
  ['One motion, two chairs', 'A member lays down a motion and opens their case. The chair across stands empty until another member takes it.'],
  ['In turn, against the clock', 'Three to five turns each, six minutes a turn, and never more than 1,200 characters. Everyone else watches from the gallery.'],
  ['Close with an open hand', 'Each speaker ends by naming the strongest point made against them. No winner is declared; the gallery only shows how it moved.'],
];
function Manner() {
  return (
    <section className="ch-manner" aria-label="How a disputation runs">
      <ol>{MANNER.map(([h, p], i) => <li key={h}><span className="ch-manner-n" aria-hidden="true">{['I', 'II', 'III'][i]}</span><span className="ch-manner-h">{h}</span><span className="ch-manner-p">{p}</span></li>)}</ol>
      <p className="it mut ch-manner-rule">Argue the point, never the person. <a href="/rule/">The Rule of the House</a> holds in here as everywhere.</p>
    </section>
  );
}

// ---------------------------------------------------------------- the door, on other pages

/** A band for the Guild page and the Forum: whether the Chamber is open, and the way in. */
export function ChamberDoor() {
  const { hours, now } = useHours();
  const [n, setN] = useState<{ open: number; live: number } | null>(null);
  useTick(30000);
  useEffect(() => {
    if (!hours?.open) return;
    supabase.from('disputes').select('id, status').in('status', ['open', 'live']).then(({ data }) => {
      const rows = Array.isArray(data) ? data : [];
      setN({ open: rows.filter((r: any) => r.status === 'open').length, live: rows.filter((r: any) => r.status === 'live').length });
    });
  }, [hours?.open]);
  if (!hours) return null;
  const line = hours.open
    ? [n?.live ? `${n.live} under way` : '', n?.open ? `${n.open} empty ${n.open === 1 ? 'chair' : 'chairs'}` : '', !n?.live && !n?.open ? 'The floor is clear: lay down the first motion' : ''].filter(Boolean).join(' · ')
    : `Opens ${localTime(hours.opens)}, in ${inWords(Date.parse(hours.opens) - now())}`;
  return (
    <Link to={HOME} className={`ch-door${hours.open ? ' open' : ''}`}>
      <span className="ch-door-mark" aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 20V10a7 7 0 0 1 14 0v10M3 20h18M12 3v17" /></svg></span>
      <span className="ch-door-text">
        <span className="lab ch-door-state">{hours.open ? <><i className="ch-live-dot" aria-hidden="true" />The doors are open</> : 'Saturdays · the doors are shut'}</span>
        <span className="ch-door-name">The Disputation Chamber</span>
        <span className="it ch-door-line">{line}</span>
      </span>
      <span className="ch-door-go" aria-hidden="true">→</span>
    </Link>
  );
}

// ---------------------------------------------------------------- the lobby

function LayMotion({ onDone, onCancel }: { onDone: (id: string) => void; onCancel: () => void }) {
  const [motion, setMotion] = useState(''); const [side, setSide] = useState<Side>('for'); const [turns, setTurns] = useState(4); const [opening, setOpening] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setErr('');
    const { data, error } = await supabase.rpc('dispute_open', { p_motion: motion, p_side: side, p_turns: turns, p_opening: opening });
    setBusy(false);
    if (error || !data) return setErr(said(error, 'The motion could not be laid down. Please try again.'));
    onDone(String(data));
  };
  return (
    <form className="ch-lay" onSubmit={submit}>
      <div className="ch-lay-head"><span className="eb">Lay down a motion</span><button type="button" className="lab ch-quiet" onClick={onCancel}>Never mind</button></div>
      <label className="ch-field"><span className="lab">The motion · a claim someone could honestly dispute</span>
        <input type="text" value={motion} maxLength={160} onChange={(e) => setMotion(e.target.value)} placeholder="This house holds that…" required />
        <span className="lab mut ch-count">{motion.trim().length} / 160</span></label>
      <div className="ch-lay-row">
        <div className="ch-field"><span className="lab">You will argue</span>
          <div className="ch-seg" role="group" aria-label="Your side">
            {(['for', 'against'] as Side[]).map((s) => <button key={s} type="button" className={`ch-seg-${s}`} aria-pressed={side === s} onClick={() => setSide(s)}>{SIDE[s]} the motion</button>)}
          </div></div>
        <div className="ch-field"><span className="lab">Turns each</span>
          <div className="ch-seg" role="group" aria-label="Turns each">
            {[[3, 'Brief'], [4, 'Standard'], [5, 'Full']].map(([n, w]) => <button key={n} type="button" aria-pressed={turns === n} onClick={() => setTurns(n as number)}>{n} · {w}</button>)}
          </div></div>
      </div>
      <label className="ch-field"><span className="lab">Your opening · the case the other chair will answer</span>
        <textarea value={opening} maxLength={MAX} rows={6} onChange={(e) => setOpening(e.target.value)} placeholder="Open your case. Make it something worth answering." required />
        <span className="lab mut ch-count">{opening.length.toLocaleString()} / {MAX.toLocaleString()}</span></label>
      {err && <p className="ch-err" role="alert">{err}</p>}
      <div className="ch-lay-acts">
        <button type="submit" className="ch-btn" disabled={busy}>{busy ? 'Laying it down…' : 'Lay it down'}</button>
        <span className="it mut">The chair across stands empty until a member takes it. You may withdraw the motion until then.</span>
      </div>
    </form>
  );
}

function Card({ d, first, count, people, me, hours, onTake, taking }: { d: Dispute; first?: Speech; count: number; people: People; me: string; hours: Hours; onTake?: (d: Dispute) => void; taking?: boolean }) {
  const total = d.turns_each * 2, mine = d.opener_id === me || d.taker_id === me;
  const forId = d.opener_side === 'for' ? d.opener_id : d.taker_id, agId = d.opener_side === 'against' ? d.opener_id : d.taker_id;
  const state = d.status === 'open' ? 'An empty chair' : d.status === 'live' ? `Under way · turn ${Math.min(count + 1, total)} of ${total}` : d.status === 'concluded' ? 'Concluded' : 'Adjourned';
  return (
    <article className={`ch-card ch-card-${d.status}${mine ? ' mine' : ''}`}>
      <span className="lab ch-card-state">{d.status === 'live' && <i className="ch-live-dot" aria-hidden="true" />}{state}{mine ? ' · yours' : ''}</span>
      <Link to={`/guild/members/?d=${d.id}`} className="ch-card-motion">{d.motion}</Link>
      <div className="ch-card-chairs">
        <span className="ch-card-chair ch-for"><Seat p={forId ? people[forId] : undefined} size={40} empty={!forId} /><span><span className="lab">For</span><span className="ch-card-name">{forId ? nameOf(people, forId) : 'Stands empty'}</span></span></span>
        <span className="ch-v" aria-hidden="true">v.</span>
        <span className="ch-card-chair ch-ag"><Seat p={agId ? people[agId] : undefined} size={40} empty={!agId} /><span><span className="lab">Against</span><span className="ch-card-name">{agId ? nameOf(people, agId) : 'Stands empty'}</span></span></span>
      </div>
      {d.status === 'open' && first && !first.struck && <p className="it ch-card-open">{first.body.length > 220 ? first.body.slice(0, 220).replace(/\s+\S*$/, '') + '…' : first.body}</p>}
      <div className="ch-card-foot">
        <span className="lab mut">{d.turns_each} turns each</span>
        {d.status === 'open' && !mine && hours.writer && !hours.sat_out && hours.open && onTake
          ? <button type="button" className="ch-btn ch-btn-sm" disabled={taking} onClick={() => onTake(d)}>{taking ? 'Taking the chair…' : 'Take the empty chair'}</button>
          : <Link to={`/guild/members/?d=${d.id}`} className="lab ch-card-go">{d.status === 'live' ? (mine ? 'Back to your chair →' : 'Watch from the gallery →') : d.status === 'open' ? (mine ? 'Your motion →' : 'Read the opening →') : 'Read the record →'}</Link>}
      </div>
    </article>
  );
}

export function Chamber({ me }: { me: string }) {
  const { hours, now, reload } = useHours();
  useTick(20000);
  const { here } = usePresent('chamber-floor', me);
  const [rows, setRows] = useState<Dispute[] | null>(null);
  const [firsts, setFirsts] = useState<Record<string, Speech>>({}); const [counts, setCounts] = useState<Record<string, number>>({});
  const [people, setPeople] = useState<People>({});
  const [laying, setLaying] = useState(false); const [taking, setTaking] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const { data } = await supabase.from('disputes').select('*').in('status', ['open', 'live', 'concluded', 'adjourned']).order('created_at', { ascending: false }).limit(60);
    const list = (Array.isArray(data) ? data : []) as Dispute[];
    const ids = list.map((d) => d.id);
    const { data: sp } = ids.length ? await supabase.from('dispute_speeches').select('id, dispute_id, author_id, n, kind, body, struck').in('dispute_id', ids) : { data: [] as any[] };
    const f: Record<string, Speech> = {}, c: Record<string, number> = {};
    (Array.isArray(sp) ? sp : []).forEach((s: any) => { c[s.dispute_id] = (c[s.dispute_id] || 0) + 1; if (s.n === 1) f[s.dispute_id] = s; });
    setFirsts(f); setCounts(c);
    setPeople(await loadPeople(list.flatMap((d) => [d.opener_id, d.taker_id])));
    setRows(list);
  }, []);
  useEffect(() => {
    load();
    let wait = 0; const soon = () => { clearTimeout(wait); wait = window.setTimeout(load, 400); };
    const ch = supabase.channel('chamber-lobby').on('postgres_changes', { event: '*', schema: 'public', table: 'disputes' }, soon).subscribe();
    return () => { clearTimeout(wait); supabase.removeChannel(ch); };
  }, [load]);
  useEffect(() => { if (hours) load(); }, [hours?.open]);   // the doors opening or shutting changes what stands
  if (!hours || !rows) return <div className="ch"><p className="lab mut">Opening the Chamber…</p></div>;

  const take = async (d: Dispute) => {
    setTaking(d.id); setErr('');
    const { error } = await supabase.rpc('dispute_take', { p_id: d.id });
    setTaking('');
    if (error) { setErr(said(error, 'That chair could not be taken. Please try again.')); load(); return; }
    go(`/guild/members/?d=${d.id}`);
  };
  const sitting = async (h: number) => { setBusy(true); await supabase.rpc('chamber_sitting', { p_hours: h }); await reload(); setBusy(false); };

  const today = rows.filter((d) => d.sitting === hours.sitting || d.status === 'open' || d.status === 'live');
  const empty = today.filter((d) => d.status === 'open'), live = today.filter((d) => d.status === 'live');
  const done = today.filter((d) => (d.status === 'concluded' || d.status === 'adjourned') && d.taker_id);
  const mineNow = [...empty, ...live].find((d) => d.opener_id === me || d.taker_id === me);
  const past = rows.filter((d) => !today.includes(d) && (d.status === 'concluded' || d.status === 'adjourned') && d.taker_id);
  const lastDay = past[0]?.sitting, last = past.filter((d) => d.sitting === lastDay);
  const until = Date.parse(hours.opens) - now(), left = hours.closes ? Date.parse(hours.closes) - now() : 0, t = span(until);
  const card = (d: Dispute) => <Card key={d.id} d={d} first={firsts[d.id]} count={counts[d.id] || 0} people={people} me={me} hours={hours} onTake={take} taking={taking === d.id} />;

  return (
    <div className="ch">
      <header className="ch-head">
        <Link to="/guild/members/" className="fo-back lab ch-back">The Guild</Link>
        <span className="eb">Saturdays · for members</span>
        <h1 className="h1">The Disputation Chamber</h1>
        <p className="it mut ch-sub">Two chairs, one motion, and the Guild watching from the gallery. Friendly disputation, in turn and in the open, so that iron may sharpen iron.</p>
      </header>

      {hours.open ? (
        <section className="ch-open-bar">
          <span className="ch-open-text">
            <span className="lab ch-door-state"><i className="ch-live-dot" aria-hidden="true" />{hours.special ? 'A special sitting: the doors are open' : 'The doors are open'}</span>
            <span className="it mut">{hours.closes ? `Until ${hours.special ? localTime(hours.closes, false) : 'midnight, New York time'} · ${inWords(left)} left` : ''}{here.length > 1 ? ` · ${here.length} in the Chamber now` : ''}</span>
          </span>
          {hours.sat_out ? <span className="it mut">The chair has asked you to sit this sitting out. You may watch from the gallery.</span>
            : !hours.writer ? <span className="it mut">You are in the gallery: watch any disputation, and stand where you are persuaded.</span>
            : mineNow ? <Link to={`/guild/members/?d=${mineNow.id}`} className="ch-btn">{mineNow.status === 'open' ? 'Your motion is laid →' : 'Back to your chair →'}</Link>
            : !laying && <button type="button" className="ch-btn" onClick={() => { setLaying(true); setErr(''); }}><span aria-hidden="true">+</span> Lay down a motion</button>}
        </section>
      ) : (
        <section className="ch-shut">
          <span className="lab ch-shut-state">The doors are shut</span>
          <div className="ch-count-row" role="timer" aria-label={`Opens in ${inWords(until)}`}>
            {([[t.d, t.d === 1 ? 'day' : 'days'], [t.h, t.h === 1 ? 'hour' : 'hours'], [t.m, t.m === 1 ? 'minute' : 'minutes']] as [number, string][]).map(([n, w]) => <span key={w} className="ch-count-pane"><b>{n}</b><span className="lab">{w}</span></span>)}
          </div>
          <p className="it ch-shut-line">The Chamber opens every Saturday, from midnight to midnight by New York time. <br />Where you are, the doors open {localTime(hours.opens)}.</p>
        </section>
      )}

      {laying && hours.open && <LayMotion onCancel={() => setLaying(false)} onDone={(id) => go(`/guild/members/?d=${id}`)} />}
      {err && <p className="ch-err" role="alert">{err}</p>}

      {hours.open && <>
        {live.length > 0 && <section className="ch-sec"><div className="ch-sec-head"><span className="eb">Under way</span><span className="lab mut">{live.length} {live.length === 1 ? 'disputation' : 'disputations'}</span></div><div className="ch-cards">{live.map(card)}</div></section>}
        <section className="ch-sec">
          <div className="ch-sec-head"><span className="eb">An empty chair</span><span className="lab mut">{empty.length ? `${empty.length} waiting` : 'None waiting'}</span></div>
          {empty.length ? <div className="ch-cards">{empty.map(card)}</div>
            : <p className="it mut ch-none">{live.length ? 'No motion is waiting for an answer.' : 'The floor is clear.'} {hours.writer && !hours.sat_out ? 'Lay down a motion, and see who takes the chair.' : ''}</p>}
        </section>
        {done.length > 0 && <section className="ch-sec"><div className="ch-sec-head"><span className="eb">Concluded this sitting</span><span className="lab mut">The record</span></div><div className="ch-cards">{done.map(card)}</div></section>}
      </>}

      <Manner />

      {/* the record of the sitting before: always when the doors are shut, and beside an open floor when there is one */}
      {(!hours.open || last.length > 0) && (
        <section className="ch-sec">
          <div className="ch-sec-head"><span className="eb">The last sitting</span>{lastDay && <span className="lab mut">{sittingDay(lastDay)}</span>}</div>
          {last.length ? <div className="ch-cards">{last.map(card)}</div> : <p className="it mut ch-none">No disputation has been held yet. On Saturday the first chair is yours.</p>}
        </section>
      )}

      {hours.chair && (
        <section className="ch-chairbar" aria-label="The chair">
          <span className="lab">The chair</span>
          {hours.special ? <><span className="it mut">A special sitting is open until {hours.closes ? localTime(hours.closes) : 'later'}.</span><button type="button" className="ch-quiet lab" disabled={busy} onClick={() => sitting(0)}>Shut the doors</button></>
            : hours.open ? <span className="it mut">You hold the chair: in any disputation you may strike a remark, close it, or ask a member to sit out.</span>
            : <><span className="it mut">Call a special sitting on another day (to try the room, or for an occasion).</span><button type="button" className="ch-quiet lab" disabled={busy} onClick={() => sitting(3)}>Open the doors for three hours</button></>}
        </section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- one disputation

function Composer({ id, n, kind, side, onSpoke, onTyping }: { id: string; n: number; kind: 'opening' | 'reply' | 'closing'; side: Side; onSpoke: () => void; onTyping: () => void }) {
  const key = `oa_dispute_${id}_${n}`;
  const [body, setBody] = useState(() => { try { return sessionStorage.getItem(key) || ''; } catch { return ''; } });
  const [conceded, setConceded] = useState(() => { try { return sessionStorage.getItem(key + '_c') || ''; } catch { return ''; } });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { try { sessionStorage.setItem(key, body); sessionStorage.setItem(key + '_c', conceded); } catch {} }, [body, conceded, key]);
  const speak = async (e: FormEvent) => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setErr('');
    const { error } = await supabase.rpc('dispute_speak', { p_id: id, p_body: body, p_conceded: kind === 'closing' ? conceded : null });
    setBusy(false);
    if (error) return setErr(said(error, 'That could not be said. Please try again.'));
    try { sessionStorage.removeItem(key); sessionStorage.removeItem(key + '_c'); } catch {}
    setBody(''); setConceded(''); onSpoke();
  };
  const word = kind === 'opening' ? 'Your opening' : kind === 'closing' ? 'Your closing' : 'Your reply';
  return (
    <form className={`ch-compose ch-${side === 'for' ? 'for' : 'ag'}`} onSubmit={speak}>
      <label className="ch-field"><span className="lab">{word} · you have the floor</span>
        <textarea value={body} maxLength={MAX} rows={5} onChange={(e) => { setBody(e.target.value); onTyping(); }} placeholder={kind === 'closing' ? 'Gather your case, and close.' : 'Answer what was said, then make your point.'} required />
        <span className={`lab ch-count${body.length > MAX - 100 ? ' near' : ' mut'}`}>{body.length.toLocaleString()} / {MAX.toLocaleString()}</span></label>
      {kind === 'closing' && (
        <label className="ch-field ch-concede"><span className="lab">Before you close · the strongest point made against you</span>
          <textarea value={conceded} maxLength={400} rows={2} onChange={(e) => { setConceded(e.target.value); onTyping(); }} placeholder="Name it fairly, in their best form." required />
          <span className="lab mut ch-count">{conceded.length} / 400</span></label>
      )}
      {err && <p className="ch-err" role="alert">{err}</p>}
      <div className="ch-compose-acts"><button type="submit" className="ch-btn" disabled={busy || body.trim().length < 2}>{busy ? 'Speaking…' : kind === 'closing' ? 'Close' : 'Speak'}</button></div>
    </form>
  );
}

export function Disputation({ id, me }: { id: string; me: string }) {
  const { hours, now } = useHours();
  useTick(1000);
  const [d, setD] = useState<Dispute | null | undefined>(undefined);
  const [speeches, setSpeeches] = useState<Speech[]>([]);
  const [leans, setLeans] = useState<Lean[]>([]);
  const [people, setPeople] = useState<People>({});
  const [here, setHere] = useState<string[]>([]);
  const [typing, setTyping] = useState<string | null>(null);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(''); const [leaving, setLeaving] = useState(false); const [closing, setClosing] = useState(false);
  const chan = useRef<ReturnType<typeof supabase.channel> | null>(null), typingWait = useRef(0), lastTyped = useRef(0), seen = useRef(0), end = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const [{ data: one }, { data: sp }, { data: ln }] = await Promise.all([
      supabase.from('disputes').select('*').eq('id', id).maybeSingle(),
      supabase.from('dispute_speeches').select('*').eq('dispute_id', id).order('n'),
      supabase.from('dispute_leans').select('*').eq('dispute_id', id),
    ]);
    const row = (one && !Array.isArray(one) ? one : null) as Dispute | null;
    setD(row); setSpeeches((Array.isArray(sp) ? sp : []) as Speech[]); setLeans((Array.isArray(ln) ? ln : []) as Lean[]);
    if (row) setPeople(await loadPeople([row.opener_id, row.taker_id, row.ended_by]));
  }, [id]);
  useEffect(() => {
    load();
    const ch = supabase.channel('dispute-' + id, { config: { presence: { key: me } } });
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'disputes', filter: `id=eq.${id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispute_speeches', filter: `dispute_id=eq.${id}` }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispute_leans', filter: `dispute_id=eq.${id}` }, () => load())
      .on('presence', { event: 'sync' }, () => setHere(Object.keys(ch.presenceState())))
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        if (!payload?.who || payload.who === me) return;
        setTyping(payload.who); clearTimeout(typingWait.current); typingWait.current = window.setTimeout(() => setTyping(null), 4000);
      })
      .subscribe((s) => { if (s === 'SUBSCRIBED') ch.track({ at: Date.now() }); });
    chan.current = ch;
    const poll = setInterval(load, 20000);   // a quiet safety net, should the live line drop
    return () => { clearInterval(poll); clearTimeout(typingWait.current); chan.current = null; supabase.removeChannel(ch); };
  }, [id, me, load]);
  useEffect(() => { if (d?.motion) document.title = `${d.motion} · The Disputation Chamber`; }, [d?.motion]);
  // A new speech: bring it into view for anyone already reading near the end.
  useEffect(() => {
    if (speeches.length > seen.current && seen.current > 0 && end.current) {
      const r = end.current.getBoundingClientRect();
      if (r.top < innerHeight + 500) end.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }
    seen.current = speeches.length; setTyping(null);
  }, [speeches.length]);

  if (d === undefined || !hours) return <div className="ch"><p className="lab mut">Finding the disputation…</p></div>;
  if (!d || d.status === 'withdrawn' || d.status === 'closed') return (
    <div className="ch"><header className="ch-head"><Link to={HOME} className="fo-back lab ch-back">The Chamber</Link>
      <h1 className="h1" style={{ fontSize: 40 }}>{d?.status === 'closed' ? 'Closed by the chair' : d ? 'This motion was withdrawn' : 'No such disputation'}</h1>
      <p className="it mut ch-sub">{d?.status === 'closed' ? 'The chair closed this disputation, and its record is not kept.' : d ? 'It was withdrawn before anyone took the chair.' : 'It may have been cleared away.'}</p></header></div>
  );

  const takerSide = across(d.opener_side);
  const sideOf = (m?: string | null): Side => (m === d.opener_id ? d.opener_side : takerSide);
  const forId = d.opener_side === 'for' ? d.opener_id : d.taker_id, agId = d.opener_side === 'against' ? d.opener_id : d.taker_id;
  const iSpeak = me === d.opener_id || me === d.taker_id, myTurn = d.status === 'live' && d.turn_of === me;
  const total = d.turns_each * 2, next = speeches.length + 1;
  const nextKind = next <= 2 ? 'opening' : next > total - 2 ? 'closing' : 'reply';
  const leftMs = d.turn_started_at ? Date.parse(d.turn_started_at) + d.turn_seconds * 1000 - now() : 0, lapsed = d.status === 'live' && leftMs <= 0;
  const count = (k: 'side' | 'first_side') => ({ f: leans.filter((l) => l[k] === 'for').length, u: leans.filter((l) => l[k] === 'undecided').length, a: leans.filter((l) => l[k] === 'against').length });
  const at = count('side'), first = count('first_side'), myLean = leans.find((l) => l.member_id === me)?.side;
  const watching = here.filter((h) => h !== d.opener_id && h !== d.taker_id).length;
  const over = d.status === 'concluded' || d.status === 'adjourned';

  const act = async (name: string, fn: string, args: Record<string, unknown>, otherwise: string) => {
    setBusy(name); setErr('');
    const { error } = await supabase.rpc(fn, args);
    setBusy('');
    if (error) setErr(said(error, otherwise));
    load();
  };
  const lean = (side: Stand) => {
    setLeans((ls) => [...ls.filter((l) => l.member_id !== me), { dispute_id: id, member_id: me, side, first_side: ls.find((l) => l.member_id === me)?.first_side ?? side }]);
    act('lean', 'dispute_lean', { p_id: id, p_side: side }, 'Your place in the gallery could not be kept.');
  };
  const typed = () => { const t = Date.now(); if (t - lastTyped.current < 2500) return; lastTyped.current = t; chan.current?.send({ type: 'broadcast', event: 'typing', payload: { who: me } }); };

  const chair = (who: string | null, side: Side) => {
    const has = d.status === 'live' && d.turn_of === who && !!who;
    return (
      <div className={`ch-chair ch-${side === 'for' ? 'for' : 'ag'}${has ? ' has-floor' : ''}${!who ? ' empty' : ''}`}>
        {who ? <Link to={`/guild/members/?m=${who}`} className="ch-chair-seat"><Seat p={people[who]} size={84} /></Link> : <span className="ch-chair-seat"><Seat empty size={84} /></span>}
        <span className="ch-chair-text">
          <span className="lab ch-chair-side">{SIDE[side]} the motion</span>
          <span className="ch-chair-name">{who ? nameOf(people, who) : 'The chair stands empty'}</span>
          {has && <span className="lab ch-chair-floor">{typing === who ? 'Writing…' : 'Has the floor'}</span>}
          {!who && d.status === 'open' && d.opener_id !== me && hours.writer && !hours.sat_out && hours.open &&
            <button type="button" className="ch-btn ch-btn-sm" disabled={busy === 'take'} onClick={() => act('take', 'dispute_take', { p_id: id }, 'That chair could not be taken.')}>{busy === 'take' ? 'Taking it…' : 'Take this chair'}</button>}
        </span>
      </div>
    );
  };

  return (
    <div className={`ch ch-room ch-is-${d.status}`}>
      <header className="ch-stage">
        <Link to={HOME} className="fo-back lab ch-back">The Chamber</Link>
        <span className="eb ch-stage-eb"><span>{d.status === 'live' && <i className="ch-live-dot" aria-hidden="true" />}{d.status === 'open' ? 'A motion is laid' : d.status === 'live' ? 'Under way' : d.status === 'concluded' ? 'The record · concluded' : 'The record · adjourned'}</span><span className="ch-stage-dot" aria-hidden="true"> · </span><span>{sittingDay(d.sitting)}</span></span>
        <h1 className="ch-motion">{d.motion}</h1>
        <div className="ch-chairs">
          {chair(forId, 'for')}
          <span className="ch-v ch-v-big" aria-hidden="true">v.</span>
          {chair(agId, 'against')}
        </div>
        {d.status === 'live' && (
          <div className={`ch-turn${lapsed ? ' lapsed' : ''}`} role="status">
            <span className="lab">Turn {Math.min(next, total)} of {total}</span>
            <span className="ch-turn-who">{firstName(people, d.turn_of)} has the floor</span>
            <span className="ch-turn-clock" aria-label="Time left on the clock">{lapsed ? 'The clock has run out' : clock(leftMs)}</span>
            <span className="ch-turn-bar" aria-hidden="true"><i style={{ transform: `scaleX(${Math.max(0, Math.min(1, leftMs / (d.turn_seconds * 1000)))})` }} /></span>
          </div>
        )}
        {d.status === 'open' && <p className="it mut ch-wait">{d.opener_id === me ? 'Your motion is laid. The chair across stands empty; you will see it taken here the moment it is.' : `${firstName(people, d.opener_id)} has opened. The chair across stands empty.`}</p>}
        {d.status === 'adjourned' && <p className="it mut ch-wait">{d.ended_by && (d.ended_by === d.opener_id || d.ended_by === d.taker_id) ? `Adjourned: ${firstName(people, d.ended_by)} left the floor.` : 'Adjourned when the doors shut.'}</p>}
      </header>

      {/* The gallery: where the watchers stand */}
      <section className="ch-gallery" aria-label="The gallery">
        <div className="ch-gallery-top">
          <span className="lab">The gallery{(d.status === 'live' || d.status === 'open') && watching > 0 ? ` · ${watching} watching` : ''}</span>
          <span className="lab ch-gallery-n"><b className="ch-t-for">{at.f} for</b><i>·</i><b>{at.u} undecided</b><i>·</i><b className="ch-t-ag">{at.a} against</b></span>
        </div>
        <Glass {...at} label="The gallery now" />
        {over && leans.length > 0 && <div className="ch-moved"><span className="lab mut">At the first word</span><Glass {...first} label="The gallery at the first word" /><span className="lab mut">{first.f} for · {first.u} undecided · {first.a} against</span></div>}
        {!iSpeak && !over && (
          <div className="ch-lean"><span className="it mut">{myLean ? 'You stand' : 'Where do you stand?'}</span>
            <div className="ch-seg" role="group" aria-label="Where you stand">
              {(['for', 'undecided', 'against'] as Stand[]).map((s) => <button key={s} type="button" className={`ch-seg-${s}`} aria-pressed={myLean === s} onClick={() => lean(s)}>{SIDE[s]}</button>)}
            </div>
            <span className="it mut ch-lean-note">Move as you are persuaded.</span></div>
        )}
      </section>

      {/* The exchange */}
      <section className="ch-exchange" aria-label="The exchange" aria-live="polite">
        {speeches.map((s) => {
          const side = sideOf(s.author_id), mine = s.author_id === me;
          if (s.kind === 'lapsed') return <p key={s.id} className="it mut ch-lapsed">{firstName(people, s.author_id)} let the clock run out.</p>;
          return (
            <article key={s.id} className={`ch-sp ch-${side === 'for' ? 'for' : 'ag'}${mine ? ' mine' : ''}`}>
              <header><span className="lab ch-sp-kind">{s.kind === 'opening' ? 'Opening' : s.kind === 'closing' ? 'Closing' : 'Reply'} · {SIDE[side]}</span><span className="ch-sp-who">{nameOf(people, s.author_id)}</span></header>
              {s.struck ? <p className="it mut ch-struck">Struck from the record by the chair.</p> : <div className="ch-sp-body">{s.body.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}
              {s.conceded && !s.struck && <p className="ch-conceded"><span className="lab">The strongest point against me</span>{s.conceded}</p>}
              {!s.struck && (s.granted || (iSpeak && !mine && (d.status === 'live' || d.status === 'concluded')) || hours.chair) && (
                <footer>
                  {s.granted ? <span className="lab ch-granted"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>Point granted</span>
                    : iSpeak && !mine && (d.status === 'live' || d.status === 'concluded') ? <button type="button" className="lab ch-quiet" disabled={busy === 'g' + s.id} onClick={() => act('g' + s.id, 'dispute_grant', { p_speech: s.id }, 'The point could not be granted.')}>Grant the point</button> : <span />}
                  {hours.chair && <button type="button" className="lab ch-quiet ch-strike" disabled={busy === 's' + s.id} onClick={() => { if (confirm('Strike this from the record? It cannot be put back.')) act('s' + s.id, 'dispute_chair', { p_id: id, p_action: 'strike', p_speech: s.id }, 'It could not be struck.'); }}>Strike</button>}
                </footer>
              )}
            </article>
          );
        })}
        {d.status === 'live' && typing && typing === d.turn_of && typing !== me && <p className="it mut ch-typing">{firstName(people, typing)} is writing…</p>}
        <div ref={end} />
      </section>

      {err && <p className="ch-err" role="alert">{err}</p>}

      {/* The floor: the one whose turn it is writes; the other waits on the clock */}
      {d.status === 'live' && iSpeak && (myTurn
        ? <Composer key={next} id={id} n={next} kind={nextKind} side={sideOf(me)} onSpoke={load} onTyping={typed} />
        : <div className="ch-waiting">
            <span className="it">{firstName(people, d.turn_of)} has the floor{lapsed ? ', and the clock has run out.' : `. ${clock(leftMs)} left on the clock.`}</span>
            {lapsed && <button type="button" className="ch-btn ch-btn-sm" disabled={busy === 'claim'} onClick={() => act('claim', 'dispute_claim', { p_id: id }, 'The floor could not be claimed.')}>{busy === 'claim' ? 'Claiming…' : 'Claim the floor'}</button>}
          </div>)}

      {d.status === 'concluded' && (() => {
        const ends = speeches.filter((s) => s.kind === 'closing' && s.conceded && !s.struck);
        return (
          <section className="ch-close">
            <span className="eb">Concluded</span>
            <p className="it ch-close-line">No winner is declared here. This is what each granted the other.</p>
            {ends.length > 0 && <div className="ch-hands">{ends.map((s) => <blockquote key={s.id} className={`ch-${sideOf(s.author_id) === 'for' ? 'for' : 'ag'}`}><span className="lab">{nameOf(people, s.author_id)} · {SIDE[sideOf(s.author_id)]}</span>{s.conceded}</blockquote>)}</div>}
          </section>
        );
      })()}

      <footer className="ch-room-foot">
        <Link to={HOME} className="lab ch-quiet">← Back to the Chamber</Link>
        {iSpeak && (d.status === 'live' || (d.status === 'open' && d.opener_id === me)) && (leaving
          ? <span className="ch-confirm"><span className="it mut">{d.status === 'open' ? 'Withdraw your motion?' : 'Leave the floor? The disputation will stand adjourned.'}</span><button type="button" className="lab ch-quiet ch-strike" disabled={busy === 'leave'} onClick={async () => { await act('leave', 'dispute_leave', { p_id: id }, 'That could not be done.'); setLeaving(false); if (d.status === 'open') go(HOME); }}>Yes</button><button type="button" className="lab ch-quiet" onClick={() => setLeaving(false)}>No, stay</button></span>
          : <button type="button" className="lab ch-quiet" onClick={() => setLeaving(true)}>{d.status === 'open' ? 'Withdraw the motion' : 'Leave the floor'}</button>)}
        {hours.chair && (closing
          ? <span className="ch-confirm"><span className="it mut">Close this disputation and take down its record?</span><button type="button" className="lab ch-quiet ch-strike" onClick={async () => { await act('close', 'dispute_chair', { p_id: id, p_action: 'close' }, 'It could not be closed.'); setClosing(false); }}>Yes, close it</button><button type="button" className="lab ch-quiet" onClick={() => setClosing(false)}>No</button></span>
          : <span className="ch-chair-acts"><span className="lab mut">The chair</span>
              <button type="button" className="lab ch-quiet" onClick={() => setClosing(true)}>Close this disputation</button>
              {(d.status === 'live' || d.status === 'open') && [d.opener_id, d.taker_id].filter((x): x is string => !!x && x !== me).map((m) =>
                <button key={m} type="button" className="lab ch-quiet" disabled={busy === 'out' + m} onClick={() => { if (confirm(`Ask ${nameOf(people, m)} to sit out for a day? Their disputation will end.`)) act('out' + m, 'chamber_sit_out', { p_member: m, p_on: true }, 'That could not be done.'); }}>Ask {firstName(people, m)} to sit out</button>)}
            </span>)}
      </footer>
    </div>
  );
}
