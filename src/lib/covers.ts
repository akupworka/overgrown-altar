// The covers a member can set at the head of their vault: ten of the house's own photographs, nothing uploaded.
// Only the short name is kept on their profile (profiles.cover). Until they choose, each member is given one of the
// ten by their id, so the Guild's pages do not all open with the same picture.
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

const hash = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
/** The cover to show: the one they chose, or (until they choose) the one their id falls on. */
export const coverFor = (key?: string | null, id = ''): Cover => COVERS.find((c) => c.key === key) ?? COVERS[hash(id) % COVERS.length];
