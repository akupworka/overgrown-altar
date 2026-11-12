// ---- the tour ---------------------------------------------------------------------------------------------
const { spawn: spawn2 } = require('child_process');
const SHAPE = process.env.SHAPE || 'wide';   // wide: a computer, 1920x1080 · tall: a phone, 1080x1920
const VP = SHAPE === 'wide' ? { width: 1152, height: 648, dsf: 1920 / 1152 } : { width: 432, height: 768, dsf: 2.5 };
const OUTDIR = path.join(__dirname, 'out'), FR = path.join(__dirname, 'frames-' + SHAPE);
fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true }); fs.mkdirSync(OUTDIR, { recursive: true });
const MONO = fs.readFileSync(path.join(__dirname, 'ad.html'), 'utf8').match(/<svg class="mono-mark "[\s\S]*?<\/svg>/)[0];
const up2 = () => fetch(BASE).then(() => true, () => false);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// What rides on top of every page: the cursor, the caption, the opening and closing cards.
function overlay(MONO, tall) {
  if (window.__tour) return; window.__tour = true;
  const make = () => {
    const st = document.createElement('style');
    st.textContent = `
      #t-cur { position: fixed; left: 0; top: 0; z-index: 2147483646; pointer-events: none; width: 30px; height: 30px; margin: -3px 0 0 -5px; will-change: transform; filter: drop-shadow(0 3px 5px rgba(0,0,0,.6)); }
      #t-cur.touch { width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; background: rgba(255,227,163,.28); box-shadow: inset 0 0 0 2px rgba(255,227,163,.9); filter: none; }
      #t-cur.touch svg { display: none; }
      .t-rip { position: fixed; z-index: 2147483645; pointer-events: none; width: 64px; height: 64px; margin: -32px 0 0 -32px; border-radius: 50%; box-shadow: inset 0 0 0 2px #FFE3A3; animation: t-rip .6s ease-out forwards; }
      @keyframes t-rip { from { transform: scale(.2); opacity: 1; } to { transform: scale(1.25); opacity: 0; } }
      #t-cap { position: fixed; left: 0; right: 0; bottom: ${tall ? 96 : 44}px; z-index: 2147483640; pointer-events: none; display: flex; justify-content: center; opacity: 0; transform: translateY(12px); transition: opacity .5s, transform .6s cubic-bezier(.16,1,.3,1); }
      #t-cap.on { opacity: 1; transform: none; }
      #t-cap span { font-family: 'Cormorant', serif; font-style: italic; font-size: ${tall ? 25 : 34}px; line-height: 1.2; color: #F3ECDC; text-align: center; max-width: 88%; padding: ${tall ? '13px 22px 14px' : '14px 34px 16px'}; border-radius: 999px; background: rgba(6,8,6,.9); box-shadow: inset 0 0 0 1px rgba(255,227,163,.55), 0 18px 50px rgba(0,0,0,.7); }
      #t-card { position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: ${tall ? 20 : 24}px; text-align: center; padding: 0 8%; background: #060806; color: #F3ECDC; opacity: 0; transition: opacity .8s; }
      #t-card.on { opacity: 1; }
      #t-card svg { height: ${tall ? 120 : 150}px; width: auto; color: #F3ECDC; }
      #t-card .t-big { font-family: 'Cormorant', serif; font-weight: 500; font-size: ${tall ? 54 : 84}px; line-height: 1.02; }
      #t-card .t-sub { font-family: 'Cormorant', serif; font-style: italic; font-size: ${tall ? 24 : 33}px; color: #E0D9C9; }
      #t-card .t-lab { font-family: 'Alte Haas', sans-serif; font-size: ${tall ? 11 : 14}px; letter-spacing: .36em; text-transform: uppercase; color: #FFE3A3; }
      #t-card .t-thread { height: 3px; width: 190px; border-radius: 9px; background: linear-gradient(90deg,#3E7BFF,#B05BFF,#FF3B4E,#FFC44D,#3DE0A0); }
      #t-card .t-url { font-family: 'Alte Haas', sans-serif; font-weight: 700; font-size: ${tall ? 13 : 17}px; letter-spacing: .3em; text-transform: uppercase; color: #12160F; background: #FFE3A3; padding: 14px 26px 12px; border-radius: 999px; margin-top: 8px; }
      #t-beat { position: fixed; left: 0; top: 0; width: 1px; height: 1px; z-index: 2147483647; pointer-events: none; animation: t-beat 1s linear infinite; }
      @keyframes t-beat { from { opacity: .011; } to { opacity: .012; } }
      html { scroll-behavior: auto !important; }`;
    const cur = document.createElement('div'); cur.id = 't-cur'; if (tall) cur.className = 'touch';
    cur.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30"><path d="M5 2.5v17l4.6-4.3 3 6.6 2.7-1.2-3-6.5H19z" fill="#F3ECDC" stroke="#0B0D0A" stroke-width="1.4" stroke-linejoin="round"/></svg>';
    const cap = document.createElement('div'); cap.id = 't-cap'; cap.innerHTML = '<span></span>';
    const card = document.createElement('div'); card.id = 't-card';
    const beat = document.createElement('div'); beat.id = 't-beat';   // (keeps the screen being drawn, so the recording is steady)
    document.head.append(st); document.body.append(cap, card, cur, beat);
    const place = (x, y) => { cur.style.transform = `translate(${x}px,${y}px)`; };
    let pos = { x: innerWidth * 0.6, y: innerHeight * 0.55 }; try { pos = JSON.parse(sessionStorage.getItem('t_pos')) || pos; } catch {}
    place(pos.x, pos.y);
    addEventListener('mousemove', (e) => { place(e.clientX, e.clientY); try { sessionStorage.setItem('t_pos', JSON.stringify({ x: e.clientX, y: e.clientY })); } catch {} }, true);
    addEventListener('mousedown', (e) => { const r = document.createElement('div'); r.className = 't-rip'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; document.body.append(r); setTimeout(() => r.remove(), 700); }, true);
    window.tourCaption = (t) => { try { sessionStorage.setItem('t_cap', t || ''); } catch {} if (!t) { cap.classList.remove('on'); return; } cap.firstChild.textContent = t; cap.classList.add('on'); };
    window.tourCard = (html, instant) => { try { sessionStorage.setItem('t_card', html || ''); } catch {} if (!html) { card.classList.remove('on'); return; } card.innerHTML = html.replace('{MONO}', MONO); if (instant) { card.style.transition = 'none'; card.classList.add('on'); card.offsetHeight; card.style.transition = ''; } else card.classList.add('on'); };
    window.tourHideCursor = (h) => { cur.style.opacity = h ? '0' : '1'; };
    try { const c = sessionStorage.getItem('t_card'); if (c) window.tourCard(c, true); const t = sessionStorage.getItem('t_cap'); if (t) { cap.firstChild.textContent = t; cap.style.transition = 'none'; cap.classList.add('on'); cap.offsetHeight; cap.style.transition = ''; } } catch {}
  };
  if (document.body) make(); else addEventListener('DOMContentLoaded', make);
}

