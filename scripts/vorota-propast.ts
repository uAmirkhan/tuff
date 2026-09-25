// Ворота на длине, а не на высоте: слитая пара — одно тело длиной 2,0, и она должна
// перекрывать пропасть, в которую поодиночке проваливаешься. Двое несклеенных мостом не станут:
// тела не держатся друг за друга (замер 18.09, штабель разваливается за 0,3-2,1 с).
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const LEVO = 20; // левый край пропасти

function komnata(shirina: number): Uroven {
  const pravo = LEVO + shirina;
  return {
    versiya: 1,
    id: 'propast',
    nazvanie: 'Пропасть',
    mysl: 'Мост из одного тела',
    start: [3, 0.6],
    granicy: { minX: -1, minY: -14, maxX: pravo + 16, maxY: 14 },
    vremyaZvezdy: 60,
    poligony: [
      {
        tochki: [
          [-1, -14],
          [0, -14],
          [0, 12],
          [-1, 12],
        ],
      },
      {
        tochki: [
          [pravo + 15, -14],
          [pravo + 16, -14],
          [pravo + 16, 12],
          [pravo + 15, 12],
        ],
      },
      // берега: пол слева и справа, между ними дыра до самого низа
      {
        tochki: [
          [-1, -14],
          [LEVO, -14],
          [LEVO, 0],
          [-1, 0],
        ],
      },
      {
        tochki: [
          [pravo, -14],
          [pravo + 16, -14],
          [pravo + 16, 0],
          [pravo, 0],
        ],
      },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: pravo + 8, y: 0.5 }],
  };
}

function pereshli(shirina: number, rezhim: 'одиночка' | 'двое' | 'слитые'): boolean {
  const u = komnata(shirina);
  const pravo = LEVO + shirina;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, 3, 0.6);
  const b = rezhim === 'одиночка' ? null : new Telo(mir, 4.2, 0.6);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (n: Namerenie) => {
    igra.doShaga();
    a.primenit(n, igra.korkaSredy);
    b?.primenit(n, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(n);
    b?.posle(n);
    igra.takt(n, b ? [n] : []);
    a.schitatCentr();
    b?.schitatCentr();
  };
  for (let t = 0; t < 30; t++) shag(PUSTOE);
  if (rezhim === 'слитые' && !igra.slit()) return false;
  const idti: Namerenie = { ...PUSTOE, dx: 1 };
  for (let t = 0; t < 900; t++) {
    shag(idti);
    const na = a.cx > pravo + 1 && a.cy > -1;
    const nb = !b || (b.cx > pravo + 1 && b.cy > -1);
    if (na && nb) return true;
    if (a.cy < -6) return false; // упал
  }
  return false;
}

console.log('ширина  одиночка  двое рядом  слитые');
for (const w of [2.4, 3.0, 3.5, 4.0, 4.5, 5.0, 6.0]) {
  const o = pereshli(w, 'одиночка');
  const d = pereshli(w, 'двое');
  const s = pereshli(w, 'слитые');
  console.log(
    `${String(w).padEnd(7)} ${(o ? 'ПРОШЁЛ' : '  -   ').padEnd(9)} ${(d ? 'ПРОШЛИ' : '  -   ').padEnd(11)} ${s ? 'ПРОШЛИ' : '  -   '}`,
  );
}
