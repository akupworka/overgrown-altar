// Trophies: particular achievements, beside the prestiges (which count how much a member has published).
// Each trophy has its own emblem; its tier sets the shape and the metal:
//   bronze  = a round medal          silver = a cathedral-window arch
//   gold    = a shield               rainbow = a rose window in coloured glass
// They are worked out from what the site already knows (published pieces and the member's page), so they
// update by themselves. Reading and commenting trophies can join once those features exist.

export type Tier = 'bronze' | 'silver' | 'gold' | 'rainbow';
export interface TrophyPiece { pillar: string; medium: string; body: string; published_at: string | null }
export interface TrophyMember { portrait_path?: string | null; portrait?: string; bio?: string; craft?: string; role?: string; created_at?: string | null }
export interface TrophyCtx { pieces: TrophyPiece[]; member: TrophyMember }
export interface Trophy { id: string; name: string; tier: Tier; note: string; glyph: string; earned: (c: TrophyCtx) => boolean }

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const has = (c: TrophyCtx, f: (p: TrophyPiece) => boolean) => c.pieces.some(f);
const kinds = (c: TrophyCtx) => new Set(c.pieces.map((p) => p.medium)).size;
const months = (c: TrophyCtx) => new Set(c.pieces.map((p) => (p.published_at ?? '').slice(0, 7)).filter(Boolean)).size;

// Emblems are drawn on a 24×24 grid with fine lines.
const G = {
  quill: 'M20 3C13 4 8 9 6 16l-2 4M6 16c4 0 8-2 10-6M14 6l3 3',
  arch: 'M7 20V10a5 5 0 0 1 10 0v10zM4 20h16M12 5v2',
  signature: 'M3 16c3-4 5-9 7-9s-1 9 1 9 3-5 5-5 1 4 3 4M3 20h18',
  lyre: 'M8 4c-2.5 3-2.5 9 0 13h8c2.5-4 2.5-10 0-13M10 7v9M12 6.5v9.5M14 7v9M7 20h10M12 17v3',
  aperture: 'M12 3a9 9 0 1 0 .01 0M12 3l2.5 7M21 12l-7 1.5M16 19.5l-4.5-5.5M5 18l5.5-4M4.5 7.5l6.5 3',
  book: 'M3 6c3-1 6-1 9 1 3-2 6-2 9-1v12c-3-1-6-1-9 1-3-2-6-2-9-1zM12 7v12',
  tower: 'M8 21V9l4-5 4 5v12M6 21h12M11 12h2M10 16h4M12 4V2',
  shield: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6zM12 8v8M9 11h6',
  flame: 'M12 3c3 4 6 6 6 10a6 6 0 0 1-12 0c0-3 2-4 3-6 1 2 2 3 3 3 0-3-1-5 0-7z',
  scroll: 'M7 4h11a2 2 0 0 1 0 4H9v10a2 2 0 0 1-4 0v-2h2M11 11h5M11 14h4',
  quotes: 'M5 11h4v6H4v-4c0-3 1-5 4-6M15 11h4v6h-5v-4c0-3 1-5 4-6',
  verse: 'M5 4h11l3 3v13H5zM12 8v8M9 11h6',
  arches: 'M3 20v-7a2.5 2.5 0 0 1 5 0v7M9.5 20v-9a2.5 2.5 0 0 1 5 0v9M16 20v-7a2.5 2.5 0 0 1 5 0v7M2 20h20',
  hourglass: 'M7 3h10M7 21h10M8 3c0 5 8 7 8 9s-8 4-8 9M16 3c0 5-8 7-8 9s8 4 8 9',
  compass: 'M12 3a9 9 0 1 0 .01 0M15.5 8.5l-2 5-5 2 2-5zM12 3v2M12 19v2M3 12h2M19 12h2',
  rose: 'M12 3a9 9 0 1 0 .01 0M12 7.5a4.5 4.5 0 1 0 .01 0M12 3v4.5M12 16.5V21M3 12h4.5M16.5 12H21M5.6 5.6l3.2 3.2M15.2 15.2l3.2 3.2M5.6 18.4l3.2-3.2M15.2 8.8l3.2-3.2',
  keys: 'M8 15a4 4 0 1 1 3.4-6.1L21 9v3h-2v2h-2v2h-3l-2.6-2A4 4 0 0 1 8 15zM7 11h.01',
  dove: 'M3 13c4 0 6-3 8-6 1 3 3 5 7 5l3-2-1 4c-2 3-5 5-9 5-3 0-6-2-8-6zM11 7c0-2 1-3 3-4',
};