(async () => {
  let server = null;
  if (!(await up2())) { server = spawn('npx', ['astro', 'preview', '--port', String(PORT)], { cwd: path.join(__dirname, '..'), stdio: 'ignore', detached: true }); for (let i = 0; i < 40 && !(await up2()); i++) await sleep(500); }
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const jwt = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: ME, role: 'authenticated', exp: 4102444800 })}.sig`;
  const session = { access_token: jwt, refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: 4102444800, user: { id: ME, aud: 'authenticated', role: 'authenticated', email: 'eden@example.com', app_metadata: {}, user_metadata: {}, created_at: t(1) } };
  const tall = SHAPE !== 'wide';
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: VP.width, height: VP.height }, deviceScaleFactor: VP.dsf, ...(tall ? { isMobile: true, hasTouch: false } : {}) });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  const handler = /*HANDLER*/;
  await page.route('**/zblgggifysohxqtgvgxs.supabase.co/**', handler);
  await page.goto(BASE + '/');
  await page.evaluate(([s]) => { localStorage.setItem('oa_arrived', '1'); localStorage.setItem('sb-zblgggifysohxqtgvgxs-auth-token', JSON.stringify(s)); localStorage.setItem('oa_member', JSON.stringify({ name: 'Eden Albright', editor: false, chief: false, fellow: false })); }, [session]);
  await page.addInitScript(`(${overlay.toString()})(${JSON.stringify(MONO)}, ${tall});`);
  await page.addInitScript(({ html }) => { try { if (!sessionStorage.getItem('t_started')) { sessionStorage.setItem('t_started', '1'); sessionStorage.setItem('t_card', html); } } catch {} },
    { html: '{MONO}<div class="t-thread"></div><div class="t-lab">Overgrown Altar</div><div class="t-big">Inside the Guild</div>' });
  await page.goto(BASE + '/guild/members/', { waitUntil: 'networkidle' });
  await sleep(900);

  // ---- the camera
  const cdp = await ctx.newCDPSession(page); let n = 0; const stamps = [];
  cdp.on('Page.screencastFrame', (f) => { const file = path.join(FR, String(n++).padStart(6, '0') + '.jpg'); fs.writeFileSync(file, Buffer.from(f.data, 'base64')); stamps.push([file, f.metadata.timestamp]); cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {}); });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 93, maxWidth: Math.round(VP.width * VP.dsf), maxHeight: Math.round(VP.height * VP.dsf), everyNthFrame: 2 });

  // ---- the hand
  let mx = VP.width * 0.6, my = VP.height * 0.55;
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const move = async (x, y, ms = 700) => { const x0 = mx, y0 = my, steps = Math.max(8, Math.round(ms / 16)); for (let i = 1; i <= steps; i++) { const k = ease(i / steps); await page.mouse.move(x0 + (x - x0) * k, y0 + (y - y0) * k); await sleep(14); } mx = x; my = y; };
  const centre = async (loc) => { await loc.first().waitFor({ state: 'visible', timeout: 8000 }); const b = await loc.first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  const click = async (loc, ms = 750) => { const c = await centre(loc); await move(c.x, c.y, ms); await sleep(180); await page.mouse.down(); await sleep(70); await page.mouse.up(); };
  const scroll = async (dy, ms = 1400) => { const steps = Math.round(ms / 16); let done = 0; for (let i = 1; i <= steps; i++) { const want = dy * ease(i / steps), d = want - done; done = want; await page.evaluate((d) => window.scrollBy(0, d), d); await sleep(14); } };
  const caption = (text) => page.evaluate((x) => window.tourCaption && window.tourCaption(x), text).catch(() => {});
  const card = (html) => page.evaluate((x) => window.tourCard && window.tourCard(x), html).catch(() => {});
  const settle = async (ms = 700) => { await page.waitForLoadState('domcontentloaded').catch(() => {}); await sleep(ms); };

  // ---- the walk
  await sleep(1500);                                   // the opening card
  await card(null); await sleep(500);
  await caption('A house for writers, anchored in Christ.');
  await move(VP.width * 0.5, VP.height * 0.5, 600); await scroll(tall ? 520 : 400, 1500); await sleep(500);

  if (!tall) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await click(page.locator('.inner-rooms a[data-match="prestige"]'), 650); await settle(500);
    await caption('Ten prestiges to climb.');
    await move(VP.width * 0.5, VP.height * 0.62, 500); await scroll(640, 1900); await sleep(500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await click(page.locator('a:visible, button:visible').filter({ hasText: /^\s*Trophies\s*$/ }), 550); await settle(450);
    await caption('Fifty-four trophies to earn.');
    await move(VP.width * 0.55, VP.height * 0.6, 450); await scroll(1000, 2300); await sleep(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    await click(page.locator('.inner-rooms a[data-match="forum"]'), 550); await settle(500);
    await caption('A forum without the noise.');
    await move(VP.width * 0.5, VP.height * 0.7, 450); await scroll(300, 900); await sleep(300);
    await click(page.locator('.fo-board').first(), 550); await settle(1100);
    await page.evaluate(() => window.scrollTo(0, 0));
    await click(page.locator('.inner-rooms a[data-match="desk"]'), 600); await settle(800);
    await caption('A desk of your own.');
    await move(VP.width * 0.55, VP.height * 0.5, 450); await scroll(240, 900); await sleep(500); await page.evaluate(() => window.scrollTo(0, 0));
  } else {
    await click(page.locator('.g-tile-pz'), 550); await settle(500);
    await caption('Ten prestiges to climb.');
    await scroll(700, 2000); await sleep(400);
    await page.evaluate(() => window.scrollTo(0, 0));
    await click(page.locator('a:visible, button:visible').filter({ hasText: /^\s*Trophies\s*$/ }), 500); await settle(450);
    await caption('Fifty-four trophies to earn.');
    await scroll(1200, 2500); await sleep(300);
    await click(page.locator('.gbar a[data-match="forum"]'), 500); await settle(500);
    await caption('A forum without the noise.');
    await scroll(380, 1100); await sleep(300);
    await click(page.locator('.fo-board').first(), 500); await settle(1000);
    await click(page.locator('.gbar a[data-match="desk"]'), 500); await settle(800);
    await caption('A desk of your own.');
    await scroll(300, 1000); await sleep(400); await page.evaluate(() => window.scrollTo(0, 0));
  }
  // the writing room
  const write = page.locator('a:visible, button:visible').filter({ hasText: /^\s*Write( a piece)?\s*$/ }).first();
  await click(write, 600); await settle(800);
  await caption('Every piece is read by an editor.');
  const title = page.locator('#d-title');
  if (await title.count()) { await click(title, 500); await page.keyboard.type('What the Stones Remember', { delay: 62 }); }
  await sleep(1200);
  // the vault
  await page.evaluate(() => window.scrollTo(0, 0));
  if (tall) await page.goto(BASE + '/guild/members/?m=' + ME, { waitUntil: 'domcontentloaded' });   // (a phone's writing room hides the bar: cut straight to the vault)
  else await click(page.locator('a.member[data-vault]'), 600);
  await settle(900);
  await caption('A vault that keeps your work.');
  await move(VP.width * 0.5, VP.height * 0.6, 450); await scroll(tall ? 760 : 520, 1900); await sleep(800);
  // the close
  await caption(null);
  await card('{MONO}<div class="t-big">The Guild is open.</div><div class="t-thread"></div><div class="t-sub">By application. Every one is read.</div><div class="t-url">overgrownaltar.com</div>');
  await page.evaluate(() => window.tourHideCursor(true));
  await sleep(3400);
  await cdp.send('Page.stopScreencast'); await sleep(200);
  await browser.close(); if (server) try { process.kill(-server.pid); } catch {}

  // ---- the cut: each frame held for exactly as long as it was on the screen, at a steady 30 a second
  const list = stamps.map(([file, ts], i) => `file '${file}'\nduration ${Math.max(0.001, (i + 1 < stamps.length ? stamps[i + 1][1] : ts + 0.05) - ts).toFixed(4)}`).join('\n') + `\nfile '${stamps[stamps.length - 1][0]}'\n`;
  fs.writeFileSync(path.join(FR, 'list.txt'), list);
  const W = Math.round(VP.width * VP.dsf), H = Math.round(VP.height * VP.dsf);
  const out = path.join(OUTDIR, `overgrown-altar-inside-the-guild-${SHAPE === 'wide' ? 'wide-1920x1080' : 'vertical-1080x1920'}.mp4`);
  const secs = stamps[stamps.length - 1][1] - stamps[0][1];
  await new Promise((r) => spawn2('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(FR, 'list.txt'), '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
    '-vf', `fps=30,scale=${W}:${H}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' }).on('close', r));
  console.log('tour', out, n + ' frames', secs.toFixed(1) + 's', (n / secs).toFixed(1) + ' fps', (fs.statSync(out).size / 1e6).toFixed(1) + ' MB');
})();
