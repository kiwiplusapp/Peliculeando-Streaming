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

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-2xl mx-auto px-6">
        <ProfileContent
          user={user}
          stats={{ reviews: Number(reviewCount), watchlist: Number(watchlistCount), collections: Number(collectionCount) }}
          genreStats={genreStats}
        />
      </div>
    </div>
  );
}
