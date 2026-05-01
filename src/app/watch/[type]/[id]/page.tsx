'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useXPNotification } from '@/components/gamification/XPNotification';

interface Episode {
  episode_number: number;
  name: string;
}

export default function WatchPage({ params }: { params: { type: string; id: string } }) {
  const { type, id } = params;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [season, setSeason] = useState(() => Number(searchParams.get('s')) || 1);
  const [episode, setEpisode] = useState(() => Number(searchParams.get('e')) || 1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasons, setSeasons] = useState(1);
  const [title, setTitle] = useState('');
  const [posterPath, setPosterPath] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const saveRef = useRef<NodeJS.Timeout | null>(null);
  const xpNotif = useXPNotification();
  const isTV = type === 'tv';

  // Load saved progress and metadata on mount
  useEffect(() => {
    // Fetch saved progress
    fetch(`/api/progress?tmdb_id=${id}&media_type=${type}`)
      .then(r => r.json())
      .then(d => {
        if (d?.season_number && !searchParams.get('s')) setSeason(Number(d.season_number));
        if (d?.episode_number && !searchParams.get('e')) setEpisode(Number(d.episode_number));
        if (d?.title) setTitle(d.title);
        if (d?.poster_path) setPosterPath(d.poster_path);
      })
      .catch(() => {})
      .finally(() => setReady(true));

    // Fetch basic media info for title/poster if not in progress
    fetch(`/api/personas/${id}`).catch(() => {});
  }, [id, type, searchParams]);

  // Fetch episode list when season changes (TV only)
  useEffect(() => {
    if (!isTV) return;
    fetch(`/api/tmdb/season?id=${id}&season=${season}`)
      .then(r => r.json())
      .then(d => setEpisodes(d.episodes || []))
      .catch(() => {});
  }, [isTV, id, season]);

  // Initialize total seasons from query param
  useEffect(() => {
    if (!isTV) return;
    const s = Number(searchParams.get('seasons'));
    if (s > 0) setSeasons(s);
  }, [isTV, searchParams]);

  const firstSave = useRef(true);
  const saveProgress = useCallback(() => {
    if (!ready) return;
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdb_id: Number(id),
        media_type: type,
        season_number: season,
        episode_number: episode,
        progress_seconds: 0,
        title: title || null,
        poster_path: posterPath || null,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(() => {
        // Show XP toast on first save of a session
        if (firstSave.current) {
          firstSave.current = false;
          const action = type === 'tv' ? 'watch_episode' : 'watch_movie';
          const xp = type === 'tv' ? 10 : 25;
          xpNotif.showXP(xp, xp, []);
        }
      })
      .catch(() => {});
  }, [id, type, season, episode, ready, title, posterPath, xpNotif]);

  // Auto-save every 30s
  useEffect(() => {
    if (!ready) return;
    saveProgress();
    saveRef.current = setInterval(saveProgress, 30000);
    return () => { if (saveRef.current) clearInterval(saveRef.current); };
  }, [saveProgress, ready]);

  // Save on page unload / navigation
  useEffect(() => {
    const handler = () => saveProgress();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveProgress]);

  const handleBack = () => {
    saveProgress();
    router.back();
  };

  const src = isTV
    ? `https://vaplayer.ru/embed/tv?tmdb=${id}&season=${season}&episode=${episode}&primaryColor=f59e0b`
    : `https://vaplayer.ru/embed/movie?tmdb=${id}&primaryColor=f59e0b`;

  const HEADER_H = 52;
  const hasEpisodes = isTV && episodes.length > 0;
  const FOOTER_H = hasEpisodes ? 56 : 0;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header — plain DOM button with router.back(), NO iframe interaction needed */}
      <div
        className="shrink-0 flex items-center justify-between px-4 bg-[#0d0d0d] border-b border-[#1f1f1f]"
        style={{ height: HEADER_H }}
      >
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#A3A3A3] hover:text-white transition-colors group"
        >
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10 border border-white/10 transition-colors">
            <ArrowLeft size={16} />
          </span>
          <span className="text-sm font-medium hidden sm:block">{title || 'Volver'}</span>
        </button>

        {isTV && (
          <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full font-medium">
            T{season} · E{episode}
          </span>
        )}

        {/* Invisible spacer to keep title centered */}
        <div className="w-8 sm:w-24" />
      </div>

      {/* Player */}
      <div className="flex-1 relative">
        {ready && (
          <iframe
            key={`${id}-${season}-${episode}`}
            src={src}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            className="absolute inset-0 w-full h-full border-none"
          />
        )}
      </div>

      {/* Episode bar */}
      {hasEpisodes && (
        <div
          className="shrink-0 flex items-center gap-2 px-4 bg-[#0d0d0d] border-t border-[#1f1f1f] overflow-x-auto scrollbar-none"
          style={{ height: FOOTER_H }}
        >
          {Array.from({ length: Math.min(seasons, 20) }, (_, i) => i + 1).map(s => (
            <button
              key={s}
              onClick={() => { setSeason(s); setEpisode(1); }}
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
              onClick={() => setEpisode(ep.episode_number)}
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
    </div>
  );
}
