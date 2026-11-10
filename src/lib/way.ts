// The Way: the Fellowship's own path. The Guild climbs ten prestiges by what it publishes; the Fellowship walks
// seven stations by its presence: what it keeps, reads, encourages and the company it keeps. Each station is
// reached by earning pilgrim badges (pewter tokens, like those medieval pilgrims gathered at each shrine).

export interface WayCtx {
  saves: { pillar: string; medium: string }[];   // what they've kept (their collection)
  reflections: number;                            // reflections they've left on pieces
  marks: number;                                  // "This stayed with me"
  follows: number;                                // writers followed
  posts: number;                                  // forum posts and threads
  since: string | null;                           // when they joined
}

export type Glyph = 'shell' | 'shelf' | 'key' | 'eye' | 'rooms' | 'quill' | 'flame' | 'heart' | 'staff' | 'table' | 'letter' | 'leaf' | 'sun' | 'lamp';
export interface Badge { id: string; name: string; note: string; glyph: Glyph; group: string; rare?: boolean; earned: (c: WayCtx) => boolean; progress?: (c: WayCtx) => [number, number] }

const days = (c: WayCtx) => (c.since ? (Date.now() - Date.parse(c.since)) / 864e5 : 0);
const photos = (c: WayCtx) => c.saves.filter((s) => s.medium === 'photograph').length;
const crafts = (c: WayCtx) => new Set(c.saves.map((s) => s.medium)).size;
const rooms = (c: WayCtx) => new Set(c.saves.filter((s) => s.medium !== 'photograph').map((s) => s.pillar)).size;

export const BADGES: Badge[] = [
  { id: 'first-keep', group: 'Keeping', name: 'First Keep', note: 'Saved your first piece or photograph.', glyph: 'shell', earned: (c) => c.saves.length >= 1, progress: (c) => [Math.min(c.saves.length, 1), 1] },
  { id: 'shelf', group: 'Keeping', name: 'The Shelf', note: 'Twenty-five pieces kept in your collection.', glyph: 'shelf', earned: (c) => c.saves.length >= 25, progress: (c) => [Math.min(c.saves.length, 25), 25] },
  { id: 'curator', group: 'Keeping', name: 'The Curator', note: 'A hundred pieces kept.', glyph: 'key', earned: (c) => c.saves.length >= 100, progress: (c) => [Math.min(c.saves.length, 100), 100] },
  { id: 'eye-for-light', group: 'Keeping', name: 'Eye for Light', note: 'Ten photographs kept from the Gallery.', glyph: 'eye', earned: (c) => photos(c) >= 10, progress: (c) => [Math.min(photos(c), 10), 10] },
  { id: 'three-rooms', group: 'Reading', name: 'Three Rooms', note: 'Kept writing from the Watchtower, the Hearth and the Perimeter.', glyph: 'rooms', earned: (c) => rooms(c) >= 3, progress: (c) => [rooms(c), 3] },
  { id: 'kind-word', group: 'Encouraging', name: 'A Kind Word', note: 'Left your first reflection for a writer.', glyph: 'quill', earned: (c) => c.reflections >= 1, progress: (c) => [Math.min(c.reflections, 1), 1] },
  { id: 'encourager', group: 'Encouraging', name: 'The Encourager', note: 'Ten reflections left for the Guild’s writers.', glyph: 'flame', earned: (c) => c.reflections >= 10, progress: (c) => [Math.min(c.reflections, 10), 10] },
  { id: 'it-stayed', group: 'Encouraging', name: 'It Stayed', note: 'Told twenty-five writers their work stayed with you.', glyph: 'heart', earned: (c) => c.marks >= 25, progress: (c) => [Math.min(c.marks, 25), 25] },
  { id: 'fellow-traveller', group: 'Company', name: 'Fellow Traveller', note: 'Following five writers.', glyph: 'staff', earned: (c) => c.follows >= 5, progress: (c) => [Math.min(c.follows, 5), 5] },
  { id: 'at-the-table', group: 'Company', name: 'At the Table', note: 'Spoke for the first time in the Forum.', glyph: 'table', earned: (c) => c.posts >= 1, progress: (c) => [Math.min(c.posts, 1), 1] },
  { id: 'correspondent', group: 'Company', name: 'The Correspondent', note: 'Twenty-five words added to the Forum’s conversations.', glyph: 'letter', earned: (c) => c.posts >= 25, progress: (c) => [Math.min(c.posts, 25), 25] },
  { id: 'season', group: 'Faithfulness', name: 'A Season', note: 'Three months in the Fellowship.', glyph: 'leaf', earned: (c) => days(c) >= 90, progress: (c) => [Math.min(Math.floor(days(c)), 90), 90] },
  { id: 'year', group: 'Faithfulness', name: 'A Year at the Altar', note: 'A full year in the Fellowship.', glyph: 'sun', earned: (c) => days(c) >= 365, progress: (c) => [Math.min(Math.floor(days(c)), 365), 365] },
  { id: 'lamp', group: 'Faithfulness', name: 'The Lamp Kept Lit', note: 'Every other badge on the Way (the rare ones aside).', glyph: 'lamp', earned: (c) => BADGES.filter((b) => b.id !== 'lamp' && !b.rare).every((b) => b.earned(c)) },
  // Rare: hard to earn, gilded and glazed in stained glass.
  { id: 'every-shrine', group: 'Rare', rare: true, name: 'Every Shrine', note: 'Kept a piece of every craft the altar publishes: all ten.', glyph: 'rooms', earned: (c) => crafts(c) >= 10, progress: (c) => [crafts(c), 10] },
  { id: 'great-library', group: 'Rare', rare: true, name: 'The Great Library', note: 'Five hundred pieces kept.', glyph: 'shelf', earned: (c) => c.saves.length >= 500, progress: (c) => [Math.min(c.saves.length, 500), 500] },
  { id: 'rose-window', group: 'Rare', rare: true, name: 'The Rose Window', note: 'A hundred photographs kept from the Gallery.', glyph: 'eye', earned: (c) => photos(c) >= 100, progress: (c) => [Math.min(photos(c), 100), 100] },
  { id: 'illuminator', group: 'Rare', rare: true, name: 'The Illuminator', note: 'A hundred reflections left for the Guild’s writers.', glyph: 'quill', earned: (c) => c.reflections >= 100, progress: (c) => [Math.min(c.reflections, 100), 100] },
  { id: 'hundred-lamps', group: 'Rare', rare: true, name: 'A Hundred Lamps', note: 'Told two hundred and fifty writers their work stayed with you.', glyph: 'flame', earned: (c) => c.marks >= 250, progress: (c) => [Math.min(c.marks, 250), 250] },
  { id: 'patron', group: 'Rare', rare: true, name: 'The Patron', note: 'Following fifty writers.', glyph: 'staff', earned: (c) => c.follows >= 50, progress: (c) => [Math.min(c.follows, 50), 50] },
  { id: 'long-road', group: 'Rare', rare: true, name: 'The Long Road', note: 'Five years in the Fellowship.', glyph: 'sun', earned: (c) => days(c) >= 1826, progress: (c) => [Math.min(Math.floor(days(c)), 1826), 1826] },
];

