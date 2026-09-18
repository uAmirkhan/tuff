// Кооп, шаг 0: движок перестаёт считать, что тело игрока одно.
// Плиты, поток, рычаги, сбор и горны работают от любого тела, выход требует обоих.
// Замеры, из которых взяты числа: wiki 16-koop-dizayn, раздел 4.5.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Obekt, Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function komnata(obekty: Obekt[]): Uroven {
  return {
    versiya: 1,
    id: 'koop-proba',
    nazvanie: 'Кооп-проба',
    mysl: 'Любое тело игрока, а не только герой',
    start: [2, 0.6],
    granicy: { minX: -1, minY: -3, maxX: 31, maxY: 15 },
    vremyaZvezdy: 60,
    poligony: [
      {
        tochki: [
          [-1, -3],
          [0, -3],
          [0, 13],
          [-1, 13],
        ],
      },
      {
        tochki: [
          [30, -3],
          [31, -3],
          [31, 13],
          [30, 13],
        ],
      },
      {
        tochki: [
          [-1, -3],
          [31, -3],
          [31, 0],
          [-1, 0],
        ],
      },
    ],
    obekty,
  };
}

/** Сцена на два тела: второе подключается спутником только если задано bx. */
function stsena(obekty: Obekt[], ax: number, ay: number, bx?: number, by?: number) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, komnata(obekty));
  const a = new Telo(mir, ax, ay);
  const b = bx === undefined ? null : new Telo(mir, bx, by as number);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (na: Partial<Namerenie> = {}, nb: Partial<Namerenie> = {}) => {
    const na2 = { ...PUSTOE, ...na };
    const nb2 = { ...PUSTOE, ...nb };
    igra.doShaga();
    a.primenit(na2, igra.korkaSredy);
    b?.primenit(nb2, false);
    mir.shag();
    a.posle(na2);
    b?.posle(nb2);
    igra.takt(na2);
    a.schitatCentr();
    b?.schitatCentr();
  };
  const najdi = (tip: Obekt['tip'], id?: string) =>
    ur.sushchnosti.find((s) => s.tip === tip && (id === undefined || s.id === id));
  return { mir, ur, a, b, igra, shag, najdi };
}

const PLITA_I_DVER: Obekt[] = [
  { tip: 'plita', id: 'p', x: 14, y: 0, cel: 'd', fiksiruetsya: false },
  { tip: 'zaslonka', id: 'd', x: 22, y: 0, w: 0.4, h: 3 },
  { tip: 'vyhod', id: 'v', x: 27, y: 0.5 },
];

describe('кооп: плита видит любое тело', () => {
  it('без спутника поведение прежнее: герой жмёт, пустая плита отпущена', () => {
    const s = stsena(PLITA_I_DVER, 14, 0.6);
    for (let t = 0; t < 120; t++) s.shag();
    expect(s.najdi('plita')?.aktivna).toBe(true);

    const pusto = stsena(PLITA_I_DVER, 3, 0.6);
    for (let t = 0; t < 120; t++) pusto.shag();
    expect(pusto.najdi('plita')?.aktivna).toBe(false);
  });

  it('спутник на плите открывает дверь, пока герой далеко', () => {
    const s = stsena(PLITA_I_DVER, 3, 0.6, 14, 0.6);
    for (let t = 0; t < 120; t++) s.shag();
    expect(s.najdi('plita')?.aktivna).toBe(true);
    expect(s.najdi('zaslonka')?.aktivna).toBe(true);
  });

  it('плита под Корку спрашивает Корку у того, кто на ней стоит', () => {
    const ob: Obekt[] = [
      { tip: 'plita', id: 'p', x: 14, y: 0, cel: 'd', nuzhnaKorka: true, fiksiruetsya: false },
      { tip: 'zaslonka', id: 'd', x: 22, y: 0, w: 0.4, h: 3 },
      { tip: 'vyhod', id: 'v', x: 27, y: 0.5 },
    ];
    const bez = stsena(ob, 3, 0.6, 14, 0.6);
    for (let t = 0; t < 120; t++) bez.shag();
    expect(bez.najdi('plita')?.aktivna).toBe(false);

    const vKorke = stsena(ob, 3, 0.6, 14, 0.6);
    for (let t = 0; t < 120; t++) vKorke.shag({}, { korka: true });
    expect(vKorke.najdi('plita')?.aktivna).toBe(true);
  });
});

