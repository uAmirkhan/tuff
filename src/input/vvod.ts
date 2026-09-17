// Ввод: клавиатура, геймпад и тач превращаются в одно намерение на такт.
// Тач: стик в точке касания слева, ромб из четырёх кнопок справа, скольжение пальцем между
// кнопками, аккорд между двумя соседними, помощник касания (Вязкость у стены сама).
import type { Namerenie } from '../game/telo';

export type Knopka = 'vyazkost' | 'rasplav' | 'korka' | 'vybros';

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

  constructor(el: HTMLElement) {
    window.addEventListener('keydown', (e) => {
      this.klavishi.add(e.code);
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.klavishi.delete(e.code));
    el.addEventListener('pointerdown', (e) => this.vniz(e));
    el.addEventListener('pointermove', (e) => this.dvizh(e));
    el.addEventListener('pointerup', (e) => this.vverh(e));
    el.addEventListener('pointercancel', (e) => this.vverh(e));
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
    // аккорд: обе кнопки на расстоянии не дальше 1,1 r
    if (vtor && vtor.d < perv.r * 1.1 && perv.d < perv.r * 1.1) rez.push(vtor.k);
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

  private geympad(): { dx: number; dy: number; k: Set<Knopka> } | null {
    const pads =
      typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads?.[0];
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
    return { dx, dy, k };
  }

  // Собрать намерение на такт
  sobrat(): Namerenie {
    const k = this.klavishi;
    let dx = 0,
      dy = 0;
    if (k.has('KeyA') || k.has('ArrowLeft')) dx -= 1;
    if (k.has('KeyD') || k.has('ArrowRight')) dx += 1;
    if (k.has('KeyW') || k.has('ArrowUp')) dy += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) dy -= 1;
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
