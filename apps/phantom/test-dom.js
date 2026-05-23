const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/home', { waitUntil: 'networkidle2' });
  
  const bodyHtml = await page.evaluate(() => document.body.innerHTML);
  
  const mainRect = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return null;
    const rect = main.getBoundingClientRect();
    return { width: rect.width, height: rect.height, html: main.innerHTML.slice(0, 300) };
  });

  const ionRouterOutlet = await page.evaluate(() => {
    const el = document.querySelector('ion-router-outlet');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });

  console.log("Main element:", mainRect);
  console.log("IonRouterOutlet:", ionRouterOutlet);
  
  await browser.close();
})();
