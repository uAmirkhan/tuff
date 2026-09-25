// Проверка боевой сборки: `npx vite preview --port 5182 --host 127.0.0.1` (без --host слушает только [::1],
// а Chromium из Playwright туда не пускает), страница грузится без ошибок, герой едет, меню открывается.
import { chromium, devices } from '../../mars-colony/node_modules/playwright/index.mjs';

const port = process.argv[2] ?? '5182';
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['Pixel 5 landscape'] });
const page = await ctx.newPage();
const oshibki = [];
page.on('pageerror', (e) => oshibki.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error') oshibki.push(m.text());
});
page.on('requestfailed', (r) => oshibki.push(`запрос упал: ${r.url()}`));
await page.goto(`http://127.0.0.1:${port}/`);
await page.waitForTimeout(1500);
const s0 = await page.evaluate(() => window.tuff?.cx);
await page.keyboard.down('KeyD');
await page.waitForTimeout(1500);
await page.keyboard.up('KeyD');
const s1 = await page.evaluate(() => window.tuff?.cx);
await page.tap('#menyu-knopka');
await page.waitForTimeout(200);
const menyu = await page.evaluate(() =>
  document.querySelector('#menyu')?.classList.contains('pokazan'),
);
console.log(
  `сборка: старт ${s0?.toFixed(2)}, после 1,5 с ${s1?.toFixed(2)}, меню ${menyu}, ошибок ${oshibki.length}`,
);
for (const o of oshibki) console.log('  ', o);
await browser.close();
process.exit(oshibki.length || s1 - s0 < 1 ? 1 : 0);
