// Renders the motion ads: every frame is drawn by the page at an exact time, photographed, and handed to ffmpeg.
//   node render.cjs stills            a few key frames of every ad in every shape (to look at before the long render)
//   node render.cjs video [ad] [fmt]  the finished .mp4 files
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const HERE = __dirname, OUT = path.join(HERE, 'out'); fs.mkdirSync(OUT, { recursive: true });
const FMT = { v: [1080, 1920, 'vertical'], s: [1080, 1080, 'square'], h: [1920, 1080, 'wide'] };
const ADS = { thesis: 'the-thesis', call: 'the-call', rooms: 'three-rooms', ranks: 'earn-your-place',
  // the reels (vertical only): node render.cjs video reel1 v
  reel1: 'reel-coming-soon', reel2: 'reel-earn-your-place', reel3: 'reel-the-work', reel4: 'reel-three-rooms', reel5: 'reel-the-fellowship' };
const mode = process.argv[2] || 'stills', onlyAd = process.argv[3], onlyFmt = process.argv[4], FPS = 30;
(async () => {
  const browser = await chromium.launch();
  for (const ad of Object.keys(ADS)) for (const f of Object.keys(FMT)) {
    if ((onlyAd && onlyAd !== ad && onlyAd !== 'all') || (onlyFmt && onlyFmt !== f)) continue;
    if (ad.startsWith('reel') && f !== 'v') continue;
    const [w, h, shape] = FMT[f];
    const page = await (await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })).newPage();
    page.on('pageerror', (e) => console.log('PAGE ERROR', ad, f, e.message));
    await page.goto(`file://${HERE}/ad.html?ad=${ad}&fmt=${f}`);
    await page.evaluate(() => window.ready);
    const T = await page.evaluate(() => window.T);
    if (mode === 'stills') {
      const at = process.env.AT ? process.env.AT.split(',').map(Number) : [0.12, 0.42, 0.68, 0.95].map((x) => Math.round(T * x));
      for (const ms of at) { await page.evaluate((t) => window.seek(t), ms); await page.screenshot({ path: path.join(OUT, `still-${ad}-${f}-${String(ms).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 80 }); }
      console.log('stills', ad, f);
    } else {
      const file = path.join(OUT, `overgrown-altar-${ADS[ad]}-${shape}-${w}x${h}.mp4`);
      const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '96k', '-shortest', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] });
      const frames = Math.round((T / 1000) * FPS);
      for (let i = 0; i < frames; i++) {
        await page.evaluate((t) => window.seek(t), (i * 1000) / FPS);
        const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      }
      ff.stdin.end(); await new Promise((r) => ff.on('close', r));
      console.log('video', file, (fs.statSync(file).size / 1e6).toFixed(1) + ' MB');
    }
    await page.context().close();
  }
  await browser.close();
})();
