import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { ProfileContent } from '@/components/layout/ProfileContent';

export const metadata = { title: 'Mi perfil — Peliculeando' };

export default async function PerfilPage() {
  const session = await getSession();
  if (!session) redirect('/');

  const userId = Number(session.sub);

  const [user] = await query<{
    id: number; username: string; email: string;
    avatar_color: string; bio: string | null; created_at: string;
    xp_total: number; level: number;
  }>(
    'SELECT id, username, email, avatar_color, bio, created_at, COALESCE(xp_total,0) AS xp_total, COALESCE(level,0) AS level FROM users WHERE id = $1',
    [userId]
  );

  const [{ count: reviewCount }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM reviews WHERE user_id = $1', [userId]
  );
  const [{ count: watchlistCount }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM watchlist WHERE user_id = $1', [userId]
  );
  const [{ count: collectionCount }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM collections WHERE user_id = $1', [userId]
  );
  const [{ count: watchedCount }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM watch_progress WHERE user_id = $1', [userId]
  );

  const genreStats = await query<{ genre_name: string; watch_count: number; total_rating: number }>(
    `SELECT genre_name, watch_count, total_rating
     FROM user_genre_stats WHERE user_id = $1
     ORDER BY watch_count DESC LIMIT 5`,
    [userId]
  );

  const [karmaRow] = await query<{ karma: number; helpful_votes: number }>(
    `SELECT
       (COUNT(DISTINCT r.id) * 10
        + COALESCE(SUM(rv.helpful_count), 0) * 3
        + COUNT(DISTINCT mt.id)) AS karma,
       COALESCE(SUM(rv.helpful_count), 0) AS helpful_votes
     FROM users u
     LEFT JOIN reviews r ON r.user_id = u.id
     LEFT JOIN (
       SELECT review_id, COUNT(*) FILTER (WHERE is_helpful) AS helpful_count
       FROM review_votes GROUP BY review_id
     ) rv ON rv.review_id = r.id
     LEFT JOIN media_tags mt ON mt.user_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId]
  ).catch(() => [{ karma: 0, helpful_votes: 0 }]);

  const recentXP = await query<{ action: string; xp_gained: number; created_at: string }>(
    `SELECT action, xp_gained, created_at FROM user_xp_events
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`,
    [userId]
  ).catch(() => []);

  // Recent reviews with poster and helpful votes
  const recentReviews = await query<{
    id: number; tmdb_id: number; media_type: string;
    movie_title: string; movie_poster: string | null;
    rating: number; content: string | null;
    helpful_votes: number; created_at: string;
  }>(
    `SELECT r.id, r.tmdb_id, r.media_type, r.movie_title, r.movie_poster, r.rating, r.content, r.created_at,
            COALESCE(helpful.cnt, 0) AS helpful_votes
     FROM reviews r
     LEFT JOIN (
       SELECT review_id, COUNT(*) FILTER (WHERE is_helpful) AS cnt
       FROM review_votes GROUP BY review_id
     ) helpful ON helpful.review_id = r.id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC LIMIT 4`,
    [userId]
  ).catch(() => []);

  // Rank on leaderboard
  const [rankRow] = await query<{ rank: number }>(
    `SELECT rank FROM (
       SELECT u.id, RANK() OVER (ORDER BY (COUNT(DISTINCT r.id)*10 + COALESCE(SUM(rv.h),0)*3) DESC) AS rank
       FROM users u
       LEFT JOIN reviews r ON r.user_id = u.id
       LEFT JOIN (
         SELECT review_id, COUNT(*) FILTER (WHERE is_helpful) AS h
         FROM review_votes GROUP BY review_id
       ) rv ON rv.review_id = r.id
       GROUP BY u.id HAVING COUNT(DISTINCT r.id) > 0
     ) ranked WHERE id = $1`,
    [userId]
  ).catch(() => [{ rank: 0 }]);

  const xp = Number(user?.xp_total || 0);
  const karma = Number(karmaRow?.karma || 0);

  return (
    <ProfileContent
      user={user}
      stats={{
        reviews: Number(reviewCount),
        watchlist: Number(watchlistCount),
        collections: Number(collectionCount),
        watched: Number(watchedCount),
      }}
      genreStats={genreStats}
      karma={karma}
      helpfulVotes={Number(karmaRow?.helpful_votes || 0)}
      xp={xp}
      recentXP={recentXP}
      recentReviews={recentReviews}
      rank={rankRow?.rank ? Number(rankRow.rank) : undefined}
      streak={0}
      followers={0}
    />
  );
}
