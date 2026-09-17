// Проверка: такт не выделяет память. Запуск: node --expose-gc --import tsx scripts/alloc.ts
import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

const mir = new Mir(MIR);
mir.dobavitOtrezok(-40, 0, 40, 0);
mir.dobavitOtrezok(40, 0, 40, 30);
mir.dobavitOtrezok(-40, 30, -40, 0);
for (let i = 0; i < 40; i++)
  mir.dobavitOtrezok(-30 + i * 1.5, 2 + (i % 5), -30 + i * 1.5 + 1, 2 + (i % 5), 1, 1, 0);
const tela: Telo[] = [];
for (let i = 0; i < 25; i++) tela.push(new Telo(mir, -30 + i * 2.4, 3 + (i % 3) * 2));
const nam = { ...PUSTOE, dx: 1, vyazkost: true };
const g = (globalThis as { gc?: () => void }).gc;
for (let t = 0; t < 120; t++) {
  for (const b of tela) b.primenit(nam);
  mir.shag();
  for (const b of tela) b.posle(nam);
}
g?.();
const h0 = process.memoryUsage().heapUsed;
for (let t = 0; t < 1200; t++) {
  for (const b of tela) b.primenit(nam);
  mir.shag();
  for (const b of tela) b.posle(nam);
}
const h1 = process.memoryUsage().heapUsed;
g?.();
const h2 = process.memoryUsage().heapUsed;
console.log(
  `куча до ${(h0 / 1024).toFixed(0)} КБ, после 1200 тактов без gc ${(h1 / 1024).toFixed(0)} КБ, после gc ${(h2 / 1024).toFixed(0)} КБ; выделено за такт ~${((h1 - h0) / 1200).toFixed(0)} байт`,
);
