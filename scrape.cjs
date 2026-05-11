const fs = require('fs');

async function scrape() {
  const urls = [
    'https://xauentours.com/tour/',
    'https://xauentours.com/tour/page/2/',
    'https://xauentours.com/tour/page/3/'
  ];
  const baseUrl = 'https://xauentours.com';
  const productsMap = new Map();

  for (const url of urls) {
    try {
      console.log(`Fetching ${url}...`);
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`Failed to fetch ${url}: ${response.status}`);
        continue;
      }
      const html = await response.text();
      
      // Split by a more common marker in the list
      const blocks = html.split(/class=['"][^'"]*strip_all_tour_list[^'"]*['"]/i);
      console.log(`Found ${blocks.length - 1} blocks in ${url}`);

      for (let i = 1; i < blocks.length; i++) {
        // We need to capture enough of the block. 
        // Since we split BY the class, the block starts AFTER the class attribute.
        // We look ahead until the next potential block or a reasonable end.
        let block = blocks[i];
        const nextMarker = block.search(/class=['"][^'"]*strip_all_tour_list[^'"]*['"]/i);
        if (nextMarker !== -1) {
          block = block.substring(0, nextMarker);
        }

        // Title: <h3>...</h3>
        const titleMatch = block.match(/<h3[^>]*>(.*?)<\/h3>/is);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : '';

        // Price: first currency-like token in price_list span
        const priceListMatch = block.match(/<span[^>]*class=['"][^'"]*price_list[^'"]*['"][^>]*>(.*?)<\/span>/is);
        let price = '';
        if (priceListMatch) {
          const priceContent = priceListMatch[1].replace(/<[^>]*>/g, ' ');
          const priceToken = priceContent.match(/(\d+[,.]?\d*\s*€|€\s*\d+[,.]?\d*|\$\s*\d+[,.]?\d*|\d+[,.]?\d*\s*\$)/i);
          price = priceToken ? priceToken[0].trim() : '';
        }

        // Category: from class short_info
        const categoryMatch = block.match(/<li[^>]*><i[^>]*class=['"][^'"]*short_info[^'"]*['"][^>]*><\/i>\s*([^<]+)/is);
        let category = categoryMatch ? categoryMatch[1].trim() : '';

        // Image URL: first img src or data-src
        const imgMatch = block.match(/<img[^>]*src=['"]([^'"]+)['"]/i) || block.match(/<img[^>]*data-src=['"]([^'"]+)['"]/i);
        let imageUrl = imgMatch ? imgMatch[1] : '';
        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = new URL(imageUrl, baseUrl).href;
        }

        // Link: first /tour/ href
        const linkMatch = block.match(/href=['"](https?:\/\/xauentours\.com\/tour\/[^'"]+|(?:\.\.\/)*tour\/[^'"]+)['"]/i);
        let link = '';
        if (linkMatch) {
            link = linkMatch[1].startsWith('http') ? linkMatch[1] : new URL(linkMatch[1], baseUrl).href;
        }

        if (!link || link.includes('?')) continue;

        // Infer category if missing
        if (!category) {
          if (/transfer/i.test(title)) category = 'Transfer';
          else if (/guided tour/i.test(title)) category = 'Guided Tours';
          else if (/day trip/i.test(title)) category = 'Day Trip';
          else category = 'Tour';
        }

        if (!productsMap.has(link)) {
          productsMap.set(link, {
            title,
            price,
            category,
            imageUrl,
            link
          });
        }
      }
    } catch (err) {
      console.error(`Error scraping ${url}:`, err.message);
    }
  }

  const result = Array.from(productsMap.values());
  fs.writeFileSync('products.json', JSON.stringify(result, null, 2));
  console.log(`Scraped ${result.length} unique products.`);
  console.log('First 3 items:', JSON.stringify(result.slice(0, 3), null, 2));
}

scrape();
