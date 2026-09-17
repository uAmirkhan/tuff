// Запись ввода по тактам и призрак: воспроизведение записи в собственном мире.
// Гарантия совпадения: та же сборка, тот же браузер, то же устройство (06, раздел 3.4).

import type { Uroven } from '../level/format';
import { zagruzitUroven } from '../level/zagruzka';
import type { Mir } from '../physics/mir';
import { Mir as MirKlass } from '../physics/mir';
import { MIR } from './config/telo';
import { Igra } from './igra';
import { type Namerenie, PUSTOE, Telo } from './telo';

// Такт кодируется числом: dx в -1/0/1 (0..2), dy (0..2), четыре флага
export function kodirovat(n: Namerenie): number {
  const dx = n.dx > 0.2 ? 2 : n.dx < -0.2 ? 0 : 1;
  const dy = n.dy > 0.2 ? 2 : n.dy < -0.2 ? 0 : 1;
  return (
    dx |
    (dy << 2) |
    ((n.vyazkost ? 1 : 0) << 4) |
    ((n.rasplav ? 1 : 0) << 5) |
    ((n.korka ? 1 : 0) << 6) |
    ((n.vybros ? 1 : 0) << 7)
  );
}

export function dekodirovat(k: number): Namerenie {
  return {
    dx: (k & 3) - 1,
    dy: ((k >> 2) & 3) - 1,
    vyazkost: !!(k & 16),
    rasplav: !!(k & 32),
    korka: !!(k & 64),
    vybros: !!(k & 128),
  };
}

export class Zapis {
  readonly takty: number[] = [];
  dobavit(n: Namerenie): void {
    this.takty.push(kodirovat(n));
  }
}

// Призрак: отдельный мир с тем же уровнем, ввод из записи, тело для отрисовки
export class Prizrak {
  readonly mir: Mir;
  readonly telo: Telo;
  readonly igra: Igra;
  takt = 0;
  constructor(
    uroven: Uroven,
    readonly zapis: number[],
  ) {
    this.mir = new MirKlass(MIR);
    const ur = zagruzitUroven(this.mir, uroven);
    this.telo = new Telo(this.mir, uroven.start[0], uroven.start[1]);
    this.igra = new Igra(this.mir, this.telo, ur);
  }

  get zakonchen(): boolean {
    return this.takt >= this.zapis.length;
  }

  shag(): void {
    if (this.zakonchen) return;
    const nam = dekodirovat(this.zapis[this.takt] ?? kodirovat(PUSTOE));
    this.igra.doShaga();
    this.telo.primenit(nam, this.igra.korkaSredy);
    this.mir.shag();
    this.telo.posle(nam);
    this.igra.takt(nam);
    this.takt++;
  }
}
