// Требует ли хрупкий пол именно СЛИЯНИЯ, или хватает двух тел рядом.
// В вики (4.3) записано «окно только слиянием», но там сравнивалась слитая пара с одиночкой,
// а два НЕслитых тела рядом я не проверял ни разу.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function uroven(hrupkost: number): Uroven {
  return {
    versiya: 1,
    id: 'hrupkiy-vdvoyom',
    nazvanie: 'Хрупкий вдвоём',
    mysl: 'Нужно ли слияние',
    start: [3, 7],
    granicy: { minX: -1, minY: -14, maxX: 31, maxY: 18 },
    vremyaZvezdy: 60,
    poligony: [
      {
        tochki: [
          [-1, -14],
          [0, -14],
          [0, 16],
          [-1, 16],
        ],
      },
      {
        tochki: [
          [30, -14],
          [31, -14],
          [31, 16],
          [30, 16],
        ],
      },
      {
        tochki: [
          [0, -14],
          [8, -14],
          [8, 6],
          [0, 6],
        ],
      },
      {
        tochki: [
          [8, 5.6],
          [16, 5.6],
          [16, 6],
          [8, 6],
        ],
        material: 'hrupkiy',
        hrupkost,
      },
      {
        tochki: [
          [16, -14],
          [30, -14],
          [30, 6],
          [16, 6],
        ],
      },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: 28, y: 6.5 }],
  };
}

function slomali(h: number, rezhim: 'одиночка' | 'двое рядом' | 'слитые'): boolean {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, uroven(h));
  const a = new Telo(mir, rezhim === 'одиночка' ? 11 : 10.7, 7.2);
  const b = rezhim === 'одиночка' ? null : new Telo(mir, 11.6, 7.2);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const nam = { ...PUSTOE, korka: true };
  if (rezhim === 'слитые') {
    for (let t = 0; t < 10; t++) {
      igra.doShaga();
      a.primenit(PUSTOE, false);
      b?.primenit(PUSTOE, false);
      mir.shag();
      a.posle(PUSTOE);
      b?.posle(PUSTOE);
      igra.takt(PUSTOE, b ? [PUSTOE] : []);
    }
    if (!igra.slit()) throw new Error('не слились');
  }
  for (let t = 0; t < 300; t++) {
    igra.doShaga();
    a.primenit(nam, igra.korkaSredy);
    b?.primenit(nam, false);
    mir.shag();
    a.posle(nam);
    b?.posle(nam);
    igra.takt(nam, b ? [nam] : []);
    for (const e of igra.sobytiya) if (e.tip === 'slomano') return true;
  }
  return false;
}

console.log('=== Кто ломает хрупкий пол (падение 1,2, Корка) ===');
console.log('порог  одиночка  двое рядом  слитые');
for (const h of [1.0, 1.5, 2.0, 2.5, 3.0, 4.0]) {
  const o = slomali(h, 'одиночка');
  const d = slomali(h, 'двое рядом');
  const s = slomali(h, 'слитые');
  console.log(
    `${String(h).padEnd(6)} ${(o ? 'ломает' : '  -   ').padEnd(9)} ${(d ? 'ЛОМАЕТ' : '  -   ').padEnd(11)} ${s ? 'ЛОМАЕТ' : '  -   '}`,
  );
}

