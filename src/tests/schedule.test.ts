import { describe, expect, it } from 'vitest';
import { PLAN } from '../data/plan';
import { applySchedule, assignWeekday, dayForDate, nextWorkout } from '../lib/schedule';

const weekdays = (o: Record<string, number | undefined>) => applySchedule(PLAN, o).map((d) => `${d.id}:${d.weekday}`);

describe('schedule overrides', () => {
  it('uses plan defaults with no overrides', () => {
    expect(weekdays({})).toEqual(['lowerA:0', 'upperA:1', 'lowerB:3', 'upperB:6']);
  });

  it('moves a workout to a free day', () => {
    const o = assignWeekday(PLAN, {}, 'lowerB', 4); // Wed → Thu
    expect(weekdays(o)).toEqual(['lowerA:0', 'upperA:1', 'lowerB:4', 'upperB:6']);
  });

  it('swaps when the day is already taken', () => {
    const o = assignWeekday(PLAN, {}, 'upperA', 0); // Upper A → Sunday, Lower A gets Monday
    expect(weekdays(o)).toEqual(['lowerA:1', 'upperA:0', 'lowerB:3', 'upperB:6']);
  });

  it('builds on earlier overrides', () => {
    const o1 = assignWeekday(PLAN, {}, 'lowerB', 2);
    const o2 = assignWeekday(PLAN, o1, 'upperB', 5);
    expect(weekdays(o2)).toEqual(['lowerA:0', 'upperA:1', 'lowerB:2', 'upperB:5']);
  });

  it('today and next workout follow the new schedule', () => {
    const plan = applySchedule(PLAN, assignWeekday(PLAN, {}, 'lowerB', 4));
    const thursday = new Date(2026, 10, 19);
    expect(dayForDate(thursday, plan)?.id).toBe('lowerB');
    expect(nextWorkout(new Date(2026, 10, 18), plan)).toMatchObject({ day: { id: 'lowerB' }, inDays: 1 });
  });
});
