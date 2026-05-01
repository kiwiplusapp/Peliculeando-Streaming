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
  showRank?: boolean;
}

export function Carousel({ title, items, href, showRank = false }: CarouselProps) {
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
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', checkScroll); ro.disconnect(); };
  }, [items, checkScroll]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 600, behavior: 'smooth' });
  };

  if (!items.length) return null;

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4 px-6 max-w-[1400px] mx-auto">
        <div className="flex items-center gap-3">
          {showRank && (
            <>
              <span className="text-[10px] font-black font-mono text-[#FFE600] tracking-widest leading-none">01</span>
              <span className="block w-6 h-px bg-[#FFE600]/60" />
            </>
          )}
          <h2 className="text-[11px] font-black tracking-[0.12em] text-white uppercase"
            style={{ fontFamily: 'Space Grotesk' }}>
            {title}
          </h2>
        </div>
        {href && (
          <Link href={href}
            className="text-[10px] font-semibold tracking-widest text-[#333] hover:text-[#FFE600] transition-colors"
            style={{ fontFamily: 'Space Grotesk' }}>
            VER TODO →
          </Link>
        )}
      </div>

      <div className="relative group/carousel">
        {canLeft && (
          <button onClick={() => scroll(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-[#0A0A0A] border border-[#1f1f1f] hover:border-[#FFE600]/40 text-[#737373] hover:text-[#FFE600] transition-all opacity-0 group-hover/carousel:opacity-100">
            <ChevronLeft size={16} />
          </button>
        )}
        {canRight && (
          <button onClick={() => scroll(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-[#0A0A0A] border border-[#1f1f1f] hover:border-[#FFE600]/40 text-[#737373] hover:text-[#FFE600] transition-all opacity-0 group-hover/carousel:opacity-100">
            <ChevronRight size={16} />
          </button>
        )}

        <div ref={scrollRef}
          className="flex gap-2.5 overflow-x-auto scrollbar-none px-6 pb-1 max-w-[1400px] mx-auto">
          {items.map((item, i) => (
            <MediaCard
              key={`${item.tmdb_id}-${item.media_type}`}
              item={item}
              rank={showRank ? i + 1 : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
