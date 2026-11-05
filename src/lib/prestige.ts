// The ten prestiges of the Guild. A member rises through them automatically as their pieces are published
// (counted from approved pieces, so a badge updates the moment the editor publishes).
// Each is a tint of glass: colour enters only through glass.
export interface Prestige { level: number; numeral: string; name: string; at: number; color: string; note: string }

export const PRESTIGES: Prestige[] = [
  { level: 1, numeral: 'I', name: 'Kindling', at: 1, color: '#C98A5B', note: 'The first piece laid on the fire.' },
  { level: 2, numeral: 'II', name: 'Candlebearer', at: 2, color: '#E2C58F', note: 'A small light, carried in.' },
  { level: 3, numeral: 'III', name: 'Lamplighter', at: 3, color: '#F0A93B', note: 'Lighting the way for others.' },
  { level: 4, numeral: 'IV', name: 'Glazier', at: 5, color: '#D2404F', note: 'Setting colour into the window.' },
  { level: 5, numeral: 'V', name: 'Stonemason', at: 8, color: '#9BA8B5', note: 'Building what will outlast us.' },
  { level: 6, numeral: 'VI', name: 'Illuminator', at: 12, color: '#4A7BEA', note: 'Gold and lapis on the page.' },
  { level: 7, numeral: 'VII', name: 'Watchman', at: 17, color: '#33B07A', note: 'Keeping the wall, naming the hour.' },
  { level: 8, numeral: 'VIII', name: 'Keeper of the Flame', at: 25, color: '#9B6BEA', note: 'The fire does not go out on their watch.' },
  { level: 9, numeral: 'IX', name: 'Rose Window', at: 35, color: 'rainbow', note: 'Every colour, gathered into one light.' },
  { level: 10, numeral: 'X', name: 'Pillar of the Altar', at: 50, color: 'gold', note: 'What the house leans on.' },
];

/** Where a member stands: their prestige (null before the first published piece) and how far to the next. */
export function prestigeFor(published: number) {
  const current = [...PRESTIGES].reverse().find((p) => published >= p.at) ?? null;
  const next = PRESTIGES.find((p) => p.at > published) ?? null;
  return { current, next, toNext: next ? next.at - published : 0 };
}
