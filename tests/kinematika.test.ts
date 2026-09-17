// Кинематические отрезки: платформа везёт тело, конвейер тянет, поршень поднимает.
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
    id: 'kin',
    nazvanie: 'кинематика',
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

function progon(u: Uroven, taktov: number, dx = 0) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const nam = { ...PUSTOE, dx };
  const sled: [number, number][] = [];
  for (let t = 0; t < taktov; t++) {
    igra.doShaga();
    telo.primenit(nam, igra.korkaSredy);
    mir.shag();
    telo.posle(nam);
    igra.takt(nam);
    if (t % 60 === 59) {
      telo.schitatCentr();
      sled.push([telo.cx, telo.cy]);
    }
  }
  telo.schitatCentr();
  return { telo, igra, mir, sled, ur };
}

describe('кинематика', () => {
  it('поршень с ходом по x везёт лежащее на нём тело', () => {
    // платформа 3×0.5 на высоте 2, ходит на 6 вправо за 8 секунд без пауз
    const u = komnata(
      [{ tip: 'porshen', id: 'p', x: 0, y: 2, w: 3, h: 0.5, hodX: 6, hodY: 0, period: 8 }],
      [1.5, 3.2],
    );
    const { telo, sled } = progon(u, 240); // 4 секунды: платформа дошла до правого края
    // платформа за 4 с прошла 6 единиц, тело едет вместе с ней, а не остаётся на месте
    expect(telo.cx, `след ${JSON.stringify(sled)}`).toBeGreaterThan(5);
    expect(telo.cy).toBeGreaterThan(2.4); // всё ещё на платформе, не на полу
  });

  it('поршень с ходом по y поднимает тело', () => {
    const u = komnata(
      [{ tip: 'porshen', id: 'p', x: 0, y: 0.5, w: 3, h: 0.5, hodX: 0, hodY: 5, period: 8 }],
      [1.5, 1.6],
    );
    const { telo } = progon(u, 240);
    expect(telo.cy).toBeGreaterThan(4);
  });

  it('конвейер тянет тело вдоль верхней грани', () => {
    const u = komnata(
      [{ tip: 'konveyer', id: 'k', x: 0, y: 0, w: 12, h: 0.5, skorost: 2 }],
      [1, 1.2],
    );
    const { telo } = progon(u, 180);
    // 3 секунды при 2 ед/с, с учётом раскачки хотя бы половина пути
    expect(telo.cx).toBeGreaterThan(3.5);
  });

  it('против конвейера тело едет назад, если катить в обратную сторону', () => {
    const u = komnata(
      [{ tip: 'konveyer', id: 'k', x: 0, y: 0, w: 12, h: 0.5, skorost: 1 }],
      [6, 1.2],
    );
    const { telo } = progon(u, 180, -1);
    expect(telo.cx).toBeLessThan(6);
  });

  it('поршень с паузами стоит на концах', () => {
    const u = komnata(
      [
        {
          tip: 'porshen',
          id: 'p',
          x: 0,
          y: 2,
          w: 3,
          h: 0.5,
          hodX: 4,
          hodY: 0,
          period: 8,
          pauza: 1,
        },
      ],
      [1.5, 3.2],
    );
    const { ur, mir } = progon(u, 30); // 0,5 с: ещё пауза
    const s = ur.sushchnosti.find((q) => q.tip === 'porshen');
    expect(s).toBeDefined();
    expect(mir.oX1[(s as { otrezki: number[] }).otrezki[0] as number]).toBeCloseTo(0, 5);
  });
});
