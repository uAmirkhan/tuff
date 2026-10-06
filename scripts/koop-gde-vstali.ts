// Где кооп расходится с соло: тот же план, позиции по шагам плана.
// Нужно, чтобы не гадать по конечной координате, а увидеть шаг, на котором пара отстала.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVNI } from '../src/level/spisok';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import { PLANY, type Shag } from '../tests/plany';

const OTSTAL = 1.5;
const id = process.argv[2] ?? 'k1-2';
const u = UROVNI.find((x) => x.id === id);
if (!u) throw new Error(`нет уровня ${id}`);
const plan = PLANY[id] as Shag[];

function progon(vdvoyom: boolean, zhdet: boolean) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u as NonNullable<typeof u>);
  const a = new Telo(
    mir,
    (u as NonNullable<typeof u>).start[0],
    (u as NonNullable<typeof u>).start[1],
  );
  const b = vdvoyom
    ? new Telo(
        mir,
        (u as NonNullable<typeof u>).start[0] + 1.2,
        (u as NonNullable<typeof u>).start[1],
      )
    : null;
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const sled: string[] = [];
  for (let i = 0; i < plan.length && !igra.gotovo; i++) {
    const sh = plan[i] as Shag;
    const n: Namerenie = { ...PUSTOE, ...sh.nam };
    for (let t = 0; t < sh.takty && !igra.gotovo; t++) {
      let nb: Namerenie = n;
      if (b) {
        const raznica = a.cx - b.cx;
        if (Math.abs(raznica) <= OTSTAL) nb = n;
        else if (raznica > 0) nb = { ...n, dx: 1 };
        else nb = zhdet ? { ...PUSTOE } : { ...n, dx: -1 };
      }
      igra.doShaga();
      a.primenit(n, igra.korkaSredy);
      b?.primenit(nb, igra.korkaSredyTela(b));
      mir.shag();
      a.posle(n);
      b?.posle(nb);
      igra.takt(n, b ? [nb] : []);
      a.schitatCentr();
      b?.schitatCentr();
    }
    sled.push(
      `${String(i + 1).padStart(2)} ${JSON.stringify(sh.nam).padEnd(42)} A ${a.cx.toFixed(1).padStart(5)},${a.cy.toFixed(1).padStart(5)}${b ? `  Б ${b.cx.toFixed(1).padStart(5)},${b.cy.toFixed(1).padStart(5)}` : ''}`,
    );
  }
  return { sled, gotovo: igra.gotovo, zhurnal: mir.zhurnal };
}

const odin = progon(false, false);
const para = progon(true, true);
console.log(`=== ${id}: соло против кооп (напарник ждёт) ===`);
for (let i = 0; i < Math.max(odin.sled.length, para.sled.length); i++) {
  console.log(`СОЛО  ${odin.sled[i] ?? '—'}`);
  console.log(`КООП  ${para.sled[i] ?? '—'}`);
}
console.log(`соло дошёл: ${odin.gotovo}, пара дошла: ${para.gotovo}`);
console.log('сторожа пары:', para.zhurnal.slice(0, 3).join(' | ') || 'чисто');
