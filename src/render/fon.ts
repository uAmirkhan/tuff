// Фон мира 1 «Ядро»: три слоя параллакса, нарисованные кодом по палитре 05-art-i-zvuk
// (тёмно-бордовый фон, светящиеся реки, чёрно-красный базальт). Без картинок: сборка лёгкая,
// палитра одна на всё. Детерминированный шум с зерном.
import { Container, Graphics } from 'pixi.js';

function rnd(zerno: number): () => number {
  let s = zerno;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export class Fon {
  readonly konteyner = new Container();
  private readonly dalniy = new Graphics();
  private readonly sredniy = new Graphics();
  private readonly blizhniy = new Graphics();
  private shirina = 0;
  private vysota = 0;

  constructor() {
    this.konteyner.addChild(this.dalniy, this.sredniy, this.blizhniy);
  }

  // Слои рисуются один раз под размер экрана; параллакс двигает их долей смещения камеры
  postroit(w: number, h: number): void {
    if (w === this.shirina && h === this.vysota) return;
    this.shirina = w;
    this.vysota = h;
    const r = rnd(7);
    // дальний: градиент бордового к почти чёрному сверху, полосами
    const d = this.dalniy;
    d.clear();
    const polos = 24;
    for (let i = 0; i < polos; i++) {
      const t = i / polos;
      const cvet = smes(0x1a0f12, 0x3a1418, 1 - t);
      d.rect(-w, (t * h * 2 - h) | 0, w * 3, Math.ceil((h * 2) / polos) + 1);
      d.fill({ color: cvet });
    }
    // дальние жилы лавы: тонкие ломаные со свечением
    for (let k = 0; k < 6; k++) {
      let x = -w + r() * 3 * w;
      let y = h * 0.4 + r() * h;
      d.moveTo(x, y);
      for (let i = 0; i < 12; i++) {
        x += 40 + r() * 80;
        y += (r() - 0.5) * 60;
        d.lineTo(x, y);
      }
      d.stroke({ width: 6, color: 0xff5a1a, alpha: 0.12 });
      d.stroke({ width: 2, color: 0xff8c3a, alpha: 0.35 });
    }
    // средний: тёмные глыбы базальта
    const s = this.sredniy;
    s.clear();
    for (let k = 0; k < 28; k++) {
      const cx = -w + r() * 3 * w;
      const cy = -h + r() * 3 * h;
      const rad = 30 + r() * 90;
      const n = 6 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const rr = rad * (0.7 + r() * 0.5);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr * 0.7;
        if (i === 0) s.moveTo(x, y);
        else s.lineTo(x, y);
      }
      s.closePath();
      s.fill({ color: 0x241416, alpha: 0.9 });
    }
    // ближний: искры и пузыри жара
    const b = this.blizhniy;
    b.clear();
    for (let k = 0; k < 60; k++) {
      const x = -w + r() * 3 * w;
      const y = -h + r() * 3 * h;
      b.circle(x, y, 1 + r() * 2.5);
      b.fill({ color: 0xffb347, alpha: 0.15 + r() * 0.25 });
    }
  }

  // kamX, kamY в единицах мира; masshtab пикселей на единицу
  obnovit(kamX: number, kamY: number, masshtab: number): void {
    const px = kamX * masshtab;
    const py = -kamY * masshtab;
    this.dalniy.position.set(-(px * 0.08) % this.shirina, -(py * 0.05) % this.vysota);
    this.sredniy.position.set(-(px * 0.25) % this.shirina, -(py * 0.2) % this.vysota);
    this.blizhniy.position.set(-(px * 0.5) % this.shirina, -(py * 0.4) % this.vysota);
  }
}

function smes(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255,
    ag = (a >> 8) & 255,
    ab = a & 255;
  const br = (b >> 16) & 255,
    bg = (b >> 8) & 255,
    bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}
