// Trophies: particular achievements, beside the prestiges (which count how much a member has published).
// Two kinds:
//   - category trophies GROW: the same trophy turns bronze, then silver, gold and rainbow as more pieces in its
//     category are published. Each has its own thresholds (bronze 1–3, silver 3–10, gold 10–20, rainbow 20–30);
//     the easier a kind of work is to make, the more pieces each metal takes.
//   - the other trophies are won once, at a fixed tier.
// Each trophy has its own emblem; its tier sets the shape and the metal:
//   bronze  = a round medal          silver = a cathedral-window arch
//   gold    = a shield               rainbow = a rose window in colored glass
// They are worked out from what the site already knows (published pieces and the member's page), so they
// update by themselves. Reading and commenting trophies can join once those features exist.

import type { PhotoMeta } from './photo';

export type Tier = 'bronze' | 'silver' | 'gold' | 'rainbow';
export interface TrophyPiece {
  pillar: string; medium: string; body: string; published_at: string | null;
  // Photography: the details behind the lens and the smaller photographs (named either way, from the Desk or the built site)
  photo_meta?: PhotoMeta | null; photoMeta?: PhotoMeta | null; gallery?: unknown[] | null;
}
export interface TrophyMember { portrait_path?: string | null; portrait?: string; bio?: string; craft?: string; role?: string; created_at?: string | null }
/** A member's part in the forum (public.forum_tallies): it only ever goes up, so trophies are never lost to cleared threads. */
export interface ForumTally { posts: number; threads: number; best_thread: number; prayer: number; boards: string[] }
export interface TrophyCtx { pieces: TrophyPiece[]; member: TrophyMember; forum?: ForumTally | null }
export interface Trophy {
  id: string; name: string; tier: Tier; note: string; glyph: string; earned: (c: TrophyCtx) => boolean;
  count?: (c: TrophyCtx) => number;   // set for category trophies: how many pieces count toward it
  unit?: string;                      // what is counted, e.g. "dispatches"
  at?: Record<Tier, number>;          // category trophies: pieces needed for each metal (harder ones need more)
}
/** Category trophies: the piece count at which each metal is reached. */
export const TIER_AT: Record<Tier, number> = { bronze: 1, silver: 3, gold: 10, rainbow: 20 };
const TIER_ORDER: Tier[] = ['bronze', 'silver', 'gold', 'rainbow'];

