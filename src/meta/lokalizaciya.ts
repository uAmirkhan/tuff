// Локализация: русский и английский. Текста в игре мало, всё здесь.
export type Yazyk = 'ru' | 'en';

const STROKI = {
  ru: {
    urovni: 'Уровни',
    zhurnal: 'Журнал',
    naydeno: 'Найдено',
    igrat: 'Играть',
    dalshe: 'Дальше',
    eshche: 'Ещё раз',
    proyden: 'пройден',
    vremya: 'время',
    ochki: 'очки',
    serdca: 'сердца',
    smerti: 'смерти',
    nuzhno: 'нужно',
    rekord: 'новый рекорд',
    padenie: 'самое длинное падение',
    vysota: 'высота',
    zhar: 'жар',
    mir1: 'Ярус 1: Криоблок',
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
    'k1-1': 'Зал баков',
    'k1-2': 'Промывочная',
    'k1-3': 'Сортировка',
    'k1-4': 'Иней-камеры',
    'k1-5': 'Криоархив',
    'k1-6': 'Промывка яруса',
    'k1-7': 'Криостат',
    'stvol-1': 'Ствол: подъём 1',
  },
  en: {
    urovni: 'Levels',
    zhurnal: 'Journal',
    naydeno: 'Found',
    igrat: 'Play',
    dalshe: 'Next',
    eshche: 'Retry',
    proyden: 'cleared',
    vremya: 'time',
    ochki: 'score',
    serdca: 'hearts',
    smerti: 'deaths',
    nuzhno: 'need',
    rekord: 'new record',
    padenie: 'longest fall',
    vysota: 'height',
    zhar: 'heat',
    mir1: 'Tier 1: Cryoblock',
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
    'k1-1': 'Tank Hall',
    'k1-2': 'Wash Room',
    'k1-3': 'Sorting',
    'k1-4': 'Frost Chambers',
    'k1-5': 'Cryo-Archive',
    'k1-6': 'Tier Flush',
    'k1-7': 'Cryostat',
    'stvol-1': 'The Shaft: Ascent 1',
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
