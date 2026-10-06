// Ворота по высоте: НЕ ворота слияния. Витки 010-011 записали их чистыми, виток 013 это отменил.
//
// Ищущий бот (scripts/koop-poisk.ts) находит проход НЕслитой парой и находит его при четырёх
// повадках пассажира из шести. Прежние вердикты опирались на сценарии, написанные мной, и
// проверяли ровно то, что я предполагала: «мой план без слияния не проходит» — не то же самое,
// что «без слияния пройти нельзя».
//
// Тест держит оба факта литералами найденных планов: поиск занимает минуты, а литерал проверяется
// мгновенно и точно. Если физика изменится и планы перестанут проходить — тест упадёт и
// потребует заново прогнать поиск, а не тихо вернёт воротам звание чистых.
import { describe, expect, it } from 'vitest';
import { PUSTOE } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { PASSAZHIRY, type Povadka, type Uchastok, progon } from '../scripts/koop-bot';
import { type Plan, povadkaIzPlana } from '../scripts/koop-poisk';

const STENA = 30;
const VYSOTA = 2.4;

const komnata: Uroven = {
  versiya: 1,
  id: 'vorota-vysoty',
  nazvanie: 'Ворота высоты',
  mysl: 'Врозь высоко не прыгнешь',
  start: [STENA - 2.5, 0.6],
  granicy: { minX: -1, minY: -3, maxX: STENA + 16, maxY: 20 },
  vremyaZvezdy: 90,
  poligony: [
    { tochki: [[-1, -3], [0, -3], [0, 18], [-1, 18]] },
    { tochki: [[-1, -3], [STENA + 16, -3], [STENA + 16, 0], [-1, 0]] },
    {
      tochki: [[STENA, 0], [STENA + 15, 0], [STENA + 15, VYSOTA], [STENA, VYSOTA]],
      material: 'lyod',
    },
    {
      tochki: [[STENA + 14, VYSOTA], [STENA + 15, VYSOTA], [STENA + 15, 18], [STENA + 14, 18]],
    },
  ],
  obekty: [{ tip: 'vyhod', id: 'v', x: STENA + 13, y: VYSOTA + 0.5 }],
};

const uchastok: Uchastok = {
  nazvanie: 'ворота высоты',
  uroven: komnata,
  gde: [
    [STENA - 2.5, 0.6],
    [STENA - 3.6, 0.6],
  ],
  proydeno: (a, b) =>
    a.cx > STENA + 0.5 && a.cy > VYSOTA + 0.5 && b.cx > STENA + 0.5 && b.cy > VYSOTA + 0.5,
  taktov: 900,
};

// Найдено ищущим ботом: НЕслитая пара берёт стену 2,4. Слияние здесь не нужно.
const BEZ_SLIYANIYA_A: Plan = [
  { taktov: 270, slit: false, nam: { ...PUSTOE, dy: 1, vybros: true } },
  { taktov: 108, slit: false, nam: { ...PUSTOE, dx: 1, vybros: true } },
  { taktov: 106, slit: false, nam: { ...PUSTOE, dx: -1, dy: 1, vybros: true, vyazkost: true } },
  { taktov: 160, slit: false, nam: { ...PUSTOE, dx: 1, dy: 1, vyazkost: true } },
  { taktov: 94, slit: false, nam: { ...PUSTOE, vybros: true } },
  { taktov: 171, slit: false, nam: { ...PUSTOE, dy: 1 } },
];
const BEZ_SLIYANIYA_B: Plan = [
  { taktov: 275, slit: false, nam: { ...PUSTOE, vybros: true } },
  { taktov: 19, slit: false, nam: { ...PUSTOE, dx: 1, dy: 1, vybros: true, vyazkost: true } },
  { taktov: 225, slit: false, nam: { ...PUSTOE, dy: 1 } },
  { taktov: 124, slit: false, nam: { ...PUSTOE, dx: 1, dy: 1, vybros: true } },
  { taktov: 241, slit: false, nam: { ...PUSTOE, korka: true } },
  { taktov: 176, slit: false, nam: { ...PUSTOE, dx: -1 } },
];

describe('ворота по высоте — не ворота слияния', () => {
  it('неслитая пара берёт стену 2,4: слияние здесь не требуется', () => {
    expect(
      progon(uchastok, povadkaIzPlana(BEZ_SLIYANIYA_A), povadkaIzPlana(BEZ_SLIYANIYA_B), 1),
    ).toBe(true);
  });

  it('спящий напарник ворота не открывает — единственное, что тут ещё держится', () => {
    // герой по найденному плану, напарник спит: без второго тела наверх не выйти
    expect(progon(uchastok, povadkaIzPlana(BEZ_SLIYANIYA_A), PASSAZHIRY['спит'] as Povadka, 3)).toBe(
      false,
    );
  });
});
