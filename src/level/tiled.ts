// Обмен с редактором Tiled (JSON карта, слои объектов). Единица мира = tilewidth пикселей,
// ось y у Tiled вниз, у нас вверх: переворот по высоте карты.
// Слой «poligony»: объекты-многоугольники, класс = материал. Слой «obekty»: точки, прямоугольники
// и ломаные, класс = тип объекта, свойства = поля Obekt. Свойства карты = поля уровня.
import type { Material, Obekt, Poligon, TipObekta, Uroven } from './format';

export interface TiledSvoystvo {
  name: string;
  type: 'string' | 'int' | 'float' | 'bool';
  value: string | number | boolean;
}

export interface TiledObekt {
  id: number;
  name: string;
  type?: string; // Tiled до 1.9
  class?: string; // Tiled 1.9+
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  visible?: boolean;
  point?: boolean;
  polygon?: { x: number; y: number }[];
  polyline?: { x: number; y: number }[];
  properties?: TiledSvoystvo[];
}

export interface TiledSloy {
  id: number;
  name: string;
  type: 'objectgroup' | 'tilelayer' | 'imagelayer' | 'group';
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
  objects?: TiledObekt[];
  draworder?: string;
}

export interface TiledKarta {
  type: 'map';
  version: string;
  tiledversion?: string;
  orientation: 'orthogonal';
  renderorder: string;
  infinite: boolean;
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  nextlayerid: number;
  nextobjectid: number;
  layers: TiledSloy[];
  tilesets: unknown[];
  properties?: TiledSvoystvo[];
}

const MATERIALY: Material[] = ['bazalt', 'lyod', 'hrupkiy', 'metall'];
// Объекты с шириной и высотой: x,y у нас левый нижний угол
const PRYAMOUGOLNYE: TipObekta[] = [
  'lava',
  'ship',
  'voda',
  'zaslonka',
  'obval',
  'porshen',
  'konveyer',
  'yashchik',
  'potok',
  'okno',
  'panorama',
];
// Поля Obekt, которые переносятся свойствами как есть
const POLYA_OBEKTA = [
  'cel',
  'nuzhnaKorka',
  'vyklyuchena',
  'fiksiruetsya',
  'zvenyev',
  'prochnost',
  'skorost',
  'zaderzhka',
  'razryv',
  'zapas',
  'hodX',
  'hodY',
  'period',
  'faza',
  'pauza',
  'massa',
  'dlina',
  'plavuchest',
  'silaX',
  'silaY',
  'os',
  'vid',
  'nadpis',
  'nomer',
] as const;
// точечные объекты с размерами в свойствах (маятник: якорь точкой, контейнер размерами)
const RAZMERY_V_SVOYSTVAH: TipObekta[] = ['mayatnik', 'koromyslo', 'bak'];
const POLYA_UROVNYA = [
  'id',
  'nazvanie',
  'mysl',
  'rezhim',
  'vremyaZvezdy',
  'vyhodPosleBossa',
  'zvyozdDlyaOtkrytiya',
] as const;

function klass(o: TiledObekt): string {
  return o.class ?? o.type ?? '';
}

function svoystva(list: TiledSvoystvo[] | undefined): Record<string, string | number | boolean> {
  const r: Record<string, string | number | boolean> = {};
  for (const p of list ?? []) r[p.name] = p.value;
  return r;
}

function vSvoystva(obj: Record<string, unknown>, klyuchi: readonly string[]): TiledSvoystvo[] {
  const r: TiledSvoystvo[] = [];
  for (const k of klyuchi) {
    const v = obj[k];
    if (v === undefined) continue;
    const type =
      typeof v === 'boolean'
        ? 'bool'
        : typeof v === 'number'
          ? Number.isInteger(v)
            ? 'int'
            : 'float'
          : 'string';
    r.push({ name: k, type, value: v as string | number | boolean });
  }
  return r;
}

function okrugl(v: number): number {
  return Math.round(v * 1000) / 1000;
}

