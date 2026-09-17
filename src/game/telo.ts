// Тело героя: кольцо частиц в мире и четыре способности как параметры.

import type { Mir } from '../physics/mir';
import { MIR, TELO } from './config/telo';

export interface Namerenie {
  dx: number; // -1..1
  dy: number; // -1..1, вверх положительно
  vyazkost: boolean;
  rasplav: boolean;
  korka: boolean;
  vybros: boolean;
}

export const PUSTOE: Namerenie = {
  dx: 0,
  dy: 0,
  vyazkost: false,
  rasplav: false,
  korka: false,
  vybros: false,
};

// cos и sin шага 22,5° для 16 точек, константы, а не Math.sin в симуляции
const COS = 0.9238795325112867;
const SIN = 0.3826834323650898;
// граница между полом и стеной по нормали контакта: cos 45°
const KOSINUS_45 = 0.70710678;

export class Telo {
  readonly ot: number; // первая частица
  readonly n: number;
  readonly svyaziCentr: number[] = [];
  readonly svyaziKolco: number[] = [];
  readonly kontur: number;
  private vybrosByl = false;
  private korkaByla = false;
  // защита от заклинивания
  private okno = new Float64Array(90);
  private oknoI = 0;

  constructor(
    readonly mir: Mir,
    cx: number,
    cy: number,
    radius = TELO.radius,
  ) {
    this.n = TELO.tochek;
    if (this.n !== 16) throw new Error('таблица углов рассчитана на 16 точек');
    this.ot = mir.n;
    let ux = 1,
      uy = 0;
    for (let i = 0; i < this.n; i++) {
      mir.dobavitTochku(
        cx + ux * radius,
        cy + uy * radius,
        TELO.massaTochki,
        TELO.radiusTochki,
        TELO.trenie,
        TELO.dempfer,
      );
      const nx = ux * COS - uy * SIN;
      const ny = ux * SIN + uy * COS;
      ux = nx;
      uy = ny;
    }
    for (let i = 0; i < this.n; i++) {
      const a = this.ot + i;
      this.svyaziKolco.push(
        mir.dobavitSvyaz(a, this.ot + ((i + 1) % this.n), TELO.kolco.zhestkost, TELO.kolco.kazhdyy),
      );
      const b2 = this.ot + ((i + 2) % this.n);
      const hx = (mir.x[b2] as number) - (mir.x[a] as number);
      const hy = (mir.y[b2] as number) - (mir.y[a] as number);
      const horda = Math.sqrt(hx * hx + hy * hy);
      const s2 = mir.dobavitSvyaz(
        a,
        b2,
        TELO.kolcoCherezOdnogo.zhestkost,
        TELO.kolcoCherezOdnogo.kazhdyy,
        horda * TELO.kolcoCherezOdnogo.dolya,
      );
      mir.sOdnostor[s2] = 1;
      this.svyaziKolco.push(s2);
      if (i < this.n / 2) {
        this.svyaziCentr.push(
          mir.dobavitSvyaz(a, this.ot + i + this.n / 2, TELO.centr.zhestkost, TELO.centr.kazhdyy),
        );
      }
    }
    this.kontur = mir.dobavitKontur(this.ot, this.n, TELO.obyom.zhestkost, TELO.obyom.kazhdyy);
  }

