// Экран конца уровня на телефоне: проходим 1-1 записанным вводом (как tests/prohozhdenie-1-1),
// снимаем экран конца, тапаем «Дальше», проверяем, что открылся 1-2.
import { chromium, devices } from '../../mars-colony/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['Pixel 5 landscape'] });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto('http://localhost:5180/?uroven=1-1');
await page.waitForTimeout(1500);
const shagi = [
  [['KeyD'], 300],
  [['KeyD', 'KeyW', 'KeyJ'], 420],
  [['KeyD'], 240],
  [['KeyD'], 240],
  [['KeyD'], 600],
];
const pokazan = () =>
  page.evaluate(() => document.querySelector('#ekran')?.classList.contains('pokazan'));
for (const [keys, takty] of shagi) {
  for (const k of keys) await page.keyboard.down(k);
  const t0 = Date.now();
  while (Date.now() - t0 < (takty * 1000) / 60) {
    await page.waitForTimeout(100);
    if (await pokazan()) break;
  }
  for (const k of keys) await page.keyboard.up(k);
  if (await pokazan()) break;
  const s = await page.evaluate(() => window.tuff);
  console.log(keys.join('+'), '→', s.cx.toFixed(1), s.cy.toFixed(1));
}
const est = await pokazan();
console.log('экран конца:', est);
if (est) {
  console.log(await page.textContent('#ekran .karta'));
  await page.screenshot({ path: 'kadry/15-konec-telefon.png' });
  await page.tap('#knopka-dalshe');
  await page.waitForTimeout(600);
  const hud = await page.textContent('#hud');
  const s = await page.evaluate(() => window.tuff);
  console.log(
    'после «Дальше»: экран',
    await pokazan(),
    '| герой',
    s.cx.toFixed(1),
    s.cy.toFixed(1),
    '| HUD',
    (hud ?? '').split('\n')[0],
  );
  await page.screenshot({ path: 'kadry/16-posle-dalshe.png' });
}
await browser.close();
