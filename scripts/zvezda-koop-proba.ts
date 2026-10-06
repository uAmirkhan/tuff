// Достижима ли третья звезда в кооперативе на уровнях, которые вдвоём вообще проходятся.
// Условие: ни одно тело не опускалось ниже половины жара за уровень.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVNI } from '../src/level/spisok';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import { PLANY, type Shag } from '../tests/plany';

const OTSTAL = 1.5;
for (const id of ['k1-1', 'k1-4', 'k1-5']) {
  const u = UROVNI.find((x) => x.id === id);
  if (!u || !PLANY[id]) continue;
  const plan = PLANY[id] as Shag[];
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, u.start[0], u.start[1]);
  const b = new Telo(mir, u.start[0] - 1.2, u.start[1]);
  const igra = new Igra(mir, a, ur);
  igra.dobavitSputnika(b);
  let takty = 0;
  for (const sh of plan) {
    const n: Namerenie = { ...PUSTOE, ...sh.nam };
    for (let t = 0; t < sh.takty && !igra.gotovo; t++) {
      const raznica = a.cx - b.cx;
      const nb: Namerenie =
        Math.abs(raznica) <= OTSTAL ? n : raznica > 0 ? { ...n, dx: 1 } : { ...PUSTOE };
      igra.doShaga();
      a.primenit(n, igra.korkaSredy);
      b.primenit(nb, igra.korkaSredyTela(b));
      mir.shag();
      a.posle(n);
      b.posle(nb);
      igra.takt(n, [nb]);
      a.schitatCentr();
      b.schitatCentr();
      takty++;
    }
    if (igra.gotovo) break;
  }
  const mins = igra.zhizni.map((z) => z.minZhar.toFixed(1)).join(' / ');
  const zvezda = igra.zhizni.every((z) => z.minZhar >= 50);
  console.log(
    `${id}: ${(takty / 60).toFixed(1)} с, минимум жара ${mins}, звезда ${zvezda ? 'ДА' : 'нет'} (выход ${igra.gotovo})`,
  );
}
