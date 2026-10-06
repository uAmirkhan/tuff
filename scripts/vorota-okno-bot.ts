// Ворота по высоте настоящей бот-проверкой. Три исправления против прошлых заходов:
//  1) проход ловится в МОМЕНТ прохода: на льду пара скатывается с плато за границу, игра
//     возвращает её на чекпоинт, и чтение состояния в конце прогона показывает старт;
//  2) стена поднята в окно 2,2-2,6: при 2,0 двое неслитых дотягиваются ступенью (замер koop-1);
//  3) геометрия koop-1: старт ВПЛОТНУЮ к стене, разбег берётся назад — партнёр, который тупо
//     держит «вперёд», не даёт слитой паре отойти и ворота не открывает.
import type { Uroven } from '../src/level/format';
import { type Uchastok, pechat, proveritPassazhira } from './koop-bot';

const STENA = 30;
const POPYTOK = 25;

function komnata(vysota: number): Uroven {
  return {
    versiya: 1,
    id: `okno-${vysota}`,
    nazvanie: `лёд ${vysota}`,
    mysl: 'высота только слитой паре',
    start: [STENA - 2.5, 0.6],
    granicy: { minX: -1, minY: -3, maxX: STENA + 16, maxY: 20 },
    vremyaZvezdy: 90,
    poligony: [
      { tochki: [[-1, -3], [0, -3], [0, 18], [-1, 18]] },
      { tochki: [[-1, -3], [STENA + 16, -3], [STENA + 16, 0], [-1, 0]] },
      {
        tochki: [[STENA, 0], [STENA + 15, 0], [STENA + 15, vysota], [STENA, vysota]],
        material: 'lyod',
      },
      // стенка на дальнем краю плато: без неё пара скатывается по льду за границу уровня
      {
        tochki: [[STENA + 14, vysota], [STENA + 15, vysota], [STENA + 15, 18], [STENA + 14, 18]],
      },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: STENA + 13, y: vysota + 0.5 }],
  };
}

function uchastok(vysota: number): Uchastok {
  return {
    nazvanie: `лёд ${vysota.toFixed(1)}`,
    uroven: komnata(vysota),
    gde: [
      [STENA - 2.5, 0.6],
      [STENA - 3.6, 0.6],
    ],
    proydeno: (a, b) =>
      a.cx > STENA + 0.5 && a.cy > vysota + 0.5 && b.cx > STENA + 0.5 && b.cy > vysota + 0.5,
    taktov: 900,
  };
}

console.log(`=== Ворота по высоте, бот-проверка (${POPYTOK} попыток) ===`);
for (const v of [2.0, 2.2, 2.4, 2.6]) {
  pechat(proveritPassazhira(uchastok(v), POPYTOK), POPYTOK);
}
