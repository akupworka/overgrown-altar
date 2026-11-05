// Lists that fill themselves in. The site is built ahead of time (and rebuilds itself within the hour),
// so a piece the editor approves after the last build isn't in the lists yet. This asks Supabase for
// anything approved since the page was built, so new pieces show the moment they're approved.
import { supabase, portraitUrl } from './supabase';
// (The same labels as lib/guild.ts, kept here so the browser doesn't load the build-time code.)
const MEDIUM_LABEL: Record<string, string> = {
  prose: 'Prose', poetry: 'Poetry', fiction: 'Fiction', essay: 'Essay', photograph: 'Photographs',
  study: 'Architectural study', teardown: 'Design teardown', protocol: 'Protocol', recovery: 'Recovery story', testimony: 'Testimony', deliverance: 'Deliverance story', personal: 'Personal',
};
const PILLAR_LABEL: Record<string, string> = { watchtower: 'The Watchtower', hearth: 'The Hearth', perimeter: 'The Perimeter' };

export interface FreshPiece {
  href: string; title: string; standfirst: string; pillar: string; medium: string; kind: string; room: string;
  date: string; minutes: number; image: string; imagePos: string; author: string; authorId: string; portrait: string;
}
const cache = new Map<string, Promise<FreshPiece[]>>();

/** Pieces approved since `built` (an ISO time), newest first, optionally in one pillar. */
export function freshSince(built: string, pillar?: string): Promise<FreshPiece[]> {
  const key = built + (pillar ?? '');
  if (!cache.has(key)) cache.set(key, (async () => {
    // A little overlap with the build, in case a piece was approved while the site was being built.
    const since = new Date(Date.parse(built) - 15 * 60 * 1000).toISOString();
    let q = supabase.from('pieces')
      .select('slug, title, standfirst, body, pillar, medium, image_path, image_focus, published_at, author:profiles(id, display_name, portrait_path)')
      .eq('status', 'approved').not('slug', 'is', null).gt('published_at', since).order('published_at', { ascending: false }).limit(12);
    if (pillar) q = q.eq('pillar', pillar);
    const { data } = await q;
    const rows = (data ?? []) as any[];
    const paths = rows.map((r) => r.image_path).filter(Boolean);
    const signed = paths.length ? (await supabase.storage.from('guild').createSignedUrls(paths, 60 * 60 * 24)).data ?? [] : [];
    const url = new Map(signed.map((s: any) => [s.path, s.signedUrl]));
    return rows.map((r) => ({
      href: `/guild/${r.slug}/`, title: r.title, standfirst: r.standfirst ?? '', pillar: r.pillar, medium: r.medium,
      kind: MEDIUM_LABEL[r.medium] ?? '', room: PILLAR_LABEL[r.pillar] ?? '',
      date: String(r.published_at).slice(0, 10), minutes: Math.max(1, Math.round(String(r.body ?? '').split(/\s+/).length / 230)),
      image: r.image_path ? url.get(r.image_path) ?? '' : '', imagePos: r.image_focus ?? '',
      author: r.author?.display_name ?? 'A member', authorId: r.author?.id ?? '', portrait: portraitUrl(r.author?.portrait_path) ?? '',
    }));
  })().catch(() => []));
  return cache.get(key)!;
}
