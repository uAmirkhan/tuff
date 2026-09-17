// Состояние прохождения уровня: жар, чекпоинты, собираемое, зоны, выход. Без рендера.
import type { Sushchnost, ZagruzhennyyUroven } from '../level/zagruzka';
import type { Mir } from '../physics/mir';
import { ZHAR } from './config/zhar';
import type { Namerenie, Telo } from './telo';

export type Sobytie =
  | { tip: 'sobrano'; chto: Sushchnost['tip']; ochki: number }
  | { tip: 'gorn'; id: string }
  | { tip: 'smert'; prichina: string }
  | { tip: 'vozrozhdenie' }
  | { tip: 'vyhod'; takty: number; ochki: number; serdca: number }
  | { tip: 'zaslonka'; id: string; otkryta: boolean };

export class Igra {
  zhar: number = ZHAR.maks;
  ochki = 0;
  serdca = 0;
  takty = 0;
  smerti = 0;
  gotovo = false;
  chekpoint: [number, number];
  readonly sobytiya: Sobytie[] = [];
  korkaSredy = false;
  private korkaDo = 0;

  constructor(
    readonly mir: Mir,
    readonly telo: Telo,
    readonly ur: ZagruzhennyyUroven,
  ) {
    this.chekpoint = [ur.dannye.start[0], ur.dannye.start[1]];
  }

  // Вызывать после mir.shag() и telo.posle()
  takt(nam: Namerenie): void {
    if (this.gotovo) return;
    this.takty++;
    this.sobytiya.length = 0;
    this.telo.schitatCentr();
    const cx = this.telo.cx,
      cy = this.telo.cy;
    const g = this.telo.gabarity();
    // Среда
    let vLave = false,
      vShipah = false,
      vVode = false;
    for (const s of this.ur.sushchnosti) {
      if (s.tip !== 'lava' && s.tip !== 'ship' && s.tip !== 'voda') continue;
      if (g.maxX > s.x && g.minX < s.x + s.w && g.maxY > s.y && g.minY < s.y + s.h) {
        if (s.tip === 'lava') vLave = true;
        else if (s.tip === 'ship') vShipah = true;
        else vVode = true;
      }
    }
    if (vLave) {
      this.zhar = Math.min(ZHAR.maks, this.zhar + ZHAR.lechenieLavy);
      this.korkaDo = 0;
    }
    if (vShipah) this.zhar -= ZHAR.uronShipov;
    if (vVode) {
      this.zhar -= ZHAR.uronVody;
      this.korkaDo = this.takty + ZHAR.korkaPosleVody;
    }
    this.korkaSredy = this.takty < this.korkaDo;
    // Собираемое, горны, выход: по расстоянию до центра
    for (const s of this.ur.sushchnosti) {
      const d = Math.hypot(s.x - cx, s.y - cy);
      switch (s.tip) {
        case 'zharkamen':
        case 'zharkamenSredniy':
        case 'serdce':
        case 'ugolek':
          if (!s.sobrana && d < ZHAR.radiusSbora) {
            s.sobrana = true;
            const o = ZHAR.ochki[s.tip];
            this.ochki += o;
            if (s.tip === 'serdce') this.serdca++;
            if (s.tip === 'ugolek') this.zhar = Math.min(ZHAR.maks, this.zhar + ZHAR.ugolek);
            this.sobytiya.push({ tip: 'sobrano', chto: s.tip, ochki: o });
          }
          break;
        case 'gorn':
          if (!s.aktivna && d < ZHAR.radiusGorna) {
            for (const g2 of this.ur.sushchnosti) if (g2.tip === 'gorn') g2.aktivna = false;
            s.aktivna = true;
            this.chekpoint = [s.x, s.y + 0.6];
            this.sobytiya.push({ tip: 'gorn', id: s.id });
          }
          break;
        case 'vyhod':
          if (d < ZHAR.radiusVyhoda) {
            this.gotovo = true;
            this.sobytiya.push({
              tip: 'vyhod',
              takty: this.takty,
              ochki: this.ochki,
              serdca: this.serdca,
            });
          }
          break;
        case 'plita': {
          const nazhata =
            g.maxX > s.x - 0.5 && g.minX < s.x + 0.5 && g.minY < s.y + 0.3 && g.maxY > s.y;
          const godna = nazhata && (!s.nuzhnaKorka || this.telo.vKorke);
          if (godna !== s.aktivna) {
            s.aktivna = godna;
            this.pereklyuchit(s.cel, godna);
          }
          break;
        }
        case 'rychag':
          if (!s.aktivna && d < 0.8) {
            s.aktivna = true;
            this.pereklyuchit(s.cel, true);
          }
          break;
        default:
          break;
      }
    }
    // Падение за границы уровня
    const gr = this.ur.dannye.granicy;
    if (cy < gr.minY - 2 || cx < gr.minX - 5 || cx > gr.maxX + 5) this.umeret('падение');
    if (this.zhar <= 0) this.umeret(vVode ? 'вода' : 'шипы');
    // сторожа тела
    if (this.telo.ploshchad() < 0) this.telo.vosstanovit(cx, cy, 'выворачивание');
  }

  private pereklyuchit(id: string, otkryt: boolean): void {
    const z = this.ur.sushchnosti.find((s) => s.id === id);
    if (!z) return;
    if (z.tip === 'zaslonka') {
      if (otkryt) for (const o of z.otrezki) this.mir.ubratOtrezok(o);
      else for (const o of z.otrezki) this.mir.oZhiv[o] = 1;
      this.mir.setkaGryaznaya = true;
      z.aktivna = otkryt;
      this.sobytiya.push({ tip: 'zaslonka', id, otkryta: otkryt });
    }
  }

  umeret(prichina: string): void {
    this.smerti++;
    this.sobytiya.push({ tip: 'smert', prichina });
    this.zhar = ZHAR.maks;
    this.korkaDo = 0;
    this.telo.vosstanovit(this.chekpoint[0], this.chekpoint[1], 'возрождение');
    this.sobytiya.push({ tip: 'vozrozhdenie' });
  }
}
