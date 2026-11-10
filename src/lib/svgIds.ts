// Badges, crests and trophies are drawn as SVG with gradients named by id. When the same drawing appears more than once
// on a page (the Desk and the Guild are open side by side, one hidden), the browser can take its colours from the hidden
// copy and draw nothing. Each drawing on screen gets its own ids, so every copy keeps its colours.
let n = 0;
const cache = new Map<string, string>();
export function uniqueIds(svg: string, key?: string): string {
  if (key && cache.has(key)) return cache.get(key)!;
  const tag = `u${(++n).toString(36)}`;
  const ids = [...new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))];
  let out = svg;
  for (const id of ids) {
    const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`id="${esc}"`, 'g'), `id="${id}-${tag}"`).replace(new RegExp(`#${esc}([)"])`, 'g'), `#${id}-${tag}$1`);
  }
  if (key) cache.set(key, out);
  return out;
}
