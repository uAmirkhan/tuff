// Список уровней кампании в порядке прохождения.
import type { Uroven } from './format';
import { UROVEN_1_1 } from './urovni/1-1';
import { UROVEN_1_2 } from './urovni/1-2';
import { UROVEN_1_3 } from './urovni/1-3';
import { UROVEN_1_4 } from './urovni/1-4';
import { UROVEN_1_5 } from './urovni/1-5';
import { UROVEN_1_6 } from './urovni/1-6';
import { UROVEN_1_7 } from './urovni/1-7';
import { UROVEN_K1_1 } from './urovni/k1-1';
import { UROVEN_K1_2 } from './urovni/k1-2';
import { UROVEN_K1_3 } from './urovni/k1-3';
import { UROVEN_K1_4 } from './urovni/k1-4';
import { UROVEN_K1_5 } from './urovni/k1-5';
import { UROVEN_K1_6 } from './urovni/k1-6';
import { UROVEN_K1_7 } from './urovni/k1-7';
import { UROVEN_PROBA } from './urovni/proba-elementov';
import { UROVEN_ZH_1 } from './urovni/zherlo-1';

export const UROVNI: Uroven[] = [
  UROVEN_1_1,
  UROVEN_1_2,
  UROVEN_1_3,
  UROVEN_1_4,
  UROVEN_1_5,
  UROVEN_1_6,
  UROVEN_1_7,
  UROVEN_ZH_1,
];

// Испытательные уровни: не в кампании, открываются по ?uroven=<id>
export const ISPYTATELNYE: Uroven[] = [
  UROVEN_PROBA,
  UROVEN_K1_1,
  UROVEN_K1_2,
  UROVEN_K1_3,
  UROVEN_K1_4,
  UROVEN_K1_5,
  UROVEN_K1_6,
  UROVEN_K1_7,
]; // k1-*: черновики яруса 1, в кампанию после сборки яруса

export function urovenPoId(id: string): Uroven | undefined {
  return UROVNI.find((u) => u.id === id) ?? ISPYTATELNYE.find((u) => u.id === id);
}

export function sleduyushchiy(id: string): Uroven | undefined {
  const i = UROVNI.findIndex((u) => u.id === id);
  return i === -1 ? undefined : UROVNI[i + 1];
}

// Сумма звёзд мира по прогрессу
export function zvyozdMira(zvezdy: (id: string) => number): number {
  let s = 0;
  for (const u of UROVNI) if (u.rezhim !== 'zherlo') s += zvezdy(u.id);
  return s;
}

// Открыт ли уровень: первый всегда; кампания — если пройден предыдущий; Жерло — по звёздам
export function urovenOtkryt(
  u: Uroven,
  proyden: (id: string) => boolean,
  zvezdy: (id: string) => number,
): boolean {
  if (u.rezhim === 'zherlo') return zvyozdMira(zvezdy) >= (u.zvyozdDlyaOtkrytiya ?? 12);
  const i = UROVNI.findIndex((x) => x.id === u.id);
  if (i <= 0) return true;
  const prev = UROVNI[i - 1] as Uroven;
  return proyden(prev.id);
}

// Порог очков на вторую звезду: 60% от суммы всех наград уровня
export function porogOchkov(u: Uroven): number {
  const ochki: Record<string, number> = { zharkamen: 10, zharkamenSredniy: 50, serdce: 500 };
  let s = 0;
  for (const o of u.obekty) s += ochki[o.tip] ?? 0;
  return Math.round(s * 0.6);
}
