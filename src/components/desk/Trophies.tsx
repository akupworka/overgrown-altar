import { uniqueIds as useIds } from '../../lib/svgIds';
// The Vault for the members' area (same look as components/TrophyCase.astro).
// On your own page it adds a fold-out of the trophies still to earn.
import { TROPHIES, TIER_AT, TROPHY_GROUPS, groupOf, trophiesFor, finestFirst, trophySvg, showcaseCtx, TIER_LABEL, tierLabel, unitFor, num, numShort, type Tier, type Trophy, type TrophyCtx } from '../../lib/trophies';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/trophies.css';

type Standing = ReturnType<typeof trophiesFor>[number];

// One trophy's drawing. It is made once and kept, so opening a card or switching a tab doesn't redraw every trophy on the page.
function Svg({ t, size, tier, locked = false, still = false, className }: { t: Trophy; size?: number; tier?: Tier; locked?: boolean; still?: boolean; className?: string }) {
  const html = useMemo(() => useIds(trophySvg(t, size, tier ?? t.tier, locked, still)), [t.id, size, tier, locked, still]);
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Medal({ s, locked, size = 72, big = false, onOpen }: { s: Standing; locked?: boolean; size?: number; big?: boolean; onOpen?: (s: Standing) => void }) {
  const { trophy: t, tier, n, next } = s;
  return (
    <figure className={`tr${big ? ' tr-big' : ''}${locked ? ' locked' : ''}${onOpen ? ' tr-tap' : ''}`} data-tier={tier}
      {...(onOpen ? { role: 'button', tabIndex: 0, 'aria-label': `${t.name}: how to earn it`, onClick: () => onOpen(s), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(s); } } } : { title: t.note })}>
      {big && <span className="tr-light" aria-hidden="true" />}
      <Svg t={t} size={size} tier={tier} locked={locked} />
      <span className="tr-name">{t.name}</span>
      <span className="tr-tier">{tierLabel(t, tier)}{t.count && !locked ? ` · ${num(n)} ${unitFor(n, t.unit)}` : ''}</span>
      {t.count && !locked && next
        ? <><span className="tr-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, Math.round((n / next.at) * 100))}%` }} /></span><span className="tr-next">{num(next.at - n)} more to {TIER_LABEL[next.tier]}</span></>
        : (big || locked) && <span className="tr-note">{locked && t.count ? `${n ? `${num(n)} of ${num(t.at?.bronze ?? 1)}. ` : ''}Bronze at ${num(t.at?.bronze ?? 1)} ${unitFor(t.at?.bronze ?? 1, t.unit)}.` : t.note}</span>}
    </figure>
  );
}

// One trophy, opened: what it's for, how far along you are, and what each metal takes. Tap outside (or Escape) to close.
export function TrophyCard({ s, onClose }: { s: Standing; onClose: () => void }) {
  const { trophy: t, tier, n, earned, next } = s;
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [onClose]);
  const at = t.count ? (t.at ?? TIER_AT) : null;
  const goal = t.count ? (next ? next.at : at![tier]) : 1;
  const pct = t.count ? Math.min(100, Math.round((n / Math.max(1, goal)) * 100)) : earned ? 100 : 0;
  return createPortal(
    <div className="trc-veil" onClick={onClose}>
      <div className="trc" role="dialog" aria-modal="true" aria-label={t.name} data-tier={tier} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="trc-x" onClick={onClose} aria-label="Close">×</button>
        <Svg t={t} size={110} tier={earned ? tier : t.count ? 'bronze' : t.tier} locked={!earned} className={`trc-medal${earned ? '' : ' locked'}`} />
        <span className="lab trc-state">{earned ? (t.count ? `${TIER_LABEL[tier]} · earned` : 'Won') : 'Still to earn'}</span>
        <h3 className="trc-name">{t.name}</h3>
        <p className="it trc-note">{t.note}</p>
        {t.count ? (<>
          <div className="trc-count"><b>{num(n)}</b> {unitFor(n, t.unit)}</div>
          <span className="trc-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
          <span className="trc-next">{next ? `${num(next.at - n)} more to ${TIER_LABEL[next.tier]}` : 'The highest metal: rainbow glass.'}</span>
          <ol className="trc-metals">
            {TIERS.map((m) => {
              const reached = n >= at![m];
              return <li key={m} className={reached ? 'on' : ''} data-tier={m}><i />{TIER_LABEL[m]}<b>{num(at![m])}</b></li>;
            })}
          </ol>
        </>) : <span className="trc-next">{earned ? 'Earned. It stays in your vault.' : 'Earned once, the first time you do it.'}</span>}
      </div>
    </div>, document.body);
}

