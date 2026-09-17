import { describe, expect, it } from 'vitest';
import {
  HranilishchePamyati,
  schitatZvezdy,
  sohranitProgress,
  zagruzitProgress,
  zapisatRezultat,
} from '../src/meta/sohranenie';

describe('сохранение прогресса', () => {
  it('пустое хранилище даёт пустой прогресс, мусор не роняет', () => {
    const h = new HranilishchePamyati();
    expect(zagruzitProgress(h).urovni).toEqual({});
    h.pisat('{мусор');
    expect(zagruzitProgress(h).versiya).toBe(1);
    h.pisat(JSON.stringify({ versiya: 99 }));
    expect(zagruzitProgress(h).urovni).toEqual({});
  });

  it('результат сохраняет лучшее и объединяет сердце-камни между попытками', () => {
    const h = new HranilishchePamyati();
    const p = zagruzitProgress(h);
    zapisatRezultat(p, '1-1', {
      takty: 3000,
      ochki: 60,
      serdca: [true, false, false],
      porogOchkov: 100,
    });
    sohranitProgress(h, p);
    const p2 = zagruzitProgress(h);
    const r = zapisatRezultat(p2, '1-1', {
      takty: 4000,
      ochki: 120,
      serdca: [false, true, true],
      porogOchkov: 100,
    });
    expect(r.luchsheeVremya).toBe(3000);
    expect(r.luchshieOchki).toBe(120);
    expect(r.serdca).toEqual([true, true, true]);
    expect(r.zvezdy).toBe(3);
  });

  it('звёзды: 1 за проход, 2 за очки, 3 за все сердца', () => {
    expect(schitatZvezdy(false, 999, 10, 3, 3)).toBe(0);
    expect(schitatZvezdy(true, 5, 10, 3, 3)).toBe(1);
    expect(schitatZvezdy(true, 10, 10, 2, 3)).toBe(2);
    expect(schitatZvezdy(true, 10, 10, 3, 3)).toBe(3);
  });
});
