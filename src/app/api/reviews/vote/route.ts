import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { review_id, is_helpful } = await req.json();
  if (!review_id) return NextResponse.json({ error: 'review_id requerido' }, { status: 400 });

  try {
    await query(
      `INSERT INTO review_votes (review_id, user_id, is_helpful)
       VALUES ($1, $2, $3)
       ON CONFLICT (review_id, user_id) DO UPDATE SET is_helpful = $3`,
      [review_id, session.sub, is_helpful !== false]
    );
    const [counts] = await query<{ helpful: number; total: number }>(
      `SELECT
         COUNT(*) FILTER (WHERE is_helpful) AS helpful,
         COUNT(*) AS total
       FROM review_votes WHERE review_id = $1`,
      [review_id]
    );
    return NextResponse.json({ ok: true, helpful: Number(counts.helpful), total: Number(counts.total) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const review_id = searchParams.get('review_id');

  try {
    await query(
      'DELETE FROM review_votes WHERE review_id = $1 AND user_id = $2',
      [review_id, session.sub]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
