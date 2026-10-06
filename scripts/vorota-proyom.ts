// Класс длины, поставленный как он единственно может работать: слитая пара — одно тело длиной
// в два диаметра, и оно перекрывает проём, в который одиночка проваливается. Без выброса:
// прежний стенд пропасти держал Выброс зажатым весь прогон, и её перелетали все, включая
// одиночку на ширине 8 — это не смерть класса, это неинформативный стенд.
import { PUSTOE } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { PASSAZHIRY, type Povadka, type Uchastok, progon } from './koop-bot';

// Проём стоит там же, где стена в воротах высоты (x=30), старт вплотную: разбег придётся
// брать НАЗАД, и партнёр, который тупо держит «вперёд», не даст паре отойти. Это единственная
// найденная защита от пассажира (виток 010).
const PROYOM = 30;

function komnata(shirina: number): Uroven {
  const dal = PROYOM + shirina;
  return {
    versiya: 1,
    id: `proyom-${shirina}`,
    nazvanie: 'Проём',
    mysl: 'Одно длинное тело',
    start: [PROYOM - 2, 0.6],
    granicy: { minX: -1, minY: -12, maxX: 56, maxY: 16 },
    vremyaZvezdy: 60,
    poligony: [
      { tochki: [[-1, -12], [0, -12], [0, 14], [-1, 14]] },
      { tochki: [[55, -12], [56, -12], [56, 14], [55, 14]] },
      { tochki: [[-1, -1], [PROYOM, -1], [PROYOM, 0], [-1, 0]] },
      { tochki: [[dal, -1], [55, -1], [55, 0], [dal, 0]] },
      // дно глубоко внизу: провалился — уже не вылез своим ходом
      { tochki: [[-1, -12], [56, -12], [56, -11], [-1, -11]] },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: 52, y: 0.5 }],
  };
}

function uchastok(shirina: number): Uchastok {
  const dal = PROYOM + shirina;
  return {
    nazvanie: `проём ${shirina}`,
    uroven: komnata(shirina),
    // вплотную к проёму: с разбегом в 8 единиц тела разгоняются и проскакивают его
    // баллистически, и проём проверяет скорость, а не перекрытие
    gde: [
      [PROYOM - 2, 0.6],
      [PROYOM - 3.1, 0.6],
    ],
    proydeno: (a, b) => a.cx > dal + 1 && a.cy > -1 && b.cx > dal + 1 && b.cy > -1,
    taktov: 900,
  };
}

// План как в воротах высоты: слиться, отойти влево за разбегом, разогнаться вправо.
const idti: Povadka = (t) => {
  if (t < 60) return { nam: { ...PUSTOE }, slit: true };
  if (t < 300) return { nam: { ...PUSTOE, dx: -1 }, slit: true };
  return { nam: { ...PUSTOE, dx: 1 }, slit: true };
};
const idtiBezSliyaniya: Povadka = (t) => ({ nam: idti(t, () => 0).nam, slit: false });

const SEMENA = [1, 5, 11, 23, 37];
console.log('=== Проём: перекрывает ли его слитая пара ===');
console.log('ширина | слитые | без слияния | больные повадки пассажира');
for (const sh of [6.0, 8.0, 10.0, 12.0]) {
  const u = uchastok(sh);
  const slitye = SEMENA.filter((z) => progon(u, idti, idti, z)).length;
  const bez = SEMENA.filter((z) => progon(u, idtiBezSliyaniya, idtiBezSliyaniya, z)).length;
  const bolnye = Object.entries(PASSAZHIRY)
    .filter(([, p]) => progon(u, idti, p, 2))
    .map(([imya]) => imya);
  console.log(
    `${sh.toFixed(1).padStart(6)} | ${String(slitye).padStart(6)} | ${String(bez).padStart(11)} | ${bolnye.length ? bolnye.join(', ') : 'нет'}`,
  );
}
