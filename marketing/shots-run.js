// ---- the stills: crisp screens of the real pages (pretend Guild data), for the reels -----------------------------
//   node shots.cjs                         every phone screen        (ONLY=a,b to choose; AS=fellow for the Fellowship's)
//   DEVICE=desk node shots.cjs             the computer's screens    (saved as desk-*.jpg)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const up2 = () => fetch(BASE).then(() => true, () => false);
const DESK = process.env.DEVICE === 'desk';
(async () => {
  let server = null;
  if (!(await up2())) { server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { cwd: path.join(__dirname, '..'), stdio: 'ignore', detached: true }); for (let i = 0; i < 40 && !(await up2()); i++) await sleep(500); }
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: ME, role: 'authenticated', exp: 4102444800 })}.sig`;
  const session = { access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, user: { id: ME, aud: 'authenticated', role: 'authenticated', email: 'eden@example.com', app_metadata: {}, user_metadata: {}, created_at: t(1) } };
  const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext(DESK ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 } : { viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  const handler = /*HANDLER*/;
  await page.route('**/zblgggifysohxqtgvgxs.supabase.co/**', handler);
  await page.goto(BASE + '/');
  await page.evaluate(([s, fellow]) => { localStorage.setItem('oa_arrived', '1'); localStorage.setItem('sb-zblgggifysohxqtgvgxs-auth-token', JSON.stringify(s)); localStorage.setItem('oa_member', JSON.stringify({ name: 'Eden Albright', editor: false, chief: false, fellow })); }, [session, who === 'fellow']);
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const night = (on) => page.evaluate((on) => localStorage.setItem('oa_comfort', JSON.stringify(on ? { night: true } : {})), on);
  // opts: prep (do something first), screen (one screen only, not the whole page), keepBar (leave what is pinned to the foot)
  const shot = async (name, url, opts = {}) => {
    if (only && !only.includes(name)) return;
    await page.goto(BASE + url, { waitUntil: 'networkidle' }); await sleep(1000);
    await page.addStyleTag({ content: '.d-tabbar, .gbar, [data-gbar] { display: none !important; } html { scroll-behavior: auto !important; } .ls-bar { bottom: 26px !important; animation: none !important; }' });
    if (!opts.screen) await page.evaluate(async () => { const end = Math.min(document.documentElement.scrollHeight, 5200); for (let y = 0; y < end; y += innerHeight * 0.7) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 220)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 500)); });
    if (opts.prep) await opts.prep();
    await page.screenshot({ path: path.join(OUT, (DESK ? 'desk-' : '') + name + '.png'), fullPage: !opts.screen });
    console.log('shot', (DESK ? 'desk-' : '') + name);
  };
  const typeTitle = async () => { const tt = page.locator('#d-title'); if (await tt.count()) { await tt.fill('What the Stones Remember'); await sleep(300);
    const body = page.locator('.d-rich-in'); if (DESK && await body.count()) { await body.click(); await page.keyboard.type('The abbey has had no roof since the reign of a king nobody here could name. Rain comes straight down into the nave, and in spring the grass grows where the choir once stood.'); }
    await sleep(300); await page.evaluate(() => document.activeElement && document.activeElement.blur()); } };
  // the Listen bar, as it looks part-way through a reading (a headless browser has no voice, so the bar is set by hand)
  const listening = async () => {
    await page.locator('button:has([data-listen-word])').first().click().catch(() => {}); await sleep(900);
    await page.evaluate(() => {
      const bar = document.querySelector('.ls-bar'); if (!bar) return;
      bar.querySelector('[data-ls-state]').textContent = 'Reading aloud';
      bar.querySelector('[data-ls-fill]').style.cssText = 'transition:none;transform:scaleX(.36)';
      bar.querySelector('[data-ls-play]').innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M8 5.5v13M16 5.5v13"/></svg>';
      document.querySelectorAll('.ls-now').forEach((e) => e.classList.remove('ls-now'));
      const p = [...document.querySelectorAll('p')].find((e) => (e.textContent || '').trim().startsWith('I went expecting')); if (p) { p.classList.add('ls-now'); const r = p.getBoundingClientRect(); scrollTo(0, scrollY + r.top - innerHeight * 0.42); }
    }); await sleep(500);
  };
  await shot('prestige', '/guild/members/?view=prestige');
  await shot('trophies', '/guild/members/?view=trophies');
  await shot('vault', '/guild/members/?m=' + ME);
  await shot('guild', '/guild/members/');
  await shot('desk', '/guild/desk/');
  await shot('write', '/guild/desk/#write', { prep: typeTitle });
  await shot('reading', '/guild/members/?p=mine0');
  await shot('library', '/guild/members/?view=library');
  await shot('thread', '/guild/members/?t=th2');
  await shot('forum', '/guild/members/?view=forum');
  await night(true);
  await shot('reading-night', '/guild/members/?p=mine0');
  await shot('listen', '/guild/members/?p=mine0', { screen: true, prep: listening });
  await night(false);
  await shot('gallery', '/gallery/');
  await shot('way', '/guild/members/?view=way');            // (run with AS=fellow)
  await shot('fellowdesk', '/guild/desk/');                 // (run with AS=fellow)
  await shot('collection', '/guild/members/?view=library');  // (run with AS=fellow)
  await shot('watchtower', '/watchtower/');
  await shot('hearth', '/hearth/');
  await shot('perimeter', '/perimeter/');
  await browser.close(); if (server) try { process.kill(-server.pid); } catch {}
})();
