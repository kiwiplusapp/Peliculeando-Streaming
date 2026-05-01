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

export function WeeklyTopSection() {
  const [items, setItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/top-semanal')
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4 px-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500">
          <TrendingUp size={13} className="text-black" />
        </div>
        <h2 className="font-bold text-lg text-white tracking-tight">Top semanal de la comunidad</h2>
        <Link href="/comunidad" className="ml-auto text-xs text-amber-400 hover:text-amber-300 transition-colors">
          Ver más →
        </Link>
      </div>

      <div className="px-6 max-w-[1400px] mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i}>
                <div className="skeleton aspect-[2/3] rounded-lg" />
                <div className="skeleton h-3 mt-2 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.slice(0, 10).map((item, i) => {
              const poster = imgUrl(item.poster_path, 'w342');
              return (
                <Link
                  key={`${item.tmdb_id}-${item.media_type}`}
                  href={`/${item.media_type}/${item.tmdb_id}`}
                  className="group relative"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#181818] border border-[#262626] group-hover:-translate-y-1 group-hover:border-amber-500/40 transition-all">
                    {poster ? (
                      <Image
                        src={poster} alt={item.title} fill sizes="200px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Film size={32} className="text-[#525252]" />
                      </div>
                    )}
                    {/* Rank badge */}
                    <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-lg ${
                      i < 3 ? 'bg-amber-500 text-black' : 'bg-black/80 text-[#A3A3A3]'
                    }`}>
                      {i + 1}
                    </div>
                    {/* Activity overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-3 text-xs text-white">
                        <span className="flex items-center gap-1">
                          <MessageSquare size={10} /> {item.review_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bookmark size={10} /> {item.watchlist_count}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-white line-clamp-1 font-medium">{item.title}</p>
                  <p className="text-xs text-[#525252]">{item.media_type === 'movie' ? 'Película' : 'Serie'}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
