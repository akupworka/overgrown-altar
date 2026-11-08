// The Vault for the members' area (same look as components/TrophyCase.astro).
// On your own page it adds a fold-out of the trophies still to earn.
import { TROPHIES, TIER_AT, trophiesFor, finestFirst, trophySvg, TIER_LABEL, unitFor, type Tier, type Trophy, type TrophyCtx } from '../../lib/trophies';
import '../../styles/trophies.css';

type Standing = ReturnType<typeof trophiesFor>[number];

function Medal({ s, locked, size = 72, big = false }: { s: Standing; locked?: boolean; size?: number; big?: boolean }) {
  const { trophy: t, tier, n, next } = s;
  return (
    <figure className={`tr${big ? ' tr-big' : ''}${locked ? ' locked' : ''}`} data-tier={tier} title={t.note}>
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

export function TrophyCase({ ctx, mine = false, name = '' }: { ctx: TrophyCtx; mine?: boolean; name?: string }) {
  const all = trophiesFor(ctx);
  const earned = finestFirst(all.filter((x) => x.earned));
  const locked = all.filter((x) => !x.earned);
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
        {shelf.length > 0 && <div className="vault-shelf">{shelf.map((s) => <Medal key={s.trophy.id} s={s} size={112} big />)}</div>}
        {rest.length > 0 && <div className="tc-grid vault-rest">{rest.map((s) => <Medal key={s.trophy.id} s={s} />)}</div>}
        {mine && locked.length > 0 && (
          <details className="vault-locked">
            <summary className="lab">Still to earn · {locked.length}</summary>
            <div className="tc-grid">{locked.map((s) => <Medal key={s.trophy.id} s={s} locked />)}</div>
          </details>
        )}
        <a className="vault-all lab" href="/guild/members/?view=prestige#trophies">See every trophy →</a>
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
