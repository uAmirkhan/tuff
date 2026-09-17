// Испытательный уровень словаря элементов: поршень, конвейер, контейнер, маятник.
// Не входит в кампанию, открывается по ?uroven=proba. Для глаз и калибровки.
import type { Uroven } from '../format';

export const UROVEN_PROBA: Uroven = {
  versiya: 1,
  id: 'proba',
  nazvanie: 'Проба элементов',
  mysl: 'Поршень везёт, конвейер тянет, контейнер толкается и тянется, маятник качается',
  start: [2, 1.2],
  granicy: { minX: 0, minY: -3, maxX: 40, maxY: 14 },
  poligony: [
    {
      tochki: [
        [0, -3],
        [40, -3],
        [40, 0],
        [0, 0],
      ],
    },
    {
      tochki: [
        [0, 0],
        [1, 0],
        [1, 14],
        [0, 14],
      ],
    },
    {
      tochki: [
        [39, 0],
        [40, 0],
        [40, 14],
        [39, 14],
      ],
    },
    // потолок над маятником
    {
      tochki: [
        [24, 10],
        [34, 10],
        [34, 11],
        [24, 11],
      ],
    },
  ],
  obekty: [
    { tip: 'gorn', id: 'g0', x: 2, y: 0.2 },
    { tip: 'konveyer', id: 'k1', x: 4, y: 0, w: 6, h: 0.6, skorost: 1.5 },
    { tip: 'yashchik', id: 'ya1', x: 12, y: 0.05, w: 1, h: 1 },
    {
      tip: 'porshen',
      id: 'p1',
      x: 15,
      y: 0.5,
      w: 2,
      h: 0.5,
      hodX: 0,
      hodY: 4,
      period: 6,
      pauza: 1,
    },
    { tip: 'porshen', id: 'p2', x: 19, y: 5, w: 2.5, h: 0.5, hodX: 5, hodY: 0, period: 8 },
    { tip: 'mayatnik', id: 'm1', x: 29, y: 10, w: 1.2, h: 1, dlina: 4 },
    { tip: 'serdce', id: 's1', x: 30, y: 8 },
    { tip: 'serdce', id: 's2', x: 36, y: 1 },
    { tip: 'serdce', id: 's3', x: 20, y: 1 },
    { tip: 'vyhod', id: 'v', x: 37, y: 0.5 },
  ],
};
