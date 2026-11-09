// Once a day: delete uploaded files that nothing uses any more, so the Guild keeps no copies of what people
// replaced or deleted (an old portrait, a photograph taken out of a piece, the images of a deleted piece).
// A file is kept while any piece (its text, photographs, gallery or waiting revision), any portrait or any
// forum post still mentions it. Files less than two days old are left alone, so a piece still being written
// never loses a photograph that hasn't been saved yet.
//
// Needs SUPABASE_SERVICE_ROLE_KEY in Netlify > Site configuration > Environment variables (already set).
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zblgggifysohxqtgvgxs.supabase.co';
const BUCKETS = ['guild', 'media', 'portraits'];
const GRACE_MS = 2 * 24 * 60 * 60 * 1000;

export default async () => {
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!service) return new Response('No service key', { status: 503 });
  const db = createClient(SUPABASE_URL, service, { auth: { persistSession: false } });

  // Everything that can point at a file, as one long text to search in.
  const [pieces, profiles, posts] = await Promise.all([
    db.from('pieces').select('*'),
    db.from('profiles').select('portrait_path, bio'),
    db.from('forum_posts').select('body'),
  ]);
  if (pieces.error || profiles.error || posts.error) return new Response('Could not read the site', { status: 500 });
  const used = JSON.stringify([pieces.data, profiles.data, posts.data]);

  const now = Date.now();
  const report: Record<string, number> = {};
  for (const bucket of BUCKETS) {
    const store = db.storage.from(bucket);
    const stale: string[] = [];
    // Files live in one folder per member: <member id>/<file>
    const { data: folders } = await store.list('', { limit: 1000 });
    for (const folder of folders ?? []) {
      if (folder.id) continue; // a loose file at the top, not a folder
      for (let offset = 0; ; offset += 1000) {
        const { data: files } = await store.list(folder.name, { limit: 1000, offset });
        if (!files?.length) break;
        for (const file of files) {
          if (!file.id) continue;
          const path = `${folder.name}/${file.name}`;
          const made = Date.parse(file.created_at ?? '') || now;
          if (now - made > GRACE_MS && !used.includes(path)) stale.push(path);
        }
        if (files.length < 1000) break;
      }
    }
    for (let i = 0; i < stale.length; i += 100) await store.remove(stale.slice(i, i + 100));
    report[bucket] = stale.length;
  }
  console.log('sweep-files removed', report);
  return new Response(JSON.stringify(report), { headers: { 'Content-Type': 'application/json' } });
};

export const config = { schedule: '@daily' };
