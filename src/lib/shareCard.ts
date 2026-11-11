// "Social post": a piece made into a tall picture for Instagram or messages, set like a small advertisement for it,
// and shown to the reader before they share or save it:
// the piece's photograph darkened like glass at night, its title and the line beneath it (or a line the reader chose),
// the writer, and "Read it on Overgrown Altar".
// Drawn in the reader's browser.
export interface CardInput { quote: string; title: string; author: string; kicker: string; image?: string; fallback: string; standfirst?: string;
  excerpt?: string[] }   // the piece's opening paragraphs (a poem's lines kept apart by line breaks), for the second picture
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

type Ctx = CanvasRenderingContext2D;
/** The ground every picture stands on: the piece's photograph, darkened like glass at night, inside a fine gold frame. */
function ground(ctx: Ctx, img: HTMLImageElement | null, top: number, bottom: number) {
  ctx.fillStyle = '#060806'; ctx.fillRect(0, 0, W, H);
  if (img) { const s = Math.max(W / img.width, H / img.height), w = img.width * s, h = img.height * s; ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h); }
  const veil = ctx.createLinearGradient(0, 0, 0, H); veil.addColorStop(0, `rgba(6,8,6,${top})`); veil.addColorStop(1, `rgba(6,8,6,${bottom})`);
  ctx.fillStyle = veil; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(159,148,94,.7)'; ctx.lineWidth = 1.5; ctx.strokeRect(36, 36, W - 72, H - 72);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
}
/** A gold button, its words centred (an arrow after them where asked): the invitation at the foot of a picture. */
function button(ctx: Ctx, words: string, y: number, arrow = false) {
  ctx.font = '400 21px "Alte Haas", sans-serif';
  const gap = 7, tw = [...words].reduce((n, ch) => n + ctx.measureText(ch).width + gap, -gap), aw = arrow ? 58 : 0;
  const bw = tw + aw + 96, bh = 62, bx = W / 2 - bw / 2, r = bh / 2;
  ctx.beginPath(); ctx.moveTo(bx + r, y); ctx.lineTo(bx + bw - r, y); ctx.arc(bx + bw - r, y + r, r, -Math.PI / 2, Math.PI / 2); ctx.lineTo(bx + r, y + bh); ctx.arc(bx + r, y + r, r, Math.PI / 2, -Math.PI / 2); ctx.closePath();
  ctx.fillStyle = '#FFE3A3'; ctx.fill();
  ctx.fillStyle = '#12160F'; spaced(ctx, words, W / 2 - aw / 2, y + bh / 2 + 8, gap);
  if (arrow) { const ax = W / 2 - aw / 2 + tw / 2 + 22, ay = y + bh / 2; ctx.strokeStyle = '#12160F'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + 34, ay); ctx.moveTo(ax + 24, ay - 9); ctx.lineTo(ax + 34, ay); ctx.lineTo(ax + 24, ay + 9); ctx.stroke(); }
}
function glassLine(ctx: Ctx, y: number) {
  const glass = ctx.createLinearGradient(W / 2 - 110, 0, W / 2 + 110, 0);
  ['#3E7BFF', '#B05BFF', '#FF3B4E', '#FFC44D', '#3DE0A0'].forEach((col, i) => glass.addColorStop(i / 4, col));
  ctx.fillStyle = glass; ctx.fillRect(W / 2 - 110, y, 220, 3);
}
/** Draw one picture: the photograph is fetched, the painting done over it, and the result handed back as a JPEG. */
async function produce(c: CardInput, paint: (ctx: Ctx, img: HTMLImageElement | null) => void): Promise<Blob> {
  await Promise.all(['500 60px Cormorant', 'italic 400 40px Cormorant', '400 20px "Alte Haas"'].map((f) => document.fonts.load(f).catch(() => null)));
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;
  const blob = () => new Promise<Blob>((ok, no) => cv.toBlob((b) => (b ? ok(b) : no(new Error('no image'))), 'image/jpeg', 0.9));
  let img: HTMLImageElement | null = null;
  try { img = await loadImage(c.image || c.fallback); } catch { try { img = await loadImage(c.fallback); } catch { img = null; } }
  paint(ctx, img);
  try { return await blob(); } catch { paint(ctx, await loadImage(c.fallback).catch(() => null)); return blob(); }   // (a photograph that can't be copied: use the room's)
}

