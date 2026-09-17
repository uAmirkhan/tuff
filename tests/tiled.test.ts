// Обмен с Tiled обратим: уровень → карта → уровень совпадает с исходным по всем полям.
import { describe, expect, it } from 'vitest';
import { UROVNI } from '../src/level/spisok';
import { izTiled, vTiled } from '../src/level/tiled';
import { proveritUroven } from '../src/level/validator';

// числа округляются до тысячных: в исходниках уровней бывают хвосты вроде 5.800000000000001
function norm(v: unknown): unknown {
  return JSON.parse(
    JSON.stringify(v),
    (_k, x) => (typeof x === 'number' ? Math.round(x * 1000) / 1000 + 0 : x), // +0 убирает -0
  );
}

describe('обмен с Tiled', () => {
  for (const u of UROVNI) {
    it(`${u.id}: туда и обратно без потерь`, () => {
      const karta = vTiled(u);
      const nazad = izTiled(karta);
      expect(norm(nazad)).toEqual(norm(u));
      expect(proveritUroven(nazad)).toEqual([]);
    });
  }
  it('карта из Tiled без свойств границ берёт их из размера', () => {
    const karta = vTiled(UROVNI[0] as (typeof UROVNI)[number]);
    karta.properties = (karta.properties ?? []).filter((p) => !/^m(in|ax)[XY]$/.test(p.name));
    const u = izTiled(karta);
    expect(u.granicy.minX).toBe(0);
    expect(u.granicy.maxX).toBe(karta.width);
  });
});
