// Босс «Тройной котёл»: очередь открытий, удар Коркой в открытое горло, запасной путь лавой,
// выход открывается только после победы.
import { describe, expect, it } from 'vitest';
import { TroynoyKotyol } from '../src/game/boss';
import { BOSS } from '../src/game/config/boss';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_1_7 } from '../src/level/urovni/1-7';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function stsena(start?: [number, number]) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, UROVEN_1_7);
  const [sx, sy] = start ?? UROVEN_1_7.start;
  const telo = new Telo(mir, sx, sy);
  const igra = new Igra(mir, telo, ur);
  const shag = (nam: Namerenie = PUSTOE) => {
    igra.doShaga();
    telo.primenit(nam, igra.korkaSredy);
    mir.shag();
    telo.posle(nam);
    igra.takt(nam);
    telo.schitatCentr();
  };
  return { mir, ur, telo, igra, shag };
}

describe('босс Тройной котёл', () => {
  it('валидатор и создание босса', () => {
    expect(proveritUroven(UROVEN_1_7)).toEqual([]);
    const { igra } = stsena();
    expect((igra.boss as TroynoyKotyol).kotly.length).toBe(3);
  });

  it('котлы открываются по очереди и выпускают Шлакожуков', () => {
    const { igra, shag } = stsena();
    const b = igra.boss as TroynoyKotyol;
    for (let t = 0; t < BOSS.pauzaStart + 5; t++) shag();
    expect(b.kotly.filter((k) => k.otkryt).length).toBe(1);
    expect(b.kotly[0]?.otkryt).toBe(true);
    expect(igra.vragi.length).toBe(1);
    for (let t = 0; t < BOSS.otkrytTaktov + 20; t++) shag();
    expect(b.kotly[0]?.otkryt).toBe(false);
    expect(b.kotly[1]?.otkryt).toBe(true);
  });

  it('удар Коркой в открытое горло разбивает котёл, три удара — победа и выход', () => {
    const mir = new Mir(MIR);
    const ur = zagruzitUroven(mir, UROVEN_1_7);
    const b = new TroynoyKotyol(mir, ur.sushchnosti, []);
    const gorlo = (k: { x: number; y: number }) => ({
      minX: k.x - 0.4,
      maxX: k.x + 0.4,
      minY: k.y + BOSS.vysota - 0.1,
      maxY: k.y + BOSS.vysota + 0.9,
    });
    const daleko = { minX: -10, maxX: -9, minY: 0, maxY: 1 };
    for (let i = 0; i < 3; i++) {
      // ждать открытия котла i
      let ohrana = 0;
      while (!b.kotly[i]?.otkryt && ohrana++ < 2000) b.takt(daleko, false, 0, false, 1);
      expect(b.kotly[i]?.otkryt).toBe(true);
      // удар без Корки не считается
      b.takt(gorlo(b.kotly[i] as { x: number; y: number }), false, 0.2, false, 1);
      expect(b.kotly[i]?.zhiv).toBe(true);
      // удар Коркой сверху
      b.takt(gorlo(b.kotly[i] as { x: number; y: number }), true, 0.2, false, 1);
      expect(b.kotly[i]?.zhiv).toBe(false);
    }
    b.takt(daleko, false, 0, false, 1);
    expect(b.pobezhdyon).toBe(true);
  });

  it('запасной путь: рычаг заливает лаву, котлы гаснут, выход открывается', () => {
    const { igra, ur, shag, telo } = stsena([2, 6.2]); // на стартовой полке у рычага
    const zaliv = ur.sushchnosti.find((s) => s.id === 'zaliv');
    expect(zaliv?.aktivna).toBe(false);
    for (let t = 0; t < 30; t++) shag();
    expect(zaliv?.aktivna).toBe(true);
    for (let t = 0; t < BOSS.gasnetVLave + 30 && !igra.boss?.pobezhdyon; t++) shag();
    expect(igra.boss?.pobezhdyon).toBe(true);
    const z = ur.sushchnosti.find((s) => s.id === 'vyhod-zaslonka');
    expect(z?.aktivna).toBe(true); // открыта
    // выход теперь работает
    telo.vosstanovit(38, 0.8, 'тест');
    for (let t = 0; t < 10; t++) shag();
    expect(igra.gotovo).toBe(true);
  });

  it('до победы выход не срабатывает', () => {
    const { igra, shag } = stsena([38, 0.8]);
    for (let t = 0; t < 30; t++) shag();
    expect(igra.gotovo).toBe(false);
  });
});
