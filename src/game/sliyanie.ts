// Слияние двух тел в одно: прочные связи между ближайшими частицами колец плюс отключение
// расталкивания между контурами. Масса удваивается сама, потому что частиц вдвое больше.
//
// Топологического объединения контуров избегаем сознательно: контур задан непрерывным
// диапазоном частиц и считает площадь обходом по кольцу, поэтому склейка двух колец дала бы
// самопересекающийся многоугольник.
//
// Связи берутся из пула, выделенного один раз: решатель не переиспользует слоты связей,
// и слияние-разделение в цикле иначе исчерпало бы их за минуту игры.
import type { Mir } from '../physics/mir';
import type { Telo } from './telo';

export const SLIYANIE = {
  porogKasaniya: 0.9, // дальше этого частицы не связываются
  minSvyazey: 3, // меньше — тела не касаются, слияние не происходит
  zhestkost: 0.5,
  dolyaDliny: 0.5, // длина связи от замеренного расстояния
  minDlina: 0.12,
} as const;

export class Sliyanie {
  private readonly pul: number[] = [];
  private zanyato = 0;
  aktivno = false;

  constructor(
    readonly mir: Mir,
    readonly a: Telo,
    readonly b: Telo,
  ) {}

  /** Пары «частица А — ближайшая частица Б» ближе порога касания. */
  private pary(): [number, number, number][] {
    const m = this.mir;
    const out: [number, number, number][] = [];
    for (let i = this.a.ot; i < this.a.ot + this.a.n; i++) {
      let luchshiy = -1;
      let luchshee = Number.POSITIVE_INFINITY;
      for (let j = this.b.ot; j < this.b.ot + this.b.n; j++) {
        const dx = (m.x[j] as number) - (m.x[i] as number);
        const dy = (m.y[j] as number) - (m.y[i] as number);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < luchshee) {
          luchshee = d;
          luchshiy = j;
        }
      }
      if (luchshiy >= 0 && luchshee < SLIYANIE.porogKasaniya) out.push([i, luchshiy, luchshee]);
    }
    return out;
  }

  /** Касаются ли тела настолько, чтобы слиться. */
  mozhnoSlit(): boolean {
    return !this.aktivno && this.pary().length >= SLIYANIE.minSvyazey;
  }

  /** Слить. Возвращает false, если тела слишком далеко. */
  slit(): boolean {
    if (this.aktivno) return true;
    const p = this.pary();
    if (p.length < SLIYANIE.minSvyazey) return false;
    const m = this.mir;
    while (this.pul.length < p.length) {
      const s = m.dobavitSvyaz(this.a.ot, this.a.ot, SLIYANIE.zhestkost, 1, SLIYANIE.minDlina);
      m.sZhiva[s] = 0;
      this.pul.push(s);
    }
    for (let k = 0; k < p.length; k++) {
      const s = this.pul[k] as number;
      const [i, j, d] = p[k] as [number, number, number];
      m.sA[s] = i;
      m.sB[s] = j;
      m.sDlina[s] = Math.max(SLIYANIE.minDlina, d * SLIYANIE.dolyaDliny);
      m.sZhest[s] = SLIYANIE.zhestkost;
      m.sKazhdyy[s] = 1;
      m.sOdnostor[s] = 0;
      m.sRazryv[s] = 0;
      m.sZhiva[s] = 1;
    }
    this.zanyato = p.length;
    m.otklyuchitKontaktTel(this.b.kontur);
    this.a.vSliyanii = true;
    this.b.vSliyanii = true;
    this.aktivno = true;
    return true;
  }

  razdelit(): void {
    if (!this.aktivno) return;
    for (let k = 0; k < this.zanyato; k++) this.mir.sZhiva[this.pul[k] as number] = 0;
    this.zanyato = 0;
    this.mir.vklyuchitKontaktTel(this.b.kontur);
    this.a.vSliyanii = false;
    this.b.vSliyanii = false;
    this.aktivno = false;
  }

  /** Сколько связей держит пару прямо сейчас: для отладки и для замеров. */
  get svyazey(): number {
    return this.aktivno ? this.zanyato : 0;
  }
}
