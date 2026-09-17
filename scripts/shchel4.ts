import { MIR, TELO } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

(TELO as unknown as { obyom: object }).obyom = { zhestkost: 0.4, kazhdyy: 16 };
const mir = new Mir(MIR);
mir.dobavitOtrezok(-10, 0, 10, 0);
mir.dobavitOtrezok(0.8, 0.6, 0, 0.6);
mir.dobavitOtrezok(0, 0.6, 0, 3);
mir.dobavitOtrezok(0.8, 3, 0.8, 0.6);
const telo = new Telo(mir, -1.2, 0.5);
for (let t = 0; t < 60; t++) {
  telo.primenit(PUSTOE);
  mir.shag();
  telo.posle(PUSTOE);
}
for (let t = 0; t < 360; t++) {
  const n = { ...PUSTOE, dx: 1 };
  telo.primenit(n);
  mir.shag();
  telo.posle(n);
}
for (let t = 0; t < 600; t++) {
  const n = { ...PUSTOE, dx: 1, rasplav: true };
  telo.primenit(n);
  mir.shag();
  telo.posle(n);
}
const pts: string[] = [];
for (let i = 0; i < telo.n; i++) {
  const p = telo.ot + i;
  pts.push(
    `${i}:(${(mir.x[p] as number).toFixed(2)},${(mir.y[p] as number).toFixed(2)})${mir.kontakt[p] ? 'k' + mir.kontOtrezok[p] : ''}`,
  );
}
console.log(pts.join(' '));
console.log(
  'площадь',
  telo.ploshchad().toFixed(3),
  'цель',
  (mir.cPloshchad[0] as number).toFixed(3),
  'периметр',
  telo.perimetr().toFixed(2),
);
// длины связей +1
const l: string[] = [];
for (let i = 0; i < 16; i++) {
  const s = telo.svyaziKolco[i * 2] as number;
  const a = mir.sA[s] as number,
    b = mir.sB[s] as number;
  l.push(
    Math.hypot(
      (mir.x[b] as number) - (mir.x[a] as number),
      (mir.y[b] as number) - (mir.y[a] as number),
    ).toFixed(3),
  );
}
console.log(
  'связи +1:',
  l.join(' '),
  'покой',
  (mir.sDlina[telo.svyaziKolco[0] as number] as number).toFixed(3),
);
