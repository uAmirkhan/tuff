// Фазз: случайный ввод на каждом уровне. Ищем NaN, вылет за мир, частые срабатывания сторожей,
// взрывы врагов и цепей. Детерминированный генератор, чтобы падение воспроизводилось.
import { describe, expect, it } from 'vitest';
import { MIR } from '../src/game/config/telo';
import { Igra } from '../src/game/igra';
import { type Namerenie, PUSTOE, Telo } from '../src/game/telo';
import { UROVNI } from '../src/level/spisok';
import { zagruzitUroven } from '../src/level/zagruzka';
import { Mir } from '../src/physics/mir';

function rnd(zerno: number): () => number {
  let s = zerno;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

describe('фазз случайным вводом', () => {
  for (const u of UROVNI) {
    it(`${u.id}: 4000 тактов без NaN и вылетов`, () => {
      const mir = new Mir(MIR);
      const ur = zagruzitUroven(mir, u);
      const telo = new Telo(mir, u.start[0], u.start[1]);
      const igra = new Igra(mir, telo, ur);
      const r = rnd(u.id.length * 977 + 5);
      let nam: Namerenie = { ...PUSTOE };
      let storozhey = 0;
      for (let t = 0; t < 4000; t++) {
        // держим ввод 10-60 тактов, потом меняем
        if (t % (10 + Math.floor(r() * 50)) === 0) {
          nam = {
            dx: r() < 0.3 ? 0 : r() < 0.5 ? -1 : 1,
            dy: r() < 0.5 ? 0 : r() < 0.5 ? -1 : 1,
            vyazkost: r() < 0.35,
            rasplav: r() < 0.2,
            korka: r() < 0.25,
            vybros: r() < 0.3,
          };
        }
        igra.doShaga();
        telo.primenit(nam, igra.korkaSredy);
        mir.shag();
        telo.posle(nam);
        igra.takt(nam);
        for (const s of igra.sobytiya) if (s.tip === 'storozh') storozhey++;
        for (let i = 0; i < mir.n; i++) {
          const x = mir.x[i] as number,
            y = mir.y[i] as number;
          if (Number.isNaN(x) || Number.isNaN(y))
            throw new Error(`NaN на такте ${t}, частица ${i}`);
        }
        telo.schitatCentr();
        const gr = u.granicy;
        // тело внутри мира с запасом (возрождение возвращает при вылете)
        expect(telo.cx, `такт ${t}`).toBeGreaterThan(gr.minX - 6);
        expect(telo.cx, `такт ${t}`).toBeLessThan(gr.maxX + 6);
        expect(telo.cy, `такт ${t}`).toBeGreaterThan(gr.minY - 4);
      }
      // сторожа не должны срабатывать часто: не больше одного на 400 тактов
      expect(storozhey, 'срабатываний сторожей').toBeLessThanOrEqual(10);
      // враги живые или мёртвые, но не улетели в бесконечность
      for (const v of igra.vragi) {
        if (!v.zhiv) continue;
        v.schitatCentr();
        expect(Math.abs(v.cx)).toBeLessThan(200);
      }
    });
  }
});
