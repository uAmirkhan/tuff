// Бонус «Ствол: подъём 1» вдвоём. Как и k1-6, уровень не попадал в кооп-метрику: героя ведёт
// реактивный конечный автомат по высоте, а не записанный план. Повадка вынесена в
// tests/povadki.ts, и теперь ею можно вести оба тела.
//
// Вопрос уровня: иней на стене сбрасывает замешкавшегося через три секунды хватки, поэтому
// второй не может просто ждать внизу — он обязан лезть сам.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { Telo } from '../src/game/telo';
import { UROVEN_STVOL_1 } from '../src/level/urovni/stvol-1';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import { botStvola, type RezhimStvol } from '../tests/povadki';

const TAKTOV = 6000;

function progon(rezhim: RezhimStvol, smeshchenie: number, zaderzhka: number) {
  const u = UROVEN_STVOL_1;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, u.start[0], u.start[1]);
  const b = new Telo(mir, u.start[0] + smeshchenie, u.start[1]);
  const igra = new Igra(mir, a, ur);
  igra.dobavitSputnika(b);
  const botA = botStvola(rezhim, u.start[0], u.start[1]);
  const botB = botStvola(rezhim, u.start[0] + smeshchenie, u.start[1]);
  let vyshe = -Infinity;
  for (let t = 0; t < TAKTOV; t++) {
    a.schitatCentr();
    b.schitatCentr();
    const na = botA.vedyot(a);
    const nb = t < zaderzhka ? { ...na, dx: 0 as const, dy: 0 as const } : botB.vedyot(b);
    igra.doShaga();
    a.primenit(na, igra.korkaSredy);
    b.primenit(nb, igra.korkaSredyTela(b));
    mir.shag();
    a.posle(na);
    b.posle(nb);
    igra.takt(na, [nb]);
    a.schitatCentr();
    b.schitatCentr();
    vyshe = Math.max(vyshe, Math.min(a.cy, b.cy));
    if (igra.gotovo)
      return { proshli: true, t, vyshe, padeniy: botA.padeniy() + botB.padeniy() };
  }
  return { proshli: false, t: TAKTOV, vyshe, padeniy: botA.padeniy() + botB.padeniy() };
}

console.log('=== Ствол вдвоём: обоих ведёт бот ствола ===');
console.log('режим   смещение  задержка  итог');
let hotBy = false;
for (const r of ['steny', 'potok'] as RezhimStvol[]) {
  for (const sm of [-1.5, -0.8, 0.8, 1.5]) {
    for (const z of [0, 120]) {
      const it = progon(r, sm, z);
      if (it.proshli) hotBy = true;
      console.log(
        `${r.padEnd(7)} ${sm.toFixed(1).padStart(8)} ${String(z).padStart(9)}  ${it.proshli ? `ПРОШЛИ за ${it.t} тактов, падений ${it.padeniy}` : `не прошли, отстающий поднялся до ${it.vyshe.toFixed(1)}, падений ${it.padeniy}`}`,
      );
    }
  }
}
console.log(hotBy ? '\nИТОГ: ствол проходим вдвоём' : '\nИТОГ: ствол вдвоём не проходится');
