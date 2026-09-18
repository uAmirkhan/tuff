// Структурный аудит кампании под кооператив. Не прохождение, а проверка трёх вещей,
// которые замеры и тесты уже вскрыли как опасные:
//   1. Место старта: влезает ли второе тело рядом, не выталкивает ли его геометрия.
//   2. Выход: радиус 0,8, а тела расталкиваются на 1,0. Возьмут ли выход двое.
//   3. Плиты: цели с несколькими источниками и защёлка fiksiruetsya.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { UROVNI } from '../src/level/spisok';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function scena(u: Uroven, ax: number, ay: number, bx: number, by: number) {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, ax, ay);
  const b = new Telo(mir, bx, by);
  const igra = new Igra(mir, a, ur);
  igra.dobavitSputnika(b);
  const shag = () => {
    igra.doShaga();
    a.primenit(PUSTOE, igra.korkaSredy);
    b.primenit(PUSTOE, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(PUSTOE);
    b.posle(PUSTOE);
    igra.takt(PUSTOE, [PUSTOE]);
    a.schitatCentr();
    b.schitatCentr();
  };
  return { mir, ur, a, b, igra, shag };
}

let bed = 0;
for (const u of UROVNI) {
  const zamechaniya: string[] = [];

  // 1. Старт: спутник появляется в 1,2 правее, как в main.ts
  {
    const s = scena(u, u.start[0], u.start[1], u.start[0] + 1.2, u.start[1]);
    for (let t = 0; t < 120; t++) s.shag();
    const ushyol = Math.hypot(s.b.cx - (u.start[0] + 1.2), s.b.cy - u.start[1]);
    const storozh = s.b.storozha();
    if (storozh) zamechaniya.push(`спутник на старте: сторож «${storozh}»`);
    else if (ushyol > 3)
      zamechaniya.push(`спутник на старте уехал на ${ushyol.toFixed(1)}: тесно или выталкивает`);
    if (s.igra.smerti > 0) zamechaniya.push(`на старте ${s.igra.smerti} смертей за 2 секунды`);
  }

  // 2. Выход: тела ставим по обе стороны от точки, как требует радиус
  {
    const v = u.obekty.find((o) => o.tip === 'vyhod');
    if (!v) zamechaniya.push('нет выхода');
    else if (u.vyhodPosleBossa)
      zamechaniya.push('выход после босса: проверяется прогоном, не здесь');
    else {
      const s = scena(u, v.x - 0.5, v.y + 0.1, v.x + 0.5, v.y + 0.1);
      let vzyali = false;
      for (let t = 0; t < 180 && !vzyali; t++) {
        s.shag();
        if (s.igra.gotovo) vzyali = true;
      }
      if (!vzyali) {
        const da = Math.hypot(v.x - s.a.cx, v.y - s.a.cy);
        const db = Math.hypot(v.x - s.b.cx, v.y - s.b.cy);
        zamechaniya.push(
          `выход вдвоём не берётся: расстояния ${da.toFixed(2)} и ${db.toFixed(2)} при радиусе 0,8`,
        );
      }
    }
  }

  // 3. Плиты
  {
    const plity = u.obekty.filter((o) => o.tip === 'plita');
    const poCeli = new Map<string, number>();
    for (const p of plity) if (p.cel) poCeli.set(p.cel, (poCeli.get(p.cel) ?? 0) + 1);
    for (const [cel, n] of poCeli)
      if (n > 1) zamechaniya.push(`цель ${cel}: ${n} плит, стала воротами «нажаты обе»`);
    const zashchyolki = plity.filter((p) => p.fiksiruetsya !== false).length;
    if (plity.length && zashchyolki === plity.length && plity.length > 1)
      zamechaniya.push(
        `все ${plity.length} плит с защёлкой: для кооп-ворот нужен fiksiruetsya: false`,
      );
  }

  if (zamechaniya.length) bed += zamechaniya.length;
  console.log(`${u.id.padEnd(9)} ${zamechaniya.length ? `⚠ ${zamechaniya.join('; ')}` : 'чисто'}`);
}
console.log(`\nвсего замечаний: ${bed}`);
