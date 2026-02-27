import { useState, useEffect, useCallback, useRef } from 'react';
import { getGridSnapshot, GridSnapshot } from './simulation';
import { fetchLiveData } from './api';

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';
const REFRESH_INTERVAL = DEMO_MODE ? 5_000 : 300_000; // 5s demo, 5min live

export function useGridData() {
  const [data, setData] = useState<GridSnapshot | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLive, setIsLive] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetching = useRef(false);

  const refresh = useCallback(async () => {
    if (DEMO_MODE) {
      setData(getGridSnapshot(new Date()));
      setLastUpdated(new Date());
      return;
    }

    // Live mode
    if (fetching.current) return;
    fetching.current = true;
    try {
      const snapshot = await fetchLiveData();
      setData(snapshot);
      setLastUpdated(new Date());
      setIsLive(true);
      setError(null);
    } catch (err) {
      console.error('Live data fetch failed:', err);
      setError(err instanceof Error ? err.message : 'Fetch failed');
      setIsLive(false);
    } finally {
      fetching.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  return { data, lastUpdated, isLive, isDemo: DEMO_MODE, error };
}
