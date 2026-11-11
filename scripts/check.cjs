// Check a page the way the owner sees it: on a phone (393x852) and a computer (1280x900), signed in with
// pretend Guild data, so no real account or database is touched. Reports page errors and sideways overflow,
// and saves screenshots for you to look at.
//
//   npm run build                      (the check uses the built site)
//   node scripts/check.cjs <path> [options]
//
//   <path>            e.g. /guild/desk/  /guild/members/?view=prestige  /hearth
//   --as editor|staff|member|fellow|visitor   who is signed in (default editor; staff = a staff editor; visitor = signed out)
//   --pieces N        how many published pieces the signed-in member has (default 12; prestige ranks follow)
//   --only phone|computer        check one size only
//   --full            screenshot the whole page, not just the first screen (bigger images: use sparingly)
//   --sabbath         the signed-in editor is on sabbath (otherwise the other editor is)
//   --heavy           a very busy member: 40 members, 25 conversations (~300 messages), 6 forums × 40 threads, one at 200 replies
//   --click "<css>"   click this before the screenshot (e.g. a tab or a rank); several in turn with ;; between them
//   --scroll "<css>"  bring this into view before the screenshot (things that fade in as you reach them)
//   --type "<css>|text"   type this into a field before the screenshot (the pretend name "Watchman" is taken)
//   --width N         the computer's width (default 1280; the row of rooms in the header shows from 1321)
//   --out <dir>       where screenshots go (default: a temporary folder; never inside the repo)
//
// It starts `astro preview` on port 4321 itself if nothing is running there, and stops it afterwards.
// Chromium only: anything iPhone-Safari-specific still needs the owner to check on their phone.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const os = require('os'), path = require('path'), fs = require('fs');

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf('--' + name); return i < 0 ? dflt : args[i + 1]; };
const flag = (name) => args.includes('--' + name);
const VALUED = ['--as', '--pieces', '--only', '--click', '--out', '--width', '--type', '--scroll'];
const target = args.find((a, i) => !a.startsWith('--') && !VALUED.includes(args[i - 1]));
if (!target) { console.log('Usage: node scripts/check.cjs <path> [--as editor|member|visitor] [--pieces N] [--only phone|computer] [--full] [--click "<css>"] [--out <dir>]'); process.exit(1); }
const who = opt('as', 'editor');
const out = opt('out', fs.mkdtempSync(path.join(os.tmpdir(), 'oa-check-')));
const PORT = 4321, BASE = `http://localhost:${PORT}`;

// ---- pretend Guild data -----------------------------------------------------------------------------------
const ME = '22222222-2222-2222-2222-222222222222';
const t = (d) => `2026-11-0${d}T09:00:00Z`;
const profiles = [
  { id: ME, display_name: 'Eden Albright', craft: 'Essays · Photographs', bio: 'Writes about ruins and the light in them.', portrait_path: null, role: who === 'editor' ? 'editor' : who === 'staff' ? 'staff' : who === 'fellow' ? 'fellow' : 'member', website: '', instagram: '', listed: true, public_email: null, created_at: t(1) },
  { id: 'm2', display_name: 'Jane Writer', craft: 'Fiction', bio: 'Short fiction about villages and bells.', portrait_path: null, role: 'member', library_public: true, website: '', instagram: '', listed: true, public_email: null, created_at: t(1) },
  { id: 'e9', display_name: 'Hester Vane', craft: 'Essays', bio: '', portrait_path: null, role: who === 'staff' ? 'editor' : 'staff', website: '', instagram: '', listed: true, public_email: null, created_at: t(1) },
  { id: 'f1', display_name: 'Miriam Hale', craft: 'Poetry, old churches', bio: 'Reads slowly, keeps what stays.', portrait_path: null, role: 'fellow', website: '', instagram: '', listed: true, public_email: null, created_at: t(1) },
  { id: 'm3', display_name: 'Thomas Ashgrove', craft: 'Poetry', bio: '', portrait_path: null, role: 'member', website: '', instagram: '', listed: true, public_email: null, created_at: t(2) },
];
const piece = (id, author, title, status, medium = 'essay', pillar = 'hearth') => ({
  id, author_id: author, title, standfirst: 'A line about what it holds.', body: 'The stones keep the psalms. '.repeat(60),
  pillar, medium, image_path: medium === 'photograph' ? '/images/four-lancet-window-1200.jpg' : null, image_alt: '', image_focus: '', photo_meta: {}, gallery: [], status, editor_note: status === 'returned' ? 'Lovely. Tighten the ending.' : '',
  submitted_at: t(2), published_at: status === 'approved' ? t(3) : null, created_at: t(1), updated_at: t(4), slug: id, revision: null, revision_at: null, writer_notified: true });
