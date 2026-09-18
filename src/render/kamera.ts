// Кадр камеры: где центр и какой масштаб, чтобы все тела игроков были видны.
// Чистая математика без PixiJS, поэтому проверяется тестами без запуска отрисовки.

export interface PredelMasshtaba {
  min: number; // пикселей на единицу при полном отдалении
  maks: number; // пикселей на единицу в обычной игре
}

export interface KadrKamery {
  x: number;
  y: number;
  masshtab: number;
  vlezli: boolean; // поместились ли все тела; false — повод делить экран
}

export const KAMERA = {
  zapas: 3, // единиц воздуха вокруг крайних тел
  podyom: 1, // камера смотрит чуть выше центра: под ногами интереснее, чем над головой
} as const;

/**
 * Кадр по списку центров тел. Одно тело даёт прежнее поведение: центр плюс подъём,
 * масштаб максимальный. Два тела раздвигают кадр, пока хватает предела масштаба.
 */
export function celKamery(
  tela: readonly { cx: number; cy: number }[],
  ekranW: number,
  ekranH: number,
  predel: PredelMasshtaba,
  zapas: number = KAMERA.zapas,
): KadrKamery {
  if (tela.length === 0) return { x: 0, y: 0, masshtab: predel.maks, vlezli: true };
  let minX = Number.POSITIVE_INFINITY,
    maksX = Number.NEGATIVE_INFINITY,
    minY = Number.POSITIVE_INFINITY,
    maksY = Number.NEGATIVE_INFINITY;
  for (const t of tela) {
    if (t.cx < minX) minX = t.cx;
    if (t.cx > maksX) maksX = t.cx;
    if (t.cy < minY) minY = t.cy;
    if (t.cy > maksY) maksY = t.cy;
  }
  const nuzhnaW = maksX - minX + zapas * 2;
  const nuzhnaH = maksY - minY + zapas * 2;
  const vlezaet = Math.min(ekranW / nuzhnaW, ekranH / nuzhnaH);
  const masshtab = Math.max(predel.min, Math.min(predel.maks, vlezaet));
  return {
    x: (minX + maksX) / 2,
    y: (minY + maksY) / 2 + KAMERA.podyom,
    masshtab,
    vlezli: vlezaet >= predel.min,
  };
}

/** Экран делится, когда тела не помещаются даже при полном отдалении. */
export function nuzhnoDelenie(
  tela: readonly { cx: number; cy: number }[],
  ekranW: number,
  ekranH: number,
  predel: PredelMasshtaba,
  zapas: number = KAMERA.zapas,
): boolean {
  return !celKamery(tela, ekranW, ekranH, predel, zapas).vlezli;
}
