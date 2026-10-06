// Реактивные повадки прохождения уровней, у которых нет записанного плана.
// Один источник правды, как `plany.ts` для уровней с общим прогоном: отсюда их берут и
// соло-тесты `prohozhdenie-*`, и кооп-прогон `scripts/koop-yarus-poisk.ts`.
//
// Почему не план из нажатий: вода в k1-6 поднимается по регламенту, и путь зависит от того, где
// тело оказалось. Записанная последовательность такое не переживает, нужна повадка, которая
// смотрит на мир.
import type { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, type Telo } from '../src/game/telo';
import { DYRY } from '../src/level/urovni/k1-6';

export const SHAG = 1.6;
const POLKA = 0.3;
const SHIRINA = 16;
export const POLOK = DYRY.length;

export type Rezhim16 = 'bystro' | 'vetka' | 'stoyat';

/**
 * Зигзаг k1-6: на ярусе i катим к стене с дырой полки i+1, у стены Вязкостью вверх,
 * наверху по потолку на полку. Состояние живёт в замыкании, поэтому на каждое тело — свой вызов.
 */
export function zigzagK16(rezhim: Rezhim16 = 'bystro'): (telo: Telo, igra: Igra) => Namerenie {
  const napravlenie = (i: number): number => (i >= POLOK ? -1 : DYRY[i] === 'R' ? 1 : -1);
  let yarus = 0;
  let faza: 'katit' | 'vverh' | 'na-polku' = 'katit';
  let celY = 0;
  let stena = 1;
  let smertey = 0;
  return (telo, igra) => {
    const x = telo.cx;
    const y = telo.cy;
    if (igra.smerti !== smertey) {
      smertey = igra.smerti;
      faza = 'katit';
    }
    const nyne = Math.max(0, Math.floor((y - 0.6) / SHAG));
    if (nyne !== yarus && faza === 'katit') yarus = nyne;
    const dir = napravlenie(yarus);
    let nam: Namerenie = { ...PUSTOE };
    if (rezhim === 'stoyat') return nam;
    if (faza === 'katit') {
      nam = { ...PUSTOE, dx: dir as -1 | 0 | 1 };
      const uSteny = dir > 0 ? x > SHIRINA - 0.9 : x < 0.9;
      if (uSteny && yarus < POLOK) {
        faza = 'vverh';
        stena = dir;
        celY = SHAG * (yarus + 1) + POLKA + 0.7; // центр упирается в низ следующей полки
      }
    }
    if (faza === 'vverh') {
      nam = { ...PUSTOE, dx: stena as -1 | 0 | 1, dy: 1, vyazkost: true };
      if (y >= celY) faza = 'na-polku';
    }
    if (faza === 'na-polku') {
      nam = { ...PUSTOE, dx: -stena as -1 | 0 | 1, dy: 1, vyazkost: true };
      const daleko = stena > 0 ? x < SHIRINA - 2.2 : x > 2.2;
      if (daleko) {
        faza = 'katit';
        yarus = Math.max(0, Math.floor((y - 0.6) / SHAG));
      }
    }
    if (rezhim === 'vetka' && faza === 'katit' && yarus === 0 && igra.serdca === 0)
      nam = { ...PUSTOE, dx: -1 };
    return nam;
  };
}

export type RezhimStvol = 'steny' | 'potok';
type FazaStvol =
  | 'k-levoy'
  | 'lev1'
  | 'na-balku1'
  | 'k-pravoy'
  | 'v-potok'
  | 'letit'
  | 'prav'
  | 'na-balku2'
  | 'k-levoy2'
  | 'lev2'
  | 'po-kupolu'
  | 'k-vyhodu';

/**
 * Ствол: фазы по высоте, падение переводит в фазу по текущей высоте. Скорость считается по
 * разнице положений, поэтому повадка обязана вызываться КАЖДЫЙ такт и ровно один раз на тело.
 */
