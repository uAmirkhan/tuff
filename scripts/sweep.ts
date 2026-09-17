import { MIR, TELO } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

const T = TELO as unknown as { obyom: { zhestkost: number; kazhdyy: number } };
function metriki() {
  // 1. покой
  let mir = new Mir(MIR);
  mir.dobavitOtrezok(-50, 0, 50, 0);
  let telo = new Telo(mir, 0, 0.7);
  for (let t = 0; t < 240; t++) {
    telo.primenit(PUSTOE);
    mir.shag();
    telo.posle(PUSTOE);
  }
  const gp = telo.gabarity();
  const aPok = gp.h / gp.w;
  const hPok = gp.h;
  // 2. падение с 10
  mir = new Mir(MIR);
  mir.dobavitOtrezok(-50, 0, 50, 0);
  telo = new Telo(mir, 0, 10.5);
  let minH = Infinity,
    tMin = 0,
    a60 = 0,
    plOk = true,
    minY = 1;
  const pl0 = telo.ploshchad();
  for (let t = 0; t < 600; t++) {
    telo.primenit(PUSTOE);
    mir.shag();
    telo.posle(PUSTOE);
    const g = telo.gabarity();
    if (g.h < minH) {
      minH = g.h;
      tMin = t;
    }
    if (t === tMin + 60) a60 = g.h / g.w;
    if (telo.ploshchad() * pl0 <= 0) plOk = false;
    minY = Math.min(minY, g.minY);
  }
  // 3. щель по сценарию теста
  mir = new Mir(MIR);
  mir.dobavitOtrezok(-10, 0, 10, 0);
  mir.dobavitOtrezok(0.8, 0.6, 0, 0.6);
  mir.dobavitOtrezok(0, 0.6, 0, 3);
  mir.dobavitOtrezok(0.8, 3, 0.8, 0.6);
  telo = new Telo(mir, -1.2, 0.5);
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
  const bezProshlo = telo.gabarity().minX > 0.8;
  let proshlo = -1,
    maxAsp = 0;
  for (let t = 0; t < 900; t++) {
    const n = { ...PUSTOE, dx: 1, rasplav: true };
    telo.primenit(n);
    mir.shag();
    telo.posle(n);
    const g = telo.gabarity();
    maxAsp = Math.max(maxAsp, g.w / g.h);
    if (g.minX > 0.8) {
      proshlo = t;
      break;
    }
  }
  return {
    aPok: aPok.toFixed(2),
    szhat: (minH / hPok).toFixed(2),
    a60: a60.toFixed(2),
    plOk,
    minY: minY.toFixed(2),
    bezProshlo,
    proshlo,
    maxAsp: maxAsp.toFixed(2),
  };
}
for (const [z, k] of [
  [0.15, 1],
  [0.08, 1],
  [0.04, 1],
  [0.3, 4],
  [0.5, 8],
  [0.8, 16],
  [0.4, 16],
] as [number, number][]) {
  T.obyom = { zhestkost: z, kazhdyy: k };
  console.log(`обём ${z} каждый ${k}`.padEnd(24), JSON.stringify(metriki()));
}
