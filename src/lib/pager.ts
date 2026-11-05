// Pages of a long list: six pieces to a page, with numbered pages that stay short however many there are.
// pageList(5, 17) -> [1, '…', 4, 5, 6, '…', 17]
export const PER_PAGE = 6;
export function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => keep.add(n));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => keep.add(n));
  const out: (number | '…')[] = [];
  [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b).forEach((n, i, all) => {
    if (i && n - all[i - 1] > 1) out.push('…');
    out.push(n);
  });
  return out;
}
