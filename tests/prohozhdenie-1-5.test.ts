// Уровень 1-5: прочный мост, слабый мост рвётся под Коркой, плита под Корку, выход.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_1_5 } from '../src/level/urovni/1-5';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

type Shag = { takty: number; nam: Partial<Namerenie>; do?: (t: Telo, i: Igra) => boolean };

function proyti(scenariy: Shag[]) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, UROVEN_1_5);
  const telo = new Telo(mir, UROVEN_1_5.start[0], UROVEN_1_5.start[1]);
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
  return { igra, telo, sled, ur };
}

describe('уровень 1-5', () => {
  it('валидатор', () => {
    expect(proveritUroven(UROVEN_1_5)).toEqual([]);
  });

  it('прямой путь: по мостам, Коркой на плиту, к выходу', () => {
    const { igra, sled } = proyti([
      { takty: 900, nam: { dx: 1 }, do: (t) => t.cx > 16 }, // мост 1 до опоры
      { takty: 900, nam: { dx: 1 }, do: (t) => t.cx > 26 }, // мост 2 без Корки
      { takty: 600, nam: { dx: 1, korka: true }, do: (t) => t.cx > 34.2 }, // Коркой по площадке до плиты
      { takty: 120, nam: { korka: true } }, // стоять на плите: заслонка открывается
      { takty: 900, nam: { dx: 1 } }, // к выходу
    ]);
    expect(igra.gotovo, sled.join('\n')).toBe(true);
    expect(igra.smerti, sled.join('\n')).toBe(0);
  });

  it('слабый мост рвётся под Коркой, тело падает в яму 2 и выходит по склону', () => {
    const { igra, sled, ur } = proyti([
      { takty: 900, nam: { dx: 1 }, do: (t) => t.cx > 16 },
      { takty: 300, nam: { dx: 1 }, do: (t) => t.cx > 21 }, // на середину моста 2
      { takty: 1200, nam: { korka: true }, do: (t) => t.cy < 1.5 }, // рвётся не сразу: цепь ползёт, потом лопается
      { takty: 900, nam: { dx: 1 }, do: (t) => t.cx > 26 }, // по склону на правую площадку
    ]);
    const most2 = ur.sushchnosti.find((s) => s.id === 'most-2');
    const porvano = most2 ? most2.svyazi.some((sv) => !igra.mir.sZhiva[sv]) : false;
    expect(porvano, sled.join('\n')).toBe(true);
    expect(igra.telo.cx, sled.join('\n')).toBeGreaterThan(26);
  });
});
