// Ярус 1, уровень 1-2 «Промывочная»: бот проходит щель Расплавом, открывает крыло плитой под водой,
// берёт камень в боковом канале, давит Обрезка, проходит трубу с форсункой и доходит до выхода.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_K1_2 } from '../src/level/urovni/k1-2';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

type Shag = { takty: number; nam: Partial<Namerenie> };

function proyti(scenariy: Shag[]) {
  const u = UROVEN_K1_2;
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

describe('прохождение k1-2 «Промывочная»', () => {
  it('уровень проходит валидатор', () => {
    expect(proveritUroven(UROVEN_K1_2)).toEqual([]);
  });

  it('бот по плану доходит до выхода, открывает крыло и берёт два камня', () => {
    const { igra, sled, ur } = proyti([
      { takty: 240, nam: { dx: 1 } },
      { takty: 240, nam: { dx: 1, rasplav: true } }, // A: щель
      { takty: 200, nam: { dx: 1 } }, // B, C: стекло над ямой, вода, плита
      { takty: 160, nam: { dx: 1, rasplav: true } }, // боковой канал
      { takty: 200, nam: { dx: -1, rasplav: true } },
      { takty: 120, nam: { dx: -1 } },
      { takty: 260, nam: { dx: 1 } }, // уголёк, горн
      { takty: 300, nam: { dx: 1, korka: true } }, // D: Обрезок
      { takty: 200, nam: { dx: 1 } },
      { takty: 420, nam: { dx: 1, rasplav: true } }, // E: труба, форсунка
      { takty: 600, nam: { dx: 1 } }, // G: выход
    ]);
    expect(igra.gotovo, sled.join('\n')).toBe(true);
    expect(igra.serdca).toBeGreaterThanOrEqual(2);
    expect(igra.smerti).toBeLessThanOrEqual(1); // бот сидит в тупике канала, пока Обрезок не дотянется
    const germo = ur.sushchnosti.find((s) => s.id === 'germo');
    expect(germo?.aktivna).toBe(true); // плита под водой открыла крыло
    expect(igra.vragi.some((v) => !v.zhiv)).toBe(true); // Обрезок на пути раздавлен или сгорел
  });

  it('без Расплава щель не проходится', () => {
    const { telo, igra } = proyti([{ takty: 600, nam: { dx: 1 } }]);
    expect(igra.gotovo).toBe(false);
    expect(telo.cx).toBeLessThan(8.5);
  });
});
