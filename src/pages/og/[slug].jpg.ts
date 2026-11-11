// The card a piece shows when its link is shared (messages, Instagram, anywhere that previews a link):
// its photograph darkened like glass at night, the room and kind in gold, the title, the writer, the wordmark.
// Built once per piece when the site builds (1200 × 630). The type is drawn as shapes, so no fonts need installing.
import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import satori from 'satori';
import sharp from 'sharp';
import { getGuildPieces, MEDIUM_LABEL, PILLAR_LABEL, type GuildPiece } from '../../lib/guild';

const W = 1200, H = 630;
const FALLBACK: Record<string, string> = { watchtower: '/images/watchtower-photo-1200.jpg', hearth: '/images/window-of-the-ascension-and-1200.jpg', perimeter: '/images/chapel-and-cross-under-a-1200.jpg' };
const pub = (p: string) => path.join(process.cwd(), 'public', p);

export async function getStaticPaths() {
  const reserved = new Set(['desk', 'members', 'authors']);
  return (await getGuildPieces()).filter((p) => !reserved.has(p.slug)).map((p) => ({ params: { slug: p.slug }, props: { piece: p } }));
}

let fonts: Promise<any[]> | undefined;
const loadFonts = () => (fonts ??= Promise.all([
  fs.readFile(pub('/fonts/cormorant-500.ttf')), fs.readFile(pub('/fonts/cormorant-italic-400.ttf')), fs.readFile(pub('/fonts/alte-haas-400.ttf')),
]).then(([c, ci, a]) => [
  { name: 'Cormorant', data: c, weight: 500, style: 'normal' },
  { name: 'Cormorant', data: ci, weight: 400, style: 'italic' },
  { name: 'Alte Haas', data: a, weight: 400, style: 'normal' },
]));

/** The photograph behind the card: the piece's own (a site photograph, or fetched), else its room's. */
async function backdrop(p: GuildPiece): Promise<Buffer> {
  const local = async (src: string) => fs.readFile(pub(src));
  try {
    if (p.image?.startsWith('/')) return await local(p.image);
    if (p.image) {
      const res = await fetch(p.image, { signal: AbortSignal.timeout(6000) });
      if (res.ok) return Buffer.from(await res.arrayBuffer());
    }
  } catch { /* fall through to the room's photograph */ }
  return local(FALLBACK[p.pillar] ?? FALLBACK.hearth);
}

const h = (type: string, style: Record<string, any>, children?: any, extra: Record<string, any> = {}) => ({ type, props: { style, children, ...extra } });

async function card(p: GuildPiece): Promise<Buffer> {
  const photo = p.medium === 'photograph';
  const title = p.title || 'Untitled';
  const size = title.length > 70 ? 54 : title.length > 44 ? 64 : title.length > 24 ? 76 : 88;
  const kicker = `${PILLAR_LABEL[p.pillar] ?? ''}  ·  ${MEDIUM_LABEL[p.medium] ?? ''}`.toUpperCase();
  const glass = 'linear-gradient(90deg, #3E7BFF, #B05BFF, #FF3B4E, #FFC44D, #3DE0A0)';
  const tree = h('div', { width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: photo ? 'flex-end' : 'center', padding: photo ? '0 80px 64px' : '0 96px', position: 'relative', color: '#F3ECDC', fontFamily: 'Cormorant', fontWeight: 500,
      backgroundImage: photo ? 'linear-gradient(180deg, rgba(6,8,6,0) 30%, rgba(6,8,6,.92) 100%)' : 'linear-gradient(180deg, rgba(6,8,6,.66), rgba(6,8,6,.82))' }, [
    // a fine gold frame, like the lead of a window
    h('div', { position: 'absolute', left: 26, top: 26, right: 26, bottom: 26, border: '1px solid rgba(159, 148, 94, .65)', display: 'flex' }),
    !photo && h('svg', { marginBottom: 26 }, [h('path', {}, undefined, { d: 'M12 1v38M2 12h20', stroke: '#FFE3A3', 'stroke-width': 1.4, fill: 'none' })], { width: 24, height: 40, viewBox: '0 0 24 40' }),
    h('div', { fontFamily: 'Alte Haas', fontSize: 19, letterSpacing: 7, color: '#FFE3A3', display: 'flex' }, kicker),
    h('div', { marginTop: 22, fontSize: photo ? Math.min(size, 64) : size, lineHeight: 1.08, textAlign: 'center', display: 'flex', justifyContent: 'center', maxWidth: 1000 }, title),
    h('div', { marginTop: 22, fontSize: 34, fontStyle: 'italic', fontWeight: 400, color: '#E6DFD0', display: 'flex' }, `by ${p.author.display_name}`),
    h('div', { position: 'absolute', left: 0, right: 0, bottom: photo ? 30 : 52, display: 'flex', flexDirection: 'column', alignItems: 'center' }, photo ? [] : [
      h('div', { width: 220, height: 2, backgroundImage: glass, display: 'flex' }),
      h('div', { marginTop: 18, fontSize: 21, letterSpacing: 9, color: '#CFC8B8', display: 'flex' }, 'OVERGROWN ALTAR'),
    ]),
  ].filter(Boolean));
  const svg = await satori(tree as any, { width: W, height: H, fonts: await loadFonts() });
  const base = sharp(await backdrop(p)).resize(W, H, { fit: 'cover', position: 'centre', fastShrinkOnLoad: true });
  return (photo ? base : base.modulate({ brightness: 0.8, saturation: 0.9 }))
    .composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 80 }).toBuffer();
}

// Finished cards are kept between builds (Netlify keeps node_modules), so a build only draws new or changed pieces.
const CACHE = path.join(process.cwd(), 'node_modules', '.cache', 'oa-cards-v2');
async function cached(p: GuildPiece): Promise<Buffer> {
  const key = createHash('sha1').update(JSON.stringify([p.title, p.author.display_name, p.pillar, p.medium, p.image?.split('?')[0] ?? ''])).digest('hex');
  const file = path.join(CACHE, `${key}.jpg`);
  try { return await fs.readFile(file); } catch { /* not drawn yet */ }
  const img = await card(p);
  try { await fs.mkdir(CACHE, { recursive: true }); await fs.writeFile(file, img); } catch { /* the cache is a convenience */ }
  return img;
}

export const GET: APIRoute = async ({ props }) => {
  const img = await cached((props as { piece: GuildPiece }).piece);
  return new Response(new Uint8Array(img), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' } });
};
