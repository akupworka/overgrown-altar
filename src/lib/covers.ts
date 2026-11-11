// The backgrounds a member can set behind their vault: ten of the house's own photographs, nothing uploaded.
// Only the short name is kept on their profile (profiles.cover). Until they choose, their vault keeps the house's own
// dark vault, as every page of the Guild has.
export interface Cover { key: string; name: string; src: string; pos: string }

export const COVERS: Cover[] = [
  { key: 'labyrinth', name: 'The labyrinth', src: '/images/labyrinth-stained-light-1200.jpg', pos: 'center 62%' },
  { key: 'dark-vault', name: 'The dark vault', src: '/images/tall-windows-dark-vault-1200.jpg', pos: 'center 44%' },
  { key: 'ascension', name: 'The Ascension window', src: '/images/ascension-window-wide-1200.jpg', pos: 'center 38%' },
  { key: 'bay-window', name: 'The bay window', src: '/images/bay-window-of-stained-glass-1200.jpg', pos: 'center 34%' },
  { key: 'four-lancets', name: 'Four lancets', src: '/images/four-lancet-window-1200.jpg', pos: 'center 46%' },
  { key: 'light-on-the-wall', name: 'Light on the wall', src: '/images/window-light-on-wall-1200.jpg', pos: 'center 50%' },
  { key: 'candlelit', name: 'The candlelit chapel', src: '/images/format-guild-1200.jpg', pos: 'center 52%' },
  { key: 'candles-and-glass', name: 'Candles and glass', src: '/images/archive-photo-1200.jpg', pos: 'center 52%' },
  { key: 'nave', name: 'The nave', src: '/images/folios-photo-2-1200.jpg', pos: 'center 70%' },
  { key: 'stone-cross', name: 'The stone cross', src: '/images/untangling-mental-strongholds-1200.jpg', pos: 'center 42%' },
];

export const DEFAULT_COVER = 'dark-vault';
/** The background they chose, or null while they have not chosen (the page keeps the house's own). */
export const chosenCover = (key?: string | null): Cover | null => COVERS.find((c) => c.key === key) ?? null;
