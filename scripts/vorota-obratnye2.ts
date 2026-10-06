// Обратные ворота: проходит ТОЛЬКО слитая пара. Строгая развёртка.
//
// Что исправлено против дымовой пробы продакта и против моего же провала на габарите:
//   1. «Взял» засчитывается, только когда НАВЕРХУ ОБА тела, а не одно. Выход всё равно требует
//      обоих, так что одно тело наверху — это не проход, а застрявшая пара.
//   2. Перебирается момент слияния: на габарите ворота умерли ровно потому, что пара сливалась
//      у самой щели, а замер этого не пробовал.
//   3. Перебирается длина разбега, а не одна фаза.
//   4. Перебирается высота уступа и ширина дыры.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const KRAY = 20;

function komnata(shirina: number, vys: number): Uroven {
  const dal = KRAY + shirina;
  return {
    versiya: 1,
    id: 'obratnye',
    nazvanie: 'Обратные ворота',
    mysl: 'Только вместе',
    start: [10, 0.6],
    granicy: { minX: -1, minY: -3, maxX: 40, maxY: 20 },
    vremyaZvezdy: 60,
    poligony: [
      {
        tochki: [
          [-1, -3],
          [0, -3],
          [0, 18],
          [-1, 18],
        ],
      },
      {
        tochki: [
          [39, -3],
          [40, -3],
          [40, 18],
          [39, 18],
        ],
      },
      {
        tochki: [
          [-1, -3],
          [KRAY, -3],
          [KRAY, 0],
          [-1, 0],
        ],
      },
      // дно дыры: провал не убивает, но встать под уступ нельзя
      {
        tochki: [
          [KRAY, -3],
          [dal, -3],
          [dal, -1],
          [KRAY, -1],
        ],
      },
      {
        tochki: [
          [dal, -3],
          [39, -3],
          [39, vys],
          [dal, vys],
        ],
        material: 'lyod',
      },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: 36, y: vys + 0.5 }],
  };
}

type Rezhim = 'одиночка' | 'двое' | 'слитые';

/** slitNaX: где сливаться. -1 — заранее, иначе по достижении этой координаты. */
function vzyali(
  shirina: number,
  vys: number,
  rezhim: Rezhim,
  x0: number,
  slitNaX: number,
): boolean {
  const u = komnata(shirina, vys);
  const dal = KRAY + shirina;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, x0, 0.6);
  const b = rezhim === 'одиночка' ? null : new Telo(mir, x0 + 0.9, 0.6);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (nam: Partial<Namerenie>) => {
    const n = { ...PUSTOE, ...nam };
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
  for (let t = 0; t < 30; t++) shag({});
  if (rezhim === 'слитые' && slitNaX < 0 && !igra.slit()) return false;
  // подход, по дороге сливаемся в назначенной точке
  for (let t = 0; t < 300; t++) {
    shag({ dx: 1 });
    if (rezhim === 'слитые' && slitNaX >= 0 && !igra.slito && a.cx >= slitNaX) igra.slit();
    if (a.cx > KRAY - 1) break;
  }
  if (rezhim === 'слитые' && !igra.slito) igra.slit();
  for (let t = 0; t < 420; t++) {
    shag({ dx: 1, dy: 1, vybros: true });
    // СТРОГО: наверху должны быть ОБА
    const na = a.cx > dal && a.cy > vys + 0.45;
    const nb = !b || (b.cx > dal && b.cy > vys + 0.45);
    if (na && nb) return true;
  }
  return false;
}

const RAZBEG = [8, 10, 12, 14, 16, 17];
const TOCHKI_SLIYANIYA = [-1, 14, 16, 18, 19];

console.log('=== Обратные ворота: наверху должны быть ОБА ===');
console.log('дыра  уступ  одиночка  двое врозь  слитые (лучшая точка слияния)');
const okna: string[] = [];
for (const shirina of [1.0, 1.2, 1.4]) {
  for (const vys of [1.4, 1.8, 2.2]) {
    const o = RAZBEG.filter((x) => vzyali(shirina, vys, 'одиночка', x, -1)).length;
    const d = RAZBEG.filter((x) => vzyali(shirina, vys, 'двое', x, -1)).length;
    let s = 0;
    let luchshaya = '';
    for (const sx of TOCHKI_SLIYANIYA) {
      const k = RAZBEG.filter((x) => vzyali(shirina, vys, 'слитые', x, sx)).length;
      if (k > s) {
        s = k;
        luchshaya = sx < 0 ? 'заранее' : `на ${sx}`;
      }
    }
    const n = RAZBEG.length;
    const okno = o === 0 && d === 0 && s >= n / 2;
    if (okno) okna.push(`дыра ${shirina} уступ ${vys}`);
    console.log(
      `${String(shirina).padEnd(5)} ${String(vys).padEnd(6)} ${String(o).padStart(5)}/${n} ${String(d).padStart(9)}/${n} ${String(s).padStart(8)}/${n} ${luchshaya}${okno ? '   <- окно' : ''}`,
    );
  }
}
console.log(
  okna.length
    ? `\nОкно есть: ${okna.join('; ')}. Одиночка и двое врозь не берут ни разу, слитые берут устойчиво.`
    : '\nОКНА НЕТ: ни одна пара чисел не разделяет слитых и остальных устойчиво.',
);
