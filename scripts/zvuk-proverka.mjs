// Проверка звука: после первого нажатия AudioContext создан и работает, при действиях создаются узлы
import { chromium } from '../../mars-colony/node_modules/playwright/index.mjs';

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
await page.addInitScript(() => {
  const w = window;
  w.__uzlov = 0;
  const orig = AudioContext.prototype.createOscillator;
  AudioContext.prototype.createOscillator = function () {
    w.__uzlov++;
    return orig.call(this);
  };
  const origB = AudioContext.prototype.createBufferSource;
  AudioContext.prototype.createBufferSource = function () {
    w.__uzlov++;
    return origB.call(this);
  };
});
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto('http://localhost:5180/?uroven=1-1');
await page.waitForTimeout(1200);
await page.keyboard.down('KeyD');
await page.waitForTimeout(800);
await page.keyboard.up('KeyD');
await page.keyboard.down('KeyL');
await page.waitForTimeout(300);
await page.keyboard.up('KeyL');
await page.keyboard.down('Space');
await page.waitForTimeout(300);
await page.keyboard.up('Space');
await page.keyboard.down('KeyJ');
await page.waitForTimeout(300);
await page.keyboard.up('KeyJ');
const rez = await page.evaluate(() => ({ uzlov: window.__uzlov }));
console.log('создано аудиоузлов после действий:', rez.uzlov);
await browser.close();
