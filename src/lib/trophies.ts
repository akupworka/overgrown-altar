// Trophies: particular achievements, beside the prestiges (which count how much a member has published).
// Two kinds:
//   - category trophies GROW: the same trophy turns bronze, then silver, gold and rainbow as more pieces in its
//     category are published. Each has its own thresholds (bronze 1–3, silver 3–10, gold 10–20, rainbow 20–30);
//     the easier a kind of work is to make, the more pieces each metal takes.
//   - the other trophies are won once, at a fixed tier.
// Each trophy has its own emblem; its tier sets the shape and the metal:
//   bronze  = a round medal          silver = a cathedral-window arch
//   gold    = a shield               rainbow = a rose window in colored glass
// They are worked out from what the site already knows, so they update by themselves: published pieces, the
// member's page, and a tally the database keeps of their part in the Guild (the forum, the reflections and
// "stayed with me" they give and receive, Workshop notes, what they keep and whom they follow).
// Nothing here counts followers or ranks members against each other: the tally trophies are for what a member gives.

import type { PhotoMeta } from './photo';

export type Tier = 'bronze' | 'silver' | 'gold' | 'rainbow';
export interface TrophyPiece {
  pillar: string; medium: string; body: string; published_at: string | null;
  // Photography: the details behind the lens and the smaller photographs (named either way, from the Desk or the built site)
  photo_meta?: PhotoMeta | null; photoMeta?: PhotoMeta | null; gallery?: unknown[] | null;
}
export interface TrophyMember { portrait_path?: string | null; portrait?: string; bio?: string; craft?: string; role?: string; created_at?: string | null }
/** A member's part in the forum (public.forum_tallies): it only ever goes up, so trophies are never lost to cleared threads. */
export interface ForumTally {
  posts: number; threads: number; best_thread: number; prayer: number; boards: string[];
  // Beyond the forum (same row of public.forum_tallies; each is a high-water mark kept by the database):
  reflections_out?: number;   // reflections written on other members' pieces
  stayed_out?: number;        // "This stayed with me", said to other writers
  notes_out?: number;         // Workshop notes left on other members' drafts
  kept?: number;              // pieces saved or shelved
  following?: number;         // writers followed
  reflections_in?: number;    // reflections received
  stayed_in?: number;         // "This stayed with me", received
  answers?: number;           // readers' reflections answered
  shared?: number;            // own drafts brought to the Workshop
}
export interface TrophyCtx { pieces: TrophyPiece[]; member: TrophyMember; forum?: ForumTally | null }
export interface Trophy {
  id: string; name: string; tier: Tier; note: string; glyph: string; earned: (c: TrophyCtx) => boolean;
  count?: (c: TrophyCtx) => number;   // set for category trophies: how many pieces count toward it
  unit?: string;                      // what is counted, e.g. "dispatches"
  at?: Record<Tier, number>;          // category trophies: pieces needed for each metal (harder ones need more)
  craft?: boolean;                    // a kind of published work (these are the ones Living Stones asks for)
}
/** Category trophies: the piece count at which each metal is reached. */
export const TIER_AT: Record<Tier, number> = { bronze: 1, silver: 3, gold: 10, rainbow: 20 };
const TIER_ORDER: Tier[] = ['bronze', 'silver', 'gold', 'rainbow'];

const words = (s?: string | null) => { const t = (s ?? '').trim(); return t ? t.split(/\s+/).length : 0; };
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
  // The work, more of it
  hearth: 'M4 20V10l8-6 8 6v10M3 20h18M8.5 20v-5a3.5 3.5 0 0 1 7 0v5M12 13.2c.9 1 1.1 1.8 0 2.8-1.1-1-.9-1.8 0-2.8z',
  road: 'M3 11h18M8 11a4 4 0 0 1 8 0M9.5 21l1.7-10M14.5 21l-1.7-10M12 13.5v1.5M12 17v2M12 4.5V3M6.8 6.8l-1-1M17.2 6.8l1-1',
  inkwell: 'M6.5 11h9l2 9h-13zM8.5 11V8h5v3M5.5 15.5h11M13 9l6.5-6.5M17 3.5l2.5-1-1 2.5',
  // The company kept
  goodword: 'M4 5h16v11H10l-5 4v-4H4zM12 13.6s-3-1.8-3-3.8a1.6 1.6 0 0 1 3-.8 1.6 1.6 0 0 1 3 .8c0 2-3 3.8-3 3.8z',
  heart: 'M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.6a4.2 4.2 0 0 1 7.5 2.2C19.5 15.4 12 20 12 20z',
  anvil: 'M4 9h13c2 0 3 1 3.5 2.5H16c-.4 2-1.5 3.2-3 4V18h3v2.5H7V18h3v-2.5C7.5 14.5 5 12.5 4 9z',
  letter: 'M3 6h18v12H3zM3.5 6.5l8.5 7 8.5-7',
  answer: 'M4 4h16v11H11l-5 4v-4H4zM13.5 7L10.5 9.5l3 2.5M10.5 9.5h4a2 2 0 0 1 2 2v.5',
  blades: 'M5 4l11.5 11.5M19 4L7.5 15.5M14.5 17.5l3-3M9.5 17.5l-3-3M17.5 17.5l2 2M6.5 17.5l-2 2',
  // The rarest
  wheat: 'M12 21V7M12 7c-1.8-.8-2.8-2.2-2.8-4 1.8.3 2.8 1.4 2.8 3 0-1.6 1-2.7 2.8-3 0 1.8-1 3.2-2.8 4zM12 12c-2-.7-3.3-2-3.6-4M12 12c2-.7 3.3-2 3.6-4M12 16.5c-2-.7-3.3-2-3.6-4M12 16.5c2-.7 3.3-2 3.6-4',
  psalter: 'M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h12M12 7v6M9.5 9.5h5',
  roses: 'M12 4a3.2 3.2 0 1 0 .01 0M6.3 13.2a3.2 3.2 0 1 0 .01 0M17.7 13.2a3.2 3.2 0 1 0 .01 0',
  ten: 'M12 3a9 9 0 1 0 .01 0M8.5 8l7 8M15.5 8l-7 8',
};

/** The day the Guild opens its doors. The Founding Stone goes to everyone who takes a seat before that day or within
 *  three months after it. Until the day is set here (at launch, as '2027-01-31'), everyone who joins is a founder. */
export const GUILD_OPENED: string | null = null;
const FOUNDING_MONTHS = 3;
/** Did someone who joined on this day take a seat in time? (Before the opening counts: those are the first of all.) */
export const isFoundingMember = (joinedAt?: string | null, opened: string | null = GUILD_OPENED) => {
  const joined = Date.parse(joinedAt ?? '');
  if (!Number.isFinite(joined)) return false;
  if (!opened) return true;
  const until = new Date(`${opened}T00:00:00Z`); until.setUTCMonth(until.getUTCMonth() + FOUNDING_MONTHS);
  return joined < until.getTime();
};
const isFounder = (c: TrophyCtx) => isFoundingMember(c.member.created_at);

