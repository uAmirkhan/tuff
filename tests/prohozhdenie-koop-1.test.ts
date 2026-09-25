// Комната koop-1: первое препятствие, которое действительно требует слияния.
// Тест держит три свойства сразу — иначе ворота незаметно превратятся в обычный уступ.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_KOOP_1 } from '../src/level/urovni/koop-1';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function progon(rezhim: 'одиночка' | 'двое' | 'слитые') {
  const u = UROVEN_KOOP_1;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, u.start[0], u.start[1]);
  const b = rezhim === 'одиночка' ? null : new Telo(mir, u.start[0] + 1.2, u.start[1]);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (n: Namerenie) => {
    igra.doShaga();
    a.primenit(n, igra.korkaSredy);
    b?.primenit(n, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(n);
    b?.posle(n);
    igra.takt(n, b ? [n] : []);
    a.schitatCentr();
    b?.schitatCentr();
  };
  for (let t = 0; t < 30; t++) shag(PUSTOE);
  if (rezhim === 'слитые') expect(igra.slit()).toBe(true);
  // сперва чистый разбег, потом разбег с Выбросом: Выброс с первого такта не даёт набрать ход
  const nazad: Namerenie = { ...PUSTOE, dx: -1 };
  const idti: Namerenie = { ...PUSTOE, dx: 1 };
  const pryg: Namerenie = { ...PUSTOE, dx: 1, vybros: true, dy: 1 };
  // фазы по месту, а не по тактам: слитая пара едет медленнее, и счёт тактов врёт
  for (let t = 0; t < 600 && a.cx > 4; t++) shag(nazad); // отойти за разбегом
  for (let t = 0; t < 600 && a.cx < 26; t++) shag(idti); // разгон по ровному полу
  for (let t = 0; t < 900 && !igra.gotovo; t++) shag(pryg); // общий выброс
  return { igra, a, b, mir };
}

describe('комната koop-1 «Проба на двоих»', () => {
  it('проходит валидатор', () => {
    expect(proveritUroven(UROVEN_KOOP_1)).toEqual([]);
  });

  it('одиночка ворота не берёт', () => {
    const { igra, a } = progon('одиночка');
    expect(igra.gotovo).toBe(false);
    expect(a.cx).toBeLessThan(31); // упёрся в ледяную стену на x 30
  });

  // ИЗВЕСТНАЯ ДЫРА, не чинится этой геометрией. Прямой попыткой двое несклеенных выход не берут,
  // но бот-проверка (scripts/koop-stend.ts) находит проход живой ступенью: тела забираются друг
  // по другу. Живая ступень работает на уступах 1,8-2,2 — ровно там же, где общий выброс,
  // поэтому окна «только слиянием» по высоте не существует. Тест держит прямой случай,
  // а бот-проверка остаётся источником правды.
  it('двое несклеенных прямой попыткой выход не берут', () => {
    const { igra, a, b } = progon('двое');
    expect(igra.gotovo).toBe(false);
    const naverhu = [a, b as Telo].filter((t) => t.cy > 2.2).length;
    expect(naverhu).toBeLessThan(2);
  });

  it('слитая пара берёт выход, без смертей и сторожей', () => {
    const { igra, a, b, mir } = progon('слитые');
    expect(igra.gotovo).toBe(true);
    expect(igra.smerti).toBe(0);
    expect(mir.zhurnal.length).toBe(0);
    expect(a.cy).toBeGreaterThan(2.2);
    expect((b as Telo).cy).toBeGreaterThan(2.2);
  });
});
