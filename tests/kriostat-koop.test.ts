// Криостат в кооперативе. Бак целится в героя, но датчик безопасности обязан видеть обоих:
// иначе в кооперативе он молча проезжает по напарнику, а этот датчик и делался ради честности.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import type { Kriostat } from '../src/game/kriostat';
import { PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_K1_7 } from '../src/level/urovni/k1-7';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const BAK_X0 = 24; // из уровня: бак стоит справа и едет влево по рельсу

function scena(ax: number, bx: number | null) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, UROVEN_K1_7);
  const a = new Telo(mir, ax, 1.2);
  const b = bx === null ? null : new Telo(mir, bx, 1.2);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = () => {
    igra.doShaga();
    a.primenit(PUSTOE, igra.korkaSredy);
    b?.primenit(PUSTOE, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(PUSTOE);
    b?.posle(PUSTOE);
    igra.takt(PUSTOE, b ? [PUSTOE] : []);
    a.schitatCentr();
    b?.schitatCentr();
  };
  return { mir, ur, a, b, igra, shag, bak: () => (igra.boss as Kriostat).bak };
}

describe('Криостат в кооперативе', () => {
  // Замер: соло бак проходит рельс до 4,87 за 900 тактов. С напарником на пути он встаёт
  // ровно в 0,83 правее него. Порог 8 отделяет «доехал» от «встал», не задевая обоих.
  it('без напарника бак доезжает до героя', () => {
    const s = scena(4, null);
    let minX = BAK_X0;
    for (let t = 0; t < 900; t++) {
      s.shag();
      if (s.bak().x < minX) minX = s.bak().x;
    }
    expect(minX).toBeLessThan(8);
  });

  it('напарник на пути останавливает бак и остаётся на месте', () => {
    // герой далеко слева, напарник стоит на полу между баком и героем
    const s = scena(4, 16);
    let minX = BAK_X0;
    for (let t = 0; t < 900; t++) {
      s.shag();
      if (s.bak().x < minX) minX = s.bak().x;
    }
    const b = s.b as Telo;
    // бак встал перед напарником, а не протолкнул его впереди себя через весь рельс
    expect(minX).toBeGreaterThan(15.5);
    expect(b.cx).toBeGreaterThan(15);
    expect(s.igra.smerti).toBe(0);
  });
});