export const TROPHIES: Trophy[] = [
  // Bronze: first steps
  { id: 'first-light', name: 'First Light', tier: 'bronze', glyph: G.quill, note: 'Published a first piece.', earned: (c) => c.pieces.length >= 1 },
  { id: 'sitter', name: 'The Sitter', tier: 'bronze', glyph: G.arch, note: 'Added a portrait to their page.', earned: (c) => !!(c.member.portrait_path || c.member.portrait) },
  { id: 'signed', name: 'Signed & Sealed', tier: 'bronze', glyph: G.signature, note: 'Wrote their craft and a few lines about themselves.', earned: (c) => !!(c.member.bio?.trim() && c.member.craft?.trim()) },
  { id: 'lyre', name: 'The Lyre', tier: 'bronze', glyph: G.lyre, note: 'Published a poem.', earned: (c) => has(c, (p) => p.medium === 'poetry') },
  { id: 'lens', name: 'The Lens', tier: 'bronze', glyph: G.aperture, note: 'Published photographs.', earned: (c) => has(c, (p) => p.medium === 'photograph') },
  { id: 'tale', name: 'Once Upon', tier: 'bronze', glyph: G.book, note: 'Published a piece of fiction.', earned: (c) => has(c, (p) => p.medium === 'fiction') },
  // Silver: a room of the house
  { id: 'tower', name: 'On the Wall', tier: 'silver', glyph: G.tower, note: 'Published a dispatch in The Watchtower.', earned: (c) => has(c, (p) => p.pillar === 'watchtower') },
  { id: 'hearth', name: 'By the Fire', tier: 'silver', glyph: G.flame, note: 'Published work in The Hearth.', earned: (c) => has(c, (p) => p.pillar === 'hearth') },
  { id: 'witness', name: 'The Witness', tier: 'silver', glyph: G.shield, note: 'Shared a story in The Perimeter.', earned: (c) => has(c, (p) => p.pillar === 'perimeter') },
  { id: 'long-form', name: 'The Long Form', tier: 'silver', glyph: G.scroll, note: 'Published a piece of more than 2,000 words.', earned: (c) => has(c, (p) => words(p.body) > 2000) },
  { id: 'voice', name: 'Set in Stone', tier: 'silver', glyph: G.quotes, note: 'Set a line apart as a pull quote.', earned: (c) => has(c, (p) => /(^|\n)> /.test(p.body)) },
  { id: 'verse', name: 'Chapter & Verse', tier: 'silver', glyph: G.verse, note: 'Brought Scripture into a piece.', earned: (c) => has(c, (p) => /(^|\n)\+ /.test(p.body)) },
  // Gold: range and faithfulness
  { id: 'three-rooms', name: 'Three Rooms', tier: 'gold', glyph: G.arches, note: 'Published in all three pillars.', earned: (c) => ['watchtower', 'hearth', 'perimeter'].every((x) => has(c, (p) => p.pillar === x)) },
  { id: 'polymath', name: 'The Polymath', tier: 'gold', glyph: G.compass, note: 'Published four different kinds of work.', earned: (c) => kinds(c) >= 4 },
  { id: 'seasons', name: 'Every Season', tier: 'gold', glyph: G.hourglass, note: 'Published in four different months.', earned: (c) => months(c) >= 4 },
  // Rainbow: rare
  { id: 'founder', name: 'Founding Stone', tier: 'rainbow', glyph: G.rose, note: 'Took a seat in the Guild’s founding year.', earned: (c) => (c.member.created_at ?? '').startsWith('2026') },
  { id: 'keys', name: 'Keys of the House', tier: 'rainbow', glyph: G.keys, note: 'Keeps the house as its editor.', earned: (c) => c.member.role === 'editor' },
];

