// k1-6 «Промывка яруса» вдвоём. Уровень не попадал в кооп-метрику, потому что героя в нём ведёт
// не записанный план, а реактивная повадка: вода поднимается по регламенту, и путь зависит от
// того, где тело оказалось. Повадка вынесена в tests/povadki.ts, и теперь ею можно вести ОБА тела.
//
// Вопрос уровня к кооперативу прямой: успеет ли второй. Выход требует обоих, вода не ждёт.
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { Telo } from '../src/game/telo';
import { UROVEN_K1_6 } from '../src/level/urovni/k1-6';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
import { zigzagK16 } from '../tests/povadki';

const TAKTOV = 4000;

function progon(smeshchenie: number, zaderzhkaStarta: number) {
  const u = UROVEN_K1_6;
  const mir = new Mir(MIR);
  const ur = zagruzitUroven(mir, u);
  const a = new Telo(mir, u.start[0], u.start[1]);
  const b = new Telo(mir, u.start[0] + smeshchenie, u.start[1]);
  const igra = new Igra(mir, a, ur);
  igra.dobavitSputnika(b);
  const voda = ur.sushchnosti.find((s) => s.id === 'promyvka');
  if (!voda) throw new Error('нет воды promyvka');
  const vedyotA = zigzagK16('bystro');
  const vedyotB = zigzagK16('bystro');
  let vyshe = -Infinity;
  for (let t = 0; t < TAKTOV; t++) {
    a.schitatCentr();
    b.schitatCentr();
    const na = vedyotA(a, igra);
    // второй стартует позже: иначе тела мешают друг другу в одной дыре
    const nb = t < zaderzhkaStarta ? { ...na, dx: 0 as const, dy: 0 as const } : vedyotB(b, igra);
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
    if (igra.gotovo) return { proshli: true, t, vyshe, smerti: igra.smerti };
  }
  return { proshli: false, t: TAKTOV, vyshe, smerti: igra.smerti };
}

console.log('=== k1-6 вдвоём: обоих ведёт зигзаг ===');
console.log('смещение  задержка  итог');
let hotBy = false;
for (const sm of [-1.5, -0.8, 0.8, 1.5]) {
  for (const z of [0, 60, 150, 300]) {
    const r = progon(sm, z);
    if (r.proshli) hotBy = true;
    console.log(
      `${sm.toFixed(1).padStart(8)} ${String(z).padStart(9)}  ${r.proshli ? `ПРОШЛИ за ${r.t} тактов, смертей ${r.smerti}` : `не прошли, отстающий поднялся до ${r.vyshe.toFixed(1)}, смертей ${r.smerti}`}`,
    );
  }
}
console.log(hotBy ? '\nИТОГ: k1-6 проходим вдвоём' : '\nИТОГ: k1-6 вдвоём не проходится');
