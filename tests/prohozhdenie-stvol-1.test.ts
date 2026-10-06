// Бонус «Ствол: подъём 1» (режим Жерла): по стенам крепежа и балкам до купола, лифт вентиляции как
// короткий путь, иней на стене сбрасывает замешкавшегося: таймер хватки три секунды.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_STVOL_1 } from '../src/level/urovni/stvol-1';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import { botStvola } from './povadki';

type Rezhim = 'steny' | 'potok';
function stsena() {
  const u = UROVEN_STVOL_1;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const shag = (nam: Namerenie) => {
    igra.doShaga();
    telo.primenit(nam, igra.korkaSredy);
    mir.shag();
    telo.posle(nam);
    igra.takt(nam);
    telo.schitatCentr();
  };
  return { u, mir, ur, telo, igra, shag };
}

/** Прогон вынесенной повадкой ствола (tests/povadki.ts). */
function proyti(rezhim: Rezhim, maksTaktov: number) {
  const { u, telo, igra, shag } = stsena();
  const bot = botStvola(rezhim, u.start[0], u.start[1]);
  let t = 0;
  for (; t < maksTaktov; t++) {
    telo.schitatCentr();
    shag(bot.vedyot(telo));
    if (igra.gotovo) break;
  }
  return { igra, telo, t, padeniy: bot.padeniy() };
}

describe('бонус «Ствол: подъём 1»', () => {
  it('уровень проходит валидатор, режим Жерла, открывается 12 звёздами', () => {
    expect(proveritUroven(UROVEN_STVOL_1)).toEqual([]);
    expect(UROVEN_STVOL_1.rezhim).toBe('zherlo');
    expect(UROVEN_STVOL_1.zvyozdDlyaOtkrytiya).toBe(12);
  });

  it('по стенам и балкам бот доходит до купола за минуту', () => {
    const { igra, telo, t } = proyti('steny', 60 * 90);
    expect(igra.gotovo, `t${t} тело в ${telo.cx.toFixed(1)},${telo.cy.toFixed(1)}`).toBe(true);
    expect(t).toBeLessThan(60 * 60);
    expect(igra.maksVysota).toBeGreaterThan(33);
    expect(igra.smerti).toBe(0);
  });

  it('лифт вентиляции с первой балки короче стен', () => {
    const steny = proyti('steny', 60 * 90);
    const potok = proyti('potok', 60 * 90);
    expect(potok.igra.gotovo).toBe(true);
    expect(potok.t).toBeLessThan(steny.t);
  });

  it('замешкавшегося на полосе инея хватка отпускает через три секунды: тело падает', () => {
    const { telo, igra, shag } = stsena();
    for (let k = 0; k < 60; k++) shag({ ...PUSTOE, dx: -1 });
    const lezt: Namerenie = { ...PUSTOE, dx: -1, dy: 1, vyazkost: true };
    let t = 0;
    while (telo.cy < 9.2 && t++ < 60 * 20) shag(lezt);
    expect(telo.cy).toBeGreaterThan(9); // в полосе инея 8..10,4
    const visel: Namerenie = { ...PUSTOE, dx: -1, vyazkost: true };
    let maks = telo.cy;
    for (let k = 0; k < 60 * 5; k++) {
      shag(visel);
      if (telo.cy > maks) maks = telo.cy;
    }
    expect(igra.korkaSredy || telo.cy < 8).toBe(true);
    expect(telo.cy).toBeLessThan(8); // упал ниже полосы
    expect(igra.dlinneysheePadenie).toBeGreaterThan(2);
  });
});
