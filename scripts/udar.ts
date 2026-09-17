import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

for (const korka of [false, true]) {
  const mir = new Mir(MIR);
  mir.dobavitOtrezok(-10, -5, 10, -5);
  const blok = mir.dobavitOtrezok(-1, 0, 1, 0, 1, 1);
  const telo = new Telo(mir, 0, 3.5);
  let max = 0;
  for (let t = 0; t < 300; t++) {
    telo.primenit({ ...PUSTOE, korka });
    mir.shag();
    telo.posle(PUSTOE);
    max = Math.max(max, mir.udar[blok] as number);
  }
  console.log('korka', korka, 'max udar', max.toFixed(4));
}
