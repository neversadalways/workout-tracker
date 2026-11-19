import { DEFAULT_REST } from '../data/plan';
import type { AppData } from '../types';

export const STORAGE_KEY = 'workout-tracker:v1';

export function defaultData(): AppData {
  return {
    version: 1,
    workouts: [],
    active: null,
    bodyWeight: [],
    settings: {
      restMainSec: DEFAULT_REST.main,
      restAccessorySec: DEFAULT_REST.accessory,
      unit: 'kg',
      exerciseUnits: {},
      schedule: {},
      sound: true,
      vibrate: true,
      startBodyWeight: 105,
      targetBodyWeight: 95,
      targetDate: '2027-06-15',
    },
    deload: { programStart: null, cycleStartWeek: 1, activeWeek: null, history: [] },
  };
}

/** Fill in any missing fields so older/partial data keeps working. */
export function normalize(raw: unknown): AppData {
  const def = defaultData();
  if (!raw || typeof raw !== 'object') return def;
  const r = raw as Partial<AppData>;
  return {
    version: 1,
    workouts: Array.isArray(r.workouts) ? r.workouts : [],
    active: r.active ?? null,
    bodyWeight: Array.isArray(r.bodyWeight) ? r.bodyWeight : [],
    settings: { ...def.settings, ...(r.settings ?? {}) },
    deload: { ...def.deload, ...(r.deload ?? {}) },
  };
}

export function loadData(): AppData {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? normalize(JSON.parse(s)) : defaultData();
  } catch {
    return defaultData();
  }
}

export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Could not save data', e);
  }
}

export function exportData(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workout-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Parse an exported backup. Throws on invalid input. */
export function parseImport(text: string): AppData {
  const raw = JSON.parse(text);
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.workouts)) {
    throw new Error('This file is not a Workout Tracker backup.');
  }
  return normalize(raw);
}
