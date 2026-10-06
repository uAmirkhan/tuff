// Клип-крючок в двух частях: сначала врозь не выходит, потом слитая пара проходит.
// Часть А снимается целиком, в части Б разбег назад проживается, но не снимается —
// иначе три секунды из девяти уходят на блуждание влево.
import { chromium } from 'file:///C:/Ai/Jarvis/mars-colony/node_modules/playwright/index.mjs';

const chast = process.argv[2] === 'B' ? 'B' : 'A';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[error]', e.message));
await page.goto('http://127.0.0.1:5180/?uroven=vorota-vysoty&koop=1');
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

const VLEVO = ['KeyA', 'ArrowLeft'];
const VPRAVO = ['KeyD', 'ArrowRight'];
const SLIT = ['KeyF', 'KeyP'];
const VYBROS = ['KeyW', 'ArrowUp', 'Space', 'ShiftRight'];

let n = 0;
let bylProhod = false;
let kadrProhoda = -1;
const papka = chast === 'A' ? 'kadry/klipA' : 'kadry/klipB';
const kadr = async () =>
  page.screenshot({ path: `${papka}/${String(n++).padStart(3, '0')}.png` });
// прожить такты без съёмки
const prozhit = async (kadrov, kl) => {
  await derzhat(kl);
  for (let i = 0; i < kadrov; i++) await page.waitForTimeout(100);
};
const snyat = async (kadrov, kl) => {
  await derzhat(kl);
  for (let i = 0; i < kadrov; i++) {
    await kadr();
    if (n % 5 === 0) {
      const s = await sost();
      // проход ловим В МОМЕНТ прохода: пара может скатиться с плато и попасть на чекпоинт
      if (!bylProhod && s.tela.every(([x, y]) => x > 30 && y > 2.6)) {
        bylProhod = true;
        kadrProhoda = n;
      }
      if (n % 10 === 0)
        console.log(`  к${String(n).padStart(3)} слито ${s.slito} ${JSON.stringify(s.tela)}`);
    }
  }
};

if (chast === 'A') {
  // врозь: отойти за тем же разбегом, разогнаться, выброс у стены — и не взять
  await prozhit(40, VLEVO);
  await snyat(13, VPRAVO);
  await snyat(22, [...VPRAVO, ...VYBROS]);
  // отпустить: иначе непрерывное «вправо» прижимает тела к дальней стене и они висят на ней
  await snyat(14, []);
} else {
  // слиться на виду, разбег назад прожить, разогнаться и взять стену
  await snyat(10, SLIT);
  await prozhit(40, [...SLIT, ...VLEVO]);
  await snyat(13, [...SLIT, ...VPRAVO]);
  await snyat(26, [...SLIT, ...VPRAVO, ...VYBROS]);
  // отпустить движение, слияние держим: иначе пара висит на дальней стене
  await snyat(16, SLIT);
}
await derzhat([]);
const itog = await sost();
const proshli = bylProhod || itog.tela.every(([x, y]) => x > 30 && y > 2.6);
console.log(
  `часть ${chast}: ${JSON.stringify(itog)} — ${proshli ? `ВОРОТА ПРОЙДЕНЫ (кадр ${kadrProhoda})` : 'ворота не пройдены'}`,
);
await browser.close();
