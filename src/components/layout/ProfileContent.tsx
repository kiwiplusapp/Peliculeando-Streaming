'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  BookOpen, ListVideo, Sparkles, Star, Zap, Film,
  Eye, TrendingUp, Clock, ChevronRight,
} from 'lucide-react';
import { XPBar } from '@/components/gamification/XPBar';
import { LevelBadge } from '@/components/gamification/LevelBadge';
import { AchievementsGrid } from '@/components/gamification/AchievementsGrid';

const XP_ACTION_LABELS: Record<string, { label: string; color: string }> = {
  watch_movie:            { label: 'Película vista',     color: '#3b82f6' },
  watch_episode:          { label: 'Episodio visto',     color: '#8b5cf6' },
  write_review:           { label: 'Reseña escrita',     color: '#f59e0b' },
  helpful_vote_received:  { label: 'Voto útil recibido', color: '#10b981' },
  add_to_watchlist:       { label: 'Añadido a lista',    color: '#6b7280' },
  create_collection:      { label: 'Colección creada',   color: '#ec4899' },
  achievement_bonus:      { label: 'Logro desbloqueado', color: '#f59e0b' },
};

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
}

type Tab = 'overview' | 'achievements' | 'activity';

export function ProfileContent({
  user, stats, genreStats,
  karma = 0, helpfulVotes = 0,
  xp = 0, recentXP = [],
}: Props) {
  const [tab, setTab] = useState<Tab>('overview');
  const initial = user.username[0].toUpperCase();
  const joined = new Date(user.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });

  const statCards = [
    { label: 'Vistas',      value: stats.watched,     href: '/explorar',    icon: <Eye size={16} /> },
    { label: 'Reseñas',     value: stats.reviews,     href: '/mis-resenas', icon: <BookOpen size={16} /> },
    { label: 'Mi lista',    value: stats.watchlist,   href: '/mi-lista',    icon: <ListVideo size={16} /> },
    { label: 'Colecciones', value: stats.collections, href: '/colecciones', icon: <Sparkles size={16} /> },
  ];

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview',     label: 'Perfil' },
    { key: 'achievements', label: 'Logros' },
    { key: 'activity',     label: 'Actividad XP' },
  ];

  return (
    <div className="animate-fade-up">
      {/* ── Header card ───────────────────────────────────── */}
      <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-6 mb-4">
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${user.avatar_color || '#f59e0b'}, ${user.avatar_color || '#f59e0b'}88)`,
                boxShadow: `0 0 24px ${user.avatar_color || '#f59e0b'}30`,
              }}
            >
              {initial}
            </div>
            {/* Level ring */}
            <div className="absolute -bottom-2 -right-2">
              <LevelBadge xp={xp} size="sm" showName={false} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white tracking-tight">{user.username}</h1>
            <p className="text-sm text-[#737373] mt-0.5">{user.email}</p>
            <p className="text-xs text-[#404040] mt-1 flex items-center gap-1">
              <Clock size={11} /> Miembro desde {joined}
            </p>
          </div>

          {/* Karma pill */}
          {karma > 0 && (
            <Link href="/comunidad"
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/8 border border-amber-500/20 rounded-xl hover:border-amber-500/40 transition-colors">
              <TrendingUp size={13} className="text-amber-400" />
              <span className="text-xs font-bold text-amber-400">{karma.toLocaleString()}</span>
              <span className="text-xs text-[#525252]">karma</span>
            </Link>
          )}
        </div>

        {/* XP Bar */}
        <XPBar xp={xp} animated />
      </div>

      {/* ── Stats row ─────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {statCards.map(s => (
          <Link key={s.label} href={s.href}
            className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl p-3 text-center hover:border-amber-500/30 transition-colors group">
            <div className="text-[#525252] group-hover:text-amber-400 flex justify-center mb-1.5 transition-colors">{s.icon}</div>
            <div className="text-xl font-black text-white">{s.value}</div>
            <div className="text-[10px] text-[#525252] mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* ── Tabs ──────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-1 mb-4">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === t.key
                ? 'bg-[#1a1a1a] text-white shadow-sm'
                : 'text-[#525252] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────── */}

      {tab === 'overview' && (
        <div className="space-y-4 animate-fade-in">
          {/* Genre preferences */}
          {genreStats.length > 0 && (
            <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl p-5">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2 text-sm">
                <Star size={14} className="text-amber-400" /> Géneros favoritos
              </h2>
              <div className="space-y-3">
                {genreStats.map(g => {
                  const avg = g.watch_count > 0 ? (g.total_rating / g.watch_count).toFixed(1) : '—';
                  const maxCount = genreStats[0].watch_count;
                  const pct = Math.round((g.watch_count / maxCount) * 100);
                  return (
                    <div key={g.genre_name}>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-white font-medium">{g.genre_name}</span>
                        <span className="text-[#525252]">{g.watch_count} visto{g.watch_count !== 1 ? 's' : ''} · {avg}/10</span>
                      </div>
                      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-pink-500 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="bg-[#0f0f0f] border border-[#1f1f1f] rounded-2xl divide-y divide-[#1a1a1a]">
            {[
              { href: '/mis-resenas', icon: <BookOpen size={15} />, label: 'Mis reseñas', sub: `${stats.reviews} escritas` },
              { href: '/mi-lista', icon: <ListVideo size={15} />, label: 'Mi lista', sub: `${stats.watchlist} títulos` },
              { href: '/colecciones', icon: <Sparkles size={15} />, label: 'Mis colecciones', sub: `${stats.collections} creadas` },
              { href: '/comunidad', icon: <TrendingUp size={15} />, label: 'Ranking de karma', sub: `${karma.toLocaleString()} puntos` },
            ].map(row => (
              <Link key={row.href} href={row.href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors group">
                <div className="text-[#525252] group-hover:text-amber-400 transition-colors">{row.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{row.label}</p>
                  <p className="text-xs text-[#525252]">{row.sub}</p>
                </div>
                <ChevronRight size={14} className="text-[#333] group-hover:text-[#737373] transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === 'achievements' && (
        <div className="animate-fade-in">
          <AchievementsGrid />
        </div>
      )}

      {tab === 'activity' && (
        <div className="animate-fade-in space-y-2">
          {recentXP.length === 0 && (
            <div className="text-center py-12 text-[#404040]">
              <Zap size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aún no hay actividad XP</p>
              <p className="text-xs mt-1">Ver películas y escribir reseñas para ganar XP</p>
            </div>
          )}
          {recentXP.map((ev, i) => {
            const meta = XP_ACTION_LABELS[ev.action] ?? { label: ev.action, color: '#737373' };
            const dt = new Date(ev.created_at).toLocaleDateString('es-MX', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
            });
            return (
              <div key={i} className="flex items-center gap-3 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: meta.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{meta.label}</p>
                  <p className="text-xs text-[#404040]">{dt}</p>
                </div>
                <span className="text-sm font-bold" style={{ color: meta.color }}>
                  +{ev.xp_gained} XP
                </span>
              </div>
            );
          })}

          {/* XP action guide */}
          <div className="mt-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[#525252] uppercase tracking-wider mb-3">Cómo ganar XP</h3>
            <div className="space-y-2">
              {[
                { label: 'Ver una película',  xp: 25, color: '#3b82f6' },
                { label: 'Escribir una reseña', xp: 50, color: '#f59e0b' },
                { label: 'Ver un episodio',   xp: 10, color: '#8b5cf6' },
                { label: 'Voto útil recibido', xp: 15, color: '#10b981' },
                { label: 'Desbloquear logro', xp: '50–1000', color: '#ec4899' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between text-xs">
                  <span className="text-[#737373]">{r.label}</span>
                  <span className="font-bold" style={{ color: r.color }}>+{r.xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
