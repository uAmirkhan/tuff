// Снимок кадра спайка: открыть страницу, подождать, нажать клавиши, снять PNG.
import { chromium } from '../../mars-colony/node_modules/playwright/index.mjs';
const [,, out = 'kadry/kadr.png', scenario = ''] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('console', (m) => console.log('[console]', m.text()));
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto('http://localhost:5180/');
await page.waitForTimeout(1500);
for (const step of scenario.split(';').filter(Boolean)) {
  const [key, ms] = step.split(':');
  await page.keyboard.down(key);
  await page.waitForTimeout(Number(ms ?? 500));
  await page.keyboard.up(key);
}
await page.waitForTimeout(300);
const hud = await page.textContent('#hud');
console.log(hud);
await page.screenshot({ path: out });
await browser.close();
