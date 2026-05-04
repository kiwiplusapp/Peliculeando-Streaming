'use client';

import Link from 'next/link';
import { useState } from 'react';

interface RecentReview {
  id: number;
  tmdb_id: number;
  media_type: string;
  movie_title: string;
  movie_poster: string | null;
  rating: number;
  content: string | null;
  helpful_votes?: number;
  created_at: string;
}

interface Props {
  user: {
    id: number; username: string; email: string;
    avatar_color: string; bio: string | null; created_at: string;
    xp_total?: number; level?: number;
  };
  stats: { reviews: number; watchlist: number; collections: number; watched: number };
  genreStats: { genre_name: string; watch_count: number; total_rating: number }[];
  karma?: number;
  helpfulVotes?: number;
  xp?: number;
  recentXP?: { action: string; xp_gained: number; created_at: string }[];
  recentReviews?: RecentReview[];
  karmaBreakdown?: { reviews_karma: number; lists_karma: number; consistency_karma: number; engagement_karma: number };
  rank?: number;
  streak?: number;
  followers?: number;
}

const LEVEL_NAMES: Record<string, string> = {
  LEYENDA: 'LEYENDA', EXPERTO: 'EXPERTO', AVANZADO: 'AVANZADO', REGULAR: 'REGULAR', ESPECTADOR: 'ESPECTADOR',
};

function getLevel(xp: number) {
  if (xp > 8000) return 'LEYENDA';
  if (xp > 4000) return 'EXPERTO';
  if (xp > 2000) return 'AVANZADO';
  if (xp > 500) return 'REGULAR';
  return 'ESPECTADOR';
}

function KarmaBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#1a1a1a] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-mono text-[#525252] tracking-widest">{label}</span>
          <span className="text-[11px] font-black font-mono text-[#FFE600]">{value.toLocaleString()}</span>
        </div>
        <div className="h-px bg-[#1a1a1a] relative">
          <div className="absolute top-0 left-0 h-full bg-[#FFE600] transition-all duration-700"
            style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export function ProfileContent({
  user, stats, genreStats,
  karma = 0, helpfulVotes = 0,
  xp = 0, recentXP = [],
  recentReviews = [],
  karmaBreakdown,
  rank,
  streak = 0,
  followers = 0,
}: Props) {
  const [activeSection, setActiveSection] = useState<'karma' | 'reseñas' | 'logros'>('karma');

  const initials = user.username.slice(0, 2).toUpperCase();
  const joined = new Date(user.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase();
  const level = getLevel(xp);

  const maxKarma = karmaBreakdown
    ? Math.max(karmaBreakdown.reviews_karma, karmaBreakdown.lists_karma, karmaBreakdown.consistency_karma, karmaBreakdown.engagement_karma)
    : karma;

  // Build weekly karma bars (12 bars, decreasing left to right for visual)
  const weeklyBars = Array.from({ length: 12 }, (_, i) => {
    const base = karma / 12;
    const variance = (Math.sin(i * 1.7 + user.id) + 1) * base * 0.6;
    return Math.round(base * 0.4 + variance);
  });
  const maxBar = Math.max(...weeklyBars, 1);

  const ACHIEVEMENTS = [
    { icon: '◆', label: 'CRÍTICA DE ÉLITE',  desc: 'Top 1% global',         karma: 500,  unlocked: karma > 5000 },
    { icon: '▲', label: 'MARATONIISTA',       desc: '50 reseñas de una vez', karma: 250,  unlocked: stats.reviews >= 50 },
    { icon: '★', label: 'RESEÑA VIRAL',       desc: '100+ votos útiles',     karma: 300,  unlocked: helpfulVotes >= 100 },
    { icon: '◉', label: 'CINÉFILO TOTAL',     desc: '500+ películas',        karma: 400,  unlocked: stats.watched >= 500 },
    { icon: '■', label: 'CICLO COMPLETO',     desc: 'Ver toda una saga',     karma: 200,  unlocked: false },
    { icon: '◇', label: 'PRÓXIMO LOGRO',      desc: 'Continúa reseñando',    karma: 0,    unlocked: false },
  ];

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="border border-[#1f1f1f] p-6 mb-1" style={{ background: '#0A0A0A' }}>
          <div className="flex items-start gap-5">

            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center font-black text-xl text-black shrink-0"
              style={{ background: user.avatar_color || '#FFE600' }}>
              {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Badge pills */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                {rank && rank <= 20 && (
                  <span className="px-2 py-0.5 text-[8px] font-black font-mono tracking-widest bg-[#FFE600] text-black">
                    TOP {rank}
                  </span>
                )}
                <span className="px-2 py-0.5 text-[8px] font-mono tracking-widest border border-[#2a2a2a] text-[#525252]">
                  {level}
                </span>
                <span className="px-2 py-0.5 text-[8px] font-mono tracking-widest border border-[#2a2a2a] text-[#525252]">
                  DESDE {joined}
                </span>
              </div>

              <h1 className="text-2xl font-black text-white leading-tight tracking-tight"
                style={{ fontFamily: 'Space Grotesk' }}>
                {user.username}
              </h1>
              <p className="text-[10px] font-mono text-[#525252] tracking-widest mt-1">
                @{user.username.toLowerCase()} · CINE
              </p>
              {user.bio && (
                <p className="text-sm text-[#737373] leading-relaxed mt-2 max-w-lg">{user.bio}</p>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <button className="px-3 py-1.5 text-[10px] font-black tracking-widest text-black bg-[#FFE600] hover:opacity-90 transition-opacity"
                  style={{ fontFamily: 'Space Grotesk' }}>
                  + SEGUIR
                </button>
                <button className="px-3 py-1.5 text-[10px] font-semibold tracking-widest text-[#A3A3A3] border border-[#2a2a2a] hover:border-[#FFE600]/30 hover:text-white transition-colors">
                  ↑ DAR KARMA
                </button>
                <Link href="/mis-resenas"
                  className="px-3 py-1.5 text-[10px] font-semibold tracking-widest text-[#A3A3A3] border border-[#2a2a2a] hover:border-[#525252] hover:text-white transition-colors">
                  ≡ RESEÑAS
                </Link>
                <Link href="/ajustes"
                  className="px-3 py-1.5 text-[10px] font-semibold tracking-widest text-[#A3A3A3] border border-[#2a2a2a] hover:border-[#525252] hover:text-white transition-colors">
                  ⚙ AJUSTES
                </Link>
              </div>
            </div>

            {/* Karma total */}
            <div className="shrink-0 text-right">
              <p className="text-4xl font-black text-[#FFE600] font-mono leading-none">
                {karma.toLocaleString()}
              </p>
              <p className="text-[8px] font-mono text-[#333] tracking-widest mt-1">KARMA TOTAL</p>
              {recentXP.length > 0 && (
                <p className="text-[9px] font-mono text-green-500 mt-0.5 tracking-wider">
                  +{recentXP.reduce((a, e) => a + e.xp_gained, 0)} XP RECIENTE
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS BAR ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 sm:grid-cols-6 border-x border-b border-[#1f1f1f] mb-6">
          {[
            { value: stats.reviews, label: 'RESEÑAS', sub: `${stats.reviews} escritas`, href: '/mis-resenas' },
            { value: stats.watched, label: 'FILMS VISTOS', sub: `${stats.watchlist} en lista`, href: '/mi-lista' },
            { value: stats.collections, label: 'LISTAS', sub: `${stats.collections} públicas`, href: '/colecciones' },
            { value: followers || 0, label: 'SEGUIDORES', sub: 'comunidad', href: '/comunidad' },
            { value: streak, label: 'RACHA', sub: 'días seguidos' },
            { value: rank ? `#${rank}` : '—', label: 'RANKING', sub: 'global', href: '/comunidad' },
          ].map((s, i) => (
            s.href ? (
              <Link key={i} href={s.href}
                className="flex flex-col items-center justify-center py-4 px-3 border-r border-[#1f1f1f] last:border-r-0 hover:bg-white/[0.02] transition-colors group text-center">
                <p className="text-2xl font-black font-mono text-white group-hover:text-[#FFE600] transition-colors leading-none">{s.value}</p>
                <p className="text-[8px] font-black font-mono tracking-widest text-[#333] mt-1">{s.label}</p>
                <p className="text-[8px] font-mono text-[#1f1f1f] mt-0.5 tracking-wide">{s.sub}</p>
              </Link>
            ) : (
              <div key={i}
                className="flex flex-col items-center justify-center py-4 px-3 border-r border-[#1f1f1f] last:border-r-0 text-center">
                <p className="text-2xl font-black font-mono text-white leading-none">{s.value}</p>
                <p className="text-[8px] font-black font-mono tracking-widest text-[#333] mt-1">{s.label}</p>
                <p className="text-[8px] font-mono text-[#1f1f1f] mt-0.5 tracking-wide">{s.sub}</p>
              </div>
            )
          ))}
        </div>

        {/* ── SECTION 01: DESGLOSE DE KARMA ─────────────────── */}
        <div className="border border-[#1f1f1f] mb-1">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black font-mono text-[#FFE600] tracking-widest">01</span>
              <span className="block w-5 h-px bg-[#FFE600]/50" />
              <h2 className="text-[10px] font-black tracking-widest text-white" style={{ fontFamily: 'Space Grotesk' }}>
                DESGLOSE DE KARMA
              </h2>
            </div>
            <span className="text-[8px] font-mono text-[#333] tracking-widest">ÚLTIMO: 12 SEMANAS</span>
          </div>

          <div className="grid md:grid-cols-[1fr_220px] gap-0 divide-y md:divide-y-0 md:divide-x divide-[#1f1f1f]">
            {/* Bar chart */}
            <div className="p-5">
              <p className="text-[8px] font-mono text-[#333] tracking-widest mb-4">PROMEDIO SEMANAL</p>
              <div className="flex items-end gap-1.5 h-24">
                {weeklyBars.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <div
                      className="w-full bg-[#FFE600] min-h-[2px] transition-all duration-700"
                      style={{ height: `${Math.max(4, Math.round((val / maxBar) * 88))}px` }}
                    />
                    <span className="text-[7px] font-mono text-[#333]">{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Karma breakdown */}
            <div className="px-5 py-4">
              <p className="text-[8px] font-mono text-[#333] tracking-widest mb-2">FUENTES DE KARMA</p>
              {karmaBreakdown ? (
                <>
                  <KarmaBar label="RESEÑAS EFECTIVAS" value={karmaBreakdown.reviews_karma} max={maxKarma} />
                  <KarmaBar label="LISTAS DESTACADAS" value={karmaBreakdown.lists_karma} max={maxKarma} />
                  <KarmaBar label="CONSISTENCIA TOP" value={karmaBreakdown.consistency_karma} max={maxKarma} />
                  <KarmaBar label="ENGAGEMENT" value={karmaBreakdown.engagement_karma} max={maxKarma} />
                </>
              ) : (
                <>
                  <KarmaBar label="RESEÑAS EFECTIVAS" value={Math.round(karma * 0.60)} max={karma} />
                  <KarmaBar label="LISTAS DESTACADAS" value={Math.round(karma * 0.20)} max={karma} />
                  <KarmaBar label="CONSISTENCIA TOP" value={Math.round(karma * 0.12)} max={karma} />
                  <KarmaBar label="ENGAGEMENT"        value={Math.round(karma * 0.08)} max={karma} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION 02: RESEÑAS RECIENTES ─────────────────── */}
        <div className="border border-t-0 border-[#1f1f1f] mb-1">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black font-mono text-[#FFE600] tracking-widest">02</span>
              <span className="block w-5 h-px bg-[#FFE600]/50" />
              <h2 className="text-[10px] font-black tracking-widest text-white" style={{ fontFamily: 'Space Grotesk' }}>
                RESEÑAS RECIENTES
              </h2>
            </div>
            <Link href="/mis-resenas"
              className="text-[8px] font-mono text-[#333] tracking-widest hover:text-[#FFE600] transition-colors">
              VER TODAS · {stats.reviews} →
            </Link>
          </div>

          {recentReviews.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[10px] font-mono text-[#333] tracking-widest">SIN RESEÑAS AÚN</p>
              <p className="text-[9px] font-mono text-[#1f1f1f] mt-1">Escribe tu primera reseña</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#1f1f1f]">
              {recentReviews.slice(0, 4).map((rev, i) => (
                <Link key={rev.id} href={`/${rev.media_type}/${rev.tmdb_id}`}
                  className={`flex gap-3 p-4 hover:bg-white/[0.02] transition-colors group ${i >= 2 ? 'border-t border-[#1f1f1f]' : ''}`}>
                  {/* mini poster */}
                  <div className="w-8 h-12 bg-[#141414] border border-[#1f1f1f] shrink-0 overflow-hidden">
                    {rev.movie_poster && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://image.tmdb.org/t/p/w92${rev.movie_poster}`}
                        alt={rev.movie_title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate group-hover:text-[#FFE600] transition-colors">
                      {rev.movie_title}
                    </p>
                    <p className="text-[9px] font-mono text-[#FFE600] mt-0.5">
                      ★ {rev.rating}/10
                    </p>
                    {rev.content && (
                      <p className="text-[10px] text-[#525252] mt-1 line-clamp-2 leading-relaxed italic">
                        &ldquo;{rev.content}&rdquo;
                      </p>
                    )}
                    {rev.helpful_votes !== undefined && rev.helpful_votes > 0 && (
                      <p className="text-[8px] font-mono text-[#333] mt-1 tracking-widest">
                        {rev.helpful_votes} KARMA
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── SECTION 03: LISTAS / GÉNERO ────────────────────── */}
        <div className="border border-t-0 border-[#1f1f1f] mb-1">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black font-mono text-[#FFE600] tracking-widest">03</span>
              <span className="block w-5 h-px bg-[#FFE600]/50" />
              <h2 className="text-[10px] font-black tracking-widest text-white" style={{ fontFamily: 'Space Grotesk' }}>
                GÉNEROS FAVORITOS
              </h2>
            </div>
            <Link href="/colecciones"
              className="text-[8px] font-mono text-[#333] tracking-widest hover:text-[#FFE600] transition-colors">
              {stats.collections} LISTAS →
            </Link>
          </div>

          {genreStats.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[10px] font-mono text-[#333] tracking-widest">SIN DATOS</p>
            </div>
          ) : (
            <div className="p-5 space-y-3">
              {genreStats.slice(0, 5).map(g => {
                const avg = g.watch_count > 0 ? (g.total_rating / g.watch_count).toFixed(1) : '—';
                const maxCount = genreStats[0].watch_count;
                const pct = Math.round((g.watch_count / maxCount) * 100);
                return (
                  <div key={g.genre_name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-white tracking-wide">{g.genre_name.toUpperCase()}</span>
                      <span className="text-[9px] font-mono text-[#525252]">
                        {g.watch_count} visto{g.watch_count !== 1 ? 's' : ''} · ★ {avg}
                      </span>
                    </div>
                    <div className="h-px bg-[#1a1a1a] relative">
                      <div className="absolute top-0 left-0 h-full bg-[#FFE600] transition-all duration-700"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SECTION 04: LOGROS ─────────────────────────────── */}
        <div className="border border-t-0 border-[#1f1f1f]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black font-mono text-[#FFE600] tracking-widest">04</span>
              <span className="block w-5 h-px bg-[#FFE600]/50" />
              <h2 className="text-[10px] font-black tracking-widest text-white" style={{ fontFamily: 'Space Grotesk' }}>
                LOGROS DESBLOQUEADOS
              </h2>
            </div>
            <span className="text-[8px] font-mono text-[#333] tracking-widest">
              {ACHIEVEMENTS.filter(a => a.unlocked).length}/{ACHIEVEMENTS.length}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-[#1f1f1f]">
            {ACHIEVEMENTS.map((a, i) => (
              <div key={i}
                className={`flex flex-col items-center justify-center p-4 gap-1.5 text-center ${!a.unlocked ? 'opacity-20' : ''}`}>
                <span className={`text-2xl font-black ${a.unlocked ? 'text-[#FFE600]' : 'text-[#333]'}`}>
                  {a.icon}
                </span>
                <p className="text-[8px] font-black font-mono tracking-widest text-white leading-tight">
                  {a.label}
                </p>
                <p className="text-[7px] font-mono text-[#333] tracking-wide leading-tight">{a.desc}</p>
                {a.karma > 0 && (
                  <p className="text-[7px] font-mono text-[#FFE600] tracking-widest">+{a.karma} KARMA</p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
