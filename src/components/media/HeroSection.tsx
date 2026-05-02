'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Plus, Star, ChevronRight } from 'lucide-react';
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
    setTimeout(() => { setCurrent(idx); setFading(false); }, 350);
  }, [fading]);

  useEffect(() => {
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);
      if (pct < 100) { rafRef.current = requestAnimationFrame(tick); }
      else { go((current + 1) % items.length); }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [current, items.length, go]);

  const item = items[current];
  if (!item) return null;

  const backdrop = imgUrl(item.backdrop_path, 'original');
  const poster   = imgUrl(item.poster_path, 'w342');
  const year     = item.release_date?.slice(0, 4) || '';
  const score    = item.vote_average ?? 0;
  const genres   = item.genres?.slice(0, 2).map(g => g.name).join(' · ') || (item.media_type === 'tv' ? 'SERIE' : 'PELÍCULA');
  const runtime  = item.runtime ? `${item.runtime} MIN` : item.number_of_seasons ? `${item.number_of_seasons} TEMP.` : '';
  const detailURL = `/${item.media_type}/${item.tmdb_id}`;
  const watchURL  = `/watch/${item.media_type}/${item.tmdb_id}`;
  const scoreInt  = Math.round(score * 10);

  return (
    <section className="relative w-full overflow-hidden border-b border-[#1f1f1f]" style={{ height: 'clamp(380px, 60vh, 680px)' }}>

      {/* ── Full-bleed backdrop ── */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${fading ? 'opacity-0' : 'opacity-100'}`}>
        {(backdrop || poster) ? (
          <Image
            src={backdrop || poster!}
            alt={item.title}
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[#141414]" />
        )}
      </div>

      {/* ── Gradient overlays ── */}
      {/* Bottom: strong black fade for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent" />
      {/* Left: soft vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A]/70 via-transparent to-transparent" />
      {/* Right: very slight darkening */}
      <div className="absolute inset-0 bg-gradient-to-l from-[#0A0A0A]/30 to-transparent" />

      {/* ── Content ── */}
      <div className="absolute inset-0 flex flex-col justify-end">
        <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 pb-8 sm:pb-10">
          <div className="flex items-end justify-between gap-8">

            {/* Left — title + meta + actions */}
            <div className={`flex-1 min-w-0 transition-all duration-400 ${fading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>

              {/* TRENDING BADGE */}
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#FFE600] text-black text-[9px] font-black tracking-widest font-mono">
                  EN TENDENCIA · #{String(current + 1).padStart(2, '0')} ESTA SEMANA
                </span>
                <span className="text-[10px] font-mono text-[#525252] tracking-widest">
                  {[year, genres.toUpperCase(), runtime].filter(Boolean).join(' · ')}
                </span>
              </div>

              {/* TITLE */}
              <h1
                className="text-3xl sm:text-4xl xl:text-6xl font-black text-white leading-[0.9] tracking-tight mb-3 sm:mb-4 max-w-2xl"
                style={{ fontFamily: 'Space Grotesk', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
              >
                {item.title}<span className="text-[#FFE600]">.</span>
              </h1>

              {/* OVERVIEW */}
              {item.overview && (
                <p className="text-sm text-[#A3A3A3] leading-relaxed line-clamp-2 mb-5 max-w-xl">
                  {item.overview}
                </p>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center gap-2">
                <Link href={watchURL}
                  className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black tracking-widest text-black transition-opacity hover:opacity-90"
                  style={{ background: '#FFE600', fontFamily: 'Space Grotesk' }}>
                  <Play size={12} fill="#000" strokeWidth={0} />
                  VER AHORA
                </Link>
                <Link href={detailURL}
                  className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold tracking-widest text-[#A3A3A3] border border-white/10 hover:border-[#FFE600]/30 hover:text-white backdrop-blur-sm transition-colors"
                  style={{ background: 'rgba(0,0,0,0.4)', fontFamily: 'Space Grotesk' }}>
                  <Plus size={12} />
                  MI LISTA
                </Link>
                <Link href={detailURL}
                  className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-semibold tracking-widest text-[#A3A3A3] border border-white/10 hover:border-white/20 hover:text-white backdrop-blur-sm transition-colors"
                  style={{ background: 'rgba(0,0,0,0.4)', fontFamily: 'Space Grotesk' }}>
                  <Star size={12} />
                  RESEÑAR
                </Link>
                <Link href={detailURL}
                  className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-[#525252] hover:text-[#FFE600] transition-colors ml-2">
                  VER FICHA <ChevronRight size={12} />
                </Link>
              </div>
            </div>

            {/* Right — score card + slide nav */}
            <div className="hidden md:flex flex-col items-end gap-4 shrink-0">

              {/* SCORE CARD */}
              <div className={`transition-all duration-400 ${fading ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                <div className="border border-[#2a2a2a] p-4 min-w-[140px]" style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)' }}>
                  <p className="text-[8px] font-mono text-[#333] tracking-widest mb-1">KARMA-WEIGHTED</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-black text-[#FFE600] font-mono leading-none">{score.toFixed(1)}</span>
                    <span className="text-xs text-[#333] font-mono">/10</span>
                  </div>
                  {/* mini bars */}
                  <div className="space-y-1.5">
                    {[
                      { label: 'SCORE',   value: scoreInt },
                      { label: 'USUARIOS', value: Math.min(100, Math.round(score * 10)) },
                    ].map(row => (
                      <div key={row.label} className="flex items-center gap-2">
                        <span className="text-[7px] font-mono text-[#333] tracking-widest w-14 shrink-0">{row.label}</span>
                        <div className="flex-1 h-px bg-[#1f1f1f] relative">
                          <div className="absolute top-0 left-0 h-full bg-[#FFE600]" style={{ width: `${row.value}%` }} />
                        </div>
                        <span className="text-[8px] font-mono text-[#525252]">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  {item.vote_count > 0 && (
                    <p className="text-[7px] font-mono text-[#333] mt-2 tracking-wide">
                      {item.vote_count.toLocaleString()} VALORACIONES
                    </p>
                  )}
                </div>
              </div>

              {/* SLIDE INDICATORS */}
              <div className="flex items-center gap-2">
                {items.map((_, i) => (
                  <button key={i} onClick={() => go(i)}
                    className={`transition-all duration-200 ${
                      i === current ? 'w-8 h-0.5 bg-[#FFE600]' : 'w-3 h-0.5 bg-white/20 hover:bg-white/50'
                    }`}
                  />
                ))}
                {/* progress bar */}
                <div className="ml-1 w-10 h-0.5 bg-white/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-[#FFE600]/50" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Mobile slide indicators */}
          <div className="flex items-center gap-2 mt-4 md:hidden">
            {items.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                className={`transition-all duration-200 ${
                  i === current ? 'w-8 h-0.5 bg-[#FFE600]' : 'w-3 h-0.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
