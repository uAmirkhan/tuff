// Отрисовка мира в PixiJS: многоугольники уровня, объекты, контур тела по частицам.
import { Application, Graphics } from 'pixi.js';
import type { TroynoyKotyol } from '../game/boss';
import type { Telo } from '../game/telo';
import type { Vrag } from '../game/vrag';
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

  risovat(
    mir: Mir,
    tela: Telo[],
    alpha: number,
    ur: ZagruzhennyyUroven | null,
    vragi: Vrag[] = [],
    boss: TroynoyKotyol | null = null,
    prizrak: Telo | null = null,
  ): void {
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
            if (!s.aktivna) break;
            g.rect(this.ekX(s.x), this.ekY(s.y + s.h), s.w * this.masshtab, s.h * this.masshtab);
            g.fill({ color: 0xff7a1a, alpha: 0.85 });
            break;
          case 'kotyol': {
            const m = this.masshtab;
            const k = boss?.kotly[boss.sushchnosti.filter((q) => q.tip === 'kotyol').indexOf(s)];
            const zhiv = k ? k.zhiv : true;
            const otkryt = k ? k.otkryt : false;
            g.rect(x - 1.1 * m, y - 2.0 * m, 2.2 * m, 2.0 * m);
            g.fill({ color: zhiv ? 0x3b2f2a : 0x2a2422 });
            g.stroke({ width: 3, color: zhiv ? 0x8a6a4a : 0x555555 });
            g.rect(x - 0.7 * m, y - 2.1 * m, 1.4 * m, 0.25 * m);
            g.fill({ color: otkryt ? 0xff7a1a : zhiv ? 0x6a5a4a : 0x333333 });
            if (!otkryt && zhiv) {
              g.rect(x - 0.9 * m, y - 2.3 * m, 1.8 * m, 0.2 * m);
              g.fill({ color: 0x9a8a7a });
            }
            if (otkryt) {
              g.circle(x, y - 2.5 * m, 0.3 * m);
              g.fill({ color: 0xffd23f, alpha: 0.8 });
            }
            break;
          }
          case 'obval': {
            // поднимающийся обвал: столб от низа уровня до текущего верха
            const niz = ur.dannye.granicy.minY - 2;
            g.rect(
              this.ekX(s.x),
              this.ekY(s.verh),
              s.w * this.masshtab,
              (s.verh - niz) * this.masshtab,
            );
            g.fill({ color: 0xff5a1a, alpha: 0.9 });
            g.rect(this.ekX(s.x), this.ekY(s.verh), s.w * this.masshtab, 0.25 * this.masshtab);
            g.fill({ color: 0xffd23f, alpha: 0.95 });
            break;
          }
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
          case 'cep': {
            // звенья: кружки, связи: линии между соседями, если живы
            for (let i = 0; i < s.svyazi.length; i++) {
              const sv = s.svyazi[i] as number;
              if (!mir.sZhiva[sv]) continue;
              const a = mir.sA[sv] as number,
                b = mir.sB[sv] as number;
              g.moveTo(this.ekX(mir.x[a] as number), this.ekY(mir.y[a] as number));
              g.lineTo(this.ekX(mir.x[b] as number), this.ekY(mir.y[b] as number));
              g.stroke({ width: 3, color: 0x9a8a7a });
            }
            for (const q of s.zvenya) {
              g.circle(
                this.ekX(mir.x[q] as number),
                this.ekY(mir.y[q] as number),
                0.11 * this.masshtab,
              );
              g.fill({ color: 0x7a6a5a });
            }
            break;
          }
          case 'gorn': {
            // горн: каменная арка с огнём внутри, когда активен
            const m = this.masshtab;
            g.rect(x - 0.45 * m, y - 0.6 * m, 0.9 * m, 0.6 * m);
            g.fill({ color: 0x3a2c26 });
            g.rect(x - 0.45 * m, y - 0.75 * m, 0.9 * m, 0.15 * m);
            g.fill({ color: 0x5a4438 });
            g.rect(x - 0.28 * m, y - 0.5 * m, 0.56 * m, 0.5 * m);
            g.fill({ color: s.aktivna ? 0xff7a1a : 0x1a1210 });
            if (s.aktivna) {
              const t = (performance.now() / 120) % 6.28;
              const kach = t < 3.14 ? t / 3.14 : (6.28 - t) / 3.14;
              g.moveTo(x - 0.2 * m, y - 0.02 * m);
              g.lineTo(x, y - (0.55 + 0.15 * kach) * m);
              g.lineTo(x + 0.2 * m, y - 0.02 * m);
              g.closePath();
              g.fill({ color: 0xffd23f, alpha: 0.9 });
            }
            break;
          }
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
    // враги: холодные серо-синие, глаза по ходу
    for (const v of vragi) {
      if (!v.zhiv) continue;
      const m = v.mir;
      for (let i = 0; i < v.n; i++) {
        const p = v.ot + i;
        const x = (m.px[p] as number) + ((m.x[p] as number) - (m.px[p] as number)) * alpha;
        const y = (m.py[p] as number) + ((m.y[p] as number) - (m.py[p] as number)) * alpha;
        if (i === 0) g.moveTo(this.ekX(x), this.ekY(y));
        else g.lineTo(this.ekX(x), this.ekY(y));
      }
      g.closePath();
      g.fill({ color: v.tip === 'iskropryg' ? 0x5a7a9a : 0x4a5a6a });
      g.stroke({ width: 2, color: 0x9fc4e0, alpha: 0.7 });
      v.schitatCentr();
      const ex = this.ekX(v.cx) + v.napravlenie * this.masshtab * 0.12;
      const ey = this.ekY(v.cy) - this.masshtab * 0.05;
      g.circle(ex - 5, ey, 3);
      g.circle(ex + 5, ey, 3);
      g.fill({ color: 0xdff4ff });
    }
    // призрак лучшей попытки: полупрозрачный контур
    if (prizrak) {
      const m = prizrak.mir;
      for (let i = 0; i < prizrak.n; i++) {
        const p = prizrak.ot + i;
        if (i === 0) g.moveTo(this.ekX(m.x[p] as number), this.ekY(m.y[p] as number));
        else g.lineTo(this.ekX(m.x[p] as number), this.ekY(m.y[p] as number));
      }
      g.closePath();
      g.fill({ color: 0xffd9a0, alpha: 0.22 });
      g.stroke({ width: 2, color: 0xffd9a0, alpha: 0.5 });
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