describe('кооп: ворота на двух плитах', () => {
  // Замер: одно тело держит две плиты ближе 2,5. Шаг 6 заведомо безопасен.
  const VOROTA: Obekt[] = [
    { tip: 'plita', id: 'p1', x: 12, y: 0, cel: 'd1', fiksiruetsya: false },
    { tip: 'plita', id: 'p2', x: 18, y: 0, cel: 'd2', fiksiruetsya: false },
    { tip: 'zaslonka', id: 'd1', x: 24, y: 0, w: 0.4, h: 3 },
    { tip: 'zaslonka', id: 'd2', x: 26, y: 0, w: 0.4, h: 3 },
    { tip: 'vyhod', id: 'v', x: 28, y: 0.5 },
  ];

  it('одиночка не держит обе: перешёл на вторую, первая отпустилась', () => {
    const s = stsena(VOROTA, 12, 0.6);
    for (let t = 0; t < 120; t++) s.shag();
    expect(s.najdi('plita', 'p1')?.aktivna).toBe(true);
    for (let t = 0; t < 300; t++) s.shag({ dx: 1 });
    expect(s.najdi('plita', 'p1')?.aktivna).toBe(false);
  });

  it('двое держат обе одновременно', () => {
    const s = stsena(VOROTA, 12, 0.6, 18, 0.6);
    for (let t = 0; t < 120; t++) s.shag();
    expect(s.najdi('plita', 'p1')?.aktivna).toBe(true);
    expect(s.najdi('plita', 'p2')?.aktivna).toBe(true);
    expect(s.najdi('zaslonka', 'd1')?.aktivna).toBe(true);
    expect(s.najdi('zaslonka', 'd2')?.aktivna).toBe(true);
  });
});

describe('кооп: выход требует обоих, рычаг и сбор — любого', () => {
  it('герой у выхода, спутник далеко — уровень не закрыт', () => {
    const s = stsena([{ tip: 'vyhod', id: 'v', x: 14, y: 0.5 }], 14, 0.6, 3, 0.6);
    for (let t = 0; t < 120; t++) s.shag();
    expect(s.igra.gotovo).toBe(false);
  });

  // Радиус выхода 0,8, а два тела расталкиваются на диаметр 1,0. Значит вдвоём выход берётся,
  // только если тела встают по обе стороны от точки. Для кооп-уровней это означает: выход ставится
  // там, где хватает места двоим, и подход к нему не должен быть уже одного тела.
  it('оба у выхода — уровень закрыт, если тела встали по обе стороны', () => {
    const s = stsena([{ tip: 'vyhod', id: 'v', x: 14, y: 0.5 }], 13.5, 0.6, 14.5, 0.6);
    for (let t = 0; t < 120; t++) s.shag();
    expect(s.igra.gotovo).toBe(true);
  });

  it('спутник в очереди за героем выход не закрывает: дальний вне радиуса', () => {
    const s = stsena([{ tip: 'vyhod', id: 'v', x: 14, y: 0.5 }], 14, 0.6, 15.1, 0.6);
    for (let t = 0; t < 120; t++) s.shag();
    expect(s.igra.gotovo).toBe(false);
  });

  it('соло закрывается одним телом, как раньше', () => {
    const s = stsena([{ tip: 'vyhod', id: 'v', x: 14, y: 0.5 }], 14, 0.6);
    for (let t = 0; t < 120; t++) s.shag();
    expect(s.igra.gotovo).toBe(true);
  });

  it('спутник дёргает рычаг и собирает жар-камень', () => {
    const ob: Obekt[] = [
      { tip: 'rychag', id: 'r', x: 14, y: 0.5, cel: 'd' },
      { tip: 'zaslonka', id: 'd', x: 22, y: 0, w: 0.4, h: 3 },
      { tip: 'zharkamen', id: 'z', x: 14.6, y: 0.5 },
      { tip: 'vyhod', id: 'v', x: 27, y: 0.5 },
    ];
    const s = stsena(ob, 3, 0.6, 14, 0.6);
    for (let t = 0; t < 120; t++) s.shag();
    expect(s.najdi('rychag')?.aktivna).toBe(true);
    expect(s.najdi('zaslonka')?.aktivna).toBe(true);
    expect(s.najdi('zharkamen')?.sobrana).toBe(true);
  });
});

describe('кооп: поток толкает оба тела', () => {
  it('спутник сносится потоком, и Корка тормозит его сильнее обычного тела', () => {
    const ob: Obekt[] = [
      { tip: 'potok', id: 'p', x: 8, y: 0, w: 14, h: 4, silaX: 40, silaY: 0 },
      { tip: 'vyhod', id: 'v', x: 27, y: 0.5 },
    ];
    const obych = stsena(ob, 3, 0.6, 12, 0.6);
    for (let t = 0; t < 180; t++) obych.shag();
    const snos = (obych.b as Telo).cx - 12;
    expect(snos).toBeGreaterThan(1);

    const korka = stsena(ob, 3, 0.6, 12, 0.6);
    for (let t = 0; t < 180; t++) korka.shag({}, { korka: true });
    expect((korka.b as Telo).cx - 12).toBeLessThan(snos);
  });
});
