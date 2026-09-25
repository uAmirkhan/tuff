// Прогон комнаты koop-1 по плану: дойти, слиться, взять ледяной уступ общим выбросом, выйти вдвоём.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_KOOP_1 } from '../src/level/urovni/koop-1';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

type Shag = { takty: number; nam: Partial<Namerenie>; slit?: boolean; podpis: string };

const PLAN: Shag[] = [
  { takty: 300, nam: { dx: 1 }, podpis: 'перелезли обучающий блок' },
  { takty: 40, nam: {}, slit: true, podpis: 'слились перед воротами' },
  { takty: 600, nam: { dx: 1, vybros: true, dy: 1 }, slit: true, podpis: 'разбег и общий выброс' },
  { takty: 240, nam: { dx: 1 }, slit: true, podpis: 'идём к выходу' },
];

const mir = new Mir(MIR);
const ur = zagruzitUroven(mir, UROVEN_KOOP_1);
const a = new Telo(mir, UROVEN_KOOP_1.start[0], UROVEN_KOOP_1.start[1]);
const b = new Telo(mir, UROVEN_KOOP_1.start[0] + 1.2, UROVEN_KOOP_1.start[1]);
const igra = new Igra(mir, a, ur);
igra.dobavitSputnika(b);

let slito = false;
for (const sh of PLAN) {
  const n: Namerenie = { ...PUSTOE, ...sh.nam };
  for (let t = 0; t < sh.takty; t++) {
    if (sh.slit && !slito) slito = igra.slit();
    if (!sh.slit && slito) {
      igra.razdelit();
      slito = false;
    }
    igra.doShaga();
    a.primenit(n, igra.korkaSredy);
    b.primenit(n, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(n);
    b.posle(n);
    igra.takt(n, [n]);
    a.schitatCentr();
    b.schitatCentr();
    if (igra.gotovo) break;
  }
  console.log(
    `${sh.podpis.padEnd(26)} A ${a.cx.toFixed(1)},${a.cy.toFixed(1)}  Б ${b.cx.toFixed(1)},${b.cy.toFixed(1)}  слито ${slito}  жар ${igra.zhar.toFixed(0)}  смерти ${igra.smerti}`,
  );
  if (igra.gotovo) break;
}
console.log(
  igra.gotovo
    ? `ВЫХОД взят за ${(igra.takty / 60).toFixed(1)} с, очки ${igra.ochki}`
    : 'выход НЕ взят',
);
console.log('сторожа:', mir.zhurnal.slice(0, 3).join(' | ') || 'чисто');