// Tiled → уровень
export function izTiled(m: TiledKarta): Uroven {
  const sh = m.tilewidth;
  const H = m.height * m.tileheight;
  const ms = svoystva(m.properties);
  // начало координат Tiled стоит в (minX, maxY) уровня; без свойств границ считаем (0, H/sh)
  const minX = typeof ms.minX === 'number' ? ms.minX : 0;
  const maxY = typeof ms.maxY === 'number' ? ms.maxY : okrugl(H / sh);
  const X = (px: number) => okrugl(minX + px / sh);
  const Y = (py: number) => okrugl(maxY - py / sh);
  const poligony: Poligon[] = [];
  const obekty: Obekt[] = [];
  let start: [number, number] = [1, 1];
  for (const sloy of m.layers) {
    if (sloy.type !== 'objectgroup') continue;
    for (const o of sloy.objects ?? []) {
      const k = klass(o);
      const ps = svoystva(o.properties);
      if (o.polygon) {
        const p: Poligon = {
          tochki: o.polygon.map((t) => [X(o.x + t.x), Y(o.y + t.y)] as [number, number]),
        };
        // базальт это материал по умолчанию, в уровне не записывается
        if (k !== 'bazalt' && MATERIALY.includes(k as Material)) p.material = k as Material;
        if (typeof ps.hrupkost === 'number') p.hrupkost = ps.hrupkost;
        poligony.push(p);
        continue;
      }
      if (k === 'start') {
        start = [X(o.x), Y(o.y)];
        continue;
      }
      if (!k) continue;
      const tip = k as TipObekta;
      const ob: Obekt = { tip, x: 0, y: 0 };
      if (o.name) ob.id = o.name;
      if (o.polyline && o.polyline.length >= 2) {
        const a = o.polyline[0] as { x: number; y: number };
        const b = o.polyline[o.polyline.length - 1] as { x: number; y: number };
        ob.x = X(o.x + a.x);
        ob.y = Y(o.y + a.y);
        ob.x2 = X(o.x + b.x);
        ob.y2 = Y(o.y + b.y);
      } else if (PRYAMOUGOLNYE.includes(tip) && (o.width || o.height)) {
        ob.x = X(o.x);
        ob.y = Y(o.y + o.height);
        if (o.width) ob.w = okrugl(o.width / sh);
        if (o.height) ob.h = okrugl(o.height / sh); // обвал задаёт только ширину
      } else {
        ob.x = X(o.x);
        ob.y = Y(o.y);
      }
      for (const pole of POLYA_OBEKTA) {
        if (ps[pole] !== undefined) (ob as unknown as Record<string, unknown>)[pole] = ps[pole];
      }
      if (RAZMERY_V_SVOYSTVAH.includes(tip)) {
        if (typeof ps.w === 'number') ob.w = ps.w;
        if (typeof ps.h === 'number') ob.h = ps.h;
      }
      obekty.push(ob);
    }
  }
  const u: Uroven = {
    versiya: 1,
    id: String(ms.id ?? 'bez-id'),
    nazvanie: String(ms.nazvanie ?? ''),
    mysl: String(ms.mysl ?? ''),
    start,
    granicy: {
      minX,
      minY: typeof ms.minY === 'number' ? ms.minY : okrugl(maxY - H / sh),
      maxX: typeof ms.maxX === 'number' ? ms.maxX : okrugl(minX + (m.width * m.tilewidth) / sh),
      maxY,
    },
    poligony,
    obekty,
  };
  for (const pole of [
    'rezhim',
    'vremyaZvezdy',
    'vyhodPosleBossa',
    'zvyozdDlyaOtkrytiya',
  ] as const) {
    if (ms[pole] !== undefined) (u as unknown as Record<string, unknown>)[pole] = ms[pole];
  }
  return u;
}

// Уровень → Tiled. Карта покрывает границы уровня; начало координат Tiled в (minX, maxY).
export function vTiled(u: Uroven, sh = 32): TiledKarta {
  const g = u.granicy;
  const W = (g.maxX - g.minX) * sh;
  const H = (g.maxY - g.minY) * sh;
  const PX = (x: number) => okrugl((x - g.minX) * sh);
  const PY = (y: number) => okrugl((g.maxY - y) * sh);
  let nid = 1;
  const poligony: TiledObekt[] = u.poligony.map((p) => {
    const t0 = p.tochki[0] as [number, number];
    const ox = PX(t0[0]),
      oy = PY(t0[1]);
    const o: TiledObekt = {
      id: nid++,
      name: '',
      class: p.material ?? 'bazalt',
      x: ox,
      y: oy,
      width: 0,
      height: 0,
      rotation: 0,
      visible: true,
      polygon: p.tochki.map(([x, y]) => ({ x: okrugl(PX(x) - ox), y: okrugl(PY(y) - oy) })),
    };
    if (p.hrupkost !== undefined)
      o.properties = vSvoystva(p as unknown as Record<string, unknown>, ['hrupkost']);
    return o;
  });
  const obekty: TiledObekt[] = [];
  obekty.push({
    id: nid++,
    name: 'start',
    class: 'start',
    x: PX(u.start[0]),
    y: PY(u.start[1]),
    width: 0,
    height: 0,
    rotation: 0,
    visible: true,
    point: true,
  });
  for (const ob of u.obekty) {
    const o: TiledObekt = {
      id: nid++,
      name: ob.id ?? '',
      class: ob.tip,
      x: PX(ob.x),
      y: PY(ob.y),
      width: 0,
      height: 0,
      rotation: 0,
      visible: true,
    };
    if (ob.x2 !== undefined && ob.y2 !== undefined) {
      o.polyline = [
        { x: 0, y: 0 },
        { x: okrugl(PX(ob.x2) - o.x), y: okrugl(PY(ob.y2) - o.y) },
      ];
    } else if (PRYAMOUGOLNYE.includes(ob.tip) && (ob.w || ob.h)) {
      o.width = okrugl((ob.w ?? 0) * sh);
      o.height = okrugl((ob.h ?? 0) * sh);
      o.y = PY(ob.y + (ob.h ?? 0));
    } else {
      o.point = true;
    }
    const props = vSvoystva(ob as unknown as Record<string, unknown>, POLYA_OBEKTA);
    if (RAZMERY_V_SVOYSTVAH.includes(ob.tip))
      props.push(...vSvoystva(ob as unknown as Record<string, unknown>, ['w', 'h']));
    if (props.length) o.properties = props;
    obekty.push(o);
  }
  const karta: TiledKarta = {
    type: 'map',
    version: '1.10',
    tiledversion: '1.11.0',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    infinite: false,
    width: Math.ceil(W / sh),
    height: Math.ceil(H / sh),
    tilewidth: sh,
    tileheight: sh,
    nextlayerid: 3,
    nextobjectid: nid,
    tilesets: [],
    layers: [
      {
        id: 1,
        name: 'poligony',
        type: 'objectgroup',
        visible: true,
        opacity: 1,
        x: 0,
        y: 0,
        draworder: 'topdown',
        objects: poligony,
      },
      {
        id: 2,
        name: 'obekty',
        type: 'objectgroup',
        visible: true,
        opacity: 1,
        x: 0,
        y: 0,
        draworder: 'topdown',
        objects: obekty,
      },
    ],
    properties: [
      ...vSvoystva(u as unknown as Record<string, unknown>, POLYA_UROVNYA),
      ...vSvoystva(g as unknown as Record<string, unknown>, ['minX', 'minY', 'maxX', 'maxY']),
    ],
  };
  return karta;
}
