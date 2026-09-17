// Список уровней кампании в порядке прохождения.
import type { Uroven } from './format';
import { UROVEN_1_1 } from './urovni/1-1';
import { UROVEN_1_2 } from './urovni/1-2';
import { UROVEN_1_3 } from './urovni/1-3';
import { UROVEN_1_4 } from './urovni/1-4';
import { UROVEN_1_5 } from './urovni/1-5';
import { UROVEN_1_6 } from './urovni/1-6';

export const UROVNI: Uroven[] = [
  UROVEN_1_1,
  UROVEN_1_2,
  UROVEN_1_3,
  UROVEN_1_4,
  UROVEN_1_5,
  UROVEN_1_6,
];

export function urovenPoId(id: string): Uroven | undefined {
  return UROVNI.find((u) => u.id === id);
}

export function sleduyushchiy(id: string): Uroven | undefined {
  const i = UROVNI.findIndex((u) => u.id === id);
  return i === -1 ? undefined : UROVNI[i + 1];
}

// Порог очков на вторую звезду: 60% от суммы всех наград уровня
export function porogOchkov(u: Uroven): number {
  const ochki: Record<string, number> = { zharkamen: 10, zharkamenSredniy: 50, serdce: 500 };
  let s = 0;
  for (const o of u.obekty) s += ochki[o.tip] ?? 0;
  return Math.round(s * 0.6);
}
