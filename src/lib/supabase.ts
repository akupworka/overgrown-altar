// The connection to Supabase, which holds Guild accounts and the pieces members write.
// These two values are public by design: they only identify the project. What anyone may
// read or change is enforced by the database's own rules (row-level security), not by secrecy.
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://zblgggifysohxqtgvgxs.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_84SLMdb_AiDAbaiz1eitbw_DRMx38lH';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type Status = 'draft' | 'submitted' | 'returned' | 'approved' | 'declined';
export interface Piece {
  id: string; author_id: string; title: string; standfirst: string; body: string;
  pillar: 'watchtower' | 'hearth' | 'perimeter'; medium: string;
  image_path: string | null; image_alt: string; status: Status; editor_note: string;
  submitted_at: string | null; published_at: string | null; created_at: string; updated_at: string;
}
export interface Profile {
  id: string; display_name: string; craft: string; bio: string; portrait_path: string | null; role: 'member' | 'editor';
}

export const STATUS_LABEL: Record<Status, string> = {
  draft: 'Draft', submitted: 'With the editor', returned: 'Returned with a note', approved: 'Published', declined: 'Declined',
};
export const PILLARS = [
  { value: 'watchtower', label: 'The Watchtower · Prophetic Audits' },
  { value: 'hearth', label: 'The Hearth · Creative Guild' },
  { value: 'perimeter', label: 'The Perimeter · Deliverance Protocols' },
] as const;
export const MEDIUMS = [
  { value: 'prose', label: 'Prose' }, { value: 'poetry', label: 'Poetry' }, { value: 'fiction', label: 'Fiction' },
  { value: 'essay', label: 'Essay / Dispatch' }, { value: 'photograph', label: 'Photographs' },
  { value: 'study', label: 'Architectural study' }, { value: 'teardown', label: 'Design teardown' },
  { value: 'protocol', label: 'Protocol' },
];
