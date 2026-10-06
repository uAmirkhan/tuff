// Дрожь натяжения диффом соседних кадров (карточка tuff-8ee).
// Статичным кадром дрожь показать нельзя по устройству: она знакопеременная по кадрам.
// Поэтому снимаем подряд несколько кадров при натяжении 0 и при натяжении около 0,8
// и меряем, насколько соседние кадры расходятся.
//
// Оговорка, которую надо держать при чтении чисел: соседние кадры расходятся и от физического
// движения тел, а встречный ввод, который создаёт натяжение, тела ещё и двигает. Поэтому
// сравнение честно только как «при натяжении расхождение заметно больше», а не как чистый замер
// одного канала.
import { chromium } from 'file:///C:/Ai/Jarvis/mars-colony/node_modules/playwright/index.mjs';

const KADROV = 6;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto('http://127.0.0.1:5180/?uroven=k1-1&koop=1&chisto=1');
await page.waitForTimeout(2200);

const nat = () => page.evaluate(() => ({ slito: window.tuff.slito, n: window.tuff.natyazhenie }));
const seriya = async (imya) => {
  for (let i = 0; i < KADROV; i++)
    await page.screenshot({ path: `kadry/drozh/${imya}-${i}.png` });
};

await page.keyboard.down('KeyF');
await page.keyboard.down('KeyP');
await page.waitForTimeout(900);
console.log('слились:', JSON.stringify(await nat()));
await seriya('pokoy');

await page.keyboard.down('KeyD');
await page.keyboard.down('ArrowLeft');
await page.waitForTimeout(380);
console.log('под натяжением:', JSON.stringify(await nat()));
await seriya('natyazhenie');

await page.keyboard.up('KeyD');
await page.keyboard.up('ArrowLeft');
await page.keyboard.up('KeyF');
await page.keyboard.up('KeyP');
await browser.close();
