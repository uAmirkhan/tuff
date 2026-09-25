// Ярус 1, уровень 1-5 «Криоархив»: мост держит тело и рвётся под Коркой, плита с фиксацией и тяжёлая плита
// открывают двери, закрытая дверь не проходится насквозь, иней-потолок и иней-стена ведут к узлу теплотрассы,
// узел зажигается тремя секундами Вязкости.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_K1_5 } from '../src/level/urovni/k1-5';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import { PLANY } from './plany';

type Shag = { takty: number; nam: Partial<Namerenie> };

function proyti(scenariy: Shag[]) {
  const u = UROVEN_K1_5;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const sled: string[] = [];
  let porvano = 0;
  for (const sh of scenariy) {
    const nam: Namerenie = { ...PUSTOE, ...sh.nam };
    for (let t = 0; t < sh.takty; t++) {
      igra.doShaga();
      telo.primenit(nam, igra.korkaSredy);
      mir.shag();
      telo.posle(nam);
      igra.takt(nam);
      for (const e of igra.sobytiya) if (e.tip === 'cepPorvana') porvano++;
      if (igra.gotovo) break;
    }
    telo.schitatCentr();
    sled.push(`${JSON.stringify(sh.nam)} → x ${telo.cx.toFixed(1)} y ${telo.cy.toFixed(1)}`);
    if (igra.gotovo) break;
  }
  return { igra, telo, sled, mir, ur, porvano };
}

describe('прохождение k1-5 «Криоархив»', () => {
  it('уровень проходит валидатор', () => {
    expect(proveritUroven(UROVEN_K1_5)).toEqual([]);
  });

  it('бот по плану проходит мосты, открывает двери, зажигает узел и доходит до выхода', () => {
    const { igra, sled, ur, porvano } = proyti(PLANY['k1-5'] as Shag[]);
    expect(igra.gotovo, sled.join('\n')).toBe(true);
    expect(igra.smerti).toBe(0);
    expect(porvano).toBe(0); // обычное тело мост не рвёт
    const d1 = ur.sushchnosti.find((s) => s.id === 'dver-1');
    const d2 = ur.sushchnosti.find((s) => s.id === 'dver-2');
    const uzel = ur.sushchnosti.find((s) => s.tip === 'uzel');
    expect(d1?.aktivna).toBe(true);
    expect(d2?.aktivna).toBe(true);
    expect(uzel?.aktivna).toBe(true);
    expect(igra.serdca).toBeGreaterThanOrEqual(2);
  });

  it('мост рвётся под Коркой, закрытая дверь держит разогнавшееся тело', () => {
    const { porvano, telo, ur } = proyti([
      { takty: 60, nam: { dx: 1 } },
      { takty: 200, nam: { dx: 1, korka: true } }, // Корка на мосту: рвётся
    ]);
    expect(porvano).toBeGreaterThan(0);
    // отдельный прогон: без Корки до второй двери, она закрыта и не проходится
    const vtoroy = proyti([{ takty: 420, nam: { dx: 1 } }]);
    const d2 = vtoroy.ur.sushchnosti.find((s) => s.id === 'dver-2');
    expect(d2?.aktivna).toBe(false);
    expect(vtoroy.telo.cx).toBeLessThan(30.4);
    void telo;
    void ur;
  });
});