const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const has = (c: TrophyCtx, f: (p: TrophyPiece) => boolean) => c.pieces.some(f);
const kinds = (c: TrophyCtx) => new Set(c.pieces.map((p) => p.medium)).size;
const count = (c: TrophyCtx, f: (p: TrophyPiece) => boolean) => c.pieces.filter(f).length;
// Whole years since they joined, and their longest run of consecutive months with a published piece.
const yearsAt = (c: TrophyCtx) => c.member.created_at ? Math.floor((Date.now() - Date.parse(c.member.created_at)) / (365.25 * 864e5)) : 0;
const longestStreak = (c: TrophyCtx) => {
  const idx = [...new Set(c.pieces.map((p) => (p.published_at ?? '').slice(0, 7)).filter(Boolean))]
    .map((m) => Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1).sort((a, b) => a - b);
  let best = 0, run = 0;
  idx.forEach((m, i) => { run = i && m === idx[i - 1] + 1 ? run + 1 : 1; best = Math.max(best, run); });
  return best;
};
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
  candle: 'M12 3c1.6 2 2 3.6 0 5.2-2-1.6-1.6-3.2 0-5.2zM9 10h6v10H9zM7 20h10M12 8.2V10',
  lancet: 'M7 21V9a5 5 0 0 1 10 0v12zM12 4v17M7 13h10M7 17h10M9 7.5l6 3.5',
  beacon: 'M9 21l1-8h4l1 8M8 13h8M7 21h10M12 3c2 2.5 3.5 4 3.5 6a3.5 3.5 0 0 1-7 0c0-1.5 1-2.5 2-3.5.5 1 1 1.5 1.5 1.5 0-1.5-.5-2.5 0-4z',
  standing: 'M7 21c-1-6 0-12 2-16 2-2 4-2 6 0 2 4 3 10 2 16zM12 8.5v7M9.5 11h5M4 21h16',
  illumin: 'M4 4h16v16H4zM8 17l4-10 4 10M9.5 13.5h5M4 8h2M18 16h2',
  witnesses: 'M5 20v-4a2 2 0 0 1 4 0v4M15 20v-4a2 2 0 0 1 4 0v4M10 20v-6a2 2 0 0 1 4 0v6M7 11.5a1.5 1.5 0 1 0 .01 0M17 11.5a1.5 1.5 0 1 0 .01 0M12 8a1.6 1.6 0 1 0 .01 0M3 20h18',
  lantern: 'M10 3h4v2h-4zM8.5 7h7l1 2.5v8l-1 2.5h-7l-1-2.5v-8zM12 10v6M12 5v2M7.5 9.5h9M7.5 17.5h9',
  stones: 'M3 20h18M4.5 20v-5h4.5v5M9.8 20V9.5h4.4V20M15 20v-7h4.5v7M9.8 13h4.4M12 5.5l2.2 4h-4.4z',
  table: 'M3 10h18M5 10v9M19 10v9M8 14h8M8 14v5M16 14v5M12 4c1 1.2 1.2 2.2 0 3.4-1.2-1.2-1-2.2 0-3.4zM12 7.4V10',
  ring: 'M12 21a8 8 0 1 0 0-16M12 5a8 8 0 0 0-5.7 13.6M12 8c1.8 2.2 3 3.4 3 5.2a3 3 0 0 1-6 0c0-1.2.8-2 1.6-2.8.4.9.8 1.2 1.2 1.2 0-1.3-.4-2.2.2-3.6z',
  // The forum
  talk: 'M3 5h12v8H8l-4 3v-3H3zM17 9h4v8h-1.5v3L16 17h-5v-2',
  door: 'M6 21V7a6 6 0 0 1 12 0v14M3 21h18M14.5 14h.01M12 4v2',
  firstword: 'M4 5h16v10H10l-5 4v-4H4zM8 9h8M8 12h5',
  rooms: 'M3 21V10l4.5-4L12 10v11M12 21V10l4.5-4L21 10v11M2 21h20M6 14h3M15 14h3M6 17.5h3M15 17.5h3',
  // Photography
  canister: 'M5 7h9v13H5zM7 7V4.5h5V7M14 9h6v9h-6M16 9v9M18 9v9M14 11.5h6M14 15.5h6M5 11h9',
  camera: 'M3 8h4l2-3h6l2 3h4v11H3zM12 10a3.5 3.5 0 1 0 .01 0M18.5 6V3.5M21 7.5l1.5-1.5M17 5.5l-1-1',
  frames: 'M3 4h18v16H3zM3 9.5h18M3 15h18M9 4v16M15 4v16',
  notes: 'M5 3h11v18H5zM8 7h5M8 10h5M8 13h3M19 5l2 2-6.5 8-3 1 1-3z',
  grain: 'M12 3a9 9 0 1 0 0 18zM12 3a9 9 0 0 1 0 18M14.5 8h2v2h-2zM17 12h2v2h-2zM14.5 15h2v2h-2zM8 8.5h.01M6.5 12h.01M8.5 15.5h.01M10 11h.01',
  thousand: 'M3 3h18v11H3zM6 11l3.5-3.5L12 10l2-2 4 3M3 17.5h18M3 20.5h12',
  silent: 'M3 4h18v16H3zM5.5 17l4.5-5.5 3 3 2.5-2.5 3.5 5M16 8a1.6 1.6 0 1 0 .01 0',
  dove: 'M3 13c4 0 6-3 8-6 1 3 3 5 7 5l3-2-1 4c-2 3-5 5-9 5-3 0-6-2-8-6zM11 7c0-2 1-3 3-4',
};

