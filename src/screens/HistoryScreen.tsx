import { useMemo, useState } from 'react';
import { PLAN } from '../data/plan';
import { useStore } from '../store';
import { getDay, findExercise } from '../lib/schedule';
import { best1RM, completedSets, exerciseHistory, workingWeight } from '../lib/progression';
import { formatDate } from '../lib/dates';
import { doneSetCount, workoutVolume } from '../lib/workout';
import { LineChart } from '../components/LineChart';
import { setsSummary } from '../components/format';

type Tab = 'workouts' | 'progress' | 'back';

export function HistoryScreen() {
  const [tab, setTab] = useState<Tab>('workouts');
  return (
    <div className="screen">
      <header className="page-head">
        <h1>History</h1>
      </header>
      <div className="segmented">
        {(['workouts', 'progress', 'back'] as Tab[]).map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t === 'workouts' ? 'Workouts' : t === 'progress' ? 'Progress' : 'Back log'}
          </button>
        ))}
      </div>
      {tab === 'workouts' && <WorkoutList />}
      {tab === 'progress' && <Progress />}
      {tab === 'back' && <BackLog />}
    </div>
  );
}

function WorkoutList() {
  const { data, update } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const list = [...data.workouts].sort((a, b) => (b.startedAt > a.startedAt ? 1 : -1));
  if (!list.length) return <p className="muted center">No workouts logged yet.</p>;

  return (
    <div className="stack">
      {list.map((w) => {
        const isOpen = open === w.id;
        const flags = w.exercises.filter((e) => e.backFlag);
        return (
          <section key={w.id} className="card">
            <button className="card-head as-button" onClick={() => setOpen(isOpen ? null : w.id)} aria-expanded={isOpen}>
              <div>
                <h2>{getDay(w.dayId).name}</h2>
                <div className="muted small">
                  {formatDate(w.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · Week {w.week} · {doneSetCount(w)} sets ·{' '}
                  {workoutVolume(w).toLocaleString()} kg
                </div>
              </div>
              <div className="row">
                {w.deload && <span className="badge warn">Deload</span>}
                {flags.length > 0 && <span className="badge warn">⚠</span>}
                <span className="chev">{isOpen ? '˄' : '˅'}</span>
              </div>
            </button>
            {isOpen && (
              <div className="details">
                {w.exercises.map((e, i) => (
                  <div key={i} className="detail-row">
                    <span>
                      {e.name}
                      {e.backFlag && <span className="badge warn">back</span>}
                    </span>
                    <span className="muted">{setsSummary(e, findExercise(e.exerciseId)?.unit)}</span>
                  </div>
                ))}
                {w.notes && <p className="note">“{w.notes}”</p>}
                <button
                  className="btn small danger ghost"
                  onClick={() => confirm('Delete this workout permanently?') && update((d) => ({ ...d, workouts: d.workouts.filter((x) => x.id !== w.id) }))}
                >
                  Delete workout
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Progress() {
  const { data } = useStore();
  const exercises = useMemo(() => {
    const seen = new Map<string, string>();
    PLAN.forEach((d) => d.exercises.forEach((e) => seen.set(e.id, e.name)));
    return [...seen.entries()];
  }, []);
  const [id, setId] = useState(
    () =>
      exercises.find(([eid]) => data.workouts.some((w) => w.exercises.some((e) => e.exerciseId === eid && completedSets(e).length)))?.[0] ??
      exercises[0]?.[0] ??
      '',
  );
  const ex = findExercise(id);
  const hist = exerciseHistory(data.workouts, id).filter((h) => completedSets(h.log).length).reverse();

  const weightPts = hist.flatMap((h) => {
    const w = workingWeight(h.log);
    return w != null ? [{ x: h.date, y: w }] : [];
  });
  const e1rmPts = hist.flatMap((h) => {
    const v = best1RM(h.log);
    return v != null ? [{ x: h.date, y: Math.round(v * 10) / 10 }] : [];
  });
  const repPts = hist.map((h) => ({ x: h.date, y: Math.max(...completedSets(h.log).map((s) => s.reps ?? 0)) }));
  const best = e1rmPts.length ? Math.max(...e1rmPts.map((p) => p.y)) : null;

  return (
    <div className="stack">
      <label className="field">
        <span>Exercise</span>
        <select value={id} onChange={(e) => setId(e.target.value)}>
          {exercises.map(([eid, name]) => (
            <option key={eid} value={eid}>{name}</option>
          ))}
        </select>
      </label>
      <section className="card">
        {ex?.noWeight ? (
          <LineChart unit={ex.unit === 'sec' ? 'sec' : 'reps'} series={[{ label: 'Best set', color: 'var(--accent)', points: repPts }]} />
        ) : (
          <LineChart
            series={[
              { label: 'Working weight', color: 'var(--accent)', points: weightPts },
              { label: 'Est. 1RM', color: 'var(--blue)', points: e1rmPts, dashed: true },
            ]}
          />
        )}
        {best != null && <p className="muted small center">Best estimated 1RM: <strong>{best} kg</strong> (Epley)</p>}
      </section>
      {hist.length > 0 && (
        <section className="card">
          <h3>Sessions</h3>
          {[...hist].reverse().map((h, i) => (
            <div key={i} className="detail-row">
              <span>
                {formatDate(h.date)} {h.deload && <span className="badge warn">deload</span>} {h.log.backFlag && <span className="badge warn">back</span>}
              </span>
              <span className="muted">{setsSummary(h.log, ex?.unit)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function BackLog() {
  const { data } = useStore();
  const flags = data.workouts
    .flatMap((w) => w.exercises.filter((e) => e.backFlag).map((e) => ({ date: w.date, name: e.name, notes: w.notes, log: e })))
    .sort((a, b) => (b.date > a.date ? 1 : -1));
  return (
    <section className="card">
      <p className="muted small">
        Sessions where you marked “back felt off” on Squat, Trap Bar Deadlift or Romanian Deadlift. After a flag the next suggestion keeps the weight; two in a row lowers it ~5%.
      </p>
      {flags.length === 0 ? (
        <p className="muted center">No flags — nice.</p>
      ) : (
        flags.map((f, i) => (
          <div key={i} className="detail-row column">
            <div className="row between">
              <strong>{f.name}</strong>
              <span className="muted">{formatDate(f.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
            <span className="muted small">{setsSummary(f.log)}</span>
            {f.notes && <span className="note small">“{f.notes}”</span>}
          </div>
        ))
      )}
    </section>
  );
}
