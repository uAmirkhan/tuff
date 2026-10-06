// Живая проверка ворот длины в самой игре.
// Фазы переключаются ПО ПОЛОЖЕНИЮ тел, а не по секундам: в браузере на одну секунду приходится
// меньше тактов, чем в движке, и сценарий, размеченный временем, даёт другой разбег.
// Рецепт живого прогона — урок 23.
import { chromium } from 'file:///C:/Ai/Jarvis/mars-colony/node_modules/playwright/index.mjs';

const bezSliyaniya = process.argv[2] === 'bez';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto('http://127.0.0.1:5180/?uroven=vorota-dliny&koop=1');
await page.waitForTimeout(2500);

const sost = () =>
  page.evaluate(() => ({
    slito: window.tuff.slito,
    tela: window.tuff.tela.map((t) => [+t.x.toFixed(2), +t.y.toFixed(2)]),
  }));

let nazhato = new Set();
const derzhat = async (spisok) => {
  const nuzhno = new Set(spisok);
  for (const k of nazhato) if (!nuzhno.has(k)) await page.keyboard.up(k);
  for (const k of nuzhno) if (!nazhato.has(k)) await page.keyboard.down(k);
  nazhato = nuzhno;
};
const SLIT = bezSliyaniya ? [] : ['KeyF', 'KeyP'];
const VLEVO = ['KeyA', 'ArrowLeft'];
const VPRAVO = ['KeyD', 'ArrowRight'];
const DAL = 38;

let bylProhod = false;
let maksX = 0;
const shag = async () => {
  await page.waitForTimeout(80);
  const s = await sost();
  const x = Math.max(...s.tela.map((t) => t[0]));
  if (x > maksX) maksX = x;
  if (!bylProhod && s.tela.every(([tx, ty]) => tx > DAL + 0.3 && ty > -1)) bylProhod = true;
  return s;
};

// 1. слиться
await derzhat(SLIT);
for (let i = 0; i < 10; i++) await shag();
// 2. отходить назад, пока не упрёмся в левую стену (ждём, пока перестанут двигаться)
await derzhat([...SLIT, ...VLEVO]);
let proshloe = 999;
for (let i = 0; i < 200; i++) {
  const s = await shag();
  const x = Math.min(...s.tela.map((t) => t[0]));
  if (x < 2 && Math.abs(x - proshloe) < 0.05) break;
  proshloe = x;
}
const otoshli = Math.min(...(await sost()).tela.map((t) => t[0]));
// 3. разгон вправо до исхода
await derzhat([...SLIT, ...VPRAVO]);
for (let i = 0; i < 200 && !bylProhod; i++) await shag();
await derzhat([]);
const itog = await sost();
console.log(
  `${bezSliyaniya ? 'без слияния' : 'слитые'}: отошли до x=${otoshli.toFixed(2)}, дальше всего x=${maksX.toFixed(2)}, итог ${JSON.stringify(itog)} — ${bylProhod ? 'ВОРОТА ПРОЙДЕНЫ' : 'не пройдены'}`,
);
await browser.close();
