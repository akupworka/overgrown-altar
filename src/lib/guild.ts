// Published Guild pieces, fetched once when the site is built.
// Netlify rebuilds the site whenever the editor publishes, so this list is always current.
// For offline testing, GUILD_FIXTURE=<file.json> answers from a local file instead.
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './supabase';

export interface GuildAuthor { id: string; slug?: string; display_name: string; craft: string; bio: string; portrait: string; website: string; instagram: string; email?: string }
export interface GuildPiece {
  id: string; slug: string; title: string; standfirst: string; body: string; pillar: 'watchtower' | 'hearth' | 'perimeter';
  medium: string; image: string; image_alt: string; published_at: string; author: GuildAuthor;
}

let cache: Promise<GuildPiece[]> | null = null;

async function load(): Promise<GuildPiece[]> {
  const fixture = process.env.GUILD_FIXTURE;
  if (fixture) {
    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(fixture, 'utf8'));
  }
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    const { data, error } = await db.from('pieces')
      .select('id, slug, title, standfirst, body, pillar, medium, image_path, image_alt, published_at, author:profiles(id, display_name, craft, bio, portrait_path, website, instagram, public_email)')
      .eq('status', 'approved').not('slug', 'is', null).order('published_at', { ascending: false });
    if (error) throw error;
    const paths = (data ?? []).map((p: any) => p.image_path).filter(Boolean);
    const signed = paths.length ? (await db.storage.from('guild').createSignedUrls(paths, 60 * 60 * 24 * 365 * 10)).data ?? [] : [];
    const photo = new Map(signed.map((s: any) => [s.path, s.signedUrl]));
    return (data ?? []).map((p: any) => ({
      id: p.id, slug: p.slug, title: p.title, standfirst: p.standfirst, body: p.body, pillar: p.pillar, medium: p.medium,
      image: p.image_path ? photo.get(p.image_path) ?? '' : '', image_alt: p.image_alt, published_at: p.published_at,
      author: {
        id: p.author?.id, display_name: p.author?.display_name ?? 'A member', craft: p.author?.craft ?? '', bio: p.author?.bio ?? '',
        portrait: p.author?.portrait_path ? db.storage.from('portraits').getPublicUrl(p.author.portrait_path).data.publicUrl : '',
        website: p.author?.website ?? '', instagram: p.author?.instagram ?? '', email: p.author?.public_email ?? '',
      },
    }));
  } catch (e) {
    console.warn('[guild] Could not load published pieces from Supabase:', (e as Error).message);
    return [];
  }
}

// Every author gets a readable address from their name (/guild/authors/eden-albright/), unique across the Guild.
function withAuthorSlugs(pieces: GuildPiece[]): GuildPiece[] {
  const byId = new Map<string, string>(), taken = new Set<string>();
  for (const p of [...pieces].reverse()) {           // oldest first, so an author's address never changes when someone new arrives
    const id = p.author.id; if (!id || byId.has(id)) continue;
    const base = p.author.display_name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'member';
    let slug = base, n = 2; while (taken.has(slug)) slug = `${base}-${n++}`;
    taken.add(slug); byId.set(id, slug);
  }
  return pieces.map((p) => ({ ...p, author: { ...p.author, slug: byId.get(p.author.id) } }));
}
export const getGuildPieces = () => (cache ??= load().then(withAuthorSlugs));
export const authorUrl = (a: Pick<GuildAuthor, 'slug'>) => (a.slug ? `/guild/authors/${a.slug}/` : undefined);
export async function getAuthors() {
  const all = await getGuildPieces(); const out = new Map<string, { author: GuildAuthor; pieces: GuildPiece[] }>();
  for (const p of all) { if (!p.author.slug) continue; (out.get(p.author.slug) ?? out.set(p.author.slug, { author: p.author, pieces: [] }).get(p.author.slug)!).pieces.push(p); }
  return [...out.values()];
}
export const guildPillar = async (pillar: GuildPiece['pillar']) => (await getGuildPieces()).filter((p) => p.pillar === pillar);
export const guildUrl = (p: Pick<GuildPiece, 'slug'>) => `/guild/${p.slug}/`;
export const MEDIUM_LABEL: Record<string, string> = {
  prose: 'Prose', poetry: 'Poetry', fiction: 'Fiction', essay: 'Essay', photograph: 'Photographs',
  study: 'Architectural study', teardown: 'Design teardown', protocol: 'Protocol', recovery: 'Recovery story', testimony: 'Testimony', deliverance: 'Deliverance story', personal: 'Personal',
};
export const PILLAR_LABEL = { watchtower: 'The Watchtower', hearth: 'The Hearth', perimeter: 'The Perimeter' } as const;
export const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).length / 230));
