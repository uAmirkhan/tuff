// Замер стоимости такта на ПК при целевом числе точек (400): тела героя плюс «враги» и ящики
import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';
const mir = new Mir(MIR);
mir.dobavitOtrezok(-40, 0, 40, 0); mir.dobavitOtrezok(40, 0, 40, 30); mir.dobavitOtrezok(-40, 30, -40, 0);
for (let i = 0; i < 40; i++) mir.dobavitOtrezok(-30 + i * 1.5, 2 + (i % 5), -30 + i * 1.5 + 1, 2 + (i % 5), 1, 1, 0);
const tela: Telo[] = [];
for (let i = 0; i < 25; i++) tela.push(new Telo(mir, -30 + i * 2.4, 3 + (i % 3) * 2));
console.log('точек', mir.n, 'связей', mir.m, 'отрезков', mir.k);
const nam = { ...PUSTOE, dx: 1 };
const t0 = performance.now();
const N = 600;
for (let t = 0; t < N; t++) { for (const b of tela) b.primenit(nam); mir.shag(); for (const b of tela) b.posle(nam); }
const ms = (performance.now() - t0) / N;
console.log(`такт: ${ms.toFixed(3)} мс на ПК при ${mir.n} точках; бюджет 60 к/с = 16,7 мс`);
