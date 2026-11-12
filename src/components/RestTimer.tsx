import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useStore } from '../store';

interface TimerState {
  endsAt: number;
  total: number;
  label: string;
}

interface TimerApi {
  start: (seconds: number, label: string) => void;
  stop: () => void;
}

const TimerContext = createContext<TimerApi | null>(null);

let audioCtx: AudioContext | null = null;

/** Must be called from a user gesture so iOS allows sound later. */
function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') void audioCtx.resume();
  } catch {
    /* no audio support */
  }
}

function beep() {
  if (!audioCtx) return;
  const t0 = audioCtx.currentTime;
  [0, 0.3, 0.6].forEach((dt) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, t0 + dt);
    gain.gain.exponentialRampToValueAtTime(0.4, t0 + dt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.22);
    osc.connect(gain).connect(audioCtx!.destination);
    osc.start(t0 + dt);
    osc.stop(t0 + dt + 0.25);
  });
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const { data } = useStore();
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [now, setNow] = useState(Date.now());
  const [finished, setFinished] = useState(false);
  const firedRef = useRef(false);

  const start = useCallback((seconds: number, label: string) => {
    unlockAudio();
    firedRef.current = false;
    setFinished(false);
    setNow(Date.now());
    setTimer({ endsAt: Date.now() + seconds * 1000, total: seconds, label });
  }, []);

  const stop = useCallback(() => {
    setTimer(null);
    setFinished(false);
  }, []);

  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [timer]);

  const remaining = timer ? Math.max(0, Math.ceil((timer.endsAt - now) / 1000)) : 0;

  useEffect(() => {
    if (!timer || remaining > 0 || firedRef.current) return;
    firedRef.current = true;
    setFinished(true);
    if (data.settings.vibrate && 'vibrate' in navigator) navigator.vibrate([400, 150, 400, 150, 400]);
    if (data.settings.sound) beep();
    const id = setTimeout(() => {
      setTimer(null);
      setFinished(false);
    }, 4000);
    return () => clearTimeout(id);
  }, [timer, remaining, data.settings.vibrate, data.settings.sound]);

  const adjust = (delta: number) =>
    setTimer((t) => (t ? { ...t, endsAt: Math.max(Date.now(), t.endsAt + delta * 1000), total: Math.max(1, t.total + delta) } : t));

  return (
    <TimerContext.Provider value={{ start, stop }}>
      {children}
      {timer && (
        <div className={`rest-timer ${finished ? 'done' : ''}`} role="timer" aria-live="polite">
          <div className="rest-progress" style={{ width: `${(1 - remaining / timer.total) * 100}%` }} />
          <div className="rest-body">
            <div>
              <div className="rest-label">{finished ? 'Rest over — go!' : `Rest · ${timer.label}`}</div>
              <div className="rest-time">{fmt(remaining)}</div>
            </div>
            <div className="rest-actions">
              <button className="btn small ghost" onClick={() => adjust(-15)}>−15</button>
              <button className="btn small ghost" onClick={() => adjust(15)}>+15</button>
              <button className="btn small" onClick={stop}>Skip</button>
            </div>
          </div>
        </div>
      )}
    </TimerContext.Provider>
  );
}

export function useRestTimer(): TimerApi {
  const t = useContext(TimerContext);
  if (!t) throw new Error('useRestTimer outside provider');
  return t;
}
