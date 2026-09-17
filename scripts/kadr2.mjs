// Кадр с одновременным удержанием нескольких клавиш: "KeyD+KeyW+KeyJ:2500"
import { chromium } from '../../mars-colony/node_modules/playwright/index.mjs';

const [, , out, scenario = ''] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
await page.goto('http://localhost:5180/');
await page.waitForTimeout(1500);
for (const step of scenario.split(';').filter(Boolean)) {
  const [keys, ms] = step.split(':');
  const list = keys.split('+');
  for (const k of list) await page.keyboard.down(k);
  await page.waitForTimeout(Number(ms ?? 500));
  for (const k of list) await page.keyboard.up(k);
}
console.log(await page.textContent('#hud'));
await page.screenshot({ path: out });
await browser.close();
