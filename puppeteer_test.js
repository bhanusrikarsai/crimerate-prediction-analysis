const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    
    // Capture console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    
    await page.goto('http://localhost:5000');
    console.log("Page loaded");
    
    // Check if #authScreen is visible
    const authVisible = await page.$eval('#authScreen', el => window.getComputedStyle(el).display !== 'none');
    console.log("Auth Screen Visible:", authVisible);

    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();
