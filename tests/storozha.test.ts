// Сторожа тела: вывернутое или взорванное тело восстанавливается, причина в журнале.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

describe('сторожа тела', () => {
  it('целое тело сторожа не трогают', () => {
    const mir = new Mir(MIR);
    mir.dobavitOtrezok(-10, 0, 10, 0);
    const telo = new Telo(mir, 0, 0.5);
    expect(telo.storozha()).toBeNull();
    expect(mir.zhurnal.length).toBe(0);
  });

  it('вывернутое тело восстанавливается', () => {
    const mir = new Mir(MIR);
    const telo = new Telo(mir, 0, 2);
    // зеркалим кольцо по x: площадь меняет знак
    for (let i = telo.ot; i < telo.ot + telo.n; i++) mir.x[i] = -(mir.x[i] as number);
    expect(telo.ploshchad()).toBeLessThan(0);
    const p = telo.storozha();
    expect(p).toContain('выворачивание');
    expect(telo.ploshchad()).toBeGreaterThan(0);
    expect(mir.zhurnal[0]).toContain('выворачивание');
  });

  it('взорванное тело восстанавливается', () => {
    const mir = new Mir(MIR);
    const telo = new Telo(mir, 0, 2);
    telo.storozha(); // запомнить периметр покоя
    for (let i = telo.ot; i < telo.ot + telo.n; i++) {
      mir.x[i] = (mir.x[i] as number) * 5;
      mir.y[i] = (mir.y[i] as number) * 5;
    }
    expect(telo.storozha()).toContain('взрыв');
    expect(telo.perimetr()).toBeLessThan(4);
  });

  it('самопересечение контура ловится', () => {
    const mir = new Mir(MIR);
    const telo = new Telo(mir, 0, 2);
    telo.storozha();
    // меняем местами две несмежные точки: контур пересекает сам себя
    const a = telo.ot + 2,
      b = telo.ot + 6;
    const ax = mir.x[a] as number,
      ay = mir.y[a] as number;
    mir.x[a] = mir.x[b] as number;
    mir.y[a] = mir.y[b] as number;
    mir.x[b] = ax;
    mir.y[b] = ay;
    expect(telo.storozha()).not.toBeNull();
  });
});
