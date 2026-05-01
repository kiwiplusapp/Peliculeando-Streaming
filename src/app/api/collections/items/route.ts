import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { collection_id, tmdb_id, media_type, title, poster_path, note } = await req.json();

  try {
    // Verify ownership
    const [col] = await query<{ user_id: number }>(
      'SELECT user_id FROM collections WHERE id = $1',
      [collection_id]
    );
    if (!col || String(col.user_id) !== session.sub) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await query(
      `INSERT INTO collection_items (collection_id, tmdb_id, media_type, title, poster_path, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (collection_id, tmdb_id, media_type) DO UPDATE SET note = $6`,
      [collection_id, tmdb_id, media_type, title, poster_path, note || null]
    );

    // Update collection updated_at and cover
    await query(
      `UPDATE collections SET updated_at = NOW(),
       cover_poster = COALESCE(cover_poster, $2)
       WHERE id = $1`,
      [collection_id, poster_path]
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { collection_id, tmdb_id, media_type } = await req.json();

  try {
    const [col] = await query<{ user_id: number }>(
      'SELECT user_id FROM collections WHERE id = $1',
      [collection_id]
    );
    if (!col || String(col.user_id) !== session.sub) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    await query(
      'DELETE FROM collection_items WHERE collection_id = $1 AND tmdb_id = $2 AND media_type = $3',
      [collection_id, tmdb_id, media_type]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
