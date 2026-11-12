import { useRef } from 'react';
import { useStore } from '../store';
import type { Settings } from '../types';
import { defaultData, exportData, parseImport } from '../lib/storage';
import { endDeload, startDeload } from '../lib/deload';
import { formatDate, startOfWeek, todayStr } from '../lib/dates';
import { NumInput } from '../components/NumInput';

export function SettingsScreen() {
  const { data, update, replace, week, deloadActive } = useStore();
  const s = data.settings;
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (patch: Partial<Settings>) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));

  const onImport = async (file: File) => {
    try {
      const imported = parseImport(await file.text());
      if (confirm(`Replace all current data with this backup (${imported.workouts.length} workouts, ${imported.bodyWeight.length} weigh-ins)?`)) {
        replace(imported);
        alert('Backup imported.');
      }
    } catch (e) {
      alert(`Import failed: ${(e as Error).message}`);
    }
  };

  const reset = () => {
    if (!confirm('Delete ALL workouts, body weight entries and settings? This cannot be undone.')) return;
    if (!confirm('Are you really sure? Consider exporting a backup first.')) return;
    replace(defaultData());
  };

  return (
    <div className="screen">
      <header className="page-head">
        <h1>Settings</h1>
      </header>

      <section className="card">
        <h3>Rest timer</h3>
        <div className="row">
          <label className="field grow">
            <span>Main lifts (sec)</span>
            <NumInput ariaLabel="Main lift rest seconds" decimal={false} value={s.restMainSec} onChange={(v) => v && v > 0 && set({ restMainSec: v })} />
          </label>
          <label className="field grow">
            <span>Accessories (sec)</span>
            <NumInput ariaLabel="Accessory rest seconds" decimal={false} value={s.restAccessorySec} onChange={(v) => v && v > 0 && set({ restAccessorySec: v })} />
          </label>
        </div>
        <label className="switch">
          <input type="checkbox" checked={s.sound} onChange={(e) => set({ sound: e.target.checked })} />
          <span>Sound when rest ends</span>
        </label>
        <label className="switch">
          <input type="checkbox" checked={s.vibrate} onChange={(e) => set({ vibrate: e.target.checked })} />
          <span>Vibrate when rest ends</span>
        </label>
      </section>

      <section className="card">
        <h3>Units</h3>
        <label className="field">
          <span>Weight unit</span>
          <select value={s.unit} onChange={() => set({ unit: 'kg' })}>
            <option value="kg">Kilograms (kg)</option>
          </select>
        </label>
      </section>

      <section className="card">
        <h3>Body weight goal</h3>
        <div className="row">
          <label className="field grow">
            <span>Start (kg)</span>
            <NumInput ariaLabel="Start body weight" value={s.startBodyWeight} onChange={(v) => v && set({ startBodyWeight: v })} />
          </label>
          <label className="field grow">
            <span>Target (kg)</span>
            <NumInput ariaLabel="Target body weight" value={s.targetBodyWeight} onChange={(v) => v && set({ targetBodyWeight: v })} />
          </label>
        </div>
        <label className="field">
          <span>Target date</span>
          <input type="date" value={s.targetDate} onChange={(e) => e.target.value && set({ targetDate: e.target.value })} />
        </label>
      </section>

      <section className="card">
        <h3>Training block & deload</h3>
        <p className="muted small">
          Week {week}
          {data.deload.programStart ? ` · program started week of ${formatDate(data.deload.programStart, { day: 'numeric', month: 'short', year: 'numeric' })}` : ' · starts with your first workout'}
          {` · current block began in week ${data.deload.cycleStartWeek}`}
        </p>
        <label className="field">
          <span>Program start (week 1)</span>
          <input
            type="date"
            value={data.deload.programStart ?? ''}
            onChange={(e) => e.target.value && update((d) => ({ ...d, deload: { ...d.deload, programStart: startOfWeek(e.target.value) } }))}
          />
        </label>
        {deloadActive ? (
          <button className="btn block" onClick={() => update((d) => ({ ...d, deload: endDeload(d.deload) }))}>End deload week</button>
        ) : (
          <button className="btn block" onClick={() => confirm('Start a deload this week?') && update((d) => ({ ...d, deload: startDeload(d.deload, week, todayStr()) }))}>
            Start deload now
          </button>
        )}
      </section>

      <section className="card">
        <h3>Data</h3>
        <p className="muted small">Everything is stored only on this device. Export a backup regularly.</p>
        <div className="row">
          <button className="btn grow" onClick={() => exportData(data)}>Export JSON</button>
          <button className="btn grow" onClick={() => fileRef.current?.click()}>Import JSON</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = '';
          }}
        />
        <button className="btn danger block" onClick={reset}>Reset all data</button>
      </section>

      <p className="muted small center">Workout Tracker · {data.workouts.length} workouts logged</p>
    </div>
  );
}
