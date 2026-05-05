import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const isAdmin = await getAdminSessionFromRequest(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [
    usersRow,
    reviewsRow,
    watchlistRow,
    subsRow,
    xpRow,
    newUsersRow,
    topUsersRows,
    recentReviewsRows,
  ] = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*) FROM users'),
    query<{ count: string }>('SELECT COUNT(*) FROM reviews'),
    query<{ count: string }>('SELECT COUNT(*) FROM watchlist'),
    query<{ count: string }>("SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND expires_at > NOW()"),
    query<{ total: string }>('SELECT COALESCE(SUM(xp_gained), 0) AS total FROM user_xp_events'),
    query<{ count: string }>("SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '7 days'"),
    query<{ id: number; username: string; xp_total: number; level: number }>(
      'SELECT id, username, xp_total, level FROM users ORDER BY xp_total DESC LIMIT 5'
    ),
    query<{ id: number; content: string; rating: number; username: string; movie_title: string; created_at: string }>(
      `SELECT r.id, r.content, r.rating, u.username, r.movie_title, r.created_at
       FROM reviews r JOIN users u ON u.id = r.user_id
       ORDER BY r.created_at DESC LIMIT 5`
    ),
  ]);

  return NextResponse.json({
    users: Number(usersRow[0]?.count ?? 0),
    reviews: Number(reviewsRow[0]?.count ?? 0),
    watchlist: Number(watchlistRow[0]?.count ?? 0),
    activeSubscriptions: Number(subsRow[0]?.count ?? 0),
    totalXP: Number(xpRow[0]?.total ?? 0),
    newUsersThisWeek: Number(newUsersRow[0]?.count ?? 0),
    topUsers: topUsersRows,
    recentReviews: recentReviewsRows,
  });
}
