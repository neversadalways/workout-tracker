import type { ExerciseLog, ExercisePlan, SetLog, WorkoutLog } from '../types';

/** One past session of an exercise. */
export interface HistoryEntry {
  date: string;
  deload: boolean;
  log: ExerciseLog;
}

export type SuggestionAction =
  | 'start' // no history yet
  | 'increase' // hit top of range in every set
  | 'hold' // keep working
  | 'decrease' // missed bottom of range twice in a row
  | 'back-hold' // back felt off last time
  | 'back-decrease' // back felt off twice in a row
  | 'progress-time'; // bodyweight / timed exercise at top of range

export interface Suggestion {
  weight: number | null;
  action: SuggestionAction;
  message: string;
  lastWeight: number | null;
}

/** Fraction removed when missing the bottom of the range twice (≈ 5–10%). */
export const MISS_REDUCTION = 0.075;
/** Fraction removed when the back felt off twice in a row. */
export const BACK_REDUCTION = 0.05;

const clean = (n: number) => Math.round(n * 100) / 100;

/** Round down to the nearest multiple of step (step <= 0 → 0.5 kg). */
export function roundDown(value: number, step: number): number {
  const s = step > 0 ? step : 0.5;
  return clean(Math.floor(value / s + 1e-9) * s);
}

export function roundNearest(value: number, step: number): number {
  const s = step > 0 ? step : 0.5;
  return clean(Math.round(value / s) * s);
}

/** Lower the weight by a fraction, guaranteeing at least one step down. */
export function reduce(weight: number, fraction: number, step: number): number {
  let w = roundDown(weight * (1 - fraction), step);
  if (w >= weight) w = clean(weight - (step > 0 ? step : 0.5));
  return Math.max(0, w);
}

export function completedSets(log: ExerciseLog): SetLog[] {
  return log.sets.filter((s) => s.done && s.reps != null);
}

/** Heaviest weight used in a completed set. */
export function workingWeight(log: ExerciseLog): number | null {
  const ws = completedSets(log)
    .map((s) => s.weight)
    .filter((w): w is number => w != null);
  return ws.length ? Math.max(...ws) : null;
}

/** Every planned set completed at or above the top of the range. */
export function hitTop(ex: ExercisePlan, log: ExerciseLog): boolean {
  const done = completedSets(log);
  return done.length >= ex.sets && done.every((s) => (s.reps ?? 0) >= ex.repMax);
}

/** At least one completed set below the bottom of the range. */
export function missedBottom(ex: ExercisePlan, log: ExerciseLog): boolean {
  const done = completedSets(log);
  return done.length > 0 && done.some((s) => (s.reps ?? 0) < ex.repMin);
}

/** RPE logged well above target (> target + 1) → don't add weight yet. */
function rpeTooHigh(ex: ExercisePlan, log: ExerciseLog): boolean {
  if (ex.targetRpe == null) return false;
  return completedSets(log).some((s) => s.rpe != null && s.rpe > ex.targetRpe! + 1);
}

/**
 * Double-progression suggestion for the next session.
 * @param history past sessions of this exercise, most recent first.
 */
export function suggest(ex: ExercisePlan, history: HistoryEntry[]): Suggestion {
  const unit = ex.unit === 'sec' ? 's' : '';
  const range = ex.repMin === ex.repMax ? `${ex.repMax}${unit}` : `${ex.repMin}–${ex.repMax}${unit}`;

  // Back-safety looks at the most recent session, deload or not.
  const latest = history[0];
  // Progression ignores deload sessions (you return to pre-deload weights).
  const normal = history.filter((h) => !h.deload && completedSets(h.log).length > 0);
  const last = normal[0];

  if (!last) {
    const w = latest ? workingWeight(latest.log) : null;
    return {
      weight: w ?? ex.startWeight ?? null,
      action: 'start',
      message: ex.startWeight != null || w != null ? 'Starting weight' : 'Pick a starting weight',
      lastWeight: w,
    };
  }

  const lastWeight = workingWeight(last.log);

  if (ex.backSafety && latest?.log.backFlag) {
    const base = workingWeight(latest.log) ?? lastWeight;
    const twice = history[1]?.log.backFlag === true;
    if (base == null) {
      return { weight: null, action: 'back-hold', message: 'Back felt off last time — go light and stop if it hurts.', lastWeight };
    }
    if (twice) {
      return {
        weight: reduce(base, BACK_REDUCTION, ex.increment),
        action: 'back-decrease',
        message: 'Back felt off twice in a row — lowering ~5%. Brace hard, controlled reps, stop if it hurts.',
        lastWeight,
      };
    }
    return {
      weight: base,
      action: 'back-hold',
      message: 'Back felt off last time — keep the weight. Warm up well, brace, stop at the first twinge.',
      lastWeight,
    };
  }

  if (ex.noWeight || lastWeight == null) {
    if (hitTop(ex, last.log)) {
      return { weight: lastWeight, action: 'progress-time', message: `Hit ${range} on all sets — make it harder (more time / tougher variation).`, lastWeight };
    }
    return { weight: lastWeight, action: 'hold', message: `Aim for ${range} on all sets.`, lastWeight };
  }

  if (hitTop(ex, last.log)) {
    if (rpeTooHigh(ex, last.log)) {
      return { weight: lastWeight, action: 'hold', message: `Reps were there but RPE was above ${ex.targetRpe} — repeat the weight.`, lastWeight };
    }
    const w = clean(lastWeight + ex.increment);
    return { weight: w, action: 'increase', message: `Hit ${range} on all sets — add ${ex.increment} kg.`, lastWeight };
  }

  const prev = normal[1];
  if (missedBottom(ex, last.log) && prev && missedBottom(ex, prev.log)) {
    const w = reduce(lastWeight, MISS_REDUCTION, ex.increment);
    return { weight: w, action: 'decrease', message: `Missed ${ex.repMin}${unit} two sessions in a row — drop to rebuild.`, lastWeight };
  }

  return {
    weight: lastWeight,
    action: 'hold',
    message: missedBottom(ex, last.log) ? `Missed ${ex.repMin}${unit} last time — same weight, try again.` : `Same weight — aim for ${range} on all sets.`,
    lastWeight,
  };
}

/** Completed sessions of one exercise, most recent first. */
export function exerciseHistory(workouts: WorkoutLog[], exerciseId: string): HistoryEntry[] {
  const out: HistoryEntry[] = [];
  for (const w of workouts) {
    for (const log of w.exercises) {
      if (log.exerciseId === exerciseId) out.push({ date: w.date, deload: w.deload, log });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Epley estimated 1RM. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return weight;
  return clean(weight * (1 + reps / 30));
}

export function best1RM(log: ExerciseLog): number | null {
  const vals = completedSets(log)
    .filter((s) => s.weight != null && s.weight > 0)
    .map((s) => estimate1RM(s.weight!, s.reps!));
  return vals.length ? Math.max(...vals) : null;
}
