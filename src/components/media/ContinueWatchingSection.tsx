'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { imgUrl } from '@/lib/tmdb';
import { useWatchProgress } from './WatchProgressContext';

export function ContinueWatchingSection() {
  const { progress } = useWatchProgress();

  const items = Array.from(progress.values())
    .filter(i => i.title)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 12);

  if (items.length === 0) return null;

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 px-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black font-mono text-[#FFE600] tracking-widest leading-none">▶</span>
          <span className="block w-5 h-px bg-[#FFE600]/60" />
          <h2 className="text-[11px] font-black tracking-[0.12em] text-white uppercase"
            style={{ fontFamily: 'Space Grotesk' }}>
            CONTINUAR VIENDO
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[#333] tracking-widest">{items.length} TÍTULOS</span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto scrollbar-none px-6 pb-1 max-w-[1400px] mx-auto">
        {items.map(item => {
          const poster = imgUrl(item.poster_path, 'w342');
          const isTV = item.media_type === 'tv';
          const href = `/watch/${item.media_type}/${item.tmdb_id}${item.season_number ? `?s=${item.season_number}&e=${item.episode_number}` : ''}`;

          return (
            <Link
              key={`${item.tmdb_id}-${item.media_type}`}
              href={href}
              className="group relative shrink-0 w-[148px] sm:w-[165px]"
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] bg-[#141414] border border-[#1f1f1f] overflow-hidden transition-all duration-200 group-hover:border-[#FFE600]/30">
                {poster ? (
                  <Image
                    src={poster} alt={item.title || ''} fill sizes="170px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#1f1f1f]">
                    <span className="font-mono text-[9px] tracking-widest">POSTER</span>
                  </div>
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-10 h-10 flex items-center justify-center bg-[#FFE600]">
                    <Play size={14} className="text-black" fill="black" strokeWidth={0} />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1f1f1f]">
                  <div className="h-full bg-[#FFE600] w-1/3" />
                </div>

                {/* TV label */}
                {isTV && item.season_number && (
                  <div className="absolute top-0 left-0 px-1.5 py-0.5 bg-[#0A0A0A]/90 border-r border-b border-[#1f1f1f]">
                    <span className="text-[9px] font-black font-mono text-[#FFE600]">
                      T{item.season_number}·E{item.episode_number}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="mt-2 px-0.5">
                <p className="text-[12px] font-semibold text-white line-clamp-1 leading-tight">{item.title}</p>
                <p className="text-[10px] font-mono text-[#333] mt-0.5 uppercase">
                  {isTV ? 'SERIE' : 'FILM'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
