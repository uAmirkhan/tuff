// Критерии дней 3-5 спайка (SPEC-SPAYK.md):
// Вязкость держит на потолке 5 с; Расплав: щель 0,6 диаметра, тело вытягивается;
// Корка ломает блок, который обычное тело не ломает; Выброс из сжатия выше в 1,5 раза;
// связь с ящиком рвётся при его удалении.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

function takt(mir: Mir, telo: Telo, nam: Namerenie, n = 1) {
  for (let i = 0; i < n; i++) {
    telo.primenit(nam);
    mir.shag();
    telo.posle(nam);
  }
}
const N = (p: Partial<Namerenie>): Namerenie => ({ ...PUSTOE, ...p });

describe('способности, дни 3-5', () => {
  it('Вязкость держит тело на потолке 5 секунд', () => {
    const mir = new Mir(MIR);
    mir.dobavitOtrezok(-10, 0, 10, 0); // пол
    mir.dobavitOtrezok(10, 2, -10, 2); // потолок, свободная сторона снизу
    const telo = new Telo(mir, 0, 1.45); // верх тела касается потолка
    takt(mir, telo, N({ vyazkost: true }), 30);
    const [, cy0] = telo.centr();
    takt(mir, telo, N({ vyazkost: true }), 300);
    const [, cy] = telo.centr();
    expect(cy).toBeGreaterThan(1.0); // не упало на пол
    expect(Math.abs(cy - cy0)).toBeLessThan(0.15); // не сползло
    // без Вязкости падает
    takt(mir, telo, PUSTOE, 120);
    expect(telo.centr()[1]).toBeLessThan(0.8);
  });

  it('Расплав протаскивает тело в щель 0,6 диаметра, тело вытягивается', () => {
    const mir = new Mir(MIR);
    mir.dobavitOtrezok(-10, 0, 10, 0); // пол
    // щель: лаз высотой 0,6 и длиной 0,8 под стеной
    mir.dobavitOtrezok(0.8, 0.6, 0, 0.6); // перемычка, свободная сторона снизу
    mir.dobavitOtrezok(0, 0.6, 0, 3); // стена слева от лаза
    mir.dobavitOtrezok(0.8, 3, 0.8, 0.6); // стена справа, свободная сторона +x
    const telo = new Telo(mir, -1.2, 0.5);
    takt(mir, telo, PUSTOE, 60);
    // без Расплава тело не проходит за 6 секунд
    takt(mir, telo, N({ dx: 1 }), 360);
    expect(telo.gabarity().minX).toBeLessThan(0.8);
    // с Расплавом проходит
    let maxAspect = 0;
    for (let t = 0; t < 900; t++) {
      takt(mir, telo, N({ dx: 1, rasplav: true }));
      const g = telo.gabarity();
      maxAspect = Math.max(maxAspect, g.w / g.h);
      if (g.minX > 0.8) break;
    }
    expect(telo.gabarity().minX).toBeGreaterThan(0.8);
    expect(maxAspect).toBeGreaterThan(1.3); // вытянулось в струю
  });

  it('Корка ломает хрупкий блок, который обычное тело не ломает', () => {
    function padenie(korka: boolean): boolean {
      const mir = new Mir(MIR);
      mir.dobavitOtrezok(-10, -5, 10, -5); // дно
      const blok = mir.dobavitOtrezok(-1, 0, 1, 0, 1, 1);
      mir.hrupkost[blok] = 0.15; // порог: обычное падение с 3 диаметров даёт ~0.07, Корка ~0.30
      const telo = new Telo(mir, 0, 3.5);
      const nam = N({ korka });
      for (let t = 0; t < 300; t++) {
        takt(mir, telo, nam);
        if (!mir.oZhiv[blok]) return true;
      }
      return false;
    }
    expect(padenie(false)).toBe(false);
    expect(padenie(true)).toBe(true);
  });

  it('Выброс из сжатия даёт прыжок выше в 1,5 раза, чем без сжатия', () => {
    function pryzhok(szhat: boolean): number {
      const mir = new Mir(MIR);
      mir.dobavitOtrezok(-10, 0, 10, 0);
      const telo = new Telo(mir, 0, szhat ? 4.5 : 0.5);
      // покой или падение до максимального сжатия
      if (!szhat) takt(mir, telo, PUSTOE, 180);
      else {
        let minH = Infinity;
        for (let t = 0; t < 300; t++) {
          takt(mir, telo, PUSTOE);
          const h = telo.gabarity().h;
          if (h < minH) minH = h;
          else if (telo.vKontakte() && h > minH) break; // прошли точку максимального сжатия
        }
      }
      let maxY = 0;
      for (let t = 0; t < 120; t++) {
        takt(mir, telo, N({ vybros: true }));
        maxY = Math.max(maxY, telo.gabarity().minY);
      }
      return maxY;
    }
    const bez = pryzhok(false);
    const so = pryzhok(true);
    expect(so).toBeGreaterThan(bez * 1.5);
    expect(so).toBeGreaterThan(0.5); // оторвалось от пола хотя бы на половину диаметра
  });

  it('по стене лезет только с Вязкостью', () => {
    function podyom(vyazkost: boolean): number {
      const mir = new Mir(MIR);
      mir.dobavitOtrezok(-10, 0, 10, 0);
      mir.dobavitOtrezok(2, 0, 2, 6); // стена справа, свободная сторона -x
      const telo = new Telo(mir, 1.2, 0.5);
      takt(mir, telo, PUSTOE, 60);
      let maks = 0;
      for (let t = 0; t < 240; t++) {
        takt(mir, telo, N({ dx: 1, dy: 1, vyazkost }));
        maks = Math.max(maks, telo.centr()[1]);
      }
      return maks;
    }
    expect(podyom(false)).toBeLessThan(1.6); // чуть приподнимается трением, но не лезет
    expect(podyom(true)).toBeGreaterThan(2.0);
  });

  it('связь Вязкости с ящиком рвётся, когда ящик удалён', () => {
    const mir = new Mir(MIR);
    mir.dobavitOtrezok(-10, 0, 10, 0);
    const yashchik = mir.dobavitOtrezok(1, 3.2, -1, 3.2); // «ящик» как отрезок, к которому липнем снизу
    const telo = new Telo(mir, 0, 2.65); // верх тела касается ящика, до пола не достать
    takt(mir, telo, N({ vyazkost: true }), 60);
    let svyazey = 0;
    for (let i = telo.ot; i < telo.ot + telo.n; i++) if (mir.vPoTochke[i] !== -1) svyazey++;
    expect(svyazey).toBeGreaterThan(0);
    mir.ubratOtrezok(yashchik);
    for (let i = telo.ot; i < telo.ot + telo.n; i++) expect(mir.vPoTochke[i]).toBe(-1);
    takt(mir, telo, N({ vyazkost: true }), 120);
    expect(telo.centr()[1]).toBeLessThan(0.6); // упало на пол
  });
});
