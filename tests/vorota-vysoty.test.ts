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
const plan = (sdvig: number, slit: boolean): Povadka => (t) => {
  if (t < 60) return { nam: { ...PUSTOE }, slit };
  if (t < 300 + sdvig) return { nam: { ...PUSTOE, dx: -1 }, slit };
  if (t < 380 + sdvig) return { nam: { ...PUSTOE, dx: 1 }, slit };
  return { nam: { ...PUSTOE, dx: 1, dy: 1, vybros: true }, slit };
};
// Ступень: так неслитая пара брала уступ 1,8-2,2 в замерах 25.09.
const stupenNizhniy: Povadka = (t) =>
  t < 120 ? { nam: { ...PUSTOE, dx: 1 }, slit: false } : { nam: { ...PUSTOE }, slit: false };
const stupenVerhniy: Povadka = (t) =>
  t < 120
    ? { nam: { ...PUSTOE, dx: 1 }, slit: false }
    : { nam: { ...PUSTOE, dx: 1, dy: 1, vybros: true }, slit: false };

// НЕ семена: семя кормит sluchay, а сценарий вручную его не читает, поэтому пять семян давали
// один и тот же прогон пять раз (найдено на витке 012). Меняем длину отхода — она реально
// сдвигает всю картину.
const FAZY = [-80, -40, 0, 40, 80, 120, 160];

describe('ворота по высоте', () => {
  it('слитая пара берёт стену 2,4 почти на всех фазах отхода', () => {
    const vzyali = FAZY.filter((f) => progon(uchastok, plan(f, true), plan(f, true), 1));
    expect(vzyali.length, `взяли на фазах ${vzyali.join(', ')}`).toBeGreaterThanOrEqual(6);
  });

  it('тот же план без слияния не проходит ни на одной фазе', () => {
    for (const f of FAZY)
      expect(progon(uchastok, plan(f, false), plan(f, false), 1), `фаза ${f}`).toBe(false);
  });

  it('неслитая пара не проходит и ступенью', () => {
    expect(progon(uchastok, stupenVerhniy, stupenNizhniy, 1)).toBe(false);
    expect(progon(uchastok, stupenNizhniy, stupenVerhniy, 1)).toBe(false);
  });

  // ЭТИ ВОРОТА БОЛЬНЫ, и тест держит болезнь на виду, а не прячет её.
  // Партнёр, который стоит и только держит слияние, открывает их: слитую пару тянет герой,
  // и согласия достаточно. Противоход (разбег назад) бьёт по «жмёт вперёд», но не по стоящему.
  // Развилка «считать ли такого партнёра пассажиром» — за Khan'ом, пункт 9 inbox.
  it('пассажир, который ЖМЁТ ВПЕРЁД, ворота не открывает: это работа противохода', () => {
    for (const imya of ['жмёт вперёд', 'жмёт вперёд и слияние', 'спит'] as const)
      for (const f of FAZY)
        expect(
          progon(uchastok, plan(f, true), PASSAZHIRY[imya] as Povadka, 2),
          `${imya}, фаза ${f}`,
        ).toBe(false);
    }, 60_000);

  it('но партнёр, который СТОИТ и держит слияние, их открывает', () => {
    const otkryl = FAZY.filter((f) =>
      progon(uchastok, plan(f, true), PASSAZHIRY['держит слияние'] as Povadka, 2),
    );
    expect(otkryl.length, 'если стало 0, болезнь вылечена — перепиши тест и отчёт').toBeGreaterThan(
      0,
    );
  });
});
