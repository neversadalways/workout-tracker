import { formatDate } from '../lib/dates';

export interface Series {
  label: string;
  color: string;
  points: { x: string; y: number }[]; // x = YYYY-MM-DD
  dashed?: boolean;
  dots?: boolean;
}

interface Props {
  series: Series[];
  height?: number;
  unit?: string;
  target?: { y: number; label: string };
}

const W = 340;
const PAD = { l: 38, r: 10, t: 12, b: 24 };

function toTime(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Tiny dependency-free SVG line chart. */
export function LineChart({ series, height = 200, unit = 'kg', target }: Props) {
  const all = series.flatMap((s) => s.points);
  if (all.length === 0) return <p className="muted center">No data yet.</p>;

  const xs = all.map((p) => toTime(p.x));
  const ys = all.map((p) => p.y).concat(target ? [target.y] : []);
  let minX = Math.min(...xs);
  let maxX = Math.max(...xs);
  if (minX === maxX) {
    minX -= 86_400_000 * 3;
    maxX += 86_400_000 * 3;
  }
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  const padY = Math.max((maxY - minY) * 0.1, 1);
  minY -= padY;
  maxY += padY;

  const H = height;
  const sx = (t: number) => PAD.l + ((t - minX) / (maxX - minX)) * (W - PAD.l - PAD.r);
  const sy = (v: number) => PAD.t + (1 - (v - minY) / (maxY - minY)) * (H - PAD.t - PAD.b);
  const ticks = Array.from({ length: 4 }, (_, i) => minY + ((maxY - minY) * (i + 0.5)) / 4);
  const firstX = all.reduce((a, p) => (p.x < a ? p.x : a), all[0].x);
  const lastX = all.reduce((a, p) => (p.x > a ? p.x : a), all[0].x);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(t)} y2={sy(t)} className="grid" />
            <text x={PAD.l - 6} y={sy(t) + 4} textAnchor="end" className="axis">
              {Math.round(t)}
            </text>
          </g>
        ))}
        {target && (
          <g>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(target.y)} y2={sy(target.y)} className="target-line" />
            <text x={W - PAD.r} y={sy(target.y) - 4} textAnchor="end" className="axis accent">
              {target.label}
            </text>
          </g>
        )}
        <text x={PAD.l} y={H - 6} className="axis">{formatDate(firstX)}</text>
        <text x={W - PAD.r} y={H - 6} textAnchor="end" className="axis">{formatDate(lastX)}</text>
        {series.map((s) => {
          const pts = [...s.points].sort((a, b) => (a.x < b.x ? -1 : 1));
          const d = pts.map((p, i) => `${i ? 'L' : 'M'}${sx(toTime(p.x)).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
          return (
            <g key={s.label}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeDasharray={s.dashed ? '5 4' : undefined} strokeLinejoin="round" strokeLinecap="round" />
              {s.dots !== false && pts.map((p, i) => <circle key={i} cx={sx(toTime(p.x))} cy={sy(p.y)} r={3.5} fill={s.color} />)}
            </g>
          );
        })}
      </svg>
      <div className="legend">
        {series.map((s) => (
          <span key={s.label}>
            <i style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="muted">{unit}</span>
      </div>
    </div>
  );
}
