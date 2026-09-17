// Решатель частиц и связей. Интегрирование Верле, релаксация связей подшагами,
// контакт частиц с отрезками. Ничего не знает об игре.
// Данные в типизированных массивах, в такте память не выделяется.

export const MAX_TOCHEK = 2048;
export const MAX_SVYAZEY = 8192;
export const MAX_OTREZKOV = 4096;
export const MAX_VREMENNYH = 512;
export const MAX_KONTUROV = 256;
export const SETKA = 2; // размер ячейки сетки отрезков в единицах
export const MAX_YACHEEK = 65536;
const ZAPAS = 0.6; // запас границ отрезка под глубину односторонней стороны
const GLUBINA = 0.5; // глубина по умолчанию, с которой односторонний отрезок выталкивает сидящую внутри частицу

export interface ParametryMira {
  shag: number;
  podshagov: number;
  gravitatsiya: number;
  maxSkorost: number;
}

export class Mir {
  // Частицы
  n = 0;
  readonly x = new Float64Array(MAX_TOCHEK);
  readonly y = new Float64Array(MAX_TOCHEK);
  readonly px = new Float64Array(MAX_TOCHEK);
  readonly py = new Float64Array(MAX_TOCHEK);
  readonly massa = new Float64Array(MAX_TOCHEK);
  readonly gravMul = new Float64Array(MAX_TOCHEK);
  readonly trenie = new Float64Array(MAX_TOCHEK);
  readonly radius = new Float64Array(MAX_TOCHEK);
  readonly dempfer = new Float64Array(MAX_TOCHEK);
  // Контакт за такт: нормаль последнего контакта и флаг
  readonly kontakt = new Uint8Array(MAX_TOCHEK);
  readonly kontNx = new Float64Array(MAX_TOCHEK);
  readonly kontNy = new Float64Array(MAX_TOCHEK);
  readonly kontOtrezok = new Int32Array(MAX_TOCHEK);
  readonly kontX = new Float64Array(MAX_TOCHEK);
  readonly kontY = new Float64Array(MAX_TOCHEK);

  // Связи: между двумя частицами
  m = 0;
  readonly sA = new Int32Array(MAX_SVYAZEY);
  readonly sB = new Int32Array(MAX_SVYAZEY);
  readonly sDlina = new Float64Array(MAX_SVYAZEY);
  readonly sZhest = new Float64Array(MAX_SVYAZEY);
  readonly sKazhdyy = new Int32Array(MAX_SVYAZEY); // релаксировать на каждом k-м подшаге
  readonly sZhiva = new Uint8Array(MAX_SVYAZEY);
  readonly sOdnostor = new Uint8Array(MAX_SVYAZEY); // 1 = связь только не даёт сблизиться ближе длины

  // Статические отрезки уровня
  k = 0;
  readonly oX1 = new Float64Array(MAX_OTREZKOV);
  readonly oY1 = new Float64Array(MAX_OTREZKOV);
  readonly oX2 = new Float64Array(MAX_OTREZKOV);
  readonly oY2 = new Float64Array(MAX_OTREZKOV);
  readonly oTrenie = new Float64Array(MAX_OTREZKOV);
  readonly oSherohovat = new Uint8Array(MAX_OTREZKOV); // 1 = Вязкость держит
  readonly oZhiv = new Uint8Array(MAX_OTREZKOV);
  readonly oOdnostor = new Uint8Array(MAX_OTREZKOV); // 1 = твёрдая сторона справа по ходу p1→p2, свободная слева
  readonly oGlubina = new Float64Array(MAX_OTREZKOV); // глубина выталкивания: у тонких плит меньше половины толщины
  readonly hrupkost = new Float64Array(MAX_OTREZKOV); // 0 = неразрушим, иначе порог импульса удара
  readonly udar = new Float64Array(MAX_OTREZKOV); // накопленный импульс удара за такт
  slomano: number[] = [];

  // Пространственная сетка отрезков: ячейки размером SETKA, списки в формате CSR
  setkaGryaznaya = true;
  private setkaMinX = 0;
  private setkaMinY = 0;
  private setkaW = 1;
  private setkaH = 1;
  private readonly setkaNachalo = new Int32Array(MAX_YACHEEK + 1);
  private readonly setkaElementy = new Int32Array(MAX_OTREZKOV * 64);
  private readonly setkaSchet = new Int32Array(MAX_YACHEEK);
  private readonly oShtamp = new Int32Array(MAX_OTREZKOV);
  private shtamp = 1;
  private readonly oMinX = new Float64Array(MAX_OTREZKOV);
  private readonly oMinY = new Float64Array(MAX_OTREZKOV);
  private readonly oMaxX = new Float64Array(MAX_OTREZKOV);
  private readonly oMaxY = new Float64Array(MAX_OTREZKOV);

