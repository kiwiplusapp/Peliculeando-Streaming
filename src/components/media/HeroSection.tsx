'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { imgUrl, MediaItem } from '@/lib/tmdb';

interface HeroSectionProps {
  items: MediaItem[];
}

export function HeroSection({ items }: HeroSectionProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const item = items[current];
  if (!item) return null;

  const go = (dir: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(i => (i + dir + items.length) % items.length);
      setIsTransitioning(false);
    }, 300);
  };

  useEffect(() => {
    const id = setInterval(() => go(1), 7000);
    return () => clearInterval(id);
  }, [current]);

  const backdrop = imgUrl(item.backdrop_path, 'original');
  const score = item.vote_average || 0;
  const year = item.release_date?.slice(0, 4);

  return (
    <div className="relative h-[80vh] min-h-[520px] max-h-[700px] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: isTransitioning ? 0 : 1 }}
      >
        {backdrop && (
          <Image
            src={backdrop}
            alt={item.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/20" />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col justify-end h-full max-w-[1400px] mx-auto px-6 pb-16 transition-all duration-500"
        style={{ opacity: isTransitioning ? 0 : 1, transform: isTransitioning ? 'translateY(8px)' : 'none' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
            En tendencia
          </span>
          <span className="text-xs text-[#A3A3A3] uppercase tracking-wider">
            {item.media_type === 'tv' ? 'Serie' : 'Película'}
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white max-w-xl leading-tight mb-3">
          {item.title}
        </h1>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Star size={14} className="text-amber-400" fill="#fbbf24" />
            <span className="text-white font-semibold">{score.toFixed(1)}</span>
            <span className="text-[#A3A3A3]">/10</span>
          </div>
          {year && <span className="text-[#A3A3A3] text-sm">{year}</span>}
        </div>

        <p className="text-[#A3A3A3] text-sm max-w-md line-clamp-3 mb-6">
          {item.overview}
        </p>

        <div className="flex items-center gap-3">
          <Link
            href={`/${item.media_type}/${item.tmdb_id}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-white/90 transition-colors"
          >
            <Play size={16} fill="black" />
            Reproducir
          </Link>
          <Link
            href={`/${item.media_type}/${item.tmdb_id}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white font-medium text-sm rounded-lg hover:bg-[#222222] transition-colors border border-[#333333]"
          >
            <Info size={16} />
            Más info
          </Link>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => go(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors border border-white/10"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => go(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors border border-white/10"
      >
        <ChevronRight size={20} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current ? 'w-8 bg-amber-500' : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
