// A new member's first steps, on the Desk until they're done (or set aside): a picture, a few lines about you,
// the forum rules, a hello in the forum, the Guild on your home screen, and your first piece.
// The Fellowship (readers) get their own: a picture, something kept, a writer followed, a word to a writer,
// a hello in the forum, and the site on their home screen. Each is a first step on The Way.
import { useEffect, useState } from 'react';

interface Props { uid: string; portrait: boolean; bio: boolean; posted: boolean; sent: boolean; onWrite: () => void; fellow?: boolean; followed?: boolean; stayed?: boolean }
const store = (k: string, v?: string) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch {} return null; };

export function Welcome({ uid, portrait, bio, posted, sent, onWrite, fellow = false, followed = false, stayed = false }: Props) {
  // "Hide these steps" is remembered for this person, not for the whole browser: someone new on a shared phone or computer still gets theirs.
  const hideKey = `oa_welcome_hidden:${uid}`;
  const [hidden, setHidden] = useState(() => store(hideKey) === '1');
  const [rules] = useState(() => store(`oa_rules_read:${uid}`) === '1');
  const [home, setHome] = useState(() => store('oa_home_added') === '1');
  const [howHome, setHowHome] = useState(false);
  useEffect(() => {
    // Opened from the home screen: that step is done.
    if (matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) { store('oa_home_added', '1'); setHome(true); }
  }, []);
  type Step = { done: boolean; label: string; note: string; href?: string; how?: boolean; write?: boolean };
  const steps: Step[] = fellow ? [
    { done: portrait, label: 'Add your picture', note: 'So the writers can see who is reading.', href: '/guild/desk/#my-page' },
    { done: sent, label: 'Keep a piece or photograph you love', note: 'Tap “Save to library”. Your first badge on The Way.', href: '/archive/' },
    { done: followed, label: 'Follow a writer', note: 'Their new work will be waiting on your Desk.', href: '/search/' },
    { done: stayed, label: 'Tell a writer it stayed with you', note: 'One tap at the foot of any piece.', href: '/hearth/' },
    { done: posted, label: 'Say hello in the forum', note: 'A line in the Nave is enough.', href: '/guild/members/?view=forum' },
    { done: home, label: 'Add the altar to your home screen', note: 'It opens full-screen, like an app.', how: true },
  ] : [
    { done: portrait, label: 'Add your picture', note: 'So the Guild can put a face to your words.', href: '/guild/desk/#my-page' },
    { done: bio, label: 'Write a few lines about yourself', note: 'Your craft, and what you love to make.', href: '/guild/desk/#my-page' },
    { done: rules, label: 'Read the forum rules', note: 'How we keep the table safe and kind.', href: '/guild/members/?view=rules' },
    { done: posted, label: 'Say hello in the forum', note: 'A line in the Nave is enough.', href: '/guild/members/?view=forum' },
    { done: home, label: 'Add the Guild to your home screen', note: 'It opens full-screen, like an app.', how: true },
    { done: sent, label: 'Send your first piece', note: 'The editor reads every one.', write: true },
  ];
  const done = steps.filter((s) => s.done).length;
  if (hidden || done === steps.length) return null;
  return (
    <section className="wl" aria-label="Your first steps">
      <div className="wl-head">
        <div><span className="eb">{fellow ? 'Welcome to the Fellowship' : 'Welcome to the table'}</span><h2 className="wl-h">Your first steps</h2></div>
        <span className="lab wl-n">{done} of {steps.length}</span>
      </div>
      <div className="wl-bar" aria-hidden="true"><i style={{ transform: `scaleX(${done / steps.length})` }} /></div>
      <ol className="wl-list">
        {steps.map((s) => {
          const inner = (<>
            <span className={`wl-tick${s.done ? ' on' : ''}`} aria-hidden="true">{s.done ? '✓' : ''}</span>
            <span className="wl-t"><span className="wl-l">{s.label}</span><span className="it wl-note">{s.note}</span></span>
            {!s.done && <span className="wl-go" aria-hidden="true">→</span>}
          </>);
          return (
            <li key={s.label} className={s.done ? 'done' : ''}>
              {s.done ? <div className="wl-row">{inner}</div>
                : s.href ? <a className="wl-row" href={s.href}>{inner}</a>
                : <button type="button" className="wl-row" onClick={() => (s.write ? onWrite() : setHowHome((v) => !v))}>{inner}</button>}
              {s.how && howHome && !s.done && (
                <div className="wl-how">
                  <p>On an iPhone, in Safari: tap <b>Share</b> <span aria-hidden="true">(the square with an arrow)</span>, then <b>Add to Home Screen</b>. On Android, in Chrome: tap <b>⋮</b>, then <b>Add to Home screen</b>.</p>
                  <button type="button" className="lab wl-did" onClick={() => { store('oa_home_added', '1'); setHome(true); }}>I’ve added it</button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <button type="button" className="lab wl-hide" onClick={() => { store(hideKey, '1'); setHidden(true); }}>Hide these steps</button>
    </section>
  );
}
