import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get('user_id');
  const publicOnly = searchParams.get('public') === '1';
  const collectionId = searchParams.get('id');

  try {
    if (collectionId) {
      // Get single collection with items
      const [collection] = await query<Record<string, unknown>>(
        `SELECT c.*, u.username, u.avatar_color,
                (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) as item_count,
                (SELECT COUNT(*) FROM collection_follows WHERE collection_id = c.id) as follower_count
         FROM collections c JOIN users u ON c.user_id = u.id
         WHERE c.id = $1`,
        [collectionId]
      );
      if (!collection) return NextResponse.json({ error: 'No encontrado' }, { status: 404 });

      const items = await query(
        'SELECT * FROM collection_items WHERE collection_id = $1 ORDER BY added_at',
        [collectionId]
      );

      return NextResponse.json({ collection, items });
    }

    if (publicOnly) {
      // Get public collections (discover)
      const collections = await query(
        `SELECT c.*, u.username, u.avatar_color,
                (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) as item_count,
                (SELECT COUNT(*) FROM collection_follows WHERE collection_id = c.id) as follower_count
         FROM collections c JOIN users u ON c.user_id = u.id
         WHERE c.is_public = true
         ORDER BY c.updated_at DESC LIMIT 30`
      );
      return NextResponse.json({ collections });
    }

    if (userId) {
      const collections = await query(
        `SELECT c.*, u.username,
                (SELECT COUNT(*) FROM collection_items WHERE collection_id = c.id) as item_count
         FROM collections c JOIN users u ON c.user_id = u.id
         WHERE c.user_id = $1 ORDER BY c.updated_at DESC`,
        [userId]
      );
      return NextResponse.json({ collections });
    }

    return NextResponse.json({ collections: [] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { title, description, is_public = true } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: 'Título requerido' }, { status: 400 });

  try {
    const [collection] = await query(
      `INSERT INTO collections (user_id, title, description, is_public)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [session.sub, title.trim(), description || null, is_public]
    );
    return NextResponse.json({ collection }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id, title, description, is_public } = await req.json();
  try {
    await query(
      `UPDATE collections SET title = $1, description = $2, is_public = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5`,
      [title, description, is_public, id, session.sub]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { id } = await req.json();
  try {
    await query('DELETE FROM collections WHERE id = $1 AND user_id = $2', [id, session.sub]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
