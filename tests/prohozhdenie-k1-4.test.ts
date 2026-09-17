// Ярус 1, уровень 1-4 «Иней-камеры»: по инею на стене за три секунды до карниза, по потолку над водой
// с перехватом, Скачок на плите открывает дверь, иней-потолок над ямой, выход. Без Вязкости стена не берётся.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_K1_4 } from '../src/level/urovni/k1-4';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

type Shag = { takty: number; nam: Partial<Namerenie> };

function proyti(scenariy: Shag[]) {
  const u = UROVEN_K1_4;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
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
      if (igra.gotovo) break;
    }
    telo.schitatCentr();
    sled.push(`${JSON.stringify(sh.nam)} → x ${telo.cx.toFixed(1)} y ${telo.cy.toFixed(1)}`);
    if (igra.gotovo) break;
  }
  return { igra, telo, sled, mir, ur };
}

describe('прохождение k1-4 «Иней-камеры»', () => {
  it('уровень проходит валидатор', () => {
    expect(proveritUroven(UROVEN_K1_4)).toEqual([]);
  });

  it('бот по плану лезет по инею, идёт по потолку, открывает дверь и доходит до выхода', () => {
    const { igra, sled, ur } = proyti([
      { takty: 200, nam: { dx: 1 } },
      { takty: 170, nam: { dx: 1, dy: 1, vyazkost: true } }, // A: иней-стена за три секунды
      { takty: 800, nam: { dx: 1, dy: 1, vyazkost: true } }, // B, C: потолок над водой, коридор, Скачок
      { takty: 200, nam: { dx: 1 } },
      { takty: 300, nam: { dx: 1, korka: true } },
      { takty: 420, nam: { dx: 1 } },
      { takty: 260, nam: { dx: 1, dy: 1, vyazkost: true } }, // E: иней-потолок
      { takty: 400, nam: { dx: 1 } },
    ]);
    expect(igra.gotovo, sled.join('\n')).toBe(true);
    expect(igra.smerti).toBe(0);
    expect(igra.serdca).toBeGreaterThanOrEqual(1);
    const dver = ur.sushchnosti.find((s) => s.id === 'dver');
    expect(dver?.aktivna).toBe(true);
  });

  it('иней отпускает через три секунды хватки: стена 3 берётся, стоя рядом Корка не надевается', () => {
    const { telo, igra } = proyti([
      { takty: 200, nam: { dx: 1 } },
      { takty: 60, nam: {} }, // стоим у стены без Вязкости: счётчик не копится
      { takty: 170, nam: { dx: 1, dy: 1, vyazkost: true } },
    ]);
    expect(telo.cy).toBeGreaterThan(2.8); // дошёл до карниза или потолка
    expect(igra.korkaSredy).toBe(false);
  });

  it('без Вязкости иней-стена не берётся', () => {
    const { telo, igra } = proyti([{ takty: 700, nam: { dx: 1, dy: 1 } }]);
    expect(igra.gotovo).toBe(false);
    expect(telo.cx).toBeLessThan(9);
  });
});
