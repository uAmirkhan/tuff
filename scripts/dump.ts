import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

const mir = new Mir(MIR);
mir.dobavitOtrezok(-50, 0, 50, 0, 1, 1);
const telo = new Telo(mir, 0, 10.5);
for (let t = 0; t < 420; t++) {
  telo.primenit(PUSTOE);
  mir.shag();
  telo.posle(PUSTOE);
  const g = telo.gabarity();
  if (t % 10 === 0 || (t > 230 && t < 300))
    console.log(
      t,
      'w',
      g.w.toFixed(3),
      'h',
      g.h.toFixed(3),
      'h/w',
      (g.h / g.w).toFixed(3),
      'minY',
      g.minY.toFixed(3),
      'per',
      telo.perimetr().toFixed(3),
    );
}
