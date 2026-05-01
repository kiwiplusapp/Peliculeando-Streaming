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
  const genres   = item.genres?.slice(0, 2).map(g => g.name).join(' · ') || (item.media_type === 'tv' ? 'SERIE' : 'PELÍCULA');
  const watchURL = `/watch/${item.media_type}/${item.tmdb_id}${item.number_of_seasons ? `?seasons=${item.number_of_seasons}` : ''}`;
  const detailURL = `/${item.media_type}/${item.tmdb_id}`;

  // Simulated score breakdown for editorial look
  const criticScore  = Math.min(10, score * 1.05).toFixed(1);
  const userScore    = score.toFixed(1);
  const karmaScore   = Math.min(10, score * 0.98).toFixed(1);

  return (
    <section className="relative w-full border-b border-[#1f1f1f]" style={{ background: '#0A0A0A' }}>
      {/* Subtle backdrop tint */}
      {backdrop && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Image src={backdrop} alt="" fill sizes="100vw" className="object-cover opacity-[0.04]" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/90 to-[#0A0A0A]/70" />
        </div>
      )}

      <div className="relative max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-[380px_1fr] gap-0 min-h-[480px]">

          {/* Left — Poster */}
          <div className="hidden md:flex items-center py-10 pr-8 border-r border-[#1f1f1f]">
            <div className={`relative w-full aspect-[2/3] bg-[#141414] border border-[#1f1f1f] transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>
              {poster ? (
                <Image src={poster} alt={item.title} fill sizes="340px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#1f1f1f]">
                  <span className="font-mono text-[10px] tracking-widest">POSTER</span>
                  <span className="font-mono text-[10px] tracking-widest mt-1">2:3 · 1000×1500</span>
                </div>
              )}
              {/* Rank badge */}
              <div className="absolute top-0 left-0">
                <span className="rank-badge text-[11px] px-2 py-1">
                  #{String(current + 1).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Right — Data */}
          <div className={`flex flex-col justify-center py-10 pl-0 md:pl-10 transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-[10px] font-semibold font-mono text-[#525252] tracking-widest">
                {year} · {genres.toUpperCase()}
              </span>
              {item.media_type === 'tv' && item.number_of_seasons && (
                <span className="text-[10px] font-mono text-[#525252]">
                  {item.number_of_seasons} TEMP.
                </span>
              )}
              <span className="px-2 py-0.5 text-[10px] font-black tracking-widest border text-[#FFE600] border-[#FFE600]/30 bg-[#FFE600]/8 font-mono">
                EN TENDENCIA
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-[0.95] tracking-tight mb-5"
              style={{ fontFamily: 'Space Grotesk' }}>
              {item.title}<span className="text-[#FFE600]">.</span>
            </h1>

            {/* Score + bars */}
            <div className="flex items-start gap-8 mb-5">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-[#FFE600] font-mono leading-none">
                    {userScore}
                  </span>
                  <span className="text-sm text-[#333] font-mono">/10</span>
                </div>
                <p className="text-[9px] font-mono text-[#333] tracking-widest mt-1">KARMA-HÍBRIDO</p>
              </div>

              <div className="flex-1 space-y-2 pt-1 max-w-[240px]">
                {[
                  { label: 'CRÍTICA',   value: Number(criticScore), max: 10 },
                  { label: 'USUARIOS',  value: Number(userScore),   max: 10 },
                  { label: 'KARMA-TOP', value: Number(karmaScore),  max: 10 },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-[9px] font-mono text-[#333] tracking-widest w-20 shrink-0">{row.label}</span>
                    <div className="flex-1 h-px bg-[#1f1f1f] relative">
                      <div
                        className="absolute top-0 left-0 h-full bg-[#FFE600]"
                        style={{ width: `${(row.value / row.max) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[#525252] w-5 text-right shrink-0">
                      {Math.round(row.value * 10)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overview */}
            {item.overview && (
              <p className="text-sm text-[#737373] leading-relaxed max-w-xl line-clamp-3 mb-6">
                {item.overview}
              </p>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <Link href={watchURL}
                className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-black tracking-widest text-black transition-opacity hover:opacity-90"
                style={{ background: '#FFE600', fontFamily: 'Space Grotesk' }}>
                <Play size={13} fill="#000" />
                VER AHORA
              </Link>
              <Link href={detailURL}
                className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-semibold tracking-widest text-[#A3A3A3] border border-[#2a2a2a] hover:border-[#FFE600]/30 hover:text-white transition-colors"
                style={{ fontFamily: 'Space Grotesk' }}>
                <Plus size={13} />
                MI LISTA
              </Link>
              <Link href={detailURL}
                className="flex items-center gap-2 px-5 py-2.5 text-[11px] font-semibold tracking-widest text-[#A3A3A3] border border-[#2a2a2a] hover:border-[#525252] hover:text-white transition-colors"
                style={{ fontFamily: 'Space Grotesk' }}>
                RESEÑAR
              </Link>
            </div>

            {/* Slide dots */}
            <div className="flex items-center gap-2">
              {items.map((_, i) => (
                <button key={i} onClick={() => go(i)}
                  className={`transition-all duration-200 ${
                    i === current
                      ? 'w-8 h-px bg-[#FFE600]'
                      : 'w-3 h-px bg-[#2a2a2a] hover:bg-[#525252]'
                  }`}
                />
              ))}
              {/* Progress bar */}
              <div className="ml-2 flex-1 max-w-[80px] h-px bg-[#1f1f1f] relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-[#FFE600]/40 transition-none"
                  style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
