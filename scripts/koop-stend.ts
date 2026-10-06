// Стенд: три типа кооп-препятствий из замеров прогоняются бот-проверкой на пассажира.
// Это не уровни кампании, а испытательные комнаты под механику.
import type { Obekt, Poligon, Uroven } from '../src/level/format';
import { UROVEN_KOOP_1 } from '../src/level/urovni/koop-1';
import { pechat, proveritPassazhira, type Uchastok } from './koop-bot';

const POPYTOK = 25;

function komnata(id: string, pol: Poligon[], ob: Obekt[] = [], h = 14): Uroven {
  return {
    versiya: 1,
    id,
    nazvanie: id,
    mysl: 'стенд',
    start: [3, 0.6],
    granicy: { minX: -1, minY: -14, maxX: 41, maxY: h + 4 },
    vremyaZvezdy: 60,
    poligony: [
      {
        tochki: [
          [-1, -14],
          [0, -14],
          [0, h],
          [-1, h],
        ],
      },
      {
        tochki: [
          [40, -14],
          [41, -14],
          [41, h],
          [40, h],
        ],
      },
      ...pol,
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: 38, y: 0.5 }, ...ob],
  };
}

// Обратные ворота (сверка курса 005): дыра в полу, за ней ледяной уступ. Одиночка
// проваливается и не может встать под уступ для живой ступени; слитая пара перекрывает дыру
// собой и достаёт до уступа. Замер строгой развёрткой (scripts/vorota-obratnye2.ts): на уступе
// 2,2 одиночка и двое врозь не берут НИ РАЗУ при шести разбегах, слитые берут 3 из 6.
const KRAY = 20;
const SHIRINA = 1.2;
const VYS = 2.2;
const DAL = KRAY + SHIRINA;
const OBRATNYE: Uroven = {
  versiya: 1,
  id: 'stend-obratnye',
  nazvanie: 'Обратные ворота',
  mysl: 'Только вместе',
  start: [10, 0.6],
  granicy: { minX: -1, minY: -3, maxX: 40, maxY: 20 },
  vremyaZvezdy: 60,
  poligony: [
    {
      tochki: [
        [-1, -3],
        [0, -3],
        [0, 18],
        [-1, 18],
      ],
    },
    {
      tochki: [
        [39, -3],
        [40, -3],
        [40, 18],
        [39, 18],
      ],
    },
    {
      tochki: [
        [-1, -3],
        [KRAY, -3],
        [KRAY, 0],
        [-1, 0],
      ],
    },
    {
      tochki: [
        [KRAY, -3],
        [DAL, -3],
        [DAL, -1],
        [KRAY, -1],
      ],
    },
    {
      tochki: [
        [DAL, -3],
        [39, -3],
        [39, VYS],
        [DAL, VYS],
      ],
      material: 'lyod',
    },
  ],
  obekty: [{ tip: 'vyhod', id: 'v', x: 36, y: VYS + 0.5 }],
};

const uchastki: Uchastok[] = [
  {
    nazvanie: `обратные ворота: дыра ${SHIRINA}, ледяной уступ ${VYS} (задумано: только слитым)`,
    uroven: OBRATNYE,
    gde: [
      [10, 0.6],
      [10.9, 0.6],
    ],
    // пройдено: ОБА наверху за дырой. Одно тело наверху — это застрявшая пара, а не проход
    proydeno: (a, b) => a.cx > DAL && a.cy > VYS + 0.45 && b.cx > DAL && b.cy > VYS + 0.45,
    taktov: 1600,
  },
  {
    nazvanie: 'koop-1: ледяные ворота 2,0 (задумано: только слиянием)',
    uroven: UROVEN_KOOP_1,
    gde: [
      [UROVEN_KOOP_1.start[0], UROVEN_KOOP_1.start[1]],
      [UROVEN_KOOP_1.start[0] + 1.2, UROVEN_KOOP_1.start[1]],
    ],
    // пройдено: ОБА наверху за стеной
    proydeno: (a, b) => a.cx > 31 && a.cy > 2.2 && b.cx > 31 && b.cy > 2.2,
    taktov: 1600,
  },
  {
    nazvanie: 'хрупкий пол 1,5 (задумано: только слиянием)',
    uroven: komnata('stend-hrupkiy', [
      {
        tochki: [
          [0, -14],
          [8, -14],
          [8, 6],
          [0, 6],
        ],
      },
      {
        tochki: [
          [8, 5.6],
          [16, 5.6],
          [16, 6],
          [8, 6],
        ],
        material: 'hrupkiy',
        hrupkost: 1.5,
      },
      {
        tochki: [
          [16, -14],
          [40, -14],
          [40, 6],
          [16, 6],
        ],
      },
      // потолок: наверх не убежать
      {
        tochki: [
          [0, 11],
          [40, 11],
          [40, 14],
          [0, 14],
        ],
      },
    ]),
    gde: [
      [10.7, 7.2],
      [11.6, 7.2],
    ],
    // пройдено: оба провалились ниже хрупкого пола
    proydeno: (a, b) => a.cy < 4.5 && b.cy < 4.5,
    taktov: 900,
  },
  {
    nazvanie: 'щель 0,6 (задумано: по одному и только Расплавом)',
    uroven: komnata('stend-shchel', [
      {
        tochki: [
          [-1, -14],
          [41, -14],
          [41, 0],
          [-1, 0],
        ],
      },
      {
        tochki: [
          [16, 0.6],
          [19, 0.6],
          [19, 14],
          [16, 14],
        ],
      },
    ]),
    gde: [
      [12, 0.6],
      [13.2, 0.6],
    ],
    proydeno: (a, b) => a.cx > 20 && b.cx > 20,
    taktov: 1400,
  },
  {
    nazvanie: 'ворота на двух плитах, шаг 6 (задумано: нужны оба)',
    uroven: komnata(
      'stend-plity',
      [
        {
          tochki: [
            [-1, -14],
            [41, -14],
            [41, 0],
            [-1, 0],
          ],
        },
        {
          tochki: [
            [0, 4],
            [40, 4],
            [40, 14],
            [0, 14],
          ],
        },
      ],
      [
        { tip: 'plita', id: 'p1', x: 12, y: 0, cel: 'd', fiksiruetsya: false },
        { tip: 'plita', id: 'p2', x: 18, y: 0, cel: 'd', fiksiruetsya: false },
        { tip: 'zaslonka', id: 'd', x: 24, y: 0, w: 0.4, h: 4 },
      ],
    ),
    gde: [
      [6, 0.6],
      [7.2, 0.6],
    ],
    proydeno: (a, b) => a.cx > 26 && b.cx > 26,
    taktov: 1400,
  },
];

console.log(`=== Бот-проверка на пассажира, ${POPYTOK} попыток на повадку ===`);
for (const u of uchastki) pechat(proveritPassazhira(u, POPYTOK), POPYTOK);
