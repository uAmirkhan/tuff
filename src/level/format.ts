// Формат уровня. Читается человеком, версионируется. Единица: диаметр тела героя.
// Многоугольники твёрдые внутри; порядок вершин нормализуется загрузчиком.

export type Material = 'bazalt' | 'lyod' | 'hrupkiy' | 'metall';

export interface Poligon {
  tochki: [number, number][];
  material?: Material;
  hrupkost?: number; // порог удара для hrupkiy
}

export interface Platforma {
  ot: [number, number];
  do: [number, number];
  material?: Material;
}

export type TipObekta =
  | 'gorn' // чекпоинт
  | 'vyhod'
  | 'zharkamen' // +10 очков
  | 'zharkamenSredniy' // +50
  | 'serdce' // сердце-камень, +500, три на уровень
  | 'ugolek' // +25 жара
  | 'lava' // зона: лечит
  | 'ship' // зона: урон за время
  | 'voda' // зона: урон и принудительная Корка
  | 'ispytanie' // разметка для валидатора: начало испытания
  | 'plita' // нажимная плита, поле cel
  | 'rychag' // рычаг, поле cel
  | 'zaslonka'; // дверь, открывается по ссылке

export interface Obekt {
  tip: TipObekta;
  id?: string;
  x: number;
  y: number;
  w?: number; // для зон и заслонок
  h?: number;
  cel?: string; // id объекта, который переключает плита или рычаг
  nuzhnaKorka?: boolean; // плита срабатывает только под Коркой
}

export interface Uroven {
  versiya: 1;
  id: string;
  nazvanie: string;
  mysl: string; // одна мысль уровня из формата описания
  start: [number, number];
  granicy: { minX: number; minY: number; maxX: number; maxY: number };
  poligony: Poligon[];
  platformy?: Platforma[];
  obekty: Obekt[];
  vremyaZvezdy?: number; // секунды на вторую звезду там, где нет сердце-камней
}

export const SVOYSTVA_MATERIALA: Record<Material, { trenie: number; sherohovat: 0 | 1 }> = {
  bazalt: { trenie: 1.0, sherohovat: 1 },
  lyod: { trenie: 0.05, sherohovat: 0 },
  hrupkiy: { trenie: 1.0, sherohovat: 1 },
  metall: { trenie: 0.3, sherohovat: 0 },
};
