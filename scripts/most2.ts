import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_1_5 } from '../src/level/urovni/1-5';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

for (const korka of [false, true]) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, UROVEN_1_5);
  const telo = new Telo(mir, 2, 3.2);
  const igra = new Igra(mir, telo, ur);
  const most = ur.sushchnosti.find((s) => s.id === 'most-2')!;
  let faza = 0,
    maxS = 0;
  for (let t = 0; t < 1500; t++) {
    telo.schitatCentr();
    if (faza === 0 && telo.cx > 21.3) faza = 1;
    const nam = faza === 0 ? { ...PUSTOE, dx: 1 } : { ...PUSTOE, korka };
    igra.doShaga();
    telo.primenit(nam, false);
    mir.shag();
    telo.posle(nam);
    igra.takt(nam);
    if (faza === 1)
      for (const sv of most.svyazi) {
        if (!mir.sZhiva[sv]) continue;
        const a = mir.sA[sv]!,
          b = mir.sB[sv]!;
        maxS = Math.max(
          maxS,
          Math.hypot(mir.x[b]! - mir.x[a]!, mir.y[b]! - mir.y[a]!) / mir.sDlina[sv]! - 1,
        );
      }
    if (faza === 1 && t > 1400) break;
  }
  telo.schitatCentr();
  console.log(
    'корка',
    korka,
    'макс растяжение моста 2',
    (maxS * 100).toFixed(1) + '%',
    'x',
    telo.cx.toFixed(1),
    'y',
    telo.cy.toFixed(1),
    'порвано',
    most.svyazi.some((sv) => !mir.sZhiva[sv]),
  );
}
