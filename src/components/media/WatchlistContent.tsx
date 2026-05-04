'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { imgUrl } from '@/lib/tmdb';
import { X, Film, Tv } from 'lucide-react';

interface WatchlistItem {
  id: number;
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  added_at: string;
}

export function WatchlistContent() {
  const [items, setItems]     = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'movie' | 'tv'>('all');
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/watchlist')
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remove = async (item: WatchlistItem) => {
    setRemoving(item.id);
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdb_id: item.tmdb_id, media_type: item.media_type }),
    });
    setItems(prev => prev.filter(i => i.id !== item.id));
    setRemoving(null);
  };

  const displayed = filter === 'all' ? items : items.filter(i => i.media_type === filter);
  const movieCount = items.filter(i => i.media_type === 'movie').length;
  const tvCount    = items.filter(i => i.media_type === 'tv').length;

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[2/3] bg-[#141414] border border-[#1f1f1f] animate-pulse" />
            <div className="h-2 bg-[#141414] animate-pulse mt-2 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="border border-[#1f1f1f] px-6 py-20 text-center">
        <p className="text-[11px] font-mono text-[#333] tracking-widest mb-2">LISTA VACÍA</p>
        <p className="text-[10px] font-mono text-[#1f1f1f]">
          Añade películas y series con el botón + en cualquier ficha
        </p>
        <Link href="/explorar"
          className="inline-block mt-5 px-5 py-2.5 text-[10px] font-black tracking-widest text-black bg-[#FFE600] hover:opacity-90 transition-opacity"
          style={{ fontFamily: 'Space Grotesk' }}>
          EXPLORAR CATÁLOGO
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-3 border border-[#1f1f1f] mb-6">
        {[
          { label: 'TOTAL',     value: items.length },
          { label: 'PELÍCULAS', value: movieCount   },
          { label: 'SERIES',    value: tvCount      },
        ].map(s => (
          <div key={s.label} className="px-4 py-3 border-r border-[#1f1f1f] last:border-r-0 text-center">
            <p className="text-2xl font-black font-mono text-[#FFE600] leading-none">{s.value}</p>
            <p className="text-[8px] font-mono text-[#333] tracking-[0.2em] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0 border-b border-[#1f1f1f] mb-6">
        {[
          { key: 'all',   label: 'TODOS',     icon: null  },
          { key: 'movie', label: 'PELÍCULAS',  icon: Film  },
          { key: 'tv',    label: 'SERIES',     icon: Tv    },
        ].map(t => (
          <button key={t.key}
            onClick={() => setFilter(t.key as typeof filter)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-black tracking-widest border-b-2 -mb-px transition-colors ${
              filter === t.key ? 'text-[#FFE600] border-[#FFE600]' : 'text-[#333] border-transparent hover:text-[#525252]'
            }`}
            style={{ fontFamily: 'Space Grotesk' }}>
            {t.icon && <t.icon size={10} />}
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-[9px] font-mono text-[#333] tracking-widest pr-2">
          {displayed.length} TÍTULOS
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {displayed.map(item => {
          const poster = imgUrl(item.poster_path, 'w342');
          return (
            <div key={item.id} className="group relative">
              <Link href={`/${item.media_type}/${item.tmdb_id}`}>
                <div className="relative aspect-[2/3] overflow-hidden bg-[#141414] border border-[#1f1f1f] group-hover:border-[#FFE600]/30 transition-colors">
                  {poster ? (
                    <Image src={poster} alt={item.title} fill sizes="160px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[#333]">
                      <Film size={20} />
                    </div>
                  )}
                  {/* Type badge */}
                  <div className="absolute top-1.5 left-1.5">
                    <span className="text-[7px] font-black font-mono tracking-widest px-1 py-0.5 bg-black/80 text-[#525252]">
                      {item.media_type === 'tv' ? 'SERIE' : 'FILM'}
                    </span>
                  </div>
                </div>
                <p className="mt-1.5 text-[10px] font-semibold text-[#A3A3A3] line-clamp-2 leading-tight group-hover:text-white transition-colors">
                  {item.title}
                </p>
              </Link>
              <button
                onClick={() => remove(item)}
                disabled={removing === item.id}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/80 border border-[#2a2a2a] flex items-center justify-center text-[#525252] opacity-0 group-hover:opacity-100 hover:text-red-400 hover:border-red-500/40 transition-all disabled:opacity-50"
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
