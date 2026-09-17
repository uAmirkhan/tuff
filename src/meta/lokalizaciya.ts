// Локализация: русский и английский. Текста в игре мало, всё здесь.
export type Yazyk = 'ru' | 'en';

const STROKI = {
  ru: {
    urovni: 'Уровни',
    igrat: 'Играть',
    dalshe: 'Дальше',
    eshche: 'Ещё раз',
    proyden: 'пройден',
    vremya: 'время',
    ochki: 'очки',
    serdca: 'сердца',
    smerti: 'смерти',
    rekord: 'новый рекорд',
    padenie: 'самое длинное падение',
    vysota: 'высота',
    zhar: 'жар',
    mir1: 'Ядро',
    zakryt: 'закрыт',
    podskazka: 'WASD/стрелки  J Вязкость  K Расплав  L Корка  Пробел Выброс',
    zagruzka: 'Загрузка',
    '1-1': 'Пробуждение',
    '1-2': 'Тонкий пол',
    '1-3': 'Щель',
    '1-4': 'Потолок',
    '1-5': 'Цепи',
    '1-6': 'Прорыв',
    '1-7': 'Тройной котёл',
    'zh-1': 'Жерло: Первая труба',
  },
  en: {
    urovni: 'Levels',
    igrat: 'Play',
    dalshe: 'Next',
    eshche: 'Retry',
    proyden: 'cleared',
    vremya: 'time',
    ochki: 'score',
    serdca: 'hearts',
    smerti: 'deaths',
    rekord: 'new record',
    padenie: 'longest fall',
    vysota: 'height',
    zhar: 'heat',
    mir1: 'The Core',
    zakryt: 'locked',
    podskazka: 'WASD/arrows  J Grip  K Melt  L Crust  Space Burst',
    zagruzka: 'Loading',
    '1-1': 'Awakening',
    '1-2': 'Thin Floor',
    '1-3': 'The Slit',
    '1-4': 'The Ceiling',
    '1-5': 'Chains',
    '1-6': 'Breakthrough',
    '1-7': 'Triple Cauldron',
    'zh-1': 'The Vent: First Pipe',
  },
} as const;

export type Klyuch = keyof (typeof STROKI)['ru'];

export function vybratYazyk(kod: string): Yazyk {
  return kod.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export function t(yazyk: Yazyk, k: Klyuch): string {
  return STROKI[yazyk][k] ?? STROKI.ru[k] ?? k;
}

// Название уровня по id с запасным вариантом из данных уровня
export function nazvanieUrovnya(yazyk: Yazyk, id: string, zapasnoe: string): string {
  const s = (STROKI[yazyk] as Record<string, string>)[id];
  return s ?? zapasnoe;
}
