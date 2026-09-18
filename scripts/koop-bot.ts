// Бот-проверка кооп-участка на болезнь «пассажир».
//
// Правило из вики (16-koop-dizayn, раздел 2.1): участок болен, если проходится, когда одного
// игрока заменили ботом, который просто держит кнопку. Здесь это правило превращено в прогон.
//
// Ловушка, на которую я уже наступил вручную: если проверять только спящего партнёра, то любое
// препятствие на слиянии выглядит здоровым — ведь слияние требует двух нажатий. Поэтому пассажир
// проверяется НЕСКОЛЬКИМИ повадками, включая «нажал слияние и дальше ничего не делает».
//
// И вторая половина честности: участок, который не проходится и вдвоём, не «здоровый», а сломанный.
// Поэтому всегда считается контрольный прогон с двумя активными ботами.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

export interface Uchastok {
  nazvanie: string;
  uroven: Uroven;
  /** где стоят тела в начале участка */
  gde: [[number, number], [number, number]];
  /** участок пройден */
  proydeno: (a: Telo, b: Telo, igra: Igra) => boolean;
  taktov: number;
}

/** Ввод одного игрока на такт: намерение плюс кнопка слияния. */
export interface Hod {
  nam: Namerenie;
  slit: boolean;
}

export type Povadka = (takt: number, sluchay: () => number) => Hod;

const h = (n: Partial<Namerenie>, slit = false): Hod => ({ nam: { ...PUSTOE, ...n }, slit });

/** Повадки пассажира: всё, что человек может делать, не участвуя. */
export const PASSAZHIRY: Record<string, Povadka> = {
  спит: () => h({}),
  'держит слияние': () => h({}, true),
  'держит слияние и Вязкость': () => h({ vyazkost: true }, true),
  'держит слияние и Корку': () => h({ korka: true }, true),
  'жмёт вперёд': () => h({ dx: 1 }),
  'жмёт вперёд и слияние': () => h({ dx: 1 }, true),
};

/** Случайный бот с инерцией: держит выбранное намерение 10-40 тактов, потом меняет. */
export function sluchaynyyBot(): Povadka {
  let do_ = 0;
  let hod: Hod = h({});
  return (takt, sluchay) => {
    if (takt >= do_) {
      do_ = takt + 10 + Math.floor(sluchay() * 30);
      hod = h(
        {
          dx: sluchay() < 0.55 ? 1 : sluchay() < 0.8 ? -1 : 0,
          dy: sluchay() < 0.4 ? 1 : 0,
          vyazkost: sluchay() < 0.35,
          rasplav: sluchay() < 0.2,
          korka: sluchay() < 0.25,
          vybros: sluchay() < 0.25,
        },
        sluchay() < 0.5,
      );
    }
    return hod;
  };
}

/** Детерминированный генератор: один и тот же зерно даёт один и тот же прогон. */
function zerno(s: number): () => number {
  let x = s >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

export function progon(u: Uchastok, pervyy: Povadka, vtoroy: Povadka, s: number): boolean {
  const sluchay = zerno(s);
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u.uroven);
  const a = new Telo(mir, u.gde[0][0], u.gde[0][1]);
  const b = new Telo(mir, u.gde[1][0], u.gde[1][1]);
  const igra = new Igra(mir, a, ur);
  igra.dobavitSputnika(b);
  let slito = false;
  for (let t = 0; t < u.taktov; t++) {
    const x = pervyy(t, sluchay);
    const y = vtoroy(t, sluchay);
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
    if (u.proydeno(a, b, igra)) return true;
  }
  return false;
}

export interface Vердикт {
  nazvanie: string;
  vdvoyom: number; // сколько попыток из N прошли двумя активными ботами
  bolezn: string[]; // повадки пассажира, при которых участок всё равно проходится
}

export function proveritPassazhira(u: Uchastok, popytok = 30): Vердикт {
  let vdvoyom = 0;
  for (let i = 0; i < popytok; i++)
    if (progon(u, sluchaynyyBot(), sluchaynyyBot(), 1000 + i)) vdvoyom++;
  const bolezn: string[] = [];
  for (const [imya, p] of Object.entries(PASSAZHIRY)) {
    for (let i = 0; i < popytok; i++) {
      if (progon(u, sluchaynyyBot(), p, 2000 + i)) {
        bolezn.push(imya);
        break;
      }
    }
  }
  return { nazvanie: u.nazvanie, vdvoyom, bolezn };
}

export function pechat(v: Vердикт, popytok: number): void {
  // Проверка доказывает только болезнь. Если случайные боты не прошли и вдвоём, это значит,
  // что боты не справились с координацией, а НЕ что участок сломан. Вердикта в таком случае нет.
  if (v.vdvoyom === 0) {
    console.log(
      `  ${v.nazvanie}: — вердикта нет: боты не прошли и вдвоём за ${popytok} попыток, нужен сценарий вручную`,
    );
    return;
  }
  if (v.bolezn.length === 0) {
    console.log(`  ${v.nazvanie}: ✓ здоров (вдвоём ${v.vdvoyom}/${popytok}, пассажиром ни разу)`);
    return;
  }
  console.log(
    `  ${v.nazvanie}: ⚠ ПАССАЖИР (вдвоём ${v.vdvoyom}/${popytok}); проходится, когда партнёр: ${v.bolezn.join(', ')}`,
  );
}
