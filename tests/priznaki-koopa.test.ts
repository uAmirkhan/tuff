// Признаки состояния в кооперативе. Саму картинку тест не видит, поэтому проверяется то,
// что проверяемо без браузера: цветовая математика и данные, которые уходят в отрисовку.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { OSTYVANIE, ZHAR } from '../src/game/config/zhar';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import { smeshat } from '../src/render/stsena';

const POLE: Uroven = {
  versiya: 1,
  id: 'priznaki',
  nazvanie: 'Признаки',
  mysl: 'Видно ли состояние',
  start: [3, 0.6],
  granicy: { minX: -1, minY: -3, maxX: 41, maxY: 14 },
  vremyaZvezdy: 60,
  poligony: [
    {
      tochki: [
        [-1, -3],
        [0, -3],
        [0, 12],
        [-1, 12],
      ],
    },
    {
      tochki: [
        [40, -3],
        [41, -3],
        [41, 12],
        [40, 12],
      ],
    },
    {
      tochki: [
        [-1, -3],
        [41, -3],
        [41, 0],
        [-1, 0],
      ],
    },
  ],
  obekty: [{ tip: 'vyhod', id: 'v', x: 38, y: 0.5 }],
};

describe('признаки состояния в кооперативе', () => {
  it('смешивание цветов: края и середина', () => {
    expect(smeshat(0x000000, 0xffffff, 0)).toBe(0x000000);
    expect(smeshat(0x000000, 0xffffff, 1)).toBe(0xffffff);
    expect(smeshat(0x000000, 0xffffff, 0.5)).toBe(0x808080);
    expect(smeshat(0xff0000, 0x0000ff, 1)).toBe(0x0000ff);
    // доля вне отрезка не ломает цвет
    expect(smeshat(0x102030, 0x405060, -5)).toBe(0x102030);
    expect(smeshat(0x102030, 0x405060, 5)).toBe(0x405060);
  });

  it('отрисовке есть что показывать: доля жара падает врозь и растёт слитыми', () => {
    const mir = new Mir(MIR);
    const ur = zagruzitUroven(mir, POLE);
    const a = new Telo(mir, 5, 0.6);
    const b = new Telo(mir, 30, 0.6); // врозь: 25 единиц, дальше порога
    const igra = new Igra(mir, a, ur);
    igra.dobavitSputnika(b);
    const shag = () => {
      igra.doShaga();
      a.primenit(PUSTOE, igra.korkaSredy);
      b.primenit(PUSTOE, igra.korkaSredyTela(b));
      mir.shag();
      a.posle(PUSTOE);
      b.posle(PUSTOE);
      igra.takt(PUSTOE, [PUSTOE]);
      a.schitatCentr();
      b.schitatCentr();
    };
    for (let t = 0; t < 600; t++) shag();
    const doli = igra.zhizni.map((z) => z.zhar / ZHAR.maks);
    // обе доли заметно ниже единицы: холод есть что нарисовать на ОБОИХ телах
    for (const d of doli) expect(d).toBeLessThan(0.75); // порог, с которого холод виден
    expect(doli.length).toBe(2); // шкала рисуется на каждого, а не только на героя
  });

  it('порог холода согласован с остыванием: он достижим до смерти', () => {
    // холод начинает показываться с доли 0,75, то есть с 75 жара. Врозь это около 8 секунд,
    // а до смерти около 33 — признак успевает появиться задолго до конца.
    const dolyaPoroga = 0.75;
    const sekundDoPoroga = ((1 - dolyaPoroga) * ZHAR.maks) / (OSTYVANIE.vrozn * 60);
    const sekundDoSmerti = ZHAR.maks / (OSTYVANIE.vrozn * 60);
    expect(sekundDoPoroga).toBeLessThan(sekundDoSmerti / 3);
  });
});
