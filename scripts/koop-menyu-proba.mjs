// Меню кооператива и шкалы жара. Плюс главная проверка витка 009: переживает ли выбор
// перезагрузку — до правки после неё кнопка говорила «вдвоём», а второго тела не было.
import { chromium } from 'file:///C:/Ai/Jarvis/mars-colony/node_modules/playwright/index.mjs';

const PORT = process.argv[2] ?? 5180;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[error]', e.message));

const sost = () =>
  page.evaluate(() => ({ koop: window.tuff.koop, tel: window.tuff.tela?.length ?? 0 }));

await page.goto(`http://127.0.0.1:${PORT}/?uroven=k1-1`);
await page.waitForTimeout(2200);
console.log('1 старт без адреса:', JSON.stringify(await sost()));

await page.click('#menyu-knopka');
await page.waitForTimeout(400);
await page.screenshot({ path: 'kadry/menyu-1-odin.png' });
const podpis = await page.evaluate(() => {
  const b = [...document.querySelectorAll('#menyu button')].map((e) => e.textContent);
  return b;
});
console.log('2 кнопки меню:', JSON.stringify(podpis));

// включить кооп кнопкой
const knopka = page.locator('#menyu button', { hasText: /вдвоём|together/i }).first();
await knopka.click();
await page.waitForTimeout(1500);
console.log('3 после нажатия:', JSON.stringify(await sost()));
await page.screenshot({ path: 'kadry/menyu-2-koop.png' });

// ГЛАВНОЕ: перезагрузка без адреса
await page.reload();
await page.waitForTimeout(2500);
console.log('4 после перезагрузки:', JSON.stringify(await sost()));
await page.screenshot({ path: 'kadry/menyu-3-posle-perezagruzki.png' });

await browser.close();
