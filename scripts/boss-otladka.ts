import { TroynoyKotyol } from '../src/game/boss';
import { MIR } from '../src/game/config/telo';
import { UROVEN_1_7 } from '../src/level/urovni/1-7';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
const mir = new Mir(MIR); const ur = zagruzitUroven(mir, UROVEN_1_7);
const b = new TroynoyKotyol(mir, ur.sushchnosti, []);
const daleko = { minX: -10, maxX: -9, minY: 0, maxY: 1 };
for (let t = 0; t < 140; t++) {
  b.takt(daleko, false, 0, false, 1);
  if (t % 20 === 0 || t > 118) console.log(t, b.kotly.map((k) => `${k.otkryt ? 'О' : 'з'}${k.taymer}`).join(' '), 'очередь', b.ocheredʹ, 'события', b.sobytiya.length);
}
