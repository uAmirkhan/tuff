// Ворота по высоте: сценарий вручную. Случайные боты такую координацию не находят
// (vorota-okno-bot.ts: «вердикта нет»), поэтому активный игрок идёт по плану, а партнёр —
// по каждой повадке пассажира из koop-bot. Ворота чистые, если проходят ТОЛЬКО с напарником,
// который тоже отходит назад за разбегом, и не проходят ни с одним пассажиром.
import type { Uroven } from '../src/level/format';
import { PASSAZHIRY, type Povadka, type Uchastok, progon } from './koop-bot';
import { PUSTOE } from '../src/game/telo';

const STENA = 30;

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

// План: слиться, отойти влево за разбегом, разогнаться вправо, у стены выброс.
const plan: Povadka = (t) => {
  if (t < 60) return { nam: { ...PUSTOE }, slit: true };
  if (t < 300) return { nam: { ...PUSTOE, dx: -1 }, slit: true };
  if (t < 380) return { nam: { ...PUSTOE, dx: 1 }, slit: true };
  return { nam: { ...PUSTOE, dx: 1, dy: 1, vybros: true }, slit: true };
};

// Контроль: тот же план, но без слияния. Если проходит и так, ворота держит не слияние,
// а сам разбег, и результат ничего не доказывает.
const planBezSliyaniya: Povadka = (t) => ({ nam: plan(t, () => 0).nam, slit: false });

// Контроль посильнее: неслитая пара СТУПЕНЬЮ. Именно так она брала уступ 1,8-2,2 в замерах
// 25.09 — нижний стоит у стены, верхний забирается по нему и выбрасывается.
const stupenNizhniy: Povadka = (t) =>
  t < 120 ? { nam: { ...PUSTOE, dx: 1 }, slit: false } : { nam: { ...PUSTOE }, slit: false };
const stupenVerhniy: Povadka = (t) =>
  t < 120
    ? { nam: { ...PUSTOE, dx: 1 }, slit: false }
    : { nam: { ...PUSTOE, dx: 1, dy: 1, vybros: true }, slit: false };

console.log('=== Ворота по высоте, сценарий вручную ===');
for (const v of [2.0, 2.2, 2.4, 2.6, 2.8]) {
  const u = uchastok(v);
  const SEMENA = [1, 5, 11, 23, 37];
  const vmeste = SEMENA.every((z) => progon(u, plan, plan, z));
  const bezSliyaniya =
    SEMENA.some((z) => progon(u, planBezSliyaniya, planBezSliyaniya, z)) ||
    SEMENA.some((z) => progon(u, stupenVerhniy, stupenNizhniy, z)) ||
    SEMENA.some((z) => progon(u, stupenNizhniy, stupenVerhniy, z));
  const bolnye: string[] = [];
  for (const [imya, p] of Object.entries(PASSAZHIRY)) {
    if (progon(u, plan, p, 2)) bolnye.push(imya);
  }
  const verdikt = !vmeste
    ? 'план не проходит на всех семенах — ворота слишком высоки'
    : bezSliyaniya
      ? 'ПУСТЫШКА: тот же план проходит и БЕЗ слияния, держит разбег, а не слияние'
      : bolnye.length === 0
        ? 'ЧИСТЫЕ: только слитая пара, и только если напарник тоже отходит за разбегом'
        : `болезнь: ${bolnye.join(', ')}`;
  console.log(
    `  лёд ${v.toFixed(1)}: по плану ${vmeste ? 'да' : 'нет'}, без слияния ${bezSliyaniya ? 'ДА' : 'нет'} — ${verdikt}`,
  );
}
