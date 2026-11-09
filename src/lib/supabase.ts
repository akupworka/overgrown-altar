// The connection to Supabase, which holds Guild accounts and the pieces members write.
// These two values are public by design: they only identify the project. What anyone may
// read or change is enforced by the database's own rules (row-level security), not by secrecy.
import { createClient } from '@supabase/supabase-js';
import { seatFor } from './seats';

export const SUPABASE_URL = 'https://zblgggifysohxqtgvgxs.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_84SLMdb_AiDAbaiz1eitbw_DRMx38lH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type Status = 'draft' | 'submitted' | 'returned' | 'approved' | 'declined';
export interface Piece {
  id: string; author_id: string; title: string; standfirst: string; body: string;
  pillar: 'watchtower' | 'hearth' | 'perimeter'; medium: string;
  image_path: string | null; image_alt: string; image_focus?: string; photo_meta?: import('./photo').PhotoMeta; gallery?: import('./photo').GalleryItem[]; status: Status; editor_note: string;
  submitted_at: string | null; published_at: string | null; created_at: string; updated_at: string;
  slug?: string | null;
  // A member's changes to a published piece, waiting for the editor (the live piece is unchanged until approved).
  revision?: { title: string; standfirst: string; body: string; image_path: string | null; image_alt: string; image_focus?: string; photo_meta?: import('./photo').PhotoMeta; gallery?: import('./photo').GalleryItem[] } | null;
  revision_at?: string | null;
}
export interface Profile {
  id: string; display_name: string; craft: string; bio: string; portrait_path: string | null; role: 'member' | 'editor' | 'fellow';
  website: string; instagram: string; listed: boolean; created_at?: string;
  public_email?: string | null;   // shown on their work and pages only when they choose to
}

/** A member's portrait, from the public "portraits" store. */
export const portraitUrl = (path?: string | null) =>
  path ? supabase.storage.from('portraits').getPublicUrl(path).data.publicUrl : '';

/** Remembers, on this device, who is signed in, so the site header can greet them without loading anything. */
export const MEMBER_KEY = 'oa_member';
export function rememberMember(p: (Pick<Profile, 'display_name' | 'portrait_path'> & { role?: string | null }) | null) {
  try {
    if (p) localStorage.setItem(MEMBER_KEY, JSON.stringify({ name: p.display_name, portrait: portraitUrl(p.portrait_path), editor: p.role === 'editor', fellow: p.role === 'fellow' }));
    else localStorage.removeItem(MEMBER_KEY);
  } catch {}
  // Refresh the header (and the menu) on this page too: "Sign in" becomes the portrait and "My Desk", and back on sign-out.
  if (typeof document === 'undefined') return;
  document.documentElement.toggleAttribute('data-member', !!p);
  document.documentElement.toggleAttribute('data-editor', p?.role === 'editor');
  document.documentElement.toggleAttribute('data-fellow', p?.role === 'fellow');   // the Fellowship: no writing tools
  document.querySelectorAll<HTMLElement>('[data-guest]').forEach((el) => (el.hidden = !!p));
  document.querySelectorAll<HTMLElement>('[data-member]').forEach((el) => (el.hidden = !p));
  document.querySelectorAll<HTMLElement>('[data-editor]').forEach((el) => (el.hidden = p?.role !== 'editor'));
  const home = document.querySelector<HTMLAnchorElement>('.nav-home');
  if (home) { home.href = p ? '/guild/members/' : '/'; home.setAttribute('aria-label', p ? 'The Guild, home for members' : 'Overgrown Altar, home'); }
  if (!p) return;
  const src = portraitUrl(p.portrait_path);
  document.querySelectorAll<HTMLElement>('.member-av').forEach((av) => {
    av.textContent = '';
    const img = new Image(); img.src = src || seatFor(p.display_name); img.alt = ''; av.append(img);
  });
}

export const STATUS_LABEL: Record<Status, string> = {
  draft: 'Draft', submitted: 'With the editor', returned: 'Returned with a note', approved: 'Published', declined: 'Declined',
};
export const PILLARS = [
  { value: 'watchtower', label: 'The Watchtower · Prophetic Audits' },
  { value: 'hearth', label: 'The Hearth · Creative Guild' },
  { value: 'perimeter', label: 'The Perimeter · Testimony & the Unseen' },
] as const;
export const MEDIUMS = [
  { value: 'prose', label: 'Prose' }, { value: 'poetry', label: 'Poetry' }, { value: 'fiction', label: 'Fiction' },
  { value: 'essay', label: 'Essay / Dispatch' }, { value: 'photograph', label: 'Photographs' },
  { value: 'protocol', label: 'Protocol' },
  { value: 'recovery', label: 'Recovery story' }, { value: 'testimony', label: 'Testimony' },
  { value: 'deliverance', label: 'Deliverance story' }, { value: 'personal', label: 'Personal' },
];
// Each pillar takes its own kinds of piece: The Watchtower only essays / dispatches,
// The Perimeter recovery stories, testimonies, deliverance stories and personal pieces, The Hearth the creative kinds. (The database enforces the same.)
const BY_PILLAR: Record<string, string[]> = {
  watchtower: ['essay'],
  perimeter: ['recovery', 'testimony', 'deliverance', 'personal'],
  hearth: ['prose', 'poetry', 'fiction', 'photograph'],
};
export const mediumsFor = (pillar: string) => MEDIUMS.filter((m) => (BY_PILLAR[pillar] ?? []).includes(m.value));
export const fitMedium = (pillar: string, medium: string) => { const ok = BY_PILLAR[pillar] ?? []; return ok.includes(medium) ? medium : ok[0]; };
