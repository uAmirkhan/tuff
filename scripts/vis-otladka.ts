import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const u: Uroven = {
  versiya: 1,
  id: 'c',
  nazvanie: 'c',
  mysl: 'c',
  start: [7, 5.4],
  granicy: { minX: -2, minY: -6, maxX: 20, maxY: 10 },
  poligony: [
    {
      tochki: [
        [-2, -6],
        [20, -6],
        [20, -5],
        [-2, -5],
      ],
    },
  ],
  obekty: [
    { tip: 'cep', id: 'v', x: 7, y: 8, zvenyev: 10, prochnost: 'prochnaya' },
    { tip: 'vyhod', x: 18, y: 3.4 },
    { tip: 'serdce', x: 12, y: 3.4 },
    { tip: 'serdce', x: 13, y: 3.4 },
    { tip: 'serdce', x: 14, y: 3.4 },
  ],
};
const mir = new Mir(MIR);
const ur = zagruzitUroven(mir, u);
const telo = new Telo(mir, 7, 5.4);
const igra = new Igra(mir, telo, ur);
const cep = ur.sushchnosti[0]!;
for (let t = 0; t < 120; t++) {
  const nam = { ...PUSTOE, vyazkost: true, dy: t < 30 ? 1 : 0 };
  igra.doShaga();
  telo.primenit(nam, false);
  mir.shag();
  telo.posle(nam);
  igra.takt(nam);
  telo.schitatCentr();
  let zv = 0;
  for (let i = telo.ot; i < telo.ot + telo.n; i++) if (mir.kontaktZveno[i] !== -1) zv++;
  let vr = 0;
  for (let j = 0; j < mir.v; j++) if (mir.vZhiva[j]) vr++;
  const nizh = Math.min(...cep.zvenya.map((q) => mir.y[q] as number));
  if (t % 10 === 0 || t < 5)
    console.log(
      t,
      'y тела',
      telo.cy.toFixed(2),
      'верх',
      telo.gabarity().maxY.toFixed(2),
      'касаний звена',
      zv,
      'временных связей',
      vr,
      'низ цепи',
      nizh.toFixed(2),
      'порвано',
      mir.porvano.length,
    );
}
