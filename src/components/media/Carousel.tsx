'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaCard } from './MediaCard';
import { MediaItem } from '@/lib/tmdb';

interface CarouselProps {
  title: string;
  items: MediaItem[];
  href?: string;
  accent?: string;
}

export function Carousel({ title, items, href, accent }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items, checkScroll]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 620, behavior: 'smooth' });
  };

  if (!items.length) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4 px-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          {accent && <div className="w-[3px] h-5 rounded-full" style={{ background: accent }} />}
          <h2 className="font-bold text-lg text-white tracking-tight">{title}</h2>
        </div>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-1 text-sm text-[#A3A3A3] hover:text-amber-400 transition-colors"
          >
            Ver todos <ChevronRight size={14} />
          </Link>
        )}
      </div>

      <div className="relative group/carousel">
        {/* Left arrow */}
        {canLeft && (
          <button
            onClick={() => scroll(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-black/80 hover:bg-amber-500 border border-white/10 hover:border-amber-500 rounded-full text-white transition-all shadow-lg opacity-0 group-hover/carousel:opacity-100"
            aria-label="Anterior"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        {/* Right arrow */}
        {canRight && (
          <button
            onClick={() => scroll(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center bg-black/80 hover:bg-amber-500 border border-white/10 hover:border-amber-500 rounded-full text-white transition-all shadow-lg opacity-0 group-hover/carousel:opacity-100"
            aria-label="Siguiente"
          >
            <ChevronRight size={18} />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto scrollbar-none px-6 pb-1 max-w-[1400px] mx-auto"
        >
          {items.map(item => (
            <MediaCard key={`${item.tmdb_id}-${item.media_type}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
