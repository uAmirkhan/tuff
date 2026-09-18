// Ввод: клавиатура, геймпад и тач превращаются в одно намерение на такт.
// Тач: стик в точке касания слева, ромб из четырёх кнопок справа, скольжение пальцем между
// кнопками, аккорд между двумя соседними, помощник касания (Вязкость у стены сама).
import type { Namerenie } from '../game/telo';

export type Knopka = 'vyazkost' | 'rasplav' | 'korka' | 'vybros';

/** Раскладка одного игрока: коды клавиш на каждое действие. */
export interface Raskladka {
  vlevo: string[];
  vpravo: string[];
  vverh: string[];
  vniz: string[];
  vyazkost: string[];
  rasplav: string[];
  korka: string[];
  vybros: string[];
  sliyanie: string[];
}

// В соло первый игрок берёт и WASD, и стрелки. В кооперативе стрелки уходят второму,
// иначе одна клавиша двигала бы обоих.
export const RASKLADKI: { pervyy: Raskladka; vtoroy: Raskladka } = {
  pervyy: {
    vlevo: ['KeyA'],
    vpravo: ['KeyD'],
    vverh: ['KeyW'],
    vniz: ['KeyS'],
    vyazkost: ['KeyJ', 'KeyZ'],
    rasplav: ['KeyK', 'KeyX'],
    korka: ['KeyL', 'KeyC'],
    vybros: ['Space', 'KeyV'],
    sliyanie: ['KeyF'],
  },
  vtoroy: {
    vlevo: ['ArrowLeft'],
    vpravo: ['ArrowRight'],
    vverh: ['ArrowUp'],
    vniz: ['ArrowDown'],
    vyazkost: ['Numpad1', 'Comma'],
    rasplav: ['Numpad2', 'Period'],
    korka: ['Numpad3', 'Slash'],
    vybros: ['Numpad0', 'ShiftRight'],
    sliyanie: ['Numpad5', 'KeyP'],
  },
};

export interface NastroykiVvoda {
  pomoshchnikKasaniya: boolean;
  raskladka: 'wasd' | 'strelki';
}

export class Vvod {
  private klavishi = new Set<string>();
  readonly nam: Namerenie = {
    dx: 0,
    dy: 0,
    vyazkost: false,
    rasplav: false,
    korka: false,
    vybros: false,
  };
  readonly nastroyki: NastroykiVvoda = { pomoshchnikKasaniya: false, raskladka: 'wasd' };
  private stikId = -1;
  private stikX0 = 0;
  private stikY0 = 0;
  private stikDx = 0;
  private stikDy = 0;
  // pointerId -> набор кнопок под пальцем (одна или две при аккорде)
  private readonly palcy = new Map<number, Knopka[]>();
  promahi = 0;
  nazhatiy = 0;
  // подсказка помощника: тело касается стены и стик направлен в неё; выставляет игра
  uStenyNapravlenie = 0;

