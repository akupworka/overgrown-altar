// "Social post": a piece made into a tall picture for Instagram or messages, set like a small advertisement for it,
// and shown to the reader before they share or save it:
// the piece's photograph darkened like glass at night, its title and the line beneath it (or a line the reader chose),
// the writer, and "Read it on Overgrown Altar".
// Drawn in the reader's browser.
export interface CardInput { quote: string; title: string; author: string; kicker: string; image?: string; fallback: string; standfirst?: string }
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
/** The same number of lines, evened out, so no line is left with a single word. */
function balanced(ctx: CanvasRenderingContext2D, text: string, max: number): string[] {
  const lines = wrap(ctx, text, max);
  if (lines.length < 2) return lines;
  let lo = max / 2, hi = max;
  for (let i = 0; i < 12; i++) { const mid = (lo + hi) / 2; if (wrap(ctx, text, mid).length <= lines.length) hi = mid; else lo = mid; }
  return wrap(ctx, text, hi);
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
    // the title (or the chosen line), sized to fit; under a title, the piece's own line beneath it (its sub caption)
    const quote = c.quote.trim().replace(/\s+/g, ' '), isTitle = c.quote === c.title;
    const sub = isTitle ? (c.standfirst ?? '').trim().replace(/\s+/g, ' ') : '';
    ctx.font = 'italic 400 38px Cormorant, serif';
    let subLines = sub ? wrap(ctx, sub, W - 260) : [];
    if (subLines.length && subLines.length <= 3) subLines = balanced(ctx, sub, W - 260);
    if (subLines.length > 3) { subLines = subLines.slice(0, 3); subLines[2] = subLines[2].replace(/[\s,;:.]+\S*$/, '') + '…'; }
    const subH = subLines.length ? 44 + subLines.length * 50 : 0, room = 640 - subH;
    let size = quote.length > 220 ? 46 : quote.length > 140 ? 54 : quote.length > 70 ? 64 : 78, lines: string[] = [];
    for (; size >= 34; size -= 4) { ctx.font = `500 ${size}px Cormorant, serif`; lines = balanced(ctx, quote, W - 220); if (lines.length * size * 1.28 <= room) break; }
    const lh = size * 1.28, top = 300 + (640 - subH - lines.length * lh) / 2 + size;
    ctx.font = `500 ${size}px Cormorant, serif`; ctx.fillStyle = '#F3ECDC'; lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * lh));
    if (subLines.length) {
      const y0 = top + (lines.length - 1) * lh + 44;
      ctx.strokeStyle = 'rgba(255,227,163,.55)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(W / 2 - 26, y0); ctx.lineTo(W / 2 + 26, y0); ctx.stroke();
      ctx.font = 'italic 400 38px Cormorant, serif'; ctx.fillStyle = '#D9D2C2'; subLines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + 58 + i * 50));
    }
    // whose, and from what
    ctx.font = 'italic 400 40px Cormorant, serif'; ctx.fillStyle = '#E6DFD0';
    const from = wrap(ctx, isTitle ? `by ${c.author}` : `${c.author}, “${c.title}”`, W - 240).slice(0, 2);
    from.forEach((l, i) => ctx.fillText(l, W / 2, 1016 + i * 50));
    ctx.font = '400 19px "Alte Haas", sans-serif'; ctx.fillStyle = '#FFE3A3'; spaced(ctx, c.kicker.toUpperCase(), W / 2, 258, 7);
    // the invitation, like the foot of an advertisement: the glass line, a "Read now" button, and where
    const glass = ctx.createLinearGradient(W / 2 - 110, 0, W / 2 + 110, 0);
    ['#3E7BFF', '#B05BFF', '#FF3B4E', '#FFC44D', '#3DE0A0'].forEach((col, i) => glass.addColorStop(i / 4, col));
    ctx.fillStyle = glass; ctx.fillRect(W / 2 - 110, 1128, 220, 3);
    const bw = 300, bh = 62, bx = W / 2 - bw / 2, by = 1160, r = bh / 2;
    ctx.beginPath(); ctx.moveTo(bx + r, by); ctx.lineTo(bx + bw - r, by); ctx.arc(bx + bw - r, by + r, r, -Math.PI / 2, Math.PI / 2); ctx.lineTo(bx + r, by + bh); ctx.arc(bx + r, by + r, r, Math.PI / 2, -Math.PI / 2); ctx.closePath();
    ctx.fillStyle = '#FFE3A3'; ctx.fill();
    ctx.font = '400 21px "Alte Haas", sans-serif'; ctx.fillStyle = '#12160F'; spaced(ctx, 'READ NOW', W / 2, by + bh / 2 + 8, 8);
    ctx.font = '400 21px "Alte Haas", sans-serif'; ctx.fillStyle = '#F3ECDC'; spaced(ctx, 'OVERGROWNALTAR.COM', W / 2, 1276, 7);
  };
  const blob = () => new Promise<Blob>((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error('no image'))), 'image/jpeg', 0.9));
  let img: HTMLImageElement | null = null;
  try { img = await loadImage(c.image || c.fallback); } catch { try { img = await loadImage(c.fallback); } catch { img = null; } }
  paint(img);
  try { return await blob(); } catch { paint(await loadImage(c.fallback).catch(() => null)); return blob(); }   // (a photograph that can't be copied: use the room's)
}

