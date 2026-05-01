import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ active: false });

  const rows = await query<{ status: string; expires_at: string }>(
    `SELECT status, expires_at FROM subscriptions
     WHERE user_id = $1 AND status = 'active' AND expires_at > NOW()`,
    [session.sub]
  );
  return NextResponse.json({ active: rows.length > 0, expires_at: rows[0]?.expires_at });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { months = 1 } = await req.json().catch(() => ({}));
  const safeMonths = Math.min(Math.max(Number(months) || 1, 1), 12);

  await query(
    `INSERT INTO subscriptions (user_id, status, expires_at)
     VALUES ($1, 'active', NOW() + ($2 || ' months')::INTERVAL)
     ON CONFLICT (user_id) DO UPDATE
       SET status = 'active',
           expires_at = GREATEST(subscriptions.expires_at, NOW()) + ($2 || ' months')::INTERVAL`,
    [session.sub, safeMonths]
  );

  return NextResponse.json({ ok: true });
}
