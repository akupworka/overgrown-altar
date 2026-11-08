// The ten prestige crests. Each rank keeps everything the rank below had and adds to it, so the crest
// grows grander with every step:
//   I    a roundel, an ink drop                       II   a double ring, a flame
//   III  a shield, a quill                            IV   a banner with its numeral, a torch
//   V    an ornate shield, a stone (mural) crown, a keystone arch
//   VI   the shield in stained glass and lead, laurel branches
//   VII  a jeweled crown, gold studs, rays of light, a glow
//   VIII wings, a tower
//   IX   a rose window of every color, a radiant crown with stars, rays that turn
//   X    six wings, a ring of fire, all in gold
// crestSvg(level, size) returns an <svg> string (viewBox 200 x 230). Styles for the moving parts live in prestige-page.css.
import { PRESTIGES } from './prestige';

type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const css = ([r, g, b]: RGB) => `rgb(${r | 0},${g | 0},${b | 0})`;
const mix = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return css([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as RGB); };
const RAINBOW = ['#3E7BFF', '#5B6CFF', '#8A5BF0', '#B05BFF', '#E0457A', '#FF3B4E', '#FF7A3D', '#FFC44D', '#B6D94A', '#3DE0A0', '#2EC4C9', '#3EA0FF'];

// Each rank's metal: [light, base, dark]
function metal(level: number): [string, string, string] {
  const p = PRESTIGES[level - 1];
  if (p.color === 'gold' || level === 10) return ['#FFF4C8', '#E2B54A', '#7A560C'];
  if (p.color === 'rainbow') return ['#F5EEFF', '#C9A7FF', '#3B2A6B'];
  return [mix(p.color, '#FFFFFF', .55), p.color, mix(p.color, '#000000', .55)];
}

// Shapes
const ROUNDEL = 'M100 62 a46 46 0 1 1 -0.01 0 Z';
const HEATER = 'M62 62 H138 V114 C138 148 120 168 100 180 C80 168 62 148 62 114 Z';
const ORNATE = 'M58 60 Q79 50 100 60 Q121 50 142 60 L142 112 C142 150 122 172 100 184 C78 172 58 150 58 112 Z';
const shieldFor = (lv: number) => (lv <= 2 ? ROUNDEL : lv <= 4 ? HEATER : ORNATE);

// Emblems, drawn in a 40 x 40 box centered at (100, 112)
const EMBLEM: Record<number, string> = {
  1: 'M100 94 C108 106 113 113 113 120 a13 13 0 0 1 -26 0 C87 113 92 106 100 94 Z',
  2: 'M100 92 C108 102 114 108 114 118 a14 14 0 0 1 -28 0 C86 112 90 107 93 102 C95 108 97 110 99 110 C98 104 97 99 100 92 Z',
  3: 'M118 92 C104 96 94 108 90 124 L86 132 M90 124 C98 122 106 116 110 108 M108 98 L112 102 M84 134 H116',
  4: 'M96 128 L104 128 L102 140 L98 140 Z M93 126 H107 M100 92 C107 100 110 106 110 113 a10 10 0 0 1 -20 0 C90 108 93 104 95 101 C97 105 98 106 99 106 C99 102 98 98 100 92 Z',
  5: 'M84 136 V112 a16 16 0 0 1 32 0 V136 M92 136 V113 a8 8 0 0 1 16 0 V136 M96 96 L100 90 L104 96 Z M80 136 H120',
  6: 'M100 92 a20 20 0 1 1 -0.01 0 M100 102 a10 10 0 1 1 -0.01 0 M100 92 V102 M100 122 V132 M80 112 H90 M110 112 H120 M86 98 L93 105 M107 119 L114 126 M86 126 L93 119 M107 105 L114 98',
  7: 'M100 90 L105 105 L120 102 L109 112 L120 122 L105 119 L100 134 L95 119 L80 122 L91 112 L80 102 L95 105 Z',
  8: 'M86 138 V104 H90 V98 H95 V104 H98 V98 H102 V104 H105 V98 H110 V104 H114 V138 Z M96 138 V126 a4 4 0 0 1 8 0 V138 M97 112 H103 V119 H97 Z',
  9: 'M100 98 a14 14 0 1 1 -0.01 0 M100 84 V92 M100 132 V140 M72 112 H80 M120 112 H128 M80 92 L86 98 M114 126 L120 132 M80 132 L86 126 M114 98 L120 92',
  10: 'M100 86 V140 M84 104 H116 M100 86 C106 92 108 96 106 100 C104 96 102 95 100 95 C98 95 96 96 94 100 C92 96 94 92 100 86 Z',
};

