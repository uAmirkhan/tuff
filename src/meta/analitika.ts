// Аналитика событий уровня (06-tehnicheskiy-dizayn, раздел 8). Буфер в памяти, дубль в localStorage
// последних 500 событий, отправка наружу через подменяемый приёмник (Метрика или консоль площадки).
export interface SobytieAnalitiki {
  t: number; // мс от старта сессии
  tip: string;
  [k: string]: string | number | boolean;
}

export type Priyomnik = (s: SobytieAnalitiki) => void;

export class Analitika {
  readonly bufer: SobytieAnalitiki[] = [];
  private start = Date.now();
  private priyomniki: Priyomnik[] = [];
  private hranit: ((s: string) => void) | null = null;

  constructor(hranit?: (s: string) => void) {
    this.hranit = hranit ?? null;
  }

  dobavitPriyomnik(p: Priyomnik): void {
    this.priyomniki.push(p);
  }

  sobytie(tip: string, polya: Record<string, string | number | boolean> = {}): void {
    const s: SobytieAnalitiki = { t: Date.now() - this.start, tip, ...polya };
    this.bufer.push(s);
    if (this.bufer.length > 500) this.bufer.shift();
    for (const p of this.priyomniki) {
      try {
        p(s);
      } catch {
        // приёмник не должен ронять игру
      }
    }
    this.hranit?.(JSON.stringify(this.bufer.slice(-500)));
  }

  // Сводка по уровню для ворот решений: смерти по участкам, время, выходы
  svodka(uroven: string): { smerti: number; vremya: number; proyden: boolean; vyhodov: number } {
    let smerti = 0,
      vremya = 0,
      vyhodov = 0,
      proyden = false;
    for (const s of this.bufer) {
      if (s.uroven !== uroven) continue;
      if (s.tip === 'death') smerti++;
      if (s.tip === 'level_complete') {
        proyden = true;
        vremya = Number(s.vremya ?? 0);
      }
      if (s.tip === 'level_quit') vyhodov++;
    }
    return { smerti, vremya, proyden, vyhodov };
  }
}

// Участок уровня по x: для событий смерти и выхода, чтобы видеть, где бросают
export function uchastok(x: number, shirina: number, chastey = 6): number {
  const u = Math.floor((x / shirina) * chastey);
  return Math.max(0, Math.min(chastey - 1, u));
}
