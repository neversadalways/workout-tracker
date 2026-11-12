import { useStore } from '../store';
import type { ExerciseLog, ExercisePlan, WorkoutLog } from '../types';
import { findExercise, getDay } from '../lib/schedule';
import { exerciseHistory, suggest, type HistoryEntry } from '../lib/progression';
import { deloadWeight } from '../lib/deload';
import { formatDate } from '../lib/dates';
import { NumInput } from '../components/NumInput';
import { useRestTimer } from '../components/RestTimer';
import { ACTION_CLASS, ACTION_ICON, kg, setsSummary, targetText } from '../components/format';
import { doneSetCount } from '../lib/workout';

export function WorkoutScreen({ onClose }: { onClose: () => void }) {
  const { data, update } = useStore();
  const timer = useRestTimer();
  const w = data.active;
  if (!w) return null;
  const day = getDay(w.dayId);

  const setWorkout = (fn: (w: WorkoutLog) => WorkoutLog) => update((d) => (d.active ? { ...d, active: fn(d.active) } : d));
  const setExercise = (i: number, fn: (e: ExerciseLog) => ExerciseLog) =>
    setWorkout((cur) => ({ ...cur, exercises: cur.exercises.map((e, j) => (j === i ? fn(e) : e)) }));

  const finish = () => {
    if (doneSetCount(w) === 0 && !confirm('No sets are ticked. Finish anyway?')) return;
    timer.stop();
    update((d) => (d.active ? { ...d, workouts: [...d.workouts, { ...d.active, finishedAt: new Date().toISOString() }], active: null } : d));
    onClose();
  };

  const discard = () => {
    if (!confirm('Discard this workout? Nothing will be saved.')) return;
    timer.stop();
    update((d) => ({ ...d, active: null }));
    onClose();
  };

  return (
    <div className="screen">
      <header className="page-head">
        <button className="btn ghost small" onClick={onClose} aria-label="Back">‹ Back</button>
        <div className="center">
          <h1>{day.name}</h1>
          <div className="muted small">
            {formatDate(w.date, { weekday: 'short', day: 'numeric', month: 'short' })} · Week {w.week}
            {w.deload && <span className="badge warn">Deload</span>}
          </div>
        </div>
        <div style={{ width: 64 }} />
      </header>

      {w.exercises.map((log, i) => {
        const ex = findExercise(log.exerciseId);
        if (!ex) return null;
        return (
          <ExerciseCard
            key={log.exerciseId + i}
            ex={ex}
            log={log}
            deload={w.deload}
            history={exerciseHistory(data.workouts, ex.id)}
            onChange={(fn) => setExercise(i, fn)}
            onSetDone={() => {
              const rest = ex.restSec ?? (ex.main ? data.settings.restMainSec : data.settings.restAccessorySec);
              timer.start(rest, ex.name);
            }}
          />
        );
      })}

      <section className="card">
        <label className="field">
          <span>Workout notes</span>
          <textarea
            rows={3}
            placeholder="How did it feel? Sleep, energy, anything to remember…"
            value={w.notes}
            onChange={(e) => {
              const notes = e.target.value;
              setWorkout((cur) => ({ ...cur, notes }));
            }}
          />
        </label>
      </section>

      <div className="row stack-gap">
        <button className="btn danger ghost" onClick={discard}>Discard</button>
        <button className="btn primary big grow" onClick={finish}>Finish workout</button>
      </div>
    </div>
  );
}

interface CardProps {
  ex: ExercisePlan;
  log: ExerciseLog;
  history: HistoryEntry[];
  deload: boolean;
  onChange: (fn: (e: ExerciseLog) => ExerciseLog) => void;
  onSetDone: () => void;
}

