// Отрисовка мира в PixiJS: многоугольники уровня, объекты, контур тела по частицам.
import { Application, Graphics } from 'pixi.js';
import type { Telo } from '../game/telo';
import type { Uroven } from '../level/format';
import type { ZagruzhennyyUroven } from '../level/zagruzka';
import type { Mir } from '../physics/mir';

const TSVET_MATERIALA: Record<string, number> = {
  bazalt: 0x4a3a34,
  lyod: 0x8fb3c9,
  hrupkiy: 0x6b4a3a,
  metall: 0x5a5a66,
};

export class Stsena {
  readonly app = new Application();
  readonly fon = new Graphics();
  readonly g = new Graphics();
  masshtab = 60; // пикселей на единицу
  kamX = 0;
  kamY = 2;

  async init(): Promise<void> {
    await this.app.init({ background: '#1a1418', resizeTo: window, antialias: true });
    document.body.appendChild(this.app.canvas);
    this.app.stage.addChild(this.fon);
    this.app.stage.addChild(this.g);
    this.masshtab = Math.max(40, Math.min(70, this.app.screen.height / 9));
  }

  private ekX(x: number): number {
    return this.app.screen.width / 2 + (x - this.kamX) * this.masshtab;
  }
  private ekY(y: number): number {
    return this.app.screen.height / 2 - (y - this.kamY) * this.masshtab;
  }

  // Камера: следит за центром с опережением, не выходит за границы уровня
  sledit(cx: number, cy: number, gr: Uroven['granicy'] | null): void {
    const celX = cx;
    const celY = cy + 1;
    this.kamX += (celX - this.kamX) * 0.1;
    this.kamY += (celY - this.kamY) * 0.1;
    if (gr) {
      const polW = this.app.screen.width / 2 / this.masshtab;
      const polH = this.app.screen.height / 2 / this.masshtab;
      this.kamX = Math.max(gr.minX + polW, Math.min(gr.maxX - polW, this.kamX));
      this.kamY = Math.max(gr.minY + polH, Math.min(gr.maxY - polH, this.kamY));
    }
  }

  risovat(mir: Mir, tela: Telo[], alpha: number, ur: ZagruzhennyyUroven | null): void {
    const g = this.g;
    g.clear();
    // многоугольники уровня
    if (ur) {
      for (const p of ur.dannye.poligony) {
        const t = p.tochki;
        g.moveTo(this.ekX(t[0]?.[0] ?? 0), this.ekY(t[0]?.[1] ?? 0));
        for (let i = 1; i < t.length; i++)
          g.lineTo(this.ekX(t[i]?.[0] ?? 0), this.ekY(t[i]?.[1] ?? 0));
        g.closePath();
        g.fill({ color: TSVET_MATERIALA[p.material ?? 'bazalt'] ?? 0x4a3a34 });
      }
      // объекты
      for (const s of ur.sushchnosti) {
        const x = this.ekX(s.x),
          y = this.ekY(s.y);
        switch (s.tip) {
          case 'lava':
            g.rect(this.ekX(s.x), this.ekY(s.y + s.h), s.w * this.masshtab, s.h * this.masshtab);
            g.fill({ color: 0xff7a1a, alpha: 0.85 });
            break;
          case 'voda':
            g.rect(this.ekX(s.x), this.ekY(s.y + s.h), s.w * this.masshtab, s.h * this.masshtab);
            g.fill({ color: 0x2f7f9f, alpha: 0.6 });
            break;
          case 'ship':
            g.rect(this.ekX(s.x), this.ekY(s.y + s.h), s.w * this.masshtab, s.h * this.masshtab);
            g.fill({ color: 0xbfd8e6, alpha: 0.7 });
            break;
          case 'zaslonka':
            if (!s.aktivna) {
              g.rect(this.ekX(s.x), this.ekY(s.y + s.h), s.w * this.masshtab, s.h * this.masshtab);
              g.fill({ color: 0x8a8a99 });
            }
            break;
          case 'gorn':
            g.circle(x, y, 0.35 * this.masshtab);
            g.fill({ color: s.aktivna ? 0xffc14d : 0x6b5a4a });
            break;
          case 'vyhod':
            g.circle(x, y, 0.5 * this.masshtab);
            g.stroke({ width: 3, color: 0xfff1a8 });
            break;
          case 'zharkamen':
          case 'zharkamenSredniy':
          case 'serdce':
          case 'ugolek':
            if (!s.sobrana) {
              const r = s.tip === 'serdce' ? 0.3 : s.tip === 'zharkamenSredniy' ? 0.2 : 0.14;
              g.circle(x, y, r * this.masshtab);
              g.fill({
                color: s.tip === 'ugolek' ? 0xff4d1a : s.tip === 'serdce' ? 0xff3366 : 0xffd23f,
              });
            }
            break;
          case 'plita':
            g.rect(
              x - 0.5 * this.masshtab,
              y - 0.1 * this.masshtab,
              this.masshtab,
              0.1 * this.masshtab,
            );
            g.fill({ color: s.aktivna ? 0xffc14d : 0x9a8a7a });
            break;
          case 'rychag':
            g.rect(
              x - 0.05 * this.masshtab,
              y - 0.5 * this.masshtab,
              0.1 * this.masshtab,
              0.5 * this.masshtab,
            );
            g.fill({ color: s.aktivna ? 0xffc14d : 0x9a8a7a });
            break;
          default:
            break;
        }
      }
    } else {
      for (let o = 0; o < mir.k; o++) {
        if (!mir.oZhiv[o]) continue;
        g.moveTo(this.ekX(mir.oX1[o] as number), this.ekY(mir.oY1[o] as number));
        g.lineTo(this.ekX(mir.oX2[o] as number), this.ekY(mir.oY2[o] as number));
        g.stroke({ width: 3, color: mir.oSherohovat[o] ? 0x6b5a4a : 0x8fb3c9 });
      }
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
