// Состояние прохождения уровня: жар, чекпоинты, собираемое, зоны, выход. Без рендера.
import type { Sushchnost, ZagruzhennyyUroven } from '../level/zagruzka';
import type { Mir } from '../physics/mir';
import { TroynoyKotyol } from './boss';
import { MIR } from './config/telo';
import { BOY, VRAGI } from './config/vragi';

const MIR_G = MIR.gravitatsiya;
const VODA_SOPROTIVLENIE = 0.08; // доля скорости, гасимая водой за такт
// множители силы потока по материалу героя: Расплав парусит, Корка почти не летит
const POTOK = { rasplav: 1.8, korka: 0.15, konteyner: 0.6 };
const UZEL = { takty: 180, radiusVstrechi: 3 }; // узел теплотрассы: 3 секунды Вязкости; встреча с баком в 3 диаметрах

import { ZHAR } from './config/zhar';
import type { Namerenie, Telo } from './telo';
import { Vrag } from './vrag';

export type Sobytie =
  | { tip: 'sobrano'; chto: Sushchnost['tip']; ochki: number }
  | { tip: 'gorn'; id: string }
  | { tip: 'smert'; prichina: string }
  | { tip: 'vozrozhdenie' }
  | { tip: 'vyhod'; takty: number; ochki: number; serdca: number }
  | { tip: 'zaslonka'; id: string; otkryta: boolean }
  | { tip: 'slomano'; poligon: number }
  | { tip: 'storozh'; prichina: string }
  | { tip: 'vragUbit'; kem: 'korka' | 'sreda' }
  | { tip: 'uronOtVraga' }
  | { tip: 'cepPorvana'; id: string }
  | { tip: 'boss'; chto: string }
  | { tip: 'panel'; nomer: number }
  | { tip: 'uzel'; id: string }
  | { tip: 'ruda'; id: string };

export class Igra {
  zhar: number = ZHAR.maks;
  ochki = 0;
  serdca = 0;
  takty = 0;
  smerti = 0;
  private prichinaUrona = 'холод'; // последний источник урона, подпись к смерти от потери жара
  gotovo = false;
  chekpoint: [number, number];
  readonly sobytiya: Sobytie[] = [];
  korkaSredy = false;
  private korkaDo = 0;

  readonly vragi: Vrag[] = [];
  boss: TroynoyKotyol | null = null;
  // Жерло: высота и самое длинное падение
  maksVysota = 0;
  padenieOt = 0;
  dlinneysheePadenie = 0;
  private proshlayaY = 0;

  constructor(
    readonly mir: Mir,
    readonly telo: Telo,
    readonly ur: ZagruzhennyyUroven,
  ) {
    this.chekpoint = [ur.dannye.start[0], ur.dannye.start[1]];
    let zerno = 7;
    for (const s of ur.sushchnosti) {
      if (s.tip === 'obrezok' || s.tip === 'skachok') {
        this.vragi.push(new Vrag(mir, s.tip, s.x, s.y, zerno++));
      }
    }
    if (ur.sushchnosti.some((s) => s.tip === 'kotyol')) {
      this.boss = new TroynoyKotyol(mir, ur.sushchnosti, this.vragi);
    }
  }

  // Вызывать до mir.shag(): ИИ врагов
  doShaga(): void {
    if (this.gotovo) return;
    this.telo.schitatCentr();
    for (const v of this.vragi) v.dumat(this.telo.cx, this.telo.cy, this.takty);
    this.silySredy();
  }

