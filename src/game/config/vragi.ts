// Параметры врагов мира 1. Стартовые числа, настройка по ощущению.
export const VRAGI = {
  obrezok: {
    zhar: 30,
    massa: 0.3,
    shirina: 0.7,
    vysota: 0.45,
    trenie: 1.0,
    zrenie: 9, // с какого расстояния видит игрока
    tyaga: 0.006, // добавка скорости за такт
    pryzhok: 0,
    shansPryzhka: 0,
    uronIgroku: 0.4, // жара за такт контакта
  },
  skachok: {
    zhar: 25,
    massa: 0.25,
    shirina: 0.55,
    vysota: 0.45,
    trenie: 1.0,
    zrenie: 10,
    tyaga: 0.007,
    pryzhok: 0.085, // импульс прыжка: около 1,5 диаметра высоты
    shansPryzhka: 0.4,
    uronIgroku: 0.4,
  },
  // Дрон «Уборщик»: регламент «убрать образец». Твёрдый корпус, патрулирует пол, увидев героя,
  // едет на него и толкает щёткой; урона нет. Замыкает в воде. Давится Коркой с высоты.
  uborshchik: {
    zhar: 40,
    massa: 1.5,
    shirina: 0.9,
    vysota: 0.5,
    trenie: 0.8,
    zrenie: 8,
    tyaga: 0.004,
    pryzhok: 0,
    shansPryzhka: 0,
    uronIgroku: 0,
  },
} as const;

// Свойства семейств (12-bestiariy): дроны твёрдые, замыкают в воде, толкают и не жгут;
// обрезки мягкие, застывают в воде через две секунды
export const SEMEYSTVA = {
  obrezok: { tverdyy: false, patrul: false, zamykaetVVode: false, zastyvaetVVode: true },
  skachok: { tverdyy: false, patrul: false, zamykaetVVode: false, zastyvaetVVode: true },
  uborshchik: { tverdyy: true, patrul: true, zamykaetVVode: true, zastyvaetVVode: false },
} as const;
export const VODA_ZASTYVANIE = 120; // тактов в воде до застывания обрезка

export const BOY = {
  // урон врагу от среды в разы сильнее, чем игроку (стартовый множитель 4, гипотеза)
  sredaMnozhitel: 4,
  // давление Коркой: удар тела игрока по врагу сверху; порог импульса и урон
  porogDavleniya: 0.25,
  uronDavleniya: 30,
  // в Корке обычный контакт с врагом не жжёт игрока
  korkaZashchishchaet: true,
} as const;
