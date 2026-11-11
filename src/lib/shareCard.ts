// "Share as a card": a line from a piece (or its title), drawn on a tall card for Instagram or messages:
// the piece's photograph darkened like glass at night, the line in Cormorant, the title, the writer, the wordmark.
// Drawn in the reader's browser; on a phone it opens the share sheet, on a computer it saves the picture.
export interface CardInput { quote: string; title: string; author: string; kicker: string; image?: string; fallback: string }
const W = 1080, H = 1350;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((ok, no) => { const i = new Image(); if (!src.startsWith('/')) i.crossOrigin = 'anonymous'; i.onload = () => ok(i); i.onerror = no; i.src = src; });
}
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines: string[] = []; let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, gap: number) {
  // letter-spaced capitals, centred on x (canvas letterSpacing isn't everywhere yet)
  const widths = [...text].map((ch) => ctx.measureText(ch).width + gap);
  let at = x - (widths.reduce((a, b) => a + b, 0) - gap) / 2;
  ctx.textAlign = 'left';
  [...text].forEach((ch, i) => { ctx.fillText(ch, at, y); at += widths[i]; });
  ctx.textAlign = 'center';
}

export async function drawCard(c: CardInput): Promise<Blob> {
  await Promise.all(['500 60px Cormorant', 'italic 400 40px Cormorant', '400 20px "Alte Haas"'].map((f) => document.fonts.load(f).catch(() => null)));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  const paint = (img: HTMLImageElement | null) => {
    ctx.fillStyle = '#060806'; ctx.fillRect(0, 0, W, H);
    if (img) { const s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s; ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); }
    const veil = ctx.createLinearGradient(0, 0, 0, H); veil.addColorStop(0, 'rgba(6,8,6,.74)'); veil.addColorStop(1, 'rgba(6,8,6,.9)');
    ctx.fillStyle = veil; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(159,148,94,.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    // the cross
    ctx.strokeStyle = '#FFE3A3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2, 150); ctx.lineTo(W / 2, 214); ctx.moveTo(W / 2 - 17, 170); ctx.lineTo(W / 2 + 17, 170); ctx.stroke();
    // the line itself, sized to fit
    const quote = c.quote.trim().replace(/\s+/g, ' ');
    let size = quote.length > 220 ? 46 : quote.length > 140 ? 54 : quote.length > 70 ? 64 : 78, lines: string[] = [];
    for (; size >= 34; size -= 4) { ctx.font = `500 ${size}px Cormorant, serif`; lines = wrap(ctx, quote, W - 220); if (lines.length * size * 1.28 <= 660) break; }
    const lh = size * 1.28, top = 300 + (660 - lines.length * lh) / 2 + size;
    ctx.fillStyle = '#F3ECDC'; lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lh));
    // whose, and from what
    ctx.font = 'italic 400 40px Cormorant, serif'; ctx.fillStyle = '#E6DFD0';
    const from = wrap(ctx, c.quote === c.title ? `by ${c.author}` : `${c.author}, “${c.title}”`, W - 240).slice(0, 2);
    from.forEach((l, i) => ctx.fillText(l, W / 2, 1050 + i * 50));
    ctx.font = '400 19px "Alte Haas", sans-serif'; ctx.fillStyle = '#FFE3A3'; spaced(ctx, c.kicker.toUpperCase(), W / 2, 258, 7);
    // glass line and wordmark
    const glass = ctx.createLinearGradient(W / 2 - 110, 0, W / 2 + 110, 0);
    ['#3E7BFF', '#B05BFF', '#FF3B4E', '#FFC44D', '#3DE0A0'].forEach((col, i) => glass.addColorStop(i / 4, col));
    ctx.fillStyle = glass; ctx.fillRect(W / 2 - 110, 1196, 220, 3);
    ctx.font = '500 26px Cormorant, serif'; ctx.fillStyle = '#CFC8B8'; spaced(ctx, 'OVERGROWN ALTAR', W / 2, 1250, 11);
    ctx.font = '400 15px "Alte Haas", sans-serif'; ctx.fillStyle = '#8C8679'; spaced(ctx, 'OVERGROWNALTAR.COM', W / 2, 1286, 5);
  };
  const blob = () => new Promise<Blob>((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error('no image'))), 'image/jpeg', 0.9));
  let img: HTMLImageElement | null = null;
  try { img = await loadImage(c.image || c.fallback); } catch { try { img = await loadImage(c.fallback); } catch { img = null; } }
  paint(img);
  try { return await blob(); } catch { paint(await loadImage(c.fallback).catch(() => null)); return blob(); }   // (a photograph that can't be copied: use the room's)
}

/** Draw the card, then hand it to the phone's share sheet, or save it on a computer. Returns what happened. */
export async function shareCard(c: CardInput): Promise<'shared' | 'saved' | 'cancelled'> {
  const file = new File([await drawCard(c)], `${c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'overgrown-altar'}.jpg`, { type: 'image/jpeg' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (matchMedia('(pointer: coarse)').matches && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: c.title }); return 'shared'; } catch { return 'cancelled'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'saved';
}
