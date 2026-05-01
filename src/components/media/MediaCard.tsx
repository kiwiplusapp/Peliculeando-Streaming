'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { imgUrl, MediaItem } from '@/lib/tmdb';
import { toast } from '@/components/ui/Toaster';
import { useWatchProgress } from './WatchProgressContext';

interface MediaCardProps {
  item: MediaItem;
  inWatchlist?: boolean;
  onWatchlistChange?: (inList: boolean) => void;
  rank?: number;
}

export function MediaCard({ item, inWatchlist = false, onWatchlistChange, rank }: MediaCardProps) {
  const [inList, setInList] = useState(inWatchlist);
  const [loading, setLoading] = useState(false);
  const { getProgress } = useWatchProgress();
  const watched = getProgress(item.tmdb_id, item.media_type);
  const poster  = imgUrl(item.poster_path, 'w342');
  const score   = item.vote_average || 0;
  const year    = item.release_date?.slice(0, 4);
  const href    = `/${item.media_type}/${item.tmdb_id}`;

  const toggleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const method = inList ? 'DELETE' : 'POST';
      const res = await fetch('/api/watchlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdb_id: item.tmdb_id, media_type: item.media_type, title: item.title, poster_path: item.poster_path }),
      });
      if (!res.ok) {
        const j = await res.json();
        if (res.status === 401) { toast('Inicia sesión para guardar', 'error'); return; }
        toast(j.error || 'Error', 'error');
        return;
      }
      setInList(!inList);
      onWatchlistChange?.(!inList);
      toast(inList ? 'Eliminado de tu lista' : 'Añadido a tu lista', 'success');
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={href} className="group relative shrink-0 w-[148px] sm:w-[165px]">
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-[#141414] border border-[#1f1f1f] overflow-hidden transition-all duration-200 group-hover:border-[#FFE600]/30 card-glow">
        {poster ? (
          <Image
            src={poster} alt={item.title} fill sizes="170px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#1f1f1f]">
            <span className="font-mono text-[9px] tracking-widest">POSTER</span>
            <span className="font-mono text-[9px] tracking-widest mt-1">2:3</span>
          </div>
        )}

        {/* Rank badge */}
        {rank !== undefined && (
          <div className="absolute top-0 left-0">
            <span className="rank-badge">{`#${String(rank).padStart(2, '0')}`}</span>
          </div>
        )}

        {/* Score badge */}
        {score > 0 && (
          <div className="absolute top-0 right-0 px-1.5 py-0.5 bg-[#0A0A0A]/90 border-l border-b border-[#1f1f1f]">
            <span className="text-[10px] font-black font-mono text-[#FFE600]">★ {score.toFixed(1)}</span>
          </div>
        )}

        {/* Watchlist button */}
        <button onClick={toggleWatchlist}
          className={`absolute bottom-0 right-0 w-7 h-7 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
            inList
              ? 'bg-[#FFE600] text-black'
              : 'bg-[#0A0A0A]/90 text-[#737373] hover:bg-[#FFE600] hover:text-black border-t border-l border-[#1f1f1f]'
          }`}>
          {inList ? <Check size={12} /> : <Plus size={12} />}
        </button>

        {/* Watch progress bar */}
        {watched && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1f1f1f]">
            <div className="h-full bg-[#FFE600] w-1/3" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>

      {/* Info */}
      <div className="mt-2 px-0.5">
        <p className="text-[12px] font-semibold text-white line-clamp-1 leading-tight">{item.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {watched && item.media_type === 'tv' ? (
            <span className="text-[10px] font-mono text-[#FFE600]">
              T{watched.season_number}·E{watched.episode_number}
            </span>
          ) : (
            <>
              {year && <span className="text-[10px] font-mono text-[#333]">{year}</span>}
              <span className="text-[10px] font-mono text-[#333] uppercase">
                {item.media_type === 'tv' ? 'SERIE' : 'FILM'}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
