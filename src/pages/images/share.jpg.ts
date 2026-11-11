// The picture a link to the site shows when it is shared (messages, Instagram, anywhere that previews a link):
// the wordmark and the tagline above the nave's three windows, with the address at the foot. One card for every link
// that has no picture of its own. (A piece's own card is /og/<its address>.jpg.) Built once when the site builds,
// 1200 × 630, type drawn as shapes. It lives under /images/ so the door's lock, which lets that folder through, never hides it.
import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

const W = 1200, H = 630;
const pub = (p: string) => path.join(process.cwd(), 'public', p);
const h = (type: string, style: Record<string, any>, children?: any, extra: Record<string, any> = {}) => ({ type, props: { style, children, ...extra } });

export const GET: APIRoute = async () => {
  const [c500, cItalic, sans] = await Promise.all([fs.readFile(pub('/fonts/cormorant-500.ttf')), fs.readFile(pub('/fonts/cormorant-italic-400.ttf')), fs.readFile(pub('/fonts/alte-haas-400.ttf'))]);
  const tree = h('div', { width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 54, position: 'relative', color: '#F3ECDC', fontFamily: 'Cormorant', fontWeight: 500,
      // dark behind the name, clearing toward the windows, then a little dark again under the address
      backgroundImage: 'linear-gradient(180deg, rgba(6,8,6,.86) 0%, rgba(6,8,6,.78) 46%, rgba(6,8,6,.2) 70%, rgba(6,8,6,.12) 82%, rgba(6,8,6,.7) 100%)' }, [
    h('div', { position: 'absolute', left: 26, top: 26, right: 26, bottom: 26, border: '1px solid rgba(159, 148, 94, .7)', display: 'flex' }),   // a fine gold frame, like the lead of a window
    h('svg', { marginBottom: 12 }, [h('path', {}, undefined, { d: 'M13 1v42M2 13h22', stroke: '#FFE3A3', 'stroke-width': 1.5, fill: 'none' })], { width: 26, height: 44, viewBox: '0 0 26 44' }),
    h('div', { fontSize: 88, letterSpacing: 22, lineHeight: 1, paddingLeft: 22, display: 'flex' }, 'OVERGROWN'),
    h('div', { marginTop: 0, fontSize: 104, fontStyle: 'italic', fontWeight: 400, color: '#FFE3A3', lineHeight: 1.04, letterSpacing: 4, display: 'flex' }, 'Altar'),
    h('div', { marginTop: 14, fontSize: 32, fontStyle: 'italic', fontWeight: 400, color: '#E6DFD0', display: 'flex' }, 'Craft, Discernment & The Reclaimed Hearth.'),
    h('div', { position: 'absolute', left: 0, right: 0, bottom: 46, justifyContent: 'center', fontFamily: 'Alte Haas', fontSize: 17, letterSpacing: 7, color: '#F3ECDC', display: 'flex' }, 'OVERGROWNALTAR.COM'),
  ]);
  const svg = await satori(tree as any, { width: W, height: H, fonts: [
    { name: 'Cormorant', data: c500, weight: 500, style: 'normal' }, { name: 'Cormorant', data: cItalic, weight: 400, style: 'italic' }, { name: 'Alte Haas', data: sans, weight: 400, style: 'normal' },
  ] as any });
  // the nave, cropped so its three windows stand in the lower third, under the name
  const src = sharp(await fs.readFile(pub('/images/folios-photo-2.jpg')));
  const meta = await src.metadata(), k = (meta.width ?? 1200) / 1200;
  const img = await src.extract({ left: Math.round(150 * k), top: Math.round(150 * k), width: Math.round(900 * k), height: Math.round(472 * k) }).resize(W, H, { fit: 'cover' })
    .modulate({ brightness: 1.3, saturation: 1.25 }).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 86 }).toBuffer();
  return new Response(new Uint8Array(img), { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400' } });
};
