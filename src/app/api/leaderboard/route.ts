import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const reviewers = await query<{
      user_id: number;
      username: string;
      avatar_color: string;
      review_count: number;
      avg_rating: string;
      helpful_votes: number;
      karma: number;
    }>(`
      SELECT
        u.id AS user_id,
        u.username,
        u.avatar_color,
        COUNT(DISTINCT r.id) AS review_count,
        ROUND(AVG(r.rating), 1) AS avg_rating,
        COALESCE(SUM(rv.helpful_count), 0) AS helpful_votes,
        (COUNT(DISTINCT r.id) * 10
          + COALESCE(SUM(rv.helpful_count), 0) * 3
          + COUNT(DISTINCT mt.id)) AS karma
      FROM users u
      LEFT JOIN reviews r ON r.user_id = u.id
      LEFT JOIN (
        SELECT review_id, COUNT(*) FILTER (WHERE is_helpful) AS helpful_count
        FROM review_votes GROUP BY review_id
      ) rv ON rv.review_id = r.id
      LEFT JOIN media_tags mt ON mt.user_id = u.id
      GROUP BY u.id, u.username, u.avatar_color
      HAVING COUNT(DISTINCT r.id) > 0
      ORDER BY karma DESC
      LIMIT 20
    `);

    return NextResponse.json({ reviewers });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ reviewers: [] });
  }
}
