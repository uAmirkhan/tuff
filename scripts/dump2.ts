import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

function run(h: number, n: number) {
  const mir = new Mir(MIR);
  mir.dobavitOtrezok(-50, 0, 50, 0, 1, 1);
  const telo = new Telo(mir, 0, h + 0.5);
  for (let t = 0; t < n; t++) {
    telo.primenit(PUSTOE);
    mir.shag();
    telo.posle(PUSTOE);
  }
  const g = telo.gabarity();
  return { w: g.w.toFixed(3), h: g.h.toFixed(3), a: (g.h / g.w).toFixed(3) };
}
console.log('покой 240', run(0.2, 240), '600', run(0.2, 600), '1200', run(0.2, 1200));
console.log('падение 600', run(10, 600), '1200', run(10, 1200));
