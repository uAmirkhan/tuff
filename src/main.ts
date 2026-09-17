// Точка входа: уровень 1-1 по умолчанию, ?komnata=1 тестовая комната, ?perf=1 замер.
import { Graphics } from 'pixi.js';
import { MIR } from './game/config/telo';
import { Igra } from './game/igra';
import { Telo } from './game/telo';
import { Prizrak, Zapis } from './game/zapis';
import { Vvod } from './input/vvod';
import type { Uroven } from './level/format';
import { porogOchkov, sleduyushchiy, UROVNI, urovenOtkryt, urovenPoId } from './level/spisok';
import { type ZagruzhennyyUroven, zagruzitUroven } from './level/zagruzka';
import {
  HranilishcheBrauzera,
  sohranitProgress,
  zagruzitProgress,
  zapisatRezultat,
} from './meta/sohranenie';
import { Mir } from './physics/mir';
import { Stsena } from './render/stsena';

const params = new URLSearchParams(location.search);
const komnata = params.get('komnata') === '1';
const perf = params.get('perf') === '1';

const hranilishche = new HranilishcheBrauzera();
const progress = zagruzitProgress(hranilishche);

let mir = new Mir(MIR);
let ur: ZagruzhennyyUroven | null = null;
let telo: Telo;
let igra: Igra | null = null;
let tekushchiy: Uroven = urovenPoId(params.get('uroven') ?? '') ?? (UROVNI[0] as Uroven);
let ekranPokazan = false;
let zapis = new Zapis();
let prizrak: Prizrak | null = null;

function zapustitUroven(u: Uroven): void {
  tekushchiy = u;
  mir = new Mir(MIR);
  ur = zagruzitUroven(mir, u);
  telo = new Telo(mir, u.start[0], u.start[1]);
  igra = new Igra(mir, telo, ur);
  statisty.length = 0;
  ekranPokazan = false;
  ekran.classList.remove('pokazan');
  zapis = new Zapis();
  prizrak = null;
  if (u.rezhim === 'zherlo') {
    const luchshaya = progress.urovni[u.id]?.zapis;
    if (luchshaya && luchshaya.length) prizrak = new Prizrak(u, luchshaya);
  }
  document.title = `TUFF ${u.id} ${u.nazvanie}`;
}

const ekran = document.getElementById('ekran') as HTMLDivElement;
const ekranZagolovok = document.getElementById('ekran-zagolovok') as HTMLElement;
const ekranZvezdy = document.getElementById('ekran-zvezdy') as HTMLElement;
const ekranTekst = document.getElementById('ekran-tekst') as HTMLElement;
const knopkaDalshe = document.getElementById('knopka-dalshe') as HTMLButtonElement;
const knopkaEshche = document.getElementById('knopka-eshche') as HTMLButtonElement;

function pokazatKonec(): void {
  if (!igra || !ur) return;
  ekranPokazan = true;
  const serdca = ur.sushchnosti.filter((s) => s.tip === 'serdce').map((s) => s.sobrana);
  const zherlo = tekushchiy.rezhim === 'zherlo';
  const bylo = progress.urovni[tekushchiy.id]?.luchsheeVremya ?? 0;
  const rez = zapisatRezultat(progress, tekushchiy.id, {
    takty: igra.takty,
    ochki: igra.ochki,
    serdca,
    porogOchkov: porogOchkov(tekushchiy),
    zapis: zherlo ? zapis.takty : undefined,
  });
  sohranitProgress(hranilishche, progress);
  const sek = igra.takty / 60;
  const vremya = `${Math.floor(sek / 60)}:${String(Math.floor(sek % 60)).padStart(2, '0')}`;
  ekranZagolovok.textContent = `${tekushchiy.nazvanie}: пройден`;
  ekranZvezdy.textContent = '★'.repeat(rez.zvezdy) + '☆'.repeat(3 - rez.zvezdy);
  if (zherlo) {
    const rekord = bylo === 0 || igra.takty <= bylo ? '  новый рекорд' : '';
    ekranTekst.textContent = `время ${vremya}${rekord}  самое длинное падение ${igra.dlinneysheePadenie.toFixed(1)}`;
  } else {
    ekranTekst.textContent = `время ${vremya}  очки ${igra.ochki}  сердца ${igra.serdca}/${serdca.length}  смерти ${igra.smerti}`;
  }
  knopkaDalshe.style.display = sleduyushchiy(tekushchiy.id) ? '' : 'none';
  ekran.classList.add('pokazan');
}

