import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

const mir = new Mir(MIR);
mir.dobavitOtrezok(-10, 0, 10, 0);
const ya = mir.dobavitOtrezok(1, 1.2, -1, 1.2);
const telo = new Telo(mir, 0, 0.65);
const nam = { ...PUSTOE, vyazkost: true };
for (let t = 0; t < 60; t++) {
  telo.primenit(nam);
  mir.shag();
  telo.posle(nam);
  if (t % 10 === 0) {
    const links: string[] = [];
    for (let i = telo.ot; i < telo.ot + telo.n; i++) {
      const j = mir.vPoTochke[i] as number;
      if (j !== -1) links.push(`${i - telo.ot}->o${mir.vOtrezok[j]}`);
    }
    const g = telo.gabarity();
    console.log(
      t,
      'cy',
      telo.centr()[1].toFixed(2),
      'minY',
      g.minY.toFixed(2),
      'maxY',
      g.maxY.toFixed(2),
      links.join(' '),
    );
  }
}
mir.ubratOtrezok(ya);
const ost: number[] = [];
for (let i = telo.ot; i < telo.ot + telo.n; i++)
  if (mir.vPoTochke[i] !== -1) ost.push(mir.vPoTochke[i] as number);
console.log(
  'после удаления живых связей у тела:',
  ost,
  'v=',
  mir.v,
  'zhiva',
  Array.from(mir.vZhiva.slice(0, mir.v)),
);
