// Диагностика контактов тел в сцене замера: сколько пар контуров рядом и где лежат статисты
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import { UROVNI } from '../src/level/spisok';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import type { Uroven } from '../src/level/format';
const u = UROVNI[0]!;
// Свободные точки уровня для статистов замера: сетка по ширине, точка и её окрестность 0,6 вне многоугольников
function svobodnyeTochki(u: Uroven, skolko: number): [number, number][] {
  const vnutri = (t: readonly (readonly [number, number])[], x: number, y: number): boolean => {
    let vn = false;
    for (let i = 0, j = t.length - 1; i < t.length; j = i++) {
      const [xi, yi] = t[i] as [number, number];
      const [xj, yj] = t[j] as [number, number];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) vn = !vn;
    }
    return vn;
  };
  const zanyata = (x: number, y: number): boolean =>
    u.poligony.some((p) =>
      [
        [0, 0],
        [0.6, 0],
        [-0.6, 0],
        [0, 0.6],
        [0, -0.6],
      ].some(([dx, dy]) => vnutri(p.tochki, x + (dx as number), y + (dy as number))),
    );
  const res: [number, number][] = [];
  for (const y of [1.2, 4, 7, 10])
    for (let x = u.granicy.minX + 1.5; x < u.granicy.maxX - 1 && res.length < skolko; x += 1.8)
      if (!zanyata(x, y)) res.push([x, y]);
  return res;
}

const mir = new Mir(MIR);
const ur = zagruzitUroven(mir, u);
const telo = new Telo(mir, u.start[0], u.start[1]);
const igra = new Igra(mir, telo, ur);
const st: Telo[] = [];
for (const [x, y] of svobodnyeTochki(u, 24)) {
  const s = new Telo(mir, x, y);
  mir.otklyuchitKontaktTel(s.kontur);
  st.push(s);
}
const STATIST = { ...PUSTOE, vyazkost: true }; // статист липнет там, где приземлился, и не скатывается в кучу
const nam = { ...PUSTOE, dx: 1 };
for (let t = 0; t < 400; t++) {
  igra.doShaga();
  telo.primenit(nam, igra.korkaSredy);
  for (const s of st) s.primenit(STATIST);
  mir.shag();
  telo.posle(nam);
  for (const s of st) s.posle(STATIST);
  igra.takt(nam);
}
const tela = [telo, ...st];
for (const b of tela) b.schitatCentr();
console.log('контуров', mir.c);
console.log(tela.map((b) => `${b.cx.toFixed(1)},${b.cy.toFixed(1)}`).join('  '));
let par = 0;
for (let a = 0; a < tela.length; a++)
  for (let b = a + 1; b < tela.length; b++) {
    const A = tela[a]!,
      B = tela[b]!;
    if (Math.hypot(A.cx - B.cx, A.cy - B.cy) < 1.3) par++;
  }
console.log('пар ближе 1,3:', par);
console.log(
  'старт:',
  svobodnyeTochki(u, 24)
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join('  '),
);
console.log('журнал:', mir.zhurnal.slice(0, 12).join(' | '));
