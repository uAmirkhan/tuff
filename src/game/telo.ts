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

  /** Тело в слитой паре. Цена слияния: Расплав недоступен (wiki 16-koop-dizayn, раздел 4.2). */
  vSliyanii = false;

  // Применить намерение к параметрам частиц и связей. Вызывать до mir.shag().
  primenit(nam: Namerenie, korkaSredy = false): void {
    const m = this.mir;
    const korka = nam.korka || korkaSredy;
    const rasplav = nam.rasplav && !this.vSliyanii;
    const trenie = rasplav ? TELO.rasplavTrenie : TELO.trenie;
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
    this.sost = korka
      ? 'korka'
      : rasplav
        ? 'rasplav'
        : nam.vyazkost
          ? 'vyazkost'
          : nam.vybros
            ? 'vybros'
            : 'obychnoe';
    if (nam.dx > 0.2) this.napravlenie = 1;
    else if (nam.dx < -0.2) this.napravlenie = -1;
    // Расплав рвёт Вязкость; Корка (своя или принудительная от инея и воды) не липнет: иней-таймер сбрасывает со стены
    if (rasplav || !nam.vyazkost || korka) m.otlepitVse(this.ot, this.ot + this.n);
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
    if (nam.vyazkost && !(nam.rasplav && !this.vSliyanii) && !this.korkaByla) {
      for (let i = this.ot; i < this.ot + this.n; i++) {
        if (m.vPoTochke[i] !== -1) continue;
        if (m.kontakt[i]) {
          const ny = Math.abs(m.kontNy[i] as number);
          const porog = ny >= KOSINUS_45 ? TELO.vyazkostPorogPol : TELO.vyazkostPorogStena;
          m.prilepit(i, porog);
        } else if ((m.kontaktZveno[i] as number) !== -1) {
          m.prilepitKChastice(i, m.kontaktZveno[i] as number, TELO.vyazkostPorogPol);
        } else if (m.kontaktTel[i]) {
          // касание другого тела (контейнер, маятник): липнем к его ближайшей частице и тянем
          m.prilepitKChastice(i, m.kontaktTelChastica[i] as number, TELO.vyazkostPorogPol);
        }
      }
    }
    // защита от заклинивания: окно смещений центра масс
    this.schitatCentr();
    this.okno[this.oknoI] = this.cx;
    this.oknoI = (this.oknoI + 1) % this.okno.length;
  }

  // Сторожа тела: взрыв (периметр вырос втрое), выворачивание (знак площади), самопересечение
  // соседних рёбер. Возвращает причину или null. Восстанавливает форму в текущем центре.
  private perimetrPokoya = 0;
  private samoperesTaktov = 0;
  storozha(): string | null {
    if (this.perimetrPokoya === 0) this.perimetrPokoya = this.perimetr();
    let prichina: string | null = null;
    if (this.perimetr() > this.perimetrPokoya * 3) prichina = 'взрыв: периметр втрое';
    else if (this.ploshchad() < 0) prichina = 'выворачивание: площадь отрицательна';
    else if (this.samoperesechenie()) {
      // короткие самопересечения при тычке врага или в щели проходят сами; сброс только если держится
      this.samoperesTaktov++;
      if (this.samoperesTaktov > 20) prichina = 'самопересечение контура 20 тактов';
    } else this.samoperesTaktov = 0;
    if (prichina) {
      this.samoperesTaktov = 0;
      this.schitatCentr();
      this.vosstanovit(this.cx, this.cy, prichina);
    }
    return prichina;
  }

  // Пересечение рёбер контура (i,i+1) и (j,j+1) для несмежных пар
  private samoperesechenie(): boolean {
    const m = this.mir;
    const n = this.n;
    for (let i = 0; i < n; i++) {
      const a = this.ot + i,
        b = this.ot + ((i + 1) % n);
      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue;
        const c = this.ot + j,
          d = this.ot + ((j + 1) % n);
        if (
          otrezkiPeresekayutsya(
            m.x[a] as number,
            m.y[a] as number,
            m.x[b] as number,
            m.y[b] as number,
            m.x[c] as number,
            m.y[c] as number,
            m.x[d] as number,
            m.y[d] as number,
          )
        )
          return true;
      }
    }
    return false;
  }

  // Восстановить кольцо в точке: возрождение и сторожа. Скорости обнуляются, якоря рвутся.
  vosstanovit(cx: number, cy: number, prichina: string): void {
    const m = this.mir;
    m.otlepitVse(this.ot, this.ot + this.n);
    let ux = 1,
      uy = 0;
    for (let i = 0; i < this.n; i++) {
      const p = this.ot + i;
      m.x[p] = cx + ux * TELO.radius;
      m.y[p] = cy + uy * TELO.radius;
      m.px[p] = m.x[p] as number;
      m.py[p] = m.y[p] as number;
      m.kontakt[p] = 0;
      const nx = ux * COS - uy * SIN;
      const ny = ux * SIN + uy * COS;
      ux = nx;
      uy = ny;
    }
    m.zhurnal.push(`такт ${m.takt}: тело восстановлено, ${prichina}`);
    if (m.zhurnal.length > 200) m.zhurnal.shift();
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

  // Есть ли контакт с вертикальной стеной: 1 стена справа, -1 слева, 0 нет
  stenaSboku(): number {
    for (let i = this.ot; i < this.ot + this.n; i++) {
      if (!this.mir.kontakt[i]) continue;
      const nx = this.mir.kontNx[i] as number;
      if (Math.abs(nx) > 0.9) return nx < 0 ? 1 : -1;
    }
    return 0;
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

  // Состояние материала для отрисовки и звука: приоритет корка, расплав, вязкость, выброс
  private sost: 'obychnoe' | 'vyazkost' | 'rasplav' | 'korka' | 'vybros' = 'obychnoe';
  napravlenie = 1; // -1 влево, 1 вправо, куда смотрят глаза
  get sostoyanie(): 'obychnoe' | 'vyazkost' | 'rasplav' | 'korka' | 'vybros' {
    return this.sost;
  }

  get vVybrose(): boolean {
    return this.vybrosByl;
  }
  get vKorke(): boolean {
    return this.korkaByla;
  }
}

function znak(ax: number, ay: number, bx: number, by: number, cx: number, cy: number): number {
  return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
}

function otrezkiPeresekayutsya(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
): boolean {
  const d1 = znak(cx, cy, dx, dy, ax, ay);
  const d2 = znak(cx, cy, dx, dy, bx, by);
  const d3 = znak(ax, ay, bx, by, cx, cy);
  const d4 = znak(ax, ay, bx, by, dx, dy);
  return d1 * d2 < 0 && d3 * d4 < 0;
}
