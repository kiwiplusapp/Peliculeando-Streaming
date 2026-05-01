'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { imgUrl, MediaItem } from '@/lib/tmdb';
import { toast } from '@/components/ui/Toaster';

interface MediaCardProps {
  item: MediaItem;
  inWatchlist?: boolean;
  onWatchlistChange?: (inList: boolean) => void;
}

export function MediaCard({ item, inWatchlist = false, onWatchlistChange }: MediaCardProps) {
  const [inList, setInList] = useState(inWatchlist);
  const [loading, setLoading] = useState(false);
  const poster = imgUrl(item.poster_path, 'w342');
  const score = item.vote_average || 0;
  const year = item.release_date?.slice(0, 4);
  const href = `/${item.media_type}/${item.tmdb_id}`;

  const scoreColor = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';

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
        body: JSON.stringify({
          tmdb_id: item.tmdb_id,
          media_type: item.media_type,
          title: item.title,
          poster_path: item.poster_path,
        }),
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
    <Link href={href} className="group relative flex-shrink-0 w-[155px] sm:w-[175px]">
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#181818] border border-[#262626] card-glow transition-all duration-300 group-hover:-translate-y-1">
        {poster ? (
          <Image
            src={poster}
            alt={item.title}
            fill
            sizes="180px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[#333333]">
            <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" />
            </svg>
          </div>
        )}

        {/* Score badge */}
        {score > 0 && (
          <div
            className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold"
            style={{ background: `${scoreColor}20`, color: scoreColor, border: `1px solid ${scoreColor}40` }}
          >
            <Star size={10} fill={scoreColor} />
            {score.toFixed(1)}
          </div>
        )}

        {/* Watchlist button */}
        <button
          onClick={toggleWatchlist}
          className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
            inList
              ? 'bg-amber-500 text-black'
              : 'bg-black/70 text-white hover:bg-amber-500 hover:text-black'
          }`}
        >
          {inList ? <Check size={13} /> : <Plus size={13} />}
        </button>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div className="mt-2 px-0.5">
        <p className="text-sm font-medium text-white line-clamp-2 leading-tight">{item.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {year && <span className="text-xs text-[#525252]">{year}</span>}
          <span className="text-xs text-[#525252] capitalize">
            {item.media_type === 'tv' ? 'Serie' : 'Película'}
          </span>
        </div>
      </div>
    </Link>
  );
}
