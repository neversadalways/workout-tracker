import { useEffect, useState } from 'react';
import { useStore } from './store';
import { HomeScreen } from './screens/HomeScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { BodyScreen } from './screens/BodyScreen';
import { SettingsScreen } from './screens/SettingsScreen';

type Tab = 'today' | 'history' | 'body' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '🏋️' },
  { id: 'history', label: 'History', icon: '📈' },
  { id: 'body', label: 'Body', icon: '⚖️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function App() {
  const { data } = useStore();
  const [tab, setTab] = useState<Tab>('today');
  const [inWorkout, setInWorkout] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, inWorkout]);

  const showWorkout = tab === 'today' && inWorkout && data.active;

  return (
    <div className="app">
      <main>
        {tab === 'today' && (showWorkout ? <WorkoutScreen onClose={() => setInWorkout(false)} /> : <HomeScreen onOpenWorkout={() => setInWorkout(true)} />)}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'body' && <BodyScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
            <span aria-hidden>{t.icon}</span>
            {t.label}
            {t.id === 'today' && data.active && <i className="dot" aria-label="workout in progress" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
