import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

const mir = new Mir(MIR);
mir.dobavitOtrezok(-10, 0, 10, 0);
mir.dobavitOtrezok(-10, 8, -10, 0);
mir.dobavitOtrezok(-6, 0, -6, 1.2, 1, 1, 0);
mir.dobavitOtrezok(-6.6, 0, -6.6, 1.2, 1, 1, 0);
const telo = new Telo(mir, 0, 1.5);
for (let t = 0; t < 40; t++) {
  telo.primenit(PUSTOE);
  mir.shag();
  telo.posle(PUSTOE);
}
let maxSk = 0;
for (let t = 0; t < 140; t++) {
  const n = { ...PUSTOE, dx: -1 };
  telo.primenit(n);
  mir.shag();
  telo.posle(n);
  const [cx, cy] = telo.centr();
  let sk = 0;
  for (let i = telo.ot; i < telo.ot + telo.n; i++)
    sk = Math.max(
      sk,
      Math.hypot(
        (mir.x[i] as number) - (mir.px[i] as number),
        (mir.y[i] as number) - (mir.py[i] as number),
      ),
    );
  maxSk = Math.max(maxSk, sk);
  if (t % 10 === 0 || (cx < -5.5 && cx > -7))
    console.log(
      t,
      'cx',
      cx.toFixed(2),
      'cy',
      cy.toFixed(2),
      'maxY',
      telo.gabarity().maxY.toFixed(2),
      'скорость/такт',
      sk.toFixed(3),
    );
}
console.log('макс. смещение за такт', maxSk.toFixed(3), 'радиус точки 0.06');