  // Без DOM (тесты, headless-прогон) подписки просто не создаются, клавиши задаются вручную.
  constructor(el?: HTMLElement) {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        this.nazhat(e.code);
        if (e.code === 'Space') e.preventDefault();
      });
      window.addEventListener('keyup', (e) => this.otpustit(e.code));
    }
    if (!el) return;
    el.addEventListener('pointerdown', (e) => this.vniz(e));
    el.addEventListener('pointermove', (e) => this.dvizh(e));
    el.addEventListener('pointerup', (e) => this.vverh(e));
    el.addEventListener('pointercancel', (e) => this.vverh(e));
  }

  nazhat(kod: string): void {
    this.klavishi.add(kod);
  }

  otpustit(kod: string): void {
    this.klavishi.delete(kod);
  }

  // Ромб кнопок в правом нижнем углу. Радиус около 12 мм: 7% меньшей стороны, не меньше 34 px.
  geometriyaKnopok(): { x: number; y: number; r: number; k: Knopka }[] {
    const w = window.innerWidth,
      h = window.innerHeight;
    const r = Math.max(34, Math.min(w, h) * 0.07);
    const cx = w - r * 3.2,
      cy = h - r * 3.2;
    return [
      { x: cx, y: cy - r * 1.6, r, k: 'vyazkost' },
      { x: cx - r * 1.6, y: cy, r, k: 'korka' },
      { x: cx + r * 1.6, y: cy, r, k: 'rasplav' },
      { x: cx, y: cy + r * 1.6, r, k: 'vybros' },
    ];
  }

  // Кнопки под точкой: ближайшая в радиусе 1,25 r, плюс вторая, если палец между двумя (аккорд)
  knopkiPod(x: number, y: number): Knopka[] {
    const geo = this.geometriyaKnopok();
    const bliz: { k: Knopka; d: number; r: number }[] = [];
    for (const b of geo) {
      const d = Math.hypot(x - b.x, y - b.y);
      if (d < b.r * 1.25) bliz.push({ k: b.k, d, r: b.r });
    }
    bliz.sort((a, b) => a.d - b.d);
    if (bliz.length === 0) return [];
    const perv = bliz[0] as { k: Knopka; d: number; r: number };
    const rez: Knopka[] = [perv.k];
    const vtor = bliz[1];
    // аккорд: обе кнопки в радиусе захвата. Соседи ромба стоят на 2,26 r друг от друга,
    // середина между ними на 1,13 r от каждой: порог 1,1 r делал аккорд недостижимым (прогон 17.09)
    if (vtor && vtor.d < perv.r * 1.25 && perv.d < perv.r * 1.25) rez.push(vtor.k);
    return rez;
  }

  private vniz(e: PointerEvent): void {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.clientX < window.innerWidth / 2) {
      if (this.stikId === -1) {
        this.stikId = e.pointerId;
        this.stikX0 = e.clientX;
        this.stikY0 = e.clientY;
        this.stikDx = 0;
        this.stikDy = 0;
      }
      return;
    }
    const k = this.knopkiPod(e.clientX, e.clientY);
    this.nazhatiy++;
    if (k.length) this.palcy.set(e.pointerId, k);
    else this.promahi++;
  }

  private dvizh(e: PointerEvent): void {
    if (e.pointerId === this.stikId) {
      const r = Math.max(40, Math.min(window.innerWidth, window.innerHeight) * 0.09);
      let dx = (e.clientX - this.stikX0) / r,
        dy = -(e.clientY - this.stikY0) / r;
      const l = Math.hypot(dx, dy);
      if (l > 1) {
        dx /= l;
        dy /= l;
      }
      this.stikDx = Math.abs(dx) < 0.2 ? 0 : dx;
      this.stikDy = Math.abs(dy) < 0.2 ? 0 : dy;
      return;
    }
    if (this.palcy.has(e.pointerId)) {
      // скольжение пальцем: кнопка под пальцем активна, между кнопками держится прошлая
      const k = this.knopkiPod(e.clientX, e.clientY);
      if (k.length) this.palcy.set(e.pointerId, k);
    }
  }

  private vverh(e: PointerEvent): void {
    if (e.pointerId === this.stikId) {
      this.stikId = -1;
      this.stikDx = 0;
      this.stikDy = 0;
    }
    this.palcy.delete(e.pointerId);
  }

  get stik(): { aktiven: boolean; x0: number; y0: number } {
    return { aktiven: this.stikId !== -1, x0: this.stikX0, y0: this.stikY0 };
  }

  get tachAktiven(): boolean {
    return this.stikId !== -1 || this.palcy.size > 0;
  }

  private geympad(nomer = 0): { dx: number; dy: number; k: Set<Knopka>; slit: boolean } | null {
    const pads =
      typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads?.[nomer];
    if (!p) return null;
    const mz = (v: number) => (Math.abs(v) < 0.2 ? 0 : v);
    const k = new Set<Knopka>();
    const nazh = (i: number) => !!p.buttons[i]?.pressed;
    if (nazh(4) || nazh(6)) k.add('vyazkost'); // LB, LT
    if (nazh(5) || nazh(7)) k.add('rasplav'); // RB, RT
    if (nazh(1)) k.add('korka'); // B
    if (nazh(0)) k.add('vybros'); // A
    let dx = mz(p.axes[0] ?? 0),
      dy = -mz(p.axes[1] ?? 0);
    if (nazh(14)) dx = -1;
    if (nazh(15)) dx = 1;
    if (nazh(12)) dy = 1;
    if (nazh(13)) dy = -1;
    return { dx, dy, k, slit: nazh(2) }; // X на геймпаде: слияние
  }

  /** Кооператив: второй игрок получает стрелки и второй геймпад. */
  koop = false;
  private readonly namVtorogo: Namerenie = {
    dx: 0,
    dy: 0,
    vyazkost: false,
    rasplav: false,
    korka: false,
    vybros: false,
  };

  private nazhata(kody: string[]): boolean {
    for (const k of kody) if (this.klavishi.has(k)) return true;
    return false;
  }

  /** Держит ли игрок кнопку слияния: клавиатура или X на его геймпаде. */
  sliyanieNazhato(igrok: 0 | 1): boolean {
    const r = igrok === 0 ? RASKLADKI.pervyy : RASKLADKI.vtoroy;
    if (this.nazhata(r.sliyanie)) return true;
    return this.geympad(igrok)?.slit ?? false;
  }

  /** Намерение второго игрока. Тач и помощник касания ему не положены: он на клавиатуре или геймпаде. */
  sobratVtorogo(): Namerenie {
    const r = RASKLADKI.vtoroy;
    let dx = 0,
      dy = 0;
    if (this.nazhata(r.vlevo)) dx -= 1;
    if (this.nazhata(r.vpravo)) dx += 1;
    if (this.nazhata(r.vverh)) dy += 1;
    if (this.nazhata(r.vniz)) dy -= 1;
    const gp = this.geympad(1);
    const n = this.namVtorogo;
    if (gp && (gp.dx !== 0 || gp.dy !== 0)) {
      dx = gp.dx;
      dy = gp.dy;
    }
    n.dx = dx;
    n.dy = dy;
    n.vyazkost = this.nazhata(r.vyazkost) || !!gp?.k.has('vyazkost');
    n.rasplav = this.nazhata(r.rasplav) || !!gp?.k.has('rasplav');
    n.korka = this.nazhata(r.korka) || !!gp?.k.has('korka');
    n.vybros = this.nazhata(r.vybros) || !!gp?.k.has('vybros');
    return n;
  }

  // Собрать намерение на такт
  sobrat(): Namerenie {
    const k = this.klavishi;
    let dx = 0,
      dy = 0;
    const strelki = !this.koop; // в кооперативе стрелки принадлежат второму игроку
    if (k.has('KeyA') || (strelki && k.has('ArrowLeft'))) dx -= 1;
    if (k.has('KeyD') || (strelki && k.has('ArrowRight'))) dx += 1;
    if (k.has('KeyW') || (strelki && k.has('ArrowUp'))) dy += 1;
    if (k.has('KeyS') || (strelki && k.has('ArrowDown'))) dy -= 1;
    const t = new Set<Knopka>();
    for (const list of this.palcy.values()) for (const b of list) t.add(b);
    const gp = this.geympad();
    if (gp) {
      if (gp.dx !== 0 || gp.dy !== 0) {
        dx = gp.dx;
        dy = gp.dy;
      }
      for (const b of gp.k) t.add(b);
    }
    if (this.stikId !== -1) {
      dx = this.stikDx;
      dy = this.stikDy;
    }
    const n = this.nam;
    n.dx = dx;
    n.dy = dy;
    n.vyazkost = k.has('KeyJ') || k.has('KeyZ') || t.has('vyazkost');
    n.rasplav = k.has('KeyK') || k.has('KeyX') || t.has('rasplav');
    n.korka = k.has('KeyL') || k.has('KeyC') || t.has('korka');
    n.vybros = k.has('Space') || k.has('KeyV') || t.has('vybros');
    // помощник касания: у стены со стиком в стену Вязкость включается сама
    if (
      this.nastroyki.pomoshchnikKasaniya &&
      this.uStenyNapravlenie !== 0 &&
      Math.sign(dx) === this.uStenyNapravlenie &&
      !n.rasplav
    )
      n.vyazkost = true;
    return n;
  }
}
