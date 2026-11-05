// Every real piece on the site, in one list: the two complete pieces from the design,
// plus everything published from the Guild Desk. Lists across the site draw from here,
// so every link leads to a real page.
import { getGuildPieces, guildUrl, authorUrl, MEDIUM_LABEL, PILLAR_LABEL, readingMinutes } from './guild';

export interface CatalogItem {
  href: string; title: string; standfirst: string; date: string;
  pillar: 'watchtower' | 'hearth' | 'perimeter'; medium: string; thinkers: string[];
  kicker: string; minutes?: number; image: string;
  author: { name: string; portrait?: string; href?: string; id?: string };
}

const FOUNDATIONS: CatalogItem[] = [
  {
    href: '/perimeter/untangling-mental-strongholds', title: 'Untangling Mental Strongholds',
    standfirst: 'A recovery manual in five movements for bringing a stronghold under the obedience of Christ.',
    date: '2026-09-29', pillar: 'perimeter', medium: 'recovery', thinkers: [], minutes: 8,
    kicker: 'Recovery story', image: '/images/untangling-mental-strongholds-1200.jpg', author: { name: 'Ainslie Willson' },
  },
];

export async function getCatalog(): Promise<CatalogItem[]> {
  const guild: CatalogItem[] = (await getGuildPieces()).map((g) => ({
    href: guildUrl(g), title: g.title, standfirst: g.standfirst, date: g.published_at.slice(0, 10),
    pillar: g.pillar, medium: g.medium, thinkers: [], minutes: readingMinutes(g.body),
    kicker: `${PILLAR_LABEL[g.pillar]} · ${MEDIUM_LABEL[g.medium] ?? ''}`,
    image: g.image || { watchtower: '/images/watchtower-photo-1200.jpg', hearth: '/images/glass-2-1200.jpg', perimeter: '/images/chapel-and-cross-under-a-1200.jpg' }[g.pillar],
    author: { name: g.author.display_name, portrait: g.author.portrait || undefined, href: authorUrl(g.author), id: g.author.id },
  }));
  return [...guild, ...FOUNDATIONS].sort((a, b) => b.date.localeCompare(a.date));
}
export const inPillar = async (p: CatalogItem['pillar']) => (await getCatalog()).filter((x) => x.pillar === p);