function ExerciseCard({ ex, log, history, deload, onChange, onSetDone }: CardProps) {
  const s = suggest(ex, history);
  const suggested = deload ? deloadWeight(s.weight, ex.increment) : s.weight;
  const last = history[0];
  const allDone = log.sets.length > 0 && log.sets.every((x) => x.done);
  const isSec = ex.unit === 'sec';

  const placeholderReps = (i: number) => {
    const prev = last?.log.sets[i]?.reps;
    return prev ?? ex.repMax;
  };

  const setField = (i: number, patch: Partial<ExerciseLog['sets'][number]>) =>
    onChange((e) => {
      const sets = e.sets.map((x, j) => (j === i ? { ...x, ...patch } : x));
      // Changing a weight carries it forward to later sets you haven't done yet.
      if ('weight' in patch) {
        const old = e.sets[i].weight;
        for (let j = i + 1; j < sets.length; j++) if (!sets[j].done && sets[j].weight === old) sets[j] = { ...sets[j], weight: patch.weight ?? null };
      }
      return { ...e, sets };
    });

  const toggleDone = (i: number) => {
    const set = log.sets[i];
    const done = !set.done;
    setField(i, { done, reps: done && set.reps == null ? placeholderReps(i) : set.reps });
    if (done) onSetDone();
  };

  const firstWeight = log.sets[0]?.weight ?? null;

  return (
    <section className={`card exercise ${allDone ? 'complete' : ''}`}>
      <div className="card-head">
        <div>
          <h2>{ex.name}</h2>
          <div className="muted small">
            Target {targetText(ex, log.sets.length)}
            {ex.note ? ` · ${ex.note}` : ''}
          </div>
        </div>
        {allDone && <span className="badge up">✓</span>}
      </div>

      <div className="meta">
        <div>
          <span className="muted small">Last</span>
          <div>{last ? `${setsSummary(last.log, ex.unit)} · ${formatDate(last.date)}` : '—'}</div>
        </div>
        {!ex.noWeight && (
          <div className={`sugg-box ${ACTION_CLASS[s.action]}`}>
            <div>
              <span className="muted small">Suggested</span>
              <div className="sugg-weight">
                {ACTION_ICON[s.action]} {kg(suggested)}
              </div>
            </div>
            {suggested != null && firstWeight !== suggested && (
              <button
                className="btn small ghost"
                onClick={() => onChange((e) => ({ ...e, sets: e.sets.map((x) => (x.done ? x : { ...x, weight: suggested })) }))}
              >
                Use
              </button>
            )}
          </div>
        )}
      </div>
      <p className={`sugg-msg ${ACTION_CLASS[s.action]}`}>
        {deload ? `Deload: fewer sets, ~90% weight. ` : ''}
        {s.message}
      </p>

      <div className={`sets ${ex.noWeight ? 'no-weight' : ''}`}>
        <div className="sets-head muted small">
          <span>Set</span>
          {!ex.noWeight && <span>kg</span>}
          <span>{isSec ? 'sec' : 'Reps'}</span>
          <span>RPE</span>
          <span />
        </div>
        {log.sets.map((set, i) => (
          <div key={i} className={`set-row ${set.done ? 'done' : ''}`}>
            <span className="set-no">{i + 1}</span>
            {!ex.noWeight && (
              <NumInput ariaLabel={`Set ${i + 1} weight`} value={set.weight} placeholder={suggested != null ? String(suggested) : 'kg'} onChange={(v) => setField(i, { weight: v })} />
            )}
            <NumInput ariaLabel={`Set ${i + 1} ${isSec ? 'seconds' : 'reps'}`} decimal={false} value={set.reps} placeholder={String(placeholderReps(i))} onChange={(v) => setField(i, { reps: v })} />
            <NumInput ariaLabel={`Set ${i + 1} RPE`} value={set.rpe} placeholder="–" onChange={(v) => setField(i, { rpe: v })} />
            <button className={`check ${set.done ? 'on' : ''}`} aria-label={set.done ? 'Mark set not done' : 'Mark set done'} aria-pressed={set.done} onClick={() => toggleDone(i)}>
              ✓
            </button>
          </div>
        ))}
      </div>

      <div className="row between">
        <div className="row">
          <button
            className="btn small ghost"
            onClick={() => onChange((e) => ({ ...e, sets: [...e.sets, { weight: e.sets.at(-1)?.weight ?? suggested, reps: null, rpe: null, done: false }] }))}
          >
            + Set
          </button>
          {log.sets.length > 1 && (
            <button className="btn small ghost" onClick={() => onChange((e) => ({ ...e, sets: e.sets.slice(0, -1) }))}>
              − Set
            </button>
          )}
        </div>
        {ex.backSafety && (
          <button className={`btn small toggle ${log.backFlag ? 'warn-on' : ''}`} aria-pressed={!!log.backFlag} onClick={() => onChange((e) => ({ ...e, backFlag: !e.backFlag }))}>
            ⚠ Back felt off
          </button>
        )}
      </div>
      {log.backFlag && <p className="sugg-msg warn">Noted. Next session will keep (or lower) the weight. Stop if anything feels sharp.</p>}
    </section>
  );
}
