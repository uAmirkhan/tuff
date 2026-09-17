// Критерии дней 1-2 спайка (SPEC-SPAYK.md):
// падение с 10 диаметров без взрыва и выворачивания, форма назад за 1 с,
// в покое шире чем в высоту, сплющивание при падении не меньше трети.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

function stsena(vysota: number) {
  const mir = new Mir(MIR);
  mir.dobavitOtrezok(-50, 0, 50, 0, 1, 1); // пол
  const telo = new Telo(mir, 0, vysota + 0.5);
  return { mir, telo };
}

function takt(mir: Mir, telo: Telo, n = 1) {
  for (let i = 0; i < n; i++) {
    telo.primenit(PUSTOE);
    mir.shag();
    telo.posle(PUSTOE);
  }
}

describe('тело, дни 1-2', () => {
  it('в покое на полу шире, чем в высоту', () => {
    const { mir, telo } = stsena(0.2);
    takt(mir, telo, 240);
    const g = telo.gabarity();
    expect(g.w).toBeGreaterThan(g.h * 1.1);
    expect(g.minY).toBeGreaterThan(-0.02); // не провалилось сквозь пол
  });

  it('падение с 10 диаметров: не взрывается, не выворачивается, сплющивается не меньше трети', () => {
    const { mir, telo } = stsena(10);
    const per0 = telo.perimetr();
    const pl0 = telo.ploshchad();
    let minH = Infinity;
    let hPokoya = 0;
    // сначала узнаём высоту покоя на отдельной сцене
    {
      const s = stsena(0.2);
      takt(s.mir, s.telo, 240);
      hPokoya = s.telo.gabarity().h;
    }
    for (let t = 0; t < 600; t++) {
      takt(mir, telo);
      const g = telo.gabarity();
      if (g.h < minH) minH = g.h;
      expect(telo.perimetr()).toBeLessThan(per0 * 3);
      expect(telo.ploshchad() * pl0).toBeGreaterThan(0);
      expect(g.minY).toBeGreaterThan(-0.1);
    }
    expect(minH).toBeLessThan(hPokoya * (2 / 3));
  });

  it('после удара форма возвращается за 1 секунду', () => {
    const { mir, telo } = stsena(10);
    let minH = Infinity,
      taktMin = 0;
    for (let t = 0; t < 600; t++) {
      takt(mir, telo);
      const g = telo.gabarity();
      if (g.h < minH) {
        minH = g.h;
        taktMin = t;
      }
    }
    // прогон заново до такта максимального сжатия плюс 60 тактов
    const s = stsena(10);
    takt(s.mir, s.telo, taktMin + 60);
    const g = s.telo.gabarity();
    const pokoy = stsena(0.2);
    takt(pokoy.mir, pokoy.telo, 240);
    const gp = pokoy.telo.gabarity();
    expect(Math.abs(g.h / g.w - gp.h / gp.w)).toBeLessThan(0.15);
  });

  it('симуляция детерминирована', () => {
    const a = stsena(5);
    takt(a.mir, a.telo, 300);
    const b = stsena(5);
    takt(b.mir, b.telo, 300);
    for (let i = 0; i < a.mir.n; i++) {
      expect(a.mir.x[i]).toBe(b.mir.x[i]);
      expect(a.mir.y[i]).toBe(b.mir.y[i]);
    }
  });
});
