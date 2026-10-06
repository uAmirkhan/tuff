// Композиция способностей: Корка и Вязкость на одном теле запрещены кодом (telo.ts:135,186).
// Поток ослабляется Коркой в семь раз (POTOK.korka = 0.15) и считается ПО КАЖДОМУ ТЕЛУ.
// Вопрос: держится ли слитая пара на стене в потоке, который срывает липкое тело,
// если один держит Корку, а второй Вязкость. Двум неслитым это не даёт ничего:
// множитель Корки живёт на своих частицах, а связей между телами нет.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { PUSTOE, Telo } from '../src/game/telo';
import type { Uroven } from '../src/level/format';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

const STENA = 10; // левая грань стены, к ней липнем
const VYSOTA = 4; // на какой высоте висим над ямой

function pole(sila: number): Uroven {
  return {
    versiya: 1,
    id: 'klip-potok',
    nazvanie: 'Сквозняк',
    mysl: 'Липкий и тяжёлый одновременно',
    start: [2, 0.6],
    granicy: { minX: -1, minY: -16, maxX: 20, maxY: 16 },
    vremyaZvezdy: 60,
    poligony: [
      { tochki: [[-1, -16], [0, -16], [0, 14], [-1, 14]] },
      { tochki: [[-1, -16], [4, -16], [4, 0], [-1, 0]] },
      { tochki: [[STENA, -16], [20, -16], [20, 14], [STENA, 14]] },
    ],
    obekty: [
      { tip: 'vyhod', id: 'v', x: 2, y: 0.5 },
      // сквозняк отдувает от стены: сила по -x, значит silaX положительный толкает в -x
      { tip: 'potok', id: 'p', x: 4, y: 0, w: STENA - 4, h: 12, silaX: sila, silaY: 0 },
    ],
  };
}

type Rezhim = 'odin-lipkiy' | 'dvoe-lipkih' | 'slitaya-para';

function derzhitsya(sila: number, rezhim: Rezhim, faza: number): boolean {
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, pole(sila));
  const a = new Telo(mir, STENA - 0.55, VYSOTA);
  const dvoe = rezhim !== 'odin-lipkiy';
  const b = dvoe ? new Telo(mir, STENA - 1.55, VYSOTA) : null;
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
  type Namerenie = typeof PUSTOE;
  const lipkiy: Namerenie = { ...PUSTOE, vyazkost: true, dx: 1 };
  const korka: Namerenie = { ...PUSTOE, korka: true, dx: 1 };

  // прилипнуть: оба липкие, жмут к стене
  for (let t = 0; t < 60 + faza; t++) shag(lipkiy, lipkiy);
  if (rezhim === 'slitaya-para') {
    for (let t = 0; t < 180 && !igra.slito; t++) {
      shag(lipkiy, lipkiy);
      igra.slit();
    }
    if (!igra.slito) return false;
  }
  // рабочая фаза: в слитой паре ОДИН уходит в Корку, второй держит хватку
  const rabA = rezhim === 'slitaya-para' ? korka : lipkiy;
  for (let t = 0; t < 300; t++) {
    shag(rabA, lipkiy);
    if (a.cy < VYSOTA - 2.5) return false; // сорвало и падает
    if (b && b.cy < VYSOTA - 2.5) return false;
  }
  return true;
}

console.log('=== Держится ли на стене в сквозняке (5 фаз) ===');
console.log('сила | один липкий | двое липких рядом | слитая пара Корка+Вязкость');
const FAZY = [0, 7, 13, 19, 29];
for (const s of [2, 5, 10, 20, 40, 80, 160]) {
  const r = (rezhim: Rezhim) => FAZY.filter((f) => derzhitsya(s, rezhim, f)).length;
  console.log(
    `${String(s).padStart(4)} | ${String(r('odin-lipkiy')).padStart(11)} | ${String(r('dvoe-lipkih')).padStart(17)} | ${String(r('slitaya-para')).padStart(26)}`,
  );
}
