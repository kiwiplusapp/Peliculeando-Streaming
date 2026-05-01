import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const idsOnly = req.nextUrl.searchParams.get('ids') === '1';
  try {
    if (idsOnly) {
      const rows = await query<{ tmdb_id: number; media_type: string }>(
        'SELECT tmdb_id, media_type FROM watchlist WHERE user_id = $1',
        [session.sub]
      );
      return NextResponse.json({ ids: rows });
    }
    const rows = await query(
      'SELECT * FROM watchlist WHERE user_id = $1 ORDER BY added_at DESC',
      [session.sub]
    );
    return NextResponse.json({ items: rows });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { tmdb_id, media_type = 'movie', title, poster_path } = await req.json();
  try {
    await query(
      `INSERT INTO watchlist (user_id, tmdb_id, media_type, title, poster_path)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, tmdb_id, media_type) DO NOTHING`,
      [session.sub, tmdb_id, media_type, title, poster_path]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { tmdb_id, media_type = 'movie' } = await req.json();
  try {
    await query(
      'DELETE FROM watchlist WHERE user_id = $1 AND tmdb_id = $2 AND media_type = $3',
      [session.sub, tmdb_id, media_type]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
