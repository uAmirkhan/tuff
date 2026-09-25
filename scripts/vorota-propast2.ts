// Пропасть как ворота слияния — прогон с ПОВТОРАМИ.
// Первый замер дал немонотонную картину (одиночка переходит 5,0 и падает на 6,0, пара проходит
// 6,0 и не проходит 3,0), то есть один проход тут ничего не доказывает: исход зависит от того,
// в какой фазе отскока тело подошло к краю. Здесь на каждую ширину гоняется несколько попыток
// с разным разбегом, и считается доля успехов.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const LEVO = 24; // левый край пропасти, разбег 24 единицы

function komnata(shirina: number, potolok = 0): Uroven {
  const pravo = LEVO + shirina;
  return {
    versiya: 1,
    id: 'propast2',
    nazvanie: 'Пропасть',
    mysl: 'Мост из одного тела',
    start: [3, 0.6],
    granicy: { minX: -1, minY: -14, maxX: pravo + 16, maxY: 14 },
    vremyaZvezdy: 60,
    poligony: [
      {
        tochki: [
          [-1, -14],
          [0, -14],
          [0, 12],
          [-1, 12],
        ],
      },
      {
        tochki: [
          [pravo + 15, -14],
          [pravo + 16, -14],
          [pravo + 16, 12],
          [pravo + 15, 12],
        ],
      },
      {
        tochki: [
          [-1, -14],
          [LEVO, -14],
          [LEVO, 0],
          [-1, 0],
        ],
      },
      {
        tochki: [
          [pravo, -14],
          [pravo + 16, -14],
          [pravo + 16, 0],
          [pravo, 0],
        ],
      },
      // низкий потолок над пропастью и подходом: под ним не подпрыгнуть
      ...(potolok > 0
        ? [
            {
              tochki: [
                [LEVO - 10, potolok],
                [pravo + 6, potolok],
                [pravo + 6, 12],
                [LEVO - 10, 12],
              ] as [number, number][],
            },
          ]
        : []),
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: pravo + 8, y: 0.5 }],
  };
}

type Rezhim = 'одиночка' | 'двое' | 'слитые';

/** startX меняет фазу подхода к краю: это и есть повтор попытки */
function pereshli(
  shirina: number,
  rezhim: Rezhim,
  startX: number,
  vybros: boolean,
  potolok = 0,
): boolean {
  const u = komnata(shirina, potolok);
  const pravo = LEVO + shirina;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, startX, 0.6);
  const b = rezhim === 'одиночка' ? null : new Telo(mir, startX + 1.2, 0.6);
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
  if (rezhim === 'слитые' && !igra.slit()) return false;
  const nam: Namerenie = { ...PUSTOE, dx: 1, ...(vybros ? { vybros: true, dy: 1 } : {}) };
  for (let t = 0; t < 1200; t++) {
    shag(nam);
    const na = a.cx > pravo + 1 && a.cy > -1;
    const nb = !b || (b.cx > pravo + 1 && b.cy > -1);
    if (na && nb) return true;
    if (a.cy < -6 && (!b || b.cy < -6)) return false;
  }
  return false;
}

const STARTY = [3, 3.4, 3.8, 4.2, 4.6, 5.0, 5.4, 5.8]; // восемь фаз подхода
const dolya = (shirina: number, rezhim: Rezhim, vybros: boolean, potolok = 0) =>
  STARTY.filter((x) => pereshli(shirina, rezhim, x, vybros, potolok)).length;

for (const potolok of [0, 1.6, 1.3]) {
  console.log(
    `=== потолок ${potolok || 'нет'}, все жмут Выброс, разбег 24, ${STARTY.length} попыток ===`,
  );
  console.log('ширина  одиночка  двое рядом  слитые');
  for (const w of [3, 4, 5, 6, 7, 8]) {
    const vybros = true;
    const o = dolya(w, 'одиночка', vybros, potolok);
    const d = dolya(w, 'двое', vybros, potolok);
    const s = dolya(w, 'слитые', vybros, potolok);
    console.log(
      `${String(w).padEnd(7)} ${String(o).padStart(4)}/8    ${String(d).padStart(5)}/8     ${String(s).padStart(4)}/8`,
    );
  }
}
