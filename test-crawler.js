const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Track console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  console.log('Navigating to login...');
  await page.goto('https://gksmart-ai-app.web.app/');
  
  // Login
  await page.waitForSelector('input[type="text"]');
  await page.type('input[type="text"]', 'GKSMART');
  await page.type('input[type="password"]', '666666');
  await page.click('button[type="submit"]');

  console.log('Waiting for dashboard...');
  await page.waitForSelector('.w-24.h-24.bg-gradient-to-br', { timeout: 10000 }).catch(() => console.log('Timeout waiting for workspace grid'));
  
  // Wait a bit to ensure elements are ready
  await new Promise(r => setTimeout(r, 2000));
  
  // Try to find the TOI PACK card (it should have text "TOI ACAR PACK")
  const cards = await page.$$('div');
  let clicked = false;
  for (let card of cards) {
    const text = await page.evaluate(el => el.textContent, card);
    if (text && text.includes('TOI ACAR PACK')) {
      await card.click();
      clicked = true;
      break;
    }
  }
  
  if (!clicked) {
    console.log('Could not click TOI PACK. Finding button manually.');
    // Let's just evaluate a click on the closest matching element
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const toi = elements.find(el => el.textContent.includes('TOI ACAR PACK') && el.onClick);
      if (toi) toi.click();
    });
  }

  console.log('Waiting for TOI workspace...');
  await new Promise(r => setTimeout(r, 3000));
  
  // Click on Page 13 pagination button
  console.log('Finding page 13 button...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent.trim() === '13');
    if (btn) {
      console.log('Clicking page 13');
      btn.click();
    } else {
      console.log('Could not find page 13 button');
    }
  });
  
  console.log('Waiting to see if it crashes...');
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Test done.');
  await browser.close();
})();
