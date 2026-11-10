import { uniqueIds as useIds } from '../../lib/svgIds';
// The prestige badge for the Desk and the members' pages (same look as components/PrestigeBadge.astro).
import { prestigeFor } from '../../lib/prestige';
import { crestSvg } from '../../lib/crests';
import '../../styles/prestige.css';

export function PrestigeBadge({ published, tone = 'dark', size = 'sm', link = true }: { published: number; tone?: 'dark' | 'paper'; size?: 'sm' | 'lg'; link?: boolean }) {
  const { current: p } = prestigeFor(published);
  if (!p) return null;
  const Tag = link ? 'a' : 'span';
  return (
    <Tag href={link ? '/guild/members/?view=prestige' : undefined} className={`pr${tone === 'paper' ? ' pr-paper' : ''}${size === 'lg' ? ' pr-lg' : ''}`} data-level={p.level}
      style={p.level < 9 ? ({ '--c': p.color } as React.CSSProperties) : undefined} title={`${p.name}: ${p.note}`}>
      <span className="pr-crest" aria-hidden="true" dangerouslySetInnerHTML={{ __html: useIds(crestSvg(p.level, size === 'lg' ? 30 : 24, { mini: true })) }} /><span className="pr-n">{p.numeral}</span>{p.name}
    </Tag>
  );
}
