'use client';

import Link from 'next/link';
import { BookOpen, ListVideo, Sparkles, Star, Trophy } from 'lucide-react';

interface Props {
  user: { id: number; username: string; email: string; avatar_color: string; bio: string | null; created_at: string };
  stats: { reviews: number; watchlist: number; collections: number };
  genreStats: { genre_name: string; watch_count: number; total_rating: number }[];
  karma?: number;
  helpfulVotes?: number;
}

export function ProfileContent({ user, stats, genreStats, karma = 0, helpfulVotes = 0 }: Props) {
  const initial = user.username[0].toUpperCase();
  const joined = new Date(user.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' });

  return (
    <div>
      {/* Avatar + info */}
      <div className="flex items-center gap-5 mb-8">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
          style={{ background: user.avatar_color || '#f59e0b' }}
        >
          {initial}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.username}</h1>
          <p className="text-sm text-[#A3A3A3]">{user.email}</p>
          <p className="text-xs text-[#525252] mt-1">Miembro desde {joined}</p>
        </div>
      </div>

      {/* Karma badge */}
      {karma > 0 && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Trophy size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{karma.toLocaleString()} karma</p>
            <p className="text-xs text-[#525252]">{helpfulVotes} votos útiles recibidos</p>
          </div>
          <Link href="/comunidad" className="ml-auto text-xs text-amber-400 hover:text-amber-300">
            Ver ranking →
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Reseñas', value: stats.reviews, href: '/mis-resenas', icon: <BookOpen size={18} /> },
          { label: 'Mi lista', value: stats.watchlist, href: '/mi-lista', icon: <ListVideo size={18} /> },
          { label: 'Colecciones', value: stats.collections, href: '/colecciones', icon: <Sparkles size={18} /> },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="bg-[#111111] border border-[#262626] rounded-xl p-4 text-center hover:border-amber-500/50 transition-colors">
            <div className="text-amber-400 flex justify-center mb-1">{s.icon}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-[#A3A3A3]">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Genre preferences */}
      {genreStats.length > 0 && (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-400" /> Tus géneros favoritos
          </h2>
          <div className="space-y-3">
            {genreStats.map(g => {
              const avg = g.watch_count > 0 ? (g.total_rating / g.watch_count).toFixed(1) : '—';
              const maxCount = genreStats[0].watch_count;
              const pct = Math.round((g.watch_count / maxCount) * 100);
              return (
                <div key={g.genre_name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{g.genre_name}</span>
                    <span className="text-[#A3A3A3]">{g.watch_count} visto{g.watch_count !== 1 ? 's' : ''} · {avg}/10 promedio</span>
                  </div>
                  <div className="h-1.5 bg-[#262626] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-pink-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
