// Параметры врагов мира 1. Стартовые числа, настройка по ощущению.
export const VRAGI = {
  shlakozhuk: {
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
  iskropryg: {
    zhar: 25,
    massa: 0.25,
    shirina: 0.55,
    vysota: 0.45,
    trenie: 1.0,
    zrenie: 10,
    tyaga: 0.007,
    pryzhok: 0.16, // импульс прыжка
    shansPryzhka: 0.4,
    uronIgroku: 0.4,
  },
} as const;

export const BOY = {
  // урон врагу от среды в разы сильнее, чем игроку (стартовый множитель 4, гипотеза)
  sredaMnozhitel: 4,
  // давление Коркой: удар тела игрока по врагу сверху; порог импульса и урон
  porogDavleniya: 0.25,
  uronDavleniya: 30,
  // в Корке обычный контакт с врагом не жжёт игрока
  korkaZashchishchaet: true,
} as const;
