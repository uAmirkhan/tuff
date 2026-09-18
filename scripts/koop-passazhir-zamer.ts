// Болен ли пассажиром сам механизм слияния.
// Если слитая пара едет от одного ввода так же, как от двух, то второй игрок в слиянии
// не нужен вовсе: подержал кнопку и поехал. Замеряем скорость пары в четырёх режимах.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const KOMNATA: Uroven = {
  versiya: 1,
  id: 'zamer-passazhir',
  nazvanie: 'Замер пассажира',
  mysl: 'Нужен ли второй игрок слитой паре',
  start: [3, 0.6],
  granicy: { minX: -1, minY: -3, maxX: 61, maxY: 14 },
  vremyaZvezdy: 60,
  poligony: [
    {
      tochki: [
        [-1, -3],
        [0, -3],
        [0, 12],
        [-1, 12],
      ],
    },
    {
      tochki: [
        [60, -3],
        [61, -3],
        [61, 12],
        [60, 12],
      ],
    },
    {
      tochki: [
        [-1, -3],
        [61, -3],
        [61, 0],
        [-1, 0],
      ],
    },
  ],
  obekty: [{ tip: 'vyhod', id: 'v', x: 58, y: 0.5 }],
};

function progon(na: Partial<Namerenie>, nb: Partial<Namerenie>, slit: boolean, taktov = 420) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, KOMNATA);
  const a = new Telo(mir, 6, 0.6);
  const b = new Telo(mir, 6.9, 0.6);
  const igra = new Igra(mir, a, ur);
  igra.dobavitSputnika(b);
  const na2 = { ...PUSTOE, ...na };
  const nb2 = { ...PUSTOE, ...nb };
  const shagS = (x: Namerenie, y: Namerenie) => {
    igra.doShaga();
    a.primenit(x, igra.korkaSredy);
    b.primenit(y, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(x);
    b.posle(y);
    igra.takt(x, [y]);
    a.schitatCentr();
    b.schitatCentr();
  };
  const shag = () => shagS(na2, nb2);
  // разгон нейтральным вводом: иначе тела разъезжаются и слиться уже не могут
  for (let t = 0; t < 30; t++) shagS(PUSTOE, PUSTOE);
  if (slit && !igra.slit()) throw new Error('не слились');
  a.schitatCentr();
  b.schitatCentr();
  const x0 = (a.cx + b.cx) / 2;
  for (let t = 0; t < taktov; t++) shag();
  const x1 = (a.cx + b.cx) / 2;
  return { put: x1 - x0, skorost: ((x1 - x0) / taktov) * 60, slito: igra.slito };
}

console.log('=== Слитая пара: кто на самом деле везёт ===');
const rezhimy: [string, Partial<Namerenie>, Partial<Namerenie>][] = [
  ['оба жмут вправо', { dx: 1 }, { dx: 1 }],
  ['жмёт только первый', { dx: 1 }, {}],
  ['жмёт только второй', {}, { dx: 1 }],
  ['жмут в разные стороны', { dx: 1 }, { dx: -1 }],
];
const oba = progon({ dx: 1 }, { dx: 1 }, true);
for (const [imya, na, nb] of rezhimy) {
  const r = progon(na, nb, true);
  const dolya = (r.put / oba.put) * 100;
  console.log(
    `  ${imya.padEnd(24)} путь ${r.put.toFixed(2).padStart(6)}  скорость ${r.skorost.toFixed(2).padStart(5)} ед/с  ${dolya.toFixed(0)}% от «оба»`,
  );
}

console.log('=== Для сравнения: неслитые тела ===');
for (const [imya, na, nb] of rezhimy) {
  const r = progon(na, nb, false);
  console.log(`  ${imya.padEnd(24)} путь пары ${r.put.toFixed(2)}`);
}
