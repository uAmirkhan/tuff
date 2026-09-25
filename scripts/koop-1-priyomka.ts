// Приёмка комнаты koop-1: ворота должны брать ТОЛЬКО слитой парой.
// Три случая: одиночка, двое несклеенных, слитая пара.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVEN_KOOP_1 } from '../src/level/urovni/koop-1';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

export function progon(rezhim: 'одиночка' | 'двое' | 'слитые'): {
  vzyali: boolean;
  a: [number, number];
  b: [number, number] | null;
  storozhey: number;
  smerti: number;
} {
  const u = UROVEN_KOOP_1;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, u.start[0], u.start[1]);
  const b = rezhim === 'одиночка' ? null : new Telo(mir, u.start[0] + 1.2, u.start[1]);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (n: Namerenie) => {
    igra.doShaga();
    a.primenit(n, igra.korkaSredy);
    b?.primenit(n, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(n);
    b?.posle(n);
    igra.takt(n, b ? [n] : []);
    a.schitatCentr();
    b?.schitatCentr();
  };
  for (let t = 0; t < 30; t++) shag(PUSTOE);
  if (rezhim === 'слитые') igra.slit();
  // как в замере: сперва чистый разбег, только потом разбег с Выбросом
  const nazad: Namerenie = { ...PUSTOE, dx: -1 };
  const idti: Namerenie = { ...PUSTOE, dx: 1 };
  const pryg: Namerenie = { ...PUSTOE, dx: 1, vybros: true, dy: 1 };
  // фазы по месту, а не по тактам: слитая пара едет медленнее, и счёт тактов врёт
  for (let t = 0; t < 600 && a.cx > 4; t++) shag(nazad); // отойти за разбегом
  for (let t = 0; t < 600 && a.cx < 26; t++) shag(idti); // разгон по ровному полу
  for (let t = 0; t < 900 && !igra.gotovo; t++) shag(pryg); // общий выброс
  return {
    vzyali: igra.gotovo,
    a: [a.cx, a.cy],
    b: b ? [b.cx, b.cy] : null,
    storozhey: mir.zhurnal.length,
    smerti: igra.smerti,
  };
}

if (process.argv[1]?.includes('koop-1-priyomka')) {
  console.log('режим      выход  положение                         сторожа смерти');
  for (const r of ['одиночка', 'двое', 'слитые'] as const) {
    const q = progon(r);
    const poz = `A ${q.a[0].toFixed(1)},${q.a[1].toFixed(1)}${q.b ? `  Б ${q.b[0].toFixed(1)},${q.b[1].toFixed(1)}` : '            '}`;
    console.log(
      `${r.padEnd(10)} ${(q.vzyali ? 'ВЗЯТ' : ' -  ').padEnd(6)} ${poz.padEnd(33)} ${String(q.storozhey).padEnd(7)} ${q.smerti}`,
    );
  }
}
