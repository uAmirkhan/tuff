// Ворота против ИЩУЩЕГО бота. Все прошлые вердикты опирались на сценарии, написанные мной,
// поэтому проверяли ровно то, что я предполагала. Здесь бот ищет проход сам восхождением,
// и проверяются два утверждения, которые я закоммитила:
//   1) «тот же план без слияния не проходит» — а найдёт ли проход БЕЗ слияния ищущий бот;
//   2) «противоход обезвреживает пассажира» — а найдёт ли проход герой, когда напарник заперт
//      в повадке пассажира.
import { PASSAZHIRY, type Povadka, type Uchastok } from './koop-bot';
import { iskatProhod, type Ocenka } from './koop-poisk';
import type { Uroven } from '../src/level/format';

const POPYTOK = 250;

// --- ворота высоты
const STENA = 30;
const VYS = 2.4;
const komnataV: Uroven = {
  versiya: 1, id: 'v', nazvanie: 'v', mysl: 'v', start: [STENA - 2.5, 0.6],
  granicy: { minX: -1, minY: -3, maxX: STENA + 16, maxY: 20 }, vremyaZvezdy: 90,
  poligony: [
    { tochki: [[-1, -3], [0, -3], [0, 18], [-1, 18]] },
    { tochki: [[-1, -3], [STENA + 16, -3], [STENA + 16, 0], [-1, 0]] },
    { tochki: [[STENA, 0], [STENA + 15, 0], [STENA + 15, VYS], [STENA, VYS]], material: 'lyod' },
    { tochki: [[STENA + 14, VYS], [STENA + 15, VYS], [STENA + 15, 18], [STENA + 14, 18]] },
  ],
  obekty: [{ tip: 'vyhod', id: 'v', x: STENA + 13, y: VYS + 0.5 }],
};
const vysoty: Uchastok = {
  nazvanie: 'высота 2,4', uroven: komnataV,
  gde: [[STENA - 2.5, 0.6], [STENA - 3.6, 0.6]],
  proydeno: (a, b) => a.cx > STENA + 0.5 && a.cy > VYS + 0.5 && b.cx > STENA + 0.5 && b.cy > VYS + 0.5,
  taktov: 900,
};
// ближе к проходу = отстающее тело выше и правее
const ocenkaV: Ocenka = (a, b) => Math.min(a.cy, b.cy) * 5 + Math.min(a.cx, b.cx) * 0.5;

// --- ворота длины
const PROYOM = 30, SHIR = 8, DAL = PROYOM + SHIR, PRAVO = 55;
const komnataD: Uroven = {
  versiya: 1, id: 'd', nazvanie: 'd', mysl: 'd', start: [PROYOM - 2.5, 0.6],
  granicy: { minX: -1, minY: -12, maxX: PRAVO + 1, maxY: 16 }, vremyaZvezdy: 90,
  poligony: [
    { tochki: [[-1, -12], [0, -12], [0, 14], [-1, 14]] },
    { tochki: [[PRAVO, -12], [PRAVO + 1, -12], [PRAVO + 1, 14], [PRAVO, 14]] },
    { tochki: [[-1, -1], [PROYOM, -1], [PROYOM, 0], [-1, 0]] },
    { tochki: [[DAL, -1], [PRAVO, -1], [PRAVO, 0], [DAL, 0]] },
    { tochki: [[-1, -12], [PRAVO + 1, -12], [PRAVO + 1, -11], [-1, -11]] },
  ],
  obekty: [{ tip: 'vyhod', id: 'v', x: PRAVO - 3, y: 0.5 }],
};
const dliny: Uchastok = {
  nazvanie: 'длина 8', uroven: komnataD,
  gde: [[PROYOM - 2.5, 0.6], [PROYOM - 3.6, 0.6]],
  proydeno: (a, b) => a.cx > DAL + 0.3 && a.cy > -1 && b.cx > DAL + 0.3 && b.cy > -1,
  taktov: 900,
};
// ближе к проходу = отстающее тело правее и не в яме
const ocenkaD: Ocenka = (a, b) => Math.min(a.cx, b.cx) + Math.min(a.cy, b.cy) * 2;

function razbor(u: Uchastok, ocenka: Ocenka) {
  console.log(`\n--- ${u.nazvanie} ---`);
  const sam = iskatProhod(u, ocenka, { popytok: POPYTOK, semya: 1 });
  console.log(
    `  оба ищут, слияние разрешено: ${sam.proshli ? 'НАШЁЛ проход' : `не нашёл (лучшее ${sam.luchshaya.toFixed(2)})`}`,
  );
  const bez = iskatProhod(u, ocenka, { popytok: POPYTOK, semya: 7, bezSliyaniya: true });
  console.log(
    `  оба ищут, слияние ЗАПРЕЩЕНО: ${bez.proshli ? 'НАШЁЛ проход — контроль без слияния неверен' : `не нашёл (лучшее ${bez.luchshaya.toFixed(2)})`}`,
  );
  for (const [imya, p] of Object.entries(PASSAZHIRY)) {
    const n = iskatProhod(u, ocenka, { popytok: POPYTOK, semya: 3, vtoroy: p as Povadka });
    console.log(
      `  напарник «${imya}»: ${n.proshli ? 'НАШЁЛ проход — ворота больны' : `не нашёл (лучшее ${n.luchshaya.toFixed(2)})`}`,
    );
  }
}

razbor(vysoty, ocenkaV);
razbor(dliny, ocenkaD);
