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
    for (let i = 0; i < t.length; i++) {
      const a = t[i] as [number, number];
      const b = t[(i + 1) % t.length] as [number, number];
      const o = mir.dobavitOtrezok(a[0], a[1], b[0], b[1], mat.trenie, mat.sherohovat, 1);
      if (p.material === 'hrupkiy') mir.hrupkost[o] = p.hrupkost ?? 0.15;
    }
    poligonOtrezki.push({ ot, n: t.length, material: p.material ?? 'bazalt' });
  }
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
  return { dannye: u, sushchnosti, poligonOtrezki };
}
