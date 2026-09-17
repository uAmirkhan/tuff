import { describe, expect, it } from 'vitest';
import { Analitika, uchastok } from '../src/meta/analitika';
import { nazvanieUrovnya, t, vybratYazyk } from '../src/meta/lokalizaciya';

describe('аналитика', () => {
  it('копит события, сводка по уровню считает смерти и время', () => {
    let hranenie = '';
    const a = new Analitika((s) => {
      hranenie = s;
    });
    a.sobytie('level_start', { uroven: '1-1' });
    a.sobytie('death', { uroven: '1-1', uchastok: 2, prichina: 'падение' });
    a.sobytie('death', { uroven: '1-1', uchastok: 2, prichina: 'падение' });
    a.sobytie('level_complete', { uroven: '1-1', vremya: 95 });
    a.sobytie('death', { uroven: '1-2', uchastok: 0, prichina: 'шипы' });
    const s = a.svodka('1-1');
    expect(s).toEqual({ smerti: 2, vremya: 95, proyden: true, vyhodov: 0 });
    expect(JSON.parse(hranenie).length).toBe(5);
  });

  it('приёмник, который падает, не роняет игру', () => {
    const a = new Analitika();
    a.dobavitPriyomnik(() => {
      throw new Error('сломан');
    });
    expect(() => a.sobytie('x')).not.toThrow();
    expect(a.bufer.length).toBe(1);
  });

  it('участок по x', () => {
    expect(uchastok(0, 46)).toBe(0);
    expect(uchastok(45.9, 46)).toBe(5);
    expect(uchastok(23, 46)).toBe(3);
    expect(uchastok(-5, 46)).toBe(0);
  });
});

describe('локализация', () => {
  it('язык по коду и строки', () => {
    expect(vybratYazyk('ru-RU')).toBe('ru');
    expect(vybratYazyk('en-US')).toBe('en');
    expect(vybratYazyk('tr')).toBe('en');
    expect(t('ru', 'dalshe')).toBe('Дальше');
    expect(t('en', 'dalshe')).toBe('Next');
    expect(nazvanieUrovnya('en', '1-3', 'Щель')).toBe('The Slit');
    expect(nazvanieUrovnya('en', 'нет', 'запас')).toBe('запас');
  });
});
