// Уровень 1-6: погоня. Обвал догоняет стоящего; бегущий по ступеням и стенам доходит до выхода.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_1_6 } from '../src/level/urovni/1-6';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function stsena() {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, UROVEN_1_6);
  const telo = new Telo(mir, UROVEN_1_6.start[0], UROVEN_1_6.start[1]);
  const igra = new Igra(mir, telo, ur);
  const shag = (nam: Namerenie) => {
    igra.doShaga();
    telo.primenit(nam, igra.korkaSredy);
    mir.shag();
    telo.posle(nam);
    igra.takt(nam);
    telo.schitatCentr();
  };
  return { mir, ur, telo, igra, shag };
}

// Бот погони: катит в сторону яруса; у стены на той же стороне лезет вверх с Вязкостью,
// пока не поднялся выше площадки яруса; выше площадки катит от стены к следующему ярусу
const TSELI = [12.4, 24.4, 36.4];
function bot(t: Telo, faza: number): Namerenie {
  const napr: 1 | -1 = faza % 2 === 0 ? 1 : -1;
  const cel = TSELI[faza] ?? 99;
  const uSteny = t.stenaSboku();
  if (uSteny === napr && t.cy < cel) return { ...PUSTOE, dx: napr, dy: 1, vyazkost: true };
  return { ...PUSTOE, dx: napr };
}

describe('уровень 1-6', () => {
  it('валидатор', () => {
    expect(proveritUroven(UROVEN_1_6)).toEqual([]);
  });

  it('стоящего на месте обвал догоняет и возвращает на горн', () => {
    const { igra, shag } = stsena();
    for (let t = 0; t < 900 && igra.smerti === 0; t++) shag(PUSTOE);
    expect(igra.smerti).toBe(1);
  });

  it('бот доходит до выхода, обвал не догоняет', () => {
    const { telo, igra, shag } = stsena();
    const sled: string[] = [];
    let faza = 0;
    for (let t = 0; t < 60 * 120 && !igra.gotovo; t++) {
      // смена яруса по высоте
      if (faza === 0 && telo.cy > 12.4) faza = 1;
      else if (faza === 1 && telo.cy > 24.4) faza = 2;
      else if (faza === 2 && telo.cy > 36.4) faza = 3; // финальная площадка: к выходу влево
      if (faza === 3 && telo.cy > 36.4) {
        shag({ ...PUSTOE, dx: telo.cx > 13 ? -1 : 1 });
        continue;
      }
      shag(bot(telo, faza));
      if (t % 300 === 0)
        sled.push(`${t}: x ${telo.cx.toFixed(1)} y ${telo.cy.toFixed(1)} смерти ${igra.smerti}`);
    }
    expect(igra.gotovo, sled.join('\n')).toBe(true);
    expect(igra.smerti, sled.join('\n')).toBeLessThanOrEqual(1);
  });
});
