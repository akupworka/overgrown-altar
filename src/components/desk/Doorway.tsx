// The doorway: the way into the Guild. A pointed arch draws itself in light around the form,
// the nave breathes behind it, and dust drifts through the light. Styles: src/styles/doorway.css.
import type { ReactNode } from 'react';
import { CROSS_PATH } from '../../lib/crossPath';

const MOTES = Array.from({ length: 16 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return { left: `${(16 + r(1) * 68).toFixed(1)}%`, bottom: `${(r(2) * 40).toFixed(1)}%`,
    ['--s' as any]: `${(1 + r(3) * 2.2).toFixed(1)}px`, ['--t' as any]: `${(14 + r(4) * 14).toFixed(1)}s`,
    ['--d' as any]: `-${(r(5) * 20).toFixed(1)}s`, ['--x' as any]: `${((r(6) - .5) * 60).toFixed(0)}px` };
});

export function Doorway({ kicker, title, lead, children, foot }: { kicker: string; title: string; lead?: string; children: ReactNode; foot?: ReactNode }) {
  return (
    <div className="dw">
      <div className="dw-backdrop" aria-hidden="true">
        <div className="dw-nave"><img src="/images/folios-photo-2-1200.jpg" alt="" /></div>
        <div className="dw-shaft" />
        <div className="dw-vignette" />
        <div className="dw-motes">{MOTES.map((s, i) => <i key={i} style={s} />)}</div>
      </div>
      <div className="dw-arch-wrap">
        <svg className="dw-arch" viewBox="0 0 600 1000" preserveAspectRatio="none" aria-hidden="true">
          <path className="dw-line" pathLength={1} d="M0,1000 L0,430 C0,190 150,60 300,0 C450,60 600,190 600,430 L600,1000" />
          <path className="dw-line inner" pathLength={1} d="M18,1000 L18,436 C18,206 160,82 300,24 C440,82 582,206 582,436 L582,1000" />
        </svg>
        <div className="dw-glow" aria-hidden="true" />
        <div className="dw-threshold">
          <svg className="dw-cross" viewBox="0 0 603 883" width="26" height="38" aria-hidden="true"><path d={CROSS_PATH} /></svg>
          <span className="eb dw-kicker">{kicker}</span>
          <h1 className="dw-title">{title}</h1>
          {lead && <p className="dw-lead">{lead}</p>}
          <div className="dw-body">{children}</div>
        </div>
      </div>
      {foot && <div className="dw-foot">{foot}</div>}
    </div>
  );
}

/** A single-line field, like a threshold. Put a button inside with `action` for "Enter →" style. */
export function Line({ label, action, ...input }: { label: string; action?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="dw-field">
      <span className="dw-label">{label}</span>
      <span className="dw-line-row">
        <input {...input} />
        {action}
      </span>
    </label>
  );
}

export const Arrow = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
