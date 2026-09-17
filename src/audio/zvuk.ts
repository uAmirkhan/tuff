// Звук: синтез в Web Audio без файлов. Каждое событие имеет 3-5 вариантов через случайный
// сдвиг высоты, чтобы не надоедало. Звук сообщает состояние тела так же, как цвет
// (02-gdd-mehaniki, раздел 14). Музыка: процедурный гул ядра с пульсом.
import type { Sobytie } from '../game/igra';
import type { Telo } from '../game/telo';

type Sostoyanie = Telo['sostoyanie'];

export class Zvuk {
  private ctx: AudioContext | null = null;
  private glavnyy: GainNode | null = null;
  private shum: AudioBuffer | null = null;
  private proshloeSost: Sostoyanie = 'obychnoe';
  private bylVKontakte = false;
  private muzykaIdet = false;
  private muzykaUzly: AudioNode[] = [];
  vklyuchen = true;
  gromkost = 0.6;
  private rnd = 12345;

  // Включается только после первого касания или клавиши: браузеры запрещают звук без жеста
  vklyuchit(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.glavnyy = this.ctx.createGain();
    this.glavnyy.gain.value = this.gromkost;
    this.glavnyy.connect(this.ctx.destination);
    // белый шум для шипения и хруста
    const dl = this.ctx.sampleRate;
    this.shum = this.ctx.createBuffer(1, dl, this.ctx.sampleRate);
    const d = this.shum.getChannelData(0);
    for (let i = 0; i < dl; i++) d[i] = Math.random() * 2 - 1;
  }

  private sluchay(): number {
    this.rnd = (this.rnd * 1103515245 + 12345) & 0x7fffffff;
    return this.rnd / 0x7fffffff;
  }

