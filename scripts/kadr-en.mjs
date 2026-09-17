import { chromium } from '../../mars-colony/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 }, locale: 'en-US' });
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto('http://localhost:5180/?uroven=1-1');
await page.waitForTimeout(1500);
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
console.log(await page.textContent('#hud'));
await page.screenshot({ path: 'kadry/22-menyu-en.png' });
const a = await page.evaluate(() =>
  JSON.parse(localStorage.getItem('tuff-analitika') || '[]').map((s) => s.tip),
);
console.log('аналитика:', a.join(', '));
await browser.close();
