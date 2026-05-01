import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Combine review activity + watchlist adds in the last 7 days
    const rows = await query<{
      tmdb_id: number;
      media_type: string;
      title: string;
      poster_path: string | null;
      activity_score: number;
      review_count: number;
      watchlist_count: number;
    }>(`
      SELECT
        tmdb_id, media_type,
        COALESCE(r.title, w.title) AS title,
        COALESCE(r.poster, w.poster_path) AS poster_path,
        (COALESCE(r.cnt, 0) * 3 + COALESCE(w.cnt, 0)) AS activity_score,
        COALESCE(r.cnt, 0) AS review_count,
        COALESCE(w.cnt, 0) AS watchlist_count
      FROM (
        SELECT tmdb_id, media_type,
               MIN(movie_title) AS title,
               MIN(movie_poster) AS poster,
               COUNT(*) AS cnt
        FROM reviews
        WHERE created_at >= NOW() - INTERVAL '7 days'
          AND movie_title IS NOT NULL
        GROUP BY tmdb_id, media_type
      ) r
      FULL OUTER JOIN (
        SELECT tmdb_id, media_type,
               MIN(title) AS title,
               MIN(poster_path) AS poster_path,
               COUNT(*) AS cnt
        FROM watchlist
        WHERE added_at >= NOW() - INTERVAL '7 days'
          AND title IS NOT NULL
        GROUP BY tmdb_id, media_type
      ) w USING (tmdb_id, media_type)
      ORDER BY activity_score DESC
      LIMIT 20
    `);

    return NextResponse.json({ items: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ items: [] });
  }
}
