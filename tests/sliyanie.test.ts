// Слияние двух тел. Числа взяты из замеров прототипа: wiki 16-koop-dizayn, разделы 4.3 и 4.5.
// Эти тесты и есть страховка от того, что калибровка уедет незаметно.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Poligon, Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function uroven(poligony: Poligon[]): Uroven {
  return {
    versiya: 1,
    id: 'sliyanie-proba',
    nazvanie: 'Проба слияния',
    mysl: 'Слитая пара тяжелее и не протискивается',
    start: [3, 1.2],
    granicy: { minX: -1, minY: -12, maxX: 31, maxY: 16 },
    vremyaZvezdy: 60,
    poligony: [
      {
        tochki: [
          [-1, -12],
          [0, -12],
          [0, 16],
          [-1, 16],
        ],
      },
      {
        tochki: [
          [30, -12],
          [31, -12],
          [31, 16],
          [30, 16],
        ],
      },
      ...poligony,
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: 28, y: 6.5 }],
  };
}

function stsena(u: Uroven, ax: number, ay: number, bx?: number, by?: number) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, ax, ay);
  const b = bx === undefined ? null : new Telo(mir, bx, by as number);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (na: Partial<Namerenie> = {}, nb: Partial<Namerenie> = {}) => {
    const na2 = { ...PUSTOE, ...na };
    const nb2 = { ...PUSTOE, ...nb };
    igra.doShaga();
    a.primenit(na2, igra.korkaSredy);
    b?.primenit(nb2, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(na2);
    b?.posle(nb2);
    igra.takt(na2, b ? [nb2] : []);
    a.schitatCentr();
    b?.schitatCentr();
  };
  return { mir, ur, a, b: b as Telo, igra, shag };
}

const POL: Poligon[] = [
  {
    tochki: [
      [-1, -12],
      [31, -12],
      [31, 0],
      [-1, 0],
    ],
  },
];

describe('слияние: условие касания', () => {
  it('на расстоянии не сливается, вплотную сливается', () => {
    const daleko = stsena(uroven(POL), 6, 0.6, 12, 0.6);
    for (let t = 0; t < 30; t++) daleko.shag();
    expect(daleko.igra.slit()).toBe(false);
    expect(daleko.igra.slito).toBe(false);

    const ryadom = stsena(uroven(POL), 6, 0.6, 6.9, 0.6);
    for (let t = 0; t < 30; t++) ryadom.shag();
    expect(ryadom.igra.slit()).toBe(true);
    expect(ryadom.igra.slito).toBe(true);
    expect(ryadom.igra.sliyanie?.svyazey).toBeGreaterThanOrEqual(3);
  });

  it('разделение возвращает расталкивание и обнуляет связи', () => {
    const s = stsena(uroven(POL), 6, 0.6, 6.9, 0.6);
    for (let t = 0; t < 30; t++) s.shag();
    s.igra.slit();
    s.igra.razdelit();
    expect(s.igra.slito).toBe(false);
    expect(s.igra.sliyanie?.svyazey).toBe(0);
    expect(s.a.vSliyanii).toBe(false);
    expect(s.b.vSliyanii).toBe(false);
    expect(s.mir.cKontakt[s.b.kontur]).toBe(1);
  });

  it('слияние и разделение в цикле не плодят связи', () => {
    const s = stsena(uroven(POL), 6, 0.6, 6.9, 0.6);
    for (let t = 0; t < 30; t++) s.shag();
    const bylo = s.mir.m;
    for (let i = 0; i < 40; i++) {
      s.igra.slit();
      s.shag();
      s.igra.razdelit();
      s.shag();
    }
    // пул выделяется один раз: не больше одной связи на частицу тела
    expect(s.mir.m - bylo).toBeLessThanOrEqual(s.a.n);
  });

  it('смерть рвёт слияние', () => {
    const s = stsena(uroven(POL), 6, 0.6, 6.9, 0.6);
    for (let t = 0; t < 30; t++) s.shag();
    s.igra.slit();
    expect(s.igra.slito).toBe(true);
    s.igra.umeret('проба');
    expect(s.igra.slito).toBe(false);
  });
});

describe('слияние: цена и выгода', () => {
  it('слитому телу Расплав недоступен', () => {
    const s = stsena(uroven(POL), 6, 0.6, 6.9, 0.6);
    for (let t = 0; t < 30; t++) s.shag();
    s.shag({ rasplav: true }, {});
    expect(s.a.sostoyanie).toBe('rasplav');
    s.igra.slit();
    s.shag({ rasplav: true }, { rasplav: true });
    expect(s.a.sostoyanie).not.toBe('rasplav');
    expect(s.b.sostoyanie).not.toBe('rasplav');
    s.igra.razdelit();
    s.shag({ rasplav: true }, {});
    expect(s.a.sostoyanie).toBe('rasplav');
  });

  it('щель 0,8: одиночка Расплавом проходит, слитая пара нет', () => {
    const shchel = 0.8;
    const pol: Poligon[] = [
      ...POL,
      {
        tochki: [
          [14, shchel],
          [16, shchel],
          [16, 14],
          [14, 14],
        ],
      },
    ];
    const odin = stsena(uroven(pol), 10, 0.6);
    for (let t = 0; t < 600; t++) odin.shag({ dx: 1, rasplav: true });
    expect(odin.a.cx).toBeGreaterThan(17);

    const para = stsena(uroven(pol), 9.7, 0.6, 10.6, 0.6);
    for (let t = 0; t < 30; t++) para.shag();
    expect(para.igra.slit()).toBe(true);
    for (let t = 0; t < 600; t++) para.shag({ dx: 1 }, { dx: 1 });
    expect(para.igra.slito).toBe(true);
    expect(para.a.cx).toBeLessThan(15);
  });

  it('хрупкий пол с порогом 1,5: одиночка не ломает, слитая пара ломает', () => {
    const pol = (h: number): Poligon[] => [
      {
        tochki: [
          [0, -12],
          [8, -12],
          [8, 6],
          [0, 6],
        ],
      },
      {
        tochki: [
          [8, 5.6],
          [14, 5.6],
          [14, 6],
          [8, 6],
        ],
        material: 'hrupkiy',
        hrupkost: h,
      },
      {
        tochki: [
          [14, -12],
          [30, -12],
          [30, 6],
          [14, 6],
        ],
      },
    ];
    const slomal = (s: ReturnType<typeof stsena>, vdvoyom: boolean) => {
      for (let t = 0; t < 240; t++) {
        s.shag({ korka: true }, vdvoyom ? { korka: true } : {});
        for (const e of s.igra.sobytiya) if (e.tip === 'slomano') return true;
      }
      return false;
    };
    const odin = stsena(uroven(pol(1.5)), 11, 7.2);
    expect(slomal(odin, false)).toBe(false);

    const para = stsena(uroven(pol(1.5)), 10.7, 7.2, 11.3, 7.2);
    expect(para.igra.slit()).toBe(true);
    expect(slomal(para, true)).toBe(true);
  });
});
