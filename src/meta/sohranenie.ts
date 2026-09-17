// Прогресс игрока: пройденные уровни, звёзды, сердце-камни, настройки.
// Хранилище подменяемое: localStorage в браузере, память в тестах, SDK площадки позже.

export interface ProgressUrovnya {
  proyden: boolean;
  luchsheeVremya: number; // такты, 0 = нет
  luchshieOchki: number;
  serdca: boolean[]; // по id сердце-камней в порядке уровня
  zvezdy: 0 | 1 | 2 | 3;
  zapis?: number[]; // Жерло: ввод лучшей попытки по тактам
}

export interface Progress {
  versiya: 1;
  urovni: Record<string, ProgressUrovnya>;
  paneli: number[]; // найденные панели строителей (Журнал)
  uzly: string[]; // зажжённые узлы теплотрассы по id уровня
  ruda: number; // жар-руда в кармане
  rudaNaydena: string[]; // клады «уровень:id», чтобы не считать дважды
  nastroyki: { pomoshchnik: boolean; raskladka: 'wasd' | 'strelki'; zvuk: boolean };
}

export interface Hranilishche {
  chitat(): string | null;
  pisat(s: string): void;
}

export const PUSTOY_PROGRESS = (): Progress => ({
  versiya: 1,
  urovni: {},
  paneli: [],
  uzly: [],
  ruda: 0,
  rudaNaydena: [],
  nastroyki: { pomoshchnik: false, raskladka: 'wasd', zvuk: true },
});

const KLYUCH = 'tuff-progress-v1';

export class HranilishcheBrauzera implements Hranilishche {
  chitat(): string | null {
    try {
      return localStorage.getItem(KLYUCH);
    } catch {
      return null;
    }
  }
  pisat(s: string): void {
    try {
      localStorage.setItem(KLYUCH, s);
    } catch {
      // приватный режим или запрет: прогресс живёт только в памяти
    }
  }
}

export class HranilishchePamyati implements Hranilishche {
  private s: string | null = null;
  chitat(): string | null {
    return this.s;
  }
  pisat(s: string): void {
    this.s = s;
  }
}

export function zagruzitProgress(h: Hranilishche): Progress {
  const s = h.chitat();
  if (!s) return PUSTOY_PROGRESS();
  try {
    const p = JSON.parse(s) as Partial<Progress>;
    if (p.versiya !== 1 || typeof p.urovni !== 'object') return PUSTOY_PROGRESS();
    return {
      ...PUSTOY_PROGRESS(),
      ...p,
      nastroyki: { ...PUSTOY_PROGRESS().nastroyki, ...p.nastroyki },
    };
  } catch {
    return PUSTOY_PROGRESS();
  }
}

export function sohranitProgress(h: Hranilishche, p: Progress): void {
  h.pisat(JSON.stringify(p));
}

// Звёзды уровня: одна за прохождение, вторая за очки не ниже порога, третья за все сердце-камни
export function schitatZvezdy(
  proyden: boolean,
  ochki: number,
  porogOchkov: number,
  serdcaSobrano: number,
  serdcaVsego: number,
): 0 | 1 | 2 | 3 {
  if (!proyden) return 0;
  let z: 0 | 1 | 2 | 3 = 1;
  if (ochki >= porogOchkov) z = 2;
  if (z === 2 && serdcaVsego > 0 && serdcaSobrano >= serdcaVsego) z = 3;
  return z;
}

// Записать результат прохождения, сохраняя лучшее
export function zapisatRezultat(
  p: Progress,
  id: string,
  rez: { takty: number; ochki: number; serdca: boolean[]; porogOchkov: number; zapis?: number[] },
): ProgressUrovnya {
  const bylo = p.urovni[id] ?? {
    proyden: false,
    luchsheeVremya: 0,
    luchshieOchki: 0,
    serdca: rez.serdca.map(() => false),
    zvezdy: 0 as const,
  };
  const serdca = rez.serdca.map((v, i) => v || (bylo.serdca[i] ?? false));
  const luchshieOchki = Math.max(bylo.luchshieOchki, rez.ochki);
  const luchsheeVremya =
    bylo.luchsheeVremya === 0 ? rez.takty : Math.min(bylo.luchsheeVremya, rez.takty);
  const zvezdy = schitatZvezdy(
    true,
    luchshieOchki,
    rez.porogOchkov,
    serdca.filter(Boolean).length,
    serdca.length,
  );
  const novoe: ProgressUrovnya = { proyden: true, luchsheeVremya, luchshieOchki, serdca, zvezdy };
  // запись хранится только у лучшего времени
  if (rez.zapis && (bylo.luchsheeVremya === 0 || rez.takty <= bylo.luchsheeVremya))
    novoe.zapis = rez.zapis;
  else if (bylo.zapis) novoe.zapis = bylo.zapis;
  p.urovni[id] = novoe;
  return novoe;
}
