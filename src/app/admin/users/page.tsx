'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, BarChart2, FileText, LogOut, Search, Crown, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  email: string;
  xp_total: number;
  level: number;
  created_at: string;
  review_count: string;
  subscription_active: boolean;
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?page=${page}&q=${encodeURIComponent(search)}`);
    if (res.status === 401) { router.push('/admin'); return; }
    const d = await res.json();
    setUsers(d.users);
    setTotal(d.total);
    setPages(d.pages);
    setLoading(false);
  }, [page, search, router]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleAction = async (userId: number, action: string) => {
    const confirmMsg = action === 'delete' ? '¿Eliminar este usuario? Esta acción es irreversible.' : null;
    if (confirmMsg && !confirm(confirmMsg)) return;
    setActionLoading(userId);
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action }),
    });
    setActionLoading(null);
    loadUsers();
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
            { href: '/admin/users', label: 'USUARIOS', icon: Users, active: true },
            { href: '/admin/reviews', label: 'RESEÑAS', icon: FileText },
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight">Usuarios</h1>
            <p className="text-[11px] font-mono text-[#525252] tracking-widest mt-1">{total} REGISTRADOS EN TOTAL</p>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525252]" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Buscar usuario o email..."
                className="bg-[#141414] border border-[#1f1f1f] pl-9 pr-4 py-2.5 text-[11px] font-mono text-white w-64 focus:outline-none focus:border-[#FFE600] transition-colors"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#525252] hover:text-white">
                  <X size={12} />
                </button>
              )}
            </div>
            <button type="submit"
              className="px-4 py-2.5 bg-[#FFE600] text-black text-[10px] font-black font-mono tracking-widest hover:opacity-90 transition-opacity">
              BUSCAR
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="border border-[#1f1f1f] bg-[#0f0f0f] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f1f]">
                {['ID', 'USUARIO', 'EMAIL', 'XP / NIV.', 'RESEÑAS', 'SUSCRIPCIÓN', 'REGISTRO', 'ACCIONES'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[8px] font-black font-mono tracking-widest text-[#525252]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]">
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[11px] font-mono text-[#333]">Cargando...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[11px] font-mono text-[#333]">Sin resultados</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-[11px] font-mono text-[#525252]">#{u.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold">{u.username}</p>
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#A3A3A3]">{u.email}</td>
                  <td className="px-4 py-3">
                    <p className="text-[11px] font-black font-mono text-[#FFE600]">{u.xp_total.toLocaleString()} XP</p>
                    <p className="text-[10px] font-mono text-[#525252]">Niv {u.level}</p>
                  </td>
                  <td className="px-4 py-3 text-[11px] font-mono text-[#A3A3A3]">{u.review_count}</td>
                  <td className="px-4 py-3">
                    {u.subscription_active ? (
                      <span className="flex items-center gap-1 text-[10px] font-black font-mono text-[#FFE600]">
                        <Crown size={10} /> VIP
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#333]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[10px] font-mono text-[#525252]">
                    {new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.subscription_active ? (
                        <button
                          onClick={() => handleAction(u.id, 'revoke_subscription')}
                          disabled={actionLoading === u.id}
                          className="text-[9px] font-black font-mono tracking-widest px-2 py-1 border border-[#333] text-[#525252] hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-40">
                          REVOCAR VIP
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(u.id, 'grant_subscription')}
                          disabled={actionLoading === u.id}
                          className="text-[9px] font-black font-mono tracking-widest px-2 py-1 border border-[#FFE600]/30 text-[#FFE600]/70 hover:text-[#FFE600] hover:border-[#FFE600] transition-colors disabled:opacity-40">
                          DAR VIP
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(u.id, 'delete')}
                        disabled={actionLoading === u.id}
                        className="w-7 h-7 flex items-center justify-center border border-[#1f1f1f] text-[#525252] hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-40">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-4">
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
