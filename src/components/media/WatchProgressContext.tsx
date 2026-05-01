'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface ProgressEntry {
  tmdb_id: number;
  media_type: string;
  season_number: number;
  episode_number: number;
  title: string | null;
  poster_path: string | null;
  updated_at: string;
}

interface WatchProgressCtx {
  progress: Map<string, ProgressEntry>;
  getProgress: (tmdb_id: number, media_type: string) => ProgressEntry | undefined;
  reload: () => void;
}

const WatchProgressContext = createContext<WatchProgressCtx>({
  progress: new Map(),
  getProgress: () => undefined,
  reload: () => {},
});

export function WatchProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Map<string, ProgressEntry>>(new Map());

  const load = () => {
    fetch('/api/progress')
      .then(r => r.json())
      .then(d => {
        if (!d?.items) return;
        const map = new Map<string, ProgressEntry>();
        for (const item of d.items as ProgressEntry[]) {
          map.set(`${item.tmdb_id}_${item.media_type}`, item);
        }
        setProgress(map);
      })
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const getProgress = (tmdb_id: number, media_type: string) =>
    progress.get(`${tmdb_id}_${media_type}`);

  return (
    <WatchProgressContext.Provider value={{ progress, getProgress, reload: load }}>
      {children}
    </WatchProgressContext.Provider>
  );
}

export const useWatchProgress = () => useContext(WatchProgressContext);
