// Ярус 1, уровень 1-6 «Промывка яруса»: вода поднимается по регламенту, тело идёт зигзагом по полкам
// и лезет Вязкостью по стене сквозь дыру у края каждой полки; камень ветки за завесой у пола берётся
// со старта; стоящее тело вода догоняет, после смерти вода откатывается ниже чекпоинта.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_K1_6 } from '../src/level/urovni/k1-6';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import { POLOK, type Rezhim16, SHAG, zigzagK16 } from './povadki';

type Rezhim = Rezhim16;

/** Прогон уровня вынесенной повадкой-зигзагом (tests/povadki.ts). */
function proyti(rezhim: Rezhim, maksTaktov: number) {
  const u = UROVEN_K1_6;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const voda = ur.sushchnosti.find((s) => s.id === 'promyvka');
  if (!voda) throw new Error('нет воды promyvka');
  const vedyot = zigzagK16(rezhim);
  let vodaPosleSmerti = Number.NaN;
  let t = 0;
  for (; t < maksTaktov; t++) {
    telo.schitatCentr();
    const nam = vedyot(telo, igra);
    igra.doShaga();
    telo.primenit(nam, igra.korkaSredy);
    mir.shag();
    telo.posle(nam);
    igra.takt(nam);
    for (const e of igra.sobytiya)
      if (e.tip === 'smert' && Number.isNaN(vodaPosleSmerti)) vodaPosleSmerti = voda.y + voda.h;
    if (igra.gotovo) break;
  }
  telo.schitatCentr();
  return { igra, telo, voda, t, vodaPosleSmerti };
}

describe('прохождение k1-6 «Промывка яруса»', () => {
  it('уровень проходит валидатор', () => {
    expect(proveritUroven(UROVEN_K1_6)).toEqual([]);
  });

  it('бот-зигзаг Вязкостью по стенам доходит до выхода раньше воды и без смертей', () => {
    const { igra, telo, voda, t } = proyti('bystro', 60 * 70);
    expect(igra.gotovo, `t${t} тело в ${telo.cx.toFixed(1)},${telo.cy.toFixed(1)}`).toBe(true);
    expect(igra.smerti).toBe(0);
    expect(t).toBeLessThan(60 * 60);
    // вода поднялась, но не дошла до последней полки
    expect(voda.y + voda.h).toBeGreaterThan(5);
    expect(voda.y + voda.h).toBeLessThan(SHAG * POLOK);
  });

  it('ветка: камень за завесой у пола берётся со старта, уровень проходится', () => {
    const { igra, t } = proyti('vetka', 60 * 80);
    expect(igra.serdca).toBe(1);
    expect(igra.gotovo, `t${t}`).toBe(true);
  });

  it('стоящее тело вода догоняет, после смерти вода откатывается ниже пола', () => {
    const { igra, vodaPosleSmerti } = proyti('stoyat', 60 * 40);
    expect(igra.smerti).toBeGreaterThanOrEqual(1);
    expect(vodaPosleSmerti).toBeLessThan(0);
  });
});
