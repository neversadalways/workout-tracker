import { DELOAD } from '../data/plan';
import type { DeloadState } from '../types';
import { daysBetween, startOfWeek } from './dates';
import { roundNearest } from './progression';

/** Training week number (1-based) for a date, counted from the program start Sunday. */
export function weekNumber(programStart: string | null, today: string): number {
  if (!programStart) return 1;
  return Math.max(1, Math.floor(daysBetween(startOfWeek(programStart), today) / 7) + 1);
}

export function isDeloadActive(state: DeloadState, week: number): boolean {
  return state.activeWeek === week;
}

/** True when a full block of training weeks has passed since the block started. */
export function isDeloadDue(state: DeloadState, week: number, every = DELOAD.everyWeeks): boolean {
  if (isDeloadActive(state, week)) return false;
  return week - state.cycleStartWeek >= every;
}

export function startDeload(state: DeloadState, week: number, date: string): DeloadState {
  return {
    ...state,
    activeWeek: week,
    cycleStartWeek: week + 1,
    history: [...state.history, { week, action: 'deload', date }],
  };
}

/** Skip: start a new block from this week (prompt again after another full block). */
export function skipDeload(state: DeloadState, week: number, date: string): DeloadState {
  return {
    ...state,
    cycleStartWeek: week,
    history: [...state.history, { week, action: 'skip', date }],
  };
}

export function endDeload(state: DeloadState): DeloadState {
  return { ...state, activeWeek: null };
}

export function deloadSets(sets: number, factor = DELOAD.volumeFactor): number {
  return Math.max(1, Math.round(sets * factor));
}

export function deloadWeight(weight: number | null, step: number, factor = DELOAD.weightFactor): number | null {
  if (weight == null) return null;
  return Math.min(weight, roundNearest(weight * factor, step));
}
