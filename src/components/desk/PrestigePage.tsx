// The ten prestiges, as a window of stained glass.
//   Where you stand: your rank inside a ring that fills toward the next, in that rank's own glass.
//   The climb: ten lancets, rising from Inkling to Seraph (side by side on a computer, a vertical climb on a phone);
//     the ranks you've reached are lit, yours glows, the rest wait in shadow. Choose one to see what it takes and who holds it.
//   The trophies: one set at a time (those that grow, those won once).
// Used at /guild/members/?view=prestige (MembersApp). Open to visitors as well as members.
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { supabase, portraitUrl, type Profile } from '../../lib/supabase';
import { PRESTIGES, prestigeFor, type Prestige } from '../../lib/prestige';
import { Initials } from './DeskApp';
import { TrophyCatalogue } from './Trophies';
import { crestSvg } from '../../lib/crests';

// A rank's crest (drawn once per rank and size).
const crestCache = new Map<string, string>();
function Crest({ lv, size, className = '' }: { lv: number; size: number; className?: string }) {
  const key = `${lv}-${size}`;
  if (!crestCache.has(key)) crestCache.set(key, crestSvg(lv, size));
  return <span className={`pzx-crest ${className}`} dangerouslySetInnerHTML={{ __html: crestCache.get(key)! }} />;
}
import '../../styles/prestige-page.css';

const authorSlug = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'member';
// Each rank's glass, as a CSS fill (rainbow and gold are their own).
export const glassOf = (p: Prestige) => p.color === 'rainbow'
  ? 'linear-gradient(180deg, #3E7BFF, #B05BFF 25%, #FF3B4E 50%, #FFC44D 75%, #3DE0A0)'
  : p.color === 'gold' ? 'linear-gradient(180deg, #FFF0B8, #E9C46A 35%, #D2A23A 60%, #7A560C)'
  : `linear-gradient(180deg, color-mix(in srgb, ${p.color} 55%, white), ${p.color} 45%, color-mix(in srgb, ${p.color} 55%, black))`;
const inkOf = (p: Prestige) => (p.color === 'rainbow' ? '#C9A7FF' : p.color === 'gold' ? '#F2D27A' : `color-mix(in srgb, ${p.color} 70%, white)`);

