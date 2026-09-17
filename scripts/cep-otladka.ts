import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { CEP, zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

CEP.zapas = 1.06;
const u: Uroven = {
  versiya: 1,
  id: 'c',
  nazvanie: 'c',
  mysl: 'c',
  start: [2, 3.2],
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
    {
      tochki: [
        [-2, -5],
        [4, -5],
        [4, 2.6],
        [-2, 2.6],
      ],
    },
    {
      tochki: [
        [10, -5],
        [20, -5],
        [20, 2.6],
        [10, 2.6],
      ],
    },
  ],
  obekty: [
    { tip: 'cep', id: 'm', x: 4, y: 2.7, x2: 10, y2: 2.7, zvenyev: 16, prochnost: 'prochnaya' },
    { tip: 'vyhod', x: 18, y: 3.4 },
    { tip: 'serdce', x: 12, y: 3.4 },
    { tip: 'serdce', x: 13, y: 3.4 },
    { tip: 'serdce', x: 14, y: 3.4 },
  ],
};
const mir = new Mir(MIR);
const ur = zagruzitUroven(mir, u);
const telo = new Telo(mir, 2, 3.2);
const igra = new Igra(mir, telo, ur);
const m = ur.sushchnosti[0]!;
const zy = () => m.zvenya.map((q) => (mir.y[q] as number).toFixed(1)).join(' ');
console.log('звенья y на старте:', zy());
for (let t = 0; t < 400; t++) {
  const nam = { ...PUSTOE, dx: 1 };
  igra.doShaga();
  telo.primenit(nam, false);
  mir.shag();
  telo.posle(nam);
  igra.takt(nam);
  telo.schitatCentr();
  if (t % 40 === 0 || igra.sobytiya.length)
    console.log(
      t,
      'x',
      telo.cx.toFixed(2),
      'y',
      telo.cy.toFixed(2),
      'события',
      igra.sobytiya.map((s) => s.tip + ('prichina' in s ? ':' + s.prichina : '')).join(','),
      'журнал',
      mir.zhurnal.length,
      'мин y звена',
      Math.min(...m.zvenya.map((q) => mir.y[q] as number)).toFixed(2),
    );
  if (telo.cy < -6) {
    console.log('провал на такте', t);
    break;
  }
}
