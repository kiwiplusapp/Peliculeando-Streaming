'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Star, Bookmark, Crown, Zap, TrendingUp, LogOut, BarChart2, FileText } from 'lucide-react';
import Link from 'next/link';

interface Stats {
  users: number;
  reviews: number;
  watchlist: number;
  activeSubscriptions: number;
  totalXP: number;
  newUsersThisWeek: number;
  topUsers: { id: number; username: string; xp_total: number; level: number }[];
  recentReviews: { id: number; content: string; rating: number; username: string; movie_title: string; created_at: string }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => {
        if (r.status === 401) { router.push('/admin'); return null; }
        return r.json();
      })
      .then(d => { if (d) setStats(d); })
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <p className="text-[11px] font-mono text-[#525252] tracking-widest">CARGANDO...</p>
      </div>
    );
  }

  const STAT_CARDS = [
    { label: 'USUARIOS', value: stats?.users ?? 0, icon: Users, color: '#FFE600' },
    { label: 'RESEÑAS', value: stats?.reviews ?? 0, icon: Star, color: '#FFE600' },
    { label: 'WATCHLIST', value: stats?.watchlist ?? 0, icon: Bookmark, color: '#FFE600' },
    { label: 'SUBS ACTIVAS', value: stats?.activeSubscriptions ?? 0, icon: Crown, color: '#FFE600' },
    { label: 'XP TOTAL', value: (stats?.totalXP ?? 0).toLocaleString(), icon: Zap, color: '#FFE600' },
    { label: 'NUEVOS (7D)', value: stats?.newUsersThisWeek ?? 0, icon: TrendingUp, color: '#FFE600' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-52 bg-[#080808] border-r border-[#1f1f1f] flex flex-col z-10">
        <div className="px-5 py-5 border-b border-[#1f1f1f]">
          <p className="text-[8px] font-mono tracking-[0.3em] text-[#525252]">PELICULEANDO</p>
          <p className="text-[11px] font-black font-mono tracking-[0.15em] text-[#FFE600]">ADMIN PANEL</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {[
            { href: '/admin/dashboard', label: 'DASHBOARD', icon: BarChart2 },
            { href: '/admin/users', label: 'USUARIOS', icon: Users },
            { href: '/admin/reviews', label: 'RESEÑAS', icon: FileText },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-[10px] font-black font-mono tracking-widest text-[#525252] hover:text-white hover:bg-white/5 transition-colors group">
              <item.icon size={13} className="group-hover:text-[#FFE600] transition-colors" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-[#1f1f1f]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-[10px] font-black font-mono tracking-widest text-[#525252] hover:text-red-400 transition-colors">
            <LogOut size={13} />
            CERRAR SESIÓN
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-52 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
          <p className="text-[11px] font-mono text-[#525252] tracking-widest mt-1">VISTA GENERAL DEL SISTEMA</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {STAT_CARDS.map(card => (
            <div key={card.label} className="border border-[#1f1f1f] bg-[#0f0f0f] p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-black font-mono tracking-[0.25em] text-[#525252]">{card.label}</p>
                <card.icon size={14} style={{ color: card.color }} />
              </div>
              <p className="text-3xl font-black font-mono text-white">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Top Users */}
          <div className="border border-[#1f1f1f] bg-[#0f0f0f]">
            <div className="px-5 py-3 border-b border-[#1f1f1f]">
              <p className="text-[10px] font-black font-mono tracking-widest text-[#525252]">TOP USUARIOS POR XP</p>
            </div>
            <div className="divide-y divide-[#1f1f1f]">
              {(stats?.topUsers ?? []).map((u, i) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black font-mono text-[#FFE600] w-5">#{i + 1}</span>
                    <div>
                      <p className="text-sm font-semibold">{u.username}</p>
                      <p className="text-[10px] font-mono text-[#525252]">Nivel {u.level}</p>
                    </div>
                  </div>
                  <p className="text-[11px] font-black font-mono text-[#FFE600]">{u.xp_total.toLocaleString()} XP</p>
                </div>
              ))}
              {!stats?.topUsers?.length && (
                <p className="px-5 py-4 text-[11px] font-mono text-[#333]">Sin datos</p>
              )}
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="border border-[#1f1f1f] bg-[#0f0f0f]">
            <div className="px-5 py-3 border-b border-[#1f1f1f]">
              <p className="text-[10px] font-black font-mono tracking-widest text-[#525252]">ÚLTIMAS RESEÑAS</p>
            </div>
            <div className="divide-y divide-[#1f1f1f]">
              {(stats?.recentReviews ?? []).map(r => (
                <div key={r.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-black text-[#FFE600]">{r.username}</p>
                    <span className="text-[10px] font-mono text-[#525252]">{r.rating}/10</span>
                  </div>
                  <p className="text-[11px] text-[#A3A3A3] line-clamp-1">{r.movie_title || '—'}</p>
                  {r.content && (
                    <p className="text-[10px] text-[#525252] line-clamp-1 mt-0.5">"{r.content}"</p>
                  )}
                </div>
              ))}
              {!stats?.recentReviews?.length && (
                <p className="px-5 py-4 text-[11px] font-mono text-[#333]">Sin reseñas</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