export function botStvola(
  rezhim: RezhimStvol,
  startX: number,
  startY: number,
): { vedyot: (telo: Telo) => Namerenie; padeniy: () => number } {
  const kCeli = (x: number, v: number, cel: number): number => {
    if (x < cel - 0.3) return v < 1.6 ? 1 : v > 2.6 ? -1 : 0;
    if (x > cel + 0.3) return v > -1.6 ? -1 : v < -2.6 ? 1 : 0;
    return v > 0.4 ? -1 : v < -0.4 ? 1 : 0;
  };
  let faza: FazaStvol = 'k-levoy';
  let prevX = startX;
  let prevY = startY;
  let padeniy = 0;
  const vedyot = (telo: Telo): Namerenie => {
    const x = telo.cx;
    const y = telo.cy;
    const vx = (x - prevX) * 60;
    const vy = (y - prevY) * 60;
    prevX = x;
    prevY = y;
    if (vy < -5 && faza !== 'letit') {
      padeniy++;
      faza = y < 13 ? 'k-levoy' : y < 24 ? 'k-pravoy' : 'k-levoy2';
    }
    let nam: Namerenie = { ...PUSTOE };
    switch (faza) {
      case 'k-levoy':
        nam = { ...PUSTOE, dx: -1 };
        if (x < 0.9 && y < 13) faza = 'lev1';
        break;
      case 'lev1':
        nam = { ...PUSTOE, dx: -1, dy: 1, vyazkost: true };
        if (y > 13.9) faza = 'na-balku1';
        break;
      case 'na-balku1':
        nam = { ...PUSTOE, dx: 1 };
        if (y < 14.1 && x > 1.6 && Math.abs(vy) < 0.5)
          faza = rezhim === 'potok' ? 'v-potok' : 'k-pravoy';
        if (y < 13) faza = 'k-levoy';
        break;
      case 'v-potok':
        nam = { ...PUSTOE, dx: kCeli(x, vx, 4) };
        if (vy > 3) faza = 'letit';
        break;
      case 'letit':
        nam = { ...PUSTOE, dx: kCeli(x, vx, 4) };
        if (y > 24.7 && Math.abs(vy) < 1.5) faza = 'k-levoy2';
        if (y < 13.6 && vy < 0) faza = 'k-pravoy';
        break;
      case 'k-pravoy':
        nam = { ...PUSTOE, dx: 1 };
        if (x > 7.1 && y > 13 && y < 24) faza = 'prav';
        if (y < 13) faza = 'k-levoy';
        break;
      case 'prav':
        nam = { ...PUSTOE, dx: 1, dy: 1, vyazkost: true };
        if (y > 24.9) faza = 'na-balku2';
        break;
      case 'na-balku2':
        nam = { ...PUSTOE, dx: -1 };
        if (y < 25.1 && x < 6.4 && Math.abs(vy) < 0.5) faza = 'k-levoy2';
        if (y < 24) faza = 'k-pravoy';
        break;
      case 'k-levoy2':
        nam = { ...PUSTOE, dx: -1 };
        if (x < 0.9 && y > 24) faza = 'lev2';
        if (y < 24 && y > 14 && x > 2.9 && x < 5.1) faza = 'letit';
        break;
      case 'lev2':
        nam = { ...PUSTOE, dx: -1, dy: 1, vyazkost: true };
        if (y > 35.8) faza = 'po-kupolu';
        break;
      case 'po-kupolu':
        nam = { ...PUSTOE, dx: 1, dy: 1, vyazkost: true };
        if (x > 2.2) faza = 'k-vyhodu';
        if (y < 34) faza = 'k-levoy2';
        break;
      case 'k-vyhodu':
        nam = { ...PUSTOE, dx: kCeli(x, vx, 5) };
        break;
      default:
        break;
    }
    return nam;
  };
  return { vedyot, padeniy: () => padeniy };
}
