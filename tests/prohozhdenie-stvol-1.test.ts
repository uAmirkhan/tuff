// Бонус «Ствол: подъём 1» (режим Жерла): по стенам крепежа и балкам до купола, лифт вентиляции как
// короткий путь, иней на стене сбрасывает замешкавшегося: таймер хватки три секунды.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_STVOL_1 } from '../src/level/urovni/stvol-1';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

type Rezhim = 'steny' | 'potok';
type Faza =
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

function stsena() {
  const u = UROVEN_STVOL_1;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const shag = (nam: Namerenie) => {
    igra.doShaga();
    telo.primenit(nam, igra.korkaSredy);
    mir.shag();
    telo.posle(nam);
    igra.takt(nam);
    telo.schitatCentr();
  };
  return { u, mir, ur, telo, igra, shag };
}

/** Бот ствола: фазы по высоте, падение переводит в фазу по текущей высоте */
function proyti(rezhim: Rezhim, maksTaktov: number) {
  const { u, telo, igra, shag } = stsena();
  const kCeli = (x: number, v: number, cel: number): number => {
    if (x < cel - 0.3) return v < 1.6 ? 1 : v > 2.6 ? -1 : 0;
    if (x > cel + 0.3) return v > -1.6 ? -1 : v < -2.6 ? 1 : 0;
    return v > 0.4 ? -1 : v < -0.4 ? 1 : 0;
  };
  let faza: Faza = 'k-levoy';
  let prevX = u.start[0];
  let prevY = u.start[1];
  let padeniy = 0;
  let t = 0;
  for (; t < maksTaktov; t++) {
    telo.schitatCentr();
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
        if (y < 14.1 && x > 1.6 && Math.abs(vy) < 0.5) faza = rezhim === 'potok' ? 'v-potok' : 'k-pravoy';
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
    shag(nam);
    if (igra.gotovo) break;
  }
  return { igra, telo, t, padeniy };
}

describe('бонус «Ствол: подъём 1»', () => {
  it('уровень проходит валидатор, режим Жерла, открывается 12 звёздами', () => {
    expect(proveritUroven(UROVEN_STVOL_1)).toEqual([]);
    expect(UROVEN_STVOL_1.rezhim).toBe('zherlo');
    expect(UROVEN_STVOL_1.zvyozdDlyaOtkrytiya).toBe(12);
  });

  it('по стенам и балкам бот доходит до купола за минуту', () => {
    const { igra, telo, t } = proyti('steny', 60 * 90);
    expect(igra.gotovo, `t${t} тело в ${telo.cx.toFixed(1)},${telo.cy.toFixed(1)}`).toBe(true);
    expect(t).toBeLessThan(60 * 60);
    expect(igra.maksVysota).toBeGreaterThan(33);
    expect(igra.smerti).toBe(0);
  });

  it('лифт вентиляции с первой балки короче стен', () => {
    const steny = proyti('steny', 60 * 90);
    const potok = proyti('potok', 60 * 90);
    expect(potok.igra.gotovo).toBe(true);
    expect(potok.t).toBeLessThan(steny.t);
  });

  it('замешкавшегося на полосе инея хватка отпускает через три секунды: тело падает', () => {
    const { telo, igra, shag } = stsena();
    for (let k = 0; k < 60; k++) shag({ ...PUSTOE, dx: -1 });
    const lezt: Namerenie = { ...PUSTOE, dx: -1, dy: 1, vyazkost: true };
    let t = 0;
    while (telo.cy < 9.2 && t++ < 60 * 20) shag(lezt);
    expect(telo.cy).toBeGreaterThan(9); // в полосе инея 8..10,4
    const visel: Namerenie = { ...PUSTOE, dx: -1, vyazkost: true };
    let maks = telo.cy;
    for (let k = 0; k < 60 * 5; k++) {
      shag(visel);
      if (telo.cy > maks) maks = telo.cy;
    }
    expect(igra.korkaSredy || telo.cy < 8).toBe(true);
    expect(telo.cy).toBeLessThan(8); // упал ниже полосы
    expect(igra.dlinneysheePadenie).toBeGreaterThan(2);
  });
});
