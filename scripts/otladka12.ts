import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_1_2 } from '../src/level/urovni/1-2';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const mir = new Mir(MIR);
const ur = zagruzitUroven(mir, UROVEN_1_2);
const telo = new Telo(mir, UROVEN_1_2.start[0], UROVEN_1_2.start[1]);
const igra = new Igra(mir, telo, ur);
const sloy = ur.poligonOtrezki[3] as { ot: number; n: number };
let maxUdar = 0;
for (let t = 0; t < 600; t++) {
  const nam = t < 300 ? { ...PUSTOE, dx: 1 } : PUSTOE;
  telo.primenit(nam, igra.korkaSredy);
  mir.shag();
  telo.posle(nam);
  igra.takt(nam);
  telo.schitatCentr();
  for (let k = sloy.ot; k < sloy.ot + sloy.n; k++)
    maxUdar = Math.max(maxUdar, mir.udar[k] as number);
  if (igra.sobytiya.some((s) => s.tip === 'slomano'))
    console.log(
      'такт',
      t,
      'сломано, x',
      telo.cx.toFixed(2),
      'y',
      telo.cy.toFixed(2),
      'макс удар по слою',
      maxUdar.toFixed(3),
      'корка',
      telo.vKorke,
    );
  if (telo.cx > 10.5 && t < 300) {
    console.log('дошёл до шахты на такте', t, 'y', telo.cy.toFixed(2));
  }
}
console.log('конец: x', telo.cx.toFixed(2), 'y', telo.cy.toFixed(2), 'сломано', ur.slomany);
