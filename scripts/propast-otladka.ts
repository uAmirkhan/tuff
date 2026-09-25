import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const LEVO = 24;
const W = 8;
const PRAVO = LEVO + W;
const u: Uroven = {
  versiya: 1,
  id: 'otladka',
  nazvanie: 'Отладка',
  mysl: 'Куда девается тело',
  start: [3, 0.6],
  granicy: { minX: -1, minY: -14, maxX: PRAVO + 16, maxY: 14 },
  vremyaZvezdy: 60,
  poligony: [
    {
      tochki: [
        [-1, -14],
        [0, -14],
        [0, 12],
        [-1, 12],
      ],
    },
    {
      tochki: [
        [PRAVO + 15, -14],
        [PRAVO + 16, -14],
        [PRAVO + 16, 12],
        [PRAVO + 15, 12],
      ],
    },
    {
      tochki: [
        [-1, -14],
        [LEVO, -14],
        [LEVO, 0],
        [-1, 0],
      ],
    },
    {
      tochki: [
        [PRAVO, -14],
        [PRAVO + 16, -14],
        [PRAVO + 16, 0],
        [PRAVO, 0],
      ],
    },
  ],
  obekty: [{ tip: 'vyhod', id: 'v', x: PRAVO + 8, y: 0.5 }],
};
const mir = new Mir(MIR);
const ur = zagruzitUroven(mir, u);
const a = new Telo(mir, 3, 0.6);
const igra = new Igra(mir, a, ur);
const nam: Namerenie = { ...PUSTOE, dx: 1, vybros: true, dy: 1 };
console.log(`пропасть от ${LEVO} до ${PRAVO} (ширина ${W}), пол на 0`);
for (let t = 0; t < 900; t++) {
  igra.doShaga();
  a.primenit(nam, igra.korkaSredy);
  mir.shag();
  a.posle(nam);
  igra.takt(nam);
  a.schitatCentr();
  if (t % 60 === 59 || (a.cx > LEVO - 2 && a.cx < PRAVO + 2 && t % 10 === 9))
    console.log(
      `  т${String(t + 1).padStart(3)}  x ${a.cx.toFixed(2)}  y ${a.cy.toFixed(2)}  смерти ${igra.smerti}`,
    );
  if (a.cx > PRAVO + 1 && a.cy > -1) {
    console.log(`  ПЕРЕШЁЛ на такте ${t + 1}`);
    break;
  }
}
