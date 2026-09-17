// Загрузка уровня в мир: многоугольники в односторонние отрезки, платформы в двусторонние,
// объекты в рантайм-сущности. Чистые данные, без рендера.
import type { Mir } from '../physics/mir';
import { type Obekt, type Poligon, SVOYSTVA_MATERIALA, type Uroven } from './format';
import { proveritUroven } from './validator';

export interface Sushchnost {
  tip: Obekt['tip'];
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cel: string;
  nuzhnaKorka: boolean;
  aktivna: boolean; // для плит, рычагов, заслонок, горнов
  sobrana: boolean; // для собираемого
  otrezki: number[]; // отрезки заслонки, чтобы убрать при открытии
}

export interface ZagruzhennyyUroven {
  dannye: Uroven;
  sushchnosti: Sushchnost[];
  poligonOtrezki: { ot: number; n: number; material: Poligon['material'] }[];
  slomany: boolean[]; // многоугольник разрушен целиком
}

function vnutri(t: [number, number][], x: number, y: number): boolean {
  let vn = false;
  for (let i = 0, j = t.length - 1; i < t.length; j = i++) {
    const a = t[i] as [number, number];
    const b = t[j] as [number, number];
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) vn = !vn;
  }
  return vn;
}

function ploshchad(t: [number, number][]): number {
  let s = 0;
  for (let i = 0; i < t.length; i++) {
    const a = t[i] as [number, number];
    const b = t[(i + 1) % t.length] as [number, number];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

export function zagruzitUroven(mir: Mir, u: Uroven): ZagruzhennyyUroven {
  const oshibki = proveritUroven(u);
  if (oshibki.length) throw new Error(`уровень ${u.id}: ${oshibki.join('; ')}`);
  const poligonOtrezki: ZagruzhennyyUroven['poligonOtrezki'] = [];
  for (const p of u.poligony) {
    const mat = SVOYSTVA_MATERIALA[p.material ?? 'bazalt'];
    // твёрдое внутри: обход по часовой стрелке, тогда свободная сторона (слева) снаружи
    const t = ploshchad(p.tochki) > 0 ? [...p.tochki].reverse() : p.tochki;
    const ot = mir.k;
    // глубина выталкивания не больше 45% меньшей стороны, иначе тонкая плита ловит частицу обеими гранями
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const [x, y] of t) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const glubina = Math.min(0.5, 0.45 * Math.min(maxX - minX, maxY - minY));
    for (let i = 0; i < t.length; i++) {
      const a = t[i] as [number, number];
      const b = t[(i + 1) % t.length] as [number, number];
      const o = mir.dobavitOtrezok(a[0], a[1], b[0], b[1], mat.trenie, mat.sherohovat, 1);
      mir.oGlubina[o] = glubina;
      if (p.material === 'hrupkiy') mir.hrupkost[o] = p.hrupkost ?? 1.2;
    }
    poligonOtrezki.push({ ot, n: t.length, material: p.material ?? 'bazalt' });
  }
  // Рёбра, лежащие внутри соседнего многоугольника (стык двух твёрдых тел), убираются:
  // иначе частица на стыке выталкивается двумя гранями в разные стороны и застревает.
  for (const po of poligonOtrezki) {
    for (let k = po.ot; k < po.ot + po.n; k++) {
      const x1 = mir.oX1[k] as number,
        y1 = mir.oY1[k] as number;
      const ex = (mir.oX2[k] as number) - x1,
        ey = (mir.oY2[k] as number) - y1;
      const l = Math.hypot(ex, ey) || 1;
      const nx = (-ey / l) * 0.02,
        ny = (ex / l) * 0.02; // сдвиг чуть на свободную сторону
      // ребро убирается, только если оно целиком накрыто: точки через каждые 0,1 вдоль ребра внутри чужих
      let nakryto = true;
      const shagov = Math.max(3, Math.ceil(l / 0.1));
      for (let si = 0; si <= shagov && nakryto; si++) {
        const d = 0.01 + (0.98 * si) / shagov;
        const px = x1 + ex * d + nx,
          py = y1 + ey * d + ny;
        let vn = false;
        for (let q = 0; q < u.poligony.length && !vn; q++) {
          const other = poligonOtrezki[q];
          if (!other || other.ot === po.ot) continue;
          vn = vnutri(u.poligony[q]?.tochki ?? [], px, py);
        }
        if (!vn) {
          nakryto = false;
          break;
        }
      }
      if (nakryto) mir.oZhiv[k] = 0;
    }
  }
  mir.setkaGryaznaya = true;
  for (const pl of u.platformy ?? []) {
    const mat = SVOYSTVA_MATERIALA[pl.material ?? 'bazalt'];
    mir.dobavitOtrezok(pl.ot[0], pl.ot[1], pl.do[0], pl.do[1], mat.trenie, mat.sherohovat, 0);
  }
  const sushchnosti: Sushchnost[] = [];
  let avtoId = 0;
  for (const o of u.obekty) {
    const s: Sushchnost = {
      tip: o.tip,
      id: o.id ?? `${o.tip}-${avtoId++}`,
      x: o.x,
      y: o.y,
      w: o.w ?? 0,
      h: o.h ?? 0,
      cel: o.cel ?? '',
      nuzhnaKorka: o.nuzhnaKorka ?? false,
      aktivna: false,
      sobrana: false,
      otrezki: [],
    };
    if (o.tip === 'zaslonka') {
      // заслонка: замкнутый прямоугольник из четырёх односторонних отрезков, обход по часовой
      const x1 = o.x,
        y1 = o.y,
        x2 = o.x + (o.w ?? 0),
        y2 = o.y + (o.h ?? 0);
      s.otrezki.push(
        mir.dobavitOtrezok(x1, y1, x1, y2, 0.3, 0, 1),
        mir.dobavitOtrezok(x1, y2, x2, y2, 0.3, 0, 1),
        mir.dobavitOtrezok(x2, y2, x2, y1, 0.3, 0, 1),
        mir.dobavitOtrezok(x2, y1, x1, y1, 0.3, 0, 1),
      );
    }
    sushchnosti.push(s);
  }
  return { dannye: u, sushchnosti, poligonOtrezki, slomany: u.poligony.map(() => false) };
}
