// Choosing what stays in view when the photograph is cropped.
// The same photograph is cut to different shapes around the site (a wide band on computers, nearly square on phones,
// a smaller card in lists), so rather than one fixed crop the writer marks the part that matters: tap or drag on the
// whole picture, and the three shapes below follow it. Saved as "x% y%" (pieces.image_focus), used as object-position.
import { useRef, type KeyboardEvent, type PointerEvent } from 'react';

const DEFAULT: [number, number] = [50, 45];
export function parseFocus(f: string | null | undefined): [number, number] {
  const m = (f ?? '').match(/^(\d{1,3})% (\d{1,3})%$/);
  return m ? [Math.min(100, +m[1]), Math.min(100, +m[2])] : DEFAULT;
}
const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)));

export function PhotoFocus({ src, focus, onChange }: { src: string; focus: string; onChange: (f: string) => void }) {
  const [x, y] = parseFocus(focus);
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const place = (e: PointerEvent<HTMLDivElement>) => {
    const r = box.current!.getBoundingClientRect();
    onChange(`${clamp(((e.clientX - r.left) / r.width) * 100)}% ${clamp(((e.clientY - r.top) / r.height) * 100)}%`);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault(); onChange(`${clamp(x + d[0])}% ${clamp(y + d[1])}%`);
  };
  const pos = `${x}% ${y}%`;
  return (
    <div className="pf">
      <p className="pf-help">The photograph is cropped to fit each place it appears. <b>Tap or drag</b> on the part that must stay in view.</p>
      <div ref={box} className="pf-whole" tabIndex={0} role="slider" aria-label="What stays in view"
        aria-valuetext={`${x}% across, ${y}% down`} aria-valuenow={x} aria-valuemin={0} aria-valuemax={100}
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); place(e); }}
        onPointerMove={(e) => { if (dragging.current) place(e); }}
        onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}
        onKeyDown={key}>
        <img src={src} alt="" draggable={false} />
        <span className="pf-mark" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true" />
      </div>
      <div className="pf-shapes" aria-label="How it will be cropped">
        {([['pf-wide', 'Top of the piece, computer'], ['pf-phone', 'Top of the piece, phone'], ['pf-card', 'In lists']] as const).map(([c, label]) => (
          <figure key={c} className={`pf-shape ${c}`}>
            <span className="pf-crop"><img src={src} alt="" style={{ objectPosition: pos }} /></span>
            <figcaption>{label}</figcaption>
          </figure>
        ))}
      </div>
      {focus && <button type="button" className="d-textbtn pf-reset" onClick={() => onChange('')}>Back to the middle</button>}
    </div>
  );
}
