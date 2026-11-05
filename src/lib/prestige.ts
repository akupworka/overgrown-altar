// The ten prestiges of the Guild. A member rises through them automatically as their pieces are published
// (counted from approved pieces, so a badge updates the moment the editor publishes).
// Each is a tint of glass: colour enters only through glass.
export interface Prestige { level: number; numeral: string; name: string; at: number; color: string; note: string }

export const PRESTIGES: Prestige[] = [
  { level: 1, numeral: 'I', name: 'Inkling', at: 1, color: '#B9A78A', note: 'The first hint of something to say.' },
  { level: 2, numeral: 'II', name: 'Kindling', at: 2, color: '#C98A5B', note: 'The first pieces laid on the fire.' },
  { level: 3, numeral: 'III', name: 'Scribe', at: 3, color: '#F0A93B', note: 'Puts it down, and keeps putting it down.' },
  { level: 4, numeral: 'IV', name: 'Torchbearer', at: 5, color: '#E0603A', note: 'Carries the light into the dark.' },
  { level: 5, numeral: 'V', name: 'Stonemason', at: 8, color: '#9BA8B5', note: 'Building what will outlast us.' },
  { level: 6, numeral: 'VI', name: 'Glasswright', at: 12, color: '#D2404F', note: 'Sets colour into the window.' },
  { level: 7, numeral: 'VII', name: 'Illuminator', at: 17, color: '#4A7BEA', note: 'Gold and lapis on the page.' },
  { level: 8, numeral: 'VIII', name: 'Watchman', at: 25, color: '#33B07A', note: 'Keeps the wall and names the hour.' },
  { level: 9, numeral: 'IX', name: 'Luminary', at: 35, color: 'rainbow', note: 'A great light, gathered from every colour.' },
  { level: 10, numeral: 'X', name: 'Seraph', at: 50, color: 'gold', note: 'One of the burning ones.' },
];

/** Where a member stands: their prestige (null before the first published piece) and how far to the next. */
export function prestigeFor(published: number) {
  const current = [...PRESTIGES].reverse().find((p) => published >= p.at) ?? null;
  const next = PRESTIGES.find((p) => p.at > published) ?? null;
  return { current, next, toNext: next ? next.at - published : 0 };
}
