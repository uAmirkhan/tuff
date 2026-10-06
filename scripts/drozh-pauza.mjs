// Дрожь натяжения на ЗАМОРОЗКЕ (?stopkadr=1, клавиша F9): симуляция стоит, отрисовка идёт,
// ввод не трогается. Значит соседние кадры отличаются только дрожью — физическое
// движение тел, которое забивало обычный дифф, из измерения уходит.
//
// Обычный дифф эту задачу не решает: замер показал, что под натяжением соседние кадры
// расходятся одинаково и с исправленной дрожью, и со сломанной, и даже при размахе,
// увеличенном в десять раз. Инструмент калибровку не прошёл.
import { chromium } from 'file:///C:/Ai/Jarvis/mars-colony/node_modules/playwright/index.mjs';

const KADROV = 8;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto('http://127.0.0.1:5180/?uroven=k1-1&koop=1&chisto=1&stopkadr=1');
await page.waitForTimeout(2200);

const nat = () => page.evaluate(() => ({ slito: window.tuff.slito, n: window.tuff.natyazhenie }));
// между кадрами ждём больше одного кадра игры: снимки подряд попадают в один и тот же
// отрисованный кадр, и тогда они одинаковы независимо от того, работает канал или нет
const seriya = async (imya) => {
  for (let i = 0; i < KADROV; i++) {
    await page.screenshot({ path: `kadry/drozh/${imya}-${i}.png` });
    await page.waitForTimeout(30);
  }
};

const rezhim = process.argv[2] === 'pokoy' ? 'pokoy' : 'natyazhenie';
await page.keyboard.down('KeyF');
await page.keyboard.down('KeyP');
await page.waitForTimeout(900);
if (rezhim === 'natyazhenie') {
  await page.keyboard.down('KeyD');
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(220);
}
console.log(`${rezhim}, до паузы:`, JSON.stringify(await nat()));
// заморозка F9: симуляция стоит, ввод не трогается, слияние и натяжение замирают как есть
await page.keyboard.press('F9');
await page.waitForTimeout(400);
console.log(`${rezhim}, на паузе:`, JSON.stringify(await nat()));
await seriya(`pauza-${rezhim}`);
await browser.close();
