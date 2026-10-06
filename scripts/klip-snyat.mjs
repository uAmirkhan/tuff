// Съёмка клипа-крючка на уровне koop-1: слиться, отойти за разбегом, разогнаться, выброс.
// Стена 2,0 ледяная. По замеру витка 010 её берёт только слитая пара, и это единственная
// выгода слияния, которая выдержала контроль без слияния и все шесть повадок пассажира.
// Рецепт живого прогона — урок 23: vite слушает 127.0.0.1, playwright по схеме file:///.
import { chromium } from 'file:///C:/Ai/Jarvis/mars-colony/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto('http://127.0.0.1:5180/?uroven=koop-1&koop=1');
await page.waitForTimeout(2500);

const sost = () =>
  page.evaluate(() => ({
    slito: window.tuff.slito,
    tela: window.tuff.tela.map((t) => [+t.x.toFixed(2), +t.y.toFixed(2)]),
  }));

let n = 0;
const KADROV = 110;
const sled = [];
// сценарий по кадрам съёмки, а не по тактам игры: кадр примерно 90-120 мс
const shag = (k) => {
  if (k < 8) return { derzhat: ['KeyF', 'KeyP'] };
  if (k < 38) return { derzhat: ['KeyF', 'KeyP', 'KeyA', 'ArrowLeft'] };
  if (k < 52) return { derzhat: ['KeyF', 'KeyP', 'KeyD', 'ArrowRight'] };
  return {
    derzhat: ['KeyF', 'KeyP', 'KeyD', 'ArrowRight', 'KeyW', 'ArrowUp', 'Space', 'ShiftRight'],
  };
};

let nazhato = new Set();
for (let k = 0; k < KADROV; k++) {
  const nuzhno = new Set(shag(k).derzhat);
  for (const key of nazhato) if (!nuzhno.has(key)) await page.keyboard.up(key);
  for (const key of nuzhno) if (!nazhato.has(key)) await page.keyboard.down(key);
  nazhato = nuzhno;
  await page.screenshot({ path: `kadry/klip/${String(n++).padStart(3, '0')}.png` });
  if (k % 10 === 0) {
    const s = await sost();
    sled.push(`к${String(k).padStart(3)} слито ${s.slito} тела ${JSON.stringify(s.tela)}`);
  }
}
for (const key of nazhato) await page.keyboard.up(key);
const itog = await sost();
console.log(sled.join('\n'));
console.log('итог:', JSON.stringify(itog));
// ворота koop-1: плато на высоте 2, проход = оба тела выше 2,5 и правее 30
const proshli = itog.tela.every(([x, y]) => x > 30 && y > 2.5);
console.log(proshli ? 'ВОРОТА ПРОЙДЕНЫ' : 'ворота не пройдены');
await browser.close();
