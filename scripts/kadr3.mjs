// Кадр конкретного уровня по URL с параметрами: node scripts/kadr3.mjs out.png "uroven=1-3" "KeyD:1000"
import { chromium } from '../../mars-colony/node_modules/playwright/index.mjs';

const [, , out, query = '', scenario = ''] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto(`http://localhost:5180/?${query}`);
await page.waitForTimeout(1500);
for (const step of scenario.split(';').filter(Boolean)) {
  const [keys, ms] = step.split(':');
  for (const k of keys.split('+')) await page.keyboard.down(k);
  await page.waitForTimeout(Number(ms ?? 500));
  for (const k of keys.split('+')) await page.keyboard.up(k);
}
console.log(await page.textContent('#hud'));
await page.screenshot({ path: out });
await browser.close();
