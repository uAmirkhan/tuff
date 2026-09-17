import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
const u: Uroven = { versiya: 1, id: 'v', nazvanie: 'v', mysl: 'v', start: [2, 0.6], granicy: { minX: -5, minY: -5, maxX: 30, maxY: 15 },
  poligony: [{ tochki: [[-5, -5], [30, -5], [30, 0], [-5, 0]] }],
  obekty: [{ tip: 'vyhod', x: 29, y: 1 }, { tip: 'serdce', x: 25, y: 1 }, { tip: 'serdce', x: 26, y: 1 }, { tip: 'serdce', x: 27, y: 1 }, { tip: 'shlakozhuk', x: 7, y: 0.4 }] };
const mir = new Mir(MIR); const ur = zagruzitUroven(mir, u); const telo = new Telo(mir, 2, 0.6); const igra = new Igra(mir, telo, ur);
const v = igra.vragi[0]!;
for (let t = 0; t < 480; t++) {
  igra.doShaga(); telo.primenit(PUSTOE, false); mir.shag(); telo.posle(PUSTOE); igra.takt(PUSTOE);
  if (t % 60 === 59) {
    v.schitatCentr(); telo.schitatCentr();
    let kt = 0, kv = 0; for (let i = telo.ot; i < telo.ot + telo.n; i++) if (mir.kontaktTel[i]) kt++; for (let i = v.ot; i < v.ot + v.n; i++) if (mir.kontaktTel[i]) kv++;
    const g = v.gabarity(); const gt = telo.gabarity();
    console.log(t, 'враг x', v.cx.toFixed(2), 'y', v.cy.toFixed(2), 'наЗемле', v.naZemle(), 'gab', g.minX.toFixed(2), g.maxX.toFixed(2), '| игрок', telo.cx.toFixed(2), gt.minX.toFixed(2), gt.maxX.toFixed(2), '| контакты', kt, kv, 'жар', igra.zhar.toFixed(1), 'контур врага', v.kontur, 'игрока', telo.kontur);
  }
}
