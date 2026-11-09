// A picture for every member who hasn't added a portrait yet: a detail of glass, stone or ivy from the site's own
// photographs (public/images/seats/, twelve of them). Each member always gets the same one, chosen from their name, so it never
// changes between pages; their own portrait replaces it as soon as they add one.
export const SEATS = 12;
export function seatFor(name: string | null | undefined): string {
  const s = (name || 'A member').trim().toLowerCase();
  let h = 2166136261;   // FNV-1a: spreads similar names apart
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return `/images/seats/seat-${(h % SEATS) + 1}.jpg`;
}
