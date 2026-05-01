'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { imgUrl, MediaItem } from '@/lib/tmdb';

const SLIDE_DURATION = 7000;

export function HeroSection({ items }: { items: MediaItem[] }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);

  const go = useCallback((dir: number) => {
    if (fading) return;
    setFading(true);
    setProgress(0);
    setTimeout(() => {
      setCurrent(i => (i + dir + items.length) % items.length);
      setFading(false);
    }, 400);
  }, [fading, items.length]);

  const goTo = useCallback((idx: number) => {
    if (fading || idx === current) return;
    setFading(true);
    setProgress(0);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
    }, 400);
  }, [fading, current]);

  // Progress bar + auto-advance
  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        go(1);
      }
    };
    let raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  const item = items[current];
  if (!item) return null;

  const backdrop = imgUrl(item.backdrop_path, 'original');
  const score = item.vote_average || 0;
  const year = item.release_date?.slice(0, 4);
  const scoreColor = score >= 7 ? '#10b981' : score >= 5 ? '#fbbf24' : '#ef4444';

  return (
    <div className="relative h-[82vh] min-h-[540px] max-h-[720px] overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {backdrop && (
          <Image
            src={backdrop}
            alt={item.title}
            fill priority sizes="100vw"
            className="object-cover"
          />
        )}
        {/* Grain overlay for cinematic look */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
        }} />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/10 to-transparent" />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col justify-end h-full max-w-[1400px] mx-auto px-6 pb-20 transition-all duration-500"
        style={{ opacity: fading ? 0 : 1, transform: fading ? 'translateY(10px)' : 'none' }}
      >
        {/* Type + trending badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            {item.media_type === 'tv' ? 'Serie' : 'Película'}
          </span>
          <span className="text-[#525252]">·</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A3A3]">
            En tendencia
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white max-w-2xl leading-[1.05] mb-4 tracking-tight">
          {item.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 mb-5">
          <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: scoreColor }}>
            <Star size={14} fill={scoreColor} />
            {score.toFixed(1)}
            <span className="text-[#525252] font-normal">/10</span>
          </div>
          {year && (
            <span className="text-sm text-[#A3A3A3] border border-[#333333] rounded px-2 py-0.5">{year}</span>
          )}
          {item.media_type === 'tv' && item.number_of_seasons && item.number_of_seasons > 0 && (
            <span className="text-sm text-[#A3A3A3]">{item.number_of_seasons} temporada{item.number_of_seasons !== 1 ? 's' : ''}</span>
          )}
        </div>

        {item.overview && (
          <p className="text-[#A3A3A3] text-sm leading-relaxed max-w-lg line-clamp-3 mb-7">
            {item.overview}
          </p>
        )}

        <div className="flex items-center gap-3">
          <Link
            href={`/${item.media_type}/${item.tmdb_id}`}
            className="flex items-center gap-2.5 px-6 py-3 bg-white text-black font-bold text-sm rounded-xl hover:bg-amber-400 transition-colors shadow-lg"
          >
            <Play size={16} fill="black" />
            Reproducir
          </Link>
          <Link
            href={`/${item.media_type}/${item.tmdb_id}`}
            className="flex items-center gap-2 px-5 py-3 bg-white/10 text-white font-medium text-sm rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/10"
          >
            <Info size={16} />
            Más info
          </Link>
        </div>
      </div>

      {/* Arrow nav */}
      <button
        onClick={() => go(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/70 rounded-full text-white transition-all border border-white/10 backdrop-blur-sm"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => go(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-black/40 hover:bg-black/70 rounded-full text-white transition-all border border-white/10 backdrop-blur-sm"
      >
        <ChevronRight size={20} />
      </button>

      {/* Slide indicators with progress */}
      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="relative h-1 rounded-full overflow-hidden transition-all duration-300"
            style={{ width: i === current ? '40px' : '8px', background: 'rgba(255,255,255,0.2)' }}
          >
            {i === current && (
              <div
                className="absolute inset-0 bg-amber-500 rounded-full origin-left"
                style={{ transform: `scaleX(${progress / 100})`, transition: 'transform 0.1s linear' }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
