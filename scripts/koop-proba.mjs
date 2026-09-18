// Живая проверка кооператива: два тела, независимый ввод, слияние по двум кнопкам.
// Состояние читаем из window.tuff, а не угадываем по картинке.
import { chromium } from '../../mars-colony/node_modules/playwright/index.mjs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[error]', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('[console]', m.text());
});
await page.goto('http://localhost:5180/?uroven=k1-1&koop=1');
await page.waitForTimeout(2000);

const sost = () =>
  page.evaluate(() => ({
    koop: window.tuff.koop,
    slito: window.tuff.slito,
    svyazey: window.tuff.svyazey,
    tela: window.tuff.tela,
    d: window.tuff.rasstoyanie,
  }));
const pech = async (podpis) => {
  const s = await sost();
  const t = s.tela.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' | ');
  console.log(
    `${podpis}: тел ${s.tela.length} [${t}] расстояние ${s.d.toFixed(2)} слито ${s.slito} связей ${s.svyazey}`,
  );
  return s;
};
const derzhat = async (kod, ms) => {
  await page.keyboard.down(kod);
  await page.waitForTimeout(ms);
  await page.keyboard.up(kod);
};

await pech('1 старт');
const do1 = (await sost()).tela;
await derzhat('KeyD', 1200);
const posle1 = (await pech('2 первый нажал D')).tela;
console.log(
  `   первый сдвинулся на ${(posle1[0].x - do1[0].x).toFixed(2)}, второй на ${(posle1[1].x - do1[1].x).toFixed(2)}`,
);

await derzhat('ArrowRight', 1600);
const posle2 = (await pech('3 второй нажал стрелку')).tela;
console.log(
  `   первый сдвинулся на ${(posle2[0].x - posle1[0].x).toFixed(2)}, второй на ${(posle2[1].x - posle1[1].x).toFixed(2)}`,
);

await page.keyboard.down('KeyF');
await page.keyboard.down('KeyP');
await page.waitForTimeout(400);
const slito = await pech('4 держим слияние');
await page.screenshot({ path: 'kadry/koop-slito.png' });

const doEzdy = (await sost()).tela;
await derzhat('KeyD', 900);
const posleEzdy = (await pech('5 слитая пара едет')).tela;
console.log(
  `   первый ${(posleEzdy[0].x - doEzdy[0].x).toFixed(2)}, второй ${(posleEzdy[1].x - doEzdy[1].x).toFixed(2)} (должны совпасть)`,
);

await page.keyboard.up('KeyF');
await page.keyboard.up('KeyP');
await page.waitForTimeout(400);
await pech('6 отпустили');

console.log(slito.slito ? 'ИТОГ: слияние работает' : 'ИТОГ: слияние НЕ сработало');
await browser.close();
