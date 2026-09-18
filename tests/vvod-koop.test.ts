// Второй ввод и кадр камеры на двоих. Проверяем без DOM: Vvod живёт и без window,
// клавиши задаются напрямую, камера считается чистой функцией.
import { describe, expect, it } from 'vitest';
import { RASKLADKI, Vvod } from '../src/input/vvod';
import { celKamery, nuzhnoDelenie } from '../src/render/kamera';

describe('ввод: второй игрок', () => {
  it('в соло стрелки двигают первого игрока', () => {
    const v = new Vvod();
    v.nazhat('ArrowRight');
    expect(v.sobrat().dx).toBe(1);
  });

  it('в кооперативе стрелки уходят второму, а WASD остаются первому', () => {
    const v = new Vvod();
    v.koop = true;
    v.nazhat('ArrowRight');
    expect(v.sobrat().dx).toBe(0);
    expect(v.sobratVtorogo().dx).toBe(1);

    v.nazhat('KeyA');
    expect(v.sobrat().dx).toBe(-1);
    expect(v.sobratVtorogo().dx).toBe(1);
  });

  it('способности второго игрока не задевают первого', () => {
    const v = new Vvod();
    v.koop = true;
    v.nazhat('Numpad1'); // Вязкость второго
    v.nazhat('KeyK'); // Расплав первого
    const p = v.sobrat();
    const vt = v.sobratVtorogo();
    expect(p.vyazkost).toBe(false);
    expect(p.rasplav).toBe(true);
    expect(vt.vyazkost).toBe(true);
    expect(vt.rasplav).toBe(false);
  });

  it('кнопка слияния своя у каждого', () => {
    const v = new Vvod();
    v.koop = true;
    expect(v.sliyanieNazhato(0)).toBe(false);
    expect(v.sliyanieNazhato(1)).toBe(false);
    v.nazhat(RASKLADKI.pervyy.sliyanie[0] as string);
    expect(v.sliyanieNazhato(0)).toBe(true);
    expect(v.sliyanieNazhato(1)).toBe(false);
    v.nazhat(RASKLADKI.vtoroy.sliyanie[0] as string);
    expect(v.sliyanieNazhato(1)).toBe(true);
  });

  it('раскладки не пересекаются ни одной клавишей', () => {
    const vse = (r: typeof RASKLADKI.pervyy) => Object.values(r).flat();
    const pervyy = new Set(vse(RASKLADKI.pervyy));
    const obshchie = vse(RASKLADKI.vtoroy).filter((k) => pervyy.has(k));
    expect(obshchie).toEqual([]);
  });
});

describe('камера: кадр на двоих', () => {
  const predel = { min: 26, maks: 60 };

  it('одно тело: центр по нему, масштаб максимальный', () => {
    const k = celKamery([{ cx: 5, cy: 2 }], 1280, 720, predel);
    expect(k.x).toBe(5);
    expect(k.y).toBe(3); // подъём на 1
    expect(k.masshtab).toBe(60);
    expect(k.vlezli).toBe(true);
  });

  it('двое рядом: центр посередине, масштаб не падает', () => {
    const k = celKamery(
      [
        { cx: 4, cy: 2 },
        { cx: 8, cy: 2 },
      ],
      1280,
      720,
      predel,
    );
    expect(k.x).toBe(6);
    expect(k.masshtab).toBe(60);
  });

  it('двое далеко: масштаб отъезжает', () => {
    const blizko = celKamery(
      [
        { cx: 0, cy: 0 },
        { cx: 6, cy: 0 },
      ],
      1280,
      720,
      predel,
    );
    const daleko = celKamery(
      [
        { cx: 0, cy: 0 },
        { cx: 20, cy: 0 },
      ],
      1280,
      720,
      predel,
    );
    expect(daleko.masshtab).toBeLessThan(blizko.masshtab);
    expect(daleko.x).toBe(10);
  });

  it('разошлись слишком далеко: кадр не вмещает, экран пора делить', () => {
    expect(
      nuzhnoDelenie(
        [
          { cx: 0, cy: 0 },
          { cx: 10, cy: 0 },
        ],
        1280,
        720,
        predel,
      ),
    ).toBe(false);
    expect(
      nuzhnoDelenie(
        [
          { cx: 0, cy: 0 },
          { cx: 80, cy: 0 },
        ],
        1280,
        720,
        predel,
      ),
    ).toBe(true);
  });

  it('расхождение по вертикали отдаляет так же, как по горизонтали', () => {
    const k = celKamery(
      [
        { cx: 0, cy: 0 },
        { cx: 0, cy: 30 },
      ],
      1280,
      720,
      predel,
    );
    expect(k.masshtab).toBeLessThan(predel.maks);
    expect(k.y).toBe(16); // середина 15 плюс подъём
  });
});
