// Разбор стоимости такта на уровне 1-1: фазы и положение статистов относительно многоугольников
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import { UROVNI } from '../src/level/spisok';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
const u = UROVNI[0]!;
function vnutri(t: [number, number][], x: number, y: number): boolean {
  let vn = false;
  for (let i = 0, j = t.length - 1; i < t.length; j = i++) {
    const [xi, yi] = t[i]!,
      [xj, yj] = t[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) vn = !vn;
  }
  return vn;
}
for (const variant of ['все', 'без игры', 'только мир', 'статисты снаружи стен']) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]);
  const igra = new Igra(mir, telo, ur);
  const st: Telo[] = [];
  let vStene = 0;
  for (let i = 0; i < 24; i++) {
    let x = 2 + (i % 12) * 3.5,
      y = 2 + Math.floor(i / 12) * 4;
    const vnutriSteny = u.poligony.some((p) => vnutri(p.tochki as [number, number][], x, y));
    if (vnutriSteny) vStene++;
    if (variant === 'статисты снаружи стен' && vnutriSteny) {
      x = u.start[0] + 1 + (i % 6) * 1.5;
      y = 8 + Math.floor(i / 6);
    }
    st.push(new Telo(mir, x, y));
  }
  const nam = { ...PUSTOE, dx: 1 };
  const takt = () => {
    if (variant !== 'только мир') igra.doShaga();
    telo.primenit(nam, igra.korkaSredy);
    for (const s of st) s.primenit(PUSTOE);
    mir.shag();
    telo.posle(nam);
    for (const s of st) s.posle(PUSTOE);
    if (variant === 'все' || variant === 'статисты снаружи стен') igra.takt(nam);
  };
  for (let t = 0; t < 200; t++) takt();
  const t0 = performance.now();
  for (let t = 0; t < 300; t++) takt();
  console.log(
    variant,
    ((performance.now() - t0) / 300).toFixed(3),
    'мс; статистов в стене:',
    vStene,
    'отрезков',
    mir.o,
  );
}
