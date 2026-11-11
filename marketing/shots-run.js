// ---- the stills: crisp phone screens of the real pages (pretend Guild data), for the reels -----------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up2 = () => fetch(BASE).then(() => true, () => false);
(async () => {
  let server = null;
  if (!(await up2())) { server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { cwd: path.join(__dirname, '..'), stdio: 'ignore', detached: true }); for (let i = 0; i < 40 && !(await up2()); i++) await sleep(500); }
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: ME, role: 'authenticated', exp: 4102444800 })}.sig`;
  const session = { access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, user: { id: ME, aud: 'authenticated', role: 'authenticated', email: 'eden@example.com', app_metadata: {}, user_metadata: {}, created_at: t(1) } };
  const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  const handler = /*HANDLER*/;
  await page.route('**/zblgggifysohxqtgvgxs.supabase.co/**', handler);
  await page.goto(BASE + '/');
  await page.evaluate(([s]) => { localStorage.setItem('oa_arrived', '1'); localStorage.setItem('sb-zblgggifysohxqtgvgxs-auth-token', JSON.stringify(s)); localStorage.setItem('oa_member', JSON.stringify({ name: 'Eden Albright', editor: false, chief: false, fellow: s.fellow })); }, [{ ...session, fellow: who === 'fellow' }]);
  let shot = async (name, url, prep) => {
    await page.goto(BASE + url, { waitUntil: 'networkidle' }); await sleep(1000);
    if (prep) await prep();
    await page.addStyleTag({ content: '.d-tabbar, .gbar, [data-gbar] { display: none !important; } html { scroll-behavior: auto !important; }' });
    // walk down the page first, so everything that fades in as you reach it has arrived
    await page.evaluate(async () => { const end = Math.min(document.documentElement.scrollHeight, 5200); for (let y = 0; y < end; y += innerHeight * 0.7) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 220)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 500)); });
    await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: true });
    console.log('shot', name);
  };
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null; const shot0 = shot; shot = async (n, u, p) => { if (!only || only.includes(n)) await shot0(n, u, p); };
  await shot('prestige', '/guild/members/?view=prestige');
  await shot('trophies', '/guild/members/?view=trophies');
  await shot('vault', '/guild/members/?m=' + ME);
  await shot('guild', '/guild/members/');
  await shot('desk', '/guild/desk/');
  await shot('write', '/guild/desk/#write', async () => { const tt = page.locator('#d-title'); if (await tt.count()) { await tt.fill('What the Stones Remember'); await sleep(400); await page.evaluate(() => document.activeElement && document.activeElement.blur()); } });
  await shot('reading', '/guild/members/?p=mine0');
  await shot('library', '/guild/members/?view=library');
  await shot('gallery', '/gallery/');
  await shot('way', '/guild/members/?view=way');            // (run with AS=fellow)
  await shot('fellowdesk', '/guild/desk/');                 // (run with AS=fellow)
  await shot('collection', '/guild/members/?view=library');  // (run with AS=fellow)
  await shot('watchtower', '/watchtower/');
  await shot('hearth', '/hearth/');
  await shot('perimeter', '/perimeter/');
  await browser.close(); if (server) try { process.kill(-server.pid); } catch {}
})();
