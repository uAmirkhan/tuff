// Жерло: валидатор, метрики высоты и падения, запись и призрак повторяют тело точь-в-точь.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { dekodirovat, kodirovat, Prizrak, Zapis } from '../src/game/zapis';
import { UROVNI, urovenOtkryt, zvyozdMira } from '../src/level/spisok';
import { UROVEN_ZH_1 } from '../src/level/urovni/zherlo-1';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { HranilishchePamyati, zagruzitProgress, zapisatRezultat } from '../src/meta/sohranenie';
import { Mir } from '../src/physics/mir';

describe('Жерло', () => {
  it('валидатор и открытие по звёздам', () => {
    expect(proveritUroven(UROVEN_ZH_1)).toEqual([]);
    expect(
      urovenOtkryt(
        UROVEN_ZH_1,
        () => true,
        () => 1,
      ),
    ).toBe(false); // 6 уровней × 1 = 6 < 12
    expect(
      urovenOtkryt(
        UROVEN_ZH_1,
        () => true,
        () => 2,
      ),
    ).toBe(true);
    expect(zvyozdMira(() => 3)).toBe(3 * (UROVNI.length - 1));
    expect(
      urovenOtkryt(
        UROVNI[1] as (typeof UROVNI)[number],
        () => false,
        () => 0,
      ),
    ).toBe(false);
  });

  it('кодирование ввода обратимо', () => {
    const n: Namerenie = {
      dx: 1,
      dy: -1,
      vyazkost: true,
      rasplav: false,
      korka: true,
      vybros: false,
    };
    expect(dekodirovat(kodirovat(n))).toEqual(n);
    expect(dekodirovat(kodirovat(PUSTOE))).toEqual(PUSTOE);
  });

  it('высота и самое длинное падение считаются, чекпоинтов нет', () => {
    const mir = new Mir(MIR);
    const ur = zagruzitUroven(mir, UROVEN_ZH_1);
    const telo = new Telo(mir, 8, 1.2);
    const igra = new Igra(mir, telo, ur);
    const shag = (nam: Namerenie) => {
      igra.doShaga();
      telo.primenit(nam, igra.korkaSredy);
      mir.shag();
      telo.posle(nam);
      igra.takt(nam);
    };
    for (let t = 0; t < 30; t++) shag(PUSTOE);
    telo.vosstanovit(8, 12, 'тест: подняли');
    for (let t = 0; t < 30; t++) shag(PUSTOE);
    expect(igra.maksVysota).toBeGreaterThan(10);
    for (let t = 0; t < 240; t++) shag(PUSTOE); // падение вниз
    expect(igra.dlinneysheePadenie).toBeGreaterThan(8);
    expect(igra.smerti).toBe(0);
  });

  it('призрак повторяет запись точь-в-точь', () => {
    const mir = new Mir(MIR);
    const ur = zagruzitUroven(mir, UROVEN_ZH_1);
    const telo = new Telo(mir, 8, 1.2);
    const igra = new Igra(mir, telo, ur);
    const zapis = new Zapis();
    for (let t = 0; t < 300; t++) {
      const nam: Namerenie = { ...PUSTOE, dx: t < 150 ? 1 : -1, vyazkost: t % 40 < 20, dy: 1 };
      zapis.dobavit(nam);
      igra.doShaga();
      telo.primenit(nam, igra.korkaSredy);
      mir.shag();
      telo.posle(nam);
      igra.takt(nam);
    }
    const p = new Prizrak(UROVEN_ZH_1, zapis.takty);
    while (!p.zakonchen) p.shag();
    telo.schitatCentr();
    p.telo.schitatCentr();
    expect(p.telo.cx).toBe(telo.cx);
    expect(p.telo.cy).toBe(telo.cy);
  });

  it('запись сохраняется только у лучшего времени', () => {
    const h = new HranilishchePamyati();
    const pr = zagruzitProgress(h);
    zapisatRezultat(pr, 'zh-1', {
      takty: 500,
      ochki: 0,
      serdca: [],
      porogOchkov: 0,
      zapis: [1, 2, 3],
    });
    zapisatRezultat(pr, 'zh-1', { takty: 900, ochki: 0, serdca: [], porogOchkov: 0, zapis: [9] });
    expect(pr.urovni['zh-1']?.zapis).toEqual([1, 2, 3]);
    zapisatRezultat(pr, 'zh-1', { takty: 400, ochki: 0, serdca: [], porogOchkov: 0, zapis: [4] });
    expect(pr.urovni['zh-1']?.zapis).toEqual([4]);
  });
});
