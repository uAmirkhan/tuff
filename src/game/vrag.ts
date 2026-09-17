// Враги мира 1: Обрезок (ползёт и жжёт холодом) и Скачок (то же, иногда прыгает).
// Тело: 4 точки прямоугольником с диагоналями и контуром площади. ИИ: общий автомат.

import type { Mir } from '../physics/mir';
import { SEMEYSTVA, VRAGI } from './config/vragi';

export type TipVraga = 'obrezok' | 'skachok' | 'uborshchik';

export class Vrag {
  readonly ot: number;
  readonly n = 4;
  readonly kontur: number;
  zhar: number;
  zhiv = true;
  napravlenie = 1;
  kasaetsya = false; // касается героя в этом такте: вцепился, не давит дальше
  vyklyuchen = false; // замкнут в воде (дрон) или застыл (обрезок): не двигается, не жжёт
  vVodeTaktov = 0;
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
    const tv = SEMEYSTVA[tip].tverdyy;
    const zh = tv ? 0.9 : 0.6,
      zhd = tv ? 0.9 : 0.4;
    for (let i = 0; i < 4; i++) mir.dobavitSvyaz(this.ot + i, this.ot + ((i + 1) % 4), zh, 1);
    mir.dobavitSvyaz(this.ot, this.ot + 2, zhd, 1);
    mir.dobavitSvyaz(this.ot + 1, this.ot + 3, zhd, 1);
    this.kontur = mir.dobavitKontur(this.ot, 4, tv ? 0.5 : 0.3, 1);
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
  private proshlyyX = Number.NaN;
  private zastryal = 0;
  dumat(igrokX: number, igrokY: number, takt: number): void {
    if (!this.zhiv || this.vyklyuchen) return;
    const k = VRAGI[this.tip];
    const sem = SEMEYSTVA[this.tip];
    const m = this.mir;
    this.schitatCentr();
    const dx = igrokX - this.cx;
    const dy = igrokY - this.cy;
    const dist = Math.hypot(dx, dy);
    if (dist > k.zrenie) {
      if (!sem.patrul) return; // не видит и не патрулирует
      // патруль: едет в текущую сторону, у стены разворачивается (нет продвижения 30 тактов)
      if (!Number.isNaN(this.proshlyyX) && Math.abs(this.cx - this.proshlyyX) < 0.002)
        this.zastryal++;
      else this.zastryal = 0;
      this.proshlyyX = this.cx;
      if (this.zastryal > 30) {
        this.napravlenie = -this.napravlenie;
        this.zastryal = 0;
      }
      if (this.naZemle())
        for (let i = this.ot; i < this.ot + this.n; i++)
          m.px[i] = (m.px[i] as number) - this.napravlenie * k.tyaga * 0.6;
      return;
    }
    this.napravlenie = dx > 0 ? 1 : -1;
    // 7 тактов из 8 идёт целенаправленно, иначе замирает
    if ((takt & 7) === 7) return;
    // дрон толкает и при касании: в этом его регламент; обрезок вцепляется и не давит
    const tolkaet = sem.tverdyy || !this.kasaetsya;
    if (this.naZemle() && tolkaet) {
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