const isSignal = (p: TrophyPiece) => p.pillar === 'watchtower';
const isStone = (p: TrophyPiece) => p.pillar === 'perimeter' && ['testimony', 'deliverance'].includes(p.medium);
const isRelic = (p: TrophyPiece) => p.medium === 'photograph';
// Shorter work by the fire (the Scribe's Quill takes 1,500 words and more), and the Perimeter's other two kinds.
const isHearth = (p: TrophyPiece) => p.pillar === 'hearth' && ['fiction', 'prose'].includes(p.medium) && words(p.body) < 1500;
const isRoad = (p: TrophyPiece) => p.pillar === 'perimeter' && ['recovery', 'personal'].includes(p.medium);
const wordsIn = (c: TrophyCtx) => c.pieces.reduce((n, p) => n + words(p.body), 0);
const isQuill = (p: TrophyPiece) => p.pillar === 'hearth' && ['fiction', 'prose'].includes(p.medium) && words(p.body) >= 1500;
const isLyre = (p: TrophyPiece) => p.medium === 'poetry';
// Photography
const metaOf = (p: TrophyPiece): PhotoMeta => p.photo_meta ?? p.photoMeta ?? {};
const isPhoto = (p: TrophyPiece) => p.medium === 'photograph';
// The forum
const fo = (c: TrophyCtx): ForumTally => {
  const f = c.forum ?? ({} as Partial<ForumTally>);
  return { posts: Number(f.posts) || 0, threads: Number(f.threads) || 0, best_thread: Number(f.best_thread) || 0, prayer: Number(f.prayer) || 0, boards: Array.isArray(f.boards) ? f.boards : [] };
};
// Their part in the Guild beyond the forum (a number that is missing counts as none).
type Given = 'reflections_out' | 'stayed_out' | 'notes_out' | 'kept' | 'following' | 'reflections_in' | 'stayed_in' | 'answers' | 'shared';
const gv = (c: TrophyCtx, k: Given) => Math.max(0, Math.floor(Number(c.forum?.[k]) || 0));
const grow = (k: Given, b: number, si: number, g: number, r: number) =>
  ({ at: { bronze: b, silver: si, gold: g, rainbow: r }, count: (c: TrophyCtx) => gv(c, k), earned: (c: TrophyCtx) => gv(c, k) >= b });
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
  { id: 'signal-fire', name: 'The Signal Fire', tier: 'bronze', glyph: G.beacon, craft: true, unit: 'dispatches', note: 'For accepted cultural essays and secular audits in The Watchtower.', ...cat(isSignal, 1, 5, 15, 25) },
  { id: 'perimeter-stone', name: 'The Perimeter Stone', tier: 'bronze', glyph: G.standing, craft: true, unit: 'testimonies', note: 'For raw, honest testimony and deliverance accounts shared in The Perimeter.', ...cat(isStone, 1, 3, 10, 20) },
  { id: 'stained-glass', name: 'The Stained Glass Relic', tier: 'bronze', glyph: G.lancet, craft: true, unit: 'photographs', note: 'For published photographs: dark, atmospheric work in the Gallery.', ...cat(isRelic, 3, 10, 20, 30) },
  { id: 'scribes-quill', name: 'The Scribe’s Quill', tier: 'bronze', glyph: G.quill, craft: true, unit: 'long-form pieces', note: 'For long-form fiction and narrative prose (1,500 words or more) accepted into The Hearth.', ...cat(isQuill, 1, 5, 12, 25) },
  { id: 'lyre', name: 'The Lyre', tier: 'bronze', glyph: G.lyre, craft: true, unit: 'poems', note: 'For poems published at the Guild.', ...cat(isLyre, 3, 10, 20, 30) },
  { id: 'darkroom', name: 'The Darkroom', tier: 'bronze', glyph: G.canister, unit: 'film photographs', note: 'For photographs made on film: loaded by hand, developed in the dark.', ...cat(isFilm, 1, 3, 8, 15) },
  { id: 'daylight-lens', name: 'The Daylight Lens', tier: 'bronze', glyph: G.camera, unit: 'digital photographs', note: 'For photographs made digitally: light caught and kept the moment it falls.', ...cat(isDigital, 1, 3, 8, 15) },
  { id: 'common-table', name: 'The Common Table', tier: 'bronze', glyph: G.talk, unit: 'forum posts', note: 'For keeping company in the Guild’s forum: every post and reply counts.', at: { bronze: 10, silver: 50, gold: 150, rainbow: 400 }, count: (c) => fo(c).posts, earned: (c) => fo(c).posts >= 10 },
  { id: 'open-door', name: 'The Open Door', tier: 'bronze', glyph: G.door, unit: 'threads started', note: 'For opening conversations in the forum.', at: { bronze: 1, silver: 5, gold: 15, rainbow: 40 }, count: (c) => fo(c).threads, earned: (c) => fo(c).threads >= 1 },
  { id: 'hearthstone', name: 'The Hearthstone', tier: 'bronze', glyph: G.hearth, craft: true, unit: 'short pieces', note: 'For shorter prose and fiction (under 1,500 words) accepted into The Hearth.', ...cat(isHearth, 3, 10, 20, 30) },
  { id: 'road-back', name: 'The Road Back', tier: 'bronze', glyph: G.road, craft: true, unit: 'accounts', note: 'For recovery accounts and personal stories told in The Perimeter.', ...cat(isRoad, 1, 3, 10, 20) },
  { id: 'inkwell', name: 'The Inkwell', tier: 'bronze', glyph: G.inkwell, unit: 'words published', note: 'For every word published at the altar, in any room.', at: { bronze: 5000, silver: 25000, gold: 75000, rainbow: 200000 }, count: wordsIn, earned: (c) => wordsIn(c) >= 5000 },
  // The company kept: what a member gives to the others
  { id: 'good-word', name: 'The Good Word', tier: 'bronze', glyph: G.goodword, unit: 'reflections written', note: 'For reflections written to other writers about their work.', ...grow('reflections_out', 3, 15, 50, 150) },
  { id: 'amen', name: 'The Amen', tier: 'bronze', glyph: G.heart, unit: 'amens', note: 'For each time you told a writer their work stayed with you.', ...grow('stayed_out', 10, 50, 150, 400) },
  { id: 'workbench', name: 'The Workbench', tier: 'bronze', glyph: G.anvil, unit: 'workshop notes', note: 'For notes left on other members’ drafts in the Workshop.', ...grow('notes_out', 1, 5, 15, 40) },
  { id: 'readers-chair', name: 'The Reader’s Chair', tier: 'bronze', glyph: G.book, unit: 'pieces kept', note: 'For pieces and photographs saved or set on your shelves.', ...grow('kept', 5, 25, 75, 200) },
  // Time: they grow too, by themselves
  { id: 'years', name: 'Years at the Table', tier: 'bronze', glyph: G.table, unit: 'years at the table', note: 'For each year kept with the Guild after the first.', at: { bronze: 2, silver: 3, gold: 4, rainbow: 5 }, count: yearsAt, earned: (c) => yearsAt(c) >= 2 },
  { id: 'unbroken', name: 'The Unbroken Flame', tier: 'bronze', glyph: G.ring, unit: 'months in a row', note: 'For publishing every month without a break: the longest run counts.', at: { bronze: 3, silver: 6, gold: 12, rainbow: 24 }, count: longestStreak, earned: (c) => longestStreak(c) >= 3 },
  // Won once
  { id: 'first-light', name: 'First Light', tier: 'bronze', glyph: G.candle, note: 'Published a first piece.', earned: (c) => c.pieces.length >= 1 },
  { id: 'sitter', name: 'The Sitter', tier: 'bronze', glyph: G.arch, note: 'Added a portrait to their page.', earned: (c) => !!(c.member.portrait_path || c.member.portrait) },
  { id: 'signed', name: 'Signed & Sealed', tier: 'bronze', glyph: G.signature, note: 'Wrote their craft and a few lines about themselves.', earned: (c) => !!(c.member.bio?.trim() && c.member.craft?.trim()) },
  { id: 'voice', name: 'Set in Stone', tier: 'bronze', glyph: G.quotes, note: 'Set a line apart as a pull quote.', earned: (c) => has(c, (p) => /(^|\n)> /.test(p.body)) },
  { id: 'verse', name: 'Chapter & Verse', tier: 'bronze', glyph: G.verse, note: 'Brought Scripture into a piece.', earned: (c) => has(c, (p) => /(^|\n)\+ /.test(p.body)) },
  { id: 'long-form', name: 'The Long Form', tier: 'silver', glyph: G.scroll, note: 'Published a piece of more than 2,000 words.', earned: (c) => has(c, (p) => words(p.body) > 2000) },
  { id: 'illuminated', name: 'The Illuminated Page', tier: 'silver', glyph: G.illumin, note: 'One piece with every mark of the craft: a heading, a pull quote, Scripture, italic and bold.', earned: (c) => has(c, (p) => /(^|\n)## /.test(p.body) && /(^|\n)> /.test(p.body) && /(^|\n)\+ /.test(p.body) && /\*\*[^*]+\*\*/.test(p.body) && /(^|[^*])\*[^*]+\*([^*]|$)/.test(p.body)) },
  { id: 'three-rooms', name: 'Three Rooms', tier: 'gold', glyph: G.arches, note: 'Published in all three pillars.', earned: (c) => ['watchtower', 'hearth', 'perimeter'].every((x) => has(c, (p) => p.pillar === x)) },
  { id: 'polymath', name: 'The Polymath', tier: 'gold', glyph: G.compass, note: 'Published four different kinds of work.', earned: (c) => kinds(c) >= 4 },
  { id: 'seasons', name: 'Every Season', tier: 'gold', glyph: G.hourglass, note: 'Published in four different months.', earned: (c) => months(c) >= 4 },
  // Photography, won once
  { id: 'let-it-speak', name: 'Let It Speak', tier: 'bronze', glyph: G.silent, note: 'Published a photograph and kept its words to 150 or fewer.', earned: (c) => has(c, (p) => isPhoto(p) && words(p.body) <= 150) },
  { id: 'field-notes', name: 'Field Notes', tier: 'bronze', glyph: G.notes, note: 'Gave every detail behind the lens: digital or film, camera, lens, settings, where and when.', earned: (c) => has(c, fullNotes) },
  { id: 'contact-sheet', name: 'The Contact Sheet', tier: 'bronze', glyph: G.frames, note: 'Published a photograph with all four smaller frames beneath it.', earned: (c) => has(c, (p) => isPhoto(p) && (p.gallery?.length ?? 0) >= 4) },
  { id: 'thousand-words', name: 'Worth a Thousand Words', tier: 'silver', glyph: G.thousand, note: 'Published a photograph with a thousand words or more beside it.', earned: (c) => has(c, (p) => isPhoto(p) && words(p.body) >= 1000) },
  { id: 'grain-and-pixel', name: 'Grain & Pixel', tier: 'gold', glyph: G.grain, note: 'Published photographs on film and digitally.', earned: (c) => has(c, isFilm) && has(c, isDigital) },
  // The forum, won once
  { id: 'first-word', name: 'First Word', tier: 'bronze', glyph: G.firstword, note: 'Spoke up in the forum for the first time.', earned: (c) => fo(c).posts >= 1 },
  { id: 'kindled', name: 'A Conversation Kindled', tier: 'silver', glyph: G.flame, note: 'Started a thread that drew ten replies or more.', earned: (c) => fo(c).best_thread >= 10 },
  { id: 'every-room', name: 'Every Room Visited', tier: 'silver', glyph: G.rooms, note: 'Posted in six different boards of the forum.', earned: (c) => fo(c).boards.length >= 6 },
  { id: 'burden-bearer', name: 'Burden Bearer', tier: 'gold', glyph: G.dove, note: 'Twenty-five posts of prayer and encouragement for the Guild.', earned: (c) => fo(c).prayer >= 25 },
  // The company kept, won once
  { id: 'company', name: 'Company Kept', tier: 'bronze', glyph: G.witnesses, note: 'Follows five of the Guild’s writers.', earned: (c) => gv(c, 'following') >= 5 },
  { id: 'letter', name: 'A Letter at the Door', tier: 'bronze', glyph: G.letter, note: 'A reader wrote a reflection on one of their pieces.', earned: (c) => gv(c, 'reflections_in') >= 1 },
  { id: 'writer-answers', name: 'The Writer Answers', tier: 'bronze', glyph: G.answer, note: 'Answered a reader’s reflection.', earned: (c) => gv(c, 'answers') >= 1 },
  { id: 'iron', name: 'Iron Sharpens Iron', tier: 'bronze', glyph: G.blades, note: 'Brought a draft to the Workshop for another member’s notes.', earned: (c) => gv(c, 'shared') >= 1 },
  { id: 'light-left-on', name: 'A Light Left On', tier: 'gold', glyph: G.lantern, note: 'Twenty-five times, a reader said their work stayed with them.', earned: (c) => gv(c, 'stayed_in') >= 25 },
  { id: 'founder', name: 'Founding Stone', tier: 'rainbow', glyph: G.rose, note: 'Took a seat in the Guild’s first three months.', earned: isFounder },
  { id: 'keys', name: 'Keys of the House', tier: 'rainbow', glyph: G.keys, note: 'Keeps the house as one of its editors.', earned: (c) => ['editor', 'staff'].includes(c.member.role ?? '') },
  { id: 'living-stones', name: 'Living Stones', tier: 'rainbow', glyph: G.stones, note: 'Every trophy for a kind of published work raised to gold: built into a spiritual house.', earned: (c) => TROPHIES.filter((t) => t.craft).every((t) => t.count!(c) >= t.at!.gold) },
  { id: 'encouragement', name: 'Son of Encouragement', tier: 'rainbow', glyph: G.shield, note: 'The Good Word, The Amen and The Workbench all raised to gold.', earned: (c) => ['good-word', 'amen', 'workbench'].every((id) => { const t = TROPHIES.find((x) => x.id === id)!; return t.count!(c) >= t.at!.gold; }) },
  // The rarest: years of work, or all of it
  { id: 'lion', name: 'Bold as a Lion', tier: 'rainbow', glyph: G.shield, note: 'Fifteen dispatches published in The Watchtower.', earned: (c) => count(c, isSignal) >= 15 },
  { id: 'crown', name: 'The Hearth Crown', tier: 'rainbow', glyph: G.flame, note: 'Forty pieces of prose, poetry and fiction published in The Hearth.', earned: (c) => count(c, (p) => p.pillar === 'hearth' && !isPhoto(p)) >= 40 },
  { id: 'serpent', name: 'The Serpent Underfoot', tier: 'rainbow', glyph: G.shield, note: 'Forty pieces published in The Perimeter: the serpent slain.', earned: (c) => count(c, (p) => p.pillar === 'perimeter') >= 40 },
  { id: 'hundredfold', name: 'The Hundredfold', tier: 'rainbow', glyph: G.wheat, note: 'A hundred pieces published: seed that fell on good ground.', earned: (c) => c.pieces.length >= 100 },
  { id: 'psalter', name: 'The Psalter', tier: 'rainbow', glyph: G.psalter, note: 'A hundred and fifty poems published: a psalter of their own.', earned: (c) => count(c, isLyre) >= 150 },
  { id: 'three-windows', name: 'Three Windows', tier: 'rainbow', glyph: G.roses, note: 'Three of the growing trophies raised all the way to rainbow glass.', earned: (c) => TROPHIES.filter((t) => t.count && t.at && t.count(c) >= t.at.rainbow).length >= 3 },
  { id: 'year', name: 'A Year at the Table', tier: 'rainbow', glyph: G.ten, note: 'Twelve months kept with the Guild.', earned: (c) => yearsAt(c) >= 1 },
  { id: 'cathedral', name: 'The Cathedral', tier: 'rainbow', glyph: G.tower, note: 'Every other trophy won, the Founding Stone and the Keys aside.', earned: (c) => TROPHIES.filter((t) => !['cathedral', 'founder', 'keys'].includes(t.id)).every((t) => t.earned(c)) },
];

/** The catalogue's shelves: every trophy sits on one (anything not named falls to the last). */
export const TROPHY_GROUPS: { name: string; ids: string[] }[] = [
  { name: 'The work', ids: ['signal-fire', 'perimeter-stone', 'road-back', 'scribes-quill', 'hearthstone', 'lyre', 'inkwell', 'first-light', 'voice', 'verse', 'long-form', 'illuminated', 'three-rooms', 'polymath', 'seasons'] },
  { name: 'Photography', ids: ['stained-glass', 'darkroom', 'daylight-lens', 'let-it-speak', 'field-notes', 'contact-sheet', 'thousand-words', 'grain-and-pixel'] },
  { name: 'The company kept', ids: ['common-table', 'open-door', 'good-word', 'amen', 'workbench', 'readers-chair', 'sitter', 'signed', 'first-word', 'company', 'letter', 'writer-answers', 'iron', 'kindled', 'every-room', 'burden-bearer', 'light-left-on'] },
  { name: 'Faithfulness', ids: ['years', 'unbroken'] },
  { name: 'The rarest', ids: ['founder', 'keys', 'living-stones', 'encouragement', 'lion', 'crown', 'serpent', 'three-windows', 'hundredfold', 'psalter', 'year', 'cathedral'] },
];
export const groupOf = (t: Trophy) => TROPHY_GROUPS.find((g) => g.ids.includes(t.id))?.name ?? TROPHY_GROUPS[TROPHY_GROUPS.length - 1].name;

/** A member who has won everything, for the Editor in Chief's preview ("everything won"): nothing is saved anywhere,
 *  it is only a made-up record handed to the same code that works out everyone's trophies. */
export function showcaseCtx(member: TrophyMember = {}): TrophyCtx {
  const body = (n: number) => Array(n).fill('word').join(' ');
  const pieces: TrophyPiece[] = [];
  const add = (n: number, pillar: string, medium: string, words: number, extra: (i: number) => Partial<TrophyPiece> = () => ({})) => {
    const b = body(words); for (let i = 0; i < n; i++) pieces.push({ pillar, medium, body: b, published_at: null, ...extra(i) }); };
  add(150, 'hearth', 'poetry', 80);
  add(24, 'watchtower', 'essay', 4000);
  pieces.push({ pillar: 'watchtower', medium: 'essay', published_at: null, body: `## A heading\n> A line set apart\n+ In the beginning was the Word\n*italic* and **bold** ${body(4000)}` });
  add(20, 'perimeter', 'testimony', 700); add(10, 'perimeter', 'recovery', 700); add(10, 'perimeter', 'personal', 700);
  add(25, 'hearth', 'fiction', 2500); add(30, 'hearth', 'prose', 300);
  const notes = { camera: 'Leica M6', lens: '35mm f/2', settings: 'f/2.8', place: 'Ely', taken: '2026' };
  add(15, 'hearth', 'photograph', 120, (i) => ({ photo_meta: { format: 'film', film: 'HP5', ...notes }, gallery: i === 0 ? [1, 2, 3, 4] : [] }));
  add(14, 'hearth', 'photograph', 120, () => ({ photo_meta: { format: 'digital', ...notes } }));
  add(1, 'hearth', 'photograph', 1000, () => ({ photo_meta: { format: 'digital', ...notes } }));
  // spread over the last thirty months, every month, so the flame is unbroken
  const now = new Date();
  pieces.forEach((p, i) => { const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1 - (i % 30), 10)); p.published_at = d.toISOString(); });
  const joined = new Date(Date.UTC(now.getUTCFullYear() - 6, now.getUTCMonth(), 1)).toISOString();
  return {
    pieces,
    member: { ...member, portrait: member.portrait || 'set', bio: member.bio || 'set', craft: member.craft || 'set', role: 'editor', created_at: joined },
    forum: { posts: 400, threads: 40, best_thread: 12, prayer: 25, boards: ['a', 'b', 'c', 'd', 'e', 'f'], reflections_out: 150, stayed_out: 400, notes_out: 40, kept: 200, following: 12, reflections_in: 30, stayed_in: 120, answers: 9, shared: 4 },
  };
}

