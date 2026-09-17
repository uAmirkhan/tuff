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
let maxUdar = 0,
  faza = 0;
for (let t = 0; t < 700; t++) {
  const nam = faza === 0 ? { ...PUSTOE, dx: 1 } : { ...PUSTOE, korka: true };
  telo.primenit(nam, igra.korkaSredy);
  mir.shag();
  telo.posle(nam);
  igra.takt(nam);
  telo.schitatCentr();
  if (faza === 0 && telo.cx > 10.5) {
    faza = 1;
    console.log('фаза корка с такта', t, 'y', telo.cy.toFixed(2));
  }
  let u = 0;
  for (let k = sloy.ot; k < sloy.ot + sloy.n; k++) u = Math.max(u, mir.udar[k] as number);
  if (u > maxUdar) {
    maxUdar = u;
    console.log(
      'такт',
      t,
      'удар по слою',
      u.toFixed(3),
      'y',
      telo.cy.toFixed(2),
      'vKorke',
      telo.vKorke,
      'масса',
      mir.massa[telo.ot],
    );
  }
  if (igra.sobytiya.some((s) => s.tip === 'slomano')) console.log('такт', t, 'сломано');
}
console.log('конец y', telo.cy.toFixed(2), 'макс удар', maxUdar.toFixed(3));
