import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { ProfileContent } from '@/components/layout/ProfileContent';

export const metadata = { title: 'Mi perfil — Peliculeando' };

export default async function PerfilPage() {
  const session = await getSession();
  if (!session) redirect('/');

  const [user] = await query<{
    id: number; username: string; email: string;
    avatar_color: string; bio: string | null; created_at: string;
  }>(
    'SELECT id, username, email, avatar_color, bio, created_at FROM users WHERE id = $1',
    [session.sub]
  );

  const [{ count: reviewCount }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM reviews WHERE user_id = $1',
    [session.sub]
  );
  const [{ count: watchlistCount }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM watchlist WHERE user_id = $1',
    [session.sub]
  );
  const [{ count: collectionCount }] = await query<{ count: string }>(
    'SELECT COUNT(*) as count FROM collections WHERE user_id = $1',
    [session.sub]
  );

  const genreStats = await query<{ genre_name: string; watch_count: number; total_rating: number }>(
    `SELECT genre_name, watch_count, total_rating
     FROM user_genre_stats WHERE user_id = $1
     ORDER BY watch_count DESC LIMIT 5`,
    [session.sub]
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
    [session.sub]
  ).catch(() => [{ karma: 0, helpful_votes: 0 }]);

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-6">
        <ProfileContent
          user={user}
          stats={{ reviews: Number(reviewCount), watchlist: Number(watchlistCount), collections: Number(collectionCount) }}
          genreStats={genreStats}
          karma={Number(karmaRow?.karma || 0)}
          helpfulVotes={Number(karmaRow?.helpful_votes || 0)}
        />
      </div>
    </div>
  );
}
