# Workout Tracker

A mobile-first, offline-capable workout tracker for a 4-day upper/lower training plan. It runs entirely in the browser — no backend, no account. All data lives in your phone's `localStorage`.

**Live app:** https://neversadalways.github.io/workout-tracker/

## What it does

- **Today screen** – shows the workout scheduled for today (Sun Lower A · Mon Upper A · Wed Lower B · Sat Upper B), or the next workout on rest days. You can pick any other day manually.
- **Workout logging** – for every exercise: target sets × reps, what you did last time, and a suggested weight (pre-filled). Log weight, reps and optional RPE per set and tick it done.
- **Rest timer** – starts automatically when you tick a set (default 2:00 for main lifts, 1:30 for accessories), with vibration and a beep at the end.
- **Double progression**
  - Top of the rep range in every set → add the exercise's increment (2.5 kg by default, smaller for dumbbells and lateral raises).
  - Below the bottom of the range two sessions in a row → drop ~7.5%.
  - If the target RPE was exceeded by more than 1, it holds the weight even when the reps were hit.
  - The suggestion is only pre-filled, so you can always override it.
- **Back-safety flag** – on Squat, Trap Bar Deadlift and Romanian Deadlift you can mark "back felt off". The next session keeps the weight, or drops ~5% after two flags in a row. Flags are listed under *History → Back log*.
- **Deload** – the app counts training weeks from your first workout. After 6 weeks it prompts a deload: ~60% of the sets at ~90% of the weight. You can start or skip it, or start one any time from Settings.
- **History** – past workouts with notes, plus per-exercise charts of working weight and estimated 1RM (Epley).
- **Body weight** – log weigh-ins and see a 7-day trend line, weekly averages and progress toward a target weight and date (default target date: 15 June 2027).
- **kg or lb per exercise** – switch any exercise to pounds (e.g. machines labelled in lb) in *Settings → Exercise units*, or tap the `kg ⇄` header during a workout. Every session stores its own unit, so suggestions and charts convert old sessions automatically. Exercises in lb progress in lb steps (+5 lb instead of +2.5 kg, +2.5 lb instead of +1 kg).
- **Settings** – training days (move any workout to another weekday), rest timer durations, sound and vibration, per-exercise units, body-weight goal, deload controls, JSON export/import, and reset.
- **PWA** – installable on your phone ("Add to Home Screen") and works offline.

## Run locally

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:5173/workout-tracker/
npm test           # unit tests for progression & deload logic
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Editing the training plan

Everything about the program lives in **[`src/data/plan.ts`](src/data/plan.ts)**, so you never need to touch UI code. Each exercise looks like this:

```ts
{ id: 'bench-press', name: 'Bench Press', sets: 3, repMin: 5, repMax: 5, startWeight: 67.5, increment: 2.5, main: true },
```

| Field | Meaning |
| --- | --- |
| `id` | Stable key for history. Don't rename it once you have logs (or it starts fresh). Using the same id on two days shares history (e.g. Calf Raises). |
| `name` | Display name |
| `sets`, `repMin`, `repMax` | Target. Use the same min and max for fixed reps (e.g. 3×5). |
| `startWeight` | Weight used until there is history (in `weightUnit`) |
| `increment` | Weight added when you hit the top of the range on every set (in `weightUnit`) |
| `weightUnit` | `'kg'` (default) or `'lb'`, the unit of `startWeight` and `increment`. A per-exercise choice in Settings overrides it. |
| `main` | Main lift → longer rest timer |
| `backSafety` | Shows the "back felt off" flag |
| `targetRpe` | Shown next to the target. If any set's logged RPE is more than 1 above it, the weight isn't increased. |
| `unit: 'sec'`, `noWeight` | For timed / bodyweight exercises such as planks |
| `restSec` | Per-exercise rest override |

To move a workout to another day, use **Settings → Training days** in the app (picking a day another workout already uses swaps the two), or change the default `weekday` here (0 = Sunday … 6 = Saturday). Deload frequency and size live in the `DELOAD` constant in the same file. Push to `main` and the site redeploys automatically.

## Backups

Data is stored only in the browser on that device. Use **Settings → Export JSON** regularly, and **Import JSON** to restore it or move it to another device.

## Deployment

`.github/workflows/deploy.yml` runs the tests, builds the app and deploys `dist/` to GitHub Pages on every push to `main`. The Vite `base` is set to `/workout-tracker/` in `vite.config.ts`. If you rename the repository, change it there.

## Project structure

```
src/
  data/plan.ts        ← the training plan (edit me)
  types.ts            ← plan / workout / log types
  lib/                ← pure logic: progression, deload, schedule, dates, storage, body weight
  components/         ← rest timer, SVG line chart, number input
  screens/            ← Today, Workout, History, Body, Settings
  tests/              ← vitest unit tests
scripts/gen-icons.mjs ← generates the PWA icons
```
