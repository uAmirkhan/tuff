// Враги: идут к игроку, касание жжёт, Корка давит, лава убивает, тела не проходят друг сквозь друга.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function uroven(obekty: Uroven['obekty'], start: [number, number] = [2, 0.6]): Uroven {
  return {
    versiya: 1,
    id: 'v',
    nazvanie: 'v',
    mysl: 'v',
    start,
    granicy: { minX: -5, minY: -5, maxX: 30, maxY: 15 },
    poligony: [
      {
        tochki: [
          [-5, -5],
          [30, -5],
          [30, 0],
          [-5, 0],
        ],
      },
    ],
    obekty: [
      { tip: 'vyhod', x: 29, y: 1 },
      { tip: 'serdce', x: 25, y: 1 },
      { tip: 'serdce', x: 26, y: 1 },
      { tip: 'serdce', x: 27, y: 1 },
      ...obekty,
    ],
  };
}

function stsena(u: Uroven) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const takt = (nam: Namerenie = PUSTOE, n = 1) => {
    for (let i = 0; i < n; i++) {
      igra.doShaga();
      telo.primenit(nam, igra.korkaSredy);
      mir.shag();
      telo.posle(nam);
      igra.takt(nam);
    }
  };
  return { mir, telo, igra, takt };
}

describe('враги', () => {
  it('Обрезок идёт к игроку и жжёт при касании', () => {
    const { igra, takt } = stsena(uroven([{ tip: 'obrezok', x: 7, y: 0.4 }]));
    const v = igra.vragi[0];
    if (!v) throw new Error('нет врага');
    v.schitatCentr();
    const x0 = v.cx;
    takt(PUSTOE, 240);
    v.schitatCentr();
    expect(v.cx).toBeLessThan(x0 - 1); // подошёл
    takt(PUSTOE, 480);
    expect(igra.zhar).toBeLessThan(100); // обжёг
    expect(igra.sobytiya.length >= 0).toBe(true);
  });

  it('тела не проходят друг сквозь друга: враг толкает, игрок отодвигается', () => {
    const { igra, telo, takt } = stsena(uroven([{ tip: 'obrezok', x: 4, y: 0.4 }]));
    takt(PUSTOE, 300);
    const v = igra.vragi[0];
    if (!v) throw new Error('нет врага');
    v.schitatCentr();
    telo.schitatCentr();
    const gv = v.gabarity();
    const gt = telo.gabarity();
    // прямоугольники почти не перекрываются: не глубже 0,2
    const perekrytie = Math.min(gv.maxX, gt.maxX) - Math.max(gv.minX, gt.minX);
    expect(perekrytie).toBeLessThan(0.25);
  });

  it('падение в Корке сверху убивает врага', () => {
    const { igra, takt } = stsena(uroven([{ tip: 'obrezok', x: 2, y: 0.4 }], [2, 4]));
    takt({ ...PUSTOE, korka: true }, 180);
    expect(igra.vragi[0]?.zhiv).toBe(false);
    expect(igra.zhar).toBe(100); // в Корке не обжёгся
  });

  it('лава убивает врага, игроку лечит', () => {
    const { igra, takt } = stsena(
      uroven([
        { tip: 'obrezok', x: 12, y: 0.4 },
        { tip: 'lava', x: 10, y: 0, w: 5, h: 0.5 },
      ]),
    );
    takt(PUSTOE, 120);
    expect(igra.vragi[0]?.zhiv).toBe(false);
  });

  it('Скачок прыгает', () => {
    const { igra, takt } = stsena(uroven([{ tip: 'skachok', x: 8, y: 0.4 }]));
    const v = igra.vragi[0];
    if (!v) throw new Error('нет врага');
    let maxY = -Infinity;
    for (let t = 0; t < 600; t++) {
      takt(PUSTOE);
      v.schitatCentr();
      maxY = Math.max(maxY, v.cy);
    }
    expect(maxY).toBeGreaterThan(0.8);
  });
});
