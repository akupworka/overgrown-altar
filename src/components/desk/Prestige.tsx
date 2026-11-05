// The prestige badge for the Desk and the members' pages (same look as components/PrestigeBadge.astro).
import { prestigeFor } from '../../lib/prestige';
import '../../styles/prestige.css';

export function PrestigeBadge({ published, tone = 'dark', size = 'sm' }: { published: number; tone?: 'dark' | 'paper'; size?: 'sm' | 'lg' }) {
  const { current: p } = prestigeFor(published);
  if (!p) return null;
  return (
    <span className={`pr${tone === 'paper' ? ' pr-paper' : ''}${size === 'lg' ? ' pr-lg' : ''}`} data-level={p.level}
      style={p.level < 9 ? ({ '--c': p.color } as React.CSSProperties) : undefined} title={`${p.name}: ${p.note}`}>
      <span className="pr-gem" aria-hidden="true" /><span className="pr-n">{p.numeral}</span>{p.name}
    </span>
  );
}