/** Make the post and show it: the picture itself, large, with Share and Save under it. (A phone's own share sheet shows
 *  only a file's name and a paper icon, so the reader sees the real thing here first, and shares or saves from here.)
 *  Returns what they did. */
export function shareCard(c: CardInput): Promise<'shared' | 'saved' | 'cancelled'> {
  return new Promise((resolve) => {
    const name = `${c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'overgrown-altar'}.jpg`;
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    const touch = matchMedia('(pointer: coarse)').matches;
    // An iPhone or iPad lets a website reach Photos only through its own sheet (or a press and hold), so Save goes that way there.
    const apple = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let url = '', file: File | null = null, canShare = false, did: 'shared' | 'saved' | 'cancelled' = 'cancelled';
    const box = document.createElement('div');
    box.className = 'sp'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Your social post');
    box.innerHTML = `<div class="sp-in">
      <button type="button" class="sp-x" data-sp-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <span class="eb sp-k">Your social post</span>
      <div class="sp-frame"><span class="lab sp-wait">Making the post…</span></div>
      <div class="sp-acts" hidden>
        <a class="sp-btn sp-share" data-sp-save><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M8 11.5l4 3.5 4-3.5M6 19h12"/></svg>Save to images</a>
        <button type="button" class="sp-btn sp-save" data-sp-share hidden><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4M8 7.5L12 4l4 3.5M6 12v7h12v-7"/></svg>Share</button>
      </div>
      <span class="lab sp-hint" hidden>${apple ? 'Choose “Save Image” when the sheet opens, or press and hold the picture.' : touch ? 'Or press and hold the picture to save it.' : 'It is saved with your downloads.'}</span>
    </div>`;
    const close = () => {
      box.remove(); document.documentElement.classList.remove('sp-open'); removeEventListener('keydown', onKey);
      if (url) setTimeout(() => URL.revokeObjectURL(url), 4000);
      resolve(did);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    box.addEventListener('click', async (e) => {
      const t = e.target as HTMLElement;
      if (t === box || t.closest('[data-sp-close]')) return close();
      const viaSheet = async (what: 'shared' | 'saved') => { try { await nav.share({ files: [file!] }); did = what; } catch { /* they closed the sheet */ } };
      if (t.closest('[data-sp-save]')) {
        if (apple && file && canShare) { e.preventDefault(); await viaSheet('saved'); } else did = 'saved';   // (elsewhere the link itself saves the picture)
        return;
      }
      if (t.closest('[data-sp-share]') && file) await viaSheet('shared');
    });
    addEventListener('keydown', onKey);
    document.body.append(box); document.documentElement.classList.add('sp-open');
    drawCard(c).then((blob) => {
      if (!box.isConnected) return;
      file = new File([blob], name, { type: 'image/jpeg' }); url = URL.createObjectURL(file);
      const img = new Image(); img.src = url; img.alt = `${c.title}, by ${c.author}: a social post`; img.className = 'sp-img';
      box.querySelector('.sp-frame')!.replaceChildren(img);
      const save = box.querySelector<HTMLAnchorElement>('[data-sp-save]')!; save.href = url; save.download = name;
      canShare = !!nav.canShare?.({ files: [file] }) && typeof nav.share === 'function';
      box.querySelector<HTMLElement>('[data-sp-share]')!.hidden = !canShare;
      box.querySelector<HTMLElement>('.sp-acts')!.hidden = false; box.querySelector<HTMLElement>('.sp-hint')!.hidden = false;
    }).catch(() => { const w = box.querySelector('.sp-wait'); if (w) w.textContent = 'The post couldn’t be made. Close this and try again.'; });
  });
}
