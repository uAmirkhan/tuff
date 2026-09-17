// Жар (здоровье), награды, радиусы взаимодействия. Числа из 02-gdd-mehaniki.md, разделы 3.7 и 8.
export const ZHAR = {
  maks: 100,
  lechenieLavy: 0.4, // за такт, около 24 в секунду
  uronShipov: 0.5, // за такт
  uronVody: 0.35, // за такт
  korkaPosleVody: 120, // тактов принудительной Корки после воды, 2 секунды
  ugolek: 25,
  ochki: { zharkamen: 10, zharkamenSredniy: 50, serdce: 500, ugolek: 0 } as const,
  radiusSbora: 0.7,
  radiusGorna: 0.9,
  radiusVyhoda: 0.8,
} as const;
