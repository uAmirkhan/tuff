// Приёмка koop-2: выход должен браться ТОЛЬКО слитой парой.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_KOOP_2 } from '../src/level/urovni/koop-2';
import { proveritUroven } from '../src/level/validator';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const o = proveritUroven(UROVEN_KOOP_2);
console.log(o.length ? `валидатор: ${o.join('; ')}` : 'валидатор: чисто');

function progon(rezhim: 'одиночка' | 'двое' | 'слитые') {
  const u = UROVEN_KOOP_2;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, u.start[0], u.start[1]);
  const b = rezhim === 'одиночка' ? null : new Telo(mir, u.start[0] + 1.2, u.start[1]);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (n: Namerenie) => {
    igra.doShaga();
    a.primenit(n, igra.korkaSredy);
    b?.primenit(n, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(n);
    b?.posle(n);
    igra.takt(n, b ? [n] : []);
    a.schitatCentr();
    b?.schitatCentr();
  };
  for (let t = 0; t < 40; t++) shag(PUSTOE);
  const slilos = rezhim === 'слитые' ? igra.slit() : false;
  const idti: Namerenie = { ...PUSTOE, dx: 1 };
  for (let t = 0; t < 1200 && !igra.gotovo; t++) shag(idti);
  return { igra, a, b, slilos };
}

console.log('режим      слились  выход  A            Б            смерти');
for (const r of ['одиночка', 'двое', 'слитые'] as const) {
  const q = progon(r);
  console.log(
    `${r.padEnd(10)} ${String(q.slilos).padEnd(8)} ${(q.igra.gotovo ? 'ВЗЯТ' : ' -  ').padEnd(6)} ${`${q.a.cx.toFixed(1)},${q.a.cy.toFixed(1)}`.padEnd(12)} ${(q.b ? `${q.b.cx.toFixed(1)},${q.b.cy.toFixed(1)}` : '—').padEnd(12)} ${q.igra.smerti}`,
  );
}
