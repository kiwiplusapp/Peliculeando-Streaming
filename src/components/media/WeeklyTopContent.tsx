'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, Film, MessageSquare, Bookmark } from 'lucide-react';
import { imgUrl } from '@/lib/tmdb';

interface TopItem {
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  activity_score: number;
  review_count: number;
  watchlist_count: number;
}

export function WeeklyTopContent() {
  const [items, setItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const handleImgError = (key: string) => {
    setFailedImages(prev => { const n = new Set(prev); n.add(key); return n; });
  };

  useEffect(() => {
    fetch('/api/top-semanal')
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-[#525252]">
        <TrendingUp size={48} className="mx-auto mb-3 opacity-30" />
        <p>No hay actividad esta semana todavía</p>
        <p className="text-xs mt-1">Las reseñas y guardados aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const poster = imgUrl(item.poster_path, 'w92');
        const maxScore = items[0].activity_score;
        const pct = maxScore > 0 ? (item.activity_score / maxScore) * 100 : 0;
        const imgKey = `${item.tmdb_id}-${item.media_type}`;

        return (
          <Link
            key={imgKey}
            href={`/${item.media_type}/${item.tmdb_id}`}
            className="flex items-center gap-4 p-3 bg-[#111111] border border-[#262626] rounded-xl hover:border-amber-500/30 transition-all group"
          >
            {/* Rank */}
            <div className="w-8 text-center shrink-0">
              <span className={`text-base font-bold ${i < 3 ? 'text-amber-400' : 'text-[#525252]'}`}>
                #{i + 1}
              </span>
            </div>

            {/* Poster */}
            <div className="w-12 h-16 rounded-lg overflow-hidden bg-[#181818] border border-[#333333] shrink-0">
              {poster && !failedImages.has(imgKey) ? (
                <Image src={poster} alt={item.title} width={48} height={64} className="object-cover w-full h-full" onError={() => handleImgError(imgKey)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film size={16} className="text-[#525252]" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white text-sm truncate group-hover:text-amber-400 transition-colors">
                {item.title}
              </p>
              <p className="text-xs text-[#525252] mb-2">
                {item.media_type === 'movie' ? 'Película' : 'Serie'}
              </p>
              {/* Activity bar */}
              <div className="h-1 bg-[#262626] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-3 shrink-0 text-xs text-[#525252]">
              <span className="flex items-center gap-1">
                <MessageSquare size={11} className="text-amber-400" />
                {item.review_count}
              </span>
              <span className="flex items-center gap-1">
                <Bookmark size={11} className="text-emerald-400" />
                {item.watchlist_count}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
