// Отрисовка мира в PixiJS: контур тела по частицам, отрезки уровня. Заглушка спайка.
import { Application, Graphics } from 'pixi.js';
import type { Telo } from '../game/telo';
import type { Mir } from '../physics/mir';

export class Stsena {
  readonly app = new Application();
  readonly g = new Graphics();
  masshtab = 60; // пикселей на единицу
  kamX = 0;
  kamY = 2;

  async init(): Promise<void> {
    await this.app.init({ background: '#1a1418', resizeTo: window, antialias: true });
    document.body.appendChild(this.app.canvas);
    this.app.stage.addChild(this.g);
  }

  private ekX(x: number): number {
    return this.app.screen.width / 2 + (x - this.kamX) * this.masshtab;
  }
  private ekY(y: number): number {
    return this.app.screen.height / 2 - (y - this.kamY) * this.masshtab;
  }

  risovat(mir: Mir, tela: Telo[], alpha: number): void {
    const g = this.g;
    g.clear();
    // отрезки
    for (let o = 0; o < mir.k; o++) {
      if (!mir.oZhiv[o]) continue;
      g.moveTo(this.ekX(mir.oX1[o] as number), this.ekY(mir.oY1[o] as number));
      g.lineTo(this.ekX(mir.oX2[o] as number), this.ekY(mir.oY2[o] as number));
      g.stroke({ width: 3, color: mir.oSherohovat[o] ? 0x6b5a4a : 0x8fb3c9 });
    }
    // тела
    for (const t of tela) {
      const m = t.mir;
      const tsvet = t.vKorke ? 0x7a6656 : t.vVybrose ? 0xffb347 : 0xe8642c;
      for (let i = 0; i < t.n; i++) {
        const p = t.ot + i;
        const x = (m.px[p] as number) + ((m.x[p] as number) - (m.px[p] as number)) * alpha;
        const y = (m.py[p] as number) + ((m.y[p] as number) - (m.py[p] as number)) * alpha;
        if (i === 0) g.moveTo(this.ekX(x), this.ekY(y));
        else g.lineTo(this.ekX(x), this.ekY(y));
      }
      g.closePath();
      g.fill({ color: tsvet });
      g.stroke({ width: 2, color: 0xffd9a0, alpha: 0.6 });
      // связи Вязкости
      for (let i = 0; i < t.n; i++) {
        const p = t.ot + i;
        if (m.vPoTochke[p] !== -1) {
          g.circle(this.ekX(m.x[p] as number), this.ekY(m.y[p] as number), 3);
          g.fill({ color: 0xff3b3b });
        }
      }
    }
  }
}
