'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 px-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <h2 className="text-[11px] font-black tracking-[0.12em] text-white uppercase"
            style={{ fontFamily: 'Space Grotesk' }}>
            TOP SEMANAL · COMUNIDAD
          </h2>
        </div>
        <Link href="/comunidad"
          className="text-[10px] font-semibold tracking-widest text-[#333] hover:text-[#FFE600] transition-colors"
          style={{ fontFamily: 'Space Grotesk' }}>
          VER OLIMPO →
        </Link>
      </div>

      <div className="px-6 max-w-[1400px] mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-[#141414] border border-[#1f1f1f] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {items.slice(0, 10).map((item, i) => {
              const poster = imgUrl(item.poster_path, 'w342');
              const isTop3 = i < 3;
              return (
                <Link
                  key={`${item.tmdb_id}-${item.media_type}`}
                  href={`/${item.media_type}/${item.tmdb_id}`}
                  className="group relative"
                >
                  <div className="relative aspect-[2/3] bg-[#141414] border border-[#1f1f1f] overflow-hidden group-hover:border-[#FFE600]/30 transition-all duration-200">
                    {poster ? (
                      <Image
                        src={poster} alt={item.title} fill sizes="200px"
                        className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#1f1f1f]">
                        <span className="font-mono text-xl font-black">{String(i + 1).padStart(2, '0')}</span>
                      </div>
                    )}

                    {/* Rank badge */}
                    <div className={`absolute top-0 left-0 px-1.5 py-0.5 border-r border-b border-[#1f1f1f] ${
                      isTop3 ? 'bg-[#FFE600]' : 'bg-[#0A0A0A]/90'
                    }`}>
                      <span className={`text-[9px] font-black font-mono ${isTop3 ? 'text-black' : 'text-[#525252]'}`}>
                        #{String(i + 1).padStart(2, '0')}
                      </span>
                    </div>

                    {/* Activity badge on hover */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-3 text-[9px] font-mono text-white/70">
                        <span>★ {item.review_count} RESEÑAS</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 px-0.5">
                    <p className="text-[12px] font-semibold text-white line-clamp-1 leading-tight group-hover:text-[#FFE600] transition-colors">
                      {item.title}
                    </p>
                    <p className="text-[10px] font-mono text-[#333] mt-0.5 uppercase">
                      {item.media_type === 'movie' ? 'FILM' : 'SERIE'}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
