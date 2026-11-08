// The ten prestige crests: clean, bold insignia in one design language. Every crest has the same heart, a cut gem
// in the rank's own color, and each rank keeps what the rank below had and adds one clear thing:
//   I    a steel medallion                    II   an outer ring
//   III  a steel shield                       IV   silver, and the first pair of blades
//   V    a second pair of blades, a chevron   VI   a crowned shield, three points
//   VII  gold, a third pair of blades, a glow VIII five points, a fourth pair, a second chevron
//   IX   a prism gem, a halo, a slow sunburst X    white gold, five pairs of blades, an ember field, a jeweled crown
// crestSvg(level, size) returns an <svg> string (viewBox 200 x 200). Moving parts are styled in prestige-page.css.
import { PRESTIGES } from './prestige';

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const mix = (a: string, b: string, t: number) => {
  const x = hex(a), y = hex(b);
  return '#' + [0, 1, 2].map((i) => Math.round(x[i] + (y[i] - x[i]) * t).toString(16).padStart(2, '0')).join('');
};
const f = (n: number) => +n.toFixed(1);

// The frame's metal: [light, base, dark]
const STEEL = ['#E6E9EE', '#99A2AE', '#3A414B'];
const SILVER = ['#FFFFFF', '#CDD5DE', '#56616E'];
const GOLD = ['#FFF3C4', '#E5B64A', '#7A560C'];
const WHITE_GOLD = ['#FFFFFF', '#FFE49A', '#A2701A'];
const metalFor = (lv: number) => (lv <= 3 ? STEEL : lv <= 6 ? SILVER : lv <= 9 ? GOLD : WHITE_GOLD);

// The gem's facets, light to dark (rainbow and gold ranks have their own)
const gemFor = (lv: number) => {
  const c = PRESTIGES[lv - 1].color;
  if (c === 'rainbow') return ['#3E7BFF', '#B05BFF', '#FF3B4E', '#3DE0A0'];
  if (c === 'gold') return ['#FFFFFF', '#FFF0B8', '#F2C65A', '#C08A1E'];
  return [mix(c, '#FFFFFF', .55), c, mix(c, '#000000', .3), mix(c, '#000000', .6)];
};
const fieldFor = (lv: number) => {
  const c = PRESTIGES[lv - 1].color;
  const t = c === 'rainbow' ? '#5B3FA8' : c === 'gold' ? '#B3261A' : c;
  return [mix(t, '#000000', .55), mix(t, '#000000', .86)];
};

// Shapes (centered on x = 100)
const MEDAL = 'M100 64 a38 38 0 1 1 -0.01 0 Z';
const SHIELD = 'M100 56 L138 68 V104 C138 130 121 147 100 156 C79 147 62 130 62 104 V68 Z';
const CROWNED = 'M62 66 L86 60 L100 50 L114 60 L138 66 V104 C138 131 121 149 100 158 C79 149 62 131 62 104 Z';
const shapeFor = (lv: number) => (lv <= 2 ? MEDAL : lv <= 5 ? SHIELD : CROWNED);
const CY = 104; // where the shapes are centered