export interface Station { n: number; name: string; at: number; line: string }
export const STATIONS: Station[] = [
  { n: 1, name: 'Wayfarer', at: 0, line: 'Setting out.' },
  { n: 2, name: 'Pilgrim', at: 1, line: 'On the road, with something kept.' },
  { n: 3, name: 'Lamplighter', at: 3, line: 'Carrying a little light for others.' },
  { n: 4, name: 'Keeper of the Flame', at: 5, line: 'Faithful in reading and in encouragement.' },
  { n: 5, name: 'Companion', at: 7, line: 'Known at the table.' },
  { n: 6, name: 'Elder', at: 10, line: 'One the Fellowship leans on.' },
  { n: 7, name: 'Friend of the Altar', at: 13, line: 'The whole Way walked.' },
];

export function wayFor(c: WayCtx) {
  const earned = BADGES.filter((b) => b.earned(c));
  const n = earned.length;
  const current = [...STATIONS].reverse().find((s) => n >= s.at) ?? STATIONS[0];
  const next = STATIONS.find((s) => s.at > n) ?? null;
  return { earned, count: n, current, next, toNext: next ? next.at - n : 0 };
}

// Pewter badges, drawn in the browser: a beaded rim around a struck token, the glyph raised in silver.
const G: Record<Glyph, string> = {
  shell: '<path d="M12 18c-4 0-6.5-3.5-6.5-7 0 0 2.5-4 6.5-4s6.5 4 6.5 4c0 3.5-2.5 7-6.5 7z"/><path d="M12 18V7.5M9 17l-1.5-8M15 17l1.5-8"/>',
  shelf: '<path d="M5 18h14M6.5 18V8M9.5 18V6.5M12.5 18V9M15.5 18l1.5-9.5"/>',
  key: '<circle cx="9" cy="9" r="3.2"/><path d="M11.4 11.4 18 18M15.5 15.5l1.5-1.5M17 17l1.5-1.5"/>',
  eye: '<path d="M4 12s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z"/><circle cx="12" cy="12" r="2.3"/>',
  rooms: '<path d="M5 18v-6a2 2 0 0 1 4 0v6M10 18v-8a2 2 0 0 1 4 0v8M15 18v-6a2 2 0 0 1 4 0v6M4 18h16"/>',
  quill: '<path d="M18 5c-6 1-9 6-10 12M18 5c-1 5-4 8-8 9M8 17l-2 2"/>',
  flame: '<path d="M12 19c-3 0-5-2-5-4.8 0-3 2.5-4.2 3-7.2 2 1.5 2.5 3 2.5 4 .8-.6 1.2-1.6 1.2-2.6 2 1.6 3.3 3.6 3.3 5.8 0 2.8-2 4.8-5 4.8z"/>',
  heart: '<path d="M12 18s-6-3.6-6-8a3.2 3.2 0 0 1 6-1.6A3.2 3.2 0 0 1 18 10c0 4.4-6 8-6 8z"/>',
  staff: '<path d="M10 20V6.5M10 6.5c0-1.8 1.4-2.5 2.5-2.5S15 4.8 15 6.2c0 1.2-.9 1.8-2 1.8M14 13l3.5 3.5M16.5 12l1 1"/>',
  table: '<path d="M4 10h16M6 10v8M18 10v8M8.5 7h7"/>',
  letter: '<rect x="5" y="7" width="14" height="10" rx="1"/><path d="M5.5 7.5 12 12.5l6.5-5"/>',
  leaf: '<path d="M6 18c0-7 4.5-11 12-12-1 7.5-5 12-12 12z"/><path d="M6 18l7-7"/>',
  sun: '<circle cx="12" cy="12" r="3.5"/><path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.7 6.7l1.4 1.4M15.9 15.9l1.4 1.4M6.7 17.3l1.4-1.4M15.9 8.1l1.4-1.4"/>',
  lamp: '<path d="M8 15h8l-1-3c2-1 2.5-3 1.5-4.5-1.2 1-2.5 1-3.5.2-1 .8-2.3.8-3.5-.2C8.5 9 9 11 11 12l-1 3"/><path d="M7 18h10M12 4.5v1.5"/>',
};
// Each family of badges has its own enamel, as painted pilgrim badges did; the pewter stays as the rim.
export const ENAMEL: Record<string, [string, string]> = {
  Keeping: ['#8FB2FF', '#1E3F94'], Reading: ['#7FE3C8', '#11624F'], Encouraging: ['#FF9AA8', '#8A1C33'],
  Company: ['#FFD88A', '#9A5A0C'], Faithfulness: ['#D3B2FF', '#4B2690'], Lamp: ['#FFF2C2', '#B07A12'], Rare: ['#FFF6DA', '#7A1E6E'],
};
export const enamelOf = (b: Badge) => ENAMEL[b.id === 'lamp' ? 'Lamp' : b.group];

