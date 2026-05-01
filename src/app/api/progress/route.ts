import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

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