/** For the Editor in Chief alone: a switch that shows the trophies as they look with every one of them won. Nothing is saved. */
export function PreviewSwitch({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return <button type="button" className={`tr-preview${on ? ' on' : ''}`} aria-pressed={on} onClick={() => set(!on)}>
    <i aria-hidden="true" />{on ? 'Showing everything won · back to your own' : 'Preview: everything won'}</button>;
}

export function TrophyCase({ ctx: own, mine = false, name = '' }: { ctx: TrophyCtx; mine?: boolean; name?: string }) {
  const chief = mine && own.member.role === 'editor';
  const [preview, setPreview] = useState(false);
  const ctx = useMemo(() => (preview ? showcaseCtx(own.member) : own), [preview, own]);
  const all = trophiesFor(ctx);
  const earned = finestFirst(all.filter((x) => x.earned));
  const locked = all.filter((x) => !x.earned);
  const [open, setOpen] = useState<Standing | null>(null);
  const [showLocked, setShowLocked] = useState(false);
  const [showAll, setShowAll] = useState(false);   // a full vault shows two rows beneath the shelf; the rest opens on "See all" 
  if (!earned.length && !mine) return null;
  const shelf = earned.slice(0, 3), rest = earned.slice(3);
  const tally = (['rainbow', 'gold', 'silver', 'bronze'] as Tier[]).map((t) => ({ t, n: earned.filter((x) => x.tier === t).length })).filter((x) => x.n);
  return (
    <section className="vault">
      <div className="vault-in">
        <header className="vault-head">
          <span className="eb">The Vault</span>
          <h2 className="h2 vault-title">{mine ? 'Your trophies' : name ? `${name.split(' ')[0]}’s trophies` : 'Trophies'}</h2>
          <div className="vault-tally">
            {tally.map(({ t, n }) => <span key={t} className="vault-chip" data-tier={t}><i />{n} {TIER_LABEL[t].toLowerCase()}</span>)}
            <span className="vault-chip vault-of">{earned.length} of {TROPHIES.length}</span>
          </div>
          {chief && <PreviewSwitch on={preview} set={setPreview} />}
        </header>
        {earned.length === 0 && <p className="it vault-empty">Your first published piece opens the vault.</p>}
        {shelf.length > 0 && <div className="vault-shelf">{shelf.map((s) => <Medal key={s.trophy.id} s={s} size={112} big onOpen={setOpen} />)}</div>}
        {rest.length > 0 && <div className={`tc-grid vault-rest${showAll ? ' open' : ''}`}>{rest.map((s) => <Medal key={s.trophy.id} s={s} onOpen={setOpen} />)}</div>}
        {rest.length > 10 && (
          <button type="button" className={`vault-toggle vault-more${rest.length > 12 ? ' wide' : ''}${showAll ? ' open' : ''}`} aria-expanded={showAll} onClick={() => setShowAll((v) => !v)}>
            <span className="vault-toggle-t">{showAll ? 'Show fewer' : 'See all'}</span>{!showAll && <span className="vault-toggle-n">{earned.length}</span>}
            <svg className="vault-toggle-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        )}
        {mine && locked.length > 0 && (
          <div className={`vault-locked${showLocked ? ' open' : ''}`}>
            <button type="button" className="vault-toggle" aria-expanded={showLocked} onClick={() => setShowLocked((v) => !v)}>
              <span className="vault-toggle-t">Still to earn</span><span className="vault-toggle-n">{locked.length}</span>
              <svg className="vault-toggle-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {showLocked && <div className="tc-grid">{locked.map((s) => <Medal key={s.trophy.id} s={s} locked onOpen={setOpen} />)}</div>}
          </div>
        )}
        <div className="vault-links">
          <a className="vault-link" href="/guild/members/?view=prestige"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M12 8l2 3-2 3-2-3z" /></svg>The ten prestiges</a>
          <a className="vault-link" href="/guild/members/?view=trophies"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="5.5" /><path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5" /></svg>Every trophy</a>
        </div>
        {open && <TrophyCard s={open} onClose={() => setOpen(null)} />}
      </div>
    </section>
  );
}

const TIERS: Tier[] = ['bronze', 'silver', 'gold', 'rainbow'];

/** Every trophy, for the catalog on the prestiges page: the growing ones in all four metals, then the rest. */
export function TrophyCatalogue({ only, ctx }: { only?: 'growing' | 'once'; ctx?: TrophyCtx } = {}) {
  // With a member's standing (ctx), every trophy opens its card with their progress.
  const standings = ctx ? trophiesFor(ctx) : null;
  const [open, setOpen] = useState<Standing | null>(null);
  const tap = (t: Trophy) => {
    const st = standings?.find((x) => x.trophy.id === t.id);
    return st ? { role: 'button', tabIndex: 0, 'aria-label': `${t.name}: how to earn it`, onClick: () => setOpen(st),
      onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(st); } } } : {};
  };
  const mine = (t: Trophy) => standings?.find((x) => x.trophy.id === t.id);
  // Shelf by shelf: the work, photography, the company kept, faithfulness.
  const shelves = (list: Trophy[]) => TROPHY_GROUPS.map((g) => ({ name: g.name, items: list.filter((t) => groupOf(t) === g.name) })).filter((g) => g.items.length);
  const growing = shelves(TROPHIES.filter((t) => t.count));
  const once = shelves(TROPHIES.filter((t) => !t.count));
  return (
    <div className="tcat">
      {only !== 'once' && <>
      <span className="eb tcat-h">Trophies that grow</span>
      <p className="it tcat-p">The same trophy, raised from bronze to silver, gold and rainbow glass as you go on: with the work you publish, the company you keep with the other members, and the years. The easier a thing is, the more it takes; rainbow is rare.</p>
      {growing.map((g) => (
      <section key={g.name} className="tcat-shelf">
      <h3 className="lab tcat-shelf-h">{g.name}<span>{g.items.length}</span></h3>
      <div className="tcat-rows">
        {g.items.map((t: Trophy) => (
          <div key={t.id} className={`tcat-row${standings ? ' tr-tap' : ''}`} {...tap(t)}>
            <div className="tcat-text"><span className="tr-name">{t.name}</span><span className="tr-note">{t.note}</span>
              {mine(t) && <span className="lab tcat-you">{mine(t)!.earned ? `You: ${TIER_LABEL[mine(t)!.tier]} · ${num(mine(t)!.n)} ${unitFor(mine(t)!.n, t.unit)}` : `You: ${num(mine(t)!.n)} of ${num((t.at ?? TIER_AT).bronze)} for Bronze`}</span>}</div>
            <div className="tcat-metals">
              {TIERS.map((tier) => {
                const st = mine(t), at = t.at ?? TIER_AT;
                const reached = !!st && st.n >= at[tier];
                const nextUp = !!st && !reached && st.next?.tier === tier;
                return (
                <figure key={tier} className={`tr tr-mini${st ? (reached ? ' got' : nextUp ? ' next' : ' ahead') : ''}`} data-tier={tier}>
                  <Svg t={t} size={58} tier={tier} still={!reached} />
                  <span className="tr-tier"><span className="tr-mini-name">{TIER_LABEL[tier]} </span>{numShort(at[tier])}</span>
                </figure>
                );
              })}
              {mine(t) && (() => { const st = mine(t)!, goal = st.next ? st.next.at : (t.at ?? TIER_AT).rainbow;
                return <span className="tcat-prog" aria-hidden="true"><i style={{ width: `${Math.min(100, Math.round((st.n / goal) * 100))}%` }} /></span>; })()}
            </div>
          </div>
        ))}
      </div>
      </section>
      ))}
      </>}
      {only !== 'growing' && <>
      <span className="eb tcat-h">Won once</span>
      {once.map((g) => (
      <section key={g.name} className="tcat-shelf">
      <h3 className="lab tcat-shelf-h">{g.name}<span>{g.items.length}</span></h3>
      {/* Even rows, never a lone trophy left over: eight sit four and four, nine five and four, six three and three. */}
      <div className="tc-grid tcat-once" style={{ '--cols': Math.ceil(g.items.length / Math.ceil(g.items.length / 5)) } as React.CSSProperties}>
        {g.items.map((t) => { const lock = !!mine(t) && !mine(t)!.earned; return (
          <figure key={t.id} className={`tr${standings ? ' tr-tap' : ''}${lock ? ' locked' : ''}`} data-tier={t.tier} {...(standings ? tap(t) : { title: t.note })}>
            <Svg t={t} locked={lock} />
            <span className="tr-name">{t.name}</span>
            {mine(t)?.earned && <span className="tr-tier">Won</span>}
            <span className="tr-note">{t.note}</span>
          </figure>
        ); })}
      </div>
      </section>
      ))}
      </>}
      {open && <TrophyCard s={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