  // Применить намерение к параметрам частиц и связей. Вызывать до mir.shag().
  primenit(nam: Namerenie, korkaSredy = false): void {
    const m = this.mir;
    const korka = nam.korka || korkaSredy;
    const trenie = nam.rasplav ? TELO.rasplavTrenie : TELO.trenie;
    for (let i = this.ot; i < this.ot + this.n; i++) {
      m.trenie[i] = trenie;
      m.gravMul[i] = korka ? TELO.korkaGravitatsiya : 1;
      m.massa[i] = korka ? TELO.massaTochki * TELO.korkaMassa : TELO.massaTochki;
    }
    this.korkaByla = korka;
    // Выброс: связи через центр жёсткие и частые
    const c = nam.vybros ? TELO.centrVybros : TELO.centr;
    for (const s of this.svyaziCentr) {
      m.sZhest[s] = c.zhestkost;
      m.sKazhdyy[s] = c.kazhdyy;
    }
    this.vybrosByl = nam.vybros;
    // Расплав рвёт Вязкость
    if (nam.rasplav || !nam.vyazkost) m.otlepitVse(this.ot, this.ot + this.n);
    // Ползание: якоря прилипших точек сдвигаются вдоль опоры по вводу
    if (nam.vyazkost && (nam.dx !== 0 || nam.dy !== 0)) {
      const shag = TELO.polzanie * MIR.shag;
      for (let i = this.ot; i < this.ot + this.n; i++) {
        const j = m.vPoTochke[i] as number;
        if (j === -1) continue;
        const o = m.vOtrezok[j] as number;
        const ex = (m.oX2[o] as number) - (m.oX1[o] as number);
        const ey = (m.oY2[o] as number) - (m.oY1[o] as number);
        const l2 = ex * ex + ey * ey;
        if (l2 === 0) continue;
        const proj = (nam.dx * ex + nam.dy * ey) / l2; // доля длины отрезка на единицу ввода
        let d = (m.vDolya[j] as number) + proj * shag;
        if (d < 0) d = 0;
        else if (d > 1) d = 1;
        m.vDolya[j] = d;
      }
    }
    // Движение: прямая добавка скорости через сдвиг прошлой позиции
    const tx = nam.dx * TELO.tyagaGorizont;
    const ty = nam.dy > 0 ? nam.dy * TELO.tyagaVverh : nam.dy * TELO.tyagaVniz;
    // Спин: вращение вдоль поверхности контакта
    this.schitatCentr();
    const cx = this.cx,
      cy = this.cy;
    for (let i = this.ot; i < this.ot + this.n; i++) {
      m.px[i] = (m.px[i] as number) - tx;
      m.py[i] = (m.py[i] as number) - ty;
    }
    // Вращение вдоль опоры: по полу и потолку всегда, по стене только с Вязкостью,
    // иначе тело перелезает стены одним трением (спайк, 17.09).
    const opora = this.opora();
    const spinDolya = nam.vyazkost ? 1 : opora;
    if (spinDolya > 0) {
      // касательная к окружности тела в точке частицы, знак от ввода dx
      for (let i = this.ot; i < this.ot + this.n; i++) {
        const rx = (m.x[i] as number) - cx,
          ry = (m.y[i] as number) - cy;
        const l = Math.sqrt(rx * rx + ry * ry) || 1;
        // вправо = по часовой: касательная (ry, -rx)
        const s = nam.dx * TELO.spin * spinDolya;
        m.px[i] = (m.px[i] as number) - (ry / l) * s;
        m.py[i] = (m.py[i] as number) + (rx / l) * s;
      }
    }
  }

  // Вызывать после mir.shag(): создать связи Вязкости по контактам этого такта.
  posle(nam: Namerenie): void {
    const m = this.mir;
    if (nam.vyazkost && !nam.rasplav) {
      for (let i = this.ot; i < this.ot + this.n; i++) {
        if (!m.kontakt[i] || m.vPoTochke[i] !== -1) continue;
        const ny = Math.abs(m.kontNy[i] as number);
        const porog = ny >= KOSINUS_45 ? TELO.vyazkostPorogPol : TELO.vyazkostPorogStena;
        m.prilepit(i, porog);
      }
    }
    // защита от заклинивания: окно смещений центра масс
    this.schitatCentr();
    this.okno[this.oknoI] = this.cx;
    this.oknoI = (this.oknoI + 1) % this.okno.length;
  }

  // Центр масс без выделения памяти: пишется в поля cx, cy
  cx = 0;
  cy = 0;
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

  centr(): [number, number] {
    this.schitatCentr();
    return [this.cx, this.cy];
  }

  // Доля «горизонтальной» опоры: 1 на полу или потолке, 0 на вертикальной стене, 0 без контакта
  opora(): number {
    let maks = 0;
    for (let i = this.ot; i < this.ot + this.n; i++) {
      if (!this.mir.kontakt[i]) continue;
      const ny = Math.abs(this.mir.kontNy[i] as number);
      if (ny > maks) maks = ny;
    }
    return maks;
  }

  vKontakte(): boolean {
    for (let i = this.ot; i < this.ot + this.n; i++) if (this.mir.kontakt[i]) return true;
    return false;
  }

  gabarity(): { w: number; h: number; minX: number; maxX: number; minY: number; maxY: number } {
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
    return { w: maxX - minX, h: maxY - minY, minX, maxX, minY, maxY };
  }

  // Знак площади контура: положительный для исходной ориентации
  ploshchad(): number {
    const m = this.mir;
    let s = 0;
    for (let i = 0; i < this.n; i++) {
      const a = this.ot + i,
        b = this.ot + ((i + 1) % this.n);
      s += (m.x[a] as number) * (m.y[b] as number) - (m.x[b] as number) * (m.y[a] as number);
    }
    return s / 2;
  }

  perimetr(): number {
    const m = this.mir;
    let s = 0;
    for (let i = 0; i < this.n; i++) {
      const a = this.ot + i,
        b = this.ot + ((i + 1) % this.n);
      const dx = (m.x[b] as number) - (m.x[a] as number),
        dy = (m.y[b] as number) - (m.y[a] as number);
      s += Math.sqrt(dx * dx + dy * dy);
    }
    return s;
  }

  get vVybrose(): boolean {
    return this.vybrosByl;
  }
  get vKorke(): boolean {
    return this.korkaByla;
  }
}
