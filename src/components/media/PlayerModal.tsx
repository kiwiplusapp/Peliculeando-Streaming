'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';

interface Episode {
  episode_number: number;
  name: string;
}

interface PlayerItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path?: string | null;
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

  // Escape key closes the modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
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
        title: item.title,
        poster_path: item.poster_path || null,
      }),
    }).catch(() => {});
  }, [item, season, episode]);

  // Save progress periodically after progress is loaded
  useEffect(() => {
    if (!progressLoaded) return;
    saveProgress();
    saveRef.current = setInterval(saveProgress, 30000);
    return () => { if (saveRef.current) clearInterval(saveRef.current); };
  }, [saveProgress, progressLoaded]);

  const handleClose = useCallback(() => {
    saveProgress();
    onClose();
  }, [saveProgress, onClose]);

  const src = isTV
    ? `https://vidjoy.pro/embed/tv/${item.tmdb_id}/${season}/${episode}`
    : `https://vidjoy.pro/embed/movie/${item.tmdb_id}`;

  const HEADER_H = 52;
  const FOOTER_H = isTV && episodes.length > 0 ? 56 : 0;

  return (
    <>
      {/* Dark backdrop */}
      <div className="fixed inset-0 z-[100] bg-black" />

      {/*
        Header — position: fixed so it lives in its own stacking context,
        completely above the iframe regardless of iframe pointer capture.
        Use onMouseDown (not onClick) so it fires before the iframe focus event.
      */}
      <div
        className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-4 bg-[#0d0d0d] border-b border-[#262626]"
        style={{ height: HEADER_H }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-semibold text-white text-sm truncate">{item.title}</span>
          {isTV && (
            <span className="text-xs text-amber-400 shrink-0 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              T{season} · E{episode}
            </span>
          )}
        </div>
        <button
          onMouseDown={handleClose}
          className="ml-4 shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/15 text-[#A3A3A3] hover:text-white transition-colors border border-white/10"
          aria-label="Cerrar (Escape)"
        >
          <X size={18} />
        </button>
      </div>

      {/* Iframe — occupies remaining space between header and footer */}
      <div
        className="fixed left-0 right-0 z-[150]"
        style={{ top: HEADER_H, bottom: FOOTER_H }}
      >
        {progressLoaded && (
          <iframe
            key={`${item.tmdb_id}-${season}-${episode}`}
            src={src}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            referrerPolicy="no-referrer"
            className="w-full h-full border-none"
          />
        )}
      </div>

      {/* Episode bar — fixed at bottom, same z-index as header */}
      {isTV && episodes.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[200] flex items-center gap-2 px-4 bg-[#0d0d0d] border-t border-[#262626] overflow-x-auto scrollbar-none"
          style={{ height: FOOTER_H }}
        >
          {Array.from({ length: seasons }, (_, i) => i + 1).map(s => (
            <button
              key={s}
              onMouseDown={() => { setSeason(s); setEpisode(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 transition-colors ${
                s === season
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-[#1a1a1a] text-[#A3A3A3] hover:text-white border border-[#333333]'
              }`}
            >
              T{s}
            </button>
          ))}

          <div className="w-px h-5 bg-[#333333] shrink-0 mx-1" />

          {episodes.map(ep => (
            <button
              key={ep.episode_number}
              onMouseDown={() => setEpisode(ep.episode_number)}
              className={`px-3 py-1.5 text-xs rounded-lg shrink-0 transition-colors whitespace-nowrap ${
                ep.episode_number === episode
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-[#1a1a1a] text-[#A3A3A3] hover:text-white border border-[#333333]'
              }`}
            >
              {ep.episode_number}. {ep.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
