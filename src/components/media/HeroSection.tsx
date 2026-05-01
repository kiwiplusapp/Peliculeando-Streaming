'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Plus, Star } from 'lucide-react';
import { imgUrl, MediaItem } from '@/lib/tmdb';

const SLIDE_DURATION = 8000;

export function HeroSection({ items }: { items: MediaItem[] }) {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const go = useCallback((idx: number) => {
    if (fading) return;
    setFading(true);
    setProgress(0);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
    }, 300);
  }, [fading]);

  // Progress bar + auto-advance
  useEffect(() => {
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        go((current + 1) % items.length);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [current, items.length, go]);

  const item = items[current];
  if (!item) return null;

  const backdrop = imgUrl(item.backdrop_path, 'w1280');
  const poster   = imgUrl(item.poster_path, 'w342');
  const year     = item.release_date?.slice(0, 4);
  const score    = item.vote_average ?? 0;
  const genres   = item.genres?.slice(0, 2).map(g => g.name).join(' / ') || (item.media_type === 'tv' ? 'SERIE' : 'PELÍCULA');
  const runtime  = item.runtime ? `${item.runtime}M` : item.number_of_seasons ? `${item.number_of_seasons} TEMP.` : '';
  const watchURL = `/watch/${item.media_type}/${item.tmdb_id}${item.number_of_seasons ? `?seasons=${item.number_of_seasons}` : ''}`;
  const detailURL = `/${item.media_type}/${item.tmdb_id}`;

  // Score breakdown — out of 100 for editorial display
  const criticPct  = Math.min(100, Math.round(score * 10 * 1.05));
  const userPct    = Math.min(100, Math.round(score * 10));
  const karmaPct   = Math.min(100, Math.round(score * 10 * 0.98));

  return (
    <section className="relative w-full border-b border-[#1f1f1f]" style={{ background: '#0A0A0A' }}>

      <div className="relative max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] min-h-[420px]">

          {/* Left — 16:9 Backdrop / Still */}
          <div className={`relative overflow-hidden border-r border-[#1f1f1f] transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>
            {/* Image fills the left column */}
            <div className="relative w-full h-full min-h-[280px] md:min-h-[420px]">
              {backdrop ? (
                <Image
                  src={backdrop} alt={item.title} fill sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover object-center"
                  priority
                />
              ) : poster ? (
                <Image
                  src={poster} alt={item.title} fill sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover object-top"
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#1f1f1f] bg-[#141414]">
                  <span className="font-mono text-[10px] tracking-widest">POSTER · 16:9</span>
                  <span className="font-mono text-[10px] tracking-widest mt-1">still / key art</span>
                </div>
              )}

              {/* Dark overlay for contrast */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#0A0A0A]/20 to-[#0A0A0A]/70 md:to-[#0A0A0A]/60" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent md:hidden" />

              {/* EN TENDENCIA badge — inside image, top-left */}
              <div className="absolute top-4 left-4 md:top-5 md:left-5">
                <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#FFE600] text-black text-[9px] font-black tracking-widest font-mono uppercase">
                  EN TENDENCIA · #{String(current + 1).padStart(2, '0')} ESTA SEMANA
                </span>
              </div>

              {/* Slide dots — inside image, bottom-left */}
              <div className="absolute bottom-4 left-4 md:bottom-5 md:left-5 flex items-center gap-2">
                {items.map((_, i) => (
                  <button key={i} onClick={() => go(i)}
                    className={`transition-all duration-200 ${
                      i === current
                        ? 'w-8 h-px bg-[#FFE600]'
                        : 'w-3 h-px bg-white/30 hover:bg-white/60'
                    }`}
                  />
                ))}
                {/* Progress bar */}
                <div className="ml-1 w-12 h-px bg-white/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-[#FFE600]/50 transition-none"
                    style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Right — Data */}
          <div className={`flex flex-col justify-center py-8 px-6 md:px-8 transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-4">
              <span className="text-[10px] font-mono text-[#525252] tracking-widest">
                {[year, genres.toUpperCase(), runtime].filter(Boolean).join(' · ')}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-white leading-[0.92] tracking-tight mb-5"
              style={{ fontFamily: 'Space Grotesk' }}>
              {item.title}<span className="text-[#FFE600]">.</span>
            </h1>

            {/* Score + bars */}
            <div className="flex items-start gap-6 mb-5">
              <div className="shrink-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-[#FFE600] font-mono leading-none">
                    {score.toFixed(1)}
                  </span>
                  <span className="text-sm text-[#333] font-mono">/10</span>
                </div>
                <p className="text-[9px] font-mono text-[#333] tracking-widest mt-1">KARMA-HÍBRIDO</p>
              </div>

              <div className="flex-1 space-y-2 pt-1">
                {[
                  { label: 'CRÍTICA',          value: criticPct  },
                  { label: 'USUARIOS',         value: userPct    },
                  { label: 'KARMA-WEIGHTED',   value: karmaPct   },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-[#333] tracking-widest w-24 shrink-0">{row.label}</span>
                    <div className="flex-1 h-px bg-[#1f1f1f] relative">
                      <div
                        className="absolute top-0 left-0 h-full bg-[#FFE600]"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#525252] w-6 text-right shrink-0">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overview */}
            {item.overview && (
              <p className="text-sm text-[#737373] leading-relaxed line-clamp-3 mb-5">
                {item.overview}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <Link href={watchURL}
                className="flex items-center gap-2 px-4 py-2 text-[11px] font-black tracking-widest text-black transition-opacity hover:opacity-90"
                style={{ background: '#FFE600', fontFamily: 'Space Grotesk' }}>
                <Play size={12} fill="#000" />
                VER AHORA
              </Link>
              <Link href={detailURL}
                className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-widest text-[#A3A3A3] border border-[#2a2a2a] hover:border-[#FFE600]/30 hover:text-white transition-colors"
                style={{ fontFamily: 'Space Grotesk' }}>
                <Plus size={12} />
                MI LISTA
              </Link>
              <Link href={detailURL}
                className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-widest text-[#A3A3A3] border border-[#2a2a2a] hover:border-[#525252] hover:text-white transition-colors"
                style={{ fontFamily: 'Space Grotesk' }}>
                <Star size={12} />
                RESEÑAR
              </Link>
            </div>

            {/* Vote count sub-label */}
            {item.vote_count > 0 && (
              <p className="text-[10px] font-mono text-[#333] tracking-wider">
                {(item.vote_count).toLocaleString()} valoraciones · TMDB
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
