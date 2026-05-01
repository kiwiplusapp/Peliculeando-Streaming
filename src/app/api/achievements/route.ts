import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { query } from '@/lib/db';
import { ACHIEVEMENTS } from '@/lib/xp';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = Number(session.sub);
  const rows = await query<{ achievement_id: string; unlocked_at: string }>(
    `SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = $1 ORDER BY unlocked_at DESC`,
    [userId],
  );

  const unlockedMap = new Map(rows.map(r => [r.achievement_id, r.unlocked_at]));

  const result = ACHIEVEMENTS.map(ach => ({
    ...ach,
    check: undefined, // don't send server function to client
    unlocked: unlockedMap.has(ach.id),
    unlockedAt: unlockedMap.get(ach.id) ?? null,
  }));

  return NextResponse.json(result);
}
