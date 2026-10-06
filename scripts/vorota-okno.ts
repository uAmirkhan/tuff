// Окно ворот по высоте: замер klip-razbeg дал, что при стене 2,2 двое неслитых дотягивают
// до 1,85, а слитая пара до 4,18. В koop-1 стена стоит 2,0 — по тем же числам двое рядом
// дают 3,06 и ворота проходят без слияния. Гипотеза: ворота не мертвы, они просто НИЖЕ окна.
// Здесь критерий бинарный и строгий, как в koop-1: ОБА тела на плато, а не висят на краю.
// Пассажир проверяется отдельно: партнёр, который только держит «вперёд», и партнёр, который
// не делает ничего.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, type Namerenie, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const STENA = 30;
const RAZBEG = 14;

function pole(vysota: number): Uroven {
  return {
    versiya: 1,
    id: 'vorota-okno',
    nazvanie: 'Окно',
    mysl: 'Высота, которую берёт только слитая пара',
    start: [2, 0.6],
    granicy: { minX: -1, minY: -3, maxX: STENA + 16, maxY: 20 },
    vremyaZvezdy: 90,
    poligony: [
      { tochki: [[-1, -3], [0, -3], [0, 18], [-1, 18]] },
      { tochki: [[-1, -3], [STENA + 16, -3], [STENA + 16, 0], [-1, 0]] },
      {
        tochki: [[STENA, 0], [STENA + 15, 0], [STENA + 15, vysota], [STENA, vysota]],
        material: 'lyod',
      },
    ],
    obekty: [{ tip: 'vyhod', id: 'v', x: STENA + 13, y: vysota + 0.5 }],
  };
}

type Rezhim =
  | 'odin'
  | 'dvoe-ryadom'
  | 'slitaya-para'
  | 'passazhir-vpered' // партнёр только держит «вперёд», слияния нет
  | 'passazhir-stoit'; // партнёр не делает ничего

function proshli(vysota: number, rezhim: Rezhim, faza: number): boolean {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, pole(vysota));
  const a = new Telo(mir, STENA - RAZBEG, 0.6);
  const b = rezhim === 'odin' ? null : new Telo(mir, STENA - RAZBEG - 1.1, 0.6);
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
  const vpravo: Namerenie = { ...PUSTOE, dx: 1 };
  for (let t = 0; t < 30 + faza; t++) shag(stoyat, stoyat);
  if (rezhim === 'slitaya-para') {
    for (let t = 0; t < 180 && !igra.slito; t++) {
      shag(stoyat, vpravo);
      igra.slit();
    }
    if (!igra.slito) return false;
  }
  const lez: Namerenie = { ...PUSTOE, vybros: true, dy: 1, dx: 1 };
  // строго: центр выше верха стены на радиус и тело уже над плато
  const naPlato = (t: Telo) => t.cx > STENA + 0.5 && t.cy > vysota + 0.5;
  // проверяем НА КАЖДОМ такте: на льду пара скатывается с плато за границу, игра возвращает её
  // на чекпоинт, и чтение состояния в конце прогона показало бы стартовую площадку
  for (let t = 0; t < 600; t++) {
    const uSteny = Math.max(a.cx, b?.cx ?? 0) > STENA - 1.8;
    const n = uSteny ? lez : vpravo;
    const nb =
      rezhim === 'passazhir-vpered' ? vpravo : rezhim === 'passazhir-stoit' ? stoyat : n;
    shag(n, nb);
    if (b ? naPlato(a) && naPlato(b) : naPlato(a)) return true;
  }
  return false;
}

console.log('=== Окно ворот: прошли ОБА (из 5 фаз) ===');
console.log('стена | одиночка | двое рядом | слитая пара | пассажир «вперёд» | пассажир стоит');
const FAZY = [0, 7, 13, 19, 29];
for (const v of [2.0, 2.2, 2.4, 2.6, 2.8]) {
  const r = (rezhim: Rezhim) => FAZY.filter((f) => proshli(v, rezhim, f)).length;
  console.log(
    `${v.toFixed(1).padStart(5)} | ${String(r('odin')).padStart(8)} | ${String(r('dvoe-ryadom')).padStart(10)} | ${String(r('slitaya-para')).padStart(11)} | ${String(r('passazhir-vpered')).padStart(17)} | ${String(r('passazhir-stoit')).padStart(14)}`,
  );
}
