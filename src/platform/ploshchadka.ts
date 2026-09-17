// Адаптер площадок: Яндекс Игры, CrazyGames, пусто (разработка и Poki без рекламы).
// Правила: реклама только из пауз игры, симуляция и звук стоят во время ролика,
// сохранение через площадку с дублем в localStorage, язык от площадки.
// Имена методов SDK по документации площадок (issledovanie/05), всё через optional chaining:
// отсутствие метода не роняет игру.

export type ImyaPloshchadki = 'pusto' | 'yandex' | 'crazygames';

export interface Ploshchadka {
  imya: ImyaPloshchadki;
  gotova(): Promise<void>; // SDK загружен и инициализирован
  igraGotova(): void; // загрузка закончена, можно показывать
  geympleyStart(): void;
  geympleyStop(): void;
  yazyk(): string; // 'ru', 'en' и т.д.
  // полноэкранная реклама: обещание завершается, когда ролик закрыт или не показан
  reklama(): Promise<void>;
  // реклама за вознаграждение: true, если досмотрена
  nagrada(): Promise<boolean>;
  sohranit(dannye: string): Promise<void>;
  zagruzit(): Promise<string | null>;
  rekord(tablitsa: string, znachenie: number): Promise<void>;
  onPauza(cb: (pauza: boolean) => void): void;
}

type YaSdk = {
  features?: { LoadingAPI?: { ready(): void }; GameplayAPI?: { start(): void; stop(): void } };
  adv?: {
    showFullscreenAdv(o: {
      callbacks: { onClose?: (b: boolean) => void; onError?: (e: unknown) => void };
    }): void;
    showRewardedVideoAdv(o: {
      callbacks: { onRewarded?: () => void; onClose?: () => void; onError?: (e: unknown) => void };
    }): void;
  };
  environment?: { i18n?: { lang?: string } };
  getPlayer?(o: { scopes: boolean }): Promise<{
    setData(d: Record<string, unknown>, flush?: boolean): Promise<void>;
    getData(): Promise<Record<string, unknown>>;
  }>;
  leaderboards?: { setScore(n: string, v: number): Promise<void> };
  getLeaderboards?(): Promise<{ setLeaderboardScore(n: string, v: number): Promise<void> }>;
  on?(s: string, cb: () => void): void;
};

declare global {
  interface Window {
    YaGames?: { init(): Promise<YaSdk> };
    CrazyGames?: { SDK: CrazySdk };
  }
}

type CrazySdk = {
  init(): Promise<void>;
  game: {
    gameplayStart(): void;
    gameplayStop(): void;
    loadingStart?(): void;
    loadingStop?(): void;
  };
  ad: {
    requestAd(
      tip: 'midgame' | 'rewarded',
      cb: { adFinished?: () => void; adError?: (e: unknown) => void; adStarted?: () => void },
    ): void;
  };
  data?: { setItem(k: string, v: string): void; getItem(k: string): string | null };
};

function skript(url: string): Promise<void> {
  return new Promise((ok, net) => {
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.onload = () => ok();
    s.onerror = () => net(new Error(`не загрузился ${url}`));
    document.head.appendChild(s);
  });
}

export class Pusto implements Ploshchadka {
  imya: ImyaPloshchadki = 'pusto';
  async gotova(): Promise<void> {}
  igraGotova(): void {}
  geympleyStart(): void {}
  geympleyStop(): void {}
  yazyk(): string {
    return (navigator.language || 'ru').slice(0, 2).toLowerCase();
  }
  async reklama(): Promise<void> {}
  async nagrada(): Promise<boolean> {
    return true;
  }
  async sohranit(): Promise<void> {}
  async zagruzit(): Promise<string | null> {
    return null;
  }
  async rekord(): Promise<void> {}
  onPauza(): void {}
}