console.log('\n=== Столб: держится ли высокая форма, и держится ли она БЕЗ слияния ===');
{
  const plosko: Uroven = {
    versiya: 1,
    id: 'stolb',
    nazvanie: 'Столб',
    mysl: 'Держится ли высокая форма',
    start: [3, 0.6],
    granicy: { minX: -1, minY: -3, maxX: 31, maxY: 16 },
    vremyaZvezdy: 60,
    poligony: [
      {
        tochki: [
          [-1, -3],
          [0, -3],
          [0, 14],
          [-1, 14],
        ],
      },
      {
        tochki: [
          [30, -3],
          [31, -3],
          [31, 14],
          [30, 14],
        ],
      },
      {
        tochki: [
          [-1, -3],
          [31, -3],
          [31, 0],
          [-1, 0],
        ],
      },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: 28, y: 0.5 }],
  };
  const stolb = (slivat: boolean, idti: boolean) => {
    const mir = new Mir(MIR);
    const ur = zagruzitUroven(mir, plosko);
    const a = new Telo(mir, 10, 0.6);
    const b = new Telo(mir, 10, 1.62);
    const igra = new Igra(mir, a, ur);
    igra.dobavitSputnika(b);
    const shag = (n = PUSTOE) => {
      igra.doShaga();
      a.primenit(n, igra.korkaSredy);
      b.primenit(n, false);
      mir.shag();
      a.posle(n);
      b.posle(n);
      igra.takt(n, [n]);
      a.schitatCentr();
      b.schitatCentr();
    };
    for (let t = 0; t < 8; t++) shag();
    if (slivat && !igra.slit()) return { vysota: 0, put: 0, slilos: false };
    const x0 = a.cx;
    const nam = idti ? { ...PUSTOE, dx: 1 } : PUSTOE;
    let minV = 99;
    for (let t = 0; t < 600; t++) {
      shag(nam);
      const g1 = a.gabarity();
      const g2 = b.gabarity();
      const v = Math.max(g1.maxY, g2.maxY) - Math.min(g1.minY, g2.minY);
      if (t > 60 && v < minV) minV = v;
    }
    return { vysota: minV, put: a.cx - x0, slilos: true };
  };
  for (const [imya, slivat, idti] of [
    ['слитые, стоят', true, false],
    ['слитые, идут', true, true],
    ['НЕслитые, стоят', false, false],
    ['НЕслитые, идут', false, true],
  ] as const) {
    const r = stolb(slivat, idti);
    console.log(
      `  ${imya.padEnd(18)} наименьшая высота за 10 с: ${r.vysota.toFixed(2)}, путь ${r.put.toFixed(2)}`,
    );
  }
}

console.log('\n=== Выброс: даёт ли слияние высоту по сравнению с двумя телами рядом ===');
{
  const pole: Uroven = {
    versiya: 1,
    id: 'vybros-para',
    nazvanie: 'Выброс пары',
    mysl: 'Даёт ли слияние высоту',
    start: [3, 0.6],
    granicy: { minX: -1, minY: -3, maxX: 31, maxY: 16 },
    vremyaZvezdy: 60,
    poligony: [
      {
        tochki: [
          [-1, -3],
          [0, -3],
          [0, 14],
          [-1, 14],
        ],
      },
      {
        tochki: [
          [30, -3],
          [31, -3],
          [31, 14],
          [30, 14],
        ],
      },
      {
        tochki: [
          [-1, -3],
          [31, -3],
          [31, 0],
          [-1, 0],
        ],
      },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: 28, y: 0.5 }],
  };
  const pryzhok = (tel: 1 | 2, slivat: boolean) => {
    const mir = new Mir(MIR);
    const ur = zagruzitUroven(mir, pole);
    const a = new Telo(mir, 10, 0.6);
    const b = tel === 2 ? new Telo(mir, 10.9, 0.6) : null;
    const igra = new Igra(mir, a, ur);
    if (b) igra.dobavitSputnika(b);
    const shag = (n = PUSTOE) => {
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
    for (let t = 0; t < 60; t++) shag();
    if (slivat && !igra.slit()) throw new Error('не слились');
    const y0 = a.cy;
    let maks = y0;
    const nam = { ...PUSTOE, vybros: true, dy: 1 };
    for (let t = 0; t < 180; t++) {
      shag(nam);
      if (a.cy > maks) maks = a.cy;
    }
    return maks - y0;
  };
  console.log(`  одиночка          +${pryzhok(1, false).toFixed(2)}`);
  console.log(`  двое рядом, не слиты +${pryzhok(2, false).toFixed(2)}`);
  console.log(`  двое слитых          +${pryzhok(2, true).toFixed(2)}`);
}
