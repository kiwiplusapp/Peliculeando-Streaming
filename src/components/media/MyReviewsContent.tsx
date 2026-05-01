'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { imgUrl } from '@/lib/tmdb';
import { Star } from 'lucide-react';

interface Review {
  id: number;
  tmdb_id: number;
  media_type: string;
  rating: number;
  is_fresh: boolean;
  content: string | null;
  movie_title: string;
  movie_poster: string | null;
  created_at: string;
}

export function MyReviewsContent() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reviews?user_only=1')
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="skeleton h-48 rounded-xl" />;

  if (!reviews.length) {
    return (
      <div className="text-center py-16 text-[#525252]">
        <p className="text-4xl mb-2">✍️</p>
        <p className="font-medium">Aún no has escrito reseñas</p>
        <p className="text-sm mt-1">Busca una película y comparte tu opinión</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map(r => {
        const poster = imgUrl(r.movie_poster, 'w185');
        const date = new Date(r.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
        return (
          <Link
            key={r.id}
            href={`/${r.media_type}/${r.tmdb_id}`}
            className="flex gap-4 bg-[#111111] border border-[#262626] rounded-xl p-4 hover:border-amber-500/50 transition-colors group"
          >
            {poster && (
              <div className="relative w-14 shrink-0 aspect-[2/3] rounded-lg overflow-hidden">
                <Image src={poster} alt={r.movie_title} fill sizes="56px" className="object-cover" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-white group-hover:text-amber-400 transition-colors">{r.movie_title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${r.is_fresh ? 'badge-fresh' : 'badge-rotten'}`}>
                  {r.is_fresh ? '🍅 FRESCO' : '💀 PODRIDO'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={11} className={i <= Math.round(r.rating / 2) ? 'text-amber-400' : 'text-[#333333]'} fill={i <= Math.round(r.rating / 2) ? '#fbbf24' : '#333333'} />
                  ))}
                </div>
                <span className="text-xs text-[#525252]">{r.rating}/10 · {date}</span>
              </div>
              {r.content && (
                <p className="text-sm text-[#A3A3A3] mt-1.5 line-clamp-2">{r.content}</p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
