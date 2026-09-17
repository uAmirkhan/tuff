// Ярус 1, уровень 1-7 «Криостат»: бак на гусеницах подъезжает, обдувает, открывает окно, хватает, отходит.
// Основной путь: Корка с кромки карниза на стекло в окне, три удара. Запасной: рычаг на карнизе включает
// форсунку, обдув под водой даёт трещину, две трещины. Стоящего героя бак хватает, но не давит.
import { describe, expect, it } from 'vitest';
import { KRIOSTAT } from '../src/game/config/boss';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { Kriostat } from '../src/game/kriostat';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_K1_7 } from '../src/level/urovni/k1-7';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

type Rezhim = 'glavnyy' | 'zapasnoy' | 'stoyat';
type Faza =
  | 'k-shcheli'
  | 'vverh'
  | 'na-karniz'
  | 'k-krayu'
  | 'zhdat'
  | 'shod'
  | 'uhod'
  | 'k-rychagu'
  | 'k-forsunke'
  | 'zhdat-obduv'
  | 'otoyti';

/** Бот арены: подъём в щель, по козырьку на карниз, ожидание у кромки, сход Коркой на стекло, уход */
function proyti(rezhim: Rezhim, maksTaktov: number) {
  const u = UROVEN_K1_7;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const boss = igra.boss;
  if (!(boss instanceof Kriostat)) throw new Error('босс не Криостат');
  const rychag = ur.sushchnosti.find((s) => s.id === 'r-promyvka');
  if (!rychag) throw new Error('нет рычага');
  let faza: Faza = rezhim === 'zapasnoy' ? 'k-rychagu' : 'k-shcheli';
  let udarovBylo = 0;
  let smertey = 0;
  let prevX = u.start[0];
  let shvatok = 0;
  let maksSmeshchenie = 0;
  let t = 0;
  for (; t < maksTaktov; t++) {
    telo.schitatCentr();
    const x = telo.cx;
    const y = telo.cy;
    const v = (x - prevX) * 60;
    prevX = x;
    const kCeli = (cel: number): number => {
      if (x < cel - 0.3) return v < 1.6 ? 1 : v > 2.6 ? -1 : 0;
      if (x > cel + 0.3) return v > -1.6 ? -1 : v < -2.6 ? 1 : 0;
      return v > 0.4 ? -1 : v < -0.4 ? 1 : 0;
    };
    if (igra.smerti !== smertey) {
      smertey = igra.smerti;
      faza = 'k-shcheli';
    }
    let nam: Namerenie = { ...PUSTOE };
    if (rezhim !== 'stoyat') {
      switch (faza) {
        case 'k-shcheli':
          nam =
            y < 1.5 && boss.cx < x && x - boss.cx < 2.6
              ? { ...PUSTOE, dx: -1, dy: 1, vyazkost: true }
              : { ...PUSTOE, dx: -1 };
          if (x < 0.9) faza = 'vverh';
          break;
        case 'vverh':
          nam = { ...PUSTOE, dx: -1, dy: 1, vyazkost: true };
          if (y >= 3.9) faza = 'na-karniz';
          break;
        case 'na-karniz':
          nam = { ...PUSTOE, dx: 1, dy: 1, vyazkost: true };
          if (x > 2.2) faza = rezhim === 'zapasnoy' && !rychag.aktivna ? 'k-rychagu' : 'k-krayu';
          if (y < 3.0) faza = 'k-shcheli';
          break;
        case 'k-rychagu':
          if (y < 3.0) {
            faza = 'k-shcheli';
            break;
          }
          nam = { ...PUSTOE, dx: x < 4 ? 1 : -1 };
          if (rychag.aktivna) faza = 'k-forsunke';
          break;
        case 'k-forsunke':
          nam = { ...PUSTOE, dx: x < 14 ? 1 : -1 };
          if (y < 1.5 && Math.abs(x - 14) < 0.4) faza = 'zhdat-obduv';
          break;
        case 'zhdat-obduv':
          nam = { ...PUSTOE, dx: Math.abs(x - 14) < 0.3 ? 0 : x < 14 ? 1 : -1 };
          if (boss.sostoyanie === 'okno') faza = 'otoyti';
          break;
        case 'otoyti':
          nam = { ...PUSTOE, dx: -1 };
          if (boss.sostoyanie === 'othod' || boss.sostoyanie === 'podhod') faza = 'k-forsunke';
          break;
        case 'k-krayu':
          nam = { ...PUSTOE, dx: kCeli(11.2) };
          if (y < 3.0) {
            faza = 'k-shcheli';
            break;
          }
          if (Math.abs(x - 11.2) < 0.4 && Math.abs(v) < 1) faza = 'zhdat';
          break;
        case 'zhdat':
          nam = { ...PUSTOE, dx: kCeli(11.2) };
          if (y < 3.0) {
            faza = 'k-shcheli';
            break;
          }
          if (boss.sostoyanie === 'okno' && boss.cx > 12.4 && boss.cx < 14.2) faza = 'shod';
          break;
        case 'shod':
          nam = { ...PUSTOE, dx: x < 11.7 ? 1 : 0, korka: true };
          if (boss.udarov > udarovBylo) {
            udarovBylo = boss.udarov;
            faza = 'uhod';
          }
          if (y < 1.5 && x > 11.5) faza = 'uhod';
          if (boss.sostoyanie === 'hvatka') faza = 'uhod';
          break;
        case 'uhod':
          nam =
            y < 1.5 && x > boss.cx + 0.5
              ? { ...PUSTOE, dx: -1, dy: 1, vyazkost: true }
              : { ...PUSTOE, dx: -1 };
          if (x < 9.5 && y < 1.5) faza = 'k-shcheli';
          if (x < 9.5 && y > 3.0) faza = 'k-krayu';
          break;
        default:
          break;
      }
    }
    if (boss.pobezhdyon && y < 1.5) nam = { ...PUSTOE, dx: 1 };
    igra.doShaga();
    telo.primenit(nam, igra.korkaSredy);
    mir.shag();
    telo.posle(nam);
    igra.takt(nam);
    for (const e of igra.sobytiya) if (e.tip === 'boss' && e.chto === 'схватил') shvatok++;
    maksSmeshchenie = Math.max(maksSmeshchenie, Math.abs(x - u.start[0]));
    if (igra.gotovo) break;
  }
  telo.schitatCentr();
  return { igra, telo, boss, t, shvatok, maksSmeshchenie };
}

