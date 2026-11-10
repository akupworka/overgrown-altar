// The Guild, as one app: the Desk (/guild/desk/) and the Guild's rooms (/guild/members/…) live side by side.
// Moving between them changes the address and swaps the room in place: no new page, no reload. Each side is set up
// the first time it's visited and then kept, so going back is instant.
import { useEffect, useState } from 'react';
import DeskApp from './DeskApp';
import MembersApp from './MembersApp';

const isDesk = (p: string) => p.startsWith('/guild/desk');
export const inGuild = (p: string) => isDesk(p) || p.startsWith('/guild/members');

/** Go somewhere in the Guild without leaving the app (anywhere else, an ordinary page load). */
export function guildGo(href: string) {
  const u = new URL(href, location.href);
  if (u.origin !== location.origin || !inGuild(u.pathname)) { location.href = href; return; }
  history.pushState(u.hash.startsWith('#write') || u.hash === '#photograph' ? { desk: 'write' } : null, '', u.pathname + u.search + u.hash);
  dispatchEvent(new PopStateEvent('popstate'));
  scrollTo({ top: 0 });
}

export default function GuildApp() {
  const [path, setPath] = useState(location.pathname);
  const [seen, setSeen] = useState(() => ({ desk: isDesk(location.pathname), members: !isDesk(location.pathname) }));
  useEffect(() => {
    const on = () => { setPath(location.pathname); setSeen((s) => (isDesk(location.pathname) ? { ...s, desk: true } : { ...s, members: true })); };
    addEventListener('popstate', on);
    // Links anywhere on the page that lead to another Guild room open it in place.
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const to = new URL(a.href);
      if (to.origin !== location.origin || !inGuild(to.pathname)) return;
      if (to.pathname === location.pathname && to.search === location.search && to.hash === location.hash) { e.preventDefault(); return; }
      e.preventDefault(); guildGo(a.href);
    };
    document.addEventListener('click', click);
    return () => { removeEventListener('popstate', on); document.removeEventListener('click', click); };
  }, []);
  useEffect(() => { if (isDesk(path)) document.title = 'The Guild Desk · Overgrown Altar'; }, [path]);
  const desk = isDesk(path);
  return (
    <>
      {seen.desk && <div className="guild-side" hidden={!desk}><DeskApp /></div>}
      {seen.members && <div className="guild-side" hidden={desk}><MembersApp /></div>}
    </>
  );
}
