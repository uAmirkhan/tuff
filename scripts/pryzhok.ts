import { MIR, TELO } from '../src/game/config/telo';
import { PUSTOE, Telo } from '../src/game/telo';
import { Mir } from '../src/physics/mir';

const T = TELO as unknown as { centrVybros: { zhestkost: number; kazhdyy: number } };
for (const zh of [0.9, 1.0])
  for (const s of [
    'покой',
    'сжатие после падения с 1',
    'сжатие после падения с 2',
    'вниз+выброс',
  ]) {
    T.centrVybros = { zhestkost: zh, kazhdyy: 1 };
    const mir = new Mir(MIR);
    mir.dobavitOtrezok(-10, 0, 10, 0);
    const h = s.includes('с 1') ? 1.5 : s.includes('с 2') ? 2.5 : 0.5;
    const telo = new Telo(mir, 0, h);
    let minH = Infinity;
    if (s === 'покой' || s === 'вниз+выброс')
      for (let t = 0; t < 180; t++) {
        const n = { ...PUSTOE, dy: s === 'вниз+выброс' ? -1 : 0 };
        telo.primenit(n);
        mir.shag();
        telo.posle(n);
      }
    else
      for (let t = 0; t < 300; t++) {
        telo.primenit(PUSTOE);
        mir.shag();
        telo.posle(PUSTOE);
        const hh = telo.gabarity().h;
        if (hh < minH) minH = hh;
        else if (telo.vKontakte()) break;
      }
    let maxY = 0;
    for (let t = 0; t < 120; t++) {
      const n = { ...PUSTOE, vybros: true, dy: 1 };
      telo.primenit(n);
      mir.shag();
      telo.posle(n);
      maxY = Math.max(maxY, telo.gabarity().minY);
    }
    console.log('жёсткость', zh, s.padEnd(26), 'низ тела поднялся до', maxY.toFixed(2), 'диаметра');
  }
