import type { ExerciseLog, ExercisePlan } from '../types';
import type { SuggestionAction } from '../lib/progression';
import { completedSets } from '../lib/progression';

export function targetText(ex: ExercisePlan, sets = ex.sets): string {
  const u = ex.unit === 'sec' ? ' sec' : '';
  const reps = ex.repMin === ex.repMax ? `${ex.repMax}` : `${ex.repMin}–${ex.repMax}`;
  return `${sets} × ${reps}${u}${ex.targetRpe ? ` @ RPE ${ex.targetRpe}` : ''}`;
}

export function kg(w: number | null | undefined): string {
  return w == null ? '—' : `${w} kg`;
}

/** "60 kg × 8, 8, 7" */
export function setsSummary(log: ExerciseLog, unit?: 'reps' | 'sec'): string {
  const done = completedSets(log);
  if (!done.length) return 'no sets';
  const weights = [...new Set(done.map((s) => s.weight))];
  const reps = done.map((s) => `${s.reps}${unit === 'sec' ? 's' : ''}`).join(', ');
  if (weights.length === 1) return weights[0] == null ? reps : `${weights[0]} kg × ${reps}`;
  return done.map((s) => `${s.weight ?? 'BW'}×${s.reps}`).join(', ');
}

export const ACTION_ICON: Record<SuggestionAction, string> = {
  start: '•',
  increase: '▲',
  hold: '=',
  decrease: '▼',
  'back-hold': '⚠',
  'back-decrease': '⚠',
  'progress-time': '▲',
};

export const ACTION_CLASS: Record<SuggestionAction, string> = {
  start: 'neutral',
  increase: 'up',
  hold: 'neutral',
  decrease: 'down',
  'back-hold': 'warn',
  'back-decrease': 'warn',
  'progress-time': 'up',
};
