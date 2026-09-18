// Чем слитая пара отличается от одиночки на самом деле: габарит, скорость, прыжок, масса.
// И проверка идеи управления «гусеница»: половины хватаются по очереди, и тогда оба игрока
// заняты каждый шаг, а не один везёт другого.
import { MIR, TELO } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Poligon, Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function komnata(pol: Poligon[] = []): Uroven {
  return {
    versiya: 1,
    id: 'svoystva',
    nazvanie: 'Свойства слияния',
    mysl: 'Чем пара отличается от одиночки',
    start: [3, 0.6],
    granicy: { minX: -1, minY: -3, maxX: 61, maxY: 20 },
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
          [60, -3],
          [61, -3],
          [61, 18],
          [60, 18],
        ],
      },
      {
        tochki: [
          [-1, -3],
          [61, -3],
          [61, 0],
          [-1, 0],
        ],
      },
      ...pol,
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: 58, y: 0.5 }],
  };
}

function scena(u: Uroven, ax: number, ay: number, bx?: number, by?: number) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, ax, ay);
  const b = bx === undefined ? null : new Telo(mir, bx, by as number);
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  const shag = (na: Partial<Namerenie> = {}, nb: Partial<Namerenie> = {}) => {
    const na2 = { ...PUSTOE, ...na };
    const nb2 = { ...PUSTOE, ...nb };
    igra.doShaga();
    a.primenit(na2, igra.korkaSredy);
    b?.primenit(nb2, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(na2);
    b?.posle(nb2);
    igra.takt(na2, b ? [nb2] : []);
    a.schitatCentr();
    b?.schitatCentr();
  };
  return { mir, ur, a, b: b as Telo, igra, shag };
}

/** общий габарит всех тел игрока */
function gabaritPary(s: ReturnType<typeof scena>) {
  const g1 = s.a.gabarity();
  if (!s.b) return { w: g1.w, h: g1.h };
  const g2 = s.b.gabarity();
  return {
    w: Math.max(g1.maxX, g2.maxX) - Math.min(g1.minX, g2.minX),
    h: Math.max(g1.maxY, g2.maxY) - Math.min(g1.minY, g2.minY),
  };
}

console.log('=== 1. Габарит: становятся ли больше ===');
{
  const odin = scena(komnata(), 10, 0.6);
  for (let t = 0; t < 120; t++) odin.shag();
  const g1 = gabaritPary(odin);
  const para = scena(komnata(), 10, 0.6, 10.9, 0.6);
  for (let t = 0; t < 30; t++) para.shag();
  para.igra.slit();
  for (let t = 0; t < 120; t++) para.shag();
  const g2 = gabaritPary(para);
  console.log(`  одиночка: ширина ${g1.w.toFixed(2)} высота ${g1.h.toFixed(2)}`);
  console.log(`  слитая пара: ширина ${g2.w.toFixed(2)} высота ${g2.h.toFixed(2)}`);
  console.log(
    `  прирост: ширина ×${(g2.w / g1.w).toFixed(2)}, высота ×${(g2.h / g1.h).toFixed(2)}`,
  );
  console.log(`  частиц: одиночка ${odin.a.n}, пара ${para.a.n + para.b.n} (масса вдвое)`);
}

console.log('=== 2. Скорость: быстрее или медленнее одиночки ===');
{
  const put = (s: ReturnType<typeof scena>, slit: boolean) => {
    for (let t = 0; t < 30; t++) s.shag();
    if (slit) s.igra.slit();
    s.a.schitatCentr();
    const x0 = s.a.cx;
    for (let t = 0; t < 420; t++) s.shag({ dx: 1 }, { dx: 1 });
    return s.a.cx - x0;
  };
  const odin = put(scena(komnata(), 6, 0.6), false);
  const para = put(scena(komnata(), 6, 0.6, 6.9, 0.6), true);
  console.log(
    `  одиночка ${odin.toFixed(2)}, слитая пара ${para.toFixed(2)}, отношение ${(para / odin).toFixed(2)}`,
  );
}

console.log('=== 3. Выброс: прыгает ли пара выше или ниже ===');
{
  const vysota = (s: ReturnType<typeof scena>, slit: boolean) => {
    for (let t = 0; t < 60; t++) s.shag();
    if (slit) s.igra.slit();
    s.a.schitatCentr();
    const y0 = s.a.cy;
    let maks = y0;
    for (let t = 0; t < 180; t++) {
      s.shag({ vybros: true, dy: 1 }, { vybros: true, dy: 1 });
      if (s.a.cy > maks) maks = s.a.cy;
    }
    return maks - y0;
  };
  console.log(`  одиночка +${vysota(scena(komnata(), 6, 0.6), false).toFixed(2)}`);
  console.log(`  слитая пара +${vysota(scena(komnata(), 6, 0.6, 6.9, 0.6), true).toFixed(2)}`);
}