  // Тон: частота, длительность, форма, огибающая
  private ton(
    chastota: number,
    dl: number,
    forma: OscillatorType,
    gromk: number,
    skolzhenie = 1,
  ): void {
    if (!this.ctx || !this.glavnyy || !this.vklyuchen) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    const sdvig = 1 + (this.sluchay() - 0.5) * 0.1; // ±5%
    o.type = forma;
    o.frequency.setValueAtTime(chastota * sdvig, t);
    o.frequency.exponentialRampToValueAtTime(chastota * sdvig * skolzhenie, t + dl);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gromk, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dl);
    o.connect(g).connect(this.glavnyy);
    o.start(t);
    o.stop(t + dl + 0.02);
  }

  // Шипение: шум через фильтр
  private shipenie(
    dl: number,
    chastota: number,
    gromk: number,
    tip: BiquadFilterType = 'bandpass',
  ): void {
    if (!this.ctx || !this.glavnyy || !this.shum || !this.vklyuchen) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.shum;
    const f = this.ctx.createBiquadFilter();
    f.type = tip;
    f.frequency.value = chastota * (1 + (this.sluchay() - 0.5) * 0.2);
    f.Q.value = 1.2;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gromk, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dl);
    s.connect(f).connect(g).connect(this.glavnyy);
    s.start(t, this.sluchay() * 0.5);
    s.stop(t + dl + 0.02);
  }

  // Вызывать каждый такт: реагирует на смену состояния и события игры
  takt(telo: Telo, sobytiya: Sobytie[], skorost: number): void {
    if (!this.ctx) return;
    const sost = telo.sostoyanie;
    if (sost !== this.proshloeSost) {
      switch (sost) {
        case 'vyazkost':
          this.shipenie(0.18, 900, 0.25); // шлепок и шипение
          this.ton(160, 0.12, 'triangle', 0.15, 0.6);
          break;
        case 'rasplav':
          this.shipenie(0.35, 3200, 0.2, 'highpass'); // высокое шипение
          break;
        case 'korka':
          this.ton(90, 0.25, 'square', 0.18, 0.5); // хруст застывания
          this.shipenie(0.12, 400, 0.15, 'lowpass');
          break;
        case 'vybros':
          this.ton(220, 0.12, 'sawtooth', 0.2, 2.2); // треск и хлопок
          this.shipenie(0.08, 1800, 0.18);
          break;
        default:
          if (this.proshloeSost === 'vyazkost') this.shipenie(0.2, 600, 0.12); // отрыв: чавканье
          break;
      }
      this.proshloeSost = sost;
    }
    // удар о поверхность: по скорости при появлении контакта
    const vKontakte = telo.vKontakte();
    if (vKontakte && !this.bylVKontakte && skorost > 0.08) {
      const sila = Math.min(1, skorost / 0.25);
      if (sost === 'korka') this.ton(60, 0.2, 'sine', 0.3 * sila, 0.5);
      else this.ton(140, 0.1, 'sine', 0.25 * sila, 0.7);
      this.shipenie(0.06, 700, 0.1 * sila);
    }
    this.bylVKontakte = vKontakte;
    for (const s of sobytiya) {
      switch (s.tip) {
        case 'sobrano':
          this.ton(
            s.chto === 'serdce' ? 880 : s.chto === 'ugolek' ? 520 : 660,
            0.12,
            'sine',
            0.2,
            1.5,
          );
          if (s.chto === 'serdce') this.ton(1320, 0.25, 'sine', 0.15, 1.2);
          break;
        case 'gorn':
          this.ton(330, 0.3, 'triangle', 0.2, 1.5);
          this.shipenie(0.4, 1200, 0.1);
          break;
        case 'smert':
          this.ton(200, 0.5, 'sawtooth', 0.25, 0.3);
          this.shipenie(0.5, 300, 0.2, 'lowpass');
          break;
        case 'vyhod':
          this.ton(440, 0.2, 'sine', 0.2, 1.5);
          this.ton(660, 0.3, 'sine', 0.2, 1.33);
          this.ton(990, 0.5, 'sine', 0.2, 1);
          break;
        case 'uronOtVraga':
          if (this.sluchay() < 0.15) this.shipenie(0.1, 2500, 0.12);
          break;
        case 'slomano':
          this.ton(70, 0.3, 'square', 0.25, 0.4);
          this.shipenie(0.3, 500, 0.2, 'lowpass');
          break;
        case 'cepPorvana':
          this.ton(900, 0.08, 'square', 0.2, 0.5);
          break;
        case 'vragUbit':
          this.shipenie(0.25, 1500, 0.2);
          this.ton(120, 0.2, 'triangle', 0.15, 0.5);
          break;
        case 'boss':
          if (s.chto === 'котёл разбит' || s.chto === 'котёл погас в лаве')
            this.ton(55, 0.6, 'square', 0.3, 0.6);
          if (s.chto === 'победа') {
            this.ton(330, 0.3, 'sine', 0.2, 1.5);
            this.ton(495, 0.6, 'sine', 0.2, 1.33);
          }
          break;
        default:
          break;
      }
    }
  }

  // Музыка ядра: два низких гула с медленным биением и пульс раз в секунду
  muzyka(vkl: boolean): void {
    if (!this.ctx || !this.glavnyy) return;
    if (vkl === this.muzykaIdet) return;
    this.muzykaIdet = vkl;
    if (!vkl) {
      for (const u of this.muzykaUzly) {
        try {
          (u as OscillatorNode).stop?.();
        } catch {
          // уже остановлен
        }
        u.disconnect();
      }
      this.muzykaUzly = [];
      return;
    }
    const t = this.ctx.currentTime;
    const g = this.ctx.createGain();
    g.gain.value = 0.08;
    g.connect(this.glavnyy);
    for (const f of [55, 55.7, 110.3]) {
      const o = this.ctx.createOscillator();
      o.type = f > 100 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.connect(g);
      o.start(t);
      this.muzykaUzly.push(o);
    }
    // пульс: низкочастотный осциллятор модулирует громкость
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;
    const lg = this.ctx.createGain();
    lg.gain.value = 0.04;
    lfo.connect(lg).connect(g.gain);
    lfo.start(t);
    this.muzykaUzly.push(lfo, g);
  }

  ustanovitGromkost(v: number): void {
    this.gromkost = v;
    if (this.glavnyy) this.glavnyy.gain.value = v;
  }
}
