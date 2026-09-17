import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { urovenPoId } from '../src/level/spisok';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';
function rnd(z: number) { let s = z; return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
for (const id of ['1-4', '1-5']) {
  const u = urovenPoId(id)!; const mir = new Mir(MIR); const ur = zagruzitUroven(mir, u);
  const telo = new Telo(mir, u.start[0], u.start[1]); const igra = new Igra(mir, telo, ur);
  const r = rnd(id.length * 977 + 5); let nam: Namerenie = { ...PUSTOE };
  const prichiny = new Map<string, number>(); const gde: string[] = [];
  for (let t = 0; t < 4000; t++) {
    if (t % (10 + Math.floor(r() * 50)) === 0) nam = { dx: r() < 0.3 ? 0 : r() < 0.5 ? -1 : 1, dy: r() < 0.5 ? 0 : r() < 0.5 ? -1 : 1, vyazkost: r() < 0.35, rasplav: r() < 0.2, korka: r() < 0.25, vybros: r() < 0.3 };
    igra.doShaga(); telo.primenit(nam, igra.korkaSredy); mir.shag(); telo.posle(nam); igra.takt(nam);
    for (const s of igra.sobytiya) if (s.tip === 'storozh') { prichiny.set(s.prichina, (prichiny.get(s.prichina) ?? 0) + 1); if (gde.length < 6) { telo.schitatCentr(); const vr = igra.vragi.filter((v) => v.zhiv).map((v) => { v.schitatCentr(); return `${v.tip}(${v.cx.toFixed(1)},${v.cy.toFixed(1)})`; }); gde.push(`t${t} x${telo.cx.toFixed(1)} y${telo.cy.toFixed(1)} ${JSON.stringify(nam)} враги ${vr.join(' ')}`); } }
  }
  console.log(id, Object.fromEntries(prichiny)); for (const g of gde) console.log('  ', g);
}
