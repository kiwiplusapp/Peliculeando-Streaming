'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BarChart2, FileText, LogOut, ChevronLeft, ChevronRight, Trash2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Review {
  id: number;
  content: string;
  rating: number;
  has_spoilers: boolean;
  movie_title: string;
  movie_poster: string;
  media_type: string;
  username: string;
  user_id: number;
  created_at: string;
  helpful: string;
  unhelpful: string;
}

export default function AdminReviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/reviews?page=${page}`);
    if (res.status === 401) { router.push('/admin'); return; }
    const d = await res.json();
    setReviews(d.reviews);
    setTotal(d.total);
    setPages(d.pages);
    setLoading(false);
  }, [page, router]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta reseña?')) return;
    setDeletingId(id);
    await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
    setDeletingId(null);
    loadReviews();
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin');
  };

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
            { href: '/admin/reviews', label: 'RESEÑAS', icon: FileText, active: true },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-[10px] font-black font-mono tracking-widest transition-colors group ${
                item.active ? 'text-white bg-white/5' : 'text-[#525252] hover:text-white hover:bg-white/5'
              }`}>
              <item.icon size={13} className={item.active ? 'text-[#FFE600]' : 'group-hover:text-[#FFE600] transition-colors'} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-[#1f1f1f]">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-[10px] font-black font-mono tracking-widest text-[#525252] hover:text-red-400 transition-colors">
            <LogOut size={13} />
            CERRAR SESIÓN
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="ml-52 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-tight">Reseñas</h1>
          <p className="text-[11px] font-mono text-[#525252] tracking-widest mt-1">{total} RESEÑAS EN TOTAL</p>
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-[11px] font-mono text-[#333] text-center py-10">Cargando...</p>
          ) : reviews.length === 0 ? (
            <p className="text-[11px] font-mono text-[#333] text-center py-10">Sin reseñas</p>
          ) : reviews.map(r => (
            <div key={r.id} className="border border-[#1f1f1f] bg-[#0f0f0f] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-[11px] font-black text-[#FFE600]">@{r.username}</span>
                    <span className="text-[9px] font-mono text-[#525252]">·</span>
                    <span className="text-[11px] font-black font-mono">{r.rating}/10</span>
                    <span className="text-[9px] font-mono text-[#525252]">·</span>
                    <span className="text-[10px] font-mono text-[#A3A3A3]">{r.movie_title || '—'}</span>
                    <span className="text-[9px] font-mono text-[#333] uppercase">{r.media_type}</span>
                    {r.has_spoilers && (
                      <span className="flex items-center gap-1 text-[9px] font-black font-mono text-amber-400 border border-amber-400/30 px-1.5 py-0.5">
                        <AlertTriangle size={8} /> SPOILERS
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-[#525252]">
                      {new Date(r.created_at).toLocaleDateString('es-ES')}
                    </span>
                  </div>

                  {r.content ? (
                    <p className="text-sm text-[#A3A3A3] line-clamp-2">{r.content}</p>
                  ) : (
                    <p className="text-[11px] font-mono text-[#333] italic">Sin contenido escrito</p>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-[10px] font-mono text-[#525252]">
                      👍 {r.helpful} · 👎 {r.unhelpful}
                    </span>
                    <span className="text-[10px] font-mono text-[#333]">ID #{r.id}</span>
                  </div>
                </div>

                {r.movie_poster && (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${r.movie_poster}`}
                    alt={r.movie_title}
                    className="w-10 h-14 object-cover shrink-0 opacity-60"
                  />
                )}

                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  className="w-8 h-8 shrink-0 flex items-center justify-center border border-[#1f1f1f] text-[#525252] hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-40">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-[10px] font-mono text-[#525252]">Página {page} de {pages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center border border-[#1f1f1f] text-[#525252] hover:text-white disabled:opacity-30 transition-colors">
                <ChevronLeft size={13} />
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="w-8 h-8 flex items-center justify-center border border-[#1f1f1f] text-[#525252] hover:text-white disabled:opacity-30 transition-colors">
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
