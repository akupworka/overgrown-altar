// Everything the site asks Sanity for lives here.
// GROQ is Sanity's query language: *[_type == "article"] means "every article".
import { sanityClient } from 'sanity:client';

// ---- Fetching ----
// Normally we ask Sanity. For offline testing, SANITY_FIXTURE=<file.json> answers from a local file instead.
async function query<T>(groq: string, params: Record<string, unknown> = {}): Promise<T> {
  const fixture = process.env.SANITY_FIXTURE;
  if (fixture) {
    const { parse, evaluate } = await import('groq-js');
    const { readFile } = await import('node:fs/promises');
    const dataset = JSON.parse(await readFile(fixture, 'utf8'));
    return (await (await evaluate(parse(groq, { params }), { dataset, params })).get()) as T;
  }
  return sanityClient.fetch<T>(groq, params);
}

// ---- Types ----
export type Pillar = 'watchtower' | 'hearth' | 'perimeter';
export interface Img { url: string; alt?: string; hotspot?: { x: number; y: number } }
export interface ArticleCard {
  _id: string; title: string; slug: string; pillar: Pillar; medium: string; number?: number;
  standfirst?: string; publishedAt?: string; thinkers?: string[]; image?: Img;
  inMatrix?: boolean; matrixThinker?: string; matrixFracture?: string; matrixAnchor?: string;
  author?: { name: string; portrait?: string; craft?: string; bio?: string };
}
export interface Article extends ArticleCard {
  body?: any[]; signed?: boolean; seoDescription?: string;
}

// ---- Queries ----
const IMAGE = `{alt, hotspot, "url": asset->url}`;
const CARD = `{
  _id, title, "slug": slug.current, pillar, medium, number, standfirst, publishedAt, thinkers,
  inMatrix, matrixThinker, matrixFracture, matrixAnchor, "image": featuredImage${IMAGE},
  "author": author->{name, "portrait": portrait.asset->url}
}`;
const PUBLISHED = `_type == "article" && defined(slug.current) && !(_id in path("drafts.**"))`;
const ORDER = `order(coalesce(number, 999) asc, publishedAt desc)`;

export const getArticles = (pillar?: Pillar) =>
  query<ArticleCard[]>(`*[${PUBLISHED} && (!defined($pillar) || pillar == $pillar)] | ${ORDER} ${CARD}`, { pillar: pillar ?? null });

export const getMatrix = () =>
  query<ArticleCard[]>(`*[${PUBLISHED} && inMatrix == true] | ${ORDER} ${CARD}`);

export const getArticle = (pillar: Pillar, slug: string) =>
  query<Article>(`*[${PUBLISHED} && pillar == $pillar && slug.current == $slug][0]{
    ...${CARD},
    signed, seoDescription,
    "author": author->{name, craft, bio},
    body[]{..., _type == "plate" => {..., "url": asset->url}}
  }`, { pillar, slug });

// ---- Helpers used by the pages ----
export const PILLAR_NAMES: Record<Pillar, string> = { watchtower: 'The Watchtower', hearth: 'The Hearth', perimeter: 'The Perimeter' };
export const MEDIUM_NAMES: Record<string, string> = {
  essay: 'Essay', photograph: 'Photographs', prose: 'Prose', fiction: 'Fiction',
  study: 'Architectural study', teardown: 'Design teardown', protocol: 'Protocol',
};

export const articleUrl = (a: Pick<ArticleCard, 'pillar' | 'slug'>) => `/${a.pillar}/${a.slug}`;

export function roman(n?: number) {
  if (!n) return '';
  const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

/** "Dispatch 1", "Protocol III" or the medium, e.g. "Prose". */
export function kind(a: ArticleCard) {
  if (a.pillar === 'watchtower' && a.number) return `Dispatch ${a.number}`;
  if (a.pillar === 'perimeter' && a.number) return `Protocol ${roman(a.number)}`;
  return MEDIUM_NAMES[a.medium] ?? '';
}

/** A resized, compressed photo from Sanity's image service. */
export function imgSrc(img: Img | undefined, width = 1600) {
  if (!img?.url) return '';
  return img.url.startsWith('http') ? `${img.url}?w=${width}&auto=format&q=75` : img.url;
}
/** Keeps the important part of a photo in view when it's cropped (set with "hotspot" in the Studio). */
export function imgPos(img?: Img, fallback = 'center') {
  return img?.hotspot ? `${Math.round(img.hotspot.x * 100)}% ${Math.round(img.hotspot.y * 100)}%` : fallback;
}

export const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : '';

export function readingTime(body: any[] = []) {
  const text = JSON.stringify(body.map((b) => b.children?.map((c: any) => c.text) ?? [b.text, b.intro, b.checklist]));
  return Math.max(1, Math.round(text.split(/\s+/).length / 230));
}
