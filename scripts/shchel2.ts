import { MIR, TELO } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

function probe(name: string, mod: (mir: Mir, telo: Telo) => void, dx = 1) {
  const mir = new Mir(MIR);
  mir.dobavitOtrezok(-10, 0, 10, 0);
  mir.dobavitOtrezok(0, 0.6, 0.8, 0.6);
  mir.dobavitOtrezok(0, 0.6, 0, 3);
  mir.dobavitOtrezok(0.8, 0.6, 0.8, 3);
  const telo = new Telo(mir, -1.2, 0.5);
  mod(mir, telo);
  for (let t = 0; t < 60; t++) {
    telo.primenit(PUSTOE);
    mir.shag();
    telo.posle(PUSTOE);
  }
  let proshlo = -1;
  for (let t = 0; t < 900; t++) {
    const nam = { ...PUSTOE, dx, rasplav: true };
    telo.primenit(nam);
    mir.shag();
    telo.posle(nam);
    // связи центра могли быть переопределены primenit: повторно применить мод
    mod(mir, telo);
    if (telo.gabarity().minX > 0.8) {
      proshlo = t;
      break;
    }
  }
  const g = telo.gabarity();
  console.log(
    name.padEnd(28),
    'прошло за',
    proshlo,
    'minX',
    g.minX.toFixed(2),
    'h',
    g.h.toFixed(2),
  );
}
probe('база', () => {});
probe('центр 0', (m, t) => {
  for (const s of t.svyaziCentr) m.sZhest[s] = 0;
});
probe('центр 0.01', (m, t) => {
  for (const s of t.svyaziCentr) m.sZhest[s] = 0.01;
});
probe('кольцо+2 мягче 0.1', (m, t) => {
  for (let i = 1; i < t.svyaziKolco.length; i += 2) m.sZhest[t.svyaziKolco[i] as number] = 0.1;
});
probe('тяга x2', () => {}, 2);
probe('тяга x4', () => {}, 4);
probe('трение 0', (m, t) => {
  for (let i = t.ot; i < t.ot + t.n; i++) m.trenie[i] = 0;
});