  // Временные связи Вязкости: частица к точке на отрезке
  v = 0;
  readonly vTochka = new Int32Array(MAX_VREMENNYH);
  readonly vOtrezok = new Int32Array(MAX_VREMENNYH);
  readonly vDolya = new Float64Array(MAX_VREMENNYH); // положение якоря вдоль отрезка
  readonly vPorog = new Float64Array(MAX_VREMENNYH);
  readonly vZhiva = new Uint8Array(MAX_VREMENNYH);
  readonly vPoTochke = new Int32Array(MAX_TOCHEK); // индекс живой связи для частицы или -1

  // Замкнутые контуры с ограничением площади (объём мягкого тела)
  c = 0;
  readonly cOt = new Int32Array(MAX_KONTUROV);
  readonly cN = new Int32Array(MAX_KONTUROV);
  readonly cPloshchad = new Float64Array(MAX_KONTUROV); // целевая площадь
  readonly cZhest = new Float64Array(MAX_KONTUROV);
  readonly cKazhdyy = new Int32Array(MAX_KONTUROV);
  private readonly gradX = new Float64Array(MAX_TOCHEK);
  private readonly gradY = new Float64Array(MAX_TOCHEK);

  vyazkostZhestkost = 0.5; // доля расстояния до якоря, снимаемая за подшаг
  takt = 0;
  zhurnal: string[] = [];
  otbrosheno = 0;

  constructor(readonly p: ParametryMira) {
    this.vPoTochke.fill(-1);
  }

  dobavitTochku(
    x: number,
    y: number,
    massa: number,
    radius: number,
    trenie: number,
    dempfer: number,
  ): number {
    const i = this.n++;
    if (i >= MAX_TOCHEK) throw new Error('переполнение частиц');
    this.x[i] = x;
    this.y[i] = y;
    this.px[i] = x;
    this.py[i] = y;
    this.massa[i] = massa;
    this.gravMul[i] = 1;
    this.trenie[i] = trenie;
    this.radius[i] = radius;
    this.dempfer[i] = dempfer;
    this.kontakt[i] = 0;
    this.vPoTochke[i] = -1;
    return i;
  }

  dobavitSvyaz(a: number, b: number, zhest: number, kazhdyy: number, dlina?: number): number {
    const i = this.m++;
    if (i >= MAX_SVYAZEY) throw new Error('переполнение связей');
    this.sA[i] = a;
    this.sB[i] = b;
    const dx = (this.x[b] as number) - (this.x[a] as number);
    const dy = (this.y[b] as number) - (this.y[a] as number);
    this.sDlina[i] = dlina ?? Math.sqrt(dx * dx + dy * dy);
    this.sZhest[i] = zhest;
    this.sKazhdyy[i] = kazhdyy;
    this.sZhiva[i] = 1;
    this.sOdnostor[i] = 0;
    return i;
  }

  // Отрезок односторонний: свободная сторона слева по ходу от p1 к p2 (нормаль (-ey, ex)).
  // Двусторонний (odnostor = 0) для тонких платформ, у которых обе стороны свободны.
  dobavitOtrezok(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    trenie = 1,
    sherohovat = 1,
    odnostor = 1,
  ): number {
    const i = this.k++;
    if (i >= MAX_OTREZKOV) throw new Error('переполнение отрезков');
    this.oX1[i] = x1;
    this.oY1[i] = y1;
    this.oX2[i] = x2;
    this.oY2[i] = y2;
    this.oTrenie[i] = trenie;
    this.oSherohovat[i] = sherohovat;
    this.oZhiv[i] = 1;
    this.hrupkost[i] = 0;
    this.udar[i] = 0;
    this.oOdnostor[i] = odnostor;
    this.oGlubina[i] = GLUBINA;
    this.setkaGryaznaya = true;
    return i;
  }

