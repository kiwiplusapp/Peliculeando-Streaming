'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Tv, Film } from 'lucide-react';
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
      <div className="flex items-center gap-3 mb-4 px-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500">
          <Play size={13} className="text-black" fill="black" />
        </div>
        <h2 className="font-bold text-lg text-white tracking-tight">Continuar viendo</h2>
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none px-6 pb-1 max-w-[1400px] mx-auto">
        {items.map(item => {
          const poster = imgUrl(item.poster_path, 'w342');
          const isTV = item.media_type === 'tv';

          return (
            <Link
              key={`${item.tmdb_id}-${item.media_type}`}
              href={`/watch/${item.media_type}/${item.tmdb_id}${item.season_number ? `?s=${item.season_number}&e=${item.episode_number}` : ''}`}
              className="group shrink-0 w-[155px] sm:w-[175px]"
            >
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#181818] border border-[#262626] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-amber-500/40">
                {poster ? (
                  <Image
                    src={poster} alt={item.title || ''} fill sizes="180px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#525252]">
                    {isTV ? <Tv size={32} /> : <Film size={32} />}
                  </div>
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/15 border border-white/30 flex items-center justify-center backdrop-blur-sm">
                    <Play size={20} className="text-white" fill="white" />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#333333]">
                  <div className="h-full bg-amber-500 w-1/3 rounded-r-full" />
                </div>
              </div>

              <p className="mt-2 text-sm font-medium text-white line-clamp-1">{item.title}</p>
              {isTV ? (
                <p className="text-xs text-amber-400 font-medium mt-0.5">
                  T{item.season_number} · E{item.episode_number}
                </p>
              ) : (
                <p className="text-xs text-[#525252] mt-0.5">Película</p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
