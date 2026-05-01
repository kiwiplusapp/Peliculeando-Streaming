import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json(null);

  const { searchParams } = req.nextUrl;
  const tmdb_id = searchParams.get('tmdb_id');
  const media_type = searchParams.get('media_type') || 'movie';

  try {
    if (tmdb_id) {
      const [progress] = await query(
        'SELECT * FROM watch_progress WHERE user_id = $1 AND tmdb_id = $2 AND media_type = $3',
        [session.sub, tmdb_id, media_type]
      );
      return NextResponse.json(progress || null);
    }

    // Return all progress for the user (for "continue watching")
    const rows = await query(
      `SELECT wp.*, r.movie_title AS title, r.movie_poster AS poster_path
       FROM watch_progress wp
       LEFT JOIN reviews r ON r.user_id = wp.user_id AND r.tmdb_id = wp.tmdb_id AND r.media_type = wp.media_type
       WHERE wp.user_id = $1
       ORDER BY wp.updated_at DESC LIMIT 20`,
      [session.sub]
    );

    // Also try to get title from watchlist for items without a review
    const withTitles = await query(
      `SELECT wp.*,
              COALESCE(r.movie_title, w.title) AS title,
              COALESCE(r.movie_poster, w.poster_path) AS poster_path
       FROM watch_progress wp
       LEFT JOIN reviews r ON r.user_id = wp.user_id AND r.tmdb_id = wp.tmdb_id AND r.media_type = wp.media_type
       LEFT JOIN watchlist w ON w.user_id = wp.user_id AND w.tmdb_id = wp.tmdb_id AND w.media_type = wp.media_type
       WHERE wp.user_id = $1
         AND (r.movie_title IS NOT NULL OR w.title IS NOT NULL)
       ORDER BY wp.updated_at DESC LIMIT 10`,
      [session.sub]
    );

    return NextResponse.json({ items: withTitles.length ? withTitles : rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { tmdb_id, media_type, season_number, episode_number, progress_seconds } = await req.json();
  try {
    await query(
      `INSERT INTO watch_progress (user_id, tmdb_id, media_type, season_number, episode_number, progress_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, tmdb_id, media_type) DO UPDATE
       SET season_number = $4, episode_number = $5, progress_seconds = $6, updated_at = NOW()`,
      [session.sub, tmdb_id, media_type, season_number || 1, episode_number || 1, progress_seconds || 0]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
