// Ворота на выживание: разделитель. Два встречных потока разносят тела в разные стороны.
// Несклеенных должно растащить, слитую пару — удержать: каркас связывает кольца, и его
// надо рвать силой, а не просто оттолкнуть.
// Это единственное свойство слияния, которого нет у «двоих рядом» и которое не обходится
// техникой движения (ворота на достижимости провалились, разделы 4.11 и 4.12 вики).
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Obekt, Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const SEREDINA = 20;

function komnata(sila: number): Uroven {
  const ob: Obekt[] = [
    // левая половина коридора тянет влево, правая вправо
    { tip: 'potok', id: 'pl', x: SEREDINA - 8, y: 0, w: 8, h: 3, silaX: -sila, silaY: 0 },
    { tip: 'potok', id: 'pr', x: SEREDINA, y: 0, w: 8, h: 3, silaX: sila, silaY: 0 },
    { tip: 'vyhod', id: 'v', x: SEREDINA, y: 3.5 },
  ];
  return {
    versiya: 1,
    id: 'razdelitel',
    nazvanie: 'Разделитель',
    mysl: 'Растащить нельзя',
    start: [SEREDINA - 0.6, 0.6],
    granicy: { minX: -1, minY: -3, maxX: 41, maxY: 12 },
    vremyaZvezdy: 60,
    poligony: [
      {
        tochki: [
          [-1, -3],
          [0, -3],
          [0, 10],
          [-1, 10],
        ],
      },
      {
        tochki: [
          [40, -3],
          [41, -3],
          [41, 10],
          [40, 10],
        ],
      },
      {
        tochki: [
          [-1, -3],
          [41, -3],
          [41, 0],
          [-1, 0],
        ],
      },
    ],
    obekty: ob,
  };
}

function rastashchili(sila: number, slivat: boolean): { d: number; slito: boolean } {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, komnata(sila));
  const a = new Telo(mir, SEREDINA - 0.6, 0.6);
  const b = new Telo(mir, SEREDINA + 0.6, 0.6);
  const igra = new Igra(mir, a, ur);
  igra.dobavitSputnika(b);
  const shag = (n: Namerenie) => {
    igra.doShaga();
    a.primenit(n, igra.korkaSredy);
    b.primenit(n, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(n);
    b.posle(n);
    igra.takt(n, [n]);
    a.schitatCentr();
    b.schitatCentr();
  };
  // потоки выключены на время разгона: иначе тела расталкивает раньше, чем они успевают слиться
  const zony = ur.sushchnosti.filter((z) => z.tip === 'potok');
  for (const z of zony) z.aktivna = false;
  for (let t = 0; t < 20; t++) shag(PUSTOE);
  if (slivat && !igra.slit()) return { d: -1, slito: false };
  for (const z of zony) z.aktivna = true;
  for (let t = 0; t < 420; t++) shag(PUSTOE);
  return { d: Math.hypot(a.cx - b.cx, a.cy - b.cy), slito: igra.slito };
}

console.log('=== Разделитель: расстояние между телами через 7 секунд ===');
console.log('сила   несклеенные   слитые   слияние уцелело');
for (const s of [10, 20, 40, 80, 160, 320]) {
  const bez = rastashchili(s, false);
  const so = rastashchili(s, true);
  console.log(
    `${String(s).padEnd(6)} ${bez.d.toFixed(2).padStart(9)} ${so.d.toFixed(2).padStart(11)}   ${so.slito ? 'да' : 'НЕТ'}`,
  );
}

