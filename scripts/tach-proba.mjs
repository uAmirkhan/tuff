// Репетиция дня 8: сенсорное управление в эмуляции телефона. Стик слева, ромб кнопок справа,
// два пальца одновременно через CDP. node scripts/tach-proba.mjs [out.png]
import { chromium, devices } from '../../mars-colony/node_modules/playwright/index.mjs';

const out = process.argv[2] ?? 'kadry/11-tach.png';
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['Pixel 5 landscape'] });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto('http://localhost:5180/?uroven=1-1');
await page.waitForTimeout(1500);
const cdp = await ctx.newCDPSession(page);
const vp = page.viewportSize();
console.log('экран', vp);
const geo = await page.evaluate(() => {
  const w = innerWidth,
    h = innerHeight;
  const r = Math.max(34, Math.min(w, h) * 0.07);
  const cx = w - r * 3.2,
    cy = h - r * 3.2;
  return {
    r,
    vyazkost: [cx, cy - r * 1.6],
    korka: [cx - r * 1.6, cy],
    rasplav: [cx + r * 1.6, cy],
    vybros: [cx, cy + r * 1.6],
  };
});
const sost = () => page.evaluate(() => window.tuff);
const touch = (type, points) =>
  cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: points.map((p, i) => ({ x: p[0], y: p[1], id: i })),
  });
const s0 = await sost();
// 1. стик: палец слева, тянем вправо на 60 px, держим 1,5 с
const stik = [vp.width * 0.25, vp.height * 0.6];
await touch('touchStart', [stik]);
await touch('touchMove', [[stik[0] + 60, stik[1]]]);
await page.waitForTimeout(1500);
const s1 = await sost();
// 2. второй палец на Выброс, не отпуская стик
await touch('touchStart', [[stik[0] + 60, stik[1]], geo.vybros]);
await page.waitForTimeout(120);
const s2 = await sost();
await touch('touchEnd', [[stik[0] + 60, stik[1]]]); // отпустили кнопку (остался стик)
await page.waitForTimeout(600);
// 3. скольжение пальца с Корки на Расплав через центр ромба (аккорд по пути)
await touch('touchStart', [[stik[0] + 60, stik[1]], geo.korka]);
await page.waitForTimeout(100);
const s3 = await sost();
await touch('touchMove', [
  [stik[0] + 60, stik[1]],
  [(geo.korka[0] + geo.rasplav[0]) / 2, geo.korka[1]],
]);
await page.waitForTimeout(100);
const s4 = await sost();
await touch('touchMove', [[stik[0] + 60, stik[1]], geo.rasplav]);
await page.waitForTimeout(100);
const s5 = await sost();
await page.screenshot({ path: out });
await touch('touchEnd', []);
await page.waitForTimeout(200);
const s6 = await sost();
const hud = await page.textContent('#hud');
console.log(
  'старт',
  s0.cx.toFixed(2),
  '| после стика вправо',
  s1.cx.toFixed(2),
  'dx',
  s1.nam.dx.toFixed(2),
  'тач',
  s1.tach,
);
console.log(
  'стик+Выброс',
  s2.nam,
  '| Корка',
  s3.nam.korka,
  '| середина (аккорд)',
  s4.nam.korka,
  s4.nam.rasplav,
  '| Расплав',
  s5.nam.rasplav,
  s5.nam.korka,
);
console.log('отпустили всё', s6.nam, '| промахи', (hud ?? '').split('\n')[1]);
await browser.close();