// Wings: feathers fanned from a shoulder at (sx, sy), pointing away from the shield
function wing(sx: number, sy: number, side: 1 | -1, spread: number, len: number, n: number, light: string, dark: string, id: string) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = (-70 + (i / (n - 1)) * spread) * (Math.PI / 180);
    const l = len * (1 - i * 0.06);
    const x = sx + side * Math.cos(a) * l * 0.5, y = sy + Math.sin(a) * l * 0.5;
    const rot = (side === 1 ? 0 : 180) + (a * 180) / Math.PI;
    out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(l / 2).toFixed(1)}" ry="${(5.2 - i * 0.2).toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="url(#${id}-wing)" stroke="${dark}" stroke-width=".8"/>`;
  }
  return out;
}

// Laurel: leaves along an arc on one side
function laurel(side: 1 | -1, color: string, dark: string) {
  let out = `<path d="M${100 + side * 18} 196 Q${100 + side * 70} 170 ${100 + side * 64} 92" fill="none" stroke="${dark}" stroke-width="1.6"/>`;
  for (let i = 0; i < 9; i++) {
    const t = i / 8, x = 100 + side * (18 + 52 * Math.sin(t * Math.PI * 0.62)) , y = 196 - t * 104;
    const rot = side * (-40 - t * 50);
    out += `<ellipse cx="${(x + side * 7).toFixed(1)}" cy="${y.toFixed(1)}" rx="8" ry="3.6" transform="rotate(${rot.toFixed(1)} ${(x + side * 7).toFixed(1)} ${y.toFixed(1)})" fill="${color}" stroke="${dark}" stroke-width=".6"/>`;
    out += `<ellipse cx="${(x - side * 6).toFixed(1)}" cy="${(y + 4).toFixed(1)}" rx="7" ry="3.2" transform="rotate(${(-rot).toFixed(1)} ${(x - side * 6).toFixed(1)} ${(y + 4).toFixed(1)})" fill="${color}" stroke="${dark}" stroke-width=".6"/>`;
  }
  return out;
}

export function crestSvg(level: number, size = 120): string {
  const lv = Math.max(1, Math.min(10, level));
  const [light, base, dark] = metal(lv);
  const id = `cr${lv}x${Math.random().toString(36).slice(2, 7)}`;
  const shield = shieldFor(lv);
  const numeral = PRESTIGES[lv - 1].numeral;
  const gold = ['#FFF4C8', '#E2B54A', '#7A560C'];
  const parts: string[] = [];

  // defs
  parts.push(`<defs>
    <linearGradient id="${id}-m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${light}"/><stop offset=".5" stop-color="${base}"/><stop offset="1" stop-color="${dark}"/></linearGradient>
    <linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${gold[0]}"/><stop offset=".5" stop-color="${gold[1]}"/><stop offset="1" stop-color="${gold[2]}"/></linearGradient>
    <linearGradient id="${id}-wing" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${lv === 10 ? '#FFF8DC' : '#F3ECDC'}"/><stop offset="1" stop-color="${lv === 10 ? '#E2B54A' : mix(PRESTIGES[lv - 1].color.startsWith('#') ? PRESTIGES[lv - 1].color : '#C9A7FF', '#F3ECDC', .5)}"/></linearGradient>
    <radialGradient id="${id}-aura"><stop offset="0" stop-color="${lv === 9 ? '#C9A7FF' : lv === 10 ? '#FFD36B' : base}" stop-opacity="${lv >= 9 ? .75 : .45}"/><stop offset="1" stop-color="${base}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}-shine" cx=".35" cy=".25" r=".8"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <clipPath id="${id}-clip"><path d="${shield}"/></clipPath>
  </defs>`);

  // VII+: an aura behind everything
  if (lv >= 7) parts.push(`<circle class="crest-aura" cx="100" cy="112" r="${lv >= 9 ? 104 : 88}" fill="url(#${id}-aura)"/>`);
  // VII+: rays of light (IX: more, and they turn; X: flames)
  if (lv >= 7) {
    const n = lv >= 9 ? 32 : 16;
    let rays = '';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, w = lv === 10 ? 0.07 : 0.035, r1 = 74, r2 = lv >= 9 ? (i % 2 ? 98 : 112) : 96;
      const p = (ang: number, r: number) => `${(100 + Math.cos(ang) * r).toFixed(1)} ${(112 + Math.sin(ang) * r).toFixed(1)}`;
      rays += lv === 10
        ? `<path d="M${p(a - w, r1)} Q${p(a + w * 0.6, (r1 + r2) / 2)} ${p(a, r2 + 6)} Q${p(a - w * 0.6, (r1 + r2) / 2)} ${p(a + w, r1)} Z" fill="url(#${id}-g)" opacity=".85"/>`
        : `<path d="M${p(a - w, r1)} L${p(a, r2)} L${p(a + w, r1)} Z" fill="${lv === 9 ? RAINBOW[i % 12] : gold[1]}" opacity="${lv === 9 ? .8 : .55}"/>`;
    }
    parts.push(`<g class="${lv >= 9 ? 'crest-spin' : ''}" style="transform-origin:100px 112px">${rays}</g>`);
  }
  // X: a ring of fire
  if (lv === 10) parts.push(`<circle cx="100" cy="112" r="80" fill="none" stroke="url(#${id}-g)" stroke-width="3" opacity=".9"/><circle cx="100" cy="112" r="86" fill="none" stroke="#FFD36B" stroke-width="1" opacity=".5" stroke-dasharray="2 5"/>`);

  // VIII+: wings (X: six, in three pairs)
  if (lv >= 8) {
    const pairs = lv === 10 ? [[92, 70, 9, 98], [112, 60, 8, 84], [148, 52, 7, 64]] : [[100, 90, 8, 92]];
    for (const [sy, spread, n, len] of pairs) {
      parts.push(wing(lv === 10 && sy === 92 ? 64 : 62, sy, -1, spread, len, n, light, lv === 10 ? '#7A560C' : dark, id));
      parts.push(wing(lv === 10 && sy === 92 ? 136 : 138, sy, 1, spread, len, n, light, lv === 10 ? '#7A560C' : dark, id));
    }
  }
  // VI+: laurel branches
  if (lv >= 6) {
    const leaf = lv >= 9 ? gold[1] : lv >= 7 ? '#C9A23A' : '#7E9A62', ld = lv >= 7 ? '#5E4410' : '#3E5230';
    parts.push(laurel(-1, leaf, ld), laurel(1, leaf, ld));
  }

  // The shield (or roundel): the rank's metal; VI+ in stained glass; IX a rose window
  parts.push(`<path d="${shield}" fill="url(#${id}-m)"/>`);
  if (lv >= 6 && lv !== 9) {
    // stained glass panes in tints of the rank's color, with lead between
    let g = '';
    const tints = [light, base, mix(dark, base, .5), mix(light, base, .4), base, dark];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) g += `<rect x="${56 + c * 18}" y="${50 + r * 20}" width="18" height="20" fill="${tints[(r * 2 + c * 3) % tints.length]}" opacity=".75"/>`;
    for (let c = 1; c < 5; c++) g += `<line x1="${56 + c * 18}" y1="48" x2="${56 + c * 18}" y2="190" stroke="#1A1612" stroke-width="2"/>`;
    for (let r = 1; r < 7; r++) g += `<line x1="54" y1="${50 + r * 20}" x2="146" y2="${50 + r * 20}" stroke="#1A1612" stroke-width="2"/>`;
    parts.push(`<g clip-path="url(#${id}-clip)">${g}</g>`);
  }
  if (lv === 9) {
    let rose = '';
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / 12) * Math.PI * 2 - Math.PI / 2;
      rose += `<path d="M100 116 L${(100 + Math.cos(a0) * 70).toFixed(1)} ${(116 + Math.sin(a0) * 70).toFixed(1)} A70 70 0 0 1 ${(100 + Math.cos(a1) * 70).toFixed(1)} ${(116 + Math.sin(a1) * 70).toFixed(1)} Z" fill="${RAINBOW[i]}" stroke="#1A1612" stroke-width="2"/>`;
    }
    rose += `<circle cx="100" cy="116" r="30" fill="none" stroke="#1A1612" stroke-width="2.5"/><circle cx="100" cy="116" r="14" fill="#FFF4C8" stroke="#1A1612" stroke-width="2"/>`;
    parts.push(`<g clip-path="url(#${id}-clip)">${rose}</g>`);
  }
  parts.push(`<path d="${shield}" fill="url(#${id}-shine)"/>`);
  // borders: one ring (I), two (II+), a gold edge (V+)
  parts.push(`<path d="${shield}" fill="none" stroke="${lv >= 5 ? `url(#${id}-g)` : light}" stroke-width="${lv >= 5 ? 4 : 2.5}"/>`);
  if (lv >= 2) parts.push(`<path d="${shield}" fill="none" stroke="${dark}" stroke-width="1.2" transform="translate(100 115) scale(.88) translate(-100 -115)"/>`);
  // VII+: gold studs along the edge
  if (lv >= 7) for (const [x, y] of [[58, 60], [79, 55], [100, 60], [121, 55], [142, 60], [58, 100], [142, 100]]) parts.push(`<circle cx="${x}" cy="${y}" r="3.2" fill="url(#${id}-g)" stroke="#5E4410" stroke-width=".6"/>`);

  // the emblem
  const emblemFill = lv === 9 || lv === 10 ? '#1A1612' : lv >= 6 ? '#1A1612' : dark;
  if (lv === 10) parts.push(`<path d="${EMBLEM[10]}" fill="#FFF4C8" stroke="#3A2A08" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="${EMBLEM[10]}" fill="#FFF4C8" stroke="#FFF4C8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`);
  else parts.push(`<path d="${EMBLEM[lv]}" fill="${[1, 2, 7].includes(lv) || lv === 4 ? (lv >= 6 ? '#FFF4C8' : light) : 'none'}" stroke="${lv >= 6 ? '#FFF4C8' : emblemFill}" stroke-width="${lv >= 6 ? 2.6 : 2.2}" stroke-linecap="round" stroke-linejoin="round" ${lv === 9 ? 'opacity="0"' : ''}/>`);

  // V+: crowns (V–VI mural, VII–VIII jeweled, IX–X radiant)
  if (lv >= 5 && lv <= 6) parts.push(`<path d="M72 54 V38 H80 V44 H88 V38 H96 V44 H104 V38 H112 V44 H120 V38 H128 V54 Z" fill="url(#${id}-m)" stroke="${dark}" stroke-width="1.2"/><path d="M72 48 H128" stroke="${dark}" stroke-width=".8"/>`);
  if (lv >= 7 && lv <= 8) parts.push(`<path d="M70 56 L68 32 L82 44 L91 26 L100 40 L109 26 L118 44 L132 32 L130 56 Z" fill="url(#${id}-g)" stroke="#5E4410" stroke-width="1.2"/>`
    + [[68, 32, '#4A7BEA'], [91, 26, '#D2404F'], [100, 38, '#33B07A'], [109, 26, '#D2404F'], [132, 32, '#4A7BEA']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${c}" stroke="#FFF4C8" stroke-width=".8"/>`).join(''));
  if (lv >= 9) {
    parts.push(`<path d="M66 58 L62 28 L76 40 L82 16 L92 34 L100 8 L108 34 L118 16 L124 40 L138 28 L134 58 Z" fill="url(#${id}-g)" stroke="#5E4410" stroke-width="1.2"/><path d="M96 14 H104 M100 4 V24" stroke="#FFF4C8" stroke-width="2.4" stroke-linecap="round"/>`
      + [[62, 28], [82, 16], [118, 16], [138, 28]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${lv === 9 ? RAINBOW[i * 3] : '#FFF4C8'}" stroke="#7A560C" stroke-width=".7"/>`).join(''));
    for (const [x, y] of [[40, 40], [160, 40], [30, 78], [170, 78]]) parts.push(`<path d="M${x} ${y - 6} L${x + 1.6} ${y - 1.6} L${x + 6} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 6} L${x - 1.6} ${y + 1.6} L${x - 6} ${y} L${x - 1.6} ${y - 1.6} Z" class="crest-star" fill="#FFF4C8"/>`);
  }

  // IV+: the banner, with the rank's numeral
  if (lv >= 4) parts.push(`<path d="M44 196 L58 190 L142 190 L156 196 L148 205 L156 214 L136 214 L132 208 L68 208 L64 214 L44 214 L52 205 Z" fill="${lv >= 7 ? `url(#${id}-g)` : `url(#${id}-m)`}" stroke="${lv >= 7 ? '#5E4410' : dark}" stroke-width="1.2"/><text x="100" y="${lv >= 4 ? 203.5 : 0}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="13" letter-spacing="3" fill="${lv >= 7 ? '#3A2A08' : '#1A1612'}">${numeral}</text>`);

  return `<svg class="crest crest-${lv}" viewBox="0 0 200 230" width="${size}" height="${Math.round(size * 1.15)}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${parts.join('')}</svg>`;
}
