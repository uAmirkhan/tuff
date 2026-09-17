// Точка входа: уровень 1-1 по умолчанию, ?komnata=1 тестовая комната, ?perf=1 замер.
import { Graphics, Text } from 'pixi.js';
import { Zvuk } from './audio/zvuk';
import { MIR } from './game/config/telo';
import { Igra } from './game/igra';
import { PUSTOE, Telo } from './game/telo';
import { Prizrak, Zapis } from './game/zapis';
import { Vvod } from './input/vvod';
import type { Uroven } from './level/format';
import { porogOchkov, sleduyushchiy, UROVNI, urovenOtkryt, urovenPoId } from './level/spisok';
import { type ZagruzhennyyUroven, zagruzitUroven } from './level/zagruzka';
import { Analitika, uchastok } from './meta/analitika';
import { nazvanieUrovnya, t, vybratYazyk, type Yazyk } from './meta/lokalizaciya';
import {
  HranilishcheBrauzera,
  sohranitProgress,
  zagruzitProgress,
  zapisatRezultat,
} from './meta/sohranenie';
import { Mir } from './physics/mir';
import { vybratPloshchadku } from './platform/ploshchadka';
import { Stsena } from './render/stsena';

const params = new URLSearchParams(location.search);
const komnata = params.get('komnata') === '1';
const perf = params.get('perf') === '1';
// ?chisto=1: без отладочного текста и сенсорных кнопок, для кадров на страницу порталов
const chisto = params.get('chisto') === '1';
// ?otladka=1: строки fps, такта и промахов в HUD (тестерам не показываются)
const otladka = params.get('otladka') === '1' || perf;
// сенсорные кнопки рисуются на устройствах с касанием или после первого касания
const estKasanie = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;

const hranilishche = new HranilishcheBrauzera();
const progress = zagruzitProgress(hranilishche);
const ploshchadka = vybratPloshchadku(params.get('ploshchadka'), location.hostname);
let yazyk: Yazyk = vybratYazyk(navigator.language || 'ru');
const analitika = new Analitika((s) => {
  try {
    localStorage.setItem('tuff-analitika', s);
  } catch {
    // без хранилища
  }
});
let pauzaPloshchadki = false;
ploshchadka.onPauza((p) => {
  pauzaPloshchadki = p;
});
analitika.sobytie('session_start', { ploshchadka: ploshchadka.imya, yazyk });

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
  analitika.sobytie('level_start', { uroven: u.id });
  ploshchadka.geympleyStart();
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
  ploshchadka.geympleyStop();
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
  ploshchadka.sohranit(JSON.stringify(progress)).catch(() => undefined);
  analitika.sobytie('level_complete', {
    uroven: tekushchiy.id,
    vremya: Math.round(igra.takty / 60),
    smerti: igra.smerti,
    ochki: igra.ochki,
    zvezdy: rez.zvezdy,
  });
  if (zherlo) ploshchadka.rekord('zherlo1', igra.takty).catch(() => undefined);
  const sek = igra.takty / 60;
  const vremya = `${Math.floor(sek / 60)}:${String(Math.floor(sek % 60)).padStart(2, '0')}`;
  ekranZagolovok.textContent = `${nazvanieUrovnya(yazyk, tekushchiy.id, tekushchiy.nazvanie)}: ${t(yazyk, 'proyden')}`;
  ekranZvezdy.textContent = '★'.repeat(rez.zvezdy) + '☆'.repeat(3 - rez.zvezdy);
  if (zherlo) {
    const rekord = bylo === 0 || igra.takty <= bylo ? `  ${t(yazyk, 'rekord')}` : '';
    ekranTekst.textContent = `${t(yazyk, 'vremya')} ${vremya}${rekord}  ${t(yazyk, 'padenie')} ${igra.dlinneysheePadenie.toFixed(1)}`;
  } else {
    ekranTekst.textContent = `${t(yazyk, 'vremya')} ${vremya}  ${t(yazyk, 'ochki')} ${igra.ochki}  ${t(yazyk, 'serdca')} ${igra.serdca}/${serdca.length}  ${t(yazyk, 'smerti')} ${igra.smerti}`;
  }
  // реклама между уровнями: только здесь, симуляция стоит, звук глушится на время ролика
  zvuk.ustanovitGromkost(0);
  ploshchadka.reklama().finally(() => {
    zvuk.ustanovitGromkost(zvuk.vklyuchen ? 0.6 : 0);
    analitika.sobytie('ad_shown', { tip: 'mezhdu-urovnyami', uroven: tekushchiy.id });
  });
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
    el.innerHTML = `<span>${u.id} ${nazvanieUrovnya(yazyk, u.id, u.nazvanie)}${vremya}</span><span class="z">${otkryt ? '★'.repeat(z) + '☆'.repeat(3 - z) : `🔒 ${u.rezhim === 'zherlo' ? `${u.zvyozdDlyaOtkrytiya ?? 12}★` : ''}`}</span>`;
    if (otkryt)
      el.addEventListener('click', () => {
        skrytMenyu();
        zapustitUroven(u);
      });
    menyuSpisok.appendChild(el);
  }
  menyu.classList.add('pokazan');
  menyuPokazano = true;
  ploshchadka.geympleyStop();
  if (igra && !igra.gotovo) {
    telo.schitatCentr();
    analitika.sobytie('level_quit', {
      uroven: tekushchiy.id,
      uchastok: uchastok(telo.cx, tekushchiy.granicy.maxX),
      vremya: Math.round(igra.takty / 60),
    });
  }
}
function skrytMenyu(): void {
  menyu.classList.remove('pokazan');
  menyuPokazano = false;
  ploshchadka.geympleyStart();
}
menyuKnopka.addEventListener('click', () => (menyuPokazano ? skrytMenyu() : pokazatMenyu()));
menyuZakryt.addEventListener('click', skrytMenyu);
window.addEventListener('keydown', (e) => {
  if (e.code === 'Escape') menyuPokazano ? skrytMenyu() : pokazatMenyu();
});