const n = Math.max(0, +opt('pieces', 12));
const pieces = [
  ...Array.from({ length: n }, (_, i) => piece('mine' + i, ME, ['Published piece', 'The Watchman’s Burden.', 'Echos of Eden', 'My Aching Hands', 'A Small Hymn for Tired Men', 'Oil in the Jar'][i % 6] + (i % 6 ? '' : ` ${i + 1}`), 'approved', i % 3 === 2 ? 'photograph' : i % 3 === 1 ? (i % 2 ? 'poetry' : 'prose') : 'essay', ['hearth', 'perimeter', 'watchtower'][i % 3])),
  piece('d1', ME, 'A draft in progress', 'draft'), piece('wd1', 'm2', 'What the Bell Remembers', 'draft', 'poetry'), piece('r1', ME, 'Returned with a note', 'returned'),
  { ...piece('s1', 'm2', 'The Bellringer’s Daughter', 'submitted', 'fiction'), assigned_to: ME }, ...(who === 'member' ? [{ ...piece('w1', ME, 'A Psalm in Waiting', 'submitted', 'poetry'), assigned_to: 'e9', review_opened_at: new Date().toISOString() }] : []), { ...piece('s2', 'm3', 'Psalm for the Night Shift', 'submitted', 'poetry'), assigned_to: 'e9', review_opened_at: new Date().toISOString() }, { ...piece('s3', 'm2', 'A Field Guide to Small Mercies', 'submitted', 'prose'), assigned_to: 'e9' }, piece('a2', 'm2', 'Vespers in a Roofless Nave', 'approved', 'fiction'),
];
const boards = [
  { id: 'b1', slug: 'the-nave', name: 'The Nave', description: 'Talk of anything.', image: '', position: 1, editor_only: false, keep_threads: 50 },
  { id: 'b2', slug: 'thesis-ideas', name: 'Thesis Ideas', description: 'Ideas in search of an argument.', image: '', position: 2, editor_only: false, keep_threads: 50 },
];
const threads = [
  { id: 'th1', board_id: 'b1', author_id: ME, title: 'Welcome to the Nave', pinned: true, locked: false, reply_count: 2, created_at: t(1), last_post_at: t(4), last_author_id: 'm2' },
  { id: 'th2', board_id: 'b1', author_id: 'm2', title: 'What are you reading this week?', pinned: false, locked: false, reply_count: 1, created_at: t(2), last_post_at: t(3), last_author_id: 'm3' },
];
const posts = [
  { id: 'p1', thread_id: 'th1', author_id: ME, body: 'Pull up a chair. This is the place for anything.', created_at: t(1), edited_at: null },
  { id: 'p2', thread_id: 'th1', author_id: 'm2', body: 'Glad to be here.', created_at: t(2), edited_at: null },
  { id: 'p3', thread_id: 'th2', author_id: 'm2', body: 'Rereading Gilead, slowly.', created_at: t(2), edited_at: null },
];
// Direct messages: two conversations, one unread.
const lo = (x, y) => (x < y ? [x, y] : [y, x]);
const [d1a, d1b] = lo(ME, 'm2'), [d2a, d2b] = lo(ME, 'm3');
const dm_threads = [
  { id: 'dm1', a: d1a, b: d1b, last_at: t(5), last_body: 'Would you read my draft before I send it in?', last_from: 'm2', a_read_at: t(3), b_read_at: t(3), a_cleared_at: '1970-01-01', b_cleared_at: '1970-01-01' },
  { id: 'dm2', a: d2a, b: d2b, last_at: t(2), last_body: 'Thank you, that helped.', last_from: ME, a_read_at: t(2), b_read_at: t(2), a_cleared_at: '1970-01-01', b_cleared_at: '1970-01-01' },
];
const dm_messages = [
  ...Array.from({ length: 14 }, (_, i) => ({ id: 'dmx' + i, thread_id: 'dm1', author_id: i % 4 === 3 ? 'm2' : ME, body: ['Test', 'What’s up?', 'This is a little test', 'Got it, thanks!'][i % 4], created_at: `2026-11-02T09:${String(10 + i).padStart(2, '0')}:00Z` })),
  { id: 'dm-1', thread_id: 'dm1', author_id: ME, body: 'Your piece on the lamp road stayed with me all week.', created_at: t(3) },
  { id: 'dm-2', thread_id: 'dm1', author_id: 'm2', body: 'That means a great deal. I nearly didn’t send it.', created_at: t(4) },
  { id: 'dm-3', thread_id: 'dm1', author_id: 'm2', body: 'Would you read my draft before I send it in?', created_at: t(5) },
];
// --heavy: a very busy member and a crowded Guild, to see the pages hold up (use with --pieces 150).
if (flag('heavy')) {
  const names = ['Ainslie Willson', 'Marcus Vale', 'Ruth Calloway', 'Benedict Hart', 'Clara Penhallow', 'Silas Thorne', 'Margaret O’Rourke-Fitzgerald', 'Isaiah Bell', 'Hannah Greaves', 'Tobias Wren'];
  for (let i = 4; i <= 60; i++) profiles.push({ id: 'm' + i, display_name: names[i % names.length] + (i >= 10 ? ' ' + i : ''), craft: ['Poetry', 'Fiction', 'Essays · Photographs', 'Testimony'][i % 4], bio: 'A long bio about stone, light and the slow work of words. '.repeat(3), portrait_path: null, role: 'member', website: '', instagram: '', listed: true, public_email: null, created_at: t(1) });
  const long = 'Hey how are you? This is a test of a very long message that keeps going. '.repeat(8);
  for (let c = 0; c < 25; c++) {
    const other = 'm' + (4 + c), [a, b] = lo(ME, other), id = 'hv' + c;
    const cnt = c === 0 ? 120 : 8;
    for (let k = 0; k < cnt; k++) dm_messages.push({ id: id + '-' + k, thread_id: id, author_id: k % 3 === 0 ? other : ME, body: k % 5 === 0 ? long : ['Amen to that.', 'Sending you the draft tonight.', 'Did you see the new piece in the Watchtower?', 'Praying for you this week.'][k % 4], created_at: `2026-11-0${1 + (k % 8)}T${String(8 + (k % 12)).padStart(2, '0')}:${String(k % 60).padStart(2, '0')}:00Z` });
    dm_threads.push({ id, a, b, last_at: `2026-11-08T${String(10 + (c % 12)).padStart(2, '0')}:00:00Z`, last_body: c % 3 ? long : 'Sending you the draft tonight.', last_from: c % 2 ? other : ME, a_read_at: c % 4 ? t(9) : t(1), b_read_at: c % 4 ? t(9) : t(1), a_cleared_at: '1970-01-01', b_cleared_at: '1970-01-01' });
  }
  for (let bi = 3; bi <= 6; bi++) boards.push({ id: 'b' + bi, slug: 'forum-' + bi, name: ['', '', '', 'The Common Room', 'The Watchtower Desk', 'Prayer and Petition', 'From the Editor’s Desk'][bi], description: 'A long description of what this forum is for, and what belongs here among the Guild.', image: '', position: bi, editor_only: false, keep_threads: 50 });
  for (const bd of boards) for (let k = 0; k < 40; k++) {
    const tid = 'ht-' + bd.id + '-' + k, replies = bd.id === 'b1' && k === 0 ? 200 : k % 7;
    threads.push({ id: tid, board_id: bd.id, author_id: k % 3 ? ME : 'm' + (4 + k % 30), title: k % 4 ? `A question about the long road back, part ${k + 1}, and what holds on it when everything else gives way` : `Thread ${k + 1}`, pinned: false, locked: replies >= 200, reply_count: replies, created_at: t(1 + (k % 8)), last_post_at: `2026-11-0${1 + (k % 8)}T${String(8 + (k % 12)).padStart(2, '0')}:00:00Z`, last_author_id: 'm' + (4 + k % 30) });
    for (let r = 0; r <= replies; r++) posts.push({ id: tid + '-p' + r, thread_id: tid, author_id: r % 2 ? ME : 'm' + (4 + r % 30), body: r % 6 === 0 ? long : 'Well said. I keep coming back to this.', created_at: `2026-11-0${1 + (r % 8)}T09:${String(r % 60).padStart(2, '0')}:00Z`, edited_at: null });
  }
}
['/images/duomo-spires-1200.jpg', '/images/four-lancet-window-1200.jpg', null, '/images/labyrinth-stained-light-1200.jpg', '/images/window-light-on-wall-1200.jpg', null, '/images/ascension-window-wide-1200.jpg'].forEach((img, i) => { if (pieces[i] && img) pieces[i].image_path = img; });
const tables = { profiles, pieces, forum_boards: boards, forum_threads: threads, forum_posts: posts,
  dm_threads, dm_messages, dm_blocks: [], dm_reports: [], thread_watch: [],
  piece_reflections: [{ id: 'rf1', piece_id: 'p1', author_id: 'm2', body: 'The fourth paragraph has been following me around the house all week.', created_at: t(4), reply: 'Thank you. It followed me around for a year before I wrote it down.' },
    { id: 'rf2', piece_id: 'p1', author_id: 'm3', body: 'Read aloud over breakfast. We both went quiet.', created_at: t(5), reply: null }],
  editor_sabbath: flag('sabbath') ? [{ editor_id: ME }] : [{ editor_id: 'e9' }],
  piece_change_requests: [{ piece_id: 'mine1', note: 'The middle section repeats the opening. Could you cut one of them, and look again at the last line?', asked_at: t(5) }],
  forum_reports: [{ id: 'fr1', post_id: 'p3', 'post.thread_id': 'th2', reason: 'This reads as an advertisement.', created_at: t(3), resolved: false, assigned_to: ME, post: { id: 'p1', thread_id: 't1', body: 'Have you tried my new course on writing? Link in my vault. It will change everything about how you work.' } }],
  inbox_notices: [{ id: 'nt1', member_id: ME, writer_id: 'm2', piece_id: 'a2', created_at: t(6), read_at: null, kind: 'published' }, { id: 'nt2', member_id: ME, writer_id: 'm2', piece_id: 'wd1', created_at: t(7), read_at: null, kind: 'draft' }],
  saves: [...['mine0', 'mine1', 'mine3', 'mine4', 'mine6', 'a2'].map((piece_id, i) => ({ member_id: 'f1', piece_id, created_at: t(9 - i) }))],
  library: [...['a2', 'mine0', 'mine1', 'mine2', 'mine3', 'mine4', 'mine5', 'mine6', 'mine7'].map((piece_id, i) => ({ member_id: ME, piece_id, created_at: t(9 - i) })),
    ...['mine0', 'mine2', 'mine4', 'mine1'].map((piece_id, i) => ({ member_id: 'm2', piece_id, created_at: t(8 - i) }))],   // Jane has opened her library (library_public)
  draft_shares: [{ piece_id: 'd1', reader_id: 'm2', created_at: t(5) }, { piece_id: 'wd1', reader_id: ME, created_at: t(6) }],
  draft_notes: [{ id: 'dn1', piece_id: 'wd1', author_id: ME, body: 'The opening is strong. The second stanza loses me a little: who is speaking?', created_at: t(6) }, { id: 'dn2', piece_id: 'wd1', author_id: 'm2', body: 'Thank you. It is the bell itself; I will make that plainer.', created_at: t(7) },
    { id: 'dn3', piece_id: 'd1', author_id: 'm2', body: 'I would cut the first paragraph and begin at the window.', created_at: t(6) }],
  forum_tallies: [{ member_id: ME, posts: flag('heavy') ? 1400 : 14, threads: flag('heavy') ? 160 : 3, best_thread: flag('heavy') ? 200 : 6, prayer: 1, boards: 2 }] };

