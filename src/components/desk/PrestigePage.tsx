import { uniqueIds as useIds } from '../../lib/svgIds';
// The ten prestiges, as a window of stained glass.
//   Where you stand: your rank inside a ring that fills toward the next, in that rank's own glass.
//   The climb: ten lancets, rising from Inkling to Pillar (side by side on a computer, a vertical climb on a phone);
//     the ranks you've reached are lit, yours glows, the rest wait in shadow. Choose one to see what it takes and who holds it.
//   The trophies: one set at a time (those that grow, those won once).
// Used at /guild/members/?view=prestige (MembersApp). Open to visitors as well as members.
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { TROPHIES, trophiesFor, finestFirst, trophySvg, showcaseCtx, type TrophyCtx } from '../../lib/trophies';
import { supabase, portraitUrl, type Profile } from '../../lib/supabase';
import { PRESTIGES, prestigeFor, type Prestige } from '../../lib/prestige';
import { Initials } from './DeskApp';
import { TrophyCatalogue, PreviewSwitch } from './Trophies';
import { useForumTally } from './Forum';
import type { Piece } from '../../lib/supabase';
import { PrestigeBadge } from './Prestige';
import { crestSvg, type CrestOpts } from '../../lib/crests';

// A rank's crest (drawn once per rank and size).
const crestCache = new Map<string, string>();
function Crest({ lv, size, className = '', ...opts }: { lv: number; size: number; className?: string } & CrestOpts) {
  const key = `${lv}-${size}-${opts.locked ? 'l' : ''}${opts.glow ? 'g' : ''}`;
  if (!crestCache.has(key)) crestCache.set(key, crestSvg(lv, size, opts));
  return <span className={`pzx-crest ${className}`} dangerouslySetInnerHTML={{ __html: useIds(crestCache.get(key)!) }} />;
}
import '../../styles/prestige-page.css';

const authorSlug = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'member';
// Each rank's glass, as a CSS fill (rainbow and gold are their own).
export const glassOf = (p: Prestige) => p.color === 'rainbow'
  ? 'linear-gradient(180deg, #3E7BFF, #B05BFF 25%, #FF3B4E 50%, #FFC44D 75%, #3DE0A0)'
  : p.color === 'gold' ? 'linear-gradient(180deg, #FFF0B8, #E9C46A 35%, #D2A23A 60%, #7A560C)'
  : `linear-gradient(180deg, color-mix(in srgb, ${p.color} 55%, white), ${p.color} 45%, color-mix(in srgb, ${p.color} 55%, black))`;
const inkOf = (p: Prestige) => (p.color === 'rainbow' ? '#C9A7FF' : p.color === 'gold' ? '#F2D27A' : `color-mix(in srgb, ${p.color} 70%, white)`);

