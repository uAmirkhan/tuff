// Коромысло на оси и расписание зон.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { type Sushchnost, zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function komnata(obekty: Uroven['obekty'], start: [number, number]): Uroven {
  return {
    versiya: 1,
    id: 'sharnir',
    nazvanie: 'шарнир',
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

function progon(u: Uroven, taktov: number, nam0: Partial<typeof PUSTOE> = {}) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const nam = { ...PUSTOE, ...nam0 };
  const aktivnost: boolean[] = [];
  for (let t = 0; t < taktov; t++) {
    igra.doShaga();
    telo.primenit(nam, igra.korkaSredy);
    mir.shag();
    telo.posle(nam);
    igra.takt(nam);
    const z = ur.sushchnosti.find((s) => s.tip === 'potok');
    if (z) aktivnost.push(z.aktivna);
  }
  telo.schitatCentr();
  return { telo, igra, mir, ur, aktivnost };
}

describe('шарнир и расписание', () => {
  it('коромысло держится на оси и наклоняется под контейнером', () => {
    // балка 4×0.3 на оси на высоте 2; контейнер падает на левый конец
    const u = komnata(
      [
        { tip: 'koromyslo', id: 'k', x: 10, y: 2, w: 4, h: 0.3 },
        { tip: 'yashchik', id: 'ya', x: 8.2, y: 3, w: 0.8, h: 0.8 },
      ],
      [1, 1.2],
    );
    const { mir, ur } = progon(u, 240);
    const k = ur.sushchnosti.find((s) => s.tip === 'koromyslo') as Sushchnost;
    const os = k.zvenya[0] as number;
    // ось на месте
    expect(Math.abs((mir.x[os] as number) - 10)).toBeLessThan(0.05);
    expect(Math.abs((mir.y[os] as number) - 2)).toBeLessThan(0.05);
    // левый конец ниже правого
    const levyy = mir.y[k.chasticy[0] as number] as number;
    const pravyy = mir.y[k.chasticy[1] as number] as number;
    expect(pravyy - levyy).toBeGreaterThan(0.4);
    // длина балки сохранилась
    const dl = Math.hypot(
      (mir.x[k.chasticy[1] as number] as number) - (mir.x[k.chasticy[0] as number] as number),
      pravyy - levyy,
    );
    expect(Math.abs(dl - 4)).toBeLessThan(0.1);
  });

  it('поток по расписанию включён первую половину периода', () => {
    const u = komnata(
      [{ tip: 'potok', id: 'f', x: 20, y: 0, w: 2, h: 5, silaX: 0, silaY: 10, period: 2 }],
      [1, 1.2],
    );
    const { aktivnost } = progon(u, 240);
    expect(aktivnost[30]).toBe(true); // 0,5 с
    expect(aktivnost[90]).toBe(false); // 1,5 с
    expect(aktivnost[150]).toBe(true); // 2,5 с
  });

  it('зона без расписания остаётся включённой', () => {
    const u = komnata(
      [{ tip: 'potok', id: 'f', x: 20, y: 0, w: 2, h: 5, silaX: 0, silaY: 10 }],
      [1, 1.2],
    );
    const { aktivnost } = progon(u, 200);
    expect(aktivnost.every((a) => a)).toBe(true);
  });
});
