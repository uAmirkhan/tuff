// Жерло: Первая труба. Вертикальная шахта без чекпоинтов. Падение сбрасывает вниз ровно на столько,
// на сколько упал. Выход наверху. Таймер и призрак лучшей попытки.
import type { Uroven } from '../format';

// Змейка выступов: каждый следующий выше и на другой стороне
const vystupy = (): Uroven['poligony'] => {
  const p: Uroven['poligony'] = [];
  const shirina = 4.5;
  for (let i = 0; i < 14; i++) {
    const y = 3 + i * 2.6;
    const sleva = i % 2 === 0;
    const x1 = sleva ? 1 : 15 - shirina;
    const x2 = sleva ? 1 + shirina : 15;
    // выступ тоньше к верху: труднее зацепиться
    const tolshchina = i < 6 ? 0.6 : 0.4;
    p.push({
      tochki: [
        [x1, y - tolshchina],
        [x2, y - tolshchina],
        [x2, y],
        [x1, y],
      ],
    });
  }
  return p;
};

export const UROVEN_ZH_1: Uroven = {
  versiya: 1,
  id: 'zh-1',
  nazvanie: 'Жерло: Первая труба',
  mysl: 'Подъём без чекпоинтов: выступы змейкой, стены под Вязкость, любое падение честно возвращает вниз',
  start: [8, 1.2],
  granicy: { minX: 0, minY: -3, maxX: 16, maxY: 46 },
  rezhim: 'zherlo',
  zvyozdDlyaOtkrytiya: 12,
  vremyaZvezdy: 90,
  poligony: [
    {
      tochki: [
        [0, -3],
        [1, -3],
        [1, 46],
        [0, 46],
      ],
    }, // левая стена
    {
      tochki: [
        [15, -3],
        [16, -3],
        [16, 46],
        [15, 46],
      ],
    }, // правая стена
    {
      tochki: [
        [0, 44],
        [16, 44],
        [16, 46],
        [0, 46],
      ],
    }, // потолок
    {
      tochki: [
        [0, -3],
        [16, -3],
        [16, 0],
        [0, 0],
      ],
    }, // дно
    ...vystupy(),
    // ледяная плита посередине на высоте 20: Вязкость не держит, только прыжок
    {
      tochki: [
        [6, 19.4],
        [10, 19.4],
        [10, 20],
        [6, 20],
      ],
      material: 'lyod',
    },
    // финальная площадка
    {
      tochki: [
        [5, 40],
        [11, 40],
        [11, 40.6],
        [5, 40.6],
      ],
    },
  ],
  obekty: [
    { tip: 'zharkamen', x: 8, y: 10 },
    { tip: 'zharkamen', x: 8, y: 20.7 },
    { tip: 'zharkamen', x: 8, y: 30 },
    { tip: 'vyhod', id: 'v', x: 8, y: 41.4 },
  ],
};
