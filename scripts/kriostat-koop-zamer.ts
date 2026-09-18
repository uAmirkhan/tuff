import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import type { Kriostat } from '../src/game/kriostat';
import { PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_K1_7 } from '../src/level/urovni/k1-7';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function progon(ax: number, bx: number | null, taktov: number) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, UROVEN_K1_7);
  const a = new Telo(mir, ax, 1.2);
  const b = bx === null ? null : new Telo(mir, bx, 1.2);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const bak = () => (igra.boss as Kriostat).bak;
  let minX = bak().x;
  for (let t = 0; t < taktov; t++) {
    igra.doShaga();
    a.primenit(PUSTOE, igra.korkaSredy);
    b?.primenit(PUSTOE, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(PUSTOE);
    b?.posle(PUSTOE);
    igra.takt(PUSTOE, b ? [PUSTOE] : []);
    a.schitatCentr();
    b?.schitatCentr();
    if (bak().x < minX) minX = bak().x;
  }
  b?.schitatCentr();
  return { minX, bx: b?.cx ?? 0, smerti: igra.smerti, sost: (igra.boss as Kriostat).sostoyanie };
}

for (const taktov of [900, 1800, 3600, 7200]) {
  const odin = progon(4, null, taktov);
  console.log(
    `${taktov} тактов, соло: бак дошёл до ${odin.minX.toFixed(2)}, состояние ${odin.sost}`,
  );
}
for (const bx of [20, 18, 16]) {
  const s = progon(4, bx, 7200);
  console.log(
    `напарник на ${bx}: бак дошёл до ${s.minX.toFixed(2)}, напарник на ${s.bx.toFixed(2)}, смертей ${s.smerti}`,
  );
}