  ubratOtrezok(i: number): void {
    this.oZhiv[i] = 0;
    this.setkaGryaznaya = true;
    for (let j = 0; j < this.v; j++) {
      if (this.vZhiva[j] && this.vOtrezok[j] === i) this.razorvatVremennuyu(j);
    }
  }

  // Вязкость: создать связь частицы с текущей точкой контакта. Возвращает индекс или -1.
  prilepit(tochka: number, porog: number): number {
    if (this.vPoTochke[tochka] !== -1) return this.vPoTochke[tochka] as number;
    if (!this.kontakt[tochka]) return -1;
    const o = this.kontOtrezok[tochka] as number;
    if (!this.oSherohovat[o]) return -1;
    // ищем свободный слот
    let slot = -1;
    for (let j = 0; j < this.v; j++)
      if (!this.vZhiva[j]) {
        slot = j;
        break;
      }
    if (slot === -1) {
      if (this.v >= MAX_VREMENNYH) {
        this.otbrosheno++;
        return -1;
      }
      slot = this.v++;
    }
    const x1 = this.oX1[o] as number,
      y1 = this.oY1[o] as number;
    const dx = (this.oX2[o] as number) - x1,
      dy = (this.oY2[o] as number) - y1;
    const dl = dx * dx + dy * dy;
    const t =
      dl > 0
        ? (((this.kontX[tochka] as number) - x1) * dx +
            ((this.kontY[tochka] as number) - y1) * dy) /
          dl
        : 0;
    this.vTochka[slot] = tochka;
    this.vOtrezok[slot] = o;
    this.vDolya[slot] = t < 0 ? 0 : t > 1 ? 1 : t;
    this.vPorog[slot] = porog;
    this.vZhiva[slot] = 1;
    this.vPoTochke[tochka] = slot;
    return slot;
  }

  dobavitKontur(ot: number, n: number, zhest: number, kazhdyy = 1): number {
    const i = this.c++;
    if (i >= MAX_KONTUROV) throw new Error('переполнение контуров');
    this.cOt[i] = ot;
    this.cN[i] = n;
    this.cPloshchad[i] = this.ploshchadKontura(ot, n);
    this.cZhest[i] = zhest;
    this.cKazhdyy[i] = kazhdyy;
    return i;
  }

  ploshchadKontura(ot: number, n: number): number {
    let s = 0;
    for (let i = 0; i < n; i++) {
      const a = ot + i,
        b = ot + ((i + 1) % n);
      s +=
        (this.x[a] as number) * (this.y[b] as number) -
        (this.x[b] as number) * (this.y[a] as number);
    }
    return s / 2;
  }

  // Ограничение площади: контур тянется к целевой площади (PBD)
  private ploshchadi(sub: number): void {
    for (let c = 0; c < this.c; c++) {
      const k = this.cKazhdyy[c] as number;
      if (k > 1 && sub % k !== 0) continue;
      const ot = this.cOt[c] as number,
        n = this.cN[c] as number;
      const C = this.ploshchadKontura(ot, n) - (this.cPloshchad[c] as number);
      let summa = 0;
      for (let i = 0; i < n; i++) {
        const prev = ot + ((i + n - 1) % n),
          next = ot + ((i + 1) % n);
        const gx = 0.5 * ((this.y[next] as number) - (this.y[prev] as number));
        const gy = 0.5 * ((this.x[prev] as number) - (this.x[next] as number));
        this.gradX[ot + i] = gx;
        this.gradY[ot + i] = gy;
        summa += (gx * gx + gy * gy) / (this.massa[ot + i] as number);
      }
      if (summa === 0) continue;
      const lambda = (-C / summa) * (this.cZhest[c] as number);
      for (let i = 0; i < n; i++) {
        const p = ot + i;
        const w = 1 / (this.massa[p] as number);
        this.x[p] = (this.x[p] as number) + lambda * w * (this.gradX[p] as number);
        this.y[p] = (this.y[p] as number) + lambda * w * (this.gradY[p] as number);
      }
    }
  }

  razorvatVremennuyu(j: number): void {
    if (!this.vZhiva[j]) return;
    this.vZhiva[j] = 0;
    this.vPoTochke[this.vTochka[j] as number] = -1;
  }

  otlepitVse(ot: number, do_: number): void {
    for (let i = ot; i < do_; i++) {
      const j = this.vPoTochke[i] as number;
      if (j !== -1) this.razorvatVremennuyu(j);
    }
  }

