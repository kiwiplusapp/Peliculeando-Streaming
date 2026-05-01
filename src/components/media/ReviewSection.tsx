'use client';

import { useState, useEffect } from 'react';
import { Star, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/Toaster';

interface Review {
  id: number;
  user_id: number;
  username: string;
  avatar_color: string;
  rating: number;
  is_fresh: boolean;
  content: string | null;
  has_spoilers: boolean;
  created_at: string;
}

interface ReviewData {
  reviews: Review[];
  total: number;
  freshPct: number | null;
  avgRating: string | null;
  myReview: Review | null;
}

interface Props {
  item: {
    tmdb_id: number;
    media_type: 'movie' | 'tv';
    title: string;
    poster_path?: string | null;
  };
  userId?: string;
}

export function ReviewSection({ item, userId }: Props) {
  const [data, setData] = useState<ReviewData>({ reviews: [], total: 0, freshPct: null, avgRating: null, myReview: null });
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedVerdict, setSelectedVerdict] = useState<'fresh' | 'rotten' | null>(null);
  const [content, setContent] = useState('');
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const r = await fetch(`/api/reviews?tmdb_id=${item.tmdb_id}&media_type=${item.media_type}`);
      const d = await r.json();
      setData(d);
      if (d.myReview) {
        setSelectedRating(d.myReview.rating);
        setSelectedVerdict(d.myReview.is_fresh ? 'fresh' : 'rotten');
        setContent(d.myReview.content || '');
        setHasSpoilers(d.myReview.has_spoilers || false);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchReviews(); }, [item.tmdb_id]);

  const handleSubmit = async () => {
    if (!selectedRating) { toast('Selecciona una calificación', 'error'); return; }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdb_id: item.tmdb_id,
          media_type: item.media_type,
          rating: selectedRating,
          is_fresh: selectedVerdict ? selectedVerdict === 'fresh' : selectedRating >= 6,
          content: content.trim() || null,
          has_spoilers: hasSpoilers,
          movie_title: item.title,
          movie_poster: item.poster_path,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        if (res.status === 401) { toast('Inicia sesión para reseñar', 'error'); return; }
        toast(j.error || 'Error', 'error');
        return;
      }
      toast(data.myReview ? 'Reseña actualizada ✓' : 'Reseña publicada ✓');
      await fetchReviews();
    } catch { toast('Error de conexión', 'error'); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/reviews?tmdb_id=${item.tmdb_id}&media_type=${item.media_type}`, { method: 'DELETE' });
      toast('Reseña eliminada');
      setSelectedRating(0); setSelectedVerdict(null); setContent('');
      await fetchReviews();
    } catch { toast('Error', 'error'); }
  };

  const { reviews, total, freshPct, avgRating, myReview } = data;
  const isFresh = freshPct !== null && freshPct >= 60;

  if (loading) return <div className="skeleton h-32 rounded-xl" />;

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
        <span className="text-2xl">{isFresh ? '🍅' : total > 0 ? '💀' : '🎬'}</span>
        Reseñas de la comunidad
        {total > 0 && (
          <span className="text-sm font-normal text-[#A3A3A3]">
            — {total} reseña{total !== 1 ? 's' : ''} · {freshPct}% fresco · {avgRating}/10 promedio
          </span>
        )}
      </h2>

      {/* Review form */}
      {userId ? (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-5 mb-6">
          <p className="text-sm font-medium text-white mb-4">{myReview ? 'Tu reseña' : 'Escribe tu reseña'}</p>

          {/* Stars */}
          <div className="flex gap-1 mb-4">
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button
                key={n}
                onClick={() => {
                  setSelectedRating(n);
                  if (!selectedVerdict) setSelectedVerdict(n >= 6 ? 'fresh' : 'rotten');
                }}
                className={`text-lg transition-transform hover:scale-110 ${n <= selectedRating ? 'opacity-100' : 'opacity-25 hover:opacity-60'}`}
              >
                ⭐
              </button>
            ))}
            {selectedRating > 0 && (
              <span className="ml-2 text-sm text-[#A3A3A3] self-center">{selectedRating}/10</span>
            )}
          </div>

          {/* Verdict */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setSelectedVerdict('fresh')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                selectedVerdict === 'fresh'
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-[#181818] border-[#262626] text-[#A3A3A3] hover:border-emerald-500/50'
              }`}
            >
              🍅 FRESCO
            </button>
            <button
              onClick={() => setSelectedVerdict('rotten')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                selectedVerdict === 'rotten'
                  ? 'bg-red-500/10 border-red-500 text-red-400'
                  : 'bg-[#181818] border-[#262626] text-[#A3A3A3] hover:border-red-500/50'
              }`}
            >
              💀 PODRIDO
            </button>
          </div>

          {/* Text */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="¿Qué te pareció? (opcional)"
            rows={3}
            className="w-full bg-[#181818] border border-[#262626] rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-[#525252] resize-none focus:outline-none focus:border-amber-500 transition-colors mb-3"
          />

          {/* Spoiler toggle */}
          <label className="flex items-center gap-2 text-sm text-[#A3A3A3] cursor-pointer mb-4 w-fit">
            <input
              type="checkbox"
              checked={hasSpoilers}
              onChange={e => setHasSpoilers(e.target.checked)}
              className="accent-amber-500"
            />
            <AlertTriangle size={14} />
            Contiene spoilers
          </label>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-brand text-black font-bold text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Guardando...' : myReview ? 'Actualizar' : 'Publicar'}
            </button>
            {myReview && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-[#181818] text-red-400 text-sm font-medium rounded-lg border border-[#262626] hover:border-red-500/50 transition-colors"
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#262626] rounded-xl p-5 mb-6 text-center">
          <p className="text-sm text-[#A3A3A3]">
            Inicia sesión para dejar tu reseña
          </p>
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-[#525252]">
            <p className="text-3xl mb-2">🎬</p>
            <p>Sin reseñas aún. ¡Sé el primero!</p>
          </div>
        ) : (
          reviews.map(r => <ReviewCard key={r.id} review={r} />)
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review: r }: { review: Review }) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const date = new Date(r.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  const initial = (r.username || '?')[0].toUpperCase();

  return (
    <div className="bg-[#111111] border border-[#262626] rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: r.avatar_color || '#f59e0b' }}
          >
            {initial}
          </div>
          <div>
            <p className="font-medium text-white text-sm">{r.username}</p>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={11} className={i <= Math.round(r.rating / 2) ? 'text-amber-400' : 'text-[#333333]'} fill={i <= Math.round(r.rating / 2) ? '#fbbf24' : '#333333'} />
                ))}
              </div>
              <span className="text-xs text-[#525252]">{r.rating}/10 · {date}</span>
            </div>
          </div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.is_fresh ? 'badge-fresh' : 'badge-rotten'}`}>
          {r.is_fresh ? '🍅 FRESCO' : '💀 PODRIDO'}
        </span>
      </div>

      {r.content && (
        r.has_spoilers && !spoilerRevealed ? (
          <div className="bg-[#181818] border border-amber-500/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <AlertTriangle size={14} />
              Esta reseña contiene spoilers
            </div>
            <button
              onClick={() => setSpoilerRevealed(true)}
              className="flex items-center gap-1.5 text-xs text-[#A3A3A3] hover:text-white"
            >
              <Eye size={13} /> Ver igualmente
            </button>
          </div>
        ) : (
          <div className="relative">
            <p className="text-[#A3A3A3] text-sm leading-relaxed">{r.content}</p>
            {r.has_spoilers && (
              <button onClick={() => setSpoilerRevealed(false)} className="mt-1 flex items-center gap-1 text-xs text-[#525252] hover:text-[#A3A3A3]">
                <EyeOff size={11} /> Ocultar spoiler
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
