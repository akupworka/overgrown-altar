// Everything the search page can find without signing in, drawn when the site is built:
// every published piece and photograph, and the site's own pages.
import { getCatalog } from '../lib/catalog';
import { MEDIUM_LABEL, PILLAR_LABEL } from '../lib/guild';

const PAGES = [
  { href: '/start-here/', title: 'Start Here', line: 'Where to begin at the Overgrown Altar.' },
  { href: '/manifesto/', title: 'The Manifesto', line: 'What we are for, and why.' },
  { href: '/beliefs/', title: 'What We Believe', line: 'The faith the altar stands on.' },
  { href: '/about/', title: 'About', line: 'The journal, the guild and the editor.' },
  { href: '/watchtower/', title: 'The Watchtower', line: 'Prophetic audits of the age.' },
  { href: '/hearth/', title: 'The Hearth', line: 'Prose, poetry and fiction.' },
  { href: '/perimeter/', title: 'The Perimeter', line: 'Testimony and the unseen.' },
  { href: '/gallery/', title: 'The Gallery', line: 'Photographs of the Guild.' },
  { href: '/crafts/', title: 'The Crafts', line: 'Each craft, and what the editor looks for.' },
  { href: '/guild/', title: 'Join the Guild', line: 'A round-table guild for creative believers.' },
  { href: '/contact/', title: 'Contact', line: 'Write to the editor.' },
  { href: '/archive/', title: 'The Archive', line: 'Everything, in one place.' },
];

export async function GET() {
  const pieces = (await getCatalog()).map((p) => ({
    href: p.href, title: p.title, line: p.standfirst, who: p.author.name, date: p.date,
    kind: p.medium === 'photograph' ? 'photo' : 'piece', label: `${PILLAR_LABEL[p.pillar]} · ${MEDIUM_LABEL[p.medium] ?? ''}`, image: p.image,
  }));
  return new Response(JSON.stringify({ pieces, pages: PAGES }), { headers: { 'Content-Type': 'application/json' } });
}
