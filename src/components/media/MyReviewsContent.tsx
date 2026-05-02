'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('date');

  useEffect(() => {
    fetch('/api/reviews?user_only=1')
      .then(r => r.json())
      .then(d => setReviews(d.reviews || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...reviews].sort((a, b) =>
    sortBy === 'rating' ? b.rating - a.rating : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (loading) {
    return (
      <div className="space-y-0 border border-[#1f1f1f]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-[#141414] border-b border-[#1f1f1f] last:border-b-0 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="border border-[#1f1f1f] px-6 py-16 text-center">
        <p className="text-[11px] font-mono text-[#333] tracking-widest">SIN RESEÑAS AÚN</p>
        <p className="text-[9px] font-mono text-[#1f1f1f] mt-2 tracking-wide">
          Busca una película y comparte tu opinión
        </p>
      </div>
    );
  }

  const avgRating = (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1);
  const freshCount = reviews.filter(r => r.is_fresh).length;

  return (
    <div>
      {/* Stats bar */}
      <div className="grid grid-cols-3 border border-[#1f1f1f] mb-0 divide-x divide-[#1f1f1f]">
        <div className="py-3 px-4 text-center">
          <p className="text-xl font-black font-mono text-white">{reviews.length}</p>
          <p className="text-[8px] font-mono text-[#333] tracking-widest mt-0.5">RESEÑAS</p>
        </div>
        <div className="py-3 px-4 text-center">
          <p className="text-xl font-black font-mono text-[#FFE600]">★ {avgRating}</p>
          <p className="text-[8px] font-mono text-[#333] tracking-widest mt-0.5">PROMEDIO</p>
        </div>
        <div className="py-3 px-4 text-center">
          <p className="text-xl font-black font-mono text-green-500">{Math.round((freshCount / reviews.length) * 100)}%</p>
          <p className="text-[8px] font-mono text-[#333] tracking-widest mt-0.5">FRESCAS</p>
        </div>
      </div>

      {/* Sort control */}
      <div className="flex items-center border-x border-b border-[#1f1f1f] px-4 py-2 gap-0 mb-0">
        <span className="text-[8px] font-mono text-[#333] tracking-widest mr-3">ORDENAR:</span>
        {(['date', 'rating'] as const).map(s => (
          <button key={s} onClick={() => setSortBy(s)}
            className={`px-3 py-1 text-[9px] font-black tracking-widest border-b-2 transition-colors -mb-2 mr-1 ${
              sortBy === s ? 'text-[#FFE600] border-[#FFE600]' : 'text-[#333] border-transparent hover:text-[#525252]'
            }`}>
            {s === 'date' ? 'FECHA' : 'CALIFICACIÓN'}
          </button>
        ))}
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[1fr_60px_80px] border-x border-b border-[#1f1f1f] px-4 py-2 gap-2">
        {['TÍTULO', 'NOTA', 'FECHA'].map((h, i) => (
          <span key={h} className={`text-[8px] font-black font-mono tracking-widest text-[#333] ${i > 0 ? 'text-right' : ''}`}>{h}</span>
        ))}
      </div>

      {/* Review rows */}
      <div className="border-x border-b border-[#1f1f1f]">
        {sorted.map((r, idx) => {
          const date = new Date(r.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
          return (
            <Link
              key={r.id}
              href={`/${r.media_type}/${r.tmdb_id}`}
              className="grid grid-cols-[1fr_60px_80px] gap-2 px-4 py-3 border-b border-[#1f1f1f] last:border-b-0 hover:bg-white/[0.02] transition-colors group items-center"
            >
              {/* Title + poster + content */}
              <div className="flex gap-2.5 items-center min-w-0">
                <div className="w-6 h-9 bg-[#141414] border border-[#1f1f1f] shrink-0 overflow-hidden">
                  {r.movie_poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://image.tmdb.org/t/p/w92${r.movie_poster}`}
                      alt={r.movie_title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white truncate group-hover:text-[#FFE600] transition-colors">
                    {r.movie_title}
                  </p>
                  {r.content && (
                    <p className="text-[9px] font-mono text-[#333] truncate mt-0.5 italic">
                      &ldquo;{r.content}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {/* Rating */}
              <p className={`text-right text-[11px] font-black font-mono ${r.is_fresh ? 'text-[#FFE600]' : 'text-[#525252]'}`}>
                {r.rating}/10
              </p>

              {/* Date */}
              <p className="text-right text-[9px] font-mono text-[#333] tracking-widest">{date}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
