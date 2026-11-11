const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const HERE = __dirname, OUT = path.join(HERE, 'posts'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch(); const page = await (await b.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })).newPage();
  page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
  await page.goto(`file://${HERE}/posts.html?p=01-overgrown-altar`); const ids = await page.evaluate(() => window.ids);
  for (const id of ids) { await page.goto(`file://${HERE}/posts.html?p=${id}`); await page.evaluate(() => window.ready); await page.screenshot({ path: path.join(OUT, `overgrown-altar-post-${id}.jpg`), type: 'jpeg', quality: 95 }); }
  await b.close(); console.log('done', ids.length);
})();
