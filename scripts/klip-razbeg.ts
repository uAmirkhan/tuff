// Честное сравнение: слитая паре по замеру 25.09 нужен РАЗБЕГ, и первый стенд его не давал.
// Здесь все режимы получают одинаковый разбег по ровному полу, стена ледяная (к льду Вязкость
// не липнет, иначе одиночка лезет по стене). Метрика — наибольшая высота, которой достигло
// любое тело: она меньше зависит от точной геометрии, чем бинарное «залез».
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, type Namerenie, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const STENA = 30;
const RAZBEG = 12;

function pole(vysota: number): Uroven {
  return {
    versiya: 1,
    id: 'klip-razbeg',
    nazvanie: 'Разбег',
    mysl: 'Кто выше',
    start: [2, 0.6],
    granicy: { minX: -1, minY: -3, maxX: STENA + 16, maxY: 20 },
    vremyaZvezdy: 90,
    poligony: [
      { tochki: [[-1, -3], [0, -3], [0, 18], [-1, 18]] },
      { tochki: [[-1, -3], [STENA + 16, -3], [STENA + 16, 0], [-1, 0]] },
      {
        tochki: [[STENA, 0], [STENA + 15, 0], [STENA + 15, vysota], [STENA, vysota]],
        material: 'lyod',
      },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: STENA + 13, y: vysota + 0.5 }],
  };
}

type Rezhim = 'odin' | 'dvoe-ryadom' | 'slitaya-para';

function zamer(vysota: number, rezhim: Rezhim, faza: number) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, pole(vysota));
  const a = new Telo(mir, STENA - RAZBEG, 0.6);
  const b = rezhim === 'odin' ? null : new Telo(mir, STENA - RAZBEG - 1.1, 0.6);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (na: Namerenie, nb: Namerenie) => {
    igra.doShaga();
    a.primenit(na, igra.korkaSredy);
    b?.primenit(nb, false);
    mir.shag();
    a.posle(na);
    b?.posle(nb);
    igra.takt(na, b ? [nb] : []);
    a.schitatCentr();
    b?.schitatCentr();
  };
  const stoyat: Namerenie = PUSTOE;
  const vpravo: Namerenie = { ...PUSTOE, dx: 1 };
  for (let t = 0; t < 30 + faza; t++) shag(stoyat, stoyat);
  if (rezhim === 'slitaya-para') {
    for (let t = 0; t < 180 && !igra.slito; t++) {
      shag(stoyat, vpravo);
      igra.slit();
    }
    if (!igra.slito) return { maks: 0, slito: false };
  }
  // разбег и попытка: все жмут вправо, у стены добавляют выброс
  const lez: Namerenie = { ...PUSTOE, vybros: true, dy: 1, dx: 1 };
  let maks = 0;
  for (let t = 0; t < 420; t++) {
    const uSteny = Math.max(a.cx, b?.cx ?? 0) > STENA - 1.6;
    const n = uSteny ? lez : vpravo;
    shag(n, n);
    maks = Math.max(maks, a.cy, b?.cy ?? 0);
  }
  return { maks, slito: igra.slito };
}

console.log('=== Наибольшая высота центра тела после разбега 12 единиц (медиана 5 фаз) ===');
console.log('стена | одиночка | двое рядом | слитая пара');
const FAZY = [0, 7, 13, 19, 29];
const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] as number;
for (const v of [1.4, 1.8, 2.0, 2.2, 2.6]) {
  const r = (rezhim: Rezhim) => med(FAZY.map((f) => zamer(v, rezhim, f).maks));
  console.log(
    `${v.toFixed(1).padStart(5)} | ${r('odin').toFixed(2).padStart(8)} | ${r('dvoe-ryadom').toFixed(2).padStart(10)} | ${r('slitaya-para').toFixed(2).padStart(11)}`,
  );
}
