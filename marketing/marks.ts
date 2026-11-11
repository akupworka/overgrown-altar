// Draws every crest and trophy with the site's own code, for the ads (ids made unique so many can share a page).
import { writeFileSync } from 'fs';
import { crestSvg } from '../src/lib/crests';
import { TROPHIES, trophySvg } from '../src/lib/trophies';
import { PRESTIGES } from '../src/lib/prestige';
let n = 0;
const uniq = (svg: string) => { const tag = `m${(++n).toString(36)}_`; const ids = [...new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))]; let out = svg; for (const id of ids) out = out.split(`"${id}"`).join(`"${tag}${id}"`).split(`#${id})`).join(`#${tag}${id})`).split(`#${id}"`).join(`#${tag}${id}"`); return out; };
const crests = PRESTIGES.map((p) => ({ level: p.level, numeral: p.numeral, name: p.name, note: p.note, svg: uniq(crestSvg(p.level, 400, { glow: true })) }));
const trophies = TROPHIES.map((t) => ({ id: t.id, name: t.name, tier: t.tier, svg: uniq(trophySvg(t, 300, t.tier === 'bronze' ? (['bronze', 'silver', 'gold', 'gold', 'silver'] as const)[TROPHIES.indexOf(t) % 5] : t.tier, false, true)) }));
writeFileSync(process.argv[2], JSON.stringify({ crests, trophies }));
console.log(crests.length, 'crests', trophies.length, 'trophies', trophies.filter((t) => t.tier === 'rainbow').map((t) => t.id).join(','));
