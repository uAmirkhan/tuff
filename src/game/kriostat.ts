// Опыт яруса 1 «Криостат»: бак образца на гусеницах. Автомат «подъехать, обдать инеем, окно,
// схватить манипулятором, отойти». Обдув надевает на героя Корку (иней), окно после обдува это
// три секунды сложенных манипуляторов, когда стекло уязвимо для удара Коркой сверху. Запасной путь:
// форсунки промывки (рычаг) над рельсом, обдув под водой даёт трещину от перепада, две трещины ломают бак.
// Бак это кинематический прямоугольник (как поршень): тело едет на нём и толкается им.

import type { Sushchnost } from '../level/zagruzka';
import type { Mir } from '../physics/mir';
import { KRIOSTAT } from './config/boss';

export type SostoyanieKriostata = 'pauza' | 'podhod' | 'obduv' | 'okno' | 'hvatka' | 'othod';

export interface Gabarity {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class Kriostat {
  readonly bak: Sushchnost;
  sostoyanie: SostoyanieKriostata = 'pauza';
  taymer: number = KRIOSTAT.pauzaStart;
  udarov = 0; // ударов Коркой по стеклу
  treshchin = 0; // трещин от перепада температур
  pobezhdyon = false;
  readonly sobytiya: string[] = [];
  readonly minX: number; // пределы левого края бака
  readonly maxX: number;
  private zashchita = 0; // тактов после удара, когда второй удар не считается
  private shvatil = false; // в этой хватке урон уже нанесён
  private podVodoy = false; // во время обдува бак стоял под работающей форсункой
  private podhodTaktov = 0;

  constructor(
    readonly mir: Mir,
    readonly sushchnosti: Sushchnost[],
  ) {
    const b = sushchnosti.find((s) => s.tip === 'kriostat');
    if (!b) throw new Error('нет сущности kriostat');
    this.bak = b;
    this.minX = Math.min(b.x0, b.x0 + b.hodX);
    this.maxX = Math.max(b.x0, b.x0 + b.hodX);
  }

  /** верх стекла */
  get verh(): number {
    return this.bak.y + this.bak.h;
  }

  /** центр бака по x */
  get cx(): number {
    return this.bak.x + this.bak.w / 2;
  }

  /** зона обдува: над баком и по сторонам, до высоты obduvVysota над стеклом */
  vObduve(g: Gabarity): boolean {
    const p = KRIOSTAT.obduvShirina / 2;
    return (
      g.maxX > this.cx - p &&
      g.minX < this.cx + p &&
      g.maxY > this.verh - 0.5 &&
      g.minY < this.verh + KRIOSTAT.obduvVysota
    );
  }

  /** зона хватки манипуляторов: по сторонам бака и над ним, ниже карниза */
  vHvatke(g: Gabarity): boolean {
    const p = KRIOSTAT.hvatkaShirina / 2;
    return (
      g.maxX > this.cx - p &&
      g.minX < this.cx + p &&
      g.maxY > this.bak.y &&
      g.minY < this.verh + KRIOSTAT.hvatkaVysota
    );
  }

  /** бак стоит под работающей форсункой: зона воды накрывает стекло не меньше чем на единицу */
  private podForsunkoy(): boolean {
    const x1 = this.bak.x,
      x2 = this.bak.x + this.bak.w;
    return this.sushchnosti.some(
      (s) =>
        s.tip === 'voda' &&
        s.aktivna &&
        s.y < this.verh + 0.5 &&
        s.y + s.h > this.verh - 0.5 &&
        Math.min(x2, s.x + s.w) - Math.max(x1, s.x) >= 1.0,
    );
  }

  private perevesti(sost: SostoyanieKriostata, taktov: number): void {
    this.sostoyanie = sost;
    this.taymer = taktov;
  }

  /** датчик безопасности: тело на полу перед баком по ходу движения останавливает его, бак не давит */
  private telNaPuti(dx: number, g: Gabarity): boolean {
    if (g.minY >= this.verh - 0.2) return false;
    const x1 = this.bak.x,
      x2 = this.bak.x + this.bak.w;
    return dx > 0 ? g.minX < x2 + 0.35 && g.maxX > x1 : g.maxX > x1 - 0.35 && g.minX < x2;
  }

  private dvinut(dxZhelaemyy: number, g: Gabarity): void {
    const shag = KRIOSTAT.skorost / 60;
    const dx = Math.max(-shag, Math.min(shag, dxZhelaemyy));
    if (this.telNaPuti(dx, g)) {
      this.stoyat();
      return;
    }
    const novyyX = Math.max(this.minX, Math.min(this.maxX, this.bak.x + dx));
    const o0 = this.bak.otrezki[0] as number;
    const vx = novyyX - (this.mir.oX1[o0] as number);
    for (const o of this.bak.otrezki) this.mir.zadatSkorostOtrezka(o, vx, 0);
    this.bak.x = novyyX;
  }

  private stoyat(): void {
    for (const o of this.bak.otrezki) this.mir.zadatSkorostOtrezka(o, 0, 0);
  }

