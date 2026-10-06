// Проверка собственной методики: в тестах ворот пять семян кормят sluchay, а сценарий вручную
// его не читает — значит «5 из 5 на пяти семенах» это один и тот же прогон пять раз.
// Здесь сценарий сдвигается по фазе, и семя наконец что-то меняет.
import { PUSTOE } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { PASSAZHIRY, type Povadka, type Uchastok, progon } from './koop-bot';

const SEMENA = [1, 5, 11, 23, 37];
// сдвиг длины отхода: столько тактов добавляется к разбегу назад
const FAZY = [-80, -40, 0, 40, 80, 120, 160];

// --- ворота высоты
const STENA = 30;
function komnataV(vysota: number): Uroven {
  return {
    versiya: 1, id: 'v', nazvanie: 'v', mysl: 'v', start: [STENA - 2.5, 0.6],
    granicy: { minX: -1, minY: -3, maxX: STENA + 16, maxY: 20 }, vremyaZvezdy: 90,
    poligony: [
      { tochki: [[-1, -3], [0, -3], [0, 18], [-1, 18]] },
      { tochki: [[-1, -3], [STENA + 16, -3], [STENA + 16, 0], [-1, 0]] },
      { tochki: [[STENA, 0], [STENA + 15, 0], [STENA + 15, vysota], [STENA, vysota]], material: 'lyod' },
      { tochki: [[STENA + 14, vysota], [STENA + 15, vysota], [STENA + 15, 18], [STENA + 14, 18]] },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: STENA + 13, y: vysota + 0.5 }],
  };
}
const uchastokV = (vysota: number): Uchastok => ({
  nazvanie: `лёд ${vysota}`, uroven: komnataV(vysota),
  gde: [[STENA - 2.5, 0.6], [STENA - 3.6, 0.6]],
  proydeno: (a, b) => a.cx > STENA + 0.5 && a.cy > vysota + 0.5 && b.cx > STENA + 0.5 && b.cy > vysota + 0.5,
  taktov: 900,
});
const planV = (sdvig: number, slit: boolean): Povadka => (t) => {
  if (t < 60) return { nam: { ...PUSTOE }, slit };
  if (t < 300 + sdvig) return { nam: { ...PUSTOE, dx: -1 }, slit };
  if (t < 380 + sdvig) return { nam: { ...PUSTOE, dx: 1 }, slit };
  return { nam: { ...PUSTOE, dx: 1, dy: 1, vybros: true }, slit };
};

// --- ворота длины
const PROYOM = 30, SHIRINA = 8, DAL = PROYOM + SHIRINA, PRAVO = 55;
function komnataD(): Uroven {
  return {
    versiya: 1, id: 'd', nazvanie: 'd', mysl: 'd', start: [PROYOM - 2.5, 0.6],
    granicy: { minX: -1, minY: -12, maxX: PRAVO + 1, maxY: 16 }, vremyaZvezdy: 90,
    poligony: [
      { tochki: [[-1, -12], [0, -12], [0, 14], [-1, 14]] },
      { tochki: [[PRAVO, -12], [PRAVO + 1, -12], [PRAVO + 1, 14], [PRAVO, 14]] },
      { tochki: [[-1, -1], [PROYOM, -1], [PROYOM, 0], [-1, 0]] },
      { tochki: [[DAL, -1], [PRAVO, -1], [PRAVO, 0], [DAL, 0]] },
      { tochki: [[-1, -12], [PRAVO + 1, -12], [PRAVO + 1, -11], [-1, -11]] },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: PRAVO - 3, y: 0.5 }],
  };
}
const uchastokD: Uchastok = {
  nazvanie: 'проём 8', uroven: komnataD(),
  gde: [[PROYOM - 2.5, 0.6], [PROYOM - 3.6, 0.6]],
  proydeno: (a, b) => a.cx > DAL + 1 && a.cy > -1 && b.cx > DAL + 1 && b.cy > -1,
  taktov: 900,
};
const planD = (sdvig: number, slit: boolean): Povadka => (t) => {
  if (t < 60) return { nam: { ...PUSTOE }, slit };
  if (t < 300 + sdvig) return { nam: { ...PUSTOE, dx: -1 }, slit };
  return { nam: { ...PUSTOE, dx: 1 }, slit };
};

function razbor(imya: string, u: Uchastok, plan: (s: number, slit: boolean) => Povadka) {
  const slitye = FAZY.filter((f) => progon(u, plan(f, true), plan(f, true), 1));
  const bez = FAZY.filter((f) => progon(u, plan(f, false), plan(f, false), 1));
  const bolnye = new Map<string, number[]>();
  for (const f of FAZY)
    for (const [n, p] of Object.entries(PASSAZHIRY))
      if (progon(u, plan(f, true), p, 2)) bolnye.set(n, [...(bolnye.get(n) ?? []), f]);
  console.log(
    `${imya}: слитые ${slitye.length}/${FAZY.length} (фазы ${slitye.join(', ') || '—'}), ` +
      `без слияния ${bez.length}/${FAZY.length}, больные: ${
        [...bolnye].map(([n, ff]) => `${n} (фазы ${ff.join(',')})`).join('; ') || 'нет'
      }`,
  );
  void SEMENA;
}

console.log('=== Те же ворота, но фаза сценария реально меняется ===');
for (const v of [2.0, 2.4, 2.8]) razbor(`высота ${v}`, uchastokV(v), (f, s) => planV(f, s));
razbor('длина 8', uchastokD, (f, s) => planD(f, s));
