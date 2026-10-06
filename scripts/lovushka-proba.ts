// Ловушка или глупость бота: сажаем ОДИНОЧКУ в место, где застрял напарник, и пытаемся
// выбраться всеми способностями.
//
// ВАЖНО, стоило одного ложного вывода: сажать тело прямо в полость под ЦЕЛЫМ хрупким полом
// нечестно. В игре туда попадают, проломив этот пол, и выход остаётся открытым. Поэтому
// перед посадкой крышка проламывается падением тела в Корке сверху, и только потом
// проверяется выход.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVNI } from '../src/level/spisok';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const mesta: { id: string; x: number; y: number; opisanie: string }[] = [
  { id: 'k1-2', x: 19, y: -0.1, opisanie: 'щель под тонкой полкой 17,5-20,5' },
  { id: 'k1-3', x: 12.6, y: -1.3, opisanie: 'яма, где просел напарник' },
];

const popytki: [string, Partial<Namerenie>][] = [
  ['идти вправо', { dx: 1 }],
  ['вправо Расплавом', { dx: 1, rasplav: true }],
  ['вправо Вязкостью вверх', { dx: 1, dy: 1, vyazkost: true }],
  ['вправо Выбросом', { dx: 1, vybros: true, dy: 1 }],
  ['влево Вязкостью вверх', { dx: -1, dy: 1, vyazkost: true }],
  ['влево Расплавом', { dx: -1, rasplav: true }],
];

for (const m of mesta) {
  const u = UROVNI.find((x) => x.id === m.id);
  if (!u) continue;
  console.log(`=== ${m.id}: ${m.opisanie}, посадка в ${m.x},${m.y} ===`);
  for (const [imya, nam] of popytki) {
    const mir = new Mir(MIR);
    const ur = zagruzitUroven(mir, u);
    // проломить крышку: тело в Корке падает сверху на то же место
    const lom = new Telo(mir, m.x, m.y + 2.5);
    const igraL = new Igra(mir, lom, ur);
    const korka: Namerenie = { ...PUSTOE, korka: true };
    for (let i = 0; i < 180; i++) {
      igraL.doShaga();
      lom.primenit(korka, igraL.korkaSredy);
      mir.shag();
      lom.posle(korka);
      igraL.takt(korka);
    }
    lom.vosstanovit(-40, -40, 'убрать'); // ломщик уходит с дороги
    const t = new Telo(mir, m.x, m.y);
    const igra = new Igra(mir, t, ur);
    const n: Namerenie = { ...PUSTOE, ...nam };
    let maksY = t.cy;
    let maksX = t.cx;
    for (let i = 0; i < 900; i++) {
      igra.doShaga();
      t.primenit(n, igra.korkaSredy);
      mir.shag();
      t.posle(n);
      igra.takt(n);
      t.schitatCentr();
      if (t.cy > maksY) maksY = t.cy;
      if (t.cx > maksX) maksX = t.cx;
    }
    console.log(
      `  ${imya.padEnd(24)} итог ${t.cx.toFixed(1).padStart(5)},${t.cy.toFixed(1).padStart(5)}  выше всего ${maksY.toFixed(1).padStart(5)}  правее всего ${maksX.toFixed(1).padStart(5)}  смертей ${igra.smerti}`,
    );
  }
}
