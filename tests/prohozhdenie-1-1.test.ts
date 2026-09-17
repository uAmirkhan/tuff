// Уровень 1-1 проходим по сценарию ввода: катить, лезть по стене с Вязкостью, ползти по площадке,
// упасть в лаву, выбраться по склону, дойти до выхода. Записанный ввод по тактам.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_1_1 } from '../src/level/urovni/1-1';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

type Shag = { takty: number; nam: Partial<Namerenie> };

function proyti(scenariy: Shag[]) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, UROVEN_1_1);
  const telo = new Telo(mir, UROVEN_1_1.start[0], UROVEN_1_1.start[1]);
  const igra = new Igra(mir, telo, ur);
  const sled: string[] = [];
  for (const sh of scenariy) {
    const nam: Namerenie = { ...PUSTOE, ...sh.nam };
    for (let t = 0; t < sh.takty; t++) {
      telo.primenit(nam, igra.korkaSredy);
      mir.shag();
      telo.posle(nam);
      igra.takt(nam);
      if (igra.gotovo) break;
    }
    telo.schitatCentr();
    sled.push(`${JSON.stringify(sh.nam)} → x ${telo.cx.toFixed(1)} y ${telo.cy.toFixed(1)}`);
    if (igra.gotovo) break;
  }
  return { igra, telo, sled };
}

describe('прохождение 1-1', () => {
  it('по сценарию ввода тело доходит до выхода', () => {
    const { igra, telo, sled } = proyti([
      { takty: 300, nam: { dx: 1 } }, // A→B→C: катить до стены на x=20
      { takty: 420, nam: { dx: 1, dy: 1, vyazkost: true } }, // D: лезть по стене
      { takty: 240, nam: { dx: 1 } }, // площадка наверху до обрыва
      { takty: 240, nam: { dx: 1 } }, // E: падение в ванну, лава лечит, катить к склону
      { takty: 600, nam: { dx: 1 } }, // склон и пол выхода
    ]);
    expect(igra.gotovo, sled.join('\n')).toBe(true);
    expect(igra.smerti).toBe(0);
    expect(telo.cx).toBeGreaterThan(42);
  });
});
