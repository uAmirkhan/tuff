import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

const mir = new Mir(MIR);
mir.dobavitOtrezok(-10, 0, 10, 0);
mir.dobavitOtrezok(0, 0.6, 0.8, 0.6);
mir.dobavitOtrezok(0, 0.6, 0, 3);
mir.dobavitOtrezok(0.8, 0.6, 0.8, 3);
const telo = new Telo(mir, -1.2, 0.5);
for (let t = 0; t < 60; t++) {
  telo.primenit(PUSTOE);
  mir.shag();
  telo.posle(PUSTOE);
}
for (let t = 0; t < 900; t++) {
  const nam = { ...PUSTOE, dx: 1, rasplav: true };
  telo.primenit(nam);
  mir.shag();
  telo.posle(nam);
  if (t % 60 === 0) {
    const g = telo.gabarity();
    const [cx, cy] = telo.centr();
    let vnutri = 0;
    for (let i = telo.ot; i < telo.ot + telo.n; i++)
      if ((mir.x[i] as number) > 0 && (mir.x[i] as number) < 0.8) vnutri++;
    console.log(
      t,
      'minX',
      g.minX.toFixed(2),
      'maxX',
      g.maxX.toFixed(2),
      'h',
      g.h.toFixed(2),
      'w',
      g.w.toFixed(2),
      'cy',
      cy.toFixed(2),
      'внутри',
      vnutri,
      'per',
      telo.perimetr().toFixed(2),
    );
  }
}
