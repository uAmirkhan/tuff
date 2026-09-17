// Уровень 1-4: проходим по потолку над лавой с Вязкостью, враги на площадках.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_1_4 } from '../src/level/urovni/1-4';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

type Shag = { takty: number; nam: Partial<Namerenie>; do?: (t: Telo, i: Igra) => boolean };

function proyti(scenariy: Shag[]) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, UROVEN_1_4);
  const telo = new Telo(mir, UROVEN_1_4.start[0], UROVEN_1_4.start[1]);
  const igra = new Igra(mir, telo, ur);
  const sled: string[] = [];
  for (const sh of scenariy) {
    const nam: Namerenie = { ...PUSTOE, ...sh.nam };
    for (let t = 0; t < sh.takty; t++) {
      igra.doShaga();
      telo.primenit(nam, igra.korkaSredy);
      mir.shag();
      telo.posle(nam);
      igra.takt(nam);
      telo.schitatCentr();
      if (igra.gotovo || sh.do?.(telo, igra)) break;
    }
    sled.push(
      `${JSON.stringify(sh.nam)} → x ${telo.cx.toFixed(1)} y ${telo.cy.toFixed(1)} жар ${igra.zhar.toFixed(0)} смерти ${igra.smerti}`,
    );
    if (igra.gotovo) break;
  }
  return { igra, telo, sled };
}

describe('уровень 1-4', () => {
  it('валидатор', () => {
    expect(proveritUroven(UROVEN_1_4)).toEqual([]);
  });

  it('по потолку над лавой до выхода, враги давятся Коркой', () => {
    const { igra, sled } = proyti([
      { takty: 200, nam: { dx: 1, korka: true }, do: (t) => t.cx > 9 }, // к ступени, Корка давит Шлакожука
      { takty: 400, nam: { dx: 1, dy: 1, vyazkost: true }, do: (t) => t.cy > 2.3 && t.cx > 11 }, // на ступень и к полке
      { takty: 1500, nam: { dx: 1, dy: 1, vyazkost: true }, do: (t) => t.cx > 30.5 }, // ползти по полке снизу над ямой
      { takty: 300, nam: {}, do: (t) => t.cy < 1 }, // спрыгнуть на вторую площадку
      { takty: 900, nam: { dx: 1, korka: true } }, // Коркой сквозь врагов к выходу
    ]);
    expect(igra.gotovo, sled.join('\n')).toBe(true);
    expect(igra.smerti, sled.join('\n')).toBe(0);
  });
});
