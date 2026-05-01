import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { user_id } = await req.json();
  if (!user_id || String(user_id) === session.sub) {
    return NextResponse.json({ error: 'Inválido' }, { status: 400 });
  }

  try {
    await query(
      `INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [session.sub, user_id]
    );
    return NextResponse.json({ ok: true, following: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const user_id = searchParams.get('user_id');

  try {
    await query(
      'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [session.sub, user_id]
    );
    return NextResponse.json({ ok: true, following: false });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const user_id = searchParams.get('user_id');

  try {
    const followers = await query(
      `SELECT u.id, u.username, u.avatar_color,
              COUNT(DISTINCT r.id) AS review_count
       FROM user_follows uf
       JOIN users u ON u.id = uf.following_id
       LEFT JOIN reviews r ON r.user_id = u.id
       WHERE uf.follower_id = $1
       GROUP BY u.id, u.username, u.avatar_color`,
      [user_id]
    );
    return NextResponse.json({ following: followers });
  } catch {
    return NextResponse.json({ following: [] });
  }
}
