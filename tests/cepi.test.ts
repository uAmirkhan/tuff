// Цепи: мост держит обычное тело, слабая цепь рвётся под Коркой, Вязкость держит на звене.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function most(prochnost: 'slabaya' | 'prochnaya'): Uroven {
  return {
    versiya: 1,
    id: 'c',
    nazvanie: 'c',
    mysl: 'c',
    start: [2, 3.2],
    granicy: { minX: -2, minY: -6, maxX: 20, maxY: 10 },
    poligony: [
      {
        tochki: [
          [-2, -6],
          [20, -6],
          [20, -5],
          [-2, -5],
        ],
      }, // дно
      {
        tochki: [
          [-2, -5],
          [4, -5],
          [4, 2.6],
          [-2, 2.6],
        ],
      }, // левая площадка
      {
        tochki: [
          [10, -5],
          [20, -5],
          [20, 2.6],
          [10, 2.6],
        ],
      }, // правая площадка
    ],
    obekty: [
      { tip: 'cep', id: 'm', x: 4, y: 2.7, x2: 10, y2: 2.7, zvenyev: 16, prochnost },
      { tip: 'vyhod', x: 18, y: 3.4 },
      { tip: 'serdce', x: 12, y: 3.4 },
      { tip: 'serdce', x: 13, y: 3.4 },
      { tip: 'serdce', x: 14, y: 3.4 },
    ],
  };
}

function stsena(u: Uroven, start?: [number, number]) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const [sx, sy] = start ?? u.start;
  const telo = new Telo(mir, sx, sy);
  const igra = new Igra(mir, telo, ur);
  const takt = (nam: Namerenie = PUSTOE, n = 1) => {
    for (let i = 0; i < n; i++) {
      igra.doShaga();
      telo.primenit(nam, igra.korkaSredy);
      mir.shag();
      telo.posle(nam);
      igra.takt(nam);
      telo.schitatCentr();
    }
  };
  return { mir, ur, telo, igra, takt };
}

describe('цепи', () => {
  it('прочный мост держит тело, тело переходит на другую сторону', () => {
    const { telo, takt, igra } = stsena(most('prochnaya'));
    takt(PUSTOE, 60);
    for (let t = 0; t < 900 && telo.cx < 11; t++) takt({ ...PUSTOE, dx: 1 });
    expect(telo.cx).toBeGreaterThan(10.5);
    expect(igra.smerti).toBe(0);
  });

  it('слабый мост рвётся под Коркой, тело падает; без Корки держит', () => {
    const a = stsena(most('slabaya'));
    a.takt(PUSTOE, 60);
    while (a.telo.cx < 6.8) a.takt({ ...PUSTOE, dx: 1 }); // до середины моста
    a.takt(PUSTOE, 180); // стоять на мосту
    expect(
      a.mir.porvano.length + a.igra.sobytiya.filter((s) => s.tip === 'cepPorvana').length,
    ).toBe(0);
    expect(a.telo.cy).toBeGreaterThan(1.5);
    const b = stsena(most('slabaya'));
    b.takt(PUSTOE, 60);
    while (b.telo.cx < 6.8) b.takt({ ...PUSTOE, dx: 1 });
    let porvana = false;
    for (let t = 0; t < 300; t++) {
      b.takt({ ...PUSTOE, korka: true });
      if (b.igra.sobytiya.some((s) => s.tip === 'cepPorvana')) porvana = true;
    }
    expect(porvana).toBe(true);
    expect(b.telo.cy).toBeLessThan(1);
  });

  it('Вязкость держит тело на висящей цепи', () => {
    const u: Uroven = {
      ...most('prochnaya'),
      obekty: [
        { tip: 'cep', id: 'v', x: 7, y: 8, zvenyev: 10, prochnost: 'prochnaya' },
        { tip: 'vyhod', x: 18, y: 3.4 },
        { tip: 'serdce', x: 12, y: 3.4 },
        { tip: 'serdce', x: 13, y: 3.4 },
        { tip: 'serdce', x: 14, y: 3.4 },
      ],
    };
    // тело стартует с касанием нижнего звена цепи (цепь висит от 8 до 5.5)
    const { telo, takt } = stsena(u, [7, 4.8]);
    takt({ ...PUSTOE, vyazkost: true, dy: 1 }, 30);
    takt({ ...PUSTOE, vyazkost: true }, 240);
    expect(telo.cy).toBeGreaterThan(3.5); // висит, не упал на дно
    takt(PUSTOE, 120);
    expect(telo.cy).toBeLessThan(-3); // отпустил, упал
  });
});
