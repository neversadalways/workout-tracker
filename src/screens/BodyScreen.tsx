import { useState } from 'react';
import { useStore } from '../store';
import { daysBetween, formatDate, todayStr } from '../lib/dates';
import { movingAverage, sortEntries, weeklyAverages } from '../lib/bodyweight';
import { LineChart } from '../components/LineChart';
import { NumInput } from '../components/NumInput';

const r1 = (n: number) => Math.round(n * 10) / 10;

export function BodyScreen() {
  const { data, update } = useStore();
  const { settings } = data;
  const entries = sortEntries(data.bodyWeight);
  const latest = entries.at(-1);
  const [date, setDate] = useState(todayStr());
  const [weight, setWeight] = useState<number | null>(latest?.weight ?? settings.startBodyWeight);

  const add = () => {
    if (weight == null || weight <= 0) return;
    update((d) => ({ ...d, bodyWeight: [...d.bodyWeight.filter((e) => e.date !== date), { date, weight }] }));
  };

  const start = settings.startBodyWeight;
  const target = settings.targetBodyWeight;
  const avg = movingAverage(entries);
  const current = avg.at(-1)?.y ?? latest?.weight ?? start;
  const totalToLose = start - target;
  const progress = totalToLose !== 0 ? Math.min(1, Math.max(0, (start - current) / totalToLose)) : 1;
  const daysLeft = daysBetween(todayStr(), settings.targetDate);
  const remaining = r1(current - target);
  const perWeek = daysLeft > 0 ? r1(remaining / (daysLeft / 7)) : null;
  const weekly = weeklyAverages(entries).slice(0, 8);

  return (
    <div className="screen">
      <header className="page-head">
        <h1>Body weight</h1>
      </header>

      <section className="card">
        <div className="row">
          <label className="field grow">
            <span>Date</span>
            <input type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field grow">
            <span>Weight (kg)</span>
            <NumInput ariaLabel="Body weight" value={weight} onChange={setWeight} />
          </label>
        </div>
        <button className="btn primary block big" onClick={add}>Save weight</button>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Goal: {target} kg</h2>
          <span className="muted small">by {formatDate(settings.targetDate, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="progress" aria-label="Goal progress">
          <div style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="stats">
          <div><small className="muted">Start</small><strong>{start}</strong></div>
          <div><small className="muted">Now (7d avg)</small><strong>{current}</strong></div>
          <div><small className="muted">To go</small><strong>{remaining > 0 ? remaining : 0}</strong></div>
          <div><small className="muted">Needed / wk</small><strong>{perWeek != null && remaining > 0 ? perWeek : '—'}</strong></div>
        </div>
        <p className="muted small center">
          {Math.round(progress * 100)}% there · {daysLeft > 0 ? `${daysLeft} days left` : 'target date passed'}
        </p>
      </section>

      <section className="card">
        <h3>Trend</h3>
        <LineChart
          series={[
            { label: 'Daily', color: 'var(--muted)', points: entries.map((e) => ({ x: e.date, y: e.weight })) },
            { label: '7-day avg', color: 'var(--accent)', points: avg, dots: false },
          ]}
          target={{ y: target, label: `Goal ${target}` }}
        />
      </section>

      {weekly.length > 0 && (
        <section className="card">
          <h3>Weekly average</h3>
          {weekly.map((w, i) => {
            const prev = weekly[i + 1];
            const diff = prev ? r1(w.avg - prev.avg) : null;
            return (
              <div key={w.week} className="detail-row">
                <span>Week of {formatDate(w.week)}</span>
                <span>
                  <strong>{w.avg} kg</strong>{' '}
                  {diff != null && <span className={diff <= 0 ? 'text-up' : 'text-down'}>{diff > 0 ? `+${diff}` : diff}</span>}
                </span>
              </div>
            );
          })}
        </section>
      )}

      {entries.length > 0 && (
        <section className="card">
          <h3>Entries</h3>
          {[...entries].reverse().slice(0, 30).map((e) => (
            <div key={e.date} className="detail-row">
              <span>{formatDate(e.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
              <span className="row">
                <strong>{e.weight} kg</strong>
                <button
                  className="btn small ghost"
                  aria-label={`Delete ${e.date}`}
                  onClick={() => confirm('Delete this entry?') && update((d) => ({ ...d, bodyWeight: d.bodyWeight.filter((x) => x.date !== e.date) }))}
                >
                  ✕
                </button>
              </span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