export function PrestigePage({ me, link, section = 'prestige' }: { me: string; link: (to: string, cls: string, children: ReactNode) => ReactNode; section?: 'prestige' | 'trophies' }) {
  // Your own published pieces and forum part, so each trophy can show how far along you are.
  const [myWork, setMyWork] = useState<Piece[]>([]);
  const tally = useForumTally(me || null);
  useEffect(() => { if (me) supabase.from('pieces').select('*').eq('author_id', me).eq('status', 'approved').then(({ data }) => setMyWork(Array.isArray(data) ? (data as Piece[]) : [])); }, [me]);
  const [people, setPeople] = useState<(Profile & { count: number })[] | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [trophies, setTrophies] = useState<'growing' | 'once'>('growing');
  useEffect(() => {
    (async () => {
      const [{ data: ps }, { data: work }] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.rpc('piece_counts'),
      ]);
      const counts = new Map<string, number>();
      (Array.isArray(work) ? work : []).forEach((w: any) => counts.set(w.author_id, w.n));
      setPeople((Array.isArray(ps) ? (ps as Profile[]) : []).map((p) => ({ ...p, count: counts.get(p.id) ?? 0 })));
    })();
  }, []);
  // The Editor in Chief can look at everything as it would be with every trophy won and the highest rank held. Nothing is saved.
  const [preview, setPreview] = useState(false);
  const self = people?.find((p) => p.id === me);
  const chief = self?.role === 'editor';
  const show = useMemo(() => (preview ? showcaseCtx(self ?? {}) : null), [preview, self]);
  const myCtx: TrophyCtx = show ?? { pieces: myWork, member: self ?? {}, forum: tally };
  const mine = show ? show.pieces.length : self?.count ?? 0;
  const { current, next, toNext } = prestigeFor(mine);
  const from = current?.at ?? 0;
  const pct = next ? Math.max(0.04, (mine - from) / (next.at - from)) : 1;
  const holders = useMemo(() => (level: number) => (people ?? []).filter((p) => (p.listed || p.id === me) && prestigeFor(p.count).current?.level === level), [people, me]);
    if (!people) return <p className="lab mut d-loading">Opening…</p>;

  const face = (h: Profile) => me
    ? <span key={h.id}>{link(`/guild/members/?m=${h.id}`, 'pzx-face', <><Initials name={h.display_name} size={34} src={portraitUrl(h.portrait_path)} /><span>{h.display_name}</span></>)}</span>
    : <a key={h.id} href={`/guild/authors/${authorSlug(h.display_name)}/`} className="pzx-face"><Initials name={h.display_name} size={34} src={portraitUrl(h.portrait_path)} /><span>{h.display_name}</span></a>;
  const R = 82, C = 2 * Math.PI * R;

  return (
    <div className="pzx">
      <header className="pzx-head">
        {me && link('/guild/members/', 'm-back lab', 'The Guild')}
        <span className="eb">The Guild</span>
        <h1 className="h1">{section === 'trophies' ? 'The trophies' : 'The ten ranks'}</h1>
        <p className="it pzx-lead">{section === 'trophies'
          ? 'Ranks count everything you publish. Trophies mark the particular things: the work in each craft, the company you keep with the other members, and the years, raised from bronze to silver, gold and rainbow glass as they grow, beside a few things done once and done well. Tap any trophy to see how to earn it.'
          : 'Every published piece raises a member through the ranks of the Guild, from a first inkling to the pillars of the house. Each rank is a color of glass; badges change the moment the editor publishes.'}</p>
        {/* Two rooms of one page: the ranks, and the trophies */}
        <nav className="pzx-sw" aria-label="Ranks or trophies">
          {link('/guild/members/?view=prestige', `pzx-sw-b${section === 'prestige' ? ' on' : ''}`, <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" /><path d="M12 8l2 3-2 3-2-3z" /></svg>Ranks</>)}
          {link('/guild/members/?view=trophies', `pzx-sw-b${section === 'trophies' ? ' on' : ''}`, <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="5.5" /><path d="M8.5 13.5L7 21l5-2.5 5 2.5-1.5-7.5" /></svg>Trophies</>)}
        </nav>
        {chief && <PreviewSwitch on={preview} set={setPreview} />}
      </header>
      {section === 'prestige' && <>
      {/* Where you stand: your crest in a window of your rank's own glass */}
      <section className="pzv-stand" style={{ '--ink': current ? inkOf(current) : '#CFC8B8', '--glass': current ? glassOf(current) : 'linear-gradient(180deg,#2a2c2e,#121314)' } as CSSProperties}>
        <div className="pzv-window" aria-hidden="true">
          <span className="pzv-window-glass" />
          <span className="pzv-window-lead" />
          <svg className="pzv-window-ring" viewBox="0 0 180 180">
            <circle cx="90" cy="90" r={R} className="pzx-ring-track" />
            <circle cx="90" cy="90" r={R} className="pzv-ring-fill" strokeDasharray={`${C * pct} ${C}`} />
          </svg>
          {current ? <Crest lv={current.level} size={180} className="pzv-window-crest" glow /> : <Crest lv={1} size={180} className="pzv-window-crest" locked />}
        </div>
        <div className="pzv-stand-text">
          <span className="lab pzv-k">{me ? 'Where you stand' : 'Earn your first'}</span>
          {current && <span className="lab pzv-of">Rank {current.numeral} of X</span>}
          <h2 className="pzv-rank">{me ? (current ? current.name : 'Not yet ranked') : 'Take a seat'}</h2>
          <p className="it pzv-note">{me ? (current ? current.note : 'Your first published piece makes you an Inkling.') : 'Members of the Guild rise through these ranks with every piece they publish.'}</p>
          {me && (
            <div className="pzv-stats">
              <span className="pzv-stat"><b>{mine}</b><span className="lab">published</span></span>
              {next && <span className="pzv-stat"><b>{toNext}</b><span className="lab">to {next.name}</span></span>}
              <span className="pzv-stat"><b>{current ? current.level : 0}<i>/10</i></b><span className="lab">ranks</span></span>
            </div>
          )}
          {me && next && (
            <div className="pzv-toward">
              <span className="pzv-bar" aria-hidden="true"><i style={{ width: `${Math.round(pct * 100)}%` }} /></span>
              <span className="pzv-next"><Crest lv={next.level} size={44} className="pzv-next-crest" /><span>{toNext} more published {toNext === 1 ? 'piece' : 'pieces'} to <b style={{ color: inkOf(next) }}>{next.name}</b></span></span>
            </div>
          )}
          {me ? <a className="pzv-cta" href="/guild/desk/#write">Write a piece <span aria-hidden="true">→</span></a> : <a className="pzv-cta" href="/guild">Join the Guild <span aria-hidden="true">→</span></a>}
        </div>
      </section>

      {/* The climb: ten panes of one window, lit up to your rank */}
      <section className="pzv-climb" aria-label="The ten ranks">
        <div className="pzv-climb-head"><span className="eb">The climb</span><span className="it mut">Each rank keeps the crest below it and adds to it. Tap one to see what it takes, and who holds it.</span></div>
        <ol className="pzv-panes">
          {PRESTIGES.map((p) => {
            const reached = !!current && p.level <= current.level;
            const here = current?.level === p.level;
            const who = holders(p.level);
            return (
              <li key={p.level} className={`pzv-pane${reached ? ' lit' : ''}${here ? ' here' : ''}`} style={{ '--lv': p.level, '--ink': inkOf(p), '--glass': glassOf(p) } as CSSProperties}>
                <button type="button" className="pzv-pane-btn" onClick={() => setChosen(p.level)} aria-label={`${p.name}, rank ${p.level}: ${p.at} published ${p.at === 1 ? 'piece' : 'pieces'}${here ? ', you are here' : reached ? ', reached' : ''}`}>
                  <span className="pzv-pane-glass" aria-hidden="true"><span className="pzv-pane-lead" /><Crest lv={p.level} size={120} className="pzv-pane-crest" glow={here} /></span>
                  <span className="pzv-pane-text">
                    <span className="pzv-pane-num">{p.numeral}</span>
                    <span className="pzv-pane-name">{p.name}</span>
                    <span className="lab pzv-pane-at">{p.at} {p.at === 1 ? 'piece' : 'pieces'}</span>
                    {me && !reached ? <span className="lab pzv-pane-st pzv-pane-togo">{p.at - mine} to go</span> : null}
                    {who.length > 0 && <span className="pzv-pane-who" aria-hidden="true">{who.slice(0, 3).map((h) => <Initials key={h.id} name={h.display_name} size={20} src={portraitUrl(h.portrait_path)} />)}{who.length > 3 && <span className="lab">+{who.length - 3}</span>}</span>}
                  </span>
                  {here && <span className="lab pzv-you">You</span>}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Beside the ranks: your trophies */}
      {me && (() => {
        const st = trophiesFor(myCtx);
        const won = finestFirst(st.filter((x) => x.earned));
        return (
          <section className="pzv-tro">
            <div className="pzv-tro-medals" aria-hidden="true">{won.slice(0, 4).map(({ trophy: t, tier }) => <span key={t.id} dangerouslySetInnerHTML={{ __html: useIds(trophySvg(t, 56, tier)) }} />)}</div>
            <div className="pzv-tro-text"><span className="lab pzv-k">Beside the ranks</span><span className="pzv-tro-n"><b>{won.length}</b> of {TROPHIES.length} trophies won</span></div>
            {link('/guild/members/?view=trophies', 'pzv-cta', <>See the trophies <span aria-hidden="true">→</span></>)}
          </section>
        );
      })()}

      {/* A rank, opened */}
      {chosen !== null && (() => {
        const sel = PRESTIGES.find((p) => p.level === chosen)!;
        const reached = !!current && sel.level <= current.level;
        const who = holders(sel.level);
        const gap = Math.max(0, sel.at - mine);
        const frac = Math.min(1, mine / sel.at);
        return createPortal(
          <div className="trc-veil" onClick={() => setChosen(null)}>
            <div className="trc pzv-card" role="dialog" aria-modal="true" aria-label={sel.name} style={{ '--ink': inkOf(sel), '--glass': glassOf(sel) } as CSSProperties} onClick={(e) => e.stopPropagation()}>
              <button type="button" className="trc-x" onClick={() => setChosen(null)} aria-label="Close">×</button>
              <span className="pzv-card-crest" aria-hidden="true"><Crest lv={sel.level} size={150} glow /></span>
              <span className="lab trc-state">Rank {sel.numeral} of X{current?.level === sel.level ? ' · You hold it' : reached ? ' · Reached' : ''}</span>
              <h3 className="trc-name pzv-card-name">{sel.name}</h3>
              <p className="it trc-note">{sel.note}</p>
              <div className="trc-count"><b>{sel.at}</b> published {sel.at === 1 ? 'piece' : 'pieces'}</div>
              {me && !reached && <><span className="trc-bar" aria-hidden="true"><i style={{ width: `${Math.round(frac * 100)}%` }} /></span><span className="trc-next">{gap} more {gap === 1 ? 'piece' : 'pieces'} to reach it</span></>}
              <div className="pzv-card-badge"><span className="lab mut">The badge beside a name</span><PrestigeBadge published={sel.at} link={false} /></div>
              <div className="pzv-card-who">
                <span className="lab mut">{who.length ? 'Who holds it' : 'No one holds it yet'}</span>
                {who.length > 0 && <div>{who.slice(0, 6).map(face)}</div>}
                {who.length > 6 && <span className="lab mut pzx-more">and {who.length - 6} more</span>}
              </div>
            </div>
          </div>, document.body);
      })()}

      </>}
      {section === 'trophies' && (
      <section className="pzx-trophies" id="trophies">
        <div className="pzx-switch" role="tablist" aria-label="Trophies">
          <button type="button" role="tab" aria-selected={trophies === 'growing'} onClick={() => setTrophies('growing')}>Trophies that grow</button>
          <button type="button" role="tab" aria-selected={trophies === 'once'} onClick={() => setTrophies('once')}>Won once</button>
        </div>
        <div className="pz-cat"><TrophyCatalogue only={trophies} ctx={me ? myCtx : undefined} /></div>
      </section>)}
    </div>
  );
}
