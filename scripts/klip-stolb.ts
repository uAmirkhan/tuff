// ОШИБОЧНЫЙ СТЕНД, оставлен как след: та же беда, что у klip-stend.ts — без разбега.
// Верный замер ступени и слияния: scripts/klip-razbeg.ts и scripts/vorota-okno-scenariy.ts.
// Единственная выгода пары, которая выжила в замерах: тела встают друг на друга.
// В стенде полки (klip-stend) двое неслитых залезли на все высоты до 1.8, а слитая пара нет.
// Проверяю это как самостоятельное утверждение, а не как побочный вывод: высота стены,
// механизм (нижнее тело действительно под верхним), и что даёт НЕПОДВИЖНЫЙ напарник.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, type Namerenie, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const KRAY = 10;

function pole(vysota: number): Uroven {
  return {
    versiya: 1,
    id: 'klip-stolb',
    nazvanie: 'Столб',
    mysl: 'Друг на друга',
    start: [2, 0.6],
    granicy: { minX: -1, minY: -3, maxX: 24, maxY: 20 },
    vremyaZvezdy: 60,
    poligony: [
      { tochki: [[-1, -3], [0, -3], [0, 18], [-1, 18]] },
      { tochki: [[-1, -3], [24, -3], [24, 0], [-1, 0]] },
      { tochki: [[KRAY, 0], [24, 0], [24, vysota], [KRAY, vysota]] },
      { tochki: [[23, vysota], [24, vysota], [24, 18], [23, 18]] },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: 22, y: vysota + 0.5 }],
  };
}

type Rezhim = 'odin' | 'dvoe-oba-idut' | 'dvoe-nizhniy-stoit' | 'slitaya-para';

function zalez(vysota: number, rezhim: Rezhim, faza: number) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, pole(vysota));
  // верхнее тело у стены, нижнее чуть левее — оно станет ступенью
  const a = new Telo(mir, KRAY - 0.7, 0.6);
  const dvoe = rezhim !== 'odin';
  const b = dvoe ? new Telo(mir, KRAY - 0.7, 1.7) : null;
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (na: Namerenie, nb: Namerenie) => {
    igra.doShaga();
    a.primenit(na, igra.korkaSredy);
    b?.primenit(nb, false);
    mir.shag();
    a.posle(na);
    b?.posle(nb);
    igra.takt(na, b ? [nb] : []);
    a.schitatCentr();
    b?.schitatCentr();
  };
  const stoyat: Namerenie = PUSTOE;
  const kStene: Namerenie = { ...PUSTOE, dx: 1 };
  for (let t = 0; t < 60 + faza; t++) shag(kStene, stoyat);
  if (rezhim === 'slitaya-para') {
    for (let t = 0; t < 180 && !igra.slito; t++) {
      shag(kStene, kStene);
      igra.slit();
    }
    if (!igra.slito) return { zalez: false, nizhniy: false };
  }
  // подъём: верхнее тело лезет выбросом и вправо, нижнее по режиму
  const lez: Namerenie = { ...PUSTOE, vybros: true, dy: 1, dx: 1 };
  // в этом стенде «верхнее» это b, если оно есть: оно стоит НА a
  const verh = b ?? a;
  const niz = a;
  const nizNam: Namerenie =
    rezhim === 'dvoe-nizhniy-stoit' ? stoyat : rezhim === 'odin' ? lez : lez;
  let podNim = false;
  for (let t = 0; t < 300; t++) {
    if (b) shag(nizNam, lez);
    else shag(lez, stoyat);
    if (b && b.cy > a.cy + 0.6) podNim = true;
    if (verh.cx > KRAY + 0.4 && verh.cy > vysota + 0.2) return { zalez: true, nizhniy: podNim };
  }
  void niz;
  return { zalez: false, nizhniy: podNim };
}

console.log('=== Кто перелезает стену (5 фаз) ===');
console.log('высота | одиночка | двое, оба лезут | двое, нижний СТОИТ | слитая пара');
const FAZY = [0, 7, 13, 19, 29];
for (const v of [1, 1.5, 2, 2.5, 3, 4]) {
  const r = (rezhim: Rezhim) => FAZY.filter((f) => zalez(v, rezhim, f).zalez).length;
  const meh = FAZY.filter((f) => zalez(v, 'dvoe-nizhniy-stoit', f).nizhniy).length;
  console.log(
    `${v.toFixed(1).padStart(6)} | ${String(r('odin')).padStart(8)} | ${String(r('dvoe-oba-idut')).padStart(15)} | ${String(r('dvoe-nizhniy-stoit')).padStart(18)} | ${String(r('slitaya-para')).padStart(11)}   (встал сверху в ${meh}/5)`,
  );
}
