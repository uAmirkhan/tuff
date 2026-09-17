import { MIR } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

for (const zh of [0.25, 0.1, 0.05])
  for (const porogK of [1, 0.5, 0.25]) {
    const mir = new Mir(MIR);
    mir.vyazkostZhestkost = zh;
    mir.dobavitOtrezok(-10, 0, 10, 0);
    mir.dobavitOtrezok(2, 0, 2, 6);
    const telo = new Telo(mir, 1.2, 0.5);
    for (let t = 0; t < 60; t++) {
      telo.primenit(PUSTOE);
      mir.shag();
      telo.posle(PUSTOE);
    }
    let maks = 0;
    for (let t = 0; t < 240; t++) {
      const n = { ...PUSTOE, dx: 1, vyazkost: true };
      telo.primenit(n);
      for (let j = 0; j < mir.v; j++) mir.vPorog[j] = (mir.vPorog[j] as number) * 1; // порог как есть
      mir.shag();
      telo.posle(n);
      for (let j = 0; j < mir.v; j++) if (mir.vZhiva[j]) mir.vPorog[j] = 0.035 * porogK;
      maks = Math.max(maks, telo.centr()[1]);
    }
    // потолок
    const m2 = new Mir(MIR);
    m2.vyazkostZhestkost = zh;
    m2.dobavitOtrezok(-10, 0, 10, 0);
    m2.dobavitOtrezok(10, 2, -10, 2);
    const t2 = new Telo(m2, 0, 1.45);
    for (let t = 0; t < 330; t++) {
      const n = { ...PUSTOE, vyazkost: true };
      t2.primenit(n);
      m2.shag();
      t2.posle(n);
      for (let j = 0; j < m2.v; j++) if (m2.vZhiva[j]) m2.vPorog[j] = 0.05 * porogK;
    }
    console.log(
      'жёсткость',
      zh,
      'порог x',
      porogK,
      'подъём до',
      maks.toFixed(2),
      'потолок cy',
      t2.centr()[1].toFixed(2),
    );
  }
