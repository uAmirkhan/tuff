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
  fiksiruetsya: boolean;
  aktivna: boolean; // для плит, рычагов, заслонок, горнов
  sobrana: boolean; // для собираемого
  otrezki: number[]; // отрезки заслонки, чтобы убрать при открытии
  verh: number; // обвал: текущая высота верха
  skorost: number;
  zaderzhka: number;
  zvenya: number[]; // частицы звеньев цепи
  svyazi: number[]; // связи цепи
  // кинематика поршня: начало, ход, цикл
  x0: number;
  y0: number;
  hodX: number;
  hodY: number;
  period: number;
  faza: number;
  pauza: number;
  chasticy: number[]; // углы твёрдого контейнера (контур)
  kontur: number; // индекс контура контейнера или -1
  plavuchest: number;
  silaX: number;
  silaY: number;
}

export const KONTEYNER = {
  massa: 2.0, // полная масса по умолчанию: половина массы героя
  zhestkost: 0.9,
  obyom: 0.5,
  radius: 0.05,
  trenie: 0.6,
  dempfer: 0.995,
};

export const CEP: {
  radiusZvena: number;
  massaZvena: number;
  zhestkost: number;
  razryv: { slabaya: number; prochnaya: number };
  massaYakorya: number;
  zapas: number;
} = {
  radiusZvena: 0.14,
  massaZvena: 0.3,
  zhestkost: 0.9,
  razryv: { slabaya: 0.12, prochnaya: 0.6 }, // обычное тело на мосту ~7%, Корка ~18% (scripts/cep-natyazhenie.ts)
  massaYakorya: 1e9,
  zapas: 1.06, // длина дуги моста относительно прямой: провисание без напряжения
};

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

