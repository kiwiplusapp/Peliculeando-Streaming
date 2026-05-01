'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { MediaItem } from '@/lib/tmdb';
import { MediaCard } from './MediaCard';

export function RecommendationsSection({ userId }: { userId?: string }) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recommendations')
      .then(r => r.json())
      .then(d => { setItems(d.items || []); setPersonalized(d.personalized || false); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  if (!items.length && !loading) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4 px-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-500">
          <Sparkles size={13} className="text-black" />
        </div>
        <h2 className="font-bold text-lg text-white tracking-tight">
          {personalized ? 'Para ti — basado en lo que viste' : 'Lo que no te puedes perder'}
        </h2>
        {personalized && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
            Personalizado
          </span>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-none px-6 pb-1 max-w-[1400px] mx-auto">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[155px]">
                <div className="skeleton aspect-[2/3] rounded-lg" />
                <div className="skeleton h-3 mt-2 rounded w-3/4" />
                <div className="skeleton h-3 mt-1 rounded w-1/2" />
              </div>
            ))
          : items.map(item => (
              <MediaCard key={`${item.tmdb_id}-${item.media_type}`} item={item} />
            ))}
      </div>
    </section>
  );
}
