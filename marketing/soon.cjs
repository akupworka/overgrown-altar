const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const HERE = __dirname, OUT = path.join(HERE, 'coming-soon'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
const NAMES = ['', 'watchtower', 'coming-soon', 'perimeter', 'the-thesis', 'hearth', 'only-the-work', 'fellowship', 'three-rooms', 'guild'];
(async () => {
  const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })).newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  // Instagram puts the newest post first, so the bottom-right tile is posted first and the top-left tile last.
  for (let t = 1; t <= 9; t++) { await page.goto(`file://${HERE}/soon.html?p=t${t}`); await page.evaluate(() => window.ready);
    await page.screenshot({ path: path.join(OUT, `coming-soon-post-${String(10 - t).padStart(2, '0')}-of-09-${NAMES[t]}.jpg`), type: 'jpeg', quality: 95 }); }
  await b.close(); console.log('done');
})();
