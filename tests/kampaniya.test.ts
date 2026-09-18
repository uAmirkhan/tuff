// Кампания яруса 1: порядок уровней, открытие по цепочке, бонус по звёздам, звёзды по времени
// и условию третьей звезды там, где нет сердце-камней на очки.
import { describe, expect, it } from 'vitest';
import { ISPYTATELNYE, sleduyushchiy, UROVNI, urovenOtkryt, zvyozdMira } from '../src/level/spisok';
import { proveritUroven, proveritYarus } from '../src/level/validator';
import { schitatZvezdy } from '../src/meta/sohranenie';

describe('кампания яруса 1', () => {
  it('порядок: семь уровней Криоблока и бонус «Ствол», все проходят валидатор', () => {
    expect(UROVNI.map((u) => u.id)).toEqual([
      'k1-1',
      'k1-2',
      'k1-3',
      'k1-4',
      'k1-5',
      'k1-6',
      'k1-7',
      'stvol-1',
    ]);
    for (const u of [...UROVNI, ...ISPYTATELNYE]) expect(proveritUroven(u), u.id).toEqual([]);
    const ids = new Set([...UROVNI, ...ISPYTATELNYE].map((u) => u.id));
    expect(ids.size).toBe(UROVNI.length + ISPYTATELNYE.length);
  });

  it('ярус целиком проходит сводные требования 13-plany-urovney §0', () => {
    expect(proveritYarus(UROVNI)).toEqual([]);
  });

  it('proveritYarus ловит нехватку узла, панелей, окон в ствол и в будущее', () => {
    const bezUzla = UROVNI.filter((u) => u.id !== 'k1-5');
    const oshibki = proveritYarus(bezUzla);
    expect(oshibki).toContain('узлов теплотрассы на ярусе 0, нужен один');
    expect(oshibki).toContain('панелей на ярусе 2, нужно три');
  });

  it('«дальше» идёт по цепочке и не ведёт в бонус, бонус открывается 12 звёздами', () => {
    expect(sleduyushchiy('k1-1')?.id).toBe('k1-2');
    expect(sleduyushchiy('k1-7')).toBeUndefined();
    const bonus = UROVNI[UROVNI.length - 1];
    if (!bonus) throw new Error('нет бонуса');
    expect(bonus.rezhim).toBe('zherlo');
    expect(
      urovenOtkryt(
        bonus,
        () => true,
        () => 1,
      ),
    ).toBe(false);
    expect(
      urovenOtkryt(
        bonus,
        () => true,
        () => 2,
      ),
    ).toBe(true);
    expect(zvyozdMira(() => 3)).toBe(21);
    const k12 = UROVNI[1];
    if (!k12) throw new Error('нет k1-2');
    expect(
      urovenOtkryt(
        k12,
        () => false,
        () => 0,
      ),
    ).toBe(false);
    expect(
      urovenOtkryt(
        k12,
        (id) => id === 'k1-1',
        () => 0,
      ),
    ).toBe(true);
  });

  it('звёзды: по очкам и сердцам без цели по времени, по времени и условию с целью', () => {
    expect(schitatZvezdy(false, 100, 50, 3, 3)).toBe(0);
    expect(schitatZvezdy(true, 10, 50, 0, 3)).toBe(1);
    expect(schitatZvezdy(true, 60, 50, 1, 3)).toBe(2);
    expect(schitatZvezdy(true, 60, 50, 3, 3)).toBe(3);
    // погоня и босс: вторая звезда за время, третья за условие (жар, камень, запасной путь)
    const cel = { takty: 60 * 50, cel: 60, tretya: false };
    expect(schitatZvezdy(true, 0, 0, 0, 0, cel)).toBe(2);
    expect(schitatZvezdy(true, 0, 0, 0, 0, { ...cel, takty: 60 * 70 })).toBe(1);
    expect(schitatZvezdy(true, 0, 0, 0, 0, { ...cel, tretya: true })).toBe(3);
    expect(schitatZvezdy(true, 0, 0, 0, 0, { ...cel, takty: 60 * 70, tretya: true })).toBe(1);
  });
});