const isSignal = (p: TrophyPiece) => p.pillar === 'watchtower';
const isStone = (p: TrophyPiece) => p.pillar === 'perimeter' && ['testimony', 'deliverance'].includes(p.medium);
const isRelic = (p: TrophyPiece) => ['photograph', 'study', 'teardown'].includes(p.medium);
const isQuill = (p: TrophyPiece) => p.pillar === 'hearth' && ['fiction', 'prose'].includes(p.medium) && words(p.body) >= 1500;
const isLyre = (p: TrophyPiece) => p.medium === 'poetry';
// Photography
const metaOf = (p: TrophyPiece): PhotoMeta => p.photo_meta ?? p.photoMeta ?? {};
const isPhoto = (p: TrophyPiece) => p.medium === 'photograph';
// The forum
const fo = (c: TrophyCtx) => c.forum ?? { posts: 0, threads: 0, best_thread: 0, prayer: 0, boards: [] };
const isFilm = (p: TrophyPiece) => isPhoto(p) && metaOf(p).format === 'film';
const isDigital = (p: TrophyPiece) => isPhoto(p) && metaOf(p).format === 'digital';
const fullNotes = (p: TrophyPiece) => {
  const m = metaOf(p);
  return isPhoto(p) && !!m.format && ['camera', 'lens', 'settings', 'place', 'taken'].every((k) => (m[k as keyof PhotoMeta] ?? '').trim())
    && (m.format !== 'film' || !!m.film?.trim());
};
const cat = (f: (p: TrophyPiece) => boolean, b: number, si: number, g: number, r: number) =>
  ({ at: { bronze: b, silver: si, gold: g, rainbow: r }, count: (c: TrophyCtx) => count(c, f), earned: (c: TrophyCtx) => count(c, f) >= b });