let n = 0;
export function crestSvg(level: number, size = 120): string {
  const lv = Math.max(1, Math.min(10, level));
  const id = `cr${lv}-${++n}`;
  const [ml, mb, md] = metalFor(lv);
  const gem = gemFor(lv);
  const [f1, f2] = fieldFor(lv);
  const shape = shapeFor(lv);
  const out: string[] = [];

  out.push(`<defs>
    <linearGradient id="${id}-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ml}"/><stop offset=".5" stop-color="${mb}"/><stop offset="1" stop-color="${md}"/></linearGradient>
    <linearGradient id="${id}-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${ml}"/><stop offset=".6" stop-color="${mb}"/><stop offset="1" stop-color="${md}"/></linearGradient>
    <linearGradient id="${id}-f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${f1}"/><stop offset="1" stop-color="${f2}"/></linearGradient>
    <radialGradient id="${id}-g"><stop offset="0" stop-color="${gem[1]}" stop-opacity=".55"/><stop offset="1" stop-color="${gem[1]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}-r"><stop offset=".15" stop-color="${ml}" stop-opacity=".9"/><stop offset="1" stop-color="${mb}" stop-opacity="0"/></radialGradient>
    <clipPath id="${id}-c"><path d="${shape}"/></clipPath>
  </defs>`);

  // Glow (VII+)
  if (lv >= 7) out.push(`<circle class="crest-aura" cx="100" cy="${CY}" r="${lv >= 9 ? 96 : 84}" fill="url(#${id}-g)"/>`);

  // Sunburst (IX+): long thin rays that turn slowly
  if (lv >= 9) {
    const rays = lv === 10 ? 16 : 12;
    let r = '';
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2, w = 0.07, len = i % 2 ? 76 : 94;
      const p = (ang: number, d: number) => `${f(100 + Math.cos(ang) * d)} ${f(CY + Math.sin(ang) * d)}`;
      r += `<path d="M${p(a - w, 30)} L${p(a, len)} L${p(a + w, 30)} Z"/>`;
    }
    out.push(`<g class="crest-spin" fill="url(#${id}-r)">${r}</g>`);
  }

  // Halo (IX+), double at X
  if (lv >= 9) {
    out.push(`<circle cx="100" cy="${CY}" r="70" fill="none" stroke="url(#${id}-b)" stroke-width="3"/>`);
  }

  // Blades (IV+): clean angular wings, longest on top
  const pairs = lv >= 10 ? 5 : lv >= 8 ? 4 : lv >= 7 ? 3 : lv >= 5 ? 2 : lv >= 4 ? 1 : 0;
  const reach = lv >= 10 ? 46 : lv >= 8 ? 42 : 34;
  for (let i = pairs - 1; i >= 0; i--) {
    const L = reach * (1 - i * 0.16), y0 = 72 + i * 13, rise = 20 - i * 7;
    for (const s of [-1, 1]) {
      const x0 = 100 + s * 34, x1 = 100 + s * (36 + L), xm = 100 + s * (34 + L * 0.62);
      out.push(`<path d="M${x0} ${y0} L${f(x1)} ${f(y0 - rise)} L${f(xm)} ${f(y0 + 9)} L${x0} ${y0 + 12} Z" fill="url(#${id}-b)" stroke="${md}" stroke-width="1.4" stroke-linejoin="round"/>`);
    }
  }

  // Crown points (VI+): 3, then 5
  const points = lv >= 8 ? 5 : lv >= 6 ? 3 : 0;
  if (points) {
    const xs = points === 3 ? [-18, 0, 18] : [-28, -14, 0, 14, 28];
    for (const dx of xs) {
      const h = dx === 0 ? 30 : Math.abs(dx) <= 18 ? 22 : 15, x = 100 + dx, base = 62 - (dx === 0 ? 8 : 0) + Math.abs(dx) * 0.08;
      out.push(`<path d="M${x - 6} ${f(base)} L${x} ${f(base - h)} L${x + 6} ${f(base)} Z" fill="url(#${id}-m)" stroke="${md}" stroke-width="1.4" stroke-linejoin="round"/>`);
      if (lv >= 10 && dx === 0) out.push(`<circle cx="${x}" cy="${f(base - h)}" r="3.4" fill="#FFFFFF" stroke="${md}" stroke-width="1"/>`);
    }
  }

  // Chevrons beneath (V+), two at VIII+
  const chevrons = lv >= 8 ? 2 : lv >= 5 ? 1 : 0;
  for (let i = chevrons - 1; i >= 0; i--) {
    const y = (lv >= 6 ? 150 : 146) + i * 12;
    out.push(`<path d="M70 ${y} L100 ${y + 14} L130 ${y} V${y + 8} L100 ${y + 22} L70 ${y + 8} Z" fill="url(#${id}-m)" stroke="${md}" stroke-width="1.4" stroke-linejoin="round"/>`);
  }

  // The frame: metal rim, dark field inside, one bevel of light
  out.push(`<path d="${shape}" fill="url(#${id}-m)" stroke="${md}" stroke-width="2" stroke-linejoin="round"/>`);
  out.push(`<rect x="0" y="0" width="100" height="200" fill="#FFFFFF" opacity=".16" clip-path="url(#${id}-c)"/>`);
  const inset = (s: number) => `transform="translate(100 ${CY}) scale(${s}) translate(-100 -${CY})"`;
  out.push(`<path d="${shape}" ${inset(.8)} fill="url(#${id}-f)" stroke="${md}" stroke-width="1.6"/>`);
  out.push(`<path d="${shape}" ${inset(.72)} fill="none" stroke="${ml}" stroke-opacity=".28" stroke-width="1.2"/>`);
  // II: an outer ring around the medallion
  if (lv === 2) out.push(`<circle cx="100" cy="${CY - 2}" r="46" fill="none" stroke="url(#${id}-b)" stroke-width="3"/>`);

  // The gem: four facets to a center point, growing a little with rank
  const g = 0.78 + lv * 0.04, gy = CY - 2;
  const P = (x: number, y: number) => `${f(100 + x * g)} ${f(gy + y * g)}`;
  const T = P(0, -24), R = P(17, 0), B = P(0, 26), L = P(-17, 0), C = P(0, -2);
  out.push(`<path d="M${T} L${R} L${C} Z" fill="${gem[1]}"/><path d="M${T} L${L} L${C} Z" fill="${gem[0]}"/><path d="M${L} L${B} L${C} Z" fill="${gem[2]}"/><path d="M${R} L${B} L${C} Z" fill="${gem[3]}"/>`);
  out.push(`<path d="M${T} L${R} L${B} L${L} Z" fill="none" stroke="${mix(md, '#000000', .3)}" stroke-width="1.6" stroke-linejoin="round"/>`);
  out.push(`<path d="M${P(-4, -14)} L${P(0, -20)} L${P(1, -12)} Z" fill="#FFFFFF" opacity=".75"/>`);

  return `<svg class="crest crest-${lv}" viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${out.join('')}</svg>`;
}
