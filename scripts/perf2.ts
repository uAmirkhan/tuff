// Стоимость такта: тела врозь (без контактов тел) и тела в куче (контакты)
import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';
for (const kucha of [false, true]) {
  const mir = new Mir(MIR);
  mir.dobavitOtrezok(-200, 0, 200, 0);
  const tela: Telo[] = [];
  for (let i = 0; i < 25; i++) tela.push(new Telo(mir, kucha ? -30 + i * 2.4 : -190 + i * 15, 3 + (i % 3) * 2));
  const nam = { ...PUSTOE, dx: kucha ? 1 : 0 };
  for (let t = 0; t < 120; t++) { for (const b of tela) b.primenit(nam); mir.shag(); for (const b of tela) b.posle(nam); }
  const t0 = performance.now();
  for (let t = 0; t < 600; t++) { for (const b of tela) b.primenit(nam); mir.shag(); for (const b of tela) b.posle(nam); }
  console.log(kucha ? 'куча' : 'врозь', ((performance.now() - t0) / 600).toFixed(3), 'мс на такт при', mir.n, 'точках');
}
