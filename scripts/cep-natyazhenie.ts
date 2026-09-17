// Растяжение звеньев моста под телом, стоящим посередине, обычным и в Корке
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { CEP, zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
const u: Uroven = { versiya: 1, id: 'c', nazvanie: 'c', mysl: 'c', start: [2, 3.2], granicy: { minX: -2, minY: -6, maxX: 20, maxY: 10 },
  poligony: [{ tochki: [[-2, -6], [20, -6], [20, -5], [-2, -5]] }, { tochki: [[-2, -5], [4, -5], [4, 2.6], [-2, 2.6]] }, { tochki: [[10, -5], [20, -5], [20, 2.6], [10, 2.6]] }],
  obekty: [{ tip: 'cep', id: 'm', x: 4, y: 2.7, x2: 10, y2: 2.7, zvenyev: 16, prochnost: 'prochnaya' }, { tip: 'vyhod', x: 19.5, y: 3.4 }, { tip: 'serdce', x: 12, y: 3.4 }, { tip: 'serdce', x: 13, y: 3.4 }, { tip: 'serdce', x: 14, y: 3.4 }] };
for (const zapas of [1.03, 1.06, 1.1]) for (const korka of [false, true]) {
  CEP.zapas = zapas;
  const mir = new Mir(MIR); const ur = zagruzitUroven(mir, u); const telo = new Telo(mir, 2, 3.2); const igra = new Igra(mir, telo, ur);
  const m = ur.sushchnosti[0]!;
  let maxStretch = 0, naMostu = false;
  for (let t = 0; t < 600; t++) {
    telo.schitatCentr();
    if (telo.cx > 6.8) naMostu = true;
    const nam = naMostu ? { ...PUSTOE, korka } : { ...PUSTOE, dx: 1 };
    igra.doShaga(); telo.primenit(nam, false); mir.shag(); telo.posle(nam); igra.takt(nam);
    if (naMostu) for (const sv of m.svyazi) { if (!mir.sZhiva[sv]) continue; const a = mir.sA[sv]!, b = mir.sB[sv]!; const d = Math.hypot(mir.x[b]! - mir.x[a]!, mir.y[b]! - mir.y[a]!); maxStretch = Math.max(maxStretch, d / mir.sDlina[sv]! - 1); }
  }
  telo.schitatCentr();
  console.log('запас', zapas, 'корка', korka, 'макс растяжение', (maxStretch * 100).toFixed(1) + '%', 'x', telo.cx.toFixed(2), 'y тела', telo.cy.toFixed(2));
}
