// Кадры для страницы на порталах: 1280×720, по уровню на кадр, с прогоном ввода.
// node scripts/kadr-portal.mjs out.png "uroven=1-3" "KeyD:1000" [w] [h]
import { chromium } from '../../mars-colony/node_modules/playwright/index.mjs';

const [, , out, query = '', scenario = '', w = '1280', h = '720'] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto(`http://localhost:5180/?${query}`);
await page.waitForTimeout(1500);
for (const step of scenario.split(';').filter(Boolean)) {
  const [keys, ms] = step.split(':');
  for (const k of keys.split('+')) await page.keyboard.down(k);
  await page.waitForTimeout(Number(ms ?? 500));
  for (const k of keys.split('+')) await page.keyboard.up(k);
}
console.log(out, await page.textContent('#hud'));
await page.screenshot({ path: out });
await browser.close();
