import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

for (const dy of [0, -1])
  for (const dxk of [1, 2]) {
    const mir = new Mir(MIR);
    mir.dobavitOtrezok(-10, 0, 10, 0);
    mir.dobavitOtrezok(0.8, 0.6, 0, 0.6);
    mir.dobavitOtrezok(0, 0.6, 0, 3);
    mir.dobavitOtrezok(0.8, 3, 0.8, 0.6);
    const telo = new Telo(mir, -1.2, 0.5);
    for (let t = 0; t < 60; t++) {
      telo.primenit(PUSTOE);
      mir.shag();
      telo.posle(PUSTOE);
    }
    for (let t = 0; t < 360; t++) {
      const n = { ...PUSTOE, dx: 1 };
      telo.primenit(n);
      mir.shag();
      telo.posle(n);
    }
    const bez = telo.gabarity().minX;
    let proshlo = -1,
      maxAsp = 0;
    for (let t = 0; t < 900; t++) {
      const n = { ...PUSTOE, dx: dxk, dy, rasplav: true };
      telo.primenit(n);
      mir.shag();
      telo.posle(n);
      const g = telo.gabarity();
      maxAsp = Math.max(maxAsp, g.w / g.h);
      if (g.minX > 0.8) {
        proshlo = t;
        break;
      }
    }
    console.log(
      'dy',
      dy,
      'dx',
      dxk,
      'без расплава minX',
      bez.toFixed(2),
      'прошло за',
      proshlo,
      'maxAsp',
      maxAsp.toFixed(2),
    );
  }