knopkaDalshe.addEventListener('click', () => {
  const sl = sleduyushchiy(tekushchiy.id);
  if (sl) zapustitUroven(sl);
});
knopkaEshche.addEventListener('click', () => zapustitUroven(tekushchiy));

// Меню уровней: карта мира со звёздами и замками
const menyu = document.getElementById('menyu') as HTMLDivElement;
const menyuSpisok = document.getElementById('menyu-spisok') as HTMLDivElement;
const menyuKnopka = document.getElementById('menyu-knopka') as HTMLButtonElement;
const menyuZakryt = document.getElementById('menyu-zakryt') as HTMLButtonElement;
let menyuPokazano = false;

function proyden(id: string): boolean {
  return progress.urovni[id]?.proyden ?? false;
}
function zvyozd(id: string): number {
  return progress.urovni[id]?.zvezdy ?? 0;
}

function pokazatMenyu(): void {
  menyuSpisok.replaceChildren();
  for (const u of UROVNI) {
    const otkryt = urovenOtkryt(u, proyden, zvyozd);
    const el = document.createElement('div');
    el.className = `uroven${otkryt ? '' : ' zakryt'}`;
    const z = zvyozd(u.id);
    const pr = progress.urovni[u.id];
    const vremya =
      u.rezhim === 'zherlo' && pr?.luchsheeVremya
        ? ` ${Math.floor(pr.luchsheeVremya / 3600)}:${String(Math.floor((pr.luchsheeVremya / 60) % 60)).padStart(2, '0')}`
        : '';
    el.innerHTML = `<span>${u.id} ${u.nazvanie}${vremya}</span><span class="z">${otkryt ? '★'.repeat(z) + '☆'.repeat(3 - z) : `🔒 ${u.rezhim === 'zherlo' ? `${u.zvyozdDlyaOtkrytiya ?? 12}★` : ''}`}</span>`;
    if (otkryt)
      el.addEventListener('click', () => {
        skrytMenyu();
        zapustitUroven(u);
      });
    menyuSpisok.appendChild(el);
  }
  menyu.classList.add('pokazan');
  menyuPokazano = true;
}
function skrytMenyu(): void {
  menyu.classList.remove('pokazan');
  menyuPokazano = false;
}
menyuKnopka.addEventListener('click', () => (menyuPokazano ? skrytMenyu() : pokazatMenyu()));
menyuZakryt.addEventListener('click', skrytMenyu);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') menyuPokazano ? skrytMenyu() : pokazatMenyu();
});

const statisty: Telo[] = [];

if (komnata) {
  mir.dobavitOtrezok(-10, 0, 10, 0);
  mir.dobavitOtrezok(-10, 8, -10, 0);
  mir.dobavitOtrezok(10, 0, 10, 8);
  mir.dobavitOtrezok(10, 8, -10, 8);
  mir.dobavitOtrezok(2, 2, 6, 2, 1, 1, 0);
  mir.dobavitOtrezok(6, 0, 6, 2, 1, 1, 0);
  mir.dobavitOtrezok(-6, 0, -6, 1.2, 1, 1, 0);
  mir.dobavitOtrezok(-6.6, 0, -6.6, 1.2, 1, 1, 0);
  mir.dobavitOtrezok(-3, 3.5, 0, 3.5, 0.05, 0, 0);
  telo = new Telo(mir, 0, 1.5);
} else {
  zapustitUroven(tekushchiy);
}

