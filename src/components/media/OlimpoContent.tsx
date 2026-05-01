'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Reviewer {
  user_id: number;
  username: string;
  avatar_color: string;
  review_count: number;
  avg_rating: string;
  helpful_votes: number;
  karma: number;
  xp_total: number;
  watchlist_count: number;
  trend: 'up' | 'down' | 'same';
}

const PERIODS = ['TOTAL', 'MES', 'AÑO'];

function Avatar({ username, color, size = 'md' }: { username: string; color?: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = username.slice(0, 2).toUpperCase();
  const sizeClass = size === 'lg' ? 'w-14 h-14 text-base' : size === 'md' ? 'w-10 h-10 text-sm' : 'w-7 h-7 text-xs';
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-black text-black shrink-0`}
      style={{ background: color || '#FFE600' }}>
      {initials}
    </div>
  );
}

export function OlimpoContent() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('TOTAL');

  useEffect(() => {
    fetch('/api/leaderboard?full=1')
      .then(r => r.ok ? r.json() : { reviewers: [] })
      .then(d => setReviewers(d.reviewers || []))
      .finally(() => setLoading(false));
  }, []);

  const top3 = reviewers.slice(0, 3);
  const rest  = reviewers.slice(3);
  // Podium order: 2nd, 1st, 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-[1400px] mx-auto px-6">

        {/* Header */}
        <div className="mb-8 pt-4">
          <p className="text-[9px] font-mono text-[#333] tracking-[0.25em] mb-2">RANKING · EL</p>
          <h1 className="text-5xl sm:text-6xl font-black text-white leading-[0.9] tracking-tight mb-3"
            style={{ fontFamily: 'Space Grotesk' }}>
            El Olimpo<span className="text-[#FFE600]">.</span>
          </h1>
          <p className="text-sm text-[#525252] max-w-xl leading-relaxed mb-4">
            Los reseñadores más influyentes de Peliculeando. Karma calculado en tiempo real con
            ponderación bayesiana sobre votos, longitud, originalidad y consistencia.
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-[#333] tracking-widest border-t border-[#1f1f1f] pt-4">
            <span>{(reviewers.length * 12 || 0).toLocaleString()} RESEÑADORES ACTIVOS</span>
            <span className="text-[#1f1f1f]">·</span>
            <span>{reviewers.length > 0
              ? (reviewers.reduce((a, r) => a + r.review_count, 0) / reviewers.length).toFixed(1)
              : '0'} RESEÑAS/USUARIO</span>
            <span className="text-[#1f1f1f]">·</span>
            <span>{reviewers.length > 0
              ? (reviewers.reduce((a, r) => a + r.karma, 0) / 1000).toFixed(0)
              : '0'}K KARMA TOTAL</span>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFE600] animate-pulse" />
              <span className="text-[#FFE600]">ACTUALIZADO EN VIVO</span>
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-0 mb-8 border-b border-[#1f1f1f] overflow-x-auto scrollbar-none">
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2.5 text-[10px] font-black tracking-widest transition-colors shrink-0 border-b-2 -mb-px ${
                period === p
                  ? 'text-[#FFE600] border-[#FFE600]'
                  : 'text-[#333] border-transparent hover:text-[#525252]'
              }`}
              style={{ fontFamily: 'Space Grotesk' }}>
              {p}
            </button>
          ))}
          {['CINÉFILO', 'CRÍTICO', 'DRAMA', 'COMEDIA', 'TERROR', 'ACCIÓN', 'ANIMACIÓN'].map(g => (
            <button key={g}
              className="px-4 py-2.5 text-[10px] font-semibold tracking-widest text-[#333] hover:text-[#525252] border-b-2 border-transparent shrink-0 transition-colors"
              style={{ fontFamily: 'Space Grotesk' }}>
              {g}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-[#141414] border border-[#1f1f1f] animate-pulse" />
            ))}
          </div>
        ) : reviewers.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-[11px] font-mono text-[#333] tracking-widest">SIN DATOS</p>
            <p className="text-xs text-[#1f1f1f] mt-2 font-mono">Sé el primero en escribir una reseña</p>
          </div>
        ) : (
          <>
            {/* Podium — top 3 */}
            {top3.length >= 2 && (
              <div className="flex items-end justify-center gap-3 mb-10">
                {podiumOrder.map((reviewer, idx) => {
                  const rank = reviewers.indexOf(reviewer) + 1;
                  const isFirst = rank === 1;
                  return (
                    <Link
                      key={reviewer.user_id}
                      href={`/perfil/${reviewer.user_id}`}
                      className={`flex flex-col items-center transition-opacity hover:opacity-90 ${
                        isFirst ? 'order-2' : idx === 0 ? 'order-1' : 'order-3'
                      }`}
                    >
                      <div className={`flex flex-col items-center justify-between p-5 border transition-all ${
                        isFirst
                          ? 'bg-[#FFE600] border-[#FFE600] min-w-[160px] min-h-[140px]'
                          : 'bg-[#141414] border-[#1f1f1f] hover:border-[#FFE600]/20 min-w-[130px] min-h-[110px]'
                      }`}>
                        {/* Rank number */}
                        <p className={`text-[10px] font-black font-mono tracking-widest ${isFirst ? 'text-black/50' : 'text-[#333]'}`}>
                          {String(rank).padStart(2, '0')}
                        </p>

                        {/* Avatar */}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm my-2 ${
                            isFirst ? 'bg-black text-[#FFE600]' : 'text-black'
                          }`}
                          style={{ background: isFirst ? '#000' : (reviewer.avatar_color || '#FFE600') }}>
                          {reviewer.username.slice(0, 2).toUpperCase()}
                        </div>

                        {/* Name */}
                        <div className="text-center">
                          <p className={`text-[11px] font-bold leading-tight ${isFirst ? 'text-black' : 'text-white'}`}>
                            {reviewer.username}
                          </p>
                          <p className={`text-lg font-black font-mono mt-1 ${isFirst ? 'text-black' : 'text-white'}`}>
                            {reviewer.karma.toLocaleString()}
                          </p>
                          <p className={`text-[8px] font-mono tracking-widest ${isFirst ? 'text-black/50' : 'text-[#333]'}`}>
                            KARMA TOTAL
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Leaderboard table */}
            <div className="border border-[#1f1f1f]">
              {/* Table header */}
              <div className="grid grid-cols-[48px_1fr_120px_80px_80px_80px_80px] gap-0 border-b border-[#1f1f1f] px-4 py-2">
                {['RANK', 'USUARIO', 'KARMA', 'RESEÑAS', 'ÚTILES', 'PROM.', 'NIVEL'].map((h, i) => (
                  <span key={h} className={`text-[9px] font-black font-mono tracking-widest text-[#333] ${i > 1 ? 'text-right' : ''}`}>
                    {h}
                  </span>
                ))}
              </div>

              {/* All rows (top 3 + rest) */}
              {reviewers.map((reviewer, idx) => {
                const rank = idx + 1;
                const isTopThree = rank <= 3;
                return (
                  <Link
                    key={reviewer.user_id}
                    href={`/perfil/${reviewer.user_id}`}
                    className={`grid grid-cols-[48px_1fr_120px_80px_80px_80px_80px] gap-0 px-4 py-3 border-b border-[#1f1f1f] last:border-b-0 hover:bg-white/[0.02] transition-colors group`}
                  >
                    {/* Rank */}
                    <div className="flex items-center gap-1">
                      {reviewer.trend === 'up' ? (
                        <span className="text-[8px] text-green-500">↑</span>
                      ) : reviewer.trend === 'down' ? (
                        <span className="text-[8px] text-red-500">↓</span>
                      ) : (
                        <span className="text-[8px] text-[#1f1f1f]">·</span>
                      )}
                      <span className={`text-[10px] font-black font-mono ${isTopThree ? 'text-[#FFE600]' : 'text-[#333]'}`}>
                        #{String(rank).padStart(3, '0')}
                      </span>
                    </div>

                    {/* User */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-black shrink-0"
                        style={{ background: reviewer.avatar_color || '#FFE600' }}>
                        {reviewer.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-white truncate group-hover:text-[#FFE600] transition-colors">
                          {reviewer.username}
                        </p>
                      </div>
                    </div>

                    {/* Karma */}
                    <p className={`text-right text-[11px] font-black font-mono self-center ${isTopThree ? 'text-[#FFE600]' : 'text-white'}`}>
                      {reviewer.karma.toLocaleString()}
                    </p>

                    {/* Reviews */}
                    <p className="text-right text-[10px] font-mono text-[#525252] self-center">
                      {reviewer.review_count.toLocaleString()}
                    </p>

                    {/* Helpful votes */}
                    <p className="text-right text-[10px] font-mono text-[#525252] self-center">
                      {reviewer.helpful_votes.toLocaleString()}
                    </p>

                    {/* Avg rating */}
                    <p className="text-right text-[10px] font-mono text-[#525252] self-center">
                      {reviewer.avg_rating || '—'}
                    </p>

                    {/* XP level */}
                    <p className="text-right text-[9px] font-mono text-[#333] self-center tracking-wider">
                      {reviewer.xp_total > 8000 ? 'LEYENDA'
                        : reviewer.xp_total > 4000 ? 'EXPERTO'
                        : reviewer.xp_total > 2000 ? 'AVANZADO'
                        : reviewer.xp_total > 500  ? 'REGULAR'
                        : 'ESPECTADOR'}
                    </p>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
