// Состояние прохождения уровня: жар, чекпоинты, собираемое, зоны, выход. Без рендера.
import type { Sushchnost, ZagruzhennyyUroven } from '../level/zagruzka';
import type { Mir } from '../physics/mir';
import { TroynoyKotyol } from './boss';
import { MIR } from './config/telo';
import { BOY, SEMEYSTVA, VODA_ZASTYVANIE, VRAGI } from './config/vragi';
import { Kriostat } from './kriostat';
import { Sliyanie } from './sliyanie';

const MIR_G = MIR.gravitatsiya;
const VODA_SOPROTIVLENIE = 0.08; // доля скорости, гасимая водой за такт
// множители силы потока по материалу героя: Расплав парусит, Корка почти не летит
const POTOK = { rasplav: 1.8, korka: 0.15, konteyner: 0.6 };
const UZEL = { takty: 180, radius: 1.5, radiusVstrechi: 3 }; // узел: 3 секунды Вязкости в полутора диаметрах; встреча с баком в 3

import { ZHAR } from './config/zhar';
import { type Namerenie, PUSTOE, type Telo } from './telo';
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

type Gabarity = ReturnType<Telo['gabarity']>;

/** Всё, что у каждого тела игрока своё: жар, принудительная Корка, счётчики инея. */
export interface Zhizn {
  readonly telo: Telo;
  nam: Namerenie;
  zhar: number;
  korkaDo: number;
  korkaSredy: boolean;
  prichinaUrona: string;
  zaryadInya: Map<Sushchnost, number>;
}

export class Igra {
  minZhar: number = ZHAR.maks; // наименьший жар за уровень: звезда «без потери жара больше половины»
  ochki = 0;
  serdca = 0;
  takty = 0;
  smerti = 0;
  gotovo = false;
  chekpoint: [number, number];
  readonly sobytiya: Sobytie[] = [];

  /** Жизни тел игрока. Нулевая всегда героя, дальше спутники в порядке добавления. */
  readonly zhizni: Zhizn[] = [];

  /** Жар героя. Оставлен полем-видом, чтобы интерфейс и тесты не знали про список жизней. */
  get zhar(): number {
    return (this.zhizni[0] as Zhizn).zhar;
  }
  set zhar(v: number) {
    (this.zhizni[0] as Zhizn).zhar = v;
  }
  get korkaSredy(): boolean {
    return (this.zhizni[0] as Zhizn).korkaSredy;
  }

  // Тела второго игрока. Пусто в соло, и тогда всё ниже ведёт себя ровно как раньше.
  readonly sputniki: Telo[] = [];

