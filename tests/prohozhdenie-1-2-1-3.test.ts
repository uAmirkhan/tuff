// Уровни 1-2 и 1-3 проходимы по сценарию ввода и проходят валидатор.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { UROVNI } from '../src/level/spisok';
import { UROVEN_1_2 } from '../src/level/urovni/1-2';
import { UROVEN_1_3 } from '../src/level/urovni/1-3';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

type Shag = { takty: number; nam: Partial<Namerenie>; do?: (t: Telo, i: Igra) => boolean };

function proyti(u: Uroven, scenariy: Shag[]) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const sled: string[] = [];
  for (const sh of scenariy) {
    const nam: Namerenie = { ...PUSTOE, ...sh.nam };
    for (let t = 0; t < sh.takty; t++) {
      telo.primenit(nam, igra.korkaSredy);
      mir.shag();
      telo.posle(nam);
      igra.takt(nam);
      telo.schitatCentr();
      if (igra.gotovo || sh.do?.(telo, igra)) break;
    }
    sled.push(
      `${JSON.stringify(sh.nam)} → x ${telo.cx.toFixed(1)} y ${telo.cy.toFixed(1)} смерти ${igra.smerti}`,
    );
    if (igra.gotovo) break;
  }
  return { igra, telo, sled, ur };
}

describe('уровни 1-2 и 1-3', () => {
  it('все уровни списка проходят валидатор', () => {
    for (const u of UROVNI) expect(proveritUroven(u), u.id).toEqual([]);
  });

  it('1-2: Корка ломает три слоя, лава внизу, выход справа', () => {
    const { igra, sled, ur } = proyti(UROVEN_1_2, [
      { takty: 300, nam: { dx: 1 }, do: (t) => t.cx > 10.5 }, // до шахты
      { takty: 600, nam: { korka: true }, do: (t) => t.cy < -0.3 }, // падать Коркой сквозь слои до ванны
      { takty: 900, nam: { dx: 1 } }, // из ванны вправо к выходу
    ]);
    expect(ur.slomany.filter(Boolean).length, sled.join('\n')).toBeGreaterThanOrEqual(3);
    expect(igra.gotovo, sled.join('\n')).toBe(true);
    expect(igra.smerti).toBe(0);
  });

  it('1-2: без Корки первый слой не ломается', () => {
    const { ur, sled } = proyti(UROVEN_1_2, [
      { takty: 300, nam: { dx: 1 }, do: (t) => t.cx > 10.5 },
      { takty: 300, nam: {} },
    ]);
    expect(ur.slomany.filter(Boolean).length, sled.join('\n')).toBe(0);
  });

  it('1-3: Расплав проводит через две трубы к выходу', () => {
    const { igra, sled } = proyti(UROVEN_1_3, [
      { takty: 300, nam: { dx: 1 }, do: (t) => t.cx > 9 },
      { takty: 900, nam: { dx: 1, dy: -1, rasplav: true }, do: (t) => t.cx > 14.5 }, // первая труба
      { takty: 300, nam: { dx: 1 }, do: (t) => t.cy < -1.5 && t.cx > 16 }, // падение в шахту
      { takty: 900, nam: { dx: 1, dy: -1, rasplav: true }, do: (t) => t.cx > 23.5 }, // вторая труба
      { takty: 900, nam: { dx: 1 } },
    ]);
    expect(igra.gotovo, sled.join('\n')).toBe(true);
    expect(igra.smerti).toBe(0);
  });

  it('1-3: без Расплава в первую трубу не пройти', () => {
    const { telo, sled } = proyti(UROVEN_1_3, [
      { takty: 300, nam: { dx: 1 }, do: (t) => t.cx > 9 },
      { takty: 600, nam: { dx: 1, dy: -1 } },
    ]);
    expect(telo.cx, sled.join('\n')).toBeLessThan(14);
  });
});
