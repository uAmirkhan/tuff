// ОШИБОЧНЫЙ СТЕНД, оставлен как след. Тела стартуют в 0,7 от стены, то есть у слитой пары
// отнят РАЗБЕГ, без которого она по замеру 25.09 не работает. Отсюда вывод «слитая пара хуже
// неслитой», который не подтвердился: с равным разбегом (scripts/klip-razbeg.ts) слитая пара
// достаёт 4,2-4,6, двое рядом 1,85-3,06, одиночка 0,96.
// Подбор геометрии для клипа-крючка: на какой высоте полка, куда слитая пара залезает,
// а двое неслитых нет. Замер 4.3 дал выброс +0.90 слитым против +0.17 рядом и +0.21 одному,
// но разница в 0,7 диаметра читается на экране только как бинарный исход: залез или нет.
// Фаз несколько: на витке 008 вывод «0 из 6» оказался артефактом одной фазы старта.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const POL = 0;
const KRAY = 12; // край полки по x
const STENA = 20;

function pole(vysota: number): Uroven {
  return {
    versiya: 1,
    id: 'klip',
    nazvanie: 'Клип',
    mysl: 'Полка, куда залезает только слитая пара',
    start: [3, 0.6],
    granicy: { minX: -1, minY: -3, maxX: STENA + 1, maxY: 16 },
    vremyaZvezdy: 60,
    poligony: [
      { tochki: [[-1, -3], [0, -3], [0, 14], [-1, 14]] },
      { tochki: [[-1, -3], [STENA + 1, -3], [STENA + 1, POL], [-1, POL]] },
      // полка: вертикальная стенка от пола до верха, дальше плато
      {
        tochki: [
          [KRAY, POL],
          [STENA, POL],
          [STENA, vysota],
          [KRAY, vysota],
        ],
      },
      { tochki: [[STENA, -3], [STENA + 1, -3], [STENA + 1, 14], [STENA, 14]] },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: STENA - 2, y: vysota + 0.5 }],
  };
}

type Itog = { zalez: boolean; maksY: number; x: number };

function popytka(vysota: number, tel: 1 | 2, slivat: boolean, faza: number): Itog {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, pole(vysota));
  const a = new Telo(mir, KRAY - 1.2, 0.6);
  const b = tel === 2 ? new Telo(mir, KRAY - 2.2, 0.6) : null;
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (n = PUSTOE, nb = PUSTOE) => {
    igra.doShaga();
    a.primenit(n, igra.korkaSredy);
    b?.primenit(nb, false);
    mir.shag();
    a.posle(n);
    b?.posle(nb);
    igra.takt(n, b ? [nb] : []);
    a.schitatCentr();
    b?.schitatCentr();
  };
  // успокоиться, потом сдвинуть фазу, чтобы выброс не всегда приходился на один такт
  for (let t = 0; t < 60 + faza; t++) shag();
  if (slivat) {
    // подвести второго к первому и слить
    const k = { ...PUSTOE, dx: 1 };
    for (let t = 0; t < 120 && !igra.slito; t++) {
      shag(PUSTOE, k);
      igra.slit();
    }
    if (!igra.slito) return { zalez: false, maksY: 0, x: a.cx };
  }
  // выброс вверх-вправо, оба толкают вправо
  const nam = { ...PUSTOE, vybros: true, dy: 1, dx: 1 };
  let maksY = a.cy;
  for (let t = 0; t < 240; t++) {
    shag(nam, nam);
    if (a.cy > maksY) maksY = a.cy;
  }
  // дать сесть
  const idti = { ...PUSTOE, dx: 1 };
  for (let t = 0; t < 120; t++) shag(idti, idti);
  const naPolke = a.cx > KRAY + 0.3 && a.cy > vysota + 0.2;
  return { zalez: naPolke, maksY, x: a.cx };
}

const FAZY = [0, 7, 13, 19, 29];
console.log('высота | одиночка | двое рядом | слитая пара   (залезло фаз из 5)');
for (let v = 0.6; v <= 1.8001; v += 0.1) {
  const scheta = [
    FAZY.filter((f) => popytka(v, 1, false, f).zalez).length,
    FAZY.filter((f) => popytka(v, 2, false, f).zalez).length,
    FAZY.filter((f) => popytka(v, 2, true, f).zalez).length,
  ];
  console.log(
    `${v.toFixed(1).padStart(6)} | ${String(scheta[0]).padStart(8)} | ${String(scheta[1]).padStart(10)} | ${String(scheta[2]).padStart(11)}`,
  );
}