export function pewterBadge(glyph: Glyph, size = 64, lit = true, enamel?: [string, string], rare = false): string {
  const id = `pw${glyph}${size}${lit ? 1 : 0}${enamel ? enamel[1].slice(1) : ''}${rare ? 'r' : ''}`;
  const gold = rare && lit;
  const beads = Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return `<circle cx="${(32 + Math.cos(a) * 28.2).toFixed(2)}" cy="${(32 + Math.sin(a) * 28.2).toFixed(2)}" r="1.15"/>`; }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs>
    <radialGradient id="${id}a" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="${gold ? '#FFF4C8' : lit ? '#F2F0EA' : '#6E6C66'}"/><stop offset=".45" stop-color="${gold ? '#D9A93A' : lit ? '#A9A7A0' : '#4A4944'}"/><stop offset="1" stop-color="${gold ? '#6B4410' : lit ? '#4F4E4A' : '#2A2A27'}"/></radialGradient>
    <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3E7BFF"/><stop offset=".25" stop-color="#B05BFF"/><stop offset=".5" stop-color="#FF3B4E"/><stop offset=".75" stop-color="#FFC44D"/><stop offset="1" stop-color="#3DE0A0"/></linearGradient>
    <radialGradient id="${id}b" cx="40%" cy="32%" r="75%"><stop offset="0" stop-color="${lit ? (enamel ? enamel[0] : '#C9C7C0') : '#4E4D48'}"/><stop offset="1" stop-color="${lit ? (enamel ? enamel[1] : '#3E3D3A') : '#1F1F1D'}"/></radialGradient></defs>
    <circle cx="32" cy="32" r="31" fill="url(#${id}a)"/>
    <g fill="${gold ? '#FFE9A8' : lit ? '#D9D7D0' : '#55544F'}" opacity=".9">${beads}</g>
    <circle cx="32" cy="32" r="25" fill="url(#${id}${gold ? 'g' : 'b'})"/>${gold ? `<circle cx="32" cy="32" r="25" fill="url(#${id}b)" opacity=".35"/>` : ''}
    <circle cx="32" cy="32" r="25" fill="none" stroke="${lit ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.08)'}" stroke-width=".8"/>
    <g transform="translate(16 16) scale(1.333)" fill="none" stroke="${lit ? (enamel ? '#FFFDF6' : '#F4F2EC') : '#77756F'}" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">${G[glyph]}</g>
  </svg>`;
}
