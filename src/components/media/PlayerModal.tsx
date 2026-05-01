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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saveRef = useRef<NodeJS.Timeout | null>(null);
  const isTV = item.media_type === 'tv';

  const src = isTV
    ? `https://vaplayer.ru/embed/tv?tmdb=${item.tmdb_id}&season=${season}&episode=${episode}&primaryColor=7c3aed`
    : `https://vaplayer.ru/embed/movie?tmdb=${item.tmdb_id}&primaryColor=7c3aed`;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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

  useEffect(() => {
    saveRef.current = setInterval(saveProgress, 30000);
    return () => { if (saveRef.current) clearInterval(saveRef.current); };
  }, [saveProgress]);

  const seasons = item.number_of_seasons || 1;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-[#262626] shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-white text-sm">{item.title}</span>
          {isTV && (
            <span className="text-xs text-[#A3A3A3]">T{season} · E{episode}</span>
          )}
        </div>
        <button onClick={onClose} className="text-[#A3A3A3] hover:text-white p-1">
          <X size={20} />
        </button>
      </div>

      {/* Player */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={src}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-orientation-lock"
          className="absolute inset-0 w-full h-full border-none"
        />
      </div>

      {/* Episode bar (TV only) */}
      {isTV && episodes.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 bg-[#111111] border-t border-[#262626] overflow-x-auto shrink-0">
          {/* Season buttons */}
          {Array.from({ length: seasons }, (_, i) => i + 1).map(s => (
            <button
              key={s}
              onClick={() => { setSeason(s); setEpisode(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg shrink-0 transition-colors ${
                s === season
                  ? 'bg-amber-500 text-white'
                  : 'bg-[#181818] text-[#A3A3A3] hover:text-white border border-[#262626]'
              }`}
            >
              T{s}
            </button>
          ))}

          <div className="w-px h-5 bg-[#262626] shrink-0 mx-1" />

          {/* Episode buttons */}
          {episodes.map(ep => (
            <button
              key={ep.episode_number}
              onClick={() => setEpisode(ep.episode_number)}
              className={`px-3 py-1.5 text-xs rounded-lg shrink-0 transition-colors whitespace-nowrap ${
                ep.episode_number === episode
                  ? 'bg-amber-500 text-white font-medium'
                  : 'bg-[#181818] text-[#A3A3A3] hover:text-white border border-[#262626]'
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
