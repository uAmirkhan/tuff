// Босс мира 1 «Тройной котёл». Три неподвижных котла. Каждый по кругу открывает крышку,
// выпускает Обрезока и закрывается. Открытый котёл уязвим: удар Коркой сверху по горлу
// разбивает его. Запасной путь: рычаг арены заливает котлы лавой, каждый котёл в лаве гаснет.
// Общий автомат «подойти, ударить, отойти» здесь вырожден в «открыться, выпустить, закрыться»:
// индивидуальность босса в арене, не в коде.

import type { Sushchnost } from '../level/zagruzka';
import type { Mir } from '../physics/mir';
import { BOSS } from './config/boss';
import { Vrag } from './vrag';

export interface Kotyol {
  x: number;
  y: number; // низ котла
  zhiv: boolean;
  otkryt: boolean;
  taymer: number; // тактов до смены состояния
  udarov: number; // получено ударов Коркой в открытом состоянии
  zalit: number; // тактов в лаве
}

export class TroynoyKotyol {
  readonly kotly: Kotyol[] = [];
  ocheredʹ = 0; // индекс котла, который откроется следующим
  pobezhdyon = false;
  vypushcheno = 0;
  readonly sobytiya: string[] = [];

  constructor(
    readonly mir: Mir,
    readonly sushchnosti: Sushchnost[],
    readonly vragi: Vrag[],
  ) {
    for (const s of sushchnosti) {
      if (s.tip === 'kotyol')
        this.kotly.push({
          x: s.x,
          y: s.y,
          zhiv: true,
          otkryt: false,
          taymer: BOSS.pauzaStart,
          udarov: 0,
          zalit: 0,
        });
    }
  }

  // очередь: следующий живой котёл по кругу после данного
  private sleduyushchiy(ot: number): void {
    let n = ot;
    for (let i = 0; i < this.kotly.length; i++) {
      n = (n + 1) % this.kotly.length;
      if (this.kotly[n]?.zhiv) break;
    }
    this.ocheredʹ = n;
  }

  get zhivyh(): number {
    return this.kotly.filter((k) => k.zhiv).length;
  }

  // Вызывать после igra.takt: heroX/heroY центр тела, geroyVKorke, udarSverhu импульс тела вниз
  takt(
    gab: { minX: number; maxX: number; minY: number; maxY: number },
    vKorke: boolean,
    skorostVniz: number,
    lavaZalita: boolean,
    zerno: number,
  ): void {
    if (this.pobezhdyon) return;
    const zhivye = this.kotly.filter((k) => k.zhiv);
    if (zhivye.length === 0) {
      this.pobezhdyon = true;
      this.sobytiya.push('победа');
      return;
    }
    for (const k of this.kotly) {
      if (!k.zhiv) continue;
      // запасной путь: лава залита, котёл гаснет через время
      if (lavaZalita) {
        k.zalit++;
        if (k.zalit > BOSS.gasnetVLave) {
          k.zhiv = false;
          this.sobytiya.push('котёл погас в лаве');
          continue;
        }
      }
      k.taymer--;
      if (k.taymer > 0) continue;
      if (!k.otkryt) {
        // очередь: открывается только котёл в очереди
        const idx = this.kotly.indexOf(k);
        if (idx !== this.ocheredʹ) {
          k.taymer = 10;
          continue;
        }
        k.otkryt = true;
        k.taymer = BOSS.otkrytTaktov;
        // выпустить Обрезока
        if (this.vragi.filter((v) => v.zhiv).length < BOSS.maksVragov) {
          this.vragi.push(
            new Vrag(this.mir, 'obrezok', k.x, k.y + BOSS.vysota + 0.5, zerno + this.vypushcheno),
          );
          this.vypushcheno++;
          this.sobytiya.push('выпущен Обрезок');
        }
      } else {
        k.otkryt = false;
        k.udarov = 0;
        k.taymer = BOSS.zakrytTaktov;
        this.sleduyushchiy(this.kotly.indexOf(k));
      }
    }
    // основной путь: удар Коркой сверху в открытое горло
    for (const k of this.kotly) {
      if (!k.zhiv || !k.otkryt) continue;
      const gorloX1 = k.x - BOSS.gorlo / 2,
        gorloX2 = k.x + BOSS.gorlo / 2;
      const verh = k.y + BOSS.vysota;
      const nadGorlom =
        gab.maxX > gorloX1 && gab.minX < gorloX2 && gab.minY < verh + 0.3 && gab.minY > verh - 0.6;
      if (nadGorlom && vKorke && skorostVniz > BOSS.porogUdara) {
        k.udarov++;
        this.sobytiya.push(`удар по котлу ${this.kotly.indexOf(k) + 1}`);
        if (k.udarov >= BOSS.udarovNaKotyol) {
          k.zhiv = false;
          k.otkryt = false;
          this.sobytiya.push('котёл разбит');
          this.sleduyushchiy(this.kotly.indexOf(k));
        }
      }
    }
  }
}