const RANK: Record<Tier, number> = { rainbow: 4, gold: 3, silver: 2, bronze: 1 };
/** Earned trophies, finest first: by metal, then the one-of-a-kind rarest before the rest, then by how far a growing trophy has gone. */
export function finestFirst<T extends { tier: Tier; n: number; trophy?: Trophy }>(list: T[]) {
  const rare = (x: T) => (x.trophy && RARE[x.trophy.id] ? 1 : 0);
  return [...list].sort((a, b) => RANK[b.tier] - RANK[a.tier] || rare(b) - rare(a) || b.n - a.n);
}
/** "1 year at the table", "3 years at the table": the unit, made singular for one. */
const ONE: Record<string, string> = {
  dispatches: 'dispatch', testimonies: 'testimony', 'visual works': 'visual work', 'long-form pieces': 'long-form piece',
  poems: 'poem', photographs: 'photograph', 'short pieces': 'short piece', accounts: 'account', 'words published': 'word published',
  'reflections written': 'reflection written', amens: 'amen', 'workshop notes': 'workshop note', 'pieces kept': 'piece kept', 'film photographs': 'film photograph', 'digital photographs': 'digital photograph', 'forum posts': 'forum post', 'threads started': 'thread started', 'years at the table': 'year at the table', 'months in a row': 'month in a row',
};
export const unitFor = (n: number, unit = '') => (n === 1 ? ONE[unit] ?? unit : unit);
/** Counts as people read them: 25,000, and (for the small labels under each metal) 25k. */
export const num = (n: number) => n.toLocaleString('en-US');
export const numShort = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(n % 1000 ? 1 : 0)}k` : String(n));
export const TIER_LABEL: Record<Tier, string> = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', rainbow: 'Rainbow' };
/** The small label under a trophy. Only the trophies that grow have metals to climb; one won once says so, whatever it is cast in
 *  (its metal shows how hard it was, but there is no silver or gold of it to reach). */
export const tierLabel = (t: Trophy, tier: Tier = t.tier) => (t.count ? TIER_LABEL[tier] : 'Won once');

/** Where a member stands with each trophy: earned or not, its metal now, and (for category trophies) the next metal. */
export function trophiesFor(ctx: TrophyCtx) {
  // A piece approved for a later day does not count until that day comes.
  const now = Date.now();
  const c: TrophyCtx = { ...ctx, member: ctx.member ?? {}, pieces: (ctx.pieces ?? []).filter((p) => !p.published_at || !(Date.parse(p.published_at) > now)) };
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
// Everything is drawn into the SVG itself (the shadow beneath, the halo behind gold and rainbow, and the dark iron of
// a trophy still to earn): CSS filters on these are drawn as boxes by iPhone Safari, as they were on the crests.

const METAL: Record<Tier, [string, string, string]> = {   // shadow, light, mid
  bronze: ['#5E3618', '#F0B67A', '#A3683A'],
  silver: ['#5E6873', '#FBFCFD', '#AEB8C3'],
  gold: ['#7A560C', '#FFF0B8', '#D2A23A'],
  rainbow: ['#7A560C', '#FFF0B8', '#D2A23A'],
};
const IRON: [string, string, string] = ['#17191B', '#6F757C', '#3A3E43'];   // a trophy still to earn
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

// The rarest trophies are each one of a kind: drawn on the same 80×80 field as the rest, in the same gold and glass,
// but every one has a shape nothing else in the vault has. (Still to earn, each is the same shape in dark iron.)
// They are meant to be quiet and fine, not loud: deep jewel glass that is lit from above and darkens toward its foot,
// two or three colours to a piece, thin leading, and gold that is engraved rather than piled on.
//   Founding Stone        a sunburst, a ring of glass turning in it, a cut cornerstone with glass at its heart
//   Keys of the House     a great pointed doorway of sapphire and ruby lights, two keys crossed before it
//   Living Stones         a castle of gold masonry, seven lit windows (one for each kind of work), a pennant on each tower
//   Son of Encouragement  a heart of ruby glass, a flame kept at its centre
//   Bold as a Lion        a lion's face cut in facets of gold, its mane a blaze of amber and ruby
//   The Hearth Crown      a crown of five lancet points over a jewelled band
//   The Serpent Underfoot a shield of sapphire glass, the serpent slain across it, a sword driven through
//   Three Windows         a triptych: three lancets side by side
//   The Hundredfold       a mandorla of harvest glass, an ear of wheat standing in it
//   The Psalter           an open book whose pages are glass
//   A Year at the Table   a chalice of gold set with glass, twelve lights in an arc over it, one for every month
//   The Cathedral         the west front itself: two spires, a lit door, the rose window turning
type RareCtx = { k: string; dk: string; lt: string; md: string; glass: string[]; locked: boolean; still: boolean };
const LEAD = '#101210', NIGHT = '#0A0C0A';
// Jewel glass, in the same order of hues as GLASS: sapphire, indigo, violet, purple, rose, ruby, vermilion, amber, olive, emerald, teal, azure.
const JEWEL = ['#2152C4', '#3A42BE', '#6638C2', '#8432B0', '#B22C66', '#BC2432', '#C2521C', '#D69C2A', '#8AA230', '#1D9A66', '#1A8A92', '#2872C6'];
const pts = (n: number, r: (i: number) => number, off = 0) => Array.from({ length: n }, (_, i) => polar(r(i), off + (i * 360) / n).map(f).join(',')).join(' ');
const turning = (c: RareCtx, inner: string) => (c.locked || c.still ? inner : `<g class="tr-turn">${inner}</g>`);
const gold = (c: RareCtx, d: string) => `<path d="${d}" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".4" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="url(#s-${c.k})" stroke-width=".8" stroke-linejoin="round"/>`;
// A pane of glass: its colour, then the light in it (bright at the head, deep at the foot), then its leading.
const pane = (c: RareCtx, d: string, col: string, extra = '') => `<path d="${d}" fill="${col}"${extra}/><path d="${d}" fill="url(#gl-${c.k})" stroke="${LEAD}" stroke-width=".8" stroke-linejoin="round"${extra}/>`;
const poly = (c: RareCtx, p: string, col: string) => `<polygon points="${p}" fill="${col}"/><polygon points="${p}" fill="url(#gl-${c.k})" stroke="${LEAD}" stroke-width=".8" stroke-linejoin="round"/>`;
const bands = (c: RareCtx, cols: string[], x0: number, x1: number, y0: number, y1: number) => { const h = (y1 - y0) / cols.length;
  return cols.map((col, i) => pane(c, `M${x0} ${f(y0 + i * h)}H${x1}V${f(y0 + (i + 1) * h)}H${x0}Z`, col)).join(''); };
// A body that tapers (a serpent): cubic curves end to end, with a half-width that changes along the way.
function ribbon(segs: number[][], w: (t: number) => number, n = 14) {
  const P: number[][] = [];
  segs.forEach((q, si) => { for (let i = si ? 1 : 0; i <= n; i++) { const t = i / n, u = 1 - t;
    P.push([u * u * u * q[0] + 3 * u * u * t * q[2] + 3 * u * t * t * q[4] + t * t * t * q[6], u * u * u * q[1] + 3 * u * u * t * q[3] + 3 * u * t * t * q[5] + t * t * t * q[7]]); } });
  const L: string[] = [], R: string[] = [], last = P.length - 1;
  P.forEach((pt, i) => { const a = P[Math.max(0, i - 1)], b = P[Math.min(last, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, hw = w(i / last);
    L.push(`${f(pt[0] - (dy / d) * hw)},${f(pt[1] + (dx / d) * hw)}`); R.unshift(`${f(pt[0] + (dy / d) * hw)},${f(pt[1] - (dx / d) * hw)}`); });
  return { outline: [...L, ...R].join(' '), spine: 'M' + P.map((pt) => `${f(pt[0])},${f(pt[1])}`).join('L'), end: P[last], angle: (Math.atan2(P[last][1] - P[last - 2][1], P[last][0] - P[last - 2][0]) * 180) / Math.PI };
}
// Gold line-work. (Its gradient is measured against the whole field, not the line's own box: a perfectly upright or
// level line has a box with no width, and a gradient measured against that draws nothing at all.)
const line = (c: RareCtx, d: string, w = 1, extra = '') => `<path d="${d}" fill="none" stroke="url(#gu-${c.k})" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const engrave = (c: RareCtx, d: string, w = 0.4, o = 0.5) => `<path d="${d}" fill="none" stroke="${c.dk}" stroke-opacity="${o}" stroke-width="${w}" stroke-linecap="round"/>`;
const shadow = (d: string, o = 0.2) => `<path d="${d}" fill="#000" fill-opacity="${o}"/>`;

