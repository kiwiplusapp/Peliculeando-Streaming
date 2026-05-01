'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Loader } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

interface WatchlistButtonProps {
  item: {
    tmdb_id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path?: string | null;
  };
}

export function WatchlistButton({ item }: WatchlistButtonProps) {
  const [inList, setInList] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/watchlist?ids=1')
      .then(r => r.ok ? r.json() : { ids: [] })
      .then(d => {
        const ids = (d.ids || []) as { tmdb_id: number; media_type: string }[];
        setInList(ids.some(i => i.tmdb_id === item.tmdb_id && i.media_type === item.media_type));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [item.tmdb_id, item.media_type]);

  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const method = inList ? 'DELETE' : 'POST';
      const res = await fetch('/api/watchlist', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: item.tmdb_id,
          media_type: item.media_type,
          title: item.title,
          poster_path: item.poster_path,
        }),
      });
      if (!res.ok) {
        if (res.status === 401) { toast('Inicia sesión para guardar', 'error'); return; }
        toast('Error al actualizar', 'error');
        return;
      }
      setInList(!inList);
      toast(inList ? 'Eliminado de tu lista' : 'Añadido a tu lista');
    } catch {
      toast('Error de conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 px-5 py-2.5 text-[11px] font-semibold tracking-widest transition-colors border ${
        inList
          ? 'border-[#FFE600]/40 text-[#FFE600] bg-[#FFE600]/8'
          : 'border-[#2a2a2a] text-[#A3A3A3] bg-transparent hover:border-[#FFE600]/30 hover:text-white'
      }`}
      style={{ fontFamily: 'Space Grotesk' }}
    >
      {loading ? <Loader size={13} className="animate-spin" /> : inList ? <Check size={13} /> : <Plus size={13} />}
      {inList ? 'EN LISTA' : '+ MI LISTA'}
    </button>
  );
}
