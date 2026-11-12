import type { BodyWeightEntry } from '../types';
import { daysBetween, startOfWeek } from './dates';

const r1 = (n: number) => Math.round(n * 10) / 10;

export function sortEntries(e: BodyWeightEntry[]): BodyWeightEntry[] {
  return [...e].sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** 7-day trailing average for each entry date. */
export function movingAverage(entries: BodyWeightEntry[], days = 7): { x: string; y: number }[] {
  const s = sortEntries(entries);
  return s.map((e) => {
    const win = s.filter((o) => {
      const d = daysBetween(o.date, e.date);
      return d >= 0 && d < days;
    });
    return { x: e.date, y: r1(win.reduce((a, o) => a + o.weight, 0) / win.length) };
  });
}

/** Average per week (Sunday start), newest first. */
export function weeklyAverages(entries: BodyWeightEntry[]): { week: string; avg: number; count: number }[] {
  const map = new Map<string, number[]>();
  for (const e of entries) {
    const k = startOfWeek(e.date);
    map.set(k, [...(map.get(k) ?? []), e.weight]);
  }
  return [...map.entries()]
    .map(([week, ws]) => ({ week, avg: r1(ws.reduce((a, b) => a + b, 0) / ws.length), count: ws.length }))
    .sort((a, b) => (a.week < b.week ? 1 : -1));
}
