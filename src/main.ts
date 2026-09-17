// Точка входа спайка: тестовая комната, тело, ввод, отрисовка.
import { Graphics } from 'pixi.js';
import { MIR } from './game/config/telo';
import { Telo } from './game/telo';
import { Vvod } from './input/vvod';
import { Mir } from './physics/mir';
import { Stsena } from './render/stsena';

const mir = new Mir(MIR);
// Тестовая комната: пол, стены, потолок, полка, щель, скользкая плита
mir.dobavitOtrezok(-10, 0, 10, 0); // пол
mir.dobavitOtrezok(-10, 8, -10, 0); // левая стена, свободная сторона +x
mir.dobavitOtrezok(10, 0, 10, 8); // правая стена, свободная сторона -x
mir.dobavitOtrezok(10, 8, -10, 8); // потолок, свободная сторона снизу
mir.dobavitOtrezok(2, 2, 6, 2, 1, 1, 0); // полка, двусторонняя
mir.dobavitOtrezok(6, 0, 6, 2, 1, 1, 0); // торец полки
mir.dobavitOtrezok(-6, 0, -6, 1.2, 1, 1, 0); // столбик щели
mir.dobavitOtrezok(-6.6, 0, -6.6, 1.2, 1, 1, 0); // второй столбик: щель 0,6 диаметра
mir.dobavitOtrezok(-3, 3.5, 0, 3.5, 0.05, 0, 0); // скользкая плита, Вязкость не держит

const telo = new Telo(mir, 0, 1.5);
const vvod = new Vvod(document.body);
const stsena = new Stsena();
const hud = document.getElementById('hud') as HTMLDivElement;
const ui = new Graphics();

let nakoplen = 0;
let last = performance.now();
let kadrov = 0,
  taktov = 0,
  fpsT = last,
  fps = 0;

function risovatUi(): void {
  ui.clear();
  for (const b of vvod.geometriyaKnopok()) {
    const aktivna = vvod.nam[b.k] as boolean;
    ui.circle(b.x, b.y, b.r);
    ui.fill({ color: aktivna ? 0xffb347 : 0xffffff, alpha: aktivna ? 0.6 : 0.18 });
  }
  const s = vvod.stik;
  if (s.aktiven) {
    ui.circle(s.x0, s.y0, 48);
    ui.stroke({ width: 2, color: 0xffffff, alpha: 0.4 });
  }
}

async function start(): Promise<void> {
  await stsena.init();
  stsena.app.stage.addChild(ui);
  stsena.app.ticker.add(() => {
    const now = performance.now();
    nakoplen += Math.min(0.1, (now - last) / 1000);
    last = now;
    while (nakoplen >= MIR.shag) {
      const nam = vvod.sobrat();
      telo.primenit(nam);
      mir.shag();
      telo.posle(nam);
      nakoplen -= MIR.shag;
      taktov++;
    }
    const [cx, cy] = telo.centr();
    stsena.kamX += (cx - stsena.kamX) * 0.1;
    stsena.kamY += (cy + 1 - stsena.kamY) * 0.1;
    stsena.risovat(mir, [telo], nakoplen / MIR.shag);
    risovatUi();
    kadrov++;
    if (now - fpsT > 500) {
      fps = (kadrov * 1000) / (now - fpsT);
      kadrov = 0;
      fpsT = now;
    }
    const g = telo.gabarity();
    hud.textContent = `fps ${fps.toFixed(0)}  тактов ${taktov}  точек ${mir.n}\nw ${g.w.toFixed(2)} h ${g.h.toFixed(2)}  промахи ${vvod.promahi}/${vvod.nazhatiy}\nWASD/стрелки  J Вязкость  K Расплав  L Корка  Пробел Выброс`;
  });
}

start();