export function PrestigePage({ me, link }: { me: string; link: (to: string, cls: string, children: ReactNode) => ReactNode }) {
  const [people, setPeople] = useState<(Profile & { count: number })[] | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [trophies, setTrophies] = useState<'growing' | 'once'>('growing');
  useEffect(() => {
    (async () => {
      const [{ data: ps }, { data: work }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('pieces').select('author_id').eq('status', 'approved'),
      ]);
      const counts = new Map<string, number>();
      (Array.isArray(work) ? work : []).forEach((w: any) => counts.set(w.author_id, (counts.get(w.author_id) ?? 0) + 1));
      setPeople((Array.isArray(ps) ? (ps as Profile[]) : []).map((p) => ({ ...p, count: counts.get(p.id) ?? 0 })));
    })();
  }, []);
  const mine = people?.find((p) => p.id === me)?.count ?? 0;
  const { current, next, toNext } = prestigeFor(mine);
  const from = current?.at ?? 0;
  const pct = next ? Math.max(0.04, (mine - from) / (next.at - from)) : 1;
  const holders = useMemo(() => (level: number) => (people ?? []).filter((p) => (p.listed || p.id === me) && prestigeFor(p.count).current?.level === level), [people, me]);
  const pick = chosen ?? current?.level ?? 1;
  const sel = PRESTIGES.find((p) => p.level === pick)!;
  if (!people) return <p className="lab mut d-loading">Opening…</p>;

  const face = (h: Profile) => me
    ? <span key={h.id}>{link(`/guild/members/?m=${h.id}`, 'pzx-face', <><Initials name={h.display_name} size={34} src={portraitUrl(h.portrait_path)} /><span>{h.display_name}</span></>)}</span>
    : <a key={h.id} href={`/guild/authors/${authorSlug(h.display_name)}/`} className="pzx-face"><Initials name={h.display_name} size={34} src={portraitUrl(h.portrait_path)} /><span>{h.display_name}</span></a>;
  const R = 74, C = 2 * Math.PI * R;

  return (
    <div className="pzx">
      <header className="pzx-head">
        {me && link('/guild/members/', 'm-back lab', '← The Guild')}
        <span className="eb">The Guild</span>
        <h1 className="h1">The ten prestiges</h1>
        <p className="it pzx-lead">Every published piece raises a member through the ranks of the Guild, from a first inkling to the burning ones. Each rank is a color of glass; badges change the moment the editor publishes.</p>
      </header>

      {/* Where you stand */}
      <section className="pzx-stand" style={{ '--ink': current ? inkOf(current) : '#CFC8B8' } as CSSProperties}>
        <div className="pzx-ring" aria-hidden="true">
          <svg viewBox="0 0 180 180" width="180" height="180">
            <defs>
              <linearGradient id="pzx-g" x1="0" y1="0" x2="1" y2="1">
                {current?.color === 'rainbow'
                  ? <><stop offset="0" stopColor="#3E7BFF" /><stop offset=".35" stopColor="#B05BFF" /><stop offset=".6" stopColor="#FF3B4E" /><stop offset=".8" stopColor="#FFC44D" /><stop offset="1" stopColor="#3DE0A0" /></>
                  : <><stop offset="0" stopColor={current ? (current.color === 'gold' ? '#FFF0B8' : current.color) : '#8C8679'} /><stop offset="1" stopColor={current ? (current.color === 'gold' ? '#D2A23A' : current.color) : '#5E5A50'} /></>}
              </linearGradient>
            </defs>
            <circle cx="90" cy="90" r={R} className="pzx-ring-track" />
            <circle cx="90" cy="90" r={R} className="pzx-ring-fill" stroke="url(#pzx-g)" strokeDasharray={`${C * pct} ${C}`} />
          </svg>
          <div className="pzx-ring-in">
            {current ? <Crest lv={current.level} size={112} className="pzx-ring-crest" /> : <span className="pzx-ring-num">·</span>}
          </div>
        </div>
        <div className="pzx-stand-text">
          <span className="lab mut">{me ? 'Where you stand' : 'Earn your first'}</span>
          {me && current && <span className="lab pzx-rank-of">Rank {current.numeral} of X</span>}
          {me ? (current
            ? <h2 className="pzx-rank">{current.name}</h2>
            : <h2 className="pzx-rank">Not yet ranked</h2>)
            : <h2 className="pzx-rank">Take a seat</h2>}
          <p className="it pzx-stand-note">{me ? (current ? current.note : 'Your first published piece makes you an Inkling.') : 'Members of the Guild rise through these ranks with every piece they publish.'}</p>
          {me && <span className="lab pzx-count">{mine} published {mine === 1 ? 'piece' : 'pieces'}</span>}
          {me && next && (
            <span className="pzx-next">
              <span className="pzx-next-glass" style={{ background: glassOf(next) }} aria-hidden="true" />
              <span><b>{toNext}</b> more to <b className="pzx-next-name" style={{ color: inkOf(next) }}>{next.name}</b></span>
            </span>
          )}
          {me ? <a className="m-act primary pzx-cta" href="/guild/desk/#write">Write a piece</a> : <a className="m-act primary pzx-cta" href="/guild">Join the Guild</a>}
        </div>
      </section>

      {/* The climb: ten lancets of glass */}
      <section className="pzx-climb" aria-label="The ten ranks">
        <div className="pzx-climb-head"><span className="eb">The crests</span><span className="it mut">Each rank keeps the crest below it and adds to it. Choose one to see what it takes, and who holds it.</span></div>
        <ol className="pzx-lancets">
          {PRESTIGES.map((p) => {
            const reached = !!current && p.level <= current.level;
            const here = current?.level === p.level;
            const who = holders(p.level);
            return (
              <li key={p.level} className={`pzx-l${reached ? ' reached' : ''}${here ? ' here' : ''}${pick === p.level ? ' chosen' : ''}`} style={{ '--lv': p.level, '--ink': inkOf(p) } as CSSProperties}>
                <button type="button" className="pzx-l-btn" onClick={() => setChosen(p.level)} aria-pressed={pick === p.level} aria-label={`${p.name}, rank ${p.level}: ${p.at} published ${p.at === 1 ? 'piece' : 'pieces'}${here ? ', you are here' : reached ? ', reached' : ''}`}>
                  <span className="pzx-crest-slot"><Crest lv={p.level} size={160} /></span>
                  <span className="pzx-l-text">
                    <span className="pzx-l-num">{p.numeral}</span>
                    <span className="pzx-l-name">{p.name}</span>
                    <span className="lab pzx-l-at">{p.at} {p.at === 1 ? 'piece' : 'pieces'}</span>
                    <span className="it pzx-l-note">{p.note}</span>
                    {who.length > 0 && <span className="pzx-l-who" aria-hidden="true">{who.slice(0, 4).map((h) => <Initials key={h.id} name={h.display_name} size={22} src={portraitUrl(h.portrait_path)} />)}{who.length > 4 && <span className="lab">+{who.length - 4}</span>}</span>}
                  </span>
                  {here && <span className="lab pzx-you">You</span>}
                </button>
              </li>
            );
          })}
        </ol>
        {/* The chosen window, in full (computers) */}
        <div className="pzx-detail" style={{ '--ink': inkOf(sel) } as CSSProperties}>
          <span className="pzx-detail-crest" aria-hidden="true"><Crest lv={sel.level} size={150} /></span>
          <div className="pzx-detail-text">
            <span className="lab mut">Rank {sel.level} of 10 · {sel.at} published {sel.at === 1 ? 'piece' : 'pieces'}</span>
            <h3 className="pzx-detail-name">{sel.numeral}&nbsp; {sel.name}</h3>
            <p className="it">{sel.note}</p>
            {(() => { const who = holders(sel.level); return who.length
              ? <div className="pzx-detail-who"><span className="lab mut">Who holds it</span><div>{who.slice(0, 12).map(face)}</div></div>
              : <span className="lab mut">No one holds it yet{current && sel.level > current.level ? '. It could be you.' : '.'}</span>; })()}
          </div>
        </div>
      </section>

      {/* The trophies, one set at a time */}
      <section className="pzx-trophies" id="trophies">
        <span className="eb">Beside the prestiges</span>
        <h2 className="h2">The trophies</h2>
        <p className="it pzx-lead">Prestiges count everything you publish. Trophies mark the work in each category, raised from bronze to silver, gold and rainbow glass as it grows, and a few things done once and done well.</p>
        <div className="pzx-switch" role="tablist" aria-label="Trophies">
          <button type="button" role="tab" aria-selected={trophies === 'growing'} onClick={() => setTrophies('growing')}>Trophies that grow</button>
          <button type="button" role="tab" aria-selected={trophies === 'once'} onClick={() => setTrophies('once')}>Won once</button>
        </div>
        <div className="pz-cat"><TrophyCatalogue only={trophies} /></div>
      </section>
    </div>
  );
}