// A small stand-in for Supabase's query language: eq, neq, in, is, not.is, or=(...), order, limit.
const test = (row, key, expr) => {
  const v = row[key], s = v === null || v === undefined ? 'null' : String(v);
  if (expr.startsWith('eq.')) return s === expr.slice(3);
  if (expr.startsWith('neq.')) return s !== expr.slice(4);
  if (expr.startsWith('in.(')) return expr.slice(4, -1).split(',').map((x) => x.replace(/"/g, '')).includes(s);
  if (expr === 'is.null') return v === null || v === undefined;
  if (expr === 'not.is.null') return !(v === null || v === undefined);
  return true;
};
function query(table, url) {
  let rows = [...(tables[table] ?? [])];
  for (const [k, v] of url.searchParams) {
    if (['select', 'order', 'limit', 'offset'].includes(k)) continue;
    if (k === 'or') { const parts = v.slice(1, -1).split(','); rows = rows.filter((r) => parts.some((p) => { const [col, ...rest] = p.split('.'); return test(r, col, rest.join('.')); })); continue; }
    rows = rows.filter((r) => test(r, k, v));
  }
  const ord = url.searchParams.get('order');
  if (ord) { const [col, dir] = ord.split(','); const [c, d] = col.split('.'); rows.sort((a, b) => String(a[c] ?? '').localeCompare(String(b[c] ?? '')) * (d === 'desc' ? -1 : 1)); }
  const lim = url.searchParams.get('limit'); if (lim) rows = rows.slice(0, +lim);
  if (table === 'pieces' && (url.searchParams.get('select') || '').includes('profiles')) rows = rows.map((r) => ({ ...r, profiles: { display_name: profiles.find((p) => p.id === r.author_id)?.display_name } }));
  return rows;
}

// ---- run --------------------------------------------------------------------------------------------------
const up = () => fetch(BASE).then(() => true, () => false);
(async () => {
  let server = null;
  if (!(await up())) {
    server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { cwd: path.join(__dirname, '..'), stdio: 'ignore', detached: true });
    for (let i = 0; i < 40 && !(await up()); i++) await new Promise((r) => setTimeout(r, 500));
  }
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: ME, role: 'authenticated', exp: 4102444800 })}.sig`;
  const session = { access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800,
    user: { id: ME, aud: 'authenticated', role: 'authenticated', email: 'eden@example.com', app_metadata: {}, user_metadata: {}, created_at: t(1) } };
  const sizes = [['phone', { viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true }], ['computer', { viewport: { width: Number(opt('width', 1280)), height: 900 } }]]
    .filter(([name]) => !opt('only') || opt('only') === name);
  const browser = await chromium.launch();
  let failed = false;
  for (const [name, ctxOpts] of sizes) {
    const ctx = await browser.newContext({ ...ctxOpts, deviceScaleFactor: 1 });
    const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/zblgggifysohxqtgvgxs.supabase.co/**', (route) => {
      const req = route.request(), url = new URL(req.url());
      const one = (req.headers()['accept'] || '').includes('vnd.pgrst.object');
      if (url.pathname.includes('/storage/')) return route.fulfill({ json: [] });
      if (url.pathname.endsWith('/rpc/dm_usage')) return route.fulfill({ json: { used: flag('heavy') ? 296 : 240, cap: 300 } });
      if (url.pathname.endsWith('/rpc/dm_unread')) return route.fulfill({ json: 1 });
      if (url.pathname.endsWith('/rpc/visit_stats')) return route.fulfill({ json: { today: 42, week: 318, top: [{ path: '/', views: 120 }, { path: '/guild/the-original-freemason/', views: 64 }, { path: '/hearth/', views: 41 }] } });
      if (url.pathname.endsWith('/rpc/editors_resting')) return route.fulfill({ json: flag('resting') });
      if (url.pathname.endsWith('/rpc/piece_stats')) return route.fulfill({ json: who === 'fellow' ? null : { marks: 17, reflections: 5, saves: 8 } });
      if (url.pathname.endsWith('/rpc/piece_counts')) { const m = {}; pieces.filter((p) => p.status === 'approved').forEach((p) => { m[p.author_id] = (m[p.author_id] || 0) + 1; }); return route.fulfill({ json: Object.entries(m).map(([author_id, n]) => ({ author_id, n })) }); }
      if (url.pathname.endsWith('/rpc/bell')) return route.fulfill({ json: { seen: t(5), items: [
        { kind: 'mention', at: t(8), who: 'm2', who_name: 'Jane Writer', who_portrait: null, piece: null, piece_title: null, piece_slug: null, thread: 'th2', thread_title: 'What are you reading this week?', post: 'p3' },
        { kind: 'mark', at: t(7), n: 14, who: 'm2', who_name: 'Jane Writer', who_portrait: null, piece: 'mine0', piece_title: 'Published piece 1', piece_slug: 'mine0', thread: null, thread_title: null },
        { kind: 'reflection', at: t(6), who: 'm3', who_name: 'Thomas Ashgrove', who_portrait: null, piece: 'mine1', piece_title: 'Published piece 2', piece_slug: 'mine1', thread: null, thread_title: null },
        { kind: 'follow', at: t(4), who: 'm3', who_name: 'Thomas Ashgrove', who_portrait: null, piece: null, piece_title: null, piece_slug: null, thread: null, thread_title: null },
        { kind: 'published', at: t(3), who: null, who_name: null, who_portrait: null, piece: 'mine2', piece_title: 'Published piece 3', piece_slug: 'mine2', thread: null, thread_title: null },
        { kind: 'save', at: t(2), who: 'm2', who_name: 'Jane Writer', who_portrait: null, piece: 'mine2', piece_title: 'Published piece 3', piece_slug: 'mine2', thread: null, thread_title: null },
      ] } });
      if (url.pathname.endsWith('/rpc/name_taken')) return route.fulfill({ json: /^\s*watchman\s*$/i.test((route.request().postDataJSON() || {}).n || '') });
      if (url.pathname.includes('/rpc/')) return route.fulfill({ json: null });
      const table = url.pathname.split('/rest/v1/')[1];
      if (req.method() !== 'GET') { const body = JSON.parse(req.postData() || '{}'); const row = Array.isArray(body) ? body[0] : body; return route.fulfill({ json: one ? { id: 'new', ...row } : [{ id: 'new', ...row }] }); }
      const rows = table ? query(table, url) : [];
      return route.fulfill({ json: one ? rows[0] ?? null : rows });
    });
    await page.goto(BASE + '/');
    await page.evaluate(([s, signedIn, editor, fellowAcct, chief]) => {
      localStorage.setItem('oa_arrived', '1');
      if (signedIn) { localStorage.setItem('sb-zblgggifysohxqtgvgxs-auth-token', JSON.stringify(s)); localStorage.setItem('oa_member', JSON.stringify({ name: 'Eden Albright', editor, chief, fellow: fellowAcct })); }
    }, [session, who !== 'visitor', who === 'editor' || who === 'staff', who === 'fellow', who === 'editor']);
    await page.goto(BASE + target, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    if (opt('click')) for (const css of opt('click').split(';;')) { await page.click(css.trim()); await page.waitForTimeout(600); }
    if (opt('scroll')) { await page.locator(opt('scroll')).first().scrollIntoViewIfNeeded(); await page.evaluate((css) => document.querySelector(css)?.scrollIntoView({ block: 'start' }), opt('scroll')); await page.waitForTimeout(1500); }
    if (opt('type')) { const at = opt('type').lastIndexOf('|'), css = opt('type').slice(0, at); await page.fill(css, opt('type').slice(at + 1)); await page.locator(css).scrollIntoViewIfNeeded(); await page.waitForTimeout(900); }
    // A whole-page picture: walk down the page first, so everything that fades in as you reach it has arrived.
    if (flag('full')) { await page.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 180)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400)); }); }
    // (measured against the screen's own width: a phone quietly zooms out to fit a page that is too wide, which would hide it)
    const overflow = await page.evaluate((w) => document.documentElement.scrollWidth > w + 1, ctxOpts.viewport.width);
    const file = path.join(out, `${name}.png`);
    await page.screenshot({ path: file, fullPage: flag('full') });
    console.log(`${name}: ${file}${overflow ? '  ⚠ page scrolls sideways' : ''}${errors.length ? '  ⚠ errors: ' + errors.join(' | ') : '  no page errors'}`);
    if (overflow || errors.length) failed = true;
    await ctx.close();
  }
  await browser.close();
  if (server) try { process.kill(-server.pid); } catch {}
  process.exit(failed ? 1 : 0);
})();