  readonly vragi: Vrag[] = [];
  boss: TroynoyKotyol | Kriostat | null = null;
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
    this.zhizni.push(Igra.novayaZhizn(telo));
    this.chekpoint = [ur.dannye.start[0], ur.dannye.start[1]];
    let zerno = 7;
    for (const s of ur.sushchnosti) {
      if (s.tip === 'obrezok' || s.tip === 'skachok' || s.tip === 'uborshchik') {
        this.vragi.push(new Vrag(mir, s.tip, s.x, s.y, zerno++));
      }
    }
    if (ur.sushchnosti.some((s) => s.tip === 'kotyol')) {
      this.boss = new TroynoyKotyol(mir, ur.sushchnosti, this.vragi);
    } else if (ur.sushchnosti.some((s) => s.tip === 'kriostat')) {
      this.boss = new Kriostat(mir, ur.sushchnosti);
    }
  }

  // Вызывать до mir.shag(): ИИ врагов
  private static novayaZhizn(telo: Telo): Zhizn {
    return {
      telo,
      nam: PUSTOE,
      zhar: ZHAR.maks,
      korkaDo: 0,
      korkaSredy: false,
      prichinaUrona: 'холод',
      zaryadInya: new Map(),
    };
  }

  /** Слияние героя с первым спутником. Создаётся вместе со спутником, живёт весь уровень. */
  sliyanie: Sliyanie | null = null;

  dobavitSputnika(t: Telo): void {
    if (t === this.telo || this.sputniki.includes(t)) return;
    this.sputniki.push(t);
    this.zhizni.push(Igra.novayaZhizn(t));
    if (!this.sliyanie) this.sliyanie = new Sliyanie(this.mir, this.telo, t);
  }

  /** Слить пару, если тела касаются. Возвращает, получилось ли. */
  slit(): boolean {
    return this.sliyanie?.slit() ?? false;
  }

  razdelit(): void {
    this.sliyanie?.razdelit();
  }

  get slito(): boolean {
    return this.sliyanie?.aktivno ?? false;
  }

  /** Принудительная Корка среды для конкретного тела: вода и иней действуют на каждого своего. */
  korkaSredyTela(t: Telo): boolean {
    return this.zhizni.find((z) => z.telo === t)?.korkaSredy ?? false;
  }

  /** Герой и спутники одним списком: всё, что считается «телом игрока». */
  private tela(): Telo[] {
    return this.sputniki.length ? [this.telo, ...this.sputniki] : [this.telo];
  }

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
        // враги в воде вязнут: сопротивление как у контейнеров, без подъёма
        for (const v of this.vragi) {
          if (!v.zhiv) continue;
          for (let p = v.ot; p < v.ot + v.n; p++) {
            const x = mir.x[p] as number,
              y = mir.y[p] as number;
            if (x < z.x || x > z.x + z.w || y > verh || y < z.y) continue;
            mir.px[p] =
              (mir.px[p] as number) +
              ((mir.x[p] as number) - (mir.px[p] as number)) * VODA_SOPROTIVLENIE * 3;
            mir.py[p] =
              (mir.py[p] as number) +
              ((mir.y[p] as number) - (mir.py[p] as number)) * VODA_SOPROTIVLENIE * 3;
          }
        }
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
        for (const t of this.sputniki) {
          const st = t.sostoyanie;
          const mt = st === 'rasplav' ? POTOK.rasplav : st === 'korka' ? POTOK.korka : 1;
          this.tolknutChasticy(z, t.ot, t.n, mt);
        }
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

  /** Лава, шипы, вода и иней для одного тела. Заряд инея считается отдельно у каждого. */
  private sreda(zh: Zhizn, g: Gabarity): void {
    let vLave = false,
      vShipah = false,
      vVode = false,
      vInee = false;
    for (const s of this.ur.sushchnosti) {
      if (s.tip !== 'lava' && s.tip !== 'ship' && s.tip !== 'voda' && s.tip !== 'iney') continue;
      if (!s.aktivna) continue;
      if (g.maxX > s.x && g.minX < s.x + s.w && g.maxY > s.y && g.minY < s.y + s.h) {
        if (s.tip === 'lava') vLave = true;
        else if (s.tip === 'ship') vShipah = true;
        else if (s.tip === 'iney') {
          // иней: камера (zaderzhka 0) надевает Корку сразу; иней на стене считает время хватки:
          // копится только в Вязкости, без неё спадает вдвое быстрее, вне зоны обнуляется
          const bylo = zh.zaryadInya.get(s) ?? 0;
          const stalo = s.zaderzhka === 0 || zh.nam.vyazkost ? bylo + 1 : Math.max(0, bylo - 2);
          zh.zaryadInya.set(s, stalo);
          if (zh.telo === this.telo) s.zaryad = stalo;
          if (stalo >= s.zaderzhka * 60) vInee = true;
        } else vVode = true;
      } else if (s.tip === 'iney') {
        zh.zaryadInya.set(s, 0);
        if (zh.telo === this.telo) s.zaryad = 0;
      }
    }
    // Корка от инея спадает через секунду после выхода, урона нет
    if (vInee) zh.korkaDo = Math.max(zh.korkaDo, this.takty + 60);
    if (vLave) {
      zh.zhar = Math.min(ZHAR.maks, zh.zhar + ZHAR.lechenieLavy);
      zh.korkaDo = 0;
    }
    if (vShipah) {
      zh.zhar -= ZHAR.uronShipov;
      zh.prichinaUrona = 'шипы';
    }
    if (vVode) {
      zh.prichinaUrona = 'вода';
      zh.zhar -= ZHAR.uronVody;
      zh.korkaDo = this.takty + ZHAR.korkaPosleVody;
    }
    zh.korkaSredy = this.takty < zh.korkaDo;
  }

  // Вызывать после mir.shag() и telo.posle()
  // Промывка-погоня: вода со скоростью поднимается после задержки, верх зоны растёт
  private podnyatVodu(): void {
    for (const s of this.ur.sushchnosti) {
      if (s.tip !== 'voda' || !(s.skorost > 0) || s.poRaspisaniyu) continue;
      if (this.takty > s.zaderzhka * 60) s.h += s.skorost / 60;
    }
  }

  // Зоны по расписанию: включены первую половину периода, выключены вторую (промывка, вентилятор)
  private raspisanieZon(): void {
    const t = this.takty / 60;
    for (const s of this.ur.sushchnosti) {
      if (
        s.tip !== 'lava' &&
        s.tip !== 'voda' &&
        s.tip !== 'potok' &&
        s.tip !== 'ship' &&
        s.tip !== 'iney'
      )
        continue;
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

  takt(nam: Namerenie, namSputnikov: Namerenie[] = []): void {
    if (this.gotovo) return;
    this.takty++;
    (this.zhizni[0] as Zhizn).nam = nam;
    for (let i = 0; i < this.sputniki.length; i++)
      (this.zhizni[i + 1] as Zhizn).nam = namSputnikov[i] ?? PUSTOE;
    this.sobytiya.length = 0;
    this.telo.schitatCentr();
    const cx = this.telo.cx,
      cy = this.telo.cy;
    const g = this.telo.gabarity();
    this.dvigatPorshni();
    this.raspisanieZon();
    this.podnyatVodu();
    // Среда: у каждого тела игрока свой жар и своя принудительная Корка
    for (const zh of this.zhizni) this.sreda(zh, zh.telo === this.telo ? g : zh.telo.gabarity());
    // Собираемое, горны, выход: по расстоянию до центра.
    // В кооперативе собирает и зажигает ближний из двоих, а выход требует, чтобы дошли оба.
    // В соло спутников нет, и все три расстояния совпадают с расстоянием до героя.
    for (const s of this.ur.sushchnosti) {
      const d = Math.hypot(s.x - cx, s.y - cy);
      let dBlizh = d,
        dDaln = d;
      for (const t of this.sputniki) {
        t.schitatCentr();
        const dt = Math.hypot(s.x - t.cx, s.y - t.cy);
        if (dt < dBlizh) dBlizh = dt;
        if (dt > dDaln) dDaln = dt;
      }
      switch (s.tip) {
        case 'zharkamen':
        case 'zharkamenSredniy':
        case 'serdce':
        case 'ugolek':
          if (!s.sobrana && dBlizh < ZHAR.radiusSbora) {
            s.sobrana = true;
            const o = ZHAR.ochki[s.tip];
            this.ochki += o;
            if (s.tip === 'serdce') this.serdca++;
            if (s.tip === 'ugolek') this.zhar = Math.min(ZHAR.maks, this.zhar + ZHAR.ugolek);
            this.sobytiya.push({ tip: 'sobrano', chto: s.tip, ochki: o });
          }
          break;
        case 'panel':
          if (!s.sobrana && dBlizh < ZHAR.radiusSbora) {
            s.sobrana = true;
            this.sobytiya.push({ tip: 'panel', nomer: s.nomer });
          }
          break;
        case 'ruda':
          if (!s.sobrana && dBlizh < ZHAR.radiusSbora) {
            s.sobrana = true;
            this.sobytiya.push({ tip: 'ruda', id: s.id });
          }
          break;
        case 'uzel':
          // зажигание: Вязкость рядом с горном узла UZEL.takty подряд, отрыв сбрасывает быстрее, чем копит
          if (!s.aktivna) {
            if (nam.vyazkost && d < UZEL.radius) s.zaryad++;
            else s.zaryad = Math.max(0, s.zaryad - 3);
            if (s.zaryad >= UZEL.takty) {
              s.aktivna = true;
              this.sobytiya.push({ tip: 'uzel', id: s.id });
            }
          }
          break;
        case 'bak':
          // полный бак вспыхивает, когда герой рядом: немая встреча
          if (s.vid === 'polnyy') s.aktivna = dBlizh < UZEL.radiusVstrechi;
          break;
        case 'gorn':
          if (!s.aktivna && dBlizh < ZHAR.radiusGorna) {
            for (const g2 of this.ur.sushchnosti) if (g2.tip === 'gorn') g2.aktivna = false;
            s.aktivna = true;
            this.chekpoint = [s.x, s.y + 0.6];
            this.sobytiya.push({ tip: 'gorn', id: s.id });
          }
          break;
        case 'vyhod':
          if (this.ur.dannye.vyhodPosleBossa && this.boss && !this.boss.pobezhdyon) break;
          if (dDaln < ZHAR.radiusVyhoda) {
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
          if (s.fiksiruetsya && s.aktivna) break; // зафиксирована: не отпускается
          let godna = false;
          for (const t of this.tela()) {
            const gt = t === this.telo ? g : t.gabarity();
            const nazhata =
              gt.maxX > s.x - 0.5 && gt.minX < s.x + 0.5 && gt.minY < s.y + 0.3 && gt.maxY > s.y;
            if (nazhata && (!s.nuzhnaKorka || t.vKorke)) {
              godna = true;
              break;
            }
          }
          if (godna !== s.aktivna) {
            s.aktivna = godna;
            this.pereklyuchit(s.cel, godna);
          }
          break;
        }
        case 'rychag':
          if (!s.aktivna && dBlizh < 0.8) {
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
      // касание ищем со всеми телами игрока: урон получает тот, кто дотронулся
      let kasanie = false;
      for (const zh of this.zhizni) {
        const t = zh.telo;
        let svoyo = false;
        for (let i = t.ot; i < t.ot + t.n && !svoyo; i++) {
          if (this.mir.kontaktTel[i] && this.mir.kontaktTelKontur[i] === v.kontur) svoyo = true;
        }
        for (let i = v.ot; i < v.ot + v.n && !svoyo; i++) {
          if (this.mir.kontaktTel[i] && this.mir.kontaktTelKontur[i] === t.kontur) svoyo = true;
        }
        if (!svoyo) continue;
        kasanie = true;
        if (t.vKorke && BOY.korkaZashchishchaet) {
          const udar = this.mir.udarTel[v.kontur] as number;
          if (udar > BOY.porogDavleniya) v.zhar -= BOY.uronDavleniya;
        } else if (k.uronIgroku > 0 && !v.vyklyuchen) {
          zh.zhar -= k.uronIgroku;
          zh.prichinaUrona = 'враг';
          this.sobytiya.push({ tip: 'uronOtVraga' });
        }
      }
      v.kasaetsya = kasanie;
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
          const sem = SEMEYSTVA[v.tip];
          if (s.tip === 'voda' && (sem.zamykaetVVode || sem.zastyvaetVVode)) {
            // вода не убивает, а выключает: дрон замыкает сразу, обрезок застывает через две секунды;
            // оба остаются в мире как опора
            if (sem.zamykaetVVode) v.vyklyuchen = true;
            if (sem.zastyvaetVVode && ++v.vVodeTaktov >= VODA_ZASTYVANIE) v.vyklyuchen = true;
          } else v.zhar -= bazovyy * BOY.sredaMnozhitel;
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
      const bylo = this.boss.sobytiya.length;
      if (this.boss instanceof TroynoyKotyol) {
        const lava = this.ur.sushchnosti.some(
          (s) => s.tip === 'lava' && s.aktivna && s.id === 'zaliv',
        );
        this.boss.takt(g, this.telo.vKorke, vy, lava, 100 + this.takty);
      } else {
        // Криостат: обдув надевает Корку как иней (со следующего такта), хватка жжёт холодом
        const r = this.boss.takt(g, cx, this.telo.vKorke, vy);
        const zhG = this.zhizni[0] as Zhizn;
        if (r.moroz) zhG.korkaDo = Math.max(zhG.korkaDo, this.takty + 60);
        if (r.uron > 0) {
          zhG.zhar -= r.uron;
          zhG.prichinaUrona = 'манипулятор';
        }
      }
      for (let i = bylo; i < this.boss.sobytiya.length; i++)
        this.sobytiya.push({ tip: 'boss', chto: this.boss.sobytiya[i] as string });
      if (this.boss.pobezhdyon) {
        for (const s of this.ur.sushchnosti) {
          if (s.tip === 'zaslonka' && s.id === 'vyhod-zaslonka') this.pereklyuchit(s.id, true);
          // табло опыта: «процедура прервана»
          if (s.tip === 'okno' && s.id === 'tablo-opyt') s.nadpis = 'прервана';
        }
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
    for (const zh of this.zhizni) {
      const t = zh.telo;
      if (t !== this.telo) t.schitatCentr();
      if (t.cy < gr.minY - 2 || t.cx < gr.minX - 5 || t.cx > gr.maxX + 5)
        this.umeretTelo(zh, 'падение');
    }
    if (this.zhar < this.minZhar) this.minZhar = this.zhar;
    for (const zh of this.zhizni) if (zh.zhar <= 0) this.umeretTelo(zh, zh.prichinaUrona);
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

  /** Смерть любого тела игрока. Спутник возрождается на чекпоинте и не трогает мир. */
  private umeretTelo(zh: Zhizn, prichina: string): void {
    if (zh.telo === this.telo) {
      this.umeret(prichina);
      return;
    }
    this.razdelit();
    this.smerti++;
    zh.zhar = ZHAR.maks;
    zh.korkaDo = 0;
    zh.korkaSredy = false;
    zh.zaryadInya.clear();
    zh.telo.vosstanovit(this.chekpoint[0], this.chekpoint[1], 'возрождение');
    this.sobytiya.push({ tip: 'smert', prichina });
    this.sobytiya.push({ tip: 'vozrozhdenie' });
  }

  umeret(prichina: string): void {
    const zhG = this.zhizni[0] as Zhizn;
    this.razdelit();
    this.smerti++;
    this.sobytiya.push({ tip: 'smert', prichina });
    zhG.zhar = ZHAR.maks;
    zhG.korkaDo = 0;
    zhG.korkaSredy = false;
    zhG.zaryadInya.clear();
    this.telo.vosstanovit(this.chekpoint[0], this.chekpoint[1], 'возрождение');
    // обвал откатывается ниже чекпоинта и снова ждёт
    for (const s of this.ur.sushchnosti) {
      if (s.tip === 'obval') {
        s.verh = Math.min(s.verh, this.chekpoint[1] - 5);
        s.zaderzhka = this.takty / 60 + 2;
      } else if (s.tip === 'voda' && s.skorost > 0) {
        // промывка откатывается на пять ниже чекпоинта и снова ждёт две секунды
        s.h = Math.max(0.1, Math.min(s.h, this.chekpoint[1] - 5 - s.y));
        s.zaderzhka = this.takty / 60 + 2;
      }
    }
    this.sobytiya.push({ tip: 'vozrozhdenie' });
  }
}