console.log('\n=== Годится ли это как ворота ===');
{
  const progon = (sila: number, slivat: boolean, nam: Partial<Namerenie>) => {
    const mir = new Mir(MIR);
    const ur = zagruzitUroven(mir, komnata(sila));
    const a = new Telo(mir, SEREDINA - 0.6, 0.6);
    const b = new Telo(mir, SEREDINA + 0.6, 0.6);
    const igra = new Igra(mir, a, ur);
    igra.dobavitSputnika(b);
    const zony = ur.sushchnosti.filter((z) => z.tip === 'potok');
    const shag = (n: Namerenie) => {
      igra.doShaga();
      a.primenit(n, igra.korkaSredy);
      b.primenit(n, igra.korkaSredyTela(b));
      mir.shag();
      a.posle(n);
      b.posle(n);
      igra.takt(n, [n]);
      a.schitatCentr();
      b.schitatCentr();
    };
    for (const z of zony) z.aktivna = false;
    for (let t = 0; t < 20; t++) shag(PUSTOE);
    if (slivat) igra.slit();
    for (const z of zony) z.aktivna = true;
    const n: Namerenie = { ...PUSTOE, ...nam };
    for (let t = 0; t < 420; t++) shag(n);
    return { a: a.cx, b: b.cx, d: Math.hypot(a.cx - b.cx, a.cy - b.cy), slito: igra.slito };
  };
  for (const sila of [60, 120]) {
    // несклеенные пытаются вернуться к центру: первый жмёт вправо, второй влево
    const mir1 = new Mir(MIR);
    void mir1;
    const vozvrat = progon(sila, false, {});
    console.log(
      `  сила ${sila}: несклеенных развело на ${vozvrat.d.toFixed(1)} (A ${vozvrat.a.toFixed(1)}, Б ${vozvrat.b.toFixed(1)}), центр ${SEREDINA}`,
    );
    const hod = progon(sila, true, { dx: 1 });
    console.log(
      `  сила ${sila}: слитая пара с ходом вправо дошла до ${hod.a.toFixed(1)}, вместе ${hod.slito ? 'да' : 'НЕТ'}, расстояние ${hod.d.toFixed(2)}`,
    );
  }
}

console.log('\n=== Удержится ли ОДИНОЧКА на границе потоков ===');
{
  const odin = (sila: number, smeshchenie: number) => {
    const mir = new Mir(MIR);
    const ur = zagruzitUroven(mir, komnata(sila));
    const a = new Telo(mir, SEREDINA + smeshchenie, 1.2);
    const igra = new Igra(mir, a, ur);
    for (let t = 0; t < 420; t++) {
      igra.doShaga();
      a.primenit(PUSTOE, igra.korkaSredy);
      mir.shag();
      a.posle(PUSTOE);
      igra.takt(PUSTOE);
      a.schitatCentr();
    }
    return a.cx;
  };
  const para = (sila: number, smeshchenie: number) => {
    const mir = new Mir(MIR);
    const ur = zagruzitUroven(mir, komnata(sila));
    const a = new Telo(mir, SEREDINA + smeshchenie - 0.6, 1.2);
    const b = new Telo(mir, SEREDINA + smeshchenie + 0.6, 1.2);
    const igra = new Igra(mir, a, ur);
    igra.dobavitSputnika(b);
    const zony = ur.sushchnosti.filter((z) => z.tip === 'potok');
    for (const z of zony) z.aktivna = false;
    for (let t = 0; t < 20; t++) {
      igra.doShaga();
      a.primenit(PUSTOE, false);
      b.primenit(PUSTOE, false);
      mir.shag();
      a.posle(PUSTOE);
      b.posle(PUSTOE);
      igra.takt(PUSTOE, [PUSTOE]);
      a.schitatCentr();
      b.schitatCentr();
    }
    igra.slit();
    for (const z of zony) z.aktivna = true;
    for (let t = 0; t < 420; t++) {
      igra.doShaga();
      a.primenit(PUSTOE, igra.korkaSredy);
      b.primenit(PUSTOE, igra.korkaSredyTela(b));
      mir.shag();
      a.posle(PUSTOE);
      b.posle(PUSTOE);
      igra.takt(PUSTOE, [PUSTOE]);
      a.schitatCentr();
      b.schitatCentr();
    }
    return (a.cx + b.cx) / 2;
  };
  console.log(`сила 60, центр ${SEREDINA}. Смещение падения -> где оказались через 7 с`);
  console.log('смещение  одиночка  слитая пара');
  for (const sm of [0, 0.2, 0.5, 1.0]) {
    console.log(`${String(sm).padEnd(9)} ${odin(60, sm).toFixed(2).padStart(8)} ${para(60, sm).toFixed(2).padStart(12)}`);
  }
}