export class Yandex implements Ploshchadka {
  imya: ImyaPloshchadki = 'yandex';
  private sdk: YaSdk | null = null;
  private pauzaCb: ((p: boolean) => void) | null = null;
  private poslednyayaReklama = 0;
  async gotova(): Promise<void> {
    if (!window.YaGames)
      await skript('/sdk.js').catch(() => skript('https://sdk.games.s3.yandex.net/sdk.js'));
    if (!window.YaGames) throw new Error('YaGames недоступен');
    this.sdk = await window.YaGames.init();
    this.sdk.on?.('game_api_pause', () => this.pauzaCb?.(true));
    this.sdk.on?.('game_api_resume', () => this.pauzaCb?.(false));
  }
  igraGotova(): void {
    this.sdk?.features?.LoadingAPI?.ready();
  }
  geympleyStart(): void {
    this.sdk?.features?.GameplayAPI?.start();
  }
  geympleyStop(): void {
    this.sdk?.features?.GameplayAPI?.stop();
  }
  yazyk(): string {
    return this.sdk?.environment?.i18n?.lang ?? 'ru';
  }
  reklama(): Promise<void> {
    // не чаще раза в 3 минуты, правило из 08-vypusk-i-dengi
    const now = Date.now();
    if (!this.sdk?.adv || now - this.poslednyayaReklama < 180_000) return Promise.resolve();
    this.poslednyayaReklama = now;
    return new Promise((ok) => {
      this.pauzaCb?.(true);
      this.sdk?.adv?.showFullscreenAdv({
        callbacks: {
          onClose: () => {
            this.pauzaCb?.(false);
            ok();
          },
          onError: () => {
            this.pauzaCb?.(false);
            ok();
          },
        },
      });
    });
  }
  nagrada(): Promise<boolean> {
    if (!this.sdk?.adv) return Promise.resolve(false);
    return new Promise((ok) => {
      let dano = false;
      this.pauzaCb?.(true);
      this.sdk?.adv?.showRewardedVideoAdv({
        callbacks: {
          onRewarded: () => {
            dano = true;
          },
          onClose: () => {
            this.pauzaCb?.(false);
            ok(dano);
          },
          onError: () => {
            this.pauzaCb?.(false);
            ok(false);
          },
        },
      });
    });
  }
  async sohranit(dannye: string): Promise<void> {
    const p = await this.sdk?.getPlayer?.({ scopes: false }).catch(() => null);
    await p?.setData({ tuff: dannye }, true).catch(() => undefined);
  }
  async zagruzit(): Promise<string | null> {
    const p = await this.sdk?.getPlayer?.({ scopes: false }).catch(() => null);
    const d = await p?.getData().catch(() => null);
    const v = d?.tuff;
    return typeof v === 'string' ? v : null;
  }
  async rekord(tablitsa: string, znachenie: number): Promise<void> {
    if (this.sdk?.leaderboards) {
      await this.sdk.leaderboards.setScore(tablitsa, znachenie).catch(() => undefined);
      return;
    }
    const lb = await this.sdk?.getLeaderboards?.().catch(() => null);
    await lb?.setLeaderboardScore(tablitsa, znachenie).catch(() => undefined);
  }
  onPauza(cb: (pauza: boolean) => void): void {
    this.pauzaCb = cb;
  }
}

export class CrazyGames implements Ploshchadka {
  imya: ImyaPloshchadki = 'crazygames';
  private sdk: CrazySdk | null = null;
  private pauzaCb: ((p: boolean) => void) | null = null;
  async gotova(): Promise<void> {
    if (!window.CrazyGames) await skript('https://sdk.crazygames.com/crazygames-sdk-v3.js');
    if (!window.CrazyGames) throw new Error('CrazyGames SDK недоступен');
    this.sdk = window.CrazyGames.SDK;
    await this.sdk.init();
  }
  igraGotova(): void {
    this.sdk?.game.loadingStop?.();
  }
  geympleyStart(): void {
    this.sdk?.game.gameplayStart();
  }
  geympleyStop(): void {
    this.sdk?.game.gameplayStop();
  }
  yazyk(): string {
    return (navigator.language || 'en').slice(0, 2).toLowerCase();
  }
  reklama(): Promise<void> {
    // в Basic Launch реклама отключена площадкой; вызов безопасен
    if (!this.sdk) return Promise.resolve();
    return new Promise((ok) => {
      this.pauzaCb?.(true);
      const konec = () => {
        this.pauzaCb?.(false);
        ok();
      };
      this.sdk?.ad.requestAd('midgame', { adFinished: konec, adError: konec });
    });
  }
  nagrada(): Promise<boolean> {
    if (!this.sdk) return Promise.resolve(false);
    return new Promise((ok) => {
      this.pauzaCb?.(true);
      this.sdk?.ad.requestAd('rewarded', {
        adFinished: () => {
          this.pauzaCb?.(false);
          ok(true);
        },
        adError: () => {
          this.pauzaCb?.(false);
          ok(false);
        },
      });
    });
  }
  async sohranit(dannye: string): Promise<void> {
    this.sdk?.data?.setItem('tuff', dannye);
  }
  async zagruzit(): Promise<string | null> {
    return this.sdk?.data?.getItem('tuff') ?? null;
  }
  async rekord(): Promise<void> {}
  onPauza(cb: (pauza: boolean) => void): void {
    this.pauzaCb = cb;
  }
}

// Выбор площадки: параметр ?ploshchadka=, иначе по хосту, иначе пусто
export function vybratPloshchadku(param: string | null, host: string): Ploshchadka {
  const p =
    param ??
    (host.includes('yandex') ? 'yandex' : host.includes('crazygames') ? 'crazygames' : 'pusto');
  if (p === 'yandex') return new Yandex();
  if (p === 'crazygames') return new CrazyGames();
  return new Pusto();
}
