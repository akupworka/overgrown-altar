import { useState } from 'react';
import { loadComfort, saveComfort } from '../../lib/comfort';

/** Reading comfort: smaller or larger text, and night reading. Remembered on this device and shared with the public
 *  piece pages (the same setting, kept under the same name), so a reader's choice follows them everywhere. */
export function ReadComfort() {
  const [r, setR] = useState(loadComfort);
  const size = Math.max(-1, Math.min(2, Number(r.size) || 0));
  const set = (next: { size?: number; night?: boolean }) => {
    saveComfort(next);
    const html = document.documentElement, sz = Math.max(-1, Math.min(2, Number(next.size) || 0));
    sz ? html.setAttribute('data-rs', String(sz)) : html.removeAttribute('data-rs');
    html.toggleAttribute('data-night', !!next.night);
    setR(next);
  };
  return (
    <div className="m-comfort" role="group" aria-label="Reading comfort">
      <button type="button" className="rt-btn m-cf" disabled={size <= -1} onClick={() => set({ ...r, size: size - 1 })} aria-label="Smaller text">A<sup>−</sup></button>
      <button type="button" className="rt-btn m-cf m-cf-up" disabled={size >= 2} onClick={() => set({ ...r, size: size + 1 })} aria-label="Larger text">A<sup>+</sup></button>
      <button type="button" className="rt-btn m-cf-night" aria-pressed={!!r.night} onClick={() => set({ ...r, night: !r.night })} aria-label="Night reading">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></svg>
        <span className="m-cf-w">Night</span>
      </button>
    </div>
  );
}
