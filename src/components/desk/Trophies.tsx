// The Vault for the members' area (same look as components/TrophyCase.astro).
// On your own page it adds a fold-out of the trophies still to earn.
import { TROPHIES, TIER_AT, trophiesFor, finestFirst, trophySvg, TIER_LABEL, unitFor, type Tier, type Trophy, type TrophyCtx } from '../../lib/trophies';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/trophies.css';

type Standing = ReturnType<typeof trophiesFor>[number];

function Medal({ s, locked, size = 72, big = false, onOpen }: { s: Standing; locked?: boolean; size?: number; big?: boolean; onOpen?: (s: Standing) => void }) {
  const { trophy: t, tier, n, next } = s;
  return (
    <figure className={`tr${big ? ' tr-big' : ''}${locked ? ' locked' : ''}${onOpen ? ' tr-tap' : ''}`} data-tier={tier}
      {...(onOpen ? { role: 'button', tabIndex: 0, 'aria-label': `${t.name}: how to earn it`, onClick: () => onOpen(s), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(s); } } } : { title: t.note })}>
      {big && <span className="tr-light" aria-hidden="true" />}
      <span dangerouslySetInnerHTML={{ __html: trophySvg(t, size, tier) }} />
      <span className="tr-name">{t.name}</span>
      <span className="tr-tier">{TIER_LABEL[tier]}{t.count && !locked ? ` · ${n} ${unitFor(n, t.unit)}` : ''}</span>
      {t.count && !locked && next
        ? <><span className="tr-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, Math.round((n / next.at) * 100))}%` }} /></span><span className="tr-next">{next.at - n} more to {TIER_LABEL[next.tier]}</span></>
        : (big || locked) && <span className="tr-note">{locked && t.count ? `${n ? `${n} of ${t.at?.bronze ?? 1}. ` : ''}Bronze at ${t.at?.bronze ?? 1} ${unitFor(t.at?.bronze ?? 1, t.unit)}.` : t.note}</span>}
    </figure>
  );
}

// One trophy, opened: what it's for, how far along you are, and what each metal takes. Tap outside (or Escape) to close.
function TrophyCard({ s, onClose }: { s: Standing; onClose: () => void }) {
  const { trophy: t, tier, n, earned, next } = s;
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [onClose]);
  const at = t.count ? (t.at ?? TIER_AT) : null;
  const goal = t.count ? (next ? next.at : at![tier]) : 1;
  const pct = t.count ? Math.min(100, Math.round((n / Math.max(1, goal)) * 100)) : earned ? 100 : 0;
  return createPortal(
    <div className="trc-veil" onClick={onClose}>
      <div className="trc" role="dialog" aria-modal="true" aria-label={t.name} data-tier={tier} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="trc-x" onClick={onClose} aria-label="Close">×</button>
        <span className={`trc-medal${earned ? '' : ' locked'}`} dangerouslySetInnerHTML={{ __html: trophySvg(t, 110, earned ? tier : 'bronze') }} />
        <span className="lab trc-state">{earned ? `${TIER_LABEL[tier]} · earned` : 'Still to earn'}</span>
        <h3 className="trc-name">{t.name}</h3>
        <p className="it trc-note">{t.note}</p>
        {t.count ? (<>
          <div className="trc-count"><b>{n}</b> {unitFor(n, t.unit)}</div>
          <span className="trc-bar" aria-hidden="true"><i style={{ width: `${pct}%` }} /></span>
          <span className="trc-next">{next ? `${next.at - n} more to ${TIER_LABEL[next.tier]}` : 'The highest metal: rainbow glass.'}</span>
          <ol className="trc-metals">
            {TIERS.map((m) => {
              const reached = n >= at![m];
              return <li key={m} className={reached ? 'on' : ''} data-tier={m}><i />{TIER_LABEL[m]}<b>{at![m]}</b></li>;
            })}
          </ol>
        </>) : <span className="trc-next">{earned ? 'Earned. It stays in your vault.' : 'Earned once, the first time you do it.'}</span>}
      </div>
    </div>, document.body);
}

