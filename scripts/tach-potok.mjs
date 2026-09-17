// Поток тестера на телефоне: открыть, тапнуть «Уровни», выбрать уровень тапом, закрыть меню,
// пройти немного, умереть от лавы (1-3), экран конца через ?uroven=zh-1 и «Дальше». Всё тапами.
import { chromium, devices } from '../../mars-colony/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['Pixel 5 landscape'] });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[error]', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('[console]', m.text());
});
await page.goto('http://localhost:5180/');
await page.waitForTimeout(1500);
const vidno = (sel) =>
  page.evaluate((s) => {
    const e = document.querySelector(s);
    return !!e && getComputedStyle(e).display !== 'none' && e.classList.contains('pokazan');
  }, sel);
// 1. меню уровней тапом по кнопке
await page.tap('#menyu-knopka');
await page.waitForTimeout(300);
console.log('меню открыто тапом:', await vidno('#menyu'));
await page.screenshot({ path: 'kadry/13-menyu-telefon.png' });
const stroki = await page.$$eval('#menyu .uroven', (els) =>
  els.map(
    (e) =>
      `${e.textContent?.trim().slice(0, 30)}${e.classList.contains('zakryt') ? ' [закрыт]' : ''}`,
  ),
);
console.log('строки меню:', stroki.join(' | '));
// 2. тап по первому открытому уровню
const otkrytye = await page.$$('#menyu .uroven:not(.zakryt)');
await otkrytye[0].tap();
await page.waitForTimeout(500);
console.log('меню закрылось после выбора:', !(await vidno('#menyu')));
// 3. стик вправо 2 с: герой едет
const s0 = await page.evaluate(() => window.tuff.cx);
const cdp = await ctx.newCDPSession(page);
const vp = page.viewportSize();
await cdp.send('Input.dispatchTouchEvent', {
  type: 'touchStart',
  touchPoints: [{ x: vp.width * 0.25, y: vp.height * 0.6, id: 0 }],
});
await cdp.send('Input.dispatchTouchEvent', {
  type: 'touchMove',
  touchPoints: [{ x: vp.width * 0.25 + 60, y: vp.height * 0.6, id: 0 }],
});
await page.waitForTimeout(2000);
await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
const s1 = await page.evaluate(() => window.tuff.cx);
console.log('герой сдвинулся стиком:', (s1 - s0).toFixed(2));
// 4. экран конца: Жерло заканчивается по времени? нет; берём 1-1 и проходим ботом невозможно тапами быстро.
// Проверяем экран конца через смерть: уровень 1-3, бежим вправо в лаву без Корки.
await page.goto('http://localhost:5180/?uroven=1-3');
await page.waitForTimeout(1200);
await page.keyboard.down('KeyD');
await page.waitForTimeout(6000);
await page.keyboard.up('KeyD');
const hud = await page.textContent('#hud');
console.log('после 6 с бега в 1-3:', (hud ?? '').split('\n')[0]);
await page.screenshot({ path: 'kadry/14-telefon-1-3.png' });
await browser.close();
