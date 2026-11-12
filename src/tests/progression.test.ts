import { describe, expect, it } from 'vitest';
import type { ExerciseLog, ExercisePlan } from '../types';
import { estimate1RM, reduce, suggest, type HistoryEntry } from '../lib/progression';
import { deloadSets, deloadWeight, isDeloadDue, skipDeload, startDeload, weekNumber } from '../lib/deload';

const bench: ExercisePlan = { id: 'bench', name: 'Bench Press', sets: 3, repMin: 5, repMax: 5, startWeight: 67.5, increment: 2.5, main: true };
const curl: ExercisePlan = { id: 'curl', name: 'Lying Leg Curl', sets: 3, repMin: 8, repMax: 10, startWeight: 25, increment: 2.5 };
const lateral: ExercisePlan = { id: 'lat', name: 'Lateral Raises', sets: 3, repMin: 12, repMax: 15, startWeight: 9, increment: 1 };
const squat: ExercisePlan = { id: 'squat', name: 'Squat', sets: 3, repMin: 5, repMax: 5, startWeight: 75, increment: 2.5, backSafety: true, targetRpe: 7 };

function log(weight: number, reps: number[], extra: Partial<ExerciseLog> = {}, rpe: number | null = null): ExerciseLog {
  return { exerciseId: 'x', name: 'x', sets: reps.map((r) => ({ weight, reps: r, rpe, done: true })), ...extra };
}
function entry(date: string, l: ExerciseLog, deload = false): HistoryEntry {
  return { date, deload, log: l };
}

describe('suggest (double progression)', () => {
  it('uses the start weight with no history', () => {
    const s = suggest(bench, []);
    expect(s.action).toBe('start');
    expect(s.weight).toBe(67.5);
  });

  it('adds the increment when the top of the range is hit in all sets', () => {
    const s = suggest(curl, [entry('2026-11-01', log(25, [10, 10, 10]))]);
    expect(s.action).toBe('increase');
    expect(s.weight).toBe(27.5);
  });

  it('uses the small increment for lateral raises', () => {
    const s = suggest(lateral, [entry('2026-11-01', log(9, [15, 15, 15]))]);
    expect(s.weight).toBe(10);
  });

  it('holds when not every set reached the top', () => {
    const s = suggest(curl, [entry('2026-11-01', log(25, [10, 10, 9]))]);
    expect(s.action).toBe('hold');
    expect(s.weight).toBe(25);
  });

  it('holds when fewer sets than planned were completed', () => {
    const s = suggest(curl, [entry('2026-11-01', log(25, [10, 10]))]);
    expect(s.action).toBe('hold');
  });

  it('holds after a single miss below the range', () => {
    const s = suggest(curl, [entry('2026-11-08', log(25, [8, 7, 6])), entry('2026-11-01', log(25, [9, 9, 8]))]);
    expect(s.action).toBe('hold');
    expect(s.weight).toBe(25);
  });

  it('reduces ~5–10% after missing the bottom twice in a row', () => {
    const s = suggest(bench, [entry('2026-11-08', log(80, [5, 4, 4])), entry('2026-11-01', log(80, [5, 5, 4]))]);
    expect(s.action).toBe('decrease');
    expect(s.weight).toBe(72.5);
    expect(s.weight!).toBeGreaterThanOrEqual(80 * 0.9);
    expect(s.weight!).toBeLessThanOrEqual(80 * 0.95);
  });

  it('ignores deload sessions for progression', () => {
    const s = suggest(curl, [entry('2026-11-08', log(22.5, [10, 10]), true), entry('2026-11-01', log(25, [10, 10, 10]))]);
    expect(s.action).toBe('increase');
    expect(s.weight).toBe(27.5);
  });

  it('does not add weight if RPE was well above target', () => {
    const s = suggest(squat, [entry('2026-11-01', log(75, [5, 5, 5], {}, 9))]);
    expect(s.action).toBe('hold');
    expect(s.weight).toBe(75);
  });
});

describe('back-safety flag', () => {
  it('keeps the weight after one flagged session even if reps were hit', () => {
    const s = suggest(squat, [entry('2026-11-04', log(80, [5, 5, 5], { backFlag: true }))]);
    expect(s.action).toBe('back-hold');
    expect(s.weight).toBe(80);
  });

  it('lowers the weight after two flagged sessions in a row', () => {
    const s = suggest(squat, [entry('2026-11-11', log(80, [5, 5, 5], { backFlag: true })), entry('2026-11-04', log(80, [5, 5, 5], { backFlag: true }))]);
    expect(s.action).toBe('back-decrease');
    expect(s.weight).toBe(75);
  });
});

describe('helpers', () => {
  it('reduce always goes down at least one step', () => {
    expect(reduce(10, 0.05, 2.5)).toBe(7.5);
    expect(reduce(9, 0.075, 1)).toBe(8);
  });

  it('estimates 1RM with Epley', () => {
    expect(estimate1RM(100, 1)).toBe(100);
    expect(estimate1RM(100, 5)).toBeCloseTo(116.67, 1);
  });
});

describe('deload', () => {
  const base = { programStart: '2026-11-01', cycleStartWeek: 1, activeWeek: null, history: [] };

  it('counts training weeks from the start Sunday', () => {
    expect(weekNumber('2026-11-02', '2026-11-07')).toBe(1);
    expect(weekNumber('2026-11-02', '2026-11-08')).toBe(2);
  });

  it('is due after 6 full weeks and not before', () => {
    expect(isDeloadDue(base, 6)).toBe(false);
    expect(isDeloadDue(base, 7)).toBe(true);
  });

  it('starting or skipping resets the block', () => {
    const started = startDeload(base, 7, '2026-12-13');
    expect(isDeloadDue(started, 7)).toBe(false);
    expect(isDeloadDue(started, 13)).toBe(false);
    expect(isDeloadDue(started, 14)).toBe(true);
    const skipped = skipDeload(base, 7, '2026-12-13');
    expect(isDeloadDue(skipped, 12)).toBe(false);
    expect(isDeloadDue(skipped, 13)).toBe(true);
  });

  it('cuts volume to ~60% and weight slightly', () => {
    expect(deloadSets(3)).toBe(2);
    expect(deloadSets(2)).toBe(1);
    expect(deloadWeight(80, 2.5)).toBe(72.5);
  });
});