const RARE: Record<string, (c: RareCtx) => string> = {
  founder: (c) => {
    const burst = pts(32, (i) => (i % 2 ? 31.6 : i % 4 ? 35.4 : 39));          // long and short rays, turn about
    const ring = c.glass.map((col, i) => pane(c, sector(21.6, 28.6, i * 30 + 1.2, (i + 1) * 30 - 1.2), col)).join('');
    const hexO = Array.from({ length: 6 }, (_, i) => polar(18.4, i * 60)), hexI = Array.from({ length: 6 }, (_, i) => polar(9.6, i * 60));
    // Six facets, lit from the upper left: the two that face the light are bright, the two that face away are dark.
    const shade = c.locked ? ['#565B61', '#3A3E43', '#24272A', '#1B1D20', '#2C2F33', '#474B50'] : [c.lt, c.md, c.dk, '#5A3D06', c.md, '#FFF7D6'];
    const facets = hexO.map((o, i) => { const o2 = hexO[(i + 1) % 6], i1 = hexI[i], i2 = hexI[(i + 1) % 6];
      return `<path d="M${f(o[0])},${f(o[1])}L${f(o2[0])},${f(o2[1])}L${f(i2[0])},${f(i2[1])}L${f(i1[0])},${f(i1[1])}Z" fill="${shade[i]}" stroke="${c.dk}" stroke-width=".45" stroke-linejoin="round"/>`; }).join('');
    const heart = hexI.map((a, i) => { const b = hexI[(i + 1) % 6];
      return `<path d="M40,40L${f(a[0])},${f(a[1])}L${f(b[0])},${f(b[1])}Z" fill="${c.glass[(i * 2 + 1) % 12]}" stroke="${LEAD}" stroke-width=".7" stroke-linejoin="round"/>`; }).join('');
    return `<polygon points="${burst}" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".4" stroke-linejoin="round"/>`
      + `<polygon points="${burst}" fill="none" stroke="url(#s-${c.k})" stroke-width=".9" stroke-linejoin="round"/>`
      + engrave(c, Array.from({ length: 16 }, (_, i) => { const a = i * 22.5, r1 = polar(30.8, a), r2 = polar(i % 2 ? 34.2 : 37.6, a); return `M${f(r1[0])},${f(r1[1])}L${f(r2[0])},${f(r2[1])}`; }).join(''), 0.45, 0.55)
      + `<circle cx="40" cy="40" r="30.2" fill="${LEAD}"/>` + turning(c, ring)
      + `<circle cx="40" cy="40" r="30.2" fill="none" stroke="${c.md}" stroke-width=".9"/>`
      + `<circle cx="40" cy="40" r="20.2" fill="${NIGHT}" stroke="${c.md}" stroke-width=".7"/>`
      + facets + heart
      + `<polygon points="${pts(6, () => 18.4)}" fill="none" stroke="${c.lt}" stroke-opacity=".7" stroke-width=".6" stroke-linejoin="round"/>`
      + `<polygon points="${pts(8, (i) => (i % 2 ? 1.5 : 5.6))}" fill="${c.locked ? '#6F757C' : '#FFFBEA'}" filter="url(#glow-${c.k})"/>`;
  },
  keys: (c) => {
    const inner = 'M19.5 70V37A28 28 0 0 1 40 11.5A28 28 0 0 1 60.5 37V70Z', g = c.glass;
    const lights = [g[0], g[5], g[0], g[5], g[0]].map((col, i) => pane(c, `M${f(19.5 + i * 8.2)} 9H${f(27.7 + i * 8.2)}V47H${f(19.5 + i * 8.2)}Z`, col) + pane(c, `M${f(19.5 + i * 8.2)} 47H${f(27.7 + i * 8.2)}V72H${f(19.5 + i * 8.2)}Z`, col)).join('');
    const key = `<circle cx="40" cy="26.5" r="4.6"/><circle cx="40" cy="26.5" r="1.3"/><path d="M40 31.2V65.4M37.8 33.4h4.4M40 56.6h5.2v3.2h-2.4v2.6h2.4v3H40"/>`;
    const pair = (stroke: string, w: number) => `<g fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"><g transform="rotate(33 40 46)">${key}</g><g transform="rotate(-33 40 46) translate(80 0) scale(-1 1)">${key}</g></g>`;
    return `<clipPath id="cl-${c.k}"><path d="${inner}"/></clipPath>`
      + gold(c, 'M14 74V36A34 34 0 0 1 40 5A34 34 0 0 1 66 36V74Z') + `<path d="${inner}" fill="${LEAD}"/>`
      + `<g clip-path="url(#cl-${c.k})">${lights}</g>`
      + `<path d="${inner}" fill="none" stroke="${c.lt}" stroke-opacity=".55" stroke-width=".5"/>`
      + gold(c, 'M9 71.5H71V77.5H9Z') + pair(c.dk, 3.9) + pair(`url(#g-${c.k})`, 1.9);
  },
  'living-stones': (c) => {
    const g = c.glass;
    const flag = (x: number) => line(c, `M${x} 14.2V3.2`, 1) + `<path d="M${x} 3.6L${x + 7.4} 6L${x} 8.4Z" fill="${g[5]}" stroke="${c.dk}" stroke-width=".4" stroke-linejoin="round"/>`;
    const slit = (x: number, y: number, w: number, h: number, col: string) => pane(c, `M${f(x - w)} ${y + h}V${f(y + w)}a${w} ${w} 0 0 1 ${f(w * 2)} 0V${y + h}Z`, col);
    // Courses of stone in running bond: level beds every 6, upright joints every 8, each course shifted half a stone.
    const bond = (x0: number, x1: number, y0: number, y1: number) => { let d = '';
      for (let y = y0, r = 0; y < y1; y += 6, r++) { if (r) d += `M${x0} ${y}H${x1}`; for (let x = x0 + (r % 2 ? 4 : 8); x < x1 - 0.5; x += 8) d += `M${x} ${y}V${Math.min(y1, y + 6)}`; }
      return d; };
    const courses = bond(8.6, 23.4, 20, 72) + bond(56.6, 71.4, 20, 72) + bond(24.6, 55.4, 36, 72);
    const ringStones = Array.from({ length: 7 }, (_, i) => { const a = -90 + i * 30, r1 = [40 + 6.9 * Math.sin((a * Math.PI) / 180), 56 - 6.9 * Math.cos((a * Math.PI) / 180)], r2 = [40 + 9.3 * Math.sin((a * Math.PI) / 180), 56 - 9.3 * Math.cos((a * Math.PI) / 180)];
      return `M${f(r1[0])},${f(r1[1])}L${f(r2[0])},${f(r2[1])}`; }).join('');
    return flag(16) + flag(64)
      + gold(c, 'M8 74V14H12V18H14V14H18V18H20V14H24V30H28V34H31V30H35V34H38V30H42V34H45V30H49V34H52V30H56V14H60V18H62V14H66V18H68V14H72V74Z')
      + shadow('M16 14H18V18H20V14H24V72H16Z', 0.14) + shadow('M64 14H66V18H68V14H72V72H64Z', 0.14) + shadow('M24 34H56V37H24Z', 0.16)
      + engrave(c, courses, 0.35, 0.42) + engrave(c, 'M8.4 20H23.6M56.4 20H71.6M24.4 36H55.6', 0.6, 0.6)
      + slit(16, 41, 2.3, 12, g[0]) + slit(16, 56, 2.3, 10, g[0]) + slit(64, 41, 2.3, 12, g[0]) + slit(64, 56, 2.3, 10, g[0])
      + slit(31, 39, 1.7, 7, g[11]) + slit(40, 38, 1.7, 8, g[11]) + slit(49, 39, 1.7, 7, g[11])
      + `<path d="M30.7 72V56A9.3 9.3 0 0 1 49.3 56V72Z" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".4"/>` + engrave(c, ringStones + 'M30.9 62H33.4M30.9 67H33.4M46.6 62H49.1M46.6 67H49.1', 0.4, 0.6)
      + pane(c, 'M33.5 72V56A6.5 6.5 0 0 1 46.5 56V72Z', g[7])
      + `<path d="M36.6 51V72M40 49.6V72M43.4 51V72M33.8 57h12.4M33.8 62h12.4M33.8 67h12.4" fill="none" stroke="${LEAD}" stroke-width=".8"/>`
      + gold(c, 'M4 72H76V77.5H4Z');
  },
  encouragement: (c) => {
    const H = 'M40 72C22 58 8 46 8 29.5A16.5 16.5 0 0 1 40 22A16.5 16.5 0 0 1 72 29.5C72 46 58 58 40 72Z', inset = 'translate(40 44) scale(.84) translate(-40 -44)', g = c.glass;
    const wedges = [g[5], g[4], g[5], g[4], g[5], g[4], g[5], g[4]].map((col, i) => pane(c, sector(0, 60, i * 45 + 22.5, (i + 1) * 45 + 22.5), col, ' transform="translate(0 2)"')).join('');
    return `<clipPath id="cl-${c.k}"><path d="${H}" transform="${inset}"/></clipPath>`
      + gold(c, H) + `<path d="${H}" transform="${inset}" fill="${LEAD}"/>`
      + `<g clip-path="url(#cl-${c.k})">${wedges}</g>`
      + `<path d="${H}" transform="${inset}" fill="none" stroke="${c.lt}" stroke-opacity=".55" stroke-width=".6"/>`
      + `<circle cx="40" cy="42" r="10.2" fill="${NIGHT}" stroke="url(#m-${c.k})" stroke-width="1.3"/>`
      + line(c, Array.from({ length: 24 }, (_, i) => { const a = (i * 15 * Math.PI) / 180; return `M${f(40 + 7.9 * Math.sin(a))},${f(42 - 7.9 * Math.cos(a))}L${f(40 + 9 * Math.sin(a))},${f(42 - 9 * Math.cos(a))}`; }).join(''), 0.35, ' stroke-opacity=".8"')
      + `<g transform="translate(29.8 32) scale(.85)"><path d="${G.flame}" fill="url(#g-${c.k})" stroke="${c.dk}" stroke-width=".5" stroke-linejoin="round" filter="url(#glow-${c.k})"/></g>`;
  },
  lion: (c) => {
    const g = c.glass, cy = 40;
    const at = (r: number, deg: number) => [40 + r * Math.sin((deg * Math.PI) / 180), cy - r * Math.cos((deg * Math.PI) / 180)].map(f).join(',');
    const N = 18, long = (i: number) => (i % 2 ? 33.5 : 38.4);
    const rim = Array.from({ length: N }, (_, i) => { const a = (i * 360) / N; return `${at(29.5, a - 10)} ${at(long(i) + 1.4, a)} ${at(29.5, a + 10)}`; }).join(' ');
    const mane = Array.from({ length: N }, (_, i) => { const a = (i * 360) / N;
      const p = `${at(14, a - 8.5)} ${at(28.6, a - 8.2)} ${at(long(i), a)} ${at(28.6, a + 8.2)} ${at(14, a + 8.5)}`;
      return `<polygon points="${p}" fill="${i % 2 ? g[5] : g[7]}"/><polygon points="${p}" fill="url(#gl-${c.k})" stroke="${LEAD}" stroke-width=".55" stroke-linejoin="round"/>`
        + `<path d="M${at(17, a)}L${at(long(i) - 3.4, a)}" stroke="${LEAD}" stroke-opacity=".38" stroke-width=".4"/>`; }).join('');
    // The face, cut like a stone: facets of gold, lit from the upper left (the far side a shade deeper).
    const S = c.locked ? ['#6F757C', '#565B61', '#3F4348', '#2C2F33', '#202326', '#17191B'] : ['#FFF6D2', '#F4D680', '#D8AA42', '#B08220', '#84600F', '#5A3D06'];
    const F: [string, number][] = [
      ['40,21 31,22.5 35.5,30.5 40,31', 1], ['31,22.5 25.5,30 28.5,34.2 35.5,30.5', 2], ['31,22.5 24.6,15.8 25.5,30', 3], ['29.4,22.6 26.2,19 26.6,26.4', 5],
      ['25.5,30 24,41 30,37.2 28.5,34.2', 3], ['40,31 35.5,30.5 35.8,36.6 37.4,39.5 36.4,46.5 40,46.5', 0],
      ['24,41 29.5,52.5 36.4,46.5 37.4,39.5 34.6,39 30,37.2', 2], ['36.4,46.5 29.5,52.5 35,59.5 40,56.5 40,51.5', 1], ['35,59.5 40,62.5 40,56.5', 3],
    ];
    const side = (far: boolean) => `<g${far ? ' transform="translate(80 0) scale(-1 1)"' : ''}>`
      + F.map(([p, sh]) => `<polygon points="${p}" fill="${S[Math.min(5, sh + (far ? 1 : 0))]}" stroke="${c.dk}" stroke-width=".35" stroke-linejoin="round"/>`).join('')
      + `<polygon points="28.5,34.2 35.8,36.6 34.6,39 30,37.2" fill="${NIGHT}"/><polygon points="31.6,35.9 34.4,36.9 33.6,38 31.4,37.3" fill="${c.locked ? '#565B61' : g[7]}"/>`
      + `<polygon points="36.4,46.5 40,46.5 40,51.5" fill="${NIGHT}"/></g>`;
    return `<polygon points="${rim}" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".4" stroke-linejoin="round"/>` + mane + side(false) + side(true)
      + `<path d="M40 51.5V54.4M40 54.4c-1.6 1.6-3.6 1.8-5.2 1M40 54.4c1.6 1.6 3.6 1.8 5.2 1" fill="none" stroke="${c.dk}" stroke-width=".8" stroke-linecap="round"/>`
      + `<g fill="${c.dk}" fill-opacity=".75"><circle cx="34.2" cy="51.4" r=".42"/><circle cx="32.6" cy="50" r=".42"/><circle cx="33.4" cy="53.2" r=".42"/><circle cx="45.8" cy="51.4" r=".42"/><circle cx="47.4" cy="50" r=".42"/><circle cx="46.6" cy="53.2" r=".42"/></g>`;
  },
  crown: (c) => {
    const g = c.glass;
    const point = (x: number, top: number, col: string) => { const a = `M${x - 4.6} 58V${top + 9.5}A9.6 9.6 0 0 1 ${x} ${top}A9.6 9.6 0 0 1 ${x + 4.6} ${top + 9.5}V58Z`, b = `M${x - 2.6} 58V${top + 10.2}A8 8 0 0 1 ${x} ${top + 4}A8 8 0 0 1 ${x + 2.6} ${top + 10.2}V58Z`;
      return gold(c, a) + pane(c, b, col) + `<circle cx="${x}" cy="${f(top - 2.1)}" r="2" fill="${c.locked ? '#565B61' : '#FFF8E4'}" stroke="${c.dk}" stroke-width=".45"/>`; };
    const gem = (x: number, r: number, col: string) => `<circle cx="${x}" cy="65" r="${f(r + 0.9)}" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".4"/><circle cx="${x}" cy="65" r="${r}" fill="${col}"/><circle cx="${x}" cy="65" r="${r}" fill="url(#gl-${c.k})"/>`;
    const beads = (y: number) => Array.from({ length: 19 }, (_, i) => `<circle cx="${f(13 + i * 3)}" cy="${y}" r=".62"/>`).join('');
    const lean = (x: number, deg: number, inner: string) => `<g transform="rotate(${deg} ${x} 58)">${inner}</g>`;
    const pearl = (x: number, y: number) => line(c, `M${x} 54V${y + 1.4}`, 0.8) + `<circle cx="${x}" cy="${y}" r="1.5" fill="${c.locked ? '#565B61' : '#FFF8E4'}" stroke="${c.dk}" stroke-width=".4"/>`;
    return pearl(22, 47.5) + pearl(34, 44.5) + pearl(46, 44.5) + pearl(58, 47.5)
      + lean(16, -9, point(16, 34, g[0])) + lean(64, 9, point(64, 34, g[0])) + lean(28, -4, point(28, 25, g[0])) + lean(52, 4, point(52, 25, g[0])) + point(40, 15, g[5])
      + gold(c, 'M9.6 52.6H70.4V58.4H9.6Z') + engrave(c, 'M10 55.5H70', 0.4, 0.5)
      + gold(c, 'M10.5 58H69.5V72.5H10.5Z')
      + `<g fill="${c.lt}" fill-opacity=".85">${beads(60.2)}${beads(70.3)}</g>`
      + gem(18, 2, g[9]) + gem(29, 2, g[0]) + gem(40, 2.9, g[5]) + gem(51, 2, g[0]) + gem(62, 2, g[9])
      + engrave(c, 'M23.5 62.6v4.8M34.5 62.6v4.8M45.5 62.6v4.8M56.5 62.6v4.8', 0.4, 0.5);
  },
  serpent: (c) => {
    const g = c.glass, SH = 'M40 77C24 69 11 56 11 36V14L40 5L69 14V36C69 56 56 69 40 77Z', inset = 'translate(40 41) scale(.86) translate(-40 -41)';
    // The serpent, slain: a heavy body thrown in loops across the field, thinning to the tail, the head hanging.
    const sn = ribbon([[15.5, 41, 18.5, 31.5, 26.5, 31, 30.5, 40], [30.5, 40, 33.5, 47.5, 34, 57.5, 41, 58], [41, 58, 48.5, 58.5, 48.5, 47.5, 54.5, 46.5], [54.5, 46.5, 59.5, 45.8, 63.4, 49, 62.2, 54.5]],
      (t) => 0.35 + 3.1 * Math.min(1, t * 2.4) - 0.5 * Math.max(0, (t - 0.8) * 5));
    const steel = c.locked ? ['#565B61', '#2C2F33'] : ['#FFFFFF', '#AEB8C3'], scale = c.locked ? '#3A3E43' : '#0E5A3C';
    const head = `<g transform="translate(${f(sn.end[0])} ${f(sn.end[1])}) rotate(${f(sn.angle)})">`
      + `<path d="M11 0h2.4M13.4 0l1.8-1.4M13.4 0l1.8 1.4" fill="none" stroke="${g[5]}" stroke-width=".7" stroke-linecap="round"/>`
      + poly(c, '-1.6,-2.5 1,-3.6 3.6,-4.2 6.2,-3.6 9,-2.2 11,-1 11.6,0 11,1 9,2.2 6.2,3.6 3.6,4.2 1,3.6 -1.6,2.5', g[9])
      + `<path d="M3.2,-2.4l2 1.5M5.2,-2.4l-2 1.5" stroke="${LEAD}" stroke-width=".6" stroke-linecap="round"/><path d="M7.4 1.9L11 .5" stroke="${LEAD}" stroke-width=".5" stroke-linecap="round"/></g>`;
    return `<clipPath id="cl-${c.k}"><path d="${SH}" transform="${inset}"/></clipPath>`
      + `<linearGradient id="st-${c.k}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${steel[0]}"/><stop offset=".5" stop-color="${steel[0]}"/><stop offset=".5" stop-color="${steel[1]}"/><stop offset="1" stop-color="${steel[1]}"/></linearGradient>`
      + gold(c, SH) + `<path d="${SH}" transform="${inset}" fill="${LEAD}"/>`
      + `<g clip-path="url(#cl-${c.k})">${pane(c, 'M8 4H40V41H8Z', g[0])}${pane(c, 'M40 4H72V41H40Z', g[1])}${pane(c, 'M8 41H40V78H8Z', g[1])}${pane(c, 'M40 41H72V78H40Z', g[0])}</g>`
      + `<path d="${SH}" transform="${inset}" fill="none" stroke="${c.lt}" stroke-opacity=".55" stroke-width=".6"/>`
      + poly(c, sn.outline, g[9])
      + `<clipPath id="sn-${c.k}"><polygon points="${sn.outline}"/></clipPath>`
      + `<path d="${sn.spine}" fill="none" stroke="${scale}" stroke-width="8" stroke-dasharray="1 2.5" stroke-opacity=".6" clip-path="url(#sn-${c.k})"/>`
      + `<polygon points="${sn.outline}" fill="none" stroke="${LEAD}" stroke-width=".8" stroke-linejoin="round"/>`
      + head
      // the sword
      + `<path d="M38 23H42L41.1 61.5L40 67L38.9 61.5Z" fill="url(#st-${c.k})" stroke="${c.dk}" stroke-width=".5" stroke-linejoin="round"/>`
      + `<path d="M40 24.5V52" stroke="${c.dk}" stroke-opacity=".45" stroke-width=".45" stroke-linecap="round"/>`
      + gold(c, 'M30 19.8C33 18.6 37 19.6 40 19.6S47 18.6 50 19.8L50.6 22.6C47 21.8 43 22.8 40 22.8S33 21.8 29.4 22.6Z')
      + `<path d="M38.5 11.6H41.5V19.6H38.5Z" fill="${c.dk}" stroke="${c.md}" stroke-width=".5"/><path d="M38.5 13.6h3M38.5 15.6h3M38.5 17.6h3" stroke="${c.md}" stroke-width=".45"/>`
      + `<circle cx="40" cy="9.2" r="3" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".5"/><circle cx="40" cy="9.2" r="1.3" fill="${g[5]}"/>`;
  },
  'three-windows': (c) => {
    const g = c.glass;
    const A = 'M9.8 71V38.5A17 17 0 0 1 17 25.5A17 17 0 0 1 24.2 38.5V71Z', B = 'M31.8 71V30.5A21 21 0 0 1 40 13A21 21 0 0 1 48.2 30.5V71Z', C = 'M55.8 71V38.5A17 17 0 0 1 63 25.5A17 17 0 0 1 70.2 38.5V71Z';
    const win = (id: string, d: string, inside: string) => `<clipPath id="cl-${c.k}-${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${LEAD}"/><g clip-path="url(#cl-${c.k}-${id})">${inside}</g><path d="${d}" fill="none" stroke="${c.lt}" stroke-opacity=".5" stroke-width=".5"/>`;
    const eye = (x: number, y: number, col: string) => `<circle cx="${x}" cy="${y}" r="3.5" fill="${LEAD}"/><circle cx="${x}" cy="${y}" r="2.7" fill="${col}"/><circle cx="${x}" cy="${y}" r="2.7" fill="url(#gl-${c.k})"/><circle cx="${x}" cy="${y}" r="3.1" fill="none" stroke="url(#gu-${c.k})" stroke-width=".7"/>`;
    const mullion = (x: number, y: number) => `<path d="M${x} ${y}V71" stroke="${LEAD}" stroke-width="1"/>`;
    return gold(c, 'M7 74V38A20 20 0 0 1 17 21A20 20 0 0 1 27 38V74Z') + gold(c, 'M29 74V30A24 24 0 0 1 40 8A24 24 0 0 1 51 30V74Z') + gold(c, 'M53 74V38A20 20 0 0 1 63 21A20 20 0 0 1 73 38V74Z')
      + win('a', A, bands(c, [g[11], g[0], g[11], g[0]], 9, 25, 25, 72) + mullion(17, 37)) + win('b', B, bands(c, [g[4], g[5], g[4], g[5], g[4]], 31, 49, 12, 72) + mullion(40, 28)) + win('c', C, bands(c, [g[11], g[0], g[11], g[0]], 55, 71, 25, 72) + mullion(63, 37))
      + eye(17, 33.4, g[5]) + eye(40, 23.6, g[0]) + eye(63, 33.4, g[5]) + gold(c, 'M4 71.5H76V77.5H4Z') + engrave(c, 'M4.6 74.4H75.4', 0.4, 0.45);
  },
  hundredfold: (c) => {
    const V = 'M40 3C58 18 62 30 62 40S58 62 40 77C22 62 18 50 18 40S22 18 40 3Z', inset = 'translate(40 40) scale(.85) translate(-40 -40)', g = c.glass;
    const grain = (x: number, y: number, rot: number) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="4.2" transform="rotate(${rot} ${x} ${y})"/>`;
    const ear = grain(40, 17, 0) + Array.from({ length: 6 }, (_, j) => grain(36.8, 23.4 + j * 5.4, -32) + grain(43.2, 23.4 + j * 5.4, 32)).join('');
    const stem = 'M40 22V68M40 62c-3.6-1-6-3.6-6.6-7M40 66c3.6-1 6-3.6 6.6-7M40 12.6V6.5M37.8 18l-2.6-6M42.2 18l2.6-6';
    return `<clipPath id="cl-${c.k}"><path d="${V}" transform="${inset}"/></clipPath>`
      + gold(c, V) + `<path d="${V}" transform="${inset}" fill="${LEAD}"/>`
      + `<g clip-path="url(#cl-${c.k})">${bands(c, [g[9], g[9], g[8], g[7], g[7], g[6]], 16, 64, 8, 72)}</g>`
      + `<path d="${V}" transform="${inset}" fill="none" stroke="${c.lt}" stroke-opacity=".55" stroke-width=".6"/>`
      + `<path d="${stem}" fill="none" stroke="${c.dk}" stroke-width="2.2" stroke-linecap="round"/>` + line(c, stem, 1)
      + `<g fill="url(#g-${c.k})" stroke="${c.dk}" stroke-width=".5">${ear}</g>`;
  },
  psalter: (c) => {
    const g = c.glass, L = 'M38.6 21.5C32 17 20 16 9 19.5V60C20 56.5 32 57.5 38.6 62Z', R = 'M41.4 21.5C48 17 60 16 71 19.5V60C60 56.5 48 57.5 41.4 62Z';
    const page = (id: string, d: string, inside: string) => `<clipPath id="cl-${c.k}-${id}"><path d="${d}"/></clipPath><path d="${d}" fill="${LEAD}"/><g clip-path="url(#cl-${c.k}-${id})">${inside}</g><path d="${d}" fill="none" stroke="${c.lt}" stroke-opacity=".5" stroke-width=".5"/>`;
    return gold(c, 'M40 23.5C32 17.5 18 16 5 20.5V66C18 61.5 32 62.5 40 68.5C48 62.5 62 61.5 75 66V20.5C62 16 48 17.5 40 23.5Z')
      + page('a', L, bands(c, [g[0], g[1], g[0]], 8, 39, 15, 63)) + page('b', R, bands(c, [g[0], g[1], g[0]], 41, 72, 15, 63))
      + engrave(c, 'M7 63.4C18 59.4 31 60.2 39 65.4M73 63.4C62 59.4 49 60.2 41 65.4M6.4 64.9C18 61 31 61.8 39.4 67M73.6 64.9C62 61 49 61.8 40.6 67', 0.35, 0.55)
      + line(c, 'M40 22V65', 1.7)
      + `<path d="M38.4 64V76.5l1.6-2.1 1.6 2.1V64Z" fill="${g[5]}" stroke="${c.dk}" stroke-width=".45" stroke-linejoin="round"/>`
      + line(c, 'M24 29.5v10M20.6 33h6.8', 1.3) + line(c, 'M16 46.5h16M16 51h16M49 31.5h15M49 36h15M49 40.5h15M49 46.5h15M49 51h10', 0.75, ' stroke-opacity=".85"');
  },
  year: (c) => {
    const g = c.glass;
    // Twelve lights in an arc over the cup, one for each month: lozenges of glass in gold settings, the middle ones a little larger.
    const years = Array.from({ length: 12 }, (_, i) => { const a = -66 + i * 12, r = 29, x = 40 + r * Math.sin((a * Math.PI) / 180), y = 39 - r * Math.cos((a * Math.PI) / 180), k = 1 - Math.abs(i - 5.5) * 0.045, w = 1.9 * k, h = 3.1 * k;
      const d = `M0 ${f(-h)}L${f(w)} 0L0 ${f(h)}L${f(-w)} 0Z`, set = `M0 ${f(-h - 0.9)}L${f(w + 0.8)} 0L0 ${f(h + 0.9)}L${f(-w - 0.8)} 0Z`;
      return `<g transform="translate(${f(x)} ${f(y)}) rotate(${a})"><path d="${set}" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".35" stroke-linejoin="round"/><path d="${d}" fill="${i % 2 ? g[0] : g[5]}"/><path d="${d}" fill="url(#gl-${c.k})" stroke="${LEAD}" stroke-width=".5" stroke-linejoin="round"/></g>`; }).join('');
    const arch = (x: number, top: number, col: string) => pane(c, `M${x - 2.1} 44V${top + 2.1}a2.1 2.1 0 0 1 4.2 0V44Z`, col);
    const gem = (x: number, y: number, r: number, col: string) => `<circle cx="${x}" cy="${y}" r="${f(r + 0.8)}" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".35"/><circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#gl-${c.k})"/>`;
    return years
      // the cup
      + gold(c, 'M21.5 30C21.5 44.5 30 51.5 37.4 52.6H42.6C50 51.5 58.5 44.5 58.5 30Z')
      + shadow('M40 30H58.5C58.5 44.5 50 51.5 42.6 52.6H40Z', 0.14)
      + arch(34, 35.2, g[0]) + arch(40, 34.4, g[5]) + arch(46, 35.2, g[0]) + gem(28.2, 38.2, 1.5, g[9]) + gem(51.8, 38.2, 1.5, g[9])
      + engrave(c, 'M22.6 33.2C28 35.4 52 35.4 57.4 33.2M27.4 45.6C32 47.4 48 47.4 52.6 45.6', 0.4, 0.55)
      + `<ellipse cx="40" cy="30" rx="18.5" ry="3.5" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".4"/>`
      + `<ellipse cx="40" cy="30.2" rx="16.2" ry="2.5" fill="${g[5]}"/><ellipse cx="40" cy="30.2" rx="16.2" ry="2.5" fill="url(#gl-${c.k})" stroke="${LEAD}" stroke-width=".5"/>`
      + `<ellipse cx="40" cy="30" rx="18.5" ry="3.5" fill="none" stroke="url(#s-${c.k})" stroke-width=".7"/>`
      // the stem, its knop, the foot
      + gold(c, 'M37.6 52.4H42.4L41.5 57.6H38.5Z')
      + `<ellipse cx="40" cy="60" rx="6.2" ry="3.3" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".4"/>` + gem(40, 60, 1.5, g[5]) + engrave(c, 'M35.4 58.4v3.2M44.6 58.4v3.2', 0.4, 0.5)
      + gold(c, 'M38.4 62.6H41.6L43 67.6C46.4 70.6 53.2 71.8 56 74.8H24C26.8 71.8 33.6 70.6 37 67.6Z')
      + engrave(c, 'M40 63V74.4M34 70.4L30.4 74.4M46 70.4L49.6 74.4', 0.4, 0.5)
      + gold(c, 'M21.5 74.6H58.5V78H21.5Z');
  },
  cathedral: (c) => {
    const g = c.glass, rose = Array.from({ length: 8 }, (_, i) => pane(c, sector(2.8, 8.4, i * 45 + 1.5, (i + 1) * 45 - 1.5), i % 2 ? g[5] : g[0])).join('');
    return gold(c, 'M8 74V31L17 9L26 31V35L40 19L54 35V31L63 9L72 31V74Z')
      + shadow('M17 9L26 31V72H17Z', 0.16) + shadow('M63 9L72 31V72H63Z', 0.16) + shadow('M40 19L54 35V38H40Z', 0.1)
      + line(c, 'M17 2.5V9M14.8 5h4.4M63 2.5V9M60.8 5h4.4', 1)
      + engrave(c, 'M8.4 31H25.6M54.4 31H71.6M8.6 45.5H25.4M54.6 45.5H71.4M8.6 68.5H25.4M54.6 68.5H71.4M26.4 35.2H31.4M48.6 35.2H53.6M26.6 52.5H53.4M17 9.4V31M63 9.4V31', 0.4, 0.5)
      + pane(c, 'M36.6 29.4V26.2a1.2 1.2 0 0 1 2.4 0V29.4Z', g[11]) + pane(c, 'M41 29.4V26.2a1.2 1.2 0 0 1 2.4 0V29.4Z', g[11])
      + `<circle cx="40" cy="41" r="10.6" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".4"/><circle cx="40" cy="41" r="9.4" fill="${LEAD}"/>`
      + `<g transform="translate(0 1)">` + turning(c, rose) + `</g>`
      + `<circle cx="40" cy="41" r="9.1" fill="none" stroke="${c.lt}" stroke-opacity=".7" stroke-width=".5"/><circle cx="40" cy="41" r="2" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".3"/>`
      + pane(c, 'M13.8 66V50a3.2 3.2 0 0 1 6.4 0V66Z', g[0]) + pane(c, 'M59.8 66V50a3.2 3.2 0 0 1 6.4 0V66Z', g[0])
      + pane(c, 'M15 42V35.6a2 2 0 0 1 4 0V42Z', g[11]) + pane(c, 'M61 42V35.6a2 2 0 0 1 4 0V42Z', g[11])
      + `<path d="M32.6 72V62.6A8.6 8.6 0 0 1 40 54A8.6 8.6 0 0 1 47.4 62.6V72Z" fill="url(#m-${c.k})" stroke="${c.dk}" stroke-width=".4"/>`
      + pane(c, 'M34.6 72V62.8A6.6 6.6 0 0 1 40 56.4A6.6 6.6 0 0 1 45.4 62.8V72Z', g[7]) + `<path d="M40 57V72" stroke="${LEAD}" stroke-width=".8"/>` + engrave(c, 'M36.4 64.5h2.2M41.4 64.5h2.2M36.4 68.5h2.2M41.4 68.5h2.2', 0.45, 0.7)
      + gold(c, 'M6 72H74V75H6Z') + gold(c, 'M3.5 74.8H76.5V78H3.5Z');
  },
};

