// Натяжение перед расцеплением: кадр без натяжения и кадр перед самым разрывом.
// Приёмка витка 007 показала, что первая версия читалась как «гаснет»: свечение ужималось.
// Теперь размер не меняется, тревога идёт цветом и яркостью — это и надо увидеть.
import { chromium } from 'file:///C:/Ai/Jarvis/mars-colony/node_modules/playwright/index.mjs';

const PORT = process.argv[2] ?? 5180;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto(`http://127.0.0.1:${PORT}/?uroven=k1-1&koop=1&chisto=1`);
await page.waitForTimeout(2200);

const nat = () => page.evaluate(() => ({ slito: window.tuff.slito, n: window.tuff.natyazhenie }));

// слиться
await page.keyboard.down('KeyF');
await page.keyboard.down('KeyP');
await page.waitForTimeout(900);
console.log('слились:', JSON.stringify(await nat()));
await page.screenshot({ path: 'kadry/natyazhenie-0.png' });

// встречный ввод: держим почти до разрыва
await page.keyboard.down('KeyD');
await page.keyboard.down('ArrowLeft');
await page.waitForTimeout(380);
console.log('перед разрывом:', JSON.stringify(await nat()));
await page.screenshot({ path: 'kadry/natyazhenie-1.png' });
await page.keyboard.up('KeyD');
await page.keyboard.up('ArrowLeft');
await page.keyboard.up('KeyF');
await page.keyboard.up('KeyP');
await browser.close();
