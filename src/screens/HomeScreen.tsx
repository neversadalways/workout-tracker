import { useState } from 'react';
import { PLAN } from '../data/plan';
import { useStore } from '../store';
import type { DayId } from '../types';
import { WEEKDAY_NAMES, formatDate, startOfWeek, todayStr } from '../lib/dates';
import { dayForDate, getDay, nextWorkout } from '../lib/schedule';
import { exerciseHistory, suggest } from '../lib/progression';
import { deloadSets, deloadWeight, isDeloadDue, skipDeload, startDeload } from '../lib/deload';
import { createWorkout } from '../lib/workout';
import { ACTION_CLASS, ACTION_ICON, kg, targetText } from '../components/format';

export function HomeScreen({ onOpenWorkout }: { onOpenWorkout: () => void }) {
  const { data, update, week, deloadActive } = useStore();
  const now = new Date();
  const today = todayStr();
  const scheduled = dayForDate(now);
  const next = nextWorkout(now);
  const [picked, setPicked] = useState<DayId | null>(null);
  const day = picked ? getDay(picked) : (scheduled ?? next.day);
  const due = isDeloadDue(data.deload, week);
  const doneToday = data.workouts.filter((w) => w.date === today);

  const start = () => {
    if (data.active && !confirm('You have an unfinished workout. Discard it and start a new one?')) return;
    update((d) => {
      const deload = d.deload.programStart ? d.deload : { ...d.deload, programStart: startOfWeek(today) };
      return { ...d, deload, active: createWorkout(day, d, { deload: deloadActive, week }) };
    });
    onOpenWorkout();
  };

  return (
    <div className="screen">
      <header className="page-head">
        <div>
          <div className="muted">{formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1>{scheduled ? 'Today' : 'Rest day'}</h1>
        </div>
        <div className="week-pill">
          Week {week}
          {deloadActive && <span className="badge warn">Deload</span>}
        </div>
      </header>

      {data.active && (
        <button className="card resume" onClick={onOpenWorkout}>
          <div>
            <strong>Resume {getDay(data.active.dayId).name}</strong>
            <div className="muted">Started {new Date(data.active.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <span className="chev">›</span>
        </button>
      )}

      {due && (
        <div className="card notice">
          <strong>Deload week?</strong>
          <p className="muted">
            You've trained {week - data.deload.cycleStartWeek} weeks straight. A deload is ~60% of the sets at slightly lower weight.
          </p>
          <div className="row">
            <button className="btn primary" onClick={() => update((d) => ({ ...d, deload: startDeload(d.deload, week, today) }))}>
              Start deload
            </button>
            <button className="btn ghost" onClick={() => update((d) => ({ ...d, deload: skipDeload(d.deload, week, today) }))}>
              Skip
            </button>
          </div>
        </div>
      )}

      {!scheduled && (
        <p className="muted">
          No training today. Next up: <strong>{next.day.name}</strong> on {WEEKDAY_NAMES[next.day.weekday]}
          {next.inDays === 1 ? ' (tomorrow)' : ` (in ${next.inDays} days)`}.
        </p>
      )}

      <div className="day-picker" role="tablist">
        {PLAN.map((d) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={d.id === day.id}
            className={d.id === day.id ? 'active' : ''}
            onClick={() => setPicked(d.id === scheduled?.id ? null : d.id)}
          >
            <span>{d.name}</span>
            <small>{WEEKDAY_NAMES[d.weekday].slice(0, 3)}</small>
          </button>
        ))}
      </div>

      <section className="card">
        <div className="card-head">
          <h2>{day.name}</h2>
          {deloadActive && <span className="badge warn">Deload</span>}
          {doneToday.some((w) => w.dayId === day.id) && <span className="badge up">Done today ✓</span>}
        </div>
        <ul className="plan-list">
          {day.exercises.map((ex) => {
            const s = suggest(ex, exerciseHistory(data.workouts, ex.id));
            const w = deloadActive ? deloadWeight(s.weight, ex.increment) : s.weight;
            return (
              <li key={ex.id}>
                <div>
                  <div className="ex-name">{ex.name}</div>
                  <div className="muted small">{targetText(ex, deloadActive ? deloadSets(ex.sets) : ex.sets)}</div>
                </div>
                {!ex.noWeight && (
                  <div className={`sugg ${ACTION_CLASS[s.action]}`}>
                    <span>{ACTION_ICON[s.action]}</span> {kg(w)}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <button className="btn primary block big" onClick={start}>
          Start {day.name}
        </button>
      </section>
    </div>
  );
}
