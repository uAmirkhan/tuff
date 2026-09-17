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
      for (let pi = 0; pi < ur.dannye.poligony.length; pi++) {
        if (ur.slomany[pi]) continue;
        const p = ur.dannye.poligony[pi] as (typeof ur.dannye.poligony)[number];
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
    // тела: контур по частицам, материал по состоянию, свечение, глаза
    for (const t of tela) this.risovatTelo(t, alpha);
  }

  private risovatTelo(t: Telo, alpha: number): void {
    const g = this.g;
    const m = t.mir;
    const sost = t.sostoyanie;
    // цвета состояний из 01-koncepciya: обычное, вязкость, расплав, корка, выброс
    const zalivka =
      sost === 'korka'
        ? 0x6e5a4e
        : sost === 'rasplav'
          ? 0xffd166
          : sost === 'vyazkost'
            ? 0xb8321a
            : sost === 'vybros'
              ? 0xffb347
              : 0xe8642c;
    const svet = sost === 'korka' ? 0xff6a1a : 0xffa54d;
    const px: number[] = this.bufX,
      py: number[] = this.bufY;
    let cx = 0,
      cy = 0;
    for (let i = 0; i < t.n; i++) {
      const p = t.ot + i;
      const x = (m.px[p] as number) + ((m.x[p] as number) - (m.px[p] as number)) * alpha;
      const y = (m.py[p] as number) + ((m.y[p] as number) - (m.py[p] as number)) * alpha;
      px[i] = this.ekX(x);
      py[i] = this.ekY(y);
      cx += px[i] as number;
      cy += py[i] as number;
    }
    cx /= t.n;
    cy /= t.n;
    // свечение: увеличенный контур с прозрачностью
    const r = sost === 'korka' ? 1.08 : 1.22;
    for (let i = 0; i < t.n; i++) {
      const x = cx + ((px[i] as number) - cx) * r,
        y = cy + ((py[i] as number) - cy) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fill({ color: svet, alpha: sost === 'korka' ? 0.12 : 0.22 });
    // тело
    for (let i = 0; i < t.n; i++) {
      if (i === 0) g.moveTo(px[i] as number, py[i] as number);
      else g.lineTo(px[i] as number, py[i] as number);
    }
    g.closePath();
    g.fill({ color: zalivka });
    g.stroke({ width: 2, color: sost === 'korka' ? 0xff8a3a : 0xffd9a0, alpha: 0.7 });
    // трещины корки: светящиеся линии от центра к частям контура
    if (sost === 'korka' || sost === 'vybros') {
      for (let i = 0; i < t.n; i += 2) {
        g.moveTo(cx + ((px[i] as number) - cx) * 0.3, cy + ((py[i] as number) - cy) * 0.3);
        g.lineTo(cx + ((px[i] as number) - cx) * 0.9, cy + ((py[i] as number) - cy) * 0.9);
      }
      g.stroke({ width: 2, color: 0xffb347, alpha: sost === 'vybros' ? 0.9 : 0.55 });
    }
    // глаза: два огонька в верхней трети, смотрят по ходу движения
    const napr = t.napravlenie;
    const vysota = Math.min(...py.slice(0, t.n));
    const ey = cy + (vysota - cy) * 0.45;
    const raz = this.masshtab * 0.07;
    for (const k of [-1, 1]) {
      const ex = cx + k * this.masshtab * 0.16 + napr * this.masshtab * 0.08;
      g.circle(ex, ey, raz * 1.6);
      g.fill({ color: 0x2a1410, alpha: 0.85 });
      g.circle(ex + napr * raz * 0.5, ey, raz * 0.9);
      g.fill({ color: 0xfff1a8 });
    }
    // точки Вязкости
    for (let i = 0; i < t.n; i++) {
      const p = t.ot + i;
      if (m.vPoTochke[p] !== -1) {
        g.circle(px[i] as number, py[i] as number, 3);
        g.fill({ color: 0xff3b3b, alpha: 0.8 });
      }
    }
  }

  private readonly bufX: number[] = new Array(64).fill(0);
  private readonly bufY: number[] = new Array(64).fill(0);
}
