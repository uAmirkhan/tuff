// Формат уровня, валидатор, загрузка 1-1 и состояние прохождения.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { ZHAR } from '../src/game/config/zhar';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { UROVEN_1_1 } from '../src/level/urovni/1-1';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function mirS(u: Uroven, start?: [number, number]) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const [sx, sy] = start ?? u.start;
  const telo = new Telo(mir, sx, sy);
  const igra = new Igra(mir, telo, ur);
  const takt = (nam: Namerenie = PUSTOE, n = 1) => {
    for (let i = 0; i < n; i++) {
      telo.primenit(nam, igra.korkaSredy);
      mir.shag();
      telo.posle(nam);
      igra.takt(nam);
    }
  };
  return { mir, ur, telo, igra, takt };
}

describe('уровень 1-1 и состояние игры', () => {
  it('валидатор пропускает 1-1 и ловит поломки', () => {
    expect(proveritUroven(UROVEN_1_1)).toEqual([]);
    const plohoy: Uroven = {
      ...UROVEN_1_1,
      obekty: UROVEN_1_1.obekty.filter((o) => o.tip !== 'vyhod' && o.tip !== 'gorn'),
    };
    const osh = proveritUroven(plohoy);
    expect(osh.some((o) => o.includes('выходов'))).toBe(true);
    expect(osh.some((o) => o.includes('без горна'))).toBe(true);
  });

  it('тело стоит на полу у старта и катится вправо', () => {
    const { telo, takt } = mirS(UROVEN_1_1);
    takt(PUSTOE, 60);
    expect(telo.gabarity().minY).toBeGreaterThan(-0.01);
    takt({ ...PUSTOE, dx: 1 }, 180);
    expect(telo.cx).toBeGreaterThan(5);
  });

  it('жар-камень собирается один раз, лава лечит', () => {
    const { igra, takt } = mirS(UROVEN_1_1, [6, 0.6]);
    takt(PUSTOE, 10);
    expect(igra.ochki).toBe(ZHAR.ochki.zharkamen);
    takt(PUSTOE, 60);
    expect(igra.ochki).toBe(ZHAR.ochki.zharkamen);
    igra.zhar = 40;
    const s = mirS(UROVEN_1_1, [30, -0.4]); // в лавовой ванне
    s.igra.zhar = 40;
    s.takt(PUSTOE, 120);
    expect(s.igra.zhar).toBeGreaterThan(70);
  });

  it('падение за границу убивает и возрождает с последнего горна', () => {
    const { igra, telo, takt } = mirS(UROVEN_1_1, [17, 1.6]);
    takt(PUSTOE, 10);
    expect(igra.chekpoint[0]).toBe(17);
    telo.vosstanovit(20, -10, 'тест');
    takt(PUSTOE, 5);
    expect(igra.smerti).toBe(1);
    expect(Math.abs(telo.cx - 17)).toBeLessThan(0.5);
  });

  it('выход завершает уровень', () => {
    const { igra, takt } = mirS(UROVEN_1_1, [43, 2.3]);
    takt(PUSTOE, 5);
    expect(igra.gotovo).toBe(true);
  });

  it('плита открывает заслонку, отрезки заслонки исчезают', () => {
    const u: Uroven = {
      versiya: 1,
      id: 't',
      nazvanie: 't',
      mysl: 't',
      start: [2, 1],
      granicy: { minX: 0, minY: -2, maxX: 20, maxY: 10 },
      poligony: [
        {
          tochki: [
            [0, -2],
            [20, -2],
            [20, 0],
            [0, 0],
          ],
        },
      ],
      obekty: [
        { tip: 'plita', id: 'p', x: 2, y: 0, cel: 'z' },
        { tip: 'zaslonka', id: 'z', x: 6, y: 0, w: 0.5, h: 3 },
        { tip: 'vyhod', x: 10, y: 1 },
        { tip: 'serdce', x: 3, y: 1 },
        { tip: 'serdce', x: 4, y: 1 },
        { tip: 'serdce', x: 5, y: 1 },
      ],
    };
    const { mir, ur, takt } = mirS(u);
    const z = ur.sushchnosti.find((s) => s.id === 'z') as { otrezki: number[] };
    expect(mir.oZhiv[z.otrezki[0] as number]).toBe(1);
    takt(PUSTOE, 30); // тело стоит на плите
    expect(mir.oZhiv[z.otrezki[0] as number]).toBe(0);
  });
});
