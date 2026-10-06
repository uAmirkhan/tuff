// Кооп-бот, который ИЩЕТ проход, а не идёт по написанному мной сценарию.
//
// Зачем. Случайный бот с инерцией не собирает координацию из четырёх шагов (слиться, отойти,
// разогнаться, выброс) и на всех воротах печатает «вердикта нет». Поэтому проход приходилось
// писать руками, и три витка подряд мои же сценарии объявляли исправное сломанным и больное
// здоровым: то не давали слитой паре разбега, то читали состояние в конце прогона, то повторяли
// один прогон пять раз под видом пяти семян.
//
// Здесь план — это последовательность отрезков (сколько тактов держать какое намерение), а бот
// ищет её восхождением: берёт лучший план, портит случайный отрезок, оставляет, если стало
// лучше. Оценка задаётся снаружи, потому что «ближе к проходу» у каждых ворот своё.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import type { Povadka, Uchastok } from './koop-bot';

export interface Otrezok {
  taktov: number;
  nam: Namerenie;
  slit: boolean;
}
export type Plan = Otrezok[];

/** Оценка положения: больше — ближе к проходу. Задаётся воротами. */
export type Ocenka = (a: Telo, b: Telo, igra: Igra) => number;

export function povadkaIzPlana(plan: Plan): Povadka {
  return (t) => {
    let ostalos = t;
    for (const o of plan) {
      if (ostalos < o.taktov) return { nam: o.nam, slit: o.slit };
      ostalos -= o.taktov;
    }
    const last = plan[plan.length - 1];
    return last ? { nam: last.nam, slit: last.slit } : { nam: { ...PUSTOE }, slit: false };
  };
}

function zerno(s: number): () => number {
  let x = s >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 100000) / 100000;
  };
}

function sluchaynoeNamerenie(r: () => number): Namerenie {
  const d = r();
  return {
    ...PUSTOE,
    dx: d < 0.45 ? 1 : d < 0.75 ? -1 : 0,
    dy: r() < 0.35 ? 1 : 0,
    vyazkost: r() < 0.15,
    rasplav: r() < 0.08,
    korka: r() < 0.12,
    vybros: r() < 0.3,
  };
}

export function sluchaynyyPlan(r: () => number, otrezkov = 6, maksTaktov = 260): Plan {
  const plan: Plan = [];
  for (let i = 0; i < otrezkov; i++)
    plan.push({
      taktov: 30 + Math.floor(r() * maksTaktov),
      nam: sluchaynoeNamerenie(r),
      slit: r() < 0.6,
    });
  return plan;
}

function isportit(plan: Plan, r: () => number): Plan {
  const novyy = plan.map((o) => ({ ...o, nam: { ...o.nam } }));
  const i = Math.floor(r() * novyy.length);
  const o = novyy[i] as Otrezok;
  const chto = r();
  if (chto < 0.4) o.taktov = Math.max(10, o.taktov + Math.floor((r() - 0.5) * 160));
  else if (chto < 0.8) o.nam = sluchaynoeNamerenie(r);
  else o.slit = !o.slit;
  return novyy;
}

/** Один прогон: проходит ли участок и какой лучшей оценки достиг. */
export function progonSOcenkoy(
  u: Uchastok,
  pervyy: Povadka,
  vtoroy: Povadka,
  ocenka: Ocenka,
): { proshli: boolean; luchshaya: number } {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u.uroven);
  const a = new Telo(mir, u.gde[0][0], u.gde[0][1]);
  const b = new Telo(mir, u.gde[1][0], u.gde[1][1]);
  const igra = new Igra(mir, a, ur);
  igra.dobavitSputnika(b);
  const pusto = () => 0;
  let slito = false;
  let luchshaya = Number.NEGATIVE_INFINITY;
  for (let t = 0; t < u.taktov; t++) {
    const x = pervyy(t, pusto);
    const y = vtoroy(t, pusto);
    const hotyat = x.slit && y.slit;
    if (hotyat && !slito) slito = igra.slit();
    else if (!hotyat && slito) {
      igra.razdelit();
      slito = false;
    }
    igra.doShaga();
    a.primenit(x.nam, igra.korkaSredy);
    b.primenit(y.nam, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(x.nam);
    b.posle(y.nam);
    igra.takt(x.nam, [y.nam]);
    a.schitatCentr();
    b.schitatCentr();
    const o = ocenka(a, b, igra);
    if (o > luchshaya) luchshaya = o;
    // проход ловим В МОМЕНТ прохода: пара может уехать дальше и попасть на чекпоинт
    if (u.proydeno(a, b, igra)) return { proshli: true, luchshaya: o };
  }
  return { proshli: false, luchshaya };
}

export interface Nahodka {
  proshli: boolean;
  luchshaya: number;
  plan: Plan;
  planVtorogo: Plan | null;
  popytok: number;
}

/**
 * Восхождение по случайным порчам. Если `vtoroy` задан — второе тело ведёт ОН (проверка
 * пассажира: герой ищет проход как может, напарник заперт в своей повадке). Иначе ищутся
 * оба плана сразу.
 */
export function iskatProhod(
  u: Uchastok,
  ocenka: Ocenka,
  opcii: { popytok?: number; semya?: number; vtoroy?: Povadka; bezSliyaniya?: boolean } = {},
): Nahodka {
  const { popytok = 400, semya = 1, vtoroy, bezSliyaniya = false } = opcii;
  const r = zerno(semya);
  const snyatSliyanie = (p: Plan) => (bezSliyaniya ? p.map((o) => ({ ...o, slit: false })) : p);
  let planA = snyatSliyanie(sluchaynyyPlan(r));
  let planB = vtoroy ? null : snyatSliyanie(sluchaynyyPlan(r));
  const ocenit = (pa: Plan, pb: Plan | null) =>
    progonSOcenkoy(u, povadkaIzPlana(pa), pb ? povadkaIzPlana(pb) : (vtoroy as Povadka), ocenka);
  let luchshee = ocenit(planA, planB);
  for (let i = 0; i < popytok && !luchshee.proshli; i++) {
    const menyaemPervyy = !planB || r() < 0.5;
    const kandidatA = menyaemPervyy ? snyatSliyanie(isportit(planA, r)) : planA;
    const kandidatB =
      !menyaemPervyy && planB ? snyatSliyanie(isportit(planB, r)) : planB;
    const itog = ocenit(kandidatA, kandidatB);
    if (itog.proshli || itog.luchshaya > luchshee.luchshaya) {
      planA = kandidatA;
      planB = kandidatB;
      luchshee = itog;
    }
  }
  return { ...luchshee, plan: planA, planVtorogo: planB, popytok };
}
