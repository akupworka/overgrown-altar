// The trophy case for the members' area (same look as components/TrophyCase.astro).
// On your own page it also shows, as shadows, the trophies still to earn.
import { TROPHIES, trophiesFor, trophySvg, TIER_LABEL, type TrophyCtx } from '../../lib/trophies';
import '../../styles/trophies.css';

function Medal({ t, locked }: { t: (typeof TROPHIES)[number]; locked?: boolean }) {
  return (
    <figure className={`tr${locked ? ' locked' : ''}`} data-tier={t.tier} title={t.note}>
      <span dangerouslySetInnerHTML={{ __html: trophySvg(t) }} />
      <span className="tr-name">{t.name}</span>
      <span className="tr-tier">{TIER_LABEL[t.tier]}</span>
      <span className="tr-note">{t.note}</span>
    </figure>
  );
}

export function TrophyCase({ ctx, mine = false, tone = 'paper' }: { ctx: TrophyCtx; mine?: boolean; tone?: 'dark' | 'paper' }) {
  const all = trophiesFor(ctx);
  const earned = all.filter((x) => x.earned).map((x) => x.trophy);
  const locked = all.filter((x) => !x.earned).map((x) => x.trophy);
  if (!earned.length && !mine) return null;
  return (
    <section className={`tc${tone === 'paper' ? ' paper-tone' : ''}`}>
      <div className="tc-head"><span className="eb">Trophies</span><a className="lab mut" href="/guild/members/?view=prestige#trophies">{earned.length} of {TROPHIES.length} earned · see all</a></div>
      {earned.length > 0 && <div className="tc-grid">{earned.map((t) => <Medal key={t.id} t={t} />)}</div>}
      {mine && locked.length > 0 && (<>
        <span className="lab mut tc-sub">Still to earn</span>
        <div className="tc-grid">{locked.map((t) => <Medal key={t.id} t={t} locked />)}</div>
      </>)}
    </section>
  );
}

/** Every trophy, for the catalogue on the prestiges page. */
export function TrophyCatalogue() {
  return (
    <div className="tc-grid">{TROPHIES.map((t) => <Medal key={t.id} t={t} />)}</div>
  );
}
