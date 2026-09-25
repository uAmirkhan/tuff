// Ярус 1, уровень 1-1 «Зал баков»: бот по плану проходит без смертей, берёт камень в нише,
// падает в поддон (гэг безопасен), лезет по стене Вязкостью, лечится в ванне, доходит до выхода.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_K1_1 } from '../src/level/urovni/k1-1';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import { PLANY } from './plany';

type Shag = { takty: number; nam: Partial<Namerenie> };

function proyti(scenariy: Shag[]) {
  const u = UROVEN_K1_1;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const sled: string[] = [];
  let vVode = false;
  for (const sh of scenariy) {
    const nam: Namerenie = { ...PUSTOE, ...sh.nam };
    for (let t = 0; t < sh.takty; t++) {
      igra.doShaga();
      telo.primenit(nam, igra.korkaSredy);
      mir.shag();
      telo.posle(nam);
      igra.takt(nam);
      if (igra.korkaSredy) vVode = true;
      if (igra.gotovo) break;
    }
    telo.schitatCentr();
    sled.push(`${JSON.stringify(sh.nam)} → x ${telo.cx.toFixed(1)} y ${telo.cy.toFixed(1)}`);
    if (igra.gotovo) break;
  }
  return { igra, telo, sled, mir, vVode };
}

describe('прохождение k1-1 «Зал баков»', () => {
  it('уровень проходит валидатор', () => {
    expect(proveritUroven(UROVEN_K1_1)).toEqual([]);
  });

  it('бот по плану доходит до выхода без смертей', () => {
    const { igra, telo, sled, mir, vVode } = proyti(PLANY['k1-1'] as Shag[]);
    expect(igra.gotovo, sled.join('\n')).toBe(true);
    expect(igra.smerti).toBe(0);
    expect(igra.serdca).toBeGreaterThanOrEqual(1); // камень в нише
    expect(vVode).toBe(true); // гэг: поддон промывки пройден через воду
    expect(mir.zhurnal.length).toBe(0); // сторожа не срабатывали
    expect(telo.cx).toBeGreaterThan(42);
  });

  it('без Вязкости стена крепежа не берётся', () => {
    const { igra, telo } = proyti([
      { takty: 90, nam: { dx: -1 } },
      { takty: 420, nam: { dx: 1 } },
      { takty: 600, nam: { dx: 1, dy: 1 } },
    ]);
    expect(igra.gotovo).toBe(false);
    expect(telo.cx).toBeLessThan(27);
  });
});
