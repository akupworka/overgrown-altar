// Shown on the "not found" page when the address is a Guild piece that was approved
// after the site was last built. It fetches the piece straight from Supabase and shows it,
// so a piece is readable the moment it is approved; the next rebuild makes it a permanent page.
import { useEffect, useState } from 'react';
import { supabase, portraitUrl } from '../../lib/supabase';
import { Body, wantsDropCap } from '../../lib/marks';

const PILLAR = { watchtower: 'The Watchtower', hearth: 'The Hearth', perimeter: 'The Perimeter' } as Record<string, string>;
const MEDIUM: Record<string, string> = { prose: 'Prose', poetry: 'Poetry', fiction: 'Fiction', essay: 'Essay', photograph: 'Photographs', study: 'Architectural study', teardown: 'Design teardown', protocol: 'Protocol', recovery: 'Recovery story', testimony: 'Testimony', deliverance: 'Deliverance story', personal: 'Personal' };

export default function LivePiece() {
  const [piece, setPiece] = useState<any>(null);
  const [photo, setPhoto] = useState('');
  useEffect(() => {
    const m = location.pathname.match(/^\/guild\/([a-z0-9-]+)\/?$/);
    if (!m || ['desk', 'members'].includes(m[1])) return;
    (async () => {
      const { data } = await supabase.from('pieces')
        .select('title, standfirst, body, pillar, medium, image_path, image_alt, published_at, author:profiles(display_name, craft, bio, portrait_path, website, instagram)')
        .eq('slug', m[1]).eq('status', 'approved').maybeSingle();
      if (!data) return;
      if (data.image_path) {
        const { data: s } = await supabase.storage.from('guild').createSignedUrl(data.image_path, 60 * 60 * 24);
        setPhoto(s?.signedUrl ?? '');
      }
      setPiece(data);
      document.title = `${data.title} · Overgrown Altar`;
      document.querySelector('.nf')?.setAttribute('hidden', '');
      window.scrollTo(0, 0);
    })();
  }, []);
  if (!piece) return null;
  const a = piece.author ?? { display_name: 'A member' };
  const portrait = portraitUrl(a.portrait_path);
  const initials = (a.display_name || '').split(/\s+/).slice(0, 2).map((w: string) => w[0]).join('');
  const date = new Date(piece.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const insta = a.instagram ? `https://instagram.com/${a.instagram}` : '';
  return (
    <>
      <section className="hero gp-hero">
        <img src={photo || '/images/tall-windows-dark-vault-1200.jpg'} alt={photo ? piece.image_alt : ''} style={{ objectPosition: 'center 45%', filter: `brightness(${photo ? 0.5 : 0.35})` }} />
        <div className="veil" />
        <div className="hero-c gp-hero-c">
          <span className="eb"><a href={`/${piece.pillar}`}>{PILLAR[piece.pillar]}</a> · {MEDIUM[piece.medium] ?? ''}</span>
          <h1 className="h1 gp-title">{piece.title}</h1>
          <span className="gp-by">
            <span className="avatar-live">{portrait ? <img src={portrait} alt="" /> : initials}</span>
            <span className="lab">{a.display_name} · {date} · {Math.max(1, Math.round(piece.body.split(/\s+/).length / 230))} min read</span>
          </span>
        </div>
      </section>
      <article className="sec paper gp-article">
        <div className={`narrow gp-flow${wantsDropCap(piece.medium, piece.body) ? ' gp-drop' : ''}`}>
          {piece.standfirst && <p className="lede gp-standfirst">{piece.standfirst}</p>}
          <Body body={piece.body} />
          <div className="gp-sign"><span>{(a.display_name || '').split(' ')[0]}</span></div>
          <aside className="gp-author" aria-label="About the author">
            <span className="gp-arch" aria-hidden="true">{portrait ? <img src={portrait} alt="" /> : initials}</span>
            <div className="gp-author-text">
              <span className="eb">About the author</span>
              <span className="h3">{a.display_name}</span>
              {a.craft && <span className="lab mut">{a.craft}</span>}
              {a.bio && <p className="body">{a.bio}</p>}
              <span className="gp-links">
                {a.website && <a className="lab" href={a.website} target="_blank" rel="noopener noreferrer">Website ↗︎</a>}
                {insta && <a className="lab" href={insta} target="_blank" rel="noopener noreferrer">Instagram ↗︎</a>}
              </span>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