/** The first picture: the title (or a chosen line), the piece's sub caption, the writer, and "Read now". */
export function drawCard(c: CardInput): Promise<Blob> {
  return produce(c, (ctx, img) => {
    ground(ctx, img, 0.74, 0.9);
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
    glassLine(ctx, 1128);
    button(ctx, 'READ NOW', 1160);
    ctx.font = '400 21px "Alte Haas", sans-serif'; ctx.fillStyle = '#F3ECDC'; spaced(ctx, 'OVERGROWNALTAR.COM', W / 2, 1276, 7);
  });
}

/** The second picture, for a carousel: the piece's opening lines, as far as the page allows, then an arrow to the rest. */
export function drawExcerpt(c: CardInput): Promise<Blob> | null {
  const paras = (c.excerpt ?? []).map((p) => p.trim()).filter(Boolean);
  if (!paras.length) return null;
  return produce(c, (ctx, img) => {
    ground(ctx, img, 0.9, 0.95);
    // whose words these are
    ctx.strokeStyle = '#FFE3A3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2, 112); ctx.lineTo(W / 2, 162); ctx.moveTo(W / 2 - 14, 128); ctx.lineTo(W / 2 + 14, 128); ctx.stroke();
    ctx.font = 'italic 400 42px Cormorant, serif'; ctx.fillStyle = '#F3ECDC';
    const head = balanced(ctx, c.title, W - 300).slice(0, 2);
    head.forEach((l, i) => ctx.fillText(l, W / 2, 226 + i * 50));
    const hy = 226 + (head.length - 1) * 50;
    ctx.font = '400 17px "Alte Haas", sans-serif'; ctx.fillStyle = '#FFE3A3'; spaced(ctx, `BY ${c.author.toUpperCase()}`, W / 2, hy + 46, 6);
    // the opening lines, set as they are on the page: paragraphs for prose, line by line for a poem
    const x = 150, max = W - 300, size = 46, lh = 66, gap = 30, top = hy + 150, bottom = 1030;
    ctx.font = `500 ${size}px Cormorant, serif`; ctx.textAlign = 'left';
    const out: { text: string; y: number }[] = []; let y = top;
    all: for (const p of paras) {
      const poem = p.includes('\n');
      for (const row of poem ? p.split('\n').map((l) => l.trim()).filter(Boolean) : [p.replace(/\s+/g, ' ')]) {
        for (const line of wrap(ctx, row, max)) {
          if (y > bottom) break all;
          out.push({ text: line, y }); y += lh;
        }
      }
      y += gap;
    }
    if (out.length) {   // the last line trails off: there is always more of the piece than a picture holds
      let last = out[out.length - 1].text.replace(/[\s,;:.!?…]+$/, '');
      while (last.includes(' ') && ctx.measureText(last + '…').width > max) last = last.replace(/\s+\S+$/, '');
      out[out.length - 1].text = last + '…';
    }
    ctx.fillStyle = '#F3ECDC'; out.forEach((l) => ctx.fillText(l.text, x, l.y));
    ctx.textAlign = 'center';
    // the way to the rest
    glassLine(ctx, 1128);
    button(ctx, 'READ MORE AT OVERGROWNALTAR.COM', 1166, true);
  });
}

/** Make the post and show it: the pictures themselves, large, with Save and Share under them. Where the piece has words,
 *  there are two, made to be posted together as a carousel: the title, then its opening lines with the way to the rest.
 *  (A phone's own share sheet shows only a file's name and a paper icon, so the reader sees the real thing here first.)
 *  Returns what they did. */
