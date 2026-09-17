// Враги мира 1: Обрезок (ползёт и жжёт холодом) и Скачок (то же, иногда прыгает).
// Тело: 4 точки прямоугольником с диагоналями и контуром площади. ИИ: общий автомат.

import type { Mir } from '../physics/mir';
import { VRAGI } from './config/vragi';

export type TipVraga = 'obrezok' | 'skachok';

export class Vrag {
  readonly ot: number;
  readonly n = 4;
  readonly kontur: number;
  zhar: number;
  zhiv = true;
  napravlenie = 1;
  kasaetsya = false; // касается героя в этом такте: вцепился, не давит дальше
  private pryzhokTakt = 0;
  private sluchay: number;
  cx = 0;
  cy = 0;

  constructor(
    readonly mir: Mir,
    readonly tip: TipVraga,
    x: number,
    y: number,
    zerno = 1,
  ) {
    const k = VRAGI[tip];
    this.zhar = k.zhar;
    this.sluchay = zerno;
    this.ot = mir.n;
    const hw = k.shirina / 2,
      hh = k.vysota / 2;
    // обход по часовой: (-,+) (+,+) (+,-) (-,-) даёт отрицательную площадь; берём против часовой
    mir.dobavitTochku(x - hw, y - hh, k.massa, 0.05, k.trenie, 0.99);
    mir.dobavitTochku(x + hw, y - hh, k.massa, 0.05, k.trenie, 0.99);
    mir.dobavitTochku(x + hw, y + hh, k.massa, 0.05, k.trenie, 0.99);
    mir.dobavitTochku(x - hw, y + hh, k.massa, 0.05, k.trenie, 0.99);
    for (let i = 0; i < 4; i++) mir.dobavitSvyaz(this.ot + i, this.ot + ((i + 1) % 4), 0.6, 1);
    mir.dobavitSvyaz(this.ot, this.ot + 2, 0.4, 1);
    mir.dobavitSvyaz(this.ot + 1, this.ot + 3, 0.4, 1);
    this.kontur = mir.dobavitKontur(this.ot, 4, 0.3, 1);
  }

  // детерминированный случай
  private rnd(): number {
    this.sluchay = (this.sluchay * 1103515245 + 12345) & 0x7fffffff;
    return this.sluchay / 0x7fffffff;
  }

  schitatCentr(): void {
    const m = this.mir;
    let sx = 0,
      sy = 0;
    for (let i = this.ot; i < this.ot + this.n; i++) {
      sx += m.x[i] as number;
      sy += m.y[i] as number;
    }
    this.cx = sx / this.n;
    this.cy = sy / this.n;
  }

  naZemle(): boolean {
    for (let i = this.ot; i < this.ot + this.n; i++) {
      if (this.mir.kontakt[i] && (this.mir.kontNy[i] as number) > 0.5) return true;
    }
    return false;
  }

  // ИИ: идти к игроку по горизонтали, при сближении вцепиться (урон считает игра).
  // Вызывать до mir.shag().
  dumat(igrokX: number, igrokY: number, takt: number): void {
    if (!this.zhiv) return;
    const k = VRAGI[this.tip];
    const m = this.mir;
    this.schitatCentr();
    const dx = igrokX - this.cx;
    const dy = igrokY - this.cy;
    const dist = Math.hypot(dx, dy);
    if (dist > k.zrenie) return; // не видит
    this.napravlenie = dx > 0 ? 1 : -1;
    // 7 тактов из 8 идёт целенаправленно, иначе замирает
    if ((takt & 7) === 7) return;
    if (this.naZemle() && !this.kasaetsya) {
      for (let i = this.ot; i < this.ot + this.n; i++)
        m.px[i] = (m.px[i] as number) - this.napravlenie * k.tyaga;
      // Скачок иногда прыгает, если игрок выше или далеко
      if (k.pryzhok > 0 && takt - this.pryzhokTakt > 90 && this.rnd() < k.shansPryzhka) {
        this.pryzhokTakt = takt;
        for (let i = this.ot; i < this.ot + this.n; i++) m.py[i] = (m.py[i] as number) - k.pryzhok;
      }
    }
  }

  gabarity(): { minX: number; maxX: number; minY: number; maxY: number } {
    const m = this.mir;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (let i = this.ot; i < this.ot + this.n; i++) {
      const x = m.x[i] as number,
        y = m.y[i] as number;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return { minX, maxX, minY, maxY };
  }

  // Убрать тело из мира: точки уводятся далеко и обездвиживаются, связи выключаются
  umeret(): void {
    this.zhiv = false;
    const m = this.mir;
    for (let i = this.ot; i < this.ot + this.n; i++) {
      m.x[i] = -1000 - i;
      m.y[i] = -1000;
      m.px[i] = m.x[i] as number;
      m.py[i] = m.y[i] as number;
      m.gravMul[i] = 0;
    }
    m.cZhest[this.kontur] = 0;
  }
}
