// Ворота по длине: слитая пара — одно длинное тело, оно перелетает проём и передняя половина
// цепляется за дальний край, вытягивая вторую (след замера: на такте 80 одно тело уже на
// дальнем полу, второе ещё в проёме на -0,18).
//
// Прежний стенд пропасти держал Выброс зажатым весь прогон, и её перелетали все, включая
// одиночку на ширине 8 — это не смерть класса, это неинформативный стенд.
//
// Защита от пассажира та же, что у ворот высоты: старт вплотную к проёму, разбег берётся
// НАЗАД. Партнёр, тупо держащий «вперёд», не даёт паре отойти.
import { describe, expect, it } from 'vitest';
import { PUSTOE } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { PASSAZHIRY, type Povadka, type Uchastok, progon } from '../scripts/koop-bot';

const PROYOM = 30;
const SHIRINA = 8;
const DAL = PROYOM + SHIRINA;

const komnata: Uroven = {
  versiya: 1,
  id: 'vorota-dliny',
  nazvanie: 'Проём',
  mysl: 'Одно длинное тело',
  start: [PROYOM - 2.5, 0.6],
  granicy: { minX: -1, minY: -12, maxX: 56, maxY: 16 },
  vremyaZvezdy: 60,
  poligony: [
    { tochki: [[-1, -12], [0, -12], [0, 14], [-1, 14]] },
    { tochki: [[55, -12], [56, -12], [56, 14], [55, 14]] },
    { tochki: [[-1, -1], [PROYOM, -1], [PROYOM, 0], [-1, 0]] },
    { tochki: [[DAL, -1], [55, -1], [55, 0], [DAL, 0]] },
    // дно глубоко внизу: провалился — своим ходом уже не вылез
    { tochki: [[-1, -12], [56, -12], [56, -11], [-1, -11]] },
  ],
  obekty: [{ tip: 'vyhod', id: 'v', x: 52, y: 0.5 }],
};

const uchastok: Uchastok = {
  nazvanie: 'проём 8',
  uroven: komnata,
  gde: [
    [PROYOM - 2.5, 0.6],
    [PROYOM - 3.6, 0.6],
  ],
  proydeno: (a, b) => a.cx > DAL + 1 && a.cy > -1 && b.cx > DAL + 1 && b.cy > -1,
  taktov: 900,
};

const plan = (sdvig: number, slit: boolean): Povadka => (t) => {
  if (t < 60) return { nam: { ...PUSTOE }, slit };
  if (t < 300 + sdvig) return { nam: { ...PUSTOE, dx: -1 }, slit };
  return { nam: { ...PUSTOE, dx: 1 }, slit };
};

// НЕ семена: семя кормит sluchay, а сценарий вручную его не читает, поэтому пять семян давали
// один и тот же прогон пять раз (найдено на витке 012). Меняем длину отхода.
const FAZY = [-80, -40, 0, 40, 80, 120, 160];

describe('ворота по длине', () => {
  it('слитая пара перелетает проём 8 на всех фазах отхода', () => {
    for (const f of FAZY)
      expect(progon(uchastok, plan(f, true), plan(f, true), 1), `фаза ${f}`).toBe(true);
  });

  it('тот же план без слияния не проходит ни на одной фазе', () => {
    for (const f of FAZY)
      expect(progon(uchastok, plan(f, false), plan(f, false), 1), `фаза ${f}`).toBe(false);
  });

  it('ни одна повадка пассажира ворота не открывает ни на одной фазе', () => {
    for (const [imya, p] of Object.entries(PASSAZHIRY))
      for (const f of FAZY)
        expect(progon(uchastok, plan(f, true), p, 2), `${imya}, фаза ${f}`).toBe(false);
    }, 60_000);
});