// Свободные точки уровня для статистов замера: сетка по ширине, точка и её окрестность 0,6 вне многоугольников
function svobodnyeTochki(u: Uroven, skolko: number): [number, number][] {
  const vnutri = (t: readonly (readonly [number, number])[], x: number, y: number): boolean => {
    let vn = false;
    for (let i = 0, j = t.length - 1; i < t.length; j = i++) {
      const [xi, yi] = t[i] as [number, number];
      const [xj, yj] = t[j] as [number, number];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) vn = !vn;
    }
    return vn;
  };
  const zanyata = (x: number, y: number): boolean =>
    u.poligony.some((p) =>
      [
        [0, 0],
        [0.6, 0],
        [-0.6, 0],
        [0, 0.6],
        [0, -0.6],
      ].some(([dx, dy]) => vnutri(p.tochki, x + (dx as number), y + (dy as number))),
    );
  const res: [number, number][] = [];
  for (const y of [1.2, 4, 7, 10])
    for (let x = u.granicy.minX + 1.5; x < u.granicy.maxX - 1 && res.length < skolko; x += 1.8)
      if (!zanyata(x, y)) res.push([x, y]);
  return res;
}
const statisty: Telo[] = [];
const STATIST = { ...PUSTOE, vyazkost: true }; // статист липнет там, где приземлился, и не скатывается в кучу

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

// Замер: 24 статиста (400 точек) врозь по уровню, без ввода, чтобы мерить решатель, а не кучу тел.
// Куча из 25 тел в игре не бывает (не больше шести контуров), а стоит она в 15 раз дороже (BRIEF, грабли).
if (perf)
  for (const [x, y] of svobodnyeTochki(tekushchiy, 24)) {
    const s = new Telo(mir, x, y);
    mir.otklyuchitKontaktTel(s.kontur); // статисты не сталкиваются: герой сгребал их в кучу, куча стоит в 15 раз дороже
    statisty.push(s);
  }

const zvuk = new Zvuk();
zvuk.vklyuchen = progress.nastroyki.zvuk;
// звук включается первым жестом: требование браузеров
const razbuditZvuk = () => {
  zvuk.vklyuchit();
  zvuk.muzyka(true);
};
window.addEventListener('pointerdown', razbuditZvuk, { once: true });
window.addEventListener('keydown', razbuditZvuk, { once: true });

const vvod = new Vvod(document.body);
vvod.nastroyki.pomoshchnikKasaniya = progress.nastroyki.pomoshchnik;
const stsena = new Stsena();
const hud = document.getElementById('hud') as HTMLDivElement;
const ui = new Graphics();
const znachkiTekst: Text[] = [];

let nakoplen = 0;
let last = performance.now();
let kadrov = 0;
let fpsT = last;
let fps = 0;
let taktMs = 0;

