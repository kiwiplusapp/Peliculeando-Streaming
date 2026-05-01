'use client';

import { useEffect, useState } from 'react';
import { Trophy, Star, ThumbsUp } from 'lucide-react';

interface Reviewer {
  user_id: number;
  username: string;
  avatar_color: string;
  review_count: number;
  avg_rating: string;
  helpful_votes: number;
  karma: number;
}

const medals = ['🥇', '🥈', '🥉'];

export function LeaderboardContent() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => setReviewers(d.reviewers || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (reviewers.length === 0) {
    return (
      <div className="text-center py-12 text-[#525252]">
        <Trophy size={40} className="mx-auto mb-3 opacity-30" />
        <p>Aún no hay críticos activos</p>
        <p className="text-xs mt-1">¡Sé el primero en escribir una reseña!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {reviewers.map((r, i) => (
        <div
          key={r.user_id}
          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
            i < 3
              ? 'bg-amber-500/5 border-amber-500/20'
              : 'bg-[#111111] border-[#262626] hover:border-[#333333]'
          }`}
        >
          {/* Rank */}
          <div className="w-7 text-center shrink-0">
            {i < 3 ? (
              <span className="text-lg">{medals[i]}</span>
            ) : (
              <span className="text-sm font-bold text-[#525252]">#{i + 1}</span>
            )}
          </div>

          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ background: r.avatar_color || '#f59e0b' }}
          >
            {r.username[0].toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white text-sm truncate">{r.username}</p>
            <div className="flex items-center gap-3 text-xs text-[#525252]">
              <span>{r.review_count} reseñas</span>
              <span className="flex items-center gap-1">
                <Star size={10} className="text-amber-400" />
                {r.avg_rating}
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp size={10} className="text-emerald-400" />
                {r.helpful_votes}
              </span>
            </div>
          </div>

          {/* Karma */}
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-amber-400">{Number(r.karma).toLocaleString()}</p>
            <p className="text-xs text-[#525252]">karma</p>
          </div>
        </div>
      ))}
    </div>
  );
}
