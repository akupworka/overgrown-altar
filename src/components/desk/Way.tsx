// The Fellowship's room: The Way (seven stations) and its pilgrim badges. See lib/way.ts.
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BADGES, STATIONS, wayFor, pewterBadge, type WayCtx, type Badge } from '../../lib/way';
import { useForumTally } from './Forum';

export function useWay(member: string | null) {
  const tally = useForumTally(member);
  const [base, setBase] = useState<Omit<WayCtx, 'posts'> | null>(null);
  useEffect(() => {
    if (!member) return;
    (async () => {
      const [{ data: sv }, { data: rf }, { data: mk }, { data: fl }, { data: me }] = await Promise.all([
        supabase.from('saves').select('piece_id').eq('member_id', member),
        supabase.from('piece_reflections').select('id').eq('author_id', member),
        supabase.from('piece_marks').select('piece_id').eq('member_id', member),
        supabase.from('follows').select('followed').eq('follower', member),
        supabase.from('profiles').select('created_at').eq('id', member).maybeSingle(),
      ]);
      const ids = (sv ?? []).map((s: any) => s.piece_id);
      const { data: ps } = ids.length ? await supabase.from('pieces').select('pillar, medium').in('id', ids).eq('status', 'approved') : { data: [] as any[] };
      setBase({ saves: (ps ?? []) as any, reflections: (rf ?? []).length, marks: (mk ?? []).length, follows: (fl ?? []).length, since: (me as any)?.created_at ?? null });
    })();
  }, [member]);
  if (!base) return null;
  const ctx: WayCtx = { ...base, posts: (tally?.posts ?? 0) + (tally?.threads ?? 0) };
  return { ctx, ...wayFor(ctx) };
}

const Token = ({ b, lit, size = 64 }: { b: Badge; lit: boolean; size?: number }) => <span className="wy-token" dangerouslySetInnerHTML={{ __html: pewterBadge(b.glyph, size, lit) }} />;

/** The path of seven stations, with where you stand lit in silver. */
function Path({ at }: { at: number }) {
  return (
    <ol className="wy-path" aria-label="The seven stations">
      {STATIONS.map((s) => (
        <li key={s.n} className={s.n < at ? 'past' : s.n === at ? 'here' : ''}>
          <span className="wy-dot" aria-hidden="true" />
          <span className="wy-st">{s.name}</span>
        </li>
      ))}
    </ol>
  );
}

/** The Way, in full: your station, the path, and every badge (earned bright; still to come in shadow, with how far along). */
export function WayPage({ me }: { me: string }) {
  const w = useWay(me);
  const [open, setOpen] = useState<string | null>(null);
  if (!w) return <p className="lab mut d-loading">Walking out to the road…</p>;
  const groups = [...new Set(BADGES.map((b) => b.group))];
  return (
    <div className="wy">
      <header className="wy-head">
        <span className="eb">The Fellowship · The Way</span>
        <h1 className="h1 wy-h">{w.current.name}</h1>
        <p className="it wy-line">{w.current.line}</p>
        <span className="lab wy-count">Station {w.current.n} of 7 · {w.count} of {BADGES.length} badges{w.next ? ` · ${w.toNext} to ${w.next.name}` : ''}</span>
        <Path at={w.current.n} />
        <p className="it mut wy-about">Medieval pilgrims gathered a small pewter badge at every shrine on the road. Yours are gathered by keeping, reading, encouraging and keeping company. Tap any badge to see what it asks.</p>
      </header>
      {groups.map((g) => (
        <section key={g} className="wy-group">
          <h2 className="eb wy-gh">{g}</h2>
          <ol className="wy-badges">
            {BADGES.filter((b) => b.group === g).map((b) => {
              const lit = w.earned.includes(b);
              const [have, need] = b.progress ? b.progress(w.ctx) : [0, 0];
              return (
                <li key={b.id} className={lit ? 'lit' : ''}>
                  <button type="button" className="wy-b" aria-expanded={open === b.id} onClick={() => setOpen(open === b.id ? null : b.id)}>
                    <Token b={b} lit={lit} />
                    <span className="wy-bn">{b.name}</span>
                    {!lit && need > 0 && <span className="wy-bar" aria-hidden="true"><i style={{ transform: `scaleX(${have / need})` }} /></span>}
                  </button>
                  {open === b.id && <p className="it wy-note">{b.note}{!lit && need > 1 ? ` (${have} of ${need})` : ''}</p>}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

/** A small card: station, path, and the badges earned (on the Desk, and on a Fellowship member's page). */
export function WayCard({ member, mine }: { member: string; mine: boolean }) {
  const w = useWay(member);
  if (!w) return null;
  return (
    <a className="wy-card" href={mine ? '/guild/members/?view=way' : undefined} aria-label={mine ? 'Open The Way' : undefined}>
      <span className="wy-card-top">
        <span><span className="eb">The Way</span><span className="wy-card-st">{w.current.name}</span>
          <span className="lab mut">Station {w.current.n} of 7{w.next && mine ? ` · ${w.toNext} to ${w.next.name}` : ''}</span></span>
        {mine && <span className="lab wy-card-go">Open →</span>}
      </span>
      <Path at={w.current.n} />
      {w.earned.length > 0
        ? <span className="wy-card-badges">{w.earned.slice(0, 8).map((b) => <span key={b.id} title={b.name}><Token b={b} lit size={40} /></span>)}{w.earned.length > 8 && <em>+{w.earned.length - 8}</em>}</span>
        : <span className="it mut wy-card-none">{mine ? 'Your first badge comes with your first saved piece.' : 'Just setting out.'}</span>}
    </a>
  );
}

/** A small pewter pill with a Fellowship member's station, worn under their name (their page, the Forum):
 *  the Fellowship's counterpart to the Guild's prestige badge. */
export function WayBadge({ member, size = 'sm', tone = 'dark' }: { member: string; size?: 'sm' | 'lg'; tone?: 'dark' | 'paper' }) {
  const w = useWay(member);
  if (!w) return null;
  const s = size === 'lg' ? 26 : 20;
  return (
    <a href="/guild/members/?view=way" className={`wy-pill${size === 'lg' ? ' wy-pill-lg' : ''}${tone === 'paper' ? ' wy-pill-paper' : ''}`} title={`${w.current.name}: ${w.current.line}`}>
      <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: pewterBadge('shell', s, true) }} />
      <span className="wy-pill-n">{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][w.current.n - 1]}</span>{w.current.name}
    </a>
  );
}
