'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Eye, EyeOff, ThumbsUp, ThumbsDown } from 'lucide-react';
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
  helpful_votes: number;
  total_votes: number;
  my_vote: boolean | null;
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

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function ReviewSection({ item, userId }: Props) {
  const [data, setData] = useState<ReviewData>({ reviews: [], total: 0, freshPct: null, avgRating: null, myReview: null });
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedVerdict, setSelectedVerdict] = useState<'fresh' | 'rotten' | null>(null);
  const [content, setContent] = useState('');
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
        setShowForm(true);
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
          tmdb_id: item.tmdb_id, media_type: item.media_type, rating: selectedRating,
          is_fresh: selectedVerdict ? selectedVerdict === 'fresh' : selectedRating >= 6,
          content: content.trim() || null, has_spoilers: hasSpoilers,
          movie_title: item.title, movie_poster: item.poster_path,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        if (res.status === 401) { toast('Inicia sesión para reseñar', 'error'); return; }
        toast(j.error || 'Error', 'error');
        return;
      }
      toast(data.myReview ? 'Reseña actualizada' : 'Reseña publicada');
      await fetchReviews();
    } catch { toast('Error de conexión', 'error'); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/reviews?tmdb_id=${item.tmdb_id}&media_type=${item.media_type}`, { method: 'DELETE' });
      toast('Reseña eliminada');
      setSelectedRating(0); setSelectedVerdict(null); setContent(''); setShowForm(false);
      await fetchReviews();
    } catch { toast('Error', 'error'); }
  };

  const { reviews, total, freshPct, avgRating, myReview } = data;

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-[#141414] border border-[#1f1f1f] animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      {/* ── SECTION HEADER ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black font-mono text-[#FFE600] tracking-widest">—</span>
          <h2 className="text-[11px] font-black tracking-widest text-white uppercase"
            style={{ fontFamily: 'Space Grotesk' }}>
            RESEÑAS DE LA COMUNIDAD
          </h2>
          {total > 0 && (
            <span className="text-[9px] font-mono text-[#333] tracking-widest">· {total}</span>
          )}
        </div>
        {total > 0 && freshPct !== null && (
          <div className="flex items-center gap-3">
            <span className={`text-[9px] font-black font-mono tracking-widest ${freshPct >= 60 ? 'text-green-500' : 'text-red-500'}`}>
              {freshPct}% FRESCO
            </span>
            {avgRating && (
              <span className="text-[9px] font-mono text-[#525252] tracking-widest">★ {avgRating}/10 PROM.</span>
            )}
          </div>
        )}
      </div>

      {/* ── REVIEW FORM ── */}
      {userId ? (
        <div className="border border-[#1f1f1f] mb-4" style={{ background: '#0D0D0D' }}>
          {/* Form toggle header */}
          <button
            onClick={() => setShowForm(s => !s)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
          >
            <span className="text-[10px] font-black tracking-widest text-white"
              style={{ fontFamily: 'Space Grotesk' }}>
              {myReview ? '✓ TU RESEÑA' : '+ ESCRIBIR RESEÑA'}
            </span>
            {myReview && (
              <span className="text-[10px] font-mono text-[#FFE600]">★ {myReview.rating}/10</span>
            )}
          </button>

          {showForm && (
            <div className="border-t border-[#1f1f1f] px-4 py-4 space-y-4">
              {/* RATING: 10 boxes */}
              <div>
                <p className="text-[8px] font-mono text-[#333] tracking-widest mb-2">CALIFICACIÓN</p>
                <div className="flex gap-1">
                  {RATINGS.map(n => (
                    <button key={n} onClick={() => { setSelectedRating(n); if (!selectedVerdict) setSelectedVerdict(n >= 6 ? 'fresh' : 'rotten'); }}
                      className={`w-8 h-8 text-[10px] font-black font-mono border transition-all ${
                        n <= selectedRating
                          ? 'bg-[#FFE600] border-[#FFE600] text-black'
                          : 'border-[#2a2a2a] text-[#333] hover:border-[#FFE600]/40 hover:text-[#525252]'
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* VERDICT */}
              <div className="flex gap-2">
                <button onClick={() => setSelectedVerdict('fresh')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black tracking-widest border transition-colors ${
                    selectedVerdict === 'fresh'
                      ? 'bg-green-500/10 border-green-500 text-green-400'
                      : 'border-[#2a2a2a] text-[#333] hover:border-green-500/40 hover:text-[#525252]'
                  }`}>
                  <ThumbsUp size={11} /> FRESCO
                </button>
                <button onClick={() => setSelectedVerdict('rotten')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-black tracking-widest border transition-colors ${
                    selectedVerdict === 'rotten'
                      ? 'bg-red-500/10 border-red-500 text-red-400'
                      : 'border-[#2a2a2a] text-[#333] hover:border-red-500/40 hover:text-[#525252]'
                  }`}>
                  <ThumbsDown size={11} /> PODRIDO
                </button>
              </div>

              {/* TEXT */}
              <div>
                <p className="text-[8px] font-mono text-[#333] tracking-widest mb-2">TEXTO (OPCIONAL)</p>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="¿Qué te pareció?"
                  rows={3}
                  className="w-full bg-[#111] border border-[#2a2a2a] px-3 py-2.5 text-sm text-white placeholder:text-[#333] resize-none focus:outline-none focus:border-[#FFE600]/30 transition-colors font-mono text-[12px]"
                />
              </div>

              {/* SPOILER */}
              <label className="flex items-center gap-2 text-[9px] font-mono text-[#525252] cursor-pointer tracking-widest w-fit">
                <input type="checkbox" checked={hasSpoilers} onChange={e => setHasSpoilers(e.target.checked)} className="accent-[#FFE600]" />
                <AlertTriangle size={11} />
                CONTIENE SPOILERS
              </label>

              {/* ACTIONS */}
              <div className="flex gap-2">
                <button onClick={handleSubmit} disabled={submitting}
                  className="px-4 py-2 text-[10px] font-black tracking-widest text-black bg-[#FFE600] hover:opacity-90 disabled:opacity-50 transition-opacity"
                  style={{ fontFamily: 'Space Grotesk' }}>
                  {submitting ? 'GUARDANDO...' : myReview ? 'ACTUALIZAR' : 'PUBLICAR'}
                </button>
                {myReview && (
                  <button onClick={handleDelete}
                    className="px-4 py-2 text-[10px] font-semibold tracking-widest text-red-500 border border-[#2a2a2a] hover:border-red-500/40 transition-colors">
                    ELIMINAR
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-[#1f1f1f] px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-[10px] font-mono text-[#333] tracking-widest">INICIA SESIÓN PARA RESEÑAR</p>
          <span className="text-[9px] font-mono text-[#1f1f1f]">→</span>
        </div>
      )}

      {/* ── REVIEWS LIST ── */}
      <div className="space-y-0 border border-[#1f1f1f]">
        {reviews.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-[10px] font-mono text-[#333] tracking-widest">SIN RESEÑAS AÚN</p>
            <p className="text-[9px] font-mono text-[#1f1f1f] mt-1">Sé el primero en opinar</p>
          </div>
        ) : (
          reviews.map((r, idx) => (
            <ReviewCard key={r.id} review={r} userId={userId} isLast={idx === reviews.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review: r, userId, isLast }: { review: Review; userId?: string; isLast: boolean }) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [helpfulVotes, setHelpfulVotes] = useState(r.helpful_votes || 0);
  const [totalVotes, setTotalVotes] = useState(r.total_votes || 0);
  const [myVote, setMyVote] = useState<boolean | null>(r.my_vote ?? null);
  const [voting, setVoting] = useState(false);

  const date = new Date(r.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }).toUpperCase();
  const initial = (r.username || '?').slice(0, 2).toUpperCase();
  const isOwn = userId && String(r.user_id) === userId;

  const vote = async (isHelpful: boolean) => {
    if (!userId || isOwn || voting) return;
    setVoting(true);
    try {
      if (myVote === isHelpful) {
        await fetch(`/api/reviews/vote?review_id=${r.id}`, { method: 'DELETE' });
        setMyVote(null);
        setHelpfulVotes(h => isHelpful ? h - 1 : h);
        setTotalVotes(t => t - 1);
      } else {
        const res = await fetch('/api/reviews/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ review_id: r.id, is_helpful: isHelpful }),
        });
        const d = await res.json();
        setMyVote(isHelpful);
        setHelpfulVotes(d.helpful);
        setTotalVotes(d.total);
      }
    } finally { setVoting(false); }
  };

  return (
    <div className={`px-4 py-4 ${!isLast ? 'border-b border-[#1f1f1f]' : ''} hover:bg-white/[0.01] transition-colors`}>
      {/* Top row: avatar + name + rating + date */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black text-black shrink-0"
            style={{ background: r.avatar_color || '#FFE600' }}>
            {initial}
          </div>
          <div>
            <p className="text-[11px] font-bold text-white">{r.username}</p>
            <p className="text-[8px] font-mono text-[#333] tracking-widest">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[9px] font-black font-mono tracking-widest ${r.is_fresh ? 'text-green-500' : 'text-red-500'}`}>
            {r.is_fresh ? '▲ FRESCO' : '▼ PODRIDO'}
          </span>
          <span className="text-[11px] font-black font-mono text-[#FFE600]">★ {r.rating}/10</span>
        </div>
      </div>

      {/* Content */}
      {r.content && (
        r.has_spoilers && !spoilerRevealed ? (
          <div className="border border-[#FFE600]/20 px-3 py-2.5 flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[9px] font-mono text-[#FFE600] tracking-widest">
              <AlertTriangle size={11} />
              CONTIENE SPOILERS
            </div>
            <button onClick={() => setSpoilerRevealed(true)}
              className="flex items-center gap-1.5 text-[9px] font-mono text-[#525252] hover:text-white tracking-widest transition-colors">
              <Eye size={11} /> VER
            </button>
          </div>
        ) : (
          <div className="mb-2">
            <p className="text-sm text-[#A3A3A3] leading-relaxed">
              &ldquo;{r.content}&rdquo;
            </p>
            {r.has_spoilers && (
              <button onClick={() => setSpoilerRevealed(false)}
                className="mt-1 flex items-center gap-1 text-[8px] font-mono text-[#333] hover:text-[#525252] tracking-widest transition-colors">
                <EyeOff size={10} /> OCULTAR SPOILER
              </button>
            )}
          </div>
        )
      )}

      {/* Helpful votes */}
      {!isOwn && (
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-[#161616]">
          <span className="text-[8px] font-mono text-[#333] tracking-widest">¿ÚTIL?</span>
          <button onClick={() => vote(true)} disabled={!userId || voting}
            className={`flex items-center gap-1 text-[9px] font-mono px-2 py-1 border transition-colors ${
              myVote === true ? 'border-green-500/40 text-green-500' : 'border-[#2a2a2a] text-[#333] hover:text-white hover:border-[#333]'
            } disabled:opacity-30`}>
            <ThumbsUp size={9} /> {helpfulVotes}
          </button>
          <button onClick={() => vote(false)} disabled={!userId || voting}
            className={`flex items-center gap-1 text-[9px] font-mono px-2 py-1 border transition-colors ${
              myVote === false ? 'border-red-500/40 text-red-500' : 'border-[#2a2a2a] text-[#333] hover:text-white hover:border-[#333]'
            } disabled:opacity-30`}>
            <ThumbsDown size={9} /> {totalVotes - helpfulVotes}
          </button>
          {totalVotes > 0 && (
            <span className="text-[8px] font-mono text-[#333] tracking-widest">
              {Math.round((helpfulVotes / totalVotes) * 100)}% ÚTIL
            </span>
          )}
        </div>
      )}
    </div>
  );
}
