// Окно ворот «только общим выбросом»: какую высоту одиночка не берёт, а слитая пара берёт.
// Вязкость липнет к базальту и металлу, но не ко льду (замер 18.09), поэтому вертикальные
// ворота строятся на льду — иначе одиночка просто залезет по стене.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Material, Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function komnata(vys: number, mat: Material, razbeg: number, ploshchadka = 0): Uroven {
  // площадка длиной razbeg, потом ледяная стена с полкой на высоте vys
  const stenaX = 4 + razbeg;
  return {
    versiya: 1,
    id: 'vorota-vybros',
    nazvanie: 'Ворота выброса',
    mysl: 'Только общим выбросом',
    start: [3, 0.6],
    granicy: { minX: -1, minY: -3, maxX: stenaX + 14, maxY: 20 },
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
          [stenaX + 13, -3],
          [stenaX + 14, -3],
          [stenaX + 14, 18],
          [stenaX + 13, 18],
        ],
      },
      {
        tochki: [
          [-1, -3],
          [stenaX + 14, -3],
          [stenaX + 14, 0],
          [-1, 0],
        ],
      },
      // стена с полкой: от стенаX вправо, высота vys
      {
        tochki: [
          [stenaX, 0],
          [stenaX + 13, 0],
          [stenaX + 13, vys + ploshchadka],
          [stenaX, vys + ploshchadka],
        ],
        material: mat,
      },
      // подход по приподнятой площадке, как в комнате koop-1
      ...(ploshchadka > 0
        ? [
            {
              tochki: [
                [4, 0],
                [stenaX, 0],
                [stenaX, ploshchadka],
                [4, ploshchadka],
              ] as [number, number][],
            },
          ]
        : []),
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: stenaX + 6, y: vys + 0.5 }],
  };
}

function vzyali(
  vys: number,
  mat: Material,
  razbeg: number,
  vdvoyom: boolean,
  slivat: boolean,
  ploshchadka = 0,
): boolean {
  const u = komnata(vys, mat, razbeg, ploshchadka);
  const stenaX = 4 + razbeg;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, 3, 0.6);
  const b = vdvoyom ? new Telo(mir, 3.9, 0.6) : null;
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (n: Namerenie) => {
    igra.doShaga();
    a.primenit(n, igra.korkaSredy);
    b?.primenit(n, false);
    mir.shag();
    a.posle(n);
    b?.posle(n);
    igra.takt(n, b ? [n] : []);
    a.schitatCentr();
    b?.schitatCentr();
  };
  // подойти к стене
  const idti = { ...PUSTOE, dx: 1 };
  for (let t = 0; t < 30; t++) shag(PUSTOE);
  if (slivat && !igra.slit()) return false;
  // разбег и прыжок: жмём вперёд и Выброс всё время
  const pryg = { ...PUSTOE, dx: 1, vybros: true, dy: 1 };
  for (let t = 0; t < 120; t++) shag(idti);
  for (let t = 0; t < 600; t++) {
    shag(pryg);
    // строго: центр выше верха стены на радиус тела и тело УЖЕ над полкой, а не висит на краю
    const verh = vys + ploshchadka;
    const naPolke = a.cx > stenaX + 1.0 && a.cy > verh + 0.45;
    const oba = !b || (b.cx > stenaX + 1.0 && b.cy > verh + 0.45);
    if (naPolke && oba) return true;
  }
  return false;
}

for (const [mat, pl] of [
  ['lyod', 0],
  ['lyod', 1],
] as [Material, number][]) {
  console.log(`=== Стена ${mat}, разбег 12, площадка подхода ${pl} ===`);
  console.log('высота  одиночка  двое рядом  слитые');
  for (const v of [1.0, 1.4, 1.8, 2.2, 2.6, 3.0]) {
    const o = vzyali(v, mat, 12, false, false, pl);
    const d = vzyali(v, mat, 12, true, false, pl);
    const s = vzyali(v, mat, 12, true, true, pl);
    console.log(
      `${String(v).padEnd(7)} ${(o ? 'ВЗЯЛ' : ' -  ').padEnd(9)} ${(d ? 'ВЗЯЛИ' : '  -  ').padEnd(11)} ${s ? 'ВЗЯЛИ' : '  -  '}`,
    );
  }
}
