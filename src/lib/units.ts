import type { ExerciseLog, ExercisePlan, Settings, WeightUnit } from '../types';
import { roundNearest, suggest, type HistoryEntry, type Suggestion } from './progression';

export const LB_PER_KG = 2.20462;

/** Unit an exercise is logged in: Settings override → plan default → kg. */
export function unitFor(ex: Pick<ExercisePlan, 'id' | 'weightUnit'>, settings: Pick<Settings, 'exerciseUnits'>): WeightUnit {
  return settings.exerciseUnits?.[ex.id] ?? ex.weightUnit ?? 'kg';
}

/** Convert a weight between units, rounded to the nearest step (default 0.1). */
export function convertWeight(w: number, from: WeightUnit, to: WeightUnit, step = 0.1): number {
  if (from === to) return w;
  return roundNearest(from === 'kg' ? w * LB_PER_KG : w / LB_PER_KG, step);
}

export function toKg(w: number, unit: WeightUnit | undefined): number {
  return unit === 'lb' ? w / LB_PER_KG : w;
}

/** Sensible equivalent progression step in the other unit (2.5 kg ↔ 5 lb, 1 kg ↔ 2.5 lb). */
export function convertIncrement(inc: number, from: WeightUnit, to: WeightUnit): number {
  if (from === to || inc <= 0) return inc;
  if (to === 'lb') return inc <= 1 ? 2.5 : inc <= 2.5 ? 5 : 10;
  return inc <= 2.5 ? 1 : inc <= 5 ? 2.5 : 5;
}

/** The plan entry expressed in the given unit (increment and start weight converted). */
export function planInUnit(ex: ExercisePlan, unit: WeightUnit): ExercisePlan {
  const from = ex.weightUnit ?? 'kg';
  if (from === unit) return { ...ex, weightUnit: unit };
  const increment = convertIncrement(ex.increment, from, unit);
  return {
    ...ex,
    weightUnit: unit,
    increment,
    startWeight: ex.startWeight == null ? undefined : convertWeight(ex.startWeight, from, unit, increment || 0.5),
  };
}

/** A logged exercise with its weights converted to the given unit. */
export function logInUnit(log: ExerciseLog, unit: WeightUnit, step = 0.1): ExerciseLog {
  const from = log.weightUnit ?? 'kg';
  if (from === unit) return log;
  return {
    ...log,
    weightUnit: unit,
    sets: log.sets.map((s) => ({ ...s, weight: s.weight == null ? null : convertWeight(s.weight, from, unit, step) })),
  };
}

/** Progression suggestion in the given unit, converting any history logged in the other unit. */
export function suggestIn(ex: ExercisePlan, history: HistoryEntry[], unit: WeightUnit): Suggestion {
  const p = planInUnit(ex, unit);
  const step = p.increment || 0.5;
  return suggest(
    p,
    history.map((h) => ({ ...h, log: logInUnit(h.log, unit, step) })),
  );
}
