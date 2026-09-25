// Ярус 1, уровень 1-3 «Сортировка»: сход из иней-камеры в Корке ломает хрупкий пол, три слоя шахты
// ломаются Коркой с уступа, тоннель и колодец Вязкостью ведут к выходу. Без Корки шахта не берётся.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_K1_3 } from '../src/level/urovni/k1-3';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import { PLANY } from './plany';

type Shag = { takty: number; nam: Partial<Namerenie> };

function proyti(scenariy: Shag[]) {
  const u = UROVEN_K1_3;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const sled: string[] = [];
  let slomano = 0;
  for (const sh of scenariy) {
    const nam: Namerenie = { ...PUSTOE, ...sh.nam };
    for (let t = 0; t < sh.takty; t++) {
      igra.doShaga();
      telo.primenit(nam, igra.korkaSredy);
      mir.shag();
      telo.posle(nam);
      igra.takt(nam);
      for (const e of igra.sobytiya) if (e.tip === 'slomano') slomano++;
      if (igra.gotovo) break;
    }
    telo.schitatCentr();
    sled.push(`${JSON.stringify(sh.nam)} → x ${telo.cx.toFixed(1)} y ${telo.cy.toFixed(1)}`);
    if (igra.gotovo) break;
  }
  return { igra, telo, sled, mir, ur, slomano };
}

describe('прохождение k1-3 «Сортировка»', () => {
  it('уровень проходит валидатор', () => {
    expect(proveritUroven(UROVEN_K1_3)).toEqual([]);
  });

  it('бот по плану ломает хрупкий пол и три слоя шахты и доходит до выхода', () => {
    const { igra, sled, slomano, mir } = proyti(PLANY['k1-3'] as Shag[]);
    expect(igra.gotovo, sled.join('\n')).toBe(true);
    expect(igra.smerti).toBe(0);
    expect(slomano).toBe(4); // хрупкий пол под камерой и три слоя шахты
    expect(mir.zhurnal.length).toBe(0);
  });

  it('без Корки слои шахты не ломаются и выход недостижим', () => {
    const { igra, slomano, telo } = proyti([
      { takty: 420, nam: { dx: 1 } },
      { takty: 100, nam: { dx: 1 } },
      { takty: 900, nam: { dx: 1 } },
    ]);
    expect(igra.gotovo).toBe(false);
    expect(slomano).toBeLessThanOrEqual(1); // максимум хрупкий пол под камерой (иней даёт Корку сам)
    expect(telo.cx).toBeLessThan(44);
  });
});
