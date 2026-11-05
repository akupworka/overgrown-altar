// A photography piece's photograph, shown whole (never cropped), with its caption and the details behind the lens.
// Used on the published page (drawn ahead of time by Astro), the live stand-in page, the Desk preview and the editor's reading.
import { lensRows, type PhotoMeta } from '../lib/photo';

export function PhotoPlate({ src, alt, meta }: { src: string; alt?: string; meta?: PhotoMeta | null }) {
  const rows = lensRows(meta);
  return (
    <div className="pp">
      <figure className="pp-fig">
        <img src={src} alt={alt || ''} loading="eager" />
        {alt && <figcaption className="pp-cap">{alt}</figcaption>}
      </figure>
      {rows.length > 0 && (
        <aside className="pp-lens" aria-label="Behind the lens">
          <span className="eb pp-lens-h">Behind the lens</span>
          <dl>{rows.map(([k, v]) => <div key={k}><dt className="lab">{k}</dt><dd>{v}</dd></div>)}</dl>
        </aside>
      )}
    </div>
  );
}
