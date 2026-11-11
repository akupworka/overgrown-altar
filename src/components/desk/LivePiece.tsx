// Shown on the "not found" page when the address is a Guild piece that was approved
// after the site was last built. It fetches the piece straight from Supabase and shows it,
// so a piece is readable the moment it is approved; the next rebuild makes it a permanent page.
import { useEffect, useState } from 'react';
import { supabase, portraitUrl } from '../../lib/supabase';
import { Body, wantsDropCap } from '../../lib/marks';
import { PhotoPlate } from '../PhotoPlate';
import { seatFor } from '../../lib/seats';

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
        .select('title, standfirst, body, pillar, medium, image_path, image_alt, image_focus, photo_meta, gallery, published_at, author:profiles!pieces_author_id_fkey(display_name, craft, bio, portrait_path, website, instagram)')
        .eq('slug', m[1]).eq('status', 'approved').maybeSingle();
      if (!data) return;
      if (data.image_path) {
        if (data.image_path.startsWith('/')) setPhoto(data.image_path);
        else { const { data: s } = await supabase.storage.from('guild').createSignedUrl(data.image_path, 60 * 60 * 24); setPhoto(s?.signedUrl ?? ''); }
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
  // The writer's page, at the same address the site gives it (/guild/authors/eden-albright/).
  const aUrl = `/guild/authors/${(a.display_name || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'member'}/`;
  const isPhoto = piece.medium === 'photograph';
  const insta = a.instagram ? `https://instagram.com/${a.instagram}` : '';
  return (
    <>
      <section className="hero gp-hero">
        <img src={photo || '/images/tall-windows-dark-vault-1200.jpg'} alt={photo ? piece.image_alt : ''} style={{ objectPosition: (photo && piece.image_focus) || 'center 45%', filter: `brightness(${photo ? 0.5 : 0.35})` }} />
        <div className="veil" />
        <div className="hero-c gp-hero-c">
          <a className="lab gp-back" href={`/${piece.pillar}`}>{PILLAR[piece.pillar]}</a>
          <span className="eb"><a className="gp-eb-room" href={`/${piece.pillar}`}>{PILLAR[piece.pillar]}</a><span className="gp-eb-dot"> · </span>{MEDIUM[piece.medium] ?? ''}</span>
          <h1 className="h1 gp-title">{piece.title}</h1>
          <span className="gp-by">
            <a className="gp-by-who" href={aUrl}><span className="avatar-live">{portrait ? <img src={portrait} alt="" /> : initials}</span><span className="lab">{a.display_name}</span></a>
            <span className="lab">· {date}{isPhoto ? '' : ` · ${Math.max(1, Math.round(piece.body.split(/\s+/).length / 230))} min read`}</span>
          </span>
        </div>
      </section>
      <article className="sec paper gp-article">
        <div className={`narrow gp-flow${isPhoto ? ' gp-photo' : wantsDropCap(piece.medium, piece.body) ? ' gp-drop' : ''}`}>
          {piece.standfirst && <p className="lede gp-standfirst">{piece.standfirst}</p>}
          {isPhoto && photo && <PhotoPlate src={photo} alt={piece.image_alt} meta={piece.photo_meta} gallery={piece.gallery} />}
          {piece.body.trim() && <Body body={piece.body} />}
          <div className="gp-sign"><span>{(a.display_name || '').split(' ')[0]}</span></div>
          <div data-read-end="" aria-hidden="true" className="read-end" />
          <aside className="gp-author" aria-label="About the author">
            <a className="gp-arch" href={aUrl} aria-hidden="true" tabIndex={-1}><img src={portrait || seatFor(a.display_name)} alt="" data-initials={initials} /></a>
            <div className="gp-author-text">
              <span className="eb">About the author</span>
              <a className="gp-author-name" href={aUrl}>{a.display_name}</a>
              {a.craft && <span className="lab mut">{a.craft}</span>}
              {a.bio && <p className="body">{a.bio}</p>}
              <span className="gp-links">
                {/^https?:\/\//i.test(a.website ?? '') && <a className="lab" href={a.website} target="_blank" rel="noopener noreferrer">Website ↗︎</a>}
                {insta && <a className="lab" href={insta} target="_blank" rel="noopener noreferrer">Instagram ↗︎</a>}
              </span>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
