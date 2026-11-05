// Photography submissions: one photograph, and (if the photographer likes) the details behind it.
// Kept on the piece as photo_meta (a small JSON object); every field is optional.
export interface PhotoMeta { format?: 'digital' | 'film' | ''; camera?: string; lens?: string; film?: string; settings?: string; place?: string; taken?: string }
export const LENS_FIELDS: { key: Exclude<keyof PhotoMeta, 'format'>; label: string; hint: string; filmOnly?: boolean }[] = [
  { key: 'camera', label: 'Camera', hint: 'e.g. Leica M6, iPhone 15, Canon AE-1' },
  { key: 'lens', label: 'Lens', hint: 'e.g. 35mm f/2' },
  { key: 'film', label: 'Film stock', hint: 'e.g. Kodak Portra 400, Ilford HP5', filmOnly: true },
  { key: 'settings', label: 'Settings', hint: 'e.g. f/2.8 · 1/60 · ISO 400' },
  { key: 'place', label: 'Where', hint: 'e.g. Ely Cathedral, England' },
  { key: 'taken', label: 'When', hint: 'e.g. Advent, 2025' },
];
/** The details worth showing, in order, as [label, value]. */
export function lensRows(meta: PhotoMeta | null | undefined): [string, string][] {
  const m = meta ?? {};
  const rows: [string, string][] = [];
  if (m.format === 'film' || m.format === 'digital') rows.push(['Format', m.format === 'film' ? 'Film' : 'Digital']);
  for (const f of LENS_FIELDS) {
    if (f.filmOnly && m.format !== 'film') continue;
    const v = (m[f.key] ?? '').trim(); if (v) rows.push([f.label, v]);
  }
  return rows;
}

/** Up to four more photographs, shown smaller beneath the main one (pieces.gallery). Kept in the public media bucket. */
export interface GalleryItem { src: string; caption?: string }
export const MAX_MORE = 4;
/** Only photographs the Desk uploaded (our own media bucket) are shown. */
export const isOwnPhoto = (src: unknown): src is string =>
  typeof src === 'string' && /^https:\/\/zblgggifysohxqtgvgxs\.supabase\.co\/storage\/v1\/object\/public\/media\//.test(src);
export const cleanGallery = (g: unknown): GalleryItem[] =>
  (Array.isArray(g) ? g : []).filter((x) => x && isOwnPhoto(x.src)).slice(0, MAX_MORE)
    .map((x) => ({ src: x.src, caption: typeof x.caption === 'string' ? x.caption.slice(0, 200) : '' }));
