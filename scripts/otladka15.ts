import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_1_5 } from '../src/level/urovni/1-5';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const mir = new Mir(MIR);
const ur = zagruzitUroven(mir, UROVEN_1_5);
const telo = new Telo(mir, UROVEN_1_5.start[0], UROVEN_1_5.start[1]);
const igra = new Igra(mir, telo, ur);
let zharBylo = 100;
for (let t = 0; t < 900; t++) {
  const nam = { ...PUSTOE, dx: 1 };
  igra.doShaga();
  telo.primenit(nam, false);
  mir.shag();
  telo.posle(nam);
  igra.takt(nam);
  telo.schitatCentr();
  if (igra.zhar < zharBylo - 5) {
    zharBylo = igra.zhar;
    const v = igra.vragi.map((v) => {
      v.schitatCentr();
      return `${v.tip}(${v.cx.toFixed(1)},${v.cy.toFixed(1)})`;
    });
    console.log(
      'такт',
      t,
      'жар',
      igra.zhar.toFixed(0),
      'x',
      telo.cx.toFixed(1),
      'y',
      telo.cy.toFixed(1),
      'события',
      igra.sobytiya.map((s) => s.tip).join(','),
      v.join(' '),
    );
  }
  if (telo.cx > 16) break;
}
