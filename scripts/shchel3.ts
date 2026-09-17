import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

const mir = new Mir(MIR);
mir.dobavitOtrezok(-10, 0, 10, 0);
mir.dobavitOtrezok(0.8, 0.6, 0, 0.6);
mir.dobavitOtrezok(0, 0.6, 0, 3);
mir.dobavitOtrezok(0.8, 3, 0.8, 0.6);
const telo = new Telo(mir, -1.2, 0.5);
const log = (t: number, f: string) => {
  const g = telo.gabarity();
  let vn = 0;
  for (let i = telo.ot; i < telo.ot + telo.n; i++)
    if ((mir.x[i] as number) > 0 && (mir.x[i] as number) < 0.8) vn++;
  console.log(
    f,
    t,
    'minX',
    g.minX.toFixed(2),
    'maxX',
    g.maxX.toFixed(2),
    'h',
    g.h.toFixed(2),
    'внутри',
    vn,
  );
};
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
  if (t % 90 === 0) log(t, 'без');
}
for (let t = 0; t < 900; t++) {
  const n = { ...PUSTOE, dx: 1, rasplav: true };
  telo.primenit(n);
  mir.shag();
  telo.posle(n);
  if (t % 90 === 0) log(t, 'расплав');
  if (telo.gabarity().minX > 0.8) {
    log(t, 'ПРОШЛО');
    break;
  }
}
