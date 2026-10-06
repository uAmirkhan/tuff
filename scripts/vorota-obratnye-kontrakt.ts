// Обратные ворота через тот же контракт, который выдержали ворота по высоте (виток 010).
// Стенд vorota-obratnye2 нашёл окно (дыра 1-1,4, уступ 2,2: одиночка 0/6, двое врозь 0/6,
// слитые 3/6), но 3 из 6 — это не «устойчиво», и неслитый бот там свой, не адверсарный.
// Контракт: сценарий вручную, пять семян, контроль БЕЗ слияния, контроль ступенью и все шесть
// повадок пассажира из koop-bot.
import { PUSTOE } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { PASSAZHIRY, type Povadka, type Uchastok, progon } from './koop-bot';

// Дыра стоит там же, где стена в воротах высоты (x=30), а старт вплотную к ней: повадка в этом
// стенде не видит положения тел и жмёт выброс по ТАКТУ, поэтому дистанции должны совпадать.
const KRAY = 30;

function komnata(shirina: number, vys: number): Uroven {
  const dal = KRAY + shirina;
  return {
    versiya: 1,
    id: `obratnye-${shirina}-${vys}`,
    nazvanie: 'Обратные ворота',
    mysl: 'Только вместе',
    start: [KRAY - 2.5, 0.6],
    granicy: { minX: -1, minY: -3, maxX: 50, maxY: 20 },
    vremyaZvezdy: 60,
    poligony: [
      { tochki: [[-1, -3], [0, -3], [0, 18], [-1, 18]] },
      { tochki: [[49, -3], [50, -3], [50, 18], [49, 18]] },
      { tochki: [[-1, -3], [KRAY, -3], [KRAY, 0], [-1, 0]] },
      // дно дыры: провал не убивает, но встать под уступ нельзя
      { tochki: [[KRAY, -3], [dal, -3], [dal, -1], [KRAY, -1]] },
      { tochki: [[dal, -3], [49, -3], [49, vys], [dal, vys]], material: 'lyod' },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: 46, y: vys + 0.5 }],
  };
}

function uchastok(shirina: number, vys: number): Uchastok {
  const dal = KRAY + shirina;
  return {
    nazvanie: `дыра ${shirina} уступ ${vys}`,
    uroven: komnata(shirina, vys),
    gde: [
      [KRAY - 2.5, 0.6],
      [KRAY - 3.6, 0.6],
    ],
    // наверху должны быть ОБА: выход всё равно требует обоих
    proydeno: (a, b) =>
      a.cx > dal + 0.5 && a.cy > vys + 0.5 && b.cx > dal + 0.5 && b.cy > vys + 0.5,
    taktov: 900,
  };
}

// План: слиться, отойти влево за разбегом, разогнаться вправо, над дырой выброс.
const plan: Povadka = (t) => {
  if (t < 60) return { nam: { ...PUSTOE }, slit: true };
  if (t < 300) return { nam: { ...PUSTOE, dx: -1 }, slit: true };
  if (t < 380) return { nam: { ...PUSTOE, dx: 1 }, slit: true };
  return { nam: { ...PUSTOE, dx: 1, dy: 1, vybros: true }, slit: true };
};
const planBezSliyaniya: Povadka = (t) => ({ nam: plan(t, () => 0).nam, slit: false });
const stupenNizhniy: Povadka = (t) =>
  t < 150 ? { nam: { ...PUSTOE, dx: 1 }, slit: false } : { nam: { ...PUSTOE }, slit: false };
const stupenVerhniy: Povadka = (t) =>
  t < 150
    ? { nam: { ...PUSTOE, dx: 1 }, slit: false }
    : { nam: { ...PUSTOE, dx: 1, dy: 1, vybros: true }, slit: false };

const SEMENA = [1, 5, 11, 23, 37];
console.log('=== Обратные ворота: полный контракт ===');
console.log('дыра уступ | слитые | без слияния | ступенью | больные повадки пассажира');
for (const [sh, vy] of [
  [1, 2.2],
  [1.2, 2.2],
  [1.4, 2.2],
  [1.2, 2.6],
  [1.4, 2.6],
] as [number, number][]) {
  const u = uchastok(sh, vy);
  const slitye = SEMENA.filter((z) => progon(u, plan, plan, z)).length;
  const bez = SEMENA.filter((z) => progon(u, planBezSliyaniya, planBezSliyaniya, z)).length;
  const stup = SEMENA.filter(
    (z) => progon(u, stupenVerhniy, stupenNizhniy, z) || progon(u, stupenNizhniy, stupenVerhniy, z),
  ).length;
  const bolnye = Object.entries(PASSAZHIRY)
    .filter(([, p]) => progon(u, plan, p, 2))
    .map(([imya]) => imya);
  console.log(
    `${String(sh).padStart(4)} ${String(vy).padStart(5)} | ${String(slitye).padStart(6)} | ${String(bez).padStart(11)} | ${String(stup).padStart(8)} | ${bolnye.length ? bolnye.join(', ') : 'нет'}`,
  );
}
