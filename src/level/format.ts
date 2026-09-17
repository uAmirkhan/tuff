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
  | 'zaslonka' // дверь, открывается по ссылке
  | 'kotyol' // босс мира 1: котёл, x центр, y низ
  | 'obval' // погоня: снизу поднимается лавовый обвал, касание = смерть; x,w ширина, y начало верха
  | 'cep' // цепь между двумя якорями (x,y)-(x2,y2) или висящая с одного; поля zvenyev, prochnost
  | 'shlakozhuk' // враг: ползёт и жжёт холодом
  | 'iskropryg' // враг: то же, иногда прыгает
  | 'porshen' // кинематический прямоугольник: ходит от (x,y) на (hodX,hodY) и обратно за period секунд, pauza на концах
  | 'konveyer' // прямоугольник, верхняя грань тянет тело вдоль +x со скоростью skorost единиц в секунду
  | 'yashchik' // твёрдый контейнер: x,y левый нижний угол, w,h, massa; толкается, тонет, тянется Вязкостью
  | 'mayatnik'; // контейнер w×h на цепи длиной dlina от якоря (x,y); качается, цепь из zvenyev звеньев

export interface Obekt {
  tip: TipObekta;
  id?: string;
  x: number;
  y: number;
  w?: number; // для зон и заслонок
  h?: number;
  cel?: string; // id объекта, который переключает плита или рычаг
  nuzhnaKorka?: boolean; // плита срабатывает только под Коркой
  vyklyuchena?: boolean; // зона (лава) выключена до срабатывания рычага или плиты с cel на неё
  fiksiruetsya?: boolean; // плита остаётся нажатой (по умолчанию да); false = держит только под весом
  x2?: number; // второй якорь цепи
  y2?: number;
  zvenyev?: number; // число звеньев цепи
  prochnost?: 'slabaya' | 'prochnaya'; // слабая рвётся под Коркой
  skorost?: number; // обвал: единиц в секунду вверх
  zaderzhka?: number; // обвал: секунд до старта
  razryv?: number; // явный порог растяжения цепи, калибруется scripts/most2b.ts под геометрию моста
  zapas?: number; // длина дуги к прямой: 1.0 натянутая цепь (нагрузка сильно растягивает), 1.06 провисшая
  hodX?: number; // поршень: ход по x
  hodY?: number; // поршень: ход по y
  period?: number; // поршень: секунд на полный цикл туда и обратно, включая паузы
  faza?: number; // поршень: сдвиг цикла, доля периода 0..1
  pauza?: number; // поршень: секунд стоянки на каждом конце
  massa?: number; // контейнер: полная масса (по умолчанию половина массы героя)
  dlina?: number; // маятник: длина цепи от якоря до верха контейнера
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
  vyhodPosleBossa?: boolean; // выход открывается только после победы над боссом
  rezhim?: 'kampaniya' | 'zherlo'; // Жерло: без чекпоинтов, таймер, призрак лучшей попытки
  zvyozdDlyaOtkrytiya?: number; // сколько звёзд мира нужно, чтобы уровень открылся
}

export const SVOYSTVA_MATERIALA: Record<Material, { trenie: number; sherohovat: 0 | 1 }> = {
  bazalt: { trenie: 1.0, sherohovat: 1 },
  lyod: { trenie: 0.05, sherohovat: 0 },
  hrupkiy: { trenie: 1.0, sherohovat: 1 },
  metall: { trenie: 0.3, sherohovat: 0 },
};
