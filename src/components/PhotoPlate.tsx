// A photography piece's photograph, shown whole (never cropped), with its caption and the details behind the lens.
// Used on the published page (drawn ahead of time by Astro), the live stand-in page, the Desk preview and the editor's reading.
import { lensRows, cleanGallery, type PhotoMeta, type GalleryItem } from '../lib/photo';

export function PhotoPlate({ src, alt, meta, gallery }: { src: string; alt?: string; meta?: PhotoMeta | null; gallery?: GalleryItem[] | null }) {
  const rows = lensRows(meta);
  const more = cleanGallery(gallery);
  return (
    <div className="pp">
      <figure className="pp-fig">
        <a className="pp-main" href={src} data-zoom data-caption={alt || ''} aria-label="Open the photograph full size"><img src={src} alt={alt || ''} loading="eager" /></a>
        {alt && <figcaption className="pp-cap">{alt}</figcaption>}
      </figure>
      {/* Up to four more, smaller, beneath it; each opens full size (BaseLayout's viewer). */}
      {more.length > 0 && (
        <div className="pp-more">
          {more.map((g, i) => (
            <a key={g.src} className="pp-thumb" href={g.src} data-zoom data-caption={g.caption || ''} aria-label={g.caption ? `Open: ${g.caption}` : `Open photograph ${i + 2}`}>
              <img src={g.src} alt={g.caption || ''} loading="lazy" />
            </a>
          ))}
        </div>
      )}
      {rows.length > 0 && (
        <aside className="pp-lens" aria-label="Behind the lens">
          <span className="eb pp-lens-h">Behind the lens</span>
          <dl>{rows.map(([k, v]) => <div key={k}><dt className="lab">{k}</dt><dd>{v}</dd></div>)}</dl>
        </aside>
      )}
    </div>
  );
}
