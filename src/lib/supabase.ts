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

export type Status = 'draft' | 'submitted' | 'returned' | 'approved' | 'declined' | 'withdrawn';
export interface Piece {
  id: string; author_id: string; title: string; standfirst: string; body: string;
  pillar: 'watchtower' | 'hearth' | 'perimeter'; medium: string;
  image_path: string | null; image_alt: string; image_focus?: string; photo_meta?: import('./photo').PhotoMeta; gallery?: import('./photo').GalleryItem[]; status: Status; editor_note: string;
  submitted_at: string | null; published_at: string | null; created_at: string; updated_at: string;
  slug?: string | null;
  review_opened_at?: string | null;   // when the editor it is with first opened it to read ("Take it" stops working then)
  // A member's changes to a published piece, waiting for the editor (the live piece is unchanged until approved).
  revision?: { title: string; standfirst: string; body: string; image_path: string | null; image_alt: string; image_focus?: string; photo_meta?: import('./photo').PhotoMeta; gallery?: import('./photo').GalleryItem[] } | null;
  revision_at?: string | null;
  // A writer's request to take a published piece down, with their reason (the editor decides).
  delete_requested_at?: string | null; delete_reason?: string | null;
  taken_down_at?: string | null;   // taken down by its writer: hidden, restorable for 30 days
}
export interface Profile {
  id: string; display_name: string; craft: string; bio: string; portrait_path: string | null; role: 'member' | 'editor' | 'fellow';
  website: string; instagram: string; listed: boolean; created_at?: string;
  public_email?: string | null;   // shown on their work and pages only when they choose to
  library_public?: boolean;       // their library's shelves: private unless they open them
}

/** A member's portrait, from the public "portraits" store. */
export const portraitUrl = (path?: string | null) =>
  path ? supabase.storage.from('portraits').getPublicUrl(path).data.publicUrl : '';

/** Remembers, on this device, who is signed in, so the site header can greet them without loading anything. */
export const MEMBER_KEY = 'oa_member';
// The editor can see the whole site as a Guild member or as the Fellowship, to test it ("See the site as" on the Desk).
// Only the look and the tools change; the database still knows them as the editor.
export const VIEW_KEY = 'oa_view_as';
export type ViewAs = 'member' | 'fellow' | null;
export function viewAs(): ViewAs { try { const v = localStorage.getItem(VIEW_KEY); return v === 'member' || v === 'fellow' ? v : null; } catch { return null; } }
/** The role the site should behave as: the editor's chosen view, or the real role for everyone else. */
/** The Editor in Chief ('editor') and the staff editors ('staff') share the editor's tools. */
export const isEditorRole = (role?: string | null) => role === 'editor' || role === 'staff';
/** How that label is dressed: editors in gold, the Guild in bold silver, the Fellowship as it was. */
export const roleClass = (role?: string | null) => (role === 'editor' || role === 'staff' ? 'rl rl-editor' : role === 'fellow' ? 'rl rl-fellow' : 'rl rl-guild');
/** What a member is called beside their name. */
export const roleLabel = (role?: string | null) => (role === 'editor' ? 'Editor in Chief' : role === 'staff' ? 'Editor' : role === 'fellow' ? 'Of the Fellowship' : 'Of the Guild');
export function seenRole(role?: string | null) { const v = viewAs(); return isEditorRole(role) ? (v || 'editor') : role ?? null; }
export function setViewAs(v: ViewAs) { try { v ? localStorage.setItem(VIEW_KEY, v) : localStorage.removeItem(VIEW_KEY); } catch {} }
export function rememberMember(p: (Pick<Profile, 'display_name' | 'portrait_path'> & { role?: string | null }) | null) {
  try {
    if (p) localStorage.setItem(MEMBER_KEY, JSON.stringify({ name: p.display_name, portrait: portraitUrl(p.portrait_path), editor: isEditorRole(p.role), chief: p.role === 'editor', fellow: seenRole(p.role) === 'fellow' }));
    else { localStorage.removeItem(MEMBER_KEY); setViewAs(null); }   // signing out ends any "see as"
  } catch {}
  // Refresh the header (and the menu) on this page too: "Sign in" becomes the portrait and "My Desk", and back on sign-out.
  if (typeof document === 'undefined') return;
  document.documentElement.toggleAttribute('data-member', !!p);
  const seen = seenRole(p?.role);
  document.documentElement.toggleAttribute('data-editor', seen === 'editor');
  document.documentElement.toggleAttribute('data-fellow', seen === 'fellow');   // the Fellowship: no writing tools
  document.querySelectorAll<HTMLElement>('[data-guest]').forEach((el) => (el.hidden = !!p));
  document.querySelectorAll<HTMLElement>('[data-member]').forEach((el) => (el.hidden = !p));
  document.querySelectorAll<HTMLElement>('[data-editor]').forEach((el) => (el.hidden = seen !== 'editor'));
  const home = document.querySelector<HTMLAnchorElement>('.nav-home');
  const fel = seen === 'fellow';
  if (home) { home.href = !p ? '/' : fel ? '/guild/desk/' : '/guild/members/'; home.setAttribute('aria-label', !p ? 'Overgrown Altar, home' : fel ? 'Your Desk' : 'The Guild, home for members'); }
  if (!p) return;
  const src = portraitUrl(p.portrait_path);
  document.querySelectorAll<HTMLElement>('.member-av').forEach((av) => {
    av.textContent = '';
    const img = new Image(); img.src = src || seatFor(p.display_name); img.alt = ''; av.append(img);
  });
}

export const STATUS_LABEL: Record<Status, string> = {
  draft: 'Draft', submitted: 'With the editor', returned: 'Returned with a note', approved: 'Published', declined: 'Declined', withdrawn: 'Taken down',
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
