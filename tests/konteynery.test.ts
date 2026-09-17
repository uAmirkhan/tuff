// Контейнеры и маятники: стоят, толкаются, тянутся Вязкостью, висят на цепи и качаются.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { type Sushchnost, zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function komnata(obekty: Uroven['obekty'], start: [number, number]): Uroven {
  return {
    versiya: 1,
    id: 'kont',
    nazvanie: 'контейнеры',
    mysl: 'тест',
    start,
    granicy: { minX: -10, minY: -5, maxX: 30, maxY: 20 },
    poligony: [
      {
        tochki: [
          [-10, -5],
          [30, -5],
          [30, 0],
          [-10, 0],
        ],
      },
      {
        tochki: [
          [-10, 0],
          [-9, 0],
          [-9, 20],
          [-10, 20],
        ],
      },
    ],
    obekty: [
      { tip: 'vyhod', x: 29, y: 1 },
      { tip: 'serdce', x: 25, y: 1 },
      { tip: 'serdce', x: 26, y: 1 },
      { tip: 'serdce', x: 27, y: 1 },
      ...obekty,
    ],
  };
}

function centr(mir: Mir, s: Sushchnost): [number, number] {
  let sx = 0,
    sy = 0;
  for (const p of s.chasticy) {
    sx += mir.x[p] as number;
    sy += mir.y[p] as number;
  }
  return [sx / s.chasticy.length, sy / s.chasticy.length];
}

function progon(u: Uroven, plan: { takty: number; nam: Partial<typeof PUSTOE> }[]) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  for (const sh of plan) {
    const nam = { ...PUSTOE, ...sh.nam };
    for (let t = 0; t < sh.takty; t++) {
      igra.doShaga();
      telo.primenit(nam, igra.korkaSredy);
      mir.shag();
      telo.posle(nam);
      igra.takt(nam);
    }
  }
  telo.schitatCentr();
  return { telo, igra, mir, ur };
}

describe('контейнеры', () => {
  it('контейнер стоит на полу и не разъезжается', () => {
    const u = komnata([{ tip: 'yashchik', id: 'ya', x: 5, y: 0.1, w: 1, h: 1 }], [1, 1.2]);
    const { mir, ur } = progon(u, [{ takty: 240, nam: {} }]);
    const s = ur.sushchnosti.find((q) => q.tip === 'yashchik') as Sushchnost;
    const [cx, cy] = centr(mir, s);
    expect(Math.abs(cx - 5.5)).toBeLessThan(0.1);
    expect(cy).toBeGreaterThan(0.4);
    expect(cy).toBeLessThan(0.6);
    // диагонали не изменились: контейнер твёрдый
    const d = Math.hypot(
      (mir.x[s.chasticy[2] as number] as number) - (mir.x[s.chasticy[0] as number] as number),
      (mir.y[s.chasticy[2] as number] as number) - (mir.y[s.chasticy[0] as number] as number),
    );
    expect(Math.abs(d - Math.SQRT2)).toBeLessThan(0.05);
  });

  it('тело толкает контейнер вправо', () => {
    const u = komnata([{ tip: 'yashchik', id: 'ya', x: 3, y: 0.1, w: 1, h: 1 }], [1, 1.2]);
    const { mir, ur, telo } = progon(u, [{ takty: 150, nam: { dx: 1 } }]);
    const s = ur.sushchnosti.find((q) => q.tip === 'yashchik') as Sushchnost;
    const [cx, cy] = centr(mir, s);
    expect(cx, `тело x ${telo.cx.toFixed(2)}`).toBeGreaterThan(4.5);
    // контейнер остался на полу целым, тело не внутри него
    expect(cy).toBeLessThan(1.2);
    let vnutri = 0;
    for (let i = telo.ot; i < telo.ot + telo.n; i++)
      if (mir.vnutriKontura(s.chasticy[0] as number, 4, mir.x[i] as number, mir.y[i] as number))
        vnutri++;
    expect(vnutri).toBe(0);
  });

  it('Вязкость тянет контейнер за собой', () => {
    // контейнер вплотную справа от героя: коснуться, прилипнуть, ползти влево
    const u = komnata([{ tip: 'yashchik', id: 'ya', x: 1.8, y: 0.1, w: 1, h: 1 }], [1.2, 1.2]);
    const { mir, ur } = progon(u, [
      { takty: 40, nam: { dx: 1 } },
      { takty: 30, nam: { vyazkost: true } },
      { takty: 240, nam: { dx: -1, vyazkost: true } },
    ]);
    const s = ur.sushchnosti.find((q) => q.tip === 'yashchik') as Sushchnost;
    const [cx] = centr(mir, s);
    expect(cx).toBeLessThan(2.0);
  });

  it('маятник висит под якорем и качается после толчка', () => {
    const u = komnata([{ tip: 'mayatnik', id: 'm', x: 8, y: 8, w: 1, h: 1, dlina: 3 }], [1, 1.2]);
    const { mir, ur } = progon(u, [{ takty: 300, nam: {} }]);
    const s = ur.sushchnosti.find((q) => q.tip === 'mayatnik') as Sushchnost;
    const [cx, cy] = centr(mir, s);
    expect(Math.abs(cx - 8)).toBeLessThan(0.1);
    expect(cy).toBeGreaterThan(3.7);
    expect(cy).toBeLessThan(4.7);
    // толчок: сдвинуть все углы вправо на 1 и отпустить; через полпериода центр левее якоря
    for (const p of s.chasticy) {
      mir.x[p] = (mir.x[p] as number) + 1;
      mir.px[p] = mir.x[p] as number;
    }
    let minX = Infinity,
      maxX = -Infinity;
    for (let t = 0; t < 240; t++) {
      mir.shag();
      const [x] = centr(mir, s);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }
    expect(minX).toBeLessThan(7.6);
    expect(maxX).toBeGreaterThan(8.4);
  });
});
