import { chromium, devices } from '../../mars-colony/node_modules/playwright/index.mjs';
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['Pixel 5 landscape'] });
const page = await ctx.newPage();
await page.goto('http://localhost:5180/?uroven=1-1');
await page.waitForTimeout(1200);
const r = await page.evaluate(async () => {
  const w = innerWidth,
    h = innerHeight;
  const r = Math.max(34, Math.min(w, h) * 0.07);
  const cx = w - r * 3.2,
    cy = h - r * 3.2;
  const korka = [cx - r * 1.6, cy],
    rasplav = [cx + r * 1.6, cy],
    vyazkost = [cx, cy - r * 1.6];
  const ev = (type, id, [x, y]) =>
    document.body.dispatchEvent(
      new PointerEvent(type, {
        pointerId: id,
        pointerType: 'touch',
        clientX: x,
        clientY: y,
        bubbles: true,
        isPrimary: id === 1,
        button: 0,
      }),
    );
  const zhdat = () => new Promise((res) => setTimeout(res, 80));
  const out = {};
  ev('pointerdown', 7, korka);
  await zhdat();
  out.korka = { ...window.tuff.nam };
  ev('pointermove', 7, [(korka[0] + rasplav[0]) / 2, cy]);
  await zhdat();
  out.seredina = { ...window.tuff.nam };
  ev('pointermove', 7, rasplav);
  await zhdat();
  out.rasplav = { ...window.tuff.nam };
  // аккорд: палец между Вязкостью и Расплавом (диагональ ромба, соседние кнопки)
  ev('pointermove', 7, [(vyazkost[0] + rasplav[0]) / 2, (vyazkost[1] + rasplav[1]) / 2]);
  await zhdat();
  out.akkord = { ...window.tuff.nam };
  ev('pointerup', 7, rasplav);
  await zhdat();
  out.otpustil = { ...window.tuff.nam };
  return { r, out };
});
const f = (n) =>
  Object.entries(n)
    .filter(([k, v]) => v === true)
    .map(([k]) => k)
    .join('+') || 'нет';
console.log(
  'r',
  r.r.toFixed(1),
  Object.entries(r.out)
    .map(([k, v]) => `${k}: ${f(v)}`)
    .join(' | '),
);
await browser.close();
