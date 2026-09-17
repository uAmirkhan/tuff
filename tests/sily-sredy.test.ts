// Плавучесть и потоки: контейнер всплывает, тонущий тонет, вентилятор поднимает Расплав и не поднимает Корку.
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
    id: 'sily',
    nazvanie: 'силы среды',
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

function centr(mir: Mir, s: Sushchnost): [number, number] {
  let sx = 0,
    sy = 0;
  for (const p of s.chasticy) {
    sx += mir.x[p] as number;
    sy += mir.y[p] as number;
  }
  return [sx / s.chasticy.length, sy / s.chasticy.length];
}

function progon(u: Uroven, taktov: number, nam0: Partial<typeof PUSTOE> = {}) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const nam = { ...PUSTOE, ...nam0 };
  for (let t = 0; t < taktov; t++) {
    igra.doShaga();
    telo.primenit(nam, igra.korkaSredy);
    mir.shag();
    telo.posle(nam);
    igra.takt(nam);
  }
  telo.schitatCentr();
  return { telo, igra, mir, ur };
}

describe('силы среды', () => {
  it('контейнер всплывает и держится у поверхности воды', () => {
    // вода от пола до 4, контейнер 1×1 брошен у дна
    const u = komnata(
      [
        { tip: 'voda', id: 'v', x: 4, y: 0, w: 8, h: 4 },
        { tip: 'yashchik', id: 'ya', x: 7.5, y: 0.2, w: 1, h: 1 },
      ],
      [1, 1.2],
    );
    const { mir, ur } = progon(u, 480);
    const s = ur.sushchnosti.find((q) => q.tip === 'yashchik') as Sushchnost;
    const [, cy] = centr(mir, s);
    // центр около поверхности: погружён на две трети при плавучести 1,5
    expect(cy).toBeGreaterThan(3.3);
    expect(cy).toBeLessThan(4.4);
  });

  it('контейнер без плавучести тонет', () => {
    const u = komnata(
      [
        { tip: 'voda', id: 'v', x: 4, y: 0, w: 8, h: 4 },
        { tip: 'yashchik', id: 'ya', x: 7.5, y: 3, w: 1, h: 1, plavuchest: 0 },
      ],
      [1, 1.2],
    );
    const { mir, ur } = progon(u, 300);
    const s = ur.sushchnosti.find((q) => q.tip === 'yashchik') as Sushchnost;
    const [, cy] = centr(mir, s);
    expect(cy).toBeLessThan(0.8);
  });

  it('вентилятор поднимает тело в Расплаве и не поднимает в Корке', () => {
    const u = komnata(
      [{ tip: 'potok', id: 'f', x: 0, y: 0, w: 3, h: 12, silaX: 0, silaY: 14 }],
      [1.5, 1.2],
    );
    const rasplav = progon(u, 180, { rasplav: true });
    const korka = progon(u, 180, { korka: true });
    const obychnoe = progon(u, 180);
    expect(rasplav.telo.cy).toBeGreaterThan(4);
    expect(korka.telo.cy).toBeLessThan(1.5);
    expect(obychnoe.telo.cy).toBeGreaterThan(korka.telo.cy);
  });

  it('боковой поток сносит тело', () => {
    const u = komnata(
      [{ tip: 'potok', id: 'f', x: 0, y: 0, w: 10, h: 3, silaX: 6, silaY: 0 }],
      [1, 1.2],
    );
    const { telo } = progon(u, 180);
    expect(telo.cx).toBeGreaterThan(3);
  });
});
