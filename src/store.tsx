import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppData } from './types';
import { loadData, saveData } from './lib/storage';
import { todayStr } from './lib/dates';
import { isDeloadActive, weekNumber } from './lib/deload';

interface Store {
  data: AppData;
  update: (fn: (d: AppData) => AppData) => void;
  replace: (d: AppData) => void;
  week: number;
  deloadActive: boolean;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  useEffect(() => {
    saveData(data);
  }, [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => setData((d) => fn(d)), []);
  const replace = useCallback((d: AppData) => setData(d), []);

  const value = useMemo(() => {
    const week = weekNumber(data.deload.programStart, todayStr());
    return { data, update, replace, week, deloadActive: isDeloadActive(data.deload, week) };
  }, [data, update, replace]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
