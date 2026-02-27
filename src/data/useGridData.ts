import { useState, useEffect, useCallback } from 'react';
import { getGridSnapshot, GridSnapshot } from './simulation';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';
const REFRESH_INTERVAL = DEMO_MODE ? 5_000 : 300_000; // 5s demo, 5min live

export function useGridData() {
  const [data, setData] = useState<GridSnapshot | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);

  const refresh = useCallback(() => {
    if (DEMO_MODE) {
      setData(getGridSnapshot(new Date()));
      setLastUpdated(new Date());
    }
    // Live mode would call the real APIs here
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  return { data, lastUpdated, isLive, isDemo: DEMO_MODE };
}
