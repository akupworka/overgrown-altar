const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const HERE = __dirname, OUT = path.join(HERE, 'posts3'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })).newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  await page.goto(`file://${HERE}/posts3.html?p=none`); const ids = await page.evaluate(() => window.ids);
  for (const id of ids) { await page.goto(`file://${HERE}/posts3.html?p=${id}`); await page.evaluate(() => window.ready); await page.screenshot({ path: path.join(OUT, `overgrown-altar-set-three-${id}.jpg`), type: 'jpeg', quality: 95 }); }
  await b.close(); console.log('done', ids.length);
})();
