import type { WorkoutDay } from '../types';

/**
 * ============================================================
 *  YOUR TRAINING PLAN — edit this file to change the program.
 * ============================================================
 *
 * Fields per exercise:
 *   id          stable key for history (don't rename once you have logs,
 *               or the exercise starts with a fresh history)
 *   name        display name
 *   sets        number of working sets
 *   repMin/Max  target range (same value = fixed reps, e.g. 3x5)
 *   unit        'sec' for timed holds (default: reps)
 *   startWeight weight used before there is any history (in weightUnit)
 *   increment   weight added when you hit the top of the range in every set
 *   weightUnit  'kg' (default) or 'lb' — can also be switched per exercise
 *               in Settings → Exercise units, which overrides this
 *   main        true = main lift (longer rest timer)
 *   backSafety  true = shows the "back felt off" flag
 *   targetRpe   shown next to the target
 *   noWeight    true = bodyweight / no load field
 *   restSec     override rest time for this exercise only
 *
 * weekday: 0 = Sunday, 1 = Monday, … 6 = Saturday (default — can be changed
 *          in the app under Settings → Training days)
 */
export const PLAN: WorkoutDay[] = [
  {
    id: 'lowerA',
    name: 'Lower A',
    weekday: 0, // Sunday
    exercises: [
      { id: 'leg-press', name: 'Leg Press', sets: 3, repMin: 6, repMax: 8, increment: 5, main: true },
      { id: 'romanian-deadlift', name: 'Romanian Deadlift', sets: 3, repMin: 8, repMax: 8, startWeight: 60, increment: 2.5, main: true, backSafety: true },
      { id: 'lying-leg-curl', name: 'Lying Leg Curl', sets: 3, repMin: 8, repMax: 10, startWeight: 25, increment: 2.5 },
      { id: 'leg-extension', name: 'Leg Extension', sets: 3, repMin: 10, repMax: 12, startWeight: 95, increment: 2.5 },
      { id: 'calf-raises', name: 'Calf Raises', sets: 3, repMin: 10, repMax: 12, startWeight: 90, increment: 2.5 },
      { id: 'pallof-dead-bug', name: 'Pallof Press / Dead Bug', sets: 3, repMin: 10, repMax: 10, increment: 2.5, note: 'Per side' },
    ],
  },
  {
    id: 'upperA',
    name: 'Upper A',
    weekday: 1, // Monday
    exercises: [
      { id: 'bench-press', name: 'Bench Press', sets: 3, repMin: 5, repMax: 5, startWeight: 67.5, increment: 2.5, main: true },
      { id: 'chest-supported-row', name: 'Chest Supported Row', sets: 3, repMin: 8, repMax: 8, startWeight: 57, increment: 2.5, main: true },
      { id: 'seated-db-ohp', name: 'Seated Dumbbell Overhead Press', sets: 3, repMin: 8, repMax: 8, increment: 2, main: true, note: 'Weight per dumbbell' },
      { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 3, repMin: 8, repMax: 10, startWeight: 45, increment: 2.5 },
      { id: 'cable-push-down', name: 'Cable Push Down', sets: 2, repMin: 10, repMax: 12, startWeight: 55, increment: 2.5 },
      { id: 'machine-curl', name: 'Machine Curl', sets: 2, repMin: 10, repMax: 12, startWeight: 39, increment: 2.5 },
    ],
  },
  {
    id: 'lowerB',
    name: 'Lower B',
    weekday: 3, // Wednesday
    exercises: [
      { id: 'squat', name: 'Squat', sets: 3, repMin: 5, repMax: 5, startWeight: 75, increment: 2.5, main: true, backSafety: true, targetRpe: 7 },
      { id: 'trap-bar-deadlift', name: 'Trap Bar Deadlift', sets: 2, repMin: 5, repMax: 5, startWeight: 90, increment: 2.5, main: true, backSafety: true, targetRpe: 7 },
      { id: 'hip-thrust', name: 'Hip Thrust', sets: 3, repMin: 8, repMax: 10, increment: 5, main: true },
      { id: 'leg-curl-b', name: 'Seated/Lying Leg Curl', sets: 2, repMin: 10, repMax: 12, increment: 2.5 },
      // Same id as Lower A → shared history & progression.
      { id: 'calf-raises', name: 'Calf Raises', sets: 3, repMin: 10, repMax: 12, startWeight: 90, increment: 2.5 },
      { id: 'plank', name: 'Plank / Side Plank', sets: 3, repMin: 30, repMax: 40, unit: 'sec', noWeight: true, increment: 0 },
    ],
  },
  {
    id: 'upperB',
    name: 'Upper B',
    weekday: 6, // Saturday
    exercises: [
      { id: 'incline-db-press', name: 'Incline Dumbbell Press', sets: 3, repMin: 8, repMax: 8, startWeight: 17.5, increment: 2.5, main: true, note: 'Weight per dumbbell' },
      { id: 'seated-cable-row', name: 'Seated Cable Row', sets: 3, repMin: 10, repMax: 10, increment: 2.5, main: true },
      { id: 'machine-chest-fly', name: 'Machine Chest Fly', sets: 2, repMin: 10, repMax: 12, startWeight: 80, increment: 2.5 },
      { id: 'face-pull', name: 'Face Pull', sets: 3, repMin: 12, repMax: 15, startWeight: 65, increment: 2.5 },
      { id: 'lateral-raises', name: 'Lateral Raises', sets: 3, repMin: 12, repMax: 15, startWeight: 9, increment: 1, note: 'Weight per dumbbell' },
      { id: 'cross-body-hammer-curl', name: 'Cross Body Hammer Curls', sets: 2, repMin: 10, repMax: 12, startWeight: 12, increment: 2, note: 'Weight per dumbbell' },
      { id: 'close-grip-bench', name: 'Close Grip Bench Press', sets: 2, repMin: 8, repMax: 8, startWeight: 42.5, increment: 2.5 },
    ],
  },
];

/** Deload settings. */
export const DELOAD = {
  /** Prompt a deload after this many training weeks. */
  everyWeeks: 6,
  /** Fraction of sets kept during a deload (rounded, minimum 1). */
  volumeFactor: 0.6,
  /** Weight multiplier during a deload. */
  weightFactor: 0.9,
};

/** Default rest times in seconds (changeable in Settings). */
export const DEFAULT_REST = { main: 120, accessory: 90 };
