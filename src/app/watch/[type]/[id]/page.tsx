'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

  const [season, setSeason]   = useState(() => Number(searchParams.get('s')) || 1);
  const [episode, setEpisode] = useState(() => Number(searchParams.get('e')) || 1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasons, setSeasons] = useState(1);
  const [title, setTitle]     = useState(() => searchParams.get('title') || '');
  const [posterPath, setPosterPath] = useState<string | null>(() => searchParams.get('poster'));
  const [ready, setReady]     = useState(false);

  // XP tracking
  const xpNotif       = useXPNotification();
  const startTimeRef  = useRef<number>(Date.now());
  const xpFiredRef    = useRef(false);
  const isTV = type === 'tv';

  // Load saved progress on mount
  useEffect(() => {
    fetch(`/api/progress?tmdb_id=${id}&media_type=${type}`)
      .then(r => r.json())
      .then(d => {
        if (d?.season_number && !searchParams.get('s')) setSeason(Number(d.season_number));
        if (d?.episode_number && !searchParams.get('e')) setEpisode(Number(d.episode_number));
        if (d?.title)       setTitle(d.title);
        if (d?.poster_path) setPosterPath(d.poster_path);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, [id, type, searchParams]);

  // Fetch episode list when season changes (TV only)
  useEffect(() => {
    if (!isTV) return;
    fetch(`/api/tmdb/season?id=${id}&season=${season}`)
      .then(r => r.json())
      .then(d => setEpisodes(d.episodes || []))
      .catch(() => {});
  }, [isTV, id, season]);

  // Initialise total seasons
  useEffect(() => {
    if (!isTV) return;
    const s = Number(searchParams.get('seasons'));
    if (s > 0) setSeasons(s);
  }, [isTV, searchParams]);

  // ── Save progress ──────────────────────────────────────────────────────────
  const saveProgress = useCallback(() => {
    if (!ready) return;
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdb_id: Number(id), media_type: type,
        season_number: season, episode_number: episode,
        progress_seconds: 0,
        title: title || null, poster_path: posterPath || null,
      }),
    }).catch(() => {});
  }, [id, type, season, episode, ready, title, posterPath]);

  // Auto-save every 30 s
  const saveRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!ready) return;
    saveProgress();
    saveRef.current = setInterval(saveProgress, 30_000);
    return () => { if (saveRef.current) clearInterval(saveRef.current); };
  }, [saveProgress, ready]);

  // ── Award XP on completion (once per film, min watch time) ────────────────
  const awardCompletionXP = useCallback(() => {
    if (xpFiredRef.current) return;
    const minutesWatched = (Date.now() - startTimeRef.current) / 60_000;
    const minMinutes = isTV ? 10 : 20;
    if (minutesWatched < minMinutes) return;

    xpFiredRef.current = true;
    fetch('/api/xp/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdb_id: Number(id),
        media_type: type,
        minutes_watched: Math.round(minutesWatched),
      }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.ok && !d.alreadyAwarded && d.xpGained > 0) {
          xpNotif.showXP(d.xpGained, d.xpGained, []);
        }
      })
      .catch(() => {});
  }, [id, type, isTV, xpNotif]);

  // Fire XP on page leave / navigation (covers browser back, tab close, etc.)
  useEffect(() => {
    const handler = () => {
      saveProgress();
      awardCompletionXP();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveProgress, awardCompletionXP]);

  // Also fire XP when episode changes (user finished one and moved to next)
  const prevEpisode = useRef(episode);
  useEffect(() => {
    if (isTV && episode !== prevEpisode.current) {
      awardCompletionXP();
      xpFiredRef.current = false; // allow XP again for next episode
      startTimeRef.current = Date.now();
      prevEpisode.current = episode;
    }
  }, [episode, isTV, awardCompletionXP]);

  // ── Back button ────────────────────────────────────────────────────────────
  const handleBack = () => {
    saveProgress();
    awardCompletionXP();
    router.back();
  };

  const src = isTV
    ? `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}?autoPlay=true`
    : `https://vidsrc.cc/v2/embed/movie/${id}?autoPlay=true`;

  const HEADER_H  = 52;
  const hasEpisodes = isTV && episodes.length > 0;
  const FOOTER_H  = hasEpisodes ? 56 : 0;

  return (
    <div className="fixed inset-0 bg-black flex flex-col">

      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between px-4 bg-[#0A0A0A] border-b border-[#1f1f1f]"
        style={{ height: HEADER_H }}>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#A3A3A3] hover:text-white transition-colors group">
          <span className="w-8 h-8 flex items-center justify-center bg-white/5 group-hover:bg-white/10 border border-white/10 transition-colors">
            <ArrowLeft size={16} />
          </span>
          <span className="text-sm font-medium hidden sm:block">{title || 'Volver'}</span>
        </button>

        {isTV && (
          <span className="text-[10px] font-black font-mono tracking-widest text-[#FFE600] border border-[#FFE600]/30 px-2.5 py-1">
            T{season} · E{episode}
          </span>
        )}

        <div className="w-8 sm:w-24" />
      </div>

      {/* ── Player ── */}
      <div className="flex-1 relative">
        {ready && (
          <iframe
            key={`${id}-${season}-${episode}`}
            src={src}
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full border-none"
          />
        )}
      </div>

      {/* ── Episode bar (TV) ── */}
      {hasEpisodes && (
        <div
          className="shrink-0 flex items-center gap-2 px-4 bg-[#0A0A0A] border-t border-[#1f1f1f] overflow-x-auto scrollbar-none"
          style={{ height: FOOTER_H }}>
          {Array.from({ length: Math.min(seasons, 20) }, (_, i) => i + 1).map(s => (
            <button key={s}
              onClick={() => { setSeason(s); setEpisode(1); }}
              className={`px-3 py-1.5 text-[10px] font-black tracking-widest shrink-0 transition-colors border ${
                s === season
                  ? 'bg-[#FFE600] text-black border-[#FFE600]'
                  : 'bg-[#141414] text-[#525252] hover:text-white border-[#1f1f1f] hover:border-[#333]'
              }`}
              style={{ fontFamily: 'Space Grotesk' }}>
              T{s}
            </button>
          ))}
          <div className="w-px h-6 bg-[#1f1f1f] mx-1 shrink-0" />
          {episodes.map(ep => (
            <button key={ep.episode_number}
              onClick={() => setEpisode(ep.episode_number)}
              className={`px-3 py-1.5 text-[10px] font-semibold shrink-0 transition-colors border ${
                ep.episode_number === episode
                  ? 'bg-[#FFE600] text-black border-[#FFE600]'
                  : 'bg-[#141414] text-[#525252] hover:text-white border-[#1f1f1f] hover:border-[#333]'
              }`}>
              {ep.episode_number}. {ep.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
