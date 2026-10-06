// Ворота на габарит: есть ли ширина прохода, которую одиночка проходит, а слитая пара нет.
//
// Зачем заново. Прежние числа по щели снимались ДО того, как у слияния появился каркас, а он
// меняет форму пары. Верить старым замерам нельзя.
//
// ИТОГ 26.09: ВОРОТ НА ГАБАРИТ НЕТ, гипотеза закрыта приёмкой. Этот скрипт оставлен как
// памятник тому, как развёртка может соврать.
//
// Он перебирает ширину и фазу подхода, но молча фиксирует три оси, и каждая оказалась решающей:
//   1. В колонке «одиночка» одно тело, хотя в уровне их всегда два. На щели 0,8 двое несклеенных
//      не проходят тоже — значит это не «любое одиночное тело», а «никто без Расплава».
//   2. Слияние всегда на такте 20, за 8-10 единиц до щели. Если слиться У САМОЙ ЩЕЛИ, пара
//      проходит 16 из 45 комбинаций, и быстрее, чем разделяться и идти по очереди.
//   3. Проход всегда вплотную к полу. Подняв его на 0,25-1,0, пара проходит 2-4 раза из 6.
//
// Шесть фаз подхода тоже оказались мало: на 42 фазах пара проходит щель 0,9.
//
// Критерий убийства гипотезы был записан заранее и сработал: ни одна ширина не разделяет
// одиночку и слитую пару устойчиво.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const STENA = 14; // левый край перегородки
const TOLSHCHINA = 2;

function komnata(shchel: number): Uroven {
  return {
    versiya: 1,
    id: 'vorota-gabarit',
    nazvanie: 'Ворота на габарит',
    mysl: 'Пролезет ли слитая пара',
    start: [3, 0.6],
    granicy: { minX: -1, minY: -3, maxX: 31, maxY: 14 },
    vremyaZvezdy: 60,
    poligony: [
      {
        tochki: [
          [-1, -3],
          [0, -3],
          [0, 12],
          [-1, 12],
        ],
      },
      {
        tochki: [
          [30, -3],
          [31, -3],
          [31, 12],
          [30, 12],
        ],
      },
      {
        tochki: [
          [-1, -3],
          [31, -3],
          [31, 0],
          [-1, 0],
        ],
      },
      // перегородка с проходом высотой shchel у самого пола
      {
        tochki: [
          [STENA, shchel],
          [STENA + TOLSHCHINA, shchel],
          [STENA + TOLSHCHINA, 12],
          [STENA, 12],
        ],
      },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: 27, y: 0.5 }],
  };
}

type Rezhim = 'обычное' | 'Расплав' | 'Корка' | 'слитая пара';

const NAMEREN: Record<Exclude<Rezhim, 'слитая пара'>, Partial<Namerenie>> = {
  обычное: {},
  Расплав: { rasplav: true },
  Корка: { korka: true },
};

/** startX меняет фазу подхода к проходу — это и есть повтор попытки */
function proshel(shchel: number, rezhim: Rezhim, startX: number): boolean {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, komnata(shchel));
  const para = rezhim === 'слитая пара';
  const a = new Telo(mir, startX, 0.6);
  const b = para ? new Telo(mir, startX + 0.9, 0.6) : null;
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const n: Namerenie = { ...PUSTOE, dx: 1, ...(para ? {} : NAMEREN[rezhim]) };
  const shag = () => {
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
  for (let t = 0; t < 20; t++) shag();
  if (para && !igra.slit()) return false;
  const cel = STENA + TOLSHCHINA + 1;
  for (let t = 0; t < 900; t++) {
    shag();
    if (a.cx > cel && (!b || b.cx > cel)) return true;
  }
  return false;
}

const FAZY = [3, 3.5, 4, 4.5, 5, 5.5];
const dolya = (shchel: number, r: Rezhim) => FAZY.filter((x) => proshel(shchel, r, x)).length;

console.log(`=== Ворота на габарит: проход у пола, перегородка толщиной ${TOLSHCHINA} ===`);
console.log(`${FAZY.length} попыток на клетку, разные фазы подхода\n`);
console.log('щель   обычное  Расплав  Корка  слитая пара');
const okna: number[] = [];
for (const sh of [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2]) {
  const o = dolya(sh, 'обычное');
  const r = dolya(sh, 'Расплав');
  const k = dolya(sh, 'Корка');
  const p = dolya(sh, 'слитая пара');
  const odinochka = Math.max(o, r, k);
  const okno = odinochka >= FAZY.length / 2 && p === 0;
  if (okno) okna.push(sh);
  console.log(
    `${String(sh).padEnd(6)} ${String(o).padStart(5)}/${FAZY.length} ${String(r).padStart(6)}/${FAZY.length} ${String(k).padStart(5)}/${FAZY.length} ${String(p).padStart(8)}/${FAZY.length}${okno ? '   <- окно' : ''}`,
  );
}
console.log(
  okna.length
    ? `\nОкно есть: ширины ${okna.join(', ')}. Одиночка проходит устойчиво, слитая пара не проходит ни разу.`
    : '\nОКНА НЕТ. Ворот на габарит не существует, комнату под них строить нельзя.',
);
