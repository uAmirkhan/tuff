// Снимки признаков состояния в кооперативе: тёплые и различимые, остывшие врозь, греющиеся слитыми.
import { chromium } from '../../mars-colony/node_modules/playwright/index.mjs';

// --no-proxy-server: на машине Khan'а работает системный прокси, и без этого браузер
// уводит даже localhost, отдавая ERR_CONNECTION_REFUSED на живой дев-сервер
const browser = await chromium.launch({
  args: ['--no-proxy-server', '--host-resolver-rules=MAP localhost 127.0.0.1'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[error]', e.message));
const PORT = process.argv[2] ?? 5180;
await page.goto(`http://127.0.0.1:${PORT}/?uroven=k1-1&koop=1&chisto=1`);
await page.waitForTimeout(2200);

const sost = () =>
  page.evaluate(() => ({
    zhar: window.tuff.tela ? window.tuff.tela.map((t) => t.x.toFixed(1)) : [],
    d: window.tuff.rasstoyanie?.toFixed(1),
    slito: window.tuff.slito,
  }));
const derzhat = async (kod, ms) => {
  await page.keyboard.down(kod);
  await page.waitForTimeout(ms);
  await page.keyboard.up(kod);
};

await page.screenshot({ path: 'kadry/priznak-1-tyoplye.png' });
console.log('1 тёплые и рядом:', JSON.stringify(await sost()));

// развести и подождать, пока остынут
await derzhat('ArrowRight', 3500);
await page.waitForTimeout(9000);
await page.screenshot({ path: 'kadry/priznak-2-holod.png' });
console.log('2 остыли врозь:', JSON.stringify(await sost()));

// свести обратно и слиться
await derzhat('ArrowLeft', 3600);
await page.waitForTimeout(500);
await page.keyboard.down('KeyF');
await page.keyboard.down('KeyP');
await page.waitForTimeout(1500);
await page.screenshot({ path: 'kadry/priznak-3-obogrev.png' });
console.log('3 слиты и греются:', JSON.stringify(await sost()));
await page.keyboard.up('KeyF');
await page.keyboard.up('KeyP');

await browser.close();