export function shareCard(c: CardInput): Promise<'shared' | 'saved' | 'cancelled'> {
  return new Promise((resolve) => {
    const stem = c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'overgrown-altar';
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    const touch = matchMedia('(pointer: coarse)').matches;
    // An iPhone or iPad lets a website reach Photos only through its own sheet (or a press and hold), so Save goes that way there.
    const apple = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    let urls: string[] = [], files: File[] = [], canShare = false, did: 'shared' | 'saved' | 'cancelled' = 'cancelled';
    const box = document.createElement('div');
    box.className = 'sp'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Your social post');
    box.innerHTML = `<div class="sp-in">
      <button type="button" class="sp-x" data-sp-close aria-label="Close"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      <span class="eb sp-k">Your social post</span>
      <div class="sp-strip" data-sp-strip><div class="sp-frame"><span class="lab sp-wait">Making the post…</span></div></div>
      <div class="sp-dots" data-sp-dots hidden aria-hidden="true"><i class="on"></i><i></i></div>
      <div class="sp-acts" hidden>
        <a class="sp-btn sp-share" data-sp-save><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M8 11.5l4 3.5 4-3.5M6 19h12"/></svg>Save to images</a>
        <button type="button" class="sp-btn sp-save" data-sp-share hidden><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 15V4M8 7.5L12 4l4 3.5M6 12v7h12v-7"/></svg>Share</button>
      </div>
      <span class="lab sp-hint" hidden></span>
    </div>`;
    const close = () => {
      box.remove(); document.documentElement.classList.remove('sp-open'); removeEventListener('keydown', onKey);
      setTimeout(() => urls.forEach((u) => URL.revokeObjectURL(u)), 4000);
      resolve(did);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    box.addEventListener('click', async (e) => {
      const t = e.target as HTMLElement;
      if (t === box || t.closest('[data-sp-close]')) return close();
      const viaSheet = async (what: 'shared' | 'saved') => { try { await nav.share({ files }); did = what; } catch { /* they closed the sheet */ } };
      if (t.closest('[data-sp-save]')) {
        e.preventDefault();
        if (!files.length) return;
        if (apple && canShare) return void (await viaSheet('saved'));
        // elsewhere: each picture is saved in turn
        files.forEach((f, i) => setTimeout(() => { const a = document.createElement('a'); a.href = urls[i]; a.download = f.name; document.body.append(a); a.click(); a.remove(); }, i * 350));
        did = 'saved'; return;
      }
      if (t.closest('[data-sp-share]') && files.length) await viaSheet('shared');
    });
    addEventListener('keydown', onKey);
    document.body.append(box); document.documentElement.classList.add('sp-open');
    const second = drawExcerpt(c);
    Promise.all([drawCard(c), second ?? Promise.resolve(null)]).then((blobs) => {
      if (!box.isConnected) return;
      const made = blobs.filter(Boolean) as Blob[];
      files = made.map((b, i) => new File([b], made.length > 1 ? `${stem}-${i + 1}.jpg` : `${stem}.jpg`, { type: 'image/jpeg' }));
      urls = files.map((f) => URL.createObjectURL(f));
      const strip = box.querySelector<HTMLElement>('[data-sp-strip]')!;
      strip.replaceChildren(...urls.map((u, i) => { const f = document.createElement('div'); f.className = 'sp-frame'; const img = new Image(); img.src = u; img.className = 'sp-img';
        img.alt = i ? `The opening lines of ${c.title}, and where to read the rest` : `${c.title}, by ${c.author}: a social post`; f.append(img); return f; }));
      strip.classList.toggle('sp-two', urls.length > 1);
      const dots = box.querySelector<HTMLElement>('[data-sp-dots]')!; dots.hidden = urls.length < 2;
      strip.addEventListener('scroll', () => { const at = Math.round(strip.scrollLeft / Math.max(1, strip.clientWidth)); [...dots.children].forEach((d, i) => d.classList.toggle('on', i === at)); }, { passive: true });
      canShare = !!nav.canShare?.({ files }) && typeof nav.share === 'function';
      box.querySelector<HTMLElement>('[data-sp-share]')!.hidden = !canShare;
      const two = urls.length > 1, hint = box.querySelector<HTMLElement>('.sp-hint')!;
      hint.textContent = (two ? 'Two pictures, made to post together as a carousel. ' : '')
        + (apple ? `Choose “Save ${two ? '2 Images' : 'Image'}” when the sheet opens${two ? '' : ', or press and hold the picture'}.` : touch ? (two ? 'Swipe to see the second.' : 'Or press and hold the picture to save it.') : `${two ? 'They are' : 'It is'} saved with your downloads.`);
      box.querySelector<HTMLElement>('.sp-acts')!.hidden = false; hint.hidden = false;
    }).catch(() => { const w = box.querySelector('.sp-wait'); if (w) w.textContent = 'The post couldn’t be made. Close this and try again.'; });
  });
}