  shag(): void {
    const dt = this.p.shag;
    const g = this.p.gravitatsiya * dt * dt;
    const maxV = this.p.maxSkorost;
    // 1. Интегрирование Верле
    for (let i = 0; i < this.n; i++) {
      const x = this.x[i] as number,
        y = this.y[i] as number;
      let vx = (x - (this.px[i] as number)) * (this.dempfer[i] as number);
      let vy = (y - (this.py[i] as number)) * (this.dempfer[i] as number);
      vy -= g * (this.gravMul[i] as number);
      const s = vx * vx + vy * vy;
      if (s > maxV * maxV) {
        const f = maxV / Math.sqrt(s);
        vx *= f;
        vy *= f;
      }
      this.px[i] = x;
      this.py[i] = y;
      this.x[i] = x + vx;
      this.y[i] = y + vy;
      this.kontakt[i] = 0;
    }
    // 2. Подшаги
    const ps = this.p.podshagov;
    for (let o = 0; o < this.k; o++) this.udar[o] = 0;
    for (let c = 0; c < this.c; c++) this.udarTel[c] = 0;
    for (let i = 0; i < this.n; i++) this.kontaktTel[i] = 0;
    for (let sub = 0; sub < ps; sub++) {
      this.relaksatsiya(sub);
      this.ploshchadi(sub);
      this.vremennye();
      this.kontakty();
      this.kontaktyTel();
    }
    // 3. Хрупкие отрезки: суммарный импульс удара за такт выше порога ломает
    this.slomano.length = 0;
    for (let o = 0; o < this.k; o++) {
      const h = this.hrupkost[o] as number;
      if (h > 0 && this.oZhiv[o] && (this.udar[o] as number) > h) {
        this.ubratOtrezok(o);
        this.slomano.push(o);
      }
    }
    this.takt++;
  }