console.log('=== 4. «Гусеница»: лезет ли слитая пара по стене хватками по очереди ===');
{
  const stena: Poligon[] = [
    {
      tochki: [
        [12, 0],
        [13, 0],
        [13, 16],
        [12, 16],
      ],
    },
  ];
  // обе половины у стены, слиты; половины хватаются по очереди периодом 40 тактов
  const gus = scena(komnata(stena), 11.2, 0.6, 11.2, 1.6);
  for (let t = 0; t < 60; t++) gus.shag({ dx: 1 }, { dx: 1 });
  const slilis = gus.igra.slit();
  let maksG = Math.max(gus.a.cy, gus.b.cy);
  for (let t = 0; t < 900; t++) {
    const faza = Math.floor(t / 40) % 2 === 0;
    gus.shag(
      faza ? { vyazkost: true, dx: 1 } : { dx: 1, dy: 1 },
      faza ? { dx: 1, dy: 1 } : { vyazkost: true, dx: 1 },
    );
    maksG = Math.max(maksG, gus.a.cy, gus.b.cy);
  }
  // для сравнения: та же пара, но оба всё время держат Вязкость (никакой очерёдности)
  const oba = scena(komnata(stena), 11.2, 0.6, 11.2, 1.6);
  for (let t = 0; t < 60; t++) oba.shag({ dx: 1 }, { dx: 1 });
  oba.igra.slit();
  let maksO = Math.max(oba.a.cy, oba.b.cy);
  for (let t = 0; t < 900; t++) {
    oba.shag({ vyazkost: true, dx: 1, dy: 1 }, { vyazkost: true, dx: 1, dy: 1 });
    maksO = Math.max(maksO, oba.a.cy, oba.b.cy);
  }
  // и одиночка на той же стене
  const od = scena(komnata(stena), 11.2, 0.6);
  let maksOd = od.a.cy;
  for (let t = 0; t < 900; t++) {
    od.shag({ vyazkost: true, dx: 1, dy: 1 });
    maksOd = Math.max(maksOd, od.a.cy);
  }
  console.log(`  слились: ${slilis}`);
  console.log(`  гусеница (хватки по очереди): поднялись до ${maksG.toFixed(2)}`);
  console.log(`  оба держат Вязкость всё время:  до ${maksO.toFixed(2)}`);
  console.log(`  одиночка на той же стене:        до ${maksOd.toFixed(2)}`);
}
console.log(`\n(диаметр тела ${(TELO.radius * 2).toFixed(1)})`);

console.log('=== 5. Лезет ли пара, если Вязкость держит только один ===');
{
  const stena: Poligon[] = [
    {
      tochki: [
        [12, 0],
        [13, 0],
        [13, 16],
        [12, 16],
      ],
    },
  ];
  const podyom = (na: Partial<Namerenie>, nb: Partial<Namerenie>) => {
    const s = scena(komnata(stena), 11.2, 0.6, 11.2, 1.6);
    for (let t = 0; t < 60; t++) s.shag({ dx: 1 }, { dx: 1 });
    s.igra.slit();
    let maks = Math.max(s.a.cy, s.b.cy);
    for (let t = 0; t < 900; t++) {
      s.shag(na, nb);
      maks = Math.max(maks, s.a.cy, s.b.cy);
    }
    return maks;
  };
  console.log(
    `  оба держат Вязкость:      ${podyom({ vyazkost: true, dx: 1, dy: 1 }, { vyazkost: true, dx: 1, dy: 1 }).toFixed(2)}`,
  );
  console.log(
    `  держит только первый:     ${podyom({ vyazkost: true, dx: 1, dy: 1 }, { dx: 1, dy: 1 }).toFixed(2)}`,
  );
  console.log(
    `  держит только второй:     ${podyom({ dx: 1, dy: 1 }, { vyazkost: true, dx: 1, dy: 1 }).toFixed(2)}`,
  );
  console.log(
    `  первый держит, второй спит: ${podyom({ vyazkost: true, dx: 1, dy: 1 }, {}).toFixed(2)}`,
  );
}

console.log('=== 6. Форма зависит от того, КАК слились ===');
{
  // слияние бок о бок
  const bok = scena(komnata(), 10, 0.6, 10.9, 0.6);
  for (let t = 0; t < 30; t++) bok.shag();
  bok.igra.slit();
  for (let t = 0; t < 120; t++) bok.shag();
  const gb = gabaritPary(bok);
  // слияние стопкой: второй падает сверху на первого и они слипаются в воздухе
  const stopka = scena(komnata(), 10, 0.6, 10, 1.62);
  for (let t = 0; t < 10; t++) stopka.shag();
  const slilos = stopka.igra.slit();
  for (let t = 0; t < 120; t++) stopka.shag();
  const gs = gabaritPary(stopka);
  console.log(`  бок о бок: ширина ${gb.w.toFixed(2)} высота ${gb.h.toFixed(2)}`);
  console.log(`  стопкой (слилось ${slilos}): ширина ${gs.w.toFixed(2)} высота ${gs.h.toFixed(2)}`);
}