  // Плавучесть контейнеров в воде и зоны силы (поток). Сила задаётся сдвигом прошлой позиции:
  // ускорение a за такт даёт скорость a·dt, то есть px -= a·dt².
  private silySredy(): void {
    const dt2 = (1 / 60) * (1 / 60);
    const g = MIR_G;
    const mir = this.mir;
    for (const z of this.ur.sushchnosti) {
      if (!z.aktivna) continue;
      if (z.tip === 'voda') {
        const verh = z.y + z.h;
        for (const s of this.ur.sushchnosti) {
          if (s.chasticy.length === 0 || s.plavuchest === 0) continue;
          for (const p of s.chasticy) {
            const x = mir.x[p] as number,
              y = mir.y[p] as number;
            if (x < z.x || x > z.x + z.w || y > verh || y < z.y) continue;
            // подъём и вязкое сопротивление воды
            mir.py[p] = (mir.py[p] as number) - g * s.plavuchest * dt2;
            mir.px[p] =
              (mir.px[p] as number) +
              ((mir.x[p] as number) - (mir.px[p] as number)) * VODA_SOPROTIVLENIE;
            mir.py[p] =
              (mir.py[p] as number) +
              ((mir.y[p] as number) - (mir.py[p] as number)) * VODA_SOPROTIVLENIE;
          }
        }
      } else if (z.tip === 'potok') {
        // герой: множитель по материалу; контейнеры и враги: как обычное тело
        const sost = this.telo.sostoyanie;
        const mn = sost === 'rasplav' ? POTOK.rasplav : sost === 'korka' ? POTOK.korka : 1;
        this.tolknutChasticy(z, this.telo.ot, this.telo.n, mn);
        for (const s of this.ur.sushchnosti)
          if (s.chasticy.length)
            this.tolknutChasticy(z, s.chasticy[0] as number, 4, POTOK.konteyner);
        for (const v of this.vragi) if (v.zhiv) this.tolknutChasticy(z, v.ot, v.n, 1);
      }
    }
  }

  private tolknutChasticy(z: Sushchnost, ot: number, n: number, mn: number): void {
    const dt2 = (1 / 60) * (1 / 60);
    const mir = this.mir;
    for (let p = ot; p < ot + n; p++) {
      const x = mir.x[p] as number,
        y = mir.y[p] as number;
      if (x < z.x || x > z.x + z.w || y < z.y || y > z.y + z.h) continue;
      mir.px[p] = (mir.px[p] as number) - z.silaX * mn * dt2;
      mir.py[p] = (mir.py[p] as number) - z.silaY * mn * dt2;
    }
  }

  // Вызывать после mir.shag() и telo.posle()
  // Зоны по расписанию: включены первую половину периода, выключены вторую (промывка, вентилятор)
  private raspisanieZon(): void {
    const t = this.takty / 60;
    for (const s of this.ur.sushchnosti) {
      if (s.tip !== 'lava' && s.tip !== 'voda' && s.tip !== 'potok' && s.tip !== 'ship') continue;
      if (!s.poRaspisaniyu || !(s.period > 0)) continue;
      const u = (((t + s.faza * s.period) % s.period) + s.period) % s.period;
      s.aktivna = s.vklyuchenaVRaspisanii && u < s.period / 2;
    }
  }

  // Поршни: цель по циклу «пауза, ход, пауза, обратно», скорость на такт = цель минус текущее
  private dvigatPorshni(): void {
    const t = this.takty / 60;
    for (const s of this.ur.sushchnosti) {
      if (s.tip !== 'porshen' || s.otrezki.length === 0) continue;
      const P = s.period,
        Q = s.pauza,
        polov = P / 2,
        hod = Math.max(1e-6, polov - Q);
      const u = (((t + s.faza * P) % P) + P) % P;
      let f: number;
      if (u < polov) f = u < Q ? 0 : Math.min(1, (u - Q) / hod);
      else {
        const v = u - polov;
        f = v < Q ? 1 : Math.max(0, 1 - (v - Q) / hod);
      }
      const cx = s.x0 + s.hodX * f,
        cy = s.y0 + s.hodY * f;
      const o0 = s.otrezki[0] as number;
      const vx = cx - (this.mir.oX1[o0] as number),
        vy = cy - (this.mir.oY1[o0] as number);
      for (const o of s.otrezki) this.mir.zadatSkorostOtrezka(o, vx, vy);
      s.x = cx;
      s.y = cy;
    }
  }

