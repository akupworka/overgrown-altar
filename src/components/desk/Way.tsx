import { uniqueIds as useIds } from '../../lib/svgIds';
import type React from 'react';
// The Fellowship's room: The Way (seven stations) and its pilgrim badges. See lib/way.ts.
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BADGES, STATIONS, wayFor, pewterBadge, enamelOf, type WayCtx, type Badge } from '../../lib/way';
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

const Token = ({ b, lit, size = 64 }: { b: Badge; lit: boolean; size?: number }) => <span className="wy-token" style={{ '--en': enamelOf(b)[0] } as React.CSSProperties} dangerouslySetInnerHTML={{ __html: useIds(pewterBadge(b.glyph, size, lit, enamelOf(b), !!b.rare)) }} />;

/** The path of seven stations, with where you stand lit in silver. */
function Path({ at }: { at: number }) {
  return (
    <ol className="wy-path" aria-label="The seven stations" style={{ '--at': (at - 1) / 6 } as React.CSSProperties}>
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
        <p className="it mut wy-about">Pilgrims once gathered a small pewter badge at each stop on a long road. Yours are gathered by keeping, reading, encouraging and keeping company.</p>
      </header>
      {groups.map((g) => (
        <section key={g} className="wy-group">
          <h2 className="eb wy-gh">{g}</h2>
          <ol className="wy-list">
            {BADGES.filter((b) => b.group === g).map((b) => {
              const lit = w.earned.includes(b);
              const [have, need] = b.progress ? b.progress(w.ctx) : [0, 0];
              return (
                <li key={b.id} className={`wy-row${lit ? ' lit' : ''}${b.rare ? ' rare' : ''}`} style={{ '--en': enamelOf(b)[0] } as React.CSSProperties}>
                  <Token b={b} lit={lit} size={56} />
                  <span className="wy-row-t">
                    <span className="wy-row-n">{b.name}</span>
                    <span className="it wy-row-note">{b.note}</span>
                    {lit ? <span className="lab wy-row-got">Earned</span>
                      : need > 0 && <span className="wy-row-prog"><span className="wy-bar" aria-hidden="true"><i style={{ transform: `scaleX(${have / need})` }} /></span><span className="lab">{have} of {need}</span></span>}
                  </span>
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
        ? <span className="wy-card-badges">{w.earned.slice(0, 8).map((b) => <span key={b.id} title={b.name}><Token b={b} lit size={44} /></span>)}{w.earned.length > 8 && <em>+{w.earned.length - 8}</em>}</span>
        : <span className="it mut wy-card-none">{mine ? 'Your first badge comes with your first saved piece.' : 'Just setting out.'}</span>}
    </a>
  );
}

/** On a Fellowship member's page: their station on the Way, and every badge they've earned, by name. */
export function WayTrophies({ member, first, mine }: { member: string; first: string; mine: boolean }) {
  const w = useWay(member);
  if (!w) return null;
  return (
    <section className="m-fw-badges" id="vault">
      <div className="m-fw-head">
        <span className="eb">{mine ? 'Your badges' : `${first}’s badges`}</span>
        <h2 className="h2 m-fw-st">{w.current.name}</h2>
        <span className="lab mut">Station {w.current.n} of 7 on the Way · {w.count} of {BADGES.length} badges</span>
      </div>
      <Path at={w.current.n} />
      {w.earned.length > 0
        ? <ul className="m-fw-list">{w.earned.map((b) => <li key={b.id} className={b.rare ? 'rare' : ''} title={b.note}><Token b={b} lit size={72} /><span className="m-fw-n">{b.name}</span></li>)}</ul>
        : <p className="it mut m-fw-none">{mine ? 'Your first badge comes with the first piece you save.' : 'Just setting out.'}</p>}
      {mine && <a className="lab m-fw-go" href="/guild/members/?view=way">Walk the Way →</a>}
    </section>
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
      <span className="wy-pill-n">{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][w.current.n - 1]}</span>{w.current.name}
    </a>
  );
}

/** The Fellowship's part of the side column: their station, and the badges they've earned (in their enamel). */
export function WaySide({ member }: { member: string }) {
  const w = useWay(member);
  if (!w) return null;
  return (
    <>
      <a className="ss-rank ss-way-rank" href="/guild/members/?view=way" style={{ '--ink': '#FFE3A3' } as React.CSSProperties}>
        <span className="ss-crest" aria-hidden="true" dangerouslySetInnerHTML={{ __html: useIds(pewterBadge('shell', 66, true)) }} />
        <span className="ss-rank-t">
          <span className="lab ss-of">Station {w.current.n} of 7</span>
          <span className="ss-rank-n">{w.current.name}</span>
          {w.next && <span className="ss-bar" aria-hidden="true"><i style={{ transform: `scaleX(${Math.max(.04, 1 - w.toNext / (w.next.at - w.current.at))})` }} /></span>}
          {w.next && <span className="lab mut ss-next">{w.toNext} to {w.next.name}</span>}
        </span>
      </a>
      <div className="ss-vault">
        <span className="lab ss-k">Your badges <em>{w.count} of {BADGES.length}</em></span>
        {w.earned.length ? <span className="ss-medals">{w.earned.slice(0, 8).map((b) => <span key={b.id} title={b.name}><Token b={b} lit size={44} /></span>)}</span>
          : <span className="it mut ss-none">Your first comes with your first saved piece.</span>}
        <a className="lab ss-link" href="/guild/members/?view=way">Walk The Way →</a>
      </div>
    </>
  );
}
