// Ярус 1, уровень 1-6 «Промывка яруса» (погоня). План: 13-plany-urovney, раздел 1.
// Мысль: регламент срабатывает вовремя: отсек затапливается для промывки, вода поднимается, тело тяжелеет.
// Шахта стеллажей: полки во всю ширину с дырой у стены (DYRY: R справа, L слева), шаг 1,6. Наверх
// Вязкостью по стене сквозь дыру: Корка (в том числе принудительная от воды) подъём отбирает, в этом
// и погоня. Дыры чередуются, каждую полку приходится проехать целиком: честный зигзаг. Ветка: ниша
// в левой стене на уровне пола за завесой промывки, камень надо брать в первые секунды, вода затопит нишу
// первой (сесть на полку посреди подъёма по стене трудно, поэтому ветка внизу, а не на полке).
// Пандусы и ступени у кромки дыры не сошлись: при шаге 1,6 ступень либо клинит тело о низ полки, либо
// оставляет щель, куда мягкое тело протискивается (три версии, BRIEF). Полки 4 и 7 хрупкие.
import type { Poligon, Uroven } from '../format';

const SHAG = 1.6;
const POLKA = 0.3;
const SHIRINA = 16;
const DYRA = 1.4; // тело у стены занимает 1,0, запас 0,4 до кромки
/** Сторона дыры каждой полки снизу вверх; на ярусе i катят к стене с дырой полки i+1 */
export const DYRY = ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L', 'R'] as const;
const POLOK = DYRY.length;

function stellazhi(): Poligon[] {
  const p: Poligon[] = [];
  for (let i = 1; i <= POLOK; i++) {
    const y = SHAG * i;
    const dyraSprava = DYRY[i - 1] === 'R';
    const hrupkaya = i === 4 || i === 7;
    p.push({
      tochki: dyraSprava
        ? [
            [0, y],
            [SHIRINA - DYRA, y],
            [SHIRINA - DYRA, y + POLKA],
            [0, y + POLKA],
          ]
        : [
            [DYRA, y],
            [SHIRINA, y],
            [SHIRINA, y + POLKA],
            [DYRA, y + POLKA],
          ],
      material: hrupkaya ? 'hrupkiy' : 'metall',
      ...(hrupkaya ? { hrupkost: 0.9 } : {}),
    });
  }
  return p;
}

const VERH = SHAG * POLOK + POLKA; // 14.7, верх последней полки
const NISHA_H = SHAG - POLKA; // 1.3: ниша от пола до низа полки 1

export const UROVEN_K1_6: Uroven = {
  versiya: 1,
  id: 'k1-6',
  nazvanie: 'Промывка яруса',
  mysl: 'Регламент срабатывает вовремя: вода поднимается, тело в воде тяжелеет, вверх по стеллажам',
  start: [2, 1.2],
  granicy: { minX: -5, minY: -3, maxX: 17, maxY: VERH + 4 },
  vremyaZvezdy: 60,
  poligony: [
    // пол, потолок, правая стена
    {
      tochki: [
        [-5, -3],
        [17, -3],
        [17, 0],
        [-5, 0],
      ],
    },
    {
      tochki: [
        [-5, VERH + 2.2],
        [17, VERH + 2.2],
        [17, VERH + 4],
        [-5, VERH + 4],
      ],
    },
    {
      tochki: [
        [SHIRINA, -3],
        [SHIRINA + 1, -3],
        [SHIRINA + 1, VERH + 4],
        [SHIRINA, VERH + 4],
      ],
    },
    // левая стена с проёмом ниши у пола
    {
      tochki: [
        [-1, NISHA_H],
        [0, NISHA_H],
        [0, VERH + 4],
        [-1, VERH + 4],
      ],
    },
    // ниша: потолок и задняя стена (пол общий)
    {
      tochki: [
        [-4, NISHA_H],
        [0, NISHA_H],
        [0, NISHA_H + POLKA],
        [-4, NISHA_H + POLKA],
      ],
    },
    {
      tochki: [
        [-5, 0],
        [-4, 0],
        [-4, NISHA_H + POLKA],
        [-5, NISHA_H + POLKA],
      ],
    },
    ...stellazhi(),
  ],
  obekty: [
    // A. табло промывки и вода снизу: поднимается 0,25 в секунду после 4 секунд (верх 14,7 через ~63 с)
    { tip: 'okno', id: 'tablo', x: 2.5, y: 0.4, w: 1.6, h: 1.2, vid: 'budushchee', nadpis: '6' },
    {
      tip: 'voda',
      id: 'promyvka',
      x: -4,
      y: -1,
      w: SHIRINA + 4,
      h: 0.6,
      skorost: 0.25,
      zaderzhka: 4,
    },
    { tip: 'gorn', id: 'g0', x: 5, y: 0 },
    { tip: 'shema', id: 'sh-vyazkost', x: 13, y: 1.2, vid: 'vyazkost' },
    { tip: 'ispytanie', id: 'stellazhi', x: 7, y: 0.5 },
    // B. стеллажи: угольки и камни по пути, горны на целых полках
    { tip: 'zharkamen', id: 'zk1', x: 8, y: SHAG * 1 + 0.9 },
    { tip: 'zharkamen', id: 'zk2', x: 8, y: SHAG * 2 + 0.9 },
    { tip: 'gorn', id: 'g1', x: 13, y: SHAG * 3 + POLKA },
    { tip: 'gag', id: 'gag-polka', x: 8, y: SHAG * 4 + 0.6 },
    { tip: 'ugolek', id: 'u1', x: 6, y: SHAG * 5 + 0.9 },
    { tip: 'gorn', id: 'g2', x: 8, y: SHAG * 6 + POLKA },
    { tip: 'zharkamen', id: 'zk3', x: 8, y: SHAG * 7 + 0.9 },
    { tip: 'zharkamen', id: 'zk4', x: 8, y: SHAG * 8 + 0.9 },
    // C. ветка: со старта налево в нишу за завесой промывки (вода по расписанию), камень в глубине
    { tip: 'voda', id: 'zavesa', x: -1.4, y: 0, w: 1.4, h: NISHA_H, period: 4 },
    { tip: 'serdce', id: 's-vetka', x: -3, y: 0.6 },
    // D. окно в ствол над стеллажами
    { tip: 'okno', id: 'okno-stvol', x: 5, y: SHAG * 8 + 0.9, w: 3, h: 2.6, vid: 'stvol' },
    { tip: 'panorama', id: 'stvol', x: 3, y: SHAG * 7, w: 7, h: 6 },
    // E. выход: люк на последней полке слева
    { tip: 'vyhod', id: 'vyhod', x: 3, y: VERH + 0.5 },
  ],
};