export function TrophyCase({ ctx, mine = false, name = '' }: { ctx: TrophyCtx; mine?: boolean; name?: string }) {
  const all = trophiesFor(ctx);
  const earned = finestFirst(all.filter((x) => x.earned));
  const locked = all.filter((x) => !x.earned);
  const [open, setOpen] = useState<Standing | null>(null);
  const [showLocked, setShowLocked] = useState(false);
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
        </header>
        {earned.length === 0 && <p className="it vault-empty">Your first published piece opens the vault.</p>}
        {shelf.length > 0 && <div className="vault-shelf">{shelf.map((s) => <Medal key={s.trophy.id} s={s} size={112} big onOpen={setOpen} />)}</div>}
        {rest.length > 0 && <div className="tc-grid vault-rest">{rest.map((s) => <Medal key={s.trophy.id} s={s} onOpen={setOpen} />)}</div>}
        {mine && locked.length > 0 && (
          <div className={`vault-locked${showLocked ? ' open' : ''}`}>
            <button type="button" className="vault-toggle" aria-expanded={showLocked} onClick={() => setShowLocked((v) => !v)}>
              <span className="vault-toggle-t">Still to earn</span><span className="vault-toggle-n">{locked.length}</span>
              <svg className="vault-toggle-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            {showLocked && <div className="tc-grid">{locked.map((s) => <Medal key={s.trophy.id} s={s} locked onOpen={setOpen} />)}</div>}
          </div>
        )}
        <a className="vault-all lab" href="/guild/members/?view=prestige#trophies">See every trophy →</a>
        {open && <TrophyCard s={open} onClose={() => setOpen(null)} />}
      </div>
    </section>
  );
}

const TIERS: Tier[] = ['bronze', 'silver', 'gold', 'rainbow'];

/** Every trophy, for the catalog on the prestiges page: the growing ones in all four metals, then the rest. */
export function TrophyCatalogue({ only }: { only?: 'growing' | 'once' } = {}) {
  const growing = TROPHIES.filter((t) => t.count);
  const once = TROPHIES.filter((t) => !t.count);
  return (
    <div className="tcat">
      {only !== 'once' && <>
      <span className="eb tcat-h">Trophies that grow</span>
      <p className="it tcat-p">The same trophy, raised from bronze to silver, gold and rainbow glass as the articles in its category grow, or as the years and the unbroken months add up. The easier a thing is, the more it takes; rainbow is rare.</p>
      <div className="tcat-rows">
        {growing.map((t: Trophy) => (
          <div key={t.id} className="tcat-row">
            <div className="tcat-text"><span className="tr-name">{t.name}</span><span className="tr-note">{t.note}</span></div>
            <div className="tcat-metals">
              {TIERS.map((tier) => (
                <figure key={tier} className="tr tr-mini" data-tier={tier}>
                  <span dangerouslySetInnerHTML={{ __html: trophySvg(t, 58, tier) }} />
                  <span className="tr-tier"><span className="tr-mini-name">{TIER_LABEL[tier]} · </span>{(t.at ?? TIER_AT)[tier]}</span>
                </figure>
              ))}
            </div>
          </div>
        ))}
      </div>
      </>}
      {only !== 'growing' && <>
      <span className="eb tcat-h">Won once</span>
      <div className="tc-grid">
        {once.map((t) => (
          <figure key={t.id} className="tr" data-tier={t.tier} title={t.note}>
            <span dangerouslySetInnerHTML={{ __html: trophySvg(t) }} />
            <span className="tr-name">{t.name}</span>
            <span className="tr-tier">{TIER_LABEL[t.tier]}</span>
            <span className="tr-note">{t.note}</span>
          </figure>
        ))}
      </div>
      </>}
    </div>
  );
}
