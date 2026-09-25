// Прогон яруса 1 вдвоём: герой идёт по своему соло-плану, напарник следует за ним.
//
// Что именно проверяется. Выход теперь требует ОБОИХ (igra.ts считает расстояние по дальнему
// телу), поэтому главный вопрос — не «проходится ли уровень», а «успевает ли напарник».
// Если нет, уровень для кооператива не годится, каким бы хорошим он ни был в соло.
//
// Напарник не умён, и это надо держать в голове при чтении вердикта. Приёмка витка 001 показала,
// что первая версия мерила не уровень, а удачу: напарник спавнился ВПЕРЕДИ героя, и от знака
// этого числа вердикт переворачивался (k1-5 падал при +1,2 и проходился при -1,2, а k1-1 и k1-4
// наоборот). Ещё он копировал способности героя безусловно и этим оттаскивал его назад: в k1-2
// герой доходил до 20,1 с копированием и до 39,1 без него.
//
// Поэтому теперь уровень прогоняется во ВСЕХ четырёх разумных конфигурациях напарника
// (спавн спереди или сзади × копирует способности или нет), и уровень считается проходимым,
// если проходится хотя бы в одной. Это честная нижняя граница: живая пара выберет, где встать
// и когда жать, а бот перебирает за неё.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { UROVNI } from '../src/level/spisok';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import { PLANY, type Shag } from '../tests/plany';

const OTSTAL = 1.5; // дальше этого напарник бросает копирование и подтягивается

interface Itog {
  id: string;
  proyden: boolean;
  nastroyka: string;
  takty: number;
  a: [number, number];
  b: [number, number];
  rasstoyanie: number;
  smerti: number;
  storozhey: number;
  zhurnal: string[];
  gde: string;
}

interface Nastroyka {
  szadi: boolean; // напарник стартует позади героя
  kopiruet: boolean; // повторяет способности героя
}

const NASTROYKI: Nastroyka[] = [
  { szadi: false, kopiruet: true },
  { szadi: true, kopiruet: true },
  { szadi: false, kopiruet: false },
  { szadi: true, kopiruet: false },
];

const imya = (k: Nastroyka) =>
  `${k.szadi ? 'сзади' : 'спереди'}, ${k.kopiruet ? 'копирует' : 'не копирует'}`;

function progon(u: Uroven, plan: Shag[], vdvoyom: boolean, k: Nastroyka): Itog {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, u.start[0], u.start[1]);
  const b = vdvoyom ? new Telo(mir, u.start[0] + (k.szadi ? -1.2 : 1.2), u.start[1]) : null;
  const igra = new Igra(mir, a, ur);
  if (b) igra.dobavitSputnika(b);
  let gde = 'дошёл до конца плана';
  let takty = 0;
  for (let i = 0; i < plan.length && !igra.gotovo; i++) {
    const sh = plan[i] as Shag;
    const n: Namerenie = { ...PUSTOE, ...sh.nam };
    for (let t = 0; t < sh.takty && !igra.gotovo; t++) {
      // напарник: те же способности, направление — к герою, если отстал
      let nb: Namerenie = n;
      if (b) {
        const svoi: Namerenie = k.kopiruet ? n : { ...PUSTOE, dx: n.dx, dy: n.dy }; // без способностей героя
        const raznica = a.cx - b.cx;
        nb = Math.abs(raznica) > OTSTAL ? { ...svoi, dx: Math.sign(raznica), dy: svoi.dy } : svoi;
      }
      igra.doShaga();
      a.primenit(n, igra.korkaSredy);
      b?.primenit(nb, igra.korkaSredyTela(b));
      mir.shag();
      a.posle(n);
      b?.posle(nb);
      igra.takt(n, b ? [nb] : []);
      a.schitatCentr();
      b?.schitatCentr();
      takty++;
    }
    if (!igra.gotovo)
      gde =
        i + 1 === plan.length
          ? `план кончился, до выхода не дошли (A на x ${a.cx.toFixed(1)})`
          : `встал на шаге ${i + 1} из ${plan.length}`;
  }
  return {
    id: u.id,
    proyden: igra.gotovo,
    takty,
    a: [a.cx, a.cy],
    b: b ? [b.cx, b.cy] : [Number.NaN, Number.NaN],
    rasstoyanie: b ? Math.hypot(a.cx - b.cx, a.cy - b.cy) : 0,
    smerti: igra.smerti,
    // возрождение тоже пишется в журнал сторожей, но это не поломка физики: считаем отдельно
    storozhey: mir.zhurnal.filter((z) => !z.includes('возрождение')).length,
    zhurnal: mir.zhurnal.filter((z) => !z.includes('возрождение')),
    gde: igra.gotovo ? 'пройден' : gde,
    nastroyka: imya(k),
  };
}

/** Уровень проходим, если проходится хотя бы в одной конфигурации напарника. */
function luchshiy(u: Uroven, plan: Shag[]): { itog: Itog; skolko: number } {
  let luchshee: Itog | null = null;
  let skolko = 0;
  for (const k of NASTROYKI) {
    const r = progon(u, plan, true, k);
    if (r.proyden) skolko++;
    if (!luchshee || (r.proyden && !luchshee.proyden)) luchshee = r;
  }
  return { itog: luchshee as Itog, skolko };
}

const est = UROVNI.filter((u) => PLANY[u.id]);
const net = UROVNI.filter((u) => !PLANY[u.id]).map((u) => u.id);

console.log('=== Ярус 1 вдвоём: герой по плану, напарник следом ===');
console.log('Уровень проходим, если проходится хотя бы в одной из четырёх конфигураций напарника.');
console.log('');
console.log('уровень  соло  вдвоём  из 4  тактов  смерти  сторожа  конфигурация');
for (const u of est) {
  const plan = PLANY[u.id] as Shag[];
  const odin = progon(u, plan, false, NASTROYKI[0] as Nastroyka);
  const { itog: para, skolko } = luchshiy(u, plan);
  console.log(
    `${u.id.padEnd(8)} ${(odin.proyden ? ' да ' : ' НЕТ').padEnd(5)} ${(para.proyden ? ' да ' : ' НЕТ').padEnd(7)} ${String(skolko).padStart(3)}/4 ${String(para.takty).padStart(7)} ${String(para.smerti).padStart(7)} ${String(para.storozhey).padStart(8)}  ${para.nastroyka}`,
  );
  if (!para.proyden) console.log(`         ↳ ${para.gde}`);
  if (para.storozhey) console.log(`         ↳ сторожа: ${para.zhurnal.slice(0, 2).join(' | ')}`);
}
if (net.length) console.log(`\nБез плана в общем файле (свои прогонщики): ${net.join(', ')}`);
