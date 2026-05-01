'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { imgUrl } from '@/lib/tmdb';
import { X } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

interface WatchlistItem {
  id: number;
  tmdb_id: number;
  media_type: string;
  title: string;
  poster_path: string | null;
  added_at: string;
}

export function WatchlistContent() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/watchlist')
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const remove = async (item: WatchlistItem) => {
    await fetch('/api/watchlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdb_id: item.tmdb_id, media_type: item.media_type }),
    });
    setItems(prev => prev.filter(i => i.id !== item.id));
    toast('Eliminado de tu lista');
  };

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton aspect-[2/3] rounded-lg" />)}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center py-16 text-[#525252]">
        <p className="text-4xl mb-2">📋</p>
        <p className="font-medium">Tu lista está vacía</p>
        <p className="text-sm mt-1">Añade películas y series con el botón +</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
      {items.map(item => {
        const poster = imgUrl(item.poster_path, 'w342');
        return (
          <div key={item.id} className="group relative">
            <Link href={`/${item.media_type}/${item.tmdb_id}`}>
              <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#181818] border border-[#262626] card-glow group-hover:-translate-y-1 transition-transform">
                {poster ? (
                  <Image src={poster} alt={item.title} fill sizes="160px" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-[#181818]" />
                )}
              </div>
              <p className="mt-2 text-xs text-white line-clamp-2">{item.title}</p>
            </Link>
            <button
              onClick={() => remove(item)}
              className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-red-500/80 transition-all"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
