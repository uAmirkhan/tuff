// Ввод: клавиатура и тач превращаются в одно намерение на такт.
import type { Namerenie } from '../game/telo';

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
  // тач: стик слева, четыре кнопки справа
  private stikId = -1;
  private stikX0 = 0;
  private stikY0 = 0;
  private stikDx = 0;
  private stikDy = 0;
  readonly knopki = new Map<number, keyof Namerenie>(); // pointerId -> кнопка
  promahi = 0;
  nazhatiy = 0;

  constructor(private readonly el: HTMLElement) {
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

  // Ромб кнопок в правом нижнем углу. Возвращает кнопку под точкой или null.
  knopkaPod(x: number, y: number): keyof Namerenie | null {
    const w = window.innerWidth,
      h = window.innerHeight;
    const r = Math.max(34, Math.min(w, h) * 0.07); // радиус кнопки, около 12 мм
    const cx = w - r * 3.2,
      cy = h - r * 3.2;
    const tsentry: [number, number, keyof Namerenie][] = [
      [cx, cy - r * 1.6, 'vyazkost'],
      [cx - r * 1.6, cy, 'korka'],
      [cx + r * 1.6, cy, 'rasplav'],
      [cx, cy + r * 1.6, 'vybros'],
    ];
    let luchshe: keyof Namerenie | null = null,
      dmin = Infinity;
    for (const [kx, ky, k] of tsentry) {
      const d = Math.hypot(x - kx, y - ky);
      if (d < r * 1.25 && d < dmin) {
        dmin = d;
        luchshe = k;
      }
    }
    return luchshe;
  }

  geometriyaKnopok(): { x: number; y: number; r: number; k: keyof Namerenie }[] {
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
    const k = this.knopkaPod(e.clientX, e.clientY);
    this.nazhatiy++;
    if (k) this.knopki.set(e.pointerId, k);
    else this.promahi++;
  }

  private dvizh(e: PointerEvent): void {
    if (e.pointerId === this.stikId) {
      const r = 48;
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
    if (this.knopki.has(e.pointerId)) {
      const k = this.knopkaPod(e.clientX, e.clientY);
      if (k) this.knopki.set(e.pointerId, k);
    }
  }

  private vverh(e: PointerEvent): void {
    if (e.pointerId === this.stikId) {
      this.stikId = -1;
      this.stikDx = 0;
      this.stikDy = 0;
    }
    this.knopki.delete(e.pointerId);
  }

  get stik(): { aktiven: boolean; x0: number; y0: number } {
    return { aktiven: this.stikId !== -1, x0: this.stikX0, y0: this.stikY0 };
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
    if (this.stikId !== -1) {
      dx = this.stikDx;
      dy = this.stikDy;
    }
    const n = this.nam;
    n.dx = dx;
    n.dy = dy;
    const t = new Set(this.knopki.values());
    n.vyazkost = k.has('KeyJ') || k.has('KeyZ') || t.has('vyazkost');
    n.rasplav = k.has('KeyK') || k.has('KeyX') || t.has('rasplav');
    n.korka = k.has('KeyL') || k.has('KeyC') || t.has('korka');
    n.vybros = k.has('Space') || k.has('KeyV') || t.has('vybros');
    return n;
  }
}
