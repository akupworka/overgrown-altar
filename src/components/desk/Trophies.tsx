// The trophy case for the members' area (same look as components/TrophyCase.astro).
// On your own page it also shows, as shadows, the trophies still to earn.
import { TROPHIES, TIER_AT, trophiesFor, trophySvg, TIER_LABEL, unitFor, type Tier, type Trophy, type TrophyCtx } from '../../lib/trophies';
import '../../styles/trophies.css';

type Standing = ReturnType<typeof trophiesFor>[number];

function Medal({ s, locked }: { s: Standing; locked?: boolean }) {
  const { trophy: t, tier, n, next } = s;
  return (
    <figure className={`tr${locked ? ' locked' : ''}`} data-tier={tier} title={t.note}>
      <span dangerouslySetInnerHTML={{ __html: trophySvg(t, 76, tier) }} />
      <span className="tr-name">{t.name}</span>
      <span className="tr-tier">{TIER_LABEL[tier]}{t.count && !locked ? ` · ${n} ${unitFor(n, t.unit)}` : ''}</span>
      {t.count && !locked && next
        ? <><span className="tr-bar" aria-hidden="true"><i style={{ width: `${Math.min(100, Math.round((n / next.at) * 100))}%` }} /></span><span className="tr-next">{next.at - n} more to {TIER_LABEL[next.tier]}</span></>
        : <span className="tr-note">{locked && t.count ? `${n ? `${n} of ${t.at?.bronze ?? 1}. ` : ''}Bronze at ${t.at?.bronze ?? 1} ${unitFor(t.at?.bronze ?? 1, t.unit)}.` : t.note}</span>}
    </figure>
  );
}

export function TrophyCase({ ctx, mine = false, tone = 'paper' }: { ctx: TrophyCtx; mine?: boolean; tone?: 'dark' | 'paper' }) {
  const all = trophiesFor(ctx);
  const earned = all.filter((x) => x.earned);
  const locked = all.filter((x) => !x.earned);
  if (!earned.length && !mine) return null;
  return (
    <section className={`tc${tone === 'paper' ? ' paper-tone' : ''}`}>
      <div className="tc-head"><span className="eb">Trophies</span><a className="lab mut" href="/guild/members/?view=prestige#trophies">{earned.length} of {TROPHIES.length} earned · see all</a></div>
      {earned.length > 0 && <div className="tc-grid">{earned.map((s) => <Medal key={s.trophy.id} s={s} />)}</div>}
      {mine && locked.length > 0 && (<>
        <span className="lab mut tc-sub">Still to earn</span>
        <div className="tc-grid">{locked.map((s) => <Medal key={s.trophy.id} s={s} locked />)}</div>
      </>)}
    </section>
  );
}

const TIERS: Tier[] = ['bronze', 'silver', 'gold', 'rainbow'];

/** Every trophy, for the catalogue on the prestiges page: the growing ones in all four metals, then the rest. */
export function TrophyCatalogue() {
  const growing = TROPHIES.filter((t) => t.count);
  const once = TROPHIES.filter((t) => !t.count);
  return (
    <div className="tcat">
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
    </div>
  );
}