export const TROPHIES: Trophy[] = [
  // Category trophies: they grow, bronze → silver → gold → rainbow
  { id: 'signal-fire', name: 'The Signal Fire', tier: 'bronze', glyph: G.beacon, unit: 'dispatches', note: 'For accepted cultural essays and secular audits in The Watchtower.', ...cat(isSignal, 1, 5, 15, 25) },
  { id: 'perimeter-stone', name: 'The Perimeter Stone', tier: 'bronze', glyph: G.standing, unit: 'testimonies', note: 'For raw, honest testimony and deliverance accounts shared in The Perimeter.', ...cat(isStone, 1, 3, 10, 20) },
  { id: 'stained-glass', name: 'The Stained Glass Relic', tier: 'bronze', glyph: G.lancet, unit: 'visual works', note: 'For published visual work: dark atmospheric photography, architectural studies, original design teardowns.', ...cat(isRelic, 3, 10, 20, 30) },
  { id: 'scribes-quill', name: 'The Scribe’s Quill', tier: 'bronze', glyph: G.quill, unit: 'long-form pieces', note: 'For long-form fiction and narrative prose (1,500 words or more) accepted into The Hearth.', ...cat(isQuill, 1, 5, 12, 25) },
  { id: 'lyre', name: 'The Lyre', tier: 'bronze', glyph: G.lyre, unit: 'poems', note: 'For poems published at the Guild.', ...cat(isLyre, 3, 10, 20, 30) },
  { id: 'darkroom', name: 'The Darkroom', tier: 'bronze', glyph: G.canister, unit: 'film photographs', note: 'For photographs made on film: loaded by hand, developed in the dark.', ...cat(isFilm, 1, 3, 8, 15) },
  { id: 'daylight-lens', name: 'The Daylight Lens', tier: 'bronze', glyph: G.camera, unit: 'digital photographs', note: 'For photographs made digitally: light caught and kept the moment it falls.', ...cat(isDigital, 1, 3, 8, 15) },
  { id: 'common-table', name: 'The Common Table', tier: 'bronze', glyph: G.talk, unit: 'forum posts', note: 'For keeping company in the Guild’s forum: every post and reply counts.', at: { bronze: 10, silver: 50, gold: 150, rainbow: 400 }, count: (c) => fo(c).posts, earned: (c) => fo(c).posts >= 10 },
  { id: 'open-door', name: 'The Open Door', tier: 'bronze', glyph: G.door, unit: 'threads started', note: 'For opening conversations in the forum.', at: { bronze: 1, silver: 5, gold: 15, rainbow: 40 }, count: (c) => fo(c).threads, earned: (c) => fo(c).threads >= 1 },
  // Time: they grow too, by themselves
  { id: 'years', name: 'Years at the Table', tier: 'bronze', glyph: G.table, unit: 'years at the table', note: 'For each year kept with the Guild since taking a seat.', at: { bronze: 1, silver: 2, gold: 3, rainbow: 5 }, count: yearsAt, earned: (c) => yearsAt(c) >= 1 },
  { id: 'unbroken', name: 'The Unbroken Flame', tier: 'bronze', glyph: G.ring, unit: 'months in a row', note: 'For publishing every month without a break: the longest run counts.', at: { bronze: 3, silver: 6, gold: 12, rainbow: 24 }, count: longestStreak, earned: (c) => longestStreak(c) >= 3 },
  // Won once
  { id: 'first-light', name: 'First Light', tier: 'bronze', glyph: G.candle, note: 'Published a first piece.', earned: (c) => c.pieces.length >= 1 },
  { id: 'sitter', name: 'The Sitter', tier: 'bronze', glyph: G.arch, note: 'Added a portrait to their page.', earned: (c) => !!(c.member.portrait_path || c.member.portrait) },
  { id: 'signed', name: 'Signed & Sealed', tier: 'bronze', glyph: G.signature, note: 'Wrote their craft and a few lines about themselves.', earned: (c) => !!(c.member.bio?.trim() && c.member.craft?.trim()) },
  { id: 'voice', name: 'Set in Stone', tier: 'silver', glyph: G.quotes, note: 'Set a line apart as a pull quote.', earned: (c) => has(c, (p) => /(^|\n)> /.test(p.body)) },
  { id: 'verse', name: 'Chapter & Verse', tier: 'silver', glyph: G.verse, note: 'Brought Scripture into a piece.', earned: (c) => has(c, (p) => /(^|\n)\+ /.test(p.body)) },
  { id: 'long-form', name: 'The Long Form', tier: 'silver', glyph: G.scroll, note: 'Published a piece of more than 2,000 words.', earned: (c) => has(c, (p) => words(p.body) > 2000) },
  { id: 'illuminated', name: 'The Illuminated Page', tier: 'gold', glyph: G.illumin, note: 'One piece with every mark of the craft: a heading, a pull quote, Scripture, italic and bold.', earned: (c) => has(c, (p) => /(^|\n)## /.test(p.body) && /(^|\n)> /.test(p.body) && /(^|\n)\+ /.test(p.body) && /\*\*[^*]+\*\*/.test(p.body) && /(^|[^*])\*[^*]+\*([^*]|$)/.test(p.body)) },
  { id: 'three-rooms', name: 'Three Rooms', tier: 'gold', glyph: G.arches, note: 'Published in all three pillars.', earned: (c) => ['watchtower', 'hearth', 'perimeter'].every((x) => has(c, (p) => p.pillar === x)) },
  { id: 'polymath', name: 'The Polymath', tier: 'gold', glyph: G.compass, note: 'Published four different kinds of work.', earned: (c) => kinds(c) >= 4 },
  { id: 'seasons', name: 'Every Season', tier: 'gold', glyph: G.hourglass, note: 'Published in four different months.', earned: (c) => months(c) >= 4 },
  // Photography, won once
  { id: 'let-it-speak', name: 'Let It Speak', tier: 'bronze', glyph: G.silent, note: 'Published a photograph with no words at all.', earned: (c) => has(c, (p) => isPhoto(p) && words(p.body) === 0) },
  { id: 'field-notes', name: 'Field Notes', tier: 'bronze', glyph: G.notes, note: 'Gave every detail behind the lens: digital or film, camera, lens, settings, where and when.', earned: (c) => has(c, fullNotes) },
  { id: 'contact-sheet', name: 'The Contact Sheet', tier: 'silver', glyph: G.frames, note: 'Published a photograph with all four smaller frames beneath it.', earned: (c) => has(c, (p) => isPhoto(p) && (p.gallery?.length ?? 0) >= 4) },
  { id: 'thousand-words', name: 'Worth a Thousand Words', tier: 'silver', glyph: G.thousand, note: 'Published a photograph with a thousand words or more beside it.', earned: (c) => has(c, (p) => isPhoto(p) && words(p.body) >= 1000) },
  { id: 'grain-and-pixel', name: 'Grain & Pixel', tier: 'gold', glyph: G.grain, note: 'Published photographs on film and digitally.', earned: (c) => has(c, isFilm) && has(c, isDigital) },
  // The forum, won once
  { id: 'first-word', name: 'First Word', tier: 'bronze', glyph: G.firstword, note: 'Spoke up in the forum for the first time.', earned: (c) => fo(c).posts >= 1 },
  { id: 'kindled', name: 'A Conversation Kindled', tier: 'silver', glyph: G.flame, note: 'Started a thread that drew ten replies or more.', earned: (c) => fo(c).best_thread >= 10 },
  { id: 'every-room', name: 'Every Room Visited', tier: 'silver', glyph: G.rooms, note: 'Posted in six different boards of the forum.', earned: (c) => fo(c).boards.length >= 6 },
  { id: 'burden-bearer', name: 'Burden Bearer', tier: 'gold', glyph: G.dove, note: 'Twenty-five posts of prayer and encouragement for the Guild.', earned: (c) => fo(c).prayer >= 25 },
  { id: 'founder', name: 'Founding Stone', tier: 'rainbow', glyph: G.rose, note: 'Took a seat in the Guild’s founding year.', earned: (c) => (c.member.created_at ?? '').startsWith('2026') },
  { id: 'keys', name: 'Keys of the House', tier: 'rainbow', glyph: G.keys, note: 'Keeps the house as its Editor in Chief.', earned: (c) => c.member.role === 'editor' },
  { id: 'living-stones', name: 'Living Stones', tier: 'rainbow', glyph: G.stones, note: 'Every category trophy raised to gold: built into a spiritual house.', earned: (c) => TROPHIES.filter((t) => t.count && t.at && !['years', 'unbroken', 'darkroom', 'daylight-lens', 'common-table', 'open-door'].includes(t.id)).every((t) => t.count!(c) >= t.at!.gold) },
];

const RANK: Record<Tier, number> = { rainbow: 4, gold: 3, silver: 2, bronze: 1 };
/** Earned trophies, finest first: by metal, then by how far a growing trophy has gone. */
export function finestFirst<T extends { tier: Tier; n: number }>(list: T[]) {
  return [...list].sort((a, b) => RANK[b.tier] - RANK[a.tier] || b.n - a.n);
}
/** "1 year at the table", "3 years at the table": the unit, made singular for one. */
const ONE: Record<string, string> = {
  dispatches: 'dispatch', testimonies: 'testimony', 'visual works': 'visual work', 'long-form pieces': 'long-form piece',
  poems: 'poem', 'film photographs': 'film photograph', 'digital photographs': 'digital photograph', 'forum posts': 'forum post', 'threads started': 'thread started', 'years at the table': 'year at the table', 'months in a row': 'month in a row',
};
export const unitFor = (n: number, unit = '') => (n === 1 ? ONE[unit] ?? unit : unit);
export const TIER_LABEL: Record<Tier, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', rainbow: 'Rainbow' };

/** Where a member stands with each trophy: earned or not, its metal now, and (for category trophies) the next metal. */
export function trophiesFor(c: TrophyCtx) {
  return TROPHIES.map((t) => {
    if (!t.count) return { trophy: t, earned: t.earned(c), tier: t.tier, n: 0, next: null as null | { tier: Tier; at: number } };
    const n = t.count(c), at = t.at ?? TIER_AT;
    const tier = [...TIER_ORDER].reverse().find((x) => n >= at[x]) ?? 'bronze';
    const nextTier = TIER_ORDER.find((x) => at[x] > n) ?? null;
    return { trophy: t, earned: n >= at.bronze, tier, n, next: nextTier ? { tier: nextTier, at: at[nextTier] } : null };
  });
}

// ---- drawing
// Each tier is a different made object, drawn at 80×80:
//   bronze  — a struck medal: beveled rim, a ring of engraved notches, a dark enamel field
//   silver  — a lancet window: keystone, sill and inner tracery, the emblem standing inside
//   gold    — a shield: three studs along the crest, a laurel wreath around the emblem
//   rainbow — a rose window: twelve petals of colored glass set in lead, ringed in gold
// The emblem itself is drawn in the tier's own metal, with a faint glow.

const METAL: Record<Tier, [string, string, string]> = {   // shadow, light, mid
  bronze: ['#5E3618', '#F0B67A', '#A3683A'],
  silver: ['#5E6873', '#FBFCFD', '#AEB8C3'],
  gold: ['#7A560C', '#FFF0B8', '#D2A23A'],
  rainbow: ['#7A560C', '#FFF0B8', '#D2A23A'],
};
const GLASS = ['#3E7BFF', '#5B6CFF', '#8A5BF0', '#B05BFF', '#E0457A', '#FF3B4E', '#FF7A3D', '#FFC44D', '#B6D94A', '#3DE0A0', '#2EC4C9', '#3EA0FF'];
const f = (n: number) => n.toFixed(2);
const polar = (r: number, deg: number) => [40 + r * Math.sin((deg * Math.PI) / 180), 40 - r * Math.cos((deg * Math.PI) / 180)];

function scallop(r: number, lobes = 16, depth = 2.4) {
  let d = '';
  for (let i = 0; i <= lobes * 10; i++) {
    const a = (i / (lobes * 10)) * 360;
    const rr = r - (depth * (1 - Math.cos(((a * lobes) * Math.PI) / 180))) / 2;
    const [x, y] = polar(rr, a);
    d += `${i ? 'L' : 'M'}${f(x)},${f(y)}`;
  }
  return d + 'Z';
}
function sector(r1: number, r2: number, a1: number, a2: number) {
  const [x1, y1] = polar(r2, a1), [x2, y2] = polar(r2, a2), [x3, y3] = polar(r1, a2), [x4, y4] = polar(r1, a1);
  return `M${f(x1)},${f(y1)}A${r2},${r2} 0 0 1 ${f(x2)},${f(y2)}L${f(x3)},${f(y3)}A${r1},${r1} 0 0 0 ${f(x4)},${f(y4)}Z`;
}
function ticks(r1: number, r2: number, n: number) {
  let d = '';
  for (let i = 0; i < n; i++) { const a = (i / n) * 360; const [x1, y1] = polar(r1, a), [x2, y2] = polar(r2, a); d += `M${f(x1)},${f(y1)}L${f(x2)},${f(y2)}`; }
  return d;
}
function laurel() {   // two sprays of leaves, rising from the base around the emblem
  let d = '';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const a = 180 + side * (28 + i * 17);              // degrees around the center, from the bottom up each side
      const [x, y] = polar(23.5, a);
      const rot = a + (side < 0 ? -55 : 55);
      d += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="3.1" ry="1.25" transform="rotate(${f(rot)} ${f(x)} ${f(y)})"/>`;
    }
  }
  return d;
}

/** The trophy as an SVG string (used by both the Astro pages and the members' app). */
export function trophySvg(t: Trophy, size = 76, as: Tier = t.tier): string {
  const [dk, lt, md] = METAL[as];
  const k = as;
  const defs = `<defs>`
    + `<linearGradient id="m-${k}" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="${lt}"/><stop offset=".45" stop-color="${md}"/><stop offset=".75" stop-color="${dk}"/><stop offset="1" stop-color="${md}"/></linearGradient>`
    + `<linearGradient id="s-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>`
    + `<linearGradient id="g-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${k === 'rainbow' ? '#fff' : lt}"/><stop offset="1" stop-color="${k === 'rainbow' ? '#FFE7A3' : md}"/></linearGradient>`
    + `<radialGradient id="c-tr" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#2C3226"/><stop offset=".7" stop-color="#11140F"/><stop offset="1" stop-color="#080A07"/></radialGradient>`
    + `<filter id="glow-${k}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
    + `</defs>`;
  const emblem = (x: number, y: number, sc: number, w = 1.15) =>
    `<g transform="translate(${x} ${y}) scale(${sc})" fill="none" stroke="url(#g-${k})" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-${k})"><path d="${t.glyph}"/></g>`;
  let body = '';
  if (k === 'bronze') {
    body = `<circle cx="40" cy="40" r="37" fill="url(#m-${k})"/>`
      + `<circle cx="40" cy="40" r="36.4" fill="none" stroke="url(#s-${k})" stroke-width="1.2"/>`
      + `<circle cx="40" cy="40" r="32.5" fill="none" stroke="${dk}" stroke-width="3.2" opacity=".55"/>`
      + `<path d="${ticks(31, 34, 60)}" stroke="${dk}" stroke-width=".9" opacity=".8"/>`
      + `<circle cx="40" cy="40" r="29" fill="${dk}"/><circle cx="40" cy="40" r="27.6" fill="url(#c-tr)"/>`
      + `<circle cx="40" cy="40" r="27.6" fill="none" stroke="${lt}" stroke-opacity=".25" stroke-width=".6"/>`
      + emblem(22, 22, 1.5);
  } else if (k === 'silver') {
    body = `<path d="M10 76V38a30 30 0 0 1 60 0v38Z" fill="url(#m-${k})"/>`
      + `<path d="M10.6 75V38a29.4 29.4 0 0 1 58.8 0" fill="none" stroke="url(#s-${k})" stroke-width="1.2"/>`
      + `<path d="M35.5 7.6h9l-1.6 6.6h-5.8Z" fill="${lt}" stroke="${dk}" stroke-width=".5"/>`
      + `<path d="M16.5 71V39a23.5 23.5 0 0 1 47 0v32Z" fill="${dk}"/>`
      + `<path d="M18 70V39a22 22 0 0 1 44 0v31Z" fill="url(#c-tr)"/>`
      + `<path d="M21.5 68V40a18.5 18.5 0 0 1 37 0v28" fill="none" stroke="${md}" stroke-opacity=".35" stroke-width=".6"/>`
      + `<path d="M6 72h68v5H6Z" fill="url(#m-${k})" stroke="${dk}" stroke-width=".5"/>`
      + emblem(22, 30, 1.5);
  } else if (k === 'gold') {
    body = `<path d="M40 5l30 10v20c0 20-13 32-30 40C23 67 10 55 10 35V15Z" fill="url(#m-${k})"/>`
      + `<path d="M40 5.8l29.2 9.7" fill="none" stroke="url(#s-${k})" stroke-width="1.4"/><path d="M40 5.8L10.8 15.5" fill="none" stroke="url(#s-${k})" stroke-width="1.4"/>`
      + `<circle cx="40" cy="5.4" r="2.2" fill="${lt}"/><circle cx="25" cy="10.2" r="1.5" fill="${lt}"/><circle cx="55" cy="10.2" r="1.5" fill="${lt}"/>`
      + `<path d="M40 12l23.5 8v15c0 15.5-10 25.5-23.5 32-13.5-6.5-23.5-16.5-23.5-32V20Z" fill="${dk}"/>`
      + `<path d="M40 13.6l22 7.4v14c0 14.5-9.3 23.8-22 30-12.7-6.2-22-15.5-22-30V21Z" fill="url(#c-tr)"/>`
      + `<g fill="${md}" opacity=".9">${laurel()}</g>`
      + emblem(25, 22, 1.25);
  } else {
    const petals = GLASS.map((col, i) => `<path d="${sector(14.5, 30.5, i * 30 + 1.6, (i + 1) * 30 - 1.6)}" fill="${col}" fill-opacity=".85"/>`).join('');
    const tracery = GLASS.map((_, i) => { const [x, y] = polar(22.5, i * 30 + 15); return `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".5"/>`; }).join('');
    body = `<path d="${scallop(37.5)}" fill="url(#m-${k})"/>`
      + `<path d="${scallop(37.5)}" fill="none" stroke="url(#s-${k})" stroke-width="1"/>`
      + `<circle cx="40" cy="40" r="32" fill="#141412"/>`
      + petals + tracery
      + `<circle cx="40" cy="40" r="32" fill="none" stroke="${md}" stroke-width="1"/>`
      + `<circle cx="40" cy="40" r="14.5" fill="#141412"/><circle cx="40" cy="40" r="13.2" fill="url(#c-tr)"/>`
      + `<circle cx="40" cy="40" r="32" fill="url(#s-${k})" opacity=".35"/>`
      + emblem(29.2, 29.2, 0.9, 1.4);
  }
  return `<svg class="tr-svg" width="${size}" height="${size}" viewBox="0 0 80 80" aria-hidden="true">${defs}${body}</svg>`;
}