function risovatUi(): void {
  ui.clear();
  if (chisto) return;
  if (estKasanie || vvod.tachAktiven)
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
  // площадка: SDK и язык; сохранение с площадки перекрывает локальное, если оно новее по числу уровней
  try {
    await ploshchadka.gotova();
    yazyk = vybratYazyk(ploshchadka.yazyk());
    const s = await ploshchadka.zagruzit();
    if (s) {
      const p = JSON.parse(s) as typeof progress;
      if (Object.keys(p.urovni ?? {}).length >= Object.keys(progress.urovni).length)
        Object.assign(progress, p);
    }
  } catch (e) {
    analitika.sobytie('platform_error', { tekst: String(e) });
  }
  menyuKnopka.textContent = t(yazyk, 'urovni');
  if (chisto) menyuKnopka.style.display = 'none';
  (document.getElementById('menyu-zagolovok') as HTMLElement).textContent = t(yazyk, 'mir1');
  menyuZakryt.textContent = t(yazyk, 'igrat');
  knopkaDalshe.textContent = t(yazyk, 'dalshe');
  knopkaEshche.textContent = t(yazyk, 'eshche');
  ploshchadka.igraGotova();
  ploshchadka.geympleyStart();
  stsena.app.stage.addChild(ui);
  stsena.app.ticker.add(() => {
    const now = performance.now();
    nakoplen += Math.min(0.1, (now - last) / 1000);
    last = now;
    if (menyuPokazano || ekranPokazan || pauzaPloshchadki) nakoplen = 0; // пауза: симуляция стоит
    while (nakoplen >= MIR.shag) {
      vvod.uStenyNapravlenie = telo.stenaSboku();
      const nam = vvod.sobrat();
      const t0 = performance.now();
      if (igra && !igra.gotovo && tekushchiy.rezhim === 'zherlo') zapis.dobavit(nam);
      prizrak?.shag();
      igra?.doShaga();
      telo.primenit(nam, igra?.korkaSredy ?? false);
      for (const s of statisty) s.primenit(STATIST);
      mir.shag();
      telo.posle(nam);
      for (const s of statisty) s.posle(STATIST);
      igra?.takt(nam);
      for (const s of igra?.sobytiya ?? []) {
        if (s.tip === 'smert') {
          telo.schitatCentr();
          analitika.sobytie('death', {
            uroven: tekushchiy.id,
            uchastok: uchastok(telo.cx, tekushchiy.granicy.maxX),
            prichina: s.prichina,
          });
        } else if (s.tip === 'gorn')
          analitika.sobytie('checkpoint', { uroven: tekushchiy.id, id: s.id });
      }
      // скорость тела за такт для звука удара
      let sk = 0;
      for (let i = telo.ot; i < telo.ot + telo.n; i++)
        sk += Math.hypot(
          (mir.x[i] as number) - (mir.px[i] as number),
          (mir.y[i] as number) - (mir.py[i] as number),
        );
      zvuk.takt(telo, igra?.sobytiya ?? [], sk / telo.n);
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
    // подписи значков обучения
    for (const tx of znachkiTekst) tx.visible = false;
    stsena.znachki.forEach((z, i) => {
      let tx = znachkiTekst[i];
      if (!tx) {
        tx = new Text({
          text: '',
          style: { fontFamily: 'monospace', fontSize: 22, fill: 0x2a1c17, fontWeight: 'bold' },
        });
        tx.anchor.set(0.5);
        stsena.app.stage.addChild(tx);
        znachkiTekst[i] = tx;
      }
      tx.text = z.tekst;
      tx.position.set(z.x, z.y);
      tx.visible = true;
    });
    if (vvod.nam.vyazkost) stsena.pokazannye.add('J');
    if (vvod.nam.rasplav) stsena.pokazannye.add('K');
    if (vvod.nam.korka) stsena.pokazannye.add('L');
    if (vvod.nam.vybros) stsena.pokazannye.add('␣');
    kadrov++;
    if (now - fpsT > 500) {
      fps = (kadrov * 1000) / (now - fpsT);
      kadrov = 0;
      fpsT = now;
    }
    const g = telo.gabarity();
    const sostoyanie = igra
      ? tekushchiy.rezhim === 'zherlo'
        ? `${t(yazyk, 'vremya')} ${(igra.takty / 60).toFixed(1)}  ${t(yazyk, 'vysota')} ${igra.maksVysota.toFixed(1)}  ${t(yazyk, 'padenie')} ${igra.dlinneysheePadenie.toFixed(1)}`
        : `${t(yazyk, 'zhar')} ${igra.zhar.toFixed(0)}  ${t(yazyk, 'ochki')} ${igra.ochki}  ${t(yazyk, 'serdca')} ${igra.serdca}/3  ${t(yazyk, 'smerti')} ${igra.smerti}`
      : '';
    if (!chisto)
      hud.textContent = [
        otladka ? `fps ${fps.toFixed(0)}  такт ${taktMs.toFixed(2)} мс  точек ${mir.n}` : '',
        otladka
          ? `w ${g.w.toFixed(2)} h ${g.h.toFixed(2)}  промахи ${vvod.promahi}/${vvod.nazhatiy}`
          : '',
        sostoyanie,
        estKasanie ? '' : t(yazyk, 'podskazka'),
      ]
        .filter(Boolean)
        .join('\n');
    // отладочное состояние для прогонов Playwright (положение героя, ввод)
    (window as unknown as { tuff: unknown }).tuff = {
      cx: telo.cx,
      cy: telo.cy,
      nam: { ...vvod.nam },
      sost: telo.sostoyanie,
      tach: vvod.tachAktiven,
    };
  });
}

start();
