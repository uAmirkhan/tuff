// Ворота по высоте: три витка они считались мёртвым классом. Оказалось, мертвы были стенды.
// Этот тест держит найденное окно, чтобы вывод не потерялся снова:
//  - слитая пара берёт ледяную стену 2,4, если оба отходят назад за разбегом;
//  - тот же план БЕЗ слияния не проходит;
//  - ни одна повадка пассажира ворота не открывает.
import { describe, expect, it } from 'vitest';
import { PUSTOE } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { PASSAZHIRY, type Povadka, type Uchastok, progon } from '../scripts/koop-bot';

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
    // без стенки на дальнем краю пара скатывается по льду за границу уровня
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
  // строго: центр выше верха стены на радиус и тело уже над плато
  proydeno: (a, b) =>
    a.cx > STENA + 0.5 && a.cy > VYSOTA + 0.5 && b.cx > STENA + 0.5 && b.cy > VYSOTA + 0.5,
  taktov: 900,
};

// Слиться, отойти влево за разбегом, разогнаться вправо, у стены выброс.
const plan: Povadka = (t) => {
  if (t < 60) return { nam: { ...PUSTOE }, slit: true };
  if (t < 300) return { nam: { ...PUSTOE, dx: -1 }, slit: true };
  if (t < 380) return { nam: { ...PUSTOE, dx: 1 }, slit: true };
  return { nam: { ...PUSTOE, dx: 1, dy: 1, vybros: true }, slit: true };
};
const planBezSliyaniya: Povadka = (t) => ({ nam: plan(t, () => 0).nam, slit: false });
// Ступень: так неслитая пара брала уступ 1,8-2,2 в замерах 25.09.
const stupenNizhniy: Povadka = (t) =>
  t < 120 ? { nam: { ...PUSTOE, dx: 1 }, slit: false } : { nam: { ...PUSTOE }, slit: false };
const stupenVerhniy: Povadka = (t) =>
  t < 120
    ? { nam: { ...PUSTOE, dx: 1 }, slit: false }
    : { nam: { ...PUSTOE, dx: 1, dy: 1, vybros: true }, slit: false };

const SEMENA = [1, 5, 11, 23, 37];

describe('ворота по высоте', () => {
  it('слитая пара берёт стену 2,4 на всех семенах', () => {
    for (const z of SEMENA) expect(progon(uchastok, plan, plan, z), `семя ${z}`).toBe(true);
  });

  it('тот же план без слияния не проходит', () => {
    for (const z of SEMENA)
      expect(progon(uchastok, planBezSliyaniya, planBezSliyaniya, z), `семя ${z}`).toBe(false);
  });

  it('неслитая пара не проходит и ступенью', () => {
    for (const z of SEMENA) {
      expect(progon(uchastok, stupenVerhniy, stupenNizhniy, z), `семя ${z}`).toBe(false);
      expect(progon(uchastok, stupenNizhniy, stupenVerhniy, z), `семя ${z}`).toBe(false);
    }
  });

  it('ни одна повадка пассажира ворота не открывает', () => {
    for (const [imya, p] of Object.entries(PASSAZHIRY))
      expect(progon(uchastok, plan, p, 2), imya).toBe(false);
  });
});
