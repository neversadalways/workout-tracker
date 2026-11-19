import { PLAN } from '../data/plan';
import type { DayId, WorkoutDay } from '../types';

export type ScheduleOverrides = Partial<Record<DayId, number>>;

/** The plan with any weekday overrides from Settings applied. */
export function applySchedule(plan: WorkoutDay[], overrides: ScheduleOverrides | undefined): WorkoutDay[] {
  return plan.map((d) => ({ ...d, weekday: overrides?.[d.id] ?? d.weekday }));
}

/**
 * Move a workout to a new weekday. If another workout already uses that day,
 * the two swap so no weekday holds two workouts. Returns a full override map.
 */
export function assignWeekday(plan: WorkoutDay[], overrides: ScheduleOverrides | undefined, dayId: DayId, weekday: number): ScheduleOverrides {
  const current = applySchedule(plan, overrides);
  const moving = current.find((d) => d.id === dayId);
  if (!moving) return { ...overrides };
  const next: ScheduleOverrides = Object.fromEntries(current.map((d) => [d.id, d.weekday]));
  const clash = current.find((d) => d.id !== dayId && d.weekday === weekday);
  if (clash) next[clash.id] = moving.weekday;
  next[dayId] = weekday;
  return next;
}

export function getDay(id: DayId, plan: WorkoutDay[] = PLAN): WorkoutDay {
  const day = plan.find((d) => d.id === id);
  if (!day) throw new Error(`Unknown day ${id}`);
  return day;
}

/** Workout scheduled on this date, or null on a rest day. */
export function dayForDate(date: Date, plan: WorkoutDay[] = PLAN): WorkoutDay | null {
  return plan.find((d) => d.weekday === date.getDay()) ?? null;
}

/** Next scheduled workout strictly after the given date. */
export function nextWorkout(date: Date, plan: WorkoutDay[] = PLAN): { day: WorkoutDay; inDays: number } {
  for (let i = 1; i <= 7; i++) {
    const wd = (date.getDay() + i) % 7;
    const day = plan.find((d) => d.weekday === wd);
    if (day) return { day, inDays: i };
  }
  throw new Error('Plan has no training days');
}

export function findExercise(id: string, plan: WorkoutDay[] = PLAN) {
  for (const d of plan) {
    const ex = d.exercises.find((e) => e.id === id);
    if (ex) return ex;
  }
  return undefined;
}