if (perf) for (let i = 0; i < 24; i++) statisty.push(new Telo(mir, 3 + i * 0.7, 3 + (i % 4) * 1.2));

const vvod = new Vvod(document.body);
vvod.nastroyki.pomoshchnikKasaniya = progress.nastroyki.pomoshchnik;
const stsena = new Stsena();
const hud = document.getElementById('hud') as HTMLDivElement;
const ui = new Graphics();

let nakoplen = 0;
let last = performance.now();
let kadrov = 0;
let fpsT = last;
let fps = 0;
let taktMs = 0;

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
  if (igra) {
    const w = window.innerWidth;
    ui.rect(w / 2 - 100, 12, 200, 6);
    ui.fill({ color: 0xffffff, alpha: 0.15 });
    ui.rect(w / 2 - 100, 12, (200 * igra.zhar) / 100, 6);
    ui.fill({ color: 0xff8c3a, alpha: 0.9 });
  }
}

async function start(): Promise<void> {
  await stsena.init();
  stsena.app.stage.addChild(ui);
  stsena.app.ticker.add(() => {
    const now = performance.now();
    nakoplen += Math.min(0.1, (now - last) / 1000);
    last = now;
    if (menyuPokazano || ekranPokazan) nakoplen = 0; // пауза: симуляция стоит
    while (nakoplen >= MIR.shag) {
      vvod.uStenyNapravlenie = telo.stenaSboku();
      const nam = vvod.sobrat();
      const t0 = performance.now();
      if (igra && !igra.gotovo && tekushchiy.rezhim === 'zherlo') zapis.dobavit(nam);
      prizrak?.shag();
      igra?.doShaga();
      telo.primenit(nam, igra?.korkaSredy ?? false);
      for (const s of statisty) s.primenit(nam);
      mir.shag();
      telo.posle(nam);
      for (const s of statisty) s.posle(nam);
      igra?.takt(nam);
      if (igra?.gotovo && !ekranPokazan) pokazatKonec();
      taktMs = taktMs * 0.95 + (performance.now() - t0) * 0.05;
      nakoplen -= MIR.shag;
    }
    telo.schitatCentr();
    stsena.sledit(telo.cx, telo.cy, ur?.dannye.granicy ?? null);
    stsena.risovat(
      mir,
      [telo, ...statisty],
      nakoplen / MIR.shag,
      ur,
      igra?.vragi ?? [],
      igra?.boss ?? null,
      prizrak && !prizrak.zakonchen ? prizrak.telo : null,
    );
    risovatUi();
    kadrov++;
    if (now - fpsT > 500) {
      fps = (kadrov * 1000) / (now - fpsT);
      kadrov = 0;
      fpsT = now;
    }
    const g = telo.gabarity();
    const sostoyanie = igra
      ? tekushchiy.rezhim === 'zherlo'
        ? `время ${(igra.takty / 60).toFixed(1)} с  высота ${igra.maksVysota.toFixed(1)}  падение ${igra.dlinneysheePadenie.toFixed(1)}`
        : `жар ${igra.zhar.toFixed(0)}  очки ${igra.ochki}  сердца ${igra.serdca}/3  смерти ${igra.smerti}${igra.gotovo ? '  УРОВЕНЬ ПРОЙДЕН' : ''}`
      : '';
    hud.textContent = `fps ${fps.toFixed(0)}  такт ${taktMs.toFixed(2)} мс  точек ${mir.n}\nw ${g.w.toFixed(2)} h ${g.h.toFixed(2)}  промахи ${vvod.promahi}/${vvod.nazhatiy}\n${sostoyanie}\nWASD/стрелки  J Вязкость  K Расплав  L Корка  Пробел Выброс`;
  });
}

start();
