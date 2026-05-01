'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Episode {
  episode_number: number;
  name: string;
}

interface PlayerItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  release_date?: string;
  number_of_seasons?: number;
}

export function PlayerModal({ item, onClose }: { item: PlayerItem; onClose: () => void }) {
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const saveRef = useRef<NodeJS.Timeout | null>(null);
  const isTV = item.media_type === 'tv';
  const seasons = item.number_of_seasons || 1;

  // Load saved progress on mount
  useEffect(() => {
    fetch(`/api/progress?tmdb_id=${item.tmdb_id}&media_type=${item.media_type}`)
      .then(r => r.json())
      .then(d => {
        if (d?.season_number) setSeason(Number(d.season_number));
        if (d?.episode_number) setEpisode(Number(d.episode_number));
      })
      .catch(() => {})
      .finally(() => setProgressLoaded(true));
  }, [item.tmdb_id, item.media_type]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Escape key to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Fetch episode list when season changes
  useEffect(() => {
    if (!isTV) return;
    fetch(`/api/tmdb/season?id=${item.tmdb_id}&season=${season}`)
      .then(r => r.json())
      .then(d => setEpisodes(d.episodes || []))
      .catch(() => {});
  }, [isTV, item.tmdb_id, season]);

  const saveProgress = useCallback(() => {
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdb_id: item.tmdb_id,
        media_type: item.media_type,
        season_number: season,
        episode_number: episode,
        progress_seconds: 0,
      }),
    }).catch(() => {});
  }, [item, season, episode]);

  // Save progress periodically
  useEffect(() => {
    if (!progressLoaded) return;
    saveProgress();
    saveRef.current = setInterval(saveProgress, 30000);
    return () => { if (saveRef.current) clearInterval(saveRef.current); };
  }, [saveProgress, progressLoaded]);

  // Save on close
  const handleClose = useCallback(() => {
    saveProgress();
    onClose();
  }, [saveProgress, onClose]);

  const src = isTV
    ? `https://vaplayer.ru/embed/tv?tmdb=${item.tmdb_id}&season=${season}&episode=${episode}&primaryColor=f59e0b`
    : `https://vaplayer.ru/embed/movie?tmdb=${item.tmdb_id}&primaryColor=f59e0b`;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header — sits above the iframe via flex order, plus explicit z-index */}
      <div
        className="relative z-[110] flex items-center justify-between px-4 py-3 bg-[#0d0d0d]/95 border-b border-[#262626] shrink-0 backdrop-blur-sm"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white text-sm truncate max-w-[60vw]">{item.title}</span>
          {isTV && (
            <span className="text-xs text-[#A3A3A3] shrink-0">T{season} · E{episode}</span>
          )}
        </div>
        {/* Use onMouseDown so the click fires before the iframe steals focus */}
        <button
          onMouseDown={handleClose}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-[#A3A3A3] hover:text-white transition-colors border border-white/10"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Player area */}
      <div className="flex-1 relative z-[100]">
        {progressLoaded && (
          <iframe
            key={`${item.tmdb_id}-${season}-${episode}`}
            src={src}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full border-none"
          />
        )}
      </div>

      {/* Episode bar (TV only) */}
      {isTV && episodes.length > 0 && (
        <div
          className="relative z-[110] flex items-center gap-2 px-4 py-3 bg-[#0d0d0d]/95 border-t border-[#262626] overflow-x-auto shrink-0 scrollbar-none backdrop-blur-sm"
          style={{ pointerEvents: 'auto' }}
        >
          {/* Season buttons */}
          {Array.from({ length: seasons }, (_, i) => i + 1).map(s => (
            <button
              key={s}
              onMouseDown={() => { setSeason(s); setEpisode(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 transition-colors ${
                s === season
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-[#181818] text-[#A3A3A3] hover:text-white border border-[#333333]'
              }`}
            >
              T{s}
            </button>
          ))}

          <div className="w-px h-5 bg-[#333333] shrink-0 mx-1" />

          {/* Episode buttons */}
          {episodes.map(ep => (
            <button
              key={ep.episode_number}
              onMouseDown={() => setEpisode(ep.episode_number)}
              className={`px-3 py-1.5 text-xs rounded-lg shrink-0 transition-colors whitespace-nowrap ${
                ep.episode_number === episode
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-[#181818] text-[#A3A3A3] hover:text-white border border-[#333333]'
              }`}
            >
              {ep.episode_number}. {ep.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
