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

// The row of page buttons, as HTML for the static pages' small scripts (buttons carry data-go="<page>").
const arrow = (d: 'l' | 'r') => `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="${d === 'l' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}"/></svg>`;
export function pagerHtml(page: number, pages: number, newer = 'Newer', older = 'Older'): string {
  if (pages < 2) return '';
  return `<button type="button" class="pg-step" data-go="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="${newer} pieces">${arrow('l')}<span class="pg-word">${newer}</span></button>` +
    pageList(page, pages).map((n) => n === '…' ? '<span class="pg-gap" aria-hidden="true">…</span>'
      : `<button type="button" class="pg-n" data-go="${n}" ${n === page ? 'aria-current="page"' : ''} aria-label="Page ${n} of ${pages}">${n}</button>`).join('') +
    `<button type="button" class="pg-step" data-go="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="${older} pieces"><span class="pg-word">${older}</span>${arrow('r')}</button>`;
}

// The page a list is on, kept in the address (?page=3): coming back from a piece returns to the same page.
export const pageFromUrl = () => Math.max(1, Number(new URL(location.href).searchParams.get('page')) || 1);
export function rememberPage(page: number) {
  const u = new URL(location.href);
  page === 1 ? u.searchParams.delete('page') : u.searchParams.set('page', String(page));
  history.replaceState(history.state, '', u.pathname + u.search + u.hash);
}
