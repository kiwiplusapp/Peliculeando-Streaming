import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const full = req.nextUrl.searchParams.get('full') === '1';

  try {
    const reviewers = await query<{
      user_id: number;
      username: string;
      avatar_color: string;
      review_count: number;
      avg_rating: string;
      helpful_votes: number;
      karma: number;
      xp_total: number;
      watchlist_count: number;
    }>(`
      SELECT
        u.id                                                         AS user_id,
        u.username,
        u.avatar_color,
        COUNT(DISTINCT r.id)                                         AS review_count,
        ROUND(AVG(r.rating), 1)                                      AS avg_rating,
        COALESCE(SUM(rv.helpful_count), 0)                           AS helpful_votes,
        (COUNT(DISTINCT r.id) * 10
          + COALESCE(SUM(rv.helpful_count), 0) * 3
          + COUNT(DISTINCT mt.id))                                   AS karma,
        -- XP: reviews*50 + helpful*20 + watchlist*5 + tags*2
        (COUNT(DISTINCT r.id) * 50
          + COALESCE(SUM(rv.helpful_count), 0) * 20
          + COALESCE(wl.watchlist_count, 0) * 5
          + COUNT(DISTINCT mt.id) * 2)                              AS xp_total,
        COALESCE(wl.watchlist_count, 0)                              AS watchlist_count
      FROM users u
      LEFT JOIN reviews r ON r.user_id = u.id
      LEFT JOIN (
        SELECT review_id, COUNT(*) FILTER (WHERE is_helpful) AS helpful_count
        FROM review_votes GROUP BY review_id
      ) rv ON rv.review_id = r.id
      LEFT JOIN media_tags mt ON mt.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS watchlist_count
        FROM watchlist GROUP BY user_id
      ) wl ON wl.user_id = u.id
      GROUP BY u.id, u.username, u.avatar_color, wl.watchlist_count
      HAVING COUNT(DISTINCT r.id) > 0
      ORDER BY karma DESC
      LIMIT ${full ? 100 : 20}
    `);

    // Attach a simple trend indicator (static for now — future: compare to last week snapshot)
    const withTrend = reviewers.map((r, idx) => ({
      ...r,
      trend: (idx < 3 ? 'up' : idx % 5 === 0 ? 'down' : 'same') as 'up' | 'down' | 'same',
    }));

    return NextResponse.json({ reviewers: withTrend });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ reviewers: [] });
  }
}
