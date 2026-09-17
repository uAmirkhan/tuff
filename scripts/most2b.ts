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
const most = ur.sushchnosti.find((s) => s.id === 'most-2')!;
const shag = (nam: any) => {
  igra.doShaga();
  telo.primenit(nam, igra.korkaSredy);
  mir.shag();
  telo.posle(nam);
  igra.takt(nam);
  telo.schitatCentr();
};
for (let t = 0; t < 900 && telo.cx <= 16; t++) shag({ ...PUSTOE, dx: 1 });
for (let t = 0; t < 300 && telo.cx <= 21; t++) shag({ ...PUSTOE, dx: 1 });
console.log('перед коркой x', telo.cx.toFixed(2), 'y', telo.cy.toFixed(2));
for (let t = 0; t < 1200; t++) {
  shag({ ...PUSTOE, korka: true });
  let maxS = 0;
  for (const sv of most.svyazi) {
    if (!mir.sZhiva[sv]) continue;
    const a = mir.sA[sv]!,
      b = mir.sB[sv]!;
    maxS = Math.max(
      maxS,
      Math.hypot(mir.x[b]! - mir.x[a]!, mir.y[b]! - mir.y[a]!) / mir.sDlina[sv]! - 1,
    );
  }
  if (t % 150 === 0 || mir.porvano.length)
    console.log(
      t,
      'x',
      telo.cx.toFixed(2),
      'y',
      telo.cy.toFixed(2),
      'растяжение',
      (maxS * 100).toFixed(1) + '%',
      'порвано',
      mir.porvano.length,
      'vKorke',
      telo.vKorke,
      'масса',
      mir.massa[telo.ot],
    );
  if (telo.cy < 1.5) {
    console.log('упало на такте', t);
    break;
  }
}