describe('прохождение k1-7 «Криостат»', () => {
  it('уровень проходит валидатор, босс создан', () => {
    expect(proveritUroven(UROVEN_K1_7)).toEqual([]);
    const { boss } = proyti('stoyat', 1);
    expect(boss.sostoyanie).toBe('pauza');
  });

  it('основной путь: три удара Коркой с кромки карниза в окне, выход за гермозатвором', () => {
    const { igra, boss, t, telo } = proyti('glavnyy', 60 * 120);
    expect(boss.udarov).toBe(KRIOSTAT.udarovNaBak);
    expect(boss.pobezhdyon).toBe(true);
    expect(igra.smerti).toBe(0);
    expect(igra.gotovo, `t${t} тело в ${telo.cx.toFixed(1)},${telo.cy.toFixed(1)}`).toBe(true);
    expect(t).toBeLessThan(60 * 90);
  });

  it('запасной путь: рычаг, две трещины от перепада под форсункой, обломок перекатывается', () => {
    const { igra, boss, t } = proyti('zapasnoy', 60 * 120);
    expect(boss.treshchin).toBe(KRIOSTAT.treshchinNaBak);
    expect(boss.udarov).toBe(0);
    expect(boss.pobezhdyon).toBe(true);
    expect(igra.smerti).toBe(0);
    expect(igra.gotovo, `t${t}`).toBe(true);
  });

  it('стоящего героя бак хватает, но датчик не даёт его давить', () => {
    const { igra, shvatok, maksSmeshchenie, boss } = proyti('stoyat', 60 * 40);
    expect(shvatok).toBeGreaterThanOrEqual(1);
    expect(igra.zhar).toBeLessThan(100);
    expect(maksSmeshchenie).toBeLessThan(0.8);
    expect(boss.pobezhdyon).toBe(false);
  });
});
