import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/adminAuth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const isAdmin = await getAdminSessionFromRequest(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('q') || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = 20;
  const offset = (page - 1) * limit;

  const whereClause = search
    ? `WHERE u.username ILIKE $3 OR u.email ILIKE $3`
    : '';

  const params: unknown[] = search
    ? [limit, offset, `%${search}%`]
    : [limit, offset];

  const users = await query<{
    id: number; username: string; email: string;
    xp_total: number; level: number; created_at: string;
    review_count: string; subscription_active: boolean;
  }>(
    `SELECT u.id, u.username, u.email, u.xp_total, u.level, u.created_at,
       (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) AS review_count,
       EXISTS(
         SELECT 1 FROM subscriptions s
         WHERE s.user_id = u.id AND s.status = 'active' AND s.expires_at > NOW()
       ) AS subscription_active
     FROM users u
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT $1 OFFSET $2`,
    params
  );

  const [countRow] = await query<{ count: string }>(
    `SELECT COUNT(*) FROM users u ${whereClause}`,
    search ? [`%${search}%`] : []
  );

  return NextResponse.json({
    users,
    total: Number(countRow?.count ?? 0),
    page,
    pages: Math.ceil(Number(countRow?.count ?? 0) / limit),
  });
}

// Grant / revoke subscription
export async function PATCH(req: NextRequest) {
  const isAdmin = await getAdminSessionFromRequest(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId, action } = await req.json().catch(() => ({}));
  if (!userId || !action) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  if (action === 'grant_subscription') {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
    await query(
      `INSERT INTO subscriptions (user_id, status, expires_at)
       VALUES ($1, 'active', $2)
       ON CONFLICT (user_id) DO UPDATE SET status = 'active', expires_at = $2`,
      [userId, expiresAt]
    );
  } else if (action === 'revoke_subscription') {
    await query(
      `UPDATE subscriptions SET status = 'inactive' WHERE user_id = $1`,
      [userId]
    );
  } else if (action === 'delete') {
    await query('DELETE FROM users WHERE id = $1', [userId]);
  }

  return NextResponse.json({ ok: true });
}