/** The trophy as an SVG string (used by both the Astro pages and the members' app). */
export function trophySvg(t: Trophy, size = 76, as: Tier = t.tier, locked = false, still = false): string {
  const [dk, lt, md] = locked ? IRON : METAL[as];
  const k = locked ? `${as}-l` : as;
  const halo = locked ? '' : as === 'rainbow' ? '#B05BFF' : as === 'gold' ? '#E7C35A' : '';
  const defs = `<defs>`
    + `<linearGradient id="m-${k}" x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stop-color="${lt}"/><stop offset=".45" stop-color="${md}"/><stop offset=".75" stop-color="${dk}"/><stop offset="1" stop-color="${md}"/></linearGradient>`
    + `<linearGradient id="s-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>`
    + `<linearGradient id="g-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${k === 'rainbow' ? '#fff' : lt}"/><stop offset="1" stop-color="${k === 'rainbow' ? '#FFE7A3' : md}"/></linearGradient>`
    + (RARE[t.id] ? `<linearGradient id="gu-${k}" gradientUnits="userSpaceOnUse" x1="10" y1="6" x2="70" y2="74"><stop offset="0" stop-color="${lt}"/><stop offset="1" stop-color="${md}"/></linearGradient>` : '')
    + (RARE[t.id] ? `<linearGradient id="gl-${k}" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="${locked ? 0.08 : 0.34}"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${locked ? 0.2 : 0.42}"/></linearGradient>` : '')
    + `<radialGradient id="sh-${k}"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".6" stop-color="#000" stop-opacity=".22"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`
    + (halo ? `<radialGradient id="h-${k}"><stop offset=".55" stop-color="${halo}" stop-opacity=".34"/><stop offset=".8" stop-color="${halo}" stop-opacity=".12"/><stop offset="1" stop-color="${halo}" stop-opacity="0"/></radialGradient>` : '')
    + `<radialGradient id="c-tr" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#2C3226"/><stop offset=".7" stop-color="#11140F"/><stop offset="1" stop-color="#080A07"/></radialGradient>`
    + `<filter id="glow-${k}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
    + `</defs>`;
  const emblem = (x: number, y: number, sc: number, w = 1.15) =>
    `<g transform="translate(${x} ${y}) scale(${sc})" fill="none" stroke="url(#g-${k})" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow-${k})"><path d="${t.glyph}"/></g>`;
  let body = '';
  // The rarest are each one of a kind (see RARE).
  if (RARE[t.id]) return `<svg class="tr-svg${locked ? ' tr-iron' : ''}" width="${size}" height="${size}" viewBox="0 0 80 80" overflow="visible" aria-hidden="true">${defs}`
    + `<ellipse cx="40" cy="80" rx="31" ry="9" fill="url(#sh-${k})"/>` + (halo ? `<circle cx="40" cy="40" r="54" fill="url(#h-${k})"/>` : '')
    + RARE[t.id]({ k, dk, lt, md, locked, still, glass: locked ? JEWEL.map((_, i) => (i % 2 ? '#2B2E31' : '#202326')) : JEWEL }) + `</svg>`;
  // Beneath and behind: a soft shadow on the ground, and for gold and rainbow a halo of their own light.
  const under = `<ellipse cx="40" cy="80" rx="31" ry="9" fill="url(#sh-${k})"/>` + (halo ? `<circle cx="40" cy="40" r="52" fill="url(#h-${k})"/>` : '');
  const glass = locked ? GLASS.map((_, i) => (i % 2 ? '#2B2E31' : '#202326')) : GLASS;
  if (as === 'bronze') {
    body = `<circle cx="40" cy="40" r="37" fill="url(#m-${k})"/>`
      + `<circle cx="40" cy="40" r="36.4" fill="none" stroke="url(#s-${k})" stroke-width="1.2"/>`
      + `<circle cx="40" cy="40" r="32.5" fill="none" stroke="${dk}" stroke-width="3.2" opacity=".55"/>`
      + `<path d="${ticks(31, 34, 60)}" stroke="${dk}" stroke-width=".9" opacity=".8"/>`
      + `<circle cx="40" cy="40" r="29" fill="${dk}"/><circle cx="40" cy="40" r="27.6" fill="url(#c-tr)"/>`
      + `<circle cx="40" cy="40" r="27.6" fill="none" stroke="${lt}" stroke-opacity=".25" stroke-width=".6"/>`
      + emblem(22, 22, 1.5);
  } else if (as === 'silver') {
    body = `<path d="M10 76V38a30 30 0 0 1 60 0v38Z" fill="url(#m-${k})"/>`
      + `<path d="M10.6 75V38a29.4 29.4 0 0 1 58.8 0" fill="none" stroke="url(#s-${k})" stroke-width="1.2"/>`
      + `<path d="M35.5 7.6h9l-1.6 6.6h-5.8Z" fill="${lt}" stroke="${dk}" stroke-width=".5"/>`
      + `<path d="M16.5 71V39a23.5 23.5 0 0 1 47 0v32Z" fill="${dk}"/>`
      + `<path d="M18 70V39a22 22 0 0 1 44 0v31Z" fill="url(#c-tr)"/>`
      + `<path d="M21.5 68V40a18.5 18.5 0 0 1 37 0v28" fill="none" stroke="${md}" stroke-opacity=".35" stroke-width=".6"/>`
      + `<path d="M6 72h68v5H6Z" fill="url(#m-${k})" stroke="${dk}" stroke-width=".5"/>`
      + emblem(22, 30, 1.5);
  } else if (as === 'gold') {
    body = `<path d="M40 5l30 10v20c0 20-13 32-30 40C23 67 10 55 10 35V15Z" fill="url(#m-${k})"/>`
      + `<path d="M40 5.8l29.2 9.7" fill="none" stroke="url(#s-${k})" stroke-width="1.4"/><path d="M40 5.8L10.8 15.5" fill="none" stroke="url(#s-${k})" stroke-width="1.4"/>`
      + `<circle cx="40" cy="5.4" r="2.2" fill="${lt}"/><circle cx="25" cy="10.2" r="1.5" fill="${lt}"/><circle cx="55" cy="10.2" r="1.5" fill="${lt}"/>`
      + `<path d="M40 12l23.5 8v15c0 15.5-10 25.5-23.5 32-13.5-6.5-23.5-16.5-23.5-32V20Z" fill="${dk}"/>`
      + `<path d="M40 13.6l22 7.4v14c0 14.5-9.3 23.8-22 30-12.7-6.2-22-15.5-22-30V21Z" fill="url(#c-tr)"/>`
      + `<g fill="${md}" opacity=".9">${laurel()}</g>`
      + emblem(25, 22, 1.25);
  } else {
    const petals = glass.map((col, i) => `<path d="${sector(14.5, 30.5, i * 30 + 1.6, (i + 1) * 30 - 1.6)}" fill="${col}" fill-opacity=".85"/>`).join('');
    const tracery = GLASS.map((_, i) => { const [x, y] = polar(22.5, i * 30 + 15); return `<circle cx="${f(x)}" cy="${f(y)}" r="2.6" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width=".5"/>`; }).join('');
    body = `<path d="${scallop(37.5)}" fill="url(#m-${k})"/>`
      + `<path d="${scallop(37.5)}" fill="none" stroke="url(#s-${k})" stroke-width="1"/>`
      + `<circle cx="40" cy="40" r="32" fill="#141412"/>`
      + (!locked && !still ? `<g class="tr-turn">${petals}${tracery}</g>` : petals + tracery)   // a rose window's glass turns, very slowly; rim, emblem and shadow stay still
      + `<circle cx="40" cy="40" r="32" fill="none" stroke="${md}" stroke-width="1"/>`
      + `<circle cx="40" cy="40" r="14.5" fill="#141412"/><circle cx="40" cy="40" r="13.2" fill="url(#c-tr)"/>`
      + `<circle cx="40" cy="40" r="32" fill="url(#s-${k})" opacity=".35"/>`
      + emblem(29.2, 29.2, 0.9, 1.4);
  }
  return `<svg class="tr-svg${locked ? ' tr-iron' : ''}" width="${size}" height="${size}" viewBox="0 0 80 80" overflow="visible" aria-hidden="true">${defs}${under}${body}</svg>`;
}