  private relaksatsiya(sub: number): void {
    for (let j = 0; j < this.m; j++) {
      if (!this.sZhiva[j]) continue;
      const k = this.sKazhdyy[j] as number;
      if (k > 1 && sub % k !== 0) continue;
      const a = this.sA[j] as number,
        b = this.sB[j] as number;
      const dx = (this.x[b] as number) - (this.x[a] as number);
      const dy = (this.y[b] as number) - (this.y[a] as number);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d === 0) continue;
      if (this.sOdnostor[j] && d >= (this.sDlina[j] as number)) continue;
      const raz = (d - (this.sDlina[j] as number)) / d;
      const ma = this.massa[a] as number,
        mb = this.massa[b] as number;
      const wa = 1 / ma,
        wb = 1 / mb,
        w = wa + wb;
      const f = (this.sZhest[j] as number) * raz;
      this.x[a] = (this.x[a] as number) + dx * f * (wa / w);
      this.y[a] = (this.y[a] as number) + dy * f * (wa / w);
      this.x[b] = (this.x[b] as number) - dx * f * (wb / w);
      this.y[b] = (this.y[b] as number) - dy * f * (wb / w);
    }
  }

  private vremennye(): void {
    for (let j = 0; j < this.v; j++) {
      if (!this.vZhiva[j]) continue;
      const i = this.vTochka[j] as number,
        o = this.vOtrezok[j] as number;
      if (!this.oZhiv[o]) {
        this.razorvatVremennuyu(j);
        continue;
      }
      const t = this.vDolya[j] as number;
      const ax = (this.oX1[o] as number) + ((this.oX2[o] as number) - (this.oX1[o] as number)) * t;
      const ay = (this.oY1[o] as number) + ((this.oY2[o] as number) - (this.oY1[o] as number)) * t;
      // якорь на расстоянии радиуса частицы от отрезка по нормали
      const nx = this.kontNx[i] as number,
        ny = this.kontNy[i] as number;
      const r = this.radius[i] as number;
      const tx = ax + nx * r,
        ty = ay + ny * r;
      const dx = tx - (this.x[i] as number),
        dy = ty - (this.y[i] as number);
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > (this.vPorog[j] as number)) {
        this.razorvatVremennuyu(j);
        continue;
      }
      // упругий якорь: тянет к точке долей за подшаг; при сильном растяжении рвётся
      this.x[i] = (this.x[i] as number) + dx * this.vyazkostZhestkost;
      this.y[i] = (this.y[i] as number) + dy * this.vyazkostZhestkost;
    }
  }

  // Контакт контуров между собой: частица одного тела против рёбер другого, в обе стороны.
  // Коррекция делится по обратным массам. Итог: тела не проходят друг сквозь друга.
  readonly kontaktTel = new Uint8Array(MAX_TOCHEK); // 1 = частица касалась другого тела в такте
  readonly kontaktTelKontur = new Int32Array(MAX_TOCHEK); // индекс контура, которого коснулись
  readonly udarTel = new Float64Array(MAX_KONTUROV); // импульс, полученный контуром от других тел за такт

  private kontaktyTel(): void {
    for (let a = 0; a < this.c; a++) {
      for (let b = 0; b < this.c; b++) {
        if (a === b) continue;
        // грубая проверка: пересекаются ли описанные прямоугольники
        if (!this.konturyRyadom(a, b)) continue;
        const otA = this.cOt[a] as number,
          nA = this.cN[a] as number;
        const otB = this.cOt[b] as number,
          nB = this.cN[b] as number;
        for (let i = 0; i < nA; i++) {
          const p = otA + i;
          const x = this.x[p] as number,
            y = this.y[p] as number,
            r = this.radius[p] as number;
          if (!this.vnutriKontura(otB, nB, x, y)) {
            // снаружи: проверяем близость к рёбрам
            this.ottolknutOtRebra(p, otB, nB, x, y, r, b);
            continue;
          }
          // внутри чужого контура: вытолкнуть через ближайшее ребро
          let luchshe = -1,
            dmin = Infinity;
          for (let j = 0; j < nB; j++) {
            const q1 = otB + j,
              q2 = otB + ((j + 1) % nB);
            const d = rasstoyanieDoOtrezka(
              x,
              y,
              this.x[q1] as number,
              this.y[q1] as number,
              this.x[q2] as number,
              this.y[q2] as number,
            );
            if (d < dmin) {
              dmin = d;
              luchshe = j;
            }
          }
          if (luchshe === -1) continue;
          const q1 = otB + luchshe,
            q2 = otB + ((luchshe + 1) % nB);
          this.razvesti(p, q1, q2, x, y, dmin + r, b);
        }
      }
    }
  }

  private konturyRyadom(a: number, b: number): boolean {
    let a0 = Infinity,
      a1 = -Infinity,
      a2 = Infinity,
      a3 = -Infinity;
    const otA = this.cOt[a] as number,
      nA = this.cN[a] as number;
    for (let i = 0; i < nA; i++) {
      const x = this.x[otA + i] as number,
        y = this.y[otA + i] as number;
      if (x < a0) a0 = x;
      if (x > a1) a1 = x;
      if (y < a2) a2 = y;
      if (y > a3) a3 = y;
    }
    let b0 = Infinity,
      b1 = -Infinity,
      b2 = Infinity,
      b3 = -Infinity;
    const otB = this.cOt[b] as number,
      nB = this.cN[b] as number;
    for (let i = 0; i < nB; i++) {
      const x = this.x[otB + i] as number,
        y = this.y[otB + i] as number;
      if (x < b0) b0 = x;
      if (x > b1) b1 = x;
      if (y < b2) b2 = y;
      if (y > b3) b3 = y;
    }
    const z = 0.15;
    return a0 - z < b1 && a1 + z > b0 && a2 - z < b3 && a3 + z > b2;
  }

  vnutriKontura(ot: number, n: number, x: number, y: number): boolean {
    let vn = false;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = this.x[ot + i] as number,
        yi = this.y[ot + i] as number;
      const xj = this.x[ot + j] as number,
        yj = this.y[ot + j] as number;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) vn = !vn;
    }
    return vn;
  }

  private ottolknutOtRebra(
    p: number,
    otB: number,
    nB: number,
    x: number,
    y: number,
    r: number,
    b: number,
  ): void {
    for (let j = 0; j < nB; j++) {
      const q1 = otB + j,
        q2 = otB + ((j + 1) % nB);
      const d = rasstoyanieDoOtrezka(
        x,
        y,
        this.x[q1] as number,
        this.y[q1] as number,
        this.x[q2] as number,
        this.y[q2] as number,
      );
      if (d < r) this.razvesti(p, q1, q2, x, y, r - d, b);
    }
  }

  // Развести частицу p и ребро (q1,q2) на глубину pen по нормали ребра в сторону p
  private razvesti(
    p: number,
    q1: number,
    q2: number,
    x: number,
    y: number,
    pen: number,
    b: number,
  ): void {
    const x1 = this.x[q1] as number,
      y1 = this.y[q1] as number;
    const ex = (this.x[q2] as number) - x1,
      ey = (this.y[q2] as number) - y1;
    const el = ex * ex + ey * ey;
    let t = el > 0 ? ((x - x1) * ex + (y - y1) * ey) / el : 0;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const cx = x1 + ex * t,
      cy = y1 + ey * t;
    let nx = x - cx,
      ny = y - cy;
    const d = Math.sqrt(nx * nx + ny * ny);
    if (d < 1e-9) {
      const l = Math.sqrt(el) || 1;
      nx = -ey / l;
      ny = ex / l;
    } else {
      nx /= d;
      ny /= d;
    }
    // если частица внутри чужого контура, нормаль ребра должна смотреть наружу от него
    const wp = 1 / (this.massa[p] as number);
    const w1 = 1 / (this.massa[q1] as number),
      w2 = 1 / (this.massa[q2] as number);
    const wq = (1 - t) * w1 + t * w2;
    const w = wp + wq;
    const dp = pen * (wp / w);
    const dq = pen * (wq / w);
    this.x[p] = (this.x[p] as number) + nx * dp;
    this.y[p] = (this.y[p] as number) + ny * dp;
    this.x[q1] = (this.x[q1] as number) - nx * dq * (1 - t);
    this.y[q1] = (this.y[q1] as number) - ny * dq * (1 - t);
    this.x[q2] = (this.x[q2] as number) - nx * dq * t;
    this.y[q2] = (this.y[q2] as number) - ny * dq * t;
    this.kontaktTel[p] = 1;
    this.kontaktTelKontur[p] = b;
    this.udarTel[b] = (this.udarTel[b] as number) + pen * (this.massa[p] as number);
  }

  private postroitSetku(): void {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (let o = 0; o < this.k; o++) {
      if (!this.oZhiv[o]) continue;
      const ax = Math.min(this.oX1[o] as number, this.oX2[o] as number) - ZAPAS;
      const ay = Math.min(this.oY1[o] as number, this.oY2[o] as number) - ZAPAS;
      const bx = Math.max(this.oX1[o] as number, this.oX2[o] as number) + ZAPAS;
      const by = Math.max(this.oY1[o] as number, this.oY2[o] as number) + ZAPAS;
      this.oMinX[o] = ax;
      this.oMinY[o] = ay;
      this.oMaxX[o] = bx;
      this.oMaxY[o] = by;
      if (ax < minX) minX = ax;
      if (ay < minY) minY = ay;
      if (bx > maxX) maxX = bx;
      if (by > maxY) maxY = by;
    }
    if (minX === Infinity) {
      minX = 0;
      minY = 0;
      maxX = 1;
      maxY = 1;
    }
    this.setkaMinX = minX;
    this.setkaMinY = minY;
    let w = Math.ceil((maxX - minX) / SETKA) + 1;
    let h = Math.ceil((maxY - minY) / SETKA) + 1;
    while (w * h > MAX_YACHEEK) {
      // слишком большой мир: укрупняем ячейки через масштаб счёта
      w = Math.ceil(w / 2);
      h = Math.ceil(h / 2);
    }
    this.setkaW = w;
    this.setkaH = h;
    const yacheek = w * h;
    this.setkaSchet.fill(0, 0, yacheek);
    // первый проход: счёт
    for (let o = 0; o < this.k; o++) {
      if (!this.oZhiv[o]) continue;
      const cx0 = this.yachX(this.oMinX[o] as number),
        cx1 = this.yachX(this.oMaxX[o] as number);
      const cy0 = this.yachY(this.oMinY[o] as number),
        cy1 = this.yachY(this.oMaxY[o] as number);
      for (let cy = cy0; cy <= cy1; cy++)
        for (let cx = cx0; cx <= cx1; cx++)
          this.setkaSchet[cy * w + cx] = (this.setkaSchet[cy * w + cx] as number) + 1;
    }
    let sum = 0;
    for (let c = 0; c < yacheek; c++) {
      this.setkaNachalo[c] = sum;
      sum += this.setkaSchet[c] as number;
    }
    this.setkaNachalo[yacheek] = sum;
    if (sum > this.setkaElementy.length) throw new Error('переполнение сетки отрезков');
    this.setkaSchet.fill(0, 0, yacheek);
    // второй проход: заполнение
    for (let o = 0; o < this.k; o++) {
      if (!this.oZhiv[o]) continue;
      const cx0 = this.yachX(this.oMinX[o] as number),
        cx1 = this.yachX(this.oMaxX[o] as number);
      const cy0 = this.yachY(this.oMinY[o] as number),
        cy1 = this.yachY(this.oMaxY[o] as number);
      for (let cy = cy0; cy <= cy1; cy++)
        for (let cx = cx0; cx <= cx1; cx++) {
          const c = cy * w + cx;
          this.setkaElementy[(this.setkaNachalo[c] as number) + (this.setkaSchet[c] as number)] = o;
          this.setkaSchet[c] = (this.setkaSchet[c] as number) + 1;
        }
    }
    this.setkaGryaznaya = false;
  }

  private yachX(x: number): number {
    let c = Math.floor((x - this.setkaMinX) / SETKA);
    if (c < 0) c = 0;
    else if (c >= this.setkaW) c = this.setkaW - 1;
    return c;
  }

  private yachY(y: number): number {
    let c = Math.floor((y - this.setkaMinY) / SETKA);
    if (c < 0) c = 0;
    else if (c >= this.setkaH) c = this.setkaH - 1;
    return c;
  }

  private kontakty(): void {
    if (this.setkaGryaznaya) this.postroitSetku();
    const w = this.setkaW;
    for (let i = 0; i < this.n; i++) {
      const r = this.radius[i] as number;
      // охваченные ячейки: текущая и прошлая позиция с запасом радиуса
      const xi = this.x[i] as number,
        yi = this.y[i] as number,
        pxi0 = this.px[i] as number,
        pyi0 = this.py[i] as number;
      const cx0 = this.yachX(Math.min(xi, pxi0) - r),
        cx1 = this.yachX(Math.max(xi, pxi0) + r);
      const cy0 = this.yachY(Math.min(yi, pyi0) - r),
        cy1 = this.yachY(Math.max(yi, pyi0) + r);
      this.shtamp++;
      for (let cy = cy0; cy <= cy1; cy++) {
        for (let cx = cx0; cx <= cx1; cx++) {
          const c = cy * w + cx;
          const ot = this.setkaNachalo[c] as number,
            do_ = this.setkaNachalo[c + 1] as number;
          for (let e = ot; e < do_; e++) {
            const o = this.setkaElementy[e] as number;
            if (this.oShtamp[o] === this.shtamp) continue;
            this.oShtamp[o] = this.shtamp;
            this.kontaktSOtrezkom(i, o, r);
          }
        }
      }
    }
  }

  private kontaktSOtrezkom(i: number, o: number, r: number): void {
    if (!this.oZhiv[o]) return;
    // позиция читается заново на каждом отрезке: прошлый отрезок мог её сдвинуть
    const x = this.x[i] as number,
      y = this.y[i] as number;
    const x1 = this.oX1[o] as number,
      y1 = this.oY1[o] as number;
    const ex = (this.oX2[o] as number) - x1,
      ey = (this.oY2[o] as number) - y1;
    const el = ex * ex + ey * ey;
    // Непрерывная проверка: путь px->x пересёк отрезок? Тогда вернуть на сторону px.
    const pxi = this.px[i] as number,
      pyi = this.py[i] as number;
    const l0 = Math.sqrt(el) || 1;
    const snx = -ey / l0,
      sny = ex / l0;
    const sPrev = (pxi - x1) * snx + (pyi - y1) * sny;
    const sNow = (x - x1) * snx + (y - y1) * sny;
    if (this.oOdnostor[o]) {
      // односторонний: всё, что ближе радиуса к свободной стороне или ушло в твёрдую, наружу
      // частица, которая в начале такта была снаружи, возвращается наружу с любой глубины;
      // сидевшая внутри выталкивается только у самой грани, иначе тонкая плита ловит её обеими гранями
      const byloSnaruzhi = sPrev >= r - 1e-6;
      if (sNow < r && (byloSnaruzhi || sNow > -(this.oGlubina[o] as number))) {
        const u = el > 0 ? ((x - x1) * ex + (y - y1) * ey) / el : 0;
        if (u >= 0 && u <= 1) {
          const pen = r - sNow;
          this.x[i] = x + snx * pen;
          this.y[i] = y + sny * pen;
          this.udar[o] =
            (this.udar[o] as number) + Math.max(0, sPrev - sNow) * (this.massa[i] as number);
          const mu = Math.min(this.trenie[i] as number, this.oTrenie[o] as number);
          const vx = (this.x[i] as number) - pxi;
          const vy = (this.y[i] as number) - pyi;
          const vt = vx * -sny + vy * snx;
          const maxGas = mu * Math.max(0, pen);
          const gas = Math.abs(vt) < maxGas ? vt : Math.sign(vt) * maxGas;
          this.x[i] = (this.x[i] as number) - -sny * gas;
          this.y[i] = (this.y[i] as number) - snx * gas;
          this.kontakt[i] = 1;
          this.kontNx[i] = snx;
          this.kontNy[i] = sny;
          this.kontOtrezok[i] = o;
          this.kontX[i] = x1 + ex * u;
          this.kontY[i] = y1 + ey * u;
        }
      }
      return;
    }
    if (sPrev * sNow < 0 && Math.abs(sPrev) > 1e-9) {
      const tt = sPrev / (sPrev - sNow);
      const ix = pxi + (x - pxi) * tt,
        iy = pyi + (y - pyi) * tt;
      const u = el > 0 ? ((ix - x1) * ex + (iy - y1) * ey) / el : 0;
      if (u >= 0 && u <= 1) {
        const zn = sPrev > 0 ? 1 : -1;
        this.x[i] = ix + snx * r * zn;
        this.y[i] = iy + sny * r * zn;
        this.udar[o] =
          (this.udar[o] as number) + Math.abs(sPrev - sNow) * (this.massa[i] as number);
        this.kontakt[i] = 1;
        this.kontNx[i] = snx * zn;
        this.kontNy[i] = sny * zn;
        this.kontOtrezok[i] = o;
        this.kontX[i] = ix;
        this.kontY[i] = iy;
        return;
      }
    }
    let t = el > 0 ? ((x - x1) * ex + (y - y1) * ey) / el : 0;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const cx = x1 + ex * t,
      cy = y1 + ey * t;
    const dx = x - cx,
      dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= r * r) return;
    let d = Math.sqrt(d2);
    let nx: number, ny: number;
    if (d < 1e-9) {
      // частица ровно на отрезке: нормаль слева от направления отрезка, к прошлой позиции
      const l = Math.sqrt(el) || 1;
      nx = -ey / l;
      ny = ex / l;
      const sx = (this.px[i] as number) - cx,
        sy = (this.py[i] as number) - cy;
      if (sx * nx + sy * ny < 0) {
        nx = -nx;
        ny = -ny;
      }
      d = 0;
    } else {
      nx = dx / d;
      ny = dy / d;
    }
    const pen = r - d;
    // выталкивание
    this.x[i] = x + nx * pen;
    this.y[i] = y + ny * pen;
    this.udar[o] = (this.udar[o] as number) + Math.abs(sPrev - sNow) * (this.massa[i] as number);
    // трение Кулона: тангенциальное смещение за такт гасится не больше чем на mu*pen
    const mu = Math.min(this.trenie[i] as number, this.oTrenie[o] as number);
    const vx = (this.x[i] as number) - (this.px[i] as number);
    const vy = (this.y[i] as number) - (this.py[i] as number);
    const vt = vx * -ny + vy * nx; // проекция на касательную
    const maxGas = mu * pen;
    const gas = Math.abs(vt) < maxGas ? vt : Math.sign(vt) * maxGas;
    this.x[i] = (this.x[i] as number) - -ny * gas;
    this.y[i] = (this.y[i] as number) - nx * gas;
    this.kontakt[i] = 1;
    this.kontNx[i] = nx;
    this.kontNy[i] = ny;
    this.kontOtrezok[i] = o;
    this.kontX[i] = cx;
    this.kontY[i] = cy;
  }
}

function rasstoyanieDoOtrezka(
  x: number,
  y: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const ex = x2 - x1,
    ey = y2 - y1;
  const el = ex * ex + ey * ey;
  let t = el > 0 ? ((x - x1) * ex + (y - y1) * ey) / el : 0;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const dx = x - (x1 + ex * t),
    dy = y - (y1 + ey * t);
  return Math.sqrt(dx * dx + dy * dy);
}
