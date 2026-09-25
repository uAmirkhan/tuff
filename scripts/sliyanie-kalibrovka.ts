// Развёртка каркаса слияния: жёсткость и косые связи против двух целей.
// Цель 1 — прыжок пары (ради чего сливаться). Цель 2 — держится ли высокая форма.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { SLIYANIE } from '../src/game/sliyanie';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const POLE: Uroven = {
  versiya: 1,
  id: 'kalibrovka',
  nazvanie: 'Калибровка',
  mysl: 'Каркас слияния',
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

function stsena(ax: number, ay: number, bx: number, by: number) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, POLE);
  const a = new Telo(mir, ax, ay);
  const b = new Telo(mir, bx, by);
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
  return { mir, a, b, igra, shag };
}

function pryzhok(): number {
  const s = stsena(10, 0.6, 10.9, 0.6);
  for (let t = 0; t < 60; t++) s.shag();
  if (!s.igra.slit()) return Number.NaN;
  const y0 = s.a.cy;
  let maks = y0;
  const nam = { ...PUSTOE, vybros: true, dy: 1 };
  for (let t = 0; t < 180; t++) {
    s.shag(nam);
    if (s.a.cy > maks) maks = s.a.cy;
  }
  return maks - y0;
}

function stolb(): { vysota: number; storozhey: number } {
  const s = stsena(10, 0.6, 10, 1.62);
  for (let t = 0; t < 8; t++) s.shag();
  if (!s.igra.slit()) return { vysota: Number.NaN, storozhey: 0 };
  let min = 99;
  for (let t = 0; t < 600; t++) {
    s.shag();
    const g1 = s.a.gabarity();
    const g2 = s.b.gabarity();
    const v = Math.max(g1.maxY, g2.maxY) - Math.min(g1.minY, g2.minY);
    if (t > 60 && v < min) min = v;
  }
  return { vysota: min, storozhey: s.mir.zhurnal.length };
}

console.log('косой  жёсткость  прыжок   столб(из 1,57)  сторожа');
for (const kosoy of [false, true]) {
  for (const zh of [0.2, 0.35, 0.5, 0.7, 0.9]) {
    SLIYANIE.karkasKosoy = kosoy;
    SLIYANIE.karkasZhestkost = zh;
    const p = pryzhok();
    const st = stolb();
    console.log(
      `${(kosoy ? 'да' : 'нет').padEnd(6)} ${String(zh).padEnd(10)} +${p.toFixed(2)}    ${st.vysota.toFixed(2)}            ${st.storozhey}`,
    );
  }
}
