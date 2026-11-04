// Makes a photo the right size before it is uploaded, right in the browser.
// A phone photo is often 3–8 MB and 4000+ pixels wide; the site never shows it that large,
// so it is resized (longest side `maxSide`) and saved as a good-quality JPEG. Big photos are fine to choose.
export class TooSmall extends Error { constructor(public width: number, public height: number) { super('too small'); } }
export async function shrinkImage(file: File, maxSide: number, quality = 0.86, minWidth = 0): Promise<Blob> {
  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
  } catch {
    bitmap = await new Promise<HTMLImageElement>((ok, fail) => {
      const img = new Image(); img.onload = () => ok(img); img.onerror = () => fail(new Error('unreadable'));
      img.src = URL.createObjectURL(file);
    });
  }
  const w = 'naturalWidth' in bitmap ? bitmap.naturalWidth : bitmap.width;
  const h = 'naturalHeight' in bitmap ? bitmap.naturalHeight : bitmap.height;
  if (minWidth && w < minWidth) { if ('close' in bitmap) bitmap.close(); throw new TooSmall(w, h); }
  const scale = Math.min(1, maxSide / Math.max(w, h));
  // Already small, and already a JPEG/WebP: keep it as it is.
  if (scale === 1 && /image\/(jpeg|webp)/.test(file.type) && file.size < 1.5 * 1024 * 1024) return file;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);   // transparent PNGs get a white ground
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  if ('close' in bitmap) bitmap.close();
  return await new Promise<Blob>((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('unreadable'))), 'image/jpeg', quality));
}