// Твёрдый контейнер w×h с центром (cx, cy): углы против часовой от левого нижнего, шесть связей
export function postroitKonteyner(
  mir: Mir,
  cx: number,
  cy: number,
  w: number,
  h: number,
  massa: number,
): number[] {
  const hw = w / 2,
    hh = h / 2,
    m = massa / 4;
  const k = KONTEYNER;
  const ugly = [
    mir.dobavitTochku(cx - hw, cy - hh, m, k.radius, k.trenie, k.dempfer),
    mir.dobavitTochku(cx + hw, cy - hh, m, k.radius, k.trenie, k.dempfer),
    mir.dobavitTochku(cx + hw, cy + hh, m, k.radius, k.trenie, k.dempfer),
    mir.dobavitTochku(cx - hw, cy + hh, m, k.radius, k.trenie, k.dempfer),
  ];
  for (let i = 0; i < 4; i++)
    mir.dobavitSvyaz(ugly[i] as number, ugly[(i + 1) % 4] as number, k.zhestkost, 1);
  mir.dobavitSvyaz(ugly[0] as number, ugly[2] as number, k.zhestkost, 1);
  mir.dobavitSvyaz(ugly[1] as number, ugly[3] as number, k.zhestkost, 1);
  return ugly;
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
      fiksiruetsya: o.fiksiruetsya ?? true,
      verh: o.y,
      skorost: o.skorost ?? 1,
      zaderzhka: o.zaderzhka ?? 2,
      aktivna:
        o.tip === 'lava' || o.tip === 'ship' || o.tip === 'voda' || o.tip === 'potok'
          ? !(o.vyklyuchena ?? false)
          : false,
      sobrana: false,
      otrezki: [],
      zvenya: [],
      svyazi: [],
      x0: o.x,
      y0: o.y,
      hodX: o.hodX ?? 0,
      hodY: o.hodY ?? 0,
      period: o.period ?? 4,
      faza: o.faza ?? 0,
      pauza: o.pauza ?? 0,
      chasticy: [],
      kontur: -1,
      plavuchest: o.plavuchest ?? 1.5,
      silaX: o.silaX ?? 0,
      silaY: o.silaY ?? 0,
    };
    if (o.tip === 'yashchik' || o.tip === 'mayatnik') {
      // контейнер: четыре угла со всеми связями и контуром площади, как тело врага
      const w = o.w ?? 1,
        h = o.h ?? 1;
      const dlina = o.dlina ?? 2;
      const n = Math.max(2, o.zvenyev ?? Math.max(2, Math.round(dlina / 0.3)));
      const shag = dlina / n;
      const radiusZvena = Math.max(CEP.radiusZvena, shag * 0.55);
      // маятник: верх контейнера ниже последнего звена на радиус звена, иначе звено
      // выталкивается из контура и раскачивает контейнер само
      const cx = o.tip === 'yashchik' ? o.x + w / 2 : o.x;
      const cy = o.tip === 'yashchik' ? o.y + h / 2 : o.y - dlina - radiusZvena - 0.02 - h / 2;
      s.chasticy = postroitKonteyner(mir, cx, cy, w, h, o.massa ?? KONTEYNER.massa);
      s.kontur = mir.dobavitKontur(s.chasticy[0] as number, 4, KONTEYNER.obyom, 1);
      if (o.tip === 'mayatnik') {
        // якорь и цепь вниз, последнее звено держит оба верхних угла
        const a = mir.dobavitTochku(o.x, o.y, CEP.massaYakorya, 0.02, 1, 0);
        mir.gravMul[a] = 0;
        const raz = o.razryv ?? CEP.razryv[o.prochnost ?? 'prochnaya'];
        let prev = a;
        for (let i = 1; i <= n; i++) {
          const q = mir.dobavitTochku(o.x, o.y - shag * i, CEP.massaZvena, radiusZvena, 1, 0.995);
          mir.sdelatTverdoy(q);
          s.zvenya.push(q);
          const sv = mir.dobavitSvyaz(prev, q, CEP.zhestkost, 1);
          mir.sRazryv[sv] = raz;
          s.svyazi.push(sv);
          prev = q;
        }
        for (const ugol of [s.chasticy[3] as number, s.chasticy[2] as number]) {
          const sv = mir.dobavitSvyaz(prev, ugol, CEP.zhestkost, 1);
          mir.sRazryv[sv] = raz;
          s.svyazi.push(sv);
        }
      }
    }
    if (o.tip === 'cep') {
      const n = Math.max(2, o.zvenyev ?? 8);
      const x2 = o.x2 ?? o.x,
        y2 = o.y2 ?? o.y - n * 0.25;
      const raz = o.razryv ?? CEP.razryv[o.prochnost ?? 'prochnaya'];
      const dvaYakorya = o.x2 !== undefined;
      // якорь A: неподвижная частица огромной массы
      const a = mir.dobavitTochku(o.x, o.y, CEP.massaYakorya, 0.02, 1, 0);
      mir.gravMul[a] = 0;
      let prev = a;
      // мост провисает по параболе: дуга длиннее прямой в zapas раз, звенья не сжаты и не растянуты
      const pryamaya = Math.hypot(x2 - o.x, y2 - o.y);
      const zapas = o.zapas ?? CEP.zapas;
      const proves = dvaYakorya ? Math.sqrt((3 * pryamaya * pryamaya * (zapas - 1)) / 8) : 0;
      // радиус звена от шага: звенья перекрываются, тело не проваливается между ними
      const shagZvena = (pryamaya * (dvaYakorya ? zapas : 1)) / (n + (dvaYakorya ? 1 : 0));
      const radiusZvena = Math.max(CEP.radiusZvena, shagZvena * 0.55);
      for (let i = 1; i <= n; i++) {
        const t = i / (n + (dvaYakorya ? 1 : 0));
        const q = mir.dobavitTochku(
          o.x + (x2 - o.x) * t,
          o.y + (y2 - o.y) * t - 4 * proves * t * (1 - t),
          CEP.massaZvena,
          radiusZvena,
          1,
          0.995,
        );
        mir.sdelatTverdoy(q);
        s.zvenya.push(q);
        const sv = mir.dobavitSvyaz(prev, q, CEP.zhestkost, 1);
        mir.sRazryv[sv] = raz;
        s.svyazi.push(sv);
        prev = q;
      }
      if (dvaYakorya) {
        const b = mir.dobavitTochku(x2, y2, CEP.massaYakorya, 0.02, 1, 0);
        mir.gravMul[b] = 0;
        const sv = mir.dobavitSvyaz(prev, b, CEP.zhestkost, 1);
        mir.sRazryv[sv] = raz;
        s.svyazi.push(sv);
      }
    }
    if (o.tip === 'porshen' || o.tip === 'konveyer') {
      // твёрдый прямоугольник из четырёх односторонних отрезков (как заслонка), металл:
      // верхняя грань идёт слева направо, твёрдая сторона снизу
      const x1 = o.x,
        y1 = o.y,
        x2 = o.x + (o.w ?? 0),
        y2 = o.y + (o.h ?? 0);
      const mat = SVOYSTVA_MATERIALA.metall;
      const tr = o.tip === 'konveyer' ? 1 : mat.trenie; // конвейер держит, чтобы тянуть
      s.otrezki.push(
        mir.dobavitOtrezok(x1, y1, x1, y2, tr, mat.sherohovat, 1),
        mir.dobavitOtrezok(x1, y2, x2, y2, tr, mat.sherohovat, 1),
        mir.dobavitOtrezok(x2, y2, x2, y1, tr, mat.sherohovat, 1),
        mir.dobavitOtrezok(x2, y1, x1, y1, tr, mat.sherohovat, 1),
      );
      if (o.tip === 'konveyer') mir.zadatPoverhnost(s.otrezki[1] as number, (o.skorost ?? 1) / 60);
    }
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