  takt(nam: Namerenie): void {
    if (this.gotovo) return;
    this.takty++;
    this.sobytiya.length = 0;
    this.telo.schitatCentr();
    const cx = this.telo.cx,
      cy = this.telo.cy;
    const g = this.telo.gabarity();
    this.dvigatPorshni();
    this.raspisanieZon();
    // Среда
    let vLave = false,
      vShipah = false,
      vVode = false;
    for (const s of this.ur.sushchnosti) {
      if (s.tip !== 'lava' && s.tip !== 'ship' && s.tip !== 'voda') continue;
      if (!s.aktivna) continue;
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
    if (vShipah) {
      this.zhar -= ZHAR.uronShipov;
      this.prichinaUrona = 'шипы';
    }
    if (vVode) {
      this.prichinaUrona = 'вода';
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
        case 'panel':
          if (!s.sobrana && d < ZHAR.radiusSbora) {
            s.sobrana = true;
            this.sobytiya.push({ tip: 'panel', nomer: s.nomer });
          }
          break;
        case 'ruda':
          if (!s.sobrana && d < ZHAR.radiusSbora) {
            s.sobrana = true;
            this.sobytiya.push({ tip: 'ruda', id: s.id });
          }
          break;
        case 'uzel':
          // зажигание: Вязкость рядом с горном узла UZEL.takty подряд, отрыв сбрасывает быстрее, чем копит
          if (!s.aktivna) {
            if (nam.vyazkost && d < ZHAR.radiusGorna) s.zaryad++;
            else s.zaryad = Math.max(0, s.zaryad - 3);
            if (s.zaryad >= UZEL.takty) {
              s.aktivna = true;
              this.sobytiya.push({ tip: 'uzel', id: s.id });
            }
          }
          break;
        case 'bak':
          // полный бак вспыхивает, когда герой рядом: немая встреча
          if (s.vid === 'polnyy') s.aktivna = d < UZEL.radiusVstrechi;
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
          if (this.ur.dannye.vyhodPosleBossa && this.boss && !this.boss.pobezhdyon) break;
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
          if (s.fiksiruetsya && s.aktivna) break; // зафиксирована: не отпускается
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
    // Враги: урон игроку при касании, давление Коркой, среда
    for (const v of this.vragi) {
      if (!v.zhiv) continue;
      const k = VRAGI[v.tip];
      let kasanie = false;
      for (let i = this.telo.ot; i < this.telo.ot + this.telo.n; i++) {
        if (this.mir.kontaktTel[i] && this.mir.kontaktTelKontur[i] === v.kontur) kasanie = true;
      }
      for (let i = v.ot; i < v.ot + v.n; i++) {
        if (this.mir.kontaktTel[i] && this.mir.kontaktTelKontur[i] === this.telo.kontur)
          kasanie = true;
      }
      v.kasaetsya = kasanie;
      if (kasanie) {
        if (this.telo.vKorke && BOY.korkaZashchishchaet) {
          const udar = this.mir.udarTel[v.kontur] as number;
          if (udar > BOY.porogDavleniya) v.zhar -= BOY.uronDavleniya;
        } else {
          this.zhar -= k.uronIgroku;
          this.prichinaUrona = 'враг';
          this.sobytiya.push({ tip: 'uronOtVraga' });
        }
      }
      // среда: враг чувствительнее игрока
      const gv = v.gabarity();
      for (const s of this.ur.sushchnosti) {
        if (s.tip !== 'lava' && s.tip !== 'ship' && s.tip !== 'voda') continue;
        if (!s.aktivna) continue;
        if (gv.maxX > s.x && gv.minX < s.x + s.w && gv.maxY > s.y && gv.minY < s.y + s.h) {
          const bazovyy =
            s.tip === 'lava'
              ? ZHAR.lechenieLavy
              : s.tip === 'ship'
                ? ZHAR.uronShipov
                : ZHAR.uronVody;
          v.zhar -= bazovyy * BOY.sredaMnozhitel;
        }
      }
      if (v.zhar <= 0) {
        v.umeret();
        this.sobytiya.push({ tip: 'vragUbit', kem: kasanie ? 'korka' : 'sreda' });
      }
    }
    // Порванные цепи: событие по сущности
    if (this.mir.porvano.length) {
      for (const sv of this.mir.porvano) {
        const cep = this.ur.sushchnosti.find((s) => s.tip === 'cep' && s.svyazi.includes(sv));
        if (cep) this.sobytiya.push({ tip: 'cepPorvana', id: cep.id });
      }
    }
    // Хрупкие многоугольники: сломан один отрезок, рушится весь
    if (this.mir.slomano.length) {
      for (const o of this.mir.slomano) {
        const idx = this.ur.poligonOtrezki.findIndex((p) => o >= p.ot && o < p.ot + p.n);
        if (idx === -1 || this.ur.slomany[idx]) continue;
        const p = this.ur.poligonOtrezki[idx] as { ot: number; n: number };
        for (let k = p.ot; k < p.ot + p.n; k++) if (this.mir.oZhiv[k]) this.mir.ubratOtrezok(k);
        this.ur.slomany[idx] = true;
        this.sobytiya.push({ tip: 'slomano', poligon: idx });
      }
    }
    // Босс
    if (this.boss && !this.boss.pobezhdyon) {
      const m = this.mir;
      let vy = 0;
      for (let i = this.telo.ot; i < this.telo.ot + this.telo.n; i++)
        vy += (m.py[i] as number) - (m.y[i] as number);
      vy /= this.telo.n; // положительное = движение вниз
      const lava = this.ur.sushchnosti.some(
        (s) => s.tip === 'lava' && s.aktivna && s.id === 'zaliv',
      );
      const bylo = this.boss.sobytiya.length;
      this.boss.takt(g, this.telo.vKorke, vy, lava, 100 + this.takty);
      for (let i = bylo; i < this.boss.sobytiya.length; i++)
        this.sobytiya.push({ tip: 'boss', chto: this.boss.sobytiya[i] as string });
      if (this.boss.pobezhdyon) {
        for (const s of this.ur.sushchnosti)
          if (s.tip === 'zaslonka' && s.id === 'vyhod-zaslonka') this.pereklyuchit(s.id, true);
        for (const v of this.vragi) if (v.zhiv) v.umeret();
      }
    }
    // Обвал: поднимается после задержки, касание тела снизу убивает
    for (const s of this.ur.sushchnosti) {
      if (s.tip !== 'obval') continue;
      if (this.takty > s.zaderzhka * 60) s.verh += s.skorost / 60;
      if (g.maxX > s.x && g.minX < s.x + s.w && g.minY < s.verh) {
        this.umeret('обвал');
        break;
      }
    }
    // Жерло: высота и падения
    if (this.ur.dannye.rezhim === 'zherlo') {
      const vys = cy - this.ur.dannye.start[1];
      if (vys > this.maksVysota) this.maksVysota = vys;
      if (cy < this.proshlayaY - 0.001) {
        if (this.padenieOt === 0) this.padenieOt = this.proshlayaY;
      } else if (this.padenieOt !== 0) {
        const p = this.padenieOt - this.proshlayaY;
        if (p > this.dlinneysheePadenie) this.dlinneysheePadenie = p;
        this.padenieOt = 0;
      }
      this.proshlayaY = cy;
    }
    // Падение за границы уровня
    const gr = this.ur.dannye.granicy;
    if (cy < gr.minY - 2 || cx < gr.minX - 5 || cx > gr.maxX + 5) this.umeret('падение');
    if (this.zhar <= 0) this.umeret(this.prichinaUrona);
    // сторожа тела: взрыв, выворачивание, самопересечение; событие в журнал и в события такта
    const storozh = this.telo.storozha();
    if (storozh) this.sobytiya.push({ tip: 'storozh', prichina: storozh });
  }

  private pereklyuchit(id: string, otkryt: boolean): void {
    const z = this.ur.sushchnosti.find((s) => s.id === id);
    if (!z) return;
    if (z.tip === 'lava' || z.tip === 'ship' || z.tip === 'voda') {
      z.aktivna = otkryt;
      return;
    }
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
    // обвал откатывается ниже чекпоинта и снова ждёт
    for (const s of this.ur.sushchnosti) {
      if (s.tip !== 'obval') continue;
      s.verh = Math.min(s.verh, this.chekpoint[1] - 5);
      s.zaderzhka = this.takty / 60 + 2;
    }
    this.sobytiya.push({ tip: 'vozrozhdenie' });
  }
}
