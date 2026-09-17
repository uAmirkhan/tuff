// Уборщик: патрулирует, увидев героя толкает его без урона, замыкает в воде, давится Коркой сверху.
// Обрезок застывает в воде через две секунды и перестаёт жечь.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function komnata(obekty: Uroven['obekty'], start: [number, number]): Uroven {
  return {
    versiya: 1,
    id: 'dron',
    nazvanie: 'дрон',
    mysl: 'тест',
    start,
    granicy: { minX: -10, minY: -5, maxX: 30, maxY: 20 },
    poligony: [
      {
        tochki: [
          [-10, -5],
          [30, -5],
          [30, 0],
          [-10, 0],
        ],
      },
      {
        tochki: [
          [-10, 0],
          [-9, 0],
          [-9, 20],
          [-10, 20],
        ],
      },
      {
        tochki: [
          [29, 0],
          [30, 0],
          [30, 20],
          [29, 20],
        ],
      },
    ],
    obekty: [
      { tip: 'vyhod', x: 28, y: 6 },
      { tip: 'serdce', x: 25, y: 6 },
      { tip: 'serdce', x: 26, y: 6 },
      { tip: 'serdce', x: 27, y: 6 },
      ...obekty,
    ],
  };
}

function progon(u: Uroven, taktov: number, nam0: Partial<typeof PUSTOE> = {}) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const nam = { ...PUSTOE, ...nam0 };
  let uron = 0;
  for (let t = 0; t < taktov; t++) {
    igra.doShaga();
    telo.primenit(nam, igra.korkaSredy);
    mir.shag();
    telo.posle(nam);
    igra.takt(nam);
    for (const e of igra.sobytiya) if (e.tip === 'uronOtVraga') uron++;
  }
  telo.schitatCentr();
  return { telo, igra, mir, ur, uron };
}

describe('дрон Уборщик', () => {
  it('патрулирует и разворачивается у стены', () => {
    const u = komnata([{ tip: 'uborshchik', id: 'd', x: 20, y: 0.3 }], [-5, 1.2]);
    const { igra } = progon(u, 900);
    const v = igra.vragi[0] as (typeof igra.vragi)[number];
    v.schitatCentr();
    expect(v.zhiv).toBe(true);
    // за 15 секунд доехал до стены и вернулся: не стоит у стены и не на месте старта
    expect(v.cx).toBeLessThan(28.5);
    expect(Math.abs(v.cx - 20)).toBeGreaterThan(0.5);
  });

  it('толкает героя без урона', () => {
    const u = komnata([{ tip: 'uborshchik', id: 'd', x: 4, y: 0.3 }], [8, 1.2]);
    const { telo, uron, igra } = progon(u, 600);
    expect(uron).toBe(0);
    expect(igra.zhar).toBeGreaterThan(99);
    // героя сдвинуло вправо от места старта
    expect(telo.cx).toBeGreaterThan(9);
  });

  it('замыкает в воде и становится неподвижным', () => {
    const u = komnata(
      [
        { tip: 'uborshchik', id: 'd', x: 4, y: 0.3 },
        { tip: 'voda', id: 'v', x: 6, y: 0, w: 3, h: 1 },
      ],
      [12, 1.2],
    );
    const { igra } = progon(u, 900);
    const v = igra.vragi[0] as (typeof igra.vragi)[number];
    v.schitatCentr();
    expect(v.vyklyuchen).toBe(true);
    expect(v.zhiv).toBe(true);
    expect(v.cx).toBeLessThan(9.5); // застрял в воде, к герою не доехал
  });
});

describe('Обрезок в воде', () => {
  it('застывает через две секунды и больше не жжёт', () => {
    const u = komnata(
      [
        { tip: 'obrezok', id: 'o', x: 4, y: 0.3 },
        { tip: 'voda', id: 'v', x: 2, y: 0, w: 10, h: 1 },
      ],
      [13, 1.2],
    );
    const { igra, uron } = progon(u, 600);
    const v = igra.vragi[0] as (typeof igra.vragi)[number];
    expect(v.vyklyuchen).toBe(true);
    expect(v.zhiv).toBe(true);
    // урон был только до застывания (не больше двух секунд контакта)
    expect(uron).toBeLessThan(150);
  });
});
