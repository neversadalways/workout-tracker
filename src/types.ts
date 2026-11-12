// ---------- Plan ----------

export type DayId = 'lowerA' | 'upperA' | 'lowerB' | 'upperB';

export interface ExercisePlan {
  /** Stable id. History and progression are keyed by this — the same id on two days shares history. */
  id: string;
  /** Display name (English). */
  name: string;
  /** Number of working sets. */
  sets: number;
  /** Bottom of the target rep range (or seconds when unit = 'sec'). */
  repMin: number;
  /** Top of the target rep range (or seconds when unit = 'sec'). */
  repMax: number;
  /** 'reps' (default) or 'sec' for timed holds like planks. */
  unit?: 'reps' | 'sec';
  /** Starting weight in kg, used until there is history. */
  startWeight?: number;
  /** Weight step in kg used for increases (and rounding decreases). */
  increment: number;
  /** Main compound lift — gets the longer rest timer. */
  main?: boolean;
  /** Shows the "back felt off" flag and applies the back-safety rule. */
  backSafety?: boolean;
  /** Target RPE, shown next to the target. */
  targetRpe?: number;
  /** Exercise has no external load (e.g. plank). Hides the weight field. */
  noWeight?: boolean;
  /** Optional per-exercise rest override in seconds. */
  restSec?: number;
  /** Short coaching note shown under the name. */
  note?: string;
}

export interface WorkoutDay {
  id: DayId;
  name: string;
  /** JS weekday: 0 = Sunday … 6 = Saturday. */
  weekday: number;
  exercises: ExercisePlan[];
}

// ---------- Logs ----------

export interface SetLog {
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  done: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  name: string;
  sets: SetLog[];
  /** "Back felt off" flag (only for backSafety exercises). */
  backFlag?: boolean;
  /** Weight that was suggested when the workout started. */
  suggestedWeight?: number | null;
}

export interface WorkoutLog {
  id: string;
  dayId: DayId;
  /** Local date YYYY-MM-DD. */
  date: string;
  startedAt: string;
  finishedAt?: string;
  exercises: ExerciseLog[];
  notes: string;
  deload: boolean;
  week: number;
}

export interface BodyWeightEntry {
  /** Local date YYYY-MM-DD. */
  date: string;
  weight: number;
}

export interface Settings {
  restMainSec: number;
  restAccessorySec: number;
  unit: 'kg';
  sound: boolean;
  vibrate: boolean;
  startBodyWeight: number;
  targetBodyWeight: number;
  /** YYYY-MM-DD */
  targetDate: string;
}

export interface DeloadEvent {
  week: number;
  action: 'deload' | 'skip';
  date: string;
}

export interface DeloadState {
  /** Sunday (YYYY-MM-DD) of training week 1. Set on the first workout. */
  programStart: string | null;
  /** Week the current 6-week block started. */
  cycleStartWeek: number;
  /** Week number of an active deload, if any. */
  activeWeek: number | null;
  history: DeloadEvent[];
}

export interface AppData {
  version: 1;
  workouts: WorkoutLog[];
  active: WorkoutLog | null;
  bodyWeight: BodyWeightEntry[];
  settings: Settings;
  deload: DeloadState;
}