export const TIER_LABEL: Record<Tier, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', rainbow: 'Rainbow' };
export const trophiesFor = (c: TrophyCtx) => TROPHIES.map((t) => ({ trophy: t, earned: t.earned(c) }));

// ---- drawing

const METAL: Record<Exclude<Tier, 'rainbow'>, [string, string, string]> = {
  bronze: ['#6E4220', '#E3A86A', '#9A6233'],
  silver: ['#6F7A86', '#F4F6F8', '#A9B3BE'],
  gold: ['#8A6412', '#F9E7A6', '#C99A2E'],
};
const INK: Record<Tier, string> = { bronze: '#F0C08E', silver: '#EEF2F6', gold: '#FFE7A3', rainbow: '#FFFFFF' };

// A rose window's scalloped edge (16 lobes), for rainbow trophies.
function scallop(cx: number, cy: number, r: number, lobes = 16, depth = 2.6) {
  let d = '';
  for (let i = 0; i <= lobes * 8; i++) {
    const a = (i / (lobes * 8)) * Math.PI * 2;
    const rr = r - depth * (1 - Math.cos(a * lobes)) / 2;
    d += `${i ? 'L' : 'M'}${(cx + rr * Math.sin(a)).toFixed(2)},${(cy - rr * Math.cos(a)).toFixed(2)}`;
  }
  return d + 'Z';
}
const SHAPES: Record<Tier, { outer: string; inner: string; glyph: [number, number, number] }> = {
  bronze: { outer: 'M32 2a30 30 0 1 0 .01 0Z', inner: 'M32 8a24 24 0 1 0 .01 0Z', glyph: [17, 17, 1.25] },
  silver: { outer: 'M6 62V30a26 26 0 0 1 52 0v32Z', inner: 'M12 57V30a20 20 0 0 1 40 0v27Z', glyph: [17, 22, 1.25] },
  gold: { outer: 'M32 2l27 9v19c0 17-12 28-27 32C17 58 5 47 5 30V11Z', inner: 'M32 8l21 7v15c0 13-9 22-21 26-12-4-21-13-21-26V15Z', glyph: [17, 16, 1.25] },
  rainbow: { outer: scallop(32, 32, 30), inner: 'M32 9a23 23 0 1 0 .01 0Z', glyph: [17, 17, 1.25] },
};

/** The trophy as an SVG string (used by both the Astro pages and the members' app). */
export function trophySvg(t: Trophy, size = 64): string {
  const s = SHAPES[t.tier];
  const id = `tr-${t.tier}`;
  const fill = t.tier === 'rainbow'
    ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3E7BFF"/><stop offset=".3" stop-color="#B05BFF"/><stop offset=".55" stop-color="#FF3B4E"/><stop offset=".78" stop-color="#FFC44D"/><stop offset="1" stop-color="#3DE0A0"/></linearGradient>`
    : `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${METAL[t.tier][1]}"/><stop offset=".5" stop-color="${METAL[t.tier][2]}"/><stop offset="1" stop-color="${METAL[t.tier][0]}"/></linearGradient>`;
  const [gx, gy, gs] = s.glyph;
  return `<svg class="tr-svg" width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><defs>${fill}<radialGradient id="tr-core" cx=".5" cy=".35" r=".75"><stop offset="0" stop-color="#2A2F24"/><stop offset="1" stop-color="#0C0F0B"/></radialGradient></defs>`
    + `<path d="${s.outer}" fill="url(#${id})"/>`
    + `<path d="${s.inner}" fill="url(#tr-core)" stroke="rgba(255,255,255,.18)" stroke-width=".6"/>`
    + `<g transform="translate(${gx} ${gy}) scale(${gs})" fill="none" stroke="${INK[t.tier]}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="${t.glyph}"/></g></svg>`;
}
