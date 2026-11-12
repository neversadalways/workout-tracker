import { describe, expect, it } from 'vitest';
import type { ExerciseLog, ExercisePlan } from '../types';
import { convertIncrement, convertWeight, logInUnit, planInUnit, suggestIn, unitFor } from '../lib/units';

const pulldown: ExercisePlan = { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 3, repMin: 8, repMax: 10, startWeight: 45, increment: 2.5 };

const log = (weight: number, reps: number[], unit?: 'kg' | 'lb'): ExerciseLog => ({
  exerciseId: 'lat-pulldown',
  name: 'Lat Pulldown',
  weightUnit: unit,
  sets: reps.map((r) => ({ weight, reps: r, rpe: null, done: true })),
});

describe('units', () => {
  it('converts kg ↔ lb', () => {
    expect(convertWeight(100, 'kg', 'lb')).toBe(220.5);
    expect(convertWeight(100, 'lb', 'kg')).toBe(45.4);
    expect(convertWeight(60, 'kg', 'kg')).toBe(60);
  });

  it('maps increments to sensible steps', () => {
    expect(convertIncrement(2.5, 'kg', 'lb')).toBe(5);
    expect(convertIncrement(1, 'kg', 'lb')).toBe(2.5);
    expect(convertIncrement(5, 'lb', 'kg')).toBe(2.5);
  });

  it('resolves unit: settings override → plan → kg', () => {
    expect(unitFor(pulldown, { exerciseUnits: {} })).toBe('kg');
    expect(unitFor({ ...pulldown, weightUnit: 'lb' }, { exerciseUnits: {} })).toBe('lb');
    expect(unitFor({ ...pulldown, weightUnit: 'lb' }, { exerciseUnits: { 'lat-pulldown': 'kg' } })).toBe('kg');
  });

  it('converts the plan start weight to the lb step', () => {
    const p = planInUnit(pulldown, 'lb');
    expect(p.increment).toBe(5);
    expect(p.startWeight).toBe(100); // 45 kg ≈ 99.2 lb → nearest 5
  });

  it('progresses in lb steps', () => {
    const s = suggestIn(pulldown, [{ date: '2026-11-09', deload: false, log: log(100, [10, 10, 10], 'lb') }], 'lb');
    expect(s.action).toBe('increase');
    expect(s.weight).toBe(105);
    expect(s.message).toContain('5 lb');
  });

  it('converts kg history when an exercise is switched to lb', () => {
    const s = suggestIn(pulldown, [{ date: '2026-11-09', deload: false, log: log(45, [9, 9, 8]) }], 'lb');
    expect(s.action).toBe('hold');
    expect(s.weight).toBe(100);
  });

  it('converts lb history back to kg', () => {
    const s = suggestIn(pulldown, [{ date: '2026-11-09', deload: false, log: log(100, [10, 10, 10], 'lb') }], 'kg');
    expect(s.weight).toBe(47.5); // 45 kg + 2.5
  });

  it('leaves logs already in the target unit untouched', () => {
    const l = log(45, [10]);
    expect(logInUnit(l, 'kg')).toBe(l);
  });
});
