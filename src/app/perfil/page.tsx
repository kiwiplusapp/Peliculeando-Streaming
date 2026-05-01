import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { ProfileContent } from '@/components/layout/ProfileContent';
import { getLevelForXP } from '@/lib/xp';

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
    'SELECT COUNT(*) as count FROM reviews WHERE user_id = $1',
    [userId]
  );
  const [{ count: watchlistCount }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM watchlist WHERE user_id = $1',
    [userId]
  );
  const [{ count: collectionCount }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM collections WHERE user_id = $1',
    [userId]
  );
  const [{ count: watchedCount }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM watch_progress WHERE user_id = $1',
    [userId]
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

  // Recent XP events (last 5)
  const recentXP = await query<{ action: string; xp_gained: number; created_at: string }>(
    `SELECT action, xp_gained, created_at FROM user_xp_events
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5`,
    [userId]
  ).catch(() => []);

  const xp = Number(user?.xp_total || 0);
  const levelData = getLevelForXP(xp);

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-2xl mx-auto px-6">
        <ProfileContent
          user={user}
          stats={{
            reviews: Number(reviewCount),
            watchlist: Number(watchlistCount),
            collections: Number(collectionCount),
            watched: Number(watchedCount),
          }}
          genreStats={genreStats}
          karma={Number(karmaRow?.karma || 0)}
          helpfulVotes={Number(karmaRow?.helpful_votes || 0)}
          xp={xp}
          recentXP={recentXP}
        />
      </div>
    </div>
  );
}
