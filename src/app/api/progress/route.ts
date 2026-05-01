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

    // Return all progress for the user (Continue Watching)
    const rows = await query(
      `SELECT * FROM watch_progress
       WHERE user_id = $1 AND title IS NOT NULL
       ORDER BY updated_at DESC LIMIT 20`,
      [session.sub]
    );

    return NextResponse.json({ items: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { tmdb_id, media_type, season_number, episode_number, progress_seconds, title, poster_path } = await req.json();
  try {
    await query(
      `INSERT INTO watch_progress (user_id, tmdb_id, media_type, season_number, episode_number, progress_seconds, title, poster_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id, tmdb_id, media_type) DO UPDATE
       SET season_number = $4, episode_number = $5, progress_seconds = $6,
           title = COALESCE($7, watch_progress.title),
           poster_path = COALESCE($8, watch_progress.poster_path),
           updated_at = NOW()`,
      [session.sub, tmdb_id, media_type, season_number || 1, episode_number || 1, progress_seconds || 0, title || null, poster_path || null]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
