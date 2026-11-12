import type { AppData, WorkoutDay, WorkoutLog } from '../types';
import { todayStr } from './dates';
import { deloadSets, deloadWeight } from './deload';
import { exerciseHistory, suggest } from './progression';

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** Build a new in-progress workout with weights pre-filled from the suggestions. */
export function createWorkout(day: WorkoutDay, data: AppData, opts: { deload: boolean; week: number }): WorkoutLog {
  return {
    id: newId(),
    dayId: day.id,
    date: todayStr(),
    startedAt: new Date().toISOString(),
    notes: '',
    deload: opts.deload,
    week: opts.week,
    exercises: day.exercises.map((ex) => {
      const s = suggest(ex, exerciseHistory(data.workouts, ex.id));
      const weight = ex.noWeight ? null : opts.deload ? deloadWeight(s.weight, ex.increment) : s.weight;
      const n = opts.deload ? deloadSets(ex.sets) : ex.sets;
      return {
        exerciseId: ex.id,
        name: ex.name,
        suggestedWeight: weight,
        backFlag: false,
        sets: Array.from({ length: n }, () => ({ weight, reps: null, rpe: null, done: false })),
      };
    }),
  };
}

export function workoutVolume(w: WorkoutLog): number {
  let v = 0;
  for (const e of w.exercises) for (const s of e.sets) if (s.done && s.weight && s.reps) v += s.weight * s.reps;
  return Math.round(v);
}

export function doneSetCount(w: WorkoutLog): number {
  return w.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
}
