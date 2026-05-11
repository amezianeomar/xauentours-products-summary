const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const file = path.resolve(__dirname, '..', 'products.json');
  const raw = fs.readFileSync(file, 'utf8');
  const products = JSON.parse(raw);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const selectors = ['#tab-description', '.woocommerce-Tabs-panel--description', '.entry-content', '.product .summary', '.description', '#content', '.woocommerce-product-details__short-description', '.post-content', '.content', '.woocommerce-Tabs-panel'];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    try {
      console.log(`SCRAPING ${i+1}/${products.length}: ${p.link}`);
      await page.goto(p.link, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(800);
      let text = '';
      for (const sel of selectors) {
        try {
          const el = await page.$(sel);
          if (el) {
            text = (await el.innerText()).trim();
            if (text && text.length > 50) break;
          }
        } catch (e) {}
      }
      if (!text || text.length < 50) {
        try {
          const article = await page.$('article');
          if (article) text = (await article.innerText()).trim();
        } catch (e) {}
      }
      if (!text || text.length < 50) {
        text = (await page.evaluate(() => (document.querySelector('main')||document.body).innerText || '')).trim();
      }
      // basic cleaning
      text = text.replace(/\r/g, '').replace(/\n{2,}/g, '\n\n').trim();
      // limit size to avoid huge JSON
      products[i].description = text.slice(0, 20000);
      console.log(`  -> ok (${(products[i].description||'').length} chars)`);
    } catch (err) {
      console.error(`  -> error: ${String(err)}`);
      products[i].description = '';
    }
  }

  // overwrite products.json
  fs.writeFileSync(file, JSON.stringify(products, null, 2), 'utf8');
  await browser.close();
  console.log('Finished. products.json updated.');
})();
