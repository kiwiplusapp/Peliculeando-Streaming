import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const isAdmin = await getAdminSessionFromRequest(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = 20;
  const offset = (page - 1) * limit;

  const reviews = await query<{
    id: number; content: string; rating: number; has_spoilers: boolean;
    movie_title: string; movie_poster: string; media_type: string;
    username: string; user_id: number; created_at: string;
    helpful: string; unhelpful: string;
  }>(
    `SELECT r.id, r.content, r.rating, r.has_spoilers, r.movie_title, r.movie_poster, r.media_type,
       u.username, u.id AS user_id, r.created_at,
       (SELECT COUNT(*) FROM review_votes WHERE review_id = r.id AND is_helpful = true) AS helpful,
       (SELECT COUNT(*) FROM review_votes WHERE review_id = r.id AND is_helpful = false) AS unhelpful
     FROM reviews r JOIN users u ON u.id = r.user_id
     ORDER BY r.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const [countRow] = await query<{ count: string }>('SELECT COUNT(*) FROM reviews');

  return NextResponse.json({
    reviews,
    total: Number(countRow?.count ?? 0),
    page,
    pages: Math.ceil(Number(countRow?.count ?? 0) / limit),
  });
}

export async function DELETE(req: NextRequest) {
  const isAdmin = await getAdminSessionFromRequest(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  await query('DELETE FROM reviews WHERE id = $1', [id]);
  return NextResponse.json({ ok: true });
}