  private razbit(chem: string): void {
    this.pobezhdyon = true;
    this.sobytiya.push(`бак разбит: ${chem}`);
    this.sobytiya.push('победа');
    this.stoyat();
    // обломок: стекло и корпус оседают до низкого короба, который тело перекатывает; иней растёт из него
    for (const o of this.bak.otrezki) this.mir.ubratOtrezok(o);
    const x1 = this.bak.x,
      y1 = this.bak.y,
      x2 = this.bak.x + this.bak.w,
      y2 = this.bak.y + KRIOSTAT.vysotaOblomka;
    this.bak.otrezki = [
      this.mir.dobavitOtrezok(x1, y1, x1, y2, 1, 1, 1),
      this.mir.dobavitOtrezok(x1, y2, x2, y2, 1, 1, 1),
      this.mir.dobavitOtrezok(x2, y2, x2, y1, 1, 1, 1),
      this.mir.dobavitOtrezok(x2, y1, x1, y1, 1, 1, 1),
    ];
    for (const o of this.bak.otrezki) this.mir.oGlubina[o] = 0.4;
    this.bak.h = KRIOSTAT.vysotaOblomka;
  }

  /**
   * Вызывать из igra.takt после среды. gab габариты героя, geroyX его центр, vKorke герой в Корке,
   * skorostVniz положительная скорость тела вниз за такт. Возвращает, что делать с героем.
   */
  takt(
    gab: Gabarity,
    geroyX: number,
    vKorke: boolean,
    skorostVniz: number,
  ): { moroz: boolean; uron: number } {
    const otvet = { moroz: false, uron: 0 };
    if (this.pobezhdyon) {
      this.stoyat();
      return otvet;
    }
    if (this.zashchita > 0) this.zashchita--;
    switch (this.sostoyanie) {
      case 'pauza':
        this.stoyat();
        if (--this.taymer <= 0) {
          this.perevesti('podhod', 0);
          this.podhodTaktov = 0;
        }
        break;
      case 'podhod': {
        // ехать, пока центр не встанет на smeshchenie правее героя (в пределах рельса); по истечении срока
        // обдувать оттуда, где стоит
        const cel = Math.max(
          this.minX,
          Math.min(this.maxX, geroyX + KRIOSTAT.smeshchenie - this.bak.w / 2),
        );
        const raznica = cel - this.bak.x;
        this.podhodTaktov++;
        if (Math.abs(raznica) < 0.03 || this.podhodTaktov > KRIOSTAT.podhodMaks) {
          this.stoyat();
          this.podVodoy = false;
          this.perevesti('obduv', KRIOSTAT.obduvTaktov);
          this.sobytiya.push('обдув');
        } else this.dvinut(raznica, gab);
        break;
      }
      case 'obduv':
        this.stoyat();
        if (this.vObduve(gab)) otvet.moroz = true;
        if (this.podForsunkoy()) this.podVodoy = true;
        if (--this.taymer <= 0) {
          if (this.podVodoy) {
            this.treshchin++;
            this.sobytiya.push(`трещина от перепада ${this.treshchin}`);
            if (this.treshchin >= KRIOSTAT.treshchinNaBak) {
              this.razbit('перепад температур');
              break;
            }
          }
          this.perevesti('okno', KRIOSTAT.oknoTaktov);
          this.sobytiya.push('окно');
        }
        break;
      case 'okno':
        this.stoyat();
        if (--this.taymer <= 0) {
          this.shvatil = false;
          this.perevesti('hvatka', KRIOSTAT.hvatkaTaktov);
          this.sobytiya.push('хватка');
        }
        break;
      case 'hvatka':
        this.stoyat();
        if (!this.shvatil && this.vHvatke(gab)) {
          this.shvatil = true;
          otvet.uron = KRIOSTAT.uronHvatki;
          this.sobytiya.push('схватил');
        }
        if (--this.taymer <= 0) {
          this.perevesti('othod', KRIOSTAT.othodTaktov);
          this.sobytiya.push('отход');
        }
        break;
      case 'othod': {
        const domoy = this.bak.x0 - this.bak.x;
        if (Math.abs(domoy) < 1e-3) this.stoyat();
        else this.dvinut(domoy, gab);
        if (--this.taymer <= 0) {
          this.perevesti('podhod', 0);
          this.podhodTaktov = 0;
        }
        break;
      }
      default:
        break;
    }
    // основной путь: удар Коркой сверху по стеклу в окне
    if (
      this.sostoyanie === 'okno' &&
      this.zashchita === 0 &&
      vKorke &&
      skorostVniz > KRIOSTAT.porogUdara
    ) {
      const nadSteklom =
        gab.maxX > this.bak.x &&
        gab.minX < this.bak.x + this.bak.w &&
        gab.minY < this.verh + 0.3 &&
        gab.minY > this.verh - 0.6;
      if (nadSteklom) {
        this.udarov++;
        this.zashchita = KRIOSTAT.zashchitaUdara;
        this.sobytiya.push(`удар по стеклу ${this.udarov}`);
        if (this.udarov >= KRIOSTAT.udarovNaBak) this.razbit('три удара Коркой');
      }
    }
    return otvet;
  }
}
