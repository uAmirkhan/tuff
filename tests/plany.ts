// Планы прохождения уровней кампании ботом. Один источник правды: отсюда их берут
// и соло-тесты `prohozhdenie-*`, и кооп-прогон `scripts/koop-prohod-yarusa.ts`.
// Раньше планы лежали литералами внутри тестов, и переиспользовать их было нечем.
//
// Уровни k1-6, k1-7 и stvol-1 сюда пока не вынесены: у них свои прогонщики
// (погоня, бой с боссом, забег на время), а не общий `proyti`.
import type { Namerenie } from '../src/game/telo';

export interface Shag {
  takty: number;
  nam: Partial<Namerenie>;
}

export const PLANY: Record<string, Shag[]> = {
  'k1-1': [
    { takty: 90, nam: { dx: -1 } }, // A: ниша за разбитым баком
    { takty: 420, nam: { dx: 1 } }, // зал, полки, поддон
    { takty: 420, nam: { dx: 1, dy: 1, vyazkost: true } }, // D: стена крепежа
    { takty: 900, nam: { dx: 1 } }, // площадка, ванна, пандус, выход
  ],
  'k1-2': [
    { takty: 240, nam: { dx: 1 } },
    { takty: 240, nam: { dx: 1, rasplav: true } }, // A: щель
    { takty: 200, nam: { dx: 1 } }, // B, C: стекло над ямой, вода, плита
    { takty: 160, nam: { dx: 1, rasplav: true } }, // боковой канал
    { takty: 200, nam: { dx: -1, rasplav: true } },
    { takty: 120, nam: { dx: -1 } },
    { takty: 260, nam: { dx: 1 } }, // уголёк, горн
    { takty: 300, nam: { dx: 1, korka: true } }, // D: Обрезок
    { takty: 200, nam: { dx: 1 } },
    { takty: 420, nam: { dx: 1, rasplav: true } }, // E: труба, форсунка
    { takty: 600, nam: { dx: 1 } }, // G: выход
  ],
  'k1-3': [
    { takty: 420, nam: { dx: 1 } }, // A, B: иней-камера, сход в Корке, хрупкий пол
    { takty: 100, nam: { dx: 1 } }, // C, D: слив, конвейер
    { takty: 300, nam: { dx: 1, korka: true } }, // пандус и сход в шахту в Корке
    { takty: 200, nam: { korka: true } },
    { takty: 300, nam: { dx: 1 } }, // тоннель
    { takty: 420, nam: { dx: 1, dy: 1, vyazkost: true } }, // колодец
    { takty: 400, nam: { dx: 1 } }, // выход
  ],
  'k1-4': [
    { takty: 200, nam: { dx: 1 } },
    { takty: 170, nam: { dx: 1, dy: 1, vyazkost: true } }, // A: иней-стена за три секунды
    { takty: 380, nam: { dx: 1, dy: 1, vyazkost: true } }, // B: сплошной потолок над водой до площадки
    { takty: 40, nam: { dx: 1 } }, // C: с площадки в коридор, к Скачку и плите на 29,5
    { takty: 120, nam: { dx: 1, korka: true } }, // Корка давит Скачка на плите, дверь; тяжёлым докатывается до ступени-гасителя
    { takty: 300, nam: { dx: 1, dy: 1, vyazkost: true } }, // E: иней-потолок над ямой 5,5 за три секунды
    { takty: 400, nam: { dx: 1 } },
  ],
  'k1-5': [
    { takty: 420, nam: { dx: 1 } }, // A, B, C: мост 1 без Корки, плита, дверь 1, мост 2, упор в дверь 2
    { takty: 30, nam: { dx: -1 } },
    { takty: 100, nam: { dx: 1, korka: true } }, // тяжёлая плита в Корке
    { takty: 60, nam: { dx: 1 } },
    { takty: 240, nam: { dx: 1, dy: 1, vyazkost: true } }, // D: блок, иней-потолок, иней-стена
    { takty: 280, nam: { vyazkost: true } }, // E: узел, тело докатывается по инерции
    { takty: 600, nam: { dx: 1 } }, // F: выход
  ],
};
