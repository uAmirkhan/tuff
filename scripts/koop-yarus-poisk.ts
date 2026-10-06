// Ярус вдвоём: напарник не изображается скриптом, а ПОДБИРАЕТСЯ.
//
// Метрика «проходимых вдвоём 3 из 8» считала так: герой идёт по своему соло-плану, напарник
// следует за ним по одной из восьми заготовленных повадок (спавн спереди/сзади × копирует
// способности или нет × ждёт или нет). k1-2 и k1-3 в ней падают с «план кончился, до выхода не
// дошли» — то есть напарник мешает герою, а не уровень плох.
//
// Открытый план из отрезков (koop-poisk) через целый уровень напарника не проводит: ему нужна
// РЕАКТИВНАЯ повадка, которая смотрит, где герой. Поэтому здесь ищутся ПАРАМЕТРЫ повадки, а не
// последовательность нажатий. Восемь прежних конфигураций — три бита этого же пространства.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVNI } from '../src/level/spisok';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import { PLANY, type Shag } from '../tests/plany';

const TAKTOV = 3200;

interface Nastroyki {
  smeshchenie: number; // спавн напарника по x относительно героя
  kopiruet: boolean; // повторять способности героя
  porogOtstal: number; // дальше этого по x — догонять, а не копировать
  zhdet: boolean; // если герой позади — стоять и не мешать
  zaderzhka: number; // повторять ввод героя с запаздыванием в тактах
}

function namGeroya(shagi: Shag[], t: number): Namerenie {
  let ostalos = t;
  for (const s of shagi) {
    if (ostalos < s.takty) return { ...PUSTOE, ...s.nam } as Namerenie;
    ostalos -= s.takty;
  }
  return { ...PUSTOE };
}

function progon(id: string, n: Nastroyki): { proshli: boolean; ostalos: number } {
  const uroven = UROVNI.find((u) => u.id === id);
  if (!uroven) throw new Error(`нет уровня ${id}`);
  const shagi = PLANY[id];
  if (!shagi) throw new Error(`нет плана для ${id}`);
  const vyhod = uroven.obekty?.find((o) => o.tip === 'vyhod');
  if (!vyhod) throw new Error(`нет выхода в ${id}`);

  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, uroven);
  const a = new Telo(mir, uroven.start[0], uroven.start[1]);
  const b = new Telo(mir, uroven.start[0] + n.smeshchenie, uroven.start[1]);
  const igra = new Igra(mir, a, ur);
  igra.dobavitSputnika(b);

  let blizhe = Number.POSITIVE_INFINITY;
  for (let t = 0; t < TAKTOV; t++) {
    const na = namGeroya(shagi, t);
    const naProshlyy = namGeroya(shagi, Math.max(0, t - n.zaderzhka));
    // напарник: догнать, если отстал; ждать, если герой позади; иначе копировать или просто идти
    const dx = a.cx - b.cx;
    let nb: Namerenie;
    if (Math.abs(dx) > n.porogOtstal) nb = { ...PUSTOE, dx: dx > 0 ? 1 : -1 };
    else if (n.zhdet && dx < -0.3) nb = { ...PUSTOE };
    else if (n.kopiruet) nb = naProshlyy;
    else nb = { ...PUSTOE, dx: (na.dx || 0) as -1 | 0 | 1 };

    igra.doShaga();
    a.primenit(na, igra.korkaSredy);
    b.primenit(nb, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(na);
    b.posle(nb);
    igra.takt(na, [nb]);
    a.schitatCentr();
    b.schitatCentr();
    const d = Math.max(
      Math.hypot(a.cx - vyhod.x, a.cy - vyhod.y),
      Math.hypot(b.cx - vyhod.x, b.cy - vyhod.y),
    );
    if (d < blizhe) blizhe = d;
    if (igra.gotovo) return { proshli: true, ostalos: 0 };
  }
  return { proshli: false, ostalos: blizhe };
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

function sluchaynye(r: () => number): Nastroyki {
  return {
    smeshchenie: (r() * 4 - 2) as number,
    kopiruet: r() < 0.5,
    porogOtstal: 0.8 + r() * 4,
    zhdet: r() < 0.5,
    zaderzhka: Math.floor(r() * 60),
  };
}

function isportit(n: Nastroyki, r: () => number): Nastroyki {
  const m = { ...n };
  const c = r();
  if (c < 0.25) m.smeshchenie = Math.max(-2.5, Math.min(2.5, m.smeshchenie + (r() - 0.5)));
  else if (c < 0.45) m.kopiruet = !m.kopiruet;
  else if (c < 0.7) m.porogOtstal = Math.max(0.5, m.porogOtstal + (r() - 0.5) * 1.5);
  else if (c < 0.85) m.zhdet = !m.zhdet;
  else m.zaderzhka = Math.max(0, m.zaderzhka + Math.floor((r() - 0.5) * 40));
  return m;
}

const POPYTOK = Number(process.argv[2] ?? 80);
const TOLKO = process.argv[3];
console.log(`=== Ярус вдвоём, напарник подбирается (${POPYTOK} попыток на уровень) ===`);
console.log('уровень  вдвоём  подобранный напарник');
for (const id of Object.keys(PLANY)) {
  if (TOLKO && id !== TOLKO) continue;
  const r = zerno(17);
  let luchshie = sluchaynye(r);
  let luchshee = progon(id, luchshie);
  for (let i = 0; i < POPYTOK && !luchshee.proshli; i++) {
    const k = isportit(luchshie, r);
    const it = progon(id, k);
    if (it.proshli || it.ostalos < luchshee.ostalos) {
      luchshie = k;
      luchshee = it;
    }
  }
  const opis = `смещение ${luchshie.smeshchenie.toFixed(1)}, ${luchshie.kopiruet ? 'копирует' : 'не копирует'}, порог ${luchshie.porogOtstal.toFixed(1)}, ${luchshie.zhdet ? 'ждёт' : 'не ждёт'}, задержка ${luchshie.zaderzhka}`;
  console.log(
    `${id.padEnd(8)} ${(luchshee.proshli ? ' да ' : ' НЕТ').padEnd(7)} ${luchshee.proshli ? opis : `не дошли, ближе всего ${luchshee.ostalos.toFixed(1)} от выхода`}`,
  );
}
