// Дымовая проба продакта (сверка 005): перекрывает ли слитая пара дыру в полу у ледяного уступа,
// там, где одиночка проваливается и не может встать под уступ для живой ступени.
// Не вердикт: фазы подхода четыре, ввод скриптованный.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const KRAY = 20; // ближний край дыры

function komnata(shirina: number, vys: number): Uroven {
  const dal = KRAY + shirina; // дальний край дыры = подножие ледяной стены
  return {
    versiya: 1,
    id: 'proba-most',
    nazvanie: 'Мост над дырой',
    mysl: 'Уступ над провалом',
    start: [16, 0.6],
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
      // пол до дыры
      {
        tochki: [
          [-1, -3],
          [KRAY, -3],
          [KRAY, 0],
          [-1, 0],
        ],
      },
      // дно дыры на -1: провал не убивает, но встать под уступ нельзя
      {
        tochki: [
          [KRAY, -3],
          [dal, -3],
          [dal, -1],
          [KRAY, -1],
        ],
      },
      // ледяной уступ от дальнего края дыры
      {
        tochki: [
          [dal, -3],
          [39, -3],
          [39, vys],
          [dal, vys],
        ],
        material: 'lyod',
      },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: 36, y: vys + 0.5 }],
  };
}

type Rezhim = 'одиночка' | 'двое' | 'слитые';

function progon(shirina: number, vys: number, rezhim: Rezhim, x0: number) {
  const u = komnata(shirina, vys);
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, x0, 0.6);
  const b =
    rezhim === 'одиночка' ? null : new Telo(mir, x0 + (rezhim === 'слитые' ? 0.9 : 1.2), 0.6);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (na: Partial<Namerenie>, nb: Partial<Namerenie> = na) => {
    const n1 = { ...PUSTOE, ...na };
    const n2 = { ...PUSTOE, ...nb };
    igra.doShaga();
    a.primenit(n1, igra.korkaSredy);
    b?.primenit(n2, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(n1);
    b?.posle(n2);
    igra.takt(n1, b ? [n2] : []);
    a.schitatCentr();
    b?.schitatCentr();
  };
  for (let t = 0; t < 30; t++) shag({});
  const slilos = rezhim === 'слитые' ? igra.slit() : false;
  let minY = 10;
  // подход к стене
  for (let t = 0; t < 240; t++) {
    shag({ dx: 1 });
    minY = Math.min(minY, a.cy, b ? b.cy : 10);
  }
  const uStenyA = a.cx;
  const uStenyB = b ? b.cx : Number.NaN;
  const uStenyYa = a.cy;
  const uStenyYb = b ? b.cy : Number.NaN;
  // прыжок общим выбросом у стены
  let maxY = -10;
  for (let t = 0; t < 180; t++) {
    shag({ dx: 1, dy: 1, vybros: true });
    maxY = Math.max(maxY, a.cy, b ? b.cy : -10);
  }
  const vzyal = a.cy > vys + 0.45 || (b ? b.cy > vys + 0.45 : false);
  return { slilos, minY, uStenyA, uStenyB, uStenyYa, uStenyYb, maxY, vzyal };
}

const fazy = [16, 16.25, 16.5, 16.75];
for (const shirina of [1.0, 1.2, 1.4]) {
  for (const vys of [1.8, 2.2]) {
    console.log(`\n=== дыра ${shirina.toFixed(1)}, уступ ${vys.toFixed(1)} ===`);
    for (const r of ['одиночка', 'двое', 'слитые'] as Rezhim[]) {
      const rs = fazy.map((x0) => progon(shirina, vys, r, x0));
      const provalilis = rs.filter((q) => q.minY < -0.2).length;
      const vzyali = rs.filter((q) => q.vzyal).length;
      const u = rs
        .map(
          (q) =>
            `${q.uStenyA.toFixed(1)},${q.uStenyYa.toFixed(1)}${Number.isNaN(q.uStenyB) ? '' : `/${q.uStenyB.toFixed(1)},${q.uStenyYb.toFixed(1)}`}`,
        )
        .join(' ');
      console.log(
        `${r.padEnd(9)} слились ${String(rs[0]?.slilos).padEnd(5)} провал ${provalilis}/4  у стены [${u}]  maxY ${Math.max(...rs.map((q) => q.maxY)).toFixed(2)}  взяли ${vzyali}/4`,
      );
    }
  }
}
